// ===== sets, props, kinetic helpers (paper style) =====
const K = require('./core'); const Pp = require('./paper');
const { W, H, F, mk, clamp, lerp, E, mulberry, hr, noise1, S, tw, tw2, twos, L, font, Path2D } = K;
const { P, put, sheet, cutout, cached, texturize, shade } = Pp;

// ---------- backgrounds ----------
function collageBg(seed, pal) {
  return cached('collage|' + seed + pal.join(','), () => {
    const w = W + 700, h = H + 500, c = mk(w, h), x = c.getContext('2d');
    const base = sheet({ w: w + 20, h: h + 20, color: pal[0], tex: .6, seed, grad: false }); x.drawImage(base.c, -18, -18);
    const r = mulberry(seed);
    for (let i = 0; i < 9; i++) {
      const sw = 300 + r() * 900, sh = 200 + r() * 600; const col = pal[1 + Math.floor(r() * (pal.length - 1))];
      const s = sheet({ w: Math.round(sw), h: Math.round(sh), color: col, torn: [r() < .6 ? 14 : 0, r() < .6 ? 14 : 0, r() < .6 ? 14 : 0, r() < .6 ? 14 : 0], seed: seed * 10 + i, tex: .55, lines: r() < .15 ? 'grid' : null });
      put(x, s, r() * w, r() * h, { rot: (r() - .5) * .5 });
    }
    return c;
  });
}
function darkDesk(seed, col = P.inkblue) {
  return cached('dark|' + seed + col, () => {
    const w = W + 700, h = H + 500, c = mk(w, h), x = c.getContext('2d');
    const base = sheet({ w: w + 20, h: h + 20, color: col, tex: .7, seed, blots: 6, grad: false }); x.drawImage(base.c, -18, -18);
    const r = mulberry(seed);
    for (let i = 0; i < 7; i++) { const s = sheet({ w: 300 + r() * 600 | 0, h: 300 + r() * 500 | 0, color: shade(col, (r() - .5) * .3), torn: [12, r() < .5 ? 10 : 0, 12, 0], seed: seed + i * 3, tex: .7, burn: .7, blots: 2 }); put(x, s, r() * w, r() * h, { rot: (r() - .5) * .6 }); }
    return c;
  });
}
function cork(seed = 1, tint = null) {
  return cached('cork|' + seed + tint, () => {
    const w = W + 700, h = H + 500, c = mk(w, h), x = c.getContext('2d'); const r = mulberry(seed);
    x.fillStyle = '#a8784a'; x.fillRect(0, 0, w, h);
    for (let i = 0; i < 160000; i++) { const v = r(); x.fillStyle = v < .45 ? `rgba(70,40,18,${.18 + r() * .35})` : v < .8 ? `rgba(200,150,95,${.15 + r() * .3})` : `rgba(130,85,45,${.3})`; const s = .8 + r() * 3.2; x.beginPath(); x.ellipse(r() * w, r() * h, s, s * (.5 + r() * .7), r() * 3, 0, 7); x.fill(); }
    texturize(x, w, h, .4, 3);
    if (tint) { x.globalCompositeOperation = 'multiply'; x.fillStyle = tint; x.fillRect(0, 0, w, h); x.globalCompositeOperation = 'source-over'; }
    // wooden frame shadow inner
    return c;
  });
}
function bg(ctx, img, depth = .5) { L(ctx, depth, () => ctx.drawImage(img, -350, -250)); }
// soft light drift (bright) & lamp pools (dark)
function lightDrift(ctx, warm = 1) {
  const x = W * (.35 + .2 * noise1(S.T * .07)), y = H * (.3 + .15 * noise1(S.T * .05 + 4));
  const g = ctx.createRadialGradient(x, y, 50, x, y, W * .8); g.addColorStop(0, `rgba(255,${235 - warm * 20},${200 - warm * 40},.30)`); g.addColorStop(1, 'rgba(0,0,0,.12)');
  ctx.save(); ctx.globalCompositeOperation = 'soft-light'; ctx.fillStyle = g; ctx.fillRect(0, 0, W, H); ctx.restore();
}
function lampLight(ctx, x, y, r, col = '255,190,110', k = 1, dark = .55) {
  ctx.save(); ctx.globalCompositeOperation = 'multiply'; const g = ctx.createRadialGradient(x, y, r * .25, x, y, r * 1.6); g.addColorStop(0, 'rgba(255,255,255,1)'); g.addColorStop(1, `rgba(${255 * (1 - dark) | 0},${255 * (1 - dark) | 0},${255 * (1 - dark) * 1.05 | 0},1)`); ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
  ctx.globalCompositeOperation = 'screen'; const g2 = ctx.createRadialGradient(x, y, 0, x, y, r); g2.addColorStop(0, `rgba(${col},${.35 * k})`); g2.addColorStop(1, `rgba(${col},0)`); ctx.fillStyle = g2; ctx.fillRect(0, 0, W, H); ctx.restore();
}
function vellumCone(ctx, x, y, w0, w1, h, a = .22, col = '255,240,210') { // translucent paper light cone
  ctx.save(); ctx.globalCompositeOperation = 'screen'; const g = ctx.createLinearGradient(0, y, 0, y + h); g.addColorStop(0, `rgba(${col},${a})`); g.addColorStop(1, `rgba(${col},0)`);
  ctx.fillStyle = g; ctx.beginPath(); ctx.moveTo(x - w0 / 2, y); ctx.lineTo(x + w0 / 2, y); ctx.lineTo(x + w1 / 2, y + h); ctx.lineTo(x - w1 / 2, y + h); ctx.closePath(); ctx.fill();
  ctx.strokeStyle = `rgba(${col},${a * .6})`; ctx.lineWidth = 2; ctx.stroke(); ctx.restore();
}
// floating paper scraps / confetti (stop-motion on twos), foreground depth
function scrapSprites(pal) { return cached('scr|' + pal.join(','), () => pal.flatMap((c, i) => [0, 1, 2].map(k => sheet({ w: 30 + k * 22 + i * 3, h: 18 + k * 14, color: c, torn: [4, 4, 4, 4], seed: i * 10 + k, tex: .5 })))); }
function scraps(ctx, pal, n = 14, seed = 1, o = {}) {
  const sp = scrapSprites(pal); const T = twos();
  for (let i = 0; i < n; i++) {
    const d = .7 + hr(i * 3 + seed) * .9; const spd = (20 + hr(i + seed) * 40) * (o.speed || 1);
    const x = ((hr(i * 7 + seed) * (W + 400) + T * spd * (hr(i * 5) < .5 ? 1 : -1)) % (W + 400) + W + 400) % (W + 400) - 200;
    const y = ((hr(i * 11 + seed) * (H + 300) + T * spd * .6) % (H + 300)) - 150;
    L(ctx, d, () => put(ctx, sp[(i * 7) % sp.length], x, y, { rot: T * (hr(i) - .5) * 2 + i, s: d * (o.s || 1), elev: .8, a: o.a || 1 }));
  }
}
function planes(ctx, seed, n = 2, o = {}) {
  const T = twos();
  for (let i = 0; i < n; i++) {
    const per = 7 + hr(i + seed) * 5, ph = ((T + hr(i * 3 + seed) * per) % per) / per; if (ph > .55) continue; const e = ph / .55;
    const x = lerp(-200, W + 200, e), y = H * (.2 + hr(i * 5 + seed) * .5) + Math.sin(e * 6) * 30 - e * 80;
    require('./engine').planeDraw(ctx, x, y, -.15 + Math.cos(e * 6) * .12, (o.s || .6) * (.8 + hr(i) * .5));
  }
}

