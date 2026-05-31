import { S, LS, ACHIEVEMENTS, COLS, ROWS, COLOR_TO_KEY, SUPPORT_URL, MAX_PARTICLES, PIECES, SPRINT_LINES, LEVEL_LINES, fmtTime, _getAchievements, _getLifetime } from './shared.js';
import { sfxAchievementUnlock, playBeep, toggleMute, applyMuteToGain } from './audio.js';

// ─── Canvas refs ──────────────────────────────────────────────────────────────
export const gc   = document.getElementById('game-canvas');
export const gctx = gc.getContext('2d');
export const pc   = document.getElementById('particle-canvas');
const pctx = pc.getContext('2d');
// Desktop previews
export const ncD  = document.getElementById('next-canvas');
export const ncDx = ncD.getContext('2d');
export const hcD  = document.getElementById('hold-canvas');
export const hcDx = hcD.getContext('2d');
// Mobile previews
export const ncM  = document.getElementById('next-canvas-m');
const ncMx = ncM.getContext('2d');
export const hcM  = document.getElementById('hold-canvas-m');
const hcMx = hcM.getContext('2d');
// Background
export const bgc  = document.getElementById('bg-canvas');
const bgx  = bgc.getContext('2d');

// ─── DOM cache ────────────────────────────────────────────────────────────────
const $score      = document.getElementById('score-display');
const $scoreM     = document.getElementById('score-display-m');
const $lines      = document.getElementById('lines-display');
const $linesM     = document.getElementById('lines-display-m');
const $level      = document.getElementById('level-display');
const $levelM     = document.getElementById('level-display-m');
const $hiScore    = document.getElementById('hi-score');
const $hiScoreM   = document.getElementById('hi-score-m');
const $levelBar   = document.getElementById('level-bar');
const $bpmEl      = document.getElementById('bpm-display');
const $combo      = document.getElementById('combo-display');
const $app        = document.getElementById('app');
const $flash      = document.getElementById('screen-flash');
const $scorePopup = document.getElementById('score-popup');

// ─── Color cache ─────────────────────────────────────────────────────────────
const _rgbCache = new Map();

// ─── Nudge state (module-local — only nudgeUI/applyShake use it) ───────────
let _nudgeActive = false;
let _nudgeTimer  = null;

// ─── Background state ────────────────────────────────────────────────────────
let stars = [], nebulae = [], bgHue = 0, _cBgPulse = 0;
let _bgGradCache = null, _bgGradCtx = null;
let _chGradCache = null, _chGradCtx = null;
let _bgFrameCount = 0;
const BG_GRAD_INTERVAL = 4;
let _lpBgCache = null, _lpChBgCache = null;

// ─── Cell sprite cache ────────────────────────────────────────────────────────
let _cellSprites     = {};
let _lastBorderColor = null;

// ─── FPS counters ─────────────────────────────────────────────────────────────
let _fpsCnt = 0, _fpsLast = 0, _fpsLowCount = 0, _perfHold = 0;

// ─── Stats / HTP overlay open-timestamps (prevents instant close) ─────────────
let _htpOpenTs = 0, _statsOpenTs = 0;

// ─── Particle color palette ───────────────────────────────────────────────────
const PAL = ['#00c8ff','#a000ff','#ff0080','#ffe600','#00ff88'];

// ─── Performance detection ────────────────────────────────────────────────────
export function measureFPS(ts) {
  _fpsCnt++;
  if (ts - _fpsLast >= 1000) {
    const fps = _fpsCnt; _fpsCnt = 0; _fpsLast = ts;
    if (_perfHold > 0) { _perfHold--; _fpsLowCount = 0; return; }
    if (!S.lowPerfMode) {
      if (fps < 28) { _fpsLowCount++; if (_fpsLowCount >= 2) { setLowPerfMode(true); S._perfLocked = true; _perfHold = 1; } }
      else { _fpsLowCount = 0; }
    }
  }
}

export function setLowPerfMode(on) {
  S.lowPerfMode = on;
  document.documentElement.classList.toggle('low-perf', on);
  const ind = document.getElementById('perf-indicator');
  if (ind) ind.style.opacity = on ? '1' : '0';
  if (on) localStorage.setItem(LS.LOW_PERF, '1');
  else    localStorage.removeItem(LS.LOW_PERF);
}

export function resetPerfHold(locked, savedPerf) {
  _fpsCnt = 0; _fpsLast = 0; _fpsLowCount = 0;
  _perfHold = (locked || savedPerf) ? 0 : 3;
}

// ─── Layout ───────────────────────────────────────────────────────────────────
export function _applyTouchCELL() {
  const W = window.innerWidth, H = window.innerHeight;
  S.isMobile = W < 600 || window.matchMedia('(pointer:coarse)').matches;
  const availW  = W - (S.isMobile ? 32 : 56);
  const headerH = S.isMobile ? 52 : 30;
  const ctrlH   = S.isMobile ? 188 : 218;

  const isIOSPWA = navigator.standalone === true;
  let safeTop = 0, safeBottom = 0;
  if (isIOSPWA) {
    const isIPad = /iPad/.test(navigator.userAgent) ||
      (/Macintosh/.test(navigator.userAgent) && navigator.maxTouchPoints > 1);
    const ph = Math.max(screen.width, screen.height);
    if (isIPad) {
      safeTop    = ph >= 1100 ? 24 : 20;
      safeBottom = ph >= 1100 ? 20 :  0;
    } else {
      if      (ph >= 852) { safeTop = 59; safeBottom = 34; }
      else if (ph >= 844) { safeTop = 47; safeBottom = 34; }
      else if (ph >= 780) { safeTop = 44; safeBottom = 34; }
      else                { safeTop = 20; safeBottom =  0; }
    }
  }

  const padTop    = Math.max(8, safeTop);
  const padBottom = Math.max(8, safeBottom);
  const appPaddingV = padTop + padBottom;
  const gapsAndBreathing = 16 + 8;
  const availH = H - appPaddingV - headerH - ctrlH - gapsAndBreathing;
  if (availH <= 0) return;

  const newCELL = Math.max(10, Math.min(30, Math.floor(Math.min(availW / COLS, availH / ROWS))));
  const gameW = COLS * newCELL;
  const gameH = ROWS * newCELL;

  document.documentElement.style.setProperty('--game-w', gameW + 'px');
  gc.style.width  = gameW + 'px';  gc.style.height = gameH + 'px';
  pc.style.width  = gameW + 'px';  pc.style.height = gameH + 'px';

  const miniW = Math.max(26, Math.min(30, Math.round(gameW * 0.10)));
  const miniH = Math.round(miniW * 0.8);
  if (ncM.width !== miniW || ncM.height !== miniH) {
    ncM.width = miniW; ncM.height = miniH;
    ncM.style.width = miniW + 'px'; ncM.style.height = miniH + 'px';
    hcM.width = miniW; hcM.height = miniH;
    hcM.style.width = miniW + 'px'; hcM.style.height = miniH + 'px';
  }

  if (newCELL === S.CELL && gc.width === gameW && gc.height === gameH) return;

  S.CELL = newCELL;
  _cellSprites = {};
  gc.width  = gameW; gc.height = gameH;
  pc.width  = gameW; pc.height = gameH;
  if (S.gameRunning) { drawBoard(); drawNext(); drawHold(); }
}

export function initLayout() {
  const W = window.innerWidth, H = window.innerHeight;
  const isCoarse = window.matchMedia('(pointer:coarse)').matches;
  S.isMobile = (W < 600) || (isCoarse && !S._kbMode);
  bgc.width = W; bgc.height = H;

  if (isCoarse && !S._kbMode) {
    _applyTouchCELL();
  } else {
    if (S.CELL !== 30) { _cellSprites = {}; }
    S.CELL = 30;
    gc.width  = COLS * S.CELL; gc.height = ROWS * S.CELL;
    gc.style.width  = (COLS * S.CELL) + 'px'; gc.style.height = (ROWS * S.CELL) + 'px';
    pc.width  = COLS * S.CELL; pc.height = ROWS * S.CELL;
    pc.style.width  = (COLS * S.CELL) + 'px'; pc.style.height = (ROWS * S.CELL) + 'px';
    ncD.width = 4 * S.CELL; ncD.height = 3 * S.CELL;
    ncD.style.width = (4 * S.CELL) + 'px'; ncD.style.height = (3 * S.CELL) + 'px';
    hcD.width = 4 * S.CELL; hcD.height = 3 * S.CELL;
    hcD.style.width = (4 * S.CELL) + 'px'; hcD.style.height = (3 * S.CELL) + 'px';
  }
}

// ─── Keyboard parallax nudge ──────────────────────────────────────────────────
export function nudgeUI(dx, dy) {
  if(S.animIntensity !== 'full') return;
  _nudgeActive = true;
  clearTimeout(_nudgeTimer);
  $app.style.transition = 'none';
  $app.style.transform  = `translate(${dx}px,${dy}px)`;
  void $app.offsetWidth;
  $app.style.transition = 'transform 0.26s cubic-bezier(0.15,2.8,0.5,0.82)';
  $app.style.transform  = '';
  _nudgeTimer = setTimeout(() => { _nudgeActive = false; }, 300);
}

