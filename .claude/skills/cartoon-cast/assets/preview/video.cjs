// SVG-кадры → PNG (Chromium) → MP4 (ffmpeg, H.264, yuv420p). Без звука: это тест рига.
const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
(async () => {
  const dir = path.join(__dirname, '.build', 'frames');
  const files = fs.readdirSync(dir).filter((f) => f.endsWith('.svg')).sort();
  const b = await chromium.launch();
  const p = await b.newPage({ viewport: { width: 1080, height: 1920 } });
  for (const f of files) {
    await p.setContent(`<html><body style="margin:0">${fs.readFileSync(path.join(dir, f), 'utf8')}</body></html>`);
    await p.screenshot({ path: path.join(dir, f.replace('.svg', '.png')) });
  }
  await b.close();
  const out = path.join(__dirname, '..', 'previews', 'rig-test.mp4');
  execSync(`ffmpeg -y -loglevel error -framerate 30 -i ${dir}/f%04d.png -c:v libx264 -pix_fmt yuv420p -crf 18 -movflags +faststart ${out}`);
  console.log('mp4', out);
})();
