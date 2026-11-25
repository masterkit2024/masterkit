import * as THREE from "three";
import { drawPerson, PersonOpts } from "./draw2d";

export const W = 1080, H = 1920;
export const PX = H / 1920; // all pixel params scale from frame height

// ---------------- toon materials ----------------
let gradTex: THREE.DataTexture | null = null;
const gradient = () => {
  if (gradTex) return gradTex;
  const d = new Uint8Array([120, 120, 120, 255, 200, 200, 200, 255, 255, 255, 255, 255]);
  gradTex = new THREE.DataTexture(d, 3, 1, THREE.RGBAFormat);
  gradTex.minFilter = gradTex.magFilter = THREE.NearestFilter;
  gradTex.needsUpdate = true;
  return gradTex;
};
const matCache = new Map<string, THREE.Material>();
export const toon = (color: string, opts: { emissive?: string; transparent?: boolean; opacity?: number; map?: THREE.Texture } = {}) => {
  const key = color + JSON.stringify({ e: opts.emissive, t: opts.transparent, o: opts.opacity, m: opts.map?.uuid });
  if (matCache.has(key)) return matCache.get(key)!;
  const m = new THREE.MeshToonMaterial({ color, gradientMap: gradient(), emissive: opts.emissive ?? "#000000", transparent: !!opts.transparent, opacity: opts.opacity ?? 1, ...(opts.map ? { map: opts.map } : {}) });
  matCache.set(key, m);
  return m;
};

type MeshOpts = { pos?: [number, number, number]; rot?: [number, number, number]; shadow?: boolean; ink?: "ink" | "noink" | "hide"; mat?: THREE.Material };
const place = (m: THREE.Mesh, o: MeshOpts) => {
  if (o.pos) m.position.set(...o.pos);
  if (o.rot) m.rotation.set(...o.rot);
  m.castShadow = o.shadow ?? true;
  m.receiveShadow = true;
  m.userData.g = o.ink ?? "ink";
  return m;
};
export const box = (w: number, h: number, d: number, color: string, o: MeshOpts = {}) => place(new THREE.Mesh(new THREE.BoxGeometry(w, h, d), o.mat ?? toon(color)), o);
export const cyl = (rt: number, rb: number, h: number, color: string, o: MeshOpts & { seg?: number } = {}) =>
  place(new THREE.Mesh(new THREE.CylinderGeometry(rt, rb, h, o.seg ?? 24), o.mat ?? toon(color)), o);
export const sphere = (r: number, color: string, o: MeshOpts = {}) => place(new THREE.Mesh(new THREE.SphereGeometry(r, 24, 16), o.mat ?? toon(color)), o);
export const plane = (w: number, h: number, color: string, o: MeshOpts = {}) => place(new THREE.Mesh(new THREE.PlaneGeometry(w, h), o.mat ?? toon(color)), o);
export const group = (...ch: THREE.Object3D[]) => { const g = new THREE.Group(); ch.forEach((c) => g.add(c)); return g; };

/** canvas texture */
export const canvasTex = (w: number, h: number, draw: (ctx: CanvasRenderingContext2D, w: number, h: number) => void) => {
  const c = document.createElement("canvas"); c.width = w; c.height = h;
  const ctx = c.getContext("2d")!;
  draw(ctx, w, h);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 4;
  return t;
};
export const gridTex = (bg: string, line: string, cells: number, lw = 4) =>
  canvasTex(512, 512, (ctx, w, h) => {
    ctx.fillStyle = bg; ctx.fillRect(0, 0, w, h);
    ctx.strokeStyle = line; ctx.lineWidth = lw;
    for (let i = 0; i <= cells; i++) { const p = (i / cells) * w; ctx.beginPath(); ctx.moveTo(p, 0); ctx.lineTo(p, h); ctx.moveTo(0, p); ctx.lineTo(w, p); ctx.stroke(); }
  });
export const repeatTex = (t: THREE.Texture, rx: number, ry: number) => { t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(rx, ry); return t; };

