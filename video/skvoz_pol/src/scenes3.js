// ===== Scenes part 3: fix -> neighbour wall -> clothes -> reveal -> CTA =====

// ---------- S20-21: settings panel ----------
function toggle(ctx, x, y, on) {
  rr(ctx, x - 70, y - 38, 140, 76, 38); fillStroke(ctx, on > .5 ? '#2fbf71' : '#c9d2e6', 6);
  circle(ctx, x - 32 + 64 * ease.outBack(on, 1.5), y, 30, '#fff', 6);
}
function checkMark(ctx, x, y, k) {
  if (k <= 0) return; ctx.save(); ctx.translate(x, y); ctx.scale(ease.outBack(k, 2), ease.outBack(k, 2));
  circle(ctx, 0, 0, 38, '#2fbf71', 6); ctx.beginPath(); ctx.moveTo(-18, 2); ctx.lineTo(-5, 16); ctx.lineTo(20, -14); ctx.lineWidth = 10; ctx.strokeStyle = '#fff'; ctx.lineCap = 'round'; ctx.lineJoin = 'round'; ctx.stroke(); ctx.restore();
}
function rowIcon(ctx, kind, x, y) {
  circle(ctx, x, y, 40, '#eef3ff', 5);
  if (kind === 0) { ell(ctx, x - 13, y + 4, 11, 20, '#ff6f8a', 4); ell(ctx, x + 13, y + 4, 11, 20, '#ff6f8a', 4); line(ctx, x, y - 22, x, y - 6, 6, '#ff6f8a'); }
  if (kind === 1) { ell(ctx, x, y, 26, 16, '#fff', 4); circle(ctx, x, y, 9, OUT); }
  if (kind === 2) { ctx.beginPath(); ctx.arc(x + 2, y - 2, 18, Math.PI * .9, Math.PI * 2.4); ctx.lineWidth = 7; ctx.strokeStyle = '#d9956a'; ctx.stroke(); }
  if (kind === 3) { rr(ctx, x - 26, y + 6, 52, 14, 3); fillStroke(ctx, '#c8834a', 4); line(ctx, x, y - 22, x, y + 2, 6, OUT); poly(ctx, [x - 10, y - 8, x + 10, y - 8, x, y + 4], OUT, 0); }
}
sc(V(64.1), V(71.8), (ctx, t) => {
  const lt = t - V(64.1);
  ctx.fillStyle = vgrad(ctx, 0, H, ['#3f7bff', '#7b3cff']); ctx.fillRect(0, 0, W, H);
  ctx.save(); ctx.globalAlpha = .15; for (let x = 0; x < W; x += 90) line(ctx, x, 0, x, H, 3, '#fff'); for (let y = 0; y < H; y += 90) line(ctx, 0, y, W, y, 3, '#fff'); ctx.restore();
  ctx.fillStyle = '#2b2160'; ctx.fillRect(0, 1350, W, 600); line(ctx, 0, 1350, W, 1350, 8, OUT);
  // panel
  const pin = ease.outBack(inv(V(64.84), V(65.3), t), 1.4);
  ctx.save(); ctx.translate(lerp(W + 600, 0, pin), 0); ctx.rotate((1 - pin) * .1);
  rr(ctx, 80, 150, 920, 940, 50); fillStroke(ctx, '#fff', 10);
  rr(ctx, 80, 150, 920, 130, 50); fillStroke(ctx, '#17132b', 0); ctx.fillStyle = '#17132b'; ctx.fillRect(80, 230, 920, 50);
  text(ctx, 'НАСТРОЙКИ СИЛЫ', 540, 218, { size: 56, stroke: false, fill: '#fff', shadow: false });
  // row 0 toggle
  text(ctx, 'Сквозь стены', 130, 360, { size: 54, weight: 800, align: 'left', stroke: false, shadow: false, fill: OUT });
  const on = clamp(inv(V(65.95), V(66.25), t));
  toggle(ctx, 880, 360, on);
  const sub = pop(t, V(66.5), .3);
  if (sub > 0) { ctx.save(); ctx.translate(130, 440); ctx.scale(sub, sub); rr(ctx, 0, -34, 560, 68, 34); fillStroke(ctx, '#ffe14d', 5); text(ctx, 'только когда хочешь', 280, 0, { size: 40, weight: 800, stroke: false, shadow: false, fill: OUT }); ctx.restore(); }
  line(ctx, 120, 500, 960, 500, 4, '#dfe5f2');
  const rows = [['Дышишь', V(68.08)], ['Видишь', V(68.72)], ['Слышишь', V(69.2)], ['Пол держит', V(69.92)]];
  rows.forEach(([label, tt], i) => {
    const y = 590 + i * 125; const k = pop(t, tt - .12, .3);
    ctx.save(); ctx.globalAlpha = clamp(inv(tt - .3, tt - .1, t)) * .75 + .25;
    rowIcon(ctx, i, 175, y); text(ctx, label, 245, y, { size: 52, weight: 800, align: 'left', stroke: false, shadow: false, fill: OUT });
    ctx.restore(); checkMark(ctx, 900, y, clamp((t - tt) / .3));
  });
  ctx.restore();
  // hero with wrench
  const happy = t > V(70.9);
  const stomp = t > V(69.92) && t < V(70.5) ? Math.sin(inv(V(69.92), V(70.5), t) * Math.PI) : 0;
  const hp = person(ctx, { x: 230, y: 1350 - stomp * 40, s: .9, emo: happy ? 'joy' : 'determined', ...(happy ? POSE.thumbs : { legs: [.08, 0, -.08, 0], arms: [-.18, .1, 1.0 + Math.sin(t * 9) * .3 * (t < V(65.4) ? 1 : 0), 1.2] }), blink: blinkAt(t, 21), face: .4,
    hold: happy ? null : (c, hL, hR, s) => { c.save(); c.translate(hR.x, hR.y); c.rotate(-.6); line(c, 0, 0, 0, -90, 16, '#9aa3b5'); c.beginPath(); c.arc(0, -105, 24, .9, 5.4); c.lineWidth = 14; c.strokeStyle = '#9aa3b5'; c.stroke(); c.restore(); } });
  if (stomp > 0) ripple(ctx, 230, 1352, t, V(70.2), { axis: 'h', size: 200, n: 2, col: '#ffe14d' });
  stamp(ctx, 'ИДЕАЛЬНО', 640, 1230, t, V(71.0), { size: 100, bg: '#2fbf71', fill: '#fff', rot: -.07 });
  sparkles(ctx, 640, 1230, t, V(71.05), { n: 16, r: 360 });
  text(ctx, 'ЛАДНО.', W / 2, 1180, { size: 90, scale: pop(t, V(64.2)) * popOut(t, V(64.8)), fill: '#fff' });
}, { tout: 'whipL' });

