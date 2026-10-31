// Timeline: world model, scenes, cameras. All times in seconds (voice-aligned).
const DUR = 76.0, FPS = 60;
const clamp=(x,a=0,b=1)=>Math.min(b,Math.max(a,x));
const lerp=(a,b,t)=>a+(b-a)*t;
const sstep=(a,b,x)=>{const t=clamp((x-a)/(b-a));return t*t*(3-2*t);};
const smoother=(a,b,x)=>{const t=clamp((x-a)/(b-a));return t*t*t*(t*(t*6-15)+10);};
const eIO=t=>{t=clamp(t);return t<.5?4*t*t*t:1-Math.pow(-2*t+2,3)/2;};
const eOut=t=>1-Math.pow(1-clamp(t),3);
const eIn=t=>Math.pow(clamp(t),3);
const eOutExpo=t=>{t=clamp(t);return t===1?1:1-Math.pow(2,-10*t);};
const eOutBack=t=>{t=clamp(t);const c1=1.70158,c3=c1+1;return 1+c3*Math.pow(t-1,3)+c1*Math.pow(t-1,2);};
const win=(t,a,b,f)=>sstep(a,a+f,t)*(1-sstep(b-f,b,t));
const TAU=Math.PI*2;

// Catmull-Rom keyframe track over arrays or numbers. keys: [[t, v], ...]
function track(t,keys){
  const n=keys.length;
  if(t<=keys[0][0]) return keys[0][1];
  if(t>=keys[n-1][0]) return keys[n-1][1];
  let i=0; while(i<n-2 && t>keys[i+1][0]) i++;
  const k0=keys[Math.max(i-1,0)],k1=keys[i],k2=keys[i+1],k3=keys[Math.min(i+2,n-1)];
  const u=(t-k1[0])/(k2[0]-k1[0]);
  const dt=k2[0]-k1[0];
  const f=(a0,a1,a2,a3)=>{
    const m1=(k1===k0)?0:(a2-a0)/(k2[0]-k0[0])*dt;
    const m2=(k3===k2)?0:(a3-a1)/(k3[0]-k1[0])*dt;
    const u2=u*u,u3=u2*u;
    return (2*u3-3*u2+1)*a1+(u3-2*u2+u)*m1+(-2*u3+3*u2)*a2+(u3-u2)*m2;
  };
  const v1=k1[1];
  if(typeof v1==='number') return f(k0[1],k1[1],k2[1],k3[1]);
  return v1.map((_,j)=>f(k0[1][j],k1[1][j],k2[1][j],k3[1][j]));
}

// ---------- World ----------
const PLANETS=[
 {n:'Меркурий',a:3.0, r:0.13,type:0,P:88,    col:[.85,.75,.65],ph:2.2},
 {n:'Венера',  a:4.3, r:0.21,type:1,P:224.7, col:[1,.85,.6],   ph:4.1},
 {n:'Земля',   a:5.8, r:0.23,type:2,P:365.25,col:[.45,.7,1],   ph:1.29},
 {n:'Марс',    a:7.3, r:0.16,type:3,P:687,   col:[1,.55,.35],  ph:5.3},
 {n:'Юпитер',  a:10.4,r:0.62,type:4,P:4333,  col:[1,.85,.65],  ph:3.3},
 {n:'Сатурн',  a:13.6,r:0.52,type:5,P:10759, col:[1,.9,.7],    ph:0.6},
 {n:'Уран',    a:16.6,r:0.36,type:6,P:30687, col:[.6,.9,1],    ph:2.5},
 {n:'Нептун',  a:19.6,r:0.35,type:7,P:60190, col:[.45,.6,1],   ph:4.6},
];
const EARTH=2;
function planetAng(i,days,phs){const p=PLANETS[i];return (phs?phs[i]:p.ph)+TAU*days/p.P;}
function planetPos(i,days,phs){const p=PLANETS[i];const th=planetAng(i,days,phs);return [p.a*Math.cos(th),0,p.a*Math.sin(th)];}

