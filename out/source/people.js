// Painted 2.5D human figures: realistic proportions (7.5 heads), soft key/shadow, rim light.
const C = require('./core');
const { hex, rgba, mix, shade, lg, rg, spline, clamp, lerp } = C;

// ---------- character presets ----------
const SK = hex('#e9b99a'), SK_OLD = hex('#e2b49b');
const P = {
  keeper: { skin: SK_OLD, hair: hex('#c9c6c4'), hairStyle: 'bun', coat: hex('#1d2f52'), coatLen: 1.9, collar: hex('#16243f'), pants: hex('#1a2540'), shoes: hex('#1a1714'), buttons: true, watch: true, age: 70, female: true, brows: hex('#a9a5a2') },
  dima: { skin: SK, hair: hex('#2a211c'), hairStyle: 'short', coat: hex('#3b3e44'), coatLen: 2.6, shirt: hex('#c9d2dd'), collar: hex('#33363b'), pants: hex('#24262b'), shoes: hex('#141414'), stubble: true, age: 31, brows: hex('#2a211c') },
  dima19: { skin: hex('#edc0a2'), hair: hex('#2f241d'), hairStyle: 'messy', coat: hex('#5a6b5a'), hoodie: true, coatLen: 3.55, pants: hex('#2f3a4c'), shoes: hex('#d9d6cf'), headphones: true, backpack: hex('#2a2e36'), age: 19, brows: hex('#2f241d'), thin: true },
  mom45: { skin: hex('#ebbb9c'), hair: hex('#5a3a28'), hairStyle: 'clip', coat: hex('#a25d55'), cardigan: true, coatLen: 2.2, pants: hex('#4b3f47'), shoes: hex('#7a5a4a'), age: 45, female: true, brows: hex('#4a3020') },
  mom63: { skin: hex('#e4b49c'), hair: hex('#b9b3ae'), hairStyle: 'bob', coat: hex('#7d6a86'), cardigan: true, coatLen: 2.2, pants: hex('#45404a'), shoes: hex('#5a4a40'), glasses: true, age: 63, female: true, brows: hex('#8a817a') },
  dad48: { skin: hex('#e3b090'), hair: hex('#3e332c'), hairStyle: 'dad', coat: hex('#5d6f86'), sweater: true, coatLen: 3.55, pants: hex('#3a3a40'), shoes: hex('#2a2420'), mustache: true, glassesUp: true, age: 48, wide: 1.12, brows: hex('#3e332c') },
  dad66: { skin: hex('#deac92'), hair: hex('#bdb8b2'), hairStyle: 'hat', hat: hex('#5a4637'), coat: hex('#3c3a33'), jacket: true, coatLen: 3.2, pants: hex('#33312e'), shoes: hex('#211d1a'), mustache: true, age: 66, wide: 1.1, stoop: 0.12, brows: hex('#b0aaa4') },
};

// ---------- shading ----------
// L: {key:[r,g,b], kx: -1..1 key direction (where light comes from on x), amb: [r,g,b] shadow tint, rim:[r,g,b], rimX: -1|1, rimI, ki: key intensity}
function shadeFill(ctx, pathFn, bb, base, L, opts = {}) {
  ctx.save(); ctx.beginPath(); pathFn(ctx);
  ctx.fillStyle = rgba(base, 1); ctx.fill();
  ctx.clip();
  const [x, y, w, h] = bb, kx = L.kx ?? -1;
  // form shadow: gradient across from lit side to shadow side
  const xl = kx < 0 ? x : x + w, xs = kx < 0 ? x + w : x;
  ctx.globalCompositeOperation = 'multiply';
  ctx.fillStyle = lg(ctx, xl, y, xs, y + h * 0.15, [[0, 'rgba(255,255,255,1)'], [0.45, rgba(mix([255, 255, 255], L.amb || [60, 70, 110], 0.35))], [1, rgba(L.amb || [60, 70, 110])]]);
  ctx.fillRect(x - 5, y - 5, w + 10, h + 10);
  // top-down occlusion
  if (!opts.noTop) { ctx.fillStyle = lg(ctx, x, y, x, y + h, [[0, 'rgba(255,255,255,1)'], [0.7, 'rgba(235,235,240,1)'], [1, rgba(mix([255, 255, 255], L.amb || [60, 70, 110], 0.5))]]); ctx.fillRect(x - 5, y - 5, w + 10, h + 10); }
  // key light highlight
  ctx.globalCompositeOperation = 'screen';
  ctx.fillStyle = lg(ctx, xl, y, xl + (xs - xl) * 0.6, y, [[0, rgba(L.key, 0.32 * (L.ki ?? 1))], [1, rgba(L.key, 0)]]);
  ctx.fillRect(x - 5, y - 5, w + 10, h + 10);
  // rim light: thin bright band at rim side
  if (L.rimI) {
    ctx.globalCompositeOperation = 'lighter';
    const rx = L.rimX ?? 1, edge = rx > 0 ? x + w : x, bw = Math.max(3, w * (opts.rimW ?? 0.14));
    ctx.fillStyle = lg(ctx, edge, y, edge - rx * bw, y, [[0, rgba(L.rim, 0.85 * L.rimI)], [0.35, rgba(L.rim, 0.3 * L.rimI)], [1, rgba(L.rim, 0)]]);
    ctx.fillRect(x - 5, y - 5, w + 10, h + 10);
  }
  ctx.restore();
}
function capsulePath(x1, y1, x2, y2, r1, r2) {
  return ctx => {
    const a = Math.atan2(y2 - y1, x2 - x1), n = a + Math.PI / 2;
    ctx.moveTo(x1 + Math.cos(n) * r1, y1 + Math.sin(n) * r1);
    ctx.lineTo(x2 + Math.cos(n) * r2, y2 + Math.sin(n) * r2);
    ctx.arc(x2, y2, r2, n, n - Math.PI, true);
    ctx.lineTo(x1 - Math.cos(n) * r1, y1 - Math.sin(n) * r1);
    ctx.arc(x1, y1, r1, n + Math.PI, n, true); ctx.closePath();
  };
}
function bbOf(pts, pad = 0) { let x0 = 1e9, y0 = 1e9, x1 = -1e9, y1 = -1e9; for (const [x, y] of pts) { x0 = Math.min(x0, x); y0 = Math.min(y0, y); x1 = Math.max(x1, x); y1 = Math.max(y1, y); } return [x0 - pad, y0 - pad, x1 - x0 + 2 * pad, y1 - y0 + 2 * pad]; }

