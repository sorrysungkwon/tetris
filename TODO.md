# Glowtris Agent Shared TODO & Guidelines

## 🚨 Behavioral Guidelines (Must read first!)
- **Single File Rule**: Always maintain the single `index.html` structure. No external frontend libraries allowed.
- **English-Only Rule**: All code changes, comments, logs, documentation, and Git commit messages MUST be written entirely in English.
- **Workflow Integrity**: Before starting any task, read this file and `README.md` first. After completing any task, update progress here (`[x]`) and in `README.md`'s roadmap, then execute `git add . && git commit -m "description" && git push`.

---

## ✅ Completed: v1.0.2 (Subtle Design & Polish) — by Antigravity

- [x] Task 1: Revert Hard Drop shockwave rings in `hardDrop()` (keep only standard spark particles)
- [x] Task 2: Implement Sleek Ghost Piece Alignment Lasers (dashed transparent vertical lines) in `drawBoard()`
- [x] Task 3: Develop Subtle Auto/Soft Drop Particle Trails in gravity drop and `softDrop()`
- [x] Task 4: Polish Action Buttons with premium high-tech micro-glow borders and spring scale curves
- [x] Task 5: Document release highlights in `README.md` and complete the roadmap update

---

## ✅ Completed: v1.0.2 Post-fixes — by Claude (2026-05-23)

- [x] Fix: Restore start-screen leaderboard — `showStartScreen()` was never called on init, so `.lb-inner` never existed for `loadStartLeaderboard()` to render into. Fixed by replacing `loadStartLeaderboard()` with `showStartScreen()` at init.
- [x] Docs: Add `TODO.md` reference to top of `README.md` so all agents see it immediately after reading README.
- [x] Docs: Update `CLAUDE.md` and `AGENTS.md` to mandate `README.md → TODO.md` read order before any task.

---

## ✅ Completed: v1.0.3 (Retention & UX Polish)

- [x] Task 1: Persist username across sessions — save the submitted leaderboard name to `localStorage` and pre-fill it on the next game-over submission form so players don't retype it every game.
- [x] Task 2: Show personal best streak on game over screen — display current win streak or highest combo alongside the last-5-scores history panel.
- [x] Task 3: Add "HOW TO PLAY" toggle on start screen — a small collapsible rules panel listing controls (keyboard + touch) so new players don't have to guess.
- [x] Task 4: Document v1.0.3 changes in `README.md` roadmap and update this file.

---

## ✅ Completed: v1.0.3 Post-fixes — by Claude (2026-05-23)

- [x] Hotfix: iOS PWA safe area inset — `getPropertyValue('--safe-bottom')` returned raw token string; replaced with temp element measurement so canvas sizing respects home indicator on iPhone.
- [x] Feat: Restart button in pause overlay — ghost-styled button below RESUME routes back to start screen.
- [x] Feat: HOW TO PLAY redesigned as standalone full-screen popup — X button and backdrop tap to close; no longer conflicts with leaderboard layout.
- [x] Fix: HOW TO PLAY button resized to match START GAME (`action-btn ghost`); touch section icons replaced with Material Icons Round matching actual game buttons.
- [x] Chore: Bump version label to v1.0.3; configure git identity to `sorrysungkwon <seonqwer@gmail.com>` for proper GitHub attribution.

## ✅ Completed: v1.0.4 (Profile, UI, & Social Depth) — by Antigravity (2026-05-23)

- [x] Task 1: Full stats screen (stored in `localStorage`) and personal record badges.
- [x] Task 2: UI Enhancements (Neon Wireframe Grid, Floating score/level text, Dynamic board borders).
- [x] Task 3: Enhanced particle physics (gravity, friction) with optimized rendering.
- [x] Task 4: Polished typography, contrast, and text-shadows for buttons and overlays.
- [x] Task 5: Add WEEKLY tab to leaderboard (TODAY / WEEKLY / ALL TIME) with Redis weekly TTL.
- [x] Task 6: Persistent personal rank display — always show the player's own rank even when not in top 10.
- [x] Task 7: Canvas share image — capture final board state + score as a PNG and offer it via Web Share API / clipboard.
- [x] Task 8: Document v1.0.4 completion in `README.md` and `TODO.md`.

---

## ✅ Completed: v1.0.4 Post-fixes — by Antigravity (2026-05-23)

- [x] Fix: Expand leaderboard table to fill 100% of container width using `display: table` and `.lb-inner` scrolling.
- [x] Polish: Redesign Canvas Share image to a premium 1200x630 layout, featuring the game board snapshot and a sleek glassmorphism stats panel.

---

## 🔮 Planned: v1.1 (Sprint Mode & Polish)

- [ ] Task 1: **Sprint Mode Engine**: Implement game mode logic — clear 40 lines as fast as possible. The game ends when 40 lines are cleared, recording elapsed time.
- [ ] Task 2: **Sprint UI**: Display an elapsed stopwatch timer (e.g. `01:23.45`) and remaining lines in the side panels.
- [ ] Task 3: **Mode Selection**: Add a sleek toggle/button group on the start screen to select between "MARATHON" (endless, score-based) and "SPRINT" (40 lines, time-based).
- [ ] Task 4: **Sprint Leaderboard**: Create a separate time-based Redis leaderboard (ascending sort, fastest times win) with TODAY / WEEKLY / ALL TIME tabs.
- [ ] Task 5: **Sprint Stats & Share**: Update `STATS` overlay and Canvas Share to properly format and display Sprint times and ranks.
- [ ] Task 6: **Settings Polish**: Add a toggle in settings to enable/disable the Ghost Piece.
