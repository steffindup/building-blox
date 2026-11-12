import { boot } from './base.mjs';
import fs from 'node:fs';
const otter='data:image/svg+xml;base64,'+fs.readFileSync('/home/claude/building-blox/public/art/bloppit-front.svg').toString('base64');
const b=await boot({dsf:1}); const page=await b.ctx.newPage(); await page.setViewportSize({width:1920,height:1080});
const css=`html,body{margin:0;width:1920px;height:1080px;overflow:hidden;font-family:'Nunito',sans-serif}
.cap{position:absolute;left:110px;width:1080px;top:0;bottom:0;display:flex;align-items:center;justify-content:center;text-align:center;font-family:'Lilita One',sans-serif;font-size:118px;line-height:1.06;color:#fff;text-shadow:0 7px 0 #02508f}
.ph{position:absolute;left:1286px;top:26px;width:490px;height:1028px;border-radius:54px;background:#fff;box-shadow:0 14px 0 #02508f}`;
const pages={
 'bg-build':`<body style="background:#0369BD"><div class="cap">Snap bricks together.</div><div class="ph"></div></body>`,
 'bg-grow':`<body style="background:#0369BD"><div class="cap">Every build grows<br>your world.</div><div class="ph"></div></body>`,
 'bg-world':`<body style="background:#0369BD"><div class="cap">A whole world<br>to grow.</div><div class="ph"></div></body>`,
 'meet':`<body style="background:transparent"><div style="position:absolute;left:0;right:0;bottom:90px;text-align:center;font-family:'Lilita One',sans-serif;font-size:150px;color:#fff;text-shadow:0 8px 0 rgba(20,32,34,.55),0 0 40px rgba(20,32,34,.35)">Meet Bloppit.</div></body>`,
 'end':`<body style="background:#F7F3E9"><div style="position:absolute;inset:0;display:flex;align-items:center;justify-content:center;gap:90px;color:#142022">
   <img src="${otter}" style="height:760px">
   <div style="display:flex;flex-direction:column;align-items:center;gap:24px;text-align:center"><div style="font-family:'Lilita One';font-size:210px;line-height:.95;color:#D62F2A">Bloppit</div>
   <div style="display:flex;gap:12px;margin-top:-6px">${[['World','#F4BC22','#142022',''],['of','#fff','#0369BD','box-shadow:inset 0 0 0 4px #0369BD;'],['Bricks','#D62F2A','#fff','']].map(([t,bg,c,x])=>`<i style="font-style:normal;font-weight:800;font-size:54px;line-height:1;padding:15px 28px 18px;border-radius:16px;background:${bg};color:${c};${x||'box-shadow:inset 0 -6px 0 rgba(0,0,0,.16)'}">${t}</i>`).join('')}</div>
   <div style="font-family:'Lilita One';font-size:74px;line-height:1.05;margin-top:22px">Build it. Grow your world.</div>
   <div style="font-weight:800;font-size:44px;background:#F4BC22;border-radius:999px;padding:22px 48px;box-shadow:0 6px 0 #142022;margin-top:16px">Out now on iPhone and iPad</div>
   <div style="font-family:'Lilita One';font-size:88px;color:#0369BD;margin-top:8px">bloppit.com</div></div></div></body>`};
for(const [k,h] of Object.entries(pages)){ await page.setContent(`<!doctype html><html><head><link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=x"><style>${css}</style></head>${h}</html>`,{waitUntil:'load'}); await page.evaluate(()=>document.fonts.ready); await page.waitForTimeout(300); await page.screenshot({path:`x/lw-${k}.png`,omitBackground:k==='meet'}); }
await b.close(); process.exit(0);