// ─── iPad keyboard mode ───────────────────────────────────────────────────────
export function _enableKbMode() {
  if (S._kbMode) return;
  if (Math.min(window.screen.width, window.screen.height) < 600) return;
  S._kbMode = true;
  document.documentElement.classList.add('kb-mode');
  initLayout(); initStars();
  if (S.gameRunning) { drawBoard(); drawNext(); drawHold(); }
}
export function _disableKbMode() {
  if (!S._kbMode) return;
  S._kbMode = false;
  document.documentElement.classList.remove('kb-mode');
  initLayout(); initStars();
  if (S.gameRunning) { drawBoard(); drawNext(); drawHold(); }
}
document.addEventListener('touchstart', () => { if (S._kbMode && !S.gamePaused) _disableKbMode(); }, { passive: true });

let _resizeTimer;
window.addEventListener('resize', () => {
  clearTimeout(_resizeTimer);
  _resizeTimer = setTimeout(() => { initLayout(); initStars(); if (S.gameRunning) drawBoard(); }, 150);
});

// ─── Background starfield ─────────────────────────────────────────────────────
function _buildLowPerfBg(W, H, isChallenge) {
  const oc = document.createElement('canvas');
  oc.width = W; oc.height = H;
  const c = oc.getContext('2d');
  c.fillStyle = isChallenge ? '#060001' : '#00000e';
  c.fillRect(0, 0, W, H);
  const cg = c.createRadialGradient(W/2, H*0.45, 0, W/2, H*0.45, Math.max(W,H)*0.85);
  if (isChallenge) {
    cg.addColorStop(0,    'rgba(90,6,12,0.85)');
    cg.addColorStop(0.4,  'rgba(50,3,7,0.55)');
    cg.addColorStop(0.75, 'rgba(18,1,3,0.25)');
    cg.addColorStop(1,    'rgba(0,0,0,0)');
  } else {
    cg.addColorStop(0,    'rgba(6,10,60,0.85)');
    cg.addColorStop(0.4,  'rgba(3,6,35,0.55)');
    cg.addColorStop(0.75, 'rgba(1,2,15,0.25)');
    cg.addColorStop(1,    'rgba(0,0,0,0)');
  }
  c.fillStyle = cg; c.fillRect(0, 0, W, H);
  const tg = c.createLinearGradient(0, 0, 0, H*0.45);
  tg.addColorStop(0,   isChallenge ? 'rgba(160,30,0,0.22)' : 'rgba(0,60,120,0.22)');
  tg.addColorStop(0.5, isChallenge ? 'rgba(80,10,0,0.08)'  : 'rgba(0,30,70,0.08)');
  tg.addColorStop(1,   'rgba(0,0,0,0)');
  c.fillStyle = tg; c.fillRect(0, 0, W, H);
  const bg = c.createLinearGradient(0, H*0.6, 0, H);
  bg.addColorStop(0, 'rgba(0,0,0,0)');
  bg.addColorStop(1, 'rgba(0,0,0,0.45)');
  c.fillStyle = bg; c.fillRect(0, 0, W, H);
  return oc;
}

export function initStars() {
  _bgGradCache = null; _bgGradCtx = null;
  _chGradCache = null; _chGradCtx = null;
  _lpBgCache   = null; _lpChBgCache = null;
  _bgFrameCount = 0;
  stars = [];
  const numStars = S.isMobile ? 80 : 150;
  for (let i = 0; i < numStars; i++) stars.push({
    x: Math.random() * bgc.width, y: Math.random() * bgc.height,
    r: Math.random() * 1.5 + 0.2,  speed: Math.random() * 0.3 + 0.05,
    vx: Math.random() * 0.18 + 0.06
  });
  const w = bgc.width, h = bgc.height;
  nebulae = [
    { x: w*0.25, y: h*0.3,  r: Math.min(w,h)*0.45, vx:  0.15, vy:  0.08, hue: 190 },
    { x: w*0.75, y: h*0.6,  r: Math.min(w,h)*0.55, vx: -0.1,  vy: -0.12, hue: 280 },
    { x: w*0.5,  y: h*0.45, r: Math.min(w,h)*0.35, vx:  0.07, vy: -0.07, hue: 330 },
  ];
}

export function drawBackground() {
  bgHue = (bgHue + 0.05) % 360;
  if (S.lowPerfMode) {
    if (S.isDailyMode) {
      if (!_lpChBgCache || _lpChBgCache.width !== bgc.width) _lpChBgCache = _buildLowPerfBg(bgc.width, bgc.height, true);
      bgx.drawImage(_lpChBgCache, 0, 0);
    } else {
      if (!_lpBgCache || _lpBgCache.width !== bgc.width) _lpBgCache = _buildLowPerfBg(bgc.width, bgc.height, false);
      bgx.drawImage(_lpBgCache, 0, 0);
    }
    return;
  }
  _bgFrameCount++;
  if (S.isDailyMode) { _drawChallengeBg(); return; }

  bgx.fillStyle = 'rgba(0,0,8,0.18)'; bgx.fillRect(0, 0, bgc.width, bgc.height);

  for (const neb of nebulae) {
    neb.x += neb.vx; neb.y += neb.vy;
    if (neb.x - neb.r < 0 || neb.x + neb.r > bgc.width)  neb.vx *= -1;
    if (neb.y - neb.r < 0 || neb.y + neb.r > bgc.height) neb.vy *= -1;
    neb.hue = (neb.hue + 0.02) % 360;
  }

  if (_bgFrameCount % BG_GRAD_INTERVAL === 0) {
    if (!_bgGradCache || _bgGradCache.width !== bgc.width || _bgGradCache.height !== bgc.height) {
      _bgGradCache = document.createElement('canvas');
      _bgGradCache.width = bgc.width; _bgGradCache.height = bgc.height;
      _bgGradCtx = _bgGradCache.getContext('2d');
    }
    const gc2 = _bgGradCtx;
    gc2.clearRect(0, 0, bgc.width, bgc.height);
    for (const neb of nebulae) {
      const gr = gc2.createRadialGradient(neb.x, neb.y, 0, neb.x, neb.y, neb.r);
      gr.addColorStop(0,   `hsla(${neb.hue},85%,25%,0.045)`);
      gr.addColorStop(0.5, `hsla(${(neb.hue+40)%360},80%,15%,0.02)`);
      gr.addColorStop(1,   'transparent');
      gc2.fillStyle = gr;
      const nbx = Math.max(0, neb.x - neb.r), nby = Math.max(0, neb.y - neb.r);
      gc2.fillRect(nbx, nby, Math.min(bgc.width, neb.x+neb.r)-nbx, Math.min(bgc.height, neb.y+neb.r)-nby);
    }
    const gr2 = gc2.createRadialGradient(bgc.width/2, bgc.height/2, 0, bgc.width/2, bgc.height/2, bgc.width*0.7);
    gr2.addColorStop(0,   `hsla(${bgHue},80%,10%,0.02)`);
    gr2.addColorStop(0.5, `hsla(${(bgHue+60)%360},80%,5%,0.015)`);
    gr2.addColorStop(1,   'transparent');
    gc2.fillStyle = gr2; gc2.fillRect(0, 0, bgc.width, bgc.height);
  }
  if (_bgGradCache) bgx.drawImage(_bgGradCache, 0, 0);

  bgx.fillStyle = 'rgba(180,220,255,0.5)';
  bgx.beginPath();
  for (const s of stars) {
    s.y += s.speed; if (s.y > bgc.height) { s.y = 0; s.x = Math.random() * bgc.width; }
    bgx.moveTo(s.x + s.r, s.y); bgx.arc(s.x, s.y, s.r, 0, Math.PI*2);
  }
  bgx.fill();
}

