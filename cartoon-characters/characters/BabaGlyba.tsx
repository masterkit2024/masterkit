/**
 * Баба Глыба — огромная бабка, две формы.
 *  а) обычная (rage=false): рост 125 %, широкая, мощная, бицепсы, платок в мелкий цветочек,
 *     цветастый халат, фартук, тапочки, круглые очки, румянец, робкий взгляд, руки у груди;
 *  б) «ГЛЫБА» (rage=true): рост 160 %, красные светящиеся глаза без зрачков, оскал, вены,
 *     развевающийся платок, треснувший фартук, широкая стойка и поднятые кулаки.
 */
import React, { useId } from 'react';
import { palette } from './palette';
import {
  armAngles,
  Brow,
  CharacterRoot,
  Eye,
  GroundShadow,
  Hand,
  InnerScale,
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
  clamp,
  EMOTION_TABLE,
  ellipsePts,
  MouthShape,
  PoseInput,
  PoseName,
  Pt,
  resolvePose,
  safeId,
  smoothClosed,
  tuftPath,
  useRig,
} from './rig';

const C = palette.glyba;
const INK = palette.ink;

/** Во сколько раз «ГЛЫБА» больше обычной формы (1250 → 1600). */
export const RAGE_SCALE = 1.28;

const PELVIS: Pt = [0, -330];
const NECK: Pt = [12, -872];
const SHOULDER_L: Pt = [-246, -800];
const SHOULDER_R: Pt = [252, -800];
const HIP_L: Pt = [-84, -330];
const HIP_R: Pt = [86, -330];
const UPPER_ARM = 215;
const FOREARM = 172;
const THIGH = 150;
const SHIN = 140;

export interface BabaGlybaProps extends CharacterProps {
  /** Форма ярости «ГЛЫБА». */
  rage?: boolean;
  /** Сила ветра для платка в ярости, 0..1 (можно анимировать). */
  wind?: number;
}

export const BABA_GLYBA_META: CharacterMeta = {
  name: 'BabaGlyba',
  height: 1250,
  width: 640,
  headCenter: [24, -1040],
  headRadius: 205,
  joints: { pelvis: PELVIS, neck: NECK, shoulderL: SHOULDER_L, shoulderR: SHOULDER_R, hipL: HIP_L, hipR: HIP_R },
};
export const BABA_GLYBA_RAGE_META: CharacterMeta = {
  ...BABA_GLYBA_META,
  name: 'BabaGlybaRage',
  height: 1250 * RAGE_SCALE,
  width: 900,
  headCenter: [24 * RAGE_SCALE, -1040 * RAGE_SCALE],
  headRadius: 205 * RAGE_SCALE,
  joints: Object.fromEntries(Object.entries(BABA_GLYBA_META.joints).map(([k, [x, y]]) => [k, [x * RAGE_SCALE, y * RAGE_SCALE] as Pt])),
};

/** Обычная: ссутулена, руки прижаты к груди, колени вместе. */
export const GLYBA_IDLE: PoseInput = {
  lean: 6,
  head: 9,
  armL: { shoulder: 4, elbow: 124, hand: 34, form: 'fist' },
  armR: { shoulder: 4, elbow: 124, hand: 34, form: 'fist' },
  legL: { hip: -2 },
  legR: { hip: 3 },
};
/** Ярость: широкая стойка, кулаки подняты. */
export const GLYBA_RAGE_IDLE: PoseInput = {
  lean: 3,
  head: -2,
  bodyY: 26,
  armL: { shoulder: 62, elbow: -100, hand: -14, form: 'fist' },
  armR: { shoulder: 62, elbow: -100, hand: -14, form: 'fist' },
  legL: { hip: -26, knee: 0, foot: 26 },
  legR: { hip: 26, knee: 0, foot: -26 },
};
const GLYBA_POSES: Partial<Record<PoseName, PoseInput>> = {};

