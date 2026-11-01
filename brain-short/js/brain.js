// "Мозг на 100%" — 2D canvas motion piece, deterministic renderFrame(t)
const W=1080,H=1920,FPS=60,DUR=51.0;
const cv=document.getElementById('out'); const ctx=cv.getContext('2d');
const clamp=(x,a=0,b=1)=>Math.min(b,Math.max(a,x)), lerp=(a,b,t)=>a+(b-a)*t;
const sstep=(a,b,x)=>{const t=clamp((x-a)/(b-a));return t*t*(3-2*t);};
const eOut=t=>1-Math.pow(1-clamp(t),3), eIO=t=>{t=clamp(t);return t<.5?4*t*t*t:1-Math.pow(-2*t+2,3)/2;};
const eBack=t=>{t=clamp(t);const c=1.70158;return 1+(c+1)*Math.pow(t-1,3)+c*Math.pow(t-1,2);};
const win=(t,a,b,f=0.3)=>sstep(a,a+f,t)*(1-sstep(b-f,b,t));
const TAU=Math.PI*2;
function hash(n){let x=Math.sin(n*127.1+311.7)*43758.5453;return x-Math.floor(x);}
let seed=12345; const rnd=()=>{seed=(seed*16807)%2147483647;return seed/2147483647;};
function track(t,k){if(t<=k[0][0])return k[0][1];for(let i=0;i<k.length-1;i++){if(t<=k[i+1][0]){const u=eIO((t-k[i][0])/(k[i+1][0]-k[i][0]));const a=k[i][1],b=k[i+1][1];return Array.isArray(a)?a.map((v,j)=>lerp(v,b[j],u)):lerp(a,b,u);}}return k[k.length-1][1];}

// ---------- captions (voice trimmed by 2.55 s) ----------
const CHUNKS=[
 [0.19,1.50,"Что, если твой мозг"],[1.65,3.87,"начнёт работать на 100%?"],
 [4.57,7.37,"Представь, что ты можешь запоминать практически всё,"],[7.58,11.13,"мгновенно находить решения и замечать мельчайшие детали."],
 [11.77,13.88,"Кажется, ты станешь настоящим гением?"],[14.33,16.31,"Но есть один интересный факт."],
 [16.83,21.70,"Миф о том, что человек использует только 10% своего мозга, давно опровергнут."],
 [22.11,25.75,"На самом деле практически все его области выполняют свою работу."],
 [26.27,30.45,"Но что произойдёт, если все нейроны начнут работать одновременно?"],
 [31.22,32.67,"Это не сделает тебя умнее."],[33.39,38.60,"Наоборот, чрезмерная активность мозга может привести к серьёзным нарушениям его работы."],
 [39.23,39.94,"Получается,"],[40.09,43.56,"секрет не в том, чтобы заставить мозг работать на 100%,"],
 [43.88,46.60,"а в том, чтобы понять, насколько удивителен он"],[46.76,47.80,"уже сейчас."],[48.44,49.23,"А ты знал об этом?"],
];
const SPOKEN={'100%':'стопроцентов','10%':'десятьпроцентов'};
const WORDS=[];
const CAPS=(()=>{const groups=[];
  for(const [a,b,txt] of CHUNKS){
    const words=txt.split(' ');
    const wts=words.map(w=>{const k=w.replace(/[.,:?!]/g,'');return (SPOKEN[k]??k).length+(/[.,:?!]$/.test(w)?3:0)+1;});
    const tot=wts.reduce((x,y)=>x+y,0); let acc=0;
    const Wd=words.map((w,i)=>{const s=a+(b-a)*acc/tot;acc+=wts[i];return {w,s,e:a+(b-a)*acc/tot};});
    WORDS.push(...Wd);
    let g=[]; const flush=()=>{if(g.length){groups.push({words:g,s:g[0].s,e:g[g.length-1].e});g=[];}};
    for(const it of Wd){const len=g.map(x=>x.w).join(' ').length; if(g.length&&len+it.w.length+1>20) flush(); g.push(it); if(/[.,:?!]$/.test(it.w)) flush();}
    flush();
  }
  for(let i=0;i<groups.length;i++){const n=groups[i+1];groups[i].end=n?Math.min(n.s,groups[i].e+0.6):groups[i].e+0.6;}
  return groups;})();
