// @ts-nocheck
import { memo } from "react";
import { Handle, Position, NodeProps } from "@xyflow/react";
import { NodeWrapper } from "./NodeWrapper.js";
import { Circle } from "lucide-react";

function RadioGroupNodeComponent({ id, data }: NodeProps) {
  const label = (data.label as string) || "";
  const required = !!(data.required as boolean);

  return (
    <NodeWrapper id={id} typeName="Radio Group" icon={<Circle size={14} />} accentColor="#a855f7" nodeClass="main">
      <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
        {label ? (
          <div style={{ color: "#d8b4fe", fontSize: 11, fontWeight: 600, maxWidth: 185, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            {label}
          </div>
        ) : (
          <div style={{ color: "#404040", fontSize: 11, fontStyle: "italic" }}>Radio group</div>
        )}
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <div style={{ width: 5, height: 5, borderRadius: "50%", background: "#a855f7", flexShrink: 0 }} />
          <span style={{ color: "#505050", fontSize: 10 }}>Add Radio Button children</span>
          {required && <span style={{ color: "#ef4444", fontSize: 9, fontWeight: 700 }}>REQUIRED</span>}
        </div>
      </div>
      <Handle type="target" position={Position.Left} style={{ background: "#3fb950", border: "2px solid #1a1a1a", width: 10, height: 10 }} />
      <Handle type="source" position={Position.Right} style={{ background: "#a855f7", border: "2px solid #1a1a1a", width: 10, height: 10 }} />
    </NodeWrapper>
  );
}

export const RadioGroupNode = memo(RadioGroupNodeComponent);
