import { ReactNode } from "react";
import { useGraphStore } from "@/lib/graphStore";

interface NodeWrapperProps {
  id: string;
  children: ReactNode;
  typeName: string;
  icon: ReactNode;
  accentColor: string;
}

export function NodeWrapper({ id, children, typeName, icon, accentColor }: NodeWrapperProps) {
  const selectedNodeId = useGraphStore((s) => s.selectedNodeId);
  const setSelectedNode = useGraphStore((s) => s.setSelectedNode);
  const isSelected = selectedNodeId === id;

  return (
    <div
      data-testid={`node-${id}`}
      onClick={() => setSelectedNode(id)}
      style={{
        background: "#1c2128",
        border: `1px solid ${isSelected ? accentColor + "99" : "rgba(255,255,255,0.07)"}`,
        borderLeft: `3px solid ${accentColor}`,
        borderRadius: 8,
        minWidth: 210,
        cursor: "pointer",
        position: "relative",
        boxShadow: isSelected
          ? `0 0 0 3px ${accentColor}18, 0 8px 28px rgba(0,0,0,0.55)`
          : "0 2px 10px rgba(0,0,0,0.35)",
        transition: "box-shadow 0.15s, border-color 0.15s",
      }}
    >
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
        {isSelected && (
          <div
            style={{
              marginLeft: "auto",
              width: 6,
              height: 6,
              borderRadius: "50%",
              background: accentColor,
              flexShrink: 0,
            }}
          />
        )}
      </div>
      <div style={{ padding: "8px 12px 10px" }}>{children}</div>
    </div>
  );
}
