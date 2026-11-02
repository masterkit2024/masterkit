// "Почему мы забываем сны" — 2D canvas motion piece, deterministic renderFrame(t)
const W=1080,H=1920,FPS=60,DUR=46.5;
const cv=document.getElementById('out'); const ctx=cv.getContext('2d');
const clamp=(x,a=0,b=1)=>Math.min(b,Math.max(a,x)), lerp=(a,b,t)=>a+(b-a)*t;
const sstep=(a,b,x)=>{const t=clamp((x-a)/(b-a));return t*t*(3-2*t);};
const eOut=t=>1-Math.pow(1-clamp(t),3), eIO=t=>{t=clamp(t);return t<.5?4*t*t*t:1-Math.pow(-2*t+2,3)/2;};
const eBack=t=>{t=clamp(t);const c=1.70158;return 1+(c+1)*Math.pow(t-1,3)+c*Math.pow(t-1,2);};
const win=(t,a,b,f=0.35)=>sstep(a,a+f,t)*(1-sstep(b-f,b,t));
const TAU=Math.PI*2;
function hash(n){let x=Math.sin(n*127.1+311.7)*43758.5453;return x-Math.floor(x);}
let seed=777; const rnd=()=>{seed=(seed*16807)%2147483647;return seed/2147483647;};

// ---------- captions ----------
const CHUNKS=[
 [0.25,2.02,"Почему мы забываем свои сны?"],
 [2.59,11.00,"Каждую ночь наш мозг создаёт удивительные миры. Мы можем летать, путешествовать во времени и встречать людей, которых никогда не видели."],
 [11.58,14.09,"Но почему утром мы почти ничего не помним?"],[14.66,15.92,"Всё дело в работе мозга."],
 [16.36,25.85,"Во время сна мозг продолжает активно работать, но процессы формирования воспоминаний отличаются от тех, что происходят во время бодрствования. Особенно важную роль играет гиппокамп —"],
 [26.06,28.66,"область мозга, отвечающая за формирование памяти."],
 [29.21,34.58,"Когда мы просыпаемся, внимание переключается на реальный мир, а воспоминания о сновидении быстро исчезают."],
 [35.14,38.66,"Иногда достаточно всего нескольких минут, чтобы забыть целую историю."],
 [39.41,44.55,"Получается, каждую ночь наш мозг создаёт миры, которые мы можем никогда больше не увидеть."],
];
const WORDS=[];
const CAPS=(()=>{const groups=[];
  for(const [a,b,txt] of CHUNKS){const words=txt.split(' ').filter(w=>w&&w!=='—');
    const wts=words.map(w=>w.replace(/[.,:?!—]/g,'').length+(/[.,:?!]$/.test(w)?4:0)+1);
    const tot=wts.reduce((x,y)=>x+y,0); let acc=0;
    const Wd=words.map((w,i)=>{const s=a+(b-a)*acc/tot;acc+=wts[i];return {w,s,e:a+(b-a)*acc/tot};}); WORDS.push(...Wd);
    let g=[]; const flush=()=>{if(g.length){groups.push({words:g,s:g[0].s,e:g[g.length-1].e});g=[];}};
    for(const it of Wd){const len=g.map(x=>x.w).join(' ').length; if(g.length&&len+it.w.length+1>20) flush(); g.push(it); if(/[.,:?!]$/.test(it.w)) flush();}
    flush();}
  for(let i=0;i<groups.length;i++){const n=groups[i+1];groups[i].end=n?Math.min(n.s,groups[i].e+0.6):groups[i].e+0.6;}
  return groups;})();
const wt=(w,after=0)=>{const x=WORDS.find(o=>o.w.replace(/[.,:?!]/g,'').toLowerCase()===w&&o.s>=after);return x?x.s:after;};
const T_MIR=wt('миры',2), T_LET=wt('летать',2), T_PUT=wt('путешествовать',2), T_VST=wt('встречать',2);
const T_OTL=wt('отличаются',16), T_BOD=wt('бодрствования',16), T_GIP=wt('гиппокамп',16), T_ISC=wt('исчезают',29), T_MIN=wt('минут',35);
const KEY=/^(сны|миры|летать|путешествовать|времени|людей|утром|помним|мозга|работать|воспоминаний|бодрствования|гиппокамп|памяти|реальный|мир|исчезают|минут|историю|увидеть|сна)$/i;
function accent(t){ if(t<11.5) return '#FFB8E6'; if(t<29) return '#B9A8FF'; if(t<39.3) return '#FFD08A'; return '#9FE8FF'; }
function drawCaptions(t){
  if(t>44.9) return;
  const g=CAPS.find(g=>t>=g.s-0.08&&t<g.end); if(!g) return;
  const y=1330,size=60; ctx.save(); ctx.font=`800 ${size}px Manrope`; ctx.textBaseline='alphabetic';
  const sp=size*0.28, ws=g.words.map(w=>ctx.measureText(w.w).width), total=ws.reduce((a,b)=>a+b,0)+sp*(ws.length-1);
  let x=W/2-total/2; const out=1-sstep(g.end-0.12,g.end,t), k0=sstep(g.s-0.1,g.s+0.08,t);
  g.words.forEach((w,i)=>{const k=sstep(w.s-0.06,w.s+0.1,t), active=t>=w.s-0.03&&t<w.e+0.05, key=KEY.test(w.w.replace(/[.,:?!]/g,''));
    const pop=active?1+0.07*Math.sin(clamp((t-w.s)/0.18)*Math.PI):1;
    ctx.save(); ctx.translate(x+ws[i]/2,y+(1-eOut(k0))*22); ctx.scale(pop,pop); ctx.globalAlpha=(0.38+0.62*k)*k0*out;
    ctx.textAlign='center'; ctx.shadowColor='rgba(0,0,0,0.9)'; ctx.shadowBlur=22; ctx.shadowOffsetY=3;
    ctx.fillStyle=key&&t>=w.s-0.03?accent(t):'#fff'; ctx.fillText(w.w,0,0); ctx.shadowBlur=0; ctx.shadowOffsetY=0; ctx.fillText(w.w,0,0); ctx.restore();
    x+=ws[i]+sp;});
  ctx.restore();
}

