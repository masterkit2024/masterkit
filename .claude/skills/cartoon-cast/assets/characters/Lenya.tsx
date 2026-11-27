/**
 * Лёня — ленивец, гений-циник. Рост 70 % (700 единиц). Сутулый, длинные руки
 * свисают ниже колен, тяжёлые веки, вечная ухмылка, потрёпанный бордовый халат,
 * защитные очки на лбу, по три длинных когтя.
 */
import React from 'react';
import { palette } from './palette';
import { armAngles, Brow, CharacterRoot, Eye, GroundShadow, Hand, InnerScale, legAngles, Limb, Line, Mouth, Pivot, Shape, Tube } from './parts';
import {
  CharacterMeta,
  CharacterProps,
  clamp,
  EMOTION_TABLE,
  ellipsePts,
  PoseInput,
  PoseName,
  Pt,
  resolvePose,
  smoothClosed,
  tuftPath,
} from './rig';

const C = palette.lenya;

/** Корпус ужат по высоте, чтобы голова была крупнее (мультяшная пропорция). */
const TY = 0.84;
const sy = (y: number) => (y < -186 ? -186 + (y + 186) * TY : y);
const T = (pts: Pt[]): Pt[] => pts.map(([x, y]) => [x, sy(y)]);
/** Голова нарисована вокруг HEAD_FROM и увеличена в HEAD_K раз. */
const HEAD_FROM: Pt = [18, -440];
const HEAD_K = 1.2;

const PELVIS: Pt = [0, -215];
const NECK: Pt = [18, sy(-440) + 6];
const SHOULDER_L: Pt = [-90, sy(-418)];
const SHOULDER_R: Pt = [94, sy(-418)];
const HIP_L: Pt = [-40, -215];
const HIP_R: Pt = [42, -215];
const UPPER_ARM = 150;
const FOREARM = 140;
const THIGH = 95;
const SHIN = 85;

export const LENYA_META: CharacterMeta = {
  name: 'Lenya',
  height: 700,
  width: 300,
  headCenter: [30, -545],
  headRadius: 165,
  joints: { pelvis: PELVIS, neck: NECK, shoulderL: SHOULDER_L, shoulderR: SHOULDER_R, hipL: HIP_L, hipR: HIP_R },
};

/** Сутулый, руки болтаются. */
export const LENYA_IDLE: PoseInput = {
  lean: 9,
  head: 6,
  armL: { shoulder: 5, elbow: 6, hand: 4 },
  armR: { shoulder: 7, elbow: 10, hand: 6 },
  legL: { hip: -5, knee: 6 },
  legR: { hip: 6, knee: 4 },
};
const LENYA_POSES: Partial<Record<PoseName, PoseInput>> = {};

