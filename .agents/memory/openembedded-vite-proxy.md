---
name: OpenEmbedded Vite proxy
description: Why the Vite dev-server proxy must use "/api" not "/v1"
---

The Express API server mounts its router with `app.use("/api", router)`.
The router itself defines routes starting with `/v1/...`.
So all API endpoints are at `/api/v1/...` (e.g. `/api/v1/projects`, `/api/v1/webhook/send`).

The Orval-generated client generates URLs with the `/api/` prefix (e.g. `return "/api/v1/projects"`).

**The proxy key must therefore be `"/api"` not `"/v1"`.**

If the proxy is set to `"/v1"`, requests to `/api/v1/webhook/send` are not intercepted and fall
through to the Vite server itself, causing a 404 / "network error" in the UI.

**Fix location:** `artifacts/openembedded/vite.config.ts` — `server.proxy` key.
