import { usePreviewStore } from "@/lib/previewStore";
import { useGraphStore } from "@/lib/graphStore";
import { AlertTriangle, Hash, ChevronDown, X, Upload, ExternalLink } from "lucide-react";
import { useState, useRef, useCallback } from "react";

// ─── Types ────────────────────────────────────────────────────────────────────

interface SelectOption {
  label: string;
  value: string;
  description?: string;
  default?: boolean;
}

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
  disabled?: boolean;
  emoji?: { name: string };
  placeholder?: string;
  min_values?: number;
  max_values?: number;
  options?: SelectOption[];
  sku_id?: string;
  // text input
  min_length?: number;
  max_length?: number;
  required?: boolean;
  value?: string;
}

interface EmbedField {
  name: string;
  value: string;
  inline?: boolean;
}

interface Embed {
  title?: string;
  description?: string;
  color?: number;
  url?: string;
  author?: { name: string; icon_url?: string };
  footer?: { text: string; icon_url?: string };
  image?: { url: string };
  thumbnail?: { url: string };
  fields?: EmbedField[];
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
const INPUT_BG = "#1e1f22";
const INPUT_BORDER = "rgba(79,84,92,0.6)";

// Real Discord button palette (dark theme)
const BTN: Record<number, { bg: string; color: string; border?: string }> = {
  1: { bg: "#5865f2", color: "#fff" },
  2: { bg: "#4e5058", color: "#fff" },
  3: { bg: "#248046", color: "#fff" },
  4: { bg: "#da3633", color: "#fff" },
  5: { bg: "transparent", color: TEXT_LINK, border: "1px solid rgba(0,168,252,0.35)" },
  6: { bg: "#f47fff", color: "#fff" },
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
        style={{ display: "block", maxWidth: MAX, maxHeight: 300, width: "100%", objectFit: "cover", borderRadius: 4 }}
        onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = "none"; }}
      />
    ) : null;
  }

  if (items.length === 2) {
    return (
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 2, maxWidth: MAX, borderRadius: 4, overflow: "hidden" }}>
        {items.map((it, i) =>
          it.url ? (
            <img key={i} src={it.url} alt="" style={{ width: "100%", height: 175, objectFit: "cover", display: "block" }}
              onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = "none"; }} />
          ) : (
            <div key={i} style={{ height: 175, background: "rgba(255,255,255,0.04)" }} />
          )
        )}
      </div>
    );
  }

  if (items.length === 3) {
    return (
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gridTemplateRows: "1fr 1fr", gap: 2, maxWidth: MAX, borderRadius: 4, overflow: "hidden" }}>
        {items[0].url && (
          <img src={items[0].url} alt="" style={{ gridRow: "1 / 3", width: "100%", height: "100%", objectFit: "cover", display: "block", minHeight: 200 }}
            onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = "none"; }} />
        )}
        {items.slice(1).map((it, i) =>
          it.url ? (
            <img key={i} src={it.url} alt="" style={{ width: "100%", height: 99, objectFit: "cover", display: "block" }}
              onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = "none"; }} />
          ) : (
            <div key={i} style={{ height: 99, background: "rgba(255,255,255,0.04)" }} />
          )
        )}
      </div>
    );
  }

  const visible = items.slice(0, 4);
  const extra = items.length - 4;
  return (
    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 2, maxWidth: MAX, borderRadius: 4, overflow: "hidden" }}>
      {visible.map((it, i) => {
        const isLast = i === 3 && extra > 0;
        return (
          <div key={i} style={{ position: "relative" }}>
            {it.url ? (
              <img src={it.url} alt="" style={{ width: "100%", height: 140, objectFit: "cover", display: "block" }}
                onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = "none"; }} />
            ) : (
              <div style={{ height: 140, background: "rgba(255,255,255,0.04)" }} />
            )}
            {isLast && (
              <div style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.6)", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontSize: 24, fontWeight: 700, fontFamily: DC_FONT }}>
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
  const gap = comp.spacing === 2 ? 24 : comp.spacing === 0 ? 8 : 16;
  return (
    <div style={{ paddingTop: gap / 2, paddingBottom: gap / 2 }}>
      {comp.divider && <div style={{ height: 1, background: BORDER }} />}
    </div>
  );
}

function DCButton({ comp }: { comp: DC }) {
  const s = BTN[comp.style ?? 1] ?? BTN[1];
  const isDisabled = comp.disabled;
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
        cursor: isDisabled ? "not-allowed" : "pointer",
        userSelect: "none",
        flexShrink: 0,
        whiteSpace: "nowrap",
        maxWidth: 200,
        overflow: "hidden",
        opacity: isDisabled ? 0.5 : 1,
      }}
    >
      {comp.emoji && (
        <span style={{ fontSize: 16, lineHeight: 1 }}>{comp.emoji.name}</span>
      )}
      <span style={{ overflow: "hidden", textOverflow: "ellipsis" }}>
        {comp.label ?? "Button"}
      </span>
      {comp.style === 5 && (
        <ExternalLink size={12} style={{ flexShrink: 0, opacity: 0.85 }} />
      )}
    </div>
  );
}

