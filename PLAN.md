# clickup-lite — Plan & Status

Performance-first custom frontend over the real ClickUp workspace (Human Marketing). Custom views, not a full clone. **Speed is the #1 priority — see AGENTS.md before writing any code.**

## Status at a glance

| Phase | Scope | Status |
|---|---|---|
| 0 | Foundation: perf mandate, Kysely+Neon DB, cache tags, Postgres-backed remote cache handler | ✅ Done, verified on live Netlify |
| 1 | Auth: better-auth email/password + per-user ClickUp personal token (encrypted) | ✅ Done, verified locally + production |
| 2 | ClickUp data layer, homepage widgets, webhook-driven revalidation | ✅ Done, verified with real ClickUp traffic |
| 3 | Web push notifications (PWA) | ✅ Done, verified end-to-end (Chrome; Firefox/macOS has an environmental display quirk) |
| 4 | Task view, comments, pins, cmd+k | 🔜 Next — not started (only the ClickUp comment API shape was verified: `GET /task/{id}/comment` → `{comments:[{id, comment_text, date, user:{id,username,profilePicture}, reply_count, ...}]}`) |
| 5 | Project mappings admin, Netlify/Vercel deploy webhooks → dynamic ClickUp comment, GitHub commits on tasks | Planned |
| 6 | "Fire up PR" agent-dispatch buttons (GitHub workflow_dispatch) | Planned |

## Architecture (locked decisions)

