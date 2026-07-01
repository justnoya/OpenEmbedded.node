// @ts-nocheck
import jwt from "jsonwebtoken";
import { randomBytes } from "crypto";
import cookieParser from "cookie-parser";
import type { RequestHandler, Response } from "express";

// ── Token payload ──────────────────────────────────────────────────────────

export type TokenUser = {
  sub: string;
  username: string;
  globalName: string | null;
  discriminator: string;
  avatar: string | null;
};

// ── JWT secret ─────────────────────────────────────────────────────────────

function resolveSecret(): string {
  const s = process.env["JWT_SECRET"] ?? process.env["SESSION_SECRET"];
  if (s && s.length >= 32) return s;

  if (process.env["NODE_ENV"] === "production") {
    throw new Error(
      "JWT_SECRET must be set in production (min 32 chars). " +
        "Generate: node -e \"console.log(require('crypto').randomBytes(48).toString('hex'))\""
    );
  }

  console.warn(
    "[security] JWT_SECRET not set — using ephemeral secret. Tokens invalidated on restart."
  );
  return randomBytes(48).toString("hex");
}

const JWT_SECRET = resolveSecret();

// ── Cookie config ──────────────────────────────────────────────────────────

export const COOKIE_NAME = "oe.tok";
const COOKIE_MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000;

// ── Helpers ────────────────────────────────────────────────────────────────

export function signToken(user: TokenUser): string {
  return jwt.sign(user, JWT_SECRET, { expiresIn: "7d" });
}

export function verifyToken(token: string): TokenUser | null {
  try {
    return jwt.verify(token, JWT_SECRET) as TokenUser;
  } catch {
    return null;
  }
}

export function setAuthCookie(res: Response, user: TokenUser): void {
  const token = signToken(user);
  res.cookie(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env["NODE_ENV"] === "production",
    sameSite: "lax",
    maxAge: COOKIE_MAX_AGE_MS,
    path: "/",
  });
}

export function clearAuthCookie(res: Response): void {
  res.clearCookie(COOKIE_NAME, {
    httpOnly: true,
    secure: process.env["NODE_ENV"] === "production",
    sameSite: "lax",
    path: "/",
  });
}

// ── Middleware ─────────────────────────────────────────────────────────────

export const cookieMiddleware = cookieParser();

export const requireAuth: RequestHandler = (req, res, next) => {
  const token: string | undefined = req.cookies?.[COOKIE_NAME];
  if (!token) {
    res.status(401).json({ error: "Unauthorized — please sign in." });
    return;
  }
  const user = verifyToken(token);
  if (!user) {
    clearAuthCookie(res);
    res.status(401).json({ error: "Session expired — please sign in again." });
    return;
  }
  req.tokenUser = user;
  next();
};

// ── Admin guard ────────────────────────────────────────────────────────────
// Must be used AFTER requireAuth. Checks that the authenticated user matches
// the ADMIN_DISCORD_ID environment secret. Returns 403 for everyone else.

export const requireAdmin: RequestHandler = (req, res, next) => {
  const adminId = process.env["ADMIN_DISCORD_ID"]?.trim();
  if (!adminId) {
    res.status(503).json({ error: "Admin access is not configured on this server." });
    return;
  }
  if (req.tokenUser?.sub !== adminId) {
    res.status(403).json({ error: "Forbidden." });
    return;
  }
  next();
};
