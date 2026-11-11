// ===== scenes 5-8 =====
function phoneRoom(ctx, lt, o = {}) {
  ctx.fillStyle = '#040506'; ctx.fillRect(0, 0, W, H);
  L(ctx, .3, () => { // window with night
    ctx.fillStyle = '#0d141c'; ctx.fillRect(1250, 120, 420, 420); ctx.strokeStyle = '#05070a'; ctx.lineWidth = 14; ctx.strokeRect(1250, 120, 420, 420); ctx.beginPath(); ctx.moveTo(1460, 120); ctx.lineTo(1460, 540); ctx.moveTo(1250, 330); ctx.lineTo(1670, 330); ctx.stroke();
    for (let i = 0; i < 20; i++) { ctx.fillStyle = `rgba(230,200,140,${.15 + hr(i) * .3})`; ctx.fillRect(1270 + hr(i * 3) * 380, 380 + hr(i * 5) * 140, 6, 8); }
  });
  L(ctx, .7, () => {
    ctx.fillStyle = '#0c0d10'; ctx.fillRect(-200, 700, W + 400, 60); ctx.fillStyle = '#08090b'; ctx.fillRect(-200, 760, W + 400, 500);
    // lamp
    ctx.fillStyle = '#020203'; ctx.fillRect(950, 430, 10, 270); ctx.beginPath(); ctx.moveTo(880, 440); ctx.lineTo(1030, 440); ctx.lineTo(990, 370); ctx.lineTo(920, 370); ctx.closePath(); ctx.fill(); ctx.fillRect(915, 690, 80, 14);
    ctx.save(); ctx.globalCompositeOperation = 'lighter'; const fl = .9 + .1 * noise1(NOW * 5); cone(ctx, 955, 440, 150, 900, 300, .3 * fl, '255,205,140'); ctx.scale(1, .3); spot(ctx, 955, 720 / .3, 520, .35 * fl, '255,205,140'); ctx.restore();
    // rotary phone
    ctx.fillStyle = '#121214'; ctx.beginPath(); ctx.moveTo(1080, 700); ctx.lineTo(1100, 640); ctx.lineTo(1220, 640); ctx.lineTo(1240, 700); ctx.fill(); ctx.fillRect(1085, 618, 150, 24); ctx.beginPath(); ctx.arc(1160, 672, 22, 0, 7); ctx.fillStyle = '#2a2a2e'; ctx.fill();
    const ring = o.ring && Math.floor(NOW * 8) % 2 ? 3 : 0; ctx.fillStyle = '#121214'; ctx.fillRect(1080 + ring, 600 - ring, 160, 22);
    figure(ctx, 640, 960, 420, { kind: 'coat', col: '#020203', rim: 'rgba(255,200,140,.45)' });
    figure(ctx, 1380, 960, 400, { kind: 'woman', col: '#020203', rim: 'rgba(255,200,140,.45)', flip: true });
  });
}
function usMap(ctx, P, hl = {}, base = '#141a21') {
  drawGeo(ctx, GEO.us, P, f => ({ fill: hl[f.id] !== undefined ? `rgba(179,38,44,${.25 + .55 * hl[f.id]})` : base, stroke: 'rgba(142,162,181,.35)', lw: 1.2 }));
}