function _drawChallengeBg() {
  _cBgPulse = (_cBgPulse + 0.022) % (Math.PI*2);
  const W = bgc.width, H = bgc.height;

  bgx.fillStyle = 'rgba(10,0,3,0.22)';
  bgx.fillRect(0, 0, W, H);

  for (const neb of nebulae) {
    neb.x += neb.vx*1.7; neb.y += neb.vy*1.7;
    if (neb.x - neb.r < 0 || neb.x + neb.r > W) neb.vx *= -1;
    if (neb.y - neb.r < 0 || neb.y + neb.r > H) neb.vy *= -1;
    neb.hue = (neb.hue + 0.06) % 55;
  }
  for (const s of stars) {
    s.y += s.speed*2.8; s.x += s.vx*2.8;
    if (s.y > H || s.x > W) { s.y = Math.random()*H*0.4; s.x = Math.random()*W*0.6; }
  }

  if (_bgFrameCount % BG_GRAD_INTERVAL === 0) {
    if (!_chGradCache || _chGradCache.width !== W || _chGradCache.height !== H) {
      _chGradCache = document.createElement('canvas');
      _chGradCache.width = W; _chGradCache.height = H;
      _chGradCtx = _chGradCache.getContext('2d');
    }
    const gc2 = _chGradCtx;
    gc2.clearRect(0, 0, W, H);

    for (const neb of nebulae) {
      const gr = gc2.createRadialGradient(neb.x, neb.y, 0, neb.x, neb.y, neb.r);
      gr.addColorStop(0,   `hsla(${neb.hue},100%,28%,0.07)`);
      gr.addColorStop(0.5, `hsla(${(neb.hue+18)%55},90%,16%,0.03)`);
      gr.addColorStop(1,   'transparent');
      gc2.fillStyle = gr;
      const nx = Math.max(0, neb.x-neb.r), ny = Math.max(0, neb.y-neb.r);
      gc2.fillRect(nx, ny, Math.min(W, neb.x+neb.r)-nx, Math.min(H, neb.y+neb.r)-ny);
    }

    for (const s of stars) {
      const tLen = s.speed * 22;
      const tg = gc2.createLinearGradient(s.x-s.vx*22, s.y-tLen, s.x, s.y);
      tg.addColorStop(0, 'transparent');
      tg.addColorStop(1, `rgba(255,${80+s.r*40|0},0,${s.r*0.22})`);
      gc2.strokeStyle = tg; gc2.lineWidth = s.r*0.9;
      gc2.beginPath(); gc2.moveTo(s.x-s.vx*22, s.y-tLen); gc2.lineTo(s.x, s.y); gc2.stroke();
    }

    const coreY = H*0.82;
    const pulse = 0.5 + Math.sin(_cBgPulse)*0.5;
    const cg2 = gc2.createRadialGradient(W/2, coreY, 0, W/2, coreY, W*0.55);
    cg2.addColorStop(0,   `rgba(220,80,0,${0.04*pulse})`);
    cg2.addColorStop(0.4, `rgba(160,20,0,${0.025*pulse})`);
    cg2.addColorStop(1,   'transparent');
    gc2.fillStyle = cg2; gc2.fillRect(0, 0, W, H);

    const vA = 0.07 + Math.sin(_cBgPulse)*0.02;
    const vc = `rgba(160,0,10,${vA})`;
    const vTop = gc2.createLinearGradient(0,0,0,H*0.14);
    vTop.addColorStop(0, vc); vTop.addColorStop(1, 'transparent');
    gc2.fillStyle = vTop; gc2.fillRect(0, 0, W, H*0.14);
    const vBot = gc2.createLinearGradient(0,H,0,H*0.86);
    vBot.addColorStop(0, vc); vBot.addColorStop(1, 'transparent');
    gc2.fillStyle = vBot; gc2.fillRect(0, H*0.86, W, H*0.14);
    const vLft = gc2.createLinearGradient(0,0,W*0.10,0);
    vLft.addColorStop(0, vc); vLft.addColorStop(1, 'transparent');
    gc2.fillStyle = vLft; gc2.fillRect(0, 0, W*0.10, H);
    const vRgt = gc2.createLinearGradient(W,0,W*0.90,0);
    vRgt.addColorStop(0, vc); vRgt.addColorStop(1, 'transparent');
    gc2.fillStyle = vRgt; gc2.fillRect(W*0.90, 0, W*0.10, H);
  }
  if (_chGradCache) bgx.drawImage(_chGradCache, 0, 0);
}

// ─── Drawing helpers ──────────────────────────────────────────────────────────
function hexToRgb(hex) {
  if (_rgbCache.has(hex)) return _rgbCache.get(hex);
  const v = { r: parseInt(hex.slice(1,3),16), g: parseInt(hex.slice(3,5),16), b: parseInt(hex.slice(5,7),16) };
  _rgbCache.set(hex, v); return v;
}

export function getCellSprite(color) {
  if (_cellSprites[color]) return _cellSprites[color];
  const PAD = 14, s = S.CELL, p = PAD;
  const sc = document.createElement('canvas');
  sc.width = sc.height = s + PAD*2;
  const sx = sc.getContext('2d');
  const {r,g,b} = hexToRgb(color);

  sx.shadowColor = `rgba(${r},${g},${b},0.8)`;
  sx.shadowBlur  = 12;

  const gr = sx.createLinearGradient(p,p,p+s,p+s);
  gr.addColorStop(0,    `rgba(${Math.min(255,r+40)},${Math.min(255,g+40)},${Math.min(255,b+40)},0.96)`);
  gr.addColorStop(0.55, `rgba(${r},${g},${b},0.90)`);
  gr.addColorStop(1,    `rgba(${Math.max(0,r-35)},${Math.max(0,g-35)},${Math.max(0,b-35)},0.94)`);
  sx.fillStyle = gr; sx.fillRect(p+1, p+1, s-2, s-2);
  sx.shadowBlur = 0;

  const sh = sx.createLinearGradient(p,p,p+s*0.62,p+s*0.62);
  sh.addColorStop(0,   'rgba(255,255,255,0.32)');
  sh.addColorStop(0.5, 'rgba(255,255,255,0.06)');
  sh.addColorStop(1,   'rgba(255,255,255,0)');
  sx.fillStyle = sh; sx.fillRect(p+2, p+2, s-4, s-4);

  sx.strokeStyle = `rgba(${Math.min(255,r+90)},${Math.min(255,g+90)},${Math.min(255,b+90)},0.4)`;
  sx.lineWidth = 1; sx.lineCap = 'round';
  sx.beginPath(); sx.moveTo(p+2,p+s-2); sx.lineTo(p+2,p+2); sx.lineTo(p+s-2,p+2); sx.stroke();

  sx.strokeStyle = `rgba(${Math.min(255,r+55)},${Math.min(255,g+55)},${Math.min(255,b+55)},0.5)`;
  sx.lineWidth = 1; sx.strokeRect(p+1.5, p+1.5, s-3, s-3);

  _cellSprites[color] = { canvas: sc, pad: PAD };
  return _cellSprites[color];
}

function invalidateCellSprites() { _cellSprites = {}; }

function drawCBPattern(ctx, px, py, cs, key) {
  ctx.save();
  ctx.globalAlpha = 0.62;
  ctx.strokeStyle = 'rgba(255,255,255,0.85)';
  ctx.lineWidth   = Math.max(1, cs*0.09);
  ctx.lineCap     = 'round';
  const m = cs*0.2, x1 = px+m, y1 = py+m, x2 = px+cs-m, y2 = py+cs-m;
  const mx = px+cs*0.5, my = py+cs*0.5;
  ctx.beginPath();
  switch (key) {
    case 'I': ctx.moveTo(x1,my-cs*0.14); ctx.lineTo(x2,my-cs*0.14); ctx.moveTo(x1,my+cs*0.14); ctx.lineTo(x2,my+cs*0.14); break;
    case 'O': ctx.arc(mx, my, cs*0.26, 0, Math.PI*2); break;
    case 'T': ctx.moveTo(mx,y1); ctx.lineTo(x2,y2); ctx.lineTo(x1,y2); ctx.closePath(); break;
    case 'S': ctx.moveTo(x2,y1); ctx.lineTo(x1,y2); break;
    case 'Z': ctx.moveTo(x1,y1); ctx.lineTo(x2,y2); break;
    case 'J': ctx.moveTo(mx-cs*0.14,y1); ctx.lineTo(mx-cs*0.14,y2); ctx.moveTo(mx+cs*0.14,y1); ctx.lineTo(mx+cs*0.14,y2); break;
    case 'L': ctx.moveTo(x1,y1); ctx.lineTo(x2,y2); ctx.moveTo(x2,y1); ctx.lineTo(x1,y2); break;
  }
  ctx.stroke();
  ctx.restore();
}

function drawCell(ctx, x, y, color, alpha=1, glow=1, key=null) {
  const s = S.CELL, px = x*s, py = y*s;
  const sp = getCellSprite(color);
  ctx.save(); ctx.globalAlpha = alpha;
  if (glow > 1.2 && !S.lowPerfMode) { ctx.shadowColor = color; ctx.shadowBlur = 9; }
  ctx.drawImage(sp.canvas, px-sp.pad, py-sp.pad);
  ctx.shadowBlur = 0;
  ctx.restore();
  if (S.colorblindMode && key) drawCBPattern(ctx, px, py, s, key);
}

