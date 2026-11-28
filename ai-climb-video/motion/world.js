// ===== Environment, rope, particles, overlays =====
'use strict';
// --- global time warp (slow-motion moments) for ambient simulation (snow, cloth, clouds)
const WARP = (() => {
  const dt = 1 / 240, N = Math.ceil(50 / dt), tab = new Float32Array(N + 1);
  const speed = t => {
    let s = 1;
    s *= lerp(1, .32, sstep(4.38, 4.6, t) * (1 - sstep(6.70, 6.79, t)));   // slip slow-mo
    s *= lerp(1, .07, sstep(28.0, 28.35, t) * (1 - sstep(28.92, 29.02, t))); // freeze before drop
    s *= lerp(1, .45, sstep(38.6, 39.2, t) * (1 - sstep(40.4, 41.5, t)));   // music out, breath
    return s;
  };
  for (let i = 1; i <= N; i++) tab[i] = tab[i - 1] + speed((i - .5) * dt) * dt;
  return { at: t => { const f = clamp(t, 0, 50) / dt, i = Math.floor(f); return lerp(tab[i], tab[Math.min(i + 1, N)], f - i); }, speed };
})();

// --- mountains (precomputed ridgelines)
const RIDGES = (() => {
  const mk = (seed, n, span, amp, base, rough) => {
    const r = rng(seed), pts = [];
    for (let i = 0; i <= n; i++) {
      const x = -span / 2 + span * i / n;
      const peak = Math.pow(Math.abs(fbm1(i * rough + seed)), .8);
      pts.push([x, base - peak * amp - r() * amp * .08]);
    }
    return pts;
  };
  return [
    { p: .05, pts: mk(11, 140, 9000, 1500, 900, .09) },
    { p: .12, pts: mk(23, 120, 8000, 1200, 1250, .11) },
    { p: .22, pts: mk(37, 100, 7000, 950, 1600, .13) },
  ];
})();
function drawSky(c, top, mid, bot, midAt = .55) {
  const g = c.createLinearGradient(0, 0, 0, H);
  g.addColorStop(0, top); g.addColorStop(midAt, mid); g.addColorStop(1, bot);
  c.fillStyle = g; c.fillRect(0, 0, W, H);
}
function drawMountains(c, cam, cols, haze, shake) {
  RIDGES.forEach((L, i) => {
    c.save(); camApply(c, cam, L.p, shake);
    const g = c.createLinearGradient(0, L.pts[0][1] - 1500, 0, L.pts[0][1] + 900);
    g.addColorStop(0, cols[i][0]); g.addColorStop(1, cols[i][1]);
    c.fillStyle = g; c.beginPath(); c.moveTo(L.pts[0][0], 9000);
    for (const p of L.pts) c.lineTo(p[0], p[1]);
    c.lineTo(L.pts[L.pts.length - 1][0], 9000); c.closePath(); c.fill();
    // snowy rim on ridges (light side)
    if (cols[i][2]) {
      c.strokeStyle = cols[i][2]; c.lineWidth = 3 / Math.pow(cam.z, L.p); c.beginPath();
      for (let k = 0; k < L.pts.length - 1; k++) { const a = L.pts[k], b = L.pts[k + 1]; if (b[1] < a[1]) { c.moveTo(a[0], a[1]); c.lineTo(b[0], b[1]); } }
      c.stroke();
    }
    c.restore();
    // aerial haze between layers
    if (haze) { c.fillStyle = haze; c.globalAlpha = .18; c.fillRect(0, 0, W, H); c.globalAlpha = 1; }
  });
}
// --- puff clouds, deterministic fields
function cloudField(seed, n, area) {
  const r = rng(seed), a = [];
  for (let i = 0; i < n; i++) a.push({ x: area[0] + r() * (area[2] - area[0]), y: area[1] + r() * (area[3] - area[1]), s: 180 + r() * 420, a: .25 + r() * .6, v: (r() - .3) * 30 });
  return a;
}
const CLOUDS = {
  sea: cloudField(5, 90, [-3500, 2100, 3500, 2700]),
  seaFar: cloudField(6, 60, [-4500, 1500, 4500, 1900]),
  descent: cloudField(7, 46, [-1400, -2700, 1400, -900]),
  fog: cloudField(8, 26, [-1800, 1100, 1800, 3400]),
};
function drawPuffs(c, cam, p, field, tw, col, alpha, shake, stretchY = .42) {
  c.save(); camApply(c, cam, p, shake);
  const img = tintPuff(col);
  for (const q of field) {
    const x = q.x + q.v * tw;
    c.globalAlpha = q.a * alpha;
    c.drawImage(img, x - q.s, q.y - q.s * stretchY, q.s * 2, q.s * 2 * stretchY);
  }
  c.restore(); c.globalAlpha = 1;
}
const _puffCache = {};
function tintPuff(col) {
  if (_puffCache[col]) return _puffCache[col];
  const cc = mkCanvas(256, 256), g = cc.getContext('2d');
  g.drawImage(TEX.puff, 0, 0); g.globalCompositeOperation = 'source-in'; g.fillStyle = col; g.fillRect(0, 0, 256, 256);
  return (_puffCache[col] = cc);
}

