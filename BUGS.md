# Glowtris — Bug Tracker

> Report bugs here. Each entry: symptom, reproduction steps, root cause, fix.
> Status: 🔲 Open · 🔧 In Progress · ✅ Fixed

---

## 🔲 Open

### [BUG-004] Piece transparency after ~5 games (Chrome/Windows)
- **Reported:** 2026-05-31 | **Priority:** 🔴 Critical
- **Symptom:** Pieces gradually become transparent/invisible after playing ~5 games without refresh
- **Reproduce:** Chrome/Windows — play 5+ consecutive games
- **Root cause (suspected):** Canvas 2D state (globalAlpha, shadowBlur, lineDash) leaking across game resets in Chrome's GPU-accelerated canvas path. `gctx.clearRect()` clears pixels but not context state.
- **Fix:** Add explicit `gctx.globalAlpha=1; gctx.shadowBlur=0; gctx.setLineDash([])` reset at top of `drawBoard()` each frame.
- **Status:** Under investigation

---

## ✅ Fixed

### [BUG-005] T-spin detection fails / T-piece can't rotate into slot
- **Reported:** 2026-05-31 | **Priority:** 🔴 Critical
- **Symptom:** T-piece cannot rotate into T-spin setups (piece doesn't kick into the slot)
- **Root cause:** Kick table was `[0,-1,1,-2,2]` with `dy=0` only — no vertical kick support. Standard T-spin setups require the piece to kick downward into the slot. Also missing CCW rotation entirely.
- **Fix:** Implemented full SRS kick tables (JLSTZ + I-piece, 8 rotation transitions each). Added CCW rotation (`rotateCCW`). Bound X for CW, Z/Ctrl for CCW. — PR #16

### [BUG-003] Keyboard screen shake on move keys
- **Reported:** 2026-05-31
- **Symptom:** Screen shakes/bounces left and right when pressing arrow keys or WASD to move pieces
- **Root cause:** `nudgeUI()` parallax effect was called on every ArrowLeft/A and ArrowRight/D keydown
- **Fix:** Removed `nudgeUI()` calls from keydown handler (`game.js`) — PR #15

---

### [BUG-002] Duplicate "BUY ME A COFFEE" button after score submission
- **Reported:** 2026-05-31
- **Symptom:** Two donation buttons appear on the game over screen after submitting a score
- **Root cause:** `_donationHTML()` rendered once statically in `screens.js` (outside `#lb-result`) and again inside `#lb-result.innerHTML` after submission in `leaderboard.js`
- **Fix:** Removed `+_donationHTML()` from the three `res.innerHTML` assignments in `leaderboard.js` — PR #14

---

### [BUG-001] Sprint timer continues running while paused
- **Reported:** 2026-05-31
- **Symptom:** In Sprint mode, the stopwatch keeps counting while the game is paused
- **Root cause:** `gameLoop` called `updateSprintTimer()` without a `!S.gamePaused` guard; `_sprintStartTime` was not offset for paused duration
- **Fix:** Added `!S.gamePaused` guard + `pauseGameTiming()` / `resumeGameTiming()` offset (`game.js`, `screens.js`)

---

## 🔲 Open

_No open bugs._
