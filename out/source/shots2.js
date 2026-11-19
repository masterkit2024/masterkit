// 2D cartoon shot list, every cut/action keyed to the real voice word timings (timeline.json)
const C = require('./core'); const T = require('./toon'); const S = require('./sets');
const { hex, rgba, mix, shade, lg, rg, clamp, lerp, ease, easeIO, easeOut, easeIn, seg, kf, glow, cone, dust, rain, applyCam, VW, VH } = C;
const { CH, EX, exMix, toon, INK } = T;
const TL = require('../timeline.json');
const AMBER = S.AMBER, ICE = S.ICE;
// ---- voice helpers ----
function W(id, pre, k = 's') { const c = TL.find(c => c.id === id); if (!pre) return c[k === 's' ? 'start' : 'end']; const w = c.words.find(w => w.w.toLowerCase().replace(/[^а-яё0-9:]/g, '').startsWith(pre.toLowerCase())); return w[k]; }
function talk(spk, t) { for (const c of TL) if (c.spk === spk && t >= c.start && t <= c.end) for (const w of c.words) if (t >= w.s && t <= w.e) return 0.18 + 0.4 * Math.abs(Math.sin((t - w.s) * 15)); return 0; }
function blink(t, seed = 0) { const p = (t + seed * 1.37) % 3.4; return p < 0.13 ? 0.1 + Math.abs(p - 0.065) / 0.065 * 0.9 : 1; }
const exB = (name, t, seed, extra = {}) => { const e = { ...(typeof name === 'string' ? EX[name] : name), ...extra }; e.eye = Math.min(e.eye, e.eye * blink(t, seed)); return e; };
// ---- lights ----
const LC = { kx: -1, amb: hex('#2a3f78'), rim: hex('#a8ecff'), rimX: 1, rimI: 0.75 };
const LW = { kx: -1, amb: hex('#8a3e2e'), rim: hex('#ffe0a8'), rimX: 1, rimI: 0.8 };
const LG = { kx: -1, amb: hex('#3a5a8a'), rim: hex('#cfefff'), rimX: 1, rimI: 0.6 };
const Lmix = (a, b, k) => ({ kx: a.kx, amb: mix(a.amb, b.amb, k), rim: mix(a.rim, b.rim, k), rimX: a.rimX, rimI: lerp(a.rimI, b.rimI, k) });
// ghost observer (adult Dima in memories): translucent, cool
function ghost(F, fn, a = 0.6, blur = 0) {
  F.layer(o => { fn(o); o.save(); o.setTransform(1, 0, 0, 1, 0, 0); o.globalCompositeOperation = 'source-atop'; o.fillStyle = 'rgba(150,200,255,0.35)'; o.fillRect(0, 0, F.W, F.H); o.restore(); }, blur, a);
  F.layer(o => { fn(o); o.save(); o.setTransform(1, 0, 0, 1, 0, 0); o.globalCompositeOperation = 'source-in'; o.fillStyle = 'rgba(170,220,255,1)'; o.fillRect(0, 0, F.W, F.H); o.restore(); }, 16, 0.18, 'lighter');
}
function notes(c, x, y, t, a = 1) { for (let i = 0; i < 3; i++) { const ph = (t * 0.8 + i / 3) % 1; c.save(); c.globalAlpha = a * Math.sin(ph * Math.PI); c.translate(x + ph * 90 + i * 10, y - ph * 160); c.rotate(Math.sin(t * 3 + i) * 0.3); c.fillStyle = '#fff6d8'; c.strokeStyle = INK; c.lineWidth = 3; c.beginPath(); c.ellipse(0, 0, 14, 10, -0.4, 0, 6.283); c.fill(); c.stroke(); c.fillRect(10, -46, 5, 46); c.strokeRect(10, -46, 5, 46); c.restore(); } }
function icon(c, kind, x, y, k, label) {
  if (k <= 0) return; c.save(); c.translate(x, y); const s = 0.7 + 0.3 * easeOut(k) + Math.sin(k * Math.PI) * 0.12; c.scale(s, s); c.globalAlpha = clamp(k * 3);
  S.rr(c, -80, -56, 220, 112, 56); c.fillStyle = '#fff3dc'; c.fill(); S.ol(c, 5);
  c.strokeStyle = INK; c.lineWidth = 6; c.lineCap = 'round'; c.lineJoin = 'round';
  if (kind === 'pot') { S.rr(c, -56, -16, 76, 46, 10); c.fillStyle = '#e0574a'; c.fill(); c.stroke(); c.beginPath(); c.moveTo(-64, -16); c.lineTo(28, -16); c.stroke(); for (let i = 0; i < 3; i++) { c.beginPath(); c.moveTo(-36 + i * 20, -26); c.quadraticCurveTo(-28 + i * 20, -36, -36 + i * 20, -46); c.stroke(); } }
  else { c.beginPath(); c.moveTo(-46, -34); c.lineTo(-38, 34); c.lineTo(0, 34); c.lineTo(8, -34); c.closePath(); c.fillStyle = '#cfeeff'; c.fill(); c.stroke(); c.fillStyle = '#7fc8f0'; c.fillRect(-40, 4, 42, 26); }
  c.fillStyle = INK; c.font = '900 64px Inter'; c.textBaseline = 'middle'; c.fillText(label, 36, 4); c.restore();
}
function heartPath(c, s) { c.beginPath(); c.moveTo(0, s * 0.35); c.bezierCurveTo(-s * 0.9, -s * 0.25, -s * 0.45, -s * 0.95, 0, -s * 0.45); c.bezierCurveTo(s * 0.45, -s * 0.95, s * 0.9, -s * 0.25, 0, s * 0.35); c.closePath(); }
function phone(c, x, y, w, rot, screen, skin = CH.dima.skin) {
  const h = w * 2.0; c.save(); c.translate(x, y); c.rotate(rot);
  c.beginPath(); c.ellipse(-w * 0.05, h * 0.42, w * 0.62, h * 0.3, 0.1, 0, 6.283); c.fillStyle = rgba(skin); c.fill(); S.ol(c, 5);
  S.rr(c, -w / 2, -h / 2, w, h, w * 0.14); c.fillStyle = '#1a1c22'; c.fill(); S.ol(c, 6);
  c.save(); S.rr(c, -w / 2 + w * 0.05, -h / 2 + w * 0.05, w * 0.9, h - w * 0.1, w * 0.1); c.clip(); c.translate(-w / 2 + w * 0.05, -h / 2 + w * 0.05); screen(c, w * 0.9, h - w * 0.1); c.restore();
  c.beginPath(); c.ellipse(w * 0.5, h * 0.12, w * 0.13, h * 0.1, -0.3, 0, 6.283); c.fillStyle = rgba(skin); c.fill(); S.ol(c, 4);
  for (let i = 0; i < 3; i++) { c.beginPath(); c.ellipse(-w * 0.52, h * (0.02 + i * 0.12), w * 0.1, h * 0.05, 0.2, 0, 6.283); c.fillStyle = rgba(skin); c.fill(); S.ol(c, 4); }
  c.restore(); glow(c, x, y, w * 1.6, hex('#bfe9ff'), 0.25);
}
function ui(s, w, h, o) {
  s.fillStyle = lg(s, 0, 0, 0, h, [[0, '#14222c'], [1, '#0b141a']]); s.fillRect(0, 0, w, h); s.textBaseline = 'middle';
  if (o.notif != null) { s.fillStyle = 'rgba(255,255,255,0.07)'; for (let i = 0; i < 6; i++) { S.rr(s, w * 0.08, h * (0.26 + i * 0.1), w * 0.84, h * 0.07, 14); s.fill(); }
    const y = lerp(-h * 0.14, h * 0.06, o.notif); S.rr(s, w * 0.05, y, w * 0.9, h * 0.12, 26); s.fillStyle = '#f4f8fa'; s.fill();
    s.fillStyle = '#21b06a'; s.beginPath(); s.arc(w * 0.16, y + h * 0.06, w * 0.065, 0, 6.283); s.fill(); s.strokeStyle = '#fff'; s.lineWidth = w * 0.022; s.lineCap = 'round'; s.beginPath(); s.moveTo(w * 0.125, y + h * 0.06); s.lineTo(w * 0.152, y + h * 0.078); s.lineTo(w * 0.195, y + h * 0.04); s.stroke();
    s.fillStyle = '#10202a'; s.font = `900 ${w * 0.07}px Inter`; s.fillText('Перевод отправлен', w * 0.26, y + h * 0.06); }
  if (o.chat != null) { s.fillStyle = '#1c2d38'; s.fillRect(0, 0, w, h * 0.11); s.fillStyle = '#d0906a'; s.beginPath(); s.arc(w * 0.15, h * 0.055, w * 0.065, 0, 6.283); s.fill(); s.fillStyle = '#eef6fa'; s.font = `900 ${w * 0.08}px Inter`; s.fillText('Мама', w * 0.27, h * 0.055);
    const m = o.msg || 0; s.globalAlpha = m; const by = h * 0.48 + (1 - m) * 40; S.rr(s, w * 0.06, by, w * 0.82, h * 0.1, 34); s.fillStyle = '#2e4250'; s.fill(); s.fillStyle = '#f4fafc'; s.font = `800 ${w * 0.062}px Inter`; s.fillText('Приезжай, мы скучаем', w * 0.11, by + h * 0.05); s.globalAlpha = 1;
    if (o.heart > 0) { const k = easeOut(o.heart); s.save(); s.translate(w * 0.82, by + h * 0.11); s.scale(k * 1.15, k * 1.15); s.fillStyle = '#1c2d38'; s.beginPath(); s.arc(0, 0, w * 0.075, 0, 6.283); s.fill(); heartPath(s, w * 0.085); s.fillStyle = '#ff4a6a'; s.fill(); s.restore(); } }
  if (o.contact) { s.textAlign = 'center'; s.fillStyle = '#d0a070'; s.beginPath(); s.arc(w / 2, h * 0.3, w * 0.2, 0, 6.283); s.fill(); s.fillStyle = '#eef6fa'; s.font = `900 ${w * 0.14}px Inter`; s.fillText(o.contact, w / 2, h * 0.52); const hv = o.hover || 0; s.fillStyle = rgba(hex('#21b06a'), 0.7 + 0.3 * hv); s.beginPath(); s.arc(w / 2, h * 0.8, w * (0.13 + 0.025 * Math.sin((o.t || 0) * 9) * hv), 0, 6.283); s.fill(); s.textAlign = 'left'; }
}
// ---- station layers ----
function station(F, t, o) {
  const cam = o.cam, w = o.warm || 0, dim = o.dim || 0;
  F.layer(c => { applyCam(c, cam, 0.35); S.stWall(c, t, { warm: w, train: o.train }); }, o.bf ?? 2.5);
  F.layer(c => { applyCam(c, cam, 0.6); S.stClock(c, 540, 330, 120, o.hh ?? 23, o.mm ?? (13 + t / 60), { warm: w, spin: o.spin }); for (const x of [210, 870]) S.stLamp(c, x, 190, 1000, 1 - dim * 0.7, w); S.stBoard(c, t, 300, 560, 480, 110, { warm: w, flap: o.flap }); }, o.bm ?? 1.2);
  F.layer(c => { applyCam(c, cam, 0.85); S.stFloor(c, t, 1240, { warm: w }); }, 0);
  F.layer(c => { applyCam(c, cam, 1);
    S.stBooth(c, t, 610, 690, 440, 650, (cc, gx, gy, gw, gh) => { const k = o.keeper || {}; toon(cc, CH.keeper, { x: 860, y: gy + gh + 210, h: 112, face: -1, L: Lmix(LC, LW, w), t, seed: 1, pose: { aR: k.aR || [0.9, 1.6], tilt: k.tilt || 0 }, ex: exB(k.ex || 'soft', t, 1, { gaze: k.gaze ?? 0.4 }), talk: talk('keeper', t), hold: (h, u) => S.pocketWatch(h, 0, u * 0.05, u * 0.17, k.open ?? 1, t, k.glow ?? 1) }); }, { warm: w });
    glow(c, 720, 1000, 300, AMBER, 0.22 * ((o.keeper || {}).glow ?? 1));
  }, o.bk ?? 0);
  F.layer(c => { applyCam(c, cam, 1.15); S.bench(c, 20, 1250, 520, w); S.suitcase(c, 400, 1390, 1, w);
    const d = o.dima || {};
    if (!d.hide) toon(c, CH.dima, { x: d.x ?? 210, y: d.y ?? (1250 + 1.45 * 104), h: 104, face: 1, L: Lmix(LC, LW, w), t, seed: 2, pose: d.pose || { sit: true, lean: 0.08, aR: [0.9, -0.3], aL: [0.75, -0.2], tilt: d.tilt ?? 0.05 }, ex: exB(d.ex || 'bored', t, 2, { gaze: d.gaze ?? 0.5, ...(d.exo || {}) }), talk: talk('dima', t), hold: d.hold });
  }, o.bd ?? 0);
  F.layer(c => { applyCam(c, cam, 1.3); dust(c, t, 3, 40, [0, 200, VW, 1300], mix(hex('#dff4ff'), hex('#ffe2b0'), w), 0.55, 4); }, 1);
}
// ---- shots ----
const SH = []; const shot = (t0, t1, draw, grade, xin = 0.0) => SH.push({ t0, t1, draw, grade, xin });
const GC = { tint: hex('#2a6a9a'), tintA: 0.18, bloom: 0.38, grain: 0.06, vig: 70 }, GW = { tint: hex('#e09030'), tintA: 0.2, bloom: 0.42, grain: 0.06, vig: 70 };
const tl = (t0, t1, a, b, e = easeIO) => (t) => kf([[t0, a], [t1, b]], t, e);

