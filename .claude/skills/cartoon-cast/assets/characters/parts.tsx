/**
 * Общие строительные блоки рига. Здесь только рисование; цвета приходят из palette.ts,
 * толщина контура — из RigContext (OUTLINE / масштаб), поэтому она одинакова в кадре
 * при любом scale персонажа.
 */
import React, { ReactNode, useId } from 'react';
import { OUTLINE, palette, Tone } from './palette';
import {
  ArmPose,
  CharacterProps,
  clamp,
  EyeExpr,
  Facing,
  LegPose,
  MouthShape,
  Pt,
  RigContext,
  safeId,
  smoothClosed,
  tuftPath,
  useRig,
} from './rig';

const INK = palette.ink;

/* ───────────────────────── Корень персонажа ───────────────────────── */

export function CharacterRoot({
  name,
  x = 0,
  y = 0,
  scale = 1,
  facing = 'right',
  children,
}: {
  name: string;
  x?: number;
  y?: number;
  scale?: number;
  facing?: Facing;
  children: ReactNode;
}) {
  const fx = facing === 'left' ? -1 : 1;
  return (
    <RigContext.Provider value={{ sw: OUTLINE / scale }}>
      <g
        data-character={name}
        transform={`translate(${x} ${y}) scale(${fx * scale} ${scale})`}
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        {children}
      </g>
    </RigContext.Provider>
  );
}

/** Внутренний масштаб части персонажа (например, «ГЛЫБА» в 1.28 раза больше) без утолщения контура. */
export function InnerScale({ k, from = [0, 0], to = from, children }: { k: number; from?: Pt; to?: Pt; children: ReactNode }) {
  const { sw } = useRig();
  return (
    <RigContext.Provider value={{ sw: sw / k }}>
      <g transform={`translate(${to[0]} ${to[1]}) scale(${k}) translate(${-from[0]} ${-from[1]})`}>{children}</g>
    </RigContext.Provider>
  );
}

/* ───────────────────────── Суставы ───────────────────────── */

/** Сустав с дочерними координатами в системе родителя (пивот = точка at). */
export function Pivot({ part, at, rotate = 0, children }: { part: string; at: Pt; rotate?: number; children: ReactNode }) {
  return (
    <g data-part={part} data-pivot={`${at[0]} ${at[1]}`} transform={rotate ? `rotate(${r1(rotate)} ${at[0]} ${at[1]})` : undefined}>
      {children}
    </g>
  );
}

/** Сустав с локальными координатами: (0,0) — сам сустав, сегмент уходит вниз по +y. */
export function Joint({ part, at, rotate = 0, children }: { part: string; at: Pt; rotate?: number; children: ReactNode }) {
  return (
    <g data-part={part} data-pivot={`${at[0]} ${at[1]}`} transform={`translate(${at[0]} ${at[1]}) rotate(${r1(rotate)})`}>
      {children}
    </g>
  );
}

const r1 = (n: number) => Math.round(n * 100) / 100;

/* ───────────────────────── Заливка + тень + контур ───────────────────────── */

export interface ShapeProps {
  d: string;
  tone?: Tone;
  /** Заливка вместо tone.base (например, url(#pattern)). */
  fill?: string;
  /** Явная форма тени (рисуется внутри фигуры). */
  shadow?: string;
  /** Автотень-полумесяц: сдвиг светлой копии фигуры (свет сверху-слева). */
  rim?: Pt;
  /** Тень-наложение (для узорчатых тканей) вместо tone.shade. */
  overlay?: boolean;
  /** Детали, обрезанные по фигуре (рисуются до контура). */
  inner?: ReactNode;
  outline?: boolean;
  part?: string;
  transform?: string;
  opacity?: number;
}

