# Instructions for Claude Code
> Read this file at the start of every session.

## 🔄 SYNC — Mandatory Session Start Protocol

The user will say **"sync"** at the start of a session. When this happens (or at the start of any new session before any task):

1. **Read** `README.md` → `TODO.md` → `CLAUDE.md` (this file) → `AGENTS.md`
2. **Check recent changes**: `git log --oneline -10` to see what has changed since the last session
3. **Report to the user**:
   - Current branch and latest commit
   - What changed since the last session (docs, features, fixes)
   - Any open PRs or pending release actions
   - What the next task is (first `🔲 Next` item in TODO.md)
4. **Flag any inconsistencies** between documents before starting work

> Both Claude and Antigravity follow this exact protocol so they always share the same understanding of project state. Never start coding or editing before completing sync when asked.

## 🚨 SAFETY HARNESS: STRICT CONSTRAINT RULES (Must follow!)
- **NO Autonomous Merging/Tagging/Destructive Acts**: NEVER perform any git merges to `master`, `git tag` creations/pushes, `git reset --hard`, or `git push --force` autonomously. You MUST present your design/findings to the user first and obtain EXPLICIT verbal approval (e.g., "merge it" or "tag it") in the chat before running these commands.
- **Respect Multi-Branch Previews**: When the user wants to compare multiple implementation routes (e.g., Option A vs Option B), do NOT rush to resolve them or force a single solution into `master`. Maintain the branch isolation, ensure preview environments are fully built and functioning, and act strictly as an observer/helper until a decision is declared by the user.
- **No Over-Engineering**: Adhere strictly to the requested feature scope. Do not perform unsolicited massive refactoring or overwrite unrelated layout sections.

# Claude Guidelines

> **Naming note:** This project was previously located at `/home/ubuntu/projects/tetris` and called "Neon Tetris". It was renamed to **Glowtris** at v1.0.1. As of 2026-05-23, all "tetris" references have been purged from files, config, and git history. Always use "Glowtris" / "glowtris" — never "tetris".

- Always read README.md first, then TODO.md before starting any task
- Update TODO.md task progress (`[x]`) and README.md roadmap after each task is completed
- **No Private Brain Directory**: NEVER create or write to any private brain/app-data directories (such as `task.md` or `walkthrough.md` under `<appDataDir>/brain/`).
- **Unified Workspace Integration**: Keep all technical specifications, tasks, and walkthrough reports inside the shared project directory (using `TODO.md` and `WALKTHROUGH.md` in the project root) to maintain 100% transparent and synchronized collaboration with Antigravity.
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

### Environment Variables (set in Vercel dashboard — do NOT hardcode)

| Variable | Target | Purpose |
|---|---|---|
| `UPSTASH_REDIS_REST_URL` | production, preview | Upstash Redis endpoint for leaderboard API |
| `UPSTASH_REDIS_REST_TOKEN` | production, preview | Upstash Redis auth token |

> These are `sensitive` type in Vercel. To add/update: Vercel Dashboard → Settings → Environment Variables.
> For local development, create a `.env.local` file (never commit it).

### GitHub Actions

- **`VERCEL_TOKEN`** — add as a GitHub repo secret (Settings → Secrets → Actions) to enable the `vercel-status.yml` deployment tracking workflow.

## 🚨 DEPLOYMENT DISCIPLINE — Minimize Deployments (applies to ALL agents incl. Antigravity)

Vercel free plan allows **100 deployments per day**. Exceeding this blocks ALL deployments until midnight UTC. Every agent must treat each deployment as expensive.

### Forbidden actions (each wastes a deployment):
1. **NEVER run `vercel`, `vercel deploy`, or `vercel --prod` manually via CLI** — the GitHub integration auto-deploys on every `git push`. Running the CLI on top doubles the count.
2. **NEVER push micro-fixes directly to `preview`** — e.g. "adjust color → push → check → adjust again → push" burns 3+ deployments for one tweak. Do ALL iteration on a `feature/*` branch first.
3. **NEVER push to `preview` more than once per feature** — accumulate every change in `feature/*`, test locally, then do a single merge-to-preview when the feature is truly complete.

