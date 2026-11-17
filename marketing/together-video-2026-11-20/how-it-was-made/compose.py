import sys, subprocess, os, math
from PIL import Image, ImageDraw, ImageFont, ImageFilter
FMT=sys.argv[1]; OUT=sys.argv[2]; STILLS=len(sys.argv)>3
W,H=(1080,1920) if FMT=='upright' else (1920,1080)
UP=FMT=='upright'
BLUE=(3,105,189); CREAM=(247,243,232); INK=(20,32,34); RED=(214,47,42); YEL=(244,188,34)
S='/home/claude/pwf/shots/'; R='/home/claude/building-blox/public/'
def font(sz,name='Lilita'): return ImageFont.truetype(f'/home/claude/pwf/{name}.ttf',sz)
def ease(t): t=max(0,min(1,t)); return t*t*(3-2*t)
def text_layer(lines,sz,fill,shadow=True,spacing=1.12):
    f=font(sz); d0=ImageDraw.Draw(Image.new('L',(1,1)))
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
        a=layer.getchannel('A').point(lambda v:int(v*alpha)); layer=layer.copy(); layer.putalpha(a)
    base.paste(layer,(int(cx-layer.width/2),int(cy-layer.height/2)),layer)
_cache={}
def img(path):
    if path not in _cache: _cache[path]=Image.open(path).convert('RGB')
    return _cache[path]