export function drawBoard() {
  const W = COLS*S.CELL, H = ROWS*S.CELL;
  gctx.clearRect(0, 0, W, H);
  gctx.fillStyle = 'rgba(0,0,15,0.88)'; gctx.fillRect(0, 0, W, H);
  const gridGlow = 0.05 + 0.03*Math.sin(Date.now()/400);
  gctx.save();
  gctx.strokeStyle = `rgba(0,200,255,${gridGlow})`; gctx.lineWidth = 1;
  gctx.beginPath();
  for (let r = 0; r <= ROWS; r++) { gctx.moveTo(0, r*S.CELL); gctx.lineTo(W, r*S.CELL); }
  for (let c = 0; c <= COLS; c++) { gctx.moveTo(c*S.CELL, 0); gctx.lineTo(c*S.CELL, H); }
  gctx.stroke();
  gctx.fillStyle = `rgba(0,255,255,${gridGlow*3})`;
  for (let r = 1; r < ROWS; r++) for (let c = 1; c < COLS; c++) gctx.fillRect(c*S.CELL-0.5, r*S.CELL-0.5, 1, 1);
  gctx.restore();

  for (let r = 0; r < ROWS; r++) for (let c = 0; c < COLS; c++) {
    if (!S.board[r][c]) continue;
    if (S.flashLines.has(r)) {
      const t = 1 - S.flashTimer/12;
      gctx.save(); gctx.globalAlpha = 0.5 + 0.5*Math.sin(t*Math.PI*4);
      gctx.fillStyle = '#fff';
      if (!S.lowPerfMode) { gctx.shadowColor = '#fff'; gctx.shadowBlur = 28; }
      gctx.fillRect(c*S.CELL+1, r*S.CELL+1, S.CELL-2, S.CELL-2); gctx.restore();
    } else {
      drawCell(gctx, c, r, S.board[r][c], 1, 1, S.colorblindMode ? COLOR_TO_KEY[S.board[r][c]] : null);
    }
  }

  if (S.gameRunning && !S.gamePaused && S.current) {
    const ghostY = _getGhostY();
    if (S.ghostVisible && ghostY !== S.current.y) {
      const {r,g,b} = hexToRgb(S.current.color);
      for (let row = 0; row < S.current.shape.length; row++) for (let col = 0; col < S.current.shape[row].length; col++) {
        if (!S.current.shape[row][col]) continue;
        gctx.save();
        gctx.shadowBlur = 0;
        gctx.strokeStyle = `rgba(${r},${g},${b},0.32)`; gctx.lineWidth = 1.5;
        gctx.strokeRect((S.current.x+col)*S.CELL+2, (ghostY+row)*S.CELL+2, S.CELL-4, S.CELL-4);
        gctx.fillStyle = `rgba(${r},${g},${b},0.06)`;
        gctx.fillRect((S.current.x+col)*S.CELL+2, (ghostY+row)*S.CELL+2, S.CELL-4, S.CELL-4);
        gctx.restore();
      }
      let minCol = COLS, maxCol = -1;
      for (let row = 0; row < S.current.shape.length; row++) {
        for (let col = 0; col < S.current.shape[row].length; col++) {
          if (S.current.shape[row][col]) { if (col < minCol) minCol = col; if (col > maxCol) maxCol = col; }
        }
      }
      gctx.save();
      gctx.strokeStyle = `rgba(${r},${g},${b},0.09)`; gctx.lineWidth = 1;
      gctx.setLineDash([4,4]);
      const lx = (S.current.x + minCol) * S.CELL;
      gctx.beginPath(); gctx.moveTo(lx, (S.current.y+S.current.shape.length)*S.CELL); gctx.lineTo(lx, ghostY*S.CELL); gctx.stroke();
      const rx = (S.current.x + maxCol + 1) * S.CELL;
      gctx.beginPath(); gctx.moveTo(rx, (S.current.y+S.current.shape.length)*S.CELL); gctx.lineTo(rx, ghostY*S.CELL); gctx.stroke();
      gctx.restore();
    }

    if (S.lockActive && S.lockTimer > 0) {
      const pct = S.lockTimer / S.lockMs;
      const {r,g,b} = hexToRgb(S.current.color);
      for (let row = 0; row < S.current.shape.length; row++) for (let col = 0; col < S.current.shape[row].length; col++) {
        if (!S.current.shape[row][col]) continue;
        gctx.save(); gctx.fillStyle = `rgba(${r},${g},${b},${0.18*pct})`;
        gctx.fillRect((S.current.x+col)*S.CELL+1, (S.current.y+row)*S.CELL+1, S.CELL-2, S.CELL-2); gctx.restore();
      }
      const bY = (S.current.y + S.current.shape.length)*S.CELL - 3;
      gctx.save();
      gctx.fillStyle = `rgba(${r},${g},${b},0.75)`;
      if (!S.lowPerfMode) { gctx.shadowColor = S.current.color; gctx.shadowBlur = 5; }
      gctx.fillRect(S.current.x*S.CELL, bY, S.current.shape[0].length*S.CELL*pct, 3);
      gctx.restore();
    }

    for (let row = 0; row < S.current.shape.length; row++) for (let col = 0; col < S.current.shape[row].length; col++) {
      if (S.current.shape[row][col]) drawCell(gctx, S.current.x+col, S.current.y+row, S.current.color, 1, 1.5, S.colorblindMode ? S.current.key : null);
    }

    if (_lastBorderColor !== S.current.color) {
      _lastBorderColor = S.current.color;
      const {r,g,b} = hexToRgb(S.current.color);
      gc.style.borderColor = `rgba(${r},${g},${b},0.6)`;
      gc.style.boxShadow   = S.lowPerfMode ? 'none' : `0 0 25px rgba(${r},${g},${b},0.35), 0 0 60px rgba(${r},${g},${b},0.15)`;
    }
  } else {
    if (_lastBorderColor !== null) {
      _lastBorderColor = null;
      gc.style.borderColor = 'rgba(0,200,255,0.35)';
      gc.style.boxShadow   = S.lowPerfMode ? 'none' : '0 0 36px rgba(0,200,255,0.25), 0 0 70px rgba(0,100,255,0.12)';
    }
  }

  if (S.flashTimer > 0) S.flashTimer--;

  if (S.comboFlash > 0 && !S.lowPerfMode) {
    gctx.save(); gctx.globalAlpha = (S.comboFlash/15)*0.28;
    gctx.fillStyle = S.comboFlashColor; gctx.fillRect(0, 0, COLS*S.CELL, ROWS*S.CELL); gctx.restore();
    S.comboFlash--;
  } else if (S.lowPerfMode) { S.comboFlash = 0; }

  if (S.rainbowBorder > 0 && !S.lowPerfMode) {
    const hue = (Date.now()/4) % 360;
    const a   = (S.rainbowBorder/45)*0.9;
    gctx.save(); gctx.globalAlpha = a;
    gctx.strokeStyle = `hsl(${hue},100%,65%)`;
    gctx.shadowColor = `hsl(${hue},100%,65%)`; gctx.shadowBlur = 24;
    gctx.lineWidth = 5; gctx.strokeRect(3, 3, COLS*S.CELL-6, ROWS*S.CELL-6); gctx.restore();
    S.rainbowBorder--;
  } else if (S.lowPerfMode) { S.rainbowBorder = 0; }

  if (S.gameRunning && !S.gamePaused && !S.lowPerfMode) {
    let topRow = ROWS;
    for (let r = 0; r < ROWS; r++) { if (S.board[r].some(v => v !== null)) { topRow = r; break; } }
    const dangerThreshold = Math.floor(ROWS*0.25);
    if (topRow < dangerThreshold) {
      S.dangerPulse++;
      const speed     = 0.06 + ((dangerThreshold-topRow)/dangerThreshold)*0.1;
      const intensity = (dangerThreshold-topRow)/dangerThreshold;
      const alpha     = (0.12+intensity*0.18)*(0.5+0.5*Math.sin(S.dangerPulse*speed));
      gctx.save(); gctx.globalAlpha = alpha;
      gctx.fillStyle = '#ff1133'; gctx.fillRect(0, 0, COLS*S.CELL, ROWS*S.CELL);
      const vg = gctx.createRadialGradient(COLS*S.CELL/2, ROWS*S.CELL/2, ROWS*S.CELL*0.3, COLS*S.CELL/2, ROWS*S.CELL/2, ROWS*S.CELL*0.75);
      vg.addColorStop(0, 'rgba(0,0,0,0)');
      vg.addColorStop(1, `rgba(255,0,30,${0.3+intensity*0.35})`);
      gctx.globalAlpha = 1; gctx.fillStyle = vg; gctx.fillRect(0, 0, COLS*S.CELL, ROWS*S.CELL);
      gctx.restore();
    } else { S.dangerPulse = 0; }
  } else if (S.lowPerfMode) { S.dangerPulse = 0; }

  if (S.levelUpScanline > 0 && !S.lowPerfMode) {
    const y = S.levelUpScanline * gc.height;
    gctx.save();
    const gr3 = gctx.createLinearGradient(0, y-20, 0, y+20);
    gr3.addColorStop(0, 'rgba(0,200,255,0)'); gr3.addColorStop(0.5, 'rgba(0,200,255,0.9)'); gr3.addColorStop(1, 'rgba(0,200,255,0)');
    gctx.fillStyle = gr3; gctx.shadowColor = '#00c8ff'; gctx.shadowBlur = 24;
    gctx.fillRect(0, y-10, gc.width, 20); gctx.restore();
    S.levelUpScanline += 0.022;
    if (S.levelUpScanline >= 1.0) S.levelUpScanline = 0;
  } else if (S.lowPerfMode) { S.levelUpScanline = 0; }

  // ── Countdown overlay ────────────────────────────────────────────────────
  if (S._countdownVal > 0 || S._countdownGo > 0) {
    const W2 = COLS*S.CELL, H2 = ROWS*S.CELL, cx = W2/2, cy = H2/2;
    const isGo = S._countdownGo > 0;
    const CDCOLORS = { 3: '#ff3355', 2: '#ffaa00', 1: '#00c8ff' };
    const color = isGo ? '#00ff88' : (CDCOLORS[S._countdownVal] || '#00c8ff');
    const frac  = isGo
      ? 1 - S._countdownGo/55
      : Math.min(1, (performance.now() - S._countdownTs)/1000);
    const scale = isGo
      ? (1 + 0.4*(1-frac))
      : Math.max(0.9, 1.7-frac*0.8);
    const alpha = isGo
      ? Math.max(0, 1-(frac-0.6)/0.4)
      : (frac < 0.75 ? 1 : Math.max(0, 1-(frac-0.75)/0.25));

    if (S._countdownVal > 0) {
      const dimA = Math.min(0.6, 0.6*(frac<0.8 ? 1 : (1-(frac-0.8)/0.2)));
      gctx.save(); gctx.globalAlpha = dimA;
      gctx.fillStyle = 'rgba(0,0,8,1)'; gctx.fillRect(0, 0, W2, H2); gctx.restore();
    }
    if (!isGo) {
      const ringR = Math.min(cy*0.8, 30+frac*cy*0.9);
      const ringA = Math.max(0, 0.9-frac*0.9);
      gctx.save(); gctx.globalAlpha = ringA;
      gctx.strokeStyle = color; gctx.shadowColor = color; gctx.shadowBlur = 18;
      gctx.lineWidth = 2.5;
      gctx.beginPath(); gctx.arc(cx, cy, ringR, 0, Math.PI*2); gctx.stroke();
      const ringR2 = Math.min(cy*0.85, 10+frac*cy*1.1);
      gctx.globalAlpha = Math.max(0, 0.5-frac*0.5); gctx.lineWidth = 1.5;
      gctx.beginPath(); gctx.arc(cx, cy, ringR2, 0, Math.PI*2); gctx.stroke();
      gctx.shadowBlur = 0; gctx.restore();
    }
    if (!isGo && frac < 0.06) {
      gctx.save(); gctx.globalAlpha = (1-frac/0.06)*0.18;
      gctx.fillStyle = color; gctx.fillRect(0, 0, W2, H2); gctx.restore();
    }
    const text     = isGo ? 'GO!' : String(S._countdownVal);
    const fontSize = Math.floor(W2*(isGo ? 0.44 : 0.54));
    gctx.save();
    gctx.globalAlpha = alpha;
    gctx.translate(cx, cy); gctx.scale(scale, scale); gctx.translate(-cx, -cy);
    gctx.font = `900 ${fontSize}px Orbitron,monospace`;
    gctx.textAlign = 'center'; gctx.textBaseline = 'middle';
    gctx.fillStyle = color; gctx.shadowColor = color; gctx.shadowBlur = 80;
    gctx.fillText(text, cx, cy);
    gctx.shadowBlur = 30; gctx.fillStyle = '#ffffff'; gctx.globalAlpha = alpha*0.45;
    gctx.fillText(text, cx, cy);
    gctx.shadowBlur = 0; gctx.restore();
    if (S._countdownGo > 0) S._countdownGo--;
  }
}

