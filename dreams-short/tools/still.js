// usage: node tools/still.js out_dir t1 t2 ... ; env GL=scale
const { chromium } = require('playwright'); const fs=require('fs'); const path=require('path');
(async()=>{
  const [outDir,...ts]=process.argv.slice(2); fs.mkdirSync(outDir,{recursive:true});
  const b=await chromium.launch({args:['--allow-file-access-from-files','--enable-unsafe-swiftshader','--ignore-gpu-blocklist']});
  const p=await b.newPage({viewport:{width:540,height:960}});
  p.on('console',m=>{ if(m.type()==='error'||m.type()==='warning') console.log('PAGE',m.text()); });
  p.on('pageerror',e=>console.log('PAGEERR',e.message));
  await p.goto('file://'+path.resolve(__dirname,'../index.html'));
  await p.waitForFunction('window.ready===true',{timeout:600000});
  
  for(const t of ts){
    const t0=Date.now();
    const n=await p.evaluate(`renderFrame(${t})`);
    const url=await p.evaluate('grab(0.92)');
    fs.writeFileSync(path.join(outDir,`t${(+t).toFixed(2).padStart(6,'0')}.jpg`),Buffer.from(url.split(',')[1],'base64'));
    console.log('t',t,'N',n,'ms',Date.now()-t0);
  }
  await b.close();
})();
