// @ts-nocheck
import { memo } from "react";
import { Handle, Position, NodeProps } from "@xyflow/react";
import { NodeWrapper } from "./NodeWrapper.js";
import { UserMinus } from "lucide-react";

function RemoveRoleActionNodeComponent({ id, data }: NodeProps) {
  const roleId = (data.roleId as string) ?? "";
  const roleName = (data.roleName as string) ?? "";
  const userMode = (data.userMode as string) ?? "from_trigger";

  return (
    <NodeWrapper id={id} typeName="Remove Role" icon={<UserMinus size={14} />} accentColor="#f97316" nodeClass="relay">
      <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <div style={{ width: 10, height: 10, borderRadius: "50%", background: "rgba(249,115,22,0.2)", border: "1.5px solid #f97316", flexShrink: 0 }} />
          <span style={{ color: "#fdba74", fontSize: 11, fontWeight: 600, maxWidth: 155, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            {roleName || roleId || "No role selected"}
          </span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
          <span style={{ background: "rgba(249,115,22,0.15)", color: "#fdba74", fontSize: 8, fontWeight: 700, padding: "1px 5px", borderRadius: 3, textTransform: "uppercase", letterSpacing: "0.06em" }}>
            ACTION
          </span>
          <span style={{ color: "#505050", fontSize: 9 }}>
            from {userMode === "from_trigger" ? "trigger user" : "specific user"}
          </span>
        </div>
      </div>
      <Handle type="target" position={Position.Left} style={{ background: "#f97316", border: "2px solid #1a1a1a", width: 10, height: 10 }} />
      <Handle type="source" position={Position.Right} style={{ background: "#f97316", border: "2px solid #1a1a1a", width: 10, height: 10 }} />
    </NodeWrapper>
  );
}

export const RemoveRoleActionNode = memo(RemoveRoleActionNodeComponent);
