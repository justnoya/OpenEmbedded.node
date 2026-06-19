import { memo } from "react";
import { Handle, Position, NodeProps } from "@xyflow/react";
import { NodeWrapper } from "./NodeWrapper";
import { Image } from "lucide-react";

function ThumbnailNodeComponent({ id, data }: NodeProps) {
  const url = (data.url as string) ?? "";
  return (
    <NodeWrapper id={id} typeName="Thumbnail · 11" icon={<Image size={13} />} accentColor="#f59e0b">
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        {url ? (
          <img
            src={url}
            alt=""
            style={{
              width: 40,
              height: 40,
              objectFit: "cover",
              borderRadius: 5,
              border: "1px solid rgba(255,255,255,0.08)",
              flexShrink: 0,
            }}
            onError={(e) => {
              (e.currentTarget as HTMLImageElement).style.display = "none";
            }}
          />
        ) : (
          <div
            style={{
              width: 40,
              height: 40,
              background: "rgba(245,158,11,0.1)",
              borderRadius: 5,
              border: "1px dashed rgba(245,158,11,0.3)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
            }}
          >
            <Image size={16} color="#f59e0b" opacity={0.5} />
          </div>
        )}
        <div>
          <div style={{ color: "#e6edf3", fontSize: 12, fontWeight: 500, marginBottom: 1 }}>
            Thumbnail
          </div>
          <div
            style={{
              color: "#7d8590",
              fontSize: 10,
              maxWidth: 140,
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
          >
            {url || "No URL set"}
          </div>
        </div>
      </div>
      <Handle type="target" position={Position.Left} style={{ background: "#3fb950", border: "2px solid #1c2128", width: 10, height: 10 }} />
      <Handle type="source" position={Position.Right} style={{ background: "#f59e0b", border: "2px solid #1c2128", width: 10, height: 10 }} />
    </NodeWrapper>
  );
}

export const ThumbnailNode = memo(ThumbnailNodeComponent);
