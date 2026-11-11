// ===== scenes 3-4 =====
function geoCam(lt, D, a, b, e = E.io) {
  const p = e(clamp(lt / D));
  const sc = a.s * Math.pow(b.s / a.s, p);
  return proj(lerp(a.lon, b.lon, p), lerp(a.lat, b.lat, p), sc);
}
const USSR_STYLE = f => f.u ? { fill: '#1b232c', stroke: 'rgba(142,162,181,.45)', lw: 1.2 } : { fill: '#0e1217', stroke: 'rgba(142,162,181,.15)', lw: 1 };
function seaBg(ctx) { ctx.fillStyle = '#06080b'; ctx.fillRect(0, 0, W, H); gridLines(ctx, .05); }
function mapLabel(ctx, s, x, y, t0, o = {}) { riseText(ctx, s, x, y, t0, Object.assign({ f: F.osw, size: 40, wt: '500', ls: 8, col: C.cold, dy: 15 }, o)); }
let RIVER = null;
function riverMask() {
  const im = IMG.green_map, c = mk(im.width, im.height), x = c.getContext('2d'); x.drawImage(im, 0, 0);
  const d = x.getImageData(0, 0, c.width, c.height);
  for (let i = 0; i < d.data.length; i += 4) { const r = d.data[i], g = d.data[i + 1], b = d.data[i + 2]; const on = b - r > 70 && b > 120 && g < 170; d.data[i] = 120; d.data[i + 1] = 190; d.data[i + 2] = 255; d.data[i + 3] = on ? 255 : 0; }
  x.putImageData(d, 0, 0); RIVER = c;
}
// Rostov map pixel coords (source image 500x542)
const ROST = { 'Ростов-на-Дону': [121, 353], 'Шахты': [166, 312], 'Новочеркасск': [158, 343], 'Новошахтинск': [141, 299], 'Таганрог': [64, 366], 'Батайск': [133, 378], 'Азов': [104, 389], 'Кр.Сулин': [157, 290] };

