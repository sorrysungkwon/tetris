import { S, LS, ACHIEVEMENTS, COLS, ROWS, COLOR_TO_KEY, SUPPORT_URL, MAX_PARTICLES, PIECES, SPRINT_LINES, LEVEL_LINES, SCORE_TABLE, TSPIN_SCORE, TSPIN_MINI_SCORE, mulberry32, fmtTime, _getAchievements, _getLifetime } from './shared.js';
import { toggleMute, startBGM, stopBGM, pauseBGM, resumeBGM, playBeep, sfxMove, sfxRotate, sfxHardDrop, sfxHold, sfxLineClear, sfxGameOver, sfxTSpin, sfxAchievementUnlock, applyMuteToGain, onPageHide, onPageShow, closeAudio } from './audio.js';
import {
  gc, gctx, pc, ncD, ncDx, hcD, hcDx, ncM, hcM, bgc,
  measureFPS, setLowPerfMode, resetPerfHold, _detectLowEndGPU,
  initLayout, initStars, drawBackground,
  drawBoard, drawNext, drawHold, getCellSprite,
  spawnLineClearParticles, spawnLockParticles, spawnFloatingText, spawnDropTrail, spawnHardDropParticles, updateParticles,
  applyShake, nudgeUI, _enableKbMode, _disableKbMode,
  updateUI, updateSprintTimer, showScorePopup,
  updateDAS, updateARR, updateLockDelay, updateGhost, updateColorblind, cycleAnimIntensity, _animLabel,
  triggerScreenFlash, triggerAllClearFlash, triggerLevelUpVisuals, spawnGoldBurst,
  showAchievementToast, unlockAchievement,
  openHowToPlay, closeHowToPlay, openStats, closeStats, showAchTooltip, hideAchTooltip,
} from './ui.js';

document.addEventListener('gesturestart',  e=>e.preventDefault(), {passive:false});
document.addEventListener('gesturechange', e=>e.preventDefault(), {passive:false});
document.addEventListener('touchmove', e=>{ if(e.touches.length>1) e.preventDefault(); }, {passive:false});

// ─── State ────────────────────────────────────────────────────────────────────
let canHold;
let maxCombo;
let gameOver;
let dropInterval;
let animFrame;
let bag=[];
let lastDropTs=0;
let prevTs=0;
let _countdownTimer=null;
let _prng=null;
let _gateTimer=null;

// S.* aliases for frequently-used state (reduce property lookups in hot paths)
// These are written by this module and read here + by ui.js via S.*
let lastWasRotate=false;

// ─── Keyboard guide DOM refs ───────────────────────────────────────────────────
const _keyGuide={
  move:   document.getElementById('key-move'),
  rotate: document.getElementById('key-rotate'),
  soft:   document.getElementById('key-soft'),
  hard:   document.getElementById('key-hard'),
  hold:   document.getElementById('key-hold'),
  pause:  document.getElementById('key-pause'),
  mute:   document.getElementById('key-mute'),
};

// ─── DOM refs ─────────────────────────────────────────────────────────────────
const $overlay  = document.getElementById('overlay');
const $combo    = document.getElementById('combo-display');

// ─── Bag / Pieces ─────────────────────────────────────────────────────────────
function refillBag(){bag=[...Object.keys(PIECES)];for(let i=bag.length-1;i>0;i--){const randVal=_prng?_prng():Math.random();const j=Math.floor(randVal*(i+1));[bag[i],bag[j]]=[bag[j],bag[i]];}}
function nextFromBag(){if(!bag.length)refillBag();return bag.pop();}
function makePiece(key){const d=PIECES[key];return{key,shape:d.shape.map(r=>[...r]),color:d.color,x:Math.floor(COLS/2)-Math.floor(d.shape[0].length/2),y:0};}

// ─── Board / Logic ────────────────────────────────────────────────────────────
function createBoard(){return Array.from({length:ROWS},()=>Array(COLS).fill(null));}

function validPos(piece,ox=0,oy=0,shape=null){
  const s=shape||piece.shape;
  for(let r=0;r<s.length;r++) for(let c=0;c<s[r].length;c++){
    if(!s[r][c])continue;
    const nx=piece.x+c+ox, ny=piece.y+r+oy;
    if(nx<0||nx>=COLS||ny>=ROWS)return false;
    if(ny>=0&&S.board[ny][nx])return false;
  }
  return true;
}

function rotate(shape){const R=shape.length,C=shape[0].length;return Array.from({length:C},(_,c)=>Array.from({length:R},(_,r)=>shape[R-1-r][c]));}

function rotatePiece(){
  const rot=rotate(S.current.shape);
  for(const k of [0,-1,1,-2,2]){if(validPos(S.current,k,0,rot)){S.current.shape=rot;S.current.x+=k;cancelLock();lastWasRotate=true;sfxRotate();return;}}
}

function cancelLock(){S.lockActive=false;S.lockTimer=0;}

function lockPiece(){
  const tspin=checkTSpin();
  S.lockActive=false;S.lockTimer=0;
  for(let r=0;r<S.current.shape.length;r++) for(let c=0;c<S.current.shape[r].length;c++){
    if(!S.current.shape[r][c])continue;
    const y=S.current.y+r;
    if(y<0){endGame();return;}
    S.board[y][S.current.x+c]=S.current.color;
  }
  const cleared=[];
  for(let r=ROWS-1;r>=0;r--){if(S.board[r].every(v=>v!==null))cleared.push(r);}
  if(cleared.length>0){
    S.flashLines=new Set(cleared);S.flashTimer=12;S.combo++;if(S.combo>maxCombo)maxCombo=S.combo;
    const mul=S.combo>1?S.combo:1;
    const pts=tspin==='full'
      ?TSPIN_SCORE[Math.min(cleared.length,3)]*S.level*mul
      :tspin==='mini'
      ?TSPIN_MINI_SCORE[Math.min(cleared.length,2)]*S.level*mul
      :SCORE_TABLE[Math.min(cleared.length,4)]*S.level*mul;
    sfxLineClear(cleared.length);
    if(tspin){sfxTSpin();if(S.animIntensity==='full'){S.shakeFrames=Math.max(S.shakeFrames,12+cleared.length*6);S.shakeMag=Math.max(S.shakeMag,0.55);}}
    if(S.combo>1&&S.animIntensity!=='off'){S.comboFlash=15;S.comboFlashColor=S.combo>=5?'#ff0080':S.combo>=3?'#a000ff':'#00c8ff';}
    addScore(pts,cleared.length,tspin);
    S.lines+=cleared.length;

    // Update lifetime stats and achievements (in-memory cache — no JSON.parse per line clear)
    const lifetime = _getLifetime();
    lifetime.totalLines = (lifetime.totalLines || 0) + cleared.length;
    if (cleared.length === 4) {
      lifetime.totalGlowtris = (lifetime.totalGlowtris || 0) + 1;
      unlockAchievement('glowtris_1');
    }
    localStorage.setItem(LS.LIFETIME, JSON.stringify(lifetime));

    if (tspin) {
      unlockAchievement('tspin_1');
      if (cleared.length === 3) unlockAchievement('tspin_triple');
    }
    if (S.combo >= 5) unlockAchievement('combo_5');
    if (S.combo >= 10) unlockAchievement('combo_10');
    if (lifetime.totalLines >= 100) unlockAchievement('lines_100');
    if (lifetime.totalLines >= 1000) unlockAchievement('lines_1000');

    // Spawn floating score text at center of cleared lines
    const cy = (cleared[0] + cleared[cleared.length-1]) / 2 * S.CELL;
    spawnFloatingText(`+${pts}`, COLS/2*S.CELL, cy, '#00c8ff', 16);

    const nextLvl=Math.floor(S.lines/LEVEL_LINES)+1;
    if(nextLvl > S.level){
      S.level=nextLvl;
      spawnFloatingText(`LEVEL UP!`, COLS/2*S.CELL, ROWS/2*S.CELL, '#ffe600', 24);
      triggerLevelUpVisuals();
      if(S.level>=5) unlockAchievement('level_5');
      if(S.level>=10) unlockAchievement('level_10');
      if(S.level>=15) unlockAchievement('level_15');
    } else {
      S.level=nextLvl;
    }
    dropInterval=Math.max(80,800-(S.level-1)*70);
    updateUI();
    const snap=[...cleared];
    setTimeout(()=>{
      // Guard: if game was reset before this fires bail out immediately.
      if(!S.gameRunning&&!gameOver)return;
      for(const r of snap.slice().sort((a,b)=>a-b)){S.board.splice(r,1);S.board.unshift(Array(COLS).fill(null));}
      spawnLineClearParticles(snap);
      if(snap.length>=4&&!tspin&&S.animIntensity==='full'){S.shakeFrames=25;S.shakeMag=0.7;}
      if(snap.length>=4){triggerScreenFlash();if(S.animIntensity!=='off')S.rainbowBorder=45;}
      // All-clear bonus: board completely empty
      if(S.board.every(row=>row.every(v=>v===null))){
        const bonus=2000*S.level;
        addScore(bonus,0,false);
        showScorePopup(bonus,-1,false); // -1 signals all-clear
        triggerAllClearFlash();
        unlockAchievement('all_clear');
      }
      S.flashLines=new Set();
      // Sprint end: check AFTER board splice so the cleared board is visible
      if(S.isSprintMode&&S.lines>=SPRINT_LINES){endSprint();return;}
    },120);
  } else {
    if(tspin==='full'){sfxTSpin();addScore(TSPIN_SCORE[0]*S.level,0,'full');unlockAchievement('tspin_1');}
    else if(tspin==='mini'){sfxTSpin();unlockAchievement('tspin_1');}
    else{S.combo=0;$combo.textContent='';}
  }
  lastWasRotate=false;
  spawnLockParticles(S.current);
  // In sprint mode, capture end time immediately when 40 lines reached.
  if(S.isSprintMode&&S.lines>=SPRINT_LINES){S._sprintEndTime=performance.now();return;}
  spawnPiece();
}

