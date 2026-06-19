---
name: Discord Activity SDK types
description: Correct API signatures for @discord/embedded-app-sdk v2.5.0 to avoid TypeScript errors.
---

## Rules

**DiscordSDKMock constructor** — takes 4 arguments, not 3:
`new DiscordSDKMock(clientId, guildId, channelId, locationId)`
All nullable params accept `null`.

**Channel/Guild access** — use properties directly on the SDK instance:
`sdk.channelId`, `sdk.guildId` — both exist on real SDK and mock.
`getSelectedVoiceChannel()` does NOT exist — it was removed in v2.

**useRef in React 19** — requires explicit initial value even with type param:
`useRef<ReturnType<typeof setTimeout> | undefined>(undefined)` not `useRef<...>()`

**Why:** v2.5.0 changed the mock constructor from 3 to 4 args (added locationId). 
The channel/guild properties moved from commands to top-level SDK properties.

**How to apply:** Always check mock.d.ts in the installed SDK version before using mock. 
The real DiscordSDK and DiscordSDKMock share the IDiscordSDK interface for commands 
but differ in constructor signature.
