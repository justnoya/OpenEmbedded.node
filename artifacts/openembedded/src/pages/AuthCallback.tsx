/**
 * /auth/callback — Discord OAuth2 redirect handler.
 *
 * Discord redirects here after the user grants permission:
 *   /auth/callback?code=...&state=...
 *
 * This page validates the CSRF state, exchanges the code for a session
 * via the backend, and redirects to the original destination.
 */
import { useEffect, useRef, useState } from "react";
import { useLocation } from "wouter";
import { useAuth } from "../lib/authContext.js";

type Phase = "verifying" | "error";

function Spinner() {
  return (
    <svg
      width="26"
      height="26"
      viewBox="0 0 26 26"
      fill="none"
      style={{ animation: "oe-cb-spin 0.85s linear infinite" }}
      aria-hidden="true"
    >
      <circle cx="13" cy="13" r="11" stroke="rgba(255,255,255,0.07)" strokeWidth="2.5" />
      <path
        d="M13 2A11 11 0 0 1 24 13"
        stroke="rgba(255,255,255,0.5)"
        strokeWidth="2.5"
        strokeLinecap="round"
      />
    </svg>
  );
}

export function AuthCallback() {
  const { completeAuth } = useAuth();
  const [, navigate] = useLocation();
  const [phase, setPhase] = useState<Phase>("verifying");
  const [errorMsg, setErrorMsg] = useState("");
  const ran = useRef(false);

  useEffect(() => {
    // Strict-mode safe — only run the exchange once
    if (ran.current) return;
    ran.current = true;

    const params = new URLSearchParams(window.location.search);
    const code = params.get("code");
    const stateParam = params.get("state");
    const errorParam = params.get("error");
    const errorDesc = params.get("error_description");

    // Discord returned an error (e.g. user clicked "Cancel")
    if (errorParam) {
      setErrorMsg(
        errorDesc
          ? `${errorDesc} (${errorParam})`
          : errorParam === "access_denied"
          ? "You cancelled the sign-in. Click below to try again."
          : `Discord returned an error: ${errorParam}`
      );
      setPhase("error");
      return;
    }

    if (!code || !stateParam) {
      setErrorMsg("Missing code or state in callback URL. Please try signing in again.");
      setPhase("error");
      return;
    }

    const redirectUri = `${window.location.origin}/auth/callback`;

    completeAuth(code, stateParam, redirectUri).catch((err: unknown) => {
      setErrorMsg(
        err instanceof Error
          ? err.message
          : "Authentication failed. Please try again."
      );
      setPhase("error");
    });
  }, [completeAuth, navigate]);

  // ── Verifying ─────────────────────────────────────────────────────────────
  if (phase === "verifying") {
    return (
      <div
        style={{
          minHeight: "100dvh",
          background: "#111111",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: 14,
          fontFamily: `"DM Sans", system-ui, sans-serif`,
        }}
      >
        <Spinner />
        <p style={{ color: "#484848", fontSize: 14, margin: 0 }}>
          Completing sign in…
        </p>
        <style>{`@keyframes oe-cb-spin { from { transform:rotate(0deg); } to { transform:rotate(360deg); } }`}</style>
      </div>
    );
  }

  // ── Error ──────────────────────────────────────────────────────────────────
  return (
    <div
      style={{
        minHeight: "100dvh",
        background: "#111111",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "24px 20px",
        fontFamily: `"DM Sans", system-ui, sans-serif`,
      }}
    >
      <div
        style={{
          maxWidth: 380,
          width: "100%",
          background: "#1a1a1a",
          border: "1px solid rgba(255,255,255,0.08)",
          borderRadius: 16,
          overflow: "hidden",
          boxShadow: "0 4px 28px rgba(0,0,0,0.6), inset 0 1px 0 rgba(255,255,255,0.05)",
        }}
      >
        <div style={{ padding: "22px 20px" }}>
          <div
            style={{
              fontSize: 14,
              fontWeight: 700,
              color: "#f85149",
              marginBottom: 10,
              letterSpacing: "-0.01em",
            }}
          >
            Sign in failed
          </div>
          <p
            style={{
              fontSize: 13,
              color: "#505050",
              lineHeight: 1.7,
              margin: "0 0 20px",
              wordBreak: "break-word",
            }}
          >
            {errorMsg}
          </p>
          <button
            onClick={() => navigate("/login")}
            style={{
              width: "100%",
              padding: "11px 16px",
              background: "#efefef",
              border: "none",
              borderRadius: 9,
              color: "#111111",
              fontSize: 14,
              fontWeight: 700,
              cursor: "pointer",
              fontFamily: "inherit",
              letterSpacing: "-0.01em",
              transition: "background 0.1s",
            }}
            onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = "#ffffff"; }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = "#efefef"; }}
          >
            Back to Sign In
          </button>
        </div>
      </div>
    </div>
  );
}
