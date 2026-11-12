import subprocess, numpy as np
from PIL import Image, ImageDraw
R='/home/claude/building-blox/'; W,H=1080,1920
def load(p,mode='RGB'): return np.asarray(Image.open(p).convert(mode),np.float32)
bgB,bgC,bgE,end=load('x/lc-bg-build.png'),load('x/lc-bg-grow.png'),load('x/lc-bg-world.png'),load('x/lc-end.png'); meet=load('x/lc-meet.png','RGBA')
sx,sy,sw,sh,rad=190,360,700,1516,52
SS=4; m=Image.new('L',(sw*SS,sh*SS),0); ImageDraw.Draw(m).rounded_rectangle([0,0,sw*SS-1,sh*SS-1],radius=rad*SS,fill=255); mask=np.asarray(m.resize((sw,sh),Image.LANCZOS),np.float32)[...,None]/255
def phone(bg,f,d='x/final'):
    fr=bg.copy(); new=np.asarray(Image.open(f'{d}/f{f:05d}.png').convert('RGB').resize((sw,sh),Image.LANCZOS),np.float32)
    fr[sy:sy+sh,sx:sx+sw]=fr[sy:sy+sh,sx:sx+sw]*(1-mask)+new*mask; return fr
# A: the film, upright, 3.0 s to 8.0 s
film=subprocess.Popen(['ffmpeg','-v','error','-ss','3','-t','5','-i',R+'mobile/store/previews/iphone-arrival.mp4','-vf','scale=1080:2340:flags=lanczos,crop=1080:1920:0:190','-r','30','-f','rawvideo','-pix_fmt','rgb24','-'],stdout=subprocess.PIPE)
lastA=[None]
def filmframe(i):
    raw=film.stdout.read(W*H*3)
    if len(raw)==W*H*3: lastA[0]=np.frombuffer(raw,np.uint8).reshape(H,W,3).astype(np.float32)
    fr=lastA[0]; a=float(np.clip((i-18)/12,0,1)*np.clip((150-i)/8,0,1)); al=meet[...,3:]/255*a; return fr*(1-al)+meet[...,:3]*al
seq=[('A',i) for i in range(150)]+[('B',f) for f in range(762,882)]+[('C',f) for f in range(990,1188)]+[('E',f) for f in range(14,164)]+[('D',i) for i in range(120)]
enc=subprocess.Popen(['ffmpeg','-v','error','-y','-f','rawvideo','-pix_fmt','rgb24','-s',f'{W}x{H}','-r','30','-i','-','-c:v','libx264','-preset','medium','-crf','20','-pix_fmt','yuv420p','x/launch-video-only.mp4'],stdin=subprocess.PIPE)
prev=None; lastkind=None; fade=0; hold=None
for k,(kind,f) in enumerate(seq):
    cur=filmframe(f) if kind=='A' else phone(bgB,f) if kind=='B' else phone(bgC,f) if kind=='C' else phone(bgE,f,'x/world-final') if kind=='E' else end
    if kind!=lastkind and lastkind is not None: hold=prev; fade=8
    out=cur
    if fade>0: t=(8-fade+1)/9; out=hold*(1-t)+cur*t; fade-=1
    if k<6: out=out*((k+1)/7)
    enc.stdin.write(np.clip(out,0,255).astype(np.uint8).tobytes()); prev=cur; lastkind=kind
enc.stdin.close(); enc.wait(); print('frames',len(seq),len(seq)/30,'s')
