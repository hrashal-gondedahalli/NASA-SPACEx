/* Continuous Earth-Moon flight. Global state is geocentric J2000; body-relative
   telemetry changes frame without changing the spacecraft's global trajectory.
   Restricted Earth-Moon gravity plus differential solar gravity. */
(function(root,factory){if(typeof module==='object'&&module.exports)module.exports=factory(require('./physics.js'),require('./ephemeris.js'));else root.OrbitalExpedition=factory(root.OrbitalPhysics,root.OrbitalEphemeris);})(globalThis,(P,E)=>{
 'use strict';
 const {add,mul,dot,cross,length,unit,clamp}=P,sub=(a,b)=>add(a,mul(b,-1)),SOI=6610000,SUN_MU=1.32712440018e18;
 const DEFAULT={name:'Moon Explorer',payload:800,separator:true,legs:true,rcs:true,noseCone:true,heatShield:true,stages:[{tanks:6,tankSizes:Array(6).fill('large'),engines:3,engineType:'heavy'},{tanks:4,tankSizes:Array(4).fill('large'),engines:2,engineType:'standard'}]};
 const magnitude=(p,mu)=>mul(p,-mu/Math.max(1,length(p))**3);
 function center(s,name=s.body,time=s.time){return E.state(name,time,s.expedition.epoch);}
 function localize(s,choose=true){const x=s.expedition,m=center(s,'Moon'),r=length(sub(x.p,m.p));let body=s.body;if(choose){if(body==='Earth'&&r<SOI*.95)body='Moon';else if(body==='Moon'&&r>SOI*1.05)body='Earth';}if(body!==s.body){x.transitions.push({time:s.time,from:s.body,to:body,p:[...x.p],v:[...x.v]});s.body=body;s.orbit=false;s.orbitSeconds=0;}const c=body==='Moon'?m:{p:[0,0,0],v:[0,0,0]};s.p=sub(x.p,c.p);s.v=sub(x.v,c.v);return s;}
 function gravity(p,time,start){const m=E.state('Moon',time,start).p,sun=E.state('Sun',time,start).p;return add(magnitude(p,P.BODIES.Earth.mu),add(sub(magnitude(sub(p,m),P.BODIES.Moon.mu),magnitude(mul(m,-1),P.BODIES.Moon.mu)),sub(magnitude(sub(p,sun),SUN_MU),magnitude(mul(sun,-1),SUN_MU))));}
 function create(raw=P.DEFAULT,options={}){const s=P.create(raw,'launch'),start=E.epoch(options.epoch);s.scenario='expedition';const moon=E.state('Moon',0,start);s.p=mul(unit(moon.p),P.BODIES.Earth.radius);s.direction=unit(s.p);s.expedition={epoch:start,mode:options.mode==='advanced'?'advanced':'junior',p:[...s.p],v:[0,0,0],autopilot:'off',mission:'launch',transitions:[],plan:null,lastPlan:-Infinity,arrival:null};return s;}
 function stats(s){return P.stageStats({...s.design.stages[s.stage],boosters:s.stage===0&&!s.boostersDropped?s.design.stages[0].boosters:0});}
 function C(z){return z>1e-7?(1-Math.cos(Math.sqrt(z)))/z:z< -1e-7?(Math.cosh(Math.sqrt(-z))-1)/(-z):.5-z/24+z*z/720;}
 function S(z){return z>1e-7?(Math.sqrt(z)-Math.sin(Math.sqrt(z)))/Math.sqrt(z)**3:z< -1e-7?(Math.sinh(Math.sqrt(-z))-Math.sqrt(-z))/Math.sqrt(-z)**3:1/6-z/120+z*z/5040;}
 // Universal-variable, zero-revolution Lambert solution. Inputs and outputs are SI model units.
 function lambert(r1,r2,dt,mu=P.BODIES.Earth.mu,longWay=false){
  const a=length(r1),b=length(r2),cos=clamp(dot(r1,r2)/(a*b),-1,1),sin=(longWay?-1:1)*Math.sqrt(Math.max(0,1-cos*cos)),A=sin*Math.sqrt(a*b/Math.max(1e-12,1-cos));if(!Number.isFinite(dt)||dt<=0||Math.abs(A)<1e-6)return null;
  function sample(z){const c=C(z),ss=S(z);if(c<=0)return null;const y=a+b+A*(z*ss-1)/Math.sqrt(c);if(y<0)return null;return {y,t:(Math.pow(y/c,1.5)*ss+A*Math.sqrt(y))/Math.sqrt(mu)};}
  let lo=-4*Math.PI*Math.PI,hi=4*Math.PI*Math.PI-.00001,low=sample(lo);for(let i=0;i<60&&(!low||low.t>dt);i++){lo=(lo+0)/2;low=sample(lo);if(low&&low.t>dt)break;}
  // Find a valid low-time branch, then bisect monotonically in z.
  lo=-4*Math.PI*Math.PI;let valid=null;for(let i=0;i<=240;i++){const z=lo+(hi-lo)*i/240,q=sample(z);if(q&&q.t<=dt)valid={z,q};if(q&&q.t>=dt&&valid){lo=valid.z;hi=z;break;}}
  if(!valid)return null;let q;for(let i=0;i<65;i++){const z=(lo+hi)/2;q=sample(z);if(!q||q.t<dt)lo=z;else hi=z;}q=sample((lo+hi)/2);if(!q)return null;const f=1-q.y/a,g=A*Math.sqrt(q.y/mu),gd=1-q.y/b;if(Math.abs(g)<1e-9)return null;return {v1:mul(sub(r2,mul(r1,f)),1/g),v2:mul(sub(mul(r2,gd),r1),1/g),time:dt};
 }
 function plan(s,arrival=null){const x=s.expedition,moonNow=center(s,'Moon'),r=length(x.p),transfer=Math.PI*Math.sqrt(((r+length(moonNow.p))/2)**3/P.BODIES.Earth.mu),end=arrival??s.time+transfer;const moon=center(s,'Moon',end),normal=unit(cross(moon.p,moon.v)),offset=mul(unit(cross(normal,moon.v)),P.BODIES.Moon.radius+60000),target=add(moon.p,offset);let best=null;for(const longWay of [false,true]){const q=lambert(x.p,target,end-s.time,undefined,longWay);if(q){const dv=sub(q.v1,x.v),cost=length(dv);if(!best||cost<best.deltaV)best={...q,arrival:end,target,deltaV:cost,burn:dv,plannedAt:s.time,plannedPosition:[...x.p]};}}return best;}
 function departurePlan(s){const x=s.expedition,ghost={...s,p:[...s.p],v:[...s.v],fuel:[...s.fuel],direction:[...s.direction],throttle:0,expedition:{...x,p:[...x.p],v:[...x.v],autopilot:'off',transitions:[]}};let best=null;const period=2*Math.PI*Math.sqrt((length(s.p))**3/P.BODIES.Earth.mu),end=s.time+Math.min(6000,period*1.2);while(ghost.time<=end&&ghost.phase==='flying'){const q=plan(ghost);if(q&&(!best||q.deltaV<best.deltaV))best={...q,departure:ghost.time};for(let i=0;i<15;i++)step(ghost,{},2);}return best;}
 function command(s,action){const x=s.expedition;if(s.phase!=='flying')return false;
  if(action==='orbit'&&s.body==='Earth'){x.autopilot='orbit';x.mission='launch';return true;}
  if(action==='transfer'&&s.body==='Earth'&&P.telemetry(s).altitude>75000&&P.telemetry(s).periapsis>75000){const q=departurePlan(s);if(!q)return false;x.plan=q;x.departure=q.departure;x.arrival=q.arrival;x.lastPlan=s.time;x.autopilot='transfer';x.mission='departure';return true;}
  if(action==='capture'&&s.body==='Moon'){x.autopilot='capture';x.mission='capture';return true;}
  if(action==='land'&&s.body==='Moon'){x.autopilot='land';x.mission='descent';if(s.design.legs)s.legsDeployed=true;return true;}
  if(action==='manual'){x.autopilot='off';s.throttle=0;return true;}return false;
 }
 function aim(s,acceleration){const n=length(acceleration);s.direction=n>1e-8?unit(acceleration):unit(s.p);s.throttle=clamp(n*P.mass(s)/Math.max(1,stats(s).thrust),0,1);}
 function guidance(s){const x=s.expedition,t=P.telemetry(s),up=unit(s.p),moon=center(s,'Moon'),normal=unit(cross(moon.p,moon.v));let tangent=unit(cross(normal,up));if(length(tangent)<.5)tangent=P.basis(s).east;
  if(x.autopilot!=='off'&&s.fuel[s.stage]<=0&&s.stage===0&&s.design.separator)P.separate(s);
  if(x.autopilot==='orbit'){
   const pitch=clamp((t.altitude-1000)/42000,0,1)*Math.PI*.48;s.direction=unit(add(mul(up,Math.cos(pitch)),mul(tangent,Math.sin(pitch))));s.throttle=t.periapsis>76000?0:t.apoapsis>110000&&t.altitude<100000?0:1;
   if(t.periapsis>76000){x.autopilot='off';x.mission='earth-orbit';s.throttle=0;}
  }else if(x.autopilot==='transfer'){
   if(s.time<(x.departure??0)){s.throttle=0;x.mission='departure-window';return;}
   if(s.body==='Moon'&&length(s.p)<P.BODIES.Moon.radius+250000){x.autopilot='capture';x.mission='capture';guidance(s);return;}
   if(s.time-x.lastPlan>5||!x.plan){const q=plan(s,x.arrival);if(q){x.plan=q;x.lastPlan=s.time;}}
   if(x.arrival-s.time<10){x.autopilot='off';x.mission='encounter';s.throttle=0;return;}
   const q=x.plan,dv=q?sub(add(q.v1,mul(magnitude(q.plannedPosition,P.BODIES.Earth.mu),s.time-q.plannedAt)),x.v):[0,0,0];if(length(dv)<.6)s.throttle=0;else aim(s,mul(dv,1/4));
   if(length(x.p)>P.BODIES.Earth.radius+500000)x.mission='coast';
  }else if(x.autopilot==='capture'||x.autopilot==='land'){
   const land=x.autopilot==='land',targetR=P.BODIES.Moon.radius+30000,radial=dot(s.v,up),horizontal=sub(s.v,mul(up,radial)),tangentNow=length(horizontal)>1?unit(horizontal):tangent;
   const targetRadial=land?-Math.min(160,Math.max(.6,Math.sqrt(Math.max(0,t.altitude))*2.2)):clamp((targetR-length(s.p))/100,-80,80),targetHorizontal=land?0:Math.sqrt(P.BODIES.Moon.mu/length(s.p)),desired=add(mul(up,targetRadial),mul(tangentNow,targetHorizontal)),compensation=t.gravity-length(horizontal)**2/length(s.p);
   aim(s,add(mul(sub(desired,s.v),1/(land?(t.altitude<1000?.5:3):12)),mul(up,compensation)));
   if(!land&&Math.abs(t.altitude-30000)<800&&Math.abs(radial)<3&&Math.abs(t.horizontal-targetHorizontal)<3){x.autopilot='off';x.mission='lunar-orbit';s.throttle=0;}
  }
 }
 function step(s,input={},dt=1/120){
  if(s.phase!=='flying')return s;dt=clamp(dt,0,30);const x=s.expedition;
  localize(s);const b=P.BODIES[s.body],t=P.telemetry(s);if(x.autopilot!=='off')guidance(s);else{const rcs=s.design.rcs&&s.rcsFuel>0,steering=Math.abs(Number(input.pitch)||0)+Math.abs(Number(input.yaw)||0);if(rcs)s.rcsFuel=Math.max(0,s.rcsFuel-steering*.15*dt);s.pitch=clamp(s.pitch+(Number(input.pitch)||0)*(rcs?.65:.42)*dt,0,Math.PI);s.yaw+=(Number(input.yaw)||0)*(rcs?.85:.6)*dt;s.direction=input.hold==='prograde'&&t.speed>1?unit(s.v):input.hold==='retrograde'&&t.speed>1?mul(unit(s.v),-1):P.direction(s);}
  const st=stats(s),used=Math.min(s.fuel[s.stage],st.thrust*s.throttle/(st.isp*9.80665)*dt),force=dt?used*st.isp*9.80665/dt:0;s.fuel[s.stage]-=used;s.lastThrust=force;
  let extra=force?mul(s.direction,force/P.mass(s)):[0,0,0];const density=s.body==='Earth'?1.225*Math.exp(-t.altitude/8500):0;
  if(density&&t.speed){const drag=Math.min(t.speed/Math.max(dt,.0001),.5*density*t.speed*t.speed*(s.parachuteDeployed?1.4:s.design.noseCone||s.design.fairing&&!s.fairingDropped?.2:.28)*(s.parachuteDeployed?400:3)/P.mass(s));extra=sub(extra,mul(unit(s.v),drag));}
  if(!s.launched&&t.altitude<.1&&dot(add(gravity(x.p,s.time,x.epoch),extra),unit(s.p))<=0){s.time+=dt;return s;}
  s.launched=true;let heat=density*t.speed**3*2e-7;if(s.shield>0){s.shield=Math.max(0,s.shield-Math.max(0,heat-20)*.005*dt);heat*=.2;}s.temperature=clamp(s.temperature+(heat-8)*dt,0,2000);if(s.temperature>900)s.hull=Math.max(0,s.hull-(s.temperature-900)*.02*dt);
  const a0=add(gravity(x.p,s.time,x.epoch),extra),p=add(x.p,add(mul(x.v,dt),mul(a0,.5*dt*dt))),a1=add(gravity(p,s.time+dt,x.epoch),extra);x.p=p;x.v=add(x.v,mul(add(a0,a1),.5*dt));s.time+=dt;localize(s);const now=P.telemetry(s);s.maxAltitude=Math.max(s.maxAltitude,now.altitude);
  if(!s.hull){s.phase='crashed';s.message='Re-entry heating damaged the spacecraft.';}
  if(length(s.p)<=P.BODIES[s.body].radius){const impact=length(s.v),tilt=Math.acos(clamp(dot(s.direction,unit(s.p)),-1,1));s.p=mul(unit(s.p),P.BODIES[s.body].radius);const c=center(s);x.p=add(c.p,s.p);x.v=[...c.v];s.v=[0,0,0];s.phase=impact<=(s.legsDeployed?12:8)&&tilt<.35?'landed':'crashed';s.message=s.phase==='landed'?'Touchdown on '+s.body+'.':'Impact at '+impact.toFixed(1)+' m/s. Slow down and stay upright.';x.mission=s.phase;}
  if(s.phase!=='flying'){s.throttle=0;s.lastThrust=0;x.autopilot='off';}
  if(now.periapsis>b.atmosphere+5000&&Number.isFinite(now.apoapsis)){s.orbitSeconds+=dt;if(s.orbitSeconds>3)s.orbit=true;}else{s.orbitSeconds=0;s.orbit=false;}return s;
 }
 function advance(s,input={},seconds=0){let remaining=clamp(seconds,0,10000),count=0;while(remaining>1e-8&&s.phase==='flying'&&count++<2500){const t=P.telemetry(s);let max=t.altitude<3000?.05:t.altitude<100000?.25:Math.min(20,Math.sqrt(Math.max(1,length(s.p)**3/P.BODIES[s.body].mu))*.003);if(s.throttle>0||s.expedition.autopilot==='orbit'||['capture','land'].includes(s.expedition.autopilot))max=Math.min(max,.25);if(s.expedition.autopilot==='transfer'&&s.expedition.departure>s.time)max=Math.min(max,s.expedition.departure-s.time);const dt=Math.min(remaining,max);step(s,input,dt);remaining-=dt;}return {advanced:seconds-remaining,remaining};}
 function predict(s,count=240){
  const x=s.expedition,c=center(s),points=[[...s.p]],start=s.time,period=2*Math.PI*Math.sqrt(length(s.p)**3/P.BODIES[s.body].mu),span=x.autopilot==='transfer'?Math.min(200000,Math.max(6000,(x.arrival??start)-start+6000)):Math.min(15000,period*1.2);
  let p=[...x.p],v=[...x.v],time=start;
  for(let i=1;i<=count;i++){
   const end=start+span*i/count;
   while(time<end-1e-7){const moon=E.state('Moon',time,x.epoch).p,er=length(p),mr=length(sub(p,moon));if(er<=P.BODIES.Earth.radius||mr<=P.BODIES.Moon.radius)return points;const scale=Math.min(Math.sqrt(er**3/P.BODIES.Earth.mu),Math.sqrt(mr**3/P.BODIES.Moon.mu)),dt=Math.min(end-time,clamp(scale*.03,1,300)),a=gravity(p,time,x.epoch),next=add(p,add(mul(v,dt),mul(a,.5*dt*dt))),b=gravity(next,time+dt,x.epoch);v=add(v,mul(add(a,b),dt*.5));p=next;time+=dt;}
   points.push(sub(p,c.p));
  }return points;
 }
 function info(s){const x=s.expedition,moon=center(s,'Moon');return {mission:x.mission,autopilot:x.autopilot,epoch:x.epoch,date:E.date(s.time,x.epoch).toISOString(),mode:x.mode,globalPosition:[...x.p],globalVelocity:[...x.v],moonDistance:Math.max(0,length(sub(x.p,moon.p))-P.BODIES.Moon.radius),arrival:x.arrival,departure:x.departure??null,deltaV:x.plan?.deltaV??null,transitions:x.transitions.length};}
 return {SOI,DEFAULT,create,center,localize,gravity,lambert,plan,departurePlan,command,step,advance,predict,info};
});
