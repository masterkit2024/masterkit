// Измеряет рамку головы каждого персонажа (в единицах персонажа при scale=1).
const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');
(async () => {
  const svg = fs.readFileSync(path.join(__dirname, '.build', 'measure.svg'), 'utf8');
  const b = await chromium.launch();
  const p = await b.newPage({ viewport: { width: 2400, height: 2400 } });
  await p.setContent(`<html><body style="margin:0">${svg}</body></html>`);
  const res = await p.evaluate(() => {
    const out = {};
    document.querySelectorAll('g[id^="m-"]').forEach((g) => {
      const head = g.querySelector('[data-part="head"]');
      const r = head.getBoundingClientRect();
      // габариты всего персонажа по видимой геометрии (без defs и обрезанных клипом теней)
      let x0 = Infinity, y0 = Infinity, x1 = -Infinity;
      g.querySelectorAll('path,rect,ellipse,circle,line').forEach((e) => {
        if (e.closest('defs,pattern,clipPath,mask,[clip-path]')) return;
        const b = e.getBoundingClientRect();
        if (!b.width && !b.height) return;
        x0 = Math.min(x0, b.left); x1 = Math.max(x1, b.right); y0 = Math.min(y0, b.top);
      });
      out[g.id.slice(2)] = {
        cx: r.x + r.width / 2 - 1200, cy: r.y + r.height / 2 - 2200, w: r.width, h: r.height,
        left: 1200 - x0, right: x1 - 1200, top: 2200 - y0,
      };
    });
    return out;
  });
  fs.writeFileSync(path.join(__dirname, '.build', 'measure.json'), JSON.stringify(res, null, 1));
  console.log(res);
  await b.close();
})();
