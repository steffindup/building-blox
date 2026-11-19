import json, math
W,H=28,22
class C:
    def __init__(s,bg): s.g=[[bg]*W for _ in range(H)]
    def px(s,x,y,c):
        if 0<=x<W and 0<=y<H: s.g[y][x]=c
    def rect(s,x0,y0,x1,y1,c):
        for y in range(y0,y1+1):
            for x in range(x0,x1+1): s.px(x,y,c)
    def disc(s,cx,cy,r,c,ry=None):
        ry=ry or r
        for y in range(H):
            for x in range(W):
                if ((x-cx)/r)**2+((y-cy)/ry)**2<=1.0: s.px(x,y,c)
    def rows(s): return [''.join(r) for r in s.g]

P={}
# 1 Castle on the hill
c=C('a')
c.disc(4,3,2,'w',1); c.disc(6,3,2,'w',1); c.disc(21,2,2,'w',1); c.disc(23,2,2,'w',1)
c.disc(24,4,1.5,'y')                                   # sun
c.disc(14,21,18,'g',6); c.disc(3,19,6,'l',3); c.disc(25,19,6,'l',3)   # the hill
c.rect(7,8,20,16,'h')                                  # walls
for x in range(7,21,2): c.px(x,7,'h')                  # battlements
c.rect(5,5,8,16,'d'); c.rect(19,5,22,16,'d')           # towers
for x in (5,7,19,21): c.px(x,4,'d')
c.rect(12,3,15,16,'h'); [c.px(x,2,'h') for x in (12,14)]   # keep
c.px(13,0,'k'); c.px(13,1,'k'); c.rect(14,0,15,0,'r')  # flag on the keep
c.px(6,2,'k'); c.px(6,3,'k'); c.px(7,2,'r')            # flags on the towers
c.px(20,2,'k'); c.px(20,3,'k'); c.px(21,2,'r')
c.rect(6,8,7,9,'n'); c.rect(20,8,21,9,'n'); c.rect(13,6,14,7,'n'); c.rect(10,10,10,11,'n'); c.rect(17,10,17,11,'n')
c.rect(12,12,15,16,'k'); c.rect(13,13,14,16,'z')       # the gate
c.rect(12,17,15,18,'k')                                # drawbridge
c.rect(4,17,11,18,'b'); c.rect(16,17,23,18,'b')        # moat
c.rect(0,19,27,21,'g'); c.rect(0,17,3,18,'g'); c.rect(24,17,27,18,'g')
P['castle']={'name':'Castle on the Hill','blurb':'Towers, flags and a drawbridge over the moat','rows':c.rows()}

# 2 Pirate ship
c=C('a')
c.disc(3,2,2,'w',1); c.disc(5,2,2,'w',1); c.disc(22,3,2.5,'w',1)
c.rect(0,15,27,21,'b')
for y,x0 in ((16,1),(18,6),(20,2),(17,20),(19,17),(21,22)):
    c.rect(x0,y,x0+2,y,'c')
c.rect(13,1,13,14,'k'); c.rect(8,4,8,14,'k'); c.rect(19,5,19,14,'k')        # masts
c.rect(10,2,16,6,'w'); c.rect(10,8,16,11,'w')                               # main sails
c.rect(6,5,10,7,'w'); c.rect(6,9,10,11,'w'); c.rect(17,6,21,8,'w'); c.rect(17,10,21,12,'w')
for y in (7,): c.rect(10,y,16,y,'a')
c.rect(9,4,9,4,'k'); c.rect(13,7,13,7,'k')
c.rect(14,0,16,0,'z'); c.px(15,0,'w')                                       # flag
c.rect(3,13,24,14,'k'); c.rect(4,15,23,15,'k'); c.rect(6,16,21,16,'k')     # hull
c.rect(1,12,4,13,'k'); c.rect(23,11,26,13,'k')                              # bow and stern
c.rect(3,13,24,13,'y')                                                      # gold stripe
for x in (8,12,16,20): c.px(x,15,'z')                                       # cannon ports
c.rect(24,10,25,10,'r')
P['ship']={'name':'Pirate Ship','blurb':'Three masts, white sails and a flag on top','rows':c.rows()}

# 3 Coral reef
c=C('b')
c.rect(0,0,27,2,'c')
for (x,y) in ((4,5),(5,3),(20,6),(21,4),(12,2),(25,8)): c.px(x,y,'a')        # bubbles
c.rect(0,19,27,21,'s'); c.rect(0,18,5,18,'s'); c.rect(20,18,27,18,'s')
c.rect(2,13,2,18,'p'); c.rect(1,14,1,15,'p'); c.rect(3,12,3,14,'p'); c.rect(4,15,4,16,'p')   # pink coral
c.rect(23,12,23,18,'o'); c.rect(22,13,22,15,'o'); c.rect(24,14,24,16,'o'); c.rect(25,11,25,13,'o')
c.rect(8,15,8,18,'v'); c.rect(9,14,9,17,'v'); c.rect(7,16,7,17,'v')
c.rect(17,16,17,18,'l'); c.rect(18,14,18,18,'l'); c.rect(16,15,16,17,'l')
c.rect(12,17,14,18,'h'); c.px(13,16,'h')
# a turtle
c.disc(14,10,3,'g',2); c.rect(12,9,16,11,'k'); c.rect(13,8,15,8,'k'); c.px(18,10,'g'); c.px(17,10,'g'); c.px(11,12,'g'); c.px(17,12,'g'); c.px(11,8,'g'); c.px(17,8,'g'); c.px(18,9,'z')
# fish
c.rect(4,7,6,8,'y'); c.px(3,7,'y'); c.px(3,8,'y'); c.px(6,7,'z')
c.rect(21,9,23,10,'o'); c.px(24,9,'o'); c.px(24,10,'o'); c.px(21,9,'z'); c.rect(22,9,22,10,'w')
c.rect(8,3,10,4,'r'); c.px(11,3,'r'); c.px(11,4,'r'); c.px(8,3,'z')
P['reef']={'name':'Coral Reef','blurb':'A turtle, bright fish and coral on the sand','rows':c.rows()}

