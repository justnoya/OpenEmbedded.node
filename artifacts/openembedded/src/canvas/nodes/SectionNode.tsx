import { memo } from "react";
import { Handle, Position, NodeProps } from "@xyflow/react";
import { NodeWrapper } from "./NodeWrapper";
import { Layers } from "lucide-react";

function SectionNodeComponent({ id }: NodeProps) {
  return (
    <NodeWrapper id={id} typeName="Section · 9" icon={<Layers size={13} />} accentColor="#10b981" nodeClass="main">
      <div style={{ color: "#e6edf3", fontSize: 13, fontWeight: 600, marginBottom: 3 }}>
        Section
      </div>
      <div style={{ color: "#7d8590", fontSize: 11 }}>
        Text + thumbnail accessory
      </div>
      <Handle type="target" position={Position.Left} style={{ background: "#3fb950", border: "2px solid #141822", width: 10, height: 10 }} />
      <Handle type="source" position={Position.Right} style={{ background: "#10b981", border: "2px solid #141822", width: 10, height: 10 }} />
    </NodeWrapper>
  );
}

export const SectionNode = memo(SectionNodeComponent);