const T_COLL=2.0, T_ARRIVE=12.68;
const C_SHOW=PLANETS[EARTH].a/(T_ARRIVE-T_COLL);
const frontR=t=>Math.max(0,(t-T_COLL)*C_SHOW);

function baseU(){
  return {
    uMode:0, uSkyBright:1.0, uTime:0, uSeed:0,
    uStar0:[0,0,0,1.2], uStar0Col:[1.0,.62,.28,0], uStar1:[0,0,0,1], uStar1Col:[.55,.7,1,0],
    uBH:[0,0,0,0.34], uLens:1.0, uBHAlpha:0,
    uPl:new Array(40).fill(0), uPlInfo:new Array(40).fill(0), uPlInfo2:new Array(40).fill(0), uPlN:0,
    uLightPos:[0,0,0], uAmb:[.10,.14,.24], uFill:0.25,
    uOrb:new Array(9).fill(0), uOrbAng:new Array(9).fill(0), uOrbCol:new Array(27).fill(0.6), uOrbA:0, uTrailA:0,
    uFront:0, uFrontA:0, uExpo:1, uFade:0, uFlash:0, uFlashCol:[1,.9,.75], uVig:1,
    uSunDir:[0,.5,.86], uDay:1, uSunDisk:1,
    uDepth:0, uPanX:0, uScale:1.6, uVent:0, uBact:0, uCore:0,
  };
}
// planets list -> uniforms. items: {pos,r,type,lit,ice,spin,city,tilt}
function setPlanets(U,items){
  U._items=items;
  U.uPlN=items.length;
  items.forEach((p,i)=>{
    U.uPl.splice(i*4,4,p.pos[0],p.pos[1],p.pos[2],p.r);
    U.uPlInfo.splice(i*4,4,p.type,p.lit??0,p.ice??0,p.spin??0);
    U.uPlInfo2.splice(i*4,4,p.city??0,p.tilt??0.2,0,0);
  });
}
function setOrbits(U,days,alpha,trail,hl,phs){
  for(let i=0;i<8;i++){
    U.uOrb[i]=PLANETS[i].a; U.uOrbAng[i]=planetAng(i,days,phs);
    const c=PLANETS[i].col, h=hl?(hl[i]??0):0;
    U.uOrbCol.splice(i*3,3,lerp(.55,c[0],.5+.5*h)*(1+h*1.5),lerp(.65,c[1],.5+.5*h)*(1+h*1.5),lerp(.85,c[2],.5+.5*h)*(1+h*1.5));
  }
  U.uOrbA=alpha; U.uTrailA=trail;
}
function systemPlanets(days,litFn,opts={}){
  return PLANETS.map((p,i)=>({pos:planetPos(i,days,opts.phs),r:p.r*(opts.scale??1),type:p.type,lit:litFn?litFn(i):0,
    ice:opts.ice??0,spin:(opts.spinT??0)*(i===EARTH?0.25:0.15)+i,city:i===EARTH?(opts.city??0):0,tilt:i===5?0.45:(i===6?1.4:0.25)}));
}
function orbitCam(target,dist,yaw,pitch,roll,fov){
  const cp=Math.cos(pitch);
  const pos=[target[0]+dist*cp*Math.cos(yaw),target[1]+dist*Math.sin(pitch),target[2]+dist*cp*Math.sin(yaw)];
  return camBasis(pos,target,roll,fov);
}
function camU(U,cam){U.uCamPos=cam.pos;U.uCamF=cam.F;U.uCamR=cam.R;U.uCamU=cam.U;U.uTanHalf=cam.tanHalf;}

// ---------- Scenes ----------
// each returns {U, cam, ov:{...data for overlay}}
const SCENES=[];
function scene(t0,t1,fn,mb){SCENES.push({t0,t1,fn,mb:mb||(()=>1)});}

