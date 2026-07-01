// @ts-nocheck
import { memo } from "react";
import { Handle, Position, NodeProps } from "@xyflow/react";
import { NodeWrapper } from "./NodeWrapper.js";
import { Send } from "lucide-react";

function SendMessageActionNodeComponent({ id, data }: NodeProps) {
  const content = (data.content as string) ?? "";
  const channelMode = (data.channelMode as string) ?? "same"; // same | specific | from_variable
  const channelId = (data.channelId as string) ?? "";
  const ephemeral = !!(data.ephemeral as boolean);

  const preview = content.length > 60 ? content.slice(0, 57) + "…" : content;

  return (
    <NodeWrapper id={id} typeName="Send Message" icon={<Send size={14} />} accentColor="#3b82f6" nodeClass="relay">
      <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
        {content ? (
          <div style={{ color: "#c8c8c8", fontSize: 11, lineHeight: 1.4, maxWidth: 185, overflow: "hidden", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical" }}>
            {preview}
          </div>
        ) : (
          <div style={{ color: "#404040", fontSize: 11, fontStyle: "italic" }}>No content set</div>
        )}
        <div style={{ display: "flex", alignItems: "center", gap: 5, flexWrap: "wrap" }}>
          <span style={{ background: "rgba(59,130,246,0.15)", color: "#60a5fa", fontSize: 8, fontWeight: 700, padding: "1px 5px", borderRadius: 3, textTransform: "uppercase", letterSpacing: "0.06em" }}>
            ACTION
          </span>
          {channelMode === "specific" && channelId && (
            <span style={{ color: "#505050", fontSize: 9 }}>→ #{channelId.slice(0, 10)}</span>
          )}
          {channelMode === "same" && (
            <span style={{ color: "#505050", fontSize: 9 }}>→ same channel</span>
          )}
          {ephemeral && (
            <span style={{ color: "#8b5cf6", fontSize: 9, fontWeight: 600 }}>ephemeral</span>
          )}
        </div>
      </div>
      <Handle type="target" position={Position.Left} style={{ background: "#3b82f6", border: "2px solid #1a1a1a", width: 10, height: 10 }} />
      <Handle type="source" position={Position.Right} style={{ background: "#3b82f6", border: "2px solid #1a1a1a", width: 10, height: 10 }} />
    </NodeWrapper>
  );
}

export const SendMessageActionNode = memo(SendMessageActionNodeComponent);
