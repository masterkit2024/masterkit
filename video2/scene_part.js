// ================= SCENE: «НИКТО НЕ СМОТРИТ» (тайминги = озвучка, видео смещено на +0.25с) =================
const OFFSET=.25, DUR=77.3;
const HE=CORAL, SHE=VIOLET;
const TEXTS=[
  {a:4.9,b:6.9,small:'И В ЭТОМ',big:[['ТВОЯ'],['СИЛА',MINT,5.6]]},
  {a:7.45,b:8.95,small:'ОН ГОД СОБИРАЛСЯ',big:[['В'],['ЗАЛ',ORANGE]]},
  {a:9.17,b:10.95,small:'БОЯЛСЯ:',big:[['ВСЕ'],['БУДУТ'],['РЖАТЬ',CORAL]]},
  {a:11.21,b:13.15,small:'ОНА МЕЧТАЛА',big:[['ПОЙТИ'],['НА'],['ТАНЦЫ',VIOLET]]},
  {a:13.42,b:15.4,big:[['«Я'],['ЖЕ'],['ДЕРЕВЯННАЯ.'],['ЗАСМЕЮТ»',CORAL,14.45]]},
  {a:15.84,b:16.95,big:[['ОН'],['ПРИШЁЛ.',ORANGE]]},
  {a:17.23,b:19.65,big:[['ВСЕ'],['ПЯЛИЛИСЬ…'],['В',,18.45],['ТЕЛЕФОНЫ',BLUE,18.6]]},
  {a:19.99,b:21.55,small:'ОНА ВЫШЛА',big:[['В'],['ЦЕНТР'],['ЗАЛА',VIOLET]]},
  {a:21.8,b:24.4,big:[['ВСЕ'],['СМОТРЕЛИ…'],['НА',,23.23],['СЕБЯ',MINT,23.38]]},
  {a:24.91,b:25.98,big:[['ЭТО'],['НЕ'],['СОВПАДЕНИЕ',BLUE]]},
  {a:26.22,b:30.75,small:'ЭКСПЕРИМЕНТ',big:[['САМАЯ'],['НЕЛЕПАЯ'],['ФУТБОЛКА',ORANGE,27.6]]},
  {a:31.04,b:32.75,small:'ОН БЫЛ УВЕРЕН',big:[['ЗАМЕТЯТ'],['ВСЕ',CORAL,31.9]]},
  {a:33.12,b:35.3,small:'ЗАМЕТИЛ ОТ СИЛЫ',big:[['КАЖДЫЙ'],['ЧЕТВЁРТЫЙ',MINT,33.9]]},
  {a:35.64,b:37.25,big:[['ЛЮДЯМ'],['НЕ'],['ДО'],['ТЕБЯ',BLUE]]},
  {a:37.56,b:40.85,small:'У НИХ',big:[['СВОЙ',,37.56],['СТРАХ.',,37.72],['СВОИ',,38.79],['ПРЫЩИ.',,38.95],['СВОИ',,39.82],['ЛАЙКИ.',CORAL,39.98]]},
  {a:41.18,b:42.3,big:[['ЭТО'],['НЕ'],['ОБИДНО.']]},
  {a:42.52,b:43.95,small:'ЭТО',big:[['СВОБОДА',MINT]]},
  {a:44.09,b:45.95,big:[['ХОЧЕШЬ'],['ПЕТЬ'],['—'],['ПОЙ',VIOLET,45.25]]},
  {a:46.08,b:47.98,big:[['ХОЧЕШЬ'],['СНИМАТЬ'],['—'],['СНИМАЙ',CORAL,47.32]]},
  {a:48.12,b:50.3,small:'НАПИШИ',big:[['ПЕРВОЙ.',VIOLET,48.3],['ПЕРВЫМ.',ORANGE,49.6]]},
  {a:50.47,b:52.95,small:'НАДЕНЬ ТО, ЧТО',big:[['ДАВНО'],['ЛЕЖИТ'],['В'],['ШКАФУ',YELLOW]]},
  {a:53.44,b:54.45,big:[['ПРОВАЛИШЬСЯ?',CORAL]]},
  {a:54.7,b:56.35,small:'ЧЕРЕЗ ДЕНЬ',big:[['НИКТО'],['НЕ'],['ВСПОМНИТ',MINT]]},
  {a:56.54,b:60.65,small:'А ВОТ',big:[['«А'],['ЧТО,'],['ЕСЛИ'],['БЫ…»',CORAL],['ГОДАМИ',VIOLET,59.6]]},
  {a:61.09,b:63.25,small:'ЧЕРЕЗ ГОД',big:[['ОН'],['—'],['ДРУГОЙ'],['ЧЕЛОВЕК',ORANGE]]},
  {a:63.45,b:65.0,small:'ОНА',big:[['ТАНЦУЕТ'],['НА'],['СЦЕНЕ',VIOLET]]},
  {a:65.17,b:69.1,small:'А ТЕ, КОГО ОНИ БОЯЛИСЬ',big:[['ДО',,67.2],['СИХ',,67.35],['ПОР',,67.5],['ЛИСТАЮТ',,67.7],['ЛЕНТУ',BLUE,67.95]]},
  {a:69.54,b:71.1,small:'ТАК ЧТО',big:[['РАССЛАБЬ'],['ПЛЕЧИ',MINT]]},
  {a:71.3,b:72.5,big:[['НИКТО'],['НЕ'],['СМОТРИТ.']]},
  {a:72.7,b:74.6,small:'ЗНАЧИТ,',big:[['НИКТО'],['НЕ'],['ПОМЕШАЕТ',BLUE]]},
  {a:75.04,b:99,big:[['НАЧИНАЙ','RAINBOW']]},
];
const K=(t,x,z,r=0,y)=>({t,x,z,r,y:y??-213/z});
const CAM=[
  K(0,0,1.5,.01),K(4.8,0,1.62,-.008),K(5.25,0,1.95,0),K(7.2,0,2.05,.008),
  K(7.7,3050,1.6,-.01),K(10.9,3050,1.8,.008),
  K(11.45,6000,1.6,.01),K(15.3,6000,1.8,-.008),
  K(15.95,3800,1.5,0),K(17.2,3800,1.62,.006),K(18.45,3800,1.25,-.008),K(19.7,3800,1.3,0),
  K(20.25,6800,1.5,.01),K(21.8,6800,1.58,0),K(23.2,6800,1.22,-.008),K(24.5,6800,1.28,0),
  K(25.15,9500,1.4,.008,-300),K(26.2,9380,1.75,0),K(29.5,9380,1.85,.008),K(30.6,9680,1.15,0,-200),K(32.9,9680,1.2,-.006,-200),K(33.3,9680,1.1,0,-220),K(35.25,9680,1.15,.006,-220),
  K(35.85,12500,1.35,0),K(41.0,12500,1.42,.008),K(42.5,12500,1.7,0),K(43.4,12500,1.2,-.01),K(43.95,12500,1.25,0),
  K(44.3,15500,1.8,.01),K(45.95,15500,1.95,0),K(46.3,16130,1.8,-.01),K(47.98,16150,1.9,0),
  K(48.35,16700,1.6,.008),K(50.3,16700,1.72,0),K(50.7,17330,1.6,-.008),K(52.95,17330,1.72,.006),
  K(53.55,19450,1.5,0),K(56.3,19450,1.6,.008),K(56.95,19820,1.3,0,-230),K(60.65,19820,1.4,-.008,-220),
  K(61.35,22280,1.6,.01),K(63.25,22300,1.72,0),K(63.7,22850,1.35,-.008,-260),K(65.0,22850,1.42,0,-260),K(66.1,22700,0.95,.006,-300),K(69.1,22700,1.0,0,-300),
  K(69.8,25500,1.8,0),K(72.6,25540,1.7,.008),K(73.2,25660,1.2,0),K(74.9,25660,1.25,-.006),K(75.45,25880,1.5,0),K(77.3,25900,1.62,.01),
];
const SHAKES=[[0.05,30],[4.95,14],[42.55,24],[45.25,10],[47.32,8],[53.65,12],[75.08,22]];
const BLOBS=[];{const reg=[[0,[CORAL,VIOLET,YELLOW]],[3400,[ORANGE,BLUE,MINT]],[6400,[VIOLET,MINT,CORAL]],[9600,[YELLOW,BLUE,CORAL]],[12500,[MINT,VIOLET,ORANGE]],[15500,[VIOLET,YELLOW,CORAL]],[17000,[BLUE,MINT,ORANGE]],[19600,[CORAL,BLUE,VIOLET]],[22600,[VIOLET,ORANGE,YELLOW]],[25600,[MINT,CORAL,BLUE]]];
  for(const[X,cols]of reg){cols.forEach((c,i)=>BLOBS.push([X*.3+(i-1)*380,-200-((i*37)%3)*260,560,c]));}}
