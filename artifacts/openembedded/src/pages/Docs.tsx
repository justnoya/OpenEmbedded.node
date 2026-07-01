// @ts-nocheck
import { useState, useEffect, useRef } from "react";
import { useLocation } from "wouter";
import {
  BookOpen, Box, Zap, Code2, Send, Webhook, Bot,
  ChevronRight, ExternalLink, Menu, X, Hash,
  Layers, MousePointerClick, AlignLeft, Image, Grid3X3,
  Minus, SquareStack, ArrowRight, Package,
} from "lucide-react";

const AppLogo = ({ size = 28 }: { size?: number }) => (
  <img src="/logo.png" alt="OpenEmbedded" width={size} height={size}
    style={{ objectFit: "contain", display: "block", borderRadius: "50%" }} />
);

// ─── Colour tokens ────────────────────────────────────────────────────────────
const BG         = "#1a1a1a";
const CARD_BG    = "rgba(26,26,26,0.97)";
const SURFACE    = "rgba(255,255,255,0.04)";
const BORDER     = "rgba(255,255,255,0.09)";
const BORDER_STR = "rgba(255,255,255,0.13)";
const ACCENT     = "#5865F2";
const ACCENT2    = "#7c3aed";
const TEXT_PRI   = "#f0f0f0";
const TEXT_SEC   = "#a0a0a0";
const TEXT_MUT   = "#555555";
const CODE_BG    = "rgba(0,0,0,0.55)";
const GREEN      = "#3fb950";
const AMBER      = "#d29922";
const RED        = "#f85149";

// ─── Shared card style ────────────────────────────────────────────────────────
const card = (extra?: React.CSSProperties): React.CSSProperties => ({
  background: "rgba(22,22,22,0.93)",
  border: `1px solid ${BORDER_STR}`,
  borderRadius: 14,
  boxShadow: "0 4px 28px rgba(0,0,0,0.55), inset 0 1px 0 rgba(255,255,255,0.07)",
  ...extra,
});

// ─── Inline code ─────────────────────────────────────────────────────────────
const IC = ({ children }: { children: React.ReactNode }) => (
  <code style={{
    background: CODE_BG, border: `1px solid ${BORDER}`,
    borderRadius: 5, padding: "1px 6px", fontSize: "0.88em",
    fontFamily: `"JetBrains Mono", "Fira Code", monospace`,
    color: "#c9d1d9",
  }}>{children}</code>
);

// ─── Code block ───────────────────────────────────────────────────────────────
const CodeBlock = ({ lang, children }: { lang?: string; children: string }) => (
  <div style={{
    background: "#0d0d0d", border: `1px solid ${BORDER}`, borderRadius: 10,
    overflow: "hidden", margin: "20px 0",
  }}>
    {lang && (
      <div style={{
        padding: "8px 16px", background: "rgba(255,255,255,0.03)",
        borderBottom: `1px solid ${BORDER}`, fontSize: 11,
        color: TEXT_MUT, fontFamily: "monospace", letterSpacing: "0.05em",
        textTransform: "uppercase",
      }}>{lang}</div>
    )}
    <pre style={{
      margin: 0, padding: "18px 20px", overflowX: "auto",
      fontSize: 13, lineHeight: 1.7,
      fontFamily: `"JetBrains Mono", "Fira Code", "Cascadia Code", monospace`,
      color: "#c9d1d9",
    }}><code>{children}</code></pre>
  </div>
);

// ─── Callout ──────────────────────────────────────────────────────────────────
const Callout = ({
  type = "info", children,
}: { type?: "info" | "warn" | "tip" | "danger"; children: React.ReactNode }) => {
  const cfg = {
    info:   { color: ACCENT,  bg: "rgba(88,101,242,0.08)",  border: "rgba(88,101,242,0.25)",  label: "Note" },
    tip:    { color: GREEN,   bg: "rgba(63,185,80,0.08)",   border: "rgba(63,185,80,0.25)",   label: "Tip" },
    warn:   { color: AMBER,   bg: "rgba(210,153,34,0.08)",  border: "rgba(210,153,34,0.25)",  label: "Warning" },
    danger: { color: RED,     bg: "rgba(248,81,73,0.08)",   border: "rgba(248,81,73,0.25)",   label: "Danger" },
  }[type];
  return (
    <div style={{
      background: cfg.bg, border: `1px solid ${cfg.border}`,
      borderLeft: `3px solid ${cfg.color}`, borderRadius: 10,
      padding: "14px 18px", margin: "20px 0",
      fontSize: 14, lineHeight: 1.65, color: TEXT_PRI,
    }}>
      <span style={{ fontWeight: 700, color: cfg.color, marginRight: 8 }}>{cfg.label}:</span>
      {children}
    </div>
  );
};

// ─── Section heading ─────────────────────────────────────────────────────────
const H1 = ({ id, children }: { id?: string; children: React.ReactNode }) => (
  <h1 id={id} style={{
    fontSize: "clamp(2rem, 4vw, 2.9rem)", fontWeight: 800,
    color: TEXT_PRI, letterSpacing: "-0.04em", lineHeight: 1.15,
    margin: "0 0 16px", scrollMarginTop: 90,
  }}>{children}</h1>
);
const H2 = ({ id, children }: { id?: string; children: React.ReactNode }) => (
  <h2 id={id} style={{
    fontSize: "clamp(1.35rem, 2.5vw, 1.7rem)", fontWeight: 700,
    color: TEXT_PRI, letterSpacing: "-0.03em", lineHeight: 1.25,
    margin: "52px 0 14px", borderBottom: `1px solid ${BORDER}`,
    paddingBottom: 12, scrollMarginTop: 90,
  }}>{children}</h2>
);
const H3 = ({ id, children }: { id?: string; children: React.ReactNode }) => (
  <h3 id={id} style={{
    fontSize: "1.1rem", fontWeight: 700,
    color: TEXT_PRI, letterSpacing: "-0.02em",
    margin: "32px 0 10px", scrollMarginTop: 90,
  }}>{children}</h3>
);
const P = ({ children }: { children: React.ReactNode }) => (
  <p style={{ fontSize: 15.5, lineHeight: 1.75, color: TEXT_SEC, margin: "0 0 16px" }}>{children}</p>
);

