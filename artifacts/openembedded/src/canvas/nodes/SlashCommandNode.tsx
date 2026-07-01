// @ts-nocheck
import { memo } from "react";
import { Handle, Position, NodeProps } from "@xyflow/react";
import { NodeWrapper } from "./NodeWrapper.js";
import { Terminal } from "lucide-react";

function SlashCommandNodeComponent({ id, data }: NodeProps) {
  const name = (data.name as string) ?? "";
  const description = (data.description as string) ?? "";
  const options = (data.options as unknown[]) ?? [];

  return (
    <NodeWrapper id={id} typeName="Slash Command" icon={<Terminal size={14} />} accentColor="#6366f1" nodeClass="root" showSendHandle>
      <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
          <span style={{ color: "#818cf8", fontSize: 13, fontWeight: 700, fontFamily: "monospace" }}>
            /{name || "command"}
          </span>
        </div>
        {description && (
          <div style={{ color: "#505050", fontSize: 10, lineHeight: 1.35, maxWidth: 175, overflow: "hidden", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical" }}>
            {description}
          </div>
        )}
        <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
          <span style={{ background: "rgba(99,102,241,0.15)", color: "#818cf8", fontSize: 8, fontWeight: 700, padding: "1px 5px", borderRadius: 3, textTransform: "uppercase", letterSpacing: "0.06em" }}>
            TRIGGER
          </span>
          {options.length > 0 && (
            <span style={{ color: "#505050", fontSize: 9 }}>{options.length} option{options.length !== 1 ? "s" : ""}</span>
          )}
        </div>
      </div>
      <Handle type="source" position={Position.Right} style={{ background: "#6366f1", border: "2px solid #1a1a1a", width: 10, height: 10 }} />
    </NodeWrapper>
  );
}

export const SlashCommandNode = memo(SlashCommandNodeComponent);
