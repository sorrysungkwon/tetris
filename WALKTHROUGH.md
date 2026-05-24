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
