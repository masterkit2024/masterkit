// 2D overlay: captions, kinetic typography, infographics
const OW=1080, OH=1920;
const FD='Unbounded', FB='Manrope';

// ---------- captions (voice-aligned) ----------
const CHUNKS=[
 [0.16,3.20,"Что если заменить Солнце чёрной дырой такой же массы?"],
 [3.74,6.13,"Первые 8 минут мы ничего не заметим."],
 [6.31,11.09,"Свет и гравитация идут до Земли 8 минут 20 секунд. Небо ещё голубое,"],
 [11.21,12.68,"а Солнца там уже нет."],
 [13.27,18.92,"Чёрная дыра с массой Солнца — это шар всего 6 километров. И она нас не засосёт."],
 [19.22,23.11,"На расстоянии 150 миллионов километров притяжение прежнее."],
 [23.26,27.61,"Земля летит по той же орбите, и год длится всё те же 365 дней."],
 [28.11,29.21,"Но свет пропадает."],
 [29.37,31.53,"Уже через неделю на Земле ниже нуля."],
 [31.77,34.13,"Растения гибнут, океаны покрываются льдом."],
 [34.81,35.80,"Луна тоже гаснет:"],
 [35.96,38.96,"она никогда не светилась сама, а только отражала Солнце."],
 [39.53,42.03,"Зато планеты продолжают свой хоровод."],
 [42.23,46.65,"Меркурий облетает дыру за 88 дней, Земля за 365,"],
 [46.78,48.63,"а Нептун за 165 лет."],
 [49.06,49.99,"Всё как раньше,"],
 [50.28,52.88,"только Солнечная система стала тёмной и тихой."],
 [53.46,54.92,"Жизнь, правда, может уцелеть."],
 [55.16,57.67,"Глубоко под ледяной коркой остаётся жидкая вода,"],
 [57.89,59.64,"ведь Земля сама изнутри тёплая."],
 [59.91,62.85,"Возле вулканических источников могут выжить бактерии."],
 [63.47,64.53,"И самое смешное:"],
 [64.65,66.97,"наше Солнце никогда не станет чёрной дырой."],
 [67.22,68.27,"Ему не хватит массы,"],
 [68.53,70.80,"нужна звезда минимум в 20 раз тяжелее."],
];
const SPOKEN={'8':'восемь','20':'двадцать','6':'шесть','150':'стопятьдесят','365':'тристашестьдесятпять','88':'восемьдесятвосемь','165':'стошестьдесятпять','—':''};
const CAPS=(()=>{
  const groups=[];
  for(const [a,b,txt] of CHUNKS){
    const words=txt.split(' ').filter(w=>w.length);
    const wts=words.map(w=>{const k=w.replace(/[.,:?!]/g,''); const sp=SPOKEN[k]??k; return Math.max(1,sp.length)+ (/[.,:?!]$/.test(w)?3:0)+1;});
    const tot=wts.reduce((x,y)=>x+y,0);
    let acc=0; const W=words.map((w,i)=>{const s=a+(b-a)*acc/tot; acc+=wts[i]; return {w,s,e:a+(b-a)*acc/tot};});
    // group into lines of <= 20 chars, break on punctuation
    let g=[];
    const flush=()=>{ if(g.length){groups.push({words:g,s:g[0].s,e:g[g.length-1].e}); g=[];} };
    for(const it of W){
      const len=g.map(x=>x.w).join(' ').length;
      if(g.length && (len+it.w.length+1>20 || (it.w==='—'))) flush();
      if(it.w==='—') continue;
      g.push(it);
      if(/[.,:?!]$/.test(it.w)) flush();
    }
    flush();
  }
  for(let i=0;i<groups.length;i++){ const n=groups[i+1]; groups[i].end=n?Math.min(n.s,groups[i].e+0.6):groups[i].e+0.6; }
  return groups;
})();
const KEYWORDS=/^(Солнце|Солнца|чёрной|дырой|8|20|6|километров|150|365|ниже|нуля|льдом|гаснет|отражала|хоровод|88|165|тёмной|тихой|Жизнь|жидкая|тёплая|бактерии|никогда|массы|тяжелее|Чёрная|дыра|засосёт|прежнее|Луна|лет|дней|вода|минут|секунд)/i;

function accentFor(t){
  if(t<2.0) return '#FFC46B';
  if(t<13.27) return '#FFD27A';
  if(t<28.05) return '#8FD3FF';
  if(t<39.45) return '#BFE8FF';
  if(t<53.3) return '#A9C4FF';
  if(t<63.4) return '#7DFFC8';
  return '#FFC46B';
}

function drawCaptions(ctx,t){
  if(t>71.3) return;
  const g=CAPS.find(g=>t>=g.s-0.08&&t<g.end);
  if(!g) return;
  const y=1255;
  const size=60;
  ctx.save();
  ctx.font=`800 ${size}px ${FB}`; ctx.textBaseline='alphabetic';
  const sp=size*0.28;
  const ws=g.words.map(w=>ctx.measureText(w.w).width);
  const total=ws.reduce((a,b)=>a+b,0)+sp*(ws.length-1);
  let x=OW/2-total/2;
  const out=1-sstep(g.end-0.12,g.end,t);
  const acc=accentFor(t);
  g.words.forEach((w,i)=>{
    const k0=sstep(g.s-0.1,g.s+0.08,t); const k=sstep(w.s-0.06,w.s+0.1,t);
    const active=t>=w.s-0.03&&t<w.e+0.05;
    const key=KEYWORDS.test(w.w.replace(/[.,:?!«»]/g,''));
    const pop=active?1+0.07*Math.sin(clamp((t-w.s)/0.18)*Math.PI):1;
    const a=(0.38+0.62*k)*k0*out;
    if(a>0.001){
      ctx.save();
      ctx.translate(x+ws[i]/2,y+(1-eOut(k0))*22-eOut(k)*0);
      ctx.scale(pop,pop);
      ctx.globalAlpha=a;
      ctx.shadowColor='rgba(0,0,0,0.85)'; ctx.shadowBlur=22; ctx.shadowOffsetY=3;
      ctx.fillStyle=key&&t>=w.s-0.03?acc:'#FFFFFF';
      ctx.textAlign='center';
      ctx.fillText(w.w,0,0);
      ctx.shadowBlur=0; ctx.shadowOffsetY=0;
      ctx.lineWidth=2; ctx.strokeStyle='rgba(0,0,0,0.25)'; ctx.strokeText(w.w,0,0);
      ctx.fillText(w.w,0,0);
      ctx.restore();
    }
    x+=ws[i]+sp;
  });
  ctx.restore();
}

