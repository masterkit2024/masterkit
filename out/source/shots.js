const C = require('./core');
const E = require('./env');
const { P: CH, person } = require('./people');
const { hex, rgba, mix, shade, lg, rg, clamp, lerp, ease, easeIO, easeOut, easeIn, seg, kf, glow, cone, dust, rain, applyCam, VW, VH } = C;
const TL = require('../timeline.json');
const { COLD, WARM, AMBER, ICE } = E;

// ---- helpers ----
function talk(spk, t) { for (const c of TL) if (c.spk === spk && t >= c.start - 0.05 && t <= c.end + 0.05) { for (const [a, b] of c.runs) if (t >= a && t <= b) return 0.25 + 0.35 * Math.abs(Math.sin(t * 17.3)) * Math.abs(Math.sin(t * 5.1 + 1)); } return 0; }
function blink(t, seed = 0) { const p = (t + seed * 1.37) % 3.7; return p < 0.12 ? Math.abs(p - 0.06) / 0.06 : 1; }
const Lmix = (a, b, k) => ({ key: mix(a.key, b.key, k), kx: a.kx, amb: mix(a.amb, b.amb, k), rim: mix(a.rim, b.rim, k), rimX: a.rimX, rimI: lerp(a.rimI, b.rimI, k), ki: lerp(a.ki ?? 1, b.ki ?? 1, k) });
const flipL = (L, rimX) => ({ ...L, rimX, kx: -rimX });
function ghost(F, ctx, fn, alpha = 0.55, blur = 0) {
  F.layer(o => { fn(o); o.save(); o.setTransform(1, 0, 0, 1, 0, 0); o.globalCompositeOperation = 'source-atop'; o.fillStyle = 'rgba(110,170,230,0.30)'; o.fillRect(0, 0, F.W, F.H); o.restore(); }, blur, alpha, 'source-over', ctx);
  F.layer(o => { fn(o); o.save(); o.setTransform(1, 0, 0, 1, 0, 0); o.globalCompositeOperation = 'source-in'; o.fillStyle = 'rgba(140,210,255,1)'; o.fillRect(0, 0, F.W, F.H); o.restore(); }, 18, 0.10 * alpha / 0.55, 'lighter', ctx);
}
function icon(ctx, kind, x, y, s, a, label) {
  ctx.save(); ctx.globalAlpha = a; ctx.translate(x, y); ctx.scale(s, s);
  ctx.fillStyle = 'rgba(30,18,8,0.45)'; ctx.beginPath(); ctx.roundRect(-70, -48, 190, 96, 48); ctx.fill();
  ctx.strokeStyle = '#ffd59a'; ctx.fillStyle = '#ffd59a'; ctx.lineWidth = 6; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
  if (kind === 'pot') { ctx.beginPath(); ctx.roundRect(-45, -14, 70, 42, 8); ctx.stroke(); ctx.beginPath(); ctx.moveTo(-52, -14); ctx.lineTo(32, -14); ctx.stroke(); ctx.beginPath(); ctx.moveTo(-20, -24); ctx.lineTo(0, -24); ctx.stroke(); for (let i = 0; i < 3; i++) { ctx.beginPath(); ctx.moveTo(-30 + i * 18, -32); ctx.quadraticCurveTo(-24 + i * 18, -40, -30 + i * 18, -46); ctx.stroke(); } }
  else { ctx.beginPath(); ctx.moveTo(-34, -32); ctx.lineTo(-26, 30); ctx.lineTo(10, 30); ctx.lineTo(18, -32); ctx.closePath(); ctx.stroke(); ctx.globalAlpha = a * 0.5; ctx.fillRect(-28, 0, 42, 26); ctx.globalAlpha = a; }
  ctx.font = '900 54px Inter'; ctx.textBaseline = 'middle'; ctx.fillText(label, 44, 4);
  ctx.restore();
}
// ============ STATION SCENE BUILDER ============
function station(F, t, o) {
  const ctx = F.ctx, cam = o.cam, warm = o.warm || 0, dim = o.dim || 0;
  const Lk = Lmix(COLD, WARM, warm);
  const blurFar = o.blurFar ?? 3, blurMid = o.blurMid ?? 0, blurNear = o.blurNear ?? 2;
  F.layer(c => { applyCam(c, cam, 0.35); E.stationWall(c, t, { warm, dim, train: o.train }); E.stationClock(c, 540, 470, 150, o.hh ?? 23, o.mm ?? 13 + t / 60, { warm, spin: o.spin }); }, blurFar);
  F.layer(c => { applyCam(c, cam, 0.6); E.departureBoard(c, t, 40, 640, 400, 150, { warm }); for (const x of [250, 830]) E.pendantLamp(c, x, 230, 1100, 1 - dim * 0.6, warm); E.stationFloor(c, t, 1320, { warm, dim }); dust(c, t, 3, 70, [0, 200, VW, 1200], mix(hex('#cfeeff'), hex('#ffd9a0'), warm), 0.5, 3); }, blurFar * 0.6);
  // booth + keeper
  F.layer(c => {
    applyCam(c, cam, 1);
    const g = E.booth(c, t, 600, 760, 470, 660, { warm });
    if (!o.noKeeperInBooth) {
      c.save(); c.beginPath(); c.rect(g.gx, 760, g.gw, 655); c.clip();
      const kp = o.keeper || {};
      person(c, CH.keeper, { x: 835, y: 1760, h: 900, face: -1, L: flipL(Lk, -1), pose: { aR: kp.aR || [0.55, 1.9], aL: [0.2, 0.5], headTilt: kp.tilt || 0 }, ex: { eye: kp.eye ?? blink(t, 1), smile: kp.smile ?? 0.15, mouth: talk('keeper', t), gaze: kp.gaze ?? 0.3, brow: kp.brow || 0 }, onHand: (h, u) => { E.pocketWatch(h, u * 0.05, u * 0.3, u * 0.22, kp.watchOpen ?? 1, t, kp.watchGlow ?? 1); } });
      c.restore();
    }
    E.boothFront(c, t, 600, 760, 470, 660, g, { warm });
    // watch glow reaching beyond glass
    glow(c, 700, 1200, 260, AMBER, 0.18 * ((o.keeper || {}).watchGlow ?? 1));
  }, blurMid);
  // bench + dima
  F.layer(c => {
    applyCam(c, cam, 1.25);
    E.bench(c, -20, 1330, 520, warm);
    E.suitcase(c, 380, 1470, 1, Lk);
    const d = o.dima || {};
    if (!d.hide) person(c, CH.dima, { x: d.x ?? 190, y: d.y ?? (1330 + 3.8 * 820 / 7.5), h: 820, face: 1, L: Lk, pose: d.pose || { sit: true, lean: 0.12, aR: [0.9, -0.5], aL: [0.8, -0.4], headTilt: d.tilt ?? 0.1 }, ex: { eye: d.eye ?? blink(t, 2), brow: d.brow ?? 0.2, smile: d.smile ?? -0.1, mouth: talk('dima', t), gaze: d.gaze ?? 0.4 } });
  }, blurNear);
  // foreground pillar + rain drip
  if (!o.noPillar) F.layer(c => { applyCam(c, cam, 1.8); c.fillStyle = lg(c, -140, 0, 120, 0, [[0, '#02070a'], [0.8, '#071820'], [1, rgba(mix(ICE, AMBER, warm), 0.4)]]); c.fillRect(-200, -400, 300, 2800); dust(c, t, 8, 14, [0, 300, VW, 1400], mix(hex('#cfeeff'), hex('#ffd9a0'), warm), 0.6, 9); }, 14);
}

