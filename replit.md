# OpenEmbedded

A visual node-graph builder for Discord embeds and Components V2 messages.

## Run & Operate

Two workflows handle the app on Replit:
- **API Server** (port 8080, console): `pnpm --filter @workspace/api-server run build && PORT=8080 pnpm --filter @workspace/api-server run start`
- **OpenEmbedded** (port 5000, webview): `PORT=5000 pnpm --filter @workspace/openembedded run dev`

Other commands:
- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from the OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)

Required env (auto-provisioned by Replit):
- `DATABASE_URL` — Postgres connection string (runtime-managed, no manual setup needed)

Required env (must be added as Replit Secrets to enable full functionality):
- `SESSION_SECRET` — already set ✓
- `DISCORD_CLIENT_ID`, `DISCORD_CLIENT_SECRET`, `DISCORD_REDIRECT_URI` — Discord OAuth (for sign-in)
- `OPENBOT_TOKEN` — Discord bot token (for sending messages)
- `OPENBOT_API_KEY`, `OPENBOT_API_URL` — API bridge between api-server and openbot service

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- API: Express 5
- DB: PostgreSQL + Drizzle ORM
- Validation: Zod (`zod/v4`), `drizzle-zod`
- API codegen: Orval (from OpenAPI spec)
- Build: esbuild (CJS bundle)

## Where things live

_Populate as you build — short repo map plus pointers to the source-of-truth file for DB schema, API contracts, theme files, etc._

## Architecture decisions

_Populate as you build — non-obvious choices a reader couldn't infer from the code (3-5 bullets)._

## Product

_Describe the high-level user-facing capabilities of this app once they exist._

## User preferences

_Populate as you build — explicit user instructions worth remembering across sessions._

## Gotchas

_Populate as you build — sharp edges, "always run X before Y" rules._

## Pointers

- See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details
