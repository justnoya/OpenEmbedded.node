// @ts-nocheck
import { memo } from "react";
import { Handle, Position, NodeProps } from "@xyflow/react";
import { NodeWrapper } from "./NodeWrapper.js";
import { Type } from "lucide-react";

function LabelNodeComponent({ id, data }: NodeProps) {
  const label = (data.label as string) || "Label text";

  return (
    <NodeWrapper id={id} typeName="Label" icon={<Type size={14} />} accentColor="#94a3b8" nodeClass="sub">
      <div style={{
        color: "#c0c0c0",
        fontSize: 12,
        fontWeight: 500,
        maxWidth: 185,
        overflow: "hidden",
        textOverflow: "ellipsis",
        whiteSpace: "nowrap",
      }}>
        {label}
      </div>
      <div style={{ color: "#404040", fontSize: 10, marginTop: 3 }}>Form label element</div>
      <Handle type="target" position={Position.Left} style={{ background: "#3fb950", border: "2px solid #1a1a1a", width: 10, height: 10 }} />
    </NodeWrapper>
  );
}

export const LabelNode = memo(LabelNodeComponent);