// ---------- marker / handwriting / typewriter ----------
function marker(ctx, pts, p, o = {}) { // pts polyline; p progress 0..1
  if (p <= 0) return; ctx.save(); ctx.globalCompositeOperation = o.blend || 'multiply'; ctx.strokeStyle = o.color || 'rgba(220,30,40,.85)'; ctx.lineWidth = o.w || 14; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
  let total = 0; const seg = []; for (let i = 1; i < pts.length; i++) { const l = Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]); seg.push(l); total += l; }
  let rem = total * p; ctx.beginPath(); ctx.moveTo(pts[0][0], pts[0][1]);
  for (let i = 1; i < pts.length && rem > 0; i++) { const q = Math.min(1, rem / seg[i - 1]); ctx.lineTo(lerp(pts[i - 1][0], pts[i][0], q), lerp(pts[i - 1][1], pts[i][1], q)); rem -= seg[i - 1]; }
  ctx.stroke(); ctx.globalAlpha = .35; ctx.lineWidth = (o.w || 14) * .45; ctx.strokeStyle = o.color2 || o.color || 'rgba(160,10,20,.9)'; ctx.stroke(); ctx.restore();
}
function strikeOut(ctx, x0, x1, y, t0, o = {}) { const r = mulberry(Math.round(x0)); marker(ctx, [[x0 - 14, y + 6], [lerp(x0, x1, .35), y - 2 + r() * 6], [lerp(x0, x1, .7), y + 2], [x1 + 14, y - 8]], tw(t0, o.d || .3, E.out), o); }
function circleMark(ctx, x, y, rx, ry, t0, o = {}) { const pts = []; for (let i = 0; i <= 40; i++) { const a = -2.2 + i / 40 * Math.PI * 2.15; pts.push([x + Math.cos(a) * rx * (1 + i * .002), y + Math.sin(a) * ry]); } marker(ctx, pts, tw(t0, o.d || .5, E.out), Object.assign({ w: 7 }, o)); }
function underline(ctx, x0, x1, y, t0, o = {}) { marker(ctx, [[x0, y], [lerp(x0, x1, .5), y + 3], [x1, y - 2]], tw(t0, o.d || .35), Object.assign({ color: 'rgba(242,193,78,.75)', w: 26 }, o)); }
function hand(ctx, s, x, y, t0, o = {}) { // handwriting reveal left→right
  const p = tw(t0, o.d || Math.max(.4, s.length * .05), E.lin); if (p <= 0) return;
  ctx.save(); font(ctx, F.hand, o.size || 60, '700'); ctx.textAlign = o.align || 'left'; ctx.textBaseline = 'alphabetic'; const w = ctx.measureText(s).width; const x0 = o.align === 'center' ? x - w / 2 : o.align === 'right' ? x - w : x;
  ctx.beginPath(); ctx.rect(x0 - 10, y - (o.size || 60) * 1.2, (w + 20) * p, (o.size || 60) * 1.6); ctx.clip(); ctx.fillStyle = o.color || '#1d2a5c'; ctx.globalAlpha = o.a === undefined ? 1 : o.a; ctx.translate(0, 0); ctx.fillText(s, x, y); ctx.restore();
}
function typed(ctx, s, x, y, t0, o = {}) { // typewriter on paper, per-char ink variance
  const cps = o.cps || 20, n = Math.min(s.length, Math.floor((S.T - t0) * cps)); if (n <= 0) return 0;
  ctx.save(); font(ctx, F.mono, o.size || 44, o.wt || '700'); ctx.textAlign = 'left'; ctx.textBaseline = 'alphabetic';
  const cw = ctx.measureText('М').width; let x0 = x; if (o.align === 'center') x0 = x - cw * s.length / 2;
  for (let i = 0; i < n; i++) { const ch = s[i]; if (ch === ' ') continue; const k = hr(i * 7 + s.length); ctx.globalAlpha = (o.a === undefined ? 1 : o.a) * (.72 + k * .28); ctx.fillStyle = o.color || '#1b1b22'; ctx.fillText(ch, x0 + i * cw, y + (hr(i * 3) - .5) * 2.2); }
  if (n < s.length && o.cursor !== false) { ctx.globalAlpha = .7; ctx.fillRect(x0 + n * cw, y + 6, cw * .8, 4); }
  ctx.restore(); return n / s.length;
}
function typedEv(t0, s, cps = 20) { K.ev(t0, 'type', { d: s.length / cps, n: s.replace(/ /g, '').length }); }
// big headline in Oswald with paper cut-out backing
function headline(ctx, s, x, y, t0, o = {}) {
  const p = tw(t0, o.d || .45, o.ease || E.back); if (p <= 0) return;
  const size = o.size || 120; const spr = cached('hl|' + s + size + (o.color || '') + (o.bg || ''), () => {
    const m = mk(10, 10).getContext('2d'); font(m, F.osw, size, '700'); m.letterSpacing = (o.ls || 4) + 'px'; const w = m.measureText(s).width + size * .5, h = size * 1.3;
    const base = o.bg ? sheet({ w: Math.ceil(w), h: Math.ceil(h), color: o.bg, torn: [6, 4, 6, 4], seed: s.length + 3, tex: .5 }) : null;
    return Pp.sprite(Math.ceil(w), Math.ceil(h), 10, (x2) => { if (base) x2.drawImage(base.c, -8, -8); font(x2, F.osw, size, '700'); x2.letterSpacing = (o.ls || 4) + 'px'; x2.textAlign = 'center'; x2.textBaseline = 'middle'; x2.fillStyle = o.color || P.ink; x2.fillText(s, w / 2 + 2, h / 2 + size * .04); });
  });
  put(ctx, spr, x, y + (1 - p) * 40, { rot: (o.rot || 0) + (1 - p) * .1, s: (o.s || 1) * lerp(.6, 1, p), a: clamp(p * 2) * (o.out ? 1 - tw(o.out, .3) : 1), elev: (1 - p) * .6, shadow: o.bg ? 1 : 0 });
}

