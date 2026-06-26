/// <reference lib="dom" />
import { Router } from "express";
import { db } from "@workspace/db";
import { userAuthorizedGuildsTable } from "@workspace/db";
import { eq, and } from "drizzle-orm";

const router = Router();

function getConfig(): { url: string; key: string } | null {
  const url = process.env.OPENBOT_API_URL?.replace(/\/$/, "");
  const key = process.env.OPENBOT_API_KEY;
  if (!url || !key) return null;
  return { url, key };
}

async function openBotFetch(path: string, options: RequestInit = {}): Promise<Response> {
  const config = getConfig();
  if (!config) throw new Error("OpenEmbedded Bot is not configured on this server.");
  return fetch(`${config.url}${path}`, {
    ...options,
    headers: {
      Authorization: `Bearer ${config.key}`,
      "Content-Type": "application/json",
      ...(options.headers ?? {}),
    },
  });
}

function getPublicUrl(req: { protocol: string; get: (h: string) => string | undefined }): string {
  return process.env.PUBLIC_URL?.replace(/\/$/, "")
    ?? `${req.protocol}://${req.get("host") ?? "localhost"}`;
}

// ── GET /v1/openbot/guilds ────────────────────────────────────────────────────
// Returns all guilds the OpenEmbedded bot is in, plus the invite URL.
router.get("/v1/openbot/guilds", async (req, res) => {
  if (!getConfig()) {
    res.json({
      success: false,
      guilds: [],
      inviteUrl: null,
      message: "OpenEmbedded Bot is not yet configured on this server. Set OPENBOT_API_URL and OPENBOT_API_KEY.",
    });
    return;
  }
  try {
    const r = await openBotFetch("/guilds");
    if (!r.ok) {
      const text = await r.text();
      req.log.warn({ status: r.status, body: text }, "OpenBot /guilds rejected");
      res.json({ success: false, guilds: [], inviteUrl: null, message: `Bot API error (${r.status})` });
      return;
    }
    const data = await r.json() as {
      success: boolean;
      guilds?: Array<{ id: string; name: string; icon: string | null }>;
      inviteUrl?: string | null;
    };
    res.json(data);
  } catch (err) {
    req.log.error({ err }, "OpenBot guilds fetch failed");
    res.json({ success: false, guilds: [], inviteUrl: null, message: "Could not reach the OpenEmbedded Bot." });
  }
});

// ── GET /v1/openbot/invite-url ────────────────────────────────────────────────
// Returns a full OAuth2 invite URL with redirect_uri so Discord can callback
// after the user adds the bot to their server.
router.get("/v1/openbot/invite-url", async (req, res) => {
  if (!getConfig()) {
    res.json({ inviteUrl: null, message: "Bot not configured." });
    return;
  }
  try {
    const r = await openBotFetch("/health");
    if (!r.ok) {
      res.json({ inviteUrl: null, message: `Bot API error (${r.status})` });
      return;
    }
    const data = await r.json() as { inviteUrl?: string | null; clientId?: string };
    if (!data.inviteUrl) {
      res.json({ inviteUrl: null, message: "Bot has no client ID configured." });
      return;
    }

    const publicUrl = getPublicUrl(req as never);
    const redirectUri = `${publicUrl}/api/v1/openbot/invite/callback`;
    const fullUrl = `${data.inviteUrl}&response_type=code&redirect_uri=${encodeURIComponent(redirectUri)}`;
    res.json({ inviteUrl: fullUrl, redirectUri });
  } catch (err) {
    req.log.error({ err }, "OpenBot invite-url fetch failed");
    res.json({ inviteUrl: null, message: "Could not reach the OpenEmbedded Bot." });
  }
});

// ── GET /v1/openbot/invite/callback ───────────────────────────────────────────
// Discord redirects here after the user adds the bot to their server.
// Records the guild against the logged-in user's account.
router.get("/v1/openbot/invite/callback", async (req, res) => {
  const { guild_id } = req.query as { guild_id?: string };

  const htmlPage = (success: boolean, authenticated: boolean) => `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${success ? "Bot Added" : "Already Added"} — OpenEmbedded</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
           background: #111; color: #fff; display: flex; align-items: center;
           justify-content: center; min-height: 100vh; }
    .card { background: #1a1a1a; border: 1px solid rgba(255,255,255,0.08);
            border-radius: 16px; padding: 40px 32px; text-align: center; max-width: 420px; width: 90%; }
    h2 { font-size: 20px; font-weight: 700; margin: 16px 0 8px; }
    p { color: #666; font-size: 14px; line-height: 1.6; margin-bottom: 24px; }
    .icon { font-size: 52px; }
    button { background: #efefef; color: #111; border: none; border-radius: 8px;
             padding: 10px 28px; font-size: 14px; font-weight: 600; cursor: pointer; }
    button:hover { background: #fff; }
    .warn { background: rgba(245,158,11,0.1); border: 1px solid rgba(245,158,11,0.2);
            border-radius: 8px; padding: 10px 14px; color: #f59e0b; font-size: 12px; margin-bottom: 20px; }
  </style>
</head>
<body>
  <div class="card">
    <div class="icon">${success ? "✅" : "🔄"}</div>
    <h2>${success ? "Bot added to server!" : "Server registered"}</h2>
    ${!authenticated ? '<div class="warn">You were not logged in — the server was not linked to your account. Log in and try again.</div>' : ""}
    <p>Return to the OpenEmbedded editor and click <strong>Refresh</strong> to see your server in the list.</p>
    <button onclick="window.close()">Close this tab</button>
  </div>
</body>
</html>`;

  if (!guild_id || !/^\d{17,20}$/.test(guild_id)) {
    res.status(400).send("<h1>Invalid callback — missing or malformed guild_id.</h1>");
    return;
  }

  const session = req.session as { userId?: string };
  if (!session.userId) {
    res.send(htmlPage(false, false));
    return;
  }

  try {
    await db.insert(userAuthorizedGuildsTable)
      .values({ userId: session.userId, guildId: guild_id })
      .onConflictDoNothing();
    res.send(htmlPage(true, true));
  } catch (err) {
    req.log.error({ err }, "OpenBot invite callback DB insert failed");
    res.status(500).send("<h1>Internal error recording guild.</h1>");
  }
});

