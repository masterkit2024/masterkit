/**
 * Генератор превью-листов. Без текста в кадре: порядок клеток описан в README.
 *   lineup.png               — все четверо в ряд, честные пропорции роста (1080×1920)
 *   emotions-<name>.png      — 7 эмоций крупно + персонаж целиком (1080×1920)
 *   mouths.png               — 5 форм рта × (4 персонажа + ГЛЫБА) (1500×1500)
 *   baba-glyba-forms.png     — обычная форма и ярость (1080×1920)
 *   poses.png                — проверка рига: 8 поз × 4 персонажа (3760×2240)
 */
import React, { ReactNode } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import fs from 'fs';
import path from 'path';
import {
  BabaGlyba,
  BABA_GLYBA_META,
  BABA_GLYBA_RAGE_META,
  CharacterMeta,
  CharacterProps,
  EMOTIONS,
  EMOTION_MOUTH,
  Kesha,
  KESHA_META,
  Lenya,
  LENYA_META,
  MOUTHS,
  palette,
  PoseName,
  Sugrob,
  SUGROB_META,
} from '../characters';

type Comp = (p: CharacterProps) => React.JSX.Element;
interface Entry {
  key: string;
  C: Comp;
  meta: CharacterMeta;
  extra?: Record<string, unknown>;
}
const GlybaRage: Comp = (p) => <BabaGlyba {...p} rage />;
const CAST: Entry[] = [
  { key: 'kesha', C: Kesha, meta: KESHA_META },
  { key: 'lenya', C: Lenya, meta: LENYA_META },
  { key: 'sugrob', C: Sugrob, meta: SUGROB_META },
  { key: 'baba-glyba', C: BabaGlyba, meta: BABA_GLYBA_META },
];
const RAGE: Entry = { key: 'glyba-rage', C: GlybaRage, meta: BABA_GLYBA_RAGE_META };

const outDir = __dirname;
function save(name: string, w: number, h: number, body: ReactNode) {
  const svg = renderToStaticMarkup(
    <svg xmlns="http://www.w3.org/2000/svg" width={w} height={h} viewBox={`0 0 ${w} ${h}`}>
      {body}
    </svg>,
  );
  fs.writeFileSync(path.join(outDir, name + '.svg'), svg);
  console.log('svg', name);
}

/**
 * Рамки голов измеряются в браузере (preview/measure.cjs → .build/measure.json):
 * так кадрирование учитывает наклон корпуса, шапки, очки и т. п.
 */
const MEASURE_PATH = path.join(outDir, 'measure.json');
const measured: Record<string, { cx: number; cy: number; w: number; h: number; left: number; right: number; top: number }> = fs.existsSync(MEASURE_PATH)
  ? JSON.parse(fs.readFileSync(MEASURE_PATH, 'utf8'))
  : {};
const ALL = () => [...CAST, RAGE];

if (process.argv[2] === 'measure') {
  save(
    'measure',
    2400,
    2400,
    <>
      {ALL().map((e) => (
        <g id={'m-' + e.key} key={e.key}>
          <e.C x={1200} y={2200} scale={1} />
        </g>
      ))}
    </>,
  );
  process.exit(0);
}

/** Клетка с крупным планом головы. */
function HeadCell({ e, x, y, w, h, props, zoom = 1 }: { e: Entry; x: number; y: number; w: number; h: number; props: CharacterProps; zoom?: number }) {
  const m = measured[e.key];
  const r = m ? Math.max(m.w, m.h) / 2 : e.meta.headRadius;
  const s = ((Math.min(w, h) * 0.46) / r) * zoom;
  const [hx, hy] = m ? [m.cx, m.cy] : e.meta.headCenter;
  return (
    <g>
      <rect x={x + 8} y={y + 8} width={w - 16} height={h - 16} rx={28} fill={palette.bgCell} />
      <svg x={x + 8} y={y + 8} width={w - 16} height={h - 16} overflow="hidden">
        <e.C {...props} x={(w - 16) / 2 - hx * s} y={(h - 16) / 2 - hy * s} scale={s} shadow={false} />
      </svg>
    </g>
  );
}

/** Клетка с персонажем целиком. */
function BodyCell({ e, x, y, w, h, props, fit = 0.82, dx = 0 }: { e: Entry; x: number; y: number; w: number; h: number; props: CharacterProps; fit?: number; dx?: number }) {
  const s = Math.min(((h - 16) * fit) / e.meta.height, ((w - 16) * 0.9) / e.meta.width);
  return (
    <g>
      <rect x={x + 8} y={y + 8} width={w - 16} height={h - 16} rx={28} fill={palette.bgCell} />
      <svg x={x + 8} y={y + 8} width={w - 16} height={h - 16} overflow="hidden">
        <e.C {...props} x={(w - 16) / 2 + dx * w} y={(h - 16) * 0.9} scale={s} />
      </svg>
    </g>
  );
}

const Floor = ({ w, h, y }: { w: number; h: number; y: number }) => (
  <>
    <rect width={w} height={h} fill={palette.bg} />
    <rect y={y} width={w} height={h - y} fill={palette.bgFloor} />
  </>
);