// ---------------- billboards (NOINK cards) ----------------
/** generic card: plane facing camera (yaw only or full), redrawn on demand */
export class Card {
  mesh: THREE.Mesh;
  canvas: HTMLCanvasElement;
  ctx: CanvasRenderingContext2D;
  tex: THREE.CanvasTexture;
  w: number; h: number;
  face: "yaw" | "full" | "none";
  constructor(wm: number, hm: number, px = 512, face: "yaw" | "full" | "none" = "yaw") {
    this.w = wm; this.h = hm; this.face = face;
    this.canvas = document.createElement("canvas");
    this.canvas.width = px; this.canvas.height = Math.round((px * hm) / wm);
    this.ctx = this.canvas.getContext("2d")!;
    this.tex = new THREE.CanvasTexture(this.canvas);
    this.tex.colorSpace = THREE.SRGBColorSpace;
    this.tex.anisotropy = 4;
    const mat = new THREE.MeshBasicMaterial({ map: this.tex, transparent: true, alphaTest: 0.02, side: THREE.DoubleSide, toneMapped: false });
    this.mesh = new THREE.Mesh(new THREE.PlaneGeometry(wm, hm), mat);
    this.mesh.userData.g = "noink";
    this.mesh.userData.card = this;
    this.mesh.castShadow = false;
  }
  draw(fn: (ctx: CanvasRenderingContext2D, w: number, h: number) => void) {
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    fn(this.ctx, this.canvas.width, this.canvas.height);
    this.tex.needsUpdate = true;
  }
}

/** character card: height in metres of a 576-unit figure; anchor = feet */
export class Char {
  card: Card;
  root: THREE.Group;
  shadow: THREE.Mesh;
  hM: number;
  constructor(hM = 1.8, px = 640) {
    // canonical drawing area: x -420..420, y -820..100
    this.hM = hM;
    const u = hM / 576;
    this.card = new Card(840 * u, 920 * u, px, "yaw");
    this.card.mesh.position.set(0, (920 / 2 - 100) * u, 0);
    this.root = new THREE.Group();
    this.root.add(this.card.mesh);
    this.shadow = new THREE.Mesh(new THREE.CircleGeometry(0.32 * (hM / 1.8), 24), new THREE.MeshBasicMaterial({ color: "#2a1f4a", transparent: true, opacity: 0.28, depthWrite: false }));
    this.shadow.rotation.x = -Math.PI / 2;
    this.shadow.position.y = 0.01;
    this.shadow.scale.set(1.3, 0.7, 1);
    this.shadow.userData.g = "hide";
    this.root.add(this.shadow);
  }
  set(o: PersonOpts & { x: number; y?: number; z: number; visible?: boolean; opacity?: number; shadow?: boolean }) {
    this.root.visible = o.visible ?? true;
    this.root.position.set(o.x, o.y ?? 0, o.z);
    this.shadow.visible = o.shadow ?? true;
    (this.card.mesh.material as THREE.MeshBasicMaterial).opacity = o.opacity ?? 1;
    this.card.draw((ctx, w, h) => {
      const s = w / 840;
      ctx.save(); ctx.scale(s, s); ctx.translate(420, 820);
      drawPerson(ctx, o);
      ctx.restore();
    });
  }
}