/* ── геометрия (часть зависит от ярости) ── */
const wx = (pts: Pt[], k: number, cx = 0): Pt[] => pts.map(([x, y]) => [cx + (x - cx) * k, y]);

const ROBE_PTS: Pt[] = [
  [-226, -160],
  [-292, -300],
  [-314, -480],
  [-298, -660],
  [-248, -800],
  [-160, -878],
  [-60, -902],
  [10, -906],
  [80, -902],
  [174, -878],
  [258, -800],
  [306, -660],
  [322, -480],
  [302, -300],
  [236, -160],
  [120, -138],
  [6, -132],
  [-110, -138],
];
const ROBE_SHADOW = smoothClosed([
  [150, -940],
  [380, -940],
  [380, -100],
  [-380, -100],
  [-380, -230],
  [0, -200],
  [190, -260],
  [230, -560],
]);
const APRON_PTS: Pt[] = [
  [-118, -700],
  [124, -700],
  [142, -580],
  [198, -440],
  [216, -260],
  [208, -186],
  [0, -172],
  [-198, -186],
  [-208, -260],
  [-194, -440],
  [-136, -580],
];
const SCARF_BACK = smoothClosed([
  [-154, -958],
  [-162, -1080],
  [-112, -1190],
  [10, -1240],
  [132, -1202],
  [186, -1090],
  [182, -960],
  [142, -898],
  [30, -878],
  [-102, -898],
]);
const FACE = smoothClosed(ellipsePts(26, -1004, 118, 112, 12));
const SCARF_FRONT = smoothClosed([
  [-108, -1040],
  [-80, -1112],
  [20, -1138],
  [118, -1114],
  [160, -1040],
  [124, -1064],
  [22, -1088],
  [-74, -1066],
]);
const NOSE = smoothClosed(ellipsePts(34, -976, 24, 19, 8));
const SLIPPER = smoothClosed([
  [-54, -14],
  [46, -18],
  [96, 6],
  [100, 30],
  [80, 40],
  [-48, 40],
  [-66, 16],
]);

/* ── узоры тканей (плоские, без градиентов) ── */
function FabricDefs({ robeId, scarfId }: { robeId: string; scarfId: string }) {
  const flower = (x: number, y: number, r: number, petal: string, core: string) => (
    <g>
      {[0, 72, 144, 216, 288].map((a) => (
        <circle key={a} cx={x + Math.cos((a * Math.PI) / 180) * r} cy={y + Math.sin((a * Math.PI) / 180) * r} r={r * 0.8} fill={petal} />
      ))}
      <circle cx={x} cy={y} r={r * 0.6} fill={core} />
    </g>
  );
  return (
    <defs>
      <pattern id={robeId} width={72} height={72} patternUnits="userSpaceOnUse">
        <rect width={72} height={72} fill={C.robe.base} />
        <ellipse cx={30} cy={10} rx={8} ry={4} fill={C.robeFlowerLeaf} transform="rotate(-30 30 10)" />
        <ellipse cx={62} cy={44} rx={8} ry={4} fill={C.robeFlowerLeaf} transform="rotate(30 62 44)" />
        {flower(18, 18, 7, C.robeFlowerA, C.robeFlowerB)}
        {flower(52, 54, 6, C.robeFlowerB, C.robeFlowerA)}
      </pattern>
      <pattern id={scarfId} width={38} height={38} patternUnits="userSpaceOnUse">
        <rect width={38} height={38} fill={C.scarf.base} />
        {flower(10, 10, 3.6, C.scarfFlower, C.scarfFlowerCore)}
        {flower(29, 29, 3.6, C.scarfFlower, C.scarfFlowerCore)}
      </pattern>
    </defs>
  );
}

