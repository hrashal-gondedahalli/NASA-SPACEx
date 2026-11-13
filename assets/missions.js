/* Destination objectives and persisted debriefs, layered over the shared workshop. */
(()=>{
 'use strict';
 const byId=id=>document.getElementById(id);
 const plans={
  'Earth Orbit':{badge:'🛰️ Orbit Operator',fact:'A satellite in orbit is continually falling around Earth. Gravity still acts on it. Observation satellites help us study weather and Earth’s surface.',questions:[{q:'What keeps an orbiting satellite moving around Earth?',a:['Earth’s gravity','There is no gravity in orbit','The Moon’s light'],c:0,e:'Earth’s gravity curves the satellite’s path around the planet.'},{q:'What can an Earth observation satellite study?',a:['Weather and Earth’s surface','Only distant galaxies','Underground dinosaur bones'],c:0,e:'Observation satellites collect images and measurements of Earth, including clouds and weather.'}]},
  Moon:{badge:'🌙 Lunar Explorer',fact:'The Moon’s surface gravity is about 1.62 m/s², roughly one-sixth of Earth’s. It has almost no atmosphere, so parachutes cannot slow a lunar lander. Rock samples help scientists learn about the Moon’s history.',questions:[{q:'Why does a lunar lander need engines rather than a parachute?',a:['The Moon is too bright','The Moon has almost no atmosphere','The Moon has no gravity'],c:1,e:'Parachutes need an atmosphere. Engines provide the thrust for a gentle lunar landing.'},{q:'How does Moon gravity compare with Earth’s?',a:['About six times stronger','About the same','About one-sixth as strong'],c:2,e:'Moon gravity is about 1.62 m/s², compared with about 9.81 m/s² on Earth.'}]}
 };
 let run=JuniorSave.data.destinationMission||null;
 const panel=document.createElement('div');panel.className='panel';panel.style.cssText='max-width:620px;margin:22px auto;text-align:left';panel.id='destinationLearning';byId('exploreMessage').before(panel);
 function persist(){JuniorSave.data.destinationMission=run;JuniorSave.write();}
 function valid(){return !!(plans[destination.name]&&run&&run.destination===destination.name&&run.arrived);}
 function ready(){return valid()&&(destination.name==='Moon'?run.landed&&run.samples.length===3:deployed)&&[0,1].every(i=>run.answers[i]===true);}
 function refresh(){
  if(!plans[destination.name]){panel.hidden=true;byId('deployBtn').hidden=false;byId('deployBtn').disabled=false;byId('dataBtn').hidden=false;byId('returnBtn').disabled=false;return;}
  panel.hidden=false;
  if(!valid()){
   byId('objectives').textContent='Complete a successful flight before exploring this destination.';
   panel.textContent='Return to the workshop and launch your mission.';byId('deployBtn').hidden=true;byId('dataBtn').hidden=true;byId('returnBtn').disabled=true;byId('navContinue').disabled=true;return;
  }
  const moon=destination.name==='Moon',plan=plans[destination.name];
  byId('worldTitle').textContent=moon?'Welcome to the lunar surface!':'Welcome to Earth orbit!';
  byId('worldText').textContent=plan.fact;
  const rows=moon?[['Travel through all checkpoints',true],['Land safely on the lunar pad',run.landed],['Collect three lunar samples',run.samples.length===3]]:[['Reach all three checkpoints and dock',true],['Deploy observation satellite',deployed]];
  rows.push(['Complete the destination quiz',[0,1].every(i=>run.answers[i]===true)]);
  byId('objectives').innerHTML=rows.map(([label,done])=>'<div class="stat"><span>'+label+'</span><b>'+(done?'✅ Complete':'To do')+'</b></div>').join('');
  byId('deployBtn').hidden=moon;byId('deployBtn').disabled=deployed;
  byId('dataBtn').hidden=true;
  panel.replaceChildren();
  if(moon){const h=document.createElement('h3');h.textContent='🔬 Sample collection · '+run.samples.length+' / 3';panel.append(h);const row=document.createElement('div');row.className='row';['Basalt rock','Lunar dust','Crater fragment'].forEach((label,i)=>{const b=document.createElement('button');b.textContent=(run.samples.includes(i)?'✓ ':'')+label;b.disabled=run.samples.includes(i);b.onclick=()=>{if(!valid()||!run.landed||missionClaimed)return;run.samples.push(i);science=run.samples.length===3;persist();refresh();};row.append(b);});panel.append(row);}
  const h=document.createElement('h3');h.textContent='🧠 Destination quiz';panel.append(h);
  plan.questions.forEach((q,i)=>{const title=document.createElement('p');title.textContent=(i+1)+'. '+q.q;panel.append(title);const row=document.createElement('div');row.className='row';q.a.forEach((label,j)=>{const b=document.createElement('button');b.textContent=label;b.disabled=run.answers[i]===true;b.onclick=()=>{if(!valid()||missionClaimed)return;run.answers[i]=j===q.c;run.feedback[i]=(j===q.c?'✓ Correct. ':'Try again. ')+q.e;persist();refresh();};row.append(b);});panel.append(row);const feedback=document.createElement('p');feedback.className='feedback';feedback.setAttribute('role','status');feedback.textContent=run.feedback[i]||'';panel.append(feedback);});
  byId('returnBtn').disabled=!ready();byId('navContinue').disabled=!ready();
  byId('exploreMessage').textContent=ready()?'All objectives complete! Return to Earth for your mission report.':'Complete each objective and both quiz questions to finish the mission. You can retry quiz answers.';
 }
 const originalLaunch=byId('launchBtn').onclick;
 byId('launchBtn').onclick=()=>{if(missingCore().length){originalLaunch();return;}run={destination:destination.name,arrived:false,landed:false,samples:[],answers:[],feedback:[],reward:0};persist();originalLaunch();};
 const originalContinue=byId('continueFlight').onclick;
 byId('continueFlight').onclick=()=>{if(Voyage.status()!=='success')return;const report=JuniorSave.data.voyage;if(report?.destination!==destination.name)return;
  run={destination:destination.name,arrived:true,landed:report.landed===true,samples:[],answers:[],feedback:[],reward:0};persist();originalContinue();refresh();};
 const originalDeploy=byId('deployBtn').onclick;
 byId('deployBtn').onclick=()=>{if(plans[destination.name]){if(!valid()||!installed.has('satellite')||missionClaimed)return;deployed=true;MissionControl.capture();refresh();}else originalDeploy();};
 const originalData=byId('dataBtn').onclick;
 byId('dataBtn').onclick=()=>{if(!plans[destination.name])originalData();};
 const originalReturn=byId('returnBtn').onclick;
 byId('returnBtn').onclick=()=>{if(plans[destination.name]){if(!ready()&&!missionClaimed){refresh();return;}if(!missionClaimed){const before=credits;originalReturn();run.reward=credits-before;Academy.awardVoyage(destination.name);persist();renderResult();}else{originalReturn();renderResult();}}else originalReturn();};
 function renderResult(){if(!plans[destination.name]||!run||run.destination!==destination.name||!missionClaimed)return;byId('returnText').textContent=plans[destination.name].badge+' · All mission objectives complete. Your badge and 100 XP are awarded once per destination.';byId('earned').textContent='+'+run.reward+' credits';}
 const originalChanged=MissionControl.changed;
 MissionControl.changed=id=>{originalChanged(id);if(id==='explore')refresh();if(id==='returned')renderResult();};
 const originalNav=MissionControl.refreshNav;
 MissionControl.refreshNav=()=>{originalNav();if(byId('explore').classList.contains('active')&&plans[destination.name])byId('navContinue').disabled=!ready();};
 function choose(name){if(!plans[name])return;destination=worlds.find(w=>w.name===name);missionClaimed=false;deployed=false;science=false;run=null;persist();MissionControl.open('workshop');}
 const originalAgain=byId('againBtn').onclick;
 byId('againBtn').onclick=()=>{run=null;persist();originalAgain();};
 document.addEventListener('click',e=>{if(e.target.closest?.('[data-world]')){run=null;missionClaimed=false;deployed=false;science=false;persist();}},true);
 window.SpaceMissions={choose};
 // Destination cards are built before this controller is loaded.
 document.addEventListener('click',()=>queueMicrotask(()=>{if(byId('explore').classList.contains('active'))refresh();}));
 if(byId('explore').classList.contains('active'))refresh();
})();
