/// <reference lib="dom" />
import { Router } from "express";

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
