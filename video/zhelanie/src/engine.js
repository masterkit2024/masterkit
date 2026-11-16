// ===== Core helpers, easing, text, camera, FX =====
const W = 1080, H = 1920, FPS = 30;
const OUT = '#17132b';
const TAU = Math.PI * 2;

const clamp = (v, a = 0, b = 1) => Math.max(a, Math.min(b, v));
const lerp = (a, b, t) => a + (b - a) * t;
const inv = (a, b, v) => clamp((v - a) / (b - a));
const ease = {
  lin: t => t,
  inQ: t => t * t,
  outQ: t => 1 - (1 - t) * (1 - t),
  inC: t => t * t * t,
  outC: t => 1 - Math.pow(1 - t, 3),
  io: t => t < .5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2,
  ioS: t => t * t * (3 - 2 * t),
  outBack: (t, k = 1.9) => 1 + (k + 1) * Math.pow(t - 1, 3) + k * Math.pow(t - 1, 2),
  outElastic: t => t === 0 ? 0 : t === 1 ? 1 : Math.pow(2, -10 * t) * Math.sin((t * 10 - .75) * (TAU / 3)) + 1,
};
// animate value between times with easing
const tw = (t, t0, t1, a, b, e = ease.io) => lerp(a, b, e(inv(t0, t1, t)));
function hash(n) { const s = Math.sin(n * 127.1 + 311.7) * 43758.5453; return s - Math.floor(s); }
const noise1 = (x) => { const i = Math.floor(x), f = x - i; const u = f * f * (3 - 2 * f); return lerp(hash(i), hash(i + 1), u) * 2 - 1; };

// Monotone-ish keyframe track: [[t,v],...] with smooth (Catmull-Rom) interpolation
function track(keys, t) {
  if (t <= keys[0][0]) return keys[0][1];
  if (t >= keys[keys.length - 1][0]) return keys[keys.length - 1][1];
  let i = 0; while (keys[i + 1][0] < t) i++;
  const p0 = keys[Math.max(0, i - 1)], p1 = keys[i], p2 = keys[i + 1], p3 = keys[Math.min(keys.length - 1, i + 2)];
  const u = (t - p1[0]) / (p2[0] - p1[0]);
  const dt = p2[0] - p1[0];
  const m1 = (p2[1] - p0[1]) / (p2[0] - p0[0] || 1) * dt;
  const m2 = (p3[1] - p1[1]) / (p3[0] - p1[0] || 1) * dt;
  const u2 = u * u, u3 = u2 * u;
  return (2 * u3 - 3 * u2 + 1) * p1[1] + (u3 - 2 * u2 + u) * m1 + (-2 * u3 + 3 * u2) * p2[1] + (u3 - u2) * m2;
}

function rr(ctx, x, y, w, h, r) {
  ctx.beginPath(); ctx.moveTo(x + r, y); ctx.arcTo(x + w, y, x + w, y + h, r); ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r); ctx.arcTo(x, y, x + w, y, r); ctx.closePath();
}
function fillStroke(ctx, fill, lw = 6, stroke = OUT) {
  if (fill) { ctx.fillStyle = fill; ctx.fill(); }
  if (lw) { ctx.lineWidth = lw; ctx.strokeStyle = stroke; ctx.lineJoin = 'round'; ctx.stroke(); }
}
function circle(ctx, x, y, r, fill, lw = 0, stroke = OUT) { ctx.beginPath(); ctx.arc(x, y, r, 0, TAU); fillStroke(ctx, fill, lw, stroke); }
function ell(ctx, x, y, rx, ry, fill, lw = 0, rot = 0) { ctx.beginPath(); ctx.ellipse(x, y, Math.max(.1, rx), Math.max(.1, ry), rot, 0, TAU); fillStroke(ctx, fill, lw); }
function line(ctx, x1, y1, x2, y2, w, col, cap = 'round') { ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.lineWidth = w; ctx.strokeStyle = col; ctx.lineCap = cap; ctx.stroke(); }
function poly(ctx, pts, fill, lw = 6) { ctx.beginPath(); ctx.moveTo(pts[0], pts[1]); for (let i = 2; i < pts.length; i += 2) ctx.lineTo(pts[i], pts[i + 1]); ctx.closePath(); fillStroke(ctx, fill, lw); }
function vgrad(ctx, y0, y1, stops) { const g = ctx.createLinearGradient(0, y0, 0, y1); stops.forEach((c, i) => g.addColorStop(i / (stops.length - 1), c)); return g; }
function rgrad(ctx, x, y, r0, r1, stops) { const g = ctx.createRadialGradient(x, y, r0, x, y, r1); stops.forEach((c, i) => g.addColorStop(i / (stops.length - 1), c)); return g; }
function shadowBlob(ctx, x, y, rx, a = .25) { ctx.save(); ctx.globalAlpha *= a; ell(ctx, x, y, rx, rx * .18, '#000'); ctx.restore(); }

