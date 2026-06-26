import { BaseEdge, EdgeLabelRenderer, getBezierPath, useReactFlow, type EdgeProps } from "@xyflow/react";
import { useGraphStore } from "../../lib/graphStore.js";
import { X, Zap } from "lucide-react";
import { getInteractionModeMeta, type InteractionMode } from "../../lib/connectionRules.js";

export function InteractionEdge({
  id,
  sourceX, sourceY,
  targetX, targetY,
  sourcePosition, targetPosition,
  selected,
  data,
}: EdgeProps) {
  const [edgePath, labelX, labelY] = getBezierPath({
    sourceX, sourceY, sourcePosition,
    targetX, targetY, targetPosition,
  });

  const removeEdge = useGraphStore((s) => s.removeEdge);
  const { setEdges } = useReactFlow();

  const mode = ((data as Record<string, unknown>)?.mode as InteractionMode) ?? "send_new";
  const meta = getInteractionModeMeta(mode);

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    removeEdge(id);
    setEdges((eds) => eds.filter((edge) => edge.id !== id));
  };

  const strokeColor = selected ? "#666666" : "#3a3a3a";

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
              border: "1px solid rgba(255,255,255,0.08)",
              borderRadius: 7,
              padding: "3px 8px",
              display: "flex",
              alignItems: "center",
              gap: 5,
              boxShadow: "0 2px 8px rgba(0,0,0,0.5)",
              backdropFilter: "blur(4px)",
            }}
          >
            <Zap size={9} color="#555555" />
            <span
              style={{
                color: "#555555",
                fontSize: 10,
                fontWeight: 700,
                letterSpacing: "0.06em",
                whiteSpace: "nowrap",
              }}
            >
              {meta.label}
            </span>
          </div>

          {selected && (
            <button
              onClick={handleDelete}
              title="Remove this interaction"
              style={{
                display: "flex", alignItems: "center", justifyContent: "center",
                width: 20, height: 20, borderRadius: "50%",
                background: "#1e1e1e",
                border: "1.5px solid #555555",
                color: "#888888", cursor: "pointer", padding: 0,
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
                el.style.borderColor = "#555555";
                el.style.color = "#888888";
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
