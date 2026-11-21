import json,sys,numpy as np,soundfile as sf
from scipy.signal import resample_poly
from faster_whisper import WhisperModel
m=WhisperModel(sys.argv[1],device="cpu",compute_type="int8",cpu_threads=4)
x,sr=sf.read("audio/voice.wav"); x=resample_poly(x,2,3).astype(np.float32)
segs,_=m.transcribe(x,language="ru",word_timestamps=True,vad_filter=False,beam_size=5,condition_on_previous_text=False)
W=[]
for s in segs:
    print(f"{s.start:6.2f}-{s.end:6.2f}",s.text,flush=True)
    for w in s.words: W.append([round(w.start,2),round(w.end,2),w.word.strip(),round(w.probability,2)])
json.dump(W,open("words_raw.json","w"),ensure_ascii=False)
