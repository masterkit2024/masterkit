// Рендерит SVG-листы из preview/.build в PNG через Chromium (Playwright).
const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');
(async () => {
  const dir = path.join(__dirname, '.build');
  const out = path.join(__dirname, '..', 'previews');
  fs.mkdirSync(out, { recursive: true });
  const only = process.argv.slice(2);
  const files = fs.readdirSync(dir).filter((f) => f.endsWith('.svg') && f !== 'measure.svg' && (!only.length || only.some((o) => f.includes(o))));
  const browser = await chromium.launch();
  for (const f of files) {
    const svg = fs.readFileSync(path.join(dir, f), 'utf8');
    const w = +svg.match(/width="(\d+)"/)[1];
    const h = +svg.match(/height="(\d+)"/)[1];
    const page = await browser.newPage({ viewport: { width: w, height: h }, deviceScaleFactor: 1 });
    await page.setContent(`<html><body style="margin:0">${svg}</body></html>`);
    await page.screenshot({ path: path.join(out, f.replace('.svg', '.png')), omitBackground: false });
    await page.close();
    console.log('png', f.replace('.svg', '.png'));
  }
  await browser.close();
})();
