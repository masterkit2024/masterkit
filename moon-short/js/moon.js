// "Если Луна исчезнет" — 2D canvas motion piece, deterministic renderFrame(t)
const W=1080,H=1920,FPS=60,DUR=54.0;
const cv=document.getElementById('out'); const ctx=cv.getContext('2d');
const clamp=(x,a=0,b=1)=>Math.min(b,Math.max(a,x)), lerp=(a,b,t)=>a+(b-a)*t;
const sstep=(a,b,x)=>{const t=clamp((x-a)/(b-a));return t*t*(3-2*t);};
const eOut=t=>1-Math.pow(1-clamp(t),3), eIO=t=>{t=clamp(t);return t<.5?4*t*t*t:1-Math.pow(-2*t+2,3)/2;};
const eBack=t=>{t=clamp(t);const c=1.70158;return 1+(c+1)*Math.pow(t-1,3)+c*Math.pow(t-1,2);};
const win=(t,a,b,f=0.35)=>sstep(a,a+f,t)*(1-sstep(b-f,b,t));
const TAU=Math.PI*2;
function hash(n){let x=Math.sin(n*127.1+311.7)*43758.5453;return x-Math.floor(x);}
let seed=4242; const rnd=()=>{seed=(seed*16807)%2147483647;return seed/2147483647;};

