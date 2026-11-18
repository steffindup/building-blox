import sys, subprocess, math, random, os
import numpy as np
from PIL import Image, ImageDraw, ImageFont, ImageFilter
import json
FMT=sys.argv[1]; OUT=sys.argv[2]; STILLS=len(sys.argv)>3
CFG=json.load(open(os.environ['CFG']))
UP=FMT=='upright'; W,H=(1080,1920) if UP else (1920,1080)
BLUE=(3,105,189); CREAM=(247,243,232); INK=(20,32,34); RED=(214,47,42); YEL=(244,188,34)
K=CFG['dir']+'/'; R='/home/claude/building-blox/public/'; P='/home/claude/pwf/'
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
import sys as _s; _s.path.insert(0,'/home/claude/wk'); from align import bbox
_c={}
def shot(n):
    if n not in _c: _c[n]=Image.open(K+n+'.png').convert('RGB')
    return _c[n]
N=CFG['total']
fin=shot('final2'); pre=shot('pre1')
Hc=min(fin.height,pre.height); fin=fin.crop((0,0,fin.width,Hc)); pre=pre.crop((0,0,pre.width,Hc))
# best small shift of pre onto fin
A=np.asarray(fin).astype(int); best=(1e18,0,0)
for dy in range(-8,9):
    for dx in range(-8,9):
        B=np.asarray(pre.transform(pre.size,Image.AFFINE,(1,0,-dx,0,1,-dy),fillcolor=(255,255,255))).astype(int)
        e=np.abs(A-B)[20:-20,20:-20].sum()
        if e<best[0]: best=(e,dx,dy)
_,DX,DY=best; print('shift',DX,DY)
base25=pre.transform(pre.size,Image.AFFINE,(1,0,-DX,0,1,-DY),fillcolor=(255,255,255))
a25=np.asarray(base25).astype(int); a26=np.asarray(fin).astype(int)
diff=(np.abs(a26-a25).sum(2)>70)
diff=np.asarray(Image.fromarray((diff*255).astype('uint8')).filter(ImageFilter.MinFilter(3)).filter(ImageFilter.MaxFilter(9)).filter(ImageFilter.GaussianBlur(1.5))).astype(float)/255
ys,xs=np.where(diff>0.5); MX0,MX1,MY0,MY1=xs.min(),xs.max(),ys.min(),ys.max(); PX,PY=(MX0+MX1)/2,(MY0+MY1)/2
yy,xx=np.mgrid[0:fin.height,0:fin.width]
def fan(t):
    t=ease(t)
    if CFG['reveal']=='rise': m=np.clip((yy-(MY1+4-t*(MY1-MY0+8)))/4,0,1)
    else: m=np.clip(((MX0-4)+t*(MX1-MX0+8)-xx)/4,0,1)
    m=m*diff
    a=a25*(1-m[...,None])+a26*m[...,None]
    return Image.fromarray(a.astype('uint8'))
def crop_for(img):
    x0,y0,x1,y1,_=bbox(img); side=max(300,1.32*max(x1-x0,y1-y0)); cx,cy=(x0+x1)/2,(y0+y1)/2
    return [cx,cy,side]
frames=['k%03d'%k for k in range(0,N-1)]
crops=[crop_for(shot(f)) for f in frames]
for k in range(1,len(crops)):   # smooth
    crops[k]=[0.5*crops[k-1][j]+0.5*crops[k][j] for j in range(3)]
FC=crop_for(fin)
def boxc(c,img):
    cx,cy,side=c; side=min(side,img.width,img.height); x=min(max(0,cx-side/2),img.width-side); y=min(max(0,cy-side/2),img.height-side)
    return (int(x),int(y),int(x+side),int(y+side))
CROPF=boxc(FC,fin)
random.seed(7)
SPARKS=[(random.uniform(-180,180),random.uniform(0.9,1.6),random.uniform(0.0,0.6),random.uniform(10,22)) for _ in range(16)]
def sparkle(img,t):
    d=ImageDraw.Draw(img,'RGBA'); R0=max(MX1-MX0,MY1-MY0)/2
    for angd,rf,t0,sz in SPARKS:
        u=(t-t0)/0.7
        if 0<u<1:
            r=R0*rf*(0.8+0.3*u); x=PX+r*math.sin(math.radians(angd)); y=PY-r*math.cos(math.radians(angd))
            s=sz*math.sin(math.pi*u); al=int(255*math.sin(math.pi*u))
            d.polygon([(x,y-s),(x+s*0.28,y-s*0.28),(x+s,y),(x+s*0.28,y+s*0.28),(x,y+s),(x-s*0.28,y+s*0.28),(x-s,y),(x-s*0.28,y-s*0.28)],fill=(255,214,60,al))
    return img
def card(pic,scale=1.0,crop=None):
    side=900 if UP else 860
    c=pic.crop(crop or CROPF)
    if scale!=1.0:
        cw=c.width/scale; x=(c.width-cw)/2; c=c.crop((int(x),int(x),int(x+cw),int(x+cw)))
    c=c.resize((side,side),Image.LANCZOS)
    cd=Image.new('RGBA',(side+28,side+28),(0,0,0,0)); ImageDraw.Draw(cd).rounded_rectangle((0,0,cd.width-1,cd.height-1),60,fill=(255,255,255,255))
    m=Image.new('L',c.size,0); ImageDraw.Draw(m).rounded_rectangle((0,0,side-1,side-1),48,fill=255); cd.paste(c,(14,14),m)
    sh=Image.new('RGBA',(cd.width+80,cd.height+80),(0,0,0,0)); ImageDraw.Draw(sh).rounded_rectangle((40,54,40+cd.width,54+cd.height),60,fill=(0,30,70,110)); sh=sh.filter(ImageFilter.GaussianBlur(18)); sh.paste(cd,(40,40),cd)
    return sh
