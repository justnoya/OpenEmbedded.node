# OpenBot — OpenEmbedded Official Discord Bot

The officially deployed bot that powers the OpenEmbedded platform. Users add this bot to their server, select a channel in the builder, and send — no token setup required on their end.

## Quick Start

```bash
# 1. Install dependencies
npm install

# 2. Configure environment
cp .env.example .env
# Edit .env with your Discord token, client ID, and a strong API key

# 3. Development
npm run dev

# 4. Production
npm run build
npm start
```

## Environment Variables

| Variable | Required | Description |
|---|---|---|
| `DISCORD_TOKEN` | ✅ | Your bot token from the Discord Developer Portal |
| `DISCORD_CLIENT_ID` | ✅ | Your application's client ID (for invite link generation) |
| `OPENBOT_API_KEY` | ✅ | Secret key shared with the OpenEmbedded api-server. Generate with `openssl rand -hex 32` |
| `PORT` | — | API port (default: `3001`) |
| `ALLOWED_ORIGIN` | — | CORS origin for the api-server (default: `*`, lock down in production) |

## Connecting to the Builder

Set these two env vars on the **api-server**:

```env
OPENBOT_API_URL=https://your-openbot-domain.com   # No trailing slash
OPENBOT_API_KEY=your_secret_api_key_here           # Must match OPENBOT_API_KEY above
```

## API Endpoints

All routes except `/health` require `Authorization: Bearer <OPENBOT_API_KEY>`.

| Method | Path | Description |
|---|---|---|
| `GET` | `/health` | Public health check — returns bot name, avatar, invite URL |
| `GET` | `/guilds` | List servers the bot is in (with invite URL) |
| `GET` | `/guilds/:id/channels` | List text channels in a server |
| `POST` | `/send` | Send a message `{ channelId, payload, flows? }` |

## Deploying

### PM2 (recommended)
```bash
npm run build
pm2 start dist/index.js --name openbot
pm2 save
```

### Docker
```dockerfile
FROM node:22-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY dist ./dist
CMD ["node", "dist/index.js"]
```

## Bot Permissions

The bot needs these permissions in Discord:
- `Send Messages` (2048)
- `Use Application Commands` (for slash commands)

Invite URL format:
```
https://discord.com/api/oauth2/authorize?client_id=YOUR_CLIENT_ID&permissions=2048&scope=bot%20applications.commands
```
