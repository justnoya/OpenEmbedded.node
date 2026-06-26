# OpenBot — OpenEmbedded Official Discord Bot

The officially deployed bot that powers the OpenEmbedded platform. Users add this bot to their Discord server once via an OAuth2 invite link; after that, they can pick any channel and send Components V2 messages directly from the editor — no bot token needed on their end.

## Architecture

```
Browser (editor)
    ↕ HTTPS
api-server (Express)     ──[OPENBOT_API_KEY]──▶  openbot (this project)
    ↕ PostgreSQL                                     ↕ Discord Gateway
    user_authorized_guilds                         Discord API
```

- **api-server** proxies all bot operations (guilds, channels, send) — the frontend never calls openbot directly.
- **openbot** runs as a standalone Discord.js v14 process, ideally on a persistent host (Pterodactyl, Railway, Fly.io, etc.).
- The `OPENBOT_API_KEY` is a shared secret that authenticates api-server ↔ openbot.

---

## Quick Start (Development)

```bash
# 1. Install dependencies
npm install

# 2. Configure environment
cp .env.example .env
# Fill in OPENBOT_TOKEN, DISCORD_CLIENT_ID, OPENBOT_API_KEY

# 3. Run in dev mode (auto-restarts on file changes)
npm run dev

# 4. Production build
npm run build && npm start
```

---

## Environment Variables

| Variable | Required | Description |
|---|---|---|
| `OPENBOT_TOKEN` | ✅ | Bot token from the Discord Developer Portal (Bot → Token) |
| `DISCORD_CLIENT_ID` | ✅ | Application Client ID (General Information page) |
| `OPENBOT_API_KEY` | ✅ | Shared secret with api-server. Generate: `openssl rand -hex 32` |
| `OPENBOT_CALLBACK_URL` | — | api-server URL for guild-join webhooks (e.g. `https://app.example.com/api/v1/openbot/guild-event`) |
| `PORT` | — | API port (default: `3001`) |
| `ALLOWED_ORIGIN` | — | CORS origin for the API (default: `*`) |

---

## Phase 2 Setup — Server Authorization Flow

Users add the bot to their server via a Discord OAuth2 invite link. For the callback to record which server the user added the bot to, you must:

### 1. Register the redirect URI in Discord

1. Go to [Discord Developer Portal](https://discord.com/developers/applications) → your application → **OAuth2** → **Redirects**
2. Add your api-server's callback URL:
   ```
   https://YOUR_DOMAIN/api/v1/openbot/invite/callback
   ```
   For Replit development, use your Replit dev domain:
   ```
   https://xxxxx.replit.dev/api/v1/openbot/invite/callback
   ```

### 2. Configure api-server env vars

```
OPENBOT_API_URL=http://localhost:3001    # or your deployed openbot URL
OPENBOT_API_KEY=<same key as openbot>
PUBLIC_URL=https://YOUR_DOMAIN           # your api-server's public URL (used to build callback URL)
```

### 3. How the flow works

1. User clicks **Add Bot to Server** in the editor
2. A Discord OAuth2 page opens (new tab) with the bot invite
3. User selects their server and authorizes
4. Discord redirects to `/api/v1/openbot/invite/callback?guild_id=...`
5. api-server records `(user_id, guild_id)` in `user_authorized_guilds`
6. User closes that tab, returns to the editor, clicks **Refresh**
7. Their server appears in the picker — pick a channel and send!

---

## API Endpoints (Internal)

All endpoints except `/health` require `Authorization: Bearer <OPENBOT_API_KEY>`.

| Method | Path | Description |
|---|---|---|
| `GET` | `/health` | Public ping — returns bot status, clientId, invite URL |
| `GET` | `/guilds` | List all servers the bot is in |
| `GET` | `/guilds/:id` | Single guild info (checks if bot is in that server) |
| `GET` | `/guilds/:id/channels` | Text channels for a guild |
| `POST` | `/send` | Send a message `{ channelId, payload, flows? }` |

---

## Bot Permissions (116736)

| Permission | Value |
|---|---|
| View Channels | 1024 |
| Send Messages | 2048 |
| Embed Links | 16384 |
| Attach Files | 32768 |
| Read Message History | 65536 |

Plus `applications.commands` scope for slash command registration.

---

## Deploying on Pterodactyl / any host

```bash
npm run build
# Set env vars in your panel, then start:
node dist/index.js
```
