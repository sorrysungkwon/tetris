import { S, LS, ACHIEVEMENTS, COLS, ROWS, COLOR_TO_KEY, SUPPORT_URL, MAX_PARTICLES, PIECES, SPRINT_LINES, LEVEL_LINES, SCORE_TABLE, TSPIN_SCORE, TSPIN_MINI_SCORE, mulberry32, fmtTime, _getAchievements, _getLifetime } from './shared.js';
import { toggleMute, startBGM, stopBGM, pauseBGM, resumeBGM, playBeep, sfxMove, sfxRotate, sfxHardDrop, sfxHold, sfxLineClear, sfxGameOver, sfxTSpin, sfxAchievementUnlock, applyMuteToGain, onPageHide, onPageShow, closeAudio, sfxUIHover, sfxUIClick } from './audio.js';

document.addEventListener('mouseover', (e) => {
  const btn = e.target.closest('.action-btn, .lb-tab, .toggle-btn, .mode-card, .ach-badge-wrap');
  if (btn && (!e.relatedTarget || !btn.contains(e.relatedTarget))) sfxUIHover();
});
document.addEventListener('mousedown', (e) => {
  if (e.target.closest('.action-btn, .lb-tab, .toggle-btn, .tbtn, .mode-card, .ach-badge-wrap')) sfxUIClick();
});
document.addEventListener('touchstart', (e) => {
  if (e.target.closest('.action-btn, .lb-tab, .toggle-btn, .tbtn, .mode-card, .ach-badge-wrap')) sfxUIClick();
}, {passive: true});
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
import {
  _openDonation, _donationHTML,
  submitSprintScore, shareSprintScore, captureSprintImage,
  lbHTML, submitScore, captureGameImage, shareScore,
  loadStartLeaderboard, renderLbTab, setLbMode
} from './leaderboard.js';
import {
  showDailyGateOverlay, startDailyChallenge, togglePause, _saveGameStats, _renderGameOverScreen,
  _renderSprintScreen, showStartScreen, showModeSelector
} from './screens.js';

document.addEventListener('gesturestart',  e=>e.preventDefault(), {passive:false});
document.addEventListener('gesturechange', e=>e.preventDefault(), {passive:false});
document.addEventListener('touchmove', e=>{ if(e.touches.length>1) e.preventDefault(); }, {passive:false});

