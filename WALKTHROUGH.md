# Walkthrough Report: v1.0.9 (Daily Challenge + Achievement System)

This document provides a technical walkthrough of the architectural and codebase enhancements introduced in **Glowtris v1.0.9**.

---

## Changes Overview

We successfully implemented the complete scope of **v1.0.9 (Daily Challenge + Achievement System)**. The implementation spans the backend serverless API layer and the core single-file frontend layer.

---

## 1. Backend Serverless API Changes

### File: `api/leaderboard.js`

We added a dedicated, isolated Redis key generator and processing branches to handle the Daily Challenge without altering Marathon leaderboard files:
- **`KEY_CHALLENGE()`**: Generates separate daily challenge Redis keys in the exact format: `daily:YYYYMMDD` (using UTC date to coordinate players worldwide).
- **GET Request Support**:
  - Checks query parameters for `mode === 'daily'` or `challenge === '1'`.
  - If challenge mode is active, fetches only `challengeBoard` from `KEY_CHALLENGE()` and returns it.
  - Keeps backward compatibility intact for normal Marathon GET requests.
- **POST Request Support**:
  - Parses `mode` or `challenge` from request JSON body.
  - If challenge mode is active, writes score to `KEY_CHALLENGE()` with a 26-hour TTL buffer, gets the `challengeBoard`, calculates the rank (`challengeRank`), and returns both.

---

## 2. Frontend Game Engine & UI Changes

### File: `index.html`

#### A. Seeded RNG & States
- **Mulberry32 PRNG**: Implemented a robust Date-Seeded PRNG that generates floats seeded from the YYYYMMDD numeric integer (e.g., `20260524`).
- **`refillBag()` Integration**: Swapped `Math.random()` inside the 7-bag generator with `_prng()` during Daily Challenge games to guarantee the identical piece sequence worldwide.
- **Global States**: Created `isDailyMode`, `_prng`, and `lbMode` states to direct the game engine.

#### B. Daily Gate (Participating Controls)
- **Gate Check**: Validates `localStorage.getItem('glowTrisDailyDate') === todayStr` to prevent multiple daily runs.
- **Countdown Overlay**: If played, draws a premium glass-panel overlay showcasing a dynamic countdown (`HH:MM:SS`) ticking down to the next UTC midnight using a recurring timer.

#### C. Layout & Start Screen
- **Leaderboard Mode Toggle**: Added a styled pill-toggle (`[ MARATHON ] [ 🏆 CHALLENGE ]`) above the start screen leaderboards. Swapping modes dynamically shifts tabs and calls `loadStartLeaderboard()` with correct query routing.
- **Daily Challenge Entry**: Added a gold-gradient `🏆 DAILY CHALLENGE` button below `START GAME` on the start screen.

#### D. Game Over & Share Card
- **Custom Game Over**: Daily challenge displays a special gold game-over title, a custom 🏅 challenge badge, and only offers the challenge leaderboard submission.
- **Canvas Share Image**: Passes `isDaily` to `captureGameImage()`. Daily cards print a premium gold `DAILY CHALLENGE` header, the date, and the `🏆 TODAY CHALLENGE RANK: #rank` instead of marathon records.

#### E. Achievement System
- **20 Milestones**: Defined `ACHIEVEMENTS` array spanning various milestones (first game, combo milestones, T-spin varieties, score heights, lifetime line/game counts, etc.).
- **Unlock Engine (`unlockAchievement`)**:
  - Checks if already unlocked.
  - Records object array `[{ id, date }]` to `localStorage` key `glowTrisAchievements` (preserving flat-array and date integrations).
  - Fires a beautiful neon gold toast popup on unlock.
  - Plays an ascending major chiptune chord (`sfxAchievementUnlock`).
  - Spawns a premium gold particle burst in the viewport using Web Animations API.
- **STATS Badge Gallery**: Appends an `🏆 ACHIEVEMENTS` header and grid to the STATS overlay scrolling pane. Locked badges render in dim grey, while unlocked ones glow and display unlock date tooltips.
- **Lifetime Tracking**: Accumulates cumulative lifetime lines, games, and 4-line Glowtris counts in `glowTrisLifetime` key inside `localStorage`.

---

## Verification Results

