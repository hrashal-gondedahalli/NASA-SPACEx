import * as THREE from './vendor/three.module.min.js';
import { mergeGeometries } from './vendor/BufferGeometryUtils.js';

// Original parametric parts in metres. Shared by the catalogue, builder and flight.
// These are illustrative engineering models, not manufacturer CAD or specifications.
const P=window.OrbitalPhysics;
function batchPart(root){
 root.updateMatrixWorld(true);const inverse=root.matrixWorld.clone().invert(),batches=new Map(),originals=new Set();
 root.traverse(o=>{if(!o.isMesh)return;const g=o.geometry.clone().applyMatrix4(new THREE.Matrix4().multiplyMatrices(inverse,o.matrixWorld));if(!batches.has(o.material))batches.set(o.material,[]);batches.get(o.material).push(g);originals.add(o.geometry);});
 root.clear();for(const [material,geometries]of batches){const merged=mergeGeometries(geometries,false);if(!merged)throw Error('Incompatible part geometry');root.add(new THREE.Mesh(merged,material));geometries.forEach(g=>g.dispose());}originals.forEach(g=>g.dispose());return root;
}

export function createKit(finish='classic'){
 const steel=finish==='steel',thermal=finish==='thermal';
 const mat=(color,metalness=.25,roughness=.55)=>new THREE.MeshStandardMaterial({color,metalness,roughness});
 const m={hull:mat(steel?0xb8bec6:thermal?0xc58043:0xe7ecee,steel?.8:.28,steel?.3:.48),dark:mat(0x1b232b,.55,.42),tip:mat(steel?0x687480:0x18212b,.5,.4),band:mat(0x83919c,.7,.3),gold:mat(0xb99756,.65,.42),glass:mat(0x2c657a,.6,.2),white:mat(0xe8e9df),orange:mat(0xc77736)};
 function mesh(g,material,parent,x=0,y=0,z=0){const o=new THREE.Mesh(g,material);o.position.set(x,y,z);parent.add(o);return o;}
 function cylinder(parent,r,h,y,material=m.hull,top=r,x=0,z=0){return mesh(new THREE.CylinderGeometry(top,r,h,32),material,parent,x,y,z);}
 function ring(parent,r,y,material=m.band){const o=mesh(new THREE.TorusGeometry(r,.035,6,32),material,parent,0,y);o.rotation.x=Math.PI/2;return o;}
 function link(parent,a,b,r=.05,material=m.band){const v=new THREE.Vector3(...a),d=new THREE.Vector3(...b).sub(v),o=mesh(new THREE.CylinderGeometry(r,r,d.length(),8),material,parent);o.position.copy(v.add(d.clone().multiplyScalar(.5)));o.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0),d.normalize());return o;}
 function lathe(parent,profile,material){return mesh(new THREE.LatheGeometry(profile.map(([r,y])=>new THREE.Vector2(r,y)),40),material,parent);}
 function tank(type='standard'){
  const g=new THREE.Group(),h=P.TANKS[type].height,r=type==='slim'?.9:1.25;
  cylinder(g,r,h,h/2);ring(g,r+.015,.09);ring(g,r+.015,h-.09);cylinder(g,r+.018,.13,h*.17,m.dark);cylinder(g,r+.018,.055,h*.8,m.band);
  // A feed line, mounting brackets and flush access panel give scale without decals.
  link(g,[r+.06,.18,.18],[r+.06,h-.18,.18],.045,m.band);
  for(const y of [.28,h-.28])mesh(new THREE.BoxGeometry(.12,.1,.26),m.dark,g,r+.02,y,.18);
  mesh(new THREE.BoxGeometry(.42,.32,.028),m.band,g,0,h*.56,r+.008);
  mesh(new THREE.BoxGeometry(.28,.19,.035),m.hull,g,0,h*.56,r+.025);
  g.userData.height=h;return g;
 }
 function engine(type='standard'){
  const g=new THREE.Group(),scale=type==='small'?.7:type==='heavy'?1.15:1;
  const profile=[[.56,0],[.54,.07],[.45,.25],[.34,.52],[.23,.83],[.19,1.05],[.2,1.15],[.24,1.2]];
  lathe(g,profile,m.dark);const inner=lathe(g,[[.51,.025],[.40,.28],[.29,.57],[.18,.86],[.15,1.03]],m.band);inner.material.side=THREE.DoubleSide;
  ring(g,.56,.055);cylinder(g,.3,.25,1.3,m.gold);cylinder(g,.47,.2,1.5,m.dark);
  for(const x of [-.35,.35])link(g,[x,1.65,0],[x*.7,.9,0],.055,m.band);
  link(g,[.36,1.48,.22],[.38,.65,.22],.065,m.gold);
  cylinder(g,.18,.35,1.24,m.band,.18,.42,.1);g.scale.setScalar(scale);g.userData.height=1.7*scale;return g;
 }
 function ogive(r,h,material=m.tip){const g=new THREE.Group(),profile=[];for(let i=0;i<=18;i++){const t=i/18;profile.push([Math.max(.008,r*Math.cos(t*Math.PI/2)),h*t]);}lathe(g,profile,material);ring(g,r,.04);g.userData.height=h;return g;}
 function capsule(){const g=new THREE.Group();cylinder(g,1.25,2.5,1.25,m.hull,.9);cylinder(g,1.27,.18,.12,m.dark);for(const x of [-.42,.42]){const w=mesh(new THREE.BoxGeometry(.38,.44,.06),m.glass,g,x,1.5,1.03);w.rotation.y=x*.35;}ring(g,1.04,1.8);const top=ogive(.9,2.3,m.hull);top.position.y=2.5;g.add(top);g.userData.height=4.8;return g;}
 function fairing(){const g=new THREE.Group();cylinder(g,1.4,3,1.5,m.tip);const top=ogive(1.4,3.4);top.position.y=3;g.add(top);for(const x of [-1.4,1.4])link(g,[x,.18,0],[x,2.9,0],.018,m.band);ring(g,1.42,.1);g.userData.height=6.4;return g;}
 function booster(){const g=new THREE.Group();const e=engine('small');e.position.y=.45;g.add(e);cylinder(g,.72,.5,1.8,m.dark,.4);cylinder(g,.72,8,6);const top=ogive(.72,1.6);top.position.y=10;g.add(top);for(const y of [2.1,4.2,8.4,9.8]){cylinder(g,.735,.12,y,m.dark);}link(g,[.77,2.3,0],[.77,9.5,0],.035);g.userData.height=11.6;return g;}
 function part(id){
  if(id.startsWith('tank-')||id==='tanks')return tank(id==='tanks'?'standard':id.slice(5));
  if(id.startsWith('engine-')||id==='engines')return engine(id==='engines'?'standard':id.slice(7));
  if(id==='payload')return capsule();if(id==='fairing')return fairing();if(id==='noseCone')return ogive(.95,2);if(id==='boosters')return booster();
  const g=new THREE.Group();
  if(id==='separator'){cylinder(g,1.32,.35,.175,m.dark);ring(g,1.33,.08,m.gold);ring(g,1.33,.28,m.gold);for(let i=0;i<8;i++){const a=i*Math.PI/4;mesh(new THREE.BoxGeometry(.15,.25,.15),m.gold,g,Math.sin(a)*1.3,.18,Math.cos(a)*1.3);}}
  else if(id==='radialSeparator'){for(const y of [.3,1.4]){link(g,[-.9,y,0],[.9,y,0],.12,m.gold);mesh(new THREE.BoxGeometry(.2,1.5,.4),m.dark,g,-.9,.85);mesh(new THREE.BoxGeometry(.2,1.5,.4),m.dark,g,.9,.85);}}
  else if(id==='heatShield'){cylinder(g,1.36,.35,.18,m.dark,1.15);for(let i=0;i<3;i++)ring(g,.4+i*.35,.0,m.orange);}
  else if(id==='rcs'){mesh(new THREE.BoxGeometry(.45,.55,.65),m.gold,g,0,.3);for(const x of [-.38,.38])cylinder(g,.15,.36,.3,m.dark,.1,x).rotation.z=Math.PI/2;}
  else if(id==='legs'){link(g,[0,3,0],[2.4,0,.2],.09);link(g,[0,1.9,0],[2.4,0,.2],.045,m.gold);mesh(new THREE.BoxGeometry(.8,.15,.8),m.dark,g,2.4,0,.2);}
  else if(id==='parachute'){cylinder(g,.5,.5,.25,m.orange,.42);cylinder(g,.43,.08,.54,m.dark);}
  g.userData.height=id==='legs'?3:id==='radialSeparator'?1.8:.55;return g;
 }
 return {m,mesh,cylinder,ring,link,tank,engine,capsule,fairing,ogive,booster,part};
}