window.s5 = function () {
  const S = 5, c = (p, n) => cue(S, p, n);
  const t0 = SC(5).t0, tStud = c('Студент-психолог'), tCharm = c('обаятельный'), t71 = c('В тысяча девятьсот семьдесят первом'), tAnn = c('Энн Руль'), tCop = c('Она была бывшим'), tBook = c('Позже она напишет');
  shot(window.__s4end + 2.0, (ctx, lt, D) => {
    camera(lt, D, { z: [1.0, 1.1], x: [30, -30] }); deskBg(ctx, .4);
    L(ctx, .9, () => {
      print(ctx, 'bundy', 600, 540, 560, 760, { rot: .02, fy: .3 });
      plate(ctx, 'ТЕД БАНДИ', null, 1020, 330, t0 + .1);
      riseText(ctx, 'студент-психолог', 1050, 480, tStud, { f: F.serif, size: 56, align: 'left' });
      riseText(ctx, 'обаятельный, красиво говорил', 1050, 570, tCharm, { f: F.serif, size: 56, align: 'left', col: C.cold });
    });
  }, { tr: 'zoom', td: .9 });
  shot(t71 - .2, (ctx, lt, D) => {
    camera(lt, D, { z: [1.0, 1.14], x: [-60, 40] }); phoneRoom(ctx, lt, { ring: NOW < t71 + 2 });
    L(ctx, 1, () => { plate(ctx, '1971 · ТЕЛЕФОН ДОВЕРИЯ', 'ночные дежурства, Сиэтл', 120, 260, t71 + .3); riseText(ctx, 'ЭНН РУЛЬ', 1380, 470, tAnn + .1, { size: 46, wt: '600', ls: 6, col: C.white }); riseText(ctx, 'ТЕД БАНДИ', 640, 470, tAnn + .4, { size: 46, wt: '600', ls: 6, col: C.white }); });
  }, { tr: 'fade', td: .7, lb: 1, warm: .6 });
  ev(t71, 'phone', { d: 2 });
  shot(tCop - .2, (ctx, lt, D) => {
    camera(lt, D, { z: [1.15, 1.3], x: [-40, 60] }); deskBg(ctx, .4);
    L(ctx, .9, () => {
      paperSheet(ctx, W / 2, 600, 1300, 900, 0);
      typeText(ctx, 'бывший полицейский · начинающая писательница', 380, 330, tCop + .3, { size: 36, col: '#3b3e44', cps: 30, cursor: false });
      typeText(ctx, 'THE STRANGER BESIDE ME, 1980', 380, 560, tBook + .3, { size: 70, col: '#15171a', cps: 14 });
      riseText(ctx, 'книга Энн Руль о Банди', 380, 650, tBook + 2.6, { f: F.serif, size: 40, col: '#5a2a26', align: 'left' });
    });
  }, { tr: 'paper', td: .8, warm: .5 });
  ev(tCop + .3, 'type', { d: 1.5 }); ev(tBook + .3, 'type', { d: 2 });
  // 30 in 7 states
  const t30 = c('Он признается'), tVict = c('Его жертвами'), tMiss = c('Их хватились'), tWeap = c('Поэтому он выбрал'), tTrust = c('а доверие');
  const ST7 = ['Washington', 'Oregon', 'Idaho', 'Utah', 'Colorado', 'California', 'Florida'];
  shot(t30 - .2, (ctx, lt, D) => {
    camera(lt, D, { hand: .5, z: [1.0, 1.06] }); seaBg(ctx);
    const P = proj(-100, 39, 21, W / 2 - 120, H / 2 + 40); const hl = {};
    ST7.forEach((s, i) => hl[s] = ap(t30 + 1.2 + i * .35, .4));
    usMap(ctx, P, hl);
    L(ctx, 1, () => { ctx.fillStyle = 'rgba(4,5,7,.75)'; ctx.fillRect(1440, 220, 420, 520); counter(ctx, 30, 1650, 400, t30 + .6, { size: 220, d: 1.4, col: C.red2 }); txt(ctx, 'ПРИЗНАНИЙ', 1650, 560, { size: 50, wt: '600', ls: 6, a: ap(t30 + 1, .4) }); txt(ctx, '7 ШТАТОВ', 1650, 630, { f: F.mono, size: 40, col: C.cold, a: ap(t30 + 3, .4) }); txt(ctx, '1974–1978', 1650, 690, { f: F.mono, size: 40, col: C.cold, a: ap(t30 + 3.5, .4) }); });
  }, { tr: 'smear' });
  ST7.forEach((s, i) => ev(t30 + 1.2 + i * .35, 'tickone')); ev(t30 + .6, 'tick', { d: 1.4 });
  shot(tVict - .2, (ctx, lt, D) => {
    camera(lt, D, { z: [1.0, 1.12] }); bgDark(ctx, '14,18,24');
    const sw = ap(tWeap + .6, .5);
    L(ctx, .8, () => { figureGrid(ctx, 9, 9, 380, 900, 145, 330, tVict + .2, 1.2, { kind: () => 'woman', col: '#c3ced9', a: 1 - sw * .7 }); });
    L(ctx, 1, () => {
      riseText(ctx, 'ИХ ХВАТИЛИСЬ БЫ СРАЗУ', W / 2, 230, tMiss, { size: 80, wt: '700', ls: 6, out: tWeap + .3 });
      if (NOW > tWeap) { txt(ctx, 'НЕВИДИМОСТЬ', W / 2, 330, { size: 110, wt: '700', ls: 8, a: ap(tWeap + .3, .3) * (1 - ap(tTrust + .3, .3) * .5) }); font(ctx, F.osw, 110, '700'); ctx.letterSpacing = '8px'; const tw = ctx.measureText('НЕВИДИМОСТЬ').width; strike(ctx, W / 2 - tw / 2, W / 2 + tw / 2, 290, tTrust - .5, { w: 14, glow: 1 }); }
      slamText(ctx, 'ДОВЕРИЕ', W / 2, 520, tTrust + .1, { size: 200, wt: '700', ls: 10, col: C.red2, glow: C.red, gb: 40 });
    });
  }, { tr: 'fade', td: .6 });
  ev(tTrust - .5, 'strike'); ev(tTrust + .1, 'boom');
  // crutches
  const tCast = c('Он надевал'), tAsk = c('И просил помощи'), tNo = c('Человек на костылях'), tWant = c('Он вызывает'), tUsed = c('И именно это');
  shot(tCast - .2, (ctx, lt, D) => {
    camera(lt, D, { z: [1.0, 1.15], x: [40, -40] });
    ctx.fillStyle = '#06080b'; ctx.fillRect(0, 0, W, H);
    L(ctx, .4, () => { const g = ctx.createLinearGradient(0, 0, 0, H); g.addColorStop(0, '#16202b'); g.addColorStop(1, '#07090c'); ctx.fillStyle = g; ctx.fillRect(-300, -200, W + 600, H + 400); ctx.fillStyle = '#0b0f14'; for (let i = 0; i < 6; i++) ctx.fillRect(-200 + i * 400, 200, 260, 600); });
    L(ctx, .8, () => {
      ctx.fillStyle = '#05070a'; ctx.fillRect(-300, 900, W + 600, 300);
      figure(ctx, 760, 900, 460, { kind: 'coat', col: '#c4ced8' });
      ctx.save(); ctx.translate(840, 900); ctx.rotate(-.12); icon(ctx, 'crutch', 0, -150, 300, { col: '#d9dfe5', lw: 7 }); ctx.restore();
      ctx.fillStyle = '#eef1f4'; ctx.fillRect(785, 560, 26, 70);
      // books falling
      const bq = ap(tAsk + .4, .7, E.in);
      for (let i = 0; i < 3; i++) { ctx.save(); ctx.translate(900 + i * 60, lerp(640, 880 - i * 18, bq)); ctx.rotate(bq * (i - 1) * .6); ctx.fillStyle = ['#5a2a26', '#2c3a48', '#4a4436'][i]; ctx.fillRect(-45, -14, 90, 28); ctx.restore(); }
      // speech bubble
      const q = ap(tAsk + .2, .5, E.back);
      if (q > 0) { ctx.save(); ctx.translate(1060, 420); ctx.scale(q, q); ctx.fillStyle = '#eef1f4'; ctx.beginPath(); ctx.roundRect(-20, -90, 420, 150, 30); ctx.fill(); ctx.beginPath(); ctx.moveTo(10, 40); ctx.lineTo(-60, 120); ctx.lineTo(70, 50); ctx.fill(); txt(ctx, '«Поможете?»', 190, 10, { f: F.serif, size: 70, col: '#111' }); ctx.restore(); }
    });
    L(ctx, 1, () => plate(ctx, 'ГИПС · ПОВЯЗКА · КОСТЫЛИ', null, 1150, 900, tCast + .4));
  }, { tr: 'smear' });
  ev(tAsk + .4, 'drop');
  shot(tNo - .2, (ctx, lt, D) => {
    camera(lt, D, { z: [1.05, 1.0], x: [-40, 40] }); bgDark(ctx, '14,18,24');
    L(ctx, .9, () => {
      const nodes = [['ЖЕЛАНИЕ ПОМОЧЬ', 380, tWant], ['ДОВЕРИЕ', W / 2, tWant + 1.4], ['РИСК', W - 380, tUsed + .3]];
      nodes.forEach(([s, x, t], i) => { const q = ap(t, .5, E.back); if (q <= 0) return; ctx.save(); ctx.translate(x, 540); ctx.scale(q, q); ctx.strokeStyle = i === 2 ? C.red2 : C.cold; ctx.lineWidth = 4; ctx.strokeRect(-230, -80, 460, 160); txt(ctx, s, 0, 22, { size: 60, wt: '700', ls: 4, col: i === 2 ? C.red2 : C.white }); ctx.restore();
        if (i > 0) { const a = ap(t - .4, .5); ctx.strokeStyle = `rgba(226,68,60,${a})`; ctx.lineWidth = 6; const x0 = nodes[i - 1][1] + 240, x1 = x - 240; ctx.beginPath(); ctx.moveTo(x0, 540); ctx.lineTo(lerp(x0, x1, a), 540); ctx.stroke(); if (a > .9) { ctx.fillStyle = C.red2; ctx.beginPath(); ctx.moveTo(x1, 540); ctx.lineTo(x1 - 26, 524); ctx.lineTo(x1 - 26, 556); ctx.fill(); } } });
      riseText(ctx, 'ЧЕЛОВЕК НА КОСТЫЛЯХ НЕ ПУГАЕТ', W / 2, 260, tNo, { size: 64, wt: '600', ls: 4 });
    });
  }, { tr: 'fade', td: .5 });
  // reports drowned
  const tHard = c('Дальше начинается'), tKl = c('Его подруга'), tRep = c('обе сообщили'), tDrown = c('Но следователи тонули'), tOne = c('одним из многих');
  shot(tHard - .2, (ctx, lt, D) => {
    camera(lt, D, { z: [1.0, 1.15], y: [0, 30] }); deskBg(ctx, .4);
    L(ctx, .9, () => {
      [['КЛЁПФЕР', 700, -.05, tKl + 1], ['РУЛЬ', 1220, .04, tRep - .5]].forEach(([n, x, r, t]) => { const q = ap(t, .5); if (q <= 0) return; ctx.save(); ctx.globalAlpha = q; paperSheet(ctx, x, 520, 440, 560, r); ctx.translate(x, 520); ctx.rotate(r); typeText(ctx, 'В ПОЛИЦИЮ', -170, -180, t + .2, { size: 36, col: '#1d2024', cps: 20, cursor: false }); typeText(ctx, 'Возможно, это', -170, -100, t + .7, { size: 32, col: '#1d2024', cps: 26, cursor: false }); typeText(ctx, 'Тед Банди.', -170, -50, t + 1.3, { size: 32, col: '#5a2a26', cps: 26, cursor: false }); txt(ctx, '— ' + n, 160, 200, { f: F.serif, size: 40, col: '#1d2024', align: 'right' }); ctx.restore(); });
      // pile of reports falling
      for (let i = 0; i < 70; i++) { const tt = tDrown + .3 + i * .045; const q = ap(tt, .35, E.in); if (q <= 0) continue; const x = 400 + hr(i * 3) * 1150, y = 300 + hr(i * 7) * 520, r = (hr(i * 5) - .5) * .9; ctx.save(); ctx.translate(x, lerp(-500, y, q)); ctx.rotate(r); ctx.shadowColor = 'rgba(0,0,0,.6)'; ctx.shadowBlur = 16; ctx.fillStyle = `rgb(${190 + hr(i) * 20},${186 + hr(i) * 20},${176 + hr(i) * 15})`; ctx.fillRect(-150, -190, 300, 380); ctx.shadowColor = 'transparent'; ctx.fillStyle = 'rgba(40,40,45,.35)'; for (let k = 0; k < 7; k++) ctx.fillRect(-120, -150 + k * 40, 160 + hr(i + k) * 80, 6); ctx.restore(); }
    });
    L(ctx, 1, () => { const q = ap(tDrown + 2.4, .5); if (q > 0) { ctx.fillStyle = `rgba(4,5,7,${.75 * q})`; ctx.fillRect(0, 430, W, 200); } riseText(ctx, 'СОТНИ СООБЩЕНИЙ', W / 2, 570, tDrown + 2.4, { size: 120, wt: '700', ls: 8, col: C.white }); });
  }, { tr: 'dip', td: .7 });
  ev(tDrown + .3, 'papers', { d: 3.2 });
  // escapes + executed
  const tEsc = c('Он дважды'), tThree = c('Был приговорён'), tExec = c('Двадцать четвёртого января'), tDna = c('Даже спустя');
  shot(tEsc - .2, (ctx, lt, D) => {
    camera(lt, D, { z: [1.0, 1.12], x: [50, -50] }); bgDark(ctx, '14,18,24');
    L(ctx, .9, () => {
      // two escape drawings: window bars broken, and jump from window
      ctx.save(); ctx.globalAlpha = ap(tEsc, .5); ctx.strokeStyle = C.cold; ctx.lineWidth = 5; ctx.strokeRect(300, 260, 300, 380); for (let i = 1; i < 5; i++) { ctx.beginPath(); ctx.moveTo(300 + i * 60, 260); ctx.lineTo(300 + i * 60, i === 2 ? 420 : 640); ctx.stroke(); } txt(ctx, '1977', 450, 720, { f: F.mono, size: 40, col: C.cold }); ctx.restore();
      ctx.save(); ctx.globalAlpha = ap(tEsc + .8, .5); ctx.strokeStyle = C.cold; ctx.lineWidth = 5; ctx.strokeRect(720, 260, 300, 380); ctx.beginPath(); ctx.moveTo(720, 260); ctx.lineTo(870, 200); ctx.lineTo(1020, 260); ctx.stroke(); ctx.beginPath(); ctx.arc(870, 330, 40, 0, 7); ctx.stroke(); ctx.beginPath(); ctx.moveTo(820, 360); ctx.lineTo(930, 300); ctx.stroke(); txt(ctx, '1977', 870, 720, { f: F.mono, size: 40, col: C.cold }); ctx.restore();
      riseText(ctx, '2 ПОБЕГА', 660, 180, tEsc + .4, { size: 70, wt: '700', ls: 6 });
      riseText(ctx, '3 СМЕРТНЫХ ПРИГОВОРА', 1480, 380, tThree, { size: 64, wt: '700', ls: 4, col: C.white });
      stamp(ctx, 'КАЗНЁН', 1480, 600, tExec + 1.2, { size: 120, sub: '24.01.1989' });
      if (NOW > tDna) helix(ctx, W / 2, 920, 1200, 40, NOW, { reveal: ap(tDna, 1.4), n: 30, a: .8 });
    });
  }, { tr: 'smear' });
  ev(tExec + 1.2, 'stampbig');
  // recap board
  const tSo = c('Итак'), tCh = c('Чикатило невидимость'), tRi = c('Риджуэй те'), tBu = c('Банди доверие'), tWhat = c('А что бывает');
  shot(tSo - .2, (ctx, lt, D) => {
    camera(lt, D, { z: [1.0, 1.15], x: [-60, 60], r: [-.01, .01] }); corkBg(ctx, .5);
    L(ctx, .85, () => {
      const P = [[330, 'chikatilo', 'НЕВИДИМОСТЬ В ТОЛПЕ', tCh], [760, 'ridgway', 'ТЕ, КОГО НЕ ХВАТЯТСЯ', tRi], [1190, 'bundy', 'ДОВЕРИЕ', tBu]];
      P.forEach(([x, k, l, t], i) => { print(ctx, k, x, 440, 300, 380, { rot: (i - 1) * .04, pin: 1, a: ap(tSo + i * .2, .4) }); const q = ap(t, .5); if (q > 0) { ctx.fillStyle = `rgba(230,225,215,${q})`; ctx.fillRect(x - 170, 690, 340, 80); txt(ctx, l, x, 745, { size: 34, wt: '600', col: '#16181c', a: q }); } });
      const q = ap(tWhat, .5, E.back); ctx.save(); ctx.translate(1620, 440); ctx.scale(q, q); ctx.fillStyle = '#1b1f25'; ctx.fillRect(-150, -190, 300, 380); txt(ctx, '?', 0, 70, { size: 260, wt: '700', col: C.red2, glow: C.red }); ctx.restore(); if (q > 0) pin(ctx, 1620, 270);
      thread(ctx, [330, 270], [760, 270], ap(tRi - .3, .8), 40); thread(ctx, [760, 270], [1190, 270], ap(tBu - .3, .8), 40); thread(ctx, [1190, 270], [1620, 270], ap(tWhat + .3, .8), 40);
    });
    L(ctx, 1, () => { ctx.fillStyle = 'rgba(4,5,7,.75)'; ctx.fillRect(0, 870, W, 150 * ap(tWhat + 1.5, .4)); riseText(ctx, 'НЕВИДИМ + ДОВЕРИЕ + ?', W / 2, 970, tWhat + 1.5, { size: 80, wt: '700', ls: 8 }); });
  }, { tr: 'paper', td: .8 });
  ev(tRi - .3, 'thread'); ev(tBu - .3, 'thread'); ev(tWhat + .3, 'thread');
};

