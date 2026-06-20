import { useGraphStore } from "@/lib/graphStore";
import {
  Box, Layers, Type, Image, LayoutGrid, SeparatorHorizontal,
  AlignJustify, MousePointerClick, MessageSquare, Trash2, Hash,
  Users, Shield, AtSign, TextCursorInput, Plus, X,
} from "lucide-react";
import { ReactNode } from "react";

const TYPE_META: Record<number, { label: string; icon: ReactNode; color: string }> = {
  17: { label: "Container",          icon: <Box size={14} />,              color: "#8b5cf6" },
  9:  { label: "Section",            icon: <Layers size={14} />,           color: "#10b981" },
  10: { label: "Text Display",       icon: <Type size={14} />,             color: "#3b82f6" },
  11: { label: "Thumbnail",          icon: <Image size={14} />,            color: "#f59e0b" },
  12: { label: "Media Gallery",      icon: <LayoutGrid size={14} />,       color: "#ec4899" },
  14: { label: "Separator",          icon: <SeparatorHorizontal size={14} />, color: "#6b7280" },
  1:  { label: "Action Row",         icon: <AlignJustify size={14} />,     color: "#14b8a6" },
  2:  { label: "Button",             icon: <MousePointerClick size={14} />, color: "#5865F2" },
  3:  { label: "String Select",      icon: <Hash size={14} />,             color: "#f97316" },
  4:  { label: "Text Input",         icon: <TextCursorInput size={14} />,  color: "#64748b" },
  5:  { label: "User Select",        icon: <Users size={14} />,            color: "#06b6d4" },
  6:  { label: "Role Select",        icon: <Shield size={14} />,           color: "#a855f7" },
  7:  { label: "Mentionable Select", icon: <AtSign size={14} />,           color: "#ec4899" },
  8:  { label: "Channel Select",     icon: <Hash size={14} />,             color: "#22c55e" },
  0:  { label: "Embed (V1)",         icon: <MessageSquare size={14} />,    color: "#f59e0b" },
};

