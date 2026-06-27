// @ts-nocheck
import { memo } from "react";
import { Handle, Position, NodeProps } from "@xyflow/react";
import { NodeWrapper } from "./NodeWrapper.js";
import { BookMarked } from "lucide-react";

function EmbeddNodeComponent({ id, data }: NodeProps) {
  const title = (data.title as string) ?? "";
  const color = data.color as number | undefined;
  const accentHex = color != null ? `#${color.toString(16).padStart(6, "0")}` : "#5865F2";
  const description = (data.description as string) ?? "";
  const author = (data.author as string) ?? "";

  return (
    <NodeWrapper
      id={id}
      typeName="Embed"
      icon={<BookMarked size={14} />}
      accentColor={accentHex}
      nodeClass="main"
    >
      <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
        {/* Color bar + title preview */}
        <div style={{ display: "flex", alignItems: "stretch", gap: 7 }}>
          <div
            style={{
              width: 3, borderRadius: 2,
              background: accentHex,
              flexShrink: 0, minHeight: 20,
            }}
          />
          <div style={{ minWidth: 0, flex: 1 }}>
            {title ? (
              <div style={{ color: "#d0d0d0", fontSize: 11, fontWeight: 600, lineHeight: 1.3, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                {title}
              </div>
            ) : (
              <div style={{ color: "#3a3a3a", fontSize: 11, fontStyle: "italic" }}>No title set</div>
            )}
            {description && (
              <div style={{ color: "#505050", fontSize: 10, marginTop: 1.5, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                {description}
              </div>
            )}
          </div>
        </div>

        {/* Meta row */}
        <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
          {/* Color swatch */}
          <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
            <div
              style={{
                width: 8, height: 8, borderRadius: 2,
                background: accentHex,
                border: "1px solid rgba(255,255,255,0.1)",
                flexShrink: 0,
              }}
            />
            <span style={{ color: "#3a3a3a", fontSize: 9, fontFamily: "monospace" }}>{accentHex}</span>
          </div>

          {author && (
            <span style={{ color: "#3a3a3a", fontSize: 9, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: 100 }}>
              by {author}
            </span>
          )}

          {!title && !description && !author && (
            <span style={{ color: "#2e2e2e", fontSize: 10 }}>Discord embed block</span>
          )}
        </div>
      </div>

      {/* Target handle (left) — receives from Bot / Webhook */}
      <Handle
        type="target"
        position={Position.Left}
        style={{ background: "#3fb950", border: "2px solid #1a1a1a", width: 10, height: 10 }}
      />
      {/* Source handle (right) — connects to child content */}
      <Handle
        type="source"
        position={Position.Right}
        style={{ background: accentHex, border: "2px solid #1a1a1a", width: 10, height: 10 }}
      />
    </NodeWrapper>
  );
}

export const EmbeddNode = memo(EmbeddNodeComponent);