// ---------- typography helpers ----------
function setFont(ctx,size,weight,fam){ctx.font=`${weight} ${size}px ${fam||FD}`;}
function glowText(ctx,str,x,y,opt){
  const o=Object.assign({size:100,weight:800,fam:FD,color:'#fff',glow:'rgba(255,190,110,0.6)',glowR:30,align:'center',alpha:1,track:0,blur:0,scale:1},opt);
  if(o.alpha<=0.002) return;
  ctx.save();
  ctx.globalAlpha=o.alpha;
  ctx.translate(x,y); ctx.scale(o.scale,o.scale);
  setFont(ctx,o.size,o.weight,o.fam); ctx.textAlign=o.align; ctx.textBaseline='middle';
  ctx.letterSpacing=o.track+'px';
  if(o.blur>0.3) ctx.filter=`blur(${o.blur.toFixed(1)}px)`;
  if(o.glow){ctx.shadowColor=o.glow; ctx.shadowBlur=o.glowR;}
  ctx.fillStyle=o.color; ctx.fillText(o.grad?'' :str,0,0);
  if(o.grad){ const m=ctx.measureText(str); const g=ctx.createLinearGradient(0,-o.size*0.6,0,o.size*0.6); o.grad.forEach((c,i)=>g.addColorStop(i/(o.grad.length-1),c)); ctx.fillStyle=g; ctx.fillText(str,0,0); }
  ctx.shadowBlur=0;
  ctx.fillText(o.grad?'':str,0,0);
  ctx.restore();
}
// per-letter kinetic text. anim(i,n) -> {dx,dy,s,a,blur,rot}
function kinetic(ctx,str,cx,cy,opt,anim){
  const o=Object.assign({size:120,weight:900,fam:FD,color:'#fff',glow:'rgba(255,190,110,0.55)',glowR:34,track:0},opt);
  ctx.save();
  setFont(ctx,o.size,o.weight,o.fam); ctx.letterSpacing='0px';
  const chars=[...str]; const ws=chars.map(c=>ctx.measureText(c).width);
  const total=ws.reduce((a,b)=>a+b,0)+o.track*(chars.length-1);
  let x=cx-total/2;
  chars.forEach((c,i)=>{
    const an=anim(i,chars.length,x+ws[i]/2-cx);
    if(an.a>0.003 && c!==' '){
      ctx.save();
      ctx.translate(x+ws[i]/2+(an.dx||0),cy+(an.dy||0));
      if(an.rot) ctx.rotate(an.rot);
      ctx.scale(an.sx??an.s??1,an.sy??an.s??1);
      ctx.globalAlpha=clamp(an.a);
      if(an.blur>0.4) ctx.filter=`blur(${an.blur.toFixed(1)}px)`;
      ctx.textAlign='center'; ctx.textBaseline='middle';
      ctx.shadowColor=an.glow||o.glow; ctx.shadowBlur=o.glowR;
      ctx.fillStyle=an.color||o.color; ctx.fillText(c,0,0);
      ctx.shadowBlur=0; ctx.fillText(c,0,0);
      ctx.restore();
    }
    x+=ws[i]+o.track;
  });
  ctx.restore();
}
// standard rise-in / blur-out per-letter animation
function riseAnim(t,t0,t1,stagger,opt={}){
  return (i,n)=>{
    const k=eOut(clamp((t-t0-i*stagger)/0.45));
    const kb=clamp((t-t0-i*stagger)/0.35);
    const ko=t1?clamp((t-(t1-0.35)-i*stagger*0.5)/0.3):0;
    return {dy:(1-k)*(opt.dy??60)-ko*30,a:kb*(1-ko),blur:(1-kb)*14+ko*12,s:lerp(opt.s0??1.25,1,k)};
  };
}
function line(ctx,x0,y0,x1,y1,col,w,alpha){ctx.save();ctx.globalAlpha=alpha;ctx.strokeStyle=col;ctx.lineWidth=w;ctx.beginPath();ctx.moveTo(x0,y0);ctx.lineTo(x1,y1);ctx.stroke();ctx.restore();}
function pill(ctx,x,y,w,h,r){ctx.beginPath();ctx.moveTo(x+r,y);ctx.arcTo(x+w,y,x+w,y+h,r);ctx.arcTo(x+w,y+h,x,y+h,r);ctx.arcTo(x,y+h,x,y,r);ctx.arcTo(x,y,x+w,y,r);ctx.closePath();}
function P(e,p){return project(e.cam,p,OW,OH);}

// pinned label with leader line
function pinLabel(ctx,anchor,dx,dy,title,sub,alpha,col){
  if(!anchor||alpha<=0.003) return;
  const k=eOut(alpha);
  setFont(ctx,56,800,FD); const tw=Math.max(ctx.measureText(sub).width, title.length*22);
  const roomR=OW-30-(anchor.x+Math.abs(dx)+52), roomL=(anchor.x-Math.abs(dx)-52)-30;
  if(dx>0&&roomR<tw&&roomL>roomR) dx=-dx; else if(dx<0&&roomL<tw&&roomR>roomL) dx=-dx;
  let ax=anchor.x, ay=anchor.y, lx=ax+dx*k, ly=ay+dy*k;
  // clamp so text stays inside the frame
  if(dx>0){ const over=lx+52+tw-(OW-30); if(over>0) lx-=over; } else { const over=30-(lx-52-tw); if(over>0) lx+=over; }
  ctx.save(); ctx.globalAlpha=alpha;
  ctx.strokeStyle='rgba(255,255,255,0.75)'; ctx.lineWidth=2.5;
  ctx.beginPath(); ctx.moveTo(ax+Math.sign(dx)*6,ay+Math.sign(dy)*6); ctx.lineTo(lx,ly); ctx.lineTo(lx+Math.sign(dx)*40*k,ly); ctx.stroke();
  ctx.fillStyle=col; ctx.beginPath(); ctx.arc(ax,ay,5,0,TAU); ctx.fill();
  const tx=lx+Math.sign(dx)*52, al=dx<0?'right':'left';
  ctx.textAlign=al; ctx.textBaseline='alphabetic';
  ctx.shadowColor='rgba(0,0,0,0.9)'; ctx.shadowBlur=16;
  setFont(ctx,30,700,FB); ctx.letterSpacing='6px'; ctx.fillStyle='rgba(255,255,255,0.85)'; ctx.fillText(title,tx,ly-14);
  setFont(ctx,56,800,FD); ctx.letterSpacing='0px'; ctx.fillStyle=col; ctx.fillText(sub,tx,ly+52);
  ctx.restore();
}

