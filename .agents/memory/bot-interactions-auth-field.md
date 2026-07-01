---
name: Bot Interactions Auth Field
description: bot-interactions.ts uses req.tokenUser?.sub (not .discordId) for the Discord user ID; .discordId is undefined on TokenUser.
---

# Bot Interactions Auth Field Bug Pattern

## Rule
In `artifacts/api-server/src/routes/bot-interactions.ts`, the authenticated user ID is `req.tokenUser?.sub`, **not** `req.tokenUser?.discordId`. Using `.discordId` silently resolves to `undefined`, causing every call to `/v1/bot/register`, `/v1/bot/deploy/:projectId`, and related endpoints to return `{ success: false, message: "Not authenticated" }` even when the user is fully logged in.

**Why:** The `TokenUser` type in `middleware/auth.ts` uses `sub` (JWT standard claim) for the Discord ID. The field `discordId` does not exist on this type. Since the file is `@ts-nocheck`, this typo is invisible at compile time.

**How to apply:** Any new route in `bot-interactions.ts` that needs the authenticated user's Discord ID must use `req.tokenUser?.sub`, not `.discordId` or `.id`.
