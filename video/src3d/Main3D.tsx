import React from "react";
import * as THREE from "three";
import { AbsoluteFill, useCurrentFrame, delayRender, continueRender, staticFile } from "remotion";
import { Engine, CamState } from "./engine";
import { Set3D, kitchenSet, labS2, labS3, labS5, labS6, roadSet, shopSet, streetSet, showerSet, squareSet, clamp, lerp, pr, eo, eob, rnd } from "./sets";
import { C, W, H, Txt, Title, StepPlate, Stamp, Toggle, popS } from "../src/lib";
import { Subs } from "../src/Main";
import { T } from "../src/timing";

const fontCss = `
@font-face { font-family: 'Montserrat'; font-weight: 800; src: url('${staticFile("fonts/montserrat-cyrillic-800-normal.woff2")}') format('woff2'); unicode-range: U+0400-045F, U+0490-0491, U+04B0-04B1, U+2116; }
@font-face { font-family: 'Montserrat'; font-weight: 800; src: url('${staticFile("fonts/montserrat-latin-800-normal.woff2")}') format('woff2'); }
@font-face { font-family: 'Inter'; font-weight: 700; src: url('${staticFile("fonts/inter-cyrillic-700-normal.woff2")}') format('woff2'); unicode-range: U+0400-045F, U+0490-0491, U+04B0-04B1, U+2116; }
@font-face { font-family: 'Inter'; font-weight: 700; src: url('${staticFile("fonts/inter-latin-700-normal.woff2")}') format('woff2'); }
@font-face { font-family: 'Inter'; font-weight: 800; src: url('${staticFile("fonts/inter-latin-700-normal.woff2")}') format('woff2'); }
`;

type SceneId = "s1" | "s2" | "s3" | "s4" | "s5" | "s6" | "s7" | "s8" | "s9" | "s10" | "s11" | "scream";
const RANGES: [SceneId, number, number][] = [
  ["s1", T.s1, T.s2], ["s2", T.s2, T.s3], ["s3", T.s3, T.s4], ["s4", T.s4, T.s5], ["s5", T.s5, T.s6], ["s6", T.s6, T.s7],
  ["s7", T.s7, T.s8], ["s8", T.s8, T.s9], ["s9", T.s9, T.s10], ["s10", T.s10, T.s11], ["scream", T.scream11, T.back11], ["s11", T.s11, 1e9],
];
const sceneAt = (t: number): SceneId => {
  if (t >= T.scream11 && t < T.back11) return "scream";
  for (const [id, a, b] of RANGES) if (id !== "scream" && t >= a && t < b) return id;
  return "s11";
};
const MAKERS: Record<SceneId, () => Set3D> = {
  s1: () => kitchenSet("s1"), s2: labS2, s3: labS3, s4: roadSet, s5: labS5, s6: labS6, s7: shopSet, s8: () => streetSet("s8"),
  s9: showerSet, s10: squareSet, s11: () => kitchenSet("s11"), scream: () => streetSet("scream"),
};
const cache: Partial<Record<SceneId, Set3D>> = {};
const getSet = (id: SceneId) => (cache[id] ??= MAKERS[id]());

let engine: Engine | null = null;
const projCam = new THREE.PerspectiveCamera(40, W / H, 0.1, 400);
const project = (cs: CamState, p: THREE.Vector3) => {
  projCam.fov = cs.fov ?? 40; projCam.position.copy(cs.pos); projCam.up.set(0, 1, 0); projCam.lookAt(cs.look);
  if (cs.roll) projCam.rotateZ((cs.roll * Math.PI) / 180);
  projCam.updateProjectionMatrix(); projCam.updateMatrixWorld();
  const v = p.clone().project(projCam);
  return { x: (v.x * 0.5 + 0.5) * W, y: (-v.y * 0.5 + 0.5) * H };
};

// ---------- overlay pieces ----------
const BigFace: React.FC<{ r: number }> = ({ r }) => (
  <g transform={`scale(${r / 100})`}>
    <circle r={100} fill="#C9CDD8" stroke="#241726" strokeWidth={6} />
    <ellipse cx={-38} cy={-16} rx={11} ry={14} fill="#1A1020" />
    <ellipse cx={38} cy={-16} rx={11} ry={14} fill="#1A1020" />
    <path d="M -40 50 Q 0 62 40 50" stroke="#1A1020" strokeWidth={9} fill="none" strokeLinecap="round" />
    <path d="M -66 36 Q -40 6 -4 26 M 4 26 Q 40 6 66 36" stroke="#1A1020" strokeWidth={18} fill="none" strokeLinecap="round" />
  </g>
);

