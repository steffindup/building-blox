import * as THREE from 'three';

const palettes = {
  curiosity: [1.0, .37, .045],
  reverence: [.07, .82, .69],
  sorrow: [.53, .20, .92],
  awe: [1.0, .64, .12]
};

function prepareLights(root) {
  const lights = [], clones = new Map();
  root.traverse(node => {
    if (!node.isMesh) return;
    function cloneLight(source) {
      if (!['lufu_amber_light','Wisp_Gold','lufu_wisp_halo'].includes(source.name)) return source;
      if (clones.has(source)) return clones.get(source);
      const material = source.clone();
      const tint = {value:new THREE.Color(1,1,1)}, mix = {value:0};
      if (source.name === 'lufu_amber_light') {
        material.onBeforeCompile = shader => {
          shader.uniforms.lufuTint=tint;
          shader.uniforms.lufuMix=mix;
          shader.fragmentShader='uniform vec3 lufuTint; uniform float lufuMix;\n'+shader.fragmentShader;
          shader.fragmentShader=shader.fragmentShader.replace('#include <emissivemap_fragment>', [
            '#include <emissivemap_fragment>',
            'float lufuGlow = max(max(totalEmissiveRadiance.r,totalEmissiveRadiance.g),totalEmissiveRadiance.b);',
            'float lufuWeight = smoothstep(0.015,0.14,lufuGlow)*lufuMix;',
            'float lufuLuma = dot(diffuseColor.rgb, vec3(.30,.59,.11));',
            'diffuseColor.rgb=mix(diffuseColor.rgb,lufuTint*lufuLuma*1.45,lufuWeight);',
            'totalEmissiveRadiance=mix(totalEmissiveRadiance,lufuTint*lufuGlow,lufuWeight);'
          ].join('\n'));
        };
        material.customProgramCacheKey=()=> 'lufu-light-v1';
      }
      lights.push({material,source,tint,mix});clones.set(source,material);
      return material;
    }
    node.material=Array.isArray(node.material)?node.material.map(cloneLight):cloneLight(node.material);
  });
  return lights;
}

export class LufuController {
  constructor(gltf) {
    this.root=gltf.scene;
    this.mixer=new THREE.AnimationMixer(this.root);
    this.actions=Object.fromEntries(gltf.animations.map(c=>[c.name,this.mixer.clipAction(c)]));
    this.lights=prepareLights(this.root);
    this.play('idle');
  }
  play(name) {
    const action=this.actions[name];
    if(!action) throw new RangeError('Unknown lufu animation '+name);
    this.mixer.stopAllAction();
    this.current=action;this.name=name;
    action.reset().setLoop(name==='idle'?THREE.LoopRepeat:THREE.LoopOnce,name==='idle'?Infinity:1);
    action.clampWhenFinished=true;action.play();this.mixer.update(0);
    this.applyLight();this.resetOpenEyes();
  }
  resetOpenEyes(){
    if(this.name==='blink'||this.name==='idle')return;
    this.root.traverse(o=>{if(o.name.startsWith('lufu_lid_')&&o.morphTargetInfluences)o.morphTargetInfluences.fill(0)});
  }
  applyLight() {
    const palette=palettes[this.name];
    const phase=palette?Math.sin(Math.PI*this.current.time/this.current.getClip().duration)**2:0;
    for(const light of this.lights) {
      light.mix.value=phase;
      if(palette)light.tint.value.setRGB(...palette);
      if(light.source.name!=='lufu_amber_light'){
        light.material.color.copy(light.source.color).lerp(light.tint.value,phase);
        light.material.emissive.copy(light.source.emissive).lerp(light.tint.value,phase);
      }
    }
  }
  seek(fraction) {
    const action=this.current;action.paused=false;
    action.time=THREE.MathUtils.clamp(fraction,0,1)*action.getClip().duration;
    this.mixer.update(0);this.applyLight();this.resetOpenEyes();
  }
  update(dt) {
    if(!Number.isFinite(dt)||dt<0)throw new RangeError('Expected elapsed seconds');
    this.mixer.update(dt);this.applyLight();this.resetOpenEyes();
    if(this.current.paused&&this.name!=='idle')this.play('idle');
  }
  dispose(){
    this.mixer.stopAllAction();this.mixer.uncacheRoot(this.root);
    for(const {material} of this.lights)material.dispose();
  }
}
