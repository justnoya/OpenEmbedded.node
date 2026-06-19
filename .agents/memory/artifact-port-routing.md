---
name: Replit artifact port routing
description: react-vite artifacts may get path-based IDs that prevent proxy routing; workaround is serving frontend from Express.
---

When `createArtifact` is called for a react-vite app, it sometimes assigns a path-based ID like `"artifacts/openembedded"` instead of a ULID (e.g. `"3B4_FFSkEVBkAeYMFRJ2e"`). Artifacts with path-based IDs never get their proxy route registered, so `localhost:80/{previewPath}` returns 502 and `restart_workflow` fails with DIDNT_OPEN_A_PORT regardless of which supported port Vite uses.

**Why:** The proxy routing system uses the artifact ID to register path→port mappings. Path-based IDs are not recognized, so no route is created. `verifyAndReplaceArtifactToml` cannot change the ID field.

**How to apply:** If a react-vite workflow keeps failing with DIDNT_OPEN_A_PORT despite Vite starting fine:
1. Check the artifact's `id` field — if it's `"artifacts/<slug>"` (path format, not a ULID), the proxy route will never register.
2. Workaround: build the frontend (`PORT=5000 BASE_PATH="/" pnpm --filter @workspace/<slug> run build`), add `express.static` + `/{*splat}` catch-all to the Express API server, and update the API server's artifact.toml `paths` to `["/"]` and `previewPath` to `"/"`. The react-vite artifact's previewPath must be changed to something like `"/app"` first (to free up `"/"`) — do this via `verifyAndReplaceArtifactToml`.
3. In Express 5, the catch-all route must be `app.get("/{*splat}", ...)` — `app.get("*", ...)` throws a PathError due to path-to-regexp v8.
4. The frontend `vite.config.ts` must NOT throw when PORT is missing — use `const port = rawPort ? Number(rawPort) : 5000` so `vite build` works without PORT env.
