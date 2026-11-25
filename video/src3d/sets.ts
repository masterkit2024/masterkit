import * as THREE from "three";
import { box, cyl, sphere, plane, group, toon, canvasTex, gridTex, repeatTex, Card, Char, makeLights, CamState, V, LightPreset } from "./engine";
import { PAL } from "./draw2d";
import { T } from "../src/timing";

// ---------- math ----------
export const clamp = (v: number, a = 0, b = 1) => Math.max(a, Math.min(b, v));
export const lerp = (a: number, b: number, k: number) => a + (b - a) * k;
export const pr = (t: number, a: number, d: number) => clamp((t - a) / d);
export const eo = (k: number) => 1 - Math.pow(1 - k, 3);
export const ei = (k: number) => k * k * k;
export const eio = (k: number) => (k < 0.5 ? 4 * k * k * k : 1 - Math.pow(-2 * k + 2, 3) / 2);
export const eob = (k: number) => { const c1 = 1.70158, c3 = c1 + 1; return 1 + c3 * Math.pow(k - 1, 3) + c1 * Math.pow(k - 1, 2); };
export const rnd = (i: number) => { const x = Math.sin(i * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); };
const lv = (a: THREE.Vector3, b: THREE.Vector3, k: number) => a.clone().lerp(b, k);
const shakeV = (t: number, amp: number) => { const f = Math.floor(t * 30); return V((rnd(f) - 0.5) * amp, (rnd(f + 77) - 0.5) * amp, 0); };
/** camera key interpolation: keys [time, pos, look, fov?] with eased glides */
type Key = { t: number; pos: THREE.Vector3; look: THREE.Vector3; fov?: number; focus?: number; blur?: number; range?: number; roll?: number; glide?: number };
const camKeys = (t: number, keysIn: Key[]): CamState => {
  const keys = keysIn.map((k) => ({ ...k, fov: (k.fov ?? 40) + 10 }));
  let i = 0;
  while (i < keys.length - 1 && t >= keys[i + 1].t) i++;
  const a = keys[i], b = keys[i + 1];
  if (!b) return { pos: a.pos.clone(), look: a.look.clone(), fov: a.fov ?? 40, focus: a.focus, blur: a.blur ?? 0, range: a.range ?? 4, roll: a.roll ?? 0 };
  const d = b.glide ?? b.t - a.t;
  const k = eio(pr(t, b.t - d, d));
  const k0 = t < b.t - d ? 0 : k;
  return {
    pos: lv(a.pos, b.pos, k0), look: lv(a.look, b.look, k0), fov: lerp(a.fov ?? 40, b.fov ?? 40, k0),
    focus: lerp(a.focus ?? 6, b.focus ?? 6, k0), blur: lerp(a.blur ?? 0, b.blur ?? 0, k0), range: lerp(a.range ?? 4, b.range ?? 4, k0), roll: lerp(a.roll ?? 0, b.roll ?? 0, k0),
  };
};

export interface Set3D { scene: THREE.Scene; update: (t: number) => { cam: CamState; post?: { sat?: number; bright?: number } } }

const newScene = (preset: LightPreset, bg?: string, fogNear = 25, fogFar = 300) => {
  const s = new THREE.Scene();
  const L = makeLights(preset);
  s.add(L.group);
  s.background = new THREE.Color(bg ?? L.bg);
  s.fog = new THREE.Fog(bg ?? L.fog, fogNear, fogFar);
  return { s, L };
};

// ---------- text card helper ----------
const textCard = (text: string, opts: { w?: number; h?: number; color?: string; bg?: string; size?: number; stroke?: string } = {}) => {
  const c = new Card(opts.w ?? 2, opts.h ?? 0.5, 768, "none");
  const draw = (txt: string, color = opts.color ?? "#fff", bg = opts.bg) =>
    c.draw((ctx, w, h) => {
      if (bg) { ctx.fillStyle = PAL.plum; ctx.beginPath(); ctx.roundRect(4, 4, w - 8, h - 8, h * 0.22); ctx.fill(); ctx.fillStyle = bg; ctx.beginPath(); ctx.roundRect(14, 14, w - 28, h - 28, h * 0.18); ctx.fill(); }
      ctx.font = `800 ${Math.round(h * (opts.size ?? 0.55))}px Montserrat`;
      ctx.textAlign = "center"; ctx.textBaseline = "middle";
      if (!bg) { ctx.lineWidth = h * 0.12; ctx.strokeStyle = opts.stroke ?? PAL.plum; ctx.lineJoin = "round"; ctx.strokeText(txt, w / 2, h / 2 + h * 0.03); }
      ctx.fillStyle = color; ctx.fillText(txt, w / 2, h / 2 + h * 0.03);
    });
  draw(text);
  return { card: c, draw };
};

// ====================================================================
// KITCHEN (S1, S11)
// ====================================================================
const plankTex = () => repeatTex(canvasTex(512, 512, (ctx, w, h) => {
  ctx.fillStyle = "#c08a5a"; ctx.fillRect(0, 0, w, h);
  for (let i = 0; i < 8; i++) { ctx.fillStyle = i % 2 ? "#b98252" : "#c69262"; ctx.fillRect(0, (i * h) / 8, w, h / 8 - 4); ctx.fillStyle = "#8c5d38"; ctx.fillRect(0, ((i + 1) * h) / 8 - 4, w, 4); ctx.fillRect(((i * 197) % w), (i * h) / 8, 4, h / 8); }
}), 4, 4);
const tileTex = (a: string, b: string, n = 8) => canvasTex(512, 512, (ctx, w, h) => {
  ctx.fillStyle = b; ctx.fillRect(0, 0, w, h); ctx.fillStyle = a;
  for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) ctx.fillRect((i * w) / n + 3, (j * h) / n + 3, w / n - 6, h / n - 6);
});

const house = (x: number, z: number, wdt: number, hgt: number, col: string, roof: string, rot = 0) => {
  const g = new THREE.Group();
  g.add(box(wdt, hgt, 5, col, { pos: [0, hgt / 2, 0] }));
  g.add(box(wdt + 0.4, 0.4, 5.4, "#ece3d0", { pos: [0, 0.2, 0] }));
  g.add(box(wdt + 0.5, 0.35, 5.5, roof, { pos: [0, hgt + 0.17, 0] }));
  g.add(box(0.6, 1.2, 0.6, roof, { pos: [wdt * 0.3, hgt + 0.9, -1] }));
  const rows = Math.floor((hgt - 1.6) / 1.4);
  for (let r = 0; r < rows; r++) for (let c = 0; c < Math.max(2, Math.floor(wdt / 1.6)); c++) {
    const nx = Math.max(2, Math.floor(wdt / 1.6));
    g.add(box(0.7, 0.9, 0.08, (r + c) % 3 === 0 ? "#ffe08a" : "#2f3d6b", { pos: [-wdt / 2 + (c + 0.5) * (wdt / nx), 1.6 + r * 1.4 + 0.5, 2.52], shadow: false }));
  }
  g.position.set(x, 0, z); g.rotation.y = rot;
  return g;
};
const HOUSE_COLS = [["#b5523b", "#6e2f24"], ["#efd9b0", "#8a4a3a"], ["#d9a441", "#7a4a2a"], ["#c9683f", "#5a3a2a"], ["#8fb3c9", "#4a4f6e"]];
const HEIGHTS = [7, 8.4, 9.8];

