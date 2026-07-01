// @ts-nocheck
import { memo } from "react";
import { Handle, Position, NodeProps } from "@xyflow/react";
import { NodeWrapper } from "./NodeWrapper.js";
import { Hash } from "lucide-react";

const CHANNEL_TYPE_LABELS: Record<string, string> = {
  text:     "Text Channel",
  voice:    "Voice Channel",
  category: "Category",
  announcement: "Announcement",
  forum:    "Forum",
  stage:    "Stage",
};

function CreateChannelActionNodeComponent({ id, data }: NodeProps) {
  const channelType = (data.channelType as string) ?? "text";
  const name = (data.name as string) ?? "";
  const storeAs = (data.storeAs as string) ?? "";

  return (
    <NodeWrapper id={id} typeName="Create Channel" icon={<Hash size={14} />} accentColor="#22c55e" nodeClass="relay">
      <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
          <Hash size={10} color="#4ade80" />
          <span style={{ color: name ? "#86efac" : "#404040", fontSize: 11, fontWeight: 600, fontStyle: name ? "normal" : "italic", maxWidth: 155, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            {name || "no-name-set"}
          </span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
          <span style={{ background: "rgba(34,197,94,0.15)", color: "#86efac", fontSize: 8, fontWeight: 700, padding: "1px 5px", borderRadius: 3, textTransform: "uppercase", letterSpacing: "0.06em" }}>
            ACTION
          </span>
          <span style={{ color: "#505050", fontSize: 9 }}>{CHANNEL_TYPE_LABELS[channelType] ?? channelType}</span>
        </div>
        {storeAs && (
          <div style={{ color: "#505050", fontSize: 9 }}>
            → <span style={{ color: "#a78bfa", fontFamily: "monospace" }}>{storeAs}</span>
          </div>
        )}
      </div>
      <Handle type="target" position={Position.Left} style={{ background: "#22c55e", border: "2px solid #1a1a1a", width: 10, height: 10 }} />
      <Handle type="source" position={Position.Right} style={{ background: "#22c55e", border: "2px solid #1a1a1a", width: 10, height: 10 }} />
    </NodeWrapper>
  );
}

export const CreateChannelActionNode = memo(CreateChannelActionNodeComponent);
