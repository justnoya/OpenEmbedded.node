import { useLocation } from "wouter";
import { ArrowLeft, Scale } from "lucide-react";

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

export function Terms() {
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
          }}>Terms of Service</span>

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
            <Scale size={22} color={TEXT_SEC} />
          </div>
          <div>
            <h1 style={{ fontSize: "1.8rem", fontWeight: 800, color: TEXT_PRI, letterSpacing: "-0.04em", margin: 0, lineHeight: 1.2 }}>
              Terms of Service
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

        {/* ── 1. Agreement ── */}
        <H2>1. Agreement to Terms</H2>
        <P>
          By accessing or using <Em>OpenEmbedded</Em> ("the Service", "we", "us"), you agree to be
          bound by these Terms of Service. If you do not agree, do not use the Service.
        </P>
        <P>
          OpenEmbedded is a visual node-graph builder for creating Discord Components V2 messages,
          embeds, and interactive UI layouts. The Service is provided free of charge.
        </P>

        {/* ── 2. Eligibility ── */}
        <H2>2. Eligibility</H2>
        <P>
          You must be at least <Em>13 years old</Em> to use the Service — the minimum age required
          by Discord's own Terms of Service. By using OpenEmbedded, you represent that you meet this
          requirement. If we learn that a user is under 13, we will delete their data without notice.
        </P>
        <P>
          You must also comply with all applicable local, national, and international laws in your use
          of the Service.
        </P>

        {/* ── 3. Account & Authentication ── */}
        <H2>3. Account &amp; Authentication</H2>
        <P>
          OpenEmbedded uses Discord OAuth to authenticate users. By signing in, you authorize us to
          receive basic profile information from Discord (your user ID, username, and avatar) as
          described in our <Em>Privacy Policy</Em>.
        </P>
        <P>
          You are responsible for maintaining the security of your Discord account. OpenEmbedded is not
          liable for any loss or damage arising from unauthorized access to your Discord account.
        </P>

        {/* ── 4. Acceptable Use ── */}
        <H2>4. Acceptable Use</H2>
        <P>You agree <Em>not</Em> to use the Service to:</P>
        <ul style={{ paddingLeft: 24, margin: "0 0 16px" }}>
          <Li>Send spam, unsolicited messages, or bulk communications via Discord</Li>
          <Li>Harass, abuse, threaten, or harm any person or group</Li>
          <Li>Violate <Em>Discord's Terms of Service</Em> or Community Guidelines</Li>
          <Li>Upload, create, or distribute content that is illegal, harmful, or infringing</Li>
          <Li>Attempt to reverse-engineer, hack, or disrupt the Service or its infrastructure</Li>
          <Li>Use automated scripts or bots to abuse or overload the Service's API</Li>
          <Li>Misrepresent your identity or impersonate another person or organization</Li>
          <Li>Use the Service for any commercial spam or phishing campaigns</Li>
        </ul>
        <P>
          We reserve the right to suspend or terminate accounts that violate these rules, at our
          sole discretion, without prior notice.
        </P>

        {/* ── 5. Bot Tokens ── */}
        <H2>5. Discord Bot Tokens</H2>
        <P>
          The Service allows you to optionally provide your own Discord bot token to send messages.
          By providing a token, you acknowledge that:
        </P>
        <ul style={{ paddingLeft: 24, margin: "0 0 16px" }}>
          <Li>Your token is transmitted over encrypted HTTPS and used solely to send the message you request</Li>
          <Li>Your token is <Em>never</Em> persistently stored in our database or logs</Li>
          <Li>You are solely responsible for the security of your bot token</Li>
          <Li>You should immediately regenerate your token in the Discord Developer Portal if you believe it has been compromised</Li>
          <Li>You are responsible for all actions taken using your bot token via the Service</Li>
        </ul>

        {/* ── 6. Data Ownership ── */}
        <H2>6. Your Data &amp; Content</H2>
        <P>
          You retain full ownership of all project data, node graphs, and content you create using
          OpenEmbedded. By using the Service, you grant us a limited, non-exclusive license to store
          and process your data solely for the purpose of operating the Service.
        </P>
        <P>
          We do not claim ownership over your projects. You may delete your projects at any time
          from within the application.
        </P>

        {/* ── 7. Service Availability ── */}
        <H2>7. Service Availability</H2>
        <P>
          OpenEmbedded is provided <Em>"as is"</Em> and <Em>"as available"</Em>. We make no
          guarantees of uptime, availability, or data preservation. The Service may be modified,
          suspended, or discontinued at any time without notice.
        </P>
        <P>
          We recommend exporting your project JSON periodically as a backup. We are not responsible
          for any data loss resulting from Service interruptions or termination.
        </P>

        {/* ── 8. Intellectual Property ── */}
        <H2>8. Intellectual Property</H2>
        <P>
          The OpenEmbedded brand, logo, interface design, and source code are the intellectual
          property of the OpenEmbedded project and its contributors. You may not reproduce, modify,
          or distribute them without explicit written permission.
        </P>
        <P>
          OpenEmbedded is not affiliated with, endorsed by, or sponsored by Discord Inc. "Discord"
          and the Discord logo are trademarks of Discord Inc.
        </P>

        {/* ── 9. Limitation of Liability ── */}
        <H2>9. Limitation of Liability</H2>
        <P>
          To the maximum extent permitted by applicable law, OpenEmbedded and its operators shall
          not be liable for any indirect, incidental, special, consequential, or punitive damages —
          including but not limited to loss of data, loss of profits, or service interruptions —
          arising from your use of or inability to use the Service.
        </P>
        <P>
          In no event shall our total liability to you exceed the greater of <Em>$0</Em> (as the
          Service is provided free of charge) or the minimum liability floor permitted by law.
        </P>

        {/* ── 10. Discord's Terms ── */}
        <H2>10. Compliance with Discord's Terms</H2>
        <P>
          You are solely responsible for ensuring your use of the Service complies with Discord's
          Terms of Service, Developer Terms, and Community Guidelines. OpenEmbedded is a tool; the
          messages you create and send are your responsibility.
        </P>

        {/* ── 11. Termination ── */}
        <H2>11. Termination</H2>
        <P>
          You may stop using the Service at any time. You may request deletion of your account data
          by contacting us via our Discord support server. We will delete your user profile and
          associated projects within 30 days of a verified request.
        </P>
        <P>
          We may terminate or suspend access for violations of these Terms, at our discretion.
        </P>

        {/* ── 12. Changes ── */}
        <H2>12. Changes to These Terms</H2>
        <P>
          We may update these Terms from time to time. Material changes will be announced in our
          Discord support server at least <Em>15 days</Em> before taking effect. Continued use of
          the Service after changes take effect constitutes acceptance of the revised Terms.
        </P>

        {/* ── 13. Governing Law ── */}
        <H2>13. Governing Law</H2>
        <P>
          These Terms are governed by and construed in accordance with applicable law. Any disputes
          arising from these Terms shall be resolved through good-faith negotiation first.
        </P>

        {/* ── 14. Contact ── */}
        <H2>14. Contact</H2>
        <P>
          For questions about these Terms, reach us via our{" "}
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
              { label: "Privacy Policy", href: "/privacy" },
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