// Camera: world point (cx,cy) to screen centre, zoom z, rotation r
function cam(ctx, cx, cy, z = 1, r = 0, sx = W / 2, sy = H / 2) { ctx.translate(sx, sy); ctx.rotate(r); ctx.scale(z, z); ctx.translate(-cx, -cy); }
// small handheld shake
function shake(t, amp, freq = 9, seed = 0) { return { x: noise1(t * freq + seed) * amp, y: noise1(t * freq + 50 + seed) * amp, r: noise1(t * freq * .7 + 90 + seed) * amp * .0015 }; }

// ===== Text =====
const F_HEAD = '"Rubik", sans-serif';
const F_STAMP = '"Russo One", "Rubik", sans-serif';
function text(ctx, str, x, y, o = {}) {
  const size = o.size || 80;
  ctx.save();
  ctx.translate(x, y);
  if (o.rot) ctx.rotate(o.rot);
  const sc = o.scale ?? 1; ctx.scale(sc * (o.sx || 1), sc * (o.sy || 1));
  ctx.globalAlpha *= (o.alpha ?? 1);
  ctx.font = `${o.weight || 900} ${size}px ${o.font || F_HEAD}`;
  ctx.textAlign = o.align || 'center'; ctx.textBaseline = 'middle';
  if (o.ls) ctx.letterSpacing = o.ls + 'px';
  const lines = String(str).split('\n'); const lh = size * (o.lh || 1.05);
  lines.forEach((ln, i) => {
    const yy = (i - (lines.length - 1) / 2) * lh;
    if (o.shadow !== false) { ctx.fillStyle = 'rgba(0,0,0,.35)'; ctx.fillText(ln, 0, yy + size * .09); }
    if (o.stroke !== false) { ctx.lineJoin = 'round'; ctx.lineWidth = o.sw || size * .2; ctx.strokeStyle = o.strokeCol || OUT; ctx.strokeText(ln, 0, yy); }
    ctx.fillStyle = o.fill || '#fff'; ctx.fillText(ln, 0, yy);
  });
  ctx.restore();
}
// pop-in scale with overshoot; returns 0..~1.1
function pop(t, t0, d = .35) { if (t < t0) return 0; return ease.outBack(clamp((t - t0) / d), 2.2); }
function popOut(t, t1, d = .2) { return 1 - ease.inQ(inv(t1, t1 + d, t)); }

// Stamp label (meme style) with slam
function stamp(ctx, str, x, y, t, t0, o = {}) {
  if (t < t0) return; const tOut = o.out ?? 1e9;
  const k = clamp((t - t0) / .22); const slam = k < 1 ? lerp(2.4, 1, ease.outC(k)) : 1 + Math.sin((t - t0 - .22) * 30) * Math.exp(-(t - t0 - .22) * 9) * .06;
  const a = Math.min(clamp((t - t0) / .08), popOut(t, tOut, .2));
  if (a <= 0) return;
  ctx.save(); ctx.globalAlpha *= a;
  const size = o.size || 100;
  ctx.font = `400 ${size}px ${F_STAMP}`;
  const lines = str.split('\n');
  const tw_ = Math.max(...lines.map(l => ctx.measureText(l).width));
  ctx.translate(x, y); ctx.rotate(o.rot ?? -0.05); ctx.scale(slam, slam);
  if (o.box !== false) {
    const pw = tw_ + size * .7, ph = size * (lines.length * 1.1 + .5);
    rr(ctx, -pw / 2, -ph / 2, pw, ph, size * .22); fillStroke(ctx, o.bg || '#ffe14d', size * .1);
  }
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  lines.forEach((ln, i) => {
    const yy = (i - (lines.length - 1) / 2) * size * 1.1 + size * .04;
    if (o.box === false) { ctx.lineJoin = 'round'; ctx.lineWidth = size * .22; ctx.strokeStyle = OUT; ctx.strokeText(ln, 0, yy); }
    ctx.fillStyle = o.fill || OUT; ctx.fillText(ln, 0, yy);
  });
  ctx.restore();
}

