import { useCallback, useState, type ReactNode } from "react";
import { useGraphStore, AppNode, AppNodeData } from "@/lib/graphStore";
import {
  Box, AlignJustify, AlignLeft, Image, LayoutGrid, Minus,
  LayoutList, MousePointerClick, ListFilter, User, Shield,
  AtSign, Hash, TextCursorInput, Layers, Bot, Workflow,
  Search, Zap,
} from "lucide-react";

interface NodeDef {
  type: string;
  label: string;
  alias?: string;
  description: string;
  icon: ReactNode;
  componentType: number | null;
  defaultData: Partial<AppNodeData>;
  recommended?: boolean;
  comingSoon?: boolean;
}

const IC = ({ children, color }: { children: ReactNode; color?: string }) => (
  <span style={{ display: "flex", alignItems: "center", justifyContent: "center", color: color ?? "rgba(255,255,255,0.75)", flexShrink: 0 }}>
    {children}
  </span>
);

const NODE_DEFS: NodeDef[] = [
  {
    type: "container", label: "Container", alias: "Outer wrapper",
    description: "The outer wrapper — start every message with this.",
    icon: <IC><Box size={15} /></IC>, componentType: 17,
    defaultData: { componentType: 17, accent_color: null, spoiler: false },
    recommended: true,
  },
  {
    type: "section", label: "Section", alias: "Row layout",
    description: "Splits a row into a main content area + thumbnail side.",
    icon: <IC><AlignJustify size={15} /></IC>, componentType: 9,
    defaultData: { componentType: 9 },
  },
  {
    type: "textDisplay", label: "Text Display", alias: "Message text",
    description: "Plain text or markdown. Supports **bold**, *italic*, links.",
    icon: <IC><AlignLeft size={15} /></IC>, componentType: 10,
    defaultData: { componentType: 10, content: "" },
    recommended: true,
  },
  {
    type: "thumbnail", label: "Thumbnail", alias: "Side image",
    description: "A small image shown on the side of a Section.",
    icon: <IC><Image size={15} /></IC>, componentType: 11,
    defaultData: { componentType: 11, url: "", description: "" },
  },
  {
    type: "mediaGallery", label: "Media Gallery", alias: "Image grid",
    description: "Displays multiple images in a grid layout.",
    icon: <IC><LayoutGrid size={15} /></IC>, componentType: 12,
    defaultData: { componentType: 12, items: [] },
  },
  {
    type: "separator", label: "Separator", alias: "Divider",
    description: "A horizontal divider with optional visible line.",
    icon: <IC><Minus size={15} /></IC>, componentType: 14,
    defaultData: { componentType: 14, spacing: "md", divider: false },
  },
  {
    type: "actionRow", label: "Action Row", alias: "Button container",
    description: "A horizontal row that holds buttons or a select menu.",
    icon: <IC><LayoutList size={15} /></IC>, componentType: 1,
    defaultData: { componentType: 1 },
  },
  {
    type: "button", label: "Button", alias: "Clickable",
    description: "A clickable button. Connect to a response via the amber handle.",
    icon: <IC><MousePointerClick size={15} /></IC>, componentType: 2,
    defaultData: { componentType: 2, label: "Click me", style: "Primary", custom_id: "", emoji: "", disabled: false },
    recommended: true,
  },
  {
    type: "selectMenu", label: "String Select", alias: "Dropdown",
    description: "A dropdown with custom text options to choose from.",
    icon: <IC><ListFilter size={15} /></IC>, componentType: 3,
    defaultData: { componentType: 3, custom_id: "", placeholder: "Make a selection…", min_values: 1, max_values: 1, options: [], disabled: false },
  },
  {
    type: "userSelect", label: "User Select", alias: "User picker",
    description: "Lets users pick someone from the server member list.",
    icon: <IC><User size={15} /></IC>, componentType: 5,
    defaultData: { componentType: 5, custom_id: "", placeholder: "Select a user…", min_values: 1, max_values: 1, disabled: false },
    comingSoon: true,
  },
  {
    type: "roleSelect", label: "Role Select", alias: "Role picker",
    description: "Lets users choose a server role from a dropdown.",
    icon: <IC><Shield size={15} /></IC>, componentType: 6,
    defaultData: { componentType: 6, custom_id: "", placeholder: "Select a role…", min_values: 1, max_values: 1, disabled: false },
    comingSoon: true,
  },
  {
    type: "mentionableSelect", label: "Mentionable Select", alias: "User or role",
    description: "Dropdown that lets users pick a user or a role.",
    icon: <IC><AtSign size={15} /></IC>, componentType: 7,
    defaultData: { componentType: 7, custom_id: "", placeholder: "Select a user or role…", min_values: 1, max_values: 1, disabled: false },
    comingSoon: true,
  },
  {
    type: "channelSelect", label: "Channel Select", alias: "Channel picker",
    description: "Lets users pick a channel from the server channel list.",
    icon: <IC><Hash size={15} /></IC>, componentType: 8,
    defaultData: { componentType: 8, custom_id: "", placeholder: "Select a channel…", min_values: 1, max_values: 1, disabled: false },
    comingSoon: true,
  },
  {
    type: "textInput", label: "Text Input", alias: "Text field",
    description: "A text field inside a modal dialog — attach to a button.",
    icon: <IC><TextCursorInput size={15} /></IC>, componentType: 4,
    defaultData: { componentType: 4, custom_id: "", label: "Label", style: "Short", placeholder: "", required: true, min_length: null, max_length: null, value: "" },
    comingSoon: true,
  },
  {
    type: "embed", label: "Embed", alias: "Legacy V1",
    description: "Classic Discord embed (V1). Use Container for newer CV2 messages.",
    icon: <IC><Layers size={15} /></IC>, componentType: 0,
    defaultData: { componentType: 0, title: "", description: "", color: 0x5865f2 },
    comingSoon: true,
  },
  {
    type: "bot", label: "Bot", alias: "Your bot token",
    description: "⚠️ Requires a Discord bot token. Send messages via your own bot.",
    icon: <IC><Bot size={15} /></IC>, componentType: null,
    defaultData: { componentType: -1, token: "", connected: false, botName: null, botAvatar: null, selectedGuildId: null, selectedChannelId: null, guilds: [], channels: [] },
  },
  {
    type: "openembedded", label: "OpenEmbedded Bot", alias: "No token needed",
    description: "Send via the platform's managed bot — no setup required.",
    icon: <IC color="#555"><Workflow size={15} /></IC>, componentType: null,
    defaultData: { componentType: -2, initialNodeId: null },
    comingSoon: true,
  },
];