function satAt(t){if(t<4.9)return .55;if(t<7.4)return 1;if(t<42.52)return .4;return lerp(.4,1,eout(prog(t,42.52,43.3)));}
const FEAR=t=>t>7.4&&t<42.6?.3*(1-eout(prog(t,42.52,42.9))):0;
function camFull(t){const c={...camAt(CAM,t)};
  c.x+=Math.sin(t*.53)*7/c.z;c.y+=Math.cos(t*.41)*6/c.z;c.r+=Math.sin(t*.29)*.004;
  for(const[t0,a]of SHAKES){if(t<t0||t>t0+.7)continue;const d=Math.exp(-(t-t0)*7)*a/c.z;c.x+=Math.sin((t-t0)*70)*d;c.y+=Math.cos((t-t0)*83)*d;}
  return c;}

// ---------- помощники ----------
function figPhone(x,o={}){fig(x,0,o);const k=(o.k??1)*(o.s||1);if(k<=.05)return;ctx.save();ctx.translate(x,0);ctx.scale(k,k);ctx.globalAlpha=o.a??1;
  const g=ctx.createRadialGradient(0,-120,0,0,-120,70);g.addColorStop(0,'rgba(90,150,255,.35)');g.addColorStop(1,'rgba(90,150,255,0)');ctx.fillStyle=g;ctx.fillRect(-70,-190,140,140);
  ctx.fillStyle=INK;rr(-13,-78,26,44,6);ctx.fill();ctx.fillStyle='#8FB8FF';rr(-10,-75,20,36,4);ctx.fill();ctx.restore();}
function strike(x,y,w,k){if(k<=0)return;ctx.save();ctx.strokeStyle=CORAL;ctx.lineWidth=14;ctx.lineCap='round';ctx.shadowColor=CORAL+'77';ctx.shadowBlur=16;
  ctx.beginPath();ctx.moveTo(x-w/2,y+w*.18);ctx.lineTo(x-w/2+w*eout(k),y+w*.18-w*.36*eout(k));ctx.stroke();ctx.restore();}
function frameCard(x,y,k,rot,fn){if(k<=0)return;ctx.save();ctx.translate(x,y);ctx.rotate(rot);ctx.scale(k,k);ctx.fillStyle='#fff';ctx.shadowColor='rgba(0,0,0,.14)';ctx.shadowBlur=36;ctx.shadowOffsetY=14;rr(-150,-150,300,300,32);ctx.fill();ctx.shadowColor='transparent';fn();ctx.restore();}
function thought(x,y,w,h,k,fn,col='#F3F4F6',stroke='#D5D8DD'){if(k<=0)return;ctx.save();ctx.translate(x,y);ctx.scale(k,k);ctx.fillStyle=col;ctx.strokeStyle=stroke;ctx.lineWidth=4;
  const R=rnd(3);ctx.beginPath();for(let i=0;i<12;i++){const a=i/12*6.283;ctx.moveTo(Math.cos(a)*w/2+h*.28,Math.sin(a)*h/2);ctx.arc(Math.cos(a)*w/2*.86,Math.sin(a)*h/2*.8,h*.28+R()*10,0,6.283);}ctx.fill();
  ctx.beginPath();ctx.ellipse(0,0,w/2*.92,h/2*.85,0,0,6.283);ctx.fill();
  for(const[dx,dy,r]of[[-w*.18,h*.62,14],[-w*.25,h*.8,8]]){ctx.beginPath();ctx.arc(dx,dy,r,0,6.283);ctx.fill();ctx.stroke();}
  fn();ctx.restore();}
