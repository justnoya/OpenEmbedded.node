import { memo } from "react";
import { Handle, Position, NodeProps } from "@xyflow/react";
import { NodeWrapper } from "./NodeWrapper";

function ActionRowNodeComponent({ id }: NodeProps) {
  return (
    <NodeWrapper id={id} typeBadge="ActionRow · 1" badgeColor="#1a1a2e">
      <div style={{ color: "#F2F3F5", fontSize: 13, fontWeight: 600 }}>Action Row</div>
      <div style={{ color: "#B5BAC1", fontSize: 11, marginTop: 4 }}>buttons / select</div>
      <Handle type="target" position={Position.Left} style={{ background: "#57F287" }} />
      <Handle type="source" position={Position.Right} style={{ background: "#5865F2" }} />
    </NodeWrapper>
  );
}

export const ActionRowNode = memo(ActionRowNodeComponent);