const wt=(w,after=0)=>{const x=WORDS.find(o=>o.w.replace(/[.,:?!]/g,'')===w&&o.s>=after);return x?x.s:after;};
const T_OPR=wt('опровергнут',16), T_ODN=wt('одновременно',26), T_UMN=wt('умнее',31), T_NAR=wt('нарушениям',33);
const KEY=/^(мозг|100%|10%|гением|факт|опровергнут|все|нейроны|одновременно|умнее|нарушениям|секрет|удивителен|сейчас|детали|всё|решения|Миф|области)$/i;
function accent(t){ if(t<14.2) return '#FFD27A'; if(t<26) return '#8FE3FF'; if(t<39) return '#FF7A7A'; return '#7DFFD0'; }
function drawCaptions(t){
  if(t>48.2) return;
  const g=CAPS.find(g=>t>=g.s-0.08&&t<g.end); if(!g) return;
  const y=1300,size=60; ctx.save(); ctx.font=`800 ${size}px Manrope`; ctx.textBaseline='alphabetic';
  const sp=size*0.28, ws=g.words.map(w=>ctx.measureText(w.w).width), total=ws.reduce((a,b)=>a+b,0)+sp*(ws.length-1);
  let x=W/2-total/2; const out=1-sstep(g.end-0.12,g.end,t), k0=sstep(g.s-0.1,g.s+0.08,t);
  g.words.forEach((w,i)=>{
    const k=sstep(w.s-0.06,w.s+0.1,t), active=t>=w.s-0.03&&t<w.e+0.05, key=KEY.test(w.w.replace(/[.,:?!]/g,''));
    const pop=active?1+0.07*Math.sin(clamp((t-w.s)/0.18)*Math.PI):1;
    ctx.save(); ctx.translate(x+ws[i]/2,y+(1-eOut(k0))*22); ctx.scale(pop,pop); ctx.globalAlpha=(0.38+0.62*k)*k0*out;
    ctx.textAlign='center'; ctx.shadowColor='rgba(0,0,0,0.9)'; ctx.shadowBlur=22; ctx.shadowOffsetY=3;
    ctx.fillStyle=key&&t>=w.s-0.03?accent(t):'#fff'; ctx.fillText(w.w,0,0); ctx.shadowBlur=0; ctx.shadowOffsetY=0; ctx.fillText(w.w,0,0); ctx.restore();
    x+=ws[i]+sp; });
  ctx.restore();
}

// ---------- brain geometry ----------
function inside(x,y){
  const e=(cx,cy,rx,ry)=>((x-cx)/rx)**2+((y-cy)/ry)**2<1;
  if(e(0,-0.03,0.44,0.29)||e(-0.06,0.12,0.31,0.14)) return 1;
  if(e(0.27,0.205,0.14,0.085)) return 2;
  const sx=0.11+(y-0.12)*0.18; if(Math.abs(x-sx)<0.045&&y>0.12&&y<0.40) return 3;
  return 0;
}
const N=[]; {
  const cell=0.021; const grid=new Map();
  for(let i=0;i<20000&&N.length<950;i++){
    const x=-0.47+rnd()*0.94, y=-0.34+rnd()*0.76; const part=inside(x,y); if(!part) continue;
    const gx=Math.floor(x/cell), gy=Math.floor(y/cell); let ok=true;
    for(let a=-1;a<=1&&ok;a++)for(let b=-1;b<=1&&ok;b++){const l=grid.get((gx+a)+','+(gy+b));if(l)for(const p of l)if((p.x-x)**2+(p.y-y)**2<cell*cell){ok=false;break;}}
    if(!ok) continue;
    const n={x,y,part,id:N.length,ph:rnd(),sz:0.6+rnd()*0.8};
    // region: 0 frontal,1 parietal,2 occipital,3 temporal,4 cerebellum/stem
    n.reg=part>=2?4:(y>0.06&&x<0.2?3:(x<-0.12?0:(x>0.2?2:1)));
    N.push(n); const key=gx+','+gy; if(!grid.has(key)) grid.set(key,[]); grid.get(key).push(n);
  }
}
const E=[]; for(const a of N){const ds=N.filter(b=>b!==a).map(b=>[b,(b.x-a.x)**2+(b.y-a.y)**2]).sort((p,q)=>p[1]-q[1]).slice(0,3);
  for(const [b,d] of ds) if(d<0.06*0.06&&a.id<b.id) E.push({a,b,ph:rnd(),sp:0.6+rnd()*0.8});}
