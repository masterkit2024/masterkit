// ===== Scene 3: Chikatilo (dark, cold) =====
const K = require('./core'); const Pp = require('./paper'); const X = require('./sets'); const A = require('./anim'); const R = require('./engine'); const DI = require('./dioramas');
const { W, H, F, clamp, lerp, E, hr, S, tw, twos, cue, SC, ev, camera, L, hits, font } = K;
const { P, put, sheet } = Pp;
const DSCR = ['#3a4a63', '#6b778a', '#8d99a6', '#2b2d31', '#9e2b2b'];
const deskD = () => X.darkDesk(301, '#1f2a3e');
function dark(ctx, lx = W * .45, ly = H * .35) { X.lampLight(ctx, lx + noise(.15) * 40, ly, 1000, '200,215,235', .6, .5); }
function noise(k) { return K.noise1(S.T * k); }
// Rostov map pixel coords (500x542 source)
const ROST = { 'Ростов': [121, 353], 'Шахты': [166, 312], 'Новочеркасск': [158, 343], 'Новошахтинск': [141, 299], 'Таганрог': [64, 366], 'Батайск': [133, 378], 'Азов': [104, 389], 'Кр.Сулин': [157, 290] };
function build() {
  const S3 = 3, c = (p, n) => cue(S3, p, n); const t0 = SC(3).t0;
  const GEO = require('./geo');
  const ussr = X.mapSprite('ussr_dark', 1700, 980, GEO.eu, X.proj(62, 54, 13, 850, 500), f => f.u ? { fill: '#b9b2a0', stroke: 'rgba(30,40,60,.5)', lift: 1 } : { fill: '#8f8a7e', stroke: 'rgba(30,40,60,.25)' }, { paper: '#cfc6b0', age: .45, burn: .5, compass: 1 });
  const tYear = c('Тысяча девятьсот семьдесят восьмой'), tSer = c('Начинается серия'), t12 = c('двенадцать лет');
  // A: USSR paper map, zoom to Rostov
  R.shot(t0 - .45, (ctx, lt, D) => {
    camera(lt, D, { z: [1.0, 2.2], x: [0, -330], y: [0, 120], ease: E.io }); X.bg(ctx, deskD(), .4);
    L(ctx, 1, () => { put(ctx, ussr, W / 2, H / 2, { rot: -.01 }); const [rx, ry] = [850 - 850 + W / 2 + (39.7 - 62) * 13, 0]; const P2 = X.proj(62, 54, 13, W / 2, H / 2); const [px, py] = P2(39.7, 47.23); X.pulseDot(ctx, px, py, t0 + .4, { R: 50, s: .6 });
      X.hand(ctx, 'Ростовская обл.', px + 30, py - 40, t0 + .5, { size: 40, color: '#f4efe3' }); });
    dark(ctx, W * .4, H * .5);
    L(ctx, 0, () => A.pop(ctx, X.prop('calendarPad', '1978'), 1620, 760, tYear + .2, { s: .8, rot: .06 }));
  }, { tr: 'accordion', td: 1.0, mood: 'dark' });
  ev(tYear + .2, 'hit');
  // B: Rostov oblast map card + ruler 1978->1990
  const rmap = Pp.polaroid('rostov_map', { w: 720, dark: '#1c2638', light: '#d9d2bf', contrast: 1.5, frame: 'print', border: 14 });
  R.shot(tSer - .2, (ctx, lt, D) => {
    camera(lt, D, { z: [1.0, 1.1], x: [20, -40] }); X.bg(ctx, deskD(), .4);
    L(ctx, .85, () => {
      put(ctx, rmap, 760, 470, { rot: -.02 }); put(ctx, Pp.tape(170, 46, 9, 'rgba(200,190,160,.5)'), 760, 70, { rot: .1 });
      const k = 720 / 500; const rx = 760 - 360 + ROST['Ростов'][0] * k, ry = 470 - (542 * k) / 2 + ROST['Ростов'][1] * k; X.pulseDot(ctx, rx, ry, tSer, { R: 50 });
      // ruler
      const rl = Pp.cutout('ruler', 1500, 110, (x, part) => { part(X.R(0, 0, 1500, 110, 8), '#d8cfb8'); for (let i = 0; i <= 12; i++) { x.fillStyle = '#2b2b2b'; x.fillRect(40 + i * 118, 0, 3, i % 2 ? 30 : 50); font(x, F.mono, 26, '700'); x.textAlign = 'center'; x.fillText(String(1978 + i), 40 + i * 118, 86); } });
      put(ctx, rl, W / 2 + 100, 960, { rot: .01 });
      const p = tw(tSer + .3, t12 - tSer + .2, E.io); X.marker(ctx, [[W / 2 + 100 - 710, 945], [W / 2 + 100 - 710 + 1416 * p, 945]], 1, { color: 'rgba(200,30,40,.6)', w: 18 });
      X.headline(ctx, '12 ЛЕТ', 1500, 300, t12, { size: 140, color: '#f4efe3', bg: '#9e2b2b', rot: .04 });
    });
    dark(ctx, 900, 400); DI.fog(ctx, .05, '120,140,160');
  }, { tr: 'fade', td: .6, mood: 'dark' });
  ev(t12, 'hit');
  // C: 52 proven
  const tCourt = c('В итоге суд'), tProv = c('доказанными'), t52 = c('пятьдесят два'), tAll = c('Все жертвы');
  const dok = Pp.stamp('ДОКАЗАНО', { size: 110, color: '#b5161c' });
  R.shot(tCourt - .2, (ctx, lt, D) => {
    camera(lt, D, { z: [1.08, 1.0], shake: hits([tProv + .15, t52 + 1.4], 10) }); X.bg(ctx, deskD(), .4);
    L(ctx, .85, () => {
      put(ctx, sheet({ w: 1300, h: 800, color: '#cfc6b0', seed: 311, tex: .6, burn: .6, age: .4, lines: 'ruled' }), W / 2, H / 2, { rot: -.015 });
      X.hand(ctx, 'суд признает доказанными:', W / 2 - 520, 230, tCourt + .2, { size: 56, color: '#1d2433' });
      X.counter(ctx, 52, W / 2 - 120, 430, t52, { size: 300, d: 1.4, color: '#1d2433', bg: '#efe6d2' });
      Pp.stampHit(ctx, dok, W / 2 + 370, 520, tProv + .15, { rot: -.12 });
      X.hand(ctx, 'дети · подростки · женщины', W / 2, 800, tAll + .2, { size: 64, align: 'center', color: '#1d2433' });
    });
    dark(ctx, W / 2, 380);
  }, { tr: 'slide', mood: 'dark' });
  ev(tProv + .15, 'stampbig'); ev(t52, 'tick', { d: 1.4 }); ev(t52 + 1.4, 'hit');
  // D: station diorama
  const tWhere = c('Где их находили'), tVok = c('Возле вокзалов'), tFlow = c('Вокзал это поток');
  R.shot(tWhere - .2, (ctx, lt, D) => {
    camera(lt, D, { z: [1.0, 1.12], x: [-90, 90] }); DI.station(ctx, lt, {});
    L(ctx, 1, () => { X.headline(ctx, 'ВОКЗАЛЫ И АВТОСТАНЦИИ', 620, 990, tVok, { size: 64, color: '#f4efe3', bg: '#9e2b2b', rot: -.02 }); X.hand(ctx, 'никто никого не запоминает', 1280, 80, tFlow + .8, { size: 54, color: '#f4efe3' }); });
    DI.fog(ctx, .08, '150,165,180');
  }, { tr: 'page', td: .8, mood: 'dark' });
  ev(tWhere, 'crowd', { d: 14 }); ev(tWhere, 'clock', { d: 14 });
  const tKid = c('Ребёнок который'), tTalk = c('Человек который'), tDis = c('растворяется'), tInv = c('Идеальная невидимость');
  R.shot(tKid - .2, (ctx, lt, D) => {
    camera(lt, D, { z: [1.15, 1.32], x: [60, 0], y: [40, 60] });
    const fade = tw(tDis, 1.6, E.io); DI.station(ctx, lt, { fade: fade * .3 });
    L(ctx, 1.0, () => { const x = 900 + (S.T - tKid) * 22; if (fade < 1) X.vellumCone(ctx, x + 40, -80, 60, 460, 1100, .2 * (1 - fade), '235,235,220');
      const col = `rgb(${Math.round(lerp(200, 30, fade))},${Math.round(lerp(196, 40, fade))},${Math.round(lerp(186, 56, fade))})`;
      Pp.putPerson(ctx, 'coat', x, 1010, 400, { color: col, pose: 1 + Math.floor(twos() * 5) % 3, a: 1 - fade * .9 }); Pp.putPerson(ctx, 'child', x + 110, 1010, 250, { color: col, pose: 1 + (Math.floor(twos() * 5) + 1) % 3, a: 1 - fade * .9 }); });
    L(ctx, 0, () => { const cw = Pp.cutWord('ИДЕАЛЬНАЯ НЕВИДИМОСТЬ', 84, 41, { styles: [0, 1, 4, 2] }); Pp.drawCutWord(ctx, cw, W / 2, 160, tInv, { stagger: .03 }); });
  }, { tr: 'zoom', td: .8, mood: 'dark' });
  ev(tInv, 'hit');
  // E: one case + 11 more
  const t84 = c('К тысяча девятьсот восьмидесят'), t23 = c('двадцати трёх'), tNot = c('А убийства не'), tMar = c('Только с марта'), t11 = c('ещё одиннадцать');
  const oneCase = Pp.stamp('ОДНО ДЕЛО', { size: 120, color: '#b5161c', sub: '1984 · 23 ЭПИЗОДА' });
  R.shot(t84 - .2, (ctx, lt, D) => {
    camera(lt, D, { z: [1.0, 1.12], r: [-.015, .01], shake: hits([t23 + .3], 10) }); X.bg(ctx, deskD(), .4);
    L(ctx, .85, () => { for (let i = 0; i < 6; i++) A.fly(ctx, Pp.folder({ w: 520, h: 620, label: '№ ' + (i + 11), color: i % 2 ? P.kraft : P.kraft2, stain: 1 }), 760 + i * 18, 520 - i * 14, t84 + i * .18, { d: .4, from: [(i % 2 ? 1 : -1) * 900, -300], spin: (i % 2 ? .5 : -.5), rot: -.06 + i * .025, twos: true });
      Pp.stampHit(ctx, oneCase, 900, 560, t23 + .3, { rot: -.08 }); });
    dark(ctx, 800, 300);
  }, { tr: 'flip', td: .8, mood: 'dark' });
  for (let i = 0; i < 6; i++) ev(t84 + i * .18, 'drop'); ev(t23 + .3, 'stampbig');
  R.shot(tNot - .2, (ctx, lt, D) => {
    camera(lt, D, { z: [1.05, 1.0], x: [40, -40] }); X.bg(ctx, deskD(), .4);
    L(ctx, .85, () => {
      put(ctx, sheet({ w: 1500, h: 760, color: '#cfc6b0', seed: 321, tex: .6, lines: 'grid', burn: .5, age: .4 }), W / 2, 560, { rot: .01 });
      ['МАР', 'АПР', 'МАЙ', 'ИЮН', 'ИЮЛ', 'АВГ', 'СЕН'].forEach((m, i) => X.hand(ctx, m.toLowerCase(), 360 + i * 205, 880, tMar - .2 + i * .08, { size: 44, color: '#1d2433' }));
      for (let i = 0; i < 11; i++) { const tt = t11 - 1.1 + i * .17; const q = E.back(clamp((twos() - tt) / .25)); if (q <= 0) continue; const bar = sheet({ w: 70, h: 300, color: i % 2 ? '#9e2b2b' : '#b8372f', seed: 330 + i, tex: .5 }); ctx.save(); ctx.translate(330 + i * 120, 830); ctx.scale(1, q); put(ctx, bar, 0, -150, {}); ctx.restore(); }
      X.headline(ctx, '+11', 1550, 330, t11 + .3, { size: 190, color: '#f4efe3', bg: '#9e2b2b', rot: .05 });
      X.hand(ctx, 'убийства не прекращались', 280, 280, tNot, { size: 66, color: '#1d2433' });
    });
    dark(ctx, W / 2, 400);
  }, { tr: 'slide', mood: 'dark' });
  for (let i = 0; i < 11; i++) ev(t11 - 1.1 + i * .17, 'tickone'); ev(t11 + .3, 'hit');
  // F: Kravchenko card + freeze + "murders continued"
  const tHere = c('И вот тут'), tKr = c('Его звали Александр'), t25 = c('Ему было двадцать'), tPress = c('Под давлением'), tExec = c('его казнили'), tCont = c('Убийства продолжились');
  const notThat = Pp.stamp('НЕ ТОТ', { size: 170, color: '#b5161c' });
  const freeze = (t) => t > tCont - 1.6 && t < tCont;
  R.shot(tHere - .2, (ctx, lt, D) => {
    const tt = freeze(S.T) ? tCont - 1.6 : S.T; const keep = S.T; S.T = tt;
    camera(lt - (keep - tt), D, { z: [1.0, 1.12], x: [-30, 30], hand: freeze(keep) ? 0 : 1, shake: hits([tExec + .4], 14) }); X.bg(ctx, deskD(), .4);
    L(ctx, .85, () => {
      const card = Pp.indexCard({ w: 1200, h: 720, title: 'ЛИЧНОЕ ДЕЛО', seed: 341, color: '#e9e2cf' }); put(ctx, card, W / 2, 540, { rot: -.012 });
      put(ctx, Pp.cutout('kr_bust', 280, 340, (x, part) => { part(X.R(0, 0, 280, 340, 4), '#3a4250'); const p = new K.Path2D(); p.ellipse(140, 140, 60, 74, 0, 0, 7); part(p, '#1b1f27'); part(new K.Path2D('M30 340 Q40 230 140 220 Q240 230 250 340 Z'), '#1b1f27'); }), 560, 560, { rot: -.012 });
      X.typed(ctx, 'АЛЕКСАНДР КРАВЧЕНКО', 760, 330, tKr + .5, { size: 46, cps: 22 }); X.typed(ctx, 'ВОЗРАСТ: 25', 760, 420, t25, { size: 42, cps: 22 }); X.typed(ctx, 'РАНЕЕ СУДИМ', 760, 490, t25 + 1.2, { size: 42, cps: 22 });
      X.hand(ctx, 'признался под давлением', 760, 590, tPress, { size: 52, color: '#24305e' }); X.typed(ctx, 'КАЗНЁН: 1984', 760, 690, tExec - .4, { size: 42, cps: 22 });
      Pp.stampHit(ctx, notThat, W / 2 + 300, 760, tExec + .4, { rot: -.14 });
      X.hand(ctx, 'власти потом признали: расстреляли невиновного', W / 2, 1000, tHere + .6, { size: 54, color: '#f4efe3', align: 'center' });
    });
    dark(ctx, W / 2, 420); S.T = keep;
    if (freeze(keep)) { ctx.fillStyle = `rgba(0,0,0,${.25 * clamp((keep - (tCont - 1.6)) / 1.4)})`; ctx.fillRect(0, 0, W, H); }
  }, { tr: 'tear', td: .7, mood: 'dark' });
  X.typedEv(tKr + .5, 'АЛЕКСАНДР КРАВЧЕНКО', 22); X.typedEv(t25, 'ВОЗРАСТ: 25', 22); X.typedEv(t25 + 1.2, 'РАНЕЕ СУДИМ', 22); X.typedEv(tExec - .4, 'КАЗНЁН: 1984', 22); ev(tExec + .4, 'stampbig');
  ev(tCont - 1.6, 'silence', { d: 1.55 }); ev(tCont, 'boomlow'); R.hit(tCont, 1.3);
  const contW = [Pp.cutWord('УБИЙСТВА', 150, 51, { styles: [1, 0, 4] }), Pp.cutWord('ПРОДОЛЖИЛИСЬ', 130, 53, { styles: [1, 0, 4, 2] })];
  R.shot(tCont - .05, (ctx, lt, D) => {
    camera(lt, D, { z: [1.15, 1.05], shake: hits([tCont + .05], 22) }); X.bg(ctx, X.darkDesk(351, '#161d2b'), .4);
    L(ctx, .9, () => { put(ctx, sheet({ w: 1500, h: 620, color: '#b9b09a', seed: 352, tex: .6, burn: .9, age: .5, torn: [14, 14, 14, 14] }), W / 2, H / 2, { rot: .02 }); Pp.drawCutWord(ctx, contW[0], W / 2, 450, tCont, { instant: 1 }); Pp.drawCutWord(ctx, contW[1], W / 2, 650, tCont, { instant: 1 }); });
    dark(ctx, W / 2, H / 2);
  }, { tr: 'dip', td: .3, mood: 'dark' });
  // G: bus station check -> photo (glasses) -> released
  const tSame = c('В том же году'), tGl = c('мужчину в очках'), tDocs = c('проверили его'), tLet = c('и отпустили'), tName = c('Мужчину звали'), tTeach = c('Учитель'), tSnab = c('работник снабжения'), tFam = c('отец семейства'), tOrd = c('Он выглядел'), tNobody = c('на которого никто');
  R.shot(tSame - .2, (ctx, lt, D) => {
    camera(lt, D, { z: [1.0, 1.25], x: [-80, 120], y: [0, 40] }); DI.station(ctx, lt, { board: ['АВТОВОКЗАЛ', 'РЕЙС 112   15:10', 'РЕЙС 134   15:25', 'РЕЙС 141   15:40'], trainX: -2000 });
    L(ctx, 1.0, () => { X.vellumCone(ctx, 1160, -60, 50, 440, 1100, .18, '235,235,220'); Pp.putPerson(ctx, 'coat', 1160, 1020, 410, { color: '#c9c4b5' }); Pp.putPerson(ctx, 'coat', 920, 1020, 420, { color: '#0d121c', flip: true }); Pp.putPerson(ctx, 'coat', 1400, 1020, 415, { color: '#0d121c' }); });
    L(ctx, 0, () => X.headline(ctx, 'РОСТОВ · АВТОВОКЗАЛ · 1984', 560, 990, tSame + .7, { size: 54, color: '#f4efe3', bg: '#26344d' }));
  }, { tr: 'slide', mood: 'dark' });
  const polCh = Pp.polaroid('chikatilo_portrait', { w: 520, dark: '#1a2436', light: '#dfe3e0', half: .45, cell: 6, caption: '' });
  const otp = Pp.stamp('ОТПУЩЕН', { size: 120, color: '#b5161c' });
  const idCards = [0, 1, 2, 3, 4].map(i => Pp.cutout('idc' + i, 420, 270, (x, part) => { part(X.R(0, 0, 420, 270, 10), '#d8cfb8'); part(X.R(20, 30, 120, 160, 4), '#3a4250'); const p = new K.Path2D(); p.ellipse(80, 90, 30, 38, 0, 0, 7); part(p, '#1b1f27'); part(new K.Path2D('M30 190 Q36 140 80 135 Q124 140 130 190 Z'), '#1b1f27'); for (let k = 0; k < 5; k++) { x.fillStyle = 'rgba(30,30,40,.35)'; x.fillRect(165, 50 + k * 34, 200 - k * 18, 8); } }));
  R.shot(tGl - .1, (ctx, lt, D) => {
    const zIn = tw(tGl + .3, 2.2, E.io) * (1 - tw(tName + .2, .8, E.io));
    camera(lt, D, { z: [1.0, 1.06], shake: hits([tLet + .2], 10) }); const C = K.CAMref(); C.z *= 1 + zIn * .55; C.x += zIn * -260; C.y += zIn * -120;
    X.bg(ctx, deskD(), .4);
    L(ctx, .9, () => {
      const out = tw(tName + .6, .5, E.in);
      if (out < 1) put(ctx, polCh, 620 - out * 1200, 500, { rot: -.03 - out * .5, elev: out });
      const pass = Pp.cutout('passport', 420, 300, (x, part) => { part(X.R(0, 0, 420, 300, 14), '#5a1f1f'); part(X.R(18, 18, 384, 264, 8), '#d8cfb8'); part(X.R(36, 40, 110, 140, 4), '#3a4250'); for (let k = 0; k < 4; k++) { x.fillStyle = 'rgba(30,30,40,.4)'; x.fillRect(170, 60 + k * 40, 190 - k * 25, 9); } font(x, F.osw, 34, '700'); x.fillStyle = '#5a1f1f'; x.fillText('ПАСПОРТ', 170, 255); });
      A.fly(ctx, pass, 1350, 380, tDocs, { d: .4, from: [700, -200], spin: .4, rot: .06, twos: true, out: tName + .2, to: [900, 400] });
      X.hand(ctx, 'проверили документы', 1150, 620, tDocs + .3, { size: 58, color: '#f4efe3' });
      if (S.T < tName + .6) Pp.stampHit(ctx, otp, 1380, 420, tLet + .2, { rot: -.1 });
      // name card + notes
      const nc = Pp.indexCard({ w: 760, h: 420, title: 'АНДРЕЙ ЧИКАТИЛО', seed: 361, tsize: 44 });
      A.fly(ctx, nc, 760, 560, tName + .3, { d: .45, from: [-600, 500], spin: -.4, rot: -.02, twos: true, out: tOrd + 1.2, to: [0, 700] });
      if (S.T < tOrd + 1.3) { X.hand(ctx, 'учитель по образованию', 420, 640, tTeach, { size: 48 }); X.hand(ctx, 'работник снабжения', 420, 690, tSnab, { size: 48 }); X.hand(ctx, 'отец семейства', 420, 740, tFam, { size: 48 }); }
      for (let i = 0; i < 5; i++) A.fly(ctx, idCards[i], 560 + i * 200, 560 + (i % 2) * 40, tOrd + .9 + i * .12, { d: .35, from: [0, -800], spin: (i - 2) * .3, rot: (i - 2) * .05, twos: true });
      X.headline(ctx, 'НА НЕГО НИКТО НЕ СМОТРИТ', W / 2, 920, tNobody, { size: 76, color: '#f4efe3', bg: '#9e2b2b', rot: -.01 });
    });
    dark(ctx, 700, 420);
  }, { tr: 'flash', mood: 'dark' });
  ev(tDocs, 'paperslap'); ev(tLet + .2, 'stamp'); ev(tName + .3, 'paperslap'); for (let i = 0; i < 5; i++) ev(tOrd + .9 + i * .12, 'drop');
  // H: timeline + verdict
  const tArr = c('Арестовали его только'), t20 = c('двадцатого ноября'), tCourt2 = c('На суде'), t14 = c('Четырнадцатого февраля');
  R.shot(tArr - .2, (ctx, lt, D) => {
    camera(lt, D, { z: [1.0, 1.08], x: [-60, 60] }); X.bg(ctx, deskD(), .4);
    L(ctx, .9, () => { X.hand(ctx, 'арестовали только…', W / 2, 260, tArr + .1, { size: 64, color: '#f4efe3', align: 'center' }); X.hand(ctx, 'после подозрительного поведения', W / 2, 860, t20 + 2.2, { size: 50, color: '#cfd6de', align: 'center' }); }); L(ctx, .9, () => X.timelineTape(ctx, [{ x: 420, label: '20.11.1990', sub: 'арест' }, { x: W / 2, label: '1992', sub: 'приговор' }, { x: W - 420, label: '14.02.1994', sub: 'расстрел', red: 1 }], 560, [t20, tCourt2, t14], { x0: 220, x1: W - 220 }));
    dark(ctx, W / 2, 400);
  }, { tr: 'page', td: .8, mood: 'dark' });
  [t20, tCourt2].forEach(t => ev(t, 'pin'));
  const verd = Pp.polaroid('verdict_text', { w: 700, dark: '#1d1d22', light: '#e6dfcd', contrast: 1.4, frame: 'print', border: 0 });
  const exec = Pp.stamp('ПРИГОВОР ИСПОЛНЕН', { size: 80, color: '#b5161c', sub: '14.02.1994' });
  R.shot(tCourt2 + .1, (ctx, lt, D) => {
    camera(lt, D, { z: [1.55, 1.05], x: [80, 0], y: [-140, 0], ease: E.io, shake: hits([t14 + .5], 10) }); X.bg(ctx, deskD(), .4);
    L(ctx, .95, () => { put(ctx, verd, W / 2 - 120, 560, { rot: .015 }); X.underline(ctx, W / 2 - 420, W / 2 + 160, 360, tCourt2 + .8, { color: 'rgba(242,193,78,.6)', w: 30 });
      X.hand(ctx, '52', W / 2 + 330, 380, tCourt2 + 1.0, { size: 120, color: '#c4161c' }); X.circleMark(ctx, W / 2 + 370, 340, 90, 70, tCourt2 + 1.4, { w: 8 });
      Pp.stampHit(ctx, exec, W / 2 + 420, 780, t14 + .5, { rot: -.1 }); });
    dark(ctx, W / 2, 450);
  }, { tr: 'slide', mood: 'dark' });
  ev(tCourt2 + .8, 'marker'); ev(t14 + .5, 'stampbig');
  // I: blindness to links
  const tWhy = c('Почему человек'), tBec = c('Потому что дела'), tBlind = c('слепотой');
  R.shot(tWhy - .2, (ctx, lt, D) => {
    camera(lt, D, { z: [1.0, 1.15], x: [-20, 40] }); X.bg(ctx, deskD(), .4);
    L(ctx, .85, () => {
      put(ctx, rmap, 900, 520, { rot: .01, s: 1.0 }); const k = 720 / 500; const ox = 900 - 360, oy = 520 - (542 * k) / 2;
      const pts = Object.values(ROST).map(([a, b]) => [ox + a * k, oy + b * k]);
      pts.forEach((p, i) => A.fly(ctx, Pp.folder({ w: 150, h: 190, label: '', head: '№' + (i + 1), color: i % 2 ? P.kraft : P.kraft2 }), p[0] + (i % 2 ? 60 : -60), p[1] - 40 + (i % 3) * 30, tBec + .2 + i * .2, { d: .35, from: [0, -600], spin: (hr(i) - .5), rot: (hr(i) - .5) * .4, twos: true }));
      for (let i = 0; i < pts.length - 1; i++) { const a = pts[i], b = pts[i + 1]; X.thread(ctx, [a[0], a[1] - 60], [lerp(a[0], b[0], .45), lerp(a[1], b[1], .45) + 40], tw(tBec + 2.2 + i * .15, .4), 120); }
      X.headline(ctx, '12 ЛЕТ НА СВОБОДЕ', 1500, 160, tWhy + .5, { size: 70, color: '#f4efe3', bg: '#26344d', rot: .03 });
      const cw = Pp.cutWord('СЛЕПОТА К СВЯЗЯМ', 100, 61, { styles: [0, 1, 2, 4] }); Pp.drawCutWord(ctx, cw, 1000, 960, tBlind, { stagger: .035 });
    });
    dark(ctx, 900, 400);
  }, { tr: 'crumple', td: .9, mood: 'dark' });
  for (let i = 0; i < 8; i++) ev(tBec + .2 + i * .2, 'drop'); ev(tBlind, 'hit');
  // J: paper card catalogues -> "МОГЛО."
  const tUSSR = c('Но это Советский'), tCards = c('Бумажные картотеки'), tAm = c('В Америке'), tCould = c('Могло'), tThere = c('И там убийца');
  R.shot(tUSSR - .2, (ctx, lt, D) => {
    camera(lt, D, { z: [1.0, 1.1], x: [50, -50], shake: hits([tCould + .1], 22) }); X.bg(ctx, deskD(), .4);
    L(ctx, .85, () => {
      for (let i = 0; i < 3; i++) { const out = tw(tCards + i * .2, .6); put(ctx, X.prop('drawer'), 420 + i * 540, 760 + (1 - out) * 80, { s: .8 }); for (let k = 0; k < 6; k++) put(ctx, Pp.indexCard({ w: 420, h: 260, title: 'КАРТОЧКА ' + (k + 1), seed: 370 + k }), 420 + i * 540 + (k - 2.5) * 4, 560 - out * k * 16, { rot: (hr(k + i) - .5) * .1 }); }
      X.hand(ctx, 'никакого интернета', 1100, 210, tCards + 1.1, { size: 60, color: '#f4efe3' });
      X.hand(ctx, '«в Америке так не могло быть»', 260, 210, tAm, { size: 56, color: '#cfd6de' });
      const cw = Pp.cutWord('МОГЛО.', 220, 71, { styles: [2, 1, 6] }); Pp.drawCutWord(ctx, cw, W / 2, 520, tCould, { stagger: .03, d: .15 });
    });
    if (S.T > tCould) { ctx.fillStyle = `rgba(0,0,0,${.35 * (1 - tw(tCould, .6))})`; ctx.fillRect(0, 0, W, H); }
    dark(ctx, W / 2, 420);
  }, { tr: 'flip', td: .8, mood: 'dark' });
  ev(tCards, 'drawer'); ev(tCould, 'boom'); R.hit(tCould, 1);
  // K: map drifts west over ocean
  R.shot(tThere - .2, (ctx, lt, D) => { camera(lt, D, { x: [0, -200] }); DI.ocean(ctx, lt); const e = clamp((S.T - tThere) / 2.5); require('./engine').planeDraw(ctx, lerp(W + 100, -200, e), 400 + Math.sin(e * 5) * 40, Math.PI + .1, 1.1); X.hand(ctx, 'на запад →  США', W / 2, 200, tThere + .3, { size: 70, color: '#f4efe3', align: 'center' }); }, { tr: 'slide', dir: -1, mood: 'dark' });
  ev(tThere, 'sea', { d: 3 }); ev(tThere + .3, 'plane');
}
module.exports = { build };
