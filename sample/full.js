// ================= FULL FILM · vertical 1080x1920 · every frame = f(t) =================
const GROUND=880, CAM_S=1.2, CUES=window.__CUES;
const GREY='#6A6058', NAVY='#2E2B36', BLDG='#3B332D';
const POSE={
 stand:{ch:[4,-150],hd:[10,-248],sB:[-18,-140],eB:[-42,-72],hB:[-30,-8],sF:[24,-140],eF:[52,-74],hF:[44,-8],kB:[-28,80],fB:[-46,160],kF:[30,80],fF:[52,160]},
 crouch:{ch:[-30,-128],hd:[-40,-222],sB:[-48,-120],eB:[-110,-80],hB:[-160,-40],sF:[-14,-122],eF:[-70,-60],hF:[-120,-20],kB:[-6,42],fB:[-60,108],kF:[62,30],fF:[48,108]},
 leap:{ch:[70,-118],hd:[128,-190],sB:[50,-122],eB:[130,-168],hB:[205,-196],sF:[78,-112],eF:[160,-128],hF:[236,-136],kB:[-74,36],fB:[-160,64],kF:[-40,64],fF:[-118,118]},
 choke:{ch:[18,-142],hd:[8,-236],sB:[-2,-134],eB:[78,-70],hB:[150,-112],sF:[36,-140],eF:[205,-150],hF:[150,-118],kB:[-46,72],fB:[-96,140],kF:[52,70],fF:[86,140]},
 win:{ch:[-4,-156],hd:[-6,-256],sB:[-26,-146],eB:[-84,-96],hB:[-40,-58],sF:[22,-150],eF:[70,-236],hF:[52,-322],kB:[-34,80],fB:[-60,160],kF:[34,80],fF:[66,160]},
 lift:{ch:[4,-150],hd:[10,-248],sB:[-18,-140],eB:[-40,-222],hB:[-14,-300],sF:[24,-140],eF:[56,-222],hF:[34,-302],kB:[-36,80],fB:[-70,160],kF:[36,80],fF:[70,160]},
 reach:{ch:[4,-150],hd:[10,-248],sB:[-18,-140],eB:[-42,-72],hB:[-30,-8],sF:[24,-140],eF:[96,-122],hF:[168,-112],kB:[-28,80],fB:[-46,160],kF:[30,80],fF:[52,160]},
 stop:{ch:[4,-150],hd:[10,-248],sB:[-18,-140],eB:[-42,-72],hB:[-30,-8],sF:[24,-140],eF:[96,-170],hF:[150,-236],kB:[-28,80],fB:[-46,160],kF:[30,80],fF:[52,160]},
 pry:{ch:[0,-150],hd:[4,-250],sB:[-22,-140],eB:[-96,-176],hB:[-160,-206],sF:[22,-140],eF:[96,-176],hF:[160,-206],kB:[-50,80],fB:[-96,160],kF:[50,80],fF:[96,160]},
 shrug:{ch:[0,-150],hd:[4,-246],sB:[-22,-140],eB:[-70,-86],hB:[-124,-120],sF:[22,-140],eF:[70,-86],hF:[124,-120],kB:[-28,80],fB:[-46,160],kF:[30,80],fF:[52,160]},
 bent:{ch:[110,-92],hd:[192,-150],sB:[92,-102],eB:[36,-176],hB:[-16,-228],sF:[112,-92],eF:[150,-30],hF:[170,40],kB:[-28,80],fB:[-46,160],kF:[30,80],fF:[52,160]},
 hold:{ch:[4,-150],hd:[10,-248],sB:[-18,-140],eB:[-30,-80],hB:[40,-70],sF:[24,-140],eF:[70,-90],hF:[110,-80],kB:[-28,80],fB:[-46,160],kF:[30,80],fF:[52,160]}};
function mix(a,b,u){const o={};for(const k in a)o[k]=L2(a[k],b[k],u);return o}
function walk(ph,base=POSE.stand){const s=Math.sin(ph),c=Math.cos(ph),P=Object.assign({},base);
  P.kF=[30+s*34,80];P.fF=[52+s*62,160-Math.max(0,c)*16];P.kB=[-28-s*34,80];P.fB=[-46-s*62,160-Math.max(0,-c)*16];
  if(base===POSE.stand){P.eF=[52-s*30,-74];P.hF=[44-s*56,-8];P.eB=[-42+s*30,-72];P.hB=[-30+s*56,-8]}return P}
const HERO={top:'tee',topCol:C.gi,bot:'shorts',hair:'crop',band:1,cauli:1,feet:'bare'};
const HERO0=Object.assign({},HERO,{band:0});
const BOSS={top:'suit',topCol:GREY,bot:'pants',botCol:GREY,hair:'bald',tie:C.red,stache:1};
const GUARD={top:'shirt',topCol:C.yel,bot:'pants',botCol:C.ink,hair:'cap',badge:1};
const COP={top:'suit',topCol:NAVY,bot:'pants',botCol:NAVY,hair:'cap',badge:1,tie:C.ink};
const MOM={top:'dress',topCol:C.yel,hair:'bun',apron:1};
const GIRL={top:'dress',topCol:C.red,hair:'long',bow:1};
const WAITER={top:'shirt',topCol:C.gi,bot:'pants',botCol:C.ink,hair:'slick',tie:C.red};
const Q=[{top:'shirt',topCol:C.red,bot:'pants',botCol:GREY,hair:'slick'},{top:'dress',topCol:C.yel,hair:'bun'},{top:'shirt',topCol:C.gi,bot:'pants',botCol:C.ink,hair:'bald',stache:1}];

// ---------- people ----------
function person(hx,hy,P,L,o={}){const A=k=>[hx+P[k][0],hy+P[k][1]],sd=o.sd||0,face=o.face||'calm',tail=o.tail||0,skin=C.skin;
  ctx.save();
  if(o.rot){ctx.translate(hx,hy);ctx.rotate(o.rot);ctx.translate(-hx,-hy)}
  if(o.flip){ctx.translate(hx,0);ctx.scale(-1,1);ctx.translate(-hx,0)}
  if(o.sc){ctx.translate(hx,hy);ctx.scale(o.sc,o.sc);ctx.translate(-hx,-hy)}
  const leg=(h,k,f,s)=>{if(L.bot==='shorts'){tube([h,k,f],40,skin,5,s);tube([h,L2(h,k,.62)],60,C.ink,5,s+1);brush([L2(h,k,.08),L2(h,k,.5),L2(h,k,.78)],9,{seed:s+2,col:C.red,flat:1})}
    else if(L.bot==='pants')tube([h,k,f],50,L.botCol,6,s);else tube([h,k,f],32,skin,5,s)};
  const arm=(sh,el,hd,s,w)=>{if(L.top==='tee'){tube([sh,el],w,skin,5,s);tube([sh,L2(sh,el,.5)],w+16,L.topCol,6,s+1);tube([el,hd],w-4,skin,5,s+2)}
    else if(L.top==='dress'){tube([sh,el],w-6,skin,5,s);tube([el,hd],w-8,skin,5,s+2)}
    else tube([sh,el,hd],w+8,L.topCol,6,s);
    blob(...hd,w*.6,w*.58,skin,5,s+3)};
  const foot=(p,dir,s)=>blob(p[0]+dir*10,p[1]+2,30,13,L.feet==='bare'?skin:C.ink,5,s);
  leg([hx-14,hy-4],A('kB'),A('fB'),sd+1);foot(A('fB'),-1,sd+2);
  arm(A('sB'),A('eB'),A('hB'),sd+3,32);
  const ch=A('ch');
  tube([[hx,hy-52],L2([hx,hy],ch,.6),ch],112,L.topCol,6,sd+6);
  if(L.top==='tee'){brush([[ch[0]-16,ch[1]-34],[ch[0]+4,ch[1]-18],[ch[0]+26,ch[1]-32]],5,{seed:sd+7});
    blob(hx+2,hy+20,58,34,C.ink,5,sd+16);brush([[hx+36,hy-4],[hx+48,hy+30],[hx+44,hy+50]],8,{seed:sd+17,col:C.red,flat:1});tube([[hx-46,hy-4],[hx,hy+2],[hx+46,hy-4]],30,C.ink,0,sd+9)}
  if(L.top==='suit'||L.top==='shirt'){const V=[[ch[0]-14,ch[1]-36],[ch[0]+26,ch[1]-36],[ch[0]+8,ch[1]+8]];if(L.top==='suit'){fillShape(V,C.gi,sd+18);brush(V,4,{closed:true,seed:sd+19})}
    if(L.tie){const T=[[ch[0]+6,ch[1]-30],[ch[0]+16,ch[1]-16],[ch[0]+12,ch[1]+52],[ch[0]+2,ch[1]+52],[ch[0]-2,ch[1]-16]];fillShape(T,L.tie,sd+20);brush(T,4,{closed:true,seed:sd+21})}
    if(L.badge)sparkle(ch[0]+40,ch[1]+6,18,sd+22);
    if(L.bot==='pants')tube([[hx-48,hy-6],[hx,hy],[hx+48,hy-6]],18,C.ink,0,sd+23)}
  if(L.apron){const Ap=[[hx-20,hy-90],[hx+46,hy-90],[hx+56,hy+70],[hx-24,hy+70]];fillShape(Ap,C.gi,sd+24);brush(Ap,4,{closed:true,seed:sd+25})}
  leg([hx+14,hy],A('kF'),A('fF'),sd+11);foot(A('fF'),1,sd+12);
  if(L.top==='dress'){const k1=A('kB'),k2=A('kF'),D=[[hx-46,hy-40],[hx+46,hy-40],[Math.max(k1[0],k2[0])+34,Math.max(k1[1],k2[1])+10],[Math.min(k1[0],k2[0])-34,Math.max(k1[1],k2[1])+10]];
    fillShape(D,L.topCol,sd+26);brush(D,6,{closed:true,seed:sd+27,sub:3});if(L.apron){const Ap=[[hx-14,hy-40],[hx+44,hy-40],[hx+52,hy+70],[hx-16,hy+70]];fillShape(Ap,C.gi,sd+28);brush(Ap,4,{closed:true,seed:sd+29})}}
  head(...A('hd'),face,o.hdRot||0,sd+30,tail,L);
  if(o.mid)o.mid();
  arm(A('sF'),A('eF'),A('hF'),sd+13,34);
  if(o.prop)o.prop(A('hF'),A('hB'));
  ctx.restore()}
