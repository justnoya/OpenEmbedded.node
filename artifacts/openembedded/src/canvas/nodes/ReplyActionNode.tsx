// @ts-nocheck
import { memo } from "react";
import { Handle, Position, NodeProps } from "@xyflow/react";
import { NodeWrapper } from "./NodeWrapper.js";
import { Reply } from "lucide-react";

const REPLY_MODE_META: Record<string, { label: string; color: string }> = {
  reply:         { label: "Reply",           color: "#3b82f6" },
  ephemeral:     { label: "Ephemeral Reply", color: "#8b5cf6" },
  followup:      { label: "Followup",        color: "#10b981" },
  defer:         { label: "Defer",           color: "#6b7280" },
  defer_ephemeral: { label: "Defer (hidden)",color: "#a855f7" },
  update:        { label: "Update Message",  color: "#f59e0b" },
};

function ReplyActionNodeComponent({ id, data }: NodeProps) {
  const mode = (data.mode as string) ?? "reply";
  const content = (data.content as string) ?? "";
  const meta = REPLY_MODE_META[mode] ?? REPLY_MODE_META.reply;

  return (
    <NodeWrapper id={id} typeName="Reply to Interaction" icon={<Reply size={14} />} accentColor={meta.color} nodeClass="relay">
      <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
          <div style={{ width: 8, height: 8, borderRadius: "50%", background: meta.color, flexShrink: 0 }} />
          <span style={{ color: "#d4d4d4", fontSize: 11, fontWeight: 600 }}>{meta.label}</span>
        </div>
        {content ? (
          <div style={{ color: "#b0b0b0", fontSize: 10, maxWidth: 185, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            {content}
          </div>
        ) : mode !== "defer" && mode !== "defer_ephemeral" ? (
          <div style={{ color: "#404040", fontSize: 10, fontStyle: "italic" }}>No content — use embedded payload</div>
        ) : null}
        <span style={{ background: `${meta.color}22`, color: meta.color, fontSize: 8, fontWeight: 700, padding: "1px 5px", borderRadius: 3, textTransform: "uppercase", letterSpacing: "0.06em", alignSelf: "flex-start" }}>
          ACTION
        </span>
      </div>
      <Handle type="target" position={Position.Left} style={{ background: meta.color, border: "2px solid #1a1a1a", width: 10, height: 10 }} />
      <Handle type="source" position={Position.Right} style={{ background: meta.color, border: "2px solid #1a1a1a", width: 10, height: 10 }} />
    </NodeWrapper>
  );
}

export const ReplyActionNode = memo(ReplyActionNodeComponent);
