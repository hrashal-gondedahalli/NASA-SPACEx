const {test}=require('node:test');
const assert=require('node:assert/strict');
const P=require('../simulator/physics.js');
const run=(s,n,input={})=>{for(let i=0;i<n*120;i++)P.step(s,input,1/120);return s;};
const flight=(scenario='launch')=>({...P.create(P.DEFAULT,scenario),phase:'flying'});
test('rocket design controls mass, thrust-to-weight, delta-v and launch validity',()=>{
 assert.deepEqual(P.validate(P.DEFAULT),[]);const d=P.design(P.DEFAULT),before=P.specs(d);d.stages[0].tanks++;assert(P.specs(d).mass>before.mass);assert(P.specs(d).twr<before.twr);d.stages[0].engines=0;assert(P.validate(d).some(x=>/engine/.test(x)));
 assert(P.specs(P.DEFAULT).deltaV>6000);const normalized=P.design({stages:[{tanks:-99,engines:50}]}).stages[0];assert.equal(normalized.tanks,0);assert.equal(normalized.engines,3);assert.deepEqual(normalized.tankSizes,[]);
});
test('launchpad supports an idle rocket; thrust consumes fuel and lifts it',()=>{
 const s=flight();run(s,2);assert.equal(P.telemetry(s).altitude,0);assert.equal(s.phase,'flying');const m=P.mass(s);s.throttle=1;run(s,8);assert(P.telemetry(s).altitude>100);assert(P.mass(s)<m);assert(s.v[1]>0);
});
test('coasting has no artificial vacuum brake, and gravity curves an orbit',()=>{
 const s=flight('orbit'),b=P.BODIES.Earth,v=P.length(s.v);run(s,60);assert(P.telemetry(s).altitude>89950);assert(P.telemetry(s).altitude<90050);assert(Math.abs(P.length(s.v)-v)<1);assert(s.p[0]>100000);assert(s.orbit);assert.equal(P.telemetry(s).fuel,20000);
});
test('three-dimensional attitude can generate out-of-plane velocity',()=>{
 const s=flight('orbit');s.pitch=Math.PI/2;s.yaw=Math.PI/2;s.throttle=1;run(s,3);assert(Math.abs(s.v[2])>10);assert(s.fuel[0]<12000);
});
test('staging discards spent mass and fuel without refilling the upper stage',()=>{
 const s=flight();const m=P.mass(s);assert(P.separate(s));assert(P.mass(s)<m);assert.equal(s.stage,1);assert.equal(s.fuel[1],8000);assert(!P.separate(s));s.throttle=1;run(s,1);assert(s.fuel[1]<8000);assert.equal(s.fuel[0],12000);
});
test('fuel exhaustion stops thrust; paused and terminal states cannot advance',()=>{
 const s=flight('orbit');s.fuel[0]=.01;s.throttle=1;run(s,1);assert.equal(s.fuel[0],0);assert.equal(s.lastThrust,0);s.phase='paused';const snapshot=JSON.stringify(s);run(s,5);assert.equal(JSON.stringify(s),snapshot);
});
test('lunar descent is playable without teleporting, and unsafe impacts fail',()=>{
 const s=flight('moon');for(let i=0;i<120*180&&s.phase==='flying';i++){
  const t=P.telemetry(s),desired=-Math.min(25,Math.max(2,Math.sqrt(t.altitude)*.7));s.throttle=P.clamp((t.gravity+(desired-t.radial)*.6)*P.mass(s)/P.specs(s.design).stages[s.stage].thrust,0,1);P.step(s,{},1/120);
 }
 assert.equal(s.phase,'landed',JSON.stringify(s));assert(s.fuel[0]>0);const bad=flight('moon');run(bad,60);assert.equal(bad.phase,'crashed');assert.match(bad.message,/Impact/);
 const terminal=JSON.stringify(bad);run(bad,10,{pitch:1});assert.equal(JSON.stringify(bad),terminal);
});
test('orbital apsides and prediction are finite and do not mutate a live flight',()=>{
 const s=flight('orbit'),t=P.telemetry(s),snapshot=JSON.stringify(s);assert(Math.abs(t.periapsis-90000)<1);assert(Math.abs(t.apoapsis-90000)<1);const points=P.predict(s);assert.equal(JSON.stringify(s),snapshot);assert(points.length>100);assert(points.every(p=>p.every(Number.isFinite)));
});
test('starter rocket can launch and attain an atmosphere-clearing Earth orbit',()=>{
 const s=flight();for(let i=0;i<120*700&&s.phase==='flying'&&!s.orbit;i++){
  const t=P.telemetry(s);s.pitch=P.clamp((t.altitude-1000)/42000,0,1)*Math.PI*.48;
  if(s.fuel[0]===0&&s.stage===0)P.separate(s);
  s.throttle=t.periapsis>76000?0:t.apoapsis>110000&&t.altitude<100000?0:1;P.step(s,{},1/120);
 }
 assert.equal(s.phase,'flying');assert(s.orbit,'Reach a sustained orbit using thrust, guidance and staging');assert(P.telemetry(s).periapsis>75000);assert(P.telemetry(s).fuel>0);
});


test('tank sizes and engine types have distinct fuel, mass and thrust',()=>{const d=P.design(P.DEFAULT),a=P.specs(d);d.stages[0].tankSizes[0]='large';assert(P.specs(d).mass>a.mass);assert(P.specs(d).stages[0].fuel>a.stages[0].fuel);d.stages[0].engineType='heavy';assert(P.specs(d).stages[0].thrust>a.stages[0].thrust);});
test('recovery parts are functional and cannot deploy a parachute on the Moon',()=>{const d=P.design(P.DEFAULT);d.parachute=true;d.legs=true;const s=P.create(d);s.phase='flying';assert(P.deploy(s,'parachute'));assert(s.parachuteDeployed);assert(P.deploy(s,'legs'));assert(s.legsDeployed);const m=P.create(d,'moon');m.phase='flying';assert(!P.deploy(m,'parachute'));});
test('separators, fairings, RCS and side boosters affect the flight model',()=>{const d=P.design(P.DEFAULT);d.separator=false;const s=P.create(d,'orbit');s.phase='flying';assert(!P.separate(s));d.fairing=true;d.rcs=true;d.stages[0].boosters=2;assert(P.validate(d).some(x=>x.includes('side release')));d.stages[0].radialSeparator=true;const b=P.create(d,'orbit');b.phase='flying';const mass=P.mass(b);assert(P.detachBoosters(b));assert(P.mass(b)<mass);assert(!P.detachBoosters(b));const before=P.mass(b);assert(P.deploy(b,'fairing'));assert(P.mass(b)<before);run(b,2,{yaw:1});assert(b.rcsFuel<40);});
test('heat shield reduces temperature in the simplified atmospheric heating model',()=>{const d=P.design(P.DEFAULT),plain=P.create(d),protectedDesign={...d,heatShield:true},shielded=P.create(protectedDesign);for(const s of [plain,shielded]){s.phase='flying';s.launched=true;s.p[1]+=20000;s.v=[1800,0,0];}run(plain,1);run(shielded,1);assert(shielded.temperature<plain.temperature);assert(shielded.shield<100);});
