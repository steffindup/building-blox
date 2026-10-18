// Captures raw screens for the App Store at iPhone 6.9" (440×956 @3x) and iPad 13" (1032×1376 @2x)
import { chromium } from 'playwright';
import fs from 'node:fs';
import path from 'node:path'; import { fileURLToPath } from 'node:url';
const OUT=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'../mobile/store/screenshots/raw/')+'/'; fs.mkdirSync(OUT,{recursive:true});
const FONTS=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'../node_modules/@fontsource');
const FONT_CSS=[['Lilita One','lilita-one/files/lilita-one-latin-400-normal.woff2',400],['Nunito','nunito/files/nunito-latin-400-normal.woff2',400],['Nunito','nunito/files/nunito-latin-700-normal.woff2',700],['Nunito','nunito/files/nunito-latin-800-normal.woff2',800]]
  .map(([fam,file,w])=>`@font-face{font-family:'${fam}';font-weight:${w};font-display:block;src:url(http://fonts.local/${file}) format('woff2')}`).join('');
const b = await chromium.launch({ executablePath: process.env.PLAYWRIGHT_CHROMIUM || undefined, args: ['--use-gl=swiftshader'] });
const auto = async (p,n)=>{ for(let i=0;i<n;i++){ await p.evaluate(()=>document.getElementById('autoBtn')?.click()); await p.waitForTimeout(1100); } };
for (const [tag, vp, dsf] of [['iphone',{width:440,height:956},3],['ipad',{width:1032,height:1376},2]]) {
  const ctx = await b.newContext({ viewport: vp, deviceScaleFactor: dsf, isMobile: true, hasTouch: true });
  await ctx.route('**/*', r => { const u=r.request().url(); if (/three\.min|OrbitControls|BufferGeometryUtils/.test(u) && !u.includes('/vendor/')) return r.fulfill({status:302,headers:{location:'http://localhost:8788/vendor/'+u.split('/').pop()}});
    // The app's fonts (Lilita One, Nunito) from the @fontsource packages, so the screenshots match the real thing offline
    if (/fonts\.googleapis\.com/.test(u)) return r.fulfill({status:200,contentType:'text/css',body:FONT_CSS});
    const f=u.match(/^http:\/\/fonts\.local\/(.+)$/); if (f) return r.fulfill({status:200,contentType:'font/woff2',body:fs.readFileSync(path.join(FONTS,f[1]))});
    r.continue(); });
  const page = await ctx.newPage(); page.setDefaultTimeout(180000); page.on('pageerror', e => console.log('ERR', e.message));
  await page.goto('http://localhost:8788/build/?nosplash=1&hour=11',   // late morning, whatever the clock says
    { waitUntil: 'load' }); await page.waitForTimeout(3500);
  // first visit: a little boat brings the otter to Home Island; pick a name (Pebble, blue brick)
  await page.evaluate(() => document.getElementById('hmCont').click());
  // the arrival film: jump to the boat on its way in (caption showing), take the frame, then Skip
  await page.waitForFunction(() => window.bloppitIsland3 && window.bloppitIsland3().cine, null, { timeout: 30000, polling: 50 });
  await page.evaluate(() => { const A = window.bloppitIsland3().cine; Object.defineProperty(A, 't0', { get: () => performance.now() - 7000, set() {}, configurable: true }); }); await page.waitForTimeout(2600);   // held at 7 s
  await page.screenshot({ path: `${OUT}${tag}-arrival.png` });
  await page.evaluate(() => document.querySelector('.is3-cine .cn-skip').click());
  await page.waitForFunction(() => document.getElementById('pupDlg').open, null, { timeout: 20000 }); await page.waitForTimeout(600);
  await page.screenshot({ path: `${OUT}${tag}-meet.png` });
  await page.evaluate(() => { document.getElementById('pupPickT').click(); document.querySelector('#pupNames [data-pup="0"]').click(); document.getElementById('pupLater').click(); }); await page.waitForTimeout(2500);
  // Build Our First Home → the build → back home, where the cottage appears
  await page.evaluate(() => document.querySelector('#isWorld .is3-play').click()); await page.waitForTimeout(1500);
  await auto(page,5); await page.waitForTimeout(400); await page.screenshot({ path: `${OUT}${tag}-build.png` });
  for(let i=0;i<20;i++){ await auto(page,1); if(await page.evaluate(()=>/You built your home/.test(document.querySelector('#isWorld .is3-banner')?.textContent||''))) break; }
  await page.waitForTimeout(1200);
  await page.waitForTimeout(4000); await page.evaluate(() => document.querySelector('#isWorld .is3-play').click()); await page.waitForTimeout(1500);
  // play next through a few Trail levels for real thumbnails
  let shotFinish = false;
  for (let k=0;k<6;k++){ if (k) { await page.evaluate(() => document.getElementById('budNext')?.click()); await page.waitForTimeout(1500); }
    for (let i=0;i<60;i++){ await auto(page,1); if (await page.evaluate(()=>/Every step complete/.test(document.getElementById('status').textContent))) break; }
    // the finish card (stars, See Bloppitopia, Play next): wait for it to open, take the first one
    const won = await page.waitForFunction(() => document.getElementById('winDlg').open, null, { timeout: 12000 }).then(() => true, () => false);
    if (won && !shotFinish) { await page.waitForTimeout(1500); await page.screenshot({ path: `${OUT}${tag}-finish.png` }); shotFinish = true; }
    await page.evaluate(() => document.getElementById('winDlg').close()); await page.waitForTimeout(500);
    // a newly found island plays its reveal on the island; Play next from there starts the next level
    if (await page.evaluate(() => !document.getElementById('view-island').hidden)) { await page.waitForTimeout(6000); await page.evaluate(() => document.querySelector('#isWorld .is3-play')?.click()); await page.waitForTimeout(1500); } }
  // grow the world from the real builds (no placeholders): four Blitz wins on real models, Brain Trail and Weekly progress
  await page.evaluate(() => { const o=JSON.parse(localStorage.getItem('bloppit-world-v1')), t=JSON.parse(localStorage.getItem('bloppit-thumbs-v1'));
    const real=o.log.filter(k=>k.startsWith('m:')&&t[k]);
    for (let i=0;i<4;i++){ const src=real[(i+1)%real.length], [,name,n]=src.split(':'), k=`m:${name}:${+n+100+i}`; o.builds[k]={...o.builds[src],k:'blitz',lv:2,t:Date.now()-i*36e5}; o.log.push(k); t[k]=t[src]; }
    o.pick='lighthouse'; o.wear={neck:['scarf',4],head:['beanie',1]}; o.wearAt=Date.now();
    for (const k of Object.keys(localStorage)) if (k.startsWith('bloppit-seen3')) localStorage.removeItem(k);   // no reveal parade for the still
    o.decor=['flag','campfire','bench','lantern','palm','kite']; o.free=['flag','campfire','bench','lantern','palm','kite']; localStorage.setItem('bloppit-world-v1',JSON.stringify(o)); localStorage.setItem('bloppit-thumbs-v1',JSON.stringify(t));
    for (const k of Object.keys(localStorage)) if (k.includes('building-blox-game-v1')) { const g=JSON.parse(localStorage.getItem(k)); const b=Object.values(g.best||{})[0]; if(b){ g.bbest={0:b,1:b,2:b}; } localStorage.setItem(k,JSON.stringify(g)); }
    for (const k of Object.keys(localStorage)) if (k.includes('bloppit-weekly-v1')) { const w=JSON.parse(localStorage.getItem(k)); w.total=4; localStorage.setItem(k,JSON.stringify(w)); }
    if (!Object.keys(localStorage).some(k=>k.includes('bloppit-weekly-v1'))) localStorage.setItem('bloppit-weekly-v1',JSON.stringify({weeks:{},total:4})); });
  await page.reload({ waitUntil: 'load' }); await page.waitForTimeout(3500);
  await page.evaluate(() => document.getElementById('tab-island').click()); await page.waitForTimeout(3500);
  await page.screenshot({ path: `${OUT}${tag}-island.png` });
  await page.evaluate(() => document.getElementById('tab-daily').click()); await page.waitForTimeout(1200); await page.screenshot({ path: `${OUT}${tag}-weekly.png` });
  await page.evaluate(() => { window.bloppitHome(); }); await page.waitForTimeout(400); await page.evaluate(() => document.querySelector('[data-go="cpu"]').click()); await page.waitForTimeout(600);
  await page.evaluate(() => { document.getElementById('bzHard').click(); document.getElementById('bzName').value='Pebble'; document.getElementById('bzCpuGo').click(); }); await page.waitForTimeout(4500);
  await page.screenshot({ path: `${OUT}${tag}-blitz.png` });
  await page.evaluate(() => { window.bloppitHome(); }); await page.waitForTimeout(600); await page.screenshot({ path: `${OUT}${tag}-menu.png` });
  await ctx.close(); console.log(tag,'done');
}
await b.close();