// ---------- frost (precomputed dendrites from screen edges) ----------
const FROST=(()=>{
  let seed=7; const rnd=()=>{seed=(seed*16807)%2147483647;return seed/2147483647;};
  const segs=[];
  const grow=(x,y,ang,len,depth,d0)=>{
    if(depth>5||len<6) return;
    const x1=x+Math.cos(ang)*len, y1=y+Math.sin(ang)*len;
    segs.push({x0:x,y0:y,x1,y1,d:d0,w:Math.max(0.6,3.2-depth*0.55)});
    const n=2+Math.floor(rnd()*2);
    for(let k=0;k<n;k++){
      const f=0.3+rnd()*0.7;
      const bx=x+(x1-x)*f, by=y+(y1-y)*f;
      grow(bx,by,ang+(rnd()<.5?-1:1)*(0.6+rnd()*0.5),len*(0.35+rnd()*0.3),depth+1,d0+len*f);
    }
    grow(x1,y1,ang+(rnd()-.5)*0.4,len*0.75,depth+1,d0+len);
  };
  const seeds=[];
  for(let i=0;i<14;i++) seeds.push([rnd()*OW,-10,Math.PI/2]);
  for(let i=0;i<12;i++) seeds.push([rnd()*OW,OH+10,-Math.PI/2]);
  for(let i=0;i<16;i++) seeds.push([-10,rnd()*OH,0]);
  for(let i=0;i<16;i++) seeds.push([OW+10,rnd()*OH,Math.PI]);
  for(const [x,y,a] of seeds) grow(x,y,a+(rnd()-.5)*0.8,60+rnd()*110,0,0);
  return segs;
})();
function drawFrost(ctx,amount){
  if(amount<=0) return;
  const maxD=amount*360;
  ctx.save(); ctx.globalCompositeOperation='lighter'; ctx.lineCap='round';
  for(const s of FROST){
    if(s.d>maxD) continue;
    const f=clamp((maxD-s.d)/60);
    const x1=s.x0+(s.x1-s.x0)*f, y1=s.y0+(s.y1-s.y0)*f;
    ctx.strokeStyle=`rgba(190,225,255,${0.16*amount})`; ctx.lineWidth=s.w;
    ctx.beginPath(); ctx.moveTo(s.x0,s.y0); ctx.lineTo(x1,y1); ctx.stroke();
  }
  // icy edge vignette
  const g=ctx.createRadialGradient(OW/2,OH/2,OH*0.3,OW/2,OH/2,OH*0.62);
  g.addColorStop(0,'rgba(150,200,255,0)'); g.addColorStop(1,`rgba(150,200,255,${0.16*amount})`);
  ctx.fillStyle=g; ctx.fillRect(0,0,OW,OH);
  ctx.restore();
}

// ---------- gravity grid ----------
function drawGrid(ctx,e){
  const eps=e.ov.eps; const cam=e.cam;
  const ep=e.ov.ep; const epr=P(e,ep); const erad=epr?0.23*epr.s:0;
  const pt=(r,a)=>{const y=Math.max(wellDepth(r,eps),-5.2);return [r*Math.cos(a),y,r*Math.sin(a)];};
  ctx.save(); ctx.globalCompositeOperation='lighter'; ctx.lineCap='round';
  const alphaIn=sstep(19.1,19.7,e.t);
  const seg=(p0,p1,a)=>{
    const s0=P(e,p0), s1=P(e,p1); if(!s0||!s1) return;
    if(epr){ // hide behind earth
      const mx=(s0.x+s1.x)/2, my=(s0.y+s1.y)/2;
      if(Math.hypot(mx-epr.x,my-epr.y)<erad+2 && (s0.z+s1.z)/2>epr.z) return;
    }
    const fade=a*alphaIn/(1+((s0.z+s1.z)/2)*0.05);
    ctx.strokeStyle=`rgba(110,190,255,${fade})`;
    ctx.beginPath(); ctx.moveTo(s0.x,s0.y); ctx.lineTo(s1.x,s1.y); ctx.stroke();
  };
  ctx.lineWidth=2.2;
  for(let r=0.6;r<=14.01;r+=0.6){
    const deep=clamp((wellDepth(r,eps)+5.2)/1.2);
    const a=0.55*(1-sstep(10,14,r))*deep;
    for(let k=0;k<96;k++){ const a0=k/96*TAU,a1=(k+1)/96*TAU; seg(pt(r,a0),pt(r,a1),a); }
  }
  for(let k=0;k<40;k++){
    const a=k/40*TAU;
    for(let r=0.1;r<14;r+=0.25){
      const deep=clamp((wellDepth(r,eps)+5.2)/1.2);
      seg(pt(r,a),pt(r+0.25,a),0.45*(1-sstep(10,14,r))*deep);
    }
  }
  ctx.restore();
}

// ---------- scene overlays ----------
function drawOverlay(ctx,e){
  const t=e.t; const sc=e.scene;
  ctx.save();
  if(sc===0) ovHook(ctx,e,t);
  else if(sc===1) ovFront(ctx,e,t);
  else if(sc===2) ovSky(ctx,e,t);
  else if(sc===3) ovSize(ctx,e,t);
  else if(sc===4) ovGrid(ctx,e,t);
  else if(sc===5) ovYear(ctx,e,t);
  else if(sc===6) ovFreeze(ctx,e,t);
  else if(sc===7) ovMoon(ctx,e,t);
  else if(sc===8) ovDance(ctx,e,t);
  else if(sc===9) ovUnder(ctx,e,t);
  else if(sc===10) ovPunch(ctx,e,t);
  else if(sc===11) ovEnd(ctx,e,t);
  ctx.restore();
}
function drawStatic(ctx,e){
  drawCaptions(ctx,e.t);
  // timer HUD lives across scenes 1-2
  if(e.t>6.05&&e.t<13.4) drawTimer(ctx,e.t);
}

const TY=430; // title line

