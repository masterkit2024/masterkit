#!/bin/bash
# QA: чёрные/белые/замершие кадры и громкость
f=$1
echo "== black"; ffmpeg -v info -i "$f" -vf blackdetect=d=0.3:pix_th=0.05 -an -f null - 2>&1 | grep -o "black_start.*" | head
echo "== freeze (>1.2s)"; ffmpeg -v info -i "$f" -vf freezedetect=n=0.001:d=1.2 -an -f null - 2>&1 | grep -oE "freeze_(start|duration): [0-9.]+" | paste - - | head -20
echo "== loudness"; ffmpeg -i "$f" -vn -af ebur128=peak=true -f null - 2>&1 | grep -E "^\s+(I|Peak):"
ffprobe -v error -show_entries stream=codec_name,width,height,r_frame_rate,sample_rate,duration -of compact "$f"
