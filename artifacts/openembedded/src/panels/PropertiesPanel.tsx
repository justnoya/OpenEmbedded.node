import { useState } from "react";
import { useGraphStore } from "@/lib/graphStore";
import { usePreviewStore } from "@/lib/previewStore";
import { ALLOWED_CHILDREN, INTERACTION_MODES, getInteractionModeMeta, type InteractionMode } from "@/lib/connectionRules";
import { useBotValidate, useBotGetChannels, useBotSend, useOpenBotGuilds, useOpenBotChannels, useOpenBotSend } from "@workspace/api-client-react";
import { compileGraph } from "@/lib/compiler";
import {
  Package, LayoutTemplate, FileText, ImageIcon, GalleryHorizontalEnd,
  Minus, Rows3, PointerIcon, ListFilter, UserRound, ShieldCheck,
  AtSign, Hash, FormInput, MessageSquareCode, Trash2,
  Plus, X, ChevronUp, ChevronDown, Bot, Sparkles,
  CheckCircle2, AlertCircle, Loader2, Send, RefreshCw, Zap, Circle,
  ArrowRight, Info,
} from "lucide-react";
import { ReactNode } from "react";

const TYPE_META: Record<number, { label: string; icon: ReactNode; color: string }> = {
  17:   { label: "Container",          icon: <Package size={14} />,              color: "#8b5cf6" },
  9:    { label: "Section",            icon: <LayoutTemplate size={14} />,       color: "#10b981" },
  10:   { label: "Text Display",       icon: <FileText size={14} />,             color: "#3b82f6" },
  11:   { label: "Thumbnail",          icon: <ImageIcon size={14} />,            color: "#f59e0b" },
  12:   { label: "Media Gallery",      icon: <GalleryHorizontalEnd size={14} />, color: "#ec4899" },
  14:   { label: "Separator",          icon: <Minus size={14} />,                color: "#6b7280" },
  1:    { label: "Action Row",         icon: <Rows3 size={14} />,                color: "#14b8a6" },
  2:    { label: "Button",             icon: <PointerIcon size={14} />,          color: "#5865F2" },
  3:    { label: "String Select",      icon: <ListFilter size={14} />,           color: "#f97316" },
  4:    { label: "Text Input",         icon: <FormInput size={14} />,            color: "#64748b" },
  5:    { label: "User Select",        icon: <UserRound size={14} />,            color: "#06b6d4" },
  6:    { label: "Role Select",        icon: <ShieldCheck size={14} />,          color: "#a855f7" },
  7:    { label: "Mentionable Select", icon: <AtSign size={14} />,               color: "#ec4899" },
  8:    { label: "Channel Select",     icon: <Hash size={14} />,                 color: "#22c55e" },
  0:    { label: "Embed (V1)",         icon: <MessageSquareCode size={14} />,    color: "#f59e0b" },
  [-1]: { label: "Bot",               icon: <Bot size={14} />,                  color: "#5865F2" },
  [-2]: { label: "OpenEmbedded",       icon: <Sparkles size={14} />,             color: "#6366f1" },
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

// ─────────────────────────────────────────────────────────────
//  BotProperties (unchanged)
// ─────────────────────────────────────────────────────────────
function BotProperties({ nodeId, d, updateNodeData }: {
  nodeId: string;
  d: Record<string, unknown>;
  updateNodeData: (id: string, data: Record<string, unknown>) => void;
}) {
  const payload = usePreviewStore((s) => s.payload);
  const isValid = usePreviewStore((s) => s.isValid);
  const compileErrors = usePreviewStore((s) => s.errors);
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
              token: t, connected: true, botName: r.botName ?? null,
              botAvatar: r.botAvatar ?? null, guilds: r.guilds ?? [],
              selectedGuildId: r.guilds?.[0]?.id ?? null,
              selectedChannelId: null, channels: [],
            });
          } else {
            updateNodeData(nodeId, { connected: false });
          }
        },
        onError: () => updateNodeData(nodeId, { connected: false }),
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
      token: "", connected: false, botName: null, botAvatar: null,
      guilds: [], channels: [], selectedGuildId: null, selectedChannelId: null,
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
          else { setSendStatus("error"); setSendMsg(r.message ?? "Discord rejected the message — check your bot token, channel selection, and try again."); }
          setTimeout(() => setSendStatus("idle"), 4000);
        },
        onError: () => { setSendStatus("error"); setSendMsg("Couldn't reach Discord — check your internet connection and try again."); setTimeout(() => setSendStatus("idle"), 4000); },
      }
    );
  };

  const isValidating = botValidate.isPending;

  return (
    <div>
      {connected ? (
        <div style={{
          padding: "10px 12px", borderRadius: 8, marginBottom: 14,
          background: "rgba(63,185,80,0.07)", border: "1px solid rgba(63,185,80,0.18)",
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
          <button onClick={handleDisconnect} title="Disconnect" style={{ background: "rgba(248,81,73,0.1)", border: "1px solid rgba(248,81,73,0.2)", borderRadius: 6, color: "#f85149", cursor: "pointer", padding: "4px 8px", fontSize: 10, fontWeight: 600, display: "flex", alignItems: "center", gap: 4 }}>
            <X size={10} /> Disconnect
          </button>
        </div>
      ) : (
        <div style={fieldWrap}>
          <label style={labelStyle}>Bot Token</label>
          <div style={{ display: "flex", gap: 6 }}>
            <input type="password" value={tokenInput} onChange={(e) => setTokenInput(e.target.value)} placeholder="Bot token…" style={{ ...inputStyle, flex: 1 }} onFocus={focusBorder} onBlur={blurBorder} onKeyDown={(e) => { if (e.key === "Enter") handleConnect(); }} />
            <button onClick={handleConnect} disabled={isValidating || tokenInput.trim().length < 20} style={{ display: "flex", alignItems: "center", gap: 5, background: "linear-gradient(135deg, #5865F2, #7c3aed)", border: "none", borderRadius: 8, color: "#fff", fontSize: 12, fontWeight: 600, padding: "7px 12px", cursor: isValidating ? "wait" : "pointer", opacity: tokenInput.trim().length < 20 ? 0.4 : 1, whiteSpace: "nowrap", flexShrink: 0, boxShadow: "0 2px 10px rgba(88,101,242,0.3)" }}>
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

      {connected && guilds.length > 0 && (
        <div style={fieldWrap}>
          <label style={labelStyle}>Server</label>
          <select value={selectedGuildId ?? ""} onChange={(e) => handleGuildChange(e.target.value)} style={{ ...inputStyle, appearance: "none", backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%2364748B' stroke-width='2'%3E%3Cpath d='M6 9l6 6 6-6'/%3E%3C/svg%3E")`, backgroundRepeat: "no-repeat", backgroundPosition: "right 8px center", paddingRight: 28, cursor: "pointer" }}>
            <option value="" disabled style={{ background: BG }}>Select a server…</option>
            {guilds.map((g) => <option key={g.id} value={g.id} style={{ background: BG }}>{g.name}</option>)}
          </select>
        </div>
      )}

      {connected && selectedGuildId && (
        <div style={fieldWrap}>
          <label style={{ ...labelStyle, display: "flex", alignItems: "center", gap: 6 }}>
            Channel
            {fetchingChannels && <Loader2 size={10} style={{ animation: "spin 1s linear infinite" }} color="#818cf8" />}
            {!fetchingChannels && channels.length > 0 && (
              <button onClick={() => handleGuildChange(selectedGuildId)} title="Refresh channels" style={{ background: "transparent", border: "none", cursor: "pointer", color: "#555", padding: 0, display: "flex", alignItems: "center" }}>
                <RefreshCw size={10} />
              </button>
            )}
          </label>
          {channels.length === 0 && !fetchingChannels ? (
            <button onClick={() => handleGuildChange(selectedGuildId)} style={{ width: "100%", display: "flex", alignItems: "center", justifyContent: "center", gap: 6, background: "rgba(88,101,242,0.08)", border: "1px dashed rgba(88,101,242,0.25)", borderRadius: 8, color: "#818cf8", fontSize: 12, padding: "8px", cursor: "pointer" }}>
              <RefreshCw size={12} /> Load Channels
            </button>
          ) : (
            <select value={selectedChannelId ?? ""} onChange={(e) => updateNodeData(nodeId, { selectedChannelId: e.target.value })} disabled={fetchingChannels} style={{ ...inputStyle, appearance: "none", backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%2364748B' stroke-width='2'%3E%3Cpath d='M6 9l6 6 6-6'/%3E%3C/svg%3E")`, backgroundRepeat: "no-repeat", backgroundPosition: "right 8px center", paddingRight: 28, cursor: "pointer" }}>
              <option value="" disabled style={{ background: BG }}>Select a channel…</option>
              {channels.map((c) => <option key={c.id} value={c.id} style={{ background: BG }}>#{c.name}</option>)}
            </select>
          )}
        </div>
      )}

      {connected && selectedChannelId && (
        <div style={{ marginTop: 4 }}>
          {!isValid && compileErrors.length > 0 && (
            <div style={{ marginBottom: 8, display: "flex", flexDirection: "column", gap: 4 }}>
              {compileErrors.map((e, i) => (
                <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: 6 }}>
                  <AlertCircle size={11} color="#f85149" style={{ marginTop: 1, flexShrink: 0 }} />
                  <span style={{ color: "#f85149", fontSize: 11, lineHeight: 1.4 }}>{e.message}</span>
                </div>
              ))}
            </div>
          )}
          <button onClick={handleSend} disabled={sendStatus === "sending" || !payload || !isValid} style={{ width: "100%", display: "flex", alignItems: "center", justifyContent: "center", gap: 7, background: sendStatus === "success" ? "rgba(63,185,80,0.15)" : "#5865F2", border: sendStatus === "success" ? "1px solid rgba(63,185,80,0.25)" : "none", borderRadius: 8, color: sendStatus === "success" ? "#3fb950" : "#fff", fontSize: 13, fontWeight: 700, padding: "10px 0", cursor: sendStatus === "sending" ? "wait" : "pointer", transition: "opacity 0.15s", opacity: !payload || !isValid || sendStatus === "sending" ? 0.45 : 1 }}>
            {sendStatus === "sending" ? <Loader2 size={14} style={{ animation: "spin 1s linear infinite" }} /> : <Send size={14} />}
            {sendStatus === "sending" ? "Sending…" : sendStatus === "success" ? "Sent ✓" : "Send Message via Bot"}
          </button>
          {sendStatus !== "idle" && sendMsg && (
            <div style={{ marginTop: 8, padding: "7px 10px", borderRadius: 7, background: sendStatus === "success" ? "rgba(63,185,80,0.08)" : "rgba(248,81,73,0.08)", border: sendStatus === "success" ? "1px solid rgba(63,185,80,0.18)" : "1px solid rgba(248,81,73,0.18)", color: sendStatus === "success" ? "#3fb950" : "#f85149", fontSize: 12 }}>
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

// ─────────────────────────────────────────────────────────────
//  OpenEmbeddedProperties
// ─────────────────────────────────────────────────────────────
function OpenEmbeddedProperties({ nodeId, d, updateNodeData }: {
  nodeId: string;
  d: Record<string, unknown>;
  updateNodeData: (id: string, data: Record<string, unknown>) => void;
}) {
  const nodes = useGraphStore((s) => s.nodes);
  const edges = useGraphStore((s) => s.edges);
  const updateEdgeData = useGraphStore((s) => s.updateEdgeData);
  const payload = usePreviewStore((s) => s.payload);

  const [sendStatus, setSendStatus] = useState<"idle" | "sending" | "success" | "error">("idle");
  const [sendMsg, setSendMsg] = useState("");
  const [fetchingChannels, setFetchingChannels] = useState(false);

  const guildsQuery = useOpenBotGuilds();
  const openBotChannelsMutation = useOpenBotChannels();
  const openBotSendMutation = useOpenBotSend();

  type GuildEntry = { id: string; name: string; icon?: string | null };
  type ChannelEntry = { id: string; name: string };

  const guildsData = guildsQuery.data as { success?: boolean; guilds?: GuildEntry[]; inviteUrl?: string | null; message?: string | null } | undefined;
  const guilds: GuildEntry[] = guildsData?.guilds ?? [];
  const inviteUrl: string | null = guildsData?.inviteUrl ?? null;
  const botNotConfigured = guildsQuery.isSuccess && guildsData?.success === false;

  const selectedGuildId = d.selectedGuildId as string | null;
  const selectedChannelId = d.selectedChannelId as string | null;
  const channels: ChannelEntry[] = (d.channels as ChannelEntry[]) ?? [];

  const interactionEdges = edges.filter((e) => e.type === "interaction");

  const getNodeLabel = (id: string) => {
    const n = nodes.find((node) => node.id === id);
    if (!n) return "Unknown";
    const ct = n.data.componentType as number;
    return TYPE_META[ct]?.label ?? n.type ?? "Node";
  };

  const getSourceLabel = (id: string) => {
    const n = nodes.find((node) => node.id === id);
    if (!n) return "Component";
    const label = (n.data.label as string) ?? (n.data.placeholder as string) ?? "";
    const ct = n.data.componentType as number;
    const typeName = TYPE_META[ct]?.label ?? n.type ?? "Node";
    return label ? `${typeName}: ${label}` : typeName;
  };

  const handleGuildChange = (guildId: string) => {
    updateNodeData(nodeId, { selectedGuildId: guildId, selectedChannelId: null, channels: [] });
    if (!guildId) return;
    setFetchingChannels(true);
    openBotChannelsMutation.mutate(
      { data: { guildId } },
      {
        onSuccess: (res) => {
          const r = res as { success: boolean; channels?: ChannelEntry[] };
          updateNodeData(nodeId, { channels: r.channels ?? [] });
          setFetchingChannels(false);
        },
        onError: () => setFetchingChannels(false),
      }
    );
  };

  /** Compile interaction flows to register with the bot on send. */
  function buildFlows() {
    const structuralEdges = edges.filter((e) => e.type !== "interaction" && e.type !== "send");
    return interactionEdges.map((edge) => {
      const sourceNode = nodes.find((n) => n.id === edge.source);
      const customId = (sourceNode?.data?.custom_id as string) ?? `btn_${edge.source}`;
      const mode = ((edge.data as Record<string, unknown>)?.mode as string) ?? "send_new";
      // Collect the subtree rooted at the interaction target
      const visited = new Set<string>();
      const queue = [edge.target];
      while (queue.length) {
        const id = queue.shift()!;
        if (visited.has(id)) continue;
        visited.add(id);
        for (const e of structuralEdges) {
          if (e.source === id) queue.push(e.target);
        }
      }
      const subNodes = nodes.filter((n) => visited.has(n.id));
      const subEdges = structuralEdges.filter((e) => visited.has(e.source) && visited.has(e.target));
      const { payload: responsePayload } = compileGraph(subNodes, subEdges);
      return { customId, mode, responsePayload: responsePayload as Record<string, unknown> };
    });
  }

  const handleSend = () => {
    if (!selectedChannelId || !payload) return;
    setSendStatus("sending");
    const flows = buildFlows();
    openBotSendMutation.mutate(
      { data: { channelId: selectedChannelId, payload: payload as Record<string, unknown>, flows } },
      {
        onSuccess: (res) => {
          const r = res as { success: boolean; message?: string | null };
          if (r.success) {
            setSendStatus("success");
            setSendMsg("Message sent via OpenEmbedded Bot!");
          } else {
            setSendStatus("error");
            setSendMsg(r.message ?? "Discord rejected the message — check the channel selection.");
          }
          setTimeout(() => setSendStatus("idle"), 4000);
        },
        onError: () => {
          setSendStatus("error");
          setSendMsg("Couldn't reach the OpenEmbedded Bot — check your connection.");
          setTimeout(() => setSendStatus("idle"), 4000);
        },
      }
    );
  };

  const selectStyle: React.CSSProperties = {
    ...inputStyle, appearance: "none",
    backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%2364748B' stroke-width='2'%3E%3Cpath d='M6 9l6 6 6-6'/%3E%3C/svg%3E")`,
    backgroundRepeat: "no-repeat", backgroundPosition: "right 8px center", paddingRight: 28, cursor: "pointer",
  };

  return (
    <div>
      {/* Status row */}
      <div style={{
        padding: "10px 12px", borderRadius: 8, marginBottom: 14,
        background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)",
        display: "flex", alignItems: "center", gap: 10,
      }}>
        <div style={{
          width: 28, height: 28, borderRadius: "50%",
          background: "rgba(129,140,248,0.12)", border: "1px solid rgba(129,140,248,0.18)",
          display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
        }}>
          {guildsQuery.isLoading
            ? <Loader2 size={13} color="#555" style={{ animation: "spin 1s linear infinite" }} />
            : <Sparkles size={13} color="#818cf8" />}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ color: "#d0d0d0", fontSize: 12, fontWeight: 600 }}>OpenEmbedded Bot</div>
          <div style={{ color: "#484848", fontSize: 10, marginTop: 1 }}>
            {guildsQuery.isLoading
              ? "Connecting…"
              : botNotConfigured
                ? "Not available"
                : guilds.length > 0
                  ? `${guilds.length} server${guilds.length !== 1 ? "s" : ""} available`
                  : "No servers yet"}
          </div>
        </div>
        {guildsQuery.isSuccess && !botNotConfigured && (
          <div style={{ width: 7, height: 7, borderRadius: "50%", background: "#3fb950", flexShrink: 0 }} />
        )}
      </div>

      {/* Not configured */}
      {botNotConfigured && (
        <div style={{ marginBottom: 14, display: "flex", alignItems: "flex-start", gap: 7 }}>
          <AlertCircle size={12} color="#484848" style={{ marginTop: 1, flexShrink: 0 }} />
          <div style={{ color: "#484848", fontSize: 11, lineHeight: 1.5 }}>
            Bot not deployed. Set <code style={{ color: "#606060", fontSize: 10 }}>OPENBOT_API_URL</code> and <code style={{ color: "#606060", fontSize: 10 }}>OPENBOT_API_KEY</code> on the server.
          </div>
        </div>
      )}

      {/* Not in any server yet */}
      {!botNotConfigured && guildsQuery.isSuccess && guilds.length === 0 && (
        <div style={{ marginBottom: 14 }}>
          <div style={{ color: "#484848", fontSize: 11, marginBottom: 8, lineHeight: 1.5 }}>
            Add the bot to your Discord server, then refresh.
          </div>
          <div style={{ display: "flex", gap: 6 }}>
            {inviteUrl && (
              <a
                href={inviteUrl}
                target="_blank"
                rel="noreferrer"
                style={{
                  flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 5,
                  background: "#5865F2", border: "none", borderRadius: 7, color: "#fff",
                  fontSize: 11, fontWeight: 600, padding: "7px 0", textDecoration: "none",
                }}
              >
                Add to Server
              </a>
            )}
            <button
              onClick={() => guildsQuery.refetch()}
              style={{
                flex: inviteUrl ? "0 0 auto" : 1,
                display: "flex", alignItems: "center", justifyContent: "center", gap: 5,
                background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.09)",
                borderRadius: 7, color: "#606060", fontSize: 11, padding: "7px 10px", cursor: "pointer",
              }}
            >
              <RefreshCw size={10} /> Refresh
            </button>
          </div>
        </div>
      )}

      {/* Server picker */}
      {guilds.length > 0 && (
        <div style={fieldWrap}>
          <label style={{ ...labelStyle, display: "flex", alignItems: "center", gap: 6 }}>
            Server
            <button
              onClick={() => guildsQuery.refetch()}
              title="Refresh"
              style={{ background: "transparent", border: "none", cursor: "pointer", color: "#444", padding: 0, display: "flex", alignItems: "center" }}
            >
              <RefreshCw size={9} />
            </button>
          </label>
          <select
            value={selectedGuildId ?? ""}
            onChange={(e) => handleGuildChange(e.target.value)}
            style={selectStyle}
          >
            <option value="" disabled style={{ background: BG }}>Select a server…</option>
            {guilds.map((g) => (
              <option key={g.id} value={g.id} style={{ background: BG }}>{g.name}</option>
            ))}
          </select>
          {inviteUrl && (
            <a
              href={inviteUrl}
              target="_blank"
              rel="noreferrer"
              style={{ display: "inline-flex", alignItems: "center", gap: 4, color: "#5865F2", fontSize: 10, marginTop: 5, textDecoration: "none" }}
            >
              + Add to another server
            </a>
          )}
        </div>
      )}

      {/* Channel picker */}
      {selectedGuildId && (
        <div style={fieldWrap}>
          <label style={{ ...labelStyle, display: "flex", alignItems: "center", gap: 6 }}>
            Channel
            {fetchingChannels && <Loader2 size={10} style={{ animation: "spin 1s linear infinite" }} color="#555" />}
            {!fetchingChannels && channels.length > 0 && (
              <button
                onClick={() => handleGuildChange(selectedGuildId)}
                title="Refresh"
                style={{ background: "transparent", border: "none", cursor: "pointer", color: "#444", padding: 0, display: "flex", alignItems: "center" }}
              >
                <RefreshCw size={9} />
              </button>
            )}
          </label>
          {channels.length === 0 && !fetchingChannels ? (
            <button
              onClick={() => handleGuildChange(selectedGuildId)}
              style={{
                width: "100%", display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
                background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.09)",
                borderRadius: 8, color: "#606060", fontSize: 12, padding: "8px", cursor: "pointer",
              }}
            >
              <RefreshCw size={11} /> Load Channels
            </button>
          ) : (
            <select
              value={selectedChannelId ?? ""}
              onChange={(e) => updateNodeData(nodeId, { selectedChannelId: e.target.value })}
              disabled={fetchingChannels}
              style={selectStyle}
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
      {selectedChannelId && (
        <div style={{ marginBottom: 14 }}>
          <button
            onClick={handleSend}
            disabled={sendStatus === "sending" || !payload}
            style={{
              width: "100%", display: "flex", alignItems: "center", justifyContent: "center", gap: 7,
              background: sendStatus === "success" ? "rgba(63,185,80,0.15)" : "#5865F2",
              border: sendStatus === "success" ? "1px solid rgba(63,185,80,0.25)" : "none",
              borderRadius: 8, color: sendStatus === "success" ? "#3fb950" : "#fff",
              fontSize: 13, fontWeight: 700, padding: "10px 0",
              cursor: sendStatus === "sending" ? "wait" : "pointer",
              transition: "opacity 0.15s",
              opacity: !payload || sendStatus === "sending" ? 0.5 : 1,
            }}
          >
            {sendStatus === "sending"
              ? <Loader2 size={14} style={{ animation: "spin 1s linear infinite" }} />
              : <Send size={14} />}
            {sendStatus === "sending" ? "Sending…" : sendStatus === "success" ? "Sent ✓" : "Send Message"}
          </button>
          {sendStatus !== "idle" && sendMsg && (
            <div style={{
              marginTop: 8, padding: "7px 10px", borderRadius: 7,
              background: sendStatus === "success" ? "rgba(63,185,80,0.08)" : "rgba(248,81,73,0.08)",
              border: sendStatus === "success" ? "1px solid rgba(63,185,80,0.18)" : "1px solid rgba(248,81,73,0.18)",
              color: sendStatus === "success" ? "#3fb950" : "#f85149", fontSize: 12,
            }}>
              {sendMsg}
            </div>
          )}
          {!payload && (
            <div style={{ color: "#383838", fontSize: 10, marginTop: 5, textAlign: "center" }}>
              Add a Container or Embed to the canvas first
            </div>
          )}
          <div style={{ color: "#383838", fontSize: 10, marginTop: 5, textAlign: "center" }}>
            Sends to #{channels.find((c) => c.id === selectedChannelId)?.name}
          </div>
        </div>
      )}

      {/* Interaction flows */}
      <div style={fieldWrap}>
        <label style={labelStyle}>
          Interaction Flows ({interactionEdges.length})
        </label>
        {interactionEdges.length === 0 ? (
          <div style={{ color: "#404040", fontSize: 11, lineHeight: 1.6 }}>
            No flows yet. Drag the amber handle on a Button or Select → a Container to define what happens when it's clicked.
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            {interactionEdges.map((edge) => {
              const mode = (edge.data as Record<string, unknown>)?.mode as InteractionMode ?? "send_new";
              const meta = getInteractionModeMeta(mode);
              return (
                <div key={edge.id} style={{
                  background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)",
                  borderRadius: 8, padding: "8px 10px",
                  display: "flex", flexDirection: "column", gap: 5,
                }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 11 }}>
                    <span style={{ color: "#606060", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: 90 }}>
                      {getSourceLabel(edge.source)}
                    </span>
                    <ArrowRight size={10} color="#3a3a3a" style={{ flexShrink: 0 }} />
                    <span style={{ color: "#909090", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: 90 }}>
                      {getNodeLabel(edge.target)}
                    </span>
                  </div>
                  <select
                    value={mode}
                    onChange={(e) => updateEdgeData(edge.id, { mode: e.target.value as InteractionMode })}
                    style={{
                      ...inputStyle, padding: "4px 8px", fontSize: 10,
                      appearance: "none",
                      backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='10' viewBox='0 0 24 24' fill='none' stroke='%2364748B' stroke-width='2'%3E%3Cpath d='M6 9l6 6 6-6'/%3E%3C/svg%3E")`,
                      backgroundRepeat: "no-repeat", backgroundPosition: "right 7px center", paddingRight: 22, cursor: "pointer",
                    }}
                  >
                    {INTERACTION_MODES.map((m) => (
                      <option key={m.value} value={m.value} style={{ background: BG }}>
                        {m.label}
                      </option>
                    ))}
                  </select>
                  <div style={{ fontSize: 10, color: meta.color, opacity: 0.7 }}>{meta.description}</div>
                </div>
              );
            })}
          </div>
        )}
      </div>
      <style>{`@keyframes spin { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }`}</style>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
//  InteractionFlowsSection — shown on button/select properties
// ─────────────────────────────────────────────────────────────
function InteractionFlowsSection({ nodeId }: { nodeId: string }) {
  const nodes = useGraphStore((s) => s.nodes);
  const edges = useGraphStore((s) => s.edges);
  const updateEdgeData = useGraphStore((s) => s.updateEdgeData);
  const removeEdge = useGraphStore((s) => s.removeEdge);

  const outgoingInteractions = edges.filter(
    (e) => e.type === "interaction" && e.source === nodeId
  );

  if (outgoingInteractions.length === 0) {
    return (
      <div style={{ marginTop: 18 }}>
        <div style={{ ...labelStyle, display: "flex", alignItems: "center", gap: 5, marginBottom: 8 }}>
          <Zap size={10} color="#f59e0b" />
          On Interaction
        </div>
        <div style={{
          background: "rgba(245,158,11,0.05)",
          border: "1px dashed rgba(245,158,11,0.2)",
          borderRadius: 8, padding: "10px 12px", textAlign: "center",
        }}>
          <div style={{ color: "#4a3a00", fontSize: 11, lineHeight: 1.5 }}>
            Drag the <span style={{ color: "#f59e0b", fontWeight: 700 }}>amber handle →</span> to a Container or Embed to define what happens when this is clicked.
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ marginTop: 18 }}>
      <div style={{ ...labelStyle, display: "flex", alignItems: "center", gap: 5, marginBottom: 8 }}>
        <Zap size={10} color="#f59e0b" />
        On Interaction ({outgoingInteractions.length})
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
        {outgoingInteractions.map((edge) => {
          const mode = ((edge.data as Record<string, unknown>)?.mode as InteractionMode) ?? "send_new";
          const meta = getInteractionModeMeta(mode);
          const targetNode = nodes.find((n) => n.id === edge.target);
          const targetCt = targetNode?.data?.componentType as number;
          const targetLabel = TYPE_META[targetCt]?.label ?? targetNode?.type ?? "Node";

          return (
            <div key={edge.id} style={{
              background: `${meta.color}08`,
              border: `1px solid ${meta.color}25`,
              borderRadius: 8, padding: "8px 10px",
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 6 }}>
                <Zap size={9} color={meta.color} />
                <span style={{ color: "#888", fontSize: 11, flex: 1 }}>
                  → <span style={{ color: TEXT }}>{targetLabel}</span>
                </span>
                <button
                  onClick={() => removeEdge(edge.id)}
                  title="Remove this flow"
                  style={{ background: "rgba(248,81,73,0.1)", border: "1px solid rgba(248,81,73,0.2)", borderRadius: 4, color: "#f85149", cursor: "pointer", padding: "2px 4px", display: "flex", alignItems: "center" }}
                >
                  <X size={9} />
                </button>
              </div>
              <select
                value={mode}
                onChange={(e) => updateEdgeData(edge.id, { mode: e.target.value as InteractionMode })}
                style={{
                  ...inputStyle, padding: "5px 8px", fontSize: 11,
                  appearance: "none",
                  backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='10' viewBox='0 0 24 24' fill='none' stroke='%2364748B' stroke-width='2'%3E%3Cpath d='M6 9l6 6 6-6'/%3E%3C/svg%3E")`,
                  backgroundRepeat: "no-repeat", backgroundPosition: "right 7px center", paddingRight: 22, cursor: "pointer",
                }}
              >
                {INTERACTION_MODES.map((m) => (
                  <option key={m.value} value={m.value} style={{ background: BG }}>{m.label}</option>
                ))}
              </select>
              <div style={{ color: "#505050", fontSize: 10, marginTop: 4 }}>
                {INTERACTION_MODES.find((m) => m.value === mode)?.description}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
//  Main PropertiesPanel
// ─────────────────────────────────────────────────────────────
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
      <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
        {/* Header — matches Preview panel */}
        <div style={{ height: 44, flexShrink: 0, display: "flex", alignItems: "center", gap: 8, padding: "0 14px", background: "#2b2d31", boxShadow: "0 1px 0 rgba(0,0,0,0.35)" }}>
          <Hash size={18} color="#7d8590" strokeWidth={2.5} />
          <span style={{ color: "#f2f3f5", fontSize: 15, fontWeight: 700 }}>properties</span>
          <div style={{ width: 1, height: 18, background: "rgba(255,255,255,0.08)", margin: "0 2px" }} />
          <span style={{ color: "#a3a6aa", fontSize: 13 }}>Node editor</span>
        </div>
        {/* Empty state */}
        <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 16, padding: 24 }}>
          <div style={{ width: 52, height: 52, borderRadius: 14, background: "rgba(88,101,242,0.07)", border: "1px solid rgba(88,101,242,0.14)", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <Hash size={22} color="#5865F2" strokeWidth={1.5} />
          </div>
          <div style={{ textAlign: "center" }}>
            <div style={{ color: "#d0d0d0", fontSize: 13, fontWeight: 600, marginBottom: 6 }}>No node selected</div>
            <div style={{ color: "#606060", fontSize: 12, lineHeight: 1.7 }}>
              Click any node on the canvas<br />to edit its properties here.
            </div>
          </div>
          <div style={{ width: "100%", display: "flex", flexDirection: "column", gap: 6, marginTop: 4 }}>
            {[
              { icon: "🖱️", text: "Click a node to select it" },
              { icon: "↔️", text: "Drag handles to connect nodes" },
              { icon: "⌨️", text: "Delete key removes selected node" },
            ].map(({ icon, text }) => (
              <div key={text} style={{
                display: "flex", alignItems: "center", gap: 10,
                padding: "8px 12px", borderRadius: 8,
                background: "rgba(255,255,255,0.02)",
                border: "1px solid rgba(255,255,255,0.05)",
              }}>
                <span style={{ fontSize: 14, flexShrink: 0 }}>{icon}</span>
                <span style={{ color: "#505050", fontSize: 11 }}>{text}</span>
              </div>
            ))}
          </div>
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
      <input type="text" value={(d[key] as string) ?? ""} placeholder={placeholder} onChange={(e) => updateNodeData(node.id, { [key]: e.target.value })} data-testid={`prop-${key}`} style={inputStyle} onFocus={focusBorder} onBlur={blurBorder} />
    </div>
  );

  const numberField = (label: string, key: string, min?: number, max?: number) => (
    <div style={fieldWrap} key={key}>
      <label style={labelStyle}>{label}</label>
      <input type="number" value={(d[key] as number) ?? ""} min={min} max={max} onChange={(e) => updateNodeData(node.id, { [key]: e.target.value === "" ? null : Number(e.target.value) })} data-testid={`prop-${key}`} style={inputStyle} onFocus={focusBorder} onBlur={blurBorder} />
    </div>
  );

  const textareaField = (label: string, key: string, placeholder?: string, rows = 4) => (
    <div style={fieldWrap} key={key}>
      <label style={labelStyle}>{label}</label>
      <textarea value={(d[key] as string) ?? ""} placeholder={placeholder} onChange={(e) => updateNodeData(node.id, { [key]: e.target.value })} rows={rows} data-testid={`prop-${key}`} style={{ ...inputStyle, resize: "vertical", lineHeight: 1.5 }} onFocus={focusBorder} onBlur={blurBorder} />
    </div>
  );

  const colorField = (label: string, key: string) => {
    const val = d[key] as number | null | undefined;
    const hex = val != null ? "#" + val.toString(16).padStart(6, "0") : "#5865f2";
    return (
      <div style={fieldWrap} key={key}>
        <label style={labelStyle}>{label}</label>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <input type="color" value={hex} onChange={(e) => updateNodeData(node.id, { [key]: parseInt(e.target.value.replace("#", ""), 16) })} style={{ width: 36, height: 36, border: `1px solid ${BORDER}`, borderRadius: 6, cursor: "pointer", background: "none", padding: 2 }} />
          <div style={{ flex: 1, background: SURFACE, border: `1px solid ${BORDER}`, borderRadius: 6, padding: "6px 9px" }}>
            <span style={{ color: TEXT, fontSize: 12, fontFamily: "monospace" }}>{hex}</span>
          </div>
          {val != null && (
            <button onClick={() => updateNodeData(node.id, { [key]: null })} title="Clear color" style={{ background: "rgba(248,81,73,0.1)", border: "1px solid rgba(248,81,73,0.2)", borderRadius: 5, color: "#f85149", fontSize: 11, padding: "5px 8px", cursor: "pointer" }}>×</button>
          )}
        </div>
      </div>
    );
  };

  const checkboxField = (label: string, key: string) => (
    <div style={{ ...fieldWrap, display: "flex", alignItems: "center", gap: 10 }} key={key}>
      <div onClick={() => updateNodeData(node.id, { [key]: !d[key] })} style={{ width: 36, height: 20, borderRadius: 10, background: d[key] ? "#5865F2" : "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.08)", position: "relative", cursor: "pointer", transition: "background 0.15s", flexShrink: 0 }}>
        <div style={{ position: "absolute", top: 2, left: d[key] ? 17 : 2, width: 14, height: 14, borderRadius: "50%", background: "#fff", transition: "left 0.15s", boxShadow: "0 1px 3px rgba(0,0,0,0.3)" }} />
      </div>
      <label style={{ color: TEXT, fontSize: 12, fontWeight: 500, cursor: "pointer" }} onClick={() => updateNodeData(node.id, { [key]: !d[key] })} data-testid={`prop-${key}`}>{label}</label>
    </div>
  );

  const selectField = (label: string, key: string, options: string[]) => (
    <div style={fieldWrap} key={key}>
      <label style={labelStyle}>{label}</label>
      <select value={(d[key] as string) ?? options[0]} onChange={(e) => updateNodeData(node.id, { [key]: e.target.value })} data-testid={`prop-${key}`} style={{ ...inputStyle, appearance: "none", backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%2364748B' stroke-width='2'%3E%3Cpath d='M6 9l6 6 6-6'/%3E%3C/svg%3E")`, backgroundRepeat: "no-repeat", backgroundPosition: "right 8px center", paddingRight: 28, cursor: "pointer" }}>
        {options.map((o) => <option key={o} value={o} style={{ background: BG }}>{o}</option>)}
      </select>
    </div>
  );

  const selectOptionsField = () => {
    const opts = (d.options as Array<{ label: string; value: string; description?: string; default?: boolean }>) ?? [];
    const updateOption = (i: number, patch: Partial<{ label: string; value: string; description: string; default: boolean }>) => {
      updateNodeData(node.id, { options: opts.map((o, idx) => idx === i ? { ...o, ...patch } : o) });
    };
    return (
      <div style={fieldWrap}>
        <label style={labelStyle}>Options ({opts.length}/25)</label>
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          {opts.map((opt, i) => (
            <div key={i} style={{ background: SURFACE, border: `1px solid ${BORDER}`, borderRadius: 6, padding: "8px 10px", display: "flex", flexDirection: "column", gap: 5 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <div style={{ flex: 1 }}>
                  <input type="text" value={opt.label} placeholder="Label" onChange={(e) => updateOption(i, { label: e.target.value })} style={{ ...inputStyle, padding: "3px 6px", fontSize: 11 }} onFocus={focusBorder} onBlur={blurBorder} />
                </div>
                <button onClick={() => updateNodeData(node.id, { options: opts.filter((_, idx) => idx !== i) })} style={{ background: "rgba(248,81,73,0.1)", border: "1px solid rgba(248,81,73,0.2)", borderRadius: 4, color: "#f85149", cursor: "pointer", padding: "3px 5px", display: "flex", alignItems: "center", flexShrink: 0 }}>
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
            <button onClick={() => updateNodeData(node.id, { options: [...opts, { label: `Option ${opts.length + 1}`, value: `option_${opts.length + 1}` }] })} style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 5, padding: "6px", background: "rgba(88,101,242,0.08)", border: "1px dashed rgba(88,101,242,0.25)", borderRadius: 6, color: "#818cf8", fontSize: 11, cursor: "pointer" }}>
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
      updateNodeData(node.id, { fields: fields.map((f, idx) => idx === i ? { ...f, ...patch } : f) });
    };
    return (
      <div style={fieldWrap}>
        <label style={labelStyle}>Fields ({fields.length}/25)</label>
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          {fields.map((f, i) => (
            <div key={i} style={{ background: SURFACE, border: `1px solid ${BORDER}`, borderRadius: 6, padding: "8px 10px", display: "flex", flexDirection: "column", gap: 5 }}>
              <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                <input type="text" value={f.name} placeholder="Name" onChange={(e) => updateField(i, { name: e.target.value })} style={{ ...inputStyle, padding: "3px 6px", fontSize: 11, flex: 1 }} onFocus={focusBorder} onBlur={blurBorder} />
                <button onClick={() => updateNodeData(node.id, { fields: fields.filter((_, idx) => idx !== i) })} style={{ background: "rgba(248,81,73,0.1)", border: "1px solid rgba(248,81,73,0.2)", borderRadius: 4, color: "#f85149", cursor: "pointer", padding: "3px 5px", display: "flex", alignItems: "center" }}>
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
            <button onClick={() => updateNodeData(node.id, { fields: [...fields, { name: "Field Name", value: "Field value", inline: false }] })} style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 5, padding: "6px", background: "rgba(88,101,242,0.08)", border: "1px dashed rgba(88,101,242,0.25)", borderRadius: 6, color: "#818cf8", fontSize: 11, cursor: "pointer" }}>
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
    // Only structural edges (not interaction) define parent-child hierarchy
    const childEdges = edges.filter((e) => e.source === node.id && e.type !== "interaction");
    if (childEdges.length < 2) return null;
    const childNodes = childEdges.map((e) => nodes.find((n) => n.id === e.target)).filter(Boolean) as typeof nodes;
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

  const INTERACTIVE_TYPES = new Set([2, 3, 5, 6, 7, 8]);

  const renderFields = () => {
    if (d.componentType === -1) {
      return <BotProperties nodeId={node.id} d={d as Record<string, unknown>} updateNodeData={updateNodeData as (id: string, data: Record<string, unknown>) => void} />;
    }
    if (d.componentType === -2) {
      return <OpenEmbeddedProperties nodeId={node.id} d={d as Record<string, unknown>} updateNodeData={updateNodeData as (id: string, data: Record<string, unknown>) => void} />;
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
            <textarea value={items.map((i) => i.url).join("\n")} placeholder={"https://example.com/image1.png\nhttps://example.com/image2.png"} onChange={(e) => { const urls = e.target.value.split("\n").map((u) => ({ url: u.trim() })).filter((i) => i.url); updateNodeData(node.id, { items: urls }); }} rows={5} data-testid="prop-items" style={{ ...inputStyle, resize: "vertical", lineHeight: 1.6 }} onFocus={focusBorder} onBlur={blurBorder} />
            <div style={{ color: FAINT, fontSize: 10, marginTop: 4 }}>{items.length} image{items.length !== 1 ? "s" : ""} added</div>
          </div>
        );
      }
      case 14:
        return (<>{selectField("Spacing", "spacing", ["sm", "md", "lg"])}{checkboxField("Show Divider Line", "divider")}</>);
      case 1:
        return childOrder();
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
            <InteractionFlowsSection nodeId={node.id} />
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
            <InteractionFlowsSection nodeId={node.id} />
          </>
        );
      case 4:
        return (<>{textField("Label", "label", "Input label…")}{textField("Custom ID", "custom_id", "my_input_id")}{selectField("Style", "style", ["Short", "Paragraph"])}{textField("Placeholder", "placeholder", "Enter text…")}{textField("Pre-filled Value", "value", "")}{numberField("Min Length", "min_length", 0, 4000)}{numberField("Max Length", "max_length", 1, 4000)}{checkboxField("Required", "required")}</>);
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
            <InteractionFlowsSection nodeId={node.id} />
          </>
        );
      case 0:
        return (<>{textField("Title", "title", "Embed title…")}{textareaField("Description", "description", "Embed description…")}{colorField("Accent Color", "color")}{textField("URL (title link)", "url", "https://example.com")}{textField("Author Name", "author", "Author…")}{textField("Footer Text", "footer", "Footer…")}{textField("Image URL", "imageUrl", "https://example.com/image.png")}{textField("Thumbnail URL", "thumbnailUrl", "https://example.com/thumb.png")}{checkboxField("Show Timestamp", "timestamp")}{embedFieldsEditor()}</>);
      default:
        return <div style={{ color: MUTED, fontSize: 12 }}>No editable properties.</div>;
    }
  };

  const isInteractiveNode = INTERACTIVE_TYPES.has(d.componentType as number);

  const accentColor = meta?.color ?? "#5865F2";

  return (
    <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>

      {/* Header bar — mirrors Preview panel */}
      <div style={{
        height: 44, flexShrink: 0,
        display: "flex", alignItems: "center", gap: 8,
        padding: "0 14px",
        background: "#2b2d31",
        boxShadow: "0 1px 0 rgba(0,0,0,0.35)",
      }}>
        <div style={{ color: accentColor, display: "flex", alignItems: "center" }}>
          {meta?.icon ?? <Hash size={18} />}
        </div>
        <span style={{ color: "#f2f3f5", fontSize: 15, fontWeight: 700 }}>
          {meta?.label ?? "Node"}
        </span>
        <div style={{ width: 1, height: 18, background: "rgba(255,255,255,0.08)", margin: "0 2px" }} />
        <span style={{ color: "#a3a6aa", fontSize: 13 }}>
          {d.componentType === -1 ? "Bot config" : d.componentType === -2 ? "Flow config" : "Properties"}
        </span>
        <div style={{ flex: 1 }} />
        <button
          onClick={() => removeNode(node.id)}
          title="Delete node"
          style={{
            background: "rgba(248,81,73,0.1)", border: "1px solid rgba(248,81,73,0.18)",
            borderRadius: 6, color: "#f85149", cursor: "pointer",
            padding: "5px 6px", display: "flex", alignItems: "center",
            transition: "background 0.12s",
          }}
          onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = "rgba(248,81,73,0.22)"; }}
          onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = "rgba(248,81,73,0.1)"; }}
        >
          <Trash2 size={13} />
        </button>
      </div>

      {/* Scrollable card content */}
      <div style={{ flex: 1, overflowY: "auto", padding: "10px 10px 24px", display: "flex", flexDirection: "column", gap: 8 }}>

        {/* Node identity card */}
        <div style={{
          background: `linear-gradient(120deg, ${accentColor}0c 0%, rgba(255,255,255,0.02) 100%)`,
          border: `1px solid ${accentColor}20`,
          borderRadius: 10, padding: "10px 12px",
          display: "flex", alignItems: "center", gap: 10,
        }}>
          <div style={{
            width: 34, height: 34, borderRadius: 9, flexShrink: 0,
            background: `linear-gradient(135deg, ${accentColor}30, ${accentColor}12)`,
            border: `1px solid ${accentColor}28`,
            display: "flex", alignItems: "center", justifyContent: "center",
            color: accentColor,
          }}>
            {meta?.icon ?? <Hash size={16} />}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ color: TEXT, fontSize: 13, fontWeight: 600, marginBottom: 2 }}>
              {meta?.label ?? "Node"}
            </div>
            <div style={{ color: "#484848", fontSize: 10 }}>
              {d.componentType === -1 ? "Advanced · Bot" : d.componentType === -2 ? "Platform · Interactive" : `Component type ${d.componentType}`}
            </div>
          </div>
        </div>

        {/* Hints */}
        {PARENT_COMPONENT_TYPES.has(d.componentType as number) && (
          <div style={{
            background: "rgba(168,85,247,0.05)", border: "1px solid rgba(168,85,247,0.15)",
            borderRadius: 8, padding: "7px 10px",
            color: "#7c5fa8", fontSize: 10, display: "flex", alignItems: "center", gap: 6,
          }}>
            <Info size={10} style={{ flexShrink: 0 }} />
            Can contain: {ALLOWED_CHILDREN[node.type ?? ""]?.join(", ")}
          </div>
        )}
        {isInteractiveNode && (
          <div style={{
            background: "rgba(245,158,11,0.05)", border: "1px solid rgba(245,158,11,0.15)",
            borderRadius: 8, padding: "7px 10px",
            color: "#a07020", fontSize: 10, display: "flex", alignItems: "center", gap: 6,
          }}>
            <Zap size={10} color="#f59e0b" style={{ flexShrink: 0 }} />
            Drag the amber handle → a Container or Embed to set what happens on click
          </div>
        )}

        {/* Fields card */}
        <div style={{
          background: "rgba(255,255,255,0.025)",
          border: "1px solid rgba(255,255,255,0.07)",
          borderRadius: 10, padding: "14px 12px",
        }}>
          {renderFields()}
        </div>
      </div>
    </div>
  );
}