// ---------------- lights ----------------
export type LightPreset = "day" | "golden" | "indoor" | "lab";
export const makeLights = (preset: LightPreset) => {
  const g = new THREE.Group();
  const P = {
    day: { az: 75, el: 48, key: "#fff6e8", ki: 2.4, sky: "#b8d0ec", gnd: "#5a4f8a", hi: 1.1, bg: "#3e7fd2", fog: "#b8d0ec" },
    golden: { az: 6, el: 12, key: "#FFB36B", ki: 2.6, sky: "#ffc47c", gnd: "#444380", hi: 1.0, bg: "#ffc47c", fog: "#e4a07a" },
    indoor: { az: 40, el: 55, key: "#fff1dc", ki: 2.0, sky: "#e6ecff", gnd: "#4a4a8a", hi: 1.25, bg: "#2a2f55", fog: "#2a2f55" },
    lab: { az: 50, el: 60, key: "#e8f0ff", ki: 1.8, sky: "#9fb4ff", gnd: "#3a2f6a", hi: 1.2, bg: "#0F1226", fog: "#0F1226" },
  }[preset];
  const d = new THREE.DirectionalLight(P.key, P.ki);
  const az = (P.az * Math.PI) / 180, el = (P.el * Math.PI) / 180;
  d.position.set(Math.sin(az) * Math.cos(el) * 30, Math.sin(el) * 30, Math.cos(az) * Math.cos(el) * 30);
  d.castShadow = true;
  d.shadow.mapSize.set(2048, 2048);
  const sc = d.shadow.camera as THREE.OrthographicCamera;
  sc.left = -14; sc.right = 14; sc.top = 14; sc.bottom = -14; sc.near = 1; sc.far = 80;
  d.shadow.bias = -0.0008;
  d.shadow.normalBias = 0.02;
  g.add(d, d.target);
  g.add(new THREE.HemisphereLight(P.sky, P.gnd, P.hi));
  return { group: g, bg: P.bg, fog: P.fog, key: d };
};

// ---------------- post: g-buffer + ink + DOF ----------------
const gVert = `varying vec3 vN; varying float vD; varying vec2 vUv;
void main(){ vUv = uv; vec4 mv = modelViewMatrix * vec4(position,1.0); vN = normalize(normalMatrix*normal); vD = -mv.z; gl_Position = projectionMatrix*mv; }`;
const gFragInk = `varying vec3 vN; varying float vD; void main(){ vec3 n = normalize(vN); if(!gl_FrontFacing) n=-n; gl_FragColor = vec4(n*0.5+0.5, vD); }`;
const gFragNoInk = `uniform sampler2D map; varying vec2 vUv; varying float vD; void main(){ float a = texture2D(map, vUv).a; if(a<0.5) discard; gl_FragColor = vec4(0.0,0.0,0.0,-vD); }`;

const quadVert = `varying vec2 vUv; void main(){ vUv = uv; gl_Position = vec4(position.xy,0.0,1.0); }`;
const inkFrag = `
uniform sampler2D tColor; uniform sampler2D tG; uniform vec2 res; uniform vec3 inkColor; uniform float wNear; uniform float wFar; uniform float farD;
varying vec2 vUv;
vec4 G(vec2 uv){ vec4 g = texture2D(tG, uv); if (g.a == 0.0) g = vec4(0.5,0.5,1.0,farD); return g; }
void main(){
  vec4 c = texture2D(tColor, vUv);
  vec4 g0 = G(vUv);
  float d0 = g0.a;
  float ink = 0.0;
  if (d0 > 0.0) {
    float k = clamp((d0 - 2.0) / 18.0, 0.0, 1.0);
    float r = mix(wNear, wFar, k) * 0.5;
    vec3 n0 = g0.rgb * 2.0 - 1.0;
    vec2 o[8];
    o[0]=vec2(1,0); o[1]=vec2(-1,0); o[2]=vec2(0,1); o[3]=vec2(0,-1);
    o[4]=vec2(0.7,0.7); o[5]=vec2(-0.7,0.7); o[6]=vec2(0.7,-0.7); o[7]=vec2(-0.7,-0.7);
    for (int i=0;i<8;i++){
      vec4 g = G(vUv + o[i]*r/res);
      if (g.a < 0.0) continue;
      float dd = abs(g.a - d0) / max(d0, 0.001);
      vec3 n = g.rgb*2.0-1.0;
      float e = 0.0;
      if (dd > 0.06) e = 1.0;
      if (g.a < farD && dot(n, n0) < 0.82) e = 1.0;
      ink = max(ink, e);
    }
  }
  gl_FragColor = vec4(mix(c.rgb, inkColor, ink), 1.0);
}`;
const dofFrag = `
uniform sampler2D tColor; uniform sampler2D tG; uniform vec2 res; uniform float focus; uniform float range; uniform float maxBlur; uniform float sat; uniform float bright;
varying vec2 vUv;
float coc(vec2 uv){ float d = abs(texture2D(tG, uv).a); if (d == 0.0) d = 900.0; return clamp(abs(d - focus) / max(range, 0.01), 0.0, 1.0); }
void main(){
  float c0 = coc(vUv) * maxBlur;
  vec3 acc = texture2D(tColor, vUv).rgb; float wsum = 1.0;
  if (c0 > 0.5) {
    for (int i = 0; i < 32; i++) {
      float fi = float(i);
      float a = fi * 2.39996;
      float rr = sqrt((fi + 0.5) / 32.0);
      vec2 uv = vUv + vec2(cos(a), sin(a)) * rr * c0 / res;
      float cs = coc(uv) * maxBlur;
      float w = clamp(cs / max(c0,0.001) + 0.15, 0.0, 1.0);
      acc += texture2D(tColor, uv).rgb * w; wsum += w;
    }
  }
  vec3 col = acc / wsum;
  float l = dot(col, vec3(0.299,0.587,0.114));
  col = mix(vec3(l), col, sat) * bright;
  gl_FragColor = vec4(col, 1.0);
  #include <tonemapping_fragment>
  #include <colorspace_fragment>
}`;

