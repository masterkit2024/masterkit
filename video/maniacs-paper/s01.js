// ===== Disclaimer + Scene 1 (hook) =====
const K = require('./core'); const Pp = require('./paper'); const X = require('./sets'); const A = require('./anim'); const R = require('./engine');
const { W, H, F, clamp, lerp, E, hr, S, tw, twos, cue, SC, ev, camera, L, hits, font } = K;
const { P, put, sheet } = Pp;
const BR = [P.cream, P.yellow, P.coral, P.teal, '#f6d9a0', P.kraft];
const SCR = [P.yellow, P.coral, P.teal, P.cream, P.white];

function build() {
  // ---------------- DISCLAIMER 0..7 ----------------
  const DISC = 'Ролик носит информационный и образовательный характер. В нём рассказано о реальных исторических событиях по открытым источникам. Автор осуждает насилие и никого не призывает к подобным действиям. Сцены насилия не показываются.';
  const card = sheet({ w: 1500, h: 760, color: '#f7f2e6', seed: 3, tex: .45, age: .12 });
  const kraft = X.collageBg(41, ['#c9a274', '#b98d5c', '#d8b78a', '#a87d4d', '#e2c79d']);
  const warn = Pp.stamp('ВНИМАНИЕ', { size: 120, color: '#c4161c' });
  ev(.12, 'paper'); ev(.32, 'stampbig'); ev(.36, 'pad', { d: 6.4 });
  R.shot(0, (ctx, lt, D) => {
    camera(lt, D, { z: [1.04, 1.1], x: [-10, 10], shake: hits([.32], 16) });
    X.bg(ctx, kraft, .4); X.lightDrift(ctx, 1.2);
    L(ctx, .85, () => {
      A.fly(ctx, card, W / 2, H / 2 + 20, -.05, { d: .4, from: [0, 120], spin: .04, rot: -.008, lift: .6, bounce: false });
      put(ctx, Pp.tape(190, 50, 2), W / 2 - 640, H / 2 - 350, { rot: -.6 }); put(ctx, Pp.tape(190, 50, 5), W / 2 + 640, H / 2 - 350, { rot: .6 });
      Pp.stampHit(ctx, warn, W / 2, H / 2 - 230, .32, { rot: -.03 });
      // body text, line by line
      ctx.save(); font(ctx, F.mono, 46, '700'); const lines = wrap(ctx, DISC, 1300);
      lines.forEach((l, i) => { const q = tw(.38 + i * .04, .22, E.out); if (q <= 0) return; ctx.globalAlpha = q; ctx.fillStyle = '#17181d'; ctx.textAlign = 'center'; ctx.fillText(l, W / 2, H / 2 - 95 + i * 64 + (1 - q) * 12); });
      ctx.restore();
    });
  }, { mood: 'bright' });

  // ---------------- SCENE 1 ----------------
  const S1 = 1, c = (p, n) => cue(S1, p, n);
  const desk = X.collageBg(7, BR);
  const tB = c('Тед Банди'), tC = c('Андрей Чикатило'), tD = c('Джеффри Дамер'), t3 = c('Три убийцы'), tDiff = c('выбирали совершенно'), tRule = c('одно общее правило');
  const polB = Pp.polaroid('bundy_1978', { w: 330, dark: '#2b1d16', light: '#f4e6c8', half: .3, caption: 'Банди' });
  const polC = Pp.polaroid('chikatilo_portrait', { w: 400, dark: '#1d2b44', light: '#eef0ea', half: .35, caption: 'Чикатило', crop: [150, 0, 1000, 900] });
  const polD = Pp.polaroid('dahmer_school', { w: 250, dark: '#20262e', light: '#f2ead6', caption: 'Дамер' });
  const POS = [[430, 470, -.07, polB, tB], [960, 430, .03, polC, tC], [1480, 470, .08, polD, tD]];
  const names = [Pp.cutWord('БАНДИ', 92, 3), Pp.cutWord('ЧИКАТИЛО', 80, 5), Pp.cutWord('ДАМЕР', 92, 8)];
  [tB, tC, tD].forEach(t => { ev(t, 'hit'); ev(t + .05, 'paper'); R.hit(t, .6); });
  // A: names
  R.shot(SC(1).t0 - .2, (ctx, lt, D) => {
    camera(lt, D, { z: [1.0, 1.08], x: [-30, 20], shake: hits([tB, tC, tD], 12) });
    X.bg(ctx, desk, .45); X.lightDrift(ctx, 1);
    L(ctx, .9, () => POS.forEach(([x, y, r, pol, t], i) => {
      A.fly(ctx, pol, x, y, t - .05, { d: .32, from: [(i - 1) * 300, -900], spin: (i - 1) * .6 + .3, rot: r, lift: 1.6, ease: E.out5 });
      A.pop(ctx, Pp.pin(), x, y - pol.h / 2 + 10, t + .3, { elev: .3 });
      Pp.drawCutWord(ctx, names[i], x, y + pol.h / 2 + 90, t + .12, { stagger: .035, s: 1 });
    }));
    X.scraps(ctx, SCR, 10, 1);
  }, { tr: 'tear', td: .7, mood: 'bright' });
  // B: three photos pinned, red thread, rule note
  R.shot(t3 - .1, (ctx, lt, D) => {
    camera(lt, D, { z: [1.12, 1.0], x: [50, -20], r: [.01, -.004] });
    X.bg(ctx, desk, .45); X.lightDrift(ctx, 1);
    L(ctx, .9, () => {
      POS.forEach(([x, y, r, pol], i) => { put(ctx, pol, x, y - 30, { rot: r }); put(ctx, Pp.pin(), x, y - 30 - pol.h / 2 + 10, { elev: .3 }); });
      const pr = tw(tDiff - .2, 1.6, E.io);
      X.thread(ctx, [430, 470 - 30 - polB.h / 2 + 4], [960, 430 - 30 - polC.h / 2 + 4], clamp(pr * 2), 70); X.thread(ctx, [960, 430 - 30 - polC.h / 2 + 4], [1480, 470 - 30 - polD.h / 2 + 4], clamp(pr * 2 - 1), 70);
      const sn = Pp.sticky('одно\nобщее правило?', { w: 360, color: P.yellow, size: 66 });
      A.fly(ctx, sn, 960, 900, tRule - .1, { d: .4, from: [400, 500], spin: -.4, rot: -.04, twos: true });
      X.underline(ctx, 820, 1100, 930, tRule + .7, { color: 'rgba(209,36,44,.6)', w: 8 });
    });
    X.scraps(ctx, SCR, 10, 2);
  }, { tr: 'flash', mood: 'bright' });
  ev(tDiff - .2, 'thread'); ev(tRule - .1, 'paperslap');
  // C: stickies crossed, swept, question mark
  const tN1 = c('Не внешность'), tN2 = c('Не возраст'), tN3 = c('Не характер'), tQ = c('Что-то другое');
  const st = [['внешность', P.yellow, tN1, 520, 420, -.06], ['возраст', P.teal2, tN2, 960, 560, .05], ['характер', P.coral, tN3, 1400, 420, -.03]];
  R.shot(tN1 - .35, (ctx, lt, D) => {
    camera(lt, D, { z: [1.0, 1.1], x: [-40, 40], shake: hits([tQ + .35], 14) });
    X.bg(ctx, desk, .45); X.lightDrift(ctx, .9);
    L(ctx, .9, () => {
      st.forEach(([s, col, t, x, y, r], i) => {
        const [dx, dy, rr, q] = A.sweep(0, tQ, 1500 + i * 200, -300 + i * 150);
        const spr = Pp.sticky(s.toUpperCase(), { w: 380, color: col, size: 78 });
        if (q < 1) { A.pop(ctx, spr, x + dx, y + dy, t - .05, { rot: r + rr, s: 1 }); const pp = tw(t + .35, .01); if (pp > 0) X.strikeOut(ctx, x - 150 + dx, x + 150 + dx, y + dy, t + .4, { w: 16 }); }
      });
      A.fly(ctx, X.prop('questionMark'), W / 2, H / 2 + 20, tQ + .2, { d: .4, from: [0, -900], spin: .5, lift: 1.8 });
    });
    X.scraps(ctx, SCR, 12, 4);
  }, { tr: 'slide', mood: 'bright' });
  st.forEach(([, , t]) => { ev(t - .05, 'pop'); ev(t + .4, 'marker'); }); ev(tQ, 'whoosh'); ev(tQ + .35, 'hit');
  // D: archive drawer, years unnoticed
  const tSimple = c('Настолько простое'), tYears = c('годами');
  R.shot(tSimple - .25, (ctx, lt, D) => {
    camera(lt, D, { z: [1.05, 1.18], x: [0, 60], y: [30, -20] });
    X.bg(ctx, X.collageBg(9, [P.cream, P.teal, '#9fd3c7', P.yellow, P.kraft]), .4); X.lightDrift(ctx, .8);
    L(ctx, .8, () => {
      const out = E.out(tw(tSimple + .1, .9));
      for (let i = 0; i < 9; i++) { const cardS = Pp.indexCard({ w: 520, h: 300, title: 'ДЕЛО № ' + (100 + i * 37), body: i % 3 ? '' : 'не связано', seed: 30 + i }); put(ctx, cardS, W / 2 - 30 + (i - 4) * 6, 430 - out * (i * 22) + i * 4, { rot: (hr(i) - .5) * .1, elev: i === 8 ? out * .3 : 0 }); }
      put(ctx, X.prop('drawer'), W / 2, 690 + (1 - out) * 120, {});
      X.hand(ctx, 'полиция не замечала годами', W / 2 + 120, 990, tYears - .2, { size: 70, color: '#c4161c', align: 'center' });
    });
    X.scraps(ctx, SCR, 8, 5);
  }, { tr: 'page', td: .8, mood: 'bright' });
  ev(tSimple + .1, 'drawer'); ev(tYears - .2, 'marker');
  // E: calendar flips 1978 -> 2026, "до сих пор"
  const tNow = c('И это правило');
  R.shot(tNow - .2, (ctx, lt, D) => {
    camera(lt, D, { z: [1.12, 1.0], r: [-.02, .005], shake: hits([tNow + 1.55], 10) });
    X.bg(ctx, X.collageBg(13, [P.cream, P.coral, P.yellow, '#f6d9a0', P.teal]), .45); X.lightDrift(ctx, 1);
    L(ctx, .9, () => {
      const p = clamp((twos() - tNow) / 1.5); const y = Math.round(lerp(1978, 2026, E.out(p)));
      const pad = X.prop('calendarPad', String(y));
      put(ctx, pad, W / 2 - 330, 520, { rot: -.05 });
      if (p < 1) { const fp = (S.T * 12) % 1; ctx.save(); ctx.translate(W / 2 - 330, 360); ctx.scale(1, Math.max(.05, 1 - fp)); put(ctx, Pp.sheet({ w: 340, h: 300, color: '#efe9db', seed: 50, tex: .4 }), 0, 140, { elev: .5 }); ctx.restore(); }
      const cw = Pp.cutWord('ДО СИХ ПОР', 110, 21); Pp.drawCutWord(ctx, cw, W / 2 + 380, 520, tNow + 1.5, { stagger: .04 });
    });
    X.scraps(ctx, SCR, 10, 6);
  }, { tr: 'flip', td: .8, mood: 'bright' });
  ev(tNow, 'calendar', { d: 1.5 }); ev(tNow + 1.55, 'hit');
  // F: montage of four case cards
  const tF = c('В этом ролике'), tG = c('Вы увидите'), tH = c('Как им верили'), tI = c('Как их отпускали'), tJ = c('И как однажды'), tK = c('Только факты');
  const caseCard = (lt, D, bgCols, drawInner, label, t0, seed) => (ctx) => {
    camera(lt, D, { z: [1.0, 1.08], x: [30, -30] }); X.bg(ctx, X.collageBg(seed, bgCols), .5); X.lightDrift(ctx, .9);
    L(ctx, .9, () => { const crd = Pp.sheet({ w: 1300, h: 760, color: bgCols[1], seed: seed + 1, tex: .5, torn: [0, 12, 0, 0] }); put(ctx, crd, W / 2, H / 2 + 10, { rot: -.01 });
      ctx.save(); ctx.translate(W / 2 - 650, H / 2 + 10 - 380); drawInner(ctx); ctx.restore();
      put(ctx, Pp.tape(200, 52, seed), W / 2 - 600, H / 2 - 360, { rot: -.5 });
      Pp.drawCutWord(ctx, Pp.cutWord(label, 74, seed), W / 2 + 120, H / 2 + 330, t0 + .15, { stagger: .03 }); });
    X.scraps(ctx, SCR, 7, seed);
  };
  const ussr = X.mapSprite('ussr_hook', 1100, 620, require('./geo').eu, X.proj(70, 57, 9, 560, 330), f => f.u ? { fill: '#d96b5b', stroke: 'rgba(80,30,20,.4)', lift: 1 } : { fill: '#e8d9b8' }, { paper: '#f1e6cc' });
  R.shot(tF - .15, (ctx, lt, D) => caseCard(lt, D, [P.cream, '#f3dfb4', P.coral, P.teal], (x) => { put(x, ussr, 650, 330, { rot: .01 }); X.pulseDot(x, 420, 420, tF + .3); }, '4 РЕАЛЬНЫХ ДЕЛА', tF, 61)(ctx), { tr: 'slide', mood: 'bright' });
  R.shot(tG - .1, (ctx, lt, D) => caseCard(lt, D, [P.cream, '#cde8e4', P.teal, P.yellow], (x) => miniStation(x, 1300, 760), 'КАК НАХОДИЛИ', tG, 62)(ctx), { tr: 'plane', td: .8, mood: 'bright' });
  R.shot(tH - .1, (ctx, lt, D) => caseCard(lt, D, [P.cream, '#2c3e5c', P.yellow, P.coral], (x) => { put(x, X.prop('house', 1), 650, 400, {}); X.vellumCone(x, 650, 300, 60, 400, 400, .12, '255,220,150'); }, 'КАК ВЕРИЛИ', tH, 63)(ctx), { tr: 'slide', mood: 'bright', dir: -1 });
  R.shot(tI - .1, (ctx, lt, D) => caseCard(lt, D, [P.cream, '#f6d9a0', P.coral, P.teal], (x) => { put(x, X.prop('phoneMsg'), 650, 380, { rot: -.06 }); }, 'КАК ОТПУСКАЛИ', tI, 64)(ctx), { tr: 'page', mood: 'bright' });
  R.shot(tJ - .1, (ctx, lt, D) => caseCard(lt, D, [P.cream, '#24334d', P.coral, P.teal], (x) => policeCard(x, 1300, 760), 'ПОЛИЦИЯ ВЕРНУЛА', tJ, 65)(ctx), { tr: 'slide', mood: 'bright' });
  ev(tJ, 'siren', { d: 4 });
  const srcSt = Pp.stamp('ОТКРЫТЫЕ ИСТОЧНИКИ', { size: 96 });
  R.shot(tK - .2, (ctx, lt, D) => {
    camera(lt, D, { z: [1.1, 1.0], r: [.02, 0], shake: hits([tK + .5], 10) }); X.bg(ctx, X.collageBg(15, [P.cream, P.yellow, P.teal, P.coral]), .45); X.lightDrift(ctx, 1);
    L(ctx, .85, () => { for (let i = 0; i < 6; i++) put(ctx, Pp.sheet({ w: 640, h: 860, color: ['#f6f1e4', '#efe6d2', '#f9f5ea'][i % 3], seed: 80 + i, tex: .45, lines: i % 2 ? 'ruled' : null, fold: i % 3 === 0 }), W / 2 - 300 + i * 120, 540 + (i % 2) * 30, { rot: (i - 2.5) * .06 });
      ctx.save(); ctx.translate(W / 2 + 300, 300); ctx.rotate(.03); X.typed(ctx, 'ПРИГОВОР · BRITANNICA · CNN', -260, 0, tK + .1, { size: 30, cps: 40, cursor: false }); ctx.restore();
      Pp.stampHit(ctx, srcSt, W / 2 + 60, H / 2 + 60, tK + .5, { rot: -.08 }); });
    X.scraps(ctx, SCR, 9, 7);
  }, { tr: 'stamp', stampText: 'ФАКТЫ', td: .6, mood: 'bright' });
  ev(tK + .5, 'stamp');
  // G: folder flips open: four tabs + redacted finale
  const tEnd = c('А в самом конце'), tCop = c('потому что сам'), tNo = c('Его не поймали'), tOtp = c('отпечаткам'), tSv = c('свидетелям'), tElse = c('Его нашли совсем'), tGuess = c('И вы вряд ли'), tMain = c('Но сначала главный'), tHow = c('Как убийца выбирает');
  const tabs = [['ЧИКАТИЛО', P.coral], ['РИДЖУЭЙ', P.teal], ['БАНДИ', P.yellow], ['ДАМЕР', '#9fd3c7']];
  const folderOpen = (ctx, darkK) => {
    const inside = Pp.sheet({ w: 1500, h: 880, color: '#c9a274', seed: 90, tex: .6, age: .3 }); put(ctx, inside, W / 2, H / 2 + 30, { rot: .005 });
    const pg = Pp.sheet({ w: 680, h: 800, color: '#f6f1e4', seed: 91, tex: .4, lines: 'ruled', age: .1 }); put(ctx, pg, W / 2 - 360, H / 2 + 30, { rot: -.01 }); put(ctx, Pp.sheet({ w: 680, h: 800, color: '#f3eee1', seed: 92, tex: .4, age: .12 }), W / 2 + 360, H / 2 + 30, { rot: .012 });
    tabs.forEach(([n, col], i) => { const tab = Pp.sheet({ w: 300, h: 92, color: col, seed: 93 + i, tex: .5 }); const q = tw(tEnd + .3 + i * .22, .35, E.back); put(ctx, tab, W / 2 - 860 + q * 40, 220 + i * 150, { rot: -.02, a: clamp(q * 2) });
      ctx.save(); ctx.globalAlpha = clamp(q * 2); font(ctx, F.osw, 46, '700'); ctx.fillStyle = P.ink; ctx.textAlign = 'center'; ctx.fillText(n, W / 2 - 860 + q * 40, 236 + i * 150); ctx.restore();
      X.hand(ctx, (i + 1) + '. ' + n.toLowerCase(), W / 2 - 640, 260 + i * 140, tEnd + .3 + i * .22, { size: 64, color: '#24305e' }); });
    // finale tab redacted
    const ft = Pp.sheet({ w: 300, h: 92, color: '#1d2433', seed: 99, tex: .5 }); const q = tw(tEnd + 1.3, .35, E.back); put(ctx, ft, W / 2 + 860 - q * 40, 220, { a: clamp(q * 2) });
    ctx.save(); ctx.globalAlpha = clamp(q * 2); font(ctx, F.osw, 44, '700'); ctx.fillStyle = '#f2c14e'; ctx.textAlign = 'center'; ctx.fillText('ФИНАЛ', W / 2 + 860 - q * 40, 236); ctx.restore();
    X.hand(ctx, 'финал:', W / 2 + 90, 260, tEnd + 1.2, { size: 72, color: '#c4161c' });
    for (let i = 0; i < 3; i++) { const bw = [560, 480, 520][i]; ctx.fillStyle = '#0d0f14'; ctx.fillRect(W / 2 + 90, 310 + i * 110, bw * tw(tEnd + 1.5 + i * .15, .25), 72); }
    const sh = X.prop('shield'); put(ctx, sh, W / 2 + 560, 760, { a: tw(tCop, .8) * .9, rot: .1, s: .8 });
    X.hand(ctx, 'полицейский?', W / 2 + 120, 760, tCop + .4, { size: 66, color: '#c4161c' });
  };
  R.shot(tEnd - .25, (ctx, lt, D) => {
    camera(lt, D, { z: [1.0, 1.1], x: [-20, 60] }); X.bg(ctx, X.collageBg(17, ['#d8c6a3', '#8aa9a3', '#c97a6b', '#c9b073']), .45);
    L(ctx, .9, () => folderOpen(ctx));
    const dk = tw(tEnd, 6, E.lin) * .25; ctx.fillStyle = `rgba(20,25,40,${dk})`; ctx.fillRect(0, 0, W, H);
    X.scraps(ctx, SCR, 6, 8, { a: .8 });
  }, { tr: 'flip', td: .8, mood: 'bright' });
  [0, 1, 2, 3].forEach(i => ev(tEnd + .3 + i * .22, 'tab')); ev(tEnd + 1.5, 'redact'); ev(tCop, 'heartbeat', { d: 14, bpm0: 60, bpm1: 90 });
  // H: not by prints, not by witnesses
  R.shot(tNo - .2, (ctx, lt, D) => {
    camera(lt, D, { z: [1.0, 1.1], x: [30, -30] }); X.bg(ctx, X.collageBg(19, ['#c9bda6', '#7f9a96', '#b8746a', '#b8a36e']), .45);
    ctx.fillStyle = 'rgba(20,25,40,.25)'; ctx.fillRect(0, 0, W, H);
    L(ctx, .9, () => {
      const fp = fingerprintCard(); A.fly(ctx, fp, 620, 480, tNo + .05, { d: .4, from: [-800, 200], spin: -.5, rot: -.06, twos: true });
      const wt = witnessCard(); A.fly(ctx, wt, 1300, 480, tNo + .45, { d: .4, from: [800, 200], spin: .5, rot: .05, twos: true });
      X.marker(ctx, [[460, 330], [780, 640]], tw(tOtp + .2, .2), { w: 22 }); X.marker(ctx, [[780, 330], [460, 640]], tw(tOtp + .35, .2), { w: 22 });
      X.marker(ctx, [[1140, 330], [1460, 640]], tw(tSv + .2, .2), { w: 22 }); X.marker(ctx, [[1460, 330], [1140, 640]], tw(tSv + .35, .2), { w: 22 });
      X.headline(ctx, 'ЕГО НАШЛИ ИНАЧЕ', W / 2, 900, tElse, { size: 96, color: P.white, bg: P.red, rot: -.02 });
      A.pop(ctx, X.prop('questionMark'), W / 2, 470, tGuess + .1, { s: .7, rot: .1 });
    });
    X.scraps(ctx, SCR, 6, 9, { a: .7 });
  }, { tr: 'tear', td: .7, mood: 'twist' });
  ev(tNo + .05, 'paperslap'); ev(tNo + .45, 'paperslap'); ev(tOtp + .2, 'marker'); ev(tSv + .2, 'marker'); ev(tElse, 'hit');
  // I: back to redacted bar, camera dives into black
  R.shot(tMain - .2, (ctx, lt, D) => {
    const z = lerp(1.0, 2.6, E.in(clamp((S.T - tHow) / 2.2)));
    camera(lt, D, { z: [1.15, 1.2] }); const C = K.CAMref(); C.z *= z / 1.0; C.x = lerp(C.x, 560, clamp((z - 1) / 1.6)); C.y = lerp(C.y, -160, clamp((z - 1) / 1.6));
    X.bg(ctx, X.collageBg(17, ['#d8c6a3', '#8aa9a3', '#c97a6b', '#c9b073']), .45);
    L(ctx, .9, () => folderOpen(ctx)); ctx.fillStyle = 'rgba(15,18,30,.45)'; ctx.fillRect(0, 0, W, H);
    L(ctx, 1, () => { ctx.save(); ctx.fillStyle = 'rgba(8,9,12,.85)'; ctx.fillRect(0, 440, W, 200); ctx.restore(); X.headline(ctx, 'КАК УБИЙЦА ВЫБИРАЕТ ЖЕРТВУ?', W / 2, 540, tHow, { size: 92, color: P.white, ls: 3 }); });
  }, { tr: 'slide', dir: -1, mood: 'twist', focus: [W / 2 + 330, 400] });
  ev(tHow, 'riser', { d: SC(1).t1 - tHow }); ev(SC(1).t1 - .05, 'hitcut');
}
function wrap(ctx, s, maxW) { const ws = s.split(' '), out = []; let cur = ''; for (const w of ws) { const t = cur ? cur + ' ' + w : w; if (ctx.measureText(t).width > maxW && cur) { out.push(cur); cur = w; } else cur = t; } if (cur) out.push(cur); return out; }
function miniStation(x, w, h) {
  const wall = Pp.sheet({ w: 1200, h: 520, color: '#2c3e5c', seed: 70, tex: .6 }); put(x, wall, w / 2, 330);
  for (let i = 0; i < 4; i++) { const ar = new K.Path2D(); const ax = 170 + i * 270; ar.moveTo(ax, 520); ar.lineTo(ax, 220); ar.arc(ax + 90, 220, 90, Math.PI, 0); ar.lineTo(ax + 180, 520); ar.closePath(); x.save(); x.fillStyle = '#cde8e4'; x.fill(ar); x.restore(); }
  for (let i = 0; i < 14; i++) Pp.putPerson(x, i % 3 ? 'coat' : 'woman', 90 + i * 85 + ((K.twos() * 40 * (i % 2 ? 1 : -1)) % 85), 640, 200 + hr(i) * 30, { color: '#1d2433', pose: (Math.floor(K.twos() * 6) + i) % 4 || 1 });
  const g = Pp.sheet({ w: 1240, h: 90, color: '#5a6680', seed: 71, tex: .5 }); put(x, g, w / 2, 680);
}
function policeCard(x, w, h) {
  const wall = Pp.sheet({ w: 1200, h: 620, color: '#24334d', seed: 72, tex: .7 }); put(x, wall, w / 2, 360);
  const ph = S.T * 4; const red = Math.max(0, Math.sin(ph)), blue = Math.max(0, Math.sin(ph + Math.PI));
  x.save(); x.globalCompositeOperation = 'screen'; let g = x.createRadialGradient(350, 300, 10, 350, 300, 500); g.addColorStop(0, `rgba(230,50,50,${.6 * red})`); g.addColorStop(1, 'rgba(230,50,50,0)'); x.fillStyle = g; x.fillRect(0, 0, w, h);
  g = x.createRadialGradient(950, 320, 10, 950, 320, 500); g.addColorStop(0, `rgba(60,110,240,${.6 * blue})`); g.addColorStop(1, 'rgba(60,110,240,0)'); x.fillStyle = g; x.fillRect(0, 0, w, h); x.restore();
  put(x, Pp.sheet({ w: 220, h: 420, color: '#3b2a1d', seed: 73, tex: .6 }), 820, 450);
  Pp.putPerson(x, 'cop', 660, 680, 300, { color: '#0e1320', rim: 'rgba(255,120,120,.6)' }); Pp.putPerson(x, 'cop', 980, 680, 300, { color: '#0e1320', rim: 'rgba(120,160,255,.6)', flip: true });
  Pp.putPerson(x, 'child', 820, 680, 190, { color: '#0e1320' });
}
function fingerprintCard() { return Pp.cutout('fpcard', 360, 360, (x, part) => { part(new K.Path2D('M0 0 L360 0 L360 360 L0 360 Z'), '#f6f1e4'); x.strokeStyle = '#2b3550'; x.lineWidth = 6; x.lineCap = 'round'; for (let i = 0; i < 8; i++) { x.beginPath(); x.ellipse(180, 200, 16 + i * 15, 22 + i * 17, 0, Math.PI * (1.05 + i * .01), Math.PI * (1.95 - i * .02) + (i % 2) * .3); x.stroke(); } font(x, F.osw, 40, '700'); x.fillStyle = '#1d2433'; x.textAlign = 'center'; x.fillText('ОТПЕЧАТКИ', 180, 335); }); }
function witnessCard() { return Pp.cutout('witcard', 360, 360, (x, part) => { part(new K.Path2D('M0 0 L360 0 L360 360 L0 360 Z'), '#f6f1e4'); part(new K.Path2D('M40 170 Q180 50 320 170 Q180 290 40 170 Z'), '#fbf8f1'); part(K.Path2D ? (() => { const p = new K.Path2D(); p.ellipse(180, 170, 52, 52, 0, 0, 7); return p; })() : null, '#2a9d8f'); const p = new K.Path2D(); p.ellipse(180, 170, 22, 22, 0, 0, 7); part(p, '#1d2433'); font(x, F.osw, 40, '700'); x.fillStyle = '#1d2433'; x.textAlign = 'center'; x.fillText('СВИДЕТЕЛИ', 180, 335); }); }
module.exports = { build, miniStation, wrap };
