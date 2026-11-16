// ===== Scenes: "Всё, что пожелаешь — появляется в ж*пе" =====
const SCENES = [];
const sc = (a, b, draw, o = {}) => SCENES.push({ a, b, draw, ...o });
const ITEMS_ALL = { pizza: 1, ext: 1, truck: 1 };

function bedroomBg(ctx, t) {
  wallpaper(ctx, -600, -300, 2300, 1550, '#b9a8ff', '#ab98f7', 90);
  windowFrame(ctx, 620, 330, 300, 330, ['#ffb36b', '#ffe7a8'], t);
  ctx.save(); ctx.translate(250, 520); ctx.rotate(-.05); rr(ctx, -90, -120, 180, 240, 10); fillStroke(ctx, '#ffd23f', 6); circle(ctx, 0, -10, 50, '#ff4fa3', 5); ctx.restore();
  floorBoards(ctx, -600, 1250, 2300, 700, '#c8834a', '#b06e38');
  rr(ctx, -200, 1050, 760, 120, 30); fillStroke(ctx, '#2f8cff', 7); rr(ctx, -230, 900, 60, 350, 20); fillStroke(ctx, '#2f8cff', 7);
  line(ctx, -150, 1170, -150, 1250, 16, OUT); line(ctx, 500, 1170, 500, 1250, 16, OUT);
  rr(ctx, 600, 1100, 150, 150, 12); fillStroke(ctx, '#c8834a', 6);
}
function smallPhone(ctx, x, y, s, t, buzz) {
  const b = buzz ? Math.sin(t * 60) * 5 : 0;
  ctx.save(); ctx.translate(x + b, y); ctx.scale(s, s); rr(ctx, -40, -70, 80, 140, 16); fillStroke(ctx, '#17132b', 6); rr(ctx, -32, -60, 64, 120, 10); fillStroke(ctx, buzz ? '#5ff4ff' : '#2b2f55', 0); ctx.restore();
  if (buzz) for (const sd of [-1, 1]) { ctx.save(); ctx.globalAlpha = .7; ctx.beginPath(); ctx.arc(x, y, 80 * s, sd > 0 ? -.5 : Math.PI - .5, sd > 0 ? .5 : Math.PI + .5); ctx.lineWidth = 6; ctx.strokeStyle = OUT; ctx.stroke(); ctx.restore(); }
}
function confetti(ctx, t, t0, n = 40) {
  const lt = t - t0; if (lt < 0 || lt > 2.2) return;
  for (let i = 0; i < n; i++) { const x = W / 2 + (hash(i) - .5) * 1300 * Math.min(1, lt * 2.5); const y = 600 - (500 + hash(i + 2) * 400) * lt + 900 * lt * lt; ctx.save(); ctx.translate(x, y); ctx.rotate(lt * 8 + i); ctx.fillStyle = ['#ffd23f', '#ff4fa3', '#5ff4ff', '#2fbf71', '#ff7a1a'][i % 5]; ctx.fillRect(-10, -5, 20, 10); ctx.restore(); }
}
function bigShout(ctx, str, t, t0, t1, o = {}) {
  const k = pop(t, t0, .25) * popOut(t, t1, .2); if (k <= 0) return;
  const sh = shake(t, 10, 18);
  text(ctx, str, W / 2 + sh.x, (o.y || 330) + sh.y, { size: o.size || 120, scale: k, fill: o.fill || '#ff3b3b', rot: -.04 + sh.r * 20, sw: 26 });
}
function magicSwirl(ctx, x, y, t, t0, dur = 1.1) {
  const lt = t - t0; if (lt < 0 || lt > dur) return; const k = lt / dur;
  for (let i = 0; i < 14; i++) { const a = i / 14 * TAU + k * 9; const r = 260 * (1 - k) + 20; star4(ctx, x + Math.cos(a) * r, y + Math.sin(a) * r * .6 + k * 80, 18 * (1 - k * .5), i % 2 ? '#ffe14d' : '#fff'); }
}

// ---------- A. Hook: x-ray flash-forward ----------
sc(0, 4.4, (ctx, t) => {
  ctx.fillStyle = vgrad(ctx, 0, H, ['#0b0b2a', '#1b1050']); ctx.fillRect(0, 0, W, H);
  const pulse = .5 + .5 * Math.sin(t * TAU * 2); ctx.save(); ctx.globalAlpha = .25 * pulse; ctx.fillStyle = '#ff9a1a'; ctx.fillRect(0, 0, W, H); ctx.restore();
  const z = track([[0, 1.25], [4.4, 1.0]], t); ctx.save(); cam(ctx, 540, 1000, z, Math.sin(t) * .02);
  xray(ctx, 540, 960, .9, t, ITEMS_ALL); ctx.restore();
  text(ctx, 'ЧТО ЕСЛИ ВСЁ,\nЧТО ТЫ ПОЖЕЛАЕШЬ…', W / 2, 230, { size: 80, scale: pop(t, .05), fill: '#fff', sw: 18 });
  text(ctx, '…ПОЯВЛЯЕТСЯ\nВ Ж*ПЕ?', W / 2, 1640, { size: 112, scale: pop(t, 2.6), fill: '#ffe14d', rot: -.03, sw: 20 });
}, { tout: 'whipU', noSubs: true });

