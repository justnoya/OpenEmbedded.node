import { useCallback, useState } from "react";
import { useGraphStore, AppNode, AppNodeData } from "@/lib/graphStore";
import {
  Package, Columns2, AlignLeft, Image, Grid2x2, Minus,
  AlignJustify, MousePointerClick, ChevronDown, User,
  Shield, AtSign, Hash, TextCursorInput, FileText, Bot, Layers,
} from "lucide-react";

interface NodeDef {
  type: string;
  label: string;
  value: string;
  componentType: number | null;
  defaultData: Partial<AppNodeData>;
  icon: React.ReactNode;
  color: string;
}

const NODE_DEFS: NodeDef[] = [
  { type: "container",         label: "Container",      value: "Wrapper",       componentType: 17,   icon: <Package size={12} />,          color: "#5865F2", defaultData: { componentType: 17, accent_color: null, spoiler: false } },
  { type: "section",           label: "Section",        value: "Row layout",    componentType: 9,    icon: <Columns2 size={12} />,          color: "#5865F2", defaultData: { componentType: 9 } },
  { type: "textDisplay",       label: "Text Display",   value: "Markdown",      componentType: 10,   icon: <AlignLeft size={12} />,         color: "#14b8a6", defaultData: { componentType: 10, content: "" } },
  { type: "thumbnail",         label: "Thumbnail",      value: "Image",         componentType: 11,   icon: <Image size={12} />,             color: "#14b8a6", defaultData: { componentType: 11, url: "", description: "" } },
  { type: "mediaGallery",      label: "Media Gallery",  value: "Grid",          componentType: 12,   icon: <Grid2x2 size={12} />,           color: "#14b8a6", defaultData: { componentType: 12, items: [] } },
  { type: "separator",         label: "Separator",      value: "Divider",       componentType: 14,   icon: <Minus size={12} />,             color: "#14b8a6", defaultData: { componentType: 14, spacing: "md", divider: false } },
  { type: "actionRow",         label: "Action Row",     value: "Row",           componentType: 1,    icon: <AlignJustify size={12} />,      color: "#f59e0b", defaultData: { componentType: 1 } },
  { type: "button",            label: "Button",         value: "Clickable",     componentType: 2,    icon: <MousePointerClick size={12} />, color: "#f59e0b", defaultData: { componentType: 2, label: "Click me", style: "Primary", custom_id: "", emoji: "", disabled: false } },
  { type: "selectMenu",        label: "String Select",  value: "Options",       componentType: 3,    icon: <ChevronDown size={12} />,       color: "#f59e0b", defaultData: { componentType: 3, custom_id: "", placeholder: "Make a selection…", min_values: 1, max_values: 1, options: [], disabled: false } },
  { type: "userSelect",        label: "User Select",    value: "User picker",   componentType: 5,    icon: <User size={12} />,              color: "#f59e0b", defaultData: { componentType: 5, custom_id: "", placeholder: "Select a user…", min_values: 1, max_values: 1, disabled: false } },
  { type: "roleSelect",        label: "Role Select",    value: "Role picker",   componentType: 6,    icon: <Shield size={12} />,            color: "#f59e0b", defaultData: { componentType: 6, custom_id: "", placeholder: "Select a role…", min_values: 1, max_values: 1, disabled: false } },
  { type: "mentionableSelect", label: "Mentionable",    value: "User or role",  componentType: 7,    icon: <AtSign size={12} />,            color: "#f59e0b", defaultData: { componentType: 7, custom_id: "", placeholder: "Select a user or role…", min_values: 1, max_values: 1, disabled: false } },
  { type: "channelSelect",     label: "Channel Select", value: "Channel",       componentType: 8,    icon: <Hash size={12} />,              color: "#f59e0b", defaultData: { componentType: 8, custom_id: "", placeholder: "Select a channel…", min_values: 1, max_values: 1, disabled: false } },
  { type: "textInput",         label: "Text Input",     value: "Text field",    componentType: 4,    icon: <TextCursorInput size={12} />,   color: "#ec4899", defaultData: { componentType: 4, custom_id: "", label: "Label", style: "Short", placeholder: "", required: true, min_length: null, max_length: null, value: "" } },
  { type: "embed",             label: "Embed",          value: "Legacy V1",     componentType: 0,    icon: <FileText size={12} />,          color: "#6b7280", defaultData: { componentType: 0, title: "", description: "", color: 0x5865f2 } },
  { type: "bot",               label: "Bot",            value: "Your token",    componentType: null, icon: <Bot size={12} />,               color: "#8b5cf6", defaultData: { componentType: -1, token: "", connected: false, botName: null, botAvatar: null, selectedGuildId: null, selectedChannelId: null, guilds: [], channels: [] } },
  { type: "openembedded",      label: "OpenEmbedded",   value: "Platform",      componentType: null, icon: <Layers size={12} />,            color: "#8b5cf6", defaultData: { componentType: -2, initialNodeId: null } },
];

