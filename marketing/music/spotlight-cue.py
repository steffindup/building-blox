# A 14.8 s cue for the spotlight videos, made to fit their three scenes:
# 0-4.6 s film (marimba + soft pad), 4.6-11.1 s gameplay (adds bass and a light beat),
# 11.1-14.8 s end card (a chime and one final chord that rings out).
import numpy as np, wave, sys
SR=44100; DUR=14.8; BPM=104; beat=60/BPM
N=int(SR*DUR); L=np.zeros(N); Rr=np.zeros(N)
def note(m): return 440*2**((m-69)/12)
def add(sig,t0,pan=0.0,gain=1.0):
    i=int(t0*SR); j=min(N,i+len(sig)); s=sig[:j-i]*gain
    L[i:j]+=s*(1-pan)*0.5*2**0.5/1.41; Rr[i:j]+=s*(1+pan)*0.5*2**0.5/1.41
def env(n,a,d):
    t=np.arange(n)/SR; e=np.minimum(1,t/a)*np.exp(-t/d); return e
def marimba(m,dur=0.9):
    n=int(SR*dur); t=np.arange(n)/SR; f=note(m)
    s=np.sin(2*np.pi*f*t)+0.35*np.sin(2*np.pi*4*f*t)*np.exp(-t/0.05)+0.15*np.sin(2*np.pi*10*f*t)*np.exp(-t/0.02)
    return s*env(n,0.003,0.28)
def bell(m,dur=3.5):
    n=int(SR*dur); t=np.arange(n)/SR; f=note(m)
    s=sum(a*np.sin(2*np.pi*f*r*t)*np.exp(-t/(dd)) for a,r,dd in [(1,1,1.6),(0.5,2.76,0.6),(0.3,5.4,0.25),(0.2,8.9,0.12)])
    return s*np.minimum(1,t/0.002)
def pad(ms,dur,att=0.8,rel=1.2):
    n=int(SR*dur); t=np.arange(n)/SR; s=np.zeros(n)
    for m in ms:
        for det in (-0.08,0.0,0.08):
            f=note(m)*2**(det/12); s+=np.sin(2*np.pi*f*t)+0.3*np.sin(2*np.pi*2*f*t)
    e=np.minimum(1,t/att)*np.minimum(1,(dur-t)/rel).clip(0,1); return s*e/len(ms)/3
def bass(m,dur):
    n=int(SR*dur); t=np.arange(n)/SR; f=note(m)
    s=np.sin(2*np.pi*f*t)+0.25*np.sin(2*np.pi*2*f*t); return s*env(n,0.005,0.35)
def kick():
    n=int(SR*0.3); t=np.arange(n)/SR; f=110*np.exp(-t/0.04)+45
    return np.sin(2*np.pi*np.cumsum(f)/SR)*np.exp(-t/0.12)
def shaker():
    n=int(SR*0.08); t=np.arange(n)/SR; return np.random.default_rng(1).standard_normal(n)*np.exp(-t/0.02)*0.25
def clap():
    n=int(SR*0.2); t=np.arange(n)/SR; r=np.random.default_rng(2).standard_normal(n)
    e=np.exp(-t/0.05)*(1+0.6*np.exp(-((t-0.012)/0.003)**2)); return r*e*0.35
# C major, I-vi-IV-V, one chord a bar (4 beats)
prog=[(60,[60,64,67]),(57,[57,60,64]),(53,[53,57,60]),(55,[55,59,62])]
bar=4*beat; T1=4.6; T2=11.1
# marimba arpeggio pattern (eighths)
pat=[0,2,1,2,0,2,1,2]
t=0.0; k=0
while t<T2-0.05:
    root,ch=prog[int(t/bar)%4]
    for i,pi in enumerate(pat):
        tt=t+i*beat/2
        if tt>=T2-0.05: break
        m=ch[pi]+12+(12 if (i==3 and t>=T1) else 0)
        add(marimba(m),tt,pan=-0.25 if i%2 else 0.25,gain=0.5)
    # pad
    add(pad([c for c in ch],bar+0.6,0.5,0.8),t,gain=0.16)
    if t>=T1-0.01:
        for b in range(4):
            tb=t+b*beat
            if tb<T2-0.05:
                add(bass(root-12,beat*0.9),tb,gain=0.55)
                if b%2==0: add(kick(),tb,gain=0.7)
                else: add(clap(),tb,gain=0.5)
                add(shaker(),tb+beat/2,pan=0.4,gain=0.6)
    t+=bar
# little pickup into the gameplay and a lift into the end card
for i,m in enumerate([67,69,71]): add(marimba(m+12,0.5),T1-0.45+i*0.15,gain=0.45)
for i,m in enumerate([72,74,76,79]): add(marimba(m+12,0.6),T2-0.5+i*0.12,gain=0.4)
# end: chime + final C chord ringing out
add(bell(84,3.6),T2+0.02,gain=0.5); add(bell(91,3.4),T2+0.02,pan=0.3,gain=0.22)
add(pad([48,60,64,67,72],DUR-T2+0.2,0.05,1.6),T2,gain=0.28)
add(bass(36,2.5),T2,gain=0.6); add(kick(),T2,gain=0.7)
for i,m in enumerate([72,76,79,84]): add(marimba(m,1.2),T2+0.02+i*0.06,gain=0.35)
# simple stereo reverb
def reverb(x,seed):
    n=int(SR*1.4); t=np.arange(n)/SR; ir=np.random.default_rng(seed).standard_normal(n)*np.exp(-t/0.35); ir[0]=0
    from numpy.fft import rfft,irfft
    m=len(x)+n; F=1<<(m-1).bit_length(); y=irfft(rfft(x,F)*rfft(ir,F),F)[:len(x)]; return y/np.abs(ir).sum()*6
L2=L+0.25*reverb(L,3); R2=Rr+0.25*reverb(Rr,4)
fade=np.ones(N); nf=int(SR*0.35); fade[-nf:]=np.linspace(1,0,nf)**2; L2*=fade; R2*=fade
pk=max(np.abs(L2).max(),np.abs(R2).max()); L2/=pk*1.12; R2/=pk*1.12
st=(np.stack([L2,R2],1)*32767).astype(np.int16)
w=wave.open(sys.argv[1],'wb'); w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR); w.writeframes(st.tobytes()); w.close()
print('ok',DUR)
