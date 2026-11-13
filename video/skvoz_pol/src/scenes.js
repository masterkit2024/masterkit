// ===== Scenes part 1: opening -> trollface -> fall through the building =====
const SCENES = [];
const sc = (a, b, draw, o = {}) => SCENES.push({ a, b, draw, ...o });
let TF = null; // trollface frames

// ---------- S1 Bedroom: wake up + first wall ----------
function drawBedroom(ctx, t) {
  // background wall + far side bathroom
  wallpaper(ctx, -400, -200, 1170, 1550, '#ffcf7a', '#ffc35c', 90);
  ctx.fillStyle = '#bfefff'; ctx.fillRect(770, -200, 900, 1550);
  ctx.strokeStyle = '#95d9f0'; ctx.lineWidth = 4; for (let x = 770; x < 1670; x += 80) { line(ctx, x, -200, x, 1350, 4, '#95d9f0'); } for (let y = -200; y < 1350; y += 80) line(ctx, 770, y, 1670, y, 4, '#95d9f0');
  // bathtub on far side
  rr(ctx, 900, 1130, 420, 220, 60); fillStroke(ctx, '#fff', 7); ell(ctx, 1110, 1150, 190, 22, '#9fe7ff', 5);
  windowFrame(ctx, 120, 480, 300, 330, ['#ffb36b', '#ffe7a8'], t);
  // poster
  ctx.save(); ctx.translate(560, 560); ctx.rotate(.04); rr(ctx, -80, -110, 160, 220, 8); fillStroke(ctx, '#5b6cff', 6); text(ctx, 'ФИЗИКА\n?', 0, 0, { size: 34, sw: 6 }); ctx.restore();
  floorBoards(ctx, -400, 1350, 2100, 500);
  // bed
  rr(ctx, -120, 1150, 600, 120, 30); fillStroke(ctx, '#6b4bff', 7);
  rr(ctx, -150, 1000, 60, 300, 20); fillStroke(ctx, '#6b4bff', 7);
  line(ctx, -80, 1270, -80, 1350, 16, OUT); line(ctx, 440, 1270, 440, 1350, 16, OUT);
  // nightstand + alarm
  rr(ctx, 520, 1200, 140, 150, 12); fillStroke(ctx, '#c8834a', 6);
  const ring = t < .95 ? 1 : 0; const sh = ring * Math.sin(t * 70) * .12;
  ctx.save(); ctx.translate(590, 1160); ctx.rotate(sh); circle(ctx, 0, 0, 40, '#ff3b3b', 6); circle(ctx, 0, 0, 28, '#fff', 4);
  line(ctx, 0, 0, 0, -18, 5, OUT); line(ctx, 0, 0, 12, 6, 5, OUT); circle(ctx, -30, -38, 14, '#ffe14d', 5); circle(ctx, 30, -38, 14, '#ffe14d', 5); ctx.restore();
  if (ring) { for (let i = 0; i < 3; i++) { const k = ((t * 3 + i / 3) % 1); ctx.save(); ctx.globalAlpha = 1 - k; ctx.beginPath(); ctx.arc(590, 1160, 60 + k * 70, -2.4, -.7); ctx.lineWidth = 6; ctx.strokeStyle = OUT; ctx.stroke(); ctx.restore(); } }
}
function drawWallSlab(ctx, x, y0, y1, w, col = '#e9a94a', alpha = 1) {
  ctx.save(); ctx.globalAlpha *= alpha; ctx.fillStyle = col; ctx.fillRect(x, y0, w, y1 - y0);
  ctx.fillStyle = 'rgba(0,0,0,.08)'; for (let i = 0; i < 14; i++) ctx.fillRect(x + 6, y0 + i * (y1 - y0) / 14 + 20, w - 12, 8);
  ctx.restore(); line(ctx, x, y0, x, y1, 7, OUT, 'butt'); line(ctx, x + w, y0, x + w, y1, 7, OUT, 'butt');
}
sc(0, 4.22, (ctx, t) => {
  // camera
  const cx = track([[0, 250], [.9, 270], [1.5, 470], [2.6, 640], [3.6, 760], [4.3, 800]], t);
  const cy = track([[0, 1130], [.9, 1120], [1.5, 1110], [4.3, 1100]], t);
  const z = track([[0, 1.75], [.9, 1.6], [1.5, 1.3], [2.6, 1.38], [3.5, 1.48], [4.3, 1.52]], t);
  const s = shake(t, t < .95 ? 6 : 1.5);
  ctx.save(); cam(ctx, cx + s.x, cy + s.y, z, s.r);
  drawBedroom(ctx, t);
  // hero
  if (t < .96) {
    ctx.save(); ctx.translate(520, 1125); ctx.rotate(-Math.PI / 2);
    person(ctx, { x: 0, y: 0, s: .95, emo: 'closed', legs: [0, 0, 0, 0], arms: [.1, 0, -.1, 0], bob: Math.sin(t * 4) * 3 });
    ctx.restore();
    rr(ctx, 50, 1095, 120, 50, 22); fillStroke(ctx, '#fff', 6); rr(ctx, 270, 1080, 330, 90, 30); fillStroke(ctx, '#ff4fa3', 7); // pillow+blanket
    text(ctx, 'z', 60 + Math.sin(t * 3) * 10, 950 - t * 60, { size: 60, alpha: .8 }); text(ctx, 'Z', 110, 880 - t * 50, { size: 80, alpha: .7 });
  } else {
    rr(ctx, -40, 1080, 450, 90, 30); fillStroke(ctx, '#ff4fa3', 7);
    // jump from bed to floor
    const k = inv(.96, 1.5, t);
    let x = lerp(250, 460, ease.outQ(k)), y = lerp(1130, 1350, k) - Math.sin(k * Math.PI) * 260;
    let pose = k < 1 ? POSE.armsUp : POSE.stand, emo = 'joy', face = 1, glow = 0;
    if (t > 1.5) { const wk = inv(1.6, 3.9, t); x = lerp(460, 900, ease.ioS(wk)); y = 1350; pose = (t > 1.6 && t < 3.9) ? POSE.walk(t, 9) : POSE.stand; }
    if (t > 3.55) { pose = POSE.armsUp; emo = 'joy'; }
    glow = clamp(1 - Math.abs(x - 735) / 220);
    const landSquash = t > 1.5 && t < 1.7 ? Math.sin(inv(1.5, 1.7, t) * Math.PI) * .12 : 0;
    shadowBlob(ctx, x, 1352, 90, .3);
    ctx.save(); ctx.translate(x, y); ctx.scale(1 + landSquash, 1 - landSquash); ctx.translate(-x, -y);
    person(ctx, { x, y, s: 1, emo, face, ...pose, glow, blink: blinkAt(t, 1) });
    ctx.restore();
    // wall drawn over hero (ghosted while inside)
    const inside = x > 640 && x < 860;
    drawWallSlab(ctx, 700, -200, 1350, 70, '#e9a94a', inside ? .55 : 1);
    ripple(ctx, 700, 1150, t, 2.75, { size: 260, n: 3 }); ripple(ctx, 770, 1150, t, 3.3, { size: 260, n: 3 });
    sparkles(ctx, 770, 1050, t, 3.4, { n: 12, r: 220 });
  }
  if (t < .96) drawWallSlab(ctx, 700, -200, 1350, 70);
  ctx.restore();
  // hook title (screen space)
  const k1 = pop(t, .05, .4), k2 = pop(t, .35, .45);
  const out = popOut(t, 3.95, .25);
  text(ctx, 'ЧТО ЕСЛИ ТЫ', W / 2, 200, { size: 92, scale: k1 * out, fill: '#fff' });
  text(ctx, 'ПРОХОДИШЬ\nСКВОЗЬ СТЕНЫ?', W / 2, 400, { size: 112, scale: k2 * out, fill: '#5ff4ff', rot: -.03 });
}, { tout: 'whipL' });

