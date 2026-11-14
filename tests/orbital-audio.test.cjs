const {test}=require('node:test');
const assert=require('node:assert/strict');
const Sound=require('../simulator/audio.js');
test('audio is optional and storage restrictions do not interrupt play',async()=>{
 const sound=new Sound({get localStorage(){throw Error('blocked');}});
 assert.equal(await sound.unlock(),false);
 assert.doesNotThrow(()=>{sound.configure({muted:true,volume:.2});sound.sync({phase:'flying',thrust:1,throttle:1});sound.cue('stage');sound.stop();});
});
test('audio preferences survive reload and invalid saved values are bounded',()=>{
 let value='{"volume":9,"mode":"unknown"}';const host={localStorage:{getItem:()=>value,setItem:(_,v)=>value=v}};
 const sound=new Sound(host);assert.equal(sound.info().volume,1);assert.equal(sound.info().mode,'cinematic');
 sound.configure({volume:.25,mode:'realistic',muted:true});const reloaded=new Sound(host);
 assert.equal(reloaded.info().volume,.25);assert.equal(reloaded.info().mode,'realistic');assert.equal(reloaded.info().muted,true);
});
