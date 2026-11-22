// Paper-cut storybook style: no outlines, cut-paper drop shadows, 2-tone shading, soft rim light, minimal faces.
const C = require('../viz/core');
const { hex, rgba, mix, shade, clamp, lerp } = C;
// ---------- palette ----------
const PAL = {
  cream: hex('#f4e6cf'), paper: hex('#efdcc0'), terracotta: hex('#c8643f'), rust: hex('#a94e32'), honey: hex('#e9b04f'), rose: hex('#d98b86'), dusk: hex('#2a2440'), night: hex('#18162b'), teal: hex('#4f8f8c'), sky: hex('#9cc3c9'), sage: hex('#8fa98a'), ink: hex('#3a2a28'),
};
// light: {dir:-1|1 (where light comes from on x), key:[r,g,b], amb:[r,g,b] shadow tint, rim:[r,g,b], rimI}
function paperShadow(c, s, on = true) { if (on) { c.shadowColor = 'rgba(50,25,15,0.32)'; c.shadowBlur = s * 0.9; c.shadowOffsetX = s * 0.25; c.shadowOffsetY = s * 0.4; } else { c.shadowColor = 'transparent'; c.shadowBlur = 0; c.shadowOffsetX = 0; c.shadowOffsetY = 0; } }
// shape: function(c, ox, oy) that appends a closed path
function part(c, shape, col, L, o = {}) {
  const s = o.ps ?? 10;
  c.save();
  if (!o.noShadow) paperShadow(c, s);
  c.beginPath(); shape(c, 0, 0); c.fillStyle = rgba(col); c.fill();
  paperShadow(c, 0, false);
  c.beginPath(); shape(c, 0, 0); c.clip();
  const k = o.sh ?? s * 1.4;
  c.beginPath(); shape(c, 0, 0); shape(c, L.dir * k, -k * 0.5); c.fillStyle = rgba(mix(shade(col, -0.22), L.amb, 0.3)); c.fill('evenodd');
  if (L.rimI > 0 && !o.noRim) { const r = o.rim ?? s * 0.45; c.beginPath(); shape(c, 0, 0); shape(c, -L.dir * r, r * 0.3); c.fillStyle = rgba(mix(col, L.rim, 0.65), L.rimI); c.fill('evenodd'); }
  c.restore();
}
function limb(c, pts, w, col, L, o = {}) { // smooth tapered stroke limb
  const s = o.ps ?? 10;
  c.save(); paperShadow(c, s * 0.7); c.lineCap = 'round'; c.lineJoin = 'round'; c.strokeStyle = rgba(col); c.lineWidth = w;
  c.beginPath(); c.moveTo(...pts[0]); if (pts.length === 3) c.quadraticCurveTo(...pts[1], ...pts[2]); else c.lineTo(...pts[1]); c.stroke();
  paperShadow(c, 0, false);
  c.strokeStyle = rgba(mix(col, L.rim, 0.5), 0.45 * (L.rimI || 0.6)); c.lineWidth = w * 0.28; c.beginPath(); const off = -L.dir * w * 0.28; c.moveTo(pts[0][0] + off, pts[0][1]); if (pts.length === 3) c.quadraticCurveTo(pts[1][0] + off, pts[1][1], pts[2][0] + off, pts[2][1]); else c.lineTo(pts[1][0] + off, pts[1][1]); c.stroke();
  c.restore();
}
const circ = (x, y, r) => (c, ox, oy) => { c.moveTo(x + ox + r, y + oy); c.arc(x + ox, y + oy, r, 0, 6.2832); c.closePath(); };
const ell = (x, y, rx, ry, rot = 0) => (c, ox, oy) => { c.moveTo(x + ox + rx * Math.cos(rot), y + oy + rx * Math.sin(rot)); c.ellipse(x + ox, y + oy, rx, ry, rot, 0, 6.2832); c.closePath(); };
const poly = (pts, ten = 0.5) => (c, ox, oy) => { C.spline(c, pts.map(([x, y]) => [x + ox, y + oy]), true, ten); };
// ---------- characters ----------
const CAST = {
  mama: { headR: 0.072, sh: 0.79, hip: 0.5, hem: 0.2, skin: hex('#f1c6a6'), hair: hex('#5a3524'), hairStyle: 'bun', top: hex('#c8643f'), dress: hex('#f0dcc0'), legs: hex('#e2b796'), shoes: hex('#6e3b2a'), wid: 0.105, female: true },
  mamaOld: { headR: 0.072, sh: 0.79, hip: 0.5, hem: 0.2, skin: hex('#eebfa2'), hair: hex('#c9c1bd'), hairStyle: 'bun', top: hex('#b8604a'), dress: hex('#e6d5bd'), legs: hex('#dcb297'), shoes: hex('#6e3b2a'), wid: 0.11, female: true, glasses: true, stoop: 0.06 },
  toddler: { headR: 0.15, sh: 0.62, hip: 0.36, hem: 0.3, skin: hex('#f6cfb2'), hair: hex('#6a4026'), hairStyle: 'tuft', top: hex('#e9b04f'), dress: hex('#e9b04f'), legs: hex('#f6cfb2'), shoes: hex('#f4e6cf'), wid: 0.17, romper: true },
  kid: { headR: 0.115, sh: 0.7, hip: 0.44, hem: 0.36, skin: hex('#f4c9a9'), hair: hex('#5e3a24'), hairStyle: 'short', top: hex('#4f8f8c'), dress: hex('#3c4c6a'), legs: hex('#f4c9a9'), shoes: hex('#d98b86'), wid: 0.12, shorts: true },
  teen: { headR: 0.082, sh: 0.78, hip: 0.49, hem: 0.47, skin: hex('#f1c3a3'), hair: hex('#4a2e20'), hairStyle: 'messy', top: hex('#5d7aa3'), dress: hex('#2f3a55'), legs: hex('#2f3a55'), shoes: hex('#efe6d8'), wid: 0.11, hood: true, phones: true },
  son: { headR: 0.074, sh: 0.8, hip: 0.5, hem: 0.36, skin: hex('#efc1a1'), hair: hex('#3e281c'), hairStyle: 'short', top: hex('#4a4f63'), dress: hex('#2c3044'), legs: hex('#2c3044'), shoes: hex('#2a2222'), wid: 0.12, coat: true },
};
// o: {x,y,H, face:1|-1, L, pose:{lean, tilt, aF:[a1,a2], aB:[a1,a2], walk, sit, kneel}, ex:{eye:'open'|'closed'|'smile'|'down', brow, mouth:'none'|'smile'|'soft'|'open', blush}, ps, hold:(c,u)=>{} }
function figure(c, ch, o) {
  const H = o.H, L = o.L, P = o.pose || {}, ex = o.ex || {}; const ps = o.ps ?? Math.max(3, H * 0.012);
  const r = ch.headR * H, W = ch.wid * H;
  c.save(); c.translate(o.x, o.y); if ((o.face ?? 1) < 0) c.scale(-1, 1);
  const LL = { ...L, dir: (o.face ?? 1) < 0 ? -L.dir : L.dir };
  const ph = P.walk; const bob = ph != null ? -Math.abs(Math.sin(ph)) * H * 0.012 : 0; c.translate(0, bob + (P.kneel ? ch.hip * H * 0.5 : 0));
  const hipY = -ch.hip * H, shY = -ch.sh * H;
  // legs
  const legLen = ch.hip * H;
  const leg = (side) => {
    let a = side ? 0.04 : -0.04, k = 0.05;
    if (P.sit) { a = 1.45; k = 1.5; } else if (P.kneel) { a = side ? 1.2 : 0.2; k = side ? 2.6 : 1.6; } else if (ph != null) { const s = Math.sin(ph + side * Math.PI); a = 0.35 * s; k = 0.1 + 0.5 * Math.max(0, Math.sin(ph + side * Math.PI + 1.8)); }
    const hx = (side ? 0.02 : -0.03) * H, Hp = [hx, hipY], K = [hx + Math.sin(a) * legLen * 0.52, hipY + Math.cos(a) * legLen * 0.52], A = [K[0] + Math.sin(a - k) * legLen * 0.5, K[1] + Math.cos(a - k) * legLen * 0.5];
    const col = side ? ch.legs : shade(ch.legs, -0.1);
    limb(c, [Hp, K, A], W * 0.36, col, LL, { ps }); limb(c, [Hp, K], W * 0.42, col, LL, { ps });
    part(c, ell(A[0] + W * 0.18, A[1] - W * 0.04, W * 0.3, W * 0.13), side ? ch.shoes : shade(ch.shoes, -0.12), LL, { ps, sh: ps * 0.6 });
  };
  leg(0); leg(1);
  c.save(); c.translate(0, hipY); c.rotate((P.lean || 0) + (ch.stoop || 0)); c.translate(0, -hipY);
  // back arm
  const arm = (front) => {
    const [a1, a2] = (front ? P.aF : P.aB) || [front ? 0.12 : -0.08, 0.25];
    const ul = (ch.sh - ch.hip) * H * 0.62, fl = ul * 0.95;
    const S = [front ? W * 0.12 : -W * 0.18, shY + r * 0.35];
    const E = [S[0] + Math.sin(a1) * ul, S[1] + Math.cos(a1) * ul], Wr = [E[0] + Math.sin(a1 + a2) * fl, E[1] + Math.cos(a1 + a2) * fl];
    const col = front ? ch.top : shade(ch.top, -0.14);
    limb(c, [S, E], W * 0.34, col, LL, { ps }); limb(c, [E, Wr], W * 0.3, col, LL, { ps });
    part(c, circ(Wr[0], Wr[1], W * 0.15), ch.skin, LL, { ps, sh: ps * 0.4, noRim: !front });
    if (front && o.hold) { c.save(); c.translate(Wr[0], Wr[1]); o.hold(c, W); c.restore(); }
    return Wr;
  };
  arm(false);
  // torso
  const tw = W * 0.5, hw = W * (ch.romper ? 0.62 : 0.55);
  const hem = -ch.hem * H;
  if (ch.coat || ch.hood || ch.romper || ch.shorts) {
    part(c, poly([[-tw * 0.7, shY + r * 0.1], [tw * 0.8, shY + r * 0.15], [tw * 1.05, hipY - (hipY - shY) * 0.4], [hw * 0.95, hem], [-hw, hem], [-tw * 1.0, hipY - (hipY - shY) * 0.5]], 0.35), ch.top, LL, { ps });
    if (ch.shorts) part(c, poly([[-hw * 0.95, hem - 4], [hw * 0.9, hem - 4], [hw * 0.95, hem + (hipY - hem) * -0.0 + H * 0.08], [-hw, hem + H * 0.08]], 0.2), ch.dress, LL, { ps });
  } else {
    part(c, poly([[-tw * 0.65, shY + r * 0.1], [tw * 0.75, shY + r * 0.1], [tw * 0.95, hipY - (hipY - shY) * 0.5], [hw * 1.45, hem], [-hw * 1.4, hem], [-tw * 0.95, hipY - (hipY - shY) * 0.5]], 0.35), ch.dress, LL, { ps });
    part(c, poly([[-tw * 0.75, shY + r * 0.05], [tw * 0.85, shY + r * 0.1], [tw * 1.05, hipY - (hipY - shY) * 0.45], [tw * 1.0, hipY + H * 0.06], [tw * 0.15, hipY + H * 0.08], [-tw * 1.1, hipY + H * 0.05], [-tw * 1.05, hipY - (hipY - shY) * 0.5]], 0.35), ch.top, LL, { ps });
  }
  if (ch.hood) part(c, ell(-tw * 0.55, shY + r * 0.2, tw * 0.75, r * 0.45, -0.2), shade(ch.top, -0.08), LL, { ps });
  // head
  c.save(); c.translate(W * 0.04, shY - r * 0.92); c.rotate(P.tilt || 0);
  head(c, ch, r, LL, ex, ps, o.t || 0);
  c.restore();
  const wr = arm(true);
  c.restore();
  c.restore();
  return wr;
}
function head(c, ch, r, L, ex, ps, t) {
  const hair = ch.hair;
  if (ch.hairStyle === 'bun') part(c, circ(-r * 0.78, -r * 0.62, r * 0.42), hair, L, { ps });
  part(c, (c2, ox, oy) => { c2.moveTo(r * 0.95 + ox, r * 0.05 + oy); c2.bezierCurveTo(r * 1.18 + ox, r * 0.12 + oy, r * 1.08 + ox, r * 0.32 + oy, r * 0.9 + ox, r * 0.36 + oy); c2.arc(ox, oy, r, 0.45, -0.05); c2.closePath(); }, ch.skin, L, { ps });
  // hair
  const hs = ch.hairStyle;
  const hp = hs === 'bun' ? [[-r * 1.02, r * 0.35], [-r * 1.05, -r * 0.4], [-r * 0.55, -r * 1.02], [r * 0.3, -r * 1.05], [r * 0.9, -r * 0.6], [r * 0.55, -r * 0.48], [r * 0.05, -r * 0.42], [-r * 0.35, -r * 0.05], [-r * 0.5, r * 0.4]]
    : hs === 'tuft' ? [[-r * 0.95, -r * 0.1], [-r * 0.7, -r * 0.85], [-r * 0.1, -r * 1.12], [r * 0.15, -r * 1.3], [r * 0.25, -r * 1.05], [r * 0.7, -r * 0.75], [r * 0.2, -r * 0.7], [-r * 0.4, -r * 0.45]]
    : hs === 'messy' ? [[-r * 1.05, r * 0.3], [-r * 1.12, -r * 0.45], [-r * 0.7, -r * 1.08], [-r * 0.1, -r * 1.22], [r * 0.35, -r * 1.1], [r * 0.95, -r * 0.78], [r * 0.7, -r * 0.5], [r * 0.4, -r * 0.62], [r * 0.15, -r * 0.42], [-r * 0.3, -r * 0.3], [-r * 0.5, r * 0.3]]
    : [[-r * 1.02, r * 0.2], [-r * 1.05, -r * 0.45], [-r * 0.6, -r * 1.02], [r * 0.2, -r * 1.08], [r * 0.85, -r * 0.7], [r * 0.6, -r * 0.5], [r * 0.1, -r * 0.48], [-r * 0.4, -r * 0.1], [-r * 0.55, r * 0.25]];
  part(c, poly(hp, 0.45), hair, L, { ps, sh: ps * 0.8 });
  // face: eye, brow, blush, mouth (minimal)
  const eyX = r * 0.45, eyY = -r * 0.02, eye = ex.eye || 'open';
  c.save(); c.fillStyle = rgba(PAL.ink); c.strokeStyle = rgba(PAL.ink); c.lineCap = 'round'; c.lineWidth = Math.max(1.5, r * 0.07);
  if (eye === 'open') { c.beginPath(); c.ellipse(eyX, eyY, r * 0.075, r * 0.11, 0, 0, 6.283); c.fill(); c.fillStyle = 'rgba(255,255,255,0.85)'; c.beginPath(); c.arc(eyX + r * 0.025, eyY - r * 0.04, r * 0.025, 0, 6.283); c.fill(); }
  else if (eye === 'closed') { c.beginPath(); c.arc(eyX, eyY - r * 0.02, r * 0.1, 0.2, Math.PI - 0.2); c.stroke(); }
  else if (eye === 'smile') { c.beginPath(); c.arc(eyX, eyY + r * 0.06, r * 0.1, Math.PI + 0.3, -0.3); c.stroke(); }
  else if (eye === 'down') { c.beginPath(); c.moveTo(eyX - r * 0.1, eyY + r * 0.02); c.quadraticCurveTo(eyX, eyY + r * 0.09, eyX + r * 0.1, eyY + r * 0.02); c.stroke(); }
  const bw = ex.brow || 0; c.lineWidth = Math.max(1, r * 0.04); c.globalAlpha = 0.7; c.beginPath(); c.moveTo(eyX - r * 0.1, eyY - r * 0.2 + bw * r * 0.06); c.quadraticCurveTo(eyX, eyY - r * 0.26, eyX + r * 0.1, eyY - r * 0.21 - bw * r * 0.05); c.stroke(); c.globalAlpha = 1;
  const bl = ex.blush ?? 0.5; c.fillStyle = C.rg(c, r * 0.35, r * 0.35, 0, r * 0.28, [[0, `rgba(225,120,110,${0.45 * bl})`], [1, 'rgba(225,120,110,0)']]); c.fillRect(0, 0, r * 0.8, r * 0.8);
  const mo = ex.mouth || 'none'; c.lineWidth = Math.max(1.2, r * 0.05); c.strokeStyle = rgba(mix(PAL.ink, hex('#b0504a'), 0.4));
  if (mo === 'smile') { c.beginPath(); c.arc(r * 0.68, r * 0.48, r * 0.12, 0.3, Math.PI - 0.6); c.stroke(); }
  else if (mo === 'soft') { c.beginPath(); c.moveTo(r * 0.6, r * 0.55); c.quadraticCurveTo(r * 0.7, r * 0.6, r * 0.8, r * 0.53); c.stroke(); }
  else if (mo === 'open') { c.fillStyle = rgba(hex('#7a3a34')); c.beginPath(); c.ellipse(r * 0.72, r * 0.56, r * 0.06, r * 0.08 * (ex.talk || 1), 0, 0, 6.283); c.fill(); }
  else if (mo === 'sad') { c.beginPath(); c.arc(r * 0.7, r * 0.68, r * 0.1, Math.PI + 0.6, -0.5); c.stroke(); }
  if (ex.tear) { c.fillStyle = 'rgba(200,235,255,0.9)'; c.beginPath(); c.ellipse(eyX - r * 0.02, eyY + r * 0.2 + (ex.tear - 1) * r * 0.4, r * 0.05, r * 0.08, 0, 0, 6.283); c.fill(); }
  c.restore();
  if (ch.phones) { part(c, circ(-r * 0.05, r * 0.08, r * 0.24), hex('#e9e4dc'), L, { ps: ps * 0.6 }); c.save(); c.strokeStyle = rgba(hex('#e9e4dc')); c.lineWidth = r * 0.14; c.lineCap = 'round'; c.beginPath(); c.arc(-r * 0.05, -r * 0.1, r * 1.02, Math.PI * 1.05, Math.PI * 1.75); c.stroke(); c.restore(); }
  if (ch.glasses) { c.save(); c.strokeStyle = rgba(hex('#6a4a3a')); c.lineWidth = r * 0.05; c.beginPath(); c.arc(eyX + r * 0.04, eyY, r * 0.2, 0, 6.283); c.stroke(); c.beginPath(); c.moveTo(eyX - r * 0.16, eyY - r * 0.02); c.lineTo(-r * 0.3, -r * 0.08); c.stroke(); c.restore(); }
}
// baby bundle in arms
function baby(c, x, y, s, L, ex = {}, t = 0) {
  part(c, ell(x, y, s * 0.9, s * 0.55, -0.25), PAL.cream, L, { ps: s * 0.06 });
  part(c, ell(x - s * 0.1, y + s * 0.08, s * 0.7, s * 0.38, -0.25), hex('#f7efe2'), L, { ps: s * 0.03, noShadow: true });
  part(c, circ(x + s * 0.62, y - s * 0.2, s * 0.36), hex('#f6cfb2'), L, { ps: s * 0.05 });
  part(c, (cc, ox, oy) => { cc.moveTo(x + s * 0.35 + ox, y - s * 0.42 + oy); cc.arc(x + s * 0.62 + ox, y - s * 0.2 + oy, s * 0.42, Math.PI * 1.15, Math.PI * 1.9); cc.closePath(); }, PAL.cream, L, { ps: s * 0.04 });
  c.save(); c.strokeStyle = rgba(PAL.ink); c.lineWidth = s * 0.035; c.lineCap = 'round'; c.beginPath(); const ey = y - s * 0.18;
  if (ex.eye === 'open') { c.fillStyle = rgba(PAL.ink); c.beginPath(); c.arc(x + s * 0.76, ey, s * 0.04, 0, 6.283); c.fill(); } else { c.arc(x + s * 0.76, ey - s * 0.02, s * 0.06, 0.3, Math.PI - 0.3); c.stroke(); }
  c.fillStyle = 'rgba(230,130,120,0.45)'; c.beginPath(); c.arc(x + s * 0.72, y - s * 0.05, s * 0.08, 0, 6.283); c.fill(); c.restore();
}
module.exports = { PAL, part, limb, circ, ell, poly, figure, CAST, baby, paperShadow };
