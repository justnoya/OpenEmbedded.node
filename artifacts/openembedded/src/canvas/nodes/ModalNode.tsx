import { memo } from "react";
import { Handle, Position, NodeProps } from "@xyflow/react";
import { NodeWrapper } from "./NodeWrapper";
import { PanelTop } from "lucide-react";

function ModalNodeComponent({ id, data }: NodeProps) {
  const title = (data.title as string) ?? "";
  const customId = (data.custom_id as string) ?? "";

  return (
    <NodeWrapper id={id} typeName="Modal" icon={<PanelTop size={18} />} accentColor="#3b82f6" nodeClass="main">
      <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
        <div
          style={{
            color: title ? "#c8c8c8" : "#404040",
            fontSize: 13,
            fontWeight: 600,
            fontStyle: title ? "normal" : "italic",
            maxWidth: 185,
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}
        >
          {title || "Untitled modal…"}
        </div>
        {customId && (
          <div style={{ color: "#404040", fontSize: 10, fontFamily: "monospace" }}>
            id: {customId}
          </div>
        )}
        <div style={{ color: "#3a3a3a", fontSize: 10, marginTop: 2 }}>
          Triggered by Button → Open Modal
        </div>
      </div>
      <Handle type="target" position={Position.Left} style={{ background: "#f59e0b", border: "2px solid #252525", width: 12, height: 12 }} />
      <Handle type="source" position={Position.Right} style={{ background: "#3b82f6", border: "2px solid #252525", width: 12, height: 12 }} />
    </NodeWrapper>
  );
}

export const ModalNode = memo(ModalNodeComponent);
