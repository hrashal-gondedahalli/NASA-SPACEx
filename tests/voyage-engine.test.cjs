const {test}=require('node:test');
const assert=require('node:assert/strict');
const E=require('../assets/voyage-engine.js');
const advance=(s,input={},seconds=1)=>{for(let i=0;i<seconds*120;i++)E.step(s,input,1/120);return s;};
const flight=()=>({...E.create(),phase:'flying'});
test('thrust, steering, inertia, braking and fuel affect flight',()=>{
 const s=flight();advance(s,{thrust:true},1);assert(s.x>110);assert(s.fuel<100);assert(E.speed(s)>50);
 const x=s.x;advance(s,{},1);assert(s.x>x+40,'Coasting keeps momentum');const v=E.speed(s);advance(s,{brake:true},1);assert(E.speed(s)<v*.2);
 const t=flight();advance(t,{right:true},.5);advance(t,{thrust:true},1);assert(t.y>285);assert(t.x>95);
 const empty=flight();empty.fuel=0;advance(empty,{thrust:true});assert.equal(empty.phase,'failed');assert.equal(empty.x,90);
});
test('gates must be reached in sequence and restore fuel only once',()=>{
 const s=flight();s.fuel=40;s.x=s.gates[1].x;s.y=s.gates[1].y;E.step(s,{},1/120);assert.equal(s.gates[1].done,false);
 s.x=s.gates[0].x;s.y=s.gates[0].y;E.step(s,{},1/120);assert.equal(s.fuel,52);advance(s,{},.1);assert.equal(s.fuel,52);
});
test('collisions damage hull, separate the ship and respect recovery time',()=>{
 const s=flight(),o=s.obstacles[0];s.x=o.x;s.y=o.y;E.step(s,{},1/120);assert.equal(s.hull,75);assert(Number.isFinite(s.x));assert(Math.hypot(s.x-o.x,s.y-o.y)>=o.r+16);
 s.x=o.x;s.y=o.y;E.step(s,{},1/120);assert.equal(s.hull,75);
 s.invulnerable=0;s.hull=25;s.x=o.x;s.y=o.y;E.step(s,{},1/120);assert.equal(s.phase,'failed');assert.match(s.message,/repairs/);
});
test('dock requires every gate and a safe approach speed',()=>{
 const s=flight();s.x=E.DOCK.x;s.y=E.DOCK.y;E.step(s,{},1/120);assert.equal(s.phase,'flying');s.gates.forEach(g=>g.done=true);s.vx=100;E.step(s,{},1/120);assert.equal(s.phase,'flying');s.vx=30;E.step(s,{},1/120);assert.equal(s.phase,'success');
 const snapshot=JSON.stringify(s);advance(s,{thrust:true});assert.equal(JSON.stringify(s),snapshot,'Terminal states cannot earn or consume again');
});
test('pause freezes the model, timeout fails and restart resets all resources',()=>{
 const s=flight();s.phase='paused';const saved=JSON.stringify(s);advance(s,{thrust:true});assert.equal(JSON.stringify(s),saved);s.phase='flying';s.time=179.99;advance(s,{},.1);assert.equal(s.phase,'failed');assert.equal(E.create().fuel,100);assert.equal(E.create().hull,100);assert.equal(E.create().gates.filter(g=>g.done).length,0);
});
// Exercise the entire actual model with a simple navigation controller, not teleports.
function pilot(s){const target=s.gates.find(g=>!g.done)||E.DOCK,dx=target.x-s.x,dy=target.y-s.y,d=Math.hypot(dx,dy),v=E.speed(s);
 const desired=Math.atan2(dy-s.vy*.7,dx-s.vx*.7),diff=Math.atan2(Math.sin(desired-s.angle),Math.cos(desired-s.angle));
 return {left:diff<-.05,right:diff>.05,thrust:Math.abs(diff)<.3&&v<(s.gates.every(g=>g.done)&&d<180?48:115),brake:(s.gates.every(g=>g.done)&&d<180&&v>45)||Math.abs(diff)>1.3&&v>65};
}
test('a complete route is reachable with finite fuel and no collisions',()=>{
 const s=flight();for(let i=0;i<120*150&&s.phase==='flying';i++)E.step(s,pilot(s),1/120);
 assert.equal(s.phase,'success',JSON.stringify(s));assert.equal(s.gates.filter(g=>g.done).length,3);assert.equal(s.collisions,0);assert(s.fuel>0);assert(E.rating(s)>0);
});
module.exports={pilot};


test('Moon requires a soft landing after a complete travel route',()=>{
 const s={...E.create('Moon'),phase:'flying'};let landingSeen=false;
 for(let i=0;i<120*150&&s.phase==='flying';i++){
  landingSeen ||= s.stage==='landing';E.step(s,s.stage==='landing'?{brake:s.vy>23}:pilot(s),1/120);
 }
 assert(landingSeen);assert.equal(s.phase,'success',JSON.stringify(s));assert(s.fuel>0);assert.equal(s.y,E.PAD.y-16);
});
test('lunar hard impact, missed pad and tilted landing fail with retry guidance',()=>{
 for(const change of [{vy:70},{x:E.PAD.x+200},{angle:-.5}]){
  const s={...E.create('Moon'),phase:'flying',stage:'landing',x:E.PAD.x,y:E.PAD.y-16,angle:-Math.PI/2,...change};E.step(s,{},1/120);assert.equal(s.phase,'failed');assert.match(s.message,/another try/);
 }
});
