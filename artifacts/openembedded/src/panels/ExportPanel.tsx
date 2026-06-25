import { useState } from "react";
import { useGraphStore } from "@/lib/graphStore";
import { usePreviewStore } from "@/lib/previewStore";
import { useSettingsStore } from "@/lib/settingsStore";
import { useExportCode, useSendWebhook } from "@workspace/api-client-react";
import { Copy, Check, Code2, Webhook, FileJson, Send, Loader2, AlertCircle, CheckCircle2, ExternalLink } from "lucide-react";

type Tab = "json" | "code" | "webhook";

const DISCORD_WEBHOOK_RE = /^https:\/\/(?:ptb\.|canary\.)?discord(?:app)?\.com\/api\/webhooks\/\d+\/.+/;

const TAB_META: Record<Tab, { label: string; icon: React.ReactNode; description: string }> = {
  json:    { label: "JSON",       icon: <FileJson size={13} />,  description: "Raw Discord API payload" },
  code:    { label: "discord.js", icon: <Code2 size={13} />,    description: "Ready-to-paste bot code" },
  webhook: { label: "Webhook",    icon: <Webhook size={13} />,  description: "No code — send directly" },
};

const inputStyle: React.CSSProperties = {
  background: "rgba(255,255,255,0.04)",
  border: "1px solid rgba(255,255,255,0.09)",
  borderRadius: 8,
  color: "#e0e0e0",
  fontSize: 12,
  padding: "8px 11px",
  outline: "none",
  fontFamily: "inherit",
  width: "100%",
  boxSizing: "border-box",
  transition: "border-color 0.15s, box-shadow 0.15s",
};

