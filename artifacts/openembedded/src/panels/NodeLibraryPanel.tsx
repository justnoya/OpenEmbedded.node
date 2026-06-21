import { useCallback, useState } from "react";
import { useGraphStore, AppNode, AppNodeData } from "@/lib/graphStore";

interface NodeDef {
  type: string;
  label: string;
  value: string;
  componentType: number | null;
  defaultData: Partial<AppNodeData>;
}

const NODE_DEFS: NodeDef[] = [
  { type: "container",         label: "Container",          value: "Wrapper",       componentType: 17,   defaultData: { componentType: 17, accent_color: null, spoiler: false } },
  { type: "section",           label: "Section",            value: "Row layout",    componentType: 9,    defaultData: { componentType: 9 } },
  { type: "textDisplay",       label: "Text Display",       value: "Markdown",      componentType: 10,   defaultData: { componentType: 10, content: "" } },
  { type: "thumbnail",         label: "Thumbnail",          value: "Image",         componentType: 11,   defaultData: { componentType: 11, url: "", description: "" } },
  { type: "mediaGallery",      label: "Media Gallery",      value: "Grid",          componentType: 12,   defaultData: { componentType: 12, items: [] } },
  { type: "separator",         label: "Separator",          value: "Divider",       componentType: 14,   defaultData: { componentType: 14, spacing: "md", divider: false } },
  { type: "actionRow",         label: "Action Row",         value: "Row",           componentType: 1,    defaultData: { componentType: 1 } },
  { type: "button",            label: "Button",             value: "Clickable",     componentType: 2,    defaultData: { componentType: 2, label: "Click me", style: "Primary", custom_id: "", emoji: "", disabled: false } },
  { type: "selectMenu",        label: "String Select",      value: "Options",       componentType: 3,    defaultData: { componentType: 3, custom_id: "", placeholder: "Make a selection…", min_values: 1, max_values: 1, options: [], disabled: false } },
  { type: "userSelect",        label: "User Select",        value: "User picker",   componentType: 5,    defaultData: { componentType: 5, custom_id: "", placeholder: "Select a user…", min_values: 1, max_values: 1, disabled: false } },
  { type: "roleSelect",        label: "Role Select",        value: "Role picker",   componentType: 6,    defaultData: { componentType: 6, custom_id: "", placeholder: "Select a role…", min_values: 1, max_values: 1, disabled: false } },
  { type: "mentionableSelect", label: "Mentionable",        value: "User or role",  componentType: 7,    defaultData: { componentType: 7, custom_id: "", placeholder: "Select a user or role…", min_values: 1, max_values: 1, disabled: false } },
  { type: "channelSelect",     label: "Channel Select",     value: "Channel",       componentType: 8,    defaultData: { componentType: 8, custom_id: "", placeholder: "Select a channel…", min_values: 1, max_values: 1, disabled: false } },
  { type: "textInput",         label: "Text Input",         value: "Text field",    componentType: 4,    defaultData: { componentType: 4, custom_id: "", label: "Label", style: "Short", placeholder: "", required: true, min_length: null, max_length: null, value: "" } },
  { type: "embed",             label: "Embed",              value: "Legacy V1",     componentType: 0,    defaultData: { componentType: 0, title: "", description: "", color: 0x5865f2 } },
  { type: "bot",               label: "Bot",                value: "Your token",    componentType: null, defaultData: { componentType: -1, token: "", connected: false, botName: null, botAvatar: null, selectedGuildId: null, selectedChannelId: null, guilds: [], channels: [] } },
  { type: "openembedded",      label: "OpenEmbedded",       value: "Platform",      componentType: null, defaultData: { componentType: -2, initialNodeId: null } },
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
        width: "100%",
        minHeight: 54,
        padding: "0 16px",
        background: hoveredType === def.type ? "#202020" : "transparent",
        border: "none",
        cursor: "pointer",
        textAlign: "left",
        position: "relative",
        transition: "background 0.1s",
        boxSizing: "border-box",
      }}
    >
      {/* Label */}
      <span
        style={{
          flex: 1,
          fontSize: 16,
          fontWeight: 400,
          color: "#e2e2e2",
          fontFamily: "inherit",
          letterSpacing: "-0.01em",
          overflow: "hidden",
          textOverflow: "ellipsis",
          whiteSpace: "nowrap",
          paddingRight: 8,
        }}
      >
        {def.label}
      </span>

      {/* Muted value */}
      <span
        style={{
          fontSize: 15,
          color: "#4a4a4a",
          fontFamily: "inherit",
          whiteSpace: "nowrap",
          marginRight: 6,
          flexShrink: 0,
        }}
      >
        {def.value}
      </span>

      {/* Chevron */}
      <span
        style={{
          fontSize: 18,
          color: "#3a3a3a",
          lineHeight: 1,
          flexShrink: 0,
          userSelect: "none",
        }}
      >
        ›
      </span>

      {/* Divider — full width, not on last row */}
      {!isLast && (
        <div
          style={{
            position: "absolute",
            bottom: 0,
            left: 0,
            right: 0,
            height: 1,
            background: "#242424",
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
        borderRight: "1px solid #1d1d1d",
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
      }}
    >
      {/* Search */}
      <div style={{ padding: "16px 16px 8px", flexShrink: 0 }}>
        <input
          type="text"
          placeholder="Search components"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{
            width: "100%",
            background: "#1a1a1a",
            border: "none",
            borderRadius: 10,
            color: "#e2e2e2",
            fontSize: 15,
            fontWeight: 400,
            padding: "10px 14px",
            outline: "none",
            boxSizing: "border-box",
            fontFamily: "inherit",
            caretColor: "#e2e2e2",
          }}
          onFocus={(e) => { (e.currentTarget as HTMLInputElement).style.background = "#202020"; }}
          onBlur={(e) => { (e.currentTarget as HTMLInputElement).style.background = "#1a1a1a"; }}
        />
      </div>

      {/* Scrollable content */}
      <div
        style={{
          overflowY: "auto",
          flex: 1,
          padding: "8px 16px 24px",
        }}
      >
        {searchResults ? (
          searchResults.length > 0 ? (
            <>
              {/* Search results as a single card */}
              <div
                style={{
                  fontSize: 12,
                  fontWeight: 600,
                  textTransform: "uppercase",
                  letterSpacing: "0.06em",
                  color: "#3a3a3a",
                  marginBottom: 8,
                }}
              >
                Results
              </div>
              <div
                style={{
                  background: "#1a1a1a",
                  borderRadius: 12,
                  overflow: "hidden",
                }}
              >
                {searchResults.map((def, i) =>
                  renderRow(def, i === searchResults.length - 1)
                )}
              </div>
            </>
          ) : (
            <div
              style={{
                color: "#3a3a3a",
                fontSize: 14,
                textAlign: "center",
                paddingTop: 32,
                fontFamily: "inherit",
              }}
            >
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
              <div key={group.label} style={{ marginBottom: 24 }}>
                {/* Section label */}
                <div
                  style={{
                    fontSize: 12,
                    fontWeight: 600,
                    textTransform: "uppercase",
                    letterSpacing: "0.06em",
                    color: "#3a3a3a",
                    marginBottom: 8,
                  }}
                >
                  {group.label}
                </div>

                {/* Card */}
                <div
                  style={{
                    background: "#1a1a1a",
                    borderRadius: 12,
                    overflow: "hidden",
                  }}
                >
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
