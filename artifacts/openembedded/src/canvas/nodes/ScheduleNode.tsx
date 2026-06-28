// @ts-nocheck
import { memo } from "react";
import { Handle, Position, NodeProps } from "@xyflow/react";
import { NodeWrapper } from "./NodeWrapper.js";
import { Clock, Calendar, CheckCircle2, AlertCircle, Send, Timer } from "lucide-react";

const CRON_PRESETS: Record<string, string> = {
  "* * * * *":     "Every minute",
  "*/5 * * * *":   "Every 5 minutes",
  "0 * * * *":     "Every hour",
  "0 9 * * *":     "Daily at 9 AM",
  "0 18 * * *":    "Daily at 6 PM",
  "0 9 * * 1":     "Weekly — Monday 9 AM",
  "0 9 1 * *":     "Monthly — 1st at 9 AM",
};

function humanCron(expr: string): string {
  return CRON_PRESETS[expr] ?? expr;
}

function ScheduleNodeComponent({ id, data }: NodeProps) {
  const scheduleType = (data.scheduleType as string) ?? "cron";
  const cronExpression = (data.cronExpression as string) ?? "";
  const runAt = (data.runAt as string) ?? "";
  const label = (data.label as string) ?? "";
  const active = (data.active as boolean) ?? false;
  const webhookUrl = (data.webhookUrl as string) ?? "";
  const scheduleId = (data.scheduleId as string) ?? "";
  const lastRunAt = (data.lastRunAt as string) ?? "";
  const nextRunAt = (data.nextRunAt as string) ?? "";

  const hasDestination = !!webhookUrl;
  const hasTrigger =
    scheduleType === "cron" ? !!cronExpression : !!runAt;
  const isReady = hasDestination && hasTrigger;

  const scheduleLabel =
    scheduleType === "once"
      ? runAt
        ? new Date(runAt).toLocaleString(undefined, { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })
        : "Pick a date"
      : cronExpression
        ? humanCron(cronExpression)
        : "Set cron expression";

  return (
    <NodeWrapper
      id={id}
      typeName="Schedule · Automation"
      icon={<Clock size={14} />}
      accentColor="#f59e0b"
      nodeClass="root"
      showSendHandle
    >
      <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
        {/* Schedule type + expression row */}
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          {scheduleType === "cron"
            ? <Timer size={9} color="#f59e0b" />
            : <Calendar size={9} color="#f59e0b" />}
          <span
            style={{
              color: hasTrigger ? "#e0a847" : "#505050",
              fontSize: 10,
              fontWeight: 600,
              maxWidth: 155,
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
          >
            {scheduleLabel}
          </span>
        </div>

        {/* Status row */}
        {scheduleId ? (
          <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
            <div
              style={{
                width: 6,
                height: 6,
                borderRadius: "50%",
                background: active ? "#3fb950" : "#505050",
                flexShrink: 0,
                boxShadow: active ? "0 0 5px #3fb95060" : "none",
              }}
            />
            <span style={{ color: active ? "#3fb950" : "#606060", fontSize: 10 }}>
              {active ? "Active" : "Paused"}
            </span>
            {label && (
              <span style={{ color: "#505050", fontSize: 10, marginLeft: 2, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: 100 }}>
                · {label}
              </span>
            )}
          </div>
        ) : (
          <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
            <AlertCircle size={9} color="#505050" />
            <span style={{ color: "#505050", fontSize: 10 }}>Not yet activated</span>
          </div>
        )}

        {/* Last / next run */}
        {scheduleId && lastRunAt && (
          <div style={{ fontSize: 9, color: "#505050" }}>
            Last:{" "}
            {new Date(lastRunAt).toLocaleString(undefined, {
              month: "short", day: "numeric", hour: "2-digit", minute: "2-digit",
            })}
          </div>
        )}
        {scheduleId && nextRunAt && active && (
          <div style={{ fontSize: 9, color: "#505050" }}>
            Next:{" "}
            {new Date(nextRunAt).toLocaleString(undefined, {
              month: "short", day: "numeric", hour: "2-digit", minute: "2-digit",
            })}
          </div>
        )}

        {/* Destination status */}
        {hasDestination ? (
          <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
            <CheckCircle2 size={9} color="#3fb950" />
            <span style={{ color: "#505050", fontSize: 10 }}>Webhook configured</span>
          </div>
        ) : (
          <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
            <AlertCircle size={9} color="#505050" />
            <span style={{ color: "#505050", fontSize: 10 }}>Set webhook in Properties</span>
          </div>
        )}

        {/* Send hint */}
        <div style={{ display: "flex", alignItems: "center", gap: 5, marginTop: 2, paddingTop: 6, borderTop: "1px solid rgba(255,255,255,0.04)" }}>
          <Send size={9} color={isReady ? "#f59e0b" : "#505050"} />
          <span style={{ color: isReady ? "#a07030" : "#505050", fontSize: 10 }}>
            {isReady ? "Drag right handle → Container or Embed" : "Configure schedule in Properties"}
          </span>
        </div>
      </div>

      <Handle
        type="source"
        position={Position.Right}
        style={{
          background: isReady ? "#f59e0b" : "#3a3a3a",
          border: "2px solid #1a1a1a",
          width: 10,
          height: 10,
        }}
      />
    </NodeWrapper>
  );
}

export const ScheduleNode = memo(ScheduleNodeComponent);