// Ghost Y is needed by drawBoard but the board/current are in S.
// Extracted so game.js can also call it if needed (e.g. in hardDrop).
export function _getGhostY() {
  let d = 0;
  while (_validPos(S.current, 0, d+1)) d++;
  return S.current.y + d;
}
// Internal validPos used only by _getGhostY (game.js exports its own version)
function _validPos(piece, ox=0, oy=0, shape=null) {
  const s = shape || piece.shape;
  for (let r = 0; r < s.length; r++) for (let c = 0; c < s[r].length; c++) {
    if (!s[r][c]) continue;
    const nx = piece.x+c+ox, ny = piece.y+r+oy;
    if (nx < 0 || nx >= COLS || ny >= ROWS) return false;
    if (ny >= 0 && S.board[ny][nx]) return false;
  }
  return true;
}

function drawMiniPiece(ctx, piece, cw, ch) {
  ctx.clearRect(0, 0, cw, ch);
  ctx.fillStyle = 'rgba(0,0,15,0.55)'; ctx.fillRect(0, 0, cw, ch);
  if (!piece) return;
  const s  = piece.shape;
  const cs = S.isMobile ? Math.max(7, Math.floor(Math.min(cw/4, ch/3))) : 18;
  const ox = Math.floor((cw - s[0].length*cs)/2);
  const oy = Math.floor((ch - s.length*cs)/2);
  const {r,g,b} = hexToRgb(piece.color);
  for (let row = 0; row < s.length; row++) for (let col = 0; col < s[row].length; col++) {
    if (!s[row][col]) continue;
    ctx.save(); ctx.shadowColor = piece.color; ctx.shadowBlur = 8;
    const gr = ctx.createLinearGradient(ox+col*cs, oy+row*cs, ox+col*cs+cs, oy+row*cs+cs);
    gr.addColorStop(0, `rgba(${r},${g},${b},0.95)`);
    gr.addColorStop(1, `rgba(${Math.max(0,r-35)},${Math.max(0,g-35)},${Math.max(0,b-35)},0.95)`);
    ctx.fillStyle = gr; ctx.fillRect(ox+col*cs+1, oy+row*cs+1, cs-2, cs-2);
    ctx.strokeStyle = `rgba(${Math.min(255,r+70)},${Math.min(255,g+70)},${Math.min(255,b+70)},0.5)`;
    ctx.lineWidth = 1; ctx.strokeRect(ox+col*cs+1.5, oy+row*cs+1.5, cs-3, cs-3);
    ctx.restore();
    if (S.colorblindMode && piece.key) drawCBPattern(ctx, ox+col*cs, oy+row*cs, cs, piece.key);
  }
}

export function drawNext() {
  drawMiniPiece(ncDx, S.next, ncD.width, ncD.height);
  drawMiniPiece(ncMx, S.next, ncM.width, ncM.height);
}
export function drawHold() {
  drawMiniPiece(hcDx, S.held, hcD.width, hcD.height);
  drawMiniPiece(hcMx, S.held, hcM.width, hcM.height);
}

// ─── Particles ────────────────────────────────────────────────────────────────
export function spawnLineClearParticles(rows) {
  if (S.animIntensity === 'off') return;
  if (S.particles.length >= MAX_PARTICLES) return;
  for (const row of rows) {
    S.particles.push({x:(COLS/2)*S.CELL,y:(row+0.5)*S.CELL,vx:0,vy:0,life:1,decay:0.04,color:'#ffffff',size:3,maxRadius:(COLS/2)*S.CELL*1.5,type:'radial-ring'});
    S.particles.push({x:(COLS/2)*S.CELL,y:(row+0.5)*S.CELL,vx:0,vy:0,life:1,decay:0.03,color:'#00c8ff',size:5,maxRadius:(COLS/2)*S.CELL*2.3,type:'radial-ring'});
    const sparkCount = S.lowPerfMode ? 2 : (S.isMobile ? 2 : 4);
    for (let c = 0; c < COLS; c++) for (let i = 0; i < sparkCount; i++) {
      const a = Math.random()*Math.PI*2, sp = Math.random()*5+2;
      S.particles.push({x:(c+.5)*S.CELL,y:(row+.5)*S.CELL,vx:Math.cos(a)*sp,vy:Math.sin(a)*sp-3,life:1,decay:Math.random()*.02+.015,color:'#00c8ff',size:Math.random()*4+2,type:'spark'});
    }
  }
  const starCount = S.lowPerfMode ? 10 : (S.isMobile ? 12 : 25);
  for (let i = 0; i < starCount; i++) {
    const a = Math.random()*Math.PI*2, sp = Math.random()*8+3;
    S.particles.push({x:COLS/2*S.CELL,y:(rows[0]+.5)*S.CELL,vx:Math.cos(a)*sp,vy:Math.sin(a)*sp,life:1,decay:Math.random()*.015+.008,color:PAL[Math.floor(Math.random()*5)],size:Math.random()*6+3,type:'star'});
  }
}

export function spawnLockParticles(current) {
  if (!current || S.animIntensity === 'off') return;
  const pCount = S.lowPerfMode ? 1 : (S.isMobile ? 1 : 2);
  if (pCount === 0) return;
  for (let r = 0; r < current.shape.length; r++) for (let c = 0; c < current.shape[r].length; c++) {
    if (!current.shape[r][c]) continue;
    for (let i = 0; i < pCount; i++)
      S.particles.push({x:(current.x+c+.5)*S.CELL,y:(current.y+r+.5)*S.CELL,vx:(Math.random()-.5)*4,vy:Math.random()*-4-1.5,life:1,decay:.04,color:current.color,size:Math.random()*3+1.5,type:'spark'});
  }
}