// ---------- S2 Bank ----------
sc(4.22, 5.78, (ctx, t) => {
  const lt = t - 4.22;
  const cx = lerp(400, 720, ease.io(inv(0, 1.5, lt))), z = 1.42;
  ctx.save(); cam(ctx, cx, 1110, z, -.02);
  // hall
  ctx.fillStyle = '#f3e3c0'; ctx.fillRect(-400, 0, 960, 1350);
  for (let i = 0; i < 3; i++) { const x = -150 + i * 240; rr(ctx, x, 420, 70, 930, 6); fillStroke(ctx, '#fff7e6', 6); }
  rr(ctx, 40, 300, 420, 120, 16); fillStroke(ctx, '#2f56ff', 7); text(ctx, 'БАНК', 250, 362, { size: 84, sw: 10 });
  // vault interior
  ctx.fillStyle = '#26214a'; ctx.fillRect(600, 0, 900, 1350);
  ctx.save(); ctx.globalAlpha = .5; ctx.fillStyle = rgrad(ctx, 950, 1150, 0, 500, ['rgba(255,214,63,.7)', 'rgba(255,214,63,0)']); ctx.fillRect(450, 650, 1000, 1000); ctx.restore();
  for (let r = 0; r < 4; r++) for (let i = 0; i < 6 - r; i++) { const x = 760 + i * 92 + r * 46, y = 1300 - r * 52; poly(ctx, [x, y, x + 84, y, x + 72, y - 46, x + 12, y - 46], '#ffd23f', 5); }
  for (let i = 0; i < 3; i++) { const x = 1240, y = 1300 - i * 1; }
  floorBoards(ctx, -400, 1350, 2000, 400, '#bfa27a', '#a88a62');
  // hero
  const x = lerp(180, 900, ease.ioS(inv(0, 1.45, lt)));
  const emo = lt > .55 ? 'sly' : 'happy';
  person(ctx, { x, y: 1350, s: 1, emo, face: 1, ...POSE.walk(lt, 9), glow: clamp(1 - Math.abs(x - 560) / 200),
    hold: lt > .7 ? (c, hL, hR, s) => { ctx.save(); ctx.translate(hR.x, hR.y + 40); circle(ctx, 0, 0, 48, '#d9b26a', 6); poly(ctx, [-20, -44, 20, -44, 10, -60, -10, -60], '#d9b26a', 5); text(ctx, '₽', 0, 4, { size: 50, sw: 6, fill: '#2fbf71' }); ctx.restore(); } : null });
  // vault wall over hero
  ctx.save(); const inside = x > 470 && x < 690; ctx.globalAlpha = inside ? .55 : 1;
  ctx.fillStyle = '#8c95ab'; ctx.fillRect(520, 0, 80, 1350); ctx.restore();
  for (let i = 0; i < 12; i++) circle(ctx, 560, 60 + i * 110, 8, '#5c6378');
  line(ctx, 520, 0, 520, 1350, 7, OUT, 'butt'); line(ctx, 600, 0, 600, 1350, 7, OUT, 'butt');
  ripple(ctx, 520, 1150, t, 4.45, { size: 240 }); ripple(ctx, 600, 1150, t, 4.85, { size: 240 });
  sparkles(ctx, 900, 1000, t, 4.95, { n: 14, r: 260 });
  ctx.restore();
  text(ctx, 'ЗАХОДИ', W / 2, 330, { size: 120, scale: pop(t, 4.88) * popOut(t, 5.6), fill: '#ffd23f', rot: .04 });
}, { tout: 'whipL' });

