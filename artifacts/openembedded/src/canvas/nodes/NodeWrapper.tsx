import { ReactNode } from "react";
import { useStore } from "@xyflow/react";
import { useGraphStore } from "@/lib/graphStore";
import { NodeClass, NODE_CLASS_LABELS, NODE_CLASS_COLORS } from "@/lib/connectionRules";
import { Trash2 } from "lucide-react";

interface NodeWrapperProps {
  id: string;
  children: ReactNode;
  typeName: string;
  icon: ReactNode;
  accentColor: string;
  nodeClass?: NodeClass;
  showInteractionHandle?: boolean;
  /** When true (bot nodes), show the right (source) handle but hide the left (target) handle. */
  showSendHandle?: boolean;
}

export function NodeWrapper({
  id, children, typeName, icon, accentColor, nodeClass = "sub", showInteractionHandle = false, showSendHandle = false,
}: NodeWrapperProps) {
  const selectedNodeId = useGraphStore((s) => s.selectedNodeId);
  const setSelectedNode = useGraphStore((s) => s.setSelectedNode);
  const deleteNode = useGraphStore((s) => s.removeNode);
  const isSelected = selectedNodeId === id;
  const connectionToNodeId = useStore((s) => s.connection?.toNode?.id);
  const isConnectionTarget = connectionToNodeId === id;

  const badgeColor = NODE_CLASS_COLORS[nodeClass];
  const badgeLabel = NODE_CLASS_LABELS[nodeClass];

  /* Parse "Action Row · 1" → label="Action Row", subtitle="1" */
  const dotIdx = typeName.indexOf(" · ");
  const label = dotIdx >= 0 ? typeName.slice(0, dotIdx) : typeName;
  const subtitle = dotIdx >= 0 ? typeName.slice(dotIdx + 3) : null;

  let borderColor: string;
  let shadow: string;

  if (isConnectionTarget) {
    borderColor = "rgba(255,255,255,0.22)";
    shadow = `0 0 0 2px rgba(255,255,255,0.05)`;
  } else if (isSelected) {
    borderColor = accentColor + "80";
    shadow = `0 0 0 2px ${accentColor}18, 0 4px 24px rgba(0,0,0,0.55)`;
  } else {
    borderColor = "rgba(255,255,255,0.08)";
    shadow = "0 2px 10px rgba(0,0,0,0.45)";
  }

  return (
    <div style={{ position: "relative" }}>
      {/* Delete tooltip button — visible when selected */}
      {isSelected && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            deleteNode(id);
          }}
          title="Delete node"
          style={{
            position: "absolute",
            top: -32,
            right: 0,
            zIndex: 10,
            display: "flex",
            alignItems: "center",
            gap: 5,
            background: "rgba(30,30,30,0.96)",
            border: "1px solid rgba(248,81,73,0.35)",
            borderRadius: 7,
            color: "#f85149",
            fontSize: 11,
            fontWeight: 600,
            padding: "4px 9px",
            cursor: "pointer",
            backdropFilter: "blur(8px)",
            WebkitBackdropFilter: "blur(8px)",
            boxShadow: "0 2px 10px rgba(0,0,0,0.5)",
            transition: "background 0.12s, border-color 0.12s",
            whiteSpace: "nowrap",
          }}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLElement).style.background = "rgba(248,81,73,0.12)";
            (e.currentTarget as HTMLElement).style.borderColor = "rgba(248,81,73,0.6)";
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLElement).style.background = "rgba(30,30,30,0.96)";
            (e.currentTarget as HTMLElement).style.borderColor = "rgba(248,81,73,0.35)";
          }}
        >
          <Trash2 size={12} />
          Delete
        </button>
      )}

      <div
        data-testid={`node-${id}`}
        onClick={() => setSelectedNode(id)}
        style={{
          background: "#252525",
          border: `1px solid ${borderColor}`,
          borderRadius: 12,
          minWidth: 210,
          cursor: "pointer",
          position: "relative",
          boxShadow: shadow,
          transition: "border-color 0.12s, box-shadow 0.12s",
          overflow: "hidden",
          display: "flex",
          flexDirection: "column",
        }}
      >
        {/* Connection target pulse ring */}
        {isConnectionTarget && (
          <div
            style={{
              position: "absolute", inset: -4, borderRadius: 16,
              border: "1px solid rgba(255,255,255,0.14)",
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
        {nodeClass === "root" && !showSendHandle && (
          <style>{`[data-testid="node-${id}"] .react-flow__handle{opacity:0!important;pointer-events:none!important}`}</style>
        )}
        {nodeClass === "root" && showSendHandle && (
          <style>{`[data-testid="node-${id}"] .react-flow__handle-left{opacity:0!important;pointer-events:none!important}`}</style>
        )}

        {/* ── Header ── */}
        <div
          style={{
            padding: "12px 13px 11px",
            display: "flex", alignItems: "center", gap: 11,
          }}
        >
          {/* Large icon box */}
          <div
            style={{
              width: 36, height: 36, borderRadius: 9,
              background: accentColor + "22",
              border: `1px solid ${accentColor}35`,
              display: "flex", alignItems: "center", justifyContent: "center",
              color: "rgba(255,255,255,0.88)", flexShrink: 0,
            }}
          >
            {icon}
          </div>

          {/* Label + subtitle */}
          <div style={{ flex: 1, minWidth: 0 }}>
            <div
              style={{
                color: "#e2e2e2", fontSize: 13, fontWeight: 600,
                lineHeight: 1.25, letterSpacing: "-0.01em",
                overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
              }}
            >
              {label}
            </div>
            {subtitle && (
              <div
                style={{
                  color: "#3d3d3d", fontSize: 10, fontWeight: 500,
                  marginTop: 2, letterSpacing: "0.02em",
                }}
              >
                {isNaN(Number(subtitle)) ? subtitle : `Component ${subtitle}`}
              </div>
            )}
          </div>

          {/* Node class badge */}
          <span
            style={{
              color: badgeColor, fontSize: 8, fontWeight: 700,
              opacity: 0.45, textTransform: "uppercase",
              letterSpacing: "0.07em", flexShrink: 0,
            }}
          >
            {badgeLabel}
          </span>

          {/* Selected indicator dot */}
          {isSelected && (
            <div
              style={{
                width: 5, height: 5, borderRadius: "50%",
                background: accentColor, flexShrink: 0,
                boxShadow: `0 0 6px ${accentColor}`,
              }}
            />
          )}
        </div>

        {/* ── Body ── */}
        <div style={{ padding: "0 13px 12px" }}>
          {children}
        </div>
      </div>
    </div>
  );
}