const Overlay: React.FC<{ id: SceneId; t: number; cs: CamState }> = ({ id, t, cs }) => {
  const els: React.ReactNode[] = [];
  if (id === "s1") {
    const b = project(cs, new THREE.Vector3(0.15, 1.15, 0.9));
    const ringK = pr(t, T.press1 + 0.05, 0.6);
    if (t > T.press1 && ringK < 1) els.push(<circle key="ring" cx={b.x} cy={b.y} r={lerp(60, 2000, eo(ringK))} fill="none" stroke={C.yellow} strokeWidth={lerp(40, 10, ringK)} opacity={1 - ringK * 0.6} />);
    if (t >= T.press1 && t < T.press1 + 2 / 30) els.push(<rect key="fl" width={W} height={H} fill="#fff" />);
    els.push(<Title key="t1" t={t} a={0} b={T.tired1} y={0.1} size={76} lines={["МИР ×100 МЕДЛЕННЕЕ"]} />);
    els.push(<Title key="t2" t={t} a={T.tired1} y={0.1} size={76} color={C.red} lines={["ЧЕРЕЗ 5 ЧАСОВ ПОЖАЛЕЛ"]} />);
  }
  if (id === "s2") els.push(<Stamp key="st" t={t} a={T.stamp2} x={0.5 * W} y={0.32 * H} />);
  if (id === "s3") els.push(<StepPlate key="p" t={t} a={T.s3} label="ШАГ 1/3 · ЗВУК" on={lerp(1, 0, pr(t, T.deaf3, 0.15))} />);
  if (id === "s4") {
    els.push(<StepPlate key="p" t={t} a={T.s4} label="ШАГ 2/3 · ВОЗДУХ" on={1} />);
    const spd = t < T.walk4 ? 0 : t < T.fast4 ? 5 : Math.round(lerp(5, 500, eo(pr(t, T.fast4, 0.8))));
    els.push(<Txt key="sp" x={0.5 * W} y={0.2 * H} size={120} color={C.yellow} stroke={8} strokeColor="#241726">{`${spd} км/ч`}</Txt>);
    if (t >= T.fast4 && t < T.wall4)
      for (let i = 0; i < 12; i++) { const ph = ((t - T.fast4) * 2.2 + rnd(i)) % 1; els.push(<rect key={"l" + i} x={lerp(W + 100, -300, ph)} y={0.36 * H + rnd(i + 3) * 0.4 * H} width={220 + rnd(i + 7) * 160} height={8} rx={4} fill="#fff" opacity={0.8} />); }
    els.push(<Stamp key="st" t={t} a={T.stamp4} x={0.72 * W} y={0.34 * H} scale={0.6} />);
  }
  if (id === "s5") els.push(<StepPlate key="p" t={t} a={T.s5} label="ШАГ 3/3 · МОЗГ" on={1} />);
  if (id === "s6") {
    const r = eo(pr(t, T.color6, 0.5)) * 2400;
    els.push(
      <g key="mask">
        <defs><mask id="m6"><rect width={W} height={H} fill="#fff" /><circle cx={W / 2} cy={H * 0.45} r={r} fill="#000" /></mask></defs>
        <rect width={W} height={H} fill="#000" mask="url(#m6)" />
      </g>,
    );
    els.push(<Title key="t" t={t} a={T.s6 + 0.15} y={0.1} size={80} lines={["А ЧТО ЕСЛИ", "ФИЗИКЕ ВСЁ РАВНО?"]} />);
    if (t >= T.press6 && t < T.press6 + 2 / 30) els.push(<rect key="fl" width={W} height={H} fill="#fff" opacity={0.8} />);
  }
  if (id === "s8" && t >= T.text8 && t < T.close8) els.push(<Title key="t" t={t} a={T.text8} y={0.15} size={56} color={C.white} lines={["ПРОСТО ПОТОМУ ЧТО МОЖЕШЬ"]} />);
  if (id === "s9") {
    if (t >= T.wait9 && t < T.reveal9) els.push(<g key="w" transform={`translate(${t >= T.wait9b ? (rnd(Math.floor(t * 30)) - 0.5) * 10 : 0} 0)`}><Title t={t} a={T.wait9} y={0.14} size={t >= T.wait9b ? 96 : 72} lines={[t >= T.wait9b ? "2 ЧАСА!" : "2 ЧАСА"]} /></g>);
    if (t >= T.more9) els.push(<Title key="m" t={t} a={T.more9} y={0.14} size={72} lines={["ещё 2 часа"]} />);
  }
  if (id === "s10") {
    if (t < T.s10b) els.push(<Title key="a" t={t} a={T.s10} y={0.1} size={72} lines={["СТАТУИ"]} />);
    else {
      els.push(<Title key="b" t={t} a={T.s10b} y={0.08} size={72} lines={["УСЫ"]} />);
      if (t >= T.grid10) {
        const g: React.ReactNode[] = [];
        for (let i = 0; i < 9; i++) {
          const cx = (i % 3) * (W / 3) + W / 6, cy = 330 + Math.floor(i / 3) * 470;
          const sk = popS(t, T.grid10 + i * 0.05, 0.2);
          g.push(<g key={i} transform={`translate(${cx} ${cy}) scale(${sk})`}><rect x={-W / 6 + 12} y={-215} width={W / 3 - 24} height={430} rx={14} fill="#f2efe6" stroke="#241726" strokeWidth={10} /><BigFace r={115} /></g>);
        }
        els.push(<g key="grid"><rect width={W} height={H} fill="#2f3440" opacity={clamp(pr(t, T.grid10, 0.2))} />{g}</g>);
        els.push(<Title key="b2" t={t} a={T.s10b} y={0.08} size={72} lines={["УСЫ"]} />);
      }
    }
  }
  if (id === "scream") {
    els.push(<g key="win" fill="none" stroke="#efd9b0"><rect x={30} y={30} width={W - 60} height={H - 60} strokeWidth={60} /><line x1={W / 2} y1={0} x2={W / 2} y2={H * 0.16} strokeWidth={30} /></g>);
    els.push(<Title key="t" t={t} a={T.scream11} y={0.14} size={80} color={C.red} lines={["ГДЕ МОЁ", "МОРОЖЕНОЕ?!"]} />);
  }
  if (id === "s11") {
    const plate = (a: number, x: number, text: string, color: string, k: string) => t >= a && (
      <g key={k} transform={`translate(${x} ${0.1 * H}) scale(${popS(t, a, 0.15)})`}>
        <rect x={-230} y={-60} width={460} height={120} rx={26} fill={C.panel} stroke={color} strokeWidth={6} />
        <Txt x={0} y={2} size={56} color={color}>{text}</Txt>
      </g>
    );
    els.push(plate(T.world11, 0.27 * W, "МИР: 3 МИН", "#C9CDD8", "p1"));
    els.push(plate(T.you11, 0.73 * W, "ТЫ: 5 ЧАСОВ", C.yellow, "p2"));
    if (t >= T.tea11) els.push(<Title key="tea" t={t} a={T.tea11} y={0.22} size={76} lines={["ЭТО БЫЛ ПРОСТО ЧАЙ"]} />);
    if (t >= T.freeze11 && Math.floor((t - T.freeze11) / 0.4) % 2 === 0 && t - T.freeze11 < 2.4) els.push(<rect key="rf" x={14} y={14} width={W - 28} height={H - 28} fill="none" stroke={C.red} strokeWidth={28} />);
  }
  // transitions
  if (t >= T.s4 && t < T.s4 + 0.2) { const k = pr(t, T.s4, 0.2); els.push(<rect key="sl" x={lerp(W, -W, k)} y={0} width={W} height={H} fill={C.bg} />); }
  if (Math.abs(t - T.s5) < 0.075) els.push(<rect key="wf" width={W} height={H} fill="#fff" opacity={1 - Math.abs(t - T.s5) / 0.075} />);
  if (t >= T.s7 && t < T.s7 + 0.2) { const k = pr(t, T.s7, 0.2); els.push(<g key="wp"><rect x={k * W} y={0} width={W} height={H} fill="#000" /><rect x={k * W - 12} y={0} width={24} height={H} fill={C.yellow} /></g>); }
  return <>{els}</>;
};