export const kitchenSet = (which: "s1" | "s11"): Set3D => {
  const { s } = newScene("indoor", "#9cc3ec", 30, 120);
  const plank = plankTex();
  s.add(plane(12, 10, "#fff", { pos: [0, 0, 0], rot: [-Math.PI / 2, 0, 0], mat: new THREE.MeshToonMaterial({ map: plank, gradientMap: (toon("#fff") as any).gradientMap }), shadow: false }));
  const wallC = "#efd9b0";
  s.add(box(5.8, 3.6, 0.2, wallC, { pos: [-1.6, 1.8, -3.1] }));
  s.add(box(1.8, 3.6, 0.2, wallC, { pos: [3.6, 1.8, -3.1] }));
  s.add(box(1.4, 1.3, 0.2, wallC, { pos: [2.0, 0.65, -3.1] }));
  s.add(box(1.4, 1.0, 0.2, wallC, { pos: [2.0, 3.1, -3.1] }));
  s.add(box(0.2, 3.6, 8, "#e5c48f", { pos: [-4.6, 1.8, 0.8] }));
  s.add(box(10, 0.2, 9, "#f4ead6", { pos: [0, 3.7, 0.9] }));
  s.add(box(0.2, 3.6, 8, "#e5c48f", { pos: [4.6, 1.8, 0.8] }));
  // tiles band
  const tt = repeatTex(tileTex("#8fc1d4", "#e8f1f4", 6), 6, 1);
  s.add(box(5.6, 0.7, 0.04, "#fff", { pos: [-1.7, 1.25, -2.98], mat: new THREE.MeshToonMaterial({ map: tt, gradientMap: (toon("#fff") as any).gradientMap }), shadow: false }));
  // window frame
  const fr = "#fafafa";
  s.add(box(1.6, 0.1, 0.3, fr, { pos: [2.0, 1.3, -3.0] }), box(1.6, 0.1, 0.3, fr, { pos: [2.0, 2.6, -3.0] }), box(0.1, 1.4, 0.3, fr, { pos: [1.3, 1.95, -3.0] }), box(0.1, 1.4, 0.3, fr, { pos: [2.7, 1.95, -3.0] }), box(0.06, 1.3, 0.1, fr, { pos: [2.0, 1.95, -3.0] }), box(1.4, 0.06, 0.1, fr, { pos: [2.0, 2.0, -3.0] }));
  s.add(box(1.8, 0.08, 0.4, fr, { pos: [2.0, 1.27, -2.85] }));
  // outside
  s.add(plane(60, 40, "#9a9aa8", { pos: [0, 0.45, -24], rot: [-Math.PI / 2, 0, 0], shadow: false }));
  [[-4, "#b5523b"], [3, "#d9a441"], [9, "#efd9b0"]].forEach(([x, c], i) => s.add(house(x as number, -14, 5, HEIGHTS[i], c as string, "#5a3a2a")));
  s.add(cyl(0.12, 0.15, 1.6, "#6b4a2a", { pos: [-0.5, 1.25, -7] }), sphere(1.1, "#5aa84a", { pos: [-0.5, 2.6, -7] }));
  // cabinets & counter
  s.add(box(2.4, 0.8, 0.5, "#d9774b", { pos: [-2.7, 2.75, -2.75] }));
  s.add(box(0.04, 0.6, 0.02, "#fff", { pos: [-2.7, 2.75, -2.49] }));
  s.add(box(3.2, 0.92, 0.65, "#7c9cbf", { pos: [-2.8, 0.46, -2.65] }), box(3.3, 0.06, 0.75, "#e9e2d2", { pos: [-2.8, 0.95, -2.62] }));
  // table
  s.add(box(2.4, 0.08, 1.1, "#8a5a3b", { pos: [0.8, 0.9, -1.5] }));
  [[-0.3, -1.0], [1.9, -1.0], [-0.3, -2.0], [1.9, -2.0]].forEach(([x, z]) => s.add(box(0.08, 0.86, 0.08, "#6b4229", { pos: [x, 0.43, z] })));
  // kettle
  const kettle = new THREE.Group();
  const lathe = new THREE.LatheGeometry([new THREE.Vector2(0.001, 0), new THREE.Vector2(0.2, 0), new THREE.Vector2(0.2, 0.03), new THREE.Vector2(0.17, 0.3), new THREE.Vector2(0.09, 0.34), new THREE.Vector2(0.001, 0.36)], 32);
  const kb = new THREE.Mesh(lathe, toon("#C9CED6")); kb.castShadow = true; kb.userData.g = "ink"; kettle.add(kb);
  kettle.add(cyl(0.03, 0.05, 0.24, "#C9CED6", { pos: [-0.24, 0.18, 0], rot: [0, 0, 0.9] }));
  const handle = new THREE.Mesh(new THREE.TorusGeometry(0.12, 0.025, 8, 24, Math.PI), toon("#8f96a3")); handle.position.set(0.17, 0.2, 0); handle.rotation.z = -Math.PI / 2; handle.userData.g = "ink"; kettle.add(handle);
  kettle.add(cyl(0.05, 0.05, 0.04, "#8f96a3", { pos: [0, 0.37, 0] }));
  const lamp = sphere(0.025, "#ff4d4d", { pos: [0.05, 0.08, 0.19], mat: new THREE.MeshBasicMaterial({ color: "#ff3030" }) }); kettle.add(lamp);
  kettle.add(cyl(0.22, 0.22, 0.03, "#5e6573", { pos: [0, 0.015, 0] }));
  kettle.position.set(1.4, 0.94, -1.5);
  s.add(kettle);
  const steam = [0, 1, 2, 3].map(() => { const m = sphere(0.06, "#ffffff", { ink: "hide", mat: new THREE.MeshBasicMaterial({ color: "#ffffff", transparent: true, opacity: 0.85 }) }); s.add(m); return m; });
  // wall clock
  s.add(cyl(0.36, 0.36, 0.08, "#4a4f7a", { pos: [-1.2, 2.45, -2.96], rot: [Math.PI / 2, 0, 0] }));
  const clock = new Card(0.66, 0.66, 256, "none");
  clock.mesh.position.set(-1.2, 2.45, -2.91); s.add(clock.mesh);
  const drawClock = (hour: number, minute: number) => clock.draw((ctx, w) => {
    ctx.fillStyle = "#fff"; ctx.beginPath(); ctx.arc(w / 2, w / 2, w * 0.48, 0, 7); ctx.fill();
    ctx.strokeStyle = "#1E2342"; ctx.lineCap = "round";
    for (let i = 0; i < 12; i++) { const a = (i / 12) * Math.PI * 2; ctx.lineWidth = 6; ctx.beginPath(); ctx.moveTo(w / 2 + Math.cos(a) * w * 0.38, w / 2 + Math.sin(a) * w * 0.38); ctx.lineTo(w / 2 + Math.cos(a) * w * 0.44, w / 2 + Math.sin(a) * w * 0.44); ctx.stroke(); }
    const hand = (deg: number, len: number, lw: number) => { const a = ((deg - 90) * Math.PI) / 180; ctx.lineWidth = lw; ctx.beginPath(); ctx.moveTo(w / 2, w / 2); ctx.lineTo(w / 2 + Math.cos(a) * len, w / 2 + Math.sin(a) * len); ctx.stroke(); };
    hand(hour, w * 0.24, 14); hand(minute, w * 0.36, 9);
    ctx.fillStyle = PAL.red; ctx.beginPath(); ctx.arc(w / 2, w / 2, 9, 0, 7); ctx.fill();
  });
  // button on pedestal
  const ped = group(cyl(0.16, 0.2, 1.0, "#8a90c8", { pos: [0, 0.5, 0] }), cyl(0.24, 0.24, 0.06, "#5b62a0", { pos: [0, 1.02, 0] }));
  const btnBase = cyl(0.2, 0.2, 0.06, "#B02A2A", { pos: [0, 1.08, 0] });
  const btn = cyl(0.17, 0.17, 0.08, PAL.red, { pos: [0, 1.14, 0] });
  const btnIcon = new Card(0.24, 0.24, 128, "none");
  btnIcon.draw((ctx, w) => { ctx.strokeStyle = "#fff"; ctx.lineWidth = 10; ctx.lineCap = "round"; ctx.beginPath(); ctx.arc(w / 2, w / 2, w * 0.38, 0, 7); ctx.moveTo(w / 2, w / 2); ctx.lineTo(w / 2, w * 0.24); ctx.moveTo(w / 2, w / 2); ctx.lineTo(w * 0.7, w / 2); ctx.stroke(); });
  btnIcon.mesh.rotation.x = -Math.PI / 2;
  const btnTop = group(btn, btnIcon.mesh); btnIcon.mesh.position.set(0, 1.185, 0);
  ped.add(btnBase, btnTop);
  ped.position.set(0.15, 0, 0.9);
  if (which === "s1") s.add(ped);
  // characters
  const hero = new Char(1.8, 900); s.add(hero.root);
  const man = new Char(1.75, 256); s.add(man.root);

  return {
    scene: s,
    update: (t) => {
      const frozen = which === "s11" && t >= T.freeze11;
      const tt = frozen ? T.freeze11 : t;
      // steam
      const steamK = which === "s11" ? (t >= T.tea11 ? 2.2 : 1.0) : 0.5;
      steam.forEach((m, i) => {
        const ph = ((tt * 0.6 * steamK) + i / 4) % 1;
        m.position.set(1.4 - 0.3 - ph * 0.15 + Math.sin(ph * 6 + i) * 0.04, 1.3 + ph * 0.9 * steamK, -1.5);
        m.scale.setScalar(0.6 + ph * 1.8 * Math.min(1.5, steamK));
        (m.material as THREE.MeshBasicMaterial).opacity = (1 - ph) * 0.85;
      });
      kettle.position.x = 1.4 + (which === "s11" && !frozen ? Math.sin(t * 70) * (t >= T.tea11 ? 0.012 : 0.004) : 0);
      lamp.visible = !(which === "s11" && t >= T.tea11);
      man.set({ x: 2.3, y: 0.45, z: -6.5, gray: true, pose: which === "s11" && t >= T.back11 ? "lost" : "holdcone", hand: "coneEmpty", t: tt, face: which === "s11" && t >= T.back11 ? "scream" : "neutral", shadow: false });
      if (which === "s1") {
        const spin = pr(t, T.tired1, 0.5);
        drawClock(eio(spin) * 150, eio(spin) * 360 * 5);
        const p = pr(t, T.press1, 0.3);
        const ps = p <= 0 || p >= 1 ? 1 : p < 0.33 ? lerp(1, 0.4, p / 0.33) : p < 0.66 ? lerp(0.4, 1.2, (p - 0.33) / 0.33) : lerp(1.2, 1, (p - 0.66) / 0.34);
        btnTop.scale.set(1, ps, 1); btnTop.position.y = (1 - ps) * -1.1;
        hero.set({ x: -1.1, z: -0.2, pose: t >= T.tired1 ? "tired" : "idle", t, });
        const cam = camKeys(t, [
          { t: 0, pos: V(0.2, 1.7, 6.4), look: V(0.1, 1.35, -1), fov: 40, focus: 6.5, blur: 0 },
          { t: T.press1 + 0.4, pos: V(0.15, 1.6, 5.9), look: V(0.0, 1.3, -1), fov: 40, focus: 6.0, blur: 0, glide: 1.5 },
          { t: T.tired1, pos: V(-0.6, 1.7, 4.6), look: V(-0.9, 1.45, -0.5), fov: 40, focus: 4.9, blur: 12, range: 3, roll: -3, glide: 0.6 },
          { t: T.s2, pos: V(-0.7, 1.72, 4.3), look: V(-0.95, 1.5, -0.5), fov: 40, focus: 4.6, blur: 13, range: 3, roll: -4, glide: T.s2 - T.tired1 - 0.6 },
        ]);
        const ring = pr(t, T.press1 + 0.05, 0.6);
        return { cam, post: { bright: 1 - 0.2 * clamp(ring * 1.2) } };
      }
      // S11
      drawClock(150 + (t - T.s11) * 2, (t - T.s11) * 24);
      const ek = eo(pr(t, T.s11, 1.1));
      const palm = t >= T.palm11 && t < T.palm11 + 3.2;
      hero.set({ x: lerp(-4.2, -1.1, ek), z: -0.2, pose: t < T.s11 + 1.1 ? "walk" : palm ? "facepalm" : "tired", t: tt, stubble: clamp((t - T.you11) / 1), bags: t >= T.you11 });
      const cam = camKeys(tt, [
        { t: T.s11, pos: V(-1.2, 1.6, 5.4), look: V(-1.2, 1.3, -1), fov: 40, focus: 5.5 },
        { t: T.world11, pos: V(0.2, 1.7, 6.4), look: V(0.1, 1.35, -1), fov: 40, focus: 6.5, glide: 2.5 },
        { t: T.you11, pos: V(-0.6, 1.72, 4.4), look: V(-0.95, 1.5, -0.5), fov: 40, focus: 4.6, blur: 12, range: 3, glide: 0.5 },
        { t: T.back11, pos: V(-0.6, 1.72, 4.4), look: V(-0.95, 1.5, -0.5), fov: 40, focus: 4.6, blur: 12, range: 3, glide: 0.01 },
        { t: T.palm11 + 1, pos: V(-0.9, 1.75, 3.6), look: V(-1.05, 1.6, -0.5), fov: 40, focus: 3.8, blur: 14, range: 2.5, glide: 1.5 },
        { t: T.tea11, pos: V(0.2, 1.7, 6.4), look: V(0.1, 1.35, -1), fov: 40, focus: 6.5, blur: 0, glide: 0.6 },
      ]);
      return { cam };
    },
  };
};

