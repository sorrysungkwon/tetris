# Glowtris

> **DEPLOY & RELEASE RULE:** Always `git commit` first, then deploy with `vercel` (preview — **NOT** `--prod`) and share the preview URL for review before promoting to production. When completing/releasing a new version, always tag it: `git tag -a vX.Y.Z -m "Description" && git push origin vX.Y.Z`.

> **All agents (Claude & Antigravity):** After reading this file, check `TODO.md` for active tasks and guidelines before writing any code.

A neon-styled block stacking game built as a single HTML file.

**Live:** https://glowtris.vercel.app

### Vercel Environments
| URL | 용도 |
|-----|------|
| https://glowtris.vercel.app | 🚀 Production |
| https://prevglow.vercel.app | 🔍 General preview (master 최신 상태, 수동 alias 갱신) |
| https://prevglow-a.vercel.app | 🧪 Branch verification — `hotfix/option-a-arithmetic` |
| https://prevglow-b.vercel.app | 🧪 Branch verification — `hotfix/option-b-polling` |

## Stack

- HTML, CSS, JavaScript (single file: `index.html`)
- Vercel serverless function (`api/leaderboard.js`)
- Upstash Redis (online leaderboard)
- No external frontend libraries

## Features

- Neon glow effect on pieces and UI
- Responsive layout — desktop 3-panel, mobile touch controls, tablet support
- Starfield background animation
- Screen shake + danger red overlay when stack is high
- Chiptune BGM via Web Audio API (A minor, 140 BPM, 4-phrase looping melody with bass)
- BGM tempo auto-scaling with level (140 BPM at L1 → 200 BPM cap at L13+)
- Sound effects: move, rotate, hold, line clear (1–3 lines), Glowtris fanfare, game over
- Enhanced screen shake on hard drop (scales with drop distance)
- Audio mute toggle (persists across sessions)
- T-spin detection with bonus scoring (single / double / triple)
- DAS/ARR key-repeat tuning (accessible from pause menu)
- Combo flash overlay (cyan → purple → pink as combo grows)
- Glowtris full-screen flash + rainbow border glow on 4-line clear
- All-clear bonus: 2000×level pts + gold flash + fanfare + burst particles
- NEW BEST effect: gold badge + ascending SFX + gold particles on personal record
- Personal game history: last 5 scores shown on game over screen (localStorage)
- Online leaderboard: TODAY and ALL TIME tabs, top 10, submit after game over
- Daily leaderboard resets each day (Redis TTL)
- Rank shown after score submission (today rank + all-time rank)
- Restart button in pause menu (returns to start screen without full reload)
- HOW TO PLAY popup — full-screen overlay listing keyboard and touch controls
- Web Share API result sharing (clipboard fallback on desktop)
- PWA: installable on iOS/Android home screen (manifest + icons)
- OG image + social meta tags for rich SNS sharing preview

## Roadmap

