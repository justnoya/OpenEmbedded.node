import { memo } from "react";
import { Handle, Position, NodeProps } from "@xyflow/react";
import { NodeWrapper } from "./NodeWrapper.js";
import { Bot, CheckCircle2, AlertCircle, Send } from "lucide-react";

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
    <NodeWrapper id={id} typeName="Bot · Advanced" icon={<Bot size={18} />} accentColor="#5865F2" nodeClass="root" showSendHandle>
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
              <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
                <span style={{ color: "#404040", fontSize: 10 }}>Server:</span>
                <span style={{ color: "#808080", fontSize: 10, fontWeight: 500, maxWidth: 140, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {guildName}
                </span>
              </div>
            )}
            {channelName && (
              <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
                <span style={{ color: "#404040", fontSize: 10 }}>#</span>
                <span style={{ color: "#808080", fontSize: 10, fontWeight: 500, maxWidth: 140, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {channelName}
                </span>
              </div>
            )}
          </>
        ) : (
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <AlertCircle size={12} color="#484848" />
            <span style={{ color: "#484848", fontSize: 11 }}>Token not set</span>
          </div>
        )}

        {/* Send hint */}
        <div style={{ display: "flex", alignItems: "center", gap: 5, marginTop: 2, paddingTop: 6, borderTop: "1px solid rgba(255,255,255,0.04)" }}>
          <Send size={9} color="#3fb950" />
          <span style={{ color: "#2e4a32", fontSize: 10 }}>
            Drag right handle → Container or Embed
          </span>
        </div>
      </div>

      {/* Send source handle (right) — no target handle */}
      <Handle
        type="source"
        position={Position.Right}
        style={{ background: "#3fb950", border: "2px solid #252525", width: 12, height: 12 }}
      />
    </NodeWrapper>
  );
}

export const BotNode = memo(BotNodeComponent);
