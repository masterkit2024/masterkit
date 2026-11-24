/**
 * Сугроб — йети, чиловый. Рост 130 % (1300 единиц). Огромный, сутулый, пушистый,
 * маленькое лицо в шерсти, глаза-щёлки в довольном прищуре, голубые ладони и ступни,
 * маленькая вязаная шапка с помпоном.
 */
import React, { useId } from 'react';
import { palette } from './palette';
import { armAngles, Brow, CharacterRoot, Eye, FurSegment, GroundShadow, Hand, legAngles, Limb, Line, Mouth, Pivot, Shape } from './parts';
import {
  CharacterMeta,
  CharacterProps,
  clamp,
  EMOTION_TABLE,
  EyeExpr,
  ellipsePts,
  safeId,
  useRig,
  PoseInput,
  PoseName,
  Pt,
  resolvePose,
  smoothClosed,
  tuftPath,
} from './rig';

const C = palette.sugrob;

const PELVIS: Pt = [0, -290];
const NECK: Pt = [40, -930];
const SHOULDER_L: Pt = [-222, -850];
const SHOULDER_R: Pt = [232, -850];
const HIP_L: Pt = [-96, -290];
const HIP_R: Pt = [100, -290];
const UPPER_ARM = 250;
const FOREARM = 225;
const THIGH = 125;
const SHIN = 105;

export const SUGROB_META: CharacterMeta = {
  name: 'Sugrob',
  height: 1300,
  width: 640,
  headCenter: [70, -1110],
  headRadius: 215,
  joints: { pelvis: PELVIS, neck: NECK, shoulderL: SHOULDER_L, shoulderR: SHOULDER_R, hipL: HIP_L, hipR: HIP_R },
};

/** Расслабленный, сутулый, руки-лопаты висят. */
export const SUGROB_IDLE: PoseInput = {
  lean: 5,
  head: 7,
  armL: { shoulder: 9, elbow: 12, hand: 6 },
  armR: { shoulder: 11, elbow: 16, hand: 8 },
  legL: { hip: -4, knee: 2 },
  legR: { hip: 5, knee: 3 },
};
const SUGROB_POSES: Partial<Record<PoseName, PoseInput>> = {};

/* ── формы ── */
const BODY = tuftPath(
  [
    [-238, -270],
    [-278, -480],
    [-264, -700],
    [-224, -870],
    [-130, -975],
    [0, -1006],
    [120, -976],
    [214, -880],
    [260, -720],
    [282, -500],
    [250, -270],
    [120, -222],
    [-120, -222],
  ],
  24,
  40,
  31,
);
const BODY_SHADOW = smoothClosed([
  [130, -1060],
  [420, -1060],
  [420, -180],
  [-320, -180],
  [-320, -370],
  [-120, -336],
  [90, -350],
  [180, -460],
  [210, -720],
]);
const HEAD = tuftPath(ellipsePts(52, -1092, 166, 144, 14), 20, 34, 9);
const FACE = smoothClosed(ellipsePts(82, -1064, 94, 84, 10));
const FRINGE = tuftPath(ellipsePts(80, -1172, 108, 30, 10), 9, 22, 4, 0.5);
const HAT = smoothClosed([
  [-8, -1218],
  [6, -1262],
  [60, -1286],
  [114, -1264],
  [132, -1220],
]);
const HAT_BAND = smoothClosed(
  [
    [-22, -1238],
    [142, -1238],
    [146, -1204],
    [-26, -1204],
  ],
  0.5,
);
const POMPOM = tuftPath(ellipsePts(60, -1294, 26, 24, 8), 9, 10, 2);
const FOOT = smoothClosed([
  [-58, -14],
  [52, -18],
  [108, 8],
  [114, 42],
  [84, 60],
  [-50, 60],
  [-74, 30],
]);
const cuff = (cy: number, rx: number, ry: number, seed: number) => tuftPath(ellipsePts(0, cy, rx, ry, 10), 9, 18, seed);

/**
 * Глаз-щёлка: полумесяц между верхним веком и приподнятым нижним.
 * В нейтрали — довольный прищур; шок/паника раскрывают глаз до овала.
 */
