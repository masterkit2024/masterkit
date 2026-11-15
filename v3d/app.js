// 3D low-poly film · 1080x1920 · every frame = f(t)
import * as THREE from 'three';
import { M, bx, grp, hash, cl, seg, eo, ei, eio, back, lerp, V, makeChar, setPose, mixP, P, walkP } from './rig.js';
const W = 1080, H = 1920, FPS = 24, PI = Math.PI;
const glc = document.getElementById('g'), out = document.getElementById('o'), ox = out.getContext('2d');
const R = new THREE.WebGLRenderer({ canvas: glc, antialias: true, preserveDrawingBuffer: true });
R.setPixelRatio(1); R.setSize(W, H, false); R.shadowMap.enabled = true; R.shadowMap.type = THREE.PCFSoftShadowMap;
R.outputColorSpace = THREE.SRGBColorSpace; R.toneMapping = THREE.ACESFilmicToneMapping; R.toneMappingExposure = 1.05;
const S = new THREE.Scene(); S.fog = new THREE.Fog('#c9d3de', 18, 60);
const cam = new THREE.PerspectiveCamera(38, W / H, .05, 300);
const hemi = new THREE.HemisphereLight('#eef3ff', '#8a8070', 1.2); S.add(hemi);
const sun = new THREE.DirectionalLight('#fff1dc', 2.6); sun.castShadow = true; sun.shadow.mapSize.set(2048, 2048);
Object.assign(sun.shadow.camera, { left: -9, right: 9, top: 9, bottom: -9, near: .5, far: 60 }); sun.shadow.bias = -.0004; sun.shadow.normalBias = .03; S.add(sun, sun.target);
const pl1 = new THREE.PointLight('#ff3b2f', 0, 12, 1.6), pl2 = new THREE.PointLight('#2f6bff', 0, 12, 1.6), pl3 = new THREE.PointLight('#ffb35a', 0, 14, 1.4); S.add(pl1, pl2, pl3);
function light(o) { S.background = new THREE.Color(o.sky); S.fog.color.set(o.fog || o.sky); S.fog.near = o.fn || 18; S.fog.far = o.ff || 60;
  hemi.color.set(o.hs || '#eef3ff'); hemi.groundColor.set(o.hg || '#8a8070'); hemi.intensity = o.hi ?? 1.2; sun.color.set(o.sc || '#fff1dc'); sun.intensity = o.si ?? 2.6;
  const d = o.sd || [5, 9, 6], f = o.focus || [0, 0, 0]; sun.position.set(f[0] + d[0], d[1], f[2] + d[2]); sun.target.position.set(f[0], 0, f[2]); pl1.intensity = pl2.intensity = pl3.intensity = 0; }
const sets = []; function set() { const g = grp(S); g.visible = false; sets.push(g); return g; }
function cyl(rt, rb, h, seg_, c, parent, x, y, z) { const m = new THREE.Mesh(new THREE.CylinderGeometry(rt, rb, h, seg_), M(c)); m.position.set(x, y, z); m.castShadow = m.receiveShadow = true; parent.add(m); return m; }
function tree(p, x, z, s = 1, c = '#4f9a3c') { cyl(.08 * s, .12 * s, 1.2 * s, 5, '#7a5634', p, x, .6 * s, z); const m = new THREE.Mesh(new THREE.IcosahedronGeometry(.9 * s, 0), M(c)); m.position.set(x, 1.7 * s, z); m.castShadow = true; p.add(m); }
function house(p, x, z, w, d, h, wc, rc, ry = 0) { const g = grp(p, x, 0, z); g.rotation.y = ry; bx(w, h, d, wc, g, 0, h / 2, 0);
  const r = new THREE.Mesh(new THREE.CylinderGeometry(.01, w * .62, d + .3, 3, 1), M(rc)); r.rotation.z = PI / 2; r.rotation.y = PI / 2; r.scale.set(1, 1, .55); r.position.set(0, h + w * .2, 0); r.castShadow = true; g.add(r);
  for (let i = 0; i < 2; i++) bx(.5, .5, .04, '#9cc4dd', g, -w * .25 + i * w * .5, h * .55, d / 2 + .02); return g; }
function fence(p, x0, x1, z, h = 1.25, c = '#a8693a') { for (let x = x0; x <= x1; x += .19) bx(.15, h + hash(x) * .06, .04, c, p, x, h / 2, z); bx(x1 - x0, .08, .05, '#8f5a31', p, (x0 + x1) / 2, h * .3, z - .04); bx(x1 - x0, .08, .05, '#8f5a31', p, (x0 + x1) / 2, h * .8, z - .04); }
function lamp(p, x, z, on) { cyl(.04, .05, 4, 6, '#2b2d31', p, x, 2, z); bx(.6, .06, .08, '#2b2d31', p, x + .28, 4, z); bx(.22, .07, .12, on ? '#ffd27a' : '#dfe2e6', p, x + .5, 3.96, z, on ? { emissive: '#ffb04a', emissiveIntensity: 2 } : {}); }
function road(p, len = 80, night) { bx(len, .02, 7, night ? '#3b3f4a' : '#77797f', p, 0, .01, 0); for (let x = -len / 2; x < len / 2; x += 3) bx(1.4, .025, .14, '#e8e8e2', p, x, .02, 0);
  bx(len, .18, 2.2, night ? '#5b5f6a' : '#b9bbbd', p, 0, .09, -4.6); bx(len, .18, 2.2, night ? '#5b5f6a' : '#b9bbbd', p, 0, .09, 4.6); bx(len, .02, 30, night ? '#2e4a2c' : '#79a35a', p, 0, -.01, -20); }
function room(p, w, d, h, wall, floor) { bx(w + 14, .1, d + 10, floor, p, 0, -.05, 3); bx(w + 14, h + 3, .1, wall, p, 0, (h + 3) / 2, -d / 2); bx(w + 14, .12, .12, '#ffffff', p, 0, .06, -d / 2 + .08); }
function winBox(p, x, y, z, w, h, glow = '#dbe9f5') { bx(w + .12, h + .12, .06, '#f4f1ea', p, x, y, z); bx(w, h, .07, glow, p, x, y, z + .01, { emissive: glow, emissiveIntensity: .6 }); bx(.05, h, .08, '#f4f1ea', p, x, y, z + .02); bx(w, .05, .08, '#f4f1ea', p, x, y, z + .02); }

// ---------- characters ----------
const HERO = makeChar({ band: '#d8322b', stripe: '#d8322b', outline: '#ef5a48' });
const BOSS = makeChar({ shirt: '#5d6470', sleeve: 'long', pants: '#4b515c', legs: 'pants', shoes: '#1d1d1f', hair: 'bald', tie: '#c6302a', collar: '#f4f1ea', stache: 1, skin: '#e2ad88' });
const GUARD = makeChar({ shirt: '#e8b829', sleeve: 'long', sleeveC: '#e8b829', pants: '#1f2126', legs: 'pants', shoes: '#111', hair: 'cap', badge: 1, beard: 1 });
const COP = makeChar({ shirt: '#26324d', sleeve: 'long', pants: '#1f2840', legs: 'pants', shoes: '#111', hair: 'cap', capC: '#1b2238', badge: 1, tie: '#111' });
const MOM = makeChar({ shirt: '#e3b23c', sleeve: 'long', legs: 'skirt', shoes: '#5a3a2a', hair: 'bun', hairC: '#6b4a35', apron: 1, skin: '#e8b591' });
const GIRL = makeChar({ shirt: '#cf2f2a', sleeve: 'short', legs: 'skirt', shoes: '#1b1b1b', hair: 'long', hairC: '#1f1915', bow: '#f2c230', lips: 1, skin: '#efc19e' });
const WAITER = makeChar({ shirt: '#f4f1ea', sleeve: 'long', pants: '#16171a', legs: 'pants', shoes: '#111', hair: 'slick', tie: '#c6302a' });
const QS = [makeChar({ shirt: '#3a7bd5', sleeve: 'long', pants: '#2c2f36', legs: 'pants', shoes: '#222', hair: 'slick', beard: 1 }), makeChar({ shirt: '#e3b23c', legs: 'skirt', shoes: '#333', hair: 'bun', hairC: '#3b2a20' }), makeChar({ shirt: '#8bbf6a', sleeve: 'long', pants: '#45403a', legs: 'pants', shoes: '#222', hair: 'bald', stache: 1 })];
const CW = [makeChar({ shirt: '#9bb7d6', sleeve: 'long', pants: '#333', legs: 'pants', shoes: '#222', hair: 'slick' }), makeChar({ shirt: '#d98a6a', legs: 'skirt', shoes: '#222', hair: 'long', hairC: '#5a3a26' }), makeChar({ shirt: '#f4f1ea', sleeve: 'long', pants: '#2c2f36', legs: 'pants', shoes: '#222', hair: 'crop', beard: 1 })];
const ALL = [HERO, BOSS, GUARD, COP, MOM, GIRL, WAITER, ...QS, ...CW]; ALL.forEach(c => S.add(c.root));
function place(C, x, z, head, pose, face, y = 0, pitch = 0) { C.root.visible = true; C.root.position.set(x, y, z); C.root.rotation.set(pitch, head, 0); setPose(C, pose); if (face) C.setFace(face); }

// ---------- props ----------
function mkClock() { const g = grp(null); const b = cyl(.17, .17, .12, 12, '#f2c230', g, 0, 0, 0); b.rotation.x = PI / 2; const f = cyl(.14, .14, .125, 12, '#f8f4ea', g, 0, 0, .002); f.rotation.x = PI / 2;
  bx(.015, .1, .01, '#222', g, 0, .04, .07); bx(.08, .015, .01, '#222', g, .03, 0, .07); [-1, 1].forEach(s => { const bell = new THREE.Mesh(new THREE.SphereGeometry(.07, 8, 4, 0, PI * 2, 0, PI / 2), M('#d8322b')); bell.position.set(s * .11, .15, 0); bell.rotation.z = -s * .5; bell.castShadow = true; g.add(bell); bx(.025, .1, .025, '#333', g, s * .1, -.19, 0); }); return g; }
function mkCoffee() { const g = grp(null); bx(.42, .52, .4, '#c8302a', g, 0, .26, 0); bx(.46, .1, .44, '#1d1d20', g, 0, .56, 0); bx(.3, .2, .02, '#1d1d20', g, 0, .36, .21); bx(.08, .08, .1, '#2a2a2e', g, 0, .22, .24); bx(.34, .03, .14, '#2a2a2e', g, 0, .05, .26); const l = bx(.05, .05, .02, '#ff5a3a', g, .12, .44, .21, { emissive: '#ff3a2a', emissiveIntensity: 1 }); g.userData.led = l; return g; }
function mkCup() { const g = grp(null); cyl(.045, .04, .1, 10, '#f4f1ea', g, 0, .05, 0); return g; }
function mkBus() { const g = grp(null); bx(7, 2.4, 2.4, '#f2c230', g, 0, 1.55, 0); bx(7.02, .25, 2.42, '#d8322b', g, 0, 1.0, 0); for (let i = 0; i < 5; i++) { bx(1.0, .8, 2.44, '#3d5a73', g, -2.2 + i * 1.15, 2.1, 0, { roughness: .3 }); } bx(.05, 1.1, 2.0, '#3d5a73', g, 3.51, 2.0, 0, { roughness: .3 });
  bx(.8, .3, .1, '#1d1d20', g, 2.6, 2.95, 1.2); g.userData.wheels = [];[-2.3, 2.3].forEach(x => [-1.15, 1.15].forEach(z => { const w = cyl(.45, .45, .3, 10, '#1d1d20', g, x, .45, z); w.rotation.x = PI / 2; g.userData.wheels.push(w); })); bx(.1, .2, .5, '#fff7d6', g, 3.52, 1.1, .7, { emissive: '#fff2b0', emissiveIntensity: .8 }); return g; }
