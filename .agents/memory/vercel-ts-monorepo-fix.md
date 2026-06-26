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

## Additional Fixes (Round 2)

### 4. Vercel scans ALL files with the ROOT tsconfig — not per-artifact tsconfigs
Verified across two Vercel builds: changing artifact-specific tsconfigs (jsx, references) had ZERO effect. Vercel's TypeScript check for `framework: null` projects scans every .ts/.tsx file in the repo using the ROOT `tsconfig.json`, regardless of `files: []` or `exclude` settings. The ONLY effective fix is in the root tsconfig itself. Verified locally by creating a tsconfig that extends root + includes all artifact files.

Fix pattern:
- Add `jsx`, `dom` lib, and `paths` to root tsconfig `compilerOptions`
- Create `global.d.ts` at root declaring `ImportMeta.env` (declare as `Record<string,string>` not `Record<string,string|undefined>` to match Vite's runtime behavior; vite package is NOT accessible from root node_modules so cannot use triple-slash ref)
- Add `global.d.ts` to root tsconfig `files` array
- Test with a `tsconfig.vercel-test.json` that extends root + includes all artifact src dirs

### 5. jsx: "preserve" fails on Vercel in TS 5.9 + project references
Frontend artifact tsconfigs with `jsx: "preserve"` + `references` to a composite lib whose `dist/` isn't pre-built cause cascading TS17004/TS6142 errors on Vercel. Two fixes together:
- Change `jsx: "preserve"` → `jsx: "react-jsx"` in all frontend artifact tsconfigs.
- Remove `references` entries where the referenced lib exports its source directly (`"exports": {".": "./src/index.ts"}`); TypeScript resolves types from source without needing composite/dist.

### 5. dedupe-peer-dependents for drizzle
Even with `public-hoist-pattern[]=drizzle-orm*` in `.npmrc`, Vercel's pnpm may resolve different peer-dep hash suffixes for `lib/db` vs `artifacts/api-server`, creating two separate drizzle type instances. Add `dedupe-peer-dependents=true` to `.npmrc`.

### 6. Type augmentations as triple-slash refs
When Vercel scans api-server files with a tsconfig that has a different `types` array, augmentations like `req.log` (pino-http) and `req.session` (express-session) disappear. Fix: add `src/types.d.ts` with `/// <reference types="pino-http" />` and `/// <reference types="express-session" />` — these fire regardless of which tsconfig is active.

## Round 3: ESM relative imports need .js extensions (TS2835 → Emit skipped)

### 7. TS2835 — Vercel uses node16 resolution for post-build check
Vercel's post-build TypeScript checker hardcodes `moduleResolution: node16` regardless of what is in tsconfig. For ESM packages (`"type": "module"`), `node16` requires explicit file extensions on all relative imports. Error: `TS2835: Relative import paths need explicit file extensions`.

**Fix**: Add `.js` extension to every extensionless relative import in `artifacts/openembedded/src/` (42 imports across 24 files). TypeScript's `bundler` mode also resolves `./App.js` → `./App.tsx`, so local builds keep working. Use `.js` not `.tsx` — node16 rejects TS extensions.

### 8. "Emit skipped" — allowImportingTsExtensions + Vercel emit override
After fixing TS2835, Vercel's next error is "Emit skipped". Cause: root tsconfig had `"allowImportingTsExtensions": true` which TypeScript only allows when `noEmit: true`. Vercel overrides `noEmit → false` to emit compiled serverless function output, triggering TS5096 → "Emit skipped".

**Fix**: Remove `allowImportingTsExtensions: true` from root `tsconfig.json` AND from `artifacts/openembedded/tsconfig.json`. Since all imports now use `.js` extensions (not `.tsx`), this option is no longer needed anywhere.

**Rule**: Never put `allowImportingTsExtensions: true` in the root tsconfig. Vercel's emit pass will break it.

## Verification
Run `pnpm --filter @workspace/openembedded run typecheck` — should produce zero output (zero errors).