export function spawnFloatingText(txt, x, y, color, size) {
  S.particles.push({ text: txt, x, y, vx: 0, vy: -0.6, life: 1, decay: 0.02, color, size, type: 'text' });
}

export function spawnDropTrail(current) {
  if (!current || S.lowPerfMode || S.animIntensity !== 'full') return;
  const w = current.shape[0].length;
  const cx = (current.x + Math.random()*w) * S.CELL;
  const cy = current.y * S.CELL;
  S.particles.push({ x:cx, y:cy, vx:(Math.random()-.5)*0.4, vy:-0.3-Math.random()*0.3, life:1, decay:0.08, color:current.color, size:Math.random()*1.5+0.6, type:'spark' });
}

export function updateParticles() {
  pctx.clearRect(0, 0, pc.width, pc.height);
  S.particles = S.particles.filter(p => p.life > 0);
  for (const p of S.particles) {
    if (p.type === 'text') {
      p.x += p.vx; p.y += p.vy; p.life -= p.decay;
      pctx.save(); pctx.globalAlpha = Math.max(0, p.life);
      pctx.font = `900 ${p.size}px Orbitron, monospace`;
      pctx.textAlign = 'center';
      if (!S.lowPerfMode) { pctx.shadowColor = p.color; pctx.shadowBlur = 12; }
      pctx.fillStyle = p.color; pctx.fillText(p.text, p.x, p.y); pctx.restore();
      continue;
    }
    if (p.type === 'ring' || p.type === 'radial-ring') {
      if (S.lowPerfMode) { p.life -= p.decay; continue; }
      p.life -= p.decay;
      pctx.save(); pctx.globalAlpha = Math.max(0, p.life);
      pctx.strokeStyle = p.color; pctx.lineWidth = p.size*p.life;
      if (!S.lowPerfMode) { pctx.shadowColor = p.color; pctx.shadowBlur = 15; }
      pctx.beginPath();
      const rx = (1-p.life)*p.maxRadius;
      if (p.type === 'ring') pctx.ellipse(p.x, p.y, rx, rx*(p.aspectRatio||0.35), 0, 0, Math.PI*2);
      else pctx.arc(p.x, p.y, rx, 0, Math.PI*2);
      pctx.stroke(); pctx.restore();
      continue;
    }
    p.vx *= 0.94; p.vy += 0.15;
    p.x += p.vx; p.y += p.vy; p.life -= p.decay;
    pctx.save(); pctx.globalAlpha = Math.max(0, p.life);
    const {r,g,b} = hexToRgb(p.color);
    if (p.type === 'star') {
      pctx.fillStyle = p.color; pctx.beginPath();
      const spikes = 4, outer = p.size, inner = p.size*.4;
      for (let i = 0; i < spikes*2; i++) {
        const a = (i*Math.PI/spikes)-Math.PI/2, rad = i%2===0 ? outer : inner;
        if (i === 0) pctx.moveTo(p.x+Math.cos(a)*rad, p.y+Math.sin(a)*rad);
        else pctx.lineTo(p.x+Math.cos(a)*rad, p.y+Math.sin(a)*rad);
      }
      pctx.closePath(); pctx.fill();
    } else {
      pctx.beginPath();
      pctx.moveTo(p.x-p.vx*1.5, p.y-p.vy*1.5); pctx.lineTo(p.x, p.y);
      pctx.strokeStyle = `rgb(${r},${g},${b})`;
      pctx.lineWidth = Math.max(.1, p.size*p.life); pctx.lineCap = 'round';
      pctx.stroke();
    }
    pctx.restore();
  }
}

export function spawnHardDropParticles(current) {
  if (S.animIntensity === 'off') return;
  if (S.particles.length >= MAX_PARTICLES) return;
  const col = current.color;
  const w   = current.shape[0].length;
  const cx  = (current.x + w/2) * S.CELL;
  const cy  = (current.y + current.shape.length) * S.CELL;
  const full = S.animIntensity === 'full';

  if (full && !S.lowPerfMode) {
    S.particles.push({x:cx,y:cy,vx:0,vy:0,life:1,decay:0.05,color:'#ffffff',size:5,maxRadius:w*S.CELL*1.0,aspectRatio:0.16,type:'ring'});
    S.particles.push({x:cx,y:cy,vx:0,vy:0,life:1,decay:0.035,color:col,size:3.5,maxRadius:w*S.CELL*1.8,aspectRatio:0.2,type:'ring'});
  }
  const burstCount = full ? (S.isMobile ? 16 : 24) : 10;
  for (let i = 0; i < burstCount; i++) {
    const sp    = Math.random()*13+5;
    const angle = Math.PI + Math.random()*Math.PI;
    S.particles.push({x:cx+(Math.random()-.5)*w*S.CELL*0.9,y:cy,vx:Math.cos(angle)*sp,vy:Math.sin(angle)*sp,life:1,decay:Math.random()*0.022+0.028,color:Math.random()<0.35?'#ffffff':col,size:Math.random()*6+2,type:'spark'});
  }
  const sprayCount = full ? 8 : 0;
  for (let i = 0; i < sprayCount; i++) {
    const dir = Math.random()<0.5 ? 1 : -1;
    S.particles.push({x:cx+(Math.random()-.5)*w*S.CELL*0.7,y:cy,vx:dir*(Math.random()*16+7),vy:-(Math.random()*2.5+0.5),life:1,decay:Math.random()*0.028+0.035,color:Math.random()<0.4?'#ffffff':col,size:Math.random()*3+1,type:'spark'});
  }
  if (full && !S.lowPerfMode) {
    for (let i = 0; i < 5; i++) {
      const a = Math.PI + Math.random()*Math.PI, sp = Math.random()*9+3;
      S.particles.push({x:cx+(Math.random()-.5)*w*S.CELL*0.8,y:cy,vx:Math.cos(a)*sp,vy:Math.sin(a)*sp,life:1,decay:0.022,color:Math.random()<0.5?'#ffffff':col,size:Math.random()*5+3,type:'star'});
    }
  }
}

export function applyShake() {
  if (S.animIntensity !== 'full' || S.lowPerfMode) {
    if (!_nudgeActive) $app.style.transform = '';
    S.shakeFrames = 0; S.shakeAllDir = false; return;
  }
  if (S.shakeFrames > 0) {
    const m = S.shakeFrames * S.shakeMag;
    const x = (Math.random()-.5)*m;
    const y = S.shakeAllDir ? (Math.random()-.5)*m : 0;
    $app.style.transform = `translate(${x}px,${y}px)`;
    S.shakeFrames--;
    if (!S.shakeFrames) { S.shakeMag = 0.4; S.shakeAllDir = false; }
  } else if (!_nudgeActive) {
    $app.style.transform = '';
  }
}

// ─── UI update ────────────────────────────────────────────────────────────────
export function updateUI() {
  if (S.isSprintMode) {
    const remaining = Math.max(0, SPRINT_LINES - S.lines);
    $lines.textContent = remaining; if ($linesM) $linesM.textContent = remaining;
    $level.textContent = S.level;  if ($levelM) $levelM.textContent = S.level;
    const ht = S._sprintHiTime > 0 ? fmtTime(S._sprintHiTime) : '--:--';
    $hiScore.textContent = ht; if ($hiScoreM) $hiScoreM.textContent = ht;
    $levelBar.style.width      = (S.lines / SPRINT_LINES * 100) + '%';
    $levelBar.style.background = 'linear-gradient(90deg,#00ff88,#00c8ff)';
    $bpmEl.textContent = Math.min(200, 135+S.level*5) + ' BPM';
    return;
  }
  const s = S.score.toLocaleString();
  $score.textContent = s; $scoreM.textContent = s;
  $lines.textContent = S.lines; $linesM.textContent = S.lines;
  $level.textContent = S.level; $levelM.textContent = S.level;
  const hi = S.hiScore.toLocaleString();
  $hiScore.textContent = hi; $hiScoreM.textContent = hi;
  const pct = ((S.lines % LEVEL_LINES) / LEVEL_LINES) * 100;
  const hue = (S.level-1)*30;
  $levelBar.style.width      = pct + '%';
  $levelBar.style.background = `linear-gradient(90deg,hsl(${190+hue},100%,50%),hsl(${270+hue},100%,50%))`;
  $bpmEl.textContent = Math.min(200, 135+S.level*5) + ' BPM';
}

export function updateSprintTimer() {
  const elapsed = S._sprintStartTime > 0 ? performance.now() - S._sprintStartTime : 0;
  const fmt = fmtTime(elapsed);
  $score.textContent = fmt; if ($scoreM) $scoreM.textContent = fmt;
}

