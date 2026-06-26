import { memo } from "react";
import { Handle, Position, NodeProps } from "@xyflow/react";
import { NodeWrapper } from "./NodeWrapper.js";
import { Sparkles, CheckCircle2, AlertCircle, Hash, Server, Send, Zap } from "lucide-react";
import { useGraphStore } from "@/lib/graphStore";

function OpenEmbeddedNodeComponent({ id, data }: NodeProps) {
  const edges = useGraphStore((s) => s.edges);

  const selectedGuildId = data.selectedGuildId as string | undefined;
  const selectedChannelId = data.selectedChannelId as string | undefined;
  const guilds = (data.guilds as Array<{ id: string; name: string }>) ?? [];
  const channels = (data.channels as Array<{ id: string; name: string }>) ?? [];

  const guildName = guilds.find((g) => g.id === selectedGuildId)?.name;
  const channelName = channels.find((c) => c.id === selectedChannelId)?.name;

  const interactionCount = edges.filter((e) => e.type === "interaction").length;
  const isReady = !!selectedChannelId;

  return (
    <NodeWrapper
      id={id}
      typeName="OpenEmbedded"
      icon={<Sparkles size={16} />}
      accentColor="#818cf8"
      nodeClass="root"
      showSendHandle
    >
      <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
        {isReady ? (
          <>
            {guildName && (
              <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
                <Server size={9} color="#484848" />
                <span style={{ color: "#606060", fontSize: 10, fontWeight: 500, maxWidth: 150, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {guildName}
                </span>
              </div>
            )}
            {channelName && (
              <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
                <Hash size={9} color="#818cf8" />
                <span style={{ color: "#818cf8", fontSize: 10, fontWeight: 600, maxWidth: 150, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {channelName}
                </span>
              </div>
            )}
          </>
        ) : guilds.length > 0 ? (
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <AlertCircle size={11} color="#484848" />
            <span style={{ color: "#484848", fontSize: 11 }}>Pick a channel in Properties</span>
          </div>
        ) : (
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <AlertCircle size={11} color="#484848" />
            <span style={{ color: "#484848", fontSize: 11 }}>Add bot to a server first</span>
          </div>
        )}

        {interactionCount > 0 && (
          <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
            <Zap size={9} color="#484848" />
            <span style={{ color: "#484848", fontSize: 10 }}>
              {interactionCount} flow{interactionCount !== 1 ? "s" : ""} defined
            </span>
          </div>
        )}

        {/* Send hint */}
        <div style={{ display: "flex", alignItems: "center", gap: 5, marginTop: 2, paddingTop: 6, borderTop: "1px solid rgba(255,255,255,0.04)" }}>
          <Send size={9} color={isReady ? "#3fb950" : "#484848"} />
          <span style={{ color: isReady ? "#2e4a32" : "#484848", fontSize: 10 }}>
            {isReady ? "Drag right handle → Container or Embed" : "Configure in Properties panel"}
          </span>
        </div>
      </div>

      <Handle
        type="source"
        position={Position.Right}
        style={{
          background: isReady ? "#3fb950" : "#3a3a3a",
          border: "2px solid #252525",
          width: 12,
          height: 12,
        }}
      />
    </NodeWrapper>
  );
}

export const OpenEmbeddedNode = memo(OpenEmbeddedNodeComponent);
