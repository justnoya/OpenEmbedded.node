// @ts-nocheck
import { memo } from "react";
import { Handle, Position, NodeProps } from "@xyflow/react";
import { NodeWrapper } from "./NodeWrapper.js";
import { Upload } from "lucide-react";

function FileUploadNodeComponent({ id, data }: NodeProps) {
  const label = (data.label as string) || "File Upload";
  const customId = (data.custom_id as string) || "";
  const required = !!(data.required as boolean);

  return (
    <NodeWrapper id={id} typeName="File Upload" icon={<Upload size={14} />} accentColor="#22c55e" nodeClass="sub">
      <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
        <div style={{
          display: "flex", alignItems: "center", justifyContent: "center",
          border: "1.5px dashed rgba(34,197,94,0.35)", borderRadius: 6,
          padding: "8px 12px", gap: 7, background: "rgba(34,197,94,0.04)",
        }}>
          <Upload size={12} color="#22c55e" />
          <span style={{ color: "#c0c0c0", fontSize: 11, fontWeight: 500 }}>{label}</span>
        </div>
        {customId && (
          <div style={{ color: "#505050", fontSize: 9, fontFamily: "monospace" }}>
            id: {customId}
          </div>
        )}
        {required && (
          <span style={{ color: "#ef4444", fontSize: 9, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em" }}>REQUIRED</span>
        )}
      </div>
      <Handle type="target" position={Position.Left} style={{ background: "#3fb950", border: "2px solid #1a1a1a", width: 10, height: 10 }} />
    </NodeWrapper>
  );
}

export const FileUploadNode = memo(FileUploadNodeComponent);
