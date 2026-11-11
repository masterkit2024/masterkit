// ===== reusable sets / props =====
function corkBg(ctx, depth = .5) { L(ctx, depth, () => { ctx.drawImage(CORK, -340, -260); }); }
function deskBg(ctx, depth = .5) { L(ctx, depth, () => { ctx.drawImage(DESK, -240, -160); spot(ctx, W / 2, H / 2 - 60, 1100, .18); }); }

// index card with faceless bust
function bustCard(ctx, x, y, w, h, name, o = {}) {
  ctx.save(); ctx.translate(x, y); ctx.rotate(o.rot || 0); ctx.globalAlpha *= o.a === undefined ? 1 : o.a;
  ctx.shadowColor = 'rgba(0,0,0,.7)'; ctx.shadowBlur = 26; ctx.shadowOffsetY = 12;
  ctx.fillStyle = '#c9c5ba'; ctx.fillRect(-w / 2, -h / 2, w, h); ctx.shadowColor = 'transparent';
  ctx.drawImage(PAPER2, 0, 0, 400, 500, -w / 2, -h / 2, w, h);
  ctx.fillStyle = '#20242a'; ctx.fillRect(-w / 2 + 18, -h / 2 + 18, w - 36, h * .62);
  ctx.save(); ctx.beginPath(); ctx.rect(-w / 2 + 18, -h / 2 + 18, w - 36, h * .62); ctx.clip();
  if (o.photo) { ctx.globalAlpha *= o.photoA === undefined ? 1 : o.photoA; cover(ctx, PROC[o.photo], -w / 2 + 18, -h / 2 + 18, w - 36, h * .62, .5, .3); ctx.globalAlpha = o.a === undefined ? 1 : o.a; }
  else { spot(ctx, 0, -h / 2 + h * .25, w * .6, .25); bust(ctx, 0, -h / 2 + 18 + h * .62, h * .55, { kind: o.kind || 'man', col: '#0a0c0f', glasses: o.glasses }); }
  ctx.restore();
  ctx.fillStyle = '#1b1d21'; font(ctx, F.osw, h * .1, '600'); ctx.textAlign = 'center'; ctx.letterSpacing = '4px';
  ctx.fillText(name, 0, h / 2 - h * .14);
  if (o.sub) { font(ctx, F.mono, h * .055); ctx.letterSpacing = '0px'; ctx.fillStyle = '#3c3f45'; ctx.fillText(o.sub, 0, h / 2 - h * .055); }
  ctx.restore();
  pin(ctx, x + Math.sin(o.rot || 0) * h / 2, y - h / 2 + 16);
}

// case folder (closed or open) — x,y center
function folder(ctx, x, y, w, h, label, o = {}) {
  ctx.save(); ctx.translate(x, y); ctx.rotate(o.rot || 0); const s = o.s || 1; ctx.scale(s, s);
  ctx.globalAlpha *= o.a === undefined ? 1 : o.a;
  ctx.shadowColor = 'rgba(0,0,0,.75)'; ctx.shadowBlur = 40; ctx.shadowOffsetY = 18;
  ctx.fillStyle = o.col || '#8a7d62';
  ctx.beginPath(); ctx.moveTo(-w / 2, -h / 2 + 30); ctx.lineTo(-w / 2, h / 2); ctx.lineTo(w / 2, h / 2); ctx.lineTo(w / 2, -h / 2 + 30); ctx.lineTo(-w / 2 + w * .42, -h / 2 + 30); ctx.lineTo(-w / 2 + w * .38, -h / 2); ctx.lineTo(-w / 2 + 20, -h / 2); ctx.closePath(); ctx.fill();
  ctx.shadowColor = 'transparent';
  ctx.globalCompositeOperation = 'multiply'; ctx.drawImage(PAPER2, 0, 0, 900, 700, -w / 2, -h / 2, w, h); ctx.globalCompositeOperation = 'source-over';
  ctx.strokeStyle = 'rgba(30,25,15,.5)'; ctx.lineWidth = 2; ctx.strokeRect(-w / 2 + 24, -h / 2 + 70, w - 48, h - 100);
  font(ctx, F.osw, w * .07, '700'); ctx.fillStyle = '#1e1b15'; ctx.textAlign = 'left'; ctx.letterSpacing = '4px';
  ctx.fillText(o.head || 'ДЕЛО №', -w / 2 + 50, -h / 2 + 70 + w * .1);
  if (label) { font(ctx, F.mono, w * .055); ctx.letterSpacing = '0px'; ctx.fillText(label, -w / 2 + 50, -h / 2 + 70 + w * .2); }
  if (o.lines) { ctx.fillStyle = 'rgba(30,25,15,.35)'; for (let i = 0; i < o.lines; i++) ctx.fillRect(-w / 2 + 50, -h / 2 + 70 + w * .28 + i * w * .055, (w - 140) * (.6 + hr(i + w) * .4), 4); }
  ctx.restore();
}

