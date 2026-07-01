// @ts-nocheck
import { memo } from "react";
import { Handle, Position, NodeProps } from "@xyflow/react";
import { NodeWrapper } from "./NodeWrapper.js";
import { ShieldAlert } from "lucide-react";

const MODE_META: Record<string, { label: string; color: string }> = {
  kick:    { label: "Kick Member",    color: "#f59e0b" },
  ban:     { label: "Ban Member",     color: "#ef4444" },
  unban:   { label: "Unban Member",   color: "#22c55e" },
  timeout: { label: "Timeout Member", color: "#f97316" },
};

function ModerateActionNodeComponent({ id, data }: NodeProps) {
  const mode = (data.mode as string) ?? "kick";
  const reason = (data.reason as string) ?? "";
  const timeoutDuration = (data.timeoutDuration as number) ?? 300;
  const meta = MODE_META[mode] ?? MODE_META.kick;

  return (
    <NodeWrapper id={id} typeName={meta.label} icon={<ShieldAlert size={14} />} accentColor={meta.color} nodeClass="relay">
      <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
          <span style={{ background: `${meta.color}22`, color: meta.color, fontSize: 8, fontWeight: 700, padding: "1px 5px", borderRadius: 3, textTransform: "uppercase", letterSpacing: "0.06em" }}>
            ACTION
          </span>
          {mode === "timeout" && (
            <span style={{ color: "#505050", fontSize: 9 }}>{timeoutDuration}s</span>
          )}
        </div>
        {reason ? (
          <div style={{ color: "#707070", fontSize: 10, maxWidth: 185, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            Reason: {reason}
          </div>
        ) : (
          <div style={{ color: "#404040", fontSize: 10, fontStyle: "italic" }}>No reason set</div>
        )}
      </div>
      <Handle type="target" position={Position.Left} style={{ background: meta.color, border: "2px solid #1a1a1a", width: 10, height: 10 }} />
      <Handle type="source" position={Position.Right} style={{ background: meta.color, border: "2px solid #1a1a1a", width: 10, height: 10 }} />
    </NodeWrapper>
  );
}

export const ModerateActionNode = memo(ModerateActionNodeComponent);
