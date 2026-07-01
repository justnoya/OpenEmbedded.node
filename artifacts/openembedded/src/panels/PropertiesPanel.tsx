// @ts-nocheck
import { useState, useRef, useEffect } from "react";
import { useGraphStore } from "../lib/graphStore.js";
import { usePreviewStore } from "../lib/previewStore.js";
import { ALLOWED_CHILDREN, INTERACTION_MODES, getInteractionModeMeta, type InteractionMode } from "../lib/connectionRules.js";
import { useBotValidate, useBotGetChannels, useBotSend, useOpenBotGuilds, useOpenBotChannels, useOpenBotSend, useSendWebhook } from "@workspace/api-client-react";
import { compileGraph, compileInteractionHandlers } from "../lib/compiler.js";
import { useRoute } from "wouter";
import {
  Package, LayoutTemplate, FileText, ImageIcon, GalleryHorizontalEnd,
  Minus, Rows3, PointerIcon, ListFilter, UserRound, ShieldCheck,
  AtSign, Hash, FormInput, MessageSquareCode, Trash2,
  Plus, X, Bot, Webhook, Clock,
  CheckCircle2, AlertCircle, Loader2, Send, RefreshCw, Zap, Circle,
  ArrowRight, Info, MessageCircle, PanelTop, GripVertical,
  // New icons for CV2 forms
  FileIcon, CheckSquare, Type, Upload,
  // Automation
  Terminal, MousePointerClick, PencilLine, UserPlus, UserMinus,
  ShieldAlert, MessageSquare, SmilePlus, MessageSquarePlus, Reply,
  Pin, UserSearch, GitBranch, Timer, Variable, Globe, Dices,
} from "lucide-react";
import { ReactNode } from "react";
import { AgentIcon } from "../canvas/AgentIcon.js";

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
  // CV2 Forms
  13:   { label: "File",               icon: <FileIcon size={14} />,             color: "#6b7280" },
  20:   { label: "Checkbox",           icon: <CheckSquare size={14} />,          color: "#0ea5e9" },
  21:   { label: "Checkbox Group",     icon: <CheckSquare size={14} />,          color: "#06b6d4" },
  22:   { label: "Radio Button",       icon: <Circle size={14} />,               color: "#8b5cf6" },
  23:   { label: "Radio Group",        icon: <Circle size={14} />,               color: "#a855f7" },
  24:   { label: "Label",              icon: <Type size={14} />,                 color: "#94a3b8" },
  25:   { label: "File Upload",        icon: <Upload size={14} />,               color: "#22c55e" },
  // Utility
  [-1]: { label: "Bot",               icon: <Bot size={14} />,                  color: "#5865F2" },
  [-2]: { label: "OpenEmbedded",       icon: <AgentIcon size={14} color="rgba(255,255,255,0.75)" />, color: "#6366f1" },
  [-3]: { label: "Message",            icon: <MessageCircle size={14} />,        color: "#10b981" },
  [-4]: { label: "Modal",              icon: <PanelTop size={14} />,             color: "#3b82f6" },
  [-5]: { label: "Webhook",            icon: <Webhook size={14} />,              color: "#5865F2" },
  [-6]: { label: "Schedule",           icon: <Clock size={14} />,               color: "#f59e0b" },
  // Automation Triggers
  [-10]: { label: "Event Trigger",     icon: <Zap size={14} />,                  color: "#8b5cf6" },
  [-11]: { label: "Slash Command",     icon: <Terminal size={14} />,             color: "#6366f1" },
  [-12]: { label: "Interaction Trigger", icon: <MousePointerClick size={14} />, color: "#f59e0b" },
  // Automation Actions
  [-20]: { label: "Send Message",      icon: <Send size={14} />,                 color: "#3b82f6" },
  [-21]: { label: "Edit Message",      icon: <PencilLine size={14} />,           color: "#64748b" },
  [-22]: { label: "Delete Message",    icon: <Trash2 size={14} />,               color: "#ef4444" },
  [-23]: { label: "Add Role",          icon: <UserPlus size={14} />,             color: "#22c55e" },
  [-24]: { label: "Remove Role",       icon: <UserMinus size={14} />,            color: "#f97316" },
  [-25]: { label: "Moderate",          icon: <ShieldAlert size={14} />,          color: "#ef4444" },
  [-26]: { label: "Send DM",           icon: <MessageSquare size={14} />,        color: "#06b6d4" },
  [-27]: { label: "Add Reaction",      icon: <SmilePlus size={14} />,            color: "#fbbf24" },
  [-28]: { label: "Create Thread",     icon: <MessageSquarePlus size={14} />,    color: "#0ea5e9" },
  [-29]: { label: "Reply",             icon: <Reply size={14} />,                color: "#3b82f6" },
  [-30]: { label: "Pin Message",       icon: <Pin size={14} />,                  color: "#fbbf24" },
  [-31]: { label: "Create Channel",    icon: <Hash size={14} />,                 color: "#22c55e" },
  [-32]: { label: "Fetch Member",      icon: <UserSearch size={14} />,           color: "#06b6d4" },
  // Flow Control
  [-33]: { label: "Condition",         icon: <GitBranch size={14} />,            color: "#f59e0b" },
  [-34]: { label: "Delay",             icon: <Timer size={14} />,                color: "#78716c" },
  [-35]: { label: "Variable",          icon: <Variable size={14} />,             color: "#a78bfa" },
  [-36]: { label: "HTTP Request",      icon: <Globe size={14} />,                color: "#0ea5e9" },
  [-37]: { label: "Random Pick",       icon: <Dices size={14} />,                color: "#ec4899" },
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
//  WebhookProperties
// ─────────────────────────────────────────────────────────────
function WebhookProperties({ d }: {
  nodeId: string;
  d: Record<string, unknown>;
}) {
  const payload = usePreviewStore((s) => s.payload);
  const isValid = usePreviewStore((s) => s.isValid);
  const compileErrors = usePreviewStore((s) => s.errors);
  const [sendStatus, setSendStatus] = useState<"idle" | "sending" | "success" | "error">("idle");
  const [sendMsg, setSendMsg] = useState("");

  const sendWebhook = useSendWebhook();

  const webhookUrl = (d.webhookUrl as string) ?? "";
  const connected = !!(d.connected as boolean);
  const webhookName = d.webhookName as string | null;
  const webhookAvatar = d.webhookAvatar as string | null;

  const handleSend = () => {
    if (!webhookUrl || !payload) return;
    setSendStatus("sending");
    sendWebhook.mutate(
      { data: { webhookUrl, payload: payload as Record<string, unknown> } },
      {
        onSuccess: (res: unknown) => {
          const r = res as { success: boolean; message?: string | null };
          if (r.success) {
            setSendStatus("success");
            setSendMsg("Message sent via webhook!");
          } else {
            setSendStatus("error");
            setSendMsg(r.message ?? "Discord rejected the message — check your webhook URL and try again.");
          }
          setTimeout(() => setSendStatus("idle"), 4000);
        },
        onError: () => {
          setSendStatus("error");
          setSendMsg("Couldn't reach Discord — check your connection.");
          setTimeout(() => setSendStatus("idle"), 4000);
        },
      }
    );
  };

  const focusBorder = (e: React.FocusEvent) => {
    (e.currentTarget as HTMLElement).style.borderColor = "rgba(88,101,242,0.6)";
  };
  const blurBorder = (e: React.FocusEvent) => {
    (e.currentTarget as HTMLElement).style.borderColor = BORDER;
  };

  return (
    <div>
      {/* Connection status card */}
      <div style={{
        padding: "10px 12px", borderRadius: 8, marginBottom: 14,
        background: connected ? "rgba(63,185,80,0.07)" : "rgba(255,255,255,0.03)",
        border: connected ? "1px solid rgba(63,185,80,0.18)" : "1px solid rgba(255,255,255,0.07)",
        display: "flex", alignItems: "center", gap: 10,
      }}>
        {webhookAvatar ? (
          <img src={webhookAvatar} alt="" style={{ width: 28, height: 28, borderRadius: "50%", flexShrink: 0 }} />
        ) : (
          <div style={{ width: 28, height: 28, borderRadius: "50%", background: "rgba(88,101,242,0.2)", flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <Webhook size={14} color="#818cf8" />
          </div>
        )}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ color: connected ? "#3fb950" : "#a0a0a0", fontSize: 12, fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            {connected ? (webhookName ?? "Webhook") : "No webhook connected"}
          </div>
          <div style={{ color: connected ? "#3fb950" : "#484848", fontSize: 10, opacity: connected ? 0.7 : 1 }}>
            {connected ? "Connected" : "Paste a webhook URL on the canvas node"}
          </div>
        </div>
        {connected && <div style={{ width: 7, height: 7, borderRadius: "50%", background: "#3fb950", flexShrink: 0 }} />}
      </div>

      {/* Webhook URL field */}
      <div style={fieldWrap}>
        <label style={labelStyle}>Webhook URL</label>
        <input
          type="text"
          value={webhookUrl}
          readOnly
          placeholder="Set on the canvas node…"
          style={{ ...inputStyle, color: webhookUrl ? TEXT : MUTED, cursor: "default" }}
          onFocus={focusBorder}
          onBlur={blurBorder}
        />
        <div style={{ color: "#383838", fontSize: 10, marginTop: 4 }}>
          Edit the URL directly on the Webhook canvas node
        </div>
      </div>

      {/* Send button */}
      {connected && (
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
          <button
            onClick={handleSend}
            disabled={sendStatus === "sending" || !payload || !isValid}
            style={{
              width: "100%", display: "flex", alignItems: "center", justifyContent: "center", gap: 7,
              background: sendStatus === "success" ? "rgba(63,185,80,0.15)" : "#5865F2",
              border: sendStatus === "success" ? "1px solid rgba(63,185,80,0.25)" : "none",
              borderRadius: 8, color: sendStatus === "success" ? "#3fb950" : "#fff",
              fontSize: 13, fontWeight: 700, padding: "10px 0",
              cursor: sendStatus === "sending" ? "wait" : "pointer",
              transition: "opacity 0.15s",
              opacity: !payload || !isValid || sendStatus === "sending" ? 0.45 : 1,
            }}
          >
            {sendStatus === "sending" ? <Loader2 size={14} style={{ animation: "spin 1s linear infinite" }} /> : <Send size={14} />}
            {sendStatus === "sending" ? "Sending…" : sendStatus === "success" ? "Sent ✓" : "Send via Webhook"}
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
          <div style={{ color: "#383838", fontSize: 10, marginTop: 6, textAlign: "center" }}>
            Sends your current canvas design to the webhook
          </div>
        </div>
      )}

      {!connected && (
        <div style={{
          padding: "10px 12px", borderRadius: 8,
          background: "rgba(88,101,242,0.05)", border: "1px dashed rgba(88,101,242,0.2)",
          color: "#5865F2", fontSize: 11, lineHeight: 1.6, textAlign: "center",
        }}>
          Paste a valid Discord webhook URL into the node on the canvas to enable sending.
        </div>
      )}
      <style>{`@keyframes spin { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }`}</style>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
//  ScheduleProperties
// ─────────────────────────────────────────────────────────────
const CRON_PRESETS = [
  { label: "Every minute",        value: "* * * * *" },
  { label: "Every 5 minutes",     value: "*/5 * * * *" },
  { label: "Every hour",          value: "0 * * * *" },
  { label: "Daily at 9 AM",       value: "0 9 * * *" },
  { label: "Daily at 6 PM",       value: "0 18 * * *" },
  { label: "Mon–Fri at 9 AM",     value: "0 9 * * 1-5" },
  { label: "Weekly Mon at 9 AM",  value: "0 9 * * 1" },
  { label: "Monthly on 1st 9 AM", value: "0 9 1 * *" },
  { label: "Custom…",             value: "custom" },
];

function ScheduleProperties({ nodeId, d, updateNodeData }: {
  nodeId: string;
  d: Record<string, unknown>;
  updateNodeData: (id: string, data: Record<string, unknown>) => void;
}) {
  const payload = usePreviewStore((s) => s.payload);
  const isValid = usePreviewStore((s) => s.isValid);
  const compileErrors = usePreviewStore((s) => s.errors);

  const scheduleId = (d.scheduleId as string) ?? "";
  const [scheduleType, setScheduleType] = useState((d.scheduleType as string) ?? "cron");
  const [cronExpression, setCronExpression] = useState((d.cronExpression as string) ?? "0 9 * * *");
  const [cronPreset, setCronPreset] = useState(() => {
    const init = (d.cronExpression as string) ?? "0 9 * * *";
    return CRON_PRESETS.find((p) => p.value !== "custom" && p.value === init) ? init : "custom";
  });
  const [runAt, setRunAt] = useState((d.runAt as string) ?? "");
  const [webhookUrl, setWebhookUrl] = useState((d.webhookUrl as string) ?? "");
  const [label, setLabel] = useState((d.label as string) ?? "Scheduled Message");
  const [status, setStatus] = useState<"idle" | "saving" | "saved" | "error" | "running">("idle");
  const [statusMsg, setStatusMsg] = useState("");

  const isActive = (d.active as boolean) ?? false;
  const lastRunAt = (d.lastRunAt as string) ?? "";
  const nextRunAt = (d.nextRunAt as string) ?? "";

  const amber = "#f59e0b";

  const focusBorder = (e: React.FocusEvent) => {
    (e.currentTarget as HTMLElement).style.borderColor = "rgba(88,101,242,0.6)";
  };
  const blurBorder = (e: React.FocusEvent) => {
    (e.currentTarget as HTMLElement).style.borderColor = BORDER;
  };

  const handlePresetChange = (val: string) => {
    setCronPreset(val);
    if (val !== "custom") setCronExpression(val);
  };

  const buildBody = () => ({
    label,
    scheduleType,
    cronExpression: scheduleType === "cron" ? cronExpression : undefined,
    runAt: scheduleType === "once" ? runAt : undefined,
    webhookUrl: webhookUrl || undefined,
    payload: payload as Record<string, unknown>,
  });

  const handleActivate = async () => {
    if (!payload) return;
    setStatus("saving");
    try {
      const body = buildBody();
      const url = scheduleId ? `/api/v1/schedules/${scheduleId}` : "/api/v1/schedules";
      const method = scheduleId ? "PATCH" : "POST";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(scheduleId ? { ...body, active: true } : body),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: "Unknown error" })) as { error?: string };
        setStatus("error");
        setStatusMsg(err.error ?? "Failed to save schedule");
        setTimeout(() => setStatus("idle"), 4000);
        return;
      }
      const data = await res.json() as { id: string; active: boolean; lastRunAt?: string | null; nextRunAt?: string | null };
      updateNodeData(nodeId, {
        scheduleId: data.id, active: data.active,
        lastRunAt: data.lastRunAt ?? null, nextRunAt: data.nextRunAt ?? null,
        scheduleType, cronExpression: scheduleType === "cron" ? cronExpression : undefined,
        runAt: scheduleType === "once" ? runAt : undefined, webhookUrl, label,
      });
      setStatus("saved");
      setStatusMsg(scheduleId ? "Schedule updated!" : "Schedule activated!");
      setTimeout(() => setStatus("idle"), 3000);
    } catch {
      setStatus("error");
      setStatusMsg("Network error — check your connection.");
      setTimeout(() => setStatus("idle"), 4000);
    }
  };

  const handleToggle = async () => {
    if (!scheduleId) return;
    setStatus("saving");
    try {
      const res = await fetch(`/api/v1/schedules/${scheduleId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ active: !isActive }),
      });
      if (!res.ok) throw new Error("Failed");
      const data = await res.json() as { active: boolean };
      updateNodeData(nodeId, { active: data.active });
      setStatus("saved");
      setStatusMsg(data.active ? "Schedule resumed" : "Schedule paused");
      setTimeout(() => setStatus("idle"), 2500);
    } catch {
      setStatus("error");
      setStatusMsg("Failed to toggle schedule");
      setTimeout(() => setStatus("idle"), 3000);
    }
  };

  const handleRunNow = async () => {
    if (!scheduleId) return;
    setStatus("running");
    try {
      const res = await fetch(`/api/v1/schedules/${scheduleId}/run`, { method: "POST" });
      const data = await res.json() as { success: boolean; message?: string | null };
      if (data.success) {
        updateNodeData(nodeId, { lastRunAt: new Date().toISOString() });
        setStatus("saved");
        setStatusMsg("Sent successfully!");
      } else {
        setStatus("error");
        setStatusMsg(data.message ?? "Discord rejected the message");
      }
      setTimeout(() => setStatus("idle"), 3500);
    } catch {
      setStatus("error");
      setStatusMsg("Network error");
      setTimeout(() => setStatus("idle"), 3000);
    }
  };

  const handleDelete = async () => {
    if (!scheduleId) return;
    try {
      await fetch(`/api/v1/schedules/${scheduleId}`, { method: "DELETE" });
      updateNodeData(nodeId, { scheduleId: null, active: false, lastRunAt: null, nextRunAt: null });
    } catch {}
  };

  return (
    <div>
      <div style={fieldWrap}>
        <label style={labelStyle}>Schedule Name</label>
        <input type="text" value={label} onChange={(e) => setLabel(e.target.value)}
          placeholder="My daily announcement" style={inputStyle} onFocus={focusBorder} onBlur={blurBorder} />
      </div>

      <div style={fieldWrap}>
        <label style={labelStyle}>Schedule Type</label>
        <div style={{ display: "flex", gap: 6 }}>
          {(["cron", "once"] as const).map((t) => (
            <button key={t} onClick={() => setScheduleType(t)} style={{
              flex: 1, padding: "7px 0", borderRadius: 7, fontSize: 12, fontWeight: 600,
              border: scheduleType === t ? `1px solid ${amber}50` : "1px solid rgba(255,255,255,0.09)",
              background: scheduleType === t ? `${amber}18` : "rgba(255,255,255,0.04)",
              color: scheduleType === t ? amber : "#606060", cursor: "pointer", transition: "all 0.12s",
            }}>
              {t === "cron" ? "Recurring" : "One-time"}
            </button>
          ))}
        </div>
      </div>

      {scheduleType === "cron" ? (
        <>
          <div style={fieldWrap}>
            <label style={labelStyle}>Frequency</label>
            <select value={cronPreset} onChange={(e) => handlePresetChange(e.target.value)}
              style={{ ...inputStyle, cursor: "pointer" }} onFocus={focusBorder} onBlur={blurBorder}>
              {CRON_PRESETS.map((p) => <option key={p.value} value={p.value} style={{ background: BG }}>{p.label}</option>)}
            </select>
          </div>
          {cronPreset === "custom" && (
            <div style={fieldWrap}>
              <label style={labelStyle}>Cron Expression</label>
              <input type="text" value={cronExpression} onChange={(e) => setCronExpression(e.target.value)}
                placeholder="0 9 * * *" style={{ ...inputStyle, fontFamily: "monospace" }}
                onFocus={focusBorder} onBlur={blurBorder} />
              <div style={{ color: FAINT, fontSize: 10, marginTop: 4 }}>
                5-field syntax: minute hour day month weekday
              </div>
            </div>
          )}
        </>
      ) : (
        <div style={fieldWrap}>
          <label style={labelStyle}>Run At</label>
          <input type="datetime-local" value={runAt} onChange={(e) => setRunAt(e.target.value)}
            style={{ ...inputStyle, colorScheme: "dark" }} onFocus={focusBorder} onBlur={blurBorder} />
        </div>
      )}

      <div style={fieldWrap}>
        <label style={labelStyle}>Webhook URL</label>
        <input type="text" value={webhookUrl} onChange={(e) => setWebhookUrl(e.target.value)}
          placeholder="https://discord.com/api/webhooks/…" style={inputStyle}
          onFocus={focusBorder} onBlur={blurBorder} />
        <div style={{ color: FAINT, fontSize: 10, marginTop: 4 }}>
          Connect this node's right handle → a Container on the canvas to define what gets sent
        </div>
      </div>

      {scheduleId && (
        <div style={{
          padding: "10px 12px", borderRadius: 8, marginBottom: 14,
          background: isActive ? "rgba(245,158,11,0.07)" : "rgba(255,255,255,0.03)",
          border: isActive ? "1px solid rgba(245,158,11,0.2)" : "1px solid rgba(255,255,255,0.07)",
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: lastRunAt || nextRunAt ? 6 : 0 }}>
            <div style={{ width: 7, height: 7, borderRadius: "50%", flexShrink: 0, background: isActive ? amber : "#484848", boxShadow: isActive ? `0 0 6px ${amber}60` : "none" }} />
            <span style={{ color: isActive ? amber : "#606060", fontSize: 12, fontWeight: 600 }}>
              {isActive ? "Active" : "Paused"}
            </span>
          </div>
          {lastRunAt && <div style={{ color: "#484848", fontSize: 11, marginBottom: 2 }}>Last: {new Date(lastRunAt).toLocaleString(undefined, { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}</div>}
          {nextRunAt && isActive && <div style={{ color: "#484848", fontSize: 11 }}>Next: {new Date(nextRunAt).toLocaleString(undefined, { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}</div>}
        </div>
      )}

      {!isValid && compileErrors.length > 0 && (
        <div style={{ marginBottom: 8 }}>
          {compileErrors.map((e, i) => (
            <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: 6, marginBottom: 4 }}>
              <AlertCircle size={11} color="#f85149" style={{ marginTop: 1, flexShrink: 0 }} />
              <span style={{ color: "#f85149", fontSize: 11, lineHeight: 1.4 }}>{e.message}</span>
            </div>
          ))}
        </div>
      )}

      {status !== "idle" && statusMsg && (
        <div style={{
          marginBottom: 10, padding: "7px 10px", borderRadius: 7, fontSize: 12,
          background: status === "error" ? "rgba(248,81,73,0.08)" : "rgba(245,158,11,0.08)",
          border: status === "error" ? "1px solid rgba(248,81,73,0.18)" : `1px solid ${amber}30`,
          color: status === "error" ? "#f85149" : amber,
        }}>{statusMsg}</div>
      )}

      <button onClick={handleActivate} disabled={status === "saving" || !payload || !isValid}
        style={{
          width: "100%", display: "flex", alignItems: "center", justifyContent: "center", gap: 7,
          background: status === "saved" ? "rgba(245,158,11,0.15)" : amber,
          border: status === "saved" ? `1px solid ${amber}30` : "none",
          borderRadius: 8, color: status === "saved" ? amber : "#1a1a1a",
          fontSize: 13, fontWeight: 700, padding: "10px 0", cursor: "pointer",
          transition: "opacity 0.15s", marginBottom: 8,
          opacity: !payload || !isValid || status === "saving" ? 0.45 : 1,
        }}>
        {status === "saving"
          ? <><Loader2 size={14} style={{ animation: "spin 1s linear infinite" }} /> Saving…</>
          : scheduleId
          ? <><RefreshCw size={14} /> Update Schedule</>
          : <><Send size={14} /> Activate Schedule</>}
      </button>

      {scheduleId && (
        <div style={{ display: "flex", gap: 6 }}>
          <button onClick={handleToggle} disabled={status === "saving"}
            style={{ flex: 1, padding: "8px 0", borderRadius: 7, fontSize: 12, fontWeight: 600, background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.09)", color: "#d0d0d0", cursor: "pointer" }}>
            {isActive ? "Pause" : "Resume"}
          </button>
          <button onClick={handleRunNow} disabled={status === "running"}
            style={{ flex: 1, padding: "8px 0", borderRadius: 7, fontSize: 12, fontWeight: 600, background: "rgba(63,185,80,0.08)", border: "1px solid rgba(63,185,80,0.2)", color: "#3fb950", cursor: "pointer", opacity: status === "running" ? 0.45 : 1 }}>
            {status === "running" ? "Sending…" : "Run Now"}
          </button>
          <button onClick={handleDelete} title="Delete schedule"
            style={{ padding: "8px 10px", borderRadius: 7, background: "rgba(248,81,73,0.08)", border: "1px solid rgba(248,81,73,0.18)", color: "#f85149", cursor: "pointer", display: "flex", alignItems: "center" }}>
            <Trash2 size={13} />
          </button>
        </div>
      )}
      <style>{`@keyframes spin { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }`}</style>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
//  BotProperties
// ─────────────────────────────────────────────────────────────
function BotProperties({ nodeId, d, updateNodeData }: {
  nodeId: string;
  d: Record<string, unknown>;
  updateNodeData: (id: string, data: Record<string, unknown>) => void;
}) {
  const payload = usePreviewStore((s) => s.payload);
  const isValid = usePreviewStore((s) => s.isValid);
  const compileErrors = usePreviewStore((s) => s.errors);
  const nodes = useGraphStore((s) => s.nodes);
  const edges = useGraphStore((s) => s.edges);

  const [tokenInput, setTokenInput] = useState((d.token as string) ?? "");
  const [sendStatus, setSendStatus] = useState<"idle" | "sending" | "success" | "error">("idle");
  const [sendMsg, setSendMsg] = useState("");
  const [fetchingChannels, setFetchingChannels] = useState(false);

  // Go Live state
  const [deployStatus, setDeployStatus] = useState<"idle" | "deploying" | "deployed" | "error">("idle");
  const [deployMsg, setDeployMsg] = useState("");
  const [interactionUrl, setInteractionUrl] = useState<string | null>(null);
  const [deployedAt, setDeployedAt] = useState<string | null>(null);
  const [urlCopied, setUrlCopied] = useState(false);
  const [goLiveOpen, setGoLiveOpen] = useState(false);

  // Get projectId from URL
  const [, builderParams] = useRoute("/builder/:id");
  const projectId = builderParams?.id ?? null;

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

  // Load existing registration on mount
  useEffect(() => {
    if (!projectId || !connected) return;
    fetch(`/api/v1/bot/registration/${projectId}`, { credentials: "include" })
      .then((r) => r.ok ? r.json() : null)
      .then((data) => {
        if (data?.registration) {
          setInteractionUrl(data.registration.interactionUrl);
          setDeployedAt(data.registration.deployedAt ?? null);
          if (data.registration.deployedAt) setDeployStatus("deployed");
        }
      })
      .catch(() => {});
  }, [projectId, connected]);

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
        onSuccess: (res: unknown) => {
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
        onSuccess: (res: unknown) => {
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
    setInteractionUrl(null);
    setDeployedAt(null);
    setDeployStatus("idle");
  };

  const handleSend = () => {
    const t = (d.token as string)?.trim();
    const channelId = selectedChannelId;
    if (!t || !channelId || !payload) return;
    setSendStatus("sending");
    botSend.mutate(
      { data: { token: t, channelId, payload: payload as Record<string, unknown> } },
      {
        onSuccess: (res: unknown) => {
          const r = res as { success: boolean; message?: string | null };
          if (r.success) { setSendStatus("success"); setSendMsg("Message sent!"); }
          else { setSendStatus("error"); setSendMsg(r.message ?? "Discord rejected the message — check your bot token, channel selection, and try again."); }
          setTimeout(() => setSendStatus("idle"), 4000);
        },
        onError: () => { setSendStatus("error"); setSendMsg("Couldn't reach Discord — check your internet connection and try again."); setTimeout(() => setSendStatus("idle"), 4000); },
      }
    );
  };

  const handleGoLive = async () => {
    const token = (d.token as string)?.trim();
    if (!token || !projectId) return;

    setDeployStatus("deploying");
    setDeployMsg("");

    try {
      // Step 1: Register (save encrypted token + get public key)
      const regRes = await fetch("/api/v1/bot/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          token,
          projectId,
          botName: botName ?? undefined,
          botAvatar: botAvatar ?? undefined,
        }),
      });
      const regData = await regRes.json() as { success: boolean; message?: string; interactionUrl?: string };
      if (!regData.success) {
        setDeployStatus("error");
        setDeployMsg(regData.message ?? "Registration failed. Check your bot token.");
        return;
      }

      setInteractionUrl(regData.interactionUrl ?? null);

      // Step 2: Compile interaction handlers from current graph
      const { handlers } = compileInteractionHandlers(nodes, edges);

      // Step 3: Deploy handlers
      const deployRes = await fetch(`/api/v1/bot/deploy/${projectId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ handlers }),
      });
      const deployData = await deployRes.json() as {
        success: boolean; message?: string;
        deployedAt?: string; interactionUrl?: string; handlerCount?: number;
      };

      if (!deployData.success) {
        setDeployStatus("error");
        setDeployMsg(deployData.message ?? "Deploy failed. Please try again.");
        return;
      }

      setDeployStatus("deployed");
      setDeployedAt(deployData.deployedAt ?? null);
      if (deployData.interactionUrl) setInteractionUrl(deployData.interactionUrl);
      setDeployMsg(
        handlers.length === 0
          ? "Bot registered! No interaction handlers found — draw interaction edges from buttons to link responses."
          : `Deployed ${deployData.handlerCount ?? handlers.length} interaction handler${(deployData.handlerCount ?? handlers.length) === 1 ? "" : "s"}.`
      );
      setTimeout(() => setDeployMsg(""), 6000);
    } catch {
      setDeployStatus("error");
      setDeployMsg("Network error. Please try again.");
    }
  };

  const handleCopyUrl = () => {
    if (!interactionUrl) return;
    navigator.clipboard.writeText(interactionUrl).then(() => {
      setUrlCopied(true);
      setTimeout(() => setUrlCopied(false), 2000);
    });
  };

  const isValidating = botValidate.isPending;
  const isDeploying = deployStatus === "deploying";

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

      {/* ── Go Live — Persistent Interactions ─────────────────────────────── */}
      {connected && projectId && (
        <div style={{ marginTop: 16 }}>
          {/* Section toggle header */}
          <button
            onClick={() => setGoLiveOpen((o) => !o)}
            style={{
              width: "100%", display: "flex", alignItems: "center", justifyContent: "space-between",
              background: "transparent", border: "none", cursor: "pointer", padding: "6px 0",
              borderTop: "1px solid rgba(255,255,255,0.05)",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
              <div style={{
                width: 7, height: 7, borderRadius: "50%",
                background: deployStatus === "deployed" ? "#3fb950" : "#555",
                flexShrink: 0,
              }} />
              <span style={{ color: deployStatus === "deployed" ? "#3fb950" : "#707070", fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em" }}>
                {deployStatus === "deployed" ? "Live — Interactions Active" : "Go Live"}
              </span>
            </div>
            <span style={{ color: "#444", fontSize: 10 }}>{goLiveOpen ? "▲" : "▼"}</span>
          </button>

          {goLiveOpen && (
            <div style={{ paddingTop: 10 }}>
              {/* Explanation */}
              <div style={{
                padding: "9px 11px", borderRadius: 8, marginBottom: 12,
                background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)",
                color: "#5a5a5a", fontSize: 11, lineHeight: 1.6,
              }}>
                Make buttons and select menus respond <strong style={{ color: "#707070" }}>24/7, forever</strong> — even months after the message was sent. Paste the endpoint URL into your Discord app's <em>Interactions Endpoint URL</em> field.
              </div>

              {/* Deploy button */}
              <button
                onClick={handleGoLive}
                disabled={isDeploying || !projectId}
                style={{
                  width: "100%", display: "flex", alignItems: "center", justifyContent: "center", gap: 7,
                  background: deployStatus === "deployed"
                    ? "rgba(63,185,80,0.12)"
                    : isDeploying
                    ? "rgba(255,255,255,0.06)"
                    : "rgba(255,255,255,0.08)",
                  border: deployStatus === "deployed"
                    ? "1px solid rgba(63,185,80,0.22)"
                    : "1px solid rgba(255,255,255,0.1)",
                  borderRadius: 8,
                  color: deployStatus === "deployed" ? "#3fb950" : deployStatus === "error" ? "#f85149" : "#d0d0d0",
                  fontSize: 13, fontWeight: 700, padding: "10px 0",
                  cursor: isDeploying ? "wait" : "pointer",
                  transition: "all 0.15s",
                  opacity: isDeploying ? 0.6 : 1,
                }}
              >
                {isDeploying
                  ? <><Loader2 size={14} style={{ animation: "spin 1s linear infinite" }} /> Deploying…</>
                  : deployStatus === "deployed"
                  ? <><CheckCircle2 size={14} /> Re-deploy Interactions</>
                  : <><Zap size={14} /> Deploy Interactions</>
                }
              </button>

              {deployMsg && (
                <div style={{
                  marginTop: 8, padding: "7px 10px", borderRadius: 7, fontSize: 11,
                  background: deployStatus === "error" ? "rgba(248,81,73,0.08)" : "rgba(63,185,80,0.07)",
                  border: deployStatus === "error" ? "1px solid rgba(248,81,73,0.18)" : "1px solid rgba(63,185,80,0.15)",
                  color: deployStatus === "error" ? "#f85149" : "#3fb950",
                }}>
                  {deployMsg}
                </div>
              )}

              {/* Interactions Endpoint URL */}
              {interactionUrl && (
                <div style={{ marginTop: 12 }}>
                  <div style={{ color: "#505050", fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 5 }}>
                    Interactions Endpoint URL
                  </div>
                  <div style={{
                    display: "flex", alignItems: "center", gap: 6,
                    background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)",
                    borderRadius: 8, padding: "7px 10px",
                  }}>
                    <span style={{ flex: 1, color: "#888", fontSize: 10, fontFamily: "monospace", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {interactionUrl}
                    </span>
                    <button
                      onClick={handleCopyUrl}
                      style={{
                        background: urlCopied ? "rgba(63,185,80,0.12)" : "rgba(255,255,255,0.06)",
                        border: urlCopied ? "1px solid rgba(63,185,80,0.2)" : "1px solid rgba(255,255,255,0.1)",
                        borderRadius: 6, color: urlCopied ? "#3fb950" : "#888",
                        cursor: "pointer", padding: "3px 8px", fontSize: 10, fontWeight: 600,
                        flexShrink: 0, whiteSpace: "nowrap",
                      }}
                    >
                      {urlCopied ? "Copied!" : "Copy"}
                    </button>
                  </div>
                  <div style={{ color: "#404040", fontSize: 10, marginTop: 5, lineHeight: 1.5 }}>
                    Paste this into <strong style={{ color: "#555" }}>Discord Developer Portal</strong> → your app → <em>General Information</em> → <em>Interactions Endpoint URL</em>
                  </div>
                  {deployedAt && (
                    <div style={{ color: "#3a3a3a", fontSize: 10, marginTop: 4 }}>
                      Last deployed: {new Date(deployedAt).toLocaleString()}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
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

  // Phase 2 — user's authorized guilds (servers they've added the bot to)
  const [myGuilds, setMyGuilds] = useState<GuildEntry[]>([]);
  const [myGuildsLoading, setMyGuildsLoading] = useState(true);
  const [inviteUrl, setInviteUrl] = useState<string | null>(null);

  function refreshMyGuilds() {
    setMyGuildsLoading(true);
    fetch("/api/v1/openbot/my-guilds")
      .then((r) => r.json())
      .then((data: { guilds?: GuildEntry[] }) => {
        setMyGuilds(data.guilds ?? []);
        setMyGuildsLoading(false);
      })
      .catch(() => setMyGuildsLoading(false));
  }

  useEffect(() => {
    refreshMyGuilds();
    fetch("/api/v1/openbot/invite-url")
      .then((r) => r.json())
      .then((data: { inviteUrl?: string | null }) => setInviteUrl(data.inviteUrl ?? null))
      .catch(() => {});
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const guildsData = guildsQuery.data as { success?: boolean; message?: string | null } | undefined;
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
        onSuccess: (res: unknown) => {
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
        onSuccess: (res: unknown) => {
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
          {(guildsQuery.isLoading || myGuildsLoading)
            ? <Loader2 size={13} color="#555" style={{ animation: "spin 1s linear infinite" }} />
            : <AgentIcon size={13} color="#818cf8" />}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ color: "#d0d0d0", fontSize: 12, fontWeight: 600 }}>OpenEmbedded Bot</div>
          <div style={{ color: "#484848", fontSize: 10, marginTop: 1 }}>
            {(guildsQuery.isLoading || myGuildsLoading)
              ? "Connecting…"
              : botNotConfigured
                ? "Not available"
                : myGuilds.length > 0
                  ? `${myGuilds.length} server${myGuilds.length !== 1 ? "s" : ""} available`
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
      {!botNotConfigured && !myGuildsLoading && myGuilds.length === 0 && (
        <div style={{ marginBottom: 14 }}>
          <div style={{ color: "#484848", fontSize: 11, marginBottom: 8, lineHeight: 1.5 }}>
            Add OpenEmbedded Bot to your Discord server to send messages directly from the editor.
          </div>
          <div style={{ display: "flex", gap: 6 }}>
            {inviteUrl ? (
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
                Add Bot to Server
              </a>
            ) : (
              <div style={{ flex: 1, color: "#484848", fontSize: 10, padding: "7px 0" }}>
                Bot invite URL not available — check OPENBOT_API_URL config.
              </div>
            )}
            <button
              onClick={() => refreshMyGuilds()}
              style={{
                flex: "0 0 auto",
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
      {myGuilds.length > 0 && (
        <div style={fieldWrap}>
          <label style={{ ...labelStyle, display: "flex", alignItems: "center", gap: 6 }}>
            Server
            <button
              onClick={() => refreshMyGuilds()}
              title="Refresh"
              style={{ background: "transparent", border: "none", cursor: "pointer", color: "#444", padding: 0, display: "flex", alignItems: "center" }}
            >
              {myGuildsLoading ? <Loader2 size={9} style={{ animation: "spin 1s linear infinite" }} /> : <RefreshCw size={9} />}
            </button>
          </label>
          <select
            value={selectedGuildId ?? ""}
            onChange={(e) => handleGuildChange(e.target.value)}
            style={selectStyle}
          >
            <option value="" disabled style={{ background: BG }}>Select a server…</option>
            {myGuilds.map((g) => (
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
//  ImageUploadField — upload + optional URL input for a single image
// ─────────────────────────────────────────────────────────────
function ImageUploadField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (url: string) => void;
}) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const [dragging, setDragging] = useState(false);

  const uploadFile = async (file: File) => {
    if (!file.type.startsWith("image/")) { setError("Please select an image file."); return; }
    if (file.size > 8 * 1024 * 1024) { setError("Image must be under 8 MB."); return; }
    setUploading(true);
    setError("");
    try {
      const fd = new FormData();
      fd.append("image", file);
      const r = await fetch("/api/v1/upload/image", { method: "POST", body: fd, credentials: "include" });
      const data = await r.json();
      if (data.url) { onChange(data.url); }
      else setError(data.error ?? "Upload failed.");
    } catch { setError("Upload failed — check connection."); }
    finally { setUploading(false); }
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    const f = e.dataTransfer.files[0];
    if (f) uploadFile(f);
  };

  return (
    <div style={fieldWrap}>
      <label style={labelStyle}>{label}</label>

      {/* Drop / click zone */}
      <div
        onDrop={onDrop}
        onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onClick={() => !uploading && fileRef.current?.click()}
        style={{
          border: `1px dashed ${dragging ? "rgba(255,255,255,0.28)" : "rgba(255,255,255,0.11)"}`,
          borderRadius: 8,
          cursor: uploading ? "wait" : "pointer",
          overflow: "hidden",
          transition: "border-color 0.15s",
          marginBottom: 7,
          background: dragging ? "rgba(255,255,255,0.03)" : "transparent",
        }}
      >
        {value ? (
          <div style={{ padding: 8 }}>
            <img
              src={value}
              alt=""
              style={{ width: "100%", maxHeight: 100, objectFit: "cover", borderRadius: 5, display: "block" }}
              onError={(e) => { (e.currentTarget as HTMLImageElement).style.opacity = "0.15"; }}
            />
            <div style={{ fontSize: 10, color: "#484848", textAlign: "center", marginTop: 5 }}>
              {uploading ? "Uploading…" : "Click or drag to replace"}
            </div>
          </div>
        ) : (
          <div style={{ padding: "16px 8px", textAlign: "center" }}>
            {uploading ? (
              <Loader2 size={16} color="#484848" style={{ animation: "spin 1s linear infinite", display: "block", margin: "0 auto 6px" }} />
            ) : (
              <Upload size={16} color="#484848" style={{ display: "block", margin: "0 auto 6px" }} />
            )}
            <div style={{ fontSize: 12, color: "#545454", fontWeight: 500 }}>
              {uploading ? "Uploading…" : "Upload image"}
            </div>
            <div style={{ fontSize: 10, color: "#3a3a3a", marginTop: 3 }}>PNG, JPG, GIF, WebP · max 8 MB</div>
          </div>
        )}
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          style={{ display: "none" }}
          onChange={(e) => { const f = e.target.files?.[0]; if (f) uploadFile(f); e.target.value = ""; }}
        />
      </div>

      {error && <div style={{ color: "#f85149", fontSize: 11, marginBottom: 6 }}>{error}</div>}

      {/* Optional URL fallback */}
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Or paste URL…"
        style={{ ...inputStyle, fontSize: 11.5 }}
      />
      {value && (
        <button
          onClick={() => onChange("")}
          style={{ marginTop: 5, background: "none", border: "none", color: "#555", fontSize: 10.5, cursor: "pointer", padding: 0, display: "flex", alignItems: "center", gap: 3 }}
        >
          <X size={9} /> Clear
        </button>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
//  GalleryUploadField — upload + URL list for Media Gallery
// ─────────────────────────────────────────────────────────────
function GalleryUploadField({
  items,
  onChange,
}: {
  items: { url: string }[];
  onChange: (items: { url: string }[]) => void;
}) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [urlInput, setUrlInput] = useState("");
  const [error, setError] = useState("");

  const addUrl = (url: string) => {
    const u = url.trim();
    if (!u) return;
    onChange([...items, { url: u }]);
    setUrlInput("");
  };

  const removeItem = (i: number) => {
    onChange(items.filter((_, idx) => idx !== i));
  };

  const uploadFile = async (file: File) => {
    if (!file.type.startsWith("image/")) { setError("Please select an image file."); return; }
    if (file.size > 8 * 1024 * 1024) { setError("Image must be under 8 MB."); return; }
    setUploading(true);
    setError("");
    try {
      const fd = new FormData();
      fd.append("image", file);
      const r = await fetch("/api/v1/upload/image", { method: "POST", body: fd, credentials: "include" });
      const data = await r.json();
      if (data.url) { onChange([...items, { url: data.url }]); }
      else setError(data.error ?? "Upload failed.");
    } catch { setError("Upload failed — check connection."); }
    finally { setUploading(false); }
  };

  const atMax = items.length >= 10;

  return (
    <div style={fieldWrap}>
      <label style={labelStyle}>Images ({items.length}/10)</label>

      {/* Thumbnail grid */}
      {items.length > 0 && (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 5, marginBottom: 8 }}>
          {items.map((item, i) => (
            <div key={i} style={{ position: "relative", borderRadius: 6, overflow: "hidden", aspectRatio: "1", background: "#1a1a1a", border: `1px solid ${BORDER}` }}>
              <img
                src={item.url}
                alt=""
                style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
                onError={(e) => { (e.currentTarget as HTMLImageElement).style.opacity = "0.2"; }}
              />
              <button
                onClick={() => removeItem(i)}
                style={{ position: "absolute", top: 3, right: 3, width: 17, height: 17, borderRadius: "50%", background: "rgba(0,0,0,0.72)", border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", padding: 0 }}
              >
                <X size={9} color="#ccc" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Upload button */}
      {!atMax && (
        <button
          onClick={() => fileRef.current?.click()}
          disabled={uploading}
          style={{
            width: "100%", display: "flex", alignItems: "center", justifyContent: "center", gap: 7,
            padding: "9px 0", borderRadius: 8,
            border: "1px dashed rgba(255,255,255,0.11)",
            background: "transparent",
            color: "#545454", fontSize: 12, fontWeight: 500,
            cursor: uploading ? "wait" : "pointer",
            marginBottom: 7,
            transition: "border-color 0.15s, color 0.15s",
          }}
          onMouseEnter={(e) => { const el = e.currentTarget as HTMLElement; el.style.borderColor = "rgba(255,255,255,0.22)"; el.style.color = "#888"; }}
          onMouseLeave={(e) => { const el = e.currentTarget as HTMLElement; el.style.borderColor = "rgba(255,255,255,0.11)"; el.style.color = "#545454"; }}
        >
          {uploading
            ? <Loader2 size={13} style={{ animation: "spin 1s linear infinite" }} />
            : <Upload size={13} />}
          {uploading ? "Uploading…" : "Add Image"}
        </button>
      )}
      {atMax && <div style={{ fontSize: 11, color: MUTED, marginBottom: 7 }}>Maximum 10 images reached.</div>}
      <input ref={fileRef} type="file" accept="image/*" style={{ display: "none" }} onChange={(e) => { const f = e.target.files?.[0]; if (f) uploadFile(f); e.target.value = ""; }} />

      {error && <div style={{ color: "#f85149", fontSize: 11, marginBottom: 6 }}>{error}</div>}

      {/* URL paste */}
      {!atMax && (
        <div style={{ display: "flex", gap: 5 }}>
          <input
            type="text"
            value={urlInput}
            onChange={(e) => setUrlInput(e.target.value)}
            placeholder="Or paste URL and press Enter…"
            style={{ ...inputStyle, flex: 1, fontSize: 11.5 }}
            onKeyDown={(e) => { if (e.key === "Enter" && urlInput.trim()) { e.preventDefault(); addUrl(urlInput); } }}
          />
          <button
            onClick={() => addUrl(urlInput)}
            disabled={!urlInput.trim()}
            style={{
              padding: "0 11px", borderRadius: 6,
              background: urlInput.trim() ? "rgba(255,255,255,0.08)" : "transparent",
              border: `1px solid ${BORDER}`,
              color: urlInput.trim() ? "#888" : "#3a3a3a",
              fontSize: 11, cursor: urlInput.trim() ? "pointer" : "default",
              flexShrink: 0,
            }}
          >
            Add
          </button>
        </div>
      )}
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
//  Child Order — drag-to-reorder list
// ─────────────────────────────────────────────────────────────
type ChildItem = { id: string; componentType: number };

function ChildOrderList({ items, onReorder }: { items: ChildItem[]; onReorder: (ids: string[]) => void }) {
  const [list, setList] = useState<ChildItem[]>(items);
  const [dragOver, setDragOver] = useState<number | null>(null);
  const dragIdx = useRef<number | null>(null);

  useEffect(() => { setList(items); }, [items.map((n) => n.id).join(",")]);

  const handleDragStart = (i: number) => { dragIdx.current = i; };

  const handleDragOver = (e: React.DragEvent, i: number) => {
    e.preventDefault();
    setDragOver(i);
  };

  const handleDrop = (dropIdx: number) => {
    if (dragIdx.current === null || dragIdx.current === dropIdx) {
      dragIdx.current = null;
      setDragOver(null);
      return;
    }
    const next = [...list];
    const [moved] = next.splice(dragIdx.current, 1);
    next.splice(dropIdx, 0, moved);
    setList(next);
    onReorder(next.map((n) => n.id));
    dragIdx.current = null;
    setDragOver(null);
  };

  const handleDragEnd = () => { dragIdx.current = null; setDragOver(null); };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 3 }}>
      {list.map((item, i) => {
        const meta = TYPE_META[item.componentType];
        const isOver = dragOver === i;
        const isDragging = dragIdx.current === i;
        return (
          <div
            key={item.id}
            draggable
            onDragStart={() => handleDragStart(i)}
            onDragOver={(e) => handleDragOver(e, i)}
            onDrop={() => handleDrop(i)}
            onDragEnd={handleDragEnd}
            style={{
              display: "flex", alignItems: "center", gap: 7,
              background: isOver ? "rgba(255,255,255,0.07)" : "rgba(255,255,255,0.03)",
              border: `1px solid ${isOver ? "rgba(255,255,255,0.15)" : "rgba(255,255,255,0.07)"}`,
              borderRadius: 7, padding: "6px 8px",
              cursor: "grab", userSelect: "none",
              opacity: isDragging ? 0.4 : 1,
              transition: "background 0.1s, border-color 0.1s, opacity 0.1s",
              transform: isOver ? "scale(1.01)" : "none",
            }}
          >
            <GripVertical size={12} color="rgba(255,255,255,0.2)" style={{ flexShrink: 0 }} />
            <span style={{ color: meta?.color ?? "#888", fontSize: 11, display: "flex", alignItems: "center", flexShrink: 0 }}>{meta?.icon}</span>
            <span style={{ color: "#888", fontSize: 11, flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              {meta?.label ?? "Node"}
            </span>
            <span style={{ fontSize: 9, color: "rgba(255,255,255,0.12)", flexShrink: 0 }}>#{i + 1}</span>
          </div>
        );
      })}
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
    const childEdges = edges.filter((e) => e.source === node.id && e.type !== "interaction");
    if (childEdges.length < 2) return null;
    const childItems: ChildItem[] = childEdges
      .map((e) => nodes.find((n) => n.id === e.target))
      .filter(Boolean)
      .map((n) => ({ id: n!.id, componentType: n!.data.componentType as number }));
    return (
      <div style={fieldWrap}>
        <label style={labelStyle}>Child Order</label>
        <ChildOrderList
          items={childItems}
          onReorder={(ids) => reorderChildEdges(node.id, ids)}
        />
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
    if (d.componentType === -5) {
      return <WebhookProperties nodeId={node.id} d={d as Record<string, unknown>} />;
    }
    if (d.componentType === -6) {
      return <ScheduleProperties nodeId={node.id} d={d as Record<string, unknown>} updateNodeData={updateNodeData as (id: string, data: Record<string, unknown>) => void} />;
    }
    if (d.componentType === -3) {
      return (
        <>
          {textareaField("Content", "content", "Your message text… (supports markdown)", 4)}
          {textField("Username Override", "username", "Custom display name")}
          {textField("Avatar URL Override", "avatar_url", "https://example.com/avatar.png")}
          {checkboxField("Text-to-Speech (TTS)", "tts")}
          <div style={{ marginTop: 6, padding: "8px 10px", borderRadius: 7, background: "rgba(16,185,129,0.05)", border: "1px solid rgba(16,185,129,0.12)" }}>
            <div style={{ color: "#10b981", fontSize: 10, fontWeight: 700, marginBottom: 3, textTransform: "uppercase", letterSpacing: "0.06em" }}>How to use</div>
            <div style={{ color: "#404040", fontSize: 11, lineHeight: 1.55 }}>
              Connect a <strong style={{ color: "#888" }}>Bot</strong> node's green handle to this node's left handle to send this message via your bot.
            </div>
          </div>
        </>
      );
    }
    if (d.componentType === -4) {
      return (
        <>
          {textField("Modal Title", "title", "Enter a title…")}
          {textField("Custom ID", "custom_id", "my_modal_id")}
          {childOrder()}
          <div style={{ marginTop: 6, padding: "8px 10px", borderRadius: 7, background: "rgba(59,130,246,0.05)", border: "1px solid rgba(59,130,246,0.12)" }}>
            <div style={{ color: "#3b82f6", fontSize: 10, fontWeight: 700, marginBottom: 3, textTransform: "uppercase", letterSpacing: "0.06em" }}>How to use</div>
            <div style={{ color: "#404040", fontSize: 11, lineHeight: 1.55 }}>
              Draw an amber edge from a <strong style={{ color: "#888" }}>Button</strong> to this node, then set the mode to <strong style={{ color: "#888" }}>Open Modal</strong>. Add <strong style={{ color: "#888" }}>Action Row → Text Input</strong> children for form fields.
            </div>
          </div>
        </>
      );
    }
    // ── CV2 Forms ──────────────────────────────────────────────────────────
    if ((d.componentType as number) === 13) {
      return (<>{textField("Filename / URL", "filename", "attachment.png")}{textField("Description", "description", "What this file contains…")}{checkboxField("Spoiler (blur)", "spoiler")}</>);
    }
    if ((d.componentType as number) === 20) {
      return (<>{textField("Label", "label", "Check me")}{textField("Value (unique key)", "value", "option_a")}{checkboxField("Checked by default", "defaultChecked")}</>);
    }
    if ((d.componentType as number) === 21) {
      return (<>{textField("Group Label", "label", "Pick options…")}{checkboxField("Required", "required")}{childOrder()}</>);
    }
    if ((d.componentType as number) === 22) {
      return (<>{textField("Label", "label", "Option A")}{textField("Value (unique key)", "value", "option_a")}{checkboxField("Selected by default", "defaultSelected")}</>);
    }
    if ((d.componentType as number) === 23) {
      return (<>{textField("Group Label", "label", "Choose one…")}{checkboxField("Required", "required")}{childOrder()}</>);
    }
    if ((d.componentType as number) === 24) {
      return textField("Label Text", "label", "Full Name");
    }
    if ((d.componentType as number) === 25) {
      return (<>{textField("Label", "label", "Upload a file")}{textField("Custom ID", "custom_id", "file_upload_1")}{checkboxField("Required", "required")}</>);
    }

    // ── Automation Triggers ────────────────────────────────────────────────
    if ((d.componentType as number) === -10) {
      const EVENT_OPTIONS = [
        "messageCreate", "messageUpdate", "messageDelete",
        "guildMemberAdd", "guildMemberRemove", "guildMemberUpdate",
        "messageReactionAdd", "messageReactionRemove",
        "voiceStateUpdate", "presenceUpdate",
        "guildBanAdd", "guildBanRemove",
        "channelCreate", "channelDelete",
        "roleCreate", "roleDelete",
        "threadCreate", "guildCreate", "guildDelete",
        "autoModerationActionExecution",
      ];
      return (
        <>
          {selectField("Gateway Event", "event", EVENT_OPTIONS)}
          <div style={{ padding: "8px 10px", borderRadius: 8, background: "rgba(139,92,246,0.05)", border: "1px solid rgba(139,92,246,0.15)", marginBottom: 14 }}>
            <div style={{ color: "#8b5cf6", fontSize: 10, fontWeight: 700, marginBottom: 3, textTransform: "uppercase", letterSpacing: "0.06em" }}>Automation Flow</div>
            <div style={{ color: "#404040", fontSize: 11, lineHeight: 1.55 }}>
              Connect the right handle → an Action node to define what happens when this event fires.
            </div>
          </div>
        </>
      );
    }
    if ((d.componentType as number) === -11) {
      return (
        <>
          {textField("Command Name", "name", "greet")}
          {textField("Description", "description", "Greets a server member")}
          <div style={{ padding: "8px 10px", borderRadius: 8, background: "rgba(99,102,241,0.05)", border: "1px solid rgba(99,102,241,0.15)", marginBottom: 14 }}>
            <div style={{ color: "#6366f1", fontSize: 10, fontWeight: 700, marginBottom: 3, textTransform: "uppercase", letterSpacing: "0.06em" }}>Slash Command</div>
            <div style={{ color: "#404040", fontSize: 11, lineHeight: 1.55 }}>
              The bot will register <code style={{ color: "#818cf8", fontSize: 10 }}>/{(d.name as string) || "command"}</code> on startup. Connect → a Reply action to respond.
            </div>
          </div>
        </>
      );
    }
    if ((d.componentType as number) === -12) {
      return (
        <>
          {selectField("Trigger Type", "triggerType", ["button", "selectMenu", "modalSubmit", "autocomplete"])}
          {textField("Custom ID (match pattern)", "custom_id", "my_button_id")}
          <div style={{ padding: "8px 10px", borderRadius: 8, background: "rgba(245,158,11,0.05)", border: "1px solid rgba(245,158,11,0.15)", marginBottom: 14 }}>
            <div style={{ color: "#f59e0b", fontSize: 10, fontWeight: 700, marginBottom: 3, textTransform: "uppercase", letterSpacing: "0.06em" }}>Interaction Trigger</div>
            <div style={{ color: "#404040", fontSize: 11, lineHeight: 1.55 }}>
              Fires when a user clicks a button or interacts with a component whose custom_id matches.
            </div>
          </div>
        </>
      );
    }

    // ── Automation Actions ─────────────────────────────────────────────────
    if ((d.componentType as number) === -20) {
      return (
        <>
          {textareaField("Message Content", "content", "Hello {{user.username}}! Welcome!", 4)}
          {selectField("Target Channel", "channelMode", ["same", "specific", "from_variable"])}
          {(d.channelMode as string) === "specific" && textField("Channel ID", "channelId", "123456789")}
          {(d.channelMode as string) === "from_variable" && textField("Variable Name", "channelIdVar", "channelId")}
          {checkboxField("Ephemeral (only visible to trigger user)", "ephemeral")}
        </>
      );
    }
    if ((d.componentType as number) === -21) {
      return (
        <>
          {selectField("Message to Edit", "messageIdMode", ["from_trigger", "specific", "from_variable"])}
          {(d.messageIdMode as string) === "specific" && textField("Message ID", "messageId", "123456789")}
          {(d.messageIdMode as string) === "from_variable" && textField("Variable Name", "messageIdVar", "messageId")}
          {textareaField("New Content", "content", "Updated content…", 4)}
        </>
      );
    }
    if ((d.componentType as number) === -22) {
      return (
        <>
          {selectField("Message to Delete", "messageIdMode", ["from_trigger", "specific", "from_variable"])}
          {(d.messageIdMode as string) === "specific" && textField("Message ID", "messageId", "123456789")}
          {numberField("Delay (seconds)", "delaySeconds", 0, 86400)}
        </>
      );
    }
    if ((d.componentType as number) === -23 || (d.componentType as number) === -24) {
      return (
        <>
          {textField("Role ID", "roleId", "123456789")}
          {textField("Role Name (display only)", "roleName", "Members")}
          {selectField("Target User", "userMode", ["from_trigger", "specific", "from_variable"])}
          {(d.userMode as string) === "specific" && textField("User ID", "userId", "123456789")}
        </>
      );
    }
    if ((d.componentType as number) === -25) {
      return (
        <>
          {selectField("Action", "mode", ["kick", "ban", "unban", "timeout"])}
          {(d.mode as string) === "timeout" && numberField("Duration (seconds)", "timeoutDuration", 1, 2419200)}
          {textField("Reason", "reason", "Violated server rules")}
          {selectField("Target User", "userMode", ["from_trigger", "specific"])}
          {(d.userMode as string) === "specific" && textField("User ID", "userId", "123456789")}
        </>
      );
    }
    if ((d.componentType as number) === -26) {
      return (
        <>
          {selectField("Target User", "userMode", ["from_trigger", "specific", "from_variable"])}
          {(d.userMode as string) === "specific" && textField("User ID", "userId", "123456789")}
          {textareaField("Message Content", "content", "Hello {{user.username}}!", 4)}
        </>
      );
    }
    if ((d.componentType as number) === -27) {
      return (
        <>
          {textField("Emoji", "emoji", "👍 or :thumbsup:")}
          {selectField("Target Message", "messageIdMode", ["from_trigger", "specific", "from_variable"])}
          {(d.messageIdMode as string) === "specific" && textField("Message ID", "messageId", "123456789")}
        </>
      );
    }
    if ((d.componentType as number) === -28) {
      return (
        <>
          {textField("Thread Name", "name", "Discussion Thread")}
          {selectField("Auto-Archive After", "autoArchiveDuration", ["60", "1440", "4320", "10080"])}
          {checkboxField("Private Thread", "isPrivate")}
          {selectField("From Message", "messageIdMode", ["from_trigger", "specific"])}
          {(d.messageIdMode as string) === "specific" && textField("Message ID", "messageId", "123456789")}
        </>
      );
    }
    if ((d.componentType as number) === -29) {
      return (
        <>
          {selectField("Reply Mode", "mode", ["reply", "ephemeral", "followup", "defer", "defer_ephemeral", "update"])}
          {(d.mode as string) !== "defer" && (d.mode as string) !== "defer_ephemeral" && textareaField("Content", "content", "Response text…", 4)}
        </>
      );
    }
    if ((d.componentType as number) === -30) {
      return (
        <>
          {selectField("Action", "action", ["pin", "unpin"])}
          {selectField("Target Message", "messageIdMode", ["from_trigger", "specific"])}
          {(d.messageIdMode as string) === "specific" && textField("Message ID", "messageId", "123456789")}
        </>
      );
    }
    if ((d.componentType as number) === -31) {
      return (
        <>
          {selectField("Channel Type", "channelType", ["text", "voice", "category", "announcement", "forum", "stage"])}
          {textField("Channel Name", "name", "new-channel")}
          {textField("Store Result As", "storeAs", "newChannel")}
        </>
      );
    }
    if ((d.componentType as number) === -32) {
      return (
        <>
          {selectField("Target User", "userMode", ["from_trigger", "specific", "from_variable"])}
          {(d.userMode as string) === "specific" && textField("User ID", "userId", "123456789")}
          {textField("Store Result As", "storeAs", "member")}
        </>
      );
    }

    // ── Flow Control ───────────────────────────────────────────────────────
    if ((d.componentType as number) === -33) {
      const CONDITION_TYPES = [
        "hasRole", "notHasRole", "messageContains", "messageStartsWith",
        "messageMatchesRegex", "isBot", "isNotBot", "channelIs", "userIs",
        "memberJoinedBefore", "custom",
      ];
      return (
        <>
          {selectField("Condition Type", "conditionType", CONDITION_TYPES)}
          {textField("Value", "value", "Role ID, keyword, or expression…")}
          <div style={{ padding: "8px 10px", borderRadius: 8, background: "rgba(245,158,11,0.05)", border: "1px solid rgba(245,158,11,0.15)", marginBottom: 14 }}>
            <div style={{ color: "#f59e0b", fontSize: 10, fontWeight: 700, marginBottom: 3, textTransform: "uppercase", letterSpacing: "0.06em" }}>Branching</div>
            <div style={{ color: "#404040", fontSize: 11, lineHeight: 1.55 }}>
              True branch (green handle) and False branch (red handle) on the right side. Connect each to different action chains.
            </div>
          </div>
        </>
      );
    }
    if ((d.componentType as number) === -34) {
      return (
        <>
          {numberField("Duration", "duration", 0, 86400)}
          {selectField("Unit", "unit", ["seconds", "minutes", "hours"])}
        </>
      );
    }
    if ((d.componentType as number) === -35) {
      return (
        <>
          {selectField("Operation", "operation", ["set", "get", "increment", "decrement", "append", "delete", "toggle"])}
          {textField("Variable Name", "varName", "myVar")}
          {(d.operation as string) !== "delete" && (d.operation as string) !== "get" && textField("Value", "value", "Hello world or {{event.content}}")}
        </>
      );
    }
    if ((d.componentType as number) === -36) {
      return (
        <>
          {selectField("Method", "method", ["GET", "POST", "PUT", "PATCH", "DELETE"])}
          {textField("URL", "url", "https://api.example.com/endpoint")}
          {textareaField("Request Body (JSON)", "body", '{"key": "value"}', 3)}
          {textField("Store Response As", "storeAs", "response")}
        </>
      );
    }
    if ((d.componentType as number) === -37) {
      const choices = (d.choices as string[]) ?? [];
      return (
        <>
          <div style={fieldWrap}>
            <label style={labelStyle}>Choices (one per line)</label>
            <textarea
              value={choices.join("\n")}
              placeholder={"option one\noption two\noption three"}
              onChange={(e) => updateNodeData(node.id, { choices: e.target.value.split("\n").filter((s) => s.trim()) })}
              rows={5}
              style={{ ...inputStyle, resize: "vertical", lineHeight: 1.6 }}
            />
            <div style={{ color: "#3a3a3a", fontSize: 10, marginTop: 4 }}>{choices.length} choice{choices.length !== 1 ? "s" : ""}</div>
          </div>
          {textField("Store Result As", "storeAs", "randomPick")}
        </>
      );
    }

    switch (d.componentType) {
      case 17:
        return (<>{colorField("Accent Color", "accent_color")}{checkboxField("Spoiler (blur content)", "spoiler")}{childOrder()}</>);
      case 9:
        return childOrder();
      case 10:
        return textareaField("Content (Markdown)", "content", "Enter markdown text…");
      case 11:
        return (
          <>
            <ImageUploadField
              label="Image"
              value={(d.url as string) ?? ""}
              onChange={(url) => updateNodeData(node.id, { url })}
            />
            {textField("Alt Description", "description", "Describe the image…")}
          </>
        );
      case 12: {
        const items = (d.items as { url: string }[]) ?? [];
        return (
          <GalleryUploadField
            items={items}
            onChange={(newItems) => updateNodeData(node.id, { items: newItems })}
          />
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
        return (
          <>
            {textField("Title", "title", "Embed title…")}
            {textareaField("Description", "description", "Embed description…")}
            {colorField("Accent Color", "color")}
            {textField("URL (title link)", "url", "https://example.com")}
            {textField("Author Name", "author", "Author…")}
            {textField("Footer Text", "footer", "Footer…")}
            <ImageUploadField
              label="Image"
              value={(d.imageUrl as string) ?? ""}
              onChange={(url) => updateNodeData(node.id, { imageUrl: url })}
            />
            <ImageUploadField
              label="Thumbnail"
              value={(d.thumbnailUrl as string) ?? ""}
              onChange={(url) => updateNodeData(node.id, { thumbnailUrl: url })}
            />
            {checkboxField("Show Timestamp", "timestamp")}
            {embedFieldsEditor()}
          </>
        );
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
          {d.componentType === -1 ? "Bot config" : d.componentType === -2 ? "Flow config" : d.componentType === -6 ? "Schedule config" : "Properties"}
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
              {d.componentType === -1 ? "Advanced · Bot" : d.componentType === -2 ? "Platform · Interactive" : d.componentType === -6 ? "Automation · Scheduled Send" : `Component type ${d.componentType}`}
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