/* ── формы ── */
const TORSO = tuftPath(
  T([
    [-95, -215],
    [-104, -300],
    [-90, -390],
    [-56, -440],
    [0, -454],
    [56, -440],
    [92, -390],
    [106, -300],
    [100, -215],
    [50, -186],
    [-50, -186],
  ]),
  44,
  7,
  21,
);
const ROBE_BACK = smoothClosed(
  T([
    [-112, -400],
    [-64, -440],
    [4, -452],
    [70, -440],
    [118, -400],
    [134, -300],
    [138, -200],
    [130, -118],
    [110, -100],
    [-104, -104],
    [-128, -118],
    [-134, -210],
    [-128, -310],
  ]),
);
const BELLY = smoothClosed(T(ellipsePts(10, -296, 56, 92, 10)));
const ROBE_L = smoothClosed(T([
  [-62, -450],
  [-28, -438],
  [-36, -340],
  [-44, -240],
  [-48, -132],
  [-64, -116],
  [-80, -132],
  [-96, -114],
  [-114, -130],
  [-124, -232],
  [-116, -340],
  [-100, -420],
]));
const ROBE_R = smoothClosed(T([
  [62, -448],
  [100, -420],
  [120, -340],
  [128, -232],
  [122, -128],
  [104, -112],
  [90, -130],
  [72, -114],
  [56, -128],
  [50, -240],
  [44, -340],
  [36, -438],
]));
const ROBE_L_SHADOW = smoothClosed(T([
  [-140, -480],
  [-96, -470],
  [-108, -330],
  [-112, -200],
  [-104, -90],
  [-150, -90],
]));
const ROBE_R_SHADOW = smoothClosed(T([
  [80, -470],
  [160, -470],
  [160, -90],
  [96, -90],
  [104, -250],
  [98, -380],
]));
const COLLAR = smoothClosed(T([
  [-74, -446],
  [-42, -474],
  [6, -482],
  [50, -474],
  [80, -446],
  [44, -434],
  [6, -430],
  [-38, -434],
]));
const PATCH = smoothClosed(
  T([
    [72, -300],
    [106, -306],
    [110, -268],
    [76, -262],
  ]),
  0.4,
);
const HEAD = tuftPath(ellipsePts(24, -562, 124, 110, 14), 42, 8, 5);
const MUZZLE = smoothClosed([
  [-48, -598],
  [0, -620],
  [52, -612],
  [112, -600],
  [138, -556],
  [122, -500],
  [68, -464],
  [6, -466],
  [-46, -498],
  [-68, -552],
]);
const MASK_L = smoothClosed([
  [-104, -556],
  [-64, -582],
  [-22, -596],
  [14, -590],
  [28, -566],
  [12, -546],
  [-30, -546],
  [-72, -536],
]);
const MASK_R = smoothClosed([
  [56, -570],
  [74, -594],
  [112, -598],
  [146, -584],
  [150, -556],
  [122, -552],
  [82, -546],
]);
const NOSE = smoothClosed(ellipsePts(42, -530, 21, 13, 8));
const FOOT = smoothClosed([
  [-30, -6],
  [36, -10],
  [64, 12],
  [56, 34],
  [-28, 34],
  [-42, 16],
]);
const SLEEVE = smoothClosed([
  [-28, -14],
  [28, -14],
  [32, 80],
  [36, 122],
  [18, 132],
  [2, 124],
  [-16, 134],
  [-36, 122],
  [-34, 80],
]);

function Foot() {
  return (
    <g>
      <Tube d="M52 26 q16 0 20 10" width={7} tone={C.claw} shade={false} />
      <Tube d="M42 30 q14 2 16 10" width={7} tone={C.claw} shade={false} />
      <Shape d={FOOT} tone={C.furDark} rim={[6, 6]} />
    </g>
  );
}

function Goggles() {
  const lens = (cx: number, cy: number) => (
    <g>
      <Shape d={smoothClosed(ellipsePts(cx, cy, 36, 34, 10))} tone={C.gogFrame} rim={[5, 5]} />
      <Shape d={smoothClosed(ellipsePts(cx + 1, cy + 1, 24, 22, 10))} tone={C.lens} shadow={smoothClosed(ellipsePts(cx + 12, cy + 12, 22, 20, 8))} />
    </g>
  );
  return (
    <g data-part="goggles">
      <Tube d="M-98 -620 Q20 -680 140 -616" width={22} tone={C.strap} />
      <Tube d="M28 -656 Q38 -664 48 -658" width={12} tone={C.gogFrame} shade={false} />
      {lens(-6, -650)}
      {lens(80, -654)}
    </g>
  );
}

