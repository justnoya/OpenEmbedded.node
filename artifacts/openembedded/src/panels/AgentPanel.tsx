// @ts-nocheck
import { useState, useRef, useEffect, useCallback } from "react";
import { Plus, Mic, Square, ChevronDown } from "lucide-react";

/* ── Message model ──────────────────────────────────────────────────────── */
type Msg =
  | { type: "agent"; text: string; ts: Date }
  | { type: "user";  text: string; ts: Date };

/* ── Knowledge base ─────────────────────────────────────────────────────── */
const KB: Record<string, string> = {
  greeting:
    "Hey! I can help you design Discord Components V2 messages — simple text cards to complex interactive flows with buttons, selects, and modals.\n\nWhat would you like to build?",
  container:
    "**Container** is the root wrapper for every CV2 message.\n\n→ Connect a **Bot** or **Webhook** to its left handle to send it.\n→ Add child nodes (TextDisplay, Section, ActionRow…) from its right handle.",
  text:
    "**TextDisplay** renders markdown text inside your embed.\n\nDrop it inside a Container, Section, or Embed. Supports **bold**, *italic*, `code`, and > blockquotes.",
  button:
    "**Buttons** live inside an ActionRow.\n\n1. Add an ActionRow inside your Container\n2. Add Button nodes inside the ActionRow\n3. For click interactions, drag the amber handle → response Container or Modal.\n\nStyles: Primary · Secondary · Success · Danger · Link",
  actionrow:
    "**ActionRow** is a horizontal tray for interactive components — up to 5 buttons or 1 select menu.\n\nPlace inside a Container, then nest Button or SelectMenu inside it.",
  select:
    "**Select Menu** shows a dropdown. Types:\n• String Select — custom options you define\n• User / Role / Channel Select — Discord-native pickers\n\nAdd inside ActionRow and wire the amber handle for responses.",
  section:
    "**Section** splits a row into main content + a side thumbnail.\n\n→ Add TextDisplay on the left\n→ Add a Thumbnail for the right-side image",
  separator:
    "**Separator** adds spacing between blocks — optionally with a visible divider line.\n\nSize: Small · Medium · Large.",
  webhook:
    "**Webhook** relays messages to Discord via a webhook URL.\n\n1. Paste your Discord webhook URL into the node\n2. Wire: Schedule (optional) → Webhook → Container",
  bot:
    "**Bot** sends messages through your connected bot account.\n\nEnter your token in Properties, select a server + channel, then wire Bot → Container and hit Send.",
  schedule:
    "**Schedule** automates message delivery.\n• Cron — repeating schedule\n• Once — specific date/time\n\nConnect to a Webhook node to trigger the send.",
  modal:
    "**Modal** is a popup form triggered by a button click.\n\n1. Add a Button (action: Open Modal)\n2. Create a Modal node → connect from the button's amber handle\n3. Add ActionRow → TextInput inside Modal",
  connect:
    "To connect nodes:\n1. Hover a node to reveal its right handle (white dot)\n2. Drag from that handle to the left handle of the target\n\nKey rules:\n• Container ← Bot / Webhook\n• Container → TextDisplay, Section, ActionRow, Separator\n• ActionRow → Button, SelectMenu, TextInput\n• Section → TextDisplay, Thumbnail",
  send:
    "To send your message:\n\n**Via Webhook** — wire Webhook → Container, then click Send in Properties.\n\n**Via Bot** — select guild + channel in Properties, wire Bot → Container, click Send.\n\n**Scheduled** — wire Schedule → Webhook → Container.",
  start:
    "Fastest way to get started:\n\n1. Add a **Container** node to the canvas\n2. Drop a **TextDisplay** inside it\n3. Add a **Bot** or **Webhook** node and wire it → Container\n4. Click **Send** in the right panel ✈\n\nFor richer layouts, nest Section + Thumbnail inside Container.",
  interactions:
    "**Persistent Interactions** let buttons respond 24/7 — even months after sending.\n\n1. Connect a Button → Container via an **amber interaction edge**\n2. In the Bot Properties panel, open **Go Live**\n3. Click **Deploy Interactions**\n4. Paste the endpoint URL into your Discord app's Interactions Endpoint URL\n\nButtons now respond forever without a running bot process.",
};

