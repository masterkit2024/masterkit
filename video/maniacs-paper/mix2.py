import numpy as np, json, wave
SR=48000
from audio import N, EV, SC, cue, wr, lp
v=np.load('a_voice.npy').astype(np.float64); m=np.load('a_music.npy').astype(np.float64); s=np.load('a_sfx.npy').astype(np.float64)
def ma(x,k):
    c=np.cumsum(np.concatenate([[0],x])); y=(c[k:]-c[:-k])/k; p=k//2; return np.concatenate([np.full(p,y[0]),y,np.full(len(x)-len(y)-p,y[-1])])
db=lambda x: 20*np.log10(np.sqrt((x**2).mean())+1e-12)
# speech envelope
e=np.abs(v); k=int(.2*SR); e=ma(e,k); act=np.clip(e/ (np.percentile(e[e>1e-4],60)+1e-9),0,1)
act=ma(act,int(.4*SR))
# levels: music ~ -20 dB under voice when speaking, +6 dB in gaps
vr=db(v[act>.5]); mr=db(m); sr=db(s)
gm=10**((vr-20-mr)/20); m*=gm
duck=1-(1-10**(-6/20))*np.clip(act,0,1)   # 6 dB extra rise in gaps relative
m=m*duck/ (1-(1-10**(-6/20)))  # normalize so speech parts sit at -20dB

s*=10**((vr-13-sr)/20)
# silences: gate music+sfx
g=np.ones(N)
for e2 in EV['events']:
    if e2['type']=='silence':
        a=int((e2['t'])*SR); b=int((e2['t']+e2['d'])*SR); r=int(.2*SR)
        g[a:a+r]=np.minimum(g[a:a+r],np.linspace(1,0,len(g[a:a+r]))); g[a+r:b]=0
# disclaimer & end card: music a bit higher
for (a,b) in [(0,7.0),(SC[8][1],SC[8][1]+4)]:
    i0,i1=int(a*SR),int(b*SR); m[i0:i1]*=1.6
mix_ms=(m+s)*g
# fade out end
fo=int(1.5*SR); mix_ms[-fo:]*=np.linspace(1,0,fo)
L=v+mix_ms; R=v+mix_ms
# slight width for music
d=int(.011*SR); side=np.concatenate([np.zeros(d),m[:-d]*g[:-d]])*.25; L+=side; R-=side
st=np.stack([L,R],1); pk=np.abs(st).max(); st=st/max(1,pk)*.97
w=wave.open('mix_full.wav','wb'); w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR); w.writeframes((st*32767).astype(np.int16).tobytes()); w.close()
print('voice',vr,'music(speech)',db(m[act>.5]),'sfx',db(s),'peak',pk)
