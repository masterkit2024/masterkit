// core helpers: math, color, paths, light, particles, layers, post
const { createCanvas } = require('@napi-rs/canvas');
const VW = 1080, VH = 1920;
const clamp = (v, a = 0, b = 1) => Math.max(a, Math.min(b, v));
const lerp = (a, b, t) => a + (b - a) * t;
const ease = t => { t = clamp(t); return t * t * (3 - 2 * t); };
const easeIO = t => { t = clamp(t); return t < .5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2; };
const easeOut = t => 1 - Math.pow(1 - clamp(t), 3);
const easeIn = t => Math.pow(clamp(t), 3);
const seg = (t, a, b) => clamp((t - a) / (b - a));
function rng(seed) { let a = seed >>> 0; return () => { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
// keyframe interpolation: kf = [[t,{...}],...]
function kf(list, t, e = easeIO) {
  if (t <= list[0][0]) return { ...list[0][1] };
  for (let i = 0; i < list.length - 1; i++) {
    const [t0, a] = list[i], [t1, b] = list[i + 1];
    if (t <= t1) { const k = e((t - t0) / (t1 - t0)); const o = {}; for (const key in a) o[key] = typeof a[key] === 'number' ? lerp(a[key], b[key] ?? a[key], k) : a[key]; return o; }
  }
  return { ...list[list.length - 1][1] };
}
// colors
const hex = h => { h = h.replace('#', ''); return [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16)]; };
const rgba = (c, a = 1) => `rgba(${c[0] | 0},${c[1] | 0},${c[2] | 0},${a})`;
const mix = (c1, c2, t) => [lerp(c1[0], c2[0], t), lerp(c1[1], c2[1], t), lerp(c1[2], c2[2], t)];
const shade = (c, k) => k < 0 ? mix(c, [0, 0, 0], -k) : mix(c, [255, 255, 255], k);
function lg(ctx, x0, y0, x1, y1, stops) { const g = ctx.createLinearGradient(x0, y0, x1, y1); for (const [o, c] of stops) g.addColorStop(clamp(o), c); return g; }
function rg(ctx, x, y, r0, r1, stops, x1, y1) { const g = ctx.createRadialGradient(x, y, r0, x1 ?? x, y1 ?? y, r1); for (const [o, c] of stops) g.addColorStop(clamp(o), c); return g; }
// closed / open catmull-rom spline through points
function spline(ctx, pts, closed = true, tension = 0.5) {
  const n = pts.length; if (n < 2) return;
  const P = i => closed ? pts[(i + n) % n] : pts[clamp(i, 0, n - 1)];
  ctx.moveTo(pts[0][0], pts[0][1]);
  const lim = closed ? n : n - 1;
  for (let i = 0; i < lim; i++) {
    const p0 = P(i - 1), p1 = P(i), p2 = P(i + 1), p3 = P(i + 2);
    const c1x = p1[0] + (p2[0] - p0[0]) * tension / 3, c1y = p1[1] + (p2[1] - p0[1]) * tension / 3;
    const c2x = p2[0] - (p3[0] - p1[0]) * tension / 3, c2y = p2[1] - (p3[1] - p1[1]) * tension / 3;
    ctx.bezierCurveTo(c1x, c1y, c2x, c2y, p2[0], p2[1]);
  }
  if (closed) ctx.closePath();
}
function glow(ctx, x, y, r, c, a = 1, mode = 'lighter') {
  ctx.save(); ctx.globalCompositeOperation = mode; ctx.fillStyle = rg(ctx, x, y, 0, r, [[0, rgba(c, a)], [0.25, rgba(c, a * 0.45)], [1, rgba(c, 0)]]);
  ctx.fillRect(x - r, y - r, 2 * r, 2 * r); ctx.restore();
}
// volumetric cone from (x,y) pointing angle (rad, 0=down), half-spread, length
const fb = (ctx, px) => `blur(${(px * Math.hypot(ctx.getTransform().a, ctx.getTransform().b)).toFixed(2)}px)`;
function cone(ctx, x, y, ang, spread, len, c, a = 0.25, w0 = 10) {
  ctx.save(); ctx.globalCompositeOperation = 'lighter';
  ctx.translate(x, y); ctx.rotate(-ang);
  const g = ctx.createLinearGradient(0, 0, 0, len); g.addColorStop(0, rgba(c, a)); g.addColorStop(0.5, rgba(c, a * 0.35)); g.addColorStop(1, rgba(c, 0));
  ctx.fillStyle = g; ctx.beginPath(); const sp = Math.tan(spread) * len;
  ctx.moveTo(-w0, 0); ctx.lineTo(w0, 0); ctx.lineTo(sp, len); ctx.lineTo(-sp, len); ctx.closePath();
  ctx.filter = fb(ctx, 14); ctx.fill(); ctx.restore();
}
// dust motes in a region, drifting with time
function dust(ctx, t, seed, n, box, c, a = 0.6, size = 3) {
  const R = rng(seed); ctx.save(); ctx.globalCompositeOperation = 'lighter';
  for (let i = 0; i < n; i++) {
    const bx = R(), by = R(), sp = 0.3 + R(), ph = R() * 6.28, s = size * (0.4 + R() * 1.2);
    let x = box[0] + ((bx + Math.sin(t * 0.13 * sp + ph) * 0.03 + t * 0.006 * sp) % 1) * box[2];
    let y = box[1] + ((by + t * 0.01 * sp + 1) % 1) * box[3];
    const tw = 0.5 + 0.5 * Math.sin(t * 1.7 * sp + ph);
    ctx.fillStyle = rg(ctx, x, y, 0, s * 2, [[0, rgba(c, a * tw)], [1, rgba(c, 0)]]);
    ctx.fillRect(x - s * 2, y - s * 2, s * 4, s * 4);
  }
  ctx.restore();
}
// rain streaks
function rain(ctx, t, seed, n, box, c, a = 0.35, len = 60, wdt = 1.5, ang = 0.12, speed = 2200) {
  const R = rng(seed); ctx.save(); ctx.strokeStyle = rgba(c, a); ctx.lineWidth = wdt; ctx.lineCap = 'round'; ctx.beginPath();
  for (let i = 0; i < n; i++) {
    const bx = R(), off = R(), sp = 0.7 + R() * 0.6, l = len * (0.6 + R() * 0.8);
    const y = box[1] + (((off * box[3]) + t * speed * sp) % (box[3] + l)) - l;
    const x = box[0] + bx * box[2] + (y - box[1]) * ang;
    ctx.moveTo(x, y); ctx.lineTo(x + l * ang, y + l);
  }
  ctx.stroke(); ctx.restore();
}
// drops sliding on glass
function glassDrops(ctx, t, seed, n, box, c, a = 0.5) {
  const R = rng(seed); ctx.save();
  for (let i = 0; i < n; i++) {
    const x = box[0] + R() * box[2], y0 = R(), sp = R() < 0.3 ? 40 + R() * 80 : 2 + R() * 4, r = 1.5 + R() * 3.5;
    const y = box[1] + ((y0 * box[3] + t * sp) % box[3]);
    ctx.fillStyle = rgba(c, a * 0.5); ctx.beginPath(); ctx.ellipse(x, y, r, r * 1.3, 0, 0, 6.28); ctx.fill();
    ctx.fillStyle = rgba([255, 255, 255], a * 0.7); ctx.beginPath(); ctx.arc(x - r * 0.3, y - r * 0.4, r * 0.35, 0, 6.28); ctx.fill();
    if (sp > 30) { ctx.strokeStyle = rgba(c, a * 0.18); ctx.lineWidth = r * 0.8; ctx.beginPath(); ctx.moveTo(x, y - r); ctx.lineTo(x + Math.sin(i) * 3, y - 40 - r * 10); ctx.stroke(); }
  }
  ctx.restore();
}
// canvas pool
const pool = {};
function getCanvas(key, w, h) { const k = key + w + 'x' + h; if (!pool[k]) pool[k] = createCanvas(w, h); return pool[k]; }
// render pipeline context
class Frame {
  constructor(W, H) { this.W = W; this.H = H; this.S = W / VW; this.canvas = createCanvas(W, H); this.ctx = this.canvas.getContext('2d'); }
  // draw fn into layer with blur (in virtual px) and optional alpha/composite
  layer(fn, blur = 0, alpha = 1, comp = 'source-over', target) {
    const tctx = target || this.ctx;
    if (blur < 0.4 && alpha >= 1 && comp === 'source-over') { tctx.save(); tctx.setTransform(this.S, 0, 0, this.S, 0, 0); fn(tctx); tctx.restore(); return; }
    const depthKey = (this._depth = (this._depth || 0) + 1);
    const oc = getCanvas('L' + depthKey, this.W, this.H), o = oc.getContext('2d');
    o.save(); o.setTransform(1, 0, 0, 1, 0, 0); o.clearRect(0, 0, this.W, this.H); o.setTransform(this.S, 0, 0, this.S, 0, 0); fn(o); o.restore();
    this._depth--;
    tctx.save(); tctx.setTransform(1, 0, 0, 1, 0, 0); tctx.globalAlpha = alpha; tctx.globalCompositeOperation = comp;
    if (blur >= 0.4) tctx.filter = `blur(${(blur * this.S).toFixed(2)}px)`;
    tctx.drawImage(oc, 0, 0); tctx.restore();
  }
}
// camera transform for parallax factor p (0 = infinitely far, 1 = subject plane)
function applyCam(ctx, cam, p = 1) {
  const z = 1 + (cam.z - 1) * p;
  ctx.translate(VW / 2, VH / 2); if (cam.r) ctx.rotate(cam.r * p); ctx.scale(z, z); ctx.translate(-VW / 2 - (cam.x || 0) * p, -VH / 2 - (cam.y || 0) * p);
}
// post processing
let grainTiles = null;
function makeGrain(W, H) {
  grainTiles = [];
  for (let k = 0; k < 4; k++) {
    const c = createCanvas(W, H), x = c.getContext('2d'); const img = x.createImageData(W, H); const R = rng(77 + k);
    for (let i = 0; i < img.data.length; i += 4) { const v = 128 + (R() + R() + R() - 1.5) * 90; img.data[i] = img.data[i + 1] = img.data[i + 2] = v; img.data[i + 3] = 255; }
    x.putImageData(img, 0, 0); grainTiles.push(c);
  }
}
function post(F, t, opt) {
  const { ctx, W, H } = F;
  ctx.save(); ctx.setTransform(1, 0, 0, 1, 0, 0);
  // bloom
  const bw = Math.round(W / 4), bh = Math.round(H / 4);
  const bc = getCanvas('bloom', bw, bh), b = bc.getContext('2d');
  b.save(); b.globalCompositeOperation = 'copy'; b.filter = 'brightness(0.75) contrast(2.6) saturate(1.2)'; b.drawImage(F.canvas, 0, 0, bw, bh); b.restore();
  const bc2 = getCanvas('bloom2', bw, bh), b2 = bc2.getContext('2d');
  b2.save(); b2.globalCompositeOperation = 'copy'; b2.filter = `blur(${(bw / 40).toFixed(1)}px)`; b2.drawImage(bc, 0, 0); b2.restore();
  ctx.globalCompositeOperation = 'screen'; ctx.globalAlpha = opt.bloom ?? 0.45; ctx.drawImage(bc2, 0, 0, W, H);
  ctx.globalAlpha = 1;
  // grade tint (soft-light)
  if (opt.tint) { ctx.globalCompositeOperation = 'soft-light'; ctx.fillStyle = rgba(opt.tint, opt.tintA ?? 0.35); ctx.fillRect(0, 0, W, H); }
  // vignette
  ctx.globalCompositeOperation = 'multiply';
  ctx.fillStyle = rg(ctx, W / 2, H * 0.45, W * 0.25, H * 0.78, [[0, 'rgba(255,255,255,1)'], [0.55, 'rgba(225,225,230,1)'], [1, `rgba(${opt.vig ?? 40},${opt.vig ?? 40},${(opt.vig ?? 40) + 8},1)`]]);
  ctx.fillRect(0, 0, W, H);
  // grain
  if (!grainTiles) makeGrain(W, H);
  ctx.globalCompositeOperation = 'overlay'; ctx.globalAlpha = opt.grain ?? 0.09;
  ctx.drawImage(grainTiles[Math.floor(t * 24) % 4], 0, 0);
  ctx.restore();
}
module.exports = { fb, VW, VH, clamp, lerp, ease, easeIO, easeOut, easeIn, seg, rng, kf, hex, rgba, mix, shade, lg, rg, spline, glow, cone, dust, rain, glassDrops, getCanvas, Frame, applyCam, post };
