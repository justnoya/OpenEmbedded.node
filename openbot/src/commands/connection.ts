// @ts-nocheck
import {
  ChatInputCommandInteraction,
  Client,
  EmbedBuilder,
  MessageFlags,
  SlashCommandBuilder,
} from "discord.js";

export const connectionCommandDef = new SlashCommandBuilder()
  .setName("connection")
  .setDescription("Deep-check all API connections and service health");

interface CheckResult {
  label: string;
  ok: boolean;
  latencyMs?: number;
}

async function checkEndpoint(
  name: string,
  url: string,
  options: RequestInit = {},
  timeoutMs = 4000,
): Promise<CheckResult> {
  const start = Date.now();
  try {
    const r = await fetch(url, {
      ...options,
      signal: AbortSignal.timeout(timeoutMs),
    });
    const ms = Date.now() - start;
    if (r.ok) return { label: `✅ Online (${ms}ms)`, ok: true, latencyMs: ms };
    return { label: `⚠️ HTTP ${r.status} (${ms}ms)`, ok: false, latencyMs: ms };
  } catch (err) {
    const ms = Date.now() - start;
    const isTimeout = ms >= timeoutMs - 50;
    return {
      label: isTimeout ? `❌ Timeout (>${timeoutMs}ms)` : `❌ Unreachable`,
      ok: false,
      latencyMs: ms,
    };
  }
}

export async function handleConnectionCommand(
  interaction: ChatInputCommandInteraction,
  client: Client,
): Promise<void> {
  await interaction.deferReply({ flags: MessageFlags.Ephemeral });

  const botPort = parseInt(process.env.PORT ?? "3001", 10);
  const callbackUrl = process.env.OPENBOT_CALLBACK_URL;
  const apiKey = process.env.OPENBOT_API_KEY ?? "";

  // Run all checks in parallel
  const [botApiCheck, discordGatewayCheck, discordApiCheck, oeApiCheck] = await Promise.all([
    // 1. Bot's own Express REST API
    checkEndpoint("Bot REST API", `http://localhost:${botPort}/health`),

    // 2. Discord WebSocket gateway endpoint
    checkEndpoint("Discord Gateway", "https://discord.com/api/v10/gateway"),

    // 3. Discord main API reachability
    checkEndpoint("Discord API", "https://discord.com/api/v10/applications/@me", {
      headers: { Authorization: `Bot ${process.env.OPENBOT_TOKEN ?? ""}` },
    }),

    // 4. OpenEmbedded API server (via callback URL base or localhost fallback)
    (async (): Promise<CheckResult> => {
      const base = callbackUrl
        ? callbackUrl.replace(/\/api\/v1\/openbot\/guild-event$/, "")
        : "http://localhost:8080";
      return checkEndpoint("OpenEmbedded API", `${base}/api/healthz`, {
        headers: { Authorization: `Bearer ${apiKey}` },
      });
    })(),
  ]);

  // Discord gateway WebSocket ping
  const wsPing = client.ws.ping;
  const guildCount = client.guilds.cache.size;
  const botTag = client.user?.tag ?? "Unknown";

  // Classify overall status
  const criticalChecks = [botApiCheck, discordGatewayCheck, discordApiCheck];
  const allCriticalOk = criticalChecks.every((c) => c.ok);
  const anyDown = criticalChecks.some((c) => !c.ok) || !oeApiCheck.ok;
  const statusColor = allCriticalOk && oeApiCheck.ok ? 0x3fb950 : anyDown ? 0xf85149 : 0xf59e0b;
  const statusLine = allCriticalOk && oeApiCheck.ok
    ? "🟢 All systems operational"
    : allCriticalOk
    ? "🟡 Degraded — OpenEmbedded API unreachable"
    : "🔴 Outage detected";

  // Latency bar helper (visual gauge)
  function latencyBar(ms?: number): string {
    if (ms === undefined) return "";
    if (ms < 100) return " 🟢";
    if (ms < 300) return " 🟡";
    return " 🔴";
  }

  const embed = new EmbedBuilder()
    .setTitle("OpenEmbedded — Connection Check")
    .setColor(statusColor)
    .setDescription(statusLine)
    .setThumbnail(client.user?.avatarURL() ?? null)
    .addFields(
      // ── Discord layer ────────────────────────────────────────────────────
      {
        name: "🔗 Discord Gateway (WS)",
        value: `${wsPing >= 0 ? `✅ Connected — \`${wsPing}ms\`` : "❌ Disconnected"}${latencyBar(wsPing >= 0 ? wsPing : undefined)}`,
        inline: false,
      },
      {
        name: "🌐 Discord REST API",
        value: `${discordApiCheck.label}${latencyBar(discordApiCheck.latencyMs)}`,
        inline: true,
      },
      {
        name: "📡 Discord Gateway HTTP",
        value: `${discordGatewayCheck.label}${latencyBar(discordGatewayCheck.latencyMs)}`,
        inline: true,
      },
      // ── Services ─────────────────────────────────────────────────────────
      {
        name: "\u200b",
        value: "**─── Services ───**",
        inline: false,
      },
      {
        name: "🤖 Bot REST API",
        value: `${botApiCheck.label}${latencyBar(botApiCheck.latencyMs)}\n\`localhost:${botPort}/health\``,
        inline: true,
      },
      {
        name: "🔌 OpenEmbedded API",
        value: `${oeApiCheck.label}${latencyBar(oeApiCheck.latencyMs)}\n\`${callbackUrl ? "configured" : "localhost:8080"}\``,
        inline: true,
      },
      // ── Environment ───────────────────────────────────────────────────────
      {
        name: "\u200b",
        value: "**─── Environment ───**",
        inline: false,
      },
      {
        name: "🤖 Bot",
        value: `\`${botTag}\``,
        inline: true,
      },
      {
        name: "🏠 Servers",
        value: `${guildCount}`,
        inline: true,
      },
      {
        name: "💾 Memory",
        value: `${Math.round(process.memoryUsage().heapUsed / 1024 / 1024)} MB / ${Math.round(process.memoryUsage().rss / 1024 / 1024)} MB RSS`,
        inline: true,
      },
      {
        name: "🔑 API Key",
        value: apiKey ? "✅ Configured" : "❌ Not set",
        inline: true,
      },
      {
        name: "📬 Callback URL",
        value: callbackUrl ? "✅ Configured" : "⚠️ Not set (using local fallback)",
        inline: true,
      },
      {
        name: "🆔 Client ID",
        value: process.env.DISCORD_CLIENT_ID ? "✅ Configured" : "⚠️ Not set",
        inline: true,
      },
    )
    .setFooter({ text: "OpenEmbedded Bot — Connection Check" })
    .setTimestamp();

  await interaction.editReply({ embeds: [embed] });
}
