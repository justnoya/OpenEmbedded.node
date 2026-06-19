import { ReactNode } from "react";
import { useGraphStore } from "@/lib/graphStore";

interface NodeWrapperProps {
  id: string;
  children: ReactNode;
  typeBadge: string;
  badgeColor?: string;
  className?: string;
}

export function NodeWrapper({ id, children, typeBadge, badgeColor = "#424549", className = "" }: NodeWrapperProps) {
  const selectedNodeId = useGraphStore((s) => s.selectedNodeId);
  const setSelectedNode = useGraphStore((s) => s.setSelectedNode);
  const isSelected = selectedNodeId === id;

  return (
    <div
      data-testid={`node-${id}`}
      onClick={() => setSelectedNode(id)}
      style={{
        background: "#36393E",
        border: isSelected ? "2px solid #5865F2" : "1px solid rgba(255,255,255,0.063)",
        boxShadow: isSelected ? "0 0 0 4px rgba(88,101,242,0.13)" : "0 4px 16px rgba(0,0,0,0.5)",
        borderRadius: 8,
        minWidth: 180,
        cursor: "pointer",
        position: "relative",
      }}
      className={className}
    >
      <div
        style={{
          position: "absolute",
          top: 6,
          left: 8,
          background: badgeColor,
          color: "#949B9D",
          fontSize: 10,
          fontWeight: 500,
          padding: "1px 6px",
          borderRadius: 4,
          letterSpacing: "0.05em",
          textTransform: "uppercase",
          zIndex: 1,
          pointerEvents: "none",
        }}
      >
        {typeBadge}
      </div>
      <div style={{ paddingTop: 28, padding: "28px 12px 12px 12px" }}>{children}</div>
    </div>
  );
}
