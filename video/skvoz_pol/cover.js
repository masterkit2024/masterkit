const { chromium } = require('playwright'); const fs = require('fs'); const path = require('path');
(async () => { const b = await chromium.launch({ args: ['--allow-file-access-from-files'] }); const pg = await b.newPage();
  pg.on('pageerror', e => console.log('[err]', e.message));
  await pg.goto('file://' + path.resolve(__dirname, 'cover.html'));
  await pg.evaluate(async () => { await document.fonts.load('900 50px Rubik'); await window.ready; });
  const d = await pg.evaluate(() => { window.renderAt(); return document.getElementById('c').toDataURL('image/png'); });
  fs.writeFileSync(process.argv[2], Buffer.from(d.split(',')[1], 'base64')); await b.close(); })();