function DCStringSelect({ comp }: { comp: DC }) {
  const opts = comp.options ?? [];
  const defaultOpt = opts.find((o) => o.default);
  const isDisabled = comp.disabled;

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        background: INPUT_BG,
        border: `1px solid ${INPUT_BORDER}`,
        borderRadius: 4,
        padding: "8px 12px",
        cursor: isDisabled ? "not-allowed" : "pointer",
        opacity: isDisabled ? 0.5 : 1,
        fontFamily: DC_FONT,
        maxWidth: "100%",
        gap: 8,
      }}
    >
      <span style={{ color: defaultOpt ? TEXT_NORMAL : TEXT_MUTED, fontSize: 14, flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
        {defaultOpt ? defaultOpt.label : (comp.placeholder || "Make a selection…")}
      </span>
      <ChevronDown size={16} color={TEXT_MUTED} style={{ flexShrink: 0 }} />
    </div>
  );
}

function DCAutoSelect({ comp, label }: { comp: DC; label: string }) {
  const isDisabled = comp.disabled;
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        background: INPUT_BG,
        border: `1px solid ${INPUT_BORDER}`,
        borderRadius: 4,
        padding: "8px 12px",
        cursor: isDisabled ? "not-allowed" : "pointer",
        opacity: isDisabled ? 0.5 : 1,
        fontFamily: DC_FONT,
        maxWidth: "100%",
        gap: 8,
      }}
    >
      <span style={{ color: TEXT_MUTED, fontSize: 14, flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
        {comp.placeholder || `Select a ${label.toLowerCase()}…`}
      </span>
      <ChevronDown size={16} color={TEXT_MUTED} style={{ flexShrink: 0 }} />
    </div>
  );
}

function DCTextInput({ comp }: { comp: DC }) {
  const isLong = comp.style === 2;
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 6, fontFamily: DC_FONT }}>
      <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
        <span style={{ color: TEXT_NORMAL, fontSize: 13, fontWeight: 600 }}>
          {comp.label ?? "Input"}
        </span>
        {comp.required && <span style={{ color: "#da3633", fontSize: 12 }}>*</span>}
      </div>
      <div
        style={{
          background: INPUT_BG,
          border: `1px solid ${INPUT_BORDER}`,
          borderRadius: 4,
          padding: "10px 12px",
          minHeight: isLong ? 80 : 40,
          color: comp.value ? TEXT_NORMAL : TEXT_MUTED,
          fontSize: 14,
          wordBreak: "break-word",
          whiteSpace: "pre-wrap",
        }}
      >
        {comp.value || comp.placeholder || (isLong ? "Enter a longer response…" : "Enter text…")}
      </div>
      {(comp.min_length != null || comp.max_length != null) && (
        <div style={{ color: TEXT_MUTED, fontSize: 12 }}>
          {comp.min_length != null && `Min: ${comp.min_length}`}
          {comp.min_length != null && comp.max_length != null && " · "}
          {comp.max_length != null && `Max: ${comp.max_length}`}
        </div>
      )}
    </div>
  );
}

