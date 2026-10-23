"""Bloppit's signature image: every brand asset is made from one drawing, public/art/bloppit-front.svg.

  python3 mobile/scripts/signature.py      (needs: pip install cairosvg pillow)

Makes
  public/art/bloppit-bust.svg        head + the red brick, transparent (headers, greetings, page heads)
  public/art/bloppit-avatar.png      the bust on a blue disc, 512 px, transparent corners (small brand marks)
  public/brand/*                     full figure, bust, profile picture for social accounts
  public/og-image.png                link preview (keeps the existing words, swaps in the signature)
  app icons                          iOS, web/PWA, maskable, apple-touch, favicons
"""
import io, os, re
import cairosvg
from PIL import Image, ImageDraw, ImageFilter

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..'))
P = lambda *a: os.path.join(ROOT, *a)
SRC = P('public', 'art', 'bloppit-front.svg')
BLUE = (3, 105, 189)            # the brand blue used by the icon, og-image and store screenshots
BUST_BOX = (25, 75, 700, 700)   # x, y, w, h inside the 784 × 1168 drawing: ears to just under the brick

svg = open(SRC, encoding='utf-8').read()

# The traced drawing left the whites of the eyes see-through (fine on cream, odd on blue): paint them in underneath.
EYES = ('<g id="eye-whites"><ellipse cx="262" cy="315" rx="37" ry="43" fill="#EEF2F5"/>'
        '<ellipse cx="462" cy="320" rx="41" ry="44" fill="#EEF2F5"/></g>')
if 'id="eye-whites"' not in svg:
    svg = re.sub(r'(<svg[^>]*>)', r'\1\n' + EYES, svg, count=1)
    open(SRC, 'w', encoding='utf-8').write(svg)

def render(svg_text, w, h=None):
    png = cairosvg.svg2png(bytestring=svg_text.encode('utf-8'), output_width=w, output_height=h)
    return Image.open(io.BytesIO(png)).convert('RGBA')

def bust_svg():
    x, y, w, h = BUST_BOX
    out = re.sub(r'<svg([^>]*?)\swidth="784"\s+height="1168"',
                 r'<svg\1 width="%d" height="%d" viewBox="%d %d %d %d"' % (w, h, x, y, w, h), svg, count=1)
    assert out != svg, 'could not set the bust viewBox'
    return out

BUST = bust_svg()

def full(w):
    im = render(svg, w)
    return im.crop(im.getbbox())

def bust(w):
    return render(BUST, w, w)

def badge(size, scale=1.06, drop=0.10, circle=False, glow=True):
    """The bust on brand blue. scale = bust width / tile width; drop pushes it down so the body runs off the bottom."""
    tile = Image.new('RGBA', (size, size), BLUE + (255,))
    if glow:  # a soft light behind the head, like a spotlight on stage
        g = Image.new('L', (size, size), 0); d = ImageDraw.Draw(g)
        r = int(size * .42); cx, cy = size // 2, int(size * .40)
        d.ellipse((cx - r, cy - r, cx + r, cy + r), fill=70)
        g = g.filter(ImageFilter.GaussianBlur(size * .12))
        tile = Image.composite(Image.new('RGBA', (size, size), (80, 160, 230, 255)), tile, g)
    bw = int(size * scale); b = bust(bw)
    x = (size - bw) // 2; y = int(size * drop)
    layer = Image.new('RGBA', (size, size), (0, 0, 0, 0)); layer.paste(b, (x, y), b)  # anything past the edge is cut off
    tile.alpha_composite(layer)
    if circle:
        m = Image.new('L', (size * 4, size * 4), 0); ImageDraw.Draw(m).ellipse((0, 0, size * 4 - 1, size * 4 - 1), fill=255)
        tile.putalpha(m.resize((size, size), Image.LANCZOS))
    return tile

def save(im, *path, rgb=False):
    f = P(*path); os.makedirs(os.path.dirname(f), exist_ok=True)
    (im.convert('RGB') if rgb else im).save(f, optimize=True)
    print('  ', os.path.relpath(f, ROOT), im.size)

def main():
    open(P('public', 'art', 'bloppit-bust.svg'), 'w', encoding='utf-8').write(BUST)
    print('   public/art/bloppit-bust.svg')

    # small brand marks: the whole bust inside the disc, brick included
    save(badge(512, scale=.92, drop=.07, circle=True), 'public', 'art', 'bloppit-avatar.png')
    save(bust(512), 'public', 'art', 'bloppit-bust.png')

    # downloadable brand pack (social profile pictures are cropped to a circle by every network)
    save(full(1600), 'public', 'brand', 'bloppit-signature.png')
    save(bust(1600), 'public', 'brand', 'bloppit-bust.png')
    save(badge(1080, scale=.92, drop=.07), 'public', 'brand', 'bloppit-profile-1080.png', rgb=True)

    # app icons: full bleed, bigger, body runs off the bottom
    icon = badge(1024, scale=.94, drop=.10)
    save(icon, 'public', 'icon-1024.png', rgb=True)
    save(icon, 'mobile', 'assets', 'icon-only.png', rgb=True)
    save(icon, 'mobile', 'ios', 'App', 'App', 'Assets.xcassets', 'AppIcon.appiconset', 'AppIcon-512@2x.png', rgb=True)
    for s, name in ((512, 'icon-512.png'), (192, 'icon-192.png'), (180, 'apple-touch-icon.png')):
        save(icon.resize((s, s), Image.LANCZOS), 'public', name, rgb=True)
    # maskable: Android/PWA crop to as little as the middle 80 % circle
    save(badge(512, scale=.80, drop=.20), 'public', 'icon-maskable-512.png', rgb=True)
    # favicons: tiny, so the face and brick fill the tile
    fav = badge(256, scale=1.12, drop=.04, glow=False)
    save(fav.resize((96, 96), Image.LANCZOS), 'public', 'favicon-96.png', rgb=True)
    fav.convert('RGB').save(P('public', 'favicon.ico'), sizes=[(16, 16), (32, 32), (48, 48)]); print('   public/favicon.ico')

    # og-image: the existing words on the right stay; the signature figure takes the left
    og = Image.open(P('public', 'og-image.png')).convert('RGBA')
    ImageDraw.Draw(og).rectangle((0, 0, 575, 630), fill=BLUE + (255,))
    fig = full(1000); h = 560; fig = fig.resize((int(fig.width * h / fig.height), h), Image.LANCZOS)
    og.alpha_composite(fig, (300 - fig.width // 2 + 20, 630 - h - 30))
    save(og, 'public', 'og-image.png', rgb=True)

if __name__ == '__main__':
    main()
