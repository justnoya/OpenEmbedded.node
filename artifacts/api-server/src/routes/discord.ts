// @ts-nocheck
/// <reference lib="dom" />
import { Router } from "express";
import { db, usersTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { authLimiter } from "../middleware/security";
import {
  setAuthCookie,
  clearAuthCookie,
  verifyToken,
  COOKIE_NAME,
  type TokenUser,
} from "../middleware/auth";

const router = Router();

/* ── Allowed redirect URIs ───────────────────────────────────────────────────
 *  Only accept redirect URIs from our own origins.
 *  Prevents open-redirect abuse in the OAuth2 authorization-code flow.
 * ─────────────────────────────────────────────────────────────────────────── */
function isAllowedRedirectUri(uri: string): boolean {
  try {
    const url = new URL(uri);
    if (url.pathname !== "/auth/callback") return false;
    if (url.hostname === "localhost" || url.hostname === "127.0.0.1") return true;

    for (const envKey of ["FRONTEND_URL", "FRONTEND_ORIGIN"]) {
      const raw = process.env[envKey];
      if (!raw) continue;
      try {
        if (url.hostname === new URL(raw).hostname) return true;
      } catch { /* ignore bad value */ }
    }

    for (const origin of (process.env["ALLOWED_ORIGINS"] ?? "").split(",").map((o) => o.trim()).filter(Boolean)) {
      try {
        if (url.hostname === new URL(origin).hostname) return true;
      } catch { /* skip */ }
    }

    for (const d of (process.env["REPLIT_DOMAINS"] ?? "").split(",").map((d) => d.trim()).filter(Boolean)) {
      if (url.hostname === d) return true;
    }

    if (url.hostname.endsWith(".replit.app") || url.hostname.endsWith(".repl.co")) return true;

    return false;
  } catch {
    return false;
  }
}

/* ── GET /v1/discord/config ──────────────────────────────────────────────── */
router.get("/v1/discord/config", (_req, res) => {
  const clientId = process.env["DISCORD_CLIENT_ID"] ?? "";
  res.json({ clientId, configured: clientId.length > 0 });
});

/* ── POST /v1/discord/token ──────────────────────────────────────────────────
 *  Exchange a Discord Activity auth code for an access_token.
 *  Used ONLY by the embedded Discord Activity SDK — not the web OAuth flow.
 * ─────────────────────────────────────────────────────────────────────────── */
router.post("/v1/discord/token", authLimiter, async (req, res) => {
  const { code } = req.body as { code?: string };

  if (!code || typeof code !== "string" || code.trim().length === 0) {
    res.status(400).json({ error: "Missing auth code" });
    return;
  }

  const clientId = process.env["DISCORD_CLIENT_ID"];
  const clientSecret = process.env["DISCORD_CLIENT_SECRET"];

  if (!clientId || !clientSecret) {
    req.log.warn("DISCORD_CLIENT_ID or DISCORD_CLIENT_SECRET not configured");
    res.status(503).json({ error: "Discord integration not configured" });
    return;
  }

  try {
    const response = await fetch("https://discord.com/api/oauth2/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        client_id: clientId,
        client_secret: clientSecret,
        grant_type: "authorization_code",
        code: code.trim(),
      }),
    });

    if (!response.ok) {
      req.log.warn({ status: response.status }, "Discord token exchange failed");
      res.status(502).json({ error: "Discord rejected token exchange" });
      return;
    }

    const data = (await response.json()) as { access_token: string };
    res.json({ access_token: data.access_token });
  } catch (err) {
    req.log.error({ type: (err as Error).constructor?.name }, "Token exchange network error");
    res.status(500).json({ error: "Network error during token exchange" });
  }
});

/* ── POST /v1/discord/me ─────────────────────────────────────────────────────
 *  Fetch Discord profile, upsert to DB, and set a JWT auth cookie.
 *  Used by the Discord Activity SDK overlay flow (embedded in Discord).
 * ─────────────────────────────────────────────────────────────────────────── */