export function Shape({ d, tone, fill, shadow, rim, overlay, inner, outline = true, part, transform, opacity }: ShapeProps) {
  const { sw } = useRig();
  const id = safeId(useId());
  const base = fill ?? tone?.base ?? 'none';
  const shadeFill = overlay ? palette.shadeOverlay : tone?.shade ?? palette.shadeOverlay;
  const shadeOpacity = overlay || !tone ? palette.shadeOverlayOpacity : undefined;
  const needsClip = !!(shadow || rim || inner);
  return (
    <g data-part={part} transform={transform} opacity={opacity}>
      {needsClip && (
        <defs>
          <clipPath id={id}>
            <path d={d} />
          </clipPath>
          {rim && overlay && (
            <mask id={id + 'm'} maskUnits="userSpaceOnUse" x={-1e4} y={-1e4} width={2e4} height={2e4}>
              <rect x={-1e4} y={-1e4} width={2e4} height={2e4} fill="#fff" />
              <path d={d} fill="#000" transform={`translate(${-rim[0]} ${-rim[1]})`} />
            </mask>
          )}
        </defs>
      )}
      <path d={d} fill={base} />
      {needsClip && (
        <g clipPath={`url(#${id})`}>
          {rim &&
            (overlay ? (
              <path d={d} fill={shadeFill} opacity={shadeOpacity} mask={`url(#${id}m)`} />
            ) : (
              <>
                <path d={d} fill={shadeFill} opacity={shadeOpacity} />
                <path d={d} fill={base} transform={`translate(${-rim[0]} ${-rim[1]})`} />
              </>
            ))}
          {shadow && <path d={shadow} fill={shadeFill} opacity={shadeOpacity} />}
          {inner}
        </g>
      )}
      {outline && <path data-outline="" d={d} fill="none" stroke={INK} strokeWidth={sw} />}
    </g>
  );
}

/** Линия-деталь (складка, шов) той же толщины, что и контур. */
export function Line({ d, color = INK, w = 1, opacity }: { d: string; color?: string; w?: number; opacity?: number }) {
  const { sw } = useRig();
  return <path data-outline={w === 1 && color === INK ? '' : undefined} d={d} fill="none" stroke={color} strokeWidth={sw * w} opacity={opacity} />;
}

/** Трубка с контуром (шнурок, бровь, ремешок): контур — ink, середина — tone. */
export function Tube({ d, width, tone, shade = true }: { d: string; width: number; tone: Tone; shade?: boolean }) {
  const { sw } = useRig();
  return (
    <g>
      <path d={d} fill="none" stroke={INK} strokeWidth={width + sw * 2} />
      <path d={d} fill="none" stroke={tone.base} strokeWidth={width} />
      {shade && width > 14 && (
        <path d={d} fill="none" stroke={tone.shade} strokeWidth={width * 0.32} transform={`translate(${width * 0.3} 0)`} />
      )}
    </g>
  );
}

/* ───────────────────────── Конечности ───────────────────────── */

export interface Segment {
  len: number;
  /** Толщина трубки; без неё сегмент рисуется только узлом node. */
  width?: number;
  tone?: Tone;
  /** Детали поверх трубки в локальных координатах сегмента (0,0 — сустав). */
  node?: ReactNode;
  /** Детали поверх следующего сегмента (рукав, манжета, шерсть на локте). */
  over?: ReactNode;
}

/**
 * Конечность из двух сегментов и кисти/стопы. Трубки рисуются в два прохода
 * (сначала все контуры, потом все заливки), поэтому сгиб резиновый и без шва.
 */
