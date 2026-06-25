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

/* ── Session table bootstrap ────────────────────────────────────────────────
 *  Creates the user_sessions table inline using the pool directly.
 *  This avoids connect-pg-simple's createTableIfMissing which reads a SQL
 *  file from disk — that file is absent in bundled/serverless environments.
 *  Safe to call multiple times (IF NOT EXISTS).
 * ─────────────────────────────────────────────────────────────────────────── */
export async function ensureSessionTable(): Promise<void> {
  const client = await pool.connect();
  try {
    await client.query(`
      CREATE TABLE IF NOT EXISTS "user_sessions" (
        "sid"    varchar      NOT NULL,
        "sess"   json         NOT NULL,
        "expire" timestamp(6) NOT NULL,
        CONSTRAINT "user_sessions_pkey" PRIMARY KEY ("sid")
      );
      CREATE INDEX IF NOT EXISTS "IDX_user_sessions_expire"
        ON "user_sessions" ("expire");
    `);
  } finally {
    client.release();
  }
}

/* ── Session store ──────────────────────────────────────────────────────────
 *  PostgreSQL-backed store keeps sessions alive across restarts.
 *  createTableIfMissing is disabled — we bootstrap the table via
 *  ensureSessionTable() at app startup instead, avoiding the disk-read issue.
 *  OWASP A07 — Identification & Authentication Failures
 * ─────────────────────────────────────────────────────────────────────────── */
const PgStore = connectPgSimple(session);

export const sessionMiddleware = session({
  store: new PgStore({
    pool,
    createTableIfMissing: false,
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