// ─── State ────────────────────────────────────────────────────────────────────
let canHold;
let gameOver;
let dropInterval;
let animFrame;
let bag=[];
let lastDropTs=0;
let prevTs=0;
let _countdownTimer=null;
let _prng=null;

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
    S.flashLines=new Set(cleared);S.flashTimer=12;S.combo++;if(S.combo>S.maxCombo)S.maxCombo=S.combo;
    const mul=S.combo>1?S.combo:1;
    const pts=tspin==='full'
      ?TSPIN_SCORE[Math.min(cleared.length,3)]*S.level*mul
      :tspin==='mini'
      ?TSPIN_MINI_SCORE[Math.min(cleared.length,2)]*S.level*mul
      :SCORE_TABLE[Math.min(cleared.length,4)]*S.level*mul;
    sfxLineClear(cleared.length);
    if(tspin){sfxTSpin();if(S.animIntensity==='full'){S.shakeFrames=Math.max(S.shakeFrames,12+cleared.length*6);S.shakeMag=Math.max(S.shakeMag,0.55);}}
    if(S.combo>1&&S.animIntensity!=='off'){
      S.comboFlash=15 + (S.combo>=4 ? 15 : 0);
      S.comboFlashColor=S.combo>=5?'#ff0080':S.combo>=3?'#a000ff':'#00c8ff';
      if(S.combo>=4 && S.animIntensity==='full') {
        S.shakeFrames=Math.max(S.shakeFrames, 10 + S.combo*3);
        S.shakeMag=Math.max(S.shakeMag, Math.min(2.5, S.combo*0.35));
        S.shakeAllDir=true;
      }
    }
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
      spawnLineClearParticles(snap, tspin, false);
      if(snap.length>=4&&!tspin&&S.animIntensity==='full'){S.shakeFrames=25;S.shakeMag=0.7;}
      if(snap.length>=4){triggerScreenFlash();if(S.animIntensity!=='off')S.rainbowBorder=45;}
      // All-clear bonus: board completely empty
      if(S.board.every(row=>row.every(v=>v===null))){
        const bonus=2000*S.level;
        addScore(bonus,0,false);
        showScorePopup(bonus,-1,false); // -1 signals all-clear
        triggerAllClearFlash();
        spawnLineClearParticles(snap, false, true);
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
  if (code === 'ArrowLeft' || code === 'ArrowRight' || code === 'KeyA' || code === 'KeyD') el = _keyGuide.move;
  else if (code === 'ArrowUp'   || code === 'KeyW')  el = _keyGuide.rotate;
  else if (code === 'ArrowDown' || code === 'KeyS')  el = _keyGuide.soft;
  else if (code === 'Space')                          el = _keyGuide.hard;
  else if (code === 'KeyC' || code === 'ShiftLeft')   el = _keyGuide.hold;
  else if (code === 'KeyP')                           el = _keyGuide.pause;
  else if (code === 'KeyM')                           el = _keyGuide.mute;
  if (el) el.classList.toggle('key-pressed', isPressed);
}
function handleUINavigation(e) {
  const overlay = document.getElementById('overlay');
  const help = document.getElementById('htp-overlay');
  const stats = document.getElementById('stats-overlay');
  const donation = document.getElementById('donation-modal');

  let activeOverlay = null;
  if (donation) activeOverlay = donation;
  else if (help && help.style.display === 'flex') activeOverlay = help;
  else if (stats && stats.style.display === 'flex') activeOverlay = stats;
  else if (overlay && overlay.style.display === 'flex') activeOverlay = overlay;

  if (!activeOverlay) return false;
  
  const active = document.activeElement;

  if (e.code === 'Escape' || e.code === 'Backspace') {
    if (e.code === 'Backspace' && active && active.tagName === 'INPUT' && active.type === 'text') return false;
    
    const btn = Array.from(activeOverlay.querySelectorAll('button')).find(b => {
      const t = b.textContent.toUpperCase();
      return b.classList.contains('close-btn') || b.classList.contains('cancel') || t.includes('BACK') || t === 'RESUME' || t === 'CANCEL';
    });
    if (btn) {
      e.preventDefault();
      sfxUIClick();
      btn.click();
      return true;
    }
  }

  if (active && active.tagName === 'INPUT' && active.type === 'text') {
    if (e.code === 'Enter') return false;
    if (e.code === 'ArrowLeft' || e.code === 'ArrowRight') return false;
  }

  const isDown = e.code === 'ArrowDown' || e.code === 'KeyS';
  const isUp   = e.code === 'ArrowUp'   || e.code === 'KeyW';
  const isRight= e.code === 'ArrowRight'|| e.code === 'KeyD';
  const isLeft = e.code === 'ArrowLeft' || e.code === 'KeyA';

  const scrollable = activeOverlay.querySelector('#htp-scroll, #stats-scroll');
  if (scrollable && (isDown || isUp)) {
    scrollable.scrollTop += isDown ? 60 : -60;
    e.preventDefault();
    return true;
  }

  const focusables = Array.from(activeOverlay.querySelectorAll('button, input, a[href], [tabindex="0"]'))
    .filter(el => el.offsetWidth > 0 && el.offsetHeight > 0 && !el.disabled);
  
  if (focusables.length === 0) return false;

  let idx = focusables.indexOf(active);
  
  const isDown = e.code === 'ArrowDown' || e.code === 'KeyS';
  const isUp   = e.code === 'ArrowUp'   || e.code === 'KeyW';
  const isRight= e.code === 'ArrowRight'|| e.code === 'KeyD';
  const isLeft = e.code === 'ArrowLeft' || e.code === 'KeyA';

  if (isDown || isRight || (e.code === 'Tab' && !e.shiftKey)) {
    if (active && active.type === 'range' && (isLeft || isRight)) return false;
    e.preventDefault();
    idx = (idx + 1) % focusables.length;
    focusables[idx].focus();
    sfxUIHover();
    return true;
  }
  if (isUp || isLeft || (e.code === 'Tab' && e.shiftKey)) {
    if (active && active.type === 'range' && (isLeft || isRight)) return false;
    e.preventDefault();
    idx = idx <= 0 ? focusables.length - 1 : idx - 1;
    focusables[idx].focus();
    sfxUIHover();
    return true;
  }
  if (e.code === 'Enter' || e.code === 'Space') {
    if (active && focusables.includes(active) && active.tagName !== 'INPUT') {
      e.preventDefault();
      sfxUIClick();
      active.click();
      return true;
    }
  }
  return false;
}