function SlitEye({ part, cx, cy, rx, ry, side, expr, look, blink = 0 }: { part: string; cx: number; cy: number; rx: number; ry: number; side: -1 | 1; expr: EyeExpr; look?: { x?: number; y?: number }; blink?: number }) {
  const { sw } = useRig();
  const id = safeId(useId());
  const wide = expr.open > 1.05;
  // открытость: щёлка по умолчанию, шире при удивлении
  const top = ry * expr.open * (wide ? 1.1 - expr.lidTop : 0.9 - expr.lidTop * 0.8) * (1 - blink);
  const bot = wide ? ry * expr.open * 1.0 : ry * (-0.22 - expr.lidBottom * 0.5 + (expr.mood < 0 ? 0.45 : 0));
  const t = Math.max(top, 2);
  const b = Math.max(bot, -t * 0.7);
  const d = `M${-rx} 0 C${-rx * 0.6} ${-t * 1.6} ${rx * 0.6} ${-t * 1.6} ${rx} 0 C${rx * 0.6} ${b * 1.4} ${-rx * 0.6} ${b * 1.4} ${-rx} 0Z`;
  const pr = 6 * expr.pupil * (wide ? 0.9 : 1.15);
  const lx = clamp(look?.x ?? 0, -1, 1) * rx * 0.5;
  const ly = clamp((look?.y ?? 0) + expr.lookY, -1, 1) * 4 - t * 0.35;
  const tilt = -side * expr.lidTilt * 0.6;
  return (
    <g data-part={part} transform={`translate(${cx} ${cy}) rotate(${tilt})`}>
      <defs>
        <clipPath id={id}>
          <path d={d} />
        </clipPath>
      </defs>
      <path d={d} fill={palette.eyeWhite.base} />
      <circle cx={lx} cy={ly} r={pr} fill={palette.pupil} clipPath={`url(#${id})`} />
      <path data-outline="" d={d} fill="none" stroke={palette.ink} strokeWidth={sw} />
    </g>
  );
}

function Foot() {
  return (
    <g>
      <Shape d={FOOT} tone={C.blue} rim={[8, 8]} />
      <Line d="M78 22 q12 10 8 26 M54 26 q10 10 6 26" />
    </g>
  );
}

