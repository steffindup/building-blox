// Packages the web app (public/build/index.html) into mobile/www for the iPhone/iPad app.
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
cpSync(join(root, 'public', 'video'), join(www, 'video'), { recursive: true });
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

let html = readFileSync(join(root, 'public', 'build', 'index.html'), 'utf8');
const swap = (from, to) => {
  if (!html.includes(from)) throw new Error(`build-www: couldn't find ${from.slice(0, 80)} in public/build/index.html`);
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
html = html.replace(/(src|poster)="\/video\//g, '$1="video/');
if (/https:\/\/(cdn|fonts)\./.test(html)) throw new Error('build-www: the app still loads something from a CDN');
writeFileSync(join(www, 'index.html'), html);
console.log(`build-www: wrote ${join('mobile', 'www')} (index.html ${(html.length / 1024).toFixed(0)} KB, three.js and ${fonts.length} fonts bundled)`);
