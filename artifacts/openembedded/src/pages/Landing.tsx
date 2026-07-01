// @ts-nocheck
import { useEffect, useRef, useState } from "react";
import { useLocation } from "wouter";
import { useAuth } from "../lib/authContext.js";
import { ContainerScroll } from "../components/ui/container-scroll-animation";

/* ── Builder design tokens (mirrors index.css) ─────────────────────────────── */
const C = {
  canvas:   "#111111",
  panel:    "#1a1a1a",
  elevated: "#222222",
  float:    "#2a2a2a",
  node:     "#252525",
  b1: "rgba(255,255,255,0.04)",
  b2: "rgba(255,255,255,0.07)",
  b3: "rgba(255,255,255,0.10)",
  b4: "rgba(255,255,255,0.16)",
  t1: "#f0f0f0",
  t2: "#909090",
  t3: "#555555",
  t4: "#333333",
  blurple: "#5865F2",
  shadow: {
    sm:  "0 2px 8px rgba(0,0,0,0.7),  0 0 0 1px rgba(255,255,255,0.05)",
    md:  "0 4px 16px rgba(0,0,0,0.75), 0 0 0 1px rgba(255,255,255,0.055)",
    lg:  "0 8px 32px rgba(0,0,0,0.8),  0 0 0 1px rgba(255,255,255,0.06)",
    xl:  "0 16px 48px rgba(0,0,0,0.82), 0 0 0 1px rgba(255,255,255,0.065)",
    xxl: "0 24px 64px rgba(0,0,0,0.85), 0 0 0 1px rgba(255,255,255,0.07)",
  },
} as const;

function DiscordIcon({ size = 18 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 -28.5 256 256" fill="currentColor" aria-hidden>
      <path d="M216.856 16.597A208.502 208.502 0 0 0 164.042 0c-2.275 4.113-4.933 9.645-6.766 14.046-19.692-2.961-39.203-2.961-58.533 0-1.832-4.4-4.55-9.933-6.846-14.046a207.809 207.809 0 0 0-52.855 16.638C5.618 67.147-3.443 116.4 1.087 164.956c22.169 16.555 43.653 26.612 64.775 33.193A161.094 161.094 0 0 0 79.735 175.3a136.413 136.413 0 0 1-21.846-10.632 108.636 108.636 0 0 0 5.356-4.237c42.122 19.702 87.89 19.702 129.51 0a131.66 131.66 0 0 0 5.355 4.237 136.07 136.07 0 0 1-21.886 10.653c4.006 8.02 8.638 15.67 13.873 22.848 21.142-6.58 42.646-16.637 64.815-33.213 5.316-56.288-9.08-105.09-38.056-148.36ZM85.474 135.095c-12.645 0-23.015-11.805-23.015-26.18s10.149-26.2 23.015-26.2c12.867 0 23.236 11.804 23.015 26.2.02 14.375-10.148 26.18-23.015 26.18Zm85.051 0c-12.645 0-23.014-11.805-23.014-26.18s10.148-26.2 23.014-26.2c12.867 0 23.236 11.804 23.015 26.2 0 14.375-10.148 26.18-23.015 26.18Z" />
    </svg>
  );
}

/* ── Builder screenshot mockup ─────────────────────────────────────────────── */
function NodeMockup() {
  return (
    <div style={{ position: "relative", width: "100%", height: "100%", background: "#111111" }}>
      <img
        src="/builder-preview.png"
        alt="OpenEmbedded builder — node graph with Discord preview"
        style={{
          width: "100%",
          height: "100%",
          objectFit: "cover",
          objectPosition: "top center",
          display: "block",
        }}
      />
    </div>
  );
}

