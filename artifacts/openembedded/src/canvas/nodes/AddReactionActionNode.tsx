// @ts-nocheck
import { memo } from "react";
import { Handle, Position, NodeProps } from "@xyflow/react";
import { NodeWrapper } from "./NodeWrapper.js";
import { SmilePlus } from "lucide-react";

function AddReactionActionNodeComponent({ id, data }: NodeProps) {
  const emoji = (data.emoji as string) ?? "";
  const messageIdMode = (data.messageIdMode as string) ?? "from_trigger";

  return (
    <NodeWrapper id={id} typeName="Add Reaction" icon={<SmilePlus size={14} />} accentColor="#fbbf24" nodeClass="relay">
      <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
          {emoji ? (
            <span style={{ fontSize: 20, lineHeight: 1 }}>{emoji}</span>
          ) : (
            <div style={{ width: 24, height: 24, borderRadius: 6, background: "rgba(251,191,36,0.1)", border: "1.5px dashed rgba(251,191,36,0.3)", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <SmilePlus size={12} color="#fbbf24" />
            </div>
          )}
          <div>
            <span style={{ background: "rgba(251,191,36,0.15)", color: "#fde68a", fontSize: 8, fontWeight: 700, padding: "1px 5px", borderRadius: 3, textTransform: "uppercase", letterSpacing: "0.06em" }}>
              ACTION
            </span>
          </div>
        </div>
        <div style={{ color: "#505050", fontSize: 9 }}>
          On: {messageIdMode === "from_trigger" ? "trigger message" : "specific message"}
        </div>
      </div>
      <Handle type="target" position={Position.Left} style={{ background: "#fbbf24", border: "2px solid #1a1a1a", width: 10, height: 10 }} />
      <Handle type="source" position={Position.Right} style={{ background: "#fbbf24", border: "2px solid #1a1a1a", width: 10, height: 10 }} />
    </NodeWrapper>
  );
}

export const AddReactionActionNode = memo(AddReactionActionNodeComponent);
