import { start } from './tests/devserver.mjs';
import { chromium } from 'playwright';
import fs from 'node:fs'; import path from 'node:path';
const PORT=8793, OUT='/home/claude/pwf/shots';
const FONTS='node_modules/@fontsource';
const FONT_CSS=[['Lilita One','lilita-one/files/lilita-one-latin-400-normal.woff2',400],['Nunito','nunito/files/nunito-latin-400-normal.woff2',400],['Nunito','nunito/files/nunito-latin-600-normal.woff2',600],['Nunito','nunito/files/nunito-latin-700-normal.woff2',700],['Nunito','nunito/files/nunito-latin-800-normal.woff2',800]].map(([fam,file,w])=>`@font-face{font-family:'${fam}';font-weight:${w};font-display:block;src:url(http://fonts.local/${file}) format('woff2')}`).join('');
export async function setup(){
  const server=await start(PORT);
  const browser=await chromium.launch({executablePath:process.env.PLAYWRIGHT_CHROMIUM,args:['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist']});
  const open=async(extra='')=>{ const ctx=await browser.newContext({viewport:{width:393,height:851},deviceScaleFactor:+(process.env.DSF||2),isMobile:true,hasTouch:true});
    await ctx.route('**/*',async(r)=>{const u=r.request().url(),f=['three.min.js','OrbitControls.js','BufferGeometryUtils.js'].find(k=>u.endsWith(k));
      if(f&&!u.includes('/vendor/')) return r.fulfill({status:302,headers:{location:`http://localhost:${PORT}/vendor/${f}`}});
      if(/fonts\.googleapis\.com/.test(u)) return r.fulfill({status:200,contentType:'text/css',body:FONT_CSS});
      const m=u.match(/^http:\/\/fonts\.local\/(.+)$/); if(m) return r.fulfill({status:200,contentType:'font/woff2',body:fs.readFileSync(path.join(FONTS,m[1]))});
      if(!u.startsWith(`http://localhost:${PORT}/`)) return r.fulfill({status:200,body:'',contentType:'text/plain'});
      return r.continue();});
    const page=await ctx.newPage(); page.on('pageerror',e=>console.log('PAGEERR',e.message)); page.setDefaultTimeout(60000);
    await page.goto(`http://localhost:${PORT}/game/?nosplash=1&welcome=0&films=0&intros=0&island3d=0${extra}`,{waitUntil:'load'}); await page.waitForTimeout(3000); return page; };
  return {server,browser,open,OUT};
}
if(process.argv[2]==='explore'){
  const {browser,open,server}=await setup();
  const a=await open();
  await a.evaluate(()=>document.querySelector('.hm-tile[data-go="mp"]').click()); await a.waitForTimeout(800);
  await a.screenshot({path:OUT+'/e1-together.png'});
  console.log(await a.evaluate(()=>[...document.querySelectorAll('section.view')].find(v=>!v.hidden)?.innerText.replace(/\n+/g,' | ').slice(0,900)));
  console.log(await a.evaluate(()=>[...document.querySelectorAll('#view-mp [id]')].filter(e=>e.getClientRects().length).map(e=>e.id+':'+e.tagName).join(' ')));
  await browser.close(); server.close&&server.close(); process.exit(0);
}
