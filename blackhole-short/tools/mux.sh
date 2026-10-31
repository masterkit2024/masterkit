#!/bin/bash
# usage: mux.sh segdir mix.wav out.mp4
SEG=$1; MIX=$2; OUT=$3
ls $SEG/seg*.mp4 | sort | sed "s|^|file '|; s|$|'|" > $SEG/list.txt
ffmpeg -y -v error -f concat -safe 0 -i $SEG/list.txt -i "$MIX" -map 0:v -map 1:a -c:v copy \
  -af "loudnorm=I=-14:TP=-1.0:LRA=11" -c:a aac -b:a 256k -ar 48000 -movflags +faststart -t 76.0 "$OUT"
