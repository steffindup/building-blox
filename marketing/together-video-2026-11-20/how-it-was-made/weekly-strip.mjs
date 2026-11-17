import { setup } from './cap.mjs';
import fs from 'node:fs';
const {browser,open,server,OUT}=await setup();
for(const wk of (process.env.WEEKS||'2026-11-30,2026-12-07').split(',')){
const p=await open('&weekly='+wk);
await p.waitForFunction(()=>!/Get ready/.test(document.querySelector('#status')?.innerText||''),null,{timeout:20000}); await p.waitForTimeout(800);
const total=await p.evaluate(()=>+(document.body.innerText.match(/of (\d+) placed/i)||[])[1]);
const placed=()=>p.evaluate(()=>window.bloppitPlacedBoxes().length);
const cv=async(name)=>{ await p.evaluate(()=>document.getElementById('fitBtn')?.click()); await p.waitForTimeout(900);
  const box=await p.evaluate(()=>{ const c=[...document.querySelectorAll('#view-build canvas')].sort((a,b)=>b.clientHeight*b.clientWidth-a.clientHeight*a.clientWidth)[0]; const par=c.parentElement; window.__hid=[]; for(const e of par.querySelectorAll('*')){ if(e!==c&&!e.contains(c)&&e.tagName!=='CANVAS'){ window.__hid.push([e,e.style.visibility]); e.style.visibility='hidden'; } } const r=c.getBoundingClientRect(); return {x:r.left,y:r.top,width:r.width,height:r.height}; });
  await p.waitForTimeout(250); await p.screenshot({path:`${OUT}/${name}.png`,clip:box}); await p.evaluate(()=>{ for(const [e,v] of window.__hid) e.style.visibility=v; }); };
const upto=async(n)=>{ for(let i=0;i<200&&await placed()<n;i++){ await p.evaluate(()=>window.bloppitPlaceRight()); await p.waitForTimeout(330); } await p.waitForTimeout(700); };
await upto(1); await cv(`wk-${wk}-1`); await upto(Math.round(total/2)); await cv(`wk-${wk}-half`); await upto(total-1); await cv(`wk-${wk}-last`);
const hand=await p.evaluate(()=>{ try{ window.bloppitHold(0); return JSON.stringify(window.bloppitSel()); }catch(e){ return String(e); } });
await p.evaluate(()=>window.bloppitPlaceRight()); await p.waitForTimeout(+(process.env.DONE_MS||2600));
await p.addStyleTag({content:'dialog,dialog::backdrop{display:none!important}'}); await p.waitForTimeout(300); await cv(`wk-${wk}-done`);
console.log(wk,'total',total,'placed',await placed(),'last piece',hand);
const v=await p.evaluate((w)=>{ const e=window.bloppitWeeklyExport(w); const x=e.views&&e.views[0]; return JSON.stringify({name:e.name,special:e.special,png:x&&x.png}); },wk); const j=JSON.parse(v); console.log(' ',j.name,JSON.stringify(j.special)); if(j.png) fs.writeFileSync(`${OUT}/wk-${wk}-pic.png`,Buffer.from(j.png.split(',')[1],'base64'));
await p.close(); }
await browser.close(); server.close&&server.close(); process.exit(0);