// --- the cliff with ledge (world coords, lip at 0,0)
const CLIFF_BASE = [[-4000, -4600], [-600, -4600], [-560, -3200], [-500, -2200], [-520, -1500], [-470, -800], [-455, -380], [-420, -120], [-395, -18],
  [-360, 0], [-300, -4], [-250, 1], [-170, -2], [-110, 1], [-62, -4], [-40, -24], [-22, -30], [-8, -14], [2, 4],
  [-14, 50], [-60, 140], [-110, 260], [-150, 420], [-168, 640], [-150, 900], [-185, 1250], [-160, 1700], [-210, 2300], [-150, 3000], [-240, 4200], [-4000, 4200]];
const CLIFF = (() => { // subdivide + jitter the outline so it reads as rock, keep the lip area exact
  const out = [], r = rng(4242);
  for (let i = 0; i < CLIFF_BASE.length - 1; i++) {
    const a = CLIFF_BASE[i], b = CLIFF_BASE[i + 1];
    out.push(a);
    const L = Math.hypot(b[0] - a[0], b[1] - a[1]);
    const keep = Math.abs(a[1]) < 60 && a[0] > -420 && b[0] > -420; // ledge & lip stay clean
    if (keep || L < 60 || Math.abs(a[0]) > 3000 || Math.abs(b[0]) > 3000) continue;
    const n = Math.floor(L / 46);
    const nx = -(b[1] - a[1]) / L, ny = (b[0] - a[0]) / L;
    for (let k = 1; k < n; k++) { const u = k / n, j = (fbm1(i * 7.1 + u * 5.3) * 46 + (r() - .5) * 14); out.push([lerp(a[0], b[0], u) + nx * j, lerp(a[1], b[1], u) + ny * j]); }
  }
  out.push(CLIFF_BASE[CLIFF_BASE.length - 1]);
  return out;
})();
function drawCliff(c, cam, shake, tone) {
  c.save(); camApply(c, cam, 1, shake);
  c.beginPath(); c.moveTo(...CLIFF[0]); for (const p of CLIFF) c.lineTo(p[0], p[1]); c.closePath();
  const pat = c.createPattern(TEX.rock, 'repeat'); pat.setTransform(new DOMMatrix().scale(1.4));
  c.save(); c.clip();
  c.fillStyle = pat; c.fillRect(-4200, -4800, 8000, 9200);
  // shading: darker deep in rock, light from right
  const g = c.createLinearGradient(-700, 0, 20, 0);
  g.addColorStop(0, tone.deep); g.addColorStop(.75, rgba('#000000', .25)); g.addColorStop(1, rgba('#000000', 0));
  c.fillStyle = g; c.fillRect(-4200, -4800, 8000, 9200);
  c.globalCompositeOperation = 'multiply'; c.fillStyle = tone.mult; c.fillRect(-4200, -4800, 8000, 9200);
  c.globalCompositeOperation = 'source-over';
  c.restore();
  // rim light along exposed edges
  c.lineJoin = 'round';
  c.strokeStyle = tone.rim; c.lineWidth = 4 / cam.z; c.beginPath();
  for (let i = 1; i < CLIFF.length - 2; i++) { c.lineTo(CLIFF[i][0], CLIFF[i][1]); }
  c.stroke();
  c.strokeStyle = tone.rimSoft; c.lineWidth = 16 / cam.z; c.globalAlpha = .35; c.stroke(); c.globalAlpha = 1;
  c.restore();
}
// small rocks on the ledge surface
const LEDGE_ROCKS = (() => { const r = rng(77), a = []; for (let i = 0; i < 9; i++) a.push([-380 + r() * 320, 1, 3 + r() * 6]); return a; })();
function drawLedgeRocks(c, cam, shake, col) {
  c.save(); camApply(c, cam, 1, shake); c.fillStyle = col;
  for (const [x, y, s] of LEDGE_ROCKS) { c.beginPath(); c.ellipse(x, y - s * .3, s, s * .6, 0, 0, TAU); c.fill(); }
  c.restore();
}