// ---------- S22: corridor, walk through neighbour's wall ----------
function corridorBg(ctx, t) {
  wallpaper(ctx, -600, -200, 1360, 1550, '#9fe0a8', '#8fd398', 80);
  rr(ctx, -250, 560, 230, 790, 6); fillStroke(ctx, '#a0522d', 7); circle(ctx, -50, 980, 13, '#ffd23f', 5); text(ctx, '46', -135, 640, { size: 48, sw: 8 });
  lampCeil(ctx, 300, -200, 300, 1);
  // shoe rack
  rr(ctx, 80, 1250, 260, 100, 8); fillStroke(ctx, '#c8834a', 6);
  floorBoards(ctx, -600, 1350, 2400, 500, '#c9a27a', '#b08a62');
}
function neighbourWall(ctx, t, alpha = 1) {
  ctx.save(); ctx.globalAlpha *= alpha;
  ctx.fillStyle = '#d98a4a'; ctx.fillRect(760, -200, 900, 1550);
  ctx.fillStyle = 'rgba(0,0,0,.08)'; for (let j = 0; j < 22; j++) for (let i = 0; i < 9; i++) ctx.fillRect(760 + i * 100 + (j % 2) * 50, -200 + j * 72, 92, 64);
  ctx.restore(); line(ctx, 760, -200, 760, 1350, 8, OUT, 'butt');
  text(ctx, 'КВ. 47', 1000, 520, { size: 52, sw: 8, fill: '#fff' });
}
sc(V(71.8), V(76.55), (ctx, t) => {
  const lt = t - V(71.8);
  const x = trackM([[0, 120], [.2, 120], [1.9, 640], [3.1, 640], [3.25, 650], [4.75, 880]], lt);
  const z = track([[0, 1.25], [2.0, 1.35], [3.0, 1.55], [4.75, 1.45]], lt);
  ctx.save(); cam(ctx, clamp(x + 40, 380, 760), 1080, z);
  corridorBg(ctx, t);
  const closed = t > V(73.9);
  const walking = lt < 1.9 || lt > 3.25;
  const pose = lt < 1.9 ? POSE.tiptoe(lt, 8) : lt > 3.25 ? POSE.walk(lt, 6) : POSE.stand;
  const emo = closed ? 'closed' : 'sly';
  shadowBlob(ctx, Math.min(x, 760), 1352, 80, .3);
  person(ctx, { x, y: 1350, s: 1, emo, face: .7, look: { x: 1, y: 0 }, ...pose, blink: blinkAt(t, 30), glow: lt > 3.2 ? .6 : 0 });
  neighbourWall(ctx, t);
  ripple(ctx, 760, 1080, t, V(75.1), { size: 300, n: 4, gap: .22 });
  ctx.restore();
}, { tout: 'cutFlash' });

