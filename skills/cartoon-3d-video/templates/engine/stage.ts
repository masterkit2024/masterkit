// The style's world, topic-independent: sky gradient, sun / moon disc, clouds, camera-relative two-tone light rig,
// fog = horizon colour, shadows, painted HD textures, houses / props / plants, character cards and effect cards.
// A video (src/videos/<name>/video.ts) supplies a VideoSpec: a set builder (static scenery) and a list of shots
// (frames, light preset, camera keys, depth of field, cast per frame). Stage.update() poses everything for one shot
// at one frame as a pure function of (shot, frame), so Remotion can render frames in any order.
import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { getStaticFiles, staticFile } from "remotion";
import { fallbackProp } from "./props";
import { Batch, Kit, Ray, V, lam, boxGeo, quad, tri, house as houseRaw, prop as propRaw, kitClone, setSight, flagTex } from "./build";
import { ctex, grassHD, cobbleHD, stoneHD, planksHD, roofHD, facadeHD, cloudHD, waterNear, rep } from "./paint";
import { Pen } from "./toon";
import { LIGHTS, LOOK, LightName, LightPreset } from "./lights";
import { TONE, CHAR, twoTone, untone } from "./shade";
import { NOINK } from "./ink";
import { Pool, Actor, Fx, Cast, CamInfo } from "./actors";
import { Key, V3, Cam, runKeys, kickAt, withKick, FPS } from "./camera";

// ---------------- the video description ----------------
export type Dof = { cInf: number; focus?: V3 };
export type ShotSpec = {
  /** first frame (inclusive) and end frame (exclusive) of the shot in the video */
  a: number; b: number;
  light: LightName;
  /** camera keys in VIDEO frames (camera.ts: hold / dolly / zoom / glides / cuts) */
  cams: Key[];
  /** sun override in degrees, camera-relative: az 0 = backlight, 90 = from screen right, 180 = from behind the camera */
  sunAz?: number; sunEl?: number;
  /** lens blur: cInf px at 1080 (0 = sharp; CU 12-16, MS 10-12, wide 0) and focus point (default: camera look point) */
  dof?: Dof | ((f: number) => Dof);
  /** characters and effect cards at time t (s, video time) / frame f: call person(), fx() from actors.ts */
  cast?: (t: number, f: number, cam: CamInfo, out: Cast) => void;
  /** animate set objects (doors, machines, vehicles) registered with set.named() */
  animate?: (t: number, f: number, named: Record<string, THREE.Object3D>) => void;
  /** frames of crossfade INTO this shot (6-8 at place/time changes) and a white 4-frame flash at its first frame */
  xfade?: number; flash?: boolean;
  /** hide the clouds (interiors, close skies) */
  noClouds?: boolean;
};
export type VideoSpec = {
  frames: number;
  shots: ShotSpec[];
  /** build the static scenery once (StageSet API below); every shot sees the same world */
  build: (set: StageSet) => void;
  /** impact kicks [time s, strength 0.5-1.6] */
  kicks?: [number, number][];
  /** background colour behind the canvas (only visible if the sky is hidden) */
  bg?: string;
};

// ---------------- Kenney models (optional) ----------------
const KENNEY = ["lantern", "cart", "stall-red", "stall-green", "stall-bench", "windmill", "canoe", "flower_redA", "flower_yellowA", "flower_purpleA",
  "grass_large", "grass", "lily_large"];
let kitP: Promise<Kit> | null = null;
/** loads public/kenney/<name>.glb when present, else the code-built stand-ins from props.ts (no downloads needed) */
export const loadKit = (): Promise<Kit> => {
  if (!kitP) {
    const loader = new GLTFLoader();
    // only ask for GLBs that exist in public/kenney/ (no 404 noise when they are absent)
    const have = new Set(getStaticFiles().map((f) => f.name));
    kitP = Promise.all(KENNEY.map((n) => !have.has(`kenney/${n}.glb`) ? Promise.resolve([n, null] as const) : loader.loadAsync(staticFile(`kenney/${n}.glb`)).then((g) => [n, g.scene] as const).catch(() => [n, null] as const)))
      .then((list) => Object.fromEntries(list.map(([n, s]) => [n, s ?? fallbackProp(n)] as const).filter((e) => e[1]).map(([n, s]) => [n, s!])) as Kit);
  }
  return kitP;
};