// ===== FX =====
// Ripple rings where something phases through a surface. axis: 'v' (vertical wall) or 'h' (floor)
function ripple(ctx, x, y, t, t0, o = {}) {
  const n = o.n || 3, dur = o.dur || 1.1, size = o.size || 160, axis = o.axis || 'v';
  for (let i = 0; i < n; i++) {
    const lt = t - t0 - i * (o.gap || .18); if (lt < 0 || lt > dur) continue;
    const k = lt / dur; const r = size * ease.outC(k);
    ctx.save(); ctx.globalAlpha *= (1 - k) * .9;
    ctx.beginPath();
    if (axis === 'v') ctx.ellipse(x, y, r * .28, r, 0, 0, TAU); else ctx.ellipse(x, y, r, r * .26, 0, 0, TAU);
    ctx.lineWidth = 10 * (1 - k) + 2; ctx.strokeStyle = o.col || '#5ff4ff'; ctx.stroke();
    ctx.restore();
  }
}
// glow aura for phasing (draw before character)
function aura(ctx, x, y, r, a = 1, col = '95,244,255') {
  if (a <= 0) return;
  ctx.save(); ctx.globalAlpha *= a;
  ctx.fillStyle = rgrad(ctx, x, y, 0, r, [`rgba(${col},.55)`, `rgba(${col},.18)`, `rgba(${col},0)`]);
  ctx.fillRect(x - r, y - r, r * 2, r * 2); ctx.restore();
}
function sparkles(ctx, x, y, t, t0, o = {}) {
  const n = o.n || 10, dur = o.dur || .8, R = o.r || 140;
  const lt = t - t0; if (lt < 0 || lt > dur) return;
  const k = lt / dur;
  for (let i = 0; i < n; i++) {
    const a = hash(i + (o.seed || 0)) * TAU, d = R * (.4 + hash(i + 9) * .8) * ease.outC(k);
    const px = x + Math.cos(a) * d, py = y + Math.sin(a) * d, s = (1 - k) * (14 + hash(i + 3) * 14);
    star4(ctx, px, py, s, o.col || '#fff6a8');
  }
}
function star4(ctx, x, y, s, col) {
  if (s <= 0) return;
  ctx.beginPath(); ctx.moveTo(x, y - s); ctx.quadraticCurveTo(x, y, x + s, y); ctx.quadraticCurveTo(x, y, x, y + s);
  ctx.quadraticCurveTo(x, y, x - s, y); ctx.quadraticCurveTo(x, y, x, y - s); ctx.fillStyle = col; ctx.fill();
}
// speed lines (vertical streaks), dir=-1 lines go up (falling)
function speedLines(ctx, t, o = {}) {
  const n = o.n || 40, spd = o.spd || 3000, col = o.col || 'rgba(255,255,255,.5)';
  ctx.save(); ctx.strokeStyle = col; ctx.lineCap = 'round';
  for (let i = 0; i < n; i++) {
    const x = (o.x0 ?? 0) + hash(i * 3.1 + (o.seed || 0)) * (o.w || W);
    const len = (o.len || 260) * (.5 + hash(i + 7));
    const y = ((hash(i + 11) * (H + len) - t * spd * (.6 + hash(i + 5) * .8)) % (H + len) + (H + len)) % (H + len) - len;
    ctx.lineWidth = (o.lw || 6) * (.4 + hash(i + 2));
    ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x, y + len); ctx.stroke();
  }
  ctx.restore();
}
function vignette(ctx, a = .45, col = '0,0,0') {
  const g = ctx.createRadialGradient(W / 2, H / 2, H * .25, W / 2, H / 2, H * .75);
  g.addColorStop(0, `rgba(${col},0)`); g.addColorStop(1, `rgba(${col},${a})`);
  ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
}
// simple 3-point "light rays"
function rays(ctx, x, y, t, o = {}) {
  const n = o.n || 12; ctx.save(); ctx.globalAlpha *= o.a ?? .25; ctx.translate(x, y); ctx.rotate(t * (o.spin ?? .2));
  ctx.fillStyle = o.col || '#fff';
  for (let i = 0; i < n; i++) { ctx.rotate(TAU / n); ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(-o.w || -60, -(o.r || 1400)); ctx.lineTo(o.w || 60, -(o.r || 1400)); ctx.closePath(); ctx.fill(); }
  ctx.restore();
}
