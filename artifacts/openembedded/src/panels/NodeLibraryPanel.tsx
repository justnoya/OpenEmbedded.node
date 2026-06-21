import { useCallback, useState } from "react";
import { useGraphStore, AppNode, AppNodeData } from "@/lib/graphStore";
import {
  Box, Layers, Type, Image, LayoutGrid,
  SeparatorHorizontal, AlignJustify, MousePointerClick, MessageSquare,
  Search, ChevronDown, ChevronRight, Users, Shield, AtSign, Hash,
  TextCursorInput,
} from "lucide-react";
import { ReactNode } from "react";

const PANEL = "#222222";
const SURFACE = "#2a2a2a";
const BORDER = "#333333";
const TEXT = "#e8e8e8";
const MUTED = "#888888";
const FAINT = "#555555";

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
    icon: <Box size={14} />,
    defaultData: { componentType: 17, accent_color: null, spoiler: false },
  },
  {
    type: "section",
    label: "Section",
    description: "Text + thumbnail accessory",
    componentType: 9,
    accentColor: "#10b981",
    icon: <Layers size={14} />,
    defaultData: { componentType: 9 },
  },
  {
    type: "textDisplay",
    label: "Text Display",
    description: "Markdown content block",
    componentType: 10,
    accentColor: "#3b82f6",
    icon: <Type size={14} />,
    defaultData: { componentType: 10, content: "" },
  },
  {
    type: "thumbnail",
    label: "Thumbnail",
    description: "Image accessory for sections",
    componentType: 11,
    accentColor: "#f59e0b",
    icon: <Image size={14} />,
    defaultData: { componentType: 11, url: "", description: "" },
  },
  {
    type: "mediaGallery",
    label: "Media Gallery",
    description: "Image grid layout",
    componentType: 12,
    accentColor: "#ec4899",
    icon: <LayoutGrid size={14} />,
    defaultData: { componentType: 12, items: [] },
  },
  {
    type: "separator",
    label: "Separator",
    description: "Spacing with optional divider",
    componentType: 14,
    accentColor: "#6b7280",
    icon: <SeparatorHorizontal size={14} />,
    defaultData: { componentType: 14, spacing: "md", divider: false },
  },
  {
    type: "actionRow",
    label: "Action Row",
    description: "Container for buttons & selects",
    componentType: 1,
    accentColor: "#14b8a6",
    icon: <AlignJustify size={14} />,
    defaultData: { componentType: 1 },
  },
  {
    type: "button",
    label: "Button",
    description: "Clickable button (Primary/Link/…)",
    componentType: 2,
    accentColor: "#5865F2",
    icon: <MousePointerClick size={14} />,
    defaultData: { componentType: 2, label: "Click me", style: "Primary", custom_id: "", emoji: "", disabled: false },
  },
  {
    type: "selectMenu",
    label: "String Select",
    description: "Dropdown with custom options",
    componentType: 3,
    accentColor: "#f97316",
    icon: <ChevronDown size={14} />,
    defaultData: { componentType: 3, custom_id: "", placeholder: "Make a selection…", min_values: 1, max_values: 1, options: [], disabled: false },
  },
  {
    type: "userSelect",
    label: "User Select",
    description: "Discord user picker",
    componentType: 5,
    accentColor: "#06b6d4",
    icon: <Users size={14} />,
    defaultData: { componentType: 5, custom_id: "", placeholder: "Select a user…", min_values: 1, max_values: 1, disabled: false },
  },
  {
    type: "roleSelect",
    label: "Role Select",
    description: "Discord role picker",
    componentType: 6,
    accentColor: "#a855f7",
    icon: <Shield size={14} />,
    defaultData: { componentType: 6, custom_id: "", placeholder: "Select a role…", min_values: 1, max_values: 1, disabled: false },
  },
  {
    type: "mentionableSelect",
    label: "Mentionable Select",
    description: "User + role picker",
    componentType: 7,
    accentColor: "#ec4899",
    icon: <AtSign size={14} />,
    defaultData: { componentType: 7, custom_id: "", placeholder: "Select a user or role…", min_values: 1, max_values: 1, disabled: false },
  },
  {
    type: "channelSelect",
    label: "Channel Select",
    description: "Discord channel picker",
    componentType: 8,
    accentColor: "#22c55e",
    icon: <Hash size={14} />,
    defaultData: { componentType: 8, custom_id: "", placeholder: "Select a channel…", min_values: 1, max_values: 1, disabled: false },
  },
  {
    type: "textInput",
    label: "Text Input",
    description: "Short or paragraph input (modal)",
    componentType: 4,
    accentColor: "#64748b",
    icon: <TextCursorInput size={14} />,
    defaultData: { componentType: 4, custom_id: "", label: "Label", style: "Short", placeholder: "", required: true, min_length: null, max_length: null, value: "" },
  },
  {
    type: "embed",
    label: "Embed (V1)",
    description: "Legacy rich embed message",
    componentType: 0,
    accentColor: "#f59e0b",
    icon: <MessageSquare size={14} />,
    defaultData: { componentType: 0, title: "", description: "", color: 0x5865f2 },
  },
];

