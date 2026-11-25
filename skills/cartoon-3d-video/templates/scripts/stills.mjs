// Render test stills of any composition (bundles once).
// usage: node scripts/stills.mjs <CompositionId> <outPrefix> <frame,frame,...> [scale=0.5]
//   env ENTRY=src/sandboxes/<n>/index.tsx  render a sandbox entry instead of src/index.ts
//   env GL=angle|swangle|egl              default: angle with a GPU, swangle (software) without one (cloud)
//   env STYLE_BROWSER=<binary>            default: Playwright headless shell, else CHROME_PATH, else Mac Chrome, else Remotion's own
//   env REMOTION_TMP=<dir>                temp/bundle folder on a big drive
import fs from "node:fs";
import path from "node:path";
import { pickBrowser, pickGl } from "./env.mjs";
if (process.env.REMOTION_TMP) { fs.mkdirSync(process.env.REMOTION_TMP, { recursive: true }); process.env.TEMP = process.env.TMP = process.env.TMPDIR = process.env.REMOTION_TMP; }
const { bundle } = await import("@remotion/bundler");
const { renderStill, selectComposition } = await import("@remotion/renderer");
const [id, prefix, frames, scale = "0.5"] = process.argv.slice(2);
if (!id || !prefix || !frames) { console.error("usage: node scripts/stills.mjs <Comp> <outPrefix> <f1,f2,...> [scale]"); process.exit(1); }
const browserExecutable = pickBrowser(), chromiumOptions = { gl: pickGl() };
fs.mkdirSync(path.dirname(path.resolve(prefix)), { recursive: true });
const serveUrl = await bundle({ entryPoint: path.resolve(process.env.ENTRY || process.env.BRIDGE_ENTRY || "src/index.ts"), publicDir: path.resolve("public") });
const composition = await selectComposition({ serveUrl, id, browserExecutable, chromiumOptions });
// missing Kenney GLBs are expected (props.ts draws stand-ins): hide their 404s, show every other error
const onBrowserLog = (l) => { if ((l.type === "error" || l.type === "warning") && !/404|kenney/i.test(l.text)) console.log(`[${l.type}]`, l.text.slice(0, 300)); };
for (const f of frames.split(",").map(Number)) {
  const t0 = Date.now();
  await renderStill({ composition, serveUrl, frame: f, output: `${prefix}${f}.jpg`, imageFormat: "jpeg", jpegQuality: 88, scale: Number(scale),
    browserExecutable, chromiumOptions, timeoutInMilliseconds: 300000, onBrowserLog });
  console.log("still", f, ((Date.now() - t0) / 1000).toFixed(1) + "s");
}
