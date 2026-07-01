// @ts-nocheck
import { useState, useRef, useEffect, useCallback } from "react";
import { createPortal } from "react-dom";
import { X, Settings, Paperclip, Send, User } from "lucide-react";
import { AgentIcon } from "./AgentIcon.js";

interface Message {
  role: "agent" | "user";
  content: string;
  time: string;
}

function formatTime(d: Date) {
  return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

const AGENT_KNOWLEDGE = {
  greeting: [
    "Hello! I'm your AI assistant for OpenEmbedded.\n\nI can help you build Discord messages visually — from simple text posts to complex Components V2 layouts with buttons, embeds, and galleries.\n\nWhat would you like to know or do today?",
  ],
  container: [
    "**Container** is the root wrapper for every Components V2 message. Think of it as the outer shell — everything else goes inside it.\n\n→ Connect a **Bot** or **Webhook** node to the Container's left handle to send it.\n→ Add child nodes (TextDisplay, Section, ActionRow, etc.) to its right handle.",
  ],
  embed: [
    "**Embed (CV2)** creates a classic Discord embed inside your Container. It supports:\n• Title and description\n• Author and footer\n• Accent color\n\nConnect it as a child of a Container. For the legacy V1 embed API, there's a separate Embed node (coming soon).",
  ],
  text: [
    "**Text Display** is a plain-text block — perfect for markdown content like headings, bullet lists, and body copy.\n\nDrop it inside a **Container**, **Section**, or **Embed** node. It renders exactly as Discord markdown, so you can use **bold**, *italic*, > quotes, and code blocks.",
  ],
  button: [
    "**Buttons** live inside an **Action Row** node. The workflow is:\n\n1. Add an **Action Row** inside your Container\n2. Add one or more **Button** nodes inside the Action Row\n3. For interactive responses, drag from the amber handle (right side of Button) to a response Container or Modal\n\nButton styles: Primary · Secondary · Success · Danger · Link",
  ],
  actionrow: [
    "**Action Row** is a horizontal container for interactive components. It holds up to 5 buttons or 1 select menu.\n\nPlace Action Row inside your **Container**, then add **Button** or **Select Menu** nodes inside it.",
  ],
  select: [
    "**Select Menus** let users pick from a dropdown list. Types available:\n• String Select — custom options you define\n• User / Role / Mentionable / Channel Select — Discord-native pickers\n\nAdd them inside an **Action Row** and drag the amber handle to define the interaction response flow.",
  ],
  section: [
    "**Section** splits a row into main content + a side thumbnail accessory — great for profile cards or side-by-side layouts.\n\nInside Section, connect:\n→ **TextDisplay** for the main content area\n→ **Thumbnail** for the right-side image",
  ],
  thumbnail: [
    "**Thumbnail** attaches a small image to the right side of a **Section** node.\n\nPaste an image URL in the Properties panel. It shows up as a square preview beside your text content.",
  ],
  gallery: [
    "**Media Gallery** displays a grid of images in your message. Add 1–10 image URLs in the Properties panel.\n\nConnect it inside a **Container** or **Section**.",
  ],
  separator: [
    "**Separator** adds vertical spacing between blocks — optionally with a visible horizontal divider line.\n\nSize options: Small · Medium · Large. Use it inside a Container to breathe air between sections.",
  ],
  webhook: [
    "**Webhook** is a relay node — it accepts a trigger from a **Schedule** and sends a message to Discord via a webhook URL.\n\nWorkflow:\n1. Paste your Discord webhook URL in the Webhook node\n2. Connect a **Schedule** node to its left handle (trigger)\n3. Connect its right handle to a **Container** or **Embed**",
  ],
  bot: [
    "**Bot** lets you send messages through your connected OpenEmbedded bot account. Configure it in the Properties panel by selecting a server and channel.\n\nConnect its right handle to a **Container** or **Embed** to define the message content.",
  ],
  schedule: [
    "**Schedule** automates when a message is sent. You can set:\n• **Cron** — repeating on a schedule (every hour, daily at 9 AM, etc.)\n• **Once** — send at a specific date and time\n\nConnect it to a **Webhook** relay to trigger the send.",
  ],
  modal: [
    "**Modal** is a popup dialog triggered by a button click. The workflow:\n\n1. Add a **Button** (action: Open Modal) in your Action Row\n2. Create a **Modal** node and connect to the button's amber handle\n3. Add **Action Row → Text Input** inside the Modal for form fields",
  ],
  textinput: [
    "**Text Input** is a form field inside a **Modal**. It can be:\n• Short — single-line input\n• Paragraph — multi-line textarea\n\nAdd it inside an **Action Row** that lives inside a **Modal** node.",
  ],
  connect: [
    "To connect two nodes:\n1. Hover a node to reveal its **right handle** (white dot on the right edge)\n2. Drag from that handle to the **left handle** of the target node\n3. A valid connection snaps automatically — invalid ones are rejected\n\nConnection rules:\n• Container ← Bot / Webhook / OpenEmbedded\n• Container children: TextDisplay, Section, ActionRow, Thumbnail, MediaGallery, Separator, Embed\n• ActionRow children: Button, SelectMenu, TextInput\n• Section children: TextDisplay, Thumbnail\n• Button amber handle → Container / Embed / Modal (interaction response)",
  ],
  send: [
    "To send your message to Discord:\n\n**Via Webhook:**\nWebhook node (paste URL) → connect right handle to Container → click the send icon or use Schedule to automate.\n\n**Via Bot:**\nBot node (select server + channel in Properties) → connect right handle to Container → click the green send icon.\n\n**Via OpenEmbedded:**\nOpenEmbedded node → select channel in Properties → connect to Container → send.",
  ],
  start: [
    "Here's the fastest way to build your first message:\n\n1. **Add a Container** node — this wraps everything\n2. **Add a TextDisplay** inside it — write your message content\n3. **Add a Bot or Webhook** node — connect it to the Container's left handle\n4. **Hit send** ✈\n\nFor richer messages, add an **Embed** node alongside the TextDisplay inside your Container.",
  ],
  help: [
    "Here's what I can help you with:\n\n• **Node guidance** — what each node does and when to use it\n• **Connection rules** — what can connect to what\n• **Building layouts** — step-by-step message templates\n• **Interactive flows** — buttons, select menus, and modals\n• **Automation** — scheduled messages with webhooks\n• **Troubleshooting** — why a connection isn't working\n\nJust ask a question or describe what you're trying to build!",
  ],
};

type KbKey = keyof typeof AGENT_KNOWLEDGE;

function findBestResponse(input: string): string {
  const q = input.toLowerCase();

  const matchers: Array<{ keys: string[]; kbKey: KbKey }> = [
    { keys: ["hello", "hi ", "hey", "greet", "start"], kbKey: "greeting" },
    { keys: ["help", "what can", "what do", "capabilities", "features"], kbKey: "help" },
    { keys: ["container", "wrapper", "outer", "cv2", "components v2"], kbKey: "container" },
    { keys: ["embed", "rich embed", "classic embed", "embed block"], kbKey: "embed" },
    { keys: ["text display", "text node", "text block", "markdown", "plain text", "body text", "add text"], kbKey: "text" },
    { keys: ["button", "btn", "click me", "click button"], kbKey: "button" },
    { keys: ["action row", "actionrow", "row of button", "button row", "action_row"], kbKey: "actionrow" },
    { keys: ["select menu", "dropdown", "select", "user select", "role select", "channel select", "mentionable"], kbKey: "select" },
    { keys: ["section", "side by side", "side-by-side", "layout row"], kbKey: "section" },
    { keys: ["thumbnail", "side image", "small image", "accessory"], kbKey: "thumbnail" },
    { keys: ["gallery", "media gallery", "grid", "images", "image grid", "multiple image"], kbKey: "gallery" },
    { keys: ["separator", "divider", "spacer", "spacing", "space between"], kbKey: "separator" },
    { keys: ["webhook", "discord webhook", "webhook url"], kbKey: "webhook" },
    { keys: ["bot node", "bot account", "bot send", "openembedded bot", "via bot"], kbKey: "bot" },
    { keys: ["schedule", "cron", "automat", "daily", "weekly", "hourly", "timed", "recurring"], kbKey: "schedule" },
    { keys: ["modal", "popup", "dialog", "form", "pop up"], kbKey: "modal" },
    { keys: ["text input", "textinput", "form field", "input field", "short text", "paragraph input"], kbKey: "textinput" },
    { keys: ["connect", "link", "drag", "wire", "edge", "handle", "how to connect", "connection rule", "how do i connect"], kbKey: "connect" },
    { keys: ["send", "publish", "post", "deliver", "dispatch", "how to send", "send message"], kbKey: "send" },
    { keys: ["begin", "first message", "get started", "how do i start", "first step", "quick start", "where do i start", "how to build", "new to", "first time"], kbKey: "start" },
  ];

  for (const { keys, kbKey } of matchers) {
    if (keys.some((k) => q.includes(k))) {
      const responses = AGENT_KNOWLEDGE[kbKey];
      return responses[Math.floor(Math.random() * responses.length)];
    }
  }

  return "I'm not sure I have a specific answer for that, but I can help you with:\n\n• Node types and what they do\n• How to connect nodes together\n• Sending messages via Bot or Webhook\n• Buttons, modals, and interactive flows\n• Scheduling automated messages\n\nTry asking something like **\"How do I add a button?\"** or **\"How do I send my message?\"**";
}

function renderMarkdown(text: string) {
  const lines = text.split("\n");
  return lines.map((line, i) => {
    const parts: React.ReactNode[] = [];
    let last = 0;
    const bold = /\*\*(.+?)\*\*/g;
    let match: RegExpExecArray | null;
    let key = 0;

    while ((match = bold.exec(line)) !== null) {
      if (match.index > last) {
        parts.push(<span key={key++}>{line.slice(last, match.index)}</span>);
      }
      parts.push(<strong key={key++} style={{ color: "#e8e8e8", fontWeight: 600 }}>{match[1]}</strong>);
      last = match.index + match[0].length;
    }
    if (last < line.length) parts.push(<span key={key++}>{line.slice(last)}</span>);

    const isEmpty = line.trim() === "";
    return isEmpty ? <div key={i} style={{ height: 6 }} /> : <div key={i} style={{ lineHeight: 1.55 }}>{parts}</div>;
  });
}

function ChatBubble({ msg }: { msg: Message }) {
  const isAgent = msg.role === "agent";

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
      <div
        style={{
          fontSize: 10,
          fontWeight: 600,
          color: "#404040",
          textTransform: "uppercase",
          letterSpacing: "0.07em",
          display: "flex",
          alignItems: "center",
          gap: 5,
        }}
      >
        {isAgent ? (
          <>
            <AgentIcon size={10} color="#818cf8" />
            Agent Response
          </>
        ) : (
          <>
            <User size={10} color="#606060" />
            Your Input
          </>
        )}
      </div>

      <div
        style={{
          background: isAgent ? "rgba(129,140,248,0.06)" : "rgba(255,255,255,0.03)",
          border: `1px solid ${isAgent ? "rgba(129,140,248,0.12)" : "rgba(255,255,255,0.06)"}`,
          borderRadius: 12,
          padding: "11px 14px",
        }}
      >
        <div style={{ fontSize: 13, color: "#c8c8c8", lineHeight: 1.5 }}>
          {isAgent ? renderMarkdown(msg.content) : msg.content}
        </div>
      </div>

      <div style={{ fontSize: 10, color: "#383838", paddingLeft: 2 }}>{msg.time}</div>
    </div>
  );
}

