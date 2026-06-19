import { usePreviewStore } from "@/lib/previewStore";

interface DiscordComponent {
  type: number;
  content?: string;
  components?: DiscordComponent[];
  accent_color?: number;
  spoiler?: boolean;
  media?: { url: string };
  description?: string;
  items?: { url: string; description?: string }[];
  spacing?: number;
  divider?: boolean;
  label?: string;
  style?: number;
  url?: string;
  custom_id?: string;
}

interface DiscordEmbed {
  title?: string;
  description?: string;
  color?: number;
  author?: { name: string };
  footer?: { text: string };
  image?: { url: string };
}

const BUTTON_STYLE_COLORS: Record<number, { bg: string; color: string }> = {
  1: { bg: "#5865F2", color: "#fff" },
  2: { bg: "#4E5058", color: "#fff" },
  3: { bg: "#57F287", color: "#000" },
  4: { bg: "#ED4245", color: "#fff" },
  5: { bg: "transparent", color: "#00b0f4" },
};

function RenderComponent({ comp }: { comp: DiscordComponent }) {
  switch (comp.type) {
    case 17:
      return (
        <div
          style={{
            border: comp.accent_color
              ? `2px solid #${comp.accent_color.toString(16).padStart(6, "0")}`
              : "1px solid rgba(255,255,255,0.1)",
            borderRadius: 8,
            padding: 12,
            background: comp.spoiler ? "#000" : "rgba(0,0,0,0.15)",
            marginBottom: 8,
          }}
        >
          {(comp.components ?? []).map((c, i) => (
            <RenderComponent key={i} comp={c} />
          ))}
        </div>
      );
    case 9:
      return (
        <div style={{ display: "flex", gap: 8, alignItems: "flex-start", marginBottom: 6 }}>
          <div style={{ flex: 1 }}>
            {(comp.components ?? []).map((c, i) => (
              <RenderComponent key={i} comp={c} />
            ))}
          </div>
        </div>
      );
    case 10:
      return (
        <div
          style={{
            color: "#F2F3F5",
            fontSize: 14,
            lineHeight: 1.6,
            marginBottom: 6,
            whiteSpace: "pre-wrap",
          }}
        >
          {comp.content ?? ""}
        </div>
      );
    case 11:
      return comp.media?.url ? (
        <img
          src={comp.media.url}
          alt={comp.description ?? ""}
          style={{ width: 80, height: 80, objectFit: "cover", borderRadius: 4, marginBottom: 6 }}
        />
      ) : (
        <div
          style={{
            width: 80,
            height: 80,
            background: "#424549",
            borderRadius: 4,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "#949B9D",
            fontSize: 10,
            marginBottom: 6,
          }}
        >
          no image
        </div>
      );
    case 12:
      return (
        <div style={{ display: "flex", flexWrap: "wrap", gap: 4, marginBottom: 6 }}>
          {(comp.items ?? []).map((item, i) =>
            item.url ? (
              <img
                key={i}
                src={item.url}
                alt={item.description ?? ""}
                style={{ width: 60, height: 60, objectFit: "cover", borderRadius: 4 }}
              />
            ) : null
          )}
        </div>
      );
    case 14:
      return (
        <div
          style={{
            margin: comp.spacing === 2 ? "12px 0" : comp.spacing === 0 ? "4px 0" : "8px 0",
          }}
        >
          {comp.divider && (
            <div style={{ borderTop: "1px solid rgba(255,255,255,0.15)", margin: "0" }} />
          )}
        </div>
      );
    case 1:
      return (
        <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 8 }}>
          {(comp.components ?? []).map((c, i) => (
            <RenderComponent key={i} comp={c} />
          ))}
        </div>
      );
    case 2: {
      const s = BUTTON_STYLE_COLORS[comp.style ?? 1];
      return (
        <div
          style={{
            display: "inline-flex",
            alignItems: "center",
            background: s.bg,
            color: s.color,
            fontSize: 13,
            fontWeight: 500,
            padding: "6px 14px",
            borderRadius: 4,
            border: comp.style === 5 ? "1px solid rgba(0,176,244,0.4)" : "none",
            cursor: "default",
          }}
        >
          {comp.label ?? "Button"}
        </div>
      );
    }
    default:
      return null;
  }
}

