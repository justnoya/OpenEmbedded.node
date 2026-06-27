// @ts-nocheck
import { useState, useEffect } from "react";
import { Flame, Zap, Users, ArrowRight, X, ChevronLeft, ChevronRight } from "lucide-react";
import { useForgeStore } from "../../lib/forgeStore";
import { useDiscord } from "../../lib/discordContext";

// ── Tour slide data ──────────────────────────────────────────────────────────

const TOUR_SLIDES = [
  {
    icon: (
      <div style={{ position: "relative", width: 80, height: 80 }}>
        {/* Node card illustration */}
        <div style={{
          width: 80, height: 52, borderRadius: 10,
          background: "#1a1a1a", border: "1px solid rgba(255,255,255,0.10)",
          display: "flex", alignItems: "center", padding: "0 12px", gap: 10,
          boxShadow: "0 4px 20px rgba(0,0,0,0.6)",
          animation: "forge-float 3s ease-in-out infinite",
        }}>
          <div style={{ width: 24, height: 24, borderRadius: 6, background: "#f59e0b", opacity: 0.9 }} />
          <div>
            <div style={{ height: 7, width: 44, background: "rgba(255,255,255,0.18)", borderRadius: 3, marginBottom: 5 }} />
            <div style={{ height: 5, width: 32, background: "rgba(255,255,255,0.09)", borderRadius: 3 }} />
          </div>
        </div>
        {/* Plus badge */}
        <div style={{
          position: "absolute", bottom: 0, right: -4,
          width: 24, height: 24, borderRadius: "50%",
          background: "#f59e0b", display: "flex", alignItems: "center",
          justifyContent: "center", fontSize: 16, color: "#000", fontWeight: 700,
          boxShadow: "0 2px 8px rgba(245,158,11,0.5)",
        }}>+</div>
      </div>
    ),
    title: "Drop a node",
    body: "Tap + to add blocks — text, embeds, buttons, and more. Every node is a piece of your Discord message.",
  },
  {
    icon: (
      <div style={{ position: "relative", width: 120, height: 56 }}>
        {/* Source node */}
        <div style={{
          position: "absolute", left: 0, top: "50%", transform: "translateY(-50%)",
          width: 40, height: 40, borderRadius: 8,
          background: "#1a1a1a", border: "1px solid rgba(255,255,255,0.10)",
          display: "flex", alignItems: "center", justifyContent: "center",
        }}>
          <div style={{ width: 16, height: 16, borderRadius: 4, background: "#5865F2" }} />
        </div>
        {/* Animated edge */}
        <svg style={{ position: "absolute", left: 40, top: 0, width: 40, height: 56 }} viewBox="0 0 40 56">
          <line x1="0" y1="28" x2="40" y2="28" stroke="#f59e0b" strokeWidth="2" strokeDasharray="4 3">
            <animate attributeName="stroke-dashoffset" values="14;0" dur="0.8s" repeatCount="indefinite" />
          </line>
        </svg>
        {/* Target node */}
        <div style={{
          position: "absolute", right: 0, top: "50%", transform: "translateY(-50%)",
          width: 40, height: 40, borderRadius: 8,
          background: "#1a1a1a", border: "1px solid rgba(245,158,11,0.5)",
          display: "flex", alignItems: "center", justifyContent: "center",
          boxShadow: "0 0 12px rgba(245,158,11,0.2)",
        }}>
          <div style={{ width: 16, height: 16, borderRadius: 4, background: "#10b981" }} />
        </div>
      </div>
    ),
    title: "Connect the flow",
    body: "Drag from a handle to link nodes. The connection shows how your message is structured.",
  },
  {
    icon: (
      <div style={{ position: "relative", width: 100, height: 72 }}>
        {/* Canvas */}
        <div style={{
          width: 90, height: 60, borderRadius: 10,
          background: "#111111", border: "1px solid rgba(255,255,255,0.07)",
          position: "relative", overflow: "hidden",
        }}>
          {/* Node */}
          <div style={{
            position: "absolute", left: 10, top: 12,
            width: 36, height: 28, borderRadius: 6,
            background: "#1a1a1a", border: "2px solid #f59e0b",
          }} />
          {/* Cursor 1 - amber */}
          <div style={{
            position: "absolute", left: 20, top: 10,
            animation: "forge-cursor1 4s ease-in-out infinite",
          }}>
            <div style={{
              width: 8, height: 8, borderRadius: "50%",
              background: "#f59e0b", boxShadow: "0 0 6px #f59e0b",
            }} />
          </div>
          {/* Cursor 2 - blue */}
          <div style={{
            position: "absolute", right: 18, bottom: 14,
            animation: "forge-cursor2 4s ease-in-out infinite",
          }}>
            <div style={{
              width: 8, height: 8, borderRadius: "50%",
              background: "#3b82f6", boxShadow: "0 0 6px #3b82f6",
            }} />
          </div>
        </div>
        {/* Flame */}
        <div style={{
          position: "absolute", top: -6, right: -6,
          width: 28, height: 28, borderRadius: "50%",
          background: "rgba(245,158,11,0.15)", border: "1px solid rgba(245,158,11,0.3)",
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: 14,
        }}>🔥</div>
      </div>
    ),
    title: "Forge together",
    body: "Everyone in the voice channel shares the same canvas. Live cursors, real-time edits — build as a crew.",
  },
];

