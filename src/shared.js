// ─── Constants ───────────────────────────────────────────────────────────────
export const COLS = 10, ROWS = 20;

export const PIECES = {
  I:{shape:[[1,1,1,1]],color:'#00d8ff'},
  O:{shape:[[1,1],[1,1]],color:'#ffe000'},
  T:{shape:[[0,1,0],[1,1,1]],color:'#cc00ff'},
  S:{shape:[[0,1,1],[1,1,0]],color:'#00ffaa'},
  Z:{shape:[[1,1,0],[0,1,1]],color:'#ff2040'},
  J:{shape:[[1,0,0],[1,1,1]],color:'#2979ff'},
  L:{shape:[[0,0,1],[1,1,1]],color:'#ff8c00'},
};

export const SCORE_TABLE     = [0,100,300,500,800];
export const TSPIN_SCORE     = [400,800,1200,1600];
export const TSPIN_MINI_SCORE= [0,200,400];
export const LEVEL_LINES     = 10;
export const SPRINT_LINES    = 40;
export const MAX_PARTICLES   = 400;
// Donation link — set to '' to hide all donation UI instantly
export const SUPPORT_URL     = 'https://ko-fi.com/sorrysungkwon';

// Reverse map: color → piece key (used for colorblind pattern lookup)
export const COLOR_TO_KEY = {};
for (const [k, v] of Object.entries(PIECES)) COLOR_TO_KEY[v.color] = k;

// ─── localStorage keys ────────────────────────────────────────────────────────
export const LS = {
  HI:           'glowTrisHi',
  HISTORY:      'glowTrisHistory',
  STREAK:       'glowTrisStreak',
  MAX_COMBO:    'glowTrisMaxCombo',
  TOTAL_GAMES:  'glowTrisTotalGames',
  TOTAL_SCORE:  'glowTrisTotalScore',
  BEST_LEVEL:   'glowTrisBestLevel',
  TOTAL_LINES:  'glowTrisTotalLines',
  MAX_LINES:    'glowTrisMaxLines',
  LIFETIME:     'glowTrisLifetime',
  DAILY_DATE:   'glowTrisDailyDate',
  NAME:         'glowTrisName',
  MUTE:         'glowTrisMute',
  DAS:          'glowTrisDAS',
  ARR:          'glowTrisARR',
  LOCK:         'glowTrisLock',
  GHOST:        'glowTrisGhost',
  COLORBLIND:   'glowTrisColorblind',
  ANIM:         'glowTrisAnim',
  LOW_PERF:     'glowTrisLowPerf',
  ACHIEVEMENTS: 'glowTrisAchievements',
  SPRINT_HI:    'glowTrisSprintHi',
};

// ─── Achievement definitions ─────────────────────────────────────────────────
export const ACHIEVEMENTS = [
  { id: 'first_game',        label: 'First Stack',         description: 'Complete your first game',                icon: '🧱' },
  { id: 'glowtris_1',        label: 'Glowtris!',           description: 'Clear 4 lines at once',                   icon: '⚡' },
  { id: 'tspin_1',           label: 'T-Spin Initiate',     description: 'Perform a T-Spin',                        icon: '🔄' },
  { id: 'tspin_triple',      label: 'Apex Spin',           description: 'Perform a T-Spin Triple',                 icon: '🌀' },
  { id: 'all_clear',         label: 'Void Clear',          description: 'Achieve an All-Clear bonus',              icon: '🌟' },
  { id: 'combo_5',           label: 'Combo Cadet',         description: 'Reach a 5x combo',                        icon: '🔥' },
  { id: 'combo_10',          label: 'Combo Master',        description: 'Reach a 10x combo',                       icon: '👑' },
  { id: 'level_5',           label: 'Cruising',            description: 'Reach Level 5',                           icon: '🚀' },
  { id: 'level_10',          label: 'Hyperdrive',          description: 'Reach Level 10',                          icon: '🌠' },
  { id: 'level_15',          label: 'Light Speed',         description: 'Reach Level 15',                          icon: '🌌' },
  { id: 'score_50k',         label: 'High Roller',         description: 'Score 50,000 points',                     icon: '💰' },
  { id: 'score_100k',        label: 'Elite Stacker',       description: 'Score 100,000 points',                    icon: '💎' },
  { id: 'score_250k',        label: 'Neon God',            description: 'Score 250,000 points',                    icon: '👾' },
  { id: 'games_10',          label: 'Hooked',              description: 'Play 10 total games',                     icon: '🎮' },
  { id: 'games_50',          label: 'Obsessed',            description: 'Play 50 total games',                     icon: '❤️' },
  { id: 'lines_100',         label: 'Centurion',           description: 'Clear 100 cumulative lines',              icon: '💯' },
  { id: 'lines_1000',        label: 'Grandmaster Stacker', description: 'Clear 1,000 cumulative lines',            icon: '🏆' },
  { id: 'daily_challenge_1', label: 'Daily Pioneer',       description: 'Complete your first Daily Challenge',     icon: '🏅' },
  { id: 'streak_5',          label: 'On Fire',             description: 'Reach a 5-game PB streak',                icon: '🔥' },
  { id: 'submit_lb',         label: 'Public Record',       description: 'Submit a score to online leaderboard',    icon: '🌐' },
  { id: 'sprint_finish',     label: 'Sprint Runner',       description: 'Complete a 40-line sprint',               icon: '⚡' },
];

