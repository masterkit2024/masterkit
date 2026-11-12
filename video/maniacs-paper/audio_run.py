import numpy as np, audio
v = audio.rd('voice_proc.wav'); v = np.pad(v, (0, max(0, audio.N - len(v))))[:audio.N]
import os
if os.path.exists('a_music.npy'): m = np.load('a_music.npy')
else:
    m = audio.music(); np.save('a_music.npy', m.astype(np.float32))
print('music ok', flush=True)
s = audio.sfx(); print('sfx ok', flush=True)
np.save('a_voice.npy', v.astype(np.float32)); np.save('a_music.npy', m.astype(np.float32)); np.save('a_sfx.npy', s.astype(np.float32)); print('saved')
