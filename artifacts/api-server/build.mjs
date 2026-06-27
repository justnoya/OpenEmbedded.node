import { createRequire } from "node:module";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { build as esbuild } from "esbuild";
import esbuildPluginPino from "esbuild-plugin-pino";
import { rm } from "node:fs/promises";

const resolveJsToTs = {
  name: "js-to-ts",
  setup(build) {
    build.onResolve({ filter: /^\..*\.js$/ }, async (args) => {
      if (args.pluginData?.skipJsToTs) return undefined;
      for (const ext of [".ts", ".tsx"]) {
        const result = await build.resolve(args.path.replace(/\.js$/, ext), {
          resolveDir: args.resolveDir,
          kind: args.kind,
          pluginData: { skipJsToTs: true },
        });
        if (!result.errors.length) return { path: result.path };
      }
      return undefined;
    });
  },
};

// Plugins (e.g. 'esbuild-plugin-pino') may use `require` to resolve dependencies
globalThis.require = createRequire(import.meta.url);

const artifactDir = path.dirname(fileURLToPath(import.meta.url));

const sharedExternals = [
  "*.node",
  "sharp",
  "better-sqlite3",
  "sqlite3",
  "canvas",
  "bcrypt",
  "argon2",
  "fsevents",
  "re2",
  "farmhash",
  "xxhash-addon",
  "bufferutil",
  "utf-8-validate",
  "ssh2",
  "cpu-features",
  "dtrace-provider",
  "isolated-vm",
  "lightningcss",
  "pg-native",
  "oracledb",
  "mongodb-client-encryption",
  "nodemailer",
  "handlebars",
  "knex",
  "typeorm",
  "protobufjs",
  "onnxruntime-node",
  "@tensorflow/*",
  "@prisma/client",
  "@mikro-orm/*",
  "@grpc/*",
  "@swc/*",
  "@aws-sdk/*",
  "@azure/*",
  "@opentelemetry/*",
  "@google-cloud/*",
  "@google/*",
  "googleapis",
  "firebase-admin",
  "@parcel/watcher",
  "@sentry/profiling-node",
  "@tree-sitter/*",
  "aws-sdk",
  "classic-level",
  "dd-trace",
  "ffi-napi",
  "grpc",
  "hiredis",
  "kerberos",
  "leveldown",
  "miniflare",
  "mysql2",
  "newrelic",
  "odbc",
  "piscina",
  "realm",
  "ref-napi",
  "rocksdb",
  "sass-embedded",
  "sequelize",
  "serialport",
  "snappy",
  "tinypool",
  "usb",
  "workerd",
  "wrangler",
  "zeromq",
  "zeromq-prebuilt",
  "playwright",
  "puppeteer",
  "puppeteer-core",
  "electron",
];

async function buildAll() {
  const distDir = path.resolve(artifactDir, "dist");
  await rm(distDir, { recursive: true, force: true });

  // ── ESM build (for local dev server) ────────────────────────────────────────
  await esbuild({
    entryPoints: [
      path.resolve(artifactDir, "src/index.ts"),
      path.resolve(artifactDir, "src/app.ts"),
    ],
    platform: "node",
    bundle: true,
    format: "esm",
    outdir: distDir,
    outExtension: { ".js": ".mjs" },
    logLevel: "info",
    external: sharedExternals,
    sourcemap: "linked",
    plugins: [
      resolveJsToTs,
      esbuildPluginPino({ transports: ["pino-pretty"] }),
    ],
    banner: {
      js: `import { createRequire as __bannerCrReq } from 'node:module';
import __bannerPath from 'node:path';
import __bannerUrl from 'node:url';

globalThis.require = __bannerCrReq(import.meta.url);
globalThis.__filename = __bannerUrl.fileURLToPath(import.meta.url);
globalThis.__dirname = __bannerPath.dirname(globalThis.__filename);
    `,
    },
  });

  // ── CJS build (for Vercel serverless function) ───────────────────────────────
  // Pre-compiling to CJS means Vercel's bundler never needs to run its
  // ESM-to-CJS Babel step, eliminating the 7-minute compilation and Babel crash.
  const vercelDistDir = path.resolve(artifactDir, "../../api/_dist");
  await rm(vercelDistDir, { recursive: true, force: true });

  await esbuild({
    entryPoints: [path.resolve(artifactDir, "src/app.ts")],
    platform: "node",
    bundle: true,
    format: "cjs",
    outdir: vercelDistDir,
    outExtension: { ".js": ".cjs" },
    logLevel: "silent",
    external: sharedExternals,
    sourcemap: false,
    plugins: [
      resolveJsToTs,
      esbuildPluginPino({ transports: ["pino-pretty"] }),
    ],
    // ESM packages bundled into CJS have import.meta.url === undefined at runtime.
    // This shim makes fileURLToPath(import.meta.url) work correctly in the CJS bundle.
    banner: {
      js: `const __importMetaUrl = require("url").pathToFileURL(__filename).href;`,
    },
    define: {
      "import.meta.url": "__importMetaUrl",
    },
  });
  console.log("  api/_dist/ CJS bundle ready for Vercel");
}

buildAll().catch((err) => {
  console.error(err);
  process.exit(1);
});
