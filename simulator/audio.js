/* Original procedural effects: no downloads, recordings, or audio service required. */
(function(root,factory){
 if(typeof module==='object'&&module.exports)module.exports=factory();
 else root.OrbitalAudio=factory();
})(typeof globalThis!=='undefined'?globalThis:this,function(){
 const KEY='junior-orbital-audio-v1',clamp=(n,a,b)=>Math.max(a,Math.min(b,n));
 class Sound{
  constructor(host=globalThis){
   this.host=host;this.ctx=null;this.nodes=new Set();this.blocked=false;this.engineLevel=0;this.lastCue=null;this.wasBurning=false;
   this.settings={muted:false,volume:.35,mode:'cinematic',music:true};this.musicBuffer=null;this.musicSource=null;this.musicGain=null;
   try{const v=JSON.parse(host.localStorage.getItem(KEY)||'null');if(v){this.settings.muted=v.muted===true;if(Number.isFinite(v.volume))this.settings.volume=clamp(v.volume,0,1);if(v.mode==='realistic')this.settings.mode=v.mode;if(typeof v.music==='boolean')this.settings.music=v.music;}}catch{}
  }
  save(){try{this.host.localStorage.setItem(KEY,JSON.stringify(this.settings));}catch{}}
  configure(values){if(typeof values.muted==='boolean')this.settings.muted=values.muted;if(typeof values.music==='boolean')this.settings.music=values.music;if(Number.isFinite(values.volume))this.settings.volume=clamp(values.volume,0,1);if(['cinematic','realistic'].includes(values.mode))this.settings.mode=values.mode;this.save();if(this.settings.muted||!this.settings.volume)this.stop();this.levels();if(this.settings.music&&!this.settings.muted&&this.settings.volume)this.startMusic();else this.stopMusic();}
  unlock(){
   try{
    if(!this.ctx){
     const Context=this.host.AudioContext||this.host.webkitAudioContext;if(!Context)return Promise.resolve(false);
     this.ctx=new Context();const c=this.ctx;
     this.master=c.createGain();this.master.gain.value=0;this.master.connect(c.destination);
     this.engine=c.createGain();this.engine.gain.value=0;this.engine.connect(this.master);
     const buffer=c.createBuffer(1,c.sampleRate*2,c.sampleRate),data=buffer.getChannelData(0);
     for(let i=0;i<data.length;i++)data[i]=Math.random()*2-1;
     this.noise=c.createBufferSource();this.noise.buffer=buffer;this.noise.loop=true;
     this.filter=c.createBiquadFilter();this.filter.type='lowpass';this.filter.frequency.value=240;
     this.noise.connect(this.filter);this.filter.connect(this.engine);this.noise.start();
     const length=c.sampleRate*12,musicBuf=c.createBuffer(1,length,c.sampleRate),samples=musicBuf.getChannelData(0),bass=[65.41,73.42,55,82.41],lead=[261.63,329.63,392,329.63,293.66,220,246.94,293.66];
     for(let i=0;i<length;i++){const t=i/c.sampleRate,bar=Math.floor(t/3)%4,step=Math.floor(t/1.5)%8,phase=t%1.5,fade=Math.min(1,phase/.12,(1.5-phase)/.18);const low=Math.sin(2*Math.PI*bass[bar]*t)*.12;const note=lead[step],melody=(Math.sin(2*Math.PI*note*t)+.32*Math.sin(2*Math.PI*note*2*t))*.045*Math.max(0,fade);const pad=(Math.sin(2*Math.PI*(bass[bar]*2)*t)+Math.sin(2*Math.PI*(bass[bar]*2.5)*t))*.025;samples[i]=low+melody+pad;}
     this.musicBuffer=musicBuf;
     this.rumble=c.createOscillator();this.rumble.type='sine';this.rumble.frequency.value=42;
     this.rumbleGain=c.createGain();this.rumbleGain.gain.value=.15;this.rumble.connect(this.rumbleGain);this.rumbleGain.connect(this.engine);this.rumble.start();
    }
    const pending=this.ctx.state==='running'?Promise.resolve():this.ctx.resume();
    return Promise.resolve(pending).then(()=>{this.levels();if(this.settings.music&&!this.settings.muted&&this.settings.volume)this.startMusic();return this.ctx.state==='running';}).catch(()=>false);
   }catch{return Promise.resolve(false);}
  }
  startMusic(){if(!this.ctx||!this.master||!this.musicBuffer||this.musicSource||!this.settings.music||this.settings.muted||!this.settings.volume||this.ctx.state!=='running')return;this.musicSource=this.ctx.createBufferSource();this.musicSource.buffer=this.musicBuffer;this.musicSource.loop=true;this.musicGain=this.ctx.createGain();this.musicGain.gain.value=.42;this.musicSource.connect(this.musicGain);this.musicGain.connect(this.master);this.musicSource.start();}
  stopMusic(){if(this.musicSource){try{this.musicSource.stop();}catch{}this.musicSource.disconnect();this.musicSource=null;}if(this.musicGain){this.musicGain.disconnect();this.musicGain=null;}}
  levels(){if(!this.ctx||!this.master)return;this.master.gain.setTargetAtTime(this.blocked||this.settings.muted?0:this.settings.volume,this.ctx.currentTime,.025);}
  stop(){
   this.engineLevel=0;this.wasBurning=false;
   if(this.engine)this.engine.gain.setTargetAtTime(0,this.ctx.currentTime,.015);
   for(const node of [...this.nodes]){try{node.stop();}catch{}node.disconnect();this.nodes.delete(node);}
  }
  setBlocked(value){this.blocked=!!value;if(this.blocked)this.stop();this.levels();}
  cue(name){
   if(!this.ctx||this.ctx.state!=='running'||this.settings.muted||!this.settings.volume||this.blocked)return false;
   const notes={
    build:[[500,.035,0,.08],[740,.04,.035,.05]],
    launch:[[440,.12,0,.1],[660,.14,.15,.1]],
    ignition:[[85,.16,0,.15]],
    stage:[[120,.07,0,.16],[65,.15,.07,.1]],
    deploy:[[240,.07,0,.1],[340,.07,.09,.08]],
    landed:[[523,.16,0,.1],[659,.16,.18,.1],[784,.3,.36,.1]],
    crashed:[[110,.18,0,.1],[75,.25,.2,.08]]
   }[name];if(!notes)return false;
   this.lastCue=name;
   for(const [frequency,duration,delay,volume]of notes){
    if(this.nodes.size>=16)break;
    const c=this.ctx,start=c.currentTime+delay,node=c.createOscillator(),gain=c.createGain();
    node.type=['stage','ignition','crashed'].includes(name)?'triangle':'sine';node.frequency.value=frequency;
    gain.gain.setValueAtTime(0,start);gain.gain.linearRampToValueAtTime(volume,start+.008);gain.gain.exponentialRampToValueAtTime(.0001,start+duration);
    node.connect(gain);gain.connect(this.master);this.nodes.add(node);
    node.onended=()=>{node.disconnect();gain.disconnect();this.nodes.delete(node);};
    node.start(start);node.stop(start+duration+.01);
   }
   return true;
  }
  sync(state){
   const blocked=!!(state.paused||state.hidden);if(blocked!==this.blocked)this.setBlocked(blocked);
   if(!this.ctx||!this.engine)return;
   const burning=state.phase==='flying'&&state.thrust>0&&!blocked&&!this.settings.muted&&this.settings.volume>0;
   const throttle=clamp(Number(state.throttle)||0,0,1),space=state.body==='Moon'||state.altitude>70000;
   this.engineLevel=burning?Math.sqrt(throttle)*(this.settings.mode==='realistic'&&space?.045:.32):0;
   // Realistic mode represents cabin vibration in vacuum, not exterior sound.
   this.engine.gain.setTargetAtTime(this.engineLevel,this.ctx.currentTime,.06);
   this.filter.frequency.setTargetAtTime(160+throttle*650,this.ctx.currentTime,.08);
   this.rumble.frequency.setTargetAtTime(35+throttle*25,this.ctx.currentTime,.08);
   if(burning&&!this.wasBurning)this.cue('ignition');this.wasBurning=burning;
  }
  info(){return {available:!!(this.host.AudioContext||this.host.webkitAudioContext),unlocked:this.ctx?.state==='running',...this.settings,blocked:this.blocked,engineLevel:this.engineLevel,activeCues:this.nodes.size,lastCue:this.lastCue};}
 }
 return Sound;
});
