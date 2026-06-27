---
name: Forge Activity system
description: Architecture decisions for the Forge collaborative Discord Activity canvas feature.
---

## Key decisions

**Naming:** Feature is called "Forge". Participants are "The Crew". Locking a node is "Claim". Creator is "Forge Owner". Solo mode is "Go Solo".

**WS server attachment:** `index.ts` creates `http.createServer(app)` and passes it to `attachForgeServer(server)`. Server then calls `server.listen(port)` instead of `app.listen(port)`. WS path is `/forge`.

**Why:** Express 5's `app.listen()` returns an `http.Server` but we need the reference *before* it starts listening to attach ws.WebSocketServer. Wrapping app in `http.createServer` gives the reference upfront.

**Vite WS proxy:** Add `/forge` proxy with `ws: true` pointing to `ws://localhost:8080`. Without this, browser WS connections from port 5000 can't reach the API on port 8080.

**Remote/local loop prevention:** `isRemoteChange` ref in `useForge.ts`. Set to `true` before applying incoming server state to graphStore, `false` after. The zustand subscriber skips broadcasting when `isRemoteChange.current === true`. This prevents the update cycle: receive → apply → subscriber fires → re-broadcast.

**Room keying:** Forge rooms are keyed by Discord `channelId`. Everyone in the same voice channel automatically lands in the same room. No invite codes needed — presence = membership.

**Claim system:** `claim:take` event. Server stores `claims Map<nodeId, userId>`. Auto-released on disconnect. Override flag allows taking a claim from someone else (3s hold mechanic on client).

**Activity layout:** `isActivity = isDiscord && sdkState === "ready"`. Builder renders `<ActivityLayout>` instead of desktop/mobile layout when true. ForgeWizard renders as overlay when `wizardStep !== "done"`. Wizard completion persists to `localStorage` key `forge.wizard.done`.

**Wizard flow:** welcome → tour (3 slides) → done. Tour auto-skippable. Welcome offers Start a Forge (forgeMode=forge) or Go Solo (forgeMode=solo).

**Crew colors:** Deterministic from userId hash into 8-color amber/blue/emerald/violet/red/cyan/orange/pink palette. Same userId always gets same color across sessions.

**How to apply:** When building any new collaborative feature, use the `useForge` hook's `send()` for raw events and subscribe via the zustand store for UI state. Don't add new WS message types without updating both `forgeServer.ts` and `handleMessage()` in `useForge.ts`.
