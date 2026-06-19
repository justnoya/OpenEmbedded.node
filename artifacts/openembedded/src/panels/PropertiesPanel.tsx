import { useGraphStore } from "@/lib/graphStore";

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
          width: 280,
          flexShrink: 0,
          background: "#1E2124",
          borderLeft: "1px solid rgba(255,255,255,0.063)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: "#949B9D",
          fontSize: 13,
        }}
      >
        Select a node to edit properties
      </div>
    );
  }

  const d = node.data;

  const field = (
    label: string,
    key: string,
    type: "text" | "textarea" | "number" | "checkbox" | "select",
    options?: string[]
  ) => (
    <div style={{ marginBottom: 12 }}>
      <label
        style={{ display: "block", color: "#B5BAC1", fontSize: 11, fontWeight: 500, marginBottom: 4 }}
      >
        {label}
      </label>
      {type === "textarea" ? (
        <textarea
          value={(d[key] as string) ?? ""}
          onChange={(e) => updateNodeData(node.id, { [key]: e.target.value })}
          rows={3}
          style={{
            width: "100%",
            background: "#424549",
            border: "1px solid rgba(255,255,255,0.1)",
            borderRadius: 4,
            color: "#F2F3F5",
            fontSize: 12,
            padding: "6px 8px",
            resize: "vertical",
            fontFamily: "inherit",
            boxSizing: "border-box",
          }}
          data-testid={`prop-${key}`}
        />
      ) : type === "checkbox" ? (
        <input
          type="checkbox"
          checked={(d[key] as boolean) ?? false}
          onChange={(e) => updateNodeData(node.id, { [key]: e.target.checked })}
          data-testid={`prop-${key}`}
          style={{ accentColor: "#5865F2" }}
        />
      ) : type === "select" && options ? (
        <select
          value={(d[key] as string) ?? options[0]}
          onChange={(e) => updateNodeData(node.id, { [key]: e.target.value })}
          data-testid={`prop-${key}`}
          style={{
            width: "100%",
            background: "#424549",
            border: "1px solid rgba(255,255,255,0.1)",
            borderRadius: 4,
            color: "#F2F3F5",
            fontSize: 12,
            padding: "5px 8px",
          }}
        >
          {options.map((o) => (
            <option key={o} value={o}>
              {o}
            </option>
          ))}
        </select>
      ) : (
        <input
          type={type}
          value={(d[key] as string | number) ?? ""}
          onChange={(e) =>
            updateNodeData(node.id, {
              [key]: type === "number" ? Number(e.target.value) : e.target.value,
            })
          }
          data-testid={`prop-${key}`}
          style={{
            width: "100%",
            background: "#424549",
            border: "1px solid rgba(255,255,255,0.1)",
            borderRadius: 4,
            color: "#F2F3F5",
            fontSize: 12,
            padding: "5px 8px",
            boxSizing: "border-box",
          }}
        />
      )}
    </div>
  );

  const renderFields = () => {
    switch (d.componentType) {
      case 17:
        return (
          <>
            {field("Accent Color (integer)", "accent_color", "number")}
            {field("Spoiler", "spoiler", "checkbox")}
          </>
        );
      case 10:
        return field("Content (markdown)", "content", "textarea");
      case 11:
        return (
          <>
            {field("Image URL", "url", "text")}
            {field("Description", "description", "text")}
          </>
        );
      case 12: {
        const items = (d.items as { url: string }[]) ?? [];
        return (
          <div>
            <label style={{ display: "block", color: "#B5BAC1", fontSize: 11, fontWeight: 500, marginBottom: 4 }}>
              Image URLs (one per line)
            </label>
            <textarea
              value={items.map((i) => i.url).join("\n")}
              onChange={(e) => {
                const urls = e.target.value.split("\n").map((u) => ({ url: u.trim() })).filter((i) => i.url);
                updateNodeData(node.id, { items: urls });
              }}
              rows={4}
              data-testid="prop-items"
              style={{
                width: "100%",
                background: "#424549",
                border: "1px solid rgba(255,255,255,0.1)",
                borderRadius: 4,
                color: "#F2F3F5",
                fontSize: 12,
                padding: "6px 8px",
                resize: "vertical",
                fontFamily: "inherit",
                boxSizing: "border-box",
              }}
            />
          </div>
        );
      }
      case 14:
        return (
          <>
            {field("Spacing", "spacing", "select", ["sm", "md", "lg"])}
            {field("Show Divider", "divider", "checkbox")}
          </>
        );
      case 2:
        return (
          <>
            {field("Label", "label", "text")}
            {field("Style", "style", "select", ["Primary", "Secondary", "Success", "Danger", "Link"])}
            {field("Custom ID", "custom_id", "text")}
            {field("URL (for Link style)", "url", "text")}
          </>
        );
      case 0:
        return (
          <>
            {field("Title", "title", "text")}
            {field("Description", "description", "textarea")}
            {field("Color (integer)", "color", "number")}
            {field("Author", "author", "text")}
            {field("Footer", "footer", "text")}
          </>
        );
      default:
        return <div style={{ color: "#949B9D", fontSize: 12 }}>No editable properties</div>;
    }
  };

  const typeLabels: Record<number, string> = {
    17: "Container",
    9: "Section",
    10: "Text Display",
    11: "Thumbnail",
    12: "Media Gallery",
    14: "Separator",
    1: "Action Row",
    2: "Button",
    0: "Embed",
  };

  return (
    <div
      style={{
        width: 280,
        flexShrink: 0,
        background: "#1E2124",
        borderLeft: "1px solid rgba(255,255,255,0.063)",
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
      }}
    >
      <div
        style={{
          padding: "12px 16px",
          borderBottom: "1px solid rgba(255,255,255,0.063)",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <div>
          <div style={{ color: "#F2F3F5", fontSize: 13, fontWeight: 600 }}>
            {typeLabels[d.componentType as number] ?? "Node"}
          </div>
          <div style={{ color: "#949B9D", fontSize: 11 }}>id: {node.id}</div>
        </div>
        <button
          data-testid="delete-node"
          onClick={() => removeNode(node.id)}
          style={{
            background: "transparent",
            border: "1px solid rgba(237,66,69,0.4)",
            borderRadius: 4,
            color: "#ED4245",
            fontSize: 11,
            padding: "3px 8px",
            cursor: "pointer",
          }}
        >
          Delete
        </button>
      </div>
      <div style={{ overflowY: "auto", flex: 1, padding: 16 }}>{renderFields()}</div>
    </div>
  );
}