# 4 Steam train
c=C('a')
c.disc(25,3,2,'y')
c.disc(13,1,2,'w',1.2); c.disc(10,3,2,'w',1.2); c.disc(7,4,1.5,'w',1)     # smoke
c.disc(6,15,9,'l',4); c.disc(22,15,8,'g',4)                               # hills
c.rect(0,15,27,21,'g')
c.rect(0,18,27,18,'d'); [c.px(x,19,'k') for x in range(0,28,3)]           # rails and sleepers
# the engine
c.rect(1,11,10,16,'r'); c.rect(7,7,10,11,'r'); c.rect(8,8,9,9,'a')       # boiler and cab with window
c.rect(6,6,11,6,'z'); c.rect(3,8,4,10,'z'); c.rect(2,7,5,7,'z')           # roof and chimney
c.rect(1,13,6,13,'y'); c.px(0,15,'y')
c.rect(1,17,2,17,'z'); c.rect(4,16,6,17,'z'); c.rect(8,16,10,17,'z')     # wheels
# carriages
for x0,col in ((12,'b'),(20,'y')):
    c.rect(x0,11,x0+6,16,col); c.rect(x0,10,x0+6,10,'z')
    c.rect(x0+1,12,x0+2,13,'a'); c.rect(x0+4,12,x0+5,13,'a')
    c.rect(x0+1,17,x0+2,17,'z'); c.rect(x0+4,17,x0+5,17,'z')
c.px(11,15,'d'); c.px(19,15,'d')
P['train']={'name':'Steam Train','blurb':'An engine and two carriages over the hills','rows':c.rows()}

# 5 Treehouse
c=C('a')
c.disc(4,3,2,'w',1); c.disc(6,3,2,'w',1)
c.rect(0,19,27,21,'g')
c.rect(13,8,16,19,'k'); c.px(12,19,'k'); c.px(17,19,'k')                 # trunk
c.disc(14,6,11,'g',6); c.disc(8,8,5,'l',3); c.disc(21,7,5,'l',3)        # leaves
c.rect(8,9,20,14,'t'); c.rect(7,8,21,8,'r'); c.rect(9,7,19,7,'r'); c.rect(11,6,17,6,'r')   # hut and roof
c.rect(10,10,12,12,'a'); c.rect(16,10,18,12,'a'); c.rect(13,11,15,14,'k')
c.rect(7,15,21,15,'k')                                                   # platform
for y in range(16,19): c.px(9,y,'y'); c.px(11,y,'y')                    # rope ladder
for y in range(16,19,2): c.px(10,y,'k')
c.px(19,16,'k'); c.px(19,17,'k'); c.rect(18,18,20,18,'k')               # swing
c.px(3,18,'r'); c.px(5,18,'y'); c.px(24,18,'p'); c.px(22,18,'w')        # flowers
P['treehouse']={'name':'Treehouse','blurb':'A hut in the branches, with a ladder and a swing','rows':c.rows()}

# 6 Volcano island
c=C('a')
c.disc(5,2,2,'w',1); c.disc(7,2,2,'w',1)
c.disc(14,3,2,'d',1.5); c.disc(16,1,2,'d',1.2)                           # smoke
c.rect(0,16,27,21,'b')
for y,x0 in ((18,1),(20,6),(19,21),(21,15)): c.rect(x0,y,x0+2,y,'c')
c.disc(14,17,11,'s',2.5)                                                 # beach
for y in range(5,17):                                                    # the volcano
    half=int((y-4)*0.85)+1
    c.rect(14-half,y,13+half,y,'k' if y<12 else 'd')
c.rect(12,5,15,5,'r'); c.rect(13,6,14,9,'o'); c.px(12,7,'o'); c.px(15,8,'o'); c.px(14,10,'r'); c.px(11,9,'r')   # lava
# palm trees
for x0 in (3,24):
    c.rect(x0,11,x0,15,'k'); c.rect(x0-2,10,x0+2,10,'g'); c.px(x0-3,11,'g'); c.px(x0+3,11,'g'); c.px(x0,9,'g')
P['volcano']={'name':'Volcano Island','blurb':'A smoking volcano, a beach and palm trees','rows':c.rows()}

for k,v in P.items(): assert len(v['rows'])==H and all(len(r)==W for r in v['rows']), k
json.dump(P,open('mega.json','w'),indent=0)
print('ok')