window.s6 = function () {
  const S = 6, c = (p, n) => cue(S, p, n);
  const t0 = SC(6).t0, tThree = c('Три женщины'), t14 = c('Ему четырнадцать'), tCall = c('Они звонят');
  shot(t0 - .6, (ctx, lt, D) => {
    camera(lt, D, { hand: .5 }); seaBg(ctx);
    const P = geoCam(lt, D, { lon: -96, lat: 39, s: 17 }, { lon: -88.5, lat: 43.2, s: 120 });
    usMap(ctx, P, { Wisconsin: .25 });
    const [x, y] = P(-87.9, 43.04); pulse(ctx, x, y, t0 + .3, { R: 80 });
    mapLabel(ctx, 'МИЛУОКИ', x - 40, y - 50, t0 + .2, { size: 60, col: C.white, align: 'right' });
    slamText(ctx, '27 МАЯ 1991', 1560, 980, t0 + 1.4, { size: 90, wt: '700', col: C.red2 });
  }, { tr: 'dip', td: 1.2 });
  ev(t0 + 1.4, 'hit');
  shot(tThree - .2, (ctx, lt, D) => {
    camera(lt, D, { z: [1.0, 1.15], x: [-60, 60] }); nightStreet(ctx, lt, { police: 0 });
    L(ctx, .9, () => {
      [[640, 0], [780, 1], [920, 0]].forEach(([x, f], i) => figure(ctx, x, 990, 400, { kind: 'woman', col: '#030405', rim: 'rgba(255,210,150,.5)', flip: i === 2, a: ap(tThree + i * .25, .5) }));
      // dark spot in light (child not shown)
      ctx.save(); ctx.scale(1, .3); const g = ctx.createRadialGradient(1300, 985 / .3, 10, 1300, 985 / .3, 140); g.addColorStop(0, 'rgba(0,0,0,.95)'); g.addColorStop(1, 'rgba(0,0,0,0)'); ctx.fillStyle = g; ctx.fillRect(1100, 985 / .3 - 200, 400, 400); ctx.restore();
    });
    L(ctx, 1, () => { slamText(ctx, '14 ЛЕТ', 1300, 820, t14 + .2, { size: 120, wt: '700', col: C.white }); plate(ctx, 'ВЫЗОВ ПОЛИЦИИ', 'женщины остаются рядом', 120, 270, tCall + .1); });
  }, { tr: 'fade', td: .6, lb: 1 });
  ev(tCall, 'phone', { d: 1.5 });
  const tCops = c('Приезжают двое'), tMan = c('И рядом появляется'), tDah = c('Джеффри Дамер');
  shot(tCops - .2, (ctx, lt, D) => {
    camera(lt, D, { z: [1.05, 1.18], x: [0, -60] }); nightStreet(ctx, lt, { police: ap(tCops, 1) });
    L(ctx, .9, () => {
      const rim = Math.sin(NOW * 4.2) > 0 ? 'rgba(230,60,60,.8)' : 'rgba(70,110,240,.8)';
      [[640, 'woman'], [780, 'woman'], [920, 'woman']].forEach(([x, k]) => figure(ctx, x, 990, 400, { kind: k, col: '#030405', rim }));
      const ci = ap(tCops + .3, 1.2, E.out); figure(ctx, lerp(1900, 1180, ci), 990, 430, { kind: 'cop', col: '#020203', rim, flip: true }); figure(ctx, lerp(2050, 1480, ci), 990, 430, { kind: 'cop', col: '#020203', rim, flip: true });
    });
  }, { tr: 'flash' });
  ev(tCops, 'siren', { d: 6 });
  shot(tDah - .1, (ctx, lt, D) => {
    camera(lt, D, { z: [1.0, 1.1] }); policeWall(ctx, lt, { door: false, k: .6 });
    L(ctx, .9, () => { print(ctx, 'dahmer', 680, 520, 470, 660, { rot: -.03, fy: .3 }); plate(ctx, 'ДЖЕФФРИ ДАМЕР', 'фото из школьного альбома', 1040, 470, tDah + .3); riseText(ctx, 'говорит спокойно', 1060, 620, tDah + 1.5, { f: F.serif, size: 50, col: C.cold, align: 'left' }); });
  }, { tr: 'flash' });
  // 19 vs 14
  const tSays = c('Он спокойно'), t19 = c('ему девятнадцать'), tDrunk = c('он просто');
  shot(t19 - .5, (ctx, lt, D) => {
    camera(lt, D, { z: [1.0, 1.08] }); ctx.fillStyle = '#040506'; ctx.fillRect(0, 0, W, H);
    L(ctx, 1, () => {
      txt(ctx, 'ОН СКАЗАЛ', 560, 300, { f: F.mono, size: 40, col: C.cold, a: ap(t19 - .3, .4) }); txt(ctx, 'НА САМОМ ДЕЛЕ', 1360, 300, { f: F.mono, size: 40, col: C.cold, a: ap(t19 + .8, .4) });
      slamText(ctx, '19', 560, 640, t19, { size: 340, wt: '700' }); slamText(ctx, '14', 1360, 640, t19 + 1, { size: 340, wt: '700', col: C.red2, glow: C.red });
      txt(ctx, 'ЛЕТ', 560, 760, { size: 60, wt: '600', ls: 10, a: ap(t19 + .2, .4) }); txt(ctx, 'ЛЕТ', 1360, 760, { size: 60, wt: '600', ls: 10, a: ap(t19 + 1.2, .4), col: C.red2 });
      cross(ctx, 560, 530, 320, tDrunk + 1.2);
      riseText(ctx, '«мой друг, он просто выпил»', W / 2, 920, tDrunk, { f: F.serif, size: 50, col: C.cold });
    });
  }, { tr: 'glitch', td: .35, lb: 1 });
  ev(t19, 'hit'); ev(t19 + 1, 'hit'); ev(tDrunk + 1.2, 'strike');
  // protests
  const tProt = c('Женщины протестуют'), tChild = c('что это ребёнок'), tScared = c('Что ему страшно'), tAmb = c('Что нужно вызвать'), tListen = c('Полицейские слушают'), tBelieve = c('но верят');
  shot(tProt - .2, (ctx, lt, D) => {
    camera(lt, D, { z: [1.0, 1.1], x: [-40, 40] }); nightStreet(ctx, lt, { police: .8 });
    L(ctx, .9, () => { [[560], [700], [840]].forEach(([x], i) => figure(ctx, x, 990, 400, { kind: 'woman', col: '#030405', armUp: i === 1, rim: 'rgba(255,210,150,.5)' })); });
    L(ctx, 1, () => { ctx.fillStyle = 'rgba(4,5,7,.6)'; ctx.fillRect(1050, 200, 760, 520);
      riseText(ctx, '«ЭТО РЕБЁНОК»', 1100, 330, tChild, { size: 76, wt: '700', align: 'left' }); riseText(ctx, '«ЕМУ СТРАШНО»', 1100, 480, tScared, { size: 76, wt: '700', align: 'left' }); riseText(ctx, '«ВЫЗОВИТЕ СКОРУЮ»', 1100, 630, tAmb, { size: 76, wt: '700', align: 'left', col: C.red2 }); });
  }, { tr: 'smear' });
  shot(tListen - .2, (ctx, lt, D) => {
    camera(lt, D, { z: [1.0, 1.08] }); bgDark(ctx, '14,18,24');
    const tilt = E.io(ap(tBelieve, 1.2, E.lin)) * .22;
    L(ctx, .9, () => {
      ctx.save(); ctx.translate(W / 2, 360); ctx.strokeStyle = C.cold; ctx.lineWidth = 8; ctx.beginPath(); ctx.moveTo(0, -60); ctx.lineTo(0, 480); ctx.stroke(); ctx.fillStyle = C.cold; ctx.fillRect(-120, 470, 240, 14);
      ctx.rotate(tilt); ctx.beginPath(); ctx.moveTo(-520, 0); ctx.lineTo(520, 0); ctx.stroke();
      [[-520, 'ТРИ ЖЕНЩИНЫ', -tilt], [520, 'ВЗРОСЛЫЙ МУЖЧИНА', -tilt]].forEach(([x, s, r], i) => { ctx.save(); ctx.translate(x, 0); ctx.rotate(r); ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(-120, 220); ctx.moveTo(0, 0); ctx.lineTo(120, 220); ctx.stroke(); ctx.fillStyle = i ? C.red2 : C.cold; ctx.fillRect(-150, 220, 300, 14); txt(ctx, s, 0, 290, { size: 44, wt: '600', ls: 3, col: i ? C.red2 : C.white }); ctx.restore(); });
      ctx.restore();
      riseText(ctx, 'ВЕРЯТ ЕМУ', W / 2, 1000, tBelieve + .6, { size: 80, wt: '700', ls: 10, col: C.red2 });
    });
  }, { tr: 'fade', td: .5 });
  ev(tBelieve, 'creak', { d: 1.2 });
  const tBack = c('Они отводят'), tBody = c('И даже не замечают');
  shot(tBack - .2, (ctx, lt, D) => {
    camera(lt, D, { z: [1.0, 1.2], x: [0, 80] });
    const op = 1 - ap(tBack + 2.2, 1.3, E.io);
    policeWall(ctx, lt, { open: op * .7 + .02, k: .7 });
    L(ctx, .9, () => { const w = ap(tBack + .1, 2, E.io); figure(ctx, lerp(900, 1280, w), 940, 330, { kind: 'cop', col: '#020304', rim: 'rgba(255,190,120,.4)', a: 1 - ap(tBack + 2.1, .5) }); figure(ctx, lerp(1000, 1330, w), 940, 230, { kind: 'child', col: '#020304', a: 1 - ap(tBack + 2.1, .5) }); });
    L(ctx, 1, () => { riseText(ctx, 'ОБРАТНО В КВАРТИРУ', W / 2 - 300, 270, tBack + .5, { size: 70, wt: '700', ls: 6 }); typeText(ctx, 'В соседней комнате — тело. Его не заметили.', 160, 900, tBody + .3, { size: 40, col: C.cold, cps: 26 }); });
  }, { tr: 'fade', td: .6, lb: 1 });
  ev(tBack + 2.4, 'door'); ev(tBody + .3, 'type', { d: 1.6 });
  const tName = c('Мальчика звали'), t30 = c('Примерно через полчаса');
  shot(tName - .3, (ctx, lt, D) => {
    camera(lt, D, { z: [1.0, 1.08], hand: .4 }); ctx.fillStyle = '#020203'; ctx.fillRect(0, 0, W, H);
    L(ctx, 1, () => {
      const o = ap(t30 - .9, .6);
      ctx.save(); ctx.globalAlpha = 1 - o * .7;
      trackText(ctx, 'КОНЕРАК СИНТАСОМФОН', W / 2, 470, tName + .5, { f: F.serif, size: 90, ls: 6, ls0: 30, d: 2 });
      txt(ctx, '14 лет', W / 2, 560, { f: F.mono, size: 40, col: C.cold, a: ap(tName + 1.6, .6) });
      ctx.restore();
      slamText(ctx, '≈ 30 МИНУТ', W / 2, 800, t30 + .3, { size: 160, wt: '700', col: C.red2, glow: C.red, gb: 40 });
      riseText(ctx, 'после ухода полиции', W / 2, 900, t30 + 1, { f: F.serif, size: 44, col: C.cold });
    });
  }, { tr: 'dip', td: 1, lb: 1 });
  ev(t30 - 1.35, 'silence', { d: 1.3 }); ev(t30 + .3, 'boomlow');
  // two months later
  const t2m = c('Через два месяца'), tTr = c('Трейси Эдвардс'), tArr = c('Дамера арестовали'), t17 = c('семнадцати'), t5 = c('Пять из них');
  shot(t2m - .2, (ctx, lt, D) => {
    camera(lt, D, { z: [1.0, 1.08], x: [-50, 50] }); bgDark(ctx, '14,18,24');
    L(ctx, .9, () => timeline(ctx, [{ x: 480, label: '27.05.1991', sub: 'ПОЛИЦИЯ УХОДИТ' }, { x: 1440, label: '22.07.1991', sub: 'ТРЕЙСИ ЭДВАРДС ВЫРВАЛСЯ', red: 1 }], 520, [t2m - .1, t2m + .9], { x0: 300, x1: W - 300 }));
    L(ctx, 1, () => riseText(ctx, 'ПРИВЁЛ ПОЛИЦИЮ', 1440, 760, tTr + 1.2, { size: 60, wt: '700', ls: 6, col: C.white }));
  }, { tr: 'paper', td: .8 });
  shot(tArr - .2, (ctx, lt, D) => {
    camera(lt, D, { z: [1.0, 1.1] }); bgDark(ctx, '14,18,24');
    L(ctx, .9, () => {
      counter(ctx, 17, 420, 480, t17 - .1, { size: 380, d: 1.2 }); txt(ctx, 'ПРИЗНАНИЙ', 420, 700, { size: 56, wt: '600', ls: 6, a: ap(t17 + .3, .4) });
      figureGrid(ctx, 17, 6, 900, 380, 150, 260, t17, 1.2, { kind: () => 'man', col: '#93a3b3', red: i => NOW > t5 + .4 && i >= 12 });
      riseText(ctx, 'ПЯТЬ — ПОСЛЕ ПРЕДУПРЕЖДЕНИЙ СОСЕДКИ', 1270, 980, t5 + .5, { size: 46, wt: '600', ls: 3, col: C.red2 });
    });
  }, { tr: 'flash' });
  ev(t17 - .1, 'tick', { d: 1.2 }); ev(t5 + .4, 'hit');
  const tFired = c('Двоих полицейских'), tCity = c('Но город'), tAfter = c('После этого дела');
  shot(tFired - .2, (ctx, lt, D) => {
    camera(lt, D, { z: [1.0, 1.12], r: [.01, -.01] }); deskBg(ctx, .4);
    L(ctx, .9, () => {
      icon(ctx, 'badge', 700, 460, 260, { col: C.cold, lw: 5 }); icon(ctx, 'badge', 1220, 460, 260, { col: C.cold, lw: 5 });
      stamp(ctx, 'УВОЛЕНЫ', W / 2 - 40, 480, tFired + .7, { size: 140 });
      const q = ap(tCity, .5); if (q > 0) { ctx.fillStyle = `rgba(4,5,7,${.8 * q})`; ctx.fillRect(0, 700, W, 300); }
      typeText(ctx, 'Поступили бы они так, если бы', 220, 800, tCity + 1.4, { size: 46, cps: 26, cursor: false }); typeText(ctx, 'на улице оказался другой ребёнок?', 220, 870, tCity + 2.6, { size: 46, cps: 26, col: C.red2 });
      const o = ap(tAfter, .6); if (o > 0) { ctx.fillStyle = `rgba(4,5,7,${o})`; ctx.fillRect(0, 0, W, H); riseText(ctx, 'МИЛУОКИ: ПОЛИЦИЮ ПЕРЕУЧИВАЛИ', W / 2, 500, tAfter + .3, { size: 76, wt: '700', ls: 4 }); riseText(ctx, 'и учились слышать тех, кого годами не слышали', W / 2, 600, tAfter + 1.5, { f: F.serif, size: 46, col: C.cold }); }
    });
  }, { tr: 'smear' });
  ev(tFired + .7, 'stampbig'); ev(tCity + 1.4, 'type', { d: 2.6 });
};