export function Limb({
  names,
  at,
  mirror = false,
  angles,
  segs,
  end,
}: {
  names: [string, string, string, string];
  at: Pt;
  mirror?: boolean;
  angles: [number, number, number];
  segs: [Segment, Segment];
  end?: ReactNode;
}) {
  const { sw } = useRig();
  const [a, b, c] = angles;
  const [s1, s2] = segs;
  const tubeOutline = (s: Segment) =>
    s.width ? <line x1={0} y1={0} x2={0} y2={s.len} stroke={INK} strokeWidth={s.width + sw * 2} /> : null;
  const tubeFill = (s: Segment) =>
    s.width && s.tone ? (
      <>
        <line x1={0} y1={0} x2={0} y2={s.len} stroke={s.tone.base} strokeWidth={s.width} />
        <line
          x1={s.width * 0.31}
          y1={s.width * 0.08}
          x2={s.width * 0.31}
          y2={s.len - s.width * 0.08}
          stroke={s.tone.shade}
          strokeWidth={s.width * 0.38}
        />
      </>
    ) : null;
  return (
    <g data-part={names[0]} transform={`translate(${at[0]} ${at[1]})${mirror ? ' scale(-1 1)' : ''}`}>
      {/* проход 1: контуры трубок */}
      <g transform={`rotate(${r1(a)})`}>
        {tubeOutline(s1)}
        <g transform={`translate(0 ${s1.len}) rotate(${r1(b)})`}>{tubeOutline(s2)}</g>
      </g>
      {/* проход 2: заливки, детали, кисть */}
      <Joint part={names[1]} at={[0, 0]} rotate={a}>
        {tubeFill(s1)}
        {s1.node}
        <Joint part={names[2]} at={[0, s1.len]} rotate={b}>
          {tubeFill(s2)}
          {s2.node}
          <Joint part={names[3]} at={[0, s2.len]} rotate={c}>
            {end}
          </Joint>
          {s2.over}
        </Joint>
        {s1.over}
      </Joint>
    </g>
  );
}

/** Перевод углов позы в повороты сегментов руки (рисуется как левая, правая зеркалится). */
export const armAngles = (p: ArmPose): [number, number, number] => [p.shoulder, -p.elbow, -p.hand];
/** Углы ноги: стопа носком в +x. */
export const legAngles = (p: LegPose): [number, number, number] => [-p.hip, p.knee, -p.foot];

/** Пушистый сегмент конечности: капсула с клочковатым контуром (0,0 — сустав, вниз по +y). */
export function FurSegment({ len, width, tone, seed = 1, tufts = 12, amp = 16 }: { len: number; width: number; tone: Tone; seed?: number; tufts?: number; amp?: number }) {
  const r = width / 2;
  const base: Pt[] = [
    [r, 0],
    [r * 1.02, len * 0.5],
    [r, len],
    [r * 0.7, len + r * 0.7],
    [0, len + r],
    [-r * 0.7, len + r * 0.7],
    [-r, len],
    [-r * 1.02, len * 0.5],
    [-r, 0],
    [-r * 0.7, -r * 0.7],
    [0, -r],
    [r * 0.7, -r * 0.7],
  ];
  return <Shape d={tuftPath(base, tufts, amp, seed, 0.6)} tone={tone} rim={[width * 0.22, 0]} />;
}

/* ───────────────────────── Кисти ───────────────────────── */

const scalePts = (pts: Pt[], s: number, dx = 0, dy = 0): Pt[] => pts.map(([x, y]) => [x * s + dx, y * s + dy]);

/** Капсула (палец) для двухпроходного рисования. */
interface Capsule {
  a: Pt;
  b: Pt;
  w: number;
}

/**
 * Большая мультяшная кисть: (0,0) — запястье, пальцы вниз (+y), большой палец к телу (+x).
 * Ладонь, три пальца и большой палец рисуются в два прохода: общий контур, потом заливка,
 * поэтому силуэт цельный, а между пальцами остаётся тонкая линия-разделитель.
 */
