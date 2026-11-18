import sys, os, json, subprocess, math, glob
from PIL import Image, ImageDraw, ImageFont, ImageFilter
FMT=sys.argv[1]; OUT=sys.argv[2]; STILLS=len(sys.argv)>3; CFG=json.load(open(os.environ['CFG']))
UP=FMT=='upright'; W,H=(1080,1920) if UP else (1920,1080)
BLUE=(3,105,189); CREAM=(247,243,232); INK=(20,32,34); RED=(214,47,42); YEL=(244,188,34)
P='/home/claude/pwf/'; R='/home/claude/building-blox/public/'; D='/home/claude/spot/'
def font(sz,n='Lilita'): return ImageFont.truetype(P+n+'.ttf',sz)
def ease(t): t=max(0,min(1,t)); return t*t*(3-2*t)
def text_layer(lines,sz,fill,shadow=True,spacing=1.12,fname='Lilita'):
    f=font(sz,fname); d0=ImageDraw.Draw(Image.new('L',(1,1)))
    ws=[d0.textlength(l,font=f) for l in lines]; lh=int(sz*spacing); pad=40
    im=Image.new('RGBA',(int(max(ws))+pad*2,lh*len(lines)+pad*2),(0,0,0,0))
    if shadow:
        sh=Image.new('RGBA',im.size,(0,0,0,0)); ds=ImageDraw.Draw(sh)
        for i,l in enumerate(lines): ds.text(((im.width-ws[i])/2,pad+i*lh+4),l,font=f,fill=(10,20,30,160))
        im=Image.alpha_composite(im,sh.filter(ImageFilter.GaussianBlur(9)))
    d=ImageDraw.Draw(im)
    for i,l in enumerate(lines): d.text(((im.width-ws[i])/2,pad+i*lh),l,font=f,fill=fill)
    return im
def paste_c(base,layer,cx,cy,alpha=1.0):
    if alpha<1: layer=layer.copy(); layer.putalpha(layer.getchannel('A').point(lambda v:int(v*alpha)))
    base.paste(layer,(int(cx-layer.width/2),int(cy-layer.height/2)),layer)
_c={}
def img(p):
    if p not in _c: _c[p]=Image.open(p).convert('RGB')
    return _c[p]
