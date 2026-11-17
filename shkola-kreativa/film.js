// «Школа креатива» — 10 s cel / frame-by-frame / line-boil film.
// Every frame is a pure function of the integer frame number f (0..239). Seeded randomness only.
(function (root) {
'use strict';
const W = 1920, H = 1080;
const C = root.CUES;
const COL = {
  paper: '#F3E8D4', paperHi: '#FCF7EE', shade: '#E4D4B9',
  ink: '#1C1830', blue: '#3346E8', blueDk: '#2231B8', tang: '#FF5A2E', pink: '#FF9BC2',
  guide: 'rgba(51,70,232,0.20)',
};

// ---------- deterministic helpers ----------
function hash(n) { const s = Math.sin(n * 12.9898 + 78.233) * 43758.5453; return s - Math.floor(s); }
function hash2(a, b) { return hash(a * 157.31 + b * 311.7); }
function noise1(x, seed) {
  const i = Math.floor(x), fr = x - i, u = fr * fr * (3 - 2 * fr);
  const a = hash(i + seed * 1013.17), b = hash(i + 1 + seed * 1013.17);
  return a + (b - a) * u;
}
const clamp = (x, a = 0, b = 1) => Math.max(a, Math.min(b, x));
const lerp = (a, b, t) => a + (b - a) * t;
const rmp = (x, a, b) => clamp((x - a) / (b - a));
const eOutC = t => 1 - Math.pow(1 - t, 3);
const eInC = t => t * t * t;
const eIO = t => t < .5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
const eOutBack = (t, s = 1.9) => 1 + (s + 1) * Math.pow(t - 1, 3) + s * Math.pow(t - 1, 2);
const on = (f, n) => Math.floor(f / n) * n;

// boil variant: 3 drawings, swapped every 2 frames (every 3 frames in the final hold)
function boilKey(f) { return f < C.holdFrom ? Math.floor(f / 2) : Math.floor(C.holdFrom / 2) + Math.floor((f - C.holdFrom) / 3); }
let V = 0; // current variant (0..2), set per frame

// ---------- geometry ----------
function resample(pts, step) {
  const n = pts.length; const cum = [0];
  for (let i = 1; i < n; i++) cum.push(cum[i - 1] + Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]));
  const L = cum[n - 1]; const out = [], ss = [];
  if (L < 1e-3) return { p: [pts[0], pts[0]], s: [0, 0], L: 0 };
  const m = Math.max(2, Math.ceil(L / step)); let j = 1;
  for (let k = 0; k <= m; k++) {
    const s = L * k / m;
    while (j < n - 1 && cum[j] < s) j++;
    const seg = cum[j] - cum[j - 1] || 1, t = (s - cum[j - 1]) / seg;
    out.push([lerp(pts[j - 1][0], pts[j][0], t), lerp(pts[j - 1][1], pts[j][1], t)]); ss.push(s);
  }
  return { p: out, s: ss, L };
}
function catmull(P, seg = 12, closed = false) {
  if (P.length < 3 && !closed) return P.slice();
  const out = []; const n = P.length;
  const g = i => closed ? P[(i + n) % n] : P[clamp(i, 0, n - 1)];
  const last = closed ? n : n - 1;
  for (let i = 0; i < last; i++) {
    const p0 = g(i - 1), p1 = g(i), p2 = g(i + 1), p3 = g(i + 2);
    for (let k = 0; k < seg; k++) {
      const t = k / seg, t2 = t * t, t3 = t2 * t;
      out.push([0, 1].map(d => 0.5 * ((2 * p1[d]) + (-p0[d] + p2[d]) * t + (2 * p0[d] - 5 * p1[d] + 4 * p2[d] - p3[d]) * t2 + (-p0[d] + 3 * p1[d] - 3 * p2[d] + p3[d]) * t3)));
    }
  }
  out.push(closed ? P[0].slice() : P[n - 1].slice());
  return out;
}
function ellipsePts(cx, cy, rx, ry, a0 = 0, a1 = Math.PI * 2, n = 64) {
  const o = []; for (let i = 0; i <= n; i++) { const a = lerp(a0, a1, i / n); o.push([cx + rx * Math.cos(a), cy + ry * Math.sin(a)]); } return o;
}
function xf(pts, m) { return pts.map(([x, y]) => [m.x + (x * m.c - y * m.s) * m.k, m.y + (x * m.s + y * m.c) * m.k]); }
function M(x, y, rot = 0, k = 1) { return { x, y, c: Math.cos(rot), s: Math.sin(rot), k }; }

// boil displacement of a polyline (coherent wobble along arc length)
function boilPts(P, S, amp, seed, closed) {
  if (amp <= 0) return P;
  const n = P.length, out = new Array(n);
  const ox = amp * 0.7 * (hash2(seed, V * 3 + 1) * 2 - 1), oy = amp * 0.7 * (hash2(seed + 9, V * 3 + 2) * 2 - 1);
  for (let i = 0; i < n; i++) {
    const a = P[closed ? (i - 1 + n - 1) % (n - 1) : Math.max(0, i - 1)], b = P[closed ? (i + 1) % (n - 1) : Math.min(n - 1, i + 1)];
    let tx = b[0] - a[0], ty = b[1] - a[1]; const l = Math.hypot(tx, ty) || 1; tx /= l; ty /= l;
    const s = S[i];
    let d = amp * (2 * noise1(s / 75 + V * 17.3, seed) - 1) + amp * 0.45 * (2 * noise1(s / 21 + V * 5.1, seed + 7) - 1);
    out[i] = [P[i][0] - ty * d + ox, P[i][1] + tx * d + oy];
  }
  if (closed) out[n - 1] = out[0];
  return out;
}

const tap = x => 0.14 + 0.86 * Math.sin(Math.min(1, Math.max(0, x)) * Math.PI / 2);

// Variable-width brush: centreline + pressure -> outline polygon.
function brush(ctx, pts, o) {
  const w = o.w || 6, amp = o.amp == null ? 1.8 : o.amp, seed = o.seed || 1;
  const t0 = o.taper ? o.taper[0] : 0.12, t1 = o.taper ? o.taper[1] : 0.12;
  const r = resample(pts, o.step || 2.6);
  if (r.L < 0.5) return;
  let P = r.p, S = r.s;
  const reveal = o.reveal == null ? 1 : o.reveal;
  if (reveal <= 0) return;
  if (reveal < 1) {
    const Lr = r.L * reveal; let k = S.findIndex(s => s > Lr); if (k < 0) k = S.length;
    P = P.slice(0, Math.max(2, k)); S = S.slice(0, Math.max(2, k));
  }
  const closed = !!o.closed && reveal >= 1;
  P = boilPts(P, S, amp, seed, closed);
  const n = P.length, L = r.L, Lw = [], Rw = [];
  const cal = o.cal == null ? 0.35 : o.cal;
  for (let i = 0; i < n; i++) {
    const a = P[closed ? (i - 1 + n - 1) % (n - 1) : Math.max(0, i - 1)], b = P[closed ? (i + 1) % (n - 1) : Math.min(n - 1, i + 1)];
    let tx = b[0] - a[0], ty = b[1] - a[1]; const l = Math.hypot(tx, ty) || 1; tx /= l; ty /= l;
    const u = S[i] / L;
    let wi = w * (1 + 0.24 * (2 * noise1(S[i] / 38 + V * 9.7, seed + 3) - 1));
    if (!closed) wi *= (t0 > 0 ? tap(u / t0) : 1) * (t1 > 0 ? tap((1 - u) / t1) : 1);
    const ang = Math.atan2(ty, tx);
    wi *= 1 - cal + cal * (0.42 + 0.58 * Math.abs(Math.sin(ang + 0.75)));
    if (o.press) wi *= o.press(u);
    const h = wi / 2;
    Lw.push([P[i][0] - ty * h, P[i][1] + tx * h]); Rw.push([P[i][0] + ty * h, P[i][1] - tx * h]);
  }
  ctx.fillStyle = o.color || COL.ink;
  if (o.alpha != null) ctx.globalAlpha = o.alpha;
  ctx.beginPath();
  if (closed) {
    ctx.moveTo(Lw[0][0], Lw[0][1]); for (let i = 1; i < n; i++) ctx.lineTo(Lw[i][0], Lw[i][1]); ctx.closePath();
    ctx.moveTo(Rw[0][0], Rw[0][1]); for (let i = 1; i < n; i++) ctx.lineTo(Rw[i][0], Rw[i][1]); ctx.closePath();
    ctx.fill('evenodd');
  } else {
    ctx.moveTo(Lw[0][0], Lw[0][1]); for (let i = 1; i < n; i++) ctx.lineTo(Lw[i][0], Lw[i][1]);
    // end cap
    const pe = P[n - 1], re = Math.hypot(Lw[n - 1][0] - Rw[n - 1][0], Lw[n - 1][1] - Rw[n - 1][1]) / 2;
    const ae = Math.atan2(Lw[n - 1][1] - pe[1], Lw[n - 1][0] - pe[0]);
    for (let k = 1; k < 8; k++) { const a = ae - Math.PI * k / 8; ctx.lineTo(pe[0] + re * Math.cos(a), pe[1] + re * Math.sin(a)); }
    for (let i = n - 1; i >= 0; i--) ctx.lineTo(Rw[i][0], Rw[i][1]);
    const ps = P[0], rs = Math.hypot(Lw[0][0] - Rw[0][0], Lw[0][1] - Rw[0][1]) / 2;
    const as = Math.atan2(Rw[0][1] - ps[1], Rw[0][0] - ps[0]);
    for (let k = 1; k < 8; k++) { const a = as - Math.PI * k / 8; ctx.lineTo(ps[0] + rs * Math.cos(a), ps[1] + rs * Math.sin(a)); }
    ctx.closePath(); ctx.fill('nonzero');
  }
  ctx.globalAlpha = 1;
}