export function Hand({ size, tone, form = 'open', claws }: { size: number; tone: Tone; form?: 'open' | 'fist'; claws?: Tone }) {
  const { sw } = useRig();
  const s = size;
  const fw = s * 0.44;
  const gap = fw + sw * 0.55;
  let palm: string;
  let caps: Capsule[];
  if (form === 'fist') {
    const ff = s * 0.36;
    const g = ff + sw * 0.6;
    palm = smoothClosed(scalePts([[-0.62, 0.02], [0.58, 0.0], [0.82, 0.4], [0.74, 0.98], [0.1, 1.12], [-0.6, 1.02], [-0.76, 0.5]], s));
    caps = [0, 1, 2].map((i) => ({ a: [-0.58 * s, 0.42 * s + g * i] as Pt, b: [0.2 * s - i * 0.06 * s, 0.42 * s + g * i] as Pt, w: ff }));
    caps.push({ a: [0.56 * s, 0.3 * s], b: [0.62 * s, 0.86 * s], w: ff * 1.1 });
  } else {
    palm = smoothClosed(scalePts([[-0.6, 0.0], [0.56, 0.0], [0.72, 0.5], [0.64, 1.0], [0.0, 1.1], [-0.66, 1.0], [-0.74, 0.46]], s));
    caps = [
      { a: [-0.02 * s - gap, 0.8 * s], b: [-0.05 * s - gap * 1.05, 1.5 * s], w: fw },
      { a: [-0.02 * s, 0.85 * s], b: [-0.02 * s, 1.62 * s], w: fw },
      { a: [-0.02 * s + gap, 0.8 * s], b: [0.02 * s + gap * 1.02, 1.48 * s], w: fw },
      { a: [0.46 * s, 0.38 * s], b: [0.82 * s, 0.7 * s], w: fw * 1.05 },
    ];
  }
  if (claws) caps = caps.slice(0, 3).map((c) => ({ ...c, b: [c.b[0], c.a[1] + (c.b[1] - c.a[1]) * 0.6] as Pt }));
  const capLine = (c: Capsule, stroke: string, w: number, key: number, dx = 0) => (
    <line key={key} x1={c.a[0] + dx} y1={c.a[1]} x2={c.b[0] + dx} y2={c.b[1]} stroke={stroke} strokeWidth={w} />
  );
  return (
    <g data-part="hand">
      {claws &&
        caps.slice(0, 3).map((c, i) => (
          <Tube
            key={'cl' + i}
            d={`M${c.b[0]} ${c.b[1] - s * 0.1} q${s * 0.05} ${s * 1.05} ${-s * 0.55} ${s * 1.45}`}
            width={s * 0.22}
            tone={claws}
            shade={false}
          />
        ))}
      {/* проход 1: общий контур */}
      <path d={palm} fill={INK} stroke={INK} strokeWidth={sw * 2} />
      {caps.map((c, i) => capLine(c, INK, c.w + sw * 2, i))}
      {/* проход 2: заливка */}
      <path d={palm} fill={tone.base} />
      {form === 'fist' && caps.map((c, i) => capLine(c, INK, c.w + sw * 2, i))}
      {caps.map((c, i) => capLine(c, tone.base, c.w, i))}
      {/* тень: полоса на внешней стороне пальцев и полумесяц на ладони */}
      {caps.map((c, i) => capLine({ ...c, a: [c.a[0], c.a[1] + c.w * 0.15] }, tone.shade, c.w * 0.36, i, c.w * 0.3))}
    </g>
  );
}

/* ───────────────────────── Глаза и брови ───────────────────────── */

export interface EyeProps {
  part: string;
  cx: number;
  cy: number;
  rx: number;
  ry: number;
  /** -1 — левый глаз на экране, +1 — правый. */
  side: -1 | 1;
  expr: EyeExpr;
  lid: Tone;
  pupilR: number;
  look?: { x?: number; y?: number };
  blink?: number;
  /** Подмена содержимого белка (например, светящиеся глаза). */
  custom?: ReactNode;
  white?: string;
}

