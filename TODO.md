# Glowtris Agent Shared TODO & Guidelines

## 🚨 Behavioral Guidelines (Must read first!)
- **Single File Rule**: Always maintain the single `index.html` structure. No external frontend libraries allowed.
- **English-Only Rule**: All code changes, comments, logs, documentation, and Git commit messages MUST be written entirely in English.
- **Workflow Integrity**: Before starting any task, read your agent doc (`CLAUDE.md` or `AGENTS.md`) first, then this file. `README.md` is human-facing — use it for feature context only. After completing any task, update progress here (`[x]`) and in `README.md`'s roadmap, then `git add . && git commit -m "description"` — report to user and wait. **Push only when user says "push해".** Docs-only commits accumulate locally and are bundled with the next code push.

---

## 🎯 Version Pipeline (current → next)

| Version | DAU Goal | Status |
|---|---:|---|
| v1.0.9.4 | 100 | ✅ Done |
| Pre-v1.1 | — | ✅ Done |
| v1.1 Sprint Mode | 500 | ✅ Done (Reddit post pending) |
| v1.2 Ultra + Streak | 700 | 🔲 |
| v1.3 Training & Finesse | 1,200 | 🔲 |
| v1.4 Visual Customization | 1,800 | 🔲 |
| v1.5 Weekly Events | 2,500 | 🔲 |
| v1.6 Ghost & Replay | 3,500 | 🔲 |
| v1.7 Advanced Stats | 4,500 | 🔲 |
| v1.8 Season & Rank | 6,000 | 🔲 |
| v1.9 Social Layer | 8,000 | 🔲 |
| v2.0 Multiplayer | 15,000+ | 🔲 |

> Full roadmap, DAU milestones, and infrastructure upgrade triggers → see `README.md`.
> Marketing strategy and growth plan → see `GROWTHPLAN.md` (local only).

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

## ✅ Completed: v1.0.5 (OG Image Redesign) — by Claude (2026-05-23)

- [x] Task 1: Redesign `og.svg` with logo-lockup layout — 3×3 block grid mark on left, GLOW/TRIS neon title on right.
- [x] Task 2: Add nebula radial gradients, subtle grid lines, and starfield background.
- [x] Task 3: Add neon corner bracket accents (cyan TL/BL, purple TR/BR) and gradient separator lines.
- [x] Task 4: Update `README.md` roadmap with v1.0.5 entry.

---

## ✅ Completed: v1.0.5 Post-fixes — by Claude (2026-05-23)

- [x] Hotfix: PWA bottom controls clipping — `#touch-controls` had `padding-bottom:max(16px,env(safe-area-inset-bottom))` duplicating the safe area already applied by `#app`. In standalone PWA mode (home indicator = 34px) controls rendered 18px taller than `initLayout`'s fixed `ctrlH=188`, causing overflow and clipping. Fixed by removing `env()` from `#touch-controls` (fixed 16px only); `#app padding-bottom:max(8px,var(--safe-bottom))` handles safe area exclusively.

---

## ✅ Completed: v1.0.6 (Settings & Accessibility) — by Claude (2026-05-23)

- [x] Task 1: **Ghost Piece Toggle** — toggle button in pause menu; hides ghost piece + alignment lasers when off; persisted to `localStorage` (glowTrisGhost).
- [x] Task 2: **Lock-Delay Tuning** — LOCK slider (100–1000ms, step 50) added to pause menu alongside DAS/ARR; persisted to `localStorage` (glowTrisLock).
- [x] Task 3: ~~**How To Play — Keyboard Hints**~~ — Reverted: `.htp-keys` wrapper and `⇧ Shift` badge caused FOUC flash on page load; HTP KEYBOARD section restored to v1.0.5 state.
- [x] Task 4: Update `README.md` roadmap and this file after completion.

---

## ✅ Completed: Naming Cleanup — by Claude (2026-05-23)

- [x] Removed two stale permission entries in `.claude/settings.local.json` that referenced the old path `/home/ubuntu/projects/tetris`
- [x] Rewrote entire git history using `git-filter-repo` to replace all "Tetris"/"tetris" references with "Glowtris"/"glowtris" in both commit messages and file content (e.g. `og.svg` comment strings in old commits)
- [x] Force-pushed rewritten history to `origin/master` on GitHub

**Background:** The project was originally developed in `/home/ubuntu/projects/tetris` and renamed to Glowtris at v1.0.1. This task ensured no "tetris" string remains anywhere — files, config, or git history. The canonical name is **Glowtris** everywhere.

---

## ✅ Completed: v1.0.6 HTP Flash Fix — by Claude (2026-05-23)

- [x] Fix: **HTP overlay FOUC** — `#htp-overlay` and `#stats-overlay` lacked inline `style="display:none"`, causing content to flash for ~0.1s on page load before CSS applied. Added inline style and switched JS to direct `style.display` control instead of CSS class toggling.
- [x] Revert: **HTP keyboard hints** — `.htp-keys` wrapper + `.htp-key-alt` badge removed; KEYBOARD section restored to v1.0.5 (SPC, C, Pause, Mute labels).

---

## ✅ Completed: v1.0.6 Post-fixes & Additions — by Claude (2026-05-23)

- [x] Feat: **Privacy Policy page** (`privacy.html`) — cookie/patronage disclosure, no-personal-data statement, third-party service list (Vercel, Upstash, Google), contact info; neon Glowtris design.
- [x] Feat: **Terms of Service page** (`terms.html`) — usage rules, leaderboard rules, patronage disclosure, no-warranty disclaimer; neon Glowtris design with "Play Glowtris" CTA button.
- [x] Feat: **Footer links** — PRIVACY · TERMS links added to start screen glass panel.
- [x] Feat: **Automatic performance mode** — monitors FPS every second; below 30 FPS enables low-perf mode (skip nebulae/gradients, remove all canvas shadowBlur, halve/disable particles, strip CSS glow/backdrop-filter); above 50 FPS restores effects; ⚡ PERF MODE corner indicator fades in/out; 3-second cooldown prevents rapid toggling.

---