// ---------- counters on paper cards ----------
function digitCard(d, size, col, bg) { return cached('dc|' + d + size + col + bg, () => { const w = Math.round(size * .66), h = Math.round(size * 1.08); const base = sheet({ w, h, color: bg, seed: 40 + d, tex: .45, fold: 1 }); return Pp.sprite(w, h, 8, (x) => { x.drawImage(base.c, -8, -8); font(x, F.osw, size, '700'); x.fillStyle = col; x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillText(String(d), w / 2, h / 2 + size * .04); x.fillStyle = 'rgba(0,0,0,.18)'; x.fillRect(0, h / 2 - 1, w, 2); }); }); }
function counter(ctx, n, x, y, t0, o = {}) {
  const lt = S.T - t0; if (lt < 0) return; const d = o.d || 1.4; const p = clamp(lt / d); const v = Math.round(n * E.out(p));
  const str = String(o.pad ? String(v).padStart(String(n).length, '0') : v), size = o.size || 220; const cw = size * .7; const x0 = x - cw * (str.length - 1) / 2;
  const pop = p >= 1 ? Math.max(0, 1 - (lt - d) / .3) : 0;
  [...str].forEach((ch, i) => { const flick = p < 1 ? (hr(Math.floor(lt * 24) + i) - .5) * .06 : 0; put(ctx, digitCard(+ch, size, o.color || P.ink, o.bg || '#f4efe3'), x0 + i * cw, y, { rot: (hr(i + n) - .5) * .08 + flick, s: 1 + pop * .12, elev: pop * .5 + (o.elev || 0) }); });
  if (o.suffix) put(ctx, digitSuffix(o.suffix, size * .9, o.color || P.ink, o.bg || '#f4efe3'), x0 + str.length * cw - cw * .1, y, { rot: .05, s: 1 + pop * .12 });
}
function digitSuffix(s, size, col, bg) { return cached('ds|' + s + size + col, () => { const m = mk(10, 10).getContext('2d'); font(m, F.osw, size, '700'); const w = Math.round(m.measureText(s).width + size * .3), h = Math.round(size * 1.08); const base = sheet({ w, h, color: bg, seed: 60, tex: .45 }); return Pp.sprite(w, h, 8, (x) => { x.drawImage(base.c, -8, -8); font(x, F.osw, size, '700'); x.fillStyle = col; x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillText(s, w / 2, h / 2 + size * .04); }); }); }