// ─── Component pill ───────────────────────────────────────────────────────────
const NodePill = ({
  icon, name, desc, color,
}: { icon: React.ReactNode; name: string; desc: string; color: string }) => (
  <div style={{
    ...card(), padding: "14px 18px",
    display: "flex", alignItems: "flex-start", gap: 14,
    transition: "border-color 0.15s",
  }}
    onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.borderColor = BORDER_STR; }}
    onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.borderColor = BORDER; }}
  >
    <div style={{
      width: 36, height: 36, borderRadius: 9, flexShrink: 0,
      background: `${color}18`, border: `1px solid ${color}30`,
      display: "flex", alignItems: "center", justifyContent: "center",
      color,
    }}>{icon}</div>
    <div>
      <div style={{ fontSize: 14, fontWeight: 700, color: TEXT_PRI, marginBottom: 3 }}>{name}</div>
      <div style={{ fontSize: 13, color: TEXT_SEC, lineHeight: 1.55 }}>{desc}</div>
    </div>
  </div>
);

// ─── Sidebar sections ─────────────────────────────────────────────────────────
const NAV = [
  {
    label: "Getting Started",
    icon: <BookOpen size={14} />,
    items: [
      { id: "intro",        label: "Introduction" },
      { id: "quickstart",   label: "Quick Start" },
      { id: "interface",    label: "Interface Overview" },
      { id: "shortcuts",    label: "Keyboard Shortcuts" },
    ],
  },
  {
    label: "Node Types",
    icon: <Layers size={14} />,
    items: [
      { id: "nodes-layout",      label: "Layout Nodes" },
      { id: "nodes-content",     label: "Content Nodes" },
      { id: "nodes-interactive", label: "Interactive Nodes" },
    ],
  },
  {
    label: "Exporting",
    icon: <Zap size={14} />,
    items: [
      { id: "export-json",    label: "Export JSON" },
      { id: "export-code",    label: "Export discord.js Code" },
      { id: "export-webhook", label: "Send via Webhook" },
    ],
  },
  {
    label: "Bot Integration",
    icon: <Bot size={14} />,
    items: [
      { id: "bot-overview",  label: "Overview" },
      { id: "bot-setup",     label: "Bot Setup" },
      { id: "bot-commands",  label: "Slash Commands" },
    ],
  },
  {
    label: "API Reference",
    icon: <Code2 size={14} />,
    items: [
      { id: "api-projects",  label: "Projects" },
      { id: "api-export",    label: "Export" },
      { id: "api-webhook",   label: "Webhook" },
      { id: "api-bot",       label: "Bot Send" },
    ],
  },
  {
    label: "Help",
    icon: <Hash size={14} />,
    items: [
      { id: "faq", label: "FAQ & Troubleshooting" },
    ],
  },
];

