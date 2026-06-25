/// <reference lib="dom" />
import { Router } from "express";
import { db, usersTable } from "@workspace/db";
import { authLimiter } from "../middleware/security";

const router = Router();

/* ── POST /v1/discord/token ──────────────────────────────────────────────────
 *  Exchange a Discord Activity auth code for an access_token.
 *  Rate-limited: 10 req / 15 min per IP.
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
    res.status(503).json({
      error: "Discord integration not configured",
    });
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

/* ── GET /v1/discord/config ──────────────────────────────────────────────── */
router.get("/v1/discord/config", (_req, res) => {
  const clientId = process.env["DISCORD_CLIENT_ID"] ?? "";
  res.json({ clientId, configured: clientId.length > 0 });
});

/* ── POST /v1/discord/me ─────────────────────────────────────────────────────
 *  Fetch Discord profile, upsert to DB, and establish a server-side session.
 *  OWASP A07 — after this call, req.session.userId is set for all routes.
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

    req.session.userId = profile.id;

    req.log.info({ discordId: profile.id }, "Discord user authenticated and session established");

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

/* ── GET /v1/auth/session ────────────────────────────────────────────────────
 *  Returns the current session state. Frontend calls this on startup.
 * ─────────────────────────────────────────────────────────────────────────── */
router.get("/v1/auth/session", (req, res) => {
  if (!req.session?.userId) {
    res.json({ authenticated: false, userId: null });
    return;
  }
  res.json({ authenticated: true, userId: req.session.userId });
});

/* ── POST /v1/auth/logout ────────────────────────────────────────────────────
 *  Destroys the server-side session and clears the cookie.
 * ─────────────────────────────────────────────────────────────────────────── */
router.post("/v1/auth/logout", (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      req.log.error({ type: (err as Error).constructor?.name }, "Session destroy failed");
      res.status(500).json({ error: "Logout failed" });
      return;
    }
    res.clearCookie("oe.sid");
    res.json({ success: true });
  });
});

export default router;