function addScore(pts,n,tspin=false){
  S.score+=pts;
  // In sprint mode score is cosmetic only — don't update marathon hi-score or achievements
  if(!S.isSprintMode){
    if(S.score>S.hiScore){S.hiScore=S.score;localStorage.setItem(LS.HI,S.hiScore);}
    if(S.score>=50000)unlockAchievement('score_50k');
    if(S.score>=100000)unlockAchievement('score_100k');
    if(S.score>=250000)unlockAchievement('score_250k');
  }
  updateUI();showScorePopup(pts,n,tspin);
}

function spawnPiece(){
  lastWasRotate=false;
  S.current=makePiece(S.next.key);S.next=makePiece(nextFromBag());canHold=true;
  drawNext();if(!validPos(S.current))endGame();
}

function holdPiece(){
  if(!canHold||!S.gameRunning||S.gamePaused)return;
  canHold=false;sfxHold();
  if(S.held){const pk=S.held.key;S.held=makePiece(S.current.key);S.current=makePiece(pk);}
  else{S.held=makePiece(S.current.key);S.current=makePiece(S.next.key);S.next=makePiece(nextFromBag());drawNext();}
  cancelLock();drawHold();
}

// ─── Ghost ────────────────────────────────────────────────────────────────────
function getGhostY(){let d=0;while(validPos(S.current,0,d+1))d++;return S.current.y+d;}

// ─── T-spin ───────────────────────────────────────────────────────────────────
function checkTSpin(){
  if(!S.current||S.current.key!=='T'||!lastWasRotate)return false;
  const x=S.current.x,y=S.current.y;
  const corners=[[x,y],[x+2,y],[x,y+2],[x+2,y+2]];
  function blocked(cx,cy){return cx<0||cx>=COLS||cy>=ROWS||(cy>=0&&S.board[cy][cx]);}
  const f=corners.map(([cx,cy])=>blocked(cx,cy)?1:0);
  if(f[0]+f[1]+f[2]+f[3]<3)return false;
  const sh=S.current.shape;
  let front;
  if(sh.length===2){
    front=sh[0][0]===0?[0,1]:[2,3];
  }else{
    front=sh[0][1]===0?[1,3]:[0,2];
  }
  const frontFilled=f[front[0]]+f[front[1]];
  if(frontFilled===2)return'full';
  if(frontFilled===1)return'mini';
  return false;
}

// ─── Keyboard ─────────────────────────────────────────────────────────────────
const KEYS={};let dasTimer=null;

function updateKeyGuideState(code, isPressed) {
  let el = null;
  if (code === 'ArrowLeft' || code === 'ArrowRight') el = _keyGuide.move;
  else if (code === 'ArrowUp')                        el = _keyGuide.rotate;
  else if (code === 'ArrowDown')                      el = _keyGuide.soft;
  else if (code === 'Space')                          el = _keyGuide.hard;
  else if (code === 'KeyC' || code === 'ShiftLeft')   el = _keyGuide.hold;
  else if (code === 'KeyP')                           el = _keyGuide.pause;
  else if (code === 'KeyM')                           el = _keyGuide.mute;
  if (el) el.classList.toggle('key-pressed', isPressed);
}
document.addEventListener('keydown',e=>{
  updateKeyGuideState(e.code, true);
  if(!S._kbMode && window.matchMedia('(pointer:coarse)').matches) _enableKbMode();
  if(KEYS[e.code])return;KEYS[e.code]=true;
  if(!S.gameRunning)return;
  if(e.code==='KeyP'){togglePause();return;}
  if(S.gamePaused)return;
  switch(e.code){
    case'ArrowLeft': moveX(-1);startDAS(-1);nudgeUI(12,-2);break;
    case'ArrowRight':moveX(1); startDAS(1); nudgeUI(-12,-2);break;
    case'ArrowDown': softDrop();startDASDown();e.preventDefault();break;
    case'ArrowUp':   rotatePiece();break;
    case'Space':     hardDrop();e.preventDefault();break;
    case'KeyC':case'ShiftLeft':holdPiece();break;
    case'KeyM':toggleMute();break;
  }
});
document.addEventListener('keyup',e=>{
  updateKeyGuideState(e.code, false);
  KEYS[e.code]=false;
  if(e.code==='ArrowLeft'||e.code==='ArrowRight')clearDAS();
  if(e.code==='ArrowDown')clearDASDown();
});
function startDAS(d){clearDAS();dasTimer=setTimeout(()=>{dasTimer=setInterval(()=>{if(S.gameRunning&&!S.gamePaused)moveX(d);},S.arr);},S.das);}
function clearDAS(){clearTimeout(dasTimer);clearInterval(dasTimer);dasTimer=null;}
let dasDownTimer=null;
function startDASDown(){clearDASDown();dasDownTimer=setTimeout(()=>{if(S.gameRunning&&!S.gamePaused)softDrop();dasDownTimer=setInterval(()=>{if(S.gameRunning&&!S.gamePaused)softDrop();},S.arr);},S.das);}
function clearDASDown(){clearTimeout(dasDownTimer);clearInterval(dasDownTimer);dasDownTimer=null;}

function moveX(d){if(!S.current)return;if(validPos(S.current,d)){S.current.x+=d;cancelLock();lastWasRotate=false;sfxMove();}}
function softDrop(){if(!S.current)return;if(validPos(S.current,0,1)){S.current.y++;S.score+=1;updateUI();cancelLock();lastWasRotate=false;spawnDropTrail(S.current);}else{if(!S.lockActive){S.lockActive=true;S.lockTimer=S.lockMs;}}}
function hardDrop(){
  if(!S.current)return;
  let d=0;while(validPos(S.current,0,1)){S.current.y++;d++;}
  S.score+=d*2;updateUI();
  if(S.animIntensity==='full'){S.shakeFrames=Math.min(12,5+Math.floor(d*0.45));S.shakeMag=2.8;S.shakeAllDir=true;}
  spawnHardDropParticles(S.current);
  sfxHardDrop();
  lockPiece();
}

// ─── Touch buttons ────────────────────────────────────────────────────────────
function makeTouchBtn(id,onPress,mode='repeat'){
  const el=document.getElementById(id);if(!el)return;
  let iv=null,to=null,on=false;
  function press(e){e.preventDefault();e.stopPropagation();if(on)return;on=true;el.classList.add('pressed');if(!S.gameRunning&&mode!=='any')return;if(S.gamePaused&&mode==='game')return;onPress();if(mode==='repeat'){to=setTimeout(()=>{iv=setInterval(()=>{if(S.gameRunning&&!S.gamePaused)onPress();},S.arr);},S.das);}}
  function rel(e){if(e)e.preventDefault();if(!on)return;on=false;el.classList.remove('pressed');clearTimeout(to);clearInterval(iv);to=null;iv=null;}
  el.addEventListener('touchstart',press,{passive:false});
  el.addEventListener('touchend',rel,{passive:false});
  el.addEventListener('touchcancel',rel,{passive:false});
  el.addEventListener('mousedown',press);
  el.addEventListener('mouseup',rel);
  el.addEventListener('mouseleave',rel);
}

makeTouchBtn('btn-left',  ()=>moveX(-1),  'repeat');
makeTouchBtn('btn-right', ()=>moveX(1),   'repeat');
makeTouchBtn('btn-soft',  ()=>softDrop(), 'repeat');
makeTouchBtn('btn-rotate',()=>rotatePiece(),'game');
makeTouchBtn('btn-drop',  ()=>hardDrop(), 'game');
makeTouchBtn('btn-hold',  ()=>holdPiece(),'game');
makeTouchBtn('btn-pause', ()=>togglePause(),'any');

// ─── Game loop ────────────────────────────────────────────────────────────────
function gameLoop(ts){
  measureFPS(ts);
  const dt=prevTs?Math.min(ts-prevTs,100):16;prevTs=ts;
  drawBackground();
  if(!S.gamePaused&&S.gameRunning&&S.current&&!S._countdownVal){
    if(S.lockActive){S.lockTimer-=dt;if(S.lockTimer<=0)lockPiece();}
    else if(ts-lastDropTs>dropInterval){lastDropTs=ts;if(validPos(S.current,0,1)){S.current.y++;spawnDropTrail(S.current);}else{S.lockActive=true;S.lockTimer=S.lockMs;}}
  }
  if(S.isSprintMode&&S.gameRunning&&!S._countdownVal)updateSprintTimer();
  drawBoard();updateParticles();applyShake();
  animFrame=requestAnimationFrame(gameLoop);
}

// ─── Game control ─────────────────────────────────────────────────────────────
function loadSettings(){
  S.muteAudio=localStorage.getItem(LS.MUTE)==='1';
  S.das=parseInt(localStorage.getItem(LS.DAS)||'150');
  S.arr=parseInt(localStorage.getItem(LS.ARR)||'50');
  S.lockMs=parseInt(localStorage.getItem(LS.LOCK)||'500');
  S.ghostVisible=localStorage.getItem(LS.GHOST)!=='0';
  S.colorblindMode=localStorage.getItem(LS.COLORBLIND)==='1';
  S.animIntensity=localStorage.getItem(LS.ANIM)||'full';
  const icon=document.getElementById('mute-icon');
  const btn=document.getElementById('btn-mute');
  if(icon)icon.textContent=S.muteAudio?'volume_off':'volume_up';
  if(btn)btn.classList.toggle('muted',S.muteAudio);
  applyMuteToGain();
}

