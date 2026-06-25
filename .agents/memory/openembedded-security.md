---
name: OpenEmbedded Security Architecture
description: Security decisions made during the full remediation pass — auth, session, rate limits, CORS, headers.
---

# OpenEmbedded Security Architecture

## Auth Strategy
- Session-based auth using `express-session` + `connect-pg-simple` (PostgreSQL-backed)
- Session cookie name: `oe.sid` (httpOnly, sameSite=lax, secure in production)
- Session table: `user_sessions` (auto-created by connect-pg-simple at startup)
- Auth flow: `POST /v1/discord/me` → upserts `discord_users` → sets `req.session.userId`
- Check auth: `GET /v1/auth/session` → `{ authenticated, userId }`
- Logout: `POST /v1/auth/logout` → destroys session + clears cookie

**Why:** Discord Activity SDK already provided token exchange (discord.ts). Adding express-session layers persistence on top without requiring a separate auth provider.

## DATABASE: owner_id column on projects
- `projects.owner_id varchar(32)` → FK to `discord_users.discord_id` with ON DELETE CASCADE
- Column is NULLABLE (existing rows without owner are orphaned but not broken)
- Every project query uses `AND(eq(projectsTable.id, id), eq(projectsTable.ownerId, userId))`

**Why:** Nullable column avoids a migration breaking change. New projects always get ownerId set.

## SESSION_SECRET
- Reads from `process.env["SESSION_SECRET"]`
- Dev fallback: ephemeral `randomBytes(48)` (sessions lost on restart — logged as WARN)
- Production: throws if SESSION_SECRET < 32 chars

**How to apply:** Set SESSION_SECRET in Replit Secrets panel (generate with `node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"`)

## Rate Limiters (express-rate-limit)
- General: 120 req/min (skips /healthz)
- Auth endpoints: 10 req / 15 min (discord/token, discord/me)
- Bot proxy: 20 req/min (bot/validate, bot/channels, bot/send)
- Webhook: 5 req/min (webhook/send)

## CORS
- Development: allows localhost:5000 + localhost:5173
- Production: `*.replit.app` + `*.repl.co` regex, plus optional FRONTEND_ORIGIN env var

## Middleware order in app.ts
1. x-powered-by disabled
2. Helmet (security headers)
3. pino-http (logging with safe serializers — no env, no stack traces)
4. CORS
5. Body parser (limit: 512kb JSON, 256kb urlencoded)
6. Session
7. General rate limit
8. Routes

**Why:** Order matters. Helmet and CORS must run before body parsing. Session before routes.

## Webhook URL validation
- Strict regex: `^https://discord\.com/api/webhooks/\d{17,20}/[A-Za-z0-9_-]{60,}$`
- Query strings stripped before regex check
- `?wait=true` appended to stripped base URL (prevents query-string injection)

## Bot token validation
- Regex pre-check before hitting Discord API: three base64url segments (pattern matches real Discord token format)
- guildId/channelId validated as Discord snowflakes: `/^\d{17,20}$/`
- Error messages never reveal Discord's raw error response text

## Pino serializer audit
- `req`: only logs `id`, `method`, `url` (query string stripped)
- `res`: only `statusCode`
- `err`: only `type` (constructor name) + `message` — no stack, no env leakage

## TypeScript session types
- `artifacts/api-server/src/types/session.d.ts` extends `express-session` `SessionData` with `userId: string`
- tsconfig `"include": ["src"]` picks this up automatically
