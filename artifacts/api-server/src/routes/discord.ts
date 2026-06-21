/// <reference lib="dom" />
import { Router } from "express";
import { db, usersTable } from "@workspace/db";

const router = Router();

/**
 * Discord Activity token exchange endpoint.
 * The Embedded App SDK sends a short-lived code; we swap it for a real
 * access token using the client secret (never exposed to the browser).
 */
router.post("/v1/discord/token", async (req, res) => {
  const { code } = req.body as { code?: string };

  if (!code || typeof code !== "string") {
    res.status(400).json({ error: "Missing auth code" });
    return;
  }

  const clientId = process.env.DISCORD_CLIENT_ID;
  const clientSecret = process.env.DISCORD_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    req.log.warn("DISCORD_CLIENT_ID or DISCORD_CLIENT_SECRET not configured");
    res.status(503).json({
      error: "Discord integration not configured — set DISCORD_CLIENT_ID and DISCORD_CLIENT_SECRET",
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
        code,
      }),
    });

    if (!response.ok) {
      const err = await response.text();
      req.log.warn({ status: response.status, err }, "Discord token exchange failed");
      res.status(502).json({ error: `Discord rejected token exchange: ${err}` });
      return;
    }

    const data = (await response.json()) as { access_token: string };
    res.json({ access_token: data.access_token });
  } catch (err) {
    req.log.error({ err }, "Token exchange network error");
    res.status(500).json({ error: "Network error during token exchange" });
  }
});

/**
 * Returns the Discord Client ID for the frontend SDK to use.
 * Safe to expose — it's a public identifier.
 */
router.get("/v1/discord/config", (_req, res) => {
  const clientId = process.env.DISCORD_CLIENT_ID ?? "";
  res.json({ clientId, configured: clientId.length > 0 });
});

/**
 * Upsert the current Discord user into our database.
 * Called by the frontend after successful OAuth authentication.
 * Receives the access_token, fetches profile from Discord, and upserts.
 */
router.post("/v1/discord/me", async (req, res) => {
  const { access_token } = req.body as { access_token?: string };

  if (!access_token || typeof access_token !== "string") {
    res.status(400).json({ error: "Missing access_token" });
    return;
  }

  try {
    // Fetch user profile from Discord
    const profileRes = await fetch("https://discord.com/api/v10/users/@me", {
      headers: { Authorization: `Bearer ${access_token}` },
    });

    if (!profileRes.ok) {
      const errText = await profileRes.text();
      req.log.warn({ status: profileRes.status, errText }, "Discord profile fetch failed");
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

    // Upsert user record
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

    req.log.info({ discordId: profile.id, username: profile.username }, "Discord user upserted");

    res.json({
      id: profile.id,
      username: profile.username,
      globalName: profile.global_name ?? null,
      discriminator: profile.discriminator,
      avatar: profile.avatar ?? null,
    });
  } catch (err) {
    req.log.error({ err }, "Failed to upsert Discord user");
    res.status(500).json({ error: "Internal error saving user" });
  }
});

export default router;