// ---------- B. Wake up + phone message ----------
const MSGS = [[7.16, 'Поздравляем!', { bg: '#ffe14d', size: 56, weight: 900 }], [8.04, 'Теперь любое твоё желание исполняется!', {}], [10.52, 'Но есть маленький минус:', { bg: '#ff4d6d', fill: '#fff' }], [12.48, 'любой предмет, который ты пожелаешь, появляется у тебя в ж*пе.', {}], [15.68, 'ЦЕЛИКОМ.', { bg: '#17132b', fill: '#ffe14d', size: 60, weight: 900, border: '#ffe14d' }], [16.76, 'БУКВАЛЬНО.', { bg: '#17132b', fill: '#ff4d6d', size: 60, weight: 900, border: '#ff4d6d' }]];
function phoneChat(ctx, t, msgs, title) {
  return (c, w, h) => {
    c.fillStyle = 'rgba(255,255,255,.08)'; c.fillRect(-w / 2, -h / 2, w, 150);
    circle(c, -w / 2 + 80, -h / 2 + 100, 34, '#ffe14d', 4); star4(c, -w / 2 + 80, -h / 2 + 100, 22, '#ff7a1a');
    c.font = `900 40px ${F_HEAD}`; c.fillStyle = '#fff'; c.textAlign = 'left'; c.textBaseline = 'middle'; c.fillText(title, -w / 2 + 130, -h / 2 + 100);
    let y = -h / 2 + 190;
    msgs.forEach(([tt, str, o]) => { const k = ease.outBack(clamp((t - tt + .05) / .3), 1.6); if (k <= 0) return; const hh = bubble(c, -w / 2 + 34, y, w - 70, str, { size: 54, ...o, scale: k }); y += (hh + 22) * Math.min(1, k); });
  };
}
sc(4.4, 17.45, (ctx, t) => {
  const lt = t - 4.4;
  const rise = ease.outBack(inv(6.15, 6.7, t), 1.2);
  const z = track([[4.4, 1.5], [6.2, 1.3], [17.45, 1.2]], t);
  ctx.save(); if (rise > .05) ctx.filter = `blur(${8 * clamp(rise)}px) brightness(${1 - .35 * clamp(rise)})`;
  ctx.save(); cam(ctx, 380, 1060, z);
  bedroomBg(ctx, t);
  ctx.save(); ctx.translate(540, 1035); ctx.rotate(-Math.PI / 2);
  person(ctx, { x: 0, y: 0, s: .95, emo: t < 4.64 ? 'closed' : (t > 5.9 ? 'shock' : 'calm'), legs: [0, 0, 0, 0], arms: [.1, 0, -.1, 0], look: { x: -1, y: .5 }, blink: blinkAt(t, 2) });
  ctx.restore();
  rr(ctx, 300, 990, 280, 90, 30); fillStroke(ctx, '#ff4fa3', 7);
  smallPhone(ctx, 675, 1060, 1, t, t > 5.5 && t < 6.6);
  ctx.restore(); ctx.restore();
  if (rise > 0) {
    const py = lerp(2400, 900, clamp(rise)) + Math.sin(t * 1.4) * 8;
    ctx.save(); ctx.translate(W / 2, py); ctx.rotate(Math.sin(t * .9) * .02 + (1 - clamp(rise)) * .3); ctx.translate(-W / 2, -py);
    phoneFrame(ctx, W / 2, py, 820, 1380, phoneChat(ctx, t, MSGS, 'Исполнитель желаний'));
    ctx.restore();
  }
  confetti(ctx, t, 7.16);
}, { tout: 'whipL', noSubs: t => t > 6.4 });

// ---------- C. "Ха, это шутка" ----------
sc(17.45, 20.0, (ctx, t) => {
  const lt = t - 17.45;
  ctx.save(); cam(ctx, 420, 1000, 1.45 - lt * .04);
  bedroomBg(ctx, t);
  const laugh = Math.sin(t * 22) * 6;
  person(ctx, { x: 360, y: 1250 - 95 + laugh * .3, s: 1, emo: 'joy', legs: [-1.5, 1.5, -1.4, 1.4], arms: lt < 1.6 ? [-.4, -1.0, 1.0, 1.6] : [-2.2, -.6, 2.4, .4], lean: Math.sin(t * 11) * .06, face: .3, blink: 0 });
  // tossed phone
  const k = inv(1.5, 2.2, lt); if (lt < 1.5) smallPhone(ctx, 440, 1010, .8, t, false); else { const x = lerp(440, 120, k), y = lerp(1010, 1030, k) - Math.sin(k * Math.PI) * 220; ctx.save(); ctx.translate(x, y); ctx.rotate(k * 9); smallPhone(ctx, 0, 0, .8, t, false); ctx.restore(); }
  ctx.restore();
  text(ctx, 'ХА-ХА!', W / 2, 360, { size: 130, scale: pop(t, 18.84) * popOut(t, 19.8), fill: '#ffe14d', rot: Math.sin(t * 20) * .04 });
  text(ctx, 'ЭТО ШУТКА', W / 2, 520, { size: 80, scale: pop(t, 19.36) * popOut(t, 19.85), fill: '#fff' });
}, { tout: 'whipL' });

// ---------- D. Kitchen craving ----------
sc(20.0, 24.2, (ctx, t) => {
  const lt = t - 20.0;
  const z = track([[0, 1.25], [4.2, 1.45]], lt);
  ctx.save(); cam(ctx, lerp(380, 460, ease.io(inv(0, 4.2, lt))), 1000, z);
  kitchenBg(ctx, t);
  const x = trackM([[0, -150], [1.3, 380], [4.2, 400]], lt);
  person(ctx, { x, y: 1250, s: 1, emo: lt > 1.6 ? 'happy' : 'calm', face: .4, ...(lt < 1.3 ? POSE.walk(lt, 9) : POSE.stand), blink: blinkAt(t, 4), look: lt > 1.6 ? { x: .6, y: -1 } : { x: 1, y: 0 } });
  if (lt > 2.4) { const dk = (lt - 2.4) % 1.2 / 1.2; ctx.save(); ctx.globalAlpha = 1 - dk; ell(ctx, x + 18, 1250 - 360 + dk * 40, 8, 12 + dk * 10, '#8fd8ff', 3); ctx.restore(); }
  thought(ctx, x + 250, 560, 520, 420, c => { pizza(c, 0, 10, 140, t, { steam: true }); if (t > 23.1) cheeseSlice(c, 120, -60, .9, t); }, pop(t, 21.6, .45));
  ctx.restore();
});

// ---------- E. "Хочу пиццу" + countdown ----------
sc(24.2, 29.87, (ctx, t) => {
  const lt = t - 24.2;
  const z = track([[0, 1.35], [2.1, 1.35], [2.15, 1.55], [3.45, 1.55], [3.5, 1.8], [4.55, 1.8], [4.6, 2.1], [5.67, 2.25]], lt);
  ctx.save(); cam(ctx, 400, track([[0, 1000], [2.1, 1000], [5.67, 920]], lt), z);
  kitchenBg(ctx, t);
  const sus = t > 27.6;
  person(ctx, { x: 400, y: 1250, s: 1, emo: t < 25.9 ? 'happy' : sus ? (t > 29.4 ? 'worried' : 'bored') : 'calm', face: 0, ...POSE.stand, look: sus ? { x: Math.sin(t * 3) > 0 ? .8 : -.8, y: 0 } : { x: 0, y: 0 }, blink: blinkAt(t, 6) });
  magicSwirl(ctx, 400, 1050, t, 25.5, 1.0);
  ctx.restore();
  // speech
  const sk = pop(t, 25.1, .3) * popOut(t, 26.1, .2);
  if (sk > 0) { ctx.save(); ctx.translate(W / 2, 380); ctx.scale(sk, sk); rr(ctx, -330, -80, 660, 160, 70); fillStroke(ctx, '#fff', 8); poly(ctx, [-60, 70, 0, 70, -80, 150], '#fff', 0); text(ctx, 'ХОЧУ ПИЦЦУ!', 0, 4, { size: 80, stroke: false, shadow: false, fill: OUT }); ctx.restore(); }
  [[26.32, '1'], [27.68, '2'], [28.8, '3']].forEach(([tt, n], i) => { const k = pop(t, tt, .3) * popOut(t, tt + .9, .2); text(ctx, n, W / 2, 360, { size: 260, scale: k, fill: ['#5ff4ff', '#ffe14d', '#ff4d6d'][i], sw: 34 }); });
  text(ctx, 'И…', W / 2, 360, { size: 200, scale: pop(t, 29.4, .2), fill: '#fff', sw: 30 });
}, { tout: 'cutFlash' });

