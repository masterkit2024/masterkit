// node tools/render.js out.mp4 startFrame endFrame  (renders frames [start,end) at 60fps)
const { chromium } = require('playwright'); const path=require('path'); const {spawn}=require('child_process');
(async()=>{
  const [out,s,e]=process.argv.slice(2); const f0=+s, f1=+e; const FPS=60;
  const ff=spawn('ffmpeg',['-y','-v','error','-f','image2pipe','-framerate','60','-c:v','mjpeg','-i','-','-c:v','libx264','-preset','fast','-crf','14','-pix_fmt','yuv420p','-r','60',out],{stdio:['pipe','inherit','inherit']});
  const b=await chromium.launch({args:['--allow-file-access-from-files','--enable-unsafe-swiftshader','--ignore-gpu-blocklist']});
  const p=await b.newPage({viewport:{width:540,height:960}});
  p.on('pageerror',er=>console.log('PAGEERR',er.message));
  await p.goto('file://'+path.resolve(__dirname,'../index.html'));
  await p.waitForFunction('window.ready===true',{timeout:600000});
  const t0=Date.now();
  for(let f=f0;f<f1;f++){
    const url=await p.evaluate(`(renderFrame(${f}/${FPS}),grab(0.95))`);
    const buf=Buffer.from(url.split(',')[1],'base64');
    if(!ff.stdin.write(buf)) await new Promise(r=>ff.stdin.once('drain',r));
    if((f-f0)%300===0) console.log(out,'frame',f,'elapsed',((Date.now()-t0)/1000).toFixed(0)+'s');
  }
  ff.stdin.end(); await new Promise(r=>ff.on('close',r)); await b.close();
  console.log('done',out,((Date.now()-t0)/1000).toFixed(0)+'s');
})();