function startGame(){
  $overlay.style.display='none';
  $combo.textContent='';
  setTimeout(_doStartGame, 0);
}
function _doStartGame(){
  loadSettings();
  if (!S.isDailyMode) { _prng = null; }
  const savedPerf = localStorage.getItem(LS.LOW_PERF)==='1';
  if(!S._perfLocked && !savedPerf){ setLowPerfMode(false); }
  else { setLowPerfMode(true); }
  resetPerfHold(S._perfLocked, savedPerf);
  // Sprites are pre-warmed at idle time (page load); this is a fast cache hit
  for(const k of Object.keys(PIECES))getCellSprite(PIECES[k].color);
  S.board=createBoard();S.score=0;S.lines=0;S.level=1;S.combo=0;maxCombo=0;dropInterval=800;
  S.particles=[];S.shakeFrames=0;S.shakeMag=0.4;S.shakeAllDir=false;S.flashLines=new Set();S.flashTimer=0;
  S.lockTimer=0;S.lockActive=false;lastWasRotate=false;S.rainbowBorder=0;S.comboFlash=0;S.comboFlashColor='#00c8ff';S.dangerPulse=0;S.levelUpScanline=0;
  S.hiScore=parseInt(localStorage.getItem(LS.HI)||'0');
  bag=[];refillBag();S.next=makePiece(nextFromBag());S.held=null;canHold=true;
  S.gameRunning=true;S.gamePaused=false;gameOver=false;

  // ── Sprint mode init ──────────────────────────────────────────────────────
  const psl=document.getElementById('panel-score-label');
  const lsl=document.getElementById('lines-sub-label');
  if(S.isSprintMode){
    S._sprintHiTime=parseInt(localStorage.getItem(LS.SPRINT_HI)||'0');
    S._sprintEndTime=0;
    if(psl)psl.textContent='TIME';
    if(lsl)lsl.textContent='LEFT';
  }else{
    if(psl)psl.textContent='SCORE';
    if(lsl)lsl.textContent='CLEARED';
  }

  spawnPiece();drawNext();drawHold();updateUI();
  if(animFrame)cancelAnimationFrame(animFrame);
  prevTs=0;lastDropTs=performance.now();
  startBGM();
  // 3-2-1 countdown before pieces start falling
  S._countdownGo=0;
  S._countdownVal=3;
  S._countdownTs=performance.now();
  clearInterval(_countdownTimer);
  if(!S.muteAudio)playBeep(440,'square',.13,.18,0);
  _countdownTimer=setInterval(()=>{
    S._countdownVal--;
    S._countdownTs=performance.now();
    if(S._countdownVal<=0){
      clearInterval(_countdownTimer);_countdownTimer=null;S._countdownVal=0;
      S._countdownGo=55;
      lastDropTs=performance.now();
      if(S.isSprintMode)S._sprintStartTime=performance.now();
      if(!S.muteAudio){[523,659,784].forEach((f,i)=>playBeep(f,'sawtooth',.16,.3,i*.04));}
    }else{
      const pitch={2:550,1:660}[S._countdownVal]||440;
      if(!S.muteAudio)playBeep(pitch,'square',.13,.18,0);
    }
  },1000);
  animFrame=requestAnimationFrame(gameLoop);
}

function showDailyGateOverlay(todayStr){
  clearInterval(_gateTimer);
  const updateCountdown = () => {
    const now = new Date();
    const nextMidnight = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + 1));
    const diffMs = nextMidnight - now;
    if (diffMs <= 0) {
      clearInterval(_gateTimer);
      showStartScreen();
      return;
    }
    const hrs = String(Math.floor(diffMs / 3600000)).padStart(2, '0');
    const mins = String(Math.floor((diffMs % 3600000) / 60000)).padStart(2, '0');
    const secs = String(Math.floor((diffMs % 60000) / 1000)).padStart(2, '0');
    const countEl = document.getElementById('daily-countdown');
    if (countEl) countEl.textContent = `${hrs}:${mins}:${secs}`;
  };

  $overlay.innerHTML = `
    <div class="glass-panel">
      <h1 style="font-size:18px;margin-bottom:14px;color:#ffe600;text-shadow:0 0 10px #ffe600">🏆 DAILY CHALLENGE</h1>
      <div style="font-size:36px;margin:10px 0">🏅</div>
      <div style="font-size:10px;letter-spacing:1px;color:rgba(255,255,255,0.75);margin-bottom:14px;text-align:center;">
        CHALLENGE COMPLETED FOR TODAY!<br>COME BACK TOMORROW.
      </div>
      <div style="font-size:8px;letter-spacing:2px;color:rgba(0,200,255,0.6);text-transform:uppercase;margin-bottom:2px">NEXT CHALLENGE IN</div>
      <div id="daily-countdown" style="font-size:24px;font-weight:900;color:var(--cyan);text-shadow:0 0 10px var(--cyan);margin-bottom:20px;letter-spacing:1.5px">--:--:--</div>
      <button class="action-btn" style="width:100%" onclick="clearInterval(_gateTimer);showStartScreen()">BACK</button>
    </div>
  `;
  $overlay.style.display = 'flex';
  updateCountdown();
  _gateTimer = setInterval(updateCountdown, 1000);
}

function startDailyChallenge(){
  const todayStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  if (localStorage.getItem(LS.DAILY_DATE) === todayStr) {
    showDailyGateOverlay(todayStr);
    return;
  }

  $overlay.innerHTML = `
    <div class="glass-panel" style="width: min(300px, 90vw);">
      <h1 style="font-size:18px;margin-bottom:14px;color:#ffe600;text-shadow:0 0 10px #ffe600;letter-spacing:2px">🏆 DAILY CHALLENGE</h1>
      <div style="font-size:36px;margin:10px 0;animation:pulse 1.5s infinite">🛰️</div>
      <div style="font-size:8px;letter-spacing:1px;color:rgba(0,255,136,0.85);text-transform:uppercase;margin-bottom:12px;font-family:'Orbitron',monospace">SAME BLOCKS FOR EVERYONE!</div>

      <div id="briefing-box" style="font-size:10px;line-height:1.6;color:rgba(255,255,255,0.8);text-align:left;margin-bottom:12px;padding:12px;background:rgba(0,0,0,0.4);border:1px solid rgba(0,200,255,0.15);border-radius:8px;width:100%;box-sizing:border-box">
        <p style="margin:0 0 8px 0;color:#ffe600;font-weight:900;letter-spacing:1px">[WELCOME TO THE DAILY MISSION!]</p>
        <p style="margin:0 0 8px 0">Today, every player in the whole world will get the <strong>exact same blocks</strong> in the same order!</p>
        <p style="margin:0;color:var(--cyan)">Luck doesn't matter today! Only your real skills will make you number one on the leaderboard.</p>
      </div>

      <div style="font-size:9px;line-height:1.4;color:#ff5b5b;font-weight:700;text-align:center;margin-bottom:12px;padding:8px 10px;background:rgba(255,91,91,0.08);border:1px solid rgba(255,91,91,0.25);border-radius:6px;width:100%;box-sizing:border-box">
        ⚠️ Warning: You can only play ONCE today!<br>
        Once you start, there are no retries!
      </div>

      <div class="btn-row" style="width:100%;flex-direction:column;gap:8px;flex-wrap:nowrap">
        <button class="action-btn" id="daily-launch-btn" style="width:100%" onclick="launchDailyChallenge()">START CHALLENGE</button>
        <button class="action-btn ghost" style="width:100%" onclick="showStartScreen()">GO BACK</button>
      </div>
    </div>
  `;
  $overlay.style.display = 'flex';
}

function launchDailyChallenge() {
  const todayStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  S.isDailyMode=true;
  _prng = mulberry32(parseInt(todayStr, 10));
  startGame();
}

function togglePause(){
  if(!S.gameRunning)return;
  S.gamePaused=!S.gamePaused;
  if(S.gamePaused){
    pauseBGM();
    $overlay.innerHTML=`
      <div class="glass-panel">
        <h1 style="font-size:22px;margin-bottom:14px">PAUSED</h1>
        <div class="settings-box" style="width:100%">
          <button class="toggle-btn${S.muteAudio?' muted':''}" id="ov-mute-btn" onclick="toggleMute()">${S.muteAudio?'🔇 AUDIO OFF':'🔊 AUDIO ON'}</button>
          <button class="toggle-btn${S.ghostVisible?'':' muted'}" id="ov-ghost-btn" onclick="updateGhost()">${S.ghostVisible?'👻 GHOST ON':'👻 GHOST OFF'}</button>
          <button class="toggle-btn${S.colorblindMode?' cb-active':' muted'}" id="ov-cb-btn" onclick="updateColorblind()">${S.colorblindMode?'🔳 CB MODE ON':'🔳 CB MODE OFF'}</button>
          <button class="toggle-btn${S.animIntensity==='off'?' muted':''}" id="ov-anim-btn" onclick="cycleAnimIntensity()">${_animLabel()}</button>
          <div class="settings-row">
            <span class="settings-lbl">DAS</span>
            <input type="range" class="neon-range" min="50" max="300" value="${S.das}" oninput="updateDAS(this.value)">
            <span class="settings-val" id="ov-das-val">${S.das}ms</span>
          </div>
          <div class="settings-row">
            <span class="settings-lbl">ARR</span>
            <input type="range" class="neon-range" min="0" max="100" value="${S.arr}" oninput="updateARR(this.value)">
            <span class="settings-val" id="ov-arr-val">${S.arr}ms</span>
          </div>
          <div class="settings-row">
            <span class="settings-lbl">LOCK</span>
            <input type="range" class="neon-range" min="100" max="1000" step="50" value="${S.lockMs}" oninput="updateLockDelay(this.value)">
            <span class="settings-val" id="ov-lock-val">${S.lockMs}ms</span>
          </div>
        </div>
        <button class="action-btn" style="width:100%" onclick="togglePause()">RESUME</button>
        <button class="action-btn ghost" style="margin-top:8px;width:100%" onclick="showStartScreen()">RESTART</button>
      </div>`;
    $overlay.style.display='flex';
  } else {
    resumeBGM();
    $overlay.style.display='none';lastDropTs=performance.now();prevTs=0;
  }
}

