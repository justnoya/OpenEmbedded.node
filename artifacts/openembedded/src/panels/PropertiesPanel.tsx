import { useState } from "react";
import { useGraphStore } from "@/lib/graphStore";
import { usePreviewStore } from "@/lib/previewStore";
import { ALLOWED_CHILDREN } from "@/lib/connectionRules";
import { useBotValidate, useBotGetChannels, useBotSend } from "@workspace/api-client-react";
import {
  Package, LayoutTemplate, FileText, ImageIcon, GalleryHorizontalEnd,
  Minus, Rows3, PointerIcon, ListFilter, UserRound, ShieldCheck,
  AtSign, Hash, FormInput, MessageSquareCode, Trash2,
  Plus, X, ChevronUp, ChevronDown, Bot,
  CheckCircle2, AlertCircle, Loader2, Send, RefreshCw,
} from "lucide-react";
import { ReactNode } from "react";

const TYPE_META: Record<number, { label: string; icon: ReactNode; color: string }> = {
  17: { label: "Container",          icon: <Package size={14} />,              color: "#8b5cf6" },
  9:  { label: "Section",            icon: <LayoutTemplate size={14} />,       color: "#10b981" },
  10: { label: "Text Display",       icon: <FileText size={14} />,             color: "#3b82f6" },
  11: { label: "Thumbnail",          icon: <ImageIcon size={14} />,            color: "#f59e0b" },
  12: { label: "Media Gallery",      icon: <GalleryHorizontalEnd size={14} />, color: "#ec4899" },
  14: { label: "Separator",          icon: <Minus size={14} />,                color: "#6b7280" },
  1:  { label: "Action Row",         icon: <Rows3 size={14} />,                color: "#14b8a6" },
  2:  { label: "Button",             icon: <PointerIcon size={14} />,          color: "#5865F2" },
  3:  { label: "String Select",      icon: <ListFilter size={14} />,           color: "#f97316" },
  4:  { label: "Text Input",         icon: <FormInput size={14} />,            color: "#64748b" },
  5:  { label: "User Select",        icon: <UserRound size={14} />,            color: "#06b6d4" },
  6:  { label: "Role Select",        icon: <ShieldCheck size={14} />,          color: "#a855f7" },
  7:  { label: "Mentionable Select", icon: <AtSign size={14} />,               color: "#ec4899" },
  8:  { label: "Channel Select",     icon: <Hash size={14} />,                 color: "#22c55e" },
  0:  { label: "Embed (V1)",         icon: <MessageSquareCode size={14} />,    color: "#f59e0b" },
  [-1]: { label: "Bot",              icon: <Bot size={14} />,                  color: "#5865F2" },
};

const BG = "#161616";
const SURFACE = "rgba(255,255,255,0.04)";
const BORDER = "rgba(255,255,255,0.09)";
const TEXT = "#e8e8e8";
const MUTED = "#606060";
const FAINT = "#3a3a3a";

const inputStyle: React.CSSProperties = {
  width: "100%",
  background: "rgba(255,255,255,0.04)",
  border: "1px solid rgba(255,255,255,0.09)",
  borderRadius: 8,
  color: TEXT,
  fontSize: 12,
  padding: "7px 10px",
  boxSizing: "border-box",
  outline: "none",
  fontFamily: "inherit",
  transition: "border-color 0.15s, box-shadow 0.15s",
};

const labelStyle: React.CSSProperties = {
  display: "block",
  color: "#505050",
  fontSize: 10,
  fontWeight: 700,
  marginBottom: 5,
  textTransform: "uppercase",
  letterSpacing: "0.08em",
};

const fieldWrap: React.CSSProperties = { marginBottom: 14 };

const PARENT_COMPONENT_TYPES = new Set([17, 9, 1]);

