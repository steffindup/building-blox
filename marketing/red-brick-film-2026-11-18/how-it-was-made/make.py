import numpy as np, subprocess
from PIL import Image, ImageDraw, ImageFont
W,H=1080,1920; BLUE=(3,105,189); FY=656  # film 1080x608 at y=656
R='/home/claude/building-blox/public/press/images/'
# top band: logo with the wordmark in white
lg=Image.open(R+'bloppit-logo.png').convert('RGBA'); lg=lg.crop(lg.getbbox())
a=np.asarray(lg).copy(); a[:455,:,:3]=255; lg=Image.fromarray(a)
lw=760; lg=lg.resize((lw,round(lw*lg.height/lg.width)),Image.LANCZOS)
bands=Image.new('RGBA',(W,H),BLUE+(255,))
bands.alpha_composite(lg,((W-lw)//2,(FY-lg.height)//2+10))
# bottom band: the line
f=ImageFont.truetype('/home/claude/pwf/Lilita.ttf',96); d=ImageDraw.Draw(bands)
lines=["It starts with","one red brick."]; y0=FY+608+64
for i,t in enumerate(lines):
    w=d.textlength(t,font=f); d.text(((W-w)/2,y0+i*112),t,font=f,fill=(255,255,255))
bands.convert('RGB').save('bands.png')
# end card: the film's own card, content at 1:1, on its dotted cream
e=np.asarray(Image.open('end.png').convert('RGB'))
tile=e[0:46,0:46]; cx,cy,cw,ch=480,180,960,700; px,py=60,(H-ch)//2
yy=(np.arange(H)[:,None]-py+cy)%46; xx=(np.arange(W)[None,:]-px+cx)%46
card=tile[yy,xx].copy(); card[py:py+ch,px:px+cw]=e[cy:cy+ch,cx:cx+cw]
Image.fromarray(card).save('endcard.png')
