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
    <NodeWrapper id={id} typeName="Text Input · 4" icon={<TextCursorInput size={13} />} accentColor="#64748b">
      <div style={{ color: "#e8e8e8", fontSize: 12, fontWeight: 600, marginBottom: 4 }}>
        {label}
        {required && <span style={{ color: "#f85149", marginLeft: 3 }}>*</span>}
      </div>
      <div
        style={{
          background: "rgba(255,255,255,0.04)",
          border: "1px solid #333333",
          borderRadius: 4,
          padding: "4px 8px",
          minHeight: style === "Paragraph" ? 40 : 22,
          maxWidth: 200,
          fontSize: 11,
          color: placeholder ? "#888888" : "transparent",
        }}
      >
        {placeholder || " "}
      </div>
      <div style={{ color: "#555555", fontSize: 10, marginTop: 4 }}>
        {style} · Type 4
      </div>
      <Handle type="target" position={Position.Left} style={{ background: "#3fb950", border: "2px solid #242424", width: 10, height: 10 }} />
      <Handle type="source" position={Position.Right} style={{ background: "#64748b", border: "2px solid #242424", width: 10, height: 10 }} />
    </NodeWrapper>
  );
}

export const TextInputNode = memo(TextInputNodeComponent);
