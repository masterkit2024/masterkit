#!/usr/bin/env bash
# Concatenate rendered segments, mux the final mix, verify the result.
set -euo pipefail
cd "$(dirname "$0")/out"
DUR=$(python3 -c "import json;print(json.load(open('../media/timeline.json'))['duration'])")
ffmpeg -v error -y -f concat -safe 0 -i segs.txt -c copy video_only.mp4
ffmpeg -v error -y -i video_only.mp4 -i mix.wav -map 0:v:0 -map 1:a:0 -t "$DUR" \
  -c:v copy -c:a aac -b:a 256k -ar 48000 -movflags +faststart nozh_i_verevka.mp4
ffprobe -v error -show_entries stream=codec_name,pix_fmt,width,height,r_frame_rate,nb_frames,sample_rate,channels:format=duration -of compact nozh_i_verevka.mp4
