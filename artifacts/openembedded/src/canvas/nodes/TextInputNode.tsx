import { memo } from "react";
import { Handle, Position, NodeProps } from "@xyflow/react";
import { NodeWrapper } from "./NodeWrapper";
import { TextCursorInput } from "lucide-react";

function TextInputNodeComponent({ id, data }: NodeProps) {
  const label = (data.label as string) || "Text Input";
  const style = (data.style as string) || "Short";
  const placeholder = (data.placeholder as string) || "";
  const required = data.required as boolean | undefined;

  return (
    <NodeWrapper id={id} typeName="Text Input · 4" icon={<TextCursorInput size={18} />} accentColor="#64748b">
      <div style={{ color: "#c0c0c0", fontSize: 12, fontWeight: 600, marginBottom: 5 }}>
        {label}
        {required && <span style={{ color: "#f85149", marginLeft: 3 }}>*</span>}
      </div>
      <div
        style={{
          background: "rgba(255,255,255,0.03)",
          border: "1px solid rgba(255,255,255,0.06)",
          borderRadius: 5, padding: "4px 8px",
          minHeight: style === "Paragraph" ? 40 : 22,
          maxWidth: 200, fontSize: 11,
          color: placeholder ? "#606060" : "transparent",
        }}
      >
        {placeholder || " "}
      </div>
      <div style={{ color: "#404040", fontSize: 10, marginTop: 4 }}>{style}</div>
      <Handle type="target" position={Position.Left} style={{ background: "#3fb950", border: "2px solid #252525", width: 12, height: 12 }} />
      <Handle type="source" position={Position.Right} style={{ background: "#64748b", border: "2px solid #252525", width: 12, height: 12 }} />
    </NodeWrapper>
  );
}

export const TextInputNode = memo(TextInputNodeComponent);
