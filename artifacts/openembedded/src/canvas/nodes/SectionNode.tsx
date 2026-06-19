import { memo } from "react";
import { Handle, Position, NodeProps } from "@xyflow/react";
import { NodeWrapper } from "./NodeWrapper";

function SectionNodeComponent({ id }: NodeProps) {
  return (
    <NodeWrapper id={id} typeBadge="Section · 9" badgeColor="#1d3d3a">
      <div style={{ color: "#F2F3F5", fontSize: 13, fontWeight: 600 }}>Section</div>
      <div style={{ color: "#B5BAC1", fontSize: 11, marginTop: 4 }}>text[] + accessory</div>
      <Handle type="target" position={Position.Left} style={{ background: "#57F287" }} />
      <Handle type="source" position={Position.Right} style={{ background: "#5865F2" }} />
    </NodeWrapper>
  );
}

export const SectionNode = memo(SectionNodeComponent);