function ovHook(ctx,e,t){
  const sun=P(e,[0,0,0]);
  // "ЧТО ЕСЛИ"
  glowText(ctx,'ЧТО ЕСЛИ',OW/2,TY-150,{size:34,weight:700,fam:FB,track:14,color:'#FFD9A0',glow:'rgba(0,0,0,0.6)',glowR:18,
    alpha:sstep(0.15,0.45,t)*(1-sstep(1.45,1.7,t))});
  // СОЛНЦЕ, sucked into the sun at collapse
  if(t>0.95&&t<2.05){
    const suck=eIn(clamp((t-1.58)/0.42));
    kinetic(ctx,'СОЛНЦЕ',OW/2,TY,{size:132,weight:900,color:'#FFE6B8',glow:'rgba(255,170,60,0.75)',glowR:40},(i,n,ox)=>{
      const k=eOutBack(clamp((t-1.0-i*0.035)/0.4)); const ka=clamp((t-1.0-i*0.035)/0.2);
      const tx=sun?sun.x-OW/2-ox:0, ty=sun?sun.y-TY:0;
      return {dy:(1-k)*-70+ty*suck, dx:tx*suck, s:(0.6+0.4*k)*(1-suck*0.92), sx:(0.6+0.4*k)*(1-suck*0.95), sy:(0.6+0.4*k)*(1-suck*0.7)*(1+suck*1.5), a:ka*(1-sstep(0.85,1,suck)), blur:suck*10};
    });
  }
  // ЧЁРНАЯ ДЫРА bursts out
  if(t>=2.0){
    const cx=sun?sun.x:OW/2, cy=sun?sun.y:900;
    const out=sstep(3.42,3.7,t);
    ['ЧЁРНАЯ','ДЫРА'].forEach((w,li)=>{
      const ty=TY-60+li*140;
      kinetic(ctx,w,OW/2,ty,{size:128,weight:900,color:'#F4F8FF',glow:'rgba(120,170,255,0.65)',glowR:36},(i,n,ox)=>{
        const k=eOutExpo(clamp((t-2.0-li*0.06-Math.abs(i-n/2)*0.02)/0.55));
        const fx=(cx-OW/2-ox), fy=(cy-ty);
        return {dx:fx*(1-k), dy:fy*(1-k)-out*40, s:lerp(0.1,1,k), a:clamp(k*1.6)*(1-out), blur:(1-k)*16+out*12};
      });
    });
    glowText(ctx,'той же массы',OW/2,TY+170,{size:44,weight:700,fam:FB,track:4,color:'#BFD4FF',glow:'rgba(0,0,0,0.7)',glowR:18,
      alpha:sstep(2.5,2.8,t)*(1-out),scale:lerp(0.9,1,eOut(clamp((t-2.5)/0.4)))});
    // shock ring
    const k=clamp((t-2.0)/0.9);
    if(k<1){ctx.save();ctx.globalCompositeOperation='lighter';ctx.strokeStyle=`rgba(255,230,200,${0.5*(1-k)})`;ctx.lineWidth=10*(1-k)+1;ctx.beginPath();ctx.arc(cx,cy,30+eOut(k)*900,0,TAU);ctx.stroke();ctx.restore();}
  }
}

function fmtTime(sec){sec=Math.max(0,Math.min(500,sec));const m=Math.floor(sec/60),s=Math.floor(sec%60);return `${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`;}
function drawTimer(ctx,t){
  const sec=(t-T_COLL)/(T_ARRIVE-T_COLL)*500;
  const a=sstep(6.05,6.45,t)*(1-sstep(13.0,13.4,t));
  const done=t>=T_ARRIVE;
  const pulse=done?Math.exp(-(t-T_ARRIVE)*4):0;
  const y=250;
  ctx.save();
  // panel
  ctx.globalAlpha=a*0.55; ctx.fillStyle='rgba(5,8,16,0.9)'; pill(ctx,OW/2-300,y-110,600,200,36); ctx.fill();
  ctx.globalAlpha=a; ctx.strokeStyle=done?'rgba(255,120,90,0.9)':'rgba(255,210,140,0.45)'; ctx.lineWidth=2; pill(ctx,OW/2-300,y-110,600,200,36); ctx.stroke();
  glowText(ctx,'СВЕТ В ПУТИ',OW/2,y-68,{size:24,weight:700,fam:FB,track:8,color:done?'#FF9A80':'#FFD9A0',glow:null,alpha:a});
  glowText(ctx,fmtTime(sec),OW/2,y+8,{size:96,weight:700,color:done?'#FFFFFF':'#FFE7C2',glow:done?'rgba(255,90,60,0.9)':'rgba(255,170,60,0.5)',glowR:30+pulse*40,alpha:a,scale:1+pulse*0.12});
  // progress bar
  const p=clamp(sec/500);
  const bx=OW/2-230, bw=460, by=y+68;
  ctx.globalAlpha=a; ctx.fillStyle='rgba(255,255,255,0.15)'; ctx.fillRect(bx,by,bw,5);
  const g=ctx.createLinearGradient(bx,0,bx+bw,0); g.addColorStop(0,'#FFB050'); g.addColorStop(1,'#FFF0D0');
  ctx.fillStyle=g; ctx.fillRect(bx,by,bw*p,5);
  ctx.fillStyle='#000'; ctx.strokeStyle='#bbb'; ctx.lineWidth=2; ctx.beginPath(); ctx.arc(bx-14,by+2.5,8,0,TAU); ctx.fill(); ctx.stroke();
  ctx.fillStyle='#4F9BFF'; ctx.beginPath(); ctx.arc(bx+bw+14,by+2.5,8,0,TAU); ctx.fill();
  ctx.restore();
}

function ovFront(ctx,e,t){
  // big "8 минут" that flies up into the timer
  if(t<6.5){
    const up=eIO(clamp((t-5.9)/0.5));
    const a=1-sstep(6.15,6.45,t);
    const y=lerp(TY+40,250,up), s=lerp(1,0.35,up);
    kinetic(ctx,'8',OW/2,y-40,{size:Math.round(360*s)||1,weight:900,color:'#FFE3B0',glow:'rgba(255,160,60,0.7)',glowR:50},()=>{
      const k=eOutBack(clamp((t-3.85)/0.5)); return {s:lerp(1.6,1,k),a:clamp((t-3.85)/0.2)*a,blur:(1-clamp((t-3.85)/0.3))*20};});
    kinetic(ctx,'МИНУТ',OW/2,y+150*s,{size:Math.round(78*s)||1,weight:800,color:'#FFFFFF',glow:'rgba(0,0,0,0.6)',glowR:20,track:14*s},riseAnim(t,4.15,0,0.04,{dy:40}));
    ctx.globalAlpha=1;
    glowText(ctx,'мы ничего не заметим',OW/2,y+250*s,{size:38,weight:600,fam:FB,color:'#D8E2F0',glow:'rgba(0,0,0,0.8)',glowR:14,alpha:sstep(4.9,5.3,t)*(1-sstep(5.8,6.1,t))});
  }
  // labels on the moving light front & Earth
  const ear=P(e,planetPos(EARTH,e.ov.days));
  pinLabel(ctx,ear,140,-120,'ЗЕМЛЯ','ещё светло',sstep(7.0,7.6,t)*(1-sstep(9.5,9.9,t)),'#8FC8FF');
}

function ovSky(ctx,e,t){
  const sp=P(e,V.add(e.cam.pos,V.mul(V.norm([0.10,0.50,1]),100)));
  if(sp){
    const a=sstep(10.5,10.9,t)*(1-sstep(12.9,13.2,t));
    const off=e.ov.off;
    ctx.save(); ctx.globalAlpha=a;
    ctx.setLineDash([14,12]); ctx.lineDashOffset=-t*30;
    ctx.strokeStyle=off>0.5?'rgba(255,120,100,0.9)':'rgba(255,255,255,0.85)'; ctx.lineWidth=3;
    const r=78+8*Math.sin(t*4);
    ctx.beginPath(); ctx.arc(sp.x,sp.y,r,0,TAU); ctx.stroke(); ctx.setLineDash([]);
    ctx.restore();
    const old=1-sstep(11.15,11.4,t);
    pinLabel(ctx,{x:sp.x+r*0.7,y:sp.y+r*0.7},90,190,'ЭТО СВЕТ','8 минут назад',a*old,'#FFE1A8');
    pinLabel(ctx,{x:sp.x+r*0.7,y:sp.y+r*0.7},90,190,'А СОЛНЦА','уже нет',a*(1-old),'#FF9C86');
  }
}