| Version | Features |
|---|---|
| ~~v0.7~~ ✅ | Audio mute toggle, T-spin detection & bonus, DAS/ARR tuning |
| ~~v0.8~~ ✅ | Multi-track BGM (speeds up with level), combo flash, Glowtris full-screen effect |
| ~~v0.8.1~~ ✅ | Desktop UI redesign, tablet touch controls fix |
| ~~v0.9~~ ✅ | Online leaderboard (Upstash Redis), result share (Web Share API) |
| ~~v0.9.1~~ ✅ | Code optimisation, refactor, bug fixes, desktop leaderboard overlay fix |
| ~~v0.9.2~~ ✅ | iOS speaker fix, audio resume, danger warning overlay, SFX node cleanup |
| ~~v1.0~~ ✅ | All-clear bonus, NEW BEST effect, daily leaderboard, PWA, OG image — **LAUNCHED** |
| ~~v1.0.1~~ ✅ | Rename to Glowtris, variable clean up, and **Premium Visual Upgrade** (Color-shifting nebulae, Glassmorphism 3D panels, landing shockwaves, keyboard press feedback, and level-up sweep). |
| ~~v1.0.2~~ ✅ | **Elegant Polish**: Removed hard-drop shockwaves to keep drops snappy, added sleek vertical alignment lasers, added drop spark trails, and polished pause menu buttons. |
| ~~v1.0.3~~ ✅ | **Retention & UX Polish**: Username persistence, personal best streak & max combo badges, How To Play collapsible panel. |
| ~~v1.0.4~~ ✅ | **Profile, UI, & Social Depth**: Full stats screen, personal record badges, UI enhancements (neon grid, floating text, optimized particles), Weekly leaderboard tab, persistent rank display, and canvas share image. |
| ~~v1.0.5~~ ✅ | **OG Image Redesign**: Logo lockup layout (3×3 block grid mark + GLOW/TRIS neon title), nebula background, neon corner brackets, gradient separator lines. |
| ~~v1.0.6~~ ✅ | **Settings, Accessibility & Polish**: Ghost piece on/off toggle, lock-delay tuning in pause menu. Privacy Policy + Terms of Service pages (AdSense-ready). Automatic performance mode — monitors FPS and disables glow/particles/nebulae below 30 FPS. |
| ~~v1.0.7~~ ✅ | **Keyboard Parallax & iPad Fit**: Left/right key input nudges the entire UI 2px in the opposite direction with a snappy spring-back (0.18s cubic-bezier). Screen shake locked to X-axis only. `overscroll-behavior:none` prevents page scroll on iPad. Game board shrunk by 8px margin so content never clips on iPad. |
| ~~v1.0.6 post~~ ✅ | **Code Quality & Mobile Fixes**: Refactor/clean-code pass (CSS consolidation, function extraction, variable shadow fix, removed WHAT comments, −114 lines). Touch control button order swapped: HOLD / DROP / ROTATE. Fixed mobile controls clipping on iOS PWA — `env(safe-area-inset-*)` returns 0 during synchronous script execution; added `requestAnimationFrame` re-layout so safe-area values are read after the first paint. Fixed oversized bottom margin on iPhone WebView — corrected `frameH` formula to `max(0,8−safeTop) + max(0,8−safeBottom) + 16` so safe-area padding is not double-counted (saves up to 24px on iPhone). Removed non-functional "TAP TO RESUME" label from pause overlay (no tap handler existed). Mobile start screen now uses full-screen dark/blur overlay (`position:fixed`) matching desktop/iPad, with panel centred in the full viewport. **Robust touch layout via ResizeObserver** — `#game-row` now uses `flex:1 1 0` to fill remaining space; `ResizeObserver` reads its actual rendered height and sets CELL, replacing all hardcoded `headerH`/`ctrlH`/`frameH` arithmetic so future CSS changes never break the bottom margin. |
| ~~v1.0.8~~ ✅ | **Accessibility & Visual Polish**: Colorblind mode — 7 unique white symbol overlays per tetromino (I=══ O=○ T=△ S=/ Z=\ J=║ L=✕), rendered on board, active piece, and next/hold previews. Animation intensity cycle (Full / Low / Off) disables particles, screen shake, flash, combo overlay, and rainbow border for motion-sensitive players. Both settings persist to localStorage. |
| ~~v1.0.8.1~~ ✅ | **Performance & Visual Overhaul**: Cell sprite cache — pre-renders each piece color once into an offscreen canvas and blits via `drawImage` (GPU path), eliminating ~400 `createLinearGradient` calls/frame. Baked glow — `shadowBlur` rendered into sprite pixels so all placed blocks glow at zero per-frame cost. Glow threshold `glow > 1.2` removes per-cell shadowBlur from board cells (200 ops/frame saved). Nebula bounding-box clip reduces fill area ~50%. CSS border/boxShadow cached — only updates on piece color change. Perf mode tuned: requires 2 consecutive bad seconds + 3s startup holdoff; sprites pre-warmed at game start. Refined neon color palette (J: `#0055ff`→`#2979ff` brightest win). Ghost piece quieted, glow rebalanced. **Bug fix**: `#overlay` moved to `<body>` level with `display:none` default — fixes blank start screen on Chrome Mac. |
| ~~v1.0.8.2~~ ✅ | **Perf Mode: Full UI Effect Kill + Bug Fixes**: Low-perf mode now strips every non-gameplay effect — static `#000010` background (no stars/nebulae), all CSS animations off (title, scale-pop, pulse badges), `#screen-flash` hidden, `comboFlash`/`rainbowBorder`/`dangerPulse`/`levelUpScanline` all bypassed, screen shake skipped, `triggerLevelUpVisuals` no-ops. Button effects disabled: `action-btn` hover glow/scale/shimmer-sweep off, `.tbtn` backdrop-filter and press glow off, pause-menu toggle-btn glow off. **Bug fix**: `nc`/`hc` undefined in desktop `initLayout()` — split-canvas refactor left two bare references; renamed to `ncD`/`ncM`/`hcD`/`hcM`. |
| ~~v1.0.9~~ ✅ | **Daily Challenge + Achievement System**: Date-seeded daily challenge — all players share the same piece sequence; one attempt per day (localStorage gate); dedicated Redis leaderboard (score-based, TODAY only); 🏅 challenge badge + special share card on game over. Achievement system — 20 milestones (first Glowtris, T-spin Triple, All-clear, Combo 10+, reach Level 15, 1000-line lifetime, etc.); unlock toast + particle burst on earn; badge gallery in STATS overlay; persisted to localStorage. |
| ~~v1.0.9.1~~ ✅ | **iOS PWA Canvas Sizing Fix**: Resolved cold-start canvas oversizing caused by late-resolving CSS `env()` variables on iOS PWA. Option A (pure arithmetic) merged — safe area values are now estimated per-device in JS using `navigator.standalone` + `screen.height`: Dynamic Island (ph≥852→59px), large notch (ph≥844→47px), small notch (ph≥780→44px), no notch (<780→20px), Face ID iPad (ph≥1100→24px). Android PWA / desktop rely on CSS env() which works correctly on those platforms. |
| v1.1 | **Sprint Mode**: Clear 40 lines as fast as possible. Stopwatch timer + remaining-lines HUD, Marathon vs Sprint mode selector on start screen, dedicated time-based Redis leaderboard (ascending, TODAY / WEEKLY / ALL TIME), Sprint stats & Canvas Share image. |

## Rules

- Maintain single `index.html` file structure
- No external frontend libraries allowed
