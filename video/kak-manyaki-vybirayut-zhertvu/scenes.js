// ===== scenes =====
const SC = n => TL.scenes[n - 1];
function buildScenes() { s1(); s2(); ['s3','s4','s5','s6','s7','s8'].forEach(k => { if (window[k]) window[k](); }); }

// ---------------- SCENE 1: HOOK ----------------
function s1() {
  const S = 1, c = (p, n) => cue(S, p, n);
  const tB = c('Тед Банди'), tC = c('Андрей Чикатило'), tD = c('Джеффри Дамер');
  // A: names
  shot(0, (ctx, lt, D) => {
    camera(lt, D, { z: [1, 1.1] });
    bgDark(ctx, '10,13,18');
    const names = [['БАНДИ', 'США · 1974–1978', tB, 'bundy', 400], ['ЧИКАТИЛО', 'СССР · 1978–1990', tC, 'chikatilo', W / 2], ['ДАМЕР', 'США · 1978–1991', tD, 'dahmer', W - 400]];
    L(ctx, .4, () => names.forEach(([n, s, t, img, x]) => {
      const lt2 = NOW - t; if (lt2 > 0 && lt2 < .5) { ctx.save(); ctx.globalAlpha = (1 - lt2 / .5) * .35; cover(ctx, PROC[img], x - 300, 140, 600, 800); ctx.restore(); }
    }));
    L(ctx, 1, () => names.forEach(([n, s, t, img, x]) => {
      slamText(ctx, n, x, 560, t, { size: 104, wt: '700', ls: 6 });
      const q = ap(t + .15, .5, E.expo); ctx.fillStyle = C.red2; ctx.fillRect(x - 160 * q, 600, 320 * q, 5);
      riseText(ctx, s, x, 660, t + .25, { f: F.mono, size: 30, col: C.cold, dy: 15 });
    }));
    names.forEach(([n, s, t]) => ev(t, 'hit'));
  });
  const t3 = c('Три убийцы');
  // B: cork board with three cards, thread
  const tRule = c('одно общее правило');
  shot(t3 - .15, (ctx, lt, D) => {
    camera(lt, D, { z: [1.02, 1.16], x: [-40, 60], r: [-.01, .006] });
    corkBg(ctx, .5);
    L(ctx, .8, () => {
      const P = [[470, 470, -.05, 'БАНДИ', 'man'], [960, 420, .03, 'ЧИКАТИЛО', 'man'], [1450, 480, .06, 'ДАМЕР', 'man']];
      P.forEach(([x, y, r, n, k], i) => bustCard(ctx, x, y + (1 - ap(t3 + i * .25, .6)) * 60, 330, 430, n, { rot: r, kind: k, a: ap(t3 + i * .25, .4) }));
      const pr = ap(tRule - .4, 1.4, E.io);
      thread(ctx, [470, 270], [960, 222], clamp(pr * 2), 50); thread(ctx, [960, 222], [1450, 280], clamp(pr * 2 - 1), 50);
    });
    L(ctx, 1, () => {
      const q = ap(tRule + .3, .6); if (q > 0) { ctx.fillStyle = `rgba(5,6,8,${.75 * q})`; ctx.fillRect(0, 800, W, 160); }
      riseText(ctx, 'ЧТО ИХ ОБЪЕДИНЯЕТ?', W / 2, 905, tRule + .3, { size: 96, wt: '700', ls: 6 });
    });
  }, { tr: 'flash', td: .5 });
  ev(tRule - .4, 'thread');
  // C: strike words
  const tN1 = c('Не внешность'), tN2 = c('Не возраст'), tN3 = c('Не характер'), tQ = c('Что-то другое');
  shot(tN1 - .5, (ctx, lt, D) => {
    camera(lt, D, { z: [1.12, 1], x: [-30, 30], r: [.015, -.005] });
    bgDark(ctx, '16,20,27');
    L(ctx, .3, () => { ctx.globalAlpha = .25; ctx.drawImage(PAPER, 0, 0, W, H); ctx.globalAlpha = 1; ctx.fillStyle = 'rgba(5,7,10,.75)'; ctx.fillRect(0, 0, W, H); });
    const words = [['ВНЕШНОСТЬ', tN1, 330], ['ВОЗРАСТ', tN2, 520], ['ХАРАКТЕР', tN3, 710]];
    const dim = ap(tQ, .6);
    L(ctx, 1, () => {
      words.forEach(([w, t, y], i) => {
        txt(ctx, w, W / 2 - 220, y, { size: 150, wt: '700', ls: 10, a: ap(tN1 - .5 + i * .12, .4) * (1 - dim * .7), col: C.white });
        font(ctx, F.osw, 150, '700'); ctx.letterSpacing = '10px'; const tw = ctx.measureText(w).width;
        strike(ctx, W / 2 - 220 - tw / 2, W / 2 - 220 + tw / 2, y - 55, t + .15, { w: 14, glow: 1 });
        ev(t + .15, 'strike');
      });
      const q = ap(tQ, .5, E.back); if (q > 0) { ctx.save(); ctx.translate(1450, 560); ctx.scale(q, q); txt(ctx, '?', 0, 150, { size: 520, wt: '700', col: C.red2, glow: C.red, gb: 60 }); ctx.restore(); }
    });
  }, { tr: 'smear' });
  ev(tQ, 'hit');
  // D: archive
  const tSimple = c('Настолько простое'), tYears = c('годами'), tNow = c('И это правило работает');
  shot(tSimple - .2, (ctx, lt, D) => {
    camera(lt, D, { z: [1.0, 1.18], x: [-120, 80] });
    archive(ctx, lt);
    L(ctx, 1, () => {
      const q = ap(tYears - .2, .4); if (q > 0) { ctx.fillStyle = `rgba(4,5,7,${.6 * q})`; ctx.fillRect(0, 860, W, 120); }
      typeText(ctx, 'ПОЛИЦИЯ НЕ ЗАМЕЧАЛА ЭТОГО ГОДАМИ', W / 2, 935, tSimple + .6, { size: 46, align: 'center', cps: 26 });
    });
  }, { tr: 'fade', td: .6 });
  ev(tSimple + .6, 'type', { d: 1.3 });
  // E: years to now
  shot(tNow - .2, (ctx, lt, D) => {
    camera(lt, D, { z: [1.15, 1.0] });
    bgDark(ctx, '12,16,22');
    const p = clamp((NOW - tNow) / 1.6);
    const y = Math.round(lerp(1974, 2026, E.out(p)));
    L(ctx, .9, () => {
      txt(ctx, String(y), W / 2, 600, { size: 300, wt: '700', col: p >= 1 ? C.red2 : C.white, glow: p >= 1 ? C.red : null, ls: 10 });
      trackText(ctx, 'ПРАВИЛО РАБОТАЕТ ДО СИХ ПОР', W / 2, 760, tNow + 1.2, { size: 54, wt: '500', ls: 12, ls0: 40, col: C.cold });
    });
  }, { tr: 'glitch', td: .45 });
  ev(tNow, 'tick', { d: 1.6 }); ev(tNow + 1.6, 'hit');
  // F: quick montage of four
  const tF = c('В этом ролике'), tG = c('Вы увидите'), tH = c('Как им верили'), tI = c('Как их отпускали'), tJ = c('И как однажды'), tK = c('Только факты');
  shot(tF - .15, (ctx, lt, D) => {
    camera(lt, D, { z: [1.0, 1.1], x: [40, -40] });
    deskBg(ctx, .5);
    L(ctx, .9, () => {
      const labels = ['ДЕЛО 1', 'ДЕЛО 2', 'ДЕЛО 3', 'ДЕЛО 4'];
      labels.forEach((l, i) => { const q = ap(tF + .3 + i * .18, .5, E.back); folder(ctx, 330 + i * 420, 560 + (1 - q) * 300, 360, 470, '', { rot: (i - 1.5) * .04, a: clamp(q * 2), head: l, lines: 4 }); });
      riseText(ctx, 'ЧЕТЫРЕ РЕАЛЬНЫХ ДЕЛА', W / 2, 190, tF + .8, { size: 80, wt: '700', ls: 8 });
    });
  }, { tr: 'smear' });
  [0, 1, 2, 3].forEach(i => ev(tF + .3 + i * .18, 'drop'));
  shot(tG - .1, (ctx, lt, D) => { camera(lt, D, { z: [1.05, 1.15], x: [0, 60] }); station(ctx, lt, { board: ['ОТПРАВЛЕНИЕ', 'ПОЕЗД 14:20', 'ПОЕЗД 14:35', 'ПОЕЗД 14:52'] }); L(ctx, 1, () => plate(ctx, 'КАК НАХОДИЛИ', null, 120, 960, tG + .3)); }, { tr: 'smear' });
  shot(tH - .1, (ctx, lt, D) => { camera(lt, D, { z: [1.0, 1.12] }); houseNight(ctx, lt, { figure: 1 }); L(ctx, 1, () => plate(ctx, 'КАК ИМ ВЕРИЛИ', null, 120, 960, tH + .1)); }, { tr: 'smear' });
  shot(tI - .1, (ctx, lt, D) => {
    camera(lt, D, { z: [1.1, 1.2], r: [-.02, -.01] }); deskBg(ctx, .5);
    L(ctx, .9, () => { paperSheet(ctx, W / 2, H / 2, 900, 640, -.03); ctx.save(); ctx.translate(W / 2, H / 2); ctx.rotate(-.03);
      font(ctx, F.mono, 34); ctx.fillStyle = '#26292e'; ctx.textAlign = 'left'; ['ПРОТОКОЛ ПРОВЕРКИ ДОКУМЕНТОВ', 'Задержанный: ████████████', 'Основания для задержания:', '    не установлены'].forEach((s, i) => ctx.fillText(s, -380, -200 + i * 60)); ctx.restore();
      stamp(ctx, 'ОТПУЩЕН', W / 2 + 130, H / 2 + 150, tI + .35, { size: 110 }); });
  }, { tr: 'smear' });
  ev(tI + .35, 'stamp');
  shot(tJ - .1, (ctx, lt, D) => {
    camera(lt, D, { z: [1.0, 1.1], x: [-40, 20] }); policeWall(ctx, lt, { open: ap(tJ + 2.3, 1.2) });
    L(ctx, .9, () => { const rim = Math.sin(NOW * 4.2) > 0 ? 'rgba(230,60,60,.9)' : 'rgba(70,110,240,.9)'; figure(ctx, 1240, 940, 330, { kind: 'cop', col: '#020304', rim }); figure(ctx, 1330, 940, 210, { kind: 'child', col: '#020304', rim }); figure(ctx, 1420, 940, 330, { kind: 'cop', col: '#020304', flip: true, rim }); });
  }, { tr: 'smear', lb: 1 });
  ev(tJ, 'siren', { d: 4 });
  shot(tK - .15, (ctx, lt, D) => {
    camera(lt, D, { z: [1.12, 1.0], r: [.02, 0] }); deskBg(ctx, .4);
    L(ctx, .8, () => { paperSheet(ctx, 760, 520, 700, 900, -.08); paperSheet(ctx, 1150, 560, 700, 900, .05);
      ctx.save(); ctx.translate(1150, 560); ctx.rotate(.05); ctx.fillStyle = 'rgba(30,30,35,.6)'; for (let i = 0; i < 14; i++) ctx.fillRect(-280, -360 + i * 46, 400 + hr(i) * 160, 9); ctx.restore();
      stamp(ctx, 'ОТКРЫТЫЕ ИСТОЧНИКИ', W / 2 + 40, H / 2 + 40, tK + .5, { size: 92, rot: -.1 }); });
  }, { tr: 'paper', td: .8 });
  ev(tK + .5, 'stamp');
  // G: open folder w/ tabs + redacted final
  const tEnd = c('А в самом конце'), tCop = c('потому что сам был'), tNo = c('Его не поймали'), tOtp = c('отпечаткам'), tSv = c('свидетелям'), tElse = c('Его нашли совсем'), tGuess = c('И вы вряд ли');
  shot(tEnd - .2, (ctx, lt, D) => {
    camera(lt, D, { z: [1.0, 1.22], x: [0, 160], y: [0, 40] });
    deskBg(ctx, .5);
    L(ctx, .9, () => {
      // open folder
      ctx.save(); ctx.shadowColor = 'rgba(0,0,0,.8)'; ctx.shadowBlur = 50; ctx.fillStyle = '#8a7d62'; ctx.fillRect(260, 150, 1400, 820); ctx.shadowColor = 'transparent';
      ctx.globalCompositeOperation = 'multiply'; ctx.drawImage(PAPER2, 260, 150, 1400, 820); ctx.globalCompositeOperation = 'source-over';
      ctx.fillStyle = 'rgba(0,0,0,.25)'; ctx.fillRect(955, 150, 10, 820); ctx.restore();
      paperSheet(ctx, 610, 560, 600, 740, -.01); paperSheet(ctx, 1310, 560, 600, 740, .01);
      const tabs = ['ЧИКАТИЛО', 'РИДЖУЭЙ', 'БАНДИ', 'ДАМЕР'];
      tabs.forEach((t, i) => { const q = ap(tEnd + .2 + i * .2, .4); txt(ctx, (i + 1) + '. ' + t, 360, 330 + i * 110, { f: F.mono, size: 52, align: 'left', col: '#1f2227', a: q }); });
      txt(ctx, 'ФИНАЛ:', 1050, 330, { f: F.osw, size: 60, wt: '700', align: 'left', col: C.red, a: ap(tEnd + 1, .4) });
      const bq = ap(tCop, .8);
      if (bq > 0) icon(ctx, 'badge', 1310, 560, 260, { col: 'rgba(40,40,45,.5)', lw: 6, a: bq });
      redact(ctx, 1050, 380, 520, 90); redact(ctx, 1050, 500, 460, 60); redact(ctx, 1050, 590, 500, 60);
      txt(ctx, 'ПОЛИЦЕЙСКИЙ?', 1300, 760, { f: F.osw, size: 70, wt: '700', col: '#1f2227', a: ap(tCop + .2, .5) });
    });
  }, { tr: 'fade', td: .5, focus: [1310, 435] });
  shot(tNo - .15, (ctx, lt, D) => {
    camera(lt, D, { z: [1.0, 1.08] });
    bgDark(ctx, '14,18,24');
    L(ctx, .9, () => {
      icon(ctx, 'finger', 620, 480, 300, { a: ap(tNo, .4), col: C.cold, lw: 4 }); cross(ctx, 620, 480, 300, tOtp + .2);
      icon(ctx, 'eye', 1300, 480, 300, { a: ap(tNo + .3, .4), col: C.cold, lw: 4 }); cross(ctx, 1300, 480, 300, tSv + .2);
      txt(ctx, 'ОТПЕЧАТКИ', 620, 730, { size: 52, wt: '500', ls: 6, a: ap(tOtp, .4), col: C.white });
      txt(ctx, 'СВИДЕТЕЛИ', 1300, 730, { size: 52, wt: '500', ls: 6, a: ap(tSv, .4), col: C.white });
      riseText(ctx, 'ЕГО НАШЛИ СОВСЕМ ИНАЧЕ', W / 2, 900, tElse, { size: 64, wt: '700', ls: 6, col: C.red2 });
    });
  }, { tr: 'glitch', td: .4 });
  ev(tOtp + .2, 'strike'); ev(tSv + .2, 'strike');
  const tMain = c('Но сначала главный'), tHow = c('Как убийца выбирает');
  shot(tMain - .2, (ctx, lt, D) => {
    camera(lt, D, { z: [1.18, 1.0] });
    bgDark(ctx, '10,13,18');
    L(ctx, .4, () => { ctx.save(); ctx.globalAlpha = .12; figureGrid(ctx, 40, 20, 100, 400, 90, 260, -10, 1, { kind: i => i % 3 ? 'woman' : 'man', col: '#6b7a89' }); ctx.restore(); });
    L(ctx, 1, () => {
      trackText(ctx, 'ГЛАВНЫЙ ВОПРОС', W / 2, 340, tMain + .2, { f: F.mono, size: 36, ls: 8, ls0: 24, col: C.red2 });
      riseText(ctx, 'КАК УБИЙЦА', W / 2, 560, tHow, { size: 170, wt: '700', ls: 6, stagger: .035 });
      riseText(ctx, 'ВЫБИРАЕТ ЖЕРТВУ?', W / 2, 740, tHow + .5, { size: 170, wt: '700', ls: 6, stagger: .035 });
    });
  }, { tr: 'zoom', td: .9, lb: 1 });
  ev(tHow, 'boomlow');
}

