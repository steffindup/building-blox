import sys, subprocess, math, random
import numpy as np
from PIL import Image, ImageDraw, ImageFont, ImageFilter
FMT=sys.argv[1]; OUT=sys.argv[2]; STILLS=len(sys.argv)>3
UP=FMT=='upright'; W,H=(1080,1920) if UP else (1920,1080)
BLUE=(3,105,189); CREAM=(247,243,232); INK=(20,32,34); RED=(214,47,42); YEL=(244,188,34)
K='/home/claude/tk/'; R='/home/claude/building-blox/public/'; P='/home/claude/pwf/'
def font(sz,name='Lilita'): return ImageFont.truetype(P+name+'.ttf',sz)
def ease(t): t=max(0,min(1,t)); return t*t*(3-2*t)
def text_layer(lines,sz,fill,shadow=True,spacing=1.12,fname='Lilita'):
    f=font(sz,fname); d0=ImageDraw.Draw(Image.new('L',(1,1)))
    ws=[d0.textlength(l,font=f) for l in lines]; lh=int(sz*spacing); pad=40
    im=Image.new('RGBA',(int(max(ws))+pad*2,lh*len(lines)+pad*2),(0,0,0,0))
    if shadow:
        sh=Image.new('RGBA',im.size,(0,0,0,0)); ds=ImageDraw.Draw(sh)
        for i,l in enumerate(lines): ds.text(((im.width-ws[i])/2,pad+i*lh+4),l,font=f,fill=(10,20,30,150))
        im=Image.alpha_composite(im,sh.filter(ImageFilter.GaussianBlur(9)))
    d=ImageDraw.Draw(im)
    for i,l in enumerate(lines): d.text(((im.width-ws[i])/2,pad+i*lh),l,font=f,fill=fill)
    return im
def paste_c(base,layer,cx,cy,alpha=1.0):
    if alpha<1:
        layer=layer.copy(); layer.putalpha(layer.getchannel('A').point(lambda v:int(v*alpha)))
    base.paste(layer,(int(cx-layer.width/2),int(cy-layer.height/2)),layer)
CROP=(30,50,620,640)
_c={}
def shot(n):
    if n not in _c: _c[n]=Image.open(K+n+'.png').convert('RGB')
    return _c[n]
# tail-less picture lined up with the finished one (the eyes sit 3.5 px higher in k25)
k25=shot('k25'); k26=shot('k26').crop((0,0,718,744))
base25=Image.new('RGB',k25.size,(255,255,255)); base25.paste(k25,(0,3)); base25.paste(k25.crop((0,0,k25.width,3)),(0,0))
a25=np.asarray(base25).astype(int); a26=np.asarray(k26).astype(int)
diff=(np.abs(a26-a25).sum(2)>60)
diff=np.asarray(Image.fromarray((diff*255).astype('uint8')).filter(ImageFilter.MaxFilter(5)).filter(ImageFilter.GaussianBlur(1.5))).astype(float)/255
PX,PY=372,330   # fan pivot: middle of the body
yy,xx=np.mgrid[0:k26.height,0:k26.width]; ang=np.degrees(np.arctan2(xx-PX,PY-yy))   # 0 = straight up
def fan(t):
    phi=8+100*ease(t)
    m=np.clip((phi-np.abs(ang))/6,0,1)*diff
    a=a25*(1-m[...,None])+a26*m[...,None]
    return Image.fromarray(a.astype('uint8'))
random.seed(7)
SPARKS=[(random.uniform(-100,100),random.uniform(150,260),random.uniform(0.0,0.6),random.uniform(10,22)) for _ in range(16)]
def sparkle(img,t):
    d=ImageDraw.Draw(img,'RGBA')
    for angd,rad,t0,sz in SPARKS:
        u=(t-t0)/0.7
        if 0<u<1:
            r=rad*(0.7+0.4*u); x=PX+r*math.sin(math.radians(angd)); y=PY-r*math.cos(math.radians(angd))
            s=sz*math.sin(math.pi*u); al=int(255*math.sin(math.pi*u))
            d.polygon([(x,y-s),(x+s*0.28,y-s*0.28),(x+s,y),(x+s*0.28,y+s*0.28),(x,y+s),(x-s*0.28,y+s*0.28),(x-s,y),(x-s*0.28,y-s*0.28)],fill=(255,214,60,al))
    return img
def card(pic,scale=1.0):
    side=900 if UP else 860
    c=pic.crop(CROP)
    if scale!=1.0:
        cw=c.width/scale; x=(c.width-cw)/2; c=c.crop((int(x),int(x),int(x+cw),int(x+cw)))
    c=c.resize((side,side),Image.LANCZOS)
    cd=Image.new('RGBA',(side+28,side+28),(0,0,0,0)); ImageDraw.Draw(cd).rounded_rectangle((0,0,cd.width-1,cd.height-1),60,fill=(255,255,255,255))
    m=Image.new('L',c.size,0); ImageDraw.Draw(m).rounded_rectangle((0,0,side-1,side-1),48,fill=255); cd.paste(c,(14,14),m)
    sh=Image.new('RGBA',(cd.width+80,cd.height+80),(0,0,0,0)); ImageDraw.Draw(sh).rounded_rectangle((40,54,40+cd.width,54+cd.height),60,fill=(0,30,70,110)); sh=sh.filter(ImageFilter.GaussianBlur(18)); sh.paste(cd,(40,40),cd)
    return sh
