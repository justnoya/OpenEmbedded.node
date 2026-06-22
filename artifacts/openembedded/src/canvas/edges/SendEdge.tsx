import { BaseEdge, EdgeLabelRenderer, getBezierPath, useReactFlow, type EdgeProps } from "@xyflow/react";
import { useGraphStore } from "@/lib/graphStore";
import { Send, X } from "lucide-react";

export function SendEdge({
  id,
  sourceX, sourceY,
  targetX, targetY,
  sourcePosition, targetPosition,
  selected,
}: EdgeProps) {
  const [edgePath, labelX, labelY] = getBezierPath({
    sourceX, sourceY, sourcePosition,
    targetX, targetY, targetPosition,
  });

  const removeEdge = useGraphStore((s) => s.removeEdge);
  const { setEdges } = useReactFlow();

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    removeEdge(id);
    setEdges((eds) => eds.filter((edge) => edge.id !== id));
  };

  const color = "#3fb950";
  const strokeColor = selected ? "#4ade80" : color;
  const glowFilter = selected
    ? `drop-shadow(0 0 7px ${color}90)`
    : `drop-shadow(0 0 4px ${color}40)`;

  return (
    <>
      <path d={edgePath} fill="none" stroke="transparent" strokeWidth={18} style={{ cursor: "pointer" }} />

      <BaseEdge
        id={id}
        path={edgePath}
        style={{
          stroke: strokeColor,
          strokeWidth: selected ? 2 : 1.5,
          strokeDasharray: "6 4",
          filter: glowFilter,
          transition: "stroke 0.12s, stroke-width 0.12s",
        }}
      />

      <EdgeLabelRenderer>
        <div
          style={{
            position: "absolute",
            transform: `translate(-50%, -50%) translate(${labelX}px, ${labelY}px)`,
            pointerEvents: "all",
            zIndex: 10,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 5,
          }}
          className="nodrag nopan"
        >
          <div
            style={{
              background: "#141414",
              border: `1px solid ${color}50`,
              borderRadius: 7,
              padding: "3px 8px",
              display: "flex",
              alignItems: "center",
              gap: 5,
              boxShadow: `0 0 10px ${color}20, 0 2px 8px rgba(0,0,0,0.5)`,
              backdropFilter: "blur(4px)",
            }}
          >
            <Send size={9} color={color} />
            <span style={{ color, fontSize: 10, fontWeight: 700, letterSpacing: "0.06em" }}>
              SENDS
            </span>
          </div>

          {selected && (
            <button
              onClick={handleDelete}
              title="Remove connection"
              style={{
                display: "flex", alignItems: "center", justifyContent: "center",
                width: 20, height: 20, borderRadius: "50%",
                background: "#1e1e1e",
                border: `1.5px solid ${color}`,
                color, cursor: "pointer", padding: 0,
                boxShadow: "0 2px 10px rgba(0,0,0,0.7)",
                transition: "all 0.12s",
              }}
              onMouseEnter={(e) => {
                const el = e.currentTarget as HTMLElement;
                el.style.background = "#f85149";
                el.style.borderColor = "#f85149";
                el.style.color = "#fff";
              }}
              onMouseLeave={(e) => {
                const el = e.currentTarget as HTMLElement;
                el.style.background = "#1e1e1e";
                el.style.borderColor = color;
                el.style.color = color;
              }}
            >
              <X size={10} strokeWidth={2.5} />
            </button>
          )}
        </div>
      </EdgeLabelRenderer>
    </>
  );
}
