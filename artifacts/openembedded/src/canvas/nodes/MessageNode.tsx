import { memo } from "react";
import { Handle, Position, NodeProps } from "@xyflow/react";
import { NodeWrapper } from "./NodeWrapper.js";
import { MessageCircle } from "lucide-react";

function MessageNodeComponent({ id, data }: NodeProps) {
  const content = (data.content as string) ?? "";
  const username = (data.username as string) ?? "";

  return (
    <NodeWrapper id={id} typeName="Message" icon={<MessageCircle size={18} />} accentColor="#10b981" nodeClass="root" showSendHandle>
      <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
        {username && (
          <div style={{ color: "#10b981", fontSize: 11, fontWeight: 600 }}>
            {username}
          </div>
        )}
        <div
          style={{
            color: content ? "#c0c0c0" : "#404040",
            fontSize: 12,
            fontStyle: content ? "normal" : "italic",
            maxWidth: 185,
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}
        >
          {content || "Empty message…"}
        </div>
        {!!data.tts && (
          <span style={{ background: "rgba(16,185,129,0.1)", color: "#10b981", fontSize: 9, fontWeight: 700, padding: "1px 5px", borderRadius: 4, letterSpacing: "0.04em", alignSelf: "flex-start" }}>
            TTS
          </span>
        )}
      </div>
      <Handle type="target" position={Position.Left} style={{ background: "#3fb950", border: "2px solid #252525", width: 12, height: 12 }} />
      <Handle type="source" position={Position.Right} style={{ background: "#10b981", border: "2px solid #252525", width: 12, height: 12 }} />
    </NodeWrapper>
  );
}

export const MessageNode = memo(MessageNodeComponent);