const FEATURES = [
  {
    icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.07 4.93a10 10 0 0 1 0 14.14"/><path d="M4.93 4.93a10 10 0 0 0 0 14.14"/><line x1="12" y1="2" x2="12" y2="5"/><line x1="12" y1="19" x2="12" y2="22"/></svg>,
    color: "#5865F2", title: "Visual Node Graph",
    desc: "Connect nodes like wires on a circuit board. See exactly how your message hierarchy fits together — no JSON, no guessing.",
  },
  {
    icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2L2 7l10 5 10-5-10-5z"/><path d="M2 17l10 5 10-5"/><path d="M2 12l10 5 10-5"/></svg>,
    color: "#8b5cf6", title: "All CV2 Components",
    desc: "Containers, Sections, Text Displays, Galleries, Separators, Action Rows — every Components V2 type, fully visual.",
  },
  {
    icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M1 6v16l7-4 8 4 7-4V2l-7 4-8-4-7 4z"/><line x1="8" y1="2" x2="8" y2="18"/><line x1="16" y1="6" x2="16" y2="22"/></svg>,
    color: "#10b981", title: "Live Discord Preview",
    desc: "See exactly how your message looks in Discord — channel header, bubble, embeds, buttons — updating in real time.",
  },
  {
    icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>,
    color: "#f59e0b", title: "Send via Webhook or Bot",
    desc: "Deliver your message directly to any Discord channel — paste a webhook URL or connect a bot token. No code needed.",
  },
  {
    icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/></svg>,
    color: "#ec4899", title: "Export Clean JSON",
    desc: "One click exports the production-ready Discord API payload. Copy or download — drop it straight into your bot.",
  },
  {
    icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>,
    color: "#06b6d4", title: "Secure by Design",
    desc: "SSRF-protected webhook proxy, rate-limited sends, strict Discord URL validation, session auth — security first.",
  },
];

const STEPS = [
  { n: "01", color: "#5865F2", title: "Drop a root node", desc: "Start with a Webhook or Bot node, then drag components from the library onto your canvas." },
  { n: "02", color: "#8b5cf6", title: "Build your layout", desc: "Add Containers, Sections, Buttons, Text Displays. Live preview updates with every connection." },
  { n: "03", color: "#10b981", title: "Send to Discord", desc: "Click Send. Your canvas is compiled, validated, and delivered to Discord in under a second." },
];

/* ── Mobile Discord preview mockup ────────────────────────────────────────── */
function MobileMockup() {
  return (
    <div style={{ position: "relative", width: "100%", height: "100%", background: "#111111" }}>
      <img
        src="/builder-preview-mobile.jpg"
        alt="OpenEmbedded builder on mobile — canvas view"
        style={{
          width: "100%",
          height: "100%",
          objectFit: "cover",
          objectPosition: "top center",
          display: "block",
        }}
      />
    </div>
  );
}

/* ── Reusable section label ────────────────────────────────────────────────── */
function SectionLabel({ children }: { children: string }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8, justifyContent: "center", marginBottom: 16 }}>
      <div style={{ height: 1, width: 24, background: C.b3 }} />
      <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: C.t3 }}>
        {children}
      </span>
      <div style={{ height: 1, width: 24, background: C.b3 }} />
    </div>
  );
}

