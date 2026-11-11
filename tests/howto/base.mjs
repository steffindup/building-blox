import { start } from '../devserver.mjs';
import { chromium } from 'playwright';
import fs from 'node:fs'; import path from 'node:path';
export const PORT = +(process.env.PORT||8793);
const FONTS=new URL('../../node_modules/@fontsource', import.meta.url).pathname;
const FONT_CSS=[['Lilita One','lilita-one/files/lilita-one-latin-400-normal.woff2',400],['Nunito','nunito/files/nunito-latin-400-normal.woff2',400],['Nunito','nunito/files/nunito-latin-600-normal.woff2',600],['Nunito','nunito/files/nunito-latin-700-normal.woff2',700],['Nunito','nunito/files/nunito-latin-800-normal.woff2',800]]
  .map(([fam,file,w])=>`@font-face{font-family:'${fam}';font-weight:${w};font-display:block;src:url(http://fonts.local/${file}) format('woff2')}`).join('');
export async function boot({dsf=2, query='?nosplash=1&hour=11&films=0', lite=false}={}){
  const server = await start(PORT);
  const browser = await chromium.launch({ executablePath: process.env.PLAYWRIGHT_CHROMIUM || '/opt/pw-browsers/chromium-1243/real/chrome-linux64/chrome', args:['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist'] });
  const ctx = await browser.newContext({ viewport:{width:393,height:851}, deviceScaleFactor:dsf, isMobile:true, hasTouch:true });
  await ctx.route('**/*', async (r) => { const u = r.request().url(), f = ['three.min.js','OrbitControls.js','BufferGeometryUtils.js'].find((k) => u.endsWith(k));
    if (f && !u.includes('/vendor/')) return r.fulfill({ status: 302, headers: { location: `http://localhost:${PORT}/vendor/${f}` } });
    if (/fonts\.googleapis\.com/.test(u)) return r.fulfill({status:200,contentType:'text/css',body:FONT_CSS});
    const m=u.match(/^http:\/\/fonts\.local\/(.+)$/); if (m) return r.fulfill({status:200,contentType:'font/woff2',body:fs.readFileSync(path.join(FONTS,m[1]))});
    if (!u.startsWith(`http://localhost:${PORT}/`)) return r.fulfill({ status: 200, body: '', contentType: 'text/plain' });
    return r.continue(); });
  const page = await ctx.newPage(); const errors=[]; page.on('pageerror',e=>errors.push(e.message)); page.setDefaultTimeout(120000);
  return { server, browser, ctx, page, errors, url:`http://localhost:${PORT}/game/${query}${lite?'&lite3d=1':''}`, close: async()=>{ await browser.close(); server.close&&server.close(); } };
}
