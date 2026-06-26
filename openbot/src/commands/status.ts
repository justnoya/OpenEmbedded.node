import {
  ChatInputCommandInteraction,
  Client,
  EmbedBuilder,
  MessageFlags,
  SlashCommandBuilder,
} from "discord.js";

export const statusCommandDef = new SlashCommandBuilder()
  .setName("status")
  .setDescription("Check OpenEmbedded Bot status and API health");

function formatUptime(ms: number): string {
  const totalSeconds = Math.floor(ms / 1000);
  const d = Math.floor(totalSeconds / 86400);
  const h = Math.floor((totalSeconds % 86400) / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  const s = totalSeconds % 60;
  if (d > 0) return `${d}d ${h}h ${m}m`;
  if (h > 0) return `${h}h ${m}m ${s}s`;
  if (m > 0) return `${m}m ${s}s`;
  return `${s}s`;
}

async function checkSelfApi(port: number): Promise<{ ok: boolean; label: string }> {
  try {
    const start = Date.now();
    const r = await fetch(`http://localhost:${port}/health`, {
      signal: AbortSignal.timeout(3000),
    });
    const ms = Date.now() - start;
    if (r.ok) return { ok: true, label: `✅ Online (${ms}ms)` };
    return { ok: false, label: `⚠️ HTTP ${r.status}` };
  } catch {
    return { ok: false, label: "❌ Unreachable" };
  }
}

export async function handleStatusCommand(
  interaction: ChatInputCommandInteraction,
  client: Client,
): Promise<void> {
  await interaction.deferReply({ flags: MessageFlags.Ephemeral });

  const port = parseInt(process.env.PORT ?? "3001", 10);
  const [apiCheck] = await Promise.all([checkSelfApi(port)]);

  const wsPing = client.ws.ping;
  const guildCount = client.guilds.cache.size;
  const uptime = client.uptime ?? 0;
  const clientId = process.env.DISCORD_CLIENT_ID ?? client.user?.id ?? "—";
  const botTag = client.user?.tag ?? "Unknown";

  const overallOk = apiCheck.ok && wsPing < 500;

  const embed = new EmbedBuilder()
    .setTitle("OpenEmbedded Bot — Status")
    .setColor(overallOk ? 0x3fb950 : 0xf59e0b)
    .setThumbnail(client.user?.avatarURL() ?? null)
    .addFields(
      {
        name: "🤖 Bot",
        value: `\`${botTag}\`\nClient ID: \`${clientId}\``,
        inline: false,
      },
      {
        name: "🌐 Gateway",
        value: "✅ Connected",
        inline: true,
      },
      {
        name: "📶 WS Ping",
        value: wsPing >= 0 ? `${wsPing}ms` : "—",
        inline: true,
      },
      {
        name: "🏠 Servers",
        value: `${guildCount}`,
        inline: true,
      },
      {
        name: "⏱️ Uptime",
        value: formatUptime(uptime),
        inline: true,
      },
      {
        name: "🔌 REST API",
        value: apiCheck.label,
        inline: true,
      },
      {
        name: "💾 Memory",
        value: `${Math.round(process.memoryUsage().heapUsed / 1024 / 1024)} MB`,
        inline: true,
      },
    )
    .setFooter({ text: "OpenEmbedded Bot" })
    .setTimestamp();

  await interaction.editReply({ embeds: [embed] });
}
