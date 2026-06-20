import { useGraphStore } from "@/lib/graphStore";
import {
  Box, Layers, Type, Image, LayoutGrid, SeparatorHorizontal,
  AlignJustify, MousePointerClick, MessageSquare, Trash2, Hash,
} from "lucide-react";
import { ReactNode } from "react";

const TYPE_META: Record<number, { label: string; icon: ReactNode; color: string }> = {
  17: { label: "Container", icon: <Box size={14} />, color: "#8b5cf6" },
  9:  { label: "Section",   icon: <Layers size={14} />, color: "#10b981" },
  10: { label: "Text Display", icon: <Type size={14} />, color: "#3b82f6" },
  11: { label: "Thumbnail", icon: <Image size={14} />, color: "#f59e0b" },
  12: { label: "Media Gallery", icon: <LayoutGrid size={14} />, color: "#ec4899" },
  14: { label: "Separator", icon: <SeparatorHorizontal size={14} />, color: "#6b7280" },
  1:  { label: "Action Row", icon: <AlignJustify size={14} />, color: "#14b8a6" },
  2:  { label: "Button", icon: <MousePointerClick size={14} />, color: "#5865F2" },
  0:  { label: "Embed", icon: <MessageSquare size={14} />, color: "#f59e0b" },
};

const inputStyle: React.CSSProperties = {
  width: "100%",
  background: "#1C1F2E",
  border: "1px solid #2A2D3E",
  borderRadius: 6,
  color: "#e6edf3",
  fontSize: 12,
  padding: "6px 9px",
  boxSizing: "border-box",
  outline: "none",
  fontFamily: "inherit",
  transition: "border-color 0.15s",
};

const labelStyle: React.CSSProperties = {
  display: "block",
  color: "#7d8590",
  fontSize: 11,
  fontWeight: 600,
  marginBottom: 5,
  textTransform: "uppercase",
  letterSpacing: "0.06em",
};

const fieldWrap: React.CSSProperties = { marginBottom: 14 };

