// @ts-nocheck
import { useState, useRef, useEffect, useCallback } from "react";
import { Settings, Paperclip, User, X } from "lucide-react";
import { AgentIcon } from "../canvas/AgentIcon.js";

interface Message {
  role: "agent" | "user";
  content: string;
  time: string;
}

function formatTime(d: Date) {
  return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

const AGENT_KNOWLEDGE = {
  greeting: ["Hello! I'm your AI assistant for OpenEmbedded.\n\nI can help you build Discord messages visually — from simple text posts to complex Components V2 layouts with buttons, embeds, and galleries.\n\nWhat would you like to know or do today?"],
  help: ["Here's what I can help you with:\n\n• **Node guidance** — what each node does and when to use it\n• **Connection rules** — what can connect to what\n• **Building layouts** — step-by-step message templates\n• **Interactive flows** — buttons, select menus, and modals\n• **Automation** — scheduled messages with webhooks\n• **Troubleshooting** — why a connection isn't working\n\nJust ask a question or describe what you're trying to build!"],
  container: ["**Container** is the root wrapper for every Components V2 message. Think of it as the outer shell — everything else goes inside it.\n\n→ Connect a **Bot** or **Webhook** node to the Container's left handle to send it.\n→ Add child nodes (TextDisplay, Section, ActionRow, etc.) to its right handle."],
  embed: ["**Embed (CV2)** creates a classic Discord embed inside your Container. It supports:\n• Title and description\n• Author and footer\n• Accent color\n\nConnect it as a child of a Container."],
  text: ["**Text Display** is a plain-text block — perfect for markdown content.\n\nDrop it inside a **Container**, **Section**, or **Embed** node. It renders Discord markdown, so you can use **bold**, *italic*, > quotes, and code blocks."],
  button: ["**Buttons** live inside an **Action Row** node. The workflow is:\n\n1. Add an **Action Row** inside your Container\n2. Add one or more **Button** nodes inside the Action Row\n3. For interactive responses, drag from the amber handle to a response Container or Modal\n\nButton styles: Primary · Secondary · Success · Danger · Link"],
  actionrow: ["**Action Row** is a horizontal container for interactive components. It holds up to 5 buttons or 1 select menu.\n\nPlace Action Row inside your **Container**, then add **Button** or **Select Menu** nodes inside it."],
  select: ["**Select Menus** let users pick from a dropdown list. Types available:\n• String Select — custom options you define\n• User / Role / Mentionable / Channel Select — Discord-native pickers\n\nAdd them inside an **Action Row** and drag the amber handle to define the interaction response flow."],
  section: ["**Section** splits a row into main content + a side thumbnail accessory.\n\nInside Section, connect:\n→ **TextDisplay** for the main content area\n→ **Thumbnail** for the right-side image"],
  thumbnail: ["**Thumbnail** attaches a small image to the right side of a **Section** node.\n\nPaste an image URL in the Properties panel."],
  gallery: ["**Media Gallery** displays a grid of images in your message. Add 1–10 image URLs in the Properties panel.\n\nConnect it inside a **Container** or **Section**."],
  separator: ["**Separator** adds vertical spacing between blocks — optionally with a visible horizontal divider line.\n\nSize options: Small · Medium · Large."],
  webhook: ["**Webhook** is a relay node — it accepts a trigger from a **Schedule** and sends a message to Discord via a webhook URL.\n\nWorkflow:\n1. Paste your Discord webhook URL\n2. Connect a **Schedule** node to its left handle\n3. Connect its right handle to a **Container** or **Embed**"],
  bot: ["**Bot** lets you send messages through your connected OpenEmbedded bot account. Configure it in the Properties panel by selecting a server and channel.\n\nConnect its right handle to a **Container** or **Embed**."],
  schedule: ["**Schedule** automates when a message is sent. You can set:\n• **Cron** — repeating (every hour, daily at 9 AM, etc.)\n• **Once** — send at a specific date and time\n\nConnect it to a **Webhook** relay to trigger the send."],
  modal: ["**Modal** is a popup dialog triggered by a button click. Workflow:\n\n1. Add a **Button** (action: Open Modal)\n2. Create a **Modal** node and connect to the button's amber handle\n3. Add **Action Row → Text Input** inside the Modal"],
  textinput: ["**Text Input** is a form field inside a **Modal**. It can be Short (single-line) or Paragraph (multi-line).\n\nAdd it inside an **Action Row** that lives inside a **Modal** node."],
  connect: ["To connect two nodes:\n1. Hover a node to reveal its **right handle** (white dot)\n2. Drag to the **left handle** of the target node\n3. Valid connections snap automatically\n\nRules:\n• Container ← Bot / Webhook\n• Container children: TextDisplay, Section, ActionRow, Thumbnail, MediaGallery, Separator, Embed\n• ActionRow children: Button, SelectMenu, TextInput\n• Section children: TextDisplay, Thumbnail\n• Button amber → Container / Embed / Modal"],
  send: ["To send your message to Discord:\n\n**Via Webhook:** Webhook node → connect to Container → send icon or use Schedule.\n\n**Via Bot:** Bot node → select server + channel in Properties → connect to Container → send.\n\n**Via OpenEmbedded:** OpenEmbedded node → select channel → connect to Container → send."],
  start: ["Here's the fastest way to build your first message:\n\n1. **Add a Container** node\n2. **Add a TextDisplay** inside it\n3. **Add a Bot or Webhook** node → connect to Container\n4. **Hit send** ✈\n\nFor richer messages, add an **Embed** node inside your Container."],
};

type KbKey = keyof typeof AGENT_KNOWLEDGE;

function findBestResponse(input: string): string {
  const q = input.toLowerCase();
  const matchers: Array<{ keys: string[]; kbKey: KbKey }> = [
    { keys: ["hello", "hi ", "hey", "greet"], kbKey: "greeting" },
    { keys: ["help", "what can", "capabilities", "features"], kbKey: "help" },
    { keys: ["container", "wrapper", "outer", "cv2"], kbKey: "container" },
    { keys: ["embed", "rich embed", "classic embed"], kbKey: "embed" },
    { keys: ["text display", "text node", "text block", "markdown", "add text"], kbKey: "text" },
    { keys: ["button", "btn"], kbKey: "button" },
    { keys: ["action row", "actionrow", "button row"], kbKey: "actionrow" },
    { keys: ["select menu", "dropdown", "select", "user select", "role select", "channel select"], kbKey: "select" },
    { keys: ["section", "side by side", "layout row"], kbKey: "section" },
    { keys: ["thumbnail", "side image", "accessory"], kbKey: "thumbnail" },
    { keys: ["gallery", "media gallery", "grid", "image grid"], kbKey: "gallery" },
    { keys: ["separator", "divider", "spacer", "spacing"], kbKey: "separator" },
    { keys: ["webhook", "discord webhook"], kbKey: "webhook" },
    { keys: ["bot node", "bot account", "bot send"], kbKey: "bot" },
    { keys: ["schedule", "cron", "automat", "daily", "weekly", "hourly", "recurring"], kbKey: "schedule" },
    { keys: ["modal", "popup", "dialog", "form"], kbKey: "modal" },
    { keys: ["text input", "form field", "input field"], kbKey: "textinput" },
    { keys: ["connect", "link", "drag", "handle", "how to connect", "connection rule"], kbKey: "connect" },
    { keys: ["send", "publish", "post", "deliver", "how to send"], kbKey: "send" },
    { keys: ["begin", "first message", "get started", "how do i start", "quick start", "first time", "how to build"], kbKey: "start" },
  ];
  for (const { keys, kbKey } of matchers) {
    if (keys.some((k) => q.includes(k))) {
      const arr = AGENT_KNOWLEDGE[kbKey];
      return arr[Math.floor(Math.random() * arr.length)];
    }
  }
  return "I'm not sure I have a specific answer for that, but I can help with:\n\n• Node types and what they do\n• How to connect nodes\n• Sending via Bot or Webhook\n• Buttons, modals, interactive flows\n• Scheduled automation\n\nTry asking **\"How do I add a button?\"** or **\"How do I send my message?\"**";
}

function renderMarkdown(text: string) {
  return text.split("\n").map((line, i) => {
    if (line.trim() === "") return <div key={i} style={{ height: 5 }} />;
    const parts: React.ReactNode[] = [];
    const bold = /\*\*(.+?)\*\*/g;
    let match: RegExpExecArray | null;
    let last = 0, key = 0;
    while ((match = bold.exec(line)) !== null) {
      if (match.index > last) parts.push(<span key={key++}>{line.slice(last, match.index)}</span>);
      parts.push(<strong key={key++} style={{ color: "#e8e8e8", fontWeight: 600 }}>{match[1]}</strong>);
      last = match.index + match[0].length;
    }
    if (last < line.length) parts.push(<span key={key++}>{line.slice(last)}</span>);
    return <div key={i} style={{ lineHeight: 1.55 }}>{parts}</div>;
  });
}

function ThinkingDots() {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 5, height: 18 }}>
      {[0, 1, 2].map((i) => (
        <div key={i} style={{ width: 6, height: 6, borderRadius: "50%", background: "#818cf8", animation: `agentDot 1.2s ${i * 0.2}s ease-in-out infinite` }} />
      ))}
    </div>
  );
}

