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
  /** When true, the right (source) handle is NOT hidden — used for interactive nodes that emit interaction edges. */
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
    borderColor = "rgba(255,255,255,0.3)";
    shadowVal = "0 0 0 2px rgba(255,255,255,0.08), 0 4px 16px rgba(0,0,0,0.5)";
  } else if (isSelected) {
    borderColor = accentColor + "90";
    shadowVal = `0 0 0 2px ${accentColor}20, 0 4px 16px rgba(0,0,0,0.5)`;
  } else {
    borderColor = "rgba(255,255,255,0.08)";
    shadowVal = "0 1px 4px rgba(0,0,0,0.4)";
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
        transition: "border-color 0.15s ease, box-shadow 0.15s ease",
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
          width: 3,
          background: accentColor,
          borderRadius: "8px 0 0 8px",
          opacity: isSelected ? 1 : 0.6,
          transition: "opacity 0.15s ease",
        }}
      />

      {/* Connection target pulse ring */}
      {isConnectionTarget && (
        <div
          style={{
            position: "absolute", inset: -5, borderRadius: 13,
            border: "1.5px solid rgba(255,255,255,0.2)",
            pointerEvents: "none",
            animation: "pulseRing 0.65s ease-in-out infinite alternate",
          }}
        />
      )}

      {/* Handle visibility overrides */}
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
          padding: "9px 12px 9px 18px",
          borderBottom: "1px solid rgba(255,255,255,0.06)",
          display: "flex", alignItems: "center", gap: 8,
          background: "rgba(255,255,255,0.025)",
        }}
      >
        <div
          style={{
            width: 24, height: 24, borderRadius: 6,
            background: accentColor + "1a",
            border: `1px solid ${accentColor}30`,
            display: "flex", alignItems: "center", justifyContent: "center",
            color: accentColor, flexShrink: 0,
          }}
        >
          {icon}
        </div>

        <span
          style={{
            color: "rgba(255,255,255,0.45)", fontSize: 10, fontWeight: 600,
            textTransform: "uppercase", letterSpacing: "0.08em",
            userSelect: "none", flex: 1,
          }}
        >
          {typeName}
        </span>

        <span
          style={{
            background: badgeColor + "15",
            border: `1px solid ${badgeColor}22`,
            color: badgeColor,
            fontSize: 8, fontWeight: 700, letterSpacing: "0.07em",
            padding: "1px 5px", borderRadius: 3,
            textTransform: "uppercase", userSelect: "none", opacity: 0.8,
          }}
        >
          {badgeLabel}
        </span>

        {isSelected && (
          <div
            style={{
              width: 5, height: 5, borderRadius: "50%",
              background: accentColor, flexShrink: 0,
            }}
          />
        )}
      </div>

      {/* ── Body ── */}
      <div style={{ padding: "10px 12px 12px 18px" }}>{children}</div>
    </div>
  );
}