## ✅ Completed: Refactor & Clean Code Pass — by Claude (2026-05-23)

- [x] Consolidated duplicate `#htp-overlay` / `#stats-overlay` CSS into shared selectors
- [x] Extracted `spawnHardDropParticles()` from `hardDrop()` for single-responsibility
- [x] Fixed `openStats()` local variable shadowing (`sCombo`/`sMaxLn` instead of `maxCombo`/`hiScore`)
- [x] Fixed `_statsOpenTs` declaration hoisting (moved before `openStats` definition)
- [x] Moved `_lbCache` to state section alongside other state variables
- [x] Added `.footer-link` CSS class; removed inline `onclick` handlers on footer links
- [x] Removed unused `const t=Date.now()*.001` from `drawBackground()`
- [x] Removed dead low-perf CSS selectors (`.action-btn`, `#game-canvas-wrap` overrides)
- [x] Removed WHAT comments throughout; kept only WHY comments

---

## ✅ Completed: v1.0.7 (Keyboard Parallax & iPad Fit) — by Claude (2026-05-24)

- [x] Feat: `nudgeUI(dx, dy)` — on ArrowLeft/Right, `#app` snaps ±2px horizontally then springs back via `cubic-bezier(0.34,1.56,0.64,1)` in 0.18s. Up/down and hard-drop excluded.
- [x] Fix: `applyShake()` now only shakes on X-axis (`translate(Xpx, 0)`) — no more vertical screen shake.
- [x] Fix: `overscroll-behavior:none` added to html/body — prevents rubber-band scroll on iPad.
- [x] Fix: `_applyTouchCELL` subtracts 8px from `availH` and 8px from `availW` — board stays fully visible without clipping on iPad.
- [x] Updated README.md roadmap and this file.

---

## ✅ Completed: Robust Touch Layout Fix — by Claude (2026-05-24)

- [x] CSS: `#game-row { flex:1 1 0; min-height:0; align-items:center; justify-content:center }` added under `@media (pointer:coarse)` — row fills all remaining space between header and controls.
- [x] JS: Replaced fragile manual `headerH`/`ctrlH`/`frameH` arithmetic in `initLayout()` with a `ResizeObserver` on `#game-row`; `_applyTouchCELL()` reads actual `clientHeight` and sets CELL.
- [x] Removed `requestAnimationFrame` re-layout call (no longer needed — ResizeObserver fires after layout is complete, handles iOS safe-area timing automatically).
- [x] Updated README.md roadmap and this file.

---

## ✅ Completed: v1.0.8 (Accessibility & Visual Polish)

- [x] Task 1: **Colorblind Mode** — toggle in pause menu; when enabled, draws a distinct stripe or dot pattern over each piece colour (7 unique patterns: I=══, O=○, T=△, S=/, Z=\, J=║, L=✕). Persisted to `localStorage` (glowTrisColorblind). Works on board, current piece, and next/hold mini-preview canvases.
- [x] Task 2: **Animation Intensity Setting** — three-way cycle in pause menu: `Full` (default) / `Low` (no shake, no drop trail, fewer particles) / `Off` (no particles, no shake, no flash, no combo/rainbow effects). Persisted to `localStorage` (glowTrisAnim). Hooked into applyShake, triggerScreenFlash, triggerAllClearFlash, spawnLineClearParticles, spawnLockParticles, spawnHardDropParticles, spawnDropTrail, and lockPiece combo/rainbow assignments.
- [x] Task 3: **UI Refinements** — cb-active CSS class for colorblind-on state (cyan glow border). Version label bumped to v1.0.8.
- [x] Task 4: **Footer Two-Line Split** (privacy.html & terms.html) — already done in previous session.
- [x] Task 5: Update `README.md` roadmap and this file after completion.

---

## ✅ Completed: v1.0.8.1 (Performance & Visual Overhaul) — by Claude (2026-05-24)

