// @ts-nocheck
import { memo } from "react";
import { Handle, Position, NodeProps } from "@xyflow/react";
import { NodeWrapper } from "./NodeWrapper.js";
import { Dices } from "lucide-react";

function RandomPickNodeComponent({ id, data }: NodeProps) {
  const choices = (data.choices as string[]) ?? [];
  const storeAs = (data.storeAs as string) ?? "randomPick";

  return (
    <NodeWrapper id={id} typeName="Random Pick" icon={<Dices size={14} />} accentColor="#ec4899" nodeClass="relay">
      <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
        {choices.length > 0 ? (
          <div style={{ display: "flex", flexWrap: "wrap", gap: 3 }}>
            {choices.slice(0, 4).map((c, i) => (
              <span key={i} style={{ background: "rgba(236,72,153,0.1)", color: "#f9a8d4", fontSize: 9, padding: "1px 5px", borderRadius: 3, border: "1px solid rgba(236,72,153,0.2)", maxWidth: 80, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                {c}
              </span>
            ))}
            {choices.length > 4 && (
              <span style={{ color: "#505050", fontSize: 9 }}>+{choices.length - 4} more</span>
            )}
          </div>
        ) : (
          <div style={{ color: "#404040", fontSize: 11, fontStyle: "italic" }}>No choices defined</div>
        )}
        <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
          <span style={{ background: "rgba(236,72,153,0.12)", color: "#f9a8d4", fontSize: 8, fontWeight: 700, padding: "1px 5px", borderRadius: 3, textTransform: "uppercase", letterSpacing: "0.06em" }}>
            LOGIC
          </span>
          {storeAs && <span style={{ color: "#505050", fontSize: 9 }}>→ <span style={{ color: "#a78bfa", fontFamily: "monospace" }}>{storeAs}</span></span>}
        </div>
      </div>
      <Handle type="target" position={Position.Left} style={{ background: "#ec4899", border: "2px solid #1a1a1a", width: 10, height: 10 }} />
      <Handle type="source" position={Position.Right} style={{ background: "#ec4899", border: "2px solid #1a1a1a", width: 10, height: 10 }} />
    </NodeWrapper>
  );
}

export const RandomPickNode = memo(RandomPickNodeComponent);
