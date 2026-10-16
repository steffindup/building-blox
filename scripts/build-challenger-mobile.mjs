import{cpSync,mkdirSync,readFileSync,writeFileSync}from'node:fs';import{resolve}from'node:path';import './build-challenger.mjs';
const root=resolve(import.meta.dirname,'..'),out=resolve(root,'mobile-challenger/www');mkdirSync(out,{recursive:true});cpSync(resolve(root,'public/challenger'),out,{recursive:true});
// Native preview is offline/local-only. Never configure the production API host.
let html=readFileSync(resolve(out,'index.html'),'utf8');html=html.replace('<button id="lab">Playtest notes ↗</button>','<button id="lab" hidden>Playtest notes ↗</button>');writeFileSync(resolve(out,'index.html'),html);
writeFileSync(resolve(out,'analytics.mjs'),"export function track(){} export function once(){} export function sharing(){} export function readMetrics(){return {counts:{},share:false};}\n");
console.log('Packaged offline Bloppit Lab in mobile-challenger/www; production mobile/ untouched.');
