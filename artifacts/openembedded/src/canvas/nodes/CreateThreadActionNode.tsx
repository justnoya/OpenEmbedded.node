// @ts-nocheck
import { memo } from "react";
import { Handle, Position, NodeProps } from "@xyflow/react";
import { NodeWrapper } from "./NodeWrapper.js";
import { MessageSquarePlus } from "lucide-react";

function CreateThreadActionNodeComponent({ id, data }: NodeProps) {
  const name = (data.name as string) ?? "";
  const autoArchiveDuration = (data.autoArchiveDuration as number) ?? 1440;
  const isPrivate = !!(data.isPrivate as boolean);
  const messageIdMode = (data.messageIdMode as string) ?? "from_trigger";

  const archiveLabel: Record<number, string> = { 60: "1h", 1440: "24h", 4320: "3d", 10080: "7d" };

  return (
    <NodeWrapper id={id} typeName="Create Thread" icon={<MessageSquarePlus size={14} />} accentColor="#0ea5e9" nodeClass="relay">
      <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
        <div style={{ color: name ? "#bae6fd" : "#404040", fontSize: 11, fontWeight: name ? 600 : 400, fontStyle: name ? "normal" : "italic", maxWidth: 185, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
          {name || "No thread name set"}
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 5, flexWrap: "wrap" }}>
          <span style={{ background: "rgba(14,165,233,0.15)", color: "#7dd3fc", fontSize: 8, fontWeight: 700, padding: "1px 5px", borderRadius: 3, textTransform: "uppercase", letterSpacing: "0.06em" }}>
            ACTION
          </span>
          <span style={{ color: "#505050", fontSize: 9 }}>
            archive: {archiveLabel[autoArchiveDuration] ?? `${autoArchiveDuration}m`}
          </span>
          {isPrivate && <span style={{ color: "#818cf8", fontSize: 9 }}>private</span>}
        </div>
      </div>
      <Handle type="target" position={Position.Left} style={{ background: "#0ea5e9", border: "2px solid #1a1a1a", width: 10, height: 10 }} />
      <Handle type="source" position={Position.Right} style={{ background: "#0ea5e9", border: "2px solid #1a1a1a", width: 10, height: 10 }} />
    </NodeWrapper>
  );
}

export const CreateThreadActionNode = memo(CreateThreadActionNodeComponent);
