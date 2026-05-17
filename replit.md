# SalesCockpit — AI Sales Assistant

An AI-powered sales assistant for small SaaS companies that drafts personalized outreach emails to prospects and tracks campaign performance.

## Run & Operate

- `pnpm --filter @workspace/api-server run dev` — run the API server (port from workflow)
- `pnpm --filter @workspace/sales-assistant run dev` — run the frontend (port from workflow)
- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from the OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- Required env: `DATABASE_URL` — Postgres connection string

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- Frontend: React + Vite, TanStack Query, wouter, shadcn/ui, Tailwind CSS v4
- API: Express 5
- DB: PostgreSQL + Drizzle ORM
- Validation: Zod (`zod/v4`), `drizzle-zod`
- API codegen: Orval (from OpenAPI spec)
- Build: esbuild (CJS bundle)

## Where things live

- `lib/api-spec/openapi.yaml` — API contract (source of truth)
- `lib/db/src/schema/` — DB schema (campaigns, prospects, emails, activity)
- `artifacts/api-server/src/routes/` — Express route handlers
- `artifacts/sales-assistant/src/pages/` — Frontend pages
- `artifacts/sales-assistant/src/components/` — UI components + layout Shell/Sidebar

## Architecture decisions

- AI email generation is rule-based (tone templates + prospect data), no external LLM required on first build
- Activity feed auto-logs key events (prospect added, email drafted, email sent, reply received)
- Prospects automatically move to "contacted" status when their first email is sent
- Reply rate is stored and computed as a percentage (0–100), not a decimal (0–1)

## Product

- **Dashboard** — pipeline health overview: prospect/email stats, recent activity feed, pipeline by status
- **Prospects** — manage prospect list with add/edit/delete, search, and status filtering
- **Prospect Detail** — full info + email history + quick generate button
- **Campaigns** — group prospects into campaigns, track per-campaign performance
- **Compose Draft** — select a prospect + tone + optional context, generate AI-personalized email, edit and send
- **Emails** — inbox view of all drafts/sent emails, filter by status

## User preferences

_Populate as you build — explicit user instructions worth remembering across sessions._

## Gotchas

- After changing DB schema, run `pnpm run typecheck:libs` to rebuild declarations before typechecking API server
- Date fields from Drizzle return `Date` objects — serialize to `.toISOString()` before Zod parsing when schema expects `string`
- Reply rate is a percentage (e.g. 33.3), not a decimal — do not multiply by 100 in the frontend

## Pointers

- See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details
