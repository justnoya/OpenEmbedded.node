// @ts-nocheck
import { useLocation } from "wouter";
import { ArrowLeft, Shield } from "lucide-react";

const AppLogo = ({ size = 28 }: { size?: number }) => (
  <img src="/logo.png" alt="OpenEmbedded" width={size} height={size}
    style={{ objectFit: "contain", display: "block", borderRadius: "50%" }} />
);

const BG      = "#111111";
const SURFACE = "rgba(26,26,26,0.97)";
const BORDER  = "rgba(255,255,255,0.08)";
const TEXT_PRI = "#f0f0f0";
const TEXT_SEC = "#a0a0a0";
const TEXT_MUT = "#555555";

const card = (extra?: React.CSSProperties): React.CSSProperties => ({
  background: "rgba(22,22,22,0.95)",
  border: `1px solid ${BORDER}`,
  borderRadius: 14,
  boxShadow: "0 4px 28px rgba(0,0,0,0.55), inset 0 1px 0 rgba(255,255,255,0.05)",
  ...extra,
});

const H2 = ({ children }: { children: React.ReactNode }) => (
  <h2 style={{
    fontSize: "1.2rem", fontWeight: 700, color: TEXT_PRI,
    letterSpacing: "-0.02em", margin: "40px 0 12px",
    borderBottom: `1px solid ${BORDER}`, paddingBottom: 10,
  }}>{children}</h2>
);

const P = ({ children }: { children: React.ReactNode }) => (
  <p style={{ fontSize: 15, lineHeight: 1.8, color: TEXT_SEC, margin: "0 0 14px" }}>{children}</p>
);

const Li = ({ children }: { children: React.ReactNode }) => (
  <li style={{ fontSize: 15, lineHeight: 1.75, color: TEXT_SEC, marginBottom: 6 }}>{children}</li>
);

const Em = ({ children }: { children: React.ReactNode }) => (
  <span style={{ color: TEXT_PRI, fontWeight: 500 }}>{children}</span>
);