// ---------- F. CLIP 1: scream ----------
sc(29.87, 33.07, (ctx, t) => {
  const lt = t - 29.87; const sh = shake(t, 18, 20);
  ctx.save(); cam(ctx, 400 + sh.x, 950 + sh.y, track([[0, 1.6], [.3, 1.25], [3.2, 1.2]], lt), sh.r * 4);
  kitchenBg(ctx, t);
  const jump = lt < 1.2 ? Math.sin(Math.min(1, lt / 1.2) * Math.PI) * 420 : Math.abs(Math.sin((lt - 1.2) * 6)) * 160;
  const hx = 400 + Math.sin(lt * 5) * 60, hy = 1250 - jump;
  smoke(ctx, hx - 40, hy - 150, t, 1.3, 8);
  person(ctx, { x: hx, y: hy, s: 1.05, emo: 'scream', ...POSE.armsUp, lean: Math.sin(lt * 9) * .12, look: { x: 0, y: -1 } });
  flames(ctx, hx - 50, hy - 110, 130, t);
  ctx.restore();
  bigShout(ctx, 'АААААА!', t, 29.95, 31.0, { size: 170 });
  bigShout(ctx, 'ЧТО-ТО ГОРИТ\nВ Ж*ПЕ!', t, 31.0, 33.0, { size: 104, fill: '#ff7a1a' });
  if (lt > 1.8) { ctx.save(); ctx.translate(880, 900); ctx.rotate(.06); xray(ctx, 0, 0, .28 * ease.outBack(clamp((lt - 1.8) / .3)), t, { pizza: 1 }); ctx.restore(); }
}, { noSubs: true, tout: 'whipR' });

// ---------- G. Jumping around + whole house ----------
sc(33.07, 37.15, (ctx, t) => {
  const lt = t - 33.07;
  if (t < 34.6) {
    ctx.save(); cam(ctx, 520, 960, 1.15);
    kitchenBg(ctx, t);
    const ph = lt * 3.2; const hx = 540 + Math.sin(ph) * 380; const hy = 1250 - Math.abs(Math.sin(ph * 2)) * 260;
    for (let i = 1; i < 6; i++) { const pp = ph - i * .15; ctx.save(); ctx.globalAlpha = .4 * (1 - i / 6); circle(ctx, 540 + Math.sin(pp) * 380 - 30, 1250 - Math.abs(Math.sin(pp * 2)) * 260 - 150, 50 - i * 5, '#8d8d9e'); ctx.restore(); }
    person(ctx, { x: hx, y: hy, s: 1, emo: 'scream', ...POSE.flail(t), face: Math.cos(ph) > 0 ? 1 : -1 });
    flames(ctx, hx - 40 * Math.sign(Math.cos(ph)), hy - 110, 100, t);
    // falling pans
    for (let i = 0; i < 3; i++) { const k = inv(33.3 + i * .35, 34.0 + i * .35, t); if (k <= 0) continue; ctx.save(); ctx.translate(420 + i * 90, lerp(510, 1230, ease.inQ(k))); ctx.rotate(k * 6); ell(ctx, 0, 0, 44, 16, '#9aa3b5', 5); line(ctx, 44, 0, 110, 0, 12, OUT); ctx.restore(); }
    ctx.restore();
  } else {
    // building exterior shaking
    const sh = shake(t, 9, 16);
    ctx.fillStyle = vgrad(ctx, 0, H, ['#5fc4ff', '#cdefff']); ctx.fillRect(0, 0, W, H);
    ctx.save(); cam(ctx, 540 + sh.x, 960 + sh.y, track([[34.6, 1.0], [37.2, 1.1]], t), sh.r * 3);
    rr(ctx, 190, 200, 700, 1300, 10); fillStroke(ctx, '#ffb36b', 8);
    for (let r = 0; r < 7; r++) for (let c = 0; c < 4; c++) { const lit = r === 4 && c === 1; rr(ctx, 240 + c * 160, 260 + r * 170, 110, 120, 6); fillStroke(ctx, lit ? '#ffe14d' : '#7fd4ff', 6); }
    smoke(ctx, 345, 920, t, 1, 6);
    ctx.fillStyle = '#3ad07a'; ctx.fillRect(-200, 1500, 1500, 500); line(ctx, -200, 1500, 1300, 1500, 8, OUT);
    for (let i = 0; i < 5; i++) { const k = (t - 34.7 - i * .1); if (k < 0) continue; const bx = 300 + i * 120 + k * 300 * (i % 2 ? 1 : -1), by = 200 - k * 400; ctx.save(); ctx.translate(bx, by); ctx.beginPath(); ctx.moveTo(-20, 0); ctx.quadraticCurveTo(-10, -14 * Math.sin(t * 20), 0, 0); ctx.quadraticCurveTo(10, -14 * Math.sin(t * 20), 20, 0); ctx.lineWidth = 6; ctx.strokeStyle = OUT; ctx.stroke(); ctx.restore(); }
    ctx.restore();
    text(ctx, 'АААА!', 345 + sh.x * 2, 760, { size: 90, scale: pop(t, 34.65), fill: '#fff', rot: -.1 });
    stamp(ctx, 'ЭТО НЕ ШУТКА', W / 2, 330, t, 35.44, { size: 96, bg: '#ff3b3b', fill: '#fff' });
  }
}, { tout: 'whipL' });

// ---------- H. "Надо тушить!" + CLIP 2 ----------
sc(37.15, 41.6, (ctx, t) => {
  const sh = shake(t, t > 39.65 ? 12 : 5, 16);
  ctx.save(); cam(ctx, 420 + sh.x, 980 + sh.y, track([[37.15, 1.3], [39.6, 1.35], [39.7, 1.6], [41.6, 1.7]], t), sh.r);
  kitchenBg(ctx, t);
  const shout = t > 39.6;
  smoke(ctx, 380, 1100, t, 1.1, 7);
  person(ctx, { x: 420 + (shout ? 0 : Math.sin(t * 14) * 30), y: 1250, s: 1, emo: shout ? 'scream' : 'worried', ...(shout ? { legs: [.3, -.2, -.3, .2], arms: [-1.0, 2.6, 1.0, -2.6] } : POSE.flail(t)), look: { x: 0, y: -1 } });
  flames(ctx, 370, 1140, 90, t);
  magicSwirl(ctx, 420, 1050, t, 40.4, 1.0);
  ctx.restore();
  text(ctx, 'ТУШИТЬ!', W / 2, 340, { size: 140, scale: pop(t, 37.4) * popOut(t, 39.4), fill: '#5ff4ff', rot: .04 });
  bigShout(ctx, 'ХОЧУ\nОГНЕТУШИТЕЛЬ!', t, 39.68, 41.45, { size: 110, fill: '#ff3b3b', y: 360 });
}, { noSubs: t => t > 39.6 });

