"""Android adaptive launcher icon: Bloppit's bust (public/art/bloppit-bust.svg) on brand blue.

  python3 mobile/scripts/android-icons.py      (needs: pip install cairosvg pillow)

Android draws the icon as two layers, 108 dp square; launchers mask it to a circle, squircle or rounded square
showing about the middle 72 dp (66 dp is always safe). The bust sits inside that, a little low so the brick shows,
like the iOS icon. The background layer is the brand blue (values/ic_launcher_background.xml).
`npx capacitor-assets generate --android` makes the legacy icons and the launch screens; run this after it.
"""
import io, os, cairosvg
from PIL import Image

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..'))
RES = os.path.join(ROOT, 'mobile', 'android', 'app', 'src', 'main', 'res')
svg = open(os.path.join(ROOT, 'public', 'art', 'bloppit-bust.svg'), encoding='utf-8').read()
SIZES = {'mdpi': 108, 'hdpi': 162, 'xhdpi': 216, 'xxhdpi': 324, 'xxxhdpi': 432}
SCALE, DROP = 0.56, 0.03      # bust width as a share of the 108 dp layer; push down (share of the layer)

for dens, px in SIZES.items():
    w = round(px * SCALE)
    bust = Image.open(io.BytesIO(cairosvg.svg2png(bytestring=svg.encode(), output_width=w * 2))).convert('RGBA')
    bust = bust.resize((w, round(bust.height * w / bust.width)), Image.LANCZOS)
    layer = Image.new('RGBA', (px, px), (0, 0, 0, 0))
    layer.alpha_composite(bust, ((px - bust.width) // 2, (px - bust.height) // 2 + round(px * DROP)))
    layer.save(os.path.join(RES, f'mipmap-{dens}', 'ic_launcher_foreground.png'), optimize=True)

open(os.path.join(RES, 'values', 'ic_launcher_background.xml'), 'w').write(
    '<?xml version="1.0" encoding="utf-8"?>\n<resources>\n    <color name="ic_launcher_background">#0369BD</color>\n</resources>\n')
print('android adaptive icons written')