// S1 HOOK 0 – 3.72
scene(0,3.72,(t)=>{
  const U=baseU(); const days=t*0.8;
  // sun collapse
  const c0=1.58;
  let sr=1.2*(1+0.01*Math.sin(t*3)), si=1.0, scol=[1.0,.52,.2];
  if(t>c0){const k=clamp((t-c0)/(T_COLL-c0)); sr=1.2*(1-Math.pow(k,2.2)); si=1.0+k*k*9; scol=[lerp(1,.9,k),lerp(.52,.85,k),lerp(.2,1.0,k)];}
  if(t>=T_COLL) si=0;
  U.uStar0=[0,0,0,Math.max(sr,0.001)]; U.uStar0Col=[...scol,si];
  U.uBHAlpha=sstep(T_COLL-0.06,T_COLL+0.12,t); U.uBH=[0,0,0,0.30];
  U.uLens=1.0+0.6*Math.exp(-Math.max(0,t-T_COLL)*3)*U.uBHAlpha;
  const fl=t>=T_COLL-0.04?Math.exp(-(t-T_COLL+0.04)*14):0;
  U.uFlash=fl*0.6; U.uFlashCol=[1,.92,.8];
  U.uFront=frontR(t); U.uFrontA=t>T_COLL?(0.5+1.5*Math.exp(-(t-T_COLL)*2.5)):0;
  const F=U.uFront;
  setPlanets(U,systemPlanets(days,i=>sstep(F-0.05,F+0.05,PLANETS[i].a),{city:1,spinT:t}));
  setOrbits(U,days,0.18,0.0);
  U.uExpo=1.0*sstep(-0.2,0.5,t);
  U.uAmb=[.05,.07,.12];
  // camera: drift toward sun, slight lateral arc; shake at collapse
  const shake=t>T_COLL?Math.exp(-(t-T_COLL)*3)*0.03:0;
  const pos=track(t,[[0,[3.1,1.0,10.4]],[1.6,[2.2,0.75,9.0]],[3.72,[0.9,0.45,7.4]]]);
  const tg=track(t,[[0,[0.2,-0.55,0]],[3.72,[-0.1,-0.25,0]]]);
  const cam=camBasis([pos[0]+shake*Math.sin(t*61),pos[1]+shake*Math.cos(t*53),pos[2]],tg,lerp(0.06,-0.03,eIO(t/3.72)),46);
  return {U,cam,ov:{days}};
},t=>(t>1.75&&t<2.5)?3:1);

// S2 LIGHT FRONT 3.72 – 10.02
const S2T1=10.02;
scene(3.72,S2T1,(t)=>{
  const U=baseU(); const days=t*0.8;
  const F=frontR(t);
  U.uBHAlpha=1; U.uBH=[0,0,0,0.30];
  U.uFront=F; U.uFrontA=0.75;
  setPlanets(U,systemPlanets(days,i=>sstep(F-0.06,F+0.06,PLANETS[i].a),{city:1,spinT:t}));
  setOrbits(U,days,0.22,0.0);
  U.uAmb=[.05,.07,.12];
  const e=V.norm(planetPos(EARTH,days)); const side=[-e[2],0,e[0]];
  const u=(t-3.72)/(S2T1-3.72);
  const back=lerp(-4.4,1.7,eIO(u*0.9+0.05));
  const h=lerp(4.6,1.9,eIO(u));
  const pos=V.add(V.add(V.mul(e,back),V.mul(side,lerp(-1.6,-0.9,u))),[0,h,0]);
  const tg=V.add(V.mul(e,lerp(2.4,5.4,eIO(u))),[0,-0.2,0]);
  const cam=camBasis(pos,tg,lerp(-0.08,0.04,u),lerp(52,40,eIO(u)));
  return {U,cam,ov:{days,F}};
});

