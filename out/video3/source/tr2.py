import json,sys,numpy as np,soundfile as sf
from scipy.signal import resample_poly
from faster_whisper import WhisperModel
m=WhisperModel(sys.argv[1],device="cpu",compute_type="int8",cpu_threads=4)
x,sr=sf.read("voice_cut.wav"); x=resample_poly(x,1,3).astype(np.float32)
segs,_=m.transcribe(x,language="ru",word_timestamps=True,vad_filter=False,beam_size=5,condition_on_previous_text=False)
W=[[round(w.start,2),round(w.end,2),w.word.strip()] for s in segs for w in s.words]
json.dump(W,open("words_cut.json","w"),ensure_ascii=False); print(' '.join(f'{w[2]}@{w[0]:.2f}' for w in W))
