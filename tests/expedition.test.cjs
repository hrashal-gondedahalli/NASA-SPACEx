const {test}=require('node:test'),assert=require('node:assert/strict');
const P=require('../simulator/physics.js'),EP=require('../simulator/ephemeris.js'),E=require('../simulator/expedition.js'),A=require('../simulator/vendor/astronomy.browser.min.js');
const sub=(a,b)=>P.add(a,P.mul(b,-1));
test('ephemerides use consistent scaled positions, velocities and dates',()=>{
 const epoch='2026-11-14T12:00:00.000Z',q=A.GeoMoonState(new Date(epoch)),m=EP.exact('Moon',0,epoch);
 assert(Math.abs(m.p[0]-q.x*EP.AU*.1)<.00001);assert(Math.abs(m.v[1]-q.vz*EP.AU*.1/(86400*EP.TIME_SCALE))<.00001);
 const t=450.3,approx=EP.state('Moon',t,epoch),exact=EP.exact('Moon',t,epoch);assert(P.length(sub(approx.p,exact.p))<2);
 assert.equal(EP.date(EP.TIME_SCALE*86400,epoch).toISOString(),'2026-11-15T12:00:00.000Z');
 const solar=EP.solarSystem(0,epoch);assert.equal(solar.length,9);assert.deepEqual(solar.find(x=>x.name==='Sun').p,[0,0,0]);assert(P.length(solar.find(x=>x.name==='Neptune').p)>20*EP.AU*.1);
 assert.throws(()=>EP.epoch('invalid'));
});
test('changing the primary preserves global position, velocity, fuel and elapsed time',()=>{
 const s=E.create(),moon=E.center(s,'Moon');s.expedition.p=P.add(moon.p,[E.SOI*.9,0,0]);s.expedition.v=P.add(moon.v,[50,20,10]);const before=JSON.stringify({p:s.expedition.p,v:s.expedition.v,fuel:s.fuel,time:s.time});E.localize(s);assert.equal(s.body,'Moon');assert(P.length(sub(s.v,[50,20,10]))<1e-9);assert.equal(JSON.stringify({p:s.expedition.p,v:s.expedition.v,fuel:s.fuel,time:s.time}),before);
 s.expedition.p=P.add(moon.p,[E.SOI*1.1,0,0]);const global=[...s.expedition.p];E.localize(s);assert.equal(s.body,'Earth');assert.deepEqual(s.p,global);
});
test('Lambert solution reaches its destination under the stated two-body dynamics',()=>{
 const r=900000,mu=P.BODIES.Earth.mu,period=2*Math.PI*Math.sqrt(r**3/mu),tof=period/4,q=E.lambert([r,0,0],[0,r,0],tof);assert(q);let p=[r,0,0],v=q.v1,time=0;
 while(time<tof){const dt=Math.min(.25,tof-time),a=P.mul(p,-mu/P.length(p)**3),next=P.add(p,P.add(P.mul(v,dt),P.mul(a,.5*dt*dt))),b=P.mul(next,-mu/P.length(next)**3);v=P.add(v,P.mul(P.add(a,b),.5*dt));p=next;time+=dt;}
 assert(P.length(sub(p,[0,r,0]))<10);assert.equal(E.lambert([r,0,0],[0,r,0],-1),null);
});
test('manual controls, gravity, fuel cutoff, pause and predictions preserve their contracts',()=>{
 const s=E.create(E.DEFAULT);s.phase='flying';s.throttle=1;const fuel=s.fuel[0];E.advance(s,{pitch:.1},3);assert(P.telemetry(s).altitude>1);assert(s.fuel[0]<fuel);assert(s.pitch>0);
 s.fuel[0]=0;E.advance(s,{},.1);assert.equal(s.lastThrust,0);s.phase='paused';const saved=JSON.stringify(s);E.advance(s,{},100);assert.equal(JSON.stringify(s),saved);
 s.phase='flying';const before=JSON.stringify(s),points=E.predict(s,60);assert.equal(JSON.stringify(s),before);assert(points.every(p=>p.every(Number.isFinite)));assert(!E.command(s,'transfer'));
});
for(const epoch of ['2026-11-14','2026-11-20','2026-12-01','2027-01-01'])test('fuel-limited continuous launch, transfer, lunar orbit and landing: '+epoch,()=>{
 const s=E.create(E.DEFAULT,{epoch});s.phase='flying';assert(E.command(s,'orbit'));
 for(let i=0;i<10000&&s.expedition.autopilot!=='off'&&s.phase==='flying';i++)E.advance(s,{},.2);
 assert.equal(s.phase,'flying');assert(P.telemetry(s).periapsis>75000);assert(E.command(s,'transfer'));assert(s.expedition.plan.deltaV<1600);
 for(let i=0;i<10000&&s.expedition.autopilot!=='off'&&s.phase==='flying'&&s.fuel[s.stage]>0;i++)E.advance(s,{},s.expedition.mission==='coast'?400:s.expedition.mission==='departure-window'?50:5);
 assert.equal(s.expedition.mission,'lunar-orbit');assert.equal(s.body,'Moon');assert.equal(s.expedition.transitions.length,1);assert(P.telemetry(s).periapsis>20000);const time=s.time,fuel=s.fuel[s.stage];assert(E.command(s,'land'));
 for(let i=0;i<10000&&s.phase==='flying'&&s.fuel[s.stage]>0;i++)E.advance(s,{},2);
 assert.equal(s.phase,'landed');assert(s.time>time);assert(s.fuel[s.stage]>0&&s.fuel[s.stage]<fuel);assert.equal(s.expedition.mission,'landed');
});