export function PropertiesPanel() {
  const selectedNodeId = useGraphStore((s) => s.selectedNodeId);
  const nodes = useGraphStore((s) => s.nodes);
  const updateNodeData = useGraphStore((s) => s.updateNodeData);
  const removeNode = useGraphStore((s) => s.removeNode);

  const node = nodes.find((n) => n.id === selectedNodeId);

  if (!node) {
    return (
      <div
        style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: 8,
          padding: 24,
        }}
      >
        <div
          style={{
            width: 40,
            height: 40,
            borderRadius: 10,
            background: "rgba(255,255,255,0.04)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Hash size={18} color="#484f58" />
        </div>
        <div style={{ color: "#7d8590", fontSize: 12, textAlign: "center" }}>
          Select a node to<br />edit its properties
        </div>
      </div>
    );
  }

  const d = node.data;
  const meta = TYPE_META[d.componentType as number];

  const textField = (label: string, key: string, placeholder?: string) => (
    <div style={fieldWrap} key={key}>
      <label style={labelStyle}>{label}</label>
      <input
        type="text"
        value={(d[key] as string) ?? ""}
        placeholder={placeholder}
        onChange={(e) => updateNodeData(node.id, { [key]: e.target.value })}
        data-testid={`prop-${key}`}
        style={inputStyle}
        onFocus={(e) => { (e.currentTarget as HTMLElement).style.borderColor = "rgba(88,101,242,0.6)"; }}
        onBlur={(e) => { (e.currentTarget as HTMLElement).style.borderColor = "rgba(255,255,255,0.08)"; }}
      />
    </div>
  );

  const textareaField = (label: string, key: string, placeholder?: string) => (
    <div style={fieldWrap} key={key}>
      <label style={labelStyle}>{label}</label>
      <textarea
        value={(d[key] as string) ?? ""}
        placeholder={placeholder}
        onChange={(e) => updateNodeData(node.id, { [key]: e.target.value })}
        rows={4}
        data-testid={`prop-${key}`}
        style={{ ...inputStyle, resize: "vertical", lineHeight: 1.5 }}
        onFocus={(e) => { (e.currentTarget as HTMLElement).style.borderColor = "rgba(88,101,242,0.6)"; }}
        onBlur={(e) => { (e.currentTarget as HTMLElement).style.borderColor = "rgba(255,255,255,0.08)"; }}
      />
    </div>
  );

  const colorField = (label: string, key: string) => {
    const val = d[key] as number | null | undefined;
    const hex = val != null ? "#" + val.toString(16).padStart(6, "0") : "#5865f2";
    return (
      <div style={fieldWrap} key={key}>
        <label style={labelStyle}>{label}</label>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <input
            type="color"
            value={hex}
            onChange={(e) =>
              updateNodeData(node.id, { [key]: parseInt(e.target.value.replace("#", ""), 16) })
            }
            style={{
              width: 36,
              height: 36,
              border: "1px solid rgba(255,255,255,0.08)",
              borderRadius: 6,
              cursor: "pointer",
              background: "none",
              padding: 2,
            }}
          />
          <div
            style={{
              flex: 1,
              background: "#1C1F2E",
              border: "1px solid #2A2D3E",
              borderRadius: 6,
              padding: "6px 9px",
            }}
          >
            <span style={{ color: "#e6edf3", fontSize: 12, fontFamily: "monospace" }}>{hex}</span>
          </div>
          {val != null && (
            <button
              onClick={() => updateNodeData(node.id, { [key]: null })}
              title="Clear color"
              style={{
                background: "rgba(248,81,73,0.1)",
                border: "1px solid rgba(248,81,73,0.2)",
                borderRadius: 5,
                color: "#f85149",
                fontSize: 11,
                padding: "5px 8px",
                cursor: "pointer",
              }}
            >
              ×
            </button>
          )}
        </div>
      </div>
    );
  };

  const checkboxField = (label: string, key: string) => (
    <div style={{ ...fieldWrap, display: "flex", alignItems: "center", gap: 10 }} key={key}>
      <div
        onClick={() => updateNodeData(node.id, { [key]: !d[key] })}
        style={{
          width: 36,
          height: 20,
          borderRadius: 10,
          background: d[key] ? "#5865F2" : "rgba(255,255,255,0.08)",
          border: "1px solid rgba(255,255,255,0.08)",
          position: "relative",
          cursor: "pointer",
          transition: "background 0.15s",
          flexShrink: 0,
        }}
      >
        <div
          style={{
            position: "absolute",
            top: 2,
            left: d[key] ? 17 : 2,
            width: 14,
            height: 14,
            borderRadius: "50%",
            background: "#fff",
            transition: "left 0.15s",
            boxShadow: "0 1px 3px rgba(0,0,0,0.3)",
          }}
        />
      </div>
      <label
        style={{ color: "#e6edf3", fontSize: 12, fontWeight: 500, cursor: "pointer" }}
        onClick={() => updateNodeData(node.id, { [key]: !d[key] })}
        data-testid={`prop-${key}`}
      >
        {label}
      </label>
    </div>
  );

  const selectField = (label: string, key: string, options: string[]) => (
    <div style={fieldWrap} key={key}>
      <label style={labelStyle}>{label}</label>
      <select
        value={(d[key] as string) ?? options[0]}
        onChange={(e) => updateNodeData(node.id, { [key]: e.target.value })}
        data-testid={`prop-${key}`}
        style={{
          ...inputStyle,
          appearance: "none",
          backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%237d8590' stroke-width='2'%3E%3Cpath d='M6 9l6 6 6-6'/%3E%3C/svg%3E")`,
          backgroundRepeat: "no-repeat",
          backgroundPosition: "right 8px center",
          paddingRight: 28,
          cursor: "pointer",
        }}
      >
        {options.map((o) => (
          <option key={o} value={o} style={{ background: "#161820" }}>
            {o}
          </option>
        ))}
      </select>
    </div>
  );

  const renderFields = () => {
    switch (d.componentType) {
      case 17:
        return (
          <>
            {colorField("Accent Color", "accent_color")}
            {checkboxField("Spoiler (blur content)", "spoiler")}
          </>
        );
      case 10:
        return textareaField("Content (Markdown)", "content", "Enter markdown text…");
      case 11:
        return (
          <>
            {textField("Image URL", "url", "https://example.com/image.png")}
            {textField("Alt Description", "description", "Describe the image…")}
          </>
        );
      case 12: {
        const items = (d.items as { url: string }[]) ?? [];
        return (
          <div style={fieldWrap}>
            <label style={labelStyle}>Image URLs (one per line)</label>
            <textarea
              value={items.map((i) => i.url).join("\n")}
              placeholder="https://example.com/image1.png&#10;https://example.com/image2.png"
              onChange={(e) => {
                const urls = e.target.value
                  .split("\n")
                  .map((u) => ({ url: u.trim() }))
                  .filter((i) => i.url);
                updateNodeData(node.id, { items: urls });
              }}
              rows={5}
              data-testid="prop-items"
              style={{ ...inputStyle, resize: "vertical", lineHeight: 1.6 }}
            />
            <div style={{ color: "#484f58", fontSize: 10, marginTop: 4 }}>
              {items.length} image{items.length !== 1 ? "s" : ""} added
            </div>
          </div>
        );
      }
      case 14:
        return (
          <>
            {selectField("Spacing", "spacing", ["sm", "md", "lg"])}
            {checkboxField("Show Divider Line", "divider")}
          </>
        );
      case 2:
        return (
          <>
            {textField("Label", "label", "Button label…")}
            {selectField("Style", "style", ["Primary", "Secondary", "Success", "Danger", "Link"])}
            {textField("Custom ID", "custom_id", "my_button_id")}
            {textField("URL (Link style only)", "url", "https://example.com")}
          </>
        );
      case 0:
        return (
          <>
            {textField("Title", "title", "Embed title…")}
            {textareaField("Description", "description", "Embed description…")}
            {colorField("Accent Color", "color")}
            {textField("Author Name", "author", "Author…")}
            {textField("Footer Text", "footer", "Footer…")}
            {textField("Image URL", "imageUrl", "https://example.com/image.png")}
          </>
        );
      default:
        return (
          <div style={{ color: "#484f58", fontSize: 12 }}>No editable properties</div>
        );
    }
  };

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        height: "100%",
        overflow: "hidden",
      }}
    >
      <div
        style={{
          padding: "12px 14px",
          borderBottom: "1px solid rgba(255,255,255,0.06)",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 8,
          flexShrink: 0,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 8, minWidth: 0 }}>
          {meta && (
            <div
              style={{
                width: 28,
                height: 28,
                borderRadius: 6,
                background: meta.color + "20",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: meta.color,
                flexShrink: 0,
              }}
            >
              {meta.icon}
            </div>
          )}
          <div style={{ minWidth: 0 }}>
            <div style={{ color: "#e6edf3", fontSize: 13, fontWeight: 600 }}>
              {meta?.label ?? "Node"}
            </div>
            <div
              style={{
                color: "#484f58",
                fontSize: 10,
                fontFamily: "monospace",
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
              }}
            >
              {node.id}
            </div>
          </div>
        </div>

        <button
          data-testid="delete-node"
          onClick={() => removeNode(node.id)}
          title="Delete node"
          style={{
            background: "rgba(248,81,73,0.08)",
            border: "1px solid rgba(248,81,73,0.2)",
            borderRadius: 6,
            color: "#f85149",
            display: "flex",
            alignItems: "center",
            gap: 4,
            fontSize: 11,
            fontWeight: 600,
            padding: "5px 9px",
            cursor: "pointer",
            flexShrink: 0,
            transition: "background 0.12s",
          }}
          onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = "rgba(248,81,73,0.15)"; }}
          onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = "rgba(248,81,73,0.08)"; }}
        >
          <Trash2 size={12} />
          Delete
        </button>
      </div>

      <div style={{ overflowY: "auto", flex: 1, padding: "14px" }}>
        {renderFields()}
      </div>
    </div>
  );
}
