import { boot } from './base.mjs';
import fs from 'node:fs';
export async function recorder({dsf=1, out='x/frames', every=1, lite=false, init=null, hash='', settle=4000}={}){
  const b = await boot({dsf, lite}); const { page } = b;
  fs.rmSync(out,{recursive:true,force:true}); fs.mkdirSync(out,{recursive:true});
  await page.clock.install({ time: new Date('2026-11-14T15:00:00Z') });
  await page.addInitScript(()=>{
    // one picture per video frame (the fake clock would draw two), and far fewer while the camera is off
    window.__rafMs=33; window.requestAnimationFrame=(cb)=>setTimeout(()=>cb(performance.now()),window.__rafMs); window.cancelAnimationFrame=(id)=>clearTimeout(id);
    window.__anim=(dt)=>{ for(const a of document.getAnimations()){ try{ const t=(a.currentTime||0)+dt, end=a.effect.getComputedTiming().endTime; if(isFinite(end)&&t>=end) a.finish(); else a.currentTime=t; }catch(e){} } };
    window.__ring=(x,y)=>{ const d=document.createElement('div'); d.style.cssText=`position:fixed;left:${x-26}px;top:${y-26}px;width:52px;height:52px;border-radius:50%;border:4px solid #fff;box-shadow:0 0 0 2px rgba(20,32,44,.55),inset 0 0 0 2px rgba(20,32,44,.35);background:rgba(255,255,255,.28);z-index:2147483647;pointer-events:none`;
      document.documentElement.appendChild(d); d.animate([{transform:'scale(.35)',opacity:0},{transform:'scale(1)',opacity:1,offset:.3},{transform:'scale(1)',opacity:1,offset:.6},{transform:'scale(1.25)',opacity:0}],{duration:620,easing:'ease-out',fill:'forwards'}).onfinish=()=>d.remove(); };
  });
  if(init) await page.addInitScript(init);
  await page.goto(b.url+hash,{waitUntil:'load'}); await page.waitForTimeout(settle);
  if(init){ const again=await page.evaluate(()=>window.__seed2&&window.__seed2()); if(again){ await page.reload({waitUntil:'load'}); await page.waitForTimeout(settle); } }
  const cdp = await page.context().newCDPSession(page); await cdp.send('Animation.enable'); await cdp.send('Animation.setPlaybackRate',{playbackRate:0});
  await page.clock.pauseAt(await page.evaluate(()=>Date.now())+90000);
  const R = { b, page, frame:0, vt:0, marks:[] }; let k=0;
  R.step = async (capture=true) => { if(R.fast){ await R.skip(33,0); await R.stepReal(false); if(capture) R.frame++; return; } return R.stepReal(capture); };
  R.stepReal = async (capture=true) => { const dt=(R.frameAll=(R.frameAll||0)+1)%3===0?34:33; await page.clock.runFor(dt); await page.evaluate((dt)=>window.__anim(dt),dt); R.vt+=dt;
    if(capture){ if(R.frame%every===0) await page.screenshot({path:`${out}/f${String(R.frame).padStart(5,'0')}.png`}); R.frame++; } };
  R.skip = async (ms,settle=8) => { if(ms<=0) return; await page.evaluate(()=>{window.__rafMs=200;}); for(let t=0;t<ms;t+=200){ await page.clock.runFor(200); await page.evaluate((dt)=>window.__anim(dt),200); } await page.evaluate(()=>{window.__rafMs=33;}); for(let i=0;i<settle;i++) await R.stepReal(false); };
  R.run = async (n,capture=true) => { if(R.fast&&n>6){ await R.skip(n*33.33,2); if(capture) R.frame+=n; return; } for(let i=0;i<n;i++) await R.step(capture); };
  R.until = async (pred,arg,{max=600,capture=true}={}) => { for(let i=0;i<max;i++){ if(await page.evaluate(pred,arg)) return i; await R.step(capture); } throw new Error('until: timed out '+pred.toString().slice(0,90)); };
  R.to = async (f) => { if(R.fast&&f-R.frame>6){ await R.skip((f-R.frame)*33.33,2); R.frame=f; return; } if(R.frame>f) console.log(`  !! over by ${R.frame-f} frames at target ${f}`); while(R.frame<f) await R.step(true); };
  R.mark = (name) => { R.marks.push([name,R.frame]); console.log(`[${(R.frame/30).toFixed(2)}s f${R.frame}] ${name}`); };
  R.pos = (sel) => page.evaluate((sel)=>{ const e=typeof sel==='string'?document.querySelector(sel):null; if(!e) return null; const r=e.getBoundingClientRect(); return {x:r.left+r.width/2,y:r.top+r.height/2,w:r.width,h:r.height}; },sel);
  // show a tap ring, wait a few frames, then act
  R.tap = async (target,{lead=7,click='dom',capture=true}={}) => { const p=typeof target==='string'?await R.pos(target):target; if(!p) throw new Error('tap: no '+target);
    await page.evaluate(([x,y])=>window.__ring(x,y),[p.x,p.y]); await R.run(lead,capture);
    if(typeof target==='string'&&click==='dom') await page.evaluate((s)=>document.querySelector(s).click(),target); else await page.touchscreen.tap(p.x,p.y); R.mark('tap '+(typeof target==='string'?target:`${Math.round(p.x)},${Math.round(p.y)}`)); };
  R.st = () => page.evaluate(()=>({view:[...document.querySelectorAll('section.view')].find(v=>!v.hidden)?.id, dlg:[...document.querySelectorAll('dialog[open]')].map(d=>d.id), status:document.querySelector('#status')?.innerText?.slice(0,70), play:document.querySelector('#isWorld .is3-play')?.innerText?.replace(/\s+/g,' '), banner:document.querySelector('#isWorld .is3-banner')?.innerText}));
  return R;
}
