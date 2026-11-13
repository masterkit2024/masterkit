// ===== Scenes part 2: deep fall -> darkness -> Earth -> ocean -> pendulum =====
function rockStream(ctx, t, spd, dark = 0) {
  ctx.fillStyle = vgrad(ctx, 0, H, [dark ? '#1a0c0c' : '#4a2a22', dark ? '#0d0606' : '#2a1414']); ctx.fillRect(0, 0, W, H);
  for (let layer = 0; layer < 3; layer++) {
    const sp = spd * (.4 + layer * .45), n = 14 + layer * 6, sz = 30 + layer * 30;
    for (let i = 0; i < n; i++) {
      const x = hash(i * 7 + layer * 31) * W; const y = ((hash(i * 3 + layer) * (H + 400) - t * sp) % (H + 400) + H + 400) % (H + 400) - 200;
      const r = sz * (.5 + hash(i + layer));
      ctx.save(); ctx.globalAlpha = .25 + layer * .2; poly(ctx, [x - r, y, x - r * .3, y - r * .7, x + r * .8, y - r * .4, x + r, y + r * .5, x, y + r * .8], ['#2a1612', '#5a3424', '#7a4a32'][layer], layer === 2 ? 5 : 0); ctx.restore();
    }
  }
  speedLines(ctx, t, { n: 30, spd: spd * 1.6, col: 'rgba(255,200,160,.25)', len: 400 });
}

// ---------- S8: can't breathe ----------
sc(V(24.75), V(29.45), (ctx, t) => {
  const lt = t - V(24.75);
  rockStream(ctx, t, 1800);
  const z = track([[0, 1.0], [1.2, 1.05], [3.4, 1.18], [4.7, 1.3]], lt);
  const sh = shake(t, 5);
  ctx.save(); cam(ctx, 540 + sh.x, 980 + sh.y, z, Math.sin(t * .9) * .04);
  const choking = t > V(28.2);
  const emo = choking ? 'choke' : (t > V(26.0) ? 'worried' : 'scream');
  const pose = choking ? POSE.throat : POSE.flail(t * .7);
  const p = person(ctx, { x: 540, y: 1330, s: 1.55, emo, ...pose, glow: .45, look: { x: 0, y: choking ? .2 : -1 }, lean: Math.sin(t * 1.3) * .08 });
  // x-ray lungs + air flowing through
  const xr = clamp(inv(V(25.9), V(26.3), t)) * (1 - .6 * clamp(inv(V(29.0), V(29.4), t)));
  if (xr > 0) {
    ctx.save(); ctx.globalAlpha = xr;
    const cx = p.hip.x, cy = p.hip.y - 120;
    rr(ctx, cx - 120, cy - 110, 240, 230, 40); ctx.fillStyle = 'rgba(20,30,70,.75)'; ctx.fill(); ctx.lineWidth = 6; ctx.strokeStyle = '#5ff4ff'; ctx.stroke();
    for (const sd of [-1, 1]) { ell(ctx, cx + sd * 50, cy, 44, 80, 'rgba(255,111,138,.85)', 5); }
    line(ctx, cx, cy - 100, cx, cy - 30, 12, 'rgba(255,111,138,.85)');
    // air particles pass through (moving up = falling)
    for (let i = 0; i < 26; i++) { const x = cx - 150 + hash(i) * 300; const y = cy + 300 - ((t * 700 * (.7 + hash(i + 3) * .6) + hash(i + 9) * 600) % 600); circle(ctx, x, y, 7, '#bdf6ff'); }
    ctx.restore();
    text(ctx, 'ВОЗДУХ', p.hip.x + 250, p.hip.y - 260, { size: 44, alpha: xr, fill: '#bdf6ff', rot: .06 });
    line(ctx, p.hip.x + 185, p.hip.y - 230, p.hip.x + 125, p.hip.y - 170, 8, `rgba(189,246,255,${xr})`);
  }
  ctx.restore();
  stamp(ctx, 'ДЫШАТЬ\nНЕЧЕМ', W / 2, 330, t, V(28.25), { size: 104, bg: '#3f7bff', fill: '#fff', out: V(29.3) });
  text(ctx, 'ДАЛЬШЕ ХУЖЕ', W / 2, 330, { size: 96, scale: pop(t, V(24.8)) * popOut(t, V(25.9)), fill: '#ff6f61', rot: -.03 });
}, { tout: 'whipL' });

