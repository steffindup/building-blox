import { boot } from './base.mjs';
import fs from 'node:fs';
const otter='data:image/svg+xml;base64,'+fs.readFileSync('/home/claude/building-blox/public/art/bloppit-front.svg').toString('base64');
const b=await boot({dsf:1}); const page=await b.ctx.newPage(); await page.setViewportSize({width:1080,height:1920});
const css=`html,body{margin:0;width:1080px;height:1920px;overflow:hidden;font-family:'Nunito',sans-serif}
.cap{position:absolute;left:60px;right:60px;top:70px;height:250px;display:flex;align-items:center;justify-content:center;text-align:center;font-family:'Lilita One',sans-serif;font-size:92px;line-height:1.04;color:#fff;text-shadow:0 6px 0 #02508f}
.ph{position:absolute;left:176px;top:346px;width:728px;height:1544px;border-radius:66px;background:#fff;box-shadow:0 18px 0 #02508f}`;
const pages={
 'bg-build':`<body style="background:#0369BD"><div class="cap">Snap bricks together.</div><div class="ph"></div></body>`,
 'bg-grow':`<body style="background:#0369BD"><div class="cap">Every build grows<br>your world.</div><div class="ph"></div></body>`,
 'bg-world':`<body style="background:#0369BD"><div class="cap">A whole world<br>to grow.</div><div class="ph"></div></body>`,
 'meet':`<body style="background:transparent"><div style="position:absolute;left:0;right:0;bottom:250px;text-align:center;font-family:'Lilita One',sans-serif;font-size:150px;color:#fff;text-shadow:0 8px 0 rgba(20,32,34,.55),0 0 40px rgba(20,32,34,.35)">Meet Bloppit.</div></body>`,
 'end':`<body style="background:#F7F3E9"><div style="position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:26px;color:#142022;text-align:center">
   <img src="${otter}" style="height:500px;margin-bottom:6px"><div style="font-family:'Lilita One';font-size:190px;line-height:.95;color:#D62F2A">Bloppit</div>
   <div style="display:flex;gap:12px;margin-top:-6px">${[['World','#F4BC22','#142022',''],['of','#fff','#0369BD','box-shadow:inset 0 0 0 4px #0369BD;'],['Bricks','#D62F2A','#fff','']].map(([t,bg,c,x])=>`<i style="font-style:normal;font-weight:800;font-size:50px;line-height:1;padding:14px 26px 17px;border-radius:15px;background:${bg};color:${c};${x||'box-shadow:inset 0 -6px 0 rgba(0,0,0,.16)'}">${t}</i>`).join('')}</div>
   <div style="font-family:'Lilita One';font-size:74px;line-height:1.05;margin-top:26px">Build it. Grow your world.</div>
   <div style="font-weight:800;font-size:46px;background:#F4BC22;border-radius:999px;padding:24px 52px;box-shadow:0 6px 0 #142022;margin-top:22px">Out now on iPhone and iPad</div>
   <div style="font-family:'Lilita One';font-size:92px;color:#0369BD;margin-top:20px">bloppit.com</div></div></body>`};
for(const [k,h] of Object.entries(pages)){ await page.setContent(`<!doctype html><html><head><link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=x"><style>${css}</style></head>${h}</html>`,{waitUntil:'load'}); await page.evaluate(()=>document.fonts.ready); await page.waitForTimeout(300); await page.screenshot({path:`x/lc-${k}.png`,omitBackground:k==='meet'}); }
await b.close(); process.exit(0);