function head(x,y,face,rot,sd,tail,L){ctx.save();ctx.translate(x,y);ctx.rotate(rot);
  const inkP=(P,s)=>{ctx.fillStyle=C.ink;ctx.beginPath();poly(spline(jit(P,s),true,5));ctx.fill()};
  if(L.hair==='long'){inkP(ring(-16,40,82,104,12),sd+40)}
  tube([[-6,60],[-2,34]],38,C.skin,5,sd+1);
  blob(0,0,66,70,C.skin,6,sd+2);
  blob(-30,12,16,19,C.skin,5,sd+3);if(L.cauli)brush([[-34,4],[-26,12],[-34,20]],3.5,{seed:sd+4});
  const cap=[[-62,-10],[-60,-46],[-30,-70],[10,-74],[46,-58],[60,-30],[30,-44],[0,-40],[-30,-30],[-44,-10]];
  switch(L.hair){
    case 'crop':inkP(cap,sd+5);break;
    case 'slick':inkP([[-64,0],[-62,-46],[-30,-72],[20,-74],[56,-52],[64,-24],[20,-50],[-30,-36],[-50,-4]],sd+5);break;
    case 'long':inkP([[-64,10],[-62,-46],[-30,-74],[20,-76],[56,-56],[66,-20],[44,-28],[30,-52],[0,-44],[-40,-26]],sd+5);break;
    case 'bun':inkP(cap,sd+5);blob(-46,-70,30,28,C.ink,4,sd+42);break;
    case 'bald':blob(-50,-4,14,26,'#D9D0C4',4,sd+42);break;
    case 'cap':{const P=[[-66,-14],[-60,-60],[-20,-86],[30,-84],[62,-52],[66,-18]];fillShape(P,C.ink,sd+43);brush(P,5,{closed:true,seed:sd+44});
      brush([[30,-20],[70,-22],[106,-12]],16,{seed:sd+45,flat:1});blob(14,-58,12,12,C.yel,4,sd+46);break}}
  if(L.band){tube([[-62,-26],[0,-38],[63,-26]],20,C.red,5,sd+6);const w=Math.sin(BI*1.9)*8;
    tube([[-60,-24],[-100,-20+w*.5+tail*-6],[-140,-8-w+tail*-14]],15,C.red,4,sd+7);tube([[-60,-22],[-96,4+w],[-128,22-w*.6+tail*-18]],13,C.red,4,sd+8)}
  if(L.bow){const B=[[-40,-60],[-80,-90],[-76,-40]],B2=[[-40,-60],[-10,-96],[-4,-50]];fillShape(B,C.yel,sd+47);brush(B,4,{closed:true,seed:sd+48});fillShape(B2,C.yel,sd+49);brush(B2,4,{closed:true,seed:sd+50})}
  const eyesDot=(h)=>{blob(22,-4,7,h,C.ink,.1,sd+9);blob(50,-4,7,h,C.ink,.1,sd+10)};
  const big=()=>{[[20,-6],[52,-6]].forEach((p,i)=>{blob(p[0],p[1],13,16,'#fff',4,sd+9+i);blob(p[0]+nz(3,i,1)*2,p[1]+2,5,6,C.ink,1,sd+11+i)})};
  switch(face){
    case 'happy':brush([[10,-2],[20,-12],[30,-2]],5,{seed:sd+9});brush([[40,-2],[50,-12],[60,-2]],5,{seed:sd+10});brush([[8,-28],[30,-32]],6,{seed:sd+11});brush([[42,-32],[64,-28]],6,{seed:sd+12});
      fillShape([[16,22],[64,22],[54,46],[30,48]],C.red,sd+13);brush([[14,22],[40,26],[66,22],[52,48],[28,48]],5,{closed:true,seed:sd+14});break;
    case 'x':[[22,-6],[52,-6]].forEach((p,i)=>{brush([[p[0]-10,p[1]-10],[p[0]+10,p[1]+10]],5,{seed:sd+9+i});brush([[p[0]+10,p[1]-10],[p[0]-10,p[1]+10]],5,{seed:sd+11+i})});
      brush([[18,34],[30,28],[42,36],[56,30]],4.5,{seed:sd+13});break;
    case 'bulge':case 'shock':big();brush([[8,-34],[30,-40]],5,{seed:sd+15});brush([[44,-40],[64,-34]],5,{seed:sd+16});blob(38,34,11,14,C.red,4.5,sd+13);break;
    case 'smug':eyesDot(7);brush([[10,-8],[34,-10]],5,{seed:sd+15});brush([[40,-10],[62,-8]],5,{seed:sd+16});brush([[22,32],[40,34],[58,26]],5,{seed:sd+13});break;
    case 'calm':eyesDot(11);brush([[10,-28],[30,-32]],5,{seed:sd+11});brush([[42,-32],[62,-28]],5,{seed:sd+12});brush([[24,30],[40,36],[58,30]],5,{seed:sd+13});break;
    default:{eyesDot(10);brush([[6,-30],[32,-20]],7,{seed:sd+11,flat:1});brush([[42,-20],[66,-30]],7,{seed:sd+12,flat:1});
      if(face==='grit'){blob(40,32,22,10,C.gi,4.5,sd+13);brush([[22,32],[58,32]],3,{seed:sd+14})}else brush([[24,34],[40,30],[58,35]],5.5,{seed:sd+13})}}
  if(L.stache)brush([[20,20],[38,14],[58,20]],11,{seed:sd+17,flat:1});
  blob(36,14,6,6,null,4,sd+18);
  ctx.restore()}

// ---------- props with faces ----------
function rp(x,y,w,h,st=45){const P=[],add=(a,b,c,d)=>{const n=Math.max(1,Math.round(Math.hypot(c-a,d-b)/st));for(let i=0;i<n;i++)P.push([lerp(a,c,i/n),lerp(b,d,i/n)])};
  add(x,y,x+w,y);add(x+w,y,x+w,y+h);add(x+w,y+h,x,y+h);add(x,y+h,x,y);return P}
function box(x,y,w,h,col,lw=6,sd=0){const P=rp(x,y,w,h);if(col)fillShape(P,col,sd);if(lw)brush(P,lw,{closed:true,seed:sd+1,sub:3})}
function oface(x,y,s,e,sd){ctx.save();ctx.translate(x,y);ctx.scale(s,s);
  if(e==='x'){[[-24,-12],[24,-12]].forEach((p,i)=>{brush([[p[0]-12,p[1]-12],[p[0]+12,p[1]+12]],6,{seed:sd+i});brush([[p[0]+12,p[1]-12],[p[0]-12,p[1]+12]],6,{seed:sd+2+i})});brush([[-26,34],[-8,28],[8,36],[26,28]],5,{seed:sd+5})}
  else if(e==='happy'){brush([[-36,-6],[-24,-20],[-12,-6]],6,{seed:sd});brush([[12,-6],[24,-20],[36,-6]],6,{seed:sd+1});fillShape([[-24,22],[24,22],[14,44],[-14,44]],C.red,sd+2);brush([[-26,22],[26,22],[14,44],[-14,44]],5,{closed:true,seed:sd+3})}
  else{const bg=e==='bulge'?1.45:1;[[-25,-10],[25,-10]].forEach((p,i)=>{blob(p[0],p[1],15*bg,18*bg,'#fff',4.5,sd+i);blob(p[0]+(e==='bulge'?0:6)+nz(3,i,1)*(e==='bulge'?2:0),p[1]+2,6,7,C.ink,1,sd+2+i)});
    if(e==='angry'){brush([[-44,-36],[-10,-24]],8,{seed:sd+6,flat:1});brush([[10,-24],[44,-36]],8,{seed:sd+7,flat:1});brush([[-22,34],[22,34]],6,{seed:sd+8})}
    else if(e==='bulge')blob(0,36,16,13,C.red,5,sd+4);else{fillShape([[-24,26],[24,26],[14,46],[-14,46]],C.red,sd+4);brush([[-26,26],[26,26],[14,46],[-14,46]],5,{closed:true,seed:sd+5})}}
  ctx.restore()}
function parm(x,y,a,sd){brush([[x,y],[x-36,y-a*50+10],[x-56,y-30-a*90]],9,{seed:sd,flat:1});blob(x-58,y-34-a*90,12,12,C.gi,4,sd+1)}
function plegs(sp,y,k,sd){brush([[-sp/2,y-10],[-sp*.55+k*20,y+22],[-sp*.62+k*30,y+42]],11,{seed:sd,flat:1});brush([[sp/2,y-10],[sp*.55-k*24,y+22],[sp*.62-k*12,y+42]],11,{seed:sd+1,flat:1})}
function propT(cx,cy,rot,st,fn){ctx.save();ctx.translate(cx,cy);ctx.rotate(rot);ctx.scale(st.sx||1,st.sy||1);fn(st);ctx.restore()}
function coffee(st){plegs(120,118,st.kick||0,70);if(st.arm!==undefined)parm(-95,0,st.arm,71);
  box(-95,-130,190,250,C.red,7,72);box(-102,-176,204,52,C.ink,0,74);box(-62,-106,124,110,C.gi,5,76);oface(0,-50,.8,st.eyes||'open',78);
  box(-24,30,48,26,C.ink,0,80);brush([[-70,96],[70,96]],5,{seed:82})}
