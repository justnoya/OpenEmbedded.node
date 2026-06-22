import { memo } from "react";
import { Handle, Position, NodeProps } from "@xyflow/react";
import { NodeWrapper } from "./NodeWrapper";
import { Box } from "lucide-react";

function ContainerNodeComponent({ id, data }: NodeProps) {
  const accentHex =
    data.accent_color != null
      ? `#${(data.accent_color as number).toString(16).padStart(6, "0")}`
      : null;
  return (
    <NodeWrapper id={id} typeName="Container · 17" icon={<Box size={18} />} accentColor="#8b5cf6" nodeClass="main">
      <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
        {accentHex && (
          <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
            <div
              style={{
                width: 10, height: 10, borderRadius: 3,
                background: accentHex,
                border: "1px solid rgba(255,255,255,0.12)",
                flexShrink: 0,
              }}
            />
            <span style={{ color: "#666666", fontSize: 11, fontFamily: "monospace" }}>{accentHex}</span>
          </div>
        )}
        {!!data.spoiler && (
          <span style={{ background: "rgba(254,231,92,0.1)", color: "#d29922", fontSize: 10, fontWeight: 600, padding: "1px 6px", borderRadius: 4, letterSpacing: "0.04em" }}>
            SPOILER
          </span>
        )}
        {!accentHex && !data.spoiler && (
          <span style={{ color: "#404040", fontSize: 11 }}>Root wrapper</span>
        )}
      </div>
      <Handle type="target" position={Position.Left} style={{ background: "#3fb950", border: "2px solid #252525", width: 12, height: 12 }} />
      <Handle type="source" position={Position.Right} style={{ background: "#8b5cf6", border: "2px solid #252525", width: 12, height: 12 }} />
    </NodeWrapper>
  );
}

export const ContainerNode = memo(ContainerNodeComponent);