function door(x,label,open,col=ORANGE){ctx.save();ctx.translate(x,0);ctx.fillStyle=INK+'12';rr(-80,-270,160,270,[12,12,0,0]);ctx.fill();
  ctx.fillStyle=col;rr(-70,-300,140,40,10);ctx.fill();ctx.fillStyle='#fff';ctx.font=`900 26px ${FONT}`;ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText(label,0,-279);
  ctx.save();ctx.translate(-70,0);ctx.scale(1-.8*open,1);ctx.fillStyle='#fff';ctx.strokeStyle=GREY;ctx.lineWidth=5;rr(0,-255,140,255,[8,8,0,0]);ctx.fill();ctx.stroke();ctx.fillStyle=GREY;ctx.beginPath();ctx.arc(118,-128,8,0,6.283);ctx.fill();ctx.restore();
  if(open>0){ctx.globalAlpha=open*.5;const g=ctx.createLinearGradient(0,-255,0,0);g.addColorStop(0,YELLOW+'00');g.addColorStop(1,YELLOW+'88');ctx.fillStyle=g;ctx.fillRect(-70,-255,140,255);}
  ctx.restore();}
function barbell(x,y,rot=0,s=1){ctx.save();ctx.translate(x,y);ctx.rotate(rot);ctx.scale(s,s);ctx.strokeStyle=INK;ctx.lineWidth=8;ctx.lineCap='round';ctx.beginPath();ctx.moveTo(-150,0);ctx.lineTo(150,0);ctx.stroke();
  for(const sx of[-1,1]){ctx.fillStyle=sx<0?CORAL:BLUE;rr(sx*120-14,-46,28,92,8);ctx.fill();ctx.fillStyle=sx<0?ORANGE:VIOLET;rr(sx*100-10,-34,20,68,6);ctx.fill();}ctx.restore();}
function rack(x){ctx.save();ctx.strokeStyle='#C9CED6';ctx.lineWidth=10;ctx.lineCap='round';for(const dx of[-110,110]){ctx.beginPath();ctx.moveTo(x+dx,0);ctx.lineTo(x+dx,-200);ctx.stroke();}ctx.restore();}
function chains(x,t,tb,seed){const n=11;if(t<tb){ctx.save();ctx.strokeStyle='#9AA0AA';ctx.lineWidth=6;for(let i=0;i<n;i++){const a=i/n*6.283+t*.4;const px=x+Math.cos(a)*62,py=-62+Math.sin(a)*18;
    ctx.globalAlpha=Math.sin(a)>0?1:.6;ctx.beginPath();ctx.ellipse(px,py,13,8,a,0,6.283);ctx.stroke();}ctx.restore();return;}
  const dt=t-tb;if(dt>1.2)return;const R=rnd(seed);ctx.save();ctx.strokeStyle='#9AA0AA';ctx.lineWidth=6;ctx.globalAlpha=1-dt/1.2;
  for(let i=0;i<n;i++){const a=i/n*6.283,v=300+R()*300;ctx.beginPath();ctx.ellipse(x+Math.cos(a)*(62+v*dt),-62+Math.sin(a)*18-200*dt+700*dt*dt,13,8,a+dt*8,0,6.283);ctx.stroke();}ctx.restore();}
function chat(x,y,k,text,col,fromRight){if(k<=0)return;ctx.save();ctx.translate(x,y);ctx.scale(k,k);ctx.font=`900 24px ${FONT}`;const w=ctx.measureText(text).width+70;
  ctx.fillStyle=col;ctx.shadowColor=col+'66';ctx.shadowBlur=20;rr(-w/2,-30,w,60,26);ctx.fill();ctx.shadowColor='transparent';
  ctx.fillStyle='#fff';ctx.textAlign='left';ctx.textBaseline='middle';ctx.fillText(text,-w/2+20,1);ctx.font=`900 18px ${FONT}`;ctx.fillText('✓✓',w/2-40,6);ctx.restore();}
function micIcon(x,y,s){ctx.save();ctx.translate(x,y);ctx.scale(s,s);ctx.fillStyle=INK;rr(-6,0,12,46,6);ctx.fill();ctx.fillStyle='#9AA0AA';ctx.beginPath();ctx.arc(0,-6,18,0,6.283);ctx.fill();
  ctx.strokeStyle='#C4C8CF';ctx.lineWidth=2;for(let i=-12;i<=12;i+=6){ctx.beginPath();ctx.moveTo(i,-22);ctx.lineTo(i,10);ctx.stroke();}ctx.restore();}
function camera(x,t,rec){ctx.save();ctx.translate(x,0);ctx.strokeStyle=INK;ctx.lineWidth=6;ctx.beginPath();ctx.moveTo(0,-150);ctx.lineTo(-40,0);ctx.moveTo(0,-150);ctx.lineTo(40,0);ctx.moveTo(0,-150);ctx.lineTo(0,0);ctx.stroke();
  ctx.fillStyle=INK;rr(-60,-215,110,70,14);ctx.fill();ctx.fillStyle='#3B4150';ctx.beginPath();ctx.arc(-75,-180,26,0,6.283);ctx.fill();ctx.fillStyle='#8FB8FF';ctx.beginPath();ctx.arc(-75,-180,14,0,6.283);ctx.fill();
  if(rec>0){const on=Math.sin(t*10)>-.3;ctx.fillStyle=on?CORAL:'#5A1020';ctx.beginPath();ctx.arc(30,-200,9,0,6.283);ctx.fill();
    ctx.globalAlpha=clamp(rec);ctx.fillStyle=CORAL;rr(-50,-270,110,40,12);ctx.fill();ctx.fillStyle='#fff';ctx.font=`900 22px ${FONT}`;ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText('● REC',5,-249);}
  ctx.restore();}
