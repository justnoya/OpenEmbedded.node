import { memo } from "react";
import { NodeProps } from "@xyflow/react";
import { useGraphStore } from "@/lib/graphStore";
import { Sparkles, Zap, CheckCircle2, Circle } from "lucide-react";

function OpenEmbeddedNodeComponent({ id, data }: NodeProps) {
  const nodes = useGraphStore((s) => s.nodes);
  const edges = useGraphStore((s) => s.edges);
  const selectedNodeId = useGraphStore((s) => s.selectedNodeId);
  const setSelectedNode = useGraphStore((s) => s.setSelectedNode);
  const isSelected = selectedNodeId === id;

  const interactionEdges = edges.filter((e) => e.type === "interaction");
  const interactionCount = interactionEdges.length;

  const initialNodeId = data.initialNodeId as string | undefined;
  const initialNode = nodes.find((n) => n.id === initialNodeId);

  const borderColor = isSelected ? "rgba(99,102,241,0.65)" : "rgba(99,102,241,0.28)";
  const shadowVal = isSelected
    ? "0 0 0 3px rgba(99,102,241,0.18), 0 8px 40px rgba(99,102,241,0.15), 0 2px 8px rgba(0,0,0,0.5)"
    : "0 4px 20px rgba(99,102,241,0.12), 0 0 0 1px rgba(255,255,255,0.04)";

  const uniqueSources = new Set(interactionEdges.map((e) => e.source)).size;
  const responsePanels = new Set(interactionEdges.map((e) => e.target)).size;

  return (
    <div
      data-testid={`node-${id}`}
      onClick={() => setSelectedNode(id)}
      style={{
        background: "linear-gradient(145deg, #12132a 0%, #0d0e1f 100%)",
        border: `1px solid ${borderColor}`,
        borderRadius: 14,
        minWidth: 250,
        cursor: "pointer",
        position: "relative",
        boxShadow: shadowVal,
        transition: "border-color 0.15s, box-shadow 0.15s",
        overflow: "hidden",
      }}
    >
      {/* Animated top gradient bar */}
      <div
        style={{
          position: "absolute", top: 0, left: 0, right: 0, height: 3,
          background: "linear-gradient(90deg, #6366f1 0%, #8b5cf6 50%, #ec4899 100%)",
          borderRadius: "14px 14px 0 0",
        }}
      />

      {/* Subtle glow overlay */}
      <div
        style={{
          position: "absolute", inset: 0,
          background: "linear-gradient(135deg, rgba(99,102,241,0.07) 0%, transparent 60%)",
          pointerEvents: "none",
        }}
      />

      {/* ── Header ── */}
      <div
        style={{
          padding: "14px 14px 11px",
          borderBottom: "1px solid rgba(99,102,241,0.12)",
          display: "flex", alignItems: "center", gap: 10,
        }}
      >
        <div
          style={{
            width: 36, height: 36, borderRadius: 10,
            background: "linear-gradient(135deg, rgba(99,102,241,0.35), rgba(139,92,246,0.2))",
            border: "1px solid rgba(99,102,241,0.35)",
            display: "flex", alignItems: "center", justifyContent: "center",
            flexShrink: 0,
            boxShadow: "0 0 18px rgba(99,102,241,0.25)",
          }}
        >
          <Sparkles size={16} color="#818cf8" />
        </div>

        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ color: "#c7d2fe", fontSize: 13, fontWeight: 700, letterSpacing: "-0.01em" }}>
            OpenEmbedded
          </div>
          <div style={{ color: "#6366f1", fontSize: 9, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.12em", marginTop: 1 }}>
            Official Platform Bot
          </div>
        </div>

        <div
          style={{
            background: "linear-gradient(135deg, rgba(99,102,241,0.25), rgba(139,92,246,0.12))",
            border: "1px solid rgba(99,102,241,0.35)",
            borderRadius: 6, padding: "2px 8px",
            color: "#818cf8", fontSize: 8, fontWeight: 800,
            letterSpacing: "0.1em", textTransform: "uppercase",
          }}
        >
          PLATFORM
        </div>
      </div>

      {/* ── Body ── */}
      <div style={{ padding: "11px 14px 14px" }}>
        {/* Initial message row */}
        <div style={{ marginBottom: 10 }}>
          <div
            style={{
              color: "#40458a", fontSize: 9, fontWeight: 700,
              textTransform: "uppercase", letterSpacing: "0.09em", marginBottom: 4,
            }}
          >
            Initial Message
          </div>
          <div
            style={{
              background: initialNode ? "rgba(99,102,241,0.09)" : "rgba(255,255,255,0.02)",
              border: `1px solid ${initialNode ? "rgba(99,102,241,0.25)" : "rgba(255,255,255,0.06)"}`,
              borderRadius: 7, padding: "5px 10px",
              display: "flex", alignItems: "center", gap: 7,
            }}
          >
            {initialNode ? (
              <>
                <CheckCircle2 size={11} color="#6366f1" />
                <span style={{ color: "#a5b4fc", fontSize: 12, fontWeight: 600 }}>
                  {initialNode.type === "container" ? "Container" : "Embed"}
                </span>
                <span style={{ color: "#40458a", fontSize: 10, flex: 1, overflow: "hidden", textOverflow: "ellipsis" }}>
                  linked
                </span>
              </>
            ) : (
              <>
                <Circle size={11} color="#383860" />
                <span style={{ color: "#383860", fontSize: 11 }}>Not set — configure in Properties</span>
              </>
            )}
          </div>
        </div>

        {/* Flow stats grid */}
        <div style={{ display: "flex", gap: 6, marginBottom: interactionCount > 0 ? 8 : 0 }}>
          {[
            { value: interactionCount, label: "Flows" },
            { value: uniqueSources, label: "Triggers" },
            { value: responsePanels, label: "Panels" },
          ].map(({ value, label }) => (
            <div
              key={label}
              style={{
                flex: 1,
                background: "rgba(99,102,241,0.07)",
                border: "1px solid rgba(99,102,241,0.13)",
                borderRadius: 7, padding: "6px 4px", textAlign: "center",
              }}
            >
              <div style={{ color: "#818cf8", fontSize: 17, fontWeight: 700, lineHeight: 1 }}>
                {value}
              </div>
              <div
                style={{
                  color: "#35386a", fontSize: 8, fontWeight: 700,
                  textTransform: "uppercase", letterSpacing: "0.07em", marginTop: 3,
                }}
              >
                {label}
              </div>
            </div>
          ))}
        </div>

        {interactionCount > 0 && (
          <div
            style={{
              display: "flex", alignItems: "center", gap: 5,
              color: "#6366f1", fontSize: 10,
            }}
          >
            <Zap size={9} />
            <span>{interactionCount} interaction flow{interactionCount !== 1 ? "s" : ""} ready</span>
          </div>
        )}
      </div>
    </div>
  );
}

export const OpenEmbeddedNode = memo(OpenEmbeddedNodeComponent);
