// Characters and effects of the style as lit flat cards in the 3D world (topic-independent part of the bridge cast).
// - Characters: yaw-only billboards drawn by toon.ts (bean heads, stick limbs, plum outline), lit by cardShade()
//   from the scene's light (tint, side gradient toward the sun, painted crescent), blinking every 0.5-2.3 s, with a
//   tight contact shadow under the feet (+ a soft tail away from the sun by day). Front view when they face the
//   camera, side view (mirrored as needed) when they walk across it.
// - Effects: unlit 2D cards (notes, bursts, splashes, stars, rings, puffs, clouds...) facing the camera or lying flat.
// Cards, effects and blobs live on the NOINK layer: the world ink pass never outlines them (they carry their own ink).
// The pool keeps one canvas per distinct drawing, so identical characters share textures.
import * as THREE from "three";
import { Pen, bodyFront, bodySide, fxShadow, fxContact, Outfit, Expr, FrontOpts, SideOpts, Prop } from "./toon";
import { NOINK } from "./ink";
import { cardShade, blobMaterial, CARD_K } from "./cardshade";
import type { LightName } from "./lights";
import { FPS, V3, clamp01 } from "./camera";

// ---------------- canvas pool ----------------
type Entry = { cv: HTMLCanvasElement; tex: THREE.CanvasTexture; w: number; h: number };
export type Req = { key: string; w: number; h: number; k: number; draw: (p: Pen) => void; tex?: THREE.CanvasTexture };
const makeEntry = (w: number, h: number): Entry => {
  const cv = document.createElement("canvas");
  cv.width = w; cv.height = h;
  const tex = new THREE.CanvasTexture(cv);
  tex.colorSpace = THREE.SRGBColorSpace; tex.anisotropy = 8;
  return { cv, tex, w, h };
};
export class Pool {
  private live = new Map<string, Entry>();
  private free: Entry[] = [];
  private reqs: Req[] = [];
  req(key: string, w: number, h: number, k: number, draw: (p: Pen) => void) {
    const r: Req = { key: `${w}x${h}|${key}`, w, h, k, draw };
    this.reqs.push(r);
    return r;
  }
  flush() {
    const want = new Map<string, Req[]>();
    for (const r of this.reqs) { const l = want.get(r.key); if (l) l.push(r); else want.set(r.key, [r]); }
    for (const [key, e] of this.live) if (!want.has(key)) { this.live.delete(key); this.free.push(e); }
    for (const [key, rs] of want) {
      let e = this.live.get(key);
      if (!e) {
        const r = rs[0], i = this.free.findIndex((x) => x.w === r.w && x.h === r.h);
        e = i >= 0 ? this.free.splice(i, 1)[0] : makeEntry(r.w, r.h);
        const g = e.cv.getContext("2d")!;
        g.setTransform(1, 0, 0, 1, 0, 0); g.clearRect(0, 0, e.w, e.h); g.setTransform(r.k, 0, 0, r.k, 0, 0);
        r.draw(new Pen(g));
        e.tex.needsUpdate = true;
        this.live.set(key, e);
      }
      for (const r of rs) r.tex = e.tex;
    }
    this.reqs = [];
  }
}

// ---------------- sprite meshes ----------------
const blank = (() => { const c = document.createElement("canvas"); c.width = c.height = 2; return new THREE.CanvasTexture(c); })();
export const SU = 0.00216; // metres per design unit: 1000 units = 2.16 m
export const SU_SWING = 2.3 / 1830; // swing canvas: rope of 1830 units = 2.3 m
const BODY = (() => { const g = new THREE.PlaneGeometry(600 * SU, 1000 * SU); g.translate(0, (975 - 500) * SU, 0); return g; })();
const CARD = new THREE.PlaneGeometry(1, 1);
/** world roots that hold actors (to find the scene's sun when world.ts does not pass it) */
const ROOTS = new Set<THREE.Object3D>();

/** lit flat character: cardShade() material, receives shadows (dims to the bright floor only), casts its silhouette
 *  when world.ts says so (golden). Drawn after the contact blobs (renderOrder 1). */