function RenderEmbed({ embed }: { embed: DiscordEmbed }) {
  const accentColor = embed.color != null ? `#${embed.color.toString(16).padStart(6, "0")}` : "#5865F2";
  return (
    <div
      style={{
        display: "flex",
        background: "#2B2D31",
        borderRadius: 4,
        overflow: "hidden",
        marginBottom: 8,
        borderLeft: `4px solid ${accentColor}`,
      }}
    >
      <div style={{ padding: "12px 16px", flex: 1 }}>
        {embed.author && (
          <div style={{ color: "#F2F3F5", fontSize: 12, fontWeight: 500, marginBottom: 4 }}>
            {embed.author.name}
          </div>
        )}
        {embed.title && (
          <div style={{ color: "#00b0f4", fontSize: 15, fontWeight: 600, marginBottom: 4 }}>
            {embed.title}
          </div>
        )}
        {embed.description && (
          <div style={{ color: "#D5D9DF", fontSize: 13, lineHeight: 1.5, marginBottom: 4 }}>
            {embed.description}
          </div>
        )}
        {embed.image?.url && (
          <img
            src={embed.image.url}
            alt=""
            style={{ maxWidth: "100%", borderRadius: 4, marginTop: 8 }}
          />
        )}
        {embed.footer && (
          <div style={{ color: "#949B9D", fontSize: 11, marginTop: 8 }}>{embed.footer.text}</div>
        )}
      </div>
    </div>
  );
}

export function DiscordPreview() {
  const payload = usePreviewStore((s) => s.payload);
  const isValid = usePreviewStore((s) => s.isValid);
  const errors = usePreviewStore((s) => s.errors);

  const components = (payload?.components ?? []) as DiscordComponent[];
  const embeds = (payload?.embeds ?? []) as DiscordEmbed[];
  const hasContent = components.length > 0 || embeds.length > 0;

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%", overflow: "hidden" }}>
      <div
        style={{
          padding: "10px 14px",
          borderBottom: "1px solid rgba(255,255,255,0.063)",
          color: "#B5BAC1",
          fontSize: 11,
          fontWeight: 600,
          letterSpacing: "0.08em",
          textTransform: "uppercase",
          display: "flex",
          alignItems: "center",
          gap: 8,
        }}
      >
        Discord Preview
        {!isValid && errors.length > 0 && (
          <span style={{ color: "#ED4245", fontSize: 10 }}>
            {errors.length} error{errors.length !== 1 ? "s" : ""}
          </span>
        )}
      </div>
      <div style={{ flex: 1, overflowY: "auto", padding: 12 }}>
        {/* Discord mock message background */}
        <div
          style={{
            background: "#313338",
            borderRadius: 8,
            padding: 12,
            minHeight: 80,
          }}
        >
          {/* Bot avatar + header */}
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
            <div
              style={{
                width: 36,
                height: 36,
                borderRadius: "50%",
                background: "#5865F2",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "#fff",
                fontSize: 14,
                fontWeight: 700,
                flexShrink: 0,
              }}
            >
              OE
            </div>
            <div>
              <div style={{ color: "#F2F3F5", fontSize: 14, fontWeight: 600 }}>OpenEmbedded Bot</div>
              <div style={{ color: "#949B9D", fontSize: 11 }}>Today</div>
            </div>
          </div>

          {!hasContent ? (
            <div
              style={{
                color: "#949B9D",
                fontSize: 13,
                padding: "12px 0",
                fontStyle: "italic",
              }}
            >
              Add nodes and connect them to see a preview
            </div>
          ) : (
            <div>
              {embeds.map((embed, i) => (
                <RenderEmbed key={i} embed={embed} />
              ))}
              {components.map((comp, i) => (
                <RenderComponent key={i} comp={comp} />
              ))}
            </div>
          )}
        </div>

        {!isValid && errors.length > 0 && (
          <div style={{ marginTop: 8 }}>
            {errors.map((e, i) => (
              <div
                key={i}
                style={{
                  background: "rgba(237,66,69,0.1)",
                  border: "1px solid rgba(237,66,69,0.3)",
                  borderRadius: 4,
                  padding: "4px 8px",
                  color: "#ED4245",
                  fontSize: 11,
                  marginBottom: 4,
                }}
              >
                {e.message}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
