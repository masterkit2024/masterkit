// ===== Environments =====
const CUTS = [[29.82, 31.55, 3.05], [38.08, 40.04, 1.83], [61.19, 62.26, 1.84]];
function V(v) { let off = 0; for (const [c, r, L] of CUTS) { const D = (c + .05 + L + .15) - r; if (v > c && v < r) v = r; if (v >= r) off += D; } return v + off; }
const CLIP = [29.87, 39.65, 62.83];

// Monotone cubic interpolation (no overshoot)
function trackM(keys, t) {
  const n = keys.length; if (t <= keys[0][0]) return keys[0][1]; if (t >= keys[n - 1][0]) return keys[n - 1][1];
  if (!keys._m) {
    const d = [], m = [];
    for (let i = 0; i < n - 1; i++) d.push((keys[i + 1][1] - keys[i][1]) / (keys[i + 1][0] - keys[i][0]));
    m.push(d[0]); for (let i = 1; i < n - 1; i++) m.push(d[i - 1] * d[i] <= 0 ? 0 : (d[i - 1] + d[i]) / 2); m.push(d[n - 2]);
    for (let i = 0; i < n - 1; i++) { if (d[i] === 0) { m[i] = m[i + 1] = 0; continue; } const a = m[i] / d[i], b = m[i + 1] / d[i], s = a * a + b * b; if (s > 9) { const tt = 3 / Math.sqrt(s); m[i] = tt * a * d[i]; m[i + 1] = tt * b * d[i]; } }
    keys._m = m;
  }
  let i = 0; while (keys[i + 1][0] < t) i++;
  const h = keys[i + 1][0] - keys[i][0], u = (t - keys[i][0]) / h, m = keys._m;
  const u2 = u * u, u3 = u2 * u;
  return (2 * u3 - 3 * u2 + 1) * keys[i][1] + (u3 - 2 * u2 + u) * h * m[i] + (-2 * u3 + 3 * u2) * keys[i + 1][1] + (u3 - u2) * h * m[i + 1];
}

