#!/bin/bash
# рендер 3D-версии кусками по 700 кадров (устойчиво к сбоям), затем склейка
cd /home/user/masterkit/video
TOTAL=4125; STEP=700; mkdir -p out/chunks
for ((a=0; a<TOTAL; a+=STEP)); do
  b=$((a+STEP-1)); [ $b -ge $TOTAL ] && b=$((TOTAL-1))
  f=out/chunks/c_$(printf %05d $a).mp4
  [ -s $f ] && continue
  for try in 1 2 3; do
    TMPDIR=/tmp/claude-0 npx remotion render src/index.ts SlowedWorld3D $f --frames=$a-$b --codec h264 --crf 18 --concurrency 4 --gl=swangle --timeout=240000 \
      --browser-executable /opt/pw-browsers/chromium_headless_shell-1243/chrome-headless-shell-linux64/chrome-headless-shell --muted --log error >> out/render3d.log 2>&1 && break
    rm -f $f; echo "retry $a $try"
  done
  [ -s $f ] && echo "chunk $a-$b done" || { echo "chunk $a FAILED"; exit 1; }
  rm -rf /tmp/claude-0/remotion-* 2>/dev/null
done
ls out/chunks/c_*.mp4 | sed "s/^/file '..\//;s/$/'/" | sed "s|file '../out/chunks/|file '|" > out/chunks/list.txt
ffmpeg -v error -y -f concat -safe 0 -i out/chunks/list.txt -c copy out/video3d_noaudio.mp4 && echo ALL DONE
