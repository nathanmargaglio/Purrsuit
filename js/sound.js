// ===================== SOUND SYSTEM =====================
const soundAssets = { loaded: false, buffers: {} };
let audioCtx, bgMusic = null;
function getAudioCtx() { if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)(); return audioCtx; }

async function loadSoundManifest() {
  try {
    const r = await fetch('sounds/sounds.json'); if (!r.ok) throw 0;
    const manifest = await r.json();
    const ctx = getAudioCtx();
    for (const cat in manifest) soundAssets.buffers[cat] = [];
    await Promise.all(Object.entries(manifest).flatMap(([cat, paths]) =>
      paths.map(async p => {
        try { const r = await fetch(p); const ab = await r.arrayBuffer(); soundAssets.buffers[cat].push(await ctx.decodeAudioData(ab)); } catch(e){}
      })
    ));
    soundAssets.loaded = true;
  } catch(e) { soundAssets.loaded = false; }
}

function playAsset(cat, vol=1, rate=1) {
  if (!soundAssets.loaded || !soundAssets.buffers[cat]?.length) return false;
  try {
    const ctx = getAudioCtx(), buf = soundAssets.buffers[cat][Math.floor(Math.random()*soundAssets.buffers[cat].length)];
    const src = ctx.createBufferSource(), g = ctx.createGain();
    src.buffer = buf; src.playbackRate.value = rate; g.gain.value = vol;
    src.connect(g); g.connect(ctx.destination); src.start(); return true;
  } catch(e) { return false; }
}

function playPositionalAsset(cat, pos, maxVol=0.5, maxDist=15) {
  const d = camera.position.distanceTo(pos);
  return d < maxDist ? playAsset(cat, maxVol*(1-d/maxDist)) : false;
}

function startBgMusic() {
  if (!soundAssets.loaded || !soundAssets.buffers.music?.length || bgMusic) return;
  try { const ctx=getAudioCtx(); bgMusic=ctx.createBufferSource(); const g=ctx.createGain(); bgMusic.buffer=soundAssets.buffers.music[0]; bgMusic.loop=true; g.gain.value=0.3; bgMusic.connect(g); g.connect(ctx.destination); bgMusic.start(); } catch(e){}
}

// Synth fallbacks
function synthCat(pos,sz) {
  try { const ctx=getAudioCtx(),d=camera.position.distanceTo(pos); if(d>12) return; const v=0.08*(1-d/12),bp=(1.5-(sz||1)*0.5)*400,t=ctx.currentTime,o=ctx.createOscillator(),g=ctx.createGain(); o.connect(g);g.connect(ctx.destination);
  const tp=Math.random(); if(tp<0.5){o.frequency.setValueAtTime(bp*1.2,t);o.frequency.exponentialRampToValueAtTime(bp*0.8,t+0.15);o.frequency.exponentialRampToValueAtTime(bp*1.4,t+0.2);o.frequency.exponentialRampToValueAtTime(bp*0.5,t+0.4);g.gain.setValueAtTime(v,t);g.gain.exponentialRampToValueAtTime(0.001,t+0.45);o.start(t);o.stop(t+0.45);} else if(tp<0.8){o.frequency.setValueAtTime(bp*1.5,t);o.frequency.exponentialRampToValueAtTime(bp*0.9,t+0.15);g.gain.setValueAtTime(v*0.7,t);g.gain.exponentialRampToValueAtTime(0.001,t+0.2);o.start(t);o.stop(t+0.2);} else{o.type='sawtooth';o.frequency.setValueAtTime(bp*0.15,t);g.gain.setValueAtTime(v*0.3,t);g.gain.exponentialRampToValueAtTime(0.001,t+0.6);o.start(t);o.stop(t+0.6);}
  } catch(e){} }
function synthCollect() { try { const ctx=getAudioCtx(),t=ctx.currentTime; [523,659,784,1047].forEach((f,i)=>{const o=ctx.createOscillator(),g=ctx.createGain();o.connect(g);g.connect(ctx.destination);o.frequency.setValueAtTime(f,t+i*0.07);g.gain.setValueAtTime(0.1,t+i*0.07);g.gain.exponentialRampToValueAtTime(0.001,t+i*0.07+0.2);o.start(t+i*0.07);o.stop(t+i*0.07+0.2);}); } catch(e){} }

function playCatSound(pos,sz) { const cats=['meow','screech','purring']; if(!playPositionalAsset(cats[Math.floor(Math.random()*3)],pos,0.4,15)) synthCat(pos,sz); }
function playCatchSound() { if(!playAsset('collect',0.5)) synthCollect(); }
function playDepositSound() { if(!playAsset('collect',0.6)) synthCollect(); }
function playWooshSound() { playAsset('woosh',0.4); }
function playTumblingSound() { playAsset('tumbling',0.6); }
function playUpgradeSound() { if(!playAsset('collect',0.5)) synthCollect(); }