function wardrobe(x,open){ctx.save();ctx.translate(x,0);ctx.fillStyle='#E9DCCB';rr(-110,-330,220,330,14);ctx.fill();ctx.fillStyle='#D9C6AE';ctx.fillRect(-100,-320,200,310);
  ctx.strokeStyle='#B9A58C';ctx.lineWidth=4;ctx.beginPath();ctx.moveTo(-90,-280);ctx.lineTo(90,-280);ctx.stroke();
  [[-60,BLUE],[-10,MINT],[40,YELLOW]].forEach(([dx,c])=>{ctx.fillStyle=c;ctx.beginPath();ctx.moveTo(dx-26,-270);ctx.lineTo(dx+26,-270);ctx.lineTo(dx+30,-180);ctx.lineTo(dx-30,-180);ctx.closePath();ctx.fill();});
  for(const sd of[-1,1]){ctx.save();ctx.translate(sd*110,0);ctx.scale(1-.85*open,1);ctx.fillStyle='#F2E6D6';ctx.strokeStyle='#C9B59C';ctx.lineWidth=4;rr(sd<0?0:-110,-330,110,330,[10,10,0,0]);ctx.fill();ctx.stroke();
    ctx.fillStyle='#B9A58C';ctx.beginPath();ctx.arc(sd<0?94:-94,-170,7,0,6.283);ctx.fill();ctx.restore();}
  ctx.restore();}
function mirrorWall(x0,x1){ctx.save();const g=ctx.createLinearGradient(x0,-420,x1,0);g.addColorStop(0,'#EAF3FF');g.addColorStop(1,'#F3EEFF');ctx.fillStyle=g;rr(x0,-420,x1-x0,400,10);ctx.fill();
  ctx.strokeStyle='#fff';ctx.lineWidth=10;for(let x=x0+60;x<x1;x+=170){ctx.beginPath();ctx.moveTo(x,-400);ctx.lineTo(x+70,-260);ctx.stroke();}
  ctx.strokeStyle='#D7DDEA';ctx.lineWidth=4;for(let x=x0;x<=x1;x+=(x1-x0)/4){ctx.beginPath();ctx.moveTo(x,-420);ctx.lineTo(x,-20);ctx.stroke();}ctx.restore();}
function spotlight(x,top,k){if(k<=0)return;ctx.save();ctx.globalAlpha=k;const g=ctx.createLinearGradient(0,top,0,top+700);g.addColorStop(0,'#FFE9A8cc');g.addColorStop(1,'#FFE9A800');ctx.fillStyle=g;
  ctx.beginPath();ctx.moveTo(x-30,top);ctx.lineTo(x+30,top);ctx.lineTo(x+170,top+700);ctx.lineTo(x-170,top+700);ctx.closePath();ctx.fill();ctx.restore();}
function flask(x,y,k){if(k<=0)return;ctx.save();ctx.translate(x,y);ctx.scale(k,k);ctx.fillStyle=BLUE;ctx.shadowColor=BLUE+'66';ctx.shadowBlur=24;ctx.beginPath();ctx.arc(0,0,70,0,6.283);ctx.fill();ctx.shadowColor='transparent';
  ctx.fillStyle='#fff';ctx.beginPath();ctx.moveTo(-12,-40);ctx.lineTo(12,-40);ctx.lineTo(12,-10);ctx.lineTo(36,32);ctx.lineTo(-36,32);ctx.lineTo(-12,-10);ctx.closePath();ctx.fill();
  ctx.fillStyle=MINT;ctx.beginPath();ctx.moveTo(-26,16);ctx.lineTo(26,16);ctx.lineTo(36,32);ctx.lineTo(-36,32);ctx.closePath();ctx.fill();ctx.restore();}
function strongArmsBar(x,y,t,lift){const by=lerp(-90,-225,lift)+Math.sin(t*3)*4*lift;ctx.save();ctx.strokeStyle=CORAL;ctx.lineWidth=20;ctx.lineCap='round';
  for(const sd of[-1,1]){ctx.beginPath();ctx.moveTo(x+sd*42,-70);ctx.quadraticCurveTo(x+sd*85,lerp(-70,-130,lift),x+sd*70,by);ctx.stroke();}ctx.restore();barbell(x,by,0,1);}

