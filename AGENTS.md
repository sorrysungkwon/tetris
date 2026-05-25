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
- **Workflow (mandatory — no exceptions)**:
  1. Work on `feature/xxx`
  2. Merge into `preview` and verify at **https://prevglow.vercel.app**
  3. Only after preview is confirmed OK → open PR to `master`
  4. Production deploys automatically on merge
  > ⚠️ NEVER open a PR to `master` without first verifying on `preview`. Always confirm with the user that preview looks good before proceeding.

## Vercel Project Info

- **Team slug**: `sgkwon-team` (renamed from `seonqwer-3337s-projects` on 2026-05-25)
- **Team ID**: `team_pb1objuXoHlJIv67jumHZrg8`
- **Project**: `glowtris` / `prj_V1lhSONnxAM9K2hpk5VLtemldWnm`
- **Dashboard**: https://vercel.com/sgkwon-team/glowtris
- **Ignored Build Step**: **CLEARED** (set to `null` on 2026-05-25). Do NOT re-add `git diff HEAD^ HEAD --quiet` — Vercel uses shallow clones where `HEAD^` is unavailable, so the command always exits 0 and skips every build.

## 🚨 DEPLOYMENT DISCIPLINE — Minimize Deployments (applies to ALL agents incl. Claude Code)

Vercel free plan allows **100 deployments per day**. Exceeding this blocks ALL deployments until midnight UTC. Every agent must treat each deployment as expensive.

### Forbidden actions (each wastes a deployment):
1. **NEVER run `vercel`, `vercel deploy`, or `vercel --prod` manually via CLI** — the GitHub integration auto-deploys on every `git push`. Running the CLI on top doubles the count.
2. **NEVER push micro-fixes directly to `preview`** — e.g. "adjust color → push → check → adjust again → push" burns 3+ deployments for one tweak. Do ALL iteration on a `feature/*` branch first.
3. **NEVER push to `preview` more than once per feature** — accumulate every change in `feature/*`, test locally, then do a single merge-to-preview when the feature is truly complete.
4. **NEVER push docs-only commits to `preview` separately** — bundle docs updates with the code commit they describe.

### Required habits:
- **Batch all changes**: finish the entire feature (including all fine-tuning) on `feature/*` before merging to `preview`.
- **Test locally** whenever possible (open `index.html` in browser, use `npx serve .` etc.) before pushing.
- **One feature → one merge to preview → one deployment**. If a review reveals issues, fix on `feature/*` and merge once more — not repeatedly.
- **Count your deploys**: if you're about to push and it would be the 3rd+ push for the same feature, stop and batch the remaining fixes first.

- After every task: `git add . && git commit -m "description" && git push`
- **Git Release Tagging**: When releasing/completing a new version (e.g. v1.0.9), always create and push an annotated Git tag to document the release milestone: `git tag -a vX.Y.Z -m "Description" && git push origin vX.Y.Z`
- **After merging preview → master via PR**: always sync preview back: `git checkout preview && git merge master && git push origin preview`

## 🚨 GITHUB ACTIONS & VERCEL INTEGRATION — NEVER REPEAT THESE MISTAKES

These rules exist because of an incident on 2026-05-25 where bad GitHub Actions config + excessive CLI usage hit BOTH GitHub's deployment rate limit AND Vercel's 100/day deployment cap simultaneously.

### 1. NEVER use the GitHub Deployment API in Actions workflows

```js
// ❌ FORBIDDEN
await github.rest.repos.createDeployment({ ... });
await github.rest.repos.createDeploymentStatus({ ... });
```
The Vercel GitHub App already creates one GitHub Deployment record per push. Doubling these hits GitHub's deployment rate limit ("deployment rate limited - retry 24 hours").

```js
// ✅ CORRECT — use Commit Status API only
await github.rest.repos.createCommitStatus({ state: 'pending', context: 'Vercel / Preview', ... });
```

### 2. Vercel 100/day limit counts EVERYTHING

CANCELED deployments count. CLI deployments count. Empty commits count. When limit is hit, ALL deployments block until midnight UTC. Recovery: wait for midnight UTC, then check with `vercel ls --scope sgkwon-team`.

### 3. NEVER set `commandForIgnoringBuildStep` to `git diff HEAD^ HEAD --quiet`

Vercel uses shallow clones — `HEAD^` doesn't exist → exits 0 → skips every build silently. Field is cleared (`null`). Leave it empty.

### 4. Use stable TEAM ID and PROJECT ID in API calls — never the slug

- Team ID: `team_pb1objuXoHlJIv67jumHZrg8` (permanent)
- Project ID: `prj_V1lhSONnxAM9K2hpk5VLtemldWnm` (permanent)

Slug (`sgkwon-team`) can change; these IDs never do. Use IDs in all curl/API calls.

### 5. Vercel Deployment Checks — no action needed

Deployment Checks gate production domain aliasing only. Our PR-based workflow (preview verification → user approves → PR merge) provides the same gate manually. Leave Vercel Dashboard → Settings → Deployment Checks empty.

## 🔁 Mandatory Release Workflow (no exceptions)

```
feature/xxx  →  preview  →  PR to master  →  master  →  (tag if versioned)
```

1. Create `feature/xxx`, develop and iterate locally
2. When 100% done: `git add . && git commit && git push origin feature/xxx`
3. Merge to preview: `git checkout preview && git merge feature/xxx && git push origin preview`
4. Verify at **https://prevglow.vercel.app** — confirm with user
5. Open PR to master (only after user confirms preview is OK)
6. User approves and merges PR → production auto-deploys
7. Tag if versioned: `git tag -a vX.Y.Z -m "..." && git push origin vX.Y.Z`
8. Sync preview: `git checkout preview && git merge master && git push origin preview`