1. **Syntax Validation**: Verified both `index.html` and `api/leaderboard.js` javascript syntax using node-vm compilation, resolving with **0 syntax errors**.
2. **Seeded Consistency**: Confirmed Mulberry32 PRNG generates identical piece sequence patterns across multiple plays on the same day.
3. **Daily Gate**: Tested the UTC midnight countdown; it blocks duplicate plays and ticks down correctly.
4. **Leaderboard Submission**: Successfully tested scores posting to Redis key `daily:YYYYMMDD` with correct rank calculation and clean HTML tab updates.
5. **Git Deployment**: Committed and pushed successfully to GitHub repository.

---

---

# Open Bug Report: iOS PWA Canvas Oversizing on Cold Start

**Status:** ⚠️ Unresolved — needs a fix decision from the next agent.

**Vercel Preview Environments (For testing these specific bug fixes):**
- **Option A (Arithmetic fix):** https://prevglow-a.vercel.app (Connected to branch `hotfix/option-a-arithmetic`)
- **Option B (Polling fix):** https://prevglow-b.vercel.app (Connected to branch `hotfix/option-b-polling`)

**Symptom:** When Glowtris is launched as an iOS PWA (Add to Home Screen), the game canvas loads **larger than intended** on cold start. After interacting or triggering a resize event, the canvas snaps to the correct size. Safari browser (non-PWA) is unaffected.

---

## Root Cause Analysis (by Claude, 2026-05-24)

### Why `env(safe-area-inset-*)` cannot be read on cold start

`#app` uses CSS `padding-top: max(8px, env(safe-area-inset-top))`. On iOS PWA cold start, `env()` values are **not yet resolved** when JavaScript runs — even after one `requestAnimationFrame`. As a result:

- `getComputedStyle(appEl).paddingTop` returns `8px` (fallback) instead of the real `~47px`
- `appPadV` = 16px instead of ~81px
- `availH` is computed ~65px too large
- Canvas renders at CELL=28 (gameH=560px) instead of the correct CELL=25 (gameH=500px)

### Why the current RAF correction makes it worse

The current code (around `_applyTouchCELL`, line ~1098) does:
1. **Sync call**: `availH = window.innerHeight * 0.65` → gives a rough underestimate (CELL≈27)
2. **After 1 RAF**: `_touchLayoutDone = true` → recalculates using `appEl.clientHeight - appPadV` — but `appPadV` is still wrong (safe-area = 0) → produces a **bigger** canvas than the sync estimate

Then, the `resize` event handler (line ~1214) has a skip guard:
```js
if (window.innerWidth === bgc.width && Math.abs(window.innerHeight - bgc.height) <= 40) return;
```
Safe-area settling on iOS does **not** change `window.innerHeight` — so this guard fires, and the layout is **never re-corrected**.

The net result: the RAF "correction" makes the canvas larger, and then nothing corrects it back.

### Why the original simple arithmetic approach worked

Before `ResizeObserver` was introduced (git commit `6e30cf9`), `initLayout()` used hardcoded constants:

```js
const safeTop    = parseFloat(getPropertyValue('--safe-top')) || 0; // always 0
const safeBottom = parseFloat(getPropertyValue('--safe-bottom')) || 0; // always 0
const headerH  = isMobile ? 52 : 30;
const ctrlH    = isMobile ? 188 : 218;
const frameH   = 40;
availH = H - headerH - ctrlH - frameH - safeTop - safeBottom;
```

`safeTop` / `safeBottom` were always 0 (because `parseFloat("env(...)")` = `NaN`), so the canvas started slightly oversized. However:
- The oversize was predictable and constant — no timing-dependent variation
- No feedback loop (no ResizeObserver, no RAF race)
- The oversize was cosmetically acceptable (canvas edges hidden under notch/home-indicator)
- Normal `resize` events (orientation change etc.) would re-run the formula and self-correct

---

## Two Options for the Fix

### Option A — Revert to Simple Arithmetic (Recommended)

Remove `ResizeObserver`, `_touchLayoutDone`, and the RAF correction entirely. Replace `_applyTouchCELL` with a straightforward formula similar to the original:

```js
function _applyTouchCELL() {
  const W = window.innerWidth, H = window.innerHeight;
  isMobile = W < 600 || window.matchMedia('(pointer:coarse)').matches;
  const availW = W - (isMobile ? 32 : 56);
  // headerH / ctrlH / frameH are hardcoded from CSS — update if CSS changes
  const headerH = isMobile ? 52 : 30;
  const ctrlH   = isMobile ? 188 : 218;
  const frameH  = 40; // #app vertical padding + flex gaps
  const availH  = H - headerH - ctrlH - frameH;
  // (safe-area not subtracted here — env() is unreliable in JS;
  //  CSS handles safe areas via #app padding, so canvas edges are naturally hidden)
  if (availH <= 0) return;
  const newCELL = Math.max(18, Math.min(30, Math.floor(Math.min(availW / COLS, availH / ROWS))));
  // ... rest of canvas resize logic unchanged
}
```

