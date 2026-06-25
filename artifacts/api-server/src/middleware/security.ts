import helmet from "helmet";
import rateLimit from "express-rate-limit";
import type { RequestHandler } from "express";

/* ── Helmet — security headers ──────────────────────────────────────────────
 *  Removes X-Powered-By, sets CSP, HSTS, X-Frame-Options, etc.
 *  CIS Control 9 / OWASP A05
 * ─────────────────────────────────────────────────────────────────────────── */
export const helmetMiddleware = helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", "https://cdn.discordapp.com", "data:", "blob:"],
      connectSrc: ["'self'", "https://discord.com"],
      frameSrc: ["'none'"],
      objectSrc: ["'none'"],
      baseUri: ["'self'"],
    },
  },
  crossOriginEmbedderPolicy: false,
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true,
  },
});

/* ── Rate limiters ──────────────────────────────────────────────────────────
 *  MITRE T1499 — Endpoint Denial of Service
 * ─────────────────────────────────────────────────────────────────────────── */

/** General API — 120 req / min per IP */
export const generalLimiter: RequestHandler = rateLimit({
  windowMs: 60 * 1000,
  max: 120,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many requests. Please slow down." },
  skip: (req) => req.path === "/healthz",
});

/** Auth endpoints — 10 req / 15 min per IP (brute-force protection) */
export const authLimiter: RequestHandler = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many auth attempts. Try again in 15 minutes." },
});

/** Discord bot proxy — 20 req / min (Discord's own limits are tighter) */
export const botLimiter: RequestHandler = rateLimit({
  windowMs: 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Bot API rate limit exceeded. Wait a moment." },
});

/** Webhook send — 5 req / min (strict: hits Discord API) */
export const webhookLimiter: RequestHandler = rateLimit({
  windowMs: 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Webhook send limit exceeded. Wait a moment." },
});