function ovSize(ctx,e,t){
  const c=P(e,[0,0,0]);
  if(!c) return;
  // ghost sun outline
  const ga=sstep(13.35,13.8,t)*(1-sstep(15.6,16.2,t));
  if(ga>0){
    const r=1.2*c.s;
    ctx.save(); ctx.globalAlpha=ga;
    ctx.setLineDash([18,14]); ctx.lineDashOffset=t*20; ctx.strokeStyle='rgba(255,200,120,0.8)'; ctx.lineWidth=3;
    ctx.beginPath(); ctx.arc(c.x,c.y,r,0,TAU); ctx.stroke(); ctx.setLineDash([]);
    const g=ctx.createRadialGradient(c.x,c.y,r*0.2,c.x,c.y,r); g.addColorStop(0,'rgba(255,170,60,0.0)'); g.addColorStop(1,'rgba(255,170,60,0.10)');
    ctx.fillStyle=g; ctx.beginPath(); ctx.arc(c.x,c.y,r,0,TAU); ctx.fill();
    ctx.restore();
    glowText(ctx,'СОЛНЦЕ',c.x,c.y-r-110,{size:30,weight:700,fam:FB,track:10,color:'#FFD9A0',glow:'rgba(0,0,0,.7)',glowR:12,alpha:ga});
    glowText(ctx,'1 392 000 км',c.x,c.y-r-58,{size:58,weight:800,color:'#FFE6C0',glow:'rgba(255,150,50,.5)',glowR:24,alpha:ga});
    pinLabel(ctx,{x:c.x+6,y:c.y+6},150,210,'ЧЁРНАЯ ДЫРА','та же масса',ga*sstep(14.2,14.6,t),'#BFD4FF');
  }
  // ruler 6 km
  const ra=sstep(16.25,16.6,t)*(1-sstep(17.45,17.75,t));
  if(ra>0){
    const rr=Math.tan(Math.asin(Math.min(0.012/V.len(V.sub([0,0,0],e.cam.pos)),0.99)))/e.cam.tanHalf*OH/2;
    const k=eOut(clamp((t-16.25)/0.45));
    ctx.save(); ctx.globalAlpha=ra; ctx.strokeStyle='rgba(255,255,255,0.9)'; ctx.lineWidth=3; ctx.shadowColor='rgba(120,170,255,0.9)'; ctx.shadowBlur=14;
    const y=c.y;
    ctx.beginPath(); ctx.moveTo(c.x-rr*k,y); ctx.lineTo(c.x+rr*k,y); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(c.x-rr*k,y-18); ctx.lineTo(c.x-rr*k,y+18); ctx.moveTo(c.x+rr*k,y-18); ctx.lineTo(c.x+rr*k,y+18); ctx.stroke();
    ctx.restore();
    glowText(ctx,'ВСЕГО',OW/2,TY-110,{size:34,weight:700,fam:FB,track:12,color:'#CFE0FF',glow:'rgba(0,0,0,.7)',glowR:12,alpha:ra});
    kinetic(ctx,'6 КМ',OW/2,TY,{size:190,weight:900,color:'#FFFFFF',glow:'rgba(120,170,255,0.75)',glowR:44},(i)=>{
      const kk=eOutBack(clamp((t-16.3-i*0.05)/0.45)); return {s:lerp(0.4,1,kk),a:ra*clamp((t-16.3-i*0.05)/0.2),blur:(1-clamp((t-16.3)/0.3))*16};});
  }
  // НЕ ЗАСОСЁТ: letters pulled toward the hole, then snap back
  if(t>17.55){
    const a=sstep(17.55,17.8,t)*(1-sstep(18.85,19.1,t));
    kinetic(ctx,'НЕ ЗАСОСЁТ',OW/2,TY,{size:104,weight:900,color:'#FFFFFF',glow:'rgba(120,170,255,0.6)',glowR:30},(i,n,ox)=>{
      const pull=Math.sin(clamp((t-17.65)/0.5)*Math.PI)*(1-clamp((t-18.1)/0.3));
      const k=eOutBack(clamp((t-17.55-i*0.03)/0.4));
      return {dx:-ox*0.25*pull, dy:(c.y-TY)*0.12*pull+(1-k)*50, sx:1-0.25*pull, sy:1+0.15*pull, a:a*clamp((t-17.55-i*0.03)/0.2), blur:pull*5};
    });
  }
}

function ovGrid(ctx,e,t){
  drawGrid(ctx,e);
  const c=P(e,[0,Math.max(wellDepth(0.2,e.ov.eps),-5),0]); const ep=P(e,e.ov.ep);
  const a=sstep(19.3,19.8,t)*(1-sstep(22.95,23.2,t));
  // distance dimension line from center to earth on the rim plane
  if(ep){
    const top=P(e,[0,wellDepth(5.8,e.ov.eps)+0.23,0]);
    if(top){
      const k=eIO(clamp((t-19.6)/0.8));
      ctx.save(); ctx.globalAlpha=a; ctx.setLineDash([10,10]); ctx.strokeStyle='rgba(255,255,255,0.8)'; ctx.lineWidth=2.5;
      ctx.beginPath(); ctx.moveTo(top.x,top.y); ctx.lineTo(lerp(top.x,ep.x,k),lerp(top.y,ep.y,k)); ctx.stroke(); ctx.restore();
      glowText(ctx,'150 000 000 км',(top.x+ep.x)/2,(top.y+ep.y)/2-50,{size:44,weight:800,color:'#FFFFFF',glow:'rgba(0,0,0,.8)',glowR:16,alpha:a*sstep(20.0,20.4,t)});
    }
  }
  // headline
  glowText(ctx,'ПРИТЯЖЕНИЕ',OW/2,TY-50,{size:84,weight:900,color:'#FFFFFF',glow:'rgba(110,190,255,0.6)',glowR:30,alpha:sstep(21.4,21.8,t)*(1-sstep(22.95,23.2,t)),blur:(1-sstep(21.4,21.8,t))*10});
  glowText(ctx,'ПРЕЖНЕЕ',OW/2,TY+50,{size:84,weight:900,color:'#8FD3FF',glow:'rgba(110,190,255,0.6)',glowR:30,alpha:sstep(21.6,22.0,t)*(1-sstep(22.95,23.2,t)),blur:(1-sstep(21.6,22.0,t))*10});
  // center label switches Sun -> hole
  if(c){
    const s1=sstep(19.3,19.6,t)*(1-sstep(20.0,20.3,t)), s2=sstep(20.6,21.0,t)*(1-sstep(21.3,21.6,t));
    glowText(ctx,'Солнце',c.x,c.y+80,{size:34,weight:700,fam:FB,color:'#FFD9A0',glow:'rgba(0,0,0,.8)',glowR:12,alpha:s1});
    glowText(ctx,'дыра: воронка глубже',c.x,c.y+90,{size:34,weight:700,fam:FB,color:'#BFD4FF',glow:'rgba(0,0,0,.8)',glowR:12,alpha:s2});
  }
}