function findResponse(q: string): string {
  const s = q.toLowerCase();
  const rules: [string[], string][] = [
    [["hello", "hi ", "hey", "greet", "morning", "evening", "help", "capabilities", "what can"], "greeting"],
    [["container", "wrapper", "outer", "cv2"], "container"],
    [["text display", "textdisplay", "text node", "markdown", "add text"], "text"],
    [["button", "btn"], "button"],
    [["action row", "actionrow", "button row"], "actionrow"],
    [["select", "dropdown", "user select", "role select", "channel select"], "select"],
    [["section", "side by side", "thumbnail"], "section"],
    [["separator", "divider", "spacer"], "separator"],
    [["webhook"], "webhook"],
    [["bot node", "bot account", "send via bot", "bot token"], "bot"],
    [["schedule", "cron", "automat", "daily", "recurring"], "schedule"],
    [["modal", "popup", "dialog", "form", "text input"], "modal"],
    [["connect", "link", "drag", "handle", "connection rule", "wire"], "connect"],
    [["send", "publish", "post", "deliver", "how to send"], "send"],
    [["start", "begin", "first message", "get started", "quick start", "how do i"], "start"],
    [["interaction", "persistent", "live", "24/7", "forever", "go live"], "interactions"],
  ];
  for (const [keys, kb] of rules) {
    if (keys.some((k) => s.includes(k))) return KB[kb] ?? KB.greeting;
  }
  return "I can help with:\n\n• Node types and what they do\n• How to connect nodes\n• Sending via Bot or Webhook\n• Buttons, modals, and interactive flows\n• Scheduled automation\n• Persistent 24/7 interactions\n\nTry asking **\"How do I add a button?\"** or **\"How do I send my message?\"**";
}

/* ── Markdown renderer ──────────────────────────────────────────────────── */
function Md({ text }: { text: string }) {
  return (
    <>
      {text.split("\n").map((line, i) => {
        if (!line.trim()) return <div key={i} style={{ height: 5 }} />;
        const parts: React.ReactNode[] = [];
        const re = /\*\*(.+?)\*\*/g;
        let m: RegExpExecArray | null, last = 0, k = 0;
        while ((m = re.exec(line)) !== null) {
          if (m.index > last) parts.push(<span key={k++}>{line.slice(last, m.index)}</span>);
          parts.push(
            <strong key={k++} style={{ color: "#e0e0e0", fontWeight: 600 }}>
              {m[1]}
            </strong>,
          );
          last = m.index + m[0].length;
        }
        if (last < line.length) parts.push(<span key={k++}>{line.slice(last)}</span>);
        return (
          <div key={i} style={{ lineHeight: 1.65 }}>
            {parts}
          </div>
        );
      })}
    </>
  );
}

/* ── Timestamp formatter ────────────────────────────────────────────────── */
function fmtTime(d: Date) {
  return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

/* ── Thinking indicator ─────────────────────────────────────────────────── */
function ThinkingDots() {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 4, padding: "2px 0" }}>
      {[0, 1, 2].map((i) => (
        <div
          key={i}
          style={{
            width: 6, height: 6, borderRadius: "50%",
            background: "#484848",
            animation: `oeAgentDot 1.2s ${i * 0.2}s ease-in-out infinite`,
          }}
        />
      ))}
    </div>
  );
}

