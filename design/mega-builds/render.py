import json
from PIL import Image, ImageDraw, ImageFont
PAL={"a":"#9FC3E9","n":"#1F2B52","w":"#F4F4F4","r":"#C91A09","y":"#F2CD37","o":"#FE8A18","b":"#0055BF","m":"#36AEBF","g":"#4B9F4A","l":"#A5CA18","k":"#7C4A1E","t":"#E4CD9E","h":"#A0A5A9","d":"#6C6E68","p":"#FC97AC","v":"#8A6FD1","z":"#1B2A34","s":"#F2D594","c":"#5A93DB"}
P=json.load(open('mega.json'))
S=16; W,H=28,22
def pic(rows):
    im=Image.new('RGB',(W*S,H*S),'#E9EEF3'); d=ImageDraw.Draw(im)
    for y,r in enumerate(rows):
        for x,ch in enumerate(r):
            c=PAL[ch]; d.rounded_rectangle([x*S+1,y*S+1,x*S+S-1,y*S+S-1],3,fill=c)
            d.ellipse([x*S+4,y*S+4,x*S+S-4,y*S+S-4],fill=c,outline=(0,0,0,40))
    return im
try: f=ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf',22); f2=ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf',17)
except: f=f2=None
items=list(P.values()); cols=2; cw,ch=W*S+40,H*S+110
sheet=Image.new('RGB',(cols*cw+20,((len(items)+1)//2)*ch+20),'white'); d=ImageDraw.Draw(sheet)
for i,v in enumerate(items):
    x=20+(i%cols)*cw; y=20+(i//cols)*ch
    sheet.paste(pic(v['rows']),(x,y)); d.text((x,y+H*S+12),v['name'],fill='#142022',font=f); d.text((x,y+H*S+44),v['blurb'],fill='#555',font=f2)
sheet.save('mega-builds-proposal.png'); print(sheet.size)
