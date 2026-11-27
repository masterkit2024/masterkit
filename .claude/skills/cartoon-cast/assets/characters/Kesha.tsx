/**
 * Кеша — человек, паникёр. Рост 100 % (1000 единиц). Худой, высокий, сутулый,
 * кудрявый, мятная худи, серые джинсы, красные кеды.
 */
import React from 'react';
import { palette } from './palette';
import {
  armAngles,
  Brow,
  CharacterRoot,
  Eye,
  GroundShadow,
  Hand,
  legAngles,
  Limb,
  Line,
  Mouth,
  Pivot,
  Shape,
  Tube,
} from './parts';
import {
  CharacterMeta,
  CharacterProps,
  curlPath,
  EMOTION_TABLE,
  PoseInput,
  PoseName,
  Pt,
  resolvePose,
  smoothClosed,
} from './rig';

const C = palette.kesha;

const PELVIS: Pt = [0, -450];
const NECK: Pt = [8, -748];
const SHOULDER_L: Pt = [-72, -688];
const SHOULDER_R: Pt = [76, -688];
const HIP_L: Pt = [-30, -452];
const HIP_R: Pt = [32, -452];
const UPPER_ARM = 150;
const FOREARM = 140;
const THIGH = 215;
const SHIN = 200;

export const KESHA_META: CharacterMeta = {
  name: 'Kesha',
  height: 1000,
  width: 280,
  headCenter: [14, -880],
  headRadius: 170,
  joints: {
    pelvis: PELVIS,
    neck: NECK,
    shoulderL: SHOULDER_L,
    shoulderR: SHOULDER_R,
    hipL: HIP_L,
    hipR: HIP_R,
  },
};

/** Сутулость и вечно занятые руки. */
export const KESHA_IDLE: PoseInput = {
  lean: 7,
  head: 6,
  armL: { shoulder: 12, elbow: 22 },
  armR: { shoulder: 16, elbow: 112, hand: 25 },
  legL: { hip: -3 },
  legR: { hip: 4, knee: 3 },
};

const KESHA_POSES: Partial<Record<PoseName, PoseInput>> = {};

/* ── формы ── */
const HOODIE = smoothClosed([
  [-84, -430],
  [-88, -540],
  [-84, -632],
  [-70, -694],
  [-36, -716],
  [6, -722],
  [46, -716],
  [80, -694],
  [92, -632],
  [94, -540],
  [88, -430],
  [2, -424],
]);
const HOODIE_SHADOW = smoothClosed([
  [52, -740],
  [140, -740],
  [140, -400],
  [62, -400],
  [70, -580],
]);
const HEM = smoothClosed(
  [
    [-86, -452],
    [90, -452],
    [90, -416],
    [2, -410],
    [-86, -416],
  ],
  0.5,
);
const POCKET = smoothClosed(
  [
    [-58, -472],
    [68, -472],
    [56, -548],
    [-46, -548],
  ],
  0.35,
);
const HOOD = smoothClosed([
  [-84, -698],
  [-96, -738],
  [-64, -772],
  [4, -784],
  [70, -772],
  [100, -738],
  [88, -698],
  [44, -712],
  [4, -716],
  [-38, -712],
]);
const FACE = smoothClosed([
  [-72, -832],
  [-76, -892],
  [-56, -942],
  [-8, -966],
  [46, -962],
  [86, -930],
  [98, -872],
  [92, -808],
  [70, -764],
  [30, -742],
  [-12, -748],
  [-50, -780],
]);
const EAR = smoothClosed([
  [-66, -872],
  [-92, -878],
  [-100, -846],
  [-88, -818],
  [-64, -820],
]);
const HAIR_BACK = curlPath(
  [
    [-112, -828],
    [-126, -902],
    [-104, -976],
    [-48, -1010],
    [20, -1016],
    [84, -996],
    [118, -948],
    [114, -896],
    [60, -910],
    [-60, -888],
    [-94, -800],
  ],
  22,
  0.42,
  7,
);
const HAIR_FRONT = curlPath(
  [
    [-82, -904],
    [-74, -962],
    [-22, -996],
    [52, -994],
    [104, -958],
    [112, -910],
    [84, -934],
    [52, -924],
    [18, -944],
    [-16, -930],
    [-50, -942],
  ],
  20,
  0.5,
  11,
);
const NOSE = smoothClosed([
  [70, -864],
  [96, -846],
  [104, -820],
  [88, -804],
  [64, -808],
  [58, -830],
]);

const SNEAKER_SOLE = smoothClosed([
  [-38, 16],
  [24, 16],
  [80, 18],
  [92, 27],
  [84, 37],
  [-32, 37],
  [-44, 27],
]);
const SNEAKER_UPPER = smoothClosed([
  [-32, -18],
  [2, -22],
  [28, -6],
  [58, 4],
  [84, 14],
  [84, 26],
  [-38, 26],
  [-40, 4],
]);

function Sneaker() {
  return (
    <g>
      <Shape d={SNEAKER_SOLE} tone={C.sole} rim={[0, 5]} />
      <Shape d={SNEAKER_UPPER} tone={C.sneaker} rim={[6, 7]} />
      <path d="M8 -12 L20 -2 M22 -6 L32 4" stroke={C.lace} strokeWidth={5} fill="none" />
      <Shape d={smoothClosed([[56, 20], [88, 20], [86, 30], [58, 30]], 0.5)} tone={C.sole} outline={false} />
    </g>
  );
}

