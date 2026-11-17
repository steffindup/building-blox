import { setup } from './cap.mjs';
const {browser,open,server,OUT}=await setup();
const a=await open(), b=await open();
const shot=(p,n)=>p.screenshot({path:`${OUT}/${n}.png`});
const fix=(p)=>p.evaluate(()=>{ const w=document.createTreeWalker(document.body,NodeFilter.SHOW_TEXT); let n; while(n=w.nextNode()){ if(n.nodeValue.includes('localhost:8793')) n.nodeValue=n.nodeValue.replace('localhost:8793','bloppit.com'); } });
const both=async(n)=>{ await shot(a,n+'-a'); await shot(b,n+'-b'); };
await a.evaluate(()=>document.querySelector('.hm-tile[data-go="mp"]').click()); await a.waitForTimeout(600);
await a.evaluate(()=>{ const t=[...document.querySelectorAll('#view-mp .hub [data-sub], #view-mp .hub button')].find(e=>/Team Build/.test(e.textContent)); t&&t.click(); }); await a.waitForTimeout(800);
await a.evaluate(()=>{ const s=[...document.querySelectorAll('#view-mp select')].find(s=>[...s.options].some(o=>/^Toadstool \(18/.test(o.textContent.trim()))); const o=[...s.options].find(o=>/^Toadstool \(18/.test(o.textContent.trim())); s.value=o.value; s.dispatchEvent(new Event('change',{bubbles:true})); document.getElementById('mpName1').value='Sam'; document.getElementById('pt3').click(); });
await a.waitForTimeout(600); await shot(a,'s0-setup');
await a.evaluate(()=>document.getElementById('mpCreate').click());
await a.waitForFunction(()=>/^[A-Z0-9]{5}$/.test(document.getElementById('mpBigCode')?.textContent.trim()||''),null,{timeout:15000});
const code=await a.evaluate(()=>document.getElementById('mpBigCode').textContent.trim()); console.log('code',code);
await a.waitForTimeout(800); await fix(a); await shot(a,'s1-lobby');
await b.evaluate(()=>(document.querySelector('.hm-tile[data-go="mp"]').click(),document.querySelector('#view-mp .hub [data-sub="join"]').click())); await b.waitForTimeout(600);
await b.fill('#mpCodeIn',code); await b.fill('#mpName2','Alex'); await b.waitForTimeout(300); await shot(b,'s2-join');
await b.evaluate(()=>document.getElementById('mpJoin').click()); await b.waitForTimeout(1500); await shot(b,'s3-knock');
await a.waitForSelector('[data-admit]',{state:'attached',timeout:30000}); await a.waitForTimeout(600); await fix(a); await shot(a,'s4-letin');
while(await a.evaluate(()=>{const x=document.querySelector('[data-admit]:not([disabled])'); if(x){x.click();return true;} return false;})) await a.waitForTimeout(900);
await a.waitForTimeout(1200); await fix(a); await shot(a,'s5-ready'); await a.evaluate(()=>document.getElementById('mpStart').click()); await a.waitForTimeout(3500);
await both('b00');
const room=()=>a.evaluate(async(c)=>(await (await fetch('/api/room?code='+c)).json()).state,code);
let k=0;
for(let r=0;r<60;r++){ const s=await room(); if(s.finished) break; const who=[a,b][s.turn];
  for(let i=0;i<s.perTurn;i++){ await who.evaluate(()=>window.bloppitPlaceRight()); await who.waitForTimeout(1300); k++; await both('b'+String(k).padStart(2,'0')); const s2=await room(); if(s2.finished) break; }
  await who.waitForTimeout(1200); }
console.log('bricks',k); await a.waitForTimeout(1500); await both('y-built'); await a.waitForTimeout(5000); await both('z-end');
await browser.close(); server.close&&server.close(); process.exit(0);
