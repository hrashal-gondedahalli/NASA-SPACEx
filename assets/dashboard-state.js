/* Read-only dashboard projection. Existing apps retain ownership of their saves. */
(function(root,factory){if(typeof module==='object'&&module.exports)module.exports=factory();else root.DashboardState=factory();})(globalThis,()=>{
 const integer=(v,max=1000000)=>Number.isInteger(v)&&v>=0?Math.min(v,max):0;
 function read(storage,key){try{const raw=storage.getItem(key);return raw?JSON.parse(raw):null;}catch{return null;}}
 function snapshot({storage,academySave=null,physics=null,surface=null,outpost=null}={}){
  let storageAvailable=true;try{storage.getItem('junior-orbital-lab-v1');}catch{storageAvailable=false;}
  const orbital=read(storage,'junior-orbital-lab-v1'),legacy=academySave||read(storage,'juniorAstronautSave')||{},records=orbital?.records||{};
  let design=null,stats=null,ready=false;
  if(physics&&orbital?.design&&typeof orbital.design==='object'&&Array.isArray(orbital.design.stages)&&orbital.design.stages.length===2){try{design=physics.design(orbital.design);stats=physics.specs(design);ready=physics.validate(design).length===0;}catch{design=null;}}
  let survey=null,base=null;try{const raw=storage.getItem('junior-lunar-surface-v1');if(raw&&surface)survey=surface.restore(raw);}catch{}
  try{const raw=storage.getItem('junior-outpost-v1');if(raw&&outpost)base=outpost.restore(raw);}catch{}
  const land=records.moon===true||!!survey,explore=records.moonSurface===true||survey?.phase==='complete',orbit=records.orbit===true;
  const steps=[{id:'build',label:'Build',done:ready},{id:'launch',label:'Launch',done:orbit||land||(Number.isFinite(records.maxAltitude)&&records.maxAltitude>100)},{id:'orbit',label:'Orbit',done:orbit},{id:'land',label:'Land',done:land},{id:'explore',label:'Explore',done:explore}];
  const voyages=Array.isArray(legacy.academy?.voyages)?new Set(legacy.academy.voyages.filter(x=>x==='Moon'||x==='Earth Orbit')).size:0;
  return {storageAvailable,design,stats,ready,steps,orbit,land,explore,survey:survey?{samples:survey.samples.length,flag:!!survey.flag,phase:survey.phase}:null,outpost:base?{day:base.day,status:base.status,badge:base.badge}:null,xp:integer(legacy.academy?.xp),voyages,completed:steps.filter(x=>x.done).length};
 }
 return {read,snapshot};
});