// archive shelves receding
function archive(ctx, lt) {
  bgDark(ctx, '14,18,24');
  for (let layer = 0; layer < 3; layer++) {
    const d = .3 + layer * .35, sc = .6 + layer * .3, a = .35 + layer * .3;
    L(ctx, d, () => {
      ctx.save(); ctx.translate(W / 2, H / 2); ctx.scale(sc, sc); ctx.translate(-W / 2, -H / 2);
      for (let row = 0; row < 5; row++) {
        const y = 60 + row * 240 - layer * 60;
        ctx.fillStyle = `rgba(8,10,13,${a})`; ctx.fillRect(-600, y + 190, W + 1200, 22);
        let x = -600 + layer * 140;
        let k = row * 100 + layer * 1000;
        while (x < W + 600) {
          const w = 26 + hr(k) * 34, h = 150 + hr(k + 1) * 40; const v = 70 + hr(k + 2) * 50;
          ctx.fillStyle = `rgba(${v + 15},${v + 8},${v - 10},${a})`; ctx.fillRect(x, y + 190 - h, w - 3, h);
          ctx.fillStyle = `rgba(230,225,210,${a * .5})`; ctx.fillRect(x + 4, y + 190 - h + 20, w - 11, 14);
          x += w; k++;
        }
      }
      ctx.restore();
    });
  }
  // light beam
  ctx.save(); ctx.globalCompositeOperation = 'lighter';
  cone(ctx, W * .62, -100, 120, 900, 1300, .07); ctx.restore();
  motes(ctx, 50, 4, .5);
}

// train station hall with flowing crowd
function station(ctx, lt, o = {}) {
  ctx.fillStyle = '#080a0d'; ctx.fillRect(0, 0, W, H);
  L(ctx, .25, () => {
    // arched windows
    for (let i = 0; i < 6; i++) {
      const x = -300 + i * 470, y = 60;
      const g = ctx.createLinearGradient(0, y, 0, y + 560); g.addColorStop(0, 'rgba(140,165,190,.35)'); g.addColorStop(1, 'rgba(60,80,100,.05)');
      ctx.fillStyle = g; ctx.beginPath(); ctx.moveTo(x, y + 560); ctx.lineTo(x, y + 180); ctx.arc(x + 160, y + 180, 160, Math.PI, 0); ctx.lineTo(x + 320, y + 560); ctx.closePath(); ctx.fill();
      ctx.strokeStyle = 'rgba(5,6,8,.9)'; ctx.lineWidth = 6; for (let k = 1; k < 4; k++) { ctx.beginPath(); ctx.moveTo(x + k * 80, y + 30); ctx.lineTo(x + k * 80, y + 560); ctx.stroke(); }
      for (let k = 1; k < 5; k++) { ctx.beginPath(); ctx.moveTo(x, y + 140 + k * 100); ctx.lineTo(x + 320, y + 140 + k * 100); ctx.stroke(); }
    }
    // board
    ctx.fillStyle = '#0d1014'; ctx.fillRect(560, 120, 800, 210); ctx.strokeStyle = '#2a3440'; ctx.lineWidth = 4; ctx.strokeRect(560, 120, 800, 210);
    font(ctx, F.mono, 34); ctx.textAlign = 'left'; ctx.fillStyle = 'rgba(220,180,90,.85)';
    const rows = o.board || ['ОТПРАВЛЕНИЕ', 'ШАХТЫ        14:20', 'НОВОЧЕРКАССК 14:35', 'ТАГАНРОГ     14:52'];
    rows.forEach((r, i) => ctx.fillText(r, 590, 170 + i * 46));
    // clock
    ctx.save(); ctx.translate(1500, 230); ctx.fillStyle = '#d9dde2'; ctx.beginPath(); ctx.arc(0, 0, 60, 0, 7); ctx.fill(); ctx.strokeStyle = '#111'; ctx.lineWidth = 5;
    const mm = NOW / 60 * Math.PI * 2 * 4; ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(Math.sin(mm) * 46, -Math.cos(mm) * 46); ctx.stroke(); ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(Math.sin(mm / 12 + 1) * 30, -Math.cos(mm / 12 + 1) * 30); ctx.stroke(); ctx.restore();
  });
  // floor
  L(ctx, .5, () => {
    const g = ctx.createLinearGradient(0, 620, 0, H + 200); g.addColorStop(0, '#3a4652'); g.addColorStop(.35, '#1d242c'); g.addColorStop(1, '#050608'); ctx.fillStyle = g; ctx.fillRect(-400, 620, W + 800, 700);
    ctx.strokeStyle = 'rgba(140,160,180,.08)'; ctx.lineWidth = 2; for (let i = -10; i < 20; i++) { ctx.beginPath(); ctx.moveTo(W / 2 + i * 60, 620); ctx.lineTo(W / 2 + i * 260, H + 200); ctx.stroke(); }
  });
  // crowd: 3 depth bands
  const bands = [{ y: 720, h: 190, d: .6, n: 16, a: .55, sp: 70 }, { y: 860, h: 300, d: .85, n: 11, a: .85, sp: 95 }, { y: 1120, h: 520, d: 1.2, n: 5, a: 1, sp: 150 }];
  bands.forEach((b, bi) => L(ctx, b.d, () => {
    ctx.filter = bi === 2 ? 'blur(5px)' : bi === 0 ? 'blur(1.5px)' : 'none';
    for (let i = 0; i < b.n; i++) {
      const dir = hr(i * 3 + bi) < .5 ? 1 : -1, span = W + 800;
      const x = ((hr(i + bi * 50) * span + dir * NOW * b.sp * (.7 + hr(i * 7) * .6)) % span + span) % span - 400;
      const kind = hr(i * 11 + bi) < .35 ? 'woman' : (hr(i * 13 + bi) < .15 ? 'child' : 'coat');
      const hh = kind === 'child' ? b.h * .62 : b.h * (.9 + hr(i * 5) * .15);
      const fade = o.fade ? 1 - o.fade * (hr(i * 9 + bi) < .8 ? 1 : 0) : 1;
      figure(ctx, x, b.y + hr(i) * 30, hh, { kind, walk: 1, phase: NOW * 6 * (.8 + hr(i) * .3) + i, flip: dir < 0, col: bi === 2 ? '#040506' : `rgba(10,12,15,${b.a})`, a: fade });
    }
    ctx.filter = 'none';
  }));
  // haze
  const hz = ctx.createLinearGradient(0, 400, 0, 900); hz.addColorStop(0, 'rgba(80,100,120,0)'); hz.addColorStop(.6, 'rgba(80,100,120,.12)'); hz.addColorStop(1, 'rgba(80,100,120,0)'); ctx.fillStyle = hz; ctx.fillRect(0, 400, W, 500);
}

