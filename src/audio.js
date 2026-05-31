import { S, LS } from './shared.js';

// ─── Audio state (module-local) ───────────────────────────────────────────────
let audioCtx=null,masterGain=null,bgmPlaying=false,bgmNextTime=0,bgmBeat=0,bgmScheduler=null,bgmNodes=[];

// iOS routes Web Audio to earpiece by default; playing a silent <audio> forces speaker output
let _speakerUnlocked=false;
function unlockSpeaker(){
  if(_speakerUnlocked)return;
  _speakerUnlocked=true;
  const a=document.createElement('audio');
  // minimal silent WAV (0 samples, valid header) — forces iOS to route Web Audio
  // to the speaker instead of the earpiece.  Stop after 1s; the routing persists.
  a.src='data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEARKwAAIhYAQACABAAZGF0YQAAAAA=';
  a.volume=0.001;a.loop=true;
  a.play().then(()=>setTimeout(()=>{a.pause();a.src='';},1000)).catch(()=>{});
}

function getAudioCtx(){
  if(!audioCtx){
    audioCtx=new(window.AudioContext||window.webkitAudioContext)();
    masterGain=audioCtx.createGain();
    masterGain.connect(audioCtx.destination);
    masterGain.gain.value=S.muteAudio?0:1;
  }
  unlockSpeaker();
  if(audioCtx.state==='suspended')audioCtx.resume();
  return audioCtx;
}

export function toggleMute(){
  S.muteAudio=!S.muteAudio;
  if(masterGain)masterGain.gain.value=S.muteAudio?0:1;
  localStorage.setItem(LS.MUTE,S.muteAudio?'1':'0');
  const icon=document.getElementById('mute-icon');
  const btn=document.getElementById('btn-mute');
  if(icon)icon.textContent=S.muteAudio?'volume_off':'volume_up';
  if(btn)btn.classList.toggle('muted',S.muteAudio);
  const ovBtn=document.getElementById('ov-mute-btn');
  if(ovBtn){ovBtn.textContent=S.muteAudio?'🔇 AUDIO OFF':'🔊 AUDIO ON';ovBtn.classList.toggle('muted',S.muteAudio);}
}

const _n=s=>440*Math.pow(2,s/12);

// ── NORMAL BGM: A minor, 4 bars × 16 steps = 64 16th-notes ───────────────
// Melody (square, lead voice)
const BGM_MELODY=[
  // Bar 1 – Am arpeggio + descent
  _n(12),null,_n(7),null,  _n(3),_n(7),null,_n(10),  null,_n(7),null,_n(3),  _n(2),null,_n(0),null,
  // Bar 2 – F→C ascent
  _n(8),null,null,_n(10),  _n(12),null,_n(10),null,  _n(8),_n(7),null,null,  _n(5),null,_n(7),null,
  // Bar 3 – syncopated climb
  _n(0),_n(3),null,_n(5),  _n(7),null,_n(10),null,  _n(12),null,_n(10),_n(8),  null,_n(7),null,_n(5),
  // Bar 4 – climax + resolve
  _n(7),null,_n(10),null,  _n(12),_n(10),_n(8),null,  _n(7),null,_n(5),null,  _n(0),null,null,null,
];
// Harmony (triangle, 3rds below melody — softer colour)
const BGM_HARMONY=[
  _n(8),null,_n(3),null,  _n(0),_n(3),null,_n(7),  null,_n(3),null,_n(0),  _n(-2),null,_n(-5),null,
  _n(5),null,null,_n(7),  _n(8),null,_n(7),null,  _n(5),_n(3),null,null,  _n(2),null,_n(3),null,
  _n(-5),_n(0),null,_n(2),  _n(3),null,_n(7),null,  _n(8),null,_n(7),_n(5),  null,_n(3),null,_n(2),
  _n(3),null,_n(7),null,  _n(8),_n(7),_n(5),null,  _n(3),null,_n(2),null,  _n(-5),null,null,null,
];
// Walking bass (triangle): one note per quarter-note = every 4 steps, 16 notes total
const BGM_BASS_WALK=[
  _n(0)/4,_n(7)/4,  _n(0)/4,_n(3)/4,   // Bar 1: A E A C
  _n(8)/4,_n(8)/4,  _n(3)/4,_n(7)/4,   // Bar 2: F F C E
  _n(0)/4,_n(0)/4,  _n(-2)/4,_n(-2)/4, // Bar 3: A A G G
  _n(3)/4,_n(5)/4,  _n(0)/4,_n(0)/4,   // Bar 4: C D A A
];
// Drum bit-flags (16 steps, loops): bit0=kick bit1=snare bit2=hihat (combinable)
// e.g. 5=kick+hihat(1+4), 6=snare+hihat(2+4)
const BGM_DRUM_PAT=[1,0,4,0, 2,0,4,0, 1,0,4,0, 2,0,4,0];

