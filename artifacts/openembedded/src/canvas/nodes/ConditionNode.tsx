// @ts-nocheck
import { memo } from "react";
import { Handle, Position, NodeProps } from "@xyflow/react";
import { NodeWrapper } from "./NodeWrapper.js";
import { GitBranch } from "lucide-react";

const CONDITION_TYPE_LABELS: Record<string, string> = {
  hasRole:          "User has role",
  notHasRole:       "User lacks role",
  messageContains:  "Message contains",
  messageStartsWith:"Message starts with",
  messageMatchesRegex: "Message matches regex",
  isBot:            "Sender is bot",
  isNotBot:         "Sender is not bot",
  channelIs:        "Channel is",
  userIs:           "User is",
  memberJoinedBefore: "Member joined before",
  custom:           "Custom expression",
};

function ConditionNodeComponent({ id, data }: NodeProps) {
  const conditionType = (data.conditionType as string) ?? "hasRole";
  const value = (data.value as string) ?? "";
  const label = CONDITION_TYPE_LABELS[conditionType] ?? conditionType;

  return (
    <NodeWrapper id={id} typeName="Condition" icon={<GitBranch size={14} />} accentColor="#f59e0b" nodeClass="relay">
      <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
          <span style={{ background: "rgba(245,158,11,0.15)", color: "#fbbf24", fontSize: 8, fontWeight: 700, padding: "1px 5px", borderRadius: 3, textTransform: "uppercase", letterSpacing: "0.06em" }}>
            LOGIC
          </span>
          <span style={{ color: "#d4d4d4", fontSize: 10, fontWeight: 600 }}>{label}</span>
        </div>
        {value && (
          <div style={{ color: "#808080", fontSize: 10, fontFamily: "monospace", background: "rgba(255,255,255,0.03)", padding: "2px 6px", borderRadius: 3, border: "1px solid rgba(255,255,255,0.05)", maxWidth: 185, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            {value}
          </div>
        )}
        <div style={{ display: "flex", gap: 8, marginTop: 2 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
            <div style={{ width: 8, height: 8, borderRadius: 2, background: "#22c55e", flexShrink: 0 }} />
            <span style={{ color: "#505050", fontSize: 9 }}>True →</span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
            <div style={{ width: 8, height: 8, borderRadius: 2, background: "#ef4444", flexShrink: 0 }} />
            <span style={{ color: "#505050", fontSize: 9 }}>False →</span>
          </div>
        </div>
      </div>
      {/* Incoming flow */}
      <Handle type="target" position={Position.Left} style={{ background: "#f59e0b", border: "2px solid #1a1a1a", width: 10, height: 10 }} />
      {/* True branch — top-right */}
      <Handle
        id="true"
        type="source"
        position={Position.Right}
        style={{ background: "#22c55e", border: "2px solid #1a1a1a", width: 10, height: 10, top: "35%" }}
      />
      {/* False branch — bottom-right */}
      <Handle
        id="false"
        type="source"
        position={Position.Right}
        style={{ background: "#ef4444", border: "2px solid #1a1a1a", width: 10, height: 10, top: "65%" }}
      />
    </NodeWrapper>
  );
}

export const ConditionNode = memo(ConditionNodeComponent);
