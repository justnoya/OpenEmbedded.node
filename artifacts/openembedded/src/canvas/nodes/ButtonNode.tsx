import { memo } from "react";
import { Handle, Position, NodeProps } from "@xyflow/react";
import { NodeWrapper } from "./NodeWrapper";

const styleColors: Record<string, string> = {
  Primary: "#5865F2",
  Secondary: "#4E5058",
  Success: "#57F287",
  Danger: "#ED4245",
  Link: "transparent",
};

function ButtonNodeComponent({ id, data }: NodeProps) {
  const label = (data.label as string) ?? "Button";
  const style = (data.style as string) ?? "Primary";
  return (
    <NodeWrapper id={id} typeBadge="Button · 2" badgeColor="#1d1d3e">
      <div style={{ color: "#F2F3F5", fontSize: 13, fontWeight: 600, marginBottom: 6 }}>Button</div>
      <div
        style={{
          display: "inline-block",
          background: styleColors[style] ?? "#5865F2",
          color: "#fff",
          fontSize: 12,
          fontWeight: 500,
          padding: "3px 10px",
          borderRadius: 4,
          border: style === "Link" ? "1px solid rgba(255,255,255,0.2)" : "none",
        }}
      >
        {label}
      </div>
      <div style={{ color: "#949B9D", fontSize: 10, marginTop: 4 }}>{style}</div>
      <Handle type="target" position={Position.Left} style={{ background: "#57F287" }} />
      <Handle type="source" position={Position.Right} style={{ background: "#5865F2" }} />
    </NodeWrapper>
  );
}

export const ButtonNode = memo(ButtonNodeComponent);
