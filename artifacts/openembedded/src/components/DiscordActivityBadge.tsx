/**
 * Small status badge shown in the Builder toolbar when running as a Discord Activity.
 * Shows SDK state, authenticated user, and a "Rich Presence active" pill.
 */
import { useDiscord } from "@/lib/discordContext";
import { Loader2, Wifi, WifiOff, User } from "lucide-react";

function avatarUrl(userId: string, avatarHash: string | null) {
  if (!avatarHash) return `https://cdn.discordapp.com/embed/avatars/${Number(userId) % 6}.png`;
  return `https://cdn.discordapp.com/avatars/${userId}/${avatarHash}.png?size=32`;
}

export function DiscordActivityBadge() {
  const { isDiscord, sdkState, user } = useDiscord();
  if (!isDiscord) return null;

  const statusColor =
    sdkState === "ready" ? "#3fb950" :
    sdkState === "error" ? "#f85149" :
    "#d29922";

  const statusLabel =
    sdkState === "ready" ? "Activity" :
    sdkState === "auth" ? "Authorising…" :
    sdkState === "loading" ? "Connecting…" :
    "Error";

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 6,
        background: "rgba(88,101,242,0.1)",
        border: "1px solid rgba(88,101,242,0.25)",
        borderRadius: 20,
        padding: "3px 10px 3px 6px",
        flexShrink: 0,
      }}
      title="Running as Discord Activity"
    >
      {/* Discord "blurple" logo mark */}
      <svg width="14" height="11" viewBox="0 0 71 55" fill="#5865F2">
        <path d="M60.1 4.9A58.5 58.5 0 0 0 45.5.8a.2.2 0 0 0-.2.1c-.6 1.1-1.3 2.5-1.8 3.6a54 54 0 0 0-16.1 0A37 37 0 0 0 25.6.9a.2.2 0 0 0-.2-.1A58.4 58.4 0 0 0 10.8 4.9a.2.2 0 0 0-.1.1C1.6 18.1-.9 31 .3 43.7a.2.2 0 0 0 .1.2 58.7 58.7 0 0 0 17.7 8.9.2.2 0 0 0 .2-.1c1.4-1.9 2.6-3.8 3.6-5.9a.2.2 0 0 0-.1-.3 38.7 38.7 0 0 1-5.5-2.6.2.2 0 0 1 0-.3l1.1-.9a.2.2 0 0 1 .2 0c11.5 5.3 24 5.3 35.4 0a.2.2 0 0 1 .2 0l1.1.9a.2.2 0 0 1 0 .3 36 36 0 0 1-5.5 2.6.2.2 0 0 0-.1.3c1.1 2 2.3 4 3.6 5.9a.2.2 0 0 0 .2.1 58.5 58.5 0 0 0 17.8-8.9.2.2 0 0 0 .1-.2c1.5-15-2.5-28-10.5-39.6a.2.2 0 0 0-.1-.2ZM23.7 36c-3.5 0-6.4-3.2-6.4-7.1s2.8-7.1 6.4-7.1c3.6 0 6.5 3.2 6.4 7.1 0 3.9-2.8 7.1-6.4 7.1Zm23.6 0c-3.5 0-6.4-3.2-6.4-7.1s2.8-7.1 6.4-7.1c3.6 0 6.5 3.2 6.4 7.1 0 3.9-2.8 7.1-6.4 7.1Z" />
      </svg>

      {sdkState === "loading" || sdkState === "auth" ? (
        <Loader2 size={11} style={{ animation: "spin 1s linear infinite", color: "#d29922" }} />
      ) : sdkState === "ready" ? (
        <Wifi size={11} style={{ color: "#3fb950" }} />
      ) : (
        <WifiOff size={11} style={{ color: "#f85149" }} />
      )}

      <span style={{ fontSize: 11, fontWeight: 600, color: statusColor }}>
        {statusLabel}
      </span>

      {user && (
        <>
          <div style={{ width: 1, height: 12, background: "rgba(255,255,255,0.1)" }} />
          <img
            src={avatarUrl(user.id, user.avatar)}
            alt={user.username}
            style={{ width: 16, height: 16, borderRadius: "50%", flexShrink: 0 }}
          />
          <span style={{ fontSize: 11, color: "#b1bac4", fontWeight: 500 }}>
            {user.global_name ?? user.username}
          </span>
        </>
      )}

      {sdkState === "ready" && (
        <>
          <div style={{ width: 1, height: 12, background: "rgba(255,255,255,0.1)" }} />
          <span style={{ fontSize: 10, color: "#5865F2", fontWeight: 700, letterSpacing: "0.03em" }}>
            RP ON
          </span>
        </>
      )}
    </div>
  );
}
