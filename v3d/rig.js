// Blocky low-poly character rig + props + helpers (deterministic, pose = f(t))
import * as THREE from 'three';
export const MC = {};
export function M(c, o = {}) { const k = c + JSON.stringify(o); if (!MC[k]) MC[k] = new THREE.MeshStandardMaterial(Object.assign({ color: c, roughness: .82, metalness: 0, flatShading: true }, o)); return MC[k]; }
export function bx(w, h, d, c, parent, x = 0, y = 0, z = 0, o = {}) {
  const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), Array.isArray(c) ? c : (c.isMaterial ? c : M(c, o)));
  m.position.set(x, y, z); m.castShadow = true; m.receiveShadow = true; if (parent) parent.add(m); return m;
}
export function grp(parent, x = 0, y = 0, z = 0) { const g = new THREE.Group(); g.position.set(x, y, z); if (parent) parent.add(g); return g; }
export const hash = n => { n = Math.sin(n * 12.9898 + 78.233) * 43758.5453; return n - Math.floor(n); };
export const cl = (x, a = 0, b = 1) => Math.max(a, Math.min(b, x));
export const seg = (t, a, b) => cl((t - a) / (b - a));
export const eo = x => 1 - Math.pow(1 - x, 3), ei = x => x * x * x, eio = x => x < .5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2;
export const back = x => { const c = 1.7; return 1 + (c + 1) * Math.pow(x - 1, 3) + c * Math.pow(x - 1, 2); };
export const lerp = (a, b, u) => a + (b - a) * u;
export const V = (x, y, z) => new THREE.Vector3(x, y, z);

// ---------- faces (canvas textures) ----------
const faceCache = {};
function faceTex(skin, kind, o) {
  const key = skin + kind + (o.beard ? 'b' : '') + (o.stache ? 's' : '') + (o.lips ? 'l' : '');
  if (faceCache[key]) return faceCache[key];
  const c = document.createElement('canvas'); c.width = c.height = 128; const x = c.getContext('2d');
  x.fillStyle = skin; x.fillRect(0, 0, 128, 128); x.fillStyle = '#1a1614'; x.strokeStyle = '#1a1614'; x.lineCap = 'round';
  const eye = (ex, h = 16) => x.fillRect(ex - 5, 52 - h / 2, 10, h);
  const brow = (x1, y1, x2, y2, w = 7) => { x.lineWidth = w; x.beginPath(); x.moveTo(x1, y1); x.lineTo(x2, y2); x.stroke(); };
  if (o.beard) { x.fillStyle = '#2a201b'; x.beginPath(); x.moveTo(14, 70); x.lineTo(114, 70); x.lineTo(108, 118); x.lineTo(64, 128); x.lineTo(20, 118); x.closePath(); x.fill(); x.fillStyle = skin; x.fillRect(44, 84, 40, 12); x.fillStyle = '#1a1614'; }
  switch (kind) {
    case 'x': x.lineWidth = 6;[[42, 50], [86, 50]].forEach(([a, b]) => { x.beginPath(); x.moveTo(a - 9, b - 9); x.lineTo(a + 9, b + 9); x.moveTo(a + 9, b - 9); x.lineTo(a - 9, b + 9); x.stroke(); }); x.beginPath(); x.moveTo(44, 96); x.lineTo(56, 90); x.lineTo(70, 98); x.lineTo(84, 90); x.stroke(); break;
    case 'shock': x.fillStyle = '#fff'; x.fillRect(32, 38, 20, 24); x.fillRect(76, 38, 20, 24); x.fillStyle = '#1a1614'; x.fillRect(39, 46, 7, 9); x.fillRect(83, 46, 7, 9); brow(30, 28, 52, 24, 6); brow(76, 24, 98, 28, 6); x.fillStyle = '#7a2a22'; x.fillRect(54, 86, 20, 20); break;
    case 'happy': x.lineWidth = 6; x.beginPath(); x.arc(42, 56, 9, Math.PI, 0); x.stroke(); x.beginPath(); x.arc(86, 56, 9, Math.PI, 0); x.stroke(); brow(30, 32, 52, 30, 6); brow(76, 30, 98, 32, 6); x.fillStyle = '#7a2a22'; x.beginPath(); x.moveTo(40, 84); x.lineTo(88, 84); x.lineTo(74, 104); x.lineTo(54, 104); x.closePath(); x.fill(); break;
    case 'angry': eye(42, 14); eye(86, 14); brow(28, 30, 54, 42); brow(74, 42, 100, 30); x.lineWidth = 6; x.beginPath(); x.moveTo(48, 96); x.lineTo(80, 96); x.stroke(); break;
    case 'grit': eye(42, 12); eye(86, 12); brow(28, 30, 54, 42); brow(74, 42, 100, 30); x.fillStyle = '#fff'; x.fillRect(44, 88, 40, 14); x.lineWidth = 3; x.strokeRect(44, 88, 40, 14); x.beginPath(); x.moveTo(44, 95); x.lineTo(84, 95); x.stroke(); break;
    case 'smug': eye(42, 8); eye(86, 8); brow(30, 40, 52, 40, 6); brow(76, 40, 98, 40, 6); x.lineWidth = 6; x.beginPath(); x.moveTo(48, 96); x.quadraticCurveTo(70, 100, 84, 88); x.stroke(); break;
    default: eye(42); eye(86); brow(30, 32, 52, 30, 6); brow(76, 30, 98, 32, 6); x.lineWidth = 6; x.beginPath(); x.moveTo(50, 94); x.quadraticCurveTo(64, 100, 78, 94); x.stroke();
  }
  if (o.stache) { x.fillStyle = '#d8d0c4'; x.fillRect(40, 74, 48, 10); }
  if (o.lips && kind !== 'x' && kind !== 'shock') { x.fillStyle = '#c0392b'; x.fillRect(54, 92, 20, 6); }
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.magFilter = THREE.LinearFilter; faceCache[key] = new THREE.MeshStandardMaterial({ map: t, roughness: .85 }); return faceCache[key];
}

