// @ts-nocheck
import { memo } from "react";
import { Handle, Position, NodeProps } from "@xyflow/react";
import { NodeWrapper } from "./NodeWrapper.js";
import { Circle } from "lucide-react";

function RadioButtonNodeComponent({ id, data }: NodeProps) {
  const label = (data.label as string) || "Option";
  const value = (data.value as string) || "";
  const defaultSelected = !!(data.defaultSelected as boolean);

  return (
    <NodeWrapper id={id} typeName="Radio Button" icon={<Circle size={14} />} accentColor="#8b5cf6" nodeClass="sub">
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <div style={{
          width: 14, height: 14, borderRadius: "50%", flexShrink: 0,
          border: `2px solid ${defaultSelected ? "#8b5cf6" : "rgba(255,255,255,0.2)"}`,
          display: "flex", alignItems: "center", justifyContent: "center",
        }}>
          {defaultSelected && <div style={{ width: 6, height: 6, borderRadius: "50%", background: "#8b5cf6" }} />}
        </div>
        <div style={{ minWidth: 0 }}>
          <div style={{ color: "#d4d4d4", fontSize: 11, fontWeight: 500, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: 155 }}>
            {label}
          </div>
          {value && (
            <div style={{ color: "#505050", fontSize: 9, fontFamily: "monospace", marginTop: 1 }}>
              value: {value}
            </div>
          )}
        </div>
      </div>
      <Handle type="target" position={Position.Left} style={{ background: "#3fb950", border: "2px solid #1a1a1a", width: 10, height: 10 }} />
    </NodeWrapper>
  );
}

export const RadioButtonNode = memo(RadioButtonNodeComponent);