export function AgentPanel() {
  const now = new Date();
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "agent",
      content: "Hello! I'm your AI assistant.\n\nI can help you with building, customizing, and deploying AI experiences on OpenEmbedded.\n\nWhat would you like to know or do today?",
      time: formatTime(now),
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const MAX = 500;

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages, loading]);

  const handleSend = useCallback(() => {
    const text = input.trim();
    if (!text || loading) return;
    setMessages((prev) => [...prev, { role: "user", content: text, time: formatTime(new Date()) }]);
    setInput("");
    setLoading(true);
    setTimeout(() => {
      setMessages((prev) => [...prev, { role: "agent", content: findBestResponse(text), time: formatTime(new Date()) }]);
      setLoading(false);
    }, 480 + Math.random() * 320);
  }, [input, loading]);

  const onKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%", background: "#161616", overflow: "hidden" }}>

      {/* ── Header ─────────────────────────────────────────────────────── */}
      <div style={{
        display: "flex", alignItems: "center", gap: 10,
        padding: "14px 14px 12px",
        borderBottom: "1px solid rgba(255,255,255,0.06)",
        flexShrink: 0,
      }}>
        {/* Avatar — logo image on blue circle */}
        <div style={{
          width: 40, height: 40, borderRadius: "50%", flexShrink: 0,
          background: "linear-gradient(135deg, #4752c4 0%, #5865f2 100%)",
          display: "flex", alignItems: "center", justifyContent: "center",
          boxShadow: "0 2px 12px rgba(88,101,242,0.40)",
        }}>
          <img src="/agent-star.png" alt="" style={{ width: 22, height: 22, objectFit: "contain" }} />
        </div>

        {/* Title */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
            <span style={{ fontSize: 14, fontWeight: 700, color: "#e8e8e8", letterSpacing: "-0.01em" }}>AI Agent</span>
            <span style={{
              fontSize: 9, fontWeight: 700, letterSpacing: "0.07em", textTransform: "uppercase",
              color: "#888", background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.10)",
              borderRadius: 4, padding: "1px 5px",
            }}>BOT</span>
          </div>
          <div style={{ fontSize: 10, color: "#3a3a3a", marginTop: 1 }}>{formatTime(now)}</div>
        </div>

        {/* Header icons */}
        <div style={{ display: "flex", alignItems: "center", gap: 1, flexShrink: 0 }}>
          {[<Settings size={13} />, <X size={13} />].map((icon, i) => (
            <button key={i} style={{
              width: 28, height: 28, borderRadius: 7, background: "transparent", border: "none",
              cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
              color: "#404040", transition: "color 0.1s, background 0.1s",
            }}
              onMouseEnter={(e) => { e.currentTarget.style.color = "#888"; e.currentTarget.style.background = "rgba(255,255,255,0.05)"; }}
              onMouseLeave={(e) => { e.currentTarget.style.color = "#404040"; e.currentTarget.style.background = "transparent"; }}
            >{icon}</button>
          ))}
        </div>
      </div>

      {/* ── Chat area ──────────────────────────────────────────────────── */}
      <div ref={scrollRef} style={{
        flex: 1, overflowY: "auto", padding: "14px 14px 8px",
        display: "flex", flexDirection: "column", gap: 16, scrollbarWidth: "none",
      }}>
        {messages.map((msg, i) => (
          <div key={i} style={{ display: "flex", flexDirection: "column", gap: 5 }}>
            {/* Label row */}
            <div style={{
              display: "flex", alignItems: "center", gap: 5,
              fontSize: 9, fontWeight: 700, color: "#404040",
              textTransform: "uppercase", letterSpacing: "0.07em",
            }}>
              {msg.role === "agent" ? (
                <>
                  <AgentIcon size={9} color="#5865f2" />
                  Agent Response
                </>
              ) : (
                <>
                  {/* Person avatar */}
                  <div style={{
                    width: 14, height: 14, borderRadius: "50%", flexShrink: 0,
                    background: "#5865f2", display: "flex", alignItems: "center", justifyContent: "center",
                  }}>
                    <User size={9} color="#fff" strokeWidth={2.5} />
                  </div>
                  Your Input
                </>
              )}
            </div>

            {/* Bubble */}
            <div style={{
              background: msg.role === "agent" ? "rgba(255,255,255,0.03)" : "rgba(255,255,255,0.02)",
              border: `1px solid ${msg.role === "agent" ? "rgba(88,101,242,0.10)" : "rgba(255,255,255,0.05)"}`,
              borderRadius: 10, padding: "10px 12px",
            }}>
              <div style={{ fontSize: 12.5, color: "#c8c8c8", lineHeight: 1.55 }}>
                {msg.role === "agent" ? renderMarkdown(msg.content) : msg.content}
              </div>
            </div>
            <div style={{ fontSize: 10, color: "#333", paddingLeft: 2 }}>{msg.time}</div>
          </div>
        ))}

        {loading && (
          <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
            <div style={{
              display: "flex", alignItems: "center", gap: 5,
              fontSize: 9, fontWeight: 700, color: "#404040",
              textTransform: "uppercase", letterSpacing: "0.07em",
            }}>
              <AgentIcon size={9} color="#5865f2" />
              Agent Response
            </div>
            <div style={{
              background: "rgba(255,255,255,0.03)", border: "1px solid rgba(88,101,242,0.10)",
              borderRadius: 10, padding: "10px 12px",
            }}>
              <ThinkingDots />
            </div>
          </div>
        )}
      </div>

      {/* ── Input area ─────────────────────────────────────────────────── */}
      <div style={{
        flexShrink: 0, borderTop: "1px solid rgba(255,255,255,0.06)",
        padding: "10px 14px 10px", display: "flex", flexDirection: "column", gap: 7,
      }}>
        {/* "Your Input" label */}
        <div style={{
          display: "flex", alignItems: "center", gap: 5,
          fontSize: 9, fontWeight: 700, color: "#404040",
          textTransform: "uppercase", letterSpacing: "0.07em",
        }}>
          <div style={{
            width: 14, height: 14, borderRadius: "50%",
            background: "#5865f2", display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            <User size={9} color="#fff" strokeWidth={2.5} />
          </div>
          Your Input
        </div>

        {/* Textarea */}
        <div style={{ position: "relative" }}>
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value.slice(0, MAX))}
            onKeyDown={onKeyDown}
            placeholder="Type your message…"
            rows={3}
            style={{
              width: "100%", boxSizing: "border-box",
              background: "rgba(255,255,255,0.03)",
              border: "1px solid rgba(255,255,255,0.07)",
              borderRadius: 9, color: "#d0d0d0", fontSize: 12.5,
              padding: "8px 10px 22px", outline: "none",
              fontFamily: "inherit", resize: "none", lineHeight: 1.5,
              scrollbarWidth: "none", transition: "border-color 0.12s",
            }}
            onFocus={(e) => { e.currentTarget.style.borderColor = "rgba(88,101,242,0.35)"; }}
            onBlur={(e) => { e.currentTarget.style.borderColor = "rgba(255,255,255,0.07)"; }}
          />
          <div style={{
            position: "absolute", bottom: 6, right: 8, fontSize: 10,
            color: input.length > MAX * 0.9 ? "#f59e0b" : "#333",
            pointerEvents: "none", fontVariantNumeric: "tabular-nums",
          }}>
            {input.length}/{MAX}
          </div>
        </div>

        {/* Toolbar: paperclip + send */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <button
            style={{
              background: "transparent", border: "none", cursor: "pointer",
              width: 30, height: 30, borderRadius: 7,
              display: "flex", alignItems: "center", justifyContent: "center",
              color: "#404040", transition: "color 0.1s",
            }}
            onMouseEnter={(e) => { e.currentTarget.style.color = "#777"; }}
            onMouseLeave={(e) => { e.currentTarget.style.color = "#404040"; }}
            title="Attach"
          >
            <Paperclip size={14} />
          </button>

          <button
            onClick={handleSend}
            disabled={!input.trim() || loading}
            style={{
              display: "flex", alignItems: "center", justifyContent: "center",
              gap: 5, height: 32, padding: "0 14px", borderRadius: 8,
              background: input.trim() && !loading ? "#5865f2" : "rgba(255,255,255,0.06)",
              border: "none",
              color: input.trim() && !loading ? "#ffffff" : "#3a3a3a",
              fontSize: 12, fontWeight: 600, cursor: input.trim() && !loading ? "pointer" : "default",
              transition: "all 0.15s",
              boxShadow: input.trim() && !loading ? "0 2px 10px rgba(88,101,242,0.40)" : "none",
            }}
            title="Send (Enter)"
          >
            <SendArrowIcon />
          </button>
        </div>

        {/* Disclaimer */}
        <div style={{ fontSize: 10, color: "#2e2e2e", textAlign: "center", lineHeight: 1.4 }}>
          AI responses can make mistakes. Please verify important information.
        </div>
      </div>

      <style>{`
        @keyframes agentDot {
          0%, 80%, 100% { opacity: 0.25; transform: scale(0.7); }
          40%            { opacity: 1;    transform: scale(1); }
        }
      `}</style>
    </div>
  );
}

function SendArrowIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <line x1="22" y1="2" x2="11" y2="13" />
      <polygon points="22 2 15 22 11 13 2 9 22 2" />
    </svg>
  );
}
