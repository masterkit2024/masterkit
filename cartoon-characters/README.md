# Персонажи мультсериала: риг на React + SVG

Четыре персонажа в едином стиле: **Кеша**, **Лёня**, **Сугроб**, **Баба Глыба** (две формы). Каждый персонаж — это React-компонент, который возвращает `<g>` и вставляется в любой `<svg>` (в том числе в Remotion). Формат кадра — 1080×1920.

## Состав

```
characters/
  palette.ts     все цвета + OUTLINE (толщина контура, 6 px) + тени (-15 %)
  rig.ts         типы, позы, эмоции, интерполяция поз, геометрия
  parts.tsx      общие детали: контур+тень, суставы, конечности, кисти, глаза, брови, рот
  Kesha.tsx  Lenya.tsx  Sugrob.tsx  BabaGlyba.tsx
  index.ts       все экспорты
remotion/        пример композиции (RigDemo) и тестовая сцена
preview/         генерация PNG-листов, автопроверка, тестовый ролик
previews/        готовые PNG и rig-test.mp4
```

## Использование

```tsx
import { Kesha, BabaGlyba } from './characters';

<svg viewBox="0 0 1080 1920">
  <Kesha x={300} y={1700} scale={0.8} facing="right" emotion="panic" mouth="wide" pose="panic" />
  <BabaGlyba x={760} y={1700} scale={0.7} rage mouth="o" />
</svg>
```

| Пропс | Значения |
|---|---|
| `x`, `y` | точка на полу под персонажем, px кадра |
| `scale` | масштаб (Кеша при 1 = 1000 px). Рабочий диапазон 0.35–2: контур всегда 6 px, при меньшем масштабе лицо становится тесным |
| `facing` | `'right'` / `'left'` (зеркало) |
| `emotion` | `neutral` `panic` `deadpan` `grin` `shock` `angry` `sleepy` — глаза и брови |
| `mouth` | `closed` `slight` `wide` `o` `smile` — под озвучку |
| `pose` | `idle` `wave` `panic` `shrug` `point` `chest` `fists` `think` `walkA` `walkB` или объект с углами |
| `rig` | углы поверх позы (для анимации покадрово) |
| `look` | `{x, y}` -1..1 — направление взгляда |
| `blink` | 0..1 — моргание |
| `shadow` | тень на полу (по умолчанию включена) |
| `rage`, `wind` | только Баба Глыба: форма «ГЛЫБА» (рост 160 %) и ветер для платка |

### Риг

Каждый сустав — это группа `<g data-part="…" data-pivot="x y">`, точка вращения стоит ровно в суставе. Иерархия: `body › legL/legR (бедро › голень › стопа)`, `torso (таз) › head (шея) › brows/eyes/mouth`, `torso › armL/armR (плечо › предплечье › кисть)`.

Углы в градусах:
- **руки:** `shoulder` > 0 — рука уходит в сторону/вверх (90 = горизонтально), `elbow` > 0 — предплечье к телу, < 0 — от тела (например, кулаки вверх), `hand` — поворот кисти, `form` — `open`/`fist`;
- **ноги:** `hip` > 0 — вперёд, `knee` > 0 — сгиб назад, `foot` > 0 — носок вверх;
- **корпус:** `lean` (наклон вокруг таза), `head`, `bodyX/bodyY`, `squash` (резиновое растяжение/сжатие).

L/R — левая и правая стороны экрана при `facing="right"`.

```tsx
import { lerpPose, resolvePose, KESHA_IDLE } from './characters';
const a = resolvePose('walkA', KESHA_IDLE);
const b = resolvePose('walkB', KESHA_IDLE);
<Kesha pose={lerpPose(a, b, t)} />
```

### Remotion

`remotion/Root.tsx` регистрирует композицию `RigDemo` (1080×1920, 30 fps, 4 с). Компоненты не используют таймеры и состояние, поэтому рендер детерминированный: одинаковые пропсы дают одинаковый кадр.

## Превью и проверка

```bash
npm install
npm run preview            # пересобрать все PNG в previews/
npm run video              # пересобрать previews/rig-test.mp4
node preview/check.cjs     # проверка: толщина контура, выход за кадр, пересечения, обрезка клеток
```

Листы (текста в кадре нет):
- `lineup.png` — все четверо в ряд, честный рост 100 / 70 / 130 / 125 % (пунктиры — уровни роста);
- `emotions-<персонаж>.png` — по 2 в ряд: neutral, panic / deadpan, grin / shock, angry / sleepy, справа внизу — персонаж целиком;
- `mouths.png` — столбцы: closed, slight, wide, o, smile; строки: Кеша, Лёня, Сугроб, Баба Глыба, ГЛЫБА;
- `baba-glyba-forms.png` — обычная форма и ярость (пунктиры — 125 % и 160 %);
- `poses.png` — проверка рига: idle, wave, panic, point, shrug, think, walkA, fists;
- `rig-test.mp4` — 4 с анимации на том же коде (без звука, это тест рига).
