import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { useAuth } from "../lib/authContext.js";

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
      style={{ animation: "oe-spin 0.85s linear infinite", flexShrink: 0 }}
      aria-hidden="true"
    >
      <circle cx="9" cy="9" r="7" stroke="rgba(255,255,255,0.12)" strokeWidth="2" />
      <path d="M9 2A7 7 0 0 1 16 9" stroke="rgba(255,255,255,0.55)" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

const PERMS = [
  {
    icon: (
      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
        <polyline points="9 12 11 14 15 10" />
      </svg>
    ),
    text: "Access your Discord username and avatar only",
  },
  {
    icon: (
      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" />
        <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" />
        <line x1="1" y1="1" x2="23" y2="23" />
      </svg>
    ),
    text: "No access to your messages or servers",
  },
  {
    icon: (
      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
        <path d="M7 11V7a5 5 0 0 1 10 0v4" />
      </svg>
    ),
    text: "Revoke access anytime via Discord settings",
  },
];

export function Login() {
  const { isAuthenticated, isLoading, login } = useAuth();
  const [, navigate] = useLocation();
  const [configChecking, setConfigChecking] = useState(true);
  const [configured, setConfigured] = useState(true);
  const [mounted, setMounted] = useState(false);
  const [signingIn, setSigningIn] = useState(false);

  useEffect(() => {
    if (!isLoading && isAuthenticated) navigate("/");
  }, [isLoading, isAuthenticated, navigate]);

  useEffect(() => {
    const t = setTimeout(() => setMounted(true), 30);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    fetch("/api/v1/discord/config")
      .then((r) => r.json())
      .then((d: { configured: boolean }) => setConfigured(d.configured))
      .catch(() => setConfigured(false))
      .finally(() => setConfigChecking(false));
  }, []);

  function handleLogin() {
    setSigningIn(true);
    login();
  }

  if (isLoading) {
    return (
      <div
        style={{
          minHeight: "100dvh",
          background: "#1a1a1a",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Spinner size={24} />
        <style>{`@keyframes oe-spin { from { transform:rotate(0deg) } to { transform:rotate(360deg) } }`}</style>
      </div>
    );
  }

  return (
    <div
      style={{
        minHeight: "100dvh",
        backgroundImage: "url(/login-bg.png)",
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundRepeat: "no-repeat",
        fontFamily: `"DM Sans", system-ui, sans-serif`,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "32px 20px",
        boxSizing: "border-box",
        opacity: mounted ? 1 : 0,
        transform: mounted ? "none" : "translateY(10px)",
        transition: "opacity 0.4s ease, transform 0.4s ease",
      }}
    >
      {/* Subtle dark overlay to keep card readable */}
      <div
        aria-hidden
        style={{
          position: "fixed",
          inset: 0,
          pointerEvents: "none",
          background: "rgba(10, 8, 20, 0.45)",
        }}
      />

      <div
        style={{
          position: "relative",
          zIndex: 1,
          width: "100%",
          maxWidth: 400,
          display: "flex",
          flexDirection: "column",
          alignItems: "stretch",
          gap: 20,
        }}
      >
        {/* ── Logo + title (above card) ──────────────────────────────── */}
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 12, paddingBottom: 4 }}>
          <div
            style={{
              width: 56,
              height: 56,
              borderRadius: 16,
              background: "linear-gradient(145deg, #1e1e1e, #181818)",
              border: "1px solid rgba(255,255,255,0.09)",
              boxShadow: "0 8px 28px rgba(0,0,0,0.7), inset 0 1px 0 rgba(255,255,255,0.06)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <img src="/logo.png" alt="OpenEmbedded" width={30} height={30} style={{ objectFit: "contain" }} />
          </div>

          <div style={{ textAlign: "center" }}>
            <h1
              style={{
                margin: "0 0 4px",
                fontSize: 20,
                fontWeight: 800,
                letterSpacing: "-0.04em",
                color: "#e8e8e8",
              }}
            >
              OpenEmbedded
            </h1>
            <p style={{ margin: 0, fontSize: 13, color: "#4a4a4a", lineHeight: 1.5 }}>
              Visual Discord message builder
            </p>
          </div>
        </div>

        {/* ── Card ────────────────────────────────────────────────────── */}
        <div
          style={{
            background: "linear-gradient(160deg, #181818 0%, #141414 100%)",
            border: "1px solid rgba(255,255,255,0.07)",
            borderRadius: 20,
            overflow: "hidden",
            boxShadow:
              "0 1px 0 rgba(255,255,255,0.04) inset, 0 0 0 1px rgba(0,0,0,0.4), 0 8px 32px rgba(0,0,0,0.55), 0 24px 60px rgba(0,0,0,0.3)",
          }}
        >
          {/* Card header bar */}
          <div
            style={{
              padding: "20px 24px 0",
              borderBottom: "1px solid rgba(255,255,255,0.05)",
              paddingBottom: 20,
            }}
          >
            <div style={{ marginBottom: 16 }}>
              <p
                style={{
                  margin: 0,
                  fontSize: 15,
                  fontWeight: 700,
                  color: "#d0d0d0",
                  letterSpacing: "-0.02em",
                }}
              >
                Sign in to your account
              </p>
              <p style={{ margin: "4px 0 0", fontSize: 12.5, color: "#404040" }}>
                Use your Discord account to get started
              </p>
            </div>

            {/* ── Button / state area ───────────────────────────────── */}
            {configChecking ? (
              <div style={{ display: "flex", alignItems: "center", justifyContent: "center", padding: "14px 0" }}>
                <Spinner />
              </div>
            ) : !configured ? (
              <div
                style={{
                  padding: "14px 16px",
                  background: "rgba(248,81,73,0.06)",
                  border: "1px solid rgba(248,81,73,0.16)",
                  borderRadius: 12,
                }}
              >
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 7,
                    marginBottom: 6,
                  }}
                >
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#f85149" strokeWidth="2.5" strokeLinecap="round">
                    <circle cx="12" cy="12" r="10" />
                    <line x1="12" y1="8" x2="12" y2="12" />
                    <line x1="12" y1="16" x2="12.01" y2="16" />
                  </svg>
                  <span style={{ fontSize: 13, fontWeight: 600, color: "#f85149" }}>
                    Discord not configured
                  </span>
                </div>
                <p style={{ margin: 0, fontSize: 12, color: "#4a4a4a", lineHeight: 1.7 }}>
                  Discord login is not available. Please contact the administrator to enable authentication.
                </p>
              </div>
            ) : (
              <button
                onClick={handleLogin}
                disabled={signingIn}
                style={{
                  width: "100%",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 10,
                  padding: "13px 20px",
                  background: signingIn
                    ? "#4752c4"
                    : "linear-gradient(135deg, #5865F2 0%, #4e5bdf 100%)",
                  border: "none",
                  borderRadius: 12,
                  color: "#fff",
                  fontSize: 14.5,
                  fontWeight: 700,
                  letterSpacing: "-0.01em",
                  cursor: signingIn ? "not-allowed" : "pointer",
                  fontFamily: "inherit",
                  opacity: signingIn ? 0.8 : 1,
                  boxShadow: "0 2px 12px rgba(88,101,242,0.38), 0 1px 3px rgba(0,0,0,0.3)",
                  transition: "all 0.13s ease",
                }}
                onMouseEnter={(e) => {
                  if (!signingIn) {
                    (e.currentTarget as HTMLButtonElement).style.background =
                      "linear-gradient(135deg, #6773f5 0%, #5865F2 100%)";
                    (e.currentTarget as HTMLButtonElement).style.boxShadow =
                      "0 4px 18px rgba(88,101,242,0.46), 0 1px 4px rgba(0,0,0,0.3)";
                  }
                }}
                onMouseLeave={(e) => {
                  if (!signingIn) {
                    (e.currentTarget as HTMLButtonElement).style.background =
                      "linear-gradient(135deg, #5865F2 0%, #4e5bdf 100%)";
                    (e.currentTarget as HTMLButtonElement).style.boxShadow =
                      "0 2px 12px rgba(88,101,242,0.38), 0 1px 3px rgba(0,0,0,0.3)";
                  }
                }}
                onMouseDown={(e) => {
                  (e.currentTarget as HTMLButtonElement).style.transform = "scale(0.987)";
                }}
                onMouseUp={(e) => {
                  (e.currentTarget as HTMLButtonElement).style.transform = "none";
                }}
              >
                {signingIn ? <Spinner size={18} /> : <DiscordIcon />}
                <span>{signingIn ? "Redirecting to Discord…" : "Continue with Discord"}</span>
              </button>
            )}
          </div>

          {/* ── Permissions list ──────────────────────────────────────── */}
          <div style={{ padding: "16px 24px 20px", display: "flex", flexDirection: "column", gap: 11 }}>
            <p style={{ margin: "0 0 4px", fontSize: 11, fontWeight: 600, color: "#2e2e2e", textTransform: "uppercase", letterSpacing: "0.07em" }}>
              What we access
            </p>
            {PERMS.map(({ icon, text }, i) => (
              <div key={i} style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <div
                  style={{
                    width: 26,
                    height: 26,
                    borderRadius: 8,
                    background: "rgba(255,255,255,0.025)",
                    border: "1px solid rgba(255,255,255,0.07)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0,
                    color: "#383838",
                  }}
                >
                  {icon}
                </div>
                <span style={{ fontSize: 12.5, color: "#454545", lineHeight: 1.45 }}>{text}</span>
              </div>
            ))}
          </div>
        </div>

        {/* ── Footer ────────────────────────────────────────────────── */}
        <p style={{ textAlign: "center", fontSize: 11.5, color: "#2e2e2e", margin: 0 }}>
          By continuing you agree to our{" "}
          <a
            href="/tos"
            style={{ color: "#454545", textDecoration: "none", transition: "color 0.15s" }}
            onMouseEnter={(e) => ((e.target as HTMLAnchorElement).style.color = "#777")}
            onMouseLeave={(e) => ((e.target as HTMLAnchorElement).style.color = "#454545")}
          >
            Terms
          </a>{" "}
          and{" "}
          <a
            href="/privacy"
            style={{ color: "#454545", textDecoration: "none", transition: "color 0.15s" }}
            onMouseEnter={(e) => ((e.target as HTMLAnchorElement).style.color = "#777")}
            onMouseLeave={(e) => ((e.target as HTMLAnchorElement).style.color = "#454545")}
          >
            Privacy Policy
          </a>
          .
        </p>
      </div>

      <style>{`
        @keyframes oe-spin {
          from { transform: rotate(0deg); }
          to   { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