router.post("/v1/discord/me", authLimiter, async (req, res) => {
  const { access_token } = req.body as { access_token?: string };

  if (!access_token || typeof access_token !== "string") {
    res.status(400).json({ error: "Missing access_token" });
    return;
  }

  try {
    const profileRes = await fetch("https://discord.com/api/v10/users/@me", {
      headers: { Authorization: `Bearer ${access_token}` },
    });

    if (!profileRes.ok) {
      req.log.warn({ status: profileRes.status }, "Discord profile fetch failed");
      res.status(502).json({ error: "Failed to fetch Discord profile" });
      return;
    }

    const profile = (await profileRes.json()) as {
      id: string;
      username: string;
      global_name?: string | null;
      discriminator: string;
      avatar?: string | null;
    };

    await db
      .insert(usersTable)
      .values({
        discordId: profile.id,
        username: profile.username,
        globalName: profile.global_name ?? null,
        discriminator: profile.discriminator ?? "0",
        avatar: profile.avatar ?? null,
        lastSeenAt: new Date(),
      })
      .onConflictDoUpdate({
        target: usersTable.discordId,
        set: {
          username: profile.username,
          globalName: profile.global_name ?? null,
          discriminator: profile.discriminator ?? "0",
          avatar: profile.avatar ?? null,
          lastSeenAt: new Date(),
        },
      });

    const tokenUser: TokenUser = {
      sub: profile.id,
      username: profile.username,
      globalName: profile.global_name ?? null,
      discriminator: profile.discriminator ?? "0",
      avatar: profile.avatar ?? null,
    };

    setAuthCookie(res, tokenUser);
    req.log.info({ discordId: profile.id }, "Discord Activity user authenticated");

    res.json({
      id: profile.id,
      username: profile.username,
      globalName: profile.global_name ?? null,
      discriminator: profile.discriminator,
      avatar: profile.avatar ?? null,
    });
  } catch (err) {
    req.log.error({ type: (err as Error).constructor?.name }, "Failed to upsert Discord user");
    res.status(500).json({ error: "Internal error saving user" });
  }
});

/* ── POST /v1/auth/login ─────────────────────────────────────────────────────
 *  Web OAuth2 login: exchange a Discord authorization code for a JWT cookie.
 *
 *  Security model:
 *    ✓ Rate-limited (brute-force & replay protection)
 *    ✓ redirect_uri validated server-side against allowed origins (CWE-601)
 *    ✓ Code exchange is fully server-side — client_secret never exposed
 *    ✓ JWT signed with HS256, httpOnly cookie — client JS cannot read it
 *    ✓ access_token NEVER returned to the client or stored
 * ─────────────────────────────────────────────────────────────────────────── */
router.post("/v1/auth/login", authLimiter, async (req, res) => {
  const { code, redirectUri } = req.body as { code?: unknown; redirectUri?: unknown };

  if (!code || typeof code !== "string" || code.trim().length === 0 || code.length > 512) {
    req.log.warn("Auth login: invalid or missing code");
    res.status(400).json({ error: "Invalid authorization code" });
    return;
  }

  if (!redirectUri || typeof redirectUri !== "string" || !isAllowedRedirectUri(redirectUri)) {
    req.log.warn({ redirectUri }, "Auth login: disallowed redirect URI");
    res.status(400).json({ error: "Invalid redirect URI" });
    return;
  }

  const clientId = process.env["DISCORD_CLIENT_ID"];
  const clientSecret = process.env["DISCORD_CLIENT_SECRET"];

  if (!clientId || !clientSecret) {
    req.log.warn("Auth login: Discord credentials not configured");
    res.status(503).json({ error: "Discord integration not configured." });
    return;
  }

  try {
    // 1. Exchange code server-side — client_secret never reaches the browser
    const tokenRes = await fetch("https://discord.com/api/oauth2/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        client_id: clientId,
        client_secret: clientSecret,
        grant_type: "authorization_code",
        code: code.trim(),
        redirect_uri: redirectUri,
      }),
    });

    if (!tokenRes.ok) {
      const errText = await tokenRes.text().catch(() => "");
      req.log.warn(
        { status: tokenRes.status, body: errText.slice(0, 200) },
        "Auth login: Discord rejected code exchange"
      );
      res.status(401).json({
        error: "Discord rejected the authorization code. It may have expired — please try signing in again.",
      });
      return;
    }

    const tokenData = (await tokenRes.json()) as { access_token: string };

    // 2. Fetch profile — access_token is ephemeral here, never stored or returned
    const profileRes = await fetch("https://discord.com/api/v10/users/@me", {
      headers: { Authorization: `Bearer ${tokenData.access_token}` },
    });

    if (!profileRes.ok) {
      req.log.warn({ status: profileRes.status }, "Auth login: profile fetch failed");
      res.status(502).json({ error: "Failed to retrieve your Discord profile. Try again." });
      return;
    }

    const profile = (await profileRes.json()) as {
      id: string;
      username: string;
      global_name?: string | null;
      discriminator: string;
      avatar?: string | null;
    };

    // 3. Upsert user record
    await db
      .insert(usersTable)
      .values({
        discordId: profile.id,
        username: profile.username,
        globalName: profile.global_name ?? null,
        discriminator: profile.discriminator ?? "0",
        avatar: profile.avatar ?? null,
        lastSeenAt: new Date(),
      })
      .onConflictDoUpdate({
        target: usersTable.discordId,
        set: {
          username: profile.username,
          globalName: profile.global_name ?? null,
          discriminator: profile.discriminator ?? "0",
          avatar: profile.avatar ?? null,
          lastSeenAt: new Date(),
        },
      });

    // 4. Sign JWT and set httpOnly cookie — access_token intentionally NOT stored
    const tokenUser: TokenUser = {
      sub: profile.id,
      username: profile.username,
      globalName: profile.global_name ?? null,
      discriminator: profile.discriminator ?? "0",
      avatar: profile.avatar ?? null,
    };

    setAuthCookie(res, tokenUser);
    req.log.info({ discordId: profile.id, username: profile.username }, "Web OAuth login successful");

    res.json({
      id: profile.id,
      username: profile.username,
      globalName: profile.global_name ?? null,
      discriminator: profile.discriminator,
      avatar: profile.avatar ?? null,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    req.log.error(
      { type: err instanceof Error ? err.constructor?.name : typeof err, message },
      "Auth login: unexpected error"
    );

    if (
      message.includes("DATABASE_URL") ||
      message.includes("ECONNREFUSED") ||
      message.includes("ENOTFOUND") ||
      message.includes("connect ETIMEDOUT")
    ) {
      res.status(503).json({ error: "Database is not reachable. Please check DATABASE_URL." });
      return;
    }

    res.status(500).json({ error: "Internal authentication error" });
  }
});

