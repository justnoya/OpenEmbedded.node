import { memo } from "react";
import { Handle, Position, NodeProps } from "@xyflow/react";
import { NodeWrapper } from "./NodeWrapper";
import { AlignJustify } from "lucide-react";

function ActionRowNodeComponent({ id }: NodeProps) {
  return (
    <NodeWrapper id={id} typeName="Action Row · 1" icon={<AlignJustify size={13} />} accentColor="#14b8a6" nodeClass="main">
      <div style={{ color: "#DDE3F5", fontSize: 13, fontWeight: 600, marginBottom: 3 }}>
        Action Row
      </div>
      <div style={{ color: "#5C6882", fontSize: 11 }}>
        Buttons &amp; select menus
      </div>
      <Handle type="target" position={Position.Left} style={{ background: "#3fb950", border: "2px solid #0F1420", width: 10, height: 10 }} />
      <Handle type="source" position={Position.Right} style={{ background: "#14b8a6", border: "2px solid #0F1420", width: 10, height: 10 }} />
    </NodeWrapper>
  );
}

export const ActionRowNode = memo(ActionRowNodeComponent);
