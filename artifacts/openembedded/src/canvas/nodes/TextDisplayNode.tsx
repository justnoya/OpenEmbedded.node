// @ts-nocheck
import { memo } from "react";
import { Handle, Position, NodeProps } from "@xyflow/react";
import { NodeWrapper } from "./NodeWrapper.js";
import { Type } from "lucide-react";

function TextDisplayNodeComponent({ id, data }: NodeProps) {
  const content = (data.content as string) ?? "";
  return (
    <NodeWrapper id={id} typeName="Text Display" icon={<Type size={14} />} accentColor="#3b82f6">
      <div
        style={{
          color: "#c0c0c0", fontSize: 12, lineHeight: 1.55,
          maxWidth: 220, overflow: "hidden",
          display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical",
          wordBreak: "break-word",
        }}
      >
        {content || <span style={{ color: "#404040", fontStyle: "italic" }}>Empty text…</span>}
      </div>
      <Handle type="target" position={Position.Left} style={{ background: "#3fb950", border: "2px solid #1a1a1a", width: 10, height: 10 }} />
      <Handle type="source" position={Position.Right} style={{ background: "#3b82f6", border: "2px solid #1a1a1a", width: 10, height: 10 }} />
    </NodeWrapper>
  );
}

export const TextDisplayNode = memo(TextDisplayNodeComponent);