window.s3 = function () {
  const S = 3, c = (p, n) => cue(S, p, n);
  if (!RIVER) riverMask();
  const t0 = SC(3).t0, tYear = c('Тысяча девятьсот семьдесят восьмой'), tSer = c('Начинается серия'), t12 = c('двенадцать лет');
  // 1. USSR map -> Rostov
  shot(t0 - .6, (ctx, lt, D) => {
    camera(lt, D, { hand: .6 });
    seaBg(ctx);
    const P = geoCam(lt, D, { lon: 70, lat: 58, s: 11 }, { lon: 40.5, lat: 47.6, s: 95 });
    drawGeo(ctx, GEO.eu, P, USSR_STYLE);
    const [rx, ry] = P(39.72, 47.23);
    pulse(ctx, rx, ry, t0 + .4, { R: 90 });
    mapLabel(ctx, 'СССР', P(80, 62)[0], P(80, 62)[1], t0 - .3, { size: 90, wt: '700', ls: 30, col: 'rgba(142,162,181,.6)' });
    mapLabel(ctx, 'РОСТОВСКАЯ ОБЛАСТЬ', rx + 40, ry - 40, t0 + .8, { align: 'left', col: C.white });
    slamText(ctx, '1978', 1620, 980, tYear + .3, { size: 150, wt: '700', col: C.red2, glow: C.red });
  }, { tr: 'smear' });
  ev(tYear + .3, 'hit');
  // 2. Rostov oblast map + 12 years bar
  shot(tSer - .2, (ctx, lt, D) => {
    camera(lt, D, { z: [1.0, 1.12], x: [30, -30] });
    seaBg(ctx);
    L(ctx, .8, () => {
      const [ix, iy, iw, ih] = contain(ctx, PROC.rostov_map, 360, -40, 1200, 1100);
      const k = iw / 500; const R = n => [ix + ROST[n][0] * k, iy + ROST[n][1] * k];
      const [rx, ry] = R('Ростов-на-Дону'); pulse(ctx, rx, ry, tSer, { R: 60 });
    });
    L(ctx, 1, () => {
      const p = ap(tSer + .3, (t12 - tSer) + .3, E.io);
      ctx.fillStyle = 'rgba(5,6,8,.85)'; ctx.fillRect(160, 900, W - 320, 110);
      ctx.fillStyle = 'rgba(142,162,181,.3)'; ctx.fillRect(260, 950, W - 520, 6); ctx.fillStyle = C.red2; ctx.fillRect(260, 950, (W - 520) * p, 6);
      txt(ctx, '1978', 210, 975, { size: 44, wt: '600', align: 'center' }); txt(ctx, String(Math.round(lerp(1978, 1990, p))), W - 210, 975, { size: 44, wt: '600', col: p >= 1 ? C.red2 : C.white });
      slamText(ctx, '12 ЛЕТ', W / 2, 870, t12, { size: 90, wt: '700', col: C.white });
    });
  }, { tr: 'fade', td: .6 });
  ev(t12, 'hit');
  // 3. 52 proven
  const tCourt = c('В итоге суд'), tProv = c('доказанными'), t52 = c('пятьдесят два'), tAll = c('Все жертвы');
  shot(tCourt - .2, (ctx, lt, D) => {
    camera(lt, D, { z: [1.08, 1.0] });
    bgDark(ctx, '14,18,24');
    const move = ap(tAll - .2, .8, E.io);
    L(ctx, .9, () => {
      ctx.save(); ctx.translate(lerp(W / 2, 470, move), lerp(500, 470, move)); ctx.scale(lerp(1, .7, move), lerp(1, .7, move));
      counter(ctx, 52, 0, 0, t52, { size: 420, d: 1.4 });
      ctx.restore();
      stamp(ctx, 'ДОКАЗАНО', lerp(W / 2 + 330, 480, move), lerp(720, 760, move), tProv, { size: 90, s: lerp(1, .8, move) });
      figureGrid(ctx, 52, 13, 880, 330, 74, 150, tAll + .2, 2.2, { kind: i => i % 4 === 0 ? 'woman' : 'child', col: '#aab8c6', ghost: 1 });
      riseText(ctx, 'ДЕТИ · ПОДРОСТКИ · ЖЕНЩИНЫ', 1340, 980, tAll + .4, { f: F.mono, size: 36, col: C.cold, dy: 15 });
    });
  }, { tr: 'flash' });
  ev(tProv, 'stamp'); ev(t52, 'tick', { d: 1.4 }); ev(t52 + 1.4, 'hit');
  // 4. station
  const tWhere = c('Где их находили'), tVok = c('Возле вокзалов'), tFlow = c('Вокзал это поток');
  shot(tWhere - .2, (ctx, lt, D) => {
    camera(lt, D, { z: [1.0, 1.15], x: [-80, 80] }); station(ctx, lt, { board: ['ОТПРАВЛЕНИЕ', 'ШАХТЫ        14:20', 'НОВОЧЕРКАССК 14:35', 'ТАГАНРОГ     14:52'] });
    L(ctx, 1, () => { plate(ctx, 'ВОКЗАЛЫ И АВТОСТАНЦИИ', 'Ростовская область', 120, 930, tVok); { const q = ap(tFlow + .8, .4); if (q > 0) { ctx.fillStyle = `rgba(4,5,7,${.8 * q})`; ctx.fillRect(0, 410, W, 120); } riseText(ctx, 'НИКТО НИКОГО НЕ ЗАПОМИНАЕТ', W / 2, 492, tFlow + .8, { size: 60, wt: '600', ls: 8 }); } });
  }, { tr: 'smear' });
  ev(tWhere, 'crowd', { d: (c('Ребёнок') - tWhere) + 8 });
  const tKid = c('Ребёнок который'), tTalk = c('Человек который заговорил'), tInv = c('Идеальная невидимость');
  shot(tKid - .2, (ctx, lt, D) => {
    camera(lt, D, { z: [1.1, 1.3], x: [0, 40], y: [40, 60] });
    const fade = ap(tTalk + 1.5, 2.2, E.io);
    station(ctx, lt, { board: ['ОТПРАВЛЕНИЕ', 'ШАХТЫ        16:05', 'КР.СУЛИН     16:40', 'АЗОВ         17:10'] });
    L(ctx, .95, () => {
      const x = W / 2 - 200 + NOW * 30 % 200 - 100 + (NOW - tKid) * 40;
      ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.globalAlpha = 1 - fade; cone(ctx, x + 40, -60, 40, 500, 1050, .16); ctx.restore();
      figure(ctx, x, 1000, 380, { kind: 'coat', walk: 1, phase: NOW * 5, col: '#c4ced8', a: 1 - fade, glasses: 'rgba(0,0,0,.6)' });
      figure(ctx, x + 110, 1000, 240, { kind: 'child', walk: 1, phase: NOW * 5 + 2, col: '#c4ced8', a: 1 - fade });
    });
    L(ctx, 1, () => { slamText(ctx, 'ИДЕАЛЬНАЯ НЕВИДИМОСТЬ', W / 2, 160, tInv, { size: 96, wt: '700', ls: 6, col: C.red2, glow: C.red }); });
  }, { tr: 'fade', td: .6, lb: 1 });
  ev(tInv, 'boom');
  // 5. 1984 one case + 11 more
  const t84 = c('К тысяча девятьсот восьмидесят'), t23 = c('двадцати трёх'), tNot = c('А убийства не прекращались'), tMar = c('Только с марта'), t11 = c('ещё одиннадцать');
  shot(t84 - .2, (ctx, lt, D) => {
    camera(lt, D, { z: [1.0, 1.15], r: [-.02, .01] }); deskBg(ctx, .5);
    L(ctx, .9, () => {
      for (let i = 0; i < 5; i++) folder(ctx, 760 + i * 30 - 60, 560 - i * 16 + (1 - ap(t84 + i * .15, .5, E.back)) * 400, 640, 760, '', { rot: -.06 + i * .03, head: 'ДЕЛО №' + (i + 1), a: ap(t84 + i * .15, .3), lines: 6 });
      stamp(ctx, 'ОДНО ДЕЛО', 1240, 520, t23 + .2, { size: 120, sub: '1984 · 23 УБИЙСТВА' });
    });
  }, { tr: 'paper', td: .8 });
  [0, 1, 2, 3, 4].forEach(i => ev(t84 + i * .15, 'drop')); ev(t23 + .2, 'stamp');
  shot(tNot - .2, (ctx, lt, D) => {
    camera(lt, D, { z: [1.05, 1.0], x: [40, -40] }); bgDark(ctx, '14,18,24');
    L(ctx, .9, () => {
      const months = ['МАР', 'АПР', 'МАЙ', 'ИЮН', 'ИЮЛ', 'АВГ', 'СЕН'];
      const p = ap(tMar, 1.0, E.io);
      ctx.strokeStyle = 'rgba(142,162,181,.5)'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(260, 700); ctx.lineTo(260 + 1400 * p, 700); ctx.stroke();
      months.forEach((m, i) => txt(ctx, m, 260 + i * 233, 770, { f: F.mono, size: 34, col: C.cold, a: ap(tMar + i * .12, .3) }));
      for (let i = 0; i < 11; i++) { const x = 300 + hr(i * 3.1) * 1320, y = 700 - 40 - hr(i * 7) * 160; const tt = t11 - 1.2 + i * .14; pulse(ctx, x, y, tt, { r: 12, R: 30 }); }
      slamText(ctx, '+11', W / 2, 400, t11 + .2, { size: 260, wt: '700', col: C.red2, glow: C.red });
      riseText(ctx, 'УБИЙСТВА НЕ ПРЕКРАЩАЛИСЬ', W / 2, 160, tNot, { size: 60, wt: '600', ls: 8 });
    });
  }, { tr: 'smear' });
  for (let i = 0; i < 11; i++) ev(t11 - 1.2 + i * .14, 'tickone'); ev(t11 + .2, 'hit');
  // 6. Kravchenko
  const tHere = c('И вот тут'), tKr = c('Его звали Александр'), t25 = c('Ему было двадцать'), tPress = c('Под давлением'), tExec = c('его казнили'), tCont = c('Убийства продолжились');
  shot(tHere - .2, (ctx, lt, D) => {
    camera(lt, D, { z: [1.0, 1.1] }); ctx.fillStyle = '#040506'; ctx.fillRect(0, 0, W, H);
    L(ctx, .9, () => {
      typeText(ctx, 'ВЛАСТИ ПОТОМ ПРИЗНАЛИ:', W / 2, 440, tHere + .8, { size: 50, align: 'center', col: C.cold, cps: 20 });
      riseText(ctx, 'РАССТРЕЛЯЛИ НЕВИНОВНОГО', W / 2, 600, tHere + 3.2, { size: 100, wt: '700', ls: 6, col: C.white });
    });
  }, { tr: 'dip', td: .8, lb: 1 });
  ev(tHere + .8, 'type', { d: 1.2 });
  shot(tKr - .2, (ctx, lt, D) => {
    camera(lt, D, { z: [1.0, 1.12], x: [-40, 40] }); deskBg(ctx, .5);
    L(ctx, .9, () => {
      paperSheet(ctx, W / 2, H / 2 + 20, 1300, 820, -.015);
      ctx.save(); ctx.translate(W / 2, H / 2 + 20); ctx.rotate(-.015);
      ctx.fillStyle = '#1f2226'; ctx.fillRect(-560, -320, 300, 380); bust(ctx, -410, 60, 300, { col: '#0a0c0f' });
      ctx.restore();
      ctx.save(); ctx.translate(W / 2, H / 2 + 20); ctx.rotate(-.015);
      typeText(ctx, 'КРАВЧЕНКО Александр', -200, -240, tKr + .4, { size: 50, col: '#1d2024', cps: 24, cursor: false });
      typeText(ctx, 'Возраст: 25 лет', -200, -150, t25, { size: 42, col: '#1d2024', cps: 24, cursor: false });
      typeText(ctx, 'Ранее судим', -200, -80, t25 + 1.2, { size: 42, col: '#1d2024', cps: 24, cursor: false });
      typeText(ctx, 'Признание: под давлением', -200, -10, tPress, { size: 42, col: '#1d2024', cps: 24, cursor: false });
      typeText(ctx, 'Казнён: 1984', -200, 60, tExec - .3, { size: 42, col: '#1d2024', cps: 24, cursor: false });
      ctx.restore();
      stamp(ctx, 'НЕ ТОТ', W / 2 + 260, H / 2 + 230, tExec + .4, { size: 150, rot: -.12 });
    });
  }, { tr: 'fade', td: .5 });
  ev(tKr + .4, 'type', { d: 1 }); ev(t25, 'type', { d: .8 }); ev(t25 + 1.2, 'type', { d: .5 }); ev(tPress, 'type', { d: 1 }); ev(tExec - .3, 'type', { d: .6 }); ev(tExec + .4, 'stampbig');
  ev(tCont - 1.45, 'silence', { d: 1.4 });
  shot(tCont - .15, (ctx, lt, D) => {
    camera(lt, D, { z: [1.0, 1.06], hand: .3 }); ctx.fillStyle = '#020203'; ctx.fillRect(0, 0, W, H);
    L(ctx, 1, () => trackText(ctx, 'УБИЙСТВА ПРОДОЛЖИЛИСЬ', W / 2, 570, tCont, { size: 110, wt: '700', ls: 10, ls0: 50, col: C.red2, glow: C.red, d: 2 }));
  }, { tr: 'cut', lb: 1 });
  ev(tCont, 'boomlow');
  // 7. bus station, man with glasses -> photo
  const tSame = c('В том же году'), tGl = c('мужчину в очках'), tDocs = c('проверили его документы'), tLet = c('и отпустили'), tName = c('Мужчину звали'), tTeach = c('Учитель'), tSnab = c('работник снабжения'), tFam = c('отец семейства'), tOrd = c('Он выглядел'), tNobody = c('на которого никто');
  shot(tSame - .2, (ctx, lt, D) => {
    camera(lt, D, { z: [1.0, 1.25], x: [-60, 120], y: [0, 50] });
    station(ctx, lt, { board: ['АВТОВОКЗАЛ', 'РЕЙС 112   15:10', 'РЕЙС 134   15:25', 'РЕЙС 141   15:40'] });
    L(ctx, .95, () => {
      figure(ctx, 1150, 1000, 400, { kind: 'coat', col: '#c9d2db', glasses: 'rgba(0,0,0,.8)' });
      ctx.save(); ctx.globalCompositeOperation = 'lighter'; cone(ctx, 1150, -60, 40, 420, 1060, .14); ctx.restore();
      figure(ctx, 920, 1000, 410, { kind: 'cop', col: '#050607', flip: false }); figure(ctx, 1390, 1000, 405, { kind: 'coat', col: '#050607', flip: true });
    });
    L(ctx, 1, () => plate(ctx, 'РОСТОВСКИЙ АВТОВОКЗАЛ · 1984', 'проверка сотрудниками в штатском', 120, 930, tSame + .6));
  }, { tr: 'flash' });
  shot(tGl + .1, (ctx, lt, D) => {
    camera(lt, D, { z: [1.0, 1.1], x: [0, -40] }); bgDark(ctx, '12,16,22');
    const fadeOut = ap(tOrd + 1.6, 2.5, E.io);
    L(ctx, .4, () => { ctx.globalAlpha = fadeOut; figureGrid(ctx, 30, 10, 100, 420, 190, 330, -100, 1, { kind: i => i % 3 ? 'coat' : 'woman', col: '#46525e' }); ctx.globalAlpha = 1; });
    L(ctx, .9, () => {
      ctx.save(); ctx.globalAlpha = 1 - fadeOut * .85;
      print(ctx, 'chikatilo', 620, 520, 760, 560, { rot: -.02, kz: 1 + lt * .01, fx: .45, fy: .4 });
      ctx.restore();
      // document check
      const dq = ap(tDocs, .6, E.out);
      if (dq > 0 && NOW < tName + .2) { ctx.save(); ctx.globalAlpha = dq * (1 - ap(tName - .2, .4)); ctx.translate(1400, 560 + (1 - dq) * 200); ctx.rotate(.05);
        ctx.fillStyle = '#5a2b28'; ctx.fillRect(-230, -160, 460, 320); ctx.fillStyle = '#c9c3b5'; ctx.fillRect(-210, -140, 420, 280);
        ctx.fillStyle = '#2a2d31'; ctx.fillRect(-190, -120, 120, 150); font(ctx, F.mono, 26); ctx.textAlign = 'left'; ctx.fillText('ПАСПОРТ', -50, -90); for (let i = 0; i < 4; i++) ctx.fillRect(-50, -60 + i * 34, 200 - i * 20, 6);
        ctx.restore(); stamp(ctx, 'ОТПУЩЕН', 1400, 620, tLet + .1, { size: 90 }); }
      const out = ap(tOrd + 1.6, .6);
      ctx.save(); ctx.globalAlpha = 1 - out;
      plate(ctx, 'АНДРЕЙ ЧИКАТИЛО', null, 1110, 330, tName + .3);
      riseText(ctx, '— учитель по образованию', 1120, 470, tTeach, { f: F.serif, size: 46, align: 'left', col: C.white, dy: 15 });
      riseText(ctx, '— работник снабжения', 1120, 550, tSnab, { f: F.serif, size: 46, align: 'left', col: C.white, dy: 15 });
      riseText(ctx, '— отец семейства', 1120, 630, tFam, { f: F.serif, size: 46, align: 'left', col: C.white, dy: 15 });
      ctx.restore();
      riseText(ctx, 'НА НЕГО НИКТО НЕ СМОТРИТ', W / 2, 960, tNobody, { size: 70, wt: '700', ls: 8, col: C.red2 });
    });
  }, { tr: 'flash' });
  ev(tLet + .1, 'stamp');
  // 8. timeline arrest / verdict / execution
  const tArr = c('Арестовали его только'), t20 = c('двадцатого ноября'), tCourt2 = c('На суде'), t14 = c('Четырнадцатого февраля');
  shot(tArr - .2, (ctx, lt, D) => {
    camera(lt, D, { z: [1.0, 1.08], x: [-60, 60] }); bgDark(ctx, '14,18,24');
    L(ctx, .9, () => {
      timeline(ctx, [{ x: 420, label: '20.11.1990', sub: 'АРЕСТ', red: 0 }, { x: W / 2, label: '1992', sub: 'ПРИГОВОР: 52 УБИЙСТВА' }, { x: W - 420, label: '14.02.1994', sub: 'РАССТРЕЛ', red: 1 }], 560, [t20, tCourt2 + .3, t14 + .3], { x0: 220, x1: W - 220 });
    });
  }, { tr: 'smear' });
  ev(t20, 'tickone'); ev(tCourt2 + .3, 'tickone'); ev(t14 + .3, 'hit');
  shot(tCourt2 - .1, (ctx, lt, D) => {
    camera(lt, D, { z: [1.15, 1.35], y: [-100, 60], x: [40, -20] }); deskBg(ctx, .4);
    L(ctx, .9, () => {
      print(ctx, 'verdict', W / 2, H / 2 + 40, 760, 1040, { rot: .015, border: 0 });
      const hq = ap(tCourt2 + 1.2, .8, E.io); ctx.fillStyle = 'rgba(226,68,60,.28)'; ctx.fillRect(W / 2 - 360, H / 2 - 130, 700 * hq, 46);
    });
    L(ctx, 1, () => plate(ctx, 'ПРИГОВОР, 1992', 'Ростовский областной суд', 120, 940, tCourt2 + .5));
  }, { tr: 'fade', td: .5 });
  shot(t14 - .1, (ctx, lt, D) => {
    camera(lt, D, { z: [1.0, 1.08], x: [-60, 60] }); bgDark(ctx, '14,18,24');
    L(ctx, .9, () => {
      timeline(ctx, [{ x: 420, label: '20.11.1990', sub: 'АРЕСТ' }, { x: W / 2, label: '1992', sub: 'ПРИГОВОР: 52 УБИЙСТВА' }, { x: W - 420, label: '14.02.1994', sub: 'РАССТРЕЛ', red: 1 }], 560, [t14 - 5, t14 - 5, t14 + .3], { x0: 220, x1: W - 220 });
      stamp(ctx, 'ПРИГОВОР ИСПОЛНЕН', W / 2, 860, t14 + 2.6, { size: 70 });
    });
  }, { tr: 'fade', td: .4 });
  ev(t14 + 2.6, 'stamp');
  // 9. why 12 years -> scattered files
  const tWhy = c('Почему человек'), tBec = c('Потому что дела'), tBlind = c('слепотой к связям');
  shot(tWhy - .2, (ctx, lt, D) => {
    camera(lt, D, { z: [1.15, 1.0] }); bgDark(ctx, '12,16,22');
    L(ctx, .9, () => { counter(ctx, 12, W / 2 - 200, 520, tWhy + .3, { size: 380, d: 1.2 }); txt(ctx, 'ЛЕТ', W / 2 + 230, 590, { size: 160, wt: '700', a: ap(tWhy + .8, .5) }); riseText(ctx, 'НА СВОБОДЕ', W / 2, 820, tWhy + 1.6, { size: 80, wt: '500', ls: 20, col: C.cold }); });
  }, { tr: 'glitch', td: .4 });
  ev(tWhy + .3, 'tick', { d: 1.2 });
  shot(tBec - .2, (ctx, lt, D) => {
    camera(lt, D, { z: [1.0, 1.15], x: [-30, 50] }); seaBg(ctx);
    L(ctx, .7, () => {
      const [ix, iy, iw] = contain(ctx, PROC.rostov_map, 360, -40, 1200, 1100); const k = iw / 500;
      const pts = Object.keys(ROST).map(n => [ix + ROST[n][0] * k, iy + ROST[n][1] * k]);
      pts.forEach((p, i) => { const q = ap(tBec + .3 + i * .25, .4, E.back); folder(ctx, p[0], p[1] - 50, 110, 140, '', { s: q, rot: (hr(i) - .5) * .3, head: '№' + (i + 1) }); });
      // broken threads
      ctx.setLineDash([16, 18]); ctx.strokeStyle = 'rgba(226,68,60,.55)'; ctx.lineWidth = 3;
      for (let i = 0; i < pts.length - 1; i++) { const q = ap(tBec + 2.5 + i * .2, .4); if (q <= 0) continue; ctx.globalAlpha = q; ctx.beginPath(); ctx.moveTo(pts[i][0], pts[i][1] - 50); const mx = lerp(pts[i][0], pts[i + 1][0], .45), my = lerp(pts[i][1], pts[i + 1][1], .45) - 50; ctx.lineTo(mx, my); ctx.stroke(); }
      ctx.setLineDash([]); ctx.globalAlpha = 1;
    });
    L(ctx, 1, () => stamp(ctx, 'СЛЕПОТА К СВЯЗЯМ', W / 2, 900, tBlind + .4, { size: 90, rot: -.04 }));
  }, { tr: 'fade', td: .6 });
  ev(tBlind + .4, 'stamp');
  // 10. USSR objection -> "МОГЛО."
  const tUSSR = c('Но это Советский Союз'), tCards = c('Бумажные картотеки'), tAm = c('В Америке'), tCould = c('Могло'), tThere = c('И там убийца');
  shot(tUSSR - .2, (ctx, lt, D) => {
    camera(lt, D, { z: [1.0, 1.12], x: [60, -60] }); archive(ctx, lt);
    L(ctx, 1, () => { ctx.fillStyle = 'rgba(4,5,7,.6)'; ctx.fillRect(0, 380, W, 300); riseText(ctx, 'БУМАЖНЫЕ КАРТОТЕКИ', W / 2, 520, tCards, { size: 90, wt: '700', ls: 8 }); riseText(ctx, 'НИКАКОГО ИНТЕРНЕТА', W / 2, 620, tCards + 1, { f: F.mono, size: 44, col: C.cold }); });
  }, { tr: 'paper', td: .8 });
  shot(tAm - .2, (ctx, lt, D) => {
    camera(lt, D, { z: [1.0, 1.06] }); ctx.fillStyle = '#040506'; ctx.fillRect(0, 0, W, H);
    L(ctx, 1, () => {
      const o2 = ap(tCould - .1, .2);
      txt(ctx, '«В АМЕРИКЕ ТАК НЕ МОГЛО БЫТЬ»', W / 2, 420, { f: F.serif, size: 64, col: C.cold, a: ap(tAm, .5) * (1 - o2 * .6) });
      slamText(ctx, 'МОГЛО.', W / 2, 700, tCould, { size: 260, wt: '700', col: C.red2, glow: C.red, gb: 50 });
    });
  }, { tr: 'glitch', td: .35, lb: 1 });
  ev(tCould, 'boom');
  window.__s3end = tThere;
};

