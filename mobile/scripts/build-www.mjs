// Packages the web app (public/game/index.html) into mobile/www for the iPhone/iPad app.
// Everything the app needs is bundled so it works offline: three.js and the fonts come from
// node_modules instead of a CDN or Google Fonts. Play together still needs the internet (bloppit.com/api/room).
// Run: cd mobile && npm run build   (or `npm run sync` to also copy into the iOS project)
import { readFileSync, writeFileSync, mkdirSync, rmSync, copyFileSync, cpSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const mobile = join(here, '..'), root = join(mobile, '..'), www = join(mobile, 'www'), nm = join(mobile, 'node_modules');

rmSync(www, { recursive: true, force: true });
mkdirSync(join(www, 'vendor', 'fonts'), { recursive: true });
// Character art (public/art): the build buddy, the Gulls and the launch screen load it by relative path.
cpSync(join(root, 'public', 'art'), join(www, 'art'), { recursive: true });
// The How to play video (public/video): played from the menu and the first builds.
cpSync(join(root, 'public', 'video'), join(www, 'video'), { recursive: true, filter: (f) => !/moonstone-feature\.mp4$/.test(f) });   // the full Moonstone film streams from bloppit.com instead (49 MB)
// The launch screen's trademark sound (public/sound): the boys saying "Bloppit" as Bloppit winks.
cpSync(join(root, 'public', 'sound'), join(www, 'sound'), { recursive: true });
// The 3D characters (public/3d): models, the glTF/Draco loaders and the decoder, loaded on first need.
cpSync(join(root, 'public', '3d'), join(www, '3d'), { recursive: true });

// three.js r128, the same version the website loads from the CDN.
const three = { 'three.min.js': 'three/build/three.min.js',
  'OrbitControls.js': 'three/examples/js/controls/OrbitControls.js',
  'BufferGeometryUtils.js': 'three/examples/js/utils/BufferGeometryUtils.js' };
for (const [to, from] of Object.entries(three)) copyFileSync(join(nm, from), join(www, 'vendor', to));

// Fonts: Lilita One, Nunito 400-800, JetBrains Mono 500 (Latin), from @fontsource.
const fonts = [['Lilita One', 'lilita-one', 400], ['JetBrains Mono', 'jetbrains-mono', 500],
  ...[400, 600, 700, 800].map((w) => ['Nunito', 'nunito', w])];
let css = '';
for (const [family, pkg, w] of fonts) {
  const file = `${pkg}-latin-${w}-normal.woff2`;
  copyFileSync(join(nm, '@fontsource', pkg, 'files', file), join(www, 'vendor', 'fonts', file));
  css += `@font-face{font-family:"${family}";font-style:normal;font-weight:${w};font-display:swap;src:url(fonts/${file}) format("woff2")}\n`;
}
writeFileSync(join(www, 'vendor', 'fonts.css'), css);

// The website's About us, How it works, FAQ and Privacy pages, bundled so the app shows them in its own reader
// (no grown-ups gate, works offline). Website-only head bits and the site header go; links point at the bundled copies.
// The app's link handler (see "App Store app" in public/game/index.html) routes the links inside them.
const PAGES = ['about', 'how-it-works', 'faq', 'privacy'];
// In the app these pages look like the game around them (Steff, 7 Nov 2026): the game's blue-grey desk, white cards
// with a thin line, no brick dots, no site header or footer, and no Play Bloppit (the reader's Close goes back to the game).
const APP_PAGE_CSS = '.skip,body>header,body>footer,.cta{display:none!important}'
  + 'body{background:#E4EAF2!important;background-image:none!important;font-size:16px}'
  + '.card,details{background:#fff;border:1px solid #C9D4E1;box-shadow:none;border-radius:16px}'
  + '.page-head{padding-block:24px 16px}.page-head img{width:64px;height:64px}main{padding-bottom:32px}'
  + '.note,.mode{background:#D6E5F5}a{color:#14202C}'
  + '@media (prefers-color-scheme:dark){body{background:#0D141C!important;color:#E6EDF5}.card,details{background:#16212C;border-color:#2A3949;color:#E6EDF5}.note,.mode{background:#1B2F46}a{color:#E6EDF5}}';
mkdirSync(join(www, 'pages'), { recursive: true });
copyFileSync(join(root, 'public', 'site.css'), join(www, 'pages', 'site.css'));
for (const page of PAGES) {
  let p = readFileSync(join(root, 'public', page, 'index.html'), 'utf8');
  p = p.replace(/<link rel="(canonical|icon|apple-touch-icon|manifest|preconnect)"[^>]*>\n/g, '')
    .replace(/<meta (property|name)="(og|twitter):[^>]*>\n/g, '')
    .replace(/<link rel="stylesheet" href="https:\/\/fonts\.googleapis\.com[^>]*>/, '<link rel="stylesheet" href="../vendor/fonts.css">')
    .replace('<link rel="stylesheet" href="/site.css">', '<link rel="stylesheet" href="site.css">\n<style>' + APP_PAGE_CSS + '</style>')
    .replace(/(src|poster)="\/(art|video)\//g, '$1="../$2/')
    .replace(new RegExp(`href="/(${PAGES.join('|')})/"`, 'g'), 'href="$1.html"');
  // In the app the FAQ shouldn't say the app is on its way: whoever reads it is already in it.
  if (page === 'faq') p = p.replace('Bloppit for iPhone and iPad is on its way to the App Store.', 'You’re playing the iPhone and iPad app. Bloppit also plays in any web browser at bloppit.com/game.');
  if (/https:\/\/(cdn|fonts)\./.test(p) || /(href|src)="\/(site\.css|art|video)/.test(p)) throw new Error(`build-www: pages/${page}.html still points at the website`);
  writeFileSync(join(www, 'pages', `${page}.html`), p);
}

let html = readFileSync(join(root, 'public', 'game', 'index.html'), 'utf8');
const swap = (from, to) => {
  if (!html.includes(from)) throw new Error(`build-www: couldn't find ${from.slice(0, 80)} in public/game/index.html`);
  html = html.replace(from, to);
};
swap('<script src="https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js"></script>', '<script src="vendor/three.min.js"></script>');
swap('<script src="https://cdn.jsdelivr.net/npm/three@0.128.0/examples/js/controls/OrbitControls.js"></script>', '<script src="vendor/OrbitControls.js"></script>');
swap('<script src="https://cdn.jsdelivr.net/npm/three@0.128.0/examples/js/utils/BufferGeometryUtils.js"></script>', '<script src="vendor/BufferGeometryUtils.js"></script>');
swap('<link rel="preconnect" href="https://fonts.googleapis.com">\n', '');
html = html.replace(/<link rel="stylesheet" href="https:\/\/fonts\.googleapis\.com[^>]*>/, '<link rel="stylesheet" href="vendor/fonts.css">');
// Website-only bits the app doesn't need (search, share previews, web manifest).
html = html.replace(/<link rel="(canonical|manifest|apple-touch-icon|icon)"[^>]*>\n/g, '')
  .replace(/<script type="application\/ld\+json">[\s\S]*?<\/script>\n/, '');
// Switch on app mode (see "App Store app" at the top of the main script). It goes first in <body> so the
// launch screen script, which runs before everything else and only shows in the app, can see it.
swap('<body>\n', '<body>\n<script>window.BLOPPIT_APP=true;</script>\n');

html = html.replace(/src="\/art\//g, 'src="art/');
html = html.replace(/url\('\/art\//g, "url('art/");   // drawn icons that use the friends' faces (CSS)
html = html.replace(/(src|poster)="\/video\//g, '$1="video/');
if (/https:\/\/(cdn|fonts)\./.test(html)) throw new Error('build-www: the app still loads something from a CDN');
writeFileSync(join(www, 'index.html'), html);
console.log(`build-www: wrote ${join('mobile', 'www')} (index.html ${(html.length / 1024).toFixed(0)} KB, three.js and ${fonts.length} fonts bundled)`);
