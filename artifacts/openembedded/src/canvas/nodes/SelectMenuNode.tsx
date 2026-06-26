import { memo } from "react";
import { Handle, Position, NodeProps } from "@xyflow/react";
import { NodeWrapper } from "./NodeWrapper.js";
import { ChevronDown } from "lucide-react";

function SelectMenuNodeComponent({ id, data }: NodeProps) {
  const placeholder = (data.placeholder as string) || "Make a selection…";
  const options = (data.options as { label: string; value: string }[]) ?? [];

  return (
    <NodeWrapper id={id} typeName="String Select · 3" icon={<ChevronDown size={18} />} accentColor="#f97316" nodeClass="interactive" showInteractionHandle>
      <div
        style={{
          display: "flex", alignItems: "center", justifyContent: "space-between",
          background: "rgba(255,255,255,0.05)",
          border: "1px solid rgba(255,255,255,0.08)",
          borderRadius: 5, padding: "5px 9px", gap: 8,
          minWidth: 160, maxWidth: 200,
        }}
      >
        <span style={{ color: "#606060", fontSize: 12, flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
          {placeholder}
        </span>
        <ChevronDown size={12} color="#505050" style={{ flexShrink: 0 }} />
      </div>
      <div style={{ color: "#404040", fontSize: 10, marginTop: 5 }}>
        {options.length} option{options.length !== 1 ? "s" : ""}
      </div>
      <Handle type="target" position={Position.Left} style={{ background: "#3fb950", border: "2px solid #252525", width: 12, height: 12 }} />
      <Handle type="source" position={Position.Right} style={{ background: "#f59e0b", border: "2px solid #252525", width: 12, height: 12 }} />
    </NodeWrapper>
  );
}

export const SelectMenuNode = memo(SelectMenuNodeComponent);
