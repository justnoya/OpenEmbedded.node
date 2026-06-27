// @ts-nocheck
import { useForgeStore } from "../../lib/forgeStore";
import { useDiscord } from "../../lib/discordContext";

/**
 * ForgeCursors — renders other users' cursors as floating bubbles.
 * Positioned absolutely over the canvas area. Pointer-events: none.
 */
export function ForgeCursors({ containerRef }: { containerRef: React.RefObject<HTMLElement> }) {
  const { cursors, crew, myUserId } = useForgeStore();
  const { user } = useDiscord();
  const myId = myUserId ?? user?.id;

  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        pointerEvents: "none",
        zIndex: 4000,
        overflow: "hidden",
      }}
    >
      <style>{`
        @keyframes cursor-appear {
          from { opacity: 0; transform: scale(0.7); }
          to { opacity: 1; transform: scale(1); }
        }
      `}</style>
      {Array.from(cursors.entries()).map(([userId, pos]) => {
        if (userId === myId) return null;
        const member = crew.get(userId);
        if (!member) return null;

        const avatarUrl = member.avatar
          ? `https://cdn.discordapp.com/avatars/${userId}/${member.avatar}.png?size=32`
          : `https://cdn.discordapp.com/embed/avatars/0.png`;

        return (
          <div
            key={userId}
            style={{
              position: "absolute",
              left: pos.x,
              top: pos.y,
              transform: "translate(-2px, -2px)",
              pointerEvents: "none",
              animation: "cursor-appear 0.15s ease-out both",
              zIndex: 4001,
            }}
          >
            {/* Cursor dot */}
            <div style={{
              width: 10,
              height: 10,
              borderRadius: "50%",
              background: member.color,
              boxShadow: `0 0 8px ${member.color}90, 0 2px 4px rgba(0,0,0,0.6)`,
              border: "2px solid rgba(0,0,0,0.4)",
            }} />

            {/* Name label */}
            <div style={{
              position: "absolute",
              left: 14,
              top: -4,
              display: "flex",
              alignItems: "center",
              gap: 5,
              background: "rgba(14,14,14,0.92)",
              border: `1px solid ${member.color}50`,
              borderRadius: 20,
              padding: "3px 8px 3px 4px",
              whiteSpace: "nowrap",
              boxShadow: "0 2px 8px rgba(0,0,0,0.7)",
            }}>
              <img
                src={avatarUrl}
                alt={member.displayName}
                style={{ width: 16, height: 16, borderRadius: "50%", flexShrink: 0 }}
              />
              <span style={{
                fontSize: 11,
                fontWeight: 600,
                color: member.color,
                fontFamily: `"DM Sans", "Inter", system-ui, sans-serif`,
                letterSpacing: "-0.01em",
              }}>
                {member.displayName}
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
}
