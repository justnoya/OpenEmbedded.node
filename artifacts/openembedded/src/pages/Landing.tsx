import { useEffect, useRef, useState } from "react";
import { useLocation } from "wouter";
import { useAuth } from "../lib/authContext.js";

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

/* ── Inline SVG node-graph mockup — mirrors actual Builder canvas ─────────── */
function NodeMockup() {
  return (
    <div style={{ position: "relative", width: "100%", height: "100%" }}>
      <svg width="100%" height="100%" viewBox="0 0 900 520" preserveAspectRatio="xMidYMid meet" fill="none" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <pattern id="dots" x="0" y="0" width="24" height="24" patternUnits="userSpaceOnUse">
            <circle cx="1" cy="1" r="1" fill="rgba(255,255,255,0.045)" />
          </pattern>
          <filter id="glow">
            <feGaussianBlur stdDeviation="3" result="coloredBlur" />
            <feMerge><feMergeNode in="coloredBlur" /><feMergeNode in="SourceGraphic" /></feMerge>
          </filter>
          <linearGradient id="nodeBg" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#2a2a2a" /><stop offset="100%" stopColor="#222222" />
          </linearGradient>
          <linearGradient id="previewBg" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#313338" /><stop offset="100%" stopColor="#2b2d31" />
          </linearGradient>
          <linearGradient id="edgeGrad" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#5865F2" stopOpacity="0.6" /><stop offset="100%" stopColor="#5865F2" stopOpacity="0.15" />
          </linearGradient>
        </defs>
        <rect width="900" height="520" fill="#111111" rx="16" />
        <rect width="900" height="520" fill="url(#dots)" rx="16" />
        <g transform="translate(36,60)">
          <rect width="190" height="96" rx="12" fill="url(#nodeBg)" stroke="rgba(88,101,242,0.5)" strokeWidth="1.5" />
          <rect width="190" height="96" rx="12" fill="rgba(88,101,242,0.04)" />
          <rect x="14" y="16" width="32" height="32" rx="8" fill="rgba(88,101,242,0.22)" stroke="rgba(88,101,242,0.35)" strokeWidth="1" />
          <path d="M30 26L30 22Q30 20 32 20L38 20Q40 20 40 22L40 26Q40 28 38 28L32 28Q30 28 30 26Z" stroke="#818cf8" strokeWidth="1.5" strokeLinecap="round" fill="none"/>
          <path d="M26 34Q30 30 34 34" stroke="#818cf8" strokeWidth="1.5" strokeLinecap="round" fill="none"/>
          <text x="56" y="31" fill="#e2e2e2" fontSize="13" fontWeight="600">Webhook</text>
          <text x="56" y="46" fill="#3d3d3d" fontSize="10">Root node</text>
          <rect x="14" y="58" width="162" height="26" rx="6" fill="rgba(255,255,255,0.03)" stroke="rgba(255,255,255,0.07)" strokeWidth="1"/>
          <text x="24" y="76" fill="#555" fontSize="10">https://discord.com/api/webh…</text>
          <circle cx="190" cy="48" r="5" fill="#5865F2" filter="url(#glow)"/>
        </g>
        <g transform="translate(36,190)">
          <rect width="190" height="80" rx="12" fill="url(#nodeBg)" stroke="rgba(16,185,129,0.4)" strokeWidth="1.5"/>
          <rect x="14" y="14" width="32" height="32" rx="8" fill="rgba(16,185,129,0.18)" stroke="rgba(16,185,129,0.3)" strokeWidth="1"/>
          <path d="M22 24L38 24M22 30L34 30M22 36L36 36" stroke="#34d399" strokeWidth="1.5" strokeLinecap="round"/>
          <text x="56" y="29" fill="#e2e2e2" fontSize="13" fontWeight="600">Message</text>
          <text x="56" y="44" fill="#3d3d3d" fontSize="10">Flow config</text>
          <rect x="14" y="54" width="162" height="16" rx="4" fill="rgba(255,255,255,0.03)"/>
          <text x="20" y="66" fill="#555" fontSize="9">Welcome to our server! ✨</text>
          <circle cx="190" cy="40" r="5" fill="#10b981"/>
        </g>
        <g transform="translate(290,40)">
          <rect width="200" height="102" rx="12" fill="url(#nodeBg)" stroke="rgba(139,92,246,0.7)" strokeWidth="2"/>
          <rect x="14" y="14" width="32" height="32" rx="8" fill="rgba(139,92,246,0.18)" stroke="rgba(139,92,246,0.3)" strokeWidth="1"/>
          <rect x="20" y="20" width="20" height="20" rx="3" stroke="#a78bfa" strokeWidth="1.5" fill="none"/>
          <rect x="23" y="23" width="6" height="4" rx="1" fill="#a78bfa"/>
          <text x="56" y="29" fill="#e2e2e2" fontSize="13" fontWeight="600">Container</text>
          <text x="56" y="44" fill="#3d3d3d" fontSize="10">Component 17</text>
          <text x="14" y="72" fill="#555" fontSize="9">Accent color</text>
          <rect x="14" y="78" width="80" height="14" rx="4" fill="rgba(255,255,255,0.03)"/>
          <rect x="16" y="80" width="10" height="10" rx="2" fill="#5865F2"/>
          <text x="30" y="89" fill="#666" fontSize="9">#5865F2</text>
          <circle cx="0" cy="51" r="5" fill="#8b5cf6"/>
          <circle cx="200" cy="51" r="5" fill="#8b5cf6"/>
        </g>
        <g transform="translate(290,180)">
          <rect width="200" height="82" rx="12" fill="url(#nodeBg)" stroke="rgba(245,158,11,0.35)" strokeWidth="1.5"/>
          <rect x="14" y="14" width="32" height="32" rx="8" fill="rgba(245,158,11,0.15)" stroke="rgba(245,158,11,0.28)" strokeWidth="1"/>
          <path d="M20 22L36 22M20 28L36 28M20 34L30 34" stroke="#fbbf24" strokeWidth="1.5" strokeLinecap="round"/>
          <text x="56" y="29" fill="#e2e2e2" fontSize="13" fontWeight="600">Section</text>
          <text x="56" y="44" fill="#3d3d3d" fontSize="10">Component 9</text>
          <text x="14" y="66" fill="#555" fontSize="9">Accessory: Thumbnail</text>
          <circle cx="0" cy="41" r="5" fill="#f59e0b"/>
          <circle cx="200" cy="41" r="5" fill="#f59e0b"/>
        </g>
        <g transform="translate(290,295)">
          <rect width="200" height="72" rx="12" fill="url(#nodeBg)" stroke="rgba(99,102,241,0.35)" strokeWidth="1.5"/>
          <rect x="14" y="14" width="32" height="32" rx="8" fill="rgba(99,102,241,0.15)" stroke="rgba(99,102,241,0.28)" strokeWidth="1"/>
          <path d="M20 22L36 22M20 28L30 28M26 18L26 36" stroke="#818cf8" strokeWidth="1.5" strokeLinecap="round"/>
          <text x="56" y="29" fill="#e2e2e2" fontSize="13" fontWeight="600">Text Display</text>
          <text x="56" y="44" fill="#3d3d3d" fontSize="10">Component 10</text>
          <text x="14" y="62" fill="#555" fontSize="9">👋 Hey there! How can we help?</text>
          <circle cx="0" cy="36" r="5" fill="#6366f1"/>
        </g>
        <g transform="translate(290,400)">
          <rect width="200" height="72" rx="12" fill="url(#nodeBg)" stroke="rgba(236,72,153,0.35)" strokeWidth="1.5"/>
          <rect x="14" y="14" width="32" height="32" rx="8" fill="rgba(236,72,153,0.15)" stroke="rgba(236,72,153,0.28)" strokeWidth="1"/>
          <rect x="18" y="20" width="24" height="20" rx="3" stroke="#f472b6" strokeWidth="1.5" fill="none"/>
          <rect x="20" y="26" width="8" height="8" rx="1.5" fill="#f472b6"/>
          <text x="56" y="29" fill="#e2e2e2" fontSize="13" fontWeight="600">Action Row</text>
          <text x="56" y="44" fill="#3d3d3d" fontSize="10">Component 1</text>
          <text x="14" y="62" fill="#555" fontSize="9">2 buttons attached</text>
          <circle cx="0" cy="36" r="5" fill="#ec4899"/>
        </g>
        <g transform="translate(556,290)">
          <rect width="180" height="72" rx="12" fill="url(#nodeBg)" stroke="rgba(59,130,246,0.35)" strokeWidth="1.5"/>
          <rect x="14" y="14" width="32" height="32" rx="8" fill="rgba(59,130,246,0.15)" stroke="rgba(59,130,246,0.28)" strokeWidth="1"/>
          <rect x="18" y="22" width="24" height="14" rx="4" fill="#3b82f6"/>
          <text x="56" y="29" fill="#e2e2e2" fontSize="13" fontWeight="600">Button</text>
          <text x="56" y="44" fill="#3d3d3d" fontSize="10">Component 2</text>
          <text x="14" y="62" fill="#555" fontSize="9">Get Started · Primary</text>
          <circle cx="0" cy="36" r="5" fill="#3b82f6"/>
        </g>
        <g transform="translate(556,395)">
          <rect width="180" height="72" rx="12" fill="url(#nodeBg)" stroke="rgba(59,130,246,0.35)" strokeWidth="1.5"/>
          <rect x="14" y="14" width="32" height="32" rx="8" fill="rgba(59,130,246,0.15)" stroke="rgba(59,130,246,0.28)" strokeWidth="1"/>
          <rect x="18" y="22" width="24" height="14" rx="4" fill="rgba(255,255,255,0.08)" stroke="rgba(255,255,255,0.15)" strokeWidth="1"/>
          <text x="56" y="29" fill="#e2e2e2" fontSize="13" fontWeight="600">Button</text>
          <text x="56" y="44" fill="#3d3d3d" fontSize="10">Component 2</text>
          <text x="14" y="62" fill="#555" fontSize="9">Learn More · Secondary</text>
          <circle cx="0" cy="36" r="5" fill="#3b82f6"/>
        </g>
        <g transform="translate(556,48)">
          <rect width="306" height="218" rx="12" fill="url(#previewBg)" stroke="rgba(255,255,255,0.06)" strokeWidth="1"/>
          <rect width="306" height="36" rx="12" fill="rgba(0,0,0,0.2)"/>
          <rect width="306" height="24" fill="rgba(0,0,0,0.2)" y="12"/>
          <circle cx="16" cy="18" r="5" fill="#3d944d"/>
          <text x="28" y="23" fill="#dbdee1" fontSize="10" fontWeight="600"># welcome</text>
          <g transform="translate(10,48)">
            <circle cx="16" cy="16" r="14" fill="#5865F2"/>
            <text x="10" y="21" fill="#fff" fontSize="14">🤖</text>
            <text x="36" y="14" fill="#dbdee1" fontSize="10" fontWeight="700">OpenBot</text>
            <text x="36" y="24" fill="#949ba4" fontSize="9">Today at 12:00 PM</text>
            <rect x="36" y="32" width="248" height="138" rx="4" fill="#2b2d31" stroke="rgba(255,255,255,0.05)" strokeWidth="1"/>
            <rect x="36" y="32" width="4" height="138" rx="2" fill="#5865F2"/>
            <rect x="44" y="42" width="80" height="8" rx="2" fill="#dbdee1" opacity="0.8"/>
            <rect x="44" y="56" width="160" height="6" rx="2" fill="#949ba4" opacity="0.5"/>
            <rect x="44" y="66" width="130" height="6" rx="2" fill="#949ba4" opacity="0.35"/>
            <rect x="44" y="82" width="232" height="28" rx="4" fill="#1e1f22" stroke="rgba(255,255,255,0.06)" strokeWidth="1"/>
            <rect x="52" y="91" width="60" height="8" rx="4" fill="#5865F2"/>
            <rect x="118" y="91" width="60" height="8" rx="4" fill="rgba(255,255,255,0.08)" stroke="rgba(255,255,255,0.12)" strokeWidth="1"/>
            <rect x="44" y="118" width="100" height="44" rx="4" fill="rgba(88,101,242,0.15)" stroke="rgba(88,101,242,0.2)" strokeWidth="1"/>
            <text x="68" y="143" fill="#818cf8" fontSize="16">🖼</text>
            <rect x="152" y="118" width="120" height="8" rx="2" fill="#949ba4" opacity="0.3"/>
            <rect x="152" y="130" width="90" height="6" rx="2" fill="#949ba4" opacity="0.2"/>
            <rect x="152" y="140" width="110" height="6" rx="2" fill="#949ba4" opacity="0.2"/>
            <rect x="152" y="152" width="70" height="6" rx="2" fill="#949ba4" opacity="0.2"/>
          </g>
        </g>
        <path d="M226 108C258 108,258 91,290 91" stroke="url(#edgeGrad)" strokeWidth="1.5" strokeDasharray="4 3" opacity="0.8"/>
        <path d="M226 230C258 230,258 221,290 221" stroke="rgba(16,185,129,0.5)" strokeWidth="1.5" strokeDasharray="4 3"/>
        <path d="M490 221C520 221,520 331,490 331" stroke="rgba(245,158,11,0.4)" strokeWidth="1.5" strokeDasharray="4 3"/>
        <path d="M490 221C520 221,520 436,490 436" stroke="rgba(245,158,11,0.4)" strokeWidth="1.5" strokeDasharray="4 3"/>
        <path d="M490 436C523 436,523 326,556 326" stroke="rgba(236,72,153,0.4)" strokeWidth="1.5" strokeDasharray="4 3"/>
        <path d="M490 436C523 436,523 431,556 431" stroke="rgba(236,72,153,0.4)" strokeWidth="1.5" strokeDasharray="4 3"/>
        <rect x="290" y="40" width="200" height="102" rx="12" stroke="rgba(139,92,246,0.7)" strokeWidth="2" fill="none"/>
        <circle cx="490" cy="91" r="4" fill="#8b5cf6" filter="url(#glow)"/>
        <rect x="0" y="472" width="900" height="48" fill="rgba(0,0,0,0.3)"/>
        <rect x="0" y="472" width="900" height="1" fill="rgba(255,255,255,0.05)"/>
        <circle cx="36" cy="496" r="14" fill="rgba(88,101,242,0.15)" stroke="rgba(88,101,242,0.3)" strokeWidth="1"/>
        <path d="M30 496L36 490L42 496L38 496L38 502L34 502L34 496Z" fill="#818cf8"/>
        <text x="62" y="501" fill="#555" fontSize="11">Node Library</text>
        <rect x="170" y="485" width="1" height="22" fill="rgba(255,255,255,0.06)"/>
        <text x="182" y="501" fill="#555" fontSize="11">Properties</text>
        <rect x="265" y="485" width="1" height="22" fill="rgba(255,255,255,0.06)"/>
        <text x="277" y="501" fill="#555" fontSize="11">Preview</text>
        <rect x="760" y="484" width="60" height="24" rx="6" fill="rgba(255,255,255,0.04)" stroke="rgba(255,255,255,0.07)" strokeWidth="1"/>
        <text x="775" y="500" fill="#555" fontSize="11">100%</text>
        <circle cx="840" cy="496" r="12" fill="rgba(255,255,255,0.04)" stroke="rgba(255,255,255,0.07)" strokeWidth="1"/>
        <text x="836" y="501" fill="#555" fontSize="12">+</text>
        <circle cx="870" cy="496" r="12" fill="rgba(255,255,255,0.04)" stroke="rgba(255,255,255,0.07)" strokeWidth="1"/>
        <text x="866" y="501" fill="#555" fontSize="14">−</text>
      </svg>
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
              Start Building Free
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

          {/* Trust strip */}
          <p style={{ marginTop: 22, fontSize: 11, color: C.t4, letterSpacing: "0.02em" }}>
            Free · No credit card · Sign in with Discord
          </p>
        </div>

        {/* Product mockup */}
        <div style={{
          position: "relative", marginTop: 56, padding: "0 20px",
          opacity: visible ? 1 : 0, transform: visible ? "none" : "translateY(28px)",
          transition: "opacity 0.65s ease 0.18s, transform 0.65s ease 0.18s",
        }}>
          <div aria-hidden style={{
            position: "absolute", bottom: 0, left: 0, right: 0, height: 180,
            background: `linear-gradient(to bottom, transparent, ${C.canvas})`,
            zIndex: 2, pointerEvents: "none",
          }} />
          <div style={{
            maxWidth: 1060, margin: "0 auto", borderRadius: 14, overflow: "hidden",
            border: `1px solid ${C.b3}`,
            boxShadow: `0 0 0 1px rgba(0,0,0,0.6), ${C.shadow.xxl}, 0 0 100px rgba(88,101,242,0.09)`,
            aspectRatio: "900/520", background: C.canvas,
          }}>
            <NodeMockup />
          </div>
        </div>
      </section>

      {/* ── Features Grid ───────────────────────────────────────────────────── */}
      <section style={{ padding: "120px 20px 72px", maxWidth: 1060, margin: "0 auto" }}>
        <div style={{ textAlign: "center", marginBottom: 52 }}>
          <SectionLabel>Everything you need</SectionLabel>
          <h2 style={{ fontSize: "clamp(24px, 3.5vw, 42px)", fontWeight: 900, letterSpacing: "-0.04em", color: C.t1, margin: "0 auto 14px", maxWidth: 560, lineHeight: 1.1 }}>
            The complete Discord message toolkit
          </h2>
          <p style={{ color: C.t3, fontSize: 15, maxWidth: 440, margin: "0 auto", lineHeight: 1.7 }}>
            Every tool a community manager or bot developer needs, in one visual workspace.
          </p>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(290px, 1fr))", gap: 8 }}>
          {FEATURES.map((f, i) => (
            <div
              key={i}
              style={{
                padding: "22px 22px 20px",
                background: C.panel,
                border: `1px solid ${C.b2}`,
                borderRadius: 12,
                transition: "border-color 0.15s, background 0.15s",
                cursor: "default",
              }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.borderColor = C.b4; (e.currentTarget as HTMLElement).style.background = C.elevated; }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.borderColor = C.b2; (e.currentTarget as HTMLElement).style.background = C.panel; }}
            >
              {/* Icon box — identical to Builder NodeWrapper icon box */}
              <div style={{
                width: 38, height: 38, borderRadius: 9,
                background: `${f.color}22`, border: `1px solid ${f.color}35`,
                display: "flex", alignItems: "center", justifyContent: "center",
                color: f.color, marginBottom: 16,
              }}>
                {f.icon}
              </div>
              <h3 style={{ margin: "0 0 6px", fontSize: 14, fontWeight: 700, color: C.t1, letterSpacing: "-0.02em" }}>
                {f.title}
              </h3>
              <p style={{ margin: 0, fontSize: 13, color: C.t3, lineHeight: 1.65 }}>
                {f.desc}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* ── How It Works ────────────────────────────────────────────────────── */}
      <section style={{ padding: "0 20px 96px", maxWidth: 1060, margin: "0 auto" }}>
        <div style={{ textAlign: "center", marginBottom: 52 }}>
          <SectionLabel>How it works</SectionLabel>
          <h2 style={{ fontSize: "clamp(24px, 3.5vw, 42px)", fontWeight: 900, letterSpacing: "-0.04em", color: C.t1, margin: "0 auto", maxWidth: 480, lineHeight: 1.1 }}>
            From idea to Discord in three steps
          </h2>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(270px, 1fr))", gap: 8 }}>
          {STEPS.map((s, i) => (
            <div
              key={i}
              style={{
                padding: "32px 28px",
                background: C.panel,
                border: `1px solid ${C.b2}`,
                borderRadius: 12,
                position: "relative",
              }}
            >
              {/* Step number — uses Builder's muted text scale */}
              <div style={{
                fontSize: 40, fontWeight: 900, letterSpacing: "-0.05em",
                color: s.color, opacity: 0.12, marginBottom: 16, lineHeight: 1,
              }}>
                {s.n}
              </div>
              {/* Active dot — like the Builder's selected node indicator */}
              <div style={{
                width: 6, height: 6, borderRadius: "50%", background: s.color,
                marginBottom: 14, boxShadow: `0 0 8px ${s.color}`,
              }} />
              <h3 style={{ margin: "0 0 10px", fontSize: 17, fontWeight: 700, color: C.t1, letterSpacing: "-0.025em" }}>
                {s.title}
              </h3>
              <p style={{ margin: 0, fontSize: 13, color: C.t3, lineHeight: 1.7 }}>
                {s.desc}
              </p>
              {/* Connector line between steps */}
              {i < STEPS.length - 1 && (
                <div style={{
                  position: "absolute", top: "50%", right: -5,
                  width: 9, height: 9, borderRadius: "50%",
                  background: C.b3, border: `1px solid ${C.b3}`,
                  transform: "translateY(-50%)",
                  display: "none",
                }} />
              )}
            </div>
          ))}
        </div>
      </section>

      {/* ── Why section (comparison) ────────────────────────────────────────── */}
      <section style={{ padding: "0 20px 96px", maxWidth: 1060, margin: "0 auto" }}>
        <div style={{ textAlign: "center", marginBottom: 40 }}>
          <SectionLabel>Why OpenEmbedded</SectionLabel>
          <h2 style={{ fontSize: "clamp(24px, 3.5vw, 42px)", fontWeight: 900, letterSpacing: "-0.04em", color: C.t1, margin: "0 auto", maxWidth: 480, lineHeight: 1.1 }}>
            The visual way to build Discord messages
          </h2>
        </div>

        <div className="oe-compare-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
          {/* Old way */}
          <div style={{ padding: "32px 28px", background: C.panel, border: `1px solid ${C.b2}`, borderRadius: 12, borderLeft: `2px solid rgba(248,81,73,0.4)` }}>
            <p style={{ margin: "0 0 6px", fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.09em", color: "rgba(248,81,73,0.6)" }}>
              The old way
            </p>
            <h3 style={{ margin: "0 0 24px", fontSize: 18, fontWeight: 700, color: C.t1, letterSpacing: "-0.03em" }}>
              Painful JSON editing
            </h3>
            {[
              "Write JSON by hand, re-check docs constantly",
              "Context-switch between editor, preview, Discord",
              "Nested components are impossible to visualise",
              "One typo breaks the whole payload",
              "CV2 type IDs and flags all from memory",
            ].map((t, i) => (
              <div key={i} style={{ display: "flex", gap: 10, marginBottom: 10, alignItems: "flex-start" }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="rgba(248,81,73,0.45)" strokeWidth="2.5" strokeLinecap="round" style={{ marginTop: 2, flexShrink: 0 }}>
                  <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                </svg>
                <span style={{ color: C.t3, fontSize: 13, lineHeight: 1.6 }}>{t}</span>
              </div>
            ))}
          </div>

          {/* New way */}
          <div style={{ padding: "32px 28px", background: C.panel, border: `1px solid ${C.b2}`, borderRadius: 12, borderLeft: `2px solid rgba(16,185,129,0.5)` }}>
            <p style={{ margin: "0 0 6px", fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.09em", color: "rgba(16,185,129,0.7)" }}>
              With OpenEmbedded
            </p>
            <h3 style={{ margin: "0 0 24px", fontSize: 18, fontWeight: 700, color: C.t1, letterSpacing: "-0.03em" }}>
              See it as you build it
            </h3>
            {[
              "Drag and drop nodes — structure always visible",
              "Live Discord preview updates on every change",
              "Hierarchy is a graph, not a JSON tree",
              "Validation errors shown instantly on the node",
              "Every field is a labelled form — no memorising",
            ].map((t, i) => (
              <div key={i} style={{ display: "flex", gap: 10, marginBottom: 10, alignItems: "flex-start" }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="rgba(16,185,129,0.7)" strokeWidth="2.5" strokeLinecap="round" style={{ marginTop: 2, flexShrink: 0 }}>
                  <polyline points="20 6 9 17 4 12"/>
                </svg>
                <span style={{ color: C.t3, fontSize: 13, lineHeight: 1.6 }}>{t}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Final CTA — matches Builder's modal / export panel style ─────────── */}
      <section style={{ padding: "0 20px 96px" }}>
        <div style={{
          maxWidth: 720, margin: "0 auto",
          padding: "56px 40px", textAlign: "center",
          background: C.panel,
          border: `1px solid ${C.b3}`,
          borderRadius: 14,
          boxShadow: C.shadow.xl,
          position: "relative", overflow: "hidden",
        }}>
          {/* Dim glow accent — same subtlety as Builder's blurple tints */}
          <div aria-hidden style={{
            position: "absolute", top: -60, left: "50%", transform: "translateX(-50%)",
            width: 400, height: 220,
            background: "radial-gradient(ellipse, rgba(88,101,242,0.14) 0%, transparent 70%)",
            pointerEvents: "none",
          }} />

          <h2 style={{ position: "relative", fontSize: "clamp(24px, 3.5vw, 40px)", fontWeight: 900, letterSpacing: "-0.04em", color: C.t1, margin: "0 0 14px", lineHeight: 1.1 }}>
            Your next Discord message<br />is one canvas away.
          </h2>
          <p style={{ position: "relative", color: C.t3, fontSize: 15, margin: "0 auto 28px", maxWidth: 400, lineHeight: 1.7 }}>
            Free to use. No credit card, no setup — just sign in with Discord and start building.
          </p>
          <button
            onClick={login}
            style={{ position: "relative", ...blurpleBtn.base, fontSize: 15, padding: "12px 28px", boxShadow: `0 4px 22px rgba(88,101,242,0.45)` }}
            onMouseEnter={blurpleBtn.in}
            onMouseLeave={blurpleBtn.out}
          >
            <DiscordIcon size={17} />
            Get Started Free
          </button>
          <p style={{ position: "relative", marginTop: 14, fontSize: 11, color: C.t4 }}>
            Free · No credit card · Discord OAuth
          </p>
        </div>
      </section>

      {/* ── Footer — matches Home page footer style ──────────────────────────── */}
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
        @media (max-width: 640px) {
          .oe-compare-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </div>
  );
}
