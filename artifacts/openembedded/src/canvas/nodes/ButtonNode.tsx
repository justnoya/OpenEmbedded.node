// @ts-nocheck
import { memo } from "react";
import { Handle, Position, NodeProps } from "@xyflow/react";
import { NodeWrapper } from "./NodeWrapper.js";
import { MousePointerClick } from "lucide-react";

const STYLE_MAP: Record<string, { bg: string; color: string; label: string; border?: string }> = {
  Primary:   { bg: "#5865F2", color: "#fff", label: "Primary" },
  Secondary: { bg: "#2b2d31", color: "#dbdee1", label: "Secondary", border: "1px solid rgba(255,255,255,0.1)" },
  Success:   { bg: "#248046", color: "#fff", label: "Success" },
  Danger:    { bg: "#da373c", color: "#fff", label: "Danger" },
  Link:      { bg: "transparent", color: "#00a8fc", label: "Link ↗", border: "1px solid rgba(0,168,252,0.3)" },
  Premium:   { bg: "#f47fff", color: "#fff", label: "Premium" },
};

function ButtonNodeComponent({ id, data }: NodeProps) {
  const label = (data.label as string) ?? "Button";
  const style = (data.style as string) ?? "Primary";
  const s = STYLE_MAP[style] ?? STYLE_MAP.Primary;

  return (
    <NodeWrapper id={id} typeName="Button · 2" icon={<MousePointerClick size={18} />} accentColor="#5865F2" nodeClass="interactive" showInteractionHandle>
      <div
        style={{
          display: "inline-flex", alignItems: "center",
          background: s.bg, color: s.color,
          fontSize: 12, fontWeight: 500,
          padding: "4px 12px", borderRadius: 3,
          border: s.border ?? "none",
          maxWidth: 180, overflow: "hidden",
        }}
      >
        <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
          {label}
        </span>
      </div>
      <div style={{ color: "#404040", fontSize: 10, marginTop: 5, textTransform: "uppercase", letterSpacing: "0.06em" }}>
        {s.label} style
      </div>
      <Handle type="target" position={Position.Left} style={{ background: "#248046", border: "2px solid #252525", width: 12, height: 12 }} />
      <Handle type="source" position={Position.Right} style={{ background: "#f59e0b", border: "2px solid #252525", width: 12, height: 12 }} />
    </NodeWrapper>
  );
}

export const ButtonNode = memo(ButtonNodeComponent);
