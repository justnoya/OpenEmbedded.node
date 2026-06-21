import { BaseEdge, EdgeLabelRenderer, getBezierPath, useReactFlow, type EdgeProps } from "@xyflow/react";
import { useGraphStore } from "@/lib/graphStore";
import { X } from "lucide-react";

export function CustomEdge({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  selected,
  markerEnd,
}: EdgeProps) {
  const [edgePath, labelX, labelY] = getBezierPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
  });

  const removeEdge = useGraphStore((s) => s.removeEdge);
  const { setEdges } = useReactFlow();

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    removeEdge(id);
    setEdges((eds) => eds.filter((edge) => edge.id !== id));
  };

  const strokeColor = selected ? "#818cf8" : "#5865F2";
  const strokeWidth = selected ? 2.5 : 1.5;
  const glowFilter = selected
    ? "drop-shadow(0 0 6px rgba(129,140,248,0.5))"
    : "drop-shadow(0 0 3px rgba(88,101,242,0.25))";

  return (
    <>
      {/* Wide invisible hit-area */}
      <path d={edgePath} fill="none" stroke="transparent" strokeWidth={18} style={{ cursor: "pointer" }} />

      <BaseEdge
        id={id}
        path={edgePath}
        markerEnd={markerEnd}
        style={{
          stroke: strokeColor,
          strokeWidth,
          filter: glowFilter,
          transition: "stroke 0.12s, stroke-width 0.12s",
        }}
      />

      {selected && (
        <EdgeLabelRenderer>
          <div
            style={{
              position: "absolute",
              transform: `translate(-50%, -50%) translate(${labelX}px, ${labelY}px)`,
              pointerEvents: "all",
              zIndex: 10,
              animation: "scaleIn 0.1s cubic-bezier(0.4,0,0.2,1)",
            }}
            className="nodrag nopan"
          >
            <button
              onClick={handleDelete}
              title="Remove connection"
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                width: 22,
                height: 22,
                borderRadius: "50%",
                background: "#1e1e1e",
                border: "1.5px solid #818cf8",
                color: "#818cf8",
                cursor: "pointer",
                padding: 0,
                boxShadow: "0 2px 12px rgba(0,0,0,0.7), 0 0 8px rgba(129,140,248,0.2)",
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
                el.style.borderColor = "#818cf8";
                el.style.color = "#818cf8";
              }}
            >
              <X size={10} strokeWidth={2.5} />
            </button>
          </div>
        </EdgeLabelRenderer>
      )}
    </>
  );
}