// ---------- I. Silence ----------
sc(41.6, 42.8, (ctx, t) => {
  ctx.save(); ctx.filter = 'saturate(.35) brightness(.85)';
  ctx.save(); cam(ctx, 420, 940, 1.75 + (t - 41.6) * .05);
  kitchenBg(ctx, t);
  person(ctx, { x: 420, y: 1250, s: 1, emo: 'shock', legs: [.3, -.2, -.3, .2], arms: [-1.0, 2.6, 1.0, -2.6], look: { x: 0, y: 0 } });
  ctx.restore(); ctx.restore();
  text(ctx, 'тишина…', W / 2, 360, { size: 80, weight: 700, alpha: clamp(inv(41.65, 41.9, t)), stroke: false, shadow: false, fill: '#fff', ls: 8 });
}, { tout: 'cutFlash', noSubs: true });

// ---------- J. Realisation + extinguisher showcase + x-ray ----------
sc(42.8, 51.5, (ctx, t) => {
  if (t < 45.9) {
    ctx.fillStyle = vgrad(ctx, 0, H, ['#ffd98f', '#ffb36b']); ctx.fillRect(0, 0, W, H);
    const z = track([[42.8, 1.0], [45.9, 1.12]], t);
    ctx.save(); cam(ctx, 540, 900, z);
    person(ctx, { x: 540, y: 1900, s: 2.8, emo: t > 43.9 ? 'scream' : 'worried', look: { x: 0, y: t > 44.4 ? 1 : 0 }, arms: [-.3, .2, .3, -.2], legs: [0, 0, 0, 0] });
    ctx.restore();
    text(ctx, 'ЗРЯ…', W / 2, 330, { size: 150, scale: pop(t, 43.6), fill: '#ff3b3b', rot: -.05 });
  } else if (t < 48.4) {
    ctx.fillStyle = rgrad(ctx, 540, 900, 50, 1200, ['#3a2a5a', '#120c24']); ctx.fillRect(0, 0, W, H);
    ctx.save(); ctx.globalAlpha = .35; poly(ctx, [440, 0, 640, 0, 900, 1500, 180, 1500], '#fff6c8', 0); ctx.restore();
    ell(ctx, 540, 1350, 300, 60, '#2a2040', 8);
    const rotK = Math.sin((t - 45.9) * 2.2);
    ctx.save(); ctx.translate(540, 1000 + Math.sin(t * 2) * 10); ctx.scale(.85 + .15 * Math.abs(rotK), 1); extinguisher(ctx, 0, 0, 1.45, { rot: 0 }); ctx.restore();
    sparkles(ctx, 540, 900, t, 45.95, { n: 12, r: 380 });
    [['КРАСНЫЙ', 45.96, '#ff3b3b'], ['ЖЕЛЕЗНЫЙ', 46.92, '#c9d2e6'], ['ТЯЖЁЛЫЙ', 47.56, '#ffe14d']].forEach(([s, tt, col], i) => {
      const k = pop(t, tt, .3); if (k <= 0) return; const y = 260 + i * 150;
      ctx.save(); ctx.translate(W / 2, y); ctx.scale(k * 1.3, k * 1.3); rr(ctx, -260, -48, 520, 96, 30); fillStroke(ctx, '#17132b', 6, col);
      circle(ctx, -200, 0, 28, '#2fbf71', 4); line(ctx, -214, 0, -204, 12, 7, '#fff'); line(ctx, -204, 12, -186, -12, 7, '#fff');
      text(ctx, s, 30, 2, { size: 58, fill: col, sw: 8 }); ctx.restore();
    });
  } else {
    ctx.fillStyle = vgrad(ctx, 0, H, ['#0b0b2a', '#1b1050']); ctx.fillRect(0, 0, W, H);
    ctx.save(); cam(ctx, 540, 960, track([[48.4, 1.0], [51.5, 1.12]], t));
    xray(ctx, 540, 1000, .82, t, { pizza: 1, ext: inv(49.0, 49.7, t) });
    ctx.restore();
    stamp(ctx, 'ЦЕЛИКОМ', W / 2, 300, t, 50.32, { size: 120, bg: '#ff3b3b', fill: '#fff' });
  }
}, { tout: 'whipU' });

// ---------- K. Frozen: can't sit, stand, move ----------
function chip(ctx, x, y, k, fn, cross = 0) {
  if (k <= 0) return; ctx.save(); ctx.translate(x, y); ctx.scale(k, k); circle(ctx, 0, 0, 92, '#fff', 8); fn(ctx); ctx.restore(); crossOut(ctx, x, y, 70 * k, cross);
}
sc(51.5, 59.2, (ctx, t) => {
  const lt = t - 51.5;
  ctx.save(); cam(ctx, 540, 980, track([[0, 1.15], [7.7, 1.3]], lt));
  kitchenBg(ctx, t);
  const sitTry = t > 56.17 && t < 56.8 ? Math.sin(inv(56.17, 56.8, t) * Math.PI) : 0;
  const standTry = t > 56.93 && t < 57.5 ? Math.sin(inv(56.93, 57.5, t) * Math.PI) : 0;
  const tremble = Math.sin(t * 40) * 3;
  smoke(ctx, 500, 1080, t, .8, 5);
  person(ctx, { x: 540 + tremble, y: 1250 + sitTry * 40 - standTry * 30, s: 1.1, emo: 'awk', legs: [.7, -1.2, -.7, 1.2], arms: [-1.2, -.4, 1.2, .4], lean: .15, look: { x: 0, y: 0 }, blink: 0 });
  // chair
  rr(ctx, 160, 1000, 160, 26, 6); fillStroke(ctx, '#c8834a', 5); line(ctx, 170, 1026, 170, 1250, 10, OUT); line(ctx, 310, 1026, 310, 1250, 10, OUT); line(ctx, 170, 1000, 170, 820, 10, OUT);
  ctx.restore();
  // status chips: burning pizza, extinguisher
  chip(ctx, 300, 330, pop(t, 52.8), c => { pizza(c, 0, 10, 52, t); flames(c, 0, -10, 70, t); });
  chip(ctx, 540, 330, pop(t, 53.6), c => extinguisher(c, 0, 10, .3, { rot: .3 }));
  // attempts row
  const row = [['СЕСТЬ', 56.17], ['ВСТАТЬ', 56.93], ['ДВИГАТЬСЯ', 57.77]];
  row.forEach(([s, tt], i) => { const k = pop(t, tt - .05, .25); if (k <= 0) return; const x = 210 + i * 330; ctx.save(); ctx.translate(x, 560); ctx.scale(k, k); rr(ctx, -150, -50, 300, 100, 30); fillStroke(ctx, '#17132b', 6, '#ff3b3b'); text(ctx, s, 0, 2, { size: 46, fill: '#fff', sw: 6 }); ctx.restore(); crossOut(ctx, x, 560, 60, clamp((t - tt - .15) / .4)); });
}, { tout: 'whipL' });

