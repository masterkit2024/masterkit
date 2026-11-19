import json,sys,numpy as np,soundfile as sf
from scipy.signal import resample_poly
from faster_whisper import WhisperModel
m=WhisperModel(sys.argv[1],device="cpu",compute_type="int8",cpu_threads=4)
dur=json.load(open("clips2/dur.json")); out={}
for k in dur:
    x,sr=sf.read(f"clips2/{k}.wav"); x=np.concatenate([np.zeros(8000),resample_poly(x,1,3),np.zeros(8000)]).astype(np.float32)
    segs,_=m.transcribe(x,language="ru",beam_size=5,word_timestamps=True,vad_filter=False,condition_on_previous_text=False,temperature=0)
    out[k]=[[round(w.start-0.5,3),round(w.end-0.5,3),w.word.strip(),round(w.probability,2)] for s in segs for w in s.words]
    print(k,' '.join(f"{w[2]}[{w[0]:.2f}-{w[1]:.2f}]" for w in out[k]),flush=True)
json.dump(out,open("clips2/asr.json","w"),ensure_ascii=False)
