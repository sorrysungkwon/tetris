# Neon Tetris

A Tetris game with neon aesthetic built as a single HTML file.

## Stack

- HTML, CSS, JavaScript (single file: `index.html`)
- No external libraries

## Current Features

- Neon glow effect on pieces and UI
- Responsive layout
- Mobile touch support
- Starfield background animation
- Screen shake effect
- Chiptune BGM via Web Audio API (A minor, 140 BPM, 4-phrase looping melody with bass)
- Sound effects: move, rotate, hold, line clear (1–3 lines), Tetris fanfare, game over
- Enhanced screen shake on hard drop (scales with drop distance, 2.5× stronger magnitude)
- Audio mute toggle (🔊/🔇 button, persists across sessions)
- T-spin detection with bonus scoring (single 800pt / double 1200pt / triple 1600pt per level)
- DAS/ARR key-repeat tuning (accessible from pause menu, 50–300ms DAS, 0–100ms ARR)
- BGM tempo auto-scaling with level (140 BPM at L1 → 200 BPM cap at L13+)
- Combo flash overlay (cyan → purple → pink as combo grows)
- Tetris full-screen flash + rainbow border glow on 4-line clear
- Desktop UI redesign: title header, wider panels, BPM display, keyboard shortcuts reference
- Touch controls shown on tablets (pointer:coarse), hidden only on mouse devices (pointer:fine)
- Touch canvas sizing fix: corrected ctrlH values (mobile 188px, tablet 218px) to match actual CSS heights, recovering 1 cell (~20–40px) of game area
- Online leaderboard via Upstash Redis: submit score after game over, view Top 10, Web Share API result sharing

## Roadmap

| Version | Features |
|---|---|
| v0.7 | Audio mute toggle, T-spin detection & bonus, DAS/ARR tuning |
| ~~v0.8~~ ✅ | Multi-track BGM (speeds up with level), combo flash, Tetris full-screen effect |
| ~~v0.8.1~~ ✅ | Desktop UI redesign, tablet touch controls fix |
| ~~v0.9~~ ✅ | Online leaderboard (Upstash Redis), result share (Web Share API) |
| v1.0 | Polish & release |

## Rules

- Maintain single `index.html` file structure
- No external libraries allowed
