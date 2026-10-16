export const SAVE_KEY = 'bloppit-challenger-v1';
export const COLORS = { coral:'#f87966', cream:'#ffe4aa', teal:'#54beb0', blue:'#6f9ee7', plum:'#9b7cc4' };
const b=(x,y,z,w,d,color)=>({x,y,z,w,d,color});
export const MODELS = [
 {id:'cottage', name:'Cozy cottage', subtitle:'A little home. A big beginning.', reward:'Your first home', bricks:[b(0,0,0,2,1,'cream'),b(2,0,0,2,1,'cream'),b(0,0,1,1,2,'cream'),b(3,0,1,1,2,'cream'),b(1,0,2,2,1,'cream'),b(0,1,0,2,1,'teal'),b(2,1,0,2,1,'teal'),b(0,1,1,1,2,'cream'),b(3,1,1,1,2,'cream'),b(1,1,2,2,1,'teal'),b(0,2,0,2,3,'coral'),b(2,2,0,2,3,'coral'),b(1,3,0,2,3,'coral')]},
 {id:'boat', name:'Little explorer', subtitle:'Every adventure starts with a splash.', reward:'A boat at the cove', bricks:[b(0,0,0,2,1,'teal'),b(2,0,0,2,1,'teal'),b(0,0,1,2,1,'teal'),b(2,0,1,2,1,'teal'),b(0,1,0,1,2,'cream'),b(3,1,0,1,2,'cream'),b(1,1,0,2,1,'coral'),b(1,2,0,1,1,'cream'),b(1,3,0,2,1,'blue'),b(1,4,0,1,1,'blue')]},
 {id:'garden', name:'Bloom garden', subtitle:'Make room for a little more wonder.', reward:'A garden full of colour', bricks:[b(0,0,0,2,2,'cream'),b(2,0,0,2,2,'cream'),b(0,1,0,1,1,'teal'),b(3,1,1,1,1,'teal'),b(0,2,0,2,1,'coral'),b(2,2,1,2,1,'plum'),b(1,1,1,1,1,'teal'),b(1,2,1,1,1,'teal'),b(0,3,1,2,1,'cream')]},
 {id:'beacon', name:'Starlight beacon', subtitle:'A warm welcome for faraway friends.', reward:'A lighthouse on the hill', bricks:[b(0,0,0,2,2,'cream'),b(0,1,0,2,2,'coral'),b(0,2,0,2,2,'cream'),b(0,3,0,2,2,'coral'),b(0,4,0,2,2,'cream'),b(0,5,0,2,2,'blue'),b(0,6,0,2,2,'plum')]}
];
export function fresh(){return {version:1,completed:[],active:null,sound:false,motion:true};}
export function restore(raw){
 try { const v=JSON.parse(raw); if(v?.version!==1)return fresh();
 const s={...fresh(),completed:MODELS.map(m=>m.id).filter(id=>v.completed?.includes(id)),sound:v.sound===true,motion:v.motion!==false};
 const a=v.active,m=MODELS.find(m=>m.id===a?.id);
 if(m&&Number.isInteger(a.step)&&a.step>=0&&a.step<m.bricks.length)s.active={id:m.id,step:a.step,misses:Math.max(0,Number(a.misses)||0),hints:Math.max(0,Number(a.hints)||0)};
 return s; }catch{return fresh();}
}
export function begin(s,id){if(!MODELS.some(m=>m.id===id))throw Error('Unknown model');s.active={id,step:0,misses:0,hints:0};return s;}
export function target(s){return MODELS.find(m=>m.id===s.active?.id)?.bricks[s.active.step];}
export function place(s,color,rotation){
 const t=target(s);if(!t)return {ok:false,reason:'No active build'};
 if(color!==t.color || (t.w!==t.d && rotation%180!==0)){s.active.misses++;return {ok:false,reason:color!==t.color?'Match the colour in the booklet.':'Turn the brick to match the outline.'};}
 s.active.step++;const model=MODELS.find(m=>m.id===s.active.id);
 if(s.active.step===model.bricks.length){const first=!s.completed.includes(model.id),run={...s.active};if(first)s.completed.push(model.id);s.active=null;return {ok:true,complete:true,first,run};}
 return {ok:true,complete:false};
}
export function undo(s){if(s.active?.step>0){s.active.step--;return true;}return false;}
