"""The splash wink: public/art/bloppit-wink.jpg, a 2700 × 300 strip of nine 300 × 300 frames.

  python3 mobile/scripts/splash-wink.py      (needs: pip install cairosvg pillow)

Every frame is the app icon (signature bust, icon framing, brand blue). Only Bloppit's left eye (the one on the
viewer's right) changes: open, closing, closed (a curved closed-eye arc), reopening. The frame order matches the
sp-wink keyframes in public/index.html and public/build/index.html, so no CSS changes are needed.
"""
import os, sys
from PIL import Image, ImageDraw

sys.path.insert(0, os.path.dirname(__file__))
import signature as sig

R = 1400                 # work on a big bust, then shrink: smooth edges for free
K = R / sig.BUST_BOX[2]  # drawing units → pixels
# Bloppit's left eye in the drawing's units, tall enough to take the thick dark line over the top of the eye too.
EX, EY, ERX, ERY = (462 - sig.BUST_BOX[0]) * K, (318 - sig.BUST_BOX[1]) * K, 48 * K, 56 * K
FUR = (160, 105, 59, 255)
INK = (49, 33, 22, 255)
LIDS = [0, .35, .75, 1, 1, 1, .75, .35, 0]   # how far the lid is down in each frame (keyframes hold 2–6 longest)

def ell_mask(size):
    m = Image.new('L', size, 0)
    ImageDraw.Draw(m).ellipse((EX - ERX, EY - ERY, EX + ERX, EY + ERY), fill=255)
    return m

def curve(y0, y1, n=40):
    """Points along a gentle arc from the eye's left edge to its right: y0 at the ends, y1 in the middle."""
    pts = []
    for i in range(n + 1):
        u = i / n; x = EX - ERX * .92 + 2 * ERX * .92 * u
        pts.append((x, y0 + (y1 - y0) * (1 - (2 * u - 1) ** 2)))
    return pts

def face(lid):
    b = sig.bust(R)
    if lid <= 0:
        return b
    eye = ell_mask(b.size)
    top, bot = EY - ERY, EY + ERY
    if lid >= 1:  # closed: fur over the whole eye, then a happy closed-eye arc
        b.paste(Image.new('RGBA', b.size, FUR), (0, 0), eye)
        d = ImageDraw.Draw(b)
        arc = curve(EY + 9 * K, EY - 4 * K)
        d.line(arc, fill=INK, width=int(9 * K), joint='curve')
        for p in (arc[0], arc[-1]):  # round the ends
            r = 4.5 * K; d.ellipse((p[0] - r, p[1] - r, p[0] + r, p[1] + r), fill=INK)
        return b
    # partly shut: the upper lid comes down as a curved edge, fur above it, a dark lid line along it
    y = top + (bot - top) * lid
    edge = curve(y - 6 * K, y + 6 * K)
    lidm = Image.new('L', b.size, 0)
    ImageDraw.Draw(lidm).polygon([(EX - ERX - 10, top - 10)] + [(EX - ERX - 10, edge[0][1])] + edge
                                 + [(EX + ERX + 10, edge[-1][1]), (EX + ERX + 10, top - 10)], fill=255)
    lidm = Image.composite(lidm, Image.new('L', b.size, 0), eye)
    b.paste(Image.new('RGBA', b.size, FUR), (0, 0), lidm)
    clip = Image.new('RGBA', b.size, (0, 0, 0, 0)); ImageDraw.Draw(clip).line(edge, fill=INK, width=int(7 * K), joint='curve')
    b.paste(clip, (0, 0), Image.composite(clip.getchannel('A'), Image.new('L', b.size, 0), eye))
    return b

def main():
    strip = Image.new('RGB', (300 * len(LIDS), 300))
    cache = {}
    for i, lid in enumerate(LIDS):
        if lid not in cache:
            cache[lid] = sig.badge(300, face=face(lid), **sig.ICON).convert('RGB')
        strip.paste(cache[lid], (300 * i, 0))
    out = sig.P('public', 'art', 'bloppit-wink.jpg')
    strip.save(out, quality=88, optimize=True, progressive=True)
    print('  ', os.path.relpath(out, sig.ROOT), strip.size, os.path.getsize(out), 'bytes')

if __name__ == '__main__':
    main()
