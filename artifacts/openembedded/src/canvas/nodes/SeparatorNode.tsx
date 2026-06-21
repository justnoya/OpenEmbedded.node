import { memo } from "react";
import { Handle, Position, NodeProps } from "@xyflow/react";
import { NodeWrapper } from "./NodeWrapper";
import { SeparatorHorizontal } from "lucide-react";

function SeparatorNodeComponent({ id, data }: NodeProps) {
  const spacing = (data.spacing as string) ?? "md";
  const divider = (data.divider as boolean) ?? false;
  return (
    <NodeWrapper id={id} typeName="Separator · 14" icon={<SeparatorHorizontal size={13} />} accentColor="#6b7280">
      <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <span style={{ color: "#999999", fontSize: 11, fontWeight: 500 }}>
            Spacing:
          </span>
          <span
            style={{
              background: "rgba(107,114,128,0.12)",
              color: "#999999",
              fontSize: 11,
              fontWeight: 600,
              padding: "1px 6px",
              borderRadius: 4,
              textTransform: "uppercase",
              letterSpacing: "0.04em",
            }}
          >
            {spacing}
          </span>
        </div>
        {divider && (
          <div style={{ borderTop: "1px solid #333333", margin: "2px 0" }} />
        )}
        {!divider && (
          <div style={{ color: "#555555", fontSize: 11 }}>No divider line</div>
        )}
      </div>
      <Handle type="target" position={Position.Left} style={{ background: "#3fb950", border: "2px solid #1b1b1b", width: 10, height: 10 }} />
      <Handle type="source" position={Position.Right} style={{ background: "#6b7280", border: "2px solid #1b1b1b", width: 10, height: 10 }} />
    </NodeWrapper>
  );
}

export const SeparatorNode = memo(SeparatorNodeComponent);
