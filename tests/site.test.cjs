const {test}=require('node:test');
const assert=require('node:assert/strict');
const {chromium}=require('playwright');
const http=require('node:http');
const fs=require('node:fs/promises');
const path=require('node:path');
const root=path.resolve(__dirname,'..');

test('desktop and touch mobile website regression checks',async()=>{
 const server=http.createServer(async(req,res)=>{
  try{let file=decodeURIComponent(new URL(req.url,'http://localhost').pathname);if(file.endsWith('/'))file+='index.html';const target=path.resolve(root,'.'+file);if(!target.startsWith(root+path.sep))throw Error('Invalid path');res.setHeader('Content-Type',({'.js':'text/javascript','.css':'text/css'}[path.extname(target)]||'text/html')+'; charset=utf-8');res.end(await fs.readFile(target));}catch{res.writeHead(404);res.end();}
 });
 await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
 let browser;
 try{
  browser=await chromium.launch({headless:true,...(process.env.CHROMIUM_PATH?{executablePath:process.env.CHROMIUM_PATH}:{channel:'chromium'})});
  const base='http://127.0.0.1:'+server.address().port;
  for(const mobile of [false,true]){
   const context=await browser.newContext({viewport:mobile?{width:390,height:844}:{width:1440,height:1000},hasTouch:mobile,isMobile:mobile,deviceScaleFactor:mobile?2:1});
   const page=await context.newPage();const errors=[];page.on('pageerror',e=>errors.push(e.message));
   const click=async selector=>{if(mobile)await page.locator(selector).tap();else await page.click(selector);};
   const fits=async()=>assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),'No horizontal page overflow');
   await page.goto(base);await fits();await click('#startBtn');await click('#toBuild');await fits();
   assert.equal(await page.locator('[data-part].chosen').count(),0,'New blueprint is empty');
   assert.equal(await page.locator('#scoreStat').textContent(),'0/100');
   await click('#testBtn');assert(await page.locator('#launchBtn').isDisabled());assert(await page.locator('#navContinue').isDisabled());
   assert.match(await page.locator('#readinessSummary').textContent(),/Rocket body, Engine, Fuel tank/);await click('#backBuild');
   assert(await page.evaluate(()=>sketch.width>100&&sketch.height>100),'Canvas sized after opening workshop');
   await click('#drawBtn');await page.locator('#board').scrollIntoViewIfNeeded();
   const box=await page.locator('#sketch').boundingBox();
   if(mobile){const cdp=await context.newCDPSession(page);await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x:box.x+30,y:box.y+80}]});await cdp.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x:box.x+90,y:box.y+110}]});await cdp.send('Input.dispatchTouchEvent',{type:'touchCancel',touchPoints:[]});}
   else{await page.mouse.move(box.x+30,box.y+80);await page.mouse.down();await page.mouse.move(box.x+90,box.y+110);await page.mouse.up();}
   const ink=()=>page.evaluate(()=>ctx.getImageData(0,0,canvas.width,canvas.height).data.some((v,i)=>i%4===3&&v>0));
   assert(await ink(),'Drawing produces visible pixels');
   await page.setViewportSize(mobile?{width:412,height:915}:{width:1280,height:800});await page.waitForTimeout(100);assert(await ink(),'Sketch survives resize');
   await click('#clearDraw');assert(!(await ink()),'Clear sketch removes pixels');await click('#drawBtn');
   const creditsBefore=await page.locator('#credits').textContent();await click('[data-part="fins"]');await click('[data-part="fins"]');assert.equal(await page.locator('#credits').textContent(),creditsBefore,'Part removal refunds purchase');
   await click('[data-part="satellite"]');await click('#resetBuild');assert.equal(await page.locator('#credits').textContent(),creditsBefore,'Reset refunds purchases');
   for(const id of ['bodypart','engine','tank'])await click('[data-part="'+id+'"]');
   await click('[data-part="satellite"]');await click('#testBtn');await click('#launchBtn');
   assert(await page.locator('#voyageTitle').isVisible());assert(await page.locator('#navContinue').isDisabled());await click('#voyagePrimary');await click('#homeBtn');await page.waitForTimeout(100);assert.equal(await page.evaluate(()=>Voyage.status()),'aborted');
   await click('#startBtn');await click('#toBuild');await click('#testBtn');await click('#launchBtn');await fits();
   await fs.mkdir(path.join(root,'test-results'),{recursive:true});await page.screenshot({path:path.join(root,'test-results',mobile?'voyage-mobile.png':'voyage-desktop.png'),fullPage:true});
   await page.clock.install();await click('#voyagePrimary');await page.clock.runFor(3200);assert.equal(await page.evaluate(()=>Voyage.status()),'flying');
   await page.keyboard.down('ArrowUp');await page.clock.runFor(1000);await page.keyboard.up('ArrowUp');assert(Number(await page.locator('#voyageSpeed').textContent())>40);assert(Number((await page.locator('#voyageFuel').textContent()).replace('%',''))<100);
   await page.screenshot({path:path.join(root,'test-results',mobile?'voyage-flight-mobile.png':'voyage-flight-desktop.png'),fullPage:true});
   await click('#pauseFlight');const frozen=await page.evaluate(()=>Voyage.telemetry());await page.clock.runFor(5000);assert.deepEqual(await page.evaluate(()=>Voyage.telemetry()),frozen,'Pause freezes fuel and movement');await click('#voyagePrimary');
   if(mobile){
    await page.locator('#flightControls').scrollIntoViewIfNeeded();const b=await page.locator('#steerRight').boundingBox(),cdp=await context.newCDPSession(page);const thrustBox=await page.locator('#thrustBtn').boundingBox(),fuelBefore=(await page.evaluate(()=>Voyage.telemetry())).fuel;await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{id:0,x:b.x+b.width/2,y:b.y+b.height/2},{id:1,x:thrustBox.x+thrustBox.width/2,y:thrustBox.y+thrustBox.height/2}]});await page.clock.runFor(300);assert((await page.evaluate(()=>Voyage.telemetry())).angle>.3);assert((await page.evaluate(()=>Voyage.telemetry())).fuel<fuelBefore,'Multi-touch turns and thrusts together');await cdp.send('Input.dispatchTouchEvent',{type:'touchCancel',touchPoints:[]});const a=(await page.evaluate(()=>Voyage.telemetry())).angle;await page.clock.runFor(300);assert.equal((await page.evaluate(()=>Voyage.telemetry())).angle,a,'Cancelled touch releases steering');
   }
   // Fly using only keyboard input and the same public read-only telemetry as the HUD.
   async function flyRoute(){let held=new Set();
   for(let tick=0;tick<900;tick++){
    const state=await page.evaluate(()=>Voyage.telemetry());if(state.phase!=='flying')break;
    const target=state.gates.find(g=>!g.done)||{x:1770,y:270},dx=target.x-state.x,dy=target.y-state.y,d=Math.hypot(dx,dy),v=Math.hypot(state.vx,state.vy),desired=Math.atan2(dy-state.vy*.7,dx-state.vx*.7),diff=Math.atan2(Math.sin(desired-state.angle),Math.cos(desired-state.angle)),dock=state.gates.every(g=>g.done);
    const wanted=new Set();if(state.stage==='landing'){if(state.vy>23)wanted.add('ArrowDown');}else{if(diff<-.05)wanted.add('ArrowLeft');if(diff>.05)wanted.add('ArrowRight');if(Math.abs(diff)<.3&&v<(dock&&d<180?48:115))wanted.add('ArrowUp');if(dock&&d<180&&v>45||Math.abs(diff)>1.3&&v>65)wanted.add('ArrowDown');}
    for(const k of held)if(!wanted.has(k))await page.keyboard.up(k);for(const k of wanted)if(!held.has(k))await page.keyboard.down(k);held=wanted;await page.clock.runFor(100);
   }
   for(const k of held)await page.keyboard.up(k);}
   await flyRoute();assert.equal(await page.evaluate(()=>Voyage.status()),'success',JSON.stringify(await page.evaluate(()=>Voyage.telemetry())));assert(await page.locator('#navContinue').isEnabled());
   const flightSave=await page.evaluate(()=>JuniorSave.data.voyage);assert.equal(flightSave.destination,'Moon');assert(flightSave.score>0);await click('#voyagePrimary');assert(await page.locator('#returnBtn').isDisabled());
   assert.equal(flightSave.landed,true);for(let i=0;i<3;i++)await click('#destinationLearning .row:first-of-type button:nth-child('+(i+1)+')');
   await click('#returnBtn');await fits();assert.match(await page.locator('#finalDest').textContent(),/Moon/);
   await click('#homeBtn');await click('button[onclick="SpaceMissions.choose(\'Earth Orbit\')"]');await click('#testBtn');await click('#launchBtn');await click('#voyagePrimary');await page.clock.runFor(3200);await flyRoute();
   assert.equal(await page.evaluate(()=>Voyage.status()),'success');await click('#voyagePrimary');assert(await page.locator('#returnBtn').isDisabled());await click('#deployBtn');
   await page.reload();await click('#resumeBtn');assert.match(await page.locator('#objectives').textContent(),/Deploy observation satellite/);assert(await page.locator('#returnBtn').isEnabled());await click('#returnBtn');
   assert.equal(await page.locator('#a-topXP').textContent(),'200');const paid=await page.locator('#credits').textContent();await page.evaluate(()=>document.getElementById('returnBtn').onclick());assert.equal(await page.locator('#credits').textContent(),paid);await click('#homeBtn');assert.match(await page.locator('#a-achievements').textContent(),/Orbit Operator/);await click('#resumeBtn');
   await click('#againBtn');await click('#toBuild');for(const id of ['bodypart','engine','tank'])await click('[data-part="'+id+'"]');await click('#testBtn');await click('#launchBtn');await click('#voyagePrimary');await page.clock.runFor(3200);await page.keyboard.down('ArrowUp');await page.clock.runFor(22000);await page.keyboard.up('ArrowUp');assert.equal(await page.evaluate(()=>Voyage.status()),'failed');assert.match(await page.locator('#voyageExplanation').textContent(),/repairs/);await click('#voyagePrimary');assert.equal(await page.evaluate(()=>Voyage.status()),'ready');assert.equal(await page.locator('#voyageFuel').textContent(),'100%');await click('#homeBtn');await page.clock.resume();
   await page.goto(base+'/junior-astronaut-mission-trainer/');await page.waitForURL(base+'/');await fits();await click('button[onclick="Academy.openMission(\'gravity\')"]');assert.equal(await page.locator('#a-weightResult').textContent(),'48.6 N');await page.selectOption('#a-worldSelect','9.81');assert.equal(await page.locator('#a-weightResult').textContent(),'294.3 N');await click('#homeBtn');
   await click('button[onclick="Academy.openMission(\'launch\')"]');for(const item of await page.locator('#a-checklist input').all())await item.check();await click('#a-launchComplete');await click('#homeBtn');await page.reload();assert.equal(await page.locator('#a-missionStat').textContent(),'1/2');
   await click('button[onclick="Academy.openMission(\'planets\')"]');await fits();await click('#homeBtn');
   await page.fill('#a-cadetName','Cadet');await click('button[onclick="Academy.saveName()"]');await click('#startBtn');await click('#toBuild');await click('[data-part="satellite"]');
   await click('#drawBtn');await page.locator('#board').scrollIntoViewIfNeeded();const savedBox=await page.locator('#sketch').boundingBox();await page.mouse.move(savedBox.x+20,savedBox.y+100);await page.mouse.down();await page.mouse.move(savedBox.x+80,savedBox.y+120);await page.mouse.up();
   const savedCredits=await page.locator('#credits').textContent();await page.reload();assert.equal(await page.locator('#a-cadetName').inputValue(),'Cadet');await click('#resumeBtn');assert(await page.locator('#workshop').isVisible());assert.equal(await page.locator('#credits').textContent(),savedCredits);assert(await ink(),'Sketch survives refresh');
   assert.equal(await page.locator('#a-quiz').count(),0);
   await click('#homeBtn');await page.evaluate(()=>Storage.prototype.setItem=()=>{throw Error('Storage unavailable')});await page.fill('#a-cadetName','Cadet');await click('button[onclick="Academy.saveName()"]');assert.match(await page.locator('#saveStatus').textContent(),/unavailable/);
   assert.deepEqual(errors,[],'No uncaught browser errors');await context.close();
  }
 }finally{if(browser)await browser.close();await new Promise(resolve=>server.close(resolve));}
});