test('orbit guidance hands over without an attitude snap and coasting preserves inertial pointing',()=>{
 const s=E.create(E.DEFAULT);s.phase='flying';E.command(s,'orbit');let previous=[...s.direction],worst=0;
 for(let i=0;i<20000&&s.expedition.autopilot!=='off';i++){E.advance(s,{},.05);worst=Math.max(worst,Math.acos(P.clamp(P.dot(previous,s.direction),-1,1)));previous=[...s.direction];}
 assert.equal(s.expedition.mission,'earth-orbit');const direction=[...s.direction];E.advance(s,{},.05);worst=Math.max(worst,Math.acos(P.clamp(P.dot(direction,s.direction),-1,1)));assert(worst<2*Math.PI/180,'No frame may snap by two degrees at 0.05 s cadence');
 E.advance(s,{},30);assert(P.length(sub(direction,s.direction))<1e-9,'No input means no uncommanded rotation in inertial space');
});
test('cancelling guidance preserves current pointing and manual steering begins from that attitude',()=>{
 const s=E.create(E.DEFAULT);s.phase='flying';E.command(s,'orbit');E.advance(s,{},150);assert(s.expedition.autopilot!=='off');const direction=[...s.direction];E.command(s,'manual');E.advance(s,{},.05);assert(P.length(sub(direction,s.direction))<1e-9);
 const fuel=s.rcsFuel;E.advance(s,{yaw:1},.05);const turn=Math.acos(P.clamp(P.dot(direction,s.direction),-1,1));assert(turn>0&&turn<.1);assert(s.rcsFuel<fuel);
});
test('lunar coast prediction stays in the moving Moon frame rather than spiralling away',()=>{
 const s=E.create(E.DEFAULT),moon=E.center(s,'Moon'),r=P.BODIES.Moon.radius+30000;s.phase='flying';s.expedition.p=P.add(moon.p,[0,r,0]);s.expedition.v=P.add(moon.v,[Math.sqrt(P.BODIES.Moon.mu/r),0,0]);E.localize(s);
 assert.equal(s.body,'Moon');const saved=JSON.stringify(s),points=E.predict(s);assert.equal(JSON.stringify(s),saved);assert(points.length>200);assert(points.every(p=>Math.abs(P.length(p)-r)<5000),'A circular 204 km radius lunar orbit must stay near that radius throughout the prediction');
});