// ── GET /v1/openbot/my-guilds ─────────────────────────────────────────────────
// Returns guilds this user has authorized the bot into, intersected with the
// bot's live guild list (so removed guilds disappear automatically).
router.get("/v1/openbot/my-guilds", async (req, res) => {
  const session = req.session as { userId?: string };
  if (!session.userId) {
    res.json({ guilds: [], inviteUrl: null });
    return;
  }

  try {
    const authRows = await db.select()
      .from(userAuthorizedGuildsTable)
      .where(eq(userAuthorizedGuildsTable.userId, session.userId));

    const authorizedIds = new Set(authRows.map((r) => r.guildId));

    if (authorizedIds.size === 0) {
      res.json({ guilds: [], inviteUrl: null });
      return;
    }

    // Fetch bot's live guild list to get names/icons and verify membership
    let botGuilds: Array<{ id: string; name: string; icon: string | null }> = [];
    let inviteUrl: string | null = null;

    if (getConfig()) {
      try {
        const r = await openBotFetch("/guilds");
        if (r.ok) {
          const data = await r.json() as {
            guilds?: typeof botGuilds;
            inviteUrl?: string | null;
          };
          botGuilds = data.guilds ?? [];
          inviteUrl = data.inviteUrl ?? null;
        }
      } catch {
        // Bot unreachable — return empty so UI shows reconnect state
      }
    }

    // Only show guilds where the bot is actually present
    const myGuilds = botGuilds.filter((g) => authorizedIds.has(g.id));
    res.json({ guilds: myGuilds, inviteUrl });
  } catch (err) {
    req.log.error({ err }, "OpenBot my-guilds query failed");
    res.json({ guilds: [], inviteUrl: null });
  }
});

// ── DELETE /v1/openbot/my-guilds/:guildId ─────────────────────────────────────
// Removes a guild from the user's authorized list.
router.delete("/v1/openbot/my-guilds/:guildId", async (req, res) => {
  const session = req.session as { userId?: string };
  if (!session.userId) {
    res.status(401).json({ error: "Not authenticated." });
    return;
  }
  const { guildId } = req.params;
  try {
    await db.delete(userAuthorizedGuildsTable)
      .where(and(
        eq(userAuthorizedGuildsTable.userId, session.userId),
        eq(userAuthorizedGuildsTable.guildId, guildId),
      ));
    res.status(204).send();
  } catch (err) {
    req.log.error({ err }, "OpenBot my-guilds delete failed");
    res.status(500).json({ error: "Failed to remove guild." });
  }
});

// ── POST /v1/openbot/channels ─────────────────────────────────────────────────
// Returns text channels for the given guildId.
router.post("/v1/openbot/channels", async (req, res) => {
  const { guildId } = req.body as { guildId?: string };
  if (!guildId) {
    res.status(400).json({ success: false, channels: [], message: "guildId is required." });
    return;
  }
  if (!getConfig()) {
    res.json({ success: false, channels: [], message: "OpenEmbedded Bot is not configured on this server." });
    return;
  }
  try {
    const r = await openBotFetch(`/guilds/${guildId}/channels`);
    if (!r.ok) {
      res.json({ success: false, channels: [], message: `Bot API error (${r.status})` });
      return;
    }
    const data = await r.json() as { success: boolean; channels?: Array<{ id: string; name: string }>; message?: string | null };
    res.json(data);
  } catch (err) {
    req.log.error({ err }, "OpenBot channels fetch failed");
    res.json({ success: false, channels: [], message: "Could not reach the OpenEmbedded Bot." });
  }
});

// ── POST /v1/openbot/send ─────────────────────────────────────────────────────
// Proxies a full CV2 message send (with optional interaction flows) to the bot.
router.post("/v1/openbot/send", async (req, res) => {
  const { channelId, payload, flows } = req.body as {
    channelId?: string;
    payload?: Record<string, unknown>;
    flows?: Array<{ customId: string; mode: string; responsePayload: Record<string, unknown> }>;
  };

  if (!channelId || !payload) {
    res.status(400).json({ success: false, message: "channelId and payload are required." });
    return;
  }
  if (!getConfig()) {
    res.json({ success: false, message: "OpenEmbedded Bot is not configured on this server." });
    return;
  }

  try {
    const r = await openBotFetch("/send", {
      method: "POST",
      body: JSON.stringify({ channelId, payload, flows: flows ?? [] }),
    });
    if (!r.ok) {
      const text = await r.text();
      let msg = `Bot API error (${r.status})`;
      try {
        const json = JSON.parse(text) as { message?: string };
        if (json.message) msg = json.message;
      } catch { /* ignore */ }
      req.log.warn({ status: r.status, body: text }, "OpenBot send rejected");
      res.json({ success: false, message: msg });
      return;
    }
    const data = await r.json() as { success: boolean; message?: string | null };
    res.json(data);
  } catch (err) {
    req.log.error({ err }, "OpenBot send failed");
    res.json({ success: false, message: "Could not reach the OpenEmbedded Bot — check your connection." });
  }
});

export default router;
