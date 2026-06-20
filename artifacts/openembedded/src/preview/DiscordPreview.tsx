import { usePreviewStore } from "@/lib/previewStore";
import { AlertTriangle, ExternalLink, Hash } from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────

interface DC {
  type: number;
  content?: string;
  components?: DC[];
  accessory?: DC;
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

interface Embed {
  title?: string;
  description?: string;
  color?: number;
  author?: { name: string; icon_url?: string };
  footer?: { text: string; icon_url?: string };
  image?: { url: string };
  thumbnail?: { url: string };
  fields?: { name: string; value: string; inline?: boolean }[];
  timestamp?: string;
}

// ─── Discord accurate colors ──────────────────────────────────────────────────

const DC_FONT = `"gg sans","Noto Sans",Whitney,"Helvetica Neue",Helvetica,Arial,sans-serif`;
const CHAT_BG = "#313338";
const CONTAINER_BG = "#2b2d31";
const TEXT_NORMAL = "#dbdee1";
const TEXT_MUTED = "#949ba4";
const TEXT_LINK = "#00a8fc";
const BORDER = "rgba(79,84,92,0.48)";

// Real Discord button palette (dark theme, 2024)
const BTN: Record<number, { bg: string; color: string; border?: string }> = {
  1: { bg: "#5865f2", color: "#fff" },
  2: { bg: "#4e5058", color: "#fff" },
  3: { bg: "#248046", color: "#fff" },
  4: { bg: "#da3633", color: "#fff" },
  5: { bg: "transparent", color: TEXT_LINK, border: "1px solid rgba(0,168,252,0.35)" },
};

// ─── Lightweight Discord markdown ─────────────────────────────────────────────

import type { ReactNode } from "react";

function md(text: string): ReactNode[] {
  const out: ReactNode[] = [];
  const re =
    /(\*\*(.+?)\*\*|\*(.+?)\*|__(.+?)__|~~(.+?)~~|`(.+?)`|\|\|(.+?)\|\||https?:\/\/[^\s>]+)/gs;
  let last = 0;
  let m: RegExpExecArray | null;
  let k = 0;
  while ((m = re.exec(text)) !== null) {
    if (m.index > last) out.push(text.slice(last, m.index));
    if (m[2]) out.push(<strong key={k++}>{m[2]}</strong>);
    else if (m[3]) out.push(<em key={k++}>{m[3]}</em>);
    else if (m[4]) out.push(<u key={k++}>{m[4]}</u>);
    else if (m[5]) out.push(<s key={k++}>{m[5]}</s>);
    else if (m[6])
      out.push(
        <code
          key={k++}
          style={{
            background: "#111214",
            borderRadius: 3,
            padding: "0 4px",
            fontSize: "85%",
            fontFamily: `Consolas,"Andale Mono",monospace`,
            color: "#c9cdd3",
          }}
        >
          {m[6]}
        </code>
      );
    else if (m[7])
      out.push(
        <span
          key={k++}
          title="Spoiler — click to reveal"
          style={{
            background: "#202225",
            color: "transparent",
            borderRadius: 3,
            padding: "0 2px",
            userSelect: "none",
            cursor: "pointer",
          }}
        >
          {m[7]}
        </span>
      );
    else if (m[0])
      out.push(
        <a
          key={k++}
          href={m[0]}
          target="_blank"
          rel="noreferrer"
          style={{ color: TEXT_LINK, textDecoration: "none" }}
        >
          {m[0]}
        </a>
      );
    last = m.index + m[0].length;
  }
  if (last < text.length) out.push(text.slice(last));
  return out;
}

// ─── Sub-renderers ────────────────────────────────────────────────────────────

function TextDisplay({ comp }: { comp: DC }) {
  const lines = (comp.content ?? "").split("\n");
  return (
    <div
      style={{
        color: TEXT_NORMAL,
        fontSize: 15,
        lineHeight: 1.375,
        fontFamily: DC_FONT,
        wordBreak: "break-word",
      }}
    >
      {lines.map((line, i) => (
        <span key={i}>
          {md(line)}
          {i < lines.length - 1 && <br />}
        </span>
      ))}
    </div>
  );
}

function ThumbImg({ comp, w, h }: { comp: DC; w: number; h: number }) {
  return comp.media?.url ? (
    <img
      src={comp.media.url}
      alt={comp.description ?? ""}
      style={{
        width: w,
        height: h,
        objectFit: "cover",
        borderRadius: 4,
        display: "block",
        flexShrink: 0,
      }}
      onError={(e) => {
        (e.currentTarget as HTMLImageElement).style.visibility = "hidden";
      }}
    />
  ) : (
    <div
      style={{
        width: w,
        height: h,
        borderRadius: 4,
        flexShrink: 0,
        background: "rgba(255,255,255,0.04)",
        border: "1px dashed rgba(255,255,255,0.12)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        color: "#484f58",
        fontSize: 10,
        fontFamily: DC_FONT,
      }}
    >
      img
    </div>
  );
}

function MediaGallery({ comp }: { comp: DC }) {
  const items = (comp.items ?? []).filter((x) => x);
  if (!items.length)
    return (
      <div style={{ color: "#484f58", fontSize: 13, fontFamily: DC_FONT }}>
        No images
      </div>
    );

  const MAX = 400;

  if (items.length === 1) {
    const it = items[0];
    return it.url ? (
      <img
        src={it.url}
        alt={it.description ?? ""}
        style={{
          display: "block",
          maxWidth: MAX,
          maxHeight: 300,
          width: "100%",
          objectFit: "cover",
          borderRadius: 4,
        }}
        onError={(e) => {
          (e.currentTarget as HTMLImageElement).style.display = "none";
        }}
      />
    ) : null;
  }

  if (items.length === 2) {
    return (
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: 2,
          maxWidth: MAX,
          borderRadius: 4,
          overflow: "hidden",
        }}
      >
        {items.map((it, i) =>
          it.url ? (
            <img
              key={i}
              src={it.url}
              alt=""
              style={{ width: "100%", height: 175, objectFit: "cover", display: "block" }}
              onError={(e) => {
                (e.currentTarget as HTMLImageElement).style.display = "none";
              }}
            />
          ) : (
            <div key={i} style={{ height: 175, background: "rgba(255,255,255,0.04)" }} />
          )
        )}
      </div>
    );
  }

  if (items.length === 3) {
    return (
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gridTemplateRows: "1fr 1fr",
          gap: 2,
          maxWidth: MAX,
          borderRadius: 4,
          overflow: "hidden",
        }}
      >
        {items[0].url && (
          <img
            src={items[0].url}
            alt=""
            style={{
              gridRow: "1 / 3",
              width: "100%",
              height: "100%",
              objectFit: "cover",
              display: "block",
              minHeight: 200,
            }}
            onError={(e) => {
              (e.currentTarget as HTMLImageElement).style.display = "none";
            }}
          />
        )}
        {items.slice(1).map((it, i) =>
          it.url ? (
            <img
              key={i}
              src={it.url}
              alt=""
              style={{ width: "100%", height: 99, objectFit: "cover", display: "block" }}
              onError={(e) => {
                (e.currentTarget as HTMLImageElement).style.display = "none";
              }}
            />
          ) : (
            <div key={i} style={{ height: 99, background: "rgba(255,255,255,0.04)" }} />
          )
        )}
      </div>
    );
  }

  // 4+ — 2×2 grid with overflow counter on last tile
  const visible = items.slice(0, 4);
  const extra = items.length - 4;
  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "1fr 1fr",
        gap: 2,
        maxWidth: MAX,
        borderRadius: 4,
        overflow: "hidden",
      }}
    >
      {visible.map((it, i) => {
        const isLast = i === 3 && extra > 0;
        return (
          <div key={i} style={{ position: "relative" }}>
            {it.url ? (
              <img
                src={it.url}
                alt=""
                style={{ width: "100%", height: 140, objectFit: "cover", display: "block" }}
                onError={(e) => {
                  (e.currentTarget as HTMLImageElement).style.display = "none";
                }}
              />
            ) : (
              <div style={{ height: 140, background: "rgba(255,255,255,0.04)" }} />
            )}
            {isLast && (
              <div
                style={{
                  position: "absolute",
                  inset: 0,
                  background: "rgba(0,0,0,0.6)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "#fff",
                  fontSize: 24,
                  fontWeight: 700,
                  fontFamily: DC_FONT,
                }}
              >
                +{extra}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

function DCSeparator({ comp }: { comp: DC }) {
  // Discord spacing: small=8px, medium=16px, large=24px
  const gap = comp.spacing === 2 ? 24 : comp.spacing === 0 ? 8 : 16;
  return (
    <div style={{ paddingTop: gap / 2, paddingBottom: gap / 2 }}>
      {comp.divider && <div style={{ height: 1, background: BORDER }} />}
    </div>
  );
}

function DCButton({ comp }: { comp: DC }) {
  const s = BTN[comp.style ?? 1] ?? BTN[1];
  return (
    <div
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 6,
        height: 32,
        padding: "0 16px",
        borderRadius: 4,
        background: s.bg,
        color: s.color,
        border: s.border ?? "none",
        fontSize: 14,
        fontWeight: 500,
        fontFamily: DC_FONT,
        cursor: "pointer",
        userSelect: "none",
        flexShrink: 0,
        whiteSpace: "nowrap",
        maxWidth: 200,
        overflow: "hidden",
      }}
    >
      <span style={{ overflow: "hidden", textOverflow: "ellipsis" }}>
        {comp.label ?? "Button"}
      </span>
      {comp.style === 5 && (
        <ExternalLink size={12} style={{ flexShrink: 0, opacity: 0.85 }} />
      )}
    </div>
  );
}

function ActionRow({ comp }: { comp: DC }) {
  return (
    <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
      {(comp.components ?? []).map((c, i) =>
        c.type === 2 ? (
          <DCButton key={i} comp={c} />
        ) : (
          <RenderComponent key={i} comp={c} />
        )
      )}
    </div>
  );
}

function Section({ comp }: { comp: DC }) {
  const texts = (comp.components ?? []).filter((c) => c.type !== 11);
  const acc = comp.accessory;
  return (
    <div style={{ display: "flex", alignItems: "flex-start", gap: 16 }}>
      <div
        style={{
          flex: 1,
          minWidth: 0,
          display: "flex",
          flexDirection: "column",
          gap: 6,
        }}
      >
        {texts.map((c, i) => (
          <RenderComponent key={i} comp={c} />
        ))}
      </div>
      {acc && <ThumbImg comp={acc} w={80} h={80} />}
    </div>
  );
}

function Container({ comp }: { comp: DC }) {
  const accent =
    comp.accent_color != null
      ? `#${comp.accent_color.toString(16).padStart(6, "0")}`
      : null;

  return (
    <div
      style={{
        position: "relative",
        background: CONTAINER_BG,
        borderRadius: 8,
        overflow: "hidden",
        border: accent ? "none" : `1px solid ${BORDER}`,
      }}
    >
      {/* Left accent stripe — same visual idiom Discord uses */}
      {accent && (
        <div
          style={{
            position: "absolute",
            left: 0,
            top: 0,
            bottom: 0,
            width: 4,
            background: accent,
            borderRadius: "8px 0 0 8px",
          }}
        />
      )}

      {/* Spoiler veil */}
      {comp.spoiler && (
        <div
          style={{
            position: "absolute",
            inset: 0,
            zIndex: 2,
            background: "rgba(0,0,0,0.92)",
            borderRadius: 8,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            cursor: "pointer",
          }}
        >
          <span
            style={{
              color: TEXT_MUTED,
              fontSize: 13,
              fontFamily: DC_FONT,
              fontWeight: 500,
            }}
          >
            🔒 Spoiler — click to reveal
          </span>
        </div>
      )}

      {/* Inner content */}
      <div
        style={{
          marginLeft: accent ? 4 : 0,
          padding: "12px 16px",
          display: "flex",
          flexDirection: "column",
          gap: 8,
        }}
      >
        {(comp.components ?? []).map((c, i) => (
          <RenderComponent key={i} comp={c} />
        ))}
      </div>
    </div>
  );
}

function RenderComponent({ comp }: { comp: DC }): React.ReactElement | null {
  switch (comp.type) {
    case 17: return <Container comp={comp} />;
    case 9:  return <Section comp={comp} />;
    case 10: return <TextDisplay comp={comp} />;
    case 11: return <ThumbImg comp={comp} w={300} h={200} />;
    case 12: return <MediaGallery comp={comp} />;
    case 14: return <DCSeparator comp={comp} />;
    case 1:  return <ActionRow comp={comp} />;
    case 2:  return <DCButton comp={comp} />;
    default: return null;
  }
}

// ─── Legacy embed ─────────────────────────────────────────────────────────────

function RenderEmbed({ embed }: { embed: Embed }) {
  const accent =
    embed.color != null
      ? `#${embed.color.toString(16).padStart(6, "0")}`
      : "#5865f2";

  return (
    <div
      style={{
        display: "flex",
        background: "#2b2d31",
        borderRadius: 4,
        overflow: "hidden",
        borderLeft: `4px solid ${accent}`,
        maxWidth: 520,
      }}
    >
      <div
        style={{
          padding: "12px 16px 16px",
          flex: 1,
          minWidth: 0,
          display: "flex",
          flexDirection: "column",
          gap: 4,
        }}
      >
        {embed.author && (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 6,
              marginBottom: 2,
            }}
          >
            {embed.author.icon_url && (
              <img
                src={embed.author.icon_url}
                alt=""
                style={{ width: 16, height: 16, borderRadius: "50%" }}
              />
            )}
            <span
              style={{
                color: TEXT_NORMAL,
                fontSize: 13,
                fontWeight: 600,
                fontFamily: DC_FONT,
              }}
            >
              {embed.author.name}
            </span>
          </div>
        )}
        {embed.title && (
          <div
            style={{
              color: TEXT_LINK,
              fontSize: 15,
              fontWeight: 700,
              lineHeight: 1.3,
              fontFamily: DC_FONT,
            }}
          >
            {embed.title}
          </div>
        )}
        {embed.description && (
          <div
            style={{
              color: "#c4c9ce",
              fontSize: 13,
              lineHeight: 1.5,
              fontFamily: DC_FONT,
              whiteSpace: "pre-wrap",
              wordBreak: "break-word",
            }}
          >
            {embed.description}
          </div>
        )}
        {embed.fields && embed.fields.length > 0 && (
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(3, 1fr)",
              gap: "4px 8px",
              marginTop: 4,
            }}
          >
            {embed.fields.map((f, i) => (
              <div
                key={i}
                style={{ gridColumn: f.inline ? "auto" : "1 / -1" }}
              >
                <div
                  style={{
                    color: TEXT_NORMAL,
                    fontSize: 13,
                    fontWeight: 700,
                    marginBottom: 1,
                    fontFamily: DC_FONT,
                  }}
                >
                  {f.name}
                </div>
                <div
                  style={{
                    color: "#c4c9ce",
                    fontSize: 13,
                    fontFamily: DC_FONT,
                  }}
                >
                  {f.value}
                </div>
              </div>
            ))}
          </div>
        )}
        {embed.image?.url && (
          <img
            src={embed.image.url}
            alt=""
            style={{
              maxWidth: "100%",
              maxHeight: 300,
              borderRadius: 4,
              marginTop: 6,
              display: "block",
            }}
          />
        )}
        {embed.footer && (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 6,
              marginTop: 4,
            }}
          >
            {embed.footer.icon_url && (
              <img
                src={embed.footer.icon_url}
                alt=""
                style={{ width: 16, height: 16, borderRadius: "50%" }}
              />
            )}
            <span
              style={{ color: TEXT_MUTED, fontSize: 12, fontFamily: DC_FONT }}
            >
              {embed.footer.text}
              {embed.timestamp &&
                ` • ${new Date(embed.timestamp).toLocaleDateString()}`}
            </span>
          </div>
        )}
      </div>
      {embed.thumbnail?.url && (
        <div style={{ padding: "12px 16px 16px 0", flexShrink: 0 }}>
          <img
            src={embed.thumbnail.url}
            alt=""
            style={{ width: 80, height: 80, objectFit: "cover", borderRadius: 4 }}
          />
        </div>
      )}
    </div>
  );
}