window.s4 = function () {
  const S = 4, c = (p, n) => cue(S, p, n);
  const tThere = window.__s3end;
  const t0 = SC(4).t0, tGreen = c('В реке Грин'), tNick = c('Так появляется прозвище'), tKill = c('Убийца с реки');
  const US = f => ({ fill: f.id === 'Washington' ? '#2a3542' : '#141a21', stroke: 'rgba(142,162,181,.35)', lw: 1.2 });
  shot(tThere + .3, (ctx, lt, D) => {
    camera(lt, D, { hand: .5 }); seaBg(ctx);
    const P = geoCam(lt, D, { lon: -96, lat: 39, s: 17 }, { lon: -120.5, lat: 47.3, s: 95 });
    drawGeo(ctx, GEO.us, P, US);
    const [x, y] = P(-122.25, 47.38); pulse(ctx, x, y, t0 + .5, { R: 80 });
    const [lx, ly] = P(-120.5, 47.6);
    mapLabel(ctx, 'ШТАТ ВАШИНГТОН', lx, ly, t0 + .2, { size: 54, col: C.white });
    slamText(ctx, 'ЛЕТО 1982', 1600, 980, t0 + 1.2, { size: 90, wt: '700', col: C.red2 });
  }, { tr: 'smear', dir: 1 });
  ev(t0 + 1.2, 'hit');
  shot(tGreen - .2, (ctx, lt, D) => {
    camera(lt, D, { z: [1.0, 1.18], x: [80, -40], y: [0, -20] }); seaBg(ctx);
    L(ctx, .85, () => {
      const r = contain(ctx, PROC.green_map, 260, -60, 1400, 1200);
      const p = ap(tGreen + .2, 3, E.io);
      ctx.save(); ctx.beginPath(); ctx.rect(r[0] + r[2] * (1 - p), r[1], r[2] * p, r[3]); ctx.clip();
      ctx.globalCompositeOperation = 'lighter'; ctx.globalAlpha = .55 + .25 * Math.sin(NOW * 3); ctx.filter = 'blur(6px)'; ctx.drawImage(RIVER, r[0], r[1], r[2], r[3]); ctx.filter = 'none'; ctx.globalAlpha = .9; ctx.drawImage(RIVER, r[0], r[1], r[2], r[3]);
      ctx.restore();
      const k = r[2] / 330; [[95, 110], [102, 140], [80, 98]].forEach(([px, py], i) => pulse(ctx, r[0] + px * k, r[1] + py * k, tGreen + 1.2 + i * .4, { r: 7, R: 40 }));
    });
    L(ctx, 1, () => plate(ctx, 'РЕКА ГРИН', 'округ Кинг, штат Вашингтон', 120, 940, tGreen + .3));
  }, { tr: 'fade', td: .6 });
  shot(tNick - .1, (ctx, lt, D) => {
    camera(lt, D, { z: [1.12, 1.0] }); ctx.fillStyle = '#040506'; ctx.fillRect(0, 0, W, H);
    L(ctx, .4, () => { ctx.globalAlpha = .18; contain(ctx, PROC.green_map, 260, -60, 1400, 1200); ctx.globalAlpha = .6; contain(ctx, RIVER, 260, -60, 1400, 1200); ctx.globalAlpha = 1; ctx.fillStyle = 'rgba(0,0,0,.55)'; ctx.fillRect(0, 0, W, H); });
    L(ctx, 1, () => { trackText(ctx, 'УБИЙЦА С РЕКИ ГРИН', W / 2, 580, tKill, { f: F.play, size: 130, wt: '700', ls: 6, ls0: 40, d: 1.6 }); riseText(ctx, 'GREEN RIVER KILLER', W / 2, 680, tKill + .8, { f: F.mono, size: 34, col: C.cold }); });
  }, { tr: 'fade', td: .5, lb: 1 });
  ev(tKill, 'boomlow');
  // roadside
  const tNext = c('Следующие годы'), tMiss = c('Тех чьё исчезновение');
  shot(tNext - .2, (ctx, lt, D) => {
    camera(lt, D, { x: [-100, 100], z: [1.05, 1.12] });
    ctx.fillStyle = '#05070a'; ctx.fillRect(0, 0, W, H);
    L(ctx, .3, () => { const g = ctx.createLinearGradient(0, 0, 0, 700); g.addColorStop(0, '#0a0f15'); g.addColorStop(1, '#141c26'); ctx.fillStyle = g; ctx.fillRect(-300, -200, W + 600, 900); });
    L(ctx, .6, () => {
      ctx.fillStyle = '#0a0d11'; ctx.fillRect(-400, 640, W + 800, 500); ctx.fillStyle = '#121820'; ctx.fillRect(-400, 760, W + 800, 220);
      for (let i = -3; i < 14; i++) { ctx.fillStyle = 'rgba(200,205,210,.25)'; ctx.fillRect(i * 200 - (NOW * 40) % 200, 862, 90, 6); }
      for (let i = 0; i < 5; i++) { const x = 100 + i * 460; ctx.fillStyle = '#020304'; ctx.fillRect(x, 260, 10, 400); ctx.fillRect(x, 260, 80, 8); ctx.save(); ctx.globalCompositeOperation = 'lighter'; cone(ctx, x + 75, 268, 30, 300, 400, .16, '255,200,140'); ctx.restore(); }
    });
    L(ctx, .9, () => {
      [[420, 'woman'], [940, 'woman'], [1500, 'woman']].forEach(([x, k], i) => figure(ctx, x, 700, 280, { kind: k, col: '#06080a', rim: 'rgba(255,200,140,.5)' }));
      // headlights sweep
      const hx = ((NOW - tNext) * 900) % 4200 - 1200;
      ctx.save(); ctx.globalCompositeOperation = 'lighter'; spot(ctx, hx, 830, 300, .35, '230,235,255'); spot(ctx, hx + 120, 830, 300, .35, '230,235,255'); ctx.restore();
    });
    L(ctx, 1, () => { plate(ctx, 'НА ОБОЧИНЕ ОБЩЕСТВА', 'женщины, вынужденные работать на улице · ушедшие из дома девочки', 120, 940, tNext + 1.2, { size: 52 }); });
  }, { tr: 'smear' });
  ev(tNext, 'car', { d: 5 });
  shot(tMiss - .2, (ctx, lt, D) => {
    camera(lt, D, { z: [1.0, 1.15], x: [-60, 40] });
    policeWall(ctx, lt, { door: false, k: 0 });
    L(ctx, .8, () => {
      for (let i = 0; i < 7; i++) { const x = 260 + i * 220, y = 380 + hr(i) * 120, a = 1 - ap(tMiss + .8 + hr(i * 3) * 1.8, 1.4) * .75;
        ctx.save(); ctx.globalAlpha = a; ctx.translate(x, y); ctx.rotate((hr(i * 9) - .5) * .14); ctx.fillStyle = '#b9b4a8'; ctx.fillRect(-90, -120, 180, 240); ctx.drawImage(PAPER2, 0, 0, 300, 400, -90, -120, 180, 240);
        txt(ctx, 'ПРОПАЛА', 0, -80, { size: 34, wt: '700', col: '#1d1f22' }); ctx.fillStyle = '#2a2d31'; ctx.fillRect(-60, -60, 120, 120); bust(ctx, 0, 60, 110, { kind: 'woman', col: '#0d0f12' }); ctx.fillStyle = 'rgba(30,30,35,.5)'; ctx.fillRect(-60, 76, 120, 6); ctx.fillRect(-60, 92, 90, 6); ctx.restore(); }
      for (let i = 0; i < 3; i++) { const x = ((NOW - tMiss) * 140 + i * 700) % 2400 - 300; figure(ctx, x, 1060, 520, { kind: 'coat', walk: 1, phase: NOW * 5 + i, col: '#020304' }); }
    });
    L(ctx, 1, () => riseText(ctx, 'ИХ ИСЧЕЗНОВЕНИЕ РЕДКО ПРИНИМАЛИ ВСЕРЬЁЗ', W / 2, 160, tMiss + .5, { size: 56, wt: '600', ls: 4 }));
  }, { tr: 'paper', td: .8 });
  // own words
  const tSelf = c('Сам он потом'), tWords = c('Правило невидимости его');
  shot(tSelf - .2, (ctx, lt, D) => {
    camera(lt, D, { z: [1.0, 1.12], r: [.01, -.01] }); deskBg(ctx, .4);
    L(ctx, .9, () => {
      paperSheet(ctx, W / 2, H / 2, 1300, 760, .01);
      ctx.save(); ctx.translate(W / 2, H / 2); ctx.rotate(.01);
      txt(ctx, 'ИЗ ПРИЗНАНИЙ (ПЕРЕСКАЗ):', -560, -260, { f: F.mono, size: 32, align: 'left', col: '#5a2a26' });
      typeText(ctx, 'Считал, что может убить столько', -560, -150, tSelf + 2.2, { size: 52, col: '#1d2024', cps: 20, cursor: false });
      typeText(ctx, 'таких женщин, сколько захочет —', -560, -70, tSelf + 3.8, { size: 52, col: '#1d2024', cps: 20, cursor: false });
      typeText(ctx, 'и его не поймают.', -560, 10, tSelf + 5.4, { size: 52, col: '#1d2024', cps: 20 });
      ctx.restore();
      stamp(ctx, 'ПРАВИЛО НЕВИДИМОСТИ', W / 2 + 120, H / 2 + 230, tWords + .2, { size: 80 });
    });
  }, { tr: 'fade', td: .5 });
  ev(tSelf + 2.2, 'type', { d: 1.6 }); ev(tSelf + 3.8, 'type', { d: 1.6 }); ev(tSelf + 5.4, 'type', { d: .9 }); ev(tWords + .2, 'stamp');
  // who: Ridgway
  const tWho = c('Знаете кем'), tGary = c('Гэри Риджуэй'), t30 = c('Тридцать лет'), tWed = c('Был женат'), tRel = c('Был очень'), tNb = c('Сосед коллега');
  shot(tWho - .2, (ctx, lt, D) => {
    camera(lt, D, { z: [1.1, 1.0] }); ctx.fillStyle = '#030405'; ctx.fillRect(0, 0, W, H);
    L(ctx, 1, () => { bust(ctx, W / 2, 900, 600, { col: '#0c0f13', rim: 'rgba(142,162,181,.35)' }); txt(ctx, '?', W / 2, 560, { size: 300, wt: '700', col: C.red2, a: ap(tWho + .4, .4), glow: C.red }); });
  }, { tr: 'dip', td: .5 });
  shot(tGary - .05, (ctx, lt, D) => {
    camera(lt, D, { z: [1.0, 1.1], x: [-30, 30] }); deskBg(ctx, .4);
    L(ctx, .9, () => {
      print(ctx, 'ridgway', 560, 530, 540, 680, { rot: -.03, fy: .35 });
      plate(ctx, 'ГЭРИ РИДЖУЭЙ', 'фото: King County Sheriff, 2001', 960, 230, tGary + .2);
      const rows = [['truck', '30 ЛЕТ КРАСИЛ ГРУЗОВИКИ', t30], ['rings', 'ЖЕНАТ ТРИ РАЗА', tWed], ['person', 'ОЧЕНЬ РЕЛИГИОЗЕН', tRel]];
      rows.forEach(([ic, s, t], i) => { const q = ap(t, .5); icon(ctx, ic, 1020, 410 + i * 140, 80, { a: q, col: C.cold }); riseText(ctx, s, 1100, 435 + i * 140, t, { size: 52, wt: '500', align: 'left', ls: 3, dy: 20 }); });
      riseText(ctx, 'СОСЕД · КОЛЛЕГА · ОБЫЧНЫЙ ЧЕЛОВЕК', 1340, 900, tNb, { size: 46, wt: '600', ls: 4, col: C.red2 });
    });
  }, { tr: 'flash' });
  // suspicion, 55, saliva
  const t83 = c('Подозрения на него'), t55 = c('пятидесяти пяти'), t87 = c('В тысяча девятьсот восьмидесят седьмом'), tSal = c('образец слюны'), tStore = c('убрали в хранилище'), tLack = c('Улик для ареста'), tHome = c('Он вернулся домой');
  shot(t83 - .2, (ctx, lt, D) => {
    camera(lt, D, { z: [1.0, 1.12], x: [-50, 50] }); corkBg(ctx, .5);
    L(ctx, .85, () => {
      print(ctx, 'ridgway', 330, 400, 260, 330, { rot: -.06, pin: 1, a: ap(t83, .5) });
      stamp(ctx, 'ПОДОЗРЕВАЕМЫЙ', 340, 680, t83 + 1.4, { size: 54, sub: '1983' });
      for (let i = 0; i < 55; i++) { const cl = i % 11, rw = Math.floor(i / 11); const q = ap(t55 - .6 + i * .03, .3, E.back); if (q <= 0) continue; ctx.save(); ctx.translate(720 + cl * 100, 260 + rw * 130); ctx.scale(q, q); ctx.fillStyle = '#d8d3c5'; ctx.fillRect(-38, -50, 76, 100); icon(ctx, 'person', 0, 0, 60, { col: '#2a2d31' }); ctx.restore(); pin(ctx, 720 + cl * 100, 260 + rw * 130 - 42); }
    });
    L(ctx, 1, () => { ctx.fillStyle = 'rgba(4,5,7,.7)'; ctx.fillRect(0, 900, W, 150); counter(ctx, 55, 760, 975, t55, { size: 110, d: 1.3 }); txt(ctx, 'ЧЕЛОВЕК В ГРУППЕ РОЗЫСКА', 1220, 1000, { size: 56, wt: '500', ls: 4, a: ap(t55 + .4, .5) }); });
  }, { tr: 'paper', td: .8 });
  ev(t83 + 1.4, 'stamp'); ev(t55, 'tick', { d: 1.3 });
  shot(t87 - .2, (ctx, lt, D) => {
    camera(lt, D, { z: [1.05, 1.18], x: [0, 80] }); archive(ctx, lt);
    L(ctx, 1, () => {
      const p = ap(tStore, 1.4, E.io);
      ctx.save(); ctx.translate(lerp(W / 2, W / 2 + 520, p), lerp(560, 420, p)); ctx.scale(lerp(1, .35, p), lerp(1, .35, p)); ctx.rotate(lerp(-.04, .1, p));
      ctx.shadowColor = 'rgba(0,0,0,.8)'; ctx.shadowBlur = 40; ctx.fillStyle = '#b5ab92'; ctx.fillRect(-330, -210, 660, 420); ctx.shadowColor = 'transparent';
      ctx.drawImage(PAPER2, 0, 0, 600, 400, -330, -210, 660, 420); ctx.strokeStyle = 'rgba(60,50,30,.6)'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(-330, -210); ctx.lineTo(0, 30); ctx.lineTo(330, -210); ctx.stroke();
      txt(ctx, 'ОБРАЗЕЦ СЛЮНЫ', 0, 110, { f: F.osw, size: 60, wt: '700', col: '#1f1d18', a: ap(tSal, .4) }); txt(ctx, '1987', 0, 170, { f: F.mono, size: 44, col: '#5a2a26', a: ap(tSal + .3, .4) });
      ctx.restore();
      stamp(ctx, 'УЛИК НЕДОСТАТОЧНО', W / 2 - 200, 820, tLack + .2, { size: 80 });
    });
  }, { tr: 'fade', td: .6 });
  ev(tStore, 'paper'); ev(tLack + .2, 'stamp');
  shot(tHome - .2, (ctx, lt, D) => { camera(lt, D, { z: [1.0, 1.1] }); houseNight(ctx, lt, { figure: 0 }); L(ctx, 1, () => riseText(ctx, 'И ЖИЛ ДАЛЬШЕ', W / 2, 960, tHome + .5, { size: 60, wt: '500', ls: 14, col: C.cold })); }, { tr: 'fade', td: .6, lb: 1 });
  // 14 years -> DNA match
  const t14 = c('Четырнадцать лет спустя'), tDNA = c('новые методы'), tCmp = c('Старый образец'), tMatch = c('Совпало');
  shot(t14 - .2, (ctx, lt, D) => {
    camera(lt, D, { z: [1.0, 1.1] }); bgDark(ctx, '12,16,22');
    L(ctx, .9, () => {
      const p = ap(t14 + .2, 2.2, E.io); const y = Math.round(lerp(1987, 2001, p));
      txt(ctx, String(y), W / 2, 420, { size: 240, wt: '700', col: p >= 1 ? C.red2 : C.white, ls: 8 });
      txt(ctx, '+14 ЛЕТ', W / 2, 520, { f: F.mono, size: 40, col: C.cold, a: ap(t14 + 2.4, .4) });
      const sep = 1 - ap(tCmp + 1.5, 2.3, E.io);
      const rv = ap(tDNA, 1.2);
      helix(ctx, W / 2, 760 - sep * 110, 1300, 70, NOW, { reveal: rv, n: 30 });
      helix(ctx, W / 2, 760 + sep * 110, 1300, 70, NOW, { reveal: ap(tCmp, 1.2), n: 30, col: '#c9a65a', a: .9 });
      if (NOW > tCmp) { txt(ctx, 'ОБРАЗЕЦ 1987', 260, 760 - sep * 110 - 100, { f: F.mono, size: 30, col: C.cold, align: 'left', a: sep }); txt(ctx, 'СЛЕДЫ НА РАННИХ ДЕЛАХ', 260, 760 + sep * 110 + 130, { f: F.mono, size: 30, col: '#c9a65a', align: 'left', a: sep }); }
    });
  }, { tr: 'glitch', td: .4 });
  ev(t14 + .2, 'tick', { d: 2.2 }); ev(tDNA, 'scan', { d: 2 });
  shot(tMatch - .05, (ctx, lt, D) => {
    camera(lt, D, { z: [1.1, 1.0] }); bgDark(ctx, '20,14,14');
    L(ctx, .9, () => { helix(ctx, W / 2, 560, 1400, 90, NOW, { n: 34, col: C.red2, col2: '#ffb3a8' }); stamp(ctx, 'СОВПАЛО', W / 2, 560, tMatch + .05, { size: 170, col: '#f0e6e0', rot: -.05 }); });
  }, { tr: 'flash' });
  ev(tMatch + .05, 'stampbig');
  // arrest 30.11.2001, 49
  const tArr = c('Тридцатого ноября'), t49 = c('сорока девяти'), tMore = c('А в беседах');
  shot(tArr - .2, (ctx, lt, D) => {
    camera(lt, D, { z: [1.0, 1.15], x: [-40, 60] });
    ctx.fillStyle = '#06080b'; ctx.fillRect(0, 0, W, H);
    L(ctx, .4, () => { ctx.fillStyle = '#0d1116'; ctx.fillRect(-200, 200, 1200, 500); for (let i = 0; i < 3; i++) { ctx.fillRect(100 + i * 260, 40, 70, 200); } ctx.fillStyle = 'rgba(220,190,120,.35)'; for (let i = 0; i < 10; i++) ctx.fillRect(-100 + i * 110, 320, 60, 40); });
    L(ctx, .7, () => { ctx.strokeStyle = '#2a333d'; ctx.lineWidth = 8; for (let i = 0; i < 26; i++) { ctx.beginPath(); ctx.moveTo(-200 + i * 60, 520); ctx.lineTo(-200 + i * 60, 900); ctx.stroke(); } ctx.fillStyle = '#2a333d'; ctx.fillRect(-200, 520, 1700, 14); ctx.fillRect(-200, 700, 1700, 10); ctx.fillStyle = '#0a0c0f'; ctx.fillRect(-300, 900, W + 600, 300); });
    L(ctx, .9, () => { figure(ctx, 760, 960, 380, { kind: 'coat', col: '#010203', rim: 'rgba(142,162,181,.6)' }); });
    L(ctx, 1, () => {
      ctx.fillStyle = 'rgba(4,5,7,.75)'; ctx.fillRect(1180, 150, 620, 700);
      riseText(ctx, '30.11.2001', 1490, 300, tArr + .2, { size: 90, wt: '700' }); riseText(ctx, 'АРЕСТ У ВОРОТ ЗАВОДА', 1490, 370, tArr + .6, { f: F.mono, size: 30, col: C.cold, dy: 15 });
      counter(ctx, 49, 1490, 560, t49, { size: 260, d: 1.4, col: C.red2 }); txt(ctx, 'ПРИЗНАЛ ВИНУ', 1490, 730, { size: 50, wt: '500', ls: 6, a: ap(t49 + .3, .5) });
      riseText(ctx, '…а называл ещё больше', 1490, 810, tMore + .3, { f: F.serif, size: 38, col: C.cold, dy: 15 });
    });
  }, { tr: 'smear' });
  ev(tArr + .2, 'hit'); ev(t49, 'tick', { d: 1.4 });
  // asked Bundy
  const tInc = c('И вот что почти'), tBundy = c('Теду Банди'), tDiff = c('А Банди выбирал'), tSeen = c('Он выбирал тех');
  shot(tInc - .2, (ctx, lt, D) => {
    camera(lt, D, { z: [1.0, 1.2], y: [0, -30] }); ctx.fillStyle = '#050608'; ctx.fillRect(0, 0, W, H);
    L(ctx, .4, () => { ctx.globalAlpha = ap(tBundy, 1.2) * .85; print(ctx, 'bundy', W / 2, 470, 500, 640, { border: 0 }); ctx.globalAlpha = 1; });
    L(ctx, .7, () => { ctx.fillStyle = '#0b0d10'; for (let i = 0; i < 14; i++) { ctx.fillRect(i * 150 - 50, -200, 34, H + 400); ctx.fillStyle = 'rgba(142,162,181,.18)'; ctx.fillRect(i * 150 - 50, -200, 6, H + 400); ctx.fillStyle = '#0b0d10'; } ctx.fillRect(-200, 120, W + 400, 30); ctx.fillRect(-200, 820, W + 400, 30); });
    L(ctx, 1, () => { plate(ctx, 'ТЕД БАНДИ', 'камера смертников, Флорида', 120, 960, tBundy + .2); riseText(ctx, 'СЛЕДОВАТЕЛИ ПРОСИЛИ СОВЕТА У УБИЙЦЫ', W / 2, 110, tInc + 2.4, { size: 54, wt: '600', ls: 4 }); });
  }, { tr: 'dip', td: .7, lb: 1 });
  ev(tInc, 'drone_swell', { d: 8 });
  shot(tDiff - .2, (ctx, lt, D) => {
    camera(lt, D, { z: [1.0, 1.1] }); bgDark(ctx, '14,18,24');
    L(ctx, .9, () => {
      figureGrid(ctx, 12, 12, 300, 760, 120, 240, -10, 1, { kind: () => 'woman', col: '#4b5866' });
      const q = ap(tSeen + .3, .6);
      ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.globalAlpha = q; cone(ctx, 300 + 5 * 120, 0, 40, 260, 800, .25); ctx.restore();
      figure(ctx, 300 + 5 * 120, 760, 240 * .82, { kind: 'woman', col: '#e6ecf2', a: q });
      riseText(ctx, 'ТЕХ, КОГО ЗАМЕТИЛИ БЫ СРАЗУ', W / 2, 220, tSeen + .3, { size: 74, wt: '700', ls: 4 });
      riseText(ctx, '…и всё равно оставался на свободе', W / 2, 320, tSeen + 2.6, { f: F.serif, size: 46, col: C.red2 });
    });
  }, { tr: 'fade', td: .6 });
  window.__s4end = cue(4, 'И всё равно');
};
