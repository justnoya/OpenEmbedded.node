// @ts-nocheck
import { useState, useRef, useEffect, useCallback } from "react";
import {
  Plus, Mic, ChevronDown, RotateCw, ArrowUpDown,
  Box, Type, MousePointerClick, LayoutGrid, Columns2,
  Minus, Zap, ImageIcon, ListFilter, Bot, Share2,
  MoreVertical, Clock, Square,
} from "lucide-react";
import { AgentIcon } from "../canvas/AgentIcon.js";

/* ── Node icon registry ─────────────────────────────────────────────────── */
const NODE_DEFS = [
  { Icon: Box,              label: "Container"   },
  { Icon: Type,             label: "TextDisplay" },
  { Icon: MousePointerClick,label: "Button"      },
  { Icon: LayoutGrid,       label: "ActionRow"   },
  { Icon: Columns2,         label: "Section"     },
  { Icon: Minus,            label: "Separator"   },
  { Icon: Zap,              label: "Webhook"     },
  { Icon: ImageIcon,        label: "Gallery"     },
  { Icon: ListFilter,       label: "SelectMenu"  },
  { Icon: Bot,              label: "BotNode"     },
];

/* ── Message types ──────────────────────────────────────────────────────── */
type PlanningMsg  = { type: "planning"; text: string };
type AgentTextMsg = { type: "agent-text"; content: string };
type PlanRowMsg   = { type: "plan-row"; label: string };
type CountRowMsg  = { type: "count-row"; icon: "arrows" | "nodes"; count: number; label: string };
type UserMsg      = { type: "user"; content: string; minsAgo: number };
type NodeRowMsg   = { type: "node-row"; nodeKeys: number[]; count: number };
type WorkingMsg   = { type: "working"; nodeKeys: number[]; label: string };

type Msg = PlanningMsg | AgentTextMsg | PlanRowMsg | CountRowMsg | UserMsg | NodeRowMsg | WorkingMsg;

/* ── Initial conversation ───────────────────────────────────────────────── */
const SEED: Msg[] = [
  { type: "planning",   text: "Planning Discord embed structure" },
  { type: "agent-text", content: "Building everything in parallel. Let me scaffold the Container and all core nodes simultaneously." },
  { type: "plan-row",   label: "Proposed plan" },
  { type: "count-row",  icon: "arrows", count: 3, label: "actions" },
  { type: "user",       content: "Add a button with a select menu dropdown too", minsAgo: 3 },
  { type: "planning",   text: "Planning component integration and wiring" },
  { type: "agent-text", content: "Got it — ActionRow → Button + SelectMenu nodes are part of the build. Continuing the full construction in parallel." },
  { type: "node-row",   nodeKeys: [0,1,2,3,4,5,6,7,8,9], count: 11 },
  { type: "agent-text", content: "Wiring all edges — Container → TextDisplay, ActionRow → Button, ActionRow → SelectMenu — all in parallel." },
  { type: "working",    nodeKeys: [0,1,2,3,6], label: "Connecting edges." },
];

