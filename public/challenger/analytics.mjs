const KEY='bloppit-ab-v1';
export function readMetrics(){try{return JSON.parse(localStorage.getItem(KEY))||{counts:{},share:false};}catch{return {counts:{},share:false};}}
function save(v){try{localStorage.setItem(KEY,JSON.stringify(v));}catch{}}
function scope(){return new URLSearchParams(location.search).get('ab')==='random'?'ab':'review';}
export function sharing(v){const m=readMetrics();m.share=v;save(m);}
export function track(name,arm='b'){
 if(!/^[a-z_]{2,24}$/.test(name)||!['a','b'].includes(arm))return;
 const m=readMetrics(),key=`${scope()}_${arm}_${name}`;m.counts=m.counts||{};m.counts[key]=(m.counts[key]||0)+1;save(m);
 // Only same-origin preview counts. No production endpoint or personal fields.
 if(m.share&&location.protocol.startsWith('http'))fetch('/api/event',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({events:[key],p:'web'}),keepalive:true}).catch(()=>{});
}
export function once(name,arm='b'){const key=`bloppit-v1-once-${scope()}-${arm}-${name}`;try{if(localStorage.getItem(key))return;localStorage.setItem(key,'1');}catch{}track(name,arm);}
