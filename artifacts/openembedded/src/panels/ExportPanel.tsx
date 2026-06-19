import { useState } from "react";
import { useGraphStore } from "@/lib/graphStore";
import { usePreviewStore } from "@/lib/previewStore";
import { useSettingsStore } from "@/lib/settingsStore";
import { useExportCode, useSendWebhook } from "@workspace/api-client-react";

type Tab = "json" | "code" | "webhook";

export function ExportPanel() {
  const [activeTab, setActiveTab] = useState<Tab>("json");
  const [code, setCode] = useState<string | null>(null);
  const [codeLoading, setCodeLoading] = useState(false);
  const [webhookStatus, setWebhookStatus] = useState<string | null>(null);
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
    setTimeout(() => setCopied(false), 1500);
  };

  const handleGenerateCode = () => {
    setCodeLoading(true);
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
    setWebhookStatus("Sending...");
    sendWebhook.mutate(
      { data: { webhookUrl, payload: payload as Record<string, unknown> } },
      {
        onSuccess: (result) => {
          const r = result as { success: boolean; message?: string | null };
          setWebhookStatus(r.success ? "Sent successfully!" : `Failed: ${r.message}`);
        },
        onError: () => setWebhookStatus("Error sending webhook"),
      }
    );
  };

  const tabStyle = (tab: Tab) => ({
    padding: "6px 14px",
    background: activeTab === tab ? "#424549" : "transparent",
    border: "none",
    borderRadius: 4,
    color: activeTab === tab ? "#F2F3F5" : "#B5BAC1",
    fontSize: 12,
    fontWeight: activeTab === tab ? 600 : 400,
    cursor: "pointer",
  });

  return (
    <div
      style={{
        background: "#1E2124",
        borderTop: "1px solid rgba(255,255,255,0.063)",
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
          padding: "8px 12px",
          borderBottom: "1px solid rgba(255,255,255,0.063)",
          gap: 4,
        }}
      >
        <button style={tabStyle("json")} onClick={() => setActiveTab("json")} data-testid="tab-json">
          JSON
        </button>
        <button style={tabStyle("code")} onClick={() => setActiveTab("code")} data-testid="tab-code">
          discord.js Code
        </button>
        <button style={tabStyle("webhook")} onClick={() => setActiveTab("webhook")} data-testid="tab-webhook">
          Webhook
        </button>
      </div>

      <div style={{ flex: 1, overflowY: "auto", padding: 12, position: "relative" }}>
        {activeTab === "json" && (
          <div style={{ position: "relative" }}>
            <button
              data-testid="copy-json"
              onClick={() => handleCopy(jsonText)}
              style={{
                position: "absolute",
                top: 6,
                right: 6,
                background: copied ? "#57F287" : "#424549",
                border: "none",
                borderRadius: 4,
                color: copied ? "#000" : "#F2F3F5",
                fontSize: 11,
                padding: "3px 8px",
                cursor: "pointer",
                zIndex: 1,
              }}
            >
              {copied ? "Copied!" : "Copy"}
            </button>
            <pre
              style={{
                background: "#282B30",
                borderRadius: 6,
                padding: 12,
                color: "#F2F3F5",
                fontSize: 12,
                fontFamily: "'JetBrains Mono', monospace",
                overflowX: "auto",
                margin: 0,
              }}
            >
              {jsonText}
            </pre>
          </div>
        )}

        {activeTab === "code" && (
          <div>
            {code ? (
              <div style={{ position: "relative" }}>
                <button
                  data-testid="copy-code"
                  onClick={() => handleCopy(code)}
                  style={{
                    position: "absolute",
                    top: 6,
                    right: 6,
                    background: "#424549",
                    border: "none",
                    borderRadius: 4,
                    color: "#F2F3F5",
                    fontSize: 11,
                    padding: "3px 8px",
                    cursor: "pointer",
                  }}
                >
                  Copy
                </button>
                <pre
                  style={{
                    background: "#282B30",
                    borderRadius: 6,
                    padding: 12,
                    color: "#F2F3F5",
                    fontSize: 12,
                    fontFamily: "'JetBrains Mono', monospace",
                    overflowX: "auto",
                    margin: 0,
                  }}
                >
                  {code}
                </pre>
              </div>
            ) : (
              <div style={{ textAlign: "center", paddingTop: 24 }}>
                <div style={{ color: "#B5BAC1", fontSize: 13, marginBottom: 12 }}>
                  Generate discord.js v14 code from the current graph
                </div>
                <button
                  data-testid="generate-code"
                  onClick={handleGenerateCode}
                  disabled={codeLoading}
                  style={{
                    background: "#5865F2",
                    border: "none",
                    borderRadius: 6,
                    color: "#fff",
                    fontSize: 13,
                    fontWeight: 600,
                    padding: "8px 20px",
                    cursor: codeLoading ? "wait" : "pointer",
                    opacity: codeLoading ? 0.7 : 1,
                  }}
                >
                  {codeLoading ? "Generating..." : "Generate Code"}
                </button>
              </div>
            )}
          </div>
        )}

        {activeTab === "webhook" && (
          <div>
            <div style={{ marginBottom: 12 }}>
              <label style={{ display: "block", color: "#B5BAC1", fontSize: 11, fontWeight: 500, marginBottom: 4 }}>
                Discord Webhook URL
              </label>
              <input
                type="text"
                value={webhookUrl}
                onChange={(e) => setWebhookUrl(e.target.value)}
                placeholder="https://discord.com/api/webhooks/..."
                data-testid="webhook-url"
                style={{
                  width: "100%",
                  background: "#424549",
                  border: "1px solid rgba(255,255,255,0.1)",
                  borderRadius: 4,
                  color: "#F2F3F5",
                  fontSize: 12,
                  padding: "6px 8px",
                  boxSizing: "border-box",
                }}
              />
            </div>
            <button
              data-testid="send-webhook"
              onClick={handleSendWebhook}
              disabled={!webhookUrl || !payload || sendWebhook.isPending}
              style={{
                background: "#57F287",
                border: "none",
                borderRadius: 6,
                color: "#000",
                fontSize: 13,
                fontWeight: 600,
                padding: "8px 20px",
                cursor: (!webhookUrl || !payload) ? "not-allowed" : "pointer",
                opacity: (!webhookUrl || !payload) ? 0.5 : 1,
              }}
            >
              {sendWebhook.isPending ? "Sending..." : "Send to Discord"}
            </button>
            {webhookStatus && (
              <div
                style={{
                  marginTop: 10,
                  padding: "6px 10px",
                  borderRadius: 4,
                  background: webhookStatus.includes("success")
                    ? "rgba(87,242,135,0.1)"
                    : "rgba(237,66,69,0.1)",
                  color: webhookStatus.includes("success") ? "#57F287" : "#ED4245",
                  fontSize: 12,
                }}
              >
                {webhookStatus}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
