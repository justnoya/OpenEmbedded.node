// @ts-nocheck
import { useState } from "react";
import { X, Flame, Wifi, WifiOff } from "lucide-react";
import { useForgeStore } from "../../lib/forgeStore";
import { useDiscord } from "../../lib/discordContext";

export function CrewPanel({ onClose }: { onClose: () => void }) {
  const { crew, claims, mode, isConnected } = useForgeStore();
  const { user } = useDiscord();
  const myId = user?.id;

  const crewList = Array.from(crew.values());

  // Count claims per user
  const claimCounts = new Map<string, number>();
  for (const info of claims.values()) {
    claimCounts.set(info.userId, (claimCounts.get(info.userId) ?? 0) + 1);
  }

  return (
    <div style={{
      position: "fixed",
      top: 56, right: 12,
      width: 240,
      background: "rgba(18,18,18,0.97)",
      border: "1px solid rgba(255,255,255,0.08)",
      borderRadius: 16,
      boxShadow: "0 16px 48px rgba(0,0,0,0.8)",
      zIndex: 5000,
      fontFamily: `"DM Sans", "Inter", system-ui, sans-serif`,
      overflow: "hidden",
      animation: "crew-slide-in 0.18s ease-out both",
    }}>
      <style>{`
        @keyframes crew-slide-in {
          from { opacity: 0; transform: translateY(-6px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>

      {/* Header */}
      <div style={{
        display: "flex", alignItems: "center", padding: "14px 16px 10px",
        borderBottom: "1px solid rgba(255,255,255,0.05)",
      }}>
        <Flame size={13} style={{ color: "#f59e0b", marginRight: 7 }} />
        <span style={{ flex: 1, fontSize: 12, fontWeight: 700, color: "#f59e0b", letterSpacing: "0.05em" }}>
          THE CREW {crewList.length > 0 && `· ${crewList.length}`}
        </span>
        {/* Connection indicator */}
        <div style={{
          display: "flex", alignItems: "center", gap: 4,
          marginRight: 8, color: isConnected ? "#10b981" : "#ef4444", fontSize: 10,
        }}>
          {isConnected ? <Wifi size={10} /> : <WifiOff size={10} />}
          {isConnected ? "Live" : "Offline"}
        </div>
        <button
          onClick={onClose}
          style={{
            background: "transparent", border: "none",
            color: "#404040", cursor: "pointer", padding: 4, borderRadius: 6,
            display: "flex", alignItems: "center",
            transition: "color 0.12s",
          }}
          onMouseEnter={(e) => { e.currentTarget.style.color = "#888"; }}
          onMouseLeave={(e) => { e.currentTarget.style.color = "#404040"; }}
        >
          <X size={14} />
        </button>
      </div>

      {/* Crew list */}
      <div style={{ padding: "8px 0 10px" }}>
        {mode === "solo" ? (
          <div style={{ padding: "12px 16px", color: "#3a3a3a", fontSize: 13 }}>
            You're in Solo mode. Start a Forge to collaborate.
          </div>
        ) : crewList.length === 0 ? (
          <div style={{ padding: "12px 16px", color: "#3a3a3a", fontSize: 13 }}>
            No one else is here yet.
          </div>
        ) : (
          crewList.map((member) => {
            const isMe = member.userId === myId;
            const count = claimCounts.get(member.userId) ?? 0;
            const avatarUrl = member.avatar
              ? `https://cdn.discordapp.com/avatars/${member.userId}/${member.avatar}.png?size=64`
              : `https://cdn.discordapp.com/embed/avatars/0.png`;

            return (
              <div
                key={member.userId}
                style={{
                  display: "flex", alignItems: "center",
                  padding: "8px 16px", gap: 10,
                  background: isMe ? "rgba(245,158,11,0.04)" : "transparent",
                }}
              >
                {/* Avatar with color ring */}
                <div style={{ position: "relative", flexShrink: 0 }}>
                  <img
                    src={avatarUrl}
                    alt={member.displayName}
                    style={{
                      width: 32, height: 32, borderRadius: "50%",
                      border: `2px solid ${member.color}`,
                      objectFit: "cover",
                    }}
                  />
                  {/* Online dot */}
                  <div style={{
                    position: "absolute", bottom: 0, right: 0,
                    width: 8, height: 8, borderRadius: "50%",
                    background: "#10b981",
                    border: "2px solid #121212",
                  }} />
                </div>

                {/* Name */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{
                    fontSize: 13, fontWeight: 600,
                    color: isMe ? "#f59e0b" : "#d0d0d0",
                    overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                  }}>
                    {member.displayName} {isMe && <span style={{ fontWeight: 400, color: "#555", fontSize: 11 }}>(you)</span>}
                  </div>
                  {count > 0 && (
                    <div style={{ fontSize: 11, color: "#555", marginTop: 1 }}>
                      Editing {count} node{count !== 1 ? "s" : ""}
                    </div>
                  )}
                </div>

                {/* Color dot */}
                <div style={{
                  width: 8, height: 8, borderRadius: "50%",
                  background: member.color, flexShrink: 0,
                  boxShadow: `0 0 6px ${member.color}60`,
                }} />
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
