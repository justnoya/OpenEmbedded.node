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
  showInteractionHandle?: boolean;
}

export function NodeWrapper({
  id, children, typeName, icon, accentColor, nodeClass = "sub", showInteractionHandle = false,
}: NodeWrapperProps) {
  const selectedNodeId = useGraphStore((s) => s.selectedNodeId);
  const setSelectedNode = useGraphStore((s) => s.setSelectedNode);
  const isSelected = selectedNodeId === id;
  const connectionToNodeId = useStore((s) => s.connection?.toNode?.id);
  const isConnectionTarget = connectionToNodeId === id;

  const badgeColor = NODE_CLASS_COLORS[nodeClass];
  const badgeLabel = NODE_CLASS_LABELS[nodeClass];

  let borderColor: string;
  let shadowVal: string;

  if (isConnectionTarget) {
    borderColor = "rgba(255,255,255,0.22)";
    shadowVal = "0 0 0 1px rgba(255,255,255,0.06)";
  } else if (isSelected) {
    borderColor = "rgba(255,255,255,0.18)";
    shadowVal = `0 0 0 1px ${accentColor}18`;
  } else {
    borderColor = "rgba(255,255,255,0.07)";
    shadowVal = "0 1px 3px rgba(0,0,0,0.35)";
  }

  return (
    <div
      data-testid={`node-${id}`}
      onClick={() => setSelectedNode(id)}
      style={{
        background: "#161616",
        border: `1px solid ${borderColor}`,
        borderRadius: 8,
        minWidth: 220,
        cursor: "pointer",
        position: "relative",
        boxShadow: shadowVal,
        transition: "border-color 0.12s, box-shadow 0.12s",
        overflow: "hidden",
        display: "flex",
        flexDirection: "column",
      }}
    >
      {/* Left accent strip */}
      <div
        style={{
          position: "absolute",
          top: 0, left: 0, bottom: 0,
          width: 2,
          background: accentColor,
          opacity: isSelected ? 1 : 0.55,
          transition: "opacity 0.12s",
        }}
      />

      {/* Connection target ring */}
      {isConnectionTarget && (
        <div
          style={{
            position: "absolute", inset: -4, borderRadius: 12,
            border: "1px solid rgba(255,255,255,0.14)",
            pointerEvents: "none",
            animation: "pulseRing 0.65s ease-in-out infinite alternate",
          }}
        />
      )}

      {/* Handle visibility */}
      {nodeClass === "sub" && (
        <style>{`[data-testid="node-${id}"] .react-flow__handle-right{opacity:0!important;pointer-events:none!important}`}</style>
      )}
      {nodeClass === "interactive" && !showInteractionHandle && (
        <style>{`[data-testid="node-${id}"] .react-flow__handle-right{opacity:0!important;pointer-events:none!important}`}</style>
      )}
      {nodeClass === "root" && (
        <style>{`[data-testid="node-${id}"] .react-flow__handle{opacity:0!important;pointer-events:none!important}`}</style>
      )}

      {/* ── Header ── */}
      <div
        style={{
          padding: "8px 10px 8px 14px",
          borderBottom: "1px solid rgba(255,255,255,0.05)",
          display: "flex", alignItems: "center", gap: 7,
        }}
      >
        <div
          style={{
            color: accentColor,
            display: "flex", alignItems: "center", justifyContent: "center",
            flexShrink: 0, opacity: 0.9,
          }}
        >
          {icon}
        </div>

        <span
          style={{
            color: "rgba(255,255,255,0.55)", fontSize: 10, fontWeight: 600,
            textTransform: "uppercase", letterSpacing: "0.09em",
            userSelect: "none", flex: 1,
          }}
        >
          {typeName}
        </span>

        <span
          style={{
            color: badgeColor,
            fontSize: 8, fontWeight: 700, letterSpacing: "0.07em",
            opacity: 0.5,
            textTransform: "uppercase", userSelect: "none",
          }}
        >
          {badgeLabel}
        </span>

        {isSelected && (
          <div
            style={{
              width: 4, height: 4, borderRadius: "50%",
              background: accentColor, flexShrink: 0,
            }}
          />
        )}
      </div>

      {/* ── Body ── */}
      <div style={{ padding: "10px 10px 11px 14px" }}>{children}</div>
    </div>
  );
}
