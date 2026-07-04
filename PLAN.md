# clickup-lite — Plan & Status

Performance-first custom frontend over the real ClickUp workspace (Human Marketing). Custom views, not a full clone. **Speed is the #1 priority — see AGENTS.md before writing any code.**

## Status at a glance

| Phase | Scope | Status |
|---|---|---|
| 0 | Foundation: perf mandate, Kysely+Neon DB, cache tags, Postgres-backed remote cache handler | ✅ Done, verified on live Netlify |
| 1 | Auth: better-auth email/password + per-user ClickUp personal token (encrypted) | ✅ Done, verified locally + production |
| 2 | ClickUp data layer, homepage widgets, webhook-driven revalidation | ✅ Done, verified with real ClickUp traffic |
| 3 | Web push notifications (PWA) | ✅ Done, verified end-to-end (Chrome; Firefox/macOS has an environmental display quirk) |
| 4 | Task view, comments, pins, cmd+k | ✅ Done — typecheck + `bun run build` verified locally (`/task/[taskId]` partial-prerenders ◐); live verification on Netlify pending next deploy |
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

## Phase 4 (shipped) — Task view, interactions, cmd+k

- `src/app/(app)/task/[taskId]/page.tsx`: static frame + three parallel `<Suspense>` boundaries — TaskHeader (incl. description + PinButton, `getTask`), DocPills (links parsed from description, reuses the same `getTask` cache entry), CommentThread (`getTaskComments` + session via `Promise.all`). ExternalLinks/Commits wait for Phase 5 mappings. Builds as partial prerender (◐).
- Cached fetchers in `clickup/cached.ts` (all slim shapes): `getTask(taskId)` (tag `task:{id}`, life `hours`, `include_markdown_description`), `getTaskComments(taskId)` (tags `task:{id}:comments` + `task:{id}`, oldest first), `getTaskIndex()` (open tasks, tag `team:task-index`), `getArchiveTaskIndex()` (open + closed updated in last 90 days, same tag). Webhook now also revalidates `team:task-index` on every task event.
- **ClickUp v2 has no free-text search endpoint** — `/api/search?q=` filters the single cached `getArchiveTaskIndex()` entry in memory (per-query cache entries would have ~zero hit rate). Both `/api/*` search routes gate on the better-auth session themselves (proxy matcher excludes `/api/*` by design).
- Server Actions (`src/lib/actions/`): `postComment(taskId, text)` — decrypts the acting user's token, `POST /task/{id}/comment`, then `updateTag(task:{id}:comments)` for read-your-own-writes; `togglePin` (pinned_tasks, delete-then-insert with conflict-ignore).
- Optimistic UI via zustand (`src/stores/comments.ts`, `src/stores/pins.ts`): comments show instantly as "sending…" and reconcile when the action's refreshed thread arrives (failures stay visible); pins flip instantly with rollback on server error.
- **PinnedBar** in `(app)/layout.tsx` (own Suspense boundary) renders from the pins store, seeded once from Postgres on first client render (hydrate-once so optimistic toggles never get clobbered). Homepage widgets, inbox, and push notification URLs now deep-link to `/task/{id}` in-app instead of clickup.com.
- **cmd+k palette** (`src/components/cmdk/command-palette.tsx`, Base UI Dialog, mounted in the app layout): Tier 1 = 0ms client fuzzy filter (`src/lib/search.ts`, dependency-free scorer) over pins + localStorage recents + the open-task index fetched once per browser session from `/api/search-index`; Tier 2 = 250ms-debounced `/api/search?q=` results appended under "More", deduped, stale responses discarded by query-matching.

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