// outline (star-shaped ray march from centroid) for cerebrum, separate for cerebellum
function outline(cx,cy,test){const pts=[];for(let k=0;k<=180;k++){const a=k/180*TAU;let r=0.6;while(r>0&&!test(cx+Math.cos(a)*r,cy+Math.sin(a)*r)) r-=0.003;pts.push([cx+Math.cos(a)*r,cy+Math.sin(a)*r]);}return pts;}
const OUT1=outline(0,0,(x,y)=>inside(x,y)===1), OUT2=outline(0.27,0.205,(x,y)=>inside(x,y)===2);
// gyri curves
const GYRI=[]; for(let k=0;k<26;k++){let x,y;do{x=-0.42+rnd()*0.84;y=-0.28+rnd()*0.4;}while(inside(x,y)!==1);
  let a=rnd()*TAU; const pts=[[x,y]]; const L=12+Math.floor(rnd()*14);
  for(let i=0;i<L;i++){a+=Math.sin(i*1.3+k)*0.9+(rnd()-0.5)*0.6; const nx=x+Math.cos(a)*0.018, ny=y+Math.sin(a)*0.018; if(inside(nx,ny)!==1) break; x=nx;y=ny; pts.push([x,y]);}
  if(pts.length>4) GYRI.push(pts);}
const REGC=['#5AB0FF','#5AF0FF','#7DFFB0','#B88CFF','#FFC15A'];

// ---------- sprites ----------
function sprite(col,size=96,hard=0.15){const c=document.createElement('canvas');c.width=c.height=size;const g=c.getContext('2d');
  const r=g.createRadialGradient(size/2,size/2,0,size/2,size/2,size/2);r.addColorStop(0,'rgba(255,255,255,1)');r.addColorStop(hard,col);r.addColorStop(0.45,col.replace(/[\d.]+\)$/,'0.25)'));r.addColorStop(1,'rgba(0,0,0,0)');
  g.fillStyle=r;g.fillRect(0,0,size,size);return c;}
const SPR={cyan:sprite('rgba(90,220,255,1)'),gold:sprite('rgba(255,190,80,1)'),red:sprite('rgba(255,70,60,1)'),white:sprite('rgba(220,235,255,1)'),teal:sprite('rgba(90,255,200,1)'),grey:sprite('rgba(120,140,170,1)'),
  violet:sprite('rgba(180,140,255,1)'),blue:sprite('rgba(90,170,255,1)'),green:sprite('rgba(125,255,170,1)')};
const REGS=['blue','cyan','green','violet','gold'];
const BOKEH=(()=>{const c=document.createElement('canvas');c.width=c.height=160;const g=c.getContext('2d');const r=g.createRadialGradient(80,80,0,80,80,80);
  r.addColorStop(0,'rgba(140,200,255,0.35)');r.addColorStop(0.7,'rgba(140,200,255,0.18)');r.addColorStop(1,'rgba(140,200,255,0)');g.fillStyle=r;g.fillRect(0,0,160,160);return c;})();
const DUST=Array.from({length:180},(_,i)=>({x:hash(i)*1.6-0.8,y:hash(i+99)*2.2-1.1,s:0.5+hash(i+7)*1.5,d:0.25+hash(i+3)*0.4}));
const FG=Array.from({length:12},(_,i)=>({x:hash(i+500)*1.4-0.7,y:hash(i+600)*2-1,s:60+hash(i+700)*120,d:1.6+hash(i+800)*0.8}));

