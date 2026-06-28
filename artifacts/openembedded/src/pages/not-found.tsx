// @ts-nocheck
import { useEffect, useState } from "react";
import { useLocation } from "wouter";

const C = {
  canvas:   "#111111",
  panel:    "#1a1a1a",
  elevated: "#222222",
  float:    "#2a2a2a",
  b2: "rgba(255,255,255,0.07)",
  b3: "rgba(255,255,255,0.10)",
  b4: "rgba(255,255,255,0.16)",
  t1: "#f0f0f0",
  t2: "#909090",
  t3: "#555555",
  blurple: "#5865F2",
  shadow: {
    sm:  "0 2px 8px rgba(0,0,0,0.7),  0 0 0 1px rgba(255,255,255,0.05)",
    lg:  "0 8px 32px rgba(0,0,0,0.8),  0 0 0 1px rgba(255,255,255,0.06)",
    xxl: "0 24px 64px rgba(0,0,0,0.85), 0 0 0 1px rgba(255,255,255,0.07)",
  },
} as const;

function BrokenGraph() {
  return (
    <svg width="100%" height="100%" viewBox="0 0 520 260" preserveAspectRatio="xMidYMid meet" fill="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <pattern id="nf-dots" x="0" y="0" width="20" height="20" patternUnits="userSpaceOnUse">
          <circle cx="1" cy="1" r="0.9" fill="rgba(255,255,255,0.04)" />
        </pattern>
        <linearGradient id="nf-node" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#2a2a2a" />
          <stop offset="100%" stopColor="#1e1e1e" />
        </linearGradient>
        <filter id="nf-glow">
          <feGaussianBlur stdDeviation="3" result="blur" />
          <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
        </filter>
      </defs>

      <rect width="520" height="260" rx="14" fill="#111111" />
      <rect width="520" height="260" rx="14" fill="url(#nf-dots)" />

      {/* Node 1 — dimmed/disconnected */}
      <g transform="translate(30, 80)" opacity="0.45">
        <rect width="140" height="70" rx="10" fill="url(#nf-node)" stroke="rgba(88,101,242,0.3)" strokeWidth="1.5" />
        <rect x="12" y="12" width="26" height="26" rx="7" fill="rgba(88,101,242,0.15)" />
        <text x="48" y="26" fill="#ccc" fontSize="11" fontWeight="700">Webhook</text>
        <text x="48" y="40" fill="#444" fontSize="9">Root node</text>
        <rect x="12" y="46" width="116" height="14" rx="4" fill="rgba(255,255,255,0.03)" stroke="rgba(255,255,255,0.05)" strokeWidth="1" />
        <text x="18" y="57" fill="#444" fontSize="8">https://discord.com/…</text>
        {/* disconnected handle */}
        <circle cx="140" cy="35" r="5" fill="rgba(88,101,242,0.3)" />
      </g>

      {/* Broken edge — dashed, faded out */}
      <path d="M170 115 C210 115, 200 130, 240 130" stroke="rgba(88,101,242,0.2)" strokeWidth="1.5" strokeDasharray="5 4" />
      {/* Broken indicator */}
      <circle cx="205" cy="122" r="7" fill="#1a1a1a" stroke="rgba(239,68,68,0.5)" strokeWidth="1.5" />
      <text x="202" y="127" fill="rgba(239,68,68,0.8)" fontSize="9" fontWeight="800">✕</text>

      {/* Node 2 — error state */}
      <g transform="translate(250, 60)" opacity="0.55">
        <rect width="150" height="80" rx="10" fill="url(#nf-node)" stroke="rgba(239,68,68,0.4)" strokeWidth="1.5" strokeDasharray="4 3" />
        <rect x="12" y="12" width="26" height="26" rx="7" fill="rgba(239,68,68,0.12)" />
        <path d="M21 18L29 26M29 18L21 26" stroke="rgba(239,68,68,0.6)" strokeWidth="1.5" strokeLinecap="round" />
        <text x="48" y="26" fill="#aaa" fontSize="11" fontWeight="700">Page</text>
        <text x="48" y="40" fill="#555" fontSize="9">Not found</text>
        <rect x="12" y="48" width="126" height="20" rx="5" fill="rgba(239,68,68,0.07)" border="none" />
        <text x="18" y="62" fill="rgba(239,68,68,0.55)" fontSize="9">Error 404 — missing</text>
        <circle cx="0" cy="40" r="5" fill="rgba(239,68,68,0.3)" />
      </g>

      {/* Node 3 — faded ghost */}
      <g transform="translate(30, 178)" opacity="0.2">
        <rect width="120" height="56" rx="10" fill="url(#nf-node)" stroke="rgba(255,255,255,0.07)" strokeWidth="1.5" />
        <text x="14" y="28" fill="#666" fontSize="11" fontWeight="700">Container</text>
        <text x="14" y="44" fill="#444" fontSize="9">Disconnected</text>
        <circle cx="120" cy="28" r="4" fill="rgba(255,255,255,0.1)" />
      </g>

      {/* Ghost edge */}
      <path d="M150 206 C200 206, 200 195, 250 195" stroke="rgba(255,255,255,0.06)" strokeWidth="1.5" strokeDasharray="4 4" />

      {/* Node 4 — ghost */}
      <g transform="translate(330, 175)" opacity="0.18">
        <rect width="120" height="50" rx="10" fill="url(#nf-node)" stroke="rgba(255,255,255,0.06)" strokeWidth="1.5" />
        <text x="14" y="26" fill="#555" fontSize="11" fontWeight="700">Button</text>
        <text x="14" y="40" fill="#3a3a3a" fontSize="9">Missing parent</text>
        <circle cx="0" cy="25" r="4" fill="rgba(255,255,255,0.07)" />
      </g>

      {/* Toolbar strip */}
      <rect x="0" y="232" width="520" height="28" fill="rgba(0,0,0,0.25)" />
      <rect x="0" y="232" width="520" height="1" fill="rgba(255,255,255,0.04)" />
      <text x="20" y="250" fill="#3a3a3a" fontSize="9">Node Library</text>
      <rect x="106" y="237" width="1" height="18" fill="rgba(255,255,255,0.04)" />
      <text x="116" y="250" fill="#3a3a3a" fontSize="9">Properties</text>
      <rect x="188" y="237" width="1" height="18" fill="rgba(255,255,255,0.04)" />
      <text x="198" y="250" fill="#3a3a3a" fontSize="9">Preview</text>
    </svg>
  );
}

