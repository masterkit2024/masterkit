/**
 * Общий риг персонажей.
 *
 * Система координат каждого персонажа (до scale):
 *   x = 0  — центр персонажа, y = 0 — пол, y растёт вниз.
 *   Персонаж нарисован в 3/4, смотрит вправо. facing='left' зеркалит его.
 *   Кеша (рост 100 %) = 1000 единиц.
 *
 * Иерархия групп (data-part) одинакова у всех:
 *   character
 *   ├─ shadow                       — тень на полу
 *   └─ body (translate bodyX/bodyY)
 *      ├─ legL › thighL › shinL › footL   (пивоты: бедро, колено, щиколотка)
 *      ├─ legR › thighR › shinR › footR
 *      └─ torso (пивот: таз)                 lean, squash
 *         ├─ head (пивот: шея)               brows, eyes, mouth внутри
 *         ├─ armL › upperArmL › forearmL › handL (пивоты: плечо, локоть, запястье)
 *         └─ armR › upperArmR › forearmR › handR
 *
 * Каждый сустав — <g transform="translate(px py) rotate(a)">: точка вращения
 * всегда совпадает с суставом (это и есть transform-origin), а координаты
 * детали внутри — локальные от сустава. Пивоты каждого персонажа экспортируются
 * в его META.joints, а в DOM продублированы атрибутом data-pivot.
 *
 * Углы (градусы):
 *   руки:  shoulder > 0 — рука уходит в сторону/вверх от тела (90 = горизонтально);
 *          elbow > 0 — предплечье сгибается к телу; hand — поворот кисти.
 *   ноги:  hip > 0 — бедро вперёд (по направлению взгляда), knee > 0 — голень назад,
 *          foot > 0 — носок вверх.
 *   lean > 0 — наклон корпуса вперёд, head > 0 — наклон головы вперёд/вниз.
 *   L / R — левая и правая сторона экрана при facing='right'.
 */
import { createContext, useContext } from 'react';
import { OUTLINE } from './palette';

/* ───────────────────────── Типы ───────────────────────── */

export const EMOTIONS = ['neutral', 'panic', 'deadpan', 'grin', 'shock', 'angry', 'sleepy'] as const;
export type Emotion = (typeof EMOTIONS)[number];

export const MOUTHS = ['closed', 'slight', 'wide', 'o', 'smile'] as const;
export type MouthShape = (typeof MOUTHS)[number];

export type Facing = 'left' | 'right';
export type HandForm = 'open' | 'fist';

export interface ArmPose {
  shoulder: number;
  elbow: number;
  hand: number;
  form: HandForm;
}
export interface LegPose {
  hip: number;
  knee: number;
  foot: number;
}
export interface Pose {
  bodyX: number;
  bodyY: number;
  lean: number;
  /** 1 = норма, >1 вытянуть, <1 сплющить (резиновая пластика). */
  squash: number;
  head: number;
  armL: ArmPose;
  armR: ArmPose;
  legL: LegPose;
  legR: LegPose;
}

export type DeepPartial<T> = { [K in keyof T]?: T[K] extends object ? DeepPartial<T[K]> : T[K] };
export type PoseInput = DeepPartial<Pose>;

export const POSE_NAMES = [
  'idle',
  'wave',
  'panic',
  'shrug',
  'point',
  'chest',
  'fists',
  'think',
  'walkA',
  'walkB',
] as const;
export type PoseName = (typeof POSE_NAMES)[number];

export interface CharacterProps {
  /** Позиция точки на полу под персонажем, px кадра. */
  x?: number;
  y?: number;
  scale?: number;
  facing?: Facing;
  emotion?: Emotion;
  mouth?: MouthShape;
  /** Имя готовой позы или объект с углами (можно частично, поверх позы персонажа). */
  pose?: PoseName | PoseInput;
  /** Дополнительные углы поверх выбранной позы (удобно для анимации). */
  rig?: PoseInput;
  /** Направление взгляда, -1..1 по каждой оси. */
  look?: { x?: number; y?: number };
  /** Моргание 0..1. */
  blink?: number;
  /** Показывать ли тень на полу. */
  shadow?: boolean;
}