function BotProperties({ nodeId, d, updateNodeData }: {
  nodeId: string;
  d: Record<string, unknown>;
  updateNodeData: (id: string, data: Record<string, unknown>) => void;
}) {
  const payload = usePreviewStore((s) => s.payload);
  const [tokenInput, setTokenInput] = useState((d.token as string) ?? "");
  const [sendStatus, setSendStatus] = useState<"idle" | "sending" | "success" | "error">("idle");
  const [sendMsg, setSendMsg] = useState("");
  const [fetchingChannels, setFetchingChannels] = useState(false);

  const botValidate = useBotValidate();
  const botGetChannels = useBotGetChannels();
  const botSend = useBotSend();

  const connected = !!d.connected;
  const botName = d.botName as string | null;
  const botAvatar = d.botAvatar as string | null;
  const guilds = (d.guilds as Array<{ id: string; name: string; icon: string | null }>) ?? [];
  const channels = (d.channels as Array<{ id: string; name: string }>) ?? [];
  const selectedGuildId = d.selectedGuildId as string | null;
  const selectedChannelId = d.selectedChannelId as string | null;

  const focusBorder = (e: React.FocusEvent) => {
    (e.currentTarget as HTMLElement).style.borderColor = "rgba(88,101,242,0.6)";
  };
  const blurBorder = (e: React.FocusEvent) => {
    (e.currentTarget as HTMLElement).style.borderColor = BORDER;
  };

  const handleConnect = () => {
    const t = tokenInput.trim();
    if (!t) return;
    botValidate.mutate(
      { data: { token: t } },
      {
        onSuccess: (res) => {
          const r = res as { success: boolean; botName?: string | null; botAvatar?: string | null; guilds?: Array<{ id: string; name: string; icon: string | null }>; message?: string | null };
          if (r.success) {
            updateNodeData(nodeId, {
              token: t,
              connected: true,
              botName: r.botName ?? null,
              botAvatar: r.botAvatar ?? null,
              guilds: r.guilds ?? [],
              selectedGuildId: r.guilds?.[0]?.id ?? null,
              selectedChannelId: null,
              channels: [],
            });
          } else {
            updateNodeData(nodeId, { connected: false });
          }
        },
        onError: () => {
          updateNodeData(nodeId, { connected: false });
        },
      }
    );
  };

  const handleGuildChange = (guildId: string) => {
    updateNodeData(nodeId, { selectedGuildId: guildId, selectedChannelId: null, channels: [] });
    const t = (d.token as string)?.trim();
    if (!t || !guildId) return;
    setFetchingChannels(true);
    botGetChannels.mutate(
      { data: { token: t, guildId } },
      {
        onSuccess: (res) => {
          const r = res as { success: boolean; channels?: Array<{ id: string; name: string }> };
          updateNodeData(nodeId, { channels: r.channels ?? [] });
          setFetchingChannels(false);
        },
        onError: () => setFetchingChannels(false),
      }
    );
  };

  const handleDisconnect = () => {
    setTokenInput("");
    updateNodeData(nodeId, {
      token: "",
      connected: false,
      botName: null,
      botAvatar: null,
      guilds: [],
      channels: [],
      selectedGuildId: null,
      selectedChannelId: null,
    });
  };

  const handleSend = () => {
    const t = (d.token as string)?.trim();
    const channelId = selectedChannelId;
    if (!t || !channelId || !payload) return;
    setSendStatus("sending");
    botSend.mutate(
      { data: { token: t, channelId, payload: payload as Record<string, unknown> } },
      {
        onSuccess: (res) => {
          const r = res as { success: boolean; message?: string | null };
          if (r.success) { setSendStatus("success"); setSendMsg("Message sent!"); }
          else { setSendStatus("error"); setSendMsg(r.message ?? "Failed to send"); }
          setTimeout(() => setSendStatus("idle"), 3000);
        },
        onError: () => { setSendStatus("error"); setSendMsg("Network error"); setTimeout(() => setSendStatus("idle"), 3000); },
      }
    );
  };

  const isValidating = botValidate.isPending;

  return (
    <div>
      {/* Connection status */}
      {connected ? (
        <div style={{
          padding: "10px 12px", borderRadius: 8, marginBottom: 14,
          background: "rgba(63,185,80,0.07)",
          border: "1px solid rgba(63,185,80,0.18)",
          display: "flex", alignItems: "center", gap: 10,
        }}>
          {botAvatar ? (
            <img src={botAvatar} alt="" style={{ width: 28, height: 28, borderRadius: "50%", flexShrink: 0 }} />
          ) : (
            <div style={{ width: 28, height: 28, borderRadius: "50%", background: "rgba(88,101,242,0.2)", flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Bot size={14} color="#818cf8" />
            </div>
          )}
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ color: "#3fb950", fontSize: 12, fontWeight: 600 }}>{botName ?? "Bot"}</div>
            <div style={{ color: "#3fb950", fontSize: 10, opacity: 0.7 }}>Connected</div>
          </div>
          <button
            onClick={handleDisconnect}
            title="Disconnect"
            style={{
              background: "rgba(248,81,73,0.1)", border: "1px solid rgba(248,81,73,0.2)",
              borderRadius: 6, color: "#f85149", cursor: "pointer",
              padding: "4px 8px", fontSize: 10, fontWeight: 600,
              display: "flex", alignItems: "center", gap: 4,
            }}
          >
            <X size={10} /> Disconnect
          </button>
        </div>
      ) : (
        <div style={fieldWrap}>
          <label style={labelStyle}>Bot Token</label>
          <div style={{ display: "flex", gap: 6 }}>
            <input
              type="password"
              value={tokenInput}
              onChange={(e) => setTokenInput(e.target.value)}
              placeholder="Bot token…"
              style={{ ...inputStyle, flex: 1 }}
              onFocus={focusBorder}
              onBlur={blurBorder}
              onKeyDown={(e) => { if (e.key === "Enter") handleConnect(); }}
            />
            <button
              onClick={handleConnect}
              disabled={isValidating || tokenInput.trim().length < 20}
              style={{
                display: "flex", alignItems: "center", gap: 5,
                background: "linear-gradient(135deg, #5865F2, #7c3aed)",
                border: "none", borderRadius: 8, color: "#fff",
                fontSize: 12, fontWeight: 600, padding: "7px 12px",
                cursor: isValidating ? "wait" : "pointer",
                opacity: tokenInput.trim().length < 20 ? 0.4 : 1,
                whiteSpace: "nowrap", flexShrink: 0,
                boxShadow: "0 2px 10px rgba(88,101,242,0.3)",
              }}
            >
              {isValidating ? <Loader2 size={12} style={{ animation: "spin 1s linear infinite" }} /> : <CheckCircle2 size={12} />}
              {isValidating ? "…" : "Connect"}
            </button>
          </div>
          {botValidate.isError || (botValidate.data && !(botValidate.data as { success: boolean }).success) ? (
            <div style={{ color: "#f85149", fontSize: 11, marginTop: 5, display: "flex", alignItems: "center", gap: 4 }}>
              <AlertCircle size={11} />
              {((botValidate.data as { message?: string | null } | undefined)?.message) ?? "Invalid token"}
            </div>
          ) : null}
          <div style={{ color: "#383838", fontSize: 10, marginTop: 4 }}>
            Token is not stored permanently — only used in this session
          </div>
        </div>
      )}

      {/* Guild selector */}
      {connected && guilds.length > 0 && (
        <div style={fieldWrap}>
          <label style={labelStyle}>Server</label>
          <select
            value={selectedGuildId ?? ""}
            onChange={(e) => handleGuildChange(e.target.value)}
            style={{
              ...inputStyle, appearance: "none",
              backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%2364748B' stroke-width='2'%3E%3Cpath d='M6 9l6 6 6-6'/%3E%3C/svg%3E")`,
              backgroundRepeat: "no-repeat", backgroundPosition: "right 8px center",
              paddingRight: 28, cursor: "pointer",
            }}
          >
            <option value="" disabled style={{ background: BG }}>Select a server…</option>
            {guilds.map((g) => (
              <option key={g.id} value={g.id} style={{ background: BG }}>{g.name}</option>
            ))}
          </select>
        </div>
      )}

      {/* Channel selector */}
      {connected && selectedGuildId && (
        <div style={fieldWrap}>
          <label style={{ ...labelStyle, display: "flex", alignItems: "center", gap: 6 }}>
            Channel
            {fetchingChannels && <Loader2 size={10} style={{ animation: "spin 1s linear infinite" }} color="#818cf8" />}
            {!fetchingChannels && channels.length > 0 && (
              <button
                onClick={() => handleGuildChange(selectedGuildId)}
                title="Refresh channels"
                style={{ background: "transparent", border: "none", cursor: "pointer", color: "#555", padding: 0, display: "flex", alignItems: "center" }}
              >
                <RefreshCw size={10} />
              </button>
            )}
          </label>
          {channels.length === 0 && !fetchingChannels ? (
            <button
              onClick={() => handleGuildChange(selectedGuildId)}
              style={{
                width: "100%", display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
                background: "rgba(88,101,242,0.08)", border: "1px dashed rgba(88,101,242,0.25)",
                borderRadius: 8, color: "#818cf8", fontSize: 12, padding: "8px",
                cursor: "pointer",
              }}
            >
              <RefreshCw size={12} /> Load Channels
            </button>
          ) : (
            <select
              value={selectedChannelId ?? ""}
              onChange={(e) => updateNodeData(nodeId, { selectedChannelId: e.target.value })}
              disabled={fetchingChannels}
              style={{
                ...inputStyle, appearance: "none",
                backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%2364748B' stroke-width='2'%3E%3Cpath d='M6 9l6 6 6-6'/%3E%3C/svg%3E")`,
                backgroundRepeat: "no-repeat", backgroundPosition: "right 8px center",
                paddingRight: 28, cursor: "pointer",
              }}
            >
              <option value="" disabled style={{ background: BG }}>Select a channel…</option>
              {channels.map((c) => (
                <option key={c.id} value={c.id} style={{ background: BG }}>#{c.name}</option>
              ))}
            </select>
          )}
        </div>
      )}

      {/* Send button */}
      {connected && selectedChannelId && (
        <div style={{ marginTop: 4 }}>
          <button
            onClick={handleSend}
            disabled={sendStatus === "sending" || !payload}
            style={{
              width: "100%", display: "flex", alignItems: "center", justifyContent: "center", gap: 7,
              background: sendStatus === "success"
                ? "rgba(63,185,80,0.15)"
                : "linear-gradient(135deg, #5865F2, #7c3aed)",
              border: sendStatus === "success" ? "1px solid rgba(63,185,80,0.25)" : "none",
              borderRadius: 8, color: sendStatus === "success" ? "#3fb950" : "#fff",
              fontSize: 13, fontWeight: 700, padding: "10px 0",
              cursor: sendStatus === "sending" ? "wait" : "pointer",
              boxShadow: sendStatus !== "success" ? "0 2px 14px rgba(88,101,242,0.35)" : "none",
              transition: "all 0.15s",
            }}
          >
            {sendStatus === "sending" ? <Loader2 size={14} style={{ animation: "spin 1s linear infinite" }} /> : <Send size={14} />}
            {sendStatus === "sending" ? "Sending…" : sendStatus === "success" ? "Sent ✓" : "Send Message via Bot"}
          </button>
          {sendStatus !== "idle" && sendMsg && (
            <div style={{
              marginTop: 8, padding: "7px 10px", borderRadius: 7,
              background: sendStatus === "success" ? "rgba(63,185,80,0.08)" : "rgba(248,81,73,0.08)",
              border: sendStatus === "success" ? "1px solid rgba(63,185,80,0.18)" : "1px solid rgba(248,81,73,0.18)",
              color: sendStatus === "success" ? "#3fb950" : "#f85149",
              fontSize: 12,
            }}>
              {sendMsg}
            </div>
          )}
          <div style={{ color: "#383838", fontSize: 10, marginTop: 6, textAlign: "center" }}>
            Sends your current canvas design to #{channels.find(c => c.id === selectedChannelId)?.name}
          </div>
        </div>
      )}

      <style>{`@keyframes spin { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }`}</style>
    </div>
  );
}

