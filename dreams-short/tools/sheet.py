import sys,glob
from PIL import Image, ImageDraw
d=sys.argv[1]; cols=int(sys.argv[2]) if len(sys.argv)>2 else 6
fs=sorted(glob.glob(d+'/t*.jpg')); w,h=270,480
rows=(len(fs)+cols-1)//cols
S=Image.new('RGB',(w*cols,h*rows))
for i,f in enumerate(fs):
    im=Image.open(f).resize((w,h)); dr=ImageDraw.Draw(im); dr.text((6,6),f.split('/t')[-1][:-4],fill=(255,0,0))
    S.paste(im,((i%cols)*w,(i//cols)*h))
S.save(d+'/sheet.jpg',quality=88)
