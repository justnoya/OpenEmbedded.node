/**
 * Full-screen loading overlay shown while the Discord Activity SDK is
 * initialising or performing the OAuth handshake.
 * Only rendered when sdkState is "loading" or "auth" inside Discord.
 */
import { useDiscord } from "@/lib/discordContext";

const STEPS = [
  { id: "loading", label: "Connecting to Discord" },
  { id: "auth",    label: "Authorising account" },
  { id: "ready",   label: "Launching OpenEmbedded" },
];

function getStepIndex(state: string): number {
  if (state === "loading") return 0;
  if (state === "auth") return 1;
  if (state === "ready") return 2;
  return 0;
}

export function DiscordActivityOverlay() {
  const { isDiscord, sdkState } = useDiscord();

  if (!isDiscord || sdkState === "idle" || sdkState === "ready") return null;

  const isError = sdkState === "error";
  const activeStep = getStepIndex(sdkState);

  return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 9999,
      background: "#0a0a0a",
      display: "flex", flexDirection: "column",
      alignItems: "center", justifyContent: "center",
      fontFamily: `"Inter", system-ui, sans-serif`,
    }}>
      {/* Ambient glow */}
      <div style={{
        position: "absolute",
        width: 480, height: 480,
        borderRadius: "50%",
        background: "radial-gradient(circle, rgba(88,101,242,0.12) 0%, transparent 70%)",
        top: "50%", left: "50%",
        transform: "translate(-50%, -60%)",
        pointerEvents: "none",
      }} />

      <div style={{
        position: "relative",
        display: "flex", flexDirection: "column",
        alignItems: "center", gap: 36,
        zIndex: 1,
      }}>
        {/* Logo */}
        <div style={{ position: "relative" }}>
          {/* Pulse ring */}
          {!isError && (
            <div style={{
              position: "absolute", inset: -10,
              borderRadius: 26,
              border: "1px solid rgba(88,101,242,0.25)",
              animation: "pulseRing 2s ease-in-out infinite",
            }} />
          )}
          <div style={{
            width: 80, height: 80, borderRadius: 20,
            overflow: "hidden",
            boxShadow: isError
              ? "0 0 0 1px rgba(248,81,73,0.4), 0 8px 40px rgba(248,81,73,0.2)"
              : "0 0 0 1px rgba(88,101,242,0.35), 0 8px 40px rgba(88,101,242,0.3), 0 2px 8px rgba(0,0,0,0.6)",
          }}>
            <img
              src="/logo.png"
              alt="OpenEmbedded"
              style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
            />
          </div>
        </div>

        {/* Name + State */}
        <div style={{ textAlign: "center", display: "flex", flexDirection: "column", gap: 8 }}>
          <div style={{
            fontSize: 20, fontWeight: 700, color: "#f0f0f0",
            letterSpacing: "-0.03em",
          }}>
            OpenEmbedded
          </div>
          <div style={{ fontSize: 13, color: "#606060", fontWeight: 400 }}>
            {isError ? "Connection failed" : "Discord Activity"}
          </div>
        </div>

        {/* Step indicators */}
        {!isError ? (
          <div style={{
            display: "flex", flexDirection: "column", gap: 10,
            width: 280,
          }}>
            {STEPS.map((step, i) => {
              const isDone = i < activeStep;
              const isActive = i === activeStep;
              const isPending = i > activeStep;
              return (
                <div key={step.id} style={{
                  display: "flex", alignItems: "center", gap: 12,
                  opacity: isPending ? 0.3 : 1,
                  transition: "opacity 0.3s ease",
                }}>
                  {/* Step dot / checkmark */}
                  <div style={{
                    width: 20, height: 20, borderRadius: "50%", flexShrink: 0,
                    display: "flex", alignItems: "center", justifyContent: "center",
                    background: isDone
                      ? "rgba(63,185,80,0.15)"
                      : isActive
                        ? "rgba(88,101,242,0.15)"
                        : "rgba(255,255,255,0.04)",
                    border: `1px solid ${
                      isDone ? "rgba(63,185,80,0.4)"
                      : isActive ? "rgba(88,101,242,0.5)"
                      : "rgba(255,255,255,0.08)"
                    }`,
                    transition: "all 0.3s ease",
                  }}>
                    {isDone ? (
                      <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                        <path d="M2 5L4.2 7.2L8 3" stroke="#3fb950" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    ) : isActive ? (
                      <div style={{
                        width: 6, height: 6, borderRadius: "50%",
                        background: "#5865F2",
                        animation: "dotPulse 1.2s ease-in-out infinite",
                      }} />
                    ) : (
                      <div style={{ width: 5, height: 5, borderRadius: "50%", background: "rgba(255,255,255,0.15)" }} />
                    )}
                  </div>
                  {/* Label */}
                  <span style={{
                    fontSize: 13,
                    color: isDone ? "#3fb950" : isActive ? "#e8e8e8" : "#404040",
                    fontWeight: isActive ? 500 : 400,
                    transition: "color 0.3s ease",
                  }}>
                    {step.label}
                  </span>
                  {/* Spinner for active */}
                  {isActive && (
                    <div style={{ marginLeft: "auto" }}>
                      <svg width="14" height="14" viewBox="0 0 14 14" fill="none" style={{ animation: "spin 0.9s linear infinite" }}>
                        <circle cx="7" cy="7" r="5.5" stroke="rgba(88,101,242,0.2)" strokeWidth="1.5" />
                        <path d="M7 1.5A5.5 5.5 0 0 1 12.5 7" stroke="#5865F2" strokeWidth="1.5" strokeLinecap="round" />
                      </svg>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        ) : (
          /* Error state */
          <div style={{
            width: 280, padding: "14px 16px", borderRadius: 12,
            background: "rgba(248,81,73,0.06)",
            border: "1px solid rgba(248,81,73,0.2)",
            display: "flex", flexDirection: "column", gap: 8,
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#f85149" strokeWidth="2">
                <circle cx="12" cy="12" r="10" />
                <line x1="15" y1="9" x2="9" y2="15" />
                <line x1="9" y1="9" x2="15" y2="15" />
              </svg>
              <span style={{ fontSize: 13, color: "#f85149", fontWeight: 600 }}>
                Could not connect
              </span>
            </div>
            <p style={{ margin: 0, fontSize: 12, color: "#606060", lineHeight: 1.55 }}>
              Make sure{" "}
              <code style={{ color: "#888888", background: "rgba(255,255,255,0.06)", padding: "1px 5px", borderRadius: 4, fontSize: 11 }}>
                DISCORD_CLIENT_ID
              </code>{" "}
              and{" "}
              <code style={{ color: "#888888", background: "rgba(255,255,255,0.06)", padding: "1px 5px", borderRadius: 4, fontSize: 11 }}>
                DISCORD_CLIENT_SECRET
              </code>{" "}
              are set in your environment.
            </p>
          </div>
        )}
      </div>

      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        @keyframes pulseRing {
          0%, 100% { opacity: 0.4; transform: scale(1); }
          50% { opacity: 0.9; transform: scale(1.04); }
        }
        @keyframes dotPulse {
          0%, 100% { opacity: 0.5; transform: scale(0.75); }
          50% { opacity: 1; transform: scale(1); }
        }
      `}</style>
    </div>
  );
}
