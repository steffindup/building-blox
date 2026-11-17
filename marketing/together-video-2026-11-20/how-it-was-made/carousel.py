import sys; sys.argv=['x','upright','x']  # reuse helpers
from PIL import Image, ImageDraw, ImageFont, ImageFilter
import importlib.util, os
BLUE=(3,105,189); INK=(20,32,34)
S='/home/claude/pwf/shots/'; C='/home/claude/building-blox/marketing/weekly-carousel-2026-11-16/'
OUT='/home/claude/pwf/carousel/'; os.makedirs(OUT+'with-lines',exist_ok=True)
def font(sz): return ImageFont.truetype('/home/claude/pwf/Lilita.ttf',sz)
def line(im,lines,cy,fill,sz=78):
    f=font(sz); d=ImageDraw.Draw(im); lh=int(sz*1.14); y0=cy-lh*len(lines)/2
    if fill==(255,255,255):
        sh=Image.new('RGBA',im.size,(0,0,0,0)); ds=ImageDraw.Draw(sh)
        for i,l in enumerate(lines): ds.text((im.width/2,y0+i*lh+lh/2+4),l,font=f,fill=(10,20,30,170),anchor='mm')
        im.paste(Image.alpha_composite(im.convert('RGBA'),sh.filter(ImageFilter.GaussianBlur(9))).convert('RGB'))
        d=ImageDraw.Draw(im)
    for i,l in enumerate(lines): d.text((im.width/2,y0+i*lh+lh/2),l,font=f,fill=fill,anchor='mm')
    return im
def phone(shot,h):
    s=Image.open(S+shot+'.png').convert('RGB'); w=round(h*s.width/s.height); s=s.resize((w,h),Image.LANCZOS); b=14; rad=h//17
    fr=Image.new('RGBA',(w+2*b,h+2*b),(0,0,0,0)); ImageDraw.Draw(fr).rounded_rectangle((0,0,fr.width-1,fr.height-1),rad+b,fill=(255,255,255,255))
    m=Image.new('L',(w,h),0); ImageDraw.Draw(m).rounded_rectangle((0,0,w-1,h-1),rad,fill=255); fr.paste(s,(b,b),m)
    sh=Image.new('RGBA',(fr.width+80,fr.height+80),(0,0,0,0)); ImageDraw.Draw(sh).rounded_rectangle((40,52,40+fr.width,52+fr.height),rad+b,fill=(0,30,70,110)); sh=sh.filter(ImageFilter.GaussianBlur(18)); sh.paste(fr,(40,40),fr); return sh
def two(a,b,top=True):
    im=Image.new('RGB',(1080,1350),BLUE); ph=930; pa,pb=phone(a,ph),phone(b,ph); y=310 if top else 20
    im.paste(pa,(int(1080*0.255-pa.width/2),y),pa); im.paste(pb,(int(1080*0.745-pb.width/2),y),pb); return im
slides=[]
slides.append(('1-bloppit',Image.open(C+'bloppit-weekly-5-bloppit.png').convert('RGB'),['Something to build','together this week.'],1190,INK))
slides.append(('2-share-a-code',two('s5-ready','s2-join'),['Play with Friends:','share a code.'],170,(255,255,255)))
slides.append(('3-take-turns',two('b10-a','b10-b'),['Take turns on','the same puzzle.'],170,(255,255,255)))
slides.append(('4-built-together',two('z-end-a','z-end-b'),['Finish it together.'],170,(255,255,255)))
def badges():
    im=Image.new('RGB',(1080,1350),BLUE); d=ImageDraw.Draw(im); f=font(104)
    rows=[('Free',(244,188,34),(20,32,34)),('No ads',(255,255,255),BLUE),('No account',(214,47,42),(255,255,255))]
    y=311
    for txt,bg,fg in rows:
        w=int(d.textlength(txt,font=f))+150; h=190; x=(1080-w)//2
        d.rounded_rectangle((x,y+12,x+w,y+h+12),40,fill=(0,60,120)); d.rounded_rectangle((x,y,x+w,y+h),40,fill=bg)
        d.text((540,y+h/2-4),txt,font=f,fill=fg,anchor='mm'); y+=h+62
    return im
slides.append(('5-free',badges(),[],0,INK))
slides.append(('6-three-bricks',Image.open(C+'bloppit-weekly-6-three-bricks.png').convert('RGB'),['On iPhone and iPad.','Link in bio.'],1040,INK))
slides.append(('6-three-bricks-facebook',Image.open(C+'bloppit-weekly-6-three-bricks.png').convert('RGB'),['On iPhone and iPad,','and at bloppit.com.'],1040,INK))
for name,im,lines,cy,fill in slides:
    if 'facebook' not in name: im.save(OUT+f'bloppit-together-{name}.png')
    (line(im.copy(),lines,cy,fill) if lines else im).save(OUT+f'with-lines/bloppit-together-{name}.png')
names=[s[0] for s in slides]
lab=ImageFont.truetype('/home/claude/pwf/Nunito800.ttf',24)
sheet=Image.new('RGB',(360*4,(450+44)*2),'white'); d=ImageDraw.Draw(sheet)
for i,n in enumerate(names):
    x,y=(i%4)*360,(i//4)*494; sheet.paste(Image.open(OUT+f'with-lines/bloppit-together-{n}.png').resize((360,450)),(x,y+44))
    d.text((x+10,y+8),('Slide 6, Facebook version' if 'facebook' in n else 'Slide '+n[0]+(' (Instagram)' if n[0]=='6' else '')),fill=(20,32,34),font=lab)
sheet.save('/home/claude/pwf/carousel-sheet.jpg',quality=88)
