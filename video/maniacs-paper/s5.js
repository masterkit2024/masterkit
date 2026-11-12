// ===== Scene 5: Bundy (amber noir) =====
const K = require('./core'); const Pp = require('./paper'); const X = require('./sets'); const A = require('./anim'); const R = require('./engine'); const DI = require('./dioramas');
const { W, H, F, clamp, lerp, E, hr, S, tw, twos, cue, SC, ev, camera, L, hits, font } = K;
const { P, put, sheet } = Pp;
const desk = () => X.darkDesk(501, '#3a281c');
const lamp = (ctx, x = W * .4, y = H * .3) => X.lampLight(ctx, x + K.noise1(S.T * .2) * 25, y, 950, '255,175,90', 1, .55);
const INK = '#f3e3c6';
function build() {
  const S5 = 5, c = (p, n) => cue(S5, p, n); const t0 = SC(5).t0; const GEO = require('./geo');
  const tStud = c('Студент-психолог'), tCharm = c('обаятельный'), t71 = c('В тысяча девятьсот семьдесят первом'), tAnn = c('Энн Руль'), tCop = c('Она была бывшим'), tBook = c('Позже она напишет');
  const polB = Pp.polaroid('bundy_1978', { w: 380, dark: '#2a170e', light: '#f1d9a8', half: .35, caption: 'Тед Банди' });
  // A: amber room, photo
  R.shot(t0 - .3, (ctx, lt, D) => {
    camera(lt, D, { z: [1.0, 1.1], x: [30, -30] }); DI.amberRoom(ctx, lt, {});
    L(ctx, .95, () => { A.fly(ctx, polB, 1300, 450, t0 + .05, { d: .4, from: [600, -500], spin: .5, rot: .05, out: t0 + 6.5, to: [700, -200] });
      X.hand(ctx, 'студент-психолог', 380, 260, tStud, { size: 64, color: INK }); X.hand(ctx, 'обаятельный', 420, 350, tCharm, { size: 64, color: INK }); X.hand(ctx, 'красиво говорил', 460, 440, tCharm + 1.0, { size: 64, color: INK }); });
  }, { tr: 'crumple', td: .9, mood: 'dark' });
  ev(t0 + .05, 'paperslap'); ev(t0, 'lampclick');
  // B: 1971 hotline, two faceless figures
  R.shot(t71 - .2, (ctx, lt, D) => {
    camera(lt, D, { z: [1.05, 1.15], x: [-40, 40] }); DI.amberRoom(ctx, lt, { ring: S.T < t71 + 2.5 });
    L(ctx, .8, () => { Pp.putPerson(ctx, 'coat', 760, 990, 470, { color: '#1b120c', rim: 'rgba(255,190,110,.55)' }); Pp.putPerson(ctx, 'woman', 1360, 990, 450, { color: '#1b120c', rim: 'rgba(255,190,110,.55)', flip: true }); });
    L(ctx, 0, () => { A.pop(ctx, X.prop('calendarPad', '1971'), 240, 260, t71 + .2, { s: .7, rot: -.06 }); X.hand(ctx, 'телефон доверия · ночь', 520, 140, t71 + .8, { size: 56, color: INK });
      A.pop(ctx, Pp.sticky('Энн Руль', { w: 280, color: '#f2c14e', size: 60 }), 1500, 260, tAnn, { rot: .05 });
      X.hand(ctx, 'бывший полицейский', 1240, 420, tCop + .2, { size: 50, color: INK }); X.hand(ctx, 'начинающая писательница', 1240, 480, tCop + 1.4, { size: 50, color: INK }); });
    lamp(ctx, 520, 560);
  }, { tr: 'slide', mood: 'dark' });
  ev(t71, 'phone', { d: 2.4 }); ev(tAnn, 'pop');
  R.shot(tBook - .2, (ctx, lt, D) => {
    camera(lt, D, { z: [1.15, 1.28], x: [0, 40] }); X.bg(ctx, desk(), .4);
    L(ctx, .9, () => { put(ctx, sheet({ w: 1100, h: 700, color: '#efe3c8', seed: 511, tex: .5, age: .35, fold: 1 }), W / 2, 470, { rot: -.01 }); ctx.save(); ctx.translate(W / 2, 470); ctx.rotate(-.01);
      X.typed(ctx, '1980 · ЭНН РУЛЬ НАПИШЕТ', -440, -60, tBook + .3, { size: 54, cps: 18 }); X.typed(ctx, 'КНИГУ О НЁМ', -440, 30, tBook + 1.7, { size: 54, cps: 18 });
      X.hand(ctx, 'долго не могла поверить', -440, 160, tBook + 3, { size: 58, color: '#7a2a20' }); ctx.restore(); require('./s2').typewriter(ctx, W / 2, 980); });
    lamp(ctx, 900, 300);
  }, { tr: 'page', td: .8, mood: 'dark' });
  X.typedEv(tBook + .3, '1980 · ЭНН РУЛЬ НАПИШЕТ', 18); X.typedEv(tBook + 1.7, 'КНИГУ О НЁМ', 18);
  // C: US map 7 states, 30
  const t30 = c('Он признается'), ST7 = ['Washington', 'Oregon', 'Idaho', 'Utah', 'Colorado', 'California', 'Florida'];
  const base = X.mapSprite('us_bundy', 1500, 900, GEO.us, X.proj(-97, 39, 24, 750, 470), f => ({ fill: '#cdb48d', stroke: 'rgba(60,35,20,.35)' }), { paper: '#d9c49e', age: .45, burn: .5, compass: 1 });
  const stPieces = ST7.map(s => X.mapSprite('st7_' + s, 1500, 900, GEO.us.filter(f => f.id === s), X.proj(-97, 39, 24, 750, 470), f => ({ fill: '#9e2b2b', stroke: 'rgba(40,10,10,.5)', lift: 1 }), { bare: 1 }));
  R.shot(t30 - .2, (ctx, lt, D) => {
    camera(lt, D, { z: [1.0, 1.08], x: [30, -30] }); X.bg(ctx, desk(), .4);
    L(ctx, .9, () => { put(ctx, base, 800, 540, { rot: -.01 }); ST7.forEach((s, i) => { const q = tw(t30 + 1.4 + i * .32, .3, E.out); if (q > 0) Pp.put(ctx, stPieces[i], 800, 540 - (1 - q) * 30, { rot: -.01, a: q, shadow: 0 }); });
      X.counter(ctx, 30, 1650, 400, t30 + .6, { size: 200, d: 1.3, color: '#9e2b2b', bg: '#f3e3c6' }); X.hand(ctx, '7 штатов', 1650, 600, t30 + 2.8, { size: 60, color: INK, align: 'center' }); X.hand(ctx, '1974 – 1978', 1650, 680, t30 + 3.6, { size: 60, color: INK, align: 'center' }); });
    lamp(ctx, 800, 350);
  }, { tr: 'flip', td: .8, mood: 'dark' });
  ST7.forEach((s, i) => ev(t30 + 1.4 + i * .32, 'tickone')); ev(t30 + .6, 'tick', { d: 1.3 });
  // D: they'd be missed at once; not invisibility but trust
  const tVict = c('Его жертвами'), tMiss = c('Их хватились'), tWeap = c('Поэтому он выбрал'), tTrust = c('а доверие');
  const trust = Pp.cutWord('ДОВЕРИЕ', 170, 91, { styles: [2, 0, 6, 3] });
  R.shot(tVict - .2, (ctx, lt, D) => {
    camera(lt, D, { z: [1.0, 1.1], shake: hits([tTrust + .2], 14) }); X.bg(ctx, desk(), .4);
    L(ctx, .9, () => { put(ctx, sheet({ w: 1400, h: 760, color: '#efe3c8', seed: 521, tex: .5, age: .4, burn: .5 }), W / 2, H / 2, { rot: .01 });
      X.hand(ctx, 'молодые женщины, студентки', 380, 300, tVict + .3, { size: 60 }); X.hand(ctx, 'их хватились бы сразу', 380, 390, tMiss, { size: 66, color: '#9e2b2b' });
      font(ctx, F.osw, 110, '700'); ctx.letterSpacing = '6px'; ctx.globalAlpha = tw(tWeap + .4, .3); ctx.fillStyle = '#3a281c'; ctx.textAlign = 'center'; ctx.fillText('НЕВИДИМОСТЬ', W / 2, 600); ctx.globalAlpha = 1; ctx.letterSpacing = '0px';
      X.strikeOut(ctx, W / 2 - 360, W / 2 + 360, 560, tTrust - .5, { w: 22 });
      Pp.drawCutWord(ctx, trust, W / 2, 790, tTrust + .1, { stagger: .04 }); });
    lamp(ctx, W / 2, 350);
  }, { tr: 'slide', mood: 'dark' });
  ev(tTrust - .5, 'marker'); ev(tTrust + .2, 'hit');
  // E: crutches + cast + "Поможете?"
  const tCast = c('Он надевал'), tAsk = c('И просил помощи'), tNo = c('Человек на костылях'), tWant = c('Он вызывает'), tUsed = c('И именно это');
  R.shot(tCast - .2, (ctx, lt, D) => {
    camera(lt, D, { z: [1.0, 1.12], x: [40, -40] }); X.bg(ctx, desk(), .4);
    L(ctx, .9, () => { A.fly(ctx, X.prop('cast'), 620, 380, tCast + .3, { d: .45, from: [-800, -200], spin: -.4, rot: -.1, twos: true }); A.fly(ctx, X.prop('crutches'), 520, 680, tCast + 1.2, { d: .45, from: [-800, 300], spin: .3, rot: .5, twos: true });
      A.fly(ctx, X.prop('bubble', 'Поможете?'), 1300, 330, tAsk + .1, { d: .35, from: [500, -300], spin: .3, rot: .04, twos: true });
      ['донести книги', 'поднять вещи', 'в машину'].forEach((s, k) => A.pop(ctx, Pp.sticky(s, { w: 260, color: ['#f2c14e', '#f6a38f', '#e8c99a'][k], size: 48 }), 1100 + k * 290, 680, tAsk + .9 + k * .45, { rot: (k - 1) * .06 })); });
    lamp(ctx, 900, 300);
  }, { tr: 'tear', td: .7, mood: 'dark' });
  ev(tCast + .3, 'paperslap'); ev(tCast + 1.2, 'crutch'); ev(tAsk + .1, 'pop'); [0, 1, 2].forEach(k => ev(tAsk + .9 + k * .45, 'pop'));
  R.shot(tNo - .2, (ctx, lt, D) => {
    camera(lt, D, { z: [1.05, 1.0], x: [-40, 40] }); X.bg(ctx, desk(), .4);
    L(ctx, .9, () => { put(ctx, sheet({ w: 1600, h: 640, color: '#efe3c8', seed: 531, tex: .5, age: .35 }), W / 2, 560, {});
      X.hand(ctx, 'человек на костылях не пугает', W / 2, 330, tNo, { size: 62, align: 'center' });
      [['желание\nпомочь', '#9fd3c7', tWant], ['доверие', '#f2c14e', tWant + 1.2], ['риск', '#d1242c', tUsed + .3]].forEach(([s, col, t], k) => A.pop(ctx, Pp.sticky(s, { w: 300, color: col, size: 64, ink: k === 2 ? '#fbf8f1' : '#1d2433' }), 420 + k * 540, 600, t, { rot: (k - 1) * .04 }));
      X.marker(ctx, [[600, 600], [780, 600]], tw(tWant + .9, .3), { w: 12, color: 'rgba(60,30,20,.85)', blend: 'source-over' }); X.marker(ctx, [[1140, 600], [1320, 600]], tw(tUsed, .3), { w: 12, color: 'rgba(160,20,20,.9)', blend: 'source-over' }); });
    lamp(ctx, W / 2, 300);
  }, { tr: 'page', td: .8, mood: 'dark' });
  ev(tWant, 'pop'); ev(tWant + 1.2, 'pop'); ev(tUsed + .3, 'hit');
  // F: two letters buried under hundreds of reports
  const tHard = c('Дальше начинается'), tKl = c('Его подруга'), tRep = c('обе сообщили'), tDrown = c('Но следователи');
  R.shot(tHard - .2, (ctx, lt, D) => {
    camera(lt, D, { z: [1.0, 1.15], y: [0, 30] }); X.bg(ctx, desk(), .4);
    L(ctx, .9, () => {
      X.hand(ctx, 'самое тяжёлое в этом деле', W / 2, 220, tHard + .2, { size: 64, color: INK, align: 'center' });
      A.fly(ctx, Pp.envelope({ w: 460, h: 300, text: 'Э. Клёпфер', seal: false }), 700, 520, tKl + .3, { d: .4, from: [-700, -300], spin: -.4, rot: -.05, twos: true });
      A.fly(ctx, Pp.envelope({ w: 460, h: 300, text: 'Э. Руль', seal: false }), 1220, 540, tRep - .3, { d: .4, from: [700, -300], spin: .4, rot: .04, twos: true });
      X.hand(ctx, '«возможно, это он»', 960, 820, tRep + .4, { size: 60, color: INK, align: 'center' });
      for (let i = 0; i < 80; i++) { const tt = tDrown + .3 + i * .045; const q = E.in(clamp((twos() - tt) / .3)); if (q <= 0) continue; const x = 400 + hr(i * 3) * 1150, y = 300 + hr(i * 7) * 520;
        put(ctx, Pp.sheet({ w: 300, h: 380, color: ['#efe3c8', '#e6d6b6', '#f3ead6'][i % 3], seed: 540 + (i % 9), tex: .4, lines: i % 2 ? 'ruled' : null }), x, lerp(-500, y, q), { rot: (hr(i * 5) - .5) * .9, elev: (1 - q) * .8 }); }
      X.headline(ctx, 'СОТНИ СООБЩЕНИЙ', W / 2, 130, tDrown + 2.5, { size: 80, color: INK, bg: '#9e2b2b' });
    });
    lamp(ctx, 900, 300);
  }, { tr: 'dip', td: .7, mood: 'dark' });
  ev(tKl + .3, 'paperslap'); ev(tRep - .3, 'paperslap'); ev(tDrown + .3, 'papers', { d: 3.6 }); ev(tDrown + .5, 'dissonance', { d: 3 });
  // G: escapes, three sentences, executed
  const tEsc = c('Он дважды'), tThree = c('Был приговорён'), tExec = c('Двадцать четвёртого января'), tDna = c('Даже спустя');
  const kaz = Pp.stamp('КАЗНЁН', { size: 140, color: '#b5161c', sub: '24.01.1989' });
  R.shot(tEsc - .2, (ctx, lt, D) => {
    camera(lt, D, { z: [1.0, 1.1], x: [40, -40], shake: hits([tExec + 1.1], 14) }); X.bg(ctx, desk(), .4);
    L(ctx, .9, () => { put(ctx, sheet({ w: 1600, h: 840, color: '#efe3c8', seed: 551, tex: .5, age: .4, burn: .5, lines: 'grid' }), W / 2, H / 2, {});
      escapeDrawing(ctx, 420, 470, tEsc + .2, 0); escapeDrawing(ctx, 820, 470, tEsc + .9, 1); X.hand(ctx, '1977 · дважды сбегал', 620, 780, tEsc + .5, { size: 54, align: 'center' });
      X.hand(ctx, 'приговорён к смерти ×3', 1380, 330, tThree, { size: 58, align: 'center', color: '#7a2a20' });
      Pp.stampHit(ctx, kaz, 1380, 600, tExec + 1.1, { rot: -.08 });
      if (S.T > tDna) X.dna(ctx, 1380, 860, 520, 34, S.T, { reveal: tw(tDna, 1.2, E.lin), c1: '#c9a65a', c2: '#efe3c8', rung: '#9e2b2b', n: 28 }); });
    lamp(ctx, W / 2, 300);
  }, { tr: 'flip', td: .8, mood: 'dark' });
  ev(tExec + 1.1, 'stampbig');
  // H: recap board: invisible + trust + ?
  const tSo = c('Итак'), tCh = c('Чикатило невидимость'), tRi = c('Риджуэй те'), tBu = c('Банди доверие'), tWhat = c('А что бывает');
  R.shot(tSo - .2, (ctx, lt, D) => {
    camera(lt, D, { z: [1.0, 1.12], x: [-60, 60], r: [-.01, .01] }); X.bg(ctx, X.cork(5, '#c9915a'), .45);
    L(ctx, .85, () => {
      const C3 = [['ЧИКАТИЛО', 'невидимость в толпе', tCh, 330], ['РИДЖУЭЙ', 'те, кого не хватятся', tRi, 760], ['БАНДИ', 'доверие', tBu, 1190]];
      C3.forEach(([n, s, t, x], i) => { A.fly(ctx, Pp.indexCard({ w: 380, h: 260, title: n, body: '', seed: 560 + i }), x, 420, tSo + i * .15, { d: .35, from: [0, -700], spin: (i - 1) * .3, rot: (i - 1) * .04, twos: true }); X.hand(ctx, s, x, 470, t + .1, { size: 42, align: 'center' }); put(ctx, Pp.pin(), x, 300, { elev: .3, a: tw(tSo + i * .15 + .35, .1) }); });
      A.fly(ctx, X.prop('questionMark'), 1620, 420, tWhat + .2, { d: .4, from: [400, -700], spin: .5, s: .6, twos: true });
      X.thread(ctx, [330, 300], [760, 300], tw(tRi - .3, .8), 40); X.thread(ctx, [760, 300], [1190, 300], tw(tBu - .3, .8), 40); X.thread(ctx, [1190, 300], [1620, 300], tw(tWhat + .4, .8), 40);
      X.headline(ctx, 'НЕВИДИМ + ДОВЕРИЕ + ?', W / 2, 860, tWhat + 1.6, { size: 84, color: '#f3e3c6', bg: '#3a281c' });
    });
    lamp(ctx, W / 2, 300);
  }, { tr: 'slide', mood: 'dark' });
  ev(tRi - .3, 'thread'); ev(tBu - .3, 'thread'); ev(tWhat + .4, 'thread'); ev(tWhat + 1.6, 'hit');
}
function escapeDrawing(ctx, x, y, t0, k) {
  const p = tw(t0, 1.0, E.lin); if (p <= 0) return; ctx.save(); ctx.translate(x, y); ctx.strokeStyle = '#3a281c'; ctx.lineWidth = 5; ctx.lineCap = 'round';
  const seg = [[[-120, -160], [120, -160]], [[120, -160], [120, 160]], [[120, 160], [-120, 160]], [[-120, 160], [-120, -160]]];
  for (let i = 0; i < 4 && i < p * 6; i++) { ctx.beginPath(); ctx.moveTo(...seg[i][0]); ctx.lineTo(...seg[i][1]); ctx.stroke(); }
  if (p > .6) { for (let i = 0; i < 4; i++) { ctx.beginPath(); ctx.moveTo(-80 + i * 55, -160); ctx.lineTo(-80 + i * 55, k === 0 && i === 2 ? -20 : 160); ctx.stroke(); } }
  if (p > .8) { ctx.beginPath(); ctx.arc(k ? 170 : 150, k ? -60 : 40, 22, 0, 7); ctx.stroke(); ctx.beginPath(); ctx.moveTo(k ? 170 : 150, k ? -38 : 62); ctx.lineTo(k ? 200 : 170, k ? 40 : 140); ctx.moveTo(k ? 150 : 130, k ? -10 : 90); ctx.lineTo(k ? 220 : 190, k ? -30 : 70); ctx.stroke(); }
  ctx.restore();
}
module.exports = { build };
