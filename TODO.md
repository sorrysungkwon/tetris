# Glowtris Agent Shared TODO & Guidelines

## 🚨 Behavioral Guidelines (Must read first!)
- **Single File Rule**: Always maintain the single `index.html` structure. No external frontend libraries allowed.
- **English-Only Rule**: All code changes, comments, logs, documentation, and Git commit messages MUST be written entirely in English.
- **Workflow Integrity**: Before starting any task, read this file and `README.md` first. After completing any task, update progress here (`[x]`) and in `README.md`'s roadmap, then execute `git add . && git commit -m "description" && git push`. When releasing a new version, always create and push an annotated tag: `git tag -a vX.Y.Z -m "Description" && git push origin vX.Y.Z`.

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

- [x] Feat: **Privacy Policy page** (`privacy.html`) — cookie/AdSense disclosure, no-personal-data statement, third-party service list (Vercel, Upstash, Google), contact info; neon Glowtris design.
- [x] Feat: **Terms of Service page** (`terms.html`) — usage rules, leaderboard rules, ad disclosure, no-warranty disclaimer; neon Glowtris design with "Play Glowtris" CTA button.
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

## 🔮 Planned: v1.1 (Sprint Mode)

- [ ] Task 1: **Sprint Mode Engine** — game ends when 40 lines are cleared; record elapsed time in milliseconds.
- [ ] Task 2: **Sprint HUD** — elapsed stopwatch (`01:23.45`) and remaining-lines counter replace score/level in sprint side panels.
- [ ] Task 3: **Mode Selector** — Marathon vs Sprint toggle on start screen; selection persists to `localStorage`.
- [ ] Task 4: **Sprint Leaderboard** — separate Redis leaderboard, ascending sort (fastest wins), TODAY / WEEKLY / ALL TIME tabs, rank shown after submission.
- [ ] Task 5: **Sprint Stats & Canvas Share** — STATS overlay and share image format sprint results (time, lines/min, rank) correctly.
- [ ] Task 6: Update `README.md` roadmap and this file after completion.
