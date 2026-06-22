import { memo } from "react";
import { Handle, Position, NodeProps } from "@xyflow/react";
import { NodeWrapper } from "./NodeWrapper";
import { MessageSquare } from "lucide-react";

function EmbedNodeComponent({ id, data }: NodeProps) {
  const title = (data.title as string) ?? "";
  const color = data.color as number | undefined;
  const accentHex = color != null ? `#${color.toString(16).padStart(6, "0")}` : "#5865F2";

  return (
    <NodeWrapper id={id} typeName="Embed (Legacy)" icon={<MessageSquare size={18} />} accentColor={accentHex} nodeClass="root">
      <div style={{ display: "flex", alignItems: "stretch", gap: 8 }}>
        <div style={{ width: 2, borderRadius: 2, background: accentHex, flexShrink: 0, minHeight: 24 }} />
        <div>
          <div style={{ color: "#c8c8c8", fontSize: 13, fontWeight: 600 }}>
            {title || <span style={{ color: "#404040", fontStyle: "italic" }}>Untitled embed</span>}
          </div>
          {data.description != null && String(data.description).trim() !== "" && (
            <div style={{ color: "#606060", fontSize: 11, marginTop: 2, maxWidth: 175, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              {String(data.description)}
            </div>
          )}
        </div>
      </div>
      <Handle type="target" position={Position.Left} style={{ background: "#3fb950", border: "2px solid #252525", width: 12, height: 12 }} />
      <Handle type="source" position={Position.Right} style={{ background: accentHex, border: "2px solid #252525", width: 12, height: 12 }} />
    </NodeWrapper>
  );
}

export const EmbedNode = memo(EmbedNodeComponent);
