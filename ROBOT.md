# Glowtris — Shared Agent Rules
> All agents (Claude Code and Antigravity) read this file as part of the sync protocol.
> It is the single source of truth for all shared project rules.
> Agent-specific instructions live in `CLAUDE.md` (Claude Code) and `AGENTS.md` (Antigravity).

---

## 🚨 SAFETY HARNESS: STRICT CONSTRAINT RULES (Must follow!)

- **NO Autonomous Merging/Tagging/Destructive Acts**: NEVER perform any git merges to `master`, `git tag` creations/pushes, `git reset --hard`, or `git push --force` autonomously. You MUST present your design/findings to the user first and obtain EXPLICIT verbal approval (e.g., "merge it" or "tag it") in the chat before running these commands.
- **Respect Multi-Branch Previews**: When the user wants to compare multiple implementation routes (e.g., Option A vs Option B), do NOT rush to resolve them or force a single solution into `master`. Maintain the branch isolation, ensure preview environments are fully built and functioning, and act strictly as an observer/helper until a decision is declared by the user.
- **No Over-Engineering**: Adhere strictly to the requested feature scope. Do not perform unsolicited massive refactoring or overwrite unrelated layout sections.

---

## Project Context

> **Naming note:** This project was previously located at `/home/ubuntu/projects/tetris` and called "Neon Tetris". It was renamed to **Glowtris** at v1.0.1. As of 2026-05-23, all "tetris" references have been purged from files, config, and git history. Always use "Glowtris" / "glowtris" — never "tetris".

- Update TODO.md task progress (`[x]`) after each task is completed. Update README.md roadmap only when releasing a new version.
- **No Private Brain Directory**: NEVER create or write to any private brain/app-data directories (such as `task.md` or `walkthrough.md` under `<appDataDir>/brain/`).
- **Unified Workspace**: Keep all technical specifications, tasks, and walkthrough reports inside the shared project directory (using `TODO.md` and `WALKTHROUGH.md` in the project root).
- Keep single file structure (`index.html` only)
- **Document language rule**: GitHub-tracked files (README, TODO, CLAUDE, AGENTS, ROBOT, code, comments, commits) must be **English only**. Gitignored local files (MONETIZATION.md, GROWTHPLAN.md) may use Korean.
- **TODO.md scope**: TODO.md is for feature tasks and bug fix records only. Business metrics, cost tables, and monetization notes do NOT belong in TODO.md.

---

## Branch & Deployment Strategy

- `master` — protected, requires PR. Auto-deploys to **https://glowtris.com** (production).
- `preview` — push freely. Auto-deploys to **https://prevglow.vercel.app** (staging/general preview).
- `hotfix/option-a` — keep, do NOT delete. Testing only → **https://prevglow-a.vercel.app**
- `hotfix/option-b` — keep, do NOT delete. Testing only → **https://prevglow-b.vercel.app**
- `feature/*` — regular feature branches; Vercel auto-creates random preview URLs per push.

**Workflow (mandatory — no exceptions)**:
1. Work on `feature/xxx`
2. Merge into `preview` and verify at **https://prevglow.vercel.app**
3. Only after preview is confirmed OK → open PR to `master`
4. Production deploys automatically on merge

> ⚠️ NEVER open a PR to `master` without first verifying on `preview`. Always confirm with the user that preview looks good before proceeding.

---

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

### GitHub Actions

- **`VERCEL_TOKEN`** — add as a GitHub repo secret (Settings → Secrets → Actions) to enable the `vercel-status.yml` deployment tracking workflow.

---

## 🚨 DEPLOYMENT DISCIPLINE — Minimize Deployments

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

---

## 🚨 GITHUB ACTIONS & VERCEL INTEGRATION — NEVER REPEAT THESE MISTAKES

These rules exist because of an incident on 2026-05-25 where bad GitHub Actions config + excessive CLI usage hit BOTH GitHub's deployment rate limit AND Vercel's 100/day deployment cap simultaneously, blocking all deployments for 24 hours.

### 1. NEVER use the GitHub Deployment API in Actions workflows

```js
// ❌ DO NOT DO THIS
await github.rest.repos.createDeployment({ ... });
await github.rest.repos.createDeploymentStatus({ ... });
```

The Vercel GitHub App already creates one GitHub Deployment record per push. Any workflow that also calls `createDeployment()` doubles the records, hitting GitHub's per-repo deployment rate limit ("deployment rate limited - retry 24 hours").

```js
// ✅ Use Commit Status API instead — no rate limit conflict with Vercel
await github.rest.repos.createCommitStatus({ state: 'pending', context: 'Vercel / Preview', ... });
```

### 2. Vercel 100/day limit counts EVERYTHING

Every single one of these consumes a slot:
- Each `git push` to `preview` or `master` (even CANCELED deployments count)
- Each `git push` to any branch with Vercel auto-deploy enabled
- Each `vercel` or `vercel deploy` CLI invocation (doubles the count on top of GitHub push!)
- Empty commits (`git commit --allow-empty`) pushed to trigger builds