// ====================================================================
// LAB (S2, S3, S5, S6)
// ====================================================================
const labBase = () => {
  const { s } = newScene("lab", "#0F1226", 20, 80);
  const ft = repeatTex(gridTex("#1B1F3D", "#3a4380", 4, 6), 20, 20);
  s.add(plane(80, 80, "#fff", { rot: [-Math.PI / 2, 0, 0], shadow: false, mat: new THREE.MeshToonMaterial({ map: ft, gradientMap: (toon("#fff") as any).gradientMap }) }));
  const wt = repeatTex(gridTex("#20264a", "#2f3870", 4, 5), 20, 6);
  s.add(plane(80, 24, "#fff", { pos: [0, 12, -8], shadow: false, mat: new THREE.MeshToonMaterial({ map: wt, gradientMap: (toon("#fff") as any).gradientMap }) }));
  s.add(box(80, 0.12, 0.12, PAL.yellow, { pos: [0, 0.06, -7.9], mat: new THREE.MeshBasicMaterial({ color: PAL.yellow }) }));
  return s;
};

export const labS2 = (): Set3D => {
  const s = labBase();
  const hero = new Char(1.8, 900); s.add(hero.root);
  return {
    scene: s,
    update: (t) => {
      hero.set({ x: 0, z: 0, pose: "shock", t });
      const cam = camKeys(t, [
        { t: T.s2, pos: V(0, 0.9, 4.6), look: V(0, 1.4, 0), fov: 40, focus: 4.6, blur: 8, range: 3 },
        { t: T.s3, pos: V(0, 1.0, 3.9), look: V(0, 1.45, 0), fov: 40, focus: 3.9, blur: 10, range: 3, roll: 3 },
      ]);
      const sh = t >= T.stamp2 && t < T.stamp2 + 0.2 ? shakeV(t, 0.06) : V(0, 0, 0);
      cam.pos.add(sh); cam.look.add(sh);
      return { cam };
    },
  };
};

export const labS3 = (): Set3D => {
  const s = labBase();
  const hero = new Char(1.8, 900); s.add(hero.root);
  const waveMat = new THREE.MeshToonMaterial({ color: PAL.blue, emissive: "#1d6f8a", gradientMap: (toon("#fff") as any).gradientMap });
  const wave = new THREE.Mesh(new THREE.BufferGeometry(), waveMat); wave.userData.g = "ink"; wave.castShadow = true; s.add(wave);
  const label = textCard("200 Гц · ГОЛОС", { w: 2.6, h: 0.4, color: "#fff" });
  label.card.mesh.position.set(1.0, 2.25, 0); s.add(label.card.mesh);
  const ear = new Card(0.6, 0.6, 256, "full");
  ear.draw((ctx, w) => {
    ctx.fillStyle = PAL.plum; ctx.beginPath(); ctx.arc(w / 2, w / 2, w * 0.48, 0, 7); ctx.fill();
    ctx.fillStyle = "#1E2342"; ctx.beginPath(); ctx.arc(w / 2, w / 2, w * 0.43, 0, 7); ctx.fill();
    ctx.save(); ctx.translate(w / 2, w / 2); ctx.scale(w / 160, w / 160);
    ctx.strokeStyle = "#fff"; ctx.lineWidth = 10; ctx.lineCap = "round";
    ctx.stroke(new Path2D("M -18 40 Q -40 40 -36 10 Q -40 -40 0 -44 Q 36 -44 34 -8 Q 32 14 12 22 Q 0 28 4 44")); ctx.lineWidth = 8; ctx.stroke(new Path2D("M -8 -4 Q -4 -22 12 -18"));
    ctx.strokeStyle = PAL.red; ctx.lineWidth = 14; ctx.beginPath(); ctx.moveTo(-52, 52); ctx.lineTo(52, -52); ctx.stroke(); ctx.restore();
  });
  s.add(ear.mesh);
  let lastLabel = "";
  return {
    scene: s,
    update: (t) => {
      const deaf = t >= T.deaf3;
      hero.set({ x: -1.5, z: 0, pose: deaf ? "deaf" : "idle", t });
      const comp = eio(pr(t, T.slow3, 0.6));
      const periods = lerp(8, 1, comp), flat = eo(pr(t, T.deaf3, 0.3));
      const amp = 0.38 * (1 - flat) * eo(pr(t, T.s3 + 0.2, 0.4));
      const speed = lerp(3.2, 0.3, comp);
      const pts: THREE.Vector3[] = [];
      for (let i = 0; i <= 160; i++) {
        const k = i / 160; const env = Math.min(1, k * 8, (1 - k) * 8);
        pts.push(new THREE.Vector3(lerp(-0.6, 2.6, k), 1.35 + Math.sin(k * periods * Math.PI * 2 + t * speed * Math.PI * 2) * amp * env, 0));
      }
      wave.geometry.dispose();
      wave.geometry = new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 220, 0.045, 8, false);
      const lab = t >= T.slow3 + 0.3 ? "2 Гц · ИНФРАЗВУК" : "200 Гц · ГОЛОС";
      if (lab !== lastLabel) { label.draw(lab, t >= T.slow3 + 0.3 ? PAL.red : "#fff"); lastLabel = lab; }
      label.card.mesh.visible = t >= T.s3 + 0.3;
      ear.mesh.visible = deaf;
      ear.mesh.position.set(-1.5, 2.25, 0.1); ear.mesh.scale.setScalar(eob(pr(t, T.deaf3, 0.15)) + 0.001);
      const cam = camKeys(t, [
        { t: T.s3, pos: V(0.4, 1.5, 7.2), look: V(0.4, 1.4, 0), fov: 40, focus: 7.2 },
        { t: T.slow3, pos: V(0.6, 1.45, 6.4), look: V(0.6, 1.4, 0), fov: 40, focus: 6.4, glide: T.slow3 - T.s3 - 0.5 },
        { t: T.deaf3, pos: V(-1.0, 1.6, 4.4), look: V(-1.2, 1.55, 0), fov: 40, focus: 4.4, blur: 12, range: 2.5, glide: 0.5 },
        { t: T.s4, pos: V(-1.15, 1.65, 3.9), look: V(-1.3, 1.6, 0), fov: 40, focus: 3.9, blur: 13, range: 2.5, roll: -3, glide: T.s4 - T.deaf3 - 0.5 },
      ]);
      return { cam };
    },
  };
};

