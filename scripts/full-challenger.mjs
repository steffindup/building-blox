// Checked presentation hooks: fail the build when the upstream engine changes.
export function fullChallenger(source) {
  let html=source;
  const hook=(from,to)=>{if(html.split(from).length!==2)throw Error(`Full challenger hook must match once: ${from}`);html=html.replace(from,to);};
  html=html.replaceAll('localStorage.','window.BloppitFull.storage.');
  hook('<script src="/challenger/vendor/three.min.js"></script>', '<script src="/challenger/vendor/three.min.js"></script><link rel="stylesheet" href="/full/style.css"><script src="/full/characters.js"></script><script src="/full/runtime.js"></script>');
  html=html.replace('/experiment/baseline.mjs','/experiment/full.mjs');
  html=html.replace('href="/site.webmanifest"','href="/full/site.webmanifest"').replace('href="/apple-touch-icon.png?v=3"','href="/full/icon.png"');
  hook('function m3(c,o){','function m3(c,o){ c=window.BloppitFull.worldColor(c);');
  hook('  ISL3.sc.add(W);','  window.BloppitFull.enrich(ISL3,o,{wear:accWear(o),colors:PUP_COLORS,grass:inPoly,shape:HOMEP,top:TOP3,stage:worldCount(o)});\n  ISL3.sc.add(W);');
  hook('isl3ReactStep(now); ISL3.r.render','isl3ReactStep(now); window.BloppitFull.update(ISL3,now,reduceMotion); ISL3.r.render');
  hook('function charReact(info){','function charReact(info){ window.BloppitFull.react(info===\'pup\'?\'pup\':info===\'bloppit\'?\'bloppit\':\'longtail\');');
  hook('function bloppitCheer(){','function bloppitCheer(){ window.BloppitFull.react(\'bloppit\');');
  hook('function budSay(cls,html){','function budSay(cls,html){ window.BloppitFull.bud(cls);');
  hook("  $('#pupPic').innerHTML=pupFig(prev,{ci:pupDraft.ci,vb:PUP_ROUND,par:'xMidYMid slice'});", "  $('#pupPic').innerHTML=pupFig(prev,{ci:pupDraft.ci,vb:PUP_ROUND,par:'xMidYMid slice'}); window.BloppitFull.portrait({pup:true,color:PUP_COLORS[pupDraft.ci].c,wear:accWear(prev),colors:PUP_COLORS});");
  hook("  $('#accPic').innerHTML=pupFig(prev,{vb:PUP_ROUND,par:'xMidYMid slice'});", "  $('#accPic').innerHTML=pupFig(prev,{vb:PUP_ROUND,par:'xMidYMid slice'}); window.BloppitFull.portrait({pup:true,color:PUP_COLORS[pupColorOf(o)].c,wear:accWear(prev),colors:PUP_COLORS});");
  hook('boat.add(pup); boat.position.set', 'boat.add(pup); window.BloppitFull.arrival(ISL3,boat,pup,{pup:true,color:PUP_COLORS[pupColorOf(o)].c,wear:accWear(o),colors:PUP_COLORS}); boat.position.set');
  hook('navStart();  //','window.BloppitFull.init();\nnavStart();  //');
  const replaceBetween=(a,b,text)=>{const begin=html.indexOf(a),end=html.indexOf(b,begin);if(begin<0||end<0)throw Error('Missing scenery hook');html=html.slice(0,begin)+text+'\n'+html.slice(end);};
  replaceBetween('function tree3(', 'function lamp3(', `function tree3(x,z,s,seed){s=s||1; const g=new THREE.Group();
    g.add(cyl3(.075*s,.15*s,.95*s,8,'#856646',0,0,0));
    for(let i=0;i<5;i++){const a=i*2.4+seed,canopy=mesh3(new THREE.SphereGeometry(1,12,9),m3(['#75a56b','#568966','#98b979'][i%3],{flatShading:false}),Math.cos(a)*.25*s,(1.15+(i%3)*.18)*s,Math.sin(a)*.24*s);canopy.scale.set(.42*s,.5*s,.42*s);g.add(canopy);}
    g.position.set(x,TOP3,z);return g;}`);
  replaceBetween('function cloud3(', 'function sparkle3(', `function cloud3(){const g=new THREE.Group();for(let i=0;i<5;i++){const c=new THREE.Mesh(new THREE.SphereGeometry(1.1+(i%2)*.5,12,8),new THREE.MeshStandardMaterial({color:0xffffff,roughness:1,transparent:true,opacity:.92}));c.position.set(i*1.15-2,(i%2)*.4,(i%3)*.4);c.scale.set(1,.65,1);g.add(c);}return g;}`);
  // Shared rooms, postcards and drawings reopen the same full challenger.
  html=html.replaceAll('/join/${','/challenger/?code=${').replaceAll('/p/w-${','/challenger/?p=w-${').replaceAll('/p/d-${','/challenger/?p=d-${').replaceAll('/p/start${familyCode?`?x=','/challenger/?p=start${familyCode?`&x=');
  return html;
}
