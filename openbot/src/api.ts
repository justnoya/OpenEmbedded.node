import express, { Request, Response, NextFunction } from "express";
import cors from "cors";
import { Client, TextChannel, MessageCreateOptions } from "discord.js";
import { registerFlows } from "./handlers/interactions";

export function createApi(client: Client): express.Application {
  const app = express();
  const API_KEY = process.env.OPENBOT_API_KEY;

  if (!API_KEY) {
    throw new Error("[OpenBot] OPENBOT_API_KEY env var is required to start the API server.");
  }

  app.use(express.json({ limit: "1mb" }));
  app.use(cors({ origin: process.env.ALLOWED_ORIGIN ?? "*" }));

  // ── Auth middleware (skip /health) ──────────────────────────────────────────
  app.use((req: Request, res: Response, next: NextFunction) => {
    if (req.path === "/health") return next();
    const auth = req.headers.authorization;
    if (!auth || auth !== `Bearer ${API_KEY}`) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }
    next();
  });

  // ── GET /health — public ping ────────────────────────────────────────────────
  app.get("/health", (_req: Request, res: Response) => {
    const me = client.user;
    const clientId = process.env.DISCORD_CLIENT_ID ?? me?.id ?? "";
    const inviteUrl = clientId
      ? `https://discord.com/api/oauth2/authorize?client_id=${clientId}&permissions=2048&scope=bot%20applications.commands`
      : null;
    res.json({
      ok: true,
      botName: me?.username ?? "Offline",
      botAvatar: me?.avatarURL() ?? null,
      guildCount: client.guilds.cache.size,
      inviteUrl,
    });
  });

  // ── GET /guilds — list servers the bot is in ─────────────────────────────────
  app.get("/guilds", (_req: Request, res: Response) => {
    const me = client.user;
    const clientId = process.env.DISCORD_CLIENT_ID ?? me?.id ?? "";
    const inviteUrl = clientId
      ? `https://discord.com/api/oauth2/authorize?client_id=${clientId}&permissions=2048&scope=bot%20applications.commands`
      : null;

    const guilds = client.guilds.cache.map((g) => ({
      id: g.id,
      name: g.name,
      icon: g.iconURL(),
    }));

    res.json({ success: true, guilds, inviteUrl });
  });

  // ── GET /guilds/:guildId/channels ─────────────────────────────────────────────
  app.get("/guilds/:guildId/channels", async (req: Request, res: Response) => {
    const { guildId } = req.params;
    const guild = client.guilds.cache.get(guildId);

    if (!guild) {
      res.json({ success: false, channels: [], message: "OpenEmbedded Bot is not in this server. Add it first using the invite link." });
      return;
    }

    try {
      const fetched = await guild.channels.fetch();
      const textChannels = fetched
        .filter((c) => c !== null && c.type === 0)
        .map((c) => ({ id: c!.id, name: (c as { name: string }).name }))
        .sort((a, b) => a.name.localeCompare(b.name));
      res.json({ success: true, channels: textChannels });
    } catch (err) {
      console.error("[OpenBot] channels fetch error:", err);
      res.json({ success: false, channels: [], message: "Failed to fetch channels." });
    }
  });

  // ── POST /send ────────────────────────────────────────────────────────────────
  app.post("/send", async (req: Request, res: Response) => {
    const { channelId, payload, flows } = req.body as {
      channelId?: string;
      payload?: Record<string, unknown>;
      flows?: Array<{ customId: string; mode: string; responsePayload: Record<string, unknown> }>;
    };

    if (!channelId || !payload) {
      res.status(400).json({ success: false, message: "channelId and payload are required." });
      return;
    }

    try {
      const channel = await client.channels.fetch(channelId);
      if (!channel || !channel.isTextBased()) {
        res.json({ success: false, message: "Channel not found or is not a text channel." });
        return;
      }

      await (channel as TextChannel).send(payload as MessageCreateOptions);

      // Register interaction flows after a successful send
      if (flows && flows.length > 0) {
        registerFlows(flows);
      }

      res.json({ success: true, message: null });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      console.error("[OpenBot] send error:", err);
      res.json({ success: false, message: `Failed to send message: ${msg}` });
    }
  });

  return app;
}
