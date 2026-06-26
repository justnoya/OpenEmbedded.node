import { useRef, useEffect, useState } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/lib/authContext";

const FONT = `"DM Sans", system-ui, -apple-system, sans-serif`;

function DiscordIcon({ size = 18 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 -28.5 256 256" fill="currentColor" aria-hidden>
      <path d="M216.856 16.597A208.502 208.502 0 0 0 164.042 0c-2.275 4.113-4.933 9.645-6.766 14.046-19.692-2.961-39.203-2.961-58.533 0-1.832-4.4-4.55-9.933-6.846-14.046a207.809 207.809 0 0 0-52.855 16.638C5.618 67.147-3.443 116.4 1.087 164.956c22.169 16.555 43.653 26.612 64.775 33.193A161.094 161.094 0 0 0 79.735 175.3a136.413 136.413 0 0 1-21.846-10.632 108.636 108.636 0 0 0 5.356-4.237c42.122 19.702 87.89 19.702 129.51 0a131.66 131.66 0 0 0 5.355 4.237 136.07 136.07 0 0 1-21.886 10.653c4.006 8.02 8.638 15.67 13.873 22.848 21.142-6.58 42.646-16.637 64.815-33.213 5.316-56.288-9.08-105.09-38.056-148.36ZM85.474 135.095c-12.645 0-23.015-11.805-23.015-26.18s10.149-26.2 23.015-26.2c12.867 0 23.236 11.804 23.015 26.2.02 14.375-10.148 26.18-23.015 26.18Zm85.051 0c-12.645 0-23.014-11.805-23.014-26.18s10.148-26.2 23.014-26.2c12.867 0 23.236 11.804 23.015 26.2 0 14.375-10.148 26.18-23.015 26.18Z" />
    </svg>
  );
}

