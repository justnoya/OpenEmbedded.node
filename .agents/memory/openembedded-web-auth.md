---
name: OpenEmbedded web auth flow
description: How the web-browser Discord OAuth2 auth system is structured — AuthProvider, AuthGuard, login page, callback, security model.
---

## Architecture

Two auth systems co-exist without conflict:
- **DiscordProvider** (`discordContext.tsx`) — handles the embedded Discord Activity SDK flow (in-Discord)
- **AuthProvider** (`authContext.tsx`) — handles standard web-browser OAuth2 login

`AuthGuard` wraps protected routes (`/` and `/builder/:id`). It defers to `DiscordActivityOverlay` for Discord Activity users (`isDiscord === true` bypasses the guard).

## Routes

- `/login` — Login page; redirects to `/` if already authenticated
- `/auth/callback` — OAuth callback page; validates state, exchanges code, navigates home
- `/` and `/builder/:id` — protected by `AuthGuard`

## OAuth2 flow (web browser)

1. User clicks "Continue with Discord" on `/login`
2. `login()` in AuthProvider: fetches clientId from `/api/v1/discord/config`, generates CSRF state nonce (`crypto.getRandomValues` → base64url), stores in `sessionStorage["oe_oauth_state"]`, redirects to Discord OAuth
3. Discord redirects to `/auth/callback?code=...&state=...`
4. `AuthCallback` calls `completeAuth(code, state, redirectUri)`
5. `completeAuth` validates state (vs sessionStorage), clears it, POSTs code+redirectUri to `/api/v1/auth/login`
6. Backend: exchanges code server-side → fetches profile → upserts user → regenerates session (CWE-384 prevention) → saves session → returns sanitized user
7. AuthProvider sets `{ status: "authenticated", user }`, navigates to stored returnPath

## Backend: POST /v1/auth/login

Security measures applied:
- `isAllowedRedirectUri()` validates redirect URI against: localhost, REPLIT_DOMAINS, *.replit.app, *.repl.co, FRONTEND_URL
- Code length ≤ 512 chars validated
- Rate-limited 10 req / 15 min (authLimiter)
- `req.session.regenerate()` before setting userId (session fixation prevention)
- `req.session.save()` before responding (atomicity)
- access_token NEVER returned to client or stored

## GET /v1/auth/session

Updated to return full user profile from DB (not just userId). Returns `{ authenticated: bool, user: { id, username, globalName, discriminator, avatar } | null }`.

**Why:**
- Frontend needs user profile (name, avatar) immediately on startup without a second fetch

## Secrets required

- `DISCORD_CLIENT_ID` — from Discord Developer Portal
- `DISCORD_CLIENT_SECRET` — from Discord Developer Portal
- Redirect URI to register: `https://<your-domain>/auth/callback`
