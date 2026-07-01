// @ts-nocheck
import { memo } from "react";
import { Handle, Position, NodeProps } from "@xyflow/react";
import { NodeWrapper } from "./NodeWrapper.js";
import { Pin } from "lucide-react";

function PinMessageActionNodeComponent({ id, data }: NodeProps) {
  const action = (data.action as string) ?? "pin"; // pin | unpin
  const messageIdMode = (data.messageIdMode as string) ?? "from_trigger";

  return (
    <NodeWrapper id={id} typeName={action === "unpin" ? "Unpin Message" : "Pin Message"} icon={<Pin size={14} />} accentColor="#fbbf24" nodeClass="relay">
      <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
          <span style={{ background: "rgba(251,191,36,0.15)", color: "#fde68a", fontSize: 8, fontWeight: 700, padding: "1px 5px", borderRadius: 3, textTransform: "uppercase", letterSpacing: "0.06em" }}>
            ACTION
          </span>
          <span style={{ color: "#505050", fontSize: 9 }}>
            {messageIdMode === "from_trigger" ? "trigger message" : "specific message"}
          </span>
        </div>
      </div>
      <Handle type="target" position={Position.Left} style={{ background: "#fbbf24", border: "2px solid #1a1a1a", width: 10, height: 10 }} />
      <Handle type="source" position={Position.Right} style={{ background: "#fbbf24", border: "2px solid #1a1a1a", width: 10, height: 10 }} />
    </NodeWrapper>
  );
}

export const PinMessageActionNode = memo(PinMessageActionNodeComponent);
