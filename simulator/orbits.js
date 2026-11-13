/* Mean-parameter display orbits, not a live ephemeris or transfer solver. */
(function(root,factory){if(typeof module==='object'&&module.exports)module.exports=factory(require('./physics.js'));else root.OrbitalOrbits=factory(root.OrbitalPhysics);})(globalThis,P=>{
 'use strict';
 const {add,mul,dot,cross,length,unit}=P,TAU=Math.PI*2;
 // NASA NSSDCA Moon Fact Sheet: a=384400 km, e=.0549, i=5.145° to ecliptic.
 const MOON={a:384400000*.1,e:.0549,inclination:5.145*Math.PI/180,realPeriodDays:27.3217};
 MOON.period=TAU*Math.sqrt(MOON.a**3/(P.BODIES.Earth.mu+P.BODIES.Moon.mu));
 function moonPosition(time=0){const M=((time/MOON.period*TAU+.65)%TAU+TAU)%TAU;let E=M;for(let i=0;i<8;i++)E-=(E-MOON.e*Math.sin(E)-M)/(1-MOON.e*Math.cos(E));const x=MOON.a*(Math.cos(E)-MOON.e),y=MOON.a*Math.sqrt(1-MOON.e**2)*Math.sin(E);return [x,y*Math.cos(MOON.inclination),y*Math.sin(MOON.inclination)];}
 function moonPath(n=256){return Array.from({length:n+1},(_,i)=>{const a=i/n*TAU,x=MOON.a*(Math.cos(a)-MOON.e),y=MOON.a*Math.sqrt(1-MOON.e**2)*Math.sin(a);return [x,y*Math.cos(MOON.inclination),y*Math.sin(MOON.inclination)];});}
 function elements(s){const b=P.BODIES[s.body],r=length(s.p),h=cross(s.p,s.v),h2=dot(h,h),energy=dot(s.v,s.v)/2-b.mu/r,evec=add(mul(cross(s.v,h),1/b.mu),mul(unit(s.p),-1)),e=length(evec),a=energy<0?-b.mu/(2*energy):Infinity,axis=e>1e-6?unit(evec):unit(s.p),q=unit(cross(unit(h),axis));return {e,a,h2,axis,q,periapsis:h2/(b.mu*(1+e))-b.radius,apoapsis:Number.isFinite(a)?a*(1+e)-b.radius:Infinity,period:Number.isFinite(a)?TAU*Math.sqrt(a**3/b.mu):Infinity};}
 function path(s,n=360){const b=P.BODIES[s.body],el=elements(s);if(el.h2<1)return {points:P.predict(s),...el,apo:null,peri:null};const start=Math.atan2(dot(unit(s.p),el.q),dot(unit(s.p),el.axis)),points=[];for(let i=0;i<=n;i++){const theta=start+i/n*TAU,den=1+el.e*Math.cos(theta);if(den<=.00001)break;const r=el.h2/(b.mu*den);if(i>0&&r<=b.radius)break;points.push(mul(add(mul(el.axis,Math.cos(theta)),mul(el.q,Math.sin(theta))),r));if(r>MOON.a*5)break;}return {...el,points,peri:el.periapsis>=0?mul(el.axis,b.radius+el.periapsis):null,apo:Number.isFinite(el.apoapsis)&&el.apoapsis>=0?mul(el.axis,-(b.radius+el.apoapsis)):null};}
 return {MOON,moonPosition,moonPath,elements,path};
});