const GROUPS = [
  { label: "Layout",      color: "#5865F2", types: ["container", "section"] },
  { label: "Content",     color: "#14b8a6", types: ["textDisplay", "thumbnail", "mediaGallery", "separator"] },
  { label: "Interactive", color: "#f59e0b", types: ["actionRow", "button", "selectMenu", "userSelect", "roleSelect", "mentionableSelect", "channelSelect"] },
  { label: "Modals",      color: "#ec4899", types: ["textInput"] },
  { label: "Legacy",      color: "#6b7280", types: ["embed"] },
  { label: "Advanced",    color: "#8b5cf6", types: ["bot", "openembedded"] },
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

  const renderRow = (def: NodeDef, isLast: boolean) => {
    const isHovered = hoveredType === def.type;
    return (
      <button
        key={def.type}
        data-testid={`add-node-${def.type}`}
        onClick={() => handleAdd(def)}
        onMouseEnter={() => setHoveredType(def.type)}
        onMouseLeave={() => setHoveredType(null)}
        style={{
          display: "flex",
          alignItems: "center",
          width: "100%",
          minHeight: 44,
          padding: "0 12px 0 10px",
          background: isHovered ? "rgba(255,255,255,0.04)" : "transparent",
          border: "none",
          cursor: "pointer",
          textAlign: "left",
          position: "relative",
          transition: "background 0.1s",
          boxSizing: "border-box",
          gap: 10,
        }}
      >
        {/* Left hover accent bar */}
        <div
          style={{
            position: "absolute",
            left: 0, top: 6, bottom: 6,
            width: 2,
            borderRadius: 2,
            background: def.color,
            opacity: isHovered ? 1 : 0,
            transition: "opacity 0.1s",
          }}
        />

        {/* Icon badge */}
        <div
          style={{
            width: 24, height: 24,
            borderRadius: 6,
            background: def.color + "18",
            border: `1px solid ${def.color}28`,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: def.color,
            flexShrink: 0,
          }}
        >
          {def.icon}
        </div>

        {/* Label */}
        <span
          style={{
            flex: 1,
            fontSize: 13,
            fontWeight: 500,
            color: isHovered ? "#e8e8e8" : "#c8c8c8",
            fontFamily: "inherit",
            letterSpacing: "-0.01em",
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
            transition: "color 0.1s",
          }}
        >
          {def.label}
        </span>

        {/* Muted value tag */}
        <span
          style={{
            fontSize: 11,
            color: "#3d3d3d",
            fontFamily: "inherit",
            whiteSpace: "nowrap",
            flexShrink: 0,
            background: "rgba(255,255,255,0.04)",
            padding: "2px 6px",
            borderRadius: 4,
          }}
        >
          {def.value}
        </span>

        {/* Divider */}
        {!isLast && (
          <div
            style={{
              position: "absolute",
              bottom: 0, left: 36, right: 12,
              height: 1,
              background: "rgba(255,255,255,0.04)",
              pointerEvents: "none",
            }}
          />
        )}
      </button>
    );
  };

  const renderCard = (defs: NodeDef[], groupColor: string) => (
    <div
      style={{
        background: "#161616",
        borderRadius: 8,
        overflow: "hidden",
        border: "1px solid rgba(255,255,255,0.06)",
      }}
    >
      {/* Card top accent strip */}
      <div style={{ height: 2, background: groupColor, opacity: 0.5 }} />
      {defs.map((def, i) => renderRow(def, i === defs.length - 1))}
    </div>
  );

  return (
    <div
      style={{
        width: 260,
        flexShrink: 0,
        background: "#111111",
        borderRight: "1px solid #1d1d1d",
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
      }}
    >
      {/* Search */}
      <div style={{ padding: "12px 12px 8px", flexShrink: 0 }}>
        <input
          type="text"
          placeholder="Search components"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{
            width: "100%",
            background: "#1a1a1a",
            border: "1px solid rgba(255,255,255,0.06)",
            borderRadius: 8,
            color: "#e2e2e2",
            fontSize: 13,
            fontWeight: 400,
            padding: "8px 12px",
            outline: "none",
            boxSizing: "border-box",
            fontFamily: "inherit",
            caretColor: "#e2e2e2",
          }}
          onFocus={(e) => {
            (e.currentTarget as HTMLInputElement).style.borderColor = "rgba(88,101,242,0.4)";
          }}
          onBlur={(e) => {
            (e.currentTarget as HTMLInputElement).style.borderColor = "rgba(255,255,255,0.06)";
          }}
        />
      </div>

      {/* Scrollable content */}
      <div style={{ overflowY: "auto", flex: 1, padding: "4px 12px 24px" }}>
        {searchResults ? (
          searchResults.length > 0 ? (
            <>
              <div style={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", color: "#3a3a3a", marginBottom: 6 }}>
                Results
              </div>
              {renderCard(searchResults, "#5865F2")}
            </>
          ) : (
            <div style={{ color: "#3a3a3a", fontSize: 13, textAlign: "center", paddingTop: 32, fontFamily: "inherit" }}>
              No results
            </div>
          )
        ) : (
          GROUPS.map((group) => {
            const defs = group.types
              .map((t) => NODE_MAP.get(t))
              .filter((d): d is NodeDef => d !== undefined);
            if (defs.length === 0) return null;

            return (
              <div key={group.label} style={{ marginBottom: 16 }}>
                {/* Group label with color dot */}
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 5,
                    marginBottom: 6,
                    padding: "0 2px",
                  }}
                >
                  <div
                    style={{
                      width: 5, height: 5,
                      borderRadius: "50%",
                      background: group.color,
                      flexShrink: 0,
                      opacity: 0.7,
                    }}
                  />
                  <span
                    style={{
                      fontSize: 10,
                      fontWeight: 700,
                      textTransform: "uppercase",
                      letterSpacing: "0.08em",
                      color: "#505050",
                    }}
                  >
                    {group.label}
                  </span>
                </div>

                {renderCard(defs, group.color)}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
