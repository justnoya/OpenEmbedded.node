// @ts-nocheck
import { memo } from "react";
import { Handle, Position, NodeProps } from "@xyflow/react";
import { NodeWrapper } from "./NodeWrapper.js";
import { Layers } from "lucide-react";

function SectionNodeComponent({ id }: NodeProps) {
  return (
    <NodeWrapper id={id} typeName="Section · 9" icon={<Layers size={14} />} accentColor="#10b981" nodeClass="main">
      <div style={{ color: "#505050", fontSize: 11 }}>
        Text + thumbnail accessory
      </div>
      <Handle type="target" position={Position.Left} style={{ background: "#3fb950", border: "2px solid #1a1a1a", width: 10, height: 10 }} />
      <Handle type="source" position={Position.Right} style={{ background: "#10b981", border: "2px solid #1a1a1a", width: 10, height: 10 }} />
    </NodeWrapper>
  );
}

export const SectionNode = memo(SectionNodeComponent);
