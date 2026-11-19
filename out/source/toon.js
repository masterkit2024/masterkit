// 2D cartoon characters: outlined fills, 2-3 tone cel shading (offset crescent), big expressive faces.
const C = require('./core');
const { hex, rgba, mix, shade, lerp, clamp, spline } = C;
const INK = '#24161a';

// ---------- shapes ----------
// shape: {t:'sp', p:[[x,y]..], ten} | {t:'el', x,y,rx,ry,r} | {t:'cap', a,b,r1,r2} | {t:'rr', x,y,w,h,r}
function addShape(ctx, s, ox = 0, oy = 0) {
  if (s.t === 'sp') { const p = s.p.map(([x, y]) => [x + ox, y + oy]); spline(ctx, p, s.open ? false : true, s.ten ?? 0.5); }
  else if (s.t === 'el') { ctx.moveTo(s.x + ox + s.rx * Math.cos(s.r || 0), s.y + oy + s.rx * Math.sin(s.r || 0)); ctx.ellipse(s.x + ox, s.y + oy, s.rx, s.ry, s.r || 0, 0, 6.2832); ctx.closePath(); }
  else if (s.t === 'rr') { ctx.roundRect(s.x + ox, s.y + oy, s.w, s.h, s.r); }
  else if (s.t === 'cap') {
    const [x1, y1] = s.a, [x2, y2] = s.b, r1 = s.r1, r2 = s.r2;
    const a = Math.atan2(y2 - y1, x2 - x1), n = a + Math.PI / 2;
    ctx.moveTo(x1 + ox + Math.cos(n) * r1, y1 + oy + Math.sin(n) * r1);
    ctx.lineTo(x2 + ox + Math.cos(n) * r2, y2 + oy + Math.sin(n) * r2);
    ctx.arc(x2 + ox, y2 + oy, r2, n, n - Math.PI, true);
    ctx.lineTo(x1 + ox - Math.cos(n) * r1, y1 + oy - Math.sin(n) * r1);
    ctx.arc(x1 + ox, y1 + oy, r1, n + Math.PI, n, true); ctx.closePath();
  }
}
// draw one part: base fill, cel shadow crescent, rim crescent, ink outline
function part(ctx, s, base, Lt, o = {}) {
  const lw = Lt.lw;
  ctx.save();
  ctx.beginPath(); addShape(ctx, s); ctx.fillStyle = rgba(base); ctx.fill();
  ctx.save(); ctx.clip();
  const k = Lt.u * (o.sh ?? 0.09);
  // shadow crescent on far side from key light
  ctx.beginPath(); addShape(ctx, s); addShape(ctx, s, -Lt.kx * k, -k * 0.6);
  ctx.fillStyle = rgba(mix(shade(base, -0.28), Lt.amb, 0.35)); ctx.fill('evenodd');
  // rim crescent
  if (Lt.rimI > 0 && !o.noRim) { const r = Lt.u * (o.rim ?? 0.035); ctx.beginPath(); addShape(ctx, s); addShape(ctx, s, -Lt.rimX * r, 0); ctx.fillStyle = rgba(mix(base, Lt.rim, 0.75), Lt.rimI); ctx.fill('evenodd'); }
  ctx.restore();
  if (!o.noLine) { ctx.beginPath(); addShape(ctx, s); ctx.lineWidth = o.lw ?? lw; ctx.strokeStyle = INK; ctx.lineJoin = 'round'; ctx.lineCap = 'round'; ctx.stroke(); }
  ctx.restore();
}
function line(ctx, pts, lw, col = INK, curve = true) { ctx.save(); ctx.strokeStyle = col; ctx.lineWidth = lw; ctx.lineCap = 'round'; ctx.lineJoin = 'round'; ctx.beginPath(); if (curve && pts.length > 2) spline(ctx, pts, false, 0.5); else { ctx.moveTo(...pts[0]); for (const p of pts.slice(1)) ctx.lineTo(...p); } ctx.stroke(); ctx.restore(); }