// night house with lit window
function houseNight(ctx, lt, o = {}) {
  ctx.fillStyle = '#05070a'; ctx.fillRect(0, 0, W, H);
  L(ctx, .2, () => { // sky + stars + moon glow
    const g = ctx.createLinearGradient(0, 0, 0, H); g.addColorStop(0, '#0c121a'); g.addColorStop(1, '#05070a'); ctx.fillStyle = g; ctx.fillRect(-300, -300, W + 600, H + 600);
    spot(ctx, 1500, 180, 400, .12);
    for (let i = 0; i < 90; i++) { ctx.fillStyle = `rgba(220,230,240,${.2 + hr(i) * .5 * (0.7 + .3 * Math.sin(NOW * 2 + i))})`; ctx.fillRect(hr(i * 3) * W, hr(i * 7) * 500, 2, 2); }
  });
  L(ctx, .5, () => { // trees silhouettes far
    ctx.fillStyle = '#080b0f';
    for (let i = 0; i < 14; i++) { const x = -300 + i * 190, h = 260 + hr(i) * 200; ctx.beginPath(); ctx.moveTo(x - 90, 760); ctx.lineTo(x, 760 - h); ctx.lineTo(x + 90, 760); ctx.fill(); }
    ctx.fillRect(-400, 740, W + 800, 600);
  });
  L(ctx, .8, () => { // house
    const x = W / 2 - 330, y = 380;
    ctx.fillStyle = '#0b0e12'; ctx.beginPath(); ctx.moveTo(x - 60, y + 120); ctx.lineTo(x + 330, y - 120); ctx.lineTo(x + 720, y + 120); ctx.closePath(); ctx.fill(); ctx.fillRect(x, y + 110, 660, 420);
    const lit = o.lit === undefined ? 1 : o.lit; const fl = .85 + .15 * noise1(NOW * 3);
    [[x + 90, y + 200], [x + 470, y + 200]].forEach(([wx, wy], i) => {
      const on = i === 0 ? lit : lit * .25;
      ctx.fillStyle = `rgba(${200 * on * fl + 15},${170 * on * fl + 18},${110 * on * fl + 22},1)`; ctx.fillRect(wx, wy, 110, 140);
      if (on > .3) { ctx.save(); ctx.globalCompositeOperation = 'lighter'; spot(ctx, wx + 55, wy + 70, 260, .18 * on, '255,200,130'); ctx.restore(); }
      ctx.fillStyle = '#0b0e12'; ctx.fillRect(wx + 52, wy, 6, 140); ctx.fillRect(wx, wy + 66, 110, 6);
    });
    ctx.fillStyle = '#06080a'; ctx.fillRect(x + 290, y + 330, 90, 200);
    if (o.figure) figure(ctx, x + 335, y + 530, 210, { kind: 'coat', col: '#020304' });
  });
}

