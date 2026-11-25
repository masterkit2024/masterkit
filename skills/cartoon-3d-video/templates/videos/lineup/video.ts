// REFERENCE SHEET: every ready-made character (frame 0) and all 14 expressions (frame 30).
// Render: node scripts/stills.mjs Lineup out/lineup_ 0,30 0.5
import { VideoSpec } from "../../engine/stage";
import { hold } from "../../engine/camera";
import { person } from "../../engine/actors";
import { SCIENTIST, WORKER, MERCHANT, LADY, FARMER, GRANDPA, GIRL, KID, PARENT, GUARD, MODERN, OFFICER, soldier, Outfit, Expr, SKINS } from "../../engine/toon";

const CAST: Outfit[] = [SCIENTIST, WORKER, MERCHANT, LADY, FARMER, GRANDPA, GIRL, KID, PARENT, GUARD, MODERN, OFFICER, soldier(1)];
const EXPR: Expr[] = ["neutral", "stern", "grin", "laugh", "whistle", "nervous", "shock", "relief", "relief_open", "dazed", "pained", "smile", "smile_closed", "lick"];

export const SPEC: VideoSpec = {
  frames: 60,
  build: (s) => {
    s.ground(s.mat.cobble(), -30, 30, -20, 20, 0, 3);
    s.ground(s.mat.grass(), -400, 400, -400, -20, -0.01, 6);
    s.street(-30, 30, -24, 0, 0, 3);
    // a two-step wooden stand so three rows of characters are all visible in the tall frame
    s.box(s.mat.planks(), [-3.4, 0, -1.4], [3.4, 1.0, 0.1]);
    s.box(s.mat.planks(), [-3.4, 0, -3.0], [3.4, 2.0, -1.4]);
  },
  shots: [
    {
      a: 0, b: 30, light: "day", dof: { cInf: 0 },
      cams: [{ f: 0, s: hold([0, 3.2, 13], [0, 2.4, -0.6], 0, { fov: 44, rate: 0 }) }],
      cast: (t, _f, cam, out) => CAST.forEach((o, i) => {
        const row = i < 5 ? 0 : i < 9 ? 1 : 2, k = row === 0 ? i : row === 1 ? i - 5 : i - 9, n = row === 0 ? 5 : 4;
        person(cam, t, out, { id: 40 + i, outfit: { ...o, skin: o.skin ?? SKINS[i % 4] }, at: [(k - (n - 1) / 2) * 1.15, row, [0.9, -0.6, -2.2][row]], expr: "smile" });
      }),
    },
    {
      a: 30, b: 60, light: "day", dof: { cInf: 0 },
      cams: [{ f: 30, s: hold([0, 3.4, 8.4], [0, 2.9, -0.6], 30, { fov: 44, rate: 0 }) }],
      cast: (t, _f, cam, out) => EXPR.forEach((e, i) => {
        const row = i < 5 ? 2 : i < 10 ? 1 : 0, k = i % 5, n = row === 0 ? 4 : 5;
        person(cam, t, out, { id: 3, outfit: { ...SCIENTIST, skin: SKINS[0] }, at: [(k - (n - 1) / 2) * 0.8, row, [0.9, -0.6, -2.2][row]], expr: e });
      }),
    },
  ],
};