// S2b SURFACE SKY 10.02 – 13.27
scene(S2T1,13.27,(t)=>{
  const U=baseU(); U.uMode=1;
  const u=(t-S2T1)/(13.27-S2T1);
  const off=sstep(T_ARRIVE-0.02,T_ARRIVE+0.10,t);
  U.uSunDisk=1-off; U.uDay=1-sstep(T_ARRIVE,T_ARRIVE+0.55,t);
  U.uSunDir=V.norm([0.10,0.50,1]);
  U.uSkyBright=1.0;
  const pitch=lerp(0.30,0.40,eIO(u)), yaw=lerp(0.02,0.10,eIO(u));
  const F=[Math.sin(yaw)*Math.cos(pitch),Math.sin(pitch),Math.cos(yaw)*Math.cos(pitch)];
  const cam=camBasis([0,0,0],F,lerp(0.02,-0.02,u),lerp(60,54,u));
  U.uExpo=1.0;
  return {U,cam,ov:{off}};
});

// S3 SIZE 13.27 – 19.10 : ghost sun -> dolly into 6 km hole -> pull back
const S3T1=19.10;
function s3dist(t){
  // exponential dolly: far 6.0 -> near 0.075 -> far 9.0
  return Math.exp(track(t,[[13.27,Math.log(6.4)],[15.2,Math.log(5.4)],[16.45,Math.log(0.14)],[17.35,Math.log(0.12)],[18.6,Math.log(9.0)],[19.1,Math.log(10.0)]]));
}
scene(13.27,S3T1,(t)=>{
  const U=baseU(); const days=40+t*0.8;
  U.uBHAlpha=1; U.uLens=1;
  const d=s3dist(t);
  // physical tiny hole while close; grows to stylised size only far away
  const tiny=0.012;
  const big=0.30;
  const w=t<17.3?tiny:lerp(tiny,big,sstep(17.6,18.9,t));
  U.uBH=[0,0,0,w];
  U.uSkyBright=1.0;
  setPlanets(U,[{pos:planetPos(EARTH,days),r:0.23,type:2,lit:0,city:1,spin:t*0.2}]);
  U.uAmb=[.06,.08,.14];
  const yaw=track(t,[[13.27,0.35],[16.4,0.6],[17.4,0.7],[19.1,1.25]]);
  const pitch=track(t,[[13.27,0.12],[16.4,0.05],[17.4,0.06],[19.1,0.28]]);
  const e=planetPos(EARTH,days);
  const A=orbitCam([0,0,0],d,yaw,pitch,0,48);
  const k=smoother(17.4,18.75,t);
  const dir=V.norm(e), side=[-dir[2],0,dir[0]];
  const posB=V.add(V.add(V.add(e,V.mul(dir,1.15)),V.mul(side,-0.15)),[0,0.32,0]);
  const tgtB=V.add(V.lerp(e,[0,0,0],0.75),[0,-0.35,0]);
  const cam=camBasis(V.lerp(A.pos,posB,k),V.lerp([0,0,0],tgtB,k),track(t,[[13.27,0.04],[16.4,-0.12],[17.4,0.1],[19.1,-0.03]]),48);
  return {U,cam,ov:{d,days}};
},t=>((t>15.4&&t<16.5)||(t>17.4&&t<18.7))?4:1);

// S3b GRAVITY GRID 19.10 – 23.20
const S3bT1=23.20;
const WELL_K=2.6;
function wellEps(t){return lerp(1.25,0.10,smoother(19.9,21.3,t));}
function wellDepth(r,eps){return -WELL_K/Math.sqrt(r*r+eps*eps)+WELL_K/14;}
scene(S3T1,S3bT1,(t)=>{
  const U=baseU(); const days=60+t*0.6;
  const eps=wellEps(t);
  const sunness=1-smoother(19.9,21.0,t);
  const ep=planetPos(EARTH,days);
  const er=PLANETS[EARTH].a;
  const eY=wellDepth(er,eps)+0.23;
  const yCore=Math.max(wellDepth(0,eps),-5.0);
  U.uStar0=[0,yCore+0.3,0,0.6*sunness+0.001]; U.uStar0Col=[1,.62,.3,sunness>0.01?1.2*sunness:0];
  U.uBHAlpha=1-sunness; U.uBH=[0,Math.max(wellDepth(0.18,eps),-5.0),0,0.16]; U.uLens=1;
  setPlanets(U,[{pos:[ep[0],eY,ep[2]],r:0.23,type:2,lit:0,city:1,spin:t*0.2}]);
  U.uAmb=[.07,.09,.16];
  const u=(t-S3T1)/(S3bT1-S3T1);
  const eAng=Math.atan2(ep[2],ep[0]);
  const yaw=eAng+lerp(0.85,0.45,eIO(u));
  const cam=orbitCam([ep[0]*0.42,-1.4,ep[2]*0.42],lerp(13.5,11.5,eIO(u)),yaw,lerp(0.42,0.36,u),lerp(0.05,-0.02,u),46);
  return {U,cam,ov:{eps,ep:[ep[0],eY,ep[2]],days}};
});

