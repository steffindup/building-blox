# Composes the App Store screenshots: a raw capture from tests/store-screens.mjs, framed on Bloppit blue with a caption
# in Lilita One. Run after the capture:  python3 tests/store-compose.py
# Needs Pillow and fontTools (to read the @fontsource woff). Output: mobile/store/screenshots/{iphone,ipad}-N-name.png
import os, io
from PIL import Image, ImageDraw, ImageFont, ImageFilter
from fontTools.ttLib import TTFont

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
RAW = os.path.join(ROOT, 'mobile/store/screenshots/raw')
OUT = os.path.join(ROOT, 'mobile/store/screenshots')
BLUE, SHADOW = (3, 105, 189), (2, 80, 150)

# the order and captions in mobile/store/listing.md
SHOTS = [('island', 'Every build you finish grows Bloppitopia.'),
         ('arrival', 'A little otter is coming home.'),
         ('build', 'Snap bricks into place, page by page.'),
         ('finish', 'Finish clean. Earn three stars.'),
         ('weekly', 'A new puzzle every week. See how many built it clean.'),
         ('blitz', 'Race the Longtails in Blitz.'),
         ('menu', 'Your otter grows with every build.')]
# canvas, frame left edge, frame top, caption size, caption width: measured from the first set
DEV = {'iphone': dict(size=(1320, 2868), left=136, top=520, font=104, width=1120, radius=48),
       'ipad': dict(size=(2064, 2752), left=184, top=421, font=128, width=1760, radius=40)}

def font(px):
    f = TTFont(os.path.join(ROOT, 'node_modules/@fontsource/lilita-one/files/lilita-one-latin-400-normal.woff'))
    f.flavor = None; b = io.BytesIO(); f.save(b); b.seek(0)
    return ImageFont.truetype(b, px)

def wrap(draw, text, fnt, width):
    lines, cur = [], ''
    for w in text.split():
        t = (cur + ' ' + w).strip()
        if draw.textlength(t, font=fnt) <= width or not cur: cur = t
        else: lines.append(cur); cur = w
    return lines + [cur]

for dev, d in DEV.items():
    W, H = d['size']; fnt = font(d['font'])
    for i, (name, cap) in enumerate(SHOTS, 1):
        src = os.path.join(RAW, f'{dev}-{name}.png')
        if not os.path.exists(src): print('missing', src); continue
        shot = Image.open(src).convert('RGB'); fw = W - 2 * d['left']; fh = round(shot.height * fw / shot.width)
        shot = shot.resize((fw, fh), Image.LANCZOS)
        im = Image.new('RGB', (W, H), BLUE); dr = ImageDraw.Draw(im)
        # the frame: rounded, with a solid darker-blue edge below it
        mask = Image.new('L', (fw, fh), 0); ImageDraw.Draw(mask).rounded_rectangle((0, 0, fw - 1, fh - 1), d['radius'], fill=255)
        dr.rounded_rectangle((d['left'], d['top'] + 16, d['left'] + fw - 1, d['top'] + fh - 1 + 16), d['radius'], fill=SHADOW)
        im.paste(shot, (d['left'], d['top']), mask)
        # the caption, centred in the space above the frame
        lines = wrap(dr, cap, fnt, d['width']); lh = round(d['font'] * 1.0); total = lh * len(lines)
        y = (d['top'] - total) / 2 - d['font'] * .08
        for ln in lines:
            w = dr.textlength(ln, font=fnt); dr.text(((W - w) / 2, y), ln, font=fnt, fill=(255, 255, 255)); y += lh
        im.save(os.path.join(OUT, f'{dev}-{i}-{name}.png'), optimize=True)
        print(dev, i, name, f'{fw}x{fh}', len(lines), 'lines')
