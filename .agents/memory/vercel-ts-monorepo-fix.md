---
name: Vercel TypeScript monorepo fix
description: How Vercel's post-build TS checker interacts with pnpm workspaces and how to fix the three error classes it surfaces.
---

## The Problem
Vercel runs its own TypeScript check AFTER the build commands succeed. When `framework: null`, it scans all `.ts`/`.tsx` files using the **root** `tsconfig.json`. The root tsconfig had `"files": []` but no `"exclude"`, so TypeScript still scanned artifact directories with the wrong settings (no `jsx`, no path aliases, no `vite/client`, no Express types).

## Three Error Classes

### 1. JSX / path alias / ImportMeta.env (TS6142, TS17004, TS2307, TS2339)
Root tsconfig lacked `jsx: preserve`, `@/` path aliases, and `vite/client` types.
**Fix**: Add `"exclude": ["artifacts", "openbot", "scripts", "lib", "node_modules"]` to root `tsconfig.json`. Frontend artifact packages have `noEmit: true` which is incompatible with `composite: true`, so they CANNOT be project references — exclusion is the only option.

### 2. Drizzle-orm dual instance (TS2345)
`lib/db` and `artifacts/api-server` each got their own `drizzle-orm` install in their `node_modules/`, causing two separate type instances that TypeScript considers incompatible.
**Fix**: Add `public-hoist-pattern[]=drizzle-orm*` to `.npmrc`, then run `pnpm install --force` to regenerate the lockfile. Both packages' `node_modules/drizzle-orm` become symlinks to the same pnpm virtual store path.

### 3. Express type augmentations not loading (TS2339)
When Vercel used the root tsconfig to check api-server files, `pino-http` (req.log), `express-session` (req.session), and `@types/express` augmentations weren't loaded.
**Fix**: Covered by the exclude fix above (api-server files are excluded from root scan). Additionally:
- `scheduler.ts` used `import cron from "node-cron"` but referenced `cron.ScheduledTask` as a namespace — change to `import * as cron from "node-cron"`.
- `openbot.ts` uses `req.session` — add `import "express-session"` to activate the module augmentation.
- api-server `tsconfig.json`: add `"pino-http"` to `types` array.

## Key Rule: composite: true for application projects
Do NOT add `composite: true` to application-level packages (api-server). `composite` requires all exported types to be explicitly named, but `@types/express-serve-static-core` lives in the pnpm virtual store path which TypeScript can't reference in declaration files → TS2742 errors on every `Router()` and `express()` call.

**Why:** Only library packages that generate `.d.ts` files need `composite: true`. App packages (api-server) use esbuild which doesn't type-check, so composite is irrelevant for them.

## Verification
Run `npx tsc --build tsconfig.json` from root — should produce zero output (zero errors).
