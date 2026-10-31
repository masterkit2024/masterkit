# Солнце → чёрная дыра (YouTube Shorts, 9:16)

Исходники ролика: WebGL-шейдер космоса (линзирование, планеты, Солнце), 2D-слой типографики, синтезированная музыка и звуковой дизайн, сведённые с озвучкой.

- `index.html`, `js/` — сцена и таймлайн (детерминированный, `renderFrame(t)`).
- `storyboard.md` — раскадровка.
- `audio/make_audio.py` — музыка + SFX + дакинг под голос → `mix.wav`.
- `tools/render_all.sh OUT` — рендер сцен в сегменты (Playwright + Chromium + FFmpeg), затем склейка и mux звука.
- Шрифты: Unbounded и Manrope (SIL OFL, Google Fonts).

Сборка:
```bash
python3 audio/make_audio.py audio/voice.wav build/
./tools/render_all.sh build/segs
# склейка + звук — см. tools/mux.sh
```
