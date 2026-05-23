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

## ✅ Completed: v1.0.4 (Stats & Profile) — by Antigravity (2026-05-23)

- [x] Task 1: Full stats screen — total games played, average score, best level reached, total lines cleared (stored in `localStorage`).
- [x] Task 2: Personal record badges on game over screen — highlight best-ever level, longest combo, highest single-game lines.
- [x] Task 3: Document v1.0.4 changes in `README.md` roadmap and update this file.

---

## ✅ Completed: v1.0.4.1 (Premium UI & UX Enhancements) — by Antigravity (2026-05-23)

- [x] Task 1: Neon Wireframe Grid on the game board.
- [x] Task 2: Floating score and level up text animations on `particle-canvas`.
- [x] Task 3: Dynamic board borders that sync with the active piece's color.
- [x] Task 4: Enhanced particle physics (gravity, friction) and visual trails.
- [x] Task 5: Polished typography, contrast, and text-shadows for buttons and overlays.
- [x] Task 6: Document changes and push to GitHub.

---

## 🔮 Planned: v1.0.5 (Leaderboard & Social Depth)

- [ ] Task 1: Add WEEKLY tab to leaderboard (TODAY / WEEKLY / ALL TIME) with Redis weekly TTL.
- [ ] Task 2: Persistent personal rank display — always show the player's own rank even when not in top 10.
- [ ] Task 3: Canvas share image — capture final board state + score as a PNG and offer it via Web Share API / clipboard.
- [ ] Task 4: Document v1.0.5 changes in `README.md` roadmap and update this file.

---

## 🔮 Planned: v1.1 (Sprint Mode)

- [ ] Task 1: Implement Sprint mode — clear 40 lines as fast as possible; show elapsed time instead of score.
- [ ] Task 2: Separate Sprint leaderboard (time-based, TODAY / ALL TIME tabs).
- [ ] Task 3: Mode selection on start screen — Marathon vs Sprint.
- [ ] Task 4: Rename existing endless mode to "Marathon" across all UI labels.
- [ ] Task 5: Document v1.1 changes in `README.md` roadmap and update this file.