// Flat cel fill, slightly off-register (hand colouring), with its own boil.
function fillShape(ctx, pts, color, o = {}) {
  const r = resample(pts, 4); let P = boilPts(r.p, r.s, o.amp == null ? 1.6 : o.amp, (o.seed || 1) + 50, true);
  const dx = (o.dx == null ? 6 : o.dx) + (hash2(o.seed || 1, V + 40) - .5) * 2.4, dy = (o.dy == null ? -4 : o.dy) + (hash2(o.seed || 1, V + 80) - .5) * 2.4;
  ctx.fillStyle = color; if (o.alpha != null) ctx.globalAlpha = o.alpha;
  ctx.beginPath(); ctx.moveTo(P[0][0] + dx, P[0][1] + dy);
  for (let i = 1; i < P.length; i++) ctx.lineTo(P[i][0] + dx, P[i][1] + dy);
  ctx.closePath(); ctx.fill(); ctx.globalAlpha = 1;
}
function pathPoly(ctx, P) { ctx.moveTo(P[0][0], P[0][1]); for (let i = 1; i < P.length; i++) ctx.lineTo(P[i][0], P[i][1]); ctx.closePath(); }

// ---------- paper ----------
let PAPER = null;
function makePaper() {
  const c = document.createElement('canvas'); c.width = W; c.height = H; const g = c.getContext('2d');
  const img = g.createImageData(W, H), d = img.data;
  // fine grain + low-frequency mottling (value noise)
  const cell = 96, gw = Math.ceil(W / cell) + 2, gh = Math.ceil(H / cell) + 2, grid = [];
  for (let j = 0; j < gh; j++) for (let i = 0; i < gw; i++) grid.push(hash2(i + 11, j + 37));
  let s = 1234567;
  const rnd = () => { s ^= s << 13; s ^= s >>> 17; s ^= s << 5; return ((s >>> 0) % 100000) / 100000; };
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    const gx = x / cell, gy = y / cell, i = Math.floor(gx), j = Math.floor(gy), fx = gx - i, fy = gy - j;
    const ux = fx * fx * (3 - 2 * fx), uy = fy * fy * (3 - 2 * fy);
    const a = grid[j * gw + i], b = grid[j * gw + i + 1], c2 = grid[(j + 1) * gw + i], e = grid[(j + 1) * gw + i + 1];
    const m = lerp(lerp(a, b, ux), lerp(c2, e, ux), uy);
    const v = 255 - rnd() * 70 - m * 45;
    const k = (y * W + x) * 4; d[k] = v; d[k + 1] = v * 0.985; d[k + 2] = v * 0.95; d[k + 3] = 255;
  }
  g.putImageData(img, 0, 0);
  // fibres
  g.lineCap = 'round';
  for (let i = 0; i < 1400; i++) {
    const x = hash(i * 3.1) * W, y = hash(i * 7.7) * H, a = hash(i * 1.3) * Math.PI, l = 6 + hash(i * 5.9) * 26;
    g.strokeStyle = `rgba(90,70,40,${0.10 + hash(i * 2.2) * 0.18})`; g.lineWidth = 0.6 + hash(i * 9.1);
    g.beginPath(); g.moveTo(x, y); g.quadraticCurveTo(x + Math.cos(a) * l * .5 + 3, y + Math.sin(a) * l * .5 - 2, x + Math.cos(a) * l, y + Math.sin(a) * l); g.stroke();
  }
  // soft vignette (dithered by the grain above it in the multiply)
  const rg = g.createRadialGradient(W / 2, H / 2, H * 0.35, W / 2, H / 2, H * 1.05);
  rg.addColorStop(0, 'rgba(0,0,0,0)'); rg.addColorStop(1, 'rgba(60,40,20,0.55)');
  g.fillStyle = rg; g.fillRect(0, 0, W, H);
  return c;
}

// ---------- hand-lettered Cyrillic stroke font (cap height = 1, y down) ----------
const S = (p, smooth = false) => ({ p, smooth });
const ARC = (cx, cy, rx, ry, a0, a1) => ({ arc: [cx, cy, rx, ry, a0, a1] });
const D2R = Math.PI / 180;
const GLYPH = {
  'Ш': { w: .80, s: [S([[0, 0], [0, 1], [.8, 1], [.8, 0]]), S([[.4, .02], [.4, .98]])] },
  'К': { w: .62, s: [S([[0, 0], [0, 1]]), S([[.6, 0], [.33, .3], [.06, .54]], true), S([[.17, .43], [.42, .7], [.64, 1]], true)] },
  'О': { w: .78, s: [ARC(.39, .5, .39, .5, -100 * D2R, 275 * D2R)] },
  'Л': { w: .68, s: [S([[-.03, .98], [.1, .88], [.16, .5], [.2, 0]], true), S([[.2, 0], [.68, 0], [.68, 1]])] },
  'А': { w: .74, s: [S([[0, 1], [.37, 0], [.74, 1]]), S([[.16, .64], [.58, .62]])] },
  'Р': { w: .58, s: [S([[0, 1], [0, 0]]), S([[0, 0], [.3, 0], [.52, .08], [.57, .27], [.49, .45], [.28, .53], [0, .53]], true)] },
  'Е': { w: .55, s: [S([[.55, 0], [0, 0], [0, 1], [.57, 1]]), S([[0, .5], [.44, .5]])] },
  'Т': { w: .66, s: [S([[0, 0], [.66, 0]]), S([[.33, 0], [.33, 1]])] },
  'И': { w: .66, s: [S([[0, 0], [0, 1], [.66, 0], [.66, 1]])] },
  'В': { w: .6, s: [S([[0, 1], [0, 0]]), S([[0, 0], [.28, 0], [.48, .07], [.52, .24], [.42, .41], [.24, .47], [0, .47]], true), S([[.1, .47], [.34, .47], [.56, .56], [.61, .75], [.52, .93], [.3, 1], [0, 1]], true)] },
  'У': { w: .64, s: [S([[0, 0], [.33, .6]]), S([[.64, 0], [.4, .62], [.25, .9], [.06, 1]], true)] },
  'Ч': { w: .58, s: [S([[0, 0], [0, .28], [.09, .47], [.3, .54], [.58, .49]], true), S([[.58, 0], [.58, 1]])] },
  'М': { w: .82, s: [S([[0, 1], [.05, 0], [.41, .68], [.77, 0], [.82, 1]])] },
  'С': { w: .64, s: [ARC(.37, .5, .37, .5, -42 * D2R, -318 * D2R)] },
  'Ь': { w: .54, s: [S([[0, 0], [0, 1]]), S([[0, .44], [.3, .44], [.5, .53], [.55, .72], [.47, .92], [.27, 1], [0, 1]], true)] },
  'Н': { w: .62, s: [S([[0, 0], [0, 1]]), S([[.62, 0], [.62, 1]]), S([[0, .5], [.62, .5]])] },
  'Я': { w: .58, s: [S([[.58, 1], [.58, 0]]), S([[.58, 0], [.28, 0], [.06, .08], [.01, .27], [.09, .45], [.3, .53], [.58, .53]], true), S([[.3, .53], [0, 1]])] },
};
function glyphStrokes(ch) {
  const g = GLYPH[ch];
  return g.s.map(st => {
    if (st.arc) { const [cx, cy, rx, ry, a0, a1] = st.arc; return ellipsePts(cx, cy, rx, ry, a0, a1, 72); }
    if (st.smooth) return catmull(st.p, 14);
    const out = []; // straight polyline, densified so the boil can bend it
    for (let i = 0; i < st.p.length - 1; i++) for (let k = 0; k < 12; k++) out.push([lerp(st.p[i][0], st.p[i + 1][0], k / 12), lerp(st.p[i][1], st.p[i + 1][1], k / 12)]);
    out.push(st.p[st.p.length - 1]); return out;
  });
}
function layoutText(str, cx, baseline, capH, track, seed, wob = 1) {
  const chars = [...str]; let tot = 0;
  chars.forEach((ch, i) => { tot += (ch === ' ' ? .32 : GLYPH[ch].w) * capH + (i < chars.length - 1 ? track * capH : 0); });
  let x = cx - tot / 2; const out = [];
  chars.forEach((ch, i) => {
    if (ch === ' ') { x += .32 * capH + track * capH; return; }
    const g = GLYPH[ch], gw = g.w * capH;
    const rot = (hash2(seed, i) - .5) * 0.09 * wob, dy = (hash2(seed + 3, i) - .5) * 0.07 * capH * wob, k = 1 + (hash2(seed + 5, i) - .5) * 0.06 * wob;
    const m = M(x + gw / 2, baseline - capH / 2 + dy, rot, k);
    const strokes = glyphStrokes(ch).map(p => xf(p.map(([u, v]) => [u * capH - gw / 2, v * capH - capH / 2]), m));
    const lens = strokes.map(p => resample(p, 4).L); const total = lens.reduce((a, b) => a + b, 0);
    out.push({ ch, strokes, lens, total, cx: x + gw / 2, cy: baseline - capH / 2 + dy, gw, rot, start: strokes[0][0] });
    x += gw + track * capH;
  });
  return out;
}
function drawLetter(ctx, L, reveal, o) {
  let acc = 0;
  L.strokes.forEach((p, i) => {
    const a = acc / L.total, b = (acc + L.lens[i]) / L.total; acc += L.lens[i];
    const r = clamp((reveal - a) / (b - a)); if (r <= 0) return;
    brush(ctx, p, { w: o.w, color: o.color, seed: o.seed + i * 13, amp: o.amp, reveal: r, taper: [.08, .1], cal: .45, alpha: o.alpha });
  });
}

