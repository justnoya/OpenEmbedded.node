// @ts-nocheck
import { memo } from "react";
import { Handle, Position, NodeProps } from "@xyflow/react";
import { NodeWrapper } from "./NodeWrapper.js";
import { UserSearch } from "lucide-react";

function FetchMemberActionNodeComponent({ id, data }: NodeProps) {
  const userMode = (data.userMode as string) ?? "from_trigger";
  const userId = (data.userId as string) ?? "";
  const storeAs = (data.storeAs as string) ?? "member";

  return (
    <NodeWrapper id={id} typeName="Fetch Member" icon={<UserSearch size={14} />} accentColor="#06b6d4" nodeClass="relay">
      <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
          <span style={{ background: "rgba(6,182,212,0.15)", color: "#67e8f9", fontSize: 8, fontWeight: 700, padding: "1px 5px", borderRadius: 3, textTransform: "uppercase", letterSpacing: "0.06em" }}>
            ACTION
          </span>
          <span style={{ color: "#505050", fontSize: 9 }}>
            {userMode === "from_trigger" ? "trigger user" : userId ? userId.slice(0, 12) : "no user"}
          </span>
        </div>
        <div style={{ color: "#505050", fontSize: 9 }}>
          → stored as <span style={{ color: "#a78bfa", fontFamily: "monospace" }}>{storeAs}</span>
        </div>
      </div>
      <Handle type="target" position={Position.Left} style={{ background: "#06b6d4", border: "2px solid #1a1a1a", width: 10, height: 10 }} />
      <Handle type="source" position={Position.Right} style={{ background: "#06b6d4", border: "2px solid #1a1a1a", width: 10, height: 10 }} />
    </NodeWrapper>
  );
}

export const FetchMemberActionNode = memo(FetchMemberActionNodeComponent);
