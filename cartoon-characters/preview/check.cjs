// Автопроверка листов: выход за кадр, пересечения персонажей, толщина контура в пикселях.
const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');
(async () => {
  const dir = path.join(__dirname, '.build');
  const b = await chromium.launch();
  let ok = true;
  for (const f of fs.readdirSync(dir).filter((x) => x.endsWith('.svg') && x !== 'measure.svg')) {
    const svg = fs.readFileSync(path.join(dir, f), 'utf8');
    const w = +svg.match(/width="(\d+)"/)[1];
    const h = +svg.match(/height="(\d+)"/)[1];
    const p = await b.newPage({ viewport: { width: w, height: h } });
    await p.setContent(`<html><body style="margin:0">${svg}</body></html>`);
    const r = await p.evaluate(() => {
      // рамка по видимой геометрии (без defs/pattern/clipPath/mask)
      const visBox = (g) => {
        let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
        g.querySelectorAll('path,rect,ellipse,circle,line').forEach((e) => {
          if (e.closest('defs,pattern,clipPath,mask,[clip-path]')) return;
          if (e.getAttribute('fill') === 'none' && !e.getAttribute('stroke')) return;
          const r = e.getBoundingClientRect();
          if (!r.width && !r.height) return;
          x0 = Math.min(x0, r.left); y0 = Math.min(y0, r.top); x1 = Math.max(x1, r.right); y1 = Math.max(y1, r.bottom);
        });
        return { x0, y0, x1, y1 };
      };
      const all = [...document.querySelectorAll('[data-character]')].map((g) => {
        const nested = g.ownerSVGElement && g.ownerSVGElement.ownerSVGElement ? g.ownerSVGElement : null;
        const A = (n) => parseFloat(nested.getAttribute(n));
        const cell = nested ? { left: A('x'), top: A('y'), right: A('x') + A('width'), bottom: A('y') + A('height') } : null;
        return { name: g.dataset.character, ...visBox(g), cell: cell && { x0: cell.left, y0: cell.top, x1: cell.right, y1: cell.bottom }, head: !!(g.ownerSVGElement && g.ownerSVGElement.ownerSVGElement && !g.querySelector('[data-part=shadow]')) };
      });
      const widths = {};
      document.querySelectorAll('[data-outline]').forEach((el) => {
        const m = el.getScreenCTM();
        const k = Math.sqrt(Math.abs(m.a * m.d - m.b * m.c));
        const sw = parseFloat(el.getAttribute('stroke-width')) * k;
        const key = sw.toFixed(2);
        widths[key] = (widths[key] || 0) + 1;
      });
      return { all, widths };
    });
    // клетки крупного плана (голова) намеренно обрезаны снизу — проверяем только верх и бока головы
    r.top = r.all.filter((c) => !c.cell);
    const issues = [];
    for (const c of r.top) {
      if (c.x0 < 0 || c.y0 < 0 || c.x1 > w || c.y1 > h) issues.push(`${c.name} выходит за кадр ${JSON.stringify(c)}`);
    }
    for (const c of r.all.filter((c) => c.cell && !c.head)) {
      const k = c.cell;
      if (c.x0 < k.x0 || c.y0 < k.y0 || c.x1 > k.x1 || c.y1 > k.y1) issues.push(`${c.name} обрезан клеткой (запас слева/сверху/справа/снизу, px): ${[c.x0 - k.x0, c.y0 - k.y0, k.x1 - c.x1, k.y1 - c.y1].map((v) => v.toFixed(1)).join(" / ")}`);
    }
    for (let i = 0; i < r.top.length; i++)
      for (let j = i + 1; j < r.top.length; j++) {
        const a = r.top[i], c = r.top[j];
        const ov = Math.min(a.x1, c.x1) - Math.max(a.x0, c.x0);
        if (ov > 0 && Math.min(a.y1, c.y1) > Math.max(a.y0, c.y0)) issues.push(`${a.name} и ${c.name} пересекаются на ${ov.toFixed(0)}px`);
      }
    if (issues.length) ok = false;
    console.log(f.padEnd(26), 'контур px:', JSON.stringify(r.widths), issues.length ? '\n   ⚠ ' + issues.join('\n   ⚠ ') : '✓');
    await p.close();
  }
  await b.close();
  process.exit(ok ? 0 : 1);
})();