export function Sugrob(props: CharacterProps) {
  const { emotion = 'neutral', mouth = 'closed', look, blink = 0, shadow = true } = props;
  const p = resolvePose(props.pose, SUGROB_IDLE, props.rig, SUGROB_POSES);
  const e0 = EMOTION_TABLE[emotion];
  // вечный довольный прищур; шок и паника всё же открывают глаза
  const k = e0.open > 1.05 ? 0.1 : 1;
  const e = {
    ...e0,
    lidTop: clamp(e0.lidTop + 0.36 * k, 0, 0.9),
    lidBottom: clamp(e0.lidBottom + 0.3 * k, 0, 0.6),
    pupil: e0.pupil * (k < 1 ? 1 : 1.2),
  };
  const sq = p.squash;

  const arm = (side: 'L' | 'R') => {
    const a = side === 'L' ? p.armL : p.armR;
    return (
      <Limb
        names={[`arm${side}`, `upperArm${side}`, `forearm${side}`, `hand${side}`]}
        at={side === 'L' ? SHOULDER_L : SHOULDER_R}
        mirror={side === 'R'}
        angles={armAngles(a)}
        segs={[
          { len: UPPER_ARM, node: <FurSegment len={UPPER_ARM} width={100} tone={C.fur} seed={side === 'L' ? 3 : 4} tufts={11} amp={22} /> },
          { len: FOREARM, node: <FurSegment len={FOREARM} width={90} tone={C.fur} seed={side === 'L' ? 5 : 6} tufts={11} amp={20} /> },
        ]}
        end={
          <g>
            <g transform="translate(0 6)">
              <Hand size={50} tone={C.blue} form={a.form} />
            </g>
            <Shape d={cuff(0, 52, 24, 8)} tone={C.fur} rim={[-6, 6]} />
          </g>
        }
      />
    );
  };
  const leg = (side: 'L' | 'R') => {
    const l = side === 'L' ? p.legL : p.legR;
    return (
      <Limb
        names={[`leg${side}`, `thigh${side}`, `shin${side}`, `foot${side}`]}
        at={side === 'L' ? HIP_L : HIP_R}
        angles={legAngles(l)}
        segs={[
          { len: THIGH, node: <FurSegment len={THIGH} width={116} tone={C.fur} seed={side === 'L' ? 7 : 8} tufts={10} amp={18} /> },
          { len: SHIN, node: <FurSegment len={SHIN} width={108} tone={C.fur} seed={side === 'L' ? 9 : 10} tufts={10} amp={18} /> },
        ]}
        end={
          <g>
            <Foot />
            <Shape d={cuff(-8, 66, 26, side === 'L' ? 11 : 12)} tone={C.fur} rim={[-6, 6]} />
          </g>
        }
      />
    );
  };

  return (
    <CharacterRoot name="Sugrob" x={props.x} y={props.y} scale={props.scale} facing={props.facing}>
      {shadow && <GroundShadow rx={300} lift={p.bodyY} />}
      <g data-part="body" transform={`translate(${p.bodyX} ${p.bodyY})`}>
        {leg('L')}
        {leg('R')}
        <Pivot part="torso" at={PELVIS} rotate={p.lean}>
          <g transform={`translate(${PELVIS[0]} ${PELVIS[1]}) scale(${1 / Math.sqrt(sq)} ${sq}) translate(${-PELVIS[0]} ${-PELVIS[1]})`}>
            <Shape d={BODY} tone={C.fur} shadow={BODY_SHADOW} part="furBody" />
            <g data-part="furStrokes">
              <Line d="M-70 -700 q10 22 20 0 q10 22 20 0" color={C.fur.shade} w={1.3} />
              <Line d="M40 -560 q10 22 20 0 q10 22 20 0" color={C.fur.shade} w={1.3} />
              <Line d="M-140 -480 q10 22 20 0" color={C.fur.shade} w={1.3} />
              <Line d="M-20 -860 q10 22 20 0" color={C.fur.shade} w={1.3} />
            </g>

            <Pivot part="head" at={NECK} rotate={p.head}>
              <Shape d={HEAD} tone={C.fur} rim={[16, 12]} part="headFur" />
              <Shape d={FACE} tone={C.face} rim={[8, 8]} part="face" />
              <g data-part="eyes">
                <SlitEye part="eyeL" cx={46} cy={-1072} rx={25} ry={20} side={-1} expr={e0} look={look} blink={blink} />
                <SlitEye part="eyeR" cx={118} cy={-1072} rx={25} ry={20} side={1} expr={e0} look={look} blink={blink} />
              </g>
              <Shape d={smoothClosed(ellipsePts(84, -1040, 19, 13, 8))} tone={C.nose} rim={[3, 3]} part="nose" />
              <Mouth cx={84} cy={-1012} w={62} shape={mouth} mood={e.mood} style={{ baseMood: 0.35, smirk: 0.25 }} />
              <Shape d={FRINGE} tone={C.fur} rim={[6, 8]} part="fringe" />
              <g data-part="brows">
                <Brow part="browL" cx={44} cy={-1108} len={36} thick={12} side={-1} expr={e} raiseUnit={22} color={C.brow} />
                <Brow part="browR" cx={120} cy={-1108} len={36} thick={12} side={1} expr={e} raiseUnit={22} color={C.brow} />
              </g>
              <g data-part="hat">
                <Shape d={HAT} tone={C.hat} rim={[8, 4]} />
                <Line d="M30 -1270 q4 24 0 34 M60 -1280 v40 M90 -1272 q-4 24 0 34" color={C.hat.shade} w={1.2} />
                <Shape d={HAT_BAND} tone={C.hatRib} rim={[6, 0]} />
                <Line d="M0 -1232 v22 M22 -1234 v26 M44 -1234 v26 M66 -1234 v26 M88 -1234 v26 M110 -1234 v26 M128 -1232 v22" color={C.hat.shade} w={1.1} />
                <Shape d={POMPOM} tone={C.pompom} rim={[5, 5]} />
              </g>
            </Pivot>

            {arm('L')}
            {arm('R')}
          </g>
        </Pivot>
      </g>
    </CharacterRoot>
  );
}

export default Sugrob;
