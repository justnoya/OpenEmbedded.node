---
name: OpenEmbedded Bot Node architecture
description: How the OpenBot node, its proxy routes, and its standalone Discord bot project fit together
---

## Rule
The `openbot/` project is deployed separately (not inside the monorepo), then connected to the api-server via two env vars. Users never touch credentials — they just add the bot to their server and pick a channel.

## Architecture

```
Builder (frontend)
  └─ useOpenBotGuilds / useOpenBotChannels / useOpenBotSend  (React Query)
       └─ GET/POST /api/v1/openbot/*  (api-server proxy route)
            └─ openbot/src/api.ts  (Express, port 3001)
                 └─ discord.js Client  (in-memory interaction flow registry)
```

## Key files
- `openbot/src/index.ts` — Discord.js client, starts Express API after login
- `openbot/src/api.ts` — REST API (`/health`, `/guilds`, `/guilds/:id/channels`, `/send`)
- `openbot/src/handlers/interactions.ts` — `flowRegistry` Map, `handleInteraction`, `registerFlows`
- `artifacts/api-server/src/routes/openbot.ts` — proxy reads `OPENBOT_API_URL` + `OPENBOT_API_KEY`

## Env vars required on api-server
- `OPENBOT_API_URL` — deployed openbot base URL (no trailing slash)
- `OPENBOT_API_KEY` — shared secret (same as `OPENBOT_API_KEY` on openbot)

## Env vars required on openbot
- `DISCORD_TOKEN` — bot token
- `DISCORD_CLIENT_ID` — for invite URL generation
- `OPENBOT_API_KEY` — secret key the api-server uses to auth
- `PORT` — default 3001

## Interaction flow registration
Flows are sent as `{ customId, mode, responsePayload }[]` in the `/send` body.
The openbot stores them in `flowRegistry` (in-memory Map). On button/select click,
`handleInteraction` looks up the customId and replies according to `mode`.

**Why:** No separate "deploy" step needed — flows are registered at send time, which is when the message appears in Discord anyway.

## connectionRules
`isBotSendConnection` now accepts both `"bot"` and `"openembedded"` as valid send sources.
Both can connect to Container or Embed nodes via the send handle.

## DiscordMessagePayload cast
`compileGraph` returns `DiscordMessagePayload` which lacks an index signature.
Cast to `Record<string, unknown>` when passing to `OpenBotFlow.responsePayload`.
