// @ts-nocheck
import { useState, useRef, useCallback } from "react";
import {
  Flame, Users, Plus, Undo2, Redo2, Send, Eye, X,
  Zap, SlidersHorizontal, Wifi, WifiOff,
} from "lucide-react";
import { useForgeStore } from "../../lib/forgeStore";
import { useDiscord } from "../../lib/discordContext";
import { CrewPanel } from "./CrewPanel";
import { ForgeCursors } from "./ForgeCursors";

type Props = {
  canvas: React.ReactNode;
  nodeLibrary: React.ReactNode;
  propertiesPanel: React.ReactNode;
  exportPanel: React.ReactNode;
  undo: () => void;
  redo: () => void;
  canUndo: boolean;
  canRedo: boolean;
  onSend: () => void;
  canSend: boolean;
  onCursorMove?: (x: number, y: number) => void;
};

export function ActivityLayout({
  canvas,
  nodeLibrary,
  propertiesPanel,
  exportPanel,
  undo,
  redo,
  canUndo,
  canRedo,
  onSend,
  canSend,
  onCursorMove,
}: Props) {
  const [showLibrary, setShowLibrary] = useState(false);
  const [showCrew, setShowCrew] = useState(false);
  const [showProps, setShowProps] = useState(false);
  const [showSend, setShowSend] = useState(false);
  const canvasRef = useRef<HTMLDivElement>(null);

  const { crew, mode, isConnected } = useForgeStore();
  const { channelId, user } = useDiscord();

  const crewList = Array.from(crew.values());

  // Handle cursor tracking on canvas
  const handleMouseMove = useCallback(
    (e: React.MouseEvent) => {
      if (!canvasRef.current || !onCursorMove) return;
      const rect = canvasRef.current.getBoundingClientRect();
      onCursorMove(e.clientX - rect.left, e.clientY - rect.top);
    },
    [onCursorMove]
  );

  return (
    <div style={{
      display: "flex",
      flexDirection: "column",
      height: "100dvh",
      background: "#0f0f0f",
      overflow: "hidden",
      fontFamily: `"DM Sans", "Inter", system-ui, sans-serif`,
      position: "relative",
    }}>
      <style>{`
        @keyframes activity-sheet-in {
          from { transform: translateY(100%); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
        @keyframes activity-panel-in {
          from { opacity: 0; transform: translateY(8px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(-4px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes scaleIn { from { opacity: 0; transform: scale(0.95); } to { opacity: 1; transform: scale(1); } }
        @keyframes pulseRing { from { opacity: 0.5; transform: scale(1); } to { opacity: 1; transform: scale(1.02); } }
        .react-flow__controls {
          background: #161616 !important;
          border: 1px solid rgba(255,255,255,0.08) !important;
          border-radius: 10px !important;
          box-shadow: 0 4px 20px rgba(0,0,0,0.6) !important;
          overflow: hidden !important;
        }
        .react-flow__controls button {
          background: #161616 !important;
          border: none !important;
          border-bottom: 1px solid rgba(255,255,255,0.05) !important;
          color: #888888 !important;
          fill: #888888 !important;
        }
        .react-flow__controls button:last-child { border-bottom: none !important; }
        .react-flow__controls button:hover { background: rgba(255,255,255,0.05) !important; }
        .react-flow__controls-button svg { fill: #888888 !important; }
        .react-flow__minimap {
          background: #161616 !important;
          border: 1px solid rgba(255,255,255,0.07) !important;
          border-radius: 10px !important;
          overflow: hidden !important;
        }
        .react-flow__minimap-svg { background: #161616 !important; }
        .react-flow__edge-path { stroke-width: 2px; }
      `}</style>

      {/* ── Top Bar ──────────────────────────────────────────────── */}
      <div style={{
        height: 52,
        display: "flex",
        alignItems: "center",
        padding: "0 14px",
        background: "rgba(14,14,14,0.96)",
        borderBottom: "1px solid rgba(255,255,255,0.05)",
        flexShrink: 0,
        gap: 10,
        zIndex: 100,
      }}>
        {/* Logo */}
        <img
          src="/logo.png"
          alt="OpenEmbedded"
          style={{ width: 26, height: 26, borderRadius: 6, objectFit: "cover", flexShrink: 0 }}
        />

        <div style={{ width: 1, height: 16, background: "rgba(255,255,255,0.07)", flexShrink: 0, margin: "0 2px" }} />

        {/* Forge badge */}
        <div style={{
          display: "flex", alignItems: "center", gap: 6,
          flex: 1, minWidth: 0,
        }}>
          {mode === "forge" ? (
            <div style={{
              display: "flex", alignItems: "center", gap: 5,
              background: "rgba(245,158,11,0.1)",
              border: "1px solid rgba(245,158,11,0.2)",
              borderRadius: 16, padding: "4px 10px",
              flexShrink: 0,
            }}>
              <Flame size={11} style={{ color: "#f59e0b" }} />
              <span style={{ fontSize: 11, fontWeight: 700, color: "#f59e0b", letterSpacing: "0.04em" }}>
                FORGE
              </span>
              {/* Connection dot */}
              <div style={{
                width: 5, height: 5, borderRadius: "50%",
                background: isConnected ? "#10b981" : "#ef4444",
                marginLeft: 2,
              }} />
            </div>
          ) : (
            <div style={{
              display: "flex", alignItems: "center", gap: 5,
              color: "#3a3a3a", fontSize: 12,
            }}>
              <span>Solo Mode</span>
            </div>
          )}
        </div>

        {/* Crew avatars */}
        {mode === "forge" && crewList.length > 0 && (
          <button
            onClick={() => setShowCrew(!showCrew)}
            style={{
              display: "flex", alignItems: "center",
              background: showCrew ? "rgba(255,255,255,0.06)" : "transparent",
              border: "1px solid " + (showCrew ? "rgba(255,255,255,0.1)" : "transparent"),
              borderRadius: 20, padding: "4px 8px 4px 4px",
              cursor: "pointer", gap: -4,
              transition: "all 0.12s",
            }}
          >
            <div style={{ display: "flex", alignItems: "center" }}>
              {crewList.slice(0, 3).map((m, i) => {
                const avatarUrl = m.avatar
                  ? `https://cdn.discordapp.com/avatars/${m.userId}/${m.avatar}.png?size=32`
                  : `https://cdn.discordapp.com/embed/avatars/0.png`;
                return (
                  <img
                    key={m.userId}
                    src={avatarUrl}
                    alt={m.displayName}
                    style={{
                      width: 22, height: 22, borderRadius: "50%",
                      border: `2px solid ${m.color}`,
                      marginLeft: i > 0 ? -6 : 0,
                      objectFit: "cover",
                    }}
                  />
                );
              })}
              {crewList.length > 3 && (
                <div style={{
                  width: 22, height: 22, borderRadius: "50%",
                  background: "#2a2a2a", border: "2px solid #3a3a3a",
                  marginLeft: -6, display: "flex",
                  alignItems: "center", justifyContent: "center",
                  fontSize: 9, color: "#888", fontWeight: 700,
                }}>
                  +{crewList.length - 3}
                </div>
              )}
            </div>
            <Users size={11} style={{ color: "#555", marginLeft: 6 }} />
          </button>
        )}

        {/* Properties button */}
        <button
          onClick={() => setShowProps(!showProps)}
          style={{
            display: "flex", alignItems: "center", justifyContent: "center",
            width: 34, height: 34,
            background: showProps ? "rgba(255,255,255,0.07)" : "transparent",
            border: "1px solid rgba(255,255,255,0.07)",
            borderRadius: 9, cursor: "pointer",
            color: showProps ? "#d0d0d0" : "#555",
            transition: "all 0.12s",
          }}
          onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(255,255,255,0.06)"; }}
          onMouseLeave={(e) => { e.currentTarget.style.background = showProps ? "rgba(255,255,255,0.07)" : "transparent"; }}
        >
          <SlidersHorizontal size={14} />
        </button>
      </div>

      {/* ── Canvas + Cursors ──────────────────────────────────────── */}
      <div
        ref={canvasRef}
        style={{ flex: 1, position: "relative", overflow: "hidden" }}
        onMouseMove={handleMouseMove}
      >
        {canvas}
        <ForgeCursors containerRef={canvasRef} />
      </div>

      {/* ── Bottom Bar ───────────────────────────────────────────── */}
      <div style={{
        height: 64,
        display: "flex",
        alignItems: "center",
        padding: "0 16px",
        background: "rgba(14,14,14,0.97)",
        borderTop: "1px solid rgba(255,255,255,0.05)",
        flexShrink: 0,
        gap: 10,
        zIndex: 100,
      }}>
        {/* + Add */}
        <button
          onClick={() => setShowLibrary(true)}
          style={{
            display: "flex", alignItems: "center", gap: 6,
            background: "rgba(255,255,255,0.06)",
            border: "1px solid rgba(255,255,255,0.09)",
            borderRadius: 10, padding: "10px 14px",
            color: "#c0c0c0", fontSize: 13, fontWeight: 600,
            cursor: "pointer", transition: "all 0.12s", flexShrink: 0,
          }}
          onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(255,255,255,0.1)"; }}
          onMouseLeave={(e) => { e.currentTarget.style.background = "rgba(255,255,255,0.06)"; }}
        >
          <Plus size={15} />
          Add
        </button>

        {/* Undo / Redo */}
        <div style={{ display: "flex", gap: 4 }}>
          <button
            onClick={undo}
            disabled={!canUndo}
            style={{
              display: "flex", alignItems: "center", justifyContent: "center",
              width: 38, height: 38,
              background: "transparent", border: "1px solid rgba(255,255,255,0.07)",
              borderRadius: 9, color: canUndo ? "#777" : "#2e2e2e",
              cursor: canUndo ? "pointer" : "not-allowed", transition: "all 0.12s",
            }}
            onMouseEnter={(e) => { if (canUndo) e.currentTarget.style.background = "rgba(255,255,255,0.06)"; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; }}
          >
            <Undo2 size={15} />
          </button>
          <button
            onClick={redo}
            disabled={!canRedo}
            style={{
              display: "flex", alignItems: "center", justifyContent: "center",
              width: 38, height: 38,
              background: "transparent", border: "1px solid rgba(255,255,255,0.07)",
              borderRadius: 9, color: canRedo ? "#777" : "#2e2e2e",
              cursor: canRedo ? "pointer" : "not-allowed", transition: "all 0.12s",
            }}
            onMouseEnter={(e) => { if (canRedo) e.currentTarget.style.background = "rgba(255,255,255,0.06)"; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; }}
          >
            <Redo2 size={15} />
          </button>
        </div>

        <div style={{ flex: 1 }} />

        {/* Preview */}
        <button
          onClick={() => setShowProps(true)}
          style={{
            display: "flex", alignItems: "center", gap: 6,
            background: "transparent", border: "1px solid rgba(255,255,255,0.07)",
            borderRadius: 10, padding: "10px 14px",
            color: "#666", fontSize: 13, fontWeight: 500,
            cursor: "pointer", transition: "all 0.12s", flexShrink: 0,
          }}
          onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(255,255,255,0.05)"; e.currentTarget.style.color = "#999"; }}
          onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "#666"; }}
        >
          <Eye size={14} />
          Preview
        </button>

        {/* Send (Forge primary action) */}
        <button
          onClick={() => setShowSend(true)}
          style={{
            display: "flex", alignItems: "center", gap: 7,
            background: "#f59e0b",
            border: "none", borderRadius: 10,
            padding: "10px 18px",
            color: "#000", fontSize: 13, fontWeight: 700,
            cursor: "pointer", transition: "all 0.15s", flexShrink: 0,
            boxShadow: "0 2px 16px rgba(245,158,11,0.35)",
            letterSpacing: "-0.01em",
          }}
          onMouseEnter={(e) => { e.currentTarget.style.background = "#fbbf24"; e.currentTarget.style.transform = "translateY(-1px)"; }}
          onMouseLeave={(e) => { e.currentTarget.style.background = "#f59e0b"; e.currentTarget.style.transform = "none"; }}
        >
          <Flame size={14} />
          Send
        </button>
      </div>

      {/* ── Crew Panel ───────────────────────────────────────────── */}
      {showCrew && <CrewPanel onClose={() => setShowCrew(false)} />}

      {/* ── Properties Sheet ─────────────────────────────────────── */}
      {showProps && (
        <div
          style={{
            position: "fixed", inset: 0, zIndex: 5500,
            background: "rgba(0,0,0,0.5)",
            backdropFilter: "blur(4px)",
            WebkitBackdropFilter: "blur(4px)",
          }}
          onClick={() => setShowProps(false)}
        >
          <div
            style={{
              position: "absolute", bottom: 0, left: 0, right: 0,
              background: "#141414",
              border: "1px solid rgba(255,255,255,0.07)",
              borderRadius: "16px 16px 0 0",
              maxHeight: "70dvh",
              overflow: "hidden",
              display: "flex",
              flexDirection: "column",
              animation: "activity-sheet-in 0.22s cubic-bezier(0.32, 0.72, 0, 1) both",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Drag handle + header */}
            <div style={{
              display: "flex", alignItems: "center",
              padding: "12px 16px 10px",
              borderBottom: "1px solid rgba(255,255,255,0.05)",
              flexShrink: 0,
            }}>
              <div style={{
                width: 36, height: 4, borderRadius: 2,
                background: "rgba(255,255,255,0.12)",
                position: "absolute", top: 8, left: "50%",
                transform: "translateX(-50%)",
              }} />
              <span style={{ fontSize: 13, fontWeight: 600, color: "#c0c0c0", flex: 1, marginTop: 8 }}>
                Properties &amp; Preview
              </span>
              <button
                onClick={() => setShowProps(false)}
                style={{
                  background: "transparent", border: "none",
                  color: "#404040", cursor: "pointer", padding: 4, marginTop: 8,
                  display: "flex", alignItems: "center", borderRadius: 6,
                }}
              >
                <X size={16} />
              </button>
            </div>
            <div style={{ flex: 1, overflowY: "auto" }}>
              {propertiesPanel}
            </div>
          </div>
        </div>
      )}

      {/* ── Node Library Sheet ───────────────────────────────────── */}
      {showLibrary && (
        <div
          style={{
            position: "fixed", inset: 0, zIndex: 5500,
            background: "rgba(0,0,0,0.5)",
            backdropFilter: "blur(4px)",
            WebkitBackdropFilter: "blur(4px)",
          }}
          onClick={() => setShowLibrary(false)}
        >
          <div
            style={{
              position: "absolute", bottom: 0, left: 0, right: 0,
              background: "#141414",
              border: "1px solid rgba(255,255,255,0.07)",
              borderRadius: "16px 16px 0 0",
              maxHeight: "75dvh",
              overflow: "hidden",
              display: "flex",
              flexDirection: "column",
              animation: "activity-sheet-in 0.22s cubic-bezier(0.32, 0.72, 0, 1) both",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Drag handle + header */}
            <div style={{
              padding: "16px 16px 12px",
              borderBottom: "1px solid rgba(255,255,255,0.05)",
              flexShrink: 0,
              position: "relative",
            }}>
              <div style={{
                width: 36, height: 4, borderRadius: 2,
                background: "rgba(255,255,255,0.12)",
                position: "absolute", top: 8, left: "50%",
                transform: "translateX(-50%)",
              }} />
              <div style={{ display: "flex", alignItems: "center", marginTop: 8 }}>
                <span style={{ flex: 1, fontSize: 13, fontWeight: 600, color: "#c0c0c0" }}>Add a Node</span>
                <button
                  onClick={() => setShowLibrary(false)}
                  style={{
                    background: "transparent", border: "none",
                    color: "#404040", cursor: "pointer", padding: 4,
                    display: "flex", alignItems: "center", borderRadius: 6,
                  }}
                >
                  <X size={16} />
                </button>
              </div>
            </div>
            <div
              style={{ flex: 1, overflowY: "auto" }}
              onClick={() => setShowLibrary(false)}
            >
              {nodeLibrary}
            </div>
          </div>
        </div>
      )}

      {/* ── Send / Export Sheet ──────────────────────────────────── */}
      {showSend && (
        <div
          style={{
            position: "fixed", inset: 0, zIndex: 5500,
            background: "rgba(0,0,0,0.5)",
            backdropFilter: "blur(4px)",
            WebkitBackdropFilter: "blur(4px)",
          }}
          onClick={() => setShowSend(false)}
        >
          <div
            style={{
              position: "absolute", bottom: 0, left: 0, right: 0,
              background: "#141414",
              border: "1px solid rgba(255,255,255,0.07)",
              borderRadius: "16px 16px 0 0",
              maxHeight: "80dvh",
              overflow: "hidden",
              display: "flex",
              flexDirection: "column",
              animation: "activity-sheet-in 0.22s cubic-bezier(0.32, 0.72, 0, 1) both",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{
              padding: "16px 16px 12px",
              borderBottom: "1px solid rgba(255,255,255,0.05)",
              flexShrink: 0,
              position: "relative",
            }}>
              <div style={{
                width: 36, height: 4, borderRadius: 2,
                background: "rgba(255,255,255,0.12)",
                position: "absolute", top: 8, left: "50%",
                transform: "translateX(-50%)",
              }} />
              <div style={{ display: "flex", alignItems: "center", marginTop: 8 }}>
                <Flame size={14} style={{ color: "#f59e0b", marginRight: 8 }} />
                <span style={{ flex: 1, fontSize: 13, fontWeight: 600, color: "#f59e0b" }}>Send Message</span>
                <button
                  onClick={() => setShowSend(false)}
                  style={{
                    background: "transparent", border: "none",
                    color: "#404040", cursor: "pointer", padding: 4,
                    display: "flex", alignItems: "center", borderRadius: 6,
                  }}
                >
                  <X size={16} />
                </button>
              </div>
            </div>
            <div style={{ flex: 1, overflowY: "auto" }}>
              {exportPanel}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
