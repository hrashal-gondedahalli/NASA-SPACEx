/* Deterministic local lunar survey. Metres/seconds, 1.62 m/s² jumping,
   height-field contact and circular boulder/lander bounds; no orbital changes. */
(function(root,factory){if(typeof module==='object'&&module.exports)module.exports=factory();else root.LunarSurface=factory();})(globalThis,()=>{
 'use strict';
 const VERSION=1,GRAVITY=1.62,LIMIT=210,clamp=(x,a,b)=>Math.max(a,Math.min(b,x)),distance=(a,b)=>Math.hypot(a.x-b.x,a.z-b.z);
 function random(seed){let n=seed>>>0;return ()=>{n+=0x6D2B79F5;let t=Math.imul(n^n>>>15,1|n);t^=t+Math.imul(t^t>>>7,61|t);return ((t^t>>>14)>>>0)/4294967296;};}
 function hash(text){let h=2166136261;for(const c of String(text))h=Math.imul(h^c.charCodeAt(0),16777619);return h>>>0;}
 const worlds=new Map();
 function world(seed){if(worlds.has(seed))return worlds.get(seed);const rng=random(seed),targets=[{id:'A',x:-24,z:-30},{id:'B',x:30,z:-58},{id:'C',x:-72,z:38},{id:'D',x:78,z:65}],craters=[{x:-28,z:-48,r:22},{x:48,z:30,r:18},{x:-90,z:-60,r:30},{x:96,z:-83,r:32}];
  for(let i=0;i<16;i++){const c={x:(rng()-.5)*350,z:(rng()-.5)*350,r:9+rng()*22};if(Math.hypot(c.x,c.z)>28)craters.push(c);}
  const rocks=[];const segmentDistance=(p,t)=>{const a=clamp((p.x*t.x+p.z*t.z)/(t.x*t.x+t.z*t.z),0,1);return Math.hypot(p.x-t.x*a,p.z-t.z*a);};
  for(let i=0;i<100;i++){const rock={x:(rng()-.5)*380,z:(rng()-.5)*380,r:.5+rng()*1.5,angle:rng()*Math.PI*2};if(Math.hypot(rock.x,rock.z)>22&&targets.every(t=>segmentDistance(rock,t)>rock.r+4))rocks.push(rock);}
  const structures=[{x:-9,z:-4,r:2.2},{x:-10,z:3,r:.6},{x:-8.9,z:3,r:.6},{x:-7.8,z:3,r:.6}];const w={targets,craters,rocks,structures};worlds.set(seed,w);if(worlds.size>20)worlds.delete(worlds.keys().next().value);return w;
 }
 function height(s,x,z){let h=Math.sin(x*.031)*.38+Math.cos(z*.027)*.25+Math.sin((x+z)*.09)*.06;
  for(const c of world(s.seed).craters){const d=Math.hypot(x-c.x,z-c.z)/c.r;if(d<1.8)h+=c.r*(.06*Math.exp(-(((d-.95)/.13)**2))-.08*Math.exp(-((d/.72)**4)));}
  const t=clamp((Math.hypot(x,z)-8)/8,0,1);return h*t*t*(3-2*t);
 }
 function slope(s,x,z){const a=(height(s,x+.4,z)-height(s,x-.4,z))/.8,b=(height(s,x,z+.4)-height(s,x,z-.4))/.8;return {x:a,z:b,angle:Math.atan(Math.hypot(a,b))};}
 function create(meta={},seed=hash(JSON.stringify(meta))){const s={version:VERSION,seed:seed>>>0,meta:{body:'Moon',scenario:String(meta.scenario||'moon').slice(0,30),date:String(meta.date||'').slice(0,40),earthDirection:Array.isArray(meta.earthDirection)&&meta.earthDirection.length===3&&meta.earthDirection.every(Number.isFinite)?meta.earthDirection.map(x=>clamp(x,-1,1)):[.45,.42,-.78]},phase:'active',paused:false,mode:'walk',time:0,oxygen:100,battery:100,walker:{x:8,z:0,y:0,vy:0,heading:Math.PI,distance:0},rover:{x:12,z:0,heading:Math.PI,speed:0,distance:0},samples:[],flag:null,waypoint:'A',event:null,nextEvent:45,eventCount:0,rescues:0,message:'Collect four samples, plant a flag and return to the ship.'};s.walker.y=height(s,8,0);return s;}
 function actor(s){return s.mode==='rover'?s.rover:s.walker;}
 function blocked(s,x,z,mode=s.mode){const radius=mode==='rover'?1.8:.4;if(Math.hypot(x,z)>LIMIT)return true;if(Math.hypot(x,z)<3.5+radius)return true;
  if(world(s.seed).structures.some(r=>Math.hypot(x-r.x,z-r.z)<r.r+radius))return true;
  if(world(s.seed).rocks.some(r=>Math.hypot(x-r.x,z-r.z)<r.r+radius))return true;
  if(mode==='walk'&&Math.hypot(x-s.rover.x,z-s.rover.z)<1.6+radius)return true;
  return slope(s,x,z).angle>(mode==='rover'?.66:.76);
 }
 function move(s,a,dx,dz){const candidates=[[a.x+dx,a.z+dz],[a.x+dx,a.z],[a.x,a.z+dz]];for(const [x,z]of candidates){if(!blocked(s,x,z)){const d=Math.hypot(x-a.x,z-a.z);a.x=x;a.z=z;a.distance+=d;return d;}}return 0;}
 function toggleVehicle(s){if(s.phase!=='active'||s.paused||s.event)return false;
  if(s.mode==='walk'){if(distance(s.walker,s.rover)>5||s.walker.y-height(s,s.walker.x,s.walker.z)>.3)return false;s.mode='rover';s.rover.speed=0;s.message='Rover ready. Brake before stepping out.';return true;}
  if(Math.abs(s.rover.speed)>1.5){s.message='Stop the rover before stepping out.';return false;}
  for(let i=0;i<8;i++){const a=s.rover.heading+Math.PI/2+i*Math.PI/4,x=s.rover.x+Math.sin(a)*3.2,z=s.rover.z+Math.cos(a)*3.2;if(!blocked(s,x,z,'walk')){s.mode='walk';s.walker={...s.walker,x,z,y:height(s,x,z),vy:0,heading:s.rover.heading};s.message='Suit ready. Walk to a glowing sample.';return true;}}
  s.message='Park in an open area to step out.';return false;
 }
 function plantFlag(s){if(s.phase!=='active'||s.paused||s.event||s.mode!=='walk'||s.flag||Math.hypot(s.walker.x,s.walker.z)<8||s.walker.y-height(s,s.walker.x,s.walker.z)>.3)return false;s.flag={x:s.walker.x,z:s.walker.z};s.battery=Math.max(0,s.battery-1);s.message='Flag planted. It stays still in the airless lunar environment.';return true;}
 function context(s){if(s.phase!=='active')return {action:'none',label:s.phase==='complete'?'Survey complete':'Rescue needed'};if(s.mode==='rover')return {action:'exit',label:'🚶 Step out',enabled:Math.abs(s.rover.speed)<=1.5};
  const sample=world(s.seed).targets.find(t=>!s.samples.includes(t.id)&&distance(s.walker,t)<3.5);if(sample)return {action:'sample',id:sample.id,label:'🔬 Collect '+sample.id,enabled:true};
  if(Math.hypot(s.walker.x,s.walker.z)<7)return {action:s.samples.length===4&&s.flag?'complete':'resupply',label:s.samples.length===4&&s.flag?'🚀 Board ship':'🔋 Refill supplies',enabled:true};
  if(distance(s.walker,s.rover)<=5)return {action:'board',label:'🛞 Drive rover',enabled:true};return {action:'none',label:'🔬 Move closer',enabled:false};
 }
 function interact(s){if(s.paused||s.event||s.phase!=='active')return {type:'none'};const c=context(s);
  if(c.action==='exit'||c.action==='board')return {type:toggleVehicle(s)?'vehicle':'none'};
  if(c.action==='sample'){s.samples.push(c.id);s.waypoint=world(s.seed).targets.find(t=>!s.samples.includes(t.id))?.id||'home';s.message='Sample '+c.id+' secured · '+s.samples.length+'/4';return {type:'sample',id:c.id};}
  if(c.action==='resupply'){s.oxygen=100;s.battery=100;s.message='Supplies refilled. Continue the survey.';return {type:'resupply'};}
  if(c.action==='complete'){s.phase='complete';s.rover.speed=0;s.message='Four samples and one flag. Survey complete!';return {type:'complete'};}return {type:'none'};
 }
 function respond(s,choice){if(!s.event||s.paused||s.phase!=='active')return false;if(choice==='check'){s.oxygen=Math.max(0,s.oxygen-2);s.message='Seal checked. Your suit is ready.';}else if(choice==='backup'){s.battery=Math.max(0,s.battery-10);s.oxygen=Math.min(100,s.oxygen+5);s.message='Backup supply connected.';}else return false;s.event=null;s.nextEvent=s.time+90;s.eventCount++;return true;}
 function rescue(s){if(s.phase!=='rescue')return false;s.phase='active';s.walker={x:8,z:0,y:height(s,8,0),vy:0,heading:Math.PI,distance:s.walker.distance};s.rover={x:12,z:0,heading:Math.PI,speed:0,distance:s.rover.distance};s.mode='walk';s.oxygen=100;s.battery=100;s.event=null;s.nextEvent=s.time+45;s.rescues++;s.message='Rescue complete. Your collected samples are safe.';return true;}
 function step(s,input={},dt=1/60){if(s.phase!=='active'||s.paused||s.event)return s;dt=clamp(Number(dt)||0,0,.05);if(!dt)return s;s.time+=dt;const turn=clamp(Number(input.turn)||0,-1,1),forward=clamp(Number(input.forward)||0,-1,1),a=actor(s);a.heading+=turn*dt*(s.mode==='rover'?.95:1.8);
  let speed;if(s.mode==='rover'){const target=forward*(forward<0?3:6),rate=(forward?2.4:4)*dt;s.rover.speed+=clamp(target-s.rover.speed,-rate,rate);speed=s.rover.speed;}else speed=forward*(forward<0?2.1:3.1);
  const moved=move(s,a,Math.sin(a.heading)*speed*dt,Math.cos(a.heading)*speed*dt);if(s.mode==='rover'){if(!moved&&Math.abs(speed)>.1)s.rover.speed=0;s.battery=Math.max(0,s.battery-dt*(.006+Math.abs(speed)*.007));s.walker.x=a.x;s.walker.z=a.z;s.walker.y=height(s,a.x,a.z)+1.8;s.walker.heading=a.heading;s.walker.vy=0;}
  else{const ground=height(s,a.x,a.z);if(input.jump&&a.y<=ground+.025&&Math.abs(a.vy)<.01)a.vy=2.4;a.vy-=GRAVITY*dt;a.y+=a.vy*dt;if(a.y<ground){a.y=ground;a.vy=0;}s.battery=Math.max(0,s.battery-dt*.002);}
  s.oxygen=Math.max(0,s.oxygen-dt*.04);if(!s.oxygen||!s.battery){s.phase='rescue';s.rover.speed=0;s.event=null;s.message='Reserve empty. A rescue pickup is ready.';}
  else if(s.time>=s.nextEvent&&s.samples.length<4){s.event={type:'suit',title:'Suit sensor alert',text:'Your oxygen sensor needs a quick check.'};s.rover.speed=0;}
  return s;
 }
 function advance(s,input={},seconds=0){let remaining=clamp(Number(seconds)||0,0,30);while(remaining>1e-8&&s.phase==='active'&&!s.paused&&!s.event){const dt=Math.min(1/60,remaining);step(s,input,dt);remaining-=dt;}return s;}
 function navigation(s){const a=actor(s),target=s.waypoint==='home'?{id:'home',x:0,z:0}:world(s.seed).targets.find(t=>t.id===s.waypoint&&!s.samples.includes(t.id))||world(s.seed).targets.find(t=>!s.samples.includes(t.id))||{id:'home',x:0,z:0};return {id:target.id,label:target.id==='home'?'Ship':'Sample '+target.id,distance:distance(a,target),bearing:Math.atan2(target.x-a.x,target.z-a.z)-a.heading,target};}
 function serialize(s){return JSON.stringify(s);}
 function restore(raw){try{const s=typeof raw==='string'?JSON.parse(raw):JSON.parse(JSON.stringify(raw));if(s.version!==VERSION||!Number.isInteger(s.seed)||s.seed<0||s.seed>4294967295||!['active','complete','rescue'].includes(s.phase)||!['walk','rover'].includes(s.mode))return null;
  for(const k of ['oxygen','battery'])if(!Number.isFinite(s[k])||s[k]<0||s[k]>100)return null;if(!Number.isFinite(s.time)||s.time<0||!Number.isFinite(s.nextEvent)||s.nextEvent<0)return null;
  for(const k of ['walker','rover']){const a=s[k];if(!a||!['x','z','heading','distance'].every(p=>Number.isFinite(a[p]))||Math.hypot(a.x,a.z)>LIMIT+1)return null;}if(!Number.isFinite(s.walker.y)||!Number.isFinite(s.walker.vy)||Math.abs(s.walker.y)>100||Math.abs(s.walker.vy)>20||!Number.isFinite(s.rover.speed)||Math.abs(s.rover.speed)>10)return null;
  if(!Array.isArray(s.samples)||s.samples.length>4||new Set(s.samples).size!==s.samples.length||s.samples.some(x=>!['A','B','C','D'].includes(x)))return null;if(s.flag&&(!Number.isFinite(s.flag.x)||!Number.isFinite(s.flag.z)||Math.hypot(s.flag.x,s.flag.z)>LIMIT))return null;
  if(s.phase==='complete'&&(s.samples.length!==4||!s.flag))return null;if(!s.meta||s.meta.body!=='Moon'||typeof s.meta.date!=='string')return null;s.meta={body:'Moon',scenario:String(s.meta.scenario||'moon').slice(0,30),date:s.meta.date.slice(0,40),earthDirection:Array.isArray(s.meta.earthDirection)&&s.meta.earthDirection.length===3&&s.meta.earthDirection.every(Number.isFinite)?s.meta.earthDirection.map(x=>clamp(x,-1,1)):[.45,.42,-.78]};s.waypoint=['A','B','C','D','home'].includes(s.waypoint)?s.waypoint:'A';s.paused=true;s.message=typeof s.message==='string'?s.message.slice(0,180):'Survey restored.';s.event=s.event?{type:'suit',title:'Suit sensor alert',text:'Your oxygen sensor needs a quick check.'}:null;
  s.eventCount=Number.isInteger(s.eventCount)&&s.eventCount>=0?s.eventCount:0;s.rescues=Number.isInteger(s.rescues)&&s.rescues>=0?s.rescues:0;return s;
 }catch{return null;}}
 return {VERSION,GRAVITY,LIMIT,create,world,height,slope,actor,blocked,advance,step,context,interact,toggleVehicle,plantFlag,respond,rescue,navigation,serialize,restore,hash};
});
