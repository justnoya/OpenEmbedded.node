// @ts-nocheck
import { ReactNode } from "react";
import { useStore } from "@xyflow/react";
import { useGraphStore } from "../../lib/graphStore.js";
import { NodeClass } from "../../lib/connectionRules.js";
import { X } from "lucide-react";

interface NodeWrapperProps {
  id: string;
  children: ReactNode;
  typeName: string;
  icon: ReactNode;
  accentColor: string;
  nodeClass?: NodeClass;
  showInteractionHandle?: boolean;
  showSendHandle?: boolean;
  showBothHandles?: boolean;
}

export function NodeWrapper({
  id,
  children,
  typeName,
  icon,
  accentColor,
  nodeClass = "sub",
  showInteractionHandle = false,
  showSendHandle = false,
  showBothHandles = false,
}: NodeWrapperProps) {
  const selectedNodeId = useGraphStore((s) => s.selectedNodeId);
  const setSelectedNode = useGraphStore((s) => s.setSelectedNode);
  const deleteNode = useGraphStore((s) => s.removeNode);
  const isSelected = selectedNodeId === id;
  const connectionToNodeId = useStore((s) => s.connection?.toNode?.id);
  const isConnectionTarget = connectionToNodeId === id;

  const dotIdx = typeName.indexOf(" · ");
  const label = dotIdx >= 0 ? typeName.slice(0, dotIdx) : typeName;
  const subtitle = dotIdx >= 0 ? typeName.slice(dotIdx + 3) : null;

  let borderColor: string;
  let boxShadow: string;

  if (isConnectionTarget) {
    borderColor = `${accentColor}90`;
    boxShadow = `0 0 0 2px ${accentColor}25, 0 4px 20px rgba(0,0,0,0.5)`;
  } else if (isSelected) {
    borderColor = `${accentColor}70`;
    boxShadow = `0 0 0 1px ${accentColor}20, 0 4px 20px rgba(0,0,0,0.5)`;
  } else {
    borderColor = "rgba(255,255,255,0.07)";
    boxShadow = "0 1px 6px rgba(0,0,0,0.4)";
  }

  return (
    <div style={{ position: "relative" }}>
      {/* Delete button — appears when selected */}
      {isSelected && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            deleteNode(id);
          }}
          title="Delete node"
          style={{
            position: "absolute",
            top: -28,
            right: 0,
            zIndex: 10,
            display: "flex",
            alignItems: "center",
            gap: 4,
            background: "#1a1a1a",
            border: "1px solid rgba(248,81,73,0.3)",
            borderRadius: 6,
            color: "#f85149",
            fontSize: 11,
            fontWeight: 600,
            padding: "3px 8px",
            cursor: "pointer",
            boxShadow: "0 2px 8px rgba(0,0,0,0.5)",
            whiteSpace: "nowrap",
            transition: "background 0.1s, border-color 0.1s",
          }}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLElement).style.background = "rgba(248,81,73,0.1)";
            (e.currentTarget as HTMLElement).style.borderColor = "rgba(248,81,73,0.55)";
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLElement).style.background = "#1a1a1a";
            (e.currentTarget as HTMLElement).style.borderColor = "rgba(248,81,73,0.3)";
          }}
        >
          <X size={10} strokeWidth={2.5} />
          Delete
        </button>
      )}

      <div
        data-testid={`node-${id}`}
        onClick={() => setSelectedNode(id)}
        style={{
          background: "#1a1a1a",
          border: `1px solid ${borderColor}`,
          borderRadius: 8,
          minWidth: 220,
          cursor: "pointer",
          position: "relative",
          boxShadow,
          transition: "border-color 0.12s, box-shadow 0.12s",
          display: "flex",
          flexDirection: "column",
        }}
      >
        {/* Connection target pulse ring */}
        {isConnectionTarget && (
          <div
            style={{
              position: "absolute", inset: -3, borderRadius: 10,
              border: `1px solid ${accentColor}40`,
              pointerEvents: "none",
              animation: "pulseRing 0.7s ease-in-out infinite alternate",
            }}
          />
        )}

        {/* Left accent bar */}
        <div
          style={{
            position: "absolute",
            left: 0, top: 0, bottom: 0,
            width: 3,
            background: isSelected ? accentColor : `${accentColor}70`,
            borderRadius: "8px 0 0 8px",
            transition: "background 0.12s",
          }}
        />

        {/* Handle visibility rules */}
        {nodeClass === "sub" && (
          <style>{`[data-testid="node-${id}"] .react-flow__handle-right{opacity:0!important;pointer-events:none!important}`}</style>
        )}
        {nodeClass === "interactive" && !showInteractionHandle && (
          <style>{`[data-testid="node-${id}"] .react-flow__handle-right{opacity:0!important;pointer-events:none!important}`}</style>
        )}
        {nodeClass === "root" && !showSendHandle && !showBothHandles && (
          <style>{`[data-testid="node-${id}"] .react-flow__handle{opacity:0!important;pointer-events:none!important}`}</style>
        )}
        {nodeClass === "root" && showSendHandle && !showBothHandles && (
          <style>{`[data-testid="node-${id}"] .react-flow__handle-left{opacity:0!important;pointer-events:none!important}`}</style>
        )}

        {/* ── Header ── */}
        <div
          style={{
            padding: "10px 12px 10px 16px",
            display: "flex",
            alignItems: "center",
            gap: 9,
          }}
        >
          {/* Icon */}
          <div
            style={{
              width: 28, height: 28, borderRadius: 7,
              background: `${accentColor}18`,
              border: `1px solid ${accentColor}28`,
              display: "flex", alignItems: "center", justifyContent: "center",
              color: accentColor,
              flexShrink: 0,
            }}
          >
            {icon}
          </div>

          {/* Label + subtitle */}
          <div style={{ flex: 1, minWidth: 0 }}>
            <div
              style={{
                color: "#e0e0e0",
                fontSize: 12.5,
                fontWeight: 600,
                lineHeight: 1.25,
                letterSpacing: "-0.01em",
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
              }}
            >
              {label}
            </div>
            {subtitle && (
              <div
                style={{
                  color: "#404040",
                  fontSize: 10,
                  fontWeight: 500,
                  marginTop: 1.5,
                  letterSpacing: "0.01em",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                }}
              >
                {isNaN(Number(subtitle)) ? subtitle : `#${subtitle}`}
              </div>
            )}
          </div>

          {/* Status dot */}
          <div
            style={{
              width: 6, height: 6, borderRadius: "50%",
              background: isSelected ? accentColor : `${accentColor}40`,
              flexShrink: 0,
              boxShadow: isSelected ? `0 0 5px ${accentColor}80` : "none",
              transition: "background 0.12s, box-shadow 0.12s",
            }}
          />
        </div>

        {/* Divider */}
        <div style={{ height: 1, background: "rgba(255,255,255,0.04)", marginLeft: 16 }} />

        {/* ── Body ── */}
        <div style={{ padding: "9px 12px 10px 16px" }}>
          {children}
        </div>
      </div>
    </div>
  );
}