export const labS5 = (): Set3D => {
  const s = labBase();
  // shaft
  const SX = -2.3, SH = 7;
  [[-0.7, -0.7], [0.7, -0.7], [-0.7, 0.7], [0.7, 0.7]].forEach(([dx, dz]) => s.add(box(0.12, SH, 0.12, "#4a5290", { pos: [SX + dx, SH / 2, dz] })));
  s.add(box(1.4, SH, 0.06, "#1E2342", { pos: [SX, SH / 2, -0.7] }));
  for (let i = 1; i < 7; i++) s.add(box(1.5, 0.05, 0.05, "#4a5290", { pos: [SX, i, 0.7] }));
  s.add(box(1.7, 0.12, 1.7, "#4a5290", { pos: [SX, SH, 0] }));
  s.add(box(1.4, 0.35, 1.4, "#3fbf6a", { pos: [SX, 0.17, 0] }));
  const lbl31 = textCard("31 м", { w: 1.2, h: 0.45, color: PAL.yellow }); lbl31.card.mesh.position.set(SX - 1.2, 3.6, 0.2); s.add(lbl31.card.mesh);
  s.add(box(0.04, SH, 0.04, "#9AA0B5", { pos: [SX - 1.2 + 0.55, SH / 2, 0] }));
  // bars
  const barG = box(1, 0.42, 0.3, "#9AA0B5"); const barR = box(1, 0.42, 0.3, PAL.red);
  s.add(barG, barR);
  const lG = textCard("ПО ЧАСАМ", { w: 2.0, h: 0.32, color: "#cfd3e0" }); lG.card.mesh.position.set(0.55, 5.95, 0); s.add(lG.card.mesh);
  const lR = textCard("ПО ОЩУЩЕНИЮ", { w: 2.4, h: 0.32, color: "#ff8080" }); lR.card.mesh.position.set(0.75, 5.0, 0); s.add(lR.card.mesh);
  const third = textCard("≈ +⅓", { w: 1.8, h: 0.6, color: "#fff" }); third.card.mesh.position.set(3.1, 4.5, 0.3); s.add(third.card.mesh);
  // display
  s.add(box(1.9, 1.05, 0.25, "#111", { pos: [1.6, 2.85, 0] }));
  s.add(box(0.12, 2.3, 0.12, "#4a5290", { pos: [1.6, 1.15, -0.05] }));
  const screen = new Card(1.6, 0.8, 256, "none"); screen.mesh.position.set(1.6, 2.85, 0.13); s.add(screen.mesh);
  const tempo = textCard("✓ ОБЫЧНЫЙ ТЕМП", { w: 2.6, h: 0.34, color: "#cfd3e0" }); tempo.card.mesh.position.set(1.6, 3.65, 0.1); s.add(tempo.card.mesh);
  // brain
  const brain = new THREE.Group();
  [[-0.35, 0, 0.3], [-0.1, 0.18, 0.35], [0.25, 0.08, 0.33], [0.36, -0.15, 0.27], [0, -0.18, 0.3], [-0.3, -0.2, 0.25]].forEach(([x, y, r]) => brain.add(sphere(r, PAL.pink, { pos: [x, y, 0] })));
  brain.position.set(1.6, 0.9, 0.6); s.add(brain);
  const mem = textCard("ПАМЯТЬ", { w: 1.6, h: 0.4, color: "#fff" }); mem.card.mesh.position.set(1.6, 0.9, 1.05); s.add(mem.card.mesh);
  const hero = new Char(1.1, 640); s.add(hero.root);
  let lastD = "";
  return {
    scene: s,
    update: (t) => {
      const fk = pr(t, T.drop5, 1.2);
      const y = t < T.drop5 ? SH + 0.06 : lerp(SH + 0.06, 0.35, ei(fk));
      hero.set({ x: SX, y, z: 0.1, pose: t >= T.drop5 ? (fk < 1 ? "fall" : "shock") : "idle", t, shadow: false });
      const g = eo(pr(t, T.bars5, 0.6));
      barG.scale.x = 2.2 * g + 0.001; barG.position.set(-0.4 + 1.1 * g, 5.6, 0);
      barR.scale.x = 2.95 * g + 0.001; barR.position.set(-0.4 + 1.475 * g, 4.65, 0);
      third.card.mesh.visible = g > 0.95;
      const disp = t >= T.digits5;
      const d = disp ? ["3", "8", "1"][Math.floor((t - T.digits5) / 0.5) % 3] : "-";
      if (d !== lastD) { lastD = d; screen.draw((ctx, w, h) => { ctx.fillStyle = "#000"; ctx.fillRect(0, 0, w, h); ctx.font = `800 ${h * 0.8}px Inter`; ctx.textAlign = "center"; ctx.textBaseline = "middle"; ctx.fillStyle = disp ? PAL.yellow : "#333"; ctx.fillText(disp ? d : "8", w / 2, h / 2 + 6); }); }
      tempo.card.mesh.visible = t >= T.digits5 + 0.2;
      const bs = t < T.memIn5 ? 0.001 : eob(pr(t, T.memIn5, 0.25)) * (t >= T.mem5 ? 1 + 0.15 * Math.sin(pr(t, T.mem5, 0.5) * Math.PI) : 1);
      brain.scale.setScalar(bs); mem.card.mesh.scale.setScalar(bs);
      const cam = camKeys(t, [
        { t: T.s5, pos: V(0.2, 3.7, 14.5), look: V(0.2, 3.5, 0), fov: 40, focus: 14 },
        { t: T.drop5, pos: V(-1.2, 4.4, 11.5), look: V(-1.6, 4.0, 0), fov: 40, focus: 11.5, glide: 2.5 },
        { t: T.drop5 + 1.3, pos: V(-1.3, 2.2, 10.5), look: V(-1.7, 1.6, 0), fov: 40, focus: 10.5, glide: 1.2 },
        { t: T.bars5, pos: V(1.0, 4.8, 9.5), look: V(1.0, 4.9, 0), fov: 40, focus: 9.5, glide: 1.0 },
        { t: T.digits5, pos: V(1.4, 3.3, 8.5), look: V(1.4, 3.3, 0), fov: 40, focus: 8.5, glide: 0.7 },
        { t: T.memIn5, pos: V(1.3, 2.2, 7.8), look: V(1.4, 2.0, 0), fov: 40, focus: 7.4, blur: 6, glide: 0.6 },
        { t: T.s6, pos: V(1.4, 1.9, 6.6), look: V(1.5, 1.6, 0), fov: 40, focus: 6.0, blur: 8, glide: T.s6 - T.memIn5 - 0.6 },
      ]);
      return { cam };
    },
  };
};

export const labS6 = (): Set3D => {
  const s = labBase();
  // stamps (3 cards)
  const stampDraw = (c: Card) => c.draw((ctx, w, h) => {
    ctx.fillStyle = PAL.plum; ctx.beginPath(); ctx.roundRect(0, 0, w, h, 20); ctx.fill();
    ctx.fillStyle = PAL.red; ctx.beginPath(); ctx.roundRect(8, 8, w - 16, h - 16, 16); ctx.fill();
    ctx.strokeStyle = "#fff"; ctx.lineWidth = 12; ctx.beginPath(); ctx.roundRect(28, 28, w - 56, h - 56, 10); ctx.stroke();
    ctx.font = `800 ${h * 0.5}px Montserrat`; ctx.fillStyle = "#fff"; ctx.textAlign = "center"; ctx.textBaseline = "middle"; ctx.fillText("НЕЛЬЗЯ", w / 2, h / 2 + 6);
  });
  const stamps = [0, 1, 2].map((i) => { const c = new Card(2.6, 0.75, 512, "none"); stampDraw(c); c.mesh.position.set((i - 1) * 0.08, 2.7 + (i - 1) * 0.38, 0.5 + i * 0.02); c.mesh.rotation.z = -0.14 + (i - 1) * 0.06; s.add(c.mesh); return c; });
  const shards = Array.from({ length: 22 }).map((_, i) => {
    const g = new THREE.BufferGeometry(); const a = 0.15 + rnd(i) * 0.2;
    g.setAttribute("position", new THREE.Float32BufferAttribute([0, 0, 0, a, 0.05, 0, 0.05, a * 0.9, 0], 3)); g.computeVertexNormals();
    const m = new THREE.Mesh(g, new THREE.MeshToonMaterial({ color: i % 3 ? PAL.red : "#fff", side: THREE.DoubleSide, gradientMap: (toon("#fff") as any).gradientMap })); m.userData.g = "ink"; s.add(m); return m;
  });
  // toggle panel
  s.add(box(3.0, 2.1, 0.15, "#1E2342", { pos: [0, 2.7, -0.8] }));
  s.add(box(0.12, 1.7, 0.12, "#3a4380", { pos: [0, 0.85, -0.85] }));
  const names = ["ЗВУК", "ВОЗДУХ", "МОЗГ"];
  const tg = names.map((n, i) => {
    const y = 3.35 - i * 0.62;
    const lbl = textCard(n, { w: 1.4, h: 0.34, color: "#9AA0B5" }); lbl.card.mesh.position.set(-0.6, y, -0.7); s.add(lbl.card.mesh);
    const pill = new THREE.Mesh(new THREE.CapsuleGeometry(0.17, 0.5, 6, 16), toon("#555555")); pill.rotation.z = Math.PI / 2; pill.position.set(0.75, y, -0.62); pill.userData.g = "ink"; s.add(pill);
    const knob = sphere(0.15, "#ffffff", { pos: [0.5, y, -0.45] }); s.add(knob);
    return { lbl, pill, knob, y, on: -1 };
  });
  const dust = Array.from({ length: 20 }).map((_, i) => { const m = sphere(0.025 + rnd(i + 4) * 0.025, "#ffffff", { ink: "hide", mat: new THREE.MeshBasicMaterial({ color: "#fff" }) }); s.add(m); return m; });
  const hero = new Char(1.8, 900); s.add(hero.root);
  return {
    scene: s,
    update: (t) => {
      const crack = t >= T.crack6; const ck = pr(t, T.crack6, 0.6);
      stamps.forEach((c) => (c.mesh.visible = !crack));
      shards.forEach((m, i) => {
        m.visible = crack && ck < 1;
        m.position.set((rnd(i) - 0.5) * 2.6 + (rnd(i + 9) - 0.5) * 2 * ck, 2.7 + (rnd(i + 5) - 0.5) * 1.1 - ei(ck) * 3.5, 0.5 + rnd(i + 2) * 0.6 * ck);
        m.rotation.set(ck * rnd(i + 3) * 8, ck * rnd(i + 6) * 8, ck * (rnd(i + 7) - 0.5) * 10);
      });
      const times = [T.tog6a, T.tog6b, T.tog6c];
      tg.forEach((g, i) => {
        const k = eio(pr(t, times[i], 0.15)); const on = t >= times[i] ? 1 : 0;
        g.knob.position.x = lerp(0.5, 1.0, k);
        if (g.on !== on) { g.on = on; g.pill.material = toon(on ? PAL.green : "#555555"); g.lbl.draw(names[i], on ? PAL.green : "#9AA0B5"); }
        const vis = t >= T.color6; g.pill.visible = vis; g.knob.visible = vis; g.lbl.card.mesh.visible = vis;
      });
      const frozen = t >= T.freeze6; const tz = frozen ? T.freeze6 : t;
      dust.forEach((m, i) => { const yy = ((rnd(i) * 5 + tz * (0.25 + rnd(i + 2) * 0.3)) % 5); m.position.set((rnd(i + 20) - 0.5) * 6 + Math.sin(tz + i) * 0.1, yy, (rnd(i + 30) - 0.5) * 3 + 1); m.visible = t >= T.color6; });
      const pk = pr(t, T.press6, 0.3);
      const ps = pk <= 0 || pk >= 1 ? 1 : pk < 0.33 ? lerp(1, 0.85, pk / 0.33) : pk < 0.66 ? lerp(0.85, 1.1, (pk - 0.33) / 0.33) : lerp(1.1, 1, (pk - 0.66) / 0.34);
      hero.set({ x: 0.2, z: 1.2, pose: "hold", hand: "button", pressK: ps, t: tz });
      const cam = camKeys(t, [
        { t: T.s6, pos: V(0, 2.2, 7.6), look: V(0, 2.1, 0), fov: 40, focus: 7 },
        { t: T.tog6a, pos: V(0, 2.1, 7.0), look: V(0, 2.0, 0), fov: 40, focus: 7, glide: 1.6 },
        { t: T.press6, pos: V(0.1, 1.9, 6.4), look: V(0.1, 1.8, 0), fov: 40, focus: 5.2, glide: T.press6 - T.tog6a },
        { t: T.s7, pos: V(0.15, 1.75, 4.6), look: V(0.15, 1.6, 0.5), fov: 40, focus: 3.5, blur: 12, range: 2, glide: T.s7 - T.press6 },
      ]);
      const desat = t >= T.freeze6 ? (t < T.freeze6 + 0.5 ? 0 : clamp((t - T.freeze6 - 0.5) / 0.25)) : 1;
      return { cam, post: { sat: desat } };
    },
  };
};

