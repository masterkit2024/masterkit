import sys,glob
from PIL import Image,ImageDraw
d=sys.argv[1]; fs=sorted(glob.glob(d+'/*.jpg')); cols=3; w,h=640,360
for k in range(0,len(fs),9):
  part=fs[k:k+9]; rows=(len(part)+2)//3
  S=Image.new('RGB',(cols*w,rows*h))
  for i,f in enumerate(part):
    im=Image.open(f).resize((w,h)); ImageDraw.Draw(im).text((8,8),f.split('/')[-1],fill=(255,255,0)); S.paste(im,((i%3)*w,(i//3)*h))
  S.save(f'{d}_sheet{k//9}.png')