/* ── Knowledge base ─────────────────────────────────────────────────────── */
const KB: Record<string, string> = {
  greeting:   "Hello! I'm your OpenEmbedded AI Agent.\n\nI can help you design Discord Components V2 messages — from simple text blocks to complex interactive flows with buttons, selects, and modals.\n\nWhat would you like to build today?",
  container:  "**Container** is the root wrapper for every CV2 message.\n\n→ Connect a **Bot** or **Webhook** to its left handle to send it.\n→ Add child nodes (TextDisplay, Section, ActionRow…) from its right handle.",
  text:       "**TextDisplay** renders markdown text inside your embed.\n\nDrop it inside Container, Section, or Embed. Supports **bold**, *italic*, > blockquotes and `code`.",
  button:     "**Buttons** live inside an ActionRow. Workflow:\n\n1. Add ActionRow inside your Container\n2. Add Button nodes inside the ActionRow\n3. For interactions, drag the amber handle → response Container or Modal.\n\nStyles: Primary · Secondary · Success · Danger · Link",
  actionrow:  "**ActionRow** is a horizontal tray for interactive components. It holds up to 5 buttons or 1 select menu.\n\nPlace inside Container, then nest Button or SelectMenu inside it.",
  select:     "**Select Menu** shows a dropdown. Types:\n• String Select — custom options\n• User / Role / Channel Select — Discord-native pickers\n\nAdd inside ActionRow and wire the amber handle for interaction responses.",
  section:    "**Section** splits a row into main content + side thumbnail.\n\n→ TextDisplay for left area\n→ Thumbnail for right-side image",
  separator:  "**Separator** adds spacing between blocks — optionally with a visible divider line.\n\nSize: Small · Medium · Large.",
  webhook:    "**Webhook** relays messages to Discord via a webhook URL.\n\n1. Paste your Discord webhook URL\n2. Connect Schedule → Webhook → Container",
  bot:        "**Bot** sends messages through your connected bot account.\n\nSelect server + channel in Properties, then wire to Container.",
  schedule:   "**Schedule** automates message delivery.\n• Cron — repeating schedule\n• Once — specific date/time\n\nConnect to Webhook to trigger the send.",
  modal:      "**Modal** is a popup form triggered by a button click.\n\n1. Add Button (action: Open Modal)\n2. Create Modal node → connect from button amber handle\n3. Add ActionRow → TextInput inside Modal",
  connect:    "To connect nodes:\n1. Hover to reveal the right handle (white dot)\n2. Drag to the left handle of the target node\n\nRules:\n• Container ← Bot / Webhook\n• Container → TextDisplay, Section, ActionRow, Separator…\n• ActionRow → Button, SelectMenu, TextInput\n• Section → TextDisplay, Thumbnail",
  send:       "To send your message:\n\n**Via Webhook** — wire Webhook → Container, click send.\n\n**Via Bot** — select guild + channel in Properties, wire Bot → Container.\n\n**Scheduled** — wire Schedule → Webhook → Container.",
  start:      "Fastest way to build:\n\n1. Add a **Container** node\n2. Add **TextDisplay** inside it\n3. Add a **Bot** or **Webhook** → wire to Container\n4. Hit send ✈\n\nFor richer layouts, nest Section + Thumbnail inside Container.",
};

function findResponse(q: string): string {
  const s = q.toLowerCase();
  const rules: [string[], string][] = [
    [["hello","hi ","hey","greet","good morning","good evening"],       "greeting"],
    [["container","wrapper","outer","cv2"],                              "container"],
    [["text display","textdisplay","text node","markdown","add text"],   "text"],
    [["button","btn"],                                                   "button"],
    [["action row","actionrow","button row"],                            "actionrow"],
    [["select","dropdown","user select","role select","channel select"], "select"],
    [["section","side by side"],                                         "section"],
    [["separator","divider","spacer"],                                   "separator"],
    [["webhook"],                                                        "webhook"],
    [["bot node","bot account","send via bot"],                          "bot"],
    [["schedule","cron","automat","daily","recurring"],                  "schedule"],
    [["modal","popup","dialog","form"],                                  "modal"],
    [["connect","link","drag","handle","connection rule"],               "connect"],
    [["send","publish","post","deliver","how to send"],                  "send"],
    [["start","begin","first message","get started","quick start"],      "start"],
    [["help","what can","capabilities"],                                 "greeting"],
  ];
  for (const [keys, kb] of rules) {
    if (keys.some((k) => s.includes(k))) return KB[kb] ?? KB.greeting;
  }
  return "I can help with:\n\n• Node types and what they do\n• How to connect nodes\n• Sending via Bot or Webhook\n• Buttons, modals, interactive flows\n• Scheduled automation\n\nTry asking **\"How do I add a button?\"** or **\"How do I send my message?\"**";
}

/* ── Markdown renderer ─────────────────────────────────────────────────── */
function Md({ text }: { text: string }) {
  return (
    <>
      {text.split("\n").map((line, i) => {
        if (!line.trim()) return <div key={i} style={{ height: 6 }} />;
        const parts: React.ReactNode[] = [];
        const re = /\*\*(.+?)\*\*/g;
        let m: RegExpExecArray | null, last = 0, k = 0;
        while ((m = re.exec(line)) !== null) {
          if (m.index > last) parts.push(<span key={k++}>{line.slice(last, m.index)}</span>);
          parts.push(<strong key={k++} style={{ color: "#e8e8e8", fontWeight: 600 }}>{m[1]}</strong>);
          last = m.index + m[0].length;
        }
        if (last < line.length) parts.push(<span key={k++}>{line.slice(last)}</span>);
        return <div key={i} style={{ lineHeight: 1.6 }}>{parts}</div>;
      })}
    </>
  );
}