export function Eye({ part, cx, cy, rx, ry, side, expr, lid, pupilR, look, blink = 0, custom, white }: EyeProps) {
  const { sw } = useRig();
  const id = safeId(useId());
  const ryO = ry * expr.open;
  const lidTop = clamp(expr.lidTop + blink * (1.05 - expr.lidTop), 0, 1.05);
  const lidY = -ryO + 2 * ryO * lidTop;
  const pr = pupilR * expr.pupil;
  const lx = clamp(look?.x ?? 0, -1, 1) * (rx - pr - sw);
  const ly = clamp((look?.y ?? 0) + expr.lookY, -1, 1) * (ryO - pr - sw);
  const tilt = -side * expr.lidTilt;
  const R = rx * 1.6;
  const botY = ryO - 2 * ryO * expr.lidBottom + R;
  return (
    <g data-part={part} transform={`translate(${cx} ${cy})`}>
      <defs>
        <clipPath id={id}>
          <ellipse rx={rx} ry={ryO} />
        </clipPath>
      </defs>
      <ellipse rx={rx} ry={ryO} fill={white ?? palette.eyeWhite.base} />
      <g clipPath={`url(#${id})`}>
        {custom ?? <circle cx={lx} cy={ly} r={pr} fill={palette.pupil} />}
        {lidTop > 0.01 && (
          <g transform={`rotate(${tilt} 0 ${lidY})`}>
            <rect x={-rx * 2} y={-ryO * 3} width={rx * 4} height={lidY + ryO * 3} fill={lid.base} />
            <rect x={-rx * 2} y={lidY - ry * 0.22} width={rx * 4} height={ry * 0.22} fill={lid.shade} />
            <line x1={-rx * 2} y1={lidY} x2={rx * 2} y2={lidY} stroke={INK} strokeWidth={sw} />
          </g>
        )}
        {expr.lidBottom > 0.01 && <circle cx={0} cy={botY} r={R} fill={lid.base} stroke={INK} strokeWidth={sw} />}
      </g>
      <ellipse data-outline="" rx={rx} ry={ryO} fill="none" stroke={INK} strokeWidth={sw} />
    </g>
  );
}

export function Brow({
  part,
  cx,
  cy,
  len,
  thick,
  side,
  expr,
  raiseUnit,
  color,
  extraTilt = 0,
  halo,
}: {
  part: string;
  cx: number;
  cy: number;
  len: number;
  thick: number;
  side: -1 | 1;
  expr: EyeExpr;
  raiseUnit: number;
  color: string;
  extraTilt?: number;
  /** Цвет ореола вокруг брови — чтобы она читалась поверх волос или очков. */
  halo?: string;
}) {
  const { sw } = useRig();
  const y = cy - expr.browRaise * raiseUnit;
  const tilt = -side * (expr.browTilt + extraTilt);
  const h = -expr.browCurve * len * 0.45;
  const d = `M${-len / 2} 0 Q0 ${h} ${len / 2} 0`;
  return (
    <g data-part={part} transform={`translate(${cx} ${y}) rotate(${tilt})`}>
      {halo && <path d={d} fill="none" stroke={halo} strokeWidth={thick + sw * 3.1} />}
      <path d={d} fill="none" stroke={INK} strokeWidth={thick + sw * 2} />
      <path d={d} fill="none" stroke={color} strokeWidth={thick} />
    </g>
  );
}

/* ───────────────────────── Рот ───────────────────────── */

export interface MouthStyle {
  /** Асимметрия: > 0 правый уголок выше (ухмылка). */
  smirk?: number;
  /** Постоянная улыбчивость закрытого рта. */
  baseMood?: number;
  /** Рисовать ли верхние зубы. */
  teeth?: boolean;
  /** Цвет губ / кожи вокруг (для уголков). */
  rotate?: number;
}

