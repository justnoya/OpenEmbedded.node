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

  // Detect when a connection wire is being dragged over this node
  const connectionToNodeId = useStore((s) => s.connection?.toNode?.id);
  const isConnectionTarget = connectionToNodeId === id;

  const badgeColor = NODE_CLASS_COLORS[nodeClass];
  const badgeLabel = NODE_CLASS_LABELS[nodeClass];

  let borderColor = "#2A2F3A";
  let boxShadow = "0 2px 10px rgba(0,0,0,0.35)";

  if (isConnectionTarget) {
    borderColor = "#ffffff";
    boxShadow = "0 0 0 2px rgba(255,255,255,0.6), 0 0 16px rgba(255,255,255,0.15), 0 8px 28px rgba(0,0,0,0.6)";
  } else if (isSelected) {
    borderColor = "#ffffff";
    boxShadow = "0 0 0 2px #ffffff, 0 8px 28px rgba(0,0,0,0.6)";
  }

  return (
    <div
      data-testid={`node-${id}`}
      onClick={() => setSelectedNode(id)}
      style={{
        background: "#1A1C24",
        border: `1px solid ${borderColor}`,
        borderLeft: `3px solid ${accentColor}`,
        borderRadius: 8,
        minWidth: 210,
        cursor: "pointer",
        position: "relative",
        boxShadow,
        transition: "box-shadow 0.12s, border-color 0.12s",
      }}
    >
      {/* Animated ring shown while a wire is hovering over this node */}
      {isConnectionTarget && (
        <div
          style={{
            position: "absolute",
            inset: -3,
            borderRadius: 11,
            border: "2px solid rgba(255,255,255,0.5)",
            pointerEvents: "none",
            animation: "pulseRing 0.8s ease-in-out infinite alternate",
          }}
        />
      )}

      {/* Hide source (right) handle for sub-nodes — they cannot parent others */}
      {nodeClass === "sub" && (
        <style>{`
          [data-testid="node-${id}"] .react-flow__handle-right {
            opacity: 0 !important;
            pointer-events: none !important;
            cursor: not-allowed !important;
          }
        `}</style>
      )}
      {/* Root nodes (embed) have no handles at all */}
      {nodeClass === "root" && (
        <style>{`
          [data-testid="node-${id}"] .react-flow__handle {
            opacity: 0 !important;
            pointer-events: none !important;
          }
        `}</style>
      )}

      <div
        style={{
          padding: "7px 10px 6px",
          borderBottom: "1px solid rgba(255,255,255,0.05)",
          display: "flex",
          alignItems: "center",
          gap: 7,
        }}
      >
        <div
          style={{
            width: 22,
            height: 22,
            borderRadius: 5,
            background: accentColor + "22",
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
            color: "#7d8590",
            fontSize: 10,
            fontWeight: 600,
            textTransform: "uppercase",
            letterSpacing: "0.07em",
            userSelect: "none",
          }}
        >
          {typeName}
        </span>

        {/* Class badge */}
        <div
          style={{
            marginLeft: "auto",
            display: "flex",
            alignItems: "center",
            gap: 4,
            flexShrink: 0,
          }}
        >
          <span
            title={
              nodeClass === "main"
                ? "Layout node — can contain child components"
                : nodeClass === "root"
                ? "Standalone embed — no children"
                : "Component node — connects to a layout parent"
            }
            style={{
              background: badgeColor + "1a",
              border: `1px solid ${badgeColor}40`,
              color: badgeColor,
              fontSize: 8,
              fontWeight: 700,
              letterSpacing: "0.08em",
              padding: "1px 5px",
              borderRadius: 3,
              textTransform: "uppercase",
              userSelect: "none",
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
                background: accentColor,
                flexShrink: 0,
              }}
            />
          )}
        </div>
      </div>
      <div style={{ padding: "8px 12px 10px" }}>{children}</div>

      <style>{`
        @keyframes pulseRing {
          from { opacity: 0.5; transform: scale(1); }
          to   { opacity: 1;   transform: scale(1.01); }
        }
      `}</style>
    </div>
  );
}
