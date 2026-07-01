---
name: OpenEmbedded HTTP Interactions
description: Mode 1 serverless Discord interactions for the Bot Node — architecture, security, and DB design.
---

## The rule
HTTP Interactions (Mode 1) makes button/select responses 24/7 serverless. No persistent Discord.js process needed. Responses are stored in DB and returned synchronously to Discord within 3 seconds.

**Why:** Discord.js bots require a persistent process that sleeps/crashes. HTTP Interactions use a standard POST endpoint that Vercel keeps alive at zero cost.

**How to apply:** Every time a button/select is added to a Bot-node project, the user should "Deploy Interactions" before their message goes live.

## Architecture

### DB tables
- `bot_registrations` — one per project. Stores `application_id`, `public_key` (Ed25519 hex), `token_encrypted` (AES-256-GCM), `interaction_url`, `deployed_at`. UNIQUE(project_id).
- `bot_interaction_handlers` — one per button/select custom_id per bot. `(bot_id, custom_id)` unique. Has `application_id` denormalized for fast lookup without join.

### Lookup flow (hot path)
1. Discord POST → extract `application_id` from body (before sig verify)
2. Query `bot_registrations` by `application_id` → get `public_key`
3. Verify Ed25519 sig with Node built-in crypto
4. On type=3 (component): query `bot_interaction_handlers` by `(application_id, custom_id)`
5. Return response JSON synchronously

### Ed25519 verification (no npm packages)
```ts
import { createPublicKey, verify } from "crypto";
const DER_PREFIX = Buffer.from("302a300506032b6570032100", "hex");
const key = createPublicKey({ key: Buffer.concat([DER_PREFIX, Buffer.from(pubkeyHex, "hex")]), format: "der", type: "spki" });
const ok = verify(null, Buffer.concat([Buffer.from(timestamp), rawBody]), key, Buffer.from(sig, "hex"));
```

### Raw body capture
In `app.ts`, use express.json `verify` callback — NOT a separate middleware:
```ts
app.use(express.json({ limit: "512kb", verify: (req, _res, buf) => { req.rawBody = buf; } }));
```

### Token encryption
AES-256-GCM, key from `BOT_ENCRYPTION_KEY` env var (64-char hex = 32 bytes). Format: `iv:tag:ciphertext` (all hex). Falls back to SESSION_SECRET in dev. Throws in production without BOT_ENCRYPTION_KEY.

### Interaction URL
One URL for all bots: `/api/v1/bot/interact` (no query params). `application_id` from the body identifies which bot registration to use.

## Response types
| `response_type` in DB | Discord response type |
|---|---|
| `send_new` | type 4 (new public message) |
| `ephemeral` | type 4 + flags: 64 |
| `update_message` | type 7 (edit original) |

## Frontend
- `compileInteractionHandlers(nodes, edges)` in `compiler.ts` — finds all `type === "interaction"` edges, compiles target node subtree via `getSubgraph()` helper, returns `{customId, mode, responsePayload}[]`
- BotProperties "Go Live" section — collapsed panel in PropertiesPanel; calls `/api/v1/bot/register` then `/api/v1/bot/deploy/:projectId`; shows endpoint URL to copy
- `useRoute("/builder/:id")` from wouter used to get `projectId` inside BotProperties

## Security
- `interactionsLimiter`: 300 req/min (generous for high button traffic; sig verify rejects tampered requests)
- `botLimiter` (20 req/min) on register/deploy endpoints
- `requireAuth` on all management endpoints; interactions endpoint is public (sig verified)
- Owner check on project ownership before registration/deployment