// wall with police light reflections
function policeWall(ctx, lt, o = {}) {
  L(ctx, .4, () => { ctx.drawImage(BRICK, -240, -160); });
  const ph = NOW * 4.2; const red = Math.max(0, Math.sin(ph)), blue = Math.max(0, Math.sin(ph + Math.PI));
  ctx.save(); ctx.globalCompositeOperation = 'lighter';
  L(ctx, .4, () => {
    spot(ctx, 500 + Math.sin(NOW * 2) * 200, 420, 900, .45 * red * (o.k || 1), '220,40,40');
    spot(ctx, 1400 + Math.cos(NOW * 2) * 200, 460, 900, .4 * blue * (o.k || 1), '50,90,230');
  });
  ctx.restore();
  // door
  if (o.door !== false) L(ctx, .6, () => {
    const dx = o.dx || 1180; ctx.fillStyle = '#050608'; ctx.fillRect(dx, 300, 300, 640); ctx.strokeStyle = '#1c2026'; ctx.lineWidth = 10; ctx.strokeRect(dx, 300, 300, 640);
    const op = o.open || 0; ctx.fillStyle = `rgba(255,190,120,${op * .5})`; ctx.fillRect(dx + 10, 310, 280 * op, 620);
  });
  // street lamp light
  ctx.save(); ctx.globalCompositeOperation = 'lighter'; L(ctx, .7, () => cone(ctx, 420, -40, 60, 820, 1150, .1, '255,210,150')); ctx.restore();
  const g = ctx.createLinearGradient(0, 880, 0, H); g.addColorStop(0, 'rgba(0,0,0,0)'); g.addColorStop(1, 'rgba(0,0,0,.9)'); ctx.fillStyle = g; ctx.fillRect(0, 880, W, 200);
}

// night street with lamppost (Dahmer)
function nightStreet(ctx, lt, o = {}) {
  policeWall(ctx, lt, { door: false, k: o.police || 0 });
  L(ctx, .75, () => {
    // lamppost
    ctx.fillStyle = '#030405'; ctx.fillRect(1338, 120, 16, 900); ctx.fillRect(1290, 110, 110, 18);
    ctx.save(); ctx.globalCompositeOperation = 'lighter'; cone(ctx, 1346, 128, 60, 760, 860, .22, '255,215,160'); spot(ctx, 1346, 125, 90, .7, '255,230,190'); ctx.restore();
    // pool of light
    ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.scale(1, .25); spot(ctx, 1346, 980 * 4, 520, .22, '255,215,160'); ctx.restore();
    ctx.fillStyle = '#07090b'; ctx.fillRect(-400, 980, W + 800, 300);
  });
}