// ---------- layout of the end card ----------
let TITLE1, TITLE2, TAG, ALLLET;
const LY = { b1: 412, b2: 712, b3: 838 }; // baselines
function layout() {
  TITLE1 = layoutText('ШКОЛА', 960, LY.b1, 172, .17, 21, 1);
  TITLE2 = layoutText('КРЕАТИВА', 960, LY.b2, 238, .15, 37, 1);
  TAG = layoutText('УЧИМ РИСОВАТЬ С НУЛЯ', 940, LY.b3, 46, .24, 55, .5);
  ALLLET = TITLE1.concat(TITLE2);
}

// ---------- the pencil ----------
function drawPencil(ctx, tip, ang, sc, smear) {
  ctx.save();
  if (smear && smear.k > 1.02) { // smear: stretch the drawing along its velocity (one frame only)
    const d = smear.dir, a = smear.anchor, k = smear.k;
    // p' = a + (p-a) + (k-1)((p-a).d)d
    void 0;
    const m11 = 1 + (k - 1) * d[0] * d[0], m12 = (k - 1) * d[0] * d[1], m22 = 1 + (k - 1) * d[1] * d[1];
    ctx.transform(m11, m12, m12, m22, a[0] - (m11 * a[0] + m12 * a[1]), a[1] - (m12 * a[0] + m22 * a[1]));
  }
  ctx.translate(tip[0], tip[1]); ctx.rotate(ang); ctx.scale(sc, sc);
  const hw = 30, L0 = 26, L1 = 92, L2 = 470, L3 = 520, L4 = 572;
  const body = [[L1, -hw], [L2, -hw], [L2, hw], [L1, hw]];
  const cone = [[0, 0], [L1, -hw], [L1, hw]];
  const ferr = [[L2, -hw - 2], [L3, -hw - 2], [L3, hw + 2], [L2, hw + 2]];
  const eras = [[L3, -hw + 1], [L4 - 18, -hw + 1], [L4, -hw + 14], [L4, hw - 14], [L4 - 18, hw - 1], [L3, hw - 1]];
  const amp = 1.6 / sc;
  fillShape(ctx, cone, COL.paperHi, { seed: 301, dx: 0, dy: 0, amp });
  fillShape(ctx, [[0, 0], [L0, -L0 * hw / L1], [L0, L0 * hw / L1]], COL.ink, { seed: 302, dx: 0, dy: 0, amp: amp * .5 });
  fillShape(ctx, body, COL.tang, { seed: 303, dx: 5, dy: -4, amp });
  fillShape(ctx, [[L1 + 4, -9], [L2 - 4, -9], [L2 - 4, 4], [L1 + 4, 4]], '#FF8A63', { seed: 309, dx: 5, dy: -4, amp });
  fillShape(ctx, ferr, COL.blue, { seed: 304, dx: 4, dy: -3, amp });
  fillShape(ctx, eras, COL.pink, { seed: 305, dx: 5, dy: -3, amp });
  const lw = 6.5, o = (p, s, w = lw, cl = false) => brush(ctx, p, { w, seed: s, amp, closed: cl, taper: cl ? null : [.06, .06], cal: .3 });
  o(catmull([[0, 0], [L1, -hw], [L2, -hw], [L3 + 2, -hw - 2], [L4 - 18, -hw + 1], [L4, -hw + 14], [L4, hw - 14], [L4 - 18, hw - 1], [L3 + 2, hw + 2], [L2, hw], [L1, hw], [0, 0]], 6), 311, lw, false);
  o([[L1, -hw], [L1 + 8, -15], [L1, 0], [L1 + 8, 15], [L1, hw]], 312, 4.5);
  o([[L1 + 14, -9], [L2 - 10, -9]], 313, 3.2); o([[L1 + 14, 10], [L2 - 10, 10]], 314, 3.2);
  o([[L2, -hw - 2], [L2, hw + 2]], 315, 5); o([[L3, -hw - 2], [L3, hw + 2]], 316, 5);
  o([[L2 + 17, -hw], [L2 + 17, hw]], 317, 3); o([[L2 + 34, -hw], [L2 + 34, hw]], 318, 3);
  ctx.restore();
}
// smear: the one in-between drawing is stretched back along the path to cover prev -> current
const PEN_SC = 0.78;
function smearFor(tip, prev, ang, sc, thresh) {
  const v = [tip[0] - prev[0], tip[1] - prev[1]], sp = Math.hypot(v[0], v[1]);
  if (sp < thresh) return null;
  const d = [v[0] / sp, v[1] / sp], tail = [tip[0] + Math.cos(ang) * 572 * sc, tip[1] + Math.sin(ang) * 572 * sc];
  const pt = tip[0] * d[0] + tip[1] * d[1], pe = tail[0] * d[0] + tail[1] * d[1];
  const lead = pt >= pe ? tip : tail, ext = Math.max(70 * sc, Math.abs(pt - pe));
  return { dir: d, k: Math.min(4, 1 + sp / ext), anchor: lead };
}
// pencil keyframes on 1s (fast action), tip position + angle
const PEN_CIRCLE = { cx: 960, cy: 822 - 168 * 1.28, r: 128 * 1.28 };
function penCirclePt(u) { // u: 0..1 over the scribble
  const a = -55 * D2R - u * Math.PI * 2.12; // ~1.07 turns, counter-clockwise on screen
  const rr = PEN_CIRCLE.r * (1 + 0.035 * Math.sin(u * 9.0) + 0.05 * u);
  return [PEN_CIRCLE.cx + rr * Math.cos(a), PEN_CIRCLE.cy + rr * Math.sin(a)];
}
function penState(f) {
  const start = penCirclePt(0);
  if (f <= 4) {
    const keys = [[1360, 250], [1190, 360], [1125, 400], [1098, 418], start];
    return { tip: keys[f], ang: -0.72 - (4 - f) * 0.05, prev: f > 0 ? keys[f - 1] : [2300, -420] };
  }
  if (f <= 12) {
    const u = (f - 4) / 8, ue = eIO(u); const p = penCirclePt(ue), pp = penCirclePt(eIO((f - 5) / 8));
    return { tip: p, ang: -0.72 + 0.18 * Math.sin(ue * Math.PI * 2), prev: pp };
  }
  if (f <= 15) {
    const end = penCirclePt(1);
    const keys = [end, [1130, 300], [1650, -250], [2600, -1100]];
    return { tip: keys[f - 12], ang: -0.72 + (f - 12) * 0.25, prev: keys[Math.max(0, f - 13)] };
  }
  return null;
}
function scribbleLine(f) { // the line the pencil has drawn so far
  if (f < 4) return null; const u = eIO(clamp((f - 4) / 8));
  const pts = []; for (let i = 0; i <= 80; i++) pts.push(penCirclePt(u * i / 80)); return pts;
}

