// The style's Remotion composition for ANY video: one three.js Stage posed per frame from a VideoSpec, rendered through
// the style's post chain: render -> ink (world outlines) -> lens blur pre + main (DOF) -> [bloom (emissive only) +
// NEUTRAL tone mapping + colour grade per light preset], MSAA 4. Every pixel-sized parameter is specified at 1080x1920
// and scales with the output, so 0.5-scale stills and the 1440x2560 final look the same.
// Shots with `xfade` crossfade in (a second canvas for the fade frames); `flash` adds a 4-frame white flash.
// Usage (src/Root.tsx):  const V = makeVideo(SPEC);  <Composition id="MyVideo" component={V.Component} durationInFrames={V.frames} .../>
import React, { useEffect, useMemo, useState } from "react";
import * as THREE from "three";
import { AbsoluteFill, continueRender, delayRender, getInputProps, useCurrentFrame } from "remotion";
import { ThreeCanvas } from "@remotion/three";
import { useFrame, useThree } from "@react-three/fiber";
import { BlendFunction, BloomEffect, EffectComposer, EffectPass, RenderPass, ToneMappingEffect, ToneMappingMode, Effect } from "postprocessing";
import { InkPass, noInkFallback } from "./ink";
import { LensBlur, GrainEffect } from "./lensblur";
import { GradeEffect, GRADES, GRADE_STRENGTH, gradeFor } from "./grade";
import type { Kit } from "./build";
import { Stage, VideoSpec, loadKit, Dof } from "./stage";

/** A/B switches for test stills only (inputProps `{ post: { ink: false, ... } }`); everything is on by default */
type PostToggles = { ink: boolean; lens: boolean; pre: boolean; bloom: boolean; grade: boolean; grain: boolean };
const toggles = (): PostToggles => ({ ink: true, lens: true, pre: true, bloom: true, grade: true, grain: false, ...((getInputProps() as { post?: Partial<PostToggles> }).post ?? {}) });

/** bloom for emissive sources only (threshold 1.0); its MIP chain always starts at 540x960 so the glow keeps its size */
const makeBloom = () => {
  const b = new BloomEffect({ blendFunction: BlendFunction.ADD, intensity: 0.5, luminanceThreshold: 1.0, luminanceSmoothing: 0.2, mipmapBlur: true, levels: 6, radius: 0.6 });
  const mip = b.mipmapBlurPass;
  const setSize = mip.setSize.bind(mip);
  mip.setSize = (w: number, h: number) => setSize(Math.round((1920 * w) / Math.max(h, 1)), 1920);
  return b;
};

const fwd = new THREE.Vector3(), fpt = new THREE.Vector3();
const dofOf = (d: ShotDof, f: number): Dof => (typeof d === "function" ? d(f) : d ?? { cInf: 0 });
type ShotDof = VideoSpec["shots"][number]["dof"];

const useKit = () => {
  const [kit, setKit] = useState<Kit | null>(null);
  const [handle] = useState(() => delayRender("style kit"));
  useEffect(() => { loadKit().then((k) => { setKit(k); continueRender(handle); }); }, [handle]);
  return kit;
};