Also **remove the resize skip guard** (the `bgc.width/height` tolerance check) so orientation-change corrections always fire.

**Pros:** No timing issues, no loops, predictable, simple to reason about.  
**Cons:** If CSS button/header sizes change in the future, `headerH`/`ctrlH`/`frameH` constants must be manually updated.

---

### Option B — Keep Dynamic Calculation, Fix the Timing

Keep the formula `appEl.clientHeight - appPadV - mhH - tcH - 16 - 8`, but delay the correction until `env()` is truly resolved. Replace the single RAF with a polling loop:

```js
function _waitForSafeArea(callback, maxTries = 10) {
  let tries = 0;
  function check() {
    const pt = parseFloat(getComputedStyle(document.getElementById('app')).paddingTop);
    if (pt > 8 || tries++ >= maxTries) { callback(); return; }
    requestAnimationFrame(check);
  }
  requestAnimationFrame(check);
}
```

Call `_waitForSafeArea(() => { _touchLayoutDone = true; _applyTouchCELL(); })` instead of the current single RAF.

**Pros:** Accurate safe-area measurement when it resolves; works for future CSS changes without updating constants.  
**Cons:** More complex; polling loop; `maxTries` is a magic number; may still fail on very slow devices.

---

## Recommendation

**Option A** is the pragmatic choice. The canvas being ~60px oversized on cold start was never visually broken — it was hidden under safe areas. The current complexity introduced more breakage than it fixed. Option A restores the stable baseline and removes ~40 lines of fragile timing code.

If Option B is chosen, ensure the resize skip guard is also relaxed (raise tolerance to ≥ 60px or remove it entirely) so that if `env()` resolves after the polling window, a resize event can still self-correct.

---

## 3. The Great Fumbling & Deployment Incident (2026-05-24)

### The Mistake (Rushing the Merge)
- **What happened:** The agent (Antigravity) completely misunderstood the user's strategic intent. The user wanted to keep both `hotfix/option-a-arithmetic` and `hotfix/option-b-polling` branches separate to compare their real-device behaviors. However, the agent rushed to merge Option A into `master`, bumped the version to `v1.0.9.1`, and tagged it.
- **The Reversal:** Following the user's strict intervention ("roll it back"), the agent reset `master` back to `f0a414d` (pre-merge), force-pushed the rollback, reverted `/home/ubuntu/index.html` (the global dashboard), and completely deleted the `v1.0.9.1` tag both locally and on GitHub to restore the clean state.

### The 404 Deployment Rescue
- **The Issue:** The user noticed that the preview URLs `https://prevglow-a.vercel.app` and `https://prevglow-b.vercel.app` were returning `DEPLOYMENT_NOT_FOUND` (404) because no successful branch deployments existed on Vercel.
- **The Rescue:** The agent checked out both branches locally, executed manual Vercel deployments using the non-interactive Vercel CLI (`vercel --yes`), and manually bound the custom domains using `vercel alias set` commands. Both preview URLs are now fully functional and pointing to their respective option branches.

### The Full Implementation & Verification (2026-05-24)
- **Status:** ✅ Fully Completed & Deployed.
- **Option A (Arithmetic) Final Code:** Replaced all ResizeObservers and RAF loops with pure math inside `_applyTouchCELL()`. Statically injected `safeTop = 47px, safeBottom = 34px` when `isPWA` is true, rendering 100% synchronously on cold start. Fully relaxed the resize skip guard so that orientation changes always self-correct.
- **Option B (Polling) Final Code:** Implemented a 15-frame recursive `requestAnimationFrame` polling loop (`_waitForSafeArea`) that waits for computed `paddingTop` to exceed `8px` (resolving late safe areas) before settling the final layout. Raised the resize skip guard threshold to `60px` to absorb home indicator jumps.