export function Mouth({
  cx,
  cy,
  w,
  shape,
  mood,
  style = {},
}: {
  cx: number;
  cy: number;
  w: number;
  shape: MouthShape;
  mood: number;
  style?: MouthStyle;
}) {
  const { sw } = useRig();
  const id = safeId(useId());
  const smirk = style.smirk ?? 0;
  const m = clamp(mood + (style.baseMood ?? 0), -1, 1);
  const rot = (style.rotate ?? 0) - smirk * 9;
  const teeth = style.teeth ?? true;
  const P = (x: number, y: number) => `${Math.round(x * w * 10) / 10} ${Math.round(y * w * 10) / 10}`;

  let body: string | null = null;
  let tongue: ReactNode = null;
  let teethTop: number | null = null;
  let line: string | null = null;

  switch (shape) {
    case 'closed': {
      const yl = -m * 0.1;
      const yr = -m * 0.1 - smirk * 0.14;
      line = `M${P(-0.45, yl)} Q${P(0, m * 0.16)} ${P(0.45, yr)}`;
      break;
    }
    case 'slight':
      body = `M${P(-0.36, -m * 0.05)} Q${P(0, -0.06)} ${P(0.36, -m * 0.05 - smirk * 0.08)} Q${P(0.05, 0.36 + m * 0.1)} ${P(-0.36, -m * 0.05)}Z`;
      teethTop = 0.02;
      tongue = <ellipse cx={0.04 * w} cy={0.3 * w} rx={0.2 * w} ry={0.12 * w} fill={palette.tongue.base} />;
      break;
    case 'wide':
      body = `M${P(-0.5, -0.06 - m * 0.05)} Q${P(0, -0.18)} ${P(0.5, -0.06 - m * 0.05)} C${P(0.52, 0.48)} ${P(0.26, 0.78)} ${P(0, 0.78)} C${P(-0.26, 0.78)} ${P(-0.52, 0.48)} ${P(-0.5, -0.06 - m * 0.05)}Z`;
      teethTop = 0.08;
      tongue = <ellipse cx={0.06 * w} cy={0.74 * w} rx={0.32 * w} ry={0.22 * w} fill={palette.tongue.base} />;
      break;
    case 'o':
      body = `M${P(0, -0.12)} C${P(0.3, -0.12)} ${P(0.3, 0.56)} ${P(0, 0.56)} C${P(-0.3, 0.56)} ${P(-0.3, -0.12)} ${P(0, -0.12)}Z`;
      tongue = <ellipse cx={0.02 * w} cy={0.52 * w} rx={0.17 * w} ry={0.12 * w} fill={palette.tongue.base} />;
      break;
    case 'smile':
      body = `M${P(-0.52, -0.14)} Q${P(0, 0.04)} ${P(0.52, -0.14 - smirk * 0.06)} C${P(0.48, 0.38)} ${P(0.22, 0.6)} ${P(0, 0.6)} C${P(-0.22, 0.6)} ${P(-0.48, 0.38)} ${P(-0.52, -0.14)}Z`;
      teethTop = 0.12;
      tongue = <ellipse cx={0.05 * w} cy={0.58 * w} rx={0.28 * w} ry={0.18 * w} fill={palette.tongue.base} />;
      break;
  }

  return (
    <g data-part="mouth" transform={`translate(${cx} ${cy}) rotate(${rot})`}>
      {line && <path data-outline="" d={line} fill="none" stroke={INK} strokeWidth={sw} />}
      {line && Math.abs(smirk) > 0.2 && (
        <path d={`M${P(0.42, -m * 0.1 - smirk * 0.2)} q${0.08 * w} ${-0.02 * w} ${0.1 * w} ${0.06 * w}`} fill="none" stroke={INK} strokeWidth={sw} />
      )}
      {body && (
        <>
          <defs>
            <clipPath id={id}>
              <path d={body} />
            </clipPath>
          </defs>
          <path d={body} fill={palette.mouth.base} />
          <g clipPath={`url(#${id})`}>
            {tongue}
            {teeth && teethTop !== null && (
              <>
                <rect x={-w} y={-w} width={2 * w} height={w + teethTop * w} fill={palette.teeth.base} />
                <line x1={-w} y1={teethTop * w} x2={w} y2={teethTop * w} stroke={INK} strokeWidth={sw * 0.8} />
              </>
            )}
          </g>
          <path data-outline="" d={body} fill="none" stroke={INK} strokeWidth={sw} />
        </>
      )}
    </g>
  );
}

/* ───────────────────────── Тень на полу ───────────────────────── */

export function GroundShadow({ rx, lift = 0 }: { rx: number; lift?: number }) {
  const k = clamp(1 - Math.max(0, -lift) / 900, 0.45, 1);
  return (
    <ellipse
      data-part="shadow"
      cx={0}
      cy={0}
      rx={rx * k}
      ry={rx * 0.15 * k}
      fill={palette.floorShadow}
      opacity={palette.floorShadowOpacity * (0.6 + 0.4 * k)}
    />
  );
}

export type { CharacterProps };
