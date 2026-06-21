import { memo } from "react";
import { Handle, Position, NodeProps } from "@xyflow/react";
import { NodeWrapper } from "./NodeWrapper";
import { Users, Shield, AtSign, Hash, ChevronDown } from "lucide-react";

const SELECT_META: Record<number, { label: string; typeName: string; icon: React.ReactNode; color: string }> = {
  5: { label: "User Select",        typeName: "User Select · 5",        icon: <Users size={13} />,  color: "#06b6d4" },
  6: { label: "Role Select",        typeName: "Role Select · 6",        icon: <Shield size={13} />, color: "#a855f7" },
  7: { label: "Mentionable Select", typeName: "Mentionable · 7",        icon: <AtSign size={13} />, color: "#ec4899" },
  8: { label: "Channel Select",     typeName: "Channel Select · 8",     icon: <Hash size={13} />,   color: "#22c55e" },
};

function AutoSelectNodeComponent({ id, data }: NodeProps) {
  const ct = data.componentType as number;
  const meta = SELECT_META[ct] ?? SELECT_META[5];
  const placeholder = (data.placeholder as string) || "Select…";

  return (
    <NodeWrapper
      id={id}
      typeName={meta.typeName}
      icon={meta.icon}
      accentColor={meta.color}
      nodeClass="interactive"
      showInteractionHandle
    >
      <div
        style={{
          display: "flex", alignItems: "center", justifyContent: "space-between",
          background: "rgba(255,255,255,0.06)",
          border: "1px solid rgba(255,255,255,0.10)",
          borderRadius: 4, padding: "4px 8px", gap: 8,
          minWidth: 160, maxWidth: 200,
        }}
      >
        <span style={{ color: "#888888", fontSize: 12, flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
          {placeholder}
        </span>
        <ChevronDown size={12} color="#888888" style={{ flexShrink: 0 }} />
      </div>
      <div style={{ color: "#555555", fontSize: 10, marginTop: 4 }}>{meta.label}</div>
      <div style={{ color: "#4a3a00", fontSize: 9, marginTop: 2 }}>
        Drag right handle → to set response
      </div>

      <Handle type="target" position={Position.Left} style={{ background: "#3fb950", border: "2px solid #1b1b1b", width: 10, height: 10 }} />
      <Handle type="source" position={Position.Right} style={{ background: "#f59e0b", border: "2px solid #1b1b1b", width: 10, height: 10 }} />
    </NodeWrapper>
  );
}

export const AutoSelectNode = memo(AutoSelectNodeComponent);