// 1 station wide: "Поезд через час." watch opens
shot(0, W('L1', 'хочешь') - 0.12, (F, t) => { const cam = tl(0, 2.6, { x: -20, y: 30, z: 1.0 }, { x: 40, y: 0, z: 1.1 })(t);
  station(F, t, { cam, keeper: { open: easeOut(seg(t, 0.3, 0.8)), glow: 0.4 + easeOut(seg(t, 0.3, 0.9)) * 0.8, gaze: 0.6 }, dima: { ex: 'bored', tilt: 0.25, gaze: 0.3, hold: (h, u) => { h.save(); h.fillStyle = '#1a1c22'; h.fillRect(-u * 0.12, -u * 0.05, u * 0.24, u * 0.4); h.restore(); glow(h, 0, u * 0.1, u * 0.8, hex('#bfe9ff'), 0.35); } } }); }, GC);
// 2 keeper MCU: "Хочешь вернуть один час твоей жизни? Любой."
shot(W('L1', 'хочешь') - 0.12, W('L1', null, 'e') + 0.05, (F, t) => { const t0 = W('L1', 'хочешь') - 0.12; const cam = tl(t0, t0 + 3.2, { x: 300, y: 40, z: 2.2 }, { x: 290, y: 20, z: 2.35 })(t);
  const hl = seg(t, W('L1', 'один'), W('L1', 'один') + 0.4) * (1 - seg(t, W('L1', 'жизни'), W('L1', 'жизни') + 0.6));
  station(F, t, { cam, bf: 6, bm: 5, bd: 6, keeper: { ex: t > W('L1', 'любой') ? 'smile' : 'soft', glow: 1 + hl * 0.8, gaze: 0.7, tilt: t > W('L1', 'любой') ? 0.05 : 0 } }); }, GC, 0.15);
// 3 Dima lifts his head (reaction)
shot(W('L1', null, 'e') + 0.05, W('D1'), (F, t) => { const t0 = W('L1', null, 'e') + 0.05, k = easeOut(seg(t, t0 + 0.25, t0 + 0.9)); const cam = tl(t0, W('D1'), { x: -280, y: 40, z: 2.1 }, { x: -270, y: 20, z: 2.25 })(t);
  station(F, t, { cam, bf: 6, bm: 5, bk: 6, dima: { tilt: lerp(0.25, -0.02, k), ex: exMix('bored', 'surprised', k), gaze: 0.8 } }); }, GC, 0.12);