// S4 YEAR 23.20 – 28.05
const S4T1=28.05;
const S4A=23.45,S4B=27.0;
function s4days(t){return 365.25*smoother(S4A,S4B,t);}
scene(S3bT1,S4T1,(t)=>{
  const U=baseU();
  const days=100+s4days(t)+ (t-S3bT1)*0.5;
  U.uBHAlpha=1; U.uBH=[0,0,0,0.32];
  const hl=[0,0,1,0,0,0,0,0];
  setPlanets(U,systemPlanets(days,null,{city:1,spinT:t,scale:1.25}));
  setOrbits(U,days,0.55,1.2*sstep(S4A,S4A+0.3,t),hl);
  U.uAmb=[.07,.09,.16];
  const u=(t-S3bT1)/(S4T1-S3bT1);
  const yaw=lerp(1.0,1.9,eIO(u))+planetAng(EARTH,100)*0;
  const cam=orbitCam([0,-0.6,0],lerp(17.5,15.0,eIO(u)),yaw,lerp(0.95,0.72,eIO(u)),lerp(0.0,0.06,u),46);
  return {U,cam,ov:{days,count:Math.min(365,Math.round(s4days(t)))}};
});

// S5 FREEZE 28.05 – 34.62
const S5T1=34.62;
scene(S4T1,S5T1,(t)=>{
  const U=baseU();
  const u=(t-S4T1)/(S5T1-S4T1);
  const city=1-sstep(28.3,30.4,t);
  const ice=smoother(31.4,34.3,t);
  const ep=[0,0,0];
  setPlanets(U,[{pos:ep,r:0.23,type:2,lit:0,ice,city,spin:2.2+t*0.05,tilt:0.35}]);
  U.uBHAlpha=0;
  U.uAmb=[.16,.20,.32]; U.uFill=0.55;
  const cam=orbitCam(ep,lerp(1.05,0.78,eIO(u)),lerp(0.2,-0.25,u),lerp(0.25,0.55,eIO(u)),lerp(-0.1,0.05,u),40);
  // shift earth lower in frame
  const off=V.mul(cam.U,-0.10*lerp(1,0.6,u)); cam.pos=V.sub(cam.pos,off);
  return {U,cam,ov:{u,ice,city}};
});

// S6 MOON 34.62 – 39.45
const S6T1=39.45;
scene(S5T1,S6T1,(t)=>{
  const U=baseU();
  const u=(t-S5T1)/(S6T1-S5T1);
  const mp=[0,0,0];
  // moon lit (memory of sunlight) then fades on "гаснет", relights faintly in diagram, then off
  const lit=lerp(1,0,sstep(35.1,35.75,t))+0.85*win(t,36.1,38.55,0.35);
  const yawM=lerp(0.55,0.95,u); U.uLightPos=[Math.cos(yawM+1.25)*100,22,Math.sin(yawM+1.25)*100];
  setPlanets(U,[{pos:mp,r:0.07,type:8,lit,spin:1.3+t*0.03,tilt:0.1}]);
  U.uAmb=[.05,.065,.11]; U.uFill=0.25;
  const cam=orbitCam(mp,lerp(0.46,0.38,eIO(u)),lerp(0.55,0.95,u),lerp(0.12,0.2,u),lerp(0.05,-0.04,u),44);
  return {U,cam,ov:{lit,mp}};
});

