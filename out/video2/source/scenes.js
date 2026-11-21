// 13 scenes as data, every beat keyed to the recognized voice words
const C = require('../viz/core'); const T = require('../viz/toon'); const G = require('./gfx');
const { hex, rgba, mix, clamp, lerp, ease, easeIO, easeOut, easeIn, seg, rng } = C;
const { ol, rr, sticker, mini, INK } = G;
const TL = require('./timeline.json'); const WS = TL.words;
const norm = w => w.toLowerCase().replace(/[^а-яёa-z0-9:]/g, '');
function W(pre, after = 0, k = 's') { const w = WS.find(w => w.s >= after && norm(w.w).startsWith(pre)); if (!w) throw new Error('word ' + pre); return w[k]; }
function talk(t) { for (const w of WS) if (t >= w.s && t <= w.e) return 0.2 + 0.45 * Math.abs(Math.sin((t - w.s) * 16)); return 0; }
function blink(t, s = 0) { const p = (t + s * 1.7) % 2.6; return p < 0.12 ? 0.1 : 1; }
// ---------- cast (flat, thick outline) ----------
const CH = {
  guy: { heads: 3.1, w: 1.05, skin: hex('#ffd2b0'), hair: hex('#4a2c1c'), style: 'messy', head: 'round', coat: hex('#ee2f3f'), coat2: hex('#c8202f'), hoodie: true, coatLen: 1.25, pants: hex('#2f62d6'), shoes: hex('#ffffff'), brows: hex('#3a2014'), age: 22, nose: 'button', blush: 1.1 },
  girl: { heads: 3.2, w: 0.95, skin: hex('#ffdcc8'), hair: hex('#3fe08c'), style: 'bob', head: 'round', coat: hex('#1f1c26'), coat2: hex('#15131a'), coatLen: 0.95, pants: hex('#1f1c26'), shoes: hex('#0e0d10'), brows: hex('#1f9a5a'), age: 21, nose: 'button', blush: 0.8, lashes: true, female: true },
  mom: { heads: 3.2, w: 1.0, skin: hex('#ffd2b4'), hair: hex('#7a4a2a'), style: 'clip', head: 'round', coat: hex('#ff8fbf'), coat2: hex('#e8709f'), robe: true, coatLen: 0.55, pants: hex('#6a4a60'), shoes: hex('#8a5a4a'), brows: hex('#5a3322'), age: 45, nose: 'soft', blush: 0.9, lashes: true },
  coach: { heads: 3.2, w: 1.22, skin: hex('#f5c09a'), hair: hex('#2a2a2a'), style: 'dad', head: 'square', coat: hex('#2f6fe0'), coat2: hex('#2558b8'), jacket: true, coatLen: 1.3, pants: hex('#2f6fe0'), shoes: hex('#ffffff'), brows: hex('#2a2a2a'), age: 40, nose: 'big', mustache: true },
  courier: { heads: 3.1, w: 1.0, skin: hex('#f7c8a4'), hair: hex('#2a1e18'), style: 'quiff', head: 'round', coat: hex('#22b39a'), coat2: hex('#1a9580'), jacket: true, coatLen: 1.3, pants: hex('#3a3a46'), shoes: hex('#1a1a1a'), brows: hex('#2a1e18'), age: 25, nose: 'button', backpack: hex('#ffd21f'), blush: 0.8 },
  guru: { heads: 3.2, w: 1.05, skin: hex('#f3c29e'), hair: hex('#16120f'), style: 'quiff', head: 'long', coat: hex('#7a3fd0'), coat2: hex('#5f2fa8'), shirt: hex('#ffffff'), coatLen: 1.25, pants: hex('#4a2380'), shoes: hex('#111'), brows: hex('#16120f'), age: 35, nose: 'straight' },
};
const LF = { kx: -1, amb: hex('#3a1450'), rim: hex('#ffffff'), rimX: 1, rimI: 0 };
function P(c, who, x, y, h, t, o = {}) { const ex = { ...T.EX[o.ex || 'neutral'], ...(o.exo || {}) }; ex.eye = Math.min(ex.eye, ex.eye * blink(t, o.seed || 0)); return T.toon(c, CH[who], { x, y, h, t, L: LF, seed: o.seed || 0, face: o.face ?? 1, front: o.front, pose: o.pose || {}, ex, talk: o.talk || 0, hold: o.hold, cropLegs: o.crop }); }
const sway = (t, s = 0) => Math.sin(t * 2.4 + s) * 0.04;
// ---------- props ----------
function phone(c, x, y, w, rot, screen) { const h = w * 2.05; c.save(); c.translate(x, y); c.rotate(rot); rr(c, -w / 2 + 12, -h / 2 + 14, w, h, w * 0.14); c.fillStyle = INK; c.fill(); rr(c, -w / 2, -h / 2, w, h, w * 0.14); c.fillStyle = '#26203a'; c.fill(); ol(c, 8); c.save(); rr(c, -w / 2 + w * 0.06, -h / 2 + w * 0.06, w * 0.88, h - w * 0.12, w * 0.09); c.clip(); c.translate(-w / 2 + w * 0.06, -h / 2 + w * 0.06); screen(c, w * 0.88, h - w * 0.12); c.restore(); c.restore(); }
function txt(c, s, x, y, size, col = '#fff', align = 'center', stroke = 0) { c.font = `900 ${size}px ${G.FONT}`; c.textAlign = align; c.textBaseline = 'middle'; if (stroke) { c.lineWidth = stroke; c.strokeStyle = INK; c.lineJoin = 'round'; c.strokeText(s, x, y); } c.fillStyle = col; c.fillText(s, x, y); }
function heart(c, x, y, s, col = '#ff3b6b') { c.save(); c.translate(x, y); c.beginPath(); c.moveTo(0, s * 0.35); c.bezierCurveTo(-s * 0.9, -s * 0.25, -s * 0.45, -s * 0.95, 0, -s * 0.45); c.bezierCurveTo(s * 0.45, -s * 0.95, s * 0.9, -s * 0.25, 0, s * 0.35); c.closePath(); c.fillStyle = col; c.fill(); ol(c, 6); c.restore(); }
function vape(h, u, t) { h.save(); h.rotate(-0.6); rr(h, -u * 0.06, -u * 0.3, u * 0.12, u * 0.36, u * 0.05); h.fillStyle = '#b06bff'; h.fill(); ol(h, 4); h.beginPath(); h.arc(0, -u * 0.3, u * 0.04, 0, 6.283); h.fillStyle = '#7dff6a'; h.fill(); h.restore(); }
function bigClock(c, x, y, r, hh, mm) { c.beginPath(); c.arc(x, y, r, 0, 6.283); c.fillStyle = '#fff'; c.fill(); ol(c, 10); for (let i = 0; i < 12; i++) { const a = i / 12 * 6.283; c.beginPath(); c.moveTo(x + Math.sin(a) * r * 0.8, y - Math.cos(a) * r * 0.8); c.lineTo(x + Math.sin(a) * r * 0.9, y - Math.cos(a) * r * 0.9); c.lineWidth = 8; c.strokeStyle = INK; c.stroke(); } const ha = (hh % 12 + mm / 60) / 12 * 6.283, ma = mm / 60 * 6.283; c.lineCap = 'round'; c.lineWidth = 18; c.beginPath(); c.moveTo(x, y); c.lineTo(x + Math.sin(ha) * r * 0.5, y - Math.cos(ha) * r * 0.5); c.stroke(); c.lineWidth = 11; c.beginPath(); c.moveTo(x, y); c.lineTo(x + Math.sin(ma) * r * 0.75, y - Math.cos(ma) * r * 0.75); c.stroke(); c.beginPath(); c.arc(x, y, 14, 0, 6.283); c.fillStyle = INK; c.fill(); }
const k = (t, a, d = 0.3) => clamp((t - a) / d);
// ---------- scenes ----------
const S = [];
const scene = (t0, pal, draw, o = {}) => S.push({ t0, pal, draw, tr: o.tr || 'whip', punch: o.punch || [], shake: o.shake || [] });
// 1 HOOK: planet, purple blob, counter
scene(0, ['#1c0b33', '#3a1670'], (c, t) => {
  const z = lerp(0.85, 1.05, easeOut(clamp(t / 2))); c.save(); c.translate(540, 800); c.scale(z, z); c.rotate(t * 0.05);
  c.beginPath(); c.arc(0, 0, 330, 0, 6.283); c.fillStyle = '#2f8cff'; c.fill(); c.save(); c.clip();
  const R = rng(5); c.fillStyle = '#3fd06a'; for (let i = 0; i < 9; i++) { const a = R() * 6.28 + t * 0.15, d = R() * 260; c.beginPath(); c.ellipse(Math.cos(a) * d, Math.sin(a) * d, 60 + R() * 90, 40 + R() * 60, R() * 3, 0, 6.283); c.fill(); ol(c, 5); }
  // tiny people on the planet after "девушки"
  const pk = k(t, W('девушки'), 0.4); if (pk > 0) { const R2 = rng(9); for (let i = 0; i < 26; i++) { const a = R2() * 6.28, d = R2() * 270; mini(c, Math.cos(a) * d, Math.sin(a) * d + 30, 0.35 * easeOut(pk), ['#ff4fa3', '#ffe03a', '#7dff6a', '#4fc3ff', '#ff8a3a'][i % 5], t, i, { hair: ['#ff4fa3', '#7a4a2a', '#ffe03a'][i % 3] }); } }
  // purple blob spreading after "становятся"
  const bk = easeIO(k(t, W('становятся'), W('миллиард') - W('становятся')));
  if (bk > 0) { c.beginPath(); const n = 40; for (let i = 0; i <= n; i++) { const a = i / n * 6.283, r = (60 + 420 * bk) * (1 + 0.12 * Math.sin(a * 5 + t * 4)); const px = -150 + Math.cos(a) * r, py = -100 + Math.sin(a) * r; i ? c.lineTo(px, py) : c.moveTo(px, py); } c.closePath(); c.fillStyle = 'rgba(176,60,255,0.9)'; c.fill(); ol(c, 6); }
  c.restore(); c.beginPath(); c.arc(0, 0, 330, 0, 6.283); ol(c, 10); c.restore();
  // big live counter
  const ck = clamp((t - W('девушки')) / (W('миллиард') + 0.4 - W('девушки'))); if (ck > 0) { const v = Math.round(4e9 * easeIn(ck) ** 0.6); const s = v.toLocaleString('ru-RU').replace(/,/g, ' ').replace(/ /g, ' '); c.save(); c.translate(540, 1270); const sc = t > W('миллиард') ? G.bounce(k(t, W('миллиард'), 0.3)) : 1; c.scale(sc, sc); txt(c, s, 0, 0, 104, '#ffe03a', 'center', 20); c.restore(); }
  if (t > W('вот') - 0.05) sticker(c, 540, 450, 'ВОТ ЧТО БУДЕТ', 'pink', -0.04, k(t, W('вот'), 0.3), 70);
  G.sparks(c, t, W('полночь'), 540, 800, 30, '#ffffff', 7);
}, { tr: 'none', punch: [W('полночь'), W('миллиард')], shake: [W('полночь'), W('миллиард') + 0.4] });
// 2 TINDER falls
scene(W('первые') - 0.1, ['#2a0718', '#7a1036'], (c, t) => {
  const tf = W('тиндер'), td = W('разработчики');
  if (t < td - 0.1) {
    phone(c, 540, 860, 470, Math.sin(t * 30) * 0.02 * (t > tf ? 1 : 0), (s, w, h) => {
      s.fillStyle = t > tf ? '#3a0a14' : '#fff2f6'; s.fillRect(0, 0, w, h);
      if (t < tf + 0.2) { for (let i = 0; i < 6; i++) { const ph = ((t * 3.2) + i / 6) % 1, dir = i % 2 ? 1 : -1; s.save(); s.translate(w / 2 + dir * ph * w * 1.3, h * 0.45 - ph * 60); s.rotate(dir * ph * 0.6); rr(s, -w * 0.38, -h * 0.3, w * 0.76, h * 0.6, 26); s.fillStyle = ['#ffb3c9', '#b3e0ff', '#ffe9a8', '#c8ffb3'][i % 4]; s.fill(); ol(s, 5); s.beginPath(); s.arc(0, -h * 0.08, w * 0.16, 0, 6.283); s.fillStyle = '#fff'; s.fill(); ol(s, 4); txt(s, dir > 0 ? '❤' : '✕', 0, h * 0.18, 60, dir > 0 ? '#ff3b6b' : '#555'); s.restore(); } heart(s, w * 0.3, h * 0.88, 70); heart(s, w * 0.7, h * 0.88, 70, '#ff3b6b'); }
      else { txt(s, 'ERROR', w / 2, h * 0.4, 110, '#ff3b3b', 'center', 10); txt(s, '503', w / 2, h * 0.55, 150, '#ffe03a', 'center', 12); }
    });
    if (t > tf) G.smoke(c, t, 540, 400, 9, '#6a5a7a', 4, 0.7);
    if (t > tf) G.sparks(c, t, tf, 540, 860, 36, '#ff5a3a', 3);
  } else {
    // developers' work chat
    rr(c, 120, 360, 840, 980, 40); c.fillStyle = '#1e1b2e'; c.fill(); ol(c, 8); rr(c, 120, 360, 840, 120, 40); c.fillStyle = '#ff4fa3'; c.fill(); ol(c, 8); txt(c, '# РАБОЧИЙ ЧАТ', 540, 422, 50, '#fff');
    const R = rng(3); for (let i = 0; i < 4; i++) { const yy = 540 + i * 150, sh = clamp((t - td - i * 0.25) / 0.25); if (sh <= 0) continue; c.save(); c.globalAlpha = sh; mini(c, 200, yy + 90, 0.55, ['#4fc3ff', '#ffe03a', '#7dff6a', '#ff8a3a'][i], t, i, { hair: '#3a2a20', bounce: 0.3 }); rr(c, 270, yy, 300 + R() * 300, 70, 30); c.fillStyle = '#3a3552'; c.fill(); ol(c, 4); c.restore(); }
    sticker(c, 560, 1180, ['МЫ ТАКОГО', 'НЕ ПЛАНИРОВАЛИ'], 'yellow', -0.03, k(t, W('мы') - 0.05), 64);
  }
}, { tr: 'flash', punch: [W('тиндер'), W('разработчики')], shake: [W('тиндер')], glitch: [W('тиндер'), W('тиндер') + 1.3] });
S[S.length - 1].glitch = [W('тиндер') - 0.05, W('разработчики') - 0.15];
// 3 flowers / taxi / courier
scene(W('первая') - 0.1, ['#3a0b2a', '#ff4fa3'], (c, t) => {
  const tFl = W('цветочные'), tTx = W('такси'), tCu = W('курьер'), tRing = W('предложения');
  if (t < tFl - 0.1) { txt(c, '00:01', 540, 860, 230, '#ffe03a', 'center', 26); sticker(c, 540, 1120, 'ПЕРВАЯ МИНУТА', 'pink', 0.03, k(t, W('первая') - 0.05), 66); }
  else if (t < tTx - 0.1) { // empty flower shop
    rr(c, 110, 420, 860, 880, 30); c.fillStyle = '#ffe6f0'; c.fill(); ol(c, 8); rr(c, 110, 420, 860, 150, 30); c.fillStyle = '#ff4fa3'; c.fill(); ol(c, 8); txt(c, 'ЦВЕТЫ', 540, 497, 80, '#fff', 'center', 10);
    for (let i = 0; i < 4; i++) { rr(c, 190 + i * 190, 1000, 120, 200, 20); c.fillStyle = '#9ad8ff'; c.fill(); ol(c, 6); }
    sticker(c, 540, 790, 'ПУСТО', 'red', -0.06, k(t, W('пустеют') - 0.05), 120);
  } else if (t < tCu - 0.1) { // taxi x10
    const dx = lerp(-400, 540, easeOut(k(t, tTx - 0.1, 0.5)));
    c.save(); c.translate(dx, 1010); rr(c, -330, -150, 660, 200, 60); c.fillStyle = '#ffd21f'; c.fill(); ol(c, 8); rr(c, -210, -260, 420, 130, 40); c.fillStyle = '#ffd21f'; c.fill(); ol(c, 8); rr(c, -180, -240, 170, 90, 16); c.fillStyle = '#9ad8ff'; c.fill(); ol(c, 5); rr(c, 10, -240, 170, 90, 16); c.fill(); ol(c, 5); rr(c, -70, -320, 140, 60, 14); c.fillStyle = '#fff'; c.fill(); ol(c, 5); txt(c, 'TAXI', 0, -290, 38, INK);
    for (const wx of [-200, 200]) { c.beginPath(); c.arc(wx, 60, 70, 0, 6.283); c.fillStyle = INK; c.fill(); c.beginPath(); c.arc(wx, 60, 30, 0, 6.283); c.fillStyle = '#ccc'; c.fill(); } c.restore();
    sticker(c, 540, 620, '×10', 'red', 0.05, k(t, W('10', 19) - 0.05), 170);
  } else { // courier gets tips and proposals
    P(c, 'courier', 520, 1420, 210, t, { face: 1, ex: t > tRing ? 'surprised' : 'smile', pose: { aR: [2.2, 0.4], aL: [0.4, 0.3], tilt: sway(t) }, seed: 3 });
    const R = rng(8); for (let i = 0; i < 10; i++) { const ph = ((t - tCu) * 1.3 + R()) % 1; c.save(); c.translate(150 + R() * 800, 300 + ph * 900); c.rotate(ph * 6); c.beginPath(); c.arc(0, 0, 32, 0, 6.283); c.fillStyle = '#ffd21f'; c.fill(); ol(c, 5); txt(c, '₽', 0, 2, 36, INK); c.restore(); }
    if (t > tRing - 0.05) { const rk = G.bounce(k(t, tRing - 0.05)); c.save(); c.translate(790, 640); c.scale(rk, rk); rr(c, -90, -40, 180, 110, 18); c.fillStyle = '#ff3b6b'; c.fill(); ol(c, 7); c.beginPath(); c.arc(0, -40, 46, 0, 6.283); c.lineWidth = 16; c.strokeStyle = '#ffd21f'; c.stroke(); c.lineWidth = 5; c.strokeStyle = INK; c.stroke(); c.beginPath(); c.moveTo(0, -100); c.lineTo(22, -80); c.lineTo(0, -60); c.lineTo(-22, -80); c.closePath(); c.fillStyle = '#bff4ff'; c.fill(); ol(c, 5); c.restore(); for (let i = 0; i < 5; i++) heart(c, 300 + i * 120, 520 - ((t - tRing) * 200 + i * 60) % 300, 50); }
    sticker(c, 290, 560, 'ЧАЕВЫЕ', 'green', -0.05, k(t, W('чаевые') - 0.05), 60);
  }
}, { punch: [W('цветочные'), W('такси'), W('курьер'), W('предложения')], shake: [W('пустеют')] });
// 4 pickup guru
scene(W('пикап') - 0.1, ['#3a1606', '#ff8a2a'], (c, t) => {
  const tOut = W('через', 28), tM = W('это', 31), tK = W('курс'), tP = W('хватало');
  if (t < tOut - 0.1) { // full hall
    rr(c, 160, 420, 760, 260, 20); c.fillStyle = '#5a1f8a'; c.fill(); ol(c, 8); txt(c, 'КАК ПОКОРИТЬ ЛЮБУЮ', 540, 520, 46, '#ffe03a'); txt(c, 'МАСТЕР-КЛАСС', 540, 600, 54, '#fff');
    P(c, 'guru', 540, 1090, 150, t, { ex: 'smile', pose: { aR: [2.6, 0.3], aL: [0.6, 1.4], tilt: sway(t) }, talk: 0.3 * Math.abs(Math.sin(t * 7)), seed: 5, hold: (h, u) => { h.beginPath(); h.arc(0, -u * 0.1, u * 0.1, 0, 6.283); h.fillStyle = '#333'; h.fill(); ol(h, 4); } });
    for (let r = 0; r < 3; r++) for (let i = 0; i < 7; i++) mini(c, 120 + i * 140 + (r % 2) * 60, 1260 + r * 120, 0.75, ['#4fc3ff', '#ff4fa3', '#7dff6a', '#ffe03a', '#ff8a3a', '#a35bff'][(i + r) % 6], t, i + r * 7, { hair: '#3a2a20' });
    sticker(c, 540, 330, 'ПОЛНЫЙ ЗАЛ', 'yellow', -0.03, k(t, W('зал') - 0.05), 66);
  } else if (t < tK - 0.1) { // guru walks out with a long face
    rr(c, 600, 380, 340, 900, 20); c.fillStyle = '#3a1a10'; c.fill(); ol(c, 8);
    const wx = lerp(770, 430, easeOut(k(t, tOut, 1.2)));
    c.save(); c.translate(wx, 1300); c.scale(1, 1 + 0.18 * k(t, tOut + 0.6, 0.5)); c.translate(-wx, -1300);
    P(c, 'guru', wx, 1300, 170, t, { face: -1, ex: 'sad', exo: { mouth: 0.3 }, pose: { walk: t < tOut + 1.2 ? t * 6 : null, aR: [0.05, 0.1], aL: [0.05, 0.1] }, seed: 5 }); c.restore();
    sticker(c, 540, 560, ['ЭТО НЕ', 'ПО МЕТОДИЧКЕ'], 'pink', 0.04, k(t, tM - 0.05), 66, { tail: -1 });
  } else if (t < tP - 0.1) { sticker(c, 540, 800, ['КУРС 50 000 ₽', 'НЕ НУЖЕН'], 'yellow', -0.04, k(t, tK - 0.05), 82, { strike: k(t, W('оказался'), 0.4) }); G.confetti(c, t, W('нужен'), 540, 800, 30, 4, ['#ff3b3b', '#ffe03a']); }
  else { P(c, 'guy', 540, 1430, 230, t, { front: true, ex: 'smile', pose: { aR: [1.0, -1.6], aL: [1.0, -1.6], tilt: sway(t) }, seed: 1 }); sticker(c, 540, 470, ['ХВАТАЛО ПРОСТО', 'БЫТЬ ПАРНЕМ'], 'green', -0.03, k(t, tP - 0.05), 66); G.confetti(c, t, W('парнем'), 540, 470, 50, 6); }
}, { punch: [W('через', 28), W('курс'), W('хватало')], shake: [W('курс')] });
// 5 gym at 3 a.m.
scene(W('три', 37) - 0.1, ['#071a3a', '#2f6fe0'], (c, t) => {
  const tQ = W('в', 39), tM = W('парни'), tC = W('тренер');
  if (t < tQ - 0.1) { bigClock(c, 540, 820, 300, 3, 0); }
  else if (t < tM - 0.1) { // queue to the gym door
    rr(c, 640, 400, 340, 900, 20); c.fillStyle = '#16223a'; c.fill(); ol(c, 8); rr(c, 600, 330, 420, 110, 20); c.fillStyle = '#ff4fa3'; c.fill(); ol(c, 7); txt(c, 'КАЧАЛКА', 810, 388, 58, '#fff');
    for (let i = 0; i < 7; i++) mini(c, 560 - i * 110, 1300 + (i % 2) * 20, 0.95, ['#ee2f3f', '#4fc3ff', '#7dff6a', '#ffe03a', '#ff8a3a', '#a35bff', '#ffffff'][i], t, i, { hair: '#2a1e18' });
    sticker(c, 300, 600, 'ОЧЕРЕДЬ', 'yellow', -0.05, k(t, W('очередь') - 0.05), 70);
  } else if (t < tC - 0.1) { // calendar "since Monday" pages
    rr(c, 240, 420, 600, 640, 30); c.fillStyle = '#fff'; c.fill(); ol(c, 8); rr(c, 240, 420, 600, 150, 30); c.fillStyle = '#ee2f3f'; c.fill(); ol(c, 8);
    const flip = Math.floor((t - tM) * 6) % 7; txt(c, ['ПН', 'ПН', 'ПН', 'ПН', 'ПН', 'ПН', 'ПН'][flip], 540, 800, 230, INK); txt(c, 'С ПОНЕДЕЛЬНИКА', 540, 500, 54, '#fff');
    sticker(c, 540, 1180, '3 ГОДА', 'pink', 0.04, k(t, W('три', 41) - 0.05), 80);
    if (t > W('пришли') - 0.05) sticker(c, 540, 330, 'ПРИШЛИ СЕГОДНЯ', 'green', -0.03, k(t, W('пришли') - 0.05), 60);
  } else { P(c, 'coach', 540, 1420, 230, t, { front: true, ex: 'broken', exo: { mouth: 0.6, tear: 1 }, pose: { aR: [0.4, 1.2], aL: [0.4, 1.2], tilt: Math.sin(t * 12) * 0.05 }, seed: 4, hold: (h, u) => { rr(h, -u * 0.1, -u * 0.05, u * 0.25, u * 0.12, u * 0.04); h.fillStyle = '#c0c0c8'; h.fill(); ol(h, 4); } }); G.drops(c, t, tC, 540, 760, 5); }
}, { tr: 'flash', punch: [W('в', 39), W('парни'), W('тренер')], shake: [W('ночи')] });
// 6 "я не такой"
scene(W('каждый') - 0.1, ['#062a2a', '#1ec8b0'], (c, t) => {
  const t1 = W('второго') - 0.4, t2 = W('сообщения'), cr = t2 + 0.35;
  P(c, 'guy', 540, 1440, 220, t, { front: true, ex: t > cr ? 'surprised' : 'smug' in T.EX ? 'smug' : 'smirk', pose: { aR: [2.6, 0.2], aL: [2.6, 0.2], tilt: sway(t) }, seed: 1 });
  sticker(c, 540, 560, ['Я НЕ', 'ТАКОЙ'], 'white', -0.03, k(t, W('я', 47) - 0.05), 96, { crack: t > cr });
  for (const [tm, yy, s] of [[t1, 290, 'привет)'], [t2, 410, 'ты не спишь?']]) { const kk = k(tm, 0) ; const dk = clamp((t - tm) / 0.3); if (dk <= 0) continue; c.save(); c.translate(lerp(1300, 760, easeOut(dk)), yy); rr(c, -220, -50, 440, 100, 40); c.fillStyle = '#ff6fb5'; c.fill(); ol(c, 6); txt(c, s, 0, 2, 48, '#fff'); c.restore(); }
  if (t > cr) G.sparks(c, t, cr, 540, 560, 30, '#ffffff', 9);
}, { punch: [W('сообщения')], shake: [W('сообщения') + 0.35] });
// 7 moms
scene(W('утро') - 0.1, ['#3a2006', '#ffb02a'], (c, t) => {
  const tM = W('мамы'), tD = W('сынок');
  if (t < tM - 0.1) { c.beginPath(); c.arc(540, 980, 260, Math.PI, 0); c.fillStyle = '#ffd21f'; c.fill(); ol(c, 10); for (let i = 0; i < 9; i++) { const a = Math.PI + i / 8 * Math.PI; c.beginPath(); c.moveTo(540 + Math.cos(a) * 300, 980 + Math.sin(a) * 300); c.lineTo(540 + Math.cos(a) * 380, 980 + Math.sin(a) * 380); c.lineWidth = 16; c.strokeStyle = '#ffd21f'; c.stroke(); } c.fillStyle = '#5a2a10'; c.fillRect(0, 980, 1080, 600); txt(c, '05:00', 540, 1200, 160, '#ffe03a', 'center', 18); }
  else if (t < tD - 0.1) { // 4-split moms
    const cols = ['#ff8fbf', '#7fd8ff', '#c8ff7a', '#ffd27a'];
    for (let i = 0; i < 4; i++) { const x = (i % 2) * 540, y = 300 + Math.floor(i / 2) * 560; c.save(); rr(c, x + 20, y, 500, 540, 30); c.fillStyle = cols[i]; c.fill(); ol(c, 8); c.clip(); P(c, 'mom', x + 270, y + 760, 170, t + i, { face: i % 2 ? -1 : 1, ex: 'confused', pose: { aR: [1.25, 1.35], tilt: sway(t, i) }, seed: i, hold: (h, u) => { rr(h, -u * 0.1, -u * 0.25, u * 0.2, u * 0.4, u * 0.04); h.fillStyle = INK; h.fill(); } }); c.restore(); }
  } else { // dialog: mom vs son
    c.save(); rr(c, 20, 300, 500, 1100, 30); c.fillStyle = '#ff8fbf'; c.fill(); ol(c, 8); c.clip(); P(c, 'mom', 270, 1500, 210, t, { face: 1, ex: t > W('5', 55) ? 'surprised' : 'confused', pose: { aR: [1.25, 1.35] }, talk: 0, seed: 2, hold: (h, u) => { rr(h, -u * 0.1, -u * 0.25, u * 0.2, u * 0.4, u * 0.04); h.fillStyle = INK; h.fill(); } }); c.restore();
    c.save(); rr(c, 560, 300, 500, 1100, 30); c.fillStyle = '#7fd8ff'; c.fill(); ol(c, 8); c.clip(); P(c, 'guy', 810, 1500, 210, t, { face: -1, ex: t > W('проект') ? 'surprised' : 'smile', pose: { aR: [1.25, 1.35] }, seed: 1, hold: (h, u) => { rr(h, -u * 0.1, -u * 0.25, u * 0.2, u * 0.4, u * 0.04); h.fillStyle = INK; h.fill(); } }); c.restore();
    const L = [[W('сынок'), 300, 420, ['СЫНОК,', 'ТЫ ГДЕ?'], 'pink', -0.04], [W('мам', 54), 780, 560, ['МАМ, Я', 'НА РАБОТЕ'], 'yellow', 0.04], [W('в', 56), 300, 700, 'В 5 УТРА?!', 'red', -0.05], [W('мам', 57), 780, 840, ['МАМ, ПРОЕКТ', 'ГОРИТ'], 'yellow', 0.03]];
    for (const [tm, x, y, s, col, r] of L) sticker(c, x, y, s, col, r, k(t, tm - 0.05), 50);
    if (t > W('горит')) G.smoke(c, t, 820, 1000, 5, '#ff8a3a', 11, 0.5);
  }
}, { punch: [W('мамы'), W('сынок')], shake: [W('5', 55)] });
// 8 exes
scene(W('бывшие') - 0.1, ['#2a0630', '#d03aff'], (c, t) => {
  const tT = W('тебе', 60), tB = W('ты', 61.5), tN = W('она', 62.8);
  if (t < tT - 0.1) { for (let i = 0; i < 10; i++) { const R = rng(i), x = 150 + R() * 780, y = 380 + R() * 900, kk = k(t, W('бывшие') + i * 0.12, 0.25); if (kk > 0) { c.save(); c.translate(x, y); c.scale(G.bounce(kk), G.bounce(kk)); rr(c, -150, -45, 300, 90, 40); c.fillStyle = '#fff'; c.fill(); ol(c, 5); txt(c, 'Бывшая ✉', 0, 3, 40, INK); c.restore(); } } }
  else { phone(c, 540, 860, 480, 0, (s, w, h) => { s.fillStyle = '#1e1b2e'; s.fillRect(0, 0, w, h); txt(s, 'КОНТАКТЫ', w / 2, 70, 44, '#fff');
      for (let i = 0; i < 5; i++) { const y = 150 + i * 135; rr(s, 20, y, w - 40, 110, 22); s.fillStyle = '#2e2944'; s.fill(); ol(s, 4); s.beginPath(); s.arc(80, y + 55, 34, 0, 6.283); s.fillStyle = ['#ff8fbf', '#7fd8ff', '#c8ff7a', '#ffd27a', '#b88aff'][i]; s.fill(); ol(s, 3); txt(s, 'Бывшая ' + (i + 1), 135, y + 40, 34, '#fff', 'left'); if (t > tB + i * 0.12) { rr(s, 135, y + 62, 230, 36, 18); s.fillStyle = '#ff3b3b'; s.fill(); txt(s, 'ЗАБЛОКИРОВАН', 250, y + 82, 22, '#fff'); } }
      if (t > tN - 0.05) { const nk = G.bounce(k(t, tN - 0.05)); s.save(); s.translate(w / 2, h - 170); s.scale(nk, nk); rr(s, -w * 0.45, -70, w * 0.9, 140, 30); s.fillStyle = '#7dff6a'; s.fill(); ol(s, 5); txt(s, 'Новый аккаунт:', 0, -22, 34, INK); txt(s, '«привет, это я»', 0, 26, 34, INK); s.restore(); } });
    sticker(c, 300, 330, 'ТЕБЕ ТОЖЕ', 'pink', -0.05, k(t, tT - 0.05), 60); }
}, { punch: [W('тебе', 60), W('ты', 61.5), W('она', 62.8)], shake: [W('нового')] });
// 9 noon, WHO statement
scene(W('полдень') - 0.1, ['#0a2a3a', '#5fd8ff'], (c, t) => {
  const tD = W('воз'), tS = tD + 0.75, tZ = W('через', 67);
  if (t < tD - 0.1) { c.beginPath(); c.arc(540, 820, 230, 0, 6.283); c.fillStyle = '#ffd21f'; c.fill(); ol(c, 10); for (let i = 0; i < 12; i++) { const a = i / 12 * 6.283 + t; c.beginPath(); c.moveTo(540 + Math.cos(a) * 270, 820 + Math.sin(a) * 270); c.lineTo(540 + Math.cos(a) * 360, 820 + Math.sin(a) * 360); c.lineWidth = 18; c.strokeStyle = '#ffd21f'; c.stroke(); } txt(c, '12:00', 540, 1210, 170, '#fff', 'center', 18); return; }
  const z = t > tZ ? lerp(1, 1.45, easeIO(k(t, tZ, 0.6))) : 1; c.save(); c.translate(540, 950); c.scale(z, z); c.translate(-540, -950);
  rr(c, 150, 330, 780, 1080, 20); c.fillStyle = '#fffdf6'; c.fill(); ol(c, 8); txt(c, 'ЗАЯВЛЕНИЕ', 540, 440, 68, INK);
  c.fillStyle = '#d0ccd8'; for (let i = 0; i < 6; i++) rr(c, 220, 520 + i * 60, 640 - (i % 3) * 90, 26, 10), c.fill();
  rr(c, 200, 900, 680, 230, 16); c.fillStyle = '#fff3a8'; c.fill(); ol(c, 5); txt(c, 'Через 9 месяцев', 540, 960, 50, INK); txt(c, 'роддомам рекомендуют', 540, 1020, 50, INK); txt(c, 'готовиться', 540, 1080, 50, '#ee2f3f');
  if (t > tS) { const sk = clamp((t - tS) / 0.12); c.save(); c.translate(690, 1280); c.rotate(-0.2); const s = lerp(2.2, 1, easeOut(sk)); c.scale(s, s); c.globalAlpha = sk; c.beginPath(); c.arc(0, 0, 110, 0, 6.283); c.lineWidth = 14; c.strokeStyle = '#2f6fe0'; c.stroke(); c.beginPath(); c.arc(0, 0, 86, 0, 6.283); c.lineWidth = 5; c.stroke(); txt(c, 'ВОЗ', 0, 4, 80, '#2f6fe0'); c.restore(); }
  c.restore();
}, { tr: 'flash', punch: [W('воз'), W('воз') + 0.75], shake: [W('воз') + 0.75] });
// 10 evening: two camps, the bench in the rain, mom calls
scene(W('вечер') - 0.1, ['#0a0f2a', '#2a3a7a'], (c, t) => {
  const tL = W('мужчины'), t1 = W('первые', 74), t2 = W('вторые'), t0 = W('а', 79), tO = W('один'), tR = W('телефон', 85);
  if (t < tL - 0.1) { txt(c, '19:00', 540, 860, 220, '#9ad8ff', 'center', 22); return; }
  if (t < t2 - 0.1) { // two camps split
    const fz = t > t1 ? easeOut(k(t, t1, 0.4)) : 0;
    c.save(); rr(c, 20, 300, 500, 1120, 30); c.fillStyle = '#3a2a5a'; c.fill(); ol(c, 8); c.clip(); rr(c, 90, 520, 360, 260, 20); c.fillStyle = '#ffd27a'; c.fill(); ol(c, 6); P(c, 'guy', 270, 1500, 190, t, { front: true, ex: 'bored', pose: { aR: [0.3, 0.3], aL: [0.3, 0.3] }, seed: 1 }); rr(c, 60, 1180, 420, 300, 60); c.fillStyle = '#7f6ad0'; c.fill(); ol(c, 6); c.restore();
    c.save(); rr(c, 560, 300, 500, 1120, 30); c.fillStyle = '#1a2240'; c.fill(); ol(c, 8); c.clip(); rr(c, 600, 1220, 420, 40, 14); c.fillStyle = '#8a5a32'; c.fill(); ol(c, 5); mini(c, 810, 1240, 1.2, '#ee2f3f', t, 2, { hair: '#4a2c1c', bounce: 0 }); c.restore();
    sticker(c, 540, 260 + 80, 'ДВА ЛАГЕРЯ', 'yellow', -0.03, k(t, W('лагеря') - 0.05), 64);
    if (fz > 0) sticker(c, 270, 900, ['НЕ ВЫХОДЯТ', 'ИЗ ДОМА'], 'purple', 0.04, fz, 44);
    return;
  }
  // bench in the rain (cold palette)
  c.fillStyle = 'rgba(10,20,50,0.55)'; c.fillRect(0, 0, 1080, 1920);
  if (t < t0 - 0.1 || t > tO - 0.1) {
    rr(c, 140, 1180, 800, 50, 16); c.fillStyle = '#6a4a32'; c.fill(); ol(c, 6); rr(c, 140, 1060, 800, 40, 14); c.fill(); ol(c, 6); c.fillStyle = INK; c.fillRect(200, 1230, 22, 200); c.fillRect(860, 1230, 22, 200);
    P(c, 'guy', 540, 1180 + 1.45 * 190, 190, t, { ex: t > tR ? (t > W('мама', 86.5) ? 'soft' : 'surprised') : 'sad', pose: { sit: true, lean: 0.2, aR: [1.6, 1.0], aL: [1.4, 1.0], tilt: 0.12 }, seed: 1, hold: (h, u) => { rr(h, -u * 0.12, -u * 0.25, u * 0.24, u * 0.42, u * 0.05); h.fillStyle = t > tR ? '#7dff6a' : '#9ad8ff'; h.fill(); ol(h, 4); } });
    if (t > tO - 0.05 && t < tR - 0.1) sticker(c, 540, 560, ['Я ПРОСТО ХОТЕЛ,', 'ЧТОБЫ ХОТЬ КТО-ТО', 'НАПИСАЛ'], 'white', -0.03, k(t, tO + 1.0), 52, { tail: 1 });
    if (t > tR - 0.05) { const rk = G.bounce(k(t, tR - 0.05)); c.save(); c.translate(540, 560); c.scale(rk, rk); c.rotate(Math.sin(t * 40) * 0.04); rr(c, -260, -110, 520, 220, 40); c.fillStyle = '#7dff6a'; c.fill(); ol(c, 8); txt(c, 'Мама', 0, -30, 70, INK); txt(c, 'входящий звонок', 0, 45, 40, INK); c.restore(); }
  } else { phone(c, 540, 860, 470, 0, (s, w, h) => { s.fillStyle = '#121a30'; s.fillRect(0, 0, w, h); txt(s, '0', w / 2, h * 0.42, 300, '#9ad8ff', 'center', 16); txt(s, 'сообщений', w / 2, h * 0.62, 56, '#fff'); }); }
  rainFx(c, t);
}, { punch: [W('мужчины'), W('вторые'), W('а', 79), W('телефон', 85)], shake: [W('телефон', 85)], music: 'piano' });
function rainFx(c, t) { const R = rng(31); c.save(); c.strokeStyle = 'rgba(170,210,255,0.6)'; c.lineWidth = 4; c.lineCap = 'round'; for (let i = 0; i < 90; i++) { const x = R() * 1200 - 60, y = ((R() * 2000 + t * 1500) % 2100) - 100; c.beginPath(); c.moveTo(x, y); c.lineTo(x - 10, y + 50); c.stroke(); } c.restore(); }
// 11 midnight: 23:59 -> 00:00, counter -> 1
scene(W('полночь', 80) - 0.1, ['#062a12', '#2fe06a'], (c, t) => {
  const tE = W('закончилось'), tG = W('девушки', 89), tV = W('что', 92);
  if (t < tG - 0.1) { const s = t < tE ? '23:59' : '00:00'; const sc = t > tE ? G.bounce(k(t, tE, 0.3)) : 1 + 0.03 * Math.sin(t * 25); c.save(); c.translate(540, 860); c.scale(sc, sc); txt(c, s, 0, 0, 260, t < tE ? '#fff' : '#7dff6a', 'center', 26); c.restore(); G.sparks(c, t, tE, 540, 860, 40, '#7dff6a', 12); return; }
  for (let i = 0; i < 9; i++) { const x = 150 + (i % 3) * 390 + (Math.floor(i / 3) % 2) * 0, y = 760 + Math.floor(i / 3) * 280; mini(c, x, y, 1.3, ['#ff8fbf', '#ffe03a', '#7fd8ff', '#c8ff7a', '#ffb07a', '#b88aff'][i % 6], t, i, { hair: ['#7a4a2a', '#ffd27a', '#2a1e18'][i % 3], look: Math.sin(t * 2 + i) > 0 ? 1 : -1, mouth: 'o', bounce: 0.2 }); }
  sticker(c, 540, 420, ['ЧТО ВЧЕРА', 'БЫЛО?'], 'yellow', -0.04, k(t, tV - 0.05), 74);
  if (t > W('никто') - 0.05) for (let i = 0; i < 6; i++) txt(c, '?', 160 + i * 150, 620 + Math.sin(t * 4 + i) * 30, 90, '#fff', 'center', 10);
}, { tr: 'flash', punch: [W('закончилось'), W('девушки', 89), W('что', 92)], shake: [W('закончилось')], flashGreen: true });
// 12 final: the message at 00:01, she sits next to you
scene(W('ты', 95.5) - 0.1, ['#140820', '#3a1660'], (c, t) => {
  const tMsg = W('одно'), tT = W('00:01'), tQ = W('ты', 102), tS = W('она', 103), tR = W('читаешь');
  if (t < tS - 0.1) { const z = t > tT ? lerp(1, 1.25, easeIO(k(t, tT, 0.5))) : 1; c.save(); c.translate(540, 860); c.scale(z, z); c.translate(-540, -860);
    phone(c, 540, 860, 480, 0, (s, w, h) => { s.fillStyle = '#0e0a18'; s.fillRect(0, 0, w, h); txt(s, '00:01', w / 2, 130, 110, '#fff');
      if (t > tMsg - 0.05) { const mk = G.bounce(k(t, tMsg - 0.05)); s.save(); s.translate(w / 2, h * 0.5); s.scale(mk, mk); rr(s, -w * 0.44, -110, w * 0.88, 220, 34); s.fillStyle = '#ffffff'; s.fill(); ol(s, 5); s.beginPath(); s.arc(-w * 0.32, -40, 34, 0, 6.283); s.fillStyle = '#3fe08c'; s.fill(); ol(s, 3); txt(s, 'Моя ❤', -w * 0.2, -40, 38, INK, 'left'); txt(s, t > tQ - 0.05 ? 'Ты не спишь?' : '...', -w * 0.36, 30, 46, INK, 'left'); txt(s, '00:01', w * 0.36, 82, 26, '#888', 'right'); s.restore(); } });
    c.restore(); return; }
  // room: guy on sofa reading, girl next to him slowly turns to camera
  c.fillStyle = 'rgba(20,10,40,0.5)'; c.fillRect(0, 0, 1080, 1920); glowPhone(c, 380, 980);
  rr(c, 60, 1130, 960, 260, 60); c.fillStyle = '#5a3a8a'; c.fill(); ol(c, 8); rr(c, 90, 960, 900, 240, 50); c.fillStyle = '#6a4aa0'; c.fill(); ol(c, 8);
  P(c, 'guy', 360, 1130 + 1.45 * 200 - 40, 200, t, { face: 1, ex: 'surprised', pose: { sit: true, lean: 0.15, aR: [1.7, 1.0], aL: [1.5, 1.0], tilt: 0.1 }, seed: 1, hold: (h, u) => { rr(h, -u * 0.12, -u * 0.25, u * 0.24, u * 0.42, u * 0.05); h.fillStyle = '#bfe9ff'; h.fill(); ol(h, 4); } });
  const turn = easeIO(k(t, tS + 0.6, tR - tS - 0.4));
  P(c, 'girl', 720, 1130 + 1.45 * 205 - 40, 205, t, { front: turn > 0.5, face: -1, ex: 'smirk', exo: { eye: 0.5, gaze: turn > 0.5 ? 0 : 0.6 }, pose: { sit: true, aR: [1.1, 1.6], aL: [0.4, 0.6], tilt: -0.04 }, seed: 6, hold: (h, u) => vape(h, u, t) });
  G.smoke(c, t, 800, 760, 5, '#c8b8ff', 21, 0.35);
  if (t > tR + 0.3) { c.fillStyle = `rgba(0,0,0,${0.35 * k(t, tR + 0.3, 0.3)})`; c.fillRect(0, 0, 1080, 1920); }
}, { punch: [W('00:01'), W('она', 103), W('читаешь') + 0.35], shake: [W('читаешь') + 0.35], music: 'silence' });
function glowPhone(c, x, y) { const g = c.createRadialGradient(x, y, 0, x, y, 420); g.addColorStop(0, 'rgba(160,220,255,0.35)'); g.addColorStop(1, 'rgba(160,220,255,0)'); c.fillStyle = g; c.fillRect(x - 420, y - 420, 840, 840); }
// 13 question: A / B
scene(W('что', 106.5) - 0.1, ['#1c0b33', '#a35bff'], (c, t) => {
  const tA = W('отвечаешь'), tB = W('притворяешься'), tC = W('пиши');
  const btn = (y, col, a, b, tm) => { const kk = G.bounce(k(t, tm - 0.25)); if (kk <= 0) return; const press = t > tm && t < tm + 0.15 ? 0.92 : 1; c.save(); c.translate(540, y); c.scale(kk * press, kk * press); rr(c, -440, -120 + 14, 880, 240, 50); c.fillStyle = INK; c.fill(); rr(c, -440, -120, 880, 240, 50); c.fillStyle = col; c.fill(); ol(c, 9); c.beginPath(); c.arc(-330, 0, 70, 0, 6.283); c.fillStyle = '#fff'; c.fill(); ol(c, 6); txt(c, a, -330, 4, 90, INK); txt(c, b[0], 60, b.length > 1 ? -36 : 4, 56, INK); if (b[1]) txt(c, b[1], 60, 40, 56, INK); c.restore(); };
  const tq = W('что', 106.5); sticker(c, 540, 360, 'ЧТО ДЕЛАЕШЬ?', 'white', -0.04, k(t, tq - 0.05), 70);
  btn(640, '#7dff6a', 'А', ['ОТВЕЧАЕШЬ'], tA); btn(960, '#ff6fb5', 'Б', ['ПРИТВОРЯЕШЬСЯ,', 'ЧТО СПИШЬ'], tB);
  sticker(c, 540, 1300, 'ПИШИ В КОММЕНТАРИЯХ', 'yellow', -0.03, k(t, tC - 0.05), 58);
}, { punch: [W('отвечаешь'), W('притворяешься'), W('пиши')], shake: [] });
for (let i = 0; i < S.length; i++) S[i].t1 = i + 1 < S.length ? S[i + 1].t0 : 113.0;
// HUD state over time
function hudState(t) {
  const J = [[0, '00:00'], [W('первая') - 0.1, '00:01'], [W('пикап') - 0.1, '00:20'], [W('три', 37), '03:00'], [W('утро'), '05:00'], [W('бывшие'), '08:00'], [W('полдень'), '12:00'], [W('вечер'), '19:00'], [W('полночь', 80), '23:59'], [W('закончилось'), '00:00'], [W('ты', 95.5), '00:01']];
  let timer = '00:00', tj = -9; for (const [a, s] of J) if (t >= a) { timer = s; tj = a; }
  let count, tc = -9; const cs = W('девушки'), ce = W('миллиард') + 0.4;
  if (t < cs) count = '0'; else if (t < ce) { const v = Math.round(4e9 * easeIn(clamp((t - cs) / (ce - cs))) ** 0.6); count = v.toLocaleString('ru-RU').replace(/[\s ,]/g, ' '); } else count = '4 МЛРД';
  if (t >= ce) tc = ce; if (t >= W('закончилось')) { count = '1'; tc = W('закончилось'); }
  return { timer, count, pT: clamp((t - tj) / 0.35), pC: clamp((t - tc) / 0.35) };
}
module.exports = { S, hudState, W };