/** Раскладка в ряд по измеренным габаритам: общий масштаб, равные зазоры, центр по кадру. */
function rowLayout(entries: Entry[], W: number, H: number, margin: number, gap: number, maxH: number) {
  const ext = entries.map((e) => measured[e.key] ?? { left: e.meta.width / 2, right: e.meta.width / 2, top: e.meta.height });
  const sumW = ext.reduce((a, m) => a + m.left + m.right, 0);
  const maxTop = Math.max(...ext.map((m) => m.top));
  const s = Math.min((W - 2 * margin - gap * (entries.length - 1)) / sumW, maxH / maxTop);
  const total = sumW * s + gap * (entries.length - 1);
  let x = (W - total) / 2;
  const xs = ext.map((m) => {
    const cx = x + m.left * s;
    x += (m.left + m.right) * s + gap;
    return cx;
  });
  // по вертикали — центр группы в кадре
  const floorY = Math.round(H / 2 + (maxTop * s) / 2);
  return { s, xs, floorY };
}

/* 1. Линейка роста */
{
  const W = 1080;
  const H = 1920;
  const { s, xs, floorY } = rowLayout(CAST, W, H, 24, 18, 1300);
  console.log('lineup scale', s.toFixed(3));
  save(
    'lineup',
    W,
    H,
    <>
      <Floor w={W} h={H} y={floorY} />
      {[1000, 700, 1300, 1250].map((hgt, i) => (
        <line key={i} x1={24} x2={W - 24} y1={floorY - hgt * s} y2={floorY - hgt * s} stroke={palette.ink} strokeOpacity={0.12} strokeWidth={3} strokeDasharray="4 14" strokeLinecap="round" />
      ))}
      {CAST.map((e, i) => (
        <e.C key={e.key} x={xs[i]} y={floorY} scale={s} />
      ))}
    </>,
  );
}

/* 2. Листы эмоций */
for (const e of CAST) {
  const W = 1080;
  const H = 1920;
  const cw = 540;
  const ch = 480;
  save(
    `emotions-${e.key}`,
    W,
    H,
    <>
      <rect width={W} height={H} fill={palette.bg} />
      {EMOTIONS.map((em, i) => (
        <HeadCell key={em} e={e} x={(i % 2) * cw} y={Math.floor(i / 2) * ch} w={cw} h={ch} props={{ emotion: em, mouth: EMOTION_MOUTH[em] }} />
      ))}
      <BodyCell e={e} x={cw} y={3 * ch} w={cw} h={ch} props={{}} />
    </>,
  );
}

/* 3. Формы рта */
{
  const rows = [...CAST, RAGE];
  const c = 300;
  save(
    'mouths',
    c * 5,
    c * rows.length,
    <>
      <rect width={c * 5} height={c * rows.length} fill={palette.bg} />
      {rows.map((e, r) =>
        MOUTHS.map((m, i) => <HeadCell key={e.key + m} e={e} x={i * c} y={r * c} w={c} h={c} props={{ mouth: m, emotion: 'neutral' }} zoom={1.15} />),
      )}
    </>,
  );
}

/* 4. Баба Глыба: обычная и ярость */
{
  const W = 1080;
  const H = 1920;
  const pair = [CAST[3], RAGE];
  const { s, xs, floorY } = rowLayout(pair, W, H, 30, 30, 1700);
  console.log('forms scale', s.toFixed(3));
  save(
    'baba-glyba-forms',
    W,
    H,
    <>
      <Floor w={W} h={H} y={floorY} />
      <line x1={24} x2={W - 24} y1={floorY - 1250 * s} y2={floorY - 1250 * s} stroke={palette.ink} strokeOpacity={0.12} strokeWidth={3} strokeDasharray="4 14" strokeLinecap="round" />
      <line x1={24} x2={W - 24} y1={floorY - 1600 * s} y2={floorY - 1600 * s} stroke={palette.ink} strokeOpacity={0.12} strokeWidth={3} strokeDasharray="4 14" strokeLinecap="round" />
      <BabaGlyba x={xs[0]} y={floorY} scale={s} />
      <BabaGlyba x={xs[1]} y={floorY} scale={s} rage mouth="wide" />
    </>,
  );
}

/* 5. Позы — проверка рига */
{
  const poses: PoseName[] = ['idle', 'wave', 'panic', 'point', 'shrug', 'think', 'walkA', 'fists'];
  const cw = 470;
  const ch = 560;
  const rows = CAST;
  save(
    'poses',
    cw * poses.length,
    ch * rows.length,
    <>
      <rect width={cw * poses.length} height={ch * rows.length} fill={palette.bg} />
      {rows.map((e, r) =>
        poses.map((po, i) => (
          <BodyCell key={e.key + po} e={e} x={i * cw} y={r * ch} w={cw} h={ch} props={{ pose: po, emotion: po === 'panic' ? 'panic' : po === 'fists' ? 'angry' : 'neutral', mouth: po === 'panic' ? 'wide' : 'closed' }} fit={0.66} dx={po === 'point' || po === 'wave' ? -0.1 : 0} />
        )),
      )}
    </>,
  );
}