// ---------- shared assets ----------
function sprite(col,size=96){const c=document.createElement('canvas');c.width=c.height=size;const g=c.getContext('2d');
  const r=g.createRadialGradient(size/2,size/2,0,size/2,size/2,size/2);r.addColorStop(0,'rgba(255,255,255,1)');r.addColorStop(0.15,col);r.addColorStop(0.45,col.replace(/[\d.]+\)$/,'0.25)'));r.addColorStop(1,'rgba(0,0,0,0)');g.fillStyle=r;g.fillRect(0,0,size,size);return c;}
const SPR={star:sprite('rgba(200,220,255,1)'),pink:sprite('rgba(255,150,220,1)'),teal:sprite('rgba(120,240,255,1)'),gold:sprite('rgba(255,200,110,1)'),violet:sprite('rgba(170,140,255,1)'),warm:sprite('rgba(255,170,100,1)')};
const STARS=Array.from({length:260},(_,i)=>({x:hash(i)*W,y:hash(i+300)*H,s:0.6+hash(i+600)**3*3,d:0.2+hash(i+900)*0.6,ph:hash(i+1200)*TAU}));
const MOTES=Array.from({length:70},(_,i)=>({x:hash(i+2000),y:hash(i+2100),s:2+hash(i+2200)*5,sp:0.02+hash(i+2300)*0.05,c:['pink','teal','gold','violet'][i%4]}));
const BOKEH=(()=>{const c=document.createElement('canvas');c.width=c.height=160;const g=c.getContext('2d');const r=g.createRadialGradient(80,80,0,80,80,80);
  r.addColorStop(0,'rgba(200,170,255,0.3)');r.addColorStop(0.7,'rgba(200,170,255,0.16)');r.addColorStop(1,'rgba(200,170,255,0)');g.fillStyle=r;g.fillRect(0,0,160,160);return c;})();
const FG=Array.from({length:10},(_,i)=>({x:hash(i+500),y:hash(i+600),s:70+hash(i+700)*130,d:0.6+hash(i+800)*0.5}));

function txt(s,x,y,o={}){const a=o.a??1; if(a<=0.003) return; ctx.save(); ctx.globalAlpha=a; ctx.translate(x,y); const sc=o.s??1; ctx.scale(sc,sc); if(o.rot) ctx.rotate(o.rot);
  ctx.font=`${o.w??900} ${o.size??100}px ${o.f??'Unbounded'}`; ctx.textAlign='center'; ctx.textBaseline='middle'; ctx.letterSpacing=(o.tr??0)+'px';
  if(o.blur>0.4) ctx.filter=`blur(${o.blur.toFixed(1)}px)`;
  ctx.shadowColor=o.glow??'rgba(0,0,0,0.8)'; ctx.shadowBlur=o.gr??30; ctx.fillStyle=o.c??'#fff'; ctx.fillText(s,0,0); ctx.shadowBlur=0; ctx.fillText(s,0,0); ctx.restore();}
function pop(t,t0,t1,size,s,y,o={}){const k=eBack(clamp((t-t0)/0.45)), ki=clamp((t-t0)/0.25), ko=t1?sstep(t1-0.3,t1,t):0;
  txt(s,W/2,y+(1-eOut(clamp((t-t0)/0.45)))*50-ko*30,Object.assign({size,a:ki*(1-ko),s:lerp(1.25,1,k),blur:(1-ki)*14+ko*10},o));}
// letters dissolve upward into particles
function dissolveText(s,x,y,size,t,t0,col,glow){ctx.save(); ctx.font=`900 ${size}px Unbounded`; const chars=[...s]; const ws=chars.map(c=>ctx.measureText(c).width); const tot=ws.reduce((a,b)=>a+b,0);
  let cx=x-tot/2; chars.forEach((c,i)=>{const k=clamp((t-t0-i*0.06)/0.9); const a=1-eOut(k);
    if(a>0.01){ctx.save(); ctx.globalAlpha=a; ctx.translate(cx+ws[i]/2,y-eOut(k)*90); if(k>0.02) ctx.filter=`blur(${(k*12).toFixed(1)}px)`; ctx.textAlign='center'; ctx.textBaseline='middle';
      ctx.shadowColor=glow; ctx.shadowBlur=30; ctx.fillStyle=col; ctx.fillText(c,0,0); ctx.restore();}
    if(k>0&&k<1){ctx.save(); ctx.globalCompositeOperation='lighter'; for(let p=0;p<6;p++){const hx=hash(i*13+p), hy=hash(i*17+p+5); const px=cx+ws[i]*hx+(hx-0.5)*80*k, py=y+(hy-0.5)*size*0.6-k*(120+200*hy);
      ctx.globalAlpha=(1-k)*0.9; ctx.drawImage(SPR.pink,px-8,py-8,16,16);} ctx.restore();}
    cx+=ws[i];}); ctx.restore();}
function pill(x,y,w,h,r){ctx.beginPath();ctx.moveTo(x+r,y);ctx.arcTo(x+w,y,x+w,y+h,r);ctx.arcTo(x+w,y+h,x,y+h,r);ctx.arcTo(x,y+h,x,y,r);ctx.arcTo(x,y,x+w,y,r);ctx.closePath();}
const TY=300;

// ---------- brain (neuron) geometry, same family as the "brain" video ----------
function inside(x,y){const e=(cx,cy,rx,ry)=>((x-cx)/rx)**2+((y-cy)/ry)**2<1;
  if(e(0,-0.03,0.44,0.29)||e(-0.06,0.12,0.31,0.14)) return 1; if(e(0.27,0.205,0.14,0.085)) return 2;
  const sx=0.11+(y-0.12)*0.18; if(Math.abs(x-sx)<0.045&&y>0.12&&y<0.40) return 3; return 0;}