// ---------- limbs ----------
function limb(ctx, a, b, r1, r2, col, L, rimW) { const bb = bbOf([a, b], Math.max(r1, r2)); shadeFill(ctx, capsulePath(a[0], a[1], b[0], b[1], r1, r2), bb, col, L, { rimW: rimW ?? 0.3 }); }
function hand(ctx, p, ang, u, skin, L, fist = 0) {
  ctx.save(); ctx.translate(p[0], p[1]); ctx.rotate(ang);
  const w = u * 0.15, h = u * (0.36 - fist * 0.1);
  const path = c => { c.ellipse(0, h * 0.45, w, h * 0.55, 0, 0, 6.283); };
  shadeFill(ctx, path, [-w, 0, 2 * w, h], skin, L, { rimW: 0.35, noTop: true });
  // thumb
  shadeFill(ctx, c => c.ellipse(w * 0.75, h * 0.3, w * 0.32, h * 0.3, -0.5, 0, 6.283), [w * 0.4, 0, w * 0.8, h * 0.6], shade(skin, -0.05), L, { noTop: true });
  ctx.restore();
}
function shoe(ctx, p, u, col, L, dir = 1) {
  const path = c => { c.moveTo(p[0] - u * 0.15 * dir, p[1] - u * 0.18); c.quadraticCurveTo(p[0] + u * 0.5 * dir, p[1] - u * 0.2, p[0] + u * 0.55 * dir, p[1] - u * 0.02); c.lineTo(p[0] - u * 0.2 * dir, p[1]); c.closePath(); };
  shadeFill(ctx, path, [p[0] - u * 0.3, p[1] - u * 0.2, u * 0.9, u * 0.2], col, L);
}

