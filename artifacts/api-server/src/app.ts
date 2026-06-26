import express from "express";
import cors from "cors";
import pinoHttp from "pino-http";
import type { IncomingMessage, ServerResponse } from "http";
import router from "./routes";
import { logger } from "./lib/logger";
import { helmetMiddleware, generalLimiter } from "./middleware/security";
import { cookieMiddleware } from "./middleware/auth";
import { pool, ensureSchema } from "@workspace/db";

/**
 * Kick off schema migration immediately when the module loads.
 * On Vercel this runs once per cold start; warm invocations reuse the
 * already-resolved promise (effectively free). The middleware below gates
 * every request on this promise so no query ever runs before the schema
 * is confirmed ready.
 */
const schemaReady: Promise<void> = ensureSchema(pool).catch((err: unknown) => {
  logger.error({ err }, "Schema migration failed on startup");
  return Promise.reject(err);
});

/* ── App ────────────────────────────────────────────────────────────────── */
const app = express();

/* ── Proxy trust ─────────────────────────────────────────────────────────
 *  Vercel and Replit sit behind a reverse proxy that sets X-Forwarded-For.
 *  "1" means trust the first hop (the platform load-balancer only).
 * ─────────────────────────────────────────────────────────────────────── */
app.set("trust proxy", 1);

app.disable("x-powered-by");

/* ── Security headers (Helmet) ─────────────────────────────────────────── */
app.use(helmetMiddleware);

/* ── Request logging ───────────────────────────────────────────────────── */
app.use(
  pinoHttp({
    logger,
    serializers: {
      req(req: IncomingMessage & { id?: unknown }) {
        return { id: req.id, method: req.method, url: req.url?.split("?")[0] };
      },
      res(res: ServerResponse) {
        return { statusCode: res.statusCode };
      },
      err(err: Error) {
        return { type: err.constructor?.name ?? "Error", message: err.message };
      },
    },
  }),
);

/* ── CORS ─────────────────────────────────────────────────────────────────
 *  Restricts credentialed cross-origin requests to known origins.
 * ─────────────────────────────────────────────────────────────────────── */
const allowedOrigins: (string | RegExp)[] =
  process.env["NODE_ENV"] === "production"
    ? [
        /^https:\/\/.*\.replit\.app$/,
        /^https:\/\/.*\.repl\.co$/,
        /^https:\/\/.*\.vercel\.app$/,
      ]
    : ["http://localhost:5000", "http://localhost:5173"];

if (process.env["FRONTEND_ORIGIN"]) allowedOrigins.push(process.env["FRONTEND_ORIGIN"]);
(process.env["ALLOWED_ORIGINS"] ?? "")
  .split(",")
  .map((o) => o.trim())
  .filter(Boolean)
  .forEach((o) => allowedOrigins.push(o));

app.use(
  cors({
    origin: allowedOrigins,
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  }),
);

/* ── Body parsers ──────────────────────────────────────────────────────── */
app.use(express.json({ limit: "512kb" }));
app.use(express.urlencoded({ extended: true, limit: "256kb" }));

/* ── Cookie parser ─────────────────────────────────────────────────────── */
app.use(cookieMiddleware);

/* ── Global rate limit ─────────────────────────────────────────────────── */
app.use(generalLimiter);

/* ── Schema readiness gate ────────────────────────────────────────────────
 *  Awaits the one-time migration promise before any route handler runs.
 *  On warm Vercel invocations schemaReady is already resolved — the
 *  .then() microtask costs ~0 ms.
 * ─────────────────────────────────────────────────────────────────────── */
app.use((_req, _res, next) => {
  schemaReady.then(() => next(), next);
});

/* ── Routes ──────────────────────────────────────────────────────────────*/
app.use("/api", router);

/* ── Global error handler ──────────────────────────────────────────────── */
app.use(
  (
    err: Error,
    _req: express.Request,
    res: express.Response,
    _next: express.NextFunction,
  ) => {
    logger.error({ type: err.constructor?.name, message: err.message }, "Unhandled error");
    res.status(500).json({ error: "Internal server error" });
  },
);

export default app;