// ============ HALLWAY SCENE BUILDER ============
function hall(F, t, o) {
  const ctx = F.ctx; const cm = E.cam3(o.cam);
  let info;
  F.layer(c => { info = E.hallway(c, cm, t, o); dust(c, t, 11, 60, [200, 200, 700, 1100], hex('#ffd9a0'), 0.55, 3); }, o.envBlur ?? 1.5);
  // actors sorted far->near
  const acts = (o.actors || []).slice().sort((a, b) => b.Z - a.Z);
  for (const a of acts) {
    const p = cm.p(a.X, 0, a.Z), h = a.hgt * cm.s(a.Z);
    const L = a.L || WARM;
    const draw = c => person(c, CH[a.ch], { x: p[0], y: p[1], h, face: a.face ?? 1, front: a.front, L, pose: a.pose || {}, ex: a.ex || {}, onHand: a.onHand, cropLegs: a.cropLegs });
    const bl = a.blur ?? 0;
    if (a.ghost) ghost(F, ctx, draw, a.ghost, bl); else F.layer(draw, bl);
  }
  return { cm, info };
}
// ============ STREET SCENE BUILDER ============
function streetScene(F, t, o) {
  const cm = E.cam3(o.cam);
  F.layer(c => {
    E.street(c, cm, t, o);
    if (o.entranceX != null) E.entrance(c, cm, o.entranceX, 8.6, o.winLit || 0);
    E.busStop(c, cm, o.stopX ?? 0, 6.9, t, o.warm ?? 1);
    if (o.busX != null) E.bus(c, cm, o.busX, 8.4, o.door || 0, o.warm ?? 1);
  }, o.envBlur ?? 1.2);
  for (const a of (o.actors || []).slice().sort((a, b) => b.Z - a.Z)) {
    const p = cm.p(a.X, 0, a.Z), h = a.hgt * cm.s(a.Z);
    const draw = c => person(c, CH[a.ch], { x: p[0], y: p[1], h, face: a.face ?? 1, front: a.front, L: a.L || WARM, pose: a.pose || {}, ex: a.ex || {}, onHand: a.onHand });
    if (a.ghost) ghost(F, F.ctx, draw, a.ghost, a.blur || 0); else F.layer(draw, a.blur || 0);
  }
  // lamp post occluder in front (for dad hiding)
  if (o.postX != null) F.layer(c => { const a = cm.p(o.postX, 0, 5.2), b = cm.p(o.postX, 7, 5.2), s = cm.s(5.2); c.fillStyle = lg(c, a[0] - s * 0.15, 0, a[0] + s * 0.15, 0, [[0, '#060607'], [0.7, '#18181c'], [1, 'rgba(255,190,120,0.6)']]); c.fillRect(a[0] - s * 0.13, b[1], s * 0.26, a[1] - b[1]); }, 0);
  // foreground rain
  F.layer(c => { rain(c, t, 99, 90, [-100, -100, VW + 200, VH + 200], hex('#ffd9b0'), 0.22, 110, 2.2, 0.06, 2600); }, 2.5);
  return cm;
}

// ============ SHOTS ============
const S = [];
const shot = (t0, t1, draw, grade = {}, xin = 0) => S.push({ t0, t1, draw, grade, xin });
const GC = { tint: hex('#2a6a9a'), tintA: 0.28, bloom: 0.5 }, GW = { tint: hex('#d8902a'), tintA: 0.3, bloom: 0.55 };

