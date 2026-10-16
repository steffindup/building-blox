/* Original Bloppit character rigs. Three r128; no downloaded character assets.
 * All parts are owned by each rig. Semantic poses work in the world, portrait
 * renderer and building companion. Geometry never depends on game state. */
(function () {
  'use strict';
  const T = window.THREE;
  const color = hex => new T.Color(hex).convertSRGBToLinear();
  function createOtter(options = {}) {
    const root = new T.Group(), body = new T.Group(), head = new T.Group();
    root.add(body); body.add(head); head.position.set(0, 1.82, .02);
    const sphere = new T.SphereGeometry(1, options.world?18:32, options.world?12:24), materials = new Map();
    function material(hex, roughness = .76) {
      const key = hex + roughness;
      if (!materials.has(key)) materials.set(key, new T.MeshStandardMaterial({color: color(hex), roughness}));
      return materials.get(key);
    }
    function shape(parent, hex, position, scale, roughness) {
      const m = new T.Mesh(sphere, material(hex, roughness));
      m.position.set(...position); m.scale.set(...scale); m.castShadow = true; m.receiveShadow = true; parent.add(m); return m;
    }
    function tube(parent, hex, points, radius = .012) {
      const curve = new T.CatmullRomCurve3(points.map(p => new T.Vector3(...p)));
      const mesh = new T.Mesh(new T.TubeGeometry(curve, 20, radius, 6, false), material(hex));
      parent.add(mesh); return mesh;
    }
    const fur = options.pup ? '#b88457' : '#915c3e', warm = options.pup ? '#d19c6a' : '#ad764e';
    const cream = '#f5dcae', dark = '#4d332a', ink = '#22252a';
    // Pear-shaped body and long flattened otter tail, rather than a bear silhouette.
    const profile = [[0,.12],[.3,.15],[.49,.35],[.56,.7],[.51,1.05],[.39,1.4],[.24,1.55],[0,1.59]].map(([r,y]) => new T.Vector2(r,y));
    const torso = new T.Mesh(new T.LatheGeometry(profile, 40), material(fur));torso.scale.z=.78;torso.castShadow=true;body.add(torso);
    shape(body,cream,[0,.83,.37],[.385,.58,.13]);
    const tail=new T.Group();tail.position.set(0,.23,-.22);body.add(tail);
    const tailCurve=new T.CatmullRomCurve3([new T.Vector3(0,0,0),new T.Vector3(.08,-.06,-.5),new T.Vector3(.34,-.08,-1.1),new T.Vector3(.48,-.06,-1.6)]);
    const tailMesh=new T.Mesh(new T.TubeGeometry(tailCurve,20,.16,12,false),material(fur));tailMesh.scale.y=.6;tailMesh.castShadow=true;tail.add(tailMesh);
    const arms=[],eyes=[],brows=[],pupils=[];
    for(const side of [-1,1]) {
      const foot=shape(body,dark,[side*.3,.13,.23],[.24,.14,.37]);foot.rotation.y=side*-.12;
      for(let i=0;i<3;i++)tube(body,'#b5825b',[[side*.3+(i-1)*.08,.18,.5],[side*.3+(i-1)*.08,.15,.56]],.008);
      const arm=new T.Group();arm.position.set(side*.43,1.31,0);body.add(arm);
      const upper=shape(arm,fur,[side*.12,-.25,.02],[.19,.34,.19]);upper.rotation.z=side*.28;
      shape(arm,warm,[side*.17,-.48,.16],[.19,.2,.21]);
      for(let i=0;i<3;i++)shape(arm,warm,[side*.16+(i-1)*.065,-.51,.29],[.048,.09,.04]);arms.push(arm);
    }
    // Broad muzzle, cheek pads and a shallow forehead taper give a distinct otter face.
    shape(head,warm,[0,0,0],[.69,.57,.54]);
    shape(head,fur,[0,.27,-.15],[.59,.35,.43]);
    for(const side of [-1,1]) {
      shape(head,fur,[side*.61,.23,-.08],[.19,.22,.15]);
      shape(head,'#d9977d',[side*.62,.23,.035],[.115,.145,.05]);
      shape(head,cream,[side*.24,-.21,.43],[.34,.245,.17]);
      shape(head,'#e9b890',[side*.47,-.17,.42],[.14,.1,.065]);
      const eye=new T.Group();eye.position.set(side*.27,.1,.43);head.add(eye);
      shape(eye,dark,[0,0,-.01],[.245,.29,.11]);
      shape(eye,'#fff9e8',[0,0,.035],[.217,.257,.11]);
      const pupil=new T.Group();pupil.position.set(-side*.015,-.018,.135);eye.add(pupil);
      shape(pupil,'#6f5a42',[0,0,0],[.122,.163,.035]);shape(pupil,ink,[0,0,.025],[.085,.126,.021],.15);
      shape(pupil,'#fffef5',[-.038,.062,.048],[.035,.045,.013],.1);shape(pupil,'#fffef5',[.031,-.045,.047],[.012,.015,.009],.1);
      eyes.push(eye);pupils.push(pupil);
      const brow=shape(head,dark,[side*.27,.39,.43],[.21,.052,.055]);brow.rotation.z=side*-.11;brows.push(brow);
      for(let i=0;i<3;i++)tube(head,'#715242',[[side*.3,-.22+i*.045,.59],[side*.61,-.2+i*.065,.6],[side*.83,-.15+i*.085,.5]],.006);
      for(let i=0;i<3;i++)shape(head,'#9e7858',[side*(.26+i*.055),-.2+(i%2)*.05,.595],[.012,.012,.007]);
    }
    shape(head,dark,[0,-.105,.614],[.135,.085,.072],.36);shape(head,'#96715b',[-.035,-.078,.666],[.04,.016,.008],.2);
    const jaw=new T.Group();head.add(jaw);jaw.position.set(0,-.32,.47);
    shape(jaw,cream,[0,0,0],[.3,.13,.13]);
    const mouth=shape(head,'#4e302c',[0,-.29,.588],[.145,.065,.035]);
    shape(mouth,'#e99388',[0,-.2,.82],[.63,.46,.22]);
    tube(head,dark,[[-.23,-.24,.575],[-.11,-.29,.615],[0,-.245,.627],[.11,-.29,.615],[.23,-.24,.575]],.012);
    // Three small sculpted fur tufts, no texture-card dependency.
    for(let i=0;i<3;i++){const tuft=shape(head,warm,[(i-1)*.11,.49,-.02],[.085,.16,.12]);tuft.rotation.z=(i-1)*-.3;}
    const held=new T.Group();held.position.set(0,.87,.56);body.add(held);
    const brickColor=options.pup?(options.color||'#3dabb1'):'#df5244';
    const brick=new T.Mesh(new T.BoxGeometry(options.pup?.38:.62,.28,.32),material(brickColor,.3));brick.castShadow=true;held.add(brick);
    for(const x of options.pup?[0]:[-.17,.17]){const stud=new T.Mesh(new T.CylinderGeometry(.09,.09,.07,20),material(brickColor,.3));stud.position.set(x,.17,0);held.add(stud);}
    const accessories=new T.Group();body.add(accessories);
    const wear=options.wear||{},neck=wear.neck?.[0],hat=wear.head?.[0],face=wear.face?.[0],accent=options.color||'#4baea8';
    const outfitColor=slot=>options.colors?.[wear[slot]?.[1]]?.c||accent;
    if(neck==='scarf'||!options.pup){const scarf=new T.Mesh(new T.TorusGeometry(.31,.075,10,40),material(outfitColor('neck')));scarf.rotation.x=Math.PI/2;scarf.position.y=1.43;accessories.add(scarf);const end=shape(accessories,outfitColor('neck'),[.25,1.24,.32],[.09,.27,.045]);end.rotation.z=-.2;}
    if(neck==='bowtie')for(const side of [-1,1])shape(accessories,outfitColor('neck'),[side*.1,1.36,.38],[.13,.08,.045]);
    if(hat){const hats=new T.Group();head.add(hats);hats.position.y=.47;
      const hc=hat==='crown'?'#e6ae48':hat==='straw'?'#dfbd74':hat==='sailor'?'#f4eed9':outfitColor('head');
      if(hat==='crown'){const crown=new T.Mesh(new T.CylinderGeometry(.38,.37,.16,10,1,true),material(hc,.3));crown.position.y=.12;hats.add(crown);for(let i=0;i<5;i++){const a=i*Math.PI*.4;shape(hats,hc,[Math.cos(a)*.36,.25,Math.sin(a)*.36],[.06,.12,.06]);}}
      else{shape(hats,hc,[0,.08,-.07],[.45,hat==='beanie'?.24:.13,.39]);if(hat==='beanie')shape(hats,hc,[0,.35,-.07],[.09,.09,.09]);else shape(hats,hc,[0,-.015,.01],[hat==='straw'?.63:.47,.035,.47]);}}
    if(face==='glasses'){for(const side of [-1,1])shape(head,'#294853',[side*.27,.1,.56],[.24,.2,.035],.12);tube(head,dark,[[-.07,.1,.6],[0,.14,.62],[.07,.1,.6]],.026);}
    let pose='idle',until=0;
    root.scale.setScalar((options.height||2.5)/2.6);
    root.userData.character='otter';root.userData.original=true;
    const api={root,pose(name,duration=1800){pose=name||'idle';until=performance.now()+duration;},update(time,reduced=false,gaze=0){
      if(performance.now()>until)pose='idle';const happy=/happy|cheer|hug|wave|reach/.test(pose),think=/think|focus|point/.test(pose),oops=/oops|mistake/.test(pose),sleep=pose==='sleep';
      const t=time/1000,k=reduced?0:1;
      body.position.y=k*(happy?Math.abs(Math.sin(t*6))*.085:Math.sin(t*2.1)*.018);
      body.rotation.z=k*(happy?Math.sin(t*5)*.035:0);
      head.rotation.set(think?.09:sleep?.16:0,k*(gaze*.16+Math.sin(t*.55)*.035),oops?k*Math.sin(t*8)*.1:think?-.12:k*Math.sin(t*.8)*.025);
      const blink=sleep?.08:!reduced&&t%4.1<.13?.08:1;
      eyes.forEach((eye,i)=>{eye.scale.y=blink;pupils[i].position.x=(i?-.015:.015)+gaze*.035;brows[i].rotation.z=(i?1:-1)*(oops?.3:happy?-.2:think?.08:-.11);});
      mouth.scale.y=happy?.11:oops?.085:.04;jaw.position.y=-.32-(happy?.035:0);
      arms[0].rotation.z=happy?k*(-1.2+Math.sin(t*8)*.2):think?.5:.7;arms[0].rotation.x=-.45;
      arms[1].rotation.z=happy?-.55:-.7;arms[1].rotation.x=think?-.6:-.45;
      held.rotation.z=k*(happy?Math.sin(t*5)*.07:0);tail.rotation.y=k*Math.sin(t*1.7)*.07;
    },dispose(){const gs=new Set(),ms=new Set();root.traverse(o=>{if(o.geometry)gs.add(o.geometry);if(o.material)ms.add(o.material);});gs.forEach(g=>g.dispose());ms.forEach(m=>m.dispose());}};
    return api;
  }
  function createLongtail({height=2.1,kind='scraps'}={}) {
    const root=new T.Group(),sphere=new T.SphereGeometry(1,24,16),mats={};
    const mat=c=>mats[c]||(mats[c]=new T.MeshStandardMaterial({color:color(c),roughness:.65}));
    const egg=(p,c,x,y,z,a,b,d)=>{const m=new T.Mesh(sphere,mat(c));m.position.set(x,y,z);m.scale.set(a,b,d);m.castShadow=true;p.add(m);return m;};
    egg(root,'#fff4db',0,.75,0,.43,.61,.32);const head=new T.Group();head.position.set(0,1.43,.06);root.add(head);egg(head,'#fff9e9',0,0,0,.46,.43,.4);
    const wings=[];for(const s of [-1,1]){const w=new T.Group();w.position.set(s*.32,1.05,0);root.add(w);const mesh=egg(w,'#e3ddd0',s*.12,-.26,-.06,.16,.43,.13);mesh.rotation.z=s*.2;wings.push(w);egg(head,'#292d32',s*.17,.04,.35,.077,.1,.04);egg(head,'#ffffff',s*.17-.02,.075,.385,.02,.028,.012);egg(root,'#e6a34b',s*.18,.13,.15,.16,.09,.24);}
    const beak=new T.Mesh(new T.ConeGeometry(.11,.48,20),mat('#edac49'));beak.rotation.x=Math.PI/2;beak.position.set(0,-.1,.52);head.add(beak);
    for(const s of [-1,1]){const feather=egg(root,'#fdf6e5',s*.09,.33,-.68,.06,.06,.8);feather.rotation.y=s*.1;}
    if(kind==='swoop'){for(const s of [-1,1]){const ring=new T.Mesh(new T.TorusGeometry(.115,.025,8,24),mat('#936743'));ring.position.set(s*.17,.04,.39);head.add(ring);}}
    if(kind==='squint'){const ring=new T.Mesh(new T.TorusGeometry(.12,.015,8,24),mat('#dcac57'));ring.position.set(.17,.04,.4);head.add(ring);}
    if(kind==='scraps'){const tuft=egg(head,'#ded5c2',-.06,.43,-.04,.055,.17,.07);tuft.rotation.z=-.3;}
    root.scale.setScalar(height/2);root.userData.character='longtail';let until=0;
    return {root,pose(){until=performance.now()+1400;},update(time,reduced){const t=time/1000,k=reduced?0:1,happy=performance.now()<until;head.rotation.z=k*Math.sin(t*.9)*.045;wings.forEach((w,i)=>w.rotation.z=(i?1:-1)*k*(happy?.9+Math.sin(t*12)*.25:.1+Math.sin(t*2)*.05));}};
  }
  window.BloppitCharacters={createOtter,createLongtail};
})();