function NodeMockup() {
  return (
    <div style={{ position: "relative", width: "100%", height: "100%" }}>
      <svg width="100%" height="100%" viewBox="0 0 900 520" preserveAspectRatio="xMidYMid meet" fill="none" xmlns="http://www.w3.org/2000/svg">
        {/* Canvas background dots */}
        <defs>
          <pattern id="dots" x="0" y="0" width="24" height="24" patternUnits="userSpaceOnUse">
            <circle cx="1" cy="1" r="1" fill="rgba(255,255,255,0.045)" />
          </pattern>
          <filter id="glow">
            <feGaussianBlur stdDeviation="3" result="coloredBlur" />
            <feMerge><feMergeNode in="coloredBlur" /><feMergeNode in="SourceGraphic" /></feMerge>
          </filter>
          <linearGradient id="nodeBg" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#2a2a2a" />
            <stop offset="100%" stopColor="#222222" />
          </linearGradient>
          <linearGradient id="previewBg" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#313338" />
            <stop offset="100%" stopColor="#2b2d31" />
          </linearGradient>
          <linearGradient id="edgeGrad" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#5865F2" stopOpacity="0.6" />
            <stop offset="100%" stopColor="#5865F2" stopOpacity="0.15" />
          </linearGradient>
        </defs>

        {/* Canvas fill */}
        <rect width="900" height="520" fill="#111111" rx="16" />
        <rect width="900" height="520" fill="url(#dots)" rx="16" />

        {/* ── Webhook Node (root) ── */}
        <g transform="translate(36, 60)">
          <rect width="190" height="96" rx="12" fill="url(#nodeBg)" stroke="rgba(88,101,242,0.5)" strokeWidth="1.5" />
          <rect width="190" height="96" rx="12" fill="rgba(88,101,242,0.04)" />
          <rect x="14" y="16" width="32" height="32" rx="8" fill="rgba(88,101,242,0.22)" stroke="rgba(88,101,242,0.35)" strokeWidth="1" />
          <path d="M30 26 L30 22 M30 22 Q30 20 32 20 L38 20 Q40 20 40 22 L40 26 Q40 28 38 28 L32 28 Q30 28 30 26 Z" stroke="#818cf8" strokeWidth="1.5" strokeLinecap="round" fill="none" />
          <path d="M26 34 Q30 30 34 34" stroke="#818cf8" strokeWidth="1.5" strokeLinecap="round" fill="none" />
          <text x="56" y="31" fill="#e2e2e2" fontSize="13" fontWeight="600" fontFamily={FONT}>Webhook</text>
          <text x="56" y="46" fill="#3d3d3d" fontSize="10" fontFamily={FONT}>Root node</text>
          <rect x="14" y="58" width="162" height="26" rx="6" fill="rgba(255,255,255,0.03)" stroke="rgba(255,255,255,0.07)" strokeWidth="1" />
          <text x="24" y="76" fill="#555" fontSize="10" fontFamily={FONT}>https://discord.com/api/webh…</text>
          {/* handle */}
          <circle cx="190" cy="48" r="5" fill="#5865F2" filter="url(#glow)" />
        </g>

        {/* ── Message Node ── */}
        <g transform="translate(36, 190)">
          <rect width="190" height="80" rx="12" fill="url(#nodeBg)" stroke="rgba(16,185,129,0.4)" strokeWidth="1.5" />
          <rect x="14" y="14" width="32" height="32" rx="8" fill="rgba(16,185,129,0.18)" stroke="rgba(16,185,129,0.3)" strokeWidth="1" />
          <path d="M22 24 L38 24 M22 30 L34 30 M22 36 L36 36" stroke="#34d399" strokeWidth="1.5" strokeLinecap="round" />
          <text x="56" y="29" fill="#e2e2e2" fontSize="13" fontWeight="600" fontFamily={FONT}>Message</text>
          <text x="56" y="44" fill="#3d3d3d" fontSize="10" fontFamily={FONT}>Flow config</text>
          <rect x="14" y="54" width="162" height="16" rx="4" fill="rgba(255,255,255,0.03)" />
          <text x="20" y="66" fill="#555" fontSize="9" fontFamily={FONT}>Welcome to our server! ✨</text>
          <circle cx="190" cy="40" r="5" fill="#10b981" />
        </g>

        {/* ── Container Node ── */}
        <g transform="translate(290, 40)">
          <rect width="200" height="102" rx="12" fill="url(#nodeBg)" stroke="rgba(139,92,246,0.4)" strokeWidth="1.5" />
          <rect x="14" y="14" width="32" height="32" rx="8" fill="rgba(139,92,246,0.18)" stroke="rgba(139,92,246,0.3)" strokeWidth="1" />
          <rect x="20" y="20" width="20" height="20" rx="3" stroke="#a78bfa" strokeWidth="1.5" fill="none" />
          <rect x="23" y="23" width="6" height="4" rx="1" fill="#a78bfa" />
          <text x="56" y="29" fill="#e2e2e2" fontSize="13" fontWeight="600" fontFamily={FONT}>Container</text>
          <text x="56" y="44" fill="#3d3d3d" fontSize="10" fontFamily={FONT}>Component 17</text>
          <text x="14" y="72" fill="#555" fontSize="9" fontFamily={FONT}>Accent color</text>
          <rect x="14" y="78" width="80" height="14" rx="4" fill="rgba(255,255,255,0.03)" />
          <rect x="16" y="80" width="10" height="10" rx="2" fill="#5865F2" />
          <text x="30" y="89" fill="#666" fontSize="9" fontFamily={FONT}>#5865F2</text>
          <circle cx="0" cy="51" r="5" fill="#8b5cf6" />
          <circle cx="200" cy="51" r="5" fill="#8b5cf6" />
        </g>

        {/* ── Section Node ── */}
        <g transform="translate(290, 180)">
          <rect width="200" height="82" rx="12" fill="url(#nodeBg)" stroke="rgba(245,158,11,0.35)" strokeWidth="1.5" />
          <rect x="14" y="14" width="32" height="32" rx="8" fill="rgba(245,158,11,0.15)" stroke="rgba(245,158,11,0.28)" strokeWidth="1" />
          <path d="M20 22 L36 22 M20 28 L36 28 M20 34 L30 34" stroke="#fbbf24" strokeWidth="1.5" strokeLinecap="round" />
          <text x="56" y="29" fill="#e2e2e2" fontSize="13" fontWeight="600" fontFamily={FONT}>Section</text>
          <text x="56" y="44" fill="#3d3d3d" fontSize="10" fontFamily={FONT}>Component 9</text>
          <text x="14" y="66" fill="#555" fontSize="9" fontFamily={FONT}>Accessory: Thumbnail</text>
          <circle cx="0" cy="41" r="5" fill="#f59e0b" />
          <circle cx="200" cy="41" r="5" fill="#f59e0b" />
        </g>

        {/* ── Text Display Node ── */}
        <g transform="translate(290, 295)">
          <rect width="200" height="72" rx="12" fill="url(#nodeBg)" stroke="rgba(99,102,241,0.35)" strokeWidth="1.5" />
          <rect x="14" y="14" width="32" height="32" rx="8" fill="rgba(99,102,241,0.15)" stroke="rgba(99,102,241,0.28)" strokeWidth="1" />
          <path d="M20 22 L36 22 M20 28 L30 28" stroke="#818cf8" strokeWidth="1.5" strokeLinecap="round" />
          <path d="M26 18 L26 36" stroke="#818cf8" strokeWidth="1.5" strokeLinecap="round" />
          <text x="56" y="29" fill="#e2e2e2" fontSize="13" fontWeight="600" fontFamily={FONT}>Text Display</text>
          <text x="56" y="44" fill="#3d3d3d" fontSize="10" fontFamily={FONT}>Component 10</text>
          <text x="14" y="62" fill="#555" fontSize="9" fontFamily={FONT}>👋 Hey there! How can we help?</text>
          <circle cx="0" cy="36" r="5" fill="#6366f1" />
        </g>

        {/* ── Action Row ── */}
        <g transform="translate(290, 400)">
          <rect width="200" height="72" rx="12" fill="url(#nodeBg)" stroke="rgba(236,72,153,0.35)" strokeWidth="1.5" />
          <rect x="14" y="14" width="32" height="32" rx="8" fill="rgba(236,72,153,0.15)" stroke="rgba(236,72,153,0.28)" strokeWidth="1" />
          <rect x="18" y="20" width="24" height="20" rx="3" stroke="#f472b6" strokeWidth="1.5" fill="none" />
          <rect x="20" y="26" width="8" height="8" rx="1.5" fill="#f472b6" />
          <text x="56" y="29" fill="#e2e2e2" fontSize="13" fontWeight="600" fontFamily={FONT}>Action Row</text>
          <text x="56" y="44" fill="#3d3d3d" fontSize="10" fontFamily={FONT}>Component 1</text>
          <text x="14" y="62" fill="#555" fontSize="9" fontFamily={FONT}>2 buttons attached</text>
          <circle cx="0" cy="36" r="5" fill="#ec4899" />
        </g>

        {/* ── Button Node ── */}
        <g transform="translate(556, 290)">
          <rect width="180" height="72" rx="12" fill="url(#nodeBg)" stroke="rgba(59,130,246,0.35)" strokeWidth="1.5" />
          <rect x="14" y="14" width="32" height="32" rx="8" fill="rgba(59,130,246,0.15)" stroke="rgba(59,130,246,0.28)" strokeWidth="1" />
          <rect x="18" y="22" width="24" height="14" rx="4" fill="#3b82f6" />
          <text x="56" y="29" fill="#e2e2e2" fontSize="13" fontWeight="600" fontFamily={FONT}>Button</text>
          <text x="56" y="44" fill="#3d3d3d" fontSize="10" fontFamily={FONT}>Component 2</text>
          <text x="14" y="62" fill="#555" fontSize="9" fontFamily={FONT}>Get Started · Primary</text>
          <circle cx="0" cy="36" r="5" fill="#3b82f6" />
        </g>

        {/* ── Button Node 2 ── */}
        <g transform="translate(556, 395)">
          <rect width="180" height="72" rx="12" fill="url(#nodeBg)" stroke="rgba(59,130,246,0.35)" strokeWidth="1.5" />
          <rect x="14" y="14" width="32" height="32" rx="8" fill="rgba(59,130,246,0.15)" stroke="rgba(59,130,246,0.28)" strokeWidth="1" />
          <rect x="18" y="22" width="24" height="14" rx="4" fill="rgba(255,255,255,0.08)" stroke="rgba(255,255,255,0.15)" strokeWidth="1" />
          <text x="56" y="29" fill="#e2e2e2" fontSize="13" fontWeight="600" fontFamily={FONT}>Button</text>
          <text x="56" y="44" fill="#3d3d3d" fontSize="10" fontFamily={FONT}>Component 2</text>
          <text x="14" y="62" fill="#555" fontSize="9" fontFamily={FONT}>Learn More · Secondary</text>
          <circle cx="0" cy="36" r="5" fill="#3b82f6" />
        </g>

        {/* ── Discord Preview Panel ── */}
        <g transform="translate(556, 48)">
          <rect width="306" height="218" rx="12" fill="url(#previewBg)" stroke="rgba(255,255,255,0.06)" strokeWidth="1" />
          {/* Channel header */}
          <rect width="306" height="36" rx="12" fill="rgba(0,0,0,0.2)" />
          <rect width="306" height="24" fill="rgba(0,0,0,0.2)" y="12" />
          <circle cx="16" cy="18" r="5" fill="#3d944d" />
          <text x="28" y="23" fill="#dbdee1" fontSize="10" fontWeight="600" fontFamily="gg sans, sans-serif"># welcome</text>
          {/* Message bubble */}
          <g transform="translate(10, 48)">
            <circle cx="16" cy="16" r="14" fill="#5865F2" />
            <text x="10" y="21" fill="#fff" fontSize="14" fontFamily="sans-serif">🤖</text>
            <text x="36" y="14" fill="#dbdee1" fontSize="10" fontWeight="700" fontFamily="gg sans, sans-serif">OpenBot</text>
            <text x="36" y="24" fill="#949ba4" fontSize="9" fontFamily="gg sans, sans-serif">Today at 12:00 PM</text>
            {/* Embed */}
            <rect x="36" y="32" width="248" height="138" rx="4" fill="#2b2d31" stroke="rgba(255,255,255,0.05)" strokeWidth="1" />
            <rect x="36" y="32" width="4" height="138" rx="2" fill="#5865F2" />
            <rect x="44" y="42" width="80" height="8" rx="2" fill="#dbdee1" opacity="0.8" />
            <rect x="44" y="56" width="160" height="6" rx="2" fill="#949ba4" opacity="0.5" />
            <rect x="44" y="66" width="130" height="6" rx="2" fill="#949ba4" opacity="0.35" />
            {/* CV2 Container */}
            <rect x="44" y="82" width="232" height="28" rx="4" fill="#1e1f22" stroke="rgba(255,255,255,0.06)" strokeWidth="1" />
            <rect x="52" y="91" width="60" height="8" rx="4" fill="#5865F2" />
            <rect x="118" y="91" width="60" height="8" rx="4" fill="rgba(255,255,255,0.08)" stroke="rgba(255,255,255,0.12)" strokeWidth="1" />
            {/* Image preview */}
            <rect x="44" y="118" width="100" height="44" rx="4" fill="rgba(88,101,242,0.15)" stroke="rgba(88,101,242,0.2)" strokeWidth="1" />
            <text x="68" y="143" fill="#818cf8" fontSize="16" fontFamily="sans-serif">🖼</text>
            <rect x="152" y="118" width="120" height="8" rx="2" fill="#949ba4" opacity="0.3" />
            <rect x="152" y="130" width="90" height="6" rx="2" fill="#949ba4" opacity="0.2" />
            <rect x="152" y="140" width="110" height="6" rx="2" fill="#949ba4" opacity="0.2" />
            <rect x="152" y="152" width="70" height="6" rx="2" fill="#949ba4" opacity="0.2" />
          </g>
        </g>

        {/* ── Edges ── */}
        {/* Webhook → Container */}
        <path d="M226 108 C 258 108, 258 91, 290 91" stroke="url(#edgeGrad)" strokeWidth="1.5" strokeDasharray="4 3" opacity="0.8" />
        {/* Webhook → Message */}
        <path d="M226 230 C 258 230, 258 221, 290 221" stroke="rgba(16,185,129,0.5)" strokeWidth="1.5" strokeDasharray="4 3" />
        {/* Container → Section */}
        <path d="M490 91 C 520 91, 520 221, 290 221" stroke="rgba(139,92,246,0.35)" strokeWidth="1.5" strokeDasharray="4 3" opacity="0" />
        {/* Section → Text */}
        <path d="M490 221 C 520 221, 520 331, 490 331" stroke="rgba(245,158,11,0.4)" strokeWidth="1.5" strokeDasharray="4 3" />
        {/* Section → ActionRow */}
        <path d="M490 221 C 520 221, 520 436, 490 436" stroke="rgba(245,158,11,0.4)" strokeWidth="1.5" strokeDasharray="4 3" />
        {/* ActionRow → Button 1 */}
        <path d="M490 436 C 523 436, 523 326, 556 326" stroke="rgba(236,72,153,0.4)" strokeWidth="1.5" strokeDasharray="4 3" />
        {/* ActionRow → Button 2 */}
        <path d="M490 436 C 523 436, 523 431, 556 431" stroke="rgba(236,72,153,0.4)" strokeWidth="1.5" strokeDasharray="4 3" />

        {/* Selected node glow outline on Container */}
        <rect x="290" y="40" width="200" height="102" rx="12" stroke="rgba(88,101,242,0.7)" strokeWidth="2" fill="none" />
        {/* Tiny dot at right of Container */}
        <circle cx="490" cy="91" r="4" fill="#8b5cf6" filter="url(#glow)" />

        {/* Toolbar strip at bottom */}
        <rect x="0" y="472" width="900" height="48" rx="0" fill="rgba(0,0,0,0.35)" />
        <rect x="0" y="472" width="900" height="1" fill="rgba(255,255,255,0.05)" />
        <rect x="0" y="472" width="900" height="48" fill="rgba(0,0,0,0.1)" rx="0" />
        {/* Bottom rounded corners */}
        <rect x="0" y="488" width="900" height="32" rx="0" fill="rgba(0,0,0,0.15)" />

        {/* Toolbar items */}
        <circle cx="36" cy="496" r="14" fill="rgba(88,101,242,0.2)" stroke="rgba(88,101,242,0.4)" strokeWidth="1" />
        <path d="M30 496 L36 490 L42 496 L38 496 L38 502 L34 502 L34 496 Z" fill="#818cf8" />
        <text x="62" y="501" fill="#666" fontSize="11" fontFamily={FONT}>Node Library</text>
        <rect x="170" y="485" width="1" height="22" fill="rgba(255,255,255,0.06)" />
        <text x="182" y="501" fill="#666" fontSize="11" fontFamily={FONT}>Properties</text>
        <rect x="265" y="485" width="1" height="22" fill="rgba(255,255,255,0.06)" />
        <text x="277" y="501" fill="#666" fontSize="11" fontFamily={FONT}>Preview</text>
        {/* Zoom controls */}
        <rect x="760" y="484" width="60" height="24" rx="6" fill="rgba(255,255,255,0.04)" stroke="rgba(255,255,255,0.07)" strokeWidth="1" />
        <text x="775" y="500" fill="#555" fontSize="11" fontFamily={FONT}>100%</text>
        <circle cx="840" cy="496" r="12" fill="rgba(255,255,255,0.04)" stroke="rgba(255,255,255,0.07)" strokeWidth="1" />
        <text x="836" y="501" fill="#555" fontSize="12">+</text>
        <circle cx="870" cy="496" r="12" fill="rgba(255,255,255,0.04)" stroke="rgba(255,255,255,0.07)" strokeWidth="1" />
        <text x="866" y="501" fill="#555" fontSize="14">−</text>
      </svg>
    </div>
  );
}