function mkPrinter() { const g = grp(null); bx(.62, .34, .5, '#e9e6df', g, 0, .17, 0); bx(.5, .06, .3, '#bfbab2', g, 0, .37, -.05); bx(.4, .02, .2, '#ffffff', g, 0, .41, -.05); bx(.44, .04, .04, '#2a2a2e', g, 0, .22, .25); const l = bx(.04, .04, .02, '#ff3a2a', g, .22, .28, .26, { emissive: '#ff2a1a', emissiveIntensity: 1.5 }); g.userData.led = l; return g; }
function mkCart() { const g = grp(null); const c = '#c7ccd3'; bx(.9, .04, .55, c, g, 0, .45, 0); bx(.9, .5, .03, c, g, 0, .7, .27); bx(.9, .5, .03, c, g, 0, .7, -.27); bx(.03, .5, .55, c, g, .45, .7, 0); bx(.03, .5, .55, c, g, -.45, .7, 0); for (let i = 1; i < 6; i++) bx(.015, .5, .56, c, g, -.45 + i * .15, .7, 0);
  bx(.04, .4, .04, c, g, -.5, 1.05, .25); bx(.04, .4, .04, c, g, -.5, 1.05, -.25); bx(.05, .05, .6, '#d8322b', g, -.52, 1.25, 0); [-.38, .38].forEach(x => [-.22, .22].forEach(z => cyl(.06, .06, .04, 8, '#222', g, x, .06, z).rotation.x = PI / 2)); bx(.05, .4, .05, c, g, .4, .25, .22); bx(.05, .4, .05, c, g, -.4, .25, -.22); bx(.05, .4, .05, c, g, .4, .25, -.22); bx(.05, .4, .05, c, g, -.4, .25, .22); return g; }
function mkRegister() { const g = grp(null); bx(.5, .22, .42, '#2e3138', g, 0, .11, 0); const dr = bx(.44, .08, .38, '#f2c230', g, 0, .05, .05); g.userData.drawer = dr; bx(.5, .12, .3, '#3a3e47', g, 0, .28, -.05); for (let i = 0; i < 3; i++) for (let j = 0; j < 4; j++) bx(.06, .02, .05, j == 3 ? '#d8322b' : '#e9e6df', g, -.15 + j * .1, .345, -.12 + i * .08);
  bx(.3, .16, .03, '#1d1d20', g, 0, .45, -.18); const s = bx(.26, .1, .01, '#3aff6a', g, 0, .45, -.16, { emissive: '#ff2a1a', emissiveIntensity: 1.2 }); g.userData.scr = s; return g; }
function mkCat() { const g = grp(null); const o = '#e8913a'; bx(.5, .26, .24, o, g, 0, .2, 0); const hd = grp(g, .3, .36, 0); bx(.22, .2, .22, o, hd, 0, 0, 0); bx(.06, .08, .04, o, hd, .02, .13, .07); bx(.06, .08, .04, o, hd, .02, .13, -.07); bx(.01, .03, .03, '#1a1614', hd, .11, .02, .05); bx(.01, .03, .03, '#1a1614', hd, .11, .02, -.05); bx(.01, .02, .03, '#e06a7a', hd, .115, -.03, 0);
  for (let i = 0; i < 3; i++) bx(.06, .262, .242, '#b9652a', g, -.15 + i * .12, .2, 0); [-.18, .18].forEach(x => [-.08, .08].forEach(z => bx(.07, .12, .07, o, g, x, .06, z))); const tl = grp(g, -.25, .28, 0); bx(.06, .06, .34, o, tl, 0, .1, 0).rotation.x = .9; g.userData.tail = tl; return g; }
function mkBill() { const g = grp(null); bx(.24, .005, .32, '#ffffff', g, 0, 0, 0); for (let i = 0; i < 4; i++) bx(.16, .006, .015, '#555', g, 0, .002, -.1 + i * .06); return g; }
function mkSheet() { const g = grp(null); bx(.21, .004, .3, '#ffffff', g, 0, 0, 0); for (let i = 0; i < 3; i++) bx(.14, .005, .012, '#777', g, 0, .002, -.08 + i * .06); return g; }

// ---------- particles (pools; deterministic) ----------
const puffMat = new THREE.MeshStandardMaterial({ color: '#f3efe6', roughness: 1, flatShading: true, transparent: true });
const puffs = [], PUFFN = 70; for (let i = 0; i < PUFFN; i++) { const m = new THREE.Mesh(new THREE.IcosahedronGeometry(.36, 0), puffMat.clone()); m.visible = false; S.add(m); puffs.push(m); }
const stars = []; for (let i = 0; i < 9; i++) { const m = new THREE.Mesh(new THREE.OctahedronGeometry(.07, 0), M('#ffd23a', { emissive: '#ffb000', emissiveIntensity: .8 })); m.visible = false; S.add(m); stars.push(m); }
const bits = []; for (let i = 0; i < 40; i++) { const m = bx(.06, .06, .06, '#ffd23a', S, 0, 0, 0, { emissive: '#ffb000', emissiveIntensity: .6 }); m.visible = false; bits.push(m); }
const FX = []; const fx = (t, x, y, z, n = 8, s = 1, life = 1.1) => FX.push({ t, x, y, z, n, s, life });
const KOS = []; const ko = (t0, t1, obj, dy = .4) => KOS.push({ t0, t1, obj, dy });
const BITS = []; const burst = (t, x, y, z, n, col, sp = 2) => BITS.push({ t, x, y, z, n, col, sp });
function drawFX(t) { let k = 0; for (const e of FX) { const a = t - e.t; if (a < 0 || a > e.life) continue; for (let i = 0; i < e.n && k < PUFFN; i++, k++) { const m = puffs[k], u = a / e.life, ang = i / e.n * PI * 2 + e.t, r = (.25 + .9 * eo(u)) * e.s * (.6 + .6 * hash(i + e.t));
      m.visible = true; m.position.set(e.x + Math.cos(ang) * r, e.y + .1 + u * .5 * e.s + hash(i * 3 + e.t) * .2 * e.s, e.z + Math.sin(ang) * r * .6); m.scale.setScalar(e.s * (.25 + .45 * eo(Math.min(1, u * 2))) * (1 - u * .5) * (.6 + .6 * hash(i * 7 + e.t))); m.material.opacity = 1 - ei(u); m.rotation.set(i, u * 2, i * 2); } }
  for (; k < PUFFN; k++) puffs[k].visible = false;
  let s = 0; for (const e of KOS) { if (t < e.t0 || t > e.t1 || !e.obj.visible) continue; const p = new THREE.Vector3(); e.obj.getWorldPosition(p); for (let i = 0; i < 3 && s < 9; i++, s++) { const a = t * 5 + i * 2.09; stars[s].visible = true; stars[s].position.set(p.x + Math.cos(a) * .22, p.y + e.dy + Math.sin(a * 2) * .03, p.z + Math.sin(a) * .22); stars[s].rotation.y = t * 6; } }
  for (; s < 9; s++) stars[s].visible = false;
  let b = 0; for (const e of BITS) { const a = t - e.t; if (a < 0 || a > 1.4) continue; for (let i = 0; i < e.n && b < 40; i++, b++) { const m = bits[b], ang = hash(i + e.t) * PI * 2, v = e.sp * (.5 + hash(i * 5 + e.t)); m.visible = true; m.material = M(e.col, { emissive: e.col, emissiveIntensity: .3 });
      const y = e.y + (2.5 + hash(i * 3) * 2) * a - 4.9 * a * a; m.position.set(e.x + Math.cos(ang) * v * a, Math.max(.03, y), e.z + Math.sin(ang) * v * a * .7); m.rotation.set(a * 8 + i, a * 5, 0); } }
  for (; b < 40; b++) bits[b].visible = false; }

// ---------- choke choreography ----------
function choke(t, c) {
  const H_ = c.C || HERO, f = [Math.sin(c.head), Math.cos(c.head)]; let x, z, y = 0, pose, face = c.preFace || 'angry', st;
  const L = c.L, hit = L + .25;
  if (t < L - .5) { [x, z] = c.from; pose = c.preP ? c.preP(t) : P.guard; st = 0; }
  else if (t < L - .1) { [x, z] = c.from; pose = mixP(P.guard, P.crouch, eo(seg(t, L - .5, L - .15))); face = 'grit'; st = 1; }
  else if (t < hit) { const u = seg(t, L - .1, hit); x = lerp(c.from[0], c.to[0], eio(u)); z = lerp(c.from[1], c.to[1], eio(u)); y = Math.sin(u * PI) * (c.arc ?? .6); pose = P.leap; face = 'grit'; st = 2; }
  else if (t < c.win) { [x, z] = c.to; const q = Math.sin(t * 30) * .04; pose = mixP(c.chokeP || P.choke, { spine: [.25 + q] }, .3); face = 'grit'; st = 3; }
  else { const u = back(seg(t, c.win, c.win + .45)); x = c.to[0] - f[0] * .35 * u; z = c.to[1] - f[1] * .35 * u; pose = mixP(c.chokeP || P.choke, P.win, u); face = u > .5 ? 'happy' : 'grit'; st = 4; }
  place(H_, x, z, c.head, Object.assign({ tw: st === 2 ? 1 : Math.sin(t * 7) * .2 }, pose), face, y);
  const T = c.tgt; if (!T) return st; T.visible = true;
  const hold = () => { const hx = c.to[0] + f[0] * c.hold[0], hz = c.to[1] + f[1] * c.hold[0]; return [hx, c.hold[1], hz]; };
  if (st <= 2) { T.position.set(...c.rest.p); T.rotation.set(...c.rest.r); T.scale.set(1, 1, 1); if (c.idle) c.idle(t, T); }
  else if (st === 3 && !c.big) { const [hx, hy, hz] = hold(); const tap = (c.taps || []).some(a => t > a - .1 && t < a + .08); const j = tap ? .12 : .03;
    T.position.set(hx + Math.sin(t * 41) * j * .3, hy + Math.sin(t * 37) * j * .3, hz); T.rotation.set(c.holdR[0] + Math.sin(t * 29) * j, c.holdR[1] + c.head, c.holdR[2] + Math.sin(t * 23) * j); const s = t < hit + .2 ? .85 : .95; T.scale.set(1 / s * .98, s, 1 / s * .98); }
  else if (st === 3) { T.position.set(...c.rest.p); T.rotation.set(...c.rest.r); if (c.idle) c.idle(t, T); }
  else if (!c.big && c.lie) { const u = seg(t, c.win, c.win + .4), [hx, hy, hz] = hold(); T.scale.set(1, 1, 1);
    T.position.set(lerp(hx, c.lie.p[0], eo(u)), u < 1 ? lerp(hy, c.lie.p[1], ei(u)) + Math.sin(u * PI) * .25 : c.lie.p[1] + Math.abs(Math.sin(seg(t, c.win + .4, c.win + .7) * PI)) * .08 * (t < c.win + .7 ? 1 : 0), lerp(hz, c.lie.p[2], eo(u)));
    T.rotation.set(lerp(c.holdR[0], c.lie.r[0], eo(u)), lerp(c.holdR[1] + c.head, c.lie.r[1], eo(u)), lerp(c.holdR[2], c.lie.r[2], eo(u))); }
  else if (!c.big) { T.position.set(...c.rest.p); T.rotation.set(...c.rest.r); T.scale.set(1, 1, 1); }
  return st; }

// ---------- camera ----------
let IMP = [];
function shots(t, list) { let i = 0; for (let k = 0; k < list.length; k++) if (t >= list[k][0]) i = k; const s = list[i], t1 = list[i + 1] ? list[i + 1][0] : s[0] + 6, u = eio(seg(t, s[0], t1));
  const p = s[1].map((v, k) => lerp(v, (s[3] || s[1])[k], u)), l = s[2].map((v, k) => lerp(v, (s[4] || s[2])[k], u)); return { p, l, f: lerp(s[5] || 38, s[6] || s[5] || 38, u), k: s[7] ?? 1.75 }; }