// Saves all end-of-game stats to localStorage and fires achievement checks.
function _saveGameStats() {
  const todayStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  if (S.isDailyMode) localStorage.setItem(LS.DAILY_DATE, todayStr);

  const isNewBest = S.score > S.hiScore;
  if (isNewBest) { S.hiScore = S.score; localStorage.setItem(LS.HI, S.hiScore); }

  const hist = JSON.parse(localStorage.getItem(LS.HISTORY) || '[]');
  hist.unshift({ score:S.score, lines:S.lines, level:S.level, date: Date.now() });
  localStorage.setItem(LS.HISTORY, JSON.stringify(hist.slice(0, 5)));

  const prevStreak = parseInt(localStorage.getItem(LS.STREAK) || '0');
  const newStreak = S.score >= 5000 ? prevStreak + 1 : 0;
  localStorage.setItem(LS.STREAK, newStreak);

  const storedMaxCombo = parseInt(localStorage.getItem(LS.MAX_COMBO) || '0');
  if (maxCombo > storedMaxCombo) localStorage.setItem(LS.MAX_COMBO, maxCombo);
  const displayMaxCombo = Math.max(maxCombo, storedMaxCombo);

  let totalGames = parseInt(localStorage.getItem(LS.TOTAL_GAMES) || '0');
  let totalScore = parseInt(localStorage.getItem(LS.TOTAL_SCORE) || '0');
  let bestLevel  = parseInt(localStorage.getItem(LS.BEST_LEVEL)  || '0');
  let totalLines = parseInt(localStorage.getItem(LS.TOTAL_LINES) || '0');
  let maxLines   = parseInt(localStorage.getItem(LS.MAX_LINES)   || '0');

  const isBestLevel = S.level > 0 && S.level >= bestLevel;
  const isBestCombo = maxCombo > 0 && maxCombo >= storedMaxCombo;
  const isBestLines = S.lines > 0 && S.lines >= maxLines;

  totalGames += 1; totalScore += S.score;
  if (S.level > bestLevel) bestLevel = S.level;
  totalLines += S.lines;
  if (S.lines > maxLines) maxLines = S.lines;

  localStorage.setItem(LS.TOTAL_GAMES, totalGames);
  localStorage.setItem(LS.TOTAL_SCORE, totalScore);
  localStorage.setItem(LS.BEST_LEVEL,  bestLevel);
  localStorage.setItem(LS.TOTAL_LINES, totalLines);
  localStorage.setItem(LS.MAX_LINES,   maxLines);

  const lifetime = _getLifetime();
  lifetime.totalGames = (lifetime.totalGames || 0) + 1;
  localStorage.setItem(LS.LIFETIME, JSON.stringify(lifetime));

  unlockAchievement('first_game');
  if (lifetime.totalGames >= 10) unlockAchievement('games_10');
  if (lifetime.totalGames >= 50) unlockAchievement('games_50');
  if (S.isDailyMode) unlockAchievement('daily_challenge_1');
  if (newStreak >= 5) unlockAchievement('streak_5');

  return { isNewBest, newStreak, displayMaxCombo, isBestLevel, isBestCombo, isBestLines };
}

// Shows a confirmation modal before opening the Ko-fi donation page in a new tab.
function _openDonation(){
  if(!SUPPORT_URL)return;
  const modal=document.createElement('div');
  modal.id='donation-modal';
  modal.style.cssText='position:fixed;inset:0;background:rgba(0,0,0,0.72);display:flex;align-items:center;justify-content:center;z-index:99999;backdrop-filter:blur(6px)';
  modal.innerHTML=`
    <div style="background:rgba(4,4,30,0.97);border:1px solid rgba(255,215,0,0.35);border-radius:14px;padding:26px 22px;max-width:270px;width:88%;text-align:center;font-family:'Orbitron',monospace;box-shadow:0 0 40px rgba(255,215,0,0.12)">
      <div style="font-size:26px;margin-bottom:12px">☕</div>
      <div style="font-size:10px;font-weight:900;letter-spacing:2px;color:#ffe600;margin-bottom:8px">SUPPORT GLOWTRIS</div>
      <div style="font-size:8.5px;color:rgba(255,255,255,0.5);letter-spacing:0.5px;line-height:1.7;margin-bottom:20px">Opens Ko-fi in a new tab.</div>
      <div style="display:flex;gap:8px">
        <button onclick="document.getElementById('donation-modal').remove()"
          style="flex:1;padding:10px 0;background:transparent;border:1px solid rgba(255,255,255,0.12);border-radius:8px;color:rgba(255,255,255,0.4);font-family:'Orbitron',monospace;font-size:8px;letter-spacing:1.5px;cursor:pointer;transition:border-color 0.15s"
          onmouseover="this.style.borderColor='rgba(255,255,255,0.3)'" onmouseout="this.style.borderColor='rgba(255,255,255,0.12)'">CANCEL</button>
        <a href="${SUPPORT_URL}" target="_blank" rel="noopener noreferrer"
          onclick="document.getElementById('donation-modal').remove()"
          style="flex:1;padding:10px 0;background:rgba(255,215,0,0.1);border:1px solid rgba(255,215,0,0.4);border-radius:8px;color:#ffe600;font-family:'Orbitron',monospace;font-size:8px;letter-spacing:1.5px;cursor:pointer;text-decoration:none;display:flex;align-items:center;justify-content:center;gap:5px;transition:background 0.15s"
          onmouseover="this.style.background='rgba(255,215,0,0.2)'" onmouseout="this.style.background='rgba(255,215,0,0.1)'">OPEN ↗</a>
      </div>
    </div>`;
  modal.addEventListener('click',e=>{if(e.target===modal)modal.remove();});
  document.body.appendChild(modal);
}

function _donationHTML(){
  if(!SUPPORT_URL)return'';
  return`<div style="margin-top:14px;width:100%;text-align:center">
    <button onclick="_openDonation()"
       style="display:inline-flex;align-items:center;gap:7px;padding:9px 20px;background:rgba(255,215,0,0.07);border:1px solid rgba(255,215,0,0.3);border-radius:9px;color:#ffe600;font-family:'Orbitron',monospace;font-size:9px;letter-spacing:2px;cursor:pointer;transition:background 0.2s,box-shadow 0.2s"
       onmouseover="this.style.background='rgba(255,215,0,0.14)';this.style.boxShadow='0 0 12px rgba(255,215,0,0.2)'"
       onmouseout="this.style.background='rgba(255,215,0,0.07)';this.style.boxShadow='none'">☕ BUY ME A COFFEE</button>
    <div style="font-size:7px;letter-spacing:1.5px;color:rgba(255,255,255,0.22);margin-top:5px">keeps glowtris 100% ad-free</div>
  </div>`;
}

function _renderGameOverScreen({ isNewBest, newStreak, displayMaxCombo, isBestLevel, isBestCombo, isBestLines }) {
  const savedName = localStorage.getItem(LS.NAME) || '';

  let pbBadges = [];
  if (S.isDailyMode) {
    pbBadges.push(`<div class="pb-badge score-pb" style="background:rgba(255,230,0,0.12);border-color:#ffe600;color:#ffe600">🏅 DAILY CHALLENGE</div>`);
  } else {
    if (isNewBest)  pbBadges.push(`<div class="pb-badge score-pb">🏆 RECORD SCORE</div>`);
    if (isBestLevel) pbBadges.push(`<div class="pb-badge level-pb">👑 RECORD LEVEL: L${S.level}</div>`);
    if (isBestLines) pbBadges.push(`<div class="pb-badge lines-pb">🎯 RECORD LINES: ${S.lines}</div>`);
    if (isBestCombo) pbBadges.push(`<div class="pb-badge combo-pb">⚡ RECORD COMBO: x${maxCombo}</div>`);
  }

  let badgesHTML = '';
  if (pbBadges.length > 0 || newStreak > 0) {
    badgesHTML = `<div style="display:flex;gap:6px;flex-wrap:wrap;justify-content:center;">
      ${!S.isDailyMode && newStreak > 0 ? `<div class="streak-badge">🔥 ${newStreak} STREAK</div>` : ''}
      ${pbBadges.join(' ')}
    </div>`;
  } else if (displayMaxCombo > 1) {
    badgesHTML = `<div style="display:flex;gap:6px;flex-wrap:wrap;justify-content:center;">
      <div class="combo-badge">⚡ x${displayMaxCombo} BEST COMBO</div>
    </div>`;
  }

  $overlay.innerHTML = `
    <div class="glass-panel">
      <h1 style="font-size:20px;margin-bottom:18px">${S.isDailyMode ? 'DAILY CHALLENGE' : 'GAME OVER'}</h1>
      ${!S.isDailyMode && isNewBest ? '<div class="new-best-badge" style="margin-bottom:10px">★ NEW BEST ★</div>' : ''}
      <div style="width:100%;text-align:center;margin-bottom:${badgesHTML ? '16px' : '22px'}">
        <div class="sub" style="margin-bottom:3px">SCORE: ${S.score.toLocaleString()}</div>
        <div class="sub" style="color:#ffe600;text-shadow:0 0 10px #ffe600">BEST: ${S.hiScore.toLocaleString()}</div>
      </div>
      ${badgesHTML ? `<div style="width:100%;margin-bottom:18px">${badgesHTML}</div>` : ''}
      <div style="width:100%">
        <input id="lb-name" class="neon-input" maxlength="12" placeholder="ENTER NAME" value="${savedName}" autocomplete="off" spellcheck="false" style="width:100%;max-width:none;box-sizing:border-box;margin-bottom:6px">
        <div class="btn-row" style="width:100%;margin-top:0;gap:6px">
          <button id="lb-submit-btn" class="action-btn sm" style="flex:1" onclick="submitScore()">SUBMIT</button>
          <button class="action-btn sm ghost" style="flex:1" onclick="showStartScreen()">PLAY AGAIN</button>
        </div>
      </div>
      <div id="lb-result" style="margin-top:14px;width:100%;display:flex;flex-direction:column;align-items:center"></div>
      ${_donationHTML()}
    </div>`;
  $overlay.style.display = 'flex';
  const inp = document.getElementById('lb-name');
  inp.focus(); inp.select();
  inp.addEventListener('keydown', e => { if (e.key === 'Enter') submitScore(); });
}