/* ───────────────────────── Позы ───────────────────────── */

const arm = (shoulder: number, elbow: number, hand = 0, form: HandForm = 'open'): ArmPose => ({
  shoulder,
  elbow,
  hand,
  form,
});
const leg = (hip = 0, knee = 0, foot = 0): LegPose => ({ hip, knee, foot });

export const BASE_POSE: Pose = {
  bodyX: 0,
  bodyY: 0,
  lean: 0,
  squash: 1,
  head: 0,
  armL: arm(10, 12),
  armR: arm(10, 12),
  legL: leg(),
  legR: leg(),
};

/** Универсальные позы. Персонаж кладёт их поверх своей idle-позы. */
export const POSES: Record<PoseName, PoseInput> = {
  idle: {},
  wave: { armR: { shoulder: 98, elbow: -70, hand: 8 }, head: -4 },
  panic: {
    armL: { shoulder: 150, elbow: -35, hand: 0, form: 'open' },
    armR: { shoulder: 140, elbow: -25, hand: 0, form: 'open' },
    legL: { hip: -6, knee: 14 },
    legR: { hip: 10, knee: 18 },
    bodyY: -10,
    lean: -6,
    head: -6,
  },
  shrug: {
    armL: { shoulder: 24, elbow: -72, hand: -24, form: 'open' },
    armR: { shoulder: 24, elbow: -72, hand: -24, form: 'open' },
    head: 8,
    bodyY: -6,
  },
  point: { armR: { shoulder: 92, elbow: 4, hand: -8 }, lean: -3 },
  chest: {
    armL: { shoulder: 22, elbow: 138, hand: 30 },
    armR: { shoulder: 22, elbow: 138, hand: 30 },
  },
  fists: {
    armL: { shoulder: 78, elbow: -92, hand: -10, form: 'fist' },
    armR: { shoulder: 78, elbow: -92, hand: -10, form: 'fist' },
    legL: { hip: -16, knee: 0, foot: 16 },
    legR: { hip: 16, knee: 0, foot: -16 },
    bodyY: 10,
    lean: 3,
  },
  think: { armR: { shoulder: 30, elbow: 150, hand: 40, form: 'fist' }, head: 6 },
  walkA: {
    legL: { hip: 24, knee: 6, foot: 12 },
    legR: { hip: -20, knee: 30, foot: -10 },
    armL: { shoulder: 14, elbow: 20 },
    armR: { shoulder: -6, elbow: 30 },
    bodyY: 4,
  },
  walkB: {
    legL: { hip: -20, knee: 30, foot: -10 },
    legR: { hip: 24, knee: 6, foot: 12 },
    armL: { shoulder: -6, elbow: 30 },
    armR: { shoulder: 14, elbow: 20 },
    bodyY: 4,
  },
};

function mergeDeep<T>(base: T, over?: DeepPartial<T>): T {
  if (!over) return base;
  const out: any = Array.isArray(base) ? [...(base as any)] : { ...(base as any) };
  for (const k of Object.keys(over) as (keyof T)[]) {
    const v = (over as any)[k];
    if (v === undefined) continue;
    out[k] = v && typeof v === 'object' && !Array.isArray(v) ? mergeDeep((base as any)[k], v) : v;
  }
  return out;
}

/** Сводит позу: база → idle персонажа → выбранная поза → rig-оверрайды. */
export function resolvePose(
  pose: PoseName | PoseInput | undefined,
  characterIdle: PoseInput = {},
  rig?: PoseInput,
  presets: Partial<Record<PoseName, PoseInput>> = {},
): Pose {
  let p = mergeDeep(BASE_POSE, characterIdle);
  if (typeof pose === 'string') p = mergeDeep(p, presets[pose] ?? POSES[pose]);
  else if (pose) p = mergeDeep(p, pose);
  return mergeDeep(p, rig);
}

