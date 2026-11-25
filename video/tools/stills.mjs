import { bundle } from "@remotion/bundler";
import { renderStill, selectComposition } from "@remotion/renderer";
import path from "path";
const [outPrefix, times, scale = "0.5"] = process.argv.slice(2);
const serveUrl = await bundle({ entryPoint: path.resolve("src/index.ts") });
const opts = { serveUrl, id: process.env.COMP || "SlowedWorld", browserExecutable: "/opt/pw-browsers/chromium_headless_shell-1243/chrome-headless-shell-linux64/chrome-headless-shell", chromiumOptions: { gl: process.env.GL || "swangle" } };
const composition = await selectComposition(opts);
for (const ts of times.split(",")) {
  const frame = Math.round(parseFloat(ts) * 30);
  await renderStill({ ...opts, composition, frame, output: `${outPrefix}${ts}.png`, scale: parseFloat(scale) });
  console.log("ok", ts);
}
