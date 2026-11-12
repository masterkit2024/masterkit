// ===== layered paper dioramas =====
const K = require('./core'); const Pp = require('./paper'); const X = require('./sets');
const { W, H, F, clamp, lerp, E, hr, S, tw, twos, L, font, Path2D, noise1, mulberry } = K;
const { P, put, sheet, cached, shade } = Pp;

function hillStrip(key, w, h, col, seed, amp = 60) { return cached('hill|' + key, () => Pp.sprite(w, h, 10, (x) => { const r = mulberry(seed); const p = new Path2D(); p.moveTo(0, h); for (let i = 0; i <= 40; i++) p.lineTo(i / 40 * w, amp * (.5 + .5 * noise1(i * .25 + seed)) + r() * 4); p.lineTo(w, h); p.closePath(); x.fillStyle = col; x.fill(p); x.save(); x.clip(p); Pp.texturize(x, w, h, .55, seed); const g = x.createLinearGradient(0, 0, 0, h); g.addColorStop(0, 'rgba(255,255,255,.12)'); g.addColorStop(1, 'rgba(0,0,0,.25)'); x.fillStyle = g; x.fillRect(0, 0, w, h); x.restore(); x.strokeStyle = 'rgba(255,255,255,.35)'; x.lineWidth = 2; x.stroke(p); })); }
function rain(ctx, k = 1, seed = 1) { // rain streaks on glass, on twos
  const T = twos(); ctx.save(); ctx.globalCompositeOperation = 'screen';
  for (let i = 0; i < 90 * k; i++) { const x = hr(i * 3 + seed) * W, sp = 900 + hr(i) * 600, len = 30 + hr(i * 7) * 60; const y = ((hr(i * 5 + seed) * H + T * sp) % (H + 200)) - 100; ctx.strokeStyle = `rgba(200,220,235,${.10 + hr(i * 11) * .18})`; ctx.lineWidth = 1 + hr(i) * 1.4; ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x - len * .12, y + len); ctx.stroke(); }
  for (let i = 0; i < 26 * k; i++) { const x = hr(i * 13 + seed) * W, y = ((hr(i * 17) * H + T * (20 + hr(i) * 40)) % H); const r = 3 + hr(i * 19) * 7; const g = ctx.createRadialGradient(x - r * .3, y - r * .3, 0, x, y, r); g.addColorStop(0, 'rgba(230,240,250,.35)'); g.addColorStop(1, 'rgba(230,240,250,0)'); ctx.fillStyle = g; ctx.beginPath(); ctx.arc(x, y, r, 0, 7); ctx.fill(); }
  ctx.restore();
}
function fog(ctx, a = .25, col = '160,175,180') { for (let i = 0; i < 3; i++) { const y = H * (.45 + i * .15) + Math.sin(S.T * .2 + i) * 20; const g = ctx.createLinearGradient(0, y - 120, 0, y + 120); g.addColorStop(0, `rgba(${col},0)`); g.addColorStop(.5, `rgba(${col},${a})`); g.addColorStop(1, `rgba(${col},0)`); ctx.fillStyle = g; ctx.fillRect(0, y - 120, W, 240); } }

