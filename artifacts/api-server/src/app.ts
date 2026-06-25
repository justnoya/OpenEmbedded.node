import express from "express";
import cors from "cors";
import pinoHttp from "pino-http";
import type { IncomingMessage, ServerResponse } from "http";
import router from "./routes";
import { logger } from "./lib/logger";
import { helmetMiddleware, generalLimiter } from "./middleware/security";
import { sessionMiddleware } from "./middleware/auth";

/* ── App ────────────────────────────────────────────────────────────────── */
const app = express();

/* ── Fingerprint removal ─────────────────────────────────────────────────
 *  Stops attackers from trivially identifying the framework.
 *  OWASP A05 — Security Misconfiguration
 * ─────────────────────────────────────────────────────────────────────── */
app.disable("x-powered-by");

/* ── Security headers (Helmet) ───────────────────────────────────────────
 *  CSP, HSTS, X-Frame-Options, X-Content-Type-Options, etc.
 *  CIS Control 9 / OWASP A05
 * ─────────────────────────────────────────────────────────────────────── */
app.use(helmetMiddleware);

/* ── Request logging ─────────────────────────────────────────────────────
 *  Serializers strip query params and env from logs.
 *  MITRE T1552 — Credentials in Files
 * ─────────────────────────────────────────────────────────────────────── */
app.use(
  pinoHttp({
    logger,
    serializers: {
      req(req: IncomingMessage & { id?: unknown }) {
        return {
          id: req.id,
          method: req.method,
          url: req.url?.split("?")[0],
        };
      },
      res(res: ServerResponse) {
        return { statusCode: res.statusCode };
      },
      err(err: Error) {
        return {
          type: err.constructor?.name ?? "Error",
          message: err.message,
        };
      },
    },
  }),
);

/* ── CORS ────────────────────────────────────────────────────────────────
 *  Restricts which origins can make credentialed requests.
 *  OWASP A05 / MITRE T1550
 * ─────────────────────────────────────────────────────────────────────── */
const allowedOrigins: (string | RegExp)[] = process.env["NODE_ENV"] === "production"
  ? [
      /^https:\/\/.*\.replit\.app$/,
      /^https:\/\/.*\.repl\.co$/,
    ]
  : ["http://localhost:5000", "http://localhost:5173"];

if (process.env["FRONTEND_ORIGIN"]) {
  allowedOrigins.push(process.env["FRONTEND_ORIGIN"]);
}

app.use(
  cors({
    origin: allowedOrigins,
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  }),
);

/* ── Body parsers — payload limits ───────────────────────────────────────
 *  Prevents multi-MB payload attacks against Node process memory.
 *  MITRE T1499 — Endpoint Denial of Service
 * ─────────────────────────────────────────────────────────────────────── */
app.use(express.json({ limit: "512kb" }));
app.use(express.urlencoded({ extended: true, limit: "256kb" }));

/* ── Session ─────────────────────────────────────────────────────────────
 *  PostgreSQL-backed, httpOnly cookie. Must come before routes.
 *  OWASP A07 — Identification & Authentication Failures
 * ─────────────────────────────────────────────────────────────────────── */
app.use(sessionMiddleware);

/* ── Global rate limit ───────────────────────────────────────────────────
 *  Broad throttle before any route logic runs.
 *  MITRE T1499
 * ─────────────────────────────────────────────────────────────────────── */
app.use(generalLimiter);

/* ── Routes ──────────────────────────────────────────────────────────── */
app.use("/api", router);

/* ── Global error handler ────────────────────────────────────────────────
 *  Catches all unhandled errors. Never leaks stack traces to the client.
 *  MITRE T1552 — Credentials in Files / OWASP A05
 * ─────────────────────────────────────────────────────────────────────── */
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
