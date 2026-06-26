import "dotenv/config";
import { Client, GatewayIntentBits, Events, REST, Routes } from "discord.js";
import { createApi } from "./api";
import { handleInteraction } from "./handlers/interactions";
import { statusCommandDef } from "./commands/status";

const token = process.env.OPENBOT_TOKEN;
const clientId = process.env.DISCORD_CLIENT_ID;

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

// ── Register slash commands with Discord ───────────────────────────────────────
async function registerCommands(botToken: string, appId: string): Promise<void> {
  const rest = new REST().setToken(botToken);
  try {
    await rest.put(Routes.applicationCommands(appId), {
      body: [statusCommandDef.toJSON()],
    });
    console.log(`[OpenBot] Slash commands registered (${appId})`);
  } catch (err) {
    console.error("[OpenBot] Failed to register slash commands:", err);
  }
}

client.once(Events.ClientReady, async (readyClient) => {
  console.log(`[OpenBot] Logged in as ${readyClient.user.tag}`);
  console.log(`[OpenBot] Serving ${readyClient.guilds.cache.size} server(s)`);

  // Register slash commands using the resolved application ID
  const appId = clientId ?? readyClient.user.id;
  await registerCommands(token!, appId);

  const port = parseInt(process.env.PORT ?? "3001", 10);
  const api = createApi(client);

  api.listen(port, () => {
    console.log(`[OpenBot] REST API listening on port ${port}`);
    console.log(`[OpenBot] Health: http://localhost:${port}/health`);
  });
});

// ── Guild join ────────────────────────────────────────────────────────────────
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