const N=[]; {const cell=0.024; for(let i=0;i<16000&&N.length<720;i++){const x=-0.47+rnd()*0.94, y=-0.34+rnd()*0.76; if(!inside(x,y)) continue;
  if(N.some(p=>(p.x-x)**2+(p.y-y)**2<cell*cell)) continue; N.push({x,y,id:N.length,ph:rnd()});}}
const E=[]; for(const a of N){const ds=N.filter(b=>b!==a).map(b=>[b,(b.x-a.x)**2+(b.y-a.y)**2]).sort((p,q)=>p[1]-q[1]).slice(0,3); for(const [b,d] of ds) if(d<0.065**2&&a.id<b.id) E.push({a,b,ph:rnd()});}
function outline(cx,cy,test){const pts=[];for(let k=0;k<=160;k++){const a=k/160*TAU;let r=0.6;while(r>0&&!test(cx+Math.cos(a)*r,cy+Math.sin(a)*r)) r-=0.003;pts.push([cx+Math.cos(a)*r,cy+Math.sin(a)*r]);}return pts;}
const OUT1=outline(0,0,(x,y)=>inside(x,y)===1), OUT2=outline(0.27,0.205,(x,y)=>inside(x,y)===2);
// hippocampus: seahorse-like curve deep in the temporal lobe
const HIPPO=[[-0.16,0.10],[-0.09,0.14],[-0.01,0.15],[0.06,0.12],[0.10,0.06],[0.08,0.01],[0.04,0.0]];
function hippoPath(S,cx,cy){ctx.beginPath(); HIPPO.forEach((p,i)=>{const x=cx+p[0]*S,y=cy+p[1]*S; i?ctx.lineTo(x,y):ctx.moveTo(x,y);});}

// ---------- background: night sky / morning ----------
function sky(t){
  const morn=sstep(11.4,12.6,t)*(1-sstep(14.5,14.9,t)) + sstep(29.1,30.2,t)*(1-sstep(38.9,39.6,t));
  const g=ctx.createLinearGradient(0,0,0,H);
  const top=[lerp(8,60,morn),lerp(10,90,morn),lerp(32,150,morn)], mid=[lerp(28,250,morn),lerp(18,160,morn),lerp(70,120,morn)], bot=[lerp(4,255,morn),lerp(4,205,morn),lerp(14,150,morn)];
  g.addColorStop(0,`rgb(${top.map(Math.round)})`); g.addColorStop(0.62,`rgb(${mid.map(Math.round)})`); g.addColorStop(1,`rgb(${bot.map(Math.round)})`);
  ctx.fillStyle=g; ctx.fillRect(0,0,W,H);
  // brain scenes darken the sky into a nebula
  const lab=sstep(14.4,14.9,t)*(1-sstep(28.9,29.4,t));
  if(lab>0){const r=ctx.createRadialGradient(W/2,880,40,W/2,900,1200); r.addColorStop(0,`rgba(60,30,110,${0.9*lab})`); r.addColorStop(1,`rgba(4,3,14,${0.95*lab})`); ctx.fillStyle=r; ctx.fillRect(0,0,W,H);}
  ctx.globalCompositeOperation='lighter';
  for(const s of STARS){const tw=0.55+0.45*Math.sin(t*1.7+s.ph); const y=(s.y-t*6*s.d+H*4)%H; ctx.globalAlpha=tw*(1-morn*0.85)*0.9; const z=s.s*5; ctx.drawImage(SPR.star,s.x-z,y-z,2*z,2*z);}
  ctx.globalAlpha=1; ctx.globalCompositeOperation='source-over';
  return morn;
}
const MOON=(()=>{const c=document.createElement('canvas');c.width=c.height=200;const g=c.getContext('2d');g.fillStyle='#FFF1D6';g.beginPath();g.arc(100,100,70,0,TAU);g.fill();
  g.globalCompositeOperation='destination-out';g.beginPath();g.arc(134,80,64,0,TAU);g.fill();return c;})();
function moon(t,morn){const a=(1-morn)*(1-sstep(14.4,14.9,t)+sstep(39.0,39.6,t)); if(a<0.01) return; const x=900, y=150+Math.sin(t*0.3)*6;
  ctx.save(); ctx.globalAlpha=a; const g=ctx.createRadialGradient(x,y,10,x,y,220); g.addColorStop(0,'rgba(255,240,210,0.3)'); g.addColorStop(1,'rgba(255,240,210,0)'); ctx.fillStyle=g; ctx.fillRect(x-220,y-220,440,440);
  ctx.drawImage(MOON,x-100,y-100); ctx.restore();}
function sun(t,morn){if(morn<0.01) return; const y=lerp(1700,1150,morn), x=540; ctx.save(); ctx.globalCompositeOperation='lighter'; ctx.globalAlpha=morn;
  const g=ctx.createRadialGradient(x,y,20,x,y,700); g.addColorStop(0,'rgba(255,220,150,0.9)'); g.addColorStop(0.15,'rgba(255,170,90,0.5)'); g.addColorStop(1,'rgba(255,120,60,0)'); ctx.fillStyle=g; ctx.fillRect(0,y-700,W,1400); ctx.restore();}

