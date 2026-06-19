import { usePreviewStore } from "@/lib/previewStore";
import { AlertTriangle } from "lucide-react";

interface DiscordComponent {
  type: number;
  content?: string;
  components?: DiscordComponent[];
  accessory?: DiscordComponent;
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

const BUTTON_STYLE_COLORS: Record<number, { bg: string; color: string; border?: string }> = {
  1: { bg: "#5865F2", color: "#fff" },
  2: { bg: "#4e5058", color: "#fff" },
  3: { bg: "#57F287", color: "#000" },
  4: { bg: "#ED4245", color: "#fff" },
  5: { bg: "transparent", color: "#00b0f4", border: "1px solid rgba(0,176,244,0.35)" },
};

function RenderComponent({ comp }: { comp: DiscordComponent }) {
  switch (comp.type) {
    case 17: {
      const accent = comp.accent_color != null
        ? `#${comp.accent_color.toString(16).padStart(6, "0")}`
        : null;
      return (
        <div
          style={{
            border: accent ? `2px solid ${accent}` : "1px solid rgba(255,255,255,0.09)",
            borderRadius: 8,
            padding: 10,
            background: comp.spoiler
              ? "rgba(0,0,0,0.8)"
              : "rgba(255,255,255,0.02)",
            marginBottom: 8,
          }}
        >
          {accent && (
            <div
              style={{
                width: 36,
                height: 3,
                borderRadius: 2,
                background: accent,
                marginBottom: 8,
              }}
            />
          )}
          {(comp.components ?? []).map((c, i) => (
            <RenderComponent key={i} comp={c} />
          ))}
        </div>
      );
    }
    case 9: {
      const textComps = (comp.components ?? []).filter((c) => c.type !== 11);
      const accessory = comp.accessory ?? (comp.components ?? []).find((c) => c.type === 11);
      return (
        <div
          style={{
            display: "flex",
            gap: 10,
            alignItems: "flex-start",
            marginBottom: 6,
          }}
        >
          <div style={{ flex: 1, minWidth: 0 }}>
            {textComps.map((c, i) => (
              <RenderComponent key={i} comp={c} />
            ))}
          </div>
          {accessory && (
            <div style={{ flexShrink: 0 }}>
              {accessory.media?.url ? (
                <img
                  src={accessory.media.url}
                  alt={accessory.description ?? ""}
                  style={{
                    width: 72,
                    height: 72,
                    objectFit: "cover",
                    borderRadius: 6,
                    border: "1px solid rgba(255,255,255,0.08)",
                  }}
                />
              ) : (
                <div
                  style={{
                    width: 72,
                    height: 72,
                    background: "rgba(255,255,255,0.04)",
                    borderRadius: 6,
                    border: "1px dashed rgba(255,255,255,0.12)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: "#484f58",
                    fontSize: 10,
                  }}
                >
                  no img
                </div>
              )}
            </div>
          )}
        </div>
      );
    }
    case 10:
      return (
        <div
          style={{
            color: "#dbdee1",
            fontSize: 14,
            lineHeight: 1.6,
            marginBottom: 5,
            whiteSpace: "pre-wrap",
            wordBreak: "break-word",
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
          style={{
            width: 80,
            height: 80,
            objectFit: "cover",
            borderRadius: 5,
            marginBottom: 5,
            border: "1px solid rgba(255,255,255,0.08)",
          }}
        />
      ) : (
        <div
          style={{
            width: 80,
            height: 80,
            background: "rgba(255,255,255,0.04)",
            borderRadius: 5,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "#484f58",
            fontSize: 10,
            marginBottom: 5,
            border: "1px dashed rgba(255,255,255,0.1)",
          }}
        >
          no image
        </div>
      );
    case 12:
      return (
        <div style={{ display: "flex", flexWrap: "wrap", gap: 3, marginBottom: 5 }}>
          {(comp.items ?? []).map((item, i) =>
            item.url ? (
              <img
                key={i}
                src={item.url}
                alt={item.description ?? ""}
                style={{
                  width: 58,
                  height: 58,
                  objectFit: "cover",
                  borderRadius: 4,
                  border: "1px solid rgba(255,255,255,0.08)",
                }}
              />
            ) : null
          )}
        </div>
      );
    case 14:
      return (
        <div
          style={{
            margin:
              comp.spacing === 2 ? "12px 0" : comp.spacing === 0 ? "4px 0" : "8px 0",
          }}
        >
          {comp.divider && (
            <div
              style={{ borderTop: "1px solid rgba(255,255,255,0.12)", margin: 0 }}
            />
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
      const s = BUTTON_STYLE_COLORS[comp.style ?? 1] ?? BUTTON_STYLE_COLORS[1];
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
            border: s.border ?? "none",
            cursor: "default",
            userSelect: "none",
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
  const accentColor =
    embed.color != null
      ? `#${embed.color.toString(16).padStart(6, "0")}`
      : "#5865F2";
  return (
    <div
      style={{
        display: "flex",
        background: "#2b2d31",
        borderRadius: 4,
        overflow: "hidden",
        marginBottom: 8,
        borderLeft: `4px solid ${accentColor}`,
      }}
    >
      <div style={{ padding: "12px 16px", flex: 1 }}>
        {embed.author && (
          <div
            style={{ color: "#dbdee1", fontSize: 12, fontWeight: 600, marginBottom: 3 }}
          >
            {embed.author.name}
          </div>
        )}
        {embed.title && (
          <div
            style={{ color: "#00b0f4", fontSize: 15, fontWeight: 700, marginBottom: 4 }}
          >
            {embed.title}
          </div>
        )}
        {embed.description && (
          <div
            style={{
              color: "#b5bac1",
              fontSize: 13,
              lineHeight: 1.5,
              marginBottom: 4,
              whiteSpace: "pre-wrap",
            }}
          >
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
          <div style={{ color: "#949ba4", fontSize: 11, marginTop: 8 }}>
            {embed.footer.text}
          </div>
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
          borderBottom: "1px solid rgba(255,255,255,0.06)",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          flexShrink: 0,
        }}
      >
        <span
          style={{
            color: "#7d8590",
            fontSize: 10,
            fontWeight: 700,
            textTransform: "uppercase",
            letterSpacing: "0.08em",
          }}
        >
          Live Preview
        </span>
        {!isValid && errors.length > 0 && (
          <div style={{ display: "flex", alignItems: "center", gap: 4, color: "#f85149", fontSize: 11 }}>
            <AlertTriangle size={11} />
            {errors.length} error{errors.length !== 1 ? "s" : ""}
          </div>
        )}
      </div>

      <div style={{ flex: 1, overflowY: "auto", padding: 12 }}>
        <div
          style={{
            background: "#313338",
            borderRadius: 8,
            padding: "12px 14px",
            minHeight: 80,
            fontFamily: '"gg sans","Noto Sans",Whitney,"Helvetica Neue",Helvetica,Arial,sans-serif',
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 10,
              marginBottom: 10,
            }}
          >
            <div
              style={{
                width: 38,
                height: 38,
                borderRadius: "50%",
                background: "#5865F2",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "#fff",
                fontSize: 13,
                fontWeight: 800,
                flexShrink: 0,
              }}
            >
              OE
            </div>
            <div>
              <div style={{ color: "#f2f3f5", fontSize: 14, fontWeight: 600 }}>
                OpenEmbedded Bot
              </div>
              <div style={{ color: "#949ba4", fontSize: 11 }}>Today at 12:00 PM</div>
            </div>
          </div>

          {!hasContent ? (
            <div
              style={{
                color: "#484f58",
                fontSize: 13,
                fontStyle: "italic",
                padding: "8px 0",
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
                  background: "rgba(248,81,73,0.08)",
                  border: "1px solid rgba(248,81,73,0.2)",
                  borderRadius: 5,
                  padding: "5px 9px",
                  color: "#f85149",
                  fontSize: 11,
                  marginBottom: 4,
                  display: "flex",
                  alignItems: "center",
                  gap: 5,
                }}
              >
                <AlertTriangle size={10} />
                {e.message}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