// 4 "Серьёзно?! Тогда день, когда я открыл свою компанию!" + portal
shot(W('D1'), W('D1', null, 'e') + 0.1, (F, t) => { const t0 = W('D1'), up = easeOut(seg(t, t0 - 0.05, t0 + 0.35)); const cam = tl(t0, t0 + 4.3, { x: -240, y: 330, z: 1.42 }, { x: -225, y: 315, z: 1.5 })(t);
  const g = Math.sin((t - t0) * 4) * 0.2;
  station(F, t, { cam, bf: 3.5, bk: 2, spin: (t > W('D1', 'компанию') && t < W('D1', 'компанию') + 0.6) ? -2 : 0, mm: 13 + t / 60 - Math.sin(seg(t, W('D1', 'компанию'), W('D1', 'компанию') + 0.6) * Math.PI) * 15,
    dima: { x: 210, y: lerp(1250 + 1.45 * 104, 1560, up), pose: up < 0.5 ? { sit: true } : { lean: -0.04, aR: [2.3 + g, 0.4], aL: [0.6 - g, 0.7], tilt: -0.06 }, ex: t < W('D1', 'тогда') ? 'excited' : 'smile', gaze: 0.6 } });
  const k = easeOut(seg(t, W('D1', 'тогда') - 0.1, W('D1', 'тогда') + 0.5));
  if (k > 0) F.layer(c => { applyCam(c, cam, 1.1); portal(c, 436, 1019, 160 * (0.55 + 0.45 * k), t, k, easeOut(seg(t, W('D1', 'компанию'), W('D1', 'компанию') + 0.3))); }, 0);
}, GC, 0.1);
// 5 keeper shakes head gently, "Его ты и так помнишь."
shot(W('D1', null, 'e') + 0.1, W('L2', null, 'e') + 0.3, (F, t) => { const t0 = W('D1', null, 'e') + 0.1; const cam = tl(t0, t0 + 3.6, { x: 300, y: 50, z: 2.25 }, { x: 290, y: 30, z: 2.4 })(t);
  const sh = Math.sin(seg(t, t0 + 0.3, t0 + 1.6) * Math.PI * 3) * 0.09 * (1 - seg(t, t0 + 1.3, t0 + 1.7));
  station(F, t, { cam, bf: 6, bm: 5, bd: 6, keeper: { tilt: sh, ex: 'tender', gaze: 0.6 } });
  const pk = 1 - seg(t, t0, t0 + 0.8); if (pk > 0) F.layer(c => { applyCam(c, cam, 1.1); portal(c, 436, 1019, 160 * pk, t, pk, 1); }, 4);
}, GC, 0.12);
// 6 two-shot beat before the drop: Dima puzzled, lamps start to dim
shot(W('L2', null, 'e') + 0.3, W('L3'), (F, t) => { const t0 = W('L2', null, 'e') + 0.3; const cam = tl(t0, W('L3'), { x: -20, y: 140, z: 1.15 }, { x: -10, y: 120, z: 1.22 })(t);
  station(F, t, { cam, dim: seg(t, W('L3') - 0.5, W('L3')) * 0.5, keeper: { ex: 'soft', open: 1 - seg(t, t0 + 0.2, t0 + 0.6) * 0.0, glow: 1.1 }, dima: { x: 210, y: 1560, pose: { lean: 0.02, aR: [0.3, 0.3], aL: [0.2, 0.3], tilt: 0.08 }, ex: 'confused', gaze: 0.6 } }); }, GC, 0.12);