function endGame(){
  S.gameRunning=false;gameOver=true;
  stopBGM();sfxGameOver();

  // Sprint top-out: show "SPRINT FAILED" without saving marathon stats
  if(S.isSprintMode){
    for(let r=0;r<ROWS;r++)for(let c=0;c<COLS;c++){
      if(!S.board[r][c])continue;
      const a=Math.random()*Math.PI*2,sp=Math.random()*6+2;
      S.particles.push({x:(c+.5)*S.CELL,y:(r+.5)*S.CELL,vx:Math.cos(a)*sp,vy:Math.sin(a)*sp-2,life:1,decay:Math.random()*.01+.005,color:S.board[r][c],size:Math.random()*5+3,type:'spark'});
    }
    S.shakeFrames=40;S.shakeMag=0.7;
    setTimeout(()=>{
      $overlay.innerHTML=`
        <div class="glass-panel">
          <h1 style="font-size:20px;margin-bottom:18px">SPRINT FAILED</h1>
          <div style="width:100%;text-align:center;margin-bottom:22px">
            <div class="sub" style="margin-bottom:3px">${Math.max(0,SPRINT_LINES-S.lines)} LINES REMAINING</div>
          </div>
          <div class="btn-row" style="gap:6px;width:100%">
            <button class="action-btn sm" style="flex:1" onclick="startSprintMode()">RETRY</button>
            <button class="action-btn sm ghost" style="flex:1" onclick="showStartScreen()">BACK</button>
          </div>
        </div>`;
      $overlay.style.display='flex';
    },600);
    return;
  }

  const stats = _saveGameStats();

  // Explode all board pieces into spark particles
  for(let r=0;r<ROWS;r++) for(let c=0;c<COLS;c++){
    if(!S.board[r][c])continue;
    const a=Math.random()*Math.PI*2,sp=Math.random()*6+2;
    S.particles.push({x:(c+.5)*S.CELL,y:(r+.5)*S.CELL,vx:Math.cos(a)*sp,vy:Math.sin(a)*sp-2,life:1,decay:Math.random()*.01+.005,color:S.board[r][c],size:Math.random()*5+3,type:'spark'});
  }
  S.shakeFrames=40;S.shakeMag=0.7;

  if(stats.isNewBest){
    [523,659,784,1047].forEach((f,i)=>playBeep(f,'sawtooth',.18,.28,i*.06+.3));
    for(let i=0;i<60;i++){
      const a=Math.random()*Math.PI*2,sp=Math.random()*10+3;
      S.particles.push({x:(Math.random()*COLS)*S.CELL,y:(Math.random()*ROWS*0.5)*S.CELL,vx:Math.cos(a)*sp,vy:Math.sin(a)*sp,life:1,decay:Math.random()*.01+.005,color:['#ffe600','#ffaa00','#ffffff'][Math.floor(Math.random()*3)],size:Math.random()*6+2,type:'star'});
    }
  }

  setTimeout(() => _renderGameOverScreen(stats), 600);
}

// ─── Sprint ───────────────────────────────────────────────────────────────────
function endSprint(){
  const timeMs=Math.round(S._sprintEndTime-S._sprintStartTime);
  S.gameRunning=false;gameOver=true;
  stopBGM();

  const prevBest=S._sprintHiTime;
  const isNewBest=prevBest===0||timeMs<prevBest;
  if(isNewBest){S._sprintHiTime=timeMs;localStorage.setItem(LS.SPRINT_HI,timeMs);}
  unlockAchievement('sprint_finish');

  if(S.animIntensity!=='off'){
    for(let i=0;i<60;i++){
      const a=Math.random()*Math.PI*2,sp=Math.random()*10+3;
      S.particles.push({x:(Math.random()*COLS)*S.CELL,y:(Math.random()*ROWS*0.5)*S.CELL,vx:Math.cos(a)*sp,vy:Math.sin(a)*sp,life:1,decay:Math.random()*.01+.005,color:['#00ff88','#00c8ff','#ffe600','#ffffff'][Math.floor(Math.random()*4)],size:Math.random()*6+2,type:'star'});
    }
  }
  [523,659,784,1047,1319].forEach((f,i)=>playBeep(f,'sawtooth',.18,.28,i*.07+.1));
  setTimeout(()=>_renderSprintScreen(timeMs,isNewBest,prevBest),600);
}

function _renderSprintScreen(timeMs,isNewBest,prevBest){
  const savedName=localStorage.getItem(LS.NAME)||'';
  const lpm=Math.round(SPRINT_LINES/(timeMs/60000));
  const prevBestLine=prevBest>0&&!isNewBest
    ?`<div style="font-size:8px;letter-spacing:1.5px;color:rgba(255,255,255,0.3);margin-bottom:10px">BEST: ${fmtTime(prevBest)}</div>`:'';;

  $overlay.innerHTML=`
    <div class="glass-panel">
      <h1 style="font-size:20px;margin-bottom:6px">🏁 SPRINT COMPLETE!</h1>
      ${isNewBest?'<div class="new-best-badge" style="margin-bottom:10px">★ NEW BEST ★</div>':prevBestLine}
      <div style="width:100%;text-align:center;margin-bottom:16px">
        <div style="font-size:9px;letter-spacing:3px;color:rgba(0,200,255,0.6);margin-bottom:4px">FINISH TIME</div>
        <div style="font-size:46px;font-weight:900;color:#ffe600;text-shadow:0 0 20px rgba(255,230,0,0.7);letter-spacing:2px;font-family:monospace">${fmtTime(timeMs)}</div>
        <div style="font-size:9px;letter-spacing:2px;color:rgba(255,255,255,0.45);margin-top:6px">${lpm} LPM</div>
      </div>
      <div style="width:100%">
        <input id="lb-name" class="neon-input" maxlength="12" placeholder="ENTER NAME" value="${savedName}" autocomplete="off" spellcheck="false" style="width:100%;max-width:none;box-sizing:border-box;margin-bottom:6px">
        <div class="btn-row" style="width:100%;margin-top:0;gap:6px">
          <button id="lb-submit-btn" class="action-btn sm" style="flex:1" onclick="submitSprintScore(${timeMs})">SUBMIT</button>
          <button class="action-btn sm ghost" style="flex:1" onclick="showStartScreen()">PLAY AGAIN</button>
        </div>
      </div>
      <div id="lb-result" style="margin-top:14px;width:100%;display:flex;flex-direction:column;align-items:center"></div>
      ${_donationHTML()}
    </div>`;
  $overlay.style.display='flex';
  const inp=document.getElementById('lb-name');
  inp.focus();inp.select();
  inp.addEventListener('keydown',e=>{if(e.key==='Enter')submitSprintScore(timeMs);});
}

async function submitSprintScore(timeMs){
  const inp=document.getElementById('lb-name');
  const res=document.getElementById('lb-result');
  const btn=document.getElementById('lb-submit-btn');
  if(!inp||!res||!btn)return;
  if(btn.disabled)return;
  const name=inp.value.trim();
  if(!name){inp.focus();return;}
  localStorage.setItem(LS.NAME,name);
  btn.disabled=true;inp.disabled=true;
  res.innerHTML='<div class="sub">SUBMITTING...</div>';
  try{
    const r=await fetch('/api/leaderboard',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({name,score:timeMs,mode:'sprint'})});
    const data=await r.json();
    if(data.sprintBoard){
      S._lbCache={...S._lbCache,sprintBoard:data.sprintBoard||[],sprintDailyBoard:data.sprintDailyBoard||[],sprintWeeklyBoard:data.sprintWeeklyBoard||[],sprintRank:data.sprintRank,sprintDailyRank:data.sprintDailyRank,sprintWeeklyRank:data.sprintWeeklyRank,myName:name,mySprintTime:timeMs};
      const rankMsg=[
        data.sprintDailyRank?`<div class="sub" style="color:#00ff88;margin-bottom:2px">TODAY: #${data.sprintDailyRank}</div>`:'',
        data.sprintWeeklyRank?`<div class="sub" style="color:#00c8ff;margin-bottom:2px">WEEKLY: #${data.sprintWeeklyRank}</div>`:'',
        data.sprintRank?`<div class="sub" style="color:#ffe600;margin-bottom:6px">ALL TIME: #${data.sprintRank}</div>`:'',
      ].join('');
      inp.style.display='none';btn.closest('.btn-row').style.display='none';
      const tabs=`<div class="lb-tabs">
        <button class="lb-tab active" data-tab="sprint-daily" onclick="renderLbTab('sprint-daily')">TODAY</button>
        <button class="lb-tab" data-tab="sprint-weekly" onclick="renderLbTab('sprint-weekly')">WEEKLY</button>
        <button class="lb-tab" data-tab="sprint-all" onclick="renderLbTab('sprint-all')">ALL TIME</button>
      </div><div class="lb-inner">${lbHTML(data.sprintDailyBoard||[],name,data.sprintDailyRank,timeMs,true)}</div>`;
      res.innerHTML=rankMsg+tabs+`<div class="btn-row"><button class="action-btn sm ghost" onclick="shareSprintScore(${timeMs},${data.sprintRank||0})">SHARE</button><button class="action-btn sm" onclick="showStartScreen()">PLAY AGAIN</button></div>`+_donationHTML();
    }else{
      btn.disabled=false;inp.disabled=false;
      res.innerHTML='<div class="sub">Save failed — please try again</div>';
    }
  }catch(e){
    btn.disabled=false;inp.disabled=false;
    res.innerHTML='<div class="sub">Network error — please try again</div>';
  }
}

async function shareSprintScore(timeMs,rank){
  const btn=event&&event.target?event.target:null;
  if(btn){btn.disabled=true;btn.textContent='GENERATING...';}
  try{
    const lpm=Math.round(SPRINT_LINES/(timeMs/60000));
    const rankStr=rank?` — Rank #${rank}`:'';
    const text=`⚡ Glowtris Sprint — ${fmtTime(timeMs)} (${lpm} LPM)${rankStr}\nCan you beat it? ${window.location.origin}`;
    const blob=await captureSprintImage(timeMs,rank,lpm);
    const file=new File([blob],'glowtris-sprint.png',{type:'image/png'});
    if(navigator.canShare&&navigator.canShare({files:[file]})){
      await navigator.share({title:'Glowtris Sprint',text,files:[file]});
    }else{
      try{
        await navigator.clipboard.write([new ClipboardItem({'image/png':blob,'text/plain':new Blob([text],{type:'text/plain'})})]);
        alert('Image & Time copied to clipboard!');
      }catch(e){await navigator.clipboard.writeText(text);alert('Sprint time copied to clipboard!');}
    }
  }catch(e){console.error(e);}
  if(btn){btn.disabled=false;btn.textContent='SHARE';}
}