// ---------- L. Panic thought + CLIP 3 ----------
sc(59.2, 64.82, (ctx, t) => {
  const shout = t > 62.8; const sh = shake(t, shout ? 12 : 3, 16);
  ctx.save(); cam(ctx, 460 + sh.x, 960 + sh.y, track([[59.2, 1.2], [62.7, 1.35], [62.85, 1.6], [64.8, 1.7]], t), sh.r);
  kitchenBg(ctx, t);
  smoke(ctx, 420, 1100, t, .8, 5);
  person(ctx, { x: 460, y: 1250, s: 1, emo: shout ? 'scream' : 'worried', ...(shout ? { legs: [.7, -1.2, -.7, 1.2], arms: [-1.0, 2.6, 1.0, -2.6] } : { legs: [.7, -1.2, -.7, 1.2], arms: [-1.2, -.4, 1.2, .4] }), lean: .15, look: { x: 0, y: -1 }, blink: blinkAt(t, 8) });
  if (!shout) thought(ctx, 590, 560, 560, 420, c => { text(c, 'НАДО ВСЁ\nВЫТАЩИТЬ!', 0, 0, { size: 62, fill: '#ff3b3b', sw: 10 }); }, pop(t, 60.4, .4) * popOut(t, 62.6));
  magicSwirl(ctx, 460, 1050, t, 63.6, 1.0);
  ctx.restore();
  bigShout(ctx, 'ХОЧУ\nЭВАКУАТОР!', t, 62.86, 64.7, { size: 130, fill: '#ffb020', y: 380 });
}, { noSubs: t => t > 62.8, tout: 'cutFlash' });

// ---------- M. Tow truck appears "там же" ----------
sc(64.82, 71.3, (ctx, t) => {
  if (t < 66.75) {
    ctx.fillStyle = vgrad(ctx, 0, H, ['#7fd4ff', '#d8f3ff']); ctx.fillRect(0, 0, W, H);
    thought(ctx, W / 2, 900, 980, 860, c => {
      c.fillStyle = '#9aa3b5'; c.fillRect(-460, 150, 920, 60);
      const k = (t - 64.82) / 1.9; const dx = -k * 160;
      towTruck(c, 120 + dx, 150, .75, t);
      line(c, -100 + dx, 30, -260 + dx, -20, 6, OUT);
      c.save(); c.translate(-300 + dx, 150); c.rotate(-.2); person(c, { x: 0, y: 0, s: .6, emo: 'happy', ...POSE.armsUp }); c.restore();
    }, pop(t, 64.85, .4));
    text(ctx, 'МЕЧТА:', W / 2, 330, { size: 90, scale: pop(t, 64.9), fill: '#2f8cff', sw: 14 });
  } else {
    ctx.fillStyle = vgrad(ctx, 0, H, ['#0b0b2a', '#1b1050']); ctx.fillRect(0, 0, W, H);
    const blinkAll = t > 70.0 ? (.5 + .5 * Math.sin(t * TAU * 2)) : 0;
    ctx.save(); cam(ctx, 540, 960, track([[66.75, 1.25], [67.2, 1.0], [71.3, 1.06]], t));
    xray(ctx, 540, 1010, .8, t, { pizza: 1, ext: 1, truck: inv(66.8, 67.4, t) });
    ctx.restore();
    if (blinkAll) { ctx.save(); ctx.globalAlpha = blinkAll * .22; ctx.fillStyle = '#ff9a1a'; ctx.fillRect(0, 0, W, H); ctx.restore(); }
    text(ctx, 'РЕАЛЬНОСТЬ:', W / 2, 250, { size: 80, scale: pop(t, 66.8), fill: '#ff4d6d', sw: 14 });
    stamp(ctx, 'ЦЕЛИКОМ', W / 2, 400, t, 68.98, { size: 110, bg: '#ff3b3b', fill: '#fff', out: 70.0 });
    stamp(ctx, 'С МИГАЛКОЙ', W / 2, 400, t, 70.1, { size: 110, bg: '#ffb020', fill: OUT, rot: .04 });
  }
}, { tout: 'whipL' });

// ---------- N. Inventory ----------
sc(71.3, 76.9, (ctx, t) => {
  const pulse = t > 75.2 ? (.5 + .5 * Math.sin((t - 75.2) * TAU * 2)) : 0;
  ctx.fillStyle = vgrad(ctx, 0, H, ['#1b1050', '#0b0b2a']); ctx.fillRect(0, 0, W, H);
  ctx.save(); cam(ctx, 540, 960, track([[71.3, 1.1], [76.9, 1.0]], t));
  rr(ctx, 90, 300, 900, 1050, 50); fillStroke(ctx, '#2b2160', 10, '#7b6cff');
  text(ctx, 'ИНВЕНТАРЬ (Ж*ПА)', 540, 390, { size: 60, fill: '#ffe14d', sw: 10 });
  const slots = [[72.38, c => { pizza(c, 0, 0, 90, t); flames(c, 0, -20, 110, t); }, 'Пицца (горит)'], [72.86, c => extinguisher(c, 0, 20, .52, { rot: .3 }), 'Огнетушитель'], [73.84, c => towTruck(c, 0, 60, .36, t), 'Эвакуатор']];
  slots.forEach(([tt, fn, label], i) => {
    const y = 600 + i * 260; rr(ctx, 150, y - 110, 780, 220, 30); fillStroke(ctx, '#17132b', 6, '#7b6cff');
    rr(ctx, 175, y - 90, 180, 180, 24); fillStroke(ctx, '#3a2f80', 5, '#7b6cff');
    const k = ease.outBack(clamp((t - tt) / .3), 1.8); if (k <= 0) return;
    ctx.save(); ctx.translate(265, y); ctx.scale(k, k); fn(ctx); ctx.restore();
    text(ctx, label, 400, y, { size: 52, align: 'left', fill: '#fff', sw: 8, alpha: k });
    sparkles(ctx, 265, y, t, tt, { n: 8, r: 140 });
  });
  text(ctx, '3 / 3  ПЕРЕПОЛНЕНО', 540, 1300, { size: 52, fill: '#ff4d6d', sw: 8, scale: pop(t, 74.2) });
  ctx.restore();
  if (pulse) { ctx.save(); ctx.globalAlpha = pulse * .28; ctx.fillStyle = '#ff9a1a'; ctx.fillRect(0, 0, W, H); ctx.restore(); }
}, { tout: 'whipU' });

