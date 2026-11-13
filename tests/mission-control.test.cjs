// Dependency-free integration checks for the embedded app scripts and save lifecycle.
// This DOM adapter checks behavior, not browser layout or rendering.
const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const html=fs.readFileSync(__dirname+'/../index.html','utf8');
const scripts=[...html.matchAll(/<script>([\s\S]*?)<\/script>/g)].map(m=>m[1]);
function boot(storage=new Map(),blocked=false){
 let context;const pending=[],timers=[];
 class Element{
  constructor(tag,attrs={}){this.tagName=tag;this.attrs=attrs;this.children=[];this.style={};this.value=attrs.value||'';this.checked=false;this.disabled='disabled' in attrs;this.textContent='';this.dataset={};for(const [k,v]of Object.entries(attrs))if(k.startsWith('data-'))this.dataset[k.slice(5)]=v;this.classList={contains:c=>(this.attrs.class||'').split(' ').includes(c),add:c=>this.attrs.class=[...new Set((this.attrs.class||'').split(' ').concat(c))].join(' '),remove:c=>this.attrs.class=(this.attrs.class||'').split(' ').filter(x=>x!==c).join(' '),toggle:(c,force)=>{const add=force===undefined?!this.classList.contains(c):force;this.classList[add?'add':'remove'](c);}};}
  set innerHTML(s){this.children=parse(s).children;}
  get innerHTML(){return '';}
  querySelectorAll(selector){return query(this,selector);}
  querySelector(s){return query(this,s)[0]||null;}
  get selectedOptions(){return this.children.filter(x=>x.tagName==='option'&&x.value===(this.value||this.children[0]?.value)).map(x=>({text:x.textContent}));}
  addEventListener(type,fn){(this.listeners??={})[type]=fn;}
  getBoundingClientRect(){return {width:400,height:420,left:0,top:0};}
  getContext(){return new Proxy({},{get:()=>()=>{}});}
  click(){if(this.disabled)return;if(this.onclick)this.onclick();else if(this.attrs.onclick)vm.runInContext(this.attrs.onclick,context);for(const fn of listeners.click||[])fn();while(pending.length)pending.shift()();}
 }
 function parse(source){const root=new Element('root'),stack=[root];for(const m of source.matchAll(/<!--[^]*?-->|<([^>]+)>|([^<]+)/g)){
  if(m[2]){stack.at(-1).textContent+=m[2];continue;}const t=m[1];if(!t||t.startsWith('!'))continue;if(t[0]==='/'){if(stack.length>1)stack.pop();continue;}
  const name=t.match(/^([^\s/]+)/)?.[1];if(!name)continue;const attrs={};for(const a of t.slice(name.length).matchAll(/([^\s=/>]+)(?:="([^"]*)"|='([^']*)'|=([^\s>]+))?/g))attrs[a[1]]=a[2]??a[3]??a[4]??'';
  const el=new Element(name,attrs);stack.at(-1).children.push(el);if(!['meta','input','br','hr','img','link'].includes(name)&&!t.endsWith('/'))stack.push(el);
 }return root;}
 function descendants(root){return root.children.flatMap(c=>[c,...descendants(c)]);}
 function matches(el,s){if(s.endsWith(':checked'))return el.checked&&matches(el,s.slice(0,-8));if(s[0]==='#')return el.attrs.id===s.slice(1);if(s[0]==='.')return s.slice(1).split('.').every(c=>el.classList.contains(c));if(s[0]==='[')return s.slice(1,-1)in el.attrs;return el.tagName===s;}
 function query(root,s){const selectors=s.split(' ');let roots=[root];for(const selector of selectors)roots=roots.flatMap(r=>descendants(r).filter(el=>matches(el,selector)));return roots;}
 const tree=parse(html.replace(/<script>[\s\S]*?<\/script>/g,''));const listeners={};
 const document={getElementById:id=>query(tree,'#'+id)[0]||null,querySelector:s=>query(tree,s)[0]||null,querySelectorAll:s=>query(tree,s),addEventListener:(type,fn)=>(listeners[type]??=[]).push(fn)};
 let flightPhase='ready';
 const Voyage={start:()=>{flightPhase='flying';document.getElementById('launchActions').classList.add('hidden');},stop:()=>{},status:()=>flightPhase,complete:()=>{flightPhase='success';document.getElementById('launchActions').classList.remove('hidden');}};
 const sandbox={Voyage,document,localStorage:{getItem:k=>{if(blocked)throw Error('blocked');return storage.get(k)||null;},setItem:(k,v)=>{if(blocked)throw Error('blocked');storage.set(k,v);}},ResizeObserver:class{observe(){}},setTimeout:fn=>{timers.push(fn);return timers.length;},clearTimeout:()=>{},queueMicrotask:fn=>pending.push(fn),URLSearchParams,location:{search:''},confirm:()=>true,console};sandbox.window=sandbox;sandbox.scrollTo=()=>{};sandbox.addEventListener=()=>{};
 context=vm.createContext(sandbox);scripts.forEach(s=>vm.runInContext(s,context));
 const $=document.getElementById;return {$,context,storage,active:()=>document.querySelector('.screen.active').attrs.id,click:id=>$(id).click(),run:s=>vm.runInContext(s,context),flush:()=>{while(timers.length)timers.shift()();}};
}
const app=boot();assert.equal(app.active(),'home');assert.equal(app.$('resumeBtn').classList.contains('hidden'),true);
app.$('a-cadetName').value='Raj';app.run('Academy.saveName()');app.click('startBtn');app.click('toBuild');
app.run("document.querySelectorAll('[data-part]').find(x=>x.dataset.part==='satellite').click()");
assert.equal(app.$('credits').textContent,'🪙 80 credits');
let reloaded=boot(app.storage);assert.equal(reloaded.active(),'home');assert.match(reloaded.$('welcomeCadet').textContent,/Raj/);reloaded.click('resumeBtn');assert.equal(reloaded.active(),'workshop');assert.equal(reloaded.$('satellite').classList.contains('hidden'),false);
reloaded.run("['bodypart','engine','tank'].forEach(togglePart)");
reloaded.click('testBtn');reloaded.click('launchBtn');assert.equal(reloaded.$('navContinue').disabled,true);reloaded.flush();assert.equal(reloaded.$('navContinue').disabled,true,'Countdown cannot bypass flight');reloaded.click('continueFlight');assert.equal(reloaded.active(),'launch');reloaded.run('Voyage.complete();MissionControl.refreshNav()');assert.equal(reloaded.$('navContinue').disabled,false);reloaded.click('continueFlight');reloaded.click('deployBtn');reloaded.click('dataBtn');
reloaded=boot(app.storage);reloaded.click('resumeBtn');assert.equal(reloaded.active(),'explore');assert.equal(reloaded.$('objScience').textContent,'✅ Complete');
reloaded.click('returnBtn');const earned=reloaded.$('credits').textContent;reloaded.click('returnBtn');assert.equal(reloaded.$('credits').textContent,earned);assert.equal(reloaded.active(),'returned');
reloaded.click('navContinue');assert.equal(reloaded.active(),'a-planets');reloaded.run('Academy.stampPlanet()');reloaded.click('navContinue');assert.equal(reloaded.active(),'a-quiz');reloaded.run('Academy.answerQuiz(1)');reloaded.run('Academy.capture()');
reloaded=boot(app.storage);reloaded.click('resumeBtn');assert.equal(reloaded.active(),'a-quiz');assert.equal(reloaded.$('a-quizScore').textContent,1);assert.equal(reloaded.$('a-nextQuestion').disabled,false);
reloaded.run('Academy.nextQuiz()');
for(const answer of [2,2,0,1]){reloaded.run('Academy.answerQuiz('+answer+')');reloaded.run('Academy.nextQuiz()');}
reloaded.run('Academy.capture()');const completedXP=reloaded.$('a-xpStat').textContent;
reloaded=boot(app.storage);reloaded.click('resumeBtn');assert.equal(reloaded.$('a-xpStat').textContent,completedXP);assert.equal(reloaded.$('a-nextQuestion').textContent,'Try again');
reloaded.click('navRestart');assert.equal(reloaded.$('a-quizScore').textContent,0);assert.equal(reloaded.$('a-cadetName').value,'Raj');
reloaded.run("MissionControl.open('a-launch')");reloaded.$('a-checklist').querySelectorAll('input')[0].checked=true;reloaded.run('Academy.capture()');
reloaded=boot(app.storage);reloaded.click('resumeBtn');assert.equal(reloaded.$('a-checklist').querySelectorAll('input')[0].checked,true);
const migrated=boot(new Map([['orbitAcademySave',JSON.stringify({name:'Legacy',xp:70,planets:['Mars'],missions:['launch'],launch:true})]]));assert.match(migrated.$('welcomeCadet').textContent,/Legacy/);assert.equal(migrated.$('a-xpStat').textContent,70);
const unavailable=boot(new Map(),true);assert.match(unavailable.$('saveStatus').textContent,/unavailable/);unavailable.click('startBtn');assert.equal(unavailable.active(),'destination');
const ids=[...html.replace(/<script>[\s\S]*?<\/script>/g,'').matchAll(/id="([^"]+)"/g)].map(m=>m[1]);assert.equal(new Set(ids).size,ids.length,'unique element IDs');
// Rocket workshop requirements and credit conservation, including saved legacy parts.
const builder=boot();builder.click('startBtn');builder.click('toBuild');
assert.equal(builder.run('installed.size'),0);assert.equal(builder.$('scoreStat').textContent,'0/100');
assert.equal(builder.$('emptyBlueprint').classList.contains('hidden'),false);
builder.click('testBtn');assert.equal(builder.$('launchBtn').disabled,true);assert.equal(builder.$('navContinue').disabled,true);
for(const name of ['Rocket body','Engine','Fuel tank'])assert(builder.$('readinessSummary').textContent.includes(name));
builder.run("$('launchBtn').onclick()");assert.equal(builder.active(),'workshop','Launch handler guards direct calls');
builder.run("parts.forEach(p=>togglePart(p.id))");assert.equal(builder.run('credits'),25);assert.equal(builder.run('installed.size'),6);
builder.click('testBtn');assert.equal(builder.$('launchBtn').disabled,false);assert.equal(builder.$('testProgress').style.width,'100%');
for(const id of ['bodypart','engine','tank']){
 builder.run('togglePart('+JSON.stringify(id)+')');builder.click('testBtn');
 assert.equal(builder.$('launchBtn').disabled,true);assert.equal(builder.$('navContinue').disabled,true);
 builder.run('togglePart('+JSON.stringify(id)+')');
}
builder.run("['fins','satellite','nose'].forEach(togglePart)");builder.click('testBtn');
assert.equal(builder.$('launchBtn').disabled,false,'Optional parts never block launch');
assert.equal(builder.run('credits'),60);
builder.run("for(let i=0;i<5;i++){togglePart('engine');togglePart('engine');}");
assert.equal(builder.run('credits'),60,'Repeated remove/add never creates or loses credits');
let restored=boot(builder.storage);assert.equal(restored.run('installed.size'),3);assert.equal(restored.run('credits'),60);
restored.click('resumeBtn');assert.equal(restored.$('launchBtn').disabled,false);
restored.click('backBuild');restored.click('resetBuild');assert.equal(restored.run('credits'),100);assert.equal(restored.run('installed.size'),0);
restored.click('resetBuild');assert.equal(restored.run('credits'),100,'Reset cannot refund twice');
restored=boot(restored.storage);assert.equal(restored.run('installed.size'),0,'Empty saved designs stay empty');
restored.run("document.getElementById('board').ondrop({preventDefault(){},dataTransfer:{getData(){return 'engine';}}})");
assert.equal(restored.run('credits'),85);
restored.run("document.getElementById('board').ondrop({preventDefault(){},dataTransfer:{getData(){return 'engine';}}})");
assert.equal(restored.run('credits'),85,'Dropping an installed part does not remove or rebuy it');
restored=boot(restored.storage);assert.equal(restored.run("installed.has('engine')"),true,'Drops persist without a click');
const legacy=boot(new Map([['juniorAstronautSave',JSON.stringify({version:1,rocket:{credits:80,installed:['bodypart','engine','tank','nose','satellite'],purchased:['satellite']}})]]));
legacy.run("togglePart('engine')");assert.equal(legacy.run('credits'),80,'Free legacy parts give no refund');
legacy.run("togglePart('satellite')");assert.equal(legacy.run('credits'),100);
legacy.run("togglePart('engine')");assert.equal(legacy.run('credits'),85);
legacy.run("resetDesign()");assert.equal(legacy.run('credits'),100);assert.equal(legacy.run('installed.size'),0);
const poor=boot(new Map([['juniorAstronautSave',JSON.stringify({version:1,rocket:{credits:0,installed:[],purchased:[]}})]]));
poor.run("togglePart('engine')");assert.equal(poor.run('installed.size'),0);assert.equal(poor.run('credits'),0);
assert.match(poor.$('buildHint').textContent,/Not enough credits/);
console.log('PASS: profile, navigation, save/resume, objectives, rewards, quiz, migration, storage, unique IDs, empty workshop, all core launch gates, optional parts, refunds, resets, drops, legacy credits, insufficient funds');