// ---------- head ----------
function headPath3q(u) {
  const s = u; // head center origin
  return [[0, -0.62], [0.28, -0.56], [0.43, -0.4], [0.47, -0.2], [0.465, -0.1], [0.56, 0.07], [0.47, 0.15], [0.45, 0.24], [0.44, 0.32], [0.4, 0.44], [0.3, 0.54], [0.12, 0.5], [-0.1, 0.42], [-0.3, 0.28], [-0.44, 0.05], [-0.48, -0.2], [-0.36, -0.48]].map(([x, y]) => [x * s, y * s]);
}
function headPathFront(u) {
  return [[0, -0.62], [0.32, -0.55], [0.46, -0.3], [0.47, 0], [0.42, 0.22], [0.3, 0.42], [0.12, 0.54], [0, 0.56], [-0.12, 0.54], [-0.3, 0.42], [-0.42, 0.22], [-0.47, 0], [-0.46, -0.3], [-0.32, -0.55]].map(([x, y]) => [x * u, y * u]);
}
function eye(ctx, x, y, w, open, gaze, ch, L, detail, female) {
  const h = w * 0.42 * open;
  ctx.save();
  // socket shadow
  ctx.fillStyle = rg(ctx, x, y - w * 0.1, 0, w * 1.1, [[0, rgba(mix(ch.skin, [90, 50, 60], 0.35), 0.5)], [1, rgba(ch.skin, 0)]]);
  ctx.fillRect(x - w * 1.2, y - w * 1.2, w * 2.4, w * 2.4);
  if (open > 0.08) {
    ctx.beginPath(); ctx.moveTo(x - w / 2, y); ctx.quadraticCurveTo(x, y - h * 1.3, x + w / 2, y); ctx.quadraticCurveTo(x, y + h * 0.8, x - w / 2, y); ctx.closePath();
    ctx.fillStyle = 'rgb(232,226,222)'; ctx.fill(); ctx.save(); ctx.clip();
    const ix = x + gaze * w * 0.22, ir = w * 0.27;
    ctx.fillStyle = rg(ctx, ix, y, 0, ir, [[0, '#1a0f0a'], [0.45, '#3a2416'], [0.9, '#5a3a22'], [1, '#2a1a10']]); ctx.beginPath(); ctx.arc(ix, y, ir, 0, 6.283); ctx.fill();
    // upper lid shadow
    ctx.fillStyle = 'rgba(40,20,20,0.35)'; ctx.fillRect(x - w, y - h * 1.4, w * 2, h * 0.7);
    ctx.restore();
    // catchlight
    ctx.fillStyle = 'rgba(255,255,255,0.9)'; ctx.beginPath(); ctx.arc(x + gaze * w * 0.22 + w * 0.08, y - w * 0.07, w * 0.065, 0, 6.283); ctx.fill();
    // lash line
    ctx.strokeStyle = 'rgba(30,18,14,0.9)'; ctx.lineWidth = Math.max(1, w * (female ? 0.09 : 0.07)); ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(x - w / 2, y + w * 0.02); ctx.quadraticCurveTo(x, y - h * 1.3, x + w / 2, y); ctx.stroke();
  } else {
    ctx.strokeStyle = 'rgba(40,22,18,0.85)'; ctx.lineWidth = Math.max(1, w * 0.07); ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(x - w / 2, y); ctx.quadraticCurveTo(x, y + w * 0.14, x + w / 2, y); ctx.stroke();
  }
  // lid crease
  if (detail) { ctx.strokeStyle = rgba(shade(ch.skin, -0.35), 0.5); ctx.lineWidth = Math.max(0.8, w * 0.035); ctx.beginPath(); ctx.moveTo(x - w * 0.45, y - w * 0.18); ctx.quadraticCurveTo(x, y - w * 0.42, x + w * 0.45, y - w * 0.12); ctx.stroke(); }
  // eye bags for older / tired
  if (detail && (ch.age > 28)) { ctx.strokeStyle = rgba(shade(ch.skin, -0.3), ch.age > 55 ? 0.45 : 0.25); ctx.lineWidth = Math.max(0.8, w * 0.03); ctx.beginPath(); ctx.moveTo(x - w * 0.35, y + w * 0.25); ctx.quadraticCurveTo(x, y + w * 0.42, x + w * 0.4, y + w * 0.22); ctx.stroke(); }
  ctx.restore();
}
function brow(ctx, x, y, w, tilt, col, thick) {
  ctx.save(); ctx.strokeStyle = rgba(col, 0.9); ctx.lineWidth = thick; ctx.lineCap = 'round';
  ctx.beginPath(); ctx.moveTo(x - w / 2, y + tilt * w * 0.15); ctx.quadraticCurveTo(x, y - w * 0.12, x + w / 2, y - tilt * w * 0.12 + w * 0.05); ctx.stroke(); ctx.restore();
}
function mouth(ctx, x, y, w, smile, open, ch, tremble = 0) {
  ctx.save();
  const lip = mix(ch.skin, [170, 70, 70], ch.female ? 0.45 : 0.28);
  if (open > 0.05) {
    ctx.fillStyle = '#3a1616'; ctx.beginPath(); ctx.ellipse(x, y + open * w * 0.1, w * 0.4, w * 0.22 * open, 0, 0, 6.283); ctx.fill();
  }
  ctx.strokeStyle = rgba(shade(lip, -0.35), 0.95); ctx.lineWidth = Math.max(1, w * 0.07); ctx.lineCap = 'round';
  ctx.beginPath(); ctx.moveTo(x - w / 2, y - smile * w * 0.18 + tremble); ctx.quadraticCurveTo(x, y + smile * w * 0.2 - tremble, x + w / 2, y - smile * w * 0.18 + tremble); ctx.stroke();
  // lower lip
  ctx.fillStyle = rgba(lip, 0.55); ctx.beginPath(); ctx.ellipse(x, y + w * 0.14, w * 0.3, w * 0.09, 0, 0, 6.283); ctx.fill();
  ctx.restore();
}