// 7 rewind on the music drop: clock spins back; flap "ПТ" on "пятницу", "23:47"
shot(W('L3'), W('L3', 'тебе') - 0.1, (F, t) => { const t0 = W('L3'); const cam = tl(t0, t0 + 4.8, { x: 0, y: -520, z: 2.0 }, { x: 0, y: -380, z: 1.75 })(t);
  const sp = easeIn(seg(t, t0, t0 + 0.8)) * (1 - easeOut(seg(t, W('L3', '23'), W('L3', '23') + 0.7)));
  const mm = 13 - Math.pow(Math.max(0, Math.min(t, W('L3', '23') + 0.5) - t0), 2) * 120;
  const fp = seg(t, W('L3', 'пятницу'), W('L3', 'пятницу') + 0.35), ft = seg(t, W('L3', '23'), W('L3', '23') + 0.5);
  station(F, t, { cam, dim: 0.55, spin: sp * 5, hh: 23 + mm / 60, mm: ((mm % 60) + 60) % 60, bf: 2, bm: 0, bk: 8, bd: 8, flap: (c, x, y, w, h) => flap(c, x, y, w, h, t, fp, ft) });
  F.layer(c => { c.globalCompositeOperation = 'lighter'; for (let i = 0; i < 5; i++) { const a = -(t - t0) * 5 * sp + i * 1.3; c.strokeStyle = rgba(ICE, 0.16 * sp); c.lineWidth = 26; c.beginPath(); c.arc(540, 700, 300 + i * 46, a, a + 0.8); c.stroke(); } }, 5);
}, { ...GC, tintA: 0.24 }, 0.1);
// 8 window reflection: adult Dima's reflection turns into himself at 19 ("Тебе 19.")
shot(W('L3', 'тебе') - 0.1, W('D3') - 0.05, (F, t) => { const t0 = W('L3', 'тебе') - 0.1; const k = easeIO(seg(t, W('L3', '19') - 0.3, W('L3', '19') + 0.5));
  F.layer(c => { const z = lerp(1, 1.08, seg(t, t0, W('D3'))); c.translate(540, 960); c.scale(z, z); c.translate(-540, -960); c.fillStyle = lg(c, 0, 0, 0, VH, [[0, '#123a52'], [1, '#081c28']]); c.fillRect(-200, -200, VW + 400, VH + 400);
    c.save(); c.beginPath(); c.roundRect(130, 200, 820, 1300, 400); c.clip(); c.fillStyle = lg(c, 0, 200, 0, 1500, [[0, '#1f5a7a'], [1, '#2f7a96']]); c.fillRect(130, 200, 820, 1300);
    for (let i = 0; i < 12; i++) glow(c, 160 + (i * 97) % 780, 300 + (i * 211) % 1100, 50, hex('#bfe9ff'), 0.3);
    c.globalAlpha = 0.55 * (1 - k); toon(c, CH.dima, { x: 560, y: 1500 + 0.2 * 230, h: 230, face: -1, L: LG, t, ex: exB('sad', t, 3, { gaze: 0.2 }), pose: { aR: [0.1, 0.2] } });
    c.globalAlpha = 0.6 * k; toon(c, CH.dima19, { x: 560, y: 1500 + 0.2 * 230, h: 230, face: -1, L: LW, t, ex: exB('bored', t, 4, { gaze: 0.2 }), pose: { aR: [0.1, 0.2] } }); c.globalAlpha = 1;
    C.rain(c, t, 5, 40, [130, 200, 820, 1300], hex('#d6f0ff'), 0.3, 60, 2, 0.08, 800); C.glassDrops(c, t, 9, 30, [130, 200, 820, 1300], hex('#d6f0ff'), 0.7); c.restore();
    c.lineWidth = 22; c.strokeStyle = '#0a1f2c'; c.beginPath(); c.roundRect(130, 200, 820, 1300, 400); c.stroke(); }, 0);
}, { ...GC, tintA: 0.2 }, 0.15);
// 9 "В пятницу?.. Зачем?" -> keeper opens watch -> warm flood -> flash
shot(W('D3') - 0.05, W('L4') - 0.1, (F, t) => { const t0 = W('D3') - 0.05, t1 = W('L4') - 0.1; const fl = easeIn(seg(t, W('D3', 'зачем') + 0.4, t1));
  const cam = kf([[t0, { x: -250, y: 280, z: 1.9 }], [W('D3', 'зачем') + 0.3, { x: -245, y: 270, z: 2.0 }], [t1, { x: 140, y: 60, z: 1.55 }]], t);
  station(F, t, { cam, dim: 0.5 - fl * 0.4, warm: fl * 0.7, bf: 5, bk: t < W('D3', 'зачем') + 0.3 ? 5 : 0, dima: { x: 210, y: 1560, pose: { lean: 0.03, aR: [0.7, 1.3], aL: [0.2, 0.3], tilt: -0.1 }, ex: 'confused', gaze: 0.6 }, keeper: { open: 1, glow: 1 + fl * 3, ex: 'soft' } });
  if (fl > 0) F.layer(c => glow(c, 720, 1000, 500 + fl * 1500, AMBER, 0.4 + fl * 1.1), 0);
}, GC, 0.12);
// ---------------- MEMORY: hallway ----------------
function hall(F, t, cam, o = {}, actors = []) {
  F.layer(c => { applyCam(c, cam, 0.9); S.hallway(c, t, o); }, o.blur ?? 0);
  for (const a of actors) { const draw = c => { applyCam(c, cam, 1); toon(c, CH[a.ch], { t, seed: a.seed || 0, L: a.L || LW, ...a }); if (a.after) a.after(c); }; if (a.ghost) ghost(F, draw, a.ghost, a.blur || 0); else F.layer(draw, a.blur || 0); }
  F.layer(c => { applyCam(c, cam, 1.25); dust(c, t, 11, 50, [-200, 0, 2400, 1500], hex('#ffe6b8'), 0.6, 4); }, 1.5);
}
const HU = 132; // head unit in hallway shots
// 10 "Ты в наушниках." Dima-19 enters through the front door
shot(W('L4') - 0.1, W('L4', 'мама') - 0.12, (F, t) => { const t0 = W('L4') - 0.1; const cam = tl(t0, t0 + 1.7, { x: -260, y: 120, z: 1.25 }, { x: -200, y: 110, z: 1.3 })(t);
  const wx = lerp(150, 330, easeOut(seg(t, t0, t0 + 1.4)));
  hall(F, t, cam, { steam: 1 }, [{ ch: 'dima19', x: wx, y: 1520, h: HU, face: 1, pose: { walk: (t - t0) < 1.3 ? (t - t0) * 7 : null, aR: [0.1, 0.3] }, ex: exB('bored', t, 4, { gaze: 0.2, smile: 0.15 }), seed: 4, after: c => notes(c, wx - 40, 1520 - 3.5 * HU, t) }]);
}, GW, 0);
// 11 "Мама в пятый раз просто вышла за водой," mom crosses with a glass, x5
shot(W('L4', 'мама') - 0.12, W('L4', 'греет') - 0.1, (F, t) => { const t0 = W('L4', 'мама') - 0.12, t1 = W('L4', 'греет') - 0.1; const cam = tl(t0, t1, { x: 180, y: 60, z: 1.08 }, { x: 260, y: 60, z: 1.1 })(t);
  const p = seg(t, t0, t1); const mx = lerp(1100, 560, p);
  const acts = [];
  for (let g = 3; g >= 1; g--) { const gp = seg(t - g * 0.12, t0, t1); acts.push({ ch: 'mom45', x: lerp(1100, 560, gp), y: 1520, h: 128, face: -1, pose: { walk: (t - g * 0.12) * 9, aR: [1.3, 1.2] }, ex: EX.soft, ghostTrail: 1, alpha: 0.18 }); }
  F.layer(c => { applyCam(c, cam, 0.9); S.hallway(c, t, { steam: 1 }); }, 0);
  for (const a of acts) F.layer(c => { applyCam(c, cam, 1); toon(c, CH.mom45, { ...a, t, L: LW }); }, 3, 0.22);
  F.layer(c => { applyCam(c, cam, 1); toon(c, CH.mom45, { x: mx, y: 1520, h: 128, face: -1, t, L: LW, seed: 5, pose: { walk: t * 9, aR: [1.3, 1.2] }, ex: exB('soft', t, 5, { gaze: 0.6 }), talk: 0, hold: (h, u) => glassItem(h, u) }); toon(c, CH.dima19, { x: 360, y: 1520, h: HU, face: 1, t, L: LW, seed: 4, ex: exB('bored', t, 4, { gaze: 0.0 }), pose: { aR: [0.1, 0.3] } }); }, 0);
  F.layer(c => icon(c, 'glass', 700, 600, seg(t, W('L4', 'пятый'), W('L4', 'пятый') + 0.35), '×5'), 0);
}, GW, 0.1);
// 12 "греет суп в третий." kitchen stove, pot x3
shot(W('L4', 'греет') - 0.1, W('L4', 'папа') - 0.1, (F, t) => { const t0 = W('L4', 'греет') - 0.1; const cam = tl(t0, t0 + 1.6, { x: 560, y: 220, z: 1.9 }, { x: 560, y: 200, z: 2.05 })(t);
  F.layer(c => { applyCam(c, cam, 0.9); S.hallway(c, t, { steam: 1.4 }); }, 2.5);
  F.layer(c => { applyCam(c, cam, 1); toon(c, CH.mom45, { x: 1215, y: 1520, h: 128, face: -1, t, L: LW, seed: 5, pose: { aR: [1.6 + Math.sin(t * 5) * 0.15, 1.0] }, ex: exB('soft', t, 5, { gaze: 0.8 }), hold: (h, u) => { h.strokeStyle = INK; h.lineWidth = 8; h.beginPath(); h.moveTo(0, 0); h.lineTo(u * 0.1, u * 0.7); h.stroke(); } }); }, 0);
  F.layer(c => icon(c, 'pot', 640, 520, seg(t, W('L4', 'третий'), W('L4', 'третий') + 0.35), '×3'), 0);
}, GW, 0.1);
// 13 "Папа смотрит выключенный телевизор." living room
shot(W('L4', 'папа') - 0.1, W('D4') - 0.05, (F, t) => { const t0 = W('L4', 'папа') - 0.1; const cam = tl(t0, t0 + 2.2, { x: 40, y: 20, z: 1.05 }, { x: 0, y: 40, z: 1.12 })(t);
  F.layer(c => { applyCam(c, cam, 0.6); S.livingRoom(c, t); }, 2);
  F.layer(c => { applyCam(c, cam, 0.85); toon(c, CH.dad48, { x: 600, y: 1150 + 1.45 * 150, h: 150, face: -1, t, L: { ...LW, rimX: -1 }, seed: 6, pose: { sit: true, lean: -0.05, aR: [0.7, -0.6], aL: [0.6, -0.5] }, ex: exB('neutral', t, 6, { gaze: 0.2 }) }); }, 0);
  F.layer(c => { applyCam(c, cam, 1.3); S.tvSet(c, 60, 1300, 560, 430, r => { r.save(); r.translate(330, 1700); r.scale(-0.45, 0.45); r.translate(-600, -1367); toon(r, CH.dad48, { x: 600, y: 1150 + 1.45 * 150, h: 150, face: -1, t, L: LW, pose: { sit: true }, ex: EX.neutral }); r.restore(); }); }, 0);
}, GW, 0.12);
// 14 "Выключенный…" — TV reflection: dad's eyes slide to the hallway; adult Dima (ghost) smiles
shot(W('D4') - 0.05, W('L5') - 0.05, (F, t) => { const t0 = W('D4') - 0.05, t1 = W('L5') - 0.05, mid = t0 + 1.15;
  if (t < mid) { const peek = easeIO(seg(t, t0 + 0.2, t0 + 0.55));
    F.layer(c => { const z = lerp(1, 1.05, seg(t, t0, mid)); c.translate(540, 960); c.scale(z, z); c.translate(-540, -960); c.fillStyle = '#2a1c14'; c.fillRect(0, 0, VW, VH); S.rr(c, 60, 300, 960, 1200, 120); c.fillStyle = '#0c0e10'; c.fill(); S.ol(c, 8);
      c.save(); S.rr(c, 60, 300, 960, 1200, 120); c.clip(); c.globalAlpha = 0.42; toon(c, CH.dad48, { x: 520, y: 900 + 3.7 * 330, h: 330, face: 1, t, L: LW, cropLegs: true, ex: { ...EX.neutral, gaze: lerp(0.1, 1.1, peek), eye: 0.9 }, pose: {} }); c.globalAlpha = 1; c.fillStyle = 'rgba(255,240,220,0.07)'; c.beginPath(); c.moveTo(150, 300); c.lineTo(420, 300); c.lineTo(200, 1500); c.lineTo(-60, 1500); c.closePath(); c.fill(); c.restore(); }, 0); }
  else { const cam = tl(mid, t1, { x: 640, y: 20, z: 1.35 }, { x: 650, y: 0, z: 1.42 })(t);
    hall(F, t, cam, { steam: 0.5, blur: 4 }, [{ ch: 'dima', x: 1180, y: 1520, h: 140, face: -1, ghost: 0.62, L: LG, seed: 7, pose: { aR: [0.1, 0.2], aL: [0.05, 0.2] }, ex: exB('smile', t, 7, { gaze: -0.2, eye: 0.6 }) }]); }
}, GW, 0.1);
// 15 "Ты бросил: «Мам, отстань, мне не пять»." — door shuts after "пять"
shot(W('L5') - 0.05, W('L5', 'а') - 0.05, (F, t) => { const t0 = W('L5') - 0.05; const cam = tl(t0, t0 + 2.6, { x: 760, y: 80, z: 1.15 }, { x: 860, y: 70, z: 1.2 })(t);
  const wave = t > W('L5', 'мам') - 0.1 && t < W('L5', 'пять'); const goT = W('L5', 'пять') - 0.2; const dk = easeOut(seg(t, goT, goT + 0.7));
  const door = easeIn(seg(t, W('L5', 'пять') + 0.45, W('L5', 'пять') + 0.62));
  const acts = [{ ch: 'mom45', x: 1060, y: 1520, h: 128, face: 1, seed: 5, pose: { aR: [1.3, 1.2], aL: [0.4, 0.6] }, ex: exB(t > goT ? 'sad' : 'hope', t, 5, { gaze: 0.6 }), hold: (h, u) => glassItem(h, u) }];
  if (door < 0.9) acts.push({ ch: 'dima19', x: lerp(1330, 1500, dk), y: 1520, h: HU, face: t < goT ? -1 : 1, seed: 4, pose: { walk: dk > 0 && dk < 1 ? t * 7 : null, aR: wave ? [2.3 + Math.sin(t * 16) * 0.3, 0.3] : [0.1, 0.3] }, ex: exB('annoyed', t, 4, { gaze: 0.6 }), alpha: 1 });
  hall(F, t, cam, { door, steam: 0.4 }, acts);
}, GW, 0.1);
// 16 "А она говорила тебе в спину ещё сорок секунд." mom at the closed door
shot(W('L5', 'а') - 0.05, W('L5', 'хочешь') - 0.1, (F, t) => { const t0 = W('L5', 'а') - 0.05; const cam = tl(t0, t0 + 3.1, { x: 860, y: 140, z: 1.45 }, { x: 900, y: 160, z: 1.6 })(t);
  hall(F, t, cam, { door: 1, steam: 0.3 }, [{ ch: 'mom45', x: 1300, y: 1520, h: 128, face: 1, seed: 5, pose: { aR: [1.5, 0.9], aL: [0.4, 0.6] }, ex: exB('sad', t, 5, { gaze: 0.6, mouth: 0.15 + 0.2 * Math.abs(Math.sin(t * 8)) }), hold: (h, u) => glassItem(h, u) }]);
}, GW, 0.1);
// 17 "Хочешь услышать?" — adult Dima (ghost) by the door; "Да." nod
shot(W('L5', 'хочешь') - 0.1, W('M') - 0.05, (F, t) => { const t0 = W('L5', 'хочешь') - 0.1; const cam = tl(t0, W('M'), { x: 700, y: -60, z: 1.75 }, { x: 710, y: -80, z: 1.9 })(t);
  const nod = Math.sin(seg(t, W('D5') - 0.05, W('D5') + 0.45) * Math.PI) * 0.12;
  hall(F, t, cam, { door: 1, blur: 5 }, [{ ch: 'mom45', x: 1300, y: 1520, h: 128, face: 1, blur: 6, seed: 5, pose: { aR: [1.5, 0.9] }, ex: EX.sad }, { ch: 'dima', x: 1150, y: 1520, h: 140, face: 1, ghost: 0.66, L: LG, seed: 7, pose: { tilt: nod }, ex: exB(t > W('D5') ? 'sad' : 'hope', t, 7, { gaze: 0.7 }), talk: talk('dima', t) * 0.5 }]);
}, GW, 0.1);
// 18 MAMA close-up at the door (her words, clean)
shot(W('M') - 0.05, W('M', 'только') - 0.1, (F, t) => { const t0 = W('M') - 0.05; const cam = tl(t0, W('M', 'только'), { x: 0, y: 0, z: 1.0 }, { x: 30, y: 30, z: 1.12 }, x => x)(t);
  const look = seg(t, W('M', 'поешь') - 0.1, W('M', 'поешь') + 0.3) * (1 - seg(t, W('M', 'поешь') + 0.9, W('M', 'поешь') + 1.3));
  const ex = t < W('M', 'ты') ? 'sad' : 'tender';
  F.layer(c => { applyCam(c, cam, 0.5); S.doorCU(c, t); }, 3);
  F.layer(c => { applyCam(c, cam, 1); toon(c, CH.mom45, { x: 380, y: 760 + 3.1 * 300, h: 300, face: 1, t, L: { ...LW, rimI: 1 }, seed: 5, pose: { aR: [lerp(1.35, 0.9, look), lerp(0.9, 1.5, look)], aL: [0.3, 0.5], tilt: 0.05 }, ex: exB(ex, t, 5, { gaze: lerp(0.6, 0.1, look), gazeY: look * 0.8, tear: t > W('M', 'лучший') ? 1 : 0 }), talk: talk('mama', t) * 0.8, hold: (h, u) => plate(h, u) }); }, 0);
  F.layer(c => { applyCam(c, cam, 1.3); dust(c, t, 21, 46, [0, 0, VW, 1500], hex('#ffe6b8'), 0.75, 5); }, 2);
}, { ...GW, tintA: 0.16 }, 0.25);
// 19 "Только звони, ладно?" — adult Dima ghost covers his mouth
shot(W('M', 'только') - 0.1, W('M', 'хоть') - 0.1, (F, t) => { const t0 = W('M', 'только') - 0.1; const cam = tl(t0, t0 + 2, { x: 0, y: 0, z: 1.0 }, { x: 0, y: 20, z: 1.06 })(t);
  F.layer(c => { applyCam(c, cam, 0.5); S.doorCU(c, t); toon(c, CH.mom45, { x: 900, y: 760 + 3.1 * 300, h: 300, face: 1, t, L: LW, ex: EX.tender, pose: { aR: [1.35, 0.9] }, talk: talk('mama', t) * 0.6, hold: (h, u) => plate(h, u) }); }, 9);
  ghost(F, c => { applyCam(c, cam, 1); toon(c, CH.dima, { x: 420, y: 700 + 3.9 * 280, h: 280, face: 1, t, L: LG, seed: 7, pose: { aR: [1.0, 2.5], tilt: 0.08 }, ex: exB('broken', t, 7, { gaze: 0.6, tearRun: seg(t, t0 + 0.4, t0 + 1.6) }) }); }, 0.72, 0);
}, { ...GW, tintA: 0.14 }, 0.15);
// 20 "Хоть иногда." plate down by the door, she leaves, the hallway light stays on
shot(W('M', 'хоть') - 0.1, W('D6') - 0.05, (F, t) => { const t0 = W('M', 'хоть') - 0.1; const cam = tl(t0, W('D6'), { x: 880, y: 300, z: 1.55 }, { x: 860, y: 280, z: 1.62 })(t);
  const set = easeOut(seg(t, t0, t0 + 0.6)), go = seg(t, t0 + 0.6, W('D6'));
  hall(F, t, cam, { door: 1 }, [{ ch: 'mom45', x: lerp(1300, 1000, go), y: 1520, h: 128, face: go > 0 ? -1 : 1, seed: 5, pose: { lean: lerp(0.5, 0, easeIO(seg(t, t0 + 0.2, t0 + 0.6))), walk: go > 0 ? t * 6 : null }, ex: EX.sad }]);
  F.layer(c => { applyCam(c, cam, 1); c.save(); c.translate(1420, 1520 - (1 - set) * 120); plateFloor(c, t); c.restore(); }, 0);
}, GW, 0.12);
// 21 "Я даже не снял наушники…" — Dima-19 in his room with earbuds -> adult Dima's trembling chin
shot(W('D6') - 0.05, W('L7') - 0.05, (F, t) => { const t0 = W('D6') - 0.05, sw = W('D6', 'наушники');
  if (t < sw) F.layer(c => { const z = lerp(1, 1.06, seg(t, t0, sw)); c.translate(540, 900); c.scale(z, z); c.translate(-540, -900); c.fillStyle = lg(c, 0, 0, 0, VH, [[0, '#4a2c1a'], [1, '#22140c']]); c.fillRect(-100, -100, VW + 200, VH + 200); glow(c, 900, 500, 700, hex('#ffc27a'), 0.5);
    toon(c, CH.dima19, { x: 560, y: 520 + 3.85 * 420, h: 420, face: 1, t, L: { ...LW, rimI: 1 }, cropLegs: true, ex: exB('bored', t, 4, { gaze: 0.3, eye: 0.6 }), pose: {} }); notes(c, 420, 640, t); }, 0);
  else F.layer(c => { c.fillStyle = lg(c, 0, 0, 0, VH, [[0, '#123044'], [1, '#081822']]); c.fillRect(0, 0, VW, VH); glow(c, 150, 300, 700, hex('#ffc27a'), 0.25); const z = lerp(1.05, 1.0, seg(t, sw, W('L7')));
    c.translate(540, 900); c.scale(z, z); c.translate(-540, -900); toon(c, CH.dima, { x: 500, y: 560 + 3.9 * 440, h: 440, face: 1, t, L: Lmix(LC, LW, 0.3), cropLegs: true, ex: { ...EX.broken, tremble: Math.sin(t * 40) * 3, tear: 1, tearRun: seg(t, sw, sw + 0.8), eye: 0.5, gaze: 0.3 }, pose: { tilt: 0.06 } }); }, 0);
}, { tint: hex('#a07040'), tintA: 0.15, bloom: 0.4, grain: 0.06, vig: 70 }, 0.1);
// 22 Street: bus, Dima walks home; "Папа." dad 20 m behind; hides behind lamp post; window lights up
const SU = 150;
shot(W('L7') - 0.05, W('D7') - 0.1, (F, t) => { const t0 = W('L7') - 0.05, tP = W('L7', 'папа'), tS = W('L7', 'шёл'), tH = W('L7', 'чтобы'), tE = W('L7', 'заметил') + 0.4;
  const busX = t < t0 + 1.4 ? lerp(-900, 300, easeOut(seg(t, t0, t0 + 1.4))) : t < t0 + 2.9 ? 300 : lerp(300, 2600, easeIn(seg(t, t0 + 2.9, t0 + 4.6)));
  const door = seg(t, t0 + 1.4, t0 + 1.7) * (1 - seg(t, t0 + 2.5, t0 + 2.8));
  const dStart = t0 + 1.8, dWalk = Math.max(0, Math.min(t, tE) - dStart), dX = 360 + dWalk * 230;
  const turn = t > tH && t < tH + 0.7, hide = t > tH - 0.05 && t < tH + 0.9;
  const dadStart = tP - 0.4, dadW = Math.max(0, Math.min(t, tH - 0.05) - dadStart) + (t > tH + 0.9 ? Math.min(t - tH - 0.9, 0.5) : 0); let dadX = -250 + dadW * 230; if (t > tE + 0.3) dadX -= (t - tE - 0.3) * 160;
  const inK = seg(t, tE - 0.1, tE + 0.3);
  const camX = t < tP - 0.3 ? lerp(-60, 180, seg(t, t0, tP - 0.3)) : lerp(180, (dX + dadX) / 2 - 540 + 120, easeIO(seg(t, tP - 0.3, tP + 0.8)));
  const zoom = t < tP - 0.3 ? 1.12 : lerp(1.12, 0.92, easeIO(seg(t, tP - 0.3, tP + 0.8)));
  const cam = { x: camX, y: 120, z: zoom };
  const lamps = [-300, 500, 1300, 2100];
  F.layer(c => { applyCam(c, cam, 0.5); S.street(c, t, { warm: 1, entrance: true, winLit: easeOut(seg(t, tE + 0.2, tE + 0.5)), lamps }); }, 1.2);
  F.layer(c => { applyCam(c, cam, 0.8); for (const x of lamps) S.streetLamp(c, t, x, 1); S.busStop(c, 300, 1); }, 0);
  F.layer(c => { applyCam(c, cam, 0.8); if (busX < 2500) S.bus(c, busX, door, 1); }, 0);
  F.layer(c => { applyCam(c, cam, 1);
    if (t > tP - 0.5) toon(c, CH.dad48, { x: hide ? 1180 - 230 * 0 : dadX, y: 1560, h: SU, face: t > tE + 0.3 ? -1 : 1, t, L: { ...LW, rimI: 0.5 }, seed: 6, pose: { walk: (!hide && t < tH - 0.05) || (t > tH + 0.9 && t < tH + 1.4) || t > tE + 0.3 ? t * 6 : null, aR: [0.1, 0.4], aL: [0.1, 0.4] }, ex: exB(t > tE + 0.1 ? 'smile' : 'hope', t, 6, { gaze: 0.5 }) });
    if (inK < 1 && t > dStart - 0.6) toon(c, CH.dima19, { x: dX, y: 1560, h: SU, face: turn ? -1 : 1, t, L: LW, seed: 4, pose: { walk: t > dStart && t < tE ? t * 6.5 : null }, ex: exB('bored', t, 4, { gaze: 0.3 }) });
  }, 0);
  // lamp post the dad hides behind (in front)
  F.layer(c => { applyCam(c, cam, 1); c.fillStyle = '#2a2a32'; c.fillRect(1200, 640, 30, 960); c.strokeStyle = INK; c.lineWidth = 5; c.strokeRect(1200, 640, 30, 960); }, 0);
  F.layer(c => rain(c, t, 99, 90, [-100, -100, VW + 200, VH + 200], hex('#ffe2c0'), 0.3, 90, 2.4, 0.06, 2400), 1.5);
}, { ...GW, tintA: 0.14 }, 0.15);
// 23 "Я думал, он спит…" adult Dima in the rain by the curb
shot(W('D7') - 0.1, W('L8') - 0.05, (F, t) => { const cam = tl(W('D7') - 0.1, W('L8'), { x: 1200, y: -60, z: 1.6 }, { x: 1210, y: -80, z: 1.7 })(t);
  F.layer(c => { applyCam(c, cam, 0.5); S.street(c, t, { warm: 1, entrance: true, winLit: 1, lamps: [1300, 2100] }); }, 5);
  F.layer(c => { applyCam(c, cam, 0.8); for (const x of [1300, 2100]) S.streetLamp(c, t, x, 1); }, 4);
  ghost(F, c => { applyCam(c, cam, 1); toon(c, CH.dima, { x: 1700, y: 1560, h: 150, face: -1, t, L: LG, seed: 7, pose: { tilt: 0.12, aR: [0.05, 0.2] }, ex: exB('teary', t, 7, { gaze: 0.2 }), talk: talk('dima', t) * 0.4 }); }, 0.72);
  F.layer(c => rain(c, t, 98, 90, [-100, -100, VW + 200, VH + 200], hex('#ffe2c0'), 0.3, 90, 2.4, 0.06, 2400), 1.5);
}, { ...GW, tintA: 0.12 }, 0.12);
// 24 PRESENT: office "Теперь у тебя бизнес."
shot(W('L8') - 0.05, W('L8', 'ты') - 0.1, (F, t) => { const t0 = W('L8') - 0.05; const cam = tl(t0, t0 + 1.7, { x: -150, y: 230, z: 1.25 }, { x: -125, y: 215, z: 1.33 }, x => x)(t);
  F.layer(c => { applyCam(c, cam, 0.4); S.office(c, t); }, 3);
  F.layer(c => { applyCam(c, cam, 1); S.rr(c, -200, 1330, VW + 400, 50, 0); c.fillStyle = '#16242e'; c.fill(); S.ol(c, 4); S.laptop(c, 680, 1330, 1); toon(c, CH.dima, { x: 340, y: 1330 + 1.45 * 130 - 40, h: 130, face: 1, t, L: { ...LC, rim: hex('#bfefff'), rimI: 1 }, seed: 2, pose: { sit: true, lean: 0.22, aR: [1.5, 0.2], aL: [1.4, 0.25], tilt: 0.12 }, ex: exB('bored', t, 2, { gaze: 0.6, eye: 0.6 }) }); }, 0);
}, { ...GC, tintA: 0.16 }, 0.1);
// 25 "Ты присылаешь им деньги." notification
shot(W('L8', 'ты') - 0.1, W('L8', 'они') - 0.1, (F, t) => { const t0 = W('L8', 'ты') - 0.1; const cam = tl(t0, t0 + 1.8, { x: 0, y: 40, z: 1.0 }, { x: 0, y: 0, z: 1.08 }, x => x)(t);
  F.layer(c => { applyCam(c, cam, 0.4); S.office(c, t); }, 12);
  F.layer(c => { applyCam(c, cam, 1); phone(c, 540, 820, 430, -0.04, (s, w, h) => ui(s, w, h, { notif: easeOut(seg(t, W('L8', 'деньги') - 0.2, W('L8', 'деньги') + 0.15)), t })); }, 0);
}, GC, 0.08);
// 26 "Они пишут: «Приезжай, мы скучаем». Ты ставишь" — chat, finger
shot(W('L8', 'они') - 0.1, W('L8', 'сердечко') - 0.05, (F, t) => { const t0 = W('L8', 'они') - 0.1, tap = W('L8', 'ставишь') + 0.15; const cam = tl(t0, tap + 0.3, { x: 0, y: 0, z: 1.04 }, { x: 40, y: 70, z: 1.32 })(t);
  F.layer(c => { applyCam(c, cam, 0.4); S.office(c, t); }, 14);
  F.layer(c => { applyCam(c, cam, 1); phone(c, 540, 820, 430, 0.02, (s, w, h) => ui(s, w, h, { chat: 1, msg: easeOut(seg(t, W('L8', 'приезжай') - 0.15, W('L8', 'приезжай') + 0.2)), heart: seg(t, tap, tap + 0.2), t }));
    const fy = lerp(1800, 1010, easeIO(seg(t, W('L8', 'ты', 's') > t0 ? tap - 0.7 : tap - 0.7, tap))) + (t > tap + 0.1 ? (t - tap - 0.1) * 500 : 0);
    S.rr(c, 640, fy, 120, 900, 60); c.fillStyle = rgba(CH.dima.skin); c.fill(); S.ol(c, 6); S.rr(c, 668, fy + 18, 64, 50, 22); c.fillStyle = '#ffe8dc'; c.fill(); }, 0);
}, GC, 0.08);
// 27 "сердечко." heart close-up trembles and fades (music peak)
shot(W('L8', 'сердечко') - 0.05, W('L9') - 0.05, (F, t) => { const t0 = W('L8', 'сердечко') - 0.05, t1 = W('L9') - 0.05;
  F.layer(c => { c.fillStyle = rg(c, 540, 820, 40, 1300, [[0, '#14222e'], [1, '#03070b']]); c.fillRect(0, 0, VW, VH); for (let i = 0; i < 18; i++) glow(c, (i * 173) % VW, (i * 331) % 1400, 60 + (i % 3) * 30, hex('#7fc8f0'), 0.12); }, 0);
  F.layer(c => { const k = seg(t, t0, t1), z = lerp(1, 1.14, k), dimK = easeIn(seg(t, t0 + 0.35, t1)); c.translate(540 + Math.sin(t * 55) * 7 * (1 - k), 820); c.scale(z, z);
    glow(c, 0, 0, 520, hex('#ff4a6a'), 0.55 * (1 - dimK * 0.85)); heartPath(c, 280); c.fillStyle = rgba(mix(hex('#ff3b5c'), hex('#5a2e36'), dimK)); c.fill(); S.ol(c, 10);
    c.fillStyle = `rgba(255,220,230,${0.6 * (1 - dimK)})`; c.beginPath(); c.ellipse(-90, -110, 46, 26, -0.6, 0, 6.283); c.fill(); }, 0);
}, { tint: hex('#2a4a6a'), tintA: 0.14, bloom: 0.55, grain: 0.06, vig: 70 }, 0.05);
// 28 "А папа по пятницам всё равно выходит на остановку. Вдруг ты приедешь." dad (66) alone, nobody gets off
shot(W('L9') - 0.05, W('L9', 'и') - 0.1, (F, t) => { const t0 = W('L9') - 0.05, tv = W('L9', 'вдруг');
  const busX = t < t0 + 1.2 ? lerp(-900, 300, easeOut(seg(t, t0, t0 + 1.2))) : t < tv + 0.6 ? 300 : lerp(300, 2600, easeIn(seg(t, tv + 0.6, tv + 2.2)));
  const door = seg(t, t0 + 1.2, t0 + 1.5) * (1 - seg(t, tv + 0.2, tv + 0.5));
  const cam = tl(t0, t0 + 4.5, { x: 40, y: 140, z: 1.18 }, { x: 80, y: 160, z: 1.28 })(t);
  const lamps = [-300, 500, 1300];
  F.layer(c => { applyCam(c, cam, 0.5); S.street(c, t, { warm: 0.55, lamps }); }, 1.5);
  F.layer(c => { applyCam(c, cam, 0.8); for (const x of lamps) S.streetLamp(c, t, x, 0.55); S.busStop(c, 300, 0.55); }, 0);
  F.layer(c => { applyCam(c, cam, 0.8); if (busX < 2500) S.bus(c, busX, door, 0.55); }, 0);
  F.layer(c => { applyCam(c, cam, 1); toon(c, CH.dad66, { x: 660, y: 1560, h: SU + 6, face: -1, t, L: Lmix(LW, LC, 0.35), seed: 6, pose: { aR: [0.1, 0.3], aL: [0.1, 0.3] }, ex: exB(t < tv ? 'hope' : t < tv + 0.6 ? 'hope' : 'sad', t, 6, { gaze: 0.7 }) }); }, 0);
  F.layer(c => rain(c, t, 97, 80, [-100, -100, VW + 200, VH + 200], hex('#e6eef8'), 0.28, 90, 2.4, 0.06, 2400), 1.5);
}, { tint: hex('#9a7a5a'), tintA: 0.16, bloom: 0.42, grain: 0.06, vig: 70 }, 0.12);
// 29 "И мама не выключает свет в коридоре." mom (63) at the switch, hand lowers
shot(W('L9', 'и') - 0.1, W('D8') - 0.05, (F, t) => { const t0 = W('L9', 'и') - 0.1; const cam = tl(t0, W('D8'), { x: 600, y: 80, z: 1.25 }, { x: 640, y: 60, z: 1.35 })(t);
  const reach = Math.sin(seg(t, t0 + 0.3, W('L9', 'свет') + 0.5) * Math.PI);
  hall(F, t, cam, { old: 1, kitchen: 0.1, door: 1 }, [{ ch: 'mom63', x: 1180, y: 1520, h: 126, face: 1, seed: 8, pose: { aR: [lerp(0.2, 2.1, reach), lerp(0.3, 0.5, reach)] }, ex: exB(t > W('L9', 'свет') ? 'tender' : 'sad', t, 8, { gaze: 0.5, gazeY: -0.4 }) }]);
}, { tint: hex('#c08040'), tintA: 0.16, bloom: 0.45, grain: 0.06, vig: 70 }, 0.15);
// 30 station: "Они до сих пор ждут…" Dima teary, takes the phone, contact "Папа"
shot(W('D8') - 0.05, W('D9') - 0.08, (F, t) => { const t0 = W('D8') - 0.05; const cam = tl(t0, W('D9'), { x: -270, y: 60, z: 2.1 }, { x: -265, y: 40, z: 2.25 })(t);
  const pk = easeOut(seg(t, W('D8', 'ждут'), W('D8', 'ждут') + 0.5));
  station(F, t, { cam, bf: 6, bm: 5, bk: 6, dima: { tilt: 0.2, ex: 'teary', gaze: 0.4, exo: { tearRun: seg(t, t0, t0 + 1.2) } } });
  if (pk > 0) F.layer(c => { applyCam(c, cam, 1.15); phone(c, 470, lerp(1600, 1300, pk), 150, -0.3, (s, w, h) => ui(s, w, h, { contact: 'Папа', hover: seg(t, W('D9') - 0.5, W('D9')), t })); }, 0);
}, GC, 0.12);
// 31 dad at the stop: phone "Дима" at his ear; "Пап?.. Не выходи." his face breaks
shot(W('D9') - 0.08, W('D9', 'я') - 0.08, (F, t) => { const t0 = W('D9') - 0.08; const cam = tl(t0, W('D9', 'я'), { x: 129, y: 300, z: 2.2 }, { x: 132, y: 290, z: 2.35 })(t);
  const br = seg(t, W('D9', 'не'), W('D9', 'не') + 0.6);
  F.layer(c => { applyCam(c, cam, 0.5); S.street(c, t, { warm: 0.6, lamps: [500] }); }, 6);
  F.layer(c => { applyCam(c, cam, 0.8); S.streetLamp(c, t, 500, 0.6); S.busStop(c, 300, 0.6); }, 5);
  F.layer(c => { applyCam(c, cam, 1); toon(c, CH.dad66, { x: 660, y: 1560, h: SU + 6, face: 1, t, L: Lmix(LW, LC, 0.2), seed: 6, pose: { aR: [1.2, 2.5], tilt: 0.06 }, ex: { ...exMix('hope', 'broken', br), eye: 0.8 - br * 0.3, tremble: Math.sin(t * 40) * 1.5 * br, tear: br, tearRun: br }, hold: (h, u) => { S.rr(h, -u * 0.1, -u * 0.12, u * 0.2, u * 0.42, u * 0.04); h.fillStyle = '#bfe9ff'; h.fill(); S.ol(h, 3); glow(h, 0, u * 0.1, u * 1.2, hex('#bfe9ff'), 0.55); } }); }, 0);
  F.layer(c => rain(c, t, 96, 70, [-100, -100, VW + 200, VH + 200], hex('#e6eef8'), 0.28, 90, 2.4, 0.06, 2400), 1.5);
}, { tint: hex('#b08050'), tintA: 0.15, bloom: 0.45, grain: 0.06, vig: 70 }, 0.1);
// 32 "Я уже еду." Dima stands up with the suitcase, warm light floods the station
shot(W('D9', 'я') - 0.08, W('L11') - 0.05, (F, t) => { const t0 = W('D9', 'я') - 0.08, w = easeIO(seg(t, t0, W('L11'))); const cam = tl(t0, W('L11'), { x: -225, y: 293, z: 1.62 }, { x: -215, y: 285, z: 1.7 })(t);
  station(F, t, { cam, warm: 0.3 + w * 0.6, bf: 3, keeper: { ex: 'smile', glow: 1.3 }, dima: { x: 230, y: 1560, pose: { aR: [0.6, 2.4], aL: [0.15, 0.2], tilt: 0.05 }, ex: 'hope', gaze: 0.5 } });
}, { tint: hex('#c88a3a'), tintA: 0.2, bloom: 0.5, grain: 0.06, vig: 70 }, 0.12);
// 33 final: keeper turns to the viewer; train arrives; "Позвони."
shot(W('L11') - 0.05, 89.0, (F, t) => { const t0 = W('L11') - 0.05, turn = easeIO(seg(t, t0, t0 + 0.6)); const cam = tl(t0, 89, { x: 0, y: 0, z: 1.0 }, { x: 0, y: 30, z: 1.1 }, x => x)(t);
  F.layer(c => { applyCam(c, cam, 0.35); S.stWall(c, t, { warm: 1, train: seg(t, t0 + 0.3, t0 + 3.4) }); S.stClock(c, 540, 330, 120, 23, 54, { warm: 1 }); }, 5);
  F.layer(c => { applyCam(c, cam, 0.6); for (const x of [190, 890]) S.stLamp(c, x, 160, 1200, 1, 1); dust(c, t, 5, 70, [0, 100, VW, 1500], hex('#ffe2b0'), 0.75, 5); }, 3);
  const pz = W('L11', 'позвони');
  F.layer(c => { applyCam(c, cam, 1); toon(c, CH.keeper, { x: 540, y: 720 + 3.45 * 330 - 330 * 0.5, h: 330, front: turn > 0.5, face: -1, t, L: { ...LW, rimI: 1 }, seed: 1, pose: { aR: [0.25, 1.2], aL: [0.15, 0.3] }, ex: exB(t > pz ? 'smile' : 'tender', t, 1, { gaze: turn > 0.5 ? 0 : 0.5 }), talk: talk('keeper', t) * 0.7, hold: (h, u) => S.pocketWatch(h, 0, u * 0.08, u * 0.16, 1 - seg(t, pz + 0.3, pz + 0.7), t, 1.3) }); }, 0);
}, { tint: hex('#e09030'), tintA: 0.24, bloom: 0.5, grain: 0.06, vig: 60 }, 0.2);