function ovYear(ctx,e,t){
  const a=sstep(23.35,23.7,t)*(1-sstep(27.8,28.05,t));
  const n=e.ov.count; const done=t>27.0;
  const pulse=done?Math.exp(-(t-27.0)*5):0;
  glowText(ctx,'ДЛИНА ГОДА',OW/2,TY-150,{size:32,weight:700,fam:FB,track:12,color:'#BFE3FF',glow:'rgba(0,0,0,.7)',glowR:12,alpha:a});
  glowText(ctx,String(n),OW/2,TY-10,{size:220,weight:900,color:done?'#FFFFFF':'#DDF0FF',glow:`rgba(110,190,255,${0.5+pulse*0.5})`,glowR:40+pulse*40,alpha:a,scale:1+pulse*0.08});
  glowText(ctx,'ДНЕЙ',OW/2,TY+140,{size:56,weight:800,track:16,color:'#8FD3FF',glow:'rgba(0,0,0,.6)',glowR:14,alpha:a});
  const ear=P(e,planetPos(EARTH,e.ov.days));
  pinLabel(ctx,ear,140,90,'ЗЕМЛЯ','та же орбита',a*sstep(23.8,24.3,t)*(1-sstep(26.6,26.9,t)),'#8FC8FF');
}

function ovFreeze(ctx,e,t){
  const a=sstep(29.25,29.6,t)*(1-sstep(34.35,34.6,t));
  const k=eIO(clamp((t-29.5)/1.9));
  const temp=Math.round(lerp(15,-20,k));
  const txt=(temp>0?'+':temp<0?'−':'')+Math.abs(temp)+'°';
  const cold=clamp((15-temp)/35);
  const col=`rgb(${Math.round(lerp(255,200,cold))},${Math.round(lerp(190,235,cold))},${Math.round(lerp(120,255,cold))})`;
  glowText(ctx,'ЧЕРЕЗ НЕДЕЛЮ',OW/2,TY-160,{size:32,weight:700,fam:FB,track:12,color:'#DDEBFF',glow:'rgba(0,0,0,.7)',glowR:12,alpha:a});
  glowText(ctx,txt,OW/2,TY,{size:230,weight:900,color:col,glow:cold>0.5?'rgba(140,200,255,0.7)':'rgba(255,140,60,0.6)',glowR:44,alpha:a});
  glowText(ctx,'ниже нуля',OW/2,TY+150,{size:44,weight:700,fam:FB,color:'#BFE3FF',glow:'rgba(0,0,0,.7)',glowR:12,alpha:a*sstep(30.6,31.0,t)});
  drawFrost(ctx,smoother(31.2,34.4,t)*(1-sstep(34.4,34.62,t)*0.5));
}

function ovMoon(ctx,e,t){
  const m=P(e,[0,0,0]); if(!m) return;
  const mr=0.07*m.s;
  // "ЛУНА ГАСНЕТ": letters dim one by one
  const a0=sstep(34.75,35.0,t)*(1-sstep(35.95,36.2,t));
  kinetic(ctx,'ЛУНА ГАСНЕТ',OW/2,TY,{size:96,weight:900,color:'#F2F2F2',glow:'rgba(255,255,255,0.45)',glowR:30},(i,n)=>{
    const dim=sstep(35.2+i*0.05,35.5+i*0.05,t);
    return {a:a0*(1-dim*0.8),blur:dim*3,color:dim>0.5?'#7C8696':'#F2F2F2',glow:dim>0.5?'rgba(0,0,0,0)':'rgba(255,255,255,0.45)'};
  });
  // rays: sunlight hitting the moon and reflecting to the viewer
  const ra=win(t,36.1,38.6,0.3);
  if(ra>0){
    const yawM=lerp(0.55,0.95,(t-34.62)/(39.45-34.62)); const L=V.norm([Math.cos(yawM+1.25),0.22,Math.sin(yawM+1.25)]);
    const src=P(e,V.mul(L,0.9));
    const cut=sstep(38.0,38.5,t);
    ctx.save(); ctx.globalCompositeOperation='lighter';
    for(let k=-2;k<=2;k++){
      const hx=m.x-mr*0.55+k*mr*0.12, hy=m.y-mr*0.15+k*mr*0.2;
      const sx=(src?src.x:-200)+k*40, sy=(src?src.y:300)+k*40;
      const flow=(t*1.2+k*0.13)%1;
      const g=ctx.createLinearGradient(sx,sy,hx,hy);
      g.addColorStop(0,'rgba(255,200,120,0)'); g.addColorStop(Math.max(0.01,cut),'rgba(255,200,120,0)'); g.addColorStop(Math.min(0.999,cut+0.01),`rgba(255,210,140,${0.55*ra})`); g.addColorStop(1,`rgba(255,230,180,${0.8*ra})`);
      ctx.strokeStyle=g; ctx.lineWidth=4; ctx.beginPath(); ctx.moveTo(sx,sy); ctx.lineTo(hx,hy); ctx.stroke();
      // reflected ray toward camera (down-right)
      const ex=hx+(OW*0.75-hx)*1.0+k*30, ey=OH*0.95;
      const rk=clamp((t-36.4)/0.5)*(1-cut);
      const g2=ctx.createLinearGradient(hx,hy,ex,ey); g2.addColorStop(0,`rgba(255,230,190,${0.6*ra*rk})`); g2.addColorStop(1,'rgba(255,230,190,0)');
      ctx.strokeStyle=g2; ctx.lineWidth=3; ctx.beginPath(); ctx.moveTo(hx,hy); ctx.lineTo(lerp(hx,ex,rk),lerp(hy,ey,rk)); ctx.stroke();
      // photon dots
      ctx.fillStyle=`rgba(255,240,210,${0.9*ra*(1-cut)})`; ctx.beginPath(); ctx.arc(lerp(sx,hx,flow),lerp(sy,hy,flow),4,0,TAU); ctx.fill();
    }
    ctx.restore();
  }
  // ОТРАЖАЛА with mirror reflection
  const a1=sstep(37.3,37.6,t)*(1-sstep(39.15,39.45,t));
  if(a1>0){
    glowText(ctx,'только',OW/2,TY-120,{size:36,weight:700,fam:FB,track:6,color:'#E8E0D0',glow:'rgba(0,0,0,.7)',glowR:12,alpha:a1});
    kinetic(ctx,'ОТРАЖАЛА',OW/2,TY,{size:110,weight:900,color:'#FFF1D6',glow:'rgba(255,200,120,0.6)',glowR:30},riseAnim(t,37.3,39.45,0.03));
    ctx.save(); ctx.translate(0,TY*2+128); ctx.scale(1,-1); ctx.globalAlpha=0.2;
    kinetic(ctx,'ОТРАЖАЛА',OW/2,TY,{size:110,weight:900,color:'#FFF1D6',glow:'rgba(0,0,0,0)',glowR:0},riseAnim(t,37.3,39.45,0.03));
    ctx.restore();
    const g=ctx.createLinearGradient(0,TY+60,0,TY+170); g.addColorStop(0,'rgba(0,0,0,0)'); g.addColorStop(1,'rgba(0,0,0,0)');
  }
}