const GROUPS = [
  { label: "Layout",          types: ["container", "section"],                                                          hint: "Start here" },
  { label: "Content",         types: ["textDisplay", "thumbnail", "mediaGallery", "separator"],                        hint: null },
  { label: "Interactive",     types: ["actionRow", "button", "selectMenu", "userSelect", "roleSelect", "mentionableSelect", "channelSelect"], hint: null },
  { label: "Modals",          types: ["textInput"],                                                                     hint: "For modal dialogs" },
  { label: "Legacy",          types: ["embed"],                                                                         hint: "V1 only" },
  { label: "Bot Integration", types: ["bot", "openembedded"],                                                           hint: "Send to Discord" },
];

const NODE_MAP = new Map(NODE_DEFS.map((d) => [d.type, d]));
const RECOMMENDED = NODE_DEFS.filter((d) => d.recommended);

let nodeIdCounter = Date.now();

export function NodeLibraryPanel() {
  const addNode = useGraphStore((s) => s.addNode);
  const [search, setSearch] = useState("");
  const [hoveredType, setHoveredType] = useState<string | null>(null);

  const handleAdd = useCallback(
    (def: NodeDef) => {
      if (def.comingSoon) return;
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
    ? NODE_DEFS.filter((d) => d.label.toLowerCase().includes(q) || (d.alias ?? "").toLowerCase().includes(q) || d.description.toLowerCase().includes(q))
    : null;

  const renderRow = (def: NodeDef, isLast: boolean) => {
    const isHovered = hoveredType === def.type;
    const isDisabled = !!def.comingSoon;

    return (
      <button
        key={def.type}
        data-testid={`add-node-${def.type}`}
        onClick={() => handleAdd(def)}
        onMouseEnter={() => !isDisabled && setHoveredType(def.type)}
        onMouseLeave={() => setHoveredType(null)}
        disabled={isDisabled}
        style={{
          display: "flex",
          alignItems: "flex-start",
          gap: 10,
          width: "100%",
          padding: "9px 14px",
          background: isDisabled ? "transparent" : isHovered ? "rgba(255,255,255,0.05)" : "transparent",
          border: "none",
          cursor: isDisabled ? "default" : "pointer",
          textAlign: "left",
          position: "relative",
          transition: "background 0.1s",
          boxSizing: "border-box",
          opacity: isDisabled ? 0.38 : 1,
          pointerEvents: "auto",
        }}
      >
        {/* Icon — slightly dimmed for disabled */}
        <div style={{ marginTop: 1, flexShrink: 0, filter: isDisabled ? "grayscale(1)" : "none" }}>
          {def.icon}
        </div>

        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
            <span style={{
              fontSize: 13, fontWeight: 500,
              color: isDisabled ? "#4a4a4a" : "#d4d4d4",
              fontFamily: "inherit", letterSpacing: "-0.01em",
              overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
            }}>
              {def.label}
            </span>

            {def.recommended && !isDisabled && (
              <span style={{
                fontSize: 9, fontWeight: 700, color: "#5865F2",
                background: "rgba(88,101,242,0.12)",
                border: "1px solid rgba(88,101,242,0.2)",
                borderRadius: 4, padding: "1px 5px",
                letterSpacing: "0.04em", textTransform: "uppercase", flexShrink: 0,
              }}>
                Start here
              </span>
            )}

            {isDisabled && (
              <span style={{
                fontSize: 9, fontWeight: 700, color: "#666",
                background: "rgba(255,255,255,0.05)",
                border: "1px solid rgba(255,255,255,0.08)",
                borderRadius: 4, padding: "1px 5px",
                letterSpacing: "0.05em", textTransform: "uppercase", flexShrink: 0,
              }}>
                Soon
              </span>
            )}
          </div>

          <div style={{
            fontSize: 11, color: isDisabled ? "#363636" : "#555",
            lineHeight: 1.45, marginTop: 1,
            overflow: "hidden",
            display: "-webkit-box",
            WebkitLineClamp: 2,
            WebkitBoxOrient: "vertical",
          }}>
            {def.description}
          </div>
        </div>

        {!isLast && (
          <div style={{
            position: "absolute", bottom: 0, left: 14, right: 14, height: 1,
            background: "rgba(255,255,255,0.04)", pointerEvents: "none",
          }} />
        )}
      </button>
    );
  };

  return (
    <div style={{
      width: 260, flexShrink: 0, background: "#111111",
      borderRight: "1px solid rgba(255,255,255,0.05)",
      display: "flex", flexDirection: "column", overflow: "hidden",
    }}>
      {/* Header */}
      <div style={{
        padding: "11px 14px 8px", flexShrink: 0,
        borderBottom: "1px solid rgba(255,255,255,0.04)",
      }}>
        <div style={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", color: "#444", marginBottom: 8 }}>
          Components
        </div>
        {/* Search */}
        <div style={{ position: "relative" }}>
          <span style={{
            position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)",
            color: "#404040", display: "flex", pointerEvents: "none",
          }}>
            <Search size={13} />
          </span>
          <input
            type="text"
            placeholder="Search components…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{
              width: "100%", background: "#1a1a1a",
              border: "1px solid rgba(255,255,255,0.05)", borderRadius: 8,
              color: "#d4d4d4", fontSize: 13, fontWeight: 400,
              padding: "7px 12px 7px 30px", outline: "none",
              boxSizing: "border-box", fontFamily: "inherit",
              caretColor: "#d4d4d4", transition: "border-color 0.12s",
            }}
            onFocus={(e) => { e.currentTarget.style.borderColor = "rgba(88,101,242,0.4)"; }}
            onBlur={(e) => { e.currentTarget.style.borderColor = "rgba(255,255,255,0.05)"; }}
          />
        </div>
      </div>

      {/* Scrollable content */}
      <div style={{ overflowY: "auto", flex: 1, padding: "6px 12px 24px" }}>
        {searchResults ? (
          searchResults.length > 0 ? (
            <>
              <div style={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", color: "#555", margin: "10px 2px 6px" }}>
                Search Results
              </div>
              <div style={{ background: "#1a1a1a", borderRadius: 8, overflow: "hidden", border: "1px solid rgba(255,255,255,0.04)" }}>
                {searchResults.map((def, i) => renderRow(def, i === searchResults.length - 1))}
              </div>
            </>
          ) : (
            <div style={{ textAlign: "center", paddingTop: 32, paddingBottom: 8 }}>
              <Search size={22} color="#2e2e2e" style={{ margin: "0 auto 10px", display: "block" }} />
              <div style={{ color: "#555", fontSize: 13, fontFamily: "inherit" }}>No results for "{q}"</div>
              <button
                onClick={() => setSearch("")}
                style={{ marginTop: 8, color: "#5865F2", fontSize: 12, background: "none", border: "none", cursor: "pointer", fontFamily: "inherit" }}
              >
                Clear search
              </button>
            </div>
          )
        ) : (
          <>
            {/* Quick Start section */}
            <div style={{ marginBottom: 20 }}>
              <div style={{
                display: "flex", alignItems: "center", gap: 5,
                fontSize: 10, fontWeight: 700, textTransform: "uppercase",
                letterSpacing: "0.08em", color: "#555", margin: "10px 2px 6px",
              }}>
                <Zap size={9} color="#f59e0b" />
                Quick Start
              </div>
              <div style={{
                background: "rgba(88,101,242,0.05)", borderRadius: 8, overflow: "hidden",
                border: "1px solid rgba(88,101,242,0.12)",
              }}>
                {RECOMMENDED.map((def, i) => renderRow(def, i === RECOMMENDED.length - 1))}
              </div>
              <div style={{ color: "#3d3d3d", fontSize: 10, textAlign: "center", marginTop: 6, lineHeight: 1.5 }}>
                Container → Text Display → connect them
              </div>
            </div>

            {/* All groups */}
            {GROUPS.map((group) => {
              const defs = group.types.map((t) => NODE_MAP.get(t)).filter((d): d is NodeDef => d !== undefined);
              if (defs.length === 0) return null;
              return (
                <div key={group.label} style={{ marginBottom: 20 }}>
                  <div style={{
                    display: "flex", alignItems: "center", justifyContent: "space-between",
                    margin: "8px 2px 6px",
                  }}>
                    <span style={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", color: "#555" }}>
                      {group.label}
                    </span>
                    {group.hint && (
                      <span style={{ fontSize: 9, color: "#3d3d3d", fontWeight: 500 }}>{group.hint}</span>
                    )}
                  </div>
                  <div style={{ background: "#1a1a1a", borderRadius: 8, overflow: "hidden", border: "1px solid rgba(255,255,255,0.04)" }}>
                    {defs.map((def, i) => renderRow(def, i === defs.length - 1))}
                  </div>
                </div>
              );
            })}

            {/* How connections work */}
            <div style={{
              margin: "8px 0 4px",
              padding: "10px 12px",
              background: "rgba(255,255,255,0.02)",
              border: "1px solid rgba(255,255,255,0.05)",
              borderRadius: 8,
            }}>
              <div style={{ fontSize: 10, fontWeight: 700, color: "#444", marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.06em" }}>
                How to connect nodes
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
                {[
                  { dot: "#5865F2", text: "Blue edge = parent → child (structure)" },
                  { dot: "#f59e0b", text: "Amber edge = button → response (on click)" },
                  { dot: "#10b981", text: "Green edge = bot → message (send)" },
                ].map(({ dot, text }) => (
                  <div key={text} style={{ display: "flex", alignItems: "center", gap: 7 }}>
                    <div style={{ width: 6, height: 6, borderRadius: "50%", background: dot, flexShrink: 0 }} />
                    <span style={{ fontSize: 10, color: "#484848", lineHeight: 1.4 }}>{text}</span>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
