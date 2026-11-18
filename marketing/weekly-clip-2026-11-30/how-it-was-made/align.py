import sys, numpy as np
from PIL import Image
def load(p): return Image.open(p).convert('RGB')
def align(pre,fin,excl=None):
    # find scale s and shift so pre scaled about top-left then shifted matches fin (on fin's canvas)
    F=np.asarray(fin.resize((fin.width//4,fin.height//4))).astype(int)
    best=None
    for s in np.arange(0.80,1.21,0.01):
        P=pre.resize((max(1,int(pre.width*s/4)),max(1,int(pre.height*s/4))))
        Pa=np.asarray(P).astype(int)
        for dy in range(-40,41,1):
            for dx in range(-30,31,2):
                pass
        # coarse via model bbox instead
    return None
def bbox(img):
    a=np.asarray(img).astype(int); mx=a.max(2); mn=a.min(2)
    sat=(mx-mn)>60; dark=mx<150
    blue=(a[...,2]>a[...,0]+60)&(a[...,2]>150)&(a[...,1]>120)&(a[...,0]<160); yel=(a[...,0]>200)&(a[...,1]>180)&(a[...,2]<140)
    m=(sat|dark)&~blue&~yel
    ys,xs=np.where(m); return xs.min(),ys.min(),xs.max(),ys.max(),m