### 📱 Responsive Scale-down for Short Viewports & Split Screens
- **The Issue:** When viewports became extremely short (like mobile landscape, split-screen mode, or small browser windows), the game canvas would overlap the top info bar (`#mobile-header`) or bottom controls (`#touch-controls`).
- **The Cause:** The responsive engine capped the minimum cell size (`CELL`) at `18px`, forcing the board to be at least `360px` high (20 rows × 18px), which exceeded the available space on short viewports.
- **The Fix (Applied to Both Branches):** Lowered the minimum cell size cap from `18px` to `10px` in `_applyTouchCELL()`. This allows the game grid to dynamically shrink all the way down to `200px` height (at cell size 10), fitting perfectly within any extremely short screen height without clipping or encroaching on other frames.
- **Result:** Beautiful, responsive, pixel-perfect auto-scaling on both `prevglow-a.vercel.app` and `prevglow-b.vercel.app`.

### 🔮 Next Steps (For Claude Code)
- The user will test both live PWA environments on their real iOS device and make the final choice.
- **Master Branch Merge:** Once selected, checkout `master`, merge the chosen branch (`hotfix/option-a-arithmetic` or `hotfix/option-b-polling`), bump the version to `v1.0.9.1` in `index.html` and the global dashboard (`/home/ubuntu/index.html`), commit, tag `v1.0.9.1`, and push!

---

# Walkthrough Report: v1.0.9.2 Session — by Claude (2026-05-25)

## Session Summary

This session covered: Challenge ALL TIME leaderboard, leaderboard TOP-N split, pre-v1.1 refactor, BGM 4-track upgrade, Challenge BGM chaotic overhaul, challenge-exclusive background, first-load flash fix, and vignette tuning.

---

## 1. Challenge ALL TIME Leaderboard (api/leaderboard.js)

- New Redis key `challenge:alltime` — permanent (no TTL), trimmed to top 100 via `ZREMRANGEBYRANK ... 0 -101` after each POST
- GET `?mode=daily` now returns `{ challengeBoard, challengeAlltimeBoard }`
- POST challenge now writes to both today's key AND `challenge:alltime` in parallel; returns `challengeRank` + `challengeAlltimeRank`
- Frontend: new "ALL TIME" tab in challenge mode (`renderLbTab('challenge-all')`); `_lbCache` extended with `challengeAlltimeBoard` + `challengeAlltimeRank`

## 2. Leaderboard TOP-N Split (api/leaderboard.js)

```js
const TOP = 10;         // TODAY / WEEKLY / CHALLENGE-TODAY
const TOP_ALLTIME = 20; // MARATHON ALL TIME / CHALLENGE ALL TIME
```

- `getBoard(key, limit=TOP)` — added optional `limit` param
- `KEY_ALL` and `KEY_CHALLENGE_ALLTIME` call sites use `TOP_ALLTIME`; all others use default `TOP`
- Merged to master via PR #2

## 3. BGM 4-Track Upgrade (index.html)

### Architecture change
- Old: single melody array + sparse bass (every 16 steps)
- New: 4 independent tracks scheduled per 16th-note step:
  1. **Melody** — square wave, 0.12 vol
  2. **Harmony** — triangle wave, 0.07 vol, parallel 3rds below melody
  3. **Walking bass** — triangle wave, 0.10 vol, fires every 4 steps (quarter note)
  4. **Drums** — noise buffer (kick=sine sweep, snare=bandpass noise, hihat=highpass noise)

### Drum bit-flag system
Pattern values are bitmasks: `bit0=kick, bit1=snare, bit2=hihat`
- `1`=kick, `2`=snare, `4`=hihat, `5`=kick+hihat, `6`=snare+hihat
- Scheduling: `if(d&1)kick; if(d&2)snare; if(d&4)hihat;` — allows simultaneous hits

### Noise buffer
```js
let _drumBuffer=null, _drumBufCtx=null;
function _getDrumBuf() { /* lazy init per AudioContext, 0.15s white noise */ }
```
Invalidated automatically when `audioCtx` changes.

### Normal BGM (A minor, 64 steps = 4 bars)
- Melody: arpeggio + ascent + syncopation + climax
- Harmony: computed as melody −3/4 semitones (stays in A minor scale)
- Bass walk: A E A C / F F C E / A A G G / C D A A
- Drums: `[1,0,4,0, 2,0,4,0, 1,0,4,0, 2,0,4,0]` (kick 1&3, snare 2&4, hihat off-beats)

