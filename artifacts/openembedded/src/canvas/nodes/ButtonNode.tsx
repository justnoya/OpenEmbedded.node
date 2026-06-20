import { memo } from "react";
import { Handle, Position, NodeProps } from "@xyflow/react";
import { NodeWrapper } from "./NodeWrapper";
import { MousePointerClick } from "lucide-react";

const STYLE_MAP: Record<string, { bg: string; color: string; label: string }> = {
  Primary:   { bg: "#5865F2", color: "#fff", label: "Primary" },
  Secondary: { bg: "#4e5058", color: "#fff", label: "Secondary" },
  Success:   { bg: "#3fb950", color: "#000", label: "Success" },
  Danger:    { bg: "#f85149", color: "#fff", label: "Danger" },
  Link:      { bg: "transparent", color: "#58a6ff", label: "Link" },
};

function ButtonNodeComponent({ id, data }: NodeProps) {
  const label = (data.label as string) ?? "Button";
  const style = (data.style as string) ?? "Primary";
  const s = STYLE_MAP[style] ?? STYLE_MAP.Primary;

  return (
    <NodeWrapper id={id} typeName="Button · 2" icon={<MousePointerClick size={13} />} accentColor="#5865F2">
      <div
        style={{
          display: "inline-flex",
          alignItems: "center",
          background: s.bg,
          color: s.color,
          fontSize: 12,
          fontWeight: 600,
          padding: "4px 12px",
          borderRadius: 4,
          border: style === "Link" ? "1px solid rgba(88,166,255,0.3)" : "none",
          gap: 5,
          maxWidth: 180,
          overflow: "hidden",
        }}
      >
        <span
          style={{
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}
        >
          {label}
        </span>
      </div>
      <div style={{ color: "#484f58", fontSize: 10, marginTop: 4, textTransform: "uppercase", letterSpacing: "0.05em" }}>
        {s.label}
      </div>
      <Handle type="target" position={Position.Left} style={{ background: "#3fb950", border: "2px solid #141822", width: 10, height: 10 }} />
      <Handle type="source" position={Position.Right} style={{ background: "#5865F2", border: "2px solid #141822", width: 10, height: 10 }} />
    </NodeWrapper>
  );
}

export const ButtonNode = memo(ButtonNodeComponent);