function ActionRow({ comp }: { comp: DC }) {
  return (
    <div style={{ display: "flex", flexWrap: "wrap", gap: 8, flexDirection: [3, 5, 6, 7, 8].includes(comp.components?.[0]?.type ?? 0) ? "column" : "row" }}>
      {(comp.components ?? []).map((c, i) => (
        <RenderComponent key={i} comp={c} />
      ))}
    </div>
  );
}

function Section({ comp }: { comp: DC }) {
  const texts = (comp.components ?? []).filter((c) => c.type !== 11);
  const acc = comp.accessory;
  return (
    <div style={{ display: "flex", alignItems: "flex-start", gap: 16 }}>
      <div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", gap: 6 }}>
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
          <span style={{ color: TEXT_MUTED, fontSize: 13, fontFamily: DC_FONT, fontWeight: 500 }}>
            🔒 Spoiler — click to reveal
          </span>
        </div>
      )}
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
    case 3:  return <DCStringSelect comp={comp} />;
    case 4:  return <DCTextInput comp={comp} />;
    case 5:  return <DCAutoSelect comp={comp} label="User" />;
    case 6:  return <DCAutoSelect comp={comp} label="Role" />;
    case 7:  return <DCAutoSelect comp={comp} label="User or Role" />;
    case 8:  return <DCAutoSelect comp={comp} label="Channel" />;
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
          <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 2 }}>
            {embed.author.icon_url && (
              <img src={embed.author.icon_url} alt="" style={{ width: 16, height: 16, borderRadius: "50%" }} />
            )}
            <span style={{ color: TEXT_NORMAL, fontSize: 13, fontWeight: 600, fontFamily: DC_FONT }}>
              {embed.author.name}
            </span>
          </div>
        )}
        {embed.title && (
          <div style={{ fontSize: 15, fontWeight: 700, lineHeight: 1.3, fontFamily: DC_FONT }}>
            {embed.url ? (
              <a href={embed.url} target="_blank" rel="noreferrer" style={{ color: TEXT_LINK, textDecoration: "none" }}>
                {embed.title}
              </a>
            ) : (
              <span style={{ color: TEXT_NORMAL }}>{embed.title}</span>
            )}
          </div>
        )}
        {embed.description && (
          <div style={{ color: "#c4c9ce", fontSize: 13, lineHeight: 1.5, fontFamily: DC_FONT, whiteSpace: "pre-wrap", wordBreak: "break-word" }}>
            {embed.description}
          </div>
        )}
        {embed.fields && embed.fields.length > 0 && (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "4px 8px", marginTop: 4 }}>
            {embed.fields.map((f, i) => (
              <div key={i} style={{ gridColumn: f.inline ? "auto" : "1 / -1" }}>
                <div style={{ color: TEXT_NORMAL, fontSize: 13, fontWeight: 700, marginBottom: 1, fontFamily: DC_FONT }}>
                  {f.name}
                </div>
                <div style={{ color: "#c4c9ce", fontSize: 13, fontFamily: DC_FONT, whiteSpace: "pre-wrap" }}>
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
            style={{ maxWidth: "100%", maxHeight: 300, borderRadius: 4, marginTop: 6, display: "block" }}
          />
        )}
        {embed.footer && (
          <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 4 }}>
            {embed.footer.icon_url && (
              <img src={embed.footer.icon_url} alt="" style={{ width: 16, height: 16, borderRadius: "50%" }} />
            )}
            <span style={{ color: TEXT_MUTED, fontSize: 12, fontFamily: DC_FONT }}>
              {embed.footer.text}
              {embed.timestamp && ` • ${new Date(embed.timestamp).toLocaleDateString()}`}
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

// ─── Avatar upload panel ──────────────────────────────────────────────────────

function AvatarUploadPanel({ onClose, onUpload }: { onClose: () => void; onUpload: (url: string) => void }) {
  const [dragOver, setDragOver] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const readFile = useCallback((file: File) => {
    if (!file.type.startsWith("image/")) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      const url = e.target?.result as string;
      setPreview(url);
      onUpload(url);
    };
    reader.readAsDataURL(file);
  }, [onUpload]);

  return (
    <div
      style={{
        position: "absolute", inset: 0, zIndex: 40,
        background: "rgba(0,0,0,0.7)",
        display: "flex", alignItems: "flex-end",
      }}
      onClick={onClose}
    >
      <div
        style={{
          width: "100%",
          background: "#1e1f22",
          borderTop: "1px solid rgba(255,255,255,0.1)",
          borderRadius: "12px 12px 0 0",
          padding: 16,
          boxShadow: "0 -8px 32px rgba(0,0,0,0.5)",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
          <span style={{ color: "#dbdee1", fontSize: 13, fontWeight: 700, fontFamily: DC_FONT }}>
            Change Bot Avatar
          </span>
          <button
            onClick={onClose}
            style={{ background: "none", border: "none", color: "#949ba4", cursor: "pointer", padding: 4, display: "flex" }}
          >
            <X size={16} />
          </button>
        </div>

        {/* Drop zone */}
        <div
          onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onDrop={(e) => {
            e.preventDefault();
            setDragOver(false);
            const file = e.dataTransfer.files[0];
            if (file) readFile(file);
          }}
          onClick={() => fileRef.current?.click()}
          style={{
            border: `2px dashed ${dragOver ? "#5865f2" : "rgba(255,255,255,0.12)"}`,
            borderRadius: 8,
            padding: "24px 16px",
            textAlign: "center",
            cursor: "pointer",
            background: dragOver ? "rgba(88,101,242,0.08)" : "rgba(255,255,255,0.03)",
            transition: "all 0.15s ease",
          }}
        >
          {preview ? (
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 8 }}>
              <img src={preview} alt="" style={{ width: 56, height: 56, borderRadius: "50%", objectFit: "cover" }} />
              <span style={{ color: "#3fb950", fontSize: 12, fontFamily: DC_FONT }}>✓ Avatar set</span>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}>
              <Upload size={22} color={dragOver ? "#5865f2" : "#949ba4"} />
              <span style={{ color: "#949ba4", fontSize: 13, fontFamily: DC_FONT }}>
                Drop image here or <span style={{ color: "#00a8fc" }}>browse</span>
              </span>
              <span style={{ color: "#5c6068", fontSize: 11, fontFamily: DC_FONT }}>PNG, JPG, GIF · preview only</span>
            </div>
          )}
        </div>

        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          style={{ display: "none" }}
          onChange={(e) => { const f = e.target.files?.[0]; if (f) readFile(f); }}
        />

        {preview && (
          <button
            onClick={onClose}
            style={{
              marginTop: 10, width: "100%", background: "#5865f2", border: "none",
              borderRadius: 6, color: "#fff", fontSize: 13, fontWeight: 600,
              padding: "9px 0", cursor: "pointer", fontFamily: DC_FONT,
            }}
          >
            Done
          </button>
        )}
      </div>
    </div>
  );
}