export function showScorePopup(pts, n, tspin=false) {
  const popup = $scorePopup;
  const tspinLabels = ['T-SPIN!','T-SPIN SINGLE','T-SPIN DOUBLE!!','T-SPIN TRIPLE!!!'];
  const miniLabels  = ['T-SPIN MINI','T-SPIN MINI+','T-SPIN MINI DBL'];
  const labels      = ['','','DOUBLE!','TRIPLE!','GLOWTRIS!!'];
  let txt, color, sz, glow;
  if (n === -1) {
    txt = `✦ ALL CLEAR ✦ +${pts}`; color = '#ffe600'; sz = '22px'; glow = '0 0 32px #ffe600';
  } else if (tspin === 'full') {
    txt = `${tspinLabels[Math.min(n,3)]} +${pts}`; color = '#a000ff'; sz = n>=2 ? '19px' : '14px'; glow = '0 0 24px #a000ff';
  } else if (tspin === 'mini') {
    txt = `${miniLabels[Math.min(n,2)]}${pts>0?' +'+pts:''}`; color = '#7700cc'; sz = '13px'; glow = '0 0 16px #7700cc';
  } else if (n >= 4) {
    txt = `★ GLOWTRIS ★ +${pts}`; color = '#ff0080'; sz = '24px'; glow = '0 0 28px #ff0080';
  } else {
    txt = n>=2 ? `${labels[n]} +${pts}` : `+${pts}`; color = '#fff'; sz = '16px'; glow = '0 0 16px #00c8ff';
  }
  popup.textContent = txt;
  popup.style.cssText = `left:50%;top:50%;transform:translate(-50%,-50%);opacity:1;font-size:${sz};color:${color};text-shadow:${glow};transition:none;position:absolute;pointer-events:none;font-family:Orbitron,monospace;font-weight:900;z-index:20;`;
  requestAnimationFrame(() => { popup.style.transition = 'opacity .9s ease,transform .9s ease'; popup.style.opacity = '0'; popup.style.transform = 'translate(-50%,-130%)'; });
  if (S.combo > 1) { $combo.textContent = `x${S.combo} COMBO`; $combo.style.opacity = '1'; setTimeout(() => $combo.style.opacity = '0', 1400); }
}

// ─── Settings UI ──────────────────────────────────────────────────────────────
export function updateDAS(v) {
  S.das = parseInt(v); localStorage.setItem(LS.DAS, v);
  const el = document.getElementById('ov-das-val'); if (el) el.textContent = v + 'ms';
}
export function updateARR(v) {
  S.arr = parseInt(v); localStorage.setItem(LS.ARR, v);
  const el = document.getElementById('ov-arr-val'); if (el) el.textContent = v + 'ms';
}
export function updateLockDelay(v) {
  S.lockMs = parseInt(v); localStorage.setItem(LS.LOCK, v);
  const el = document.getElementById('ov-lock-val'); if (el) el.textContent = v + 'ms';
}
export function updateGhost() {
  S.ghostVisible = !S.ghostVisible;
  localStorage.setItem(LS.GHOST, S.ghostVisible ? '1' : '0');
  const btn = document.getElementById('ov-ghost-btn');
  if (btn) btn.textContent = S.ghostVisible ? '👻 GHOST ON' : '👻 GHOST OFF';
  btn && btn.classList.toggle('muted', !S.ghostVisible);
}
export function updateColorblind() {
  S.colorblindMode = !S.colorblindMode;
  localStorage.setItem(LS.COLORBLIND, S.colorblindMode ? '1' : '0');
  const btn = document.getElementById('ov-cb-btn');
  if (btn) btn.textContent = S.colorblindMode ? '🔳 CB MODE ON' : '🔳 CB MODE OFF';
  btn && btn.classList.toggle('cb-active', S.colorblindMode);
  btn && btn.classList.toggle('muted', !S.colorblindMode);
  if (S.gameRunning && !S.gamePaused) drawBoard();
}
export function _animLabel() {
  return S.animIntensity === 'full' ? '✨ ANIM: FULL' : S.animIntensity === 'reduced' ? '💫 ANIM: LOW' : '🔲 ANIM: OFF';
}
export function cycleAnimIntensity() {
  S.animIntensity = S.animIntensity === 'full' ? 'reduced' : S.animIntensity === 'reduced' ? 'off' : 'full';
  localStorage.setItem(LS.ANIM, S.animIntensity);
  const btn = document.getElementById('ov-anim-btn');
  if (btn) btn.textContent = _animLabel();
  btn && btn.classList.toggle('muted', S.animIntensity === 'off');
}

// ─── Visual effects ───────────────────────────────────────────────────────────
export function triggerScreenFlash() {
  if (S.animIntensity === 'off' || S.lowPerfMode) return;
  $flash.style.transition = 'none';
  $flash.style.opacity    = '1';
  requestAnimationFrame(() => {
    $flash.style.transition = 'opacity 0.7s ease-out';
    $flash.style.opacity    = '0';
  });
}

export function triggerAllClearFlash() {
  if (!S.lowPerfMode) {
    $flash.style.background = 'rgba(255,230,0,0.55)';
    $flash.style.transition = 'none'; $flash.style.opacity = '1';
    requestAnimationFrame(() => {
      $flash.style.transition = 'opacity 1.2s ease-out'; $flash.style.opacity = '0';
      setTimeout(() => { $flash.style.background = 'rgba(255,255,255,0.65)'; }, 1300);
    });
  }
  if (S.animIntensity !== 'off' && !S.lowPerfMode) { S.rainbowBorder = 90; S.shakeFrames = 30; S.shakeMag = 0.9; }
  [523,659,784,880,1047,1319].forEach((f,i) => playBeep(f,'sawtooth',.22,.35,i*.07));
  if (S.animIntensity === 'full' && S.particles.length < MAX_PARTICLES) {
    for (let i = 0; i < 80; i++) {
      const a = Math.random()*Math.PI*2, sp = Math.random()*12+4;
      S.particles.push({x:COLS/2*S.CELL,y:ROWS/2*S.CELL,vx:Math.cos(a)*sp,vy:Math.sin(a)*sp,life:1,decay:Math.random()*.012+.006,color:['#ffe600','#00c8ff','#ff0080','#00ff88','#a000ff'][Math.floor(Math.random()*5)],size:Math.random()*7+3,type:'star'});
    }
  }
}

export function spawnGoldBurst(x, y) {
  for (let i = 0; i < 30; i++) {
    const p = document.createElement('div');
    p.style.cssText = `position:fixed;left:${x}px;top:${y}px;border-radius:50%;pointer-events:none;z-index:9999;box-shadow:0 0 8px #ffe600`;
    const size = Math.random()*6+4;
    p.style.width = size + 'px'; p.style.height = size + 'px';
    p.style.backgroundColor = Math.random()<0.5 ? '#ffe600' : '#ffaa00';
    const angle = Math.random()*Math.PI*2, speed = Math.random()*100+50;
    const tx = Math.cos(angle)*speed, ty = Math.sin(angle)*speed;
    document.body.appendChild(p);
    p.animate([
      { transform: 'translate(0,0) scale(1)', opacity: 1 },
      { transform: `translate(${tx}px,${ty}px) scale(0)`, opacity: 0 },
    ], { duration: Math.random()*800+400, easing: 'cubic-bezier(0.25,1,0.5,1)', fill: 'forwards' });
    setTimeout(() => p.remove(), 1200);
  }
}

export function showAchievementToast(ach) {
  sfxAchievementUnlock();
  const toast = document.createElement('div');
  toast.className = 'toast';
  toast.innerHTML = `
    <div style="font-size:24px">${ach.icon}</div>
    <div style="display:flex;flex-direction:column;text-align:left;">
      <div style="font-weight:900;color:#ffe600;font-size:8px;letter-spacing:1px;margin-bottom:1px">ACHIEVEMENT UNLOCKED!</div>
      <div style="font-weight:700;font-size:11px;letter-spacing:0.5px;color:#fff">${ach.label}</div>
      <div style="font-size:8px;color:rgba(255,255,255,0.6);margin-top:1px">${ach.description}</div>
    </div>
  `;
  document.body.appendChild(toast);
  toast.offsetHeight;
  toast.classList.add('show');
  setTimeout(() => {
    const rect = toast.getBoundingClientRect();
    spawnGoldBurst(rect.left + rect.width/2, rect.top + rect.height/2);
  }, 100);
  setTimeout(() => { toast.classList.remove('show'); setTimeout(() => toast.remove(), 400); }, 2500);
}

export function unlockAchievement(id) {
  const achieved = _getAchievements();
  const isAlreadyUnlocked = achieved.some(a => (typeof a === 'string' ? a === id : a.id === id));
  if (isAlreadyUnlocked) return;
  const ach = ACHIEVEMENTS.find(a => a.id === id);
  if (!ach) return;
  achieved.push({ id, date: new Date().toLocaleDateString() });
  localStorage.setItem(LS.ACHIEVEMENTS, JSON.stringify(achieved));
  showAchievementToast(ach);
}