// ---------- thread ----------
function thread(ctx, a, b, p = 1, sag = 50, col = '#c51d24') {
  if (p <= 0) return; const mx = (a[0] + b[0]) / 2, my = (a[1] + b[1]) / 2 + sag * (1 - Math.abs(Math.sin(p * Math.PI)) * 0) ;
  const pt = t => [(1 - t) * (1 - t) * a[0] + 2 * (1 - t) * t * mx + t * t * b[0], (1 - t) * (1 - t) * a[1] + 2 * (1 - t) * t * my + t * t * b[1]];
  ctx.save(); ctx.lineCap = 'round';
  for (const [dx, dy, c, w, al] of [[8, 12, 'rgba(0,0,0,1)', 4, .25], [0, 0, col, 3.2, 1], [-.8, -.8, 'rgba(255,170,170,.7)', 1, 1]]) {
    ctx.strokeStyle = c; ctx.lineWidth = w; ctx.globalAlpha = al; if (dx > 2) ctx.filter = 'blur(3px)'; ctx.beginPath(); const p0 = pt(0); ctx.moveTo(p0[0] + dx, p0[1] + dy);
    for (let i = 1; i <= 40 * p; i++) { const q = pt(i / 40); ctx.lineTo(q[0] + dx, q[1] + dy); } ctx.stroke(); ctx.filter = 'none';
  }
  ctx.restore();
}