/** Линейная интерполяция двух поз — для анимации в Remotion. */
export function lerpPose(a: Pose, b: Pose, t: number): Pose {
  const l = (x: number, y: number) => x + (y - x) * t;
  const la = (x: ArmPose, y: ArmPose): ArmPose => ({
    shoulder: l(x.shoulder, y.shoulder),
    elbow: l(x.elbow, y.elbow),
    hand: l(x.hand, y.hand),
    form: t < 0.5 ? x.form : y.form,
  });
  const ll = (x: LegPose, y: LegPose): LegPose => ({ hip: l(x.hip, y.hip), knee: l(x.knee, y.knee), foot: l(x.foot, y.foot) });
  return {
    bodyX: l(a.bodyX, b.bodyX),
    bodyY: l(a.bodyY, b.bodyY),
    lean: l(a.lean, b.lean),
    squash: l(a.squash, b.squash),
    head: l(a.head, b.head),
    armL: la(a.armL, b.armL),
    armR: la(a.armR, b.armR),
    legL: ll(a.legL, b.legL),
    legR: ll(a.legR, b.legR),
  };
}

/* ───────────────────────── Эмоции ───────────────────────── */

export interface EyeExpr {
  /** Вертикальный размер белка (1 = норма). */
  open: number;
  /** Размер зрачка (1 = норма). */
  pupil: number;
  /** Верхнее веко 0..1 (доля закрытия). */
  lidTop: number;
  /** Наклон века, > 0 — внутренний край ниже (злость). */
  lidTilt: number;
  /** Нижнее веко-дуга 0..1 (довольный прищур). */
  lidBottom: number;
  /** Смещение зрачка по вертикали -1..1. */
  lookY: number;
  /** Подъём бровей в радиусах глаза. */
  browRaise: number;
  /** Наклон бровей, > 0 — внутренний край ниже (злость), < 0 — домиком. */
  browTilt: number;
  /** Изгиб брови (> 0 — дуга вверх). */
  browCurve: number;
  /** Мимика рта по умолчанию для закрытой формы: > 0 улыбка, < 0 недовольство. */
  mood: number;
}

export const EMOTION_TABLE: Record<Emotion, EyeExpr> = {
  neutral: { open: 1, pupil: 1, lidTop: 0.06, lidTilt: 0, lidBottom: 0, lookY: 0, browRaise: 0, browTilt: 0, browCurve: 0.25, mood: 0.15 },
  panic: { open: 1.14, pupil: 0.5, lidTop: 0, lidTilt: 0, lidBottom: 0, lookY: 0, browRaise: 0.85, browTilt: -22, browCurve: 0.1, mood: -0.5 },
  deadpan: { open: 0.95, pupil: 0.9, lidTop: 0.48, lidTilt: 0, lidBottom: 0.1, lookY: 0.15, browRaise: -0.12, browTilt: 0, browCurve: 0, mood: 0 },
  grin: { open: 0.92, pupil: 1, lidTop: 0.04, lidTilt: 0, lidBottom: 0.42, lookY: -0.1, browRaise: 0.3, browTilt: -6, browCurve: 0.45, mood: 0.7 },
  shock: { open: 1.28, pupil: 0.38, lidTop: 0, lidTilt: 0, lidBottom: 0, lookY: 0, browRaise: 1.2, browTilt: 0, browCurve: 0.55, mood: -0.3 },
  angry: { open: 0.96, pupil: 0.85, lidTop: 0.32, lidTilt: 24, lidBottom: 0.06, lookY: 0.1, browRaise: -0.32, browTilt: 26, browCurve: -0.12, mood: -0.6 },
  sleepy: { open: 0.92, pupil: 1, lidTop: 0.66, lidTilt: -10, lidBottom: 0.12, lookY: 0.3, browRaise: -0.05, browTilt: -12, browCurve: 0.18, mood: 0 },
};

