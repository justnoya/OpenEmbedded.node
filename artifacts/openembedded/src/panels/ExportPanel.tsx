import { useState } from "react";
import { useGraphStore } from "@/lib/graphStore";
import { usePreviewStore } from "@/lib/previewStore";
import { useSettingsStore } from "@/lib/settingsStore";
import { useExportCode, useSendWebhook } from "@workspace/api-client-react";
import { Copy, Check, Code2, Webhook, FileJson, Send, Loader2 } from "lucide-react";

type Tab = "json" | "code" | "webhook";

const tabDefs: { id: Tab; label: string; icon: React.ReactNode }[] = [
  { id: "json", label: "JSON", icon: <FileJson size={13} /> },
  { id: "code", label: "discord.js", icon: <Code2 size={13} /> },
  { id: "webhook", label: "Webhook", icon: <Webhook size={13} /> },
];

const inputBase: React.CSSProperties = {
  background: "#0d1117",
  border: "1px solid rgba(255,255,255,0.08)",
  borderRadius: 6,
  color: "#e6edf3",
  fontSize: 12,
  padding: "7px 10px",
  outline: "none",
  fontFamily: "inherit",
  width: "100%",
  boxSizing: "border-box",
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
        onSuccess: (result) => {
          setCode((result as { code: string }).code);
          setCodeLoading(false);
        },
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
          if (r.success) {
            setWebhookStatus("success");
            setWebhookMsg("Message sent successfully!");
          } else {
            setWebhookStatus("error");
            setWebhookMsg(r.message ?? "Send failed");
          }
        },
        onError: () => {
          setWebhookStatus("error");
          setWebhookMsg("Network error sending webhook");
        },
      }
    );
  };

  const codeBlockStyle: React.CSSProperties = {
    background: "#0d1117",
    border: "1px solid rgba(255,255,255,0.07)",
    borderRadius: 7,
    padding: 12,
    color: "#e6edf3",
    fontSize: 12,
    fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
    overflowX: "auto",
    margin: 0,
    lineHeight: 1.6,
    whiteSpace: "pre",
    maxHeight: 200,
    overflowY: "auto",
  };

  return (
    <div
      style={{
        background: "#161b22",
        borderTop: "1px solid rgba(255,255,255,0.07)",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          padding: "6px 12px",
          borderBottom: "1px solid rgba(255,255,255,0.07)",
          gap: 2,
          flexShrink: 0,
        }}
      >
        {tabDefs.map((t) => (
          <button
            key={t.id}
            onClick={() => setActiveTab(t.id)}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 5,
              padding: "5px 11px",
              background: activeTab === t.id ? "rgba(88,101,242,0.15)" : "transparent",
              border: "none",
              borderRadius: 5,
              color: activeTab === t.id ? "#818cf8" : "#7d8590",
              fontSize: 12,
              fontWeight: activeTab === t.id ? 600 : 400,
              cursor: "pointer",
              transition: "all 0.12s",
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
              display: "flex",
              alignItems: "center",
              gap: 5,
              background: copied ? "rgba(63,185,80,0.12)" : "rgba(255,255,255,0.05)",
              border: "1px solid rgba(255,255,255,0.08)",
              borderRadius: 5,
              color: copied ? "#3fb950" : "#7d8590",
              fontSize: 11,
              fontWeight: 600,
              padding: "4px 10px",
              cursor: "pointer",
              transition: "all 0.15s",
            }}
          >
            {copied ? <Check size={12} /> : <Copy size={12} />}
            {copied ? "Copied!" : "Copy"}
          </button>
        )}
      </div>

      <div style={{ flex: 1, overflowY: "auto", padding: 12 }}>
        {activeTab === "json" && (
          <pre style={codeBlockStyle}>{jsonText}</pre>
        )}

        {activeTab === "code" && (
          <div>
            {code ? (
              <pre style={codeBlockStyle}>{code}</pre>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 10, padding: "16px 0" }}>
                <div style={{ color: "#7d8590", fontSize: 12, textAlign: "center" }}>
                  Generate ready-to-use discord.js v14 builder code
                </div>
                <button
                  data-testid="generate-code"
                  onClick={handleGenerateCode}
                  disabled={codeLoading}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 6,
                    background: "#5865F2",
                    border: "none",
                    borderRadius: 6,
                    color: "#fff",
                    fontSize: 12,
                    fontWeight: 600,
                    padding: "7px 16px",
                    cursor: codeLoading ? "wait" : "pointer",
                    opacity: codeLoading ? 0.7 : 1,
                  }}
                >
                  {codeLoading ? (
                    <Loader2 size={13} style={{ animation: "spin 1s linear infinite" }} />
                  ) : (
                    <Code2 size={13} />
                  )}
                  {codeLoading ? "Generating…" : "Generate Code"}
                </button>
              </div>
            )}
          </div>
        )}

        {activeTab === "webhook" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            <div>
              <label
                style={{
                  display: "block",
                  color: "#7d8590",
                  fontSize: 11,
                  fontWeight: 600,
                  textTransform: "uppercase",
                  letterSpacing: "0.06em",
                  marginBottom: 5,
                }}
              >
                Webhook URL
              </label>
              <input
                type="text"
                value={webhookUrl}
                onChange={(e) => { setWebhookUrl(e.target.value); setWebhookStatus("idle"); }}
                placeholder="https://discord.com/api/webhooks/…"
                data-testid="webhook-url"
                style={inputBase}
              />
              <div style={{ color: "#484f58", fontSize: 10, marginTop: 4 }}>
                URL is saved locally in your browser
              </div>
            </div>

            <button
              data-testid="send-webhook"
              onClick={handleSendWebhook}
              disabled={!webhookUrl || !payload || webhookStatus === "sending"}
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 6,
                background: webhookStatus === "success" ? "#3fb950" : "#5865F2",
                border: "none",
                borderRadius: 6,
                color: webhookStatus === "success" ? "#000" : "#fff",
                fontSize: 12,
                fontWeight: 700,
                padding: "8px 0",
                cursor: (!webhookUrl || !payload) ? "not-allowed" : "pointer",
                opacity: (!webhookUrl || !payload) ? 0.45 : 1,
                transition: "all 0.15s",
              }}
            >
              {webhookStatus === "sending" ? (
                <Loader2 size={13} style={{ animation: "spin 1s linear infinite" }} />
              ) : (
                <Send size={13} />
              )}
              {webhookStatus === "sending"
                ? "Sending…"
                : webhookStatus === "success"
                ? "Sent!"
                : "Send to Discord"}
            </button>

            {webhookStatus !== "idle" && webhookMsg && (
              <div
                style={{
                  padding: "7px 10px",
                  borderRadius: 5,
                  background:
                    webhookStatus === "success"
                      ? "rgba(63,185,80,0.1)"
                      : "rgba(248,81,73,0.1)",
                  border:
                    webhookStatus === "success"
                      ? "1px solid rgba(63,185,80,0.25)"
                      : "1px solid rgba(248,81,73,0.25)",
                  color: webhookStatus === "success" ? "#3fb950" : "#f85149",
                  fontSize: 12,
                }}
              >
                {webhookMsg}
              </div>
            )}
          </div>
        )}
      </div>

      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