// ---------- O. Ambulance call (split screen) ----------
sc(76.9, 88.8, (ctx, t) => {
  const blink = .5 + .5 * Math.sin(t * TAU * 2);
  // TOP: dispatcher
  ctx.save(); ctx.beginPath(); ctx.rect(0, 0, W, 940); ctx.clip();
  ctx.fillStyle = vgrad(ctx, 0, 940, ['#3f7bff', '#2a54c9']); ctx.fillRect(0, 0, W, 940);
  ctx.save(); cam(ctx, 540, 560, track([[76.9, 1.0], [84.3, 1.15], [87.4, 1.25]], t), 0, W / 2, 470);
  for (let i = 0; i < 4; i++) { rr(ctx, -100 + i * 340, 260, 240, 160, 14); fillStroke(ctx, '#17132b', 6); ctx.fillStyle = '#3df27a'; ctx.fillRect(-80 + i * 340, 290, 120, 10); }
  const frozen = t > 84.36 && t < 87.4;
  const dp = person(ctx, { x: 540, y: 1060, s: 1.3, pal: PAL.disp, emo: frozen ? 'bored' : t > 80.0 && t < 80.9 ? 'calm' : 'calm', face: -.2, look: { x: frozen ? 0 : -.5, y: 0 }, blink: frozen ? 0 : blinkAt(t, 30), arms: [-.3, .2, .6, -1.4] });
  headset(ctx, dp.hc, 1.3);
  rr(ctx, 200, 900, 680, 50, 10); fillStroke(ctx, '#c8834a', 6);
  ctx.restore();
  // bubbles
  const b1 = pop(t, 80.1, .3) * popOut(t, 82.0); if (b1 > 0) bubble(ctx, 470, 110, 560, 'Что случилось?', { scale: b1, size: 62, weight: 900 });
  if (frozen) { const s = Math.min(10, Math.floor((t - 84.36) / 3.04 * 10) + 1); ctx.save(); ctx.translate(200, 160); rr(ctx, -130, -60, 260, 120, 30); fillStroke(ctx, '#17132b', 6, '#fff'); text(ctx, s + ' сек', 0, 2, { size: 56, fill: '#ffe14d', sw: 6 }); ctx.restore(); text(ctx, '…', 760, 200, { size: 120, fill: '#fff' }); }
  const b3 = pop(t, 87.4, .3); if (b3 > 0) bubble(ctx, 520, 110, 500, 'Выезжаем.', { scale: b3, size: 66, weight: 900, bg: '#ff4d6d', fill: '#fff' });
  ctx.restore();
  // divider
  ctx.fillStyle = '#17132b'; ctx.fillRect(0, 930, W, 26); text(ctx, 'ЗВОНОК: 103', W / 2, 943, { size: 36, fill: '#ff4d6d', sw: 0, stroke: false, shadow: false });
  // BOTTOM: hero stuck
  ctx.save(); ctx.beginPath(); ctx.rect(0, 956, W, 964); ctx.clip();
  ctx.save(); cam(ctx, 520, 1040, 1.05, 0, W / 2, 1300);
  kitchenBg(ctx, t);
  ctx.save(); ctx.globalAlpha = blink * .45; ctx.fillStyle = rgrad(ctx, 500, 1130, 0, 500, ['rgba(255,170,30,.9)', 'rgba(255,170,30,0)']); ctx.fillRect(0, 600, 1100, 1100); ctx.restore();
  const hp = person(ctx, { x: 520, y: 1250, s: 1.0, emo: t > 82.15 && t < 84.3 ? 'awk' : 'worried', legs: [.7, -1.2, -.7, 1.2], arms: [-1.2, -.4, 2.6, 2.2], lean: .15, blink: blinkAt(t, 31) });
  smallPhone(ctx, hp.hR.x + 4, hp.hR.y - 20, .7, t, false);
  ctx.restore();
  const b2 = pop(t, 82.15, .3) * popOut(t, 84.3); if (b2 > 0) bubble(ctx, 60, 990, 640, 'я загадал огнетушитель…', { scale: b2, size: 48, weight: 700, bg: '#f4f7ff' });
  // ambulance swoosh
  const ak = inv(87.6, 88.8, t); if (ak > 0 && ak < 1) { const ax = lerp(-500, 1600, ak); ctx.save(); ctx.translate(ax, 1500); rr(ctx, -220, -170, 440, 200, 30); fillStroke(ctx, '#fff', 7); ctx.fillStyle = '#ff3b3b'; ctx.fillRect(-200, -80, 400, 26); circle(ctx, -130, 40, 40, '#333', 6); circle(ctx, 130, 40, 40, '#333', 6); rr(ctx, -40, -200, 80, 34, 10); fillStroke(ctx, Math.sin(t * 30) > 0 ? '#2f8cff' : '#ff3b3b', 5); ctx.restore(); }
  ctx.restore();
}, { tout: 'whipL' });

// ---------- P. Hospital: gloves, "что у вас?" ----------
function lyingHero(ctx, x, y, s, t, o = {}) {
  ctx.save(); ctx.translate(x, y); ctx.rotate(-Math.PI / 2);
  person(ctx, { x: 0, y: 0, s, pal: o.pal || PAL.hero, emo: o.emo || 'awk', legs: [0, 0, 0, 0], arms: [-.1, 0, .1, 0], look: o.look || { x: 1, y: 0 }, blink: blinkAt(t, 40), face: o.face ?? 0 });
  ctx.restore();
}
sc(88.8, 96.85, (ctx, t) => {
  ctx.save(); cam(ctx, 590, 1020, track([[88.8, 1.4], [92.1, 1.48], [96.85, 1.52]], t));
  hospitalBg(ctx, t);
  gurney(ctx, 380, 1020);
  const red = t > 92.17;
  lyingHero(ctx, 680, 990, 1.0, t, { emo: red ? 'awk' : 'worried', pal: red ? PAL.heroRed : PAL.hero, look: { x: 0, y: -1 } });
  const snap = t > 90.24 && t < 90.7;
  const dp = person(ctx, { x: 860, y: 1250, s: 1.05, pal: PAL.doctor, emo: 'bored', face: -.6, look: { x: -1, y: 0 }, arms: snap ? [-2.0, -.6, 2.0, .6] : [-.4, .3, .4, -.3], blink: blinkAt(t, 41),
    hold: (c, hL, hR) => { circle(c, hL.x, hL.y, 18, '#3fb7ff', 5); circle(c, hR.x, hR.y, 18, '#3fb7ff', 5); } });
  headMirror(ctx, dp.hc, 1.05);
  ctx.restore();
  if (snap) text(ctx, 'ЩЁЛК!', 780, 360, { size: 90, scale: pop(t, 90.24), fill: '#3fb7ff' });
  const b = pop(t, 91.6, .3) * popOut(t, 93.1); if (b > 0) bubble(ctx, 430, 200, 560, 'Что у вас?', { scale: b, size: 66, weight: 900 });
  const lob = pop(t, 92.6, .3) * popOut(t, 93.3);
  if (lob > 0) { ctx.save(); ctx.translate(300, 360); ctx.scale(lob, lob); ell(ctx, 0, 0, 70, 44, '#ff3b3b', 6); circle(ctx, -90, -40, 30, '#ff3b3b', 6); circle(ctx, 90, -40, 30, '#ff3b3b', 6); circle(ctx, -20, -30, 9, '#fff', 3); circle(ctx, 20, -30, 9, '#fff', 3); ctx.restore(); text(ctx, 'КРАСНЫЙ КАК РАК', W / 2, 520, { size: 64, scale: lob, fill: '#ff3b3b' }); }
  const b2 = pop(t, 93.4, .3); if (b2 > 0) bubble(ctx, 60, 200, 760, 'Не спрашивайте. Просто достаньте.', { scale: b2, size: 62, weight: 900, bg: '#ffd2c8' });
}, { tout: 'cutFlash' });