// ---------- props (layered cut-outs) ----------
const R = (x, y, w, h, r = 0) => { const p = new Path2D(); p.roundRect(x, y, w, h, r); return p; };
const Ell = (x, y, rx, ry) => { const p = new Path2D(); p.ellipse(x, y, rx, ry, 0, 0, Math.PI * 2); return p; };
const Poly = (pts) => { const p = new Path2D(); pts.forEach((q, i) => i ? p.lineTo(q[0], q[1]) : p.moveTo(q[0], q[1])); p.closePath(); return p; };
const PROPS = {
  rotaryPhone: () => cutout('phone', 360, 300, (x, part) => {
    part(Poly([[30, 290], [60, 130], [300, 130], [330, 290]]), '#7a1e1e');
    part(R(40, 270, 280, 26, 8), '#5a1515');
    part(Ell(180, 215, 82, 62), '#e9dfc9'); for (let i = 0; i < 10; i++) { const a = -2.4 + i * .5; part(Ell(180 + Math.cos(a) * 54, 215 + Math.sin(a) * 40, 10, 9), '#3a1010', { sb: 2, sx: 1, sy: 1 }); }
    part(Ell(180, 215, 22, 17), '#b02a2a');
    part(new Path2D('M20 120 Q20 60 70 60 L290 60 Q340 60 340 120 L300 132 Q300 96 270 96 L90 96 Q60 96 60 132 Z'), '#9e2626');
  }),
  deskLamp: () => cutout('lamp', 300, 420, (x, part) => {
    part(R(80, 390, 160, 26, 10), '#3a2a1d'); part(R(150, 160, 18, 240, 6), '#4a3426');
    part(new Path2D('M40 170 L120 40 L230 40 L290 170 Z'), '#2f6b4f'); part(new Path2D('M60 165 L130 55 L220 55 L272 165 Z'), '#3e8763', { shadow: false });
    part(Ell(165, 172, 125, 14), '#f7d58a', { shadow: false });
  }),
  car: (cross) => cutout('car' + !!cross, 460, 260, (x, part) => {
    part(new Path2D('M20 200 L20 150 Q30 120 70 115 L120 60 Q130 48 150 48 L310 48 Q330 48 345 62 L390 115 Q440 120 445 150 L445 200 Z'), '#ee6c5a');
    part(new Path2D('M140 70 L200 70 L200 115 L105 115 Z'), '#cfe8ef'); part(new Path2D('M215 70 L300 70 Q312 70 320 80 L350 115 L215 115 Z'), '#cfe8ef');
    part(R(30, 160, 60, 18, 6), '#f2c14e'); part(R(380, 160, 50, 18, 6), '#d1242c');
    for (const cx of [110, 350]) { part(Ell(cx, 205, 42, 42), '#1d2433'); part(Ell(cx, 205, 18, 18), '#c9c2b0'); }
    if (cross) { part(new Path2D('M60 0 L110 0 L460 230 L410 250 Z'), '#d1242c'); part(new Path2D('M410 0 L460 20 L110 250 L60 230 Z'), '#d1242c'); }
  }, { border: 8 }),
  geoClock: () => cutout('geoclock', 320, 360, (x, part) => {
    part(new Path2D('M130 340 C110 300 40 220 40 140 A90 90 0 1 1 220 140 C220 220 150 300 130 340 Z'), '#2a9d8f'); part(Ell(130, 140, 46, 46), '#fbf8f1');
    part(Ell(240, 270, 70, 70), '#f2c14e'); part(Ell(240, 270, 54, 54), '#fbf8f1', { shadow: false });
    x.strokeStyle = '#1d2433'; x.lineWidth = 7; x.lineCap = 'round'; x.beginPath(); x.moveTo(240, 270); x.lineTo(240, 232); x.moveTo(240, 270); x.lineTo(266, 284); x.stroke();
  }, { border: 8 }),
  phoneMsg: () => cutout('phonemsg', 320, 380, (x, part) => {
    part(R(40, 40, 190, 330, 30), '#1d2433'); part(R(54, 70, 162, 260, 10), '#8ecae6'); part(Ell(135, 350, 10, 10), '#5a6680');
    part(new Path2D('M150 20 L300 20 Q315 20 315 35 L315 120 Q315 135 300 135 L200 135 L170 165 L178 135 L150 135 Q135 135 135 120 L135 35 Q135 20 150 20 Z'), '#ee6c5a');
    x.fillStyle = '#fbf8f1'; for (let i = 0; i < 3; i++) { x.beginPath(); x.arc(190 + i * 38, 78, 10, 0, 7); x.fill(); }
  }, { border: 8 }),
  crutches: () => cutout('crutch', 260, 520, (x, part) => {
    for (const dx of [0, 110]) { part(R(40 + dx, 20, 70, 18, 9), '#c49a64'); part(new Path2D(`M${48 + dx} 34 L${62 + dx} 400 L${72 + dx} 400 L${60 + dx} 34 Z`), '#a87d4d'); part(new Path2D(`M${100 + dx} 34 L${86 + dx} 400 L${96 + dx} 400 L${110 + dx} 34 Z`), '#a87d4d'); part(R(56 + dx, 190, 44, 14, 6), '#8a6238'); part(R(66 + dx, 396, 26, 110, 8), '#6e4c2a'); part(R(62 + dx, 494, 34, 22, 8), '#1d2433'); }
  }, { border: 7 }),
  cast: () => cutout('cast', 380, 170, (x, part) => {
    part(new Path2D('M10 60 Q10 30 50 30 L330 40 Q370 45 370 85 Q370 125 330 130 L50 140 Q10 140 10 110 Z'), '#f4f1ea'); for (let i = 0; i < 9; i++) { x.strokeStyle = 'rgba(0,0,0,.12)'; x.lineWidth = 3; x.beginPath(); x.moveTo(60 + i * 32, 34); x.lineTo(48 + i * 32, 138); x.stroke(); }
    part(Ell(340, 85, 30, 40), '#e9c9a7');
  }, { border: 7 }),
  truck: () => cutout('truck', 520, 260, (x, part) => {
    part(R(20, 40, 320, 160, 10), '#5a6b52'); part(R(30, 50, 300, 30, 6), '#6f8364', { shadow: false });
    part(new Path2D('M340 80 L440 80 Q460 80 470 100 L500 150 L500 200 L340 200 Z'), '#8d99a6'); part(new Path2D('M360 95 L430 95 L462 145 L360 145 Z'), '#cfe0ea');
    for (const cx of [90, 260, 430]) { part(Ell(cx, 210, 36, 36), '#1d2433'); part(Ell(cx, 210, 14, 14), '#9aa3ad'); }
    part(R(60, 110, 200, 40, 6), '#efe6d2'); font(x, F.osw, 30, '700'); x.fillStyle = '#3d4d3c'; x.fillText('КРАСКА', 105, 142);
  }, { border: 0 }),
  ring: () => cutout('ring', 150, 150, (x, part) => { const p = new Path2D(); p.arc(75, 80, 58, 0, Math.PI * 2); p.arc(75, 80, 40, 0, Math.PI * 2, true); part(p, '#e0b24a'); part(new Path2D('M60 8 L90 8 L100 26 L75 40 L50 26 Z'), '#cfe8ef'); }, { border: 0 }),
  scissors: () => cutout('scis', 300, 200, (x, part) => {
    part(new Path2D('M150 100 L290 60 L296 72 L160 110 Z'), '#c9ced6'); part(new Path2D('M150 100 L290 140 L296 128 L160 90 Z'), '#aeb4bd');
    const r1 = new Path2D(); r1.ellipse(80, 60, 52, 36, -.3, 0, 7); r1.ellipse(80, 60, 30, 18, -.3, 0, 7, true); part(r1, '#d1242c');
    const r2 = new Path2D(); r2.ellipse(80, 140, 52, 36, .3, 0, 7); r2.ellipse(80, 140, 30, 18, .3, 0, 7, true); part(r2, '#d1242c'); part(Ell(155, 100, 9, 9), '#6b7280');
  }),
  magnifier: () => cutout('mag', 320, 320, (x, part) => { const r = new Path2D(); r.arc(130, 130, 110, 0, 7); r.arc(130, 130, 88, 0, 7, true); part(r, '#2a9d8f'); part(new Path2D('M205 215 L225 195 L310 280 Q312 300 290 300 Z'), '#1d2433'); }),
  cup: () => cutout('cup', 220, 300, (x, part) => {
    part(new Path2D('M20 40 L200 40 L170 290 L50 290 Z'), '#fbf8f1'); part(new Path2D('M36 120 L184 120 L172 210 L48 210 Z'), '#2a9d8f'); part(R(10, 24, 200, 26, 10), '#e9e1cf'); part(new Path2D('M120 26 L140 -20 L150 -16 L132 30 Z'), '#ee6c5a');
  }, { border: 7 }),
  bubble: (txtS) => cutout('bub' + txtS, 520, 240, (x, part) => {
    part(new Path2D('M40 20 L480 20 Q510 20 510 50 L510 160 Q510 190 480 190 L170 190 L90 236 L110 190 L40 190 Q10 190 10 160 L10 50 Q10 20 40 20 Z'), '#fbf8f1');
    font(x, F.hand, 92, '700'); x.fillStyle = '#1d2433'; x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillText(txtS, 260, 108);
  }),
  house: (lit) => cutout('house' + lit, 520, 460, (x, part) => {
    part(new Path2D('M20 200 L260 30 L500 200 Z'), '#3b2a1d'); part(R(60, 190, 400, 260, 0), '#2c3e5c'); part(R(70, 196, 380, 24, 0), '#24334d', { shadow: false });
    for (const [wx, on] of [[110, lit], [330, 0]]) { part(R(wx, 260, 90, 110, 4), on ? '#f2c14e' : '#1b2638'); x.fillStyle = '#2c3e5c'; x.fillRect(wx + 42, 260, 6, 110); x.fillRect(wx, 312, 90, 6); }
    part(R(230, 320, 70, 130, 4), '#1b2638'); part(R(380, 60, 40, 90, 0), '#3b2a1d');
  }),
  streetLamp: () => cutout('slamp', 200, 900, (x, part) => { part(R(92, 120, 16, 780, 4), '#1a1f2b'); part(new Path2D('M40 120 L160 120 L140 60 L60 60 Z'), '#232a38'); part(R(70, 118, 60, 16, 4), '#ffe2a8'); part(R(70, 880, 60, 20, 6), '#1a1f2b'); }),
  gate: () => cutout('gate', 1100, 520, (x, part) => {
    part(R(0, 40, 90, 480, 4), '#4a5568'); part(R(1010, 40, 90, 480, 4), '#4a5568'); part(R(0, 20, 1100, 40, 4), '#2c2e33');
    for (let i = 0; i < 18; i++) part(R(110 + i * 50, 60, 14, 450, 4), '#3a4250', { sb: 4 }); part(R(90, 160, 920, 16, 4), '#3a4250'); part(R(90, 400, 920, 16, 4), '#3a4250');
    part(R(380, 70, 340, 70, 6), '#efe6d2'); font(x, F.osw, 40, '700'); x.fillStyle = '#2c2e33'; x.textAlign = 'center'; x.fillText('ЗАВОД', 550, 120);
  }),
  bars: () => cutout('bars', 1000, 700, (x, part) => { for (let i = 0; i < 9; i++) part(R(40 + i * 110, 0, 26, 700, 8), '#3a3f48', { sb: 10, sx: 6 }); part(R(0, 120, 1000, 30, 6), '#2c2e33'); part(R(0, 560, 1000, 30, 6), '#2c2e33'); }),
  drawer: () => cutout('drawer', 760, 420, (x, part) => {
    part(R(0, 0, 760, 420, 10), '#7a5a3a'); part(R(30, 30, 700, 360, 6), '#8b6a46'); part(R(300, 60, 160, 60, 6), '#c9ced6'); part(R(310, 70, 140, 40, 4), '#efe6d2'); part(R(330, 180, 100, 30, 14), '#4a3426');
  }),
  calendarPad: (txtS) => cutout('cal' + txtS, 360, 400, (x, part) => {
    part(R(0, 40, 360, 360, 10), '#f4efe3'); part(R(0, 40, 360, 80, 10), '#d1242c'); for (let i = 0; i < 6; i++) part(R(40 + i * 52, 20, 18, 46, 9), '#6b7280');
    font(x, F.osw, 150, '700'); x.fillStyle = '#1d2433'; x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillText(txtS, 180, 270);
  }),
  questionMark: () => cutout('qm', 300, 440, (x, part) => {
    part(new Path2D('M60 130 Q60 30 150 30 Q250 30 250 120 Q250 180 190 210 Q165 225 165 265 L165 290 L120 290 L120 255 Q120 200 165 175 Q205 155 205 120 Q205 75 150 75 Q105 75 105 130 Z'), '#d1242c'); part(Ell(142, 370, 34, 34), '#d1242c');
  }, { border: 10 }),
  shield: () => cutout('shield', 300, 340, (x, part) => {
    part(new Path2D('M150 10 Q210 40 290 30 Q300 210 150 330 Q0 210 10 30 Q90 40 150 10 Z'), '#1d2b44'); part(new Path2D('M150 40 Q200 62 262 56 Q262 200 150 296 Q38 200 38 56 Q100 62 150 40 Z'), '#c9a34a');
    font(x, F.osw, 44, '700'); x.fillStyle = '#1d2b44'; x.textAlign = 'center'; x.fillText('POLICE', 150, 160); part(Ell(150, 220, 30, 30), '#1d2b44');
  }, { border: 8 }),
  bulb: () => cutout('bulb', 120, 180, (x, part) => { part(Ell(60, 70, 50, 56), '#ffe6a3'); part(R(38, 118, 44, 40, 6), '#9aa3ad'); }),
  airplaneIcon: () => null,
};
function prop(name, ...a) { return PROPS[name](...a); }

