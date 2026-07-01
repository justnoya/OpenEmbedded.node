// @ts-nocheck
import { memo } from "react";
import { Handle, Position, NodeProps } from "@xyflow/react";
import { NodeWrapper } from "./NodeWrapper.js";
import { PencilLine } from "lucide-react";

function EditMessageActionNodeComponent({ id, data }: NodeProps) {
  const messageIdMode = (data.messageIdMode as string) ?? "from_trigger"; // from_trigger | specific | from_variable
  const messageId = (data.messageId as string) ?? "";
  const content = (data.content as string) ?? "";

  return (
    <NodeWrapper id={id} typeName="Edit Message" icon={<PencilLine size={14} />} accentColor="#64748b" nodeClass="relay">
      <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
          <span style={{ background: "rgba(100,116,139,0.15)", color: "#94a3b8", fontSize: 8, fontWeight: 700, padding: "1px 5px", borderRadius: 3, textTransform: "uppercase", letterSpacing: "0.06em" }}>
            ACTION
          </span>
          <span style={{ color: "#505050", fontSize: 9 }}>
            {messageIdMode === "from_trigger" ? "Trigger message" : messageId ? `ID: ${messageId.slice(0, 10)}…` : "No message ID"}
          </span>
        </div>
        {content ? (
          <div style={{ color: "#c0c0c0", fontSize: 11, maxWidth: 185, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            {content}
          </div>
        ) : (
          <div style={{ color: "#404040", fontSize: 11, fontStyle: "italic" }}>New content not set</div>
        )}
      </div>
      <Handle type="target" position={Position.Left} style={{ background: "#64748b", border: "2px solid #1a1a1a", width: 10, height: 10 }} />
      <Handle type="source" position={Position.Right} style={{ background: "#64748b", border: "2px solid #1a1a1a", width: 10, height: 10 }} />
    </NodeWrapper>
  );
}

export const EditMessageActionNode = memo(EditMessageActionNodeComponent);
