---
name: OpenEmbedded workflow setup
description: How workflows for the OpenEmbedded monorepo must be configured to start correctly.
---

## Rule
The API Server workflow command must explicitly set PORT=8080:
`PORT=8080 pnpm --filter @workspace/api-server run dev`

Without this, the server throws "PORT environment variable is required" and exits immediately even though artifact.toml declares `localPort = 8080`.

**Why:** The artifact.toml port declaration is only for proxy routing — it does not inject PORT into the process environment. The Express server in `artifacts/api-server/src/index.ts` throws hard if PORT is absent.

**How to apply:** Always use `configureWorkflow` with the PORT prefix in the command string. The frontend workflow (`pnpm --filter @workspace/openembedded run dev`) reads PORT from the services.env in artifact.toml and does not need this prefix.
