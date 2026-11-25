import words from "./words.json";
export type Wd = { w: string; s: number; e: number };
export const WORDS = words as Wd[];
/** start time of word #i */
const S = (i: number) => WORDS[i].s;
const E = (i: number) => WORDS[i].e;

export const T = {
  s1: 0, press1: S(1), tired1: S(10) - 0.05,
  s2: 6.62, stamp2: S(19) - 0.05,
  s3: 8.72, slow3: S(31), deaf3: S(41),
  s4: 18.45, walk4: S(45), fast4: S(52), plane4: S(57) - 0.1, wall4: S(60), clothes4: S(62), stamp4: S(64) + 0.2,
  s5: 28.27, drop5: S(77), bars5: S(85) - 0.1, digits5: S(88), memIn5: S(96), mem5: S(98),
  s6: 45.95, crack6: S(102), color6: S(102) + 0.45, tog6a: S(105), tog6b: S(107), tog6c: S(110), press6: S(115), freeze6: S(118),
  s7: 54.9, q7: S(123), passport7: S(125), dyad7: S(133), fart7: S(138) + 0.1, glacier7: S(139), run7: S(147), beep7: S(152), leave7: S(154), cashier7: S(155),
  s8: 73.0, drop8: S(162), dash8: S(166), eat8: S(169), text8: S(170), close8: S(173) + 0.25,
  s9: 80.3, sign9: S(183), approach9: S(186), gap9: S(190), wait9: S(195), wait9b: S(199), reveal9: S(203), rustam9: S(204), meme9: E(204) + 0.05, flip9: S(205), wave9: S(207), more9: S(211),
  s10: 108.3, snap10a: S(215), snap10b: S(218), snap10c: S(225), s10b: 115.6, draw10: S(229), grid10: S(231),
  s11: 119.9, world11: S(242), you11: S(246), scream11: S(250), back11: 129.05, palm11: S(253) + 0.3, tea11: E(264), freeze11: E(264) + 0.5,
  end: 137.5,
};
export const DUR = T.end;