// ── Component ────────────────────────────────────────────────────────────────

export function ForgeWizard() {
  const { wizardStep, setWizardStep, markWizardDone, mode, setMode } = useForgeStore();
  const { user, channelId } = useDiscord();

  const [tourSlide, setTourSlide] = useState(0);
  const [entering, setEntering] = useState(false);

  if (wizardStep === "done") return null;

  const displayName = user?.global_name ?? user?.username ?? "there";
  const avatarUrl = user?.avatar
    ? `https://cdn.discordapp.com/avatars/${user.id}/${user.avatar}.png?size=128`
    : `https://cdn.discordapp.com/embed/avatars/0.png`;

  const goToTour = () => {
    setEntering(true);
    setTimeout(() => { setEntering(false); setWizardStep("tour"); }, 180);
  };

  const goToCanvas = () => {
    setEntering(true);
    setTimeout(() => { setEntering(false); markWizardDone(); }, 200);
  };

  const startForge = () => {
    setMode("forge");
    goToTour();
  };

  const goSolo = () => {
    setMode("solo");
    goToTour();
  };

  const nextSlide = () => {
    if (tourSlide < TOUR_SLIDES.length - 1) {
      setTourSlide(tourSlide + 1);
    } else {
      goToCanvas();
    }
  };

  const prevSlide = () => {
    if (tourSlide > 0) setTourSlide(tourSlide - 1);
  };

  return (
    <div style={{
      position: "fixed",
      inset: 0,
      zIndex: 9000,
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      background: "rgba(10,10,10,0.85)",
      backdropFilter: "blur(12px)",
      WebkitBackdropFilter: "blur(12px)",
      fontFamily: `"DM Sans", "Inter", system-ui, sans-serif`,
      transition: "opacity 0.2s",
      opacity: entering ? 0 : 1,
    }}>
      <style>{`
        @keyframes forge-float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-6px); }
        }
        @keyframes forge-cursor1 {
          0%, 100% { transform: translate(0,0); }
          40% { transform: translate(24px, 8px); }
          70% { transform: translate(18px, 20px); }
        }
        @keyframes forge-cursor2 {
          0%, 100% { transform: translate(0,0); }
          30% { transform: translate(-20px, -12px); }
          60% { transform: translate(-8px, -20px); }
        }
        @keyframes forge-glow-pulse {
          0%, 100% { box-shadow: 0 0 32px rgba(245,158,11,0.15), 0 8px 40px rgba(0,0,0,0.8); }
          50% { box-shadow: 0 0 56px rgba(245,158,11,0.28), 0 8px 40px rgba(0,0,0,0.8); }
        }
        @keyframes forge-slide-in {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>

      {/* Card */}
      <div style={{
        width: "100%",
        maxWidth: 360,
        margin: "0 16px",
        background: "rgba(18,18,18,0.97)",
        border: "1px solid rgba(255,255,255,0.08)",
        borderRadius: 20,
        overflow: "hidden",
        boxShadow: "0 0 32px rgba(245,158,11,0.12), 0 24px 64px rgba(0,0,0,0.9)",
        animation: "forge-slide-in 0.25s ease-out both",
      }}>

        {/* ── WELCOME SCREEN ─────────────────────────────────────── */}
        {wizardStep === "welcome" && (
          <div style={{ padding: "32px 28px 24px" }}>
            {/* Header row: logo + user avatar */}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 28 }}>
              {/* Forge badge */}
              <div style={{
                display: "flex", alignItems: "center", gap: 8,
                background: "rgba(245,158,11,0.1)",
                border: "1px solid rgba(245,158,11,0.2)",
                borderRadius: 20, padding: "5px 12px",
              }}>
                <Flame size={13} style={{ color: "#f59e0b" }} />
                <span style={{ fontSize: 12, fontWeight: 700, color: "#f59e0b", letterSpacing: "0.04em" }}>
                  FORGE
                </span>
              </div>
              {/* User avatar */}
              <img
                src={avatarUrl}
                alt={displayName}
                style={{ width: 34, height: 34, borderRadius: "50%", border: "2px solid rgba(255,255,255,0.08)" }}
              />
            </div>

            {/* Greeting */}
            <div style={{ marginBottom: 6 }}>
              <div style={{
                fontSize: 26, fontWeight: 800, color: "#f0f0f0",
                letterSpacing: "-0.04em", lineHeight: 1.1,
              }}>
                Hey, {displayName}.
              </div>
            </div>

            {/* Tagline */}
            <div style={{
              fontSize: 15, color: "#5a5a5a", marginBottom: 28,
              lineHeight: 1.5, fontWeight: 400,
            }}>
              Build Discord messages with your crew — live, together.
            </div>

            {/* CTAs */}
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {/* Start a Forge */}
              <button
                onClick={startForge}
                style={{
                  display: "flex", alignItems: "center", justifyContent: "center",
                  gap: 8, width: "100%", padding: "14px 20px",
                  background: "#f59e0b",
                  border: "none", borderRadius: 12,
                  color: "#0a0a0a", fontSize: 15, fontWeight: 700,
                  cursor: "pointer", transition: "all 0.15s",
                  boxShadow: "0 4px 20px rgba(245,158,11,0.35)",
                  letterSpacing: "-0.01em",
                }}
                onMouseEnter={(e) => { e.currentTarget.style.background = "#fbbf24"; e.currentTarget.style.transform = "translateY(-1px)"; }}
                onMouseLeave={(e) => { e.currentTarget.style.background = "#f59e0b"; e.currentTarget.style.transform = "none"; }}
              >
                <Flame size={16} />
                Start a Forge
              </button>

              {/* Go Solo */}
              <button
                onClick={goSolo}
                style={{
                  display: "flex", alignItems: "center", justifyContent: "center",
                  gap: 8, width: "100%", padding: "12px 20px",
                  background: "rgba(255,255,255,0.04)",
                  border: "1px solid rgba(255,255,255,0.08)", borderRadius: 12,
                  color: "#888", fontSize: 14, fontWeight: 500,
                  cursor: "pointer", transition: "all 0.15s",
                }}
                onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(255,255,255,0.07)"; e.currentTarget.style.color = "#bbb"; }}
                onMouseLeave={(e) => { e.currentTarget.style.background = "rgba(255,255,255,0.04)"; e.currentTarget.style.color = "#888"; }}
              >
                Go Solo
              </button>
            </div>

            {/* Channel hint */}
            {channelId && (
              <div style={{
                marginTop: 20, display: "flex", alignItems: "center", gap: 6,
                color: "#3a3a3a", fontSize: 12,
              }}>
                <Flame size={11} style={{ color: "#f59e0b", opacity: 0.6 }} />
                <span>Forge tied to your voice channel</span>
              </div>
            )}
          </div>
        )}

        {/* ── TOUR SCREEN ────────────────────────────────────────── */}
        {wizardStep === "tour" && (
          <div>
            {/* Skip */}
            <div style={{ display: "flex", justifyContent: "flex-end", padding: "16px 16px 0" }}>
              <button
                onClick={goToCanvas}
                style={{
                  display: "flex", alignItems: "center", gap: 4,
                  background: "transparent", border: "none",
                  color: "#404040", fontSize: 12, fontWeight: 500,
                  cursor: "pointer", padding: "6px 10px",
                  borderRadius: 8, transition: "color 0.12s",
                }}
                onMouseEnter={(e) => { e.currentTarget.style.color = "#888"; }}
                onMouseLeave={(e) => { e.currentTarget.style.color = "#404040"; }}
              >
                Skip <X size={12} />
              </button>
            </div>

            {/* Slide illustration */}
            <div style={{
              display: "flex", alignItems: "center", justifyContent: "center",
              height: 120, padding: "12px 24px",
            }}>
              {TOUR_SLIDES[tourSlide].icon}
            </div>

            {/* Dot indicators */}
            <div style={{ display: "flex", justifyContent: "center", gap: 6, marginBottom: 20 }}>
              {TOUR_SLIDES.map((_, i) => (
                <button
                  key={i}
                  onClick={() => setTourSlide(i)}
                  style={{
                    width: i === tourSlide ? 20 : 6,
                    height: 6, borderRadius: 3,
                    background: i === tourSlide ? "#f59e0b" : "rgba(255,255,255,0.12)",
                    border: "none", cursor: "pointer",
                    transition: "all 0.2s", padding: 0,
                  }}
                />
              ))}
            </div>

            {/* Text content */}
            <div style={{ padding: "0 28px 28px" }}>
              <div style={{
                fontSize: 20, fontWeight: 700, color: "#f0f0f0",
                letterSpacing: "-0.03em", marginBottom: 10, lineHeight: 1.2,
              }}>
                {TOUR_SLIDES[tourSlide].title}
              </div>
              <div style={{
                fontSize: 14, color: "#5a5a5a", lineHeight: 1.6,
                marginBottom: 24, fontWeight: 400,
              }}>
                {TOUR_SLIDES[tourSlide].body}
              </div>

              {/* Navigation */}
              <div style={{ display: "flex", gap: 10 }}>
                {tourSlide > 0 && (
                  <button
                    onClick={prevSlide}
                    style={{
                      display: "flex", alignItems: "center", justifyContent: "center",
                      width: 44, height: 44, borderRadius: 10,
                      background: "rgba(255,255,255,0.04)",
                      border: "1px solid rgba(255,255,255,0.08)",
                      color: "#888", cursor: "pointer", flexShrink: 0,
                      transition: "all 0.12s",
                    }}
                    onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(255,255,255,0.08)"; }}
                    onMouseLeave={(e) => { e.currentTarget.style.background = "rgba(255,255,255,0.04)"; }}
                  >
                    <ChevronLeft size={18} />
                  </button>
                )}
                <button
                  onClick={nextSlide}
                  style={{
                    flex: 1, display: "flex", alignItems: "center",
                    justifyContent: "center", gap: 8,
                    height: 44, borderRadius: 10,
                    background: tourSlide === TOUR_SLIDES.length - 1 ? "#f59e0b" : "rgba(255,255,255,0.06)",
                    border: tourSlide === TOUR_SLIDES.length - 1 ? "none" : "1px solid rgba(255,255,255,0.08)",
                    color: tourSlide === TOUR_SLIDES.length - 1 ? "#000" : "#ccc",
                    fontWeight: 600, fontSize: 14, cursor: "pointer",
                    transition: "all 0.15s",
                    boxShadow: tourSlide === TOUR_SLIDES.length - 1 ? "0 2px 12px rgba(245,158,11,0.3)" : "none",
                  }}
                  onMouseEnter={(e) => {
                    if (tourSlide === TOUR_SLIDES.length - 1) {
                      e.currentTarget.style.background = "#fbbf24";
                    } else {
                      e.currentTarget.style.background = "rgba(255,255,255,0.09)";
                    }
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = tourSlide === TOUR_SLIDES.length - 1 ? "#f59e0b" : "rgba(255,255,255,0.06)";
                  }}
                >
                  {tourSlide === TOUR_SLIDES.length - 1 ? (
                    <>Let's go <Flame size={15} /></>
                  ) : (
                    <>Next <ChevronRight size={15} /></>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
