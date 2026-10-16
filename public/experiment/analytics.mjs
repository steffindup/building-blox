// Experiment 2 compares the same full game. Prototype counts stay in v1.
const KEY='bloppit-ab-v2',scope=window.__abScope||(new URLSearchParams(location.search).get('ab')==='random'?'ab':'review');
export function readMetrics(){try{const v=JSON.parse(localStorage.getItem(KEY));return v&&typeof v.counts==='object'?v:{counts:{},share:false};}catch{return {counts:{},share:false};}}
function save(v){try{localStorage.setItem(KEY,JSON.stringify(v));}catch{}}
export function sharing(v){const m=readMetrics();m.share=!!v;save(m);}
export function track(name,arm='b'){
 if(!/^[a-z_]{2,24}$/.test(name)||!['a','b'].includes(arm))return;
 const m=readMetrics(),key=`v2_${scope}_${arm}_${name}`;m.counts[key]=(m.counts[key]||0)+1;save(m);
 if(m.share&&location.protocol.startsWith('http'))fetch('/api/event',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({events:[key],p:'web'}),keepalive:true}).catch(()=>{});
}
export function once(name,arm='b'){const key=`bloppit-v2-once-${scope}-${arm}-${name}`;try{if(localStorage.getItem(key))return;localStorage.setItem(key,'1');}catch{}track(name,arm);}
export function connect(arm){
 window.__abTrack=(...names)=>names.forEach(n=>{if(n==='build_started'){track(n,arm);if(readMetrics().counts[`v2_${scope}_${arm}_build_started`]>=2)once('second_build',arm);}else if(n==='build_completed'){track(n,arm);once('first_completion',arm);}else if(n.startsWith('char_poke:'))track('mascot_pet',arm);});
 once('exposure',arm);
 for(const names of window.__abQueue||[])window.__abTrack(...names);window.__abQueue=[];
 const day=new Date().toISOString().slice(0,10),key=`bloppit-v2-days-${scope}-${arm}`;
 try{const first=localStorage.getItem(key);if(first&&first!==day)once('return_visit',arm);if(!first)localStorage.setItem(key,day);}catch{}
 let active=0,last=performance.now(),done=false;
 setInterval(()=>{const now=performance.now(),elapsed=now-last;last=now;if(document.hidden)return;active+=Math.min(elapsed,15000);if(active>=600000&&!done){done=true;once('ten_minutes',arm);}},10000);
}
