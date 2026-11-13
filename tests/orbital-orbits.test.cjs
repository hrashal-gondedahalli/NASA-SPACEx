const {test}=require('node:test'),assert=require('node:assert/strict');
const P=require('../simulator/physics.js'),O=require('../simulator/orbits.js');
test('lunar mean ellipse preserves scaled size, eccentricity, tilt and closed period',()=>{
 const path=O.moonPath(720),r=path.map(P.length),near=Math.min(...r),far=Math.max(...r);assert(Math.abs(near-O.MOON.a*(1-O.MOON.e))<1);assert(Math.abs(far-O.MOON.a*(1+O.MOON.e))<1);assert.equal(O.MOON.a/P.BODIES.Earth.radius,384400/6371);assert(Math.abs(Math.atan2(path[180][2],path[180][1])-O.MOON.inclination)<1e-10);assert(P.length(P.add(O.moonPosition(0),P.mul(O.moonPosition(O.MOON.period),-1)))<.01);assert(P.length(P.add(O.moonPosition(0),P.mul(O.moonPosition(O.MOON.period/4),-1)))>O.MOON.a);assert(O.MOON.period>7*86400&&O.MOON.period<10*86400);
});
test('Earth and lunar circular coast paths have the correct radius, period and orbit plane',()=>{
 for(const scenario of ['orbit','moon-orbit']){const s=P.create(P.DEFAULT,scenario),before=JSON.stringify(s),d=O.path(s);assert.equal(JSON.stringify(s),before);assert.equal(d.points.length,361);assert(d.e<1e-10);const r=P.length(s.p);for(const p of d.points){assert(Math.abs(P.length(p)-r)<1e-5);assert(Math.abs(p[2])<1e-5);}assert(Math.abs(d.period-2*Math.PI*Math.sqrt(r**3/P.BODIES[s.body].mu))<1e-8);if(scenario==='moon-orbit'){assert.equal(s.body,'Moon');assert.equal(P.telemetry(s).altitude,30000);s.phase='flying';for(let i=0;i<120*120;i++)P.step(s,{},1/120);assert(Math.abs(P.telemetry(s).altitude-30000)<10);assert(s.orbit);}}
});
test('coast geometry changes with a burn and does not draw an orbit through the surface',()=>{
 const s=P.create(P.DEFAULT,'orbit'),c=O.path(s);s.v=P.mul(s.v,1.2);const raised=O.path(s);assert(raised.apoapsis>c.apoapsis+10000);s.v=P.mul(s.v,.3);const impact=O.path(s);assert(impact.periapsis<0);assert(impact.points.length<361);assert(impact.points.every(p=>P.length(p)>=P.BODIES.Earth.radius));s.v=P.mul(P.unit(s.v),Math.sqrt(2*P.BODIES.Earth.mu/P.length(s.p))*1.2);const escape=O.path(s);assert(!Number.isFinite(escape.period));assert.equal(escape.apo,null);assert(escape.points.every(p=>p.every(Number.isFinite)));
});