// ── CHALLENGE BGM: A harmonic minor, chaotic + exhilarating ──────────────
// Uses G#(_n(11)) leading tone + wide leaps + chromatic tension
const CHALLENGE_MELODY=[
  // Bar 1 – explosive harmonic-minor burst (G# leading tone)
  _n(0),_n(7),_n(12),_n(11), _n(12),_n(15),_n(12),_n(11), _n(12),null,_n(7),null, _n(11),_n(12),_n(15),null,
  // Bar 2 – wild chromatic descent from high D
  _n(17),_n(15),null,_n(12), _n(11),null,_n(10),null, _n(8),null,_n(7),null, _n(11),_n(12),null,null,
  // Bar 3 – octave leaps + syncopation
  _n(0),null,_n(12),null, _n(7),_n(11),_n(12),null, _n(19),_n(17),_n(15),null, _n(12),_n(11),_n(12),null,
  // Bar 4 – full ascending run → crash
  _n(0),_n(3),_n(7),_n(11), _n(12),_n(14),_n(15),_n(17), _n(19),null,_n(15),null, _n(12),_n(7),_n(0),null,
];
// Harmony: mix of tritones (6 semi) and dissonant 2nds for chaos
const CHALLENGE_HARMONY=[
  _n(-5),_n(3),_n(6),_n(7), _n(6),_n(9),_n(8),_n(7), _n(6),null,_n(3),null, _n(7),_n(6),_n(9),null,
  _n(11),_n(9),null,_n(8), _n(7),null,_n(6),null, _n(5),null,_n(3),null, _n(7),_n(8),null,null,
  _n(-5),null,_n(8),null, _n(3),_n(7),_n(8),null, _n(15),_n(13),_n(11),null, _n(8),_n(7),_n(8),null,
  _n(-5),_n(0),_n(3),_n(7), _n(8),_n(10),_n(11),_n(13), _n(15),null,_n(11),null, _n(8),_n(3),_n(-5),null,
];
// Bass: G# leading tone creates harmonic-minor tension on every bar
const CHALLENGE_BASS_WALK=[
  _n(0)/4,  _n(7)/4,  _n(0)/4,  _n(11)/4,  // Bar 1: A E A G#
  _n(8)/4,  _n(5)/4,  _n(1)/4,  _n(11)/4,  // Bar 2: F D Bb G#
  _n(0)/4,  _n(5)/4,  _n(7)/4,  _n(11)/4,  // Bar 3: A D E G#
  _n(0)/4,  _n(11)/4, _n(7)/4,  _n(0)/4,   // Bar 4: A G# E A
];
// Challenge drums: 16th-note hihat wall + double kicks on every beat = maximum intensity
// 5=kick+hihat, 6=snare+hihat, 4=hihat only
const CHALLENGE_DRUM_PAT=[5,4,5,4, 6,4,5,4, 5,5,4,4, 6,4,5,6];

