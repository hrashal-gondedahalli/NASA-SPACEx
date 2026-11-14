// Isolate long WebGL playthroughs; every test file belongs to exactly one suite.
const fs=require('node:fs'),{spawnSync}=require('node:child_process');
const suite=process.env.TEST_SUITE;
if(!['unit','flight','surface','features'].includes(suite))throw Error('Unknown test suite');
function group(name){if(!/require\(['"]playwright['"]\)/.test(fs.readFileSync('tests/'+name,'utf8')))return 'unit';if(name==='orbital-browser.test.cjs')return 'flight';if(name==='surface-browser.test.cjs')return 'surface';return 'features';}
const files=fs.readdirSync('tests').filter(n=>n.endsWith('.test.cjs')&&group(n)===suite).sort().map(n=>'tests/'+n);
if(!files.length)throw Error('Empty test suite');
const result=spawnSync(process.execPath,['--test','--test-concurrency=1',...files],{stdio:'inherit'});
process.exit(result.status??1);