// sleeping head silhouette (profile, lying) at bottom
function sleeper(t,a){if(a<0.01) return; ctx.save(); ctx.globalAlpha=a; ctx.translate(540,1640+Math.sin(t*1.1)*4);
  ctx.fillStyle='#07060F';
  ctx.beginPath(); ctx.ellipse(0,40,620,140,0,0,TAU); ctx.fill(); // pillow/blanket hill
  ctx.beginPath(); ctx.moveTo(-260,-10); ctx.bezierCurveTo(-250,-170,-40,-200,40,-120); ctx.bezierCurveTo(70,-95,100,-100,120,-80); ctx.lineTo(150,-60); ctx.lineTo(128,-48);
  ctx.bezierCurveTo(140,-30,120,-20,110,-12); ctx.lineTo(118,0); ctx.lineTo(80,20); ctx.lineTo(-260,40); ctx.closePath(); ctx.fill();
  // rim light
  ctx.strokeStyle='rgba(180,160,255,0.55)'; ctx.lineWidth=3; ctx.beginPath(); ctx.moveTo(-250,-40); ctx.bezierCurveTo(-245,-170,-40,-200,40,-120); ctx.bezierCurveTo(70,-95,100,-100,120,-80); ctx.lineTo(150,-60); ctx.stroke();
  // closed eye
  ctx.strokeStyle='rgba(200,190,255,0.7)'; ctx.lineWidth=3; ctx.beginPath(); ctx.arc(60,-78,16,0.2,Math.PI-0.2); ctx.stroke();
  ctx.restore();
  // "z" floating
  for(let i=0;i<3;i++){const k=((t*0.4+i/3)%1); txt('z',540+90+k*80+i*10,1520-k*220,{size:40+i*12,w:700,f:'Manrope',c:'#CFC4FF',glow:'rgba(150,120,255,0.8)',gr:20,a:a*Math.sin(k*Math.PI)*0.8});}
}

// ---------- dream portal with vignettes ----------
const PX=540, PY=820, PR=360;
function portal(t,a,frag){ if(a<0.01) return;
  ctx.save();
  // stem of thought bubbles from the sleeper
  for(let i=0;i<3;i++){const r=[16,26,40][i]; ctx.globalAlpha=a*0.8; ctx.fillStyle='rgba(230,215,255,0.9)'; ctx.beginPath(); ctx.arc(600+i*-20,1470-i*90,r,0,TAU); ctx.fill();}
  ctx.globalAlpha=a;
  const r=PR*(0.96+0.02*Math.sin(t*1.3));
  ctx.beginPath(); ctx.arc(PX,PY,r,0,TAU); ctx.save(); ctx.clip();
  // dream gradient
  const g=ctx.createLinearGradient(0,PY-r,0,PY+r); g.addColorStop(0,'#3B2A7A'); g.addColorStop(0.55,'#C46BB6'); g.addColorStop(1,'#FFC28A'); ctx.fillStyle=g; ctx.fillRect(PX-r,PY-r,2*r,2*r);
  vignettes(t);
  ctx.restore();
  // glowing rim
  ctx.globalCompositeOperation='lighter';
  for(const [w,al] of [[30,0.08],[12,0.2],[4,0.8]]){ctx.strokeStyle=`rgba(255,210,250,${al*a})`; ctx.lineWidth=w; ctx.beginPath(); ctx.arc(PX,PY,r,0,TAU); ctx.stroke();}
  ctx.restore();
}
function cloud(x,y,s,al){ctx.save(); ctx.globalAlpha*=al; ctx.fillStyle='rgba(255,240,250,0.9)'; for(const [dx,dy,rr] of [[-1,0,0.55],[-0.35,-0.35,0.7],[0.35,-0.2,0.6],[0.9,0.05,0.45]]){ctx.beginPath(); ctx.arc(x+dx*s,y+dy*s,rr*s,0,TAU); ctx.fill();} ctx.fillRect(x-1.1*s,y,2.2*s,0.4*s); ctx.restore();}
function vignettes(t){
  const ga=ctx.globalAlpha;
  // (a) floating islands — wonderful worlds
  const va=1-sstep(T_LET-0.4,T_LET,t);
  if(va>0.01){ctx.globalAlpha=ga*va;
    for(let i=0;i<4;i++){const x=PX-230+i*150+Math.sin(t*0.6+i)*10, y=PY-60+(i%2)*140+Math.sin(t*0.9+i*2)*14, s=60+((i*37)%3)*18;
      ctx.fillStyle='#6B4F9E'; ctx.beginPath(); ctx.moveTo(x-s,y); ctx.quadraticCurveTo(x,y+s*1.6,x+s,y); ctx.closePath(); ctx.fill();
      ctx.fillStyle='#8FE3B0'; ctx.beginPath(); ctx.ellipse(x,y,s,s*0.22,0,0,TAU); ctx.fill();
      ctx.fillStyle='#3E8F6A'; ctx.beginPath(); ctx.moveTo(x-10,y-4); ctx.lineTo(x,y-s*0.9); ctx.lineTo(x+10,y-4); ctx.fill();}
    cloud(PX+150,PY-220,40,0.8); cloud(PX-200,PY-170,30,0.7);}
  // (b) flying figure among clouds
  const vb=win(t,T_LET-0.35,T_PUT+0.1,0.35);
  if(vb>0.01){ctx.globalAlpha=ga*vb; for(let i=0;i<5;i++){const x=((PX-400+i*190-t*160)%(800)+800)%800+PX-400; cloud(x,PY+120-(i%3)*110,36+i*6,0.85);}
    const fx=PX+Math.sin(t*1.5)*40, fy=PY-40+Math.sin(t*2.2)*20; ctx.save(); ctx.translate(fx,fy); ctx.rotate(-0.35); ctx.fillStyle='#FFF4FB';
    ctx.beginPath(); ctx.arc(70,0,22,0,TAU); ctx.fill(); ctx.beginPath(); ctx.ellipse(0,0,60,16,0,0,TAU); ctx.fill();
    ctx.strokeStyle='#FFF4FB'; ctx.lineWidth=12; ctx.lineCap='round'; ctx.beginPath(); ctx.moveTo(30,-8); ctx.lineTo(90,-40); ctx.moveTo(-50,0); ctx.lineTo(-100,10+Math.sin(t*6)*8); ctx.moveTo(-40,6); ctx.lineTo(-95,30+Math.sin(t*6+1)*8); ctx.stroke(); ctx.restore();
    for(let i=0;i<10;i++){const k=(t*1.5+i/10)%1; ctx.globalAlpha=ga*vb*(1-k)*0.6; ctx.fillStyle='#fff'; ctx.fillRect(fx-90-k*260,fy+10+i*3-k*20,30*(1-k),3);}}
  // (c) time travel: spiral + clock
  const vc=win(t,T_PUT-0.1,T_VST+0.1,0.35);
  if(vc>0.01){ctx.globalAlpha=ga*vc; ctx.save(); ctx.translate(PX,PY); ctx.strokeStyle='rgba(255,240,255,0.55)'; ctx.lineWidth=4; ctx.beginPath();
    for(let i=0;i<400;i++){const a=i*0.08+t*2.2, r=i*0.85; const x=Math.cos(a)*r, y=Math.sin(a)*r; i?ctx.lineTo(x,y):ctx.moveTo(x,y);} ctx.stroke();
    ctx.fillStyle='#FFF2E0'; ctx.beginPath(); ctx.arc(0,0,120,0,TAU); ctx.fill(); ctx.strokeStyle='#3B2A7A'; ctx.lineWidth=8; ctx.stroke();
    for(let i=0;i<12;i++){const a=i/12*TAU; ctx.beginPath(); ctx.moveTo(Math.cos(a)*96,Math.sin(a)*96); ctx.lineTo(Math.cos(a)*108,Math.sin(a)*108); ctx.lineWidth=5; ctx.stroke();}
    const h=-t*3.0, m=-t*14; ctx.lineCap='round'; ctx.lineWidth=10; ctx.beginPath(); ctx.moveTo(0,0); ctx.lineTo(Math.cos(h)*55,Math.sin(h)*55); ctx.stroke();
    ctx.lineWidth=6; ctx.beginPath(); ctx.moveTo(0,0); ctx.lineTo(Math.cos(m)*90,Math.sin(m)*90); ctx.stroke(); ctx.restore();}
  // (d) strangers: silhouettes with soft question marks
  const vd=sstep(T_VST-0.1,T_VST+0.25,t);
  if(vd>0.01){ctx.globalAlpha=ga*vd; for(let i=0;i<3;i++){const x=PX-200+i*200, y=PY+80+Math.sin(t*1.2+i)*10, s=i===1?1.15:0.95;
      ctx.fillStyle=['#2D1F5C','#3B2A7A','#2D1F5C'][i]; ctx.beginPath(); ctx.arc(x,y-110*s,52*s,0,TAU); ctx.fill(); ctx.beginPath(); ctx.ellipse(x,y+30*s,95*s,110*s,0,Math.PI,TAU); ctx.fill();
      txt('?',x,y-112*s,{size:58,w:900,c:'#FFD6F2',glow:'rgba(255,150,220,0.9)',gr:20,a:vd*(0.6+0.4*Math.sin(t*2+i))});}}
  ctx.globalAlpha=ga;
}