// ---------- S9: light passes through eyes ----------
sc(V(29.45), V(32.62), (ctx, t) => {
  const lt = t - V(29.45);
  rockStream(ctx, t, 600, 1);
  const z = track([[0, .95], [3.2, 1.1]], lt);
  ctx.save(); cam(ctx, 540, 860, z);
  const cx = 600, cy = 860, R = 280;
  // light rays: come from left, pass straight through the eye
  const rk = ease.outC(inv(.1, .9, lt));
  for (let i = -2; i <= 2; i++) {
    const y = cy + i * 55;
    ctx.save(); ctx.globalAlpha = .9; ctx.setLineDash([60, 30]); ctx.lineDashOffset = -t * 500;
    line(ctx, -200, y, lerp(-200, 1300, rk), y + i * 6 * rk, 16, '#ffe14d'); ctx.restore();
  }
  // eyeball side cut
  circle(ctx, cx, cy, R, 'rgba(255,255,255,.92)', 9);
  ctx.beginPath(); ctx.arc(cx, cy, R - 22, -1.0, 1.0); ctx.lineWidth = 18; ctx.strokeStyle = '#ff6f8a'; ctx.stroke(); // retina
  ell(ctx, cx - R + 40, cy, 36, 120, 'rgba(120,200,255,.8)', 7); // lens
  ctx.beginPath(); ctx.arc(cx - R + 10, cy, 150, 2.2, 4.08); ctx.lineWidth = 10; ctx.strokeStyle = '#2f8cff'; ctx.stroke(); // iris/cornea
  line(ctx, cx + R - 10, cy + 40, cx + R + 140, cy + 200, 30, '#ffb3c2'); // optic nerve
  // rays again on top (pass through)
  for (let i = -2; i <= 2; i++) { const y = cy + i * 55; ctx.save(); ctx.globalAlpha = .55; line(ctx, cx - R, y, lerp(cx - R, 1300, rk), y + i * 6 * rk, 10, '#fff6a8'); ctx.restore(); }
  text(ctx, 'СЕТЧАТКА', cx + 120, cy - R - 70, { size: 44, fill: '#ff6f8a', alpha: clamp(inv(.6, .9, lt)) });
  line(ctx, cx + 150, cy - R - 35, cx + R - 50, cy - 140, 8, `rgba(255,111,138,${clamp(inv(.6, .9, lt))})`);
  text(ctx, 'СВЕТ НЕ ЗАДЕРЖИВАЕТСЯ', 540, 330, { size: 54, fill: '#fff6a8', scale: pop(t, V(30.4)) });
  ctx.restore();
  // darkness closes (iris wipe)
  const dk = ease.inC(inv(V(31.25), V(32.55), t));
  if (dk > 0) {
    ctx.save(); ctx.fillStyle = '#000'; ctx.beginPath(); ctx.rect(0, 0, W, H); ctx.arc(W / 2, 880, Math.max(0, 1300 * (1 - dk)), 0, TAU, true); ctx.fill(); ctx.restore();
  }
});