// ---------- the character «Клякса» ----------
const GROUND = 822, R0 = 128, LEG = 40, CS = 1.28; // CS: global character scale
function landSq(dt) { return 1 - 0.34 * Math.exp(-dt / 5) * Math.cos(dt * 0.55); }
function charState(f) {
  if (f < C.pop || f >= C.burst) return null;
  const st = { x: 960, hop: 0, sy: 1, scale: 1, lean: 0, tip: .55, bend: 0, eyes: 'open', mouth: 'smile', legs: 1, face: 1, arms: 1,
    aL: 200 * D2R, aR: -20 * D2R, cheek: 1, look: 0, spin: 0, smear: 0, tremble: 0, popFill: 1 };
  const hopArc = (u, Hh) => Hh * 4 * u * (1 - u);
  if (f < C.launch) { // birth + anticipation
    const k = (f - C.pop) / 2; // 0..3
    st.sy = [1.14, .94, .82, .72][k]; st.tip = [.0, .35, .55, .6][k];
    st.legs = [0, .5, 1, 1][k]; st.face = k >= 1 ? 1 : 0; st.arms = [0, .6, 1, 1][k]; st.eyes = 'closed'; st.mouth = k >= 1 ? 'line' : 'none';
    st.aL = (160 + k * 15) * D2R; st.aR = (20 - k * 15) * D2R;
    return st;
  }
  if (f < C.land) { // first jump
    const u = (f - C.launch) / (C.land - C.launch); st.hop = hopArc(u, 200);
    st.sy = 1 + 0.3 * Math.abs(1 - 2 * u); st.tip = .55 + 0.35 * (2 * u - 1); st.legs = 1;
    st.eyes = f >= C.ting ? 'open' : 'closed'; st.mouth = f >= C.ting ? 'open' : 'line';
    st.aL = lerp(250, 205, u) * D2R; st.aR = lerp(-70, -25, u) * D2R; st.lean = -0.08 * Math.sin(u * Math.PI);
    return st;
  }
  // dance hops (on beats): [start, end, height, xFrom, xTo, leanDir]
  const hops = [[36, 48, 55, 960, 920, -1], [48, 60, 60, 920, 1000, 1], [60, 72, 70, 1000, 940, -1], [72, 84, 120, 940, 960, 1], [84, 108, 215, 960, 960, 0]];
  for (let hI = 0; hI < hops.length; hI++) {
    const [s, e, Hh, x0, x1, dir] = hops[hI];
    if (f >= s && f < e) {
      const u = (f - s) / (e - s), ground = hI === 4 ? 0.1 : 0.17;
      const sq = landSq(f - s);
      st.x = lerp(x0, x1, eIO(clamp((u - ground) / (1 - ground))));
      if (u < ground) { st.sy = Math.min(sq, .78 + u * 1.2); st.hop = 0; st.lean = 0; }
      else { const w = (u - ground) / (1 - ground); st.hop = hopArc(w, Hh); st.sy = 1 + 0.22 * Math.abs(1 - 2 * w); st.lean = dir * 0.16 * Math.sin(w * Math.PI); st.tip = .55 + 0.3 * (2 * w - 1); }
      const up = hI % 2 === 0; st.mouth = up ? 'open' : 'smile';
      st.aL = (up ? 235 : 160) * D2R; st.aR = (up ? -20 : -75) * D2R;
      if (hI === 3) { st.aL = 240 * D2R; st.aR = -60 * D2R; st.mouth = 'open'; }
      if (hI === 4) { // spin jump
        const w = clamp((u - ground) / (1 - ground)); const sp = eIO(rmp(w, .12, .88));
        st.spin = -sp * Math.PI * 2; st.aL = 255 * D2R; st.aR = -75 * D2R; st.mouth = 'open';
        const vel = Math.abs(Math.sin(sp * Math.PI)); st.smear = (f >= 92 && f <= 99) ? vel : 0;
        if (u >= ground) st.sy = 1 + 0.15 * Math.abs(1 - 2 * w);
        st.lean = 0;
      }
      return st;
    }
  }
  if (f < C.inflate[0]) { // ta-da
    const dt = f - C.tadaLand; st.sy = landSq(dt); st.aL = lerp(170, 215, eOutBack(rmp(dt, 0, 6))) * D2R; st.aR = lerp(10, -35, eOutBack(rmp(dt, 0, 6))) * D2R;
    st.mouth = 'grin'; st.eyes = 'happy'; st.tip = .55 + 0.25 * Math.exp(-dt / 4) * Math.sin(dt * 0.9);
    return st;
  }
  // inflate + tremble
  const u = rmp(f, C.inflate[0], C.choke);
  st.scale = 1 + 0.5 * eInC(u) + (f >= C.choke ? 0.06 : 0); st.eyes = 'squeeze'; st.mouth = 'pursed'; st.cheek = 1 + u * 0.8;
  st.tremble = 2 + 9 * u; st.aL = lerp(215, 245, u) * D2R; st.aR = lerp(-35, -65, u) * D2R; st.tip = .55 + .15 * Math.sin(f * 2.1);
  if (f >= C.choke) { st.sy = .76; }
  return st;
}
function bodyOutline(rx, ry, tip, bend, base) {
  const N = 96, o = [];
  for (let i = 0; i <= N; i++) {
    const th = (i / N) * Math.PI * 2; const tw = Math.atan2(Math.sin(th), Math.cos(th));
    const g = Math.exp(-Math.pow(tw / 0.5, 2));
    let x = rx * Math.sin(th) * (1 + 0.08 * (-Math.cos(th)) * 0.5 + 0.04);
    let y = base - ry - ry * Math.cos(th);
    y -= tip * ry * 0.78 * g; x += bend * ry * 0.7 * g * g;
    o.push([x, y]);
  }
  return o;
}
function drawChar(ctx, st, f) {
  ctx.save();
  let tx = st.x, ty = GROUND - st.hop;
  if (st.tremble) { tx += (hash2(f, 1) - .5) * 2 * st.tremble; ty += (hash2(f, 2) - .5) * st.tremble; }
  // floor shadow
  const sh = clamp(1 - st.hop / 420);
  fillShape(ctx, ellipsePts(st.x, GROUND + 4, 150 * sh * st.scale / Math.sqrt(st.sy), 18 * sh, 0, Math.PI * 2, 40), COL.shade, { seed: 701, dx: 0, dy: 0 });
  ctx.translate(tx, ty); ctx.rotate(st.lean); ctx.scale(st.scale * CS, st.scale * CS);
  const sy = st.sy, sx = 1 / Math.pow(sy, 0.75);
  const rx = R0 * sx, ry = R0 * sy, base = -LEG * st.legs;
  const cy = base - ry;
  if (st.spin) { ctx.translate(0, cy); ctx.rotate(st.spin); ctx.translate(0, -cy); }
  if (st.smear > 0.2) { // spin smear: stretch along the tangent of rotation + speed arcs
    ctx.translate(0, cy); ctx.scale(1 + 0.9 * st.smear, 1 - 0.25 * st.smear); ctx.translate(0, -cy);
  }
  const amp = 1.8 / st.scale;
  // legs
  if (st.legs > 0.01) {
    for (const s of [-1, 1]) {
      const hip = [s * rx * 0.34, base - 6], air = st.hop > 8 ? 1 : 0;
      const foot = [s * (rx * 0.42 + 6 * air), -2 - (air ? 14 : 0) + LEG * (1 - st.legs)];
      brush(ctx, [hip, [lerp(hip[0], foot[0], .5) + s * 6, lerp(hip[1], foot[1], .5)], foot], { w: 9, seed: 720 + s, amp, taper: [0, 0], cal: .2 });
      fillShape(ctx, ellipsePts(foot[0] + s * 13, foot[1] + 2, 22, 11, 0, Math.PI * 2, 24), COL.ink, { seed: 725 + s, dx: 0, dy: 0, amp });
    }
  }
  // arms (rubber hose) behind body
  const drawArm = (s, a) => {
    const sh = [s * rx * 0.86, cy + ry * 0.05], len = 92;
    const hand = [sh[0] + Math.cos(a) * len, sh[1] + Math.sin(a) * len];
    const mid = [(sh[0] + hand[0]) / 2 - Math.sin(a) * 18 * s, (sh[1] + hand[1]) / 2 + Math.cos(a) * 18 * s];
    brush(ctx, catmull([sh, mid, hand], 10), { w: 9, seed: 740 + s, amp, taper: [0, 0], cal: .2 });
    fillShape(ctx, ellipsePts(hand[0], hand[1], 15, 15, 0, Math.PI * 2, 22), COL.paperHi, { seed: 745 + s, dx: 0, dy: 0, amp });
    brush(ctx, ellipsePts(hand[0], hand[1], 15, 15, 0, Math.PI * 2, 22), { w: 5.5, seed: 748 + s, amp, closed: true });
  };
  if (st.arms > 0.01) { drawArm(-1, st.aL); drawArm(1, st.aR); }
  // body
  const tip = st.tip, bend = st.bend - st.lean * 1.2;
  const out = bodyOutline(rx, ry, tip, bend, base);
  if (st.popFill) {
    fillShape(ctx, out, COL.blue, { seed: 760, dx: 7, dy: -5, amp });
    // cel shadow (crescent) — clipped
    ctx.save(); ctx.beginPath(); pathPoly(ctx, out); ctx.clip();
    const sh2 = bodyOutline(rx * 0.9, ry * 0.92, tip * .9, bend, base - ry * 0.12).map(([x, y]) => [x - rx * 0.2, y]);
    ctx.beginPath(); ctx.rect(-400, -700, 800, 900); pathPoly(ctx, resample(sh2, 5).p); ctx.fillStyle = COL.blueDk; ctx.fill('evenodd');
    ctx.restore();
    // highlight squiggle
    brush(ctx, ellipsePts(-rx * 0.05, cy - ry * 0.05, rx * 0.62, ry * 0.62, 200 * D2R, 245 * D2R, 16), { w: 11, color: COL.paperHi, seed: 770, amp, taper: [.3, .3] });
    fillShape(ctx, ellipsePts(-rx * 0.5, cy - ry * 0.72, 7, 7, 0, 6.3, 12), COL.paperHi, { seed: 771, dx: 0, dy: 0, amp: 0.5 });
  }
  brush(ctx, out, { w: 8.5, seed: 780, amp, closed: true, cal: .5 });
  // face
  if (st.face > 0) {
    const fy = cy + ry * 0.08, ex = rx * 0.34, ey = fy - ry * 0.18;
    for (const s of [-1, 1]) {
      const x = s * ex + st.look;
      if (st.eyes === 'open') {
        fillShape(ctx, ellipsePts(x, ey, 13, 21 * Math.min(1.2, sy), 0, 6.3, 24), COL.ink, { seed: 800 + s, dx: 0, dy: 0, amp: .8 });
        fillShape(ctx, ellipsePts(x + 4, ey - 8, 5, 5, 0, 6.3, 12), COL.paperHi, { seed: 803 + s, dx: 0, dy: 0, amp: .3 });
      } else if (st.eyes === 'closed') {
        brush(ctx, ellipsePts(x, ey - 4, 14, 8, 20 * D2R, 160 * D2R, 12), { w: 6.5, seed: 806 + s, amp: .8 });
      } else if (st.eyes === 'happy') {
        brush(ctx, ellipsePts(x, ey + 6, 15, 15, 200 * D2R, 340 * D2R, 12), { w: 7, seed: 809 + s, amp: .8 });
      } else if (st.eyes === 'squeeze') {
        brush(ctx, [[x - s * 14, ey - 13], [x + s * 10, ey], [x - s * 14, ey + 12]], { w: 7, seed: 812 + s, amp: .8, taper: [.1, .1] });
      }
      fillShape(ctx, ellipsePts(s * rx * 0.58, fy + 6, 20 * st.cheek, 11 * st.cheek, 0, 6.3, 20), st.cheek > 1.3 ? COL.tang : COL.pink, { seed: 815 + s, dx: 2, dy: 2, amp: 1 });
    }
    const my = fy + ry * 0.12;
    if (st.mouth === 'smile') brush(ctx, ellipsePts(0, my - 14, 30, 22, 20 * D2R, 160 * D2R, 14), { w: 7, seed: 820, amp: .9 });
    else if (st.mouth === 'line') brush(ctx, [[-14, my], [14, my + 1]], { w: 6, seed: 821, amp: .7 });
    else if (st.mouth === 'pursed') brush(ctx, ellipsePts(0, my + 2, 8, 6, 0, 6.3, 12), { w: 6, seed: 822, amp: .6, closed: true });
    else if (st.mouth === 'open' || st.mouth === 'grin') {
      const mw = st.mouth === 'grin' ? 38 : 28, md = st.mouth === 'grin' ? 36 : 30;
      const mo = [[-mw, my - 6]].concat(ellipsePts(0, my - 6, mw, md, 0, Math.PI, 18)).concat([[-mw, my - 6]]);
      fillShape(ctx, mo, COL.ink, { seed: 824, dx: 0, dy: 0, amp: .8 });
      ctx.save(); ctx.beginPath(); pathPoly(ctx, mo); ctx.clip();
      fillShape(ctx, ellipsePts(4, my + md - 8, mw * 0.6, md * 0.45, 0, 6.3, 18), COL.tang, { seed: 826, dx: 0, dy: 0, amp: .6 }); ctx.restore();
    }
  }
  ctx.restore();
  // spin speed arcs (smear frames, on 1s)
  if (st.smear > 0.2) {
    const ccx = st.x, ccy = GROUND - st.hop - (LEG + R0) * CS;
    for (let i = 0; i < 4; i++) {
      const r = R0 * CS * (1.25 + i * 0.22), a0 = st.spin - Math.PI * 0.5 + i * 0.6;
      brush(ctx, ellipsePts(ccx, ccy, r, r * 0.95, a0, a0 + 1.6 * st.smear, 24), { w: 7 - i, seed: 860 + i, taper: [.7, .15] });
    }
  }
}

