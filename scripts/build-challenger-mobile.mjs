import{cpSync,mkdirSync,readFileSync,writeFileSync}from'node:fs';import{resolve}from'node:path';
// Native online features use only the separate preview backend.
process.env.URL=process.env.CHALLENGER_ORIGIN||'https://bloppit-chatgpt-challenger.netlify.app';
if(new URL(process.env.URL).hostname==='bloppit.com')throw Error('Refusing production backend for the challenger');
await import('./build-challenger.mjs');
const root=resolve(import.meta.dirname,'..'),dist=resolve(root,'challenger-dist'),out=resolve(root,'mobile-challenger/www');mkdirSync(out,{recursive:true});
for(const path of ['art','full','challenger/vendor'])cpSync(resolve(dist,path),resolve(out,path),{recursive:true});
mkdirSync(resolve(out,'experiment'),{recursive:true});
writeFileSync(resolve(out,'experiment/full.mjs'),'// Native review builds deliberately do not participate in the web A/B experiment.\n');
let html=readFileSync(resolve(dist,'challenger/index.html'),'utf8');
html=html.replace('<body>','<body><script>window.BLOPPIT_APP=true;window.__abTrack=()=>{};</script>');
html=html.replace(/<link rel="(canonical|manifest|apple-touch-icon|icon)"[^>]*>/g,'').replace(/<script type="application\/ld\+json">[\s\S]*?<\/script>/g,'');
writeFileSync(resolve(out,'index.html'),html);
let runtime=readFileSync(resolve(out,'full/runtime.js'),'utf8').replace('<p><a href="/experiment/">Grown-up A/B playtest</a></p>','');writeFileSync(resolve(out,'full/runtime.js'),runtime);
if(/https:\/\/(cdn|fonts)\./.test(html))throw Error('Unexpected external graphics dependency');
console.log('Full Bloppit Lab packaged: offline solo game, separate preview backend for online modes.');
