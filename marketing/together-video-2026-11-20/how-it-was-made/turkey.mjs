import { setup } from './cap.mjs';
const {browser,open,server,OUT}=await setup();
const p=await open('&weekly=2026-11-23');
await p.waitForFunction(()=>!/Get ready/.test(document.querySelector('#status')?.innerText||''),null,{timeout:20000}); await p.waitForTimeout(800);
const placed=()=>p.evaluate(()=>window.bloppitPlacedBoxes().length);
const cv=async(name)=>{ const box=await p.evaluate(()=>{ const c=[...document.querySelectorAll('#view-build canvas')].sort((a,b)=>b.clientHeight*b.clientWidth-a.clientHeight*a.clientWidth)[0]; const par=c.parentElement; window.__hid=[]; for(const e of par.querySelectorAll('*')){ if(e!==c&&!e.contains(c)&&e.tagName!=='CANVAS'){ window.__hid.push([e,e.style.visibility]); e.style.visibility='hidden'; } } const r=c.getBoundingClientRect(); return {x:r.left,y:r.top,width:r.width,height:r.height}; });
  await p.waitForTimeout(300); await p.screenshot({path:`${OUT}/${name}.png`,clip:box}); await p.evaluate(()=>{ for(const [e,v] of window.__hid) e.style.visibility=v; }); return box; };
for(let i=0;i<60&&await placed()<25;i++){ await p.evaluate(()=>window.bloppitPlaceRight()); await p.waitForTimeout(450); }
console.log('placed',await placed(), await p.evaluate(()=>document.querySelector('#status')?.innerText)); await p.waitForTimeout(1200);
console.log(JSON.stringify(await cv('turkey-25'))); await p.screenshot({path:OUT+'/turkey-25-full.png'});
await p.evaluate(()=>window.bloppitPlaceRight()); await p.waitForTimeout(1500); console.log('placed',await placed()); await cv('turkey-26'); await p.screenshot({path:OUT+'/turkey-26-full.png'});
await browser.close(); server.close&&server.close(); process.exit(0);
