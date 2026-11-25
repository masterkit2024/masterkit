// EXAMPLE VIDEO for the style engine: "The Time Machine" (8 s). Shows every building block on a non-bridge topic:
// a town square set, a code-built machine that animates, characters that walk / react / blink, effect cards,
// a punch push-in, an impact kick, a white flash, a crossfade and all three light presets (day, golden, night).
// Copy this folder to start a new video: change SET (build), CAST (who is where, per time) and SHOTS (camera + light).
import * as THREE from "three";
import { VideoSpec, StageSet } from "../../engine/stage";
import { hold, dolly, pushK, zoom, V3 } from "../../engine/camera";
import { person, walkPath, fx, hh } from "../../engine/actors";
import { Outfit, townsfolk, SKINS, fxBurst, fxStars, fxPuff, fxRing, Pen, INK } from "../../engine/toon";

// ---------------- cast (outfits are the style's flat palette; see SKILL.md "Characters") ----------------
const INVENTOR: Outfit = { jacket: "#f2f2ee", pants: "#3b3f52", boots: "#4a3426", hat: "hair", hair: "#5a3b2a", skin: SKINS[0], moustache: "#5a3b2a" };
const KIDO: Outfit = { jacket: "#f08a2c", pants: "#3b5b9a", boots: "#f4f1ea", hat: "cap", cap: "#e2453c", build: "kid", skin: SKINS[1] };

// ---------------- the set (static scenery; y = 0 is the ground) ----------------
const MACHINE: V3 = [0, 0, 0];
const build = (s: StageSet) => {
  const M = s.mat;
  s.ground(M.cobble(), -24, 24, -12, 14, 0, 3);           // the square
  s.ground(M.grass(), -400, 400, -400, -12, -0.01, 6);    // fields behind the north row
  s.ground(M.grass(), -400, 400, 14, 400, -0.01, 6);
  s.ground(M.grass(), -400, -24, -12, 14, -0.01, 6);
  s.ground(M.grass(), 24, 400, -12, 14, -0.01, 6);
  s.street(-30, 30, -16, 0, 0, 2);                         // north row, fronts face the square (+z)
  s.street(-30, 30, 18, Math.PI, 0, 7);                    // south row, fronts face -z
  for (const x of [-9, 9]) s.prop("tree_oak", x, 0, -8, 6.5, x);
  for (const x of [-6, 6]) s.prop("lantern", x, 0, 4, 2.8);
  s.prop("stall-red", -12, 0, 2, 3.2, 0.5);
  s.prop("cart", 12, 0, 3, 2.2, -0.8);
  s.prop("plant_bushDetailed", 13, 0, -6, 1.3);
  s.prop("flower_redA", -4, 0, -5, 0.5);
  // the machine: a named object, so shots can animate it (spin, glow)
  s.named_("machine", (b) => {
    const base = M.metal("#5a5f6e"), brass = M.color("#c9973f"), red = M.color("#c8463c");
    b.add(new THREE.CylinderGeometry(1.3, 1.5, 0.45, 24), base, new THREE.Matrix4().makeTranslation(0, 0.22, 0));
    b.add(new THREE.CylinderGeometry(0.75, 0.9, 1.6, 20), brass, new THREE.Matrix4().makeTranslation(0, 1.25, 0));
    b.add(new THREE.SphereGeometry(0.8, 20, 12, 0, Math.PI * 2, 0, Math.PI / 2), red, new THREE.Matrix4().makeTranslation(0, 2.05, 0));
    b.add(new THREE.CylinderGeometry(0.06, 0.06, 0.9, 8), base, new THREE.Matrix4().makeTranslation(0, 2.9, 0));
  }, MACHINE);
  s.named_("ring", (b) => {
    b.add(new THREE.TorusGeometry(1.25, 0.09, 8, 40).rotateX(Math.PI / 2), s.mat.glow("#8ff0ff", 2.5));
  }, [0, 1.3, 0]);
  // a clock face on the machine, painted with the toon Pen (cards carry their own ink)
  s.card("clock", 0.9, 0.9, [0, 1.3, 0.92], 0, (p: Pen) => {
    p.ell(512, 512, 470, 470, "#f6efdd", 26); // face + ink ring
    p.stroke([[512, 512], [512, 200]], 30, INK); p.stroke([[512, 512], [720, 600]], 30, INK);
  });
};

// ---------------- shots (frames at 30 fps) ----------------
const T = (f: number) => f / 30;
const ZAP = 4.6; // s: the machine fires (kick + flash)
const inventorAt = (t: number) => walkPath([[-4.2, 0, 3.2], [-1.5, 0, 1.4]], t, 0.2, 1.1);

