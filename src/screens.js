import { S, LS, SPRINT_LINES, fmtTime, _getLifetime } from './shared.js';
import { pauseBGM, resumeBGM, stopBGM, toggleMute } from './audio.js';
import {
  updateDAS, updateARR, updateLockDelay, updateGhost, updateColorblind,
  cycleAnimIntensity, _animLabel, openHowToPlay, openStats, unlockAchievement
} from './ui.js';
import {
  _donationHTML, submitScore, submitSprintScore,
  renderLbTab, setLbMode, loadStartLeaderboard
} from './leaderboard.js';
import {
  startGame, startSprintMode, launchDailyChallenge,
  resumeGameTiming, stopGameAndReset
} from './game.js';

const $overlay = document.getElementById('overlay');

let _gateTimer = null;

export function showDailyGateOverlay(todayStr) {
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
      <h1 class="daily-header">🏆 DAILY CHALLENGE</h1>
      <div class="daily-icon">🏅</div>
      <div class="daily-completed-lbl">
        CHALLENGE COMPLETED FOR TODAY!<br>COME BACK TOMORROW.
      </div>
      <div class="daily-countdown-lbl">NEXT CHALLENGE IN</div>
      <div id="daily-countdown" style="font-size:24px;font-weight:900;color:var(--cyan);text-shadow:0 0 10px var(--cyan);margin-bottom:20px;letter-spacing:1.5px">--:--:--</div>
      <button class="action-btn full-width" onclick="showModeSelector()">BACK</button>
    </div>
  `;
  $overlay.style.display = 'flex';
  updateCountdown();
  _gateTimer = setInterval(updateCountdown, 1000);
}

export function startDailyChallenge() {
  const todayStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  if (localStorage.getItem(LS.DAILY_DATE) === todayStr) {
    showDailyGateOverlay(todayStr);
    return;
  }

  $overlay.innerHTML = `
    <div class="glass-panel">
      <h1 class="daily-header">🏆 DAILY CHALLENGE</h1>
      <div class="daily-icon pulse">🛰️</div>
      <div class="daily-subtitle">SAME BLOCKS FOR EVERYONE!</div>

      <div class="briefing-card">
        <p style="color:#ffe600;font-weight:900;letter-spacing:1px">[WELCOME TO THE DAILY MISSION!]</p>
        <p>Today, every player in the whole world will get the <strong>exact same blocks</strong> in the same order!</p>
        <p style="color:var(--cyan)">Luck doesn't matter today! Only your real skills will make you number one on the leaderboard.</p>
      </div>

      <div class="warning-card">
        ⚠️ Warning: You can only play ONCE today!<br>
        Once you start, there are no retries!
      </div>

      <div class="btn-row main-actions">
        <button class="action-btn" id="daily-launch-btn" onclick="launchDailyChallenge()">START CHALLENGE</button>
        <button class="action-btn ghost" onclick="showModeSelector()">GO BACK</button>
      </div>
    </div>
  `;
  $overlay.style.display = 'flex';
}

export function togglePause(){
  if(!S.gameRunning)return;
  S.gamePaused=!S.gamePaused;
  if(S.gamePaused){
    pauseBGM();
    $overlay.innerHTML=`
      <div class="glass-panel">
        <h1 class="pause-header">PAUSED</h1>
        <div class="settings-box">
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
        <button class="action-btn full-width" onclick="togglePause()">RESUME</button>
        <button class="action-btn ghost full-width restart" onclick="showStartScreen()">RESTART</button>
      </div>`;
    $overlay.style.display='flex';
  } else {
    resumeBGM();
    $overlay.style.display='none';
    resumeGameTiming();
  }
}

export function _saveGameStats() {
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
  if (S.maxCombo > storedMaxCombo) localStorage.setItem(LS.MAX_COMBO, S.maxCombo);
  const displayMaxCombo = Math.max(S.maxCombo, storedMaxCombo);

  let totalGames = parseInt(localStorage.getItem(LS.TOTAL_GAMES) || '0');
  let totalScore = parseInt(localStorage.getItem(LS.TOTAL_SCORE) || '0');
  let bestLevel  = parseInt(localStorage.getItem(LS.BEST_LEVEL)  || '0');
  let totalLines = parseInt(localStorage.getItem(LS.TOTAL_LINES) || '0');
  let maxLines   = parseInt(localStorage.getItem(LS.MAX_LINES)   || '0');

  const isBestLevel = S.level > 0 && S.level >= bestLevel;
  const isBestCombo = S.maxCombo > 0 && S.maxCombo >= storedMaxCombo;
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

export function _renderGameOverScreen({ isNewBest, newStreak, displayMaxCombo, isBestLevel, isBestCombo, isBestLines }) {
  const savedName = localStorage.getItem(LS.NAME) || '';

  let pbBadges = [];
  if (S.isDailyMode) {
    pbBadges.push(`<div class="pb-badge score-pb">🏅 DAILY CHALLENGE</div>`);
  } else {
    if (isNewBest)  pbBadges.push(`<div class="pb-badge score-pb">🏆 RECORD SCORE</div>`);
    if (isBestLevel) pbBadges.push(`<div class="pb-badge level-pb">👑 RECORD LEVEL: L${S.level}</div>`);
    if (isBestLines) pbBadges.push(`<div class="pb-badge lines-pb">🎯 RECORD LINES: ${S.lines}</div>`);
    if (isBestCombo) pbBadges.push(`<div class="pb-badge combo-pb">⚡ RECORD COMBO: x${S.maxCombo}</div>`);
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
      <h1 class="game-over-header">${S.isDailyMode ? 'DAILY CHALLENGE' : 'GAME OVER'}</h1>
      ${!S.isDailyMode && isNewBest ? '<div class="new-best-badge">★ NEW BEST ★</div>' : ''}
      
      <div class="game-over-stats">
        <div class="stat-item">
          <span class="stat-label">SCORE</span>
          <span class="stat-val">${S.score.toLocaleString()}</span>
        </div>
        <div class="stat-item">
          <span class="stat-label">BEST</span>
          <span class="stat-val highlight">${S.hiScore.toLocaleString()}</span>
        </div>
      </div>

      ${badgesHTML ? `<div style="width:100%;margin-bottom:18px">${badgesHTML}</div>` : ''}
      
      <div style="width:100%">
        <input id="lb-name" class="neon-input" maxlength="12" placeholder="ENTER NAME" value="${savedName}" autocomplete="off" spellcheck="false">
        <div class="btn-row sub-actions">
          <button id="lb-submit-btn" class="action-btn sm" onclick="submitScore()">SUBMIT</button>
          <button class="action-btn sm ghost" onclick="showStartScreen()">PLAY AGAIN</button>
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

export function _renderSprintScreen(timeMs, isNewBest, prevBest) {
  const savedName=localStorage.getItem(LS.NAME)||'';
  const lpm=Math.round(SPRINT_LINES/(timeMs/60000));
  const prevBestLine=prevBest>0&&!isNewBest
    ?`<div style="font-size:8px;letter-spacing:1.5px;color:rgba(255,255,255,0.3);margin-bottom:10px">BEST: ${fmtTime(prevBest)}</div>`:'';

  $overlay.innerHTML=`
    <div class="glass-panel">
      <h1 class="game-over-header" style="margin-bottom:8px !important">🏁 SPRINT COMPLETE!</h1>
      ${isNewBest?'<div class="new-best-badge">★ NEW BEST ★</div>':prevBestLine}
      
      <div class="game-over-stats" style="padding:16px 12px">
        <div style="font-size:9px;letter-spacing:3px;color:rgba(0,200,255,0.6);margin-bottom:6px">FINISH TIME</div>
        <div style="font-size:40px;font-weight:900;color:#ffe600;text-shadow:0 0 20px rgba(255,230,0,0.7);letter-spacing:2px;font-family:monospace;line-height:1.2">${fmtTime(timeMs)}</div>
        <div style="font-size:10px;letter-spacing:2px;color:rgba(255,255,255,0.55);margin-top:8px">${lpm} LPM</div>
      </div>

      <div style="width:100%">
        <input id="lb-name" class="neon-input" maxlength="12" placeholder="ENTER NAME" value="${savedName}" autocomplete="off" spellcheck="false">
        <div class="btn-row sub-actions">
          <button id="lb-submit-btn" class="action-btn sm" onclick="submitSprintScore(${timeMs})">SUBMIT</button>
          <button class="action-btn sm ghost" onclick="showStartScreen()">PLAY AGAIN</button>
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

export function showStartScreen(){
  S.isDailyMode=false;
  S.isSprintMode=false;
  if(_gateTimer) { clearInterval(_gateTimer); _gateTimer=null; }
  stopGameAndReset();
  
  const psl=document.getElementById('panel-score-label');
  const lsl=document.getElementById('lines-sub-label');
  if(psl)psl.textContent='SCORE';
  if(lsl)lsl.textContent='CLEARED';
  
  stopBGM();
  $overlay.innerHTML=`
    <div class="glass-panel">
      <h1>GLOWTRIS</h1>
      <div id="start-lb">
        <div class="lb-mode-toggle">
          <button id="lb-mode-marathon" class="lb-tab ${S.lbMode==='marathon'?'active':''}" onclick="setLbMode('marathon')">MARATHON</button>
          <button id="lb-mode-sprint" class="lb-tab ${S.lbMode==='sprint'?'active':''}" onclick="setLbMode('sprint')">⚡ SPRINT</button>
          <button id="lb-mode-daily" class="lb-tab ${S.lbMode==='daily'?'active':''}" onclick="setLbMode('daily')">🏆 DAILY</button>
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
      <div class="btn-row main-actions">
        <button class="action-btn" onclick="showModeSelector()">PLAY</button>
      </div>
      <div class="btn-row sub-actions">
        <button class="action-btn ghost" onclick="openHowToPlay()">HOW TO PLAY</button>
        <button class="action-btn ghost" onclick="openStats()">STATS</button>
      </div>
      ${_donationHTML()}
      <div class="footer-links-wrap">
        <a href="/privacy.html" class="footer-link">PRIVACY</a>
        <span style="color:rgba(255,255,255,0.12)">·</span>
        <a href="/terms.html" class="footer-link">TERMS</a>
      </div>
    </div>`;
  $overlay.style.display='flex';
  loadStartLeaderboard();
}

export function showModeSelector(){
  const sprintBest=S._sprintHiTime>0?`<span style="color:rgba(0,255,136,0.75)">Best: ${fmtTime(S._sprintHiTime)}</span>`:'<span style="color:rgba(255,255,255,0.3)">No record yet</span>';
  const hiS=parseInt(localStorage.getItem(LS.HI)||'0');
  const marathonBest=hiS>0?`<span style="color:rgba(0,200,255,0.75)">Best: ${hiS.toLocaleString()}</span>`:'<span style="color:rgba(255,255,255,0.3)">No record yet</span>';
  const todayStr=new Date().toISOString().slice(0,10).replace(/-/g,'');
  const dailyDone=localStorage.getItem(LS.DAILY_DATE)===todayStr;
  const dailySub=dailyDone?'<span style="color:rgba(255,230,0,0.75)">✓ Completed today</span>':'<span style="color:rgba(255,255,255,0.3)">Not played today</span>';

  $overlay.innerHTML=`
    <div class="glass-panel">
      <h1 style="font-size:16px;margin-bottom:18px;letter-spacing:3px">SELECT MODE</h1>

      <div style="width:100%;display:flex;flex-direction:column;gap:10px;margin-bottom:18px">

        <!-- MARATHON -->
        <div class="mode-card marathon" onclick="startGame()">
          <div class="mode-icon">🎮</div>
          <div class="mode-info">
            <div class="mode-name">MARATHON</div>
            <div class="mode-desc">Clear lines, rack up score. No time limit — how high can you go?</div>
            <div class="mode-best">${marathonBest}</div>
          </div>
          <div class="mode-arrow">›</div>
        </div>

        <!-- SPRINT -->
        <div class="mode-card sprint" onclick="startSprintMode()">
          <div class="mode-icon">⚡</div>
          <div class="mode-info">
            <div class="mode-name">SPRINT 40L</div>
            <div class="mode-desc">Clear 40 lines as fast as possible. Fastest time wins the leaderboard.</div>
            <div class="mode-best">${sprintBest}</div>
          </div>
          <div class="mode-arrow">›</div>
        </div>

        <!-- DAILY CHALLENGE -->
        <div class="mode-card daily" onclick="startDailyChallenge()">
          <div class="mode-icon">🏆</div>
          <div class="mode-info">
            <div class="mode-name">DAILY CHALLENGE</div>
            <div class="mode-desc">Today's fixed piece sequence. Same for everyone — pure skill, no luck.</div>
            <div class="mode-best">${dailySub}</div>
          </div>
          <div class="mode-arrow">›</div>
        </div>

      </div>

      <button class="action-btn ghost full-width" onclick="showStartScreen()">← BACK</button>
    </div>`;
  $overlay.style.display='flex';
}