/* ── GET /v1/auth/session ────────────────────────────────────────────────────
 *  Validates the JWT cookie and returns user info.
 *  Frontend calls this on startup to restore auth without re-logging in.
 * ─────────────────────────────────────────────────────────────────────────── */
router.get("/v1/auth/session", async (req, res) => {
  const token: string | undefined = req.cookies?.[COOKIE_NAME];

  if (!token) {
    res.json({ authenticated: false, user: null });
    return;
  }

  const payload = verifyToken(token);
  if (!payload) {
    clearAuthCookie(res);
    res.json({ authenticated: false, user: null });
    return;
  }

  // Optionally re-fetch from DB to confirm user still exists
  try {
    const [user] = await db
      .select({
        id: usersTable.discordId,
        username: usersTable.username,
        globalName: usersTable.globalName,
        discriminator: usersTable.discriminator,
        avatar: usersTable.avatar,
        status: usersTable.status,
        suspendedUntil: usersTable.suspendedUntil,
        suspensionReason: usersTable.suspensionReason,
      })
      .from(usersTable)
      .where(eq(usersTable.discordId, payload.sub))
      .limit(1);

    if (!user) {
      clearAuthCookie(res);
      res.json({ authenticated: false, user: null });
      return;
    }

    // Enforce moderation status on session check
    const status = user.status ?? "active";

    if (status === "banned") {
      clearAuthCookie(res);
      res.json({ authenticated: false, user: null, banned: true });
      return;
    }

    if (status === "suspended") {
      const now = new Date();
      if (!user.suspendedUntil || user.suspendedUntil > now) {
        clearAuthCookie(res);
        res.json({
          authenticated: false,
          user: null,
          suspended: true,
          until: user.suspendedUntil?.toISOString() ?? null,
          reason: user.suspensionReason ?? null,
        });
        return;
      }
      // Suspension expired — auto-heal and continue
      await db
        .update(usersTable)
        .set({ status: "active", suspendedUntil: null, suspensionReason: null })
        .where(eq(usersTable.discordId, payload.sub));
    }

    const { status: _s, suspendedUntil: _u, suspensionReason: _r, ...safeUser } = user;
    res.json({ authenticated: true, user: safeUser });
  } catch (err) {
    req.log.error({ err }, "Session lookup failed");
    res.status(500).json({ error: "Session lookup failed" });
  }
});

/* ── POST /v1/auth/logout ────────────────────────────────────────────────────
 *  Clears the JWT cookie.
 * ─────────────────────────────────────────────────────────────────────────── */
router.post("/v1/auth/logout", (req, res) => {
  clearAuthCookie(res);
  req.log.info("User logged out");
  res.json({ success: true });
});

export default router;