// ---------- scene state ----------
function state(t){
  const S={mode:'idle',col:'cyan',base:0.12,spike:0.15,edge:0.35,pulse:0.4,shake:0,red:0,grey:0,glitch:0};
  return S;
}
// neuron activation [level, sprite]
function act(n,t){
  const h=hash(n.id*7.31), spk=(r)=>{const k=Math.floor(t*r+n.ph*10); const hh=hash(n.id*13.7+k*1.37); const f=(t*r+n.ph*10)%1; return hh<0.12?Math.exp(-f*5):0;};
  const nx=(n.x+0.45)/0.9;
  if(t<4.4){ // wave to 100%
    const p=clamp((t-1.65)/2.1); const on=sstep(nx-0.06,nx,p*1.08);
    return [0.06+0.55*on+0.35*spk(2)*on, on>0.5&&p>0.97?'gold':'cyan'];
  }
  if(t<11.6){
    const r=t<7.4?3:(t<9.6?0:2); const foc=[[5.0,7.6,3],[7.5,9.8,0],[9.8,11.6,2]].map(([a,b,rg])=>win(t,a,b,0.35)*(n.reg===rg?1:0)).reduce((a,b)=>a+b,0);
    return [0.25+0.15*spk(2)+0.65*foc+0.3*foc*spk(4), foc>0.3?'gold':'cyan'];
  }
  if(t<14.2){ const g=sstep(11.7,12.6,t); return [0.3+0.45*g+0.25*spk(3),'gold']; }
  if(t<21.95){ // grey, then only 10% lit
    const ten=sstep(16.9,17.6,t)*(1-sstep(T_OPR-0.05,T_OPR+0.4,t));
    const inTen=(n.x<-0.18&&n.y<-0.05)?1:0;
    const all=sstep(T_OPR,T_OPR+0.6,t);
    return [lerp(0.08,0.06,ten)+0.75*ten*inTen+0.1*spk(2)+0.45*all*(0.5+0.5*spk(3)), all>0.5?'cyan':(inTen&&ten>0.3?'cyan':'grey')];
  }
  if(t<26.1){ // regions in turn
    const order=[0,1,2,3,4]; const i=order.indexOf(n.reg); const on=sstep(22.2+i*0.6,22.5+i*0.6,t);
    return [0.2+0.5*on+0.3*on*spk(3), REGS[n.reg]];
  }
  if(t<31.1){ // ramp to everything at once
    const r=sstep(26.4,T_ODN+0.6,t); const sync=0.5+0.5*Math.sin(t*TAU*1.5);
    return [0.3+0.5*r*(0.75+0.25*sync)+0.2*spk(4)*(1-r), r>0.85?'white':'cyan'];
  }
  if(t<39.1){ // overload: red chaos (per-neuron flicker, global brightness steady)
    const f=hash(n.id*3.1+Math.floor(t*9+n.ph*9)); return [0.35+0.6*f*f, f>0.7?'white':'red'];
  }
  // calm, natural sparse activity
  const calm=sstep(39.1,40.4,t);
  return [0.18+0.55*spk(1.4)+0.25*spk(0.6), 'teal'];
}
const CAM=t=>track(t,[[0,[0.86,0,0.06,-0.03]],[1.6,[1.0,0,0.03,-0.01]],[4.4,[1.05,0,0,0.0]],[5.6,[1.22,0.02,-0.08,0.02]],[7.6,[1.25,0.12,-0.04,-0.02]],[9.8,[1.22,-0.12,-0.03,0.02]],[11.6,[1.0,0,0,0]],[14.2,[0.95,0,0.02,0.01]],[17.0,[1.08,0.06,0.03,-0.015]],[21.9,[1.0,0,0,0]],[26.1,[1.08,0,0,0.01]],[30.8,[1.25,0,0,0]],[39.1,[1.1,0,0,-0.02]],[47,[1.3,0,0.02,0.02]],[48.4,[0.8,0,0.12,0]],[51,[0.75,0,0.12,0]]]);

// ---------- text helpers ----------
function txt(s,x,y,o={}){const a=o.a??1; if(a<=0.003) return; ctx.save(); ctx.globalAlpha=a; ctx.translate(x,y); const sc=o.s??1; ctx.scale(sc,sc); if(o.rot) ctx.rotate(o.rot);
  ctx.font=`${o.w??900} ${o.size??100}px ${o.f??'Unbounded'}`; ctx.textAlign='center'; ctx.textBaseline='middle'; ctx.letterSpacing=(o.tr??0)+'px';
  if(o.blur>0.4) ctx.filter=`blur(${o.blur.toFixed(1)}px)`;
  ctx.shadowColor=o.glow??'rgba(0,0,0,0.8)'; ctx.shadowBlur=o.gr??30; ctx.fillStyle=o.c??'#fff'; ctx.fillText(s,0,0); ctx.shadowBlur=0; ctx.fillText(s,0,0); ctx.restore();}
function pop(t,t0,t1,size,s,y,o={}){ // title with rise/blur in, out
  const k=eBack(clamp((t-t0)/0.45)), ki=clamp((t-t0)/0.25), ko=t1?sstep(t1-0.3,t1,t):0;
  txt(s,W/2,y+(1-eOut(clamp((t-t0)/0.45)))*50-ko*30,Object.assign({size,a:ki*(1-ko),s:lerp(1.25,1,k),blur:(1-ki)*14+ko*10},o));}
function pill(x,y,w,h,r){ctx.beginPath();ctx.moveTo(x+r,y);ctx.arcTo(x+w,y,x+w,y+h,r);ctx.arcTo(x+w,y+h,x,y+h,r);ctx.arcTo(x,y+h,x,y,r);ctx.arcTo(x,y,x+w,y,r);ctx.closePath();}
const TY=360;

