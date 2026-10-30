import * as THREE from 'three';

// 3D equivalent of the brief's main state machine. No Rive runtime is required.
export class BloppitController {
  constructor(gltf){
    this.root=gltf.scene;this.mixer=new THREE.AnimationMixer(this.root);
    this.actions=Object.fromEntries(gltf.animations.map(c=>[c.name,this.mixer.clipAction(c)]));
    this.loops=[this.actions.logo_idle?'logo_idle':'idle','garden','fish','read','campfire','doze'];
    this.reactions=['happy_hop','giggle_wiggle','surprised_jump','show_brick','look_at_you'];
    this.mode=0;this.react=0;this.current=null;this.queued=null;this.nextBlink=3+Math.random()*3;
    this.lids=[];this.root.traverse(o=>{if(/^Bloppit_(Lid|Lash)_/.test(o.name)&&o.morphTargetInfluences)this.lids.push(o)});
    this.blinkTime=null;
    this.props=Object.fromEntries(['Brick','WateringCan','FishingRod','Book','Monocle'].map(n=>[n,this.root.getObjectByName('Bloppit_'+n)]));
    this.stowed=new Set(['garden','fish','read']);
    this.brickTracks=new Map(gltf.animations.map(c=>[c.name,c.tracks.filter(t=>t.name.startsWith('Bloppit_Brick.')).map(t=>({property:t.name.split('.').pop(),sample:t.createInterpolant()}))]));
    this.finished=({action})=>{
      if(action!==this.current)return;
      if(this.queued){const next=this.queued;this.queued=null;this.play(next);}
      else this.base();
    };
    this.mixer.addEventListener('finished',this.finished);this.base();
  }
  base(){this.play(this.loops[this.mode]);}
  play(name){
    name=({greeting:'wave',hop:'happy_hop',oops:'surprised_jump',offer:'show_brick'})[name]||name;
    const action=this.actions[name];if(!action)throw Error(`Unknown animation: ${name}`);
    if(name==='blink'){
      if(this.mode===5||this.current===this.actions.wake)return;
      // Override the facial channels after the mixer, so base animation
      // weights cannot dilute a full blink to a half-closed eye.
      this.blinkTime=0;return;
    }
    this.queued=null;
    if(name==='wake')this.mode=0;
    // A short blend avoids a snap between resting and activity poses.
    const previous=this.current||this.activeBase;
    const outgoing=Object.values(this.actions).filter(a=>a!==this.actions.blink&&a.isRunning()||a!==this.actions.blink&&a.enabled&&a.getEffectiveWeight()>0&&(a===previous||this.blend?.weights.has(a)));
    const weights=new Map(outgoing.map(a=>[a,a.getEffectiveWeight()]));
    this.brickSnap=this.stowed.has(name)||outgoing.some(a=>this.stowed.has(a.getClip().name));
    for(const a of outgoing)a.stopFading();
    const loop=this.loops.includes(name)||['idle','focused'].includes(name);
    if(loop){if(this.loops.includes(name))this.mode=this.loops.indexOf(name);this.current=null;this.activeBase=action;this.queued=null;}
    else{this.current=action;this.activeBase=null;}
    action.reset().setEffectiveWeight(1).setEffectiveTimeScale(1).setLoop(loop?THREE.LoopRepeat:THREE.LoopOnce,loop?Infinity:1);
    action.clampWhenFinished=!loop;action.play();
    if(previous&&(previous!==action||[...weights.keys()].some(a=>a!==action))){
      action.setEffectiveWeight(weights.get(action)||0);
      if(!weights.has(action))weights.set(action,0);
      this.blend={weights,target:action,time:0,duration:loop?.24:.16};
    }else this.blend=null;
    this.mixer.update(1/240);
    this.applyOverlays(0);
  }
  setInput(name,value){
    if(name==='react'){
      if(!Number.isInteger(value)||value<0||value>4)throw Error('react must be 0–4');
      this.react=value;return;
    }
    if(name==='mode'){
      if(!Number.isInteger(value)||value<0||value>5)throw Error('mode must be 0–5');
      this.mode=value;this.base();return;
    }
    if(name==='poke'){
      this.queued=null;
      if(this.mode===5){this.mode=0;this.play('wake');return;}
      this.play('look_at_you');
      if(this.react!==4)this.queued=this.reactions[this.react];
      return;
    }
    if(name==='wake'){this.queued=null;this.mode=0;this.play('wake');return;}
    if(name==='wave'||name==='cheer'){this.queued=null;this.play(name);return;}
    throw Error(`Unknown input: ${name}`);
  }
  update(dt){
    if(this.blend){
      const b=this.blend;b.time+=dt;const u=Math.min(1,b.time/b.duration),t=u*u*(3-2*u);
      for(const [a,start] of b.weights)a.setEffectiveWeight(start*(1-t)+(a===b.target?t:0));
      if(u===1){for(const a of b.weights.keys())if(a!==b.target)a.stop();this.blend=null;}
    }
    this.mixer.update(dt);this.applyOverlays(dt);this.nextBlink-=dt;
    if(this.nextBlink<=0){this.play('blink');this.nextBlink=3+Math.random()*3;}
  }
  applyOverlays(dt){
    const name=(this.current||this.activeBase)?.getClip().name;
    // Discrete prop selection prevents tiny stowed props growing visibly
    // during a smooth pose blend. Body and held-prop positions still blend.
    for(const [key,ob] of Object.entries(this.props))if(ob){
      const show=key==='Brick'?name!=='hug':({WateringCan:'garden',FishingRod:'fish',Book:'read',Monocle:'focused'})[key]===name;
      ob.scale.setScalar(show?1:.0001);
    }
    // Never blend the brick through the torso between hand and back storage.
    if(this.stowed.has(name)||(this.blend&&this.brickSnap)){
      const action=this.current||this.activeBase;
      for(const t of this.brickTracks.get(name)||[])if(t.property!=='scale')this.props.Brick[t.property].fromArray(t.sample.evaluate(action.time));
    }
    if(name==='doze'||name==='wake'){this.blinkTime=null;return}
    if(this.blinkTime!==null){
      this.blinkTime+=dt;const u=this.blinkTime/(1/6);
      if(u>=1){this.blinkTime=null;return}
      const q=u<.4?u/.4:u<=.6?1:(1-u)/.4,b=q*q*(3-2*q);
      for(const ob of this.lids){const d=ob.morphTargetDictionary,a=ob.morphTargetInfluences;
        const half=b<.5?2*b:2-2*b,closed=Math.max(0,2*b-1);
        a[d.Half]=a[d.Half]*(1-b)+half*b;a[d.Closed]=a[d.Closed]*(1-b)+closed*b;
      }
    }
  }
  dispose(){this.mixer.removeEventListener('finished',this.finished);this.mixer.stopAllAction();this.mixer.uncacheRoot(this.root);}
}