// ---- props ----
function glassItem(h, u) { h.save(); h.beginPath(); h.moveTo(-u * 0.11, -u * 0.12); h.lineTo(u * 0.13, -u * 0.12); h.lineTo(u * 0.1, u * 0.24); h.lineTo(-u * 0.08, u * 0.24); h.closePath(); h.fillStyle = 'rgba(210,240,255,0.85)'; h.fill(); S.ol(h, Math.max(2, u * 0.03)); h.fillStyle = 'rgba(120,200,240,0.7)'; h.fillRect(-u * 0.08, u * 0.04, u * 0.17, u * 0.18); h.restore(); }
function plate(h, u) { h.save(); h.beginPath(); h.ellipse(u * 0.1, -u * 0.02, u * 0.34, u * 0.1, 0, 0, 6.283); h.fillStyle = '#f6f2ea'; h.fill(); S.ol(h, Math.max(2, u * 0.025)); h.beginPath(); h.ellipse(u * 0.1, -u * 0.04, u * 0.22, u * 0.06, 0, 0, 6.283); h.fillStyle = '#e8a040'; h.fill(); h.restore(); }
function plateFloor(c, t) { c.beginPath(); c.ellipse(0, -14, 70, 20, 0, 0, 6.283); c.fillStyle = '#f6f2ea'; c.fill(); S.ol(c, 4); c.beginPath(); c.ellipse(0, -18, 46, 12, 0, 0, 6.283); c.fillStyle = '#e8a040'; c.fill(); for (let i = 0; i < 3; i++) { const ph = (t * 0.6 + i / 3) % 1; c.fillStyle = `rgba(255,250,240,${0.5 * (1 - ph)})`; c.beginPath(); c.arc(Math.sin(t * 2 + i) * 10, -40 - ph * 120, 10 + ph * 16, 0, 6.283); c.fill(); }
  c.save(); c.translate(100, -10); c.rotate(-0.2); S.rr(c, -36, -22, 72, 46, 6); c.fillStyle = '#fffaf0'; c.fill(); S.ol(c, 3); c.strokeStyle = 'rgba(80,60,50,0.6)'; c.lineWidth = 3; for (let k = 0; k < 3; k++) { c.beginPath(); c.moveTo(-24, -8 + k * 12); c.lineTo(24, -8 + k * 12); c.stroke(); } c.restore(); }
