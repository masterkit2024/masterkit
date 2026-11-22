// usage: node preview.mjs out_dir t1 t2 ...  (renders single frames at given seconds)
const { chromium } = require('playwright');
const fs = require('fs');
(async () => {
const [out, ...ts] = process.argv.slice(2);
fs.mkdirSync(out, {recursive: true});
const b = await chromium.launch({args: ['--disable-web-security']});
const p = await b.newPage({viewport: {width: 1920, height: 1080}});
p.on('console', m => console.log('console:', m.text())); p.on('pageerror', e => console.log('ERR', e.message));
await p.goto('http://127.0.0.1:8765/index.html'); await p.evaluate(() => window.ready);
for (const t of ts) {
  const t0 = Date.now(); const n = await p.evaluate(i => window.renderFrame(i), Math.round(parseFloat(t)*60));
  const d = await p.evaluate(() => document.getElementById('c').toDataURL('image/jpeg', .9));
  fs.writeFileSync(`${out}/f_${String(t).padStart(6,'0')}.jpg`, Buffer.from(d.split(',')[1], 'base64'));
  console.log(t, 'samples', n, Date.now() - t0, 'ms');
}
await b.close();
})();
