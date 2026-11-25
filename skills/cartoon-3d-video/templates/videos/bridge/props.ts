// Procedural stand-ins for the Kenney CC0 props (cart, stalls, bench, lantern, windmill, canoe, flowers, grass, lily).
// loadKit() in world.ts uses them for every GLB that is missing from public/bridge/kenney/, so the world renders
// complete without any downloaded assets. Each builder returns a Group with its base at y = 0 in arbitrary units:
// prop()/kitClone() in build.ts rescale it to the requested height and convert the materials to two-tone Lambert,
// and the world ink pass draws the outlines, so these blend with the rest of the town.
import * as THREE from "three";

const mat = (color: string) => new THREE.MeshStandardMaterial({ color: new THREE.Color(color) });
const M = {
  wood: mat("#a8724a"), woodDark: mat("#7a4f33"), plank: mat("#c99a62"), iron: mat("#3a3a40"), glass: mat("#ffe2a0"),
  red: mat("#c8463c"), cream: mat("#f2e6cc"), green: mat("#4f9a58"), stone: mat("#b7b4ad"), roof: mat("#8f5a3e"),
  sail: mat("#efe4cf"), leaf: mat("#5aa24a"), lily: mat("#6aae52"), petalR: mat("#e0524a"), petalY: mat("#f2c843"),
  petalP: mat("#9a6ad0"), centre: mat("#f4d35e"), grass: mat("#6aab4f"),
};

const box = (g: THREE.Group, m: THREE.Material, w: number, h: number, d: number, x = 0, y = 0, z = 0, ry = 0, rz = 0) => {
  const o = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), m);
  o.position.set(x, y + h / 2, z); o.rotation.set(0, ry, rz); g.add(o); return o;
};
const cyl = (g: THREE.Group, m: THREE.Material, r0: number, r1: number, h: number, x = 0, y = 0, z = 0, seg = 10) => {
  const o = new THREE.Mesh(new THREE.CylinderGeometry(r1, r0, h, seg), m);
  o.position.set(x, y + h / 2, z); g.add(o); return o;
};

const stall = (awning: THREE.Material) => () => {
  const g = new THREE.Group();
  box(g, M.wood, 2.2, 0.9, 1.0, 0, 0, 0.2);                      // counter
  box(g, M.plank, 2.3, 0.08, 1.1, 0, 0.9, 0.2);                  // counter top
  for (const x of [-1.05, 1.05]) for (const z of [-0.3, 0.65]) box(g, M.woodDark, 0.09, 2.3, 0.09, x, 0, z);
  for (let i = 0; i < 6; i++) box(g, i % 2 ? M.cream : awning, 0.4, 0.06, 1.4, -1.0 + i * 0.4, 2.3, 0.25, 0, 0.0).rotation.x = -0.22;
  for (let i = 0; i < 5; i++) cyl(g, [M.red, M.petalY, M.green][i % 3], 0.12, 0.12, 0.18, -0.8 + i * 0.4, 0.98, 0.25, 8); // goods
  return g;
};

