W=$1; H=$2; OUT=$3; CRF=${4:-20}
TOT=2670; N=4; STEP=$(( (TOT+N-1)/N ))
for i in 0 1 2 3; do a=$((i*STEP)); b=$(( (i+1)*STEP )); [ $b -gt $TOT ] && b=$TOT
 (node render.js $W $H raw $a $b 2>/dev/null | ffmpeg -v error -y -f rawvideo -pix_fmt rgba -s ${W}x${H} -r 30 -i - -c:v libx264 -preset medium -crf $CRF -pix_fmt yuv420p part$i.mp4) &
done; wait
printf "file 'part0.mp4'\nfile 'part1.mp4'\nfile 'part2.mp4'\nfile 'part3.mp4'\n" > parts.txt
ffmpeg -v error -y -f concat -safe 0 -i parts.txt -i ../draft_mix.wav -map 0:v -map 1:a -c:v copy -c:a aac -b:a 256k -ar 48000 -t 89 -movflags +faststart $OUT