const GROUPS = [
  { label: "Layout",      types: ["container", "section"] },
  { label: "Content",     types: ["textDisplay", "thumbnail", "mediaGallery", "separator"] },
  { label: "Interactive", types: ["actionRow", "button", "selectMenu", "userSelect", "roleSelect", "mentionableSelect", "channelSelect"] },
  { label: "Modals",      types: ["textInput"] },
  { label: "Legacy",      types: ["embed"] },
];

let nodeIdCounter = Date.now();

export function NodeLibraryPanel() {
  const addNode = useGraphStore((s) => s.addNode);
  const [search, setSearch] = useState("");
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});
  const [focused, setFocused] = useState(false);

  const handleAdd = useCallback(
    (def: NodeDef) => {
      const id = `node_${nodeIdCounter++}`;
      const node: AppNode = {
        id,
        type: def.type,
        position: { x: 260 + Math.random() * 260, y: 80 + Math.random() * 260 },
        data: { ...def.defaultData } as AppNodeData,
      };
      addNode(node);
    },
    [addNode]
  );

  const q = search.toLowerCase().trim();
  const filtered = q
    ? NODE_DEFS.filter(
        (d) => d.label.toLowerCase().includes(q) || d.description.toLowerCase().includes(q)
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
        gap: 9,
        width: "100%",
        padding: "7px 8px",
        background: "transparent",
        border: "none",
        borderRadius: 7,
        cursor: "pointer",
        textAlign: "left",
        marginBottom: 1,
        transition: "background 0.1s",
        position: "relative",
        overflow: "hidden",
      }}
      onMouseEnter={(e) => {
        (e.currentTarget as HTMLElement).style.background = "#2a2a2a";
      }}
      onMouseLeave={(e) => {
        (e.currentTarget as HTMLElement).style.background = "transparent";
      }}
    >
      <div style={{
        position: "absolute",
        left: 0,
        top: "50%",
        transform: "translateY(-50%)",
        width: 2,
        height: 20,
        borderRadius: 1,
        background: def.accentColor,
        opacity: 0,
        transition: "opacity 0.1s",
      }} className="accent-pip" />

      <div
        style={{
          width: 30,
          height: 30,
          borderRadius: 7,
          background: def.accentColor + "15",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: def.accentColor,
          flexShrink: 0,
        }}
      >
        {def.icon}
      </div>

      <div style={{ minWidth: 0, flex: 1 }}>
        <div style={{ color: TEXT, fontSize: 12, fontWeight: 500, marginBottom: 1, letterSpacing: "-0.01em" }}>
          {def.label}
        </div>
        <div
          style={{
            color: MUTED,
            fontSize: 10.5,
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
        width: 248,
        flexShrink: 0,
        background: PANEL,
        borderRight: `1px solid ${BORDER}`,
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
      }}
    >
      {/* Header */}
      <div
        style={{
          padding: "14px 12px 10px",
          borderBottom: `1px solid ${BORDER}`,
          flexShrink: 0,
        }}
      >
        <div style={{ color: TEXT, fontSize: 12, fontWeight: 600, marginBottom: 8, letterSpacing: "-0.01em" }}>
          Components
        </div>

        {/* Search */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 6,
            background: SURFACE,
            border: `1px solid ${focused ? "rgba(88,101,242,0.5)" : BORDER}`,
            borderRadius: 7,
            padding: "5px 9px",
            transition: "border-color 0.15s",
          }}
        >
          <Search size={12} color={focused ? "#818cf8" : FAINT} style={{ flexShrink: 0, transition: "color 0.15s" }} />
          <input
            type="text"
            placeholder="Search…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onFocus={() => setFocused(true)}
            onBlur={() => setFocused(false)}
            style={{
              flex: 1,
              background: "transparent",
              border: "none",
              outline: "none",
              color: TEXT,
              fontSize: 12,
              fontFamily: "inherit",
            }}
          />
          {search && (
            <button
              onClick={() => setSearch("")}
              style={{ background: "none", border: "none", color: MUTED, cursor: "pointer", padding: 0, display: "flex", fontSize: 14, lineHeight: 1 }}
            >
              ×
            </button>
          )}
        </div>
      </div>

      {/* List */}
      <div style={{ overflowY: "auto", flex: 1, padding: "6px 6px" }}>
        {filtered ? (
          filtered.length > 0 ? (
            filtered.map((def) => <NodeCard key={def.type} def={def} />)
          ) : (
            <div style={{ color: FAINT, fontSize: 12, textAlign: "center", padding: "24px 0" }}>
              No results for "{search}"
            </div>
          )
        ) : (
          GROUPS.map((group) => {
            const defs = NODE_DEFS.filter((d) => group.types.includes(d.type));
            const isCollapsed = !!collapsed[group.label];
            return (
              <div key={group.label} style={{ marginBottom: 2 }}>
                <button
                  onClick={() => toggleGroup(group.label)}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 4,
                    width: "100%",
                    background: "transparent",
                    border: "none",
                    cursor: "pointer",
                    padding: "8px 8px 4px",
                  }}
                >
                  {isCollapsed
                    ? <ChevronRight size={10} color={FAINT} />
                    : <ChevronDown size={10} color={FAINT} />}
                  <span
                    style={{
                      color: MUTED,
                      fontSize: 10,
                      fontWeight: 700,
                      textTransform: "uppercase",
                      letterSpacing: "0.09em",
                    }}
                  >
                    {group.label}
                  </span>
                  <span style={{ color: FAINT, fontSize: 10, marginLeft: 3 }}>
                    {defs.length}
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