// ---------- S3 Station toilet ----------
sc(5.78, 8.52, (ctx, t) => {
  const lt = t - 5.78;
  const z = track([[0, 1.32], [1.8, 1.42], [2.74, 1.48]], lt);
  ctx.save(); cam(ctx, lerp(420, 600, ease.io(inv(0, 2.7, lt))), 1080, z, .01);
  ctx.fillStyle = '#e8f4ff'; ctx.fillRect(-400, -100, 1900, 1450);
  for (let x = -400; x < 1500; x += 90) line(ctx, x, -100, x, 1350, 3, '#c2dcf0'); for (let y = -100; y < 1350; y += 90) line(ctx, -400, y, 1500, y, 3, '#c2dcf0');
  ctx.fillStyle = '#4fa3ff'; ctx.fillRect(-400, 900, 1900, 30);
  // cashier booth
  rr(ctx, -40, 640, 380, 710, 16); fillStroke(ctx, '#ffb36b', 7);
  rr(ctx, 10, 700, 280, 300, 12); fillStroke(ctx, '#d9f3ff', 6);
  ctx.save(); rr(ctx, 10, 700, 280, 300, 12); ctx.clip();
  const babaEmo = lt > 1.05 ? 'shock' : 'bored';
  person(ctx, { x: 150, y: 1170, s: .8, pal: PAL.baba, emo: babaEmo, face: lt > .6 ? .6 : 0, look: { x: lt > .6 ? 1 : 0, y: 0 }, blink: blinkAt(t, 9) });
  ctx.restore();
  line(ctx, 30, 760, 140, 720, 8, 'rgba(255,255,255,.7)');
  rr(ctx, 30, 1040, 240, 110, 10); fillStroke(ctx, '#fff', 6); text(ctx, 'ВХОД\n50 ₽', 150, 1095, { size: 40, sw: 0, stroke: false, shadow: false, fill: '#ff3b3b' });
  // door frame back
  rr(ctx, 520, 560, 220, 790, 8); fillStroke(ctx, '#2a2a40', 7);
  // hero walks into the door (gets hidden progressively)
  const x = lerp(250, 760, ease.ioS(inv(.1, 1.9, lt)));
  const emo = lt > 1.3 ? 'cool' : 'happy';
  ctx.save(); ctx.beginPath(); ctx.rect(-400, -200, 520 + 40 + (x > 560 ? 0 : 400), 2000); ctx.clip();
  person(ctx, { x, y: 1350, s: 1, emo, face: 1, ...POSE.walk(lt, 9), glow: clamp(1 - Math.abs(x - 600) / 200) });
  ctx.restore();
  // door
  ctx.save(); ctx.globalAlpha = x > 500 && x < 700 ? .9 : 1; rr(ctx, 530, 570, 200, 780, 6); fillStroke(ctx, '#2fbf71', 7); ctx.restore();
  circle(ctx, 700, 980, 14, '#ffd23f', 5); rr(ctx, 570, 640, 120, 80, 10); fillStroke(ctx, '#fff', 5); text(ctx, 'WC', 630, 682, { size: 46, stroke: false, shadow: false, fill: OUT });
  ripple(ctx, 560, 1100, t, 6.7, { size: 260, n: 3 });
  floorBoards(ctx, -400, 1350, 2000, 500, '#9aa3b5', '#7f889b');
  ctx.restore();
  stamp(ctx, 'БЕСПЛАТНО', W / 2, 360, t, 7.62, { size: 104, bg: '#2fbf71', fill: '#fff', out: 8.35 });
}, { tout: 'whipU' });