export function Landing() {
  const [, navigate] = useLocation();
  const { auth, login } = useAuth();
  const heroRef = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setVisible(true), 60);
    return () => clearTimeout(t);
  }, []);

  if (auth.status === "authenticated") {
    navigate("/");
    return null;
  }

  /* ── Shared interactive button handlers ──────────────────────────────────── */
  const blurpleBtn = {
    base: { background: C.blurple, border: "none", borderRadius: 10, color: "#fff", cursor: "pointer", display: "flex", alignItems: "center", gap: 8, fontWeight: 700, letterSpacing: "-0.02em", transition: "all 0.12s" },
    in:  (e: React.MouseEvent) => { (e.currentTarget as HTMLElement).style.background = "#6773f5"; (e.currentTarget as HTMLElement).style.boxShadow = `0 6px 24px rgba(88,101,242,0.55)`; },
    out: (e: React.MouseEvent) => { (e.currentTarget as HTMLElement).style.background = C.blurple; (e.currentTarget as HTMLElement).style.boxShadow = `0 3px 14px rgba(88,101,242,0.4)`; },
  };

  return (
    <div style={{ background: C.canvas, color: C.t1, minHeight: "100dvh", overflowX: "hidden" }}>

      {/* ── Navbar — floating pill, matches Builder toolbar ─────────────────── */}
      <div style={{ position: "fixed", top: 0, left: 0, right: 0, zIndex: 100, padding: "10px 16px" }}>
        <nav style={{
          background: "rgba(22,22,22,0.93)",
          backdropFilter: "blur(24px) saturate(160%)",
          WebkitBackdropFilter: "blur(24px) saturate(160%)",
          border: `1px solid ${C.b3}`,
          borderRadius: 14,
          boxShadow: C.shadow.lg,
          display: "flex", alignItems: "center", justifyContent: "space-between",
          padding: "0 16px", height: 48, gap: 12,
        }}>
          {/* Logo */}
          <div style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
            <img src="/logo.png" alt="OpenEmbedded" width={26} height={26} style={{ borderRadius: 7, objectFit: "contain" }} />
            <span style={{ fontSize: 13, fontWeight: 700, letterSpacing: "-0.03em", color: C.t1 }}>OpenEmbedded</span>
          </div>

          {/* Right actions */}
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <a
              href="/docs"
              style={{ color: C.t3, fontSize: 12, fontWeight: 500, textDecoration: "none", padding: "5px 10px", borderRadius: 7, border: `1px solid transparent`, transition: "all 0.12s" }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.05)"; (e.currentTarget as HTMLElement).style.color = C.t2; }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = "transparent"; (e.currentTarget as HTMLElement).style.color = C.t3; }}
            >
              Docs
            </a>
            <div style={{ width: 1, height: 18, background: C.b2 }} />
            <button
              onClick={login}
              style={{ ...blurpleBtn.base, fontSize: 12, padding: "7px 14px", boxShadow: `0 3px 14px rgba(88,101,242,0.4)` }}
              onMouseEnter={blurpleBtn.in}
              onMouseLeave={blurpleBtn.out}
            >
              <DiscordIcon size={14} />
              Sign in
            </button>
          </div>
        </nav>
      </div>

      {/* ── Hero ────────────────────────────────────────────────────────────── */}
      <section ref={heroRef} style={{ paddingTop: 136, paddingBottom: 0, textAlign: "center", position: "relative", overflow: "hidden" }}>
        {/* Subtle blurple radial — muted like Builder's hover glows */}
        <div aria-hidden style={{
          position: "absolute", top: -80, left: "50%", transform: "translateX(-50%)",
          width: 800, height: 500,
          background: "radial-gradient(ellipse at 50% 30%, rgba(88,101,242,0.12) 0%, rgba(88,101,242,0.03) 55%, transparent 72%)",
          pointerEvents: "none",
        }} />

        <div style={{ opacity: visible ? 1 : 0, transform: visible ? "none" : "translateY(18px)", transition: "opacity 0.55s ease, transform 0.55s ease" }}>

          {/* Badge — matches Builder's node badge pill style */}
          <div style={{
            display: "inline-flex", alignItems: "center", gap: 6,
            padding: "4px 10px 4px 6px", borderRadius: 100,
            background: C.panel, border: `1px solid ${C.b3}`,
            fontSize: 11, fontWeight: 600, color: C.t3,
            marginBottom: 28, boxShadow: C.shadow.sm,
          }}>
            <span style={{ padding: "1px 6px", background: C.blurple, borderRadius: 100, color: "#fff", fontSize: 9, fontWeight: 800, letterSpacing: "0.05em", textTransform: "uppercase" }}>NEW</span>
            Discord Components V2 support
          </div>

          {/* Headline */}
          <h1 style={{
            margin: "0 auto 18px",
            fontSize: "clamp(38px, 6.5vw, 76px)",
            fontWeight: 900, letterSpacing: "-0.045em", lineHeight: 1.0,
            color: C.t1, maxWidth: 860, padding: "0 24px",
          }}>
            Build Discord messages{" "}
            <span style={{ background: "linear-gradient(135deg, #5865F2 0%, #818cf8 50%, #a78bfa 100%)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}>
              visually.
            </span>
          </h1>

          {/* Subheadline — matches Builder's description text style */}
          <p style={{ margin: "0 auto 36px", fontSize: "clamp(14px, 2vw, 17px)", color: C.t3, maxWidth: 500, lineHeight: 1.7, padding: "0 24px", fontWeight: 400 }}>
            A node-graph editor for Discord embeds and Components V2.
            No JSON. No guesswork. Just drag, connect, and send.
          </p>

          {/* CTAs */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 10, flexWrap: "wrap", padding: "0 24px" }}>
            <button
              onClick={login}
              style={{ ...blurpleBtn.base, fontSize: 14, padding: "11px 24px", boxShadow: `0 4px 20px rgba(88,101,242,0.45)` }}
              onMouseEnter={blurpleBtn.in}
              onMouseLeave={blurpleBtn.out}
            >
              <DiscordIcon size={16} />
              Start Building
            </button>
            <a
              href="/docs"
              style={{
                display: "flex", alignItems: "center", gap: 6,
                padding: "11px 20px",
                background: C.panel, border: `1px solid ${C.b3}`, borderRadius: 10,
                color: C.t2, fontSize: 14, fontWeight: 600,
                textDecoration: "none", transition: "all 0.12s", boxShadow: C.shadow.sm,
              }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = C.elevated; (e.currentTarget as HTMLElement).style.borderColor = C.b4; (e.currentTarget as HTMLElement).style.color = C.t1; }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = C.panel; (e.currentTarget as HTMLElement).style.borderColor = C.b3; (e.currentTarget as HTMLElement).style.color = C.t2; }}
            >
              Read the docs
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"/></svg>
            </a>
          </div>

        </div>
      </section>

      {/* ── Scroll Animation Showcase ────────────────────────────────────────── */}
      <div style={{ background: C.canvas, marginTop: -40 }}>
        <ContainerScroll
          titleComponent={
            <div style={{ marginBottom: 24 }}>
              <p style={{
                fontSize: "clamp(11px, 1.4vw, 13px)",
                fontWeight: 700,
                letterSpacing: "0.1em",
                textTransform: "uppercase",
                color: C.t3,
                marginBottom: 12,
              }}>
                See it in action
              </p>
              <h2 style={{
                fontSize: "clamp(28px, 4vw, 52px)",
                fontWeight: 900,
                letterSpacing: "-0.04em",
                lineHeight: 1.05,
                color: C.t1,
                margin: "0 auto",
                maxWidth: 700,
                padding: "0 20px",
              }}>
                Your canvas.{" "}
                <span style={{
                  background: "linear-gradient(135deg, #5865F2 0%, #818cf8 50%, #a78bfa 100%)",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                  backgroundClip: "text",
                }}>
                  Any screen.
                </span>
              </h2>
              <p style={{
                fontSize: "clamp(13px, 1.6vw, 15px)",
                color: C.t3,
                maxWidth: 440,
                lineHeight: 1.7,
                margin: "16px auto 0",
                padding: "0 20px",
              }}>
                Build complex Discord messages visually — from the full node canvas on desktop to previewing exactly how it looks on mobile.
              </p>
            </div>
          }
        >
          {/* Responsive content: desktop canvas on md+, mobile Discord UI on small */}
          <div style={{ width: "100%", height: "100%", position: "relative" }}>
            {/* Desktop node canvas mockup */}
            <div className="hidden md:block" style={{ width: "100%", height: "100%" }}>
              <NodeMockup />
            </div>
            {/* Mobile Discord preview */}
            <div className="block md:hidden" style={{ width: "100%", height: "100%" }}>
              <MobileMockup />
            </div>
          </div>
        </ContainerScroll>
      </div>

      {/* ── Features Grid ───────────────────────────────────────────────────── */}
      <section style={{ padding: "112px 20px 80px", maxWidth: 1060, margin: "0 auto" }}>
        <div style={{ marginBottom: 64 }}>
          <SectionLabel>Everything you need</SectionLabel>
          <div className="oe-feat-header" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24, marginTop: 20, alignItems: "end" }}>
            <h2 style={{ fontSize: "clamp(28px, 3.8vw, 46px)", fontWeight: 900, letterSpacing: "-0.045em", color: C.t1, margin: 0, lineHeight: 1.05 }}>
              The complete Discord<br />message toolkit
            </h2>
            <p style={{ color: C.t3, fontSize: 15, margin: 0, lineHeight: 1.75, maxWidth: 360 }}>
              Every tool a community manager or bot developer needs — built into one visual workspace. No code, no JSON, no context switching.
            </p>
          </div>
        </div>

        {/* 3-col bento — 2 large, 4 small */}
        <div className="oe-bento" style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 1, border: `1px solid ${C.b2}`, borderRadius: 16, overflow: "hidden" }}>

          {/* F0: Visual Node Graph — 2-col */}
          <div className="oe-bento-wide"
            style={{ gridColumn: "span 2", padding: "36px 28px", background: C.panel, borderRight: `1px solid ${C.b2}`, borderBottom: `1px solid ${C.b2}`, transition: "background 0.15s", cursor: "default" }}
            onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = C.elevated; }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = C.panel; }}
          >
            <div style={{ width: 44, height: 44, borderRadius: 11, background: C.elevated, border: `1px solid ${C.b3}`, display: "flex", alignItems: "center", justifyContent: "center", color: C.t1, marginBottom: 20 }}>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.07 4.93a10 10 0 0 1 0 14.14"/><path d="M4.93 4.93a10 10 0 0 0 0 14.14"/><line x1="12" y1="2" x2="12" y2="5"/><line x1="12" y1="19" x2="12" y2="22"/></svg>
            </div>
            <h3 style={{ margin: "0 0 8px", fontSize: 15, fontWeight: 800, color: C.t1, letterSpacing: "-0.025em" }}>Visual Node Graph</h3>
            <p style={{ margin: "0 0 20px", fontSize: 13, color: C.t3, lineHeight: 1.7 }}>
              Connect nodes like wires on a circuit board. See exactly how your message hierarchy fits together — no JSON, no guessing.
            </p>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
              {([
                { label: "Webhook", color: "#5865F2" },
                { label: "Container", color: "#8b5cf6" },
                { label: "Section", color: "#f59e0b" },
                { label: "Button", color: "#10b981" },
              ] as { label: string; color: string }[]).map((n) => (
                <span key={n.label} style={{ fontSize: 10, fontWeight: 600, padding: "3px 7px", background: C.canvas, border: `1px solid ${C.b3}`, borderRadius: 5, color: C.t3, letterSpacing: "0.02em", display: "flex", alignItems: "center", gap: 4 }}>
                  <span style={{ width: 5, height: 5, borderRadius: "50%", background: n.color, display: "inline-block", flexShrink: 0 }} />
                  {n.label}
                </span>
              ))}
            </div>
          </div>

          {/* F1: All CV2 Components */}
          <div
            style={{ padding: "36px 28px", background: C.panel, borderBottom: `1px solid ${C.b2}`, transition: "background 0.15s", cursor: "default" }}
            onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = C.elevated; }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = C.panel; }}
          >
            <div style={{ width: 44, height: 44, borderRadius: 11, background: C.elevated, border: `1px solid ${C.b3}`, display: "flex", alignItems: "center", justifyContent: "center", color: C.t1, marginBottom: 20 }}>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2L2 7l10 5 10-5-10-5z"/><path d="M2 17l10 5 10-5"/><path d="M2 12l10 5 10-5"/></svg>
            </div>
            <h3 style={{ margin: "0 0 8px", fontSize: 15, fontWeight: 800, color: C.t1, letterSpacing: "-0.025em" }}>All CV2 Components</h3>
            <p style={{ margin: "0 0 20px", fontSize: 13, color: C.t3, lineHeight: 1.7 }}>
              Every Components V2 type — Container, Section, Text Display, Gallery, Action Row — fully visual.
            </p>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
              {["Container", "Section", "Text", "Gallery", "Button", "Separator"].map(tag => (
                <span key={tag} style={{ fontSize: 10, fontWeight: 600, padding: "3px 7px", background: C.canvas, border: `1px solid ${C.b3}`, borderRadius: 5, color: C.t3, letterSpacing: "0.02em" }}>{tag}</span>
              ))}
            </div>
          </div>

          {/* F2: Live Preview */}
          <div
            style={{ padding: "36px 28px", background: C.panel, borderRight: `1px solid ${C.b2}`, borderBottom: `1px solid ${C.b2}`, transition: "background 0.15s", cursor: "default" }}
            onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = C.elevated; }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = C.panel; }}
          >
            <div style={{ width: 44, height: 44, borderRadius: 11, background: C.elevated, border: `1px solid ${C.b3}`, display: "flex", alignItems: "center", justifyContent: "center", color: C.t1, marginBottom: 20 }}>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><path d="M1 6v16l7-4 8 4 7-4V2l-7 4-8-4-7 4z"/><line x1="8" y1="2" x2="8" y2="18"/><line x1="16" y1="6" x2="16" y2="22"/></svg>
            </div>
            <h3 style={{ margin: "0 0 8px", fontSize: 15, fontWeight: 800, color: C.t1, letterSpacing: "-0.025em" }}>Live Discord Preview</h3>
            <p style={{ margin: "0 0 20px", fontSize: 13, color: C.t3, lineHeight: 1.7 }}>
              See your message exactly as Discord renders it — channel header, bot bubble, embeds, buttons — in real time.
            </p>
            <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
              <div style={{ width: 7, height: 7, borderRadius: "50%", background: "#10b981" }} />
              <span style={{ fontSize: 11, fontWeight: 600, color: "#10b981", letterSpacing: "0.01em" }}>Updates on every connection</span>
            </div>
          </div>

          {/* F3: Send via Webhook */}
          <div
            style={{ padding: "36px 28px", background: C.panel, borderRight: `1px solid ${C.b2}`, borderBottom: `1px solid ${C.b2}`, transition: "background 0.15s", cursor: "default" }}
            onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = C.elevated; }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = C.panel; }}
          >
            <div style={{ width: 44, height: 44, borderRadius: 11, background: C.elevated, border: `1px solid ${C.b3}`, display: "flex", alignItems: "center", justifyContent: "center", color: C.t1, marginBottom: 20 }}>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>
            </div>
            <h3 style={{ margin: "0 0 8px", fontSize: 15, fontWeight: 800, color: C.t1, letterSpacing: "-0.025em" }}>Send via Webhook or Bot</h3>
            <p style={{ margin: 0, fontSize: 13, color: C.t3, lineHeight: 1.7 }}>
              Paste a webhook URL or connect a bot token. Message delivered in under a second. No code needed.
            </p>
          </div>

          {/* F4: Export JSON */}
          <div
            style={{ padding: "36px 28px", background: C.panel, borderRight: `1px solid ${C.b2}`, transition: "background 0.15s", cursor: "default" }}
            onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = C.elevated; }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = C.panel; }}
          >
            <div style={{ width: 44, height: 44, borderRadius: 11, background: C.elevated, border: `1px solid ${C.b3}`, display: "flex", alignItems: "center", justifyContent: "center", color: C.t1, marginBottom: 20 }}>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/></svg>
            </div>
            <h3 style={{ margin: "0 0 8px", fontSize: 15, fontWeight: 800, color: C.t1, letterSpacing: "-0.025em" }}>Export Clean JSON</h3>
            <p style={{ margin: 0, fontSize: 13, color: C.t3, lineHeight: 1.7 }}>
              One click exports the production-ready Discord API payload. Copy or download it straight into your bot code.
            </p>
          </div>

          {/* F5: Secure by Design */}
          <div
            style={{ padding: "36px 28px", background: C.panel, transition: "background 0.15s", cursor: "default" }}
            onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = C.elevated; }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = C.panel; }}
          >
            <div style={{ width: 44, height: 44, borderRadius: 11, background: C.elevated, border: `1px solid ${C.b3}`, display: "flex", alignItems: "center", justifyContent: "center", color: C.t1, marginBottom: 20 }}>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
            </div>
            <h3 style={{ margin: "0 0 8px", fontSize: 15, fontWeight: 800, color: C.t1, letterSpacing: "-0.025em" }}>Secure by Design</h3>
            <p style={{ margin: 0, fontSize: 13, color: C.t3, lineHeight: 1.7 }}>
              SSRF-protected proxy, rate-limited sends, strict Discord URL validation, and session auth out of the box.
            </p>
          </div>

        </div>
      </section>

      {/* ── How It Works ────────────────────────────────────────────────────── */}
      <section style={{ padding: "0 20px 100px", maxWidth: 1060, margin: "0 auto" }}>

        {/* Section header — left-aligned for editorial feel */}
        <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", borderBottom: `1px solid ${C.b2}`, paddingBottom: 20, marginBottom: 48 }}>
          <div>
            <SectionLabel>How it works</SectionLabel>
            <h2 style={{ fontSize: "clamp(24px, 3.2vw, 40px)", fontWeight: 900, letterSpacing: "-0.04em", color: C.t1, margin: "8px 0 0", lineHeight: 1.1 }}>
              From idea to Discord in three steps
            </h2>
          </div>
        </div>

        <div className="oe-steps" style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 1, border: `1px solid ${C.b2}`, borderRadius: 14, overflow: "hidden" }}>
          {STEPS.map((s, i) => (
            <div
              key={i}
              style={{
                padding: "36px 32px 32px",
                background: C.panel,
                borderRight: i < STEPS.length - 1 ? `1px solid ${C.b2}` : "none",
                transition: "background 0.15s",
              }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = C.elevated; }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = C.panel; }}
            >
              <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.08em", color: s.color, textTransform: "uppercase", marginBottom: 20 }}>
                Step {s.n}
              </div>
              <h3 style={{ margin: "0 0 12px", fontSize: 18, fontWeight: 800, color: C.t1, letterSpacing: "-0.03em", lineHeight: 1.2 }}>
                {s.title}
              </h3>
              <p style={{ margin: 0, fontSize: 13, color: C.t3, lineHeight: 1.8 }}>
                {s.desc}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Why OpenEmbedded — Comparison ───────────────────────────────────── */}
      <section style={{ padding: "0 20px 100px", maxWidth: 1060, margin: "0 auto" }}>

        <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", borderBottom: `1px solid ${C.b2}`, paddingBottom: 20, marginBottom: 48 }}>
          <div>
            <SectionLabel>Why OpenEmbedded</SectionLabel>
            <h2 style={{ fontSize: "clamp(24px, 3.2vw, 40px)", fontWeight: 900, letterSpacing: "-0.04em", color: C.t1, margin: "8px 0 0", lineHeight: 1.1 }}>
              The visual way to build Discord messages
            </h2>
          </div>
        </div>

        <div className="oe-compare-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 1, border: `1px solid ${C.b2}`, borderRadius: 14, overflow: "hidden" }}>
          {/* Old way */}
          <div style={{ padding: "40px 36px", background: C.canvas, borderRight: `1px solid ${C.b2}` }}>
            <p style={{ margin: "0 0 8px", fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em", color: C.t4 }}>
              Without OpenEmbedded
            </p>
            <h3 style={{ margin: "0 0 32px", fontSize: 22, fontWeight: 800, color: C.t3, letterSpacing: "-0.035em", lineHeight: 1.2 }}>
              Painful JSON editing
            </h3>
            {[
              "Write JSON by hand, re-check docs constantly",
              "Context-switch between editor, preview, Discord",
              "Nested components are impossible to visualise",
              "One typo breaks the whole payload",
              "CV2 type IDs and flags all from memory",
            ].map((t, i) => (
              <div key={i} style={{ display: "flex", gap: 12, marginBottom: 14, alignItems: "flex-start" }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={C.t4} strokeWidth="2.5" strokeLinecap="round" style={{ marginTop: 2, flexShrink: 0 }}>
                  <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                </svg>
                <span style={{ color: C.t4, fontSize: 13, lineHeight: 1.65 }}>{t}</span>
              </div>
            ))}
          </div>

          {/* New way */}
          <div style={{ padding: "40px 36px", background: C.panel }}>
            <p style={{ margin: "0 0 8px", fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em", color: C.blurple }}>
              With OpenEmbedded
            </p>
            <h3 style={{ margin: "0 0 32px", fontSize: 22, fontWeight: 800, color: C.t1, letterSpacing: "-0.035em", lineHeight: 1.2 }}>
              See it as you build it
            </h3>
            {[
              "Drag and drop nodes — structure always visible",
              "Live Discord preview updates on every change",
              "Hierarchy is a graph, not a JSON tree",
              "Validation errors shown instantly on the node",
              "Every field is a labelled form — no memorising",
            ].map((t, i) => (
              <div key={i} style={{ display: "flex", gap: 12, marginBottom: 14, alignItems: "flex-start" }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={C.t2} strokeWidth="2.5" strokeLinecap="round" style={{ marginTop: 2, flexShrink: 0 }}>
                  <polyline points="20 6 9 17 4 12"/>
                </svg>
                <span style={{ color: C.t2, fontSize: 13, lineHeight: 1.65 }}>{t}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Final CTA ────────────────────────────────────────────────────────── */}
      <section style={{ padding: "0 20px 112px" }}>
        <div style={{
          maxWidth: 1060, margin: "0 auto",
          border: `1px solid ${C.b3}`,
          borderRadius: 16,
          overflow: "hidden",
        }}>
          <div style={{
            padding: "80px 64px",
            textAlign: "center",
            background: C.panel,
            backgroundImage: "url(/cta-bg.png)",
            backgroundSize: "cover",
            backgroundPosition: "center",
          }}>
            <h2 style={{ fontSize: "clamp(32px, 5vw, 60px)", fontWeight: 900, letterSpacing: "-0.048em", color: C.t1, margin: "0 0 20px", lineHeight: 1.0 }}>
              Your next Discord message<br />is one canvas away.
            </h2>
            <p style={{ color: C.t3, fontSize: 16, margin: "0 auto 40px", maxWidth: 420, lineHeight: 1.75 }}>
              Sign in with Discord and start building in seconds. No setup, no guesswork — just the canvas.
            </p>
            <button
              onClick={login}
              style={{ ...blurpleBtn.base, fontSize: 15, padding: "13px 30px", boxShadow: `0 4px 20px rgba(88,101,242,0.4)` }}
              onMouseEnter={blurpleBtn.in}
              onMouseLeave={blurpleBtn.out}
            >
              <DiscordIcon size={17} />
              Get Started
            </button>
          </div>
        </div>
      </section>

      {/* ── Footer ───────────────────────────────────────────────────────────── */}
      <footer style={{
        borderTop: `1px solid ${C.b2}`,
        padding: "28px 20px",
        maxWidth: 1060, margin: "0 auto",
        display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 14,
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
          <img src="/logo.png" alt="OpenEmbedded" width={18} height={18} style={{ borderRadius: 5, objectFit: "contain", opacity: 0.45 }} />
          <span style={{ fontSize: 12, color: C.t4, fontWeight: 600 }}>OpenEmbedded</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
          {[["Docs", "/docs"], ["Terms", "/tos"], ["Privacy", "/privacy"], ["Support", "/support"]].map(([label, href]) => (
            <a key={href} href={href} style={{ fontSize: 12, color: C.t4, textDecoration: "none", transition: "color 0.12s" }}
              onMouseEnter={(e) => ((e.target as HTMLElement).style.color = C.t2)}
              onMouseLeave={(e) => ((e.target as HTMLElement).style.color = C.t4)}>
              {label}
            </a>
          ))}
        </div>
      </footer>

      <style>{`
        * { box-sizing: border-box; }
        @media (max-width: 720px) {
          .oe-bento {
            grid-template-columns: 1fr !important;
            border: none !important;
            overflow: visible !important;
            border-radius: 0 !important;
            gap: 8px !important;
          }
          .oe-bento > div {
            border-right: 1px solid rgba(255,255,255,0.07) !important;
            border-bottom: 1px solid rgba(255,255,255,0.07) !important;
            border-radius: 12px !important;
          }
          .oe-bento-wide {
            grid-column: span 1 !important;
          }
          .oe-feat-header { grid-template-columns: 1fr !important; }
          .oe-compare-grid {
            grid-template-columns: 1fr !important;
            overflow: visible !important;
            border: none !important;
            border-radius: 0 !important;
            gap: 8px !important;
          }
          .oe-compare-grid > div {
            border-right: 1px solid rgba(255,255,255,0.07) !important;
            border-radius: 12px !important;
          }
          .oe-steps {
            grid-template-columns: 1fr !important;
            overflow: visible !important;
            border: none !important;
            border-radius: 0 !important;
            gap: 8px !important;
          }
          .oe-steps > div {
            border-right: none !important;
            border-radius: 12px !important;
            border: 1px solid rgba(255,255,255,0.07) !important;
          }
        }
      `}</style>
    </div>
  );
}
