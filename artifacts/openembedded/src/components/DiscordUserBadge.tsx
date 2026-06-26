/**
 * Shows the authenticated Discord user's avatar + username in the navbar.
 * Only renders when the app is running as a Discord Activity and the user is authed.
 */
import { useState } from "react";
import { useDiscord } from "../lib/discordContext.js";

export function DiscordUserBadge() {
  const { isDiscord, sdkState, user } = useDiscord();
  const [imgError, setImgError] = useState(false);

  if (!isDiscord || sdkState !== "ready" || !user) return null;

  const avatarUrl =
    !imgError && user.avatar
      ? `https://cdn.discordapp.com/avatars/${user.id}/${user.avatar}.png?size=64`
      : `https://cdn.discordapp.com/embed/avatars/${parseInt(user.id) % 6}.png`;

  const displayName = user.global_name ?? user.username;

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 8,
        marginLeft: 8,
        padding: "3px 10px 3px 4px",
        background: "rgba(255,255,255,0.04)",
        border: "1px solid rgba(255,255,255,0.07)",
        borderRadius: 20,
        flexShrink: 0,
        cursor: "default",
      }}
      title={`@${user.username}${user.discriminator !== "0" ? `#${user.discriminator}` : ""}`}
    >
      <img
        src={avatarUrl}
        alt={displayName}
        onError={() => setImgError(true)}
        style={{
          width: 22,
          height: 22,
          borderRadius: "50%",
          objectFit: "cover",
          border: "1.5px solid rgba(88,101,242,0.4)",
          flexShrink: 0,
        }}
      />
      <span
        style={{
          fontSize: 12,
          fontWeight: 500,
          color: "#c0c0c0",
          maxWidth: 100,
          overflow: "hidden",
          textOverflow: "ellipsis",
          whiteSpace: "nowrap",
        }}
      >
        {displayName}
      </span>
    </div>
  );
}
