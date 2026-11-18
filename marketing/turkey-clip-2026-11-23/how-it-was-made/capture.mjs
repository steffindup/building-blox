import { setup } from './_cap.mjs';
const {browser,open,server,OUT}=await setup();
const p=await open('&weekly=2026-11-23');
await p.waitForFunction(()=>!/Get ready/.test(document.querySelector('#status')?.innerText||''),null,{timeout:20000}); await p.waitForTimeout(800);
await p.addStyleTag({content:'dialog{display:none!important}'});
const whole=async()=>{ const c=await p.evaluate(()=>window.bloppitCam()); if(!c.whole){ await p.evaluate(()=>document.querySelector('#fitBtn').click()); await p.waitForTimeout(900);} return p.evaluate(()=>window.bloppitCam()); };
console.log('cam', JSON.stringify(await whole()));
const cv=async(name)=>{ const box=await p.evaluate(()=>{ const c=[...document.querySelectorAll('#view-build canvas')].sort((a,b)=>b.clientHeight*b.clientWidth-a.clientHeight*a.clientWidth)[0]; const par=c.parentElement; window.__hid=[]; for(const e of par.querySelectorAll('*')){ if(e!==c&&!e.contains(c)&&e.tagName!=='CANVAS'){ window.__hid.push([e,e.style.visibility]); e.style.visibility='hidden'; } } const r=c.getBoundingClientRect(); return {x:r.left,y:r.top,width:r.width,height:r.height}; });
  await p.screenshot({path:`${OUT}/${name}.png`,clip:box}); await p.evaluate(()=>{ for(const [e,v] of window.__hid) e.style.visibility=v; }); };
await cv('k00');
for(let i=1;i<=25;i++){ await p.evaluate(()=>window.bloppitPlaceRight()); await p.waitForTimeout(700); const c=await whole(); if(i%5==0) console.log(i,JSON.stringify(c)); await cv('k'+String(i).padStart(2,'0')); }
await p.screenshot({path:OUT+'/full-25.png'});
await p.evaluate(()=>window.bloppitPlaceRight());
for(let j=0;j<12;j++){ await cv('t'+String(j).padStart(2,'0')); await p.waitForTimeout(100); }
await p.waitForTimeout(2500); await cv('k26'); await p.screenshot({path:OUT+'/full-26.png'});
console.log('cam end', JSON.stringify(await p.evaluate(()=>window.bloppitCam())));
await browser.close(); server.close&&server.close(); process.exit(0);