// ── Drum synthesis (noise buffer, created lazily per AudioContext) ─────────
let _drumBuffer=null,_drumBufCtx=null;
function _getDrumBuf(){
  if(_drumBuffer&&_drumBufCtx===audioCtx)return _drumBuffer;
  if(!audioCtx)return null;
  const sz=Math.ceil(audioCtx.sampleRate*0.15);
  _drumBuffer=audioCtx.createBuffer(1,sz,audioCtx.sampleRate);
  const d=_drumBuffer.getChannelData(0);
  for(let i=0;i<sz;i++)d[i]=Math.random()*2-1;
  _drumBufCtx=audioCtx;
  return _drumBuffer;
}
// Register all nodes in a BGM voice: track in bgmNodes[] and disconnect ALL on end.
// Previously only the source node was tracked; GainNode/BiquadFilterNode companions
// were never disconnected, leaking the entire AudioContext routing graph over time.
function _bgmRegister(src, ...rest){
  const all=[src,...rest];
  bgmNodes.push(...all);
  src.onended=()=>{
    all.forEach(n=>{
      try{n.disconnect();}catch(e){}
      const i=bgmNodes.indexOf(n);if(i!==-1)bgmNodes.splice(i,1);
    });
  };
}
function bgmScheduleKick(t){
  const osc=audioCtx.createOscillator(),g=audioCtx.createGain();
  osc.connect(g);g.connect(masterGain);
  osc.type='sine';
  osc.frequency.setValueAtTime(110,t);
  osc.frequency.exponentialRampToValueAtTime(40,t+0.12);
  g.gain.setValueAtTime(0.35,t);
  g.gain.exponentialRampToValueAtTime(0.001,t+0.14);
  osc.start(t);osc.stop(t+0.15);
  _bgmRegister(osc,g);
}
function bgmScheduleSnare(t){
  const buf=_getDrumBuf();if(!buf)return;
  const src=audioCtx.createBufferSource(),filt=audioCtx.createBiquadFilter(),g=audioCtx.createGain();
  src.buffer=buf;src.connect(filt);filt.connect(g);g.connect(masterGain);
  filt.type='bandpass';filt.frequency.value=3500;filt.Q.value=0.5;
  g.gain.setValueAtTime(0.18,t);
  g.gain.exponentialRampToValueAtTime(0.001,t+0.09);
  src.start(t);src.stop(t+0.1);
  _bgmRegister(src,filt,g);
}
function bgmScheduleHihat(t){
  const buf=_getDrumBuf();if(!buf)return;
  const src=audioCtx.createBufferSource(),filt=audioCtx.createBiquadFilter(),g=audioCtx.createGain();
  src.buffer=buf;src.connect(filt);filt.connect(g);g.connect(masterGain);
  filt.type='highpass';filt.frequency.value=9000;
  g.gain.setValueAtTime(0.07,t);
  g.gain.exponentialRampToValueAtTime(0.001,t+0.03);
  src.start(t);src.stop(t+0.04);
  _bgmRegister(src,filt,g);
}

function getBGMBeat(){
  const baseBpm=S.isDailyMode?165:135;
  const bpm=Math.min(210,baseBpm+(S.level||1)*5);
  return 60/bpm/4;
}

// type param: 'square'=melody (bright), 'triangle'=harmony/bass (warm)
function bgmScheduleNote(freq,t,dur,vol,type='square'){
  const ctx=audioCtx;
  const osc=ctx.createOscillator(),gain=ctx.createGain();
  osc.connect(gain);gain.connect(masterGain);
  osc.type=type;osc.frequency.setValueAtTime(freq,t);
  gain.gain.setValueAtTime(vol,t);
  gain.gain.exponentialRampToValueAtTime(0.001,t+dur*0.9);
  osc.start(t);osc.stop(t+dur);
  _bgmRegister(osc,gain);
}

function bgmScheduleLoop(){
  if(!bgmPlaying||!audioCtx)return;
  // Guard: if tab was hidden, audioCtx.currentTime may have jumped far ahead of
  // bgmNextTime — clamp to avoid scheduling a massive backlog of nodes at once.
  if(bgmNextTime < audioCtx.currentTime - 0.2) bgmNextTime=audioCtx.currentTime;
  const melody=S.isDailyMode?CHALLENGE_MELODY:BGM_MELODY;
  const harmony=S.isDailyMode?CHALLENGE_HARMONY:BGM_HARMONY;
  const bassWalk=S.isDailyMode?CHALLENGE_BASS_WALK:BGM_BASS_WALK;
  const drumPat=S.isDailyMode?CHALLENGE_DRUM_PAT:BGM_DRUM_PAT;
  while(bgmNextTime<audioCtx.currentTime+0.5){
    const beat=getBGMBeat();
    const idx=bgmBeat%melody.length;
    // Melody: square wave, lead voice
    const mf=melody[idx];
    if(mf)bgmScheduleNote(mf,bgmNextTime,beat*0.8,0.12);
    // Harmony: triangle wave, softer colour
    const hf=harmony[idx];
    if(hf)bgmScheduleNote(hf,bgmNextTime,beat*0.8,0.07,'triangle');
    // Walking bass: triangle, every quarter-note (4 steps)
    if(bgmBeat%4===0){
      const bassIdx=Math.floor(bgmBeat/4)%bassWalk.length;
      bgmScheduleNote(bassWalk[bassIdx],bgmNextTime,beat*3.6,0.10,'triangle');
    }
    // Drums (bit-flags: bit0=kick, bit1=snare, bit2=hihat — combinable)
    const d=drumPat[bgmBeat%16];
    if(d&1)bgmScheduleKick(bgmNextTime);
    if(d&2)bgmScheduleSnare(bgmNextTime);
    if(d&4)bgmScheduleHihat(bgmNextTime);
    bgmNextTime+=beat;
    bgmBeat++;
    if(bgmBeat>=melody.length)bgmBeat=0;
  }
  bgmScheduler=setTimeout(bgmScheduleLoop,100);
}