// S7 DANCE 39.45 – 53.30
const S7T1=53.30;
const S7RATE=t=>lerp(40,9,sstep(41.6,42.4,t))*(1-sstep(48.8,50.0,t))+sstep(48.8,50.0,t)*14;
const S7TAB=(()=>{const tab=[];let d=0;for(let t=39.45;t<=53.4;t+=1/240){tab.push(d);d+=S7RATE(t)/240;}return tab;})();
function s7days(t){const x=(t-39.45)*240;const i=Math.max(0,Math.min(S7TAB.length-2,Math.floor(x)));return 900+lerp(S7TAB[i],S7TAB[i+1],clamp(x-i));}
const S7YAW=t=>track(t,[[39.45,-0.6],[44.6,0.2],[48.3,0.75],[53.3,1.15]]);
const S7PH=(()=>{const ph=PLANETS.map(p=>p.ph);
  const fix=(i,tc,off)=>{ph[i]=S7YAW(tc)+off-TAU*s7days(tc)/PLANETS[i].P;};
  fix(0,43.45,0.0); fix(2,45.6,0.35); fix(7,47.9,Math.PI-0.35); fix(1,40.5,1.2); fix(3,44,-1.0);
  return ph;})();
scene(S6T1,S7T1,(t)=>{
  const U=baseU();
  const days=s7days(t);
  U.uBHAlpha=1; U.uBH=[0,0,0,0.34];
  const hlM=win(t,42.2,44.7,0.3), hlE=win(t,44.5,46.75,0.3), hlN=win(t,46.7,49.2,0.3);
  const hl=[hlM,0,hlE,0,0,0,0,hlN];
  setPlanets(U,systemPlanets(days,null,{city:0.6,spinT:t,scale:1.35,phs:S7PH}));
  const quiet=sstep(50.4,53.0,t);
  setOrbits(U,days,0.6*(1-quiet*0.6),1.0*(1-quiet*0.7),hl,S7PH);
  U.uAmb=[.08,.10,.18].map(x=>x*(1-quiet*0.45));
  U.uExpo=1-quiet*0.35;
  const dist=Math.exp(track(t,[[39.45,Math.log(9.5)],[42.2,Math.log(9.0)],[44.6,Math.log(12)],[46.6,Math.log(16)],[48.3,Math.log(36)],[50.5,Math.log(44)],[53.3,Math.log(52)]]));
  const pitch=track(t,[[39.45,0.30],[44.6,0.42],[48.3,0.55],[53.3,0.75]]);
  const cam=orbitCam([0,-0.2,0],dist,S7YAW(t),pitch,track(t,[[39.45,-0.12],[44.6,0.05],[48.3,-0.04],[53.3,0.02]]),48);
  const pp=PLANETS.map((_,i)=>planetPos(i,days,S7PH));
  return {U,cam,ov:{days,hl,quiet,dist,pp}};
},t=>(t>46.9&&t<48.0)?3:1);

// S8 UNDER ICE 53.30 – 63.40
const S8T1=63.40;
scene(S7T1,S8T1,(t)=>{
  const U=baseU(); U.uMode=2;
  U.uDepth=track(t,[[53.3,1.25],[54.6,0.9],[55.9,-0.6],[57.4,-3.2],[58.7,-6.5],[59.6,-7.0],[60.8,-5.15],[63.4,-5.0]]);
  U.uPanX=track(t,[[53.3,-0.3],[57.4,-0.15],[59.6,0.0],[60.8,0.75],[63.4,0.85]]);
  U.uScale=track(t,[[53.3,1.7],[57.4,1.75],[59.6,1.9],[60.8,1.25],[63.4,1.1]]);
  U.uCore=sstep(57.6,58.8,t); U.uVent=sstep(59.6,60.6,t); U.uBact=sstep(60.2,61.3,t);
  U.uSkyBright=1.0;
  U.uFade=1-sstep(53.3,53.75,t);
  const cam=camBasis([0,0,0],[0,0,1],0,50);
  return {U,cam,ov:{depth:U.uDepth,pan:U.uPanX,scale:U.uScale}};
});