// generic timeline
function timeline(ctx, items, y, t0s, o = {}) {
  // items: [{x,label,sub}] ; t0s: appear times
  const x0 = o.x0 || 200, x1 = o.x1 || W - 200;
  const p = ap(t0s[0] - .3, o.lineD || 1.2, E.io);
  ctx.save(); ctx.strokeStyle = 'rgba(142,162,181,.5)'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(x0, y); ctx.lineTo(lerp(x0, x1, p), y); ctx.stroke();
  items.forEach((it, i) => {
    const q = ap(t0s[i], .45, E.back); if (q <= 0) return;
    ctx.fillStyle = it.red ? C.red2 : C.white; ctx.beginPath(); ctx.arc(it.x, y, 12 * q, 0, 7); ctx.fill();
    if (it.red) { ctx.shadowColor = C.red2; ctx.shadowBlur = 20; }
    riseText(ctx, it.label, it.x, y - 40, t0s[i], { size: it.size || 64, wt: '600', col: it.red ? C.red2 : C.white });
    ctx.shadowBlur = 0;
    if (it.sub) riseText(ctx, it.sub, it.x, y + 70, t0s[i] + .15, { f: F.mono, size: 30, col: C.cold, dy: 20 });
  });
  ctx.restore();
}
// lower-third caption plate
function plate(ctx, title, sub, x, y, t0, o = {}) {
  const p = ap(t0, .6, E.expo); if (p <= 0) return;
  const out = o.out ? clamp((NOW - o.out) / .4) : 0;
  ctx.save(); ctx.globalAlpha *= 1 - out;
  font(ctx, F.osw, o.size || 56, '600'); ctx.letterSpacing = '3px';
  const tw = Math.max(ctx.measureText(title).width, sub ? (font(ctx, F.mono, 28), ctx.measureText(sub).width) : 0) + 60;
  ctx.fillStyle = 'rgba(6,8,11,.82)'; ctx.fillRect(x, y - 70, tw * p, sub ? 130 : 95);
  ctx.fillStyle = C.red2; ctx.fillRect(x, y - 70, 8, sub ? 130 : 95);
  ctx.beginPath(); ctx.rect(x, y - 80, tw * p, 160); ctx.clip();
  txt(ctx, title, x + 30, y, { size: o.size || 56, wt: '600', align: 'left', ls: 3 });
  if (sub) txt(ctx, sub, x + 30, y + 44, { f: F.mono, size: 28, align: 'left', col: C.cold });
  ctx.restore();
}
// quote / typed paper sheet
function paperSheet(ctx, x, y, w, h, rot = 0) {
  ctx.save(); ctx.translate(x, y); ctx.rotate(rot); ctx.shadowColor = 'rgba(0,0,0,.7)'; ctx.shadowBlur = 40; ctx.shadowOffsetY = 20;
  ctx.fillStyle = '#c8c3b7'; ctx.fillRect(-w / 2, -h / 2, w, h); ctx.shadowColor = 'transparent';
  ctx.drawImage(PAPER, 0, 0, 1000, 1000 * h / w, -w / 2, -h / 2, w, h); ctx.restore();
}
// silhouettes grid that light up
function figureGrid(ctx, n, cols, x0, y0, cw, chh, t0, dur, o = {}) {
  for (let i = 0; i < n; i++) {
    const c = i % cols, r = Math.floor(i / cols);
    const q = ap(t0 + i * dur / n, .3);
    const red = o.red && o.red(i);
    const col = red ? C.red2 : (o.col || '#9aabbb');
    if (q <= 0) { if (o.ghost) figure(ctx, x0 + c * cw, y0 + r * chh, chh * .82, { kind: o.kind ? o.kind(i) : 'woman', col: 'rgba(120,140,160,.08)' }); continue; }
    figure(ctx, x0 + c * cw, y0 + r * chh, chh * .82, { kind: o.kind ? o.kind(i) : 'woman', col, a: q * (o.a || .9), rim: red ? C.red : null });
  }
}
// crack between two figures, optional bridge
function gapScene(ctx, lt, o = {}) {
  bgDark(ctx, o.warm ? '30,24,18' : '14,18,24');
  L(ctx, .6, () => {
    ctx.fillStyle = '#0d1014'; ctx.fillRect(-300, 700, 850 + W / 2 - 300 - 140, 600); ctx.fillRect(W / 2 + 140, 700, W, 600);
    const cw = 140 * (o.crack === undefined ? 1 : o.crack);
    ctx.fillStyle = '#000'; ctx.beginPath(); ctx.moveTo(W / 2 - cw, 700); ctx.lineTo(W / 2 - cw * .3, 900); ctx.lineTo(W / 2 - cw * .6, 1100); ctx.lineTo(W / 2 + cw * .5, 1100); ctx.lineTo(W / 2 + cw * .2, 880); ctx.lineTo(W / 2 + cw, 700); ctx.fill();
    ctx.fillStyle = 'rgba(120,140,160,.25)'; ctx.fillRect(-300, 700, W + 600, 3);
    figure(ctx, W / 2 - 380, 700, 300, { kind: 'woman', col: '#a7b4c1' });
    figure(ctx, W / 2 + 380, 700, 300, { kind: 'coat', col: o.helper ? '#d8c39a' : '#4b5866', flip: true });
    if (o.bridge) {
      const b = o.bridge; ctx.fillStyle = C.red2; ctx.shadowColor = C.red2; ctx.shadowBlur = 25;
      const n = 9; for (let i = 0; i < n; i++) { const q = clamp(b * n - i); if (q <= 0) continue; ctx.globalAlpha = q; ctx.fillRect(W / 2 - 200 + i * 45, 690 - (1 - q) * 40, 38, 14); }
      ctx.globalAlpha = 1; ctx.shadowBlur = 0;
    }
  });
}
