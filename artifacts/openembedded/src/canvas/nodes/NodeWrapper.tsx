import { ReactNode } from "react";
import { useStore } from "@xyflow/react";
import { useGraphStore } from "@/lib/graphStore";
import { NodeClass, NODE_CLASS_LABELS, NODE_CLASS_COLORS } from "@/lib/connectionRules";

interface NodeWrapperProps {
  id: string;
  children: ReactNode;
  typeName: string;
  icon: ReactNode;
  accentColor: string;
  nodeClass?: NodeClass;
}

export function NodeWrapper({ id, children, typeName, icon, accentColor, nodeClass = "sub" }: NodeWrapperProps) {
  const selectedNodeId = useGraphStore((s) => s.selectedNodeId);
  const setSelectedNode = useGraphStore((s) => s.setSelectedNode);
  const isSelected = selectedNodeId === id;
  const connectionToNodeId = useStore((s) => s.connection?.toNode?.id);
  const isConnectionTarget = connectionToNodeId === id;

  const badgeColor = NODE_CLASS_COLORS[nodeClass];
  const badgeLabel = NODE_CLASS_LABELS[nodeClass];

  let borderColor: string;
  let shadowVal: string;
  let bgGradient: string;

  if (isConnectionTarget) {
    borderColor = "rgba(255,255,255,0.4)";
    shadowVal = "0 0 0 2px rgba(255,255,255,0.15), 0 0 32px rgba(255,255,255,0.05), 0 8px 24px rgba(0,0,0,0.6)";
    bgGradient = `linear-gradient(180deg, rgba(255,255,255,0.04) 0%, transparent 50%), #1b1b1b`;
  } else if (isSelected) {
    borderColor = "rgba(88,101,242,0.55)";
    shadowVal = "0 0 0 3px rgba(88,101,242,0.15), 0 0 24px rgba(88,101,242,0.08), 0 8px 32px rgba(0,0,0,0.6)";
    bgGradient = `linear-gradient(180deg, ${accentColor}08 0%, transparent 60%), #1b1b1b`;
  } else {
    borderColor = "rgba(255,255,255,0.07)";
    shadowVal = "0 2px 8px rgba(0,0,0,0.5), 0 0 0 1px rgba(255,255,255,0.04)";
    bgGradient = `linear-gradient(180deg, rgba(255,255,255,0.025) 0%, transparent 60%), #1b1b1b`;
  }

  return (
    <div
      data-testid={`node-${id}`}
      onClick={() => setSelectedNode(id)}
      style={{
        background: bgGradient,
        border: `1px solid ${borderColor}`,
        borderRadius: 12,
        minWidth: 220,
        cursor: "pointer",
        position: "relative",
        boxShadow: shadowVal,
        transition: "border-color 0.15s cubic-bezier(0.4,0,0.2,1), box-shadow 0.15s cubic-bezier(0.4,0,0.2,1)",
        overflow: "hidden",
      }}
    >
      {/* Accent gradient top bar */}
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          height: 2,
          background: `linear-gradient(90deg, ${accentColor}, ${accentColor}60, transparent)`,
          borderRadius: "12px 12px 0 0",
        }}
      />

      {/* Connection target pulse ring */}
      {isConnectionTarget && (
        <div
          style={{
            position: "absolute",
            inset: -5,
            borderRadius: 17,
            border: "1.5px solid rgba(255,255,255,0.25)",
            pointerEvents: "none",
            animation: "pulseRing 0.65s ease-in-out infinite alternate",
          }}
        />
      )}

      {/* Handle visibility overrides */}
      {nodeClass === "sub" && (
        <style>{`[data-testid="node-${id}"] .react-flow__handle-right{opacity:0!important;pointer-events:none!important}`}</style>
      )}
      {nodeClass === "root" && (
        <style>{`[data-testid="node-${id}"] .react-flow__handle{opacity:0!important;pointer-events:none!important}`}</style>
      )}

      {/* ── Header ── */}
      <div
        style={{
          padding: "10px 12px 9px",
          borderBottom: "1px solid rgba(255,255,255,0.05)",
          display: "flex",
          alignItems: "center",
          gap: 8,
          background: `linear-gradient(90deg, ${accentColor}12 0%, ${accentColor}05 40%, transparent 100%)`,
        }}
      >
        <div
          style={{
            width: 26,
            height: 26,
            borderRadius: 7,
            background: `linear-gradient(135deg, ${accentColor}30, ${accentColor}15)`,
            border: `1px solid ${accentColor}25`,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: accentColor,
            flexShrink: 0,
            boxShadow: `0 0 8px ${accentColor}15`,
          }}
        >
          {icon}
        </div>

        <span
          style={{
            color: "rgba(255,255,255,0.5)",
            fontSize: 10,
            fontWeight: 600,
            textTransform: "uppercase",
            letterSpacing: "0.09em",
            userSelect: "none",
            flex: 1,
          }}
        >
          {typeName}
        </span>

        <span
          style={{
            background: badgeColor + "12",
            border: `1px solid ${badgeColor}25`,
            color: badgeColor,
            fontSize: 8,
            fontWeight: 700,
            letterSpacing: "0.08em",
            padding: "1px 5px",
            borderRadius: 4,
            textTransform: "uppercase",
            userSelect: "none",
            opacity: 0.85,
          }}
        >
          {badgeLabel}
        </span>

        {isSelected && (
          <div
            style={{
              width: 6,
              height: 6,
              borderRadius: "50%",
              background: "#5865F2",
              flexShrink: 0,
              boxShadow: "0 0 6px rgba(88,101,242,0.7)",
            }}
          />
        )}
      </div>

      {/* ── Body ── */}
      <div style={{ padding: "10px 12px 12px" }}>{children}</div>
    </div>
  );
}