// S9 PUNCHLINE 63.40 – 71.45
const S9T1=71.45;
scene(S8T1,S9T1,(t)=>{
  const U=baseU(); const days=t*0.8;
  const u=(t-S8T1)/(S9T1-S8T1);
  U.uStar0=[0,0,0,1.2]; U.uStar0Col=[1,.52,.2,1.0*sstep(63.4,63.75,t)];
  const giant=sstep(68.5,69.6,t);
  U.uStar1=[-7.5,2.2,-17,Math.max(0.01,5.2*eOut(giant))]; U.uStar1Col=[.4,.6,1.0,giant>0.001?1.5:0];
  setPlanets(U,systemPlanets(days,i=>1,{city:0,spinT:t}).slice(0,4));
  U.uAmb=[.05,.07,.12];
  const fl=Math.exp(-Math.max(0,t-63.42)*9)*(t>63.4?1:0);
  U.uFlash=fl*0.22; U.uFlashCol=[1,.85,.6];
  const pos=track(t,[[63.4,[1.0,0.5,6.6]],[66.9,[1.6,0.7,7.6]],[68.4,[2.2,0.9,8.4]],[69.8,[4.2,1.6,13.0]],[71.45,[4.6,1.8,14.2]]]);
  const tg=track(t,[[63.4,[0,-0.25,0]],[66.9,[0,-0.1,0]],[68.4,[-0.5,0.2,-1]],[69.8,[-3.2,0.6,-6]],[71.45,[-3.4,0.7,-6.4]]]);
  const cam=camBasis(pos,tg,track(t,[[63.4,0.04],[68.4,-0.02],[71.45,0.05]]),46);
  return {U,cam,ov:{giant}};
},t=>(t>68.7&&t<69.7)?3:1);

// S10 END 71.45 – 76
scene(S9T1,DUR+0.5,(t)=>{
  const U=baseU(); const days=200+t*6;
  setPlanets(U,systemPlanets(days,null,{spinT:t,scale:1.3}));
  setOrbits(U,days,0.55,0.6);
  U.uAmb=[.09,.11,.2];
  U.uFlash=0;
  const u=(t-S9T1)/(DUR-S9T1);
  const cam=orbitCam([0,-0.4,0],lerp(16,14.5,eOut(u)),lerp(2.4,2.75,u),lerp(0.62,0.7,u),0.03,46);
  return {U,cam,ov:{days}};
});

function sceneAt(t){for(const s of SCENES) if(t>=s.t0&&t<s.t1) return s; return SCENES[SCENES.length-1];}
// cull planets outside view, mark earth/saturn indices
function cullPlanets(U,cam){
  const items=U._items||[]; const keep=[];
  for(const p of items){
    const pr=project(cam,p.pos,1080,1920);
    if(!pr){ // behind camera unless camera inside/very near
      if(V.len(V.sub(p.pos,cam.pos))<p.r*3) keep.push(p); continue; }
    const rad=p.r*pr.s*(p.type===5?2.5:1.2)+20;
    if(pr.x>-rad&&pr.x<1080+rad&&pr.y>-rad&&pr.y<1920+rad) keep.push(p);
  }
  U.uPl=new Array(40).fill(0); U.uPlInfo=new Array(40).fill(0); U.uPlInfo2=new Array(40).fill(0);
  setPlanets(U,keep); U._items=items; U._kept=keep;
  U.uEarthI=keep.findIndex(p=>p.type===2); U.uSatI=keep.findIndex(p=>p.type===5);
}
function evalScene(t){
  const s=sceneAt(t); const r=s.fn(t);
  cullPlanets(r.U,r.cam);
  r.U.uTime=t; r.scene=SCENES.indexOf(s); r.t=t;
  camU(r.U,r.cam);
  return r;
}