function printer(st){plegs(170,80,st.kick||0,84);box(-90,-150,180,70,'#EADCC0',6,85);box(-125,-90,250,170,C.gi,7,86);box(-100,-40,200,16,C.ink,0,88);
  blob(95,-62,11,11,st.blink?C.red:C.floor,4,89);oface(-15,22,.7,st.eyes||'open',90);if(st.arm!==undefined)parm(-125,0,st.arm,91)}
function cart(st){const P=[[-120,-90],[120,-90],[95,40],[-95,40]];fillShape(P,C.gi,92);brush(P,7,{closed:true,seed:93});
  for(let i=1;i<6;i++){const x=-120+i*40;brush([[x,-90],[x*.8,40]],3,{seed:94+i})}brush([[-110,-45],[110,-45]],3,{seed:100});
  brush([[120,-90],[150,-130],[185,-130]],9,{seed:101});brush([[-95,40],[-95,72],[95,72],[95,40]],6,{seed:102});
  blob(-75,90,20,20,C.ink,1,103);blob(75,90,20,20,C.ink,1,104);box(-62,-82,124,84,C.yel,5,105);oface(0,-40,.55,st.eyes||'open',106);if(st.arm!==undefined)parm(-120,-40,st.arm,108)}
function register(st){const dr=st.drawer||0;box(-100-dr*80,64,200,34,C.gi,5,121);box(-110,-60,220,130,C.yel,7,110);box(-72,-126,144,62,C.ink,0,112);
  brush([[-50,-96],[40,-96]],7,{seed:113,col:st.err&&BI%2?C.red:C.yel});
  for(let i=0;i<3;i++)for(let j=0;j<3;j++)blob(26+j*24,-30+i*24,8,7,C.red,3,140+i*3+j);oface(-52,2,.5,st.eyes||'open',125);if(st.arm!==undefined)parm(-110,10,st.arm,123)}
function cat(st){ctx.save();if(st.flat)ctx.scale(1.4,.5);
  tube([[60,40],[118,20+Math.sin(BI*1.7)*10],[136,-40]],22,C.yel,5,130);blob(10,10,95,70,C.yel,6,131);
  [[[0,-52],[10,-22]],[[30,-46],[38,-16]],[[60,-34],[64,-8]]].forEach((p,i)=>brush(p,6,{seed:132+i}));
  blob(-70,-55,58,50,C.yel,6,135);[[[-112,-74],[-104,-124],[-78,-96]],[[-58,-98],[-40,-130],[-28,-90]]].forEach((E,i)=>{fillShape(E,C.yel,136+i);brush(E,5,{closed:true,seed:138+i})});
  if(st.eyes==='x'){[[-92,-62],[-54,-62]].forEach((p,i)=>{brush([[p[0]-8,p[1]-8],[p[0]+8,p[1]+8]],4,{seed:140+i});brush([[p[0]+8,p[1]-8],[p[0]-8,p[1]+8]],4,{seed:142+i})})}
  else if(st.eyes==='angry'){blob(-92,-60,6,8,C.ink,1,140);blob(-54,-60,6,8,C.ink,1,141);brush([[-104,-80],[-84,-70]],5,{seed:142});brush([[-62,-70],[-42,-80]],5,{seed:143})}
  else{blob(-92,-60,7,10,C.ink,1,140);blob(-54,-60,7,10,C.ink,1,141)}
  blob(-73,-42,6,5,C.red,3,144);brush([[-120,-40],[-150,-46]],3,{seed:145});brush([[-120,-34],[-150,-30]],3,{seed:146});ctx.restore()}
function bus(cx,cy,rot,st){ctx.save();ctx.translate(cx,cy);ctx.rotate(rot);
  box(-310,-130,620,240,C.yel,8,150);brush([[-300,40],[300,40]],18,{seed:151,col:C.red,flat:1});
  for(let i=0;i<4;i++)box(-170+i*110,-104,86,80,C.gi,5,152+i*2);box(-298,-104,90,112,C.gi,5,162);
  box(-60,-172,120,42,C.ink,0,164);brush([[-14,-162],[14,-162],[-10,-138],[14,-138]],5,{seed:165,col:C.yel});
  [-190,190].forEach((x,i)=>{blob(x,112,48,48,C.ink,1,166+i);blob(x,112,20,20,C.gi,4,168+i);const a=(st.spin||0)+i;brush([[x+Math.cos(a)*36,112+Math.sin(a)*36],[x-Math.cos(a)*36,112-Math.sin(a)*36]],5,{seed:170+i,col:C.gi})});
  blob(-306,70,14,14,C.gi,4,172);oface(-253,-52,.62,st.eyes||'open',174);ctx.restore()}
const personT=(L,f0)=>(cx,cy,rot,st)=>person(cx,cy,st.pose||POSE.stand,L,{flip:1,rot,face:st.eyes==='open'?f0:st.eyes,prop:st.prop});

// ---------- helpers ----------
function shadow(x,w,a=.18){ctx.fillStyle=`rgba(110,70,35,${a})`;ctx.beginPath();ctx.ellipse(x,GROUND+8,w,14,0,0,7);ctx.fill()}
function floorG(col=C.floor){fillShape([[-1200,GROUND],[5200,GROUND],[5200,1900],[-1200,1900]],col,8);
  brush([[-1200,GROUND+2],[0,GROUND-2],[1000,GROUND+3],[2000,GROUND-1],[3000,GROUND+2],[4000,GROUND],[5200,GROUND+1]],6,{seed:9,flat:1,sub:12});
  for(let i=0;i<16;i++){const x=-300+i*360+hash(i)*120,y=GROUND+16+hash(i+3)*26;brush([[x,y],[x+70+hash(i+5)*90,y+2]],4,{seed:30+i})}}
function fit(str,size,maxW=820){return Math.min(size,maxW/(.95*str.length))}
function say(str,x,y,size,t,t0,t1=1e9,o={}){if(t<t0||t>=t1)return;const sc=back(seg(t,t0,t0+.18));letter(str,x,y,fit(str,size,o.maxW),Object.assign({},o,{sc:(o.sc||1)*Math.max(sc,.02)}))}
function stamp(str,x,y,size,t,t0,o={}){if(t<t0)return;const u=seg(t,t0,t0+.12);letter(str,x,y,fit(str,size),{col:C.red,rot:o.rot??-.12,sc:lerp(1.9,1,ei(u)),lw:4})}
function score(str,t,t0,x=915){const u=seg(t,t0,t0+.25),u2=seg(t,t0+.25,t0+.45);const y=lerp(-700,50,eo(u));
  letter(str,x,y,260,{col:C.red,sx:u<1?.86:lerp(1.18,1,back(u2)),sy:u<1?1.18:lerp(.82,1,back(u2)),rot:-.04});sparkles(x,40,t,t0+.25)}
function sparkles(x,y,t,t0,R=1){[[-330,-130,0],[300,-110,.15],[260,150,.3],[-300,120,.45]].forEach(([dx,dy,d],i)=>{const k=seg(t,t0+d,t0+.45+d);const s=k<=0?0:(k<1?Math.sin(k*Math.PI)*40+(k>.5?20:0):20+Math.sin(t*6+i)*4);sparkle(x+dx*R,y+dy*R,s,160+i*3)})}
function heart(x,y,s,sd){const P=[];for(let i=0;i<16;i++){const a=i/16*Math.PI*2,hx=16*Math.pow(Math.sin(a),3),hy=-(13*Math.cos(a)-5*Math.cos(2*a)-2*Math.cos(3*a)-Math.cos(4*a));P.push([x+hx*s,y+hy*s])}fillShape(P,C.red,sd);brush(P,6,{closed:true,seed:sd+1,sub:3})}
function sunCard(x,y,r){fillShape(ring(x,y,r,r,16),C.sun,7)}
function windowX(x,y,r){brush([[x,y-r],[x,y+r]],5,{seed:12});brush([[x-r,y],[x+r,y]],5,{seed:13})}

