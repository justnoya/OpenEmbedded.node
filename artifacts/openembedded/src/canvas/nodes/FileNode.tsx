// @ts-nocheck
import { memo } from "react";
import { Handle, Position, NodeProps } from "@xyflow/react";
import { NodeWrapper } from "./NodeWrapper.js";
import { FileIcon } from "lucide-react";

function FileNodeComponent({ id, data }: NodeProps) {
  const filename = (data.filename as string) || "attachment.png";
  const description = (data.description as string) || "";
  const spoiler = !!(data.spoiler as boolean);

  return (
    <NodeWrapper id={id} typeName="File" icon={<FileIcon size={14} />} accentColor="#6b7280" nodeClass="sub">
      <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <div style={{ width: 28, height: 32, background: "rgba(107,114,128,0.12)", border: "1px solid rgba(107,114,128,0.25)", borderRadius: 4, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
            <FileIcon size={14} color="#9ca3af" />
          </div>
          <div style={{ minWidth: 0 }}>
            <div style={{ color: "#d4d4d4", fontSize: 11, fontWeight: 500, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: 155 }}>
              {filename}
            </div>
            {description && (
              <div style={{ color: "#505050", fontSize: 9, marginTop: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: 155 }}>
                {description}
              </div>
            )}
          </div>
        </div>
        {spoiler && (
          <span style={{ background: "rgba(254,231,92,0.08)", color: "#d29922", fontSize: 9, fontWeight: 600, padding: "1px 5px", borderRadius: 3, letterSpacing: "0.04em", alignSelf: "flex-start" }}>
            SPOILER
          </span>
        )}
      </div>
      <Handle type="target" position={Position.Left} style={{ background: "#3fb950", border: "2px solid #1a1a1a", width: 10, height: 10 }} />
    </NodeWrapper>
  );
}

export const FileNode = memo(FileNodeComponent);
