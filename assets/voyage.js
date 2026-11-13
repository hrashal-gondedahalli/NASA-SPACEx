/* Canvas renderer and input lifecycle; flight rules live in voyage-engine.js. */
(()=>{
 'use strict';
 const E=VoyageEngine,$=id=>document.getElementById(id),canvas=$('voyageCanvas'),ctx=canvas.getContext('2d');
 let s=E.create(),destinationName='',frame=0,last=0,accumulator=0,countdown=3,pausedFrom='flying',lastAnnouncement='',lastHud=0;
 const input={left:false,right:false,thrust:false,brake:false},pointers=new Map(),keys=new Set();
 const stars=Array.from({length:150},(_,i)=>({x:(i*173.57)%2300,y:(i*97.13)%540,r:i%4===0?1.5:.7}));
 function active(){return $('launch').classList.contains('active');}
 function clearInput(){keys.clear();pointers.clear();for(const k in input)input[k]=false;document.querySelectorAll('[data-flight]').forEach(b=>b.classList.remove('held'));}
 function updateInput(){for(const k in input)input[k]=[...keys].some(code=>mapping[code]===k)||[...pointers.values()].includes(k);document.querySelectorAll('[data-flight]').forEach(b=>b.classList.toggle('held',input[b.dataset.flight]));}
 const mapping={ArrowLeft:'left',KeyA:'left',ArrowRight:'right',KeyD:'right',ArrowUp:'thrust',KeyW:'thrust',Space:'thrust',ArrowDown:'brake',KeyS:'brake'};
 document.querySelectorAll('[data-flight]').forEach(b=>{
  b.addEventListener('pointerdown',e=>{if(s.phase!=='flying'||e.button!==0)return;e.preventDefault();b.setPointerCapture(e.pointerId);pointers.set(e.pointerId,b.dataset.flight);updateInput();});
  for(const event of ['pointerup','pointercancel','lostpointercapture'])b.addEventListener(event,e=>{pointers.delete(e.pointerId);updateInput();});
 });
 document.addEventListener('keydown',e=>{if(!active()||/INPUT|TEXTAREA|SELECT/.test(e.target.tagName))return;if(e.code==='KeyP'||e.code==='Escape'){e.preventDefault();if(!e.repeat)togglePause();return;}if(mapping[e.code]){if(e.code==='Space'&&e.target.tagName==='BUTTON')return;e.preventDefault();if(s.phase==='flying'){keys.add(e.code);updateInput();}}});
 document.addEventListener('keyup',e=>{keys.delete(e.code);updateInput();});
 window.addEventListener('blur',()=>{if(active()&&['flying','countdown'].includes(s.phase))pause();else clearInput();});
 document.addEventListener('visibilitychange',()=>{if(document.hidden&&active()&&['flying','countdown'].includes(s.phase))pause();});
 function overlay(icon,title,text,action,label,secondary=false){
  $('voyageOverlay').classList.remove('hidden');$('voyageIcon').textContent=icon;$('voyageTitle').textContent=title;$('voyageExplanation').textContent=text;
  const b=$('voyagePrimary');b.textContent=label;b.onclick=action;b.hidden=!action;$('voyageRetry').hidden=!secondary;
  if(action)b.focus({preventScroll:true});announce(title+' '+text);
 }
 function announce(text){if(text!==lastAnnouncement){$('voyageLive').textContent=text;lastAnnouncement=text;}}
 function start(name){cancelAnimationFrame(frame);destinationName=name;s=E.create();countdown=3;lastHud=0;lastAnnouncement='';clearInput();$('launchActions').classList.add('hidden');$('pauseFlight').disabled=true;$('pauseFlight').textContent='Pause';
  overlay('✦','Your voyage to '+name,'Pass all 3 glowing gates to calibrate navigation. Avoid the rocks, then brake to 65 or less inside the gold docking zone. Each gate restores 12 fuel.',begin,'Ready for launch →');
  hud();render();last=0;accumulator=0;frame=requestAnimationFrame(loop);window.MissionControl?.refreshNav();
 }
 function begin(){s.phase='countdown';countdown=3;$('pauseFlight').disabled=false;clearInput();canvas.focus({preventScroll:true});$('voyagePrimary').hidden=true;$('voyageTitle').textContent='3';$('voyageExplanation').textContent='Hands on the controls, astronaut.';}
 function pause(){pausedFrom=s.phase;s.phase='paused';clearInput();$('pauseFlight').textContent='Resume';overlay('Ⅱ','Flight paused','Take your time. Your fuel and flight timer are paused too.',resume,'Resume flight →');}
 function resume(){s.phase=pausedFrom;last=0;accumulator=0;$('pauseFlight').textContent='Pause';$('voyageOverlay').classList.toggle('hidden',s.phase!=='countdown');if(s.phase==='countdown'){$('voyagePrimary').hidden=true;$('voyageExplanation').textContent='Hands on the controls, astronaut.';}canvas.focus({preventScroll:true});}
 function togglePause(){if(s.phase==='paused')resume();else if(['flying','countdown'].includes(s.phase))pause();}
 function stop(){cancelAnimationFrame(frame);frame=0;clearInput();if(['flying','countdown','paused','ready'].includes(s.phase))s.phase='aborted';}
 function finish(){clearInput();$('pauseFlight').disabled=true;
  if(s.phase==='success'){
   const report={destination:destinationName,score:E.rating(s),fuel:Math.round(s.fuel),hull:s.hull,seconds:Math.round(s.time)};
   JuniorSave.data.voyage=report;JuniorSave.write();$('launchActions').classList.remove('hidden');
   overlay('✧','Docking successful!',`${report.score}/100 flight score · ${report.hull}% hull · ${report.fuel}% fuel · ${report.seconds}s. ${s.message}`,()=>{$('continueFlight').click();},'Explore your destination →',true);
  }else overlay('↻','Let’s try that again',s.message,()=>start(destinationName),'Retry mission →');
  window.MissionControl?.refreshNav();
 }
 function hud(){const v=Math.round(E.speed(s)),g=s.gates.filter(x=>x.done).length;
  $('voyageFuel').textContent=Math.ceil(s.fuel)+'%';$('voyageFuelBar').value=s.fuel;$('voyageFuel').classList.toggle('voyage-low',s.fuel<25);
  $('voyageSpeed').textContent=v;$('voyageHull').textContent=s.hull+'%';$('voyageHullBar').value=s.hull;$('voyageGates').textContent=g+' / 3';
  $('launchProgress').style.width=(g/3*100)+'%';$('voyageDestination').textContent=destinationName;
  const next=s.gates.find(x=>!x.done),distance=Math.round(Math.hypot(s.x-(next||E.DOCK).x,s.y-(next||E.DOCK).y));
  const text=next?`Gate ${g+1} · ${distance} units away. Turn toward the cyan marker; thrust moves you in the direction your nose points.`:v>65?'All gates complete. Hold BRAKE and enter the gold zone at speed 65 or less.':'Approach the gold docking zone. Keep your speed at 65 or less.';
  $('flightReadout').textContent=text;
  if(g!==lastHud){announce(g+' of 3 navigation gates complete. '+(g===3?'Brake to dock.':'Fuel replenished.'));lastHud=g;}
 }
 function loop(t){if(!active()){stop();return;}const elapsed=last?Math.min((t-last)/1000,.1):0;last=t;
  if(s.phase==='countdown'){countdown-=elapsed;$('voyageTitle').textContent=String(Math.max(1,Math.ceil(countdown)));if(countdown<=0){s.phase='flying';$('voyageOverlay').classList.add('hidden');announce('Liftoff. Use thrust to move and left or right to turn.');}}
  else if(s.phase==='flying'){accumulator+=elapsed;while(accumulator>=1/120&&s.phase==='flying'){E.step(s,input,1/120);accumulator-=1/120;}if(['success','failed'].includes(s.phase))finish();}
  hud();render();frame=requestAnimationFrame(loop);
 }
 function render(){
  const rect=canvas.getBoundingClientRect(),dpr=Math.min(window.devicePixelRatio||1,2),width=Math.max(1,Math.round(rect.width*dpr)),height=Math.max(1,Math.round(rect.height*dpr));if(canvas.width!==width||canvas.height!==height){canvas.width=width;canvas.height=height;}
  const viewW=Math.max(600,E.H*rect.width/Math.max(rect.height,1)),scale=canvas.height/E.H,camera=Math.max(0,Math.min(E.W-viewW,s.x-viewW*.3));
  ctx.setTransform(scale,0,0,scale,0,0);ctx.fillStyle='#070f21';ctx.fillRect(0,0,viewW,E.H);
  const nebula=ctx.createRadialGradient(viewW*.7,140,0,viewW*.7,140,500);nebula.addColorStop(0,'#20344b');nebula.addColorStop(1,'#070f21');ctx.fillStyle=nebula;ctx.fillRect(0,0,viewW,E.H);
  for(const a of stars){const x=((a.x-camera*.25)%viewW+viewW)%viewW;ctx.globalAlpha=.3+(a.r/3);ctx.fillStyle='#d8eaff';ctx.beginPath();ctx.arc(x,a.y,a.r,0,Math.PI*2);ctx.fill();}ctx.globalAlpha=1;
  ctx.save();ctx.translate(-camera,0);
  ctx.strokeStyle='#264457';ctx.setLineDash([4,15]);ctx.beginPath();ctx.moveTo(90,270);s.gates.forEach(g=>ctx.lineTo(g.x,g.y));ctx.lineTo(E.DOCK.x,E.DOCK.y);ctx.stroke();ctx.setLineDash([]);
  const planet=ctx.createRadialGradient(1840,170,10,1840,270,260);planet.addColorStop(0,'#4b7b8e');planet.addColorStop(.6,'#283c63');planet.addColorStop(1,'#101c36');ctx.fillStyle=planet;ctx.beginPath();ctx.arc(1970,280,230,0,Math.PI*2);ctx.fill();
  for(const [i,g]of s.gates.entries()){ctx.strokeStyle=g.done?'#4d706f':'#69e9db';ctx.lineWidth=g.done?2:4;ctx.beginPath();ctx.arc(g.x,g.y,g.r,0,Math.PI*2);ctx.stroke();ctx.fillStyle=g.done?'#8fc2b8':'#c5fff0';ctx.font='bold 15px system-ui';ctx.textAlign='center';ctx.fillText(g.done?'✓':String(i+1),g.x,g.y-g.r-13);}
  for(const [i,o]of s.obstacles.entries()){ctx.save();ctx.translate(o.x,o.y);ctx.rotate(i*.8);ctx.fillStyle='#776b67';ctx.strokeStyle='#b5a39a';ctx.lineWidth=2;ctx.beginPath();for(let j=0;j<9;j++){const a=j/9*Math.PI*2,r=o.r*(j%2?.85:1);if(j===0)ctx.moveTo(Math.cos(a)*r,Math.sin(a)*r);else ctx.lineTo(Math.cos(a)*r,Math.sin(a)*r);}ctx.closePath();ctx.fill();ctx.stroke();ctx.fillStyle='#4e4949';ctx.beginPath();ctx.arc(-o.r*.2,-o.r*.15,o.r*.25,0,Math.PI*2);ctx.fill();ctx.restore();}
  ctx.strokeStyle='#ffc869';ctx.lineWidth=3;ctx.beginPath();ctx.arc(E.DOCK.x,E.DOCK.y,E.DOCK.r,0,Math.PI*2);ctx.stroke();ctx.fillStyle='#ffdc92';ctx.font='bold 13px system-ui';ctx.textAlign='center';ctx.fillText('DOCK · SPEED ≤ 65',E.DOCK.x,E.DOCK.y-E.DOCK.r-14);
  ctx.save();ctx.translate(s.x,s.y);ctx.rotate(s.angle);if(!(s.invulnerable>0&&Math.floor(s.time*12)%2)){
   if(input.thrust&&s.fuel>0&&s.phase==='flying'){ctx.fillStyle='#ffc16b';ctx.beginPath();ctx.moveTo(-18,-8);ctx.lineTo(-42-Math.sin(s.time*40)*6,0);ctx.lineTo(-18,8);ctx.fill();ctx.fillStyle='#a6f4ff';ctx.fillRect(-28,-3,12,6);}
   ctx.fillStyle='#e2f4ff';ctx.strokeStyle='#7bb1d0';ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(27,0);ctx.lineTo(-17,-13);ctx.lineTo(-10,0);ctx.lineTo(-17,13);ctx.closePath();ctx.fill();ctx.stroke();ctx.fillStyle='#55d6e9';ctx.beginPath();ctx.arc(6,0,5,0,Math.PI*2);ctx.fill();
  }ctx.restore();ctx.restore();
  // A screen-edge marker stays visible when the next objective is offscreen.
  const target=s.gates.find(g=>!g.done)||E.DOCK,tx=target.x-camera;if(tx>viewW-36||tx<36){const x=Math.max(28,Math.min(viewW-28,tx));ctx.fillStyle='#70edda';ctx.beginPath();ctx.moveTo(x+(tx>viewW?10:-10),target.y);ctx.lineTo(x-5,target.y-8);ctx.lineTo(x-5,target.y+8);ctx.fill();ctx.font='12px system-ui';ctx.textAlign='center';ctx.fillText('NEXT',x,target.y-17);}
 }
 $('pauseFlight').onclick=togglePause;$('voyageRetry').onclick=()=>start(destinationName);
 window.Voyage={start,stop,status:()=>s.phase,telemetry:()=>JSON.parse(JSON.stringify(s))};
})();
