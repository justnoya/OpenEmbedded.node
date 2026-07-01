// @ts-nocheck
import { memo } from "react";
import { Handle, Position, NodeProps } from "@xyflow/react";
import { NodeWrapper } from "./NodeWrapper.js";
import { Variable } from "lucide-react";

function VariableNodeComponent({ id, data }: NodeProps) {
  const operation = (data.operation as string) ?? "set"; // set | get | increment | append
  const varName = (data.varName as string) ?? "";
  const value = (data.value as string) ?? "";

  const OP_LABELS: Record<string, string> = {
    set: "Set", get: "Get", increment: "Increment", decrement: "Decrement",
    append: "Append", delete: "Delete", toggle: "Toggle",
  };

  return (
    <NodeWrapper id={id} typeName="Variable" icon={<Variable size={14} />} accentColor="#a78bfa" nodeClass="relay">
      <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <span style={{ background: "rgba(167,139,250,0.15)", color: "#c4b5fd", fontSize: 9, fontWeight: 700, padding: "1px 6px", borderRadius: 3 }}>
            {OP_LABELS[operation] ?? operation}
          </span>
          <span style={{ color: varName ? "#c4b5fd" : "#404040", fontSize: 11, fontWeight: 600, fontFamily: "monospace", maxWidth: 140, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", fontStyle: varName ? "normal" : "italic" }}>
            {varName || "varName"}
          </span>
        </div>
        {value && (
          <div style={{ color: "#707070", fontSize: 10, fontFamily: "monospace", background: "rgba(255,255,255,0.02)", padding: "2px 6px", borderRadius: 3, border: "1px solid rgba(255,255,255,0.04)", maxWidth: 185, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            = {value}
          </div>
        )}
        <span style={{ background: "rgba(167,139,250,0.12)", color: "#a78bfa", fontSize: 8, fontWeight: 700, padding: "1px 5px", borderRadius: 3, textTransform: "uppercase", letterSpacing: "0.06em", alignSelf: "flex-start" }}>
          LOGIC
        </span>
      </div>
      <Handle type="target" position={Position.Left} style={{ background: "#a78bfa", border: "2px solid #1a1a1a", width: 10, height: 10 }} />
      <Handle type="source" position={Position.Right} style={{ background: "#a78bfa", border: "2px solid #1a1a1a", width: 10, height: 10 }} />
    </NodeWrapper>
  );
}

export const VariableNode = memo(VariableNodeComponent);