// ---------- frame ----------
function frame(t){
  const [z,px,py,rot]=CAM(t);
  const S0=1000*z;
  let shake=0;
  if(t>=T_ODN&&t<31.2) shake=8*Math.exp(-(t-T_ODN)*2);
  if(t>=31.1&&t<39.0) shake=2.5;
  if(t>=T_OPR&&t<T_OPR+0.5) shake=Math.max(shake,14*Math.exp(-(t-T_OPR)*8));
  const shx=shake*Math.sin(t*67), shy=shake*Math.cos(t*59);
  const cx=W/2+shx-px*S0, cy=900+shy-py*S0;
  // background
  const red=sstep(30.9,31.3,t)*(1-sstep(38.9,39.6,t)), grey=sstep(14.3,14.7,t)*(1-sstep(T_OPR,T_OPR+0.5,t)), gold=win(t,11.7,14.25,0.4);
  const bg=ctx.createRadialGradient(W/2,880,50,W/2,960,1300);
  const c0=red>0?`rgb(${Math.round(lerp(10,46,red))},${Math.round(lerp(22,6,red))},${Math.round(lerp(44,12,red))})`:(gold>0?`rgb(${Math.round(lerp(10,40,gold))},${Math.round(lerp(22,26,gold))},${Math.round(lerp(44,18,gold))})`:'rgb(10,22,44)');
  bg.addColorStop(0,c0); bg.addColorStop(1,'#020308'); ctx.globalCompositeOperation='source-over'; ctx.globalAlpha=1; ctx.fillStyle=bg; ctx.fillRect(0,0,W,H);
  // far dust (parallax 0.3)
  ctx.globalCompositeOperation='lighter';
  for(const d of DUST){const x=W/2+(d.x-px*d.d)*W*0.9+Math.sin(t*0.2+d.y*5)*10, y=960+(d.y-py*d.d-t*0.01*d.d)*H*0.55; const yy=((y%H)+H)%H;
    ctx.globalAlpha=0.25+0.25*Math.sin(t*1.3+d.x*20); ctx.drawImage(SPR.grey,x-d.s*4,yy-d.s*4,d.s*8,d.s*8);}
  // brain transform
  ctx.save(); ctx.translate(cx,cy); ctx.rotate(rot); ctx.scale(S0,S0);
  const intro=sstep(0.0,0.7,t);
  // outline + gyri
  ctx.globalCompositeOperation='lighter';
  const lc=red>0.5?'rgba(255,90,80,':(grey>0.5?'rgba(140,155,180,':(gold>0.5?'rgba(255,200,120,':'rgba(110,200,255,'));
  ctx.lineJoin='round'; ctx.lineCap='round';
  for(const [w,a] of [[0.016,0.06],[0.006,0.18],[0.0025,0.6]]){ctx.strokeStyle=lc+(a*intro)+')';ctx.lineWidth=w;
    for(const O of [OUT1,OUT2]){ctx.beginPath();O.forEach((p,i)=>i?ctx.lineTo(p[0],p[1]):ctx.moveTo(p[0],p[1]));ctx.stroke();}
    ctx.beginPath(); ctx.moveTo(0.075,0.15); ctx.lineTo(0.135,0.40); ctx.moveTo(0.165,0.17); ctx.lineTo(0.205,0.38); ctx.stroke();}
  ctx.strokeStyle=lc+(0.13*intro)+')'; ctx.lineWidth=0.0035;
  for(const g of GYRI){ctx.beginPath();g.forEach((p,i)=>i?ctx.lineTo(p[0],p[1]):ctx.moveTo(p[0],p[1]));ctx.stroke();}
  ctx.restore();
  // neurons & edges in screen space
  const A=N.map(n=>act(n,t));
  const sp=n=>{const c=Math.cos(rot),s=Math.sin(rot);return [cx+(n.x*c-n.y*s)*S0, cy+(n.x*s+n.y*c)*S0];};
  const P=N.map(sp);
  ctx.lineWidth=1.6;
  for(const e of E){const la=A[e.a.id][0], lb=A[e.b.id][0]; const a=Math.min(la,lb)*intro; if(a<0.08) continue;
    const pa=P[e.a.id], pb=P[e.b.id]; const k=A[e.a.id][1];
    const col=k==='red'?'255,90,80':(k==='gold'?'255,200,110':(k==='grey'?'140,155,180':(k==='teal'?'110,255,210':(k==='white'?'230,240,255':'110,210,255'))));
    ctx.strokeStyle=`rgba(${col},${(a*0.35).toFixed(3)})`; ctx.beginPath(); ctx.moveTo(pa[0],pa[1]); ctx.lineTo(pb[0],pb[1]); ctx.stroke();
    if(a>0.35){const f=(t*e.sp*1.2+e.ph)%1; const x=lerp(pa[0],pb[0],f), y=lerp(pa[1],pb[1],f); const s=6+10*a; ctx.globalAlpha=a; ctx.drawImage(SPR[k],x-s,y-s,2*s,2*s); ctx.globalAlpha=1;}
  }
  N.forEach((n,i)=>{const [l,k]=A[i]; const a=clamp(l)*intro; if(a<0.02) return; const s=(9+30*a)*n.sz*(S0/1000);
    ctx.globalAlpha=Math.min(1,0.35+a); ctx.drawImage(SPR[k],P[i][0]-s,P[i][1]-s,2*s,2*s);});
  ctx.globalAlpha=1;
  // overload bloom (steady, not strobing)
  const ov=sstep(T_ODN-0.6,T_ODN+0.2,t)*(1-sstep(31.0,31.4,t));
  if(ov>0){const g=ctx.createRadialGradient(cx,cy,10,cx,cy,800);g.addColorStop(0,`rgba(230,240,255,${0.25*ov})`);g.addColorStop(1,'rgba(230,240,255,0)');ctx.fillStyle=g;ctx.fillRect(0,0,W,H);}
  // foreground bokeh (parallax 1.6+, DOF)
  for(const f of FG){const x=W/2+(f.x-px*f.d*0.6)*W+Math.sin(t*0.3+f.y)*30, y=960+(f.y-py*f.d*0.6)*H*0.6-t*6*f.d; const yy=((y%(H+400))+H+400)%(H+400)-200;
    ctx.globalAlpha=0.5; ctx.drawImage(BOKEH,x-f.s,yy-f.s,f.s*2,f.s*2);}
  ctx.globalAlpha=1; ctx.globalCompositeOperation='source-over';
  // red tint vignette + general vignette
  const v=ctx.createRadialGradient(W/2,H/2,H*0.3,W/2,H/2,H*0.75); v.addColorStop(0,'rgba(0,0,0,0)'); v.addColorStop(1,'rgba(0,0,0,0.75)'); ctx.fillStyle=v; ctx.fillRect(0,0,W,H);
  if(red>0){ctx.fillStyle=`rgba(120,0,0,${0.12*red*(0.8+0.2*Math.sin(t*TAU*1.1))})`;ctx.fillRect(0,0,W,H);}
  // ---------- titles ----------
  // S1
  txt('ТВОЙ МОЗГ',W/2,TY-130,{size:40,w:700,f:'Manrope',tr:14,c:'#BFE6FF',a:sstep(0.2,0.5,t)*(1-sstep(4.2,4.5,t))});
  if(t>1.55&&t<4.6){const p=clamp((t-1.65)/2.1); const n=Math.round(100*eIO(p)); const done=p>=1, pul=done?Math.exp(-(t-3.8)*5):0;
    const a=sstep(1.55,1.8,t)*(1-sstep(4.25,4.55,t));
    txt(n+'%',W/2,TY+20,{size:230,c:done?'#FFE3A0':'#E8F6FF',glow:done?'rgba(255,170,60,0.85)':'rgba(90,200,255,0.7)',gr:40+pul*40,a,s:1+pul*0.1});
    ctx.save(); ctx.globalAlpha=a; ctx.fillStyle='rgba(255,255,255,0.12)'; pill(240,TY+170,600,16,8); ctx.fill();
    const g=ctx.createLinearGradient(240,0,840,0); g.addColorStop(0,'#5AD8FF'); g.addColorStop(1,'#FFC15A'); ctx.fillStyle=g; pill(240,TY+170,Math.max(16,600*eIO(p)),16,8); ctx.fill(); ctx.restore();}
  // S2 superpower cards
  const cards=[[5.0,7.55,'ПАМЯТЬ','запоминать всё',[-0.05,0.12]],[7.6,9.8,'РЕШЕНИЯ','мгновенно',[-0.3,-0.1]],[9.85,11.55,'ДЕТАЛИ','замечать мельчайшее',[0.33,-0.06]]];
  for(const [a,b,ti,sub,anc] of cards){const al=win(t,a,b,0.3); if(al<=0) continue; const ax=cx+anc[0]*S0, ay=cy+anc[1]*S0; const k=eBack(clamp((t-a)/0.45));
    const bx=W/2, by=TY+10;
    ctx.save(); ctx.globalAlpha=al; ctx.strokeStyle='rgba(255,210,140,0.8)'; ctx.lineWidth=3; ctx.setLineDash([10,10]); ctx.lineDashOffset=-t*40;
    ctx.beginPath(); ctx.moveTo(ax,ay); ctx.lineTo(lerp(ax,bx,eOut(clamp((t-a)/0.5))),lerp(ay,by+110,eOut(clamp((t-a)/0.5)))); ctx.stroke(); ctx.setLineDash([]);
    ctx.fillStyle='#FFD27A'; ctx.beginPath(); ctx.arc(ax,ay,9,0,TAU); ctx.fill(); ctx.restore();
    ctx.save(); ctx.globalAlpha=al; ctx.translate(bx,by); ctx.scale(k,k); ctx.fillStyle='rgba(12,18,32,0.82)'; pill(-330,-110,660,220,40); ctx.fill(); ctx.strokeStyle='rgba(255,210,140,0.6)'; ctx.lineWidth=2.5; pill(-330,-110,660,220,40); ctx.stroke(); ctx.restore();
    txt(ti,bx,by-25,{size:92,c:'#FFE3B0',glow:'rgba(255,170,60,0.6)',gr:26,a:al,s:k});
    txt(sub,bx,by+60,{size:40,w:700,f:'Manrope',c:'#E6EEF8',a:al*sstep(a+0.2,a+0.5,t),s:k});}
  // S3 genius
  pop(t,11.95,14.25,170,'ГЕНИЙ?',TY+10,{c:'#FFE3A0',glow:'rgba(255,170,60,0.85)',gr:50});
  // S4 fact + 10% myth
  pop(t,14.4,16.6,62,'ИНТЕРЕСНЫЙ ФАКТ',TY,{c:'#DDE6F2',glow:'rgba(0,0,0,0.8)',w:800});
  if(t>16.8&&t<22.0){const a=sstep(16.85,17.2,t)*(1-sstep(21.7,22.0,t));
    txt('МИФ',W/2,TY-140,{size:44,w:800,f:'Manrope',tr:16,c:'#FFB0A8',a});
    txt('10%',W/2,TY+10,{size:240,c:'#E6F2FF',glow:'rgba(90,200,255,0.6)',gr:40,a:a*(1-0.5*sstep(T_OPR,T_OPR+0.2,t))});
    const k=clamp((t-T_OPR)/0.22);
    if(k>0){ctx.save(); ctx.translate(W/2,TY+10); ctx.rotate(-0.16); const s=lerp(2.2,1,eOut(k)); ctx.scale(s,s); ctx.globalAlpha=a*k;
      ctx.strokeStyle='#FF4D4D'; ctx.lineWidth=10; pill(-370,-85,740,170,24); ctx.stroke();
      ctx.font='900 92px Unbounded'; ctx.textAlign='center'; ctx.textBaseline='middle'; ctx.fillStyle='#FF4D4D'; ctx.shadowColor='rgba(255,40,40,0.6)'; ctx.shadowBlur=24; ctx.fillText('ОПРОВЕРГНУТ',0,4); ctx.restore();}}
  // S5
  pop(t,22.3,26.0,74,'РАБОТАЮТ',TY-50,{c:'#E6F6FF',glow:'rgba(90,200,255,0.6)'});
  pop(t,22.55,26.0,74,'ВСЕ ОБЛАСТИ',TY+50,{c:'#8FE3FF',glow:'rgba(90,200,255,0.6)'});
  // S6
  pop(t,27.6,30.95,96,'ВСЕ НЕЙРОНЫ',TY-55,{c:'#FFFFFF',glow:'rgba(160,200,255,0.8)'});
  pop(t,T_ODN-0.05,30.95,96,'СРАЗУ',TY+60,{c:'#FFFFFF',glow:'rgba(0,10,40,0.95)',gr:40});
  // S7 not smarter + overload (glitch slices)
  if(t>31.2&&t<39.1){
    const a1=sstep(T_UMN-0.4,T_UMN-0.1,t)*(1-sstep(33.1,33.4,t));
    const g=(Math.floor(t*12)%5===0)?1:0;
    txt('НЕ УМНЕЕ',W/2+g*8,TY,{size:120,c:'rgba(255,60,60,0.7)',glow:'rgba(0,0,0,0)',a:a1});
    txt('НЕ УМНЕЕ',W/2-g*8,TY,{size:120,c:'rgba(80,220,255,0.6)',glow:'rgba(0,0,0,0)',a:a1});
    txt('НЕ УМНЕЕ',W/2,TY,{size:120,c:'#FFFFFF',glow:'rgba(255,60,60,0.6)',a:a1});
    const a2=sstep(33.4,33.8,t)*(1-sstep(38.8,39.1,t));
    if(a2>0){ctx.save(); ctx.globalAlpha=a2; ctx.translate(W/2,TY-170); const pu=1+0.04*Math.sin(t*TAU*1.1); ctx.scale(pu,pu);
      ctx.strokeStyle='#FF5050'; ctx.lineWidth=8; ctx.lineJoin='round'; ctx.beginPath(); ctx.moveTo(0,-60); ctx.lineTo(62,48); ctx.lineTo(-62,48); ctx.closePath(); ctx.stroke();
      ctx.fillStyle='#FF5050'; ctx.fillRect(-5,-22,10,40); ctx.beginPath(); ctx.arc(0,32,6,0,TAU); ctx.fill(); ctx.restore();
      txt('ПЕРЕГРУЗКА',W/2+(g?-6:0),TY,{size:104,c:'#FFDADA',glow:'rgba(255,50,50,0.8)',gr:36,a:a2});
      txt('серьёзные нарушения работы',W/2,TY+105,{size:42,w:700,f:'Manrope',c:'#FFC0C0',a:a2*sstep(T_NAR-0.2,T_NAR+0.2,t)});}}
  // S8 secret
  pop(t,39.25,43.7,60,'СЕКРЕТ',TY-130,{w:800,f:'Manrope',tr:16,c:'#BFFFE8',glow:'rgba(0,0,0,0.8)'});
  if(t>40.1&&t<43.75){const a=sstep(40.1,40.4,t)*(1-sstep(43.45,43.75,t)); txt('НЕ В 100%',W/2,TY+10,{size:120,c:'#E6FFF6',glow:'rgba(90,255,200,0.6)',a});
    const k=eOut(clamp((t-42.4)/0.4)); if(k>0){ctx.save(); ctx.globalAlpha=a; ctx.strokeStyle='#7DFFD0'; ctx.lineWidth=10; ctx.lineCap='round'; ctx.beginPath(); ctx.moveTo(W/2-60,TY+70); ctx.lineTo(W/2-60+420*k,TY-50); ctx.stroke(); ctx.restore();}}
  pop(t,43.9,48.2,72,'ОН УЖЕ',TY-50,{c:'#E6FFF6',glow:'rgba(90,255,200,0.6)'});
  pop(t,44.9,48.2,92,'УДИВИТЕЛЕН',TY+60,{c:'#7DFFD0',glow:'rgba(90,255,200,0.75)',gr:40});
  // S9 end
  if(t>48.3){const k=clamp((t-48.35)/0.45);
    pop(t,48.35,0,104,'А ТЫ ЗНАЛ',TY-50,{c:'#FFFFFF',glow:'rgba(90,255,200,0.6)'});
    pop(t,48.65,0,104,'ОБ ЭТОМ?',TY+70,{c:'#7DFFD0',glow:'rgba(90,255,200,0.7)'});
    const ca=sstep(49.4,49.7,t); if(ca>0){const s=eBack(clamp((t-49.4)/0.45)); ctx.save(); ctx.globalAlpha=ca; ctx.translate(W/2,1500); ctx.scale(s,s);
      ctx.fillStyle='rgba(255,255,255,0.10)'; pill(-350,-60,700,120,60); ctx.fill(); ctx.strokeStyle='rgba(125,255,208,0.7)'; ctx.lineWidth=2.5; pill(-350,-60,700,120,60); ctx.stroke();
      ctx.translate(-270,0); ctx.fillStyle='#7DFFD0'; pill(-34,-28,68,50,16); ctx.fill(); ctx.beginPath(); ctx.moveTo(-14,20); ctx.lineTo(-22,36); ctx.lineTo(2,20); ctx.fill();
      ctx.fillStyle='#062018'; for(let i=0;i<3;i++){const b=0.5+0.5*Math.sin(t*8-i*0.9); ctx.beginPath(); ctx.arc(-16+i*16,-3-b*3,5,0,TAU); ctx.fill();}
      ctx.font='800 44px Manrope'; ctx.textAlign='left'; ctx.textBaseline='middle'; ctx.fillStyle='#fff'; ctx.fillText('Ответ — в комментариях',60,2); ctx.restore();}}
  drawCaptions(t);
  // film grain-ish dither + fades
  const fade=1-sstep(0,0.35,t)+sstep(DUR-0.6,DUR,t);
  if(fade>0){ctx.fillStyle=`rgba(0,0,0,${clamp(fade)})`; ctx.fillRect(0,0,W,H);}
}
// motion blur on fast camera moves via subframe accumulation
const acc=document.createElement('canvas'); acc.width=W; acc.height=H; const actx=acc.getContext('2d');
window.renderFrame=function(t){
  const fast=(t>4.4&&t<5.4)||(t>11.4&&t<11.9)||(t>47.0&&t<48.6)||(t>=T_OPR&&t<T_OPR+0.3);
  if(!fast){frame(t);return 1;}
  const n=3; actx.clearRect(0,0,W,H);
  for(let i=0;i<n;i++){frame(t+(i/(n-1)-0.5)/FPS*0.8); actx.globalAlpha=1/(i+1); actx.drawImage(cv,0,0);}
  actx.globalAlpha=1; ctx.globalCompositeOperation='source-over'; ctx.globalAlpha=1; ctx.drawImage(acc,0,0); return n;
};
window.grab=q=>cv.toDataURL('image/jpeg',q||0.95);
(async()=>{for(const f of ['900 40px Unbounded','800 40px Manrope','700 40px Manrope']) await document.fonts.load(f,'АБВ абв 100%'); window.ready=true;})();