async function captureSprintImage(timeMs,rank,lpm){
  const c=document.createElement('canvas');
  c.width=1200;c.height=630;
  const ctx=c.getContext('2d');
  ctx.fillStyle='#04041e';ctx.fillRect(0,0,1200,630);
  const bgi=document.getElementById('bg-canvas');
  if(bgi)ctx.drawImage(bgi,0,0,1200,630);
  const gci=document.getElementById('game-canvas');
  if(gci){
    const gw=260,gh=520,gx=90,gy=55;
    ctx.shadowColor='#00ff88';ctx.shadowBlur=40;
    ctx.fillStyle='rgba(0,0,20,0.8)';ctx.fillRect(gx,gy,gw,gh);
    ctx.shadowBlur=0;ctx.drawImage(gci,gx,gy,gw,gh);
    ctx.strokeStyle='#00ff88';ctx.lineWidth=4;ctx.strokeRect(gx,gy,gw,gh);
    ctx.strokeStyle='rgba(255,255,255,0.15)';ctx.lineWidth=1;ctx.strokeRect(gx+2,gy+2,gw-4,gh-4);
  }
  const px=420,py=55,pw=700,ph=520;
  ctx.fillStyle='rgba(4,4,30,0.75)';ctx.shadowColor='rgba(0,0,0,0.6)';ctx.shadowBlur=30;
  ctx.fillRect(px,py,pw,ph);ctx.shadowBlur=0;
  ctx.strokeStyle='rgba(0,255,136,0.35)';ctx.lineWidth=2;ctx.strokeRect(px,py,pw,ph);
  ctx.textAlign='center';
  ctx.fillStyle='#00ff88';ctx.font='900 52px Orbitron, monospace';
  ctx.shadowColor='rgba(0,255,136,0.6)';ctx.shadowBlur=20;
  ctx.fillText('SPRINT 40L',px+pw/2,py+95);ctx.shadowBlur=0;
  ctx.font='700 28px Orbitron, monospace';ctx.fillStyle='rgba(255,255,255,0.6)';
  ctx.letterSpacing='6px';ctx.fillText('FINISH TIME',px+pw/2,py+210);
  ctx.font='900 70px Orbitron, monospace';ctx.fillStyle='#ffe600';
  ctx.shadowColor='#ffe600';ctx.shadowBlur=25;ctx.letterSpacing='2px';
  ctx.fillText(fmtTime(timeMs),px+pw/2,py+290);ctx.shadowBlur=0;
  ctx.fillStyle='rgba(0,255,136,0.2)';ctx.fillRect(px+80,py+320,pw-160,2);
  ctx.letterSpacing='2px';ctx.font='700 26px Orbitron, monospace';
  let cy=py+395;
  if(rank){
    ctx.fillStyle='#00ff88';ctx.shadowColor='rgba(0,255,136,0.5)';ctx.shadowBlur=10;
    ctx.fillText('🏆 ALL TIME RANK: #'+rank,px+pw/2,cy);ctx.shadowBlur=0;cy+=50;
  }
  ctx.fillStyle='#00c8ff';ctx.fillText(`${lpm} LPM   |   40 LINES`,px+pw/2,cy);cy+=50;
  ctx.fillStyle='rgba(255,255,255,0.35)';ctx.font='700 20px Orbitron, monospace';
  ctx.fillText('Can you beat it? glowtris.com',px+pw/2,cy+10);
  return new Promise(res=>c.toBlob(res,'image/png'));
}

// ─── Leaderboard ──────────────────────────────────────────────────────────────
function lbHTML(entries, myName, myRank, myScore, timeMode=false) {
  if(!entries.length) return '<div class="sub" style="margin-top:4px">No records yet</div>';
  const medals=['🥇','🥈','🥉'];
  const fmt=timeMode?(v=>fmtTime(v)):(v=>v.toLocaleString());
  let html = `<table class="lb-table">${entries.map((e,i)=>{
    const isMe=myName&&e.name===myName;
    return `<tr class="${isMe?'lb-me':''}"><td>${medals[i]||i+1}</td><td>${e.name}</td><td>${fmt(e.score)}</td></tr>`;
  }).join('')}`;

  if (myRank && myRank > entries.length && myName && myScore !== undefined) {
    html += `<tr><td colspan="3" style="text-align:center;opacity:0.4;padding:2px 0">...</td></tr>`;
    html += `<tr class="lb-me"><td>${myRank}</td><td>${myName}</td><td>${fmt(myScore)}</td></tr>`;
  }

  html += `</table>`;
  return html;
}

async function submitScore(){
  const inp=document.getElementById('lb-name');
  const res=document.getElementById('lb-result');
  const btn=document.getElementById('lb-submit-btn');
  if(!inp||!res||!btn)return;
  if(btn.disabled)return;
  const name=inp.value.trim();
  if(!name){inp.focus();return;}
  localStorage.setItem(LS.NAME,name);

  btn.disabled=true; inp.disabled=true;
  res.innerHTML='<div class="sub">SUBMITTING...</div>';

  try{
    const payload = { name, score:S.score };
    if (S.isDailyMode) payload.mode = 'daily';

    const r=await fetch('/api/leaderboard',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(payload)});
    const data=await r.json();

    unlockAchievement('submit_lb');

    if(S.isDailyMode && data.challengeBoard){
      S._lbCache = {
        ...S._lbCache,
        challengeBoard: data.challengeBoard || [],
        challengeRank: data.challengeRank || 0,
        challengeAlltimeBoard: data.challengeAlltimeBoard || [],
        challengeAlltimeRank: data.challengeAlltimeRank || 0,
        myName: name, myScore: S.score
      };

      const rankMsg = `
        <div class="sub" style="color:#ffe600;margin-bottom:2px">TODAY: #${data.challengeRank}</div>
        <div class="sub" style="color:#00c8ff;margin-bottom:6px">ALL TIME: #${data.challengeAlltimeRank}</div>`;
      inp.style.display='none';
      btn.closest('.btn-row').style.display='none';
      const tabs=`<div class="lb-tabs">
        <button class="lb-tab active" data-tab="challenge" onclick="renderLbTab('challenge')">TODAY</button>
        <button class="lb-tab" data-tab="challenge-all" onclick="renderLbTab('challenge-all')">ALL TIME</button>
      </div><div class="lb-inner">${lbHTML(data.challengeBoard||[], name, data.challengeRank, S.score)}</div>`;
      res.innerHTML=rankMsg+tabs+`<div class="btn-row"><button class="action-btn sm ghost" onclick="shareScore(${S.score},${data.challengeRank||0})">SHARE</button><button class="action-btn sm" onclick="showStartScreen()">PLAY AGAIN</button></div>`+_donationHTML();
    }
    else if(data.board){
      S._lbCache = {
        ...S._lbCache,
        board: data.board, dailyBoard: data.dailyBoard || [], weeklyBoard: data.weeklyBoard || [],
        rank: data.rank, dailyRank: data.dailyRank, weeklyRank: data.weeklyRank,
        myName: name, myScore: S.score
      };

      const rankMsg=[
        data.dailyRank?`<div class="sub" style="color:#00ff88;margin-bottom:2px">TODAY: #${data.dailyRank}</div>`:'',
        data.weeklyRank?`<div class="sub" style="color:#00c8ff;margin-bottom:2px">WEEKLY: #${data.weeklyRank}</div>`:'',
        data.rank?`<div class="sub" style="color:#ffe600;margin-bottom:6px">ALL TIME: #${data.rank}</div>`:'',
      ].join('');
      inp.style.display='none';
      btn.closest('.btn-row').style.display='none';
      const tabs=`<div class="lb-tabs">
        <button class="lb-tab active" data-tab="daily" onclick="renderLbTab('daily')">TODAY</button>
        <button class="lb-tab" data-tab="weekly" onclick="renderLbTab('weekly')">WEEKLY</button>
        <button class="lb-tab" data-tab="all" onclick="renderLbTab('all')">ALL TIME</button>
      </div><div class="lb-inner">${lbHTML(data.dailyBoard||[], name, data.dailyRank, S.score)}</div>`;
      res.innerHTML=rankMsg+tabs+`<div class="btn-row"><button class="action-btn sm ghost" onclick="shareScore(${S.score},${data.rank||0})">SHARE</button><button class="action-btn sm" onclick="showStartScreen()">PLAY AGAIN</button></div>`+_donationHTML();
    }else{
      btn.disabled=false;inp.disabled=false;
      res.innerHTML='<div class="sub">Save failed — please try again</div>';
    }
  }catch(e){
    btn.disabled=false;inp.disabled=false;
    res.innerHTML='<div class="sub">Network error — please try again</div>';
  }
}

