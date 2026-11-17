# «Школа креатива» — 10 s cel-animation spot

`video.mp4`: 1920×1080, 24 fps, 10.000 s, H.264 + AAC 48 kHz stereo, −14 LUFS, true peak −1.6 dBTP.

Rebuild:
```
node render.js /tmp/v.mp4 1          # picture (frame-by-frame from film.html via headless Chromium)
python3 audio.py                     # music + SFX -> audio.wav (reads cues.json)
ffmpeg -i /tmp/v.mp4 -i audio.wav -map 0:v -map 1:a -c:v copy -c:a aac -b:a 256k -t 10 video.mp4
```
`cues.js` / `cues.json` is the shared cue sheet that both picture and sound read from. Stills: `node stills.js outdir 0 144 239`.
