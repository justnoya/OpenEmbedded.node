// @ts-nocheck
import { memo } from "react";
import { Handle, Position, NodeProps } from "@xyflow/react";
import { NodeWrapper } from "./NodeWrapper.js";
import { MousePointerClick } from "lucide-react";

const TRIGGER_TYPE_META: Record<string, { label: string; color: string }> = {
  button:       { label: "Button Click",     color: "#5865F2" },
  selectMenu:   { label: "Select Choice",    color: "#f97316" },
  modalSubmit:  { label: "Modal Submit",     color: "#3b82f6" },
  autocomplete: { label: "Autocomplete",     color: "#10b981" },
};

function InteractionTriggerNodeComponent({ id, data }: NodeProps) {
  const triggerType = (data.triggerType as string) ?? "button";
  const customId = (data.custom_id as string) ?? "";
  const meta = TRIGGER_TYPE_META[triggerType] ?? TRIGGER_TYPE_META.button;

  return (
    <NodeWrapper id={id} typeName="Interaction Trigger" icon={<MousePointerClick size={14} />} accentColor="#f59e0b" nodeClass="root" showSendHandle>
      <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <div style={{ width: 8, height: 8, borderRadius: 2, background: meta.color, flexShrink: 0 }} />
          <span style={{ color: "#e0e0e0", fontSize: 12, fontWeight: 600 }}>{meta.label}</span>
        </div>
        {customId && (
          <div style={{ color: "#505050", fontSize: 9, fontFamily: "monospace", background: "rgba(255,255,255,0.03)", padding: "2px 6px", borderRadius: 3, border: "1px solid rgba(255,255,255,0.06)" }}>
            id: {customId}
          </div>
        )}
        <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
          <span style={{ background: "rgba(245,158,11,0.15)", color: "#fbbf24", fontSize: 8, fontWeight: 700, padding: "1px 5px", borderRadius: 3, textTransform: "uppercase", letterSpacing: "0.06em" }}>
            TRIGGER
          </span>
        </div>
      </div>
      <Handle type="source" position={Position.Right} style={{ background: "#f59e0b", border: "2px solid #1a1a1a", width: 10, height: 10 }} />
    </NodeWrapper>
  );
}

export const InteractionTriggerNode = memo(InteractionTriggerNodeComponent);
