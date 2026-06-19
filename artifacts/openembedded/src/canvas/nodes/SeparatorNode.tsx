import { memo } from "react";
import { Handle, Position, NodeProps } from "@xyflow/react";
import { NodeWrapper } from "./NodeWrapper";

function SeparatorNodeComponent({ id, data }: NodeProps) {
  const spacing = (data.spacing as string) ?? "md";
  const divider = (data.divider as boolean) ?? false;
  return (
    <NodeWrapper id={id} typeBadge="Separator · 14" badgeColor="#2a2a2a">
      <div style={{ color: "#F2F3F5", fontSize: 13, fontWeight: 600, marginBottom: 4 }}>Separator</div>
      <div style={{ color: "#B5BAC1", fontSize: 11 }}>
        spacing: {spacing}{divider ? " · divider" : ""}
      </div>
      {divider && (
        <div style={{ borderTop: "1px solid rgba(255,255,255,0.15)", marginTop: 8 }} />
      )}
      <Handle type="target" position={Position.Left} style={{ background: "#57F287" }} />
      <Handle type="source" position={Position.Right} style={{ background: "#5865F2" }} />
    </NodeWrapper>
  );
}

export const SeparatorNode = memo(SeparatorNodeComponent);
