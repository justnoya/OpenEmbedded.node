import { memo } from "react";
import { Handle, Position, NodeProps } from "@xyflow/react";
import { NodeWrapper } from "./NodeWrapper";
import { LayoutGrid } from "lucide-react";

function MediaGalleryNodeComponent({ id, data }: NodeProps) {
  const items = (data.items as { url: string }[]) ?? [];
  const preview = items.slice(0, 4);

  return (
    <NodeWrapper id={id} typeName="Media Gallery · 12" icon={<LayoutGrid size={18} />} accentColor="#ec4899">
      {preview.length > 0 ? (
        <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
          {preview.map((item, i) =>
            item.url ? (
              <img
                key={i}
                src={item.url}
                alt=""
                style={{ width: 28, height: 28, objectFit: "cover", borderRadius: 4, border: "1px solid rgba(255,255,255,0.07)" }}
                onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = "none"; }}
              />
            ) : (
              <div key={i} style={{ width: 28, height: 28, background: "rgba(236,72,153,0.08)", borderRadius: 4, border: "1px dashed rgba(236,72,153,0.2)" }} />
            )
          )}
          {items.length > 4 && (
            <div style={{ width: 28, height: 28, background: "rgba(236,72,153,0.12)", borderRadius: 4, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <span style={{ color: "#ec4899", fontSize: 9, fontWeight: 700 }}>+{items.length - 4}</span>
            </div>
          )}
        </div>
      ) : (
        <div style={{ color: "#404040", fontSize: 11 }}>0 images</div>
      )}
      <Handle type="target" position={Position.Left} style={{ background: "#3fb950", border: "2px solid #252525", width: 12, height: 12 }} />
      <Handle type="source" position={Position.Right} style={{ background: "#ec4899", border: "2px solid #252525", width: 12, height: 12 }} />
    </NodeWrapper>
  );
}

export const MediaGalleryNode = memo(MediaGalleryNodeComponent);