// --- rope
function ropePath(c, pts) { c.beginPath(); c.moveTo(...pts[0]); for (let i = 1; i < pts.length; i++) c.lineTo(...pts[i]); }
function drawRope(c, pts, w, col, hi, glow) {
  c.lineCap = 'round'; c.lineJoin = 'round';
  if (glow) { c.save(); c.strokeStyle = glow; for (const [k, a] of [[7, .06], [4.5, .1], [2.6, .16]]) { c.lineWidth = w * k; c.globalAlpha = a; ropePath(c, pts); c.stroke(); } c.restore(); }
  c.strokeStyle = col; c.lineWidth = w; ropePath(c, pts); c.stroke();
  c.strokeStyle = hi; c.lineWidth = w * .3; c.save(); c.translate(-w * .18, -w * .18); ropePath(c, pts); c.stroke(); c.restore();
}
// sagging segment between A and B (sag in px, wobble)
function sagPts(A, B, sag, t, wob = 0, n = 24) {
  const pts = [];
  for (let i = 0; i <= n; i++) {
    const u = i / n, x = lerp(A[0], B[0], u), y = lerp(A[1], B[1], u);
    const s = Math.sin(u * Math.PI) * sag;
    const w = Math.sin(u * Math.PI) * wob * n1(t * 9 + u * 3);
    pts.push([x + s * .35 + w, y + s * .15 + w * .4]);
  }
  return pts;
}