// ─── Achievement / lifetime cache helpers ─────────────────────────────────────
// Lazy-load + write-through caches so hot-path code avoids JSON.parse on every call.
// Both game.js (lockPiece, _saveGameStats) and ui.js (unlockAchievement) need these.
export function _getAchievements() {
  if (!S._achievementsCache)
    S._achievementsCache = JSON.parse(localStorage.getItem(LS.ACHIEVEMENTS) || '[]');
  return S._achievementsCache;
}
export function _getLifetime() {
  if (!S._lifetimeCache)
    S._lifetimeCache = JSON.parse(localStorage.getItem(LS.LIFETIME) || '{"totalLines":0,"totalGames":0,"totalGlowtris":0}');
  return S._lifetimeCache;
}

// ─── Mulberry32 PRNG ─────────────────────────────────────────────────────────
export function mulberry32(a) {
  return function() {
    let t = a += 0x6D2B79F5;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// ─── Time formatter ───────────────────────────────────────────────────────────
// Formats milliseconds as M:SS.cc. Used by ui.js, leaderboard.js, game.js.
export function fmtTime(ms) {
  const total = Math.floor(ms / 10);
  const cs    = total % 100;
  const secs  = Math.floor(total / 100) % 60;
  const mins  = Math.floor(total / 6000);
  return `${mins > 0 ? mins + ':' : ''}${secs.toString().padStart(2,'0')}.${cs.toString().padStart(2,'0')}`;
}

// ─── Shared mutable state (S) ────────────────────────────────────────────────
// Cross-module state: written by one module, read by 2+ modules.
// Module-local state (audio internals, perf counters, etc.) stays in each file.
export const S = {
  // Layout / device
  CELL: 30,        // px per cell — recalculated by ui.js on init & resize
  isMobile: false, // set by ui.js initLayout, read by game.js key handler
  _kbMode: false,  // iPad + external keyboard mode (ui.js writes, game.js reads)

  // Live board data (game.js writes, ui.js reads each frame)
  board:   null,
  current: null,
  next:    null,
  held:    null,

  // Score HUD (game.js writes, ui.js updateUI reads)
  score: 0, lines: 0, level: 1, combo: 0, hiScore: 0,

  // Game control flags (game.js writes, audio.js + ui.js read)
  gameRunning: false,
  gamePaused:  false,
  isDailyMode: false,
  isSprintMode: false,

  // Countdown 3-2-1 (game.js writes, ui.js drawBoard reads)
  _countdownVal: 0,
  _countdownGo:  0,
  _countdownTs:  0,

  // Leaderboard state (game.js initialises, leaderboard.js reads/writes)
  lbMode: 'marathon',
  _lbCache: {
    board:[], dailyBoard:[], weeklyBoard:[],
    challengeBoard:[], challengeRank:0,
    challengeAlltimeBoard:[], challengeAlltimeRank:0,
    sprintBoard:[], sprintDailyBoard:[], sprintWeeklyBoard:[],
    sprintRank:0, sprintDailyRank:0, sprintWeeklyRank:0, mySprintTime:0,
  },

  // Audio / visual settings (written by audio.js or ui.js, read by both)
  muteAudio:     false,
  animIntensity: 'full',   // 'full' | 'reduced' | 'off'
  lowPerfMode:   false,
  colorblindMode:false,
  ghostVisible:  true,

  // Per-frame visual effects (game.js lockPiece writes, ui.js drawBoard reads)
  flashLines:      null,   // initialized to new Set() in game.js startup
  flashTimer:      0,
  shakeFrames:     0,
  shakeMag:        0.4,
  shakeAllDir:     false,
  comboFlash:      0,
  comboFlashColor: '#00c8ff',
  rainbowBorder:   0,
  dangerPulse:     0,
  levelUpScanline: 0,

  // Game mechanics (game.js writes, ui.js drawBoard reads for lock progress bar)
  lockActive: false,
  lockTimer:  0,
  lockMs:     500,

  // Input settings (ui.js settings fns write, game.js DAS timer reads)
  das: 150,
  arr: 50,

  // Sprint timing (game.js writes, ui.js updateUI/updateSprintTimer reads)
  _sprintStartTime: 0,
  _sprintEndTime:   0,   // only game.js uses, kept here for symmetry
  _sprintHiTime:    0,

  // Perf lock (ui.js measureFPS writes, game.js _doStartGame reads)
  _perfLocked: false,

  // Particle array (game.js endGame/endSprint push directly; ui.js renders)
  particles: [],

  // Achievement & lifetime caches (written lazily, used by both modules)
  _achievementsCache: null,
  _lifetimeCache:     null,
};