// ---------- cel FX ----------
function starPoly(cx, cy, n, r1, r2, rot, seed) {
  const o = [];
  for (let i = 0; i < n * 2; i++) {
    const a = rot + i * Math.PI / n, j = 0.78 + 0.44 * hash2(seed, i);
    const r = i % 2 === 0 ? r1 * j : r2 * (0.85 + 0.3 * hash2(seed + 1, i));
    o.push([cx + r * Math.cos(a), cy + r * Math.sin(a)]);
  }
  o.push(o[0]); return o;
}
function sparkle(ctx, x, y, r, rot, color, seed) { // 4-point cel star
  const o = [];
  for (let i = 0; i < 4; i++) {
    const a = rot + i * Math.PI / 2;
    o.push([x + r * Math.cos(a), y + r * Math.sin(a)]);
    const a2 = a + Math.PI / 4; o.push([x + r * 0.22 * Math.cos(a2), y + r * 0.22 * Math.sin(a2)]);
  }
  const P = catmull(o, 4, true);
  fillShape(ctx, P, color, { seed, dx: 3, dy: -2, amp: .8 });
  brush(ctx, P, { w: Math.max(3, r * 0.1), seed: seed + 1, amp: .8, closed: true });
}
function puff(ctx, x, y, s, seed, curl, pinkShade = true) { // smoke puff: union of circles, ink-outlined
  if (s <= 0.02) return;
  const n = 4 + Math.floor(hash(seed) * 2), cs = [];
  for (let i = 0; i < n; i++) {
    const a = i / n * Math.PI * 2 + hash2(seed, i) * 0.8, d = (i === 0 ? 0 : 0.55) * s;
    cs.push([x + Math.cos(a) * d * 60, y + Math.sin(a) * d * 46, s * (34 + 22 * hash2(seed + 2, i))]);
  }
  const amp = 1.4;
  for (const [cx, cy, r] of cs) brush(ctx, ellipsePts(cx, cy, r + 3.5, r + 3.5, 0, 6.3, 28), { w: 7, seed: seed + cx, amp, closed: true });
  for (const [cx, cy, r] of cs) fillShape(ctx, ellipsePts(cx, cy, r + 1, r + 1, 0, 6.3, 28), COL.paperHi, { seed: seed + cy, dx: 0, dy: 0, amp });
  if (pinkShade) for (const [cx, cy, r] of cs) { ctx.save(); ctx.beginPath(); pathPoly(ctx, ellipsePts(cx, cy, r, r, 0, 6.3, 28)); ctx.clip(); fillShape(ctx, ellipsePts(cx + r * .25, cy + r * .75, r * .95, r * .55, 0, 6.3, 24), COL.pink, { seed: seed + r, dx: 0, dy: 0, amp, alpha: .6 }); ctx.restore(); }
  if (curl > 0) { // curling spiral line
    const sp = []; for (let i = 0; i <= 30; i++) { const t = i / 30, a = t * 5.2 + seed, r = s * 26 * (1 - t * 0.85); sp.push([x + Math.cos(a) * r, y + Math.sin(a) * r * 0.85]); }
    brush(ctx, sp, { w: 5, seed: seed + 99, amp: 1, reveal: curl, taper: [.1, .5] });
  }
}
function splash(ctx, x, y, dt, seed, color) { // paint splash crown + splat, on 2s
  if (dt < 0 || dt > 14) return;
  const u = dt / 14;
  fillShape(ctx, ellipsePts(x, y + 2, 150 * eOutC(Math.min(1, u * 3)) * (1 - u * .3), 16, 0, 6.3, 30), color, { seed, dx: 0, dy: 0 });
  for (let i = 0; i < 7; i++) {
    const a = Math.PI + (i + .5) / 7 * Math.PI, sp = 260 + 160 * hash2(seed, i);
    const t = u * 0.55; const px = x + Math.cos(a) * sp * t * 1.3, py = y + Math.sin(a) * sp * t + 900 * t * t;
    const vx = Math.cos(a) * sp * 1.3, vy = Math.sin(a) * sp + 1800 * t; const l = Math.hypot(vx, vy);
    const r = (9 + 8 * hash2(seed + 1, i)) * (1 - u * .7);
    if (py > y + 4) continue;
    const tail = [px - vx / l * r * 3.2, py - vy / l * r * 3.2];
    brush(ctx, [tail, [px, py]], { w: r * 2, color, seed: seed + i, amp: .8, taper: [1, 0], cal: 0 });
  }
}
function dust(ctx, x, y, dt, seed) { // landing poofs each side
  if (dt < 0 || dt > 12) return; const u = dt / 12;
  for (const s of [-1, 1]) puff(ctx, x + s * (110 + 90 * eOutC(u)), y - 18 - 22 * u, 0.62 * Math.sin(Math.min(1, u * 1.6) * Math.PI * .5) * (1 - u * u), seed + s, 0, false);
}