// ---------- S23: realisation close-up ----------
sc(V(76.55), V(80.65), (ctx, t) => {
  const lt = t - V(76.55);
  // blurred warm room behind
  ctx.fillStyle = vgrad(ctx, 0, H, ['#ffb3c7', '#ff8fb1']); ctx.fillRect(0, 0, W, H);
  ctx.save(); ctx.filter = 'blur(18px)'; circle(ctx, 220, 420, 160, 'rgba(255,240,180,.8)'); rr(ctx, 600, 900, 520, 300, 60); ctx.fillStyle = '#7b3cff'; ctx.fill(); ctx.restore();
  const punch = t > V(79.62) ? 1 + .12 * Math.exp(-(t - V(79.62)) * 6) : 1;
  const z = track([[0, 1.0], [3.0, 1.12], [4.1, 1.18]], lt) * punch;
  const sh = shake(t, t > V(79.6) ? 6 : 1);
  ctx.save(); cam(ctx, 540 + sh.x, 900 + sh.y, z);
  let emo = 'closed', look = { x: 0, y: 0 };
  if (t > V(76.95)) emo = 'happy';
  if (t > V(78.2)) { emo = 'worried'; look = { x: 0, y: 1 }; }
  if (t > V(79.55)) { emo = 'scream'; look = { x: 0, y: 1 }; }
  person(ctx, { x: 540, y: 1880, s: 3.1, emo, look, clothes: false, legs: [0, 0, 0, 0], arms: [-.3, .2, .3, -.2], blink: emo === 'happy' ? blinkAt(t, 40) : 0 });
  ctx.restore();
  // blurred foreground (sofa back) crops the frame at chest
  ctx.save(); ctx.filter = 'blur(10px)'; rr(ctx, -100, 1230, W + 200, 900, 120); ctx.fillStyle = '#6a2fe0'; ctx.fill(); ctx.restore();
  ctx.save(); ctx.filter = 'blur(14px)'; ctx.globalAlpha = .6; ell(ctx, 200, 1240, 260, 60, '#9b6bff'); ell(ctx, 880, 1250, 260, 60, '#9b6bff'); ctx.restore();
  // "?" & "!" marks
  text(ctx, '?', 860, 360, { size: 160, scale: pop(t, V(78.26)) * popOut(t, V(79.5)), fill: '#ffe14d', rot: .2 });
  text(ctx, '!!!', 540, 300, { size: 170, scale: pop(t, V(79.62)), fill: '#ff3b3b', rot: -.05 });
});