// ---------- S4 Neighbour above: "чисто за солью" ----------
function drawKitchenUp(ctx, t, lt) {
  ctx.fillStyle = '#c8f5dd'; ctx.fillRect(-400, -200, 1900, 1450);
  for (let x = 560; x < 1500; x += 70) for (let y = 820; y < 1250; y += 70) { ctx.strokeStyle = '#a7e6c5'; ctx.lineWidth = 3; ctx.strokeRect(x, y, 70, 70); }
  windowFrame(ctx, 40, 360, 300, 330, ['#7fd4ff', '#d8f3ff'], t);
  // stove + pot
  rr(ctx, 640, 1000, 360, 250, 10); fillStroke(ctx, '#fff', 7); circle(ctx, 720, 1180, 20, OUT); circle(ctx, 800, 1180, 20, OUT);
  rr(ctx, 700, 900, 190, 110, 20); fillStroke(ctx, '#ff3b3b', 7); line(ctx, 680, 920, 910, 920, 10, OUT);
  for (let i = 0; i < 3; i++) { const k = (lt * .6 + i / 3) % 1; ctx.save(); ctx.globalAlpha = (1 - k) * .7; ctx.beginPath(); ctx.moveTo(760 + i * 40, 880 - k * 200); ctx.quadraticCurveTo(740 + i * 40 + Math.sin(k * 6) * 20, 840 - k * 200, 770 + i * 40, 800 - k * 200); ctx.lineWidth = 10; ctx.strokeStyle = '#fff'; ctx.stroke(); ctx.restore(); }
  // shelf with spices
  rr(ctx, 380, 520, 260, 20, 6); fillStroke(ctx, '#c8834a', 5);
  for (let i = 0; i < 3; i++) { rr(ctx, 400 + i * 80, 450, 50, 70, 10); fillStroke(ctx, ['#ff7a1a', '#ffd23f', '#ff4fa3'][i], 5); }
}
sc(8.52, 11.45, (ctx, t) => {
  const lt = t - 8.52;
  const z = track([[0, 1.3], [1.3, 1.36], [2.4, 1.6], [2.95, 1.85]], lt);
  const cx = track([[0, 560], [1.3, 560], [2.95, 440]], lt), cy = track([[0, 1080], [1.3, 1080], [2.95, 1060]], lt);
  ctx.save(); cam(ctx, cx, cy, z);
  drawKitchenUp(ctx, t, lt);
  // girl at stove
  const girlTurn = lt > .65;
  person(ctx, { x: 820, y: 1250, s: 1, pal: PAL.girl, emo: lt > .75 ? 'shock' : 'calm', face: girlTurn ? -.8 : .7, look: { x: girlTurn ? -1 : 1, y: .3 }, blink: blinkAt(t, 3),
    arms: girlTurn ? [-.4, .3, .6, -1.6] : [-.3, .2, .9, .9],
    hold: (c, hL, hR, s) => { line(c, hR.x, hR.y, hR.x + (girlTurn ? 30 : 60), hR.y - 70, 10, '#8a5a3a'); } });
  // hero rising through floor (clip above floor)
  const rise = track([[0, 520], [.15, 520], [.75, 150], [1.2, 110], [2.95, 100]], lt);
  ctx.save(); ctx.beginPath(); ctx.rect(-400, -400, 1900, 1650); ctx.clip();
  const hx = 380, hy = 1250 + rise;
  const emo = lt < 1.3 ? 'happy' : 'sly';
  person(ctx, { x: hx, y: hy, s: 1, emo, face: .5, look: { x: 1, y: 0 }, blink: lt > 2.55 && lt < 2.75 ? 1 : 0, glow: .5,
    arms: lt > 1.75 ? [-.2, .1, 2.5, .4] : [-.2, .1, .2, -.1],
    hold: lt > 1.75 ? (c, hL, hR, s) => saltShaker(c, hR.x + 6, hR.y - 46, 1.5, Math.sin(lt * 10) * .15 * clamp(inv(1.75, 2, lt))) : null });
  ctx.restore();
  // floor slice
  floorBoards(ctx, -400, 1250, 1900, 700, '#e0a060', '#c98a4c');
  // hole glow
  ctx.save(); ctx.globalAlpha = .9; ell(ctx, hx, 1252, 130, 22, 'rgba(95,244,255,.55)'); ctx.restore();
  ripple(ctx, hx, 1252, t, 8.6, { axis: 'h', size: 260, n: 4, gap: .25 });
  ctx.restore();
  text(ctx, 'ЧИСТО\nЗА СОЛЬЮ', W / 2, 330, { size: 110, scale: pop(t, 10.36), fill: '#fff', rot: -.04 });
});