// ---------------- scenery builder ----------------
const HOUSE_STYLES = 8;
/** what video.build() gets: paint the ground, place houses, plants, props, boxes and named movable objects */
export class StageSet {
  readonly root: THREE.Group;
  readonly batch = new Batch();
  readonly named: Record<string, THREE.Object3D> = {};
  constructor(root: THREE.Group, readonly kit: Kit) { this.root = root; }
  /** painted two-tone materials of the style (cached by key) */
  mat = {
    grass: () => lam("grassHD", () => ({ map: grassHD() })),
    cobble: () => lam("cobbleHD", () => ({ map: cobbleHD() })),
    stone: () => lam("stoneWarm", () => ({ map: stoneHD("stoneWarm", ["#c9bcaa", "#bfb19f", "#d1c5b4", "#b8aa97"], "#958776") })),
    lightStone: () => lam("stoneLight", () => ({ map: stoneHD("stoneLight", ["#e6dccd", "#ddd3c3", "#ece4d6", "#d6cbba"], "#aea293") })),
    planks: () => lam("planksHD", () => ({ map: planksHD() })),
    water: () => lam("waterFlat", () => ({ map: waterNear(), color: "#9fd8ff" })),
    roof: (col = "#b5653f") => lam("roof" + col, () => ({ map: roofHD(col, col === "#8f97a8"), side: THREE.DoubleSide })),
    facade: (key: string, wm: number, hm: number, o: { wall: string; shutter: string; door?: boolean; timber?: boolean; brick?: boolean }) =>
      lam("fac" + key, () => ({ map: facadeHD("fac" + key, wm, hm, o) })),
    /** flat painted colour (use the style palette: muted brick / cream / ochre / terracotta, never lemon or lavender) */
    color: (hex: string) => lam("c" + hex, () => ({ color: hex })),
    /** a soft painted-metal (iron, machines) */
    metal: (hex = "#3d414c") => twoTone(new THREE.MeshPhongMaterial({ color: hex, specular: "#8a8a8a", shininess: 60 }), 0.15),
    /** self-lit (screens, lamps, portals; > 1 values bloom): never use for walls */
    glow: (hex: string, k = 2) => new THREE.MeshBasicMaterial({ color: new THREE.Color(hex).multiplyScalar(k), toneMapped: true }),
  };
  /** horizontal ground patch with a texture repeated every `tile` metres */
  ground(m: THREE.Material, x0: number, x1: number, z0: number, z1: number, y = 0, tile = 4) {
    this.batch.add(quad(V(x0, y, z1), V(x1, y, z1), V(x1, y, z0), V(x0, y, z0), (x1 - x0) / tile, (z1 - z0) / tile), m);
  }
  /** vertical wall quad from (x0,z0) to (x1,z1), height h from y; the face looks to the left of the a->b direction */
  wall(m: THREE.Material, x0: number, z0: number, x1: number, z1: number, y: number, h: number, tile = 3) {
    const L = Math.hypot(x1 - x0, z1 - z0);
    this.batch.add(quad(V(x0, y, z0), V(x1, y, z1), V(x1, y + h, z1), V(x0, y + h, z0), L / tile, h / tile), m);
  }
  /** axis-aligned box from min to max corner (bevel 0-6 = rounded edges catch the ink nicer) */
  box(m: THREE.Material, min: V3, max: V3, bevel = 2) { this.batch.add(boxGeo(V(...min), V(...max), bevel), m); }
  /** any geometry with a matrix (cylinders, cones, spheres) */
  geo(g: THREE.BufferGeometry, m: THREE.Material, at: V3 = [0, 0, 0], rotY = 0, scale: V3 = [1, 1, 1]) {
    this.batch.add(g, m, new THREE.Matrix4().compose(V(...at), new THREE.Quaternion().setFromAxisAngle(V(0, 1, 0), rotY), V(...scale)));
  }
  /** gabled storybook house: front (local +z) w wide, d deep, wall height h (7 / 8.4 / 9.8 m), style 0-7, base y */
  house(x: number, z: number, yaw: number, w = 8, d = 8, h = 8.4, style = 0, y = 0) { houseRaw(this.batch, x, z, yaw, w, d, h, style % HOUSE_STYLES, y); }
  /** a row of houses along x from x0 to x1 at z, fronts facing +z (yaw 0) or -z (yaw PI) */
  street(x0: number, x1: number, z: number, yaw: number, y = 0, seed = 1) {
    let x = x0, i = seed;
    while (x < x1) {
      const w = [7, 9, 8][i % 3], h = [7, 8.4, 9.8][(i * 7) % 3];
      this.house(x + w / 2, z, yaw, w, 8, h, (i * 5) % HOUSE_STYLES, y);
      x += w + (i % 4 === 0 ? 2.5 : 0.25); i++;
    }
  }
  /** plant or prop of height h: plants "tree_oak", "tree_default", "tree_detailed", "tree_fat", "tree_cone", "tree-high-round",
   *  "tree", "plant_bushLarge", "plant_bushDetailed", "plant_bush", "hedge" (drawn as cartoon foliage); props "lantern",
   *  "cart", "stall-red", "stall-green", "stall-bench", "windmill", "canoe", "flower_redA", "flower_yellowA", "flower_purpleA",
   *  "grass", "grass_large", "lily_large", "banner-red", "banner-green" */
  prop(name: string, x: number, y: number, z: number, h: number, yaw = 0) { propRaw(this.batch, this.kit, name, x, y, z, h, yaw); }
  /** a separate object you can move per frame in shot.animate(named): built from its own batch */
  named_(name: string, build: (b: Batch) => void, at: V3 = [0, 0, 0]) {
    const g = new THREE.Group(), b = new Batch();
    build(b); b.build(g);
    g.position.set(...at); this.root.add(g); this.named[name] = g;
    return g;
  }
  /** a 2D painted card standing in the world (signs, posters, screens, user photos): drawn with the toon Pen or an image */
  card(name: string, wm: number, hm: number, at: V3, rotY: number, draw: ((p: Pen) => void) | string, px = 1024) {
    const tex = typeof draw === "string"
      ? new THREE.TextureLoader().load(staticFile(draw))
      : ctex("card" + name, px, Math.round((px * hm) / wm), (g) => draw(new Pen(g)));
    tex.colorSpace = THREE.SRGBColorSpace;
    const m = new THREE.Mesh(new THREE.PlaneGeometry(wm, hm), new THREE.MeshBasicMaterial({ map: tex, alphaTest: 0.5, color: 0xe6e6e6, side: THREE.DoubleSide }));
    m.position.set(...at); m.rotation.y = rotY; m.layers.set(NOINK);
    this.root.add(m); this.named[name] = m;
    return m;
  }
  /** a flag on a pole (country flags must match the era) */
  flag(x: number, y: number, z: number, draw: (g: CanvasRenderingContext2D, w: number, h: number) => void) {
    const pole = lam("flagpole", () => ({ color: "#7a4f33" }));
    this.box(pole, [x - 0.06, y, z - 0.06], [x + 0.06, y + 6, z + 0.06], 0);
    const tex = ctex("flag" + x + z, 256, 160, (g) => draw(g, 256, 160));
    const m = new THREE.Mesh(new THREE.PlaneGeometry(1.6, 1.0), new THREE.MeshLambertMaterial({ map: tex, side: THREE.DoubleSide }));
    m.position.set(x + 0.86, y + 5.4, z); this.root.add(m);
    void flagTex;
  }
  finish() { this.batch.build(this.root); }
}
export { kitClone, rep, tri };