// ---------- S10: sound passes through ears ----------
sc(V(32.62), V(36.1), (ctx, t) => {
  const lt = t - V(32.62);
  ctx.fillStyle = '#000'; ctx.fillRect(0, 0, W, H);
  const fadeAll = 1 - ease.io(inv(V(34.6), V(35.9), t));
  ctx.save(); ctx.globalAlpha = clamp(inv(0, .4, lt)) * fadeAll;
  ctx.fillStyle = rgrad(ctx, 540, 860, 0, 700, ['rgba(60,40,90,.6)', 'rgba(0,0,0,0)']); ctx.fillRect(0, 0, W, H);
  // ear
  ctx.save(); ctx.translate(560, 860);
  ctx.beginPath(); ctx.moveTo(-60, -260); ctx.bezierCurveTo(220, -330, 260, 60, 80, 160); ctx.bezierCurveTo(20, 210, 40, 290, -40, 300); ctx.bezierCurveTo(-120, 300, -120, 220, -90, 190);
  fillStroke(ctx, '#ffd2a8', 9);
  ctx.beginPath(); ctx.moveTo(-20, -170); ctx.bezierCurveTo(140, -200, 160, 20, 40, 90); ctx.lineWidth = 9; ctx.strokeStyle = '#d9956a'; ctx.stroke();
  // eardrum (flat, not vibrating)
  line(ctx, -120, -40, -120, 60, 10, '#ff6f8a'); text(ctx, 'перепонка не дрожит', -40, 380, { size: 44, weight: 800, fill: '#ff6f8a' });
  ctx.restore();
  // sound waves from left passing through
  for (let i = 0; i < 7; i++) {
    const k = ((lt * .55 + i / 7) % 1); const x = -100 + k * 1400;
    ctx.save(); ctx.globalAlpha *= Math.sin(k * Math.PI) * .9; ctx.beginPath(); ctx.arc(x - 300, 860, 300, -.5, .5); ctx.lineWidth = 12; ctx.strokeStyle = '#5ff4ff'; ctx.stroke(); ctx.restore();
  }
  ctx.restore();
  const tk = clamp(inv(V(34.55), V(35.0), t)) * (1 - clamp(inv(V(35.85), V(36.1), t)));
  text(ctx, 'ПОЛНАЯ ТИШИНА', W / 2, 880, { size: 72, weight: 700, alpha: tk, stroke: false, shadow: false, fill: '#d9d9e8', ls: 10 });
});

// ---------- S11: falling in the void ----------
sc(V(36.1), V(40.8), (ctx, t) => {
  const lt = t - V(36.1);
  ctx.fillStyle = '#000'; ctx.fillRect(0, 0, W, H);
  // drifting dust (moving up slowly)
  ctx.fillStyle = 'rgba(200,210,255,.35)';
  for (let i = 0; i < 60; i++) { const x = hash(i) * W; const y = ((hash(i + 3) * H - lt * 120 * (.4 + hash(i + 1))) % H + H) % H; ctx.beginPath(); ctx.arc(x, y, 1.5 + hash(i + 2) * 2.5, 0, TAU); ctx.fill(); }
  const a = clamp(inv(.2, 1.2, lt)) * (1 - clamp(inv(4.4, 4.7, lt)));
  ctx.save(); ctx.globalAlpha = a * .9; ctx.translate(540, 820 + Math.sin(lt) * 20); ctx.rotate(lt * .25); ctx.scale(.75 + lt * .03, .75 + lt * .03);
  aura(ctx, 0, -180, 380, .35, '120,140,255');
  person(ctx, { x: 0, y: 140, s: 1, emo: 'closed', ...POSE.flail(lt * .2), glow: 0 });
  ctx.restore();
  const t1 = V(38.38), t2 = V(39.66);
  text(ctx, 'БЕЗ ВОЗДУХА.', W / 2, 1350, { size: 62, weight: 700, alpha: clamp(inv(t1, t1 + .4, t)) * (1 - clamp(inv(V(40.5), V(40.8), t))), stroke: false, shadow: false, fill: '#cfd3ff', ls: 6 });
  text(ctx, 'БЕЗ ЗВУКА.', W / 2, 1450, { size: 62, weight: 700, alpha: clamp(inv(t2, t2 + .4, t)) * (1 - clamp(inv(V(40.5), V(40.8), t))), stroke: false, shadow: false, fill: '#cfd3ff', ls: 6 });
  text(ctx, 'АБСОЛЮТНАЯ ТЬМА', W / 2, 1250, { size: 62, weight: 700, alpha: clamp(inv(V(37.0), V(37.5), t)) * (1 - clamp(inv(V(40.5), V(40.8), t))), stroke: false, shadow: false, fill: '#8f95c8', ls: 6 });
}, { noSubs: true });

