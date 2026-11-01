const { chromium } = require('playwright'); const path=require('path'); const fs=require('fs');
(async()=>{
  const b=await chromium.launch({args:['--allow-file-access-from-files','--enable-unsafe-swiftshader']});
  const p=await b.newPage({viewport:{width:600,height:800}});
  p.on('pageerror',e=>console.log('ERR',e.message));
  await p.goto('file://'+path.resolve(__dirname,'../thumb.html'));
  await p.waitForFunction('window.done===true',{timeout:600000});
  const url=await p.evaluate(()=>document.getElementById('out').toDataURL('image/png'));
  fs.writeFileSync(process.argv[2],Buffer.from(url.split(',')[1],'base64')); await b.close();
})();
