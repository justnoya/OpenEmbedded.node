import { useCallback } from "react";
import { useGraphStore, AppNode, AppNodeData } from "@/lib/graphStore";

interface NodeDef {
  type: string;
  label: string;
  description: string;
  componentType: number | null;
  badgeColor: string;
  defaultData: Partial<AppNodeData>;
}

const NODE_DEFS: NodeDef[] = [
  {
    type: "container",
    label: "Container",
    description: "Root wrapper · type 17",
    componentType: 17,
    badgeColor: "#3d2e5a",
    defaultData: { componentType: 17, accent_color: null, spoiler: false },
  },
  {
    type: "section",
    label: "Section",
    description: "Text + accessory · type 9",
    componentType: 9,
    badgeColor: "#1d3d3a",
    defaultData: { componentType: 9 },
  },
  {
    type: "textDisplay",
    label: "Text Display",
    description: "Markdown text · type 10",
    componentType: 10,
    badgeColor: "#2d2d2d",
    defaultData: { componentType: 10, content: "" },
  },
  {
    type: "thumbnail",
    label: "Thumbnail",
    description: "Image accessory · type 11",
    componentType: 11,
    badgeColor: "#3d2b1a",
    defaultData: { componentType: 11, url: "", description: "" },
  },
  {
    type: "mediaGallery",
    label: "Media Gallery",
    description: "Image grid · type 12",
    componentType: 12,
    badgeColor: "#3d1d35",
    defaultData: { componentType: 12, items: [] },
  },
  {
    type: "separator",
    label: "Separator",
    description: "Divider / spacing · type 14",
    componentType: 14,
    badgeColor: "#2a2a2a",
    defaultData: { componentType: 14, spacing: "md", divider: false },
  },
  {
    type: "actionRow",
    label: "Action Row",
    description: "Button container · type 1",
    componentType: 1,
    badgeColor: "#1a1a2e",
    defaultData: { componentType: 1 },
  },
  {
    type: "button",
    label: "Button",
    description: "Clickable button · type 2",
    componentType: 2,
    badgeColor: "#1d1d3e",
    defaultData: { componentType: 2, label: "Button", style: "Primary", custom_id: "" },
  },
  {
    type: "embed",
    label: "Embed",
    description: "Legacy embed",
    componentType: 0,
    badgeColor: "#2e2a14",
    defaultData: { componentType: 0, title: "", description: "", color: 0x5865f2 },
  },
];

let nodeIdCounter = 1;

export function NodeLibraryPanel() {
  const addNode = useGraphStore((s) => s.addNode);

  const handleAdd = useCallback(
    (def: NodeDef) => {
      const id = `node_${nodeIdCounter++}`;
      const node: AppNode = {
        id,
        type: def.type,
        position: { x: 300 + Math.random() * 200, y: 100 + Math.random() * 200 },
        data: { ...def.defaultData } as AppNodeData,
      };
      addNode(node);
    },
    [addNode]
  );

  return (
    <div
      style={{
        width: 240,
        flexShrink: 0,
        background: "#1E2124",
        borderRight: "1px solid rgba(255,255,255,0.063)",
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
      }}
    >
      <div
        style={{
          padding: "12px 16px",
          borderBottom: "1px solid rgba(255,255,255,0.063)",
          color: "#B5BAC1",
          fontSize: 11,
          fontWeight: 600,
          letterSpacing: "0.08em",
          textTransform: "uppercase",
        }}
      >
        Node Library
      </div>
      <div style={{ overflowY: "auto", flex: 1, padding: 8 }}>
        {NODE_DEFS.map((def) => (
          <button
            key={def.type}
            data-testid={`add-node-${def.type}`}
            onClick={() => handleAdd(def)}
            style={{
              display: "flex",
              flexDirection: "column",
              width: "100%",
              padding: "8px 10px",
              background: "transparent",
              border: "1px solid rgba(255,255,255,0.063)",
              borderRadius: 6,
              cursor: "pointer",
              marginBottom: 4,
              textAlign: "left",
              transition: "background 0.15s",
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLButtonElement).style.background = "#282B30";
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLButtonElement).style.background = "transparent";
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 2 }}>
              <div
                style={{
                  background: def.badgeColor,
                  width: 8,
                  height: 8,
                  borderRadius: 2,
                  flexShrink: 0,
                }}
              />
              <span style={{ color: "#F2F3F5", fontSize: 13, fontWeight: 500 }}>
                {def.label}
              </span>
            </div>
            <div style={{ color: "#949B9D", fontSize: 11, paddingLeft: 14 }}>
              {def.description}
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