// ---------- Earth diagram helper scene ----------
function earthScene(ctx, t, o) {
  ctx.fillStyle = vgrad(ctx, 0, H, ['#0b0b2a', '#1b1050']); ctx.fillRect(0, 0, W, H); stars(ctx, t, 160, 3);
  const z = o.z ?? 1; ctx.save(); cam(ctx, 540, 1000, z, o.rot || 0);
  const R = 400; earthDiagram(ctx, 540, 1000, R, t, { labels: o.labels ?? 1 });
  if (o.bottomLabel) { const k = o.bottomLabel; text(ctx, 'ТИХИЙ ОКЕАН', 540, 1000 + R + 90, { size: 54, scale: k, fill: '#7fd4ff' }); }
  text(ctx, 'ТЫ ТУТ', 540 + 170, 1000 - R - 50, { size: 44, alpha: o.youLabel ?? 0, fill: '#ffe14d' });
  heroIcon(ctx, 540, 1000 - R * o.pos, .32, t, { emo: o.emo, beard: o.beard, pal: o.pal, lookY: o.lookY });
  ctx.restore();
}

// ---------- S12: 20 minutes to the centre ----------
sc(V(40.8), V(43.3), (ctx, t) => {
  const lt = t - V(40.8);
  const prog = ease.ioS(inv(V(40.95), V(42.85), t));
  const z = track([[0, 1.45], [.45, 1.0], [2.0, 1.02], [2.5, 1.18]], lt);
  earthScene(ctx, t, { z, pos: 1 - prog, emo: 'scream', youLabel: 1 - clamp(inv(.6, 1.0, lt)), labels: clamp(inv(.6, 1.2, lt)) });
  timerBox(ctx, W / 2, 300, prog * 1200, { label: 'ВРЕМЯ ПАДЕНИЯ', scale: pop(t, V(40.85), .3) });
  if (lt < .3) { ctx.fillStyle = `rgba(255,255,255,${(1 - lt / .3) * .5})`; ctx.fillRect(0, 0, W, H); }
}, { tout: 'cutFlash' });

// ---------- S13: core heat ----------
function coreBg(ctx, t, hot = 1) {
  ctx.fillStyle = rgrad(ctx, 540, 900, 50, 1300, ['#fffbe0', '#ffd23f', '#ff7a1a', '#c2300f']); ctx.fillRect(0, 0, W, H);
  ctx.save(); ctx.globalAlpha = .35 * hot; ctx.strokeStyle = '#fff6a8'; ctx.lineWidth = 6;
  for (let i = 0; i < 18; i++) { const y = ((i * 130 - t * 260) % H + H) % H; ctx.beginPath(); for (let x = 0; x <= W; x += 40) ctx.lineTo(x, y + Math.sin(x * .012 + t * 5 + i) * 18); ctx.stroke(); }
  ctx.restore();
  for (let i = 0; i < 40; i++) { const x = hash(i + 50) * W; const y = ((hash(i) * H - t * 900 * (.5 + hash(i + 2))) % H + H) % H; circle(ctx, x, y, 4 + hash(i + 7) * 8, i % 2 ? '#fff6a8' : '#ff9a3c'); }
}
sc(V(43.3), V(45.55), (ctx, t) => {
  const lt = t - V(43.3);
  coreBg(ctx, t);
  const z = track([[0, 1.15], [2.25, 1.0]], lt); const sh = shake(t, 6);
  ctx.save(); cam(ctx, 540 + sh.x, 960 + sh.y, z);
  aura(ctx, 470, 1000, 420, .8, '255,90,30');
  person(ctx, { x: 470, y: 1300, s: 1.35, emo: lt > .8 ? 'scream' : 'shock', ...POSE.flail(t * .6), lean: Math.sin(t) * .1 });
  // thermometer
  const tk = ease.outC(inv(.1, 1.6, lt));
  rr(ctx, 860, 420, 90, 700, 45); fillStroke(ctx, '#fff', 8); circle(ctx, 905, 1150, 80, '#ff3b3b', 8);
  rr(ctx, 880, 1100 - 640 * tk, 50, 640 * tk + 60, 25); ctx.fillStyle = '#ff3b3b'; ctx.fill();
  for (let i = 0; i < 6; i++) line(ctx, 860, 480 + i * 110, 890, 480 + i * 110, 6, OUT);
  ctx.restore();
  text(ctx, '≈ 5 000 °C', W / 2, 300, { size: 110, scale: pop(t, V(44.2)), fill: '#fff', strokeCol: '#a3170a' });
  const sk = pop(t, V(45.0), .3);
  if (sk > 0) { ctx.save(); ctx.translate(250, 480); ctx.scale(sk, sk); sun(ctx, 0, 0, 70, t); ctx.restore(); text(ctx, 'КАК НА СОЛНЦЕ', 600, 480, { size: 54, scale: sk, fill: '#ffe14d' }); }
}, { tout: 'whipU' });

