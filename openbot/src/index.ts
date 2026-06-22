import "dotenv/config";
import { Client, GatewayIntentBits, Events } from "discord.js";
import { createApi } from "./api";
import { handleInteraction } from "./handlers/interactions";

if (!process.env.DISCORD_TOKEN) {
  console.error("[OpenBot] DISCORD_TOKEN env var is required. Copy .env.example to .env and fill it in.");
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

client.on(Events.InteractionCreate, handleInteraction);

client.on(Events.Error, (err) => {
  console.error("[OpenBot] Discord client error:", err);
});

client.login(process.env.DISCORD_TOKEN);