const BUILD: Record<string, () => THREE.Group> = {
  "stall-red": stall(M.red),
  "stall-green": stall(M.green),
  "stall-bench": () => {
    const g = new THREE.Group();
    box(g, M.plank, 1.8, 0.08, 0.45, 0, 0.45, 0);
    for (const x of [-0.75, 0.75]) box(g, M.woodDark, 0.08, 0.45, 0.4, x, 0, 0);
    return g;
  },
  cart: () => {
    const g = new THREE.Group();
    box(g, M.wood, 1.6, 0.5, 1.0, 0, 0.55, 0);
    box(g, M.plank, 1.7, 0.08, 1.1, 0, 0.5, 0);
    for (const z of [-0.6, 0.6]) {
      const w = new THREE.Mesh(new THREE.CylinderGeometry(0.5, 0.5, 0.08, 14), M.woodDark);
      w.rotation.x = Math.PI / 2; w.position.set(0, 0.5, z); g.add(w);
    }
    for (const z of [-0.35, 0.35]) box(g, M.woodDark, 1.4, 0.06, 0.06, 1.4, 0.7, z);   // shafts
    return g;
  },
  lantern: () => {
    const g = new THREE.Group();
    cyl(g, M.iron, 0.12, 0.08, 0.2);
    cyl(g, M.iron, 0.05, 0.05, 2.3, 0, 0.2);
    box(g, M.glass, 0.26, 0.34, 0.26, 0, 2.5);
    cyl(g, M.iron, 0.24, 0.02, 0.22, 0, 2.84, 0, 4);
    return g;
  },
  windmill: () => {
    const g = new THREE.Group();
    cyl(g, M.stone, 2.4, 1.6, 9, 0, 0, 0, 12);
    cyl(g, M.roof, 1.8, 0.05, 2.6, 0, 9, 0, 12);
    const hub = new THREE.Group(); hub.position.set(0, 9.6, 1.9); g.add(hub);
    for (let i = 0; i < 4; i++) {
      const arm = new THREE.Group(); arm.rotation.z = i * Math.PI / 2 + 0.3; hub.add(arm);
      const spar = new THREE.Mesh(new THREE.BoxGeometry(0.18, 6, 0.12), M.woodDark); spar.position.y = 3; arm.add(spar);
      const sail = new THREE.Mesh(new THREE.BoxGeometry(1.1, 4.6, 0.05), M.sail); sail.position.set(0.65, 3.4, 0); arm.add(sail);
    }
    box(g, M.woodDark, 1.0, 1.8, 0.1, 0, 0, 2.3);                   // door
    return g;
  },
  canoe: () => {
    const g = new THREE.Group();
    const hull = new THREE.Mesh(new THREE.SphereGeometry(1, 16, 8, 0, Math.PI * 2, Math.PI / 2, Math.PI / 2), M.wood);
    hull.scale.set(0.45, 0.35, 2.0); hull.position.y = 0.35; g.add(hull);
    box(g, M.plank, 0.8, 0.05, 0.25, 0, 0.25, 0.4);
    box(g, M.plank, 0.8, 0.05, 0.25, 0, 0.25, -0.5);
    return g;
  },
  lily_large: () => {
    const g = new THREE.Group();
    const pad = new THREE.Mesh(new THREE.CylinderGeometry(1, 1, 0.05, 18, 1, false, 0.4, Math.PI * 2 - 0.5), M.lily);
    pad.position.y = 0.025; g.add(pad);
    return g;
  },
  grass: () => tuft(3, 0.6),
  grass_large: () => tuft(5, 1.0),
};
function tuft(n: number, h: number) {
  const g = new THREE.Group();
  for (let i = 0; i < n; i++) {
    const b = new THREE.Mesh(new THREE.ConeGeometry(0.08, h * (0.7 + 0.3 * ((i * 37) % 10) / 10), 4), M.grass);
    const a = (i / n) * Math.PI * 2;
    b.position.set(Math.cos(a) * 0.12, h / 2, Math.sin(a) * 0.12); b.rotation.z = Math.cos(a) * 0.25; b.rotation.x = Math.sin(a) * 0.25;
    g.add(b);
  }
  return g;
}
const flower = (petal: THREE.Material) => () => {
  const g = new THREE.Group();
  for (let k = 0; k < 3; k++) {
    const x = (k - 1) * 0.25, z = (k % 2) * 0.15, h = 0.5 + k * 0.08;
    cyl(g, M.leaf, 0.02, 0.02, h, x, 0, z, 5);
    for (let i = 0; i < 5; i++) {
      const p = new THREE.Mesh(new THREE.SphereGeometry(0.07, 6, 4), petal);
      const a = (i / 5) * Math.PI * 2;
      p.position.set(x + Math.cos(a) * 0.08, h, z + Math.sin(a) * 0.08); g.add(p);
    }
    const c = new THREE.Mesh(new THREE.SphereGeometry(0.05, 6, 4), M.centre); c.position.set(x, h + 0.02, z); g.add(c);
  }
  return g;
};
BUILD.flower_redA = flower(M.petalR);
BUILD.flower_yellowA = flower(M.petalY);
BUILD.flower_purpleA = flower(M.petalP);

/** a code-built stand-in for a missing Kenney model (null for names without one; trees/bushes/hedges/banners never
 *  need one: build.ts draws those itself) */
export const fallbackProp = (name: string): THREE.Object3D | null => {
  const make = BUILD[name];
  if (!make) return null;
  const g = make();
  g.name = `fallback:${name}`;
  g.updateMatrixWorld(true);
  return g;
};