async function captureGameImage(sc, rank, isDaily=false) {
  const c = document.createElement('canvas');
  c.width = 1200; c.height = 630;
  const ctx = c.getContext('2d');

  ctx.fillStyle = '#04041e';
  ctx.fillRect(0, 0, 1200, 630);

  const bgi = document.getElementById('bg-canvas');
  if(bgi) ctx.drawImage(bgi, 0, 0, 1200, 630);

  const gci = document.getElementById('game-canvas');
  if(gci) {
    const gw = 260, gh = 520;
    const gx = 90, gy = 55;
    ctx.shadowColor = '#00c8ff';
    ctx.shadowBlur = 40;
    ctx.fillStyle = 'rgba(0,0,20,0.8)';
    ctx.fillRect(gx, gy, gw, gh);
    ctx.shadowBlur = 0;
    ctx.drawImage(gci, gx, gy, gw, gh);
    ctx.strokeStyle = '#00c8ff';
    ctx.lineWidth = 4;
    ctx.strokeRect(gx, gy, gw, gh);
    ctx.strokeStyle = 'rgba(255,255,255,0.15)';
    ctx.lineWidth = 1;
    ctx.strokeRect(gx+2, gy+2, gw-4, gh-4);
  }

  const px = 420, py = 55, pw = 700, ph = 520;
  ctx.fillStyle = 'rgba(4,4,30,0.75)';
  ctx.shadowColor = 'rgba(0,0,0,0.6)';
  ctx.shadowBlur = 30;
  ctx.fillRect(px, py, pw, ph);
  ctx.shadowBlur = 0;

  ctx.strokeStyle = 'rgba(0,200,255,0.35)';
  ctx.lineWidth = 2;
  ctx.strokeRect(px, py, pw, ph);

  ctx.textAlign = 'center';

  if (isDaily) {
    ctx.fillStyle = '#ffe600';
    ctx.font = '900 52px Orbitron, monospace';
    ctx.shadowColor = 'rgba(255,230,0,0.6)';
    ctx.shadowBlur = 20;
    ctx.letterSpacing = '2px';
    ctx.fillText('DAILY CHALLENGE', px + pw/2, py + 95);
    const todayLabel = new Date().toISOString().slice(0,10);
    ctx.font = '700 22px Orbitron, monospace';
    ctx.fillStyle = 'rgba(255,255,255,0.5)';
    ctx.letterSpacing = '4px';
    ctx.fillText(todayLabel, px + pw/2, py + 140);
    ctx.shadowBlur = 0;
  } else {
    const gr = ctx.createLinearGradient(px, py, px+pw, py);
    gr.addColorStop(0, '#00c8ff');
    gr.addColorStop(0.5, '#a000ff');
    gr.addColorStop(1, '#ff0080');
    ctx.fillStyle = gr;
    ctx.font = '900 76px Orbitron, monospace';
    ctx.shadowColor = 'rgba(160,0,255,0.6)';
    ctx.shadowBlur = 20;
    ctx.fillText('GLOWTRIS', px + pw/2, py + 110);
    ctx.shadowBlur = 0;
  }

  ctx.font = '700 28px Orbitron, monospace';
  ctx.fillStyle = 'rgba(255,255,255,0.6)';
  ctx.letterSpacing = '6px';
  ctx.fillText('FINAL SCORE', px + pw/2, py + 210);

  ctx.font = '900 70px Orbitron, monospace';
  ctx.fillStyle = '#ffe600';
  ctx.shadowColor = '#ffe600';
  ctx.shadowBlur = 25;
  ctx.letterSpacing = '2px';
  ctx.fillText(sc.toLocaleString(), px + pw/2, py + 290);
  ctx.shadowBlur = 0;

  ctx.fillStyle = 'rgba(0,200,255,0.2)';
  ctx.fillRect(px + 80, py + 340, pw - 160, 2);

  ctx.font = '700 26px Orbitron, monospace';
  ctx.letterSpacing = '2px';

  let currentY = py + 400;
  if (isDaily && rank) {
    ctx.fillStyle = '#00ff88';
    ctx.shadowColor = 'rgba(0,255,136,0.5)';
    ctx.shadowBlur = 10;
    ctx.fillText('🏆 TODAY CHALLENGE RANK: #' + rank, px + pw/2, currentY);
    ctx.shadowBlur = 0;
    currentY += 50;
  } else if (rank) {
    ctx.fillStyle = '#00ff88';
    ctx.shadowColor = 'rgba(0,255,136,0.5)';
    ctx.shadowBlur = 10;
    ctx.fillText('🏆 ALL TIME RANK: #' + rank, px + pw/2, currentY);
    ctx.shadowBlur = 0;
    currentY += 50;
  }

  ctx.fillStyle = '#00c8ff';
  ctx.fillText(`LEVEL: ${S.level}   |   LINES: ${S.lines}`, px + pw/2, currentY);
  currentY += 50;

  if (maxCombo > 1) {
    ctx.fillStyle = '#ff0080';
    ctx.fillText(`⚡ MAX COMBO: x${maxCombo}`, px + pw/2, currentY);
  }

  return new Promise(res => c.toBlob(res, 'image/png'));
}

async function shareScore(sc,rank){
  const btn = event && event.target ? event.target : null;
  if(btn){btn.disabled=true; btn.textContent='GENERATING...';}
  try {
    const isChallenge = S.isDailyMode;
    const rankStr=rank?` — Rank #${rank}`:'';
    const challengeHeader = isChallenge ? `🏆 Glowtris Daily Challenge — ` : `🎮 Glowtris — `;
    const text=`${challengeHeader}${sc.toLocaleString()} pts${rankStr}\n${window.location.origin}`;
    const blob = await captureGameImage(sc, rank, isChallenge);
    const file = new File([blob], 'glowtris-score.png', {type: 'image/png'});

    if(navigator.canShare && navigator.canShare({files: [file]})) {
      await navigator.share({title:'Glowtris', text, files: [file]});
    } else {
      try {
        await navigator.clipboard.write([
          new ClipboardItem({
            'image/png': blob,
            'text/plain': new Blob([text], {type: 'text/plain'})
          })
        ]);
        alert('Image & Score copied to clipboard!');
      } catch(e) {
        await navigator.clipboard.writeText(text);
        alert('Score text copied to clipboard!');
      }
    }
  } catch(e) {
    console.error(e);
  }
  if(btn){btn.disabled=false; btn.textContent='SHARE';}
}

async function loadStartLeaderboard(){
  const el=document.getElementById('start-lb');
  if(!el)return;
  try{
    const url=S.lbMode==='daily'?'/api/leaderboard?mode=daily'
             :S.lbMode==='sprint'?'/api/leaderboard?mode=sprint'
             :'/api/leaderboard';
    const r=await fetch(url);
    const data=await r.json();
    S._lbCache={...S._lbCache,...data};
    const activeTab=document.querySelector('.lb-tab[data-tab].active');
    const defaultTab=S.lbMode==='daily'?'challenge':S.lbMode==='sprint'?'sprint-daily':'daily';
    renderLbTab(activeTab?activeTab.dataset.tab:defaultTab);
  }catch(e){}
}

function renderLbTab(tab){
  const inner=document.querySelector('.lb-inner');
  if(!inner)return;
  let entries, myRank;
  const isSprintTab=tab.startsWith('sprint');
  if(tab==='daily')            { entries=S._lbCache.dailyBoard||[];            myRank=S._lbCache.dailyRank; }
  else if(tab==='weekly')      { entries=S._lbCache.weeklyBoard||[];           myRank=S._lbCache.weeklyRank; }
  else if(tab==='challenge')   { entries=S._lbCache.challengeBoard||[];        myRank=S._lbCache.challengeRank; }
  else if(tab==='challenge-all'){entries=S._lbCache.challengeAlltimeBoard||[];myRank=S._lbCache.challengeAlltimeRank;}
  else if(tab==='sprint-daily'){ entries=S._lbCache.sprintDailyBoard||[];     myRank=S._lbCache.sprintDailyRank; }
  else if(tab==='sprint-weekly'){entries=S._lbCache.sprintWeeklyBoard||[];    myRank=S._lbCache.sprintWeeklyRank; }
  else if(tab==='sprint-all')  { entries=S._lbCache.sprintBoard||[];          myRank=S._lbCache.sprintRank; }
  else                         { entries=S._lbCache.board||[];                myRank=S._lbCache.rank; }

  document.querySelectorAll('.lb-tab[data-tab]').forEach(t=>t.classList.toggle('active',t.dataset.tab===tab));
  const myVal=isSprintTab?S._lbCache.mySprintTime:S._lbCache.myScore;
  inner.innerHTML=lbHTML(entries,S._lbCache.myName,myRank,myVal,isSprintTab);
}

function setLbMode(mode) {
  S.lbMode=mode;
  ['marathon','sprint','daily'].forEach(m=>{
    const el=document.getElementById('lb-mode-'+m);
    if(el)el.classList.toggle('active',m===mode);
  });

  const tc=document.querySelector('.lb-tabs-container');
  if(tc){
    if(mode==='daily'){
      tc.innerHTML=`
        <button class="lb-tab active" data-tab="challenge" onclick="renderLbTab('challenge')">TODAY</button>
        <button class="lb-tab" data-tab="challenge-all" onclick="renderLbTab('challenge-all')">ALL TIME</button>
      `;
    }else if(mode==='sprint'){
      tc.innerHTML=`
        <button class="lb-tab active" data-tab="sprint-daily" onclick="renderLbTab('sprint-daily')">TODAY</button>
        <button class="lb-tab" data-tab="sprint-weekly" onclick="renderLbTab('sprint-weekly')">WEEKLY</button>
        <button class="lb-tab" data-tab="sprint-all" onclick="renderLbTab('sprint-all')">ALL TIME</button>
      `;
    }else{
      tc.innerHTML=`
        <button class="lb-tab active" data-tab="daily" onclick="renderLbTab('daily')">TODAY</button>
        <button class="lb-tab" data-tab="weekly" onclick="renderLbTab('weekly')">WEEKLY</button>
        <button class="lb-tab" data-tab="all" onclick="renderLbTab('all')">ALL TIME</button>
      `;
    }
  }
  loadStartLeaderboard();
}

function startSprintMode(){
  S.isSprintMode=true;
  S.isDailyMode=false;
  startGame();
}