const Inner: React.FC<{ spec: VideoSpec; shot: number; kit: Kit }> = ({ spec, shot, kit }) => {
  const f = useCurrentFrame();
  const { camera, scene, gl, size } = useThree();
  const stage = useMemo(() => new Stage(spec, kit), [spec, kit]);
  const on = useMemo(toggles, []);
  const fx = useMemo(() => ({
    ink: new InkPass(scene, camera as THREE.PerspectiveCamera),
    lens: new LensBlur({ maxCoC: 24, nearScale: 1.2 }),
    bloom: makeBloom(),
    tone: new ToneMappingEffect({ mode: ToneMappingMode.NEUTRAL }),
    grade: new GradeEffect(GRADES.day, GRADE_STRENGTH.day),
    grain: new GrainEffect({ amount: 0.025, cellPx: 1.5 }),
  }), [camera, scene]);
  useEffect(() => () => fx.ink.dispose(), [fx]);
  // Our own composer: <EffectComposer> from @react-three/postprocessing draws an empty frame with R3F 9 in headless renders.
  const composer = useMemo(() => {
    const c = new EffectComposer(gl, { multisampling: 4, frameBufferType: THREE.HalfFloatType });
    c.addPass(new RenderPass(scene, camera));
    if (on.ink) c.addPass(fx.ink);
    if (on.lens && on.pre) c.addPass(new EffectPass(camera, fx.lens.pre));
    if (on.lens) c.addPass(new EffectPass(camera, fx.lens.main));
    const tail = [on.bloom ? fx.bloom : null, fx.tone, on.grade ? fx.grade : null, on.grain ? fx.grain : null].filter(Boolean) as Effect[];
    c.addPass(new EffectPass(camera, ...tail));
    return c;
  }, [gl, scene, camera, fx, on]);
  useEffect(() => { composer.setSize(size.width, size.height); }, [composer, size.width, size.height]);
  useFrame((_, dt) => composer.render(dt), 1);
  const cam = camera as THREE.PerspectiveCamera;
  const s = spec.shots[shot];
  const target = stage.update(shot, f, cam, scene);
  noInkFallback(stage.root);
  const d = dofOf(s.dof, f);
  cam.getWorldDirection(fwd);
  if (d.focus) fpt.set(...d.focus); else fpt.copy(target);
  fx.lens.focus = Math.max(0.3, fpt.sub(cam.position).dot(fwd));
  fx.lens.cInf = d.cInf;
  gradeFor(fx.grade, s.light);
  fx.grain.seed = f;
  return <primitive object={stage.root} dispose={null} />;
};

const dprOverride = () => (getInputProps() as { post?: { dpr?: number } }).post?.dpr;
const ShotView: React.FC<{ spec: VideoSpec; shot: number; kit: Kit; alpha: number }> = ({ spec, shot, kit, alpha }) => (
  <AbsoluteFill style={{ opacity: alpha }}>
    <ThreeCanvas width={1080} height={1920} {...(dprOverride() ? { dpr: dprOverride() } : {})} shadows
      gl={{ antialias: false, stencil: false, powerPreference: "high-performance", toneMappingExposure: 1.0 }}
      camera={{ fov: 40, near: 0.2, far: 1500 }}>
      <Inner spec={spec} shot={shot} kit={kit} />
    </ThreeCanvas>
  </AbsoluteFill>
);

/** shots to draw at frame f: the current one, plus the next one fading in during its crossfade */
export const layersAt = (spec: VideoSpec, f: number): { shot: number; alpha: number }[] => {
  const S = spec.shots;
  for (let i = 1; i < S.length; i++) {
    const x = S[i].xfade;
    if (x && f >= S[i].a - x / 2 && f < S[i].a + x / 2) return [{ shot: i - 1, alpha: 1 }, { shot: i, alpha: (f - (S[i].a - x / 2) + 1) / (x + 1) }];
  }
  const i = S.findIndex((s) => f >= s.a && f < s.b);
  return [{ shot: i < 0 ? S.length - 1 : i, alpha: 1 }];
};

export const makeVideo = (spec: VideoSpec) => {
  const Component: React.FC = () => {
    const f = useCurrentFrame();
    const kit = useKit();
    if (!kit) return null;
    let flash = 0;
    for (const s of spec.shots) if (s.flash && f >= s.a && f < s.a + 4) flash = [1, 0.75, 0.45, 0.2][f - s.a];
    return (
      <AbsoluteFill style={{ background: spec.bg ?? "#cfe3f2" }}>
        {layersAt(spec, f).map((l, i) => <ShotView key={i ? "over" : "base"} spec={spec} shot={l.shot} kit={kit} alpha={l.alpha} />)}
        {flash > 0 && <AbsoluteFill style={{ background: "#ffffff", opacity: flash }} />}
      </AbsoluteFill>
    );
  };
  return { Component, frames: spec.frames };
};
