// @ts-nocheck
import { useState } from "react";
import { useDiscord } from "../lib/discordContext.js";

function AppLogoImg({ size = 40 }: { size?: number }) {
  return (
    <img
      src="/logo.png"
      alt="OpenEmbedded logo"
      width={size}
      height={size}
      style={{ objectFit: "contain", display: "block" }}
    />
  );
}

function Spinner() {
  return (
    <svg width="15" height="15" viewBox="0 0 15 15" fill="none" style={{ animation: "oe-spin 0.85s linear infinite" }}>
      <circle cx="7.5" cy="7.5" r="6" stroke="rgba(88,101,242,0.18)" strokeWidth="1.5" />
      <path d="M7.5 1.5A6 6 0 0 1 13.5 7.5" stroke="#5865F2" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

function SectionLabel({ children }: { children: string }) {
  return (
    <div style={{
      fontSize: 12,
      fontWeight: 600,
      textTransform: "uppercase",
      letterSpacing: "0.06em",
      color: "#3a3a3a",
      marginBottom: 8,
    }}>
      {children}
    </div>
  );
}

export function DiscordActivityOverlay() {
  const { isDiscord, sdkState, errorMsg, user, accessToken, syncUser } = useDiscord();
  const [confirmed, setConfirmed] = useState(false);
  const [imgError, setImgError] = useState(false);
  const [hoverContinue, setHoverContinue] = useState(false);
  const [continuing, setContinuing] = useState(false);

  if (!isDiscord || sdkState === "idle" || confirmed) return null;

  const isLoading = sdkState === "loading" || sdkState === "auth";
  const isReady = sdkState === "ready";
  const isError = sdkState === "error";

  const avatarUrl = user
    ? (!imgError && user.avatar
        ? `https://cdn.discordapp.com/avatars/${user.id}/${user.avatar}.png?size=128`
        : `https://cdn.discordapp.com/embed/avatars/${parseInt(user.id) % 6}.png`)
    : null;

  const displayName = user?.global_name ?? user?.username ?? "";
  const username = user?.username ?? "";

  const handleContinue = async () => {
    setContinuing(true);
    try {
      if (accessToken) await syncUser(accessToken);
    } catch {
      // non-blocking — proceed even if backend sync fails
    }
    setConfirmed(true);
  };

  return (
    <div style={{
      position: "fixed",
      inset: 0,
      zIndex: 9999,
      background: "#111111",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      fontFamily: `"DM Sans", "Inter", system-ui, sans-serif`,
    }}>
      {/* Ambient glow */}
      <div style={{
        position: "absolute",
        width: 560,
        height: 560,
        borderRadius: "50%",
        background: "radial-gradient(circle, rgba(88,101,242,0.07) 0%, transparent 70%)",
        top: "50%",
        left: "50%",
        transform: "translate(-50%, -55%)",
        pointerEvents: "none",
      }} />

      <div style={{
        position: "relative",
        zIndex: 1,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 40,
        width: "100%",
        maxWidth: 340,
        padding: "0 20px",
        boxSizing: "border-box",
      }}>

        {/* ── Brand ─────────────────────────────────────────────────── */}
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 18 }}>
          <div style={{
            width: 72,
            height: 72,
            borderRadius: 21,
            background: isError
              ? "linear-gradient(135deg, #7c3aed, #5865F2)"
              : "linear-gradient(135deg, #5865F2, #7c3aed)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            boxShadow: isError
              ? "0 0 40px rgba(248,81,73,0.18), 0 8px 32px rgba(0,0,0,0.55)"
              : isLoading
                ? "0 0 48px rgba(88,101,242,0.22), 0 8px 32px rgba(0,0,0,0.55)"
                : "0 0 56px rgba(88,101,242,0.28), 0 8px 40px rgba(0,0,0,0.6)",
          }}>
            <AppLogoImg size={40} />
          </div>

          <div style={{ textAlign: "center" }}>
            <div style={{
              fontSize: 22,
              fontWeight: 700,
              color: "#e2e2e2",
              letterSpacing: "-0.035em",
              lineHeight: 1.1,
            }}>
              OpenEmbedded
            </div>
            <div style={{
              fontSize: 13,
              color: "#3a3a3a",
              marginTop: 5,
              fontWeight: 400,
            }}>
              {isError ? "Sign in failed" : isLoading ? "Discord Activity" : "Welcome back"}
            </div>
          </div>
        </div>

        {/* ── Loading / Auth ─────────────────────────────────────────── */}
        {isLoading && (
          <div style={{ width: "100%", display: "flex", flexDirection: "column", gap: 8 }}>
            <SectionLabel>Status</SectionLabel>

            {/* Status row */}
            <div style={{ background: "#1a1a1a", borderRadius: 12, overflow: "hidden" }}>
              <div style={{
                display: "flex",
                alignItems: "center",
                minHeight: 54,
                padding: "0 16px",
                gap: 12,
                position: "relative",
              }}>
                <Spinner />
                <span style={{ fontSize: 16, fontWeight: 400, color: "#e2e2e2", flex: 1 }}>
                  {sdkState === "loading" ? "Connecting to Discord" : "Signing you in"}
                </span>
                {/* Divider */}
                <div style={{
                  position: "absolute",
                  bottom: 0, left: 0, right: 0,
                  height: 1,
                  background: "#242424",
                }} />
              </div>

              {/* Skeleton row */}
              <div style={{
                display: "flex",
                alignItems: "center",
                minHeight: 54,
                padding: "0 16px",
                gap: 12,
                opacity: 0.35,
              }}>
                <div style={{ width: 32, height: 32, borderRadius: "50%", background: "#282828", flexShrink: 0 }} />
                <div style={{ flex: 1 }}>
                  <div style={{ height: 11, width: 96, background: "#282828", borderRadius: 4 }} />
                </div>
                <div style={{ height: 11, width: 60, background: "#282828", borderRadius: 4 }} />
              </div>
            </div>
          </div>
        )}

        {/* ── Ready — User card + Continue ──────────────────────────── */}
        {isReady && user && (
          <div style={{ width: "100%", display: "flex", flexDirection: "column", gap: 0 }}>

            {/* Account group */}
            <SectionLabel>Account</SectionLabel>
            <div style={{
              background: "#1a1a1a",
              borderRadius: 12,
              overflow: "hidden",
              marginBottom: 20,
            }}>
              {/* User row */}
              <div style={{
                display: "flex",
                alignItems: "center",
                minHeight: 54,
                padding: "0 16px",
                gap: 12,
              }}>
                {/* Avatar */}
                {avatarUrl && (
                  <img
                    src={avatarUrl}
                    onError={() => setImgError(true)}
                    alt={displayName}
                    style={{
                      width: 34,
                      height: 34,
                      borderRadius: "50%",
                      objectFit: "cover",
                      flexShrink: 0,
                    }}
                  />
                )}

                {/* Display name */}
                <span style={{
                  flex: 1,
                  fontSize: 16,
                  fontWeight: 400,
                  color: "#e2e2e2",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                  paddingRight: 8,
                }}>
                  {displayName}
                </span>

                {/* @username muted value */}
                <span style={{
                  fontSize: 15,
                  color: "#4a4a4a",
                  whiteSpace: "nowrap",
                  flexShrink: 0,
                  marginRight: 6,
                }}>
                  @{username}
                </span>
              </div>
            </div>

            {/* Access group */}
            <SectionLabel>Access</SectionLabel>
            <div style={{ background: "#1a1a1a", borderRadius: 12, overflow: "hidden" }}>
              <button
                onClick={handleContinue}
                disabled={continuing}
                onMouseEnter={() => setHoverContinue(true)}
                onMouseLeave={() => setHoverContinue(false)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  width: "100%",
                  minHeight: 54,
                  padding: "0 16px",
                  background: hoverContinue && !continuing ? "#202020" : "transparent",
                  border: "none",
                  cursor: continuing ? "default" : "pointer",
                  transition: "background 0.1s",
                  boxSizing: "border-box",
                }}
              >
                <span style={{
                  flex: 1,
                  textAlign: "left",
                  fontSize: 16,
                  fontWeight: 400,
                  color: continuing ? "#4a4a4a" : "#e2e2e2",
                  fontFamily: "inherit",
                  letterSpacing: "-0.01em",
                }}>
                  {continuing ? "Signing in…" : "Continue to OpenEmbedded"}
                </span>

                {continuing ? (
                  <Spinner />
                ) : (
                  <span style={{ fontSize: 18, color: "#3a3a3a", flexShrink: 0 }}>›</span>
                )}
              </button>
            </div>
          </div>
        )}

        {/* ── Error ─────────────────────────────────────────────────── */}
        {isError && (
          <div style={{ width: "100%", display: "flex", flexDirection: "column" }}>
            <SectionLabel>Error</SectionLabel>
            <div style={{ background: "#1a1a1a", borderRadius: 12, overflow: "hidden" }}>
              <div style={{
                minHeight: 54,
                padding: "14px 16px",
                display: "flex",
                flexDirection: "column",
                gap: 6,
              }}>
                <span style={{ fontSize: 15, color: "#f85149", fontWeight: 400 }}>
                  Could not sign in
                </span>
                <span style={{ fontSize: 13, color: "#4a4a4a", lineHeight: 1.6, wordBreak: "break-word" }}>
                  {errorMsg ?? "An unknown error occurred. Check the browser console for details."}
                </span>
              </div>
            </div>
          </div>
        )}
      </div>

      <style>{`
        @keyframes oe-spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