export default function NotFound() {
  const [, navigate] = useLocation();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setVisible(true), 60);
    return () => clearTimeout(t);
  }, []);

  return (
    <div style={{ background: C.canvas, color: C.t1, minHeight: "100dvh", overflowX: "hidden", display: "flex", flexDirection: "column" }}>

      {/* ── Navbar ── */}
      <div style={{ position: "fixed", top: 0, left: 0, right: 0, zIndex: 100, padding: "10px 16px" }}>
        <nav style={{
          background: "rgba(22,22,22,0.93)",
          backdropFilter: "blur(24px) saturate(160%)",
          WebkitBackdropFilter: "blur(24px) saturate(160%)",
          border: `1px solid ${C.b3}`,
          borderRadius: 14,
          boxShadow: C.shadow.lg,
          display: "flex", alignItems: "center", justifyContent: "space-between",
          padding: "0 16px", height: 48,
        }}>
          <button
            onClick={() => navigate("/")}
            style={{ display: "flex", alignItems: "center", gap: 8, background: "none", border: "none", cursor: "pointer", padding: 0 }}
          >
            <img src="/logo.png" alt="OpenEmbedded" width={26} height={26} style={{ borderRadius: 7, objectFit: "contain" }} />
            <span style={{ fontSize: 13, fontWeight: 700, letterSpacing: "-0.03em", color: C.t1 }}>OpenEmbedded</span>
          </button>
          <button
            onClick={() => navigate("/")}
            style={{
              background: C.blurple, border: "none", borderRadius: 10,
              color: "#fff", cursor: "pointer", fontSize: 12, fontWeight: 700,
              padding: "7px 14px", letterSpacing: "-0.02em",
              boxShadow: "0 3px 14px rgba(88,101,242,0.4)",
              transition: "all 0.12s",
            }}
            onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = "#6773f5"; }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = C.blurple; }}
          >
            Go home
          </button>
        </nav>
      </div>

      {/* ── Main content ── */}
      <main style={{
        flex: 1, display: "flex", flexDirection: "column", alignItems: "center",
        justifyContent: "center", padding: "100px 24px 80px", position: "relative",
        textAlign: "center",
      }}>

        {/* Radial glow — red-tinted for error feel */}
        <div aria-hidden style={{
          position: "absolute", top: "10%", left: "50%", transform: "translateX(-50%)",
          width: 700, height: 500, pointerEvents: "none",
          background: "radial-gradient(ellipse at 50% 30%, rgba(239,68,68,0.07) 0%, rgba(88,101,242,0.05) 45%, transparent 72%)",
        }} />

        <div style={{
          opacity: visible ? 1 : 0,
          transform: visible ? "none" : "translateY(20px)",
          transition: "opacity 0.5s ease, transform 0.5s ease",
          position: "relative", zIndex: 1, width: "100%", maxWidth: 760,
        }}>

          {/* 404 display number */}
          <div style={{
            fontSize: "clamp(96px, 18vw, 180px)",
            fontWeight: 900,
            letterSpacing: "-0.06em",
            lineHeight: 0.9,
            marginBottom: 8,
            background: "linear-gradient(135deg, rgba(255,255,255,0.06) 0%, rgba(255,255,255,0.02) 100%)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            backgroundClip: "text",
            userSelect: "none",
            position: "relative",
          }}>
            404
            {/* Blurple outline layered behind */}
            <span aria-hidden style={{
              position: "absolute", inset: 0,
              fontSize: "clamp(96px, 18vw, 180px)",
              fontWeight: 900,
              letterSpacing: "-0.06em",
              lineHeight: 0.9,
              background: "linear-gradient(135deg, rgba(88,101,242,0.35) 0%, rgba(139,92,246,0.2) 100%)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text",
              filter: "blur(24px)",
              zIndex: -1,
            }}>
              404
            </span>
          </div>

          {/* Status badge */}
          <div style={{
            display: "inline-flex", alignItems: "center", gap: 6,
            padding: "4px 10px 4px 6px", borderRadius: 100,
            background: C.panel, border: `1px solid rgba(239,68,68,0.25)`,
            fontSize: 11, fontWeight: 600, color: "rgba(239,68,68,0.7)",
            marginBottom: 24, marginTop: 16, boxShadow: C.shadow.sm,
          }}>
            <span style={{
              width: 6, height: 6, borderRadius: "50%",
              background: "rgba(239,68,68,0.8)",
              display: "inline-block",
              boxShadow: "0 0 6px rgba(239,68,68,0.6)",
            }} />
            Node connection lost
          </div>

          {/* Headline */}
          <h1 style={{
            margin: "0 auto 14px",
            fontSize: "clamp(22px, 3.5vw, 38px)",
            fontWeight: 900, letterSpacing: "-0.04em", lineHeight: 1.1,
            color: C.t1,
          }}>
            This page doesn't exist
          </h1>

          {/* Subtext */}
          <p style={{
            margin: "0 auto 40px",
            fontSize: "clamp(13px, 1.8vw, 15px)",
            color: C.t3, lineHeight: 1.75, maxWidth: 400,
          }}>
            Looks like this node got disconnected from the graph.
            The URL you followed might be broken or the page was removed.
          </p>

          {/* Actions */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 10, flexWrap: "wrap" }}>
            <button
              onClick={() => navigate("/")}
              style={{
                display: "flex", alignItems: "center", gap: 8,
                background: C.blurple, border: "none", borderRadius: 10,
                color: "#fff", cursor: "pointer", fontSize: 14, fontWeight: 700,
                padding: "11px 24px", letterSpacing: "-0.02em",
                boxShadow: "0 4px 20px rgba(88,101,242,0.45)",
                transition: "all 0.12s",
              }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = "#6773f5"; (e.currentTarget as HTMLElement).style.boxShadow = "0 6px 24px rgba(88,101,242,0.55)"; }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = C.blurple; (e.currentTarget as HTMLElement).style.boxShadow = "0 4px 20px rgba(88,101,242,0.45)"; }}
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" /><polyline points="9 22 9 12 15 12 15 22" />
              </svg>
              Back to home
            </button>
            <a
              href="/docs"
              style={{
                display: "flex", alignItems: "center", gap: 6,
                padding: "11px 20px",
                background: C.panel, border: `1px solid ${C.b3}`, borderRadius: 10,
                color: C.t2, fontSize: 14, fontWeight: 600,
                textDecoration: "none", transition: "all 0.12s",
                boxShadow: C.shadow.sm,
              }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = C.elevated; (e.currentTarget as HTMLElement).style.color = C.t1; }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = C.panel; (e.currentTarget as HTMLElement).style.color = C.t2; }}
            >
              View docs
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="9 18 15 12 9 6" />
              </svg>
            </a>
          </div>

          {/* Broken graph illustration */}
          <div style={{
            marginTop: 64,
            borderRadius: 14,
            overflow: "hidden",
            border: `1px solid ${C.b2}`,
            boxShadow: `0 0 0 1px rgba(0,0,0,0.5), ${C.shadow.xxl}`,
            aspectRatio: "520/260",
            maxWidth: 520,
            margin: "64px auto 0",
            background: C.canvas,
          }}>
            <BrokenGraph />
          </div>

          {/* Caption */}
          <p style={{ marginTop: 16, fontSize: 11, color: C.t3, letterSpacing: "0.01em" }}>
            The node graph above represents this broken page — disconnected from the rest.
          </p>

        </div>
      </main>

      {/* ── Footer ── */}
      <footer style={{
        borderTop: `1px solid ${C.b2}`,
        padding: "20px 24px",
        display: "flex", alignItems: "center", justifyContent: "center", gap: 20,
      }}>
        {[
          { label: "Home", href: "/" },
          { label: "Docs", href: "/docs" },
          { label: "Support", href: "/support" },
          { label: "Privacy", href: "/privacy" },
        ].map((l) => (
          <a
            key={l.href}
            href={l.href}
            style={{ color: C.t3, fontSize: 12, textDecoration: "none", transition: "color 0.12s" }}
            onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.color = C.t2; }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.color = C.t3; }}
          >
            {l.label}
          </a>
        ))}
      </footer>

    </div>
  );
}