// ---------- Trollface insert ----------
sc(11.45, 18.35, (ctx, t) => {
  // frozen previous scene, desaturated
  const g = ease.outQ(inv(11.45, 11.7, t)) * (1 - ease.inQ(inv(18.05, 18.35, t)));
  ctx.save(); ctx.filter = `grayscale(${g}) brightness(${1 - .45 * g})`;
  SCENES[3].draw(ctx, 11.449);
  ctx.restore();
  if (!TF) return;
  // square pops in / flies out
  const kin = inv(11.45, 11.8, t), kout = inv(17.95, 18.3, t);
  if (kout >= 1) return;
  const sIn = ease.outBack(kin, 1.7), sOut = 1 - ease.inC(kout);
  const size = 780 * sIn * sOut;
  const yOff = -ease.inC(kout) * 900 + (1 - ease.outC(kin)) * 700;
  const rot = (1 - ease.outC(kin)) * -.5 + ease.inC(kout) * .4;
  if (size < 2) return;
  const fi = clamp(Math.floor((t - 11.55) * 30), 0, TF.length - 1);
  ctx.save(); ctx.translate(W / 2, 900 + yOff); ctx.rotate(rot);
  ctx.save(); ctx.globalAlpha = .45; rr(ctx, -size / 2 + 18, -size / 2 + 26, size, size, 36 * size / 780); ctx.fillStyle = '#000'; ctx.fill(); ctx.restore();
  rr(ctx, -size / 2 - 12, -size / 2 - 12, size + 24, size + 24, 44 * size / 780); ctx.fillStyle = '#fff'; ctx.fill();
  ctx.save(); rr(ctx, -size / 2, -size / 2, size, size, 34 * size / 780); ctx.clip();
  ctx.drawImage(TF[fi], -size / 2, -size / 2, size, size); ctx.restore();
  ctx.restore();
  // whoosh trails
}, { noSubs: true, tout: 'whipD' });

