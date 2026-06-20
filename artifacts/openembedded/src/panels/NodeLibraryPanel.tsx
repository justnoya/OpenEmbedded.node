import { useCallback, useState } from "react";
import { useGraphStore, AppNode, AppNodeData } from "@/lib/graphStore";
import {
  Box, Layers, Type, Image, LayoutGrid,
  SeparatorHorizontal, AlignJustify, MousePointerClick, MessageSquare,
  Search, ChevronDown, ChevronRight,
} from "lucide-react";
import { ReactNode } from "react";

interface NodeDef {
  type: string;
  label: string;
  description: string;
  componentType: number | null;
  accentColor: string;
  icon: ReactNode;
  defaultData: Partial<AppNodeData>;
}

const NODE_DEFS: NodeDef[] = [
  {
    type: "container",
    label: "Container",
    description: "Root wrapper with accent & spoiler",
    componentType: 17,
    accentColor: "#8b5cf6",
    icon: <Box size={15} />,
    defaultData: { componentType: 17, accent_color: null, spoiler: false },
  },
  {
    type: "section",
    label: "Section",
    description: "Text + thumbnail accessory",
    componentType: 9,
    accentColor: "#10b981",
    icon: <Layers size={15} />,
    defaultData: { componentType: 9 },
  },
  {
    type: "textDisplay",
    label: "Text Display",
    description: "Markdown content block",
    componentType: 10,
    accentColor: "#3b82f6",
    icon: <Type size={15} />,
    defaultData: { componentType: 10, content: "" },
  },
  {
    type: "thumbnail",
    label: "Thumbnail",
    description: "Image accessory for sections",
    componentType: 11,
    accentColor: "#f59e0b",
    icon: <Image size={15} />,
    defaultData: { componentType: 11, url: "", description: "" },
  },
  {
    type: "mediaGallery",
    label: "Media Gallery",
    description: "Image grid layout",
    componentType: 12,
    accentColor: "#ec4899",
    icon: <LayoutGrid size={15} />,
    defaultData: { componentType: 12, items: [] },
  },
  {
    type: "separator",
    label: "Separator",
    description: "Spacing with optional divider",
    componentType: 14,
    accentColor: "#6b7280",
    icon: <SeparatorHorizontal size={15} />,
    defaultData: { componentType: 14, spacing: "md", divider: false },
  },
  {
    type: "actionRow",
    label: "Action Row",
    description: "Container for buttons",
    componentType: 1,
    accentColor: "#14b8a6",
    icon: <AlignJustify size={15} />,
    defaultData: { componentType: 1 },
  },
  {
    type: "button",
    label: "Button",
    description: "Clickable button component",
    componentType: 2,
    accentColor: "#5865F2",
    icon: <MousePointerClick size={15} />,
    defaultData: { componentType: 2, label: "Click me", style: "Primary", custom_id: "" },
  },
  {
    type: "embed",
    label: "Embed",
    description: "Legacy rich embed message",
    componentType: 0,
    accentColor: "#f59e0b",
    icon: <MessageSquare size={15} />,
    defaultData: { componentType: 0, title: "", description: "", color: 0x5865f2 },
  },
];

const GROUPS = [
  { label: "Layout", types: ["container", "section"] },
  { label: "Content", types: ["textDisplay", "thumbnail", "mediaGallery", "separator"] },
  { label: "Interactive", types: ["actionRow", "button"] },
  { label: "Legacy", types: ["embed"] },
];

let nodeIdCounter = Date.now();

