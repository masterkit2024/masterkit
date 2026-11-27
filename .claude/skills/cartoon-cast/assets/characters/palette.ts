/**
 * Единая палитра мультсериала.
 * Все цвета персонажей живут только здесь. Тень каждой заливки — тот же тон,
 * затемнённый на SHADE (15 %). Градиентов и бликов нет.
 */

/** Толщина контура в пикселях кадра (не зависит от scale персонажа). */
export const OUTLINE = 6;

/** Насколько тень темнее основной заливки. */
export const SHADE = 0.15;

/** Затемнение HEX-цвета: каждый канал умножается на (1 - amount). */
export function darken(hex: string, amount: number = SHADE): string {
  const n = hex.replace('#', '');
  const ch = [0, 2, 4].map((i) => parseInt(n.slice(i, i + 2), 16));
  return (
    '#' +
    ch
      .map((v) => Math.round(v * (1 - amount)))
      .map((v) => Math.max(0, Math.min(255, v)).toString(16).padStart(2, '0'))
      .join('')
  );
}

export interface Tone {
  base: string;
  shade: string;
}

/** Заливка + её тень (-15 %). */
const tone = (base: string, shade?: string): Tone => ({ base, shade: shade ?? darken(base) });

export const palette = {
  /** Единый тёмный контур. */
  ink: '#2b2030',
  /** Мягкая тень на полу (плоская, полупрозрачная). */
  floorShadow: '#2b2030',
  floorShadowOpacity: 0.16,
  /** Затемнение для узорчатых тканей (эквивалент -15 %). */
  shadeOverlay: '#000000',
  shadeOverlayOpacity: SHADE,

  /** Общие детали лица. */
  eyeWhite: tone('#fbf8f1'),
  pupil: '#2b2030',
  mouth: tone('#5c1e2c'),
  tongue: tone('#e8707a'),
  teeth: tone('#fffdf6'),

  /** Фоны превью. */
  bg: '#e7e2d8',
  bgFloor: '#d9d3c7',
  bgCell: '#efebe3',

  kesha: {
    skin: tone('#f4c9a6'),
    hair: tone('#4b2b1e'),
    brow: '#3a2017',
    hoodie: tone('#8fd8b5'),
    hoodieRib: tone('#7cc7a3'),
    string: tone('#f6f3ea'),
    jeans: tone('#8d939b'),
    sneaker: tone('#e3433b'),
    sole: tone('#f4f0e8'),
    lace: '#f6f3ea',
  },

  lenya: {
    fur: tone('#8b7b6b'),
    furDark: tone('#6e5f52'),
    belly: tone('#b3a492'),
    muzzle: tone('#eadbc3'),
    mask: tone('#4a3a31'),
    nose: tone('#3a2b25'),
    brow: '#3a2b25',
    robe: tone('#7e2533'),
    robeTrim: tone('#5f1b27'),
    patch: tone('#a8566a'),
    strap: tone('#5a4334'),
    gogFrame: tone('#c9a85a'),
    lens: tone('#86c7c8'),
    claw: tone('#efe4cb'),
  },

  sugrob: {
    /** Белая шерсть с голубоватой тенью (тень тоже ~-15 % по яркости). */
    fur: tone('#f7f9fc', '#cddff0'),
    face: tone('#a9bdd4'),
    blue: tone('#6ea4da'),
    nose: tone('#4e6f95'),
    brow: '#8fa9c6',
    hat: tone('#ef7a3f'),
    hatRib: tone('#d9662e'),
    pompom: tone('#fbe9b8'),
  },

  glyba: {
    skin: tone('#f1c19f'),
    skinRage: tone('#f29c84'),
    blush: '#ec8686',
    brow: '#8b7a72',
    hairGrey: tone('#d8d4d2'),
    scarf: tone('#d8433d'),
    scarfFlower: '#fff2d6',
    scarfFlowerCore: '#f6c13c',
    robe: tone('#3e7fc1'),
    robeFlowerA: '#f39ac0',
    robeFlowerB: '#ffe17a',
    robeFlowerLeaf: '#7cc47f',
    apron: tone('#f6e7b8'),
    apronTrim: tone('#e06a55'),
    stocking: tone('#c99877'),
    slipper: tone('#cf7fb9'),
    slipperFluff: tone('#fbe7f2'),
    glassFrame: '#2b2030',
    lens: '#dff3f7',
    lensOpacity: 0.16,
    rageEye: '#ff3d2e',
    rageGlow: '#ff9a52',
    vein: '#9b2350',
  },
} as const;

export type Palette = typeof palette;