// ---------- brain view ----------
function brainView(t,a){ if(a<0.01) return;
  const zoomH=sstep(T_GIP-0.6,T_GIP+0.4,t)*(1-sstep(28.6,29.1,t));
  const S=lerp(880,1180,eIO(zoomH)), cx=W/2+lerp(0,-0.02,zoomH)*S, cy=lerp(860,880,zoomH)-lerp(0,0.06,zoomH)*S;
  ctx.save(); ctx.globalAlpha=a; ctx.globalCompositeOperation='lighter'; ctx.lineJoin='round';
  const col='rgba(170,150,255,';
  for(const [w,al] of [[14,0.06],[5,0.18],[2.2,0.6]]){ctx.strokeStyle=col+al+')'; ctx.lineWidth=w; for(const O of [OUT1,OUT2]){ctx.beginPath(); O.forEach((p,i)=>{const x=cx+p[0]*S,y=cy+p[1]*S; i?ctx.lineTo(x,y):ctx.moveTo(x,y);}); ctx.stroke();}}
  // activity: sleep = slow waves sweeping; memory "write" sparks only near hippocampus when awake-like
  const wave=(x)=>0.5+0.5*Math.sin((x*6-t*2.2));
  const dim=sstep(T_GIP-0.5,T_GIP+0.3,t)*(1-sstep(28.6,29.1,t));
  for(const e of E){const la=wave(e.a.x)*(1-dim*0.7); if(la<0.25) continue; ctx.strokeStyle=`rgba(170,150,255,${0.25*la*a})`; ctx.lineWidth=1.4; ctx.beginPath(); ctx.moveTo(cx+e.a.x*S,cy+e.a.y*S); ctx.lineTo(cx+e.b.x*S,cy+e.b.y*S); ctx.stroke();}
  for(const n of N){const l=(0.25+0.75*wave(n.x))*(1-dim*0.75); const s=(7+20*l)*S/1000; ctx.globalAlpha=a*Math.min(1,0.3+l); ctx.drawImage(SPR.violet,cx+n.x*S-s,cy+n.y*S-s,2*s,2*s);}
  ctx.globalAlpha=a;
  // hippocampus highlight
  if(zoomH>0.01){const k=eOut(clamp((t-T_GIP+0.2)/0.8));
    for(const [w,al] of [[40,0.12],[18,0.3],[7,0.95]]){ctx.strokeStyle=`rgba(255,200,110,${al*zoomH})`; ctx.lineWidth=w*S/1000; ctx.lineCap='round'; ctx.setLineDash([2000*k,4000]); hippoPath(S,cx,cy); ctx.stroke();} ctx.setLineDash([]);
    for(let i=0;i<14;i++){const f=(t*0.6+i/14)%1; const p=Math.floor(f*(HIPPO.length-1)), u=f*(HIPPO.length-1)-p; const x=cx+lerp(HIPPO[p][0],HIPPO[p+1][0],u)*S, y=cy+lerp(HIPPO[p][1],HIPPO[p+1][1],u)*S; ctx.globalAlpha=a*zoomH; ctx.drawImage(SPR.gold,x-14,y-14,28,28);}}
  ctx.restore();
  return {cx,cy,S,zoomH};
}

