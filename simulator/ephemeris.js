/* Astronomy Engine positions in a consistent 1:10 educational model.
   Length scale 0.1, time scale sqrt(0.1), mass parameter scale 0.01.
   Equatorial J2000 axes are mapped x,z,y for the renderer. */
(function(root,factory){if(typeof module==='object'&&module.exports)module.exports=factory(require('./vendor/astronomy.browser.min.js'));else root.OrbitalEphemeris=factory(root.Astronomy);})(globalThis,A=>{
 'use strict';
 const LENGTH_SCALE=.1,TIME_SCALE=Math.sqrt(LENGTH_SCALE),AU=149597870700,DAY=86400,DEFAULT_EPOCH='2026-11-14T12:00:00.000Z';
 const bodies={Sun:{radius:695700000*.1,color:0xffd789},Mercury:{radius:2439700*.1,color:0x8b8580},Venus:{radius:6051800*.1,color:0xd7b779},Earth:{radius:637100,color:0x4d97ce},Moon:{radius:173740,color:0xaaa9a4},Mars:{radius:3389500*.1,color:0xb96342},Jupiter:{radius:69911000*.1,color:0xc9ad90},Saturn:{radius:58232000*.1,color:0xdbcb9c},Uranus:{radius:25362000*.1,color:0x9ad6da},Neptune:{radius:24622000*.1,color:0x477de0}};
 function epoch(value=DEFAULT_EPOCH){const d=new Date(value);if(!Number.isFinite(d.getTime()))throw Error('Choose a valid mission date.');return d.toISOString();}
 function date(seconds=0,start=DEFAULT_EPOCH){return new Date(new Date(start).getTime()+seconds/TIME_SCALE*1000);}
 function vector(v,velocity=false){const k=AU*LENGTH_SCALE/(velocity?DAY*TIME_SCALE:1);return [v[velocity?'vx':'x']*k,v[velocity?'vz':'z']*k,v[velocity?'vy':'y']*k];}
 function exact(name,seconds=0,start=DEFAULT_EPOCH){if(!bodies[name])throw Error('Unknown solar-system body');if(name==='Earth')return {p:[0,0,0],v:[0,0,0]};const d=date(seconds,start);if(name==='Moon'){const q=A.GeoMoonState(d);return {p:vector(q),v:vector(q,true)};}const earth=A.HelioState(A.Body.Earth,d),body=name==='Sun'?{x:0,y:0,z:0,vx:0,vy:0,vz:0}:A.HelioState(A.Body[name],d);return {p:vector({x:body.x-earth.x,y:body.y-earth.y,z:body.z-earth.z}),v:vector({vx:body.vx-earth.vx,vy:body.vy-earth.vy,vz:body.vz-earth.vz},true)};}
 const cache=new Map(),SPAN=120;
 function state(name,seconds=0,start=DEFAULT_EPOCH){if(name==='Earth')return {p:[0,0,0],v:[0,0,0]};const k=Math.floor(seconds/SPAN),key=start+':'+name+':'+k;let pair=cache.get(key);if(!pair){pair=[exact(name,k*SPAN,start),exact(name,(k+1)*SPAN,start)];cache.set(key,pair);if(cache.size>2048)cache.delete(cache.keys().next().value);}const u=(seconds-k*SPAN)/SPAN,u2=u*u,u3=u2*u,[a,b]=pair;return {p:a.p.map((x,i)=>(2*u3-3*u2+1)*x+(u3-2*u2+u)*SPAN*a.v[i]+(-2*u3+3*u2)*b.p[i]+(u3-u2)*SPAN*b.v[i]),v:a.p.map((x,i)=>(6*u2-6*u)*x/SPAN+(3*u2-4*u+1)*a.v[i]+(-6*u2+6*u)*b.p[i]/SPAN+(3*u2-2*u)*b.v[i])};}
 function moonPath(seconds=0,start=DEFAULT_EPOCH,n=180){const period=27.321661*DAY*TIME_SCALE;return Array.from({length:n+1},(_,i)=>state('Moon',seconds+i/n*period,start).p);}
 function solarSystem(seconds=0,start=DEFAULT_EPOCH){const sun=state('Sun',seconds,start).p;return Object.keys(bodies).filter(n=>n!=='Moon').map(name=>({name,...bodies[name],p:state(name,seconds,start).p.map((x,i)=>x-sun[i])}));}
 return {LENGTH_SCALE,TIME_SCALE,AU,DAY,DEFAULT_EPOCH,bodies,epoch,date,exact,state,moonPath,solarSystem};
});
