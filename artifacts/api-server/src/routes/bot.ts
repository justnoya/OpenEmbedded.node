/// <reference lib="dom" />
import { Router } from "express";

const router = Router();

const DISCORD_API = "https://discord.com/api/v10";

async function discordFetch(path: string, token: string, options: RequestInit = {}) {
  return fetch(`${DISCORD_API}${path}`, {
    ...options,
    headers: {
      Authorization: `Bot ${token}`,
      "Content-Type": "application/json",
      ...(options.headers ?? {}),
    },
  });
}

router.post("/v1/bot/validate", async (req, res) => {
  const { token } = req.body as { token?: string };
  if (!token || typeof token !== "string" || token.trim().length < 20) {
    res.json({ success: false, message: "Invalid token format." });
    return;
  }
  const t = token.trim();
  try {
    const [meRes, guildsRes] = await Promise.all([
      discordFetch("/users/@me", t),
      discordFetch("/users/@me/guilds", t),
    ]);
    if (!meRes.ok) {
      const err = await meRes.json().catch(() => ({})) as Record<string, unknown>;
      res.json({ success: false, message: `Discord rejected token: ${(err.message as string) ?? meRes.status}` });
      return;
    }
    const me = await meRes.json() as { username?: string; discriminator?: string; avatar?: string; id?: string };
    const guildsRaw = guildsRes.ok ? await guildsRes.json().catch(() => []) as Array<{ id: string; name: string; icon: string | null }> : [];
    res.json({
      success: true,
      botName: me.discriminator === "0" ? me.username : `${me.username}#${me.discriminator}`,
      botAvatar: me.avatar && me.id ? `https://cdn.discordapp.com/avatars/${me.id}/${me.avatar}.png` : null,
      guilds: guildsRaw.map((g) => ({ id: g.id, name: g.name, icon: g.icon })),
      message: null,
    });
  } catch (err) {
    req.log.error({ err }, "Bot validate failed");
    res.json({ success: false, message: "Network error contacting Discord." });
  }
});

router.post("/v1/bot/channels", async (req, res) => {
  const { token, guildId } = req.body as { token?: string; guildId?: string };
  if (!token || !guildId) {
    res.json({ success: false, message: "token and guildId are required.", channels: [] });
    return;
  }
  try {
    const r = await discordFetch(`/guilds/${guildId}/channels`, token.trim());
    if (!r.ok) {
      res.json({ success: false, message: `Failed to fetch channels (${r.status})`, channels: [] });
      return;
    }
    const all = await r.json() as Array<{ id: string; name: string; type: number }>;
    const textChannels = all
      .filter((c) => c.type === 0)
      .map((c) => ({ id: c.id, name: c.name }))
      .sort((a, b) => a.name.localeCompare(b.name));
    res.json({ success: true, channels: textChannels, message: null });
  } catch (err) {
    req.log.error({ err }, "Bot channels failed");
    res.json({ success: false, message: "Network error fetching channels.", channels: [] });
  }
});

const CV2_COMPONENT_TYPES = new Set([9, 10, 11, 12, 14, 17]);

function hasCV2Components(components: unknown): boolean {
  if (!Array.isArray(components)) return false;
  for (const c of components) {
    if (c && typeof c === "object") {
      const comp = c as Record<string, unknown>;
      if (CV2_COMPONENT_TYPES.has(comp.type as number)) return true;
      if (hasCV2Components(comp.components)) return true;
    }
  }
  return false;
}

router.post("/v1/bot/send", async (req, res) => {
  const { token, channelId, payload } = req.body as { token?: string; channelId?: string; payload?: Record<string, unknown> };
  if (!token || !channelId || !payload) {
    res.json({ success: false, message: "token, channelId, and payload are required." });
    return;
  }

  const safePayload = { ...payload };
  const isCV2 = hasCV2Components(safePayload.components);
  if (isCV2) {
    safePayload.flags = ((safePayload.flags as number | undefined) ?? 0) | 32768;
    delete safePayload.embeds;
    delete safePayload.content;
  }

  try {
    const r = await discordFetch(`/channels/${channelId}/messages`, token.trim(), {
      method: "POST",
      body: JSON.stringify(safePayload),
    });
    if (!r.ok) {
      const text = await r.text();
      let msg = `Discord rejected the message (HTTP ${r.status})`;
      let detail: string | null = null;
      try {
        const json = JSON.parse(text) as { message?: string; code?: number; errors?: unknown };
        if (json.message) msg = `Discord error: ${json.message}`;
        if (json.code) msg += ` (code ${json.code})`;
        if (json.errors) {
          // Flatten Discord's nested errors object into readable field paths
          const flat: string[] = [];
          function walk(obj: unknown, path: string) {
            if (!obj || typeof obj !== "object") return;
            const o = obj as Record<string, unknown>;
            if (Array.isArray(o._errors)) {
              const errs = o._errors as Array<{ message?: string }>;
              flat.push(`${path}: ${errs.map((e) => e.message).join(", ")}`);
            } else {
              for (const [k, v] of Object.entries(o)) {
                walk(v, path ? `${path}.${k}` : k);
              }
            }
          }
          walk(json.errors, "");
          if (flat.length > 0) detail = flat.slice(0, 5).join("; ");
        }
      } catch {
        if (text) msg += `: ${text.slice(0, 200)}`;
      }
      req.log.warn({ status: r.status, body: text }, "Bot send rejected");
      res.json({ success: false, message: msg, detail });
      return;
    }
    res.json({ success: true, message: null });
  } catch (err) {
    req.log.error({ err }, "Bot send failed");
    res.json({ success: false, message: "Network error sending message." });
  }
});

export default router;