// 1. Station wide push-in
shot(0, 9.45, (F, t) => {
  const lt = t;
  const cam = kf([[0, { x: -40, y: 40, z: 1.0 }], [9.45, { x: 60, y: -10, z: 1.22 }]], lt, x => x);
  const open = seg(t, 2.4, 3.2);
  station(F, t, { cam, keeper: { watchOpen: open, watchGlow: 0.3 + open * 0.9, gaze: 0.2, tilt: 0.05 }, dima: { tilt: lerp(0.35, 0.02, ease(seg(t, 7.3, 8.3))), gaze: 0.6, eye: t < 7.3 ? 0.55 : blink(t, 2) }, blurFar: 3.5, blurNear: lerp(0.5, 3, seg(t, 0, 6)) });
}, GC);
// 2. Dima stands, portal with company
shot(9.45, 14.0, (F, t) => {
  const lt = t - 9.45;
  const cam = kf([[0, { x: -250, y: 110, z: 1.42 }], [4.55, { x: -215, y: 70, z: 1.58 }]], lt);
  const up = easeOut(seg(lt, 0, 0.6));
  const gest = Math.sin(lt * 3.2) * 0.25;
  station(F, t, { cam, noPillar: true, spin: seg(lt, 2.2, 2.9) > 0 && lt < 3.3 ? -3 : 0, mm: 13 + t / 60 - Math.sin(seg(lt, 2.2, 3.3) * Math.PI) * 20, blurFar: 4, blurMid: 3,
    dima: { x: 190, y: lerp(1330 + 3.8 * 820 / 7.5, 1600, up), pose: up < 0.5 ? { sit: true, lean: 0.1 } : { lean: -0.05, aR: [1.2 + gest, 1.0], aL: [0.6 - gest, 0.8], headTilt: -0.08 }, brow: -0.3, smile: 0.5, gaze: 0.5 } });
  // portal clock
  const k = easeOut(seg(lt, 0.9, 1.7)) * (1 - seg(lt, 4.1, 4.55));
  if (k > 0) F.layer(c => { applyCam(c, cam, 1.1); portal(c, 424, 800, 190 * (0.6 + 0.4 * k), t, k); }, 0);
}, GC, 0.25);
// 3. Keeper CU head shake
shot(14.0, 17.0, (F, t) => {
  const lt = t - 14;
  const cam = kf([[0, { x: 300, y: 80, z: 2.2 }], [3, { x: 295, y: 70, z: 2.4 }]], lt);
  const shake = Math.sin(seg(lt, 0.3, 1.9) * Math.PI * 3) * 0.08 * (1 - seg(lt, 1.6, 2.0));
  station(F, t, { cam, noPillar: true, keeper: { tilt: shake, smile: 0.35, gaze: 0.4, watchOpen: 1, watchGlow: 1 + 0.3 * Math.sin(t * 6.28) }, blurFar: 6, blurNear: 8 });
}, GC, 0.2);
// 4. Rewind: big clock CU, hands spin back, lamps dim, split-flap ПТ 23:47
shot(17.0, 22.35, (F, t) => {
  const lt = t - 17;
  const cam = kf([[0, { x: 0, y: -330, z: 1.9 }], [2.4, { x: 0, y: -280, z: 2.25 }], [5.35, { x: 0, y: -150, z: 1.55 }]], lt);
  const spinK = easeIn(seg(lt, 0.2, 1.4)) * (1 - easeOut(seg(lt, 3.6, 4.4)));
  const mm = 13 - (lt < 4.4 ? Math.pow(Math.max(0, lt - 0.2), 2.2) * 60 : Math.pow(4.2, 2.2) * 60);
  station(F, t, { cam, dim: 0.5 * seg(lt, 0, 0.8), spin: spinK * 6, hh: 23 + mm / 60 - 13 / 60, mm: ((mm % 60) + 60) % 60, blurFar: 0, blurMid: 6, blurNear: 10, noKeeperInBooth: false });
  // split-flap calendar
  const k = easeOut(seg(lt, 1.6, 2.3));
  if (k > 0) F.layer(c => { flap(c, 540, 1000, t, lt - 1.6, k); }, 0);
  // reverse light streaks
  F.layer(c => { c.globalCompositeOperation = 'lighter'; for (let i = 0; i < 6; i++) { const a = -lt * 4 * spinK + i; c.strokeStyle = rgba(ICE, 0.12 * spinK); c.lineWidth = 30; c.beginPath(); c.arc(540, 470 + 330 - 330, 260 + i * 40, a, a + 0.9); c.stroke(); } }, 6);
}, { ...GC, tintA: 0.35 }, 0.15);
// 5. Dima confused, keeper opens watch, flood -> flash
shot(22.35, 25.05, (F, t) => {
  const lt = t - 22.35;
  const cam = kf([[0, { x: -230, y: 40, z: 1.75 }], [1.4, { x: -200, y: 20, z: 1.85 }], [2.7, { x: 120, y: 0, z: 1.6 }]], lt);
  const fl = easeIn(seg(lt, 1.5, 2.7));
  station(F, t, { cam, noPillar: true, dim: 0.5 - fl * 0.3, warm: fl * 0.6, blurFar: 4, blurMid: lt > 1.4 ? 0 : 3, blurNear: lt > 1.4 ? 5 : 0,
    keeper: { watchOpen: 1, watchGlow: 1 + fl * 3, gaze: 0.5 },
    dima: { x: 190, y: 1600, pose: { lean: 0.02, aR: [0.3, 0.6], aL: [0.2, 0.4], headTilt: -0.12 }, brow: 0.7, smile: -0.3, gaze: 0.5 } });
  if (fl > 0) F.layer(c => { glow(c, 700, 1080, 600 + fl * 1400, AMBER, 0.5 + fl); }, 0);
}, GC);
// 6. Hallway wide (memory): Dima-19 enters, mom crosses x5, soup x3
shot(25.05, 29.6, (F, t) => {
  const lt = t - 25.05;
  const cam = { x: lerp(-0.05, 0.1, easeIO(lt / 4.55)), y: 0, z: lerp(-0.4, 0.3, easeIO(lt / 4.55)) };
  const dz = lerp(1.6, 3.0, easeIO(seg(lt, 0, 3.2))); // dima walks deeper toward room
  const walking = lt < 3.2;
  // mom crossing: kitchen(right Z2.6) -> left and back, faster comedic
  const mc = seg(lt, 1.1, 2.9); const mx = Math.sin(mc * Math.PI * 2) * 0.35;
  const actors = [
    { ch: 'dima19', X: -0.12, Z: dz, hgt: 1.78, face: -1, pose: { walk: walking ? lt * 7 : null, aR: [0.1, 0.3] }, ex: { eye: 0.8, smile: 0.25, gaze: 0.3 }, L: flipL(WARM, -1) },
  ];
  if (lt > 1.0 && lt < 3.0) actors.push({ ch: 'mom45', X: mx + 0.1, Z: 2.75, hgt: 1.65, face: Math.cos(mc * Math.PI * 2) > 0 ? -1 : 1, pose: { walk: lt * 9, aR: [0.9, 1.4] }, ex: { eye: 1, smile: 0.1 }, onHand: (h, u) => glass(h, u) });
  hall(F, t, { cam, actors, steam: 1, envBlur: 0.8 });
  // music pulse rings from headphones
  F.layer(c => { const cm = E.cam3(cam); const p = cm.p(-0.12, 1.65, dz); for (let i = 0; i < 3; i++) { const ph = (t * 2 + i / 3) % 1; c.strokeStyle = rgba(hex('#ffe2b0'), 0.35 * (1 - ph)); c.lineWidth = 3; c.beginPath(); c.arc(p[0], p[1], 20 + ph * 70, 0, 6.283); c.stroke(); } }, 1);
  const ia = seg(lt, 1.2, 1.5) * (1 - seg(lt, 4.2, 4.5)), ip = seg(lt, 2.9, 3.2) * (1 - seg(lt, 4.2, 4.5));
  F.layer(c => { if (ia > 0) icon(c, 'glass', 200, 520, 0.9 + 0.1 * easeOut(seg(lt, 1.2, 1.4)), ia, '×5'); if (ip > 0) icon(c, 'pot', 720, 520, 0.9 + 0.1 * easeOut(seg(lt, 2.9, 3.1)), ip, '×3'); }, 0);
}, GW, 0);
// 7. Living room: dad on sofa, black TV in foreground reflecting his side-eye
shot(29.6, 31.85, (F, t) => {
  const lt = t - 29.6;
  const cam = kf([[0, { x: 60, y: 0, z: 1.05 }], [2.25, { x: 20, y: 30, z: 1.15 }]], lt);
  const peek = easeIO(seg(lt, 0.6, 1.0)) * (1 - easeIO(seg(lt, 1.7, 2.0)));
  F.layer(c => { applyCam(c, cam, 0.6); E.livingRoom(c, t); }, 3);
  F.layer(c => { applyCam(c, cam, 0.8); person(c, CH.dad48, { x: 560, y: 1500, h: 1050, face: -1, L: flipL(WARM, -1), pose: { sit: true, lean: -0.05, aR: [0.6, -0.3], headTilt: 0.05 }, ex: { eye: 1, gaze: lerp(0.2, 1, peek), brow: 0.2 } }); }, 2.2);
  F.layer(c => { applyCam(c, cam, 1.4); E.tvSet(c, 120, 1230, 620, 470, r => { r.save(); r.translate(150, 1210); r.scale(0.55, 0.42); person(r, CH.dad48, { x: 560, y: 1500, h: 1050, face: 1, L: WARM, pose: { sit: true }, ex: { eye: 1, gaze: lerp(0.2, 1, peek) } }); r.restore(); }); }, 0);
}, GW, 0.2);
// 8. Adult Dima observer, smiling at "Выключенный…"
shot(31.85, 34.8, (F, t) => {
  const lt = t - 31.85;
  const cam = { x: lerp(0.05, 0.12, lt / 3), y: -0.15, z: lerp(0.2, 0.45, easeIO(lt / 3)) };
  hall(F, t, { cam, envBlur: 5, steam: 0.6, actors: [{ ch: 'dima', X: 0.05, Z: 1.55, hgt: 1.82, face: -1, ghost: 0.62, L: flipL(Lmix(WARM, COLD, 0.4), -1), pose: { aR: [0.1, 0.2], aL: [0.05, 0.2], headTilt: 0.06 + Math.sin(lt * 9) * 0.01 * seg(lt, 0.4, 1.8) }, ex: { eye: lerp(1, 0.6, seg(lt, 0.3, 0.8)), smile: lerp(0, 0.75, easeOut(seg(lt, 0.2, 0.9))), mouth: talk('dima', t) * 0.6, gaze: -0.3, brow: -0.2 } }] });
}, GW, 0.15);
// 9. "Мам, отстань" -> door closes; mom stays at door talking
shot(34.8, 42.2, (F, t) => {
  const lt = t - 34.8;
  const cam = { x: lerp(-0.1, 0.05, easeIO(lt / 7.4)), y: 0, z: lerp(0.0, 1.6, easeIO(seg(lt, 2.2, 7.4))) };
  const dWalk = seg(lt, 0.9, 2.5);
  const dz = lerp(3.4, 6.5, easeIO(dWalk)), dX = lerp(-0.05, 0.0, dWalk);
  const door = easeIn(seg(lt, 2.4, 2.75));
  const momZ = lerp(3.0, 5.1, easeIO(seg(lt, 1.6, 3.6)));
  const actors = [
    { ch: 'mom45', X: 0.18, Z: momZ, hgt: 1.65, face: -1, L: flipL(WARM, -1), pose: { walk: lt > 1.6 && lt < 3.6 ? lt * 7 : null, aR: [0.9, 1.4], aL: lt > 4 ? [0.7, 0.9] : [0.1, 0.2] }, ex: { eye: blink(t, 3), mouth: lt > 3 ? 0.15 + 0.2 * Math.abs(Math.sin(t * 9)) : 0.2, brow: 0.5, smile: -0.15, gaze: -0.4 }, onHand: (h, u) => glass(h, u) },
  ];
  if (dz < 6.3) actors.push({ ch: 'dima19', X: dX, Z: dz, hgt: 1.78, face: lt < 0.9 ? 1 : -1, pose: { walk: dWalk > 0 && dWalk < 1 ? lt * 7 : null, aR: lt < 0.9 ? [1.4 + Math.sin(lt * 14) * 0.25, 0.6] : [0.1, 0.3] }, ex: { eye: 0.55, brow: -0.3, smile: -0.25, mouth: 0 }, L: WARM });
  actors.push({ ch: 'dima', X: -0.42, Z: Math.max(cam.z + 0.9, 2.1), hgt: 1.82, face: 1, ghost: 0.5, blur: 4, L: Lmix(WARM, COLD, 0.4), pose: { aR: [0.05, 0.2] }, ex: { eye: 0.9, smile: -0.1, gaze: 0.4 } });
  hall(F, t, { cam, actors, roomDoor: door, steam: 0.5, envBlur: 1.2 });
}, GW, 0.2);
// 10. "Да." — adult Dima CU nod, muffling lifts
shot(42.2, 44.0, (F, t) => {
  const lt = t - 42.2;
  const cam = { x: -0.05, y: -0.45, z: lerp(0.65, 0.85, lt / 1.8) };
  const nod = Math.sin(seg(lt, 0.1, 0.7) * Math.PI) * 0.1;
  hall(F, t, { cam, envBlur: 7, roomDoor: 1, actors: [
    { ch: 'mom45', X: 0.2, Z: 5.1, hgt: 1.65, face: -1, blur: 6, L: flipL(WARM, -1), pose: { aL: [0.7, 0.9], aR: [0.9, 1.4] }, ex: { eye: 0.7, brow: 0.6, smile: -0.2 }, onHand: (h, u) => glass(h, u) },
    { ch: 'dima', X: -0.18, Z: 1.75, hgt: 1.82, face: 1, ghost: 0.6, L: Lmix(WARM, COLD, 0.4), pose: { headTilt: nod + 0.05 }, ex: { eye: 0.75, brow: 0.6, smile: -0.25, mouth: talk('dima', t) * 0.5, gaze: 0.5 } }] });
}, GW, 0.15);
// 11. Mama close-up at the closed door
shot(44.0, 51.6, (F, t) => {
  const lt = t - 44;
  const cam = kf([[0, { x: 0, y: 0, z: 1.0 }], [7.6, { x: 30, y: 40, z: 1.18 }]], lt, x => x);
  F.layer(c => { applyCam(c, cam, 0.5); doorCloseBg(c, t); }, 4);
  F.layer(c => { applyCam(c, cam, 1); const handK = easeIO(seg(lt, 1.0, 2.4)) * (1 - easeIO(seg(lt, 6.6, 7.4)));
    person(c, CH.mom45, { x: 430, y: 2950, h: 2500, face: 1, L: { ...WARM, rimX: 1, rimI: 1.0 }, pose: { aR: [lerp(0.2, 1.3, handK), lerp(0.3, 1.0, handK)], aL: [0.15, 0.3], headTilt: 0.06 + Math.sin(t * 0.7) * 0.015 }, ex: { eye: Math.min(blink(t, 4), lt > 6.2 ? 0.55 : 0.85), brow: 0.65, smile: lt > 4.2 && lt < 6 ? 0.25 : -0.05, mouth: talk('mama', t) * 0.8, gaze: 0.6 } }); }, 0);
  // steam & dust in lamp light
  F.layer(c => { applyCam(c, cam, 1.2); dust(c, t, 21, 50, [0, 0, VW, 1400], hex('#ffd9a0'), 0.7, 4); glow(c, 160, 120, 600, hex('#ffcf8a'), 0.5); }, 2);
  // adult Dima covering mouth in fg (late)
  const gk = seg(lt, 4.6, 5.4) * (1 - seg(lt, 7.2, 7.6));
  if (gk > 0) ghost(F, F.ctx, c => { applyCam(c, cam, 1.6); person(c, CH.dima, { x: -60, y: 3300, h: 3000, face: 1, L: Lmix(WARM, COLD, 0.4), pose: { aR: [1.0, 2.15], headTilt: 0.1 }, ex: { eye: 0.6, brow: 0.8, smile: -0.4 } }); }, 0.42 * gk, 10);
}, { ...GW, tintA: 0.26 }, 0.25);
// 12. Plate of soup + note on the floor, mom leaves, light stays on
shot(51.6, 53.7, (F, t) => {
  const lt = t - 51.6;
  const cam = { x: 0.0, y: -1.15, z: lerp(2.9, 3.15, lt / 2.1), eye: 1.55 };
  const set = easeOut(seg(lt, 0, 0.8));
  hall(F, t, { cam, roomDoor: 1, envBlur: 2, actors: [{ ch: 'mom45', X: 0.15, Z: lerp(4.7, 4.5, seg(lt, 0.9, 2.1)), hgt: 1.65, face: lt > 0.9 ? 1 : -1, L: flipL(WARM, -1), pose: { lean: lerp(0.55, 0, easeIO(seg(lt, 0.5, 1.1))), walk: lt > 1.1 ? lt * 6 : null }, ex: { eye: 0.7, brow: 0.6 } }] });
  F.layer(c => { const cm = E.cam3(cam); const p = cm.p(-0.05, 0, 5.25), s = cm.s(5.25); const y = p[1] - (1 - set) * s * 0.4;
    c.fillStyle = 'rgba(0,0,0,0.35)'; c.beginPath(); c.ellipse(p[0], p[1] + s * 0.02, s * 0.2, s * 0.05, 0, 0, 6.283); c.fill();
    c.fillStyle = '#f2ece0'; c.beginPath(); c.ellipse(p[0], y, s * 0.17, s * 0.05, 0, 0, 6.283); c.fill(); c.fillStyle = '#d8902a'; c.beginPath(); c.ellipse(p[0], y - s * 0.005, s * 0.12, s * 0.032, 0, 0, 6.283); c.fill();
    for (let i = 0; i < 3; i++) { const ph = (t * 0.6 + i / 3) % 1; c.fillStyle = `rgba(255,240,220,${0.25 * (1 - ph)})`; c.beginPath(); c.arc(p[0] + Math.sin(t * 2 + i) * s * 0.03, y - s * 0.05 - ph * s * 0.3, s * (0.03 + ph * 0.05), 0, 6.283); c.fill(); }
    c.save(); c.translate(p[0] + s * 0.24, y + s * 0.01); c.rotate(-0.25); c.fillStyle = '#fff8e6'; c.fillRect(-s * 0.06, -s * 0.03, s * 0.12, s * 0.07); c.strokeStyle = 'rgba(80,60,40,0.5)'; c.lineWidth = 1.5; for (let k = 0; k < 3; k++) { c.beginPath(); c.moveTo(-s * 0.045, -s * 0.012 + k * s * 0.018); c.lineTo(s * 0.04, -s * 0.012 + k * s * 0.018); c.stroke(); } c.restore();
  }, 0);
}, GW, 0.2);
// 13. Earbud ECU -> adult Dima trembling chin
shot(53.7, 55.45, (F, t) => {
  const lt = t - 53.7, k = easeIO(seg(lt, 0.55, 1.2));
  if (k < 1) F.layer(c => { const z = lerp(1.0, 0.82, lt / 1.2); c.translate(540, 900); c.scale(z, z); c.translate(-540, -900); c.fillStyle = lg(c, 0, 0, 0, VH, [[0, '#3a2414'], [1, '#140a05']]); c.fillRect(-500, -500, VW + 1000, VH + 1000); glow(c, 900, 300, 900, hex('#ffc27a'), 0.4);
    person(c, CH.dima19, { x: 1150, y: 900 + 6400 * 0.93, h: 6400, face: 1, L: { ...WARM, rimI: 1.2 }, ex: { eye: 0.6 } }); }, 0, 1 - k);
  if (k > 0) F.layer(c => { c.fillStyle = lg(c, 0, 0, 0, VH, [[0, '#0a2030'], [1, '#04101a']]); c.fillRect(0, 0, VW, VH); glow(c, 900, 400, 900, hex('#9fd6ff'), 0.25); glow(c, 100, 300, 700, hex('#ffc27a'), 0.25);
    const z = lerp(1.08, 1.0, lt / 1.75); c.translate(540, 900); c.scale(z, z); c.translate(-540, -900);
    person(c, CH.dima, { x: 380, y: 900 + 3200 * 0.85, h: 3200, face: 1, L: Lmix(COLD, WARM, 0.35), pose: { headTilt: 0.05 }, ex: { eye: 0.65, brow: 0.85, smile: -0.35, tremble: Math.sin(t * 38) * 2.5, gaze: 0.2 } }); }, 0, k);
}, { tint: hex('#8a6a4a'), tintA: 0.2, bloom: 0.5 }, 0.2);
// 14a. Street tracking: bus, Dima-19 walks home, dad follows far behind
shot(55.45, 63.15, (F, t) => {
  const lt = t - 55.45;
  const busX = lt < 1.6 ? lerp(-30, 0, easeOut(lt / 1.6)) : lt < 3.2 ? 0 : lerp(0, 40, easeIn(seg(lt, 3.2, 5.5)));
  const door = seg(lt, 1.6, 1.9) * (1 - seg(lt, 2.8, 3.1));
  const walkD = lt > 2.3 && lt < 6.1;
  const dX = 0.2 + clamp(lt - 2.3, 0, 3.8) * 1.2;
  const turn = lt > 3.7 && lt < 4.4;               // Dima glances back on "Папа."
  const dadHidden = lt > 3.8 && lt < 4.75;
  const dadWalkT = lt < 2.7 ? 0 : lt < 3.8 ? lt - 2.7 : lt < 4.75 ? 1.1 : Math.min(lt - 3.65, 2.35);
  let dadX = -4.4 + dadWalkT * 1.2; if (lt > 6.9) dadX -= (lt - 6.9) * 0.9;
  const dadWalking = !dadHidden && lt > 2.7 && (lt < 6.0 || lt > 6.9);
  const camX = lt < 2.3 ? -0.9 : lerp(-0.9, 0.5 * (Math.min(dX, 6.0) + dadX) + 0.4, easeIO(seg(lt, 2.3, 3.3)));
  const cam = { x: camX, y: -0.1, z: 0.0, vpy: 980, eye: 1.6, f: 850 };
  const winLit = easeOut(seg(lt, 6.6, 6.9));
  const inK = seg(lt, 6.05, 6.5);
  const actors = [];
  if (inK < 1) actors.push({ ch: 'dima19', X: dX, Z: 6.0 + inK * 2.4, hgt: 1.78, face: turn ? -1 : 1, pose: { walk: walkD ? lt * 6.5 : null }, ex: { eye: 0.7, gaze: 0.2 } });
  actors.push({ ch: 'dad48', X: dadHidden ? -3.1 : dadX, Z: dadHidden ? 5.45 : 5.9, hgt: 1.78, face: lt > 6.9 ? -1 : 1, L: { ...WARM, ki: 0.6 }, pose: { walk: dadWalking ? lt * 5.5 : null, lean: 0.05, aR: [0.05, 0.6], aL: [0.05, 0.6] }, ex: { eye: 1, brow: 0.4, gaze: 0.2, smile: lt > 6.7 ? 0.2 : 0 } });
  streetScene(F, t, { cam, busX, door, stopX: -1, entranceX: 6.9, winLit, postX: -2.85, actors });
}, { ...GW, tintA: 0.22 }, 0.2);
// 14b. Adult Dima at the curb in the rain, whisper
shot(63.15, 64.75, (F, t) => {
  const lt = t - 63.15;
  const cam = { x: 4.5, y: -0.6, z: lerp(2.2, 2.45, lt / 1.6), vpy: 860, eye: 1.6, f: 900 };
  streetScene(F, t, { cam, entranceX: 6.6, winLit: 1, envBlur: 6, actors: [{ ch: 'dima', X: 4.2, Z: 4.4, hgt: 1.82, face: 1, ghost: 0.7, L: Lmix(WARM, COLD, 0.45), pose: { headTilt: 0.15, aR: [0.05, 0.2] }, ex: { eye: 0.55, brow: 0.8, smile: -0.3, mouth: talk('dima', t) * 0.4, gaze: 0.6 } }] });
}, { ...GW, tintA: 0.18 }, 0.15);
// 15. Office (present)
shot(64.75, 66.3, (F, t) => {
  const lt = t - 64.75;
  const cam = kf([[0, { x: -60, y: 0, z: 1.05 }], [1.55, { x: 40, y: -20, z: 1.15 }]], lt, x => x);
  F.layer(c => { applyCam(c, cam, 0.4); E.office(c, t); }, 4);
  F.layer(c => { applyCam(c, cam, 1); c.fillStyle = '#0a141c'; c.fillRect(-200, 1330, VW + 400, 60); laptop(c, 640, 1330, 1);
    person(c, CH.dima, { x: 330, y: 1330 + 3.8 * 1000 / 7.5, h: 1000, face: 1, L: { ...COLD, key: hex('#bfe9ff'), ki: 1.3 }, pose: { sit: true, lean: 0.25, aR: [1.2, 0.3], aL: [1.1, 0.35], headTilt: 0.15 }, ex: { eye: 0.7, brow: 0.3, gaze: 0.6 } }); }, 0);
  F.layer(c => { applyCam(c, cam, 1.6); for (let i = 0; i < 2; i++) { c.fillStyle = 'rgba(4,10,16,0.92)'; c.beginPath(); c.ellipse(900 + i * 120, 1700, 150, 420, 0, 0, 6.283); c.fill(); } }, 16);
}, GC, 0.12);
// 16. Phone notification "Перевод отправлен"
shot(66.3, 68.0, (F, t) => {
  const lt = t - 66.3;
  const cam = kf([[0, { x: 0, y: 40, z: 1.0 }], [1.7, { x: 0, y: 0, z: 1.08 }]], lt, x => x);
  F.layer(c => { applyCam(c, cam, 0.4); E.office(c, t); }, 14);
  F.layer(c => { applyCam(c, cam, 1); E.phone(c, 540, 860, 440, -0.05, (s, w, h) => phoneUI(s, w, h, { notif: easeOut(seg(lt, 0.15, 0.45)), t })); glow(c, 540, 860, 600, hex('#7fd3ff'), 0.12); }, 0);
}, GC, 0.1);
// 17. Chat with mom, finger taps heart
shot(68.0, 71.45, (F, t) => {
  const lt = t - 68.0;
  const cam = kf([[0, { x: 0, y: 0, z: 1.05 }], [3.45, { x: 40, y: 60, z: 1.35 }]], lt);
  F.layer(c => { applyCam(c, cam, 0.4); E.office(c, t); }, 16);
  const tap = seg(lt, 3.05, 3.2);
  F.layer(c => { applyCam(c, cam, 1); E.phone(c, 540, 860, 440, 0.02, (s, w, h) => phoneUI(s, w, h, { chat: easeOut(seg(lt, 0.0, 0.4)), msg: easeOut(seg(lt, 0.4, 0.8)), heart: tap, t }));
    // finger approaching
    const fy = lerp(1700, 980, easeIO(seg(lt, 1.6, 3.05))) + (lt > 3.2 ? (lt - 3.2) * 400 : 0);
    c.fillStyle = lg(c, 600, fy, 720, fy, [[0, '#d9a688'], [1, '#b98066']]); c.beginPath(); c.roundRect(620, fy, 110, 900, 55); c.fill(); c.fillStyle = 'rgba(255,235,220,0.5)'; c.beginPath(); c.ellipse(675, fy + 40, 34, 24, 0, 0, 6.283); c.fill(); }, 0);
}, GC, 0.1);
// 18. Heart ECU: trembles and dims (music peak)
shot(71.45, 72.45, (F, t) => {
  const lt = t - 71.45;
  F.layer(c => { c.fillStyle = rg(c, 540, 820, 50, 1300, [[0, '#0c1824'], [1, '#020407']]); c.fillRect(0, 0, VW, VH); const Rn = C.rng(4); c.globalCompositeOperation = 'lighter'; for (let i = 0; i < 22; i++) { const x = Rn() * VW, y = Rn() * VH * 0.8, r = 30 + Rn() * 70; c.fillStyle = rg(c, x, y, 0, r, [[0, 'rgba(110,190,240,0.10)'], [0.7, 'rgba(110,190,240,0.05)'], [1, 'rgba(0,0,0,0)']]); c.fillRect(x - r, y - r, 2 * r, 2 * r); } }, 0);
  F.layer(c => { const z = lerp(1, 1.12, lt); c.translate(540, 820); c.scale(z, z); const tr = Math.sin(t * 60) * 6 * (1 - lt), dimK = easeIn(seg(lt, 0.25, 1.0));
    glow(c, 0, 0, 520, hex('#ff4a6a'), 0.6 * (1 - dimK * 0.8)); c.translate(tr, 0); heartPath(c, 260); c.fillStyle = rgba(mix(hex('#ff3b5c'), hex('#5a2a33'), dimK)); c.fill();
    c.globalCompositeOperation = 'screen'; c.fillStyle = rg(c, -80, -90, 0, 200, [[0, `rgba(255,220,230,${0.5 * (1 - dimK)})`], [1, 'rgba(0,0,0,0)']]); heartPath(c, 260); c.fill(); }, 0);
}, { tint: hex('#2a4a6a'), tintA: 0.2, bloom: 0.7 }, 0.05);
// 19. Dad (66) now — same stop, nobody gets off
shot(72.45, 76.95, (F, t) => {
  const lt = t - 72.45;
  const busX = lt < 1.3 ? lerp(-30, 0, easeOut(lt / 1.3)) : lt < 2.8 ? 0 : lerp(0, 40, easeIn(seg(lt, 2.8, 4.5)));
  const door = seg(lt, 1.3, 1.6) * (1 - seg(lt, 2.4, 2.7));
  const cam = { x: lerp(0.2, 0.9, easeIO(lt / 4.5)), y: -0.1, z: 0.3, vpy: 980, eye: 1.6, f: 1000 };
  const walk = lt > 3.2;
  streetScene(F, t, { cam, busX, door, stopX: 0, warm: 0.55, empty: 1, actors: [{ ch: 'dad66', X: walk ? 1.2 - (lt - 3.2) * 0.8 : 1.2, Z: 5.9, hgt: 1.74, face: walk ? -1 : -1, L: Lmix(WARM, COLD, 0.35), pose: { walk: walk ? lt * 4.5 : null, aR: [0.05, 0.3], aL: [0.05, 0.3] }, ex: { eye: 0.8, brow: 0.5, gaze: lt < 2.8 ? -0.6 : 0.2 } }] });
}, { tint: hex('#9a7a5a'), tintA: 0.22, bloom: 0.5 }, 0.12);
// 20. Hallway now, mom (63) at night, light stays on
shot(76.95, 79.35, (F, t) => {
  const lt = t - 76.95;
  const cam = { x: lerp(0.15, 0.05, lt / 2.4), y: -0.1, z: lerp(0.3, 0.75, easeIO(lt / 2.4)) };
  const reach = Math.sin(seg(lt, 0.5, 1.9) * Math.PI);
  hall(F, t, { cam, old: 1, kitchen: 0.15, roomDoor: 1, envBlur: 1.2, actors: [{ ch: 'mom63', X: 0.38, Z: 2.05, hgt: 1.6, face: 1, L: { ...WARM, rimX: -1, kx: 1 }, pose: { aR: [lerp(0.2, 1.3, reach), lerp(0.3, 1.0, reach)], headTilt: -0.08 }, ex: { eye: blink(t, 6) * 0.8, brow: 0.55, smile: lerp(0, 0.15, seg(lt, 1.4, 2.0)), gaze: -0.2 } }] });
}, { tint: hex('#c08040'), tintA: 0.22, bloom: 0.55 }, 0.2);
// 21. Station: Dima, phone, finger over "Папа"
shot(79.35, 82.3, (F, t) => {
  const lt = t - 79.35;
  const cam = kf([[0, { x: -335, y: 100, z: 2.0 }], [2.95, { x: -325, y: 80, z: 2.2 }]], lt, x => x);
  station(F, t, { cam, noPillar: true, blurFar: 7, blurMid: 7, dima: { tilt: 0.28, eye: 0.55, brow: 0.8, smile: -0.25, gaze: 0.7, pose: { sit: true, lean: 0.25, aR: [1.0, 1.2], aL: [0.8, 1.0], headTilt: 0.28 } }, keeper: { watchGlow: 0.6 } });
  const pk = easeOut(seg(lt, 0.9, 1.5));
  if (pk > 0) F.layer(c => { applyCam(c, cam, 1.25); E.phone(c, 470, lerp(1500, 1260, pk), 170, -0.35, (s, w, h) => phoneUI(s, w, h, { contact: 1, hover: seg(lt, 1.8, 2.6), t })); glow(c, 470, 1200, 300, hex('#bfe9ff'), 0.25 * pk); }, 0);
}, GC, 0.2);
// 22. Dad at the stop: phone lights up "Дима", he answers, face breaks
shot(82.3, 83.65, (F, t) => {
  const lt = t - 82.3;
  const cam = { x: 1.25, y: -0.35, z: lerp(3.6, 3.85, lt / 1.35), vpy: 880, eye: 1.6, f: 900 };
  streetScene(F, t, { cam, stopX: 0, warm: 0.7, envBlur: 7, actors: [{ ch: 'dad66', X: 1.2, Z: 5.9, hgt: 1.74, face: 1, L: Lmix(WARM, COLD, 0.2), pose: { aR: [lerp(0.6, 1.25, easeOut(seg(lt, 0.1, 0.5))), lerp(1.7, 2.35, easeOut(seg(lt, 0.1, 0.5)))], headTilt: 0.08 }, ex: { eye: lerp(1, 0.4, seg(lt, 0.5, 1.0)), brow: 0.9, smile: lerp(0, -0.4, seg(lt, 0.5, 1.0)), tremble: Math.sin(t * 40) * 1.5, gaze: 0.3 }, onHand: (h, u) => { h.save(); h.fillStyle = '#0b0c0e'; h.fillRect(-u * 0.12, -u * 0.1, u * 0.24, u * 0.45); h.fillStyle = 'rgba(190,235,255,0.95)'; h.fillRect(-u * 0.1, -u * 0.08, u * 0.2, u * 0.4); h.restore(); glow(h, 0, u * 0.1, u * 1.4, hex('#bfe9ff'), 0.6); } }] });
}, { tint: hex('#b08050'), tintA: 0.2, bloom: 0.55 }, 0.12);
// 23. Station floods warm, Dima stands with phone at ear
shot(83.65, 84.85, (F, t) => {
  const lt = t - 83.65; const w = easeIO(seg(lt, 0, 1.2));
  const cam = { x: -120, y: 0, z: lerp(1.25, 1.3, lt) };
  station(F, t, { cam, noPillar: true, warm: 0.35 + w * 0.5, blurFar: 4, blurNear: 0.5, dima: { x: 230, y: 1600, pose: { aR: [0.55, 2.4], aL: [0.05, 0.3], headTilt: 0.12 }, eye: 0.6, brow: 0.6, smile: 0.1, gaze: 0.4 }, keeper: { watchGlow: 1.2, smile: 0.4 } });
}, { tint: hex('#c88a3a'), tintA: 0.25, bloom: 0.6 }, 0.15);
// 24. Final: keeper turns to camera, train arrives, warm; fade to black at end
shot(84.85, 89.0, (F, t) => {
  const lt = t - 84.85;
  const cam = kf([[0, { x: 0, y: 0, z: 1.0 }], [4.15, { x: 0, y: 30, z: 1.12 }]], lt, x => x);
  F.layer(c => { applyCam(c, cam, 0.35); E.stationWall(c, t, { warm: 1, train: seg(lt, 0.5, 3.8) }); E.stationClock(c, 540, 470, 150, 23, 54, { warm: 1 }); }, 7);
  F.layer(c => { applyCam(c, cam, 0.6); for (const x of [180, 900]) E.pendantLamp(c, x, 200, 1200, 1, 1); dust(c, t, 5, 90, [0, 100, VW, 1500], hex('#ffd9a0'), 0.7, 4); }, 5);
  const turn = easeIO(seg(lt, 0.1, 0.9));
  F.layer(c => { applyCam(c, cam, 1); const front = turn > 0.5; person(c, CH.keeper, { x: 560, y: 3950, h: 3600, front, face: -1, L: { ...WARM, rimI: 1.1, rimX: 1 }, noWatch: false, pose: { aL: [0.1, 0.2], aR: [0.1, 0.2], headTilt: front ? 0.02 : 0.05 }, ex: { eye: blink(t, 7) * 0.9, smile: 0.32, brow: 0.2, mouth: talk('keeper', t) * 0.7, gaze: front ? 0 : 0.4 } }); }, 0);
  F.layer(c => { applyCam(c, cam, 1.4); E.pocketWatch(c, 860, 1700, 70, 1, t, 1.2 - seg(lt, 2.5, 4) * 0.6); }, 3);
}, { tint: hex('#d8902a'), tintA: 0.32, bloom: 0.6, vig: 30 }, 0.2);