- [x] **Cell sprite cache** (`getCellSprite`): pre-renders each of 7 piece colors into a PAD-padded offscreen canvas once; `drawCell` blits via `drawImage` (GPU path). Eliminates ~400 `createLinearGradient` creates/frame.
- [x] **Baked glow**: `shadowBlur=12` rendered into sprite pixels (PAD=14 so glow isn't clipped). All placed blocks glow at zero per-frame cost.
- [x] **Glow threshold `glow > 1.2`**: board cells (glow=1) skip live shadowBlur entirely; active piece (glow=1.5) keeps it. Saves ~200 shadowBlur ops/frame — the single most expensive iOS canvas op.
- [x] **Nebula bounding-box clip**: `fillRect` limited to nebula circle bounds, reducing fill area ~50% per nebula.
- [x] **CSS border/boxShadow cache** (`_lastBorderColor`): `gc.style` only updated on piece color change, not 60×/s.
- [x] **Perf mode tuned**: requires 2 consecutive seconds below 28fps (`_fpsLowCount`); 3s startup holdoff (`_perfHold=3`); sprites pre-warmed at `startGame()` to avoid first-frame spike.
- [x] **Refined neon color palette**: J `#0055ff`→`#2979ff` (dark blues glow muddy), S `#00ff88`→`#00ffaa` (mint vs acid lime), T `#bf00ff`→`#cc00ff`, Z `#ff2255`→`#ff2040`.
- [x] **Ghost piece rebalanced**: stroke 0.32/1.5px, fill 0.04 alpha, explicit `shadowBlur=0` — visible but never flashy.
- [x] **Bug fix — blank start screen on Chrome Mac**: `#overlay` moved from inside `.game-wrap` to `<body>` level; `display:none` default prevents dark blocking overlay if JS fails; z-index bumped to 20.
- [x] Version label bumped to v1.0.8.1; README roadmap updated.

---

## ✅ Completed: v1.0.8.2 (Perf Mode: Full UI Effect Kill + Bug Fixes) — by Claude (2026-05-24)

- [x] **Static background in low-perf**: `drawBackground()` now paints a solid `#000010` fill only — no stars, no nebulae, zero `createRadialGradient` calls per frame.
- [x] **Canvas overlays bypassed**: `comboFlash`, `rainbowBorder`, `dangerPulse` (red vignette), `levelUpScanline` all guarded with `!lowPerfMode`; reset to 0 instantly on entry so no stale frames bleed through.
- [x] **Flash & shake killed**: `triggerScreenFlash()` and `triggerAllClearFlash()` early-return in low-perf; `applyShake()` early-return in low-perf.
- [x] **`triggerLevelUpVisuals()` no-op**: scale-pop animation on level/BPM labels skipped entirely in low-perf.
- [x] **CSS animations off** (`html.low-perf`): `.dh-title` animation:none (static cyan text), `#screen-flash` display:none, `#level-bar` box-shadow:none + instant transition, `.new-best-badge`/`#combo-label` animation:none, `.scale-pop-active` animation:none.
- [x] **Button effects stripped** (`html.low-perf`): `.action-btn` hover glow/scale/shimmer `::after` all off; `.tbtn` backdrop-filter and press box-shadow off; `.toggle-btn` hover/active glow off; `.toggle-btn.cb-active` box-shadow off.
- [x] **Bug fix**: `nc`/`hc` undefined in desktop `initLayout()` — split-canvas refactor renamed `nc`→`ncD/ncM`, `hc`→`hcD/hcM` but left two bare references on lines 956-957; corrected to four split-canvas variables.
- [x] Version label bumped to v1.0.8.2; README roadmap and TODO updated.

---

## ✅ Completed: v1.0.9 (Daily Challenge + Achievement System) — by Antigravity (2026-05-24)

- [x] Task 1: **Date-Seeded RNG** — seeded PRNG (mulberry32) initialised from `YYYYMMDD` string so every player worldwide draws the same piece sequence each day.
- [x] Task 2: **Daily Gate** — check `localStorage` key `glowTrisDailyDate`; if already played today, show "Come back tomorrow" overlay with remaining time countdown instead of starting the game.
- [x] Task 3: **Start Screen Entry Point** — `DAILY CHALLENGE` button below `START GAME` on start screen; switches game into daily mode for that session.
- [x] Task 4: **Daily Leaderboard** — separate Redis key `daily:<YYYYMMDD>`; score-based (higher = better); TODAY tab only; rank shown after submission; leaderboard accessible from start screen.
- [x] Task 5: **Challenge Game-Over Screen** — shows 🏅 badge, rank, and a dedicated share card with "Glowtris Daily Challenge — [date]" header, score, rank, and lines.
- [x] Task 6: **Achievement Definitions** — 20 milestones stored as a static array; each has `id`, `label`, `description`, `icon` (emoji), and check triggers in-game.
- [x] Task 7: **Unlock Trigger** — newly unlocked achievements fire a neon gold toast popup (bottom of screen, 2.5s) with icon, label, description, and gold particle burst.
- [x] Task 8: **Persistence** — unlocked achievement IDs and dates saved as JSON array to `localStorage` (glowTrisAchievements); lifetime cumulative stats (`totalLines`, `totalGames`, `totalGlowtris`) tracked separately in `glowTrisLifetime`.
- [x] Task 9: **STATS Overlay Badge Gallery** — new "ACHIEVEMENTS" section at the bottom of the STATS overlay; locked badges shown as dim grey, unlocked as coloured with unlock date tooltip.
- [x] Task 10: Update `README.md` roadmap and this file after completion.

---

## ✅ Completed: Canvas Height Stretch Bugfix — by Claude (2026-05-24)

- [x] **Root cause**: `_applyTouchCELL()` early-return condition checked `gc.width === gameW` but NOT `gc.height === gameH`. HTML canvas defaults to `height=150`; on iPad landscape (or any large touch screen where `newCELL` is capped at 30), `gc.width` happened to already equal `gameW=300` (COLS×30), so the early return fired — leaving `gc.height=150` while `gc.style.height` was already set to `600px`. Result: 4× vertical canvas stretch (canvas buffer squished into top-quarter, then CSS-scaled back up), making pieces appear tall and distorted.
- [x] **Fix**: Added `gc.height === gameH` to the early-return guard on line 1120: `if (newCELL === CELL && gc.width === gameW && gc.height === gameH) return;` — one-line change, zero side effects.
- [x] **Scope**: iPad landscape + large touch screens only. Portrait mode was immune because `availH / ROWS` resolved to 28 (not capped), so `newCELL ≠ CELL` and the buffer was always updated correctly.

---

## ⚠️ Open Bug: iOS PWA Canvas Oversizing on Cold Start

**Symptom:** On iOS PWA (Add to Home Screen), the game canvas loads **larger than intended** at cold start. After the first resize event (orientation change, etc.) the size corrects itself. Safari browser is unaffected.

**Root cause (diagnosed by Claude, 2026-05-24):**
- `env(safe-area-inset-*)` is not resolved in JS even after one `requestAnimationFrame` on iOS PWA cold start
- The current RAF "correction" in `_applyTouchCELL()` reads `appPadV = 16px` (safe-area = 0) instead of the real `~81px`
- This makes the canvas **larger** than the sync estimate, not smaller
- The `resize` skip guard (`bgc.width/height` tolerance check, line ~1222) then blocks self-correction because safe-area settling doesn't change `window.innerHeight`

**Full analysis and both fix options are documented in `WALKTHROUGH.md` → "Open Bug Report" / "The Great Fumbling & Deployment Incident" sections.**

### 🚨 The Great Fumbling & Deployment Incident (2026-05-24)
- **Fumbling:** The agent (Antigravity) mistakenly merged Option A directly to master and bumped version to `v1.0.9.1` before the user could test/compare both options. Following the user's order ("roll it back"), master was rolled back to `f0a414d` and the `v1.0.9.1` tag deleted.
- **Rescue:** The branch previews originally returned 404. The agent checked out both branches locally, ran manual Vercel builds (`vercel --yes`), and assigned the custom domain aliases (`vercel alias set`) so that both options are fully accessible at:
  - **Option A (Arithmetic):** https://prevglow-a.vercel.app
  - **Option B (Polling):** https://prevglow-b.vercel.app

### 🛠️ Active Task Checklist: Build & Verify Both Options
We must fully implement and polish the actual code on both branches (which are currently templates/drafts):

- [x] **Task 1: Complete Option A (Arithmetic Fix) on `hotfix/option-a-arithmetic`**
  - Checkout `hotfix/option-a-arithmetic`
  - Remove all ResizeObserver, RAF races, and PWA observers from `initLayout()`
  - Implement standard hardcoded layout calculations `availH = H - headerH - ctrlH - frameH`
  - Completely relax the `resize` skip guard to guarantee orientation and size self-corrections
  - Verify and deploy to `prevglow-a.vercel.app`
- [x] **Task 2: Complete Option B (Polling Fix) on `hotfix/option-b-polling`**
  - Checkout `hotfix/option-b-polling`
  - Keep dynamic layout calculations `appEl.clientHeight - appPadV`
  - Implement a recursive RAF polling loop (`_waitForSafeArea`) retrying up to 15 frames (~250ms) on iOS PWA cold start
  - Increase the `resize` skip guard threshold to 60px to absorb home indicator dvh jumps
  - Verify and deploy to `prevglow-b.vercel.app`
- [x] **Task 3: Compare and present results**
  - Facilitate user testing of both PWA instances and gather feedback before master merge

---

## ✅ Completed: v1.0.9.1 (iOS PWA Canvas Sizing Fix) — merged to master (2026-05-25)

- [x] Option A (arithmetic) merged: hardcoded safe area values per device using `navigator.standalone` + `screen.height`
- [x] Dynamic Island (ph≥852→59px), large notch (ph≥844→47px), small notch (ph≥780→44px), no notch (<780→20px), Face ID iPad (ph≥1100→24px)
- [x] ResizeObserver and RAF polling loop removed; `_applyTouchCELL()` is now fully synchronous on cold start
- [x] Min cell size lowered 18→10px to handle split-screen/landscape short viewports

---

## ✅ Completed: Challenge ALL TIME Leaderboard + TOP split — by Claude (2026-05-25)

- [x] **Challenge ALL TIME board** (`challenge:alltime` Redis key, permanent, trimmed to top 100): new tab in challenge mode alongside TODAY
- [x] **Leaderboard TOP split**: TODAY / WEEKLY / CHALLENGE-TODAY → top 10; MARATHON ALL TIME / CHALLENGE ALL TIME → top 20
- [x] `getBoard(key, limit=TOP)` updated with optional limit param; all call sites updated
- [x] Merged to master via PR #2

---

## ✅ Completed: Pre-v1.1 Refactor & English Cleanup — by Claude (2026-05-25)

- [x] Extracted `_saveGameStats()` from `endGame()` for single-responsibility
- [x] Extracted `_renderGameOverScreen(stats)` from `endGame()`
- [x] `LS` constant object centralising all 21 localStorage key strings
- [x] All Korean strings in README.md / TODO.md / WALKTHROUGH.md translated to English

---

## ✅ Completed: v1.0.9.2 (BGM Upgrade + Challenge Background + Flash Fix) — by Claude (2026-05-25)

### Merged to master via PR #3 — tagged v1.0.9.2 ✅

- [x] **BGM 4-Track Upgrade (Normal)**: melody (square wave) + harmony (triangle, parallel 3rds) + walking bass (quarter-note changes: A-E-A-C / F-F-C-E / A-A-G-G / C-D-A-A) + kick/snare/hihat drums
- [x] **Challenge BGM Overhaul**: A harmonic minor (G# leading tone), tritone dissonance in harmony, chromatic bass (Bb/G# each bar), double-kick + 16th-note hihat wall, base BPM 135→165
- [x] **Drum bit-flags**: pattern values are now bitmasks (bit0=kick, bit1=snare, bit2=hihat) allowing simultaneous hits (e.g. 5=kick+hihat, 6=snare+hihat)
- [x] **Challenge-exclusive background** (`_drawChallengeBg()`):
  - Dark crimson fade `rgba(10,0,3,0.22)` instead of cool blue
  - Red/amber nebulae (hue clamped 0-55, 1.7× drift speed)
  - Diagonal meteor shower with amber glow trails
  - Pulsing amber core glow rising from bottom
  - Edge vignette — 4-directional linear gradients (top/bottom 14%H, sides 10%W), dark red `rgba(160,0,10)`, alpha 0.07 (portrait-safe; replaced broken radial gradient)
- [x] **First-load flash fix**: `#overlay` was `display:none` in HTML → game panels visible on first browser paint before JS ran. Fixed by moving `display:flex` into CSS default; overlay covers game UI from frame 0.
- [x] Stars gain `.vx` property for diagonal meteor rain (ignored in normal mode)
- [x] Low-perf mode uses `#0a0002` dark red background in challenge vs `#000010` normal
- [x] **Deployment rules**: added to `CLAUDE.md` + `AGENTS.md` — no manual `vercel` CLI, no micro-fix pushes to preview, one feature = one merge

---

## ✅ Completed: v1.0.9.3 (T-Spin Mini + Leaderboard Dedup + OG Image) — by Claude (2026-05-25)

- [x] **T-Spin Mini detection**: `checkTSpin()` now returns `'full'` / `'mini'` / `false` by inferring T-piece rotation from shape matrix and applying front/back corner distinction. Mini T-Spin scores: 0/200/400×level (vs Full: 400/800/1200/1600×level). `showScorePopup()` shows distinct "T-SPIN MINI" label.
- [x] **Leaderboard deduplication**: `deduplicateAndAdd()` helper scans each sorted set for entries matching `cleanName`, removes stale ones via `ZREM`, then adds the new entry — but only if the new score is a personal best. Applied to all 5 boards (ALL TIME, daily, weekly, challenge-today, challenge-alltime).
- [x] **OG image PNG endpoint** (`/api/og`): Edge Function using `@vercel/og` renders a 1200×630 PNG with neon block grid mark, GLOW+TRIS title with glow effects, and grid background. No JSX or React dependency — VNodes built with plain `h()` helper.
- [x] **Social meta tags**: updated `og:image` and `twitter:image` to `/api/og` (PNG). Added `og:site_name`, `og:locale`, `og:image:alt`, `twitter:image:alt`, `og:image:type`. Works on Twitter/X, KakaoTalk, Discord, Line, Slack, Facebook.
- [x] Version bumped to v1.0.9.3.

---

## ✅ Completed: v1.0.9.4 (Hotfix — PC Panel Overflow + PC Perf) — by Claude (2026-05-25)

- [x] **Hold/Next panel overflow fix**: With `box-sizing: border-box` globally applied, `.panel { width: 132px; padding: 16px 14px; border: 1px; }` left only 102px content space while `ncD.width = 4 × CELL = 120px` overflowed by 18px. Fixed by widening panel to `width: 150px` (120px canvas + 14px×2 padding + 1px×2 border = 150px exact fit).
- [x] **drawNext/drawHold hardcoded dims fix**: `drawMiniPiece(ncDx, next, 108, 96)` and `drawMiniPiece(hcDx, held, 108, 80)` used stale hardcoded dimensions mismatched from actual canvas size (120×90). Now use `ncD.width, ncD.height` and `hcD.width, hcD.height` for correct centering.
- [x] **PC performance**: Background gradient caching (every 4 frames), static low-perf gradient for Intel iGPU (auto-detected via WEBGL_debug_renderer_info), `_perfLocked` removed so user can exit perf mode.
- [x] Version bumped to v1.0.9.4.

---

## ✅ Completed: Post-v1.0.9.4 Fixes — by Claude (2026-05-25)

- [x] **Low-perf background gradient strengthened**: Centre radial glow opacity 0.55→0.85, radius widened to 0.85×, top accent 0.10→0.22, bottom vignette added. Normal mode: deep navy core; Challenge mode: deep crimson core.
- [x] **Memory leak fixes (critical — caused browser/OS freeze)**:
  - Audio node leak: BGM voices (kick/snare/hihat/note) created 2–3 AudioNodes per beat; only source tracked in `bgmNodes[]`; companion GainNode/BiquadFilterNode never `disconnect()`ed → AudioContext accumulated thousands of orphaned nodes per game. Fixed with `_bgmRegister(src, ...rest)` helper that tracks ALL nodes and disconnects all on `onended`. `stopBGM()` now also calls `disconnect()` on every node.
  - BGM scheduler backlog: tab hidden → RAF pauses but `setTimeout` keeps running → `bgmScheduleLoop` while-loop creates huge backlog on return. Fixed: `visibilitychange` suspends AudioContext + stops scheduler on hide; resumes on show. Added `bgmNextTime` clamp guard.
  - WebGL context not released: `_detectLowEndGPU()` canvas held GPU memory. Fixed: `WEBGL_lose_context.loseContext()` called immediately after reading renderer string.
  - `showStartScreen()` now cancels `gameLoop` and switches to lightweight `bgOnly` loop (background-only).
  - `beforeunload`: explicitly stops BGM, cancels RAF, closes AudioContext.
- [x] **Vercel team rename**: team slug `seonqwer-3337s-projects` → `sgkwon-team` (same team ID). Updated CLAUDE.md, README.md, and `vercel-status.yml`.
- [x] **Environment variables documented**: `UPSTASH_REDIS_REST_URL` and `UPSTASH_REDIS_REST_TOKEN` (production + preview) documented in CLAUDE.md and README.md Infrastructure section.
- [x] **GitHub Actions — Vercel status tracking** (`.github/workflows/vercel-status.yml`):
  - v1: used GitHub Deployment API → created duplicate records (Vercel GitHub App + our workflow) → hit GitHub deployment rate limit.
  - v2 (current): uses **Commit Status API** (`repos.createCommitStatus`) instead — no deployment records created, zero conflict with Vercel GitHub App. Shows as `Vercel / Preview — Building… → Deployed ✓` on commits. Requires `VERCEL_TOKEN` secret.
- [x] **Vercel ignored build step cleared**: `git diff HEAD^ HEAD --quiet` was causing all preview deployments to be immediately CANCELED (shallow clone in Vercel build environment → `HEAD^` unavailable → exit 0 → skip). Cleared via PATCH API.

---

## ✅ Completed: Post-v1.0.9.4 CI/Infra Hardening — by Claude (2026-05-25)

### Incident recap (2026-05-25)
A cascade of mistakes hit both the GitHub deployment rate limit AND Vercel's 100/day cap simultaneously:
1. `vercel-status.yml` v1 used `repos.createDeployment()` — doubled Vercel GitHub App's deployment records, hit GitHub's rate limit ("deployment rate limited - retry 24 hours").
2. Iterative `vercel` CLI runs + empty commits + rapid pushes burned through Vercel's 100/day cap.
3. `commandForIgnoringBuildStep` was set to `git diff HEAD^ HEAD --quiet` — Vercel shallow clone has no `HEAD^`, so every build was silently skipped.
4. Team rename (`seonqwer-3337s-projects` → `sgkwon-team`) left hardcoded slug references in the workflow that silently broke API calls.

### What was fixed
- [x] **`vercel-status.yml` rewritten (v2)**: uses `repos.createCommitStatus()` (Commit Status API) instead of `repos.createDeployment()`. Zero conflict with Vercel GitHub App, zero duplicate records, no rate limit risk.
- [x] **`vercel-status.yml` v3 — stable IDs**: replaced `teamId=sgkwon-team` (slug, breaks on rename) with env vars `VERCEL_TEAM_ID=team_pb1objuXoHlJIv67jumHZrg8` and `VERCEL_PROJECT_ID=prj_V1lhSONnxAM9K2hpk5VLtemldWnm` (permanent IDs). Added `projectId` filter to deployments list API to avoid picking up other projects.
- [x] **`commandForIgnoringBuildStep` cleared**: set to `null` via Vercel PATCH API. NEVER re-add `git diff HEAD^ HEAD --quiet`.
- [x] **CLAUDE.md hardened**: added 7 rules covering GitHub Actions + Vercel integration, plus `🔁 Mandatory Release Workflow` section with full step-by-step process.

### Vercel Deployment Checks — analysed, no action needed
- Deployment Checks gate **production domain aliasing** only (not builds, not preview deploys).
- They require checks to pass before `glowtris.vercel.app` gets updated after a production build.
- Our PR-based workflow (prevglow → user confirms → PR merge) already provides this exact gate manually.
- **Decision**: leave Vercel Dashboard → Settings → Deployment Checks empty. Current process is sufficient.

### Pipeline status at close of session (2026-05-25 ~06:00 UTC)
- `prevglow.vercel.app` is on commit `5f402981` (04:59 UTC) — **memory leak fixes from `c07f206` NOT yet deployed**
- All subsequent pushes are `CANCELED` (Vercel 100/day limit still active, resets midnight UTC 2026-05-26)
- Next push after midnight UTC will deploy `c07f206` (memory fixes) + all subsequent commits automatically
- PR #4 (`preview` → `master`) is open and ready to merge once preview is verified post-reset

### 🔁 Post-UTC-Midnight Release Checklist (User Action Plan)
Once Vercel's daily limit resets, follow these precise steps to complete the release:

1. **Verify Preview Deployment:**
   - Confirm `prevglow.vercel.app` is successfully auto-deployed with the latest memory leak and stability fixes.
2. **Merge PR #4 on GitHub:**
   - Merge `preview` → `master` on GitHub.
   - This automatically triggers the production build and deploys to `glowtris.vercel.app`.
3. **Checkout and Pull Master Locally:**
   ```bash
   git checkout master
   git pull
   ```
4. **Create & Push Dual Release Tags:**
   ```bash
   git tag -a v1.0.9.3 -m "T-Spin Mini + leaderboard dedup + OG image"
   git tag -a v1.0.9.4 -m "Hotfix: PC panel overflow + perf + memory leaks"
   git push origin v1.0.9.3 v1.0.9.4
   ```
5. **Sync Preview Branch Back to Master:**
   ```bash
   git checkout preview
   git merge master
   git push origin preview
   ```

### Confirmed mandatory workflow going forward
```
feature/xxx → preview (verify) → PR to master (user approves) → merge → (tag if versioned)
```

---

## ✅ Completed: Pre-v1.1 API Hardening — by Claude (2026-05-29)

- [x] **60s edge cache**: GET `/api/leaderboard` now sets `Cache-Control: s-maxage=60, stale-while-revalidate=30`. Vercel edge network serves cached responses, reducing Redis reads ~50%. Extends Upstash free ceiling from ~416 DAU to ~700 DAU at zero cost — v1.1's 500 DAU target is now safely within the free tier.
- [x] **Rate limiting**: IP-based limit of 5 POST submissions per 60s window. Uses a Redis `INCR` key with `EXPIRE` TTL (costs 1–2 commands on hot path). Returns HTTP 429 on violation.
- [x] **Score validation**: Rejects submissions where score is not a positive integer ≤ 10,000,000 (≈ 4+ hours of perfect play). Prevents obvious spoofed entries without server-side game simulation.

---

## ✅ Completed: Pre-v1.1 Code Polish & Bug Fixes — by Claude (2026-05-29)

8 issues found and fixed in a full pre-v1.1 code audit:

- [x] **Bug: `lockPiece()` 120ms timeout board corruption** — if a line clear and game over coincide (piece locks on the same frame as top-out), the 120ms board-splice callback fires after `_doStartGame()` has replaced `board`, corrupting the new game's fresh board. Added `if(!gameRunning&&!gameOver)return` guard.
- [x] **Leak: `unlockSpeaker()` looping audio never stopped** — silent WAV created for iOS speaker routing looped indefinitely. Now stopped after 1s (routing persists after initial unlock).
- [x] **Bug: `_gateTimer` interval leaked** — daily countdown interval was not cleared when `showStartScreen()` was called; kept firing every second with a stale DOM reference. Added `clearInterval(_gateTimer)` to `showStartScreen()`.
- [x] **Perf: `unlockAchievement()` localStorage on every call** — called 5–10 times per piece lock (combo_5, combo_10, score_50k, lines_100, etc.), each doing `JSON.parse(localStorage.getItem())`. Now uses `_achievementsCache` (lazy-loaded, write-through).
- [x] **Perf: `lockPiece()` lifetime stats localStorage** — `JSON.parse(localStorage.getItem(LS.LIFETIME))` on every line clear. Now uses `_lifetimeCache`.
- [x] **Perf: `updateKeyGuideState()` getElementById on every keydown/keyup** — hot path called on every key event. Pre-cached all 7 key-guide refs in `_keyGuide` map at startup. Simplified `classList.add/remove` → `classList.toggle`.
- [x] **Perf: `showScorePopup()` getElementById on every score change** — added `$scorePopup` to DOM cache block.
- [x] **Perf: particle array unbounded growth** — rapid combo + all-clear could push 500+ particles/frame. Added `MAX_PARTICLES=400` cap; `spawnLineClearParticles`, `spawnHardDropParticles`, `triggerAllClearFlash` all bail early when at cap.

---

## ✅ Completed: Pre-v1.1 INP Fix — by Claude (2026-05-29)

Root cause: Vercel Analytics reported INP 568ms ("poor" — threshold is >500ms). The existing `// Hide overlay immediately` comment in `startGame()` was a false fix — `display='none'` does not trigger an immediate paint; the browser batches style changes until the JS call stack empties. All synchronous init work (loadSettings, sprite cache warm, canvas draws, BGM init) was blocking the main thread before the browser could paint the click response.

- [x] **`startGame()` split**: DOM change (`$overlay.style.display='none'`) + `setTimeout(_doStartGame, 0)`. The browser now paints overlay-hidden state before any init runs. Estimated INP: 568ms → <50ms.
- [x] **`openStats()` split**: `display='flex'` fires immediately; achievement HTML (20-badge template string) generated in `requestAnimationFrame` callback. Overlay appears instantly; content fills in within one frame (~16ms).
- [x] Root cause documented: `setTimeout(0)` empties the JS call stack, allowing the browser's rendering pipeline (style recalc → layout → paint → composite) to run before the next macrotask.

---

## 🔮 Planned: Pre-v1.1 — Domain + Donation URL

### Domain Setup (user action)
- [ ] **Purchase domain** (e.g. `glowtris.com`) and add to Vercel project.
- [ ] **After domain is live**: update `og:url` in `index.html` (`https://glowtris.vercel.app` → new domain), update `README.md` production URL, update `ROBOT.md` dashboard/URL references, redeploy.

### Donation URL
- [x] Ko-fi account set up: `https://ko-fi.com/sorrysungkwon`
- [x] Donation UI implemented — merged to master via PR #9 (2026-05-30)

### Developer Experience DX (Antigravity Suggestion)
- [x] **Local Dev Shortcut**: Added `"scripts": { "dev": "npx serve . -p 3000" }` to `package.json`. Run `npm run dev` to serve locally at http://localhost:3000.

---

## ✅ Completed: v1.1 — Sprint Mode + iPad Keyboard — by Claude (2026-05-30)

> DAU goal: **500** | Key driver: sprint time share card virality + Reddit r/webgames launch
> ✅ **Infrastructure ready**: 60s edge cache extends Upstash free ceiling to ~700 DAU — v1.1's 500 DAU target is within the free tier. No upgrade required before launch.

- [x] Task 1: **Sprint Mode Engine** — `SPRINT_LINES=40`; `isSprintMode` flag; timer starts at `_doStartGame()` just before first RAF; `lockPiece()` captures `_sprintEndTime` and calls `endSprint()` via 120ms callback after board flash. Top-out shows "SPRINT FAILED" without polluting marathon stats.
- [x] Task 2: **Sprint HUD** — `fmtTime(ms)` formats as `SS.cc` / `M:SS.cc`. `updateSprintTimer()` runs every frame (repurposes `score-display` as live stopwatch). Panel title changes: SCORE→TIME, CLEARED→LEFT. Progress bar = lines cleared / 40.
- [x] Task 3: **Mode Selector** — PLAY button opens card UI with MARATHON / ⚡ SPRINT 40L / 🏆 DAILY CHALLENGE, each with description and personal record. 3-2-1 animated countdown (per-number colours, scale animation, expanding rings, GO! flash + SFX).
- [x] Task 4: **Sprint Leaderboard** — `api/leaderboard.js`: `KEY_SPRINT` / `KEY_SPRINT_DAILY` / `KEY_SPRINT_WEEKLY` Redis keys; `getSprintBoard()` ascending; `deduplicateAndAddSprint()` keeps lower time; rank = `zcount(-inf, time-1)+1`. GET `?mode=sprint` and POST `mode:'sprint'` fully wired. Start screen lb toggle: MARATHON | ⚡ SPRINT | 🏆 DAILY.
- [x] Task 5: **Sprint Canvas Share card** — `captureSprintImage()`: green neon border, SPRINT 40L title, large time, LPM, rank, "Can you beat it?" caption. `shareSprintScore()` uses Web Share API / clipboard fallback.
- [x] Task 6: **Reddit r/webgames launch post** — pending (user action on release day).
- [x] Task 7: **Docs + tag** — `README.md` roadmap updated, `TODO.md` milestone marked ✅, version tag `v1.1` pushed.

### v1.1 Post-fixes (iPad keyboard mode) — by Claude (2026-05-30)

- [x] **iPad kb-mode**: First keydown on coarse-pointer tablet (`Math.min(screen.w,screen.h) ≥ 600px`) adds `html.kb-mode` → shows desktop side panels, hides mobile header + touch controls. Touch anywhere restores touch mode. Phones always keep touch UI.
- [x] **Keyboard nudge fix**: `_nudgeActive` flag prevents `applyShake()` from clearing transform during spring animation. `void offsetWidth` forced reflow replaces setTimeout approach — snap position guaranteed before spring. Displacement 2→12px, `cubic-bezier(0.15,2.8,0.5,0.82)` strong overshoot bounce.
- [x] **GNB mini-canvas size**: `Math.max(26, Math.min(30, gameW * 0.10))` — iPad portrait 54→30px.
- [x] **Canvas blank on mode switch**: `_enableKbMode`/`_disableKbMode` now call `drawNext()+drawHold()` after `initLayout()`.
- [x] **Canvas size restore bug**: Desktop path no longer writes `ncM`/`hcM`; mini canvas resize moved before early-return in `_applyTouchCELL()` with size-change guard.

---

## 🔮 Planned: Pre-v1.2 — Architecture Review
> DAU goal: — | Key driver: code health before multi-mode complexity
> ⚠️ **Upstash PAYG trigger**: ~700 DAU exhausts the free tier even with cache. Switch to Pay-as-you-go (~$1/mo) before or at v1.2 launch.

`index.html` is **4,059 lines** after v1.1. Decide the code architecture before adding more game modes:

- [ ] **Measure**: Count lines, functions, and variable count after v1.1 merge.
- [ ] **Decide**: Keep single-file with stricter section discipline OR introduce a minimal build step (e.g. `npx esbuild` to bundle separate CSS/JS source files into one `index.html` at deploy time — preserves single-file output while making source maintainable). *(Antigravity Suggestion: Highly recommended to avoid massive single-file bloat before introducing multi-mode complexity in v1.2)*.
- [ ] **If build step chosen**: Set up `package.json` + build script; verify Vercel builds correctly; update `ROBOT.md` single-file rule.
- [ ] **JS error monitoring**: Add `window.onerror` → structured `console.error` with version tag. Consider Sentry free tier (5K errors/month) if unhandled errors become frequent after Reddit launch.

---

## 🔮 Planned: v1.2 — Ultra Mode + Streak
> DAU goal: **700** | Key driver: time-pressure mode + daily return habit

- [ ] Task 1: **Ultra Mode Engine** — 2-minute countdown; score as many points as possible; game ends at 00:00.
- [ ] Task 2: **Ultra HUD** — countdown timer replaces remaining-lines HUD; score multiplier ramps in final 30 seconds.
- [ ] Task 3: **Mode Selector expanded** — Marathon / Sprint / Ultra / Daily Challenge on start screen.
- [ ] Task 4: **Ultra Leaderboard** — separate Redis leaderboard, descending sort (highest score wins), TODAY / WEEKLY / ALL TIME.
- [ ] Task 5: **Ultra Canvas Share card** — score + time survived + rank.
- [ ] Task 6: **Basic daily streak counter** — track consecutive days played in `localStorage`; streak badge displayed on start screen and game over screen; streak resets to 0 if a day is missed.
- [ ] Task 7: Update docs and push version tag `v1.2`.

---

## 🔮 Planned: v1.3 — Training & Finesse
> DAU goal: **1,200** | Key driver: skill progression loop

- [ ] Task 1: **Practice Mode** — no game over, no timer; press Escape to exit; pieces reset board every 200 lines.
- [ ] Task 2: **Finesse Counter** — track wasted keypresses vs optimal input per piece; display finesse error count on game over.
- [ ] Task 3: **Speed Metrics** — PPS (pieces per second) and LPM (lines per minute) displayed on game over and STATS overlay.
- [ ] Task 4: **Per-piece heatmap** (STATS overlay) — show which pieces caused the most finesse errors.
- [ ] Task 5: Update docs and push version tag `v1.3`.

---

## 🔮 Planned: v1.4 — Visual Customization
> DAU goal: **1,800** | Key driver: personal expression & shareability

- [ ] Task 1: **Board skin selector** — 4 themes: Neon (current default) / Midnight / Pastel / Classic. Affects background, grid, and panel colours. Persisted to `localStorage`.
- [ ] Task 2: **Piece colour palette presets** — 3 palettes: Vivid (current) / Muted / Monochrome. Rebuilds cell sprite cache on change.
- [ ] Task 3: **BGM track selection** — user can pin a preferred track (Track 1 / Track 2 / Track 3 / Shuffle). Persisted to `localStorage`.
- [ ] Task 4: Update docs and push version tag `v1.4`.

---

## 🔮 Planned: v1.5 — Weekly Events
> DAU goal: **2,500** | Key driver: recurring competitive events
> Note: Basic daily streak counter moved to v1.2.

- [ ] Task 1: **Weekly special challenge** — rotating rule modifier seeded per week (e.g., invisible pieces, narrower board, no hold). Separate Redis leaderboard with 7-day TTL.
- [ ] Task 2: **Monthly event leaderboard** — all-month leaderboard with Redis TTL; top 3 display gold/silver/bronze badge on profile.
- [ ] Task 3: Update docs and push version tag `v1.5`.

---

## 🔮 Planned: v1.6 — Ghost & Replay
> DAU goal: **3,500** | Key driver: self-competition loop

- [ ] Task 1: **Personal best ghost** — serialise input log of personal best run to Redis; render ghost piece trail 1 frame behind real piece during replay.
- [ ] Task 2: **Ghost race mode** — race against your own ghost in real time; ghost moves at your recorded pace.
- [ ] Task 3: **Shareable replay link** — encode input log as short-code; recipient can watch the run play out in a read-only spectator view.
- [ ] Task 4: Update docs and push version tag `v1.6`.

---

## 🔮 Planned: v1.7 — Advanced Stats
> DAU goal: **4,500** | Key driver: deep engagement for competitive players

- [ ] Task 1: **Expanded STATS overlay** — PPS, finesse rate (%), T-spin %, all-clear %, average combo, max combo, average score per game.
- [ ] Task 2: **Session history graph** — score sparkline for last 10 games; trend arrow (improving / declining).
- [ ] Task 3: **Weekly personal report** — auto-generated summary card each Monday: best time (Sprint), best score (Marathon), most achievements unlocked.
- [ ] Task 4: Update docs and push version tag `v1.7`.

---

## 🔮 Planned: v1.8 — Season & Rank System
> DAU goal: **6,000** | Key driver: long-term competitive ladder

- [ ] Task 1: **Monthly season** — season leaderboard resets on the 1st of each month; previous season rank archived to player profile.
- [ ] Task 2: **7-tier rank system** — Bronze / Silver / Gold / Platinum / Diamond / Master / Radiant; rank determined by season score percentile.
- [ ] Task 3: **Season rewards** — tier-exclusive title badge and board border unlock at end of each season; displayed permanently on profile.
- [ ] Task 4: **Season banner** on start screen — countdown to season end + current rank.
- [ ] Task 5: Update docs and push version tag `v1.8`.

---

## 🔮 Planned: v1.9 — Social Layer
> DAU goal: **8,000** | Key driver: word-of-mouth and friend competition

- [ ] Task 1: **Friend code system** — each user gets a 6-char code (derived from username hash); enter a code to follow; mutual follows create a friend pair stored in Redis.
- [ ] Task 2: **Friend leaderboard tab** — new tab in leaderboard overlay showing only followed players' scores.
- [ ] Task 3: **Async challenge** — "Challenge a Friend" button on game over shares a seeded run as a link; recipient plays the exact same sequence; results compared on a shared card.
- [ ] Task 4: Update docs and push version tag `v1.9`.

---

## 🔮 Planned: v2.0 — Real-time Multiplayer
> DAU goal: **15,000+** | Key driver: the platform shift

- [ ] Task 1: **WebSocket infrastructure** — integrate Pusher or Ably for real-time bidirectional communication; add API route for session management.
- [ ] Task 2: **1v1 Battle Mode** — matchmaking queue; garbage line mechanic (cleared lines send junk to opponent); first to top out loses.
- [ ] Task 3: **Battle HUD** — opponent board preview (mini, right panel); incoming garbage meter; attack/defence counter.
- [ ] Task 4: **Elo rating system** — per-player Elo stored in Redis; updated after each ranked battle; displayed on profile.
- [ ] Task 5: **Live spectator mode** — watch any ongoing public match; spectator count shown on match screen.
- [ ] Task 6: **Battle leaderboard** — ranked by Elo; TODAY (most battles) / ALL TIME (highest Elo) tabs.
- [ ] Task 7: Update docs, push version tag `v2.0`, upgrade infrastructure (Vercel Pro + Pusher).
