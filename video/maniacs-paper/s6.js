// ===== Scene 6: Dahmer (darkest, night, police gels) =====
const K = require('./core'); const Pp = require('./paper'); const X = require('./sets'); const A = require('./anim'); const R = require('./engine'); const DI = require('./dioramas');
const { W, H, F, clamp, lerp, E, hr, S, tw, twos, cue, SC, ev, camera, L, hits, font } = K;
const { P, put, sheet } = Pp;
const desk = () => X.darkDesk(601, '#141c30');
const lamp = (ctx, x = W * .5, y = H * .35, k = .6) => X.lampLight(ctx, x + K.noise1(S.T * .2) * 20, y, 900, '170,190,230', k, .6);
const INK = '#e6e9f2';
function gels(ctx, k = 1) { const ph = S.T * 4.2; const red = Math.max(0, Math.sin(ph)), blue = Math.max(0, Math.sin(ph + Math.PI)); ctx.save(); ctx.globalCompositeOperation = 'screen'; let g = ctx.createRadialGradient(300, 300, 10, 300, 300, 1100); g.addColorStop(0, `rgba(235,40,50,${.35 * red * k})`); g.addColorStop(1, 'rgba(235,40,50,0)'); ctx.fillStyle = g; ctx.fillRect(0, 0, W, H); g = ctx.createRadialGradient(1600, 400, 10, 1600, 400, 1100); g.addColorStop(0, `rgba(50,100,255,${.32 * blue * k})`); g.addColorStop(1, 'rgba(50,100,255,0)'); ctx.fillStyle = g; ctx.fillRect(0, 0, W, H); ctx.restore(); }
function build() {
  const S6 = 6, c = (p, n) => cue(S6, p, n); const t0 = SC(6).t0; const GEO = require('./geo');
  const usMap = X.mapSprite('us_dahmer', 1600, 960, GEO.us, X.proj(-95, 40, 22, 800, 480), f => f.id === 'Wisconsin' ? { fill: '#3a4f7a', stroke: 'rgba(10,15,30,.6)', lift: 1 } : { fill: '#7d8597', stroke: 'rgba(10,15,30,.3)' }, { paper: '#a9adb8', age: .45, burn: .6 });
  const tThree = c('Три женщины'), t14 = c('Ему четырнадцать'), tCall = c('Они звонят');
  // A: map -> Milwaukee
  R.shot(t0 - .5, (ctx, lt, D) => {
    camera(lt, D, { z: [1.0, 2.0], x: [0, 230], y: [0, -200], ease: E.io }); X.bg(ctx, desk(), .4);
    L(ctx, 1, () => { put(ctx, usMap, W / 2, H / 2, {}); const Pj = X.proj(-95, 40, 22, W / 2, H / 2); const [x, y] = Pj(-87.9, 43.04); X.pulseDot(ctx, x, y, t0 + .4, { R: 40, s: .7 }); X.hand(ctx, 'Милуоки', x + 30, y - 50, t0 + .2, { size: 44, color: '#1d2433' }); });
    L(ctx, 0, () => X.headline(ctx, '27 МАЯ 1991', 1580, 960, t0 + 1.2, { size: 84, color: INK, bg: '#1d2b44', rot: .03 }));
    lamp(ctx, 900, 420, .5);
  }, { tr: 'dip', td: 1.0, mood: 'dark' });
  ev(t0 + 1.2, 'hit'); ev(t0, 'nightamb', { d: SC(6).t1 - t0 });
  // B: night street, three women, dark spot in light
  R.shot(tThree - .2, (ctx, lt, D) => {
    camera(lt, D, { z: [1.0, 1.12], x: [-60, 60] }); DI.nightStreet(ctx, lt, { police: 0 });
    L(ctx, .9, () => { [[560], [700], [840]].forEach(([x], i) => Pp.putPerson(ctx, 'woman', x, 1000, 380, { color: '#070a12', rim: 'rgba(255,215,160,.55)', a: tw(tThree + i * .25, .5) }));
      ctx.save(); ctx.scale(1, .28); const g = ctx.createRadialGradient(1380, 1000 / .28, 10, 1380, 1000 / .28, 150); g.addColorStop(0, 'rgba(0,0,0,.9)'); g.addColorStop(1, 'rgba(0,0,0,0)'); ctx.fillStyle = g; ctx.fillRect(1100, 3000, 600, 1000); ctx.restore(); });
    L(ctx, 0, () => { A.pop(ctx, Pp.sticky('14 лет', { w: 240, color: '#e8c070', size: 70 }), 1600, 320, t14 + .1, { rot: .06 }); X.hand(ctx, 'звонят в полицию · остаются рядом', 120, 140, tCall + .2, { size: 54, color: INK }); });
  }, { tr: 'fade', td: .7, mood: 'dark' });
  ev(tCall, 'phone', { d: 1.5 });
  // C: two police officers arrive, gels
  const tCops = c('Приезжают двое'), tMan = c('И рядом появляется'), tDah = c('Джеффри Дамер');
  R.shot(tCops - .2, (ctx, lt, D) => {
    camera(lt, D, { z: [1.05, 1.15], x: [0, -60] }); DI.nightStreet(ctx, lt, { police: tw(tCops, 1) });
    L(ctx, .9, () => { const rim = Math.sin(S.T * 4.2) > 0 ? 'rgba(255,90,90,.75)' : 'rgba(110,150,255,.75)';
      [[560], [700], [840]].forEach(([x]) => Pp.putPerson(ctx, 'woman', x, 1000, 380, { color: '#070a12', rim }));
      const ci = tw(tCops + .3, 1.2, E.out); Pp.putPerson(ctx, 'cop', lerp(2000, 1150, ci), 1000, 420, { color: '#05070d', rim, flip: true, pose: ci < 1 ? 1 + Math.floor(twos() * 6) % 3 : 0 }); Pp.putPerson(ctx, 'cop', lerp(2150, 1460, ci), 1000, 420, { color: '#05070d', rim, flip: true, pose: ci < 1 ? 1 + Math.floor(twos() * 6 + 1) % 3 : 0 });
      if (S.T > tMan) Pp.putPerson(ctx, 'coat', lerp(-200, 380, tw(tMan, 1.2)), 1000, 440, { color: '#020306', rim }); });
    gels(ctx, .5);
  }, { tr: 'slide', mood: 'dark' });
  ev(tCops, 'siren', { d: 6 }); ev(tCops + .2, 'radio', { d: 4 });
  const polD = Pp.polaroid('dahmer_school', { w: 240, dark: '#121a2e', light: '#d9deea', caption: 'школьное фото' });
  R.shot(tDah - .15, (ctx, lt, D) => {
    camera(lt, D, { z: [1.0, 1.1] }); X.bg(ctx, desk(), .4);
    L(ctx, .9, () => { put(ctx, Pp.indexCard({ w: 760, h: 460, title: 'ДЖЕФФРИ ДАМЕР', seed: 611, color: '#d9deea', tsize: 44 }), W / 2 + 120, H / 2, { rot: .02 });
      A.fly(ctx, polD, W / 2 - 160, H / 2 + 20, tDah, { d: .35, from: [-500, -300], spin: -.4, rot: -.05, out: tDah + 5.2, to: [-900, 300] }); put(ctx, Pp.pin(P.red), W / 2 - 160, H / 2 - 170, { elev: .3, a: tw(tDah + .35, .1) * (1 - tw(tDah + 5.2, .2)) });
      X.hand(ctx, 'говорит спокойно', W / 2 + 70, H / 2 + 60, tDah + 1.2, { size: 54 }); X.hand(ctx, '«это мой друг»', W / 2 + 70, H / 2 + 130, tDah + 2.2, { size: 54, color: '#7a2a20' }); });
    gels(ctx, .3); lamp(ctx, W / 2, 380);
  }, { tr: 'flash', mood: 'dark' });
  ev(tDah, 'paperslap');
  // D: 19 vs 14 key frame
  const t19 = c('ему девятнадцать'), tDrunk = c('он просто');
  const n19 = Pp.cutWord('19 ЛЕТ', 190, 101, { styles: [0, 1, 4] }), n14 = Pp.cutWord('14 ЛЕТ', 190, 103, { styles: [2, 6] });
  R.shot(t19 - .4, (ctx, lt, D) => {
    camera(lt, D, { z: [1.0, 1.08], shake: hits([t19, t19 + 1.0], 10) }); X.bg(ctx, desk(), .4);
    L(ctx, .9, () => { X.hand(ctx, 'он сказал', 520, 300, t19 - .3, { size: 60, color: INK, align: 'center' }); X.hand(ctx, 'на самом деле', 1400, 300, t19 + .7, { size: 60, color: INK, align: 'center' });
      Pp.drawCutWord(ctx, n19, 520, 560, t19, { stagger: .05 }); Pp.drawCutWord(ctx, n14, 1400, 560, t19 + 1.0, { stagger: .05 });
      X.strikeOut(ctx, 300, 740, 560, tDrunk + 1.4, { w: 30 }); X.hand(ctx, '«просто выпил, небольшой конфликт»', W / 2, 880, tDrunk, { size: 54, color: '#aeb6c8', align: 'center' }); });
    gels(ctx, .25); lamp(ctx, W / 2, 400);
  }, { tr: 'tear', td: .7, mood: 'dark' });
  ev(t19, 'hit'); ev(t19 + 1.0, 'hit'); ev(tDrunk + 1.4, 'marker');
  // E: protests
  const tProt = c('Женщины протестуют'), tChild = c('что это ребёнок'), tScared = c('Что ему страшно'), tAmb = c('Что нужно вызвать'), tListen = c('Полицейские слушают'), tBelieve = c('но верят');
  R.shot(tProt - .2, (ctx, lt, D) => {
    camera(lt, D, { z: [1.0, 1.1], x: [-40, 40] }); DI.nightStreet(ctx, lt, { police: .8 });
    L(ctx, .9, () => { [[460], [600], [740]].forEach(([x], i) => Pp.putPerson(ctx, 'woman', x, 1000, 380, { color: '#070a12', rim: 'rgba(255,215,160,.5)', pose: i === 1 ? (Math.floor(twos() * 4) % 2 ? 1 : 3) : 0 })); });
    L(ctx, 0, () => { [['«это ребёнок»', tChild, '#f2c14e'], ['«ему страшно»', tScared, '#f6a38f'], ['«вызовите скорую»', tAmb, '#e6e9f2']].forEach(([s, t, col], k) => A.fly(ctx, Pp.sticky(s, { w: 440, h: 170, color: col, size: 64 }), 1260 + (k % 2) * 120, 230 + k * 210, t, { d: .3, from: [500, 0], spin: .3, rot: (k - 1) * .05, twos: true })); });
    gels(ctx, .6);
  }, { tr: 'page', td: .8, mood: 'dark' });
  [tChild, tScared, tAmb].forEach(t => ev(t, 'paperslap'));
  R.shot(tListen - .2, (ctx, lt, D) => {
    camera(lt, D, { z: [1.0, 1.08] }); X.bg(ctx, desk(), .4);
    const tilt = E.io(tw(tBelieve, 1.2, E.lin)) * .22;
    L(ctx, .9, () => { const sc = scale(); ctx.save(); ctx.translate(W / 2, 340);
      put(ctx, Pp.cutout('scale_post', 60, 600, (x, part) => { part(X.R(20, 0, 20, 560, 6), '#8d99a6'); part(X.R(0, 560, 60, 40, 8), '#5a6680'); }), 0, 300, {});
      ctx.rotate(tilt); put(ctx, Pp.cutout('scale_beam', 1100, 30, (x, part) => part(X.R(0, 0, 1100, 30, 12), '#aeb6c8')), 0, 0, {});
      [[-520, 'три женщины', '#e6e9f2'], [520, 'взрослый мужчина', '#d1242c']].forEach(([x, s, col], i) => { ctx.save(); ctx.translate(x, 0); ctx.rotate(-tilt); ctx.strokeStyle = '#aeb6c8'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(-130, 240); ctx.moveTo(0, 0); ctx.lineTo(130, 240); ctx.stroke(); put(ctx, Pp.cutout('pan' + i, 320, 40, (cx, part) => part(new K.Path2D('M0 0 L320 0 Q290 40 160 40 Q30 40 0 0 Z'), col)), 0, 255, {}); X.hand(ctx, s, 0, 340, tListen + .4 + i * .4, { size: 52, color: INK, align: 'center' }); ctx.restore(); });
      ctx.restore(); X.headline(ctx, 'ВЕРЯТ ЕМУ', W / 2, 960, tBelieve + .6, { size: 90, color: INK, bg: '#9e2b2b' }); });
    lamp(ctx, W / 2, 360);
  }, { tr: 'slide', mood: 'dark' });
  ev(tBelieve, 'creak', { d: 1.2 }); ev(tBelieve + .6, 'hit');
  // F: door closes (no interior)
  const tBack = c('Они отводят'), tBody = c('И даже не замечают');
  R.shot(tBack - .2, (ctx, lt, D) => {
    camera(lt, D, { z: [1.0, 1.15], x: [0, 60] });
    const wall = Pp.sheet({ w: W + 600, h: H + 400, color: '#1d2742', seed: 621, tex: .65, grad: false, burn: .4 }); L(ctx, .3, () => put(ctx, wall, W / 2, H / 2, { shadow: 0 }));
    L(ctx, .7, () => { put(ctx, Pp.sheet({ w: 520, h: 840, color: '#0b0f1a', seed: 622, tex: .5 }), W / 2 + 200, 560, {}); const close = tw(tBack + 2.0, 1.2, E.in); const door = Pp.sheet({ w: 480, h: 800, color: '#4a3426', seed: 623, tex: .6 }); ctx.save(); ctx.translate(W / 2 - 40, 560); ctx.scale(lerp(.18, 1, close), 1); put(ctx, door, 240, 0, {}); ctx.restore();
      const w = tw(tBack + .1, 1.8, E.io); if (close < .9) { Pp.putPerson(ctx, 'cop', lerp(900, 1180, w), 980, 380, { color: '#05070d', rim: 'rgba(255,190,120,.4)', a: 1 - close }); Pp.putPerson(ctx, 'child', lerp(1000, 1260, w), 980, 240, { color: '#05070d', a: 1 - close }); } });
    L(ctx, 0, () => X.hand(ctx, 'в соседней комнате лежало тело. Его не заметили.', W / 2, 1000, tBody + .2, { size: 50, color: INK, align: 'center' }));
    gels(ctx, .5); lamp(ctx, W / 2, 400);
  }, { tr: 'flip', td: .8, mood: 'dark' });
  ev(tBack + 3.1, 'door');
  // G: name + silence + "+30 минут"
  const tName = c('Мальчика звали'), t30 = c('Примерно через полчаса');
  const m30 = Pp.cutWord('+30 МИНУТ', 160, 111, { styles: [2, 6, 1] });
  R.shot(tName - .3, (ctx, lt, D) => {
    camera(lt, D, { z: [1.0, 1.08], hand: S.T > t30 - 1.5 && S.T < t30 ? 0 : .6, shake: hits([t30 + .1], 18) }); X.bg(ctx, X.darkDesk(631, '#0e1322'), .4);
    L(ctx, .9, () => { const o = tw(t30 - .2, .4); put(ctx, Pp.indexCard({ w: 640, h: 300, title: 'КОНЕРАК С.', body: '14 лет', seed: 632, color: '#d9deea' }), W / 2, 420, { rot: -.01, a: 1 - o * .6 });
      Pp.drawCutWord(ctx, m30, W / 2, 760, t30 + .1, { stagger: .03, d: .12 }); });
    X.lampLight(ctx, W / 2, 420, 650, '255,200,140', .5, .65);
  }, { tr: 'dip', td: .8, mood: 'dark' });
  ev(t30 - 1.5, 'silence', { d: 1.45 }); ev(t30 + .1, 'boomlow'); R.hit(t30 + .1, 1.2);
  // H: two months later, Tracy Edwards
  const t2m = c('Через два месяца'), tTr = c('Трейси Эдвардс'), tArr = c('Дамера арестовали'), t17 = c('семнадцати'), t5 = c('Пять из них');
  R.shot(t2m - .2, (ctx, lt, D) => {
    camera(lt, D, { z: [1.0, 1.08], x: [-50, 50] }); X.bg(ctx, desk(), .4);
    L(ctx, .9, () => X.timelineTape(ctx, [{ x: 520, label: '27.05.1991', sub: 'полиция ушла' }, { x: 1400, label: '22.07.1991', sub: 'Трейси Эдвардс вырвался', red: 1 }], 520, [t2m - .1, t2m + .9], { x0: 320, x1: W - 320, subColor: INK }));
    L(ctx, 0, () => X.hand(ctx, 'и привёл полицию', 1400, 820, tTr + 1.3, { size: 60, color: INK, align: 'center' }));
    lamp(ctx, W / 2, 400);
  }, { tr: 'slide', mood: 'dark' });
  ev(t2m - .1, 'pin'); ev(t2m + .9, 'pin');
  R.shot(tArr - .2, (ctx, lt, D) => {
    camera(lt, D, { z: [1.0, 1.1] }); X.bg(ctx, desk(), .4);
    L(ctx, .9, () => { X.hand(ctx, 'Дамера арестовали', 420, 200, tArr + .2, { size: 60, color: INK, align: 'center' }); X.counter(ctx, 17, 420, 440, t17 - .1, { size: 280, d: 1.2, color: '#1d2433', bg: '#d9deea' }); X.hand(ctx, 'признался', 420, 680, t17 + .4, { size: 60, color: INK, align: 'center' });
      for (let i = 0; i < 17; i++) { const tt = t17 + i * .07; const q = E.back(clamp((twos() - tt) / .25)); if (q <= 0) continue; const red = i >= 12 && S.T > t5 + .3; put(ctx, token(red), 880 + (i % 6) * 160, 300 + Math.floor(i / 6) * 180, { s: q, rot: (hr(i) - .5) * .2 }); }
      X.hand(ctx, 'пять — после предупреждений соседки', 1290, 880, t5 + .5, { size: 54, color: '#f6a38f', align: 'center' }); });
    lamp(ctx, 1000, 400);
  }, { tr: 'page', td: .8, mood: 'dark' });
  ev(t17 - .1, 'tick', { d: 1.2 }); ev(t5 + .3, 'hit');
  // I: officers fired; city question; folders slide together and warm
  const tFired = c('Двоих полицейских'), tCity = c('Но город'), tAfter = c('После этого дела');
  R.shot(tFired - .2, (ctx, lt, D) => {
    camera(lt, D, { z: [1.0, 1.1], r: [.01, -.01] }); X.bg(ctx, desk(), .4);
    const warm = tw(tAfter, 3, E.io);
    L(ctx, .9, () => { put(ctx, Pp.cutout('plate_fired', 900, 220, (x, part) => { part(X.R(0, 0, 900, 220, 10), '#d9deea'); font(x, F.osw, 80, '700'); x.fillStyle = '#1d2433'; x.textAlign = 'center'; x.fillText('ПОЛИЦЕЙСКИЕ УВОЛЕНЫ', 450, 140); }), W / 2, 260 + (1 - tw(tFired + .2, .4, E.back)) * -400, { rot: -.02 });
      X.hand(ctx, 'поступили бы они так,', W / 2, 520, tCity + 1.2, { size: 58, color: INK, align: 'center' }); X.hand(ctx, 'если бы на улице был другой ребёнок?', W / 2, 590, tCity + 2.4, { size: 58, color: INK, align: 'center' });
      ['ВОКЗАЛ', 'НЕ ХВАТЯТСЯ', 'ДОВЕРИЕ', 'НЕ ПОВЕРЯТ'].forEach((n, i) => { const x0 = 300 + i * 440, x1 = W / 2 + (i - 1.5) * 120; put(ctx, Pp.folder({ w: 300, h: 380, label: '' }), lerp(x0, x1, warm), 860 - warm * 40, { rot: (i - 1.5) * .05 * (1 - warm), a: tw(tAfter - .5, .5) }); }); });
    if (warm > 0) { ctx.save(); ctx.globalCompositeOperation = 'soft-light'; ctx.fillStyle = `rgba(255,190,110,${.5 * warm})`; ctx.fillRect(0, 0, W, H); ctx.restore(); }
    lamp(ctx, W / 2, 400);
  }, { tr: 'stamp', stampText: 'УВОЛЕНЫ', td: .7, mood: 'dark' });
  ev(tFired + .2, 'paperslap'); ev(tAfter - .5, 'drop');
}
function scale() { return null; }
function token(red) { return Pp.cutout('tok' + red, 110, 150, (x, part) => { part(X.R(0, 0, 110, 150, 8), red ? '#d1242c' : '#d9deea'); const p = new K.Path2D(); p.ellipse(55, 48, 18, 21, 0, 0, 7); part(p, red ? '#5a0f12' : '#2c3e5c'); part(new K.Path2D('M22 138 Q24 86 55 80 Q86 86 88 138 Z'), red ? '#5a0f12' : '#2c3e5c'); }); }
module.exports = { build };