// ---------- generic grapple choreography ----------
function grapple(t,G,T){const L=G.leap,dy=G.dy||0;let hx=G.x0,hy=GROUND-160,P=POSE.stand,face=G.face0||'angry',tail=0,stage;
  const fx=G.fx??(T.x-118);
  if(t<L-.45){stage=0;hy+=Math.sin(t*14)*3;if(G.pre){const r=G.pre(t);if(r){hx=r.hx??hx;P=r.P||P;hy=r.hy??hy;face=r.face||face}}}
  else if(t<L-.05){stage=1;const u=eo(seg(t,L-.45,L-.12));P=mix(POSE.stand,POSE.crouch,u);hy+=48*u;face='grit'}
  else if(t<L+1/24){stage=2;P=POSE.leap;hx=lerp(G.x0,fx,.2);hy=GROUND-260;face='grit';tail=1}
  else if(t<L+2/24)stage=3;
  else if(t<G.win){stage=4;P=POSE.choke;hx=fx;hy=GROUND-130+dy;face='grit';tail=t<L+.3?1:.3}
  else{stage=5;const u=back(seg(t,G.win,G.win+.4));P=mix(POSE.choke,POSE.win,u);hx=lerp(fx,fx-(G.back??60),u);hy=lerp(GROUND-130+dy,GROUND-160,u)-Math.sin(seg(t,G.win,G.win+.4)*Math.PI)*40;face=u>.5?'happy':'grit'}
  const st={eyes:G.e0||'open',kick:0};let cx=T.x,cy=T.y,rot=0;
  if(T.pos&&stage<=1){const r=T.pos(t,st);cx=r[0];cy=r[1]}
  if(stage<=3&&T.idle)rot=T.idle(t,st)||0;
  if(stage>=1&&stage<=3&&!G.calm)st.eyes='bulge';
  const ax=T.att?T.att[0]:124,ay=T.att?T.att[1]:-64,att=stage===4&&!T.big;
  if(stage===4){st.eyes=G.calm?G.e0:'bulge';const sq=(t-L)<.25?.86:.94+.03*Math.sin(t*24);if(!T.person){st.sx=sq;st.sy=1/sq}st.kick=Math.sin(t*26)*1.2;
    if(!T.big){cx=hx+ax;cy=hy+ay;rot=T.person?0:-.08+Math.sin(t*22)*.04}
    if(!T.person){st.arm=0;(G.taps||[]).forEach(TT=>{if(t>=TT-.17&&t<TT+.1)st.arm=t<TT?-eo(seg(t,TT-.17,TT))*1.1:.5})}
    if(t>G.ko){st.eyes='x';st.kick=0;st.arm=undefined;rot=T.big||T.person?0:.12}
    if(G.during)G.during(t,st)}
  if(stage===5){st.eyes=G.endEyes||'x';if(T.lie){const u=seg(t,G.win,G.win+.38),sx0=fx+ax,sy0=GROUND-130+dy+ay;
      cx=lerp(sx0,T.lie.x,eo(u));cy=u<1?lerp(sy0,T.lie.y,ei(u)):T.lie.y-(t<G.win+.5?26*Math.sin(seg(t,G.win+.38,G.win+.5)*Math.PI):0);rot=lerp(.12,T.lie.rot,eo(u));
      if(T.person)st.pose=u>.5?POSE.pry:POSE.stand;if(t>=G.win+.38&&t<G.win+.5){st.sx=1.12;st.sy=.88}}
    if(G.after)G.after(t,st)}
  if(!att){if(!T.big&&!T.lie||stage!==5||true)shadow(cx,T.sw||90)}
  shadow(hx+10,110);
  if(!att)T.draw(cx,cy,rot,st);
  puff(G.x0,GROUND-20,seg(t,L,L+.6),-1,40,.8);
  if(stage>=2&&t<L+.2){for(let i=0;i<7;i++){const k=(t-L)*24;speed(G.x0-260+i*30+k*100,G.x0+250+i*25+k*100,GROUND-360+i*45,10-i%3*2,80+i)}}
  if(t>=L+2/24)star((att?cx:fx+150)+20,(att?cy:GROUND-300)-60,300,seg(t,L+2/24,L+.65),3);
  if(stage===3){const mx=(G.x0+fx)/2;ctx.save();ctx.translate(mx,GROUND-220);ctx.rotate(-.06);ctx.scale(2.4,.72);ctx.translate(-mx,-(GROUND-220));
    person(mx,GROUND-200,POSE.leap,HERO,{face:'grit',tail:1.4});ctx.restore();for(let i=0;i<5;i++)speed(G.x0-300,G.x0+120+i*60,GROUND-330+i*42,14,90+i)}
  else if(att)person(hx,hy,P,HERO,{face,tail,mid:()=>T.draw(cx,cy,rot,st)});
  else person(hx,hy,P,HERO,{face,tail});
  puff((att?cx:fx+150)+10,(att?cy:GROUND-250)-40,seg(t,L+2/24,L+.9),1,50,1.1);
  if(att&&t<G.ko&&!G.calm){for(let k=0;k<3;k++){const a=-.9+k*.5;brush([[cx+Math.cos(a)*160,cy+Math.sin(a)*160],[cx+Math.cos(a)*200,cy+Math.sin(a)*200]],7,{seed:110+k})}
    const fd=Math.round(t*24);drop(cx+130,cy-90+((fd*6)%40),1,120);drop(cx-40,cy-160+((fd*5)%30),.8,122)}
  (G.taps||[]).forEach((TT,i)=>{const u=seg(t,TT,TT+.45);if(t>=TT&&u<1)letter('ТУК!',(att?cx:fx)-220+i*40,(att?cy:600)-190-i*55,66,{rot:[-.12,.1,-.05][i%3],sc:back(seg(t,TT,TT+.12)),col:C.yel})});
  if(t>=G.ko&&t<G.win&&att){[0,1,2].forEach(i=>brush(ring(cx-30+i*30,cy-170-i*10,10,6,8),3,{closed:true,seed:130+i}))}
  if(T.lie)puff(T.lie.x,GROUND-30,seg(t,G.win+.38,G.win+1.1),1,60,.9);
  return {hx,hy,stage,cx,cy}}

// ---------- events / cue sheet (shared with audio) ----------
const G1={x0:650,leap:14.3,taps:[15.55,15.9,16.25],ko:16.6,win:17.05};
const T1={x:1190,y:GROUND-138,sw:80,draw:(cx,cy,r,st)=>clock(cx,cy,100,r,st),lie:{x:1205,y:GROUND-100,rot:1.57},
  idle:(t,st)=>{if(t<10.25)return 0;const fd=Math.round(t*24);st.bell=Math.sin(fd*3.1)*.12;st.kick=Math.sin(fd*2)*.4;return Math.sin(fd*2.3)*.09}};
const G2={x0:650,leap:23.75,taps:[24.85,25.2,25.55],ko:27.9,win:28.25,e0:'angry'};
const T2={x:1190,y:GROUND-160,att:[130,-50],draw:(cx,cy,r,st)=>propT(cx,cy,r,st,coffee),lie:{x:1215,y:GROUND-95,rot:1.57},
  idle:(t,st)=>{const fd=Math.round(t*24);return t>22?Math.sin(fd*2.1)*.03:0}};
const G3={x0:560,leap:35.95,fx:640,taps:[],ko:38.25,win:38.7,back:70};
const T3={x:1060,y:GROUND-170,big:1,sw:300,draw:(cx,cy,r,st)=>bus(cx,cy,r+Math.PI,Object.assign({spin:BI*.8},st))};
const G5={x0:650,leap:53.1,taps:[],ko:1e9,win:56.4,e0:'angry',endEyes:'happy',
  during:(t,st)=>{if(t>54.3)st.eyes='happy'}};
const T5={x:1190,y:GROUND-122,att:[135,-40],sw:120,draw:(cx,cy,r,st)=>propT(cx,cy,r,st,printer),
  idle:(t,st)=>{const fd=Math.round(t*24);st.blink=fd%8<4;return Math.sin(fd*2.7)*.04}};
const G8a={x0:700,leap:83.45,taps:[83.95,84.2],ko:84.3,win:84.55,e0:'angry'};
const T8a={x:940,y:GROUND-110,att:[140,-30],draw:(cx,cy,r,st)=>propT(cx,cy,r,st,cart),lie:{x:990,y:GROUND-120,rot:-1.57},
  pos:(t,st)=>{const j=t>81.4?Math.sin(Math.round(t*24)*1.9)*22:0;return[lerp(830,940,seg(t,79.69,81.4))+j,GROUND-110]}};
const G8b={x0:762,leap:87.35,taps:[87.75],ko:87.95,win:88.25,e0:'angry',
  during:(t,st)=>{st.drawer=t>87.6?1:0}};
const T8b={x:1290,y:GROUND-234,att:[124,-60],draw:(cx,cy,r,st)=>propT(cx,cy,r,st,register),lie:{x:1250,y:GROUND-110,rot:1.57},
  idle:(t,st)=>{st.err=1;return 0}};
const G8c={x0:1112,leap:91.0,taps:[],ko:91.25,win:91.6,face0:'angry'};
const T8c={x:1500,y:GROUND-160,person:1,att:[70,10],sw:90,draw:personT(GUARD,'angry'),lie:{x:1620,y:GROUND-60,rot:-1.57},
  pos:(t,st)=>{const u=seg(t,88.6,90.0);if(u<1){st.pose=walk(t*9);}else st.pose=POSE.stop;return[lerp(2050,1500,u),GROUND-160-(u<1?Math.abs(Math.cos(t*9))*6:0)]}};