export interface CamState { pos: THREE.Vector3; look: THREE.Vector3; fov?: number; roll?: number; focus?: number; range?: number; blur?: number }

export class Engine {
  renderer: THREE.WebGLRenderer;
  rtColor: THREE.WebGLRenderTarget;
  rtG: THREE.WebGLRenderTarget;
  rtInk: THREE.WebGLRenderTarget;
  gInk: THREE.ShaderMaterial;
  inkMat: THREE.ShaderMaterial;
  dofMat: THREE.ShaderMaterial;
  quad: THREE.Mesh;
  qScene: THREE.Scene;
  qCam: THREE.OrthographicCamera;
  camera: THREE.PerspectiveCamera;
  w: number; h: number;
  constructor(canvas: HTMLCanvasElement, w: number, h: number) {
    this.w = w; this.h = h;
    this.renderer = new THREE.WebGLRenderer({ canvas, antialias: false, preserveDrawingBuffer: true, alpha: false });
    this.renderer.setPixelRatio(1);
    this.renderer.setSize(w, h, false);
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.toneMapping = THREE.NeutralToneMapping;
    this.rtColor = new THREE.WebGLRenderTarget(w, h, { samples: 4, type: THREE.HalfFloatType, colorSpace: THREE.LinearSRGBColorSpace });
    this.rtG = new THREE.WebGLRenderTarget(w, h, { type: THREE.FloatType, minFilter: THREE.NearestFilter, magFilter: THREE.NearestFilter });
    this.rtInk = new THREE.WebGLRenderTarget(w, h, { type: THREE.HalfFloatType });
    this.gInk = new THREE.ShaderMaterial({ vertexShader: gVert, fragmentShader: gFragInk, side: THREE.DoubleSide });
    const res = new THREE.Vector2(w, h);
    this.inkMat = new THREE.ShaderMaterial({
      vertexShader: quadVert, fragmentShader: inkFrag, depthTest: false, depthWrite: false,
      uniforms: { tColor: { value: null }, tG: { value: null }, res: { value: res }, inkColor: { value: new THREE.Color("#030303") }, wNear: { value: 5.1 * (h / 1920) }, wFar: { value: 3.3 * (h / 1920) }, farD: { value: 900 } },
    });
    this.dofMat = new THREE.ShaderMaterial({
      vertexShader: quadVert, fragmentShader: dofFrag, depthTest: false, depthWrite: false,
      toneMapped: true,
      uniforms: { tColor: { value: null }, tG: { value: null }, res: { value: res }, focus: { value: 5 }, range: { value: 6 }, maxBlur: { value: 0 }, sat: { value: 1 }, bright: { value: 1 } },
    });
    this.qScene = new THREE.Scene();
    this.qCam = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
    this.quad = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), this.inkMat);
    this.quad.frustumCulled = false;
    this.qScene.add(this.quad);
    this.camera = new THREE.PerspectiveCamera(40, w / h, 0.1, 400);
  }
  render(scene: THREE.Scene, cs: CamState, post: { sat?: number; bright?: number } = {}) {
    const r = this.renderer, cam = this.camera;
    cam.fov = cs.fov ?? 40;
    cam.position.copy(cs.pos);
    cam.up.set(0, 1, 0);
    cam.lookAt(cs.look);
    if (cs.roll) cam.rotateZ((cs.roll * Math.PI) / 180);
    cam.updateProjectionMatrix();
    cam.updateMatrixWorld();
    // billboards face camera (yaw)
    scene.traverse((o) => {
      const card = o.userData.card as Card | undefined;
      if (!card || card.face === "none") return;
      const wp = new THREE.Vector3(); o.getWorldPosition(wp);
      if (card.face === "yaw") {
        const parentQ = new THREE.Quaternion(); o.parent?.getWorldQuaternion(parentQ);
        const yaw = Math.atan2(cam.position.x - wp.x, cam.position.z - wp.z);
        const q = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), yaw);
        o.quaternion.copy(parentQ.invert().multiply(q));
      } else {
        o.quaternion.copy(cam.quaternion);
      }
    });
    // 1. color (linear HDR)
    r.setRenderTarget(this.rtColor);
    r.render(scene, cam);
    // 2. g-buffer
    const saved: [THREE.Mesh, THREE.Material | THREE.Material[], boolean][] = [];
    scene.traverse((o) => {
      const m = o as THREE.Mesh;
      if (!m.isMesh) return;
      saved.push([m, m.material, m.visible]);
      const g = m.userData.g ?? "ink";
      if (g === "hide") { m.visible = false; return; }
      if (g === "noink") {
        let gm = m.userData.gMat as THREE.ShaderMaterial | undefined;
        if (!gm) {
          gm = new THREE.ShaderMaterial({ vertexShader: gVert, fragmentShader: gFragNoInk, side: THREE.DoubleSide, uniforms: { map: { value: (m.material as THREE.MeshBasicMaterial).map } } });
          m.userData.gMat = gm;
        }
        m.material = gm;
      } else m.material = this.gInk;
    });
    const bg = scene.background; const fog = scene.fog;
    scene.background = null; scene.fog = null;
    r.setRenderTarget(this.rtG);
    r.setClearColor(new THREE.Color(0.5, 0.5, 1.0), 0);
    r.toneMapping = THREE.NoToneMapping;
    const sm = r.shadowMap.enabled; r.shadowMap.enabled = false;
    r.clear();
    r.render(scene, cam);
    r.shadowMap.enabled = sm;
    r.setClearColor(new THREE.Color(0, 0, 0), 1);
    scene.background = bg; scene.fog = fog;
    for (const [m, mat, v] of saved) { m.material = mat; m.visible = v; }
    // 3. ink
    r.toneMapping = THREE.NoToneMapping;
    this.quad.material = this.inkMat;
    this.inkMat.uniforms.tColor.value = this.rtColor.texture;
    this.inkMat.uniforms.tG.value = this.rtG.texture;
    r.setRenderTarget(this.rtInk);
    r.render(this.qScene, this.qCam);
    // 4. dof + grade -> screen
    this.quad.material = this.dofMat;
    const u = this.dofMat.uniforms;
    u.tColor.value = this.rtInk.texture; u.tG.value = this.rtG.texture;
    u.focus.value = cs.focus ?? 5; u.range.value = cs.range ?? 6; u.maxBlur.value = (cs.blur ?? 0) * (this.h / 1920);
    u.sat.value = post.sat ?? 1; u.bright.value = post.bright ?? 1;
    r.setRenderTarget(null);
    r.toneMapping = THREE.NeutralToneMapping;
    r.render(this.qScene, this.qCam);
  }
}

export const V = (x: number, y: number, z: number) => new THREE.Vector3(x, y, z);