// ---------- captions ----------
const CHUNKS=[
 [0.21,3.45,"Представь, что однажды Луна внезапно исчезла!"],[4.04,5.64,"Что произойдёт с нашей планетой?"],
 [6.50,9.81,"Первое, что мы заметим, — ночи станут намного темнее."],[10.19,12.90,"Ведь Луна больше не будет отражать солнечный свет."],
 [13.71,15.12,"Но это только начало!"],[15.61,17.50,"Океаны изменятся:"],[18.01,20.73,"приливы и отливы станут значительно слабее,"],
 [21.03,24.88,"ведь именно Луна оказывает на них сильное гравитационное воздействие."],[25.64,27.48,"Но есть кое-что ещё интереснее!"],
 [28.06,31.40,"Луна помогает стабилизировать наклон земной оси."],[31.83,36.40,"Без неё климат Земли мог бы сильнее меняться на протяжении миллионов лет."],
 [37.15,40.78,"А ещё человечество потеряло бы привычный спутник, который"],[40.98,45.08,"тысячи лет вдохновлял учёных, путешественников и мечтателей."],
 [45.78,48.85,"Оказывается, Луна гораздо важнее, чем кажется!"],[49.65,52.34,"Мир намного удивительнее, чем кажется!"],
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
const KEY=/^(Луна|исчезла|планетой|темнее|свет|начало|Океаны|приливы|отливы|слабее|гравитационное|интереснее|наклон|оси|климат|миллионов|спутник|учёных|путешественников|мечтателей|важнее|удивительнее)$/i;
function accent(t){ if(t<13.5) return '#FFE6A8'; if(t<25.5) return '#7FD8FF'; if(t<37) return '#FFB27A'; return '#FFE6A8'; }
function drawCaptions(t){
  if(t>52.6) return;
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


// ---------- key times ----------
const T_ISC=wt('исчезла',0), T_TEM=wt('темнее',6), T_OTR=wt('отражать',10), T_SLB=wt('слабее',18), T_GRV=wt('гравитационное',21),
      T_NKL=wt('наклон',28), T_KLM=wt('климат',31), T_UCH=wt('учёных',40), T_PTS=wt('путешественников',40), T_MCH=wt('мечтателей',40), T_VAZ=wt('важнее',45);

// ---------- primitives ----------
const CONT=Array.from({length:14},(_,i)=>({u:hash(i*3+1),v:hash(i*3+2)*1.4-0.7,r:0.18+hash(i*3+3)*0.3,c:i%3===0?'#B79A5E':'#3E8F57'}));
function earth(x,y,R,t,o={}){
  const spin=t*(o.spin??0.05), lit=o.lit??1;
  ctx.save();
  // atmosphere glow
  const ag=ctx.createRadialGradient(x,y,R*0.9,x,y,R*1.35); ag.addColorStop(0,'rgba(110,180,255,0.45)'); ag.addColorStop(1,'rgba(110,180,255,0)'); ctx.fillStyle=ag; ctx.beginPath(); ctx.arc(x,y,R*1.35,0,TAU); ctx.fill();
  ctx.beginPath(); ctx.arc(x,y,R,0,TAU); ctx.clip();
  const og=ctx.createRadialGradient(x-R*0.35,y-R*0.35,R*0.1,x,y,R); og.addColorStop(0,'#3FA2E8'); og.addColorStop(1,'#123E86'); ctx.fillStyle=og; ctx.fillRect(x-R,y-R,2*R,2*R);
  for(const c of CONT){ for(let k=-1;k<=1;k++){ const u=((c.u+spin)%1+1)%1+k; const px=x+(u*2-1)*R*1.1, py=y+c.v*R; const sq=Math.cos((u*2-1)*Math.PI/2); if(sq<=0) continue;
      ctx.fillStyle=c.c; ctx.beginPath(); ctx.ellipse(px,py,c.r*R*sq,c.r*R*0.7,0,0,TAU); ctx.fill(); } }
  for(let i=0;i<6;i++){const u=((hash(i+40)+spin*1.4)%1+1)%1; const px=x+(u*2-1)*R, py=y+(hash(i+50)*1.6-0.8)*R; ctx.fillStyle='rgba(255,255,255,0.55)'; ctx.beginPath(); ctx.ellipse(px,py,R*0.35*Math.cos((u*2-1)*Math.PI/2),R*0.06,0.1,0,TAU); ctx.fill();}
  // terminator (light from the left)
  const sg=ctx.createLinearGradient(x-R,y,x+R,y); sg.addColorStop(0,'rgba(0,0,10,0)'); sg.addColorStop(0.55,`rgba(0,0,15,${0.15+0.4*(1-lit)})`); sg.addColorStop(1,`rgba(0,0,15,${0.8})`); ctx.fillStyle=sg; ctx.fillRect(x-R,y-R,2*R,2*R);
  ctx.restore();
  ctx.save(); ctx.globalCompositeOperation='lighter'; ctx.strokeStyle='rgba(150,210,255,0.6)'; ctx.lineWidth=3; ctx.beginPath(); ctx.arc(x,y,R,Math.PI*0.6,Math.PI*1.4); ctx.stroke(); ctx.restore();
}
const CRAT=Array.from({length:16},(_,i)=>({a:hash(i+70)*TAU,d:Math.sqrt(hash(i+80))*0.8,r:0.06+hash(i+90)*0.14}));
function moonDisc(x,y,R,o={}){ const a=o.a??1; if(a<=0.01) return; ctx.save(); ctx.globalAlpha=a;
  const gl=ctx.createRadialGradient(x,y,R*0.8,x,y,R*(o.glow??2.2)); gl.addColorStop(0,'rgba(255,245,220,0.35)'); gl.addColorStop(1,'rgba(255,245,220,0)'); ctx.fillStyle=gl; ctx.beginPath(); ctx.arc(x,y,R*(o.glow??2.2),0,TAU); ctx.fill();
  ctx.beginPath(); ctx.arc(x,y,R,0,TAU); ctx.save(); ctx.clip();
  const mg=ctx.createRadialGradient(x-R*0.3,y-R*0.3,R*0.1,x,y,R); mg.addColorStop(0,'#F6F1E6'); mg.addColorStop(1,'#A9A49A'); ctx.fillStyle=mg; ctx.fillRect(x-R,y-R,2*R,2*R);
  for(const c of CRAT){ctx.fillStyle='rgba(120,115,105,0.35)'; ctx.beginPath(); ctx.arc(x+Math.cos(c.a)*c.d*R,y+Math.sin(c.a)*c.d*R,c.r*R,0,TAU); ctx.fill();}
  if(o.shade){const sg=ctx.createLinearGradient(x-R,y,x+R,y); sg.addColorStop(0,'rgba(0,0,10,0)'); sg.addColorStop(0.6,'rgba(0,0,10,0.2)'); sg.addColorStop(1,'rgba(0,0,10,0.75)'); ctx.fillStyle=sg; ctx.fillRect(x-R,y-R,2*R,2*R);}
  ctx.restore(); ctx.restore();}
function space(t,tint=0){
  const g=ctx.createLinearGradient(0,0,0,H); g.addColorStop(0,'#03050F'); g.addColorStop(0.6,tint?'#0B1530':'#08102A'); g.addColorStop(1,'#020308'); ctx.fillStyle=g; ctx.fillRect(0,0,W,H);
  ctx.globalCompositeOperation='lighter';
  for(const s of STARS){const tw=0.55+0.45*Math.sin(t*1.7+s.ph); const y=(s.y-t*5*s.d+H*4)%H; ctx.globalAlpha=tw*0.85; const z=s.s*5; ctx.drawImage(SPR.star,s.x-z,y-z,2*z,2*z);}
  // milky haze
  ctx.globalAlpha=0.5; const mg=ctx.createLinearGradient(0,H*0.2,W,H*0.7); mg.addColorStop(0,'rgba(80,60,140,0)'); mg.addColorStop(0.5,'rgba(110,90,170,0.12)'); mg.addColorStop(1,'rgba(80,60,140,0)'); ctx.fillStyle=mg; ctx.fillRect(0,0,W,H);
  ctx.globalAlpha=1; ctx.globalCompositeOperation='source-over';
}
function burst(x,y,t,t0,col='gold'){const k=clamp((t-t0)/1.2); if(k<=0||k>=1) return; ctx.save(); ctx.globalCompositeOperation='lighter';
  ctx.strokeStyle=`rgba(255,240,210,${0.7*(1-k)})`; ctx.lineWidth=6*(1-k)+1; ctx.beginPath(); ctx.arc(x,y,20+eOut(k)*260,0,TAU); ctx.stroke();
  for(let i=0;i<60;i++){const a=hash(i+300)*TAU, d=eOut(k)*(80+260*hash(i+310)); ctx.globalAlpha=(1-k); const s=6+10*hash(i+320); ctx.drawImage(SPR[col],x+Math.cos(a)*d-s,y+Math.sin(a)*d-s,2*s,2*s);} ctx.restore();}

// ---------- scenes ----------
function sceneOrbit(t){ // 0–6.2
  space(t);
  const z=lerp(1,1.25,eIO(clamp((t-3.8)/2.2)));
  const ex=540, ey=930, R=210*z;
  const ang=t*0.9+0.6, mx=ex+Math.cos(ang)*380*z, my=ey+Math.sin(ang)*120*z, front=Math.sin(ang)>0;
  const gone=sstep(T_ISC-0.05,T_ISC+0.15,t);
  // orbit path
  ctx.save(); ctx.strokeStyle=`rgba(220,230,255,${0.35*(1-gone*0.6)})`; ctx.lineWidth=2; if(gone>0.5){ctx.setLineDash([14,14]);} ctx.beginPath(); ctx.ellipse(ex,ey,380*z,120*z,0,0,TAU); ctx.stroke(); ctx.restore();
  const mR=58*z*(1-gone);
  if(!front) moonDisc(mx,my,mR,{a:1-gone,shade:true});
  earth(ex,ey,R,t);
  if(front) moonDisc(mx,my,mR,{a:1-gone,shade:true});
  // freeze moon position at vanish for burst
  const va=T_ISC*0.9+0.6; burst(ex+Math.cos(va)*380,ey+Math.sin(va)*120,t,T_ISC);
  if(gone>0.5) txt('?',ex+Math.cos(va)*380*z,ey+Math.sin(va)*120*z,{size:90,c:'#FFE6A8',glow:'rgba(255,200,110,0.8)',a:sstep(T_ISC+0.3,T_ISC+0.7,t)*(1-sstep(5.8,6.2,t))});
  txt('А ЕСЛИ',W/2,TY-60,{size:40,w:800,f:'Manrope',tr:16,c:'#CFE0FF',a:sstep(0.2,0.5,t)*(1-sstep(3.6,3.9,t))});
  pop(t,0.45,3.9,92,'ЛУНА',TY+10,{c:'#FFF1D0',glow:'rgba(255,220,150,0.8)'});
  if(t>T_ISC-0.1&&t<3.9){ if(t<T_ISC+0.05) pop(t,T_ISC-0.1,0,64,'ИСЧЕЗНЕТ?',TY+130,{c:'#FFE6A8',glow:'rgba(255,200,110,0.8)'}); else dissolveText('ИСЧЕЗНЕТ?',W/2,TY+130,64,t,T_ISC+0.4,'#FFE6A8','rgba(255,200,110,0.8)'); }
  pop(t,4.05,6.2,70,'ЧТО БУДЕТ',TY-40,{c:'#FFFFFF',glow:'rgba(110,180,255,0.7)'});
  pop(t,4.3,6.2,70,'С ЗЕМЛЁЙ?',TY+50,{c:'#8FD3FF',glow:'rgba(110,180,255,0.8)'});
}
function hills(t,dark){ // layered night landscape
  const layers=[[1180,'#1B2A4A',0.25,60],[1300,'#121D36',0.45,90],[1430,'#0A1226',0.7,120]];
  layers.forEach(([y0,c,par,amp],li)=>{ctx.fillStyle=c; ctx.beginPath(); ctx.moveTo(0,H);
    for(let x=0;x<=W;x+=20){const xx=x+t*12*par; const y=y0-amp*(0.5+0.5*Math.sin(xx*0.006+li*2))-amp*0.4*Math.sin(xx*0.017+li);ctx.lineTo(x,y);} ctx.lineTo(W,H); ctx.fill();});
  // lake
  ctx.fillStyle='#0A1430'; ctx.fillRect(0,1560,W,H-1560);
}
function sceneNight(t){ // 6.2–13.5
  const g=ctx.createLinearGradient(0,0,0,H); g.addColorStop(0,'#0A1638'); g.addColorStop(0.7,'#1C2E5C'); g.addColorStop(1,'#0B1430'); ctx.fillStyle=g; ctx.fillRect(0,0,W,H);
  ctx.globalCompositeOperation='lighter'; for(const s of STARS){ctx.globalAlpha=(0.35+0.3*Math.sin(t*1.7+s.ph)); const z=s.s*4; ctx.drawImage(SPR.star,s.x-z,(s.y*0.7)-z,2*z,2*z);} ctx.globalAlpha=1; ctx.globalCompositeOperation='source-over';
  moonDisc(780,560,90,{glow:3.2});
  hills(t);
  // moon path on the lake
  ctx.save(); ctx.globalCompositeOperation='lighter'; for(let i=0;i<22;i++){const y=1580+i*16, w=40+i*9+Math.sin(t*3+i)*12; ctx.fillStyle=`rgba(255,240,210,${0.35-i*0.012})`; ctx.fillRect(780-w/2+Math.sin(t*2+i*0.7)*10,y,w,4);} ctx.restore();
  // moonlight wash
  ctx.save(); ctx.globalCompositeOperation='lighter'; const mw=ctx.createRadialGradient(780,560,50,780,700,1300); mw.addColorStop(0,'rgba(170,190,230,0.22)'); mw.addColorStop(1,'rgba(170,190,230,0)'); ctx.fillStyle=mw; ctx.fillRect(0,0,W,H); ctx.restore();
  // wipe: right side loses the moon
  const wx=lerp(W+20,W*0.5,eIO(clamp((t-T_TEM+0.5)/1.0)));
  if(wx<W){ctx.save(); ctx.beginPath(); ctx.rect(wx,0,W-wx,H); ctx.clip(); ctx.fillStyle='rgba(1,2,8,0.88)'; ctx.fillRect(0,0,W,H);
    ctx.globalCompositeOperation='lighter'; for(const s of STARS){ctx.globalAlpha=0.5*(0.5+0.5*Math.sin(t*1.7+s.ph)); const z=s.s*4; ctx.drawImage(SPR.star,s.x-z,(s.y*0.7)-z,2*z,2*z);}
    ctx.restore();
    ctx.save(); ctx.strokeStyle='rgba(255,255,255,0.8)'; ctx.lineWidth=3; ctx.beginPath(); ctx.moveTo(wx,0); ctx.lineTo(wx,H); ctx.stroke(); ctx.restore();
    const la=sstep(T_TEM,T_TEM+0.4,t)*(1-sstep(10.0,10.3,t));
    txt('С ЛУНОЙ',270,880,{size:44,w:800,f:'Manrope',tr:6,c:'#FFF1D0',a:la}); txt('БЕЗ ЛУНЫ',810,880,{size:44,w:800,f:'Manrope',tr:6,c:'#9FB2D8',a:la});}
  pop(t,6.6,10.0,84,'НОЧИ',TY-50,{c:'#FFFFFF',glow:'rgba(110,150,255,0.6)'});
  pop(t,6.9,10.0,84,'ТЕМНЕЕ',TY+50,{c:'#9FB2D8',glow:'rgba(0,0,0,0.9)'});
  // reflection diagram
  const da=sstep(10.2,10.6,t)*(1-sstep(13.1,13.45,t));
  if(da>0){ctx.save(); ctx.globalAlpha=da; ctx.fillStyle='rgba(6,10,26,0.75)'; pill(90,150,900,330,40); ctx.fill(); ctx.strokeStyle='rgba(255,230,170,0.5)'; ctx.lineWidth=2; pill(90,150,900,330,40); ctx.stroke();
    const sx=220, mx=540, ex=860, y=330;
    const sg=ctx.createRadialGradient(sx,y,10,sx,y,90); sg.addColorStop(0,'#FFF6D0'); sg.addColorStop(0.5,'#FFC14D'); sg.addColorStop(1,'rgba(255,150,40,0)'); ctx.fillStyle=sg; ctx.beginPath(); ctx.arc(sx,y,90,0,TAU); ctx.fill();
    const k=clamp((t-T_OTR+0.2)/1.2);
    ctx.strokeStyle='rgba(255,210,120,0.9)'; ctx.lineWidth=5; ctx.setLineDash([16,12]); ctx.lineDashOffset=-t*60;
    ctx.beginPath(); ctx.moveTo(sx+70,y); ctx.lineTo(lerp(sx+70,mx-50,clamp(k*2)),y); ctx.stroke();
    if(k>0.5){ctx.beginPath(); ctx.moveTo(mx+50,y); ctx.lineTo(lerp(mx+50,ex-50,clamp(k*2-1)),y); ctx.stroke();} ctx.setLineDash([]); ctx.restore();
    moonDisc(mx,y,46,{a:da,glow:1.6}); earth(ex,y,50,t);
    txt('Солнце',sx,y+115,{size:30,w:700,f:'Manrope',c:'#FFE1A0',a:da}); txt('Луна',mx,y+115,{size:30,w:700,f:'Manrope',c:'#EDEDED',a:da}); txt('Земля',ex,y+115,{size:30,w:700,f:'Manrope',c:'#8FD3FF',a:da});
    txt('ЛУНА ЛИШЬ ОТРАЖАЕТ СВЕТ СОЛНЦА',W/2,555,{size:34,w:800,f:'Manrope',tr:3,c:'#FFF1D0',a:da*sstep(10.6,11.0,t)});}
}
function sceneBegin(t){ // 13.5–15.5
  space(t);
  const k=clamp((t-13.55)/1.9); ctx.save(); ctx.globalCompositeOperation='lighter';
  for(let i=0;i<70;i++){const a=hash(i+500)*TAU, d=((hash(i+510)+k*0.8)%1)*900; const s=2+d/120; ctx.globalAlpha=0.6*(d/900); ctx.drawImage(SPR.star,540+Math.cos(a)*d-s*3,960+Math.sin(a)*d-s*3,s*6,s*6);} ctx.restore();
  pop(t,13.7,15.5,62,'НО ЭТО',830,{w:800,f:'Manrope',tr:12,c:'#CFE0FF'});
  pop(t,13.95,15.5,110,'ТОЛЬКО',940,{c:'#FFFFFF',glow:'rgba(110,180,255,0.7)'});
  pop(t,14.2,15.5,110,'НАЧАЛО',1070,{c:'#8FD3FF',glow:'rgba(110,180,255,0.8)'});
}
function sceneTide(t){ // 15.5–25.6
  if(t<21.0){
    const g=ctx.createLinearGradient(0,0,0,H); g.addColorStop(0,'#0B1738'); g.addColorStop(0.55,'#1E3D78'); g.addColorStop(1,'#0B1738'); ctx.fillStyle=g; ctx.fillRect(0,0,W,H);
    const moonA=1-sstep(T_SLB-0.6,T_SLB,t); moonDisc(820,520,70,{a:0.25+0.75*moonA,glow:2.4});
    if(moonA<0.9){ctx.save(); ctx.globalAlpha=1-moonA; ctx.strokeStyle='rgba(255,255,255,0.6)'; ctx.setLineDash([10,10]); ctx.lineWidth=3; ctx.beginPath(); ctx.arc(820,520,70,0,TAU); ctx.stroke(); ctx.restore();}
    const amp=lerp(150,60,sstep(T_SLB-0.6,T_SLB+0.4,t)), level=1250+amp*Math.sin(t*TAU/2.6);
    // beach
    ctx.fillStyle='#C8A574'; ctx.beginPath(); ctx.moveTo(0,1560); ctx.lineTo(W,1020); ctx.lineTo(W,H); ctx.lineTo(0,H); ctx.fill();
    ctx.fillStyle='rgba(0,0,0,0.25)'; ctx.beginPath(); ctx.moveTo(0,1600); ctx.lineTo(W,1060); ctx.lineTo(W,H); ctx.lineTo(0,H); ctx.fill();
    // water
    const wg=ctx.createLinearGradient(0,level,0,H); wg.addColorStop(0,'rgba(70,170,230,0.92)'); wg.addColorStop(1,'rgba(10,40,100,0.98)'); ctx.fillStyle=wg; ctx.beginPath(); ctx.moveTo(0,H);
    for(let x=0;x<=W;x+=12) ctx.lineTo(x,level+10*Math.sin(x*0.02+t*3)+6*Math.sin(x*0.05-t*4)); ctx.lineTo(W,H); ctx.fill();
    ctx.strokeStyle='rgba(255,255,255,0.7)'; ctx.lineWidth=4; ctx.beginPath(); for(let x=0;x<=W;x+=12){const y=level+10*Math.sin(x*0.02+t*3)+6*Math.sin(x*0.05-t*4); x?ctx.lineTo(x,y):ctx.moveTo(x,y);} ctx.stroke();
    // gauge
    const gx=930; ctx.save(); ctx.strokeStyle='rgba(255,255,255,0.8)'; ctx.lineWidth=3; ctx.beginPath(); ctx.moveTo(gx,1020); ctx.lineTo(gx,1480); ctx.stroke();
    for(let y=1040;y<=1460;y+=40){ctx.beginPath(); ctx.moveTo(gx,y); ctx.lineTo(gx+(y%80===0?26:14),y); ctx.stroke();}
    ctx.fillStyle='rgba(255,210,120,0.35)'; ctx.fillRect(gx-34,1250-amp,26,amp*2); ctx.fillStyle='#FFD27A'; ctx.beginPath(); ctx.arc(gx-21,level,10,0,TAU); ctx.fill(); ctx.restore();
    pop(t,15.7,18.0,96,'ОКЕАНЫ',TY,{c:'#FFFFFF',glow:'rgba(80,180,255,0.8)'});
    pop(t,18.1,21.0,70,'ПРИЛИВЫ',TY-50,{c:'#FFFFFF',glow:'rgba(80,180,255,0.8)'});
    pop(t,T_SLB-0.1,21.0,70,'СЛАБЕЕ',TY+50,{c:'#7FD8FF',glow:'rgba(80,180,255,0.8)'});
  } else {
    space(t);
    const ex=540, ey=1000, R=200;
    const moonA=1-sstep(23.4,24.2,t), bulge=lerp(1.0,0.45,sstep(23.4,24.4,t));
    const mx=150, my=1000;
    // tidal bulge (water envelope stretched toward the moon)
    ctx.save(); ctx.globalCompositeOperation='lighter'; const bg=ctx.createRadialGradient(ex,ey,R,ex,ey,R+90*bulge); bg.addColorStop(0,'rgba(80,180,255,0.55)'); bg.addColorStop(1,'rgba(80,180,255,0.05)');
    ctx.fillStyle=bg; ctx.beginPath(); ctx.ellipse(ex,ey,R+90*bulge,R+12,0,0,TAU); ctx.fill(); ctx.restore();
    earth(ex,ey,R,t,{spin:0.03});
    moonDisc(mx,my,55,{a:moonA,glow:2});
    if(moonA<0.95){ctx.save(); ctx.globalAlpha=(1-moonA)*0.8; ctx.strokeStyle='rgba(255,255,255,0.6)'; ctx.setLineDash([10,10]); ctx.lineWidth=3; ctx.beginPath(); ctx.arc(mx,my,55,0,TAU); ctx.stroke(); ctx.restore();}
    // gravity arrows
    const ga=sstep(21.2,21.6,t)*moonA; ctx.save(); ctx.globalAlpha=ga; ctx.strokeStyle='#FFD27A'; ctx.fillStyle='#FFD27A'; ctx.lineWidth=6;
    for(const dy of [-120,0,120]){const x0=ex-R-60, x1=mx+80+Math.sin(t*4+dy)*6; ctx.beginPath(); ctx.moveTo(x0,ey+dy*0.6); ctx.lineTo(x1,ey+dy*0.25); ctx.stroke(); ctx.beginPath(); ctx.moveTo(x1,ey+dy*0.25); ctx.lineTo(x1+22,ey+dy*0.25-12); ctx.lineTo(x1+22,ey+dy*0.25+12); ctx.fill();} ctx.restore();
    pop(t,21.2,25.5,70,'ГРАВИТАЦИЯ',TY-50,{c:'#FFE6A8',glow:'rgba(255,200,110,0.8)'});
    pop(t,21.5,25.5,70,'ЛУНЫ',TY+50,{c:'#FFFFFF',glow:'rgba(255,200,110,0.6)'});
    txt('водяной «горб» тянется к Луне',W/2,TY+150,{size:38,w:700,f:'Manrope',c:'#CFE6FF',a:sstep(21.8,22.2,t)*(1-sstep(23.3,23.6,t))});
    txt('без Луны — только Солнце',W/2,TY+150,{size:38,w:700,f:'Manrope',c:'#CFE6FF',a:sstep(23.8,24.2,t)*(1-sstep(25.2,25.5,t))});
  }
}
function sceneMore(t){ space(t); // 25.5–27.8
  pop(t,25.7,27.8,64,'НО ЕСТЬ',860,{w:800,f:'Manrope',tr:12,c:'#FFD7B8'});
  pop(t,25.95,27.8,100,'КОЕ-ЧТО',980,{c:'#FFFFFF',glow:'rgba(255,170,100,0.7)'});
  pop(t,26.2,27.8,84,'ИНТЕРЕСНЕЕ',1100,{c:'#FFB27A',glow:'rgba(255,150,80,0.8)'});}
function sceneAxis(t){ // 27.8–37.0
  space(t);
  const ex=540, ey=980, R=230;
  const wob=sstep(T_KLM-0.2,T_KLM+2.5,t);
  const tilt=(23.4+wob*(10*Math.sin((t-T_KLM)*2.2)+6*Math.sin((t-T_KLM)*3.7+1)))*Math.PI/180;
  const moonA=1-sstep(T_KLM-0.6,T_KLM,t);
  const ang=t*1.1, mx=ex+Math.cos(ang)*390, my=ey+Math.sin(ang)*110, front=Math.sin(ang)>0;
  if(!front) moonDisc(mx,my,50,{a:moonA,shade:true});
  earth(ex,ey,R,t,{spin:0.08});
  if(front) moonDisc(mx,my,50,{a:moonA,shade:true});
  // axis
  const ax=Math.sin(tilt), ay=-Math.cos(tilt);
  ctx.save(); ctx.strokeStyle=wob>0.3?'#FF9C7A':'#FFFFFF'; ctx.lineWidth=5; ctx.setLineDash([18,12]); ctx.beginPath(); ctx.moveTo(ex-ax*(R+150),ey-ay*(R+150)); ctx.lineTo(ex+ax*(R+150),ey+ay*(R+150)); ctx.stroke(); ctx.setLineDash([]);
  ctx.strokeStyle='rgba(255,255,255,0.35)'; ctx.lineWidth=2; ctx.beginPath(); ctx.moveTo(ex,ey-R-170); ctx.lineTo(ex,ey+R+170); ctx.stroke();
  ctx.strokeStyle='#FFD27A'; ctx.lineWidth=4; ctx.beginPath(); ctx.arc(ex,ey,R+110,-Math.PI/2,-Math.PI/2+tilt,tilt<0); ctx.stroke(); ctx.restore();
  const deg=(tilt*180/Math.PI); txt(deg.toFixed(1).replace('.',',')+'°',ex+150,ey-R-150,{size:52,c:wob>0.3?'#FFB27A':'#FFE6A8',glow:'rgba(0,0,0,0.9)',a:sstep(28.1,28.5,t)});
  pop(t,28.1,T_KLM-0.3,72,'НАКЛОН',TY-50,{c:'#FFFFFF',glow:'rgba(255,200,110,0.6)'});
  pop(t,28.35,T_KLM-0.3,72,'ЗЕМНОЙ ОСИ',TY+50,{c:'#FFE6A8',glow:'rgba(255,200,110,0.7)'});
  txt('Луна его стабилизирует',W/2,TY+150,{size:38,w:700,f:'Manrope',c:'#FFF1D0',a:sstep(29.5,29.9,t)*(1-sstep(T_KLM-0.6,T_KLM-0.3,t))});
  pop(t,T_KLM,37.0,80,'КЛИМАТ',TY-50,{c:'#FFFFFF',glow:'rgba(255,150,80,0.7)'});
  pop(t,T_KLM+0.3,37.0,58,'МЕНЯЛСЯ БЫ СИЛЬНЕЕ',TY+45,{c:'#FFB27A',glow:'rgba(255,150,80,0.8)'});
  // climate swing bar + million-year counter
  const ca=sstep(T_KLM+0.5,T_KLM+0.9,t)*(1-sstep(36.6,37.0,t));
  if(ca>0){const bx=190,bw=700,by=1450; ctx.save(); ctx.globalAlpha=ca; const g=ctx.createLinearGradient(bx,0,bx+bw,0); g.addColorStop(0,'#5AB6FF'); g.addColorStop(0.5,'#E8F2FF'); g.addColorStop(1,'#FF7A55'); ctx.fillStyle=g; pill(bx,by,bw,22,11); ctx.fill();
    const p=0.5+0.42*Math.sin((t-T_KLM)*2.6)*wob; ctx.fillStyle='#fff'; ctx.beginPath(); ctx.arc(bx+bw*p,by+11,20,0,TAU); ctx.fill(); ctx.restore();
    txt('холоднее',bx+70,by+70,{size:30,w:700,f:'Manrope',c:'#9FD6FF',a:ca}); txt('теплее',bx+bw-60,by+70,{size:30,w:700,f:'Manrope',c:'#FFB49A',a:ca});
    const my2=Math.floor(clamp((t-T_KLM-0.5)/4)*10); txt(`${my2} млн лет`,W/2,by-60,{size:40,w:800,f:'Manrope',c:'#FFFFFF',a:ca});}
}
// silhouettes
function figTelescope(x,y,s){ctx.save(); ctx.translate(x,y); ctx.scale(s,s); ctx.fillStyle='#03050C'; ctx.strokeStyle='#03050C'; ctx.lineWidth=8; ctx.lineCap='round';
  ctx.beginPath(); ctx.moveTo(0,0); ctx.lineTo(-40,110); ctx.moveTo(0,0); ctx.lineTo(40,110); ctx.moveTo(0,0); ctx.lineTo(0,110); ctx.stroke();
  ctx.save(); ctx.rotate(-0.6); ctx.fillRect(-20,-12,150,24); ctx.restore();
  ctx.beginPath(); ctx.arc(-90,-40,22,0,TAU); ctx.fill(); ctx.fillRect(-110,-18,40,80); ctx.fillRect(-108,60,14,50); ctx.fillRect(-86,60,14,50); ctx.lineWidth=10; ctx.beginPath(); ctx.moveTo(-75,-5); ctx.lineTo(-25,-20); ctx.stroke(); ctx.restore();}
function figShip(x,y,s,t){ctx.save(); ctx.translate(x,y+Math.sin(t*2)*4); ctx.rotate(Math.sin(t*1.6)*0.03); ctx.scale(s,s); ctx.fillStyle='#03050C';
  ctx.beginPath(); ctx.moveTo(-110,0); ctx.lineTo(110,0); ctx.lineTo(80,40); ctx.lineTo(-80,40); ctx.fill(); ctx.fillRect(-4,-170,8,170);
  ctx.beginPath(); ctx.moveTo(6,-160); ctx.quadraticCurveTo(90,-90,6,-20); ctx.fill(); ctx.beginPath(); ctx.moveTo(-6,-150); ctx.quadraticCurveTo(-70,-90,-6,-30); ctx.fill(); ctx.restore();}
function figDreamer(x,y,s){ctx.save(); ctx.translate(x,y); ctx.scale(s,s); ctx.fillStyle='#03050C';
  ctx.beginPath(); ctx.arc(0,-95,24,0,TAU); ctx.fill(); ctx.beginPath(); ctx.ellipse(0,-30,34,50,0.1,0,TAU); ctx.fill(); ctx.beginPath(); ctx.ellipse(30,10,50,16,0.2,0,TAU); ctx.fill(); ctx.restore();}
function sceneHumans(t){ // 37.0–45.6
  const g=ctx.createLinearGradient(0,0,0,H); g.addColorStop(0,'#081430'); g.addColorStop(0.75,'#1E3366'); g.addColorStop(1,'#0B1430'); ctx.fillStyle=g; ctx.fillRect(0,0,W,H);
  ctx.globalCompositeOperation='lighter'; for(const s of STARS){ctx.globalAlpha=(0.4+0.3*Math.sin(t*1.7+s.ph)); const z=s.s*4; ctx.drawImage(SPR.star,s.x-z,(s.y*0.75)-z,2*z,2*z);} ctx.globalAlpha=1; ctx.globalCompositeOperation='source-over';
  const lost=sstep(38.2,39.2,t)*(1-sstep(45.4,45.6,t));
  const mx=540, my=640;
  moonDisc(mx,my,120,{a:1-lost,glow:3});
  if(lost>0){ctx.save(); ctx.globalAlpha=lost; ctx.strokeStyle='rgba(255,255,255,0.65)'; ctx.lineWidth=4; ctx.setLineDash([16,14]); ctx.lineDashOffset=t*10; ctx.beginPath(); ctx.arc(mx,my,120,0,TAU); ctx.stroke(); ctx.restore();}
  // ground + sea
  ctx.fillStyle='#050A18'; ctx.fillRect(0,1580,W,H-1580);
  ctx.fillStyle='#03050C'; ctx.beginPath(); ctx.moveTo(0,1620); ctx.quadraticCurveTo(220,1460,440,1600); ctx.lineTo(440,H); ctx.lineTo(0,H); ctx.fill();
  ctx.beginPath(); ctx.moveTo(700,1620); ctx.quadraticCurveTo(900,1490,W,1550); ctx.lineTo(W,H); ctx.lineTo(700,H); ctx.fill();
  const a1=sstep(T_UCH-0.2,T_UCH+0.3,t), a2=sstep(T_PTS-0.2,T_PTS+0.3,t), a3=sstep(T_MCH-0.2,T_MCH+0.3,t);
  ctx.save(); ctx.globalAlpha=a1; figTelescope(250,1420,1.0); ctx.restore();
  ctx.save(); ctx.globalAlpha=a2; figShip(580,1590,0.9,t); ctx.restore();
  ctx.save(); ctx.globalAlpha=a3; figDreamer(900,1525,1.0); ctx.restore();
  const lab=(s,x,a,c)=>txt(s,x,1720,{size:27,w:800,f:'Manrope',tr:3,c,a:a*(1-sstep(45.2,45.6,t))});
  lab('УЧЁНЫЕ',200,a1,'#FFE6A8'); lab('ПУТЕШЕСТВЕННИКИ',560,a2,'#8FD3FF'); lab('МЕЧТАТЕЛИ',915,a3,'#FFB8E6');
  pop(t,37.3,40.9,60,'ПРИВЫЧНЫЙ',TY-45,{c:'#FFFFFF',glow:'rgba(110,150,255,0.6)'}); pop(t,37.55,40.9,74,'СПУТНИК',TY+50,{c:'#FFF1D0',glow:'rgba(255,220,150,0.7)'});
  pop(t,41.0,45.6,58,'ТЫСЯЧИ ЛЕТ',TY-45,{c:'#FFFFFF',glow:'rgba(110,150,255,0.6)'}); pop(t,41.25,45.6,64,'ВДОХНОВЛЯЛ',TY+50,{c:'#FFE6A8',glow:'rgba(255,220,150,0.7)'});
}
function sceneEnd(t){ // 45.6–54
  space(t,1);
  const k=eOut(clamp((t-45.7)/1.4));
  // the moon returns, filling the dashed outline, with Earth below
  earth(540,1520,330,t,{spin:0.03});
  moonDisc(540,780,lerp(120,170,k),{a:k,glow:3.2});
  burst(540,780,t,45.75,'gold');
  pop(t,45.9,49.4,64,'ЛУНА ГОРАЗДО',TY-45,{c:'#FFFFFF',glow:'rgba(255,220,150,0.6)'});
  pop(t,T_VAZ-0.1,49.4,100,'ВАЖНЕЕ',TY+60,{c:'#FFE6A8',glow:'rgba(255,200,110,0.85)',gr:44});
  pop(t,49.6,0,62,'МИР НАМНОГО',TY-60,{c:'#FFFFFF',glow:'rgba(110,180,255,0.6)'});
  pop(t,50.0,0,74,'УДИВИТЕЛЬНЕЕ,',TY+40,{c:'#8FD3FF',glow:'rgba(110,180,255,0.8)'});
  pop(t,50.9,0,48,'ЧЕМ КАЖЕТСЯ',TY+130,{w:800,f:'Manrope',tr:10,c:'#E6EEF8'});
}
const SC=[[0,6.2,sceneOrbit],[6.2,13.5,sceneNight],[13.5,15.5,sceneBegin],[15.5,25.6,sceneTide],[25.6,27.8,sceneMore],[27.8,37.0,sceneAxis],[37.0,45.6,sceneHumans],[45.6,DUR+1,sceneEnd]];
function frame(t){
  ctx.globalCompositeOperation='source-over'; ctx.globalAlpha=1; ctx.filter='none';
  const sc=SC.find(s=>t>=s[0]&&t<s[1]);
  // gentle continuous camera: slow push + drift
  const u=(t-sc[0])/(sc[1]-sc[0]); const z=1+0.04*u, dx=Math.sin(t*0.21)*8, dy=Math.cos(t*0.17)*6;
  ctx.save(); ctx.translate(W/2+dx,H/2+dy); ctx.scale(z,z); ctx.translate(-W/2,-H/2);
  sc[2](t);
  ctx.restore();
  // shared foreground bokeh (shallow DOF) + vignette
  ctx.globalCompositeOperation='lighter';
  for(const f of FG){const x=f.x*W+Math.sin(t*0.25+f.y*4)*40, y=((f.y*H-t*14*f.d)%(H+300)+H+300)%(H+300)-150; ctx.globalAlpha=0.35; ctx.drawImage(BOKEH,x-f.s,y-f.s,f.s*2,f.s*2);}
  ctx.globalCompositeOperation='source-over'; ctx.globalAlpha=1;
  const v=ctx.createRadialGradient(W/2,H/2,H*0.3,W/2,H/2,H*0.75); v.addColorStop(0,'rgba(0,0,0,0)'); v.addColorStop(1,'rgba(0,0,0,0.55)'); ctx.fillStyle=v; ctx.fillRect(0,0,W,H);
  // short dip-to-black at scene cuts
  for(const s of SC){const d=Math.abs(t-s[0]); if(s[0]>0&&d<0.12){ctx.fillStyle=`rgba(0,0,0,${0.85*(1-d/0.12)})`; ctx.fillRect(0,0,W,H);}}
  drawCaptions(t);
  const fade=1-sstep(0,0.35,t)+sstep(DUR-0.8,DUR,t); if(fade>0){ctx.fillStyle=`rgba(0,0,0,${clamp(fade)})`; ctx.fillRect(0,0,W,H);}
}
window.renderFrame=function(t){frame(t);return 1;};
window.grab=q=>cv.toDataURL('image/jpeg',q||0.95);
(async()=>{for(const f of ['900 40px Unbounded','800 40px Manrope','700 40px Manrope']) await document.fonts.load(f,'АБВ абв 23,4°'); window.ready=true;})();
