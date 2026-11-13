// usage: node render.js out_dir startFrame endFrame  |  node render.js --still out.png t1,t2,...
const { chromium } = require('playwright'); const fs = require('fs'); const path = require('path');
(async () => {
  const b = await chromium.launch({ args: ['--allow-file-access-from-files'] });
  const pg = await b.newPage({ viewport: { width: 540, height: 960 } });
  pg.on('console', m => console.log('[page]', m.text())); pg.on('pageerror', e => console.log('[err]', e.message));
  await pg.goto('file://' + path.resolve(__dirname, 'index.html'));
  await pg.evaluate(async () => { await document.fonts.load('900 50px Rubik'); await document.fonts.load('800 50px Rubik'); await document.fonts.load('400 50px "Russo One"'); await window.ready; });
  if (process.argv[2] === '--still') {
    const ts = process.argv[4].split(',').map(Number);
    const data = await pg.evaluate((ts) => window.sheet(ts), ts);
    fs.writeFileSync(process.argv[3], Buffer.from(data.split(',')[1], 'base64'));
  } else {
    const out = process.argv[2], a = +process.argv[3], z = +process.argv[4]; fs.mkdirSync(out, { recursive: true });
    for (let f = a; f < z; f++) {
      const data = await pg.evaluate((f) => { window.renderAt(f / 30); return document.getElementById('c').toDataURL('image/jpeg', .93); }, f);
      fs.writeFileSync(path.join(out, 'f' + String(f).padStart(5, '0') + '.jpg'), Buffer.from(data.split(',')[1], 'base64'));
    }
  }
  await b.close();
})();