// ---------- A: хук ----------
function drawA(t){const X=0;
  [-330,-200,200,330].forEach((dx,i)=>figPhone(X+dx,{k:back(prog(t,-.33+i*.04,.0+i*.04)),s:.9}));
  [-265,265].forEach((dx,i)=>figPhone(X+dx,{k:back(prog(t,.3+i*.06,.65+i*.06)),s:.7,a:.6}));
  // карточки: кто ты / как выглядишь / что надето
  const cards=[[-0.3,1.55,'id'],[1.64,3.35,'mirror'],[3.47,4.8,'shirt']];
  cards.forEach(([a,b,kind],i)=>{const k=back(prog(t,a,a+.35))*(1-eio(prog(t,b,b+.2)));if(k<=0)return;
    frameCard(X,-380,k,(i-1)*.05,()=>{
      if(kind==='id'){ctx.fillStyle='#F1F3F6';rr(-120,-110,240,170,18);ctx.fill();ctx.save();ctx.translate(-55,40);ctx.scale(.45,.45);ctx.fillStyle=GREY;personPath();ctx.fill();ctx.beginPath();ctx.arc(0,-132,33,0,6.283);ctx.fill();ctx.restore();
        ctx.fillStyle='#D5D8DD';rr(10,-60,90,14,7);ctx.fill();rr(10,-30,70,14,7);ctx.fill();ctx.fillStyle=SOFT;ctx.font=`900 30px ${FONT}`;ctx.textAlign='center';ctx.fillText('КТО ТЫ?',0,115);}
      if(kind==='mirror'){ctx.fillStyle='#EAF3FF';ctx.strokeStyle='#C9B59C';ctx.lineWidth=10;ctx.beginPath();ctx.ellipse(0,-10,90,120,0,0,6.283);ctx.fill();ctx.stroke();
        ctx.save();ctx.beginPath();ctx.ellipse(0,-10,85,115,0,0,6.283);ctx.clip();ctx.translate(0,105);ctx.scale(.6+.12*Math.sin(t*6),.55-.08*Math.sin(t*6));ctx.fillStyle=HE+'aa';personPath();ctx.fill();ctx.beginPath();ctx.arc(0,-132,33,0,6.283);ctx.fill();ctx.restore();
        ctx.fillStyle=SOFT;ctx.font=`900 26px ${FONT}`;ctx.textAlign='center';ctx.fillText('ВНЕШНОСТЬ',0,138);}
      if(kind==='shirt'){ctx.strokeStyle=INK;ctx.lineWidth=6;ctx.beginPath();ctx.moveTo(0,-110);ctx.lineTo(0,-90);ctx.moveTo(-70,-60);ctx.lineTo(0,-90);ctx.lineTo(70,-60);ctx.stroke();
        ctx.fillStyle=YELLOW;ctx.beginPath();ctx.moveTo(-40,-75);ctx.lineTo(-95,-45);ctx.lineTo(-75,-5);ctx.lineTo(-50,-20);ctx.lineTo(-50,90);ctx.lineTo(50,90);ctx.lineTo(50,-20);ctx.lineTo(75,-5);ctx.lineTo(95,-45);ctx.lineTo(40,-75);ctx.quadraticCurveTo(0,-50,-40,-75);ctx.fill();
        ctx.fillStyle=SOFT;ctx.font=`900 26px ${FONT}`;ctx.textAlign='center';ctx.fillText('ОДЕЖДА',0,130);}
    });
    strike(X,-380,320,prog(t,a+.55,a+.8));});
  // герои вспыхивают
  const hk=back(prog(t,4.9,5.3));
  if(hk>0){heroX({x:X-75,y:0,s:hk,color:HE,mood:'firm',look:.6},t);heroX({x:X+75,y:0,s:hk,color:SHE,girl:true,mood:'happy',look:-.6},t);}
  rings(X,-110,t,4.95,420);confetti(X,-150,t,5.6,90,4,.8);
}
// ---------- B: зал ----------
function drawB(t){const X=3050;
  door(X+170,'ЗАЛ',0);
  const days=Math.round(1+364*eout(prog(t,7.6,9.0)));card(X+170,-370,'СОБИРАЮСЬ',days+' ДН.',popK(t,7.6,9.1),ORANGE);
  const tk=popK(t,9.2,10.95);thought(X-70,-420,330,190,tk,()=>{for(let i=0;i<4;i++){ctx.save();ctx.translate(-105+i*70,50);ctx.scale(.32,.32);ctx.strokeStyle=GREY;ctx.lineWidth=12;personPath();ctx.stroke();ctx.beginPath();ctx.arc(0,-132,30,0,6.283);ctx.stroke();ctx.restore();}
    ctx.fillStyle=CORAL;ctx.font=`900 30px ${FONT}`;ctx.textAlign='center';ctx.fillText('ХА-ХА!',Math.sin(t*20)*3,-35);});
  heroX({x:X-70,y:0,color:mix(HE,DULL,FEAR(t)),mood:t<9.2?'neutral':'sad',look:t<9.2?1:0,sy:1-.06*ss(t,9.2,9.6)},t);
}
// ---------- C: танцы ----------
function drawC(t){const X=6000;
  const pk=popK(t,11.25,15.4);if(pk>0){ctx.save();ctx.translate(X+180,-300);ctx.scale(pk,pk);ctx.rotate(.04);ctx.fillStyle=VIOLET;ctx.shadowColor=VIOLET+'66';ctx.shadowBlur=24;rr(-110,-140,220,280,22);ctx.fill();ctx.shadowColor='transparent';
    ctx.fillStyle='#fff';ctx.font=`900 40px ${FONT}`;ctx.textAlign='center';ctx.fillText('ТАНЦЫ',0,-70);icon('note',0,20,48,PINKISH(),t);ctx.font=`800 18px ${FONT}`;ctx.fillText('НАБОР ОТКРЫТ',0,105);ctx.restore();}
  ctx.strokeStyle=INK;ctx.lineWidth=6;if(pk>0){ctx.beginPath();ctx.moveTo(X+180,-160*1);ctx.lineTo(X+180,0);ctx.stroke();}
  const wood=t>13.42?1:0;
  const tk=popK(t,14.45,15.4);bubble(X-60,-250,'ЗАСМЕЮТ',tk,BUB.neg,1.3);
  const wob=wood?Math.sin(t*14)*.05:0;
  heroX({x:X-60,y:0,color:mix(SHE,DULL,FEAR(t)),girl:true,mood:t<13.42?'happy':'sad',look:t<13.42?1:0,lean:wob,sx:wood?.86:1,sy:wood?1.04:1,swing:0},t);
  if(wood&&t<15.4){ctx.save();ctx.globalAlpha=.5;ctx.strokeStyle='#C9A77A';ctx.lineWidth=3;for(let i=0;i<4;i++){ctx.beginPath();ctx.moveTo(X-90+i*18,-10);ctx.lineTo(X-86+i*18,-80);ctx.stroke();}ctx.restore();}
}
function PINKISH(){return CORAL;}
// ---------- B2: в зале ----------
function drawB2(t){const X=3800;
  rack(X);const crowd=[-330,-200,200,330];
  const ph=t>18.45;
  crowd.forEach((dx,i)=>{if(ph)figPhone(X+dx,{k:1,s:.95});else fig(X+dx,0,{s:.95,lean:Math.sin(t*2+i)*.02});});
  if(t>18.5){['ЛАЙК','СТОРИС','ЧАТ','ЛЕНТА'].forEach((s,i)=>bubble(X+crowd[i]*.85,-200-(i%2)*44,s,popK(t,18.6+i*.08,19.9),BUB.info));}
  const lift=ss(t,16.0,16.8);
  heroX({x:X,y:0,color:mix(HE,DULL,FEAR(t)*(1-ss(t,18.6,19.2))),mood:t<17.2?'firm':t<18.6?'wow':'happy',look:t<18.6&&t>17.2?Math.sin(t*3):0},t);
  barbell(X,-60-lift*20,0,.9);
}
// ---------- C2: студия ----------
function drawC2(t){const X=6800;
  mirrorWall(X-560,X+560);
  const ppl=[-330,-200,200,330];
  ppl.forEach((dx,i)=>{fig(X+dx,0,{s:.95,lean:Math.sin(t*3+i)*.03});
    // отражение
    ctx.save();ctx.globalAlpha=.35;fig(X+dx*1.05,-40,{s:.6,col:'#AFC3E6'});ctx.restore();});
  if(t>23.3){['МОЯ ЧЁЛКА','МОЙ ПРЕСС','МОИ НОГИ','МОЙ НОС'].forEach((s,i)=>bubble(X+ppl[i]*.82,-200-(i%2)*48,s,popK(t,23.4+i*.08,24.5),BUB.info,.9));}
  const dance=ss(t,20.2,20.6);
  heroX({x:X,y:-Math.abs(Math.sin(t*6))*14*dance,color:mix(SHE,DULL,FEAR(t)*(1-ss(t,23.3,23.9))),girl:true,mood:t<21.8?'firm':t<23.3?'wow':'happy',lean:Math.sin(t*6)*.08*dance,swing:Math.sin(t*6)*.3},t);
}
// ---------- D: эксперимент ----------
const AUD=[[9560,-55,.72,.55],[9680,-55,.72,.55],[9800,-55,.72,.55],[9920,-55,.72,.55],[9500,0,.9,1],[9620,0,.9,1],[9740,0,.9,1],[9860,0,.9,1]];
function drawD(t){
  flask(9500,-480,popK(t,24.95,26.1));
  // аудитория
  AUD.forEach(([x,y,s,a],i)=>{ctx.save();ctx.translate(0,y);if(t>33.1&&(i!==1&&i!==6))figPhone(x,{s,a});else fig(x,0,{s,a});ctx.restore();});
  // ожидание: все смотрят (призрачные глаза)
  if(t>31.0&&t<33.3){const k=popK(t,31.1,33.1);AUD.forEach(([x,y,s],i)=>{ctx.save();ctx.globalAlpha=.8;bubble(x,y-170*s,'!',k*(.9),BUB.warn,.8);ctx.restore();});}
  if(t>33.1){[1,6].forEach((i,j)=>{const[x,y,s]=AUD[i];bubble(x,y-170*s,'?',popK(t,33.3+j*.15,35.3),BUB.info,.9);});}
  // график
  const gk=popK(t,31.2,35.3);if(gk>0){ctx.save();ctx.translate(9520,-560);ctx.scale(gk,gk);ctx.fillStyle='#fff';ctx.shadowColor='rgba(0,0,0,.12)';ctx.shadowBlur=24;rr(-150,-150,300,230,22);ctx.fill();ctx.shadowColor='transparent';
    const h1=150*eout(prog(t,31.4,32.0)),h2=150*.25*eout(prog(t,33.3,33.9));
    ctx.fillStyle=CORAL;rr(-110,40-h1,90,h1,[10,10,0,0]);ctx.fill();ctx.fillStyle=MINT;if(h2>1){rr(20,40-h2,90,h2,[10,10,0,0]);ctx.fill();}
    ctx.font=`800 16px ${FONT}`;ctx.letterSpacing='2px';ctx.textAlign='center';ctx.fillStyle=SOFT;ctx.fillText('ДУМАЛ',-65,66);ctx.fillText('НА ДЕЛЕ',65,66);
    if(t>33.5){ctx.fillStyle=MINT;ctx.font=`900 30px ${FONT}`;ctx.fillText('1 ИЗ 4',65,30-h2);}ctx.restore();}
  // студент
  const sk=back(prog(t,26.25,26.6));const sx=lerp(9330,9330,0);
  const walk=prog(t,29.7,30.6);const px=lerp(9330,9380,walk);
  if(sk>0)heroX({x:px,y:walk>0&&walk<1?-Math.abs(Math.sin(t*16))*10:0,s:sk,color:YELLOW,shirt:true,mood:t<31?'neutral':t<33.1?'sad':'wow',look:1,sy:t>31&&t<33.1?.92:1},t);
}
// ---------- E: людям не до тебя ----------
function drawE(t){const X=12500,cr=[-300,-185,185,300];
  cr.forEach((dx,i)=>fig(X+dx,0,{s:.85,a:.85}));
  const B=[['МОЙ СТРАХ',37.56],['МОЙ ПРЫЩ',38.79],['МОИ ЛАЙКИ',39.82],['МОЙ БЫВШИЙ',40.15]];
  B.forEach(([s,a],i)=>bubble(X+cr[[0,3,1,2][i]]*.72,-175-(i>=2?62:0),s,popK(t,a,41.2)*(1-.3*ss(t,41.2,41.4)),BUB.neg,.95));
  const brk=42.55,fr=FEAR(t);
  const pop=1+.15*bump(t,42.55,.5);
  heroX({x:X-70,y:0,s:pop,color:mix(HE,DULL,fr),mood:t<41.2?'sad':t<42.55?'neutral':'happy',look:t>41.2&&t<42.5?1:0},t);
  heroX({x:X+70,y:0,s:pop,color:mix(SHE,DULL,fr),girl:true,mood:t<41.2?'sad':t<42.55?'neutral':'happy',look:t>41.2&&t<42.5?-1:0},t);
  chains(X-70,t,brk,1);chains(X+70,t,brk,2);
  rings(X,-110,t,42.55,520);confetti(X,-180,t,42.6,140,9);
}
// ---------- F: действия ----------
function drawF(t){
  // петь
  let X=15500;const notesK=prog(t,45.25,46.3);
  heroX({x:X,y:-Math.abs(Math.sin(t*5))*8,girl:true,color:SHE,mood:t<45.25?'happy':'laugh',eyes:t>45.25?'closed':'open',lean:Math.sin(t*4)*.05},t);
  micIcon(X+40,-95,1.1);
  if(t>45.2&&t<46.4){for(let i=0;i<9;i++){const a=-Math.PI/2+(i-4)*.32,d=60+notesK*300;icon(i%2?'note':'heart',X+40+Math.cos(a)*d,-120+Math.sin(a)*d,26,PAL[i%6],t,(1-notesK)*1.3);}}
  // снимать
  X=16130;camera(X+150,t,popK(t,47.32,48.2));heroX({x:X-40,y:0,color:HE,mood:t<47.32?'firm':'happy',look:1},t);
  rings(X+130,-200,t,47.32,200);
  // написать
  X=16700;heroX({x:X-120,y:0,girl:true,color:SHE,mood:'happy',look:1},t);heroX({x:X+120,y:0,color:HE,mood:t<49.5?'neutral':'happy',look:-1},t);
  const p1=eio(prog(t,48.4,49.0));if(t>48.35&&t<50.5)chat(lerp(X-110,X+40,p1),-260-Math.sin(p1*Math.PI)*60,back(prog(t,48.35,48.6)),'ПРИВЕТ!',VIOLET);
  const p2=eio(prog(t,49.6,50.2));if(t>49.55&&t<50.5)chat(lerp(X+110,X-40,p2),-360-Math.sin(p2*Math.PI)*60,back(prog(t,49.55,49.8)),'ПРИВЕТ!',ORANGE);
  if(t>50.0&&t<50.6){for(let i=0;i<5;i++){const ph=prog(t,50.0+i*.05,50.5+i*.05);ctx.globalAlpha=1-ph;ctx.fillStyle=CORAL;heartPath(X+Math.sin(i*2)*80,-220-ph*160,14);ctx.fill();}ctx.globalAlpha=1;}
  // шкаф
  X=17330;const op=eout(prog(t,50.7,51.1));wardrobe(X+120,op);
  const ofl=prog(t,51.15,51.6);if(ofl>0&&ofl<1){ctx.save();ctx.translate(lerp(X+120,X-90,eio(ofl)),-230-Math.sin(ofl*Math.PI)*120);ctx.rotate(ofl*6);ctx.fillStyle=YELLOW;rr(-30,-30,60,60,10);ctx.fill();ctx.restore();}
  heroX({x:X-90,y:-80*bump(t,51.6,.5),ground:0,girl:true,color:SHE,outfit:ss(t,51.55,51.75),mood:t<51.6?'neutral':'happy',look:1,lean:.08*Math.sin((t-51.6)*8)*clamp(prog(t,51.6,52.8)),swing:Math.sin(t*7)*.3},t);
  burst(X-90,-120,t,51.6,'PAL',22,520,5);
}
// ---------- G: провал ----------
function drawG(t){const X=19450;
  ctx.fillStyle='#D7DAE0';rr(X+10,-40,60,40,8);ctx.fill();
  const run=prog(t,53.4,53.65);let fall=ss(t,53.62,53.85)*(1-ss(t,55.3,55.7));
  const hx=lerp(X-120,X+40,run);
  [-260,240].forEach((dx,i)=>{if(t<56.3)fig(X+dx,0,{s:.85,a:1-prog(t,55.8,56.3)});bubble(X+dx*.9,-175,'?',popK(t,53.9+i*.1,55.0),BUB.neg,1);});
  card(X+20,-420,'ПРОШЁЛ','+1 ДЕНЬ',popK(t,54.75,56.3),MINT);
  ctx.save();ctx.translate(hx,0);ctx.rotate(fall*1.35);heroX({x:0,y:0,color:HE,mood:fall>.5&&t<55.3?'wow':'happy',look:1},t);ctx.restore();
  burst(X+40,-20,t,53.7,'#B9BEC7',10,260,6);
  // «а что, если бы…»
  const X2=19950;const ak=popK(t,56.4,60.7);
  if(ak>0){fig(X2,0,{k:ak,sy:1-.18*ss(t,57.5,60.5),col:'#C9CDD5'});
    const ck=back(prog(t,56.54,56.95));const cy=lerp(-470,-330,ss(t,57.5,60.5));const cs=1+.35*ss(t,57.0,60.5);
    thought(X2,cy,360*cs,170*cs,ck*(1-eio(prog(t,60.6,60.85))),()=>{ctx.fillStyle='#5A606B';ctx.font=`900 ${30}px ${FONT}`;ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText('А ЧТО, ЕСЛИ БЫ…',0,0);},'#E4E6EA','#C4C8CF');
    const yrs=t<59.6?'1 ГОД':t<60.0?'3 ГОДА':'5 ЛЕТ';card(X2+230,-150,'ПРОШЛО',yrs,popK(t,59.0,60.7),VIOLET);}
}
// ---------- H: через год ----------
function drawH(t){const X=22280;
  const lift=ss(t,61.3,61.9);
  heroX({x:X,y:0,color:HE,sx:1.18,sy:1.04,mood:'happy',look:0},t);strongArmsBar(X,0,t,lift);
  card(X,-560,'ФОРМА',Math.round(100*eout(prog(t,61.5,62.9)))+'%',popK(t,61.4,65.5),ORANGE);
  // сцена
  const SX=22850;ctx.fillStyle=INK;rr(SX-230,-130,460,130,[14,14,0,0]);ctx.fill();ctx.fillStyle=VIOLET;ctx.fillRect(SX-230,-130,460,14);
  spotlight(SX,-760,ss(t,63.4,63.8));
  heroX({x:SX,y:-130-Math.abs(Math.sin(t*6.5))*20,ground:-130,girl:true,color:SHE,outfit:1,mood:'happy',eyes:Math.sin(t*3)>0?'closed':'open',lean:Math.sin(t*6.5)*.12,swing:Math.sin(t*6.5)*.4},t);
  if(t>63.6){for(let i=0;i<8;i++){const ph=((t-63.6)*.7+i/8)%1;ctx.globalAlpha=(1-ph)*clamp((t-63.6)*2);ctx.fillStyle=PAL[i%6];star(SX+Math.sin(i*2.3+ph*4)*200,-330-ph*300,10+i%3*4,ph*4);ctx.fill();}ctx.globalAlpha=1;}
  // толпа листает
  const ck=t>65.1?1:0;[22560,22440,23180,23300].forEach((x,i)=>{if(ck)figPhone(x,{s:.8,k:back(prog(t,65.2+i*.07,65.55+i*.07)),a:.95});});
  if(t>67.2){[22560,23300].forEach((x,i)=>bubble(x,-150,'ЛИСТАЮ…',popK(t,67.3+i*.12,69.1),BUB.neg,.9));}
}
// ---------- I: финал ----------
function drawI(t){const X=25500;
  // дорога
  const rk=prog(t,72.7,73.4);ctx.save();ctx.globalAlpha=rk;PAL.forEach((c,i)=>{ctx.fillStyle=c+'BB';ctx.fillRect(X-40,6+i*6,1200,5);});ctx.restore();
  // барьеры исчезают
  [[X+260,'ЧТО СКАЖУТ?'],[X+520,'ЗАСМЕЮТ'],[X+780,'НЕ ПОЛУЧИТСЯ']].forEach(([x,s],i)=>{const a=popK(t,71.3+i*.1,72.9+i*.15);if(a<=0)return;ctx.save();ctx.globalAlpha=clamp(a);ctx.translate(x,0);ctx.scale(a,a);
    ctx.fillStyle='#D7DAE0';rr(-90,-130,180,130,14);ctx.fill();ctx.fillStyle='#8A8F98';ctx.font=`900 20px ${FONT}`;ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText(s,0,-65);ctx.restore();
    burst(x,-60,t,72.9+i*.15,'#B9BEC7',14,320,i+11);});
  // далёкая толпа в телефонах
  [X-430,X-330].forEach(x=>figPhone(x,{s:.6,a:.5}));
  // герои
  const tense=t<70.2?1:1-ss(t,70.2,70.8);
  const go=prog(t,75.05,75.6);const dx=lerp(0,320,eio(go));const hy=-160*4*go*(1-go);
  const relax=t>70.2&&t<71.2;
  heroX({x:X-70+dx,y:hy,ground:0,color:HE,mood:t<70.3?'firm':'happy',eyes:relax?'closed':'open',sy:1-.08*tense+.04*bump(t,70.3,.6),look:t>72.7?1:0},t);
  heroX({x:X+70+dx,y:hy,ground:0,girl:true,color:SHE,outfit:1,mood:t<70.3?'firm':'happy',eyes:relax?'closed':'open',sy:1-.08*tense+.04*bump(t,70.3,.6),look:t>72.7?1:0},t);
  if(relax){ctx.save();ctx.strokeStyle=MINT+'99';ctx.lineWidth=5;ctx.lineCap='round';const p=prog(t,70.2,71.2);for(let i=0;i<3;i++){ctx.globalAlpha=1-p;ctx.beginPath();ctx.moveTo(X-150-i*20,-120-p*80+i*20);ctx.quadraticCurveTo(X,-200-p*80+i*20,X+150+i*20,-120-p*80+i*20);ctx.stroke();}ctx.restore();}
  rings(X+320,-110,t,75.6,560);confetti(X+320,-180,t,75.6,170,21,1.1);
}