/* ── Sub-components ─────────────────────────────────────────────────────── */

function PlanningRow({ text, collapsed, onToggle }: { text: string; collapsed: boolean; onToggle: () => void }) {
  return (
    <button
      onClick={onToggle}
      style={{
        display: "flex", alignItems: "center", gap: 8,
        width: "100%", padding: "8px 14px",
        background: "rgba(255,255,255,0.025)",
        border: "none", borderRadius: 0,
        cursor: "pointer", textAlign: "left",
        transition: "background 0.12s",
      }}
      onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.04)"; }}
      onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.025)"; }}
    >
      <RotateCw
        size={13}
        color="#686868"
        style={{ flexShrink: 0, animation: "oeAgentSpin 2s linear infinite" }}
      />
      <span style={{ flex: 1, fontSize: 12.5, color: "#686868", fontWeight: 500 }}>{text}</span>
      <ChevronDown
        size={12}
        color="#484848"
        style={{ flexShrink: 0, transform: collapsed ? "rotate(-90deg)" : "rotate(0deg)", transition: "transform 0.18s" }}
      />
    </button>
  );
}

function PlanRow({ label }: { label: string }) {
  return (
    <div style={{
      display: "flex", alignItems: "center", gap: 8,
      padding: "7px 14px",
      background: "rgba(255,255,255,0.018)",
    }}>
      <svg width="13" height="13" viewBox="0 0 14 14" fill="none" style={{ flexShrink: 0 }}>
        <rect x="1" y="1" width="12" height="3" rx="1" fill="#585858" />
        <rect x="1" y="5.5" width="8" height="2" rx="1" fill="#484848" />
        <rect x="1" y="8.5" width="10" height="2" rx="1" fill="#484848" />
        <rect x="1" y="11.5" width="6" height="1.5" rx="0.75" fill="#404040" />
      </svg>
      <span style={{ flex: 1, fontSize: 12.5, color: "#686868", fontWeight: 500 }}>{label}</span>
      <ChevronDown size={12} color="#484848" />
    </div>
  );
}

function CountRow({ icon, count, label }: { icon: "arrows" | "nodes"; count: number; label: string }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 7, padding: "5px 14px" }}>
      {icon === "arrows" ? (
        <ArrowUpDown size={12} color="#505050" strokeWidth={2} />
      ) : (
        <Box size={12} color="#505050" strokeWidth={2} />
      )}
      <span style={{ fontSize: 12, color: "#505050" }}>{count} {label}</span>
    </div>
  );
}

function UserBubble({ content, minsAgo }: { content: string; minsAgo: number }) {
  return (
    <div style={{ padding: "10px 14px 4px", display: "flex", flexDirection: "column", alignItems: "flex-end" }}>
      <div style={{
        maxWidth: "82%",
        background: "#1e1e1e",
        border: "1px solid rgba(255,255,255,0.09)",
        borderRadius: "18px 18px 4px 18px",
        padding: "10px 14px",
        boxShadow: "0 2px 8px rgba(0,0,0,0.5)",
      }}>
        <p style={{ margin: 0, fontSize: 13, color: "#d8d8d8", lineHeight: 1.55, wordBreak: "break-word" }}>
          {content}
        </p>
      </div>
      <div style={{
        display: "flex", alignItems: "center", gap: 4, marginTop: 5,
      }}>
        <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
          {[0,3,6].map((cx) => [0,3,6].map((cy) => (
            <circle key={`${cx}-${cy}`} cx={1+cx} cy={1+cy} r="0.75" fill="#3a3a3a" />
          )))}
        </svg>
        <span style={{ fontSize: 10.5, color: "#3a3a3a" }}>
          {minsAgo} minute{minsAgo !== 1 ? "s" : ""} ago
        </span>
      </div>
    </div>
  );
}

function NodeIconRow({ nodeKeys, count }: { nodeKeys: number[]; count: number }) {
  return (
    <div style={{ padding: "8px 14px", display: "flex", alignItems: "center", gap: 5, overflowX: "auto", scrollbarWidth: "none" }}>
      {nodeKeys.map((k, i) => {
        const def = NODE_DEFS[k % NODE_DEFS.length];
        const { Icon } = def;
        return (
          <div key={i} title={def.label} style={{
            width: 32, height: 36, borderRadius: 7, flexShrink: 0,
            background: "#1a1a1a",
            border: "1px solid rgba(255,255,255,0.07)",
            display: "flex", alignItems: "center", justifyContent: "center",
            boxShadow: "0 1px 4px rgba(0,0,0,0.4)",
          }}>
            <Icon size={14} color="#686868" strokeWidth={1.7} />
          </div>
        );
      })}
      <span style={{ fontSize: 12, color: "#484848", marginLeft: 4, flexShrink: 0, whiteSpace: "nowrap" }}>
        {count} actions
      </span>
    </div>
  );
}