export function NodeLibraryPanel() {
  const addNode = useGraphStore((s) => s.addNode);
  const [search, setSearch] = useState("");
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});

  const handleAdd = useCallback(
    (def: NodeDef) => {
      const id = `node_${nodeIdCounter++}`;
      const node: AppNode = {
        id,
        type: def.type,
        position: { x: 200 + Math.random() * 300, y: 80 + Math.random() * 300 },
        data: { ...def.defaultData } as AppNodeData,
      };
      addNode(node);
    },
    [addNode]
  );

  const q = search.toLowerCase().trim();
  const filtered = q
    ? NODE_DEFS.filter(
        (d) =>
          d.label.toLowerCase().includes(q) ||
          d.description.toLowerCase().includes(q)
      )
    : null;

  const toggleGroup = (label: string) =>
    setCollapsed((prev) => ({ ...prev, [label]: !prev[label] }));

  const NodeCard = ({ def }: { def: NodeDef }) => (
    <button
      key={def.type}
      data-testid={`add-node-${def.type}`}
      onClick={() => handleAdd(def)}
      title={`Add ${def.label}`}
      style={{
        display: "flex",
        alignItems: "center",
        gap: 10,
        width: "100%",
        padding: "8px 10px",
        background: "transparent",
        border: "1px solid rgba(255,255,255,0.05)",
        borderLeft: `2px solid ${def.accentColor}`,
        borderRadius: 6,
        cursor: "pointer",
        textAlign: "left",
        marginBottom: 3,
        transition: "background 0.12s, border-color 0.12s",
      }}
      onMouseEnter={(e) => {
        (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.04)";
        (e.currentTarget as HTMLElement).style.borderColor = def.accentColor + "66";
      }}
      onMouseLeave={(e) => {
        (e.currentTarget as HTMLElement).style.background = "transparent";
        (e.currentTarget as HTMLElement).style.borderColor = "rgba(255,255,255,0.05)";
        (e.currentTarget as HTMLElement).style.borderLeftColor = def.accentColor;
      }}
    >
      <div
        style={{
          width: 30,
          height: 30,
          borderRadius: 6,
          background: def.accentColor + "18",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: def.accentColor,
          flexShrink: 0,
        }}
      >
        {def.icon}
      </div>
      <div style={{ minWidth: 0 }}>
        <div style={{ color: "#e6edf3", fontSize: 12, fontWeight: 600, marginBottom: 1 }}>
          {def.label}
        </div>
        <div
          style={{
            color: "#7d8590",
            fontSize: 10,
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}
        >
          {def.description}
        </div>
      </div>
    </button>
  );

  return (
    <div
      style={{
        width: 256,
        flexShrink: 0,
        background: "#161820",
        borderRight: "1px solid #2A2D3E",
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
      }}
    >
      <div
        style={{
          padding: "14px 14px 10px",
          borderBottom: "1px solid #2A2D3E",
        }}
      >
        <div style={{ color: "#e6edf3", fontSize: 13, fontWeight: 700, marginBottom: 2 }}>
          Components
        </div>
        <div style={{ color: "#7d8590", fontSize: 11, marginBottom: 10 }}>
          Click to add to canvas
        </div>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 6,
            background: "#1C1F2E",
            border: "1px solid #2A2D3E",
            borderRadius: 6,
            padding: "5px 8px",
          }}
        >
          <Search size={12} color="#484f58" />
          <input
            type="text"
            placeholder="Search components…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{
              flex: 1,
              background: "transparent",
              border: "none",
              outline: "none",
              color: "#e6edf3",
              fontSize: 12,
            }}
          />
        </div>
      </div>

      <div style={{ overflowY: "auto", flex: 1, padding: "8px 10px" }}>
        {filtered ? (
          filtered.length > 0 ? (
            filtered.map((def) => <NodeCard key={def.type} def={def} />)
          ) : (
            <div
              style={{
                color: "#484f58",
                fontSize: 12,
                textAlign: "center",
                padding: "20px 0",
              }}
            >
              No matches
            </div>
          )
        ) : (
          GROUPS.map((group) => {
            const defs = NODE_DEFS.filter((d) => group.types.includes(d.type));
            const isCollapsed = !!collapsed[group.label];
            return (
              <div key={group.label} style={{ marginBottom: 6 }}>
                <button
                  onClick={() => toggleGroup(group.label)}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 5,
                    width: "100%",
                    background: "transparent",
                    border: "none",
                    cursor: "pointer",
                    padding: "5px 2px",
                    marginBottom: 3,
                  }}
                >
                  {isCollapsed ? (
                    <ChevronRight size={12} color="#484f58" />
                  ) : (
                    <ChevronDown size={12} color="#484f58" />
                  )}
                  <span
                    style={{
                      color: "#7d8590",
                      fontSize: 10,
                      fontWeight: 700,
                      textTransform: "uppercase",
                      letterSpacing: "0.08em",
                    }}
                  >
                    {group.label}
                  </span>
                </button>
                {!isCollapsed && defs.map((def) => <NodeCard key={def.type} def={def} />)}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