export function Lenya(props: CharacterProps) {
  const { emotion = 'neutral', mouth = 'closed', look, blink = 0, shadow = true } = props;
  const p = resolvePose(props.pose, LENYA_IDLE, props.rig, LENYA_POSES);
  const e0 = EMOTION_TABLE[emotion];
  // вечно тяжёлые веки: при шоке и панике глаза всё же распахиваются
  const e = { ...e0, lidTop: e0.open > 1.05 ? e0.lidTop + 0.08 : clamp(Math.max(e0.lidTop + 0.12, 0.42), 0, 0.8) };
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
          {
            len: UPPER_ARM,
            width: 32,
            tone: C.fur,
            over: <Shape d={SLEEVE} tone={C.robe} rim={[-8, 0]} />,
          },
          { len: FOREARM, width: 30, tone: C.fur },
        ]}
        end={<Hand size={26} tone={C.furDark} form={a.form} claws={C.claw} />}
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
          { len: THIGH, width: 52, tone: C.fur },
          { len: SHIN, width: 46, tone: C.fur },
        ]}
        end={<Foot />}
      />
    );
  };

  return (
    <CharacterRoot name="Lenya" x={props.x} y={props.y} scale={props.scale} facing={props.facing}>
      {shadow && <GroundShadow rx={150} lift={p.bodyY} />}
      <g data-part="body" transform={`translate(${p.bodyX} ${p.bodyY})`}>
        {leg('L')}
        {leg('R')}
        <Pivot part="torso" at={PELVIS} rotate={p.lean}>
          <g transform={`translate(${PELVIS[0]} ${PELVIS[1]}) scale(${1 / Math.sqrt(sq)} ${sq}) translate(${-PELVIS[0]} ${-PELVIS[1]})`}>
            <Shape d={ROBE_BACK} tone={C.robeTrim} part="robeBack" />
            <Shape d={TORSO} tone={C.fur} rim={[10, 0]} part="furBody" />
            <Shape d={BELLY} tone={C.belly} rim={[8, 8]} />
            <Line d={`M-10 ${sy(-260)} q12 8 24 0 M0 ${sy(-330)} q10 6 20 0`} color={C.fur.shade} w={1} />
            {/* халат нараспашку */}
            <g data-part="robe">
              <Tube d={`M-116 ${sy(-300)} Q-128 ${sy(-220)} -122 -140`} width={16} tone={C.robe} />
              <Shape d={ROBE_L} tone={C.robe} shadow={ROBE_L_SHADOW} />
              <Shape d={ROBE_R} tone={C.robe} shadow={ROBE_R_SHADOW} />
              <Tube d={`M-30 ${sy(-440)} Q-40 ${sy(-330)} -46 -136`} width={16} tone={C.robeTrim} />
              <Tube d={`M38 ${sy(-440)} Q48 ${sy(-330)} 54 -132`} width={16} tone={C.robeTrim} />
              <Shape d={PATCH} tone={C.patch} rim={[4, 4]} transform={`rotate(8 90 ${sy(-284)})`} />
              <Line d={`M70 ${sy(-294)} l-8 -4 M70 ${sy(-276)} l-8 0 M108 ${sy(-288)} l8 -2 M108 ${sy(-272)} l8 2`} />
              <ellipse cx={-92} cy={sy(-196)} rx={9} ry={7} fill={C.fur.shade} stroke={palette.ink} strokeWidth={4} />
              <Shape d={COLLAR} tone={C.robeTrim} rim={[0, 6]} />
            </g>

            <Pivot part="head" at={NECK} rotate={p.head}>
             <InnerScale k={HEAD_K} from={HEAD_FROM} to={NECK}>
              <Shape d={HEAD} tone={C.fur} rim={[12, 10]} part="headFur" />
              <Shape d={MUZZLE} tone={C.muzzle} rim={[10, 8]} part="muzzle" />
              <Shape d={MASK_L} tone={C.mask} outline={false} />
              <Shape d={MASK_R} tone={C.mask} outline={false} />
              <g data-part="eyes">
                <Eye part="eyeL" cx={-8} cy={-566} rx={21} ry={23} side={-1} expr={e} lid={C.mask} pupilR={8} look={look} blink={blink} />
                <Eye part="eyeR" cx={86} cy={-568} rx={21} ry={23} side={1} expr={e} lid={C.mask} pupilR={8} look={look} blink={blink} />
              </g>
              <Shape d={NOSE} tone={C.nose} rim={[4, 4]} part="nose" />
              <Mouth cx={46} cy={-494} w={62} shape={mouth} mood={e.mood} style={{ smirk: 0.8, baseMood: 0.1 }} />
              <Goggles />
              <g data-part="brows">
                <Brow part="browL" cx={-6} cy={-606} len={40} thick={11} side={-1} expr={e} raiseUnit={34} color={C.brow} halo={C.fur.base} />
                <Brow part="browR" cx={88} cy={-614} len={40} thick={11} side={1} expr={e} raiseUnit={34} color={C.brow} extraTilt={-8} halo={C.fur.base} />
              </g>
             </InnerScale>
            </Pivot>

            {arm('L')}
            {arm('R')}
          </g>
        </Pivot>
      </g>
    </CharacterRoot>
  );
}

export default Lenya;