// ====================================================================
// ROAD (S4)
// ====================================================================
export const roadSet = (): Set3D => {
  const { s } = newScene("day", "#7fb0e6", 30, 160);
  s.add(plane(800, 200, "#7cc35a", { rot: [-Math.PI / 2, 0, 0], pos: [200, -0.01, -40], shadow: false }));
  s.add(box(800, 0.04, 5, "#4a4f63", { pos: [200, 0.0, 0.5], shadow: false }));
  for (let x = -20; x < 380; x += 4) s.add(box(2, 0.05, 0.16, "#ffffff", { pos: [x, 0.02, 0.5], shadow: false }));
  s.add(box(800, 0.14, 2.5, "#cfc6b5", { pos: [200, 0.07, -3.3], shadow: false }));
  s.add(box(800, 0.18, 0.15, "#e9e2d2", { pos: [200, 0.09, -2.05], shadow: false }));
  for (let i = 0; i < 70; i++) { const [c, r] = HOUSE_COLS[i % 5]; s.add(house(-20 + i * 6.2, -22, 5.2, HEIGHTS[(i * 7) % 3], c, r)); }
  for (let i = 0; i < 90; i++) { const x = -15 + i * 4.3 + rnd(i) * 1.5; s.add(cyl(0.12, 0.16, 1.4, "#6b4a2a", { pos: [x, 0.7, -6 - rnd(i + 3) * 3] }), sphere(0.9 + rnd(i) * 0.3, rnd(i + 1) > 0.5 ? "#5aa84a" : "#4a9a50", { pos: [x, 2.1, -6 - rnd(i + 3) * 3] })); }
  // plane
  const air = new THREE.Group();
  air.add(cyl(0.45, 0.35, 6, "#ffffff", { rot: [0, 0, Math.PI / 2], shadow: false }), box(1.4, 0.12, 6, "#e8ecf4", { pos: [0.3, 0, 0], shadow: false }), box(0.8, 1.6, 0.12, "#e8ecf4", { pos: [-2.6, 0.8, 0], shadow: false }), sphere(0.42, "#ffffff", { pos: [3, 0, 0], shadow: false }));
  s.add(air);
  const wall = box(0.5, 2.8, 2.4, PAL.blue, { ink: "hide", mat: new THREE.MeshBasicMaterial({ color: PAL.blue, transparent: true, opacity: 0.35 }) }); s.add(wall);
  const hero = new Char(1.8, 900); s.add(hero.root);
  const capC = new Card(0.4, 0.3, 128, "full"); capC.draw((ctx, w, h) => { ctx.fillStyle = PAL.plum; ctx.beginPath(); ctx.arc(w / 2, h * 0.75, w * 0.36, Math.PI, 0); ctx.fill(); ctx.fillStyle = PAL.cap; ctx.beginPath(); ctx.arc(w / 2, h * 0.75, w * 0.32, Math.PI, 0); ctx.fill(); ctx.fillStyle = PAL.capDark; ctx.fillRect(w * 0.5, h * 0.68, w * 0.45, h * 0.12); }); s.add(capC.mesh);
  const sockC = new Card(0.3, 0.3, 128, "full"); sockC.draw((ctx, w, h) => { ctx.fillStyle = PAL.plum; ctx.fill(new Path2D(`M ${w * 0.3} ${h * 0.05} L ${w * 0.6} ${h * 0.05} L ${w * 0.6} ${h * 0.6} L ${w * 0.92} ${h * 0.6} Q ${w} ${h * 0.95} ${w * 0.7} ${h * 0.95} L ${w * 0.3} ${h * 0.95} Z`)); ctx.fillStyle = "#fff"; ctx.fill(new Path2D(`M ${w * 0.35} ${h * 0.1} L ${w * 0.55} ${h * 0.1} L ${w * 0.55} ${h * 0.65} L ${w * 0.86} ${h * 0.65} Q ${w * 0.93} ${h * 0.9} ${w * 0.7} ${h * 0.9} L ${w * 0.35} ${h * 0.9} Z`)); }); s.add(sockC.mesh);
  const xAt = (t: number) => {
    if (t < T.walk4) return 0;
    if (t < T.fast4) return (t - T.walk4) * 1.4;
    const x0 = (T.fast4 - T.walk4) * 1.4;
    const ramp = Math.min(t, T.wall4) - T.fast4;
    return x0 + ramp * 18 - 0.5 * 18 * Math.max(0, 0.8 - ramp) * 0; // const speed
  };
  return {
    scene: s,
    update: (t) => {
      const px = xAt(t);
      const flat = t >= T.wall4; const running = t >= T.fast4;
      hero.set({ x: px, z: 0.6, pose: flat ? "flat" : running ? "run" : t >= T.walk4 ? "walk" : "idle", t, cap: t < T.clothes4, sock: false });
      wall.visible = flat; wall.position.set(xAt(T.wall4) + 0.75, 1.4, 0.6); wall.scale.setScalar(eob(pr(t, T.wall4, 0.15)) + 0.001);
      const pk = pr(t, T.plane4, 1.1); air.visible = pk > 0 && pk < 1; air.position.set(px + lerp(-22, 26, pk), 10.5, -16);
      const ck = pr(t, T.clothes4, 0.7);
      capC.mesh.visible = sockC.mesh.visible = t >= T.clothes4 && ck < 1;
      capC.mesh.position.set(px + 0.2 - ck * 4, 1.8 + Math.sin(ck * Math.PI * 0.8) * 1.6, 0.8); capC.mesh.rotateZ(0); capC.mesh.rotation.z = -ck * 9;
      sockC.mesh.position.set(px - ck * 4.4, 0.2 + Math.sin(ck * Math.PI * 0.7) * 2.0, 0.8); sockC.mesh.rotation.z = ck * 12;
      const lagX = px + 0.6;
      const cam = camKeys(t, [
        { t: T.s4, pos: V(0.6, 1.5, 7.5), look: V(0.6, 1.5, 0), fov: 40, focus: 6.9 },
        { t: T.fast4, pos: V(0.6, 1.4, 7.0), look: V(0.6, 1.45, 0), fov: 40, focus: 6.4, glide: 2.5 },
        { t: T.fast4 + 0.6, pos: V(0.6, 1.2, 6.2), look: V(0.6, 1.5, 0), fov: 44, focus: 5.6, blur: 8, range: 3, roll: -4, glide: 0.6 },
        { t: T.wall4, pos: V(0.6, 1.2, 6.2), look: V(0.6, 1.5, 0), fov: 44, focus: 5.6, blur: 8, range: 3, roll: -4, glide: 0.01 },
        { t: T.wall4 + 0.4, pos: V(0.4, 1.5, 4.8), look: V(0.6, 1.5, 0), fov: 40, focus: 4.2, blur: 12, range: 2.5, roll: 0, glide: 0.4 },
        { t: T.s5, pos: V(0.3, 1.55, 4.4), look: V(0.5, 1.55, 0), fov: 40, focus: 3.8, blur: 12, range: 2.5, glide: T.s5 - T.wall4 - 0.4 },
      ]);
      cam.pos.x += lagX; cam.look.x += lagX;
      if (t >= T.fast4 && t < T.clothes4) { const sh = shakeV(t, 0.04); cam.pos.add(sh); cam.look.add(sh); }
      if (t >= T.wall4 && t < T.wall4 + 0.25) { const sh = shakeV(t, 0.1); cam.pos.add(sh); cam.look.add(sh); }
      return { cam };
    },
  };
};