def phone(path,h):
    k=(path,h)
    if k in _c: return _c[k]
    s=img(path); w=round(h*s.width/s.height); s=s.resize((w,h),Image.LANCZOS); b=max(10,h//70); rad=h//17
    fr=Image.new('RGBA',(w+2*b,h+2*b),(0,0,0,0)); d=ImageDraw.Draw(fr); d.rounded_rectangle((0,0,fr.width-1,fr.height-1),rad+b,fill=(255,255,255,255))
    m=Image.new('L',(w,h),0); ImageDraw.Draw(m).rounded_rectangle((0,0,w-1,h-1),rad,fill=255); fr.paste(s,(b,b),m)
    sh=Image.new('RGBA',(fr.width+80,fr.height+80),(0,0,0,0)); ImageDraw.Draw(sh).rounded_rectangle((40,52,40+fr.width,52+fr.height),rad+b,fill=(0,30,70,110)); sh=sh.filter(ImageFilter.GaussianBlur(18)); sh.paste(fr,(40,40),fr)
    _c[k]=sh; return sh
C1=text_layer(CFG['title'],150 if UP else 140,(255,255,255)); C1s=text_layer([CFG['sub']],64 if UP else 60,(255,255,255))
C2=text_layer(CFG['play'],96 if UP else 88,(255,255,255))
films=sorted(glob.glob(D+'film-'+CFG['key']+'/*.jpg')); NA=len(films)
def sceneA(i):
    src=img(films[min(i,NA-1)])
    if UP:
        cw=608; c=CFG['pan'][0]+(CFG['pan'][1]-CFG['pan'][0])*ease(i/(NA-1)); x=int(max(0,min(1920-cw,c*1920-cw/2)))
        fr=src.crop((x,0,x+cw,1080)).resize((W,H),Image.BICUBIC)
        paste_c(fr,C1,W/2,1380,ease((i-6)/10)); paste_c(fr,C1s,W/2,1560,ease((i-14)/10))
    else:
        fr=src.copy(); paste_c(fr,C1,W/2,800,ease((i-6)/10)); paste_c(fr,C1s,W/2,940,ease((i-14)/10))
    return fr
shots=sorted(glob.glob(D+CFG['key']+'/s*.png'))[:CFG.get('last',999)]
NB=195; per=NB/len(shots)
def sceneB(i):
    k=min(len(shots)-1,int(i/per)); fr=Image.new('RGB',(W,H),BLUE)
    if UP: ph=phone(shots[k],1300); paste_c(fr,ph,W/2,1180); paste_c(fr,C2,W/2,300,ease(i/8))
    else: ph=phone(shots[k],960); paste_c(fr,ph,1360,H/2+8); paste_c(fr,C2,560,H/2,ease(i/8))
    return fr
char=Image.open(D+CFG['char']).convert('RGBA'); char=char.crop(char.getbbox())
logo=Image.open(R+'press/images/bloppit-logo.png').convert('RGBA'); logo=logo.crop(logo.getbbox())
def pill(txt,sz):
    f=font(sz,'Nunito800'); w=int(ImageDraw.Draw(Image.new('L',(1,1))).textlength(txt,font=f)); h=int(sz*2.1)
    im=Image.new('RGBA',(w+int(sz*2.2),h+8),(0,0,0,0)); d=ImageDraw.Draw(im)
    d.rounded_rectangle((0,8,im.width-1,h+7),h//2,fill=(190,140,10,255)); d.rounded_rectangle((0,0,im.width-1,h-1),h//2,fill=YEL+(255,))
    d.text((im.width/2,h/2),txt,font=f,fill=INK,anchor='mm'); return im
END=Image.new('RGB',(W,H),CREAM)
if UP:
    c=char.resize((int(560*char.width/char.height),560),Image.LANCZOS) if char.height>=char.width else char.resize((600,int(600*char.height/char.width)),Image.LANCZOS)
    paste_c(END,c,W/2,420); paste_c(END,text_layer([CFG['end']],120,RED,False),W/2,830)
    paste_c(END,text_layer([CFG['endsub']],52,INK,False,fname='Nunito800'),W/2,950)
    l=logo.resize((520,int(520*logo.height/logo.width)),Image.LANCZOS); paste_c(END,l,W/2,1210)
    paste_c(END,pill('Free on iPhone and iPad',46),W/2,1450); paste_c(END,text_layer(['bloppit.com'],84,BLUE,False),W/2,1610)
else:
    c=char.resize((int(640*char.width/char.height),640),Image.LANCZOS) if char.height>=char.width else char.resize((600,int(600*char.height/char.width)),Image.LANCZOS)
    paste_c(END,c,470,H/2); paste_c(END,text_layer([CFG['end']],110,RED,False),1260,200)
    paste_c(END,text_layer([CFG['endsub']],48,INK,False,fname='Nunito800'),1260,320)
    l=logo.resize((500,int(500*logo.height/logo.width)),Image.LANCZOS); paste_c(END,l,1260,530)
    paste_c(END,pill('Free on iPhone and iPad',44),1260,760); paste_c(END,text_layer(['bloppit.com'],80,BLUE,False),1260,900)
NE=110; XF=8
scenes=[(sceneA,NA),(sceneB,NB),(lambda i:END,NE)]
TOTAL=sum(n for _,n in scenes)
def frame(g):
    acc=0
    for si,(f,n) in enumerate(scenes):
        if g<acc+n:
            i=g-acc; fr=f(i)
            if si>0 and i<XF: pf,pn=scenes[si-1]; fr=Image.blend(pf(pn-1),fr,(i+1)/(XF+1))
            return fr
        acc+=n
if STILLS:
    picks=[50,NA+20,NA+100,NA+NB-10,NA+NB+40]; ims=[frame(g) for g in picks]; tw=240 if UP else 420; th=int(tw*H/W)
    s=Image.new('RGB',(tw*len(ims),th)); [s.paste(im.resize((tw,th)),(k*tw,0)) for k,im in enumerate(ims)]; s.save(OUT,quality=85); print('frames',TOTAL,TOTAL/30); sys.exit()
dur=TOTAL/30
p=subprocess.Popen(['ffmpeg','-v','error','-y','-f','rawvideo','-pix_fmt','rgb24','-s',f'{W}x{H}','-r','30','-i','-','-ss',f'{24.6-dur:.2f}','-i',P+'music.wav','-t',f'{dur:.3f}','-af',f'afade=t=out:st={dur-0.6:.2f}:d=0.6','-c:v','libx264','-preset','medium','-crf','18','-pix_fmt','yuv420p','-c:a','aac','-b:a','192k','-movflags','+faststart',OUT],stdin=subprocess.PIPE)
for g in range(TOTAL): p.stdin.write(frame(g).tobytes())
p.stdin.close(); p.wait(); print('done',OUT,TOTAL,dur)