export function PropertiesPanel() {
  const selectedNodeId = useGraphStore((s) => s.selectedNodeId);
  const nodes = useGraphStore((s) => s.nodes);
  const edges = useGraphStore((s) => s.edges);
  const updateNodeData = useGraphStore((s) => s.updateNodeData);
  const removeNode = useGraphStore((s) => s.removeNode);
  const reorderChildEdges = useGraphStore((s) => s.reorderChildEdges);

  const node = nodes.find((n) => n.id === selectedNodeId);

  if (!node) {
    return (
      <div style={{
        flex: 1,
        display: "flex", flexDirection: "column",
        alignItems: "center", justifyContent: "center",
        gap: 10, padding: 24,
      }}>
        <div style={{
          width: 44, height: 44, borderRadius: 12,
          background: "rgba(88,101,242,0.08)",
          border: "1px solid rgba(88,101,242,0.15)",
          display: "flex", alignItems: "center", justifyContent: "center",
        }}>
          <Hash size={20} color="#5865F2" strokeWidth={1.5} />
        </div>
        <div style={{ color: MUTED, fontSize: 12, textAlign: "center", lineHeight: 1.6 }}>
          Select a node on the canvas<br />to edit its properties
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
    (e.currentTarget as HTMLElement).style.borderColor = BORDER;
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
              width: 36, height: 36,
              border: `1px solid ${BORDER}`,
              borderRadius: 6, cursor: "pointer",
              background: "none", padding: 2,
            }}
          />
          <div style={{
            flex: 1, background: SURFACE, border: `1px solid ${BORDER}`,
            borderRadius: 6, padding: "6px 9px",
          }}>
            <span style={{ color: TEXT, fontSize: 12, fontFamily: "monospace" }}>{hex}</span>
          </div>
          {val != null && (
            <button
              onClick={() => updateNodeData(node.id, { [key]: null })}
              title="Clear color"
              style={{
                background: "rgba(248,81,73,0.1)", border: "1px solid rgba(248,81,73,0.2)",
                borderRadius: 5, color: "#f85149", fontSize: 11,
                padding: "5px 8px", cursor: "pointer",
              }}
            >×</button>
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
          width: 36, height: 20, borderRadius: 10,
          background: d[key] ? "#5865F2" : "rgba(255,255,255,0.08)",
          border: "1px solid rgba(255,255,255,0.08)",
          position: "relative", cursor: "pointer",
          transition: "background 0.15s", flexShrink: 0,
        }}
      >
        <div style={{
          position: "absolute", top: 2, left: d[key] ? 17 : 2,
          width: 14, height: 14, borderRadius: "50%",
          background: "#fff", transition: "left 0.15s",
          boxShadow: "0 1px 3px rgba(0,0,0,0.3)",
        }} />
      </div>
      <label
        style={{ color: TEXT, fontSize: 12, fontWeight: 500, cursor: "pointer" }}
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
          ...inputStyle, appearance: "none",
          backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%2364748B' stroke-width='2'%3E%3Cpath d='M6 9l6 6 6-6'/%3E%3C/svg%3E")`,
          backgroundRepeat: "no-repeat", backgroundPosition: "right 8px center",
          paddingRight: 28, cursor: "pointer",
        }}
      >
        {options.map((o) => (
          <option key={o} value={o} style={{ background: BG }}>{o}</option>
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
            <div key={i} style={{ background: SURFACE, border: `1px solid ${BORDER}`, borderRadius: 6, padding: "8px 10px", display: "flex", flexDirection: "column", gap: 5 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <input type="text" value={opt.label} placeholder="Label" onChange={(e) => updateOption(i, { label: e.target.value })} style={{ ...inputStyle, padding: "3px 6px", fontSize: 11 }} onFocus={focusBorder} onBlur={blurBorder} />
                </div>
                <button onClick={() => removeOption(i)} style={{ background: "rgba(248,81,73,0.1)", border: "1px solid rgba(248,81,73,0.2)", borderRadius: 4, color: "#f85149", cursor: "pointer", padding: "3px 5px", display: "flex", alignItems: "center", flexShrink: 0 }}>
                  <X size={10} />
                </button>
              </div>
              <input type="text" value={opt.value} placeholder="Value (unique key)" onChange={(e) => updateOption(i, { value: e.target.value })} style={{ ...inputStyle, padding: "3px 6px", fontSize: 11, color: MUTED }} onFocus={focusBorder} onBlur={blurBorder} />
              <input type="text" value={opt.description ?? ""} placeholder="Description (optional)" onChange={(e) => updateOption(i, { description: e.target.value })} style={{ ...inputStyle, padding: "3px 6px", fontSize: 10, color: FAINT }} onFocus={focusBorder} onBlur={blurBorder} />
              <label style={{ display: "flex", alignItems: "center", gap: 6, cursor: "pointer" }}>
                <input type="checkbox" checked={!!opt.default} onChange={(e) => updateOption(i, { default: e.target.checked })} style={{ accentColor: "#5865F2" }} />
                <span style={{ color: MUTED, fontSize: 10 }}>Default selected</span>
              </label>
            </div>
          ))}
          {opts.length < 25 && (
            <button onClick={addOption} style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 5, padding: "6px", background: "rgba(88,101,242,0.08)", border: "1px dashed rgba(88,101,242,0.25)", borderRadius: 6, color: "#818cf8", fontSize: 11, cursor: "pointer" }}>
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
    const addField = () => updateNodeData(node.id, { fields: [...fields, { name: "Field Name", value: "Field value", inline: false }] });
    const removeField = (i: number) => updateNodeData(node.id, { fields: fields.filter((_, idx) => idx !== i) });
    return (
      <div style={fieldWrap}>
        <label style={labelStyle}>Fields ({fields.length}/25)</label>
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          {fields.map((f, i) => (
            <div key={i} style={{ background: SURFACE, border: `1px solid ${BORDER}`, borderRadius: 6, padding: "8px 10px", display: "flex", flexDirection: "column", gap: 5 }}>
              <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                <input type="text" value={f.name} placeholder="Name" onChange={(e) => updateField(i, { name: e.target.value })} style={{ ...inputStyle, padding: "3px 6px", fontSize: 11, flex: 1 }} onFocus={focusBorder} onBlur={blurBorder} />
                <button onClick={() => removeField(i)} style={{ background: "rgba(248,81,73,0.1)", border: "1px solid rgba(248,81,73,0.2)", borderRadius: 4, color: "#f85149", cursor: "pointer", padding: "3px 5px", display: "flex", alignItems: "center" }}>
                  <X size={10} />
                </button>
              </div>
              <textarea value={f.value} placeholder="Value" onChange={(e) => updateField(i, { value: e.target.value })} rows={2} style={{ ...inputStyle, padding: "3px 6px", fontSize: 11, resize: "vertical" }} onFocus={focusBorder} onBlur={blurBorder} />
              <label style={{ display: "flex", alignItems: "center", gap: 6, cursor: "pointer" }}>
                <input type="checkbox" checked={!!f.inline} onChange={(e) => updateField(i, { inline: e.target.checked })} style={{ accentColor: "#5865F2" }} />
                <span style={{ color: MUTED, fontSize: 10 }}>Inline</span>
              </label>
            </div>
          ))}
          {fields.length < 25 && (
            <button onClick={addField} style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 5, padding: "6px", background: "rgba(88,101,242,0.08)", border: "1px dashed rgba(88,101,242,0.25)", borderRadius: 6, color: "#818cf8", fontSize: 11, cursor: "pointer" }}>
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

  const childOrder = () => {
    const childEdges = edges.filter((e) => e.source === node.id);
    if (childEdges.length < 2) return null;
    const childNodes = childEdges
      .map((e) => nodes.find((n) => n.id === e.target))
      .filter(Boolean) as typeof nodes;
    return (
      <div style={fieldWrap}>
        <label style={labelStyle}>Child Order</label>
        <div style={{ display: "flex", flexDirection: "column", gap: 3 }}>
          {childNodes.map((cn, i) => {
            const cMeta = TYPE_META[cn.data.componentType as number];
            return (
              <div key={cn.id} style={{ display: "flex", alignItems: "center", gap: 6, background: SURFACE, border: `1px solid ${BORDER}`, borderRadius: 6, padding: "5px 8px" }}>
                <span style={{ color: cMeta?.color ?? "#888", fontSize: 10 }}>{cMeta?.icon}</span>
                <span style={{ color: "#888", fontSize: 11, flex: 1, overflow: "hidden", textOverflow: "ellipsis" }}>{cMeta?.label ?? "Node"}</span>
                <div style={{ display: "flex", flexDirection: "column", gap: 1 }}>
                  <button disabled={i === 0} onClick={() => { const ids = childNodes.map(n => n.id); [ids[i - 1], ids[i]] = [ids[i], ids[i - 1]]; reorderChildEdges(node.id, ids); }} style={{ background: "transparent", border: "none", cursor: i === 0 ? "default" : "pointer", color: i === 0 ? "#333" : "#888", padding: "1px 2px", display: "flex" }}>
                    <ChevronUp size={10} />
                  </button>
                  <button disabled={i === childNodes.length - 1} onClick={() => { const ids = childNodes.map(n => n.id); [ids[i], ids[i + 1]] = [ids[i + 1], ids[i]]; reorderChildEdges(node.id, ids); }} style={{ background: "transparent", border: "none", cursor: i === childNodes.length - 1 ? "default" : "pointer", color: i === childNodes.length - 1 ? "#333" : "#888", padding: "1px 2px", display: "flex" }}>
                    <ChevronDown size={10} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  const renderFields = () => {
    if (d.componentType === -1) {
      return <BotProperties nodeId={node.id} d={d as Record<string, unknown>} updateNodeData={updateNodeData as (id: string, data: Record<string, unknown>) => void} />;
    }
    switch (d.componentType) {
      case 17:
        return (<>{colorField("Accent Color", "accent_color")}{checkboxField("Spoiler (blur content)", "spoiler")}{childOrder()}</>);
      case 9:
        return childOrder();
      case 10:
        return textareaField("Content (Markdown)", "content", "Enter markdown text…");
      case 11:
        return (<>{textField("Image URL", "url", "https://example.com/image.png")}{textField("Alt Description", "description", "Describe the image…")}</>);
      case 12: {
        const items = (d.items as { url: string }[]) ?? [];
        return (
          <div style={fieldWrap}>
            <label style={labelStyle}>Image URLs (one per line)</label>
            <textarea
              value={items.map((i) => i.url).join("\n")}
              placeholder={"https://example.com/image1.png\nhttps://example.com/image2.png"}
              onChange={(e) => {
                const urls = e.target.value.split("\n").map((u) => ({ url: u.trim() })).filter((i) => i.url);
                updateNodeData(node.id, { items: urls });
              }}
              rows={5}
              data-testid="prop-items"
              style={{ ...inputStyle, resize: "vertical", lineHeight: 1.6 }}
              onFocus={focusBorder}
              onBlur={blurBorder}
            />
            <div style={{ color: FAINT, fontSize: 10, marginTop: 4 }}>{items.length} image{items.length !== 1 ? "s" : ""} added</div>
          </div>
        );
      }
      case 14:
        return (<>{selectField("Spacing", "spacing", ["sm", "md", "lg"])}{checkboxField("Show Divider Line", "divider")}</>);
      case 1:
        return childOrder();
      case 2:
        return (<>{textField("Label", "label", "Button label…")}{textField("Emoji", "emoji", "😀 or :emoji_name:")}{selectField("Style", "style", ["Primary", "Secondary", "Success", "Danger", "Link", "Premium"])}{textField("Custom ID", "custom_id", "my_button_id")}{textField("URL (Link style only)", "url", "https://example.com")}{textField("SKU ID (Premium style only)", "sku_id", "1234567890")}{checkboxField("Disabled", "disabled")}</>);
      case 3:
        return (<>{textField("Custom ID", "custom_id", "my_select_id")}{textField("Placeholder", "placeholder", "Make a selection…")}{selectValuesFields()}{selectOptionsField()}{checkboxField("Disabled", "disabled")}</>);
      case 4:
        return (<>{textField("Label", "label", "Input label…")}{textField("Custom ID", "custom_id", "my_input_id")}{selectField("Style", "style", ["Short", "Paragraph"])}{textField("Placeholder", "placeholder", "Enter text…")}{textField("Pre-filled Value", "value", "")}{numberField("Min Length", "min_length", 0, 4000)}{numberField("Max Length", "max_length", 1, 4000)}{checkboxField("Required", "required")}</>);
      case 5:
      case 6:
      case 7:
      case 8:
        return (<>{textField("Custom ID", "custom_id", "my_select_id")}{textField("Placeholder", "placeholder", "Select…")}{selectValuesFields()}{checkboxField("Disabled", "disabled")}</>);
      case 0:
        return (<>{textField("Title", "title", "Embed title…")}{textareaField("Description", "description", "Embed description…")}{colorField("Accent Color", "color")}{textField("URL (title link)", "url", "https://example.com")}{textField("Author Name", "author", "Author…")}{textField("Footer Text", "footer", "Footer…")}{textField("Image URL", "imageUrl", "https://example.com/image.png")}{textField("Thumbnail URL", "thumbnailUrl", "https://example.com/thumb.png")}{checkboxField("Show Timestamp", "timestamp")}{embedFieldsEditor()}</>);
      default:
        return <div style={{ color: MUTED, fontSize: 12 }}>No editable properties.</div>;
    }
  };

  return (
    <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
      {/* Node header */}
      <div style={{
        padding: "12px 14px 10px",
        borderBottom: `1px solid rgba(255,255,255,0.05)`,
        flexShrink: 0,
        background: `linear-gradient(90deg, ${meta?.color ?? "#5865F2"}08 0%, transparent 100%)`,
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
          <div style={{
            width: 28, height: 28, borderRadius: 8,
            background: `linear-gradient(135deg, ${meta?.color ?? "#5865F2"}25, ${meta?.color ?? "#5865F2"}10)`,
            border: `1px solid ${meta?.color ?? "#5865F2"}20`,
            display: "flex", alignItems: "center", justifyContent: "center",
            color: meta?.color ?? "#5865F2", flexShrink: 0,
          }}>
            {meta?.icon ?? <Hash size={14} />}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ color: TEXT, fontSize: 13, fontWeight: 600 }}>
              {meta?.label ?? "Node"}
            </div>
            <div style={{ color: "#484848", fontSize: 10 }}>
              {d.componentType === -1 ? "Advanced · Bot" : `Component type ${d.componentType}`}
            </div>
          </div>
          <button
            onClick={() => removeNode(node.id)}
            title="Delete node"
            style={{
              background: "rgba(248,81,73,0.08)", border: "1px solid rgba(248,81,73,0.15)",
              borderRadius: 6, color: "#f85149", cursor: "pointer",
              padding: "5px 6px", display: "flex", alignItems: "center",
              transition: "background 0.12s",
            }}
            onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = "rgba(248,81,73,0.15)"; }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = "rgba(248,81,73,0.08)"; }}
          >
            <Trash2 size={13} />
          </button>
        </div>
        {PARENT_COMPONENT_TYPES.has(d.componentType as number) && (
          <div style={{ color: "#383838", fontSize: 10, marginTop: 2 }}>
            {ALLOWED_CHILDREN[node.type ?? ""]?.join(", ")} children allowed
          </div>
        )}
      </div>

      {/* Fields */}
      <div style={{ flex: 1, overflowY: "auto", padding: "14px 14px 20px" }}>
        {renderFields()}
      </div>
    </div>
  );
}
