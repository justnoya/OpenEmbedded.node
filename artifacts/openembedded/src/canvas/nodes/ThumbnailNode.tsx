import { memo } from "react";
import { Handle, Position, NodeProps } from "@xyflow/react";
import { NodeWrapper } from "./NodeWrapper";

function ThumbnailNodeComponent({ id, data }: NodeProps) {
  const url = (data.url as string) ?? "";
  return (
    <NodeWrapper id={id} typeBadge="Thumbnail · 11" badgeColor="#3d2b1a">
      <div style={{ color: "#F2F3F5", fontSize: 13, fontWeight: 600, marginBottom: 4 }}>Thumbnail</div>
      {url ? (
        <img src={url} alt="thumb" style={{ width: 48, height: 48, objectFit: "cover", borderRadius: 4, border: "1px solid rgba(255,255,255,0.1)" }} />
      ) : (
        <div style={{ width: 48, height: 48, background: "#424549", borderRadius: 4, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <span style={{ color: "#949B9D", fontSize: 10 }}>no url</span>
        </div>
      )}
      <Handle type="target" position={Position.Left} style={{ background: "#57F287" }} />
      <Handle type="source" position={Position.Right} style={{ background: "#5865F2" }} />
    </NodeWrapper>
  );
}

export const ThumbnailNode = memo(ThumbnailNodeComponent);
