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

  const strokeColor = selected ? "#a5b4fc" : "#5865F2";
  const strokeWidth = selected ? 3 : 2;

  return (
    <>
      {/* Wider invisible hit-area for easier clicking */}
      <path
        d={edgePath}
        fill="none"
        stroke="transparent"
        strokeWidth={16}
        style={{ cursor: "pointer" }}
      />

      <BaseEdge
        id={id}
        path={edgePath}
        markerEnd={markerEnd}
        style={{
          stroke: strokeColor,
          strokeWidth,
          filter: selected ? "drop-shadow(0 0 4px rgba(165,180,252,0.6))" : undefined,
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
                background: "#2a2a2a",
                border: "2px solid #a5b4fc",
                color: "#a5b4fc",
                cursor: "pointer",
                padding: 0,
                boxShadow: "0 2px 8px rgba(0,0,0,0.6)",
                transition: "background 0.12s, color 0.12s",
              }}
              onMouseEnter={(e) => {
                const el = e.currentTarget as HTMLElement;
                el.style.background = "#f85149";
                el.style.borderColor = "#f85149";
                el.style.color = "#fff";
              }}
              onMouseLeave={(e) => {
                const el = e.currentTarget as HTMLElement;
                el.style.background = "#2a2a2a";
                el.style.borderColor = "#a5b4fc";
                el.style.color = "#a5b4fc";
              }}
            >
              <X size={11} strokeWidth={3} />
            </button>
          </div>
        </EdgeLabelRenderer>
      )}
    </>
  );
}