// ---------- character sheets ----------
const SKIN = hex('#f3c6a2');
const CH = {
  keeper: { heads: 3.45, w: 1.0, skin: hex('#f0c2a4'), hair: hex('#d9d6d8'), style: 'bun', head: 'round', coat: hex('#24406e'), coat2: hex('#1a2f52'), coatLen: 0.15, pants: hex('#1c2a48'), shoes: hex('#2a2224'), brows: hex('#b9b4b6'), buttons: true, chain: true, age: 70, nose: 'soft', wrinkles: true, blush: 0.5, lashes: true },
  dima: { heads: 3.9, w: 1.0, skin: hex('#f1c19c'), hair: hex('#2b2125'), style: 'quiff', head: 'long', coat: hex('#45474f'), coat2: hex('#383a41'), coatLen: 0.4, shirt: hex('#e8eef4'), pants: hex('#2a2c33'), shoes: hex('#1b1a1d'), stubble: true, brows: hex('#2b2125'), age: 31, nose: 'straight', bags: true },
  dima19: { heads: 3.85, w: 0.9, skin: hex('#f5c8a4'), hair: hex('#33261f'), style: 'messy', head: 'long', coat: hex('#6f8f5e'), coat2: hex('#5b7a4c'), hoodie: true, coatLen: 1.35, pants: hex('#3a4c6e'), shoes: hex('#ecebe6'), brows: hex('#33261f'), age: 19, nose: 'button', earbuds: true, backpack: hex('#2f3440') },
  mom45: { heads: 3.6, w: 1.0, skin: hex('#f3c3a0'), hair: hex('#6a3f2a'), style: 'clip', head: 'round', coat: hex('#c86b62'), coat2: hex('#b25a53'), robe: true, coatLen: 0.55, pants: hex('#5a4652'), shoes: hex('#8a5a4a'), brows: hex('#5a3322'), age: 45, nose: 'soft', blush: 0.7, lashes: true },
  mom63: { heads: 3.55, w: 1.0, skin: hex('#efbfa2'), hair: hex('#c9c3c4'), style: 'bob', head: 'round', coat: hex('#8f7aa0'), coat2: hex('#7d6990'), robe: true, coatLen: 0.55, pants: hex('#4f4856'), shoes: hex('#6a5548'), glasses: true, brows: hex('#9c9496'), age: 63, nose: 'soft', blush: 0.5, wrinkles: true, lashes: true },
  dad48: { heads: 3.7, w: 1.22, skin: hex('#eebc96'), hair: hex('#463a32'), style: 'dad', head: 'square', coat: hex('#5f7fa6'), coat2: hex('#4f6d92'), sweater: true, coatLen: 1.3, pants: hex('#3b3d47'), shoes: hex('#2b2522'), mustache: true, glassesUp: true, brows: hex('#463a32'), age: 48, nose: 'big' },
  dad66: { heads: 3.6, w: 1.2, skin: hex('#e8b796'), hair: hex('#cdc8c4'), style: 'hat', hat: hex('#6e5747'), head: 'square', coat: hex('#5a5243'), coat2: hex('#4a4337'), jacket: true, coatLen: 0.9, pants: hex('#3a3833'), shoes: hex('#262220'), mustache: true, brows: hex('#c2bcb7'), age: 66, nose: 'big', stoop: 0.13, wrinkles: true },
};

// ---------- expressions ----------
const EX = {
  neutral: { brow: 0, browH: 0, eye: 1, pupil: 1, smile: 0, mouth: 0, tilt: 0 },
  soft: { brow: -0.15, browH: 0, eye: 0.85, pupil: 1.05, smile: 0.45, mouth: 0, tilt: 0.03 },
  smile: { brow: -0.1, browH: -0.05, eye: 0.8, pupil: 1.05, smile: 0.8, mouth: 0, tilt: 0 },
  excited: { brow: -0.2, browH: -0.12, eye: 1.15, pupil: 1.15, smile: 1, mouth: 0.4, tilt: -0.04 },
  surprised: { brow: 0, browH: -0.16, eye: 1.25, pupil: 0.75, smile: 0, mouth: 0.35, tilt: 0 },
  confused: { brow: 0.45, browH: -0.06, eye: 1, pupil: 0.95, smile: -0.25, mouth: 0, tilt: 0.06, asym: 1 },
  sad: { brow: -0.7, browH: 0.02, eye: 0.7, pupil: 1.0, smile: -0.5, mouth: 0, tilt: 0.06 },
  teary: { brow: -0.8, browH: 0, eye: 0.62, pupil: 1.12, smile: -0.35, mouth: 0, tilt: 0.06, tear: 1 },
  tender: { brow: -0.55, browH: 0, eye: 0.75, pupil: 1.12, smile: 0.25, mouth: 0, tilt: 0.05 },
  bored: { brow: 0.1, browH: 0.05, eye: 0.55, pupil: 1, smile: -0.1, mouth: 0, tilt: 0.02 },
  annoyed: { brow: 0.55, browH: 0.04, eye: 0.6, pupil: 0.95, smile: -0.4, mouth: 0, tilt: -0.04 },
  smirk: { brow: -0.1, browH: 0, eye: 0.7, pupil: 1, smile: 0.55, mouth: 0, tilt: 0.04, asym: 1 },
  hope: { brow: -0.45, browH: -0.08, eye: 1.05, pupil: 1.1, smile: 0.15, mouth: 0.05, tilt: -0.03 },
  broken: { brow: -0.95, browH: 0.0, eye: 0.5, pupil: 1.1, smile: -0.6, mouth: 0.2, tilt: 0.08, tear: 1 },
};
function exMix(a, b, k) { const A = typeof a === 'string' ? EX[a] : a, B = typeof b === 'string' ? EX[b] : b; const o = {}; for (const key of new Set([...Object.keys(A), ...Object.keys(B)])) o[key] = lerp(A[key] ?? 0, B[key] ?? 0, k); return o; }

