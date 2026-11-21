// Shared template: sunburst bg, HUD, subtitles, stickers/plaques, particles, mini crowd people
const C = require('../viz/core');
const { hex, rgba, mix, clamp, lerp, easeOut, easeIO, rng } = C;
const INK = '#160b1e';
const FONT = 'Inter';
const SAFE_T = 120, SAFE_B = 220;
function ol(c, lw = 5) { c.lineWidth = lw; c.strokeStyle = INK; c.lineJoin = 'round'; c.lineCap = 'round'; c.stroke(); }
function rr(c, x, y, w, h, r) { c.beginPath(); c.roundRect(x, y, w, h, r); }
// bounce 0 -> 1.15 -> 1
function bounce(k) { k = clamp(k); if (k < 0.6) return easeOut(k / 0.6) * 1.15; return 1.15 - 0.15 * easeIO((k - 0.6) / 0.4); }
// ---------- background ----------
function sunburst(c, t, pal, o = {}) {
  const base = hex(pal[0]), ray = hex(pal[1]);
  c.fillStyle = rgba(base); c.fillRect(-200, -200, 1480, 2320);
  const n = 18, cx = o.cx ?? 540, cy = o.cy ?? 820, rot = t * (o.speed ?? 0.18);
  c.save(); c.translate(cx, cy); c.rotate(rot);
  c.fillStyle = rgba(ray, o.rayA ?? 0.55);
  for (let i = 0; i < n; i++) { const a0 = i / n * 6.2832, a1 = a0 + 6.2832 / n / 2; c.beginPath(); c.moveTo(0, 0); c.arc(0, 0, 2600, a0, a1); c.closePath(); c.fill(); }
  c.restore();
  // soft center glow (background only)
  const g = c.createRadialGradient(cx, cy, 0, cx, cy, 900); g.addColorStop(0, rgba(mix(ray, [255, 255, 255], 0.3), 0.35)); g.addColorStop(1, rgba(base, 0)); c.fillStyle = g; c.fillRect(-200, -200, 1480, 2320);
}
function vignette(c, W, H) { const g = c.createRadialGradient(W / 2, H * 0.45, W * 0.35, W / 2, H * 0.5, H * 0.75); g.addColorStop(0, 'rgba(0,0,0,0)'); g.addColorStop(1, 'rgba(8,0,16,0.75)'); c.fillStyle = g; c.fillRect(0, 0, W, H); }
// ---------- HUD ----------
function pill(c, x, y, w, h, col, txt, size, tcol = '#fff', align = 'center') {
  rr(c, x, y, w, h, h / 2); c.fillStyle = col; c.fill(); ol(c, 6);
  c.font = `900 ${size}px ${FONT}`; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillStyle = tcol; c.fillText(txt, x + w / 2, y + h / 2 + 3);
}
function hud(c, timer, count, pT = 0, pC = 0) {
  const y = SAFE_T + 10;
  c.save(); c.translate(60 + 150, y + 42); const s1 = 1 + 0.18 * Math.sin(clamp(pT) * Math.PI); c.scale(s1, s1); c.translate(-(60 + 150), -(y + 42));
  pill(c, 60, y, 300, 84, '#ff4fa3', timer, 54); c.restore();
  c.save(); const w = 560, x = 1080 - 60 - w; c.translate(x + w / 2, y + 42); const s2 = 1 + 0.15 * Math.sin(clamp(pC) * Math.PI); c.scale(s2, s2); c.translate(-(x + w / 2), -(y + 42));
  rr(c, x, y, w, 84, 42); c.fillStyle = '#2b1640'; c.fill(); ol(c, 6);
  c.font = `900 38px ${FONT}`; c.textAlign = 'left'; c.textBaseline = 'middle'; c.fillStyle = '#c9ff4a'; c.fillText('ГРЯЗНУЛЕК:', x + 28, y + 45);
  c.fillStyle = '#ffffff'; c.textAlign = 'right'; c.font = `900 ${count.length > 9 ? 34 : 40}px ${FONT}`; c.fillText(count, x + w - 28, y + 45); c.restore();
}
// ---------- subtitles ----------
function subs(c, chunks, t) {
  for (let i = 0; i < chunks.length; i++) {
    const ch = chunks[i], ws = ch.words, s = ws[0].s - 0.05, nx = chunks[i + 1], e = Math.min(ws[ws.length - 1].e + 0.35, nx ? nx.words[0].s - 0.05 : 1e9);
    if (t < s || t > e) continue;
    const parts = ws.map(w => { const big = w.hl; const size = big ? 96 : 76; c.font = `900 ${size}px ${FONT}`; const txt = w.w.toUpperCase(); return { txt, size, w: c.measureText(txt).width, big, s: w.s }; });
    // wrap to max 2 lines, max width 900
    const lines = [[]]; let lw = 0; const sp = 34;
    for (const p of parts) { if (lw + p.w > 900 && lines[lines.length - 1].length) { lines.push([]); lw = 0; } lines[lines.length - 1].push(p); lw += p.w + sp; }
    const baseY = 1920 - SAFE_B - 70 - (lines.length - 1) * 100;
    lines.forEach((ln, li) => {
      const tw = ln.reduce((a, p) => a + p.w, 0) + sp * (ln.length - 1); let x = 540 - tw / 2; const y = baseY + li * 104;
      for (const p of ln) {
        const k = clamp((t - p.s + 0.06) / 0.14); if (k <= 0) { x += p.w + sp; continue; }
        const sc = bounce(k); c.save(); c.translate(x + p.w / 2, y); c.scale(sc, sc); c.rotate(p.big ? -0.03 : 0);
        c.font = `900 ${p.size}px ${FONT}`; c.textAlign = 'center'; c.textBaseline = 'middle';
        c.lineWidth = p.big ? 18 : 15; c.strokeStyle = '#000'; c.lineJoin = 'round'; c.strokeText(p.txt, 0, 0);
        c.fillStyle = p.big ? '#ffe03a' : '#ffffff'; c.fillText(p.txt, 0, 0); c.restore(); x += p.w + sp;
      }
    });
  }
}
// ---------- stickers / plaques ----------
const STK = { pink: ['#ff6fb5', '#fff'], yellow: ['#ffe03a', '#160b1e'], red: ['#ff3b3b', '#fff'], green: ['#7dff6a', '#160b1e'], blue: ['#4fc3ff', '#160b1e'], white: ['#ffffff', '#160b1e'], purple: ['#a35bff', '#fff'] };
function sticker(c, x, y, lines, col, rot, k, size = 64, o = {}) {
  if (k <= 0) return; const [bg, fg] = STK[col] || STK.yellow; lines = Array.isArray(lines) ? lines : [lines];
  c.save(); c.translate(x, y); c.rotate(rot); const s = bounce(k); c.scale(s, s);
  c.font = `900 ${size}px ${FONT}`; const w = Math.max(...lines.map(l => c.measureText(l).width)) + 70, h = lines.length * size * 1.15 + 50;
  rr(c, -w / 2 + 10, -h / 2 + 12, w, h, 26); c.fillStyle = INK; c.fill();
  rr(c, -w / 2, -h / 2, w, h, 26); c.fillStyle = bg; c.fill(); ol(c, 7);
  if (o.tail) { c.beginPath(); c.moveTo(o.tail * w * 0.3 - 20, h / 2 - 3); c.lineTo(o.tail * w * 0.3 + 30 * o.tail, h / 2 + 50); c.lineTo(o.tail * w * 0.3 + 30, h / 2 - 3); c.closePath(); c.fillStyle = bg; c.fill(); ol(c, 7); c.fillRect(o.tail * w * 0.3 - 16, h / 2 - 10, 44, 9); }
  c.fillStyle = fg; c.textAlign = 'center'; c.textBaseline = 'middle';
  lines.forEach((l, i) => c.fillText(l, 0, (i - (lines.length - 1) / 2) * size * 1.15 + 4));
  if (o.strike) { c.strokeStyle = '#ff2a2a'; c.lineWidth = 14; c.lineCap = 'round'; c.beginPath(); c.moveTo(-w / 2 + 20, 0); c.lineTo(-w / 2 + 20 + (w - 40) * clamp(o.strike), 0); c.stroke(); }
  if (o.crack) { c.strokeStyle = INK; c.lineWidth = 6; c.beginPath(); c.moveTo(-10, -h / 2); c.lineTo(20, -h * 0.1); c.lineTo(-25, h * 0.1); c.lineTo(15, h / 2); c.moveTo(20, -h * 0.1); c.lineTo(w * 0.3, -h * 0.25); c.moveTo(-25, h * 0.1); c.lineTo(-w * 0.32, h * 0.3); c.stroke(); }
  c.restore();
}
// ---------- particles ----------
function confetti(c, t, t0, x, y, n = 40, seed = 1, cols = ['#ffe03a', '#ff4fa3', '#4fc3ff', '#7dff6a', '#a35bff']) {
  const dt = t - t0; if (dt < 0 || dt > 2.2) return; const R = rng(seed);
  for (let i = 0; i < n; i++) { const a = R() * 6.28, sp = 400 + R() * 900, px = x + Math.cos(a) * sp * dt, py = y + Math.sin(a) * sp * dt + 900 * dt * dt; c.save(); c.globalAlpha = clamp(1 - dt / 2.2); c.translate(px, py); c.rotate(dt * 8 + i); c.fillStyle = cols[i % cols.length]; c.fillRect(-10, -6, 20, 12); c.restore(); }
}
function sparks(c, t, t0, x, y, n = 24, col = '#ffe03a', seed = 2) {
  const dt = t - t0; if (dt < 0 || dt > 0.7) return; const R = rng(seed); c.save(); c.strokeStyle = col; c.lineCap = 'round';
  for (let i = 0; i < n; i++) { const a = R() * 6.28, sp = 600 + R() * 900, r0 = sp * dt, r1 = r0 + 40 * (1 - dt / 0.7); c.globalAlpha = 1 - dt / 0.7; c.lineWidth = 8; c.beginPath(); c.moveTo(x + Math.cos(a) * r0, y + Math.sin(a) * r0); c.lineTo(x + Math.cos(a) * r1, y + Math.sin(a) * r1); c.stroke(); } c.restore();
}
function smoke(c, t, x, y, n = 8, col = '#8a7a9a', seed = 3, a = 0.6) {
  const R = rng(seed);
  for (let i = 0; i < n; i++) { const ph = (t * (0.35 + R() * 0.3) + R()) % 1; c.save(); c.globalAlpha = a * (1 - ph); c.fillStyle = col; c.beginPath(); c.arc(x + (R() - 0.5) * 80 + Math.sin(t * 2 + i) * 30 * ph, y - ph * 360, 30 + ph * 70, 0, 6.283); c.fill(); c.lineWidth = 4; c.strokeStyle = 'rgba(22,11,30,0.4)'; c.stroke(); c.restore(); }
}
function drops(c, t, t0, x, y, seed = 4) { // tears flying sideways
  const R = rng(seed);
  for (let i = 0; i < 14; i++) { const ph = ((t - t0) * 1.6 + R()) % 1; if (t < t0) return; const side = i % 2 ? 1 : -1, px = x + side * (30 + ph * 340), py = y - 80 * Math.sin(ph * Math.PI) + ph * 260; c.save(); c.globalAlpha = 1 - ph; c.fillStyle = '#7fd8ff'; c.beginPath(); c.ellipse(px, py, 14, 20, side * 0.6, 0, 6.283); c.fill(); c.lineWidth = 4; c.strokeStyle = INK; c.stroke(); c.restore(); }
}
// tiny colorful crowd person
function mini(c, x, y, s, col, t, seed = 0, o = {}) {
  const b = Math.abs(Math.sin(t * 6 + seed)) * 10 * s * (o.bounce ?? 1);
  c.save(); c.translate(x, y - b); c.scale(s, s);
  rr(c, -34, -70, 68, 90, 30); c.fillStyle = col; c.fill(); ol(c, 6);
  c.beginPath(); c.arc(0, -110, 44, 0, 6.283); c.fillStyle = o.skin || '#ffd2b0'; c.fill(); ol(c, 6);
  if (o.hair) { c.beginPath(); c.arc(0, -122, 46, Math.PI * 1.05, Math.PI * 1.95); c.lineTo(30, -118); c.lineTo(-30, -118); c.closePath(); c.fillStyle = o.hair; c.fill(); ol(c, 6); }
  const lk = o.look ?? 0;
  c.fillStyle = INK; for (const ex of [-15, 15]) { c.beginPath(); c.ellipse(ex + lk * 8, -110, 6, o.eye ?? 9, 0, 0, 6.283); c.fill(); }
  c.beginPath(); if (o.mouth === 'o') c.arc(0, -86, 8, 0, 6.283); else c.arc(0, -92, 12, 0.2, Math.PI - 0.2); c.lineWidth = 5; c.strokeStyle = INK; c.stroke();
  c.restore();
}
module.exports = { INK, FONT, SAFE_T, SAFE_B, ol, rr, bounce, sunburst, vignette, hud, subs, sticker, confetti, sparks, smoke, drops, mini, pill };
