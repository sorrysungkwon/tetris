# Glowtris

> **All agents (Claude & Antigravity):** After reading this file, check `TODO.md` for active tasks and guidelines before writing any code.

A neon-styled block stacking game built as a single HTML file.

**Live:** https://glowtris.vercel.app

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
| ~~v1.0.4~~ ✅ | **Stats & Profile**: Full stats screen (total games, avg score, best level, total lines), personal record badges. |
| v1.0.5 | **Leaderboard & Social Depth**: Weekly leaderboard tab, persistent rank display, canvas share image (board snapshot + score). |
| v1.1 | **New Game Mode — Sprint**: Clear 40 lines as fast as possible. Separate time-based leaderboard. Existing mode renamed "Marathon". |

## Rules

- Maintain single `index.html` file structure
- No external frontend libraries allowed