export class Actor {
  mesh: THREE.Mesh; mat: THREE.MeshLambertMaterial; dmat: THREE.MeshDepthMaterial; r: Req | null = null;
  constructor(parent: THREE.Object3D, geo: THREE.BufferGeometry = BODY) {
    this.mat = cardShade(new THREE.MeshLambertMaterial({ map: blank, alphaTest: 0.5, side: THREE.DoubleSide }));
    this.mat.alphaToCoverage = false; // A2C + MSAA left 1 px sky-depth seams on blurred far cards (POST)
    this.dmat = new THREE.MeshDepthMaterial({ depthPacking: THREE.RGBADepthPacking, map: blank, alphaTest: 0.5, side: THREE.DoubleSide });
    this.mesh = new THREE.Mesh(geo, this.mat);
    this.mesh.customDepthMaterial = this.dmat;
    // rim width is in output pixels: tell the card shader the render height (1920 = 1080 x 1920 frame)
    this.mesh.onBeforeRender = (r) => { const rt = r.getRenderTarget(); CARD_K.uPx.value = (rt ? rt.height : r.domElement.height) / 1920; };
    this.mesh.castShadow = false; this.mesh.receiveShadow = true; this.mesh.visible = false;
    this.mesh.rotation.order = "YXZ"; this.mesh.renderOrder = 1; this.mesh.layers.set(NOINK);
    parent.add(this.mesh);
    ROOTS.add(parent);
  }
  bind() { const t = this.r?.tex; if (t) { this.mat.map = t; this.dmat.map = t; } }
}
/** unlit effect card: hard cut-out (ink drawings), soft see-through (dust, mist) or a multiply ground blob */
export class Fx {
  mesh: THREE.Mesh; mat: THREE.MeshBasicMaterial; soft: THREE.MeshBasicMaterial; blob: THREE.MeshBasicMaterial; r: Req | null = null;
  constructor(parent: THREE.Object3D) {
    this.mat = new THREE.MeshBasicMaterial({ map: blank, alphaTest: 0.5, side: THREE.DoubleSide });
    this.mat.alphaToCoverage = false; // A2C + MSAA left 1 px sky-depth seams on blurred far cards (POST)
    this.soft = new THREE.MeshBasicMaterial({ map: blank, transparent: true, depthWrite: false, side: THREE.DoubleSide });
    this.blob = blobMaterial(blank);
    this.mesh = new THREE.Mesh(CARD, this.mat);
    this.mesh.visible = false; this.mesh.layers.set(NOINK);
    parent.add(this.mesh);
  }
  use(soft: boolean) { this.mesh.material = soft ? this.soft : this.mat; }
  bind() {
    const t = this.r?.tex;
    if (!t) return;
    if (this.r!.key.includes("|blob|")) {
      // no mipmaps: at grazing views the mip chain averages the blob with its white surround and it fades out
      if (t.generateMipmaps) { t.generateMipmaps = false; t.minFilter = THREE.LinearFilter; t.needsUpdate = true; }
      this.blob.map = t; this.mesh.material = this.blob; this.mesh.renderOrder = 0.5;
    }
    else { this.mat.map = t; this.soft.map = t; this.mesh.renderOrder = 0; }
  }
}


// ---------------- placements ----------------
export type Place = {
  key: string; draw: (p: Pen) => void; x: number; y: number; z: number;
  scale?: number; mirror?: boolean; yaw?: number; roll?: number; size?: [number, number, number];
};
/** an effect card: canvas cw x ch drawn by draw(), shown w x h metres at (x, y, z); flat = lying on the ground */
export type FxPlace = { key: string; cw: number; ch: number; draw: (p: Pen) => void; x: number; y: number; z: number; w: number; h: number; flat?: boolean; rot?: number; soft?: boolean };
export type Cast = { places: Place[]; fx: FxPlace[] };
/** camera info for drawing: position, screen-right vector, direction TOWARD the sun */
export type CamInfo = { pos: THREE.Vector3; right: THREE.Vector3; sun: THREE.Vector3; light: LightName };

export const hh = (i: number, s = 0) => { const v = Math.sin(i * 127.1 + s * 311.7) * 43758.5453; return v - Math.floor(v); };
export const q = (v: number, n = 120) => Math.round(v * n) / n;
const tmp = new THREE.Vector3();
/** drawing resolution by distance: [canvas w, h, scale from the 600 x 1000 design]; sized for the 1440 x 2560 final */
const tier = (d: number): [number, number, number] =>
  d < 3.2 ? [1800, 3000, 3.0] : d < 6.5 ? [1080, 1800, 1.8] : d < 16 ? [480, 800, 0.8] : [240, 400, 0.4];