const G11={x0:700,leap:123.3,taps:[],ko:1e9,win:1e9,calm:1,e0:'calm',during:(t,st)=>{if(t>125.2)st.eyes='smug'}};
const T11={x:1130,y:GROUND-160,person:1,att:[70,10],draw:personT(GIRL,'calm')};
const GS=[G1,G2,G3,G5,G8a,G8b,G8c,G11];
const IMPACTS=GS.map(g=>g.leap+2/24).concat([35.0,97.97,100.85,105.5,110.45,129.4,44.68]);
const ONES=GS.map(g=>[g.leap-.1,g.leap+.4]).concat([[34.3,35.2],[100.5,101.4],[44.5,45.0],[105.3,105.7],[110.3,110.7],[73.6,74.0]]);
const SC=[0,9.55,20.36,30.46,42.45,51.01,62.0,71.66,79.69,93.23,104.12,114.76,136.12];
const SFX=[];const sfx=(t,k,d=0)=>SFX.push([+t.toFixed(3),k,d]);
GS.forEach(g=>{sfx(g.leap-.06,'whoosh');sfx(g.leap+2/24,'impact');sfx(g.leap+2/24+.03,'poof');(g.taps||[]).forEach(x=>sfx(x,'tap'));if(g.ko<200&&g!==G3)sfx(g.ko,'slide')});
[G1,G2,G8a,G8b,G8c].forEach(g=>sfx(g.win+.38,'thud'));
SC.slice(1).forEach(s=>sfx(s-.12,'wipe'));
sfx(.25,'pop');sfx(3.15,'pop');sfx(4.36,'pop');sfx(5.5,'impact');sfx(5.55,'sparkle');sfx(6.2,'boing');
sfx(10.25,'ring',4.0);sfx(17.69,'score');sfx(26.07,'pop');sfx(28.98,'score');
sfx(30.5,'engine',1.4);sfx(34.3,'whoosh');sfx(35.0,'impact');sfx(35.02,'poof');sfx(37.03,'stamp');sfx(38.85,'score');sfx(39.43,'ding');
sfx(42.6,'pop');sfx(44.6,'whoosh');sfx(44.68,'impact');[46.3,46.7,47.1].forEach(x=>sfx(x,'tap'));sfx(48.03,'pop');sfx(48.9,'pop');sfx(49.79,'boing');
sfx(51.1,'beep');sfx(51.6,'beep');sfx(52.1,'beep');sfx(54.3,'printer',2.2);sfx(55.94,'stamp');sfx(57.88,'pop');sfx(59.95,'slide');
sfx(64.0,'thud');sfx(64.6,'scrape',2.4);[67.3,67.45,67.6].forEach(x=>sfx(x,'pop'));sfx(70.31,'pop');
sfx(71.7,'rattle',1.6);sfx(73.7,'whoosh');sfx(73.8,'impact');sfx(74.9,'door',1.4);sfx(76.43,'ding');sfx(76.5,'sparkle');
sfx(79.7,'cartroll',1.7);sfx(81.4,'rattle',1.8);sfx(84.95,'beep');sfx(85.35,'beep');sfx(87.65,'ding');sfx(89.0,'steps',1.0);sfx(90.1,'pop');
sfx(96.2,'whistle');sfx(97.97,'impact');sfx(100.5,'whoosh');sfx(100.85,'impact');sfx(100.9,'poof');sfx(102.47,'boing');
sfx(105.4,'whoosh');sfx(105.5,'thud');sfx(105.55,'meow');sfx(108.3,'pop');sfx(110.35,'whoosh');sfx(110.45,'thud');sfx(111.92,'heart');
sfx(116.16,'sparkle');sfx(124.6,'tap');sfx(124.95,'tap');sfx(125.3,'pop');sfx(129.4,'impact');sfx(130.0,'fight',6.0);sfx(130.83,'boing');sfx(134.75,'ding');
sfx(148.53,'score');sfx(148.6,'sparkle');

// ---------- scenes ----------
function s0(t){sunCard(915,330,380);floorG(C.red);for(let i=0;i<5;i++)brush([[-200+i*500,GROUND+40],[100+i*500,GROUND+300]],4,{seed:300+i,col:'#B8361F'});
  if(t<5.5){say('ПЕРВОЕ',915,-190,110,t,4.36);say('1',915,150,560,t,3.15,1e9,{col:C.red,maxW:3000})}
  if(t>=5.5){for(let i=0;i<18;i++){const a=i/18*Math.PI*2+.1,r0=300+hash(i)*40,r1=r0+200+hash(i+9)*140;brush([[915+Math.cos(a)*r0,440+Math.sin(a)*r0],[915+Math.cos(a)*r1,440+Math.sin(a)*r1]],11,{seed:200+i})}}
  star(915,440,460,seg(t,5.5,6.3),5);say('ГРЭППЛЕР',915,-150,150,t,6.2,1e9,{col:C.red});if(t>6.3)sparkles(915,-150,t,6.3,1);
  let hx=lerp(560,915,eo(seg(t,0,1.7))),hy=GROUND-160,P,face='calm';
  if(t<1.7){const ph=t*9;P=walk(ph);hy-=Math.abs(Math.cos(ph))*6}else if(t<5.2)P=POSE.stand;
  else if(t<5.6){const u=eo(seg(t,5.2,5.5));P=mix(POSE.stand,POSE.crouch,u);hy+=40*u;face='grit'}
  else{const u=back(seg(t,5.6,6.0));P=mix(POSE.crouch,POSE.win,u);hy+=40*(1-u);face=t>6?'happy':'grit'}
  shadow(hx,110);person(hx,hy,P,t>=5.55?HERO:HERO0,{face,tail:t<6.2?1:0});
  say('?',hx+130,hy-380,150,t,.0,3.15,{col:C.yel});puff(hx,hy-250,seg(t,5.5,6.1),1,20,.8)}
function s1(t){sunCard(1000,380,330);windowX(1000,380,320);floorG();
  box(470,640,240,240,C.red,6,310);box(460,600,120,90,C.gi,5,312);
  if(t>=10.25&&t<G1.leap+.08){ringLines(1190,GROUND-158,118,70);say('ДЗЫНЬ!',1100,410+(Math.round(t*24)%4<2?-4:4),96,t,10.25,1e9,{rot:-.08})}
  grapple(t,G1,T1);if(t>=17.69){score('1:0',t,17.69);say('ЕЩЁ ДО ЗАВТРАКА',915,215,46,t,17.95,1e9,{col:C.yel})}}
function s2(t){box(560,-80,760,640,C.red,0,320);for(let i=1;i<8;i++)brush([[560+i*95,-80],[560+i*95,560]],3,{seed:321+i,col:C.paper});for(let j=1;j<7;j++)brush([[560,-80+j*92],[1320,-80+j*92]],3,{seed:330+j,col:C.paper});
  box(560,-80,760,640,null,6,340);floorG();
  box(520,GROUND-70,64,70,C.gi,5,342);brush([[584,GROUND-56],[606,GROUND-40],[584,GROUND-22]],6,{seed:344});
  say('?',552,GROUND-170,100,t,26.07,27.9,{col:C.yel});grapple(t,G2,T2);if(t>=28.98)score('2:0',t,28.98)}
function s3(t){box(470,60,240,820,C.yel,6,350);box(1150,-40,300,920,C.red,6,352);
  for(let i=0;i<4;i++)for(let j=0;j<2;j++){box(500+j*100,110+i*170,70,100,C.gi,4,360+i*2+j);box(1185+j*130,20+i*180,90,110,C.sun,4,380+i*2+j)}
  floorG();brush([[520,GROUND],[520,GROUND-420]],8,{seed:400,flat:1});box(470,GROUND-520,100,100,C.yel,6,402);letter('А',520,GROUND-470,70,{col:C.ink,lw:1});
  if(t<35.5){let bx=lerp(1900,1060,eo(seg(t,30.5,31.8))),by=GROUND-158,rot=0,e='open';
    if(t>=34.3){const u=seg(t,34.3,35.0);rot=Math.PI*eio(u);by=lerp(GROUND-158,GROUND-170,u)-Math.sin(u*Math.PI)*300;e='bulge'}
    shadow(bx,300);bus(bx,by,rot,{eyes:e,spin:t<31.8?t*20:t>=34.3?t*30:0});
    let hx=560,P=POSE.stand,hy=GROUND-160,face='calm';
    if(t>=33.9&&t<34.3){const u=seg(t,33.9,34.3);P=mix(POSE.stand,POSE.crouch,eo(u));hx=lerp(560,640,u);hy+=40*u;face='grit'}
    else if(t>=34.3&&t<35.0){P=POSE.lift;hx=640;face='grit'}else if(t>=35.0){const u=eo(seg(t,35.0,35.5));P=mix(POSE.lift,POSE.stand,u);hx=lerp(640,560,u);face='happy'}
    shadow(hx,110);person(hx,hy,P,HERO,{face});star(800,GROUND-120,320,seg(t,35.0,35.6),9);puff(1060,GROUND-30,seg(t,35.0,35.8),1,70,1.3);
    if(t>=34.3&&t<35.0)for(let i=0;i<5;i++)speed(700+i*70,700+i*70+10,GROUND-500-i*40,8,410+i)}
  else grapple(t,G3,T3);
  stamp('ОПЛАЧЕНО',915,380,110,t,37.03,{rot:-.15});if(t>=38.85){score('3:0',t,38.85);say('09:00',915,215,70,t,39.43,1e9,{col:C.yel})}}