// ====================================================================
// SHOP (S7)
// ====================================================================
export const shopSet = (): Set3D => {
  const { s } = newScene("indoor", "#7fb6a8", 30, 120);
  s.add(plane(16, 10, "#fff", { rot: [-Math.PI / 2, 0, 0], shadow: false, mat: new THREE.MeshToonMaterial({ map: repeatTex(tileTex("#e8e2d4", "#cfc6b2", 4), 8, 5), gradientMap: (toon("#fff") as any).gradientMap }) }));
  s.add(box(16, 4, 0.2, "#7fb6a8", { pos: [0, 2, -3.1] }));
  s.add(box(0.2, 4, 10, "#6aa596", { pos: [-6.5, 2, 1.5] }));
  // shelves
  for (let lvl = 0; lvl < 3; lvl++) {
    s.add(box(4.6, 0.08, 0.6, "#a8744a", { pos: [-3.6, 0.8 + lvl * 0.75, -2.7] }));
    for (let j = 0; j < 9; j++) s.add(box(0.35, 0.45, 0.35, [PAL.pink, PAL.yellow, PAL.blue, PAL.green, "#ff9f43"][(j + lvl) % 5], { pos: [-5.6 + j * 0.5, 1.07 + lvl * 0.75, -2.7] }));
  }
  s.add(box(0.1, 2.6, 0.6, "#a8744a", { pos: [-5.9, 1.3, -2.7] }), box(0.1, 2.6, 0.6, "#a8744a", { pos: [-1.3, 1.3, -2.7] }));
  const sign = textCard("МАГАЗИН", { w: 2.6, h: 0.6, color: PAL.yellow, bg: "#1E2342", size: 0.5 }); sign.card.mesh.position.set(2.4, 3.2, -2.95); s.add(sign.card.mesh);
  // counter
  s.add(box(3.4, 1.0, 0.9, "#b5733f", { pos: [2.6, 0.5, -0.9] }), box(3.5, 0.08, 1.0, "#8a5a3b", { pos: [2.6, 1.04, -0.9] }));
  s.add(box(0.6, 0.35, 0.45, "#8F95A8", { pos: [1.6, 1.25, -0.9] }));
  const regScreen = box(0.45, 0.16, 0.05, "#2A2F55", { pos: [1.6, 1.33, -0.66] }); s.add(regScreen);
  const cashier = new Char(1.7, 900); s.add(cashier.root);
  const queue = [-3.2, -2.4, -1.6, -0.8].map(() => { const c = new Char(1.75, 512); s.add(c.root); return c; });
  const cloud = new THREE.Group();
  [[0, 0, 0.55], [0.5, 0.25, 0.45], [-0.45, 0.2, 0.4], [0.2, 0.6, 0.35], [-0.2, -0.2, 0.4]].forEach(([x, y, r]) => cloud.add(sphere(r, "#7ED957", { pos: [x, y, 0], ink: "hide", mat: new THREE.MeshToonMaterial({ color: "#7ED957", transparent: true, opacity: 0.45, depthWrite: false, gradientMap: (toon("#fff") as any).gradientMap }) })));
  s.add(cloud);
  const hero = new Char(1.8, 900); s.add(hero.root);
  const ghosts = [0, 1, 2].map(() => { const c = new Char(1.8, 384); s.add(c.root); return c; });
  const plus = textCard("+1 МОЛОКО", { w: 2.4, h: 0.5, color: PAL.yellow }); s.add(plus.card.mesh);
  const runA = T.run7, runB = T.run7 + 1.5;
  const pxAt = (t: number) => t < T.q7 ? lerp(-7, -4.6, eo(pr(t, T.s7, 1.6))) : t < runA ? -4.6 : t < runB ? lerp(-4.6, 1.3, eio(pr(t, runA, runB - runA))) : t < T.leave7 ? 1.3 : lerp(1.3, 9, ei(pr(t, T.leave7, 0.8)));
  return {
    scene: s,
    update: (t) => {
      const px = pxAt(t);
      const cloudX = -3.2 + 0.25 + 0.05 * Math.max(0, t - T.fart7);
      const ck = eob(pr(t, T.fart7, 0.5));
      cloud.visible = t >= T.fart7; cloud.scale.setScalar(ck * 1.2 + 0.001); cloud.position.set(cloudX, 1.0, -0.5);
      let pose: any = t < T.s7 + 1.6 ? "walk" : t < runA ? "hold" : t < runB ? "run" : t < T.leave7 ? "hold" : "run";
      let face: any;
      const inCloud = t >= runA && t < runB && Math.abs(px - cloudX) < 0.8;
      if (inCloud) { pose = "crossnose"; face = "cross"; }
      hero.set({ x: px, z: 0.4, pose, face, t, hand: pose === "hold" || pose === "walk" ? "milk" : null });
      const trail = pose === "run" || inCloud;
      ghosts.forEach((g, k) => g.set({ x: px - (k + 1) * 0.45, z: 0.38, pose, t: t - (k + 1) * 0.05, bodyColor: "#9B6BFF", cap: false, opacity: 0.45 - k * 0.12, visible: trail, shadow: false }));
      queue.forEach((c, i) => {
        const hl = i === 0 && t >= T.dyad7 && t < T.fart7 + 0.6 ? 0.03 * Math.sin((t - T.dyad7) * 14) : 0;
        c.set({ x: [-3.2, -2.4, -1.6, -0.8][i], z: -0.6, gray: true, pose: "idle", face: "passport", t: t + i, jitter: 1, blinkK: 0, y: Math.max(0, hl) });
      });
      const blink = t >= T.cashier7 + 0.3 ? clamp((t - T.cashier7 - 0.3) / (T.s8 - T.cashier7 - 0.4)) : -1;
      cashier.set({ x: 2.8, z: -1.8, gray: true, pose: "idle", face: blink >= 0 ? "neutral" : "passport", blinkK: blink >= 0 ? blink : 0, t, flip: true, shadow: false });
      regScreen.material = toon(t >= T.beep7 && t < T.beep7 + 0.4 ? PAL.green : "#2A2F55");
      plus.card.mesh.visible = t >= T.beep7 && t < T.cashier7;
      plus.card.mesh.position.set(1.6, 2.2 + 0.3 * pr(t, T.beep7, 1.2), -0.6); plus.card.mesh.scale.setScalar(eob(pr(t, T.beep7, 0.15)) + 0.001);
      const cam = camKeys(t, [
        { t: T.s7, pos: V(-1.2, 1.8, 8.2), look: V(-1.2, 1.2, -0.5), fov: 42, focus: 8.5 },
        { t: T.passport7, pos: V(-2.0, 1.7, 4.3), look: V(-2.0, 1.55, -0.6), fov: 40, focus: 4.9, blur: 10, range: 2.5, glide: 1.0 },
        { t: T.dyad7, pos: V(-2.9, 1.7, 3.6), look: V(-3.1, 1.5, -0.6), fov: 40, focus: 4.2, blur: 12, range: 2.5, glide: 0.8 },
        { t: T.glacier7, pos: V(-2.6, 1.8, 5.2), look: V(-2.8, 1.3, -0.5), fov: 40, focus: 5.6, blur: 6, glide: 0.8 },
        { t: T.run7, pos: V(-1.5, 1.8, 7.0), look: V(-1.5, 1.2, -0.3), fov: 42, focus: 6.8, glide: 0.6 },
        { t: T.beep7, pos: V(0.8, 1.8, 5.6), look: V(1.0, 1.4, -0.5), fov: 42, focus: 5.4, blur: 4, glide: 1.2 },
        { t: T.cashier7, pos: V(1.0, 1.8, 6.0), look: V(1.4, 1.4, -0.6), fov: 42, focus: 6, glide: 0.01 },
        { t: T.cashier7 + 0.5, pos: V(2.55, 1.58, 0.6), look: V(2.8, 1.58, -1.8), fov: 40, focus: 2.4, blur: 14, range: 1.2, glide: 0.5 },
        { t: T.s8, pos: V(2.6, 1.6, 0.3), look: V(2.8, 1.6, -1.8), fov: 40, focus: 2.1, blur: 15, range: 1.2, glide: T.s8 - T.cashier7 - 0.5 },
      ]);
      if (t > T.run7 + 0.4 && t < T.run7 + 1.4) { const sh = shakeV(t, 0.05); cam.pos.add(sh); cam.look.add(sh); }
      return { cam };
    },
  };
};

// ====================================================================
// STREET (S8, S11 scream)
// ====================================================================
export const streetSet = (which: "s8" | "scream"): Set3D => {
  const { s } = newScene("golden", "#f4b27a", 25, 120);
  s.add(plane(200, 100, "#6f6a78", { rot: [-Math.PI / 2, 0, 0], pos: [0, -0.01, -30], shadow: false }));
  s.add(box(200, 0.14, 3, "#cdbba0", { pos: [0, 0.07, 0], shadow: false }));
  s.add(box(200, 0.18, 0.15, "#e9dcc3", { pos: [0, 0.09, -1.55], shadow: false }));
  for (let x = -60; x < 60; x += 4) s.add(box(2, 0.04, 0.15, "#f1e6c8", { pos: [x, 0.01, -4.5], shadow: false }));
  s.add(box(200, 0.14, 3, "#cdbba0", { pos: [0, 0.07, -8.5], shadow: false }));
  for (let i = 0; i < 16; i++) { const [c, r] = HOUSE_COLS[(i * 3) % 5]; s.add(house(-36 + i * 5.6, -13, 5.2, HEIGHTS[(i * 5) % 3], c, r)); }
  [-6, 2, 10].forEach((x) => s.add(cyl(0.06, 0.08, 4, "#2f3440", { pos: [x, 2, -1.2] }), sphere(0.22, "#ffe8a0", { pos: [x, 4.1, -1.2], mat: new THREE.MeshBasicMaterial({ color: "#ffe8a0" }) })));
  [-3.5, 5.5].forEach((x) => s.add(cyl(0.12, 0.16, 1.4, "#6b4a2a", { pos: [x, 0.7, -1.0] }), sphere(1.0, "#5d8f3f", { pos: [x, 2.2, -1.0] })));
  const man = new Char(1.85, 1024); s.add(man.root);
  const hero = new Char(1.8, 900); s.add(hero.root);
  const ball = sphere(0.075, PAL.pink, {}); s.add(ball);
  const nyam = textCard("ням", { w: 1.0, h: 0.42, color: PAL.pink }); s.add(nyam.card.mesh);
  const u = 1.85 / 576;
  const MX = -0.7;
  const handX = MX + 180 * u, handY = 409.5 * u;
  return {
    scene: s,
    update: (t) => {
      if (which === "scream") {
        man.set({ x: 0, z: 0, gray: true, pose: "lost", face: "scream", hand: "coneDown", t, jitter: 3 });
        hero.root.visible = false; ball.visible = false; nyam.card.mesh.visible = false;
        const zk = eo(pr(t, T.scream11, 0.5));
        const cam = { pos: lv(V(0.1, 1.5, 5.5), V(0.05, 1.6, 2.3), zk), look: lv(V(0.1, 1.3, 0), V(0.05, 1.55, 0), zk), fov: 50, focus: lerp(5.5, 2.3, zk), blur: lerp(4, 14, zk), range: 1.5 };
        return { cam };
      }
      const fallK = pr(t, T.drop8, 3.0);
      const dk = eo(pr(t, T.dash8, 0.35));
      const px = lerp(1.7, handX + 0.25, dk);
      const crouching = t >= T.dash8 + 0.35;
      const eat = t >= T.eat8;
      const close = t >= T.close8;
      man.set({ x: MX, z: 0, gray: true, pose: close ? "lost" : "holdcone", face: close ? "scream" : "neutral", hand: t < T.drop8 ? "cone" : close ? "coneDown" : "coneEmpty", t });
      hero.set({ x: px, z: 0.15, pose: t < T.dash8 ? "idle" : !crouching ? "run" : eat ? "eat" : "crouch", t, flip: true });
      const headY = (465 - 110) * (1.8 / 576);
      const by0 = handY + 27 * u;
      ball.visible = t >= T.drop8 && !eat;
      ball.position.set(handX + 0.03, t < T.drop8 ? by0 : lerp(by0, headY + 0.05, clamp((t - T.drop8) / (T.eat8 - T.drop8))), 0.12);
      ball.rotation.z = fallK * 2;
      nyam.card.mesh.visible = t >= T.eat8 + 0.1 && !close;
      nyam.card.mesh.position.set(px, headY + 0.55, 0.3); nyam.card.mesh.scale.setScalar(eob(pr(t, T.eat8 + 0.1, 0.15)) + 0.001);
      const cam = camKeys(t, [
        { t: T.s8, pos: V(0.4, 1.5, 6.8), look: V(0.4, 1.25, 0), fov: 40, focus: 6.8, blur: 3 },
        { t: T.drop8, pos: V(-0.1, 1.45, 4.2), look: V(-0.1, 1.25, 0), fov: 40, focus: 4.2, blur: 9, range: 2.5, glide: 1.0 },
        { t: T.dash8, pos: V(-0.1, 1.4, 4.2), look: V(-0.1, 1.2, 0), fov: 40, focus: 4.2, blur: 9, range: 2.5, glide: 0.01 },
        { t: T.eat8, pos: V(0.0, 1.35, 3.4), look: V(0.0, 1.15, 0), fov: 40, focus: 3.4, blur: 12, range: 2, glide: 0.8 },
        { t: T.close8, pos: V(0.2, 1.5, 6.0), look: V(0.2, 1.25, 0), fov: 40, focus: 6, blur: 3, glide: 0.6 },
        { t: T.close8 + 0.3, pos: V(-0.55, 1.62, 1.6), look: V(-0.6, 1.55, 0), fov: 40, focus: 1.6, blur: 16, range: 1, roll: 4, glide: 0.25 },
      ]);
      return { cam };
    },
  };
};

