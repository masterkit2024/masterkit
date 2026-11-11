const { chromium } = require('playwright'); const fs = require('fs');
(async () => { const b = await chromium.launch(); const p = await b.newPage(); p.on('pageerror', e => console.log('ERR', e.message));
 await p.goto('http://127.0.0.1:8765/thumb.html'); await p.waitForFunction('window.READY===true', null, { timeout: 300000 });
 for (const k of ['A', 'B', 'C']) { const d = await p.evaluate(k => RT(k), k); fs.writeFileSync(`thumb_${k}_full.png`, Buffer.from(d.split(',')[1], 'base64')); }
 await b.close(); })();