function drawHead(ctx, ch, u, L, ex, front, detail) {
  const pts = front ? headPathFront(u) : headPath3q(u);
  const hair = ch.hair;
  // back hair / bun / volume behind head
  if (!front) {
    if (ch.hairStyle === 'bun') shadeFill(ctx, c => c.ellipse(-0.5 * u, 0.28 * u, 0.24 * u, 0.2 * u, 0.3, 0, 6.283), [-0.75 * u, 0.08 * u, 0.5 * u, 0.42 * u], hair, L);
    if (ch.hairStyle === 'clip') shadeFill(ctx, c => spline(c, [[-0.5 * u, -0.3 * u], [-0.62 * u, 0.3 * u], [-0.5 * u, 0.75 * u], [-0.15 * u, 0.6 * u], [-0.2 * u, 0.1 * u]]), [-0.65 * u, -0.3 * u, 0.5 * u, 1.05 * u], hair, L);
    if (ch.hairStyle === 'bob') shadeFill(ctx, c => spline(c, [[-0.52 * u, -0.3 * u], [-0.6 * u, 0.25 * u], [-0.4 * u, 0.5 * u], [-0.1 * u, 0.3 * u], [-0.2 * u, -0.1 * u]]), [-0.62 * u, -0.3 * u, 0.55 * u, 0.8 * u], hair, L);
  } else {
    if (ch.hairStyle === 'bun') shadeFill(ctx, c => c.ellipse(0, -0.1 * u, 0.56 * u, 0.62 * u, 0, 0, 6.283), [-0.56 * u, -0.72 * u, 1.12 * u, 1.2 * u], shade(hair, -0.15), L);
    if (ch.hairStyle === 'clip' || ch.hairStyle === 'bob') shadeFill(ctx, c => spline(c, [[-0.55 * u, -0.2 * u], [-0.62 * u, 0.5 * u], [-0.3 * u, 0.62 * u], [0.3 * u, 0.62 * u], [0.62 * u, 0.5 * u], [0.55 * u, -0.2 * u], [0, -0.7 * u]]), [-0.62 * u, -0.7 * u, 1.24 * u, 1.3 * u], shade(hair, -0.2), L);
  }
  // ear
  if (!front) shadeFill(ctx, c => c.ellipse(-0.14 * u, 0.04 * u, 0.09 * u, 0.15 * u, 0.15, 0, 6.283), [-0.24 * u, -0.12 * u, 0.2 * u, 0.32 * u], shade(ch.skin, -0.05), L);
  else { for (const s of [-1, 1]) shadeFill(ctx, c => c.ellipse(s * 0.47 * u, 0.04 * u, 0.07 * u, 0.14 * u, 0, 0, 6.283), [s * 0.47 * u - 0.08 * u, -0.1 * u, 0.16 * u, 0.3 * u], shade(ch.skin, -0.08), L); }
  // face
  const bb = bbOf(pts);
  shadeFill(ctx, c => spline(c, pts), bb, ch.skin, { ...L, amb: mix(L.amb || [60, 70, 110], [200, 150, 140], 0.45) }, { rimW: 0.16, noTop: true });
  // cheek warmth + subsurface
  ctx.save(); ctx.beginPath(); spline(ctx, pts); ctx.clip();
  const cx = front ? 0 : 0.25 * u;
  ctx.globalCompositeOperation = 'multiply';
  for (const s of front ? [-1, 1] : [1]) { ctx.fillStyle = rg(ctx, (front ? s * 0.25 : 0.22) * u, 0.18 * u, 0, 0.22 * u, [[0, 'rgba(240,170,165,0.55)'], [1, 'rgba(255,255,255,0)']]); ctx.fillRect(-u, -u, 2 * u, 2 * u); }
  // nose shadow / jaw shadow
  if (!front) { ctx.fillStyle = rg(ctx, 0.47 * u, 0.15 * u, 0, 0.12 * u, [[0, rgba(shade(ch.skin, -0.3), 0.6)], [1, 'rgba(255,255,255,0)']]); ctx.fillRect(0.3 * u, 0, 0.3 * u, 0.3 * u); }
  else { ctx.fillStyle = rg(ctx, 0, 0.15 * u, 0, 0.1 * u, [[0, rgba(shade(ch.skin, -0.3), 0.55)], [1, 'rgba(255,255,255,0)']]); ctx.fillRect(-0.2 * u, 0, 0.4 * u, 0.3 * u); }
  ctx.fillStyle = lg(ctx, 0, 0.35 * u, 0, 0.6 * u, [[0, 'rgba(255,255,255,0)'], [1, rgba(shade(ch.skin, -0.25), 0.6)]]); ctx.fillRect(-u, 0.3 * u, 2 * u, 0.4 * u);
  // stubble
  if (ch.stubble) { ctx.fillStyle = lg(ctx, 0, 0.2 * u, 0, 0.56 * u, [[0, 'rgba(120,100,95,0)'], [0.45, 'rgba(120,100,100,0.45)'], [1, 'rgba(110,95,95,0.6)']]); ctx.beginPath(); ctx.ellipse(front ? 0 : 0.18 * u, 0.4 * u, 0.42 * u, 0.22 * u, 0, 0, 6.283); ctx.fill(); }
  ctx.restore();
  // features
  const g = ex.gaze ?? 0, op = ex.eye ?? 1, bt = ex.brow ?? 0;
  const ew = 0.15 * u;
  if (front) {
    eye(ctx, -0.18 * u, -0.04 * u, ew, op, g, ch, L, detail, ch.female); eye(ctx, 0.18 * u, -0.04 * u, ew, op, g, ch, L, detail, ch.female);
    brow(ctx, -0.18 * u, -0.18 * u, 0.2 * u, -bt, ch.brows, Math.max(1.2, u * 0.03)); ctx.save(); ctx.translate(0.36 * u, 0); ctx.scale(-1, 1); brow(ctx, 0.18 * u, -0.18 * u, 0.2 * u, -bt, ch.brows, Math.max(1.2, u * 0.03)); ctx.restore();
    // nose
    ctx.strokeStyle = rgba(shade(ch.skin, -0.3), 0.6); ctx.lineWidth = Math.max(1, u * 0.02); ctx.beginPath(); ctx.moveTo(-0.04 * u, 0.15 * u); ctx.quadraticCurveTo(0, 0.19 * u, 0.04 * u, 0.15 * u); ctx.stroke();
    mouth(ctx, 0, 0.32 * u, 0.2 * u, ex.smile ?? 0, ex.mouth ?? 0, ch, ex.tremble ?? 0);
  } else {
    eye(ctx, 0.14 * u, -0.05 * u, ew, op, g, ch, L, detail, ch.female);
    eye(ctx, 0.39 * u, -0.05 * u, ew * 0.62, op, g, ch, L, detail, ch.female);
    brow(ctx, 0.15 * u, -0.19 * u, 0.2 * u, -bt, ch.brows, Math.max(1.2, u * 0.03)); brow(ctx, 0.4 * u, -0.19 * u, 0.1 * u, bt, ch.brows, Math.max(1, u * 0.025));
    ctx.strokeStyle = rgba(shade(ch.skin, -0.35), 0.55); ctx.lineWidth = Math.max(1, u * 0.018); ctx.beginPath(); ctx.moveTo(0.47 * u, 0.15 * u); ctx.quadraticCurveTo(0.42 * u, 0.17 * u, 0.4 * u, 0.13 * u); ctx.stroke();
    mouth(ctx, 0.33 * u, 0.32 * u, 0.15 * u, ex.smile ?? 0, ex.mouth ?? 0, ch, ex.tremble ?? 0);
  }
  // wrinkles for older
  if (detail && ch.age > 55) {
    ctx.save(); ctx.strokeStyle = rgba(shade(ch.skin, -0.3), 0.35); ctx.lineWidth = Math.max(0.8, u * 0.012);
    const nx = front ? [[-0.12, 1], [0.12, -1]] : [[0.36, 1]];
    for (const [x0, s] of nx) { ctx.beginPath(); ctx.moveTo((x0 + 0.02 * s) * u, 0.14 * u); ctx.quadraticCurveTo((x0 - 0.02 * s) * u, 0.26 * u, (x0 + 0.0 * s) * u, 0.36 * u); ctx.stroke(); }
    for (let i = 0; i < 2; i++) { ctx.beginPath(); ctx.moveTo((front ? -0.2 : 0.05) * u, (-0.33 - i * 0.06) * u); ctx.quadraticCurveTo((front ? 0 : 0.2) * u, (-0.36 - i * 0.06) * u, (front ? 0.2 : 0.38) * u, (-0.33 - i * 0.06) * u); ctx.stroke(); }
    ctx.restore();
  }
  if (ch.mustache) { ctx.save(); ctx.fillStyle = rgba(shade(ch.hair, -0.1), 0.95); ctx.beginPath(); if (front) ctx.ellipse(0, 0.24 * u, 0.13 * u, 0.04 * u, 0, 0, 6.283); else ctx.ellipse(0.36 * u, 0.24 * u, 0.1 * u, 0.035 * u, -0.1, 0, 6.283); ctx.fill(); ctx.restore(); }
  // front hair
  drawHairFront(ctx, ch, u, L, front);
  if (ch.glasses) {
    ctx.save(); ctx.strokeStyle = 'rgba(60,50,45,0.9)'; ctx.lineWidth = Math.max(1, u * 0.022);
    const ys = -0.04 * u;
    if (front) { for (const s of [-1, 1]) { ctx.beginPath(); ctx.ellipse(s * 0.18 * u, ys, 0.13 * u, 0.1 * u, 0, 0, 6.283); ctx.stroke(); } ctx.beginPath(); ctx.moveTo(-0.05 * u, ys); ctx.lineTo(0.05 * u, ys); ctx.stroke(); }
    else { ctx.beginPath(); ctx.ellipse(0.14 * u, ys, 0.13 * u, 0.1 * u, 0, 0, 6.283); ctx.stroke(); ctx.beginPath(); ctx.ellipse(0.41 * u, ys, 0.07 * u, 0.1 * u, 0, 0, 6.283); ctx.stroke(); ctx.beginPath(); ctx.moveTo(0.01 * u, ys); ctx.lineTo(-0.16 * u, 0); ctx.stroke(); }
    ctx.globalCompositeOperation = 'lighter'; ctx.fillStyle = rgba(L.key, 0.18); ctx.beginPath(); ctx.ellipse((front ? -0.2 : 0.12) * u, ys - 0.03 * u, 0.06 * u, 0.03 * u, -0.4, 0, 6.283); ctx.fill();
    ctx.restore();
  }
  if (ch.glassesUp) { ctx.save(); ctx.strokeStyle = 'rgba(40,35,32,0.95)'; ctx.lineWidth = Math.max(1, u * 0.025); const ys = -0.5 * u; if (front) { for (const s of [-1, 1]) { ctx.beginPath(); ctx.ellipse(s * 0.17 * u, ys, 0.12 * u, 0.07 * u, 0, 0, 6.283); ctx.stroke(); } } else { ctx.beginPath(); ctx.ellipse(0.16 * u, ys, 0.12 * u, 0.07 * u, 0.1, 0, 6.283); ctx.stroke(); ctx.beginPath(); ctx.ellipse(0.38 * u, ys + 0.02 * u, 0.06 * u, 0.06 * u, 0, 0, 6.283); ctx.stroke(); } ctx.restore(); }
  if (ch.headphones && !front) {
    // white earbud with tiny glow
    ctx.save(); ctx.fillStyle = '#f2f2f0'; ctx.beginPath(); ctx.ellipse(-0.1 * u, 0.08 * u, 0.05 * u, 0.055 * u, 0, 0, 6.283); ctx.fill();
    ctx.strokeStyle = 'rgba(240,240,238,0.9)'; ctx.lineWidth = Math.max(1, u * 0.02); ctx.beginPath(); ctx.moveTo(-0.1 * u, 0.12 * u); ctx.quadraticCurveTo(-0.14 * u, 0.4 * u, -0.05 * u, 0.62 * u); ctx.stroke(); ctx.restore();
  }
}
function drawHairFront(ctx, ch, u, L, front) {
  const h = ch.hair, st = ch.hairStyle;
  let pts;
  if (st === 'hat') {
    const hp = front ? [[-0.5, -0.12], [-0.48, -0.5], [-0.25, -0.74], [0.25, -0.74], [0.48, -0.5], [0.5, -0.12]] : [[-0.52, 0.0], [-0.52, -0.42], [-0.25, -0.72], [0.2, -0.72], [0.46, -0.45], [0.5, -0.18]];
    shadeFill(ctx, c => spline(c, hp.map(([x, y]) => [x * u, y * u])), [-0.52 * u, -0.74 * u, 1.04 * u, 0.75 * u], ch.hat, L);
    ctx.save(); ctx.strokeStyle = rgba(shade(ch.hat, -0.25), 0.5); ctx.lineWidth = u * 0.015; for (let i = -4; i <= 4; i++) { ctx.beginPath(); ctx.moveTo(i * 0.1 * u, -0.7 * u); ctx.lineTo(i * 0.11 * u, -0.2 * u); ctx.stroke(); } ctx.restore();
    shadeFill(ctx, c => c.rect(-0.53 * u, -0.26 * u, 1.04 * u, 0.15 * u), [-0.53 * u, -0.26 * u, 1.04 * u, 0.15 * u], shade(ch.hat, -0.1), L);
    // gray sideburn
    if (!front) shadeFill(ctx, c => c.ellipse(-0.2 * u, -0.05 * u, 0.1 * u, 0.12 * u, 0, 0, 6.283), [-0.3 * u, -0.17 * u, 0.2 * u, 0.24 * u], h, L);
    return;
  }
  if (front) {
    const M = { bun: [[-0.47, -0.05], [-0.5, -0.4], [-0.25, -0.66], [0.25, -0.66], [0.5, -0.4], [0.47, -0.05], [0.38, -0.3], [0.05, -0.48], [-0.38, -0.3]], short: [[-0.47, -0.15], [-0.45, -0.52], [-0.1, -0.7], [0.3, -0.66], [0.5, -0.4], [0.47, -0.15], [0.35, -0.38], [-0.05, -0.42], [-0.35, -0.36]], messy: [[-0.5, -0.1], [-0.55, -0.55], [-0.3, -0.78], [0, -0.7], [0.25, -0.82], [0.5, -0.55], [0.5, -0.1], [0.38, -0.3], [0.2, -0.25], [0.05, -0.4], [-0.15, -0.28], [-0.38, -0.3]], clip: [[-0.48, 0.0], [-0.5, -0.42], [-0.2, -0.68], [0.25, -0.66], [0.5, -0.4], [0.48, 0.0], [0.38, -0.25], [0.15, -0.42], [-0.2, -0.38], [-0.38, -0.25]], bob: [[-0.5, 0.1], [-0.52, -0.42], [-0.2, -0.68], [0.25, -0.66], [0.52, -0.4], [0.5, 0.1], [0.4, -0.2], [0.1, -0.4], [-0.3, -0.38], [-0.42, -0.2]], dad: [[-0.47, -0.05], [-0.48, -0.45], [-0.25, -0.65], [0.25, -0.65], [0.48, -0.45], [0.47, -0.05], [0.42, -0.35], [0.2, -0.5], [-0.2, -0.5], [-0.42, -0.35]] };
    pts = M[st];
  } else {
    const M = { bun: [[-0.48, 0.12], [-0.52, -0.3], [-0.3, -0.6], [0.05, -0.68], [0.36, -0.55], [0.48, -0.32], [0.3, -0.38], [0.05, -0.4], [-0.12, -0.2], [-0.22, 0.05]], short: [[-0.46, 0.05], [-0.52, -0.35], [-0.3, -0.65], [0.1, -0.72], [0.42, -0.6], [0.52, -0.38], [0.4, -0.36], [0.15, -0.4], [-0.08, -0.32], [-0.22, -0.1], [-0.3, 0.05]], messy: [[-0.46, 0.1], [-0.56, -0.3], [-0.42, -0.62], [-0.1, -0.8], [0.2, -0.72], [0.48, -0.75], [0.56, -0.45], [0.45, -0.3], [0.32, -0.42], [0.15, -0.3], [-0.05, -0.38], [-0.2, -0.12], [-0.28, 0.1]], clip: [[-0.5, 0.2], [-0.54, -0.3], [-0.3, -0.62], [0.05, -0.68], [0.38, -0.55], [0.5, -0.32], [0.32, -0.38], [0.05, -0.42], [-0.12, -0.22], [-0.24, 0.1]], bob: [[-0.48, 0.35], [-0.55, -0.3], [-0.3, -0.62], [0.05, -0.68], [0.38, -0.55], [0.5, -0.3], [0.3, -0.36], [0.02, -0.38], [-0.12, -0.18], [-0.22, 0.25]], dad: [[-0.46, 0.05], [-0.5, -0.32], [-0.32, -0.6], [0.0, -0.66], [0.2, -0.62], [0.12, -0.5], [-0.08, -0.4], [-0.2, -0.15], [-0.28, 0.05]] };
    pts = M[st];
  }
  const P2 = pts.map(([x, y]) => [x * u, y * u]);
  shadeFill(ctx, c => spline(c, P2), bbOf(P2), h, L, { rimW: 0.12 });
  // strands
  ctx.save(); ctx.beginPath(); spline(ctx, P2); ctx.clip(); ctx.globalCompositeOperation = 'screen'; ctx.strokeStyle = rgba(shade(h, 0.3), 0.12); ctx.lineWidth = Math.max(0.6, u * 0.01);
  for (let i = 0; i < 10; i++) { ctx.beginPath(); const x0 = (-0.4 + i * 0.09) * u; ctx.moveTo(x0, -0.7 * u); ctx.quadraticCurveTo(x0 + 0.1 * u, -0.4 * u, x0 - 0.05 * u, 0.1 * u); ctx.stroke(); }
  ctx.restore();
  if (st === 'clip') { ctx.save(); ctx.fillStyle = '#d8b25a'; ctx.translate(front ? 0.3 * u : -0.2 * u, -0.45 * u); ctx.rotate(0.5); ctx.fillRect(-0.1 * u, -0.025 * u, 0.2 * u, 0.05 * u); ctx.restore(); }
}