CAP=text_layer(['Save the tail','for last.'],112 if UP else 104,(255,255,255))
def scene_frame(pic,i,scale=1.0,cap_a=1.0):
    fr=Image.new('RGB',(W,H),BLUE)
    if UP: paste_c(fr,card(pic,scale),W/2,1130); paste_c(fr,CAP,W/2,340,cap_a)
    else: paste_c(fr,card(pic,scale),1340,H/2+6); paste_c(fr,CAP,500,H/2,cap_a)
    return fr
# timeline
seq=[]
seq+= [('k00',None)]*16
for k in range(1,26): seq+= [('k%02d'%k,None)]*4
seq+= [('k25',None)]*26
NF=20
seq+= [('fan',j/(NF-1)) for j in range(NF)]
seq+= [('k26',None)]*44
NB=len(seq); NE=105; XF=8
blop=Image.open(R+'press/images/bloppit-with-red-brick.png').convert('RGBA'); blop=blop.crop(blop.getbbox())
logo=Image.open(R+'press/images/bloppit-logo.png').convert('RGBA'); logo=logo.crop(logo.getbbox())
def pill(txt,sz):
    f=font(sz,'Nunito800'); w=int(ImageDraw.Draw(Image.new('L',(1,1))).textlength(txt,font=f)); h=int(sz*2.1)
    im=Image.new('RGBA',(w+int(sz*2.2),h+8),(0,0,0,0)); d=ImageDraw.Draw(im)
    d.rounded_rectangle((0,8,im.width-1,h+7),h//2,fill=(190,140,10,255)); d.rounded_rectangle((0,0,im.width-1,h-1),h//2,fill=YEL+(255,))
    d.text((im.width/2,h/2),txt,font=f,fill=INK,anchor='mm'); return im
END=Image.new('RGB',(W,H),CREAM)
if UP:
    b=blop.resize((int(400*blop.width/blop.height),400),Image.LANCZOS); paste_c(END,b,W/2,470)
    paste_c(END,text_layer(['Gobble. Gobble.','Bloppit.'],120,RED,False),W/2,880)
    l=logo.resize((560,int(560*logo.height/logo.width)),Image.LANCZOS); paste_c(END,l,W/2,1210)
    paste_c(END,text_layer(["This week in Bibi's Weekly Bloppit"],46,INK,False,fname='Nunito800'),W/2,1420)
    paste_c(END,pill('Free on iPhone and iPad',46),W/2,1540); paste_c(END,text_layer(['bloppit.com'],84,BLUE,False),W/2,1690)
else:
    b=blop.resize((int(620*blop.width/blop.height),620),Image.LANCZOS); paste_c(END,b,520,H/2)
    paste_c(END,text_layer(['Gobble. Gobble. Bloppit.'],104,RED,False),1260,200)
    l=logo.resize((520,int(520*logo.height/logo.width)),Image.LANCZOS); paste_c(END,l,1260,480)
    paste_c(END,text_layer(["This week in Bibi's Weekly Bloppit"],44,INK,False,fname='Nunito800'),1260,650)
    paste_c(END,pill('Free on iPhone and iPad',44),1260,770); paste_c(END,text_layer(['bloppit.com'],80,BLUE,False),1260,910)
def build_frame(g):
    n,t=seq[g]
    if n=='fan':
        pic=sparkle(fan(t),t); s=1.0+0.05*math.sin(math.pi*min(1,t*1.2))
        return scene_frame(pic,g,s)
    if n=='k26':
        j=g-(NB-44); pic=k26.copy()
        if j<12: pic=sparkle(Image.blend(fan(1.0),k26,min(1,j/6)),1.0+j/30)
        return scene_frame(pic,g)
    return scene_frame(base25 if n=='k25' else shot(n),g,1.0,ease(g/10))
TOTAL=NB+NE
def frame(g):
    if g<NB: return build_frame(g)
    i=g-NB
    if i<XF: return Image.blend(build_frame(NB-1),END,(i+1)/(XF+1))
    return END
if STILLS:
    picks=[5,40,120,150,158,162,170,200,NB+40]
    ims=[frame(g) for g in picks]; tw=240 if UP else 420; th=int(tw*H/W)
    sheet=Image.new('RGB',(tw*len(ims),th),'white')
    for k,im in enumerate(ims): sheet.paste(im.resize((tw,th)),(k*tw,0))
    sheet.save(OUT,quality=85); print('frames',TOTAL,TOTAL/30); sys.exit()
dur=TOTAL/30
p=subprocess.Popen(['ffmpeg','-v','error','-y','-f','rawvideo','-pix_fmt','rgb24','-s',f'{W}x{H}','-r','30','-i','-','-i',P+'music.wav','-t',f'{dur:.3f}','-af',f'afade=t=out:st={dur-1.2:.2f}:d=1.2','-c:v','libx264','-preset','medium','-crf','18','-pix_fmt','yuv420p','-c:a','aac','-b:a','192k','-movflags','+faststart',OUT],stdin=subprocess.PIPE)
for g in range(TOTAL): p.stdin.write(frame(g).tobytes())
p.stdin.close(); p.wait(); print('done',OUT,TOTAL,dur)
