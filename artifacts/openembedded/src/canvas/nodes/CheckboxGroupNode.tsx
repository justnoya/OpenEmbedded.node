// @ts-nocheck
import { memo } from "react";
import { Handle, Position, NodeProps } from "@xyflow/react";
import { NodeWrapper } from "./NodeWrapper.js";
import { CheckSquare } from "lucide-react";

function CheckboxGroupNodeComponent({ id, data }: NodeProps) {
  const label = (data.label as string) || "";
  const required = !!(data.required as boolean);

  return (
    <NodeWrapper id={id} typeName="Checkbox Group" icon={<CheckSquare size={14} />} accentColor="#06b6d4" nodeClass="main">
      <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
        {label ? (
          <div style={{ color: "#a0e5f0", fontSize: 11, fontWeight: 600, maxWidth: 185, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            {label}
          </div>
        ) : (
          <div style={{ color: "#404040", fontSize: 11, fontStyle: "italic" }}>Checkbox group</div>
        )}
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <div style={{ width: 5, height: 5, borderRadius: "50%", background: "#06b6d4", flexShrink: 0 }} />
          <span style={{ color: "#505050", fontSize: 10 }}>Add Checkbox children</span>
          {required && <span style={{ color: "#ef4444", fontSize: 9, fontWeight: 700 }}>REQUIRED</span>}
        </div>
      </div>
      <Handle type="target" position={Position.Left} style={{ background: "#3fb950", border: "2px solid #1a1a1a", width: 10, height: 10 }} />
      <Handle type="source" position={Position.Right} style={{ background: "#06b6d4", border: "2px solid #1a1a1a", width: 10, height: 10 }} />
    </NodeWrapper>
  );
}

export const CheckboxGroupNode = memo(CheckboxGroupNodeComponent);
