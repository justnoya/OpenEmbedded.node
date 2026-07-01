// @ts-nocheck
import { memo } from "react";
import { Handle, Position, NodeProps } from "@xyflow/react";
import { NodeWrapper } from "./NodeWrapper.js";
import { Trash2 } from "lucide-react";

function DeleteMessageActionNodeComponent({ id, data }: NodeProps) {
  const messageIdMode = (data.messageIdMode as string) ?? "from_trigger";
  const messageId = (data.messageId as string) ?? "";
  const delaySeconds = (data.delaySeconds as number) ?? 0;

  return (
    <NodeWrapper id={id} typeName="Delete Message" icon={<Trash2 size={14} />} accentColor="#ef4444" nodeClass="relay">
      <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
          <span style={{ background: "rgba(239,68,68,0.15)", color: "#fca5a5", fontSize: 8, fontWeight: 700, padding: "1px 5px", borderRadius: 3, textTransform: "uppercase", letterSpacing: "0.06em" }}>
            ACTION
          </span>
          <span style={{ color: "#505050", fontSize: 9 }}>
            {messageIdMode === "from_trigger" ? "Trigger message" : messageId ? `ID: ${messageId.slice(0, 10)}` : "No message set"}
          </span>
        </div>
        {delaySeconds > 0 && (
          <div style={{ color: "#505050", fontSize: 9 }}>
            After {delaySeconds}s delay
          </div>
        )}
      </div>
      <Handle type="target" position={Position.Left} style={{ background: "#ef4444", border: "2px solid #1a1a1a", width: 10, height: 10 }} />
      <Handle type="source" position={Position.Right} style={{ background: "#ef4444", border: "2px solid #1a1a1a", width: 10, height: 10 }} />
    </NodeWrapper>
  );
}

export const DeleteMessageActionNode = memo(DeleteMessageActionNodeComponent);