function s4(t){box(980,-60,320,400,C.sun,6,420);for(let i=1;i<7;i++)brush([[980,-60+i*57],[1300,-60+i*57]],3,{seed:421+i});
  box(470,300,180,180,C.gi,5,430);heart(560,390,4,432);floorG();
  fillShape(ring(915,GROUND+70,440,70,16),C.red,434);brush(ring(915,GROUND+70,440,70,16),5,{closed:true,seed:435});
  const L=44.6;let face='calm';
  if(t<L-.45){const u=eo(seg(t,42.6,43.3));shadow(1000,90);person(1000,GROUND-160,mix(POSE.stand,POSE.reach,u),BOSS,{flip:1,face:'calm'});
    shadow(650,110);person(650,GROUND-160,POSE.stand,HERO,{face:t>43.6?'angry':'calm'})}
  else if(t<L+2/24){shadow(1000,90);person(1000,GROUND-160,POSE.reach,BOSS,{flip:1,face:'bulge'});
    if(t<L-.05){const u=eo(seg(t,L-.45,L-.12));person(650,GROUND-160+48*u,mix(POSE.stand,POSE.crouch,u),HERO,{face:'grit'})}
    else if(t<L+1/24)person(760,GROUND-300,POSE.leap,HERO,{face:'grit',tail:1});
    else{ctx.save();ctx.translate(950,GROUND-330);ctx.scale(2.6,.7);ctx.translate(-950,-(GROUND-330));person(950,GROUND-300,POSE.leap,HERO,{face:'grit',tail:1.4});ctx.restore()}}
  else{const tap=[46.3,46.7,47.1].some(x=>t>=x-.12&&t<x+.06);const P=Object.assign({},POSE.bent,{hF:[170,tap?150:40],eF:[150,tap?60:-30]});
    shadow(1000,120);person(1000,GROUND-160,P,BOSS,{flip:1,face:t>48.0?'shock':'bulge'});
    person(1200,GROUND-150,POSE.choke,HERO,{flip:1,face:t>47.6?'happy':'grit'});
    star(1050,520,300,seg(t,L+2/24,L+.7),11);puff(1000,GROUND-40,seg(t,L+2/24,L+.9),-1,60,1)}
  [46.3,46.7,47.1].forEach((x,i)=>{if(t>=x&&t<x+.45)letter('ТУК!',760+i*30,GROUND-150-i*60,70,{col:C.yel,sc:back(seg(t,x,x+.12)),rot:-.1+i*.08})});
  say('ПОВЫШЕНИЕ?',915,-150,90,t,48.03,1e9,{col:C.yel,rot:-.05});say('УВОЛЬНЕНИЕ?',915,0,90,t,48.9,1e9,{col:C.red,rot:.04});say('?',1180,250,130,t,49.79,1e9,{col:C.yel})}
function s5(t){box(1000,-60,330,380,C.sun,6,450);floorG();
  [[530,Q[0]],[650,Q[1]],[770,Q[2]]].forEach(([x,L],i)=>{const u=back(seg(t,57.88+i*.12,58.2+i*.12));if(u<=0)return;const sh=t>59.95?nz(5,i,1)*4:0;
    head(x+sh,700-110*u,t>59.95?'shock':'calm',0,500+i*20,0,L);if(t>59.95)drop(x+60,600-((Math.round(t*24)*5)%30),.8,560+i)});
  box(450,620,400,260,C.gi,6,470);for(let i=1;i<4;i++)brush([[450,620+i*65],[850,620+i*65]],3,{seed:471+i});
  say('!',1190,GROUND-360,120,t,51.0,53.0,{col:C.red});
  grapple(t,G5,T5);
  for(let i=0;i<10;i++){const ts=54.3+i*.22,u=(t-ts)/1.3;if(u<=0||u>1)continue;const px=1190+(i%2?1:-1)*(120+60*hash(i))*u*1.6,py=GROUND-330-420*u+620*u*u;
    ctx.save();ctx.translate(px,py);ctx.rotate(u*4*(i%2?1:-1));box(-38,-50,76,100,C.gi,4,600+i);for(let k=0;k<3;k++)brush([[-24,-26+k*22],[24,-26+k*22]],3,{seed:620+i*3+k});ctx.restore()}
  stamp('ВПЕРВЫЕ',915,-140,100,t,55.94);stamp('ЗА 3 ГОДА',915,0,100,t,56.2,{rot:.06});
  if(t>59.95)say('!!',650,420,90,t,59.95,1e9,{col:C.red})}
function s6(t){box(560,-40,460,320,C.ink,0,700);for(let i=0;i<4;i++)brush([[600,40+i*60],[960-hash(i)*120,40+i*60]],6,{seed:701+i,col:C.yel});say('МЕНЮ',790,-10,60,t,0,1e9,{col:C.gi});
  floorG();
  [800,960,1120].forEach((x,i)=>{const bob=Math.sin(t*3+i)*3;shadow(x,80);person(x,GROUND-160+bob,POSE.stand,Q[i],{flip:1,face:t>67.2?'shock':'calm',sd:800+i*40});
    say('?',x-20,GROUND-470,90,t,67.3+i*.15,1e9,{col:C.yel})});
  box(400,620,240,260,C.red,6,720);box(390,600,260,34,C.gi,5,722);
  let hx=1260,hy=GROUND-160,P=POSE.stand,rot=0,flip=1,face='calm',prop;
  if(t>=63.85&&t<64.6){const u=eo(seg(t,63.85,64.4));rot=-Math.PI/2*u;hy=lerp(GROUND-160,GROUND-60,u);P=mix(POSE.stand,POSE.lift,u);face='grit'}
  else if(t>=64.6&&t<67.0){const n=6,k=seg(t,64.6,67.0)*n,i=Math.floor(k),f=k-i;rot=-Math.PI/2;hy=GROUND-60-Math.sin(f*Math.PI)*10;hx=lerp(1260,640,(i+eo(f))/n);P=mix(POSE.lift,POSE.crouch,Math.sin(f*Math.PI)*.6);face='grit'}
  else if(t>=67.0){const u=eo(seg(t,67.0,67.4));rot=-Math.PI/2*(1-u);hx=640;hy=lerp(GROUND-60,GROUND-160,u);P=t>70.31?POSE.shrug:mix(POSE.lift,POSE.hold,u);flip=t>67.6?0:1;face=t>70.31?'calm':'happy';
    if(t>67.6&&t<70.31)prop=(hF)=>{box(hF[0]-70,hF[1]-30,140,22,C.yel,5,730);blob(hF[0]-20,hF[1]-44,26,16,C.gi,4,732);blob(hF[0]+30,hF[1]-42,20,14,C.red,4,734)}}
  if(rot===0)shadow(hx,110);person(hx,hy,P,HERO,{rot,flip,face,prop});
  if(t>=64.6&&t<67.0)puff(hx+200,GROUND-20,((t-64.6)%.4)/.4,1,740,.5);
  say('?',hx+40,GROUND-480,130,t,70.31,1e9,{col:C.red})}
function s7(t){box(500,-120,830,1000,C.sun,0,750);floorG();
  const sh=t<73.3?nz(6,1,1)*4:0,g=330*eio(seg(t,74.9,76.3))+(t>74.9&&t<76.3?nz(6,2,1)*6:0);
  ctx.save();ctx.translate(sh,0);
  box(720,300,390,580,C.ink,0,752);blob(915,360,60,22,C.yel,4,754);
  box(720-g/2*1.0,300,195,580,C.yel,6,756);box(915+g/2,300,195,580,C.yel,6,758);brush([[760-g/2,340],[760-g/2,840]],3,{seed:759});brush([[1070+g/2,340],[1070+g/2,840]],3,{seed:760});
  box(690,270,450,610,null,10,762);box(690-40,270,40,610,C.gi,6,764);box(1140,270,40,610,C.gi,6,766);
  box(830,160,170,90,C.ink,0,768);oface(915,205,.5,t<73.75?'angry':t<76.43?'bulge':'x',770);ctx.restore();
  if(t<73.3&&Math.round(t*24)%8<5)say('!',1260,180,120,t,71.66,73.3,{col:C.red});
  const L=73.75;let hx=560,hy=GROUND-160,P=POSE.stand,face='angry';
  if(t>=L-.45&&t<L-.05){const u=eo(seg(t,L-.45,L-.12));P=mix(POSE.stand,POSE.crouch,u);hy+=48*u;face='grit'}
  else if(t>=L-.05&&t<L+.08){P=POSE.leap;hx=650;hy=GROUND-420;face='grit'}
  else if(t>=L+.08&&t<74.6){P=POSE.choke;hx=745;hy=335+Math.sin(t*20)*4;face='grit'}
  else if(t>=74.6){const u=eo(seg(t,74.6,74.85));hx=lerp(745,915,u);hy=lerp(335,GROUND-160,u);P=t<77.0?mix(POSE.choke,POSE.pry,u):POSE.win;face=t<76.43?'grit':'happy'}
  shadow(hx,110);person(hx,hy,P,HERO,{face,tail:t<74.9?1:0});star(915,205,240,seg(t,L+.08,L+.7),13);
  if(t>=76.43)sparkles(915,200,t,76.43,.8)}
function s8(t){for(let k=0;k<7;k++){const x=380+k*330;box(x,140,300,740,k%2?C.yel:C.sun,6,900+k*20);for(let j=1;j<4;j++){brush([[x,140+j*185],[x+300,140+j*185]],5,{seed:901+k*20+j});
    for(let b=0;b<3;b++)box(x+20+b*92,140+j*185-80+hash(k+j+b)*20,70,80-hash(k+j+b)*20,[C.red,C.gi,C.red][(b+j+k)%3],4,940+k*20+j*3+b)}}
  floorG();box(1180,GROUND-130,240,130,C.ink,0,1100);brush([[1180,GROUND-130],[1420,GROUND-130]],6,{seed:1101,col:C.gi});
  if(t<84.93){if(t<81.41){const hx=lerp(520,700,seg(t,79.69,81.4)),ph=t*9;shadow(hx,110);person(hx,GROUND-160-Math.abs(Math.cos(ph))*6,walk(ph,POSE.reach),HERO,{face:'calm'});
      shadow(hx+240,90);propT(hx+240+(0),GROUND-110,0,{eyes:'open'},cart);if(t>=81.0&&t<81.41)say('!',hx+240,GROUND-300,90,t,81.0,81.41,{col:C.red})}
    else grapple(t,G8a,T8a);
    if(t<88.47)propT(1290,GROUND-234,0,{eyes:'angry',err:1},register)}
  else{propT(990,GROUND-120,-1.57,{eyes:'x'},cart);
    if(t<88.47)grapple(t,G8b,T8b);
    else{propT(1250,GROUND-110,1.57,{eyes:'x'},register);grapple(t,G8c,T8c);if(t>=89.2&&t<91.0)say('СТОП!',1500,300,80,t,90.1,91.0,{col:C.red})}}}
