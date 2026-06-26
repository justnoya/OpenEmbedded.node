import "dotenv/config";
import { Client, GatewayIntentBits, Events } from "discord.js";
import { createApi } from "./api";
import { handleInteraction } from "./handlers/interactions";

const token = process.env.OPENBOT_TOKEN;

if (!token) {
  console.error("[OpenBot] OPENBOT_TOKEN env var is required. Copy .env.example to .env and fill it in.");
  process.exit(1);
}

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
  ],
});

client.once(Events.ClientReady, (readyClient) => {
  console.log(`[OpenBot] Logged in as ${readyClient.user.tag}`);
  console.log(`[OpenBot] Serving ${readyClient.guilds.cache.size} server(s)`);

  const port = parseInt(process.env.PORT ?? "3001", 10);
  const api = createApi(client);

  api.listen(port, () => {
    console.log(`[OpenBot] REST API listening on port ${port}`);
    console.log(`[OpenBot] Health: http://localhost:${port}/health`);
  });
});

// ── Guild join — notify api-server so it can record the authorization ─────────
client.on(Events.GuildCreate, async (guild) => {
  console.log(`[OpenBot] Joined guild: ${guild.name} (${guild.id})`);

  const callbackUrl = process.env.OPENBOT_CALLBACK_URL;
  if (!callbackUrl) return;

  try {
    const res = await fetch(callbackUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.OPENBOT_API_KEY ?? ""}`,
      },
      body: JSON.stringify({ event: "guild_create", guildId: guild.id, guildName: guild.name }),
    });
    if (!res.ok) {
      console.warn(`[OpenBot] Guild join callback failed: HTTP ${res.status}`);
    }
  } catch (err) {
    console.warn(`[OpenBot] Could not reach guild join callback:`, err);
  }
});

// ── Guild leave ───────────────────────────────────────────────────────────────
client.on(Events.GuildDelete, (guild) => {
  console.log(`[OpenBot] Left guild: ${guild.name} (${guild.id})`);
});

client.on(Events.InteractionCreate, handleInteraction);

client.on(Events.Error, (err) => {
  console.error("[OpenBot] Discord client error:", err);
});

client.login(token);
