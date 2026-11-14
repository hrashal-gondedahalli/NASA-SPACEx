const {test}=require('node:test'),assert=require('node:assert/strict'),{chromium}=require('playwright'),http=require('node:http'),fs=require('node:fs/promises'),path=require('node:path'),root=path.resolve(__dirname,'..');
for(const mobile of [false,true])test('Page navigation '+(mobile?'mobile':'desktop')+': dashboard sections, activity history and app return paths under GitHub Pages prefix',{timeout:150000},async t=>{
 const prefix='/NASA-SPACEx/';
 const server=http.createServer(async(req,res)=>{try{let url=new URL(req.url,'http://localhost').pathname;if(!url.startsWith(prefix))throw Error('Outside project prefix');url=url.slice(prefix.length);if(!url||url.endsWith('/'))url+='index.html';const file=path.resolve(root,url);if(!file.startsWith(root+path.sep))throw Error('Outside root');res.setHeader('Content-Type',({'.js':'text/javascript','.css':'text/css','.jpg':'image/jpeg'}[path.extname(file)]||'text/html'));res.end(await fs.readFile(file));}catch{res.writeHead(404).end();}});
 await new Promise(r=>server.listen(0,'127.0.0.1',r));let browser;
 t.signal.addEventListener('abort',()=>{browser?.close().catch(()=>{});server.closeAllConnections();});
 try{
  browser=await chromium.launch({headless:true,args:['--enable-unsafe-swiftshader'],...(process.env.CHROMIUM_PATH?{executablePath:process.env.CHROMIUM_PATH}:{channel:'chromium'})});
  const context=await browser.newContext({viewport:mobile?{width:390,height:844}:{width:1440,height:900},isMobile:mobile,hasTouch:mobile,reducedMotion:'reduce'}),page=await context.newPage(),errors=[],failed=[];
  page.on('pageerror',e=>errors.push(e.message));page.on('requestfailed',r=>failed.push(r.url()));page.setDefaultTimeout(15000);
  // Route behavior must also work with the dashboard's non-WebGL fallback.
  await page.addInitScript(()=>{if(location.pathname==='/NASA-SPACEx/'){const get=HTMLCanvasElement.prototype.getContext;HTMLCanvasElement.prototype.getContext=function(type,...args){return String(type).includes('webgl')?null:get.call(this,type,...args);};}});
  const base='http://127.0.0.1:'+server.address().port+prefix;
  const click=async selector=>{const l=page.locator(selector);await l.scrollIntoViewIfNeeded();await l.click({noWaitAfter:true});};
  const route=async(name,screen='home')=>{await page.waitForURL(base+'#'+name,{waitUntil:'commit'});await page.waitForFunction(id=>document.querySelector('.screen.active')?.id===id,screen);};
  const nav=async name=>click('.dash-nav a[href="#'+name+'"]');
  const aligned=async id=>{await page.waitForFunction(id=>{const a=document.getElementById(id).getBoundingClientRect(),h=document.querySelector('.site-header').getBoundingClientRect();return a.top>=h.bottom-2&&a.top<h.bottom+45;},id);};
  await page.goto(base+'#missions');await route('missions');await aligned('missions');
  assert.equal(await page.locator('.dash-nav a[aria-current]').getAttribute('href'),'#missions');
  await click('button[onclick="MissionControl.voyage()"]');await route('testing','testing');
  assert(await page.locator('.dash-nav').isVisible());
  await nav('profile');await route('profile');await aligned('profile');
  await page.goBack({waitUntil:'commit'});await route('testing','testing');
  await page.goForward({waitUntil:'commit'});await route('profile');await page.reload();await route('profile');await aligned('profile');
  await nav('missions');await route('missions');await click('button[onclick="Academy.openMission(\'gravity\')"]');await route('a-gravity','a-gravity');
  await nav('home');await route('home');await page.goBack({waitUntil:'commit'});await route('a-gravity','a-gravity');
  await page.reload();await route('a-gravity','a-gravity');assert(await page.locator('.dash-nav').isVisible());
  await fs.mkdir(path.join(root,'test-results'),{recursive:true});await page.screenshot({path:path.join(root,'test-results','page-navigation-activity-'+(mobile?'mobile':'desktop')+'.png')});
  await nav('voyage');await route('voyage');await aligned('voyage');await click('.mark15-link');
  await page.waitForFunction(()=>document.body.dataset.ready==='true');await click('#returnHome');await route('voyage');await aligned('voyage');
  await click('.dash-nav a[href="solar-system/immersive.html"]');await page.waitForURL(base+'solar-system/immersive.html');
  await click('header a[href="../#home"]');await route('home');
  await page.goto(base+'solar-system/');await click('header a[href="../#missions"]');await route('missions');await aligned('missions');
  await click('.outpost-legacy-link');await page.waitForURL(base+'outpost/');await click('footer a[href="../#missions"]');await route('missions');
  await click('.missions a[href^="simulator/"]');await page.waitForFunction(()=>window.SimLab);await click('#menuBtn');await click('#settingsDialog a[href="../#missions"]');await route('missions');await aligned('missions');
  await page.goto(base+'#launch');await route('testing','testing');assert(await page.locator('#launchBtn').isVisible());
  await nav('voyage');await route('voyage');await aligned('voyage');
  assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
  await page.screenshot({path:path.join(root,'test-results','page-navigation-voyage-'+(mobile?'mobile':'desktop')+'.png')});
  assert.deepEqual(errors,[]);assert.deepEqual(failed,[]);await context.close();
 }finally{await browser?.close();await new Promise(r=>server.close(r));}
});