def phone(shot,h):
    key=('ph',shot,h)
    if key in _cache: return _cache[key]
    s=img(S+shot+'.png'); w=round(h*s.width/s.height); s=s.resize((w,h),Image.LANCZOS)
    b=max(10,h//70); rad=h//17
    fr=Image.new('RGBA',(w+2*b,h+2*b),(0,0,0,0)); d=ImageDraw.Draw(fr)
    d.rounded_rectangle((0,0,fr.width-1,fr.height-1),rad+b,fill=(255,255,255,255))
    m=Image.new('L',(w,h),0); ImageDraw.Draw(m).rounded_rectangle((0,0,w-1,h-1),rad,fill=255)
    fr.paste(s,(b,b),m)
    sh=Image.new('RGBA',(fr.width+80,fr.height+80),(0,0,0,0)); ImageDraw.Draw(sh).rounded_rectangle((40,52,40+fr.width,52+fr.height),rad+b,fill=(0,30,70,110)); sh=sh.filter(ImageFilter.GaussianBlur(18))
    sh.paste(fr,(40,40),fr); _cache[key]=sh; return sh
CAPS={}
def cap(lines,sz,fill=(255,255,255)):
    k=(tuple(lines),sz,fill)
    if k not in CAPS: CAPS[k]=text_layer(lines,sz,fill,shadow=fill==(255,255,255))
    return CAPS[k]
# ---------- scenes: each returns an RGB frame for local frame i of n
def cine(dirname,n,pan,lines,fade=True):
    def f(i):
        src=img(f'/home/claude/pwf/src/{dirname}/{min(i+1,n):03d}.jpg')
        if UP:
            cw=608; c=pan[0]+(pan[1]-pan[0])*ease(i/(n-1)); x=int(max(0,min(1920-cw,c*1920-cw/2)))
            fr=src.crop((x,0,x+cw,1080)).resize((W,H),Image.BICUBIC)
        else: fr=src.copy()
        a=ease((i-4)/10) if fade else 1.0
        if UP: paste_c(fr,cap(lines,96),W/2,1500,a)
        else: paste_c(fr,cap(lines,92),W/2,900,a)
        return fr
    return f
def phones(seq,lines):   # seq: list of (shotA, shotB, frames)
    tl=[]; 
    for a,b,k in seq: tl+= [(a,b)]*k
    def f(i):
        a,b=tl[min(i,len(tl)-1)]; fr=Image.new('RGB',(W,H),BLUE)
        if UP:
            ph=1130; pa,pb=phone(a,ph),phone(b,ph); 
            fr.paste(pa,(int(W*0.255-pa.width/2),560),pa); fr.paste(pb,(int(W*0.745-pb.width/2),560),pb)
            paste_c(fr,cap(lines,96),W/2,300,ease(i/8))
        else:
            ph=940; pa,pb=phone(a,ph),phone(b,ph)
            fr.paste(pa,(int(1150-pa.width/2),30),pa); fr.paste(pb,(int(1640-pb.width/2),30),pb)
            paste_c(fr,cap(lines,88),450,H/2,ease(i/8))
        return fr
    return f,len(tl)
def turkey(n,lines):
    t=img(S+'turkey-25.png')
    def f(i):
        fr=Image.new('RGB',(W,H),BLUE); z=1.0+0.07*ease(i/(n-1)); side=860 if UP else 820
        cw=int(t.width/z); ch=int(t.height/z); x=(t.width-cw)//2; y=(t.height-ch)//2
        c=t.crop((x,y,x+cw,y+ch)).resize((side,int(side*t.height/t.width)),Image.LANCZOS)
        card=Image.new('RGBA',(c.width+28,c.height+28),(0,0,0,0)); ImageDraw.Draw(card).rounded_rectangle((0,0,card.width-1,card.height-1),60,fill=(255,255,255,255))
        m=Image.new('L',c.size,0); ImageDraw.Draw(m).rounded_rectangle((0,0,c.width-1,c.height-1),48,fill=255); card.paste(c,(14,14),m)
        if UP: paste_c(fr,card,W/2,1080); paste_c(fr,cap(lines,104),W/2,330,ease(i/8))
        else: paste_c(fr,card,1380,H/2); paste_c(fr,cap(lines,96),480,H/2,ease(i/8))
        return fr
    return f
def endcard(n):
    blop=Image.open(R+'press/images/bloppit-with-red-brick.png').convert('RGBA'); blop=blop.crop(blop.getbbox())
    logo=Image.open(R+'press/images/bloppit-logo.png').convert('RGBA'); logo=logo.crop(logo.getbbox())
    def pill(txt,sz):
        f=ImageFont.truetype('/home/claude/pwf/Nunito800.ttf',sz); w=int(ImageDraw.Draw(Image.new('L',(1,1))).textlength(txt,font=f)); h=int(sz*2.1)
        im=Image.new('RGBA',(w+int(sz*2.2),h+8),(0,0,0,0)); d=ImageDraw.Draw(im)
        d.rounded_rectangle((0,8,im.width-1,h+7),h//2,fill=(190,140,10,255)); d.rounded_rectangle((0,0,im.width-1,h-1),h//2,fill=YEL+(255,))
        d.text((im.width/2,h/2),txt,font=f,fill=INK,anchor='mm'); return im
    base=Image.new('RGB',(W,H),CREAM)
    if UP:
        b=blop.resize((int(430*blop.width/blop.height),430),Image.LANCZOS); paste_c(base,b,W/2,590)
        l=logo.resize((640,int(640*logo.height/logo.width)),Image.LANCZOS); paste_c(base,l,W/2,1010)
        paste_c(base,text_layer(['Build it. Grow your world.'],72,INK,False),W/2,1270)
        paste_c(base,pill('Free on iPhone and iPad',46),W/2,1420); paste_c(base,text_layer(['bloppit.com'],84,BLUE,False),W/2,1580)
    else:
        b=blop.resize((int(640*blop.width/blop.height),640),Image.LANCZOS); paste_c(base,b,600,H/2)
        l=logo.resize((680,int(680*logo.height/logo.width)),Image.LANCZOS); paste_c(base,l,1240,330)
        paste_c(base,text_layer(['Build it. Grow your world.'],70,INK,False),1240,590)
        paste_c(base,pill('Free on iPhone and iPad',44),1240,720); paste_c(base,text_layer(['bloppit.com'],80,BLUE,False),1240,860)
    return lambda i: base
b=lambda k:'b%02d'%k
build=[(b(k)+'-a',b(k)+'-b',10 if k else 14) for k in range(19)]+[('z-end-a','z-end-b',40)]
lobby=[('s1-lobby','s2-join',38),('s4-letin','s3-knock',26),('s5-ready','s3-knock',14)]
f3,n3=phones(lobby,['Open a room.','Share the code.']); f4,n4=phones(build,['Take turns on','the same puzzle.'])
T1=['Build it together','this Thanksgiving.']
scenes=[(cine('blitz',88,(0.30,0.72),T1),88),(cine('frog',67,(0.27,0.80),T1,False),67),(f3,n3),(f4,n4),(endcard(105),105)]
total=sum(n for _,n in scenes); XF=7
def frame(g):
    acc=0
    for si,(f,n) in enumerate(scenes):
        if g<acc+n:
            i=g-acc; fr=f(i)
            if si>0 and i<XF and not (si==1):   # crossfade from the previous scene's last frame (hard cut between the two cinematic shots)
                pf,pn=scenes[si-1]; fr=Image.blend(pf(pn-1),fr,(i+1)/(XF+1))
            return fr
        acc+=n
if STILLS:
    acc=0; picks=[]
    for f,n in scenes: picks+= [acc+int(n*0.15),acc+int(n*0.85)]; acc+=n
    ims=[frame(g) for g in picks]; tw=270 if UP else 480; th=int(tw*H/W)
    cols=6 if UP else 4; rows=math.ceil(len(ims)/cols); sheet=Image.new('RGB',(tw*cols,th*rows),'white')
    for k,im in enumerate(ims): sheet.paste(im.resize((tw,th)),((k%cols)*tw,(k//cols)*th))
    sheet.save(OUT,quality=85); print('frames',total,total/30); sys.exit()
dur=total/30
p=subprocess.Popen(['ffmpeg','-v','error','-y','-f','rawvideo','-pix_fmt','rgb24','-s',f'{W}x{H}','-r','30','-i','-','-i','/home/claude/pwf/music.wav','-t',f'{dur:.3f}','-af',f'afade=t=out:st={dur-1.0:.2f}:d=1.0','-c:v','libx264','-preset','medium','-crf','18','-pix_fmt','yuv420p','-c:a','aac','-b:a','192k','-movflags','+faststart',OUT],stdin=subprocess.PIPE)
for g in range(total): p.stdin.write(frame(g).tobytes())
p.stdin.close(); p.wait(); print('done',OUT,total,dur)