// burst particles — closed form
const B = { x: 960, y: 560 };
const SPARKS = Array.from({ length: 34 }, (_, i) => {
  const a = (i / 34) * Math.PI * 2 + hash(i * 4.1) * 0.3, sp = 380 + hash(i * 2.7) * 420;
  return { a, sp, size: i < 13 ? 34 + hash(i * 6.3) * 10 : 14 + hash(i * 6.3) * 18, col: [COL.tang, COL.pink, COL.paperHi, COL.blue][i % 4], carry: i < 13 ? i : -1 };
});
const SMOKE = Array.from({ length: 11 }, (_, i) => ({ a: (i / 11) * Math.PI * 2 + hash(i * 3.3) * 0.4, d: 330 + hash(i * 8.1) * 160, s: 1.0 + hash(i * 1.9) * 0.5 }));
const DROPS = Array.from({ length: 12 }, (_, i) => ({ a: -Math.PI * (0.1 + 0.8 * hash(i * 5.5)), sp: 900 + 700 * hash(i * 9.9), r: 14 + 14 * hash(i * 3.7) }));

function sparkPos(sp, f) { // returns {x,y,vx,vy,alive}
  const t = (f - C.burst) / 24;
  const pFly = (tt) => { const k = 1 - Math.exp(-tt * 5); return [B.x + Math.cos(sp.a) * sp.sp * k / 1.6, B.y + Math.sin(sp.a) * sp.sp * k / 1.6 + 60 * tt * tt]; };
  if (sp.carry < 0) {
    const p = pFly(t), p2 = pFly(t - 1 / 24);
    return { x: p[0], y: p[1], vx: p[0] - p2[0], vy: p[1] - p2[1], life: 1 - rmp(f, 156, 182) };
  }
  const arrive = C.letters[sp.carry], leave = 152;
  if (f < leave) { const p = pFly(t), p2 = pFly(t - 1 / 24); return { x: p[0], y: p[1], vx: p[0] - p2[0], vy: p[1] - p2[1], life: 1 }; }
  const L = ALLLET[sp.carry], p0 = pFly((leave - C.burst) / 24), tgt = L.start;
  const u = clamp((f - leave) / (arrive - leave)), e = eIO(u);
  const ctrl = [lerp(p0[0], tgt[0], .5) + Math.cos(sp.a + 1.4) * 260, lerp(p0[1], tgt[1], .5) - 220];
  const q = (e) => [(1 - e) * (1 - e) * p0[0] + 2 * (1 - e) * e * ctrl[0] + e * e * tgt[0], (1 - e) * (1 - e) * p0[1] + 2 * (1 - e) * e * ctrl[1] + e * e * tgt[1]];
  const p = q(e), pp = q(eIO(clamp((f - 1 - leave) / (arrive - leave))));
  return { x: p[0], y: p[1], vx: p[0] - pp[0], vy: p[1] - pp[1], life: f <= arrive ? 1 : 0 };
}
function drawSpark(ctx, s, sp, seed) {
  const v = Math.hypot(s.vx, s.vy); const r = sp.size * 0.5 * clamp(s.life);
  if (r < 1) return;
  if (v > 14) { // streaking teardrop + speed line
    const ux = s.vx / v, uy = s.vy / v, len = Math.min(v * 1.5, 170);
    brush(ctx, [[s.x - ux * len * 1.5, s.y - uy * len * 1.5], [s.x - ux * len * .8, s.y - uy * len * .8]], { w: 4, seed: seed + 5, amp: .6, taper: [.6, .6] });
    brush(ctx, [[s.x - ux * len, s.y - uy * len], [s.x, s.y]], { w: r * 2, color: sp.col === COL.paperHi ? COL.tang : sp.col, seed, amp: .8, taper: [1, 0], cal: 0 });
  } else sparkle(ctx, s.x, s.y, r * 1.6, seed * 0.3, sp.col === COL.blue ? COL.blue : COL.tang, seed);
}

// ---------- scene ----------
function guides(ctx) { // non-photo-blue construction lines (lettering practice sheet)
  const lines = [[340], [246], [690], [452], [828], [786]];
  const ys = [LY.b1 - 172, LY.b1, LY.b2 - 238, LY.b2, LY.b3 - 46, LY.b3];
  ys.forEach((y, i) => brush(ctx, [[110 + i * 9, y], [1810 - i * 7, y + (i % 2 ? 2 : -2)]], { w: 1.6, color: 'rgba(51,70,232,0.22)', seed: 900 + i, amp: 1.2, taper: [.05, .05], cal: 0 }));
  brush(ctx, [[960, 175], [960, 905]], { w: 1.4, color: 'rgba(51,70,232,0.14)', seed: 910, amp: 1.2, taper: [.05, .05], cal: 0 });
  void lines;
}
function halo(ctx, f, fa) { // pink disc behind the character
  if (f < C.pop || f >= C.burst + 2) return;
  const dt = fa - C.pop;
  let k = eOutBack(clamp(dt / 10), 2.4);
  const beat = (fa - 12) % 12; k *= 1 + 0.035 * Math.exp(-beat / 3);
  if (f >= C.inflate[0]) k *= 1 + 0.18 * eInC(rmp(f, C.inflate[0], C.burst));
  const P = ellipsePts(960, 600, 410 * k, 410 * k, 0, 6.3, 80);
  fillShape(ctx, P, COL.pink, { seed: 950, dx: 8, dy: -6 });
  brush(ctx, ellipsePts(960, 600, 410 * k, 410 * k, -1.2, -1.2 + 6.4, 80), { w: 5, seed: 951, taper: [.1, .1] });
}

