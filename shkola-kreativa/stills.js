// node stills.js outdir f1 f2 ...   -> PNG stills
const { chromium } = require('playwright'); const fs = require('fs'); const path = require('path');
(async () => {
  const [out, ...frames] = process.argv.slice(2); fs.mkdirSync(out, { recursive: true });
  const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 1920, height: 1080 } });
  p.on('console', m => console.log('page:', m.text())); p.on('pageerror', e => console.log('ERR', e.message));
  await p.goto('file://' + path.resolve(__dirname, 'film.html'));
  for (const f of frames) {
    const d = await p.evaluate(f => grab(+f, 'image/png'), f);
    fs.writeFileSync(path.join(out, `f${String(f).padStart(3, '0')}.png`), Buffer.from(d.split(',')[1], 'base64'));
  }
  await b.close();
})();