document.addEventListener('keydown',e=>{
  if(e.code==='KeyM') toggleMute();
  if (handleUINavigation(e)) return;
  updateKeyGuideState(e.code, true);
  if(!S._kbMode && window.matchMedia('(pointer:coarse)').matches) _enableKbMode();
  if(KEYS[e.code])return;KEYS[e.code]=true;
  if(!S.gameRunning)return;
  if(e.code==='KeyP' || e.code==='Escape'){togglePause();return;}
  if(S.gamePaused||S._countdownVal)return;
  switch(e.code){
    case'ArrowLeft':case'KeyA':  moveX(-1);startDAS(-1);nudgeUI(12,-2);break;
    case'ArrowRight':case'KeyD': moveX(1); startDAS(1); nudgeUI(-12,-2);break;
    case'ArrowDown':case'KeyS':  softDrop();startDASDown();e.preventDefault();break;
    case'ArrowUp':case'KeyW':    rotatePiece();break;
    case'Space':     hardDrop();e.preventDefault();break;
    case'KeyC':case'ShiftLeft':holdPiece();break;
  }
});
document.addEventListener('keyup',e=>{
  updateKeyGuideState(e.code, false);
  KEYS[e.code]=false;
  if(e.code==='ArrowLeft'||e.code==='ArrowRight'||e.code==='KeyA'||e.code==='KeyD')clearDAS();
  if(e.code==='ArrowDown'||e.code==='KeyS')clearDASDown();
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
  function press(e){e.preventDefault();e.stopPropagation();if(on)return;on=true;el.classList.add('pressed');if(!S.gameRunning&&mode!=='any')return;if((S.gamePaused||S._countdownVal)&&mode==='game')return;onPress();if(mode==='repeat'){to=setTimeout(()=>{iv=setInterval(()=>{if(S.gameRunning&&!S.gamePaused)onPress();},S.arr);},S.das);}}
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
  if(S.isSprintMode&&S.gameRunning&&!S.gamePaused&&!S._countdownVal)updateSprintTimer();
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

export function startGame(){
  $overlay.style.display='none';
  $combo.textContent='';
  // Reset display synchronously so overlay-hide and value-reset happen in the
  // same JS task — prevents a one-frame flash of the previous score/timer.
  S.score=0; S.lines=0; S.level=1; S._sprintStartTime=0;
  updateUI();
  if(S.isSprintMode)updateSprintTimer();
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
  S.board=createBoard();S.score=0;S.lines=0;S.level=1;S.combo=0;S.maxCombo=0;dropInterval=800;
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
    S._sprintEndTime=0;S._sprintStartTime=0;
    if(psl)psl.textContent='TIME';
    if(lsl)lsl.textContent='LEFT';
  }else{
    if(psl)psl.textContent='SCORE';
    if(lsl)lsl.textContent='CLEARED';
  }

  spawnPiece();drawNext();drawHold();updateUI();
  if(S.isSprintMode)updateSprintTimer();
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

export function launchDailyChallenge() {
  const todayStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  S.isDailyMode=true;
  _prng = mulberry32(parseInt(todayStr, 10));
  startGame();
}

let _sprintPauseTs = 0;

export function pauseGameTiming() {
  if (S.isSprintMode && S._sprintStartTime > 0) _sprintPauseTs = performance.now();
}

export function resumeGameTiming() {
  if (S.isSprintMode && _sprintPauseTs > 0) {
    S._sprintStartTime += performance.now() - _sprintPauseTs;
    _sprintPauseTs = 0;
  }
  lastDropTs = performance.now();
  prevTs = 0;
}

export function stopGameAndReset() {
  clearInterval(_countdownTimer); _countdownTimer=null;
  S._countdownVal=0; S._countdownGo=0; S.gamePaused=false;
  S.gameRunning=false;
  if(animFrame){cancelAnimationFrame(animFrame);animFrame=null;}
  animFrame=requestAnimationFrame(function bgOnly(ts){drawBackground();if(!S.gameRunning)animFrame=requestAnimationFrame(bgOnly);});
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

export function startSprintMode(){
  S.isSprintMode=true;
  S.isDailyMode=false;
  startGame();
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

// ─── Error monitoring ─────────────────────────────────────────────────────────
const _VERSION = 'v1.1';
window.onerror = function(msg, src, line, col, err) {
  console.error('[glowtris ' + _VERSION + '] uncaught error', {
    msg, src: src ? src.replace(window.location.origin, '') : src, line, col,
    stack: err && err.stack ? err.stack.split('\n').slice(0, 5).join('\n') : null,
  });
};
window.onunhandledrejection = function(e) {
  const reason = e.reason;
  console.error('[glowtris ' + _VERSION + '] unhandled rejection', {
    msg: reason instanceof Error ? reason.message : String(reason),
    stack: reason instanceof Error && reason.stack ? reason.stack.split('\n').slice(0, 5).join('\n') : null,
  });
};

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
