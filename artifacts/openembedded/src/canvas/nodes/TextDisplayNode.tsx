import { memo } from "react";
import { Handle, Position, NodeProps } from "@xyflow/react";
import { NodeWrapper } from "./NodeWrapper";

function TextDisplayNodeComponent({ id, data }: NodeProps) {
  const content = (data.content as string) ?? "";
  return (
    <NodeWrapper id={id} typeBadge="TextDisplay · 10" badgeColor="#2d2d2d">
      <div style={{ color: "#F2F3F5", fontSize: 13, fontWeight: 600, marginBottom: 4 }}>
        Text Display
      </div>
      <div
        style={{
          color: "#B5BAC1",
          fontSize: 12,
          maxWidth: 200,
          overflow: "hidden",
          textOverflow: "ellipsis",
          whiteSpace: "nowrap",
        }}
      >
        {content || <em style={{ color: "#949B9D" }}>empty</em>}
      </div>
      <Handle type="target" position={Position.Left} style={{ background: "#57F287" }} />
      <Handle type="source" position={Position.Right} style={{ background: "#5865F2" }} />
    </NodeWrapper>
  );
}

export const TextDisplayNode = memo(TextDisplayNodeComponent);
