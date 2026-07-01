// @ts-nocheck
import { memo } from "react";
import { Handle, Position, NodeProps } from "@xyflow/react";
import { NodeWrapper } from "./NodeWrapper.js";
import { Globe } from "lucide-react";

const METHOD_COLORS: Record<string, string> = {
  GET: "#22c55e", POST: "#3b82f6", PUT: "#f59e0b",
  PATCH: "#a855f7", DELETE: "#ef4444",
};

function HttpRequestNodeComponent({ id, data }: NodeProps) {
  const method = (data.method as string) ?? "GET";
  const url = (data.url as string) ?? "";
  const storeAs = (data.storeAs as string) ?? "";
  const color = METHOD_COLORS[method] ?? "#6b7280";

  const displayUrl = url.length > 35 ? url.slice(0, 32) + "…" : url;

  return (
    <NodeWrapper id={id} typeName="HTTP Request" icon={<Globe size={14} />} accentColor="#0ea5e9" nodeClass="relay">
      <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <span style={{ background: `${color}22`, color, fontSize: 9, fontWeight: 800, padding: "1px 6px", borderRadius: 3, fontFamily: "monospace" }}>
            {method}
          </span>
          {url ? (
            <span style={{ color: "#90909090", fontSize: 10, fontFamily: "monospace", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: 140 }}>
              {displayUrl}
            </span>
          ) : (
            <span style={{ color: "#404040", fontSize: 10, fontStyle: "italic" }}>No URL set</span>
          )}
        </div>
        {storeAs && (
          <div style={{ color: "#505050", fontSize: 9 }}>
            → stored as <span style={{ color: "#a78bfa", fontFamily: "monospace" }}>{storeAs}</span>
          </div>
        )}
        <span style={{ background: "rgba(14,165,233,0.12)", color: "#7dd3fc", fontSize: 8, fontWeight: 700, padding: "1px 5px", borderRadius: 3, textTransform: "uppercase", letterSpacing: "0.06em", alignSelf: "flex-start" }}>
          LOGIC
        </span>
      </div>
      <Handle type="target" position={Position.Left} style={{ background: "#0ea5e9", border: "2px solid #1a1a1a", width: 10, height: 10 }} />
      <Handle type="source" position={Position.Right} style={{ background: "#0ea5e9", border: "2px solid #1a1a1a", width: 10, height: 10 }} />
    </NodeWrapper>
  );
}

export const HttpRequestNode = memo(HttpRequestNodeComponent);
