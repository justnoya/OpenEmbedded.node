import { memo } from "react";
import { Handle, Position, NodeProps } from "@xyflow/react";
import { NodeWrapper } from "./NodeWrapper";

function ContainerNodeComponent({ id, data }: NodeProps) {
  return (
    <NodeWrapper id={id} typeBadge="Container · 17" badgeColor="#3d2e5a">
      <div style={{ color: "#F2F3F5", fontSize: 13, fontWeight: 600, marginBottom: 4 }}>
        Container
      </div>
      {data.accent_color != null && (
        <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 4 }}>
          <div style={{ width: 12, height: 12, borderRadius: 2, background: `#${(data.accent_color as number).toString(16).padStart(6, "0")}` }} />
          <span style={{ color: "#949B9D", fontSize: 11 }}>accent</span>
        </div>
      )}
      {!!data.spoiler && <div style={{ color: "#FEE75C", fontSize: 11, marginTop: 4 }}>spoiler</div>}
      <Handle type="target" position={Position.Left} style={{ background: "#57F287" }} />
      <Handle type="source" position={Position.Right} style={{ background: "#5865F2" }} />
    </NodeWrapper>
  );
}

export const ContainerNode = memo(ContainerNodeComponent);