// ─── Discord chrome shell ─────────────────────────────────────────────────────

export function DiscordPreview() {
  const payload = usePreviewStore((s) => s.payload);
  const isValid = usePreviewStore((s) => s.isValid);
  const errors = usePreviewStore((s) => s.errors);
  const senderName = usePreviewStore((s) => s.senderName);
  const senderAvatarUrl = usePreviewStore((s) => s.senderAvatarUrl);
  const setSenderName = usePreviewStore((s) => s.setSenderName);
  const setSenderAvatarUrl = usePreviewStore((s) => s.setSenderAvatarUrl);

  // Check for a connected bot node
  const nodes = useGraphStore((s) => s.nodes);
  const botNode = nodes.find(
    (n) => n.type === "bot" && (n.data as Record<string, unknown>).connected === true
  );
  const botName = botNode ? (botNode.data as Record<string, unknown>).botName as string | null : null;
  const botAvatar = botNode ? (botNode.data as Record<string, unknown>).botAvatar as string | null : null;
  const isBotConnected = !!botNode;

  const displayName = isBotConnected ? (botName ?? "Bot") : (senderName || "MyBot");
  const displayAvatar = isBotConnected ? botAvatar : senderAvatarUrl;

  const components = (payload?.components ?? []) as DC[];
  const embeds = (payload?.embeds ?? []) as Embed[];
  const hasContent = components.length > 0 || embeds.length > 0;

  const timeStr = new Date().toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });

  const [avatarError, setAvatarError] = useState(false);
  const [avatarUploadOpen, setAvatarUploadOpen] = useState(false);
  const [editingName, setEditingName] = useState(false);
  const [nameValue, setNameValue] = useState(senderName);
  const nameInputRef = useRef<HTMLInputElement>(null);

  const commitName = () => {
    setSenderName(nameValue || "MyBot");
    setEditingName(false);
  };

  const openNameEdit = () => {
    if (isBotConnected) return;
    setNameValue(senderName);
    setEditingName(true);
    setTimeout(() => { nameInputRef.current?.select(); }, 30);
  };

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        height: "100%",
        overflow: "hidden",
        background: "#1a1a1a",
        position: "relative",
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
        <span style={{ color: TEXT_NORMAL, fontSize: 15, fontWeight: 700, fontFamily: DC_FONT }}>
          preview
        </span>
        <div style={{ width: 1, height: 18, background: "rgba(255,255,255,0.08)", margin: "0 2px" }} />
        <span style={{ color: TEXT_MUTED, fontSize: 13, fontFamily: DC_FONT }}>
          Live preview
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

      {/* Bot connected indicator */}
      {isBotConnected && (
        <div
          style={{
            flexShrink: 0,
            background: "rgba(63,185,80,0.07)",
            borderBottom: "1px solid rgba(63,185,80,0.15)",
            padding: "5px 12px",
            display: "flex",
            alignItems: "center",
            gap: 8,
          }}
        >
          {displayAvatar ? (
            <img src={displayAvatar} alt="" style={{ width: 20, height: 20, borderRadius: "50%", flexShrink: 0 }} onError={() => setAvatarError(true)} />
          ) : (
            <div style={{ width: 20, height: 20, borderRadius: "50%", background: "#5865f2", flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10 }}>🤖</div>
          )}
          <span style={{ color: "#3fb950", fontSize: 11, fontWeight: 600 }}>{displayName}</span>
          <span style={{ color: "#3fb950", fontSize: 10, opacity: 0.65 }}>Bot connected · showing real identity</span>
        </div>
      )}

      {/* Messages area */}
      <div style={{ flex: 1, overflowY: "auto", background: CHAT_BG, padding: "20px 0 8px" }}>
        {!hasContent ? (
          <div
            style={{
              display: "flex", flexDirection: "column", alignItems: "center",
              justifyContent: "center", height: "100%", gap: 10,
              color: TEXT_MUTED, fontFamily: DC_FONT,
            }}
          >
            <div style={{ fontSize: 32 }}>🤖</div>
            <div style={{ fontSize: 14, fontWeight: 600 }}>No components yet</div>
            <div style={{ fontSize: 13 }}>Add nodes from the left panel to preview your message</div>
          </div>
        ) : (
          <div style={{ display: "flex", alignItems: "flex-start", gap: 14, padding: "2px 16px 2px 14px" }}>

            {/* Avatar — double-click to upload (preview mode only) */}
            <div
              style={{ position: "relative", flexShrink: 0, marginTop: 2 }}
              onDoubleClick={() => { if (!isBotConnected) setAvatarUploadOpen(true); }}
              title={isBotConnected ? undefined : "Double-click to change avatar"}
            >
              <div
                style={{
                  width: 40, height: 40, borderRadius: "50%",
                  background: "#5865f2", overflow: "hidden",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 18,
                  cursor: isBotConnected ? "default" : "pointer",
                  outline: avatarUploadOpen ? "2px solid #5865f2" : "none",
                  outlineOffset: 2,
                }}
              >
                {displayAvatar && !avatarError ? (
                  <img
                    src={displayAvatar} alt=""
                    style={{ width: "100%", height: "100%", objectFit: "cover" }}
                    onError={() => setAvatarError(true)}
                    onLoad={() => setAvatarError(false)}
                  />
                ) : "🤖"}
              </div>
              {/* Subtle upload hint ring */}
              {!isBotConnected && (
                <div
                  style={{
                    position: "absolute", inset: -2, borderRadius: "50%",
                    border: "1.5px dashed rgba(255,255,255,0.18)",
                    pointerEvents: "none",
                  }}
                />
              )}
            </div>

            <div style={{ flex: 1, minWidth: 0 }}>
              {/* Name row */}
              <div style={{ display: "flex", alignItems: "baseline", gap: 8, marginBottom: 4 }}>

                {/* Bot name — double-click to edit (preview mode only) */}
                {editingName && !isBotConnected ? (
                  <input
                    ref={nameInputRef}
                    value={nameValue}
                    maxLength={10}
                    autoFocus
                    onChange={(e) => setNameValue(e.target.value)}
                    onBlur={commitName}
                    onKeyDown={(e) => { if (e.key === "Enter") commitName(); if (e.key === "Escape") { setEditingName(false); } }}
                    style={{
                      background: "rgba(88,101,242,0.15)",
                      border: "1px solid rgba(88,101,242,0.5)",
                      borderRadius: 4,
                      color: TEXT_NORMAL,
                      fontWeight: 700,
                      fontSize: 15,
                      fontFamily: DC_FONT,
                      outline: "none",
                      padding: "0 4px",
                      width: Math.max(60, nameValue.length * 9 + 16),
                      lineHeight: "22px",
                    }}
                  />
                ) : (
                  <span
                    style={{
                      color: TEXT_NORMAL, fontWeight: 700, fontSize: 15, fontFamily: DC_FONT,
                      cursor: isBotConnected ? "default" : "text",
                      borderBottom: isBotConnected ? "none" : "1px dashed rgba(255,255,255,0.15)",
                      paddingBottom: 1,
                    }}
                    onDoubleClick={openNameEdit}
                    title={isBotConnected ? undefined : "Double-click to edit name"}
                  >
                    {displayName}
                  </span>
                )}

                <span
                  style={{
                    background: "#5865f2", color: "#fff", fontSize: 10, fontWeight: 700,
                    padding: "1px 5px", borderRadius: 3, fontFamily: DC_FONT, lineHeight: "16px",
                  }}
                >
                  BOT
                </span>
                <span style={{ color: TEXT_MUTED, fontSize: 12, fontFamily: DC_FONT }}>{timeStr}</span>
              </div>

              {/* Embeds (V1) */}
              {embeds.length > 0 && (
                <div style={{ display: "flex", flexDirection: "column", gap: 4, marginBottom: components.length > 0 ? 8 : 0 }}>
                  {embeds.map((embed, i) => <RenderEmbed key={i} embed={embed} />)}
                </div>
              )}

              {/* V2 Components */}
              {components.length > 0 && (
                <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                  {components.map((comp, i) => <RenderComponent key={i} comp={comp} />)}
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Avatar upload panel overlay */}
      {avatarUploadOpen && (
        <AvatarUploadPanel
          onClose={() => setAvatarUploadOpen(false)}
          onUpload={(url) => { setSenderAvatarUrl(url); setAvatarError(false); }}
        />
      )}
    </div>
  );
}