// ---------- DNA paper ribbon ----------
function dna(ctx, x, y, len, amp, t, o = {}) {
  const n = o.n || 40, ph = t * (o.speed || 1.4), c1 = o.c1 || P.teal, c2 = o.c2 || P.yellow, rung = o.rung || P.coral; const rev = o.reveal === undefined ? 1 : o.reveal;
  ctx.save(); ctx.translate(x, y); ctx.rotate(o.rot || 0);
  const pts = []; for (let i = 0; i <= n; i++) { const u = i / n; const a = u * Math.PI * 2 * (o.turns || 2.2) + ph; pts.push({ x: (u - .5) * len, a, y1: Math.sin(a) * amp, y2: Math.sin(a + Math.PI) * amp, z: Math.cos(a) }); }
  const m = Math.floor(n * rev);
  // shadows
  ctx.save(); ctx.globalAlpha = .25; ctx.translate(12, 18); ctx.filter = 'blur(8px)'; ctx.strokeStyle = '#000'; ctx.lineWidth = 26; ctx.beginPath(); pts.slice(0, m + 1).forEach((q, i) => i ? ctx.lineTo(q.x, q.y1) : ctx.moveTo(q.x, q.y1)); ctx.stroke(); ctx.beginPath(); pts.slice(0, m + 1).forEach((q, i) => i ? ctx.lineTo(q.x, q.y2) : ctx.moveTo(q.x, q.y2)); ctx.stroke(); ctx.filter = 'none'; ctx.restore();
  const ribbon = (key, col, back) => { for (let i = 0; i < m; i++) { const a = pts[i], b = pts[i + 1]; const za = key === 'y1' ? a.z : -a.z; if (back ? za > 0 : za <= 0) continue; const wd = 10 + Math.abs(za) * 12; ctx.fillStyle = shade(col, za < 0 ? -.3 : .05); ctx.beginPath(); ctx.moveTo(a.x, a[key] - wd / 2); ctx.lineTo(b.x + .8, b[key] - wd / 2); ctx.lineTo(b.x + .8, b[key] + wd / 2); ctx.lineTo(a.x, a[key] + wd / 2); ctx.fill(); } };
  ribbon('y1', c1, true); ribbon('y2', c2, true);
  for (let i = 0; i < m; i += 2) { const q = pts[i]; ctx.fillStyle = i % 4 ? rung : '#fbf8f1'; ctx.fillRect(q.x - 4, Math.min(q.y1, q.y2), 8, Math.abs(q.y1 - q.y2)); }
  ribbon('y1', c1, false); ribbon('y2', c2, false);
  ctx.restore();
}

