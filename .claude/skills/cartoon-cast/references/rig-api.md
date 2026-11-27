# API рига

## Файлы
| Файл | Что внутри |
|---|---|
| `characters/palette.ts` | все цвета, `OUTLINE` (6), `SHADE` (0.15), `darken()` |
| `characters/rig.ts` | типы, `POSES`, `resolvePose`, `lerpPose`, `EMOTION_TABLE`, `EMOTION_MOUTH`, геометрия (`smoothClosed`, `tuftPath`, `curlPath`…), `RigContext` |
| `characters/parts.tsx` | `CharacterRoot`, `InnerScale`, `Pivot`, `Joint`, `Shape`, `Line`, `Tube`, `Limb`, `FurSegment`, `Hand`, `Eye`, `Brow`, `Mouth`, `GroundShadow` |
| `characters/<Имя>.tsx` | персонаж + `<ИМЯ>_META` (рост, пивоты, рамка головы) + `<ИМЯ>_IDLE` (поза по умолчанию) |

## Пропсы (общие для всех)
| Пропс | Тип / значения |
|---|---|
| `x`, `y` | точка на полу, px кадра |
| `scale` | 1 → Кеша 1000 px |
| `facing` | `'right'` \| `'left'` |
| `emotion` | `neutral` `panic` `deadpan` `grin` `shock` `angry` `sleepy` |
| `mouth` | `closed` `slight` `wide` `o` `smile` |
| `pose` | имя позы или объект `PoseInput` (частичный) |
| `rig` | `PoseInput` поверх позы — для покадровой анимации |
| `look` | `{ x?: -1..1, y?: -1..1 }` |
| `blink` | 0..1 |
| `shadow` | `boolean`, по умолчанию `true` |
| `rage`, `wind` | только `BabaGlyba` |

Компонент возвращает `<g>`: его можно класть в любой `<svg>` и рисовать несколько персонажей в одном кадре. Рендер детерминированный (нет состояния и таймеров), поэтому безопасен для Remotion.

## Поза
```ts
interface Pose {
  bodyX, bodyY: number;  // смещение всего тела (прыжок: bodyY < 0)
  lean: number;          // наклон корпуса вокруг таза, > 0 — вперёд
  squash: number;        // 1 — норма; >1 вытянуть, <1 сплющить (объём сохраняется)
  head: number;          // наклон головы вокруг шеи, > 0 — вперёд/вниз
  armL, armR: { shoulder, elbow, hand, form: 'open' | 'fist' };
  legL, legR: { hip, knee, foot };
}
```
- **Руки:** `shoulder` 0 — висит, 90 — горизонтально в сторону, 150+ — вверх. `elbow` > 0 сгибает предплечье к телу/вниз, `elbow` < 0 — от тела. Итоговый угол предплечья = `shoulder − elbow`: кулак вверх при плече 80 — это `elbow ≈ −95`.
- **Ноги:** `hip` > 0 — вперёд (в сторону взгляда), `knee` > 0 — голень назад, `foot` > 0 — носок вверх. Чтобы стопа стояла ровно при разведённых ногах: `foot = knee − hip`.
- **L/R** — стороны экрана при `facing="right"` (не анатомические).
- Сборка позы: `BASE_POSE` → idle персонажа → `pose` → `rig`. Поэтому `pose="wave"` меняет только правую руку и сохраняет сутулость персонажа.

Готовые позы: `idle`, `wave`, `panic`, `shrug`, `point`, `chest`, `fists`, `think`, `walkA`, `walkB`.

## Анимация в Remotion
```tsx
const f = useCurrentFrame();
const a = resolvePose('walkA', KESHA_IDLE), b = resolvePose('walkB', KESHA_IDLE);
const t = (Math.sin(f / 6) + 1) / 2;
<Kesha pose={lerpPose(a, b, t)} rig={{ bodyY: -Math.abs(Math.sin(f / 6)) * 12 }} mouth={talk(f)} blink={blink(f)} />
```
Приёмы (все есть в `remotion/scene.tsx`): дыхание через `squash 1 ± 0.015`, «пружина» через `exp(−t/6)·cos(t/2.2)` на `squash`/`bodyY`, тряска паники через быстрые синусы на `shoulder`/`elbow`, взгляд через `look`.

## Как расширять
- **Новая поза:** добавь имя в `POSE_NAMES` и объект в `POSES` (`rig.ts`). Если поза нужна только одному персонажу — положи её в его `<ИМЯ>_POSES`.
- **Новая эмоция:** добавь имя в `EMOTIONS`, параметры в `EMOTION_TABLE` (open, pupil, lidTop, lidTilt, lidBottom, lookY, browRaise, browTilt, browCurve, mood) и рот в `EMOTION_MOUTH`. Особые глаза: щёлки Сугроба (`SlitEye`), вечные тяжёлые веки Лёни, глаза ярости Глыбы (`RageEye`) — проверь эмоцию на каждом.
- **Новая деталь/аксессуар:** рисуй внутри нужной группы (голова — внутри `Pivot part="head"`, предмет в руке — в `end` у `Limb`) через `Shape` с `tone` из палитры и `rim` для тени. Цвет — новым ключом в `palette.ts`.
- **Новый персонаж:** скопируй ближайшего по телосложению, задай `META`, `IDLE`, формы. Каркас (`CharacterRoot` → `body` → ноги → `Pivot torso` → голова → руки) не меняй — на нём держатся анимации и проверки. Добавь его в `CAST` в `preview/render.tsx`.
- После любой правки: `npm run preview && node preview/check.cjs`, затем посмотри PNG.

## Подводные камни
- Не применяй внешний `transform: scale()` к персонажу — контур перестанет быть 6 px. Используй `scale` пропсом (внутри части — `InnerScale`, он поправляет толщину).
- `getBoundingClientRect` у SVG учитывает узоры и тени под клипом. Для измерений используй подход из `preview/check.cjs` и `measure.cjs` (только видимая геометрия).
- Тени узорчатых тканей сделаны наложением чёрного 15 % через `mask` (`overlay` в `Shape`), а не `tone.shade`.
- id для `clipPath`/`mask`/`pattern` берутся из `useId` — несколько копий одного персонажа в кадре не конфликтуют.
