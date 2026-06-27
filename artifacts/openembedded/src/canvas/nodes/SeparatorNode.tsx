// @ts-nocheck
import { memo } from "react";
import { Handle, Position, NodeProps } from "@xyflow/react";
import { NodeWrapper } from "./NodeWrapper.js";
import { SeparatorHorizontal } from "lucide-react";

function SeparatorNodeComponent({ id, data }: NodeProps) {
  const spacing = (data.spacing as string) ?? "md";
  const divider = (data.divider as boolean) ?? false;
  return (
    <NodeWrapper id={id} typeName="Separator · 14" icon={<SeparatorHorizontal size={14} />} accentColor="#6b7280">
      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
        <span style={{ color: "#505050", fontSize: 11 }}>Spacing:</span>
        <span style={{ background: "rgba(107,114,128,0.12)", color: "#888888", fontSize: 11, fontWeight: 600, padding: "1px 6px", borderRadius: 4, textTransform: "uppercase", letterSpacing: "0.04em" }}>
          {spacing}
        </span>
        {divider && <span style={{ color: "#505050", fontSize: 11 }}>+ line</span>}
      </div>
      <Handle type="target" position={Position.Left} style={{ background: "#3fb950", border: "2px solid #1a1a1a", width: 10, height: 10 }} />
      <Handle type="source" position={Position.Right} style={{ background: "#6b7280", border: "2px solid #1a1a1a", width: 10, height: 10 }} />
    </NodeWrapper>
  );
}

export const SeparatorNode = memo(SeparatorNodeComponent);
