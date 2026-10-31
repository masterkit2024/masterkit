// GLSL sources: sky cubemap generator + main scene shader
const GLSL_COMMON = `
float hash13(vec3 p){p=fract(p*0.1031);p+=dot(p,p.zyx+31.32);return fract((p.x+p.y)*p.z);}
vec3 hash33(vec3 p){p=fract(p*vec3(.1031,.1030,.0973));p+=dot(p,p.yxz+33.33);return fract((p.xxy+p.yxx)*p.zyx);}
float hash12(vec2 p){vec3 p3=fract(vec3(p.xyx)*.1031);p3+=dot(p3,p3.yzx+33.33);return fract((p3.x+p3.y)*p3.z);}
float vnoise(vec3 x){vec3 i=floor(x);vec3 f=fract(x);f=f*f*(3.-2.*f);
 return mix(mix(mix(hash13(i),hash13(i+vec3(1,0,0)),f.x),mix(hash13(i+vec3(0,1,0)),hash13(i+vec3(1,1,0)),f.x),f.y),
            mix(mix(hash13(i+vec3(0,0,1)),hash13(i+vec3(1,0,1)),f.x),mix(hash13(i+vec3(0,1,1)),hash13(i+vec3(1,1,1)),f.x),f.y),f.z);}
float fbm(vec3 p){float a=.5,s=0.;for(int i=0;i<5;i++){s+=a*vnoise(p);p=p*2.03+vec3(1.7,9.2,3.1);a*=.5;}return s;}
float fbm3(vec3 p){float a=.5,s=0.;for(int i=0;i<3;i++){s+=a*vnoise(p);p=p*2.07+vec3(1.7,9.2,3.1);a*=.5;}return s/.875;}
float fbm7(vec3 p){float a=.5,s=0.;for(int i=0;i<7;i++){s+=a*vnoise(p);p=p*2.01+vec3(1.7,9.2,3.1);a*=.5;}return s;}
`;

const VS = `#version 300 es
in vec2 aPos; uniform vec4 uRect; void main(){vec2 q=aPos*0.5+0.5; gl_Position=vec4(mix(uRect.xy,uRect.zw,q),0.,1.);}`;

// ---------- Sky cubemap generator ----------
const SKY_FS = `#version 300 es
precision highp float;
uniform int uFace; uniform float uSize;
out vec4 o;
${GLSL_COMMON}
vec3 faceDir(int f, vec2 uv){
  // uv in [-1,1]; GL cubemap conventions
  if(f==0) return vec3( 1.,-uv.y,-uv.x);
  if(f==1) return vec3(-1.,-uv.y, uv.x);
  if(f==2) return vec3(uv.x, 1., uv.y);
  if(f==3) return vec3(uv.x,-1.,-uv.y);
  if(f==4) return vec3(uv.x,-uv.y, 1.);
  return vec3(-uv.x,-uv.y,-1.);
}
vec3 starLayer(vec3 d, float scale, float prob, float bright, float sig){
  vec3 p=d*scale; vec3 c=floor(p); vec3 acc=vec3(0);
  for(int i=-1;i<=1;i++)for(int j=-1;j<=1;j++)for(int k=-1;k<=1;k++){
    vec3 cc=c+vec3(i,j,k); float h=hash13(cc*1.37+11.);
    if(h<prob){
      vec3 sp=cc+0.15+0.7*hash33(cc+3.1);
      vec3 sd=normalize(sp);
      float ang=length(cross(d,sd));
      if(dot(d,sd)>0.){
        float m=hash13(cc+7.7);
        float b=bright*pow(m,6.)*8.+bright*0.25;
        float t=hash13(cc+1.9);
        vec3 col=t<.3?vec3(.65,.75,1.):(t<.75?vec3(1.,.97,.92):(t<.92?vec3(1.,.82,.6):vec3(1.,.6,.45)));
        acc+=col*b*exp(-ang*ang/(sig*sig));
      }
    }
  }
  return acc;
}
void main(){
  vec2 uv=(gl_FragCoord.xy/uSize)*2.-1.;
  vec3 d=normalize(faceDir(uFace,uv));
  vec3 n=normalize(vec3(0.35,1.0,0.28));       // galactic pole
  vec3 gc=normalize(vec3(-0.55,0.22,-0.8));     // galactic center direction
  gc=normalize(gc-n*dot(gc,n));
  float lat=dot(d,n);
  float band=exp(-pow(lat/0.20,2.));
  float core=pow(max(dot(d,gc),0.),3.);
  float wide=exp(-pow(lat/0.42,2.));
  float nz=fbm7(d*4.2);
  float nz2=fbm(d*11.+3.);
  float dust=smoothstep(0.42,0.75,fbm7(d*6.5+9.))*exp(-pow(lat/0.09,2.))*(0.6+0.4*core);
  float glow=band*(0.35+0.9*nz*nz)*(0.5+1.6*core)+wide*0.08*nz;
  glow*=1.-0.92*dust;
  vec3 mwCol=mix(vec3(.30,.40,.75),vec3(1.0,.78,.55),clamp(core*1.4+nz2*0.3,0.,1.));
  vec3 col=mwCol*glow*0.16;
  // faint colored nebulae
  float neb=smoothstep(.55,.9,fbm(d*2.3+20.));
  col+=neb*mix(vec3(.45,.10,.35),vec3(.05,.25,.35),fbm3(d*3.+5.))*0.035*(0.4+band);
  // stars, denser in band
  float px=2./uSize;
  float dens=0.5+1.5*band+1.5*core*band;
  col*=0.8;
  // unresolved star haze in band
  col+=vec3(.9,.85,.8)*band*nz2*nz2*0.03*(0.5+core);
  o=vec4(col,1.);
}`;