// ---------------- SCENE 2: RULE OF INVISIBILITY ----------------
function s2() {
  const S = 2, c = (p, n) => cue(S, p, n);
  const t0 = c('Обычно люди'), tType = c('Есть тип'), tBl = c('блондинки'), tSt = c('студентки'), tCh = c('дети'), tSec = c('Но когда разбирают'), tVt = c('вторичен');
  shot(SC(1).t1 + .5, (ctx, lt, D) => {
    camera(lt, D, { z: [1.0, 1.12], x: [-60, 40] });
    bgDark(ctx, '14,18,24');
    L(ctx, .9, () => {
      const cards = [['БЛОНДИНКИ', tBl, 'woman'], ['СТУДЕНТКИ', tSt, 'woman'], ['ДЕТИ', tCh, 'child']];
      trackText(ctx, 'ТИПАЖ', W / 2, 230, tType - .3, { size: 130, wt: '700', ls: 30, ls0: 80 });
      font(ctx, F.osw, 130, '700'); ctx.letterSpacing = '30px'; const tw = ctx.measureText('ТИПАЖ').width;
      strike(ctx, W / 2 - tw / 2, W / 2 + tw / 2 - 30, 180, tVt - .4, { w: 14, glow: 1 });
      cards.forEach(([n, t, k], i) => { const q = ap(t - .1, .5, E.back); bustCard(ctx, 520 + i * 440, 600 + (1 - q) * 80, 330, 420, n, { kind: k, a: clamp(q * 1.5), rot: (i - 1) * .04 }); });
      stamp(ctx, 'ВТОРИЧЕН', W / 2, 620, tVt, { size: 120 });
    });
  }, { tr: 'dip', td: 1.0 });
  ev(tVt - .4, 'strike'); ev(tVt, 'stamp');
  // typewriter two questions
  const tPrim = c('Первичны два'), tQ1 = c('Первый'), tQ2 = c('Второй');
  shot(tPrim - .3, (ctx, lt, D) => {
    camera(lt, D, { z: [1.0, 1.1], y: [20, -20] });
    ctx.fillStyle = '#050608'; ctx.fillRect(0, 0, W, H);
    L(ctx, .5, () => { spot(ctx, W / 2, H / 2, 900, .08); });
    L(ctx, 1, () => {
      riseText(ctx, 'ДВА ВОПРОСА УБИЙЦЫ', W / 2, 260, tPrim, { size: 64, wt: '600', ls: 10, col: C.red2 });
      typeText(ctx, '1. Могу ли я добраться до него незаметно?', 230, 500, tQ1 + .4, { size: 54, cps: 24 });
      typeText(ctx, '2. Если он исчезнет — как быстро его хватятся?', 230, 640, tQ2 + .4, { size: 54, cps: 24 });
      typeText(ctx, '   И насколько всерьёз отнесутся?', 230, 720, tQ2 + 2.4, { size: 54, cps: 24, col: C.cold });
    });
  }, { tr: 'flash' });
  ev(tQ1 + .4, 'type', { d: 1.7 }); ev(tQ2 + .4, 'type', { d: 1.9 }); ev(tQ2 + 2.4, 'type', { d: 1.3 });
  // term -> rule
  const tSpec = c('Специалисты'), tRule = c('правило невидимости');
  shot(tSpec - .2, (ctx, lt, D) => {
    camera(lt, D, { z: [1.1, 1.0], r: [-.01, .01] });
    bgDark(ctx, '12,16,22');
    L(ctx, .9, () => {
      const out = ap(tRule - .3, .4);
      txt(ctx, '«доступность жертвы»', W / 2, 420, { f: F.serif, size: 80, col: C.cold, a: ap(tSpec + .8, .5) * (1 - out * .7) });
      txt(ctx, 'термин криминологии', W / 2, 490, { f: F.mono, size: 30, col: C.dim, a: ap(tSpec + 1.2, .5) * (1 - out) });
      if (NOW > tRule - .1) { const q = ap(tRule - .1, .25, E.out); txt(ctx, 'ПРАВИЛО', W / 2, 650, { size: 150, wt: '700', ls: 12, a: q }); }
      slamText(ctx, 'НЕВИДИМОСТИ', W / 2, 820, tRule + .45, { size: 170, wt: '700', ls: 12, col: C.red2, glow: C.red, gb: 40 });
    });
  }, { tr: 'smear', dir: -1 });
  ev(tRule + .45, 'boom');
  // crowd: one in circle of light, eyes fade
  const tLess = c('Чем меньше людей'), tWeak = c('И не потому'), tNoone = c('А потому что никто');
  shot(tLess - .2, (ctx, lt, D) => {
    camera(lt, D, { z: [1.0, 1.25], y: [0, -40] });
    ctx.fillStyle = '#040506'; ctx.fillRect(0, 0, W, H);
    const fade = ap(tLess + 1.2, 3.5, E.io), vanish = ap(tNoone + .6, 1.6, E.io);
    L(ctx, .8, () => {
      for (let i = 0; i < 26; i++) {
        const ang = i / 26 * Math.PI * 2, rr = 520 + hr(i) * 120;
        const x = W / 2 + Math.cos(ang) * rr * 1.25, y = 760 + Math.sin(ang) * rr * .32;
        const a = (1 - fade * (hr(i * 3) * .6 + .4)) * .9;
        figure(ctx, x, y, 230 + Math.sin(ang) * 40, { kind: i % 3 ? 'coat' : 'woman', col: `rgba(120,135,150,${a})` });
        // gaze lines
        ctx.strokeStyle = `rgba(200,215,230,${.18 * (1 - fade) * (1 - vanish)})`; ctx.lineWidth = 2; ctx.setLineDash([8, 10]); ctx.beginPath(); ctx.moveTo(x, y - 200); ctx.lineTo(W / 2, 560); ctx.stroke(); ctx.setLineDash([]);
      }
      ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.globalAlpha = 1 - vanish * .85; cone(ctx, W / 2, -50, 50, 420, 820, .2); ctx.restore();
      ctx.save(); ctx.scale(1, .22); spot(ctx, W / 2, 780 / .22, 260, .3 * (1 - vanish)); ctx.restore();
      figure(ctx, W / 2, 780, 300, { kind: 'woman', col: '#c9d3dd', a: 1 - vanish * .92, rim: 'rgba(220,230,240,.5)' });
    });
    L(ctx, 1, () => { riseText(ctx, 'НИКТО НЕ БУДЕТ ИСКАТЬ', W / 2, 200, tNoone + .4, { size: 72, wt: '600', ls: 8, col: C.white }); });
  }, { tr: 'fade', td: .8, lb: 1 });
  ev(tLess, 'drone_swell', { d: 6 });
  const tTheory = c('Звучит как теория'), tCheck = c('Давайте проверим'), tStart = c('Начнём с самого');
  shot(tTheory - .2, (ctx, lt, D) => {
    camera(lt, D, { z: [1.0, 1.14], x: [-50, 50] });
    deskBg(ctx, .5);
    L(ctx, .9, () => {
      const names = ['ЧИКАТИЛО', 'РИДЖУЭЙ', 'БАНДИ', 'ДАМЕР'];
      names.forEach((n, i) => { const q = ap(tCheck + i * .2, .5, E.back); folder(ctx, 330 + i * 420, 600 + (1 - q) * 260, 360, 470, n, { rot: (i - 1.5) * .05, a: clamp(q * 2), lines: 5 }); });
      const hl = ap(tStart, .5); if (hl > 0) { ctx.strokeStyle = C.red2; ctx.lineWidth = 6; ctx.globalAlpha = hl; ctx.strokeRect(330 - 200, 600 - 260, 400, 520); ctx.globalAlpha = 1; }
      riseText(ctx, 'ПРОВЕРИМ НА РЕАЛЬНЫХ ДЕЛАХ', W / 2, 200, tCheck, { size: 70, wt: '600', ls: 6 });
    });
  }, { tr: 'paper', td: .8 });
  [0, 1, 2, 3].forEach(i => ev(tCheck + i * .2, 'drop'));
}