function showStartScreen(){
  S.isDailyMode=false;
  S.isSprintMode=false;
  clearInterval(_gateTimer);_gateTimer=null;
  clearInterval(_countdownTimer);_countdownTimer=null;S._countdownVal=0;S._countdownGo=0;
  const psl=document.getElementById('panel-score-label');
  const lsl=document.getElementById('lines-sub-label');
  if(psl)psl.textContent='SCORE';
  if(lsl)lsl.textContent='CLEARED';
  S.gameRunning=false;
  stopBGM();
  if(animFrame){cancelAnimationFrame(animFrame);animFrame=null;}
  animFrame=requestAnimationFrame(function bgOnly(ts){drawBackground();if(!S.gameRunning)animFrame=requestAnimationFrame(bgOnly);});
  $overlay.innerHTML=`
    <div class="glass-panel">
      <h1>GLOWTRIS</h1>
      <div id="start-lb">
        <div class="lb-mode-toggle" style="display:flex;gap:4px;margin-bottom:6px;width:100%">
          <button id="lb-mode-marathon" class="lb-tab ${S.lbMode==='marathon'?'active':''}" style="font-size:7px;letter-spacing:1px;padding:4px 2px" onclick="setLbMode('marathon')">MARATHON</button>
          <button id="lb-mode-sprint" class="lb-tab ${S.lbMode==='sprint'?'active':''}" style="font-size:7px;letter-spacing:1px;padding:4px 2px" onclick="setLbMode('sprint')">⚡ SPRINT</button>
          <button id="lb-mode-daily" class="lb-tab ${S.lbMode==='daily'?'active':''}" style="font-size:7px;letter-spacing:1px;padding:4px 2px" onclick="setLbMode('daily')">🏆 DAILY</button>
        </div>
        <div class="lb-tabs-container lb-tabs">
          ${S.lbMode==='daily' ? `
            <button class="lb-tab active" data-tab="challenge" onclick="renderLbTab('challenge')">TODAY</button>
            <button class="lb-tab" data-tab="challenge-all" onclick="renderLbTab('challenge-all')">ALL TIME</button>
          ` : S.lbMode==='sprint' ? `
            <button class="lb-tab active" data-tab="sprint-daily" onclick="renderLbTab('sprint-daily')">TODAY</button>
            <button class="lb-tab" data-tab="sprint-weekly" onclick="renderLbTab('sprint-weekly')">WEEKLY</button>
            <button class="lb-tab" data-tab="sprint-all" onclick="renderLbTab('sprint-all')">ALL TIME</button>
          ` : `
            <button class="lb-tab active" data-tab="daily" onclick="renderLbTab('daily')">TODAY</button>
            <button class="lb-tab" data-tab="weekly" onclick="renderLbTab('weekly')">WEEKLY</button>
            <button class="lb-tab" data-tab="all" onclick="renderLbTab('all')">ALL TIME</button>
          `}
        </div>
        <div class="lb-inner"></div>
      </div>
      <div class="btn-row" style="margin-bottom:6px;width:100%;flex-direction:column;gap:6px;flex-wrap:nowrap">
        <button class="action-btn" style="width:100%" onclick="showModeSelector()">PLAY</button>
      </div>
      <div class="btn-row" style="gap:6px;width:100%">
        <button class="action-btn ghost" style="flex:1" onclick="openHowToPlay()">HOW TO PLAY</button>
        <button class="action-btn ghost" style="flex:1" onclick="openStats()">STATS</button>
      </div>
      ${_donationHTML()}
      <div style="margin-top:10px;text-align:center;font-size:8px;letter-spacing:1.5px;color:rgba(255,255,255,0.18)">
        <a href="/privacy.html" class="footer-link">PRIVACY</a>
        <span style="color:rgba(255,255,255,0.12)">·</span>
        <a href="/terms.html" class="footer-link">TERMS</a>
      </div>
    </div>`;
  $overlay.style.display='flex';
  loadStartLeaderboard();
}

function showModeSelector(){
  const sprintBest=S._sprintHiTime>0?`<span style="color:rgba(0,255,136,0.7)">Best: ${fmtTime(S._sprintHiTime)}</span>`:'<span style="color:rgba(255,255,255,0.25)">No record yet</span>';
  const hiS=parseInt(localStorage.getItem(LS.HI)||'0');
  const marathonBest=hiS>0?`<span style="color:rgba(0,200,255,0.7)">Best: ${hiS.toLocaleString()}</span>`:'<span style="color:rgba(255,255,255,0.25)">No record yet</span>';
  const todayStr=new Date().toISOString().slice(0,10).replace(/-/g,'');
  const dailyDone=localStorage.getItem(LS.DAILY_DATE)===todayStr;
  const dailySub=dailyDone?'<span style="color:rgba(255,230,0,0.7)">✓ Completed today</span>':'<span style="color:rgba(255,255,255,0.25)">Not played today</span>';

  $overlay.innerHTML=`
    <div class="glass-panel">
      <h1 style="font-size:16px;margin-bottom:16px;letter-spacing:3px">SELECT MODE</h1>

      <div style="width:100%;display:flex;flex-direction:column;gap:8px;margin-bottom:16px">

        <!-- MARATHON -->
        <div onclick="startGame()" style="cursor:pointer;display:flex;align-items:center;gap:12px;padding:12px 14px;border-radius:10px;border:1px solid rgba(0,200,255,0.25);background:rgba(0,200,255,0.05);transition:background .15s,border-color .15s" onmouseover="this.style.background='rgba(0,200,255,0.12)';this.style.borderColor='rgba(0,200,255,0.5)'" onmouseout="this.style.background='rgba(0,200,255,0.05)';this.style.borderColor='rgba(0,200,255,0.25)'">
          <div style="font-size:28px;line-height:1;flex-shrink:0">🎮</div>
          <div style="flex:1;min-width:0">
            <div style="font-size:11px;font-weight:900;letter-spacing:2px;color:var(--cyan);margin-bottom:3px">MARATHON</div>
            <div style="font-size:9px;color:rgba(255,255,255,0.55);letter-spacing:.5px;line-height:1.5">Clear lines, rack up score. No time limit — how high can you go?</div>
            <div style="font-size:8px;margin-top:4px">${marathonBest}</div>
          </div>
          <div style="font-size:18px;color:rgba(0,200,255,0.5);flex-shrink:0">›</div>
        </div>

        <!-- SPRINT -->
        <div onclick="startSprintMode()" style="cursor:pointer;display:flex;align-items:center;gap:12px;padding:12px 14px;border-radius:10px;border:1px solid rgba(0,255,136,0.25);background:rgba(0,255,136,0.05);transition:background .15s,border-color .15s" onmouseover="this.style.background='rgba(0,255,136,0.12)';this.style.borderColor='rgba(0,255,136,0.5)'" onmouseout="this.style.background='rgba(0,255,136,0.05)';this.style.borderColor='rgba(0,255,136,0.25)'">
          <div style="font-size:28px;line-height:1;flex-shrink:0">⚡</div>
          <div style="flex:1;min-width:0">
            <div style="font-size:11px;font-weight:900;letter-spacing:2px;color:#00ff88;margin-bottom:3px">SPRINT 40L</div>
            <div style="font-size:9px;color:rgba(255,255,255,0.55);letter-spacing:.5px;line-height:1.5">Clear 40 lines as fast as possible. Fastest time wins the leaderboard.</div>
            <div style="font-size:8px;margin-top:4px">${sprintBest}</div>
          </div>
          <div style="font-size:18px;color:rgba(0,255,136,0.5);flex-shrink:0">›</div>
        </div>

        <!-- DAILY CHALLENGE -->
        <div onclick="startDailyChallenge()" style="cursor:pointer;display:flex;align-items:center;gap:12px;padding:12px 14px;border-radius:10px;border:1px solid rgba(255,230,0,0.25);background:rgba(255,230,0,0.05);transition:background .15s,border-color .15s" onmouseover="this.style.background='rgba(255,230,0,0.1)';this.style.borderColor='rgba(255,230,0,0.5)'" onmouseout="this.style.background='rgba(255,230,0,0.05)';this.style.borderColor='rgba(255,230,0,0.25)'">
          <div style="font-size:28px;line-height:1;flex-shrink:0">🏆</div>
          <div style="flex:1;min-width:0">
            <div style="font-size:11px;font-weight:900;letter-spacing:2px;color:#ffe600;margin-bottom:3px">DAILY CHALLENGE</div>
            <div style="font-size:9px;color:rgba(255,255,255,0.55);letter-spacing:.5px;line-height:1.5">Today's fixed piece sequence. Same for everyone — pure skill, no luck.</div>
            <div style="font-size:8px;margin-top:4px">${dailySub}</div>
          </div>
          <div style="font-size:18px;color:rgba(255,230,0,0.5);flex-shrink:0">›</div>
        </div>

      </div>

      <button class="action-btn ghost" style="width:100%" onclick="showStartScreen()">← BACK</button>
    </div>`;
  $overlay.style.display='flex';
}

// ─── Init ─────────────────────────────────────────────────────────────────────
// Initialize shared visual state
S.flashLines = new Set();

initLayout();
initStars();
loadSettings();

// Auto low-perf: if integrated GPU detected and user has not manually set preference
if(!localStorage.getItem(LS.LOW_PERF)&&_detectLowEndGPU()){
  setLowPerfMode(true);
  S._perfLocked=true;
}

S.hiScore=parseInt(localStorage.getItem(LS.HI)||'0');
const $hiScore  = document.getElementById('hi-score');
const $hiScoreM = document.getElementById('hi-score-m');
if($hiScore)$hiScore.textContent=S.hiScore.toLocaleString();
if($hiScoreM)$hiScoreM.textContent=S.hiScore.toLocaleString();
animFrame=requestAnimationFrame(function bgOnly(ts){drawBackground();if(!S.gameRunning)animFrame=requestAnimationFrame(bgOnly);});
showStartScreen();
// Pre-warm cell sprites during idle so startGame() click doesn't block (INP fix)
(window.requestIdleCallback||function(cb){setTimeout(cb,200);})(function(){
  for(var k in PIECES)getCellSprite(PIECES[k].color);
},{timeout:8000});

// ─── Memory / resource lifecycle ─────────────────────────────────────────────
document.addEventListener('visibilitychange',()=>{
  if(document.hidden){onPageHide();}else{onPageShow();}
});
window.addEventListener('beforeunload',()=>{
  closeAudio();
  if(animFrame){cancelAnimationFrame(animFrame);animFrame=null;}
});

// ─── Expose functions needed by inline onclick handlers ───────────────────────
// esbuild bundles to IIFE — functions are not global by default.
// HTML template uses onclick="fn()" style which requires window.fn.
Object.assign(window, {
  startGame, startSprintMode, startDailyChallenge, launchDailyChallenge,
  togglePause, showStartScreen, showModeSelector,
  submitScore, submitSprintScore, shareScore, shareSprintScore,
  renderLbTab, setLbMode, loadStartLeaderboard,
  toggleMute, updateDAS, updateARR, updateLockDelay,
  updateGhost, updateColorblind, cycleAnimIntensity,
  openHowToPlay, closeHowToPlay, openStats, closeStats,
  showAchTooltip, hideAchTooltip,
  _openDonation,
});