/* ── Main component ─────────────────────────────────────────────────────── */
export function AgentPanel() {
  const WELCOME: Msg = {
    type: "agent",
    text: "Hey! I'm your OpenEmbedded assistant.\n\nAsk me about nodes, connections, sending messages, or how to set up 24/7 button interactions.",
    ts: new Date(),
  };

  const [msgs, setMsgs] = useState<Msg[]>([WELCOME]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [mode, setMode] = useState<"plan" | "build">("build");
  const scrollRef = useRef<HTMLDivElement>(null);
  const taRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [msgs, loading]);

  // Auto-grow textarea
  useEffect(() => {
    const el = taRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = Math.min(el.scrollHeight, 120) + "px";
  }, [input]);

  const handleSend = useCallback(() => {
    const text = input.trim();
    if (!text || loading) return;

    const userMsg: Msg = { type: "user", text, ts: new Date() };
    setMsgs((prev) => [...prev, userMsg]);
    setInput("");
    setLoading(true);

    const delay = 480 + Math.random() * 320;
    setTimeout(() => {
      const agentMsg: Msg = { type: "agent", text: findResponse(text), ts: new Date() };
      setMsgs((prev) => [...prev, agentMsg]);
      setLoading(false);
    }, delay);
  }, [input, loading]);

  const onKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div
      style={{
        display: "flex", flexDirection: "column", height: "100%",
        background: "#111111", overflow: "hidden",
      }}
    >
      {/* ── Header ──────────────────────────────────────────────────────── */}
      <div
        style={{
          display: "flex", alignItems: "center", gap: 9,
          padding: "11px 14px 10px",
          borderBottom: "1px solid rgba(255,255,255,0.06)",
          flexShrink: 0,
        }}
      >
        {/* Avatar */}
        <div
          style={{
            width: 28, height: 28, borderRadius: 8, flexShrink: 0,
            background: "linear-gradient(135deg, #3a3a3a, #222222)",
            border: "1px solid rgba(255,255,255,0.09)",
            display: "flex", alignItems: "center", justifyContent: "center",
          }}
        >
          <img
            src="/agent-logo.png"
            alt=""
            style={{ width: 16, height: 16, objectFit: "contain", borderRadius: 3 }}
          />
        </div>

        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: "#e0e0e0", letterSpacing: "-0.01em" }}>
            Agent
          </div>
          <div style={{ fontSize: 10, color: "#3a3a3a", marginTop: 1 }}>
            {loading ? "Thinking…" : "Ready"}
          </div>
        </div>

        {/* New chat button */}
        <button
          onClick={() => { setMsgs([WELCOME]); setInput(""); setLoading(false); }}
          title="New chat"
          style={{
            width: 28, height: 28, borderRadius: 7, flexShrink: 0,
            background: "transparent", border: "1px solid rgba(255,255,255,0.08)",
            cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
            color: "#454545",
          }}
          onMouseEnter={(e) => { const el = e.currentTarget as HTMLElement; el.style.color = "#888"; el.style.borderColor = "rgba(255,255,255,0.16)"; }}
          onMouseLeave={(e) => { const el = e.currentTarget as HTMLElement; el.style.color = "#454545"; el.style.borderColor = "rgba(255,255,255,0.08)"; }}
        >
          <Plus size={13} strokeWidth={2} />
        </button>
      </div>

      {/* ── Messages ────────────────────────────────────────────────────── */}
      <div
        ref={scrollRef}
        style={{
          flex: 1, overflowY: "auto", overflowX: "hidden",
          padding: "12px 0 4px",
          display: "flex", flexDirection: "column", gap: 2,
          scrollbarWidth: "none",
        }}
      >
        {msgs.map((msg, i) =>
          msg.type === "agent" ? (
            /* Agent message — left aligned */
            <div key={i} style={{ display: "flex", gap: 9, padding: "4px 14px", alignItems: "flex-start" }}>
              {/* Small avatar dot */}
              <div
                style={{
                  width: 22, height: 22, borderRadius: 6, flexShrink: 0, marginTop: 2,
                  background: "#1e1e1e",
                  border: "1px solid rgba(255,255,255,0.07)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                }}
              >
                <img
                  src="/agent-logo.png"
                  alt=""
                  style={{ width: 12, height: 12, objectFit: "contain", borderRadius: 2 }}
                />
              </div>

              <div style={{ flex: 1, minWidth: 0 }}>
                <div
                  style={{
                    display: "inline-block",
                    background: "#1a1a1a",
                    border: "1px solid rgba(255,255,255,0.07)",
                    borderRadius: "4px 14px 14px 14px",
                    padding: "9px 12px",
                    maxWidth: "100%",
                  }}
                >
                  <p style={{ margin: 0, fontSize: 12.5, color: "#c0c0c0", lineHeight: 1.65, wordBreak: "break-word" }}>
                    <Md text={msg.text} />
                  </p>
                </div>
                <div style={{ fontSize: 10, color: "#2e2e2e", marginTop: 4, paddingLeft: 2 }}>
                  {fmtTime(msg.ts)}
                </div>
              </div>
            </div>
          ) : (
            /* User message — right aligned */
            <div key={i} style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", padding: "4px 14px" }}>
              <div
                style={{
                  maxWidth: "80%",
                  background: "#222222",
                  border: "1px solid rgba(255,255,255,0.09)",
                  borderRadius: "14px 14px 4px 14px",
                  padding: "9px 13px",
                }}
              >
                <p style={{ margin: 0, fontSize: 12.5, color: "#d8d8d8", lineHeight: 1.6, wordBreak: "break-word" }}>
                  {msg.text}
                </p>
              </div>
              <div style={{ fontSize: 10, color: "#2e2e2e", marginTop: 4, paddingRight: 2 }}>
                {fmtTime(msg.ts)}
              </div>
            </div>
          ),
        )}

        {/* Thinking indicator */}
        {loading && (
          <div style={{ display: "flex", gap: 9, padding: "4px 14px", alignItems: "flex-start" }}>
            <div
              style={{
                width: 22, height: 22, borderRadius: 6, flexShrink: 0, marginTop: 2,
                background: "#1e1e1e", border: "1px solid rgba(255,255,255,0.07)",
                display: "flex", alignItems: "center", justifyContent: "center",
              }}
            >
              <img
                src="/agent-logo.png"
                alt=""
                style={{ width: 12, height: 12, objectFit: "contain", borderRadius: 2, opacity: 0.6 }}
              />
            </div>
            <div
              style={{
                background: "#1a1a1a", border: "1px solid rgba(255,255,255,0.07)",
                borderRadius: "4px 14px 14px 14px",
                padding: "11px 14px",
              }}
            >
              <ThinkingDots />
            </div>
          </div>
        )}
      </div>

      {/* ── Divider ─────────────────────────────────────────────────────── */}
      <div style={{ height: 1, background: "rgba(255,255,255,0.06)", flexShrink: 0 }} />

      {/* ── Input area ──────────────────────────────────────────────────── */}
      <div style={{ flexShrink: 0, background: "#0e0e0e", padding: "10px 12px 12px" }}>
        {/* Textarea */}
        <textarea
          ref={taRef}
          value={input}
          onChange={(e) => setInput(e.target.value.slice(0, 1000))}
          onKeyDown={onKeyDown}
          placeholder="Ask about nodes, connections, sending…"
          rows={1}
          style={{
            width: "100%", boxSizing: "border-box",
            background: "transparent", border: "none",
            outline: "none", resize: "none",
            color: "#c0c0c0", fontSize: 13,
            fontFamily: "inherit", lineHeight: 1.55,
            scrollbarWidth: "none",
            caretColor: "#d0d0d0",
            minHeight: 22, maxHeight: 120,
            display: "block", marginBottom: 8,
          }}
        />

        {/* Controls row */}
        <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
          {/* Mode pill */}
          <button
            onClick={() => setMode((m) => (m === "plan" ? "build" : "plan"))}
            style={{
              height: 28, padding: "0 10px", borderRadius: 7,
              background: "transparent",
              border: "1px solid rgba(255,255,255,0.09)",
              cursor: "pointer", display: "flex", alignItems: "center", gap: 4,
              color: "#606060", fontSize: 11.5, fontWeight: 600,
            }}
            onMouseEnter={(e) => { const el = e.currentTarget as HTMLElement; el.style.borderColor = "rgba(255,255,255,0.17)"; el.style.color = "#909090"; }}
            onMouseLeave={(e) => { const el = e.currentTarget as HTMLElement; el.style.borderColor = "rgba(255,255,255,0.09)"; el.style.color = "#606060"; }}
          >
            {mode === "build" ? "Build" : "Plan"}
          </button>

          {/* Model pill */}
          <div
            style={{
              height: 28, padding: "0 9px", borderRadius: 7,
              border: "1px solid rgba(255,255,255,0.07)",
              display: "flex", alignItems: "center", gap: 4,
            }}
          >
            <span style={{ fontSize: 11.5, color: "#505050", fontWeight: 500 }}>Economy</span>
            <ChevronDown size={9} color="#484848" strokeWidth={2.5} />
          </div>

          <div style={{ flex: 1 }} />

          {/* Mic */}
          <button
            style={{
              width: 28, height: 28, borderRadius: 7, flexShrink: 0,
              background: "transparent", border: "none",
              cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
              color: "#505050",
            }}
            onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.color = "#888"; }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.color = "#505050"; }}
          >
            <Mic size={14} strokeWidth={1.8} />
          </button>

          {/* Send / Stop */}
          <button
            onClick={loading ? () => setLoading(false) : handleSend}
            disabled={!loading && !input.trim()}
            style={{
              width: 32, height: 32, borderRadius: 9, flexShrink: 0,
              background: loading
                ? "rgba(255,255,255,0.08)"
                : input.trim()
                ? "#efefef"
                : "rgba(255,255,255,0.05)",
              border: "none",
              cursor: !loading && !input.trim() ? "default" : "pointer",
              display: "flex", alignItems: "center", justifyContent: "center",
              transition: "background 0.15s, box-shadow 0.15s",
              boxShadow: input.trim() && !loading ? "0 2px 8px rgba(0,0,0,0.45)" : "none",
            }}
          >
            {loading ? (
              <Square size={11} color="#888" fill="#888" strokeWidth={0} />
            ) : (
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
                stroke={input.trim() ? "#111" : "#404040"} strokeWidth="2.5"
                strokeLinecap="round" strokeLinejoin="round"
              >
                <line x1="22" y1="2" x2="11" y2="13" />
                <polygon points="22 2 15 22 11 13 2 9 22 2"
                  fill={input.trim() ? "#111" : "#404040"} stroke="none" />
              </svg>
            )}
          </button>
        </div>
      </div>

      <style>{`
        @keyframes oeAgentDot {
          0%, 100% { opacity: 0.25; transform: translateY(0); }
          50%       { opacity: 1;    transform: translateY(-3px); }
        }
      `}</style>
    </div>
  );
}