function portal(c, x, y, r, t, k, lab) {
  c.save(); c.globalAlpha = clamp(k); glow(c, x, y, r * 1.9, ICE, 0.5);
  c.save(); c.beginPath(); c.arc(x, y, r, 0, 6.283); c.clip(); c.fillStyle = lg(c, 0, y - r, 0, y + r, [[0, '#2a7aa8'], [1, '#9ad8ff']]); c.fillRect(x - r, y - r, 2 * r, 2 * r);
  for (let i = 0; i < 3; i++) { const bx = x - r * 0.62 + i * r * 0.44, bh = r * (0.8 + (i === 1 ? 0.6 : 0.2)), bw = r * 0.36; S.rr(c, bx, y + r * 0.7 - bh, bw, bh, 6); c.fillStyle = '#d8f2ff'; c.fill(); S.ol(c, 3); c.fillStyle = '#5ab0e0'; for (let yy = y + r * 0.7 - bh + 12; yy < y + r * 0.62; yy += 20) c.fillRect(bx + 8, yy, bw - 16, 8); }
  c.restore(); c.beginPath(); c.arc(x, y, r, 0, 6.283); c.lineWidth = 12; c.strokeStyle = '#eaf8ff'; c.stroke(); S.ol(c, 4);
  for (let i = 0; i < 12; i++) { const a = i / 12 * 6.283 + t * 0.3; c.strokeStyle = '#eaf8ff'; c.lineWidth = 8; c.beginPath(); c.moveTo(x + Math.cos(a) * r * 1.07, y + Math.sin(a) * r * 1.07); c.lineTo(x + Math.cos(a) * r * 1.17, y + Math.sin(a) * r * 1.17); c.stroke(); }
  if (lab > 0) { c.save(); c.translate(x, y + r + 74); const s = 0.6 + 0.4 * easeOut(lab); c.scale(s, s); c.globalAlpha = clamp(k) * clamp(lab * 2); S.rr(c, -190, -40, 380, 80, 40); c.fillStyle = '#eaf8ff'; c.fill(); S.ol(c, 5); c.fillStyle = '#123a52'; c.font = '900 50px Inter'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText('КОМПАНИЯ', 0, 3); c.restore(); }
  c.restore();
}
function flap(c, x, y, w, h, t, fp, ft) {
  const cards = ['П', 'Т', ' ', '2', '3', ':', '4', '7']; const cw = (w - 40) / cards.length;
  cards.forEach((ch, i) => { if (ch === ' ') return; const isDay = i < 2; const k = isDay ? fp : ft; const cx = x + 20 + i * cw + cw / 2;
    S.rr(c, cx - cw / 2 + 4, y + 12, cw - 8, h - 24, 8); c.fillStyle = '#1c2a34'; c.fill(); S.ol(c, 3); c.fillStyle = 'rgba(0,0,0,0.5)'; c.fillRect(cx - cw / 2 + 4, y + h / 2 - 2, cw - 8, 4);
    const settled = k >= 1 - i * 0.02; const show = k <= 0 ? '' : settled ? ch : (ch === ':' ? ':' : '0123456789ПТСЧ'[Math.floor(t * 28 + i * 3) % 14]);
    c.fillStyle = '#eaf8ff'; c.font = `900 ${h * 0.6}px Inter`; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText(show, cx, y + h / 2 + 4); });
  c.textAlign = 'left';
}
module.exports = { S: SH };