**When the limit is hit**: ALL deployments to ALL branches are blocked until midnight UTC.
**Recovery**: wait for midnight UTC, then check with `vercel ls --scope sgkwon-team`.

### 3. NEVER set `commandForIgnoringBuildStep` to `git diff HEAD^ HEAD --quiet`

Vercel uses shallow clones — `HEAD^` doesn't exist → exits 0 → skips every build silently. Field is cleared (`null`). Leave it empty.

### 4. Always use the stable TEAM ID and PROJECT ID in API calls — never the slug

- Team ID: `team_pb1objuXoHlJIv67jumHZrg8` (permanent)
- Project ID: `prj_V1lhSONnxAM9K2hpk5VLtemldWnm` (permanent)

Slug (`sgkwon-team`) can change; these IDs never do. Use IDs in all curl/API calls. Always check `.github/workflows/vercel-status.yml` uses `VERCEL_TEAM_ID`/`VERCEL_PROJECT_ID` env vars.

### 5. Empty commits are a last resort, not a debugging tool

`git commit --allow-empty -m "trigger build"` burns one deployment slot. Use it only when Vercel's GitHub integration missed a real commit (rare). Never use it iteratively.

### 6. Deployment limit recovery

If the 100/day limit is hit:
- Wait until **midnight UTC** (not midnight local time) for the counter to reset
- Do NOT attempt `vercel deploy` CLI — it will fail and waste the next day's slot
- Signs of limit hit: Vercel deployments show `CANCELED` with 0s build time, `canceledAt === buildingAt`, `canceler: null`

### 7. Vercel Deployment Checks — no action needed

Deployment Checks gate production domain aliasing only. Our PR-based workflow (preview verification → user approves → PR merge) provides the same gate manually. Leave Vercel Dashboard → Settings → Deployment Checks empty.

---

## 🚨 VERCEL DEPLOYMENT — ADDITIONAL KNOWN ISSUE

### `requireVerifiedCommits` flag (discovered 2026-05-29)

**Symptom**: All deployments show `CANCELED` with `readyStateReason: "The Deployment was canceled because it was created with an unverified commit"` and `alwaysRefuseToBuild: true`. `canceledAt === buildingAt` (instant cancellation). Only 6 deployments in a day, so it is NOT the 100/day limit.

**Root cause**: Vercel's `gitProviderOptions.requireVerifiedCommits` was set to `true` — likely auto-enabled by Vercel's security system after the force-push history rewrite on 2026-05-25. This requires all commits to be GPG-signed before Vercel will deploy them. Our commits are not GPG-signed.

**Fix (one-time API call)**:
```bash
curl -X PATCH "https://api.vercel.com/v9/projects/prj_V1lhSONnxAM9K2hpk5VLtemldWnm?teamId=team_pb1objuXoHlJIv67jumHZrg8" \
  -H "Authorization: Bearer $VERCEL_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"gitProviderOptions": {"requireVerifiedCommits": false}}'
```
Then push an empty commit to retrigger deployment: `git commit --allow-empty -m "ci: retrigger" && git push origin preview`

**How to diagnose**: Check `readyStateReason` on a specific deployment:
```bash
curl "https://api.vercel.com/v13/deployments/DEPLOY_ID?teamId=team_pb1objuXoHlJIv67jumHZrg8" -H "Authorization: Bearer $VERCEL_TOKEN" | python3 -c "import sys,json,d; d=json.load(sys.stdin); print(d.get('readyStateReason'), d.get('alwaysRefuseToBuild'))"
```

---

## 📋 Session Notes — 2026-05-29 Part 2 (Architecture & Infra Hardening)

Decisions and changes made in the second half of 2026-05-29.

### Document architecture: ROBOT.md introduced
`CLAUDE.md` and `AGENTS.md` were 90% identical, creating divergence risk. Restructured:
- `ROBOT.md` (this file) — single source of truth for all shared rules (~150 lines)
- `CLAUDE.md` — Claude-specific sync protocol + local dev notes (~30 lines)
- `AGENTS.md` — Antigravity-specific sync protocol (~30 lines)
Update `ROBOT.md` to change rules for both agents simultaneously. Agent-specific overrides go in the respective agent doc.

### Cold assessment findings (2026-05-29)
1. **Upstash free ceiling was ~416 DAU** (not 700 as previously assumed) — corrected
2. **API had no rate limiting or score validation** — fixed
3. **No 60s edge cache** — fixed; now extends free ceiling to ~700 DAU
4. **Vercel Analytics + Speed Insights already in `index.html`** — monitoring exists
5. **`index.html` at 3,535 lines** — architecture checkpoint added before v1.2