export async function startBGM(){
  stopBGM();
  const ctx=getAudioCtx();
  if(ctx.state!=='running')await ctx.resume();
  bgmPlaying=true;bgmBeat=0;
  bgmNextTime=ctx.currentTime+0.1;
  bgmScheduleLoop();
}

export function stopBGM(){
  bgmPlaying=false;
  if(bgmScheduler){clearTimeout(bgmScheduler);bgmScheduler=null;}
  const nodes=[...bgmNodes];bgmNodes=[];
  // stop() only works on scheduled sources; disconnect() works on all AudioNodes.
  // Both calls are wrapped in try/catch: stop() throws on GainNode/BiquadFilterNode,
  // disconnect() throws if already disconnected — either way we want to continue.
  nodes.forEach(n=>{try{n.stop(audioCtx.currentTime+0.01);}catch(e){} try{n.disconnect();}catch(e){}});
}

export function pauseBGM(){
  if(!audioCtx)return;
  if(masterGain)masterGain.gain.setValueAtTime(0,audioCtx.currentTime);
  if(audioCtx.state==='running')audioCtx.suspend();
}
export function resumeBGM(){
  if(!audioCtx)return;
  if(masterGain)masterGain.gain.setValueAtTime(S.muteAudio?0:1,audioCtx.currentTime);
  if(audioCtx.state==='suspended')audioCtx.resume();
}

export function playBeep(freq,type,dur,vol,delay=0,freqEnd=null){
  const ctx=getAudioCtx();
  const t=ctx.currentTime+delay;
  const osc=ctx.createOscillator(),gain=ctx.createGain();
  osc.connect(gain);gain.connect(masterGain);
  osc.type=type;osc.frequency.setValueAtTime(freq,t);
  if(freqEnd)osc.frequency.exponentialRampToValueAtTime(freqEnd,t+dur);
  gain.gain.setValueAtTime(vol,t);
  gain.gain.exponentialRampToValueAtTime(0.001,t+dur);
  osc.start(t);osc.stop(t+dur);
  osc.onended=()=>{try{osc.disconnect();gain.disconnect();}catch(e){}};
}

export function sfxMove(){playBeep(220,'square',.04,.1);}
export function sfxRotate(){playBeep(330,'square',.05,.12);playBeep(440,'square',.04,.08,.03);}
export function sfxHardDrop(){playBeep(80,'sawtooth',.15,.45);playBeep(180,'sawtooth',.06,.35,.02,60);playBeep(800,'square',.03,.18,.01);}
export function sfxHold(){playBeep(392,'square',.06,.15);playBeep(523,'square',.05,.12,.05);}
export function sfxLineClear(n){
  if(n>=4){[523,659,784,1047].forEach((f,i)=>playBeep(f,'sawtooth',.2,.3,i*.08));}
  else{[440,523,659].slice(0,n).forEach((f,i)=>playBeep(f,'square',.12,.25,i*.05));}
}
export function sfxGameOver(){
  [392,349,329,261].forEach((f,i)=>playBeep(f,'sawtooth',.28,.38,i*.18));
  playBeep(130,'sawtooth',.6,.3,.75);
}
export function sfxTSpin(){
  playBeep(880,'square',.07,.22);
  playBeep(1046,'square',.06,.18,.06);
  playBeep(1318,'sawtooth',.14,.28,.1);
}
export function sfxUIHover(){ if(!S.muteAudio) playBeep(800, 'sine', 0.04, 0.02); }
export function sfxUIClick(){ if(!S.muteAudio) { playBeep(1200, 'square', 0.05, 0.04); playBeep(1600, 'sine', 0.05, 0.03, 0.02); } }
export function sfxAchievementUnlock(){
  if(S.muteAudio)return;
  [523, 659, 784, 1047].forEach((f, i) => {
    playBeep(f, 'sine', 0.25, 0.22, i * 0.05);
    playBeep(f * 2, 'square', 0.1, 0.06, i * 0.05 + 0.02);
  });
}

// ─── Lifecycle helpers ────────────────────────────────────────────────────────
export function applyMuteToGain(){
  if(masterGain)masterGain.gain.value=S.muteAudio?0:1;
}
export function onPageHide(){pauseBGM();}
export function onPageShow(){if(S.gameRunning&&!S.gamePaused)resumeBGM();}
export function closeAudio(){
  stopBGM();
  if(audioCtx){audioCtx.close();audioCtx=null;masterGain=null;}
}