export function createRocket(d,state){
 const kit=createKit(d.finish),g=new THREE.Group();let y=0;const attach=(parent,part,kind,stage,index,offset=0)=>{batchPart(part);part.position.y+=offset;part.userData.part={kind,stage,index};parent.add(part);return part;};
 for(let i=state.stage;i<d.stages.length;i++){
  const st=d.stages[i],stage=new THREE.Group(),base=y;stage.userData.stage=i;g.add(stage);
  for(let e=0;e<st.engines;e++){const p=kit.engine(st.engineType),angle=e*Math.PI*2/st.engines;p.position.x=st.engines===1?0:Math.cos(angle)*.65;p.position.z=st.engines===1?0:Math.sin(angle)*.65;attach(stage,p,'engine',i,e,y);}
  if(st.engines){const flame=kit.mesh(new THREE.ConeGeometry(.65*st.engines,5,12),new THREE.MeshBasicMaterial({color:0xffae57,transparent:true,opacity:.88}),stage,0,y-2.2);flame.rotation.z=Math.PI;flame.name='flame';flame.userData.stage=i;flame.visible=false;}
  if(st.engines)kit.cylinder(stage,1.25,.35,y+1.825,kit.m.dark);
  y+=2;for(let n=0;n<st.tanks;n++){const p=kit.tank(st.tankSizes[n]);attach(stage,p,'tank',i,n,y);y+=p.userData.height;}
  if(i===0&&!state.boostersDropped)for(let n=0;n<st.boosters;n++){const p=kit.booster(),x=st.boosters===1?st.boosterSide*2.4:n===0?-2.4:2.4;p.position.x=x;attach(stage,p,'booster',0,n);if(st.radialSeparator){kit.link(p,[-x,4,0],[0,4,0],.1,kit.m.gold);kit.link(p,[-x,8,0],[0,8,0],.1,kit.m.gold);}}
  if(i===0&&d.separator){attach(stage,kit.part('separator'),'separator',i,0,y);y+=.35;const skirt=new THREE.Group();kit.cylinder(skirt,1.25,2,1,kit.m.hull);kit.ring(skirt,1.27,.05,kit.m.dark);kit.ring(skirt,1.27,1.95,kit.m.dark);attach(stage,skirt,'separator',i,0,y);}
  stage.userData.height=y-base;
 }
 const capsuleBase=y;attach(g,kit.capsule(),'payload',1,0,y);y+=4.8;
 if(d.noseCone){attach(g,kit.ogive(.95,2),'noseCone',1,0,y-1.2);y+=.8;}
 if(d.heatShield)attach(g,kit.part('heatShield'),'heatShield',1,0,capsuleBase-.35);
 if(d.fairing&&!state.fairingDropped){attach(g,kit.fairing(),'fairing',1,0,capsuleBase);y=Math.max(y,capsuleBase+6.4);}
 if(d.rcs)for(const x of [-1.2,1.2]){const p=kit.part('rcs');p.position.x=x;attach(g,p,'rcs',1,0,capsuleBase+.8);}
 if(d.legs)for(let i=0;i<4;i++){const angle=i*Math.PI/2+.5,p=new THREE.Group(),spread=state.legsDeployed?3.3:1.5;kit.link(p,[1.2,3,0],[spread,state.legsDeployed?-.25:1,0],.1);kit.link(p,[1.2,1.8,0],[spread,state.legsDeployed?-.25:1,0],.045,kit.m.gold);kit.mesh(new THREE.BoxGeometry(.8,.15,.8),kit.m.dark,p,spread,state.legsDeployed?-.25:1);p.rotation.y=angle;attach(g,p,'legs',0,i);}
 if(d.parachute){attach(g,kit.part('parachute'),'parachute',1,0,y);if(state.parachuteDeployed){const top=y+8;kit.mesh(new THREE.SphereGeometry(4,24,12,0,Math.PI*2,0,Math.PI/2),new THREE.MeshStandardMaterial({color:0xffaa5e,side:THREE.DoubleSide}),g,0,top);for(let i=0;i<8;i++){const a=i*Math.PI/4;kit.link(g,[0,y,0],[Math.cos(a)*4,top,Math.sin(a)*4],.025,kit.m.white);}y=top+4;}}
 g.scale.setScalar(.01);g.userData.height=y;return g;
}

