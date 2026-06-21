import { memo } from "react";
import { NodeProps } from "@xyflow/react";
import { NodeWrapper } from "./NodeWrapper";
import { Bot, CheckCircle2, AlertCircle } from "lucide-react";

function BotNodeComponent({ id, data }: NodeProps) {
  const connected = !!data.connected;
  const botName = data.botName as string | undefined;
  const selectedGuildId = data.selectedGuildId as string | undefined;
  const selectedChannelId = data.selectedChannelId as string | undefined;
  const guilds = (data.guilds as Array<{ id: string; name: string }>) ?? [];
  const channels = (data.channels as Array<{ id: string; name: string }>) ?? [];

  const guildName = guilds.find((g) => g.id === selectedGuildId)?.name;
  const channelName = channels.find((c) => c.id === selectedChannelId)?.name;

  return (
    <NodeWrapper id={id} typeName="Bot · Advanced" icon={<Bot size={13} />} accentColor="#5865F2" nodeClass="root">
      <div style={{ color: "#e8e8e8", fontSize: 13, fontWeight: 600, marginBottom: 6 }}>
        Discord Bot
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
        {connected ? (
          <>
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <CheckCircle2 size={12} color="#3fb950" />
              <span style={{ color: "#3fb950", fontSize: 11, fontWeight: 600 }}>
                {botName ?? "Connected"}
              </span>
            </div>
            {guildName && (
              <span style={{ color: "#888", fontSize: 11 }}>
                Server: <span style={{ color: "#b0b0b0" }}>{guildName}</span>
              </span>
            )}
            {channelName && (
              <span style={{ color: "#888", fontSize: 11 }}>
                Channel: <span style={{ color: "#b0b0b0" }}>#{channelName}</span>
              </span>
            )}
            {!selectedChannelId && (
              <span style={{ color: "#f59e0b", fontSize: 11 }}>Select a channel →</span>
            )}
          </>
        ) : (
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <AlertCircle size={12} color="#f59e0b" />
            <span style={{ color: "#888888", fontSize: 11 }}>
              Enter token to connect
            </span>
          </div>
        )}
      </div>
    </NodeWrapper>
  );
}

export const BotNode = memo(BotNodeComponent);
