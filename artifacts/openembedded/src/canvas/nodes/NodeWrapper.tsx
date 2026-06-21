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

  let outline = "none";
  let borderColor = "#333333";
  let shadowVal = "0 1px 4px rgba(0,0,0,0.5)";

  if (isConnectionTarget) {
    borderColor = "#ffffff";
    outline = "2px solid rgba(255,255,255,0.5)";
    shadowVal = "0 0 0 3px rgba(255,255,255,0.1), 0 8px 24px rgba(0,0,0,0.6)";
  } else if (isSelected) {
    borderColor = "#5865F2";
    outline = "2px solid rgba(88,101,242,0.4)";
    shadowVal = "0 0 0 3px rgba(88,101,242,0.12), 0 8px 24px rgba(0,0,0,0.6)";
  }

  return (
    <div
      data-testid={`node-${id}`}
      onClick={() => setSelectedNode(id)}
      style={{
        background: "#242424",
        border: `1px solid ${borderColor}`,
        borderLeft: `3px solid ${accentColor}`,
        borderRadius: 10,
        minWidth: 216,
        cursor: "pointer",
        position: "relative",
        outline,
        outlineOffset: 0,
        boxShadow: shadowVal,
        transition: "border-color 0.12s, box-shadow 0.12s, outline 0.12s",
      }}
    >
      {isConnectionTarget && (
        <div
          style={{
            position: "absolute",
            inset: -4,
            borderRadius: 14,
            border: "2px solid rgba(255,255,255,0.35)",
            pointerEvents: "none",
            animation: "pulseRing 0.7s ease-in-out infinite alternate",
          }}
        />
      )}

      {nodeClass === "sub" && (
        <style>{`[data-testid="node-${id}"] .react-flow__handle-right{opacity:0!important;pointer-events:none!important}`}</style>
      )}
      {nodeClass === "root" && (
        <style>{`[data-testid="node-${id}"] .react-flow__handle{opacity:0!important;pointer-events:none!important}`}</style>
      )}

      {/* Header */}
      <div
        style={{
          padding: "8px 10px 7px",
          borderBottom: "1px solid #333333",
          display: "flex",
          alignItems: "center",
          gap: 7,
        }}
      >
        <div
          style={{
            width: 24,
            height: 24,
            borderRadius: 6,
            background: accentColor + "18",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: accentColor,
            flexShrink: 0,
          }}
        >
          {icon}
        </div>

        <span
          style={{
            color: "#999999",
            fontSize: 10,
            fontWeight: 600,
            textTransform: "uppercase",
            letterSpacing: "0.08em",
            userSelect: "none",
            flex: 1,
          }}
        >
          {typeName}
        </span>

        <span
          style={{
            background: badgeColor + "15",
            border: `1px solid ${badgeColor}30`,
            color: badgeColor,
            fontSize: 8,
            fontWeight: 700,
            letterSpacing: "0.07em",
            padding: "1px 5px",
            borderRadius: 4,
            textTransform: "uppercase",
            userSelect: "none",
          }}
        >
          {badgeLabel}
        </span>

        {isSelected && (
          <div
            style={{
              width: 5,
              height: 5,
              borderRadius: "50%",
              background: "#5865F2",
              flexShrink: 0,
              boxShadow: "0 0 4px rgba(88,101,242,0.6)",
            }}
          />
        )}
      </div>

      {/* Body */}
      <div style={{ padding: "9px 12px 11px" }}>{children}</div>

      <style>{`
        @keyframes pulseRing {
          from { opacity: 0.4; transform: scale(1); }
          to   { opacity: 0.9; transform: scale(1.015); }
        }
      `}</style>
    </div>
  );
}