### API hardening (implemented 2026-05-29)
- `api/leaderboard.js` GET: `Cache-Control: s-maxage=60, stale-while-revalidate=30` — edge cache at Vercel CDN
- `api/leaderboard.js` POST: IP-based rate limit (5 req/60s) via Redis INCR + EXPIRE
- `api/leaderboard.js` POST: Score validation (integer, 0 < score ≤ 10,000,000)
- Rate limit is POST-only (score submission) — GET (game load, leaderboard view) is unrestricted

### Domain purchase pending
User is purchasing a custom domain (likely `glowtris.com`). After setup:
- Update `og:url` in `index.html`
- Update `README.md` production URL
- Update this file's dashboard URL references
- Full task list in `TODO.md` → Pre-v1.1 → Domain Setup

### Architecture checkpoint added (Pre-v1.2)
`index.html` will be ~4,000+ lines after v1.1. Before v1.2 implementation, agents must decide: keep pure single-file OR introduce a build step (esbuild: source modules → bundled `index.html`). The current "single file" rule applies to the **output**, not the source — a build step is acceptable if the Vercel build output remains a single `index.html`. This decision must be made and documented before v1.2 work begins.

---

## 📋 Session Notes — 2026-05-29 (Strategy & Roadmap Overhaul)

The following decisions were made on 2026-05-29.

### Monetization strategy: AdSense → 100% ad-free donation model
The project pivoted from Google AdSense to a voluntary donation model (Ko-fi / Buy Me a Coffee).
- `SUPPORT_URL` constant controls all donation UI — set to `''` to hide everything
- Donation UX placements: game over screen bottom + submission success + Stats overlay footer
- Full revenue projections in `MONETIZATION.md` (local only, gitignored)

### Real break-even point
Monthly fixed costs include developer tools (Claude Pro $22/mo, Moshi $4/mo, domain ~$1/mo) = ~$28/mo total overhead. The true break-even is **DAU ~558** (standard scenario: 0.25% conversion, $4 avg donation). See `MONETIZATION.md` for full P&L.

### Infrastructure capacity wall
Without caching, the Upstash free tier exhausted at ~416 DAU (10K commands/day ÷ ~24 commands/DAU). **60s edge cache is now live** (`api/leaderboard.js`), cutting GET Redis reads ~50%. Updated free ceilings:
- **Upstash free**: ~700 DAU (with cache) — upgrade to Pay-as-you-go (~$1/mo) before or at v1.2 launch (DAU 700 target)
- **Vercel Hobby**: ~667 DAU — upgrade to Pro ($20/mo) at DAU > 600

### Roadmap changes
- **Pre-v1.1 added**: Donation UI task (`SUPPORT_URL` constant + ☕ game over button + Stats footer card)
- **v1.1**: Reddit r/webgames launch post added as a release task
- **v1.2**: Basic daily streak counter added; DAU target → **700**
- **v1.5**: Renamed "Weekly Events" — streak counter moved to v1.2

### New local-only files
- `GROWTHPLAN.md` (gitignored) — full marketing plan: Reddit channel strategy, Product Hunt timing, DAU phase plans, retention tactics, share card viral hooks
- `MONETIZATION.md` (gitignored) — full cost breakdown and realistic P&L

---

## 🔁 Mandatory Release Workflow (no exceptions)

### Push rules

| Change type | Commit | Push |
|---|---|---|
| **Code / feature** | Agent commits | Agent pushes **only when user says "push해" or equivalent** |
| **Docs-only** (README, TODO, CLAUDE, AGENTS, ROBOT…) | Agent commits | **Accumulate locally. Push together with the next code change — never push docs alone.** |

### Workflow

```
feature/xxx  →  preview (verify)  →  PR to master  →  production
```

1. **Create feature branch**: `git checkout -b feature/xxx`
2. **Develop & iterate**: all changes on `feature/*` only. Test locally (`npx serve .`).
3. **Batch commit**: when 100% done, `git add . && git commit -m "feat: ..."` — report to user and **wait for push instruction**.
4. **On "push해"**: `git push origin feature/xxx` then `git checkout preview && git merge feature/xxx && git push origin preview`
5. Vercel auto-deploys to **https://prevglow.vercel.app** — confirm with user.
6. **Open PR**: `gh pr create --base master --head preview --title "feat: ..."` — only after user confirms preview is OK.
7. **User merges PR** → Vercel auto-deploys to **https://glowtris.com** (production).
8. **Tag if versioned**: prepare `git tag -a vX.Y.Z -m "Description" && git push origin vX.Y.Z` — present to user, do not run autonomously.
9. **Sync preview**: `git checkout preview && git merge master && git push origin preview` — run after user confirms PR is merged.

### Critical rules:
- **Agent never pushes without user instruction** — wait for "push해" or equivalent
- **Docs commits accumulate** — never push docs alone; bundle with next code push
- **ONE push to preview per feature** — no iterative preview pushes
- **NEVER merge directly to master** — always via PR
- **NEVER run `vercel` CLI** for deploys
