import { recorder } from './reclib.mjs';
const DSF=+(process.env.DSF||1), EVERY=+(process.env.EVERY||3), OUT=process.env.OUT||'x/draft';
const R = await recorder({dsf:DSF, every:EVERY, out:OUT}); const { page } = R; const FROM=+(process.env.FROM||0); R.fast=FROM>68;
const log = async (t) => console.log(`  (${R.frame}) ${t}`, JSON.stringify(await R.st()));
const spot = async () => { await page.evaluate(()=>{ try{ window.bloppitHold(0); }catch(e){} }); await R.step(); return page.evaluate(()=>{ try{ return window.bloppitSpot(); }catch(e){ return null; } }); };
const placed = () => page.evaluate(()=>window.bloppitPlacedBoxes().length);
// ---- before the camera rolls
await page.evaluate(() => document.getElementById('hmCont').click());
await R.until(() => document.getElementById('pupDlg').open, null, {capture:false}); await R.run(30,false);
// ---- 1. Meet your otter  [68, 279)
R.frame=68; R.mark('s1');
await R.to(137); await R.tap('#pupCols [data-col="3"]');
await R.to(212); await R.tap('#pupIn'); await page.evaluate(()=>document.getElementById('pupIn').focus());
await R.to(225); for (const ch of 'Pebble') { await page.evaluate((ch)=>{ const e=document.getElementById('pupIn'); e.value+=ch; e.dispatchEvent(new Event('input',{bubbles:true})); },ch); await R.run(4); }
await R.to(266); await R.tap('#pupLater',{lead:9}); await R.to(279);
// off camera: the boat arrives
await R.skip(1500); await R.until(() => /first home/i.test(document.querySelector('#isWorld .is3-play')?.textContent || ''), null, {capture:false, max:1500}); await R.skip(2500);
// ---- 2. Tap the faded brick  [279, 441)
R.frame=279; R.mark('s2'); await log('island');
await R.to(338); await R.tap('#isWorld .is3-play');
await R.to(370); { const sp=await spot(); await R.tap({x:sp.x,y:sp.y}); }
await R.to(412); { const sp=await spot(); await R.tap({x:sp.x,y:sp.y}); } await log('two bricks '+await placed());
await R.to(441);
// off camera: finish the home, back on the island, the map with Play next
for(let i=0;i<40;i++){ await page.evaluate(()=>window.bloppitPlaceRight()); await R.run(10,false); if(await page.evaluate(()=>/Every step/i.test(document.getElementById('status').textContent))) break; }
await R.until(() => !document.getElementById('view-island').hidden, null, {capture:false, max:900}); await R.skip(12000); await log('map?');
// ---- 3. Tap Play next  [441, 561)
R.frame=441; R.mark('s3');
await R.to(542); await R.tap('#isWorld .is3-play'); await R.to(561); await log('after play next');
await R.until(() => !document.getElementById('view-build').hidden && /Level 1/.test(document.getElementById('status').textContent), null, {capture:false, max:600}); await R.run(40,false);
// ---- 4. Open the parts box  [561, 645)
R.frame=561; R.mark('s4');
const next = await page.evaluate(()=>window.bloppitSpot());
await R.to(572); await R.tap('#openBox');
await R.to(601); { const at = await page.evaluate((name) => { for (const el of document.querySelectorAll('#view-box .piece')) { if (!el.getAttribute('aria-label').startsWith(name)) continue; const r = el.getBoundingClientRect(), x = r.left + r.width / 2, y = r.top + r.height / 2; if (document.elementFromPoint(x, y)?.closest('.piece') === el) return { x, y }; } return null; }, next.name); console.log('piece',JSON.stringify(at),next.name); await R.tap(at,{lead:8}); }
await R.to(623); await log('picked'); await R.tap('#takeBtn',{lead:8}); await R.to(645); await log('taken');
// ---- 5. Snap it in  [645, 762)
R.mark('s5');
await R.to(651); { const sp=await page.evaluate(()=>window.bloppitSpot()); await R.tap({x:sp.x-84,y:sp.y+48},{lead:8}); await R.run(6); await log('first tap '+await placed()+' '+JSON.stringify(await page.evaluate(()=>window.bloppitSel()))); }
await R.to(672); { const sp=await page.evaluate(()=>window.bloppitSpot()); await R.tap({x:sp.x,y:sp.y},{lead:8}); await R.run(4); await log('second tap '+await placed()); }
await R.to(691); if(await placed()<1){ const sp=await page.evaluate(()=>window.bloppitSpot()); await R.tap({x:sp.x,y:sp.y},{lead:8}); } await R.run(4); await log('snap '+await placed());
await R.to(730); await R.tap('#openBox',{lead:8}); await R.to(762);
// off camera: back to the build, four bricks in
await page.evaluate(()=>{ const b=[...document.querySelectorAll('#view-box button')].find(e=>/Back to build/i.test(e.textContent)); b&&b.click(); }); await R.run(20,false); await log('back');
const total = await page.evaluate(()=>window.bloppitPlacedBoxes().length); 
for(let i=0;i<40&&await placed()<7;i++){ await page.evaluate(()=>window.bloppitPlaceRight()); await R.run(14,false); } await R.run(30,false); await log('seven in: '+await placed());
// ---- 6. Page by page  [762, 882)
R.frame=762; if(FROM<=762) R.fast=false; R.mark('s6');
for (const f of [768,786,804]) { await R.to(f); const n0=await placed(); for(let i=0;i<9;i++){ await page.evaluate(()=>window.bloppitPlaceRight()); if(await placed()>n0) break; await R.step(); } }
await R.run(3); await log('built '+await placed()+' of '+await page.evaluate(()=>document.body.innerText.match(/(\d+) of (\d+) placed/i)?.[0]));
for(const f of [822,836,850]){ await R.to(f); await log('after built'); }
// the "Ta-da!" picture: a tap goes straight on to the finish card
await R.to(857); await R.until(()=>{ const c=document.querySelector('.rv-cap'); return !!(c&&c.parentElement.classList.contains('tap')); },null,{max:40}).catch(()=>console.log('  !! ta-da not tappable yet'));
{ const p=await R.pos('.rv-pos'); await page.evaluate(([x,y])=>window.__ring(x,y),[p.x,p.y]); await R.run(6); await page.evaluate(()=>document.querySelector('.rv-cap').parentElement.click()); R.mark('tap ta-da'); }
await R.until(()=>document.getElementById('winDlg').open,null,{max:60}).catch(()=>console.log('  !! no finish card')); R.mark('finish card');
await R.to(882);
// ---- 7. Grow your world  [882, 1229)
R.mark('s7');
await R.to(930); await R.tap('#winIsland',{lead:8});
for (const f of [990,1050,1090,1150,1229]) { await R.to(f); await log('s7'); }
R.mark('end'); console.log('errors',R.b.errors); await R.b.close(); process.exit(0);
