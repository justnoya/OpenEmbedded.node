import { useState } from "react";
import { useGraphStore } from "@/lib/graphStore";
import { usePreviewStore } from "@/lib/previewStore";
import { useExportCode, useSendWebhook } from "@workspace/api-client-react";
import {
  Copy, Check, Code2, Webhook, FileJson, Send,
  Loader2, AlertCircle, CheckCircle2,
} from "lucide-react";

type Tab = "json" | "code" | "webhook";

const TAB_META: Record<Tab, { label: string; icon: React.ReactNode; description: string }> = {
  json:    { label: "JSON",       icon: <FileJson size={13} />, description: "Raw Discord API payload" },
  code:    { label: "discord.js", icon: <Code2 size={13} />,   description: "Ready-to-paste bot code" },
  webhook: { label: "Webhook",    icon: <Webhook size={13} />, description: "No code — send directly" },
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

  const exportCode = useExportCode();
  const sendWebhook = useSendWebhook();
  const jsonText = payload ? JSON.stringify(payload, null, 2) : "{}";

  // Read webhook config from the Webhook node on the canvas
  const webhookNode = nodes.find(
    (n) => n.type === "webhook",
  );
  const webhookNodeData = webhookNode?.data as Record<string, unknown> | undefined;
  const webhookUrl = (webhookNodeData?.webhookUrl as string | undefined) ?? "";
  const webhookConnected = !!(webhookNodeData?.connected as boolean | undefined);
  const webhookName = (webhookNodeData?.webhookName as string | null | undefined) ?? null;
  const webhookAvatar = (webhookNodeData?.webhookAvatar as string | null | undefined) ?? null;

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
    if (!webhookUrl || !payload || !webhookConnected) return;
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
            setWebhookMsg(r.message ?? "Discord rejected the message — check your webhook and try again.");
          }
        },
        onError: () => {
          setWebhookStatus("error");
          setWebhookMsg("Couldn't reach Discord — check your internet connection and try again.");
        },
      }
    );
  };

  const canSend = webhookConnected && !!payload;

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
              borderBottom: activeTab === id ? "2px solid rgba(255,255,255,0.55)" : "2px solid transparent",
              borderRadius: 0,
              color: activeTab === id ? "#c0c0c0" : "#505050",
              cursor: "pointer",
              transition: "color 0.12s, border-color 0.12s",
              gap: 2,
            }}
          >
            <span style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 12, fontWeight: activeTab === id ? 600 : 400 }}>
              {meta.icon}
              {meta.label}
            </span>
            <span style={{ fontSize: 9, color: activeTab === id ? "#404040" : "#3a3a3a", fontWeight: 400 }}>
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
            <div style={{ fontSize: 11, color: "#484848", marginBottom: 8 }}>
              Paste this into your Discord bot's message payload
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
                  background: "#efefef",
                  border: "none", borderRadius: 8, color: "#111111",
                  fontSize: 12, fontWeight: 600, padding: "8px 18px",
                  cursor: codeLoading ? "wait" : "pointer",
                  opacity: codeLoading ? 0.7 : 1,
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

            {/* Webhook node status */}
            {!webhookNode ? (
              /* No webhook node on canvas */
              <div style={{
                display: "flex", flexDirection: "column", alignItems: "center",
                gap: 10, padding: "22px 0", textAlign: "center",
              }}>
                <Webhook size={28} color="#2e2e2e" />
                <div>
                  <div style={{ color: "#888", fontSize: 13, fontWeight: 600, marginBottom: 4 }}>
                    No Webhook node on canvas
                  </div>
                  <div style={{ color: "#484848", fontSize: 11, lineHeight: 1.6 }}>
                    Add a <strong style={{ color: "#606060" }}>Webhook</strong> node from the
                    left panel, paste your Discord webhook URL in it, and come back here to send.
                  </div>
                </div>
              </div>
            ) : !webhookConnected ? (
              /* Webhook node exists but URL not validated yet */
              <div style={{
                padding: "10px 12px", borderRadius: 9,
                background: "rgba(255,255,255,0.03)",
                border: "1px solid rgba(255,255,255,0.07)",
                display: "flex", alignItems: "center", gap: 10,
              }}>
                <AlertCircle size={14} color="#484848" />
                <div>
                  <div style={{ color: "#888", fontSize: 12, fontWeight: 600 }}>Webhook not connected</div>
                  <div style={{ color: "#484848", fontSize: 11, marginTop: 2 }}>
                    Paste a valid Discord webhook URL into the Webhook node on the canvas.
                  </div>
                </div>
              </div>
            ) : (
              /* Connected — show identity card */
              <div style={{
                padding: "10px 12px", borderRadius: 9,
                background: "rgba(63,185,80,0.06)",
                border: "1px solid rgba(63,185,80,0.16)",
                display: "flex", alignItems: "center", gap: 10,
              }}>
                {webhookAvatar ? (
                  <img src={webhookAvatar} alt="" style={{ width: 32, height: 32, borderRadius: "50%", flexShrink: 0 }} />
                ) : (
                  <div style={{
                    width: 32, height: 32, borderRadius: "50%",
                    background: "#5865f2", flexShrink: 0,
                    display: "flex", alignItems: "center", justifyContent: "center", fontSize: 15,
                  }}>🪝</div>
                )}
                <div style={{ minWidth: 0, flex: 1 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
                    <CheckCircle2 size={12} color="#3fb950" />
                    <span style={{ color: "#3fb950", fontSize: 13, fontWeight: 700, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {webhookName ?? "Webhook"}
                    </span>
                  </div>
                  <div style={{ color: "#2e4a32", fontSize: 10, marginTop: 1 }}>
                    Webhook connected · ready to send
                  </div>
                </div>
              </div>
            )}

            {/* Send button */}
            <button
              data-testid="send-webhook"
              onClick={handleSendWebhook}
              disabled={!canSend || webhookStatus === "sending"}
              style={{
                display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
                background: webhookStatus === "success"
                  ? "rgba(63,185,80,0.15)"
                  : "#efefef",
                border: webhookStatus === "success" ? "1px solid rgba(63,185,80,0.25)" : "none",
                borderRadius: 8,
                color: webhookStatus === "success" ? "#3fb950" : "#111111",
                fontSize: 12, fontWeight: 700, padding: "9px 0",
                cursor: !canSend ? "not-allowed" : "pointer",
                opacity: !canSend ? 0.3 : 1,
                transition: "all 0.15s",
              }}
            >
              {webhookStatus === "sending"
                ? <Loader2 size={13} style={{ animation: "spin 1s linear infinite" }} />
                : <Send size={13} />}
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