function wallpaper(ctx, x0, y0, w, h, c1, c2, stripe = 70) {
  ctx.fillStyle = c1; ctx.fillRect(x0, y0, w, h);
  ctx.fillStyle = c2; for (let x = x0 - (x0 % stripe); x < x0 + w; x += stripe) ctx.fillRect(x, y0, stripe * .35, h);
}
function floorBoards(ctx, x0, y, w, h, c1 = '#c8834a', c2 = '#b06e38') {
  ctx.fillStyle = c1; ctx.fillRect(x0, y, w, h);
  ctx.strokeStyle = c2; ctx.lineWidth = 4;
  for (let i = 1; i < 6; i++) { ctx.beginPath(); ctx.moveTo(x0, y + i * h / 6); ctx.lineTo(x0 + w, y + i * h / 6); ctx.stroke(); }
  line(ctx, x0, y, x0 + w, y, 8, OUT, 'butt');
}
function windowFrame(ctx, x, y, w, h, sky = ['#7fd4ff', '#d8f3ff'], t = 0) {
  rr(ctx, x - 14, y - 14, w + 28, h + 28, 10); fillStroke(ctx, '#fff', 6);
  ctx.save(); rr(ctx, x, y, w, h, 4); ctx.clip(); ctx.fillStyle = vgrad(ctx, y, y + h, sky); ctx.fillRect(x, y, w, h);
  circle(ctx, x + w * .7, y + h * .35, 46, '#fff3a0'); ell(ctx, x + w * .3 + Math.sin(t * .3) * 20, y + h * .3, 70, 26, 'rgba(255,255,255,.9)');
  ctx.fillStyle = '#6aa0d8'; for (let i = 0; i < 5; i++) ctx.fillRect(x + i * w / 5 + 6, y + h * .62 - hash(i) * 60, w / 5 - 12, h);
  ctx.restore(); rr(ctx, x, y, w, h, 4); fillStroke(ctx, null, 6);
  line(ctx, x + w / 2, y, x + w / 2, y + h, 10, '#fff', 'butt'); line(ctx, x, y + h / 2, x + w, y + h / 2, 10, '#fff', 'butt');
}
function plant(ctx, x, y, s = 1) {
  for (let i = 0; i < 5; i++) { ctx.save(); ctx.translate(x, y - 60 * s); ctx.rotate(-.8 + i * .4); ell(ctx, 0, -60 * s, 22 * s, 64 * s, i % 2 ? '#3ccf6e' : '#2fae5a', 5); ctx.restore(); }
  poly(ctx, [x - 50 * s, y - 80 * s, x + 50 * s, y - 80 * s, x + 38 * s, y, x - 38 * s, y], '#ff7a59', 6);
}
function lampCeil(ctx, x, y, len = 160, on = 1) {
  line(ctx, x, y, x, y + len, 5, OUT);
  ctx.save(); ctx.globalAlpha *= .35 * on; ctx.fillStyle = rgrad(ctx, x, y + len + 30, 0, 420, ['rgba(255,240,180,.9)', 'rgba(255,240,180,0)']); ctx.fillRect(x - 420, y + len - 390, 840, 840); ctx.restore();
  poly(ctx, [x - 60, y + len + 40, x + 60, y + len + 40, x + 28, y + len, x - 28, y + len], '#ffe14d', 6);
}
function sofa(ctx, x, y, col = '#5b6cff', w = 420) {
  rr(ctx, x - w / 2, y - 210, w, 130, 30); fillStroke(ctx, col, 6);
  rr(ctx, x - w / 2 + 10, y - 110, w - 20, 70, 20); fillStroke(ctx, col, 6);
  rr(ctx, x - w / 2 - 30, y - 150, 70, 120, 26); fillStroke(ctx, col, 6); rr(ctx, x + w / 2 - 40, y - 150, 70, 120, 26); fillStroke(ctx, col, 6);
  line(ctx, x - w / 2 + 10, y - 40, x - w / 2 + 10, y, 12, OUT); line(ctx, x + w / 2 - 10, y - 40, x + w / 2 - 10, y, 12, OUT);
}
function concrete(ctx, x0, y0, w, h, col = '#9aa3b5') {
  ctx.fillStyle = col; ctx.fillRect(x0, y0, w, h);
  ctx.fillStyle = 'rgba(0,0,0,.12)'; for (let i = 0; i < w / 40; i++) circle(ctx, x0 + hash(i + y0) * w, y0 + hash(i * 7 + y0) * h, 3 + hash(i) * 5, 'rgba(0,0,0,.12)');
  line(ctx, x0, y0, x0 + w, y0, 6, OUT, 'butt'); line(ctx, x0, y0 + h, x0 + w, y0 + h, 6, OUT, 'butt');
}
// starfield
function stars(ctx, t, n = 140, seed = 0) {
  ctx.fillStyle = '#fff';
  for (let i = 0; i < n; i++) { const x = hash(i + seed) * W, y = hash(i * 3 + seed + 1) * H, r = .8 + hash(i + 5) * 2.6; ctx.globalAlpha = .4 + .6 * (.5 + .5 * Math.sin(t * 2 + i)); ctx.beginPath(); ctx.arc(x, y, r, 0, TAU); ctx.fill(); }
  ctx.globalAlpha = 1;
}
// Earth cutaway diagram; returns helpers
function earthDiagram(ctx, cx, cy, R, t, o = {}) {
  ctx.save();
  ctx.fillStyle = rgrad(ctx, cx, cy, R * .9, R * 1.35, ['rgba(90,180,255,.35)', 'rgba(90,180,255,0)']); ctx.fillRect(cx - R * 1.4, cy - R * 1.4, R * 2.8, R * 2.8);
  circle(ctx, cx, cy, R, '#2f8cff', 8);
  // left half: surface; right half: layers
  ctx.save(); ctx.beginPath(); ctx.arc(cx, cy, R - 4, 0, TAU); ctx.clip();
  ctx.fillStyle = '#3ad07a';
  const land = [[-.6, -.6, .35, .22], [-.75, .1, .2, .35], [-.3, .5, .3, .18], [-.45, -.15, .18, .12], [.1, -.75, .3, .12], [.2, .7, .25, .12]];
  land.forEach(([a, b, c, d]) => { ctx.beginPath(); ctx.ellipse(cx + a * R, cy + b * R, c * R, d * R, a, 0, TAU); ctx.fill(); });
  ctx.beginPath(); ctx.rect(cx, cy - R, R, R * 2); ctx.clip();
  const layers = [[1, '#8a5a3a'], [.94, '#ff6a2b'], [.55, '#ffad33'], [.2, '#fff4a8']];
  layers.forEach(([k, c]) => circle(ctx, cx, cy, R * k, c, 5));
  ctx.restore();
  line(ctx, cx, cy - R, cx, cy + R, 6, OUT, 'butt');
  circle(ctx, cx, cy, R, null, 8);
  if (o.labels) {
    ctx.save(); ctx.globalAlpha *= o.labels;
    text(ctx, 'мантия', cx + R * .74, cy - R * .2, { size: 30, weight: 800 }); text(ctx, 'ядро', cx + R * .38, cy + R * .1, { size: 30, weight: 800 });
    ctx.restore();
  }
  // path line
  ctx.setLineDash([22, 16]); ctx.lineDashOffset = -t * 60; line(ctx, cx, cy - R - 40, cx, cy + R + 40, 7, '#fff'); ctx.setLineDash([]);
  ctx.restore();
}
function heroIcon(ctx, x, y, s, t, o = {}) {
  ctx.save(); ctx.translate(x, y); ctx.rotate(o.rot || 0);
  aura(ctx, 0, 0, 120 * s, .8);
  ctx.translate(0, 120 * s * .9);
  person(ctx, { x: 0, y: 0, s: s * .9, emo: o.emo || 'scream', ...POSE.flail(t), blink: 0, pal: o.pal || PAL.hero, face: 0, look: { x: 0, y: o.lookY ?? -1 } });
  if (o.beard) { const hc = { x: 0, y: -330 * s * .9 }; ctx.save(); ctx.globalAlpha *= o.beard; ctx.beginPath(); ctx.moveTo(hc.x - 55 * s, hc.y + 20 * s); ctx.quadraticCurveTo(hc.x, hc.y + 170 * s * o.beard, hc.x + 55 * s, hc.y + 20 * s); ctx.quadraticCurveTo(hc.x, hc.y + 70 * s, hc.x - 55 * s, hc.y + 20 * s); fillStroke(ctx, '#e8e8f0', 5 * s); ctx.restore(); }
  ctx.restore();
}
function timerBox(ctx, x, y, secs, o = {}) {
  const m = Math.floor(secs / 60), s = Math.floor(secs % 60);
  const str = String(m).padStart(2, '0') + ':' + String(s).padStart(2, '0');
  ctx.save(); ctx.translate(x, y); const sc = o.scale ?? 1; ctx.scale(sc, sc);
  rr(ctx, -200, -70, 400, 140, 34); fillStroke(ctx, '#111', 8, '#fff');
  ctx.font = `900 92px ${F_HEAD}`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillStyle = o.col || '#5ff4ff'; ctx.fillText(str, 0, 6);
  if (o.label) text(ctx, o.label, 0, -112, { size: 40, weight: 800 });
  ctx.restore();
}
function sun(ctx, x, y, r, t) {
  rays(ctx, x, y, t, { n: 12, a: .5, col: '#ffd23f', r: r * 1.7, w: r * .25, spin: .4 });
  circle(ctx, x, y, r, '#ffd23f', 7); ctx.save(); ctx.globalAlpha = .5; circle(ctx, x - r * .25, y - r * .25, r * .45, '#fff6a8'); ctx.restore();
}
function saltShaker(ctx, x, y, s = 1, rot = 0) {
  ctx.save(); ctx.translate(x, y); ctx.rotate(rot); ctx.scale(s, s);
  rr(ctx, -26, -40, 52, 74, 14); fillStroke(ctx, '#f4f7ff', 5); rr(ctx, -24, -62, 48, 26, 12); fillStroke(ctx, '#c9d2e6', 5);
  for (let i = -1; i <= 1; i++) circle(ctx, i * 12, -54, 3, OUT);
  ctx.font = `900 28px ${F_HEAD}`; ctx.textAlign = 'center'; ctx.fillStyle = OUT; ctx.fillText('С', 0, 2);
  ctx.restore();
}
function bubbles(ctx, t, o = {}) {
  ctx.save(); ctx.strokeStyle = 'rgba(255,255,255,.7)'; ctx.lineWidth = 4;
  for (let i = 0; i < (o.n || 30); i++) { const x = hash(i + 3) * W + Math.sin(t * 3 + i) * 20; const sp = (o.spd || 400) * (.5 + hash(i)); const y = ((hash(i + 8) * H - t * sp * (o.dir || 1)) % H + H) % H; ctx.beginPath(); ctx.arc(x, y, 6 + hash(i + 1) * 16, 0, TAU); ctx.stroke(); }
  ctx.restore();
}