const nz = (a, b) => hash(a * 13.1 + b * 7.7) * 2 - 1;

// ---------- sets & scenes ----------
const SC = []; const scene = (t0, build) => SC.push({ t0, ...build });

// S0 intro: suburban street
const st0 = set(); road(st0); fence(st0, -14, 14, -6.4); [[-10, -11, 4, 4, 3, '#f0ece2', '#c9473c'], [-3, -12, 5, 4, 3.2, '#e8e2d6', '#3c78b4'], [5, -11, 4.5, 4, 3, '#f1e6cf', '#c9473c'], [12, -12, 5, 4, 3.4, '#efe9dd', '#4a8a4a']].forEach(a => house(st0, ...a));
[[-7, -8], [1, -8.5], [8, -8], [-13, -8.4], [14, -9]].forEach(([x, z], i) => tree(st0, x, z, 1.2 + hash(i) * .5)); for (let x = -12; x <= 12; x += 8) lamp(st0, x, -3.8);
scene(0, { set: st0, L: { sky: '#c9d3de', focus: [0, 0, 0] }, run(t) {
  const walking = t < 3.0, z = walking ? lerp(-1.5, 1.2, t / 3.0) : 1.2;
  let pose = walking ? walkP(t * 8) : P.stand, face = 'calm';
  if (t >= 3.6 && t < 5.4) pose = mixP(P.stand, { lSh: [-2.6, 0, .6], rSh: [-2.6, 0, -.6], lEl: [-1.9], rEl: [-1.9], neck: [.1] }, eo(seg(t, 3.6, 4.0)));
  if (t >= 5.4) { const u = eo(seg(t, 5.4, 5.8)); pose = mixP(P.stand, P.guard, u); face = 'angry'; }
  if (t >= 7.6) { pose = mixP(P.guard, P.win, back(seg(t, 7.6, 8.0))); face = 'happy'; }
  HERO.root.children.length; place(HERO, 0, z, 0, Object.assign({ tw: Math.sin(t * 6) * .3 }, pose), face);
  HERO.head.children.forEach(m => { if (m.material && m.material.color && m.material.color.getHexString() === 'd8322b') m.visible = t >= 5.35; }); if (HERO.tail1) HERO.tail1.visible = HERO.tail2.visible = t >= 5.35;
  return shots(t, [[0, [0, .55, 4.2], [0, 1.25, 0], [0, .6, 5.0], [0, 1.3, 1], 34], [3.15, [2.3, 1.45, 3.4], [0, 1.5, 1.2], [1.9, 1.5, 3.0], [0, 1.55, 1.2], 30, 30, 1.3], [5.4, [.8, .35, 3.6], [0, 1.45, 1.2], [-1.4, .45, 3.3], [0, 1.4, 1.2], 32], [7.5, [0, .3, 4.6], [0, 1.6, 1.2], [0, .3, 4.0], [0, 1.6, 1.2], 36]]); } });
fx(5.38, 0, 1.75, 1.2, 6, .5, .8);

// S1 bedroom
const st1 = set(); room(st1, 7, 6, 3, '#d9cfc0', '#9b7350'); winBox(st1, -1.4, 1.7, -2.94, 1.6, 1.1, '#fff1cc'); bx(2.2, .45, 1.6, '#f4f1ea', st1, -2.2, .22, -1.9); bx(2.2, .12, 1.6, '#3c78b4', st1, -2.2, .5, -1.9); bx(.5, .2, 1.4, '#ffffff', st1, -3.0, .62, -1.9); bx(.55, .55, .45, '#8a5a36', st1, -.6, .275, -2.3); bx(1.6, .02, 1.2, '#c9473c', st1, .8, .01, -.2);
const CLOCK = mkClock(); st1.add(CLOCK);
const G1 = { from: [.3, -.6], to: [-.25, -1.6], head: -PI * .75, L: 14.3, win: 17.05, tgt: CLOCK, rest: { p: [-.6, .78, -2.3], r: [0, 0, 0] }, hold: [.42, 1.32], holdR: [0, 0, 0], lie: { p: [.6, .13, -.6], r: [PI / 2, 0, .4] }, taps: [15.55, 15.9, 16.25],
  idle: (t, T) => { if (t > 10.25 && t < 14.4) { T.rotation.z = Math.sin(t * 60) * .12; T.position.y = .78 + Math.abs(Math.sin(t * 30)) * .03; } } };
scene(9.55, { set: st1, L: { sky: '#d8cfc2', hs: '#fff3dd', hg: '#7d6a55', hi: 1.3, si: 2.2, sd: [-3, 7, 4], fn: 20, ff: 60, focus: [0, 0, -1] }, run(t) {
  const st = choke(t, Object.assign({}, G1, { preP: t => t < 11.31 ? P.stand : mixP(P.stand, P.reach, eo(seg(t, 11.8, 12.6))), preFace: t < 12.8 ? 'calm' : 'angry' }));
  pl3.intensity = 0; return shots(t, [[9.55, [-.2, 1.0, -1.0], [-.6, .8, -2.3], [-.35, .95, -1.3], [-.6, .82, -2.3], 30, 30, 1.6], [11.31, [2.6, 1.6, 2.6], [-.3, 1.1, -1.4], [2.2, 1.5, 2.2], [-.3, 1.1, -1.5], 34],
    [14.25, [1.6, .9, 1.0], [-.4, 1.2, -1.6], [1.2, 1.0, .6], [-.4, 1.25, -1.6], 30], [16.6, [.2, 1.4, 1.6], [-.4, 1.0, -1.3], [.5, 1.3, 1.9], [-.2, .9, -1.0], 34], [17.69, [1.3, .4, 1.6], [-.4, 1.4, -1.5], [1.0, .45, 1.3], [-.4, 1.5, -1.5], 32]]); } });
fx(14.55, -.25, 1.2, -1.6, 7, .7); fx(16.6, -.25, 1.5, -1.6, 6, .6); ko(16.6, 20.3, CLOCK, .35); fx(17.45, .6, .1, -.6, 6, .6);

// S2 kitchen
const st2 = set(); room(st2, 7, 6, 3, '#e9e2d4', '#8a8f96'); for (let x = -3.2; x < 3.3; x += .4) for (let y = 1.0; y < 1.9; y += .3) bx(.38, .28, .02, (Math.round(x * 10 + y * 10)) % 2 ? '#f4f1ea' : '#d9e3ea', st2, x, y, -2.94);
bx(4.2, .9, .7, '#3c78b4', st2, -.8, .45, -2.6); bx(4.3, .06, .74, '#e9e6df', st2, -.8, .93, -2.6); bx(4.2, .7, .4, '#3c78b4', st2, -.8, 2.3, -2.75); bx(.9, 2.0, .7, '#e9e6df', st2, 2.3, 1.0, -2.6); winBox(st2, 1.0, 1.9, -2.94, .9, .7);
const COFFEE = mkCoffee(), CUP = mkCup(); st2.add(COFFEE, CUP); CUP.position.set(-1.6, .96, -2.4);
const G2 = { from: [.9, -.8], to: [-.3, -1.55], head: -PI * .8, L: 23.75, win: 28.25, tgt: COFFEE, rest: { p: [-.3, .96, -2.55], r: [0, 0, 0] }, hold: [.45, .95], holdR: [0, 0, 0], lie: { p: [.9, .2, -.9], r: [PI / 2, .3, 0] }, taps: [24.85, 25.2, 25.55] };
scene(20.36, { set: st2, L: { sky: '#e5ddcf', hs: '#fff6e6', hg: '#80766a', hi: 1.3, si: 2.2, sd: [3, 7, 5], focus: [0, 0, -1] }, run(t) {
  choke(t, Object.assign({}, G2, { preP: t => t < 21.8 ? walkP(t * 8) : P.stand, preFace: t < 22.8 ? 'calm' : 'angry' }));
  if (t < 21.8) { HERO.root.position.x = lerp(2.6, .9, seg(t, 20.36, 21.8)); }
  COFFEE.userData.led.material = M(t > 27.9 ? '#333' : '#ff5a3a', t > 27.9 ? {} : { emissive: '#ff3a2a', emissiveIntensity: Math.sin(t * 12) > 0 ? 1.4 : .2 });
  return shots(t, [[20.36, [2.8, 1.5, 2.4], [0, 1.1, -1.8], [2.3, 1.4, 2.0], [0, 1.1, -1.8], 34], [23.6, [1.4, 1.1, .6], [-.3, 1.2, -1.6], [1.1, 1.15, .3], [-.3, 1.2, -1.6], 30], [26.07, [-1.3, 1.15, -1.8], [-1.6, .98, -2.4], [-1.35, 1.1, -1.95], [-1.6, .98, -2.4], 26, 26, 1.5],
    [27.88, [1.0, 1.3, 1.2], [-.3, 1.1, -1.4], [1.2, 1.2, 1.5], [-.1, 1.0, -1.2], 32], [28.98, [.6, .35, 1.8], [-.4, 1.4, -1.4], [.4, .4, 1.5], [-.4, 1.5, -1.4], 32]]); } });
fx(24.0, -.3, 1.0, -1.6, 7, .7); fx(27.9, -.3, 1.4, -1.6, 7, .7); ko(27.9, 30.4, COFFEE, .75); fx(28.65, .9, .1, -.9, 6, .6);

// S3 bus
const st3 = set(); road(st3); fence(st3, -16, 16, -6.4); [[-11, -11, 4, 4, 3, '#efe9dd', '#3c78b4'], [-2, -12, 5, 4, 3.4, '#f0ece2', '#c9473c'], [7, -11, 4.5, 4, 3, '#e8e2d6', '#4a8a4a'], [14, -12, 4, 4, 3, '#f1e6cf', '#c9473c']].forEach(a => house(st3, ...a));
[[-6, -8], [3, -8.4], [11, -8], [-14, -8.5]].forEach(([x, z], i) => tree(st3, x, z, 1.3 + hash(i + 4) * .4)); lamp(st3, -6, -3.8); lamp(st3, 6, -3.8);
cyl(.05, .05, 2.6, 6, '#7a7d82', st3, -4.2, 1.3, -3.9); bx(.6, .6, .05, '#3c78b4', st3, -4.2, 2.5, -3.85); bx(.3, .3, .06, '#f4f1ea', st3, -4.2, 2.5, -3.84);
const BUS = mkBus(); st3.add(BUS);
scene(30.46, { set: st3, L: { sky: '#c9d3de', focus: [-1, 0, -1] }, run(t) {
  let bx_ = lerp(18, 0.6, eo(seg(t, 30.5, 31.8))), by = 0, rx = 0; const spin = t < 31.8 ? t * 25 : 0;
  if (t >= 34.3) { const u = seg(t, 34.3, 35.0); rx = PI * eio(u); by = Math.sin(u * PI) * 2.6 + (u >= 1 ? 3.0 : u * 3.0); }
  BUS.position.set(bx_, by, -1.4); BUS.rotation.set(rx, 0, 0); BUS.userData.wheels.forEach(w => w.rotation.y = t >= 35 ? t * 9 : spin);
  if (t < 35.6) { let pose = P.stand, x = -3.6, face = 'calm';
    if (t >= 33.7 && t < 34.3) { const u = seg(t, 33.7, 34.3); pose = mixP(P.stand, P.crouch, eo(u)); x = lerp(-3.6, -2.4, u); face = 'grit'; }
    else if (t >= 34.3 && t < 35.0) { pose = P.lift; x = -2.4; face = 'grit'; } else if (t >= 35.0) { pose = mixP(P.lift, P.stand, eo(seg(t, 35, 35.5))); x = -2.4; face = 'happy'; }
    place(HERO, x, .2, PI / 2, pose, face); }
  else choke(t, { from: [-2.4, .2], to: [-2.6, -.15], head: PI / 2, L: 35.95, win: 38.7, big: 1, tgt: null, preP: () => P.stand, chokeP: P.hug });
  return shots(t, [[30.46, [-6.5, .5, 5.0], [0, 1.6, -1.2], [-6, .5, 4.6], [0, 1.6, -1.2], 40], [33.6, [-7.5, 1.2, 4.5], [-.5, 1.6, -1.2], [-8.5, 1.8, 6.0], [-.5, 2.0, -1.2], 42], [35.0, [-6.0, 2.6, 6.5], [0, 1.5, -1.2], [-5.4, 2.3, 6.0], [0, 1.5, -1.2], 42],
    [35.9, [-1.0, 1.1, 2.6], [-2.6, 1.3, -.3], [-1.3, 1.1, 2.3], [-2.6, 1.35, -.3], 32], [37.0, [-5.0, .5, 3.8], [-1.0, 1.6, -1.2], [-4.6, .5, 3.4], [-1.0, 1.7, -1.2], 40]]); } });