function scene(t){
  const c=camFull(t),sat=satAt(t);
  background(c,BLOBS,sat);
  ctx.save();applyCam(c);ground(c.x-3000,c.x+3000);
  if(t<7.9)drawA(t);
  if(t>7.2&&t<11.6)drawB(t);
  if(t>10.9&&t<15.6)drawC(t);
  if(t>15.3&&t<20.4)drawB2(t);
  if(t>19.6&&t<25.3)drawC2(t);
  if(t>24.6&&t<36.0)drawD(t);
  if(t>35.2&&t<44.4)drawE(t);
  if(t>43.8&&t<53.4)drawF(t);
  if(t>52.9&&t<61.5)drawG(t);
  if(t>60.7&&t<70.0)drawH(t);
  if(t>69.2)drawI(t);
  ctx.restore();
  fgBokeh(c,t,sat);
  // ХУК: ВСЕМ ПЛЕВАТЬ
  if(t<5.0&&t>-.4){const out=eio(prog(t,4.6,4.9));
    const sl=(str,y,size,col,t0)=>{const k=prog(t,t0,t0+.25);if(k<=0)return;ctx.save();ctx.globalAlpha=clamp(k*3)*(1-out);const sc=lerp(2.4,1,back(k));ctx.translate(W/2,y-out*30);ctx.scale(sc,sc);
      ctx.filter=`blur(${((1-k)*14+out*8).toFixed(1)}px)`;ctx.font=`900 ${size}px ${FONT}`;ctx.letterSpacing='4px';ctx.textAlign='center';ctx.fillStyle=col;if(col===CORAL){ctx.shadowColor=CORAL+'66';ctx.shadowBlur=36;}ctx.fillText(str,0,0);ctx.restore();};
    const g=ctx.createLinearGradient(0,0,0,H*.36);g.addColorStop(0,'rgba(255,255,255,.95)');g.addColorStop(.75,'rgba(255,255,255,.8)');g.addColorStop(1,'rgba(255,255,255,0)');ctx.fillStyle=g;ctx.fillRect(0,0,W,H*.36);
    sl('ВСЕМ',H*.125,150*U,INK,-0.33);sl('ПЛЕВАТЬ,',H*.205,150*U,CORAL,-0.27);
    const subs=[[0.25,1.55,'КТО ТЫ'],[1.64,3.4,'КАК ТЫ ВЫГЛЯДИШЬ'],[3.47,4.9,'ЧТО НА ТЕБЕ НАДЕТО']];
    for(const[a,b,s]of subs){if(t<a||t>b+.3)continue;const k=prog(t,a,a+.35),o=eio(prog(t,b,b+.25));word(s,W/2-ctxMeasure(s,58*U)/2,H*.275,k,Math.max(o,out),INK,58*U);}}
  typography(t,TEXTS);
}
function ctxMeasure(s,size){ctx.save();ctx.font=`900 ${size}px ${FONT}`;ctx.letterSpacing='2px';const w=ctx.measureText(s).width;ctx.restore();return w;}