// ---------- head ----------
function headShape(ch, u, front) {
  const S = { round: [[0, -0.52], [0.36, -0.46], [0.5, -0.18], [0.5, 0.16], [0.4, 0.4], [0.18, 0.52], [-0.1, 0.5], [-0.36, 0.38], [-0.48, 0.12], [-0.48, -0.2], [-0.32, -0.46]],
    long: [[0, -0.54], [0.34, -0.48], [0.47, -0.2], [0.47, 0.14], [0.4, 0.38], [0.2, 0.54], [-0.06, 0.52], [-0.32, 0.4], [-0.44, 0.12], [-0.46, -0.22], [-0.3, -0.48]],
    square: [[0, -0.52], [0.36, -0.48], [0.5, -0.2], [0.52, 0.14], [0.46, 0.4], [0.24, 0.52], [-0.12, 0.52], [-0.4, 0.42], [-0.5, 0.12], [-0.5, -0.22], [-0.34, -0.46]] };
  let p = S[ch.head];
  if (front) p = p.map(([x, y]) => [x * (Math.abs(x) > 0.4 ? 0.98 : 1), y]).map(([x, y], i, arr) => [x, y]); // keep
  if (front) { // symmetric version
    const half = p.filter(([x]) => x >= 0); p = [...half, ...half.slice().reverse().map(([x, y]) => [-x, y])];
  }
  return { t: 'sp', p: p.map(([x, y]) => [x * u, y * u]) };
}
function eye(ctx, x, y, u, ex, ch, Lt, side, front) {
  const rx = u * 0.1 * (front ? 1 : (side ? 0.78 : 1)), ry = u * 0.125 * (ex.eye > 1 ? 1 + (ex.eye - 1) * 0.6 : 1);
  const open = clamp(ex.eye, 0, 1.3), lw = Lt.lw * 0.8;
  ctx.save();
  if (open > 0.12) {
    ctx.beginPath(); ctx.ellipse(x, y, rx, ry, 0, 0, 6.283); ctx.fillStyle = '#fbf7f2'; ctx.fill();
    ctx.save(); ctx.clip();
    const pr = u * 0.058 * ex.pupil, px = x + (ex.gaze || 0) * rx * 0.45 + (front ? 0 : rx * 0.15), py = y + (ex.gazeY || 0) * ry * 0.4 + ry * 0.08;
    ctx.fillStyle = '#3a2418'; ctx.beginPath(); ctx.arc(px, py, pr * 1.25, 0, 6.283); ctx.fill();
    ctx.fillStyle = '#140c0a'; ctx.beginPath(); ctx.arc(px, py, pr * 0.8, 0, 6.283); ctx.fill();
    ctx.fillStyle = '#ffffff'; ctx.beginPath(); ctx.arc(px + pr * 0.45, py - pr * 0.5, pr * 0.38, 0, 6.283); ctx.fill();
    ctx.beginPath(); ctx.arc(px - pr * 0.4, py + pr * 0.45, pr * 0.15, 0, 6.283); ctx.fill();
    // lid (skin) from top depending on openness
    const lidY = y - ry + (1 - Math.min(1, open)) * ry * 2;
    ctx.fillStyle = rgba(shade(ch.skin, -0.05)); ctx.fillRect(x - rx * 1.2, y - ry * 1.3, rx * 2.4, lidY - (y - ry * 1.3));
    if (ex.brow < -0.3) { ctx.fillStyle = rgba(shade(ch.skin, -0.05)); ctx.beginPath(); ctx.moveTo(x + rx * (side ? -1 : 1) * 1.2, lidY - 2); ctx.lineTo(x - rx * (side ? -1 : 1) * 1.2, lidY - 2); ctx.lineTo(x - rx * (side ? -1 : 1) * 1.2, lidY + ry * 0.35 * (-ex.brow)); ctx.closePath(); ctx.fill(); }
    ctx.restore();
    ctx.beginPath(); ctx.ellipse(x, y, rx, ry, 0, 0, 6.283); ctx.lineWidth = lw; ctx.strokeStyle = INK; ctx.stroke();
    // lid line
    if (open < 0.98) line(ctx, [[x - rx * 1.05, lidY + 1], [x, lidY - ry * 0.08], [x + rx * 1.05, lidY + 1]], lw);
    if (ch.lashes) line(ctx, [[x + rx * 0.85, y - ry * 0.55 + (1 - Math.min(1, open)) * ry], [x + rx * 1.25, y - ry * 0.8 + (1 - Math.min(1, open)) * ry]], lw * 0.8);
    if (ex.tear) { const ty = y + ry * 1.1 + ((Date.now ? 0 : 0)); ctx.fillStyle = 'rgba(190,230,255,0.9)'; ctx.beginPath(); ctx.ellipse(x - rx * 0.3, y + ry * 1.05, rx * 0.22 * ex.tear, ry * 0.3 * ex.tear, 0, 0, 6.283); ctx.fill(); ctx.strokeStyle = 'rgba(120,170,210,0.8)'; ctx.lineWidth = lw * 0.5; ctx.stroke(); }
  } else {
    line(ctx, [[x - rx, y], [x, y + ry * 0.35], [x + rx, y]], lw * 1.1);
    if (ch.lashes) line(ctx, [[x + rx, y], [x + rx * 1.3, y - ry * 0.15]], lw * 0.8);
  }
  if (ch.bags || ch.age > 55) line(ctx, [[x - rx * 0.6, y + ry * 1.25], [x, y + ry * 1.42], [x + rx * 0.7, y + ry * 1.2]], lw * 0.5, rgba(shade(ch.skin, -0.35), 0.8));
  ctx.restore();
}
function brow(ctx, x, y, u, ex, ch, Lt, mirror, k = 1) {
  const w = u * 0.15 * k, a = ex.brow * (mirror ? -1 : 1), h = (ex.browH || 0) * u;
  // a>0 -> inner end down (angry); a<0 inner up (sad). inner end is toward face center: for mirror=false inner is +x side
  const ix = x + (mirror ? -w / 2 : w / 2), ox = x + (mirror ? w / 2 : -w / 2);
  const iy = y + h + (a * 0.06 - 0.018) * u, oy = y + h - a * u * 0.015;
  line(ctx, [[ox, oy], [(ox + ix) / 2, Math.min(oy, iy) - u * 0.025], [ix, iy]], Math.max(2, u * 0.042), rgba(shade(ch.brows, -0.25)));
}
function mouth(ctx, x, y, u, ex, ch, Lt, front, talkAmt) {
  const w = u * (front ? 0.2 : 0.16), sm = ex.smile, op = clamp((ex.mouth || 0) + (talkAmt || 0), 0, 1), lw = Lt.lw * 0.85;
  ctx.save();
  if (op > 0.06) {
    const h = u * 0.14 * op;
    ctx.beginPath(); ctx.moveTo(x - w / 2, y - sm * u * 0.03); ctx.quadraticCurveTo(x, y + sm * u * 0.05 - h * 0.15, x + w / 2, y - sm * u * 0.03); ctx.quadraticCurveTo(x, y + h + sm * u * 0.04, x - w / 2, y - sm * u * 0.03); ctx.closePath();
    ctx.fillStyle = '#5a1e22'; ctx.fill(); ctx.save(); ctx.clip(); ctx.fillStyle = '#e27a7c'; ctx.beginPath(); ctx.ellipse(x, y + h * 0.9, w * 0.3, h * 0.45, 0, 0, 6.283); ctx.fill(); if (sm > 0.5) { ctx.fillStyle = '#fff'; ctx.fillRect(x - w / 2, y - u * 0.05, w, u * 0.035 + sm * u * 0.01); } ctx.restore();
    ctx.lineWidth = lw; ctx.strokeStyle = INK; ctx.stroke();
  } else {
    const asym = ex.asym ? u * 0.025 : 0;
    line(ctx, [[x - w / 2, y - sm * u * 0.045], [x, y + sm * u * 0.05 + (ex.tremble || 0)], [x + w / 2, y - sm * u * 0.045 - asym]], lw);
    if (sm > 0.3) { line(ctx, [[x + w / 2 - u * 0.005, y - sm * u * 0.045 - asym - u * 0.02], [x + w / 2 + u * 0.015, y - sm * u * 0.045 - asym + u * 0.01]], lw * 0.7); }
  }
  ctx.restore();
}
function nose(ctx, x, y, u, ch, Lt, front) {
  const lw = Lt.lw * 0.8, s = ch.nose === 'big' ? 1.35 : ch.nose === 'button' ? 0.8 : 1;
  ctx.save();
  if (front) { ctx.fillStyle = rgba(shade(ch.skin, -0.12)); ctx.beginPath(); ctx.ellipse(x, y, u * 0.05 * s, u * 0.04 * s, 0, 0, 6.283); ctx.fill(); line(ctx, [[x - u * 0.045 * s, y + u * 0.01], [x, y + u * 0.04 * s], [x + u * 0.045 * s, y + u * 0.01]], lw * 0.8); }
  else {
    ctx.beginPath(); ctx.moveTo(x - u * 0.02, y - u * 0.1 * s); ctx.quadraticCurveTo(x + u * 0.1 * s, y + u * 0.02, x + u * 0.02, y + u * 0.05 * s); ctx.quadraticCurveTo(x - u * 0.03, y + u * 0.06 * s, x - u * 0.04, y + u * 0.03); ctx.fillStyle = rgba(shade(ch.skin, -0.02)); ctx.fill(); ctx.lineWidth = lw; ctx.strokeStyle = INK; ctx.stroke();
  }
  ctx.restore();
}
function hairBack(ctx, ch, u, Lt, front) {
  const h = ch.hair;
  if (ch.style === 'bun') { if (front) part(ctx, { t: 'el', x: 0, y: -0.5 * u, rx: 0.22 * u, ry: 0.17 * u }, h, Lt); else part(ctx, { t: 'el', x: -0.5 * u, y: 0.12 * u, rx: 0.2 * u, ry: 0.18 * u }, h, Lt); }
  if (ch.style === 'clip') { part(ctx, { t: 'sp', p: front ? [[-0.55, -0.1], [-0.6, 0.45], [-0.35, 0.62], [0.35, 0.62], [0.6, 0.45], [0.55, -0.1]].map(([x, y]) => [x * u, y * u]) : [[-0.42, -0.2], [-0.6, 0.25], [-0.55, 0.62], [-0.25, 0.62], [-0.1, 0.2]].map(([x, y]) => [x * u, y * u]) }, h, Lt); }
  if (ch.style === 'bob') { part(ctx, { t: 'sp', p: front ? [[-0.56, -0.15], [-0.6, 0.35], [-0.4, 0.45], [0.4, 0.45], [0.6, 0.35], [0.56, -0.15]].map(([x, y]) => [x * u, y * u]) : [[-0.45, -0.25], [-0.6, 0.18], [-0.48, 0.42], [-0.15, 0.35], [-0.1, 0.0]].map(([x, y]) => [x * u, y * u]) }, h, Lt); }
}
function hairFront(ctx, ch, u, Lt, front) {
  const h = ch.hair, st = ch.style;
  const M3 = {
    bun: [[-0.5, 0.1], [-0.52, -0.3], [-0.3, -0.56], [0.05, -0.6], [0.38, -0.5], [0.5, -0.28], [0.3, -0.34], [0.05, -0.36], [-0.15, -0.2], [-0.25, 0.08]],
    quiff: [[-0.47, 0.08], [-0.52, -0.3], [-0.36, -0.58], [-0.02, -0.68], [0.36, -0.66], [0.56, -0.5], [0.48, -0.36], [0.3, -0.4], [0.05, -0.38], [-0.18, -0.24], [-0.28, 0.06]],
    messy: [[-0.47, 0.12], [-0.56, -0.25], [-0.5, -0.5], [-0.32, -0.66], [-0.12, -0.6], [0.0, -0.74], [0.18, -0.6], [0.38, -0.68], [0.5, -0.5], [0.56, -0.28], [0.42, -0.34], [0.36, -0.2], [0.2, -0.34], [0.05, -0.24], [-0.12, -0.32], [-0.22, -0.1], [-0.3, 0.1]],
    clip: [[-0.5, 0.25], [-0.54, -0.3], [-0.32, -0.56], [0.05, -0.6], [0.4, -0.5], [0.52, -0.25], [0.32, -0.32], [0.08, -0.36], [-0.12, -0.18], [-0.25, 0.2]],
    bob: [[-0.48, 0.38], [-0.56, -0.3], [-0.32, -0.58], [0.05, -0.62], [0.42, -0.5], [0.54, -0.22], [0.5, 0.0], [0.34, -0.3], [0.05, -0.36], [-0.14, -0.18], [-0.24, 0.3]],
    dad: [[-0.48, 0.05], [-0.5, -0.32], [-0.32, -0.56], [-0.02, -0.6], [0.18, -0.58], [0.1, -0.46], [-0.1, -0.38], [-0.24, -0.15], [-0.3, 0.05]],
  };
  const MF = {
    bun: [[-0.5, 0.0], [-0.5, -0.32], [-0.25, -0.56], [0.25, -0.56], [0.5, -0.32], [0.5, 0.0], [0.4, -0.25], [0.05, -0.36], [-0.05, -0.36], [-0.4, -0.25]],
    quiff: [[-0.48, -0.05], [-0.5, -0.38], [-0.25, -0.62], [0.2, -0.7], [0.5, -0.5], [0.49, -0.08], [0.36, -0.34], [0.1, -0.4], [-0.2, -0.36], [-0.38, -0.26]],
  };
  if (st === 'hat') {
    const hp = (front ? [[-0.52, -0.08], [-0.5, -0.42], [-0.3, -0.66], [0.3, -0.66], [0.5, -0.42], [0.52, -0.08]] : [[-0.54, 0.02], [-0.54, -0.38], [-0.3, -0.66], [0.15, -0.68], [0.45, -0.48], [0.52, -0.16]]).map(([x, y]) => [x * u, y * u]);
    part(ctx, { t: 'sp', p: hp }, ch.hat, Lt);
    part(ctx, { t: 'rr', x: -0.55 * u, y: -0.24 * u, w: 1.08 * u, h: 0.16 * u, r: 0.06 * u }, shade(ch.hat, -0.1), Lt);
    for (let i = -3; i <= 3; i++) line(ctx, [[i * 0.12 * u, -0.6 * u], [i * 0.13 * u, -0.28 * u]], Lt.lw * 0.5, rgba(shade(ch.hat, -0.35)), false);
    part(ctx, { t: 'el', x: (front ? 0 : 0.0) * u, y: -0.7 * u, rx: 0.1 * u, ry: 0.07 * u }, shade(ch.hat, 0.1), Lt);
    return;
  }
  const pts = (front ? (MF[st] || M3[st].map(([x, y]) => [x - 0.04, y])) : M3[st]).map(([x, y]) => [x * u, y * u]);
  part(ctx, { t: 'sp', p: pts }, h, Lt, { sh: 0.07 });
  // shine strands
  ctx.save(); ctx.beginPath(); addShape(ctx, { t: 'sp', p: pts }); ctx.clip();
  line(ctx, [[-0.15 * u, -0.5 * u], [0.05 * u, -0.56 * u], [0.25 * u, -0.5 * u]], Lt.lw * 1.2, rgba(shade(h, 0.35), 0.55));
  ctx.restore();
  if (st === 'clip') { ctx.save(); ctx.translate((front ? 0.3 : -0.12) * u, -0.42 * u); ctx.rotate(0.6); part(ctx, { t: 'rr', x: -0.12 * u, y: -0.035 * u, w: 0.24 * u, h: 0.07 * u, r: 0.03 * u }, hex('#f2c14e'), Lt); ctx.restore(); }
}
function drawHead(ctx, ch, u, Lt, ex, front, talkAmt) {
  hairBack(ctx, ch, u, Lt, front);
  // ears
  if (!front) part(ctx, { t: 'el', x: -0.2 * u, y: 0.06 * u, rx: 0.09 * u, ry: 0.13 * u }, ch.skin, Lt, { sh: 0.05 });
  else for (const s of [-1, 1]) part(ctx, { t: 'el', x: s * 0.49 * u, y: 0.06 * u, rx: 0.07 * u, ry: 0.11 * u }, ch.skin, Lt, { sh: 0.04 });
  part(ctx, headShape(ch, u, front), ch.skin, Lt, { sh: 0.1 });
  const fx = front ? 0 : 0.17 * u; // face center shift for 3/4
  // marks: blush, stubble, wrinkles
  ctx.save(); ctx.beginPath(); addShape(ctx, headShape(ch, u, front)); ctx.clip();
  if (ch.stubble) { ctx.fillStyle = 'rgba(70,55,60,0.10)'; ctx.beginPath(); ctx.ellipse(fx + 0.06 * u, 0.42 * u, 0.3 * u, 0.13 * u, 0, 0, 6.283); ctx.fill(); }
  const bl = (ch.blush ?? 0.4) * (ex.blush ?? 1);
  for (const bx of front ? [-0.27, 0.27] : [0.02, 0.4]) { ctx.fillStyle = C.rg(ctx, bx * u + (front ? 0 : 0.02 * u), 0.2 * u, 0, 0.1 * u, [[0, `rgba(240,120,120,${0.45 * bl})`], [1, 'rgba(240,120,120,0)']]); ctx.fillRect(bx * u - 0.12 * u, 0.08 * u, 0.24 * u, 0.24 * u); }
  ctx.restore();
  const ey = 0.02 * u;
  if (front) { eye(ctx, -0.19 * u, ey, u, ex, ch, Lt, 0, true); eye(ctx, 0.19 * u, ey, u, ex, ch, Lt, 0, true); brow(ctx, -0.19 * u, ey - 0.2 * u, u, ex, ch, Lt, false); brow(ctx, 0.19 * u, ey - 0.2 * u, u, ex, ch, Lt, true); nose(ctx, 0, 0.17 * u, u, ch, Lt, true); mouth(ctx, 0, 0.31 * u, u, ex, ch, Lt, true, talkAmt); }
  else { eye(ctx, 0.05 * u, ey, u, ex, ch, Lt, 1, false); eye(ctx, 0.33 * u, ey, u, ex, ch, Lt, 0, false); brow(ctx, 0.04 * u, ey - 0.2 * u, u, ex, ch, Lt, false, 0.9); brow(ctx, 0.34 * u, ey - 0.2 * u, u, ex, ch, Lt, true, 0.75); nose(ctx, 0.47 * u, 0.15 * u, u, ch, Lt, false); mouth(ctx, 0.3 * u, 0.32 * u, u, ex, ch, Lt, false, talkAmt); }
  if (ch.wrinkles) { const lw = Lt.lw * 0.55, c = rgba(shade(ch.skin, -0.32)); const cx = front ? 0 : 0.18 * u; line(ctx, [[cx - 0.14 * u, -0.34 * u], [cx, -0.37 * u], [cx + 0.14 * u, -0.34 * u]], lw, c); if (front) { line(ctx, [[-0.12 * u, 0.2 * u], [-0.15 * u, 0.3 * u]], lw, c); line(ctx, [[0.12 * u, 0.2 * u], [0.15 * u, 0.3 * u]], lw, c); } else line(ctx, [[0.42 * u, 0.22 * u], [0.4 * u, 0.32 * u]], lw, c); }
  if (ch.mustache) part(ctx, { t: 'sp', p: (front ? [[-0.16, 0.25], [0, 0.21], [0.16, 0.25], [0.12, 0.29], [0, 0.27], [-0.12, 0.29]] : [[0.18, 0.25], [0.34, 0.2], [0.46, 0.24], [0.42, 0.28], [0.3, 0.27], [0.2, 0.29]]).map(([x, y]) => [x * u, y * u]) }, shade(ch.hair, -0.05), Lt, { sh: 0.03 });
  hairFront(ctx, ch, u, Lt, front);
  if (ch.glasses) { ctx.save(); ctx.strokeStyle = '#5a4436'; ctx.lineWidth = Lt.lw * 0.8; const pts = front ? [-0.19, 0.19] : [0.05, 0.33]; for (const px of pts) { ctx.beginPath(); ctx.ellipse(px * u, ey, 0.14 * u, 0.12 * u, 0, 0, 6.283); ctx.stroke(); ctx.fillStyle = 'rgba(255,255,255,0.12)'; ctx.fill(); } ctx.beginPath(); ctx.moveTo((pts[0] + 0.14) * u, ey); ctx.lineTo((pts[1] - 0.14) * u, ey); ctx.stroke(); ctx.restore(); }
  if (ch.glassesUp) { ctx.save(); ctx.strokeStyle = '#2e2622'; ctx.lineWidth = Lt.lw * 0.8; const pts = front ? [-0.18, 0.18] : [0.04, 0.32]; for (const px of pts) { ctx.beginPath(); ctx.ellipse(px * u, -0.44 * u, 0.12 * u, 0.08 * u, 0, 0, 6.283); ctx.stroke(); } ctx.restore(); }
  if (ch.earbuds && !front) { part(ctx, { t: 'el', x: -0.16 * u, y: 0.1 * u, rx: 0.05 * u, ry: 0.055 * u }, hex('#ffffff'), Lt, { sh: 0.02, lw: Lt.lw * 0.7 }); line(ctx, [[-0.16 * u, 0.15 * u], [-0.2 * u, 0.4 * u], [-0.1 * u, 0.62 * u]], Lt.lw * 0.6, '#f4f4f2'); }
  if (ex.tear && ex.tearRun) { ctx.save(); ctx.fillStyle = 'rgba(190,230,255,0.85)'; const ty = 0.15 * u + ex.tearRun * 0.3 * u; ctx.beginPath(); ctx.ellipse((front ? -0.2 : 0.03) * u, ty, 0.025 * u, 0.04 * u, 0, 0, 6.283); ctx.fill(); ctx.restore(); }
}