IMP.push(35.0); fx(35.0, .6, .2, -1.4, 12, 1.8, 1.4); fx(36.2, -2.6, 1.3, -.3, 6, .7); fx(38.25, 3.2, .6, -1.4, 8, 1.0, 1.4); ko(38.25, 42.4, HERO, .1);

// S4 office (boss)
const st4 = set(); room(st4, 8, 6, 3, '#e3e6e8', '#6f7680'); bx(3.0, .02, 1.8, '#b8352e', st4, .2, .01, -.4); for (let i = 0; i < 2; i++) { bx(1.6, .05, .8, '#e9e6df', st4, -2.6 + i * 5, .75, -2.2); bx(.06, .75, .7, '#555', st4, -3.3 + i * 5, .37, -2.2); bx(.06, .75, .7, '#555', st4, -1.9 + i * 5, .37, -2.2); bx(.6, .4, .05, '#1d1d20', st4, -2.6 + i * 5, 1.0, -2.4); }
winBox(st4, .2, 1.8, -2.94, 2.4, 1.2); for (let i = 0; i < 8; i++) bx(2.4, .03, .08, '#c8ccd1', st4, .2, 1.3 + i * .14, -2.88);
scene(42.45, { set: st4, L: { sky: '#dfe3e7', hs: '#f4f8ff', hg: '#7a7f88', si: 2.2, sd: [2, 8, 6], focus: [0, 0, -.5] }, run(t) {
  const L = 44.6, tapT = [46.3, 46.7, 47.1];
  if (t < L - .45) { place(BOSS, 1.1, -.4, -PI / 2, mixP(P.stand, P.reach, eo(seg(t, 42.6, 43.3))), 'calm'); place(HERO, -1.0, -.4, PI / 2, P.stand, t > 43.7 ? 'angry' : 'calm'); }
  else if (t < L + .25) { place(BOSS, 1.1, -.4, -PI / 2, P.reach, 'shock'); const u = seg(t, L - .45, L + .25); place(HERO, lerp(-1.0, 1.75, eio(seg(u, .5, 1))), -.4, lerp(PI / 2, -PI / 2, seg(u, .6, 1)), u < .5 ? mixP(P.stand, P.crouch, eo(u * 2)) : P.leap, 'grit', Math.sin(seg(u, .5, 1) * PI) * .8); }
  else { const tap = tapT.some(a => t > a - .12 && t < a + .06); const bp = Object.assign({}, P.bent, { rSh: [tap ? -.15 : -.7, 0, -.1], hy: -.05 }); place(BOSS, 1.1, -.4, -PI / 2, bp, t > 48 ? 'shock' : 'x');
    place(HERO, 1.75, -.4, -PI / 2, Object.assign({}, P.hold, { lSh: [-2.0, 0, .2], lEl: [-.5], rSh: [-1.6, 0, -.1], rEl: [-.6], spine: [.15] }), t > 47.8 ? 'smug' : 'grit'); }
  return shots(t, [[42.45, [0, 1.3, 3.4], [0, 1.3, -.4], [0, 1.3, 3.0], [0, 1.3, -.4], 34], [44.5, [-2.2, .9, 2.6], [1.1, 1.0, -.4], [-1.8, .8, 2.3], [1.1, .9, -.4], 34], [46.1, [.3, .45, 1.2], [.6, .3, -.4], [.4, .45, 1.1], [.6, .3, -.4], 34, 34, 1.4],
    [48.03, [3.4, 1.6, 2.6], [1.3, 1.1, -.4], [3.0, 1.5, 2.3], [1.3, 1.1, -.4], 34]]); } });
IMP.push(44.85); fx(44.85, 1.1, .9, -.4, 7, .8);

// S5 printer
const st5 = set(); room(st5, 8, 6, 3, '#e3e6e8', '#6f7680'); for (let i = 0; i < 3; i++) { bx(1.3, 1.1, .06, '#9aa6b2', st5, -2.8 + i * 1.4, .55, -.9); bx(1.2, .04, .7, '#e9e6df', st5, -2.8 + i * 1.4, .72, -1.3); }
bx(.8, .6, .6, '#5b616b', st5, 1.6, .3, -1.6); const PRN = mkPrinter(); st5.add(PRN); const SHEETS = []; for (let i = 0; i < 10; i++) { const s = mkSheet(); st5.add(s); SHEETS.push(s); }
scene(51.01, { set: st5, L: { sky: '#dfe3e7', hs: '#f4f8ff', hg: '#7a7f88', si: 2.2, sd: [3, 8, 6], focus: [0, 0, -1] }, run(t) {
  const L = 53.1, win = 56.4; CW.forEach((c, i) => { const up = seg(t, 57.88 + i * .12, 58.3 + i * .12), back_ = seg(t, 59.95, 60.4);
    place(c, -2.8 + i * 1.4, -1.9 + back_ * -.4, 0, mixP(mixP({ hy: -.45, lHip: [-1.5], rHip: [-1.5], lKnee: [1.5], rKnee: [1.5], lSh: [-.6], rSh: [-.6], lEl: [-.8], rEl: [-.8] }, P.stand, eo(up)), P.shrug, back_ * .5), t > 59.95 ? 'shock' : up > 0 ? 'happy' : 'calm'); });
  let st;
  if (t < L - .5) { place(HERO, -.2, .4, PI / 2.5, P.stand, t > 52.2 ? 'angry' : 'calm'); st = 0; }
  else if (t < L - .1) { place(HERO, -.2, .4, PI / 2.5, mixP(P.stand, P.crouch, eo(seg(t, L - .5, L - .15))), 'grit'); }
  else if (t < L + .25) { const u = seg(t, L - .1, L + .25); place(HERO, lerp(-.2, .9, u), lerp(.4, -1.0, u), PI / 2.5, P.leap, 'grit', Math.sin(u * PI) * .7); }
  else if (t < win) { place(HERO, .55, -1.05, PI / 2, { hy: -.75, spine: [-.2], lHip: [-1.7, 0, .35], rHip: [-1.7, 0, -.35], lKnee: [1.2], rKnee: [1.2], lSh: [-1.3, 0, .3], rSh: [-1.3, 0, -.3], lEl: [-.6], rEl: [-.6] }, 'grit'); }
  else place(HERO, .3, -.6, PI / 4, mixP({ hy: -.6 }, P.win, back(seg(t, win, win + .45))), 'happy');
  const shake = t < L + .25 ? Math.sin(t * 50) * .03 : t < win ? Math.sin(t * 40) * .05 : 0;
  PRN.position.set(1.6 + shake, .6 + (t >= L + .25 && t < win ? .0 : 0), -1.6); PRN.rotation.set(0, -.3, shake * 2);
  PRN.userData.led.material = M(t > 54.3 ? '#3aff6a' : '#ff3a2a', { emissive: t > 54.3 ? '#2aff5a' : '#ff2a1a', emissiveIntensity: t > 54.3 || Math.sin(t * 10) > 0 ? 1.6 : .1 });
  SHEETS.forEach((s, i) => { const ts = 54.3 + i * .3, u = (t - ts); if (u < 0 || u > 3) { s.visible = false; return; } s.visible = true; const fl = Math.min(u, 1.2);
    s.position.set(1.6 + (i % 2 ? 1 : -1) * (.3 + hash(i) * .8) * fl, Math.max(.02, 1.05 + 2.2 * fl - 2.6 * fl * fl), -1.6 + (.4 + hash(i * 3) * .8) * fl); s.rotation.set(u < 1.2 ? u * 5 : 0, i, u < 1.2 ? u * 3 : 0); });
  return shots(t, [[51.01, [2.4, 1.2, -.3], [1.6, .8, -1.6], [2.2, 1.1, -.5], [1.6, .8, -1.6], 30, 30, 1.5], [52.8, [-1.4, 1.5, 2.6], [.9, .9, -1.2], [-1.0, 1.4, 2.3], [.9, .9, -1.2], 34], [55.9, [3.0, .5, 1.2], [1.2, 1.0, -1.4], [2.7, .5, 1.0], [1.2, 1.0, -1.4], 34],
    [57.88, [.8, 1.5, 2.8], [-1.5, 1.4, -1.6], [.5, 1.5, 2.5], [-1.6, 1.4, -1.6], 34]]); } });
fx(53.35, .9, .9, -1.2, 7, .7);

// S6 canteen
const st6 = set(); room(st6, 9, 6, 3, '#e6dccb', '#9aa0a7'); bx(5.0, .95, .7, '#b8352e', st6, -1.5, .47, -2.4); bx(5.1, .05, .8, '#d6d9dc', st6, -1.5, .97, -2.4); bx(3.0, 1.0, .05, '#2b2d31', st6, -1.5, 2.1, -2.95); for (let i = 0; i < 4; i++) bx(1.8 - hash(i) * .6, .06, .06, '#f2c230', st6, -1.8, 2.4 - i * .2, -2.9);
for (let i = 0; i < 5; i++) { bx(.4, .03, .3, '#f2c230', st6, -3.4 + i * .9, 1.01, -2.3); cyl(.08, .07, .05, 8, i % 2 ? '#f4f1ea' : '#e8913a', st6, -3.4 + i * .9, 1.05, -2.3); }
const TRAY = grp(st6); bx(.45, .03, .32, '#f2c230', TRAY, 0, 0, 0); cyl(.08, .07, .06, 8, '#e8913a', TRAY, -.1, .04, 0); cyl(.06, .05, .08, 8, '#f4f1ea', TRAY, .12, .05, 0);
scene(62.0, { set: st6, L: { sky: '#e5ddcf', hs: '#fff6e6', hg: '#80766a', si: 2.2, sd: [3, 8, 6], focus: [0, 0, -1] }, run(t) {
  QS.forEach((c, i) => place(c, -2.2 + i * .9, -1.5, -PI / 2, Object.assign({}, P.stand, { hy: Math.sin(t * 2 + i) * .005, neck: t > 67.2 ? [.5, 0, 0] : [0, 0, 0] }), t > 67.2 ? 'shock' : 'calm'));
  let x = 1.4, z = -1.5, pose = P.stand, face = 'calm', pitch = 0, y = 0, head = -PI / 2; TRAY.visible = false;
  if (t >= 63.85 && t < 64.6) { const u = eo(seg(t, 63.85, 64.4)); pitch = PI / 2 * u; y = .14 * u; pose = mixP(P.stand, P.crawl, u); face = 'grit'; }
  else if (t >= 64.6 && t < 67.0) { const n = 7, k = seg(t, 64.6, 67.0) * n, i = Math.floor(k), f = k - i; pitch = PI / 2; y = .14 + Math.sin(f * PI) * .03; x = lerp(1.4, -3.3, (i + eo(f)) / n); z = -1.5 + Math.sin(k * PI) * .06;
    pose = mixP(P.crawl, { lSh: [-2.3, 0, .3], rSh: [-2.9, 0, -.3], lHip: [.1, 0, .3], rHip: [-.6, 0, -.4], lKnee: [.6], rKnee: [1.4] }, i % 2 ? eo(f) : 1 - eo(f)); face = 'grit'; }
  else if (t >= 67.0) { const u = eo(seg(t, 67.0, 67.45)); x = -3.3; pitch = PI / 2 * (1 - u); y = .14 * (1 - u); head = lerp(-PI / 2, 0, seg(t, 67.5, 67.9)); pose = t > 70.31 ? P.shrug : mixP(P.crawl, P.hold, u); face = t > 70.31 ? 'calm' : 'happy';
    if (t > 67.6 && t < 70.31) { TRAY.visible = true; TRAY.position.set(-3.3, 1.12, -1.5 + .45); } }
  place(HERO, x, z, head, pose, face, y, pitch);
  return shots(t, [[62.0, [3.2, 1.6, 2.4], [-.8, 1.1, -1.6], [2.8, 1.5, 2.2], [-.8, 1.1, -1.6], 38], [64.5, [.3, .3, .4], [-1.0, .3, -1.5], [-2.5, .3, .4], [-3.2, .3, -1.5], 36], [67.21, [-1.0, 1.5, 1.6], [-2.0, 1.4, -1.5], [-1.2, 1.4, 1.4], [-2.3, 1.3, -1.5], 34],
    [70.31, [-2.5, 1.3, 1.4], [-3.3, 1.4, -1.5], [-2.7, 1.3, 1.2], [-3.3, 1.45, -1.5], 30]]); } });