// ---------- S14: speed ~8 km/s ----------
sc(V(45.55), V(48.4), (ctx, t) => {
  const lt = t - V(45.55);
  coreBg(ctx, t * 2.5, .5);
  ctx.save(); ctx.globalAlpha = .55; ctx.fillStyle = '#ff7a1a'; ctx.fillRect(0, 0, W, H); ctx.restore();
  speedLines(ctx, t, { n: 70, spd: 5200, col: 'rgba(255,255,230,.7)', len: 520, lw: 8 });
  const sh = shake(t, 9, 14);
  ctx.save(); cam(ctx, 540 + sh.x, 1000 + sh.y, 1.0, sh.r);
  person(ctx, { x: 540, y: 1450, s: 1.25, emo: 'scream', ...POSE.armsUp, glow: .7, look: { x: 0, y: -1 } });
  ctx.restore();
  // speedometer
  const cx = 540, cy = 640, R = 240;
  ctx.save(); ctx.globalAlpha = clamp(inv(0, .25, lt));
  ctx.beginPath(); ctx.arc(cx, cy, R, Math.PI, 0); ctx.lineTo(cx + R, cy + 30); ctx.lineTo(cx - R, cy + 30); ctx.closePath(); fillStroke(ctx, '#17132b', 9, '#fff');
  for (let i = 0; i <= 10; i++) { const a = Math.PI + i / 10 * Math.PI; line(ctx, cx + Math.cos(a) * (R - 20), cy + Math.sin(a) * (R - 20), cx + Math.cos(a) * (R - (i % 5 ? 45 : 65)), cy + Math.sin(a) * (R - (i % 5 ? 45 : 65)), 7, i >= 8 ? '#ff3b3b' : '#fff'); }
  const v = trackM([[V(45.6), 0], [V(46.7), 7.95], [V(47.1), 7.9]], t) + Math.sin(t * 40) * .05 * clamp(inv(V(46.7), V(46.8), t));
  const a = Math.PI + v / 10 * Math.PI; line(ctx, cx, cy, cx + Math.cos(a) * (R - 60), cy + Math.sin(a) * (R - 60), 12, '#ffe14d'); circle(ctx, cx, cy, 22, '#ffe14d', 6);
  ctx.restore();
  text(ctx, '≈ 8 КМ/С', W / 2, 340, { size: 104, scale: pop(t, V(46.72)), fill: '#ffe14d' });
  text(ctx, 'МОСКВА → ПИТЕР\nЗА ~80 СЕКУНД', W / 2, 830, { size: 56, scale: pop(t, V(47.75)), fill: '#fff' });
}, { tout: 'whipD' });

