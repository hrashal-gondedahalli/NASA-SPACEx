/* Original educational orbital model. SI units; planet radii reduced 10x,
   surface gravity retained. Three-dimensional translation; assisted attitude. */
(function(root,factory){if(typeof module==='object'&&module.exports)module.exports=factory();else root.OrbitalPhysics=factory();})(globalThis,()=>{
 'use strict';
 const clamp=(x,a,b)=>Math.min(b,Math.max(a,x));
 const add=(a,b)=>a.map((v,i)=>v+b[i]),mul=(a,k)=>a.map(v=>v*k),dot=(a,b)=>a.reduce((v,x,i)=>v+x*b[i],0),length=a=>Math.hypot(...a),unit=a=>mul(a,1/(length(a)||1));
 const cross=(a,b)=>[a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]];
 const BODIES={Earth:{radius:637100,g:9.81,atmosphere:70000,color:0x285b91},Moon:{radius:173740,g:1.62,atmosphere:0,color:0x999fa9}};
 Object.values(BODIES).forEach(b=>b.mu=b.g*b.radius*b.radius);
 const DEFAULT={name:'Pioneer',payload:800,stages:[{tanks:3,engines:2},{tanks:2,engines:1}]};
 function design(raw=DEFAULT){return {name:typeof raw?.name==='string'?raw.name.slice(0,24):'Pioneer',payload:clamp(Number(raw?.payload)||800,200,3000),stages:[0,1].map(i=>({tanks:clamp(Math.round(Number(raw?.stages?.[i]?.tanks)||0),0,4),engines:clamp(Math.round(Number(raw?.stages?.[i]?.engines)||0),0,3)}))};}
 function stageStats(stage){return {dry:stage.tanks*300+stage.engines*500+150,fuel:stage.tanks*4000,thrust:stage.engines*160000,isp:310};}
 function specs(d){const stages=d.stages.map(stageStats);const mass=d.payload+stages.reduce((a,s)=>a+s.dry+s.fuel,0);let remaining=mass,dv=0;for(const s of stages){if(s.thrust&&s.fuel)dv+=s.isp*9.80665*Math.log(remaining/(remaining-s.fuel));remaining-=s.fuel+s.dry;}return {mass,deltaV:dv,twr:stages[0].thrust/(mass*9.81),stages};}
 function validate(d,body='Earth'){const a=specs(d),issues=[];d.stages.forEach((s,i)=>{if(!s.tanks||!s.engines)issues.push('Stage '+(i+1)+' needs at least one tank and engine.');});if(a.stages[0].thrust/(a.mass*BODIES[body].g)<=1.05)issues.push('Add engines or remove tanks: launch thrust must exceed weight.');return issues;}
 function create(raw=DEFAULT,scenario='launch'){
  const d=design(raw),body=scenario==='moon'?'Moon':'Earth',b=BODIES[body];const orbit=scenario==='orbit';
  return {design:d,body,scenario,p:[0,b.radius+(scenario==='moon'?1200:orbit?90000:0),0],v:[orbit?Math.sqrt(b.mu/(b.radius+90000)):0,scenario==='moon'?-25:0,0],direction:[0,1,0],pitch:0,yaw:0,throttle:0,stage:0,fuel:d.stages.map(s=>stageStats(s).fuel),phase:'ready',time:0,maxAltitude:0,orbit:false,orbitSeconds:0,launched:scenario!=='launch',message:'Ready for flight',lastThrust:0};
 }
 function mass(s){return s.design.payload+s.design.stages.slice(s.stage).reduce((a,t,i)=>a+stageStats(t).dry+s.fuel[s.stage+i],0);}
 function basis(s){const up=unit(s.p);let east=unit(cross([0,0,1],up));if(length(east)<.1)east=[1,0,0];east=mul(east,-1);return {up,east,north:unit(cross(east,up))};}
 function direction(s){const {up,east,north}=basis(s);return unit(add(mul(up,Math.cos(s.pitch)),mul(add(mul(east,Math.cos(s.yaw)),mul(north,Math.sin(s.yaw))),Math.sin(s.pitch))));}
 function telemetry(s){const b=BODIES[s.body],r=length(s.p),altitude=Math.max(0,r-b.radius),radial=dot(s.v,unit(s.p)),speed=length(s.v),horizontal=Math.sqrt(Math.max(0,speed*speed-radial*radial));const h=length(cross(s.p,s.v)),energy=speed*speed/2-b.mu/r,ecc=Math.sqrt(Math.max(0,1+2*energy*h*h/(b.mu*b.mu))),a=energy<0?-b.mu/(2*energy):Infinity;const periapsis=h*h/(b.mu*(1+ecc))-b.radius,apoapsis=Number.isFinite(a)?a*(1+ecc)-b.radius:Infinity;return {altitude,radial,horizontal,speed,periapsis,apoapsis,mass:mass(s),gravity:b.mu/r**2,circularSpeed:Math.sqrt(b.mu/r),fuel:s.fuel.slice(s.stage).reduce((a,x)=>a+x,0),fuelCapacity:s.design.stages.slice(s.stage).reduce((a,x)=>a+stageStats(x).fuel,0)};}
 function separate(s){if(s.phase!=='flying'||s.stage>=s.design.stages.length-1)return false;s.stage++;s.message='Stage separated. Upper engine ready.';return true;}
 function step(s,input={},dt=1/120){
  if(s.phase!=='flying')return s;dt=clamp(dt,0,1/30);const b=BODIES[s.body],t=telemetry(s);s.time+=dt;
  s.pitch=clamp(s.pitch+(Number(input.pitch)||0)*.42*dt,0,Math.PI);s.yaw+=(Number(input.yaw)||0)*.6*dt;
  if(input.hold==='prograde'&&t.speed>1)s.direction=unit(s.v);else if(input.hold==='retrograde'&&t.speed>1)s.direction=mul(unit(s.v),-1);else s.direction=direction(s);
  const st=stageStats(s.design.stages[s.stage]);let force=st.thrust*clamp(s.throttle,0,1);const used=Math.min(s.fuel[s.stage],force/(st.isp*9.80665)*dt);force=used*st.isp*9.80665/(dt||1);s.fuel[s.stage]-=used;s.lastThrust=force;
  let acceleration=mul(s.p,-b.mu/length(s.p)**3);if(force)acceleration=add(acceleration,mul(s.direction,force/mass(s)));
  // Exponential atmosphere, point-mass drag. No lift or rotating atmosphere.
  if(b.atmosphere&&t.altitude<b.atmosphere&&t.speed>0){const density=1.225*Math.exp(-t.altitude/8500),drag=Math.min(t.speed/(dt||1),.5*density*t.speed*t.speed*.28*3/mass(s));acceleration=add(acceleration,mul(unit(s.v),-drag));}
  if(!s.launched&&t.altitude<.1&&dot(acceleration,unit(s.p))<=0){s.v=[0,0,0];return s;}
  s.launched=true;s.v=add(s.v,mul(acceleration,dt));s.p=add(s.p,mul(s.v,dt));const now=telemetry(s);s.maxAltitude=Math.max(s.maxAltitude,now.altitude);
  if(length(s.p)<=b.radius){s.p=mul(unit(s.p),b.radius);const tilt=Math.acos(clamp(dot(s.direction,unit(s.p)),-1,1));s.phase=now.speed<=8&&tilt<.35?'landed':'crashed';s.message=s.phase==='landed'?'Soft landing confirmed.':'Impact at '+now.speed.toFixed(1)+' m/s. Aim below 8 m/s and keep upright.';s.throttle=0;s.lastThrust=0;s.v=[0,0,0];}
  if(now.periapsis>b.atmosphere+5000&&Number.isFinite(now.apoapsis)){s.orbitSeconds+=dt;if(s.orbitSeconds>3)s.orbit=true;}else s.orbitSeconds=0;
  return s;
 }
 function predict(s,steps=300,dt=8){const b=BODIES[s.body];let p=[...s.p],v=[...s.v];const points=[p];for(let i=0;i<steps;i++){const r=length(p);v=add(v,mul(p,-b.mu/r**3*dt));p=add(p,mul(v,dt));points.push(p);if(length(p)<=b.radius)break;}return points;}
 return {BODIES,DEFAULT,design,specs,validate,create,mass,basis,direction,telemetry,separate,step,predict,add,mul,dot,length,unit,cross,clamp};
});