// ---------------- sky pieces ----------------
const discTex = () => ctex("sunDisc", 128, 128, (g) => {
  const gr = g.createRadialGradient(64, 64, 58, 64, 64, 64); gr.addColorStop(0, "rgba(255,255,255,1)"); gr.addColorStop(1, "rgba(255,255,255,0)");
  g.fillStyle = gr; g.fillRect(0, 0, 128, 128);
});
const haloTex = () => ctex("sunHalo", 256, 256, (g) => {
  const im = g.createImageData(256, 256);
  for (let y = 0; y < 256; y++) for (let x = 0; x < 256; x++) {
    const u = Math.hypot(x - 127.5, y - 127.5) / 128;
    const a = (0.55 * Math.exp(-((u / 0.25) ** 2)) + 0.35 * Math.exp(-((u / 0.6) ** 2))) * (1 - Math.min(1, Math.max(0, (u - 0.8) / 0.2)));
    const i = (y * 256 + x) * 4; im.data[i] = im.data[i + 1] = im.data[i + 2] = 255; im.data[i + 3] = Math.round(255 * Math.min(1, a));
  }
  g.putImageData(im, 0, 0);
});

export const camOfShot = (spec: VideoSpec, s: ShotSpec, f: number): Cam => withKick(runKeys(s.cams, f), kickAt(spec.kicks ?? [], f / FPS));

