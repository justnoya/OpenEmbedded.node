// @ts-nocheck
import { memo, useRef, useState } from "react";
import { Handle, Position, NodeProps, useReactFlow } from "@xyflow/react";
import { NodeWrapper } from "./NodeWrapper.js";
import { Webhook, CheckCircle2, AlertCircle, ArrowRight, Loader2 } from "lucide-react";

const DISCORD_WEBHOOK_RE =
  /^https:\/\/(?:ptb\.|canary\.)?discord(?:app)?\.com\/api\/webhooks\/(\d+)\/([^/?#\s]+)/;

function WebhookNodeComponent({ id, data }: NodeProps) {
  const { updateNodeData } = useReactFlow();
  const webhookUrl = (data.webhookUrl as string) ?? "";
  const webhookName = (data.webhookName as string | null) ?? null;
  const webhookAvatar = (data.webhookAvatar as string | null) ?? null;
  const connected = !!(data.connected as boolean);

  const [loading, setLoading] = useState(false);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const fetchWebhookInfo = async (url: string) => {
    const match = DISCORD_WEBHOOK_RE.exec(url.trim());
    if (!match) {
      updateNodeData(id, { connected: false, webhookName: null, webhookAvatar: null });
      setFetchError("Doesn't look like a Discord webhook URL");
      setLoading(false);
      return;
    }

    setLoading(true);
    setFetchError(null);
    try {
      const res = await fetch(
        `https://discord.com/api/webhooks/${match[1]}/${match[2]}`,
      );
      if (!res.ok) throw new Error(`Discord returned ${res.status}`);
      const wh = (await res.json()) as {
        id: string;
        name: string;
        avatar: string | null;
      };
      const avatarUrl = wh.avatar
        ? `https://cdn.discordapp.com/avatars/${wh.id}/${wh.avatar}.png?size=64`
        : null;
      updateNodeData(id, {
        connected: true,
        webhookName: wh.name,
        webhookAvatar: avatarUrl,
      });
    } catch {
      updateNodeData(id, { connected: false, webhookName: null, webhookAvatar: null });
      setFetchError("Couldn't reach Discord — check the URL or token");
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const url = e.target.value;
    updateNodeData(id, {
      webhookUrl: url,
      connected: false,
      webhookName: null,
      webhookAvatar: null,
    });
    setFetchError(null);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (url.trim().length > 0) {
      debounceRef.current = setTimeout(() => fetchWebhookInfo(url), 900);
    }
  };

  return (
    <NodeWrapper
      id={id}
      typeName="Webhook"
      icon={<Webhook size={14} />}
      accentColor="#5865F2"
      nodeClass="relay"
      showBothHandles
    >
      <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
        {/* URL input */}
        <div>
          <label
            style={{
              display: "block",
              color: "#505050",
              fontSize: 9,
              fontWeight: 700,
              textTransform: "uppercase",
              letterSpacing: "0.07em",
              marginBottom: 3,
            }}
          >
            Webhook URL
          </label>
          <input
            type="text"
            value={webhookUrl}
            onChange={handleChange}
            placeholder="https://discord.com/api/webhooks/…"
            className="nodrag"
            style={{
              width: "100%",
              boxSizing: "border-box",
              background: "rgba(255,255,255,0.03)",
              border: `1px solid ${fetchError && webhookUrl ? "rgba(248,81,73,0.35)" : "rgba(255,255,255,0.07)"}`,
              borderRadius: 5,
              color: "#d0d0d0",
              fontSize: 10,
              padding: "5px 7px",
              outline: "none",
              fontFamily: "inherit",
              transition: "border-color 0.12s",
            }}
          />
        </div>

        {/* Status */}
        {loading && (
          <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
            <Loader2 size={10} color="#818cf8" style={{ animation: "wh-spin 1s linear infinite" }} />
            <span style={{ color: "#818cf8", fontSize: 10 }}>Fetching…</span>
          </div>
        )}

        {!loading && connected && webhookName && (
          <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
            {webhookAvatar ? (
              <img src={webhookAvatar} alt="" style={{ width: 20, height: 20, borderRadius: "50%", flexShrink: 0 }} />
            ) : (
              <div style={{ width: 20, height: 20, borderRadius: "50%", background: "#5865f2", flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11 }}>
                🪝
              </div>
            )}
            <div style={{ minWidth: 0, flex: 1 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                <CheckCircle2 size={10} color="#3fb950" />
                <span style={{ color: "#3fb950", fontSize: 10, fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: 130 }}>
                  {webhookName}
                </span>
              </div>
            </div>
          </div>
        )}

        {!loading && fetchError && webhookUrl.trim().length > 0 && (
          <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
            <AlertCircle size={10} color="#f85149" />
            <span style={{ color: "#f85149", fontSize: 10 }}>{fetchError}</span>
          </div>
        )}

        {!loading && !connected && !fetchError && webhookUrl.trim().length === 0 && (
          <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
            <AlertCircle size={10} color="#505050" />
            <span style={{ color: "#505050", fontSize: 10 }}>Paste a webhook URL above</span>
          </div>
        )}

        {/* Connection hint */}
        <div style={{ display: "flex", alignItems: "center", gap: 4, paddingTop: 4, borderTop: "1px solid rgba(255,255,255,0.04)" }}>
          <ArrowRight size={8} color="#505050" />
          <span style={{ color: "#505050", fontSize: 9 }}>Connect to Container or Embed →</span>
        </div>
      </div>

      {/* Target handle — accepts connections from Schedule etc. */}
      <Handle
        type="target"
        position={Position.Left}
        style={{ background: "#3fb950", border: "2px solid #1a1a1a", width: 10, height: 10 }}
      />
      {/* Source handle — sends to Container / Embedd */}
      <Handle
        type="source"
        position={Position.Right}
        style={{ background: "#5865F2", border: "2px solid #1a1a1a", width: 10, height: 10 }}
      />

      <style>{`@keyframes wh-spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}`}</style>
    </NodeWrapper>
  );
}

export const WebhookNode = memo(WebhookNodeComponent);