function s9(t){box(-1000,-700,6400,1580,C.ink,0,1200);blob(1250,-60,90,90,C.sun,0,1202);
  for(let k=0;k<8;k++){const x=300+k*260,h=380+hash(k)*260;box(x,GROUND-h,220,h,BLDG,0,1210+k);for(let j=0;j<4;j++)for(let i=0;i<2;i++)if(hash(k*9+j*3+i)>.4)box(x+30+i*100,GROUND-h+40+j*90,60,50,C.yel,0,1240+k*8+j*2+i)}
  fillShape([[1010,330],[1060,330],[1250,GROUND],[820,GROUND]],'rgba(246,191,47,.25)',1300);brush([[1035,330],[1035,GROUND]],8,{seed:1302,col:C.gi,flat:1});blob(1035,320,30,18,C.yel,0,1304);
  floorG();
  let hx=lerp(520,700,seg(t,93.23,95.0)),hy=GROUND-160,P=POSE.stand,face='calm',rot=0;
  if(t<95.0){const ph=t*9;P=walk(ph);hy-=Math.abs(Math.cos(ph))*6}
  else if(t>=99.66&&t<100.5){const ph=t*9;hx=lerp(700,900,seg(t,99.66,100.5));P=walk(ph);hy-=Math.abs(Math.cos(ph))*6}
  else if(t>=100.5&&t<101.3){const u=seg(t,100.5,101.3);hx=lerp(900,1450,u);P=POSE.crouch;rot=Math.PI*4*eio(u);hy=GROUND-120;face='grit'}
  else if(t>=101.3){hx=1450;const u=back(seg(t,101.3,101.7));P=mix(POSE.crouch,POSE.win,u);hy=GROUND-160+40*(1-u);face='happy'}
  let cx=lerp(1700,1170,seg(t,95.14,96.2)),cP=t<96.2?walk(t*9):POSE.stop,crot=0,cface=t>96.2?'angry':'calm';
  if(t>=100.85){const u=seg(t,100.85,101.25);cP=POSE.pry;crot=-Math.PI/2*eo(u);cface='x'}
  const cy=t>=100.85?lerp(GROUND-160,GROUND-60,seg(t,100.85,101.25)):GROUND-160;
  shadow(cx,90);if(t>=95.14)person(cx,cy,cP,COP,{flip:1,face:cface,rot:crot});
  shadow(hx,110);person(hx,hy,P,HERO,{face,rot});
  star(1170,600,330,seg(t,100.85,101.5),15);puff(1170,GROUND-40,seg(t,100.85,101.7),1,1310,1.1);
  if(t>=96.2&&t<97.9){const fd=Math.round(t*24);ringLines(cx-120,GROUND-420,40,1320)}
  say('СТОЯТЬ!',915,-120,180,t,97.97,100.5,{col:C.red,rot:-.06});
  say('ГРЕППЛЕР!',1165,-100,110,t,102.47,1e9,{col:C.yel});if(t>102.6)sparkles(1165,-100,t,102.6,.9)}
function s10(t){box(470,-160,1500,1040,C.sun,0,1400);box(560,40,200,240,C.gi,6,1402);heart(660,160,3.6,1404);box(1500,40,200,240,C.gi,6,1406);floorG();
  fillShape(ring(1100,GROUND+70,520,70,16),C.red,1410);
  box(470,560,380,200,C.red,6,1412);box(450,700,420,180,C.red,6,1414);
  let hx=650,hy=GROUND-160,P=POSE.stand,face='happy',rot=0;
  const catSt={eyes:'calm'};let catFlat=false;
  if(t<105.2){const ph=t*9;hx=lerp(650,900,seg(t,104.12,105.2));P=walk(ph,POSE.pry);hy-=Math.abs(Math.cos(ph))*6}
  else if(t<105.5){const u=eo(seg(t,105.2,105.5));hx=lerp(900,960,u);rot=Math.PI/2*u;hy=lerp(GROUND-160,GROUND-120,u);P=POSE.pry}
  else if(t<108.6){hx=960;rot=Math.PI/2;hy=GROUND-125;P=POSE.choke;catFlat=true;face='happy'}
  else if(t<109.0){const u=eo(seg(t,108.6,109.0));hx=960;rot=Math.PI/2*(1-u);hy=lerp(GROUND-125,GROUND-160,u);catFlat=true}
  else if(t<110.3){catFlat=true;const ph=t*9;hx=lerp(960,1200,seg(t,109.56,110.3));P=t>109.56?walk(ph,POSE.pry):POSE.stand;}
  else{catFlat=true;const u=eo(seg(t,110.3,110.45));hx=1220;rot=Math.PI/2*u;hy=lerp(GROUND-160,GROUND-120,u);P=POSE.choke}
  shadow(1120,110);propT(1120,catFlat?GROUND-40:GROUND-80,0,{eyes:catFlat?(t<108.6?'angry':'x'):'calm',flat:catFlat},cat);
  let mx=lerp(1800,1460,seg(t,108.05,108.8)),mP=t<108.8?walk(t*9):POSE.stop,mrot=0,my=GROUND-160,mface='calm';
  if(t>=110.45){mrot=Math.PI/2;my=GROUND-60;mP=POSE.pry;mface='happy';mx=1440}
  if(t>=108.05){shadow(mx,90);person(mx,my,mP,MOM,{flip:1,face:mface,rot:mrot,prop:t<110.3?(hF)=>{brush([[hF[0],hF[1]],[hF[0]+10,hF[1]-90]],7,{seed:1420});blob(hF[0]+12,hF[1]-100,20,14,C.gi,4,1421)}:null})}
  if(rot===0)shadow(hx,110);person(hx,hy,P,HERO,{face,rot});
  puff(1100,GROUND-40,seg(t,105.5,106.3),1,1430,1);puff(1350,GROUND-40,seg(t,110.45,111.2),1,1440,1);
  say('УЖИНАТЬ!',1460,240,80,t,108.3,109.6,{col:C.yel});
  if(t>=111.92){const s=6*back(seg(t,111.92,112.2))*(1+.06*Math.sin(t*12));heart(1215,260,s,1450);say('ЛЮБОВЬ = ЗАХВАТ',1215,-80,60,t,112.2,1e9,{col:C.yel})}}
function s11(t){box(470,-200,900,1080,C.gi,6,1500);for(let i=0;i<9;i++){const x=470+i*100;fillShape([[x,140],[x+100,140],[x+100,250],[x+50,280],[x,250]],i%2?C.red:C.gi,1510+i);brush([[x,140],[x,250],[x+50,280],[x+100,250]],4,{seed:1520+i})}
  brush([[470,140],[1370,140]],6,{seed:1530});say('РЕСТОРАН',915,40,70,t,0,1e9,{col:C.red});
  box(1040,340,280,300,C.sun,6,1532);windowX(1180,490,140);box(560,340,200,540,C.ink,0,1534);blob(730,620,10,10,C.yel,0,1536);floorG();
  const flowers=(hF)=>{[[0,-50,C.red],[-30,-70,C.yel],[26,-74,C.red],[0,-96,C.yel]].forEach(([dx,dy,c],i)=>{brush([[hF[0],hF[1]],[hF[0]+dx*.5,hF[1]+dy*.6]],4,{seed:1540+i});blob(hF[0]+dx,hF[1]+dy,18,17,c,4,1544+i)})};
  if(t<130.0){
    if(t<123.3-.45){shadow(1130,90);person(1130,GROUND-160,POSE.hold,GIRL,{flip:1,face:'calm',prop:flowers});
      let hx=lerp(380,700,seg(t,117.32,119.0)),P=POSE.stand,hy=GROUND-160;if(t>117.32&&t<119.0){P=walk(t*9);hy-=Math.abs(Math.cos(t*9))*6}
      if(t>117.0){shadow(hx,110);person(hx,hy,P,HERO,{face:'happy'})}}
    else grapple(t,G11,Object.assign({},T11,{draw:(cx,cy,r,st)=>person(cx,cy,POSE.hold,GIRL,{flip:1,face:st.eyes,prop:flowers})}));
    if(t>=116.16&&t<119.5)[[-120,-420],[110,-460],[0,-560]].forEach(([dx,dy],i)=>{const u=seg(t,116.16+i*.15,116.5+i*.15);if(u>0)heart(1130+dx,GROUND+dy-u*30,2.2*back(u),1560+i*2)});
    [124.6,124.95].forEach((x,i)=>{if(t>=x&&t<x+.45)letter('ТУК!',900+i*40,380-i*50,60,{col:C.yel,sc:back(seg(t,x,x+.12))})});
    if(t>=125.3&&t<130.0){const u=back(seg(t,125.3,125.5));ctx.save();ctx.translate(915,-40);ctx.scale(u,u);
      const B=ring(0,0,420,170,14);fillShape(B,C.gi,1570);brush(B,6,{closed:true,seed:1571});const T=[[150,140],[260,300],[60,160]];fillShape(T,C.gi,1572);brush([[150,148],[260,300],[60,166]],6,{seed:1573});
      ctx.font='62px Pango';ctx.fillStyle=C.ink;ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText('«Я тоже ходила',nz(8,1,1),-36+nz(8,1,2));ctx.fillText('на одно занятие»',nz(8,2,1),40+nz(8,2,2));ctx.restore()}
    star(1000,500,280,seg(t,129.4,130.0),17)}
  else{const fd=Math.round(t*24),cx=915,cy=640;
    for(let i=0;i<5;i++){const a=hash(fd*3+i)*Math.PI*2,r=230;const x0=cx+Math.cos(a)*r*.8,y0=cy+Math.sin(a)*r*.55;tube([[x0,y0],[x0+Math.cos(a)*120,y0+Math.sin(a)*90]],i%2?36:42,i%3===0?C.red:C.skin,5,1580+i);
      blob(x0+Math.cos(a)*130,y0+Math.sin(a)*100,24,22,i%2?C.ink:C.skin,5,1590+i)}
    for(let i=0;i<9;i++){const a=i/9*Math.PI*2+BI*.4,r=150+40*hash(i+fd);blob(cx+Math.cos(a)*r*1.25,cy+Math.sin(a)*r*.7,120+30*hash(i*7+BI),100+30*hash(i*5+BI),C.gi,6,1600+i)}
    blob(cx,cy,230,150,C.gi,0,1620);for(let i=0;i<3;i++){const a=hash(fd+i*11)*6.28;sparkle(cx+Math.cos(a)*200,cy-120+Math.sin(a)*80,36,1630+i*3)}
    say(['БАМ!','ХРЯСЬ!','ТУК!'][Math.floor(t*2)%3],cx+(Math.floor(t*2)%2?180:-180),cy-220,60,t,130.0,1e9,{col:C.yel,rot:.1});
    for(let i=0;i<6;i++){const u=seg(t,130+i*.1,131.6+i*.1);if(u>0&&u<1){const px=800+i*50+Math.sin(u*9+i)*40,py=500+u*360;blob(px,py,10,7,i%2?C.red:C.yel,3,1650+i)}}
    say('ТУРНИР!',915,-150,140,t,130.83,1e9,{col:C.yel,rot:-.04});if(t>131)sparkles(915,-150,t,131,.9);
    if(t>=133.03){const wx=lerp(300,560,seg(t,133.03,134.0)),wP=t<134.0?walk(t*9,POSE.lift):POSE.lift;shadow(wx,90);person(wx,GROUND-160,wP,WAITER,{face:'calm',prop:t<134.3?(hF)=>{box(hF[0]-70,hF[1]-18,170,18,C.ink,0,1660);box(hF[0]-20,hF[1]-80,70,60,C.gi,4,1662)}:null})}
    if(t>=134.3){const u=seg(t,134.3,134.75),bx=lerp(620,900,eo(u)),by=u<1?lerp(500,470,u)-Math.sin(u*Math.PI)*200:470;ctx.save();ctx.translate(bx,by);ctx.rotate(u<1?u*3:.1);box(-60,-80,120,160,C.gi,5,1670);
      letter('СЧЁТ',0,-40,30,{col:C.red,lw:1});for(let k=0;k<3;k++)brush([[-40,0+k*24],[40,0+k*24]],3,{seed:1672+k});ctx.restore()}}}