/** canvas angle the sun comes FROM on an upright card facing the camera, in 45-degree steps (small texture cache) */
const light2D = (cam: CamInfo, mirror: boolean) => {
  const sx = cam.sun.dot(cam.right) * (mirror ? -1 : 1), sy = -cam.sun.y;
  return Math.round(Math.atan2(sy, sx) / (Math.PI / 4)) * (Math.PI / 4);
};
/** front / side view and mirroring for someone at (x, z) moving along (dx, dz); fs = foreshortening of the walk */
const viewOf = (cam: CamInfo, x: number, z: number, dx: number, dz: number) => {
  const tx = cam.pos.x - x, tz = cam.pos.z - z, tl = Math.hypot(tx, tz) || 1, dl = Math.hypot(dx, dz) || 1;
  const c = (tx * dx + tz * dz) / tl / dl;
  return { side: c < 0.57, mirror: dx * cam.right.x + dz * cam.right.z < 0, fs: Math.round(Math.sqrt(Math.max(0, 1 - c * c)) * 20) / 20 };
};

// ---------------- life: blinks ----------------
/** reactions land 0-3 frames BEFORE their word: subtract LEAD from word times */
export const LEAD = 2 / FPS;
const LID = [0.5, 1, 1, 0.5];
/** eyelid 0 open .. 1 shut: 4-frame blinks every 0.5-2.3 s, plus one across every expression swap (hides the swap) */
export const lidAt = (t: number, i: number, swaps: number[] = []) => {
  const f = Math.round(t * FPS);
  for (const ts of swaps) { const k = f - Math.round((ts - LEAD) * FPS) + 1; if (k >= 0 && k < 4) return LID[k]; }
  let s = Math.round(-60 * hh(i, 9));
  for (let n = 0; s <= f && n < 400; n++) {
    const k = f - s;
    if (k >= 0 && k < 4) return LID[k];
    s += Math.round(15 + 54 * hh(i * 31 + n, 13));
  }
  return 0;
};
const fkey = (o: object) => JSON.stringify(o, (_k, v) => (typeof v === "number" ? q(v) : v));

// ---------------- shadows under characters ----------------
const CONTACT: Record<LightName, [number, number, number]> = { day: [0.2, 0.21, 0.33], golden: [0.24, 0.2, 0.33], night: [0.18, 0.19, 0.34] };
const TAIL: [number, number, number] = [0.42, 0.44, 0.62];
const toSrgb = (v: number) => { const c = clamp01(v); return c <= 0.0031308 ? 12.92 * c : 1.055 * c ** (1 / 2.4) - 0.055; };
const hexOf = (c: [number, number, number], k: number) => "#" + c.map((v) => Math.round(255 * toSrgb(1 - (1 - v) * k)).toString(16).padStart(2, "0")).join("");
/** a tight contact pool under the feet (nobody floats) + by day a soft tail away from the sun */
export const groundShadow = (cam: CamInfo, out: Cast, x: number, y: number, z: number, sc = 1, k = 1) => {
  const S = cam.sun, hl = Math.hypot(S.x, S.z) || 1, ox = -S.x / hl, oz = -S.z / hl, rot = Math.atan2(-ox, -oz);
  if (cam.light === "day") {
    const el = Math.asin(Math.min(0.99, Math.max(0.1, S.y)));
    const len = Math.min(2.4, Math.max(0.5, 1.6 / Math.tan(el))) * sc, h = len + 0.55 * sc, c = 0.3 * h;
    const tc = hexOf(TAIL, k);
    out.fx.push({ key: `blob|shadow|${tc}`, cw: 128, ch: 256, draw: (p) => fxShadow(p, tc), x: x + ox * c, y: y + 0.018, z: z + oz * c, w: 0.72 * sc, h, flat: true, rot });
  }
  const cc = hexOf(CONTACT[cam.light], k);
  out.fx.push({ key: `blob|contact|${cc}`, cw: 128, ch: 128, draw: (p) => fxContact(p, cc), x: x + ox * 0.03 * sc, y: y + 0.022, z: z + oz * 0.03 * sc, w: 0.52 * sc, h: 0.4 * sc, flat: true, rot });
};

