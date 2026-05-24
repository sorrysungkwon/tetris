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