window.s7 = function () {
  const S = 7, c = (p, n) => cue(S, p, n);
  const t0 = SC(7).t0, tCh = c('Чикатило вокзалы'), tRi = c('Риджуэй женщины'), tBu = c('Банди те'), tDa = c('Дамер тот'), t4 = c('Четыре человека'), tGap = c('был разрыв'), tD1 = c('В расстоянии'), tD2 = c('во внимании'), tD3 = c('в доверии'), tD4 = c('в вере'), tEach = c('И каждый раз');
  const words = [['ВОКЗАЛ', tCh], ['НЕ ХВАТЯТСЯ', tRi], ['ДОВЕРИЕ', tBu], ['НЕ ПОВЕРЯТ', tDa]];
  shot(t0 - .7, (ctx, lt, D) => {
    camera(lt, D, { z: [1.0, 1.12], y: [0, -20] }); deskBg(ctx, .5);
    const knot = ap(t4 + 1.0, 1.8, E.io);
    L(ctx, .9, () => {
      words.forEach(([w, t], i) => { const x = 300 + i * 440, y = 470; folder(ctx, lerp(x, W / 2 + (i - 1.5) * 120, knot * .5), lerp(y, 470, knot), 380, 480, '', { rot: (i - 1.5) * .05 * (1 - knot), head: ['ЧИКАТИЛО', 'РИДЖУЭЙ', 'БАНДИ', 'ДАМЕР'][i], s: lerp(1, .8, knot) });
        const q = ap(t + .2, .4); if (q > 0) { const xx = lerp(x, W / 2 + (i - 1.5) * 120, knot * .5); ctx.fillStyle = `rgba(14,16,20,${q * .9})`; ctx.fillRect(xx - 160, 530 - 60 + lerp(0, 0, knot), 320, 90); txt(ctx, w, xx, 530, { size: 46, wt: '700', ls: 4, col: C.white, a: q }); } });
      // threads converge
      if (knot > 0) [0, 1, 2, 3].forEach(i => thread(ctx, [300 + i * 440, 250], [W / 2, 820], knot, 20));
      if (knot > .9) { ctx.fillStyle = C.red2; ctx.beginPath(); ctx.arc(W / 2, 820, 24, 0, 7); ctx.fill(); }
    });
    L(ctx, 1, () => slamText(ctx, 'РАЗРЫВ', W / 2, 960, tGap + .2, { size: 120, wt: '700', ls: 20, col: C.red2, glow: C.red }));
  }, { tr: 'fade', td: .7 });
  words.forEach(([w, t]) => ev(t + .2, 'tickone')); ev(t4 + 1, 'thread'); ev(tGap + .2, 'boom');
  shot(tD1 - .2, (ctx, lt, D) => {
    camera(lt, D, { z: [1.0, 1.1] });
    const cr = 1; gapScene(ctx, lt, { crack: lerp(.3, 1, ap(tD1, 1.5, E.io)) });
    L(ctx, 1, () => { [['РАССТОЯНИЕ', tD1], ['ВНИМАНИЕ', tD2], ['ДОВЕРИЕ', tD3], ['ВЕРА', tD4]].forEach(([s, t], i) => riseText(ctx, s, 300 + i * 440, 240, t, { size: 56, wt: '700', ls: 4, col: i === 3 ? C.red2 : C.white })); riseText(ctx, 'УБИЙЦА НАХОДИЛ ЭТОТ РАЗРЫВ РАНЬШЕ', W / 2, 400, tEach + .3, { f: F.serif, size: 48, col: C.cold }); });
  }, { tr: 'smear' });
  ev(tD1, 'crack', { d: 1.5 });
  const tWrong = c('Поэтому как не стать'), tBlame = c('Вина всегда'), tRight = c('Правильный вопрос'), tClose = c('как закрыть разрыв');
  shot(tWrong - .2, (ctx, lt, D) => {
    camera(lt, D, { z: [1.08, 1.0] }); bgDark(ctx, '22,20,20');
    L(ctx, 1, () => {
      txt(ctx, '«КАК НЕ СТАТЬ ЖЕРТВОЙ?»', W / 2, 330, { size: 90, wt: '700', ls: 4, a: ap(tWrong + .2, .4) * (1 - ap(tRight, .5) * .6) });
      font(ctx, F.osw, 90, '700'); ctx.letterSpacing = '4px'; const tw = ctx.measureText('«КАК НЕ СТАТЬ ЖЕРТВОЙ?»').width; strike(ctx, W / 2 - tw / 2, W / 2 + tw / 2, 300, tWrong + 2.0, { w: 12, glow: 1 });
      riseText(ctx, 'ВИНА ВСЕГДА ТОЛЬКО НА УБИЙЦЕ', W / 2, 530, tBlame, { f: F.serif, size: 60, col: C.white });
      slamText(ctx, 'КАК ЗАКРЫТЬ РАЗРЫВ?', W / 2, 780, tClose, { size: 130, wt: '700', ls: 6, col: '#e8c98f', glow: 'rgba(232,201,143,.5)' });
    });
  }, { tr: 'fade', td: .6, warm: .6 });
  ev(tWrong + 2, 'strike'); ev(tClose, 'boomwarm');
  const tThree = c('Три вещи'), tF1 = c('Первое'), tF2 = c('Второе'), tF3 = c('Третье'), tKnow = c('Невидимость исчезает'), tTwo = c('Две женщины'), tNb = c('Соседка Дамера'), tCall = c('Лишний звонок');
  shot(tThree - .2, (ctx, lt, D) => {
    camera(lt, D, { z: [1.0, 1.1] }); gapScene(ctx, lt, { warm: 1, bridge: ap(tThree + .3, 2.5, E.io), helper: 1 });
    L(ctx, 1, () => riseText(ctx, 'ТРИ ВЕЩИ, КОТОРЫЕ ЗАКРЫВАЮТ РАЗРЫВ', W / 2, 240, tThree + .3, { size: 64, wt: '700', ls: 4, col: '#e8c98f' }));
  }, { tr: 'fade', td: .6, warm: 1 });
  ev(tThree + .3, 'build', { d: 2.5 });
  const cards = [
    ['car', 'ПОМОГАЙТЕ БЕЗ ПЕРЕМЕЩЕНИЯ', ['Незнакомец зовёт в машину,', 'в подъезд, в безлюдное место?', 'Позвоните сами, позовите людей.'], tF1],
    ['pin', 'ПУСТЬ КТО-ТО ЗНАЕТ', ['Куда вы идёте, с кем', 'и во сколько вернётесь.', 'Особенно — дети.'], tF2],
    ['handset', 'ЗАМЕТИЛИ ТРЕВОЖНОЕ — СКАЖИТЕ', ['Даже если кажется,', 'что вы ошибаетесь.', 'Звонок лучше молчания.'], tF3]];
  shot(tF1 - .3, (ctx, lt, D) => {
    camera(lt, D, { z: [1.0, 1.06], x: [-30, 30] }); bgDark(ctx, '30,24,18');
    L(ctx, .4, () => motes(ctx, 40, 9, .4));
    const act = NOW < tF2 ? 0 : NOW < tF3 ? 1 : 2; const fin = ap(tCall, .8, E.io);
    L(ctx, .9, () => cards.forEach(([ic, title, lines, t], i) => {
      const q = ap(t, .6, E.back); if (q <= 0) return;
      const on = i === act ? 1 : 0; const foc = lerp(on ? 1 : .8, 1, fin);
      const x = 340 + i * 620, y = 560;
      ctx.save(); ctx.translate(x, y); ctx.scale(q * (on && fin < 1 ? 1.06 : .96), q * (on && fin < 1 ? 1.06 : .96)); ctx.globalAlpha = foc;
      ctx.shadowColor = 'rgba(0,0,0,.7)'; ctx.shadowBlur = 40; ctx.fillStyle = on && fin < 1 ? '#1f1a14' : '#15130f'; ctx.beginPath(); ctx.roundRect(-280, -360, 560, 720, 24); ctx.fill(); ctx.shadowColor = 'transparent';
      ctx.strokeStyle = on ? '#e8c98f' : 'rgba(232,201,143,.3)'; ctx.lineWidth = 3; ctx.stroke();
      txt(ctx, String(i + 1), -220, -260, { size: 80, wt: '700', col: '#e8c98f', align: 'left' });
      icon(ctx, ic, 0, -170, 150, { col: '#e8c98f', lw: 5 }); if (ic === 'pin') icon(ctx, 'clock', 80, -120, 60, { col: '#e8c98f', lw: 6 });
      font(ctx, F.osw, 44, '700'); ctx.letterSpacing = '2px'; const tl = wrapLines(ctx, title, 480); tl.forEach((l, k) => txt(ctx, l, 0, -10 + k * 54, { size: 44, wt: '700', ls: 2 }));
      lines.forEach((l, k) => txt(ctx, l, 0, 140 + k * 50, { f: F.sans, size: 34, col: '#c9c2b4', a: ap(t + .6 + k * .4, .4) }));
      ctx.restore();
    }));
    L(ctx, 1, () => { if (NOW > tTwo && NOW < tCall) { const q = ap(tTwo, .4) * (1 - ap(tCall - .3, .3)); ctx.fillStyle = `rgba(10,8,6,${.85 * q})`; ctx.fillRect(0, 900, W, 140); txt(ctx, 'Имя Банди назвали полиции ещё в 1974-м · Соседка Дамера звонила не раз', W / 2, 985, { f: F.serif, size: 40, col: '#e8c98f', a: q }); } });
  }, { tr: 'fade', td: .6, warm: 1 });
  [tF1, tF2, tF3].forEach(t => ev(t, 'card'));
};