/* ── светящийся глаз ярости ── */
function RageEye({ cx, cy, rx, ry, side, part }: { cx: number; cy: number; rx: number; ry: number; side: -1 | 1; part: string }) {
  const e = EMOTION_TABLE.angry;
  return (
    <g>
      <ellipse cx={cx} cy={cy} rx={rx * 1.9} ry={ry * 1.7} fill={C.rageGlow} opacity={0.5} />
      <ellipse cx={cx} cy={cy} rx={rx * 1.45} ry={ry * 1.35} fill={C.rageGlow} opacity={0.6} />
      <Eye
        part={part}
        cx={cx}
        cy={cy}
        rx={rx}
        ry={ry}
        side={side}
        expr={{ ...e, lidTop: 0.18, open: 1.05 }}
        lid={C.skinRage}
        pupilR={0}
        white={C.rageEye}
        custom={<ellipse cx={0} cy={ry * 0.15} rx={rx * 0.55} ry={ry * 0.4} fill={C.rageGlow} />}
      />
    </g>
  );
}

/* ── оскал ярости: оба ряда зубов, раскрытие по форме рта ── */
function RageMouth({ cx, cy, w, shape }: { cx: number; cy: number; w: number; shape: MouthShape }) {
  const { sw } = useRig();
  const id = safeId(useId());
  const open = { closed: 0.26, slight: 0.36, wide: 0.62, o: 0.56, smile: 0.4 }[shape];
  const ww = shape === 'o' ? w * 0.7 : w;
  const h = w * open;
  const lift = shape === 'smile' ? -w * 0.12 : w * 0.06;
  const d = `M${-ww / 2} ${lift} Q${-ww / 2} ${-h / 2} ${-ww * 0.3} ${-h / 2} L${ww * 0.3} ${-h / 2} Q${ww / 2} ${-h / 2} ${ww / 2} ${lift} Q${ww / 2} ${h / 2} ${ww * 0.3} ${h / 2} L${-ww * 0.3} ${h / 2} Q${-ww / 2} ${h / 2} ${-ww / 2} ${lift}Z`;
  const tH = Math.min(h * 0.36, w * 0.13);
  const teethX = [-0.3, -0.15, 0, 0.15, 0.3].map((t) => t * ww);
  return (
    <g data-part="mouth" transform={`translate(${cx} ${cy})`}>
      <defs>
        <clipPath id={id}>
          <path d={d} />
        </clipPath>
      </defs>
      <path d={d} fill={palette.mouth.base} />
      <g clipPath={`url(#${id})`}>
        <ellipse cx={0} cy={h / 2} rx={ww * 0.3} ry={h * 0.22} fill={palette.tongue.base} />
        <rect x={-ww} y={-h} width={ww * 2} height={h / 2 + tH} fill={palette.teeth.base} />
        <rect x={-ww} y={h / 2 - tH} width={ww * 2} height={h} fill={palette.teeth.base} />
        <g stroke={INK} strokeWidth={sw * 0.8}>
          <line x1={-ww} y1={-h / 2 + tH} x2={ww} y2={-h / 2 + tH} />
          <line x1={-ww} y1={h / 2 - tH} x2={ww} y2={h / 2 - tH} />
          {teethX.map((x) => (
            <g key={x}>
              <line x1={x} y1={-h} x2={x} y2={-h / 2 + tH} />
              <line x1={x + ww * 0.075} y1={h / 2 - tH} x2={x + ww * 0.075} y2={h} />
            </g>
          ))}
        </g>
      </g>
      <path data-outline="" d={d} fill="none" stroke={INK} strokeWidth={sw} />
    </g>
  );
}

function Glasses({ rage }: { rage: boolean }) {
  const { sw } = useRig();
  return (
    <g data-part="glasses" transform={rage ? 'rotate(-7 26 -1010)' : undefined}>
      {!rage && <circle cx={-14} cy={-1008} r={33} fill={C.lens} opacity={C.lensOpacity} />}
      {!rage && <circle cx={66} cy={-1008} r={33} fill={C.lens} opacity={C.lensOpacity} />}
      <circle cx={-14} cy={-1008} r={33} fill="none" stroke={C.glassFrame} strokeWidth={sw} />
      <circle cx={66} cy={-1008} r={33} fill="none" stroke={C.glassFrame} strokeWidth={sw} />
      <Line d="M19 -1012 Q26 -1022 33 -1012 M-47 -1012 L-98 -1024 M99 -1012 L150 -1024" />
      {rage && <Line d="M48 -1030 l14 12 l-6 10 l12 10" />}
    </g>
  );
}