// ---------- maps ----------
function proj(lon0, lat0, scale, cx = W / 2, cy = H / 2) { const my = l => Math.log(Math.tan(Math.PI / 4 + l * Math.PI / 360)) * 180 / Math.PI; const y0 = my(lat0); return (lon, lat) => [cx + (lon - lon0) * scale, cy - (my(lat) - y0) * scale]; }
function geoPath(g, Pj) { const path = new Path2D(); const polys = g.type === 'Polygon' ? [g.coordinates] : g.coordinates; for (const poly of polys) for (const ring of poly) { ring.forEach((c, i) => { const [x, y] = Pj(c[0], c[1]); i ? path.lineTo(x, y) : path.moveTo(x, y); }); path.closePath(); } return path; }
// paper map sheet: old map paper + land pieces as cut paper
function mapSprite(key, w, h, feats, Pj, styleFn, o = {}) {
  return cached('map|' + key, () => {
    const base = o.bare ? null : sheet({ w, h, color: o.paper || '#e7dcc2', tex: .6, seed: key.length, age: o.age || .3, lines: 'grid', burn: o.burn || 0, torn: o.torn || [10, 10, 10, 10] });
    return Pp.sprite(w, h, 8, (x) => {
      if (base) x.drawImage(base.c, -8, -8);
      for (const f of feats) { const st = styleFn(f); if (!st) continue; const p = geoPath(f.g, Pj); x.save(); x.shadowColor = 'rgba(0,0,0,.35)'; x.shadowBlur = st.lift ? 12 : 4; x.shadowOffsetX = st.lift ? 6 : 2; x.shadowOffsetY = st.lift ? 9 : 3; x.fillStyle = st.fill; x.fill(p); x.restore(); x.save(); x.clip(p); texturize(x, w, h, .5, 5); x.restore(); if (st.stroke) { x.strokeStyle = st.stroke; x.lineWidth = st.lw || 1.5; x.stroke(p); } }
      if (o.paint) o.paint(x);
      // compass rose
      if (o.compass) { x.save(); x.translate(w - 110, h - 120); x.strokeStyle = 'rgba(60,40,20,.6)'; x.fillStyle = 'rgba(160,30,30,.75)'; x.lineWidth = 2; x.beginPath(); x.arc(0, 0, 50, 0, 7); x.stroke(); x.beginPath(); x.moveTo(0, -70); x.lineTo(12, 0); x.lineTo(0, 70); x.lineTo(-12, 0); x.closePath(); x.fill(); font(x, F.play, 26, '700'); x.fillStyle = 'rgba(60,40,20,.8)'; x.textAlign = 'center'; x.fillText('С', 0, -78); x.restore(); }
    });
  });
}
function pulseDot(ctx, x, y, t0, o = {}) { const lt = S.T - t0; if (lt < 0) return; const col = o.col || '209,36,44'; ctx.save(); for (let k = 0; k < 3; k++) { const ph = (lt * .8 + k / 3) % 1; ctx.strokeStyle = `rgba(${col},${(1 - ph) * .8})`; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(x, y, (o.r || 10) + ph * (o.R || 60), 0, 7); ctx.stroke(); } ctx.restore(); put(ctx, Pp.pin(o.pin || P.red), x, y - 10, { s: E.back(clamp(lt / .35)) * (o.s || 1), elev: .4 }); }