window.s8 = function () {
  const S = 8, c = (p, n) => cue(S, p, n);
  const t0 = SC(8).t0, tCal = c('Калифорния'), tSer = c('Серия ночных'), tTot = c('В итоге не менее'), t13 = c('тринадцати'), t50 = c('пятидесяти'), t120 = c('ста двадцати'), tNames = c('Преступника называли'), tGSK = c('Убийца из Золотого');
  shot(t0 - .3, (ctx, lt, D) => {
    camera(lt, D, { z: [1.0, 1.06], hand: .3 }); ctx.fillStyle = '#020203'; ctx.fillRect(0, 0, W, H);
    L(ctx, 1, () => trackText(ctx, 'ОБЕЩАННАЯ ИСТОРИЯ', W / 2, 560, t0 + .2, { size: 90, wt: '700', ls: 20, ls0: 60, d: 1.8 }));
  }, { tr: 'fade', td: 1.2, lb: 1 });
  shot(tCal - .2, (ctx, lt, D) => {
    camera(lt, D, { hand: .4 }); seaBg(ctx);
    const P = geoCam(lt, D, { lon: -105, lat: 39, s: 22 }, { lon: -120, lat: 37.4, s: 82 });
    usMap(ctx, P, { California: .25 });
    const y = Math.round(lerp(1974, 1986, ap(tCal + .8, 4, E.io)));
    for (let i = 0; i < 26; i++) { const lon = -121.3 - hr(i) * 1.5 + (i > 12 ? 1.5 + hr(i * 3) * 2 : 0), lat = 38.6 - hr(i * 7) * (i > 12 ? 4.6 : 1.6); const [x, yy] = P(lon, lat); pulse(ctx, x, yy, tCal + .8 + i * .15, { r: 6, R: 26 }); }
    const [lx, ly] = P(-119.2, 37.2); mapLabel(ctx, 'КАЛИФОРНИЯ', lx + 120, ly + 40, tCal + .2, { size: 54, col: C.white, align: 'left' });
    txt(ctx, String(y), 1650, 980, { size: 110, wt: '700', col: C.red2, a: ap(tCal + .6, .4) });
  }, { tr: 'fade', td: .6 });
  for (let i = 0; i < 26; i += 2) ev(tCal + .8 + i * .15, 'tickone');
  shot(tSer - .2, (ctx, lt, D) => {
    camera(lt, D, { z: [1.0, 1.1] }); houseNight(ctx, lt, { lit: NOW < tSer + 2.2 ? 1 : 0, figure: 0 });
    L(ctx, 1, () => { const q = ap(tTot, .5); if (q > 0) { ctx.fillStyle = `rgba(3,4,6,${.8 * q})`; ctx.fillRect(0, 0, W, H); }
      [[13, '', 'УБИЙСТВ', t13, 420], [50, '+', 'НАПАДЕНИЙ', t50, W / 2], [120, '+', 'КРАЖ', t120, W - 420]].forEach(([n, pl, l, t, x]) => { counter(ctx, n, x, 500, t - .2, { size: 230, d: 1 }); if (pl) txt(ctx, pl, x + (n > 99 ? 210 : 150), 460, { size: 130, wt: '700', col: C.red2, a: ap(t + .8, .3) }); txt(ctx, l, x, 680, { size: 56, wt: '600', ls: 8, a: ap(t, .4), col: C.cold }); });
      riseText(ctx, 'НЕ МЕНЕЕ', W / 2, 260, tTot, { f: F.mono, size: 40, col: C.cold }); });
  }, { tr: 'smear' });
  ev(tSer + 2.2, 'click'); [t13, t50, t120].forEach(t => ev(t - .2, 'tick', { d: 1 }));
  shot(tNames - .2, (ctx, lt, D) => {
    camera(lt, D, { z: [1.0, 1.15], x: [40, -20] }); corkBg(ctx, .5);
    L(ctx, .9, () => { print(ctx, 'fbi_poster', W / 2, 480, 1150, 632, { rot: -.01, pin: 1, fy: .5, border: 10 }); });
    L(ctx, 1, () => { const q = ap(tGSK, .5); if (q > 0) { ctx.fillStyle = `rgba(3,4,6,${.75 * q})`; ctx.fillRect(0, 820, W, 200); } trackText(ctx, 'УБИЙЦА ИЗ ЗОЛОТОГО ШТАТА', W / 2, 950, tGSK + .2, { f: F.play, size: 92, wt: '700', ls: 4, ls0: 30, d: 1.6 }); });
  }, { tr: 'paper', td: .8, lb: 1 });
  ev(tGSK, 'boomlow');
  const t42 = c('Сорок два года'), tGone = c('Он будто'), tExp = c('Эксперты удивлялись');
  shot(t42 - .2, (ctx, lt, D) => {
    camera(lt, D, { z: [1.0, 1.12] }); bgDark(ctx, '12,16,22');
    L(ctx, .5, () => { const f = ap(tGone + .5, 2.5, E.io); ctx.globalAlpha = .35 * (1 - f); const sk = PROC.fbi_poster; ctx.drawImage(sk, 190, 255, 380, 160, 160, 280, 1600, 674); ctx.globalAlpha = 1; });
    L(ctx, .9, () => {
      const p = ap(t42 + .2, 3.2, E.io); txt(ctx, String(Math.round(lerp(1976, 2018, p))), W / 2, 330, { f: F.mono, size: 70, col: C.cold, a: ap(t42, .3) });
      slamText(ctx, '42 ГОДА', W / 2, 600, t42 + .1, { size: 240, wt: '700', ls: 10 });
      riseText(ctx, 'НИКТО НЕ ЗНАЛ ЕГО ИМЕНИ', W / 2, 720, t42 + 1.2, { size: 56, wt: '500', ls: 10, col: C.cold, out: tExp - .3 });
      typeText(ctx, 'Откуда он так хорошо знает методы полиции?', W / 2, 880, tExp + 1.2, { size: 46, align: 'center', col: C.red2, cps: 28 });
    });
  }, { tr: 'glitch', td: .4 });
  ev(t42 + .1, 'hit'); ev(t42 + .2, 'tick', { d: 3.2 }); ev(tExp + 1.2, 'type', { d: 1.6 });
  // TWIST
  const tAns = c('Ответ оказался'), tCop = c('Он сам был'), tJD = c('Джозеф Деанджело'), tEx = c('Эксетер'), tOb = c('Оберне'), t79 = c('В тысяча девятьсот семьдесят девятом'), tShop = c('за кражу'), tAfter = c('большинство убийств'), tMech = c('Позже он работал'), tHid = c('Невидимка');
  ev(tAns - 1.65, 'silence', { d: 1.6 });
  shot(tAns - .4, (ctx, lt, D) => {
    camera(lt, D, { z: [1.0, 1.12], x: [-20, 40], hand: .6 }); deskBg(ctx, .4);
    L(ctx, .9, () => {
      paperSheet(ctx, W / 2, 560, 1500, 960, -.01);
      ctx.save(); ctx.translate(W / 2, 560); ctx.rotate(-.01);
      txt(ctx, 'ДОСЬЕ', -660, -380, { size: 60, wt: '700', col: '#1d2024', align: 'left', ls: 10 });
      txt(ctx, 'ДЕАНДЖЕЛО, Джозеф Джеймс', -660, -300, { f: F.mono, size: 46, col: '#1d2024', align: 'left', a: ap(tJD, .4) });
      const lines = [['Служба: полиция, г. Эксетер', tEx], ['Служба: полиция, г. Оберн', tOb], ['1979 — уволен: кража в магазине', tShop], ['Большинство убийств — после увольнения', tAfter], ['Механик. Вышел на пенсию.', tMech]];
      lines.forEach(([s, t], i) => { txt(ctx, s, -660, -180 + i * 80, { f: F.mono, size: 40, col: i === 3 ? '#7a1e1e' : '#1d2024', align: 'left' }); redact(ctx, -670, -220 + i * 80, 1100, 56, { off: ap(t, .6, E.lin) }); });
      ctx.restore();
      stamp(ctx, 'БЫВШИЙ ПОЛИЦЕЙСКИЙ', W / 2 + 60, 880, tCop + .5, { size: 92, rot: -.06 });
      const big = ap(tCop, .5) * (1 - ap(tCop + .5, .2)); if (big > 0) { ctx.fillStyle = `rgba(0,0,0,${big * .6})`; ctx.fillRect(0, 0, W, H); }
      // badge
      if (NOW > tCop + .5) icon(ctx, 'badge', 1520, 380, 220, { col: 'rgba(122,30,30,.6)', lw: 7, a: ap(tCop + .6, .5) });
    });
    L(ctx, 1, () => riseText(ctx, 'НЕВИДИМКА НА САМОМ ВИДУ', W / 2, 140, tHid, { size: 64, wt: '700', ls: 8, col: C.white }));
  }, { tr: 'dip', td: .8 });
  ev(tCop + .5, 'stampbig'); ev(tCop + .5, 'boom');
  [tEx, tOb, tShop, tAfter, tMech].forEach(t => ev(t, 'redact'));
  // how found
  const tNot = c('И нашли его не'), tPr = c('не по отпечатку'), tWit = c('не по свидетелю'), tConf = c('не по признанию'), t2018 = c('В две тысячи восемнадцатом'), tUp = c('загрузили'), tRel = c('Совпал не он сам');
  shot(tNot - .2, (ctx, lt, D) => {
    camera(lt, D, { z: [1.0, 1.08] }); bgDark(ctx, '14,18,24');
    L(ctx, .9, () => {
      [['finger', 'ОТПЕЧАТОК', tPr], ['eye', 'СВИДЕТЕЛЬ', tWit], ['q', 'ПРИЗНАНИЕ', tConf]].forEach(([ic, l, t], i) => { const x = 480 + i * 480; icon(ctx, ic, x, 470, 240, { col: C.cold, a: ap(t - .3, .4), lw: 4 }); cross(ctx, x, 470, 240, t + .3); txt(ctx, l, x, 680, { size: 50, wt: '600', ls: 6, a: ap(t - .3, .4) }); });
    });
  }, { tr: 'smear' });
  [tPr, tWit, tConf].forEach(t => ev(t + .3, 'strike'));
  shot(t2018 - .2, (ctx, lt, D) => {
    camera(lt, D, { z: [1.0, 1.1], x: [-40, 40] }); bgDark(ctx, '12,16,22');
    L(ctx, .9, () => {
      helix(ctx, 480, 520, 600, 70, NOW, { reveal: ap(t2018, 1.2), n: 18, rot: Math.PI / 2 * .0 });
      txt(ctx, 'ДНК С МЕСТА ПРЕСТУПЛЕНИЯ', 480, 700, { f: F.mono, size: 30, col: C.cold, a: ap(t2018 + .6, .4) });
      const q = ap(tUp, .6, E.back);
      if (q > 0) { ctx.save(); ctx.translate(1350, 520); ctx.scale(q, q); ctx.fillStyle = '#0f141a'; ctx.strokeStyle = C.cold; ctx.lineWidth = 3; ctx.beginPath(); ctx.roundRect(-360, -240, 720, 480, 18); ctx.fill(); ctx.stroke(); ctx.fillStyle = '#1b2430'; ctx.fillRect(-360, -240, 720, 60); [0, 1, 2].forEach(k => { ctx.fillStyle = ['#e2443c', '#c9a65a', '#5a8a5a'][k]; ctx.beginPath(); ctx.arc(-320 + k * 30, -210, 9, 0, 7); ctx.fill(); });
        txt(ctx, 'ОТКРЫТАЯ ГЕНЕАЛОГИЧЕСКАЯ БАЗА', 0, -120, { size: 40, wt: '600', ls: 2 }); const up = ap(tUp + .4, 2.2, E.io); ctx.fillStyle = '#26313c'; ctx.fillRect(-280, -40, 560, 24); ctx.fillStyle = C.cold; ctx.fillRect(-280, -40, 560 * up, 24); txt(ctx, up < 1 ? 'загрузка профиля… ' + Math.round(up * 100) + '%' : 'поиск совпадений', 0, 40, { f: F.mono, size: 30, col: C.cold });
        if (NOW > tRel) { ['дальний родственник', 'дальний родственник', 'троюродная ветвь'].forEach((s, k) => { const a = ap(tRel + .3 + k * .35, .4); ctx.fillStyle = `rgba(226,68,60,${a})`; ctx.fillRect(-280, 90 + k * 46, 12, 30); txt(ctx, s + ' · совпадение', -250, 114 + k * 46, { f: F.mono, size: 28, align: 'left', a }); }); }
        ctx.restore(); }
      if (q > 0) { ctx.strokeStyle = 'rgba(142,162,181,.5)'; ctx.setLineDash([10, 10]); ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(800, 520); ctx.lineTo(lerp(800, 990, q), 520); ctx.stroke(); ctx.setLineDash([]); }
    });
  }, { tr: 'fade', td: .6 });
  ev(tUp + .4, 'scan', { d: 2.2 }); [0, 1, 2].forEach(k => ev(tRel + .3 + k * .35, 'tickone'));
  // family tree
  const tGen = c('Генеалоги около'), tLeft = c('пока не остался'), tWatch = c('За ним установили'), tItem = c('выброшенный'), tMatch = c('Совпало');
  shot(tGen - .2, (ctx, lt, D) => {
    camera(lt, D, { z: [1.0, 1.12], y: [30, -20] }); bgDark(ctx, '12,16,22');
    const toItem = ap(tWatch - .2, .8, E.io);
    L(ctx, .9, () => {
      ctx.save(); ctx.globalAlpha = 1 - toItem;
      // tree: levels
      const levels = [[W / 2], [560, 1360], [340, 760, 1160, 1580], []]; for (let i = 0; i < 12; i++) levels[3].push(220 + i * 135);
      const ys = [200, 400, 600, 830]; const final = 7;
      for (let l = 1; l < 4; l++) levels[l].forEach((x, i) => { const par = levels[l - 1][Math.floor(i * levels[l - 1].length / levels[l].length)]; const cut = l === 3 && i !== final ? ap(tGen + 1.8 + i * .2, .4) : 0; const draw = ap(tGen + l * .4, .6); ctx.strokeStyle = `rgba(142,162,181,${.6 * draw * (1 - cut * .85)})`; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(par, ys[l - 1] + 26); ctx.lineTo(par, (ys[l - 1] + ys[l]) / 2); ctx.lineTo(x, (ys[l - 1] + ys[l]) / 2); ctx.lineTo(x, ys[l] - 26); ctx.stroke(); });
      levels.forEach((lv, l) => lv.forEach((x, i) => { const draw = ap(tGen + l * .4, .5); const cut = l === 3 && i !== final ? ap(tGen + 1.8 + i * .2, .4) : 0; const sel = l === 3 && i === final ? ap(tLeft + .3, .5) : 0;
        ctx.globalAlpha = (1 - toItem) * draw * (1 - cut * .85); ctx.fillStyle = sel ? C.red2 : '#2a3540'; ctx.strokeStyle = sel ? C.red2 : C.cold; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(x, ys[l], sel ? 32 : 24, 0, 7); ctx.fill(); ctx.stroke();
        if (cut > .5) { ctx.strokeStyle = C.red2; ctx.beginPath(); ctx.moveTo(x - 18, ys[l] - 18); ctx.lineTo(x + 18, ys[l] + 18); ctx.stroke(); } }));
      ctx.restore();
      ctx.globalAlpha = 1 - toItem; txt(ctx, '≈ 4 МЕСЯЦА', 1640, 140, { size: 70, wt: '700', col: C.red2, a: ap(tGen + .8, .4) * (1 - toItem) }); txt(ctx, 'нужный возраст · нужное место', W / 2, 940, { f: F.serif, size: 44, col: C.cold, a: ap(tLeft + .8, .5) * (1 - toItem) }); ctx.globalAlpha = 1;
      // discarded item under magnifier
      if (toItem > 0) { ctx.save(); ctx.globalAlpha = toItem; icon(ctx, 'trash', W / 2 - 120, 560, 260, { col: C.cold, lw: 4 }); const mx = lerp(W / 2 + 300, W / 2 + 40, ap(tItem, 1, E.io)); icon(ctx, 'magnifier', mx, 500, 240, { col: C.white, lw: 5 }); txt(ctx, 'ВЫБРОШЕННЫЙ ПРЕДМЕТ С ДНК', W / 2, 860, { size: 50, wt: '600', ls: 4 }); ctx.restore(); }
      stamp(ctx, 'СОВПАЛО', W / 2 + 330, 640, tMatch + .05, { size: 150 });
    });
  }, { tr: 'fade', td: .6 });
  for (let i = 0; i < 12; i++) if (i !== 7) ev(tGen + 1.8 + i * .2, 'snip'); ev(tLeft + .3, 'hit'); ev(tMatch + .05, 'stampbig');
  // arrest 2018
  const tArr = c('Двадцать четвёртого апреля'), t72 = c('Ему было семьдесят'), tLife = c('Позже его приговорили');
  shot(tArr - .2, (ctx, lt, D) => {
    camera(lt, D, { z: [1.0, 1.1], x: [-30, 30] }); bgDark(ctx, '12,16,22');
    L(ctx, .9, () => { print(ctx, 'deangelo_court', 700, 500, 1000, 664, { rot: -.015, fx: .45 });
      ctx.fillStyle = 'rgba(4,5,7,.8)'; ctx.fillRect(1290, 220, 560, 560);
      riseText(ctx, '24.04.2018', 1570, 360, tArr + .2, { size: 90, wt: '700' }); riseText(ctx, 'АРЕСТ', 1570, 430, tArr + .5, { f: F.mono, size: 34, col: C.cold });
      counter(ctx, 72, 1570, 580, t72, { size: 170, d: 1 }); txt(ctx, 'ГОДА', 1570, 700, { size: 50, wt: '600', ls: 8, a: ap(t72 + .3, .4) });
      stamp(ctx, 'ПОЖИЗНЕННО', 1570, 900, tLife + .8, { size: 80 });
      txt(ctx, 'Сакраменто, суд, 27.04.2018 · фото: Getty Images', 220, 905, { f: F.mono, size: 22, col: C.dim, align: 'left' });
    });
  }, { tr: 'flash' });
  ev(tArr + .2, 'hit'); ev(t72, 'tick', { d: 1 }); ev(tLife + .8, 'stamp');
  // reflection
  const tThink = c('Задумайтесь'), tNoErr = c('ни одной ошибки'), tPeople = c('А выдали его'), tDidnt = c('Они не знали');
  shot(tThink - .2, (ctx, lt, D) => {
    camera(lt, D, { z: [1.08, 1.0] }); bgDark(ctx, '12,16,22');
    L(ctx, .8, () => {
      const q = ap(tPeople, 1);
      for (let i = 0; i < 60; i++) { const cl = i % 15, r = Math.floor(i / 15); const x = 160 + cl * 115, y = 500 + r * 150; const on = ap(tPeople + .3 + hr(i) * 3, .4);
        if (q <= 0) continue; ctx.globalAlpha = q; bust(ctx, x, y, 100, { col: '#56636f', kind: i % 2 ? 'woman' : 'man' }); ctx.globalAlpha = 1; if (on > 0) { ctx.save(); ctx.globalCompositeOperation = 'lighter'; spot(ctx, x, y - 70, 70, .5 * on, '220,200,150'); ctx.restore(); } }
    });
    L(ctx, 1, () => { const o = ap(tPeople - .3, .5); ctx.save(); ctx.translate(0, -o * 230);
      slamText(ctx, '42 ГОДА', W / 2, 440, tThink + .5, { size: 170, wt: '700', ls: 8 }); riseText(ctx, 'НИ ОДНОЙ ОШИБКИ', W / 2, 560, tNoErr, { size: 70, wt: '600', ls: 12, col: C.red2 }); ctx.restore();
      riseText(ctx, 'ЕГО ВЫДАЛИ ЛЮДИ, ИСКАВШИЕ СВОИ КОРНИ', W / 2, 1000, tPeople + 1.5, { f: F.serif, size: 46, col: '#e8d7b0' }); });
  }, { tr: 'fade', td: .7 });
  ev(tThink + .5, 'hit');
  const tInv = c('Невидимость работает'), tNoInv = c('Но по-настоящему'), tLooked = c('И те, на кого'), tEven = c('Даже спустя');
  shot(tInv - .3, (ctx, lt, D) => {
    camera(lt, D, { z: [1.3, 1.0], y: [-60, 0], ease: E.sine }); ctx.fillStyle = '#030405'; ctx.fillRect(0, 0, W, H);
    L(ctx, .85, () => {
      for (let i = 0; i < 48; i++) { const cl = i % 12, r = Math.floor(i / 12); const x = 140 + cl * 150 + (r % 2) * 60, y = 420 + r * 190; const on = ap(tLooked - 1 + hr(i * 3) * 4, .6);
        ctx.save(); ctx.globalCompositeOperation = 'lighter'; if (on > 0) cone(ctx, x, y - 260, 20, 140, 270, .22 * on, '235,215,170'); ctx.restore();
        figure(ctx, x, y, 170, { kind: i % 3 === 0 ? 'woman' : i % 5 === 0 ? 'child' : 'coat', col: on > 0 ? `rgb(${lerp(20, 205, on)},${lerp(24, 195, on)},${lerp(30, 170, on)})` : '#14181d' }); }
    });
    L(ctx, 1, () => { ctx.fillStyle = 'rgba(3,4,5,.7)'; ctx.fillRect(0, 140, W, 230);
      riseText(ctx, 'НЕВИДИМОСТЬ РАБОТАЕТ, ПОКА НИКТО НЕ СМОТРИТ', W / 2, 240, tInv, { size: 56, wt: '600', ls: 4, out: tNoInv - .3 });
      riseText(ctx, 'НЕВИДИМЫХ ЛЮДЕЙ НЕ БЫВАЕТ', W / 2, 240, tNoInv, { size: 70, wt: '700', ls: 6, col: '#e8d7b0' });
      riseText(ctx, 'бывают те, на кого не посмотрели вовремя', W / 2, 325, tNoInv + 2.4, { f: F.serif, size: 44, col: C.cold }); });
  }, { tr: 'fade', td: 1.0, lb: 1, warm: .4 });
  ev(tInv, 'drone_swell', { d: 10 });
  // outro: next video + end screen
  const tSub = c('Если вам было'), tNext = c('В следующем ролике'), tWant = c('хотите ли вы');
  shot(tSub - .3, (ctx, lt, D) => {
    camera(lt, D, { z: [1.0, 1.06], hand: .4 }); bgDark(ctx, '12,16,22');
    const end = ap(tWant + 3.2, .8, E.io);
    L(ctx, .6, () => { helix(ctx, W / 2, 540, 2200, 110, NOW * .6, { n: 44, a: .35 * (1 - end * .6), rot: -.12 }); });
    L(ctx, 1, () => {
      ctx.save(); ctx.globalAlpha = 1 - end;
      riseText(ctx, 'СЛЕДУЮЩИЙ РОЛИК', W / 2, 380, tNext, { f: F.mono, size: 40, col: C.red2, ls: 10 });
      riseText(ctx, 'КАК РАБОТАЕТ ДНК-ГЕНЕАЛОГИЯ', W / 2, 520, tNext + .5, { size: 100, wt: '700', ls: 4 });
      riseText(ctx, 'Хотите ли вы, чтобы ваша ДНК была в такой базе?', W / 2, 640, tWant, { f: F.serif, size: 52, col: C.cold });
      ctx.restore();
      if (end > 0) {
        ctx.save(); ctx.globalAlpha = end;
        txt(ctx, 'СМОТРИТЕ ДАЛЬШЕ', W / 2, 200, { size: 60, wt: '700', ls: 14 });
        [[560, 'СЛЕДУЮЩИЙ: ДНК-ГЕНЕАЛОГИЯ'], [1360, 'ЕЩЁ ОДНО ДЕЛО']].forEach(([x, s]) => { ctx.strokeStyle = 'rgba(142,162,181,.6)'; ctx.lineWidth = 3; ctx.strokeRect(x - 330, 300, 660, 372); ctx.fillStyle = 'rgba(20,26,33,.6)'; ctx.fillRect(x - 330, 300, 660, 372); txt(ctx, s, x, 730, { size: 38, wt: '600', ls: 3, col: C.cold }); });
        const pq = ap(tWant + 4, .6, E.back); ctx.save(); ctx.translate(W / 2, 880); ctx.scale(pq, pq); ctx.fillStyle = C.red; ctx.beginPath(); ctx.roundRect(-220, -50, 440, 100, 14); ctx.fill(); txt(ctx, 'ПОДПИСАТЬСЯ', 0, 20, { size: 54, wt: '700', ls: 6 }); ctx.restore();
        ctx.restore();
      }
    });
  }, { tr: 'fade', td: 1.0 });
  ev(tWant + 4, 'click');
};