- **Source of truth**: ClickUp API v2. Neon Postgres holds only auth + app data (mappings, pins, presets, push subs, notifications inbox, webhook/deploy state, cache).
- **Token & cache strategy (the central design)**:
  - **Reads** use `CLICKUP_SERVICE_TOKEN` (Mitchell's personal token), read from `process.env` *inside* `'use cache: remote'` functions so it's not in cache keys → one cache entry per resource for the whole team. Per-user fetchers are keyed by ClickUp user ID (small stable arg), never by token.
  - **Writes** (Phase 4+) use the acting user's own ClickUp token from `clickup_credentials` (AES-256-GCM encrypted, `src/lib/crypto.ts`) → correct attribution in ClickUp.
- **Caching**: all ClickUp reads go through `src/lib/clickup/cached.ts` with `cacheTag`/`cacheLife`. Freshness comes from ClickUp webhooks → `revalidateTag(tag, 'max')`, NOT short lifetimes or polling. Netlify provides no durable remote cache for Next 16 `cacheComponents`, so `cache-handlers/remote-handler.js` (wired in next.config.ts) backs `'use cache: remote'` with the `cache_entries`/`cache_tags` Postgres tables. Cache payloads are trimmed to slim shapes (see `TaskSummary`) — never cache raw ClickUp objects.
- **Cache tag taxonomy** (`src/lib/cache/tags.ts`): `task:{id}`, `task:{id}:comments`, `task:{id}:commits`, `list:{id}`, `user:{cuId}:tasks`, `user:{cuId}:time:{date}`, `team:hierarchy`, `team:task-index`, `mappings`.
- **Auth**: no ClickUp OAuth app available (not a workspace admin) → better-auth email/password; each user pastes their personal ClickUp API token once at `/connect-clickup`, verified against `CLICKUP_TEAM_ID` membership, then encrypted+stored. `requireUser()` (src/lib/session.ts) is the full gate. `src/proxy.ts` (Next 16's renamed middleware) does optimistic cookie redirect only — its matcher excludes `/api/*` and anything file-like (bugs were found twice here; don't regress it).
- **Inbox**: own `notifications` table fed by the ClickUp webhook (read-state cannot sync back to real ClickUp — accepted limitation, no public API).
- **Push**: web-push + VAPID; `public/sw.js`; subscriptions in `push_subscriptions` (auto-pruned on 404/410); fan-out happens inside the ClickUp webhook handler gated by `user_prefs`. Custom notification sounds are impossible (Web Notifications API limitation); OS default sound only.

## Infrastructure (live)

- **GitHub**: https://github.com/mitchuman/clickup-lite (`main` auto-deploys)
- **Netlify**: site `clickup-lite` under the Human Marketing team → https://clickup-lite.netlify.app (build: `bun run build`; all env vars from `.env.example` are set in production context)
- **Neon Postgres**: single DB for everything; migrations in `src/lib/db/migrations/*` run via `bun run migrate` (Kysely Migrator)
- **ClickUp webhook**: id `f4695c1b-13ea-4aef-9612-129fafe4fd3e`, registered against the production endpoint for 10 task/comment events (`scripts/register-webhook.ts` re-registers if ever needed; secret in env + `webhook_state` table)
- **ClickUp workspace**: team id `90151122000`; Mitchell's ClickUp user id is `94741870`
- Package manager is **bun**. TypeScript check: `bunx tsc --noEmit`.

## Phase 4 (next) — Task view, interactions, cmd+k

- `src/app/(app)/task/[taskId]/page.tsx`: static frame + parallel `<Suspense>` boundaries — TaskHeader/Description (`getTask`), DocPills (links parsed from description), CommentThread (`getTaskComments`). ExternalLinks/Commits wait for Phase 5 mappings.
- New cached fetchers in `clickup/cached.ts`: `getTask(taskId)` (tag `task:{id}`, life `hours`), `getTaskComments(taskId)` (tags `task:{id}:comments` + `task:{id}`), `getTaskIndex()` (slim open-task index, tag `team:task-index`) for cmd+k.
- Server Actions (`src/lib/actions/`): `postComment(taskId, text)` — user's own token → `POST /task/{id}/comment`, then `updateTag` for read-your-own-writes; `togglePin` (pinned_tasks table).
- Optimistic UI via zustand stores (`src/stores/`) — comments/pins appear instantly, reconcile in background.
- **PinnedBar** in `(app)/layout.tsx` (own Suspense boundary); internal task links so navigation stays in-app.
- **cmd+k palette** (Base UI Dialog): Tier 1 = 0ms client fuzzy filter over pins + localStorage recents + session-fetched task index (`GET /api/search-index` wrapping `getTaskIndex`); Tier 2 = debounced `GET /api/search?q=` → ClickUp filtered team tasks. Keyboard shortcuts hook in the app layout.

## Phase 5 — Mappings + deploy webhooks + commits

- `(app)/projects/page.tsx` mapping CRUD (`project_mappings` table already migrated) → `updateTag('mappings')`.
- `api/webhooks/deploy/[provider]/route.ts` (Netlify JWS / Vercel HMAC): upsert `deploy_events` on `(provider, deploy_id)` with ranked states building(1) → ready/failed/canceled(2) for idempotency; resolve task via task-id-in-branch convention else mapping's `deploys_task_id`; first event `POST /task/{id}/comment` (service token, store comment id), later events `PUT /comment/{id}` rewriting status; push-notify + revalidate.
- `lib/github.ts`: `getTaskCommits` (Octokit, cached `minutes`, tag `task:{id}:commits`) — search by task id in branch/message; selectable summaries in task view.

## Phase 6 — PR triggers

- "Fire up PR" button → server action builds task-context payload → GitHub `workflow_dispatch` on the mapped repo; record in `pr_dispatches` for idempotent button state; small route handler polls run status.

## Next.js 16 gotchas (verified against bundled docs — READ node_modules/next/dist/docs/ first)

- `cacheComponents: true`: dynamic by default; `revalidateTag(tag, 'max')` requires the 2nd arg; `updateTag`/`refresh` are Server-Action-only; `use cache` fns can't read cookies/headers (pass args); `cookies()/headers()/params/searchParams` are async-only.
- Pages that read the session must export `const instant = false` or wrap in Suspense, else the build fails on blocking-prerender validation.
- Middleware is `src/proxy.ts` (exports `proxy`), Node runtime only.
- `revalidateTag(..., 'max')` is stale-while-revalidate: converges in ~1-2s on Netlify, the very next request may still be stale — fine for webhook freshness, don't expect instant.
- Remote cache does not survive deploys (buildId in key) — first hits after deploy are cold, by design.

## Known cleanups / debts

- `/spike` page + `/api/spike/revalidate` are Phase 0 test artifacts — delete once no longer useful as a cache smoke test.
- `user_prefs` UI doesn't exist yet (defaults apply); timezone handling is UTC-only (`src/lib/date.ts`) until prefs are wired.
- Firefox/macOS push displays nothing despite successful delivery (environmental; Chrome verified working).
- better-auth warns about client-IP rate limiting on Netlify (set `advanced.ipAddress` config eventually).
