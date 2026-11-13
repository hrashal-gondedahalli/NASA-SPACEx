const {test}=require('node:test');
const assert=require('node:assert/strict');
const {chromium}=require('playwright');
const http=require('node:http');
const fs=require('node:fs/promises');
const path=require('node:path');
const root=path.resolve(__dirname,'..');

test('desktop and touch mobile website regression checks',async()=>{
 const server=http.createServer(async(req,res)=>{
  try{let file=decodeURIComponent(new URL(req.url,'http://localhost').pathname);if(file.endsWith('/'))file+='index.html';const target=path.resolve(root,'.'+file);if(!target.startsWith(root+path.sep))throw Error('Invalid path');res.setHeader('Content-Type','text/html; charset=utf-8');res.end(await fs.readFile(target));}catch{res.writeHead(404);res.end();}
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
   await click('[data-part="satellite"]');await click('#testBtn');await click('#launchBtn');await click('#homeBtn');await page.waitForTimeout(2900);assert.equal(await page.locator('#launchTitle').textContent(),'T-minus 3','Leaving launch cancels timer');
   await click('#startBtn');await click('#toBuild');await click('#testBtn');await click('#launchBtn');await page.waitForTimeout(2900);await click('#steerLeft');await click('#thrustBtn');assert.match(await page.locator('#flightReadout').textContent(),/left.*fast/);await click('#continueFlight');await click('#deployBtn');await click('#dataBtn');await click('#returnBtn');await fits();assert.match(await page.locator('#finalDest').textContent(),/Moon/);await click('#againBtn');
   await page.goto(base+'/junior-astronaut-mission-trainer/');await page.waitForURL(base+'/');await fits();await click('button[onclick="Academy.openMission(\'gravity\')"]');assert.equal(await page.locator('#a-weightResult').textContent(),'48.6 N');await page.selectOption('#a-worldSelect','9.81');assert.equal(await page.locator('#a-weightResult').textContent(),'294.3 N');await click('#homeBtn');
   await click('button[onclick="Academy.openMission(\'launch\')"]');for(const item of await page.locator('#a-checklist input').all())await item.check();await click('#a-launchComplete');await click('#homeBtn');await page.reload();assert.equal(await page.locator('#a-missionStat').textContent(),'1/3');
   await click('button[onclick="Academy.openMission(\'planets\')"]');await fits();await click('#homeBtn');
   await page.fill('#a-cadetName','Cadet');await click('button[onclick="Academy.saveName()"]');await click('#startBtn');await click('#toBuild');await click('[data-part="satellite"]');
   await click('#drawBtn');await page.locator('#board').scrollIntoViewIfNeeded();const savedBox=await page.locator('#sketch').boundingBox();await page.mouse.move(savedBox.x+20,savedBox.y+100);await page.mouse.down();await page.mouse.move(savedBox.x+80,savedBox.y+120);await page.mouse.up();
   const savedCredits=await page.locator('#credits').textContent();await page.reload();assert.equal(await page.locator('#a-cadetName').inputValue(),'Cadet');await click('#resumeBtn');assert(await page.locator('#workshop').isVisible());assert.equal(await page.locator('#credits').textContent(),savedCredits);assert(await ink(),'Sketch survives refresh');
   await click('#homeBtn');await click('button[onclick="Academy.openMission(\'quiz\')"]');await click('#a-answers button:nth-child(2)');await page.reload();await click('#resumeBtn');assert.equal(await page.locator('#a-quizScore').textContent(),'1');assert(await page.locator('#a-nextQuestion').isEnabled());
   await click('#homeBtn');await page.evaluate(()=>Storage.prototype.setItem=()=>{throw Error('Storage unavailable')});await page.fill('#a-cadetName','Cadet');await click('button[onclick="Academy.saveName()"]');assert.match(await page.locator('#saveStatus').textContent(),/unavailable/);
   assert.deepEqual(errors,[],'No uncaught browser errors');await context.close();
  }
 }finally{if(browser)await browser.close();await new Promise(resolve=>server.close(resolve));}
});

