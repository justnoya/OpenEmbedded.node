import { memo } from "react";
import { Handle, Position, NodeProps } from "@xyflow/react";
import { NodeWrapper } from "./NodeWrapper";

function MediaGalleryNodeComponent({ id, data }: NodeProps) {
  const items = (data.items as { url: string }[]) ?? [];
  return (
    <NodeWrapper id={id} typeBadge="MediaGallery · 12" badgeColor="#3d1d35">
      <div style={{ color: "#F2F3F5", fontSize: 13, fontWeight: 600 }}>Media Gallery</div>
      <div style={{ color: "#B5BAC1", fontSize: 11, marginTop: 4 }}>{items.length} image{items.length !== 1 ? "s" : ""}</div>
      <Handle type="target" position={Position.Left} style={{ background: "#57F287" }} />
      <Handle type="source" position={Position.Right} style={{ background: "#5865F2" }} />
    </NodeWrapper>
  );
}

export const MediaGalleryNode = memo(MediaGalleryNodeComponent);