export function triggerLevelUpVisuals() {
  if (S.lowPerfMode) return;
  ['level-display','level-display-m','bpm-display'].forEach(id => {
    const el = document.getElementById(id);
    if (el) {
      el.classList.remove('scale-pop-active');
      void el.offsetWidth;
      el.classList.add('scale-pop-active');
      setTimeout(() => el.classList.remove('scale-pop-active'), 600);
    }
  });
  const lvlPCount = S.lowPerfMode ? 25 : 50;
  for (let i = 0; i < lvlPCount; i++) {
    const a = Math.random()*Math.PI*2, sp = Math.random()*11+3;
    S.particles.push({x:(COLS/2)*S.CELL,y:(ROWS/2)*S.CELL,vx:Math.cos(a)*sp,vy:Math.sin(a)*sp,life:1,decay:0.012,color:PAL[Math.floor(Math.random()*5)],size:Math.random()*8+4,type:'star'});
  }
  [261,329,392,523,659,784].forEach((f,i) => playBeep(f,'square',0.16,0.22,i*0.05));
  S.levelUpScanline = 0.01;
}

// ─── GPU detection ────────────────────────────────────────────────────────────
export function _detectLowEndGPU() {
  try {
    const c  = document.createElement('canvas');
    const gl = c.getContext('webgl') || c.getContext('experimental-webgl');
    if (!gl) return false;
    const ext = gl.getExtension('WEBGL_debug_renderer_info');
    const r   = ext ? (gl.getParameter(ext.UNMASKED_RENDERER_WEBGL) || '').toLowerCase() : '';
    try { gl.getExtension('WEBGL_lose_context')?.loseContext(); } catch(e) {}
    if (r.includes('intel') && !r.includes(' xe ')) return true;
    if (r.includes('vega') && !r.includes('rx vega')) return true;
    return false;
  } catch(e) { return false; }
}

// ─── Overlay helpers ──────────────────────────────────────────────────────────
export function openHowToPlay() {
  _htpOpenTs = Date.now();
  document.getElementById('htp-overlay').style.display = 'flex';
}
export function closeHowToPlay() {
  if (Date.now() - _htpOpenTs < 350) return;
  document.getElementById('htp-overlay').style.display = 'none';
}

export function openStats() {
  _statsOpenTs = Date.now();
  document.getElementById('stats-overlay').style.display = 'flex';
  requestAnimationFrame(() => {
    const sGames  = parseInt(localStorage.getItem(LS.TOTAL_GAMES) || '0');
    const sScore  = parseInt(localStorage.getItem(LS.TOTAL_SCORE) || '0');
    const sLevel  = parseInt(localStorage.getItem(LS.BEST_LEVEL)  || '0');
    const sLines  = parseInt(localStorage.getItem(LS.TOTAL_LINES) || '0');
    const sCombo  = parseInt(localStorage.getItem(LS.MAX_COMBO)   || '0');
    const sMaxLn  = parseInt(localStorage.getItem(LS.MAX_LINES)   || '0');
    const sHi     = parseInt(localStorage.getItem(LS.HI)          || '0');
    const avgScore = sGames > 0 ? Math.round(sScore/sGames) : 0;
    const achieved = JSON.parse(localStorage.getItem(LS.ACHIEVEMENTS) || '[]');
    const el = document.getElementById('stats-scroll');
    if (el) {
      const mainStatsHTML = `
        <div class="stats-row"><span class="stats-lbl">GAMES PLAYED</span><span class="stats-val">${sGames.toLocaleString()}</span></div>
        <div class="stats-row"><span class="stats-lbl">HIGH SCORE</span><span class="stats-val" style="color:#ffe600;text-shadow:0 0 8px #ffe600">${sHi.toLocaleString()}</span></div>
        <div class="stats-row"><span class="stats-lbl">AVERAGE SCORE</span><span class="stats-val">${avgScore.toLocaleString()}</span></div>
        <div class="stats-row"><span class="stats-lbl">BEST LEVEL</span><span class="stats-val" style="color:#00ff88;text-shadow:0 0 8px #00ff88">L${sLevel}</span></div>
        <div class="stats-row"><span class="stats-lbl">TOTAL LINES CLEARED</span><span class="stats-val">${sLines.toLocaleString()}</span></div>
        <div class="stats-row"><span class="stats-lbl">MAX SINGLE-GAME LINES</span><span class="stats-val" style="color:#c45bfb;text-shadow:0 0 8px #c45bfb">${sMaxLn.toLocaleString()}</span></div>
        <div class="stats-row"><span class="stats-lbl">MAX COMBO</span><span class="stats-val" style="color:var(--cyan);text-shadow:0 0 8px var(--cyan)">x${sCombo}</span></div>
      `;
      const achHTML = `
        <div class="htp-section" style="margin-top:20px;margin-bottom:10px">🏆 ACHIEVEMENTS</div>
        <div class="ach-gallery" style="display:grid;grid-template-columns:repeat(4,1fr);gap:10px;justify-items:center;padding:5px 0;">
          ${ACHIEVEMENTS.map(ach => {
            const entry = achieved.find(a => (typeof a === 'string' ? a === ach.id : a.id === ach.id));
            const isUnlocked = !!entry;
            const dateStr    = entry && typeof entry === 'object' && entry.date ? entry.date : '';
            const cleanLabel = ach.label.replace(/'/g, "\\'");
            const cleanDesc  = ach.description.replace(/'/g, "\\'");
            return `
              <div class="ach-badge-wrap" style="position:relative;cursor:pointer"
                   onmouseenter="showAchTooltip(this,'${cleanLabel}','${cleanDesc}',${isUnlocked},'${dateStr}')"
                   onmouseleave="hideAchTooltip()"
                   onclick="showAchTooltip(this,'${cleanLabel}','${cleanDesc}',${isUnlocked},'${dateStr}')">
                <div class="ach-badge ${isUnlocked?'unlocked':'locked'}" style="width:44px;height:44px;border-radius:10px;display:flex;align-items:center;justify-content:center;font-size:22px;background:${isUnlocked?'rgba(0,200,255,0.1)':'rgba(255,255,255,0.03)'};border:1px solid ${isUnlocked?'var(--cyan)':'rgba(255,255,255,0.1)'};box-shadow:${isUnlocked?'0 0 10px rgba(0,200,255,0.3)':'none'};opacity:${isUnlocked?1:0.25}">
                  ${ach.icon}
                </div>
              </div>`;
          }).join('')}
        </div>
      `;
      const donationCardHTML = SUPPORT_URL ? `
        <div style="margin-top:24px;padding:14px 16px;border:1px dashed rgba(255,215,0,0.22);border-radius:10px;background:rgba(255,215,0,0.04);text-align:center">
          <div style="font-size:7px;letter-spacing:2px;color:rgba(255,255,255,0.3);margin-bottom:10px">KEEP GLOWTRIS 100% AD-FREE</div>
          <button onclick="_openDonation()"
             style="display:inline-flex;align-items:center;gap:7px;padding:9px 20px;background:rgba(255,215,0,0.07);border:1px solid rgba(255,215,0,0.3);border-radius:9px;color:#ffe600;font-family:'Orbitron',monospace;font-size:9px;letter-spacing:2px;cursor:pointer;transition:background 0.2s"
             onmouseover="this.style.background='rgba(255,215,0,0.14)'" onmouseout="this.style.background='rgba(255,215,0,0.07)'">☕ BUY ME A COFFEE</button>
        </div>` : '';
      el.innerHTML = mainStatsHTML + achHTML + donationCardHTML;
    }
  });
}
export function closeStats() {
  if (Date.now() - _statsOpenTs < 350) return;
  document.getElementById('stats-overlay').style.display = 'none';
  hideAchTooltip();
}

export function showAchTooltip(elem, label, desc, isUnlocked, dateStr) {
  const tooltip = document.getElementById('ach-tooltip');
  if (!tooltip) return;
  const statusText = isUnlocked
    ? `<span style="color:#00ff88;font-weight:900">UNLOCKED${dateStr ? ` (${dateStr})` : ''}</span>`
    : `<span style="color:#ff5b5b;font-weight:900">LOCKED</span>`;
  tooltip.innerHTML = `
    <div style="color:#ffe600;font-weight:900;margin-bottom:3px;letter-spacing:1px;font-size:9px">${label}</div>
    <div style="color:rgba(255,255,255,0.85);margin-bottom:4px;font-size:8px">${desc}</div>
    <div style="font-size:7px;letter-spacing:0.5px">${statusText}</div>
  `;
  const rect = elem.getBoundingClientRect();
  tooltip.style.left    = `${rect.left + rect.width/2}px`;
  tooltip.style.top     = `${rect.top - 6}px`;
  tooltip.style.display = 'block';
  setTimeout(() => { tooltip.style.opacity = '1'; tooltip.style.transform = 'translate(-50%,-100%)'; }, 10);
}

export function hideAchTooltip() {
  const tooltip = document.getElementById('ach-tooltip');
  if (!tooltip) return;
  tooltip.style.opacity   = '0';
  tooltip.style.transform = 'translate(-50%,-105%)';
  setTimeout(() => { if (tooltip.style.opacity === '0') tooltip.style.display = 'none'; }, 150);
}