/** Рекомендуемая форма рта для статичного кадра каждой эмоции (для листов эмоций). */
export const EMOTION_MOUTH: Record<Emotion, MouthShape> = {
  neutral: 'closed',
  panic: 'wide',
  deadpan: 'closed',
  grin: 'smile',
  shock: 'o',
  angry: 'wide',
  sleepy: 'slight',
};

/* ───────────────────────── Контекст рига ───────────────────────── */

export interface RigCtx {
  /** Толщина контура в локальных единицах (OUTLINE / итоговый масштаб). */
  sw: number;
}
export const RigContext = createContext<RigCtx>({ sw: OUTLINE });
export const useRig = () => useContext(RigContext);

/* ───────────────────────── Геометрия ───────────────────────── */

export type Pt = [number, number];

const f = (n: number) => (Math.round(n * 10) / 10).toString();

/** Гладкий замкнутый контур через точки (Catmull-Rom → Bézier). Без острых углов. */
export function smoothClosed(pts: Pt[], tension = 1): string {
  const n = pts.length;
  let d = `M${f(pts[0][0])} ${f(pts[0][1])}`;
  for (let i = 0; i < n; i++) {
    const p0 = pts[(i - 1 + n) % n];
    const p1 = pts[i];
    const p2 = pts[(i + 1) % n];
    const p3 = pts[(i + 2) % n];
    const c1: Pt = [p1[0] + ((p2[0] - p0[0]) / 6) * tension, p1[1] + ((p2[1] - p0[1]) / 6) * tension];
    const c2: Pt = [p2[0] - ((p3[0] - p1[0]) / 6) * tension, p2[1] - ((p3[1] - p1[1]) / 6) * tension];
    d += ` C${f(c1[0])} ${f(c1[1])} ${f(c2[0])} ${f(c2[1])} ${f(p2[0])} ${f(p2[1])}`;
  }
  return d + 'Z';
}

/** Гладкая открытая линия через точки. */
export function smoothOpen(pts: Pt[], tension = 1): string {
  const n = pts.length;
  let d = `M${f(pts[0][0])} ${f(pts[0][1])}`;
  for (let i = 0; i < n - 1; i++) {
    const p0 = pts[Math.max(0, i - 1)];
    const p1 = pts[i];
    const p2 = pts[i + 1];
    const p3 = pts[Math.min(n - 1, i + 2)];
    const c1: Pt = [p1[0] + ((p2[0] - p0[0]) / 6) * tension, p1[1] + ((p2[1] - p0[1]) / 6) * tension];
    const c2: Pt = [p2[0] - ((p3[0] - p1[0]) / 6) * tension, p2[1] - ((p3[1] - p1[1]) / 6) * tension];
    d += ` C${f(c1[0])} ${f(c1[1])} ${f(c2[0])} ${f(c2[1])} ${f(p2[0])} ${f(p2[1])}`;
  }
  return d;
}

/** Точки на гладкой замкнутой кривой (для шерсти и кудрей). */
export function sampleClosed(pts: Pt[], count: number): Pt[] {
  const n = pts.length;
  const out: Pt[] = [];
  for (let k = 0; k < count; k++) {
    const t = (k / count) * n;
    const i = Math.floor(t);
    const u = t - i;
    const p0 = pts[(i - 1 + n) % n];
    const p1 = pts[i % n];
    const p2 = pts[(i + 1) % n];
    const p3 = pts[(i + 2) % n];
    const cr = (a: number, b: number, c: number, d: number) =>
      0.5 * (2 * b + (-a + c) * u + (2 * a - 5 * b + 4 * c - d) * u * u + (-a + 3 * b - 3 * c + d) * u * u * u);
    out.push([cr(p0[0], p1[0], p2[0], p3[0]), cr(p0[1], p1[1], p2[1], p3[1])]);
  }
  return out;
}