function render(ctx, f) {
  if (!PAPER) { PAPER = makePaper(); layout(); }
  V = boilKey(f) % 3;
  const f2 = f >= C.holdFrom ? on(f - C.holdFrom, 3) + C.holdFrom : on(f, 2);  // on 2s / on 3s
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  // impact frame (1 frame, inverted)
  if (f === C.burst) {
    ctx.fillStyle = COL.ink; ctx.fillRect(0, 0, W, H);
    fillShape(ctx, starPoly(B.x, B.y, 14, 980, 430, 0.2, 5), COL.paperHi, { seed: 960, dx: 0, dy: 0, amp: 3 });
    fillShape(ctx, starPoly(B.x, B.y, 11, 470, 230, 0.5, 6), COL.tang, { seed: 961, dx: 0, dy: 0, amp: 3 });
    ctx.globalCompositeOperation = 'multiply'; ctx.globalAlpha = 0.13; ctx.drawImage(PAPER, 0, 0); ctx.globalAlpha = 1; ctx.globalCompositeOperation = 'source-over';
    return;
  }
  ctx.fillStyle = COL.paper; ctx.fillRect(0, 0, W, H);
  guides(ctx);
  halo(ctx, f, f2);

  // --- burst behind everything (starburst on 1s for 2 frames, then on 2s)
  if (f > C.burst && f < C.burst + 14) {
    const fb = f <= C.burst + 2 ? f : on(f, 2), u = (fb - C.burst) / 14;
    const k = 1 - eInC(u), rot = 0.2 + u * 0.5;
    const sp = starPoly(B.x, B.y, 14, 760 * (1 + u * .35) * (1 - eInC(u) * .7), 380 * Math.pow(1 - u, 2), rot, 7);
    fillShape(ctx, sp, COL.tang, { seed: 962, dx: 10, dy: -8, amp: 3 });
    brush(ctx, sp, { w: 9, seed: 963, amp: 3, closed: true, cal: .2 });
    fillShape(ctx, starPoly(B.x, B.y, 11, 420 * k * (1 - u * .5), 200 * k * (1 - u), rot + .3, 8), COL.pink, { seed: 964, dx: 6, dy: -5, amp: 2 });
    fillShape(ctx, ellipsePts(B.x, B.y, 170 * (1 - u), 170 * (1 - u), 0, 6.3, 40), COL.paperHi, { seed: 965, dx: 0, dy: 0, amp: 2 });
  }
  // speed lines
  if (f > C.burst && f < C.burst + 24) {
    const u = (on(f, 2) - C.burst) / 24;
    for (let i = 0; i < 30; i++) {
      const a = i / 30 * Math.PI * 2 + hash(i * 1.7) * 0.15, r0 = 260 + 900 * eOutC(u) + hash(i) * 120, len = (380 + hash(i * 3) * 260) * (1 - u);
      if (len < 8) continue;
      brush(ctx, [[B.x + Math.cos(a) * r0, B.y + Math.sin(a) * r0], [B.x + Math.cos(a) * (r0 + len), B.y + Math.sin(a) * (r0 + len)]], { w: 11 - 6 * u, seed: 970 + i, taper: [.8, .2], cal: 0 });
    }
  }
  // blue paint drops
  if (f > C.burst && f < C.burst + 26) {
    const t = (on(f, 2) - C.burst) / 24;
    DROPS.forEach((d, i) => {
      const x = B.x + Math.cos(d.a) * d.sp * t * 1.25, y = B.y + Math.sin(d.a) * d.sp * t + 1500 * t * t;
      const vx = Math.cos(d.a) * d.sp * 1.25, vy = Math.sin(d.a) * d.sp + 3000 * t, l = Math.hypot(vx, vy);
      const st = Math.min(4, 1 + l / 700);
      fillShape(ctx, catmull([[x - vx / l * d.r * st * 1.6, y - vy / l * d.r * st * 1.6], [x - vy / l * d.r, y + vx / l * d.r], [x + vx / l * d.r, y + vy / l * d.r], [x + vy / l * d.r, y - vx / l * d.r]], 6, true), COL.blue, { seed: 980 + i, dx: 0, dy: 0, amp: .8 });
    });
  }
  // smoke puffs (on 2s), curling then breaking up
  if (f > C.burst && f < 202) {
    const fs = on(f, 2);
    SMOKE.forEach((p, i) => {
      const u = rmp(fs, C.burst, 196 - i * 2);
      const d = 150 + p.d * eOutC(Math.min(1, u * 1.7));
      const s = p.s * (u < .25 ? eOutBack(u / .25) : 1 - eInC(rmp(u, .45, 1)));
      const x = B.x + Math.cos(p.a) * d * 1.45, y = B.y + Math.sin(p.a) * d * 0.95 - 90 * u;
      puff(ctx, x, y, s, 1000 + i * 17, rmp(u, .15, .6));
    });
  }

  // --- pencil intro
  const ps = penState(f);
  const scr = scribbleLine(f);
  if (scr && f < C.pop) brush(ctx, scr, { w: 10.5, seed: 780, taper: [.15, .05], cal: .5 });
  // --- character
  let fc = f2;
  if ((f >= 90 && f <= 101) || (f >= C.inflate[0])) fc = f; // spin + tremble on 1s
  const st = charState(fc);
  if (st) {
    drawChar(ctx, st, f);
    splash(ctx, 960, GROUND + 4, f2 - C.bigLand, 1100, COL.blue); dust(ctx, 960, GROUND, f2 - C.bigLand, 1110);
    splash(ctx, 960, GROUND + 4, f2 - C.tadaLand, 1120, COL.blue); dust(ctx, 960, GROUND, f2 - C.tadaLand, 1130);
    if (f >= C.land && f < C.land + 10) dust(ctx, 960, GROUND, f2 - C.land, 1140);
    // inflate: vibration marks + steam
    if (f >= C.inflate[0] + 4) {
      const u = rmp(f, C.inflate[0], C.burst), sc = st.scale * CS, cy = GROUND - (LEG + R0 * st.sy) * sc;
      for (const s of [-1, 1]) for (let j = 0; j < 2; j++) {
        const x = 960 + s * (R0 * sc + 40 + j * 22);
        brush(ctx, ellipsePts(x - s * 40, cy, 40, 50 + j * 12, s > 0 ? -.6 : Math.PI - .6, s > 0 ? .6 : Math.PI + .6, 10), { w: 5, seed: 1200 + j + s * 3 + (f % 2) * 7, taper: [.3, .3] });
      }
      for (let k = 0; k < 3; k++) {
        const ph = ((on(f, 2) - C.inflate[0]) / 14 + k / 3) % 1;
        puff(ctx, 960 + Math.sin(k * 2.1 + ph * 3) * 30, cy - R0 * sc * 1.3 - ph * 160, 0.35 * Math.sin(ph * Math.PI) * (0.6 + u), 1300 + k, 0, false);
      }
    }
  }
  if (ps && f <= 15) {
    const v = [ps.tip[0] - ps.prev[0], ps.tip[1] - ps.prev[1]], sp = Math.hypot(v[0], v[1]);
    if (sp > 90 && !(f > 4 && f < 12)) { const d = [v[0] / sp, v[1] / sp];
      for (let i = 0; i < 4; i++) { // speed lines trailing the smear
        const o = (i - 1.5) * 38, nx = -d[1] * o, ny = d[0] * o, k0 = (i % 2) * .3;
        const cx0 = ps.tip[0] + Math.cos(ps.ang) * 230 * PEN_SC, cy0 = ps.tip[1] + Math.sin(ps.ang) * 230 * PEN_SC;
        brush(ctx, [[cx0 - v[0] * (1.5 + k0) + nx, cy0 - v[1] * (1.5 + k0) + ny], [cx0 - v[0] * (.55 + k0) + nx, cy0 - v[1] * (.55 + k0) + ny]], { w: 6, seed: 1400 + i, taper: [.7, .2], cal: 0 });
      }
    }
    drawPencil(ctx, ps.tip, ps.ang, PEN_SC, smearFor(ps.tip, ps.prev, ps.ang, PEN_SC, (f > 4 && f < 12) ? 9999 : 90));
    if (f === C.tick || f === C.tick + 1) for (let i = 0; i < 5; i++) { // contact tick marks
      const a = -2.6 + i * 0.5, x = ps.tip[0], y = ps.tip[1];
      brush(ctx, [[x + Math.cos(a) * 30, y + Math.sin(a) * 30], [x + Math.cos(a) * 62, y + Math.sin(a) * 62]], { w: 6, seed: 1450 + i, taper: [.4, .4] });
    }
  }
  // pop marks around the newborn
  if (f >= C.pop && f < C.pop + 6) {
    const u = (on(f, 2) - C.pop) / 6, pcy = PEN_CIRCLE.cy;
    for (let i = 0; i < 8; i++) { const a = i / 8 * Math.PI * 2 + .2, r0 = 215 + 80 * u, r1 = r0 + 60 * (1 - u);
      brush(ctx, [[960 + Math.cos(a) * r0, pcy + Math.sin(a) * r0], [960 + Math.cos(a) * r1, pcy + Math.sin(a) * r1]], { w: 8, seed: 1500 + i, taper: [.3, .3] }); }
  }

  // --- title
  if (f >= C.letters[0] - 1) {
    const fl = f2;
    ALLLET.forEach((L, i) => {
      const s0 = C.letters[i], big = i >= 5;
      const r = eOutC(rmp(fl, s0, s0 + 8)), rs = eOutC(rmp(fl, s0 + 2, s0 + 10));
      const w = big ? 36 : 28, sh = big ? [11, 10] : [8, 8];
      ctx.save(); ctx.translate(sh[0], sh[1]);
      drawLetter(ctx, L, rs, { w: w * 1.02, color: big ? COL.tang : COL.pink, seed: 2000 + i * 31 + 7, amp: 2.2 });
      ctx.restore();
      drawLetter(ctx, L, r, { w, color: big ? COL.ink : COL.blue, seed: 2000 + i * 31, amp: 2.0 });
      if (fl >= s0 && fl < s0 + 6) sparkle(ctx, L.start[0], L.start[1], 26 * (1 - (fl - s0) / 6), .4, COL.tang, 2400 + i);
    });
    // the O comes alive
    const O = TITLE1[2];
    if (f2 >= C.oPop) {
      const dt = f2 - C.oPop, k = eOutBack(clamp(dt / 6), 2.6);
      const rx = O.gw / 2 * 0.74, ry = 172 / 2 * 0.76;
      ctx.save(); ctx.translate(O.cx, O.cy); ctx.rotate(O.rot);
      fillShape(ctx, ellipsePts(0, 0, rx * k, ry * k, 0, 6.3, 40), COL.blue, { seed: 2500, dx: 5, dy: -4 });
      const blink = f >= C.blink && f < C.blink + 4;
      for (const s of [-1, 1]) {
        if (dt < 2) continue;
        if (blink) brush(ctx, ellipsePts(s * 19, -8, 10, 6, 20 * D2R, 160 * D2R, 10), { w: 5, seed: 2510 + s, amp: .6, color: COL.paperHi });
        else { fillShape(ctx, ellipsePts(s * 19, -12, 8.5, 13, 0, 6.3, 18), COL.paperHi, { seed: 2512 + s, dx: 0, dy: 0, amp: .5 });
          fillShape(ctx, ellipsePts(s * 19 + 1.5, -10, 4.5, 7, 0, 6.3, 14), COL.ink, { seed: 2514 + s, dx: 0, dy: 0, amp: .3 }); }
        fillShape(ctx, ellipsePts(s * 33, 12, 9, 5, 0, 6.3, 12), COL.pink, { seed: 2516 + s, dx: 0, dy: 0, amp: .4 });
      }
      if (dt >= 2) brush(ctx, ellipsePts(0, 4, 15, 12, 25 * D2R, 155 * D2R, 12), { w: 5, seed: 2518, amp: .6, color: COL.paperHi });
      ctx.restore();
      if (dt < 8) { const u = dt / 8; for (let i = 0; i < 6; i++) { const a = i / 6 * Math.PI * 2 - .3, r0 = 95 + 40 * u, r1 = r0 + 34 * (1 - u);
        brush(ctx, [[O.cx + Math.cos(a) * r0, O.cy + Math.sin(a) * r0], [O.cx + Math.cos(a) * r1, O.cy + Math.sin(a) * r1]], { w: 6, seed: 2530 + i, taper: [.3, .3] }); } }
    }
  }
  // sparks (on 2s)
  if (f > C.burst && f < 192) {
    const fs = on(f, 2);
    SPARKS.forEach((sp, i) => { const s = sparkPos(sp, fs); if (s.life > 0) drawSpark(ctx, s, sp, 3000 + i * 7); });
  }
  // tagline + underline + returning pencil
  if (f2 >= 194) {
    const tot = TAG.length; const u = rmp(f2, 194, 210);
    TAG.forEach((L, i) => drawLetter(ctx, L, clamp(u * tot - i * 0.75), { w: 8, color: COL.ink, seed: 3500 + i * 17, amp: 1.0 }));
  }
  const tg0 = TAG[0], tg1 = TAG[TAG.length - 1];
  const UL0 = [tg0.cx - tg0.gw / 2 - 14, LY.b3 + 42], UL1 = [tg1.cx + tg1.gw / 2 + 14, LY.b3 + 36];
  const ulPt = u => [lerp(UL0[0], UL1[0], u), lerp(UL0[1], UL1[1], u) + Math.sin(u * Math.PI) * 9];
  if (f >= C.underline[0]) {
    const fu = f < C.holdFrom ? f : f2;
    const u = eIO(rmp(fu, C.underline[0], C.underline[1])); const pts = []; for (let i = 0; i <= 40; i++) pts.push(ulPt(i / 40));
    brush(ctx, pts, { w: 13, color: COL.tang, seed: 3600, reveal: u, taper: [.25, .35], cal: .2 });
  }
  if (f >= C.pencilIn) { // pencil returns (on 1s while moving, then on 3s at rest)
    let tip, ang = -0.26, prev;
    const path = fr => {
      if (fr < C.underline[0]) { const k = [[2250, 1250], [1640, 1010], [1110, 905], [UL0[0] + 90, UL0[1] - 6], [UL0[0] + 12, UL0[1]], UL0][clamp(fr - C.pencilIn, 0, 5)]; return fr < C.pencilIn ? [2900, 420] : k; }
      if (fr <= C.underline[1]) return ulPt(eIO(rmp(fr, C.underline[0], C.underline[1])));
      const dt = fr - C.underline[1]; const e = ulPt(1); return [e[0] + 46 * eOutC(clamp(dt / 6)), e[1] + 6 - 10 * eOutC(clamp(dt / 6))];
    };
    const fr = f < C.holdFrom ? f : f2;
    tip = path(fr); prev = path(Math.max(C.pencilIn - 1, fr - 1));
    if (fr > C.underline[1]) ang = -0.26 - 0.06 * eOutC(clamp((fr - C.underline[1]) / 6));
    const v = [tip[0] - prev[0], tip[1] - prev[1]], sp = Math.hypot(v[0], v[1]);
    void v; void sp;
    drawPencil(ctx, tip, ang, 0.56, smearFor(tip, prev, ang, 0.56, 110));
  }
  // end-card sparkles (twinkle on 3s)
  if (f2 >= 198) {
    const pos = [[318, 300, 30, COL.tang], [1626, 268, 38, COL.pink], [1716, 520, 22, COL.tang], [392, 842, 22, COL.blue]];
    pos.forEach(([x, y, r, c], i) => {
      const dt = f2 - 198 - i * 3; if (dt < 0) return;
      const k = eOutBack(clamp(dt / 6), 2.2) * (1 + 0.16 * Math.sin((on(f, 3) + i * 7) * 0.7));
      sparkle(ctx, x, y, r * k, 0.1 + i, c, 3700 + i * 5);
    });
  }

  // paper grain multiply (~13%)
  ctx.globalCompositeOperation = 'multiply'; ctx.globalAlpha = 0.13; ctx.drawImage(PAPER, 0, 0);
  ctx.globalAlpha = 1; ctx.globalCompositeOperation = 'source-over';
}
root.FILM = { render, W, H };
})(this);