/** Вены ярости: цветная линия толщиной в контур. */
function Veins({ d, w = 1.1 }: { d: string; w?: number }) {
  return <Line d={d} color={C.vein} w={w} />;
}

function Slipper({ seed }: { seed: number }) {
  return (
    <g>
      <Shape d={SLIPPER} tone={C.slipper} rim={[8, 8]} />
      <Shape d={tuftPath(ellipsePts(44, -4, 40, 15, 8), 10, 9, seed)} tone={C.slipperFluff} rim={[0, 4]} />
      <Shape d={tuftPath(ellipsePts(84, -8, 16, 15, 8), 8, 7, seed + 5)} tone={C.slipperFluff} rim={[3, 3]} />
    </g>
  );
}

export function BabaGlyba(props: BabaGlybaProps) {
  const { rage = false, emotion = 'neutral', mouth = 'closed', look, blink = 0, shadow = true, wind = 1 } = props;
  const p = resolvePose(props.pose, rage ? GLYBA_RAGE_IDLE : GLYBA_IDLE, props.rig, GLYBA_POSES);
  const uid = safeId(useId());
  const robeId = uid + 'robe';
  const scarfId = uid + 'scarf';
  const robeFill = `url(#${robeId})`;
  const scarfFill = `url(#${scarfId})`;
  const skin = rage ? C.skinRage : C.skin;
  const sq = p.squash;

  // в ярости тело раздувается
  const bulk = rage ? 1.2 : 1;
  const tw = rage ? 1.08 : 1;
  const ROBE = smoothClosed(wx(ROBE_PTS, tw));
  const APRON = smoothClosed(wx(APRON_PTS, tw));
  const SH_L: Pt = [SHOULDER_L[0] * tw, SHOULDER_L[1]];
  const SH_R: Pt = [SHOULDER_R[0] * tw, SHOULDER_R[1]];

  // робкий, добрый взгляд в обычной форме
  const e0 = EMOTION_TABLE[emotion];
  const e = rage ? EMOTION_TABLE.angry : { ...e0, lidTop: clamp(e0.lidTop + 0.08, 0, 1), browTilt: e0.browTilt - 6 };

  const bicep = smoothClosed(
    wx(
      [
        [-48, -8],
        [-62, 70],
        [-58, 150],
        [-40, 220],
        [40, 220],
        [74, 140],
        [88, 70],
        [58, -8],
        [0, -26],
      ],
      bulk,
    ),
  );
  const forearm = smoothClosed(
    wx(
      [
        [-44, -12],
        [-48, 80],
        [-36, 168],
        [-18, 184],
        [22, 184],
        [40, 168],
        [52, 80],
        [48, -12],
      ],
      bulk,
    ),
  );
  const puff = smoothClosed(
    wx(
      [
        [-62, -48],
        [0, -62],
        [64, -48],
        [78, 10],
        [62, 50],
        [0, 62],
        [-62, 50],
        [-78, 10],
      ],
      bulk,
    ),
  );
  const veins = rage ? (
    <Veins d="M20 70 q16 20 6 46 q-8 20 8 40 M26 116 q18 4 28 -10 M-14 90 q-10 24 2 44" />
  ) : null;
  const forearmVeins = rage ? (
    <Veins d="M12 30 q-10 30 4 60 q10 20 0 50 M4 90 q18 6 26 22" />
  ) : null;

  const arm = (side: 'L' | 'R') => {
    const a = side === 'L' ? p.armL : p.armR;
    return (
      <Limb
        names={[`arm${side}`, `upperArm${side}`, `forearm${side}`, `hand${side}`]}
        at={side === 'L' ? SH_L : SH_R}
        mirror={side === 'R'}
        angles={armAngles(a)}
        segs={[
          {
            len: UPPER_ARM,
            node: (
              <g>
                <Shape d={bicep} tone={skin} rim={[16 * bulk, 0]} />
                {veins}
              </g>
            ),
            over: (
              <g>
                <Shape d={puff} fill={robeFill} rim={[14, 10]} overlay />
                <Tube d={`M${-60 * bulk} 46 Q0 ${70} ${60 * bulk} 46`} width={14} tone={C.apronTrim} shade={false} />
              </g>
            ),
          },
          {
            len: FOREARM,
            node: (
              <g>
                <Shape d={forearm} tone={skin} rim={[12 * bulk, 0]} />
                {forearmVeins}
              </g>
            ),
          },
        ]}
        end={
          <g transform="translate(0 -4)">
            <Hand size={46 * bulk} tone={skin} form={a.form} />
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
          { len: THIGH, width: 92 * (rage ? 1.1 : 1), tone: C.stocking },
          { len: SHIN, width: 84 * (rage ? 1.1 : 1), tone: C.stocking },
        ]}
        end={<Slipper seed={side === 'L' ? 3 : 4} />}
      />
    );
  };

  // платок: в ярости хвосты развеваются назад
  const tails = rage ? (
    <g data-part="scarfTails">
      <Shape
        d={smoothClosed([
          [10, -900],
          [-80, -930 - 30 * wind],
          [-190, -900 - 70 * wind],
          [-300, -940 - 40 * wind],
          [-250, -880 - 20 * wind],
          [-170, -860 - 40 * wind],
          [-60, -872],
        ])}
        fill={scarfFill}
        rim={[0, 12]}
        overlay
      />
      <Shape
        d={smoothClosed([
          [10, -884],
          [-90, -860 - 10 * wind],
          [-210, -830 - 40 * wind],
          [-290, -840 - 10 * wind],
          [-220, -790 - 20 * wind],
          [-110, -820],
          [-20, -856],
        ])}
        fill={scarfFill}
        rim={[0, 10]}
        overlay
      />
    </g>
  ) : (
    <g data-part="scarfTails">
      <Shape d={smoothClosed([[44, -878], [82, -866], [96, -806], [74, -786], [52, -832]])} fill={scarfFill} rim={[8, 6]} overlay />
      <Shape d={smoothClosed([[40, -876], [10, -858], [-4, -810], [20, -798], [38, -838]])} fill={scarfFill} rim={[8, 6]} overlay />
    </g>
  );

  const content = (
    <>
      <FabricDefs robeId={robeId} scarfId={scarfId} />
      <g data-part="body" transform={`translate(${p.bodyX} ${p.bodyY})`}>
        {leg('L')}
        {leg('R')}
        <Pivot part="torso" at={PELVIS} rotate={p.lean}>
          <g transform={`translate(${PELVIS[0]} ${PELVIS[1]}) scale(${1 / Math.sqrt(sq)} ${sq}) translate(${-PELVIS[0]} ${-PELVIS[1]})`}>
            {rage && tails}
            <Shape d={ROBE} fill={robeFill} shadow={ROBE_SHADOW} overlay part="housecoat" />
            <g data-part="apron">
              <Tube d={APRON} width={16} tone={C.apronTrim} shade={false} />
              <Shape
                d={APRON}
                tone={C.apron}
                rim={[18, 10]}
                inner={
                  rage ? (
                    <g>
                      {/* фартук трещит по швам: прорехи с халатом под ними */}
                      <Shape d={smoothClosed([[-200, -470], [-150, -452], [-170, -420], [-136, -396], [-176, -370], [-206, -380]], 0.8)} fill={robeFill} />
                      <Shape d={smoothClosed([[214, -330], [160, -318], [182, -290], [150, -262], [190, -240], [222, -250]], 0.8)} fill={robeFill} />
                      <Shape d={smoothClosed([[-40, -186], [-20, -220], [0, -196], [20, -226], [40, -184]], 0.8)} fill={robeFill} />
                    </g>
                  ) : undefined
                }
              />
              <Shape d={smoothClosed([[20, -380], [120, -380], [116, -300], [24, -300]], 0.4)} tone={C.apron} rim={[0, -8]} />
              <Tube d="M20 -378 L120 -378" width={12} tone={C.apronTrim} shade={false} />
              {rage && <Line d="M-130 -560 l14 10 M-118 -540 l14 10 M150 -560 l-14 10 M160 -540 l-14 10" />}
            </g>
            {/* шея-складка под подбородком */}
            <Shape d={smoothClosed([[-60, -880], [0, -900], [80, -888], [70, -856], [0, -846], [-56, -858]])} tone={skin} rim={[8, 0]} />

            <Pivot part="head" at={NECK} rotate={p.head}>
              <Shape d={SCARF_BACK} fill={scarfFill} rim={[16, 12]} overlay part="scarf" />
              <Shape d={FACE} tone={skin} rim={[14, 10]} part="face" />
              <Shape d={SCARF_FRONT} fill={scarfFill} rim={[0, 10]} overlay />
              <circle cx={-44} cy={-958} r={22} fill={C.blush} opacity={rage ? 0.9 : 0.7} />
              <circle cx={110} cy={-958} r={20} fill={C.blush} opacity={rage ? 0.9 : 0.7} />
              <g data-part="eyes">
                {rage ? (
                  <>
                    <RageEye part="eyeL" cx={-14} cy={-1010} rx={21} ry={22} side={-1} />
                    <RageEye part="eyeR" cx={66} cy={-1010} rx={21} ry={22} side={1} />
                  </>
                ) : (
                  <>
                    <Eye part="eyeL" cx={-14} cy={-1008} rx={19} ry={21} side={-1} expr={e} lid={skin} pupilR={7.5} look={look} blink={blink} />
                    <Eye part="eyeR" cx={66} cy={-1008} rx={19} ry={21} side={1} expr={e} lid={skin} pupilR={7.5} look={look} blink={blink} />
                  </>
                )}
              </g>
              <Glasses rage={rage} />
              <g data-part="brows">
                <Brow part="browL" cx={-16} cy={-1052} len={36} thick={11} side={-1} expr={e} raiseUnit={22} color={C.brow} extraTilt={rage ? 10 : 0} />
                <Brow part="browR" cx={68} cy={-1052} len={36} thick={11} side={1} expr={e} raiseUnit={22} color={C.brow} extraTilt={rage ? 10 : 0} />
              </g>
              <Shape d={NOSE} tone={skin} rim={[6, 6]} part="nose" />
              {rage ? (
                <>
                  <RageMouth cx={32} cy={-934} w={104} shape={mouth} />
                  <Veins d="M-60 -1040 q10 -10 4 -22 q-4 -10 6 -18 M122 -1040 q-10 -10 -4 -22" />
                </>
              ) : (
                <>
                  <Mouth cx={36} cy={-946} w={48} shape={mouth} mood={e.mood} style={{ baseMood: 0.25 }} />
                  
                </>
              )}
              {!rage && tails}
              <Shape d={smoothClosed(ellipsePts(44, -876, 24, 20, 8))} fill={scarfFill} rim={[6, 6]} overlay part="scarfKnot" />
            </Pivot>

            {arm('L')}
            {arm('R')}
          </g>
        </Pivot>
      </g>
    </>
  );

  return (
    <CharacterRoot name={rage ? 'BabaGlybaRage' : 'BabaGlyba'} x={props.x} y={props.y} scale={props.scale} facing={props.facing}>
      {shadow && <GroundShadow rx={rage ? 420 : 320} lift={p.bodyY} />}
      {rage ? <InnerScale k={RAGE_SCALE}>{content}</InnerScale> : content}
    </CharacterRoot>
  );
}

export default BabaGlyba;