// ---------- Q. Extraction behind the screen ----------
sc(96.85, 101.7, (ctx, t) => {
  ctx.save(); cam(ctx, 540, 960, 1.35);
  hospitalBg(ctx, t);
  // silhouettes behind screen
  const sx = 280, sy = 620, sw = 520, sh = 630;
  ctx.save(); ctx.beginPath(); ctx.rect(sx, sy, sw, sh); ctx.clip();
  ctx.fillStyle = '#e8f4ff'; ctx.fillRect(sx, sy, sw, sh);
  ctx.save(); ctx.globalAlpha = .55; ctx.filter = 'brightness(0)';
  const pull = Math.max(0, Math.sin((t - 96.85) * 7)) * .6;
  person(ctx, { x: 640, y: 1250, s: 1.05, pal: PAL.doctor, emo: 'bored', face: -.6, arms: [-.4, .3, -1.6 + pull, -.3], lean: -pull * .2 });
  gurney(ctx, 420, 1040, 440);
  ctx.restore(); ctx.restore();
  // screen frame
  for (let i = 0; i < 3; i++) { rr(ctx, sx + i * sw / 3, sy, sw / 3, sh, 6); fillStroke(ctx, null, 8, '#2f8cff'); }
  line(ctx, sx + 20, sy + sh, sx + 20, 1250, 8, '#2f8cff'); line(ctx, sx + sw - 20, sy + sh, sx + sw - 20, 1250, 8, '#2f8cff');
  // items flying out
  const fly = (t0, x1, y1, fn) => { const k = inv(t0, t0 + .7, t); if (k <= 0) return; const x = lerp(540, x1, ease.outQ(k)), y = lerp(700, y1, k) - Math.sin(k * Math.PI) * 380; ctx.save(); ctx.translate(x, y); ctx.rotate(k < 1 ? k * 5 : 0); fn(ctx); ctx.restore(); };
  fly(97.25, 160, 1180, c => pizza(c, 0, 0, 80, t));
  fly(98.8, 920, 1100, c => extinguisher(c, 0, 0, .5, { rot: 1.4 }));
  const tk = inv(100.4, 101.4, t); if (tk > 0) { ctx.save(); towTruck(ctx, lerp(600, 1060, ease.outC(tk)), 1250, .55, t, { flip: true }); ctx.restore(); }
  ctx.restore();
  text(ctx, 'ПЛЮХ!', 220, 380, { size: 90, scale: pop(t, 97.9) * popOut(t, 98.6), fill: '#ffe14d', rot: -.1 });
  text(ctx, 'ДЗЫНЬ!', 820, 380, { size: 90, scale: pop(t, 99.45) * popOut(t, 100.2), fill: '#ff3b3b', rot: .1 });
  text(ctx, 'БИП-БИП', W / 2, 380, { size: 100, scale: pop(t, 100.6), fill: '#ffb020' });
}, { tout: 'whipR' });

// ---------- R. Doctor deadpan: "у вас не ж*па, а гараж" ----------
sc(101.7, 109.2, (ctx, t) => {
  ctx.fillStyle = vgrad(ctx, 0, H, ['#d9f3ff', '#bfe6f7']); ctx.fillRect(0, 0, W, H);
  // background: truck parked in the ward (blurred)
  ctx.save(); ctx.filter = 'blur(6px)'; towTruck(ctx, 760, 1500, .8, t); ctx.restore();
  const z = track([[101.7, 1.0], [104.0, 1.08], [106.0, 1.12]], t) * (t > 108.09 ? 1 + .12 * Math.exp(-(t - 108.09) * 6) : 1);
  ctx.save(); cam(ctx, 540, 860, z);
  const glassesOn = t < 102.57;
  const pal = glassesOn ? PAL.doctor : { ...PAL.doctor, glasses: false };
  const dp = person(ctx, { x: 540, y: 1830, s: 2.6, pal, emo: 'bored', look: { x: 0, y: 0 }, blink: blinkAt(t, 44), arms: t > 102.2 && t < 103.0 ? [-.4, .3, 2.6, 2.4] : [-.3, .2, .3, -.2], legs: [0, 0, 0, 0] });
  headMirror(ctx, dp.hc, 2.6);
  if (!glassesOn && t < 103.4) { const k = inv(102.57, 103.4, t); ctx.save(); ctx.translate(lerp(dp.hc.x + 80, 920, k), lerp(dp.hc.y, 1300, k)); for (const sd of [-1, 1]) { ctx.beginPath(); ctx.arc(sd * 55, 0, 50, 0, TAU); ctx.lineWidth = 9; ctx.strokeStyle = '#555'; ctx.stroke(); } ctx.restore(); }
  ctx.restore();
  text(ctx, '20 ЛЕТ СТАЖА', W / 2, 300, { size: 110, scale: pop(t, 104.0) * popOut(t, 105.9), fill: '#2f8cff' });
  if (t > 108.09) {
    const k = pop(t, 108.09, .3); ctx.save(); ctx.translate(W / 2, 360); ctx.scale(k, k); rr(ctx, -320, -150, 640, 300, 20); fillStroke(ctx, '#9aa3b5', 9);
    for (let i = 0; i < 5; i++) line(ctx, -300, -110 + i * 55, 300, -110 + i * 55, 6, '#7a8194'); text(ctx, 'ГАРАЖ', 0, 0, { size: 150, fill: '#ffe14d', sw: 22 }); ctx.restore();
  }
}, { tout: 'whipU' });