// ---------- S24: clothes stayed in the corridor ----------
sc(V(80.65), V(82.5), (ctx, t) => {
  const lt = t - V(80.65);
  const z = track([[0, 1.0], [1.85, 1.12]], lt);
  ctx.save(); cam(ctx, 540, 960, z);
  wallpaper(ctx, -200, -200, 1500, 1550, '#d98a4a', '#cf7f40', 100);
  floorBoards(ctx, -200, 1350, 1500, 600, '#c9a27a', '#b08a62');
  const fall = ease.inQ(inv(.7, 1.5, lt));
  // hoodie + jeans flattened on wall in human shape, then slide down
  ctx.save(); ctx.translate(540, 820 + fall * 360); ctx.scale(1, 1 - fall * .55);
  poly(ctx, [-150, -230, 150, -230, 210, -80, 150, -60, 130, 140, -130, 140, -150, -60, -210, -80], PAL.hero.top, 8);
  rr(ctx, -55, 40, 110, 60, 14); fillStroke(ctx, PAL.hero.topSh, 5);
  poly(ctx, [-120, 140, 120, 140, 110, 440, 20, 440, 0, 220, -20, 440, -110, 440], PAL.hero.pants, 8);
  ctx.restore();
  // sneakers
  ell(ctx, 420, 1330, 70, 30, '#fff', 7); ell(ctx, 650, 1335, 70, 30, '#fff', 7);
  // sock sliding down the wall
  const sy = lerp(520, 1300, ease.inQ(inv(.2, 1.7, lt)));
  ctx.save(); ctx.translate(820, sy); ctx.rotate(.3); rr(ctx, -24, -60, 48, 100, 20); fillStroke(ctx, '#fff', 6); ell(ctx, 10, 40, 40, 22, '#fff', 6); ctx.fillStyle = '#ff3b3b'; ctx.fillRect(-22, -50, 44, 12); ctx.restore();
  ctx.restore();
  // crickets text
  text(ctx, '*сверчки*', W / 2, 330, { size: 60, weight: 700, scale: pop(t, V(80.8)), fill: '#fff', rot: -.04 });
}, { tout: 'cutFlash' });