// ---------- full figure ----------
// o: {x,y,h(head unit px), face:1|-1, front, pose:{lean, tilt, aL:[s,e], aR:[s,e], walk, sit, bob}, ex, L, talk, hold:(ctx,u)=>{} (front hand item), crop}
function toon(ctx, ch, o) {
  const u = o.h, front = !!o.front, pose = o.pose || {}, W = ch.w || 1;
  const Lt = { u, lw: Math.max(2.2, u * 0.035), kx: o.L.kx ?? -1, amb: o.L.amb, rim: o.L.rim, rimX: o.L.rimX ?? 1, rimI: o.L.rimI ?? 0.8 };
  const ex = o.ex || EX.neutral;
  ctx.save(); ctx.translate(o.x, o.y);
  if (!front && (o.face ?? 1) < 0) { ctx.scale(-1, 1); Lt.kx = -Lt.kx; Lt.rimX = -Lt.rimX; }
  const ph = pose.walk;
  const breathe = Math.sin((o.t || 0) * 2.2 + (o.seed || 0)) * u * 0.012;
  const bob = ph != null ? -Math.abs(Math.sin(ph)) * u * 0.06 : 0;
  ctx.translate(0, bob);
  const legL = 0.72 * u, shinL = 0.66 * u, hipY = -(legL + shinL + 0.08 * u);
  const torsoH = (ch.heads - 1.0) * u - (legL + shinL + 0.08 * u) - 0.05 * u;
  const shY = hipY - torsoH, headY = shY - 0.5 * u - 0.06 * u + breathe;
  // legs
  const legs = [];
  for (const side of [0, 1]) {
    let a, k;
    if (pose.sit) { a = 1.5; k = 1.5; }
    else if (ph != null) { const s = Math.sin(ph + side * Math.PI); a = 0.42 * s; k = 0.1 + 0.6 * Math.max(0, Math.sin(ph + side * Math.PI + 1.8)); }
    else { a = side ? 0.05 : -0.05; k = 0.02; }
    legs.push([a, k]);
  }
  const drawLeg = side => {
    const [a, k] = legs[side]; const hx = (front ? (side ? 0.2 : -0.2) : (side ? 0.08 : -0.12)) * u * W;
    const H = [hx, hipY], K = [H[0] + Math.sin(a) * legL, H[1] + Math.cos(a) * legL], A = [K[0] + Math.sin(a - k) * shinL, K[1] + Math.cos(a - k) * shinL];
    const col = side ? ch.pants : shade(ch.pants, -0.12);
    part(ctx, { t: 'cap', a: H, b: K, r1: 0.17 * u * W, r2: 0.14 * u * W }, col, Lt, { noRim: !side });
    part(ctx, { t: 'cap', a: K, b: A, r1: 0.14 * u * W, r2: 0.12 * u * W }, col, Lt, { noRim: !side });
    const fd = front ? 0.12 : 1;
    part(ctx, { t: 'sp', p: [[A[0] - 0.12 * u, A[1] - 0.06 * u], [A[0] + 0.3 * u * fd + 0.04 * u, A[1] - 0.05 * u], [A[0] + 0.32 * u * fd + 0.06 * u, A[1] + 0.06 * u], [A[0] - 0.14 * u, A[1] + 0.08 * u]], ten: 0.3 }, side ? ch.shoes : shade(ch.shoes, -0.12), Lt);
  };
  if (!o.cropLegs) { drawLeg(0); }
  // torso group (lean)
  ctx.save(); ctx.translate(0, hipY); ctx.rotate((pose.lean || 0) + (ch.stoop || 0)); ctx.translate(0, -hipY);
  const arm = (side, isFront) => {
    let [s, e] = (side ? pose.aR : pose.aL) || [side ? 0.12 : -0.1, 0.2];
    if (ph != null && !(side ? pose.aR : pose.aL)) { s = -0.35 * Math.sin(ph + side * Math.PI); e = 0.3; }
    const sx = front ? (side ? 0.4 : -0.4) * u * W : (side ? 0.2 : -0.28) * u * W, dir = front ? (side ? 1 : -1) : 1;
    const S = [sx, shY + 0.12 * u], E = [S[0] + Math.sin(s) * 0.62 * u * dir, S[1] + Math.cos(s) * 0.62 * u], Wr = [E[0] + Math.sin(s + e) * 0.56 * u * dir, E[1] + Math.cos(s + e) * 0.56 * u];
    const col = isFront ? ch.coat : ch.coat2 || shade(ch.coat, -0.12);
    part(ctx, { t: 'cap', a: S, b: E, r1: 0.13 * u * W, r2: 0.11 * u * W }, col, Lt, { noRim: !isFront });
    part(ctx, { t: 'cap', a: E, b: Wr, r1: 0.11 * u * W, r2: 0.1 * u * W }, col, Lt, { noRim: !isFront });
    const ha = Math.atan2(Wr[1] - E[1], Wr[0] - E[0]);
    ctx.save(); ctx.translate(Wr[0], Wr[1]); ctx.rotate(ha - Math.PI / 2);
    part(ctx, { t: 'el', x: 0, y: 0.1 * u, rx: 0.1 * u, ry: 0.12 * u }, ch.skin, Lt, { sh: 0.04 });
    part(ctx, { t: 'el', x: 0.08 * u * dir, y: 0.04 * u, rx: 0.045 * u, ry: 0.07 * u, r: -0.5 * dir }, ch.skin, Lt, { sh: 0.02 });
    if (isFront && o.hold && (!front || side === 1)) o.hold(ctx, u);
    ctx.restore();
  };
  if (!front) arm(0, false);
  if (ch.backpack && !front) part(ctx, { t: 'rr', x: -0.62 * u, y: shY + 0.1 * u, w: 0.36 * u, h: 1.0 * u, r: 0.12 * u }, ch.backpack, Lt);
  // body / coat
  const hem = -ch.coatLen * u; // hem height above feet (bigger coatLen = shorter coat)
  const tw = (front ? 0.46 : 0.36) * u * W, bw = (front ? 0.5 : 0.42) * u * W;
  const bodyP = front
    ? [[-0.16 * u, shY - 0.04 * u], [-tw, shY + 0.06 * u], [-tw - 0.04 * u, shY + 0.4 * u], [-tw * 0.92, hipY], [-bw, hem], [bw, hem], [tw * 0.92, hipY], [tw + 0.04 * u, shY + 0.4 * u], [tw, shY + 0.06 * u], [0.16 * u, shY - 0.04 * u]]
    : [[-0.12 * u, shY - 0.04 * u], [-tw, shY + 0.08 * u], [-tw - 0.02 * u, shY + 0.45 * u], [-tw * 0.9, hipY], [-bw, hem], [bw * 0.95, hem], [tw * 0.95, hipY], [tw + (ch.female ? 0.06 : 0.04) * u, shY + 0.4 * u], [tw * 0.8, shY + 0.05 * u], [0.1 * u, shY - 0.04 * u]];
  if (!o.cropLegs && true) drawLeg(1);
  part(ctx, { t: 'rr', x: -0.09 * u, y: shY - 0.16 * u, w: 0.18 * u, h: 0.22 * u, r: 0.05 * u }, shade(ch.skin, -0.08), Lt, { sh: 0.03 });
  part(ctx, { t: 'sp', p: bodyP, ten: 0.35 }, ch.coat, Lt, { sh: 0.12 });
  // details
  const cx = front ? 0 : 0.12 * u;
  ctx.save(); ctx.beginPath(); addShape(ctx, { t: 'sp', p: bodyP, ten: 0.35 }); ctx.clip();
  if (ch.shirt) part(ctx, { t: 'sp', p: [[cx - 0.12 * u, shY - 0.02 * u], [cx, shY + 0.5 * u], [cx + 0.12 * u, shY - 0.02 * u]], ten: 0.2 }, ch.shirt, Lt, { sh: 0.03 });
  if (ch.hoodie) { part(ctx, { t: 'rr', x: cx - 0.22 * u, y: hipY - 0.4 * u, w: 0.44 * u, h: 0.3 * u, r: 0.08 * u }, shade(ch.coat, -0.06), Lt, { sh: 0.03 }); line(ctx, [[cx - 0.04 * u, shY + 0.05 * u], [cx - 0.05 * u, shY + 0.35 * u]], Lt.lw * 0.7, '#f3efe6'); line(ctx, [[cx + 0.06 * u, shY + 0.05 * u], [cx + 0.07 * u, shY + 0.32 * u]], Lt.lw * 0.7, '#f3efe6'); }
  if (ch.robe || ch.jacket || ch.coatLen < 0.6) line(ctx, [[cx + 0.02 * u, shY + 0.05 * u], [cx + 0.05 * u, hem]], Lt.lw * 0.8, INK, false);
  if (ch.robe) { part(ctx, { t: 'rr', x: -tw * 1.1, y: hipY - 0.08 * u, w: tw * 2.3, h: 0.1 * u, r: 0.04 * u }, shade(ch.coat, -0.15), Lt, { sh: 0.02 }); }
  if (ch.sweater) for (let i = -3; i <= 3; i++) line(ctx, [[i * 0.12 * u, shY + 0.2 * u], [i * 0.12 * u, hem]], Lt.lw * 0.4, rgba(shade(ch.coat, -0.25)), false);
  if (ch.buttons) for (let i = 0; i < 4; i++) { ctx.fillStyle = '#e6b84e'; ctx.beginPath(); ctx.arc(cx + 0.09 * u, shY + 0.18 * u + i * 0.2 * u, 0.03 * u, 0, 6.283); ctx.fill(); ctx.strokeStyle = INK; ctx.lineWidth = Lt.lw * 0.5; ctx.stroke(); }
  if (ch.chain) line(ctx, [[cx + 0.09 * u, shY + 0.38 * u], [cx + 0.25 * u, shY + 0.55 * u], [cx + 0.3 * u, shY + 0.5 * u]], Lt.lw * 0.7, '#f0c35a');
  ctx.restore();
  // collar
  if (ch.hoodie) part(ctx, { t: 'el', x: (front ? 0 : -0.12) * u, y: shY + 0.0 * u, rx: 0.3 * u, ry: 0.11 * u }, shade(ch.coat, -0.05), Lt, { sh: 0.04 });
  else if (!ch.robe) part(ctx, { t: 'sp', p: (front ? [[-0.3, -0.02], [-0.12, -0.12], [0, 0.22], [0.12, -0.12], [0.3, -0.02], [0.05, 0.3], [-0.05, 0.3]] : [[-0.3, 0.02], [-0.12, -0.12], [0.08, 0.0], [0.2, 0.18], [0.12, 0.3], [-0.08, 0.12]]).map(([x, y]) => [x * u, shY + y * u]), ten: 0.2 }, ch.coat2 || shade(ch.coat, -0.15), Lt, { sh: 0.03 });
  else part(ctx, { t: 'sp', p: [[-0.24, -0.02], [0, 0.35], [0.24, -0.02], [0.1, -0.06], [0, 0.12], [-0.1, -0.06]].map(([x, y]) => [x * u + cx * 0.5, shY + y * u]), ten: 0.2 }, shade(ch.coat, 0.12), Lt, { sh: 0.03 });
  // head
  ctx.save(); ctx.translate(front ? 0 : 0.04 * u, headY); ctx.rotate((pose.tilt || 0) + (ex.tilt || 0));
  drawHead(ctx, ch, u, Lt, ex, front, o.talk || 0);
  ctx.restore();
  if (front) { arm(0, true); arm(1, true); } else arm(1, true);
  ctx.restore();
  ctx.restore();
}
module.exports = { CH, EX, exMix, toon, part, line, addShape, INK, drawHead };
