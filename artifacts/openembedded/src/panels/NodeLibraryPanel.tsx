import { useCallback, useState, type ReactNode } from "react";
import { useGraphStore, AppNode, AppNodeData } from "@/lib/graphStore";
import {
  Box, AlignJustify, AlignLeft, Image, LayoutGrid, Minus,
  LayoutList, MousePointerClick, ListFilter, User, Shield,
  AtSign, Hash, TextCursorInput, Layers, Bot, Workflow,
  Search,
} from "lucide-react";

interface NodeDef {
  type: string;
  label: string;
  value: string;
  icon: ReactNode;
  componentType: number | null;
  defaultData: Partial<AppNodeData>;
}

const IC = ({ children }: { children: ReactNode }) => (
  <span style={{ display: "flex", alignItems: "center", justifyContent: "center", color: "rgba(255,255,255,0.75)", flexShrink: 0 }}>
    {children}
  </span>
);

const NODE_DEFS: NodeDef[] = [
  { type: "container",         label: "Container",          value: "Wrapper",       icon: <IC><Box size={15} /></IC>,                componentType: 17,   defaultData: { componentType: 17, accent_color: null, spoiler: false } },
  { type: "section",           label: "Section",            value: "Row layout",    icon: <IC><AlignJustify size={15} /></IC>,        componentType: 9,    defaultData: { componentType: 9 } },
  { type: "textDisplay",       label: "Text Display",       value: "Markdown",      icon: <IC><AlignLeft size={15} /></IC>,           componentType: 10,   defaultData: { componentType: 10, content: "" } },
  { type: "thumbnail",         label: "Thumbnail",          value: "Image",         icon: <IC><Image size={15} /></IC>,              componentType: 11,   defaultData: { componentType: 11, url: "", description: "" } },
  { type: "mediaGallery",      label: "Media Gallery",      value: "Grid",          icon: <IC><LayoutGrid size={15} /></IC>,         componentType: 12,   defaultData: { componentType: 12, items: [] } },
  { type: "separator",         label: "Separator",          value: "Divider",       icon: <IC><Minus size={15} /></IC>,              componentType: 14,   defaultData: { componentType: 14, spacing: "md", divider: false } },
  { type: "actionRow",         label: "Action Row",         value: "Row",           icon: <IC><LayoutList size={15} /></IC>,         componentType: 1,    defaultData: { componentType: 1 } },
  { type: "button",            label: "Button",             value: "Clickable",     icon: <IC><MousePointerClick size={15} /></IC>,  componentType: 2,    defaultData: { componentType: 2, label: "Click me", style: "Primary", custom_id: "", emoji: "", disabled: false } },
  { type: "selectMenu",        label: "String Select",      value: "Options",       icon: <IC><ListFilter size={15} /></IC>,         componentType: 3,    defaultData: { componentType: 3, custom_id: "", placeholder: "Make a selection…", min_values: 1, max_values: 1, options: [], disabled: false } },
  { type: "userSelect",        label: "User Select",        value: "User picker",   icon: <IC><User size={15} /></IC>,               componentType: 5,    defaultData: { componentType: 5, custom_id: "", placeholder: "Select a user…", min_values: 1, max_values: 1, disabled: false } },
  { type: "roleSelect",        label: "Role Select",        value: "Role picker",   icon: <IC><Shield size={15} /></IC>,             componentType: 6,    defaultData: { componentType: 6, custom_id: "", placeholder: "Select a role…", min_values: 1, max_values: 1, disabled: false } },
  { type: "mentionableSelect", label: "Mentionable",        value: "User or role",  icon: <IC><AtSign size={15} /></IC>,             componentType: 7,    defaultData: { componentType: 7, custom_id: "", placeholder: "Select a user or role…", min_values: 1, max_values: 1, disabled: false } },
  { type: "channelSelect",     label: "Channel Select",     value: "Channel",       icon: <IC><Hash size={15} /></IC>,               componentType: 8,    defaultData: { componentType: 8, custom_id: "", placeholder: "Select a channel…", min_values: 1, max_values: 1, disabled: false } },
  { type: "textInput",         label: "Text Input",         value: "Text field",    icon: <IC><TextCursorInput size={15} /></IC>,    componentType: 4,    defaultData: { componentType: 4, custom_id: "", label: "Label", style: "Short", placeholder: "", required: true, min_length: null, max_length: null, value: "" } },
  { type: "embed",             label: "Embed",              value: "Legacy V1",     icon: <IC><Layers size={15} /></IC>,             componentType: 0,    defaultData: { componentType: 0, title: "", description: "", color: 0x5865f2 } },
  { type: "bot",               label: "Bot",                value: "Your token",    icon: <IC><Bot size={15} /></IC>,                componentType: null, defaultData: { componentType: -1, token: "", connected: false, botName: null, botAvatar: null, selectedGuildId: null, selectedChannelId: null, guilds: [], channels: [] } },
  { type: "openembedded",      label: "OpenEmbedded",       value: "Platform",      icon: <IC><Workflow size={15} /></IC>,           componentType: null, defaultData: { componentType: -2, initialNodeId: null } },
];

