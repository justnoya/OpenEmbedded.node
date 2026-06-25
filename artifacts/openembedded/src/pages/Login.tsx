import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/lib/authContext";

function DiscordIcon() {
  return (
    <svg width="20" height="20" viewBox="0 -28.5 256 256" fill="currentColor" aria-hidden="true">
      <path d="M216.856 16.597A208.502 208.502 0 0 0 164.042 0c-2.275 4.113-4.933 9.645-6.766 14.046-19.692-2.961-39.203-2.961-58.533 0-1.832-4.4-4.55-9.933-6.846-14.046a207.809 207.809 0 0 0-52.855 16.638C5.618 67.147-3.443 116.4 1.087 164.956c22.169 16.555 43.653 26.612 64.775 33.193A161.094 161.094 0 0 0 79.735 175.3a136.413 136.413 0 0 1-21.846-10.632 108.636 108.636 0 0 0 5.356-4.237c42.122 19.702 87.89 19.702 129.51 0a131.66 131.66 0 0 0 5.355 4.237 136.07 136.07 0 0 1-21.886 10.653c4.006 8.02 8.638 15.67 13.873 22.848 21.142-6.58 42.646-16.637 64.815-33.213 5.316-56.288-9.08-105.09-38.056-148.36ZM85.474 135.095c-12.645 0-23.015-11.805-23.015-26.18s10.149-26.2 23.015-26.2c12.867 0 23.236 11.804 23.015 26.2.02 14.375-10.148 26.18-23.015 26.18Zm85.051 0c-12.645 0-23.014-11.805-23.014-26.18s10.148-26.2 23.014-26.2c12.867 0 23.236 11.804 23.015 26.2 0 14.375-10.148 26.18-23.015 26.18Z" />
    </svg>
  );
}