// S7 elevator
const st7 = set(); room(st7, 7, 6, 3.2, '#cfd3d6', '#7c8188'); bx(1.9, 2.6, .2, '#5b616b', st7, 0, 1.3, -2.85); const DL = bx(.78, 2.3, .06, '#b9bec5', st7, -.39, 1.15, -2.7, { metalness: .6, roughness: .35 }), DR = bx(.78, 2.3, .06, '#b9bec5', st7, .39, 1.15, -2.7, { metalness: .6, roughness: .35 });
bx(1.6, 2.3, .05, '#2b2d31', st7, 0, 1.15, -2.78); const IND = bx(.5, .2, .05, '#1d1d20', st7, 0, 2.75, -2.72); const INDL = bx(.36, .1, .02, '#ff3a2a', st7, 0, 2.75, -2.69, { emissive: '#ff2a1a', emissiveIntensity: 1.5 }); bx(.14, .3, .04, '#2b2d31', st7, 1.2, 1.2, -2.85);
const ELL = new THREE.PointLight('#fff1cc', 0, 6, 1.5); ELL.position.set(0, 2, -3.2); st7.add(ELL);
scene(71.66, { set: st7, L: { sky: '#d5d9dc', hs: '#f4f8ff', hg: '#6f747a', hi: 1.0, si: 1.6, sd: [2, 8, 6], focus: [0, 0, -1] }, run(t) {
  const g = .7 * eio(seg(t, 74.9, 76.3)), jit = t > 74.9 && t < 76.3 ? Math.sin(t * 60) * .01 : t < 73.3 ? Math.sin(t * 45) * .008 : 0; DL.position.x = -.39 - g + jit; DR.position.x = .39 + g - jit; ELL.intensity = g * 6;
  INDL.material = M(t > 76.43 ? '#3aff6a' : '#ff3a2a', { emissive: t > 76.43 ? '#2aff5a' : '#ff2a1a', emissiveIntensity: t > 76.43 || Math.sin(t * 8) > 0 ? 1.6 : .1 });
  const L = 73.75; let x = -1.6, z = -.6, pose = P.stand, face = 'angry', y = 0, head = PI / 4;
  if (t >= L - .45 && t < L - .05) { pose = mixP(P.stand, P.crouch, eo(seg(t, L - .45, L - .1))); face = 'grit'; }
  else if (t >= L - .05 && t < L + .25) { const u = seg(t, L - .05, L + .25); x = lerp(-1.6, 0, u); z = lerp(-.6, -2.25, u); y = Math.sin(u * PI) * 1.0 + u * .35; pose = P.leap; face = 'grit'; head = lerp(PI / 4, PI, u); }
  else if (t >= L + .25 && t < 74.6) { x = 0; z = -2.3; y = .35 + Math.sin(t * 20) * .02; head = PI; pose = Object.assign({}, P.lift, { lKnee: [.9], rKnee: [.7], lHip: [-.3], rHip: [-.2] }); face = 'grit'; }
  else if (t >= 74.6) { const u = eo(seg(t, 74.6, 74.85)); x = 0; z = -2.2; y = .35 * (1 - u); head = PI; pose = t < 76.6 ? mixP(P.lift, Object.assign({}, P.pry, { lEl: [-.8], rEl: [-.8] }), u) : mixP(P.pry, P.win, back(seg(t, 76.6, 77.0))); face = t < 76.43 ? 'grit' : 'happy';
    if (t > 77.2) { head = lerp(PI, 0, eo(seg(t, 77.2, 77.7))); } }
  place(HERO, x, z, head, pose, face, y);
  return shots(t, [[71.66, [0, 1.3, 2.4], [0, 1.6, -2.7], [0, 1.4, 1.9], [0, 1.7, -2.7], 40], [73.6, [-2.4, 1.4, 1.0], [0, 1.8, -2.4], [-2.0, 1.4, .7], [0, 1.8, -2.4], 36], [74.85, [0, 1.6, 2.2], [0, 1.4, -2.6], [0, 1.5, 1.4], [0, 1.4, -2.6], 38],
    [77.2, [.6, .5, 1.2], [0, 1.6, -2.0], [.5, .45, 1.0], [0, 1.6, -2.0], 34]]); } });
fx(74.0, 0, 2.6, -2.5, 6, .7);

// S8 store
const st8 = set(); room(st8, 12, 7, 3.2, '#e9e6df', '#a7abb1'); for (let k = 0; k < 4; k++) { const x = -4.5 + k * 2.4; bx(2.1, 2.0, .5, '#f4f1ea', st8, x, 1.0, -3.0); for (let j = 0; j < 3; j++) for (let b = 0; b < 6; b++) bx(.28, .34, .3, ['#d8322b', '#f2c230', '#3c78b4', '#4a8a4a'][(b + j + k) % 4], st8, x - .85 + b * .34, .5 + j * .6, -2.85); }
bx(1.6, .9, .7, '#2b2d31', st8, 3.4, .45, -.8); bx(1.7, .05, .8, '#e9e6df', st8, 3.4, .92, -.8); const CART = mkCart(), REG = mkRegister(); st8.add(CART, REG);
scene(79.69, { set: st8, L: { sky: '#e5e3dd', hs: '#ffffff', hg: '#80786c', si: 2.2, sd: [2, 9, 6], focus: [1, 0, -.5] }, run(t) {
  GUARD.root.visible = false;
  // cart
  if (t < 81.41) { const x = lerp(-4.5, -2.6, seg(t, 79.69, 81.4)); place(HERO, x, -.2, PI / 2, walkP(t * 8, P.hold), 'calm'); CART.position.set(x + .95, 0, -.2); CART.rotation.set(0, 0, 0); }
  else if (t < 84.93) { choke(t, { from: [-2.6, -.2], to: [-2.2, -.2], head: PI / 2, L: 83.45, win: 84.55, tgt: CART, rest: { p: [-1.65, 0, -.2], r: [0, 0, 0] }, hold: [.5, .55], holdR: [0, 0, .3], lie: { p: [-1.0, .3, -.4], r: [PI / 2, 0, 0] }, taps: [83.95, 84.2], preP: () => P.hold,
      idle: (t, T) => { if (t > 81.41) { T.position.x = -1.65 + Math.sin(t * 17) * .12 * (Math.sin(t * 3) > 0 ? 1 : .3); T.rotation.y = Math.sin(t * 13) * .15; HERO.root.position.x = -2.6 + Math.sin(t * 17) * .06; } } }); }
  else { CART.position.set(-1.0, .3, -.4); CART.rotation.set(PI / 2, 0, 0); }
  // register
  const regRest = { p: [3.4, .95, -.8], r: [0, -PI / 2, 0] };
  if (t < 84.93) { REG.position.set(...regRest.p); REG.rotation.set(...regRest.r); }
  else if (t < 88.47) { choke(t, { from: [-2.55, -.2], to: [2.4, -.4], head: PI / 2, L: 87.35, win: 88.25, arc: .9, tgt: REG, rest: regRest, hold: [.42, 1.2], holdR: [0, -PI / 2, 0], lie: { p: [2.4, .12, .6], r: [0, .5, PI / 2] }, taps: [87.75], preP: t => t < 86.0 ? walkP(t * 8) : P.guard,
      idle: (t, T) => { T.rotation.z = Math.sin(t * 40) * .02; } });
    if (t < 86.0) HERO.root.position.x = lerp(-2.55, 1.2, seg(t, 84.93, 86.0)), HERO.root.position.z = lerp(-.2, -.4, seg(t, 84.93, 86.0));
    if (t < 87.35 - .5 && t >= 86.0) HERO.root.position.x = 1.2; REG.userData.drawer.position.z = t > 87.6 ? .32 : .05; }
  else { REG.position.set(2.4, .12, .6); REG.rotation.set(0, .5, PI / 2); }
  REG.userData.scr.material = M(t > 88.0 ? '#2b2d31' : '#ff3a2a', { emissive: t > 88.0 ? '#000' : '#ff2a1a', emissiveIntensity: Math.sin(t * 9) > 0 ? 1.4 : .3 });
  // guard
  if (t >= 88.47) { const arrive = seg(t, 88.6, 90.0);
    choke(t, { from: [2.0, -.4], to: [3.55, -.2], head: PI / 2, L: 91.0, win: 91.6, tgt: null, preP: () => P.guard, chokeP: P.hug });
    if (t < 91.25) place(GUARD, lerp(7, 4.1, arrive), -.2, -PI / 2, arrive < 1 ? walkP(t * 8) : P.stop, 'angry');
    else { const u = seg(t, 91.25, 91.65); place(GUARD, lerp(4.1, 4.6, eo(u)), -.2, -PI / 2, mixP(P.stand, P.lieStar, u), 'x', .14 * u, -PI / 2 * eo(u)); } }
  return shots(t, [[79.69, [-1.2, 1.4, 3.6], [-2.6, 1.0, -.2], [-1.0, 1.4, 3.2], [-2.0, 1.0, -.2], 38], [83.3, [-.6, 1.1, 1.8], [-2.0, 1.1, -.2], [-.8, 1.1, 1.5], [-2.0, 1.1, -.2], 32], [84.93, [4.6, 1.5, 2.6], [2.6, 1.0, -.6], [4.3, 1.5, 2.3], [2.6, 1.0, -.6], 36],
    [88.47, [1.2, 1.3, 3.6], [3.6, 1.1, -.2], [1.0, 1.3, 3.3], [3.8, 1.0, -.2], 36]]); } });
fx(83.7, -2.0, .8, -.2, 6, .6); fx(84.95, -1.0, .2, -.4, 6, .6); fx(87.6, 2.6, 1.2, -.4, 6, .6); burst(87.62, 2.6, 1.2, -.3, 14, '#f2c230', 2.2); fx(88.6, 2.4, .1, .6, 6, .6); fx(91.65, 4.6, .1, -.2, 9, .9); IMP.push(91.6); ko(88.0, 93.2, REG, .3); ko(84.3, 93.2, CART, .6);

