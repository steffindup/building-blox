import { boot } from './base.mjs';
import fs from 'node:fs';
const svg = fs.readFileSync(new URL('../../public/art/bloppit-front.svg', import.meta.url),'utf8');
const otter = 'data:image/svg+xml;base64,'+Buffer.from(svg).toString('base64');
const b = await boot({dsf:1}); const page = await b.ctx.newPage();
const html = (w,h,kind,cta) => { const k = w>h ? 1 : 1.12, tall = h>w;
  return `<!doctype html><html><head><link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=x"><style>
  html,body{margin:0;width:${w}px;height:${h}px;background:#F7F3E9;overflow:hidden}
  .c{position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:${22*k}px;font-family:'Nunito',sans-serif;color:#142022;text-align:center}
  img{height:${(tall?430:330)*k}px;display:block;margin-bottom:${4*k}px}
  .how{font-weight:800;letter-spacing:.3em;font-size:${30*k}px;color:#4A5568;margin-bottom:${-10*k}px}
  .wm{font-family:'Lilita One',sans-serif;font-size:${(kind==='title'?150:132)*k}px;line-height:.95;color:#D62F2A}
  .wob{display:flex;gap:${10*k}px;margin-top:${-4*k}px}
  .wob i{font-style:normal;font-weight:800;font-size:${38*k}px;line-height:1;padding:${11*k}px ${20*k}px ${13*k}px;border-radius:${12*k}px;box-shadow:inset 0 ${-5*k}px 0 rgba(0,0,0,.16)}
  .wob i:nth-child(1){background:#F4BC22;color:#142022}.wob i:nth-child(2){background:#fff;color:#0369BD;box-shadow:inset 0 0 0 ${3*k}px #0369BD}.wob i:nth-child(3){background:#D62F2A;color:#fff}
  .tag{font-family:'Lilita One',sans-serif;font-size:${58*k}px;line-height:1.05;margin-top:${14*k}px;max-width:${w*.86}px}
  .sub{font-weight:600;font-size:${38*k}px;line-height:1.3;color:#3B4756;margin-top:${6*k}px;max-width:${w*.8}px}
  .so{font-weight:800;font-size:${34*k}px;color:#0369BD}
  .cta{font-weight:800;font-size:${36*k}px;background:#F4BC22;border-radius:999px;padding:${18*k}px ${40*k}px;box-shadow:0 ${5*k}px 0 #142022;margin-top:${12*k}px}
  </style></head><body><div class="c"><img src="${otter}">
  ${kind==='title'?'<div class="how">HOW TO PLAY</div>':''}
  <div class="wm">Bloppit</div><div class="wob"><i>World</i><i>of</i><i>Bricks</i></div>
  ${kind==='title'?'<div class="sub">Build brick models step by step,<br>and grow your own world.</div>':`<div class="tag">Build it. Grow your world.</div><div class="so">Brick. Build. Bloppit.</div>${cta?'<div class="cta">Play free at bloppit.com</div>':''}`}
  </div></body></html>`; };
for (const [name,w,h,cta] of [['how-to-play',1920,1080,true],['how-to-play-app',1920,1080,false],['how-to-play-app-tall',1080,1920,false]]) for (const kind of ['title','end']) {
  await page.setViewportSize({width:w,height:h}); await page.setContent(html(w,h,kind,cta),{waitUntil:'load'}); await page.evaluate(()=>document.fonts.ready); await page.waitForTimeout(400);
  await page.screenshot({path:`x/card-${name}-${kind}.png`}); }
await b.close(); process.exit(0);