// ---------- Main scene shader ----------
const MAIN_FS = `#version 300 es
precision highp float;
#define MODE __MODE__
#define TYPE __TYPE__
uniform vec2 uRes; uniform float uTime; uniform float uSeed;
uniform vec3 uCamPos,uCamR,uCamU,uCamF; uniform float uTanHalf;
uniform int uMode;
uniform samplerCube uSky; uniform float uSkyBright;
uniform vec4 uStar0, uStar0Col, uStar1, uStar1Col;   // pos,r | rgb,intensity
uniform vec4 uBH; uniform float uLens, uBHAlpha;
uniform vec4 uPl[10]; uniform vec4 uPlInfo[10]; uniform vec4 uPlInfo2[10]; uniform int uPlN; uniform int uEarthI, uSatI;
uniform int uObj; uniform vec4 uObjInfo; uniform vec4 uObjInfo2; uniform vec4 uObjCol;
uniform sampler2D uHdr;
uniform vec3 uLightPos;
uniform vec3 uAmb; uniform float uFill;
uniform float uOrb[9]; uniform float uOrbAng[9]; uniform vec3 uOrbCol[9]; uniform float uOrbA, uTrailA;
uniform float uFront, uFrontA;
uniform float uExpo, uFade, uFlash; uniform vec3 uFlashCol; uniform float uVig;
// sky mode
uniform vec3 uSunDir; uniform float uDay, uSunDisk;
// underwater mode
uniform float uDepth, uPanX, uScale, uVent, uBact, uCore;
out vec4 o;
${GLSL_COMMON}
const float PI=3.14159265;

vec3 aces(vec3 x){const float a=2.51,b=.03,c=2.43,d=.59,e=.14;return clamp((x*(a*x+b))/(x*(c*x+d)+e),0.,1.);}

vec3 skyCol(vec3 d){ return texture(uSky,d).rgb*uSkyBright; }

vec3 starL(vec3 d, float scale, float prob, float bright, float seed){
  vec3 p=d*scale; vec3 cc=floor(p);
  float h=hash13(cc*.91+seed);
  if(h>prob) return vec3(0);
  vec3 sd=normalize(cc+0.25+0.5*hash33(cc+8.+seed));
  float ang=length(cross(d,sd));
  float px=uTanHalf*2./uRes.y;
  float m=hash13(cc+2.+seed);
  float tw=0.88+0.12*sin(uTime*(2.+3.*m)+m*40.);
  float t=hash13(cc+5.+seed);
  vec3 col=t<.3?vec3(.68,.78,1.):(t<.8?vec3(1.,.96,.9):vec3(1.,.78,.58));
  float s=px*0.75;
  float b=bright*(0.15+3.0*pow(m,6.))*tw;
  return col*b*(exp(-ang*ang/(s*s))+0.04*exp(-ang/(s*2.5)))*step(0.,dot(d,sd));
}
vec3 brightStars(vec3 d){
  vec3 n=normalize(vec3(0.35,1.0,0.28));
  float band=exp(-pow(dot(d,n)/0.22,2.));
  return starL(d,70.,0.07,1.0,4.)+starL(d,170.,0.05+0.05*band,0.45,9.)+starL(d,380.,0.025+0.06*band,0.25,17.);
}

// ---- sphere ----
float sph(vec3 o,vec3 d,vec4 s){vec3 oc=o-s.xyz;float b=dot(oc,d);float c=dot(oc,oc)-s.w*s.w;float h=b*b-c;if(h<0.)return -1.;h=sqrt(h);float t=-b-h;return t>0.?t:-1.;}

vec3 rotY(vec3 p,float a){float c=cos(a),s=sin(a);return vec3(c*p.x+s*p.z,p.y,-s*p.x+c*p.z);}
vec3 rotX(vec3 p,float a){float c=cos(a),s=sin(a);return vec3(p.x,c*p.y-s*p.z,s*p.y+c*p.z);}

vec3 starSurface(vec3 n, vec3 d, vec3 col, float I, float seed){
  float mu=max(dot(n,-d),0.);
  float g=fbm(n*9.+vec3(seed,uTime*0.05,0.));
  float g2=vnoise(n*38.+uTime*0.3+seed);
  float spots=smoothstep(0.72,0.8,fbm3(n*3.+seed*3.));
  float limb=0.35+0.65*pow(mu,0.55);
  vec3 c=col*(0.55+0.75*g+0.25*g2)*limb*(1.-0.6*spots);
  c=mix(c, c*vec3(1.,0.6,0.35), 1.-mu);
  return c*I;
}

vec3 starGlow(vec3 o, vec3 d, vec4 s, vec3 col, float I, float tHit){
  vec3 oc=s.xyz-o; float tc=dot(oc,d);
  if(tc<0.) return vec3(0);
  float dist=length(oc);
  float b=length(o+d*tc-s.xyz);
  float x=max(b-s.w*0.98,0.)/s.w;
  float ang=atan(dot(o+d*tc-s.xyz,uCamU),dot(o+d*tc-s.xyz,uCamR));
  float streak=0.65+0.35*vnoise(vec3(ang*4.,x*0.6-uTime*0.08,1.));
  float cor=exp(-x*4.5)*0.55*streak+exp(-x*1.4)*0.07+0.012/(1.+x*x*2.);
  float g=cor*I;
  if(tHit>0.) g*=0.25;
  return col*g;
}

// ---- planet shading ----
vec3 shadePlanet(vec4 P, vec4 inf, vec4 inf2, vec3 p, vec3 d, out float alphaOut){
  vec3 n=normalize(p-P.xyz);
  vec3 nr=rotY(rotX(n,inf2.y),inf.w); // tilt, spin
  const int type=TYPE;
  float lit=inf.y; float ice=inf.z; float city=inf2.x;
  vec3 L=normalize(uLightPos-p);
  float ndl=dot(n,L);
  float diff=max(ndl,0.);
  float term=smoothstep(-0.08,0.25,ndl);
  vec3 alb=vec3(.5); float spec=0.; vec3 emit=vec3(0); float atm=0.; vec3 atmCol=vec3(.35,.6,1.);
  float lat=nr.y;
  if(type==0){ // mercury
    float f=fbm(nr*5.); float cr=smoothstep(.6,.66,vnoise(nr*14.))-smoothstep(.66,.75,vnoise(nr*14.))*0.5;
    alb=vec3(.42,.38,.35)*(0.6+0.6*f)+cr*0.08;
  } else if(type==1){ // venus
    float f=fbm(vec3(nr.x*2.,nr.y*6.,nr.z*2.)+uTime*0.02);
    alb=mix(vec3(.85,.7,.45),vec3(.95,.88,.7),f); atm=0.6; atmCol=vec3(1.,.85,.6);
  } else if(type==2){ // earth
    float c=fbm7(nr*1.8+vec3(2.,7.,1.));
    float land=smoothstep(0.515,0.535,c);
    float hgt=smoothstep(.53,.75,c);
    vec3 ocean=mix(vec3(.01,.05,.16),vec3(.02,.16,.32),smoothstep(.3,.51,c));
    float dry=smoothstep(.45,.65,fbm(nr*3.+11.))*(1.-smoothstep(.2,.55,abs(lat)));
    vec3 ground=mix(vec3(.09,.22,.06),vec3(.55,.42,.24),dry);
    ground=mix(ground,vec3(.4,.35,.3),hgt*0.6);
    float polar=smoothstep(.72,.8,abs(lat)+0.06*fbm3(nr*6.));
    alb=mix(ocean,ground,land);
    // freezing from poles toward equator
    float fr=ice*1.15;
    float frozen=smoothstep(1.-fr, 1.-fr+0.12, abs(lat)+0.12*fbm(nr*7.))*step(0.001,ice);
    float crack=smoothstep(.47,.5,fbm(nr*16.))-smoothstep(.5,.53,fbm(nr*16.));
    vec3 iceCol=mix(vec3(.78,.88,.96),vec3(.6,.75,.9),fbm3(nr*9.))-crack*0.15;
    alb=mix(alb,vec3(.92,.95,1.),polar);
    alb=mix(alb,iceCol,frozen);
    float cl=smoothstep(.5,.75,fbm(nr*3.3+vec3(uTime*0.012,0.,4.)));
    alb=mix(alb,vec3(1.),cl*0.85*(1.-frozen*0.5));
    spec=(1.-land)*(1.-frozen)*(1.-cl)*0.6;
    float lights=smoothstep(.62,.9,vnoise(nr*45.))*smoothstep(.45,.7,vnoise(nr*9.))*1.6+smoothstep(.8,.97,vnoise(nr*160.))*1.2*smoothstep(.4,.7,vnoise(nr*9.));
    emit=vec3(1.,.72,.35)*lights*land*(1.-polar)*(1.-cl*0.7)*city*(1.-term)*0.9*(1.-frozen);
    atm=1.0;
  } else if(type==3){ // mars
    float f=fbm(nr*3.5);
    alb=mix(vec3(.55,.22,.1),vec3(.75,.4,.2),f);
    alb=mix(alb,vec3(.95),smoothstep(.85,.9,abs(lat)));
    atm=0.25; atmCol=vec3(1.,.6,.4);
  } else if(type==4){ // jupiter
    float w=fbm3(nr*vec3(3.,1.,3.)+3.)*0.6;
    float b=sin(lat*22.+w*3.+fbm3(nr*6.)*1.5);
    alb=mix(vec3(.75,.6,.45),vec3(.95,.9,.82),0.5+0.5*b);
    alb=mix(alb,vec3(.6,.4,.3),smoothstep(.6,1.,sin(lat*9.+1.))*0.4);
    float spot=exp(-pow(length(vec2(atan(nr.z,nr.x)-1.,(lat+0.32)*2.5))/0.18,2.));
    alb=mix(alb,vec3(.75,.35,.2),spot*0.8);
    atm=0.3; atmCol=vec3(1.,.9,.8);
  } else if(type==5){ // saturn
    float b=sin(lat*26.+fbm3(nr*4.)*1.2);
    alb=mix(vec3(.82,.72,.52),vec3(.95,.88,.7),0.5+0.5*b);
    atm=0.3; atmCol=vec3(1.,.9,.7);
  } else if(type==6){ // uranus
    alb=vec3(.6,.85,.88)*(0.92+0.08*sin(lat*10.)); atm=0.5; atmCol=vec3(.6,.9,1.);
  } else if(type==7){ // neptune
    float b=sin(lat*14.+fbm3(nr*3.)*2.);
    alb=mix(vec3(.15,.3,.75),vec3(.3,.5,.95),0.5+0.5*b); atm=0.6; atmCol=vec3(.4,.6,1.);
  } else { // moon
    float f=fbm(nr*3.);
    float mar=smoothstep(.5,.62,fbm3(nr*1.6+4.));
    float cr=0.;
    for(int k=0;k<2;k++){ float s=k==0?7.:17.; vec3 q=nr*s; vec3 c=floor(q); vec3 fr=fract(q)-0.5-(hash33(c)-0.5)*0.4; float r=length(fr); float rr=0.18+0.15*hash13(c); cr+=(smoothstep(rr,rr*0.7,r)*-0.12+smoothstep(rr*1.25,rr,r)*smoothstep(rr*0.85,rr,r)*0.18)*step(.45,hash13(c+3.)); }
    alb=vec3(.62,.6,.58)*(0.7+0.45*f)-mar*vec3(.22,.22,.2)+cr;
  }
  float lightI=lit;
  vec3 col=alb*diff*lightI*vec3(1.,.96,.9)*1.6;
  vec3 H=normalize(L-d);
  col+=vec3(1.,.95,.85)*spec*pow(max(dot(n,H),0.),60.)*lightI*1.5*step(0.,ndl);
  // ambient: cold starlight rim + soft fill
  float fres=pow(1.-max(dot(n,-d),0.),2.5);
  vec3 fillDir=normalize(-uCamF*0.3+uCamU*0.8+uCamR*0.4);
  float fill=0.5+0.5*dot(n,fillDir);
  col+=alb*uAmb*fill*uFill;
  col+=uAmb*fres*0.9*(0.6+0.4*fill);
  col+=emit;
  // atmosphere
  if(atm>0.){
    float rim=pow(1.-max(dot(n,-d),0.),3.);
    col+=atmCol*rim*atm*(smoothstep(-0.25,0.4,ndl)*lightI*0.9);
  }
  alphaOut=1.;
  return col;
}

vec3 atmosphereHalo(vec3 o, vec3 d, vec4 P, float litv){
  vec3 oc=P.xyz-o; float tc=dot(oc,d); if(tc<0.) return vec3(0);
  float b=length(o+d*tc-P.xyz);
  float x=(b-P.w)/P.w;
  if(x<0.||x>0.12) return vec3(0);
  vec3 pp=o+d*tc; vec3 n=normalize(pp-P.xyz); vec3 L=normalize(uLightPos-pp);
  float ndl=dot(n,L);
  float h=exp(-x/0.025)*smoothstep(-0.3,0.3,ndl)*litv;
  return vec3(.3,.55,1.)*h*0.9;
}

vec4 saturnRings(vec3 o, vec3 d, vec4 P, vec4 inf, vec4 inf2, float tMax){
  vec3 nrm=normalize(vec3(0.,1.,0.)); nrm=rotX(nrm,-inf2.y);
  float dn=dot(d,nrm); if(abs(dn)<1e-4) return vec4(0);
  float t=dot(P.xyz-o,nrm)/dn; if(t<0.||t>tMax) return vec4(0);
  vec3 q=o+d*t-P.xyz; float r=length(q)/P.w;
  if(r<1.35||r>2.35) return vec4(0);
  float bands=0.55+0.45*sin(r*48.)*sin(r*13.+1.);
  float a=smoothstep(1.35,1.45,r)*smoothstep(2.35,2.2,r)*(1.-0.85*smoothstep(1.92,1.95,r)*smoothstep(2.0,1.97,r))*bands*0.85;
  vec3 L=normalize(uLightPos-(o+d*t));
  // planet shadow on ring
  float sh=1.; { vec3 oc=(o+d*t)-P.xyz; float bb=dot(oc,L); float cc=dot(oc,oc)-P.w*P.w; if(bb<0.&&bb*bb-cc>0.) sh=0.15; }
  vec3 c=vec3(.85,.76,.6)*(0.35+0.65*abs(dot(nrm,L)))*inf.y*sh*1.2 + vec3(.85,.76,.6)*uAmb*0.35;
  return vec4(c,a);
}

// ---------- SPACE BACKGROUND ----------
vec3 renderSpace(vec3 o, vec3 d, vec2 frag){
  vec3 col=vec3(0); float tNear=1e9;
  float shadow=0., ring=0.; vec3 bd=d; float tBH=1e9;
  if(uBHAlpha>0.){
    vec3 oc=uBH.xyz-o; float tc=dot(oc,d);
    if(tc>0.){
      vec3 cp=o+d*tc-uBH.xyz; float b=length(cp); float rs=uBH.w;
      if(b<rs){ shadow=1.; tBH=tc-sqrt(rs*rs-b*b); }
      else {
        float x=b/rs;
        float a=max(0.77/x, -log(max(x-1.,1e-5))-0.40)*uLens;
        bd=normalize(d*cos(a)-cp/b*sin(a));
        ring=exp(-(x-1.)/0.035)+0.25*exp(-(x-1.)/0.25);
      }
    }
  }
  vec3 ld=normalize(mix(d,bd,uBHAlpha));
  col=skyCol(ld)+brightStars(ld);
  if(shadow>0.){ col*=1.-uBHAlpha; tNear=tBH; }
  col+=vec3(.85,.9,1.)*ring*uBHAlpha*0.06*uSkyBright;
  // orbits on plane y=0
  float tP=-o.y/d.y;
  vec3 q=o+d*tP; float r=length(q.xz);
  float fw=max(fwidth(r),1e-5);
  if(tP>0.&&tP<tNear&&(uOrbA>0.||uFrontA>0.)){
    float ang=atan(q.z,q.x);
    float distFade=1./(1.+tP*0.015);
    for(int i=0;i<8;i++){
      float R=uOrb[i];
      float w=fw*1.1+0.006;
      float dr=abs(r-R);
      float line=1.-smoothstep(0.,w,dr);
      float glow=exp(-dr/(fw*6.+0.03))*0.25;
      float da=mod(uOrbAng[i]-ang+PI*4.,2.*PI);
      float trail=exp(-da*2.2)*smoothstep(0.,0.05,da);
      col+=uOrbCol[i]*(line+glow)*(0.22*uOrbA+1.3*trail*uTrailA)*distFade;
    }
    if(uFrontA>0.){
      float w=fw*1.5+0.02;
      float fl=exp(-pow((r-uFront)/w,2.))+0.35*exp(-abs(r-uFront)/(w*8.));
      col+=vec3(1.,.85,.55)*fl*uFrontA*1.4;
      col+=vec3(1.,.8,.5)*0.015*smoothstep(uFront-0.2,uFront+0.4,r)*uFrontA*smoothstep(60.,0.,r);
    }
  }
  if(uFrontA>0.){
    float b0=length(o-d*dot(o,d));
    float w=0.012*uFront+0.01;
    float s=exp(-pow((b0-uFront)/w,2.))*step(0.,dot(-o,d)+uFront);
    col+=vec3(1.,.82,.5)*s*uFrontA*0.35;
  }
  if(uStar0Col.w>0.) col+=starGlow(o,d,uStar0,uStar0Col.rgb,uStar0Col.w,0.);
  if(uStar1Col.w>0.) col+=starGlow(o,d,uStar1,uStar1Col.rgb,uStar1Col.w,0.);
  return col;
}

// ---------- OBJECT (planet / star) ----------
vec4 renderObject(vec3 o, vec3 d){
  vec4 P=uPl[0];
  vec3 oc=o-P.xyz; float b=dot(oc,d); float c=dot(oc,oc)-P.w*P.w; float h=b*b-c;
  float px=uTanHalf*2./uRes.y;
  float dist=length(oc);
  // signed distance of ray to sphere silhouette in pixels
  float perp=sqrt(max(dot(oc,oc)-b*b,0.));
  float edgePx=(P.w-perp)/(max(-b,1e-4)*px);
  float cov=clamp(edgePx+0.5,0.,1.);
  vec3 col=vec3(0); float alpha=0.;
  float tHit=1e9;
  if(cov>0.){
    float t=-b-sqrt(max(h,0.));
    tHit=t;
    vec3 p=o+d*t;
#if TYPE>=10
    vec3 n=normalize(p-P.xyz);
    col=starSurface(n,d,uObjCol.rgb,uObjCol.w,TYPE==10?1.:7.);
#else
    float aa; col=shadePlanet(P,uObjInfo,uObjInfo2,p,d,aa);
#endif
    alpha=cov;
  }
  // black hole occlusion
  if(uBHAlpha>0.5){
    vec3 bo=uBH.xyz-o; float tc=dot(bo,d); float bb=length(o+d*tc-uBH.xyz);
    if(tc>0.&&bb<uBH.w&&tc<min(tHit,1e8)) alpha=0.;
  }
  col*=alpha;
#if TYPE==2
  col+=atmosphereHalo(o,d,P,uObjInfo.y)*(1.-alpha);
  alpha=max(alpha,0.);
#endif
#if TYPE==5
  vec4 rg=saturnRings(o,d,P,uObjInfo,uObjInfo2,cov>0.?tHit:1e9);
  col=col*(1.-rg.a)+rg.rgb*rg.a; alpha=alpha+rg.a*(1.-alpha);
#endif
  return vec4(col,alpha);
}

// ---------- SKY (from Earth's surface) ----------
vec3 renderSurfaceSky(vec3 d, vec2 frag){
  float h=d.y;
  float az=atan(d.z,d.x);
  float hills=0.02+0.03*fbm3(vec3(az*3.,0.,1.))+0.035*pow(vnoise(vec3(az*60.,2.,2.)),2.)+0.012*vnoise(vec3(az*220.,1.,3.));
  vec3 zen=vec3(.02,.09,.38), hor=vec3(.25,.45,.75);
  vec3 day=mix(hor,zen,pow(clamp(h,0.,1.),0.5));
  float sd=max(dot(d,uSunDir),0.);
  day+=vec3(1.,.85,.6)*pow(sd,8.)*0.2*uSunDisk;
  vec3 night=skyCol(d)*1.4+brightStars(d)+vec3(.01,.015,.03)*(1.-h);
  vec3 sky=mix(night,day*1.2,uDay);
  // clouds
  if(h>0.02){
    vec2 cp=d.xz/h*1.3+vec2(uTime*0.03,0.);
    float c=smoothstep(.58,.85,fbm(vec3(cp*1.2,uTime*0.01)));
    vec3 cc=mix(vec3(.25,.27,.35)*0.1,vec3(1.,.98,.95),uDay)*(0.8+0.2*fbm3(vec3(cp*4.,1.)));
    sky=mix(sky,cc,c*smoothstep(.02,.15,h)*0.85);
  }
  // sun disk
  float sang=acos(clamp(dot(d,uSunDir),-1.,1.));
  float disk=smoothstep(0.03,0.026,sang);
  sky+=vec3(1.,.93,.8)*disk*5.*uSunDisk + vec3(1.,.8,.55)*(exp(-sang/0.04)*0.9+exp(-sang/0.25)*0.25)*uSunDisk;
  if(h<hills){
    float g=fbm3(vec3(az*30.,h*30.,0.));
    vec3 ground=mix(vec3(.004,.006,.008),vec3(.015,.03,.025)*(0.6+0.5*g),uDay);
    float edge=smoothstep(hills-0.0015,hills,h);
    sky=mix(ground,sky,edge);
  }
  return sky;
}

// ---------- UNDER THE ICE (cross-section) ----------
vec3 renderUnder(vec2 uv){
  float x=uv.x*uScale+uPanX; float y=uv.y*uScale+uDepth;
  vec3 col;
  float iceTop=0.04*fbm3(vec3(x*2.,0.,0.))+0.02*vnoise(vec3(x*9.,0.,0.));
  float iceBot=-1.25+0.18*fbm3(vec3(x*1.3,3.,0.));
  float bed=-6.2+0.45*fbm(vec3(x*0.7,5.,0.))+0.1*vnoise(vec3(x*4.,1.,1.));
  // vent chimney at x=0.9
  float vx=0.9; float ventTop=-4.75;
  float chim=0.07+0.09*smoothstep(ventTop,bed,y)+0.025*vnoise(vec3(y*8.,x*4.,0.));
  bool inChim=abs(x-vx)<chim && y<ventTop+0.03*vnoise(vec3(x*20.,0.,0.)) && y>bed-0.5;
  vec3 dir=normalize(vec3(uv.x*0.5,0.4+uv.y*0.3,1.));
  if(y>iceTop){
    col=skyCol(normalize(vec3(uv.x*0.6,0.6+uv.y*0.4,-1.)))*1.2+brightStars(normalize(vec3(uv.x*0.6,0.6+uv.y*0.4,-1.)))*0.9;
    // frozen horizon haze
    col+=vec3(.08,.12,.2)*exp(-(y-iceTop)/0.25)*0.5;
  } else if(y>iceBot){
    float f=fbm(vec3(x*3.,y*3.,1.));
    float cr=smoothstep(.49,.5,fbm(vec3(x*2.2,y*5.,7.)))-smoothstep(.5,.51,fbm(vec3(x*2.2,y*5.,7.)));
    float bub=smoothstep(.85,.9,vnoise(vec3(x*30.,y*30.,2.)));
    float depthIn=(iceTop-y)/(iceTop-iceBot);
    col=mix(vec3(.55,.75,.9),vec3(.08,.22,.38),depthIn)*(0.75+0.35*f)*0.55+cr*0.25+bub*0.15;
    col*=0.55+0.45*exp(-(iceTop-y)/0.05);
    col+=vec3(.6,.85,1.)*exp(-(iceTop-y)/0.02)*0.5;
  } else if(y>bed && !inChim){
    float dd=(iceBot-y)/(iceBot-bed);
    col=mix(vec3(.02,.09,.16),vec3(.002,.012,.025),pow(dd,0.6));
    // underside of ice bright edge
    col+=vec3(.2,.45,.6)*exp(-(iceBot-y)/0.06)*0.4;
    // marine snow (two parallax layers)
    for(int l=0;l<2;l++){
      float sc=l==0?14.:26.; float par=l==0?1.0:0.6;
      vec2 g=vec2(x*sc, (y+uTime*0.05*(1.+float(l)))*sc*par);
      vec2 c=floor(g); vec2 fr=fract(g)-0.5; float h=hash12(c+float(l)*7.);
      if(h<0.12){ vec2 off=(vec2(hash12(c+1.),hash12(c+2.))-0.5)*0.6; float r=length(fr-off); col+=vec3(.4,.6,.7)*smoothstep(0.07,0.,r)*(0.25+0.4*hash12(c+3.))*(1.-dd*0.5); }
    }
  } else if(inChim){
    float s=fbm(vec3(x*12.,y*6.,3.));
    col=vec3(.06,.045,.04)*(0.5+s)+vec3(.25,.12,.05)*0.15*uVent;
    float hotCore=exp(-abs(x-vx)/0.05)*smoothstep(bed,ventTop,y);
    col+=vec3(1.,.35,.08)*hotCore*0.3*uVent;
  } else {
    // crust / rock: darker with magma veins deeper
    float dd=bed-y;
    float s=fbm(vec3(x*4.,y*4.,9.));
    col=vec3(.07,.05,.04)*(0.5+0.8*s)*exp(-dd*0.3);
    float vein=1.-smoothstep(0.0,0.035,abs(fbm(vec3(x*1.5,y*1.5,2.)+0.)-0.5));
    float heat=smoothstep(0.,4.,dd);
    col+=vec3(1.,.32,.05)*vein*heat*1.1*uCore;
    col+=vec3(1.,.25,.03)*smoothstep(2.,7.,dd)*0.25*uCore*(0.7+0.3*s);
  }
  // vent plume (hot shimmering water above chimney)
  if(y>ventTop-0.05 && y<iceBot){
    float py=y-ventTop;
    float wob=0.25*(fbm3(vec3(py*2.-uTime*0.6,x,1.))-0.5)*py;
    float w=0.05+py*0.16;
    float pl=exp(-pow((x-vx-wob)/w,2.))*exp(-py*0.55);
    float turb=fbm(vec3((x-vx)*6.,py*3.-uTime*0.9,2.));
    col=mix(col,vec3(.03,.03,.035),pl*0.8*turb);
    col+=vec3(1.,.4,.1)*pl*exp(-py*3.0)*0.28*uVent;
  }
  // vent light on surroundings
  float vd=length(vec2(x-vx,(y-ventTop)*1.3));
  col+=vec3(1.,.42,.12)*0.18*exp(-vd/0.7)*uVent*(y<iceBot?1.:0.);
  // bacteria glow
  if(uBact>0.&&y<iceBot){
    vec2 g=vec2(x,y)*vec2(40.,40.); vec2 c=floor(g); float bsum=0.;
    for(int i=-1;i<=1;i++)for(int j=-1;j<=1;j++){
      vec2 cc=c+vec2(i,j); float h=hash12(cc*1.3);
      vec2 cw=cc/40.;
      float near=exp(-length(vec2(cw.x-vx,(cw.y-(bed+0.15))*1.2))/0.32)+0.5*exp(-length(vec2(cw.x-vx,cw.y-ventTop))/0.2);
      if(h<near*0.22){
        vec2 off=vec2(hash12(cc+4.),hash12(cc+5.))-0.5; off+=0.15*vec2(sin(uTime*1.3+h*30.),cos(uTime*1.1+h*20.));
        float r=length(g-cc-0.5-off*0.7);
        float pulse=0.6+0.4*sin(uTime*3.+h*50.);
        bsum+=(smoothstep(0.16,0.0,r)+0.08*exp(-r*1.5))*pulse;
      }
    }
    col+=vec3(.25,1.,.75)*bsum*uBact*0.55;
  }
  return col;
}

void main(){
  vec2 frag=gl_FragCoord.xy;
  vec2 uv=(frag-0.5*uRes)/(0.5*uRes.y);
  vec3 d=normalize(uCamF+(uv.x*uCamR+uv.y*uCamU)*uTanHalf);
#if MODE==0
  o=vec4(renderSpace(uCamPos,d,frag),1.);
#elif MODE==1
  o=vec4(renderSurfaceSky(d,frag),1.);
#elif MODE==2
  o=vec4(renderUnder(uv),1.);
#elif MODE==3
  o=renderObject(uCamPos,d);
#else
  vec3 col=texture(uHdr,frag/uRes).rgb;
  col*=uExpo;
  col+=uFlashCol*uFlash;
  col=aces(col);
  col=pow(col,vec3(1./2.2));
  float vig=1.-uVig*pow(length(uv*vec2(1.25,0.85)),2.2)*0.55;
  col*=vig;
  col*=1.-uFade;
  float n=hash12(frag+fract(uSeed)*917.)-0.5; float n2=hash12(frag*1.7+fract(uSeed*1.3)*311.)-0.5;
  col+=(n+n2)*0.012;
  o=vec4(col,1.);
#endif
}`;
