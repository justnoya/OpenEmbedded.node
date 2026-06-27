// @ts-nocheck
import { memo } from "react";
import { Handle, Position, NodeProps } from "@xyflow/react";
import { NodeWrapper } from "./NodeWrapper.js";
import { AlignJustify } from "lucide-react";

function ActionRowNodeComponent({ id }: NodeProps) {
  return (
    <NodeWrapper id={id} typeName="Action Row · 1" icon={<AlignJustify size={18} />} accentColor="#14b8a6" nodeClass="main">
      <div style={{ color: "#505050", fontSize: 11 }}>
        Buttons &amp; select menus
      </div>
      <Handle type="target" position={Position.Left} style={{ background: "#248046", border: "2px solid #252525", width: 12, height: 12 }} />
      <Handle type="source" position={Position.Right} style={{ background: "#14b8a6", border: "2px solid #252525", width: 12, height: 12 }} />
    </NodeWrapper>
  );
}

export const ActionRowNode = memo(ActionRowNodeComponent);
