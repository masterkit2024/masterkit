// ===== Scene 7: conclusion & protection (bright warm) =====
const K = require('./core'); const Pp = require('./paper'); const X = require('./sets'); const A = require('./anim'); const R = require('./engine');
const { W, H, F, clamp, lerp, E, hr, S, tw, twos, cue, SC, ev, camera, L, hits, font } = K;
const { P, put, sheet } = Pp;
const WARM = [P.cream, '#f6d9a0', P.yellow, P.teal, '#9fd3c7', P.coral];
const SCR = [P.yellow, P.coral, P.teal, P.cream, P.white];
function tearPaper(ctx, w, cx, y0, y1, seed) { // jagged dark gap
  const r = K.mulberry(seed); const p = new K.Path2D(); const n = 26; p.moveTo(cx - w * .5, y0);
  for (let i = 0; i <= n; i++) p.lineTo(cx - w * .5 + (r() - .5) * 26 + Math.sin(i * 1.3) * 10, y0 + (y1 - y0) * i / n);
  for (let i = n; i >= 0; i--) p.lineTo(cx + w * .5 + (r() - .5) * 26 + Math.sin(i * 1.1 + 2) * 10, y0 + (y1 - y0) * i / n);
  p.closePath(); ctx.save(); ctx.fillStyle = '#2b2118'; ctx.fill(p); ctx.strokeStyle = '#fbf8f1'; ctx.lineWidth = 6; ctx.stroke(p); ctx.restore();
}
function build() {
  const S7 = 7, c = (p, n) => cue(S7, p, n); const t0 = SC(7).t0;
  const deskW = X.collageBg(701, WARM);
  const tCh = c('Чикатило вокзалы'), tRi = c('Риджуэй женщины'), tBu = c('Банди те'), tDa = c('Дамер тот'), t4 = c('Четыре человека'), tGap = c('был разрыв');
  const words = [['ВОКЗАЛ', tCh, P.yellow], ['НЕ ХВАТЯТСЯ', tRi, '#9fd3c7'], ['ДОВЕРИЕ', tBu, '#f6a38f'], ['НЕ ПОВЕРЯТ', tDa, P.teal2]];
  const gapW = Pp.cutWord('РАЗРЫВ', 190, 121, { styles: [2, 0, 6, 1] });
  R.shot(t0 - .4, (ctx, lt, D) => {
    camera(lt, D, { z: [1.0, 1.12], y: [0, -20], shake: hits([tGap + .2], 14) }); X.bg(ctx, deskW, .45); X.lightDrift(ctx, 1.2);
    const knot = tw(t4 + 1.0, 1.8, E.io);
    L(ctx, .9, () => {
      words.forEach(([w, t, col], i) => { const x0 = 300 + i * 440; const x = lerp(x0, W / 2 + (i - 1.5) * 150, knot * .6), y = lerp(460, 420, knot);
        put(ctx, Pp.folder({ w: 360, h: 460, label: '' }), x, y, { rot: (i - 1.5) * .05 * (1 - knot), s: lerp(1, .85, knot) });
        A.pop(ctx, Pp.sticky(w, { w: 300, h: 150, color: col, size: 54 }), x, y + 60, t + .1, { rot: (hr(i) - .5) * .12, s: lerp(1, .85, knot) }); });
      if (knot > 0) [0, 1, 2, 3].forEach(i => X.thread(ctx, [lerp(300 + i * 440, W / 2 + (i - 1.5) * 150, knot * .6), 240], [W / 2, 840], knot, 30));
      if (knot > .95) put(ctx, Pp.pin(P.red), W / 2, 840, { s: 1.4, elev: .4 });
      Pp.drawCutWord(ctx, gapW, W / 2, 960, tGap + .2, { stagger: .05 });
    });
    X.scraps(ctx, SCR, 10, 71);
  }, { tr: 'flip', td: .9, mood: 'bright', warm: 1 });
  words.forEach(([, t]) => ev(t + .1, 'pop')); ev(t4 + 1, 'thread'); ev(tGap + .2, 'boomwarm');
  // B: the gap between two silhouettes
  const tD1 = c('В расстоянии'), tD2 = c('во внимании'), tD3 = c('в доверии'), tD4 = c('в вере'), tEach = c('И каждый раз');
  R.shot(tD1 - .2, (ctx, lt, D) => {
    camera(lt, D, { z: [1.0, 1.1] }); X.bg(ctx, X.collageBg(703, [P.cream, '#f3dfb4', P.teal, P.yellow]), .45); X.lightDrift(ctx, 1);
    L(ctx, .85, () => { const gw = lerp(30, 200, tw(tD1, 2.5, E.io)); tearPaper(ctx, gw, W / 2, 380, 1200, 7);
      Pp.putPerson(ctx, 'woman', W / 2 - 420, 900, 420, { color: P.teal, border: 7 }); Pp.putPerson(ctx, 'coat', W / 2 + 420, 900, 430, { color: P.coral, border: 7, flip: true });
      [['расстояние', tD1], ['внимание', tD2], ['доверие', tD3], ['вера', tD4]].forEach(([s, t], i) => A.pop(ctx, Pp.sticky(s, { w: 300, h: 140, color: [P.yellow, '#9fd3c7', '#f6a38f', P.white][i], size: 56 }), 260 + i * 470, 200, t, { rot: (i - 1.5) * .05 }));
      X.hand(ctx, 'убийца находил этот разрыв раньше', W / 2, 1010, tEach + .2, { size: 54, color: '#24305e', align: 'center' }); });
    X.scraps(ctx, SCR, 8, 72);
  }, { tr: 'slide', mood: 'bright', warm: 1 });
  [tD1, tD2, tD3, tD4].forEach(t => ev(t, 'pop')); ev(tD1, 'tear');
  // C: wrong question / guilt / right question -> bridge
  const tWrong = c('Поэтому как не'), tBlame = c('Вина всегда'), tRight = c('Правильный вопрос'), tClose = c('как закрыть');
  R.shot(tWrong - .2, (ctx, lt, D) => {
    camera(lt, D, { z: [1.05, 1.0], x: [30, -30] }); X.bg(ctx, X.collageBg(705, [P.cream, P.yellow, P.coral, '#9fd3c7']), .45); X.lightDrift(ctx, 1);
    L(ctx, .9, () => { A.pop(ctx, Pp.sticky('как не стать\nжертвой?', { w: 460, color: '#e8e2cf', size: 72 }), 520, 360, tWrong + .2, { rot: -.05 }); X.strikeOut(ctx, 330, 710, 360, tWrong + 1.8, { w: 22 }); X.hand(ctx, 'неправильный вопрос', 520, 620, tWrong + 1.4, { size: 54, color: '#c4161c', align: 'center' });
      put(ctx, Pp.indexCard({ w: 760, h: 300, title: 'ВИНА', body: '', seed: 706 }), 1340, 360, { rot: .03, a: tw(tBlame, .3) }); X.hand(ctx, 'всегда только на убийце', 1000, 460, tBlame + .3, { size: 60, color: '#24305e' });
      X.headline(ctx, 'КАК ЗАКРЫТЬ РАЗРЫВ?', W / 2, 860, tClose, { size: 110, color: P.white, bg: P.teal, rot: -.015 }); });
    X.scraps(ctx, SCR, 9, 73);
  }, { tr: 'page', td: .8, mood: 'bright', warm: 1 });
  ev(tWrong + .2, 'pop'); ev(tWrong + 1.8, 'marker'); ev(tClose, 'hit');
  const tThree = c('Три вещи');
  R.shot(tThree - .3, (ctx, lt, D) => {
    camera(lt, D, { z: [1.0, 1.1] }); X.bg(ctx, X.collageBg(707, [P.cream, '#f3dfb4', P.yellow, P.teal]), .45); X.lightDrift(ctx, 1.2);
    L(ctx, .85, () => { const b = tw(tThree + .2, 2.4, E.lin); tearPaper(ctx, 200, W / 2, 380, 1200, 7);
      Pp.putPerson(ctx, 'woman', W / 2 - 420, 900, 420, { color: P.teal, border: 7 }); Pp.putPerson(ctx, 'coat', W / 2 + 420, 900, 430, { color: P.coral, border: 7, flip: true });
      for (let i = 0; i < 9; i++) { const q = clamp(b * 9 - i); if (q <= 0) continue; put(ctx, Pp.sheet({ w: 50, h: 150, color: [P.yellow, P.coral, P.teal][i % 3], seed: 708 + i, tex: .5 }), W / 2 - 200 + i * 50, 905 - (1 - E.back(q)) * 120, { rot: (hr(i) - .5) * .08, elev: (1 - q) * .8 }); }
      X.headline(ctx, '3 ВЕЩИ, КОТОРЫЕ ЗАКРЫВАЮТ РАЗРЫВ', W / 2, 200, tThree + .3, { size: 70, color: P.ink, bg: P.yellow, rot: -.01 }); });
    X.scraps(ctx, SCR, 9, 74);
  }, { tr: 'tear', td: .7, mood: 'bright', warm: 1 });
  ev(tThree + .2, 'build', { d: 2.4 });
  // D: advice cards
  const tF1 = c('Первое'), tF2 = c('Второе'), tF3 = c('Третье'), tTwo = c('Две женщины'), tCall = c('Лишний звонок');
  const cards = [
    ['car', 'ПОМОГАЙТЕ БЕЗ ПЕРЕМЕЩЕНИЯ', 'не садитесь в машину,\nне идите в подъезд —\nпозвоните сами, позовите людей', P.yellow, tF1],
    ['geoClock', 'ПУСТЬ КТО-ТО ЗНАЕТ', 'куда идёте, с кем\nи во сколько вернётесь.\nОсобенно — дети', '#9fd3c7', tF2],
    ['phoneMsg', 'ТРЕВОЖНО? СКАЖИТЕ', 'даже если кажется,\nчто ошибаетесь.\nЗвонок лучше молчания', '#f6a38f', tF3]];
  const adviceCard = (k) => Pp.cutout('adv' + k, 560, 760, (x, part) => { const [ic, title, body, col] = cards[k]; part(X.R(0, 0, 560, 760, 20), '#fbf8f1'); part(X.R(18, 18, 524, 360, 14), col); font(x, F.osw, 120, '700'); x.fillStyle = 'rgba(29,36,51,.85)'; x.fillText(String(k + 1), 40, 130);
    font(x, F.osw, 46, '700'); x.fillStyle = '#1d2433'; x.textAlign = 'center'; const tl = title.length > 18 ? [title.split(' ').slice(0, 2).join(' '), title.split(' ').slice(2).join(' ')] : [title]; tl.forEach((l, i) => x.fillText(l, 280, 450 + i * 54)); font(x, F.hand, 44, '700'); x.fillStyle = '#24305e'; body.split('\n').forEach((l, i) => x.fillText(l, 280, 570 + i * 50)); });
  [[tF1, 0], [tF2, 1], [tF3, 2]].forEach(([t, k]) => {
    R.shot(t - .25, (ctx, lt, D) => {
      camera(lt, D, { z: [1.0, 1.08], x: [-30, 30] }); X.bg(ctx, X.collageBg(711 + k, WARM), .45); X.lightDrift(ctx, 1.3);
      if (k === 2) L(ctx, .5, () => { for (let i = 0; i < 6; i++) { const lit = tw(tF3 + 1 + i * .5, .3); put(ctx, X.prop('house', lit > .5 ? 1 : 0), 150 + i * 330, 860, { s: .55 }); if (lit > 0) X.vellumCone(ctx, 150 + i * 330 - 100, 800, 30, 200, 200, .12 * lit, '255,220,150'); } });
      L(ctx, .9, () => { for (let j = 0; j < k; j++) put(ctx, adviceCard(j), 300 + j * 140, 560 + j * 10, { rot: -.08 + j * .03, s: .55 });
        A.fly(ctx, adviceCard(k), W / 2 + 120, 540, t - .1, { d: .45, from: [900, 400], spin: .4, rot: .02, twos: true });
        A.fly(ctx, X.prop(cards[k][0], k === 0 ? 1 : undefined), W / 2 + 120, 350, t + .2, { d: .4, from: [0, -700], spin: .3, s: k === 0 ? .62 : .8, rot: -.03, twos: true });
        if (k === 2 && S.T > tTwo) { X.hand(ctx, 'имя Банди назвали ещё в 1974-м', W / 2 + 120, 990, tTwo + .2, { size: 50, color: '#24305e', align: 'center' }); } });
      X.scraps(ctx, SCR, 8, 75 + k);
      if (k === 2) { const dk = tw(SC(7).t1 - 1.6, 1.4, E.in); if (dk > 0) { ctx.fillStyle = `rgba(0,0,0,${dk})`; ctx.fillRect(0, 0, W, H); } }
    }, { tr: ['slide', 'page', 'flip'][k] === 'flip' ? 'plane' : ['slide', 'page', 'flip'][k], td: .8, mood: 'bright', warm: 1 });
    ev(t - .1, 'card');
  });
  ev(tF3 + 1, 'windows', { d: 3 }); ev(SC(7).t1 - 1.6, 'silence', { d: 1.6 + (SC(8).t0 - SC(7).t1) + .2 });
}
module.exports = { build };