// ---- station (dark) ----
function station(ctx, lt, o = {}) {
  const wall = cached('st_wall', () => sheet({ w: W + 500, h: 760, color: '#26344d', seed: 101, tex: .65, burn: .5 }));
  const win = cached('st_win', () => sheet({ w: W + 500, h: 760, color: '#8fa3ad', seed: 102, tex: .5 }));
  L(ctx, .25, () => { put(ctx, win, W / 2, 330, { shadow: 0 }); X.vellumCone(ctx, W / 2, -50, 600, 1400, 900, .08, '220,230,240'); });
  L(ctx, .35, () => { // wall with arches cut out (draw wall then arches as darker frame)
    const arches = cached('st_arches', () => { const c = K.mk(W + 500, 760), x = c.getContext('2d'); x.drawImage(wall.c, 0, 0); x.globalCompositeOperation = 'destination-out'; for (let i = 0; i < 6; i++) { const ax = 120 + i * 400; x.beginPath(); x.moveTo(ax, 700); x.lineTo(ax, 300); x.arc(ax + 130, 300, 130, Math.PI, 0); x.lineTo(ax + 260, 700); x.closePath(); x.fill(); } return { c, w: W + 500, h: 760, pad: 8 }; });
    put(ctx, arches, W / 2, 330, {});
    for (let i = 0; i < 6; i++) { const ax = 120 + i * 400 - (W + 500) / 2 + W / 2; ctx.fillStyle = 'rgba(20,28,40,.9)'; for (let k = 1; k < 4; k++) ctx.fillRect(ax + k * 65, 200, 7, 500); ctx.fillRect(ax, 420, 260, 7); ctx.fillRect(ax, 560, 260, 7); }
    // clock & board
    put(ctx, cached('st_clock', () => Pp.cutout('clock', 180, 180, (x, part) => { const p = new Path2D(); p.arc(90, 90, 86, 0, 7); part(p, '#1a2333'); const p2 = new Path2D(); p2.arc(90, 90, 70, 0, 7); part(p2, '#efe6d2'); })), 1500, 160, {});
    ctx.save(); ctx.translate(1500, 160); const mm = S.T / 60 * Math.PI * 2 * 3; ctx.strokeStyle = '#1d2433'; ctx.lineWidth = 6; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(Math.sin(mm) * 52, -Math.cos(mm) * 52); ctx.stroke(); ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(Math.sin(mm / 12 + 1) * 34, -Math.cos(mm / 12 + 1) * 34); ctx.stroke(); ctx.restore();
    const board = cached('st_board' + (o.board || []).join(), () => Pp.cutout('board' + (o.board || []).join(), 640, 220, (x, part) => { part(X.R(0, 0, 640, 220, 8), '#141b26'); font(x, F.mono, 34, '700'); x.fillStyle = '#f2c14e'; (o.board || ['ОТПРАВЛЕНИЕ', 'ШАХТЫ        14:20', 'НОВОЧЕРКАССК 14:35', 'ТАГАНРОГ     14:52']).forEach((s, i) => x.fillText(s, 26, 48 + i * 48)); }));
    put(ctx, board, 760, 160, {});
  });
  // train on the left (mid)
  L(ctx, .55, () => { const tr = cached('st_train', () => Pp.cutout('train', 900, 330, (x, part) => { part(X.R(0, 30, 900, 280, 30), '#3d4d3c'); part(X.R(0, 220, 900, 40, 0), '#9e2b2b'); for (let i = 0; i < 6; i++) part(X.R(40 + i * 140, 80, 100, 90, 8), '#e8c070'); part(X.R(0, 290, 900, 30, 6), '#1a1f2b'); })); put(ctx, tr, -60 + (o.trainX || 0), 610, {}); });
  // platform
  L(ctx, .65, () => { const pl = cached('st_pl', () => sheet({ w: W + 700, h: 420, color: '#4a5568', seed: 103, tex: .6 })); put(ctx, pl, W / 2, 940, {}); ctx.fillStyle = 'rgba(242,193,78,.75)'; ctx.fillRect(-300, 742, W + 600, 10); });
  // crowd (on twos), 2 depth rows
  const T = twos(); const fade = o.fade || 0;
  [[.75, 760, 230, 12, 60], [1.0, 900, 330, 8, 85], [1.25, 1120, 520, 4, 130]].forEach(([d, y, h, n, sp], row) => L(ctx, d, () => {
    for (let i = 0; i < n; i++) { const dir = hr(i * 3 + row) < .5 ? 1 : -1; const span = W + 700; const x = ((hr(i + row * 9) * span + dir * T * sp * (.7 + hr(i * 7) * .6)) % span + span) % span - 350;
      const kind = hr(i * 11 + row) < .35 ? 'woman' : 'coat'; const pose = 1 + (Math.floor(T * 6 + i) % 3);
      X; Pp.putPerson(ctx, kind, x, y + hr(i) * 20, h * (.9 + hr(i * 5) * .15), { color: row === 2 ? '#0d121c' : row === 1 ? '#1a2334' : '#2b3850', pose, flip: dir < 0, a: 1 - fade * (hr(i * 9 + row) < .7 ? .85 : 0) }); }
  }));
}
// ---- night street (Milwaukee) ----
function nightStreet(ctx, lt, o = {}) {
  const sky = cached('ns_sky', () => sheet({ w: W + 600, h: H + 400, color: '#0f1830', seed: 111, tex: .6, grad: false }));
  L(ctx, .2, () => { put(ctx, sky, W / 2, H / 2, { shadow: 0 }); });
  L(ctx, .35, () => { for (let i = 0; i < 7; i++) { const b = cached('ns_b' + i, () => Pp.cutout('nsb' + i, 300, 700, (x, part) => { part(X.R(0, 60 + hr(i) * 120, 300, 700, 0), shade('#1b2742', hr(i) * .2 - .1)); for (let r = 0; r < 8; r++) for (let c2 = 0; c2 < 3; c2++) { const on = hr(i * 31 + r * 7 + c2) < .25; part(X.R(30 + c2 * 90, 120 + hr(i) * 120 + r * 70, 50, 40, 2), on ? '#e8b85a' : '#121a2e', { sb: 2 }); } })); put(ctx, b, -200 + i * 330, 430, {}); } });
  L(ctx, .55, () => { const wall = cached('ns_wall', () => sheet({ w: W + 700, h: 520, color: '#232f48', seed: 112, tex: .65, burn: .4 })); put(ctx, wall, W / 2, 760, {}); for (let i = 0; i < 6; i++) { ctx.fillStyle = 'rgba(10,14,24,.5)'; ctx.fillRect(-300 + i * 420, 560, 240, 6); } });
  // police gels on walls
  const pk = o.police || 0; if (pk > 0) { const ph = S.T * 4.2; const red = Math.max(0, Math.sin(ph)), blue = Math.max(0, Math.sin(ph + Math.PI)); ctx.save(); ctx.globalCompositeOperation = 'screen'; L(ctx, .5, () => { let g = ctx.createRadialGradient(500 + Math.sin(S.T * 2) * 200, 520, 20, 500, 520, 900); g.addColorStop(0, `rgba(235,40,50,${.55 * red * pk})`); g.addColorStop(1, 'rgba(235,40,50,0)'); ctx.fillStyle = g; ctx.fillRect(-400, -200, W + 800, H + 400); g = ctx.createRadialGradient(1400 + Math.cos(S.T * 2) * 200, 540, 20, 1400, 540, 900); g.addColorStop(0, `rgba(50,100,255,${.5 * blue * pk})`); g.addColorStop(1, 'rgba(50,100,255,0)'); ctx.fillStyle = g; ctx.fillRect(-400, -200, W + 800, H + 400); }); ctx.restore(); }
  L(ctx, .8, () => { const sl = X.prop('streetLamp'); put(ctx, sl, 1380, 560, {}); X.vellumCone(ctx, 1380, 135, 60, 700, 900, .2, '255,220,160'); ctx.save(); ctx.globalCompositeOperation = 'screen'; ctx.scale(1, .26); const g = ctx.createRadialGradient(1380, 1000 / .26, 10, 1380, 1000 / .26, 420); g.addColorStop(0, 'rgba(255,215,150,.35)'); g.addColorStop(1, 'rgba(255,215,150,0)'); ctx.fillStyle = g; ctx.fillRect(900, 0, 1000, 6000); ctx.restore();
    const road = cached('ns_road', () => sheet({ w: W + 800, h: 260, color: '#141c2c', seed: 113, tex: .6 })); put(ctx, road, W / 2, 1120, {}); });
}
// ---- amber room (Bundy) ----
function amberRoom(ctx, lt, o = {}) {
  const wall = cached('ar_wall', () => sheet({ w: W + 600, h: H + 400, color: '#4a3426', seed: 121, tex: .7, grad: false, burn: .5, stain: 3 }));
  L(ctx, .25, () => { put(ctx, wall, W / 2, H / 2, { shadow: 0 }); const wnd = cached('ar_win', () => Pp.cutout('arwin', 460, 420, (x, part) => { part(X.R(0, 0, 460, 420, 6), '#2b1d14'); part(X.R(24, 24, 412, 372, 4), '#16223a'); for (let i = 0; i < 18; i++) { x.fillStyle = `rgba(240,200,120,${.3 + hr(i) * .5})`; x.fillRect(40 + hr(i * 3) * 380, 220 + hr(i * 5) * 150, 8, 10); } x.fillStyle = '#2b1d14'; x.fillRect(222, 24, 16, 372); x.fillRect(24, 200, 412, 16); })); put(ctx, wnd, 1450, 330, {}); });
  L(ctx, .6, () => { const desk = cached('ar_desk', () => sheet({ w: W + 700, h: 400, color: '#5a3a26', seed: 122, tex: .7, stain: 2 })); put(ctx, desk, W / 2, 1000, {}); put(ctx, X.prop('deskLamp'), 520, 640, { s: .9 }); put(ctx, X.prop('rotaryPhone'), 1020 + (o.ring && Math.floor(S.T * 16) % 2 ? 3 : 0), 760, { rot: -.03 }); });
  X.lampLight(ctx, 520, 600, 900, '255,180,90', 1, .55);
}
// ---- roadside (Ridgway) ----
function roadside(ctx, lt, o = {}) {
  const sky = cached('rs_sky', () => sheet({ w: W + 600, h: H + 400, color: '#1e2b2a', seed: 131, tex: .6, grad: false }));
  L(ctx, .2, () => put(ctx, sky, W / 2, H / 2, { shadow: 0 }));
  L(ctx, .35, () => put(ctx, hillStrip('rs_h1', W + 700, 360, '#2a3b33', 7, 140), W / 2, 520, {}));
  L(ctx, .5, () => { put(ctx, hillStrip('rs_h2', W + 700, 300, '#33463a', 9, 80), W / 2, 640, {}); for (let i = 0; i < 5; i++) { const x = -100 + i * 480; ctx.fillStyle = '#0d1311'; ctx.fillRect(x, 300, 12, 420); ctx.fillRect(x, 300, 90, 10); X.vellumCone(ctx, x + 80, 310, 26, 300, 420, .16, '255,205,140'); } });
  L(ctx, .7, () => { const road = cached('rs_road', () => sheet({ w: W + 800, h: 360, color: '#1a2220', seed: 132, tex: .6 })); put(ctx, road, W / 2, 920, {}); for (let i = -3; i < 14; i++) { ctx.fillStyle = 'rgba(230,225,200,.55)'; ctx.fillRect(i * 200 - (S.T * 30) % 200, 900, 90, 8); } });
  L(ctx, .85, () => { [[420, 'woman'], [960, 'woman'], [1500, 'woman']].forEach(([x, k], i) => Pp.putPerson(ctx, k, x, 760, 300, { color: '#0b100e', rim: 'rgba(255,200,140,.5)', a: o.figA === undefined ? 1 : o.figA })); });
  const hx = ((S.T * 700) % 4200) - 1200; ctx.save(); ctx.globalCompositeOperation = 'screen'; for (const dx of [0, 140]) { const g = ctx.createRadialGradient(hx + dx, 900, 10, hx + dx, 900, 320); g.addColorStop(0, 'rgba(240,240,255,.4)'); g.addColorStop(1, 'rgba(240,240,255,0)'); ctx.fillStyle = g; ctx.fillRect(hx - 400, 500, 900, 800); } ctx.restore();
  fog(ctx, .12); rain(ctx, .8, 3);
}
// ---- paper ocean ----
function ocean(ctx, lt) {
  const sky = cached('oc_sky', () => sheet({ w: W + 600, h: H + 400, color: '#1f3b4a', seed: 141, tex: .6, grad: false }));
  L(ctx, .2, () => put(ctx, sky, W / 2, H / 2, { shadow: 0 }));
  [[.35, 520, '#2a5566', 11], [.55, 640, '#2f6a74', 13], [.8, 780, '#3c7f80', 17], [1.05, 930, '#4f9a8f', 19]].forEach(([d, y, col, s], i) => L(ctx, d, () => { const sp = hillStrip('wave' + i, W + 900, 520, col, s, 50); put(ctx, sp, W / 2 + Math.sin(twos() * 1.2 + i) * 30 - twos() * 40 * (i + 1) % 300, y + Math.sin(twos() * 1.6 + i * 2) * 8, {}); }));
}
module.exports = { station, nightStreet, amberRoom, roadside, ocean, rain, fog, hillStrip };