// ---------- frame ----------
function frame(t){
  ctx.globalCompositeOperation='source-over'; ctx.globalAlpha=1; ctx.filter='none';
  const morn=sky(t); sun(t,morn); moon(t,morn);
  // drifting dream motes
  ctx.globalCompositeOperation='lighter';
  for(const m of MOTES){const y=((m.y-t*m.sp)%1+1)%1*H, x=m.x*W+Math.sin(t*0.7+m.y*9)*30; ctx.globalAlpha=0.5*(1-morn*0.6); ctx.drawImage(SPR[m.c],x-m.s*3,y-m.s*3,m.s*6,m.s*6);}
  ctx.globalCompositeOperation='source-over'; ctx.globalAlpha=1;
  const night1=1-sstep(11.5,12.2,t), night2=sstep(39.0,39.8,t);
  sleeper(t,Math.max(night1,night2)*(1-sstep(14.4,14.8,t)));
  // dream portal (scene 1-2), fragments in the morning
  const pa=sstep(0.6,2.2,t)*(1-sstep(11.6,13.6,t));
  if(pa>0){ctx.save(); if(t>11.6){const k=sstep(11.6,13.6,t); ctx.translate(PX,PY); ctx.scale(1+k*0.15,1+k*0.15); ctx.translate(-PX,-PY); ctx.filter=`blur(${(k*10).toFixed(1)}px)`;} portal(t,pa); ctx.restore(); ctx.filter='none';}
  // morning: dream bubble breaks into particles
  if(t>11.6&&t<14.6){const k=clamp((t-11.6)/2.4); ctx.save(); ctx.globalCompositeOperation='lighter';
    for(let i=0;i<120;i++){const a=hash(i)*TAU, r=PR*Math.sqrt(hash(i+50)); const x=PX+Math.cos(a)*r+Math.cos(a)*k*300*(0.5+hash(i+9)), y=PY+Math.sin(a)*r-k*400*hash(i+3);
      ctx.globalAlpha=(1-k)*0.8*sstep(11.6,12.0,t); const s=10+12*hash(i+7); ctx.drawImage(SPR[['pink','gold','violet'][i%3]],x-s,y-s,2*s,2*s);} ctx.restore();
    // alarm clock
    const ka=sstep(12.0,12.4,t)*(1-sstep(14.2,14.6,t)); if(ka>0){const sh=Math.sin(t*50)*4*win(t,12.2,13.4,0.1);
      ctx.save(); ctx.globalAlpha=ka; ctx.translate(540+sh,880); ctx.fillStyle='rgba(20,14,30,0.75)'; pill(-260,-110,520,220,50); ctx.fill(); ctx.strokeStyle='rgba(255,210,150,0.8)'; ctx.lineWidth=3; pill(-260,-110,520,220,50); ctx.stroke(); ctx.restore();
      txt('07:00',540+sh,880,{size:150,c:'#FFE4B8',glow:'rgba(255,160,80,0.8)',a:ka});}}
  // brain scenes
  const ba=sstep(14.5,15.0,t)*(1-sstep(28.7,29.2,t));
  const B=brainView(t,ba);
  // ---------- titles ----------
  // S1 title
  if(t<2.6){const a=sstep(0.15,0.5,t)*(1-sstep(2.3,2.6,t)); txt('ПОЧЕМУ МЫ',W/2,TY-50,{size:76,c:'#EDE6FF',glow:'rgba(150,120,255,0.7)',a});
    txt('ЗАБЫВАЕМ СНЫ?',W/2,TY+50,{size:76,c:'#FFB8E6',glow:'rgba(255,120,200,0.8)',a:sstep(0.5,0.85,t)*(1-sstep(2.3,2.6,t))});}
  pop(t,T_MIR-0.15,T_LET-0.2,64,'УДИВИТЕЛЬНЫЕ',TY-45,{c:'#FFFFFF',glow:'rgba(255,120,200,0.7)'});
  pop(t,T_MIR+0.05,T_LET-0.2,76,'МИРЫ',TY+50,{c:'#FFB8E6',glow:'rgba(255,120,200,0.8)'});
  pop(t,T_LET-0.1,T_PUT-0.15,96,'ЛЕТАТЬ',TY,{c:'#FFFFFF',glow:'rgba(255,150,220,0.8)'});
  pop(t,T_PUT-0.1,T_VST-0.15,60,'ПУТЕШЕСТВОВАТЬ',TY-45,{c:'#FFFFFF',glow:'rgba(255,150,220,0.8)'});
  pop(t,T_PUT+0.1,T_VST-0.15,60,'ВО ВРЕМЕНИ',TY+45,{c:'#FFD6F2',glow:'rgba(255,150,220,0.8)'});
  pop(t,T_VST-0.1,11.5,64,'НЕЗНАКОМЦЫ',TY,{c:'#FFFFFF',glow:'rgba(255,150,220,0.8)'});
  if(t>12.5&&t<14.7){ if(t<13.6) pop(t,12.5,0,80,'НИЧЕГО',TY,{c:'#FFE9D0',glow:'rgba(255,150,80,0.7)'}); else dissolveText('НИЧЕГО',W/2,TY,80,t,13.6,'#FFE9D0','rgba(255,150,80,0.7)'); }
  pop(t,14.75,16.3,72,'ВСЁ ДЕЛО',TY-50,{c:'#EDE6FF',glow:'rgba(150,120,255,0.7)'});
  pop(t,15.0,16.3,72,'В МОЗГЕ',TY+50,{c:'#B9A8FF',glow:'rgba(150,120,255,0.8)'});
  // sleep vs wake memory bars
  if(t>16.4&&t<T_GIP-0.2){const a=sstep(16.5,16.9,t)*(1-sstep(T_GIP-0.6,T_GIP-0.2,t));
    txt('ЗАПИСЬ ВОСПОМИНАНИЙ',W/2,TY-110,{size:34,w:800,f:'Manrope',tr:10,c:'#D8CFFF',a});
    const rows=[['ВО СНЕ',0.28,'#B9A8FF',T_OTL],['НАЯВУ',1.0,'#FFD08A',T_BOD]];
    rows.forEach(([lab,v,c,t0],i)=>{const y=TY-20+i*120, k=eOut(clamp((t-t0+0.3)/0.9)); const ra=a*sstep(t0-0.5,t0-0.2,t);
      txt(lab,250,y,{size:36,w:800,f:'Manrope',c,a:ra}); ctx.save(); ctx.globalAlpha=ra; ctx.fillStyle='rgba(255,255,255,0.12)'; pill(380,y-16,520,32,16); ctx.fill(); ctx.fillStyle=c; pill(380,y-16,Math.max(32,520*v*k),32,16); ctx.fill(); ctx.restore();});}
  // hippocampus label
  if(B&&B.zoomH>0.01){const a=sstep(T_GIP,T_GIP+0.4,t)*(1-sstep(28.5,28.9,t));
    txt('ГИППОКАМП',W/2,TY-30,{size:96,c:'#FFE3B0',glow:'rgba(255,170,60,0.8)',a,s:lerp(1.2,1,eOut(clamp((t-T_GIP)/0.4)))});
    txt('отвечает за формирование памяти',W/2,TY+70,{size:40,w:700,f:'Manrope',c:'#F2E6D0',a:a*sstep(26.0,26.4,t)});}
  // waking: eye opening, attention to reality
  if(t>29.0&&t<35.0){const a=sstep(29.1,29.5,t)*(1-sstep(34.6,35.0,t)); const op=eIO(clamp((t-29.3)/1.6));
    ctx.save(); ctx.globalAlpha=a; ctx.translate(540,870);
    ctx.fillStyle='#FFF8EE'; ctx.beginPath(); ctx.moveTo(-300,0); ctx.quadraticCurveTo(0,-260*op,300,0); ctx.quadraticCurveTo(0,260*op,-300,0); ctx.fill();
    ctx.save(); ctx.clip(); const ig=ctx.createRadialGradient(0,0,10,0,0,120); ig.addColorStop(0,'#1A1020'); ig.addColorStop(0.35,'#1A1020'); ig.addColorStop(0.4,'#6B4FD8'); ig.addColorStop(1,'#2E6FD8');
    const look=Math.sin(clamp((t-31.2)/0.8)*Math.PI/2)*90; ctx.fillStyle=ig; ctx.beginPath(); ctx.arc(look,0,120,0,TAU); ctx.fill(); ctx.fillStyle='rgba(255,255,255,0.9)'; ctx.beginPath(); ctx.arc(look+40,-40,22,0,TAU); ctx.fill(); ctx.restore();
    ctx.strokeStyle='#2A1A40'; ctx.lineWidth=10; ctx.lineCap='round'; ctx.beginPath(); ctx.moveTo(-300,0); ctx.quadraticCurveTo(0,-260*op,300,0); ctx.stroke(); ctx.beginPath(); ctx.moveTo(-300,0); ctx.quadraticCurveTo(0,260*op,300,0); ctx.stroke();
    for(let i=0;i<9;i++){const u=(i+1)/10, x=lerp(-300,300,u), y=-260*op*4*u*(1-u)*0.5; ctx.beginPath(); ctx.moveTo(x,y); ctx.lineTo(x+(u-0.5)*40,y-30-10*op); ctx.lineWidth=6; ctx.stroke();}
    ctx.restore();
    // memories drift away from the left side (dream fragments) while attention goes right
    const k=clamp((t-T_ISC+0.6)/1.8);
    ctx.save(); ctx.globalCompositeOperation='lighter';
    for(let i=0;i<40;i++){const x=200-k*(200+300*hash(i))+Math.sin(t+i)*10, y=600+hash(i+40)*560-k*200*hash(i+80); ctx.globalAlpha=a*(1-k)*0.85*sstep(30.5,31.0,t); const s=12+16*hash(i+3); ctx.drawImage(SPR[['pink','violet','teal'][i%3]],x-s,y-s,2*s,2*s);} ctx.restore();
    pop(t,31.0,33.4,60,'ВНИМАНИЕ',TY-50,{c:'#FFFFFF',glow:'rgba(255,170,80,0.7)'}); pop(t,31.3,33.4,60,'→ РЕАЛЬНЫЙ МИР',TY+45,{c:'#FFD08A',glow:'rgba(255,170,80,0.7)'});
    if(t>33.4){ if(t<T_ISC+0.1) pop(t,33.45,0,90,'СОН',TY,{c:'#FFD6F2',glow:'rgba(255,120,200,0.8)'}); else dissolveText('СОН',W/2,TY,90,t,T_ISC+0.1,'#FFD6F2','rgba(255,120,200,0.8)'); }}
  // minutes: story panels fade one by one, timer
  if(t>35.0&&t<39.4){const a=sstep(35.1,35.5,t)*(1-sstep(39.0,39.4,t)); const p=clamp((t-T_MIN+0.2)/2.6); const mins=Math.min(5,Math.floor(p*5.999));
    txt(`${mins}:00`,W/2,TY-20,{size:150,c:'#FFE4B8',glow:'rgba(255,160,80,0.7)',a}); txt('минут',W/2,TY+90,{size:42,w:800,f:'Manrope',tr:10,c:'#FFE4B8',a});
    for(let i=0;i<4;i++){const x=320+(i%2)*440, y=760+Math.floor(i/2)*380; const fadeK=clamp((p*4-i)); const al=a*(1-fadeK);
      ctx.save(); ctx.globalAlpha=al; ctx.translate(x,y-fadeK*30); ctx.fillStyle='rgba(40,24,70,0.85)'; pill(-200,-160,400,320,30); ctx.fill(); ctx.strokeStyle='rgba(255,200,240,0.6)'; ctx.lineWidth=3; pill(-200,-160,400,320,30); ctx.stroke();
      ctx.beginPath(); pill(-190,-150,380,300,24); ctx.clip(); const gg=ctx.createLinearGradient(0,-150,0,150); gg.addColorStop(0,['#3B2A7A','#C46BB6','#2D5C8A','#7A3B6B'][i]); gg.addColorStop(1,'#FFC28A'); ctx.fillStyle=gg; ctx.fillRect(-190,-150,380,300);
      ctx.fillStyle='rgba(255,245,252,0.95)';
      if(i===0){ctx.beginPath(); ctx.arc(0,-10,60,0,TAU); ctx.fill();} else if(i===1){ctx.beginPath(); ctx.ellipse(0,0,90,22,-0.3,0,TAU); ctx.fill(); ctx.beginPath(); ctx.arc(80,-28,20,0,TAU); ctx.fill();}
      else if(i===2){ctx.beginPath(); ctx.arc(0,0,70,0,TAU); ctx.lineWidth=10; ctx.strokeStyle='rgba(255,245,252,0.95)'; ctx.stroke(); ctx.beginPath(); ctx.moveTo(0,0); ctx.lineTo(0,-50); ctx.moveTo(0,0); ctx.lineTo(36,10); ctx.stroke();}
      else {ctx.beginPath(); ctx.arc(-50,-30,30,0,TAU); ctx.arc(50,-30,30,0,TAU); ctx.fill(); ctx.fillRect(-90,10,80,90); ctx.fillRect(10,10,80,90);}
      ctx.restore();
      if(fadeK>0&&fadeK<1){ctx.save(); ctx.globalCompositeOperation='lighter'; for(let q=0;q<14;q++){const hx=hash(i*31+q), hy=hash(i*37+q); ctx.globalAlpha=a*(1-fadeK); const s=10; ctx.drawImage(SPR.pink,x-200+400*hx-s,y-160+320*hy-fadeK*200*hy-s,2*s,2*s);} ctx.restore();}}}
  // finale: night, bubbles rise and pop into stars
  if(t>39.2){const a=sstep(39.3,39.9,t);
    for(let i=0;i<9;i++){const t0=39.6+i*0.55, k=clamp((t-t0)/3.2); if(k<=0) continue; const x=180+((i*317)%720), y=1500-k*900, r=40+((i*53)%50);
      const popK=sstep(0.82,1,k);
      if(popK<1){ctx.save(); ctx.globalAlpha=a*(1-popK); const g=ctx.createRadialGradient(x-r*0.3,y-r*0.3,4,x,y,r); g.addColorStop(0,'rgba(255,255,255,0.5)'); g.addColorStop(0.6,'rgba(220,170,255,0.18)'); g.addColorStop(1,'rgba(255,200,240,0.55)');
        ctx.fillStyle=g; ctx.beginPath(); ctx.arc(x,y,r*(1+popK*0.4),0,TAU); ctx.fill(); ctx.restore();}
      if(popK>0){ctx.save(); ctx.globalCompositeOperation='lighter'; ctx.globalAlpha=a*Math.sin(popK*Math.PI)+a*0.6*popK; ctx.drawImage(SPR.star,x-26,y-26,52,52); ctx.restore();}}
    pop(t,40.0,0,60,'КАЖДУЮ НОЧЬ',TY-80,{w:800,f:'Manrope',tr:12,c:'#D8E6FF',glow:'rgba(0,0,0,0.8)'});
    pop(t,41.3,0,80,'МИРЫ,',TY+20,{c:'#FFFFFF',glow:'rgba(150,120,255,0.8)'});
    pop(t,42.6,0,54,'КОТОРЫХ МЫ БОЛЬШЕ',TY+120,{c:'#E8DDFF',glow:'rgba(150,120,255,0.6)'});
    pop(t,43.5,0,62,'НЕ УВИДИМ',TY+200,{c:'#FFB8E6',glow:'rgba(255,120,200,0.8)'});}
  // foreground bokeh (shallow DOF)
  ctx.globalCompositeOperation='lighter';
  for(const f of FG){const x=f.x*W+Math.sin(t*0.25+f.y*4)*40, y=((f.y*H-t*14*f.d)%(H+300)+H+300)%(H+300)-150; ctx.globalAlpha=0.45; ctx.drawImage(BOKEH,x-f.s,y-f.s,f.s*2,f.s*2);}
  ctx.globalCompositeOperation='source-over'; ctx.globalAlpha=1;
  const v=ctx.createRadialGradient(W/2,H/2,H*0.3,W/2,H/2,H*0.75); v.addColorStop(0,'rgba(0,0,0,0)'); v.addColorStop(1,'rgba(0,0,0,0.6)'); ctx.fillStyle=v; ctx.fillRect(0,0,W,H);
  drawCaptions(t);
  const fade=1-sstep(0,0.35,t)+sstep(DUR-0.7,DUR,t); if(fade>0){ctx.fillStyle=`rgba(0,0,0,${clamp(fade)})`; ctx.fillRect(0,0,W,H);}
}
window.renderFrame=function(t){frame(t);return 1;};
window.grab=q=>cv.toDataURL('image/jpeg',q||0.95);
(async()=>{for(const f of ['900 40px Unbounded','800 40px Manrope','700 40px Manrope']) await document.fonts.load(f,'АБВ абв 07:00'); window.ready=true;})();