const FIN={t0:137.0,t1:145.0,D:3360};
const finP=t=>FIN.D*eio(seg(t,FIN.t0,FIN.t1));
function s12(t,pan){ctx.save();ctx.translate(pan*.8,0);sunCard(1000,300,360);ctx.restore();
  ctx.save();ctx.translate(pan*.45,0);for(let k=0;k<10;k++){const x=300+k*300,h=300+hash(k+40)*300;box(x,GROUND-h,240,h,k%2?C.red:C.yel,6,1700+k);for(let j=0;j<3;j++)box(x+40,GROUND-h+40+j*90,60,50,C.gi,4,1720+k*3+j)}ctx.restore();
  floorG();
  ctx.save();ctx.translate(pan*.2,0);bus(1700,GROUND-170,Math.PI,{eyes:'x'});ctx.restore();
  const items=[(x)=>clock(x,GROUND-100,100,1.57,{eyes:'x'}),(x)=>propT(x,GROUND-95,1.57,{eyes:'x'},coffee),null,(x)=>propT(x,GROUND-90,1.57,{eyes:'x'},printer),
    (x)=>{ctx.save();ctx.translate(x,GROUND-40);ctx.rotate(-1.57);box(-40,-180,80,360,C.yel,6,1750);oface(0,-40,.5,'x',1752);ctx.restore()},
    (x)=>person(x,GROUND-60,POSE.pry,BOSS,{rot:1.57,face:'x',flip:1}),(x)=>person(x,GROUND-60,POSE.pry,GUARD,{rot:-1.57,face:'x'}),
    (x)=>person(x,GROUND-60,POSE.pry,COP,{rot:1.57,face:'x',flip:1}),(x)=>propT(x,GROUND-40,0,{eyes:'x',flat:1},cat),(x)=>person(x,GROUND-60,POSE.pry,GIRL,{rot:-1.57,face:'smug'})];
  items.forEach((fn,i)=>{if(!fn)return;const ti=137.9+i*.6,x=915-200+finP(ti);if(Math.abs(x-(915+pan))<900)fn(x)});
  let hx=915+pan,hy=GROUND-160,P=POSE.stand,face='calm';
  if(t>=FIN.t0&&t<FIN.t1+.1){const ph=pan/34;P=walk(ph);hy-=Math.abs(Math.cos(ph))*6}
  if(t>=145.6){const u=back(seg(t,145.6,146.0));P=mix(POSE.stand,POSE.win,u);face='happy'}
  shadow(hx,110);person(hx,hy,P,HERO,{face});
  say('ТЕБЯ НИКТО',hx,-170,110,t,148.4,1e9,{col:C.red,rot:-.04});say('НЕ ОСТАНОВИТ',hx,-20,110,t,148.6,1e9,{col:C.yel,rot:.03});if(t>148.8)sparkles(hx,-100,t,148.8,1)}
const SCN=[s0,s1,s2,s3,s4,s5,s6,s7,s8,s9,s10,s11,s12];
const PAN=[0,0,0,0,0,0,0,0,t=>280*eio(seg(t,84.95,85.8))+300*eio(seg(t,88.5,89.4)),t=>250*eio(seg(t,100.6,101.6)),t=>300*eio(seg(t,108.3,109.2)),0,finP];

// ---------- timing ----------
const HOLD3=148.75;
function held(f){const t=f/FPS,h=Math.round(HOLD3*FPS);if(f>=h)return h+Math.floor((f-h)/3)*3;for(const [a,b] of ONES)if(t>=a&&t<b)return f;return f-(f%2)}
function boilIndex(f){let c=0,p=-1;for(let i=0;i<=f;i++){const h=held(i);if(h!==p){c++;p=h}}return c%4}
function subs(t){const c=CUES.find(c=>t>=c[0]&&t<c[3]);if(!c)return;ctx.font='64px Pango';const words=c[1].split(' '),lines=[];let cur='';
  for(const w of words){const tt=cur?cur+' '+w:w;if(ctx.measureText(tt).width>950&&cur){lines.push(cur);cur=w}else cur=tt}lines.push(cur);
  const lh=78,y0=1590-(lines.length-1)*lh/2,pop=back(seg(t,c[0],c[0]+.16));
  ctx.save();ctx.translate(540,y0);ctx.scale(pop,pop);ctx.textAlign='center';ctx.textBaseline='middle';ctx.lineJoin='round';
  lines.forEach((l,i)=>{const jx=nz(7,i,1)*1.2,jy=nz(7,i,2)*1.2;ctx.lineWidth=12;ctx.strokeStyle=C.paper;ctx.strokeText(l,jx,i*lh+jy);ctx.fillStyle=C.ink;ctx.fillText(l,jx,i*lh+jy)});ctx.restore()}
function wipe(t){for(const b of SC.slice(1)){const u=(t-b+.28)/.56;if(u<=0||u>=1)continue;const cov=u<.5?eo(u*2):1-ei((u-.5)*2);
  for(let i=0;i<3;i++)for(let j=0;j<6;j++){const cx=i*540+(hash(i*7+j+b)-.5)*120,cy=j*384+(hash(i+j*5+b)-.5)*120,r=cov*(300+hash(i*3+j+b)*80);if(r>6)blob(cx,cy,r,r*.94,C.gi,7,2000+i*6+j)}}}
function frame(f){const fd=held(f),t=fd/FPS;BI=boilIndex(f);
  let k=0;for(let i=0;i<SC.length;i++)if(t>=SC[i])k=i;
  let shx=0,shy=0;for(const ti of IMPACTS){const d=t-ti;if(d>=0&&d<.22){const q=(.22-d)/.22;shx+=nz(1,fd,1)*22*q;shy+=nz(1,fd,2)*16*q}}
  const pan=PAN[k]?PAN[k](t):0,end=k+1<SC.length?SC[k+1]:150.2,zoom=1+.035*eio(seg(t,SC[k],end));
  ctx.setTransform(1,0,0,1,0,0);ctx.fillStyle=C.paper;ctx.fillRect(0,0,VW,VH);
  ctx.translate(VW/2+shx,VH/2+shy);ctx.scale(zoom*CAM_S,zoom*CAM_S);ctx.translate(-(915+pan),-513);
  SCN[k](t,pan);
  ctx.setTransform(1,0,0,1,0,0);subs(t);wipe(t);
  ctx.globalCompositeOperation='multiply';ctx.globalAlpha=.85;const o=REG[BI];ctx.drawImage(paper,-20+o[0]*2,-20+o[1]*2);ctx.globalAlpha=1;ctx.globalCompositeOperation='source-over'}
window.render=frame;window.SFXLIST=SFX;
