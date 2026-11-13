/* Original educational game model. Units, timings and consequences are fictional. */
(function(root,factory){if(typeof module==='object'&&module.exports)module.exports=factory();else root.OutpostEngine=factory();})(typeof globalThis!=='undefined'?globalThis:this,function(){
 'use strict';
 const SOURCE=Object.freeze({title:'NASA CCMC DONKI weekly report',id:'20240516-7D-001',issued:'2024-05-16T17:40:05Z',period:'8–14 May 2024',url:'https://kauai.ccmc.gsfc.nasa.gov/DONKI/view/Alert/30944/1',context:'https://ccmc.gsfc.nasa.gov/storms/may2024/',fact:'The archived report lists 12 X-class and 80 M-class solar flares during 8–14 May 2024.'});
 const clamp=(n,max=100)=>Math.min(max,Math.max(0,n));
 function create(){return {version:1,day:1,status:'active',power:40,oxygen:65,water:65,food:65,health:100,solar:60,crop:0,science:0,requestDay:0,log:[],badge:false};}
 function event(day){return [{title:'Welcome to your Moon home',text:'Keep two astronauts healthy for seven game days. Start with oxygen level 2, recycling 1 and greenhouse 1. Each level uses 10 power units.'},{title:'A dusty solar panel',text:'Dust has reduced solar power to 40. A repair uses 10 extra power and 6 oxygen, and restores tomorrow’s solar supply. A space-weather warning arrives: plan to shelter tomorrow.'},{title:'Space-weather alert',text:'Today’s scenario is inspired by NASA’s May 2024 solar activity archive. Shelter protects the crew, but greenhouse work and research stop for the day. This fictional alert is not a live forecast.'},{title:'Check the stores',text:'Yesterday’s shelter decision affects today’s food supply. Greenhouse food arrives one day after you grow it. Balance today’s needs with tomorrow’s harvest.'},{title:'Science or supplies?',text:'Research earns discovery points, but uses the same power that runs life support. Keeping your crew healthy matters more than a high score.'},{title:'Almost home',text:'Review your oxygen, water and food before the final day. Earth can send advice, but supplies cannot arrive during this mission.'},{title:'The final day',text:'Finish the seventh day with oxygen, water, food and crew health above zero to earn the Moonbase Keeper badge.'}][day-1]||{title:'Mission report',text:'Review your decisions or start a new mission.'};}
 function plan(s,p){
  const level=x=>Number.isInteger(x)&&x>=0&&x<=2;
  if(!p||!['oxygen','recycle','greenhouse','research'].every(k=>level(p[k]))||!['rest','repair','shelter'].includes(p.action)||typeof p.radio!=='boolean')throw Error('Choose valid system levels and a crew activity.');
  const shelter=p.action==='shelter',greenhouse=shelter?0:p.greenhouse,research=shelter?0:p.research;
  const solar=s.day===2?40:s.solar;
  const cost=20+10*(p.oxygen+p.recycle+greenhouse+research)+(p.action==='repair'||shelter?10:0)+(p.radio?5:0);
  const available=solar+s.power;
  const request=p.radio&&s.requestDay===0;
  return {solar,cost,available,greenhouse,research,request,shelter,valid:cost<=available,oxygen:-18+12*p.oxygen-(p.action==='repair'?6:0),water:-12+8*p.recycle-3*greenhouse,food:-12+s.crop*10,harvest:greenhouse*10,exposure:s.day===3?(shelter?0:p.action==='repair'?35:18):0};
 }
 function advance(s,p){
  if(s.status!=='active')throw Error('This mission is finished. Start a new mission to play again.');
  const f=plan(s,p);if(!f.valid)throw Error('Your plan needs more power than today’s solar supply and battery combined. Lower a system level.');
  if(p.radio&&s.requestDay!==0)throw Error('Earth has already received your request.');
  const n={...s,log:[...s.log]};
  n.power=clamp(s.power+f.solar-f.cost,60);n.solar=p.action==='repair'?60:f.solar;
  n.oxygen=clamp(s.oxygen+f.oxygen);n.water=clamp(s.water+f.water);n.food=clamp(s.food+f.food);n.crop=f.greenhouse;n.science+=f.research*10;
  const shortage=[n.oxygen,n.water,n.food].filter(x=>x<20).length;
  n.health=clamp(s.health-f.exposure-shortage*12+(p.action==='rest'&&shortage===0?4:0));
  if(f.request)n.requestDay=s.day;
  const notes=[`Used ${f.cost} power; ${n.power} stored. Oxygen ${signed(f.oxygen)}, water ${signed(f.water)}, food ${signed(f.food)}.`];
  if(s.crop)notes.push(`Yesterday’s greenhouse produced ${s.crop*10} food.`);
  if(p.action==='repair')notes.push('Solar panels repaired: tomorrow’s supply is 60. The spacewalk used 6 extra oxygen.');
  if(f.shelter)notes.push('Crew sheltered. Greenhouse and research paused.');
  if(f.exposure)notes.push(`Crew health fell by ${f.exposure} from the fictional storm exposure.`);
  if(shortage)notes.push('Stores below 20 caused crew health loss. Increase life-support production.');
  if(f.request)notes.push('Advice requested from Earth. Reply arrives at the start of day '+(s.day+2)+'. No supplies are sent.');
  if(n.requestDay&&s.day+1===n.requestDay+2)notes.push('Earth reply: keep oxygen at level 2, recycle water and shelter during alerts. Choose research only when supplies allow.');
  if([n.oxygen,n.water,n.food,n.health].some(x=>x<=0)){n.status='evacuated';notes.push('A vital supply or crew health reached zero. The crew evacuates safely. Try a different plan.');}
  else if(s.day===7){n.status='complete';n.badge=true;notes.push('Seven days complete! Moonbase Keeper badge earned.');}
  n.log.push({day:s.day,notes,action:p.action,science:f.research*10});if(n.status==='active')n.day++;
  return n;
 }
 function signed(n){return n>=0?'+'+n:String(n);}
 function restore(raw){
  try{const s=JSON.parse(raw);if(!s||s.version!==1||!Number.isInteger(s.day)||s.day<1||s.day>7||!['active','complete','evacuated'].includes(s.status))return null;
   for(const k of ['power','oxygen','water','food','health','solar','crop','science','requestDay'])if(!Number.isFinite(s[k])||s[k]<0)return null;
   if(s.power>60||s.solar>60||s.crop>2||!Number.isInteger(s.crop)||s.science>280||!Number.isInteger(s.requestDay)||s.requestDay>7||['oxygen','water','food','health'].some(k=>s[k]>100))return null;
   if(!Array.isArray(s.log)||s.log.length>7||s.log.length!==(s.status==='active'?s.day-1:s.day)||s.log.some((l,i)=>l.day!==i+1||!Array.isArray(l.notes)||l.notes.length>10||l.notes.some(t=>typeof t!=='string'||t.length>600)))return null;
   if(s.status==='complete'&&(s.day!==7||[s.oxygen,s.water,s.food,s.health].some(x=>x<=0)))return null;
   if(s.status==='active'&&[s.oxygen,s.water,s.food,s.health].some(x=>x<=0))return null;
   return {...create(),...s,badge:s.status==='complete'};
  }catch{return null;}
 }
 return {create,event,plan,advance,restore,SOURCE};
});
