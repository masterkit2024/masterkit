// "Мама" — paper storybook shots, keyed to the voice
const C = require('../viz/core'); const P = require('./paper');
const { hex, rgba, mix, shade, lg, rg, clamp, lerp, ease, easeIO, easeOut, easeIn, seg, kf, glow, cone, dust, applyCam, VW, VH } = C;
const { PAL, part, circ, ell, poly, figure, CAST, baby } = P;
const TL = require('./timeline.json'); const WS = TL.words;
const norm = w => w.toLowerCase().replace(/[^а-яё0-9]/g, '');
function W(pre, after = 0, k = 's') { const w = WS.find(w => w.s >= after && norm(w.w).startsWith(pre)); if (!w) throw new Error(pre); return w[k]; }
const tl = (t0, t1, a, b, e = easeIO) => t => kf([[t0, a], [t1, b]], t, e);
// lights
const LW = { dir: -1, amb: hex('#8a4a3a'), rim: hex('#fff1d6'), rimI: 0.75 };   // warm lamp
const LD = { dir: 1, amb: hex('#7a5a40'), rim: hex('#fff8e8'), rimI: 0.8 };    // daylight from right
const LN = { dir: 1, amb: hex('#2a3060'), rim: hex('#bcd2ff'), rimI: 0.6 };    // night / moon
const FONTS = { title: 'Playfair', serif: 'LoraS', serifI: 'LoraI', hand: 'Caveat' };
// ---------- shared helpers ----------
function bgPaper(c, top, bot) { c.fillStyle = lg(c, 0, -300, 0, VH + 300, [[0, rgba(top)], [1, rgba(bot)]]); c.fillRect(-600, -600, VW + 1200, VH + 1200); }
function textReveal(c, str, x, y, font, size, col, k, o = {}) {
  if (k <= 0) return; c.save(); c.font = `${o.weight || ''} ${size}px ${font}`; c.textBaseline = 'middle';
  const sp = o.spacing || 0; const chars = [...str]; const ws = chars.map(ch => c.measureText(ch).width); const tw = ws.reduce((a, b) => a + b, 0) + sp * (chars.length - 1);
  let xx = x - (o.align === 'left' ? 0 : tw / 2);
  chars.forEach((ch, i) => { const kk = clamp(k * (chars.length + 2) / 1 - i); const a = easeOut(clamp(kk)); c.save(); c.globalAlpha = a * (o.alpha ?? 1); c.translate(xx + ws[i] / 2, y + (1 - a) * size * 0.25); if (o.glow) { c.shadowColor = rgba(o.glow, 0.9); c.shadowBlur = size * 0.5; } c.fillStyle = rgba(col); c.textAlign = 'center'; c.fillText(ch, 0, 0); c.restore(); xx += ws[i] + sp; });
  c.restore();
}
function tag(c, str, x, y, rot, k) { // handwritten paper tag
  if (k <= 0) return; c.save(); c.translate(x, y); c.rotate(rot + (1 - easeOut(k)) * 0.3); const s = 0.6 + 0.4 * easeOut(k); c.scale(s, s); c.globalAlpha = clamp(k * 2);
  c.font = `92px ${FONTS.hand}`; const w = c.measureText(str).width + 80;
  P.paperShadow(c, 10); c.beginPath(); c.moveTo(-w / 2, -62); c.lineTo(w / 2 - 30, -62); c.lineTo(w / 2 + 10, 0); c.lineTo(w / 2 - 30, 62); c.lineTo(-w / 2, 62); c.closePath(); c.fillStyle = rgba(PAL.cream); c.fill(); P.paperShadow(c, 0, false);
  c.fillStyle = rgba(PAL.rust); c.beginPath(); c.arc(w / 2 - 34, 0, 10, 0, 6.283); c.fill();
  c.fillStyle = rgba(PAL.ink); c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText(str, -14, 4); c.restore();
}
function windowNight(c, x, y, w, h, t, o = {}) { // window with moon & stars
  c.save(); P.paperShadow(c, 14); c.fillStyle = rgba(hex('#e9d6b8')); c.fillRect(x - 24, y - 24, w + 48, h + 48); P.paperShadow(c, 0, false);
  c.beginPath(); c.rect(x, y, w, h); c.save(); c.clip(); c.fillStyle = lg(c, 0, y, 0, y + h, [[0, '#1a1f40'], [1, '#3a3a6a']]); c.fillRect(x, y, w, h);
  const R = C.rng(5); for (let i = 0; i < 26; i++) { const sx = x + R() * w, sy = y + R() * h * 0.8, tw = 0.5 + 0.5 * Math.sin(t * 2 + i); c.fillStyle = `rgba(255,240,200,${0.4 + 0.5 * tw})`; c.beginPath(); c.arc(sx, sy, 2 + R() * 3, 0, 6.283); c.fill(); }
  if (o.moon !== false) { glow(c, x + w * 0.7, y + h * 0.25, w * 0.45, hex('#fff1c8'), 0.5); c.fillStyle = '#fff4d8'; c.beginPath(); c.arc(x + w * 0.7, y + h * 0.25, w * 0.1, 0, 6.283); c.fill(); }
  if (o.city) { c.fillStyle = '#141830'; for (let i = 0; i < 8; i++) { const bw = w / 7, bh = h * (0.2 + (i * 37 % 30) / 100); c.fillRect(x + i * bw - 10, y + h - bh, bw - 6, bh); for (let k = 0; k < 6; k++) if ((i * 7 + k) % 3 === 0) { c.fillStyle = 'rgba(255,210,140,0.85)'; c.fillRect(x + i * bw + 8, y + h - bh + 14 + k * 26, 12, 14); c.fillStyle = '#141830'; } } }
  c.restore(); c.strokeStyle = rgba(hex('#e9d6b8')); c.lineWidth = 16; c.beginPath(); c.moveTo(x + w / 2, y); c.lineTo(x + w / 2, y + h); c.moveTo(x, y + h / 2); c.lineTo(x + w, y + h / 2); c.stroke(); c.restore();
}
function lamp(c, x, y, I = 1, col = hex('#ffcf8a')) { glow(c, x, y + 40, 420, col, 0.55 * I); c.save(); P.paperShadow(c, 8); c.fillStyle = rgba(PAL.terracotta); c.beginPath(); c.moveTo(x - 70, y + 70); c.lineTo(x + 70, y + 70); c.lineTo(x + 40, y); c.lineTo(x - 40, y); c.closePath(); c.fill(); c.restore(); glow(c, x, y + 75, 120, hex('#fff1c8'), 0.9 * I); cone(c, x, y + 72, 0, 0.6, 900, col, 0.12 * I, 60); }
function floor(c, y, col) { c.save(); P.paperShadow(c, 12); c.fillStyle = rgba(col); c.fillRect(-600, y, VW + 1200, VH); c.restore(); }
function heartbeatPulse(t, beats) { let v = 0; for (const b of beats) { const d = t - b; if (d >= 0 && d < 0.6) v = Math.max(v, Math.exp(-d * 7)); const d2 = d - 0.22; if (d2 >= 0 && d2 < 0.6) v = Math.max(v, 0.7 * Math.exp(-d2 * 7)); } return v; }
const HB0 = [0.35, 1.15], HB1 = [W('слышала'), W('слышала') + 0.8, W('слышала') + 1.6], HBE = [94.9];
// ---------- shot list ----------
const SH = []; const shot = (t0, t1, draw, grade, xin = 0.3) => SH.push({ t0, t1, draw, grade, xin });
const GW = { tint: hex('#f0a050'), tintA: 0.14, bloom: 0.42, grain: 0.07, vig: 60 }, GN = { tint: hex('#4a5ab0'), tintA: 0.16, bloom: 0.45, grain: 0.07, vig: 45 }, GD = { tint: hex('#ffd9a0'), tintA: 0.1, bloom: 0.35, grain: 0.06, vig: 70 };
// 0 black -> warm dot -> МАМА
shot(0, W('твой') - 0.15, (F, t) => { F.layer(c => {
  c.fillStyle = '#0b0807'; c.fillRect(0, 0, VW, VH); const hb = heartbeatPulse(t, HB0); const grow = easeOut(seg(t, 0.2, 2.0));
  glow(c, 540, 860, 60 + 160 * grow + 60 * hb, hex('#ffc27a'), 0.5 + 0.4 * hb); glow(c, 540, 860, 18 + 10 * hb, hex('#fff1d0'), 0.9);
  const k = seg(t, W('мама') - 0.1, W('мама') + 0.9); textReveal(c, 'МАМА', 540, 760, FONTS.title, 190, hex('#f7e6c8'), k, { spacing: 34, glow: hex('#ffb460'), weight: '700' });
  textReveal(c, 'Кто это?', 540, 1000, FONTS.serifI, 60, hex('#d9bfa0'), seg(t, W('мама') + 1.0, W('мама') + 1.6), { alpha: 0.85 });
}, 0); }, GW, 0);
// 1 baby hand grips mother's finger; memory mist on "не помнишь"
shot(W('твой') - 0.15, W('она') - 0.25, (F, t) => { const t0 = W('твой') - 0.15, mist = easeIO(seg(t, W('помнишь') - 0.3, W('она') - 0.3)); const cam = tl(t0, W('она'), { x: 0, y: 30, z: 1.05 }, { x: 20, y: -10, z: 1.18 })(t);
  F.layer(c => { applyCam(c, cam, 0.5); bgPaper(c, hex('#d9a982'), hex('#b97c5a')); glow(c, 760, 600, 600, hex('#ffe6c0'), 0.35); }, 6);
  F.layer(c => { applyCam(c, cam, 1);
    // mother's finger (big) coming from right
    part(c, poly([[1200, 760], [620, 820], [560, 860], [580, 900], [640, 915], [1200, 930]], 0.4), hex('#efc3a2'), LW, { ps: 16 });
    part(c, ell(585, 862, 30, 22, 0.1), hex('#f7d8c4'), LW, { ps: 4, noShadow: true });
    // baby hand
    const g = easeOut(seg(t, t0 + 0.3, t0 + 1.0));
    part(c, poly([[200, 1220], [360, 1060], [470, 980], [560, 960], [600, 1000], [560, 1060], [420, 1150], [300, 1290]], 0.45), hex('#f6cfb2'), LW, { ps: 14 });
    for (let i = 0; i < 4; i++) { const a = -0.9 + i * 0.32, len = 95 - i * 8, bx = 520 + i * 26, by = 960 + i * 18; const curl = lerp(0.2, 1.3, g); c.save(); c.translate(bx, by); c.rotate(a - curl * 0.6); part(c, (cc, ox, oy) => { cc.moveTo(ox - 16, oy); cc.quadraticCurveTo(ox + len * 0.6, oy - 30 - curl * 20, ox + len, oy - 10 + curl * 50); cc.quadraticCurveTo(ox + len * 0.5, oy + 22, ox - 16, oy + 22); cc.closePath(); }, hex('#f8d4ba'), LW, { ps: 6 }); c.restore(); }
    part(c, ell(480, 1060, 60, 34, -0.6), hex('#f8d4ba'), LW, { ps: 6 });
  }, 0);
  dustL(F, t, cam);
  if (mist > 0) F.layer(c => { c.fillStyle = `rgba(245,232,214,${0.5 * mist})`; c.fillRect(0, 0, VW, VH); }, 0);
}, { ...GW, tintA: 0.1 }, 0.5);
function dustL(F, t, cam, col = hex('#fff1d0')) { F.layer(c => { applyCam(c, cam, 1.4); dust(c, t, 7, 50, [-100, 100, VW + 200, 1500], col, 0.6, 5); }, 2); }
// 2 pregnant mama at the night window, glow in the belly
shot(W('она') - 0.25, W('первая') - 0.2, (F, t) => { const t0 = W('она') - 0.25, t1 = W('первая'); const cam = tl(t0, t1, { x: -60, y: 40, z: 1.0 }, { x: 60, y: -40, z: 1.22 })(t);
  const hb = heartbeatPulse(t, HB1); const talkK = seg(t, W('говорила'), W('говорила') + 0.6);
  F.layer(c => { applyCam(c, cam, 0.4); bgPaper(c, hex('#2a2640'), hex('#1a1830')); windowNight(c, 520, 260, 440, 640, t); }, 3);
  F.layer(c => { applyCam(c, cam, 0.7); floor(c, 1500, hex('#2e2a44')); c.save(); P.paperShadow(c, 12); c.fillStyle = '#3a3454'; c.beginPath(); c.roundRect(40, 1180, 380, 330, 30); c.fill(); c.restore(); }, 1);
  F.layer(c => { applyCam(c, cam, 1); const L = { ...LN, rimI: 0.9 };
    figure(c, { ...CAST.mama, dress: hex('#e9d3b8') }, { x: 470, y: 1520, H: 1000, face: 1, L, t, pose: { aF: [0.55, 1.75], aB: [0.35, 1.9], tilt: 0.12 }, ex: { eye: 'closed', mouth: t > W('говорила') && t < W('ответить', 0, 'e') ? 'open' : 'soft', talk: 0.6 + 0.4 * Math.sin(t * 12) } });
    part(c, ell(548, 1060, 74, 98, 0.1), hex('#d8bfa2'), L, { ps: 8 });
    glow(c, 548, 1060, 60 + 40 * hb, hex('#ffc27a'), 0.22 + 0.3 * hb); glow(c, 548, 1060, 10 + 8 * hb, hex('#fff1d0'), 0.6);
    // whispered words: tiny glowing particles drift from lips to belly
    if (talkK > 0) for (let i = 0; i < 9; i++) { const ph = ((t - W('говорила')) * 0.5 + i / 9) % 1; const x = lerp(590, 550, ph), y = lerp(560, 1050, ph); glow(c, x + Math.sin(ph * 9 + i) * 30, y, 22, hex('#ffd79a'), 0.7 * Math.sin(ph * Math.PI)); }
  }, 0);
  dustL(F, t, cam, hex('#cfd8ff'));
}, GN, 0.6);
// 3 maternity: "Первая..." x3 with continuous camera
shot(W('первая') - 0.2, W('хотя') - 0.1, (F, t) => { const t0 = W('первая') - 0.2, a = W('первая', 18), b = W('первая', 20);
  const cam = kf([[t0, { x: 20, y: -280, z: 2.1 }], [a - 0.2, { x: 10, y: -270, z: 2.15 }], [a + 0.5, { x: 0, y: -60, z: 1.25 }], [b - 0.2, { x: 0, y: -40, z: 1.28 }], [b + 0.5, { x: 30, y: -290, z: 2.3 }], [W('хотя'), { x: 30, y: -300, z: 2.4 }]], t);
  F.layer(c => { applyCam(c, cam, 0.5); bgPaper(c, hex('#f6e2c6'), hex('#ead0ae')); c.save(); P.paperShadow(c, 14); c.fillStyle = '#fff4e0'; c.fillRect(620, 240, 380, 560); c.restore(); glow(c, 810, 520, 520, hex('#fff6dc'), 0.8); cone(c, 800, 500, -0.6, 0.35, 1500, hex('#fff3d6'), 0.18, 160); }, 4);
  F.layer(c => { applyCam(c, cam, 0.8); c.save(); P.paperShadow(c, 16); c.fillStyle = '#d9cbbf'; c.beginPath(); c.roundRect(80, 1100, 960, 160, 40); c.fill(); c.fillStyle = '#f3ece2'; c.beginPath(); c.roundRect(60, 1040, 1000, 110, 50); c.fill(); c.restore(); }, 1);
  F.layer(c => { applyCam(c, cam, 1); const hug = easeIO(seg(t, a - 0.1, a + 0.5)) * (1 - easeIO(seg(t, b - 0.2, b + 0.3)) * 0.4);
    figure(c, { ...CAST.mama, dress: hex('#f2e8dc'), top: hex('#e8a58a') }, { x: 470, y: 1280, H: 900, face: 1, L: LD, t, pose: { sit: true, lean: lerp(0.08, 0.2, hug), aF: [0.55, 1.95], aB: [0.45, 2.1], tilt: lerp(0.3, 0.42, hug) }, ex: { eye: t < a ? 'open' : 'smile', mouth: t > b && t < W('хорошо', 0, 'e') + 0.2 ? 'open' : 'smile', talk: 0.5 } });
    baby(c, 540 - hug * 20, 690 + hug * 15, 115, LD, { eye: t < a + 0.6 ? 'open' : 'closed' }, t);
  }, 0);
  dustL(F, t, cam);
  F.layer(c => { const ks = [a - 1.85 + 1.95, a, b]; [W('первая'), a, b].forEach((tm, i) => { const k = seg(t, tm, tm + 0.5) * (1 - seg(t, tm + 1.6, tm + 1.9)); if (k > 0) textReveal(c, 'Первая', 540, 235, FONTS.hand, 130, hex('#a94e32'), k, { alpha: 0.95 }); }); }, 0);
}, GD, 0.6);
// 4 "Хотя сама очень боялась" — CU, glistening eye, trembling hand
shot(W('хотя') - 0.1, W('что') - 0.15, (F, t) => { const t0 = W('хотя') - 0.1; const cam = tl(t0, W('что'), { x: 20, y: -330, z: 2.9 }, { x: 25, y: -340, z: 3.1 })(t);
  F.layer(c => { applyCam(c, cam, 0.5); bgPaper(c, hex('#ead0ae'), hex('#d9b48c')); }, 8);
  F.layer(c => { applyCam(c, cam, 1); figure(c, { ...CAST.mama, dress: hex('#f2e8dc'), top: hex('#e8a58a') }, { x: 470, y: 1280, H: 900, face: 1, L: LD, t, pose: { sit: true, lean: 0.2, aF: [0.55, 1.95 + Math.sin(t * 30) * 0.03], aB: [0.45, 2.1], tilt: 0.42 }, ex: { eye: 'open', brow: -1, mouth: 'soft', tear: 1 + seg(t, t0 + 0.4, t0 + 1.4) } }); baby(c, 520, 705, 115, LD, { eye: 'closed' }, t); }, 0);
}, { ...GD, tintA: 0.14 }, 0.4);
// 5 "Что она умеет? Всё." typographic beat with orbiting paper icons
shot(W('что') - 0.15, W('ночью') - 0.15, (F, t) => { const t0 = W('что') - 0.15, tv = W('всё', 26);
  F.layer(c => { bgPaper(c, hex('#f4e6cf'), hex('#ead2b0')); glow(c, 540, 900, 700, hex('#fff6e0'), 0.7);
    const z = lerp(1, 1.08, seg(t, t0, W('ночью'))); c.translate(540, 900); c.scale(z, z); c.translate(-540, -900);
    textReveal(c, 'Что она умеет?', 540, 700, FONTS.serifI, 96, hex('#5a3a2a'), seg(t, t0 + 0.1, t0 + 1.2));
    const kv = seg(t, tv, tv + 0.35); if (kv > 0) { c.save(); c.translate(540, 960); const s = 0.6 + 0.4 * easeOut(kv) + 0.06 * Math.sin(kv * Math.PI); c.scale(s, s); textReveal(c, 'Всё.', 0, 0, FONTS.title, 260, hex('#a94e32'), 1, { weight: '700' }); c.restore(); }
    const items = ['therm', 'ladle', 'plaster', 'needle', 'book', 'umbrella', 'heart']; const ik = easeOut(seg(t, t0 + 0.6, tv));
    items.forEach((it, i) => { const a = i / items.length * 6.283 + t * 0.35, rr = 360 * ik; icon(c, it, 540 + Math.cos(a) * rr, 900 + Math.sin(a) * rr * 1.25, 1 * ik); });
  }, 0);
}, GD, 0.35);
function icon(c, kind, x, y, s) {
  if (s <= 0.02) return; c.save(); c.translate(x, y); c.scale(s, s); const L = LW;
  if (kind === 'therm') { part(c, (cc, ox, oy) => cc.roundRect(-14 + ox, -70 + oy, 28, 120, 14), hex('#f4f0ea'), L, { ps: 6 }); part(c, circ(0, 56, 24), hex('#d9534a'), L, { ps: 6 }); }
  else if (kind === 'ladle') { part(c, (cc, ox, oy) => cc.roundRect(-8 + ox, -80 + oy, 16, 110, 8), hex('#b98a5a'), L, { ps: 6 }); part(c, ell(0, 40, 40, 28), hex('#c9c3bb'), L, { ps: 6 }); }
  else if (kind === 'plaster') { c.rotate(0.6); part(c, (cc, ox, oy) => cc.roundRect(-70 + ox, -22 + oy, 140, 44, 22), hex('#f0c9a0'), L, { ps: 6 }); part(c, (cc, ox, oy) => cc.roundRect(-22 + ox, -18 + oy, 44, 36, 8), hex('#f7e2c8'), L, { ps: 2, noShadow: true }); }
  else if (kind === 'needle') { part(c, circ(0, 0, 44), hex('#d98b86'), L, { ps: 6 }); c.strokeStyle = rgba(hex('#b56a64')); c.lineWidth = 4; for (let k = -2; k <= 2; k++) { c.beginPath(); c.moveTo(-40, k * 14); c.lineTo(40, k * 14 + 8); c.stroke(); } }
  else if (kind === 'book') { part(c, (cc, ox, oy) => cc.roundRect(-55 + ox, -40 + oy, 110, 80, 8), hex('#4f8f8c'), L, { ps: 6 }); }
  else if (kind === 'umbrella') { part(c, (cc, ox, oy) => { cc.moveTo(-70 + ox, 0 + oy); cc.quadraticCurveTo(ox, -90 + oy, 70 + ox, oy); cc.closePath(); }, hex('#e9b04f'), L, { ps: 6 }); c.strokeStyle = rgba(PAL.ink); c.lineWidth = 6; c.beginPath(); c.moveTo(0, 0); c.lineTo(0, 60); c.arc(-12, 60, 12, 0, Math.PI); c.stroke(); }
  else { part(c, (cc, ox, oy) => { cc.moveTo(ox, 30 + oy); cc.bezierCurveTo(-70 + ox, -20 + oy, -30 + ox, -70 + oy, ox, -35 + oy); cc.bezierCurveTo(30 + ox, -70 + oy, 70 + ox, -20 + oy, ox, 30 + oy); cc.closePath(); }, hex('#c8643f'), L, { ps: 6 }); }
  c.restore();
}
// 6 "Ночью она врач" — fever night, thermometer, nightlight
shot(W('ночью') - 0.15, W('днём') - 0.15, (F, t) => { const t0 = W('ночью') - 0.15; const cam = tl(t0, W('днём'), { x: 40, y: 0, z: 1.12 }, { x: -20, y: -20, z: 1.2 })(t);
  F.layer(c => { applyCam(c, cam, 0.5); bgPaper(c, hex('#2a2a48'), hex('#1e1e36')); windowNight(c, 120, 300, 320, 420, t); }, 3);
  F.layer(c => { applyCam(c, cam, 0.85); lamp(c, 900, 900, 0.9, hex('#ffc27a')); c.save(); P.paperShadow(c, 14); c.fillStyle = '#5a4a6a'; c.beginPath(); c.roundRect(-40, 1120, 760, 260, 40); c.fill(); c.fillStyle = '#efe4d6'; c.beginPath(); c.roundRect(60, 1020, 200, 110, 40); c.fill(); c.restore(); }, 0.8);
  F.layer(c => { applyCam(c, cam, 1); // kid in bed (head on pillow) + blanket
    part(c, circ(200, 1010, 78), hex('#f4c3a6'), LW, { ps: 8 }); part(c, poly([[130, 980], [150, 920], [230, 905], [275, 950], [230, 960], [170, 990]], 0.5), CAST.kid.hair, LW, { ps: 6 });
    glow(c, 225, 1040, 40, hex('#ff8a7a'), 0.5); c.strokeStyle = rgba(PAL.ink); c.lineWidth = 4; c.beginPath(); c.arc(235, 1005, 10, 0.2, Math.PI - 0.2); c.stroke();
    part(c, (cc, ox, oy) => cc.roundRect(150 + ox, 940 + oy, 110, 34, 10), hex('#e8f0f6'), LW, { ps: 4 });
    part(c, poly([[60, 1080], [720, 1070], [740, 1250], [40, 1260]], 0.3), hex('#9cb3c9'), LW, { ps: 12 });
    figure(c, CAST.mama, { x: 560, y: 1450, H: 820, face: -1, L: { ...LW, dir: 1 }, t, pose: { lean: -0.25, aF: [1.6, 0.6], aB: [0.5, 1.2], tilt: -0.15 }, ex: { eye: 'down', brow: -0.6, mouth: 'soft' }, hold: (cc, w) => { part(cc, (q, ox, oy) => q.roundRect(-8 + ox, -60 + oy, 16, 70, 8), hex('#f4f0ea'), LW, { ps: 4 }); } });
  }, 0);
  F.layer(c => tag(c, 'Врач', 760, 560, -0.08, seg(t, W('врач') - 0.1, W('врач') + 0.4)), 0);
}, GN, 0.35);
// 7 "Днём повар" — sunny kitchen, steam
shot(W('днём') - 0.15, W('когда', 31) - 0.15, (F, t) => { const t0 = W('днём') - 0.15; const cam = tl(t0, W('когда', 31), { x: -40, y: 20, z: 1.12 }, { x: 30, y: 0, z: 1.2 })(t);
  F.layer(c => { applyCam(c, cam, 0.5); bgPaper(c, hex('#f7e3bf'), hex('#ecc99a')); c.save(); P.paperShadow(c, 14); c.fillStyle = '#fff6e0'; c.fillRect(600, 260, 360, 420); c.restore(); glow(c, 780, 470, 600, hex('#fff2c8'), 0.8); cone(c, 780, 470, -0.5, 0.4, 1500, hex('#fff3d6'), 0.2, 120); }, 3);
  F.layer(c => { applyCam(c, cam, 0.85); c.save(); P.paperShadow(c, 14); c.fillStyle = '#e9e2d6'; c.fillRect(-100, 1080, 800, 420); c.fillStyle = '#3a3640'; c.fillRect(-100, 1060, 800, 30); c.restore(); }, 0);
  F.layer(c => { applyCam(c, cam, 1); part(c, (q, ox, oy) => q.roundRect(150 + ox, 920 + oy, 260, 150, 30), hex('#c8643f'), LD, { ps: 10 }); for (let i = 0; i < 5; i++) { const ph = (t * 0.5 + i / 5) % 1; c.fillStyle = `rgba(255,255,255,${0.45 * (1 - ph)})`; c.beginPath(); c.arc(280 + Math.sin(t * 2 + i) * 30, 900 - ph * 380, 30 + ph * 50, 0, 6.283); c.fill(); }
    figure(c, { ...CAST.mama, top: hex('#d98b86') }, { x: 560, y: 1520, H: 860, face: -1, L: { ...LD, dir: 1 }, t, pose: { lean: -0.06, aF: [1.2 + Math.sin(t * 5) * 0.2, 0.9], aB: [0.6, 1.4], tilt: -0.08 }, ex: { eye: 'smile', mouth: 'smile' }, hold: (q, w) => { q.strokeStyle = rgba(hex('#b98a5a')); q.lineWidth = w * 0.12; q.lineCap = 'round'; q.beginPath(); q.moveTo(0, 0); q.lineTo(-w * 0.9, w * 1.2); q.stroke(); } });
  }, 0);
  dustL(F, t, cam);
  F.layer(c => tag(c, 'Повар', 760, 900, 0.07, seg(t, W('повар') - 0.1, W('повар') + 0.4)), 0);
}, GD, 0.35);
// 8 fallen knee, plaster, "До свадьбы заживёт", he runs off
shot(W('когда', 31) - 0.15, W('она', 37) - 0.2, (F, t) => { const t0 = W('когда', 31) - 0.15, tz = W('свадьбы'), th = W('правда'); const cam = tl(t0, W('она', 37), { x: 0, y: 40, z: 1.15 }, { x: 60, y: 0, z: 1.25 })(t);
  F.layer(c => { applyCam(c, cam, 0.35); bgPaper(c, hex('#cfe3e0'), hex('#a8c8c0')); for (let i = 0; i < 6; i++) { c.save(); P.paperShadow(c, 12); c.fillStyle = ['#8fa98a', '#7a9a78', '#9cb894'][i % 3]; c.beginPath(); c.arc(-100 + i * 260, 900 + (i % 2) * 60, 220, 0, 6.283); c.fill(); c.restore(); } }, 4);
  F.layer(c => { applyCam(c, cam, 0.8); floor(c, 1300, hex('#d9c3a0')); }, 1);
  F.layer(c => { applyCam(c, cam, 1);
    const run = seg(t, th + 0.4, th + 2.0); const kx = 330 + run * 900;
    if (t < th + 0.3) figure(c, CAST.kid, { x: 330, y: 1440, H: 560, face: 1, L: LD, t, pose: { sit: true, lean: -0.1, aF: [0.9, -0.5], aB: [0.8, -0.4], tilt: 0.1 }, ex: { eye: t < tz + 0.6 ? 'closed' : 'open', brow: t < tz ? -1 : 0, mouth: t < tz ? 'sad' : 'soft', tear: t < tz + 0.8 ? 1.2 : 0 } });
    else figure(c, CAST.kid, { x: kx, y: 1440, H: 560, face: 1, L: LD, t, pose: { walk: t * 9, lean: 0.1 }, ex: { eye: 'smile', mouth: 'smile' } });
    if (t < th + 0.3) { part(c, (q, ox, oy) => { q.save(); q.translate(500 + ox, 1235 + oy); q.rotate(0.5); q.roundRect(-34, -12, 68, 24, 12); q.restore(); }, hex('#f0c9a0'), LD, { ps: 4 }); }
    figure(c, CAST.mama, { x: 760, y: 1450, H: 820, face: -1, L: { ...LD, dir: 1 }, t, pose: { kneel: true, lean: 0.15 - run * 0.1, aF: [0.85, 0.25], aB: [0.95, 0.35], tilt: 0.12 }, ex: { eye: t > th ? 'smile' : 'open', mouth: t > tz && t < tz + 1.2 ? 'open' : 'smile', talk: 0.6 } });
  }, 0);
  F.layer(c => tag(c, 'Защитник', 560, 560, -0.06, seg(t, W('свадьбы') - 0.4, W('свадьбы'))), 0);
}, GD, 0.35);
// 9-11 "Она знает..." footsteps / voice / eyes
shot(W('она', 37) - 0.2, W('знает', 40) - 0.15, (F, t) => { const t0 = W('она', 37) - 0.2; const cam = tl(t0, W('знает', 40), { x: 0, y: 120, z: 1.22 }, { x: 30, y: 110, z: 1.28 })(t);
  F.layer(c => { applyCam(c, cam, 0.5); bgPaper(c, hex('#e9cba0'), hex('#d6b080')); }, 5);
  F.layer(c => { applyCam(c, cam, 0.9); floor(c, 1400, hex('#b98a5a')); }, 0);
  F.layer(c => { applyCam(c, cam, 1); figure(c, CAST.teen, { x: lerp(-100, 380, easeOut(seg(t, t0, t0 + 1.6))), y: 1480, H: 920, face: 1, L: LW, t, pose: { walk: t < t0 + 1.6 ? t * 7 : null } }); for (let i = 0; i < 3; i++) { const ph = ((t - t0) * 2 + i / 3) % 1; c.strokeStyle = `rgba(169,78,50,${0.5 * (1 - ph)})`; c.lineWidth = 5; c.beginPath(); c.arc(300, 1460, 40 + ph * 140, Math.PI * 1.1, Math.PI * 1.9); c.stroke(); } }, 0);
  F.layer(c => { applyCam(c, cam, 0.8); figure(c, CAST.mama, { x: 880, y: 1480, H: 1000, face: -1, L: { ...LW, dir: 1 }, t, pose: { aF: [1.2, 0.8], tilt: -0.05 }, ex: { eye: 'smile', mouth: 'smile' }, hold: (q, w) => { part(q, ell(-w * 0.5, -w * 0.1, w * 1.1, w * 0.35), PAL.cream, LW, { ps: 6 }); for (let i = 0; i < 3; i++) { const ph = (t * 0.6 + i / 3) % 1; q.fillStyle = `rgba(255,255,255,${0.5 * (1 - ph)})`; q.beginPath(); q.arc(-w * 0.5 + Math.sin(t * 2 + i) * 10, -w * 0.5 - ph * w * 2, w * (0.2 + ph * 0.3), 0, 6.283); q.fill(); } } }); }, 3);
}, GW, 0.35);
shot(W('знает', 40) - 0.15, W('знает', 42.5) - 0.15, (F, t) => { const t0 = W('знает', 40) - 0.15; const cam = tl(t0, W('знает', 42.5), { x: 220, y: -380, z: 2.4 }, { x: 230, y: -400, z: 2.55 })(t);
  F.layer(c => { applyCam(c, cam, 0.5); bgPaper(c, hex('#e9cba0'), hex('#d6b080')); }, 6);
  F.layer(c => { applyCam(c, cam, 1); figure(c, CAST.mama, { x: 880, y: 1480, H: 1000, face: -1, L: { ...LW, dir: 1 }, t, pose: { aF: [0.3, 0.6], tilt: -0.08 }, ex: { eye: 'open', brow: 0.9, mouth: 'soft' } }); }, 0);
  F.layer(c => { const k = seg(t, W('соврал') - 0.1, W('соврал') + 0.5); c.save(); c.globalAlpha = k; c.strokeStyle = rgba(hex('#a94e32')); c.lineWidth = 9; c.lineCap = 'round'; c.beginPath(); for (let x = 120; x < 620; x += 6) { const y = 1080 + Math.sin(x * 0.05 + t * 8) * 30 * (x > 380 && x < 470 ? 3.2 : 1); x === 120 ? c.moveTo(x, y) : c.lineTo(x, y); } c.stroke(); c.restore(); }, 0);
}, GW, 0.3);
shot(W('знает', 42.5) - 0.15, W('она', 47) - 0.2, (F, t) => { const t0 = W('знает', 42.5) - 0.15; const z = lerp(1, 1.12, seg(t, t0, W('она', 47)));
  F.layer(c => { c.translate(540, 820); c.scale(z, z); c.translate(-540, -820); bgPaper(c, hex('#f1c6a6'), hex('#e6b08e'));
    // big eye close-up
    c.save(); P.paperShadow(c, 18); c.fillStyle = '#fbf3ea'; c.beginPath(); c.ellipse(540, 820, 330, 170, 0, 0, 6.283); c.fill(); c.restore();
    c.save(); c.beginPath(); c.ellipse(540, 820, 330, 170, 0, 0, 6.283); c.clip(); c.fillStyle = '#6a4632'; c.beginPath(); c.arc(540, 820, 150, 0, 6.283); c.fill(); c.fillStyle = '#2a1a14'; c.beginPath(); c.arc(540, 820, 70, 0, 6.283); c.fill();
    c.globalAlpha = 0.55; figure(c, CAST.teen, { x: 540, y: 905, H: 150, face: -1, L: LW, t, pose: { aF: [0.1, 0.2] }, ex: { eye: 'down' } }); c.globalAlpha = 1;
    c.fillStyle = 'rgba(255,255,255,0.85)'; c.beginPath(); c.arc(600, 760, 26, 0, 6.283); c.fill();
    const blink = (t * 1) % 3.2 < 0.12 ? 1 : 0; const lid = lerp(0.15, 0.32, seg(t, W('нормально') - 0.2, W('нормально') + 0.4)) + blink * 0.8;
    c.fillStyle = '#e8b493'; c.fillRect(200, 640, 700, 340 * lid); c.restore();
    c.strokeStyle = rgba(PAL.ink); c.lineWidth = 12; c.lineCap = 'round'; c.beginPath(); c.ellipse(540, 820, 330, 170, 0, Math.PI * 1.05, Math.PI * 1.95); c.stroke();
    c.lineWidth = 16; c.beginPath(); c.moveTo(260, 560); c.quadraticCurveTo(540, 470, 820, 580); c.stroke();
    const tk = seg(t, W('нормально') + 0.3, W('нормально') + 1.2); if (tk > 0) { c.fillStyle = 'rgba(210,235,255,0.9)'; c.beginPath(); c.ellipse(820, 960 + tk * 160, 22, 32, 0, 0, 6.283); c.fill(); }
  }, 0);
}, { ...GW, tintA: 0.1 }, 0.35);
// 12 learning to walk, she lets go
shot(W('она', 47) - 0.2, W('но', 54) - 0.3, (F, t) => { const t0 = W('она', 47) - 0.2, tl0 = W('отпустила'), tf = W('страшно'); const cam = tl(t0, W('но', 54), { x: -40, y: 160, z: 1.25 }, { x: 160, y: 140, z: 1.32 })(t);
  F.layer(c => { applyCam(c, cam, 0.4); bgPaper(c, hex('#f4e0c2'), hex('#e6c49c')); glow(c, 760, 600, 700, hex('#fff1d0'), 0.6); c.save(); P.paperShadow(c, 12); c.fillStyle = '#e3b48a'; c.fillRect(-300, 560, 1700, 30); c.restore(); }, 4);
  F.layer(c => { applyCam(c, cam, 0.85); floor(c, 1440, hex('#c99a6c')); c.save(); P.paperShadow(c, 8); c.fillStyle = '#d98b86'; c.beginPath(); c.ellipse(560, 1520, 520, 80, 0, 0, 6.283); c.fill(); c.restore(); }, 0.6);
  F.layer(c => { applyCam(c, cam, 1); const let_ = seg(t, tl0, tl0 + 0.5); const walk = seg(t, tl0 + 0.4, tf + 1.2); const tx = 420 + walk * 300;
    figure(c, CAST.toddler, { x: tx, y: 1500, H: 420, face: 1, L: LW, t, pose: { walk: walk > 0 && walk < 1 ? t * 7 : null, aF: [lerp(2.5, 1.6, let_), 0.1], aB: [lerp(2.3, 1.7, let_), 0.1], lean: Math.sin(t * 6) * 0.05 * walk }, ex: { eye: walk > 0.5 ? 'smile' : 'open', mouth: 'smile' } });
    figure(c, CAST.mama, { x: 250, y: 1500, H: 860, face: 1, L: LW, t, pose: { kneel: true, lean: 0.1, aF: [lerp(0.8, 1.15, let_), lerp(0.05, 0.25, let_) + (t > tf ? Math.sin(t * 25) * 0.04 : 0)], aB: [lerp(0.9, 1.2, let_), 0.2], tilt: 0.15 }, ex: { eye: 'open', brow: t > tf - 0.3 ? -0.8 : 0, mouth: t > tf ? 'soft' : 'smile' } });
  }, 0);
  dustL(F, t, cam);
}, GW, 0.4);
// 13 "Но ты вырос." black card
shot(W('но', 54) - 0.3, W('мам', 50) - 0.25, (F, t) => { const t0 = W('но', 54) - 0.3; F.layer(c => { c.fillStyle = '#0b0807'; c.fillRect(0, 0, VW, VH); textReveal(c, 'Но ты вырос', 540, 900, FONTS.title, 120, hex('#f2e2c8'), seg(t, W('но', 54), W('вырос') + 0.4), { weight: '700', spacing: 4 }); }, 0); }, { tint: hex('#000000'), tintA: 0, bloom: 0.2, grain: 0.08, vig: 30 }, 0.15);
// 14 teen in headphones; mom at the door nods, smiles
shot(W('мам', 50) - 0.25, W('и', 64) - 0.15, (F, t) => { const t0 = W('мам', 50) - 0.25, tn = W('кивала'), ts = W('улыбалась'); const cam = kf([[t0, { x: 160, y: 120, z: 1.22 }], [tn - 0.2, { x: 140, y: 100, z: 1.25 }], [tn + 0.6, { x: -220, y: -100, z: 1.65 }], [W('и', 64), { x: -230, y: -110, z: 1.72 }]], t);
  F.layer(c => { applyCam(c, cam, 0.45); bgPaper(c, hex('#3a4566'), hex('#2a3250')); c.save(); P.paperShadow(c, 12); c.fillStyle = '#6a789a'; c.fillRect(520, 300, 300, 200); c.fillStyle = '#d98b86'; c.fillRect(860, 340, 160, 220); c.restore(); }, 3);
  F.layer(c => { applyCam(c, cam, 0.8); floor(c, 1460, hex('#2e2840')); c.save(); P.paperShadow(c, 14); c.fillStyle = '#5a4a5a'; c.fillRect(600, 1150, 230, 34); c.fillRect(610, 1184, 24, 280); c.fillRect(800, 1184, 24, 280); c.fillRect(600, 900, 30, 260); c.restore(); }, 0.5);
  F.layer(c => { applyCam(c, cam, 1); figure(c, CAST.teen, { x: 760, y: 1590, H: 900, face: 1, L: { ...LN, dir: -1, rimI: 0.9 }, t, pose: { sit: true, lean: 0.18, aF: [1.6, 0.8], aB: [1.5, 0.9], tilt: 0.12 }, ex: { eye: 'down', mouth: 'none' } });
    c.save(); P.paperShadow(c, 14); c.fillStyle = '#7a5a46'; c.fillRect(870, 1060, 300, 36); c.fillRect(1040, 1096, 28, 380); c.restore(); glow(c, 960, 1000, 240, hex('#9ad0ff'), 0.45); c.save(); P.paperShadow(c, 8); c.fillStyle = '#2a2a36'; c.beginPath(); c.moveTo(900, 1060); c.lineTo(1020, 1060); c.lineTo(1000, 960); c.lineTo(920, 960); c.closePath(); c.fill(); c.restore();
    // door frame with warm light and mom
    c.save(); P.paperShadow(c, 14); c.fillStyle = '#2a2236'; c.fillRect(30, 520, 330, 960); c.restore(); c.save(); c.beginPath(); c.rect(60, 540, 270, 940); c.clip(); c.fillStyle = lg(c, 0, 540, 0, 1480, [[0, '#ffd59a'], [1, '#e9a860']]); c.fillRect(60, 540, 270, 940);
    const nod = Math.sin(seg(t, tn, tn + 0.8) * Math.PI) * 0.12; const go = seg(t, W('и', 64) - 0.4, W('и', 64) + 0.3);
    figure(c, CAST.mama, { x: 200 - go * 200, y: 1470, H: 880, face: 1, L: { ...LW, dir: 1 }, t, pose: { tilt: nod + 0.04, aF: [0.25, 0.4] }, ex: { eye: t > ts ? 'smile' : 'open', mouth: t > ts ? 'smile' : 'soft', brow: -0.3 } }); c.restore();
  }, 0);
}, { ...GN, tintA: 0.12 }, 0.35);
// 15 she goes to the kitchen; two cups, waiting
shot(W('и', 64) - 0.15, W('ты', 68.5) - 0.2, (F, t) => { const t0 = W('и', 64) - 0.15, tw = W('ждать'); const cam = tl(t0, W('ты', 68.5), { x: -60, y: 60, z: 1.1 }, { x: 60, y: 120, z: 1.32 })(t);
  F.layer(c => { applyCam(c, cam, 0.5); bgPaper(c, hex('#e6c79a'), hex('#d0a676')); windowNight(c, 640, 300, 340, 420, t, { moon: false }); }, 3);
  F.layer(c => { applyCam(c, cam, 0.8); lamp(c, 540, 260, 1); floor(c, 1460, hex('#a8794e')); }, 0.6);
  F.layer(c => { applyCam(c, cam, 1); const walk = seg(t, t0, tw - 0.2);
    if (t < tw - 0.2) figure(c, CAST.mama, { x: lerp(-60, 330, walk), y: 1470, H: 880, face: 1, L: LW, t, pose: { walk: t * 5 }, ex: { eye: 'open', mouth: 'soft' } });
    else figure(c, CAST.mama, { x: 330, y: 1470, H: 880, face: 1, L: LW, t, pose: { sit: true, lean: 0.05, aF: [1.3, 1.2], aB: [1.1, 1.3], tilt: -0.1 }, ex: { eye: 'open', mouth: 'soft' } });
    c.save(); P.paperShadow(c, 14); c.fillStyle = '#c8935e'; c.beginPath(); c.roundRect(420, 1170, 600, 40, 16); c.fill(); c.fillRect(470, 1210, 26, 260); c.fillRect(950, 1210, 26, 260); c.restore();
    for (const [x, col, steam] of [[600, '#f4e6cf', 1], [840, '#c8643f', 0.6]]) { part(c, (q, ox, oy) => q.roundRect(x - 40 + ox, 1100 + oy, 80, 72, 14), hex(col), LW, { ps: 6 }); for (let i = 0; i < 3; i++) { const ph = (t * 0.5 + i / 3) % 1; c.fillStyle = `rgba(255,255,255,${0.35 * steam * (1 - ph)})`; c.beginPath(); c.arc(x + Math.sin(t * 2 + i) * 10, 1080 - ph * 220, 14 + ph * 24, 0, 6.283); c.fill(); } }
  }, 0);
  dustL(F, t, cam);
}, GW, 0.4);
// 16 night window: 23:00 -> 00:00 -> 01:00, phone without calls
shot(W('ты', 68.5) - 0.2, W('друзья') - 0.25, (F, t) => { const t0 = W('ты', 68.5) - 0.2, h1 = W('опаздываешь'), h2 = W('ты', 74), te = W('смотрит'); const cam = kf([[t0, { x: 0, y: 0, z: 1.1 }], [te - 0.3, { x: 60, y: 60, z: 1.25 }], [te + 0.5, { x: 120, y: 330, z: 2.3 }], [W('друзья'), { x: 125, y: 340, z: 2.45 }]], t);
  const hh = t < h1 ? '23:00' : t < h2 ? '00:00' : '01:00';
  F.layer(c => { applyCam(c, cam, 0.45); bgPaper(c, hex('#252642'), hex('#191a30')); windowNight(c, 90, 260, 520, 700, t, { city: true }); c.save(); P.paperShadow(c, 10); c.fillStyle = '#efe2cc'; c.beginPath(); c.arc(820, 470, 130, 0, 6.283); c.fill(); c.restore(); c.fillStyle = rgba(PAL.ink); c.font = `700 72px ${FONTS.title}`; c.textAlign = 'center'; c.textBaseline = 'middle'; const flip = Math.min(seg(t, h1, h1 + 0.3), 1) + Math.min(seg(t, h2, h2 + 0.3), 1); c.globalAlpha = 1 - 0.6 * Math.sin((flip % 1) * Math.PI); c.fillText(hh, 820, 478); c.globalAlpha = 1; }, 2);
  F.layer(c => { applyCam(c, cam, 0.85); floor(c, 1470, hex('#24203a')); }, 0.5);
  F.layer(c => { applyCam(c, cam, 1); figure(c, CAST.mama, { x: 560, y: 1480, H: 880, face: -1, L: { ...LN, dir: 1, rimI: 0.9 }, t, pose: { sit: true, lean: 0.12, aF: [1.75, 1.0], aB: [1.3, 1.2], tilt: 0.14 }, ex: { eye: 'down', brow: -0.5, mouth: 'none' }, hold: (q, w) => { q.save(); P.paperShadow(q, 6); q.fillStyle = '#1e1e28'; q.beginPath(); q.roundRect(-w * 0.35, -w * 0.6, w * 0.7, w * 1.2, w * 0.1); q.fill(); q.restore(); q.fillStyle = '#bcd6ff'; q.beginPath(); q.roundRect(-w * 0.3, -w * 0.54, w * 0.6, w * 1.08, w * 0.08); q.fill(); glow(q, 0, 0, w * 3, hex('#bcd6ff'), 0.55); } });
    c.save(); P.paperShadow(c, 14); c.fillStyle = '#4a4466'; c.beginPath(); c.roundRect(260, 1120, 560, 120, 40); c.fill(); c.restore();
  }, 0);
  if (t > te - 0.1) F.layer(c => { const k = seg(t, te - 0.1, te + 0.5); c.save(); c.globalAlpha = k; c.translate(540, 820); c.fillStyle = '#1a1a24'; c.beginPath(); c.roundRect(-230, -420, 460, 840, 50); c.fill(); c.fillStyle = '#e8eef8'; c.beginPath(); c.roundRect(-200, -390, 400, 780, 36); c.fill(); c.fillStyle = '#3a3a48'; c.font = `600 40px ${FONTS.serif}`; c.textAlign = 'center'; c.fillText('Вызовы', 0, -320); c.fillStyle = '#9aa0b0'; c.font = `400 36px ${FONTS.serifI}`; c.fillText('Нет пропущенных', 0, -20); c.fillText('и входящих', 0, 30); c.restore(); }, 0);
}, GN, 0.4);
// 17 friends come and go; love begins and ends (paper silhouettes)
shot(W('друзья') - 0.25, W('а', 82.5) - 0.2, (F, t) => { const t0 = W('друзья') - 0.25, tl1 = W('любовь'); const cam = tl(t0, W('а', 82.5), { x: -40, y: 60, z: 1.08 }, { x: 40, y: 20, z: 1.16 })(t);
  F.layer(c => { applyCam(c, cam, 0.4); bgPaper(c, hex('#e7c7a0'), hex('#c9926a')); glow(c, 540, 700, 800, hex('#ffe2b0'), 0.6); }, 5);
  F.layer(c => { applyCam(c, cam, 0.8); floor(c, 1480, hex('#a8714e')); }, 1);
  F.layer(c => { applyCam(c, cam, 1); const L = { ...LW, rimI: 0.9 };
    figure(c, CAST.son, { x: 540, y: 1490, H: 980, face: 1, L, t, pose: { aF: [0.1, 0.2] }, ex: { eye: 'open', mouth: 'none' } });
    if (t < tl1) for (let i = 0; i < 4; i++) { const ph = clamp((t - t0 - i * 0.35) / 1.6); if (ph <= 0 || ph >= 1) continue; const x = lerp(-200, 1300, ph), y = 1500; c.save(); c.globalAlpha = Math.sin(ph * Math.PI) * 0.85; figure(c, { ...CAST.son, top: [hex('#4f8f8c'), hex('#d98b86'), hex('#e9b04f'), hex('#8fa98a')][i], hair: hex('#3a2a20') }, { x, y: y + (i % 2) * 30, H: 820 + (i % 2) * 60, face: 1, L, t, pose: { walk: t * 6 + i } }); c.restore(); }
    else { const k = seg(t, tl1, tl1 + 0.6), sep = seg(t, W('заканчивается') - 0.2, W('заканчивается') + 1.0);
      c.save(); c.globalAlpha = k * (1 - sep * 0.8); figure(c, { ...CAST.mama, top: hex('#d98b86'), dress: hex('#f4e6cf'), hair: hex('#2a1a14'), hairStyle: 'short' }, { x: 820 + sep * 340, y: 1490, H: 900, face: -1, L, t, pose: { aF: [lerp(0.9, 0.2, sep), 0.3] }, ex: { eye: 'open' } }); c.restore();
      const hx = lerp(680, 760 + sep * 200, 1), hy = lerp(900, 500, sep); c.save(); c.translate(hx, hy); c.rotate(sep * 0.6); c.globalAlpha = k * (1 - sep * 0.5); part(c, (q, ox, oy) => { q.moveTo(ox, 50 + oy); q.bezierCurveTo(-90 + ox, -20 + oy, -40 + ox, -90 + oy, ox, -45 + oy); q.bezierCurveTo(40 + ox, -90 + oy, 90 + ox, -20 + oy, ox, 50 + oy); q.closePath(); }, hex('#c8643f'), LW, { ps: 8 }); if (sep > 0.2) { c.strokeStyle = rgba(PAL.cream); c.lineWidth = 6; c.beginPath(); c.moveTo(0, -45); c.lineTo(-12, -5); c.lineTo(10, 15); c.lineTo(0, 50); c.stroke(); } c.restore(); }
  }, 0);
  dustL(F, t, cam);
}, GW, 0.4);
// 18 the doorway: she sees you off — school, teen, suitcase — and stays; her hair greys
shot(W('а', 82.5) - 0.2, W('всю') - 0.3, (F, t) => { const t0 = W('а', 82.5) - 0.2, a = W('который'), b = W('каждый'), d = W('когда', 86.8); const cam = tl(t0, W('всю'), { x: 0, y: 40, z: 1.08 }, { x: 0, y: 0, z: 1.22 })(t);
  const age = seg(t, t0 + 0.5, d + 1.2);
  F.layer(c => { applyCam(c, cam, 0.45); bgPaper(c, hex('#3a3350'), hex('#2a2440')); }, 3);
  F.layer(c => { applyCam(c, cam, 0.75); c.save(); P.paperShadow(c, 16); c.fillStyle = '#e8d8c0'; c.fillRect(140, 300, 520, 1180); c.restore(); c.save(); c.beginPath(); c.rect(190, 350, 420, 1130); c.clip(); c.fillStyle = lg(c, 0, 350, 0, 1480, [[0, '#ffd89c'], [1, '#e9a860']]); c.fillRect(190, 350, 420, 1130); lamp(c, 400, 360, 1); c.restore(); floor(c, 1480, hex('#2e2840')); }, 0.8);
  F.layer(c => { applyCam(c, cam, 1);
    const ch = { ...CAST.mama, hair: C.mix(CAST.mama.hair, hex('#cfc8c4'), age), stoop: 0.05 * age };
    figure(c, ch, { x: 400, y: 1480, H: 880, face: 1, L: { ...LW, rimI: 1 }, t, pose: { aF: [lerp(0.2, 2.6, Math.sin(t * 4) > 0 ? 1 : 0.85), 0.3] }, ex: { eye: 'smile', mouth: 'smile', brow: -0.4 } });
    const kids = [[t0 + 0.2, CAST.kid, 600], [a - 0.1, CAST.teen, 880], [b - 0.1, CAST.son, 980]];
    kids.forEach(([tm, chr, H], i) => { const ph = clamp((t - tm) / 1.6); if (ph <= 0 || ph >= 1) return; c.save(); c.globalAlpha = Math.min(1, (1 - ph) * 3); figure(c, chr, { x: lerp(620, 1250, ph), y: 1480, H, face: 1, L: LW, t, pose: { walk: t * 6 }, hold: i === 2 ? (q, w) => { part(q, (z, ox, oy) => z.roundRect(-w * 0.6 + ox, w * 0.2 + oy, w * 1.2, w * 1.4, w * 0.2), hex('#a94e32'), LW, { ps: 6 }); } : null }); c.restore(); });
  }, 0);
  dustL(F, t, cam);
}, { ...GW, tintA: 0.12 }, 0.4);
// 19 "Всю жизнь." — old mama in the doorway, light behind
shot(W('всю') - 0.3, W('ничего') - 0.6, (F, t) => { const t0 = W('всю') - 0.3; const cam = tl(t0, W('ничего'), { x: -140, y: -280, z: 1.7 }, { x: -150, y: -300, z: 1.8 })(t);
  F.layer(c => { applyCam(c, cam, 0.45); bgPaper(c, hex('#3a3350'), hex('#2a2440')); }, 6);
  F.layer(c => { applyCam(c, cam, 0.75); c.save(); P.paperShadow(c, 16); c.fillStyle = '#e8d8c0'; c.fillRect(140, 300, 520, 1180); c.restore(); c.save(); c.beginPath(); c.rect(190, 350, 420, 1130); c.clip(); c.fillStyle = lg(c, 0, 350, 0, 1480, [[0, '#ffd89c'], [1, '#e9a860']]); c.fillRect(190, 350, 420, 1130); lamp(c, 400, 360, 1); c.restore(); }, 3);
  F.layer(c => { applyCam(c, cam, 1); figure(c, CAST.mamaOld, { x: 400, y: 1480, H: 860, face: 1, L: { ...LW, rimI: 1 }, t, pose: { aF: [0.3, 1.4], aB: [0.2, 1.2] }, ex: { eye: 'open', mouth: 'soft', brow: -0.5 } }); }, 0);
}, { ...GW, tintA: 0.14 }, 0.5);
// 20 empty hallway, light on, door ajar — light fades to a point
shot(W('ничего') - 0.6, W('вернулся', 0, 'e') + 0.35, (F, t) => { const t0 = W('ничего') - 0.6, t1 = W('вернулся', 0, 'e') + 0.35; const fade = easeIn(seg(t, W('только'), t1)); const cam = tl(t0, t1, { x: 0, y: 0, z: 1.05 }, { x: 0, y: -40, z: 1.35 })(t);
  F.layer(c => { applyCam(c, cam, 0.5); bgPaper(c, hex('#2c2638'), hex('#1c1828')); c.save(); P.paperShadow(c, 16); c.fillStyle = '#d9c4a4'; c.fillRect(300, 420, 480, 1060); c.restore(); c.save(); c.beginPath(); c.rect(330, 450, 420, 1030); c.clip(); c.fillStyle = '#120f18'; c.fillRect(330, 450, 420, 1030); c.fillStyle = lg(c, 330, 0, 750, 0, [[0, 'rgba(255,200,130,0.0)'], [0.85, 'rgba(255,200,130,0.0)'], [1, 'rgba(255,210,140,0.9)']]); c.fillRect(330, 450, 420, 1030); c.restore(); c.save(); P.paperShadow(c, 10); c.fillStyle = '#b98a5a'; c.beginPath(); c.moveTo(330, 450); c.lineTo(700, 470); c.lineTo(700, 1460); c.lineTo(330, 1480); c.closePath(); c.fill(); c.restore(); c.fillStyle = '#e9c36a'; c.beginPath(); c.arc(660, 980, 16, 0, 6.283); c.fill(); }, 1);
  F.layer(c => { applyCam(c, cam, 0.8); floor(c, 1480, hex('#3a2e2a')); lamp(c, 540, 200, 1 - fade * 0.9); }, 0);
  F.layer(c => { c.fillStyle = `rgba(8,6,6,${fade * 0.96})`; c.fillRect(0, 0, VW, VH); glow(c, 540, 860, 30 + (1 - fade) * 400, hex('#ffc27a'), 0.4 + 0.5 * fade); }, 0);
}, { ...GN, tint: hex('#d08a3a'), tintA: 0.12 }, 0.4);
// 21 back to the first word: МАМА
shot(W('вернулся', 0, 'e') + 0.35, 97.6, (F, t) => { const t0 = W('вернулся', 0, 'e') + 0.35; F.layer(c => { c.fillStyle = '#0b0807'; c.fillRect(0, 0, VW, VH); const hb = heartbeatPulse(t, HBE); glow(c, 540, 860, 80 + 100 * hb, hex('#ffc27a'), 0.4 + 0.5 * hb); textReveal(c, 'МАМА', 540, 860, FONTS.title, 190, hex('#f7e6c8'), seg(t, t0 + 0.2, t0 + 1.4), { spacing: 34, glow: hex('#ffb460'), weight: '700' }); }, 0); }, GW, 0.3);
module.exports = { S: SH, W, FONTS };