const GROUPS = [
  { label: "Layout",      types: ["container", "section"] },
  { label: "Content",     types: ["textDisplay", "thumbnail", "mediaGallery", "separator"] },
  { label: "Interactive", types: ["actionRow", "button", "selectMenu", "userSelect", "roleSelect", "mentionableSelect", "channelSelect"] },
  { label: "Modals",      types: ["textInput"] },
  { label: "Legacy",      types: ["embed"] },
  { label: "Advanced",    types: ["bot", "openembedded"] },
];

const NODE_MAP = new Map(NODE_DEFS.map((d) => [d.type, d]));

let nodeIdCounter = Date.now();

export function NodeLibraryPanel() {
  const addNode = useGraphStore((s) => s.addNode);
  const [search, setSearch] = useState("");
  const [hoveredType, setHoveredType] = useState<string | null>(null);

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
  const searchResults = q
    ? NODE_DEFS.filter((d) => d.label.toLowerCase().includes(q) || d.value.toLowerCase().includes(q))
    : null;

  const renderRow = (def: NodeDef, isLast: boolean) => (
    <button
      key={def.type}
      data-testid={`add-node-${def.type}`}
      onClick={() => handleAdd(def)}
      onMouseEnter={() => setHoveredType(def.type)}
      onMouseLeave={() => setHoveredType(null)}
      style={{
        display: "flex",
        alignItems: "center",
        gap: 10,
        width: "100%",
        minHeight: 48,
        padding: "0 14px",
        background: hoveredType === def.type ? "rgba(255,255,255,0.04)" : "transparent",
        border: "none",
        cursor: "pointer",
        textAlign: "left",
        position: "relative",
        transition: "background 0.1s",
        boxSizing: "border-box",
      }}
    >
      {def.icon}

      <span
        style={{
          flex: 1,
          fontSize: 14,
          fontWeight: 400,
          color: "#d4d4d4",
          fontFamily: "inherit",
          letterSpacing: "-0.01em",
          overflow: "hidden",
          textOverflow: "ellipsis",
          whiteSpace: "nowrap",
        }}
      >
        {def.label}
      </span>

      <span
        style={{
          fontSize: 12,
          color: "#383838",
          fontFamily: "inherit",
          whiteSpace: "nowrap",
          flexShrink: 0,
        }}
      >
        {def.value}
      </span>

      {!isLast && (
        <div
          style={{
            position: "absolute",
            bottom: 0, left: 14, right: 14,
            height: 1,
            background: "rgba(255,255,255,0.04)",
            pointerEvents: "none",
          }}
        />
      )}
    </button>
  );

  return (
    <div
      style={{
        width: 260,
        flexShrink: 0,
        background: "#111111",
        borderRight: "1px solid rgba(255,255,255,0.05)",
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
      }}
    >
      {/* Search */}
      <div style={{ padding: "12px 12px 8px", flexShrink: 0 }}>
        <div style={{ position: "relative" }}>
          <span style={{
            position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)",
            color: "#383838", display: "flex", pointerEvents: "none",
          }}>
            <Search size={13} />
          </span>
          <input
            type="text"
            placeholder="Search components"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{
              width: "100%",
              background: "#1a1a1a",
              border: "1px solid rgba(255,255,255,0.05)",
              borderRadius: 8,
              color: "#d4d4d4",
              fontSize: 13,
              fontWeight: 400,
              padding: "8px 12px 8px 30px",
              outline: "none",
              boxSizing: "border-box",
              fontFamily: "inherit",
              caretColor: "#d4d4d4",
              transition: "border-color 0.12s",
            }}
            onFocus={(e) => { e.currentTarget.style.borderColor = "rgba(255,255,255,0.10)"; }}
            onBlur={(e) => { e.currentTarget.style.borderColor = "rgba(255,255,255,0.05)"; }}
          />
        </div>
      </div>

      {/* Scrollable content */}
      <div style={{ overflowY: "auto", flex: 1, padding: "4px 12px 24px" }}>
        {searchResults ? (
          searchResults.length > 0 ? (
            <>
              <div style={{ fontSize: 10, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.08em", color: "#2e2e2e", margin: "8px 2px 6px" }}>
                Results
              </div>
              <div style={{ background: "#1a1a1a", borderRadius: 8, overflow: "hidden", border: "1px solid rgba(255,255,255,0.04)" }}>
                {searchResults.map((def, i) => renderRow(def, i === searchResults.length - 1))}
              </div>
            </>
          ) : (
            <div style={{ color: "#2e2e2e", fontSize: 13, textAlign: "center", paddingTop: 32, fontFamily: "inherit" }}>
              No results
            </div>
          )
        ) : (
          GROUPS.map((group) => {
            const defs = group.types.map((t) => NODE_MAP.get(t)).filter((d): d is NodeDef => d !== undefined);
            if (defs.length === 0) return null;
            return (
              <div key={group.label} style={{ marginBottom: 20 }}>
                <div style={{ fontSize: 10, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.08em", color: "#2e2e2e", margin: "8px 2px 6px" }}>
                  {group.label}
                </div>
                <div style={{ background: "#1a1a1a", borderRadius: 8, overflow: "hidden", border: "1px solid rgba(255,255,255,0.04)" }}>
                  {defs.map((def, i) => renderRow(def, i === defs.length - 1))}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
