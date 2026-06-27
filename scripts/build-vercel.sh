#!/bin/bash
set -e

# ── Cached API build ──────────────────────────────────────────────────────────
# Hash all TypeScript sources that feed into the API server bundle.
# Vercel restores build cache between deploys, so if the hash matches we skip
# esbuild entirely (~5-10 s saved on every unchanged deploy).
# Both the ESM dev bundle (dist/) and the CJS Vercel bundle (api/_dist/) are
# produced by the same build step, so one hash covers both.

HASH_FILE="artifacts/api-server/dist/.build-hash"

SRC_HASH=$(find \
  artifacts/api-server/src \
  artifacts/api-server/build.mjs \
  artifacts/api-server/package.json \
  lib/api-zod/src \
  lib/db/src \
  -type f | sort | xargs md5sum 2>/dev/null | md5sum | cut -d' ' -f1)

CACHED_HASH=$(cat "$HASH_FILE" 2>/dev/null || echo "none")

if [ "$SRC_HASH" = "$CACHED_HASH" ] && [ -f "artifacts/api-server/dist/app.mjs" ] && [ -f "api/_dist/app.cjs" ]; then
  echo "✓ API server unchanged — skipping esbuild (cached)"
else
  echo "→ API server sources changed — running esbuild..."
  pnpm --filter @workspace/api-server run build
  echo "$SRC_HASH" > "$HASH_FILE"
  echo "✓ API server built and hash stored"
fi

# ── Frontend build (always runs — Vite is fast enough) ────────────────────────
pnpm --filter @workspace/openembedded run build