// ---------- S25: reveal + CTA ----------
function censor(ctx, x, y, w, h, t) {
  const n = 6, m = 4;
  for (let i = 0; i < n; i++) for (let j = 0; j < m; j++) { const v = hash(i * 13 + j * 7 + Math.floor(t * 6)); ctx.fillStyle = `hsl(25,${40 + v * 30}%,${55 + v * 25}%)`; ctx.fillRect(x + i * w / n, y + j * h / m, w / n + 1, h / m + 1); }
  ctx.lineWidth = 5; ctx.strokeStyle = OUT; ctx.strokeRect(x, y, w, h);
}
sc(V(82.5), 96.0, (ctx, t) => {
  const lt = t - V(82.5);
  const punch = t > V(83.46) ? 1 + .15 * Math.exp(-(t - V(83.46)) * 5) : 1;
  const z = track([[0, 1.42], [1.0, 1.48], [3, 1.36], [8, 1.3]], lt) * punch;
  const sh = shake(t, t > V(83.46) && t < V(84.2) ? 8 : 1);
  ctx.save(); cam(ctx, 575 + sh.x, 1080 + sh.y, z);
  // neighbour's room
  wallpaper(ctx, -300, -200, 1700, 1550, '#ffc2d6', '#ffb3cb', 90);
  windowFrame(ctx, 620, 380, 260, 280, ['#2a2a6a', '#5a4aa0'], t);
  floorBoards(ctx, -300, 1350, 1700, 600, '#e0a060', '#c98a4c');
  ell(ctx, 780, 1380, 360, 40, '#7b3cff', 0);
  sofa(ctx, 800, 1350, '#7b3cff', 420);
  // girl sitting with tea
  const spill = clamp(inv(V(83.5), V(84.0), t));
  person(ctx, { x: 820, y: 1350 - 95, s: .95, pal: PAL.girl, emo: 'shock', face: -.6, look: { x: -1, y: t > V(83.3) && t < V(84.5) ? .6 : 0 },
    legs: [-1.5, 1.5, -1.4, 1.4], arms: [-.5, -.6, .4, -1.2 - spill * .6], blink: blinkAt(t, 50),
    hold: (c, hL, hR, s) => { c.save(); c.translate(hR.x - 20, hR.y - 10); c.rotate(-spill * 1.2); rr(c, -26, -30, 52, 56, 10); fillStroke(c, '#fff', 5); c.restore(); if (spill > 0) for (let i = 0; i < 6; i++) circle(c, hR.x - 60 - i * 12, hR.y + i * 18 * spill, 8 * spill, '#c47a3a'); } });
  // left wall with ripple, hero standing out of it
  ctx.fillStyle = '#d98a4a'; ctx.fillRect(-300, -200, 400, 1550); line(ctx, 100, -200, 100, 1350, 8, OUT, 'butt');
  ripple(ctx, 100, 1080, t, V(82.55), { size: 260, n: 2 });
  const hx = 330;
  const hp = person(ctx, { x: hx, y: 1350, s: 1, emo: 'awk', clothes: false, face: .5, look: { x: 1, y: 0 }, ...POSE.cover, blink: blinkAt(t, 51) });
  censor(ctx, hx - 75, hp.hip.y - 60, 150, 110, t);
  const ck = pop(t, V(83.46), .3);
  if (ck > 0) { ctx.save(); ctx.translate(hx, hp.hip.y - 5); ctx.rotate(-.12); ctx.scale(ck, ck); rr(ctx, -150, -34, 300, 68, 8); fillStroke(ctx, '#111', 0); text(ctx, 'ЦЕНЗУРА', 0, 2, { size: 46, stroke: false, shadow: false, fill: '#fff' }); ctx.restore(); }
  ctx.restore();
  // CTA overlay
  const ca = clamp(inv(V(84.0), V(84.4), t));
  if (ca > 0) {
    ctx.save(); ctx.globalAlpha = ca * .45; ctx.fillStyle = '#000'; ctx.fillRect(0, 0, W, H); ctx.restore();
    const lines = [['А КУДА БЫ ТЫ', V(84.1)], ['ПРОШЁЛ', V(85.02)], ['ПЕРВЫМ ДЕЛОМ?', V(85.46)]];
    lines.forEach(([s, tt], i) => text(ctx, s, W / 2, 230 + i * 125, { size: i === 1 ? 116 : 88, scale: pop(t, tt - .1), fill: i === 1 ? '#5ff4ff' : '#fff', rot: (i - 1) * .02 }));
    const bk = pop(t, V(86.5), .35);
    if (bk > 0) {
      const bob = Math.sin((t - V(86.5)) * 7) * 14;
      ctx.save(); ctx.translate(W / 2, 1180); ctx.scale(bk, bk); rr(ctx, -360, -70, 720, 140, 70); fillStroke(ctx, '#ff3b5c', 9);
      text(ctx, 'ПИШИ В КОММЕНТАХ', 0, 4, { size: 64, sw: 10 }); ctx.restore();
      ctx.save(); ctx.translate(W / 2, 1330 + bob); ctx.scale(bk, bk); poly(ctx, [-50, -30, 50, -30, 50, 10, 90, 10, 0, 90, -90, 10, -50, 10], '#ffe14d', 8); ctx.restore();
    }
  }
});