// ---------- S15: but you don't care ----------
sc(V(48.4), V(51.7), (ctx, t) => {
  const lt = t - V(48.4);
  coreBg(ctx, t * .6, .7);
  const z = track([[0, 1.25], [3.3, 1.12]], lt);
  ctx.save(); cam(ctx, 540, 960, z, -.03);
  ctx.save(); ctx.translate(540, 980 + Math.sin(lt * 2) * 18); ctx.rotate(-1.45 + Math.sin(lt * 1.5) * .05);
  aura(ctx, 0, -200, 400, .7);
  person(ctx, { x: 0, y: 180, s: 1.2, emo: 'cool', ...POSE.chill, face: 0, look: { x: 0, y: 0 } });
  ctx.restore();
  // little "ok" bubbles
  for (let i = 0; i < 3; i++) { const k = pop(t, V(49.2) + i * .5, .3); if (k > 0) circle(ctx, 700 + i * 50, 640 - i * 60, (14 + i * 8) * k, '#fff', 5); }
  ctx.restore();
  text(ctx, 'ВСЁ РАВНО', W / 2, 330, { size: 110, scale: pop(t, V(49.2)) * popOut(t, V(51.4)), fill: '#5ff4ff', rot: .03 });
});

// ---------- S16a: second 20 minutes ----------
sc(V(51.7), V(53.25), (ctx, t) => {
  const prog = ease.ioS(inv(V(51.8), V(53.15), t));
  earthScene(ctx, t, { z: 1.0, pos: -prog, emo: 'cool', bottomLabel: pop(t, V(52.6)), lookY: 1 });
  timerBox(ctx, W / 2, 300, 1200 + prog * 1200, { label: 'ВРЕМЯ ПАДЕНИЯ' });
}, { tout: 'cutFlash' });