// ─── Discord chrome shell ─────────────────────────────────────────────────────

export function DiscordPreview() {
  const payload = usePreviewStore((s) => s.payload);
  const isValid = usePreviewStore((s) => s.isValid);
  const errors = usePreviewStore((s) => s.errors);

  const components = (payload?.components ?? []) as DC[];
  const embeds = (payload?.embeds ?? []) as Embed[];
  const hasContent = components.length > 0 || embeds.length > 0;

  const timeStr = new Date().toLocaleTimeString([], {
    hour: "numeric",
    minute: "2-digit",
  });

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        height: "100%",
        overflow: "hidden",
        background: "#1e1f22",
      }}
    >
      {/* Channel header */}
      <div
        style={{
          height: 44,
          flexShrink: 0,
          display: "flex",
          alignItems: "center",
          gap: 8,
          padding: "0 14px",
          background: "#2b2d31",
          boxShadow: "0 1px 0 rgba(0,0,0,0.35)",
        }}
      >
        <Hash size={18} color="#7d8590" strokeWidth={2.5} />
        <span
          style={{
            color: TEXT_NORMAL,
            fontSize: 15,
            fontWeight: 700,
            fontFamily: DC_FONT,
          }}
        >
          preview
        </span>
        <div
          style={{
            width: 1,
            height: 18,
            background: "rgba(255,255,255,0.08)",
            margin: "0 2px",
          }}
        />
        <span
          style={{
            color: TEXT_MUTED,
            fontSize: 13,
            fontFamily: DC_FONT,
          }}
        >
          Live Discord preview
        </span>
        {!isValid && errors.length > 0 && (
          <div
            style={{
              marginLeft: "auto",
              display: "flex",
              alignItems: "center",
              gap: 4,
              color: "#f85149",
              fontSize: 11,
              fontFamily: DC_FONT,
            }}
          >
            <AlertTriangle size={11} />
            {errors.length} error{errors.length !== 1 ? "s" : ""}
          </div>
        )}
      </div>

      {/* Messages area */}
      <div
        style={{
          flex: 1,
          overflowY: "auto",
          background: CHAT_BG,
          padding: "20px 0 8px",
        }}
      >
        {/* Bot message */}
        <div
          style={{
            padding: "2px 16px 2px 72px",
            position: "relative",
            fontFamily: DC_FONT,
          }}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLDivElement).style.background = "#35373c";
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLDivElement).style.background = "transparent";
          }}
        >
          {/* Bot avatar */}
          <div
            style={{
              position: "absolute",
              left: 16,
              top: 2,
              width: 40,
              height: 40,
              borderRadius: "50%",
              background: "#5865f2",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#fff",
              fontSize: 13,
              fontWeight: 800,
              userSelect: "none",
              flexShrink: 0,
            }}
          >
            OE
          </div>

          {/* Username + APP tag + timestamp */}
          <div
            style={{
              display: "flex",
              alignItems: "baseline",
              gap: 6,
              marginBottom: 4,
            }}
          >
            <span
              style={{
                color: "#f2f3f5",
                fontSize: 15,
                fontWeight: 600,
                lineHeight: 1.2,
                fontFamily: DC_FONT,
              }}
            >
              OpenEmbedded Bot
            </span>
            <span
              style={{
                background: "#5865f2",
                color: "#fff",
                fontSize: 10,
                fontWeight: 700,
                padding: "1px 4px",
                borderRadius: 3,
                fontFamily: DC_FONT,
                letterSpacing: "0.01em",
                lineHeight: 1.4,
                alignSelf: "center",
              }}
            >
              APP
            </span>
            <span
              style={{
                color: TEXT_MUTED,
                fontSize: 12,
                fontWeight: 400,
                lineHeight: 1.2,
                fontFamily: DC_FONT,
              }}
            >
              Today at {timeStr}
            </span>
          </div>

          {/* Message content */}
          {!hasContent ? (
            <div
              style={{
                color: "#484f58",
                fontSize: 14,
                fontStyle: "italic",
                fontFamily: DC_FONT,
                lineHeight: 1.5,
                padding: "2px 0",
              }}
            >
              Add nodes on the canvas and connect them to see a live preview
            </div>
          ) : (
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: 8,
                maxWidth: 520,
              }}
            >
              {embeds.map((embed, i) => (
                <RenderEmbed key={i} embed={embed} />
              ))}
              {components.map((comp, i) => (
                <RenderComponent key={i} comp={comp} />
              ))}
            </div>
          )}
        </div>

        <div style={{ height: 24 }} />
      </div>

      {/* Validation errors bar */}
      {!isValid && errors.length > 0 && (
        <div
          style={{
            flexShrink: 0,
            padding: "6px 12px",
            background: "#1e1f22",
            borderTop: "1px solid rgba(248,81,73,0.2)",
            display: "flex",
            flexDirection: "column",
            gap: 3,
            maxHeight: 80,
            overflowY: "auto",
          }}
        >
          {errors.map((e, i) => (
            <div
              key={i}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 5,
                color: "#f85149",
                fontSize: 11,
                fontFamily: DC_FONT,
              }}
            >
              <AlertTriangle size={10} style={{ flexShrink: 0 }} />
              {e.message}
            </div>
          ))}
        </div>
      )}

      <style>{`
        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); border-radius: 10px; }
        ::-webkit-scrollbar-thumb:hover { background: rgba(255,255,255,0.18); }
      `}</style>
    </div>
  );
}
