/// <reference lib="dom" />
import { Router } from "express";
import { botLimiter } from "../middleware/security";

const router = Router();

const DISCORD_API = "https://discord.com/api/v10";

/* ── Discord token format: three base64url segments separated by dots ───────
 *  Provides a fast pre-validation before hitting Discord's API.
 *  Reduces unnecessary external calls from invalid/garbage tokens.
 * ─────────────────────────────────────────────────────────────────────────── */
const TOKEN_RE = /^[A-Za-z0-9+/=_-]{24,}\.[A-Za-z0-9+/=_-]{6}\.[A-Za-z0-9+/=_-]{27,}$/;

function isValidTokenFormat(token: string): boolean {
  return TOKEN_RE.test(token.trim());
}

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

/* ── POST /v1/bot/validate ───────────────────────────────────────────────────
 *  Rate-limited: 20 req / min per IP.
 * ─────────────────────────────────────────────────────────────────────────── */
router.post("/v1/bot/validate", botLimiter, async (req, res) => {
  const { token } = req.body as { token?: string };
  if (!token || typeof token !== "string" || !isValidTokenFormat(token)) {
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
      req.log.warn({ status: meRes.status }, "Bot token rejected by Discord");
      res.json({ success: false, message: "Discord rejected the token." });
      return;
    }
    const me = await meRes.json() as {
      username?: string;
      discriminator?: string;
      avatar?: string;
      id?: string;
    };
    const guildsRaw = guildsRes.ok
      ? (await guildsRes.json().catch(() => [])) as Array<{ id: string; name: string; icon: string | null }>
      : [];
    res.json({
      success: true,
      botName: me.discriminator === "0" ? me.username : `${me.username}#${me.discriminator}`,
      botAvatar:
        me.avatar && me.id
          ? `https://cdn.discordapp.com/avatars/${me.id}/${me.avatar}.png`
          : null,
      guilds: guildsRaw.map((g) => ({ id: g.id, name: g.name, icon: g.icon })),
      message: null,
    });
  } catch (err) {
    req.log.error({ type: (err as Error).constructor?.name }, "Bot validate failed");
    res.json({ success: false, message: "Network error contacting Discord." });
  }
});

/* ── POST /v1/bot/channels ───────────────────────────────────────────────────
 *  Rate-limited: 20 req / min per IP.
 * ─────────────────────────────────────────────────────────────────────────── */
router.post("/v1/bot/channels", botLimiter, async (req, res) => {
  const { token, guildId } = req.body as { token?: string; guildId?: string };
  if (!token || !guildId || !isValidTokenFormat(token)) {
    res.json({ success: false, message: "token and guildId are required.", channels: [] });
    return;
  }
  if (!/^\d{17,20}$/.test(guildId)) {
    res.json({ success: false, message: "Invalid guildId format.", channels: [] });
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
    req.log.error({ type: (err as Error).constructor?.name }, "Bot channels failed");
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

/* ── POST /v1/bot/send ───────────────────────────────────────────────────────
 *  Rate-limited: 20 req / min per IP.
 * ─────────────────────────────────────────────────────────────────────────── */
router.post("/v1/bot/send", botLimiter, async (req, res) => {
  const { token, channelId, payload } = req.body as {
    token?: string;
    channelId?: string;
    payload?: Record<string, unknown>;
  };
  if (!token || !channelId || !payload || !isValidTokenFormat(token)) {
    res.json({ success: false, message: "token, channelId, and payload are required." });
    return;
  }
  if (!/^\d{17,20}$/.test(channelId)) {
    res.json({ success: false, message: "Invalid channelId format." });
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
        const json = JSON.parse(text) as {
          message?: string;
          code?: number;
          errors?: unknown;
        };
        if (json.message) msg = `Discord error: ${json.message}`;
        if (json.code) msg += ` (code ${json.code})`;
        if (json.errors) {
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
      req.log.warn({ status: r.status }, "Bot send rejected");
      res.json({ success: false, message: msg, detail });
      return;
    }
    res.json({ success: true, message: null });
  } catch (err) {
    req.log.error({ type: (err as Error).constructor?.name }, "Bot send failed");
    res.json({ success: false, message: "Network error sending message." });
  }
});

export default router;
