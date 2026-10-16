import {MODELS,COLORS} from './game.mjs';
const T=globalThis.THREE;
export function createWorld(container,onSnap,onPet){
 const scene=new T.Scene(),renderer=new T.WebGLRenderer({antialias:true,alpha:true});
 renderer.setPixelRatio(Math.min(devicePixelRatio,1.65));renderer.outputEncoding=T.sRGBEncoding;renderer.toneMapping=T.ACESFilmicToneMapping;renderer.toneMappingExposure=1;renderer.shadowMap.enabled=true;renderer.shadowMap.type=T.PCFSoftShadowMap;container.append(renderer.domElement);
 const camera=new T.PerspectiveCamera(33,1,.1,150),look=new T.Vector3(),desired=new T.Vector3();
 scene.add(new T.HemisphereLight('#fff9df','#81bfc4',.7));const sun=new T.DirectionalLight('#fff1ce',1.2);sun.position.set(-8,15,8);sun.castShadow=true;sun.shadow.mapSize.set(2048,2048);Object.assign(sun.shadow.camera,{left:-15,right:15,top:15,bottom:-15,near:1,far:50});sun.shadow.bias=-.0005;sun.shadow.normalBias=.03;scene.add(sun);const fill=new T.DirectionalLight('#c8eafa',.35);fill.position.set(9,6,-9);scene.add(fill);
 const mats=new Map(), sphere=new T.SphereGeometry(1,32,24),cube=new T.BoxGeometry(1,1,1);
 function mat(color,roughness=.7){let key=color+roughness;if(!mats.has(key))mats.set(key,new T.MeshStandardMaterial({color:new T.Color(color).convertSRGBToLinear(),roughness}));return mats.get(key);}
 function mesh(g,m,parent,x=0,y=0,z=0,sx=1,sy=1,sz=1){const o=new T.Mesh(g,m);o.position.set(x,y,z);o.scale.set(sx,sy,sz);o.castShadow=true;o.receiveShadow=true;parent.add(o);return o;}
 const ball=(p,c,x,y,z,sx,sy=sx,sz=sx)=>mesh(sphere,mat(c),p,x,y,z,sx,sy,sz);
 const box=(p,c,x,y,z,sx,sy,sz)=>mesh(cube,mat(c,.4),p,x,y,z,sx,sy,sz);
 function cyl(p,c,x,y,z,r,h,r2=r){return mesh(new T.CylinderGeometry(r,r2,h,64),mat(c),p,x,y,z);}
 function line(p,points,c,r=.018){const curve=new T.CatmullRomCurve3(points.map(v=>new T.Vector3(...v)));return mesh(new T.TubeGeometry(curve,16,r,6,false),mat(c),p);}
 const island=new T.Group();scene.add(island);island.position.set(1,-.4,0);
 cyl(island,'#d4bb8c',0,-.75,0,5.6,1.3,4.8);cyl(island,'#ead4a0',0,-.13,0,5.62,.22,5.68);cyl(island,'#a4c67c',0,.03,0,5.42,.18,5.52);
 // Round, layered landforms, a sheltered blue cove and a winding stepping-stone path.
 ball(island,'#8eb76b',-2,.05,-2.5,2.5,.7,2);ball(island,'#9ebf79',2.8,.03,-2.1,2.1,.65,2.1);
 const sea=cyl(scene,'#8dcfd0',1,-1.55,0,7.6,.14);sea.material=mat('#9edbd8',.22);
 const ripples=[];for(let i=0;i<4;i++){const r=mesh(new T.TorusGeometry(6+i*.52,.018,6,100),mat('#d1eee3'),scene,1,-1.45+i*.008,0);r.rotation.x=-Math.PI/2;r.scale.y=.91;r.castShadow=false;ripples.push(r);}
 for(let i=0;i<12;i++){const z=3.5-i*.45,x=.5+Math.sin(i*.43)*1.2;const s=ball(island,i%2?'#e5d6ad':'#f5e6bd',x,.17,z,.34,.075,.23);s.rotation.y=i;}
 function tree(x,z,k=1){const g=new T.Group();g.position.set(x,.15,z);g.scale.setScalar(k);island.add(g);cyl(g,'#b68a65',0,.65,0,.13,1.3,.21);ball(g,'#6f9c65',0,1.65,0,.85,1,.8);ball(g,'#8eb574',-.42,1.9,.18,.63,.7,.64);ball(g,'#b2ce87',.28,2.3,.12,.55,.62,.52);for(let i=0;i<3;i++)ball(g,'#f1bd67',Math.sin(i*2)*.6,1.6+i*.2,.58,.11);return g;}
 const trees=[tree(-3.5,-1.8,1.35),tree(-2.5,-3.5,.9),tree(3.4,-2.3,1.15),tree(4.1,.2,.7)];
 for(let i=0;i<28;i++){let a=i*2.4,r=3.1+(i%5)*.38,x=Math.sin(a)*r,z=Math.cos(a)*r;if(z>2&&x<1)continue;ball(island,i%3?'#87ad68':'#b1c97e',x,.2,z,.16,.22,.15);if(i%3===0){for(let j=0;j<5;j++)ball(island,'#fff1bf',x+Math.cos(j*1.26)*.11,.4,z+Math.sin(j*1.26)*.11,.08,.045,.08);ball(island,'#eac373',x,.44,z,.06);}}
 for(let i=0;i<7;i++)ball(island,'#c4c7b0',Math.sin(i*3)*5.3,-.1,Math.cos(i*3)*5.3,.3,.22,.24);
 // A fully volumetric otter. Each expressive part has its own transform.
 const otter=new T.Group();island.add(otter);otter.position.set(1.4,.2,2.6);otter.rotation.y=.18;
 const body=new T.Group();otter.add(body);ball(body,'#9b6546',0,.92,0,.62,.9,.45);ball(body,'#efd3a2',0,.96,.36,.43,.62,.15);
 const tail=ball(body,'#8e593e',0,.25,-.7,.25,.24,.9);tail.rotation.x=-.2;
 [-1,1].forEach(s=>{ball(body,'#80513b',s*.32,.16,.22,.24,.17,.4);});
 const arms=[];[-1,1].forEach(s=>{const arm=new T.Group();arm.position.set(s*.5,1.35,.02);body.add(arm);const paw=ball(arm,'#9b6546',s*.13,-.3,.1,.2,.46,.23);paw.rotation.z=s*.35;ball(arm,'#b47c53',s*.23,-.58,.18,.19,.18,.2);arms.push(arm);});
 const head=new T.Group();head.position.set(0,1.88,0);body.add(head);ball(head,'#a97450',0,0,0,.76,.67,.58);
 [-1,1].forEach(s=>{ball(head,'#9b6546',s*.64,.36,-.03,.23,.25,.16);ball(head,'#dca581',s*.65,.36,.09,.13,.15,.06);});
 ball(head,'#f3dab0',0,-.2,.43,.58,.36,.2);
 const eyes=[],pupils=[],brows=[];
 [-1,1].forEach(s=>{const eye=new T.Group();eye.position.set(s*.285,.12,.47);head.add(eye);ball(eye,'#fff9e8',0,0,0,.23,.28,.13);const pupil=ball(eye,'#332d29',-.015,-.01,.11,.125,.175,.055);ball(pupil,'#fffdf6',-.25,.32,.88,.25,.24,.2);ball(eye,'#fffef9',-.047,.074,.165,.037);eyes.push(eye);pupils.push(pupil);const brow=ball(head,'#724932',s*.29,.44,.46,.22,.065,.07);brow.rotation.z=s*-.13;brows.push(brow);ball(head,'#e7b78e',s*.44,-.18,.57,.17,.1,.055);
 for(let i=0;i<3;i++)line(head,[[s*.31,-.23+i*.055,.62],[s*.62,-.2+i*.08,.59],[s*.86,-.17+i*.1,.49]],'#704e3d',.009);
 });
 ball(head,'#49352c',0,-.1,.67,.145,.105,.09);line(head,[[0,-.17,.67],[0,-.26,.65],[-.13,-.3,.625],[-.23,-.24,.6]],'#67442f',.018);line(head,[[0,-.26,.65],[.13,-.3,.625],[.23,-.24,.6]],'#67442f',.018);
 const mouth=ball(head,'#68412e',0,-.34,.585,.16,.09,.035);ball(mouth,'#df957e',0,-.35,.7,.62,.38,.4);
 // A sea-glass bandana keeps the character silhouette recognizable at small sizes.
 const scarf=cyl(body,'#4bafaa',0,1.48,.04,.43,.16);const knot=ball(body,'#68c2b4',.35,1.43,.34,.16);const tip=box(body,'#4bafaa',.31,1.2,.4,.22,.42,.08);tip.rotation.z=-.25;
 const clouds=[];for(let i=0;i<6;i++){const cloud=new T.Group();scene.add(cloud);cloud.position.set(-9+i*4,5+(i%2),-9-i%3);for(let j=0;j<3;j++)ball(cloud,'#fff8e5',j*.6,Math.sin(j)*.16,0,.7,.24,.35);clouds.push(cloud);}
 const buildGroup=new T.Group();scene.add(buildGroup);buildGroup.visible=false;buildGroup.position.set(2,0,1);const board=cyl(buildGroup,'#e1d6b7',0,-.18,0,3,.3);const boardTop=cyl(buildGroup,'#b9cbb0',0,-.01,0,2.9,.1);
 const placed=new T.Group(),ghost=new T.Group();buildGroup.add(placed,ghost);let ghostParts=[],lastBrick=null;
 function brick(parent,b,ghosted=false){const group=new T.Group();parent.add(group);group.position.set(b.x*.65,b.y*.42,b.z*.65);let m=mat(COLORS[b.color],.26);if(ghosted)m=new T.MeshStandardMaterial({color:new T.Color('#efa82c').convertSRGBToLinear(),emissive:'#805208',emissiveIntensity:.25,transparent:true,opacity:.8,roughness:.3,depthWrite:false});
 const block=mesh(cube,m,group,b.w*.325,.19,b.d*.325,b.w*.65-.035,.38,b.d*.65-.035);if(ghosted){const edges=new T.LineSegments(new T.EdgesGeometry(cube),new T.LineBasicMaterial({color:'#a76416'}));block.add(edges);}
 for(let x=0;x<b.w;x++)for(let z=0;z<b.d;z++)mesh(new T.CylinderGeometry(.19,.19,.08,16),m,group,(x+.5)*.65,.42,(z+.5)*.65);
 return group;}
 const landmarks=new T.Group();island.add(landmarks);let signature='';
 function disposeGroup(g){const geometries=new Set(),materials=new Set();g.traverse(o=>{if(o.geometry&&o.geometry!==sphere&&o.geometry!==cube)geometries.add(o.geometry);if(o.material&&!Array.from(mats.values()).includes(o.material))materials.add(o.material);});g.clear();geometries.forEach(v=>v.dispose());materials.forEach(v=>v.dispose());}
 function updateIsland(completed){if(signature===completed.join(','))return;signature=completed.join(',');disposeGroup(landmarks);completed.forEach(id=>{const m=MODELS.find(m=>m.id===id),g=new T.Group();landmarks.add(g);m.bricks.forEach(b=>brick(g,b));const pos={cottage:[-1.7,.2,-.6,.85],boat:[3.3,-.9,3.1,.65],garden:[-3,.2,2,.7],beacon:[2,.3,-2,1]}[id];g.position.set(...pos.slice(0,3));g.scale.setScalar(pos[3]);g.rotation.y=-.28;});}
 let mode='world',angle=0,motion=true,mood='idle',moodUntil=0,activeModel=null;
 function setBuild(model,step){mode='build';activeModel=model;island.visible=false;sea.visible=false;ripples.forEach(r=>r.visible=false);buildGroup.visible=true;disposeGroup(placed);disposeGroup(ghost);let width=Math.max(...model.bricks.map(b=>b.x+b.w)),depth=Math.max(...model.bricks.map(b=>b.z+b.d));placed.position.set(-width*.325,.06,-depth*.325);ghost.position.copy(placed.position);model.bricks.slice(0,step).forEach(b=>{lastBrick=brick(placed,b);});if(model.bricks[step]){brick(ghost,model.bricks[step],true);ghostParts=[];ghost.traverse(o=>{if(o.isMesh)ghostParts.push(o);});}scene.add(otter);otter.position.set(5.2,.03,0);otter.scale.setScalar(.85);otter.rotation.y=-.35;}
 function setWorld(completed){mode='world';activeModel=null;island.visible=true;sea.visible=true;ripples.forEach(r=>r.visible=true);buildGroup.visible=false;island.add(otter);otter.position.set(1.4,.2,2.6);otter.scale.setScalar(1.2);otter.rotation.y=.18;updateIsland(completed);}
 function emote(name){mood=name;moodUntil=performance.now()+2200;}
 const ray=new T.Raycaster(),pointer=new T.Vector2();let pointerX=0,pointerY=0;
 container.addEventListener('pointermove',e=>{pointerX=e.clientX/innerWidth-.5;pointerY=e.clientY/innerHeight-.5;});
 container.addEventListener('pointerup',e=>{const r=renderer.domElement.getBoundingClientRect();pointer.set((e.clientX-r.left)/r.width*2-1,-(e.clientY-r.top)/r.height*2+1);ray.setFromCamera(pointer,camera);if(mode==='build'&&ray.intersectObjects(ghostParts).length)onSnap();else if(ray.intersectObject(otter,true).length)onPet();});
 let last=performance.now(),frame=0,stopped=false,frames=0,frameTotal=0;
 function resize(){const w=container.clientWidth,h=container.clientHeight;renderer.setSize(w,h,false);camera.aspect=w/h;camera.updateProjectionMatrix();}new ResizeObserver(resize).observe(container);resize();
 function render(now){frame=requestAnimationFrame(render);if(document.hidden||stopped)return;let dt=Math.min((now-last)/1000,.05);last=now;frames++;frameTotal+=dt;const t=now/1000,small=container.clientWidth<760,anim=motion;if(now>moodUntil)mood='idle';
 let center=mode==='world'?new T.Vector3(small?1:-.7,small?1.5:0,0):new T.Vector3(small?2:.4,small?-3:.6,.6);let distance=mode==='world'?(small?36:24):(small?27:18);
 desired.set(center.x+Math.sin(.32+angle)*distance,mode==='world'?(small?20:16):(small?11:13),center.z+Math.cos(.32+angle)*distance);camera.position.lerp(desired,.07);look.lerp(center,.07);camera.lookAt(look);
 if(mode==='build')otter.position.x=small?4.1:5.2;const joy=mood==='happy'||mood==='wave',oops=mood==='oops';body.position.y=anim?(joy?Math.abs(Math.sin(t*7))*.2:Math.sin(t*2)*.025):0;body.rotation.z=anim&&joy?Math.sin(t*5)*.07:0;
 head.rotation.z=anim?(oops?Math.sin(t*9)*.14:Math.sin(t*.8)*.045):0;head.rotation.y=anim?pointerX*.17:0;head.rotation.x=anim?pointerY*.08:0;
 eyes.forEach((e,i)=>{const blink=anim&&t%4.7<.14;e.scale.y=blink?.07:1;pupils[i].position.x=-.015+(anim?pointerX*.05:0);brows[i].rotation.z=(i?1:-1)*(oops?.3:joy?-.25:-.13);});mouth.scale.y=.09*(joy?1.8:oops?1.4:.6);
 arms[0].rotation.z=anim&&joy?-1.3+Math.sin(t*9)*.25:Math.sin(anim?t*1.4:0)*.06;arms[1].rotation.z=anim&&(mood==='wave'||mode==='world')?.13+Math.sin(t*1.3)*.06:0;tail.rotation.y=anim?Math.sin(t*2)*.12:0;
 ghostParts.forEach(o=>o.material.opacity=anim?.7+Math.sin(t*3)*.12:.8);clouds.forEach((c,i)=>{if(anim)c.position.x=-9+i*4+Math.sin(t*.08+i)*.5;});renderer.render(scene,camera);}
 camera.position.set(8,16,24);render(performance.now());renderer.domElement.addEventListener('webglcontextlost',e=>{e.preventDefault();stopped=true;document.getElementById('fallback').hidden=false;});
 return {setWorld,setBuild,emote,rotate(d){angle+=d;},setMotion(v){motion=v;},metrics(){return {frames,meanFrameMs:Math.round(frameTotal/Math.max(1,frames)*1000),drawCalls:renderer.info.render.calls,triangles:renderer.info.render.triangles};},dispose(){cancelAnimationFrame(frame);renderer.dispose();}};
}