// ---------- character ----------
const outlineMat = c => new THREE.MeshBasicMaterial({ color: c, side: THREE.BackSide });
export function makeChar(o) {
  o = Object.assign({ skin: '#e9b48f', shirt: '#f4f1ea', sleeve: 'short', pants: '#1c1c1e', legs: 'shorts', shoes: null, hair: 'crop', hairC: '#2a201b' }, o);
  const C = { o, parts: [] };
  const add = (m) => { C.parts.push(m); if (o.outline) { const h = new THREE.Mesh(m.geometry, outlineMat(o.outline)); h.scale.setScalar(1); h.userData.ol = 1; const s = m.geometry.parameters; h.scale.set(1 + .03 / s.width, 1 + .03 / s.height, 1 + .03 / s.depth); m.add(h); } return m; };
  C.root = grp(null); C.root.rotation.order = 'YXZ'; C.hips = grp(C.root, 0, .95, 0);
  const legC = o.legs === 'pants' ? o.pants : o.skin;
  add(bx(.38, .24, .25, o.legs === 'skirt' ? o.shirt : o.pants, C.hips, 0, -.02, 0));
  if (o.legs === 'shorts' && o.stripe) { bx(.02, .2, .1, o.stripe, C.hips, .195, -.04, 0); bx(.02, .2, .1, o.stripe, C.hips, -.195, -.04, 0); }
  C.spine = grp(C.hips, 0, .08, 0);
  add(bx(.44, .56, .26, o.shirt, C.spine, 0, .28, 0));
  if (o.tie) bx(.07, .34, .02, o.tie, C.spine, 0, .32, .135);
  if (o.collar) bx(.2, .08, .02, o.collar, C.spine, 0, .5, .135);
  if (o.badge) bx(.07, .07, .02, '#f2c230', C.spine, .12, .42, .135, { metalness: .5, roughness: .4 });
  if (o.apron) bx(.3, .5, .02, '#f4f1ea', C.spine, 0, .2, .135);
  C.neck = grp(C.spine, 0, .58, 0);
  const mats = [M(o.skin), M(o.skin), M(o.skin), M(o.skin), M(o.skin), M(o.skin)];
  C.head = add(bx(.3, .34, .3, mats, C.neck, 0, .2, 0));
  C.setFace = k => { if (C._f === k) return; C._f = k; C.head.material[4] = faceTex(o.skin, k, o); };
  C.setFace('calm');
  const hc = o.hairC;
  if (o.hair === 'crop' || o.hair === 'bun' || o.hair === 'slick') { bx(.32, .08, .32, hc, C.head, 0, .17, -.005); bx(.32, .2, .06, hc, C.head, 0, .07, -.135); bx(.04, .12, .2, hc, C.head, .155, .1, -.04); bx(.04, .12, .2, hc, C.head, -.155, .1, -.04); }
  if (o.hair === 'bun') bx(.14, .14, .14, hc, C.head, 0, .22, -.16);
  if (o.hair === 'long') { bx(.33, .1, .33, hc, C.head, 0, .17, 0); bx(.34, .5, .1, hc, C.head, 0, -.06, -.14); bx(.04, .4, .22, hc, C.head, .165, -.02, -.04); bx(.04, .4, .22, hc, C.head, -.165, -.02, -.04); }
  if (o.hair === 'bald') { bx(.04, .1, .16, '#cfc7bb', C.head, .16, .02, -.05); bx(.04, .1, .16, '#cfc7bb', C.head, -.16, .02, -.05); }
  if (o.hair === 'cap') { bx(.33, .12, .33, o.capC || '#1b1d24', C.head, 0, .2, 0); bx(.3, .025, .14, o.capC || '#1b1d24', C.head, 0, .15, .2); bx(.06, .06, .01, '#f2c230', C.head, 0, .22, .17, { metalness: .5, roughness: .4 }); }
  if (o.bow) { bx(.12, .08, .06, o.bow, C.head, .1, .2, -.1); }
  if (o.band) { bx(.325, .06, .325, o.band, C.head, 0, .09, 0); C.tail1 = grp(C.head, -.04, .09, -.165); bx(.04, .2, .025, o.band, C.tail1, 0, -.1, 0); C.tail2 = grp(C.head, .04, .09, -.165); bx(.04, .17, .025, o.band, C.tail2, 0, -.085, 0); }
  const arm = (s) => {
    const sh = grp(C.spine, s * .29, .5, 0), el = grp(sh, 0, -.3, 0);
    if (o.sleeve === 'short') { add(bx(.15, .15, .15, o.shirt, sh, 0, -.06, 0)); add(bx(.12, .2, .12, o.skin, sh, 0, -.2, 0)); }
    else add(bx(.13, .32, .13, o.sleeveC || o.shirt, sh, 0, -.15, 0));
    add(bx(.115, .28, .115, o.sleeve === 'long' ? (o.sleeveC || o.shirt) : o.skin, el, 0, -.14, 0)); add(bx(.11, .11, .11, o.skin, el, 0, -.31, .01));
    return [sh, el];
  };
  [C.lSh, C.lEl] = arm(1); [C.rSh, C.rEl] = arm(-1);
  const leg = (s) => {
    const hp = grp(C.hips, s * .1, -.08, 0), kn = grp(hp, 0, -.44, 0);
    if (o.legs === 'shorts') { add(bx(.17, .2, .18, o.pants, hp, 0, -.08, 0)); add(bx(.15, .26, .16, o.skin, hp, 0, -.3, 0)); }
    else if (o.legs === 'skirt') add(bx(.14, .44, .14, o.skin, hp, 0, -.22, 0));
    else add(bx(.17, .44, .18, legC, hp, 0, -.22, 0));
    add(bx(.145, .44, .15, o.legs === 'pants' ? legC : o.skin, kn, 0, -.22, 0));
    add(bx(.15, .08, .27, o.shoes || o.skin, kn, 0, -.47, .05));
    return [hp, kn];
  };
  [C.lHip, C.lKnee] = leg(1); [C.rHip, C.rKnee] = leg(-1);
  if (o.legs === 'skirt') { const sk = new THREE.Mesh(new THREE.CylinderGeometry(.22, .36, .5, 4, 1), M(o.shirt)); sk.rotation.y = Math.PI / 4; sk.position.set(0, -.25, 0); sk.castShadow = true; C.hips.add(sk); }
  C.root.traverse(m => { if (m.isMesh && !m.userData.ol) { m.castShadow = true; m.receiveShadow = true; } });
  return C;
}
const J = ['spine', 'neck', 'lSh', 'lEl', 'rSh', 'rEl', 'lHip', 'lKnee', 'rHip', 'rKnee'];
export function setPose(C, P) {
  for (const j of J) { const a = P[j] || [0, 0, 0]; C[j].rotation.set(a[0] || 0, a[1] || 0, a[2] || 0); }
  C.hips.position.y = .95 + (P.hy || 0); C.hips.position.z = P.hz || 0; C.hips.rotation.set(P.hr || 0, 0, P.hrz || 0);
  if (C.tail1) { const w = P.tw || 0; C.tail1.rotation.set(-.4 - w, 0, .15); C.tail2.rotation.set(-.3 - w * .8, 0, -.2); }
}
export function mixP(a, b, u) {
  const o = {}; const keys = new Set([...Object.keys(a), ...Object.keys(b)]);
  for (const k of keys) { const A = a[k], B = b[k]; if (Array.isArray(A) || Array.isArray(B)) { const x = A || [0, 0, 0], y = B || [0, 0, 0]; o[k] = [0, 1, 2].map(i => lerp(x[i] || 0, y[i] || 0, u)); } else o[k] = lerp(A || 0, B || 0, u); }
  return o;
}
export const P = {
  stand: { lSh: [0, 0, .12], rSh: [0, 0, -.12], lEl: [-.18], rEl: [-.18] },
  crouch: { hy: -.27, spine: [.5], neck: [-.35], lHip: [-1.05, 0, .12], rHip: [-1.05, 0, -.12], lKnee: [1.6], rKnee: [1.6], lSh: [-.7, 0, .3], rSh: [-.7, 0, -.3], lEl: [-1.2], rEl: [-1.2] },
  guard: { hy: -.12, spine: [.25], neck: [-.2], lHip: [-.55, 0, .14], rHip: [-.2, 0, -.14], lKnee: [.8], rKnee: [.45], lSh: [-1.0, 0, .35], rSh: [-1.0, 0, -.35], lEl: [-1.7], rEl: [-1.7] },
  leap: { hy: .2, spine: [.9], neck: [-.8], lSh: [-2.5, 0, .25], rSh: [-2.5, 0, -.25], lEl: [-.2], rEl: [-.2], lHip: [.6], rHip: [.2], lKnee: [1.2], rKnee: [.9] },
  choke: { spine: [.18], neck: [-.1, 0, 0], lSh: [-1.35, -.5, .2], lEl: [0, 0, 1.5], rSh: [-1.35, .5, -.2], rEl: [0, 0, -1.5], lHip: [-.3, 0, .2], rHip: [.25, 0, -.2], lKnee: [.45], rKnee: [.1], hy: -.06 },
  win: { lSh: [0, 0, .5], lEl: [-1.7, .0, 0], rSh: [-2.9, 0, -.15], rEl: [-.35], neck: [-.15], spine: [-.05] },
  lift: { lSh: [-2.9, 0, .15], rSh: [-2.9, 0, -.15], lEl: [-.3], rEl: [-.3], lHip: [0, 0, .15], rHip: [0, 0, -.15], spine: [-.12] },
  pry: { lSh: [0, 0, 1.45], rSh: [0, 0, -1.45], lEl: [-.4], rEl: [-.4], lHip: [0, 0, .25], rHip: [0, 0, -.25], spine: [0] },
  reach: { lSh: [0, 0, .12], rSh: [-1.25, 0, 0], rEl: [-.15], lEl: [-.18] },
  stop: { lSh: [0, 0, .12], rSh: [-2.2, 0, -.2], rEl: [-.9], lEl: [-.18] },
  shrug: { lSh: [0, 0, .5], rSh: [0, 0, -.5], lEl: [-1.4, -.6], rEl: [-1.4, .6], neck: [0, 0, .25] },
  bent: { spine: [1.15], neck: [-.7], rSh: [-.3, 0, -.1], rEl: [-.1], lSh: [2.4, 0, .3], lEl: [-.4] },
  hold: { lSh: [-1.1, 0, .1], rSh: [-1.1, 0, -.1], lEl: [-.9], rEl: [-.9] },
  hug: { lSh: [-1.3, -.6, .3], rSh: [-1.3, .6, -.3], lEl: [0, 0, 1.2], rEl: [0, 0, -1.2] },
  lieStar: { lSh: [0, 0, 2.0], rSh: [0, 0, -2.0], lEl: [-.3], rEl: [-.3], lHip: [0, 0, .45], rHip: [0, 0, -.45], lKnee: [.2], rKnee: [.2] },
  crawl: { lSh: [-2.8, 0, .3], rSh: [-2.4, 0, -.3], lEl: [-.5], rEl: [-.4], lHip: [-.6, 0, .4], rHip: [.1, 0, -.3], lKnee: [1.4], rKnee: [.6] },
};
export function walkP(ph, base = P.stand, amp = 1) {
  const s = Math.sin(ph), o = Object.assign({}, base);
  o.lHip = [-.5 * s * amp, 0, .04]; o.rHip = [.5 * s * amp, 0, -.04];
  o.lKnee = [(.15 + .55 * Math.max(0, Math.sin(ph - 1.2))) * amp]; o.rKnee = [(.15 + .55 * Math.max(0, Math.sin(ph + Math.PI - 1.2))) * amp];
  if (base === P.stand) { o.lSh = [.45 * s * amp, 0, .1]; o.rSh = [-.45 * s * amp, 0, -.1]; o.lEl = [-.3]; o.rEl = [-.3]; }
  o.hy = -Math.abs(Math.cos(ph)) * .03 * amp; o.spine = [.05]; return o;
}
