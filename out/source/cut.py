import numpy as np,soundfile as sf,subprocess,json
SR=48000
def load(n):
    subprocess.run(["ffmpeg","-v","error","-y","-i",f"audio/{n}.wav","-ar",str(SR),"-ac","1",f"clips/_{n}48.wav"])
    return sf.read(f"clips/_{n}48.wav")[0]
src={n:load(n) for n in ["keeper","dima","mama"]}
def voiced(x,rel=40,hop=480):
    e=np.array([np.sqrt(np.mean(x[i:i+hop]**2)+1e-12) for i in range(0,len(x),hop)])
    db=20*np.log10(e); return db>db.max()-rel
def compress(x,maxgap,keepgaps=(),rel=40):
    v=voiced(x,rel); hop=480
    # find first/last voiced
    idx=np.where(v)[0]; a,b=max(idx[0]-2,0),min(idx[-1]+4,len(v))
    out=[];i=a;gi=0
    while i<b:
        if v[i]: 
            j=i
            while j<b and v[j]: j+=1
            out.append(x[i*hop:j*hop]); i=j
        else:
            j=i
            while j<b and not v[j]: j+=1
            g=(j-i)*hop/SR
            if g>0.12: gi+=1
            mg=keepgaps[gi-1] if (g>0.12 and gi-1<len(keepgaps) and keepgaps[gi-1]) else maxgap
            seg=x[i*hop:j*hop]
            if g>mg:
                k=int(mg*SR/2); f=np.linspace(1,0,min(240,k))
                h1=seg[:k].copy(); h2=seg[-k:].copy()
                h1[-len(f):]*=f; h2[:len(f)]*=f[::-1]
                seg=np.concatenate([h1,h2])
            out.append(seg); i=j
    y=np.concatenate(out); n=int(0.015*SR)
    y[:n]*=np.linspace(0,1,n); y[-n:]*=np.linspace(1,0,n); return y
C=[("L1","keeper",0.25,10.9,0.6,1.15),("L2","keeper",12.3,15.6,0.6,1.15),("L3b","keeper",21.0,27.5,0.6,1.15),
("L4","keeper",28.15,36.0,0.6,1.15),("L5","keeper",36.8,45.1,0.6,1.15),("L7","keeper",48.7,58.05,0.6,1.15),
("L8","keeper",59.85,68.62,0.6,1.15),("L9","keeper",70.4,78.2,0.6,1.15),("L11","keeper",86.25,90.55,0.55,1.15),
("D1","dima",1.2,5.5,0.4,1),("D3","dima",16.38,18.6,0.5,1),("D4","dima",22.15,24.85,0.6,1),("D5","dima",31.0,32.25,0.5,1),
("D6","dima",41.25,42.3,0.5,1),("D7","dima",49.45,50.5,0.5,1),("D8","dima",55.4,57.9,0.5,1),("D9","dima",58.8,60.45,0.6,1),
("M","mama",0.3,10.5,0.6,1.0)]
info={}
for k,n,a,b,mg,tp in C:
    y=compress(src[n][int(a*SR):int(b*SR)],mg,rel=(56 if k in ("D4","D8","D9","D5","L11") else 42))
    sf.write(f"clips/{k}_raw.wav",y,SR)
    if tp!=1: subprocess.run(["ffmpeg","-v","error","-y","-i",f"clips/{k}_raw.wav","-af",f"rubberband=tempo={tp}:pitchq=quality:transients=smooth","-ar",str(SR),f"clips/{k}.wav"])
    else: subprocess.run(["cp",f"clips/{k}_raw.wav",f"clips/{k}.wav"])
    d=len(sf.read(f"clips/{k}.wav")[0])/SR; info[k]=d
    print(f"{k:4} src {b-a:5.2f}s -> {d:5.2f}s")
json.dump(info,open("clips/dur.json","w"))
