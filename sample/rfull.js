// usage: node rfull.js out.mp4 f0 f1   |  node rfull.js --png dir f1,f2,...  | node rfull.js --sfx out.json
const {chromium}=require('playwright');const fs=require('fs');const path=require('path');const {spawn}=require('child_process');
(async()=>{const a=process.argv.slice(2);const br=await chromium.launch();const pg=await br.newPage({viewport:{width:1080,height:1920}});
pg.on('pageerror',e=>console.error('ERR',e.message));pg.on('console',m=>{if(m.type()==='error')console.error(m.text())});
await pg.goto('file://'+path.resolve(__dirname,'full.html'));await pg.evaluate(()=>Promise.all([document.fonts.load('40px Mono1'),document.fonts.load('40px Pango')]));
const grab=f=>pg.evaluate(f=>{render(f);return document.getElementById('c').toDataURL('image/png')},f).then(d=>Buffer.from(d.split(',')[1],'base64'));
if(a[0]==='--sfx'){fs.writeFileSync(a[1],JSON.stringify(await pg.evaluate(()=>window.SFXLIST)))}
else if(a[0]==='--png'){fs.mkdirSync(a[1],{recursive:true});for(const f of a[2].split(',').map(Number))fs.writeFileSync(`${a[1]}/${String(f).padStart(4,'0')}.png`,await grab(f))}
else{const ff=spawn('ffmpeg',['-v','error','-y','-f','image2pipe','-framerate','24','-c:v','png','-i','-','-c:v','libx264','-crf','17','-preset','medium','-pix_fmt','yuv420p',a[0]],{stdio:['pipe','inherit','inherit']});
 for(let f=+a[1];f<=+a[2];f++){const b=await grab(f);if(!ff.stdin.write(b))await new Promise(r=>ff.stdin.once('drain',r))}ff.stdin.end();await new Promise(r=>ff.on('close',r))}
await br.close()})();
