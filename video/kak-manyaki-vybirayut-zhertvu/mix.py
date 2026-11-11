import numpy as np, wave, sys
SR=48000
def rd(p):
    w=wave.open(p); return np.frombuffer(w.readframes(w.getnframes()),dtype=np.int16).astype(np.float32)/32768
mg=float(sys.argv[1]) if len(sys.argv)>1 else .7; sg=float(sys.argv[2]) if len(sys.argv)>2 else .45
music=np.load('music.npy'); sfx=np.load('sfx.npy'); N=len(music)
voice=rd('voice.wav'); voice=np.pad(voice,(0,max(0,N-len(voice))))[:N]
m=music*mg; f=sfx*sg
dly=int(.012*SR); side=np.concatenate([np.zeros(dly),(m+f)[:-dly]])*.25
L=voice+m+f+side*.5; R=voice+m+f-side*.5
st=np.stack([L,R],1)
rms=lambda x: 20*np.log10(np.sqrt((x**2).mean())+1e-9)
print('voice',rms(voice),'music',rms(m),'sfx',rms(f))
st=st/ max(1.0, np.abs(st).max()) * .98
w=wave.open('mix.wav','wb'); w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR); w.writeframes((st*32767).astype(np.int16).tobytes()); w.close()