### Required habits:
- **Batch all changes**: finish the entire feature (including all fine-tuning) on `feature/*` before merging to `preview`.
- **Test locally** whenever possible (open `index.html` in browser, use `npx serve .` etc.) before pushing.
- **One feature → one merge to preview → one deployment**. If a review reveals issues, fix on `feature/*` and merge once more — not repeatedly.
- **Count your deploys**: if you're about to push and it would be the 3rd+ push for the same feature, stop and batch the remaining fixes first.

- After every task: `git add . && git commit -m "description"` — **commit only, do NOT push**. Report the commit and stop. The user controls all `git push` operations.
- **Git Release Tagging**: When a version is ready to tag, prepare the command `git tag -a vX.Y.Z -m "Description" && git push origin vX.Y.Z` and present it to the user — do not run it autonomously.

## 🚨 GITHUB ACTIONS & VERCEL INTEGRATION — NEVER REPEAT THESE MISTAKES

These rules exist because of an incident on 2026-05-25 where bad GitHub Actions config + excessive CLI usage hit BOTH GitHub's deployment rate limit AND Vercel's 100/day deployment cap simultaneously, blocking all deployments for 24 hours and preventing memory-leak hotfixes from shipping.

### 1. NEVER use the GitHub Deployment API in Actions workflows

**Forbidden pattern:**
```js
// ❌ DO NOT DO THIS
await github.rest.repos.createDeployment({ ... });
await github.rest.repos.createDeploymentStatus({ ... });
```

**Why it's fatal**: The Vercel GitHub App already creates one GitHub Deployment record per push. Any workflow that also calls `createDeployment()` doubles the records. GitHub has a per-repo deployment creation rate limit — hitting it returns "deployment rate limited - retry 24 hours" on every subsequent PR and commit.

**The correct pattern** (already in `.github/workflows/vercel-status.yml`):
```js
// ✅ Use Commit Status API instead — no rate limit conflict with Vercel
await github.rest.repos.createCommitStatus({ state: 'pending', context: 'Vercel / Preview', ... });
```
Commit statuses are a completely separate API from Deployments. They show up as ● checks on commits/PRs without touching the Deployment records.

### 2. Vercel 100 deployments/day limit — count EVERYTHING

