/* Bounded snap-stack editing. Changes always pass through the flight model normalizer. */
(function(root,factory){if(typeof module==='object'&&module.exports)module.exports=factory(require('./physics.js'));else root.RocketAssembly=factory(root.OrbitalPhysics);})(globalThis,P=>{
 const TWIN={name:'Twin Lift',finish:'classic',payload:800,separator:true,fairing:true,rcs:true,stages:[{tanks:3,tankSizes:['large','standard','small'],engines:3,engineType:'standard',boosters:2,radialSeparator:true},{tanks:2,tankSizes:['standard','small'],engines:1,engineType:'standard'}]};
 function parts(d){const a=[];d.stages.forEach((s,i)=>{for(let n=0;n<s.engines;n++)a.push({kind:'engine',stage:i,index:n,label:s.engineType+' engine '+(n+1)});s.tankSizes.forEach((type,n)=>a.push({kind:'tank',stage:i,index:n,label:type+' tank '+(n+1)}));for(let n=0;n<s.boosters;n++)a.push({kind:'booster',stage:i,index:n,label:'Side booster '+(n+1)});if(i===0&&d.separator)a.push({kind:'separator',stage:0,index:0,label:'Stage separator'});});a.push({kind:'payload',stage:1,index:0,label:'Crew capsule'});for(const key in P.ATTACHMENTS)if(d[key])a.push({kind:key,stage:key==='legs'?0:1,index:0,label:({heatShield:'Heat shield',noseCone:'Nose cone',rcs:'RCS pods',legs:'Landing legs'})[key]||key});if(d.stages[0].radialSeparator)a.push({kind:'radialSeparator',stage:0,index:0,label:'Side releases'});return a;}
 const same=(a,b)=>a&&b&&a.kind===b.kind&&a.stage===b.stage&&a.index===b.index;
 function edit(raw,selection,action){const d=P.design(raw),p=parts(d).find(p=>same(p,selection));if(!p)return null;const s=d.stages[p.stage];let selected={...p};
  if(action==='remove'){if(p.kind==='payload')return null;if(p.kind==='tank'){s.tankSizes.splice(p.index,1);s.tanks--;}else if(p.kind==='engine')s.engines--;else if(p.kind==='booster'){if(s.boosters===2)s.boosterSide=p.index===0?1:-1;s.boosters--;}else if(p.kind==='radialSeparator')s.radialSeparator=false;else if(p.kind==='separator')d.separator=false;else d[p.kind]=false;selected=null;}
  else if((action==='up'||action==='down')&&p.kind==='tank'){const to=p.index+(action==='up'?1:-1);if(to<0||to>=s.tanks)return null;[s.tankSizes[p.index],s.tankSizes[to]]=[s.tankSizes[to],s.tankSizes[p.index]];selected.index=to;}
  else return null;return {design:P.design(d),selected};
 }
 return {TWIN,parts,same,edit};
});
