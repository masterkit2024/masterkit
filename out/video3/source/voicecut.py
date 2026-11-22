import numpy as np,soundfile as sf,json,sys
x,sr=sf.read("audio/voice.wav"); hop=sr//100
e=np.array([np.sqrt(np.mean(x[i:i+hop]**2)+1e-12) for i in range(0,len(x)-hop,hop)]);db=20*np.log10(e);m=db>db.max()-44
r=[];i=0
while i<len(m):
    if m[i]:
        j=i
        while j<len(m) and m[j]: j+=1
        r.append([i/100,j/100]); i=j
    else: i+=1
o=[r[0]]
for a,b in r[1:]:
    if a-o[-1][1]<0.2: o[-1][1]=b
    else: o.append([a,b])
R=[[a-0.04,b+0.06] for a,b in o if b-a>0.08 and a<97.5 and not (0.9<a<1.1)]
CAP=float(sys.argv[1]) if len(sys.argv)>1 else 0.7
# special gaps keyed by the source time of the gap start (end of previous run)
SPECIAL={0.71:1.25,5.45:1.05,15.17:1.0,25.89:0.95,38.66:1.0,48.63:1.0,56.45:1.0,58.32:1.4,70.75:1.0,85.73:1.0,91.29:1.05,92.36:0.95}
START=1.9
out=[]; t=START; segs=[]
for k,(a,b) in enumerate(R):
    if k>0:
        g=a-R[k-1][1]; pe=R[k-1][1]-0.06
        sp=[v for s,v in SPECIAL.items() if abs(s-pe)<0.08]
        g2=sp[0] if sp else min(g,CAP)
        t+=g2
    segs.append([a,b,t]); t+=b-a
print("voice end",round(t,2),"runs",len(R))
SR=48000
from scipy.signal import resample_poly
x48=resample_poly(x,2,1)
N=int((t+0.5)*SR); y=np.zeros(N)
for a,b,dst in segs:
    s=x48[int(a*SR):int(b*SR)].copy(); f=int(0.012*SR); s[:f]*=np.linspace(0,1,f); s[-f:]*=np.linspace(1,0,f)
    i=int(dst*SR); y[i:i+len(s)]+=s
sf.write("voice_cut.wav",y,SR)
json.dump(segs,open("segmap.json","w"))