// ================= RENDER: motion blur по скорости камеры =================
function camSpeed(t){const a=camFull(t),b=camFull(t+1/FPS);return(Math.abs(a.x-b.x)+Math.abs(a.y-b.y))*a.z*U+Math.abs(Math.log(a.z/b.z))*900+Math.abs(a.r-b.r)*1500;}
function draw1(t){ctx=MAIN;MAIN.setTransform(1,0,0,1,0,0);MAIN.filter='none';MAIN.globalAlpha=1;scene(t);}
window.renderFrame=T=>{const t=T-OFFSET;
  let N=Math.min(8,Math.max(1,Math.ceil(camSpeed(t)/14)));
  if(N===1){draw1(t);return;}
  ACCX.setTransform(1,0,0,1,0,0);ACCX.globalAlpha=1;ACCX.clearRect(0,0,W,H);
  for(let i=0;i<N;i++){const tt=t+(i/(N-1)-.5)*.5/FPS;draw1(tt);ACCX.globalAlpha=1/(i+1);ACCX.drawImage(cv,0,0);}
  MAIN.setTransform(1,0,0,1,0,0);MAIN.globalAlpha=1;MAIN.filter='none';MAIN.drawImage(ACC,0,0);
};
window.DUR=DUR;
window.ready=document.fonts.load(`900 76px ${FONT}`).then(()=>document.fonts.load(`800 26px ${FONT}`)).then(()=>{renderFrame(0);return true});
</script></body></html>