// ---------- S16b-S18: Pacific: burst out, apex silence, fall back ----------
const OCEAN_Y = [[V(53.2), 2100], [V(53.42), 1250], [V(54.3), 760], [V(55.3), 560], [V(56.2), 530], [V(57.05), 545], [V(57.7), 900], [V(58.15), 1260], [V(59.0), 2300]];
sc(V(53.25), V(58.95), (ctx, t) => {
  const lt = t - V(53.25);
  const hy = trackM(OCEAN_Y, t);
  const camY = clamp(hy - 260, 300, 2400);
  const z = track([[V(53.25), 1.0], [V(55.4), 1.05], [V(57.0), 1.25], [V(57.5), 1.1], [V(59), 1.0]], t);
  ctx.save(); cam(ctx, 540, camY, z);
  // sky
  ctx.fillStyle = vgrad(ctx, -800, 1250, ['#4fb4ff', '#bfe9ff']); ctx.fillRect(-600, -800, 2300, 2050);
  sun(ctx, 860, 120, 90, t);
  for (let i = 0; i < 4; i++) ell(ctx, ((i * 400 + t * 30) % 1800) - 400, 200 + i * 120, 120, 40, 'rgba(255,255,255,.85)');
  // hero
  const emo = t < V(55.4) ? 'joy' : t < V(57.05) ? 'awk' : 'scream';
  const pose = t < V(55.4) ? POSE.armsUp : t < V(57.05) ? POSE.stand : POSE.flail(t);
  person(ctx, { x: 540, y: hy, s: 1.05, emo, ...pose, blink: t > V(56.1) && t < V(56.25) ? 1 : 0, look: t > V(55.5) && t < V(57) ? { x: Math.sin(t * 2) > 0 ? 1 : -1, y: 0 } : { x: 0, y: 0 } });
  // seagull during silence
  const gk = inv(V(55.3), V(57.1), t);
  if (gk > 0 && gk < 1) {
    const gx = lerp(1300, -250, gk), gy = 300 + Math.sin(gk * 8) * 20, flap = Math.sin(t * 12) * .5;
    ctx.save(); ctx.translate(gx, gy); ell(ctx, 0, 0, 50, 26, '#fff', 6); circle(ctx, -50, -16, 22, '#fff', 6); poly(ctx, [-70, -16, -96, -8, -70, -6], '#ffb020', 4); circle(ctx, -54, -22, 5, OUT);
    ctx.save(); ctx.rotate(flap); ell(ctx, 10, -30, 60, 16, '#e8eef7', 6, -.4); ctx.restore(); ctx.restore();
  }
  // sea (in front of hero below surface)
  ctx.fillStyle = vgrad(ctx, 1250, 2800, ['#1f8fff', '#0a3a8a', '#06204a']); ctx.fillRect(-600, 1250, 2300, 2000);
  ctx.save(); ctx.globalAlpha = .5; ctx.beginPath(); ctx.moveTo(-600, 1250); for (let x = -600; x <= 1700; x += 30) ctx.lineTo(x, 1250 + Math.sin(x * .02 + t * 3) * 14); ctx.lineTo(1700, 1300); ctx.lineTo(-600, 1300); ctx.fill(); ctx.restore();
  ctx.beginPath(); for (let x = -600; x <= 1700; x += 30) ctx.lineTo(x, 1250 + Math.sin(x * .02 + t * 3) * 14); ctx.lineWidth = 8; ctx.strokeStyle = '#fff'; ctx.stroke();
  // underwater body (behind surface overlay) - draw hero tinted when under
  if (hy > 1250) { ctx.save(); ctx.beginPath(); ctx.rect(-600, 1256, 2300, 2000); ctx.clip(); ctx.globalAlpha = .55; person(ctx, { x: 540, y: hy, s: 1.05, emo, ...pose }); ctx.restore(); }
  // splashes
  for (const t0 of [V(53.42), V(58.15)]) {
    const k = inv(t0, t0 + 1.1, t); if (k <= 0 || k >= 1) continue;
    for (let i = 0; i < 26; i++) { const a = -Math.PI / 2 + (hash(i + t0) - .5) * 1.6; const sp = 500 + hash(i * 3) * 700; const x = 540 + Math.cos(a) * sp * k; const y = 1250 + Math.sin(a) * sp * k + 900 * k * k; circle(ctx, x, y, (1 - k) * (14 + hash(i) * 16), '#dff6ff', 4); }
    ell(ctx, 540, 1250, 220 * ease.outC(k), 40 * ease.outC(k), null, 0); ctx.save(); ctx.globalAlpha = 1 - k; ell(ctx, 540, 1250, 260 * ease.outC(k), 46 * ease.outC(k), null, 0); ctx.lineWidth = 10; ctx.strokeStyle = '#fff'; ctx.stroke(); ctx.restore();
  }
  if (hy > 1300) bubbles(ctx, t, { n: 24, spd: 500 });
  ctx.restore();
  stamp(ctx, 'ТИХИЙ ОКЕАН', W / 2, 330, t, V(54.28), { size: 96, bg: '#2f8cff', fill: '#fff', out: V(55.4) });
  text(ctx, '...', W / 2, 330, { size: 120, alpha: clamp(inv(V(55.5), V(55.8), t)) * (1 - clamp(inv(V(56.9), V(57.1), t))) });
}, { mb: t => (t > V(53.25) && t < V(53.6)) || t > V(57.5) ? 3 : 1 });

