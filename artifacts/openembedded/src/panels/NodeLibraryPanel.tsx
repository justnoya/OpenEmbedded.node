import { useCallback, useState } from "react";
import { useGraphStore, AppNode, AppNodeData } from "@/lib/graphStore";
import {
  Package, LayoutTemplate, FileText, ImageIcon, GalleryHorizontalEnd,
  Minus, Rows3, PointerIcon, ListFilter, UserRound, ShieldCheck,
  AtSign, Hash, FormInput, MessageSquareCode, Search, ChevronDown,
  ChevronRight, X, Bot, Sparkles,
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
  { type: "container",          label: "Container",           description: "Root wrapper with accent & spoiler",         componentType: 17,   accentColor: "#8b5cf6", icon: <Package size={14} />,              defaultData: { componentType: 17, accent_color: null, spoiler: false } },
  { type: "section",            label: "Section",             description: "Text + thumbnail accessory",                 componentType: 9,    accentColor: "#10b981", icon: <LayoutTemplate size={14} />,       defaultData: { componentType: 9 } },
  { type: "textDisplay",        label: "Text Display",        description: "Markdown content block",                     componentType: 10,   accentColor: "#3b82f6", icon: <FileText size={14} />,             defaultData: { componentType: 10, content: "" } },
  { type: "thumbnail",          label: "Thumbnail",           description: "Image accessory for sections",               componentType: 11,   accentColor: "#f59e0b", icon: <ImageIcon size={14} />,            defaultData: { componentType: 11, url: "", description: "" } },
  { type: "mediaGallery",       label: "Media Gallery",       description: "Image grid layout",                          componentType: 12,   accentColor: "#ec4899", icon: <GalleryHorizontalEnd size={14} />, defaultData: { componentType: 12, items: [] } },
  { type: "separator",          label: "Separator",           description: "Spacing with optional divider",              componentType: 14,   accentColor: "#6b7280", icon: <Minus size={14} />,                defaultData: { componentType: 14, spacing: "md", divider: false } },
  { type: "actionRow",          label: "Action Row",          description: "Container for buttons & selects",            componentType: 1,    accentColor: "#14b8a6", icon: <Rows3 size={14} />,                defaultData: { componentType: 1 } },
  { type: "button",             label: "Button",              description: "Clickable button",                           componentType: 2,    accentColor: "#5865F2", icon: <PointerIcon size={14} />,          defaultData: { componentType: 2, label: "Click me", style: "Primary", custom_id: "", emoji: "", disabled: false } },
  { type: "selectMenu",         label: "String Select",       description: "Dropdown with custom options",               componentType: 3,    accentColor: "#f97316", icon: <ListFilter size={14} />,           defaultData: { componentType: 3, custom_id: "", placeholder: "Make a selection…", min_values: 1, max_values: 1, options: [], disabled: false } },
  { type: "userSelect",         label: "User Select",         description: "Discord user picker",                        componentType: 5,    accentColor: "#06b6d4", icon: <UserRound size={14} />,            defaultData: { componentType: 5, custom_id: "", placeholder: "Select a user…", min_values: 1, max_values: 1, disabled: false } },
  { type: "roleSelect",         label: "Role Select",         description: "Discord role picker",                        componentType: 6,    accentColor: "#a855f7", icon: <ShieldCheck size={14} />,          defaultData: { componentType: 6, custom_id: "", placeholder: "Select a role…", min_values: 1, max_values: 1, disabled: false } },
  { type: "mentionableSelect",  label: "Mentionable Select",  description: "User + role picker",                         componentType: 7,    accentColor: "#ec4899", icon: <AtSign size={14} />,               defaultData: { componentType: 7, custom_id: "", placeholder: "Select a user or role…", min_values: 1, max_values: 1, disabled: false } },
  { type: "channelSelect",      label: "Channel Select",      description: "Discord channel picker",                     componentType: 8,    accentColor: "#22c55e", icon: <Hash size={14} />,                 defaultData: { componentType: 8, custom_id: "", placeholder: "Select a channel…", min_values: 1, max_values: 1, disabled: false } },
  { type: "textInput",          label: "Text Input",          description: "Short or paragraph modal input",             componentType: 4,    accentColor: "#64748b", icon: <FormInput size={14} />,            defaultData: { componentType: 4, custom_id: "", label: "Label", style: "Short", placeholder: "", required: true, min_length: null, max_length: null, value: "" } },
  { type: "embed",              label: "Embed (V1)",          description: "Legacy rich embed message",                  componentType: 0,    accentColor: "#f59e0b", icon: <MessageSquareCode size={14} />,    defaultData: { componentType: 0, title: "", description: "", color: 0x5865f2 } },
  { type: "bot",                label: "Bot",                 description: "Send via your own Discord bot token",        componentType: null, accentColor: "#5865F2", icon: <Bot size={14} />,                  defaultData: { componentType: -1, token: "", connected: false, botName: null, botAvatar: null, selectedGuildId: null, selectedChannelId: null, guilds: [], channels: [] } },
  { type: "openembedded",       label: "OpenEmbedded",        description: "Official platform bot — interactive flows",  componentType: null, accentColor: "#6366f1", icon: <Sparkles size={14} />,             defaultData: { componentType: -2, initialNodeId: null } },
];

