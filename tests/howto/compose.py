# Put the newly recorded phone footage into the old video's phone screen; captions, Bloppit, music and sounds stay.
import sys, os, json, subprocess, numpy as np
from PIL import Image, ImageDraw
src_dir, out_dir = sys.argv[1], sys.argv[2]; only = sys.argv[3:] 
V=os.path.join(os.path.dirname(os.path.abspath(__file__)),'..','..','public','video',''); MULT=json.load(open(os.path.join(os.path.dirname(os.path.abspath(__file__)),'mult.json'))); os.makedirs(out_dir,exist_ok=True)
CUTS={'how-to-play':(1920,1080,(1300,40,462,1000),40),'how-to-play-app':(1920,1080,(1300,40,462,1000),40),'how-to-play-app-tall':(1080,1920,(220,505,638,1381),55)}
A,B=68,1229
def footage(f):
    for g in range(f,f-6,-1):
        p=f'{src_dir}/f{g:05d}.png'
        if os.path.exists(p): return p
    return None
for name,(W,H,(sx,sy,sw,sh),rad) in CUTS.items():
    if only and name not in only: continue
    SS=4; m=Image.new('L',(sw*SS,sh*SS),0); ImageDraw.Draw(m).rounded_rectangle([0,0,sw*SS-1,sh*SS-1],radius=rad*SS,fill=255); mask=np.asarray(m.resize((sw,sh),Image.LANCZOS),np.float32)[...,None]/255
    dec=subprocess.Popen(['ffmpeg','-v','error','-i',V+name+'.mp4','-f','rawvideo','-pix_fmt','rgb24','-'],stdout=subprocess.PIPE)
    enc=subprocess.Popen(['ffmpeg','-v','error','-y','-f','rawvideo','-pix_fmt','rgb24','-s',f'{W}x{H}','-r','30','-i','-','-i',V+name+'.mp4','-map','0:v','-map','1:a','-c:a','copy',
        '-c:v','libx264','-preset','medium','-crf',os.environ.get('CRF','23'),'-pix_fmt','yuv420p','-movflags','+faststart',f'{out_dir}/{name}.mp4'],stdin=subprocess.PIPE)
    cards={k:np.asarray(Image.open(f'x/card-{name}-{k}.png').convert('RGB'),np.float32) for k in ('title','end')}
    # the small logo beside "HOW TO PLAY": the current round Bloppit picture
    icx,icy,isz=(88,92,58) if W>H else (89,83,60); av=Image.open(os.path.join(V,'..','art','bloppit-avatar.png')).convert('RGBA').resize((isz,isz),Image.LANCZOS); ava=np.asarray(av,np.float32); pad=4
    box=(icx-isz//2-pad,icy-isz//2-pad,icx+isz//2+pad,icy+isz//2+pad); patch=np.tile(np.array([247,243,233],np.float32),(box[3]-box[1],box[2]-box[0],1)); o=pad; al=ava[...,3:]/255; patch[o:o+isz,o:o+isz]=patch[o:o+isz,o:o+isz]*(1-al)+ava[...,:3]*al
    f=0; last=None; A=next(i for i in range(60,120) if MULT[name][i]<0.02)+1   # the title fades to black first
    while True:
        raw=dec.stdout.read(W*H*3)
        if len(raw)<W*H*3: break
        fr=np.frombuffer(raw,np.uint8).reshape(H,W,3)
        if f<A or f>=B:   # the opening and ending cards, with the current logo; the old video's fades are kept
            fr=np.clip(cards['title' if f<A else 'end']*min(1.0,MULT[name][f]),0,255).astype(np.uint8)
        elif A<=f<B:
            p=footage(f)
            if p:
                if not last or last[0]!=p: last=(p,np.asarray(Image.open(p).convert('RGB').resize((sw,sh),Image.LANCZOS),np.float32))
                fr=fr.copy(); reg=fr[sy:sy+sh,sx:sx+sw].astype(np.float32); new=last[1]*min(1.0,MULT[name][f])
                fr[sy:sy+sh,sx:sx+sw]=np.clip(reg*(1-mask)+new*mask,0,255).astype(np.uint8)
            if fr.flags.writeable: fr[box[1]:box[3],box[0]:box[2]]=np.clip(patch*min(1.0,MULT[name][f]),0,255).astype(np.uint8)
        enc.stdin.write(fr.tobytes()); f+=1
    enc.stdin.close(); enc.wait(); print(name,f,'frames',os.path.getsize(f'{out_dir}/{name}.mp4')//1024,'KB')