/** Детерминированный генератор случайных чисел (рендер стабилен от кадра к кадру). */
export function rng(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function orientation(pts: Pt[]): number {
  let s = 0;
  for (let i = 0; i < pts.length; i++) {
    const a = pts[i];
    const b = pts[(i + 1) % pts.length];
    s += a[0] * b[1] - b[0] * a[1];
  }
  return Math.sign(s) || 1;
}

/**
 * Клочковатый контур (шерсть): между опорными точками — пучки со скруглёнными кончиками.
 * amp — длина пучка, sweep — завал пучков вдоль контура.
 */
export function tuftPath(base: Pt[], count: number, amp: number, seed = 1, sweep = 0.35): string {
  const pts = sampleClosed(base, count);
  const r = rng(seed);
  const dir = orientation(base);
  const n = pts.length;
  let d = `M${f(pts[0][0])} ${f(pts[0][1])}`;
  for (let i = 0; i < n; i++) {
    const a = pts[i];
    const b = pts[(i + 1) % n];
    const tx = b[0] - a[0];
    const ty = b[1] - a[1];
    const len = Math.hypot(tx, ty) || 1;
    const ux = tx / len;
    const uy = ty / len;
    // внешняя нормаль
    const nx = uy * dir;
    const ny = -ux * dir;
    const k = amp * (0.65 + r() * 0.7);
    const mx = (a[0] + b[0]) / 2 + ux * len * sweep * 0.5;
    const my = (a[1] + b[1]) / 2 + uy * len * sweep * 0.5;
    const tip: Pt = [mx + nx * k, my + ny * k];
    const rr = len * 0.3;
    d +=
      ` C${f(a[0] + nx * k * 0.55)} ${f(a[1] + ny * k * 0.55)} ${f(tip[0] - ux * rr)} ${f(tip[1] - uy * rr)} ${f(tip[0])} ${f(tip[1])}` +
      ` C${f(tip[0] + ux * rr)} ${f(tip[1] + uy * rr)} ${f(b[0] + nx * k * 0.35)} ${f(b[1] + ny * k * 0.35)} ${f(b[0])} ${f(b[1])}`;
  }
  return d + 'Z';
}

/** Кудрявый контур-облако: выпуклые дуги между опорными точками. */
export function curlPath(base: Pt[], count: number, bulge = 0.55, seed = 3): string {
  const pts = sampleClosed(base, count);
  const r = rng(seed);
  const dir = orientation(base);
  const n = pts.length;
  let d = `M${f(pts[0][0])} ${f(pts[0][1])}`;
  for (let i = 0; i < n; i++) {
    const a = pts[i];
    const b = pts[(i + 1) % n];
    const tx = b[0] - a[0];
    const ty = b[1] - a[1];
    const len = Math.hypot(tx, ty) || 1;
    const nx = (ty / len) * dir;
    const ny = (-tx / len) * dir;
    const k = len * bulge * (0.8 + r() * 0.45);
    d += ` C${f(a[0] + nx * k)} ${f(a[1] + ny * k)} ${f(b[0] + nx * k)} ${f(b[1] + ny * k)} ${f(b[0])} ${f(b[1])}`;
  }
  return d + 'Z';
}

export const ellipsePts = (cx: number, cy: number, rx: number, ry: number, n = 12, rot = 0): Pt[] =>
  Array.from({ length: n }, (_, i) => {
    const a = (i / n) * Math.PI * 2 + rot;
    return [cx + Math.cos(a) * rx, cy + Math.sin(a) * ry] as Pt;
  });

/** React useId → безопасный id для url(#...). */
export const safeId = (id: string) => 'k' + id.replace(/[^a-zA-Z0-9_-]/g, '');

export const clamp = (v: number, a: number, b: number) => Math.max(a, Math.min(b, v));

/** Метаданные персонажа: пивоты, рост, рамка головы (для листов и камеры). */
export interface CharacterMeta {
  name: string;
  /** Рост в единицах (Кеша = 1000). */
  height: number;
  /** Ширина силуэта в нейтральной позе. */
  width: number;
  /** Центр головы в нейтральной позе и радиус кадрирования крупного плана. */
  headCenter: Pt;
  headRadius: number;
  joints: Record<string, Pt>;
}