// --- snow & wind streaks, screen space with camera-relative motion (= motion blur streaks)
const SNOW = (() => { const r = rng(909), a = []; for (let i = 0; i < 420; i++) a.push({ x: r(), y: r(), d: .25 + Math.pow(r(), 2) * 1.6, ph: r() * 10 }); return a; })();
function drawSnow(c, t, cam, camPrev, o) {
  const tw = WARP.at(t), sp = WARP.speed(t);
  const dcx = (cam.x - camPrev.x) * cam.z, dcy = (cam.y - camPrev.y) * cam.z; // px per frame
  const n = Math.floor(SNOW.length * (o.density ?? 1));
  c.save();
  for (let i = 0; i < n; i++) {
    const q = SNOW[i], d = q.d;
    const vx = (o.wind ?? 220) * d, vy = (o.fall ?? 140) * d;
    let x = q.x * (W + 400) + vx * tw + n1(tw * .7 + q.ph) * 30 * d - cam.x * cam.z * d * .9;
    let y = q.y * (H + 400) + vy * tw - cam.y * cam.z * d * .9;
    x = ((x % (W + 400)) + W + 400) % (W + 400) - 200; y = ((y % (H + 400)) + H + 400) % (H + 400) - 200;
    const r = (1.2 + d * 2.6) * (o.size ?? 1);
    // streak = relative motion during exposure
    const ex = (vx * sp / 60 * .6 - dcx * d * .9 * .8), ey = (vy * sp / 60 * .6 - dcy * d * .9 * .8);
    const a = (o.alpha ?? .8) * (d > 1.2 ? .55 : .9);
    c.strokeStyle = o.col || 'rgba(235,242,255,1)'; c.globalAlpha = a; c.lineCap = 'round'; c.lineWidth = r * 2;
    if (d > 1.35) { // near flakes: out of focus bokeh sprite stretched along the motion
      const L = Math.hypot(ex, ey), sz = r * 5;
      c.save(); c.translate(x - ex / 2, y - ey / 2); c.rotate(Math.atan2(ey, ex)); c.globalAlpha = a * .7;
      c.drawImage(TEX.dot, -sz / 2 - L / 2, -sz / 2, sz + L, sz); c.restore();
    } else { c.beginPath(); c.moveTo(x, y); c.lineTo(x - ex, y - ey + .01); c.stroke(); }
  }
  c.restore(); c.globalAlpha = 1;
}
// --- light rays from a screen point
const RAYBUF = (() => { const cc = mkCanvas(W / 6, H / 6); return { c: cc, g: cc.getContext('2d') }; })();
function drawRays(c, sx, sy, k, col, t, n = 9, len = 2600) {
  if (k <= 0) return;
  const g = RAYBUF.g; g.setTransform(1, 0, 0, 1, 0, 0); g.clearRect(0, 0, W, H); g.setTransform(1 / 6, 0, 0, 1 / 6, 0, 0);
  raysInto(g, sx, sy, k * .55, col, t, n, len);
  c.save(); c.globalCompositeOperation = 'screen'; c.imageSmoothingQuality = 'high'; c.drawImage(RAYBUF.c, 0, 0, W, H); c.restore();
}
function raysInto(c, sx, sy, k, col, t, n, len) {
  c.save(); c.globalCompositeOperation = 'lighter';
  for (let i = 0; i < n; i++) {
    const a = 1.9 + i * .16 + n1(t * .2 + i * 3) * .05, w = .035 + .03 * h2(i, 3);
    const g = c.createRadialGradient(sx, sy, 0, sx, sy, len);
    g.addColorStop(0, rgba(col, .32 * k)); g.addColorStop(1, rgba(col, 0));
    c.fillStyle = g; c.beginPath(); c.moveTo(sx, sy);
    c.lineTo(sx + Math.cos(a - w) * len, sy + Math.sin(a - w) * len); c.lineTo(sx + Math.cos(a + w) * len, sy + Math.sin(a + w) * len); c.fill();
  }
  const g2 = c.createRadialGradient(sx, sy, 0, sx, sy, 700);
  g2.addColorStop(0, rgba(col, .55 * k)); g2.addColorStop(1, rgba(col, 0));
  c.fillStyle = g2; c.fillRect(0, 0, W, H);
  c.restore();
}
function vignette(c, k = .55, col = '#000000') {
  const g = c.createRadialGradient(W / 2, H * .48, H * .25, W / 2, H * .5, H * .78);
  g.addColorStop(0, rgba(col, 0)); g.addColorStop(1, rgba(col, k));
  c.fillStyle = g; c.fillRect(0, 0, W, H);
}
function grain(c, t, k = .07) {
  const f = TEX.grain[Math.floor(t * 24) % TEX.grain.length];
  c.save(); c.globalCompositeOperation = 'overlay'; c.globalAlpha = k;
  const ox = Math.floor(h2(Math.floor(t * 24), 1) * 384), oy = Math.floor(h2(Math.floor(t * 24), 2) * 384);
  c.translate(-ox, -oy); c.fillStyle = c.createPattern(f, 'repeat'); c.fillRect(0, 0, W + 384, H + 384);
  c.restore();
}