export const Main3D: React.FC = () => {
  const frame = useCurrentFrame();
  const t = frame / 30;
  const canvasRef = React.useRef<HTMLCanvasElement>(null);
  const [ready, setReady] = React.useState(false);
  const doneRef = React.useRef(false);
  const [handle] = React.useState(() => delayRender("fonts+gl"));
  React.useEffect(() => {
    Promise.all([
      (document as any).fonts.load("800 60px Montserrat", "АБВ"),
      (document as any).fonts.load("700 60px Inter", "АБВ123"),
    ]).then(() => setReady(true));
  }, []);
  const id = sceneAt(t);
  const st = ready ? getSet(id).update(t) : null;
  React.useLayoutEffect(() => {
    if (!ready || !st || !canvasRef.current) return;
    if (!engine) engine = new Engine(canvasRef.current, W, H);
    engine.render(getSet(id).scene, st.cam, st.post);
    if (!doneRef.current) { doneRef.current = true; continueRender(handle); }
  });
  return (
    <AbsoluteFill style={{ backgroundColor: "#000" }}>
      <style>{fontCss}</style>
      <canvas ref={canvasRef} width={W} height={H} style={{ position: "absolute", width: "100%", height: "100%" }} />
      <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{ position: "absolute" }}>
        {st && <Overlay id={id} t={t} cs={st.cam} />}
        {st && <Subs t={t} />}
      </svg>
    </AbsoluteFill>
  );
};