/** every lens position of the video looking at its subject: houses / props on these lines are left out */
const sightLines = (spec: VideoSpec): Ray[] => {
  const out: Ray[] = [];
  for (const s of spec.shots) for (let f = s.a; f < s.b; f += 3) {
    const c = runKeys(s.cams, f), o = V(...c.pos), look = V(...c.look);
    const fw = look.clone().sub(o), len = fw.length();
    fw.normalize();
    const rt = fw.clone().cross(V(0, 1, 0)).normalize(), up = rt.clone().cross(fw);
    const ty = Math.tan((c.fov * Math.PI) / 360), tx = ty * (9 / 16);
    for (const [sx, sy] of [[0, 0], [-0.6, 0], [0.6, 0], [0, 0.6], [0, -0.4]])
      out.push({ o, d: fw.clone().addScaledVector(rt, sx * tx).addScaledVector(up, sy * ty), len, core: sx === 0 && sy === 0 });
  }
  return out;
};

// ---------------- the stage ----------------
export class Stage {
  root = new THREE.Group();
  named: Record<string, THREE.Object3D> = {};
  private pool = new Pool();
  private actors: Actor[] = [];
  private fxs: Fx[] = [];
  private hemi: THREE.HemisphereLight; private sun: THREE.DirectionalLight;
  private sky: THREE.Mesh; private skyMat: THREE.ShaderMaterial;
  private fog = new THREE.Fog("#bccbec", 25, 420);
  private sunDisc: THREE.Sprite; private sunHalo: THREE.Sprite;
  private sunCache = new Map<number, THREE.Vector3>();
  private cloudMaps: Record<LightName, THREE.Texture[]>;
  private clouds: THREE.Mesh[] = [];
  private frustum = new THREE.Frustum();
  private m4 = new THREE.Matrix4(); private v = new THREE.Vector3(); private sph = new THREE.Sphere();