// ---------- timeline on paper tape ----------
function timelineTape(ctx, items, y, t0s, o = {}) {
  const x0 = o.x0 || 200, x1 = o.x1 || W - 200; const p = tw(t0s[0] - .4, 1.0, E.io); if (p <= 0) return;
  const tp = cached('tltape' + (x1 - x0), () => sheet({ w: x1 - x0 + 80, h: 46, color: o.tape || '#efe6d2', torn: [0, 8, 0, 8], seed: 4, tex: .5 }));
  ctx.save(); ctx.beginPath(); ctx.rect(x0 - 60, y - 60, (x1 - x0 + 120) * p, 120); ctx.clip(); put(ctx, tp, (x0 + x1) / 2, y, {}); ctx.restore();
  items.forEach((it, i) => { const q = tw(t0s[i], .5, E.back); if (q <= 0) return; put(ctx, Pp.pin(it.red ? P.red : '#2a9d8f'), it.x, y - 6, { s: q, elev: .4 });
    headline(ctx, it.label, it.x, y - 90, t0s[i], { size: it.size || 66, color: it.red ? P.red : (o.ink || P.ink), bg: o.cardBg || '#f6f1e4', rot: (hr(i) - .5) * .06 });
    if (it.sub) hand(ctx, it.sub, it.x, y + 78, t0s[i] + .2, { size: 44, align: 'center', color: o.subColor || '#f4efe3' }); });
}

module.exports = { collageBg, darkDesk, cork, bg, lightDrift, lampLight, vellumCone, scraps, planes, marker, strikeOut, circleMark, underline, hand, typed, typedEv, headline, counter, thread, prop, PROPS, dna, proj, geoPath, mapSprite, pulseDot, timelineTape, R, Ell, Poly };
