# Performance is priority #1

This project's entire reason for existing is to be a **faster** alternative to ClickUp's own UI. Every change is judged first on speed — correctness and features matter, but a correct feature that's slow is a bug.

Concretely, this means:

- **Default to static.** Pages render a fully static shell (nav, layout, skeletons) that paints immediately. Anything that depends on request-time data (session, `searchParams`, live ClickUp data) goes inside a `<Suspense>` boundary so it streams in without blocking the shell.
- **No sequential waterfalls.** If a view needs N independent pieces of data, fetch them as N sibling `<Suspense>` boundaries (or `Promise.all`), never as awaited-in-sequence calls. Prefer one broad cached fetch reused by several widgets over several narrow fetches.
- **Cache ClickUp reads aggressively, correctly.** All ClickUp reads go through the `'use cache: remote'` data layer in `src/lib/clickup/cached.ts` with proper `cacheTag`/`cacheLife`. Never call the ClickUp API directly from a component or route — extend the cached layer instead. Freshness comes from webhook-driven `revalidateTag`, not from short cache lifetimes or client polling.
- **Writes feel instant.** User-initiated actions (posting a comment, pinning a task) update local/optimistic state (zustand) immediately and reconcile with the server in the background — never block the UI on a round trip.
- **Keyboard and search are instant.** cmd+k and other navigation must feel like a local operation (client-side data, no network round trip) for the common case; network fallback only for what isn't already local.
- **Measure before adding weight.** Don't reach for a new dependency, client-side fetch library, or global re-render source without checking it against this bar. When in doubt, prefer server-rendered + cached over client-fetched.

If a proposed change trades speed for convenience, flag the tradeoff explicitly rather than silently accepting it.

# Project plan & status

See `PLAN.md` for the full architecture (token/cache strategy, tag taxonomy), phase status (Phases 0–3 shipped and verified; Phase 4 — task view, comments, pins, cmd+k — is next), live infrastructure details, and a list of verified Next.js 16 gotchas. Update `PLAN.md` when a phase lands or a decision changes.

<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.

**Keep this block, including in commits.** It is part of the project's agent setup, maintained by `next dev` for every agent that works here. If it appears as an uncommitted change, that is intentional — commit it as-is. Do not remove it to clean up a diff; it will be regenerated.
<!-- END:nextjs-agent-rules -->