export function ExportPanel() {
  const [activeTab, setActiveTab] = useState<Tab>("json");
  const [code, setCode] = useState<string | null>(null);
  const [codeLoading, setCodeLoading] = useState(false);
  const [webhookStatus, setWebhookStatus] = useState<"idle" | "sending" | "success" | "error">("idle");
  const [webhookMsg, setWebhookMsg] = useState("");
  const [copied, setCopied] = useState(false);

  const payload = usePreviewStore((s) => s.payload);
  const nodes = useGraphStore((s) => s.nodes);
  const edges = useGraphStore((s) => s.edges);
  const webhookUrl = useSettingsStore((s) => s.webhookUrl);
  const setWebhookUrl = useSettingsStore((s) => s.setWebhookUrl);

  const exportCode = useExportCode();
  const sendWebhook = useSendWebhook();
  const jsonText = payload ? JSON.stringify(payload, null, 2) : "{}";

  const isValidWebhook = DISCORD_WEBHOOK_RE.test(webhookUrl.trim());
  const webhookHasValue = webhookUrl.trim().length > 0;
  const webhookUrlError = webhookHasValue && !isValidWebhook
    ? "That doesn't look like a Discord webhook URL"
    : null;

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  };

  const handleGenerateCode = () => {
    setCodeLoading(true);
    setCode(null);
    exportCode.mutate(
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      { data: { graph: { nodes: nodes as any, edges: edges as any } } },
      {
        onSuccess: (result) => { setCode((result as { code: string }).code); setCodeLoading(false); },
        onError: () => setCodeLoading(false),
      }
    );
  };

  const handleSendWebhook = () => {
    if (!webhookUrl || !payload || !isValidWebhook) return;
    setWebhookStatus("sending");
    sendWebhook.mutate(
      { data: { webhookUrl, payload: payload as Record<string, unknown> } },
      {
        onSuccess: (result) => {
          const r = result as { success: boolean; message?: string | null };
          if (r.success) { setWebhookStatus("success"); setWebhookMsg("Message sent successfully!"); }
          else { setWebhookStatus("error"); setWebhookMsg(r.message ?? "Discord rejected the message — double-check your webhook URL and try again."); }
        },
        onError: () => { setWebhookStatus("error"); setWebhookMsg("Couldn't reach Discord — check your internet connection and try again."); },
      }
    );
  };

  const codeBlockStyle: React.CSSProperties = {
    background: "#0d0d0d",
    border: "1px solid rgba(255,255,255,0.07)",
    borderRadius: 10,
    padding: 14,
    color: "#c8d0e0",
    fontSize: 12,
    fontFamily: "'JetBrains Mono', monospace",
    overflowX: "auto",
    margin: 0,
    lineHeight: 1.65,
    whiteSpace: "pre",
    maxHeight: 190,
    overflowY: "auto",
    boxShadow: "inset 0 1px 3px rgba(0,0,0,0.3)",
  };

  return (
    <div style={{
      background: "#161616", borderTop: "1px solid rgba(255,255,255,0.06)",
      height: "100%", display: "flex", flexDirection: "column", overflow: "hidden",
    }}>
      {/* Tab bar */}
      <div style={{
        display: "flex", alignItems: "stretch",
        padding: "0 10px",
        borderBottom: "1px solid rgba(255,255,255,0.05)",
        gap: 0, flexShrink: 0,
        background: "rgba(255,255,255,0.01)",
      }}>
        {(Object.entries(TAB_META) as [Tab, typeof TAB_META[Tab]][]).map(([id, meta]) => (
          <button
            key={id}
            onClick={() => setActiveTab(id)}
            style={{
              display: "flex", flexDirection: "column", alignItems: "flex-start",
              padding: "8px 14px 6px",
              background: "transparent", border: "none",
              borderBottom: activeTab === id ? "2px solid #5865F2" : "2px solid transparent",
              borderRadius: 0,
              color: activeTab === id ? "#818cf8" : "#505050",
              cursor: "pointer",
              transition: "color 0.12s, border-color 0.12s",
              gap: 2,
            }}
          >
            <span style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 12, fontWeight: activeTab === id ? 600 : 400 }}>
              {meta.icon}
              {meta.label}
            </span>
            <span style={{ fontSize: 9, color: activeTab === id ? "#5865F2" : "#3a3a3a", fontWeight: 400 }}>
              {meta.description}
            </span>
          </button>
        ))}

        <div style={{ flex: 1 }} />

        {(activeTab === "json" || (activeTab === "code" && code)) && (
          <button
            data-testid={activeTab === "json" ? "copy-json" : "copy-code"}
            onClick={() => handleCopy(activeTab === "json" ? jsonText : code ?? "")}
            style={{
              display: "flex", alignItems: "center", gap: 5, alignSelf: "center",
              background: copied ? "rgba(63,185,80,0.1)" : "rgba(255,255,255,0.05)",
              border: `1px solid ${copied ? "rgba(63,185,80,0.2)" : "rgba(255,255,255,0.08)"}`,
              borderRadius: 6,
              color: copied ? "#3fb950" : "#606060",
              fontSize: 11, fontWeight: 600, padding: "4px 10px",
              cursor: "pointer", transition: "all 0.15s",
            }}
          >
            {copied ? <Check size={11} /> : <Copy size={11} />}
            {copied ? "Copied!" : "Copy"}
          </button>
        )}
      </div>

      <div style={{ flex: 1, overflowY: "auto", padding: 14 }}>

        {/* JSON tab */}
        {activeTab === "json" && (
          <div>
            <div style={{
              display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8,
            }}>
              <span style={{ fontSize: 11, color: "#484848" }}>
                Paste this into your Discord bot's message payload
              </span>
            </div>
            <pre style={codeBlockStyle}>{jsonText}</pre>
          </div>
        )}

        {/* discord.js tab */}
        {activeTab === "code" && (
          code ? (
            <div>
              <div style={{ fontSize: 11, color: "#484848", marginBottom: 8 }}>
                Paste this into your bot's message handler
              </div>
              <pre style={codeBlockStyle}>{code}</pre>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 12, padding: "20px 0" }}>
              <Code2 size={28} color="#2e2e2e" />
              <div style={{ textAlign: "center" }}>
                <div style={{ color: "#888", fontSize: 13, fontWeight: 600, marginBottom: 4 }}>
                  Generate discord.js v14 Code
                </div>
                <div style={{ color: "#484848", fontSize: 11, lineHeight: 1.6 }}>
                  Get ready-to-paste Node.js builder code for your bot.
                  <br />Requires discord.js v14+.
                </div>
              </div>
              <button
                data-testid="generate-code"
                onClick={handleGenerateCode}
                disabled={codeLoading}
                style={{
                  display: "flex", alignItems: "center", gap: 6,
                  background: "linear-gradient(135deg, #5865F2, #7c3aed)",
                  border: "none", borderRadius: 8, color: "#fff",
                  fontSize: 12, fontWeight: 600, padding: "8px 18px",
                  cursor: codeLoading ? "wait" : "pointer",
                  opacity: codeLoading ? 0.7 : 1,
                  boxShadow: "0 2px 12px rgba(88,101,242,0.3)",
                  transition: "opacity 0.15s",
                }}
              >
                {codeLoading ? <Loader2 size={13} style={{ animation: "spin 1s linear infinite" }} /> : <Code2 size={13} />}
                {codeLoading ? "Generating…" : "Generate Code"}
              </button>
            </div>
          )
        )}

        {/* Webhook tab */}
        {activeTab === "webhook" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {/* Info banner */}
            <div style={{
              padding: "8px 11px", borderRadius: 8,
              background: "rgba(88,101,242,0.06)", border: "1px solid rgba(88,101,242,0.14)",
              display: "flex", alignItems: "flex-start", gap: 8,
            }}>
              <CheckCircle2 size={13} color="#818cf8" style={{ marginTop: 1, flexShrink: 0 }} />
              <div style={{ fontSize: 11, color: "#707090", lineHeight: 1.6 }}>
                No bot needed — just paste a Discord webhook URL and click send.{" "}
                <a
                  href="/docs#send-via-webhook"
                  style={{ color: "#818cf8", textDecoration: "none" }}
                >
                  How to get a webhook URL <ExternalLink size={9} style={{ display: "inline" }} />
                </a>
              </div>
            </div>

            <div>
              <label style={{
                display: "block", color: "#555", fontSize: 10, fontWeight: 700,
                textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 6,
              }}>
                Webhook URL
              </label>
              <input
                type="text"
                value={webhookUrl}
                onChange={(e) => { setWebhookUrl(e.target.value); setWebhookStatus("idle"); }}
                placeholder="https://discord.com/api/webhooks/…"
                data-testid="webhook-url"
                style={{
                  ...inputStyle,
                  borderColor: webhookUrlError ? "rgba(248,81,73,0.45)" : undefined,
                }}
                onFocus={(e) => {
                  (e.currentTarget as HTMLElement).style.borderColor = "rgba(88,101,242,0.5)";
                  (e.currentTarget as HTMLElement).style.boxShadow = "0 0 0 3px rgba(88,101,242,0.1)";
                }}
                onBlur={(e) => {
                  (e.currentTarget as HTMLElement).style.borderColor = webhookUrlError ? "rgba(248,81,73,0.45)" : "rgba(255,255,255,0.09)";
                  (e.currentTarget as HTMLElement).style.boxShadow = "none";
                }}
              />
              {/* Validation feedback */}
              {webhookUrlError && (
                <div style={{ display: "flex", alignItems: "center", gap: 5, color: "#f85149", fontSize: 11, marginTop: 5 }}>
                  <AlertCircle size={11} />
                  {webhookUrlError}
                </div>
              )}
              {webhookHasValue && isValidWebhook && (
                <div style={{ display: "flex", alignItems: "center", gap: 5, color: "#3fb950", fontSize: 11, marginTop: 5 }}>
                  <CheckCircle2 size={11} />
                  Valid Discord webhook URL
                </div>
              )}
              {!webhookHasValue && (
                <div style={{ color: "#3d3d3d", fontSize: 10, marginTop: 4 }}>
                  Supports V1 Embeds and Components V2
                </div>
              )}
            </div>

            <button
              data-testid="send-webhook"
              onClick={handleSendWebhook}
              disabled={!isValidWebhook || !payload || webhookStatus === "sending"}
              style={{
                display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
                background: webhookStatus === "success"
                  ? "rgba(63,185,80,0.15)"
                  : "linear-gradient(135deg, #5865F2, #7c3aed)",
                border: webhookStatus === "success" ? "1px solid rgba(63,185,80,0.25)" : "none",
                borderRadius: 8, color: webhookStatus === "success" ? "#3fb950" : "#fff",
                fontSize: 12, fontWeight: 700, padding: "9px 0",
                cursor: (!isValidWebhook || !payload) ? "not-allowed" : "pointer",
                opacity: (!isValidWebhook || !payload) ? 0.35 : 1,
                transition: "all 0.15s",
                boxShadow: webhookStatus !== "success" ? "0 2px 12px rgba(88,101,242,0.3)" : "none",
              }}
            >
              {webhookStatus === "sending" ? <Loader2 size={13} style={{ animation: "spin 1s linear infinite" }} /> : <Send size={13} />}
              {webhookStatus === "sending" ? "Sending…" : webhookStatus === "success" ? "Sent ✓" : "Send to Discord"}
            </button>

            {webhookStatus !== "idle" && webhookMsg && (
              <div style={{
                padding: "8px 11px", borderRadius: 7,
                background: webhookStatus === "success" ? "rgba(63,185,80,0.08)" : "rgba(248,81,73,0.08)",
                border: webhookStatus === "success" ? "1px solid rgba(63,185,80,0.18)" : "1px solid rgba(248,81,73,0.18)",
                color: webhookStatus === "success" ? "#3fb950" : "#f85149", fontSize: 12,
              }}>
                {webhookMsg}
              </div>
            )}
          </div>
        )}
      </div>

      <style>{`@keyframes spin { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }`}</style>
    </div>
  );
}
