"""Google Play listing images, made from the App Store ones and the brand drawing.

  python3 mobile/scripts/play-assets.py      (needs: pip install cairosvg pillow fonttools; run from the repo root)

Makes mobile/store/google-play/
  phone-1..7-*.png      the iPhone screenshots widened with brand blue to 1434 × 2868 (Play allows at most 2:1)
  tablet-1..7-*.png     the iPad screenshots as they are (2064 × 2752), for 7" and 10" tablets
  feature-graphic.png   1024 × 500, the otter, the wordmark, World / of / Bricks and the line
  icon-512.png          the app icon at 512 × 512
"""
import glob, io, os, shutil, cairosvg
from fontTools.ttLib import TTFont
from PIL import Image, ImageDraw, ImageFont

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..'))
P = lambda *a: os.path.join(ROOT, *a)
OUT = P('mobile', 'store', 'google-play'); os.makedirs(OUT, exist_ok=True)
BLUE = (3, 105, 189)

def ttf(woff):   # Pillow reads TrueType, the fonts ship as WOFF
    f = TTFont(P('node_modules', '@fontsource', woff)); f.flavor = None; b = io.BytesIO(); f.save(b); b.seek(0); return b
LILITA = ttf('lilita-one/files/lilita-one-latin-400-normal.woff').getvalue()
NUNITO = ttf('nunito/files/nunito-latin-800-normal.woff').getvalue()
font = lambda data, size: ImageFont.truetype(io.BytesIO(data), size)

for f in sorted(glob.glob(P('mobile', 'store', 'screenshots', 'iphone-*.png'))):
    im = Image.open(f).convert('RGB'); w = im.height // 2
    out = Image.new('RGB', (w, im.height), BLUE); out.paste(im, ((w - im.width) // 2, 0))
    out.save(os.path.join(OUT, os.path.basename(f).replace('iphone-', 'phone-')), optimize=True)
for f in sorted(glob.glob(P('mobile', 'store', 'screenshots', 'ipad-*.png'))):
    shutil.copyfile(f, os.path.join(OUT, os.path.basename(f).replace('ipad-', 'tablet-')))

Image.open(P('mobile', 'assets', 'icon-only.png')).convert('RGB').resize((512, 512), Image.LANCZOS).save(os.path.join(OUT, 'icon-512.png'))

# Feature graphic: the otter left, the words right, all of it kept in the middle
W, H = 1024, 500
im = Image.new('RGBA', (W, H), BLUE + (255,)); d = ImageDraw.Draw(im)
svg = open(P('public', 'art', 'bloppit-front.svg'), encoding='utf-8').read()
fig = Image.open(io.BytesIO(cairosvg.svg2png(bytestring=svg.encode(), output_width=1200))).convert('RGBA'); fig = fig.crop(fig.getbbox())
FH = 390; fig = fig.resize((round(fig.width * FH / fig.height), FH), Image.LANCZOS)
lil = font(LILITA, 112); word = 'Bloppit'; wb = lil.getbbox(word)
nb = font(NUNITO, 27); bricks = [('World', (0xf4, 0xbc, 0x22), (0x14, 0x20, 0x22)), ('of', (255, 255, 255), BLUE), ('Bricks', (0xd6, 0x2f, 0x2a), (255, 255, 255))]
BH, PAD, GAP, R = 46, 15, 11, 7
nl = font(NUNITO, 24); line = 'Build it. Grow your world.'; lb = nl.getbbox(line)
textW = max(wb[2] - wb[0], lb[2] - lb[0]); G1, G2 = 18, 20
textH = (wb[3] - wb[1]) + G1 + BH + G2 + (lb[3] - lb[1])
x0 = (W - (fig.width + 56 + textW)) // 2; tx = x0 + fig.width + 56
im.alpha_composite(fig, (x0, (H - FH) // 2 + 8))
ty = (H - textH) // 2
d.text((tx - wb[0], ty - wb[1]), word, font=lil, fill=(255, 255, 255))
by = ty + (wb[3] - wb[1]) + G1; x = tx; cap = nb.getbbox('W'); ch = cap[3] - cap[1]
for t, bg, fg in bricks:
    b = nb.getbbox(t); w = b[2] - b[0]
    d.rounded_rectangle((x, by, x + 2 * PAD + w, by + BH), R, fill=bg)
    d.text((x + PAD - b[0], by + (BH - ch) // 2 - cap[1] - 1), t, font=nb, fill=fg); x += 2 * PAD + w + GAP
d.text((tx - lb[0], by + BH + G2 - lb[1]), line, font=nl, fill=(255, 255, 255))
im.convert('RGB').save(os.path.join(OUT, 'feature-graphic.png'), optimize=True)
print('google play images written to', OUT)