Every single one of these consumes a slot from the 100/day cap:
- Each `git push` to `preview` or `master` (even if files haven't changed — CANCELED still counts)
- Each `git push` to any branch with Vercel auto-deploy enabled
- Each `vercel` or `vercel deploy` CLI invocation (doubles the count on top of GitHub push!)
- Empty commits (`git commit --allow-empty`) pushed to trigger builds

**When the limit is hit**: ALL deployments to ALL branches are blocked until midnight UTC. There is no way around it on the free plan.

**Never run the Vercel CLI manually** — the GitHub integration handles all deployments automatically. The only valid CLI uses are read-only (`vercel ls`, `vercel inspect`, `vercel env ls`).

### 3. NEVER set `commandForIgnoringBuildStep` to `git diff HEAD^ HEAD --quiet`

Vercel's build environment uses **shallow git clones** — `HEAD^` (parent commit) does not exist. The diff command exits 0 (success = "no changes") every time, causing Vercel to skip every single build. This is silently catastrophic.

If you need to skip builds conditionally, use a script that doesn't rely on git history, or leave the field empty (cleared = build always runs).

### 4. Always use the stable TEAM ID and PROJECT ID in API calls — never the slug

The team slug is a display name that can change (e.g. `seonqwer-3337s-projects` → `sgkwon-team`). The team ID (`team_pb1objuXoHlJIv67jumHZrg8`) and project ID (`prj_V1lhSONnxAM9K2hpk5VLtemldWnm`) are permanent and never change.

Always check:
- `.github/workflows/vercel-status.yml` — use `VERCEL_TEAM_ID`/`VERCEL_PROJECT_ID` env vars
- `CLAUDE.md` — Team slug (for dashboard URLs only) and Team ID (for API calls)
- `README.md` — Dashboard URL (slug-based, update when renamed)

### 5. Empty commits are a last resort, not a debugging tool

`git commit --allow-empty -m "trigger build"` burns one deployment slot. Use it only when Vercel's GitHub integration missed a real commit (rare). Never use it iteratively to test build configuration — fix the config first, then push once.

### 6. Deployment limit recovery

If the 100/day limit is hit:
- Wait until **midnight UTC** (not midnight local time) for the counter to reset
- Do NOT attempt `vercel deploy` CLI — it will fail with the same error and waste the next day's slot if the reset happened
- Use `vercel ls --scope sgkwon-team` to check if auto-deploy has recovered before manually intervening
- Signs of limit hit: Vercel deployments show `CANCELED` with 0s build time, `canceledAt === buildingAt`, `canceler: null`

### 7. Vercel Deployment Checks — what they are and what to do

**What they are**: Vercel Deployment Checks gate **production domain aliasing** — they do NOT affect builds or preview deployments. If configured, a production build completes successfully but stays on a unique URL (e.g. `glowtris-xxxx.vercel.app`) until all configured checks pass, THEN gets aliased to `glowtris.vercel.app`.

**Do we need them?** No. Our PR-based workflow already provides this gate:
1. Build and review on `preview` (prevglow.vercel.app)
2. Open PR to `master` — user confirms it looks good
3. Merge PR → production auto-aliases

There is nothing to configure in Vercel Dashboard → Settings → Build & Deployment → Deployment Checks for this project. Leave it empty.

**The only gotcha**: if you ever DO configure a Deployment Check and the check fails, production promotion is blocked (but the build still "succeeds"). You can bypass with Force Promote in the Vercel dashboard.

## 🔁 Mandatory Release Workflow (no exceptions)

### Push rules — read this first

Every `git push` to `preview` or `master` triggers a Vercel deployment and consumes one slot from the 100/day free limit.

| Change type | Commit | Push |
|---|---|---|
| **Code / feature** | Agent commits | Agent pushes **only when user says "push해" or equivalent** |
| **Docs-only** (README, TODO, CLAUDE, AGENTS…) | Agent commits | **Accumulate locally. Push together with the next code change — never push docs alone.** |

### Workflow: Code changes

```
feature/xxx  →  preview (verify)  →  PR to master  →  production
```

1. **Create feature branch**: `git checkout -b feature/xxx`
2. **Develop & iterate**: all changes on `feature/*` only. Test locally (`npx serve .`).
3. **Batch commit**: when 100% done, `git add . && git commit -m "feat: ..."` — report to user and **wait for push instruction**.
4. **On "push해"**: `git push origin feature/xxx` then `git checkout preview && git merge feature/xxx && git push origin preview`
5. Vercel auto-deploys to **https://prevglow.vercel.app** — confirm with user.
6. **Open PR**: `gh pr create --base master --head preview --title "feat: ..."` — only after user confirms preview is OK.
7. **User merges PR** → Vercel auto-deploys to **https://glowtris.vercel.app** (production).
8. **Tag if versioned**: prepare `git tag -a vX.Y.Z -m "Description" && git push origin vX.Y.Z` — present to user, do not run autonomously.
9. **Sync preview**: `git checkout preview && git merge master && git push origin preview` — run after user confirms PR is merged.

### Critical rules:
- **Agent never pushes without user instruction** — wait for "push해" or equivalent
- **Docs commits accumulate** — never push docs alone; bundle with next code push
- **ONE push to preview per feature** — no iterative preview pushes
- **NEVER merge directly to master** — always via PR
- **NEVER run `vercel` CLI** for deploys
