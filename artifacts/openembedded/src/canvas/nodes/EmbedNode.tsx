import { memo } from "react";
import { Handle, Position, NodeProps } from "@xyflow/react";
import { NodeWrapper } from "./NodeWrapper";
import { MessageSquare } from "lucide-react";

function EmbedNodeComponent({ id, data }: NodeProps) {
  const title = (data.title as string) ?? "";
  const color = data.color as number | undefined;
  const accentHex = color != null ? `#${color.toString(16).padStart(6, "0")}` : "#5865F2";

  return (
    <NodeWrapper id={id} typeName="Embed (Legacy)" icon={<MessageSquare size={13} />} accentColor={accentHex}>
      <div style={{ display: "flex", alignItems: "stretch", gap: 8 }}>
        <div
          style={{
            width: 3,
            borderRadius: 2,
            background: accentHex,
            flexShrink: 0,
            minHeight: 28,
          }}
        />
        <div>
          <div style={{ color: "#e6edf3", fontSize: 13, fontWeight: 600 }}>
            {title || "Embed"}
          </div>
          {data.description != null && String(data.description).trim() !== "" && (
            <div
              style={{
                color: "#7d8590",
                fontSize: 11,
                marginTop: 2,
                maxWidth: 175,
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
              }}
            >
              {String(data.description)}
            </div>
          )}
        </div>
      </div>
      <Handle type="target" position={Position.Left} style={{ background: "#3fb950", border: "2px solid #1c2128", width: 10, height: 10 }} />
      <Handle type="source" position={Position.Right} style={{ background: accentHex, border: "2px solid #1c2128", width: 10, height: 10 }} />
    </NodeWrapper>
  );
}

export const EmbedNode = memo(EmbedNodeComponent);
