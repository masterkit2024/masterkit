// Shared environment detection for stills.mjs / render.sh: which Chrome and which WebGL backend to use.
import fs from "node:fs";
import { globSync } from "node:fs";
export const pickBrowser = () => {
  // headless shell first: a full Chrome (CHROME_PATH=/usr/bin/google-chrome in some clouds) aborts on long temp paths
  if (process.env.STYLE_BROWSER) return process.env.STYLE_BROWSER;
  let pw = [];
  try { pw = globSync("/opt/pw-browsers/chromium_headless_shell-*/chrome-headless-shell-linux64/chrome-headless-shell"); } catch { /* old node */ }
  if (pw.length) return pw.sort().at(-1);
  if (process.env.CHROME_PATH) return process.env.CHROME_PATH;
  const mac = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
  return fs.existsSync(mac) ? mac : undefined; // undefined: Remotion downloads its own headless shell
};
// angle = real GPU (Mac/Windows/Linux with a GPU); swangle = software SwiftShader (cloud, no GPU; ~15-20 s per 1080p frame)
export const pickGl = () => process.env.GL || (process.platform === "linux" && !fs.existsSync("/dev/dri") ? "swangle" : "angle");
if (process.argv[2] === "--print") console.log(`${pickGl()} ${pickBrowser() ?? ""}`);
