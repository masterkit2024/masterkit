// usage: node run.js stills <dir> t1 t2 ... | node run.js video <out.mp4> f0 f1 | node run.js events <out.json> | node run.js sheet <dir> step
const K = require('./core'); const Pp = require('./paper'); const R = require('./engine');
const fs = require('fs'); const { spawn } = require('child_process');
const SCENES = ['s01', 's2', 's3', 's4', 's5', 's6', 's7', 's8'];
(async () => {
  await Pp.loadPhotos();
  for (const s of SCENES) { if (fs.existsSync(__dirname + '/' + s + '.js')) require('./' + s).build(); }
  R.finalize();
  const [mode, out, ...rest] = process.argv.slice(2);
  if (mode === 'events') { fs.writeFileSync(out, JSON.stringify({ events: K.EVENTS, shots: R.SHOTS.map(s => ({ t0: s.t0, tr: s.tr, mood: s.mood })), dur: K.TL.dur })); console.log('shots', R.SHOTS.length, 'events', K.EVENTS.length); return; }
  if (mode === 'stills' || mode === 'sheet') {
    fs.mkdirSync(out, { recursive: true }); let ts = rest.map(Number);
    if (mode === 'sheet') { const [a, b, st] = ts; ts = []; for (let t = a; t < b; t += st) ts.push(+t.toFixed(2)); }
    const c = K.mk(K.W, K.H), x = c.getContext('2d'); const nsub = +(process.env.NSUB || 1);
    for (const t of ts) {
      const f = Math.round(t * K.FPS); const t0 = Date.now(); const buf = R.renderFrame(f, nsub);
      const id = x.createImageData(K.W, K.H); id.data.set(buf); x.putImageData(id, 0, 0);
      fs.writeFileSync(`${out}/t${t.toFixed(2).padStart(7, '0')}.jpg`, await c.encode('jpeg', 88)); if (process.env.V) console.log(t, Date.now() - t0, 'ms');
    }
    return;
  }
  if (mode === 'video') {
    const f0 = +rest[0], f1 = +rest[1];
    const ff = spawn('ffmpeg', ['-v', 'error', '-y', '-f', 'rawvideo', '-pix_fmt', 'rgba', '-s', `${K.W}x${K.H}`, '-r', '30', '-i', '-', '-c:v', 'libx264', '-preset', process.env.PRESET || 'medium', '-crf', process.env.CRF || '15', '-pix_fmt', 'yuv420p',
      '-color_primaries', 'bt709', '-color_trc', 'bt709', '-colorspace', 'bt709', '-r', '30', out], { stdio: ['pipe', 'inherit', 'inherit'] });
    const t0 = Date.now();
    for (let f = f0; f < f1; f++) {
      const buf = R.renderFrame(f);
      if (!ff.stdin.write(Buffer.from(buf))) await new Promise(r => ff.stdin.once('drain', r));
      if ((f - f0) % 150 === 0) console.log(out, f, '/', f1, ((Date.now() - t0) / Math.max(1, f - f0)).toFixed(0), 'ms/f');
    }
    ff.stdin.end(); await new Promise(r => ff.on('close', r)); console.log('done', out);
  }
})();