// ====================================================================
// SHOWER (S9)
// ====================================================================
export const showerSet = (): Set3D => {
  const { s } = newScene("indoor", "#bfe0ea", 30, 120);
  s.add(plane(14, 10, "#fff", { rot: [-Math.PI / 2, 0, 0], shadow: false, mat: new THREE.MeshToonMaterial({ map: repeatTex(tileTex("#9fb6c8", "#7d93a8", 4), 7, 5), gradientMap: (toon("#fff") as any).gradientMap }) }));
  const wallT = new THREE.MeshToonMaterial({ map: repeatTex(tileTex("#eef6f8", "#b8d3dc", 6), 7, 2), gradientMap: (toon("#fff") as any).gradientMap });
  s.add(box(14, 4, 0.2, "#fff", { pos: [0, 2, -3.1], mat: wallT }));
  s.add(box(0.2, 4, 8, "#fff", { pos: [-4.8, 2, 1], mat: wallT }));
  // door + sign
  s.add(box(1.3, 2.3, 0.1, "#5b6a9a", { pos: [-2.8, 1.15, -2.98] }), sphere(0.06, "#e9c46a", { pos: [-2.3, 1.1, -2.9] }));
  const mk = (txt: string, bg: string) => canvasTex(256, 256, (ctx, w) => { ctx.fillStyle = PAL.plum; ctx.fillRect(0, 0, w, w); ctx.fillStyle = bg; ctx.beginPath(); ctx.roundRect(12, 12, w - 24, w - 24, 26); ctx.fill(); ctx.font = `800 ${w * 0.62}px Montserrat`; ctx.fillStyle = "#fff"; ctx.textAlign = "center"; ctx.textBaseline = "middle"; ctx.fillText(txt, w / 2, w / 2 + 10); });
  const side = toon("#5b6a9a");
  const signMats = [side, side, side, side, new THREE.MeshBasicMaterial({ map: mk("Ж", PAL.red) }), new THREE.MeshBasicMaterial({ map: mk("М", "#3D7BFF") })];
  const sign = new THREE.Mesh(new THREE.BoxGeometry(0.55, 0.55, 0.05), signMats); sign.position.set(-2.8, 2.65, -2.92); sign.userData.g = "ink"; s.add(sign);
  // clock
  s.add(cyl(0.34, 0.34, 0.08, "#4a4f7a", { pos: [3.0, 2.7, -2.96], rot: [Math.PI / 2, 0, 0] }));
  const clock = new Card(0.6, 0.6, 256, "none"); clock.mesh.position.set(3.0, 2.7, -2.91); s.add(clock.mesh);
  const plus10 = textCard("+10 мин", { w: 1.3, h: 0.36, color: PAL.yellow }); plus10.card.mesh.position.set(3.0, 2.1, -2.8); s.add(plus10.card.mesh);
  // cabin
  const CX = 0.9;
  s.add(box(1.8, 2.5, 0.1, "#bfe8f7", { pos: [CX, 1.25, -2.95] }));
  s.add(box(0.1, 2.5, 1.5, "#d7eef5", { pos: [CX - 0.9, 1.25, -2.2] }), box(0.1, 2.5, 1.5, "#d7eef5", { pos: [CX + 0.9, 1.25, -2.2] }));
  s.add(box(1.8, 0.1, 1.5, "#e8f4f8", { pos: [CX, 0.05, -2.2] }));
  s.add(cyl(0.03, 0.03, 1.9, "#9AA0B5", { pos: [CX, 2.45, -1.45], rot: [0, 0, Math.PI / 2] }));
  s.add(cyl(0.02, 0.02, 0.6, "#9AA0B5", { pos: [CX - 0.55, 2.2, -2.85] }), cyl(0.12, 0.12, 0.04, "#9AA0B5", { pos: [CX - 0.55, 1.95, -2.75], rot: [Math.PI / 3, 0, 0] }));
  const curtTex = canvasTex(512, 512, (ctx, w, h) => { ctx.fillStyle = "#ffffff"; ctx.fillRect(0, 0, w, h); for (let i = 0; i < 8; i++) { ctx.fillStyle = "#dfe5ef"; ctx.fillRect((i + 0.5) * (w / 8) - 6, 0, 12, h); } });
  const curtain = new THREE.Mesh(new THREE.PlaneGeometry(1.8, 2.3), new THREE.MeshToonMaterial({ map: curtTex, side: THREE.DoubleSide, gradientMap: (toon("#fff") as any).gradientMap }));
  curtain.userData.g = "ink"; curtain.castShadow = true; s.add(curtain);
  const gapLbl = textCard("1 мм", { w: 0.32, h: 0.11, color: PAL.yellow }); s.add(gapLbl.card.mesh);
  const rustam = new Char(1.8, 1024); s.add(rustam.root);
  const hero = new Char(1.8, 900); s.add(hero.root);
  return {
    scene: s,
    update: (t) => {
      const frozen = t >= T.rustam9 + 0.3 && t < T.meme9 + 1.6;
      const tt = frozen ? T.rustam9 + 0.3 : t;
      const ak = eio(pr(t, T.approach9, 1.6));
      const waiting = t >= T.wait9, revealed = t >= T.reveal9;
      const pose: any = revealed ? "shock" : waiting ? "crouch" : t >= T.approach9 && ak < 1 ? "walk" : "back";
      hero.set({ x: lerp(-1.6, -0.3, ak), z: lerp(1.0, -0.3, ak), pose, backView: !revealed, t: tt, face: revealed && t >= T.flip9 ? "flat" : undefined });
      const gap = t < T.gap9 ? 0 : t < T.reveal9 ? 1 + Math.floor((t - T.gap9) / 1.2) : 0;
      const open = eo(pr(t, T.reveal9, 0.35));
      const cw = lerp(1.8, 0.22, open) - gap * 0.03;
      curtain.scale.x = cw / 1.8; curtain.position.set(CX - 0.9 + cw / 2, 1.2, -1.45);
      gapLbl.card.mesh.visible = gap > 0 && !revealed;
      if (gap > 0) gapLbl.draw(`${gap} мм`);
      gapLbl.card.mesh.position.set(CX + 0.72, 1.75, -1.4);
      plus10.card.mesh.visible = t >= T.gap9 && t < T.wait9 && Math.floor(t * 2) % 2 === 0;
      clock.draw((ctx, w) => {
        ctx.fillStyle = "#fff"; ctx.beginPath(); ctx.arc(w / 2, w / 2, w * 0.48, 0, 7); ctx.fill();
        ctx.strokeStyle = "#1E2342"; ctx.lineCap = "round";
        const hand = (deg: number, len: number, lw: number) => { const a = ((deg - 90) * Math.PI) / 180; ctx.lineWidth = lw; ctx.beginPath(); ctx.moveTo(w / 2, w / 2); ctx.lineTo(w / 2 + Math.cos(a) * len, w / 2 + Math.sin(a) * len); ctx.stroke(); };
        hand(tt * 4, w * 0.24, 14); hand(tt * 40, w * 0.36, 9);
      });
      rustam.root.visible = revealed;
      const waveK = t >= T.wave9 ? (t >= T.more9 ? 1 - 0.7 * pr(t, T.more9, 0.2) + 0.7 * pr(t, T.more9 + 0.2, 1.8) : eo(pr(t, T.wave9, 0.3))) : 0;
      if (revealed) rustam.set({ x: CX, z: -2.2, gray: true, towel: true, moustache: true, pose: "wave", armWave: waveK, face: "smile", hand: "mochalka", t: tt, cap: false });
      const fk = pr(t, T.flip9, 0.4); sign.rotation.y = fk * Math.PI;
      const sp = t >= T.sign9 && t < T.sign9 + 0.6 ? 1.15 : 1; sign.scale.setScalar(sp);
      const cam = camKeys(t, [
        { t: T.s9, pos: V(-0.4, 1.7, 7.4), look: V(-0.4, 1.4, -1.5), fov: 42, focus: 7 },
        { t: T.sign9, pos: V(-1.8, 2.2, 4.6), look: V(-2.5, 2.3, -2.9), fov: 40, focus: 6, blur: 6, glide: 1.0 },
        { t: T.approach9, pos: V(-0.6, 1.8, 6.4), look: V(0.2, 1.3, -1.5), fov: 42, focus: 6.5, glide: 1.2 },
        { t: T.gap9, pos: V(1.2, 1.6, 1.3), look: V(1.65, 1.5, -1.45), fov: 40, focus: 2.8, blur: 12, range: 1.2, glide: 0.6 },
        { t: T.wait9, pos: V(1.35, 1.6, 0.6), look: V(1.7, 1.5, -1.45), fov: 40, focus: 2.1, blur: 13, range: 1.0, glide: T.wait9 - T.gap9 - 0.6 },
        { t: T.wait9 + 0.6, pos: V(-0.2, 1.8, 6.0), look: V(0.3, 1.2, -1.5), fov: 42, focus: 6.2, blur: 4, glide: 0.6 },
        { t: T.reveal9, pos: V(-0.1, 1.75, 5.6), look: V(0.3, 1.2, -1.5), fov: 42, focus: 5.6, blur: 4, glide: T.reveal9 - T.wait9 - 0.6 },
        { t: T.rustam9 + 0.3, pos: V(CX - 0.05, 1.62, -0.45), look: V(CX, 1.58, -2.2), fov: 40, focus: 1.75, blur: 14, range: 0.8, glide: 0.3 },
        { t: T.meme9 + 1.6, pos: V(CX - 0.05, 1.62, -0.45), look: V(CX, 1.58, -2.2), fov: 40, focus: 1.75, blur: 14, range: 0.8, glide: 0.01 },
        { t: T.meme9 + 2.0, pos: V(-0.3, 1.8, 5.4), look: V(-0.6, 1.5, -1.8), fov: 42, focus: 5.5, blur: 3, glide: 0.4 },
        { t: T.s10, pos: V(-0.1, 1.75, 4.8), look: V(-0.4, 1.5, -1.8), fov: 42, focus: 5, blur: 4, glide: T.s10 - T.meme9 - 2.0 },
      ]);
      const camT = frozen ? T.rustam9 + 0.3 : t;
      const c2 = frozen ? camKeys(camT, [{ t: 0, pos: V(CX - 0.05, 1.62, -0.45), look: V(CX, 1.58, -2.2), fov: 40, focus: 1.75, blur: 14, range: 0.8 }]) : cam;
      return { cam: c2 };
    },
  };
};

