# Glowtris — Bug Tracker

> Report bugs here. Each entry: symptom, reproduction steps, root cause, fix.
> Status: 🔲 Open · 🔧 In Progress · ✅ Fixed

---

## ✅ Fixed

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