// ---------- Building cross-section + fall (S5-S7) ----------
const FALL = [[18.3, 0], [20.2, 0], [22.4, 30], [23.35, 70], [23.9, 330], [24.55, 520], [25.6, 590], [26.6, 650], [27.3, 760], [27.75, 1260], [28.45, 2770], [28.95, 3150], [29.75, 3800], [30.45, 4500], [31.7, 6600]];
const heroY = t => trackM(FALL, t);
function drawBuilding(ctx, t, yTop, yBot) {
  const X0 = -700, WW = 2500;
  // hero's living room (-760..0)
  if (yTop < 0) {
    ctx.fillStyle = '#bfe9ff'; ctx.fillRect(X0, -2400, WW, 1600); concrete(ctx, X0, -830, WW, 70);
    wallpaper(ctx, X0, -760, WW, 760, '#ffd98f', '#ffcc70', 90);
    windowFrame(ctx, 620, -560, 280, 300, ['#7fd4ff', '#d8f3ff'], t);
    sofa(ctx, 200, 0, '#5b6cff', 360); plant(ctx, 960, 0, .9);
    rr(ctx, -260, -420, 220, 140, 10); fillStroke(ctx, '#222', 7); // tv
    lampCeil(ctx, 540, -760, 110, 1);
  }
  // slab 0..70
  concrete(ctx, X0, 0, WW, 70);
  // neighbours below (70..830)
  if (yTop < 830 && yBot > 70) {
    wallpaper(ctx, X0, 70, WW, 760, '#a8ecd2', '#93e0c3', 80);
    windowFrame(ctx, -100, 260, 260, 280, ['#7fd4ff', '#d8f3ff'], t);
    lampCeil(ctx, 540, 70, 90, 1);
    floorBoards(ctx, X0, 830, WW, 0.1);
  }
  concrete(ctx, X0, 830, WW, 70);
  // basement 900..1500
  if (yTop < 1500 && yBot > 900) {
    ctx.fillStyle = '#4a4f63'; ctx.fillRect(X0, 900, WW, 600);
    for (let i = 0; i < 30; i++) for (let j = 0; j < 7; j++) { ctx.strokeStyle = '#3c4054'; ctx.lineWidth = 4; ctx.strokeRect(X0 + i * 90 + (j % 2) * 45, 900 + j * 86, 90, 86); }
    line(ctx, X0, 990, X0 + WW, 990, 34, '#8a6b4a'); line(ctx, X0, 990, X0 + WW, 990, 20, '#b08a5e');
    line(ctx, X0, 1060, X0 + WW, 1060, 22, '#6b7d99');
    // shelf with jars (pickles)
    rr(ctx, 700, 1270, 380, 16, 4); fillStroke(ctx, '#8a6b4a', 4);
    for (let i = 0; i < 4; i++) { rr(ctx, 715 + i * 92, 1180, 70, 90, 14); fillStroke(ctx, 'rgba(160,230,140,.85)', 5); rr(ctx, 720 + i * 92, 1168, 60, 18, 6); fillStroke(ctx, '#ffd23f', 4); circle(ctx, 750 + i * 92, 1225, 12, '#3a9a3a'); }
    // bulb
    line(ctx, 300, 900, 300, 1000, 4, OUT); circle(ctx, 300, 1020, 22, '#fff6a8', 5);
    ctx.save(); ctx.globalAlpha = .3; ctx.fillStyle = rgrad(ctx, 300, 1020, 0, 400, ['rgba(255,240,170,.9)', 'rgba(255,240,170,0)']); ctx.fillRect(-100, 620, 800, 800); ctx.restore();
    // rat
    const rx = 100 + ((t * 120) % 500); ell(ctx, rx, 1480, 34, 18, '#8d8d9e', 5); circle(ctx, rx + 30, 1470, 12, '#8d8d9e', 4); circle(ctx, rx + 34, 1468, 3, OUT); line(ctx, rx - 34, 1484, rx - 80, 1470, 4, '#ff9fb0');
    text(ctx, 'ПОДВАЛ', 860, 1120, { size: 54, fill: '#ffd23f', rot: -.04, sw: 10 });
  }
  concrete(ctx, X0, 1500, WW, 100, '#7a8194');
  // soil 1600..2300
  if (yTop < 2300 && yBot > 1600) {
    ctx.fillStyle = vgrad(ctx, 1600, 2300, ['#8a5a32', '#6e4426']); ctx.fillRect(X0, 1600, WW, 700);
    for (let i = 0; i < 40; i++) circle(ctx, X0 + hash(i) * WW, 1620 + hash(i + 2) * 660, 6 + hash(i + 4) * 14, '#5c3a20');
    for (let i = 0; i < 4; i++) { const x = 100 + i * 280; ctx.beginPath(); ctx.moveTo(x, 1600); ctx.quadraticCurveTo(x + 40, 1720, x - 10, 1840); ctx.lineWidth = 8; ctx.strokeStyle = '#c99a5c'; ctx.stroke(); }
    // worm
    ctx.beginPath(); ctx.moveTo(760, 2000); for (let i = 0; i < 6; i++) ctx.lineTo(760 + i * 22, 2000 + Math.sin(t * 6 + i) * 10); ctx.lineWidth = 16; ctx.strokeStyle = '#ff9fb0'; ctx.lineCap = 'round'; ctx.stroke();
  }
  // metro 2300..2900
  if (yTop < 2900 && yBot > 2300) {
    ctx.fillStyle = '#6e4426'; ctx.fillRect(X0, 2300, WW, 600);
    rr(ctx, X0, 2380, WW, 460, 0); fillStroke(ctx, '#2b2d42', 8);
    for (let i = 0; i < 14; i++) circle(ctx, X0 + 80 + i * 190, 2420, 12, '#fff6a8', 4);
    line(ctx, X0, 2810, X0 + WW, 2810, 12, '#9aa3b5');
    // train passes
    const tx = lerp(-2600, 2200, inv(27.9, 29.3, t));
    for (let c = 0; c < 3; c++) {
      const x = tx + c * 720; rr(ctx, x, 2490, 700, 310, 40); fillStroke(ctx, '#3a7bff', 8);
      ctx.fillStyle = '#fff'; ctx.fillRect(x + 10, 2700, 680, 26);
      for (let w = 0; w < 4; w++) { rr(ctx, x + 40 + w * 165, 2540, 130, 110, 14); fillStroke(ctx, '#d9f3ff', 6); circle(ctx, x + 105 + w * 165, 2610, 26, '#ffd2a8', 4); }
      circle(ctx, x + 160, 2800, 28, '#333', 6); circle(ctx, x + 540, 2800, 28, '#333', 6);
    }
    circle(ctx, 950, 2470, 44, '#ff3b3b', 6); text(ctx, 'М', 950, 2472, { size: 56, sw: 0, stroke: false, shadow: false });
  }
  // rock layers 2900+
  if (yBot > 2900) {
    const cols = ['#9a6a45', '#82533a', '#6b3f2e', '#563226', '#43261f', '#331b18', '#2a1414'];
    for (let i = 0; i < cols.length; i++) { const y0 = 2900 + i * 600; if (y0 > yBot || y0 + 600 < yTop) continue; ctx.fillStyle = cols[i]; ctx.fillRect(X0, y0, WW, i === cols.length - 1 ? 9000 : 600); line(ctx, X0, y0, X0 + WW, y0, 6, 'rgba(0,0,0,.3)', 'butt'); }
    for (let i = 0; i < 70; i++) { const y = 2950 + hash(i * 2) * 4000; if (y < yTop - 80 || y > yBot + 80) continue; const x = X0 + hash(i * 5) * WW; poly(ctx, [x, y, x + 50, y - 20, x + 80, y + 20, x + 30, y + 40], 'rgba(0,0,0,.2)', 0); }
    // fossil
    if (yTop < 3700 && yBot > 3300) { ctx.save(); ctx.translate(820, 3500); ctx.globalAlpha = .9; ell(ctx, 0, 0, 90, 50, '#efe6d0', 5); circle(ctx, -40, -10, 14, '#82533a'); for (let i = 0; i < 6; i++) line(ctx, 80 + i * 40, 10, 100 + i * 40, 60, 12, '#efe6d0'); ctx.restore(); }
    if (yTop < 4500 && yBot > 4100) for (let i = 0; i < 4; i++) poly(ctx, [160 + i * 40, 4300, 180 + i * 40, 4200 - i * 20, 200 + i * 40, 4300], '#7ff0ff', 5);
  }
}
function fallingFamily(ctx, t) {
  // family at dinner table in the room below; look up as hero passes
  const look = t > 24.3 ? -1 : 0; const shocked = t > 24.5;
  const emo = shocked ? 'shock' : 'calm';
  person(ctx, { x: 180, y: 830, s: .85, pal: PAL.dad, emo, face: .5, look: { x: .6, y: look }, legs: [.1, 0, -.1, 0], arms: shocked ? [-2.5, -.3, 2.5, .3] : [-.6, -1.2, .3, -.1] });
  person(ctx, { x: 900, y: 830, s: .85, pal: PAL.mom, emo, face: -.5, look: { x: -.6, y: look }, arms: shocked ? [-2.5, -.3, 2.5, .3] : [-.3, .1, .6, 1.2] });
  person(ctx, { x: 740, y: 830, s: .6, pal: PAL.kid, emo: shocked ? 'joy' : 'calm', face: -.3, look: { x: -.3, y: look }, arms: shocked ? [-2.5, -.3, 2.5, .3] : [-.3, .1, .3, -.1] });
  // table
  rr(ctx, 260, 640, 460, 40, 10); fillStroke(ctx, '#ff7a59', 6); line(ctx, 300, 680, 300, 830, 14, OUT); line(ctx, 680, 680, 680, 830, 14, OUT);
  ell(ctx, 420, 628, 70, 18, '#fff', 5); ell(ctx, 420, 624, 50, 10, '#ff5a3a');
  // spoon drop
  const sk = inv(25.6, 26.4, t); ctx.save(); ctx.translate(560, 600 + ease.inQ(sk) * 30); ctx.rotate(sk * 3); line(ctx, -20, 0, 20, 0, 8, '#c9d2e6'); ctx.restore();
}
sc(18.35, 31.65, (ctx, t) => {
  const hy = heroY(t);
  const vel = (heroY(t + .02) - heroY(t - .02)) / .04;
  // camera
  let cy = hy - 230, z = 1.0;
  z = track([[18.3, 1.3], [20.2, 1.32], [22.4, 1.5], [23.35, 1.52], [24.0, 1.1], [24.6, 1.1], [26.8, 1.16], [27.4, 1.0], [28.4, .95], [29.5, .9], [31.7, .86]], t);
  const camY = track([[18.3, -240], [20.2, -240], [22.4, -130], [23.35, -120]], t);
  const follow = clamp(inv(23.35, 23.8, t));
  cy = lerp(camY, hy - 150 + clamp(vel / 3000, 0, 1) * 220, ease.ioS(follow));
  const sh = shake(t, t > 23.4 ? 4 + clamp(vel / 1000, 0, 10) : 1);
  ctx.save(); cam(ctx, 540 + sh.x, cy + sh.y, z, sh.r + (t > 23.4 ? Math.sin(t * 1.3) * .02 : 0));
  const half = H / 2 / z + 200;
  drawBuilding(ctx, t, cy - half, cy + half);
  if (cy + half > 70 && cy - half < 830) fallingFamily(ctx, t);
  // hero
  const falling = t > 23.35;
  let emo = 'determined', pose = POSE.stand, look = { x: 0, y: 0 };
  if (t > 18.6 && t < 20.2) emo = 'cool';
  if (t > 20.2) { emo = 'worried'; look = { x: 0, y: 1 }; }
  if (falling) { emo = 'scream'; pose = POSE.flail(t * (t > 24.5 && t < 27.2 ? .35 : 1)); look = { x: 0, y: -1 }; }
  if (t > 24.5 && t < 27.3) { emo = 'awk'; look = { x: -1, y: 0 }; }
  const hx = 540 + (falling ? Math.sin(t * 2) * 30 : 0);
  // floor glow under feet
  if (t > 20.2 && t < 24) { ctx.save(); ctx.globalAlpha = clamp(inv(20.2, 21, t)) * .9; ell(ctx, hx, 0, 150, 26, 'rgba(95,244,255,.6)'); ctx.restore(); }
  const sinking = !falling && hy > 0;
  ctx.save();
  if (sinking) { ctx.beginPath(); ctx.rect(-800, -2000, 2700, 2000); ctx.clip(); }
  person(ctx, { x: hx, y: hy, s: 1, emo, look, ...pose, glow: t > 20.2 ? .6 : 0, blink: falling ? 0 : blinkAt(t, 5), face: 0, lean: falling ? Math.sin(t * 1.7) * .15 : 0 });
  ctx.restore();
  ripple(ctx, hx, 0, t, 21.0, { axis: 'h', size: 230, n: 4, gap: .35, dur: 1.4 });
  ripple(ctx, hx, 0, t, 23.4, { axis: 'h', size: 320, n: 3 });
  ripple(ctx, hx, 70, t, 23.95, { axis: 'h', size: 260, n: 2 });
  ripple(ctx, hx, 830, t, 27.3, { axis: 'h', size: 260, n: 2 });
  ctx.restore();
  // speed lines when fast
  const sp = clamp((vel - 900) / 3000);
  if (sp > 0) { ctx.save(); ctx.globalAlpha = sp; speedLines(ctx, t, { n: 40, spd: 2600, col: 'rgba(255,255,255,.45)' }); ctx.restore(); }
  stamp(ctx, 'НО ЕСТЬ\nНЮАНС', W / 2, 330, t, 18.62, { size: 104, out: 20.1, bg: '#ff3b3b', fill: '#fff' });
  text(ctx, 'И СКВОЗЬ ПОЛ', W / 2, 330, { size: 110, scale: pop(t, 23.4) * popOut(t, 24.4), fill: '#5ff4ff', rot: -.04 });
  stamp(ctx, 'ТОРМОЗОВ\nНЕТ', W / 2, 340, t, 30.38, { size: 104, out: 31.5, bg: '#ff3b3b', fill: '#fff', rot: .05 });
}, { mb: t => t > 23.5 && (t < 24.5 || t > 27.2) ? 4 : 1, tout: 'cutFlash' });
