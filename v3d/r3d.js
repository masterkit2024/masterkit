const {chromium}=require('playwright');const fs=require('fs');const {spawn}=require('child_process');
(async()=>{const a=process.argv.slice(2);const br=await chromium.launch({args:['--use-angle=swiftshader','--enable-unsafe-swiftshader','--allow-file-access-from-files']});
const pg=await br.newPage({viewport:{width:1080,height:1920}});pg.on('pageerror',e=>console.error('ERR',e.message));pg.on('console',m=>{if(m.type()==='error')console.error(m.text())});
await pg.goto('file://'+__dirname+'/index.html');await pg.waitForFunction('window.ready',{timeout:60000});await pg.evaluate(()=>document.fonts.load('900 40px Mont'));
const grab=f=>pg.evaluate(f=>render(f),f).then(d=>Buffer.from(d.split(',')[1],'base64'));
if(a[0]==='--jpg'){fs.mkdirSync(a[1],{recursive:true});for(const f of a[2].split(',').map(Number))fs.writeFileSync(`${a[1]}/${String(f).padStart(4,'0')}.jpg`,await grab(f))}
else if(a[0]==='--imp'){fs.writeFileSync(a[1],JSON.stringify(await pg.evaluate(()=>window.IMPACTS)))}
else{const ff=spawn('ffmpeg',['-v','error','-y','-f','image2pipe','-framerate','24','-c:v','mjpeg','-i','-','-c:v','libx264','-crf','19','-preset','medium','-pix_fmt','yuv420p',a[0]],{stdio:['pipe','inherit','inherit']});
 for(let f=+a[1];f<=+a[2];f++){const b=await grab(f);if(!ff.stdin.write(b))await new Promise(r=>ff.stdin.once('drain',r))}ff.stdin.end();await new Promise(r=>ff.on('close',r))}
await br.close()})();