function Spinner({ size = 18 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 18 18"
      fill="none"
      style={{ animation: "oe-login-spin 0.85s linear infinite", flexShrink: 0 }}
      aria-hidden="true"
    >
      <circle cx="9" cy="9" r="7" stroke="rgba(255,255,255,0.1)" strokeWidth="2" />
      <path d="M9 2A7 7 0 0 1 16 9" stroke="rgba(255,255,255,0.5)" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg width="9" height="9" viewBox="0 0 9 9" fill="none" aria-hidden="true">
      <path d="M1.5 4.5L3.5 6.5L7.5 2.5" stroke="#4a4a4a" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function Login() {
  const { isAuthenticated, isLoading, login } = useAuth();
  const [, navigate] = useLocation();
  const [hoverBtn, setHoverBtn] = useState(false);
  const [activeBtn, setActiveBtn] = useState(false);
  const [configChecking, setConfigChecking] = useState(true);
  const [configured, setConfigured] = useState(true);
  const [mounted, setMounted] = useState(false);

  // Redirect if already authenticated
  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      navigate("/");
    }
  }, [isLoading, isAuthenticated, navigate]);

  // Fade in after mount
  useEffect(() => {
    const t = setTimeout(() => setMounted(true), 20);
    return () => clearTimeout(t);
  }, []);

  // Check Discord config once
  useEffect(() => {
    fetch("/api/v1/discord/config")
      .then((r) => r.json())
      .then((d: { configured: boolean }) => setConfigured(d.configured))
      .catch(() => setConfigured(false))
      .finally(() => setConfigChecking(false));
  }, []);

  if (isLoading) {
    return (
      <div style={{
        minHeight: "100dvh",
        background: "#111111",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}>
        <Spinner size={22} />
        <style>{`@keyframes oe-login-spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  return (
    <div
      style={{
        minHeight: "100dvh",
        background: "#111111",
        color: "#f0f0f0",
        fontFamily: `"DM Sans", system-ui, sans-serif`,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "24px 20px",
        boxSizing: "border-box",
        opacity: mounted ? 1 : 0,
        transform: mounted ? "none" : "translateY(6px)",
        transition: "opacity 0.35s ease, transform 0.35s ease",
      }}
    >
      {/* Ambient glow */}
      <div
        aria-hidden="true"
        style={{
          position: "fixed",
          inset: 0,
          pointerEvents: "none",
          background:
            "radial-gradient(ellipse 700px 480px at 50% 38%, rgba(88,101,242,0.05) 0%, transparent 70%)",
        }}
      />

      <div
        style={{
          position: "relative",
          zIndex: 1,
          width: "100%",
          maxWidth: 380,
          display: "flex",
          flexDirection: "column",
          gap: 28,
        }}
      >
        {/* ── Brand ──────────────────────────────────────────────────────── */}
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 14 }}>
          <div
            style={{
              width: 62,
              height: 62,
              borderRadius: 18,
              background: "#1a1a1a",
              border: "1px solid rgba(255,255,255,0.09)",
              boxShadow:
                "0 8px 32px rgba(0,0,0,0.65), inset 0 1px 0 rgba(255,255,255,0.06)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <img
              src="/logo.png"
              alt="OpenEmbedded"
              width={36}
              height={36}
              style={{ objectFit: "contain" }}
            />
          </div>

          <div style={{ textAlign: "center" }}>
            <h1
              style={{
                fontSize: 22,
                fontWeight: 800,
                margin: "0 0 5px",
                letterSpacing: "-0.04em",
                color: "#ebebeb",
              }}
            >
              OpenEmbedded
            </h1>
            <p style={{ color: "#484848", fontSize: 13.5, margin: 0, lineHeight: 1.5 }}>
              Visual Discord message builder
            </p>
          </div>
        </div>

        {/* ── Auth card ──────────────────────────────────────────────────── */}
        <div
          style={{
            background: "#1a1a1a",
            border: "1px solid rgba(255,255,255,0.08)",
            borderRadius: 16,
            overflow: "hidden",
            boxShadow:
              "0 4px 28px rgba(0,0,0,0.6), inset 0 1px 0 rgba(255,255,255,0.05)",
          }}
        >
          {/* Sign-in area */}
          <div style={{ padding: "22px 20px 20px" }}>
            <div
              style={{
                fontSize: 11,
                fontWeight: 700,
                color: "#3a3a3a",
                marginBottom: 14,
                textTransform: "uppercase",
                letterSpacing: "0.07em",
              }}
            >
              Sign in
            </div>

            {configChecking ? (
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  padding: "13px 0",
                }}
              >
                <Spinner />
              </div>
            ) : !configured ? (
              /* Discord not configured */
              <div
                style={{
                  padding: "14px 16px",
                  background: "rgba(248,81,73,0.06)",
                  borderRadius: 10,
                  border: "1px solid rgba(248,81,73,0.16)",
                }}
              >
                <div
                  style={{
                    fontSize: 13,
                    fontWeight: 600,
                    color: "#f85149",
                    marginBottom: 5,
                  }}
                >
                  Discord not configured
                </div>
                <div style={{ fontSize: 12, color: "#505050", lineHeight: 1.7 }}>
                  Add{" "}
                  <code
                    style={{
                      background: "#222",
                      padding: "1px 5px",
                      borderRadius: 4,
                      color: "#c084fc",
                      fontFamily: "JetBrains Mono, monospace",
                      fontSize: 11,
                    }}
                  >
                    DISCORD_CLIENT_ID
                  </code>{" "}
                  and{" "}
                  <code
                    style={{
                      background: "#222",
                      padding: "1px 5px",
                      borderRadius: 4,
                      color: "#c084fc",
                      fontFamily: "JetBrains Mono, monospace",
                      fontSize: 11,
                    }}
                  >
                    DISCORD_CLIENT_SECRET
                  </code>{" "}
                  to your environment secrets to enable login.
                </div>
              </div>
            ) : (
              /* Discord sign-in button */
              <button
                onClick={login}
                onMouseEnter={() => setHoverBtn(true)}
                onMouseLeave={() => { setHoverBtn(false); setActiveBtn(false); }}
                onMouseDown={() => setActiveBtn(true)}
                onMouseUp={() => setActiveBtn(false)}
                style={{
                  width: "100%",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 10,
                  padding: "12px 20px",
                  background: activeBtn ? "#4752c4" : hoverBtn ? "#6773f5" : "#5865F2",
                  border: "none",
                  borderRadius: 10,
                  color: "#ffffff",
                  fontSize: 15,
                  fontWeight: 700,
                  letterSpacing: "-0.01em",
                  cursor: "pointer",
                  transition: "background 0.12s ease, transform 0.08s ease",
                  boxShadow: activeBtn
                    ? "0 1px 4px rgba(88,101,242,0.3)"
                    : "0 2px 10px rgba(88,101,242,0.32)",
                  fontFamily: "inherit",
                  transform: activeBtn ? "scale(0.985)" : "none",
                }}
              >
                <DiscordIcon />
                Continue with Discord
              </button>
            )}
          </div>

          {/* Divider */}
          <div style={{ height: 1, background: "rgba(255,255,255,0.05)" }} />

          {/* Permissions list */}
          <div style={{ padding: "16px 20px 18px", display: "flex", flexDirection: "column", gap: 9 }}>
            {[
              "Access your Discord username and avatar only",
              "No access to your messages or servers",
              "Revoke access anytime via Discord settings",
            ].map((text, i) => (
              <div
                key={i}
                style={{ display: "flex", alignItems: "center", gap: 10 }}
              >
                <div
                  style={{
                    width: 18,
                    height: 18,
                    borderRadius: "50%",
                    background: "rgba(255,255,255,0.03)",
                    border: "1px solid rgba(255,255,255,0.07)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0,
                  }}
                >
                  <CheckIcon />
                </div>
                <span style={{ fontSize: 12, color: "#484848", lineHeight: 1.5 }}>
                  {text}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* ── Footer ──────────────────────────────────────────────────────── */}
        <p style={{ textAlign: "center", fontSize: 12, color: "#303030", margin: 0 }}>
          By continuing you agree to our{" "}
          <a
            href="/tos"
            style={{ color: "#484848", textDecoration: "none" }}
            onMouseEnter={(e) => ((e.target as HTMLAnchorElement).style.color = "#707070")}
            onMouseLeave={(e) => ((e.target as HTMLAnchorElement).style.color = "#484848")}
          >
            Terms
          </a>{" "}
          and{" "}
          <a
            href="/privacy"
            style={{ color: "#484848", textDecoration: "none" }}
            onMouseEnter={(e) => ((e.target as HTMLAnchorElement).style.color = "#707070")}
            onMouseLeave={(e) => ((e.target as HTMLAnchorElement).style.color = "#484848")}
          >
            Privacy Policy
          </a>
          .
        </p>
      </div>

      <style>{`
        @keyframes oe-login-spin {
          from { transform: rotate(0deg); }
          to   { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