// ─── Main component ───────────────────────────────────────────────────────────
export function Docs() {
  const [, navigate]       = useLocation();
  const [active, setActive] = useState("intro");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const contentRef = useRef<HTMLDivElement>(null);

  // Track active section via scroll
  useEffect(() => {
    const obs = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) setActive(e.target.id);
        }
      },
      { rootMargin: "-20% 0px -75% 0px" },
    );
    document.querySelectorAll("[data-section]").forEach((el) => obs.observe(el));
    return () => obs.disconnect();
  }, []);

  const scrollTo = (id: string) => {
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
    setActive(id);
    setSidebarOpen(false);
  };

  const Sidebar = () => (
    <nav style={{
      width: 240, flexShrink: 0,
      display: "flex", flexDirection: "column", gap: 28,
      padding: "4px 0",
    }}>
      {NAV.map((section) => (
        <div key={section.label}>
          <div style={{
            display: "flex", alignItems: "center", gap: 7,
            fontSize: 11, fontWeight: 700, color: TEXT_MUT,
            textTransform: "uppercase", letterSpacing: "0.08em",
            marginBottom: 8, padding: "0 10px",
          }}>
            {section.icon}
            {section.label}
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 1 }}>
            {section.items.map((item) => {
              const isActive = active === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => scrollTo(item.id)}
                  style={{
                    display: "flex", alignItems: "center", gap: 8,
                    background: isActive ? `rgba(88,101,242,0.12)` : "transparent",
                    border: "none", borderRadius: 8,
                    color: isActive ? "#818cf8" : TEXT_SEC,
                    fontSize: 13.5, fontWeight: isActive ? 600 : 400,
                    padding: "7px 10px", cursor: "pointer",
                    textAlign: "left", width: "100%",
                    transition: "all 0.12s",
                  }}
                  onMouseEnter={(e) => {
                    if (!isActive) (e.currentTarget as HTMLElement).style.background = SURFACE;
                  }}
                  onMouseLeave={(e) => {
                    if (!isActive) (e.currentTarget as HTMLElement).style.background = "transparent";
                  }}
                >
                  {isActive && (
                    <div style={{
                      width: 3, height: 3, borderRadius: "50%",
                      background: "#818cf8", flexShrink: 0,
                    }} />
                  )}
                  {item.label}
                </button>
              );
            })}
          </div>
        </div>
      ))}
    </nav>
  );

  return (
    <div className="docs-outer" style={{
      minHeight: "100dvh", background: BG,
      color: TEXT_PRI, fontFamily: `"Inter", system-ui, sans-serif`,
      display: "flex", flexDirection: "column",
      overflowX: "hidden",
    }}>

      {/* ── Top navbar (card) ───────────────────────────────────────────── */}
      <div style={{ position: "sticky", top: 0, zIndex: 100, padding: "10px 16px" }}>
        <header style={{
          ...card(),
          display: "flex", alignItems: "center",
          padding: "0 18px", height: 50, gap: 14,
        }}>
          <button
            onClick={() => navigate("/")}
            style={{
              display: "flex", alignItems: "center", gap: 9, flexShrink: 0,
              background: "transparent", border: "none", cursor: "pointer",
              padding: "2px 0",
            }}
          >
            <AppLogo size={26} />
            <span className="docs-brand-name" style={{ fontSize: 14, fontWeight: 700, color: TEXT_PRI, letterSpacing: "-0.03em" }}>
              OpenEmbedded
            </span>
          </button>

          <div className="docs-brand-divider" style={{ width: 1, height: 16, background: BORDER, flexShrink: 0 }} />

          <span style={{
            fontSize: 12, fontWeight: 600, color: ACCENT,
            background: "rgba(88,101,242,0.12)", border: "1px solid rgba(88,101,242,0.25)",
            borderRadius: 6, padding: "2px 8px",
          }}>Docs</span>

          <div style={{ flex: 1 }} />

          {/* Mobile menu toggle */}
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            style={{
              display: "none", alignItems: "center", justifyContent: "center",
              width: 34, height: 34, background: SURFACE,
              border: `1px solid ${BORDER}`, borderRadius: 8,
              color: TEXT_SEC, cursor: "pointer",
            }}
            className="docs-mobile-menu"
          >
            {sidebarOpen ? <X size={16} /> : <Menu size={16} />}
          </button>

          <a
            href="/"
            style={{
              display: "flex", alignItems: "center", gap: 5,
              background: "#efefef",
              border: "none", borderRadius: 7, color: "#111",
              fontSize: 13, fontWeight: 600, padding: "6px 14px",
              textDecoration: "none",
              flexShrink: 0,
              transition: "background 0.15s",
            }}
            onMouseEnter={(e) => (e.currentTarget.style.background = "#ffffff")}
            onMouseLeave={(e) => (e.currentTarget.style.background = "#efefef")}
          >
            Open Builder
            <ArrowRight size={13} />
          </a>
        </header>
      </div>

      {/* ── Body ────────────────────────────────────────────────────────── */}
      <div style={{
        flex: 1, display: "flex",
        maxWidth: 1280, margin: "0 auto", width: "100%",
        padding: "0 16px", gap: 0,
        boxSizing: "border-box",
      }}>

        {/* ── Sidebar ─────────────────────────────────────────────────── */}
        <aside style={{
          width: 264, flexShrink: 0,
          padding: "32px 16px 60px 0",
          position: "sticky", top: 70,
          height: "calc(100vh - 70px)", overflowY: "auto",
          scrollbarWidth: "none",
          borderRight: `1px solid ${BORDER}`,
        }}>
          <Sidebar />
        </aside>

        {/* ── Content ─────────────────────────────────────────────────── */}
        <main
          ref={contentRef}
          style={{
            flex: 1, minWidth: 0,
            padding: "48px 0 120px 56px",
            maxWidth: 820,
          }}
        >

          {/* ══ INTRODUCTION ══════════════════════════════════════════════ */}
          <section id="intro" data-section style={{ marginBottom: 8 }}>
            <div style={{
              display: "inline-flex", alignItems: "center", gap: 7,
              background: "rgba(88,101,242,0.10)", border: "1px solid rgba(88,101,242,0.2)",
              borderRadius: 8, padding: "4px 12px", marginBottom: 20,
              fontSize: 12, fontWeight: 600, color: "#818cf8",
            }}>
              <BookOpen size={12} />
              Getting Started
            </div>
            <H1>What is OpenEmbedded?</H1>
            <P>
              OpenEmbedded is a visual node-graph builder for Discord messages.
              Instead of writing JSON by hand, you drag and drop components onto
              an infinite canvas, connect them visually, and export a ready-to-use
              Discord Components V2 payload — or send it live via webhook or bot.
            </P>
            <P>
              It supports the full Discord CV2 spec: containers, sections,
              text displays, thumbnails, media galleries, separators, action rows,
              buttons, and string selects.
            </P>

            {/* Feature cards */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, margin: "28px 0" }}>
              {[
                { icon: <Layers size={18} />,          color: ACCENT,  t: "Visual Node Graph",    d: "Drag & drop all CV2 components on an infinite canvas" },
                { icon: <Package size={18} />,          color: "#3fb950", t: "All CV2 Types",       d: "Container, Section, Text, Gallery, Button, Select" },
                { icon: <Code2 size={18} />,            color: AMBER,   t: "Instant Export",       d: "JSON payload or discord.js v14 builder code" },
                { icon: <Send size={18} />,             color: "#e879f9", t: "Live Send",           d: "Push directly to Discord via webhook or bot token" },
              ].map((f) => (
                <div key={f.t} style={{ ...card(), padding: "16px 18px" }}>
                  <div style={{
                    width: 34, height: 34, borderRadius: 9,
                    background: `${f.color}15`, border: `1px solid ${f.color}28`,
                    display: "flex", alignItems: "center", justifyContent: "center",
                    color: f.color, marginBottom: 12,
                  }}>{f.icon}</div>
                  <div style={{ fontSize: 14, fontWeight: 700, color: TEXT_PRI, marginBottom: 4 }}>{f.t}</div>
                  <div style={{ fontSize: 13, color: TEXT_SEC, lineHeight: 1.55 }}>{f.d}</div>
                </div>
              ))}
            </div>
          </section>

          {/* ══ QUICK START ═══════════════════════════════════════════════ */}
          <section id="quickstart" data-section>
            <H2 id="quickstart">Quick Start</H2>
            <P>Get your first embed built and sent in under 2 minutes.</P>

            {[
              { n: "1", t: "Create a project", d: <>Click <strong style={{ color: TEXT_PRI }}>+ New Project</strong> on the home page. Give it a name — this is saved to the database automatically.</> },
              { n: "2", t: "Add a Container node", d: <>In the left sidebar, click <IC>Container</IC>. A node appears on the canvas. This is the top-level wrapper for all CV2 content.</> },
              { n: "3", t: "Add content nodes", d: <>Click <IC>Text Display</IC>, <IC>Thumbnail</IC>, or any other component. Drag the bottom edge of a node to connect it as a child of the Container.</> },
              { n: "4", t: "Fill in properties", d: <>Click any node to select it. Edit its properties in the right panel — content, label, color, URL, and more.</> },
              { n: "5", t: "Export or Send", d: <>Hit <strong style={{ color: TEXT_PRI }}>Export</strong> in the toolbar to get JSON or discord.js code, or paste your webhook URL to send it live.</> },
            ].map((step, i) => (
              <div key={i} style={{ display: "flex", gap: 16, marginBottom: 20 }}>
                <div style={{
                  width: 28, height: 28, borderRadius: "50%", flexShrink: 0,
                  background: `linear-gradient(135deg, ${ACCENT}, ${ACCENT2})`,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 12, fontWeight: 800, color: "#fff",
                  boxShadow: "0 2px 10px rgba(88,101,242,0.35)",
                  marginTop: 2,
                }}>{step.n}</div>
                <div>
                  <div style={{ fontSize: 15, fontWeight: 700, color: TEXT_PRI, marginBottom: 4 }}>{step.t}</div>
                  <div style={{ fontSize: 14.5, color: TEXT_SEC, lineHeight: 1.65 }}>{step.d}</div>
                </div>
              </div>
            ))}
          </section>

          {/* ══ INTERFACE ════════════════════════════════════════════════ */}
          <section id="interface" data-section>
            <H2 id="interface">Interface Overview</H2>
            <P>The builder is divided into three panels:</P>
            <div style={{ display: "flex", flexDirection: "column", gap: 10, margin: "20px 0" }}>
              {[
                { label: "Left Panel — Library",     color: ACCENT,   d: "Search and browse all available component types. Click any item to add it to the canvas at the center." },
                { label: "Center — Canvas",          color: GREEN,    d: "The infinite node graph workspace. Drag to pan, scroll to zoom. Nodes connect via edges to form the message hierarchy." },
                { label: "Right Panel — Properties", color: "#e879f9", d: "Edit the selected node's data. Changes are reflected live in the Discord Preview tab." },
              ].map((p) => (
                <div key={p.label} style={{
                  ...card(), padding: "14px 18px",
                  borderLeft: `3px solid ${p.color}`,
                  display: "flex", flexDirection: "column", gap: 6,
                }}>
                  <span style={{ fontSize: 14, fontWeight: 700, color: TEXT_PRI }}>{p.label}</span>
                  <span style={{ fontSize: 13.5, color: TEXT_SEC, lineHeight: 1.6 }}>{p.d}</span>
                </div>
              ))}
            </div>
            <Callout type="tip">
              Use <IC>Ctrl + Z</IC> / <IC>Ctrl + Shift + Z</IC> to undo and redo. The canvas auto-saves every few seconds.
            </Callout>
          </section>

          {/* ══ KEYBOARD SHORTCUTS ════════════════════════════════════════ */}
          <section id="shortcuts" data-section>
            <H2 id="shortcuts">Keyboard Shortcuts</H2>
            <P>Speed up your workflow with these shortcuts — they work anywhere on the canvas.</P>
            <div style={{ display: "flex", flexDirection: "column", gap: 6, margin: "20px 0 28px" }}>
              {[
                { keys: ["Ctrl", "Z"],           label: "Undo last action" },
                { keys: ["Ctrl", "Shift", "Z"],  label: "Redo" },
                { keys: ["Ctrl", "A"],           label: "Select all nodes" },
                { keys: ["Backspace / Delete"],  label: "Delete selected node(s)" },
                { keys: ["Ctrl", "C"],           label: "Copy selected node(s)" },
                { keys: ["Ctrl", "V"],           label: "Paste node(s)" },
                { keys: ["Ctrl", "D"],           label: "Duplicate selected node(s)" },
                { keys: ["Scroll"],              label: "Zoom in / out on canvas" },
                { keys: ["Space + drag"],        label: "Pan the canvas" },
                { keys: ["Ctrl", "Shift", "F"],  label: "Fit all nodes into view" },
                { keys: ["Escape"],              label: "Deselect / close panels" },
              ].map((s, i) => (
                <div key={i} style={{
                  ...card(), padding: "11px 18px",
                  display: "flex", alignItems: "center", justifyContent: "space-between", gap: 20,
                }}>
                  <span style={{ fontSize: 13.5, color: TEXT_SEC }}>{s.label}</span>
                  <div style={{ display: "flex", gap: 5, flexShrink: 0 }}>
                    {s.keys.map((k) => (
                      <span key={k} style={{
                        fontFamily: `"JetBrains Mono", monospace`,
                        fontSize: 11.5, fontWeight: 600, color: TEXT_PRI,
                        background: "rgba(255,255,255,0.07)",
                        border: `1px solid rgba(255,255,255,0.13)`,
                        borderBottom: "2px solid rgba(255,255,255,0.18)",
                        borderRadius: 5, padding: "2px 8px",
                        whiteSpace: "nowrap",
                      }}>{k}</span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
            <Callout type="tip">
              On macOS, replace <IC>Ctrl</IC> with <IC>⌘ Cmd</IC> for all shortcuts.
            </Callout>
          </section>

          {/* ══ NODE TYPES — LAYOUT ═══════════════════════════════════════ */}
          <section id="nodes-layout" data-section>
            <div style={{
              display: "inline-flex", alignItems: "center", gap: 7,
              background: "rgba(63,185,80,0.08)", border: "1px solid rgba(63,185,80,0.2)",
              borderRadius: 8, padding: "4px 12px", marginBottom: 8, marginTop: 40,
              fontSize: 12, fontWeight: 600, color: GREEN,
            }}>
              <Layers size={12} /> Node Types
            </div>
            <H2 id="nodes-layout">Layout Nodes</H2>
            <P>
              Layout nodes define the structure of your message. They act as
              containers that hold content and interactive nodes.
            </P>
            <div style={{ display: "flex", flexDirection: "column", gap: 10, margin: "20px 0 28px" }}>
              <NodePill icon={<SquareStack size={16} />} color={ACCENT} name="Container  —  type: 17"
                desc="The top-level wrapper for all Components V2 content. Supports an optional accent color bar on the left edge, and a spoiler toggle." />
              <NodePill icon={<Grid3X3 size={16} />} color="#3b82f6" name="Section  —  type: 9"
                desc="A row layout that holds text content on the left and an optional Thumbnail accessory on the right." />
              <NodePill icon={<Minus size={16} />} color={TEXT_MUT} name="Separator  —  type: 14"
                desc="A horizontal divider. Configure spacing (small, medium, large) and toggle the visible divider line." />
              <NodePill icon={<SquareStack size={16} />} color="#8b5cf6" name="Action Row  —  type: 1"
                desc="A row of up to 5 interactive components (buttons or string selects). Required parent for Button nodes." />
            </div>
          </section>

          {/* ══ NODE TYPES — CONTENT ══════════════════════════════════════ */}
          <section id="nodes-content" data-section>
            <H2 id="nodes-content">Content Nodes</H2>
            <P>Content nodes display text, images, and media inside a layout container.</P>
            <div style={{ display: "flex", flexDirection: "column", gap: 10, margin: "20px 0 28px" }}>
              <NodePill icon={<AlignLeft size={16} />} color={GREEN} name="Text Display  —  type: 10"
                desc="Renders markdown text. Supports Discord markdown: **bold**, *italic*, `code`, > blockquote, and more." />
              <NodePill icon={<Image size={16} />} color={AMBER} name="Thumbnail  —  type: 11"
                desc="A single image, typically used as an accessory in a Section node. Enter a public image URL." />
              <NodePill icon={<Grid3X3 size={16} />} color="#e879f9" name="Media Gallery  —  type: 12"
                desc="A grid of up to 10 images. Each item has a URL and an optional description caption." />
            </div>
          </section>

          {/* ══ NODE TYPES — INTERACTIVE ══════════════════════════════════ */}
          <section id="nodes-interactive" data-section>
            <H2 id="nodes-interactive">Interactive Nodes</H2>
            <P>
              Interactive nodes require a parent <IC>Action Row</IC>. They capture user
              input and trigger bot events via <IC>custom_id</IC>.
            </P>
            <div style={{ display: "flex", flexDirection: "column", gap: 10, margin: "20px 0 28px" }}>
              <NodePill icon={<MousePointerClick size={16} />} color={ACCENT} name="Button  —  type: 2"
                desc="Five styles: Primary, Secondary, Success, Danger, and Link. Set a custom_id (for bot events) or a URL (for Link buttons)." />
              <NodePill icon={<AlignLeft size={16} />} color="#06b6d4" name="String Select  —  type: 3"
                desc="A dropdown menu with up to 25 options. Each option has a label, value, and optional description." />
            </div>
            <Callout type="info">
              Interactive nodes only work in messages sent by a bot. Webhooks can send CV2 layout and content nodes, but not interactive components.
            </Callout>
          </section>

          {/* ══ EXPORT — JSON ═════════════════════════════════════════════ */}
          <section id="export-json" data-section>
            <div style={{
              display: "inline-flex", alignItems: "center", gap: 7,
              background: `rgba(210,153,34,0.08)`, border: "1px solid rgba(210,153,34,0.2)",
              borderRadius: 8, padding: "4px 12px", marginBottom: 8, marginTop: 40,
              fontSize: 12, fontWeight: 600, color: AMBER,
            }}>
              <Zap size={12} /> Exporting
            </div>
            <H2 id="export-json">Export JSON</H2>
            <P>
              The JSON export gives you the raw Discord API payload. Paste it directly
              into any Discord API request body.
            </P>
            <CodeBlock lang="json">{`{
  "flags": 32768,
  "components": [
    {
      "type": 17,
      "components": [
        { "type": 10, "content": "Hello from **OpenEmbedded**!" },
        {
          "type": 14,
          "spacing": 1,
          "divider": true
        }
      ]
    }
  ]
}`}</CodeBlock>
            <Callout type="warn">
              The <IC>flags: 32768</IC> field (<IC>IS_COMPONENTS_V2</IC>) is required for all CV2 messages. OpenEmbedded sets this automatically.
            </Callout>
          </section>

          {/* ══ EXPORT — CODE ═════════════════════════════════════════════ */}
          <section id="export-code" data-section>
            <H2 id="export-code">Export discord.js Code</H2>
            <P>
              The code export generates ready-to-paste discord.js v14 builder code.
              No manual JSON construction needed.
            </P>
            <CodeBlock lang="javascript">{`const {
  ContainerBuilder,
  TextDisplayBuilder,
  SeparatorBuilder,
} = require('discord.js');

const comp0 = new ContainerBuilder()
comp0.addComponent(
  new TextDisplayBuilder().setContent("Hello from **OpenEmbedded**!")
);
comp0.addComponent(
  new SeparatorBuilder().setSpacing(1).setDivider(true)
);

const message = {
  flags: 32768,
  components: [comp0],
};`}</CodeBlock>
          </section>

          {/* ══ EXPORT — WEBHOOK ══════════════════════════════════════════ */}
          <section id="export-webhook" data-section>
            <H2 id="export-webhook">Send via Webhook</H2>
            <P>
              In the Export panel, paste your Discord webhook URL and click
              <strong style={{ color: TEXT_PRI }}> Send</strong>. OpenEmbedded's
              server forwards the request so your webhook URL stays private.
            </P>
            <Callout type="info">
              Only layout and content nodes (Container, Section, Text, Gallery, Separator) can be sent via webhook. For interactive buttons and selects you must use a bot.
            </Callout>
            <H3>Finding your webhook URL</H3>
            <P>
              In Discord, go to your channel settings → <strong style={{ color: TEXT_PRI }}>Integrations</strong> →
              <strong style={{ color: TEXT_PRI }}> Webhooks</strong> → Create Webhook → Copy URL.
              It looks like:
            </P>
            <CodeBlock lang="text">{`https://discord.com/api/webhooks/123456789/abcdef...`}</CodeBlock>
          </section>

          {/* ══ BOT — OVERVIEW ════════════════════════════════════════════ */}
          <section id="bot-overview" data-section>
            <div style={{
              display: "inline-flex", alignItems: "center", gap: 7,
              background: "rgba(88,101,242,0.08)", border: "1px solid rgba(88,101,242,0.2)",
              borderRadius: 8, padding: "4px 12px", marginBottom: 8, marginTop: 40,
              fontSize: 12, fontWeight: 600, color: "#818cf8",
            }}>
              <Bot size={12} /> Bot Integration
            </div>
            <H2 id="bot-overview">Bot Integration Overview</H2>
            <P>
              Connect your own Discord bot (hosted anywhere — Pterodactyl, VPS, etc.)
              to OpenEmbedded so it can send pre-built embeds via slash commands.
              The connection is permanent: configured once via environment variables.
            </P>
            <div style={{
              ...card(), padding: "18px 22px", margin: "24px 0",
              fontFamily: `"JetBrains Mono", monospace`, fontSize: 13,
              lineHeight: 2, color: TEXT_SEC,
            }}>
              <div style={{ color: TEXT_MUT, marginBottom: 8, fontSize: 11, textTransform: "uppercase", letterSpacing: "0.06em" }}>Data flow</div>
              {[
                ["Discord user",       "runs /embed send \"Welcome\" #general"],
                ["Pterodactyl bot",    "receives command"],
                ["Bot",                `calls POST /v1/bot/send-project`],
                ["OpenEmbedded API",   "loads project → compiles → sends via Bot Token"],
                ["Discord channel",    "message appears ✓"],
              ].map(([who, what], i, arr) => (
                <div key={i} style={{ display: "flex", gap: 12, alignItems: "baseline" }}>
                  <span style={{ color: ACCENT, minWidth: 160, fontWeight: 600 }}>{who}</span>
                  <span>{what}</span>
                  {i < arr.length - 1 && (
                    <div style={{ display: "none" }} />
                  )}
                </div>
              ))}
            </div>
          </section>

          {/* ══ BOT — SETUP ═══════════════════════════════════════════════ */}
          <section id="bot-setup" data-section>
            <H2 id="bot-setup">Bot Setup</H2>
            <H3>Step 1 — Set env vars on OpenEmbedded</H3>
            <P>Add these to your OpenEmbedded API server's environment:</P>
            <CodeBlock lang="env">{`DISCORD_BOT_TOKEN=Bot.your_bot_token_here
API_SECRET=some_long_random_string_you_generate`}</CodeBlock>

            <H3>Step 2 — Set env vars on your Pterodactyl bot</H3>
            <CodeBlock lang="env">{`OPENEMBEDDED_API_URL=https://your-openembedded-domain.com
OPENEMBEDDED_API_SECRET=same_long_random_string_from_above
DISCORD_BOT_TOKEN=your_bot_token
DISCORD_CLIENT_ID=your_app_id`}</CodeBlock>

            <H3>Step 3 — Call the API from your bot</H3>
            <CodeBlock lang="javascript">{`// In your /embed send command handler:
const res = await fetch(
  \`\${process.env.OPENEMBEDDED_API_URL}/v1/bot/send-project\`,
  {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: \`Bearer \${process.env.OPENEMBEDDED_API_SECRET}\`,
    },
    body: JSON.stringify({ projectId, channelId }),
  }
);
const { success, message } = await res.json();`}</CodeBlock>
            <Callout type="tip">
              Never expose <IC>API_SECRET</IC> or <IC>DISCORD_BOT_TOKEN</IC> in frontend code or public repos. They live only in server environment variables.
            </Callout>
          </section>

          {/* ══ BOT — COMMANDS ════════════════════════════════════════════ */}
          <section id="bot-commands" data-section>
            <H2 id="bot-commands">Slash Commands</H2>
            <P>Recommended slash commands to register on your bot:</P>
            <div style={{ display: "flex", flexDirection: "column", gap: 10, margin: "20px 0" }}>
              {[
                { cmd: "/embed list",                                          desc: "Lists all saved OpenEmbedded projects with their IDs." },
                { cmd: "/embed send <project-name> [channel]",                 desc: "Compiles and sends the embed to the specified channel." },
                { cmd: "/embed preview <project-name>",                        desc: "Returns the raw JSON payload as a code block (ephemeral)." },
              ].map((c) => (
                <div key={c.cmd} style={{ ...card(), padding: "13px 18px", display: "flex", gap: 14, alignItems: "flex-start" }}>
                  <IC>{c.cmd}</IC>
                  <span style={{ fontSize: 13.5, color: TEXT_SEC, lineHeight: 1.55 }}>{c.desc}</span>
                </div>
              ))}
            </div>
          </section>

          {/* ══ API — PROJECTS ════════════════════════════════════════════ */}
          <section id="api-projects" data-section>
            <div style={{
              display: "inline-flex", alignItems: "center", gap: 7,
              background: "rgba(14,165,233,0.08)", border: "1px solid rgba(14,165,233,0.2)",
              borderRadius: 8, padding: "4px 12px", marginBottom: 8, marginTop: 40,
              fontSize: 12, fontWeight: 600, color: "#38bdf8",
            }}>
              <Code2 size={12} /> API Reference
            </div>
            <H2 id="api-projects">Projects API</H2>
            <P>Base URL: <IC>https://your-domain.com/api</IC></P>

            {[
              { method: "GET",    path: "/v1/projects",     desc: "List all projects owned by the authenticated user", auth: true },
              { method: "POST",   path: "/v1/projects",     desc: "Create a new project",              auth: true },
              { method: "GET",    path: "/v1/projects/:id", desc: "Get a single project by ID",        auth: true },
              { method: "PUT",    path: "/v1/projects/:id", desc: "Update project name, graph, or payload", auth: true },
              { method: "DELETE", path: "/v1/projects/:id", desc: "Delete a project permanently",      auth: true },
            ].map((r) => {
              const mc = { GET: GREEN, POST: ACCENT, PUT: AMBER, DELETE: RED, PATCH: "#e879f9" }[r.method] ?? TEXT_MUT;
              return (
                <div key={r.path + r.method} style={{
                  ...card(), padding: "13px 18px", margin: "8px 0",
                  display: "flex", alignItems: "center", gap: 14,
                }}>
                  <span style={{
                    fontSize: 11, fontWeight: 800, color: mc,
                    background: `${mc}18`, border: `1px solid ${mc}30`,
                    borderRadius: 5, padding: "2px 8px", minWidth: 58, textAlign: "center",
                    fontFamily: "monospace",
                  }}>{r.method}</span>
                  <IC>{r.path}</IC>
                  <span style={{ fontSize: 13, color: TEXT_SEC }}>{r.desc}</span>
                </div>
              );
            })}
          </section>

          {/* ══ API — EXPORT ══════════════════════════════════════════════ */}
          <section id="api-export" data-section>
            <H2 id="api-export">Export API</H2>
            {[
              { method: "POST", path: "/v1/export/json", desc: "Compile a graph into a Discord JSON payload" },
              { method: "POST", path: "/v1/export/code", desc: "Compile a graph into discord.js v14 builder code" },
            ].map((r) => {
              const mc = { GET: GREEN, POST: ACCENT, PUT: AMBER, DELETE: RED }[r.method] ?? TEXT_MUT;
              return (
                <div key={r.path} style={{
                  ...card(), padding: "13px 18px", margin: "8px 0",
                  display: "flex", alignItems: "center", gap: 14,
                }}>
                  <span style={{
                    fontSize: 11, fontWeight: 800, color: mc,
                    background: `${mc}18`, border: `1px solid ${mc}30`,
                    borderRadius: 5, padding: "2px 8px", minWidth: 58, textAlign: "center",
                    fontFamily: "monospace",
                  }}>{r.method}</span>
                  <IC>{r.path}</IC>
                  <span style={{ fontSize: 13, color: TEXT_SEC }}>{r.desc}</span>
                </div>
              );
            })}
            <H3>Request body</H3>
            <CodeBlock lang="json">{`{
  "graph": {
    "nodes": [ /* array of React Flow node objects */ ],
    "edges": [ /* array of React Flow edge objects */ ]
  }
}`}</CodeBlock>
          </section>

          {/* ══ API — WEBHOOK ═════════════════════════════════════════════ */}
          <section id="api-webhook" data-section>
            <H2 id="api-webhook">Webhook API</H2>
            <div style={{
              ...card(), padding: "13px 18px", margin: "8px 0",
              display: "flex", alignItems: "center", gap: 14,
            }}>
              <span style={{
                fontSize: 11, fontWeight: 800, color: ACCENT,
                background: `${ACCENT}18`, border: `1px solid ${ACCENT}30`,
                borderRadius: 5, padding: "2px 8px", minWidth: 58, textAlign: "center",
                fontFamily: "monospace",
              }}>POST</span>
              <IC>/v1/webhook/send</IC>
              <span style={{ fontSize: 13, color: TEXT_SEC }}>Send a payload to a Discord webhook URL</span>
            </div>
            <CodeBlock lang="json">{`{
  "webhookUrl": "https://discord.com/api/webhooks/...",
  "payload": {
    "flags": 32768,
    "components": [ ... ]
  }
}`}</CodeBlock>
          </section>

          {/* ══ API — BOT SEND ════════════════════════════════════════════ */}
          <section id="api-bot" data-section>
            <H2 id="api-bot">Bot Send API</H2>
            {[
              { method: "POST", path: "/v1/bot/validate",  desc: "Validate a bot token and list its guilds" },
              { method: "POST", path: "/v1/bot/channels",  desc: "List text channels in a guild" },
              { method: "POST", path: "/v1/bot/send",      desc: "Send a payload to a channel via bot token" },
            ].map((r) => {
              const mc = ACCENT;
              return (
                <div key={r.path} style={{
                  ...card(), padding: "13px 18px", margin: "8px 0",
                  display: "flex", alignItems: "center", gap: 14,
                }}>
                  <span style={{
                    fontSize: 11, fontWeight: 800, color: mc,
                    background: `${mc}18`, border: `1px solid ${mc}30`,
                    borderRadius: 5, padding: "2px 8px", minWidth: 58, textAlign: "center",
                    fontFamily: "monospace",
                  }}>{r.method}</span>
                  <IC>{r.path}</IC>
                  <span style={{ fontSize: 13, color: TEXT_SEC }}>{r.desc}</span>
                </div>
              );
            })}
            <H3>/v1/bot/send  —  request body</H3>
            <CodeBlock lang="json">{`{
  "token": "Bot.your_bot_token",
  "channelId": "1234567890",
  "payload": {
    "flags": 32768,
    "components": [ ... ]
  }
}`}</CodeBlock>

            {/* Final CTA */}
            <div style={{
              ...card({ borderColor: "rgba(88,101,242,0.3)" }),
              padding: "28px 32px", marginTop: 60,
              background: "rgba(88,101,242,0.07)",
              display: "flex", alignItems: "center", justifyContent: "space-between",
              gap: 20, flexWrap: "wrap",
            }}>
              <div>
                <div style={{ fontSize: 18, fontWeight: 700, color: TEXT_PRI, marginBottom: 6 }}>
                  Ready to build?
                </div>
                <div style={{ fontSize: 14, color: TEXT_SEC }}>
                  Open the visual editor and start crafting Discord messages in minutes.
                </div>
              </div>
              <a href="/" style={{
                display: "inline-flex", alignItems: "center", gap: 7,
                background: `linear-gradient(135deg, ${ACCENT}, ${ACCENT2})`,
                border: "none", borderRadius: 9, color: "#fff",
                fontSize: 14, fontWeight: 700, padding: "10px 22px",
                textDecoration: "none",
                boxShadow: "0 4px 20px rgba(88,101,242,0.4)",
                transition: "opacity 0.15s",
              }}>
                Open Builder
                <ArrowRight size={15} />
              </a>
            </div>
          </section>

          {/* ══ FAQ ═══════════════════════════════════════════════════════ */}
          <section id="faq" data-section>
            <div style={{
              display: "inline-flex", alignItems: "center", gap: 7,
              background: "rgba(255,255,255,0.05)", border: `1px solid ${BORDER_STR}`,
              borderRadius: 8, padding: "4px 12px", marginBottom: 8, marginTop: 40,
              fontSize: 12, fontWeight: 600, color: TEXT_SEC,
            }}>
              <Hash size={12} /> FAQ &amp; Troubleshooting
            </div>
            <H2 id="faq">Frequently Asked Questions</H2>

            {[
              {
                q: "My message doesn't appear in Discord — what's wrong?",
                a: "Make sure your payload includes a top-level Container node (type 17). Discord requires the IS_COMPONENTS_V2 flag (flags: 32768) for CV2 messages — OpenEmbedded sets this automatically. If you're sending via webhook, confirm the webhook URL is valid and the channel still exists.",
              },
              {
                q: "Can I send interactive buttons and selects via webhook?",
                a: "No. Discord's API does not allow interactive components (buttons, string selects) via webhooks — they require a bot account. Use the Bot Send panel and provide your bot token to send messages with interactive components.",
              },
              {
                q: "Where is my project saved?",
                a: "Projects are saved to our PostgreSQL database automatically whenever you make changes. They are linked to your Discord account. You can access them from any device by signing in with the same Discord account.",
              },
              {
                q: "Is my bot token stored on your server?",
                a: "No. Bot tokens are transmitted over HTTPS for the single request you make (send message, fetch channels, etc.) and are never written to our database or server logs. See the Privacy Policy for details.",
              },
              {
                q: "The canvas feels slow — how do I fix it?",
                a: "If you have many nodes, try using Ctrl + Shift + F to fit all nodes into view and reduce rendering load. Splitting very large designs into multiple smaller projects also improves performance.",
              },
              {
                q: "Why are my node connections not compiling correctly?",
                a: "Connections must flow parent → child in the correct order. Containers are the top-level parent. Sections must connect to a Container. Interactive nodes (Buttons, Selects) must connect to an Action Row, which connects to a Container. Check the Node Types reference above for valid parent-child relationships.",
              },
              {
                q: "Can I export a project and import it somewhere else?",
                a: "Yes — use Export JSON to get the raw Discord API payload. You can paste this directly into any Discord API request (REST API, discord.js, etc.). The discord.js Code export gives you ready-to-paste builder code.",
              },
              {
                q: "I get a 401 Unauthorized error on API calls.",
                a: "All project API endpoints require an authenticated session. Sign in with Discord first. Sessions expire after 7 days of inactivity — if your session expired, sign in again.",
              },
            ].map((item, i) => (
              <details key={i} style={{
                ...card(), marginBottom: 8, overflow: "hidden",
              }}>
                <summary style={{
                  padding: "15px 20px", cursor: "pointer",
                  fontSize: 14.5, fontWeight: 600, color: TEXT_PRI,
                  display: "flex", alignItems: "center", justifyContent: "space-between",
                  gap: 12, listStyle: "none",
                  userSelect: "none",
                }}>
                  {item.q}
                  <ChevronRight size={15} style={{ color: TEXT_MUT, flexShrink: 0 }} />
                </summary>
                <div style={{
                  padding: "0 20px 16px", fontSize: 14, lineHeight: 1.7,
                  color: TEXT_SEC, borderTop: `1px solid ${BORDER}`,
                  paddingTop: 14, marginTop: 0,
                }}>
                  {item.a}
                </div>
              </details>
            ))}

            <Callout type="info">
              Still stuck? Join our{" "}
              <a href="https://discord.gg/FG7zPH7DTv" target="_blank" rel="noreferrer"
                style={{ color: "#818cf8", textDecoration: "none", fontWeight: 600 }}>
                Discord support server
              </a>
              {" "}and we'll help you out.
            </Callout>
          </section>
        </main>
      </div>

      {/* ── Docs footer ─────────────────────────────────────────────── */}
      <footer style={{
        borderTop: `1px solid ${BORDER}`,
        padding: "20px 32px",
        display: "flex", alignItems: "center", justifyContent: "space-between",
        flexWrap: "wrap", gap: 12,
      }}>
        <div style={{ fontSize: 13, color: TEXT_MUT }}>© 2026 OpenEmbedded</div>
        <div style={{ display: "flex", gap: 20, flexWrap: "wrap" }}>
          {[
            { label: "Home",           href: "/" },
            { label: "Terms of Service", href: "/tos" },
            { label: "Privacy Policy", href: "/privacy" },
            { label: "Support",        href: "https://discord.gg/FG7zPH7DTv" },
          ].map((l) => (
            <a key={l.label} href={l.href}
              style={{ fontSize: 13, color: TEXT_MUT, textDecoration: "none", transition: "color 0.12s" }}
              onMouseEnter={(e) => (e.currentTarget.style.color = TEXT_SEC)}
              onMouseLeave={(e) => (e.currentTarget.style.color = TEXT_MUT)}
            >{l.label}</a>
          ))}
        </div>
      </footer>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');
        html { scroll-behavior: smooth; }
        ::-webkit-scrollbar { width: 6px; height: 6px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.12); border-radius: 3px; }
        @media (max-width: 768px) {
          .docs-mobile-menu { display: flex !important; }
          aside { display: none !important; }
          main { padding-left: 0 !important; }
        }
        @media (max-width: 420px) {
          .docs-brand-name { display: none !important; }
          .docs-brand-divider { display: none !important; }
        }
        .docs-outer { overflow-x: hidden; }
      `}</style>
    </div>
  );
}
