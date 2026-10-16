/* Challenger presentation adapter. The original game owns rules and progress. */
(function () {
  'use strict';
  const T=window.THREE,C=window.BloppitCharacters,prefix='bloppit-full-v2:';
  const storage={getItem(k){try{return window.localStorage.getItem(prefix+k);}catch{return null;}},setItem(k,v){window.localStorage.setItem(prefix+k,v);},removeItem(k){window.localStorage.removeItem(prefix+k);}};
  const palette={'#6CC24A':'#94bc78','#4E9E3A':'#6f9b5b','#4FB33A':'#75a56b','#3E9E36':'#568966','#5CC046':'#98b979','#EFE9DD':'#d9ccb4','#D9D1C2':'#bcad94','#F1DFBC':'#ecd9ac','#E3C99A':'#d8bd8b'};
  const col=hex=>new T.Color(hex).convertSRGBToLinear();
  let activeWorld=null,companion=null,companionMood='idle',portraitOptions={},portraitKey='',motion=!matchMedia('(prefers-reduced-motion: reduce)').matches;
  function scopedSettings(){try{return JSON.parse(storage.getItem('presentation'))||{};}catch{return {};}}
  const settings={quality:'balanced',...scopedSettings()};if(settings.motion===false)motion=false;
  function shadows(parent,size=.5){const canvas=document.createElement('canvas');canvas.width=canvas.height=64;const ctx=canvas.getContext('2d'),g=ctx.createRadialGradient(32,32,1,32,32,30);g.addColorStop(0,'rgba(44,61,39,.24)');g.addColorStop(1,'rgba(44,61,39,0)');ctx.fillStyle=g;ctx.fillRect(0,0,64,64);const m=new T.Mesh(new T.PlaneGeometry(size*2,size*1.4),new T.MeshBasicMaterial({map:new T.CanvasTexture(canvas),transparent:true,depthWrite:false}));m.rotation.x=-Math.PI/2;m.position.y=.025;parent.add(m);}
  function enrich(I,o,meta){
    activeWorld=I;for(const old of I.fullRigs||[])old.rig.root.traverse(x=>{if(x.material){x.material.map?.dispose();x.material.dispose();}});I.fullRigs=[];
    const pairs=[[I.bloppit,I.bloppitSprite,'bloppit'],[I.pupG,I.pupG?.children[0],'pup'],[I.longtail,I.longtailSprite,'longtail']];
    for(const [group,sprite,type] of pairs){if(!group||!sprite)continue;const h=sprite.scale.y||2.2;
      const colors=meta.colors||[],ci=Number.isInteger(o.pupColor)?o.pupColor:2,accent=colors[ci]?.c||'#55b5ac';
      const rig=type==='longtail'?C.createLongtail({height:h,kind:I.longtail?.userData.info?.includes('hard')?'squint':I.longtail?.userData.info?.includes('medium')?'swoop':'scraps'}):C.createOtter({world:true,height:h,pup:type==='pup',color:type==='pup'?accent:'#4eaaa1',wear:type==='pup'?meta.wear:{},colors});
      sprite.visible=false;rig.root.position.y=sprite.position.y;group.add(rig.root);shadows(rig.root,.64);I.fullRigs.push({group,sprite,rig,type});
    }
    // Additional scenery is deterministic and never modifies saved progression.
    const flora=new T.Group(),sphere=new T.SphereGeometry(1,8,6),grassMat=new T.MeshStandardMaterial({color:col('#739b5a'),roughness:1}),flowerMat=new T.MeshStandardMaterial({color:col('#ffe6a6'),roughness:.8});
    for(let i=0;i<42;i++){const a=i*2.39996,r=4.8+(i%7)*.29,x=Math.cos(a)*r,z=Math.sin(a)*r;if(!meta.grass(x,z,meta.shape))continue;
      const grass=new T.Mesh(new T.ConeGeometry(.065,.26+(i%3)*.08,5),grassMat);grass.position.set(x,meta.top+.13,z);grass.rotation.z=Math.sin(i)*.2;flora.add(grass);
      if(i%4===0){const flower=new T.Mesh(sphere,flowerMat);flower.scale.set(.12,.055,.12);flower.position.set(x,meta.top+.28,z);flora.add(flower);}}
    I.world.add(flora);
    if(!I.fullWater){I.fullWater={value:0};I.sea.material.roughness=.34;I.sea.material.onBeforeCompile=shader=>{shader.uniforms.fullTime=I.fullWater;shader.vertexShader='varying vec3 fullWorld;\n'+shader.vertexShader;shader.vertexShader=shader.vertexShader.replace('#include <begin_vertex>','#include <begin_vertex>\n fullWorld=(modelMatrix*vec4(position,1.0)).xyz;');shader.fragmentShader='uniform float fullTime; varying vec3 fullWorld;\n'+shader.fragmentShader;shader.fragmentShader=shader.fragmentShader.replace('#include <color_fragment>','#include <color_fragment>\n float wave=sin(fullWorld.x*1.6+fullTime*.5)+sin(fullWorld.z*2.1-fullTime*.35); diffuseColor.rgb+=smoothstep(1.7,2.0,wave)*.035;');};I.sea.material.needsUpdate=true;}
    I.r.toneMapping=T.ACESFilmicToneMapping;I.r.toneMappingExposure=1.12;
    I.r.setPixelRatio(settings.quality==='low'?.8:Math.min(devicePixelRatio||1,settings.quality==='high'?2:1.4));
    I.r.shadowMap.enabled=settings.quality!=='low'&&!/[?&]lite3d=1/.test(location.search);
    document.documentElement.dataset.fullWorldStage=String(meta.stage);
  }
  function update(I,now,reduced){
    const quiet=reduced||!motion;if(I.fullWater)I.fullWater.value=quiet?0:now/1000;
    for(const entry of I.fullRigs||[]){const {rig,sprite,group}=entry;const pos=group.getWorldPosition(new T.Vector3());rig.root.position.y=sprite.position.y;rig.root.rotation.y=Math.atan2(I.cam.position.x-pos.x,I.cam.position.z-pos.z);rig.root.rotation.z=sprite.material.rotation||0;rig.update(now,quiet,0);if(entry.type==='bloppit'&&I.dozing)rig.pose('sleep',200);}
  }
  function react(type,pose='happy'){for(const e of activeWorld?.fullRigs||[])if(e.type===type)e.rig.pose(pose,2000);}
  function arrival(I,group,sprite,options){const rig=C.createOtter({...options,world:true,height:sprite.scale.y});sprite.visible=false;group.add(rig.root);I.fullRigs.push({group,sprite,rig,type:'arrival'});}
  function portrait(options){portraitOptions=options;}
  function bud(pose){companionMood=pose||'idle';companion?.rig.pose(companionMood);}
  function createCompanion(){
    const host=document.querySelector('.hm-hello');if(!host)return;
    const canvas=document.createElement('canvas');canvas.className='full-companion';canvas.setAttribute('aria-hidden','true');
    let renderer;try{renderer=new T.WebGLRenderer({canvas,alpha:true,antialias:true});}catch{return;}
    renderer.outputEncoding=T.sRGBEncoding;renderer.toneMapping=T.ACESFilmicToneMapping;renderer.setPixelRatio(Math.min(devicePixelRatio,1.5));
    const scene=new T.Scene(),camera=new T.PerspectiveCamera(28,1,.1,30),rig=C.createOtter({height:2.6});scene.add(rig.root);rig.root.rotation.y=-.1;
    scene.add(new T.HemisphereLight('#fff8df','#adc8bb',.8));const key=new T.DirectionalLight('#fff3d7',1.1);key.position.set(-3,5,6);scene.add(key);const rim=new T.DirectionalLight('#d7efff',.45);rim.position.set(4,3,-3);scene.add(rim);
    // Portraits use the same original 3D rig as the in-world character.
    renderer.setSize(144,144,false);camera.position.set(0,1.5,4.4);camera.lookAt(0,1.45,0);rig.update(1000,true);renderer.render(scene,camera);
    const portraitURL=canvas.toDataURL();
    for(const el of document.querySelectorAll('.hm-tile .ic')){const mode=el.closest('[data-go]')?.dataset.go;const variant=mode==='cpu'?C.createLongtail({height:2.5,kind:'swoop'}):C.createOtter({height:2.6,pup:mode!=='quick',color:mode==='brain'?'#7c83bb':mode==='friend'?'#dfaa58':'#4baea8',wear:mode==='brain'?{face:['glasses',0],head:['beanie',0]}:mode==='friend'?{head:['beanie',0]}:mode==='otter'?{neck:['scarf',0]}:mode==='mp'?{head:['straw',0]}:mode==='code'?{head:['sailor',0]}:{}});rig.root.visible=false;scene.add(variant.root);variant.update(1000,true);renderer.render(scene,camera);const img=document.createElement('img');img.src=canvas.toDataURL();img.alt='';el.replaceChildren(img);scene.remove(variant.root);if(variant.dispose)variant.dispose();else variant.root.traverse(x=>{x.geometry?.dispose();x.material?.dispose();});}rig.root.visible=true;
    const brand=document.querySelector('.brand img');if(brand)brand.src=portraitURL;
    companion={renderer,rig,scene,camera};document.documentElement.classList.add('full-companion-ready');let last=0,place=null,width=0,height=0,previewRig=null;
    function frame(now){requestAnimationFrame(frame);if(document.hidden||now-last<50)return;last=now;
      const home=!document.querySelector('#view-home')?.hidden,build=!document.querySelector('#view-build')?.hidden;
      const wardrobe=document.querySelector('#accDlg')?.open,preview=document.querySelector('#pupDlg')?.open||wardrobe;
      const target=preview?document.querySelector(wardrobe?'#accPic':'#pupPic'):home?host:build?document.querySelector('#buddy .bud-art'):null;if(!target||target.closest('[hidden]'))return;
      if(place!==target||canvas.parentElement!==target){target.append(canvas);place=target;}
      if(preview&&JSON.stringify(portraitOptions)!==portraitKey){portraitKey=JSON.stringify(portraitOptions);if(previewRig){scene.remove(previewRig.root);previewRig.dispose();}previewRig=C.createOtter({...portraitOptions,height:2.6});scene.add(previewRig.root);}
      rig.root.visible=!preview;if(previewRig)previewRig.root.visible=preview;
      const w=canvas.clientWidth||180,h=canvas.clientHeight||210;if(width!==w||height!==h){renderer.setSize(w,h,false);width=w;height=h;}camera.aspect=w/h;camera.position.set(0,1.3,preview?5.4:6.4);camera.lookAt(0,1.25,0);camera.updateProjectionMatrix();(preview&&previewRig?previewRig:rig).update(now,!motion,0);renderer.render(scene,camera);
    }
    requestAnimationFrame(frame);canvas.addEventListener('click',()=>{rig.pose('wave',2200);react('bloppit','wave');});
  }
  function init(){
    document.documentElement.classList.add('full-challenger');
    const hello=document.querySelector('.hm-hello');if(hello){const title=document.createElement('div');title.className='full-welcome';title.innerHTML='<span class="full-eyebrow">ONE BRICK. A WORLD OF POSSIBILITIES.</span><h1>Build a little<br>wonder.</h1><p>Make something wonderful.<br>Make this little world your own.</p>';hello.prepend(title);}
    const menu=document.querySelector('.hm-main');if(menu){const title=document.createElement('div');title.className='full-menu-title';title.innerHTML='<span class="full-eyebrow">THE WORKSHOP</span><h2>What shall we build today?</h2>';menu.prepend(title);}
    const footer=document.querySelector('.appfoot');if(footer){const button=document.createElement('button');button.className='ghost';button.textContent='World settings';button.id='fullSettings';footer.append(' · ',button);button.onclick=openSettings;}
    createCompanion();
    const mode=location.hash.slice(1)||'home';window.dispatchEvent(new CustomEvent('full-ready',{detail:{mode}}));
  }
  function openSettings(){
    let d=document.getElementById('fullOptions');if(!d){d=document.createElement('dialog');d.id='fullOptions';d.innerHTML='<form method="dialog"><button class="ghost" style="float:right">Close</button></form><h2>Make yourself at home.</h2><p>Choose how your world feels on this device.</p><label><input type="checkbox" id="fullMotion"> Character and water animation</label><label>Graphics <select id="fullQuality"><option value="low">Lighter · older devices</option><option value="balanced">Balanced</option><option value="high">Detailed</option></select></label><p>Game progress is separate from the original Bloppit and the first prototype. Use Who’s playing → Grown-ups for recovery and transfers.</p><button id="fullExport" class="ghost">Download presentation settings</button><p><a href="/experiment/">Grown-up A/B playtest</a></p>';document.body.append(d);d.querySelector('#fullMotion').onchange=e=>{motion=e.target.checked;settings.motion=motion;storage.setItem('presentation',JSON.stringify(settings));};d.querySelector('#fullQuality').onchange=e=>{settings.quality=e.target.value;storage.setItem('presentation',JSON.stringify(settings));if(activeWorld){activeWorld.r.setPixelRatio(settings.quality==='low'?.8:Math.min(devicePixelRatio,settings.quality==='high'?2:1.4));activeWorld.r.shadowMap.enabled=settings.quality!=='low';activeWorld.dirty=true;}};d.querySelector('#fullExport').onclick=()=>{const a=document.createElement('a'),url=URL.createObjectURL(new Blob([JSON.stringify(settings)],{type:'application/json'}));a.href=url;a.download='bloppit-settings.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);};}
    d.querySelector('#fullMotion').checked=motion;d.querySelector('#fullQuality').value=settings.quality;d.showModal();
  }
  window.BloppitFull={storage,worldColor:c=>palette[c]||c,enrich,update,react,bud,init,arrival,portrait,settings,version:'2.0.0',get rigs(){return activeWorld?.fullRigs||[];}};
})();