// ---------- S. Lying, "хорошо хоть самолёт не загадал" ----------
sc(109.2, 114.0, (ctx, t) => {
  ctx.fillStyle = '#d9f3ff'; ctx.fillRect(0, 0, W, H);
  ctx.save(); cam(ctx, 540, 1300, track([[109.2, 1.1], [114, 1.2]], t));
  rr(ctx, 160, 760, 760, 1400, 40); fillStroke(ctx, '#9fe7ff', 8); rr(ctx, 300, 1230, 480, 170, 60); fillStroke(ctx, '#fff', 6);
  ctx.save(); ctx.translate(540, 1900); person(ctx, { x: 0, y: 0, s: 1.6, emo: t > 112.8 ? 'calm' : 'bored', look: { x: 0, y: -1 }, ...POSE.stand, blink: blinkAt(t, 50) }); ctx.restore();
  rr(ctx, 190, 1480, 700, 700, 40); fillStroke(ctx, '#fff', 7);
  ctx.restore();
  thought(ctx, 640, 460, 600, 460, c => { airplane(c, 0, 0, 1.2); crossOut(c, 0, 0, 150, inv(112.5, 113.3, t)); }, pop(t, 111.2, .45));
  text(ctx, 'ФУХ…', 250, 840, { size: 80, scale: pop(t, 112.9), fill: '#2f8cff' });
}, { tout: 'cutFlash' });

// ---------- T. New message: beta test ----------
const MSGS2 = [[114.56, 'Спасибо за участие в бета-тесте!', { bg: '#ffe14d', size: 52, weight: 900 }], [117.36, 'Завтра функция станет доступна', {}]];
sc(114.0, 123.1, (ctx, t) => {
  ctx.fillStyle = vgrad(ctx, 0, H, ['#3a2a5a', '#120c24']); ctx.fillRect(0, 0, W, H);
  const buzz = t < 114.6 ? Math.sin(t * 70) * 8 : 0;
  const py = 900 + Math.sin(t * 1.3) * 8;
  ctx.save(); ctx.translate(buzz, 0);
  phoneFrame(ctx, W / 2, py, 820, 1380, phoneChat(ctx, t, MSGS2, 'Исполнитель желаний'));
  ctx.restore();
  const k = pop(t, 122.1, .35); if (k > 0) { const sh = shake(t, 8, 18); text(ctx, 'ВСЕМ', W / 2 + sh.x, 1180 + sh.y, { size: 260, scale: k, fill: '#ff3b3b', rot: -.06, sw: 34 }); }
}, { tout: 'whipL', noSubs: true });

// ---------- U-V. Metro rush hour + CTA ----------
sc(123.1, 131.6, (ctx, t) => {
  const sway = Math.sin(t * 2.2) * .02;
  ctx.save(); cam(ctx, 540, 960, track([[123.1, 1.45], [126.0, 1.35], [131.6, 1.3]], t), sway);
  ctx.fillStyle = '#cfd8e6'; ctx.fillRect(-500, -200, 2100, 1500);
  for (let i = 0; i < 4; i++) { rr(ctx, -300 + i * 480, 300, 300, 260, 30); fillStroke(ctx, '#1b2238', 8); const sp = ((t * 900 + i * 200) % 400); ctx.fillStyle = 'rgba(255,255,255,.25)'; ctx.fillRect(-300 + i * 480 + sp % 300, 310, 20, 240); }
  line(ctx, -500, 240, 1600, 240, 14, '#9aa3b5');
  floorBoards(ctx, -500, 1300, 2100, 700, '#7a8194', '#6a7184');
  const people = [[90, PAL.dad, 'pizza'], [270, PAL.girl, 'plane'], [790, PAL.baba, 'ext'], [960, PAL.mom, 'truck'], [-80, PAL.kid, 'pizza'], [1130, PAL.dad, 'plane']];
  people.forEach(([x, pal, wish], i) => {
    const p = person(ctx, { x, y: 1300, s: .95, pal, emo: 'calm', face: x < 540 ? .4 : -.4, arms: [-.2, .1, 2.7, .2], blink: blinkAt(t, 60 + i), lean: sway * 3 });
    line(ctx, p.hR.x, p.hR.y, p.hR.x, 240, 6, '#9aa3b5');
    const k = pop(t, 124.1 + i * .22, .35);
    thought(ctx, x + 20, 560 + (i % 2) * 80, 230, 190, c => { if (wish === 'pizza') pizza(c, 0, 0, 55, t); if (wish === 'plane') airplane(c, 0, 0, .45); if (wish === 'ext') extinguisher(c, 0, 10, .25); if (wish === 'truck') towTruck(c, 0, 30, .2, t); }, k);
  });
  const hp = person(ctx, { x: 540, y: 1300, s: 1.05, emo: 'scream', face: 0, ...POSE.cover, blink: 0, look: { x: Math.sin(t * 2) > 0 ? .8 : -.8, y: 0 } });
  ctx.restore();
  text(ctx, 'МЕТРО. ЧАС ПИК.', W / 2, 230, { size: 80, scale: pop(t, 123.2) * popOut(t, 126.9), fill: '#fff' });
  // CTA
  const ca = clamp(inv(127.0, 127.4, t));
  if (ca > 0) {
    ctx.save(); ctx.globalAlpha = ca * .5; ctx.fillStyle = '#000'; ctx.fillRect(0, 0, W, H); ctx.restore();
    [['А ТЫ БЫ ЧТО', 127.04, '#fff'], ['ЗАГАДАЛ', 127.6, '#ffe14d'], ['ПЕРВЫМ?', 128.1, '#fff']].forEach(([s, tt, col], i) => text(ctx, s, W / 2, 300 + i * 130, { size: i === 1 ? 130 : 100, scale: pop(t, tt - .1), fill: col }));
    const bk = pop(t, 128.9, .35);
    if (bk > 0) { const bob = Math.sin((t - 128.9) * 7) * 14; ctx.save(); ctx.translate(W / 2, 1180); ctx.scale(bk, bk); rr(ctx, -380, -75, 760, 150, 75); fillStroke(ctx, '#ff3b5c', 9); text(ctx, 'ПИШИ В КОММЕНТАХ', 0, 4, { size: 66, sw: 10 }); ctx.restore(); ctx.save(); ctx.translate(W / 2, 1340 + bob); ctx.scale(bk, bk); poly(ctx, [-50, -30, 50, -30, 50, 10, 90, 10, 0, 90, -90, 10, -50, 10], '#ffe14d', 8); ctx.restore(); }
  }
}, { noSubs: t => t > 127.0 });