// ====================================================================
// SQUARE (S10a) + BILLBOARD (S10b)
// ====================================================================
export const squareSet = (): Set3D => {
  const { s } = newScene("day", "#7fb0e6", 30, 160);
  s.add(plane(80, 60, "#fff", { rot: [-Math.PI / 2, 0, 0], shadow: false, mat: new THREE.MeshToonMaterial({ map: repeatTex(tileTex("#e0d2b4", "#c9b893", 4), 20, 15), gradientMap: (toon("#fff") as any).gradientMap }) }));
  for (let i = 0; i < 10; i++) { const [c, r] = HOUSE_COLS[(i * 2) % 5]; s.add(house(-25 + i * 5.6, -14, 5.2, HEIGHTS[(i * 4) % 3], c, r)); }
  const peds = [-2.2, 0, 2.2];
  peds.forEach((x) => s.add(cyl(0.6, 0.7, 0.5, "#b8b2a6", { pos: [x, 0.25, -1] })));
  const statues = peds.map(() => { const c = new Char(1.75, 640); s.add(c.root); return c; });
  const hero = new Char(1.6, 768); s.add(hero.root);
  const rings = peds.map(() => { const m = new THREE.Mesh(new THREE.TorusGeometry(1, 0.03, 8, 48), new THREE.MeshBasicMaterial({ color: PAL.yellow, transparent: true })); m.userData.g = "hide"; s.add(m); return m; });
  // billboard
  const bb = new THREE.Group();
  bb.add(box(0.15, 4.0, 0.15, "#4a4f63", { pos: [-1.4, 2.0, 0] }), box(0.15, 4.0, 0.15, "#4a4f63", { pos: [1.4, 2.0, 0] }), box(4.4, 3.0, 0.2, "#2f3440", { pos: [0, 5.3, 0] }));
  const face = new Card(4.1, 2.7, 1024, "none"); face.mesh.position.set(0, 5.3, 0.11); bb.add(face.mesh);
  bb.position.set(0, 0, -6); s.add(bb);
  const marker = new Card(0.6, 0.6, 128, "none"); marker.draw((ctx, w) => { ctx.save(); ctx.translate(w / 2, w / 2); ctx.rotate(-0.5); ctx.fillStyle = PAL.plum; ctx.fillRect(-16, -60, 32, 120); ctx.fillStyle = PAL.yellow; ctx.fillRect(-11, -40, 22, 95); ctx.fillStyle = "#111"; ctx.fillRect(-11, -55, 22, 18); ctx.restore(); }); s.add(marker.mesh);
  const drawFace = (must: number) => face.draw((ctx, w, h) => {
    ctx.fillStyle = "#f2efe6"; ctx.fillRect(0, 0, w, h);
    ctx.save(); ctx.translate(w / 2, h / 2 + 10); const sc = h / 300; ctx.scale(sc, sc);
    ctx.fillStyle = "#C9CDD8"; ctx.beginPath(); ctx.arc(0, 0, 120, 0, 7); ctx.fill();
    ctx.fillStyle = PAL.ink; ctx.beginPath(); ctx.ellipse(-45, -20, 13, 17, 0, 0, 7); ctx.ellipse(45, -20, 13, 17, 0, 0, 7); ctx.fill();
    ctx.strokeStyle = PAL.ink; ctx.lineCap = "round"; ctx.lineWidth = 10; ctx.stroke(new Path2D("M -48 60 Q 0 74 48 60"));
    if (must > 0) {
      ctx.lineWidth = 22; const p = new Path2D("M -80 44 Q -48 8 -5 32 M 5 32 Q 48 8 80 44");
      ctx.setLineDash([400 * must, 1000]); ctx.stroke(p); ctx.setLineDash([]);
    }
    ctx.restore();
    ctx.font = `800 ${h * 0.09}px Montserrat`; ctx.fillStyle = "#1E2342"; ctx.textAlign = "center"; ctx.fillText("ВЫБИРАЙ ЛУЧШЕЕ", w / 2, h * 0.1);
  });
  let lastM = -1;
  return {
    scene: s,
    update: (t) => {
      const snaps = [T.snap10a, T.snap10b, T.snap10c];
      const poses: any[] = ["point", "onefoot", "nosepick"];
      statues.forEach((c, i) => c.set({ x: peds[i], y: 0.5, z: -1, gray: true, pose: t >= snaps[i] ? poses[i] : "idle", face: "passport", t: t + i, blinkK: 0, shadow: false }));
      rings.forEach((r, i) => { const k = pr(t, snaps[i], 0.35); r.visible = k > 0 && k < 1 && t < T.s10b; r.position.set(peds[i], 1.4, -0.9); r.scale.setScalar(lerp(0.4, 1.6, k)); (r.material as THREE.MeshBasicMaterial).opacity = 1 - k; });
      const snapping = snaps.some((x) => t >= x - 0.15 && t < x + 0.25);
      const b = t >= T.s10b;
      bb.visible = b;
      const must = eio(pr(t, T.draw10, 0.5));
      if (Math.abs(must - lastM) > 0.001) { drawFace(must); lastM = must; }
      if (!b) hero.set({ x: 3.6, z: 1.4, pose: snapping ? "snap" : "idle", t, flip: true });
      else hero.set({ x: 2.4, z: -4.6, pose: t >= T.draw10 - 0.3 && t < T.draw10 + 0.6 ? "draw" : "idle", t, flip: true });
      marker.mesh.visible = b && t >= T.draw10 - 0.3 && t < T.grid10;
      marker.mesh.position.set(lerp(-0.9, 0.9, must), 4.95 - Math.sin(must * Math.PI * 2) * 0.12, -5.8);
      const cam = b
        ? camKeys(t, [
            { t: T.s10b, pos: V(0.8, 3.2, 3.2), look: V(0, 5.0, -6), fov: 40, focus: 9.8 },
            { t: T.draw10, pos: V(0.3, 4.6, 0.2), look: V(0, 5.1, -6), fov: 40, focus: 6.3, blur: 3, glide: 1.0 },
            { t: T.s11, pos: V(0.2, 4.8, -0.5), look: V(0, 5.15, -6), fov: 40, focus: 5.5, glide: T.s11 - T.draw10 },
          ])
        : camKeys(t, [
            { t: T.s10, pos: V(-1.5, 2.0, 8.5), look: V(0, 1.4, -1), fov: 42, focus: 9 },
            { t: T.snap10b, pos: V(0.6, 1.9, 7.2), look: V(0.2, 1.5, -1), fov: 42, focus: 8, glide: 1.4 },
            { t: T.snap10c - 0.2, pos: V(1.6, 1.9, 4.6), look: V(1.8, 1.9, -1), fov: 40, focus: 5.6, blur: 10, range: 2, glide: 1.2 },
            { t: T.s10b, pos: V(1.8, 2.1, 3.6), look: V(2.1, 2.05, -1), fov: 40, focus: 4.7, blur: 13, range: 1.8, roll: 3, glide: T.s10b - T.snap10c + 0.2 },
          ]);
      return { cam };
    },
  };
};
