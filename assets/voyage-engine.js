/* Deterministic, fixed-step educational flight model. Distances are game units. */
(function(root,factory){if(typeof module==='object'&&module.exports)module.exports=factory();else root.VoyageEngine=factory();})(typeof globalThis!=='undefined'?globalThis:this,()=>{
 'use strict';
 const W=1900,H=540,R=16,DOCK={x:1770,y:270,r:76};
 const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
 function create(destination='Earth Orbit'){return {destination,stage:'travel',phase:'ready',x:90,y:270,vx:0,vy:0,angle:0,fuel:100,hull:100,time:0,invulnerable:0,gates:[{x:470,y:270,r:82,done:false},{x:920,y:205,r:82,done:false},{x:1370,y:320,r:82,done:false}],obstacles:[{x:650,y:150,r:38},{x:740,y:410,r:48},{x:1110,y:355,r:40},{x:1210,y:100,r:36},{x:1545,y:160,r:46}],message:'',collisions:0};}
 const speed=s=>Math.hypot(s.vx,s.vy);
 function fail(s,message){s.phase='failed';s.message=message;}
 function step(s,input,dt){
  if(s.phase!=='flying')return s;
  if(s.stage==='landing')return stepLanding(s,input,dt);
  dt=clamp(dt,0,1/30);s.time+=dt;s.invulnerable=Math.max(0,s.invulnerable-dt);
  s.angle+=((input.right?1:0)-(input.left?1:0))*2.15*dt;
  s.angle=Math.atan2(Math.sin(s.angle),Math.cos(s.angle));
  const thrust=input.thrust&&s.fuel>0;
  if(thrust){s.vx+=Math.cos(s.angle)*76*dt;s.vy+=Math.sin(s.angle)*76*dt;s.fuel=Math.max(0,s.fuel-4.2*dt);}
  const drag=Math.exp(-(input.brake?2.3:0.12)*dt);s.vx*=drag;s.vy*=drag;
  const v=speed(s);if(v>185){s.vx*=185/v;s.vy*=185/v;}
  s.x+=s.vx*dt;s.y+=s.vy*dt;
  function hit(){if(s.invulnerable>0)return;s.hull=Math.max(0,s.hull-25);s.collisions++;s.invulnerable=1.4;}
  if(s.x<R||s.x>W-R||s.y<R||s.y>H-R){hit();s.x=clamp(s.x,R,W-R);s.y=clamp(s.y,R,H-R);s.vx*=-0.35;s.vy*=-0.35;}
  for(const o of s.obstacles){let dx=s.x-o.x,dy=s.y-o.y,d=Math.hypot(dx,dy);if(d<o.r+R){hit();if(d<0.01){dx=1;dy=0;d=1;}const nx=dx/d,ny=dy/d;s.x=o.x+nx*(o.r+R+1);s.y=o.y+ny*(o.r+R+1);const dot=s.vx*nx+s.vy*ny;if(dot<0){s.vx-=1.5*dot*nx;s.vy-=1.5*dot*ny;}}}
  const next=s.gates.find(g=>!g.done);if(next&&Math.hypot(s.x-next.x,s.y-next.y)<next.r-R){next.done=true;s.fuel=Math.min(100,s.fuel+12);}
  if(s.hull<=0)fail(s,'Your hull needs repairs. Give debris more room and use the brake before turning.');
  else if(s.gates.every(g=>g.done)&&Math.hypot(s.x-DOCK.x,s.y-DOCK.y)<DOCK.r-R&&speed(s)<=65){if(s.destination==='Moon'){s.stage='landing';s.x=950;s.y=95;s.vx=0;s.vy=10;s.angle=-Math.PI/2;s.fuel=Math.max(65,s.fuel);s.message='Lunar approach: land upright on the gold pad.';}else{s.phase='success';s.message='Docking confirmed. Your crew and spacecraft arrived safely!';}}
  else if(s.fuel<=0&&speed(s)<3)fail(s,'Fuel is empty. Coast between short thrust bursts; each navigation gate restores 12 fuel.');
  else if(s.time>=180)fail(s,'Flight time is up. Follow the next-gate marker and keep moving toward the destination.');
  return s;
 }
 const PAD={x:950,y:480,halfWidth:100};
 function stepLanding(s,input,dt){
  dt=clamp(dt,0,1/30);s.time+=dt;
  s.angle=clamp(s.angle+((input.right?1:0)-(input.left?1:0))*1.4*dt,-Math.PI+.15,-.15);
  s.vy+=12*dt; // Game gravity; not a physical scale model.
  if(input.thrust&&s.fuel>0){s.vx+=Math.cos(s.angle)*34*dt;s.vy+=Math.sin(s.angle)*34*dt;s.fuel=Math.max(0,s.fuel-5*dt);}
  if(input.brake&&s.fuel>0){const drag=Math.exp(-1.7*dt);s.vx*=drag;s.vy*=drag;s.fuel=Math.max(0,s.fuel-4*dt);}
  s.x+=s.vx*dt;s.y+=s.vy*dt;
  if(s.y+R>=PAD.y){
   if(Math.abs(s.x-PAD.x)<=PAD.halfWidth-R&&Math.abs(s.vx)<=15&&Math.abs(s.vy)<=28&&Math.abs(s.angle+Math.PI/2)<=.3){s.y=PAD.y-R;s.phase='success';s.message='Soft lunar landing confirmed! Your crew can collect samples.';}
   else fail(s,'Landing needs another try. Centre over the gold pad, keep upright, and brake below 28 units/s vertical and 15 horizontal.');
  }else if(s.x<R||s.x>W-R||s.y<R)fail(s,'You left the lunar approach area. Use short thrust bursts and stay above the pad.');
  else if(s.time>=240)fail(s,'Landing time is up. Brake to control descent and aim for the gold pad.');
  return s;
 }
 function rating(s){return clamp(Math.round(s.hull*0.5+s.fuel*0.3+Math.max(0,20-s.time/9)),0,100);}
 return {create,step,speed,rating,W,H,DOCK,PAD};
});