export function Kesha(props: CharacterProps) {
  const { emotion = 'neutral', mouth = 'closed', look, blink = 0, shadow = true } = props;
  const p = resolvePose(props.pose, KESHA_IDLE, props.rig, KESHA_POSES);
  const e = EMOTION_TABLE[emotion];
  const sq = p.squash;

  const sleeve = { tone: C.hoodie, width: 34 };
  const cuff = (len: number) => (
    <Shape d={smoothClosed([[-21, len - 22], [21, len - 22], [22, len + 6], [-22, len + 6]], 0.4)} tone={C.hoodieRib} rim={[4, 0]} />
  );
  const arm = (side: 'L' | 'R') => {
    const a = side === 'L' ? p.armL : p.armR;
    return (
      <Limb
        names={[`arm${side}`, `upperArm${side}`, `forearm${side}`, `hand${side}`]}
        at={side === 'L' ? SHOULDER_L : SHOULDER_R}
        mirror={side === 'R'}
        angles={armAngles(a)}
        segs={[
          { len: UPPER_ARM, ...sleeve },
          { len: FOREARM, ...sleeve, node: cuff(FOREARM) },
        ]}
        end={
          <g transform="translate(0 4)">
            <Hand size={34} tone={C.skin} form={a.form} />
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
          { len: THIGH, width: 40, tone: C.jeans },
          {
            len: SHIN,
            width: 38,
            tone: C.jeans,
            node: <Shape d={smoothClosed([[-25, SHIN - 34], [25, SHIN - 34], [27, SHIN - 4], [-27, SHIN - 4]], 0.4)} tone={C.jeans} rim={[5, 0]} />,
          },
        ]}
        end={<Sneaker />}
      />
    );
  };

  return (
    <CharacterRoot name="Kesha" x={props.x} y={props.y} scale={props.scale} facing={props.facing}>
      {shadow && <GroundShadow rx={130} lift={p.bodyY} />}
      <g data-part="body" transform={`translate(${p.bodyX} ${p.bodyY})`}>
        {leg('L')}
        {leg('R')}
        <Pivot part="torso" at={PELVIS} rotate={p.lean}>
          <g transform={`translate(${PELVIS[0]} ${PELVIS[1]}) scale(${1 / Math.sqrt(sq)} ${sq}) translate(${-PELVIS[0]} ${-PELVIS[1]})`}>
            <Shape d={HOODIE} tone={C.hoodie} shadow={HOODIE_SHADOW} part="hoodie" />
            <Shape d={HEM} tone={C.hoodieRib} rim={[6, 0]} />
            <Shape d={POCKET} tone={C.hoodie} rim={[0, -8]} />
            <Line d="M-30 -600 Q-20 -585 -6 -580" />
            <Shape d={HOOD} tone={C.hoodie} rim={[8, 6]} part="hood" />
            <ellipse cx={6} cy={-728} rx={34} ry={12} fill={C.hoodie.shade} />
            <Tube d="M-8 -712 Q-14 -680 -18 -650" width={7} tone={C.string} />
            <Tube d="M22 -712 Q26 -680 30 -646" width={7} tone={C.string} />
            {/* шея */}
            <Tube d="M6 -722 L8 -770" width={32} tone={C.skin} />

            <Pivot part="head" at={NECK} rotate={p.head}>
              <Shape d={HAIR_BACK} tone={C.hair} rim={[10, 10]} part="hairBack" />
              <Shape d={EAR} tone={C.skin} rim={[-6, 4]} part="ear" />
              <Line d="M-76 -858 Q-90 -850 -82 -832" />
              <Shape d={FACE} tone={C.skin} rim={[14, 10]} part="face" />
              <Shape d={HAIR_FRONT} tone={C.hair} rim={[6, 10]} part="hairFront" />
              <g fill="none" stroke={palette.ink} strokeWidth={5}>
                <path d="M-40 -968 q10 -14 22 -4" />
                <path d="M30 -980 q12 -12 22 0" />
                <path d="M80 -950 q12 -8 16 6" />
                <path d="M-90 -930 q6 -14 20 -10" />
              </g>
              <g data-part="eyes">
                <Eye part="eyeL" cx={-16} cy={-880} rx={33} ry={35} side={-1} expr={e} lid={C.skin} pupilR={7.5} look={look} blink={blink} />
                <Eye part="eyeR" cx={54} cy={-880} rx={33} ry={35} side={1} expr={e} lid={C.skin} pupilR={7.5} look={look} blink={blink} />
              </g>
              <g data-part="brows">
                <Brow part="browL" cx={-18} cy={-926} len={46} thick={13} side={-1} expr={e} raiseUnit={60} color={C.brow} halo={C.skin.base} />
                <Brow part="browR" cx={56} cy={-926} len={46} thick={13} side={1} expr={e} raiseUnit={60} color={C.brow} halo={C.skin.base} />
              </g>
              <Shape d={NOSE} tone={C.skin} rim={[6, 6]} part="nose" />
              <Mouth cx={32} cy={-784} w={54} shape={mouth} mood={e.mood} />
            </Pivot>

            {arm('L')}
            {arm('R')}
          </g>
        </Pivot>
      </g>
    </CharacterRoot>
  );
}

export default Kesha;
