const {chromium}=require('playwright');const fs=require('fs');const path=require('path');
(async()=>{const [,,out,a,b,scale]=process.argv;fs.mkdirSync(out,{recursive:true});
const br=await chromium.launch();const pg=await br.newPage({viewport:{width:1080,height:1920}});
pg.on('pageerror',e=>console.error('ERR',e.message));
await pg.goto('file://'+path.resolve(__dirname,process.env.PAGE||'film.html'));await pg.evaluate(()=>Promise.all([document.fonts.load('40px Mono1'),document.fonts.load('40px Pango')]));
for(let f=+a;f<=+b;f++){const d=await pg.evaluate(f=>{render(f);return document.getElementById('c').toDataURL('image/png')},f);
fs.writeFileSync(`${out}/${String(f<0?'sheet':f).padStart(4,'0')}.png`,Buffer.from(d.split(',')[1],'base64'))}
await br.close()})();
