# ClickUp Lite

> ClickUp but faster. Performance and speed are #1 priority.

A performance-first custom frontend over the Human Marketing ClickUp workspace. Not a clone — custom views (homepage dashboard, task view, cmd+k) backed by the ClickUp API v2 with webhook-driven caching.

**Read these before touching code:**

- `AGENTS.md` — the performance mandate (every change is judged on speed first) and the Next.js 16 preview warning
- `PLAN.md` — full architecture, phase status (0–3 shipped, 4 is next), infra details, and Next 16 gotchas
- `node_modules/next/dist/docs/` — this is Next.js **16.3 preview** with `cacheComponents`; APIs differ from public docs

## Stack

Next.js 16.3 preview (cacheComponents + React Compiler, Turbopack) · React 19 · Tailwind v4 · better-auth · Kysely + Neon Postgres · zustand · nuqs · Base UI · web-push · bun

## Development

```sh
bun install
cp .env.example .env.local   # fill in values — see PLAN.md "Infrastructure"
bun run migrate              # apply Kysely migrations to Neon
bun dev
```

Checks: `bunx tsc --noEmit` · `bun run lint` · `bun run build`

## Deployment

Pushing `main` auto-deploys to Netlify (site `clickup-lite`, Human Marketing team) → https://clickup-lite.netlify.app. Env vars are managed via Netlify (`bunx netlify-cli env:set ... --context production`); a redeploy is required after changing them.

## Key directories

```
src/lib/clickup/     # API client + 'use cache: remote' data layer (ALL ClickUp reads go here)
src/lib/cache/       # cache tag taxonomy
src/lib/db/          # Kysely instance, types, migrations
src/lib/actions/     # Server Actions (writes use the acting user's own ClickUp token)
src/app/api/webhooks/clickup/  # webhook → revalidateTag + notifications + push
cache-handlers/      # Postgres-backed remote cache handler (Netlify has none built in)
scripts/             # migrate.ts, register-webhook.ts
```