interface AgentModalProps {
  onClose: () => void;
}

export function AgentModal({ onClose }: AgentModalProps) {
  const now = new Date();

  const [messages, setMessages] = useState<Message[]>([
    {
      role: "agent",
      content: "Hello! I'm your AI assistant for OpenEmbedded.\n\nI can help you build Discord messages visually — nodes, connections, buttons, embeds, and more.\n\nWhat would you like to know or do today?",
      time: formatTime(now),
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const MAX_CHARS = 500;

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, loading]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose]);

  const handleSend = useCallback(() => {
    const text = input.trim();
    if (!text || loading) return;

    const userMsg: Message = { role: "user", content: text, time: formatTime(new Date()) };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setLoading(true);

    setTimeout(() => {
      const response = findBestResponse(text);
      setMessages((prev) => [...prev, { role: "agent", content: response, time: formatTime(new Date()) }]);
      setLoading(false);
    }, 480 + Math.random() * 300);
  }, [input, loading]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const modal = (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 9999,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        pointerEvents: "none",
      }}
    >
      <div
        style={{
          pointerEvents: "auto",
          width: 380,
          maxHeight: "min(540px, calc(100vh - 80px))",
          background: "rgba(16,16,16,0.97)",
          backdropFilter: "blur(40px) saturate(180%)",
          WebkitBackdropFilter: "blur(40px) saturate(180%)",
          border: "1px solid rgba(255,255,255,0.10)",
          borderRadius: 18,
          boxShadow: "0 32px 80px rgba(0,0,0,0.9), 0 0 0 1px rgba(255,255,255,0.04)",
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
          animation: "agentModalIn 0.22s cubic-bezier(0.22,1,0.36,1)",
        }}
      >
        {/* ── Header ── */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 12,
            padding: "14px 16px 12px",
            borderBottom: "1px solid rgba(255,255,255,0.07)",
            flexShrink: 0,
          }}
        >
          {/* Avatar */}
          <div
            style={{
              width: 42,
              height: 42,
              borderRadius: "50%",
              background: "linear-gradient(135deg, #818cf8 0%, #6366f1 60%, #4f46e5 100%)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
              boxShadow: "0 4px 16px rgba(99,102,241,0.35)",
            }}
          >
            <AgentIcon size={18} color="#ffffff" />
          </div>

          {/* Title + badge + time */}
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
              <span style={{ fontSize: 15, fontWeight: 700, color: "#e8e8e8", letterSpacing: "-0.01em" }}>
                AI Agent
              </span>
              <span
                style={{
                  fontSize: 9,
                  fontWeight: 700,
                  letterSpacing: "0.07em",
                  textTransform: "uppercase",
                  color: "#8a8a9a",
                  background: "rgba(255,255,255,0.07)",
                  border: "1px solid rgba(255,255,255,0.10)",
                  borderRadius: 4,
                  padding: "1px 5px",
                }}
              >
                BOT
              </span>
            </div>
            <div style={{ fontSize: 11, color: "#3a3a3a", marginTop: 1 }}>
              {formatTime(now)}
            </div>
          </div>

          {/* Icons */}
          <div style={{ display: "flex", alignItems: "center", gap: 2, flexShrink: 0 }}>
            <button
              style={{
                background: "transparent",
                border: "none",
                cursor: "pointer",
                width: 30,
                height: 30,
                borderRadius: 8,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "#3a3a3a",
                transition: "color 0.1s, background 0.1s",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.color = "#707070";
                e.currentTarget.style.background = "rgba(255,255,255,0.05)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.color = "#3a3a3a";
                e.currentTarget.style.background = "transparent";
              }}
            >
              <Settings size={13} />
            </button>
            <button
              onClick={onClose}
              style={{
                background: "transparent",
                border: "none",
                cursor: "pointer",
                width: 30,
                height: 30,
                borderRadius: 8,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "#3a3a3a",
                transition: "color 0.1s, background 0.1s",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.color = "#c0c0c0";
                e.currentTarget.style.background = "rgba(255,255,255,0.05)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.color = "#3a3a3a";
                e.currentTarget.style.background = "transparent";
              }}
            >
              <X size={14} />
            </button>
          </div>
        </div>

        {/* ── Chat area ── */}
        <div
          ref={scrollRef}
          style={{
            flex: 1,
            overflowY: "auto",
            padding: "16px 16px 12px",
            display: "flex",
            flexDirection: "column",
            gap: 18,
            scrollbarWidth: "none",
          }}
        >
          {messages.map((msg, i) => (
            <ChatBubble key={i} msg={msg} />
          ))}

          {loading && (
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              <div style={{ fontSize: 10, fontWeight: 600, color: "#404040", textTransform: "uppercase", letterSpacing: "0.07em", display: "flex", alignItems: "center", gap: 5 }}>
                <AgentIcon size={10} color="#818cf8" />
                Agent Response
              </div>
              <div
                style={{
                  background: "rgba(129,140,248,0.06)",
                  border: "1px solid rgba(129,140,248,0.12)",
                  borderRadius: 12,
                  padding: "11px 14px",
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                }}
              >
                <ThinkingDots />
              </div>
            </div>
          )}
        </div>

        {/* ── Input area ── */}
        <div
          style={{
            flexShrink: 0,
            borderTop: "1px solid rgba(255,255,255,0.07)",
            padding: "12px 14px 10px",
            display: "flex",
            flexDirection: "column",
            gap: 8,
          }}
        >
          {/* Label */}
          <div style={{ fontSize: 10, fontWeight: 600, color: "#383838", textTransform: "uppercase", letterSpacing: "0.07em", display: "flex", alignItems: "center", gap: 5 }}>
            <User size={10} color="#505050" />
            Your Input
          </div>

          {/* Textarea */}
          <div style={{ position: "relative" }}>
            <textarea
              ref={textareaRef}
              value={input}
              onChange={(e) => setInput(e.target.value.slice(0, MAX_CHARS))}
              onKeyDown={handleKeyDown}
              placeholder="Type your message…"
              rows={3}
              style={{
                width: "100%",
                boxSizing: "border-box",
                background: "rgba(255,255,255,0.03)",
                border: "1px solid rgba(255,255,255,0.08)",
                borderRadius: 10,
                color: "#d0d0d0",
                fontSize: 13,
                padding: "9px 11px 24px",
                outline: "none",
                fontFamily: "inherit",
                resize: "none",
                lineHeight: 1.5,
                scrollbarWidth: "none",
                transition: "border-color 0.12s",
              }}
              onFocus={(e) => { e.currentTarget.style.borderColor = "rgba(129,140,248,0.30)"; }}
              onBlur={(e) => { e.currentTarget.style.borderColor = "rgba(255,255,255,0.08)"; }}
            />
            <div
              style={{
                position: "absolute",
                bottom: 8,
                right: 10,
                fontSize: 10,
                color: input.length > MAX_CHARS * 0.9 ? "#f59e0b" : "#353535",
                fontVariantNumeric: "tabular-nums",
                pointerEvents: "none",
              }}
            >
              {input.length}/{MAX_CHARS}
            </div>
          </div>

          {/* Toolbar */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <button
              style={{
                background: "transparent",
                border: "none",
                cursor: "pointer",
                width: 32,
                height: 32,
                borderRadius: 8,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "#3a3a3a",
                transition: "color 0.1s",
              }}
              onMouseEnter={(e) => { e.currentTarget.style.color = "#707070"; }}
              onMouseLeave={(e) => { e.currentTarget.style.color = "#3a3a3a"; }}
              title="Attach file"
            >
              <Paperclip size={15} />
            </button>

            <button
              onClick={handleSend}
              disabled={!input.trim() || loading}
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                width: 34,
                height: 34,
                borderRadius: 10,
                background: input.trim() && !loading
                  ? "linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)"
                  : "rgba(255,255,255,0.05)",
                border: "1px solid " + (input.trim() && !loading ? "rgba(99,102,241,0.5)" : "rgba(255,255,255,0.07)"),
                cursor: input.trim() && !loading ? "pointer" : "default",
                color: input.trim() && !loading ? "#ffffff" : "#3a3a3a",
                transition: "all 0.15s",
                boxShadow: input.trim() && !loading ? "0 4px 14px rgba(99,102,241,0.35)" : "none",
              }}
              title="Send (Enter)"
            >
              <Send size={14} />
            </button>
          </div>

          {/* Disclaimer */}
          <div style={{ fontSize: 10, color: "#2e2e2e", textAlign: "center", lineHeight: 1.4, paddingBottom: 2 }}>
            AI responses can make mistakes. Please verify important information.
          </div>
        </div>
      </div>

      <style>{`
        @keyframes agentModalIn {
          from { opacity: 0; transform: scale(0.96) translateY(8px); }
          to   { opacity: 1; transform: scale(1)    translateY(0); }
        }
        @keyframes agentDot {
          0%, 80%, 100% { opacity: 0.25; transform: scale(0.7); }
          40%            { opacity: 1;    transform: scale(1); }
        }
      `}</style>
    </div>
  );

  return createPortal(modal, document.body);
}

function ThinkingDots() {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 5, height: 18 }}>
      {[0, 1, 2].map((i) => (
        <div
          key={i}
          style={{
            width: 6,
            height: 6,
            borderRadius: "50%",
            background: "#818cf8",
            animation: `agentDot 1.2s ${i * 0.2}s ease-in-out infinite`,
          }}
        />
      ))}
    </div>
  );
}
