// ===== Scene 4: Ridgway (swamp green / blue-grey, rain) =====
const K = require('./core'); const Pp = require('./paper'); const X = require('./sets'); const A = require('./anim'); const R = require('./engine'); const DI = require('./dioramas');
const { W, H, F, clamp, lerp, E, hr, S, tw, twos, cue, SC, ev, camera, L, hits, font } = K;
const { P, put, sheet } = Pp;
const desk = () => X.darkDesk(401, '#22322d');
const lamp = (ctx, x = W * .45, y = H * .35) => X.lampLight(ctx, x + K.noise1(S.T * .2) * 30, y, 1000, '200,225,210', .5, .5);
const INK = '#eef0e6';
function build() {
  const S4 = 4, c = (p, n) => cue(S4, p, n); const t0 = SC(4).t0; const GEO = require('./geo');
  const usMap = X.mapSprite('us_ridg', 1600, 960, GEO.us, X.proj(-100, 40, 22, 800, 480), f => f.id === 'Washington' ? { fill: '#5a7a5f', stroke: 'rgba(20,30,25,.6)', lift: 1 } : { fill: '#9aa596', stroke: 'rgba(20,30,25,.3)' }, { paper: '#c4c6b2', age: .4, burn: .4, compass: 1 });
  const tGreen = c('В реке Грин'), tNick = c('Так появляется'), tKill = c('Убийца с реки');
  // A: US map -> Washington lifts
  R.shot(t0 - .3, (ctx, lt, D) => {
    camera(lt, D, { z: [1.0, 1.9], x: [0, -560], y: [0, -300], ease: E.io }); X.bg(ctx, desk(), .4);
    L(ctx, 1, () => { put(ctx, usMap, W / 2, H / 2, { rot: .01 }); const Pj = X.proj(-100, 40, 22, W / 2, H / 2); const [x, y] = Pj(-122.2, 47.4); X.pulseDot(ctx, x, y, t0 + .6, { R: 40, s: .7 }); X.hand(ctx, 'штат Вашингтон', x + 40, y - 70, t0 + .3, { size: 44, color: INK }); });
    L(ctx, 0, () => X.headline(ctx, 'ЛЕТО 1982', 1600, 950, t0 + 1.0, { size: 90, color: INK, bg: '#3d4d3c', rot: .04 }));
    lamp(ctx); DI.rain(ctx, .6, 1);
  }, { tr: 'flash', mood: 'dark' });
  ev(t0, 'rain', { d: SC(4).t1 - t0 }); ev(t0 + 1.0, 'hit');
  // B: Green River map card with animated river line
  const gmap = Pp.polaroid('green_river_map', { w: 480, dark: '#1f2d27', light: '#d7dccb', contrast: 1.3, frame: 'print', border: 12 });
  const riverPts = []; for (let i = 0; i <= 60; i++) { const u = i / 60; riverPts.push([1080 + u * 640 + Math.sin(u * 9) * 30, 720 - u * 360 + Math.cos(u * 7) * 40]); }
  R.shot(tGreen - .2, (ctx, lt, D) => {
    camera(lt, D, { z: [1.0, 1.12], x: [40, -40] }); X.bg(ctx, desk(), .4);
    L(ctx, .85, () => {
      put(ctx, sheet({ w: 1600, h: 900, color: '#b9bea8', seed: 411, tex: .6, lines: 'grid', age: .4, burn: .4 }), W / 2, H / 2, { rot: -.01 });
      put(ctx, DI.hillStrip('gr_h', 1500, 300, '#7c8f74', 5, 90), W / 2, 760, { shadow: .5 });
      X.marker(ctx, riverPts, tw(tGreen + .2, 3, E.io), { color: 'rgba(60,140,190,.85)', w: 18, blend: 'source-over' });
      for (let k = 0; k < 3; k++) { const p = riverPts[15 + k * 15]; X.pulseDot(ctx, p[0], p[1], tGreen + 1.2 + k * .5, { R: 30, s: .55, col: '220,230,235', pin: '#e8e2cf' }); }
      put(ctx, gmap, 560, 470, { rot: -.04 }); put(ctx, Pp.tape(160, 44, 7, 'rgba(200,200,170,.5)'), 560, 200, { rot: .1 });
      X.hand(ctx, 'река Грин', 1260, 300, tGreen + .6, { size: 72, color: '#1f2d27' });
    });
    lamp(ctx, 900, 380); DI.rain(ctx, .5, 2);
  }, { tr: 'fade', td: .6, mood: 'dark' });
  // C: nickname over layered river landscape
  const nick = [Pp.cutWord('УБИЙЦА', 150, 81, { styles: [0, 1, 4] }), Pp.cutWord('С РЕКИ ГРИН', 130, 83, { styles: [0, 1, 4, 5] })];
  R.shot(tNick - .2, (ctx, lt, D) => {
    camera(lt, D, { z: [1.0, 1.1], x: [-60, 60] });
    const sky = Pp.sheet({ w: W + 600, h: H + 400, color: '#2c3b3a', seed: 421, tex: .6, grad: false }); L(ctx, .2, () => put(ctx, sky, W / 2, H / 2, { shadow: 0 }));
    [[.35, 480, '#34483f', 3, 120], [.55, 620, '#3d5547', 5, 90], [.8, 760, '#2f6a74', 8, 30], [1.05, 900, '#22322d', 11, 70]].forEach(([d, y, col, s, a], i) => L(ctx, d, () => put(ctx, DI.hillStrip('rv' + i, W + 900, 520, col, s, a), W / 2 + (i === 2 ? Math.sin(twos() * 2) * 20 : 0), y, {})));
    DI.fog(ctx, .18, '170,185,180');
    L(ctx, 1, () => { Pp.drawCutWord(ctx, nick[0], W / 2, 420, tKill, { stagger: .04 }); Pp.drawCutWord(ctx, nick[1], W / 2, 600, tKill + .35, { stagger: .04 }); });
    DI.rain(ctx, 1, 3);
  }, { tr: 'tear', td: .7, mood: 'dark' });
  ev(tKill, 'hit');
  // D: roadside
  const tNext = c('Следующие годы'), tMiss = c('Тех чьё');
  R.shot(tNext - .2, (ctx, lt, D) => { camera(lt, D, { x: [-100, 100], z: [1.04, 1.1] }); DI.roadside(ctx, lt, {}); L(ctx, 0, () => X.headline(ctx, 'НА ОБОЧИНЕ ОБЩЕСТВА', 600, 990, tNext + 1.2, { size: 64, color: INK, bg: '#3d4d3c' })); }, { tr: 'slide', mood: 'dark' });
  ev(tNext, 'car', { d: 6 });
  // E: missing posters fade
  R.shot(tMiss - .2, (ctx, lt, D) => {
    camera(lt, D, { z: [1.0, 1.12], x: [-50, 40] }); X.bg(ctx, X.darkDesk(431, '#2a3a35'), .35);
    L(ctx, .8, () => { for (let i = 0; i < 6; i++) { const x = 300 + i * 270, y = 430 + hr(i) * 120, f = tw(tMiss + .8 + hr(i * 3) * 1.6, 1.4);
      const poster = Pp.cutout('mp' + i, 230, 310, (cx, part) => { part(X.R(0, 0, 230, 310, 2), '#d9d6c6'); font(cx, F.osw, 40, '700'); cx.fillStyle = '#2b2b2b'; cx.textAlign = 'center'; cx.fillText('ПРОПАЛА', 115, 52); part(X.R(40, 70, 150, 150, 2), '#5a6b52'); const p = new K.Path2D(); p.ellipse(115, 135, 34, 42, 0, 0, 7); part(p, '#25302a'); part(new K.Path2D('M55 220 Q60 175 115 170 Q170 175 175 220 Z'), '#25302a'); for (let k = 0; k < 3; k++) { cx.fillStyle = 'rgba(40,40,40,.4)'; cx.fillRect(40, 240 + k * 18, 150 - k * 25, 7); } });
      put(ctx, poster, x, y, { rot: (hr(i * 9) - .5) * .16, a: 1 - f * .7 }); put(ctx, Pp.tape(90, 30, i, 'rgba(200,200,170,.45)'), x, y - 150, { rot: (hr(i) - .5) * .5, a: 1 - f * .7 }); }
      for (let i = 0; i < 3; i++) { const x = ((S.T - tMiss) * 160 + i * 700) % 2400 - 300; Pp.putPerson(ctx, 'coat', x, 1100, 560, { color: '#0d1311', pose: 1 + Math.floor(twos() * 5 + i) % 3 }); } });
    L(ctx, 0, () => X.hand(ctx, 'их исчезновение редко принимали всерьёз', W / 2, 980, tMiss + .4, { size: 58, color: INK, align: 'center' }));
    lamp(ctx, 900, 300); DI.rain(ctx, .8, 4);
  }, { tr: 'page', td: .8, mood: 'dark' });
  // F: his own words (paraphrase) + stamp
  const tSelf = c('Сам он потом'), tWords = c('Правило невидимости его');
  const rule = Pp.stamp('ПРАВИЛО НЕВИДИМОСТИ', { size: 80, color: '#a51d22' });
  R.shot(tSelf - .2, (ctx, lt, D) => {
    camera(lt, D, { z: [1.0, 1.12], r: [.01, -.01], shake: hits([tWords + .2], 10) }); X.bg(ctx, desk(), .4);
    L(ctx, .9, () => { put(ctx, sheet({ w: 1300, h: 760, color: '#d6d3c2', seed: 441, tex: .55, fold: 1, age: .35 }), W / 2, H / 2, { rot: .01 });
      ctx.save(); ctx.translate(W / 2, H / 2); ctx.rotate(.01);
      X.hand(ctx, 'из его признаний (пересказ):', -560, -250, tSelf + .3, { size: 46, color: '#6b2020' });
      X.typed(ctx, 'СЧИТАЛ, ЧТО МОЖЕТ УБИТЬ СТОЛЬКО', -560, -140, tSelf + 2.2, { size: 44, cps: 22 }); X.typed(ctx, 'ТАКИХ ЖЕНЩИН, СКОЛЬКО ЗАХОЧЕТ,', -560, -70, tSelf + 3.7, { size: 44, cps: 22 }); X.typed(ctx, 'И ЕГО НЕ ПОЙМАЮТ.', -560, 0, tSelf + 5.2, { size: 44, cps: 22 });
      ctx.restore(); Pp.stampHit(ctx, rule, W / 2 + 150, H / 2 + 230, tWords + .2, { rot: -.06 }); });
    lamp(ctx, W / 2, 380);
  }, { tr: 'crumple', td: .9, mood: 'dark' });
  X.typedEv(tSelf + 2.2, 'СЧИТАЛ, ЧТО МОЖЕТ УБИТЬ СТОЛЬКО', 22); X.typedEv(tSelf + 3.7, 'ТАКИХ ЖЕНЩИН, СКОЛЬКО ЗАХОЧЕТ,', 22); X.typedEv(tSelf + 5.2, 'И ЕГО НЕ ПОЙМАЮТ.', 22); ev(tWords + .2, 'stampbig');
  // G: who was he: Ridgway card, truck, rings
  const tWho = c('Знаете кем'), tGary = c('Гэри Риджуэй'), t30 = c('Тридцать лет'), tWed = c('Был женат'), tRel = c('Был очень'), tNb = c('Сосед коллега');
  const polR = Pp.polaroid('ridgway_2001', { w: 340, dark: '#1f2d27', light: '#dfe3d4', half: .5, cell: 5, caption: 'Гэри Риджуэй' });
  R.shot(tWho - .2, (ctx, lt, D) => {
    camera(lt, D, { z: [1.0, 1.08], x: [-40, 40] }); X.bg(ctx, desk(), .4);
    L(ctx, .9, () => {
      A.pop(ctx, X.prop('questionMark'), W / 2, 480, tWho + .1, { s: .8, out: tGary - .1 });
      A.fly(ctx, polR, 470, 470, tGary - .05, { d: .4, from: [-700, -300], spin: -.5, rot: -.05, out: tGary + 6, to: [-900, 200] });
      if (S.T > tGary + 5.8) put(ctx, Pp.indexCard({ w: 420, h: 220, title: 'ГЭРИ РИДЖУЭЙ', seed: 451 }), 470, 470, { rot: -.03, a: tw(tGary + 5.8, .4) });
      A.fly(ctx, X.prop('truck'), 1220, 300, t30, { d: .45, from: [900, 0], spin: .1, rot: .02, twos: true }); X.hand(ctx, '30 лет красил грузовики', 960, 470, t30 + .4, { size: 52, color: INK });
      [0, 1, 2].forEach(k => A.pop(ctx, X.prop('ring'), 1050 + k * 110, 600, tWed + .1 + k * .15, { s: .7 })); X.hand(ctx, 'женат 3 раза', 1400, 620, tWed + .3, { size: 52, color: INK });
      X.hand(ctx, 'очень религиозен', 1060, 760, tRel, { size: 52, color: INK });
      ['сосед', 'коллега', 'обычный человек'].forEach((s, k) => A.pop(ctx, Pp.sticky(s, { w: 260, color: [P.yellow, '#9fd3c7', '#f6a38f'][k], size: 52 }), 900 + k * 300, 940, tNb + k * .35, { rot: (k - 1) * .06 }));
    });
    lamp(ctx, 900, 380);
  }, { tr: 'flip', td: .8, mood: 'dark' });
  ev(tGary, 'paperslap'); ev(t30, 'whoosh'); [0, 1, 2].forEach(k => ev(tWed + .1 + k * .15, 'pop')); [0, 1, 2].forEach(k => ev(tNb + k * .35, 'pop'));
  // H: suspicion 1983, task force 55 (cork)
  const t83 = c('Подозрения на него'), t55 = c('пятидесяти пяти');
  R.shot(t83 - .2, (ctx, lt, D) => {
    camera(lt, D, { z: [1.0, 1.12], x: [-50, 50] }); X.bg(ctx, X.cork(3, '#7d9a8a'), .45);
    L(ctx, .85, () => {
      A.fly(ctx, Pp.sticky('подозрение\n1983', { w: 300, color: '#f6a38f', size: 56 }), 300, 300, t83 + .2, { d: .35, from: [-400, -300], spin: -.3, rot: -.06, twos: true });
      for (let i = 0; i < 55; i++) { const cl = i % 11, rw = Math.floor(i / 11); const tt = t55 - .7 + (cl + rw) * .06; const q = E.back(clamp((twos() - tt) / .25)); if (q <= 0) continue;
        put(ctx, personIcon(), 620 + cl * 110, 220 + rw * 150, { s: q * .9, rot: (hr(i) - .5) * .12 }); put(ctx, Pp.pin(i % 3 ? '#2a9d8f' : P.red), 620 + cl * 110, 160 + rw * 150, { s: q * .8, elev: .3 }); }
      X.counter(ctx, 55, 300, 680, t55, { size: 180, d: 1.2, color: '#1f2d27', bg: '#e8e2cf' }); X.hand(ctx, 'человек в группе', 300, 860, t55 + .6, { size: 50, color: INK, align: 'center' });
    });
    lamp(ctx, 900, 380);
  }, { tr: 'slide', mood: 'dark' });
  ev(t55, 'tick', { d: 1.2 }); for (let i = 0; i < 20; i++) ev(t55 - .7 + i * .06, 'pin');
  // I: saliva sample into storage; not enough evidence; home
  const t87 = c('В тысяча девятьсот восьмидесят седьмом'), tSal = c('образец слюны'), tStore = c('убрали в хранилище'), tLack = c('Улик для ареста'), tHome = c('Он вернулся');
  const env87 = Pp.envelope({ w: 520, h: 330, text: 'образец · 1987', letter: '' }); const noEv = Pp.stamp('УЛИК НЕДОСТАТОЧНО', { size: 78, color: '#a51d22' });
  R.shot(t87 - .2, (ctx, lt, D) => {
    camera(lt, D, { z: [1.0, 1.1], x: [30, -30], shake: hits([tLack + .2], 10) }); X.bg(ctx, desk(), .4);
    L(ctx, .9, () => {
      const p = tw(tStore + .1, 1.0, E.io); const op = 1 - tw(tStore + 1.1, .4, E.io) * .9;
      put(ctx, X.prop('drawer'), 1250, 720, { s: 1.1 }); // drawer open sliver
      ctx.save(); ctx.fillStyle = `rgba(10,12,10,${.8 * op})`; ctx.fillRect(1250 - 380, 720 - 230 - 40 * op, 760, 60 * op); ctx.restore();
      A.fly(ctx, env87, lerp(700, 1250, p), lerp(450, 520, p), tSal - .3, { d: .4, from: [-600, -300], spin: -.3, rot: lerp(-.05, .1, p), s: lerp(1, .55, p), twos: true });
      Pp.stampHit(ctx, noEv, 640, 820, tLack + .2, { rot: -.06 });
    });
    lamp(ctx, 900, 380);
  }, { tr: 'page', td: .8, mood: 'dark' });
  ev(tSal - .3, 'paperslap'); ev(tStore + .1, 'drawer'); ev(tStore + 1.1, 'drawerclose'); ev(tLack + .2, 'stampbig');
  R.shot(tHome - .2, (ctx, lt, D) => {
    camera(lt, D, { z: [1.0, 1.1] });
    const sky = Pp.sheet({ w: W + 600, h: H + 400, color: '#1b2622', seed: 461, tex: .6, grad: false }); L(ctx, .2, () => put(ctx, sky, W / 2, H / 2, { shadow: 0 }));
    L(ctx, .45, () => put(ctx, DI.hillStrip('hm_h', W + 800, 500, '#24332d', 13, 100), W / 2, 700, {}));
    L(ctx, .75, () => { put(ctx, X.prop('house', 1), W / 2, 640, { s: 1.2 }); X.vellumCone(ctx, W / 2 - 150, 560, 80, 300, 300, .12, '255,215,140'); });
    L(ctx, 0, () => X.hand(ctx, 'и жил дальше', W / 2, 980, tHome + .6, { size: 66, color: INK, align: 'center' }));
    DI.rain(ctx, 1, 5); DI.fog(ctx, .1, '160,180,170');
  }, { tr: 'zoom', td: .8, mood: 'dark' });
  // J: 14 years -> DNA -> match (bright accent)
  const t14 = c('Четырнадцать лет спустя'), tDNA = c('новые методы'), tCmp = c('Старый образец'), tMatch = c('Совпало');
  R.shot(t14 - .2, (ctx, lt, D) => {
    camera(lt, D, { z: [1.0, 1.1] }); X.bg(ctx, desk(), .4);
    L(ctx, .9, () => {
      const p = clamp((twos() - t14 - .2) / 2.2); const y = Math.round(lerp(1987, 2001, E.out(p)));
      put(ctx, X.prop('calendarPad', String(y)), 420, 420, { rot: -.04 }); if (p < 1 && p > 0) { const fp = (S.T * 12) % 1; ctx.save(); ctx.translate(420, 300); ctx.scale(1, Math.max(.05, 1 - fp)); put(ctx, Pp.sheet({ w: 340, h: 300, color: '#efe9db', seed: 50, tex: .4 }), 0, 140, { elev: .5 }); ctx.restore(); }
      X.hand(ctx, '+14 лет', 420, 700, t14 + 2.4, { size: 70, color: INK, align: 'center' });
      const sep = 1 - tw(tCmp + 1.3, 2, E.io);
      X.dna(ctx, 1260, 420 - sep * 130, 1000, 70, S.T, { reveal: tw(tDNA, 1.2, E.lin), c1: '#5a8a7a', c2: '#c9c4a8', rung: '#9e2b2b' });
      X.dna(ctx, 1260, 420 + sep * 130 + 40, 1000, 70, S.T, { reveal: tw(tCmp, 1.2, E.lin), c1: '#c9a65a', c2: '#e8e2cf', rung: '#5a8a7a' });
      if (S.T > tCmp) { X.hand(ctx, 'образец 1987', 800, 230 - sep * 0, tCmp + .2, { size: 44, color: INK }); X.hand(ctx, 'следы на ранних делах', 800, 720, tCmp + .5, { size: 44, color: INK }); }
    });
    lamp(ctx, 1200, 380);
  }, { tr: 'flip', td: .8, mood: 'dark' });
  ev(t14 + .2, 'calendar', { d: 2.2 }); ev(tDNA, 'scan', { d: 2 });
  const match = Pp.stamp('СОВПАЛО', { size: 190, color: '#d1242c' });
  R.shot(tMatch - .05, (ctx, lt, D) => {
    camera(lt, D, { z: [1.1, 1.0], shake: hits([tMatch + .1], 18) }); X.bg(ctx, X.collageBg(471, [P.cream, P.teal, P.yellow, P.coral, '#9fd3c7']), .45); X.lightDrift(ctx, 1);
    L(ctx, .9, () => { X.dna(ctx, W / 2, 520, 1500, 110, S.T * 1.2, { c1: P.teal, c2: P.yellow, rung: P.red, n: 56 }); Pp.stampHit(ctx, match, W / 2, 520, tMatch + .1, { rot: -.05 }); });
    X.scraps(ctx, [P.yellow, P.coral, P.teal, P.white], 14, 47, { speed: 2 });
  }, { tr: 'flash', mood: 'bright' });
  ev(tMatch + .1, 'stampbig'); ev(tMatch + .1, 'shimmer', { d: 2.5 }); R.hit(tMatch + .1, 1.2);
  // K: arrest at the factory gate, 49
  const tArr = c('Тридцатого ноября'), t49 = c('сорока девяти'), tMore = c('А в беседах');
  R.shot(tArr - .2, (ctx, lt, D) => {
    camera(lt, D, { z: [1.0, 1.12], x: [-40, 60] });
    const sky = Pp.sheet({ w: W + 600, h: H + 400, color: '#2c3b3a', seed: 481, tex: .6, grad: false }); L(ctx, .2, () => put(ctx, sky, W / 2, H / 2, { shadow: 0 }));
    L(ctx, .4, () => { const fac = Pp.cutout('factory', 1600, 500, (x, part) => { part(X.R(0, 120, 1600, 380, 0), '#34433d'); for (let i = 0; i < 4; i++) part(X.R(160 + i * 340, 0, 70, 200, 0), '#2a3631'); for (let i = 0; i < 14; i++) part(X.R(60 + i * 110, 220, 60, 40, 2), '#c9a65a', { sb: 2 }); }); put(ctx, fac, W / 2 - 200, 380, {}); });
    L(ctx, .7, () => put(ctx, X.prop('gate'), W / 2 - 300, 720, { s: .95 }));
    L(ctx, .9, () => Pp.putPerson(ctx, 'coat', 600 + (S.T - tArr) * 30, 1020, 360, { color: '#0d1311', rim: 'rgba(220,230,220,.5)', pose: 1 + Math.floor(twos() * 5) % 3 }));
    L(ctx, 0, () => { put(ctx, sheet({ w: 560, h: 680, color: '#e8e2cf', seed: 482, tex: .5, age: .3 }), 1560, 520, { rot: .03 }); ctx.save(); ctx.translate(1560, 520); ctx.rotate(.03); X.typed(ctx, '30.11.2001', -200, -230, tArr + .4, { size: 58, cps: 14 }); X.hand(ctx, 'арест у ворот завода', -210, -160, tArr + 1.2, { size: 44 }); ctx.restore();
      X.counter(ctx, 49, 1560, 560, t49, { size: 200, d: 1.2, color: '#9e2b2b', bg: '#f4efe3' }); X.hand(ctx, 'признал вину', 1560, 740, t49 + .5, { size: 50, align: 'center' }); X.hand(ctx, '…называл больше', 1560, 810, tMore + .3, { size: 46, align: 'center', color: '#6b2020' }); });
    DI.fog(ctx, .1);
  }, { tr: 'slide', mood: 'dark' });
  X.typedEv(tArr + .4, '30.11.2001', 14); ev(t49, 'tick', { d: 1.2 }); ev(t49 + 1.2, 'hit');
  // L: prison room, letter -> Bundy chose differently (crumple into scene 5)
  const tInc = c('И вот что почти'), tBundy = c('Теду Банди'), tDiff = c('А Банди выбирал'), tSeen = c('Он выбирал тех');
  R.shot(tInc - .2, (ctx, lt, D) => {
    camera(lt, D, { z: [1.0, 1.15], y: [0, -30] }); X.bg(ctx, X.darkDesk(491, '#262b2e'), .3);
    L(ctx, .6, () => { put(ctx, sheet({ w: 1200, h: 700, color: '#3a3f44', seed: 492, tex: .6 }), W / 2, 420, {}); X.vellumCone(ctx, W / 2, -40, 80, 700, 900, .14, '230,235,220'); });
    L(ctx, .8, () => { put(ctx, sheet({ w: 1500, h: 300, color: '#4a3a2c', seed: 493, tex: .6 }), W / 2, 900, {}); A.fly(ctx, Pp.envelope({ w: 400, h: 260, text: 'Т. Банди', sealColor: '#5a1f1f' }), W / 2 + 200, 860, tBundy - .2, { d: .4, from: [600, -400], spin: .4, rot: .05, twos: true }); X.hand(ctx, 'камера смертников · Флорида', W / 2 - 520, 990, tBundy + .3, { size: 46, color: INK }); });
    L(ctx, 1.0, () => put(ctx, X.prop('bars'), W / 2, 460, { s: 1.15 }));
    L(ctx, 0, () => X.headline(ctx, 'СОВЕТ У ДРУГОГО УБИЙЦЫ', W / 2, 120, tInc + 2.6, { size: 64, color: INK, bg: '#9e2b2b' }));
    lamp(ctx, W / 2, 200);
  }, { tr: 'tear', td: .7, mood: 'dark' });
  ev(tBundy - .2, 'paperslap');
  R.shot(tDiff - .2, (ctx, lt, D) => {
    camera(lt, D, { z: [1.0, 1.1] }); X.bg(ctx, X.darkDesk(495, '#2c2a30'), .4);
    L(ctx, .9, () => { for (let i = 0; i < 9; i++) { const lit = i === 4 && S.T > tSeen + .3; Pp.putPerson(ctx, 'woman', 330 + i * 160, 860, 300, { color: lit ? '#f4efe3' : '#55505a', border: lit ? 6 : 0 }); }
      if (S.T > tSeen + .3) X.vellumCone(ctx, 330 + 4 * 160, -40, 60, 380, 920, .25 * tw(tSeen + .3, .4), '255,235,190');
      X.headline(ctx, 'ТЕХ, КОГО ЗАМЕТИЛИ БЫ СРАЗУ', W / 2, 220, tSeen + .3, { size: 72, color: P.ink, bg: '#e8e2cf' }); X.hand(ctx, '…и всё равно оставался на свободе', W / 2, 360, tSeen + 2.6, { size: 54, color: '#e8a33d', align: 'center' }); });
    lamp(ctx, 970, 300);
  }, { tr: 'page', td: .8, mood: 'dark' });
  ev(tSeen + .3, 'lampclick');
}
function personIcon() { return Pp.cutout('picon', 80, 110, (x, part) => { part(X.R(0, 0, 80, 110, 4), '#e8e2cf'); const p = new K.Path2D(); p.ellipse(40, 36, 14, 16, 0, 0, 7); part(p, '#2b3a35'); part(new K.Path2D('M14 100 Q16 62 40 58 Q64 62 66 100 Z'), '#2b3a35'); }); }
module.exports = { build };