// S9 night police
const st9 = set(); road(st9, 80, 1); fence(st9, -16, 16, -6.4, 1.25, '#5a3c26'); [[-11, -11, 4, 4, 3, '#4d5566', '#2b2f3a'], [-2, -12, 5, 4, 3.4, '#525a6b', '#2b2f3a'], [7, -11, 4.5, 4, 3, '#4a5160', '#2b2f3a'], [14, -12, 4, 4, 3, '#4d5566', '#2b2f3a']].forEach(a => { const h = house(st9, ...a); h.children.forEach(m => { if (m.geometry && m.geometry.parameters && m.geometry.parameters.width === .5) m.material = M('#ffcf6a', { emissive: '#ffb040', emissiveIntensity: 1.5 }); }); });
for (let x = -12; x <= 12; x += 8) lamp(st9, x, -3.8, 1); const CAR = grp(st9); bx(3.6, .8, 1.7, '#1f2840', CAR, 0, .6, 0); bx(2.0, .6, 1.6, '#1f2840', CAR, -.2, 1.25, 0); bx(1.9, .5, 1.62, '#2a3b55', CAR, -.2, 1.25, 0); const LR = bx(.35, .14, .3, '#ff2a1a', CAR, -.4, 1.6, 0, { emissive: '#ff2a1a', emissiveIntensity: 2 }), LB = bx(.35, .14, .3, '#2a6bff', CAR, 0, 1.6, 0, { emissive: '#2a6bff', emissiveIntensity: 2 });
[-1.2, 1.2].forEach(x => [-.85, .85].forEach(z => cyl(.33, .33, .2, 10, '#111', CAR, x, .33, z).rotation.x = PI / 2)); CAR.position.set(4.5, 0, -2.2);
scene(93.23, { set: st9, L: { sky: '#121a33', fog: '#121a33', fn: 10, ff: 40, hs: '#3a4f88', hg: '#1a1d26', hi: .9, sc: '#9fb4ff', si: .8, sd: [-4, 9, 4], focus: [1, 0, 0] }, run(t) {
  const blink = Math.sin(t * 14) > 0; pl1.position.set(4.1, 1.8, -1.6); pl2.position.set(4.6, 1.8, -1.6); pl1.intensity = blink ? 9 : 1; pl2.intensity = blink ? 1 : 9; pl3.position.set(-3, 3.5, -2.5); pl3.intensity = 6;
  LR.material = M('#ff2a1a', { emissive: '#ff2a1a', emissiveIntensity: blink ? 3 : .3 }); LB.material = M('#2a6bff', { emissive: '#2a6bff', emissiveIntensity: blink ? .3 : 3 });
  let x = lerp(-5, -1.8, seg(t, 93.23, 95.0)), pose = t < 95 ? walkP(t * 8) : P.stand, face = 'calm', y = 0, pitch = 0;
  if (t >= 99.66 && t < 100.5) { x = lerp(-1.8, -.4, seg(t, 99.66, 100.5)); pose = walkP(t * 8); }
  else if (t >= 100.5 && t < 101.3) { const u = seg(t, 100.5, 101.3); x = lerp(-.4, 3.4, u); pose = Object.assign({}, P.crouch, { lSh: [-1.6, 0, .2], rSh: [-1.6, 0, -.2], hy: -.35 }); pitch = PI * 2 * eio(u); y = .55 * Math.sin(u * PI) + .25; face = 'grit'; }
  else if (t >= 101.3) { x = 3.4; pose = mixP(P.crouch, P.win, back(seg(t, 101.3, 101.7))); face = 'happy'; }
  HERO.root.rotation.order = 'YXZ'; place(HERO, x, 0, PI / 2, pose, face, y, pitch); if (t >= 100.5 && t < 101.3) { HERO.root.position.y = y + .9; HERO.hips.position.y = .95 - .9; }
  let cx = lerp(4.4, 1.5, seg(t, 95.14, 96.2)), cpose = t < 96.2 ? walkP(t * 8) : P.stop, cf = t > 96.2 ? 'angry' : 'calm', cpitch = 0, cy = 0;
  if (t >= 100.85) { const u = seg(t, 100.85, 101.3); cpose = mixP(P.stop, P.lieStar, u); cpitch = -PI / 2 * eo(u); cy = .14 * u; cf = 'x'; cx = 1.5 + u * .6; }
  if (t >= 95.14) place(COP, cx, .3, -PI / 2, cpose, cf, cy, cpitch); else COP.root.visible = false;
  return shots(t, [[93.23, [-1.0, 1.2, 4.2], [-2.5, 1.3, 0], [-.6, 1.2, 3.8], [-1.6, 1.3, 0], 38], [95.14, [3.2, .8, 2.6], [1.5, 1.5, .3], [2.9, .8, 2.3], [1.5, 1.6, .3], 34], [97.9, [1.0, .25, 1.4], [1.5, 2.0, .3], [1.1, .25, 1.2], [1.5, 2.1, .3], 30, 30, 1.5],
    [99.6, [-.5, 1.6, 5.4], [1.0, 1.0, 0], [.5, 1.4, 5.2], [2.0, 1.0, 0], 38], [102.4, [4.6, .45, 2.6], [3.4, 1.5, 0], [4.4, .45, 2.3], [3.4, 1.6, 0], 32]]); } });
IMP.push(97.97, 100.85); fx(100.9, 1.8, .4, .3, 9, .9);

// S10 home
const st10 = set(); room(st10, 9, 6, 3, '#e7c98a', '#9b7350'); bx(2.6, .45, .9, '#b8352e', st10, -2.4, .3, -2.3); bx(2.6, .6, .25, '#b8352e', st10, -2.4, .8, -2.65); bx(3.4, .02, 2.2, '#3c78b4', st10, .2, .01, -.6); bx(.9, 2.1, .08, '#7a5634', st10, 3.6, 1.05, -2.92); winBox(st10, 0, 1.8, -2.94, 1.6, 1.0, '#ffe2a8');
cyl(.05, .05, 1.6, 6, '#2b2d31', st10, 2.5, .8, -2.4); cyl(.25, .35, .35, 8, '#f4f1ea', st10, 2.5, 1.7, -2.4); const CAT = mkCat(); st10.add(CAT); const LADLE = grp(st10); bx(.03, .4, .03, '#999', LADLE, 0, .2, 0); bx(.1, .05, .1, '#999', LADLE, 0, 0, 0);
scene(104.12, { set: st10, L: { sky: '#e9d2a0', hs: '#fff0d0', hg: '#80664a', hi: 1.2, si: 2.0, sd: [-3, 8, 5], focus: [0, 0, -1] }, run(t) {
  let x = lerp(-2.6, -.6, seg(t, 104.12, 105.2)), z = -.6, pose = t < 105.2 ? walkP(t * 8, P.hug) : P.hug, face = 'happy', y = 0, pitch = 0, head = PI / 2;
  const catFlat = t >= 105.5; CAT.position.set(.6, 0, -.6); CAT.rotation.set(0, PI, 0); CAT.scale.set(catFlat ? 1.25 : 1, catFlat ? .45 : 1, catFlat ? 1.25 : 1); CAT.userData.tail.rotation.z = Math.sin(t * 3) * .4;
  if (t >= 105.2 && t < 105.5) { const u = eo(seg(t, 105.2, 105.5)); x = lerp(-.6, -.35, u); pitch = PI / 2 * u; y = .25 * u; pose = P.hug; }
  else if (t >= 105.5 && t < 108.6) { x = -.35; pitch = PI / 2; y = .3; pose = P.hug; }
  else if (t >= 108.6 && t < 109.0) { const u = eo(seg(t, 108.6, 109.0)); x = -.35; pitch = PI / 2 * (1 - u); y = .3 * (1 - u); pose = mixP(P.hug, P.stand, u); }
  else if (t >= 109.0 && t < 110.3) { x = lerp(-.35, 1.9, seg(t, 109.56, 110.3)); pose = t > 109.56 ? walkP(t * 8, P.hug) : P.stand; }
  else if (t >= 110.3) { const u = eo(seg(t, 110.3, 110.55)); x = 1.9 + u * .3; pitch = PI / 2 * u; y = .28 * u; pose = P.hug; face = 'happy'; }
  place(HERO, x, z, head, pose, face, y, pitch);
  let mx = lerp(4.6, 2.9, seg(t, 108.05, 108.8)), mp = t < 108.8 ? walkP(t * 8) : P.stop, mf = 'calm', mpitch = 0, my = 0;
  if (t >= 110.45) { const u = eo(seg(t, 110.45, 110.75)); mp = mixP(P.stand, P.lieStar, u); mpitch = -PI / 2 * u; my = .14 * u; mf = 'happy'; mx = 2.9 + u * .1; }
  if (t >= 108.05) place(MOM, mx, -.6, -PI / 2, mp, mf, my, mpitch); else MOM.root.visible = false;
  LADLE.visible = t >= 108.05 && t < 110.45; if (LADLE.visible) { const hp = new THREE.Vector3(); MOM.rEl.children[1].getWorldPosition(hp); LADLE.position.copy(hp); }
  return shots(t, [[104.12, [0, 1.4, 3.6], [-.4, .8, -.6], [.3, 1.3, 3.2], [0, .7, -.6], 38], [105.45, [1.6, .5, 1.2], [.3, .4, -.6], [1.4, .45, 1.0], [.3, .4, -.6], 32], [108.0, [1.0, 1.4, 3.4], [2.6, 1.3, -.6], [1.2, 1.4, 3.1], [2.6, 1.3, -.6], 36],
    [110.4, [2.0, 2.6, 2.4], [2.3, .3, -.6], [2.0, 2.8, 2.0], [2.3, .3, -.6], 36]]); } });
IMP.push(105.5, 110.5); fx(105.5, .5, .2, -.6, 7, .7); fx(110.55, 2.6, .2, -.6, 7, .7);

