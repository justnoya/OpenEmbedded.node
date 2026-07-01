// @ts-nocheck
import { memo } from "react";
import { Handle, Position, NodeProps } from "@xyflow/react";
import { NodeWrapper } from "./NodeWrapper.js";
import { Timer } from "lucide-react";

function DelayNodeComponent({ id, data }: NodeProps) {
  const duration = (data.duration as number) ?? 5;
  const unit = (data.unit as string) ?? "seconds"; // seconds | minutes | hours

  const UNIT_LABELS: Record<string, string> = { seconds: "s", minutes: "m", hours: "h" };

  return (
    <NodeWrapper id={id} typeName="Delay" icon={<Timer size={14} />} accentColor="#78716c" nodeClass="relay">
      <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <div style={{
            background: "rgba(120,113,108,0.15)",
            border: "1px solid rgba(120,113,108,0.3)",
            borderRadius: 8, padding: "6px 12px",
            display: "flex", alignItems: "baseline", gap: 3,
          }}>
            <span style={{ color: "#d6d3d1", fontSize: 22, fontWeight: 700, fontVariantNumeric: "tabular-nums" }}>{duration}</span>
            <span style={{ color: "#78716c", fontSize: 12, fontWeight: 600 }}>{UNIT_LABELS[unit] ?? unit}</span>
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
          <span style={{ background: "rgba(120,113,108,0.15)", color: "#a8a29e", fontSize: 8, fontWeight: 700, padding: "1px 5px", borderRadius: 3, textTransform: "uppercase", letterSpacing: "0.06em" }}>
            LOGIC
          </span>
          <span style={{ color: "#505050", fontSize: 9 }}>pause before next step</span>
        </div>
      </div>
      <Handle type="target" position={Position.Left} style={{ background: "#78716c", border: "2px solid #1a1a1a", width: 10, height: 10 }} />
      <Handle type="source" position={Position.Right} style={{ background: "#78716c", border: "2px solid #1a1a1a", width: 10, height: 10 }} />
    </NodeWrapper>
  );
}

export const DelayNode = memo(DelayNodeComponent);
