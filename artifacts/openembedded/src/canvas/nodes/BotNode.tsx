// @ts-nocheck
import { memo } from "react";
import { Handle, Position, NodeProps } from "@xyflow/react";
import { NodeWrapper } from "./NodeWrapper.js";
import { Bot, CheckCircle2, AlertCircle, ArrowRight } from "lucide-react";

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
    <NodeWrapper id={id} typeName="Bot" icon={<Bot size={14} />} accentColor="#5865F2" nodeClass="root" showSendHandle>
      <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
        {connected ? (
          <>
            <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
              <CheckCircle2 size={10} color="#3fb950" />
              <span style={{ color: "#3fb950", fontSize: 10, fontWeight: 600 }}>
                {botName ?? "Connected"}
              </span>
            </div>
            {guildName && (
              <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                <span style={{ color: "#333", fontSize: 9 }}>Server:</span>
                <span style={{ color: "#666", fontSize: 9, fontWeight: 500, maxWidth: 140, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {guildName}
                </span>
              </div>
            )}
            {channelName && (
              <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                <span style={{ color: "#333", fontSize: 9 }}>#</span>
                <span style={{ color: "#666", fontSize: 9, fontWeight: 500, maxWidth: 140, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {channelName}
                </span>
              </div>
            )}
          </>
        ) : (
          <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
            <AlertCircle size={10} color="#333" />
            <span style={{ color: "#3d3d3d", fontSize: 10 }}>Token not set — configure in panel</span>
          </div>
        )}

        <div style={{ display: "flex", alignItems: "center", gap: 4, paddingTop: 4, borderTop: "1px solid rgba(255,255,255,0.04)" }}>
          <ArrowRight size={8} color="#3fb950" />
          <span style={{ color: "#2a3d2a", fontSize: 9 }}>Connect to Container or Embed →</span>
        </div>
      </div>

      <Handle
        type="source"
        position={Position.Right}
        style={{ background: "#3fb950", border: "2px solid #1a1a1a", width: 10, height: 10 }}
      />
    </NodeWrapper>
  );
}

export const BotNode = memo(BotNodeComponent);
