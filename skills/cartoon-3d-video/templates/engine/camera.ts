// Camera grammar of the style (measured from the reference, reports/motion.md), topic-independent:
// - every move is a symmetric smootherstep GLIDE of 18-40 frames (peak ~15-25 px/f at 720p);
// - a reframe bigger than ~half a frame width or ~40 % zoom is a hard CUT on its key frame;
// - every hold PUSHES IN (dolly toward the look point or a fov zoom): 0.15-0.35 %/f, ~0.6 %/f for ~35 f on punch words;
// - ROLLS of 4-5 deg over >= 18 f on emphasis beats;
// - impacts are KICKS: the image offset flips sign every frame and decays to 0 in 7 frames. No hand-held float.
export type V3 = [number, number, number];
export type Cam = { pos: V3; look: V3; fov: number; roll: number };
export type Shot = Partial<Cam> & { pos: V3; look: V3 };
/** camera key: from frame f, glide (dur frames) or cut to framing s(f) */
export type Key = { f: number; dur?: number; cut?: boolean; s: (f: number) => Shot };

export const FPS = 30;
export const clamp01 = (x: number) => Math.max(0, Math.min(1, x));
export const smooth = (x: number) => { const u = clamp01(x); return u * u * (3 - 2 * u); };
export const easeOut = (u: number) => 1 - (1 - clamp01(u)) ** 4;
/** the reference camera ease: symmetric smootherstep */
export const glide = (u: number) => { const x = clamp01(u); return x * x * x * (x * (6 * x - 15) + 10); };
/** piecewise-linear table lookup: lin([[x0,y0],[x1,y1],...], x) */
export const lin = (pts: [number, number][], x: number) => {
  if (x <= pts[0][0]) return pts[0][1];
  for (let i = 1; i < pts.length; i++) if (x <= pts[i][0]) {
    const [x0, y0] = pts[i - 1], [x1, y1] = pts[i];
    return y0 + ((y1 - y0) * (x - x0)) / (x1 - x0);
  }
  return pts[pts.length - 1][1];
};

const mixCam = (a: Cam, b: Cam, k: number): Cam => ({
  pos: a.pos.map((v, i) => v + (b.pos[i] - v) * k) as V3, look: a.look.map((v, i) => v + (b.look[i] - v) * k) as V3,
  fov: a.fov + (b.fov - a.fov) * k, roll: a.roll + (b.roll - a.roll) * k,
});
const full = (c: Shot): Cam => ({ fov: 40, roll: 0, ...c });
/** evaluate a key list at frame f (glides are blended from the previous result, cuts replace it) */
export const runKeys = (keys: Key[], f: number): Cam => {
  let cur = full(keys[0].s(f));
  for (let i = 1; i < keys.length; i++) {
    const k = keys[i];
    if (f < k.f) break;
    cur = k.cut ? full(k.s(f)) : mixCam(cur, full(k.s(f)), glide((f - k.f) / (k.dur ?? 24)));
  }
  return cur;
};

/** push-in factor since f0: the subject grows ~rate per frame; `punch` raises it (8 f soft edges) for the first n frames */
export const pushK = (f: number, f0: number, rate = 0.0025, punch = 0, n = 35) => {
  const x = Math.max(0, f - f0);
  let s = rate * x;
  if (punch > rate) for (let i = 0; i < Math.min(x, n); i++) s += (punch - rate) * Math.max(0, Math.min(1, (i + 0.5) / 8, (n - i - 0.5) / 8));
  return Math.exp(-s);
};
/** dolly push: the camera slides toward the look point by factor k (use with pushK) */
export const dolly = (pos: V3, look: V3, k: number, rest: Partial<Cam> = {}): Shot =>
  ({ pos: [look[0] + (pos[0] - look[0]) * k, look[1] + (pos[1] - look[1]) * k, look[2] + (pos[2] - look[2]) * k], look, ...rest });
/** zoom push: the camera stays put (lens next to a wall), tan(fov/2) shrinks by k */
export const zoom = (pos: V3, look: V3, fov: number, k: number, rest: Partial<Cam> = {}): Shot =>
  ({ pos, look, fov: (360 / Math.PI) * Math.atan(Math.tan((fov * Math.PI) / 360) * k), ...rest });
/** the same framing with a different roll (radians; 0.035-0.08 = 2-4.6 deg) */
export const rolled = (s: (f: number) => Shot, roll: number) => (f: number): Shot => ({ ...s(f), roll });
/** standard "hold": framing (pos, look) that pushes in from frame f0 at the default creep */
export const hold = (pos: V3, look: V3, f0: number, rest: Partial<Cam> & { rate?: number; punch?: number } = {}) => {
  const { rate = 0.0025, punch = 0, ...cam } = rest;
  return (f: number): Shot => dolly(pos, look, pushK(f, f0, rate, punch), cam);
};

/** impact kick: [time in s, strength 0.5-1.6]; returns the signed offset (flips every frame, gone after 7 frames) */
export const kickAt = (kicks: [number, number][], t: number) => {
  let a = 0;
  for (const [t0, g] of kicks) {
    const n = Math.floor((t - t0) * FPS + 1e-6);
    if (n >= 0 && n < 7) a += g * (n % 2 ? -1 : 1) * (1 - n / 7) ** 1.5;
  }
  return a;
};
/** apply a kick to a camera (~3 px at 720p per unit, roll +-0.23 deg per unit) */
export const withKick = (c: Cam, a: number): Cam => {
  if (!a) return c;
  const d: V3 = [c.look[0] - c.pos[0], c.look[1] - c.pos[1], c.look[2] - c.pos[2]];
  const L = Math.hypot(...d), h = Math.hypot(d[0], d[2]) || 1;
  const m = (3 / 640) * Math.tan((c.fov * Math.PI) / 360) * L * a;
  return { ...c, look: [c.look[0] - (d[2] / h) * m, c.look[1] + 0.6 * m, c.look[2] + (d[0] / h) * m], roll: c.roll + a * 0.004 };
};
