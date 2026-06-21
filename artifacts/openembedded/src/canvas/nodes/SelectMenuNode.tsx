import { memo } from "react";
import { Handle, Position, NodeProps } from "@xyflow/react";
import { NodeWrapper } from "./NodeWrapper";
import { ChevronDown } from "lucide-react";

function SelectMenuNodeComponent({ id, data }: NodeProps) {
  const placeholder = (data.placeholder as string) || "Make a selection…";
  const options = (data.options as { label: string; value: string }[]) ?? [];

  return (
    <NodeWrapper id={id} typeName="String Select · 3" icon={<ChevronDown size={13} />} accentColor="#f97316">
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          background: "rgba(255,255,255,0.06)",
          border: "1px solid rgba(255,255,255,0.10)",
          borderRadius: 4,
          padding: "4px 8px",
          gap: 8,
          minWidth: 160,
          maxWidth: 200,
        }}
      >
        <span style={{ color: "#888888", fontSize: 12, flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
          {placeholder}
        </span>
        <ChevronDown size={12} color="#888888" style={{ flexShrink: 0 }} />
      </div>
      <div style={{ color: "#555555", fontSize: 10, marginTop: 4 }}>
        {options.length} option{options.length !== 1 ? "s" : ""}
      </div>
      <Handle type="target" position={Position.Left} style={{ background: "#3fb950", border: "2px solid #242424", width: 10, height: 10 }} />
      <Handle type="source" position={Position.Right} style={{ background: "#f97316", border: "2px solid #242424", width: 10, height: 10 }} />
    </NodeWrapper>
  );
}

export const SelectMenuNode = memo(SelectMenuNodeComponent);
