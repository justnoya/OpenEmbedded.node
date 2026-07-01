// @ts-nocheck
import { memo } from "react";
import { Handle, Position, NodeProps } from "@xyflow/react";
import { NodeWrapper } from "./NodeWrapper.js";
import { Zap } from "lucide-react";

const EVENT_LABELS: Record<string, string> = {
  messageCreate:         "Message Sent",
  messageUpdate:         "Message Edited",
  messageDelete:         "Message Deleted",
  guildMemberAdd:        "Member Joined",
  guildMemberRemove:     "Member Left",
  guildMemberUpdate:     "Member Updated",
  messageReactionAdd:    "Reaction Added",
  messageReactionRemove: "Reaction Removed",
  voiceStateUpdate:      "Voice State Changed",
  presenceUpdate:        "Presence Updated",
  guildBanAdd:           "Member Banned",
  guildBanRemove:        "Member Unbanned",
  channelCreate:         "Channel Created",
  channelDelete:         "Channel Deleted",
  roleCreate:            "Role Created",
  roleDelete:            "Role Deleted",
  threadCreate:          "Thread Created",
  guildCreate:           "Bot Added to Server",
  guildDelete:           "Bot Removed from Server",
  autoModerationActionExecution: "AutoMod Triggered",
};

const EVENT_COLORS: Record<string, string> = {
  messageCreate: "#10b981",
  guildMemberAdd: "#22c55e",
  guildMemberRemove: "#ef4444",
  messageReactionAdd: "#f59e0b",
  guildBanAdd: "#dc2626",
  autoModerationActionExecution: "#f97316",
};

function EventTriggerNodeComponent({ id, data }: NodeProps) {
  const event = (data.event as string) ?? "messageCreate";
  const label = EVENT_LABELS[event] ?? event;
  const color = EVENT_COLORS[event] ?? "#8b5cf6";
  const filterCount = Object.keys((data.filters as Record<string, unknown>) ?? {}).filter(k => (data.filters as Record<string, unknown>)[k]).length;

  return (
    <NodeWrapper id={id} typeName="Event Trigger" icon={<Zap size={14} />} accentColor="#8b5cf6" nodeClass="root" showSendHandle>
      <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <div style={{ width: 8, height: 8, borderRadius: "50%", background: color, flexShrink: 0, boxShadow: `0 0 6px ${color}80` }} />
          <span style={{ color: "#e0e0e0", fontSize: 12, fontWeight: 600, maxWidth: 160, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            {label}
          </span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
          <span style={{ background: "rgba(139,92,246,0.15)", color: "#a78bfa", fontSize: 8, fontWeight: 700, padding: "1px 5px", borderRadius: 3, textTransform: "uppercase", letterSpacing: "0.06em" }}>
            TRIGGER
          </span>
          {filterCount > 0 && (
            <span style={{ color: "#505050", fontSize: 9 }}>{filterCount} filter{filterCount !== 1 ? "s" : ""}</span>
          )}
        </div>
        <div style={{ color: "#3a3a3a", fontSize: 9 }}>
          Connect → Action nodes to define what happens
        </div>
      </div>
      <Handle type="source" position={Position.Right} style={{ background: "#8b5cf6", border: "2px solid #1a1a1a", width: 10, height: 10 }} />
    </NodeWrapper>
  );
}

export const EventTriggerNode = memo(EventTriggerNodeComponent);