const FEATURES = [
  {
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="3" />
        <path d="M19.07 4.93a10 10 0 0 1 0 14.14" /><path d="M4.93 4.93a10 10 0 0 0 0 14.14" />
        <line x1="12" y1="2" x2="12" y2="5" /><line x1="12" y1="19" x2="12" y2="22" />
      </svg>
    ),
    color: "#5865F2",
    title: "Visual Node Graph",
    desc: "Connect nodes like wires on a circuit board. Instantly see how your message structure fits together — no JSON, no guessing.",
  },
  {
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 2L2 7l10 5 10-5-10-5z" /><path d="M2 17l10 5 10-5" /><path d="M2 12l10 5 10-5" />
      </svg>
    ),
    color: "#8b5cf6",
    title: "All CV2 Components",
    desc: "Containers, Sections, Text Displays, Galleries, Separators, Action Rows — every Discord Components V2 type, fully visual.",
  },
  {
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M1 6v16l7-4 8 4 7-4V2l-7 4-8-4-7 4z" /><line x1="8" y1="2" x2="8" y2="18" /><line x1="16" y1="6" x2="16" y2="22" />
      </svg>
    ),
    color: "#10b981",
    title: "Live Discord Preview",
    desc: "See exactly how your message will look in Discord — channel header, message bubble, embeds, buttons and all — in real time.",
  },
  {
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
      </svg>
    ),
    color: "#f59e0b",
    title: "Send via Webhook or Bot",
    desc: "Deliver your finished message directly to any Discord channel — paste a webhook URL or connect your bot token. No code needed.",
  },
  {
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="16 18 22 12 16 6" /><polyline points="8 6 2 12 8 18" />
      </svg>
    ),
    color: "#ec4899",
    title: "Export Clean JSON",
    desc: "One click exports the production-ready Discord API payload. Copy or download — integrate it into your bot or deployment pipeline.",
  },
  {
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
      </svg>
    ),
    color: "#06b6d4",
    title: "Secure by Design",
    desc: "Your projects stay private. SSRF-protected webhook proxy, rate-limited sends, strict Discord URL validation — security first.",
  },
];