CAP=text_layer(CFG['cap'],112 if UP else 104,(255,255,255))
def scene_frame(pic,i,scale=1.0,cap_a=1.0,crop=None):
    fr=Image.new('RGB',(W,H),BLUE)
    if UP: paste_c(fr,card(pic,scale,crop),W/2,1130); paste_c(fr,CAP,W/2,340,cap_a)
    else: paste_c(fr,card(pic,scale,crop),1340,H/2+6); paste_c(fr,CAP,500,H/2,cap_a)
    return fr
# timeline
seq=[]
per=max(2,round(100/(N-1)))
seq+= [('k000',None)]*16
for k in range(1,N-1): seq+= [('k%03d'%k,None)]*per
seq+= [('pre',None)]*26
NF=20
seq+= [('fan',j/(NF-1)) for j in range(NF)]
seq+= [('k26',None)]*44
NB=len(seq); NE=105; XF=8
blop=Image.open(CFG['art']).convert('RGBA'); blop=blop.crop(blop.getbbox())
logo=Image.open(R+'press/images/bloppit-logo.png').convert('RGBA'); logo=logo.crop(logo.getbbox())
def pill(txt,sz):
    f=font(sz,'Nunito800'); w=int(ImageDraw.Draw(Image.new('L',(1,1))).textlength(txt,font=f)); h=int(sz*2.1)
    im=Image.new('RGBA',(w+int(sz*2.2),h+8),(0,0,0,0)); d=ImageDraw.Draw(im)
    d.rounded_rectangle((0,8,im.width-1,h+7),h//2,fill=(190,140,10,255)); d.rounded_rectangle((0,0,im.width-1,h-1),h//2,fill=YEL+(255,))
    d.text((im.width/2,h/2),txt,font=f,fill=INK,anchor='mm'); return im
END=Image.new('RGB',(W,H),CREAM)
if UP:
    b=blop.resize((int(600*blop.width/blop.height),600),Image.LANCZOS); paste_c(END,b,W/2,400)
    paste_c(END,text_layer(CFG['end_up'],120,RED,False),W/2,850)
    l=logo.resize((520,int(520*logo.height/logo.width)),Image.LANCZOS); paste_c(END,l,W/2,1230)
    paste_c(END,text_layer(["This week in Bibi's Weekly Bloppit"],46,INK,False,fname='Nunito800'),W/2,1420)
    paste_c(END,pill('Free on iPhone and iPad',46),W/2,1540); paste_c(END,text_layer(['bloppit.com'],84,BLUE,False),W/2,1690)
else:
    b=blop.resize((int(700*blop.width/blop.height),700),Image.LANCZOS); paste_c(END,b,520,H/2+10)
    paste_c(END,text_layer(CFG['end_wide'],104,RED,False),1260,200)
    l=logo.resize((520,int(520*logo.height/logo.width)),Image.LANCZOS); paste_c(END,l,1260,480)
    paste_c(END,text_layer(["This week in Bibi's Weekly Bloppit"],44,INK,False,fname='Nunito800'),1260,650)
    paste_c(END,pill('Free on iPhone and iPad',44),1260,770); paste_c(END,text_layer(['bloppit.com'],80,BLUE,False),1260,910)
def build_frame(g):
    n,t=seq[g]
    if n=='fan':
        pic=sparkle(fan(t),t); sc=1.0+0.05*math.sin(math.pi*min(1,t*1.2))
        return scene_frame(pic,g,sc)
    if n=='k26':
        j=g-(NB-44); pic=fin.copy()
        if j<12: pic=sparkle(Image.blend(fan(1.0),fin,min(1,j/6)),1.0+j/30)
        return scene_frame(pic,g)
    if n=='pre': return scene_frame(base25,g)
    k=int(n[1:]); im=shot(n); return scene_frame(im,g,1.0,ease(g/10),boxc(crops[k],im))
TOTAL=NB+NE
def frame(g):
    if g<NB: return build_frame(g)
    i=g-NB
    if i<XF: return Image.blend(build_frame(NB-1),END,(i+1)/(XF+1))
    return END
if STILLS:
    picks=[5,16+per*((N-1)//2),NB-44-NF-6,NB-44-NF+6,NB-44-NF+12,NB-44+20,NB+40]
    ims=[frame(g) for g in picks]; tw=240 if UP else 420; th=int(tw*H/W)
    sheet=Image.new('RGB',(tw*len(ims),th),'white')
    for k,im in enumerate(ims): sheet.paste(im.resize((tw,th)),(k*tw,0))
    sheet.save(OUT,quality=85); print('frames',TOTAL,TOTAL/30); sys.exit()
dur=TOTAL/30
p=subprocess.Popen(['ffmpeg','-v','error','-y','-f','rawvideo','-pix_fmt','rgb24','-s',f'{W}x{H}','-r','30','-i','-','-i',P+'music.wav','-t',f'{dur:.3f}','-af',f'afade=t=out:st={dur-1.2:.2f}:d=1.2','-c:v','libx264','-preset','medium','-crf','18','-pix_fmt','yuv420p','-c:a','aac','-b:a','192k','-movflags','+faststart',OUT],stdin=subprocess.PIPE)
for g in range(TOTAL): p.stdin.write(frame(g).tobytes())
p.stdin.close(); p.wait(); print('done',OUT,TOTAL,dur)