function WorkingRow({ nodeKeys, label }: { nodeKeys: number[]; label: string }) {
  return (
    <div style={{ padding: "8px 14px", display: "flex", alignItems: "center", gap: 5, overflowX: "auto", scrollbarWidth: "none" }}>
      {nodeKeys.map((k, i) => {
        const def = NODE_DEFS[k % NODE_DEFS.length];
        const { Icon } = def;
        return (
          <div key={i} title={def.label} style={{
            width: 32, height: 36, borderRadius: 7, flexShrink: 0,
            background: "#1a1a1a",
            border: "1px solid rgba(255,255,255,0.07)",
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            <Icon size={14} color="#686868" strokeWidth={1.7} />
          </div>
        );
      })}
      {/* Agent star icon at end */}
      <div style={{
        width: 32, height: 36, borderRadius: 7, flexShrink: 0,
        background: "#1a1a1a",
        border: "1px solid rgba(255,255,255,0.10)",
        display: "flex", alignItems: "center", justifyContent: "center",
      }}>
        <img src="/agent-logo.png" alt="" style={{ width: 16, height: 16, objectFit: "contain", borderRadius: 3 }} />
      </div>
      <span style={{ fontSize: 13, color: "#686868", marginLeft: 4, flexShrink: 0, fontStyle: "italic" }}>
        {label}
      </span>
    </div>
  );
}

function ThinkingRow() {
  return (
    <div style={{ padding: "8px 14px", display: "flex", alignItems: "center", gap: 5 }}>
      {[0, 1, 2, 3].map((i) => (
        <div key={i} style={{
          width: 32, height: 36, borderRadius: 7, flexShrink: 0,
          background: "#1a1a1a", border: "1px solid rgba(255,255,255,0.07)",
          display: "flex", alignItems: "center", justifyContent: "center",
          animation: `oeAgentPulse 1.4s ${i * 0.18}s ease-in-out infinite`,
        }}>
          <div style={{ width: 14, height: 14, borderRadius: 3, background: "rgba(255,255,255,0.07)" }} />
        </div>
      ))}
      <div style={{
        width: 32, height: 36, borderRadius: 7, flexShrink: 0,
        background: "#1a1a1a", border: "1px solid rgba(255,255,255,0.10)",
        display: "flex", alignItems: "center", justifyContent: "center",
        animation: "oeAgentPulse 1.4s 0.72s ease-in-out infinite",
      }}>
        <img src="/agent-logo.png" alt="" style={{ width: 16, height: 16, objectFit: "contain", borderRadius: 3, opacity: 0.7 }} />
      </div>
      <span style={{ fontSize: 13, color: "#484848", marginLeft: 4, fontStyle: "italic" }}>Working.</span>
    </div>
  );
}

/* ── Main component ─────────────────────────────────────────────────────── */
export function AgentPanel() {
  const [msgs, setMsgs] = useState<Msg[]>(SEED);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [collapsed, setCollapsed] = useState<Set<number>>(new Set());
  const [mode, setMode] = useState<"plan" | "build">("build");
  const scrollRef = useRef<HTMLDivElement>(null);
  const taRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [msgs, loading]);

  const toggleCollapse = (idx: number) => {
    setCollapsed((prev) => {
      const next = new Set(prev);
      next.has(idx) ? next.delete(idx) : next.add(idx);
      return next;
    });
  };

  const handleSend = useCallback(() => {
    const text = input.trim();
    if (!text || loading) return;
    const userMsg: UserMsg = { type: "user", content: text, minsAgo: 0 };
    setMsgs((prev) => [...prev, userMsg]);
    setInput("");
    setLoading(true);
    setTimeout(() => {
      const response = findResponse(text);
      const agentMsg: AgentTextMsg = { type: "agent-text", content: response };
      setMsgs((prev) => [...prev, agentMsg]);
      setLoading(false);
    }, 520 + Math.random() * 380);
  }, [input, loading]);

  const onKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); }
  };

  /* ── Message renderer ─────────────────────────────────────────────── */
  const renderMsg = (msg: Msg, i: number) => {
    const isCollapsed = collapsed.has(i);
    switch (msg.type) {
      case "planning":
        return (
          <div key={i}>
            <PlanningRow text={msg.text} collapsed={isCollapsed} onToggle={() => toggleCollapse(i)} />
          </div>
        );
      case "agent-text":
        return (
          <div key={i} style={{ padding: "6px 16px" }}>
            <p style={{ margin: 0, fontSize: 13, color: "#c8c8c8", lineHeight: 1.65 }}>
              <Md text={msg.content} />
            </p>
          </div>
        );
      case "plan-row":
        return <div key={i}><PlanRow label={msg.label} /></div>;
      case "count-row":
        return <div key={i}><CountRow icon={msg.icon} count={msg.count} label={msg.label} /></div>;
      case "user":
        return <UserBubble key={i} content={msg.content} minsAgo={msg.minsAgo} />;
      case "node-row":
        return <NodeIconRow key={i} nodeKeys={msg.nodeKeys} count={msg.count} />;
      case "working":
        return <WorkingRow key={i} nodeKeys={msg.nodeKeys} label={msg.label} />;
      default:
        return null;
    }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%", background: "#111111", overflow: "hidden" }}>

      {/* ── Agent identity strip ─────────────────────────────────────── */}
      <div style={{
        display: "flex", alignItems: "center", gap: 8,
        padding: "10px 14px 9px",
        borderBottom: "1px solid rgba(255,255,255,0.06)",
        flexShrink: 0,
      }}>
        {/* Logo */}
        <img
          src="/agent-logo.png"
          alt="Agent"
          style={{ width: 22, height: 22, borderRadius: 5, objectFit: "cover", flexShrink: 0 }}
        />
        <span style={{ fontSize: 13.5, fontWeight: 700, color: "#e0e0e0", letterSpacing: "-0.02em", flex: 1 }}>
          Agent
        </span>
        {/* Header action icons */}
        {([Share2, MoreVertical] as const).map((Icon, idx) => (
          <button key={idx} style={{
            width: 28, height: 28, borderRadius: 7,
            background: "transparent", border: "none", cursor: "pointer",
            display: "flex", alignItems: "center", justifyContent: "center",
            color: "#454545", flexShrink: 0,
          }}
            onMouseEnter={(e) => { const el = e.currentTarget as HTMLElement; el.style.color = "#888"; el.style.background = "rgba(255,255,255,0.05)"; }}
            onMouseLeave={(e) => { const el = e.currentTarget as HTMLElement; el.style.color = "#454545"; el.style.background = "transparent"; }}
          >
            <Icon size={14} strokeWidth={1.8} />
          </button>
        ))}
      </div>

      {/* ── Chat scroll area ─────────────────────────────────────────── */}
      <div
        ref={scrollRef}
        style={{
          flex: 1, overflowY: "auto", overflowX: "hidden",
          display: "flex", flexDirection: "column",
          paddingTop: 6, paddingBottom: 6,
          scrollbarWidth: "none",
        }}
      >
        {msgs.map((msg, i) => renderMsg(msg, i))}
        {loading && <ThinkingRow />}
      </div>

      {/* ── Bottom input bar ─────────────────────────────────────────── */}
      <div style={{
        flexShrink: 0,
        borderTop: "1px solid rgba(255,255,255,0.07)",
        background: "#0e0e0e",
      }}>
        {/* Textarea row */}
        <div style={{ padding: "10px 14px 0" }}>
          <textarea
            ref={taRef}
            value={input}
            onChange={(e) => setInput(e.target.value.slice(0, 500))}
            onKeyDown={onKeyDown}
            placeholder="Make, test, iterate…"
            rows={2}
            style={{
              width: "100%", boxSizing: "border-box",
              background: "transparent", border: "none",
              outline: "none", resize: "none",
              color: "#c0c0c0", fontSize: 13,
              fontFamily: "inherit", lineHeight: 1.5,
              scrollbarWidth: "none",
              caretColor: "#d0d0d0",
            }}
          />
        </div>

        {/* Controls row */}
        <div style={{
          display: "flex", alignItems: "center", gap: 6,
          padding: "6px 10px 10px",
        }}>
          {/* + button */}
          <button style={{
            width: 30, height: 30, borderRadius: 8, flexShrink: 0,
            background: "transparent",
            border: "1px solid rgba(255,255,255,0.10)",
            cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
            color: "#686868",
          }}
            onMouseEnter={(e) => { const el = e.currentTarget as HTMLElement; el.style.color = "#aaa"; el.style.borderColor = "rgba(255,255,255,0.18)"; }}
            onMouseLeave={(e) => { const el = e.currentTarget as HTMLElement; el.style.color = "#686868"; el.style.borderColor = "rgba(255,255,255,0.10)"; }}
          >
            <Plus size={14} strokeWidth={2} />
          </button>

          {/* Plan / Build toggle */}
          <button
            onClick={() => setMode((m) => (m === "plan" ? "build" : "plan"))}
            style={{
              height: 30, padding: "0 10px", borderRadius: 8, flexShrink: 0,
              background: mode === "plan" ? "rgba(255,255,255,0.07)" : "transparent",
              border: "1px solid rgba(255,255,255,0.10)",
              cursor: "pointer", display: "flex", alignItems: "center",
              color: "#888", fontSize: 12.5, fontWeight: 600, gap: 4,
            }}
            onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.borderColor = "rgba(255,255,255,0.18)"; }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.borderColor = "rgba(255,255,255,0.10)"; }}
          >
            {mode === "plan" ? "Plan" : "Build"}
          </button>

          {/* Mode selector */}
          <div style={{
            height: 30, padding: "0 9px", borderRadius: 8, flexShrink: 0,
            border: "1px solid rgba(255,255,255,0.08)",
            display: "flex", alignItems: "center", gap: 5, cursor: "default",
          }}>
            {/* 6-dot grid */}
            <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
              {[0,4].map((cx) => [0,4,8].map((cy) => (
                <circle key={`${cx}-${cy}`} cx={1+cx} cy={1+cy} r="1" fill="#505050" />
              )))}
            </svg>
            <span style={{ fontSize: 12, color: "#606060", fontWeight: 500 }}>Economy</span>
            <ChevronDown size={10} color="#505050" strokeWidth={2} />
          </div>

          <div style={{ flex: 1 }} />

          {/* Mic */}
          <button style={{
            width: 30, height: 30, borderRadius: 8, flexShrink: 0,
            background: "transparent", border: "none",
            cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
            color: "#585858",
          }}
            onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.color = "#909090"; }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.color = "#585858"; }}
          >
            <Mic size={15} strokeWidth={1.8} />
          </button>

          {/* Send / Stop button */}
          <button
            onClick={loading ? () => setLoading(false) : handleSend}
            style={{
              width: 34, height: 34, borderRadius: 10, flexShrink: 0,
              background: loading
                ? "rgba(255,255,255,0.10)"
                : input.trim()
                ? "#efefef"
                : "rgba(255,255,255,0.06)",
              border: "none", cursor: "pointer",
              display: "flex", alignItems: "center", justifyContent: "center",
              transition: "background 0.15s, box-shadow 0.15s",
              boxShadow: input.trim() && !loading ? "0 2px 8px rgba(0,0,0,0.5)" : "none",
            }}
            onMouseEnter={(e) => {
              if (!loading && input.trim()) (e.currentTarget as HTMLElement).style.background = "#ffffff";
            }}
            onMouseLeave={(e) => {
              if (!loading && input.trim()) (e.currentTarget as HTMLElement).style.background = "#efefef";
            }}
          >
            {loading ? (
              <Square size={12} color="#909090" fill="#909090" strokeWidth={0} />
            ) : (
              <SendIcon active={!!input.trim()} />
            )}
          </button>
        </div>
      </div>

      <style>{`
        @keyframes oeAgentSpin {
          from { transform: rotate(0deg); }
          to   { transform: rotate(360deg); }
        }
        @keyframes oeAgentPulse {
          0%, 100% { opacity: 0.35; }
          50%       { opacity: 0.7; }
        }
      `}</style>
    </div>
  );
}

function SendIcon({ active }: { active: boolean }) {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none"
      stroke={active ? "#111111" : "#484848"} strokeWidth="2.5"
      strokeLinecap="round" strokeLinejoin="round">
      <line x1="22" y1="2" x2="11" y2="13" />
      <polygon points="22 2 15 22 11 13 2 9 22 2" fill={active ? "#111111" : "#484848"} stroke="none" />
    </svg>
  );
}