const inputStyle: React.CSSProperties = {
  width: "100%",
  background: "#1A1C24",
  border: "1px solid #2A2F3A",
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

  const focusBorder = (e: React.FocusEvent) => {
    (e.currentTarget as HTMLElement).style.borderColor = "rgba(88,101,242,0.6)";
  };
  const blurBorder = (e: React.FocusEvent) => {
    (e.currentTarget as HTMLElement).style.borderColor = "#2A2F3A";
  };

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
        onFocus={focusBorder}
        onBlur={blurBorder}
      />
    </div>
  );

  const numberField = (label: string, key: string, min?: number, max?: number) => (
    <div style={fieldWrap} key={key}>
      <label style={labelStyle}>{label}</label>
      <input
        type="number"
        value={(d[key] as number) ?? ""}
        min={min}
        max={max}
        onChange={(e) => updateNodeData(node.id, { [key]: e.target.value === "" ? null : Number(e.target.value) })}
        data-testid={`prop-${key}`}
        style={inputStyle}
        onFocus={focusBorder}
        onBlur={blurBorder}
      />
    </div>
  );

  const textareaField = (label: string, key: string, placeholder?: string, rows = 4) => (
    <div style={fieldWrap} key={key}>
      <label style={labelStyle}>{label}</label>
      <textarea
        value={(d[key] as string) ?? ""}
        placeholder={placeholder}
        onChange={(e) => updateNodeData(node.id, { [key]: e.target.value })}
        rows={rows}
        data-testid={`prop-${key}`}
        style={{ ...inputStyle, resize: "vertical", lineHeight: 1.5 }}
        onFocus={focusBorder}
        onBlur={blurBorder}
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
              border: "1px solid #2A2F3A",
              borderRadius: 6,
              cursor: "pointer",
              background: "none",
              padding: 2,
            }}
          />
          <div
            style={{
              flex: 1,
              background: "#1A1C24",
              border: "1px solid #2A2F3A",
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
          <option key={o} value={o} style={{ background: "#20232D" }}>
            {o}
          </option>
        ))}
      </select>
    </div>
  );

  const selectOptionsField = () => {
    const opts = (d.options as Array<{ label: string; value: string; description?: string; default?: boolean }>) ?? [];

    const updateOption = (i: number, patch: Partial<{ label: string; value: string; description: string; default: boolean }>) => {
      const next = opts.map((o, idx) => idx === i ? { ...o, ...patch } : o);
      updateNodeData(node.id, { options: next });
    };

    const addOption = () => {
      const next = [...opts, { label: `Option ${opts.length + 1}`, value: `option_${opts.length + 1}` }];
      updateNodeData(node.id, { options: next });
    };

    const removeOption = (i: number) => {
      updateNodeData(node.id, { options: opts.filter((_, idx) => idx !== i) });
    };

    return (
      <div style={fieldWrap}>
        <label style={labelStyle}>Options ({opts.length}/25)</label>
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          {opts.map((opt, i) => (
            <div
              key={i}
              style={{
                background: "#1A1C24",
                border: "1px solid #2A2F3A",
                borderRadius: 6,
                padding: "8px 10px",
                display: "flex",
                flexDirection: "column",
                gap: 5,
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <input
                    type="text"
                    value={opt.label}
                    placeholder="Label"
                    onChange={(e) => updateOption(i, { label: e.target.value })}
                    style={{ ...inputStyle, padding: "3px 6px", fontSize: 11 }}
                    onFocus={focusBorder}
                    onBlur={blurBorder}
                  />
                </div>
                <button
                  onClick={() => removeOption(i)}
                  style={{
                    background: "rgba(248,81,73,0.1)",
                    border: "1px solid rgba(248,81,73,0.2)",
                    borderRadius: 4,
                    color: "#f85149",
                    cursor: "pointer",
                    padding: "3px 5px",
                    display: "flex",
                    alignItems: "center",
                    flexShrink: 0,
                  }}
                >
                  <X size={10} />
                </button>
              </div>
              <input
                type="text"
                value={opt.value}
                placeholder="Value (unique key)"
                onChange={(e) => updateOption(i, { value: e.target.value })}
                style={{ ...inputStyle, padding: "3px 6px", fontSize: 11, color: "#7d8590" }}
                onFocus={focusBorder}
                onBlur={blurBorder}
              />
              <input
                type="text"
                value={opt.description ?? ""}
                placeholder="Description (optional)"
                onChange={(e) => updateOption(i, { description: e.target.value })}
                style={{ ...inputStyle, padding: "3px 6px", fontSize: 10, color: "#484f58" }}
                onFocus={focusBorder}
                onBlur={blurBorder}
              />
              <label style={{ display: "flex", alignItems: "center", gap: 6, cursor: "pointer" }}>
                <input
                  type="checkbox"
                  checked={!!opt.default}
                  onChange={(e) => updateOption(i, { default: e.target.checked })}
                  style={{ accentColor: "#5865F2" }}
                />
                <span style={{ color: "#7d8590", fontSize: 10 }}>Default selected</span>
              </label>
            </div>
          ))}
          {opts.length < 25 && (
            <button
              onClick={addOption}
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 5,
                padding: "6px",
                background: "rgba(88,101,242,0.08)",
                border: "1px dashed rgba(88,101,242,0.3)",
                borderRadius: 6,
                color: "#818cf8",
                fontSize: 11,
                cursor: "pointer",
              }}
            >
              <Plus size={11} /> Add option
            </button>
          )}
        </div>
      </div>
    );
  };

  const embedFieldsEditor = () => {
    const fields = (d.fields as Array<{ name: string; value: string; inline?: boolean }>) ?? [];

    const updateField = (i: number, patch: Partial<{ name: string; value: string; inline: boolean }>) => {
      const next = fields.map((f, idx) => idx === i ? { ...f, ...patch } : f);
      updateNodeData(node.id, { fields: next });
    };

    const addField = () => {
      updateNodeData(node.id, { fields: [...fields, { name: "Field Name", value: "Field value", inline: false }] });
    };

    const removeField = (i: number) => {
      updateNodeData(node.id, { fields: fields.filter((_, idx) => idx !== i) });
    };

    return (
      <div style={fieldWrap}>
        <label style={labelStyle}>Fields ({fields.length}/25)</label>
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          {fields.map((f, i) => (
            <div
              key={i}
              style={{
                background: "#1A1C24",
                border: "1px solid #2A2F3A",
                borderRadius: 6,
                padding: "8px 10px",
                display: "flex",
                flexDirection: "column",
                gap: 5,
              }}
            >
              <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                <input
                  type="text"
                  value={f.name}
                  placeholder="Name"
                  onChange={(e) => updateField(i, { name: e.target.value })}
                  style={{ ...inputStyle, padding: "3px 6px", fontSize: 11, flex: 1 }}
                  onFocus={focusBorder}
                  onBlur={blurBorder}
                />
                <button
                  onClick={() => removeField(i)}
                  style={{
                    background: "rgba(248,81,73,0.1)",
                    border: "1px solid rgba(248,81,73,0.2)",
                    borderRadius: 4,
                    color: "#f85149",
                    cursor: "pointer",
                    padding: "3px 5px",
                    display: "flex",
                    alignItems: "center",
                  }}
                >
                  <X size={10} />
                </button>
              </div>
              <textarea
                value={f.value}
                placeholder="Value"
                onChange={(e) => updateField(i, { value: e.target.value })}
                rows={2}
                style={{ ...inputStyle, padding: "3px 6px", fontSize: 11, resize: "vertical" }}
                onFocus={focusBorder}
                onBlur={blurBorder}
              />
              <label style={{ display: "flex", alignItems: "center", gap: 6, cursor: "pointer" }}>
                <input
                  type="checkbox"
                  checked={!!f.inline}
                  onChange={(e) => updateField(i, { inline: e.target.checked })}
                  style={{ accentColor: "#5865F2" }}
                />
                <span style={{ color: "#7d8590", fontSize: 10 }}>Inline</span>
              </label>
            </div>
          ))}
          {fields.length < 25 && (
            <button
              onClick={addField}
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 5,
                padding: "6px",
                background: "rgba(88,101,242,0.08)",
                border: "1px dashed rgba(88,101,242,0.3)",
                borderRadius: 6,
                color: "#818cf8",
                fontSize: 11,
                cursor: "pointer",
              }}
            >
              <Plus size={11} /> Add field
            </button>
          )}
        </div>
      </div>
    );
  };

  const selectValuesFields = () => (
    <>
      {numberField("Min Values", "min_values", 0, 25)}
      {numberField("Max Values", "max_values", 1, 25)}
    </>
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
              onFocus={focusBorder}
              onBlur={blurBorder}
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
            {textField("Emoji", "emoji", "😀 or :emoji_name:")}
            {selectField("Style", "style", ["Primary", "Secondary", "Success", "Danger", "Link", "Premium"])}
            {textField("Custom ID", "custom_id", "my_button_id")}
            {textField("URL (Link style only)", "url", "https://example.com")}
            {textField("SKU ID (Premium style only)", "sku_id", "1234567890")}
            {checkboxField("Disabled", "disabled")}
          </>
        );
      case 3:
        return (
          <>
            {textField("Custom ID", "custom_id", "my_select_id")}
            {textField("Placeholder", "placeholder", "Make a selection…")}
            {selectValuesFields()}
            {selectOptionsField()}
            {checkboxField("Disabled", "disabled")}
          </>
        );
      case 4:
        return (
          <>
            {textField("Label", "label", "Input label…")}
            {textField("Custom ID", "custom_id", "my_input_id")}
            {selectField("Style", "style", ["Short", "Paragraph"])}
            {textField("Placeholder", "placeholder", "Enter text…")}
            {textField("Pre-filled Value", "value", "")}
            {numberField("Min Length", "min_length", 0, 4000)}
            {numberField("Max Length", "max_length", 1, 4000)}
            {checkboxField("Required", "required")}
          </>
        );
      case 5:
      case 6:
      case 7:
      case 8:
        return (
          <>
            {textField("Custom ID", "custom_id", "my_select_id")}
            {textField("Placeholder", "placeholder", "Select…")}
            {selectValuesFields()}
            {checkboxField("Disabled", "disabled")}
          </>
        );
      case 0:
        return (
          <>
            {textField("Title", "title", "Embed title…")}
            {textareaField("Description", "description", "Embed description…")}
            {colorField("Accent Color", "color")}
            {textField("URL (title link)", "url", "https://example.com")}
            {textField("Author Name", "author", "Author…")}
            {textField("Footer Text", "footer", "Footer…")}
            {textField("Image URL", "imageUrl", "https://example.com/image.png")}
            {textField("Thumbnail URL", "thumbnailUrl", "https://example.com/thumb.png")}
            {checkboxField("Show Timestamp", "timestamp")}
            {embedFieldsEditor()}
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
