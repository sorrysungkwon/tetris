# Instructions for Antigravity
> Read this file at the start of every session.

## 🚨 SAFETY HARNESS: STRICT CONSTRAINT RULES (Must follow!)
- **NO Autonomous Merging/Tagging/Destructive Acts**: NEVER perform any git merges to `master`, `git tag` creations/pushes, `git reset --hard`, or `git push --force` autonomously. You MUST present your design/findings to the user first and obtain EXPLICIT verbal approval (e.g., "merge it" or "tag it") in the chat before running these commands.
- **Respect Multi-Branch Previews**: When the user wants to compare multiple implementation routes (e.g., Option A vs Option B), do NOT rush to resolve them or force a single solution into `master`. Maintain the branch isolation, ensure preview environments are fully built and functioning, and act strictly as an observer/helper until a decision is declared by the user.
- **No Over-Engineering**: Adhere strictly to the requested feature scope. Do not perform unsolicited massive refactoring or overwrite unrelated layout sections.

# Agent Guidelines

> **Naming note:** This project was previously located at `/home/ubuntu/projects/tetris` and called "Neon Tetris". It was renamed to **Glowtris** at v1.0.1. As of 2026-05-23, all "tetris" references have been purged from files, config, and git history. Always use "Glowtris" / "glowtris" — never "tetris".

- Always read README.md first, then TODO.md before starting any task
- Update TODO.md task progress (`[x]`) and README.md roadmap after each task is completed
- **No Private Brain Directory**: NEVER create or write to any private brain/app-data directories (such as `task.md` or `walkthrough.md` under `<appDataDir>/brain/`).
- **Unified Workspace Integration**: Keep all technical specifications, tasks, and walkthrough reports inside the shared project directory (using `TODO.md` and `WALKTHROUGH.md` in the project root) to maintain 100% transparent and synchronized collaboration with Claude Code.
- Keep single file structure (`index.html` only)
- **Branch & Deployment Strategy**:
  - `master` — protected, requires PR. Auto-deploys to **https://glowtris.vercel.app** (production).
  - `preview` — push freely. Auto-deploys to **https://prevglow.vercel.app** (staging/general preview).
  - `hotfix/option-a` — keep, do NOT delete. Testing only → **https://prevglow-a.vercel.app**
  - `hotfix/option-b` — keep, do NOT delete. Testing only → **https://prevglow-b.vercel.app**
  - `feature/*` — regular feature branches; Vercel auto-creates random preview URLs per push.
- **Workflow**: work on `feature/xxx` → merge into `preview` to verify at prevglow → open PR to `master` → production deploys on merge.
- After every task: `git add . && git commit -m "description" && git push`
- **Git Release Tagging**: When releasing/completing a new version (e.g. v1.0.9), always create and push an annotated Git tag to document the release milestone: `git tag -a vX.Y.Z -m "Description" && git push origin vX.Y.Z`