// S11 restaurant (dusk)
const st11 = set(); road(st11); bx(14, 5, .4, '#e9e2d4', st11, 0, 2.5, -5.6); for (let i = 0; i < 14; i++) { const a = bx(.5, .1, 1.2, i % 2 ? '#c9302a' : '#f4f1ea', st11, -3.25 + i * .5, 3.2, -4.9); a.rotation.x = .35; }
winBox(st11, 1.6, 1.8, -5.38, 2.4, 1.6, '#ffd08a'); bx(1.2, 2.4, .1, '#3a2a20', st11, -1.8, 1.2, -5.38); for (let i = 0; i < 10; i++) { const b = new THREE.Mesh(new THREE.SphereGeometry(.05, 6, 4), M('#ffdf8a', { emissive: '#ffc04a', emissiveIntensity: 2 })); b.position.set(-3.4 + i * .75, 3.6 - Math.sin(i / 9 * PI) * .25, -4.3); st11.add(b); }
[[-5.5, -4.2], [5.5, -4.2]].forEach(([x, z]) => { bx(.6, .6, .6, '#7a5634', st11, x, .3, z); tree(st11, x, z, .8); }); const FLOW = grp(st11); [['#d8322b', 0, .18], ['#f2c230', -.07, .14], ['#d8322b', .07, .15], ['#ffffff', 0, .24]].forEach(([c, dx, h]) => { cyl(.01, .01, h, 4, '#3d7a33', FLOW, dx, h / 2, 0); const f = new THREE.Mesh(new THREE.IcosahedronGeometry(.05, 0), M(c)); f.position.set(dx, h, 0); FLOW.add(f); });
const CLOUD = grp(st11); const CB = []; for (let i = 0; i < 16; i++) { const m = new THREE.Mesh(new THREE.IcosahedronGeometry(.5, 0), M('#efe9dd')); m.castShadow = true; CLOUD.add(m); CB.push(m); } const LIMBS = []; for (let i = 0; i < 6; i++) { const l = bx(.13, .5, .13, i % 2 ? '#e9b48f' : '#cf2f2a', CLOUD, 0, 0, 0); LIMBS.push(l); } const BILL = mkBill(); st11.add(BILL);
scene(114.76, { set: st11, L: { sky: '#e9b48a', fog: '#e2a888', fn: 14, ff: 50, hs: '#ffd8b0', hg: '#6a5060', hi: 1.0, sc: '#ffb070', si: 2.2, sd: [-6, 5, 4], focus: [0, 0, -2] }, run(t) {
  pl3.position.set(1.6, 2.5, -4.2); pl3.intensity = 5; const cloud = t >= 130.0; CLOUD.visible = cloud; FLOW.visible = !cloud;
  if (!cloud) {
    const gp = t < 124.53 ? P.hold : t < 125.2 ? Object.assign({}, P.hold, { rSh: [-2.0, 0, -.3], rEl: [-.8 + Math.sin(t * 20) * .5] }) : P.hold;
    if (t < 123.3 - .5) { place(GIRL, 1.0, -2.6, -PI / 2.4, Object.assign({}, gp, { hy: Math.sin(t * 2) * .005 }), 'calm');
      const hx = lerp(-6, -1.0, seg(t, 117.32, 119.4)); if (t > 117.0) place(HERO, hx, -2.4, PI / 2, t < 119.4 ? walkP(t * 8) : P.stand, 'happy'); else HERO.root.visible = false; }
    else { choke(t, { from: [-1.0, -2.4], to: [.45, -2.55], head: PI / 2, L: 123.3, win: 1e9, tgt: null, preP: () => P.stand, preFace: 'happy', chokeP: P.hug });
      const u = seg(t, 128.9, 129.4); place(GIRL, 1.0 - u * .2, -2.6, -PI / 2.4 - u * 1.5, Object.assign({}, gp, u > 0 ? mixP(P.hold, P.leap, u) : {}), t > 125.2 ? 'smug' : 'calm'); if (u > 0) { HERO.root.rotation.x = -PI / 2 * eo(u); HERO.root.position.y = .14 * u; HERO.setFace('shock'); } }
    const hp = new THREE.Vector3(); (t < 128.9 ? GIRL.lEl.children[1] : GIRL.lEl.children[1]).getWorldPosition(hp); FLOW.position.copy(hp); FLOW.rotation.set(0, 0, 0);
  } else { HERO.root.visible = GIRL.root.visible = false; const k = Math.floor(t * 12);
    CB.forEach((m, i) => { const a = i / 16 * PI * 2 + t * .7; const r = .55 + .25 * hash(i + k * .37); m.position.set(Math.cos(a) * r * 1.3, .7 + Math.sin(a * 2 + t) * .3 + hash(i) * .5, Math.sin(a) * r * .7); m.scale.setScalar(.6 + .35 * hash(i * 7 + k)); m.rotation.set(t * 2 + i, i, 0); });
    LIMBS.forEach((l, i) => { const a = hash(k * 3 + i) * PI * 2; l.position.set(Math.cos(a) * 1.1, .8 + Math.sin(a) * .6, Math.sin(a) * .4 + .3); l.rotation.set(0, 0, a + PI / 2); }); CLOUD.position.set(.6, 0, -2.5); }
  if (t >= 133.03) { const wx = lerp(-5.5, -1.4, seg(t, 133.03, 134.2)); place(WAITER, wx, -2.0, PI / 2, t < 134.2 ? walkP(t * 8, P.hold) : P.hold, 'calm'); } else WAITER.root.visible = false;
  BILL.visible = t >= 133.03; if (BILL.visible) { const u = seg(t, 134.3, 134.8); BILL.position.set(lerp(-1.0, .6, eo(u)), u < 1 ? 1.15 + Math.sin(u * PI) * .6 - u * (1.15 - 2.05) : 2.05, lerp(-2.0, -2.5, u)); BILL.rotation.set(u * PI * 2, 0, u * .5); }
  return shots(t, [[114.76, [3.0, 1.4, 3.0], [.9, 1.3, -2.6], [2.6, 1.3, 2.6], [.9, 1.3, -2.6], 34], [117.32, [-2.0, 1.4, 3.2], [-1.5, 1.2, -2.5], [-.5, 1.4, 3.0], [0, 1.2, -2.5], 38], [123.2, [2.4, 1.1, .6], [.6, 1.4, -2.6], [2.1, 1.1, .4], [.6, 1.4, -2.6], 32],
    [125.3, [1.6, 1.5, -.4], [.9, 1.6, -2.6], [1.5, 1.55, -.7], [.9, 1.6, -2.6], 28], [129.3, [-.6, 1.9, 4.2], [.6, 1.0, -2.5], [-.2, 1.7, 3.6], [.6, 1.0, -2.5], 38], [133.0, [-3.2, 1.4, 2.6], [0, 1.4, -2.3], [-3.0, 1.5, 2.4], [.3, 1.6, -2.4], 38]]); } });
IMP.push(123.55, 129.4); fx(123.6, .6, 1.2, -2.5, 6, .6); fx(129.45, .6, .3, -2.5, 10, 1.1); fx(130.0, .6, .5, -2.5, 14, 1.6, 1.5);

// S12 finale: sunrise road with the defeated
const st12 = set(); road(st12, 120); fence(st12, -40, 40, -6.4); for (let i = 0; i < 10; i++) house(st12, -36 + i * 8, -11.5, 4 + hash(i) * 1.5, 4, 3 + hash(i + 3), ['#efe9dd', '#f0ece2', '#e8e2d6', '#f1e6cf'][i % 4], ['#c9473c', '#3c78b4', '#4a8a4a'][i % 3]); for (let i = 0; i < 12; i++) tree(st12, -40 + i * 7 + hash(i) * 2, -8.3, 1.2 + hash(i) * .5);
for (let x = -36; x <= 36; x += 9) { cyl(.06, .08, 6, 5, '#6a4a30', st12, x, 3, -3.9); bx(1.2, .06, .06, '#6a4a30', st12, x, 5.6, -3.9); }
const FIN = [mkClock(), mkCoffee(), null, mkPrinter(), null, null, null, null, mkCat(), null]; const F_BUS = mkBus(); st12.add(F_BUS); F_BUS.position.set(-6, 3.0, -3.0); F_BUS.rotation.set(PI, .2, 0);
const F_DOOR = bx(.78, 2.3, .06, '#b9bec5', st12, 0, .04, 0, { metalness: .6, roughness: .35 }); F_DOOR.rotation.x = -PI / 2; FIN.forEach(o => o && st12.add(o));
const FXS = [-15, -11.5, -6, -8, -3.2, 0, 3, 6, 9, 12]; const FLIST = ['БУДИЛЬНИК', 'КОФЕМАШИНА', 'АВТОБУС', 'ПРИНТЕР', 'ЛИФТ', 'НАЧАЛЬНИК', 'ОХРАННИК', 'ПОЛИЦЕЙСКИЙ', 'КОТ', 'ДЕВУШКА'];
scene(136.12, { set: st12, L: { sky: '#f0b98a', fog: '#e9a985', fn: 16, ff: 70, hs: '#ffd9b5', hg: '#6a5060', hi: 1.0, sc: '#ffae6a', si: 2.6, sd: [-8, 4, -2], focus: [0, 0, 0] }, run(t) {
  const hx = lerp(-17, 14, eio(seg(t, 136.6, 146.2)));
  FIN[0].position.set(FXS[0], .17, 3.4); FIN[0].rotation.set(PI / 2, 0, .4); FIN[1].position.set(FXS[1], .22, 3.6); FIN[1].rotation.set(PI / 2, .4, 0); FIN[3].position.set(FXS[3], .25, 3.5); FIN[3].rotation.set(0, .6, PI / 2); FIN[8].position.set(FXS[8], 0, 3.3); FIN[8].scale.set(1.25, .45, 1.25);
  F_DOOR.position.set(FXS[4], .04, 3.4); F_DOOR.rotation.set(-PI / 2, 0, .5);
  [[BOSS, 5, 1], [GUARD, 6, -1], [COP, 7, 1], [GIRL, 9, -1]].forEach(([c, i, s]) => place(c, FXS[i], 3.3, s * PI / 2, P.lieStar, i === 9 ? 'smug' : 'x', .14, -PI / 2));
  let pose = walkP(hx * 2.3), face = 'calm', head = PI / 2; if (t > 146.2) { const u = eo(seg(t, 146.2, 146.8)); head = lerp(PI / 2, 0, u); pose = mixP(P.stand, P.win, back(seg(t, 148.4, 148.8))); face = t > 148.4 ? 'happy' : 'calm'; }
  place(HERO, hx, 1.8, head, pose, face);
  return shots(t, [[136.12, [hx - 1.5, .5, 5.0], [hx + 1, 1.3, 1.8], [hx - 1.5, .5, 5.0], [hx + 1, 1.3, 1.8], 40].map((v, i) => i === 1 || i === 3 ? [v[0], v[1], v[2]] : v),
    [138.0, [hx, 2.4, 8.4], [hx, 1.0, 2.4], [hx, 2.4, 8.4], [hx, 1.0, 2.4], 40], [144.6, [hx + 3.5, .6, 4.4], [hx, 1.4, 1.8], [hx + 3.0, .5, 4.0], [hx, 1.5, 1.8], 38], [146.6, [14, .35, 4.6], [14, 1.6, 1.8], [14, .35, 4.0], [14, 1.6, 1.8], 36]]); } });

// ---------- overlay: captions + labels ----------
const CAPS = window.__CAPS;
const LABELS = [
  [0.2, 3.1, 'dark', 'ПЕРВОЕ ЗАНЯТИЕ', 'ГРЭППЛИНГ'], [3.15, 9.5, 'tag', 'ЗАНЯТИЕ №1'], [5.5, 9.5, 'tag2', 'ЖИЗНЬ ДО И ПОСЛЕ'],
  [10.25, 14.2, 'dark', '07:00 · БУДИЛЬНИК', 'ЗВОНИТ'], [16.6, 20.3, 'tag', '№1 БУДИЛЬНИК — СДАЛСЯ'], [17.69, 20.3, 'score', '1:0'],
  [20.4, 23.5, 'dark', 'КОФЕМАШИНА', 'ГОТОВИТ КОФЕ'], [26.07, 27.9, 'tag', 'КОФЕ НЕ НАЛИЛСЯ'], [27.9, 30.4, 'tag', '№2 КОФЕМАШИНА — СДАЛАСЬ'], [28.98, 30.4, 'score', '2:0'],
  [30.5, 33.6, 'dark', 'АВТОБУС №9', 'ОСТАНОВКА'], [37.03, 38.8, 'stamp', 'ОПЛАЧЕНО'], [38.25, 42.4, 'tag', '№3 АВТОБУС — СДАЛСЯ'], [38.85, 42.4, 'score', '3:0'], [39.43, 42.4, 'tag2', '09:00 УТРА'],
  [42.5, 44.5, 'dark', 'ОФИС', 'НАЧАЛЬНИК'], [44.75, 51.0, 'stamp', 'БОЛЕВОЙ'], [48.03, 51.0, 'list', ['ПОВЫШЕНИЕ?', 'УВОЛЬНЕНИЕ?']],
  [51.05, 53.0, 'dark', 'ПРИНТЕР', 'ЗАВИС · 3 ГОДА'], [53.4, 61.9, 'stamp', 'ТРЕУГОЛЬНИК'], [55.94, 61.9, 'tag', 'ВПЕРВЫЕ ЗА 3 ГОДА'], [57.88, 61.9, 'list', ['УВАЖЕНИЕ', 'ЛЁГКИЙ СТРАХ']],
  [62.05, 64.5, 'dark', 'СТОЛОВАЯ', 'ОЧЕРЕДЬ · 3 ЧЕЛОВЕКА'], [64.6, 67.1, 'tag', 'ПОЛЗЁТ'], [67.21, 71.6, 'tag', '№1 В ОЧЕРЕДИ'],
  [71.7, 73.6, 'dark', 'ЛИФТ', 'ЗАСТРЯЛ'], [73.95, 79.6, 'stamp', 'ГИЛЬОТИНА'], [76.43, 79.6, 'tag', 'БОЛЬШЕ НЕ ЗАСТРЯНЕТ'],
  [79.7, 81.4, 'dark', 'МАГАЗИН', 'ВЕЧЕР'], [83.6, 93.2, 'list', ['ТЕЛЕЖКА'], 1], [87.5, 93.2, 'list', ['ТЕЛЕЖКА', 'КАССА'], 1], [91.1, 93.2, 'list', ['ТЕЛЕЖКА', 'КАССА', 'ОХРАННИК'], 1],
  [93.3, 97.9, 'dark', 'НОЧЬ', 'ПАТРУЛЬ'], [97.97, 99.6, 'big', 'СТОЯТЬ!'], [102.47, 104.1, 'tag', 'ТЫ ЖЕ ГРЕППЛЕР'],
  [104.2, 105.4, 'dark', 'ДОМА', 'ВЕЧЕР'], [105.6, 108.0, 'stamp', 'ПАРТЕР'], [108.3, 109.6, 'tag', '«УЖИНАТЬ!»'], [110.6, 114.7, 'stamp', 'ПАРТЕР'], [111.92, 114.7, 'tag2', 'ЛЮБОВЬ = ЗАХВАТ'],
  [114.8, 117.3, 'dark', '19:00 · СВИДАНИЕ', 'РЕСТОРАН'], [125.3, 130.0, 'quote', '«Я ТОЖЕ ХОДИЛА НА ОДНО ЗАНЯТИЕ»'], [130.83, 136.1, 'stamp', 'ТУРНИР'], [133.4, 136.1, 'tag', 'СЧЁТ НА ДВОИХ'],
  [136.2, 138.0, 'dark', 'УТРО', 'НА СЛЕДУЮЩИЙ ДЕНЬ'], ...FLIST.map((n, i) => [138.2 + i * .62, 146.2, 'flist', i]), [146.4, 150.5, 'score', '13:0']];
