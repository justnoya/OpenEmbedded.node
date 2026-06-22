import { memo } from "react";
import { Handle, Position, NodeProps } from "@xyflow/react";
import { NodeWrapper } from "./NodeWrapper";
import { Image } from "lucide-react";

function ThumbnailNodeComponent({ id, data }: NodeProps) {
  const url = (data.url as string) ?? "";
  return (
    <NodeWrapper id={id} typeName="Thumbnail · 11" icon={<Image size={18} />} accentColor="#f59e0b">
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        {url ? (
          <img
            src={url}
            alt=""
            style={{ width: 38, height: 38, objectFit: "cover", borderRadius: 6, border: "1px solid rgba(255,255,255,0.08)", flexShrink: 0 }}
            onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = "none"; }}
          />
        ) : (
          <div
            style={{
              width: 38, height: 38, background: "rgba(245,158,11,0.08)", borderRadius: 6,
              border: "1px dashed rgba(245,158,11,0.25)",
              display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
            }}
          >
            <Image size={14} color="#f59e0b" opacity={0.4} />
          </div>
        )}
        <div>
          <div style={{ color: "#888888", fontSize: 10, maxWidth: 140, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            {url || "No URL set"}
          </div>
        </div>
      </div>
      <Handle type="target" position={Position.Left} style={{ background: "#3fb950", border: "2px solid #252525", width: 12, height: 12 }} />
      <Handle type="source" position={Position.Right} style={{ background: "#f59e0b", border: "2px solid #252525", width: 12, height: 12 }} />
    </NodeWrapper>
  );
}

export const ThumbnailNode = memo(ThumbnailNodeComponent);