export const SPEC: VideoSpec = {
  frames: 240,
  build,
  kicks: [[ZAP, 1.2]],
  shots: [
    // 1. establishing, day: wide 3/4, slow push; the inventor walks to the machine, townsfolk watch
    {
      a: 0, b: 80, light: "day",
      cams: [{ f: 0, s: hold([1.2, 2.3, 11], [-2.0, 1.3, 0.6], 0, { fov: 44 }) }],
      dof: { cInf: 0 },
      cast: (t, _f, cam, out) => {
        const w = inventorAt(t);
        person(cam, t, out, { id: 1, outfit: INVENTOR, at: w.at, mode: w.moving ? "walk" : "stand", dir: w.dir, expr: "smile" });
        [[-6.2, -2.6], [-4.2, -4.4], [2.6, -3.8], [4.4, -2.2]].forEach(([x, z], i) =>
          person(cam, t, out, { id: 10 + i, outfit: townsfolk(i), at: [x, 0, z], expr: i % 2 ? "smile" : "neutral", look: x < 0 ? 0.5 : -0.5 }));
        person(cam, t, out, { id: 20, outfit: KIDO, at: [1.6, 0, -2.4], expr: "grin", wave: 0.6 + 0.4 * Math.sin(t * 6) });
      },
      animate: (t, _f, n) => { n.ring.rotation.y = t * 0.5; n.ring.visible = false; },
    },
    // 2. medium close on the inventor (cut), punch push on the lever pull; expression grin -> shock at the zap
    {
      a: 80, b: 150, light: "day",
      cams: [
        { f: 80, s: (f) => dolly([-0.4, 1.75, 4.6], [-1.5, 1.6, 1.4], pushK(f, 80, 0.003, 0.007, 30), { fov: 36, roll: 0.03 }) },
        { f: 120, dur: 22, s: (f) => dolly([1.6, 1.7, 6.2], [-0.7, 1.4, 1.2], pushK(f, 120, 0.003), { fov: 38, roll: -0.04 }) },
      ],
      dof: (f) => ({ cInf: f < 120 ? 13 : 8, focus: [-1.5, 1.65, 1.4] }),
      cast: (t, _f, cam, out) => {
        const zap = t >= ZAP - 0.07;
        person(cam, t, out, { id: 1, outfit: INVENTOR, at: [-1.5, 0, 1.4], expr: zap ? "shock" : "grin", swaps: [ZAP], facing: 1, wave: zap ? 1 : 0 });
        if (t > ZAP - 0.3) {
          const u = Math.min(1, (t - (ZAP - 0.3)) / 0.8);
          fx(out, `burst${Math.round(u * 30)}`, 512, 512, (p) => fxBurst(p, u, "#bff6ff", 12), [0, 1.6, 1.7], 3.2 * u + 0.3, 3.2 * u + 0.3, { soft: true });
        }
      },
      animate: (t, _f, n) => { n.ring.visible = true; n.ring.rotation.y = t * (t > ZAP - 1 ? 9 : 2); n.machine.rotation.y = t > ZAP - 1 ? Math.sin(t * 40) * 0.03 : 0; },
    },
    // 3. golden, "another time": flash cut, low 3/4 with a glide + roll; the inventor sits dazed with stars, puff of smoke
    {
      a: 150, b: 200, light: "golden", flash: true,
      cams: [
        { f: 150, s: hold([3.2, 0.9, 5.2], [-0.6, 0.9, 1.0], 150, { fov: 40, roll: 0.04 }) },
        { f: 172, dur: 26, s: hold([4.2, 1.4, 6.5], [-0.4, 1.1, 0.6], 172, { fov: 42, roll: -0.03 }) },
      ],
      dof: { cInf: 10, focus: [-1.2, 0.8, 1.6] },
      cast: (t, _f, cam, out) => {
        person(cam, t, out, { id: 1, outfit: INVENTOR, at: [-1.2, 0, 1.6], mode: "sit", expr: "dazed" });
        const u = (t * 0.9) % 1;
        fx(out, `stars${Math.round(u * 30)}`, 420, 210, (p) => fxStars(p, Math.round(u * 30) / 30), [-1.2, 1.35, 1.6], 0.75, 0.375);
        const pu = Math.min(1, (t - T(150)) / 1.2);
        if (pu < 1) fx(out, `puff${Math.round(pu * 30)}`, 512, 512, (p) => fxPuff(p, pu), [0.2, 0.9, 0.8], 2.6, 2.6, { soft: true });
      },
      animate: (_t, _f, n) => { n.ring.visible = false; },
    },
    // 4. night (crossfade): high wide, everyone gone, the ring glows; slow zoom push from behind the lanterns
    {
      a: 200, b: 240, light: "night", xfade: 8,
      cams: [{ f: 196, s: (f) => zoom([5.5, 6.5, 15], [-0.5, 1.0, 0.5], 44, pushK(f, 196, 0.003)) }],
      dof: { cInf: 0 },
      cast: (t, _f, cam, out) => {
        person(cam, t, out, { id: 1, outfit: INVENTOR, at: [-1.2, 0, 1.6], expr: "smile_closed", look: 0.5 });
        const u = (t * 0.7) % 1;
        fx(out, `ring${Math.round(u * 30)}`, 600, 600, (p) => fxRing(p, Math.round(u * 30) / 30), [0, 0.03, 0], 3.4, 3.4, { flat: true });
        void hh;
      },
      animate: (t, _f, n) => { n.ring.visible = true; n.ring.rotation.y = t * 1.5; },
    },
  ],
};
