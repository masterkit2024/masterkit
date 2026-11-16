// ===== Props: pizza, extinguisher, tow truck, phone, x-ray, hospital, metro =====
PAL.doctor = { skin: '#f5c7a0', skinSh: '#dfa77e', top: '#f4f7ff', topSh: '#d5ddef', pants: '#3fb7ff', pantsSh: '#2593d6', shoe: '#fff', hair: '#8a8fa3', hairStyle: 'bald', mustache: true, glasses: true };
PAL.disp = { skin: '#ffd9bd', skinSh: '#f3b998', top: '#2f8cff', topSh: '#1f6ed6', pants: '#3b3b4f', pantsSh: '#2b2b3c', shoe: '#222', hair: '#1f1a2e', hairStyle: 'bun', lashes: true };
PAL.heroRed = { ...PAL.hero, skin: '#ff8a7a', skinSh: '#f06656' };

function pizza(ctx, x, y, r, t = 0, o = {}) {
  ctx.save(); ctx.translate(x, y); ctx.rotate(o.rot || 0);
  circle(ctx, 0, 0, r, '#f0b45a', r * .07);
  circle(ctx, 0, 0, r * .84, '#ffd23f', 0);
  for (let i = 0; i < 9; i++) { const a = hash(i) * TAU, d = r * .55 * Math.sqrt(hash(i + 3)); ell(ctx, Math.cos(a) * d, Math.sin(a) * d, r * .16, r * .15, '#e8452c', r * .03); }
  for (let i = 0; i < 5; i++) { const a = hash(i + 20) * TAU, d = r * .6 * hash(i + 7); ell(ctx, Math.cos(a) * d, Math.sin(a) * d, r * .07, r * .04, '#3a9a3a', 0, a); }
  if (o.slice) { ctx.beginPath(); ctx.moveTo(0, 0); ctx.arc(0, 0, r * 1.02, -.5, .3); ctx.closePath(); ctx.fillStyle = o.bg || '#fff'; ctx.fill(); }
  ctx.restore();
  if (o.steam) for (let i = 0; i < 3; i++) { const k = (t * .7 + i / 3) % 1; ctx.save(); ctx.globalAlpha = (1 - k) * .8; ctx.beginPath(); const sx = x - r * .4 + i * r * .4; ctx.moveTo(sx, y - r * .3 - k * r * 1.4); ctx.quadraticCurveTo(sx + Math.sin(k * 6 + i) * r * .2, y - r * .6 - k * r * 1.4, sx, y - r * .9 - k * r * 1.4); ctx.lineWidth = r * .08; ctx.strokeStyle = '#fff'; ctx.lineCap = 'round'; ctx.stroke(); ctx.restore(); }
  if (o.fire) flames(ctx, x, y - r * .2, r * 1.1, t);
}
function cheeseSlice(ctx, x, y, s, t) { // slice pulled with stretchy cheese
  ctx.save(); ctx.translate(x, y); ctx.scale(s, s);
  const st = 60 + Math.sin(t * 3) * 25;
  ctx.beginPath(); ctx.moveTo(-14, 0); ctx.bezierCurveTo(-10, st * .5, 10, st * .5, 14, 0); ctx.lineTo(8, st); ctx.lineTo(-8, st); ctx.closePath(); ctx.fillStyle = '#ffd23f'; ctx.fill();
  poly(ctx, [-60, -120, 60, -120, 0, 10], '#ffd23f', 6); line(ctx, -64, -122, 64, -122, 22, '#f0b45a'); ell(ctx, -10, -80, 14, 12, '#e8452c', 4); ell(ctx, 20, -60, 12, 10, '#e8452c', 4);
  ctx.restore();
}
function flames(ctx, x, y, s, t) {
  const cols = ['#ff3b1f', '#ff8a1a', '#ffd23f'];
  for (let k = 0; k < 3; k++) {
    const sc = s * (1 - k * .28);
    ctx.beginPath(); ctx.moveTo(x - sc * .5, y);
    const n = 5;
    for (let i = 0; i <= n; i++) { const fx = x - sc * .5 + i * sc / n; const h = sc * (.5 + .5 * hash(i + k * 7)) * (1 + .25 * Math.sin(t * 14 + i * 2 + k)); ctx.quadraticCurveTo(fx - sc / n / 2, y - h * .5, fx, y - h); if (i < n) ctx.quadraticCurveTo(fx + sc / n / 4, y - h * .4, fx + sc / n / 2, y - h * .25); }
    ctx.lineTo(x + sc * .5, y); ctx.quadraticCurveTo(x, y + sc * .25, x - sc * .5, y); ctx.closePath();
    ctx.fillStyle = cols[k]; ctx.fill(); if (k === 0) { ctx.lineWidth = s * .04; ctx.strokeStyle = OUT; ctx.stroke(); }
  }
}
function smoke(ctx, x, y, t, s = 1, n = 6) {
  for (let i = 0; i < n; i++) { const k = (t * .9 + i / n) % 1; ctx.save(); ctx.globalAlpha = (1 - k) * .55; circle(ctx, x + Math.sin(i * 2 + t) * 30 * s + k * 40 * s * (i % 2 ? 1 : -1), y - k * 260 * s, (24 + k * 60) * s, '#8d8d9e'); ctx.restore(); }
}
function extinguisher(ctx, x, y, s, o = {}) {
  ctx.save(); ctx.translate(x, y); ctx.rotate(o.rot || 0); ctx.scale(s, s);
  // body
  rr(ctx, -60, -170, 120, 330, 50); fillStroke(ctx, '#e8202c', 8);
  ctx.save(); rr(ctx, -60, -170, 120, 330, 50); ctx.clip(); ctx.fillStyle = '#b8121c'; ctx.fillRect(25, -170, 40, 330); ctx.fillStyle = 'rgba(255,255,255,.35)'; ctx.fillRect(-40, -150, 16, 280); ctx.restore();
  rr(ctx, -50, -40, 100, 80, 10); fillStroke(ctx, '#fff', 5);
  ctx.font = `900 30px ${F_HEAD}`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillStyle = '#e8202c'; ctx.fillText('ОУ-5', 0, 2);
  // valve + handle + hose
  rr(ctx, -22, -215, 44, 50, 8); fillStroke(ctx, '#3a3a4a', 6);
  poly(ctx, [-20, -215, 70, -250, 75, -232, -10, -200], '#3a3a4a', 6);
  circle(ctx, -30, -195, 18, '#fff', 5); line(ctx, -30, -195, -22, -205, 4, OUT);
  ctx.beginPath(); ctx.moveTo(18, -200); ctx.bezierCurveTo(110, -190, 120, 0, 80, 80); ctx.lineWidth = 22; ctx.strokeStyle = OUT; ctx.stroke(); ctx.lineWidth = 12; ctx.strokeStyle = '#2a2a38'; ctx.stroke();
  poly(ctx, [68, 70, 92, 70, 100, 120, 60, 120], '#2a2a38', 6);
  ctx.restore();
}
function towTruck(ctx, x, y, s, t, o = {}) {
  ctx.save(); ctx.translate(x, y); ctx.scale(s * (o.flip ? -1 : 1), s);
  // flatbed + boom
  rr(ctx, -260, -90, 330, 50, 10); fillStroke(ctx, '#ffb020', 7);
  poly(ctx, [-230, -90, -200, -240, -175, -240, -190, -90], '#9aa3b5', 6);
  line(ctx, -200, -240, -290, -180, 8, OUT); line(ctx, -290, -180, -290, -120, 5, OUT);
  ctx.beginPath(); ctx.arc(-290, -105, 14, 0, Math.PI * 1.4); ctx.lineWidth = 7; ctx.strokeStyle = OUT; ctx.stroke();
  // cab
  rr(ctx, 60, -200, 190, 160, 24); fillStroke(ctx, '#ff8a1a', 7);
  rr(ctx, 120, -180, 110, 70, 12); fillStroke(ctx, '#bfe9ff', 6);
  rr(ctx, -270, -50, 530, 40, 10); fillStroke(ctx, '#4a4a5c', 6);
  for (const wx of [-170, 160]) { circle(ctx, wx, -6, 46, '#2a2a38', 7); circle(ctx, wx, -6, 20, '#c9d2e6', 5); }
  // beacon
  const on = o.blink !== false && Math.sin(t * TAU * 2) > 0;
  rr(ctx, 120, -232, 60, 34, 10); fillStroke(ctx, on ? '#ffb020' : '#a56a10', 6);
  if (on) { ctx.save(); ctx.globalAlpha = .6; ctx.fillStyle = rgrad(ctx, 150, -215, 0, 260, ['rgba(255,170,30,.9)', 'rgba(255,170,30,0)']); ctx.fillRect(-110, -475, 520, 520); ctx.restore(); }
  ctx.font = `900 34px ${F_HEAD}`; ctx.textAlign = 'center'; ctx.fillStyle = OUT; ctx.fillText('ЭВАКУАТОР', -95, -58);
  ctx.restore();
}
// Phone UI (screen space)
function phoneFrame(ctx, x, y, w, h, fn) {
  ctx.save(); ctx.translate(x, y);
  ctx.save(); ctx.globalAlpha = .35; rr(ctx, -w / 2 + 20, -h / 2 + 30, w, h, 90); ctx.fillStyle = '#000'; ctx.fill(); ctx.restore();
  rr(ctx, -w / 2, -h / 2, w, h, 90); fillStroke(ctx, '#17132b', 10);
  rr(ctx, -w / 2 + 26, -h / 2 + 26, w - 52, h - 52, 66); ctx.fillStyle = vgrad(ctx, -h / 2, h / 2, ['#1b1f3a', '#2b1f4a']); ctx.fill();
  ctx.save(); rr(ctx, -w / 2 + 26, -h / 2 + 26, w - 52, h - 52, 66); ctx.clip(); fn(ctx, w - 52, h - 52); ctx.restore();
  rr(ctx, -70, -h / 2 + 44, 140, 34, 17); ctx.fillStyle = '#000'; ctx.fill();
  ctx.restore();
}
function bubble(ctx, x, y, w, str, o = {}) {
  const size = o.size || 46; ctx.font = `${o.weight || 800} ${size}px ${F_HEAD}`;
  // word wrap
  const words = str.split(' '); const lines = []; let cur = '';
  for (const wd of words) { const tst = cur ? cur + ' ' + wd : wd; if (ctx.measureText(tst).width > w - 60 && cur) { lines.push(cur); cur = wd; } else cur = tst; }
  lines.push(cur);
  const h = lines.length * size * 1.18 + 44;
  const sc = o.scale ?? 1; if (sc <= 0) return h;
  ctx.save(); ctx.translate(x, y); ctx.scale(sc, sc);
  rr(ctx, 0, 0, w, h, 36); fillStroke(ctx, o.bg || '#fff', 5, o.border || OUT);
  ctx.fillStyle = o.fill || OUT; ctx.textAlign = 'left'; ctx.textBaseline = 'top';
  lines.forEach((ln, i) => ctx.fillText(ln, 30, 22 + i * size * 1.18));
  ctx.restore();
  return h;
}
// X-ray panel showing the hero's insides
function xray(ctx, x, y, s, t, it = {}) {
  ctx.save(); ctx.translate(x, y); ctx.scale(s, s);
  rr(ctx, -330, -520, 660, 1040, 40); fillStroke(ctx, '#071a33', 10);
  ctx.save(); rr(ctx, -330, -520, 660, 1040, 40); ctx.clip();
  ctx.strokeStyle = 'rgba(95,244,255,.12)'; ctx.lineWidth = 2; for (let i = -330; i < 330; i += 44) { ctx.beginPath(); ctx.moveTo(i, -520); ctx.lineTo(i, 520); ctx.stroke(); } for (let j = -520; j < 520; j += 44) { ctx.beginPath(); ctx.moveTo(-330, j); ctx.lineTo(330, j); ctx.stroke(); }
  const scan = ((t * .6) % 1) * 1040 - 520; ctx.fillStyle = 'rgba(95,244,255,.12)'; ctx.fillRect(-330, scan, 660, 30);
  // body silhouette
  ctx.save(); ctx.globalAlpha = .9; ctx.strokeStyle = '#7ff6ff'; ctx.lineWidth = 6; ctx.shadowColor = '#5ff4ff'; ctx.shadowBlur = 16;
  ctx.beginPath(); ctx.arc(0, -370, 95, 0, TAU); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(-60, -270); ctx.lineTo(-150, -250); ctx.lineTo(-150, 40); ctx.lineTo(-110, 160); ctx.lineTo(-100, 500); ctx.moveTo(60, -270); ctx.lineTo(150, -250); ctx.lineTo(150, 40); ctx.lineTo(110, 160); ctx.lineTo(100, 500);
  ctx.moveTo(-150, -250); ctx.lineTo(-250, 60); ctx.moveTo(150, -250); ctx.lineTo(250, 60); ctx.stroke();
  // skeleton hints
  ctx.lineWidth = 4; ctx.globalAlpha = .55; ctx.beginPath(); for (let i = 0; i < 6; i++) { ctx.moveTo(-100, -220 + i * 34); ctx.quadraticCurveTo(0, -200 + i * 34, 100, -220 + i * 34); } ctx.moveTo(0, -270); ctx.lineTo(0, 40); ctx.stroke();
  ctx.restore();
  // pelvis zone
  const blink = it.truck ? (.5 + .5 * Math.sin(t * TAU * 2)) : 0;
  if (blink) { ctx.save(); ctx.globalAlpha = blink * .55 * it.truck; ctx.fillStyle = rgrad(ctx, 0, 110, 0, 520, ['rgba(255,170,30,.9)', 'rgba(255,170,30,0)']); ctx.fillRect(-330, -520, 660, 1040); ctx.restore(); }
  ctx.save(); ctx.strokeStyle = 'rgba(127,246,255,.6)'; ctx.lineWidth = 5; ctx.setLineDash([14, 10]); ctx.beginPath(); ctx.ellipse(0, 110, 170, 110, 0, 0, TAU); ctx.stroke(); ctx.restore();
  if (it.pizza) { ctx.save(); ctx.globalAlpha *= it.pizza; pizza(ctx, -70, 100, 70 * ease.outBack(clamp(it.pizza), 1.6), t, { fire: true }); ctx.restore(); }
  if (it.ext) { ctx.save(); ctx.globalAlpha *= clamp(it.ext * 2); extinguisher(ctx, 80, 110 - (1 - ease.outC(clamp(it.ext))) * 300, .42, { rot: .5 }); ctx.restore(); }
  if (it.truck) { ctx.save(); ctx.globalAlpha *= clamp(it.truck * 2); towTruck(ctx, 0, 190, .34 * ease.outBack(clamp(it.truck), 1.5), t); ctx.restore(); }
  ctx.restore();
  ctx.font = `900 34px ${F_HEAD}`; ctx.textAlign = 'left'; ctx.fillStyle = '#7ff6ff'; ctx.fillText('РЕНТГЕН', -290, -470);
  ctx.fillStyle = Math.sin(t * 6) > 0 ? '#ff3b3b' : '#7a1a1a'; circle(ctx, 270, -480, 12, ctx.fillStyle);
  ctx.restore();
}
function kitchenBg(ctx, t) {
  ctx.fillStyle = '#bff0d8'; ctx.fillRect(-600, -400, 2300, 1750);
  for (let x = -600; x < 1700; x += 70) for (let y = 820; y < 1250; y += 70) { ctx.strokeStyle = '#9fe0c0'; ctx.lineWidth = 3; ctx.strokeRect(x, y, 70, 70); }
  windowFrame(ctx, 80, 300, 300, 340, ['#7fd4ff', '#d8f3ff'], t);
  // fridge
  rr(ctx, 760, 420, 280, 830, 30); fillStroke(ctx, '#f4f7ff', 8); line(ctx, 760, 720, 1040, 720, 6, OUT); line(ctx, 800, 520, 800, 640, 10, OUT); line(ctx, 800, 780, 800, 900, 10, OUT);
  rr(ctx, 860, 480, 60, 70, 8); fillStroke(ctx, '#ffd23f', 4);
  // counter
  rr(ctx, -300, 1000, 900, 250, 10); fillStroke(ctx, '#ff9a5a', 8); rr(ctx, -310, 980, 920, 40, 10); fillStroke(ctx, '#fff', 6);
  for (let i = 0; i < 3; i++) { rr(ctx, -260 + i * 280, 1050, 240, 170, 10); fillStroke(ctx, '#ffb07a', 5); circle(ctx, -140 + i * 280, 1080, 9, OUT); }
  // shelf w/ pans
  rr(ctx, 380, 520, 300, 18, 5); fillStroke(ctx, '#c8834a', 5);
  floorBoards(ctx, -600, 1250, 2300, 700, '#e0a060', '#c98a4c');
}
function hospitalBg(ctx, t) {
  ctx.fillStyle = '#d9f3ff'; ctx.fillRect(-600, -400, 2300, 1750);
  ctx.fillStyle = '#bfe6f7'; ctx.fillRect(-600, 900, 2300, 350);
  line(ctx, -600, 900, 1700, 900, 6, '#9fd0e6');
  // red cross sign
  rr(ctx, 420, 260, 240, 240, 30); fillStroke(ctx, '#fff', 8); ctx.fillStyle = '#ff3b3b'; ctx.fillRect(510, 290, 60, 180); ctx.fillRect(450, 350, 180, 60);
  // monitor
  rr(ctx, 860, 420, 220, 160, 16); fillStroke(ctx, '#17132b', 7);
  ctx.save(); ctx.beginPath(); for (let i = 0; i <= 40; i++) { const xx = 875 + i * 4.8, ph = (i / 40 + t * .8) % 1; const yy = 500 - (ph > .45 && ph < .5 ? 50 : ph > .5 && ph < .55 ? -30 : 0); i ? ctx.lineTo(xx, yy) : ctx.moveTo(xx, yy); } ctx.lineWidth = 5; ctx.strokeStyle = '#3df27a'; ctx.stroke(); ctx.restore();
  floorBoards(ctx, -600, 1250, 2300, 700, '#c9d2e6', '#aeb8cf');
}
function gurney(ctx, x, y, w = 620) {
  rr(ctx, x - w / 2, y, w, 60, 20); fillStroke(ctx, '#fff', 7); rr(ctx, x - w / 2 + 10, y - 26, w - 20, 34, 16); fillStroke(ctx, '#9fe7ff', 6);
  line(ctx, x - w / 2 + 50, y + 60, x - w / 2 + 50, y + 200, 12, '#9aa3b5'); line(ctx, x + w / 2 - 50, y + 60, x + w / 2 - 50, y + 200, 12, '#9aa3b5');
  circle(ctx, x - w / 2 + 50, y + 214, 18, '#333', 5); circle(ctx, x + w / 2 - 50, y + 214, 18, '#333', 5);
}
function headset(ctx, hc, s) {
  ctx.beginPath(); ctx.arc(hc.x, hc.y, 82 * s, Math.PI * 1.05, Math.PI * 1.95); ctx.lineWidth = 10 * s; ctx.strokeStyle = OUT; ctx.stroke();
  ell(ctx, hc.x - 78 * s, hc.y + 4 * s, 16 * s, 24 * s, '#444', 4 * s); ell(ctx, hc.x + 78 * s, hc.y + 4 * s, 16 * s, 24 * s, '#444', 4 * s);
  ctx.beginPath(); ctx.moveTo(hc.x - 78 * s, hc.y + 20 * s); ctx.quadraticCurveTo(hc.x - 70 * s, hc.y + 70 * s, hc.x - 20 * s, hc.y + 50 * s); ctx.lineWidth = 6 * s; ctx.strokeStyle = OUT; ctx.stroke(); circle(ctx, hc.x - 18 * s, hc.y + 50 * s, 8 * s, '#444');
}
function headMirror(ctx, hc, s) { line(ctx, hc.x - 70 * s, hc.y - 40 * s, hc.x + 70 * s, hc.y - 40 * s, 10 * s, '#333'); circle(ctx, hc.x, hc.y - 70 * s, 26 * s, '#dfe8f7', 6 * s); circle(ctx, hc.x, hc.y - 70 * s, 8 * s, '#17132b'); }
function thought(ctx, x, y, w, h, fn, k = 1) {
  if (k <= 0) return; ctx.save(); ctx.translate(x, y); ctx.scale(k, k);
  for (const [cx, cy, r] of [[-w * .28, h * .62, 18], [-w * .36, h * .78, 11]]) circle(ctx, cx, cy, r, '#fff', 5);
  ctx.beginPath(); const n = 9; for (let i = 0; i < n; i++) { const a = i / n * TAU; ctx.ellipse(Math.cos(a) * w * .38, Math.sin(a) * h * .34, w * .2, h * .2, 0, 0, TAU); } ctx.fillStyle = '#fff'; ctx.fill();
  ell(ctx, 0, 0, w * .5, h * .45, '#fff', 0); ctx.lineWidth = 5; ctx.strokeStyle = OUT; ctx.beginPath(); ctx.ellipse(0, 0, w * .52, h * .47, 0, 0, TAU); ctx.stroke();
  fn(ctx); ctx.restore();
}
function crossOut(ctx, x, y, r, k) { if (k <= 0) return; ctx.save(); ctx.globalAlpha *= clamp(k * 2); line(ctx, x - r, y - r, lerp(x - r, x + r, ease.outC(clamp(k * 2))), lerp(y - r, y + r, ease.outC(clamp(k * 2))), 18, '#ff3b3b'); if (k > .5) line(ctx, x + r, y - r, lerp(x + r, x - r, ease.outC(clamp(k * 2 - 1))), lerp(y - r, y + r, ease.outC(clamp(k * 2 - 1))), 18, '#ff3b3b'); ctx.restore(); }
function airplane(ctx, x, y, s) { ctx.save(); ctx.translate(x, y); ctx.scale(s, s); ell(ctx, 0, 0, 150, 34, '#fff', 6); poly(ctx, [-20, -10, 40, -10, -40, -110, -70, -110], '#c9d2e6', 6); poly(ctx, [-20, 10, 40, 10, -40, 110, -70, 110], '#c9d2e6', 6); poly(ctx, [-120, -10, -150, -70, -170, -70, -150, 0], '#ff3b3b', 6); for (let i = 0; i < 5; i++) circle(ctx, 20 + i * 24 - 60, -6, 8, '#7fd4ff', 3); ctx.restore(); }