// ---------- S19a: back and forth for life ----------
function oscPhase(t) {
  const t0 = V(58.95);
  if (t < V(60.1)) return trackM([[t0, 0], [V(59.55), Math.PI], [V(60.1), TAU]], t);
  return TAU + (t - V(60.1)) * TAU * 1.15;
}
sc(V(58.95), V(62.75), (ctx, t) => {
  const ph = oscPhase(t);
  const beard = ease.io(inv(V(60.6), V(62.0), t));
  earthScene(ctx, t, { z: 1.0, pos: Math.cos(ph), emo: beard > .5 ? 'bored' : 'scream', beard, pal: beard > .5 ? { ...PAL.hero, hair: '#d9d9e8' } : PAL.hero, labels: 0 });
  const year = 2026 + Math.floor(Math.max(0, ph - TAU) / TAU * 5.5) + (t > V(62.0) ? Math.floor((t - V(62.0)) * 18) : 0);
  ctx.save(); ctx.translate(W / 2, 300); rr(ctx, -200, -70, 400, 140, 34); fillStroke(ctx, '#111', 8, '#fff');
  ctx.font = `900 92px ${F_HEAD}`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillStyle = '#ffe14d'; ctx.fillText(String(Math.min(year, 2097)), 0, 6); ctx.restore();
  text(ctx, 'ГОД', W / 2, 188, { size: 40, weight: 800 });
  text(ctx, 'ТУДА', 230, 1000, { size: 76, scale: pop(t, V(59.0)) * popOut(t, V(60.4)), fill: '#5ff4ff', rot: -.1 });
  text(ctx, 'СЮДА', 850, 1000, { size: 76, scale: pop(t, V(59.6)) * popOut(t, V(60.4)), fill: '#ff4fa3', rot: .1 });
}, { tout: 'whipR' });

// ---------- S19b: literally a pendulum ----------
sc(V(62.75), V(64.1), (ctx, t) => {
  const lt = t - V(62.75);
  ctx.fillStyle = vgrad(ctx, 0, H, ['#3a2a5a', '#1b1238']); ctx.fillRect(0, 0, W, H);
  wallpaper(ctx, 0, 0, W, 1500, '#4b3a78', '#55448a', 80);
  floorBoards(ctx, 0, 1500, W, 420, '#7a4a2a', '#5f3920');
  const z = track([[0, 1.15], [1.35, 1.05]], lt);
  ctx.save(); cam(ctx, 540, 900, z);
  rr(ctx, 290, 120, 500, 1380, 40); fillStroke(ctx, '#8a4a22', 9);
  circle(ctx, 540, 330, 170, '#fff6e0', 9);
  for (let i = 0; i < 12; i++) { const a = i / 12 * TAU; line(ctx, 540 + Math.cos(a) * 140, 330 + Math.sin(a) * 140, 540 + Math.cos(a) * 155, 330 + Math.sin(a) * 155, 6, OUT); }
  line(ctx, 540, 330, 540 + Math.cos(t * 2) * 90, 330 + Math.sin(t * 2) * 90, 9, OUT); line(ctx, 540, 330, 540 + Math.cos(t * .3) * 60, 330 + Math.sin(t * .3) * 60, 12, OUT);
  rr(ctx, 350, 540, 380, 900, 30); fillStroke(ctx, '#2a1a40', 8);
  // pendulum: hero hanging
  const ang = Math.sin(lt * Math.PI * 1.6) * .32;
  ctx.save(); ctx.beginPath(); rr(ctx, 350, 540, 380, 900, 30); ctx.clip();
  ctx.translate(540, 560); ctx.rotate(-ang);
  line(ctx, 0, 0, 0, 290, 14, '#ffd23f');
  person(ctx, { x: 0, y: 575, s: .82, emo: 'bored', ...POSE.hang, pal: { ...PAL.hero, hair: '#d9d9e8' }, blink: blinkAt(t, 12) });
  // beard
  ctx.beginPath(); ctx.moveTo(-40, 335); ctx.quadraticCurveTo(0, 470, 40, 335); ctx.quadraticCurveTo(0, 375, -40, 335); fillStroke(ctx, '#e8e8f0', 5);
  ctx.restore();
  ctx.save(); ctx.globalAlpha = .18; rr(ctx, 350, 540, 380, 900, 30); ctx.fillStyle = '#fff'; ctx.fill(); ctx.restore();
  ctx.restore();
  stamp(ctx, 'МАЯТНИК', W / 2, 640, t, V(62.92), { size: 110, bg: '#ffe14d', rot: -.06 });
}, { tout: 'whipU' });
