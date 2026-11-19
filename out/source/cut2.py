import numpy as np,soundfile as sf,subprocess,json,re,sys,difflib
from scipy.signal import resample_poly
SR=48000
exec(open("cut.py").read().split("C=[")[0].replace('"clips/_','"clips2/_'))   # load(), voiced(), compress()
C=[("L1","keeper",4.70,10.95,0.75,1.15),("L2","keeper",12.25,13.85,0.6,1.15),("L3","keeper",17.55,25.20,0.42,1.15),
("L4","keeper",26.05,36.00,0.42,1.15),("L5","keeper",36.75,45.15,0.45,1.15),("L7","keeper",48.65,58.10,0.55,1.15),
("L8","keeper",59.80,68.65,0.55,1.15),("L9","keeper",70.35,78.20,0.55,1.15),("L11","keeper",86.20,90.55,0.6,1.15),
("D1","dima",1.15,5.55,0.45,1),("D3","dima",16.35,18.65,0.5,1),("D4","dima",22.10,24.55,0.45,1),("D5","dima",26.60,27.20,0.5,1),
("D6","dima",30.90,32.30,0.5,1),("D7","dima",41.15,42.35,0.5,1),("D8","dima",49.35,50.55,0.5,1),("D9","dima",55.25,60.35,0.6,1),
("M","mama",0.30,10.50,0.6,1.0)]
src['dima'][int(56.05*SR):int(56.95*SR)]*=0.0
dur={}
for k,n,a,b,mg,tp in C:
    y=compress(src[n][int(a*SR):int(b*SR)],mg,rel=(56 if k in ("D4",) else 44))
    sf.write(f"clips2/{k}_raw.wav",y,SR)
    if tp!=1: subprocess.run(["ffmpeg","-v","error","-y","-i",f"clips2/{k}_raw.wav","-af",f"rubberband=tempo={tp}:pitchq=quality:transients=smooth","-ar",str(SR),f"clips2/{k}.wav"])
    else: subprocess.run(["cp",f"clips2/{k}_raw.wav",f"clips2/{k}.wav"])
    dur[k]=len(sf.read(f"clips2/{k}.wav")[0])/SR; print(k,round(b-a,2),"->",round(dur[k],2))
json.dump(dur,open("clips2/dur.json","w"))
