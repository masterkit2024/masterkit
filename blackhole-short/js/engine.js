// WebGL engine: sky cubemap + main pass + subframe accumulation
const V = {
  add:(a,b)=>[a[0]+b[0],a[1]+b[1],a[2]+b[2]], sub:(a,b)=>[a[0]-b[0],a[1]-b[1],a[2]-b[2]],
  mul:(a,s)=>[a[0]*s,a[1]*s,a[2]*s], dot:(a,b)=>a[0]*b[0]+a[1]*b[1]+a[2]*b[2],
  cross:(a,b)=>[a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]],
  len:a=>Math.hypot(a[0],a[1],a[2]), norm:a=>{const l=Math.hypot(a[0],a[1],a[2])||1;return [a[0]/l,a[1]/l,a[2]/l];},
  lerp:(a,b,t)=>[a[0]+(b[0]-a[0])*t,a[1]+(b[1]-a[1])*t,a[2]+(b[2]-a[2])*t],
};

class Engine {
  constructor(w,h,glScale){
    this.W=w; this.H=h;
    this.gw=Math.round(w*glScale); this.gh=Math.round(h*glScale);
    const c=document.createElement('canvas'); c.width=this.gw; c.height=this.gh;
    this.canvas=c;
    const gl=c.getContext('webgl2',{preserveDrawingBuffer:true,antialias:false,premultipliedAlpha:false});
    this.gl=gl;
    gl.getExtension('EXT_color_buffer_float');
    const buf=gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER,buf);
    gl.bufferData(gl.ARRAY_BUFFER,new Float32Array([-1,-1,1,-1,-1,1,1,1]),gl.STATIC_DRAW);
    const src=(m,t)=>MAIN_FS.replace('__MODE__',String(m)).replace('__TYPE__',String(t));
    this.skyProg=this.prog(VS,SKY_FS);
    this.bgProgs=[0,1,2].map(m=>this.prog(VS,src(m,0)));
    this.objProgs={}; for(const t of [0,1,2,3,4,5,6,7,8,10,11]) this.objProgs[t]=this.prog(VS,src(3,t));
    this.postProg=this.prog(VS,src(4,0));
    this.locs=new Map();
    // HDR target
    this.hdr=gl.createTexture(); gl.bindTexture(gl.TEXTURE_2D,this.hdr);
    gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA16F,this.gw,this.gh,0,gl.RGBA,gl.HALF_FLOAT,null);
    gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MIN_FILTER,gl.NEAREST); gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MAG_FILTER,gl.NEAREST);
    this.hdrFb=gl.createFramebuffer(); gl.bindFramebuffer(gl.FRAMEBUFFER,this.hdrFb);
    gl.framebufferTexture2D(gl.FRAMEBUFFER,gl.COLOR_ATTACHMENT0,gl.TEXTURE_2D,this.hdr,0);
    this.fbOk=gl.checkFramebufferStatus(gl.FRAMEBUFFER)===gl.FRAMEBUFFER_COMPLETE;
    gl.bindFramebuffer(gl.FRAMEBUFFER,null);
  }
  prog(vs,fs){
    const gl=this.gl;
    const mk=(t,s)=>{const sh=gl.createShader(t);gl.shaderSource(sh,s);gl.compileShader(sh);
      if(!gl.getShaderParameter(sh,gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(sh)); return sh;};
    const p=gl.createProgram(); gl.attachShader(p,mk(gl.VERTEX_SHADER,vs)); gl.attachShader(p,mk(gl.FRAGMENT_SHADER,fs));
    gl.bindAttribLocation(p,0,'aPos'); gl.linkProgram(p);
    if(!gl.getProgramParameter(p,gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(p));
    return p;
  }
  quad(){const gl=this.gl; gl.enableVertexAttribArray(0); gl.vertexAttribPointer(0,2,gl.FLOAT,false,0,0); gl.drawArrays(gl.TRIANGLE_STRIP,0,4);}
  buildSky(size){
    const gl=this.gl;
    const tex=gl.createTexture(); gl.bindTexture(gl.TEXTURE_CUBE_MAP,tex);
    const half=gl.getExtension('EXT_color_buffer_float')?true:false;
    for(let f=0;f<6;f++) gl.texImage2D(gl.TEXTURE_CUBE_MAP_POSITIVE_X+f,0,half?gl.RGBA16F:gl.RGBA8,size,size,0,gl.RGBA,half?gl.HALF_FLOAT:gl.UNSIGNED_BYTE,null);
    gl.texParameteri(gl.TEXTURE_CUBE_MAP,gl.TEXTURE_MIN_FILTER,gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_CUBE_MAP,gl.TEXTURE_MAG_FILTER,gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_CUBE_MAP,gl.TEXTURE_WRAP_S,gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_CUBE_MAP,gl.TEXTURE_WRAP_T,gl.CLAMP_TO_EDGE);
    const fb=gl.createFramebuffer(); gl.bindFramebuffer(gl.FRAMEBUFFER,fb);
    gl.useProgram(this.skyProg); gl.viewport(0,0,size,size);
    gl.uniform4fv(gl.getUniformLocation(this.skyProg,'uRect'),[-1,-1,1,1]);
    for(let f=0;f<6;f++){
      gl.framebufferTexture2D(gl.FRAMEBUFFER,gl.COLOR_ATTACHMENT0,gl.TEXTURE_CUBE_MAP_POSITIVE_X+f,tex,0);
      gl.uniform1i(gl.getUniformLocation(this.skyProg,'uFace'),f);
      gl.uniform1f(gl.getUniformLocation(this.skyProg,'uSize'),size);
      this.quad();
    }
    gl.finish();
    gl.bindFramebuffer(gl.FRAMEBUFFER,null);
    this.skyTex=tex;
  }
  use(p){ this.gl.useProgram(p); this.cur=p; if(!this.locs.has(p)) this.locs.set(p,{}); this.uloc=this.locs.get(p);
    const gl=this.gl; gl.uniform4fv(this.u('uRect'),[-1,-1,1,1]); gl.uniform2fv(this.u('uRes'),[this.gw,this.gh]); }
  u(name){ if(!(name in this.uloc)) this.uloc[name]=this.gl.getUniformLocation(this.cur,name); return this.uloc[name]; }
  setUniforms(U){
    const gl=this.gl;
    for(const k in U){
      if(k[0]==='_') continue;
      const v=U[k], l=this.u(k); if(l===null) continue;
      if(k==='uMode'||k==='uPlN'||k==='uEarthI'||k==='uSatI'||k==='uObj') { gl.uniform1i(l,v); continue; }
      if(typeof v==='number') gl.uniform1f(l,v);
      else if(k==='uOrbCol') gl.uniform3fv(l,v);
      else if(k==='uPl'||k==='uPlInfo'||k==='uPlInfo2') gl.uniform4fv(l,v);
      else if(v.length===2) gl.uniform2fv(l,v);
      else if(v.length===3) gl.uniform3fv(l,v);
      else if(v.length===4) gl.uniform4fv(l,v);
      else gl.uniform1fv(l,v);
    }
  }
  objects(U){
    const out=[];
    const cam={pos:U.uCamPos,F:U.uCamF,R:U.uCamR,U:U.uCamU,tanHalf:U.uTanHalf};
    const add=(type,pos,r,info,info2,col,extra)=>{
      const d=V.len(V.sub(pos,cam.pos));
      let rect=[-1,-1,1,1];
      const z=V.dot(V.sub(pos,cam.pos),cam.F);
      if(d>r*1.6 && z>r*1.2){
        const pr=project(cam,pos,this.gw,this.gh);
        const ang=Math.asin(Math.min(r*extra/d,0.999));
        const pxr=Math.tan(ang)/cam.tanHalf*this.gh/2*1.35+6;
        const x0=(pr.x-pxr)/this.gw*2-1, x1=(pr.x+pxr)/this.gw*2-1;
        const y0=1-(pr.y+pxr)/this.gh*2, y1=1-(pr.y-pxr)/this.gh*2;
        if(x1<-1||x0>1||y1<-1||y0>1) return;
        rect=[Math.max(-1,x0),Math.max(-1,y0),Math.min(1,x1),Math.min(1,y1)];
      } else if(z<-r) return;
      out.push({type,pos,r,info,info2,col,rect,d});
    };
    if(U.uStar0Col[3]>0) add(10,U.uStar0.slice(0,3),U.uStar0[3],[0,0,0,0],[0,0,0,0],U.uStar0Col,1.02);
    if(U.uStar1Col[3]>0) add(11,U.uStar1.slice(0,3),U.uStar1[3],[0,0,0,0],[0,0,0,0],U.uStar1Col,1.02);
    for(const p of (U._kept||[])) add(p.type,p.pos,p.r,[p.type,p.lit??0,p.ice??0,p.spin??0],[p.city??0,p.tilt??0.2,0,0],[0,0,0,0],p.type===5?2.45:(p.type===2?1.15:1.02));
    out.sort((a,b)=>b.d-a.d);
    return out;
  }
  render(states){
    const gl=this.gl;
    const N=states.length;
    gl.activeTexture(gl.TEXTURE0); gl.bindTexture(gl.TEXTURE_CUBE_MAP,this.skyTex);
    gl.bindFramebuffer(gl.FRAMEBUFFER,null); gl.viewport(0,0,this.gw,this.gh);
    gl.clearColor(0,0,0,1); gl.clear(gl.COLOR_BUFFER_BIT);
    for(const U of states){
      gl.bindFramebuffer(gl.FRAMEBUFFER,this.hdrFb); gl.viewport(0,0,this.gw,this.gh);
      gl.disable(gl.BLEND);
      gl.activeTexture(gl.TEXTURE1); gl.bindTexture(gl.TEXTURE_2D,null);
      gl.activeTexture(gl.TEXTURE0); gl.bindTexture(gl.TEXTURE_CUBE_MAP,this.skyTex);
      this.use(this.bgProgs[U.uMode|0]); gl.uniform1i(this.u('uSky'),0); this.setUniforms(U); this.quad();
      if((U.uMode|0)===0){
        gl.enable(gl.BLEND); gl.blendEquation(gl.FUNC_ADD); gl.blendFunc(gl.ONE,gl.ONE_MINUS_SRC_ALPHA);
        for(const ob of this.objects(U)){
          this.use(this.objProgs[ob.type]); gl.uniform1i(this.u('uSky'),0); this.setUniforms(U);
          gl.uniform4fv(this.u('uPl'),[...ob.pos,ob.r]); gl.uniform4fv(this.u('uObjInfo'),ob.info);
          gl.uniform4fv(this.u('uObjInfo2'),ob.info2); gl.uniform4fv(this.u('uObjCol'),ob.col);
          gl.uniform4fv(this.u('uRect'),ob.rect);
          this.quad();
        }
      }
      // post -> default framebuffer (accumulate)
      gl.bindFramebuffer(gl.FRAMEBUFFER,null); gl.viewport(0,0,this.gw,this.gh);
      if(N>1){ gl.enable(gl.BLEND); gl.blendEquation(gl.FUNC_ADD); gl.blendColor(0,0,0,1/N); gl.blendFunc(gl.CONSTANT_ALPHA,gl.ONE); }
      else gl.disable(gl.BLEND);
      this.use(this.postProg);
      gl.activeTexture(gl.TEXTURE1); gl.bindTexture(gl.TEXTURE_2D,this.hdr); gl.uniform1i(this.u('uHdr'),1);
      gl.activeTexture(gl.TEXTURE0); gl.uniform1i(this.u('uSky'),0);
      this.setUniforms(U); this.quad();
      gl.bindTexture(gl.TEXTURE_2D,null);
    }
    gl.disable(gl.BLEND);
  }
}

// camera helper
function camBasis(pos,target,roll,fovDeg){
  const F=V.norm(V.sub(target,pos));
  let up=[0,1,0];
  let R=V.norm(V.cross(F,up)); let U=V.cross(R,F);
  const c=Math.cos(roll), s=Math.sin(roll);
  const R2=V.add(V.mul(R,c),V.mul(U,s)), U2=V.add(V.mul(U,c),V.mul(R,-s));
  return {pos,F,R:R2,U:U2,tanHalf:Math.tan(fovDeg*Math.PI/360)};
}
// project world point to screen pixels (W,H) using camera
function project(cam,p,W,H){
  const d=V.sub(p,cam.pos); const z=V.dot(d,cam.F);
  if(z<=0.001) return null;
  const x=V.dot(d,cam.R)/(z*cam.tanHalf), y=V.dot(d,cam.U)/(z*cam.tanHalf);
  return {x:W/2+x*H/2, y:H/2-y*H/2, z, s:(H/2)/(z*cam.tanHalf)};
}
