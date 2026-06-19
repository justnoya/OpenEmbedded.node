import { memo } from "react";
import { Handle, Position, NodeProps } from "@xyflow/react";
import { NodeWrapper } from "./NodeWrapper";

function EmbedNodeComponent({ id, data }: NodeProps) {
  const title = (data.title as string) ?? "";
  const color = data.color as number | undefined;
  const accentHex = color != null ? `#${color.toString(16).padStart(6, "0")}` : "#5865F2";
  return (
    <NodeWrapper id={id} typeBadge="Embed (legacy)" badgeColor="#2e2a14">
      <div style={{ display: "flex", alignItems: "stretch", gap: 8 }}>
        <div style={{ width: 3, borderRadius: 2, background: accentHex, flexShrink: 0 }} />
        <div>
          <div style={{ color: "#F2F3F5", fontSize: 13, fontWeight: 600 }}>{title || "Embed"}</div>
          {data.description != null && (
            <div style={{ color: "#B5BAC1", fontSize: 11, marginTop: 2, maxWidth: 180, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              {String(data.description)}
            </div>
          )}
        </div>
      </div>
      <Handle type="target" position={Position.Left} style={{ background: "#57F287" }} />
      <Handle type="source" position={Position.Right} style={{ background: "#5865F2" }} />
    </NodeWrapper>
  );
}

export const EmbedNode = memo(EmbedNodeComponent);
