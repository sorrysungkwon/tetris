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

## Roadmap

| Version | Features |
|---|---|
| v0.7 | Audio mute toggle, T-spin detection & bonus, DAS/ARR tuning |
| v0.8 | Multi-track BGM (speeds up with level), combo flash, Tetris full-screen effect |
| v0.9 | Online leaderboard (Vercel + KV), result share screenshot |
| v1.0 | Polish & release |

## Rules

- Maintain single `index.html` file structure
- No external libraries allowed
