/**
 * Full-screen loading overlay shown while the Discord Activity SDK is
 * initialising or performing the OAuth handshake.
 * Only rendered when sdkState is "loading" or "auth" inside Discord.
 */
import { useDiscord } from "@/lib/discordContext";
import { Loader2 } from "lucide-react";

const STAGE_TEXT: Record<string, string> = {
  loading: "Connecting to Discord…",
  auth: "Authorising with Discord…",
  error: "Failed to connect to Discord",
};

export function DiscordActivityOverlay() {
  const { isDiscord, sdkState } = useDiscord();

  if (!isDiscord || sdkState === "idle" || sdkState === "ready") return null;

  const isError = sdkState === "error";

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 9999,
        background: "#080A0F",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: 20,
      }}
    >
      {/* Logo */}
      <div
        style={{
          width: 64,
          height: 64,
          borderRadius: 16,
          background: "linear-gradient(135deg, #5865F2, #7c3aed)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: "#fff",
          fontSize: 22,
          fontWeight: 800,
          letterSpacing: "-0.04em",
          boxShadow: "0 8px 32px rgba(88,101,242,0.4)",
        }}
      >
        OE
      </div>

      {!isError ? (
        <Loader2
          size={28}
          style={{ animation: "spin 1s linear infinite", color: "#5865F2" }}
        />
      ) : (
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#f85149" strokeWidth="2">
          <circle cx="12" cy="12" r="10" />
          <line x1="15" y1="9" x2="9" y2="15" />
          <line x1="9" y1="9" x2="15" y2="15" />
        </svg>
      )}

      <div style={{ textAlign: "center" }}>
        <div style={{ color: "#e6edf3", fontSize: 16, fontWeight: 600, marginBottom: 6 }}>
          OpenEmbedded
        </div>
        <div style={{ color: "#7d8590", fontSize: 13 }}>
          {STAGE_TEXT[sdkState] ?? "Loading…"}
        </div>
        {isError && (
          <div style={{ color: "#484f58", fontSize: 11, marginTop: 10, maxWidth: 280 }}>
            Make sure DISCORD_CLIENT_ID and DISCORD_CLIENT_SECRET are set in your environment.
          </div>
        )}
      </div>

      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