function ovDance(ctx,e,t){
  // ХОРОВОД: letters swirl from a ring into a line
  const a=sstep(39.5,39.8,t)*(1-sstep(41.9,42.2,t));
  if(a>0) kinetic(ctx,'ХОРОВОД',OW/2,TY,{size:116,weight:900,color:'#FFFFFF',glow:'rgba(150,180,255,0.6)',glowR:34},(i,n,ox)=>{
    const k=eIO(clamp((t-39.55-i*0.05)/0.9));
    const ang=i/n*TAU+t*1.5;
    const rx=Math.cos(ang)*260-ox, ry=Math.sin(ang)*90;
    return {dx:rx*(1-k), dy:ry*(1-k), s:lerp(0.6,1,k), a:a*clamp((t-39.5-i*0.04)/0.25), blur:(1-k)*6, rot:(1-k)*ang*0.2};
  });
  const d=e.ov.days;
  const hl=e.ov.hl;
  pinLabel(ctx,P(e,e.ov.pp[0]),-150,-190,'МЕРКУРИЙ','88 дней',hl[0],'#FFD6B0');
  pinLabel(ctx,P(e,e.ov.pp[EARTH]),150,-190,'ЗЕМЛЯ','365 дней',hl[2],'#8FC8FF');
  pinLabel(ctx,P(e,e.ov.pp[7]),-140,170,'НЕПТУН','165 лет',hl[7],'#8FA8FF');
  // "Всё как раньше"
  glowText(ctx,'ВСЁ КАК РАНЬШЕ',OW/2,TY,{size:64,weight:800,color:'#FFFFFF',glow:'rgba(150,180,255,0.5)',glowR:24,alpha:sstep(49.0,49.3,t)*(1-sstep(50.1,50.4,t))});
  // тёмной и тихой — thin, fading out
  const q=sstep(50.6,51.0,t);
  if(q>0){
    kinetic(ctx,'тёмной',OW/2,TY-50,{size:96,weight:300,color:'#C8D4F0',glow:'rgba(0,0,0,0)',glowR:0,track:8},(i,n)=>({a:q*(1-sstep(52.2+i*0.06,52.8+i*0.06,t)),blur:sstep(52.2+i*0.06,52.8+i*0.06,t)*8}));
    kinetic(ctx,'и тихой',OW/2,TY+70,{size:96,weight:300,color:'#8E9CC0',glow:'rgba(0,0,0,0)',glowR:0,track:8},(i,n)=>({a:sstep(51.4,51.8,t)*(1-sstep(52.4+i*0.06,53.0+i*0.06,t)),blur:sstep(52.4+i*0.06,53+i*0.06,t)*8}));
  }
}

function ovUnder(ctx,e,t){
  const o=e.ov;
  const toS=(x,y)=>({x:OW/2+(x-o.pan)/o.scale*OH/2, y:OH/2-(y-o.depth)/o.scale*OH/2});
  glowText(ctx,'ЖИЗНЬ',OW/2,TY,{size:130,weight:900,color:'#FFFFFF',glow:'rgba(125,255,200,0.5)',glowR:34,alpha:sstep(53.5,53.9,t)*(1-sstep(54.9,55.2,t)),blur:(1-sstep(53.5,53.9,t))*14});
  glowText(ctx,'может уцелеть',OW/2,TY+110,{size:46,weight:700,fam:FB,color:'#BFFFE6',glow:'rgba(0,0,0,.7)',glowR:12,alpha:sstep(53.9,54.3,t)*(1-sstep(54.9,55.2,t))});
  const lab=(x,y,title,sub,a,col,dx)=>pinLabel(ctx,toS(x,y),dx||150,-60,title,sub,a,col);
  lab(-0.6,-0.55,'ЛЕДЯНАЯ КОРКА','лёд',win(t,55.15,56.6,0.3),'#CFEFFF',160);
  lab(-0.4,-2.4,'ПОД НЕЙ','жидкая вода',win(t,56.3,58.0,0.3),'#7FC4FF',180);
  lab(0.2,-7.6,'НЕДРА ЗЕМЛИ','тепло',win(t,57.9,59.9,0.3),'#FFB070',-160);
  lab(0.75,-5.75,'ГИДРОТЕРМАЛЬНЫЙ ИСТОЧНИК','бактерии',sstep(60.5,61.0,t)*(1-sstep(63.1,63.4,t)),'#7DFFC8',-140);
  // depth gauge on left
  const ga=sstep(54.8,55.3,t)*(1-sstep(63.0,63.4,t));
  if(ga>0){
    ctx.save(); ctx.globalAlpha=ga*0.7; ctx.strokeStyle='rgba(255,255,255,0.6)'; ctx.lineWidth=2;
    ctx.beginPath(); ctx.moveTo(70,200); ctx.lineTo(70,1500); ctx.stroke();
    for(let yy=0;yy>=-9;yy-=0.5){ const s=toS(0,yy); if(s.y<200||s.y>1500) continue; const big=(yy%1===0); ctx.beginPath(); ctx.moveTo(70,s.y); ctx.lineTo(big?96:84,s.y); ctx.stroke();
      if(big){ setFont(ctx,22,700,FB); ctx.fillStyle='rgba(255,255,255,0.7)'; ctx.textAlign='left'; ctx.textBaseline='middle'; ctx.fillText(`${Math.round(-yy)} км`,104,s.y); } }
    ctx.restore();
  }
}