// ---------- small props ----------
function glass(h, u) { h.save(); h.fillStyle = 'rgba(220,240,255,0.55)'; h.beginPath(); h.moveTo(-u * 0.1, -u * 0.15); h.lineTo(u * 0.12, -u * 0.15); h.lineTo(u * 0.09, u * 0.25); h.lineTo(-u * 0.07, u * 0.25); h.closePath(); h.fill(); h.fillStyle = 'rgba(190,225,255,0.5)'; h.fillRect(-u * 0.07, 0, u * 0.16, u * 0.24); h.restore(); }
function laptop(c, x, y, s) { c.save(); c.translate(x, y); c.scale(s, s); c.fillStyle = '#1a1f24'; c.beginPath(); c.moveTo(-170, 0); c.lineTo(170, 0); c.lineTo(150, -230); c.lineTo(-150, -230); c.closePath(); c.fill(); c.fillStyle = 'rgba(150,215,255,0.9)'; c.beginPath(); c.moveTo(-158, -12); c.lineTo(158, -12); c.lineTo(140, -218); c.lineTo(-140, -218); c.closePath(); c.fill();
  c.fillStyle = 'rgba(20,60,90,0.6)'; for (let i = 0; i < 6; i++) c.fillRect(-120, -190 + i * 28, 140 + (i * 37) % 90, 12); c.fillStyle = '#2a3036'; c.fillRect(-200, 0, 400, 14); c.restore(); glow(c, x, y - 120, 420, hex('#9fd6ff'), 0.35); }
