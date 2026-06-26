---
name: OpenEmbedded esbuild zod import
description: esbuild can't resolve "zod/v4" subpath — must use "zod" direct import with zod as an explicit dep.
---

## Rule
In `artifacts/api-server`, always import from `"zod"` not `"zod/v4"`. Also ensure `zod` is listed in `artifacts/api-server/package.json` dependencies (not just available transitively via `@workspace/api-zod`).

**Why:** esbuild v0.27 bundles all non-external deps at build time. The `zod/v4` subpath export is not resolvable by esbuild because it requires specific package.json `exports` map conditions that aren't set in the build config. The plain `"zod"` import resolves correctly once `zod` is a direct dependency.

**How to apply:** Whenever adding a new route or service to `artifacts/api-server` that needs Zod validation, `import { z } from "zod"` and verify zod is in the package's `dependencies`.