const STEPS = [
  {
    n: "01",
    color: "#5865F2",
    title: "Drop a root node",
    desc: "Start with a Webhook or Bot node, then drag components from the library onto your canvas. Structure builds itself as you connect.",
  },
  {
    n: "02",
    color: "#8b5cf6",
    title: "Build your layout",
    desc: "Add Containers, Sections, Buttons, Text Displays and more. The live preview updates with every change — no refresh required.",
  },
  {
    n: "03",
    color: "#10b981",
    title: "Send to Discord",
    desc: "Click Send in the Properties panel. Your message is compiled, validated, and delivered directly to Discord in under a second.",
  },
];

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

  return (
    <div
      style={{
        fontFamily: FONT,
        background: "#0a0a0a",
        color: "#e8e8e8",
        minHeight: "100dvh",
        overflowX: "hidden",
      }}
    >
      {/* ── Navbar ─────────────────────────────────────────────────── */}
      <nav
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          zIndex: 100,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "0 32px",
          height: 60,
          background: "rgba(10,10,10,0.85)",
          backdropFilter: "blur(20px)",
          WebkitBackdropFilter: "blur(20px)",
          borderBottom: "1px solid rgba(255,255,255,0.06)",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <img src="/logo.png" alt="OpenEmbedded" width={28} height={28} style={{ borderRadius: 8, objectFit: "contain" }} />
          <span style={{ fontSize: 15, fontWeight: 800, letterSpacing: "-0.03em", color: "#f0f0f0" }}>
            OpenEmbedded
          </span>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <a
            href="/docs"
            style={{ color: "#666", fontSize: 13, fontWeight: 500, textDecoration: "none", padding: "6px 12px", borderRadius: 8, transition: "color 0.15s" }}
            onMouseEnter={(e) => ((e.target as HTMLElement).style.color = "#aaa")}
            onMouseLeave={(e) => ((e.target as HTMLElement).style.color = "#666")}
          >
            Docs
          </a>
          <button
            onClick={login}
            style={{
              display: "flex", alignItems: "center", gap: 7,
              padding: "8px 16px",
              background: "#5865F2",
              border: "none", borderRadius: 10,
              color: "#fff", fontSize: 13, fontWeight: 700,
              cursor: "pointer", fontFamily: FONT,
              boxShadow: "0 2px 10px rgba(88,101,242,0.35)",
              transition: "background 0.15s, box-shadow 0.15s",
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLElement).style.background = "#6773f5";
              (e.currentTarget as HTMLElement).style.boxShadow = "0 4px 18px rgba(88,101,242,0.5)";
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLElement).style.background = "#5865F2";
              (e.currentTarget as HTMLElement).style.boxShadow = "0 2px 10px rgba(88,101,242,0.35)";
            }}
          >
            <DiscordIcon size={15} />
            Sign in
          </button>
        </div>
      </nav>

      {/* ── Hero ───────────────────────────────────────────────────── */}
      <section
        ref={heroRef}
        style={{
          paddingTop: 140,
          paddingBottom: 0,
          textAlign: "center",
          position: "relative",
          overflow: "hidden",
        }}
      >
        {/* Radial gradient glow behind hero */}
        <div
          aria-hidden
          style={{
            position: "absolute",
            top: -120,
            left: "50%",
            transform: "translateX(-50%)",
            width: 900,
            height: 600,
            background: "radial-gradient(ellipse at 50% 30%, rgba(88,101,242,0.18) 0%, rgba(88,101,242,0.04) 50%, transparent 70%)",
            pointerEvents: "none",
          }}
        />

        <div
          style={{
            opacity: visible ? 1 : 0,
            transform: visible ? "none" : "translateY(20px)",
            transition: "opacity 0.6s ease, transform 0.6s ease",
          }}
        >
          {/* Badge */}
          <div
            style={{
              display: "inline-flex", alignItems: "center", gap: 6,
              padding: "5px 12px 5px 8px",
              borderRadius: 100,
              background: "rgba(88,101,242,0.1)",
              border: "1px solid rgba(88,101,242,0.25)",
              fontSize: 12, fontWeight: 600, color: "#818cf8",
              marginBottom: 32,
              letterSpacing: "-0.01em",
            }}
          >
            <span style={{ padding: "2px 7px", background: "#5865F2", borderRadius: 100, color: "#fff", fontSize: 10, fontWeight: 700 }}>NEW</span>
            Discord Components V2 support
          </div>

          {/* Headline */}
          <h1
            style={{
              margin: "0 auto 20px",
              fontSize: "clamp(40px, 7vw, 80px)",
              fontWeight: 900,
              letterSpacing: "-0.04em",
              lineHeight: 1.0,
              color: "#f5f5f5",
              maxWidth: 900,
              padding: "0 24px",
            }}
          >
            Build Discord messages{" "}
            <span
              style={{
                background: "linear-gradient(135deg, #5865F2 0%, #818cf8 40%, #a78bfa 100%)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                backgroundClip: "text",
              }}
            >
              visually.
            </span>
          </h1>

          {/* Subheadline */}
          <p
            style={{
              margin: "0 auto 40px",
              fontSize: "clamp(16px, 2.5vw, 20px)",
              color: "#555",
              maxWidth: 560,
              lineHeight: 1.65,
              padding: "0 24px",
              fontWeight: 400,
            }}
          >
            A node-graph editor for Discord embeds and Components V2 messages.
            No JSON. No guesswork. Just drag, connect, and send.
          </p>

          {/* CTAs */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 12, flexWrap: "wrap", padding: "0 24px" }}>
            <button
              onClick={login}
              style={{
                display: "flex", alignItems: "center", gap: 9,
                padding: "14px 28px",
                background: "#5865F2",
                border: "none", borderRadius: 14,
                color: "#fff", fontSize: 16, fontWeight: 800,
                cursor: "pointer", fontFamily: FONT,
                boxShadow: "0 4px 24px rgba(88,101,242,0.45), 0 1px 3px rgba(0,0,0,0.3)",
                transition: "all 0.15s",
                letterSpacing: "-0.02em",
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLElement).style.background = "#6773f5";
                (e.currentTarget as HTMLElement).style.boxShadow = "0 8px 32px rgba(88,101,242,0.55), 0 1px 4px rgba(0,0,0,0.3)";
                (e.currentTarget as HTMLElement).style.transform = "translateY(-1px)";
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLElement).style.background = "#5865F2";
                (e.currentTarget as HTMLElement).style.boxShadow = "0 4px 24px rgba(88,101,242,0.45), 0 1px 3px rgba(0,0,0,0.3)";
                (e.currentTarget as HTMLElement).style.transform = "none";
              }}
            >
              <DiscordIcon size={18} />
              Start Building Free
            </button>

            <a
              href="/docs"
              style={{
                display: "flex", alignItems: "center", gap: 7,
                padding: "14px 24px",
                background: "rgba(255,255,255,0.04)",
                border: "1px solid rgba(255,255,255,0.1)",
                borderRadius: 14,
                color: "#aaa", fontSize: 15, fontWeight: 600,
                textDecoration: "none", fontFamily: FONT,
                transition: "all 0.15s",
                letterSpacing: "-0.01em",
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.07)";
                (e.currentTarget as HTMLElement).style.borderColor = "rgba(255,255,255,0.18)";
                (e.currentTarget as HTMLElement).style.color = "#ccc";
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.04)";
                (e.currentTarget as HTMLElement).style.borderColor = "rgba(255,255,255,0.1)";
                (e.currentTarget as HTMLElement).style.color = "#aaa";
              }}
            >
              Read the docs
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="9 18 15 12 9 6" />
              </svg>
            </a>
          </div>

          {/* Trust line */}
          <p style={{ marginTop: 28, fontSize: 12, color: "#333", letterSpacing: "-0.01em" }}>
            Free to use · No credit card · Sign in with Discord
          </p>
        </div>

        {/* ── Product Screenshot / Mockup ── */}
        <div
          style={{
            position: "relative",
            marginTop: 64,
            padding: "0 24px",
            opacity: visible ? 1 : 0,
            transform: visible ? "none" : "translateY(32px)",
            transition: "opacity 0.7s ease 0.15s, transform 0.7s ease 0.15s",
          }}
        >
          {/* Fade-out bottom */}
          <div
            aria-hidden
            style={{
              position: "absolute",
              bottom: 0, left: 0, right: 0, height: 200,
              background: "linear-gradient(to bottom, transparent, #0a0a0a)",
              zIndex: 2, pointerEvents: "none",
            }}
          />

          <div
            style={{
              maxWidth: 1080,
              margin: "0 auto",
              borderRadius: 20,
              overflow: "hidden",
              border: "1px solid rgba(255,255,255,0.08)",
              boxShadow: "0 0 0 1px rgba(0,0,0,0.5), 0 32px 80px rgba(0,0,0,0.7), 0 0 120px rgba(88,101,242,0.12)",
              aspectRatio: "900/520",
              background: "#111",
            }}
          >
            <NodeMockup />
          </div>
        </div>
      </section>

      {/* ── Features Grid ──────────────────────────────────────────── */}
      <section style={{ padding: "120px 24px 80px", maxWidth: 1080, margin: "0 auto" }}>
        <div style={{ textAlign: "center", marginBottom: 64 }}>
          <p style={{ color: "#5865F2", fontSize: 12, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 12 }}>
            Everything you need
          </p>
          <h2
            style={{
              fontSize: "clamp(28px, 4vw, 48px)",
              fontWeight: 900, letterSpacing: "-0.04em",
              color: "#f0f0f0", margin: "0 auto 16px", maxWidth: 600,
              lineHeight: 1.1,
            }}
          >
            The complete Discord message toolkit
          </h2>
          <p style={{ color: "#444", fontSize: 17, maxWidth: 480, margin: "0 auto", lineHeight: 1.65 }}>
            Every tool a Discord community manager or bot developer needs, unified in one visual workspace.
          </p>
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
            gap: 16,
          }}
        >
          {FEATURES.map((f, i) => (
            <div
              key={i}
              style={{
                padding: "28px 28px 24px",
                background: "rgba(255,255,255,0.025)",
                border: "1px solid rgba(255,255,255,0.06)",
                borderRadius: 18,
                transition: "border-color 0.2s, background 0.2s, transform 0.2s",
                cursor: "default",
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLElement).style.borderColor = `${f.color}30`;
                (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.04)";
                (e.currentTarget as HTMLElement).style.transform = "translateY(-2px)";
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLElement).style.borderColor = "rgba(255,255,255,0.06)";
                (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.025)";
                (e.currentTarget as HTMLElement).style.transform = "none";
              }}
            >
              <div
                style={{
                  width: 44, height: 44, borderRadius: 12,
                  background: `${f.color}18`,
                  border: `1px solid ${f.color}30`,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  color: f.color, marginBottom: 20,
                }}
              >
                {f.icon}
              </div>
              <h3 style={{ margin: "0 0 8px", fontSize: 16, fontWeight: 700, color: "#e8e8e8", letterSpacing: "-0.02em" }}>
                {f.title}
              </h3>
              <p style={{ margin: 0, fontSize: 14, color: "#484848", lineHeight: 1.7 }}>
                {f.desc}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* ── How It Works ───────────────────────────────────────────── */}
      <section style={{ padding: "80px 24px 120px", maxWidth: 1080, margin: "0 auto" }}>
        <div style={{ textAlign: "center", marginBottom: 64 }}>
          <p style={{ color: "#5865F2", fontSize: 12, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 12 }}>
            How it works
          </p>
          <h2
            style={{
              fontSize: "clamp(28px, 4vw, 48px)",
              fontWeight: 900, letterSpacing: "-0.04em",
              color: "#f0f0f0", margin: "0 auto", maxWidth: 560,
              lineHeight: 1.1,
            }}
          >
            From idea to Discord in three steps
          </h2>
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
            gap: 2,
          }}
        >
          {STEPS.map((s, i) => (
            <div
              key={i}
              style={{
                padding: "40px 36px",
                background: i === 1 ? "rgba(255,255,255,0.03)" : "transparent",
                border: "1px solid",
                borderColor: i === 1 ? "rgba(255,255,255,0.08)" : "transparent",
                borderRadius: i === 1 ? 20 : 20,
                position: "relative",
              }}
            >
              <div
                style={{
                  fontSize: 48, fontWeight: 900, letterSpacing: "-0.05em",
                  color: s.color, opacity: 0.15,
                  marginBottom: 20, lineHeight: 1,
                  fontVariantNumeric: "tabular-nums",
                }}
              >
                {s.n}
              </div>
              <div
                style={{
                  width: 6, height: 6, borderRadius: "50%",
                  background: s.color,
                  marginBottom: 20,
                  boxShadow: `0 0 10px ${s.color}`,
                }}
              />
              <h3 style={{ margin: "0 0 12px", fontSize: 20, fontWeight: 800, color: "#e8e8e8", letterSpacing: "-0.03em" }}>
                {s.title}
              </h3>
              <p style={{ margin: 0, fontSize: 15, color: "#444", lineHeight: 1.75 }}>
                {s.desc}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Why OpenEmbedded ───────────────────────────────────────── */}
      <section style={{ padding: "0 24px 120px", maxWidth: 1080, margin: "0 auto" }}>
        <div
          className="oe-compare-grid"
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: 2,
          }}
        >
          {/* Left: pain points */}
          <div
            style={{
              padding: "48px 44px",
              background: "rgba(248,81,73,0.04)",
              border: "1px solid rgba(248,81,73,0.1)",
              borderRadius: "20px 0 0 20px",
            }}
          >
            <p style={{ margin: "0 0 8px", fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em", color: "#f85149", opacity: 0.7 }}>
              The old way
            </p>
            <h3 style={{ margin: "0 0 28px", fontSize: 22, fontWeight: 800, color: "#e8e8e8", letterSpacing: "-0.03em" }}>
              Painful JSON editing
            </h3>
            {[
              "Write JSON by hand, re-check docs every 5 minutes",
              "Context-switch between editor, preview, and Discord",
              "Deeply nested components are impossible to visualise",
              "One typo breaks the whole payload — no live feedback",
              "CV2 flags, type IDs, and field names all from memory",
            ].map((t, i) => (
              <div key={i} style={{ display: "flex", gap: 12, marginBottom: 14, alignItems: "flex-start" }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="rgba(248,81,73,0.5)" strokeWidth="2.5" strokeLinecap="round" style={{ marginTop: 2, flexShrink: 0 }}>
                  <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                </svg>
                <span style={{ color: "#484848", fontSize: 14, lineHeight: 1.6 }}>{t}</span>
              </div>
            ))}
          </div>

          {/* Right: OpenEmbedded way */}
          <div
            style={{
              padding: "48px 44px",
              background: "rgba(16,185,129,0.04)",
              border: "1px solid rgba(16,185,129,0.1)",
              borderRadius: "0 20px 20px 0",
            }}
          >
            <p style={{ margin: "0 0 8px", fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em", color: "#10b981", opacity: 0.7 }}>
              The OpenEmbedded way
            </p>
            <h3 style={{ margin: "0 0 28px", fontSize: 22, fontWeight: 800, color: "#e8e8e8", letterSpacing: "-0.03em" }}>
              See it as you build it
            </h3>
            {[
              "Drag and drop nodes — structure is always visible",
              "Live Discord preview updates with every change",
              "Hierarchy is a graph, not a JSON tree",
              "Validation errors shown instantly on the node",
              "Every field is a labelled form — no memorisation",
            ].map((t, i) => (
              <div key={i} style={{ display: "flex", gap: 12, marginBottom: 14, alignItems: "flex-start" }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="2.5" strokeLinecap="round" style={{ marginTop: 2, flexShrink: 0 }}>
                  <polyline points="20 6 9 17 4 12" />
                </svg>
                <span style={{ color: "#484848", fontSize: 14, lineHeight: 1.6 }}>{t}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Final CTA ──────────────────────────────────────────────── */}
      <section style={{ padding: "0 24px 120px" }}>
        <div
          style={{
            maxWidth: 760,
            margin: "0 auto",
            padding: "72px 48px",
            textAlign: "center",
            background: "linear-gradient(135deg, rgba(88,101,242,0.1) 0%, rgba(167,139,250,0.06) 100%)",
            border: "1px solid rgba(88,101,242,0.2)",
            borderRadius: 28,
            position: "relative",
            overflow: "hidden",
          }}
        >
          {/* Glow */}
          <div
            aria-hidden
            style={{
              position: "absolute",
              top: -80, left: "50%", transform: "translateX(-50%)",
              width: 500, height: 300,
              background: "radial-gradient(ellipse, rgba(88,101,242,0.2) 0%, transparent 70%)",
              pointerEvents: "none",
            }}
          />

          <h2
            style={{
              position: "relative",
              fontSize: "clamp(28px, 4vw, 48px)",
              fontWeight: 900, letterSpacing: "-0.04em",
              color: "#f0f0f0", margin: "0 0 16px", lineHeight: 1.1,
            }}
          >
            Your next Discord message
            <br />
            is one canvas away.
          </h2>
          <p style={{ position: "relative", color: "#4a4a4a", fontSize: 17, margin: "0 auto 36px", maxWidth: 440, lineHeight: 1.65 }}>
            Start building for free. No credit card, no setup — just log in with your Discord account.
          </p>
          <button
            onClick={login}
            style={{
              position: "relative",
              display: "inline-flex", alignItems: "center", gap: 10,
              padding: "16px 32px",
              background: "#5865F2",
              border: "none", borderRadius: 16,
              color: "#fff", fontSize: 17, fontWeight: 800,
              cursor: "pointer", fontFamily: FONT,
              boxShadow: "0 4px 28px rgba(88,101,242,0.5), 0 1px 4px rgba(0,0,0,0.4)",
              transition: "all 0.15s",
              letterSpacing: "-0.02em",
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLElement).style.background = "#6773f5";
              (e.currentTarget as HTMLElement).style.boxShadow = "0 8px 40px rgba(88,101,242,0.6), 0 2px 6px rgba(0,0,0,0.4)";
              (e.currentTarget as HTMLElement).style.transform = "translateY(-2px)";
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLElement).style.background = "#5865F2";
              (e.currentTarget as HTMLElement).style.boxShadow = "0 4px 28px rgba(88,101,242,0.5), 0 1px 4px rgba(0,0,0,0.4)";
              (e.currentTarget as HTMLElement).style.transform = "none";
            }}
          >
            <DiscordIcon size={20} />
            Get Started Free
          </button>
          <p style={{ position: "relative", marginTop: 16, fontSize: 12, color: "#2e2e2e" }}>
            Free to use · No credit card · Discord OAuth
          </p>
        </div>
      </section>

      {/* ── Footer ─────────────────────────────────────────────────── */}
      <footer
        style={{
          borderTop: "1px solid rgba(255,255,255,0.05)",
          padding: "40px 32px",
          maxWidth: 1080,
          margin: "0 auto",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          flexWrap: "wrap",
          gap: 16,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <img src="/logo.png" alt="OpenEmbedded" width={20} height={20} style={{ borderRadius: 5, objectFit: "contain", opacity: 0.6 }} />
          <span style={{ fontSize: 13, color: "#2e2e2e", fontWeight: 600 }}>OpenEmbedded</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 24 }}>
          {[
            { label: "Docs", href: "/docs" },
            { label: "Terms", href: "/tos" },
            { label: "Privacy", href: "/privacy" },
            { label: "Support", href: "/support" },
          ].map((l) => (
            <a
              key={l.href}
              href={l.href}
              style={{ fontSize: 13, color: "#2e2e2e", textDecoration: "none", transition: "color 0.15s" }}
              onMouseEnter={(e) => ((e.target as HTMLElement).style.color = "#666")}
              onMouseLeave={(e) => ((e.target as HTMLElement).style.color = "#2e2e2e")}
            >
              {l.label}
            </a>
          ))}
        </div>
      </footer>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;800;900&display=swap');
        * { box-sizing: border-box; }
        @media (max-width: 700px) {
          .oe-compare-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </div>
  );
}