export function renderCatalogue(items){
 // One short-lived renderer for every thumbnail, rather than one WebGL context per tile.
 let renderer;const kit=createKit();try{renderer=new THREE.WebGLRenderer({alpha:true,antialias:true});renderer.setSize(128,128);renderer.setPixelRatio(1);renderer.outputColorSpace=THREE.SRGBColorSpace;const scene=new THREE.Scene(),camera=new THREE.PerspectiveCamera(32,1,.01,100);scene.add(new THREE.HemisphereLight(0xffffff,0x65798a,2));const light=new THREE.DirectionalLight(0xfff3df,3);light.position.set(-3,5,6);scene.add(light);
  for(const item of items){const model=batchPart(kit.part(item.id));scene.add(model);model.rotation.y=-.35;const box=new THREE.Box3().setFromObject(model),size=box.getSize(new THREE.Vector3()),center=box.getCenter(new THREE.Vector3()),dist=Math.max(size.y,size.x,size.z)*2.25+.3;camera.position.copy(center).add(new THREE.Vector3(dist*.18,dist*.12,dist));camera.lookAt(center);renderer.render(scene,camera);const canvas=document.createElement('canvas');canvas.width=canvas.height=128;canvas.className='part-render';canvas.setAttribute('aria-hidden','true');canvas.getContext('2d').drawImage(renderer.domElement,0,0);document.querySelector('[data-add="'+item.id+'"] .part-art').replaceWith(canvas);scene.remove(model);model.traverse(o=>o.geometry?.dispose());}
 }catch(error){console.warn('Part thumbnails unavailable; catalogue labels remain usable.',error);}finally{Object.values(kit.m).forEach(m=>m.dispose());renderer?.dispose();renderer?.forceContextLoss();}
}
export function disposeModel(group){const geometries=new Set(),materials=new Set();group.traverse(o=>{if(o.geometry)geometries.add(o.geometry);for(const m of Array.isArray(o.material)?o.material:o.material?[o.material]:[])materials.add(m);});geometries.forEach(g=>g.dispose());materials.forEach(m=>m.dispose());}