function rr(x, y, w, h, r) { ox.beginPath(); ox.moveTo(x + r, y); ox.arcTo(x + w, y, x + w, y + h, r); ox.arcTo(x + w, y + h, x, y + h, r); ox.arcTo(x, y + h, x, y, r); ox.arcTo(x, y, x + w, y, r); ox.closePath(); }
function F(w, s) { return `${w} ${s}px Mont`; }
function drawLabels(t) {
  let tagY = 150; for (const L of LABELS) { const [t0, t1, type, a, b, flag] = L; if (t < t0 || t >= t1) continue; const u = back(seg(t, t0, t0 + .25)), fade = 1 - seg(t, t1 - .15, t1); ox.save(); ox.globalAlpha = fade;
    if (type === 'dark') { ox.font = F(800, 34); const w = Math.max(ox.measureText(a).width, 200) + 110; ox.translate(60 - (1 - u) * 80, 150); rr(0, 0, w, 96, 14); ox.fillStyle = 'rgba(20,20,24,.86)'; ox.fill(); ox.strokeStyle = '#d8322b'; ox.lineWidth = 3; ox.stroke();
      rr(16, 18, 60, 60, 10); ox.fillStyle = '#d8322b'; ox.fill(); ox.fillStyle = '#fff'; ox.beginPath(); ox.moveTo(46, 64); ox.lineTo(32, 42); ox.lineTo(41, 42); ox.lineTo(41, 30); ox.lineTo(51, 30); ox.lineTo(51, 42); ox.lineTo(60, 42); ox.closePath(); ox.fill();
      ox.fillStyle = '#fff'; ox.fillText(a, 92, 48); ox.font = F(700, 22); ox.fillStyle = '#ff8a7a'; ox.fillText(b || '', 92, 78); }
    else if (type === 'tag' || type === 'tag2') { ox.font = F(800, 32); const w = ox.measureText(a).width + 48, y = type === 'tag' ? 280 : 350; ox.translate(type === 'tag' ? 70 : 1010 - w, y); ox.rotate(type === 'tag' ? -.02 : .02); ox.scale(u, u);
      rr(0, 0, w, 58, 8); ox.fillStyle = '#f1ece2'; ox.shadowColor = 'rgba(0,0,0,.35)'; ox.shadowBlur = 14; ox.shadowOffsetY = 4; ox.fill(); ox.shadowColor = 'transparent'; ox.fillStyle = '#1b1b1b'; ox.fillText(a, 24, 41); if (a.startsWith('№')) { ox.fillStyle = '#d8322b'; ox.fillText(a.split(' ')[0], 24, 41); } }
    else if (type === 'stamp') { ox.translate(540, 470); ox.rotate(-.08); const s = lerp(2.2, 1, ei(seg(t, t0, t0 + .14))); ox.scale(s, s); ox.font = F(900, 92); const w = ox.measureText(a).width + 70;
      rr(-w / 2, -66, w, 132, 14); ox.fillStyle = '#ffffff'; ox.fill(); ox.lineWidth = 9; ox.strokeStyle = '#d8322b'; ox.stroke(); ox.fillStyle = '#d8322b'; ox.textAlign = 'center'; ox.fillText(a, 0, 33); }
    else if (type === 'score') { ox.translate(540, 560); ox.scale(u, u); ox.font = F(900, 190); ox.textAlign = 'center'; ox.lineJoin = 'round'; ox.lineWidth = 22; ox.strokeStyle = 'rgba(15,15,18,.92)'; ox.strokeText(a, 0, 60); ox.fillStyle = '#ffd23a'; ox.fillText(a, 0, 60); ox.font = F(900, 40); ox.lineWidth = 10; ox.strokeText('СЧЁТ', 0, -110); ox.fillStyle = '#fff'; ox.fillText('СЧЁТ', 0, -110); }
    else if (type === 'big') { ox.translate(540, 520); const s = lerp(1.5, 1, eo(seg(t, t0, t0 + .2))) * (1 + .02 * Math.sin(t * 30)); ox.scale(s, s); rr(-330, -120, 660, 240, 26); ox.fillStyle = '#c4161c'; ox.shadowColor = '#ff2a2a'; ox.shadowBlur = 60; ox.fill(); ox.shadowBlur = 0; ox.font = F(900, 130); ox.textAlign = 'center'; ox.fillStyle = '#fff'; ox.fillText(a, 0, 46); }
    else if (type === 'list') { a.forEach((s, i) => { ox.save(); const uu = back(seg(t, t0 + (flag ? (i === a.length - 1 ? 0 : -9) : i * .9), t0 + (flag ? (i === a.length - 1 ? .25 : -8.7) : i * .9 + .25))); ox.font = F(800, 32); const txt = (flag ? (i + 1) + '. ' : '') + s, w = ox.measureText(txt).width + 48; ox.translate(70, 280 + i * 70); ox.scale(uu, uu); rr(0, 0, w, 58, 8); ox.fillStyle = '#f1ece2'; ox.shadowColor = 'rgba(0,0,0,.35)'; ox.shadowBlur = 14; ox.fill(); ox.shadowColor = 'transparent'; ox.fillStyle = '#1b1b1b'; ox.fillText(txt, 24, 41); if (flag) { ox.fillStyle = '#d8322b'; ox.fillText((i + 1) + '.', 24, 41); } ox.restore(); }); }
    else if (type === 'flist') { const i = a, s = FLIST[i]; ox.font = F(800, 26); const txt = (i + 1) + '. ' + s, w = ox.measureText(txt).width + 36; ox.translate(60 + (i % 2) * 0, 140 + i * 50); ox.scale(u, u); rr(0, 0, w, 42, 7); ox.fillStyle = '#f1ece2'; ox.shadowColor = 'rgba(0,0,0,.3)'; ox.shadowBlur = 10; ox.fill(); ox.shadowColor = 'transparent'; ox.fillStyle = '#1b1b1b'; ox.fillText(txt, 18, 30); ox.fillStyle = '#d8322b'; ox.fillText((i + 1) + '.', 18, 30); ox.strokeStyle = '#d8322b'; ox.lineWidth = 4; const k = seg(t, t0 + .3, t0 + .5); ox.beginPath(); ox.moveTo(14, 22); ox.lineTo(14 + (w - 28) * k, 22); ox.stroke(); }
    else if (type === 'quote') { ox.translate(540, 300); ox.scale(u, u); ox.font = F(800, 46); const lines = ['«Я ТОЖЕ ХОДИЛА', 'НА ОДНО ЗАНЯТИЕ»']; rr(-420, -90, 840, 190, 22); ox.fillStyle = 'rgba(20,20,24,.88)'; ox.fill(); ox.strokeStyle = '#d8322b'; ox.lineWidth = 4; ox.stroke(); ox.fillStyle = '#fff'; ox.textAlign = 'center'; ox.fillText(lines[0], 0, -10); ox.fillText(lines[1], 0, 52); }
    ox.restore(); } }
function drawCaps(t) { const c = CAPS.find(c => t >= c.t0 && t < c.t1); if (!c) return; const sz = 88; ox.font = F(900, sz); ox.textAlign = 'left'; ox.lineJoin = 'round';
  const words = c.w, lines = []; let cur = [], cw = 0; const sp = ox.measureText(' ').width; for (const w of words) { const ww = ox.measureText(w[0]).width; if (cur.length && cw + sp + ww > 920) { lines.push(cur); cur = []; cw = 0; } cur.push([w, ww]); cw += (cur.length > 1 ? sp : 0) + ww; } lines.push(cur);
  const pop = back(seg(t, c.t0, c.t0 + .12)), lh = sz * .98, y0 = 1270 - (lines.length - 1) * lh / 2; ox.save(); ox.translate(540, y0); ox.scale(pop, pop);
  lines.forEach((ln, li) => { const tw = ln.reduce((a, [, w], i) => a + w + (i ? sp : 0), 0); let x = -tw / 2; ln.forEach(([w, ww]) => { const said = t >= w[1]; const col = w[2] === 'r' ? '#ff3b2f' : w[2] === 'y' ? '#ffd23a' : '#ffffff';
      ox.shadowColor = 'rgba(0,0,0,.55)'; ox.shadowBlur = 18; ox.shadowOffsetY = 6; ox.lineWidth = 12; ox.strokeStyle = 'rgba(12,12,14,.9)'; ox.strokeText(w[0], x, li * lh); ox.shadowColor = 'transparent'; ox.fillStyle = said ? col : 'rgba(150,150,155,1)'; ox.fillText(w[0], x, li * lh); x += ww + sp; }); });
  ox.restore(); }
function vignette() { const g = ox.createRadialGradient(540, 960, 500, 540, 960, 1250); g.addColorStop(0, 'rgba(0,0,0,0)'); g.addColorStop(1, 'rgba(0,0,0,.38)'); ox.fillStyle = g; ox.fillRect(0, 0, W, H); }

// ---------- frame ----------
const CUTS = SC.map(s => s.t0);
window.render = function (f) {
  const t = f / FPS; let k = 0; for (let i = 0; i < SC.length; i++) if (t >= SC[i].t0) k = i; const sc = SC[k];
  sets.forEach(s => s.visible = s === sc.set); ALL.forEach(c => c.root.visible = false); HERO.root.visible = true;
  if (HERO.tail1) { HERO.tail1.visible = HERO.tail2.visible = true; } HERO.head.children.forEach(m => m.visible = true);
  light(sc.L); const cm = sc.run(t);
  let sx = 0, sy = 0; for (const ti of IMP) { const d = t - ti; if (d >= 0 && d < .35) { const q = (.35 - d) / .35; sx += nz(f, 1) * .06 * q; sy += nz(f, 2) * .05 * q; } }
  const hand = .012, kk = cm.k ?? 1.75; const pp = cm.p.map((v, i) => cm.l[i] + (v - cm.l[i]) * kk); pp[1] = Math.max(pp[1], .22); cam.position.set(pp[0] + Math.sin(t * 1.3) * hand + sx, pp[1] + Math.sin(t * 1.7) * hand + sy, pp[2]); cam.fov = cm.f; cam.updateProjectionMatrix(); cam.lookAt(cm.l[0] + sx * .5, cm.l[1] + sy * .5, cm.l[2]);
  drawFX(t); R.render(S, cam);
  ox.clearRect(0, 0, W, H); ox.drawImage(glc, 0, 0); vignette(); drawLabels(t); drawCaps(t);
  const cutFlash = CUTS.some(c => t >= c && t < c + 1 / FPS) && t > .1; if (cutFlash) { ox.fillStyle = 'rgba(255,255,255,.12)'; ox.fillRect(0, 0, W, H); }
  return out.toDataURL('image/jpeg', .95);
};
window.IMPACTS = IMP; window.ready = true;