// ---------------- the character API used by video scripts ----------------
export type Mode = "stand" | "walk" | "march" | "sit" | "fall";
/** one character at time t (all fields resolved for this moment) */
export type Person = {
  /** stable number per character: head shape, blink rhythm */
  id: number;
  outfit: Outfit;
  /** feet position (x, ground y, z) in metres */
  at: V3;
  mode?: Mode;
  expr?: Expr;
  /** walking direction (x, z) for walk/march: picks front/side view; speed in m/s (default 1.4 walk, 1.6 march) */
  dir?: [number, number]; speed?: number;
  /** eye direction -1..1 (front view), head tilt / body tilt in degrees, wave 0..1 (raised hand), held prop */
  look?: number; headTilt?: number; tilt?: number; wave?: number; prop?: Prop;
  /** force the drawing: "front" (default when standing), "side" (profile), facing -1/1 turns a front view 3/4 */
  view?: "auto" | "front" | "side"; facing?: -1 | 0 | 1; mirror?: boolean;
  /** size multiplier (kids are drawn smaller by their build already) */
  scale?: number;
  /** times (s) of expression swaps: a blink covers each swap */
  swaps?: number[];
  /** no ground shadow (flying, in water...) */
  noShadow?: boolean;
};

/** add a character to the frame */
export const person = (cam: CamInfo, t: number, out: Cast, P: Person) => {
  const [x, y, z] = P.at, sc = P.scale ?? 1, mode = P.mode ?? "stand";
  const moving = mode === "walk" || mode === "march";
  const speed = P.speed ?? (mode === "march" ? 1.6 : 1.4);
  const dir = P.dir ?? [0, -1];
  const v = viewOf(cam, x, z, dir[0], dir[1]);
  const side = P.view === "side" ? true : P.view === "front" ? false : moving && v.side;
  const mirror = P.mirror ?? (side && v.mirror);
  // a walk cycle = 2 steps of 0.8 m: phase advances speed / 1.6 cycles per second (feet stay planted)
  const phase = moving ? ((t * speed) / 1.6) % 1 : 0;
  const blink = lidAt(t, P.id, P.swaps);
  const d = cam.pos.distanceTo(tmp.set(x, y + 1.2, z)) / sc;
  const [w, h, k] = tier(d);
  const light = light2D(cam, mirror), seed = ((P.id * 5 + 3) % 7) + 1;
  const fo: FrontOpts = { phase, expr: P.expr ?? "neutral", mode: mode === "walk" ? "stroll" : mode, look: P.look ?? 0, blink,
    prop: P.prop ?? null, tilt: P.tilt ?? 0, headTilt: P.headTilt ?? 0, wave: P.wave, light, facing: P.facing ?? 0, seed };
  const so: SideOpts = { phase, expr: P.expr ?? "neutral", mode: moving ? "march" : "stand", blink, stride: v.fs * (speed / 1.6), light, seed };
  const okey = fkey(P.outfit);
  const key = side ? `S|${okey}|${fkey(so)}` : `F|${okey}|${fkey(fo)}`;
  out.places.push({ key, x, y, z, scale: sc, mirror, size: [w, h, k], draw: (p) => (side ? bodySide(p, P.outfit, so) : bodyFront(p, P.outfit, fo)) });
  if (!P.noShadow && mode !== "fall") groundShadow(cam, out, x, y, z, sc);
};

/** walk helper: position along a path of points (metres) at constant speed starting at t0; returns at + dir */
export const walkPath = (pts: V3[], t: number, t0: number, speed = 1.4): { at: V3; dir: [number, number]; moving: boolean } => {
  let s = Math.max(0, t - t0) * speed;
  for (let i = 1; i < pts.length; i++) {
    const a = pts[i - 1], b = pts[i], L = Math.hypot(b[0] - a[0], b[2] - a[2]);
    const dir: [number, number] = [(b[0] - a[0]) / (L || 1), (b[2] - a[2]) / (L || 1)];
    if (s <= L) { const u = s / (L || 1); return { at: [a[0] + (b[0] - a[0]) * u, a[1] + (b[1] - a[1]) * u, a[2] + (b[2] - a[2]) * u], dir, moving: t >= t0 }; }
    s -= L;
    if (i === pts.length - 1) return { at: b, dir, moving: false };
  }
  return { at: pts[0], dir: [0, -1], moving: false };
};

/** add an effect card (see toon.ts fx*): e.g. fx(out, "burst", 512, 512, (p) => fxBurst(p, u), [x, y, z], 2, 2) */
export const fx = (out: Cast, key: string, cw: number, ch: number, draw: (p: Pen) => void, at: V3, w: number, h: number, more: Partial<FxPlace> = {}) =>
  out.fx.push({ key, cw, ch, draw, x: at[0], y: at[1], z: at[2], w, h, ...more });
