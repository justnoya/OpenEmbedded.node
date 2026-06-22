import { useState } from "react";
import { useGraphStore } from "@/lib/graphStore";
import { usePreviewStore } from "@/lib/previewStore";
import { useSettingsStore } from "@/lib/settingsStore";
import { useExportCode, useSendWebhook } from "@workspace/api-client-react";
import { Copy, Check, Code2, Webhook, FileJson, Send, Loader2 } from "lucide-react";

type Tab = "json" | "code" | "webhook";

const tabDefs: { id: Tab; label: string; icon: React.ReactNode }[] = [
  { id: "json",    label: "JSON",       icon: <FileJson size={13} /> },
  { id: "code",    label: "discord.js", icon: <Code2 size={13} /> },
  { id: "webhook", label: "Webhook",    icon: <Webhook size={13} /> },
];

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
    if (!webhookUrl || !payload) return;
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
      background: "#161616",
      borderTop: "1px solid rgba(255,255,255,0.06)",
      height: "100%",
      display: "flex", flexDirection: "column", overflow: "hidden",
    }}>
      {/* Tab bar */}
      <div style={{
        display: "flex", alignItems: "center",
        padding: "0 14px",
        borderBottom: "1px solid rgba(255,255,255,0.05)",
        gap: 2, flexShrink: 0,
        background: "rgba(255,255,255,0.01)",
      }}>
        {tabDefs.map((t) => (
          <button
            key={t.id}
            onClick={() => setActiveTab(t.id)}
            style={{
              display: "flex", alignItems: "center", gap: 5,
              padding: "8px 12px",
              background: "transparent", border: "none",
              borderBottom: activeTab === t.id ? "2px solid #5865F2" : "2px solid transparent",
              borderRadius: 0,
              color: activeTab === t.id ? "#818cf8" : "#505050",
              fontSize: 12, fontWeight: activeTab === t.id ? 600 : 400,
              cursor: "pointer",
              transition: "color 0.12s, border-color 0.12s",
            }}
          >
            {t.icon}
            {t.label}
          </button>
        ))}

        <div style={{ flex: 1 }} />

        {(activeTab === "json" || (activeTab === "code" && code)) && (
          <button
            data-testid={activeTab === "json" ? "copy-json" : "copy-code"}
            onClick={() => handleCopy(activeTab === "json" ? jsonText : code ?? "")}
            style={{
              display: "flex", alignItems: "center", gap: 5,
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
        {activeTab === "json" && <pre style={codeBlockStyle}>{jsonText}</pre>}

        {activeTab === "code" && (
          code ? (
            <pre style={codeBlockStyle}>{code}</pre>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 12, padding: "16px 0" }}>
              <div style={{ color: "#505050", fontSize: 12, textAlign: "center" }}>
                Generate ready-to-use discord.js v14 builder code
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

        {activeTab === "webhook" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <div>
              <label style={{
                display: "block", color: "#484848", fontSize: 10, fontWeight: 700,
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
                style={inputStyle}
                onFocus={(e) => {
                  (e.currentTarget as HTMLElement).style.borderColor = "rgba(88,101,242,0.5)";
                  (e.currentTarget as HTMLElement).style.boxShadow = "0 0 0 3px rgba(88,101,242,0.1)";
                }}
                onBlur={(e) => {
                  (e.currentTarget as HTMLElement).style.borderColor = "rgba(255,255,255,0.09)";
                  (e.currentTarget as HTMLElement).style.boxShadow = "none";
                }}
              />
              <div style={{ color: "#383838", fontSize: 10, marginTop: 4 }}>
                Supports both V1 Embeds and Components V2
              </div>
            </div>

            <button
              data-testid="send-webhook"
              onClick={handleSendWebhook}
              disabled={!webhookUrl || !payload || webhookStatus === "sending"}
              style={{
                display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
                background: webhookStatus === "success"
                  ? "rgba(63,185,80,0.15)"
                  : "linear-gradient(135deg, #5865F2, #7c3aed)",
                border: webhookStatus === "success" ? "1px solid rgba(63,185,80,0.25)" : "none",
                borderRadius: 8, color: webhookStatus === "success" ? "#3fb950" : "#fff",
                fontSize: 12, fontWeight: 700, padding: "9px 0",
                cursor: (!webhookUrl || !payload) ? "not-allowed" : "pointer",
                opacity: (!webhookUrl || !payload) ? 0.35 : 1,
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
                color: webhookStatus === "success" ? "#3fb950" : "#f85149",
                fontSize: 12,
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