function heartPath(c, s) { c.beginPath(); c.moveTo(0, s * 0.35); c.bezierCurveTo(-s * 0.9, -s * 0.25, -s * 0.45, -s * 0.95, 0, -s * 0.45); c.bezierCurveTo(s * 0.45, -s * 0.95, s * 0.9, -s * 0.25, 0, s * 0.35); c.closePath(); }
function portal(c, x, y, r, t, k) {
  c.save(); c.globalAlpha = k;
  glow(c, x, y, r * 1.8, ICE, 0.45);
  c.save(); c.beginPath(); c.arc(x, y, r, 0, 6.283); c.clip();
  c.fillStyle = lg(c, 0, y - r, 0, y + r, [[0, '#0b2c44'], [1, '#2a6a8a']]); c.fillRect(x - r, y - r, 2 * r, 2 * r);
  // glass office tower miniature
  for (let i = 0; i < 3; i++) { const bx = x - r * 0.6 + i * r * 0.45, bh = r * (0.9 + i * 0.25 - (i === 2 ? 0.5 : 0)), bw = r * 0.38; c.fillStyle = lg(c, bx, 0, bx + bw, 0, [[0, 'rgba(120,200,240,0.9)'], [1, 'rgba(30,80,120,0.9)']]); c.fillRect(bx, y + r * 0.6 - bh, bw, bh); c.fillStyle = 'rgba(220,245,255,0.6)'; for (let yy = y + r * 0.6 - bh + 10; yy < y + r * 0.55; yy += 18) c.fillRect(bx + 6, yy, bw - 12, 4); }
  c.restore();
  c.strokeStyle = rgba(ICE, 0.95); c.lineWidth = 8; c.beginPath(); c.arc(x, y, r, 0, 6.283); c.stroke();
  for (let i = 0; i < 12; i++) { const a = i / 12 * 6.283 + t * 0.2; c.lineWidth = 6; c.beginPath(); c.moveTo(x + Math.cos(a) * r * 1.05, y + Math.sin(a) * r * 1.05); c.lineTo(x + Math.cos(a) * r * 1.14, y + Math.sin(a) * r * 1.14); c.stroke(); }
  c.font = '900 44px Inter'; c.textAlign = 'center'; c.fillStyle = '#e8f8ff'; c.fillText('КОМПАНИЯ', x, y + r + 70);
  c.restore();
}
function flap(c, x, y, t, lt, k) {
  c.save(); c.globalAlpha = k; c.translate(x, y); const sc = 0.9 + 0.1 * k; c.scale(sc, sc);
  const cards = ['П', 'Т', ' ', '2', '3', ':', '4', '7'];
  const w = 96, h = 150, gap = 10, tw = cards.length * (w + gap);
  glow(c, 0, 0, 520, ICE, 0.18);
  cards.forEach((ch, i) => { if (ch === ' ') return; const cx = -tw / 2 + i * (w + gap) + w / 2; const settle = clamp((lt - i * 0.12) / 0.5);
    c.fillStyle = '#0a0f13'; c.beginPath(); c.roundRect(cx - w / 2, -h / 2, w, h, 10); c.fill(); c.fillStyle = 'rgba(0,0,0,0.6)'; c.fillRect(cx - w / 2, -2, w, 4);
    const show = settle >= 1 ? ch : (ch === ':' ? ':' : '0123456789ПТСЧ'[Math.floor(t * 30 + i * 3) % 14]);
    c.font = '900 110px Inter'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillStyle = '#eaf6ff'; c.fillText(show, cx, 6); });
  c.restore();
}
function phoneUI(s, w, h, o) {
  s.fillStyle = lg(s, 0, 0, 0, h, [[0, '#0f1820'], [1, '#081016']]); s.fillRect(0, 0, w, h);
  s.textBaseline = 'middle';
  if (o.notif != null) {
    s.fillStyle = 'rgba(255,255,255,0.06)'; for (let i = 0; i < 6; i++) s.fillRect(w * 0.08, h * (0.25 + i * 0.1), w * 0.84, h * 0.07);
    const y = lerp(-h * 0.12, h * 0.06, o.notif);
    s.fillStyle = 'rgba(235,245,250,0.95)'; s.beginPath(); s.roundRect(w * 0.05, y, w * 0.9, h * 0.11, 24); s.fill();
    s.fillStyle = '#1aa860'; s.beginPath(); s.arc(w * 0.15, y + h * 0.055, w * 0.055, 0, 6.283); s.fill(); s.strokeStyle = '#fff'; s.lineWidth = 6; s.beginPath(); s.moveTo(w * 0.125, y + h * 0.055); s.lineTo(w * 0.145, y + h * 0.072); s.lineTo(w * 0.18, y + h * 0.04); s.stroke();
    s.fillStyle = '#102028'; s.font = `900 ${w * 0.068}px Inter`; s.fillText('Перевод отправлен', w * 0.25, y + h * 0.055);
  }
  if (o.chat != null) {
    s.fillStyle = '#16232c'; s.fillRect(0, 0, w, h * 0.1); s.fillStyle = '#c88a6a'; s.beginPath(); s.arc(w * 0.14, h * 0.05, w * 0.06, 0, 6.283); s.fill();
    s.fillStyle = '#eaf4fa'; s.font = `900 ${w * 0.07}px Inter`; s.fillText('Мама', w * 0.25, h * 0.05);
    const m = o.msg || 0; s.globalAlpha = m;
    const by = h * 0.5 + (1 - m) * 30; s.fillStyle = '#2a3a46'; s.beginPath(); s.roundRect(w * 0.06, by, w * 0.8, h * 0.09, 30); s.fill();
    s.fillStyle = '#f2f8fb'; s.font = `800 ${w * 0.058}px Inter`; s.fillText('Приезжай, мы скучаем', w * 0.11, by + h * 0.045);
    s.globalAlpha = 1;
    if (o.heart > 0) { const hk = easeOut(o.heart); s.save(); s.translate(w * 0.8, by + h * 0.1); s.scale(hk * 1.2, hk * 1.2); s.fillStyle = '#16232c'; s.beginPath(); s.arc(0, 0, w * 0.07, 0, 6.283); s.fill(); heartPath(s, w * 0.08); s.fillStyle = '#ff3b5c'; s.fill(); s.restore(); }
  }
  if (o.contact) {
    s.fillStyle = '#eaf4fa'; s.font = `900 ${w * 0.12}px Inter`; s.textAlign = 'center';
    s.fillStyle = '#c8a070'; s.beginPath(); s.arc(w / 2, h * 0.3, w * 0.18, 0, 6.283); s.fill();
    s.fillStyle = '#eaf4fa'; s.fillText('Папа', w / 2, h * 0.5);
    const hv = o.hover || 0; s.fillStyle = rgba(hex('#1aa860'), 0.6 + 0.4 * hv); s.beginPath(); s.arc(w / 2, h * 0.78, w * (0.12 + 0.02 * Math.sin(o.t * 8) * hv), 0, 6.283); s.fill();
    s.textAlign = 'left';
  }
}
function doorCloseBg(c, t) {
  c.fillStyle = lg(c, 0, 0, VW, 0, [[0, '#6a4228'], [0.6, '#3a2414'], [1, '#1e120a']]); c.fillRect(-400, -400, VW + 800, VH + 800);
  // closed door slab on the right with panels
  const dx = 640; c.fillStyle = lg(c, dx, 0, VW + 200, 0, [[0, '#e6d6b8'], [1, '#9a8668']]); c.fillRect(dx, -400, 700, 2600);
  c.strokeStyle = 'rgba(90,70,50,0.45)'; c.lineWidth = 6; c.strokeRect(dx + 80, 100, 360, 700); c.strokeRect(dx + 80, 900, 360, 800);
  c.fillStyle = 'rgba(60,40,25,0.8)'; c.fillRect(dx - 30, -400, 40, 2600);
  glow(c, 200, 150, 700, hex('#ffcf8a'), 0.55);
}
module.exports = { S };