  constructor(readonly spec: VideoSpec, kit: Kit) {
    const R = this.root;
    this.skyMat = new THREE.ShaderMaterial({
      uniforms: { c0: { value: new THREE.Color() }, c1: { value: new THREE.Color() }, c2: { value: new THREE.Color() },
        c3: { value: new THREE.Color() }, c4: { value: new THREE.Color() }, e: { value: new THREE.Vector4() } },
      vertexShader: "varying vec3 vP; void main(){ vP = normalize(position); gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }",
      fragmentShader: `uniform vec3 c0, c1, c2, c3, c4; uniform vec4 e; varying vec3 vP;
        void main(){ float el = asin(clamp(normalize(vP).y, -1.0, 1.0));
          vec3 c = mix(c0, c1, smoothstep(0.0, e.x, el));
          c = mix(c, c2, smoothstep(e.x, e.y, el));
          c = mix(c, c3, smoothstep(e.y, e.z, el));
          c = mix(c, c4, smoothstep(e.z, e.w, el));
          gl_FragColor = vec4(c, 1.0); }`,
      side: THREE.BackSide, depthWrite: false, fog: false,
    });
    this.sky = new THREE.Mesh(new THREE.SphereGeometry(1100, 48, 24), this.skyMat);
    this.sky.renderOrder = -1; this.sky.frustumCulled = false; this.sky.layers.set(NOINK);
    R.add(this.sky);
    this.sunDisc = new THREE.Sprite(new THREE.SpriteMaterial({ map: discTex(), color: new THREE.Color(6.0, 4.4, 2.4), fog: false, depthWrite: false }));
    this.sunHalo = new THREE.Sprite(new THREE.SpriteMaterial({ map: haloTex(), color: new THREE.Color(1, 1, 1), fog: false, depthWrite: false, depthTest: true,
      transparent: true, blending: THREE.AdditiveBlending }));
    this.sunDisc.renderOrder = -0.5; this.sunHalo.renderOrder = 5;
    for (const m of [this.sunDisc, this.sunHalo]) { m.frustumCulled = false; m.layers.set(NOINK); R.add(m); }
    this.hemi = new THREE.HemisphereLight("#cfe6ff", "#6c5c8c", 1.1);
    this.sun = new THREE.DirectionalLight("#fff0d6", 2.6);
    this.sun.castShadow = true;
    this.sun.shadow.mapSize.set(4096, 4096);
    R.add(this.hemi, this.sun, this.sun.target);
    const L3 = Object.keys(LOOK) as LightName[];
    this.cloudMaps = Object.fromEntries(L3.map((n) => [n, [0, 1, 2, 3].map((k) => cloudHD(k, LOOK[n].cloud))])) as unknown as Record<LightName, THREE.Texture[]>;
    for (let i = 0; i < 9; i++) {
      const a = (i / 9) * Math.PI * 2 + 0.3, d = 620 + (i % 3) * 60;
      const m = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), new THREE.MeshBasicMaterial({ map: this.cloudMaps.day[i % 4], color: new THREE.Color(1.1, 1.1, 1.1), transparent: true, depthWrite: false, fog: false }));
      const w = 130 + (i % 4) * 30;
      m.position.set(Math.cos(a) * d, 120 + (i % 4) * 38, Math.sin(a) * d); m.scale.set(w, w / 2, 1);
      m.layers.set(NOINK);
      this.clouds.push(m); R.add(m);
    }
    // scenery: anything standing on a camera's sight line is left out (setSight)
    setSight(sightLines(spec));
    const set = new StageSet(R, kit);
    spec.build(set);
    set.finish();
    setSight([]);
    this.named = set.named;
  }

  /** camera-relative sun, frozen per shot: the shot's mean view direction turned by az toward screen right, lifted by el */
  private shotSun(i: number, s: ShotSpec, L: LightPreset) {
    let v = this.sunCache.get(i);
    if (v) return v;
    let fx = 0, fz = 0;
    for (let f = s.a; f < s.b; f += 3) {
      const c = runKeys(s.cams, f), x = c.look[0] - c.pos[0], z = c.look[2] - c.pos[2], n = Math.hypot(x, z) || 1;
      fx += x / n; fz += z / n;
    }
    const n = Math.hypot(fx, fz) || 1; fx /= n; fz /= n;
    const az = THREE.MathUtils.degToRad(s.sunAz ?? L.az), el = THREE.MathUtils.degToRad(s.sunEl ?? L.el);
    const hx = fx * Math.cos(az) - fz * Math.sin(az), hz = fz * Math.cos(az) + fx * Math.sin(az);
    v = new THREE.Vector3(hx * Math.cos(el), Math.sin(el), hz * Math.cos(el)).normalize();
    this.sunCache.set(i, v);
    return v;
  }
  private actor(i: number) { while (this.actors.length <= i) this.actors.push(new Actor(this.root)); return this.actors[i]; }
  private fx(i: number) { while (this.fxs.length <= i) this.fxs.push(new Fx(this.root)); return this.fxs[i]; }

  /** pose the world for shot index i at video frame f; returns the camera look point (default focus) */
  update(i: number, f: number, cam: THREE.PerspectiveCamera, scene: THREE.Scene) {
    const s = this.spec.shots[i], t = f / FPS, L = LIGHTS[s.light], K = LOOK[s.light];
    const c = camOfShot(this.spec, s, f);
    cam.position.set(...c.pos); cam.up.set(0, 1, 0); cam.lookAt(...c.look); cam.rotateZ(c.roll);
    cam.fov = c.fov; cam.near = 0.2; cam.far = 1500; cam.updateProjectionMatrix(); cam.updateMatrixWorld();
    const focus = V(...c.look), dist = cam.position.distanceTo(focus);
    cam.layers.enable(NOINK);
    // light rig: camera-relative sun frozen per shot, two-tone uniforms, shadow box fitted to the framing
    const sunDir = this.shotSun(i, s, L);
    this.hemi.color.set(L.sky); this.hemi.groundColor.set(L.ground); this.hemi.intensity = L.hemiI;
    this.sun.color.set(L.sunCol); this.sun.intensity = L.sunI;
    let Rr = THREE.MathUtils.clamp(dist * 1.15 + 7, 12, 95);
    if (s.light !== "day") Rr = Math.max(Rr, 30);
    this.sun.position.copy(focus).addScaledVector(sunDir, 220); this.sun.target.position.copy(focus);
    const sc = this.sun.shadow.camera;
    sc.left = -Rr; sc.right = Rr; sc.top = Rr; sc.bottom = -Rr; sc.near = 20; sc.far = 480; sc.updateProjectionMatrix();
    this.sun.shadow.bias = L.bias; this.sun.shadow.normalBias = L.normalBias * (Rr / 12);
    TONE.uLitCol.value.set(...L.lit); TONE.uShadeCol.value.set(...L.shade); TONE.uShadeLift.value.set(...L.lift);
    TONE.uLambert.value = L.lambert; TONE.uSideK.value = L.sideK; TONE.uTerm.value = L.term; TONE.uBounce.value.set(...K.bounce); TONE.uSat.value = K.sat;
    CHAR.uCharTint.value.set(...L.charTint); CHAR.uCharShade.value = L.charShade; CHAR.uGrad.value = L.charGrad;
    CHAR.uBodyGrad.value = L.bodyGrad; CHAR.uSideTint.value.set(...L.sideTint);
    // sky, fog (= horizon colour), sun / moon disc, clouds
    const su = this.skyMat.uniforms;
    K.sky.c.forEach((h, k) => untone(h, su["c" + k].value));
    const e = K.sky.e.map((deg) => THREE.MathUtils.degToRad(deg));
    su.e.value.set(e[1], e[2], e[3], e[4]);
    this.sky.position.copy(cam.position);
    untone(L.fog, this.fog.color); this.fog.near = L.fogNear; this.fog.far = L.fogFar;
    scene.fog = this.fog; scene.background = null;
    const showSun = s.light !== "day";
    this.sunDisc.visible = this.sunHalo.visible = showSun;
    if (showSun) {
      const moon = s.light === "night";
      this.sunDisc.position.copy(cam.position).addScaledVector(sunDir, 900);
      this.sunDisc.scale.setScalar(2 * 900 * Math.tan(THREE.MathUtils.degToRad(moon ? 1.3 : 1.7)));
      (this.sunDisc.material as THREE.SpriteMaterial).color.set(moon ? new THREE.Color(2.2, 2.3, 2.6) : new THREE.Color(6.0, 4.4, 2.4));
      this.sunHalo.position.copy(this.sunDisc.position); this.sunHalo.scale.setScalar(2 * 900 * Math.tan(THREE.MathUtils.degToRad(moon ? 9 : 24)));
      (this.sunHalo.material as THREE.SpriteMaterial).color.set(L.sunDisc).multiplyScalar(moon ? 0.35 : 1.3);
    }
    for (let k = 0; k < this.clouds.length; k++) {
      const m = this.clouds[k], mat = m.material as THREE.MeshBasicMaterial;
      m.visible = !s.noClouds;
      m.lookAt(cam.position.x, m.position.y, cam.position.z);
      mat.map = this.cloudMaps[s.light][k % 4];
    }
    s.animate?.(t, f, this.named);
    // cast + effects
    const right = V(0, 0, 0).setFromMatrixColumn(cam.matrixWorld, 0);
    const info: CamInfo = { pos: cam.position.clone(), right, sun: sunDir.clone(), light: s.light };
    const st: Cast = { places: [], fx: [] };
    s.cast?.(t, f, info, st);
    this.frustum.setFromProjectionMatrix(this.m4.multiplyMatrices(cam.projectionMatrix, cam.matrixWorldInverse));
    let ai = 0;
    const used: Actor[] = [];
    for (const p of st.places) {
      const sc2 = p.scale ?? 1;
      if (!this.frustum.intersectsSphere(this.sph.set(this.v.set(p.x, p.y + 1.1 * sc2, p.z), 3.5))) continue;
      const a = this.actor(ai++);
      const [w, h, k] = p.size ?? [300, 500, 0.5];
      a.r = this.pool.req(p.key, w, h, k, p.draw);
      a.mesh.visible = true;
      a.mesh.position.set(p.x, p.y, p.z);
      a.mesh.rotation.set(0, p.yaw ?? Math.atan2(cam.position.x - p.x, cam.position.z - p.z), p.roll ?? 0);
      a.mesh.scale.set(p.mirror ? -sc2 : sc2, sc2, sc2);
      a.mesh.castShadow = L.actorShadow;
      used.push(a);
    }
    for (let k = ai; k < this.actors.length; k++) this.actors[k].mesh.visible = false;
    let fi = 0;
    const fused: Fx[] = [];
    for (const p of st.fx) {
      if (!this.frustum.intersectsSphere(this.sph.set(this.v.set(p.x, p.y, p.z), Math.max(p.w, p.h)))) continue;
      const ef = this.fx(fi++);
      ef.r = this.pool.req(p.key, p.cw, p.ch, 1, p.draw);
      ef.use(!!p.soft);
      ef.mesh.visible = true;
      ef.mesh.position.set(p.x, p.y, p.z);
      if (p.flat) ef.mesh.rotation.set(-Math.PI / 2, 0, p.rot ?? 0);
      else { ef.mesh.quaternion.copy(cam.quaternion); ef.mesh.rotateZ(p.rot ?? 0); }
      ef.mesh.scale.set(p.w, p.h, 1);
      fused.push(ef);
    }
    for (let k = fi; k < this.fxs.length; k++) this.fxs[k].mesh.visible = false;
    this.pool.flush();
    for (const a of used) a.bind();
    for (const e2 of fused) e2.bind();
    return focus;
  }
}