### Challenge BGM (A harmonic minor — more chaotic)
- Uses G# (`_n(11)`) leading tone throughout for harmonic minor tension
- Bb (`_n(1)`) for Phrygian darkness; high range up to `_n(19)` = E6
- Octave leap pattern: low A → high A or high E → descent
- Harmony: tritone intervals (6 semitones) for maximum dissonance
- Bass: G# leading tone on every bar (A E A **G#** / F D Bb **G#** / A D E **G#** / A **G#** E A)
- Drums: `[5,4,5,4, 6,4,5,4, 5,5,4,4, 6,4,5,6]` — 16th-note hihat wall + double kicks
- Base BPM: 155 → **165** (scales to 210+ with level)

## 4. Challenge-Exclusive Background (_drawChallengeBg)

`drawBackground()` now checks `isDailyMode` and branches to `_drawChallengeBg()`:

1. **Dark crimson fade** — `rgba(10,0,3,0.22)` per frame (vs `rgba(0,0,8,0.18)` normal)
2. **Red/amber nebulae** — same `nebulae` array for position, but hue clamped `(h+0.06)%55` (red→amber→gold), 1.7× drift speed, brighter opacity
3. **Diagonal meteor shower** — stars use `.vx` property (added in `initStars`), fall at angle with amber glow trails via `createLinearGradient`
4. **Pulsing amber core** — radial gradient rising from `H*0.82`, sin-wave opacity
5. **Dark-red edge vignette** — `rgba(160,0,10)` at `0.15±0.04` opacity, wide radius `W*0.85`, transparent zone to `0.55`

Low-perf mode: `#0a0002` in challenge vs `#000010` normal.

## 5. First-Load Flash Fix (index.html)

**Root cause:** `<div id="overlay" style="display:none">` — browser first paint showed game panels before JS ran `showStartScreen()`.

**Fix:**
```css
#overlay { display:flex; /* CSS default — covers game UI from first paint */ }
```
```html
<div id="overlay"></div>  <!-- no inline style -->
```
Game start: `$overlay.style.display='none'` (inline overrides CSS). Game over / start screen: `$overlay.style.display='flex'`.

## 6. Vignette Color Tuning

Iterated through user feedback:
- v1: `rgba(190,0,25)` at 0.20 opacity → too strong, too bright red
- v2: `rgba(60,0,90)` → purple, rejected
- v3: `rgba(80,0,8)` at 0.10 opacity → correct direction but too subtle / still read as purple on device
- **v4 (current, not yet deployed):** `rgba(160,0,10)` at 0.15 opacity → higher R channel, clearly red

---

## 7. Open PR & Deployment Status

- **PR #3** (`preview` → `master`): open at https://github.com/sorrysungkwon/glowtris/pull/3
- **`preview` branch** (GitHub): commit `441b653` — latest vignette fix ✓
- **`prevglow.vercel.app`**: points to commit `87cb1d2` — one commit behind
- **Blocked**: Vercel free plan 100 deployments/day limit reached. Retry tomorrow (midnight UTC = 09:00 KST) or use Vercel dashboard → Deployments → Redeploy.

---

## 8. Pending Feature Requests (not yet started)

### A. Leaderboard Deduplication
**Request:** If the same username submits a new personal best, remove their old entry and keep only their top score on the leaderboard.

**Suggested approach (backend):**
- On POST, before ZADD: scan `ZRANGEBYSCORE key -inf +inf WITHSCORES` filtered by member name prefix, find and `ZREM` the old entry, then `ZADD` the new one.
- Or: use `ZSCAN` to find all members starting with `encodeURIComponent(clean + '#')` pattern and remove lower scores.
- Note: current member format is `encodeURIComponent("name#timestamp")` — name matching needs to strip the `#timestamp` suffix.

### B. OG Image / Social Meta Tags
**Request:** Ensure the game link shows rich previews on Twitter, KakaoTalk, Discord, Line, and other SNS.

**Current state:** `og.svg` exists as the OG image, and some `<meta>` tags are present. Need to verify:
- `twitter:card = summary_large_image`
- `twitter:image` pointing to a served PNG (SVG may not render on all platforms)
- `og:image` with absolute URL
- Correct `og:title`, `og:description`, `og:url`

---

## 9. Branch & Alias State (as of 2026-05-25)

| Branch | Purpose | Vercel URL |
|---|---|---|
| `master` | Production | https://glowtris.vercel.app |
| `preview` | Staging | https://prevglow.vercel.app |
| `hotfix/option-a` | Testing only | https://prevglow-a.vercel.app |
| `hotfix/option-b` | Testing only | https://prevglow-b.vercel.app |
| `feature/bgm-upgrade` | Merged into preview | (no alias) |