const GROUPS = [
  { label: "Layout",      types: ["container", "section"] },
  { label: "Content",     types: ["textDisplay", "thumbnail", "mediaGallery", "separator"] },
  { label: "Interactive", types: ["actionRow", "button", "selectMenu", "userSelect", "roleSelect", "mentionableSelect", "channelSelect"] },
  { label: "Modals",      types: ["textInput"] },
  { label: "Legacy",      types: ["embed"] },
  { label: "Advanced",    types: ["bot", "openembedded"] },
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
    ? NODE_DEFS.filter((d) => d.label.toLowerCase().includes(q) || d.description.toLowerCase().includes(q))
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
        display: "flex", alignItems: "center", gap: 10,
        width: "100%", padding: "7px 10px",
        background: "transparent", border: "none",
        borderRadius: 8, cursor: "pointer", textAlign: "left",
        marginBottom: 1, transition: "background 0.1s",
        position: "relative", overflow: "hidden",
      }}
      onMouseEnter={(e) => {
        const el = e.currentTarget as HTMLElement;
        el.style.background = "rgba(255,255,255,0.04)";
        const pip = el.querySelector(".accent-pip") as HTMLElement;
        if (pip) pip.style.opacity = "1";
      }}
      onMouseLeave={(e) => {
        const el = e.currentTarget as HTMLElement;
        el.style.background = "transparent";
        const pip = el.querySelector(".accent-pip") as HTMLElement;
        if (pip) pip.style.opacity = "0";
      }}
    >
      <div className="accent-pip" style={{
        position: "absolute", left: 0, top: "50%",
        transform: "translateY(-50%)",
        width: 2.5, height: 18, borderRadius: 2,
        background: def.accentColor,
        opacity: 0,
        transition: "opacity 0.15s",
        boxShadow: `0 0 6px ${def.accentColor}`,
      }} />

      <div style={{
        width: 32, height: 32, borderRadius: 8,
        background: `linear-gradient(135deg, ${def.accentColor}20, ${def.accentColor}08)`,
        border: `1px solid ${def.accentColor}18`,
        display: "flex", alignItems: "center", justifyContent: "center",
        color: def.accentColor, flexShrink: 0,
        boxShadow: `0 0 8px ${def.accentColor}10`,
      }}>
        {def.icon}
      </div>

      <div style={{ minWidth: 0, flex: 1 }}>
        <div style={{ color: "#d0d0d0", fontSize: 12, fontWeight: 500, marginBottom: 1, letterSpacing: "-0.01em" }}>
          {def.label}
        </div>
        <div style={{
          color: "#484848", fontSize: 11,
          overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
        }}>
          {def.description}
        </div>
      </div>

      {def.type === "openembedded" && (
        <div style={{
          background: "rgba(99,102,241,0.15)", border: "1px solid rgba(99,102,241,0.3)",
          borderRadius: 4, padding: "1px 5px",
          color: "#818cf8", fontSize: 8, fontWeight: 800,
          letterSpacing: "0.08em", textTransform: "uppercase",
          flexShrink: 0,
        }}>
          NEW
        </div>
      )}
    </button>
  );

  return (
    <div style={{
      width: 252, flexShrink: 0,
      background: "#161616",
      borderRight: "1px solid rgba(255,255,255,0.06)",
      display: "flex", flexDirection: "column", overflow: "hidden",
    }}>
      {/* Header */}
      <div style={{
        padding: "14px 12px 11px",
        borderBottom: "1px solid rgba(255,255,255,0.05)",
        flexShrink: 0,
      }}>
        <div style={{
          color: "#909090", fontSize: 10, fontWeight: 700,
          textTransform: "uppercase", letterSpacing: "0.09em",
          marginBottom: 10,
        }}>
          Components
        </div>

        {/* Search */}
        <div style={{
          display: "flex", alignItems: "center", gap: 7,
          background: focused ? "rgba(255,255,255,0.05)" : "rgba(255,255,255,0.03)",
          border: `1px solid ${focused ? "rgba(88,101,242,0.45)" : "rgba(255,255,255,0.07)"}`,
          borderRadius: 8, padding: "6px 10px",
          transition: "border-color 0.15s, background 0.15s",
          boxShadow: focused ? "0 0 0 3px rgba(88,101,242,0.1)" : "none",
        }}>
          <Search size={12} color={focused ? "#818cf8" : "#404040"} style={{ flexShrink: 0, transition: "color 0.15s" }} />
          <input
            type="text"
            placeholder="Search…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onFocus={() => setFocused(true)}
            onBlur={() => setFocused(false)}
            style={{
              flex: 1, background: "transparent", border: "none", outline: "none",
              color: "#d0d0d0", fontSize: 12, fontFamily: "inherit",
            }}
          />
          {search && (
            <button
              onClick={() => setSearch("")}
              style={{
                background: "rgba(255,255,255,0.08)", border: "none", borderRadius: 4,
                color: "#606060", cursor: "pointer", padding: "1px 4px",
                display: "flex", alignItems: "center", transition: "background 0.12s",
              }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.12)"; }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.08)"; }}
            >
              <X size={10} />
            </button>
          )}
        </div>
      </div>

      {/* List */}
      <div style={{ overflowY: "auto", flex: 1, padding: "6px 4px" }}>
        {filtered ? (
          filtered.length > 0 ? (
            filtered.map((def) => <NodeCard key={def.type} def={def} />)
          ) : (
            <div style={{ color: "#383838", fontSize: 12, textAlign: "center", padding: "32px 0" }}>
              No results for "<span style={{ color: "#555555" }}>{search}</span>"
            </div>
          )
        ) : (
          GROUPS.map((group) => {
            const defs = NODE_DEFS.filter((d) => group.types.includes(d.type));
            const isCollapsed = !!collapsed[group.label];
            return (
              <div key={group.label} style={{ marginBottom: 4 }}>
                <button
                  onClick={() => toggleGroup(group.label)}
                  style={{
                    display: "flex", alignItems: "center", gap: 5,
                    width: "100%", background: "transparent", border: "none",
                    cursor: "pointer", padding: "7px 10px 4px",
                    borderRadius: 6, transition: "background 0.1s",
                  }}
                  onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.02)"; }}
                  onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = "transparent"; }}
                >
                  {isCollapsed
                    ? <ChevronRight size={10} color="#383838" />
                    : <ChevronDown size={10} color="#383838" />}
                  <span style={{
                    color: "#484848", fontSize: 10, fontWeight: 700,
                    textTransform: "uppercase", letterSpacing: "0.1em",
                  }}>
                    {group.label}
                  </span>
                  <span style={{
                    marginLeft: "auto",
                    background: "rgba(255,255,255,0.06)",
                    border: "1px solid rgba(255,255,255,0.06)",
                    borderRadius: 20, padding: "0 5px",
                    color: "#404040", fontSize: 9, fontWeight: 700,
                    letterSpacing: "0.03em",
                  }}>
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
