// ===== Scene 2: rule of invisibility (bright) =====
const K = require('./core'); const Pp = require('./paper'); const X = require('./sets'); const A = require('./anim'); const R = require('./engine');
const { W, H, F, clamp, lerp, E, hr, S, tw, twos, cue, SC, ev, camera, L, hits, font } = K;
const { P, put, sheet } = Pp;
const SCR = [P.yellow, P.coral, P.teal, P.cream, P.white];
function build() {
  const S2 = 2, c = (p, n) => cue(S2, p, n);
  const bgA = X.collageBg(201, [P.cream, P.teal, P.yellow, P.coral, '#9fd3c7']);
  const t0 = SC(2).t0, tType = c('Есть тип'), tBl = c('блондинки'), tSt = c('студентки'), tCh = c('дети'), tVt = c('вторичен');
  const tipSt = Pp.stamp('ТИПАЖ', { size: 150 });
  // A: card catalogue
  R.shot(t0 - .05, (ctx, lt, D) => {
    camera(lt, D, { z: [1.0, 1.1], x: [-40, 30], shake: hits([tType + .2], 12) }); X.bg(ctx, bgA, .45); X.lightDrift(ctx, 1);
    L(ctx, .85, () => {
      const out = E.out(tw(t0 + .1, .8));
      [[tBl, 'БЛОНДИНКИ', 'woman', P.yellow], [tSt, 'СТУДЕНТКИ', 'woman', P.coral], [tCh, 'ДЕТИ', 'child', P.teal2]].forEach(([t, lab, kind, col], i) => {
        const cardS = Pp.cutout('cat' + i, 420, 470, (x, part) => { part(X.R(0, 0, 420, 470, 6), '#f6f1e4'); part(X.R(26, 26, 368, 300, 4), col); x.save(); x.translate(210, 330); const sc = kind === 'child' ? 2.0 : 2.6; x.scale(sc, sc); x.fillStyle = '#1d2433'; x.fill(Pp.personPath(kind, 0)); x.restore(); font(x, F.osw, 54, '700'); x.fillStyle = '#1d2433'; x.textAlign = 'center'; x.fillText(lab, 210, 420); }, { border: 0 });
        const q = E.back(clamp((twos() - t + .1) / .4)); if (q <= 0) return;
        put(ctx, cardS, 470 + i * 490, 640 - q * 250, { rot: (i - 1) * .05, elev: (1 - q) * .5 });
      });
      put(ctx, X.prop('drawer'), W / 2, 960 + (1 - out) * 200, { s: 1.6 });
      Pp.stampHit(ctx, tipSt, W / 2, 190, tType + .2, { rot: -.05 });
      X.strikeOut(ctx, W / 2 - 260, W / 2 + 260, 190, tVt - .3, { w: 26 });
      X.hand(ctx, 'вторичен!', W / 2 + 330, 290, tVt + .1, { size: 80, color: '#c4161c' });
    });
    X.scraps(ctx, SCR, 10, 11);
  }, { tr: 'zoom', td: .9, mood: 'bright' });
  ev(t0 + .1, 'drawer'); [tBl, tSt, tCh].forEach(t => ev(t - .1, 'card')); ev(tType + .2, 'stampbig'); ev(tVt - .3, 'marker');
  // B: typewriter sheet 1
  const tPrim = c('Первичны'), tQ1 = c('Первый'), tQ2 = c('Второй');
  const q1 = 'МОГУ ЛИ Я ДОБРАТЬСЯ', q1b = 'ДО НЕГО НЕЗАМЕТНО?';
  R.shot(tPrim - .2, (ctx, lt, D) => {
    camera(lt, D, { z: [1.0, 1.12], y: [20, -30], shake: hits([tQ1 + .25], 7) }); X.bg(ctx, X.collageBg(203, [P.cream, P.yellow, P.coral, '#f6d9a0']), .45); X.lightDrift(ctx, 1);
    L(ctx, .85, () => {
      put(ctx, sheet({ w: 1100, h: 760, color: '#fbf8f1', seed: 204, tex: .4, fold: 1 }), W / 2, 470, { rot: -.01 });
      ctx.save(); ctx.translate(W / 2, 470); ctx.rotate(-.01);
      X.hand(ctx, 'два вопроса убийцы', -450, -250, tPrim + .2, { size: 74, color: '#c4161c' });
      font(ctx, F.osw, 150, '700'); ctx.fillStyle = 'rgba(42,157,143,.9)'; ctx.fillText('1', -480, -40 + 60);
      X.typed(ctx, q1, -330, -40, tQ1 + .25, { size: 66, cps: 22 }); X.typed(ctx, q1b, -330, 50, tQ1 + .25 + q1.length / 22, { size: 66, cps: 22 });
      ctx.restore();
      typewriter(ctx, W / 2, 980);
    });
    X.scraps(ctx, SCR, 8, 12);
  }, { tr: 'page', td: .8, mood: 'bright' });
  X.typedEv(tQ1 + .25, q1 + q1b, 22); ev(tQ1 + .25, 'hit');
  // C: sheet 2 (plane transition carries sheet 1 away)
  const q2 = 'КАК БЫСТРО ЕГО ХВАТЯТСЯ?', q2b = 'И НАСКОЛЬКО ВСЕРЬЁЗ?';
  R.shot(tQ2 - .3, (ctx, lt, D) => {
    camera(lt, D, { z: [1.06, 1.0], x: [30, -20], shake: hits([tQ2 + .3], 7) }); X.bg(ctx, X.collageBg(205, [P.cream, P.teal, '#9fd3c7', P.coral]), .45); X.lightDrift(ctx, 1);
    L(ctx, .85, () => {
      put(ctx, sheet({ w: 1100, h: 760, color: '#fbf8f1', seed: 206, tex: .4, lines: 'ruled' }), W / 2, 470, { rot: .012 });
      ctx.save(); ctx.translate(W / 2, 470); ctx.rotate(.012);
      font(ctx, F.osw, 150, '700'); ctx.fillStyle = 'rgba(238,108,90,.95)'; ctx.fillText('2', -480, 20);
      X.typed(ctx, q2, -330, -40, tQ2 + .3, { size: 62, cps: 24 }); X.typed(ctx, q2b, -330, 60, tQ2 + 2.6, { size: 62, cps: 24 });
      X.underline(ctx, -330, 360, -30, tQ2 + 1.6, {});
      ctx.restore();
      typewriter(ctx, W / 2, 980);
    });
    X.scraps(ctx, SCR, 8, 13);
  }, { tr: 'plane', td: .9, mood: 'bright' });
  X.typedEv(tQ2 + .3, q2, 24); X.typedEv(tQ2 + 2.6, q2b, 24); ev(tQ2 + .3, 'hit');
  // D: term -> rule (crumple)
  const tSpec = c('Специалисты'), tRule = c('правило невидимости');
  R.shot(tSpec - .2, (ctx, lt, D) => {
    camera(lt, D, { z: [1.1, 1.0], r: [-.015, .005] }); X.bg(ctx, X.collageBg(207, [P.cream, P.yellow, P.teal, P.coral]), .45); X.lightDrift(ctx, 1);
    L(ctx, .85, () => {
      put(ctx, Pp.indexCard({ w: 760, h: 420, title: 'ТЕРМИН', body: '', seed: 208 }), 560, 420, { rot: -.04 });
      X.hand(ctx, '«доступность жертвы»', 230, 520, tSpec + .4, { size: 74 });
      const st = Pp.sticky('проще:\nПРАВИЛО\nНЕВИДИМОСТИ', { w: 520, color: P.coral, size: 92, ink: '#fbf8f1' });
      A.fly(ctx, st, 1340, 560, tRule - .5, { d: .45, from: [500, 400], spin: -.6, rot: .05, twos: true });
      X.circleMark(ctx, 1340, 590, 300, 230, tRule + .5, { color: 'rgba(29,36,51,.8)', w: 8 });
    });
    X.scraps(ctx, SCR, 8, 14);
  }, { tr: 'crumple', td: .9, mood: 'bright' });
  ev(tRule - .5, 'paperslap'); ev(tRule + .5, 'marker');
  // E: crowd, one in light; others fade grey; light goes out
  const tLess = c('Чем меньше'), tWeak = c('И не потому'), tNoone = c('А потому что никто');
  const COLS = [P.teal, P.coral, P.yellow, '#9fd3c7', '#f6a38f', P.sky];
  R.shot(tLess - .2, (ctx, lt, D) => {
    camera(lt, D, { z: [1.0, 1.18], y: [0, -40] }); X.bg(ctx, X.collageBg(209, [P.cream, '#f3dfb4', '#cde8e4']), .4);
    const fade = tw(tLess + .8, 4.5, E.io), off = tw(tNoone + .5, .25, E.lin);
    L(ctx, .8, () => {
      for (let i = 0; i < 22; i++) { const ang = i / 22 * Math.PI * 2, rr = 560 + hr(i) * 100; const x = W / 2 + Math.cos(ang) * rr * 1.25, y = 760 + Math.sin(ang) * rr * .3; const gray = fade > hr(i * 3) * .9;
        Pp.putPerson(ctx, i % 3 ? 'coat' : 'woman', x, y, 230 + Math.sin(ang) * 40, { color: gray ? '#a9a49a' : COLS[i % COLS.length], border: 5, a: gray ? .75 : 1 }); }
      // swinging lamp
      const sw = Math.sin(S.T * 1.6) * .12; ctx.save(); ctx.translate(W / 2, -40); ctx.rotate(sw); ctx.strokeStyle = '#2b2b2b'; ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(0, 250); ctx.stroke();
      put(ctx, lampShade(), 0, 300, {}); if (off < 1) X.vellumCone(ctx, 0, 330, 150, 620, 520, .3 * (1 - off), '255,235,180'); ctx.restore();
      if (off < 1) { ctx.save(); ctx.globalCompositeOperation = 'screen'; ctx.scale(1, .25); const g = ctx.createRadialGradient(W / 2 + sw * -600, 790 / .25, 10, W / 2 + sw * -600, 790 / .25, 330); g.addColorStop(0, `rgba(255,235,170,${.55 * (1 - off)})`); g.addColorStop(1, 'rgba(255,235,170,0)'); ctx.fillStyle = g; ctx.fillRect(0, 0, W, 4000); ctx.restore(); }
      Pp.putPerson(ctx, 'woman', W / 2, 800, 300, { color: off > .5 ? '#a9a49a' : P.red, border: 6 });
    });
    if (off > 0) { ctx.fillStyle = `rgba(30,30,40,${off * .35})`; ctx.fillRect(0, 0, W, H); }
    L(ctx, 1, () => X.headline(ctx, 'НИКТО НЕ БУДЕТ ИСКАТЬ', W / 2, 150, tNoone + .6, { size: 80, color: P.white, bg: P.ink, rot: -.015 }));
    X.scraps(ctx, SCR, 6, 15);
  }, { tr: 'slide', mood: 'bright' });
  ev(tNoone + .5, 'lampclick'); ev(tLess, 'fadeTone', { d: 5 });
  // F: big title + folders; accordion into scene 3
  const tTheory = c('Звучит как теория'), tCheck = c('Давайте проверим'), tStart = c('Начнём с самого');
  const title = [Pp.cutWord('ПРАВИЛО', 170, 31, { styles: [0, 1, 2, 3, 6] }), Pp.cutWord('НЕВИДИМОСТИ', 150, 37, { styles: [0, 1, 2, 3, 5, 6] })];
  R.shot(tTheory - .25, (ctx, lt, D) => {
    camera(lt, D, { z: [1.12, 1.0], shake: hits([tTheory + .3], 18) });
    const flashK = Math.floor(twos() * 6) % 3; const fl = tw(tTheory + .3, .01) * (1 - tw(tTheory + 1.4, .3));
    X.bg(ctx, X.collageBg(211 + (fl > 0 ? flashK : 0), [P.cream, P.coral, P.yellow, P.teal, P.red]), .5); X.lightDrift(ctx, 1);
    L(ctx, .9, () => {
      const up = tw(tCheck, .6, E.io);
      Pp.drawCutWord(ctx, title[0], W / 2, 390 - up * 160, tTheory + .25, { stagger: .03, s: 1 - up * .45 });
      Pp.drawCutWord(ctx, title[1], W / 2, 600 - up * 280, tTheory + .45, { stagger: .03, s: 1 - up * .45 });
      ['ЧИКАТИЛО', 'РИДЖУЭЙ', 'БАНДИ', 'ДАМЕР'].forEach((n, i) => A.fly(ctx, Pp.folder({ w: 330, h: 420, label: n.toLowerCase() }), 330 + i * 420, 720, tCheck + .2 + i * .18, { d: .45, from: [0, 700], spin: (i - 1.5) * .3, rot: (i - 1.5) * .04, twos: true }));
      const hl = tw(tStart, .5); if (hl > 0) X.circleMark(ctx, 330, 740, 230, 300, tStart, { color: 'rgba(209,36,44,.85)', w: 10 });
    });
    X.scraps(ctx, SCR, 14, 16, { speed: 1.6 });
  }, { tr: 'stamp', stampText: 'ПРАВИЛО', td: .7, mood: 'bright' });
  ev(tTheory + .3, 'boom'); R.hit(tTheory + .3, 1.2); [0, 1, 2, 3].forEach(i => ev(tCheck + .2 + i * .18, 'drop')); ev(tStart, 'marker');
}
function lampShade() { return Pp.cutout('lshade', 260, 130, (x, part) => { part(new K.Path2D('M60 0 L200 0 L260 120 L0 120 Z'), '#1d2433'); part(new K.Path2D('M70 8 L190 8 L240 112 L20 112 Z'), '#2a9d8f', { shadow: false }); const p = new K.Path2D(); p.ellipse(130, 120, 120, 12, 0, 0, 7); part(p, '#fff1c4', { shadow: false }); }); }
function typewriter(ctx, x, y) {
  const tw2 = Pp.cutout('typewriter', 1100, 300, (c, part) => { part(X.R(80, 40, 940, 260, 40), '#2a9d8f'); part(X.R(0, 20, 1100, 60, 30), '#1d2433'); part(X.R(120, 110, 860, 160, 20), '#1f7a6f');
    for (let r = 0; r < 3; r++) for (let k = 0; k < 11; k++) { const p = new K.Path2D(); p.ellipse(190 + k * 72 + r * 18, 140 + r * 46, 22, 19, 0, 0, 7); part(p, '#f4efe3', { sb: 3, sx: 1, sy: 2 }); } part(X.R(330, 250, 440, 24, 12), '#f4efe3'); });
  put(ctx, tw2, x + (Math.floor(S.T * 22) % 2) * 1.5, y, {});
}
module.exports = { build, typewriter };