function ovPunch(ctx,e,t){
  glowText(ctx,'САМОЕ СМЕШНОЕ',OW/2,TY-60,{size:58,weight:800,track:6,color:'#FFE3B0',glow:'rgba(255,150,50,.5)',glowR:24,alpha:sstep(63.5,63.8,t)*(1-sstep(64.5,64.8,t)),scale:lerp(0.85,1,eOutBack(clamp((t-63.5)/0.4)))});
  // НИКОГДА + crossed black hole icon
  const na=sstep(65.3,65.6,t)*(1-sstep(66.95,67.25,t));
  if(na>0){
    glowText(ctx,'СОЛНЦЕ',OW/2,TY-140,{size:34,weight:700,fam:FB,track:12,color:'#FFD9A0',glow:'rgba(0,0,0,.7)',glowR:12,alpha:na});
    kinetic(ctx,'НИКОГДА',OW/2,TY-30,{size:124,weight:900,color:'#FFF4E0',glow:'rgba(255,150,50,0.6)',glowR:34},(i)=>{const k=eOutBack(clamp((t-65.3-i*0.03)/0.4));return {s:lerp(1.5,1,k),a:na*clamp((t-65.3-i*0.03)/0.15),blur:(1-k)*10};});
    glowText(ctx,'не станет чёрной дырой',OW/2,TY+80,{size:42,weight:700,fam:FB,color:'#FFE6C8',glow:'rgba(0,0,0,.7)',glowR:12,alpha:na*sstep(65.8,66.1,t)});
  }
  // mass gauge
  const ma=sstep(67.2,67.5,t)*(1-sstep(71.1,71.45,t));
  if(ma>0){
    const y=TY-40, bx=150, bw=780;
    glowText(ctx,'МАССА ЗВЕЗДЫ',OW/2,y-110,{size:32,weight:700,fam:FB,track:12,color:'#E6EEFF',glow:'rgba(0,0,0,.7)',glowR:12,alpha:ma});
    ctx.save(); ctx.globalAlpha=ma;
    ctx.fillStyle='rgba(255,255,255,0.12)'; pill(ctx,bx,y-16,bw,32,16); ctx.fill();
    const sunW=bw/20;
    const fill=lerp(sunW,bw,eIO(clamp((t-68.95)/0.75)));
    const g=ctx.createLinearGradient(bx,0,bx+bw,0); g.addColorStop(0,'#FFB050'); g.addColorStop(0.3,'#FFE0A0'); g.addColorStop(1,'#8FB8FF');
    ctx.fillStyle=g; pill(ctx,bx,y-16,Math.max(32,fill*eOut(clamp((t-67.3)/0.4))),32,16); ctx.fill();
    // threshold mark
    ctx.strokeStyle='#FFFFFF'; ctx.lineWidth=3; ctx.beginPath(); ctx.moveTo(bx+bw,y-34); ctx.lineTo(bx+bw,y+34); ctx.stroke();
    setFont(ctx,26,700,FB); ctx.textAlign='left'; ctx.fillStyle='#FFD9A0'; ctx.fillText('Солнце',bx,y+66);
    ctx.textAlign='right'; ctx.fillStyle='#BFD4FF'; ctx.fillText('нужно для чёрной дыры',bx+bw,y+66);
    ctx.restore();
    const k=clamp((t-68.95)/0.75); const mult=Math.max(1,Math.round(lerp(1,20,eIO(k))));
    const pulse=t>69.7?Math.exp(-(t-69.7)*5):0;
    glowText(ctx,'×'+mult,OW/2,y+230,{size:200,weight:900,color:'#FFFFFF',glow:`rgba(130,170,255,${0.6+pulse*0.4})`,glowR:40+pulse*40,alpha:ma*sstep(68.7,69.0,t),scale:1+pulse*0.1});
    glowText(ctx,'минимум в 20 раз тяжелее',OW/2,y+360,{size:40,weight:700,fam:FB,color:'#CFE0FF',glow:'rgba(0,0,0,.8)',glowR:14,alpha:ma*sstep(69.8,70.1,t)});
  }
}

function ovEnd(ctx,e,t){
  const c=P(e,[0,0,0]);
  const a=sstep(71.5,71.8,t);
  ['ЧТО ЗАМЕНИМ','СЛЕДУЮЩИМ?'].forEach((w,li)=>{
    kinetic(ctx,w,OW/2,TY-60+li*120,{size:92,weight:900,color:li?'#FFD27A':'#FFFFFF',glow:li?'rgba(255,170,60,0.55)':'rgba(140,170,255,0.5)',glowR:30},riseAnim(t,71.5+li*0.25,0,0.03,{dy:70}));
  });
  if(c){
    const q=eOutBack(clamp((t-71.9)/0.6)); const pulse=0.5+0.5*Math.sin(t*3.2);
    ctx.save(); ctx.globalCompositeOperation='lighter';
    const g=ctx.createRadialGradient(c.x,c.y,0,c.x,c.y,260); g.addColorStop(0,`rgba(255,190,100,${0.35*q})`); g.addColorStop(1,'rgba(255,190,100,0)');
    ctx.fillStyle=g; ctx.beginPath(); ctx.arc(c.x,c.y,260,0,TAU); ctx.fill(); ctx.restore();
    glowText(ctx,'?',c.x,c.y,{size:300,weight:900,color:'#FFF2DC',glow:`rgba(255,170,60,${0.6+0.3*pulse})`,glowR:50+pulse*20,alpha:clamp((t-71.9)/0.3),scale:q});
  }
  // comment CTA
  const ca=sstep(73.1,73.4,t);
  if(ca>0){
    const k=eOutBack(clamp((t-73.1)/0.45));
    const y=1220, w=700, h=120;
    ctx.save(); ctx.globalAlpha=ca; ctx.translate(OW/2,y); ctx.scale(k,k);
    ctx.fillStyle='rgba(255,255,255,0.10)'; pill(ctx,-w/2,-h/2,w,h,60); ctx.fill();
    ctx.strokeStyle='rgba(255,210,140,0.7)'; ctx.lineWidth=2.5; pill(ctx,-w/2,-h/2,w,h,60); ctx.stroke();
    // bubble icon
    ctx.translate(-w/2+80,0);
    ctx.fillStyle='#FFD27A'; pill(ctx,-34,-28,68,50,16); ctx.fill(); ctx.beginPath(); ctx.moveTo(-14,20); ctx.lineTo(-22,36); ctx.lineTo(2,20); ctx.fill();
    ctx.fillStyle='#1A1206'; for(let i=0;i<3;i++){const b=0.5+0.5*Math.sin(t*8-i*0.9); ctx.globalAlpha=ca*(0.5+0.5*b); ctx.beginPath(); ctx.arc(-16+i*16,-3-b*3,5,0,TAU); ctx.fill();}
    ctx.globalAlpha=ca;
    setFont(ctx,44,800,FB); ctx.textAlign='left'; ctx.textBaseline='middle'; ctx.fillStyle='#FFFFFF'; ctx.fillText('Пиши в комментариях',60,2);
    ctx.restore();
  }
}
