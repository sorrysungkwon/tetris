# Instructions for Claude Code
> Read this file at the start of every session.

# Claude Guidelines

> **Naming note:** This project was previously located at `/home/ubuntu/projects/tetris` and called "Neon Tetris". It was renamed to **Glowtris** at v1.0.1. As of 2026-05-23, all "tetris" references have been purged from files, config, and git history. Always use "Glowtris" / "glowtris" — never "tetris".

- Always read README.md first, then TODO.md before starting any task
- Update TODO.md task progress (`[x]`) and README.md roadmap after each task is completed
- **No Private Brain Directory**: NEVER create or write to any private brain/app-data directories (such as `task.md` or `walkthrough.md` under `<appDataDir>/brain/`).
- **Unified Workspace Integration**: Keep all technical specifications, tasks, and walkthrough reports inside the shared project directory (using `TODO.md` and `WALKTHROUGH.md` in the project root) to maintain 100% transparent and synchronized collaboration with Antigravity.
- Keep single file structure (`index.html` only)
- **Vercel Deployments & Preview Domains**:
  - Production URL: https://glowtris.vercel.app
  - Option A Preview URL (Arithmetic branch `hotfix/option-a-arithmetic`): https://prevglow-a.vercel.app
  - Option B Preview URL (Polling branch `hotfix/option-b-polling`): https://prevglow-b.vercel.app
  - These preview domains are connected via Vercel to help verify specific bug fix approaches in real-time.
- After every task: `git add . && git commit -m "description" && git push`
