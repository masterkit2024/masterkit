// Frame driver
const W=1080,H=1920;
const out=document.getElementById('out'); const octx=out.getContext('2d');
const params=new URLSearchParams(location.search);
const GLSCALE=parseFloat(params.get('gl')||'1');
const SKYSIZE=parseInt(params.get('sky')||'2048');
let engine=null;
const acc=document.createElement('canvas'); acc.width=W; acc.height=H; const actx=acc.getContext('2d');
const tmp=document.createElement('canvas'); tmp.width=W; tmp.height=H; const tctx=tmp.getContext('2d');
async function init(){
  await document.fonts.load('700 40px Unbounded'); await document.fonts.load('800 40px Manrope');
  await document.fonts.load('300 40px Unbounded'); await document.fonts.load('500 40px Manrope');
  await document.fonts.load('700 40px Unbounded','ЧЁРНАЯ'); await document.fonts.load('800 40px Manrope','Привет');
  engine=new Engine(W,H,GLSCALE);
  const t0=performance.now(); engine.buildSky(SKYSIZE); window.skyMs=performance.now()-t0;
  window.ready=true;
}
// render time t (seconds) with motion-blur subframes if scene requests
window.renderFrame=function(t, forceN){
  const s=sceneAt(t);
  const N=forceN||s.mb(t);
  const dt=1/FPS, shutter=0.75;
  const evs=[];
  for(let i=0;i<N;i++){
    const ti=N>1? t+ (i/(N-1)-0.5)*dt*shutter : t;
    const tt=Math.max(s.t0,Math.min(s.t1-1e-4,ti));
    const r=evalScene(tt); r.U.uSeed=t*7.13+i*0.37; evs.push(r);
  }
  engine.render(evs.map(e=>e.U));
  octx.globalCompositeOperation='source-over'; octx.globalAlpha=1;
  octx.drawImage(engine.canvas,0,0,W,H);
  // overlay
  if(N===1){ drawOverlay(octx,evs[0]); }
  else {
    actx.clearRect(0,0,W,H);
    for(const e of evs){ tctx.clearRect(0,0,W,H); drawOverlay(tctx,e); actx.globalCompositeOperation='lighter'; actx.globalAlpha=1/N; actx.drawImage(tmp,0,0); }
    actx.globalAlpha=1; actx.globalCompositeOperation='source-over';
    octx.drawImage(acc,0,0);
  }
  drawStatic(octx,evs[Math.floor(N/2)]);
  return N;
};
window.grab=function(q){ return out.toDataURL('image/jpeg',q||0.95); };
init();
