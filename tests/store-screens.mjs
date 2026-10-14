// Captures raw screens for the App Store at iPhone 6.9" (440×956 @3x) and iPad 13" (1032×1376 @2x)
import { chromium } from 'playwright';
import fs from 'node:fs';
import path from 'node:path'; import { fileURLToPath } from 'node:url';
const OUT=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'../mobile/store/screenshots/raw/')+'/'; fs.mkdirSync(OUT,{recursive:true});
const b = await chromium.launch({ executablePath: process.env.PLAYWRIGHT_CHROMIUM || undefined, args: ['--use-gl=swiftshader'] });
const auto = async (p,n)=>{ for(let i=0;i<n;i++){ await p.evaluate(()=>document.getElementById('autoBtn')?.click()); await p.waitForTimeout(1100); } };
for (const [tag, vp, dsf] of [['iphone',{width:440,height:956},3],['ipad',{width:1032,height:1376},2]]) {
  const ctx = await b.newContext({ viewport: vp, deviceScaleFactor: dsf, isMobile: true, hasTouch: true });
  await ctx.route('**/*', r => { const u=r.request().url(); if (/three\.min|OrbitControls|BufferGeometryUtils/.test(u) && !u.includes('/vendor/')) return r.fulfill({status:302,headers:{location:'http://localhost:8788/vendor/'+u.split('/').pop()}}); r.continue(); });
  const page = await ctx.newPage(); page.on('pageerror', e => console.log('ERR', e.message));
  await page.goto('http://localhost:8788/build/?nosplash=1', { waitUntil: 'load' }); await page.waitForTimeout(3500);
  // first build → the finish card
  await page.evaluate(() => document.getElementById('hmCont').click()); await page.waitForTimeout(1500);
  await auto(page,3); await page.waitForTimeout(400); await page.screenshot({ path: `${OUT}${tag}-build.png` });
  await auto(page,4); for(let i=0;i<20;i++){ if(await page.evaluate(()=>document.getElementById('welcomeDlg').open)) break; await page.waitForTimeout(500); } await page.waitForTimeout(600); await page.evaluate(() => document.querySelector('#wcNames [data-pup="0"]').click()); await page.waitForTimeout(600);
  await page.screenshot({ path: `${OUT}${tag}-finish.png` });
  await page.evaluate(() => document.getElementById('welcomeDlg').close());
  // play next through a few Trail levels for real thumbnails
  for (let k=0;k<3;k++){ await page.evaluate(() => document.getElementById('budNext')?.click()); await page.waitForTimeout(1500);
    for (let i=0;i<60;i++){ await auto(page,1); if (await page.evaluate(()=>/Every step complete/.test(document.getElementById('status').textContent))) break; }
    await page.waitForTimeout(3500); await page.evaluate(() => document.getElementById('winDlg').close()); await page.waitForTimeout(500); }
  // seed the island to the village with the real thumbs reused
  await page.evaluate(() => { const o=JSON.parse(localStorage.getItem('bloppit-world-v1')), t=JSON.parse(localStorage.getItem('bloppit-thumbs-v1')), keys=Object.keys(t);
    for (let i=0;i<9;i++){ const src=keys[i%keys.length], k=`m:Extra${i}:${12+i}`; o.builds[k]={n:12+i,s:(i%3)+1,t:1e12+i,c:1}; o.log.push(k); t[k]=t[src]; }
    o.decor=['flag','campfire','bench','lantern','palm','kite']; o.free=['flag','campfire','bench','lantern','palm','kite']; localStorage.setItem('bloppit-world-v1',JSON.stringify(o)); localStorage.setItem('bloppit-thumbs-v1',JSON.stringify(t)); });
  await page.evaluate(() => document.getElementById('tab-island').click()); await page.waitForTimeout(1500);
  await page.screenshot({ path: `${OUT}${tag}-island.png` });
  await page.evaluate(() => document.getElementById('tab-daily').click()); await page.waitForTimeout(1200); await page.screenshot({ path: `${OUT}${tag}-weekly.png` });
  await page.evaluate(() => { window.bloppitHome(); }); await page.waitForTimeout(400); await page.evaluate(() => document.querySelector('[data-go="cpu"]').click()); await page.waitForTimeout(600);
  await page.evaluate(() => { document.getElementById('bzHard').click(); document.getElementById('bzName').value='Elmar'; document.getElementById('bzCpuGo').click(); }); await page.waitForTimeout(4500);
  await page.screenshot({ path: `${OUT}${tag}-blitz.png` });
  await page.evaluate(() => { window.bloppitHome(); }); await page.waitForTimeout(600); await page.screenshot({ path: `${OUT}${tag}-menu.png` });
  await ctx.close(); console.log(tag,'done');
}
await b.close();
