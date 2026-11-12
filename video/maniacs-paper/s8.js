// ===== Scene 8: finale & twist + end card =====
const K = require('./core'); const Pp = require('./paper'); const X = require('./sets'); const A = require('./anim'); const R = require('./engine'); const DI = require('./dioramas');
const { W, H, F, clamp, lerp, E, hr, S, tw, twos, cue, SC, ev, camera, L, hits, font, TL } = K;
const { P, put, sheet } = Pp;
const GOLD = '#c9a34a', INK = '#f1e4c4';
const desk = () => X.darkDesk(801, '#2a2418');
const lamp = (ctx, x = W * .45, y = H * .35, k = 1) => X.lampLight(ctx, x + K.noise1(S.T * .2) * 25, y, 1000, '255,200,120', k, .55);
const BRIGHT = [P.cream, P.teal, P.yellow, P.coral, '#9fd3c7'];
const SCR = [P.yellow, P.coral, P.teal, P.cream, P.white];
function build() {
  const S8 = 8, c = (p, n) => cue(S8, p, n); const t0 = SC(8).t0; const GEO = require('./geo');
  const tCal = c('Калифорния'), tSer = c('Серия ночных'), tTot = c('В итоге не менее'), t13 = c('тринадцати'), t50 = c('пятидесяти'), t120 = c('ста двадцати'), tNames = c('Преступника называли'), tGSK = c('Убийца из Золотого');
  const promised = Pp.cutWord('ОБЕЩАННАЯ ИСТОРИЯ', 120, 131, { styles: [1, 0, 4, 3] });
  R.shot(t0 - .3, (ctx, lt, D) => {
    camera(lt, D, { z: [1.1, 1.0] }); X.bg(ctx, desk(), .4); DI.fog(ctx, .12, '200,180,140');
    L(ctx, .9, () => Pp.drawCutWord(ctx, promised, W / 2, 540, t0 + .1, { stagger: .05 })); lamp(ctx, W / 2, 400, .8);
  }, { tr: 'dip', td: 1.0, mood: 'twist' });
  ev(t0 + .1, 'paperslap'); ev(t0, 'drone8', { d: c('Ответ оказался') - t0 });
  // CA map with dots 1974-1986
  const ca = X.mapSprite('ca_map', 1500, 960, GEO.us, X.proj(-119.5, 37.3, 70, 750, 480), f => f.id === 'California' ? { fill: '#b98d4c', stroke: 'rgba(40,25,10,.6)', lift: 1 } : { fill: '#7a6a50', stroke: 'rgba(40,25,10,.3)' }, { paper: '#cdb98f', age: .5, burn: .5, compass: 1 });
  R.shot(tCal - .2, (ctx, lt, D) => {
    camera(lt, D, { z: [1.0, 1.12], x: [-30, 30] }); X.bg(ctx, desk(), .4);
    L(ctx, .9, () => { put(ctx, ca, W / 2 - 100, H / 2, { rot: -.01 }); const Pj = X.proj(-119.5, 37.3, 70, W / 2 - 100, H / 2);
      for (let i = 0; i < 14; i++) { const lon = -121.6 - hr(i) * 1.2 + (i > 8 ? 2 + hr(i * 3) * 2.5 : 0), lat = 38.7 - hr(i * 7) * (i > 8 ? 4.5 : 1.2); const [x, y] = Pj(lon, lat); X.pulseDot(ctx, x, y, tCal + .8 + i * .28, { R: 24, s: .5, r: 6 }); }
      const yr = Math.round(lerp(1974, 1986, E.out(clamp((twos() - tCal - .8) / 4)))); put(ctx, X.prop('calendarPad', String(yr)), 1640, 380, { rot: .05, s: .8 }); X.hand(ctx, 'Калифорния', 380, 200, tCal + .2, { size: 70, color: INK }); });
    lamp(ctx, 900, 400);
  }, { tr: 'accordion', td: 1.0, mood: 'twist' });
  for (let i = 0; i < 14; i += 2) ev(tCal + .8 + i * .28, 'pin'); ev(tCal + .8, 'calendar', { d: 4 });
  R.shot(tSer - .2, (ctx, lt, D) => {
    camera(lt, D, { z: [1.0, 1.08], x: [30, -30] }); X.bg(ctx, desk(), .4);
    L(ctx, .55, () => { put(ctx, X.prop('house', S.T < tSer + 2.2 ? 1 : 0), 380, 300, { s: .8, a: .9 }); put(ctx, X.prop('house', 0), 1550, 280, { s: .7, a: .9 }); });
    L(ctx, .9, () => { X.hand(ctx, 'не менее', W / 2, 400, tTot, { size: 64, color: INK, align: 'center' });
      [[13, '', 'убийств', t13, 400], [50, '+', 'нападений', t50, W / 2], [120, '+', 'краж', t120, W - 400]].forEach(([n, sfx, l, t, x]) => { X.counter(ctx, n, x, 620, t - .2, { size: 190, d: 1, suffix: sfx || undefined, color: '#2a2418', bg: '#efe3c8' }); X.hand(ctx, l, x, 820, t + .3, { size: 60, color: INK, align: 'center' }); }); });
    lamp(ctx, W / 2, 400);
  }, { tr: 'slide', mood: 'twist' });
  ev(tSer + 2.2, 'lampclick'); [t13, t50, t120].forEach(t => ev(t - .2, 'tick', { d: 1 }));
  const fbi = Pp.polaroid('fbi_seeking_info_gsk', { w: 1000, dark: '#2a1f14', light: '#efe3c8', contrast: 1.15, frame: 'print', border: 16 });
  const fbiColor = Pp.cached('fbi_col', () => { const im = Pp.IMG['fbi_seeking_info_gsk']; const cv = K.mk(1000, Math.round(1000 * im.height / im.width)); const x = cv.getContext('2d'); x.drawImage(im, 0, 0, cv.width, cv.height); Pp.texturize(x, cv.width, cv.height, .4, 3); x.globalCompositeOperation = 'multiply'; x.fillStyle = '#efe0bf'; x.fillRect(0, 0, cv.width, cv.height); const b = 16; return Pp.sprite(cv.width + b * 2, cv.height + b * 2, 8, (c2) => { const base = sheet({ w: cv.width + b * 2, h: cv.height + b * 2, color: '#efe6d2', seed: 811, tex: .4, age: .3 }); c2.drawImage(base.c, -8, -8); c2.drawImage(cv, b, b); }); });
  const gsk = [Pp.cutWord('УБИЙЦА', 120, 141, { styles: [3, 0, 1] }), Pp.cutWord('ИЗ ЗОЛОТОГО ШТАТА', 100, 143, { styles: [3, 0, 1, 4] })];
  R.shot(tNames - .2, (ctx, lt, D) => {
    camera(lt, D, { z: [1.0, 1.15], x: [40, -20] }); X.bg(ctx, X.cork(8, '#b98a52'), .45);
    L(ctx, .9, () => { put(ctx, fbiColor, W / 2, 400, { rot: -.015 }); [[-480, -260], [480, -260]].forEach(([dx, dy]) => put(ctx, Pp.pin(P.red), W / 2 + dx, 400 + dy, { elev: .3 }));
      Pp.drawCutWord(ctx, gsk[0], W / 2, 830, tGSK, { stagger: .04 }); Pp.drawCutWord(ctx, gsk[1], W / 2, 960, tGSK + .3, { stagger: .03 }); });
    lamp(ctx, W / 2, 380, .7);
  }, { tr: 'page', td: .8, mood: 'twist' });
  ev(tGSK, 'hit');
  // 42 years
  const t42 = c('Сорок два года'), tGone = c('Он будто'), tExp = c('Эксперты удивлялись');
  R.shot(t42 - .2, (ctx, lt, D) => {
    camera(lt, D, { z: [1.0, 1.1], hand: S.T > c('Ответ оказался') - 1.7 ? 0 : 1 }); X.bg(ctx, desk(), .4); DI.fog(ctx, .12, '200,180,140');
    L(ctx, .9, () => { const p = clamp((twos() - t42 - .2) / 3); const yr = Math.round(lerp(1976, 2018, E.out(p))); put(ctx, X.prop('calendarPad', String(yr)), 420, 420, { rot: -.05 }); if (p > 0 && p < 1) { const fp = (S.T * 12) % 1; ctx.save(); ctx.translate(420, 300); ctx.scale(1, Math.max(.05, 1 - fp)); put(ctx, Pp.sheet({ w: 340, h: 300, color: '#efe9db', seed: 50, tex: .4 }), 0, 140, { elev: .5 }); ctx.restore(); }
      X.headline(ctx, '42 ГОДА', 1220, 360, t42 + .1, { size: 200, color: '#2a2418', bg: GOLD, rot: .03 }); X.hand(ctx, 'никто не знал его имени', 1220, 560, t42 + 1.2, { size: 60, color: INK, align: 'center' });
      put(ctx, sheet({ w: 1300, h: 220, color: '#efe3c8', seed: 821, tex: .5, age: .3 }), W / 2, 860, { rot: -.01, a: tw(tExp, .4) }); X.typed(ctx, 'ОТКУДА ОН ЗНАЕТ МЕТОДЫ ПОЛИЦИИ?', W / 2, 880, tExp + 1.0, { size: 52, cps: 26, align: 'center' }); });
    lamp(ctx, 900, 400);
  }, { tr: 'flip', td: .8, mood: 'twist' });
  ev(t42 + .2, 'calendar', { d: 3 }); X.typedEv(tExp + 1.0, 'ОТКУДА ОН ЗНАЕТ МЕТОДЫ ПОЛИЦИИ?', 26);
  // TWIST: dossier
  const tAns = c('Ответ оказался'), tCop = c('Он сам был'), tJD = c('Джозеф Деанджело'), tEx = c('Эксетер'), tOb = c('Оберне'), tShop = c('за кражу'), tAfter = c('большинство убийств'), tMech = c('Позже он работал'), tHid = c('Невидимка');
  const exCop = Pp.stamp('БЫВШИЙ ПОЛИЦЕЙСКИЙ', { size: 96, color: '#d1242c' });
  const polJ = Pp.polaroid('deangelo_court_2018', { w: 520, dark: '#24170c', light: '#f3e4c2', half: .3, crop: [52, 10, 740, 493], caption: 'Деанджело, 2018' });
  ev(tCop - 1.6, 'silence', { d: 1.55 }); ev(tCop + .05, 'boom'); ev(tCop + .05, 'stampbig'); R.hit(tCop + .05, 1.6);
  R.shot(tAns - .4, (ctx, lt, D) => {
    const pop = tw(tCop + .05, .25, E.out) * (1 - tw(tCop + 1.6, 1.4, E.io));
    camera(lt, D, { z: [1.0, 1.1], x: [-20, 40], hand: S.T < tCop ? .2 : 1, shake: hits([tCop + .05], 26) });
    X.bg(ctx, S.T < tCop ? desk() : X.collageBg(831, [P.cream, P.red, P.yellow, '#f6a38f']), .4);
    L(ctx, .9, () => { put(ctx, sheet({ w: 1500, h: 900, color: '#efe3c8', seed: 832, tex: .55, age: .3, fold: 1 }), W / 2, 540, { rot: -.01 });
      ctx.save(); ctx.translate(W / 2, 540); ctx.rotate(-.01);
      font(ctx, F.osw, 70, '700'); ctx.fillStyle = '#2a2418'; ctx.letterSpacing = '10px'; ctx.fillText('ДОСЬЕ', -660, -330); ctx.letterSpacing = '0px';
      const lines = [['ДЕАНДЖЕЛО, ДЖОЗЕФ', tJD], ['ПОЛИЦИЯ: ЭКСЕТЕР', tEx], ['ПОЛИЦИЯ: ОБЕРН', tOb], ['1979: УВОЛЕН ЗА КРАЖУ', tShop], ['УБИЙСТВА — ПОСЛЕ', tAfter], ['МЕХАНИК, ПЕНСИЯ', tMech]];
      lines.forEach(([s, t], i) => { font(ctx, F.mono, 46, '700'); ctx.fillStyle = i === 4 ? '#9e1b1b' : '#1d1d22'; ctx.fillText(s, -660, -220 + i * 86);
        const off = tw(t - .2, .35, E.in); if (off < 1) { ctx.save(); ctx.translate(-670 + off * 120, -262 + i * 86); ctx.rotate(-off * .3); ctx.globalAlpha = 1 - off * .8; ctx.fillStyle = '#0c0b0a'; ctx.fillRect(0, 0, 760, 58); ctx.restore(); } });
      ctx.restore();
      if (S.T > tCop) { A.fly(ctx, polJ, 1450, 470, tCop + .05, { d: .3, from: [500, -600], spin: .5, rot: .05, out: tCop + 6, to: [700, -300] }); }
      Pp.stampHit(ctx, exCop, W / 2 + 120, 880, tCop + .05, { rot: -.06 });
      if (S.T > tHid) X.hand(ctx, 'невидимка, спрятанный на виду', 1200, 190, tHid, { size: 54, color: '#9e1b1b', align: 'center' }); });
    if (pop > 0) { ctx.save(); ctx.globalCompositeOperation = 'screen'; ctx.fillStyle = `rgba(255,80,60,${.45 * pop})`; ctx.fillRect(0, 0, W, H); ctx.restore(); }
    if (S.T < tCop) { ctx.fillStyle = `rgba(0,0,0,${.35 * tw(tAns - .3, 1)})`; ctx.fillRect(0, 0, W, H); }
    lamp(ctx, 900, 400, S.T < tCop ? .7 : 1.2);
  }, { tr: 'tear', td: .7, mood: 'twist' });
  [tJD, tEx, tOb, tShop, tAfter, tMech].forEach(t => ev(t - .2, 'redact'));
  // How found: bright
  const tNot = c('И нашли его не'), tPr = c('не по отпечатку'), tWit = c('не по свидетелю'), tConf = c('не по признанию'), t2018 = c('В две тысячи восемнадцатом'), tUp = c('загрузили'), tRel = c('Совпал не он');
  R.shot(tNot - .2, (ctx, lt, D) => {
    camera(lt, D, { z: [1.0, 1.08], x: [30, -30] }); X.bg(ctx, X.collageBg(841, BRIGHT), .45); X.lightDrift(ctx, 1);
    L(ctx, .9, () => [['отпечаток', tPr, P.yellow], ['свидетель', tWit, '#9fd3c7'], ['признание', tConf, '#f6a38f']].forEach(([s, t, col], i) => { A.pop(ctx, Pp.sticky(s, { w: 380, color: col, size: 70 }), 420 + i * 540, 520, t - .1, { rot: (i - 1) * .05 }); X.marker(ctx, [[260 + i * 540, 380], [580 + i * 540, 660]], tw(t + .35, .2), { w: 20 }); X.marker(ctx, [[580 + i * 540, 380], [260 + i * 540, 660]], tw(t + .5, .2), { w: 20 }); }));
    X.scraps(ctx, SCR, 12, 81, { speed: 1.4 });
  }, { tr: 'stamp', stampText: 'ИНАЧЕ', td: .6, mood: 'bright' });
  [tPr, tWit, tConf].forEach(t => { ev(t - .1, 'pop'); ev(t + .35, 'marker'); }); ev(tNot, 'arp', { d: c('Двадцать четвёртого апреля') - tNot + 4 });
  R.shot(t2018 - .2, (ctx, lt, D) => {
    camera(lt, D, { z: [1.0, 1.1], x: [-40, 40] }); X.bg(ctx, X.collageBg(843, BRIGHT), .45); X.lightDrift(ctx, 1);
    L(ctx, .9, () => { X.dna(ctx, 460, 520, 600, 90, S.T, { reveal: tw(t2018, 1.2, E.lin), c1: P.teal, c2: P.yellow, rung: P.red, n: 30, rot: -.2 });
      X.hand(ctx, 'ДНК с места преступления', 460, 800, t2018 + .6, { size: 50, color: '#24305e', align: 'center' });
      const q = tw(tUp, .45, E.back); if (q > 0) { put(ctx, browser(), 1300, 520, { s: q, rot: .02 });
        const up = tw(tUp + .4, 2.2, E.io); ctx.save(); ctx.translate(1300, 520); ctx.fillStyle = '#1d2433'; ctx.fillRect(-300, -40, 600 * up, 26); ctx.restore();
        X.hand(ctx, up < 1 ? 'загрузка…' : 'поиск родственников', 1300, 560, tUp + .5, { size: 48, color: '#24305e', align: 'center' });
        if (S.T > tRel) for (let k = 0; k < 3; k++) A.pop(ctx, Pp.sticky(['дальний родственник', 'троюродная ветвь', 'совпадение'][k], { w: 300, h: 120, color: [P.yellow, '#9fd3c7', '#f6a38f'][k], size: 40 }), 1040 + k * 260, 800, tRel + .3 + k * .35, { rot: (k - 1) * .05 }); }
      if (q > 0) X.marker(ctx, [[780, 520], [lerp(780, 980, q), 520]], 1, { color: 'rgba(29,36,51,.6)', w: 6, blend: 'source-over' }); });
    X.scraps(ctx, SCR, 10, 82);
  }, { tr: 'page', td: .8, mood: 'bright' });
  ev(tUp + .4, 'scan', { d: 2.2 }); [0, 1, 2].forEach(k => ev(tRel + .3 + k * .35, 'pop'));
  // family tree
  const tGen = c('Генеалоги около'), tLeft = c('пока не остался'), tWatch = c('За ним установили'), tItem = c('выброшенный'), tMatch = c('Совпало');
  const match = Pp.stamp('СОВПАЛО', { size: 150, color: '#d1242c' });
  R.shot(tGen - .2, (ctx, lt, D) => {
    camera(lt, D, { z: [1.0, 1.1], y: [20, -20] }); X.bg(ctx, X.collageBg(845, [P.cream, '#cde8e4', P.yellow, '#f6d9a0']), .45); X.lightDrift(ctx, 1);
    const toItem = tw(tWatch - .2, .7, E.io);
    L(ctx, .9, () => {
      ctx.save(); ctx.globalAlpha = 1 - toItem * .85;
      const levels = [[W / 2], [600, 1320], [380, 820, 1100, 1540], []]; for (let i = 0; i < 10; i++) levels[3].push(240 + i * 160); const ys = [200, 400, 600, 830]; const final = 6;
      for (let l = 1; l < 4; l++) levels[l].forEach((x, i) => { const par = levels[l - 1][Math.floor(i * levels[l - 1].length / levels[l].length)]; const cut = l === 3 && i !== final ? tw(tGen + 1.6 + i * .28, .2) : 0; X.thread(ctx, [par, ys[l - 1] + 30], [x, ys[l] - 30], tw(tGen + l * .35, .5) * (1 - cut), 20, cut > 0 ? '#aaa' : '#2a9d8f'); });
      levels.forEach((lv, l) => lv.forEach((x, i) => { const cut = l === 3 && i !== final ? tw(tGen + 1.6 + i * .28, .3) : 0; const sel = l === 3 && i === final ? tw(tLeft + .3, .4) : 0; const q = tw(tGen + l * .35, .4, E.back);
        if (q <= 0) return; put(ctx, node(sel > .5 ? P.red : [P.teal, P.yellow, '#f6a38f', '#9fd3c7'][(l + i) % 4]), x, ys[l] + cut * 260, { s: q * (1 + sel * .3), rot: cut * (hr(i) - .5) * 2, a: 1 - cut * .8, elev: cut * .8 }); }));
      const sci = levels[3].findIndex((x, i) => i !== final && S.T > tGen + 1.4 + i * .28 && S.T < tGen + 1.75 + i * .28); if (sci >= 0) put(ctx, X.prop('scissors'), levels[3][sci] - 20, 720, { s: .6, rot: Math.sin(S.T * 30) * .15, elev: .6 });
      ctx.restore();
      if (toItem <= .9) X.headline(ctx, '≈ 4 МЕСЯЦА', 1650, 130, tGen + .8, { size: 70, color: P.white, bg: P.red, rot: .04, a: 1 - toItem });
      if (toItem > 0) { ctx.save(); ctx.globalAlpha = toItem; put(ctx, X.prop('cup'), W / 2 - 160, 560, {}); const mx = lerp(W / 2 + 400, W / 2 - 120, tw(tItem, 1, E.io)); put(ctx, X.prop('magnifier'), mx, 520, { elev: .5 }); ctx.restore(); X.hand(ctx, 'выброшенный предмет с ДНК', W / 2, 930, tItem + .2, { size: 58, color: '#24305e', align: 'center' }); }
      Pp.stampHit(ctx, match, W / 2 + 380, 700, tMatch + .05, { rot: -.08 }); });
    X.scraps(ctx, SCR, 9, 83);
  }, { tr: 'flip', td: .8, mood: 'bright' });
  for (let i = 0; i < 10; i++) if (i !== 6) ev(tGen + 1.6 + i * .28, 'snip'); ev(tLeft + .3, 'hit'); ev(tMatch + .05, 'stampbig');
  // arrest 2018
  const tArr = c('Двадцать четвёртого апреля'), t72 = c('Ему было семьдесят'), tLife = c('Позже его приговорили');
  const life = Pp.stamp('ПОЖИЗНЕННОЕ', { size: 96, color: '#d1242c' });
  R.shot(tArr - .2, (ctx, lt, D) => {
    camera(lt, D, { z: [1.0, 1.08], x: [-30, 30], shake: hits([tLife + .7], 10) }); X.bg(ctx, X.collageBg(847, BRIGHT), .45); X.lightDrift(ctx, 1);
    L(ctx, .9, () => { put(ctx, X.prop('calendarPad', '24.04'), 480, 430, { rot: -.05, s: 1.1 }); X.hand(ctx, '2018 · арест', 480, 760, tArr + .5, { size: 66, color: '#24305e', align: 'center' });
      X.counter(ctx, 72, 1300, 440, t72, { size: 260, d: 1, color: P.ink, bg: '#fbf8f1' }); X.hand(ctx, 'года', 1300, 660, t72 + .4, { size: 66, color: '#24305e', align: 'center' });
      Pp.stampHit(ctx, life, 1300, 860, tLife + .7, { rot: -.06 }); });
    X.scraps(ctx, SCR, 10, 84);
  }, { tr: 'flash', mood: 'bright' });
  ev(tArr, 'hit'); ev(t72, 'tick', { d: 1 }); ev(tLife + .7, 'stampbig');
  // reflection: people at desks, lamps on one by one
  const tThink = c('Задумайтесь'), tNoErr = c('ни одной ошибки'), tPeople = c('А выдали его'), tDidnt = c('Они не знали');
  R.shot(tThink - .2, (ctx, lt, D) => {
    camera(lt, D, { z: [1.08, 1.0] }); X.bg(ctx, X.darkDesk(851, '#3a2c1c'), .4);
    const warm = tw(tPeople, 5, E.io);
    L(ctx, .9, () => { X.headline(ctx, '42 ГОДА — НИ ОДНОЙ ОШИБКИ', W / 2, 140, tThink + .4, { size: 70, color: INK, bg: '#3a2c1c', out: tPeople + 3 });
      for (let i = 0; i < 8; i++) { const x = 200 + (i % 4) * 500, y = 520 + Math.floor(i / 4) * 330; const on = tw(tPeople + .5 + i * .5, .3); put(ctx, smallDesk(), x, y + 70, { s: .8 }); Pp.putPerson(ctx, i % 2 ? 'woman' : 'coat', x - 30, y + 50, 200, { color: on > .5 ? '#c99a5a' : '#2b2118' }); if (on > 0) X.vellumCone(ctx, x + 90, y - 80, 30, 220, 200, .25 * on, '255,215,140'); }
      X.hand(ctx, 'люди, которые искали свои корни', W / 2, 1010, tPeople + 1.2, { size: 54, color: INK, align: 'center' }); });
    if (warm > 0) { ctx.save(); ctx.globalCompositeOperation = 'soft-light'; ctx.fillStyle = `rgba(255,200,120,${.6 * warm})`; ctx.fillRect(0, 0, W, H); ctx.restore(); }
    lamp(ctx, W / 2, 400, .8);
  }, { tr: 'slide', mood: 'twist', warm: 1 });
  for (let i = 0; i < 8; i++) ev(tPeople + .5 + i * .5, 'lampclick'); ev(tThink, 'warmstrings', { d: SC(8).t1 - tThink + 4 });
  // pull back over warm windows
  const tInv = c('Невидимость работает'), tNoInv = c('Но по-настоящему'), tLooked = c('И те, на кого'), tEven = c('Даже спустя');
  R.shot(tInv - .3, (ctx, lt, D) => {
    camera(lt, D, { z: [1.5, 1.0], y: [-60, 0], ease: E.sine });
    const sky = Pp.sheet({ w: W + 700, h: H + 500, color: '#2a3550', seed: 861, tex: .6, grad: false }); L(ctx, .2, () => put(ctx, sky, W / 2, H / 2, { shadow: 0 }));
    L(ctx, .7, () => { for (let r = 0; r < 3; r++) for (let i = 0; i < 7; i++) { const lit = tw(tLooked - 2 + hr(i * 3 + r) * 5, .4); put(ctx, X.prop('house', lit > .5 ? 1 : 0), 120 + i * 300 + (r % 2) * 150, 380 + r * 260, { s: .55 }); } });
    L(ctx, 0, () => { X.headline(ctx, 'НЕВИДИМОСТЬ РАБОТАЕТ, ПОКА НИКТО НЕ СМОТРИТ', W / 2, 140, tInv, { size: 56, color: INK, bg: '#3a2c1c', out: tNoInv - .3 }); X.headline(ctx, 'НЕВИДИМЫХ ЛЮДЕЙ НЕ БЫВАЕТ', W / 2, 140, tNoInv, { size: 76, color: P.ink, bg: P.yellow }); X.hand(ctx, 'бывают те, на кого не посмотрели вовремя', W / 2, 960, tNoInv + 2.4, { size: 54, color: INK, align: 'center' }); });
    const warm = tw(tLooked, 4, E.io); ctx.save(); ctx.globalCompositeOperation = 'soft-light'; ctx.fillStyle = `rgba(255,200,120,${.3 + .4 * warm})`; ctx.fillRect(0, 0, W, H); ctx.restore();
  }, { tr: 'zoom', td: .9, mood: 'twist', warm: 1 });
  // teaser DNA
  const tSub = c('Если вам было'), tNext = c('В следующем ролике'), tWant = c('хотите ли вы');
  R.shot(tSub - .2, (ctx, lt, D) => {
    camera(lt, D, { z: [1.0, 1.08] }); X.bg(ctx, X.collageBg(871, BRIGHT), .45); X.lightDrift(ctx, 1.2);
    L(ctx, .6, () => X.dna(ctx, W / 2, 560, 2100, 120, S.T * .7, { c1: P.teal, c2: P.yellow, rung: P.red, n: 70, rot: -.1 }));
    L(ctx, .95, () => { X.headline(ctx, 'ПОДПИШИТЕСЬ', W / 2, 170, tSub + .2, { size: 70, color: P.white, bg: P.red });
      X.headline(ctx, 'СЛЕДУЮЩИЙ РОЛИК: ДНК-ГЕНЕАЛОГИЯ', W / 2, 320, tNext + .3, { size: 66, color: P.ink, bg: '#fbf8f1', rot: -.01 });
      A.pop(ctx, Pp.sticky('Хотите ли вы, чтобы ваша ДНК\nбыла в такой базе?', { w: 900, h: 300, color: P.yellow, size: 64 }), W / 2, 820, tWant, { rot: .02 }); });
    X.scraps(ctx, SCR, 14, 87);
  }, { tr: 'page', td: .8, mood: 'bright', warm: 1 });
  ev(tSub + .2, 'pop'); ev(tWant, 'pop');
  // END CARD (4s, no voice)
  const tEnd = SC(8).t1;
  R.shot(tEnd, (ctx, lt, D) => {
    camera(lt, D, { z: [1.0, 1.04] }); X.bg(ctx, X.collageBg(881, BRIGHT), .45); X.lightDrift(ctx, 1.2);
    L(ctx, .9, () => {
      [[560, 'СЛЕДУЮЩИЙ РОЛИК'], [1360, 'ЕЩЁ ОДНО ДЕЛО']].forEach(([x, s], i) => { put(ctx, Pp.sheet({ w: 640, h: 380, color: '#fbf8f1', seed: 882 + i, tex: .4 }), x, 420, { rot: (i ? .02 : -.02) }); put(ctx, Pp.sheet({ w: 600, h: 340, color: i ? P.teal : '#24334d', seed: 884 + i, tex: .5 }), x, 420, { rot: (i ? .02 : -.02), shadow: 0 }); X.hand(ctx, s.toLowerCase(), x, 680, tEnd + .2 + i * .2, { size: 54, color: '#24305e', align: 'center' }); put(ctx, Pp.tape(150, 44, 5 + i), x, 230, { rot: .1 - i * .2 }); });
      A.pop(ctx, Pp.cutout('subbtn', 520, 130, (x, part) => { part(X.R(0, 0, 520, 130, 22), '#d1242c'); font(x, F.osw, 64, '700'); x.fillStyle = '#fbf8f1'; x.textAlign = 'center'; x.fillText('ПОДПИСАТЬСЯ', 260, 88); }, { border: 6 }), W / 2, 830, tEnd + .4, {});
      ctx.save(); font(ctx, F.mono, 26, '700'); ctx.fillStyle = 'rgba(29,36,51,.85)'; ctx.textAlign = 'center'; ctx.fillText('Ролик носит информационный характер. Источники в описании.', W / 2, 1010); ctx.restore(); });
  }, { tr: 'flip', td: .7, mood: 'bright', warm: 1 });
  ev(tEnd + .4, 'pop'); ev(tEnd + .4, 'endsoft');
}
function browser() { return Pp.cutout('browser', 700, 420, (x, part) => { part(X.R(0, 0, 700, 420, 18), '#fbf8f1'); part(X.R(0, 0, 700, 64, 18), '#1d2433'); ['#ee6c5a', '#f2c14e', '#2a9d8f'].forEach((c, i) => { const p = new K.Path2D(); p.arc(36 + i * 34, 32, 11, 0, 7); part(p, c, { shadow: false }); }); part(X.R(160, 16, 500, 32, 14), '#efe6d2', { shadow: false }); font(x, F.osw, 40, '700'); x.fillStyle = '#1d2433'; x.textAlign = 'center'; x.fillText('ГЕНЕАЛОГИЧЕСКАЯ БАЗА', 350, 140); part(X.R(50, 180, 600, 26, 13), '#d9e6e3', { shadow: false }); }, { border: 0 }); }
function node(col) { return Pp.cutout('node' + col, 90, 90, (x, part) => { const p = new K.Path2D(); p.arc(45, 45, 40, 0, 7); part(p, col); const h = new K.Path2D(); h.ellipse(45, 36, 12, 14, 0, 0, 7); part(h, 'rgba(29,36,51,.75)', { shadow: false }); part(new K.Path2D('M22 76 Q26 52 45 50 Q64 52 68 76 Z'), 'rgba(29,36,51,.75)', { shadow: false }); }, { border: 4 }); }
function smallDesk() { return Pp.cutout('sdesk', 300, 290, (x, part) => { x.translate(0, 85); part(X.R(0, 60, 300, 30, 6), '#6b4a2e'); part(X.R(20, 90, 20, 110, 4), '#4a3426'); part(X.R(260, 90, 20, 110, 4), '#4a3426'); part(X.R(150, 10, 110, 60, 4), '#1d2433'); part(X.R(160, 18, 90, 44, 2), '#8ecae6', { shadow: false }); part(new K.Path2D('M210 -60 L250 -60 L270 -20 L190 -20 Z'), '#2a9d8f'); part(X.R(226, -20, 8, 80, 2), '#3a3a3a'); }); }
module.exports = { build };
