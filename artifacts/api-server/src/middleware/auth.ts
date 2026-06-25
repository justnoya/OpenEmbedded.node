import session from "express-session";
import connectPgSimple from "connect-pg-simple";
import { pool } from "@workspace/db";
import { randomBytes } from "crypto";
import type { RequestHandler } from "express";

/* ── Session secret ─────────────────────────────────────────────────────────
 *  Must be set via SESSION_SECRET env var in production (min 32 chars).
 *  Dev: generates an ephemeral random secret (sessions lost on restart).
 * ─────────────────────────────────────────────────────────────────────────── */
function resolveSecret(): string {
  const s = process.env["SESSION_SECRET"];
  if (s && s.length >= 32) return s;

  if (process.env["NODE_ENV"] === "production") {
    throw new Error(
      "SESSION_SECRET must be set in production. " +
        "Generate: node -e \"console.log(require('crypto').randomBytes(48).toString('hex'))\""
    );
  }

  console.warn(
    "[security] SESSION_SECRET not set — using ephemeral secret. Sessions lost on restart."
  );
  return randomBytes(48).toString("hex");
}

/* ── Session store ──────────────────────────────────────────────────────────
 *  PostgreSQL-backed store keeps sessions alive across restarts.
 *  OWASP A07 — Identification & Authentication Failures
 * ─────────────────────────────────────────────────────────────────────────── */
const PgStore = connectPgSimple(session);

export const sessionMiddleware = session({
  store: new PgStore({
    pool,
    createTableIfMissing: true,
    tableName: "user_sessions",
    pruneSessionInterval: 60 * 15,
  }),
  secret: resolveSecret(),
  name: "oe.sid",
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: process.env["NODE_ENV"] === "production",
    httpOnly: true,
    sameSite: "lax",
    maxAge: 7 * 24 * 60 * 60 * 1000,
  },
});

/* ── requireAuth ────────────────────────────────────────────────────────────
 *  Blocks unauthenticated requests with 401.
 *  OWASP A01 — Broken Access Control
 * ─────────────────────────────────────────────────────────────────────────── */
export const requireAuth: RequestHandler = (req, res, next) => {
  if (!req.session?.userId) {
    res.status(401).json({ error: "Unauthorized — please authenticate via Discord." });
    return;
  }
  next();
};