const ProcessorRow = ({ name, role, detail }: { name: string; role: string; detail: string }) => (
  <div style={{
    ...card(), padding: "14px 18px",
    display: "grid", gridTemplateColumns: "160px 1fr",
    gap: "8px 20px", alignItems: "start",
  }}>
    <div>
      <div style={{ fontSize: 13.5, fontWeight: 700, color: TEXT_PRI, marginBottom: 2 }}>{name}</div>
      <div style={{ fontSize: 11.5, color: TEXT_MUT, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em" }}>{role}</div>
    </div>
    <div style={{ fontSize: 13.5, color: TEXT_SEC, lineHeight: 1.6 }}>{detail}</div>
  </div>
);

export function Privacy() {
  const [, navigate] = useLocation();

  return (
    <div style={{
      minHeight: "100dvh", background: BG, color: TEXT_PRI,
      fontFamily: `"DM Sans", system-ui, sans-serif`,
      display: "flex", flexDirection: "column",
    }}>
      {/* ── Header ─────────────────────────────────────────────────── */}
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
              background: "transparent", border: "none", cursor: "pointer", padding: "2px 0",
            }}
          >
            <AppLogo size={26} />
            <span style={{ fontSize: 14, fontWeight: 700, color: TEXT_PRI, letterSpacing: "-0.03em" }}>
              OpenEmbedded
            </span>
          </button>

          <div style={{ width: 1, height: 16, background: BORDER, flexShrink: 0 }} />
          <span style={{
            fontSize: 12, fontWeight: 600, color: TEXT_SEC,
            background: SURFACE, border: `1px solid ${BORDER}`,
            borderRadius: 6, padding: "2px 8px",
          }}>Privacy Policy</span>

        </header>
      </div>

      {/* ── Body ───────────────────────────────────────────────────── */}
      <div style={{ flex: 1, maxWidth: 760, margin: "0 auto", width: "100%", padding: "40px 24px 100px", boxSizing: "border-box" }}>

        {/* Title */}
        <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 28 }}>
          <div style={{
            width: 48, height: 48, borderRadius: 12, flexShrink: 0,
            background: "rgba(255,255,255,0.05)", border: `1px solid ${BORDER}`,
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            <Shield size={22} color={TEXT_SEC} />
          </div>
          <div>
            <h1 style={{ fontSize: "1.8rem", fontWeight: 800, color: TEXT_PRI, letterSpacing: "-0.04em", margin: 0, lineHeight: 1.2 }}>
              Privacy Policy
            </h1>
            <div style={{ fontSize: 13, color: TEXT_MUT, marginTop: 4 }}>
              Effective date: June 25, 2026 · Last updated: June 25, 2026
            </div>
          </div>
        </div>

        {/* Disclaimer banner */}
        <div style={{
          background: "rgba(210,153,34,0.08)", border: "1px solid rgba(210,153,34,0.25)",
          borderLeft: "3px solid #d29922", borderRadius: 10,
          padding: "14px 18px", marginBottom: 36,
          fontSize: 14, lineHeight: 1.65, color: "#d29922",
        }}>
          <span style={{ fontWeight: 700, marginRight: 6 }}>Note:</span>
          This document is provided for informational purposes. It does not constitute legal advice.
          Consult a qualified attorney for legal matters specific to your situation.
        </div>

        {/* ── 1. Who We Are ── */}
        <H2>1. Who We Are</H2>
        <P>
          <Em>OpenEmbedded</Em> is a free, open visual tool for building Discord Components V2
          messages. We do not have a formal legal entity at this time. For privacy-related inquiries,
          contact us via our{" "}
          <a href="https://discord.gg/P84XzN2UKh" target="_blank" rel="noreferrer"
            style={{ color: TEXT_PRI, textDecoration: "underline", textDecorationColor: BORDER }}>
            Discord support server
          </a>.
        </P>

        {/* ── 2. What We Collect ── */}
        <H2>2. What Data We Collect</H2>
        <P>We collect the minimum data necessary to operate the Service:</P>

        <div style={{ display: "flex", flexDirection: "column", gap: 8, margin: "16px 0 24px" }}>
          {[
            {
              label: "Discord Profile",
              items: [
                "Discord user ID (used as your account identifier)",
                "Username and global display name",
                "Avatar hash (used to display your avatar)",
                'Discriminator (legacy field, usually "0")',
              ],
            },
            {
              label: "Project Data",
              items: [
                "Project names",
                "Node graph data (nodes, edges, component configurations)",
                "Compiled message payloads you choose to save",
              ],
            },
            {
              label: "Session Data",
              items: [
                "A session identifier cookie (oe.sid) stored on your device",
                "Session records stored server-side in our database, linked to your Discord ID",
              ],
            },
          ].map((group) => (
            <div key={group.label} style={{ ...card(), padding: "16px 20px" }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: TEXT_PRI, marginBottom: 10, textTransform: "uppercase", letterSpacing: "0.05em" }}>{group.label}</div>
              <ul style={{ paddingLeft: 20, margin: 0 }}>
                {group.items.map((item) => (
                  <Li key={item}>{item}</Li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <P>
          We do <Em>not</Em> collect: email addresses, phone numbers, payment information, location
          data, advertising identifiers, or behavioral analytics.
        </P>
        <P>
          <Em>Discord bot tokens</Em> you optionally provide to send messages are transmitted over
          HTTPS and used immediately for that request only. They are never written to our database
          or logs.
        </P>

        {/* ── 3. How We Use It ── */}
        <H2>3. How We Use Your Data</H2>
        <ul style={{ paddingLeft: 24, margin: "0 0 16px" }}>
          <Li><Em>To authenticate you</Em> — identify your account via Discord OAuth</Li>
          <Li><Em>To operate the Service</Em> — store and serve your projects</Li>
          <Li><Em>To enforce our Terms</Em> — detect abuse or policy violations</Li>
          <Li><Em>To improve the Service</Em> — understand aggregate usage patterns (no individual tracking)</Li>
        </ul>
        <P>We do not sell, rent, or share your personal data with third parties for commercial purposes.</P>

        {/* ── 4. Third-Party Processors ── */}
        <H2>4. Third-Party Data Processors</H2>
        <P>
          The following services process data on our behalf. Each has its own privacy policy that
          governs their handling of any data they receive.
        </P>
        <div style={{ display: "flex", flexDirection: "column", gap: 8, margin: "16px 0 24px" }}>
          <ProcessorRow
            name="Discord"
            role="Authentication"
            detail="Processes your OAuth login. Receives our request to verify your identity. See discord.com/privacy."
          />
          <ProcessorRow
            name="Replit"
            role="Hosting & Infrastructure"
            detail="Hosts the application server and PostgreSQL database. Your project data and session records are stored on Replit-managed infrastructure. See replit.com/privacy."
          />
        </div>
        <P>
          We do not use analytics services (e.g. Google Analytics, Mixpanel), advertising networks,
          or session recording tools.
        </P>

        {/* ── 5. Cookies ── */}
        <H2>5. Cookies</H2>
        <P>
          We use a single session cookie: <Em>oe.sid</Em>. It is:
        </P>
        <ul style={{ paddingLeft: 24, margin: "0 0 16px" }}>
          <Li><Em>httpOnly</Em> — not accessible to JavaScript; protects against XSS attacks</Li>
          <Li><Em>sameSite=lax</Em> — not sent on cross-site requests; protects against CSRF</Li>
          <Li><Em>secure</Em> — only sent over HTTPS in production</Li>
          <Li>Expires after <Em>7 days</Em> of inactivity</Li>
        </ul>
        <P>
          We do not set any tracking, advertising, or analytics cookies. No third-party cookies are
          placed on your device by our Service.
        </P>

        {/* ── 6. Data Storage & Security ── */}
        <H2>6. Data Storage &amp; Security</H2>
        <P>
          Your data is stored in a PostgreSQL database hosted on Replit's infrastructure in the
          United States. We apply the following security controls:
        </P>
        <ul style={{ paddingLeft: 24, margin: "0 0 16px" }}>
          <Li>TLS/HTTPS encryption for all data in transit</Li>
          <Li>Session tokens stored server-side only (never in your local storage)</Li>
          <Li>Project queries are scoped to your authenticated user ID — you cannot access another user's projects</Li>
          <Li>API endpoints protected by authentication, rate limiting, and security headers (CSP, HSTS, X-Frame-Options)</Li>
          <Li>Error logs strip sensitive data — no tokens, passwords, or environment variables are logged</Li>
        </ul>

        {/* ── 7. Your Rights ── */}
        <H2>7. Your Rights</H2>
        <P>You have the following rights regarding your data:</P>
        <ul style={{ paddingLeft: 24, margin: "0 0 16px" }}>
          <Li><Em>Access</Em> — your projects are visible to you in the app at any time</Li>
          <Li><Em>Deletion of projects</Em> — delete individual projects from within the builder</Li>
          <Li><Em>Account deletion</Em> — contact us via Discord to request deletion of your user profile and all associated data; we will process the request within 30 days</Li>
          <Li><Em>Correction</Em> — your profile data (username, avatar) is re-synced from Discord on each login</Li>
        </ul>
        <P>
          Users in the European Economic Area (EEA) or United Kingdom may have additional rights
          under GDPR. Contact us if you wish to exercise them.
        </P>

        {/* ── 8. Minors ── */}
        <H2>8. Children's Privacy</H2>
        <P>
          The Service is not directed at children under 13. We do not knowingly collect data from
          anyone under 13. Discord itself requires users to be at least 13. If we discover a user
          is under 13, we will immediately delete their data and revoke access.
        </P>

        {/* ── 9. Data Retention ── */}
        <H2>9. Data Retention</H2>
        <P>
          We retain your data for as long as your account is active or as needed to operate the
          Service. Session records are automatically pruned every 15 minutes. If you request account
          deletion, we will delete your data within 30 days.
        </P>

        {/* ── 10. Changes ── */}
        <H2>10. Changes to This Policy</H2>
        <P>
          We may update this Privacy Policy from time to time. Material changes will be announced in
          our Discord support server at least <Em>15 days</Em> before taking effect. Continued use
          of the Service after changes constitutes acceptance of the revised policy.
        </P>

        {/* ── 11. Contact ── */}
        <H2>11. Contact</H2>
        <P>
          For privacy-related questions or data deletion requests, reach us via our{" "}
          <a href="https://discord.gg/P84XzN2UKh" target="_blank" rel="noreferrer"
            style={{ color: TEXT_PRI, textDecoration: "underline", textDecorationColor: BORDER }}>
            Discord support server
          </a>.
        </P>

        {/* ── Footer cross-links ── */}
        <div style={{
          ...card(), padding: "20px 24px", marginTop: 60,
          display: "flex", alignItems: "center", justifyContent: "space-between",
          flexWrap: "wrap", gap: 12,
        }}>
          <div style={{ fontSize: 13, color: TEXT_MUT }}>© 2026 OpenEmbedded</div>
          <div style={{ display: "flex", gap: 20, flexWrap: "wrap" }}>
            {[
              { label: "Home", href: "/" },
              { label: "Terms of Service", href: "/tos" },
              { label: "Docs", href: "/docs" },
              { label: "Support", href: "https://discord.gg/P84XzN2UKh" },
            ].map((l) => (
              <a key={l.label} href={l.href}
                style={{ fontSize: 13, color: TEXT_SEC, textDecoration: "none" }}
                onMouseEnter={(e) => (e.currentTarget.style.color = TEXT_PRI)}
                onMouseLeave={(e) => (e.currentTarget.style.color = TEXT_SEC)}
              >{l.label}</a>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