// ---------- full figure ----------
// o: {x,y,h, face:1|-1, front, pose:{lean, headTilt, aL:[s,e], aR:[s,e], walk:phase|null, sit}, ex:{eye,brow,smile,mouth,gaze,tremble}, L, alpha, cropTop}
function person(ctx, ch, o) {
  const u = o.h / 7.5, L = o.L, pose = o.pose || {}, front = !!o.front;
  const detail = u > 60;
  ctx.save(); ctx.translate(o.x, o.y);
  if (!front && (o.face ?? 1) < 0) ctx.scale(-1, 1);
  const wide = ch.wide || 1, thin = ch.thin ? 0.9 : 1;
  const W = wide * thin;
  const ph = pose.walk;
  const bob = ph != null ? -Math.abs(Math.cos(ph)) * u * 0.06 : 0;
  ctx.translate(0, bob);
  const lean = (pose.lean || 0) + (ch.stoop || 0);
  // legs (from hip)
  const hipY = -3.8 * u;
  const legs = [];
  const sit = pose.sit;
  for (const side of [0, 1]) {
    let a, k;
    if (sit) { a = 1.45; k = 1.5; }
    else if (ph != null) { const s = Math.sin(ph + side * Math.PI); a = 0.38 * s; k = 0.12 + 0.55 * Math.max(0, Math.sin(ph + side * Math.PI + 1.9)); }
    else { a = side ? 0.04 : -0.04; k = 0.03; }
    legs.push([a, k]);
  }
  const drawLeg = (side) => {
    const [a, k] = legs[side];
    const hx = (side ? 0.12 : -0.18) * u * W;
    const H = [hx, hipY], Kp = [H[0] + Math.sin(a) * 1.9 * u, H[1] + Math.cos(a) * 1.9 * u], A = [Kp[0] + Math.sin(a - k) * 1.85 * u, Kp[1] + Math.cos(a - k) * 1.85 * u];
    const Ls = side ? L : { ...L, rimI: (L.rimI || 0) * 0.5, ki: 0.5 };
    const col = side ? ch.pants : shade(ch.pants, -0.12);
    limb(ctx, H, Kp, 0.33 * u * W, 0.24 * u * W, col, Ls); limb(ctx, Kp, A, 0.24 * u * W, 0.17 * u * W, col, Ls);
    shoe(ctx, [A[0], A[1] + 0.1 * u], u, side ? ch.shoes : shade(ch.shoes, -0.15), Ls);
  };
  if (!o.cropLegs) { drawLeg(0); drawLeg(1); }
  // torso with lean about hip
  ctx.save(); ctx.translate(0, hipY); ctx.rotate(lean); ctx.translate(0, -hipY);
  const shY = -6.15 * u, nY = -6.45 * u;
  // back arm
  const arm = (side, front2) => {
    const sa = (side ? pose.aR : pose.aL) || [side ? 0.1 : -0.1, 0.25];
    let [s, e] = sa;
    if (ph != null && !(side ? pose.aR : pose.aL)) s = -0.32 * Math.sin(ph + side * Math.PI) * (side ? 1 : 1);
    const sx = front ? (side ? 0.95 : -0.95) * u * W : (side ? 0.4 : -0.55) * u * W;
    const S = [sx, shY + 0.15 * u];
    const dir = front ? (side ? 1 : -1) : 1;
    const E = [S[0] + Math.sin(s) * 1.5 * u * dir, S[1] + Math.cos(s) * 1.5 * u];
    const Wr = [E[0] + Math.sin(s + e) * 1.35 * u * dir, E[1] + Math.cos(s + e) * 1.35 * u];
    const sleeve = front2 ? ch.coat : shade(ch.coat, -0.15);
    const Ls = front2 ? L : { ...L, rimI: (L.rimI || 0) * 0.4, ki: 0.4 };
    limb(ctx, S, E, 0.24 * u * W, 0.19 * u * W, sleeve, Ls, 0.35); limb(ctx, E, Wr, 0.19 * u * W, 0.15 * u * W, sleeve, Ls, 0.35);
    // sleeve folds
    ctx.save(); ctx.strokeStyle = rgba(shade(sleeve, -0.4), 0.35); ctx.lineWidth = Math.max(1, u * 0.025); ctx.beginPath(); ctx.moveTo(E[0] - 0.12 * u, E[1] - 0.1 * u); ctx.quadraticCurveTo(E[0], E[1] + 0.05 * u, E[0] + 0.14 * u, E[1] - 0.06 * u); ctx.stroke(); ctx.restore();
    const ha = -Math.atan2(Wr[0] - E[0], Wr[1] - E[1]);
    hand(ctx, Wr, ha, u, ch.skin, Ls, pose.fist || 0);
    if (front2 && o.onHand && (!front || side === 1)) { ctx.save(); ctx.translate(Wr[0], Wr[1]); o.onHand(ctx, u); ctx.restore(); }
    return Wr;
  };
  if (!front) arm(0, false);
  // backpack
  if (ch.backpack && !front) shadeFill(ctx, c => { c.roundRect(-1.25 * u, -6.0 * u, 0.75 * u, 2.1 * u, 0.25 * u); }, [-1.25 * u, -6 * u, 0.75 * u, 2.1 * u], ch.backpack, L);
  // torso shape
  const hemY = hipY + (3.8 - ch.coatLen) * u * -1 + 0; // coatLen: distance below hip? interpret as hem height above feet
  const hy = -ch.coatLen * u;
  let tp;
  if (front) tp = [[-0.28, nY / u + 0.05], [-0.7 * W, shY / u - 0.02], [-0.98 * W, shY / u + 0.25], [-0.95 * W, -5.3], [-0.78 * W, -4.4], [-0.86 * W, hy / u], [0.86 * W, hy / u], [0.78 * W, -4.4], [0.95 * W, -5.3], [0.98 * W, shY / u + 0.25], [0.7 * W, shY / u - 0.02], [0.28, nY / u + 0.05]];
  else tp = [[-0.28, nY / u + 0.05], [-0.62 * W, shY / u + 0.02], [-0.8 * W, shY / u + 0.3], [-0.82 * W, -5.3], [-0.62 * W, -4.4], [-0.72 * W, hy / u], [0.66 * W, hy / u], [0.56 * W, -4.5], [0.68 * W * (ch.female ? 1.05 : 1), -5.4], [0.55 * W, shY / u + 0.05], [0.18, nY / u]];
  const T = tp.map(([x, y]) => [x * u, y * u]);
  // neck
  shadeFill(ctx, c => c.roundRect((front ? -0.2 : -0.12) * u, -6.85 * u, 0.4 * u, 0.6 * u, 0.12 * u), [-0.2 * u, -6.85 * u, 0.4 * u, 0.6 * u], shade(ch.skin, -0.12), L);
  shadeFill(ctx, c => spline(c, T, true, 0.35), bbOf(T), ch.coat, L, { rimW: 0.1 });
  // torso details
  ctx.save(); ctx.beginPath(); spline(ctx, T, true, 0.35); ctx.clip();
  if (ch.shirt) { ctx.fillStyle = rgba(ch.shirt, 0.95); ctx.beginPath(); const cx = front ? 0 : 0.25 * u; ctx.moveTo(cx - 0.22 * u, nY); ctx.lineTo(cx, -5.2 * u); ctx.lineTo(cx + 0.22 * u, nY); ctx.closePath(); ctx.fill(); }
  if (ch.buttons) { const bx = front ? 0.12 * u : 0.42 * u; for (let i = 0; i < 4; i++) { const by = (-5.7 + i * 0.55) * u; ctx.fillStyle = '#b8923c'; ctx.beginPath(); ctx.arc(bx, by, 0.06 * u, 0, 6.283); ctx.fill(); ctx.fillStyle = 'rgba(255,230,160,0.8)'; ctx.beginPath(); ctx.arc(bx - 0.02 * u, by - 0.02 * u, 0.025 * u, 0, 6.283); ctx.fill(); } }
  // lapel / zipper lines
  ctx.strokeStyle = rgba(shade(ch.coat, -0.35), 0.6); ctx.lineWidth = Math.max(1, u * 0.03);
  if (ch.hoodie) { ctx.beginPath(); ctx.moveTo((front ? -0.5 : -0.1) * u, -4.5 * u); ctx.quadraticCurveTo((front ? 0 : 0.2) * u, -4.35 * u, (front ? 0.5 : 0.55) * u, -4.5 * u); ctx.stroke(); }
  else if (!ch.cardigan || true) { ctx.beginPath(); ctx.moveTo((front ? 0 : 0.3) * u, -5.9 * u); ctx.lineTo((front ? 0 : 0.32) * u, hy); ctx.stroke(); }
  if (ch.sweater) { ctx.strokeStyle = rgba(shade(ch.coat, -0.25), 0.35); for (let i = 0; i < 14; i++) { ctx.beginPath(); ctx.moveTo((-1 + i * 0.15) * u, -6.2 * u); ctx.lineTo((-1 + i * 0.15) * u, hy); ctx.stroke(); } }
  ctx.restore();
  // collar / hood
  if (ch.hoodie) shadeFill(ctx, c => c.ellipse((front ? 0 : -0.25) * u, -6.35 * u, 0.55 * u, 0.22 * u, front ? 0 : -0.2, 0, 6.283), [-0.8 * u, -6.6 * u, 1.1 * u, 0.5 * u], shade(ch.coat, -0.08), L);
  else if (ch.collar) { const cp = front ? [[-0.5, -6.25], [-0.3, -6.65], [0, -6.2], [0.3, -6.65], [0.5, -6.25], [0.15, -5.6], [-0.15, -5.6]] : [[-0.55, -6.15], [-0.3, -6.7], [0.0, -6.5], [0.3, -6.25], [0.35, -5.7], [0.0, -6.0]]; const CP = cp.map(([x, y]) => [x * u, y * u]); shadeFill(ctx, c => spline(c, CP, true, 0.2), bbOf(CP), ch.collar, L); }
  // watch chain + glowing pocket watch (keeper)
  if (ch.watch && !o.noWatch) { ctx.save(); ctx.strokeStyle = 'rgba(214,170,80,0.9)'; ctx.lineWidth = Math.max(1, u * 0.02); ctx.beginPath(); ctx.moveTo((front ? 0.12 : 0.42) * u, -5.15 * u); ctx.quadraticCurveTo((front ? 0.45 : 0.6) * u, -4.6 * u, (front ? 0.6 : 0.55) * u, -4.75 * u); ctx.stroke(); ctx.restore(); }
  // head
  ctx.save(); ctx.translate(front ? 0 : 0.05 * u, -7.0 * u); ctx.rotate(pose.headTilt || 0);
  drawHead(ctx, ch, u, L, o.ex || {}, front, detail);
  ctx.restore();
  // front arm (drawn last)
  let wrist = null;
  if (front) { wrist = [arm(0, true), arm(1, true)]; } else wrist = arm(1, true);
  ctx.restore();
  ctx.restore();
  return wrist;
}

// ghost (observer) helper: draw person into offscreen and composite cool & translucent
module.exports = { P, person, shadeFill, spline, drawHead };
