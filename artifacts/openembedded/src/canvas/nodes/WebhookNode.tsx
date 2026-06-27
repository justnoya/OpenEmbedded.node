// @ts-nocheck
import { memo, useRef, useState } from "react";
import { Handle, Position, NodeProps, useReactFlow } from "@xyflow/react";
import { NodeWrapper } from "./NodeWrapper.js";
import { Webhook, CheckCircle2, AlertCircle, Send, Loader2 } from "lucide-react";

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
      if (!res.ok) {
        throw new Error(`Discord returned ${res.status}`);
      }
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
      typeName="Webhook · Advanced"
      icon={<Webhook size={18} />}
      accentColor="#5865F2"
      nodeClass="root"
      showSendHandle
    >
      <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
        {/* URL input */}
        <div>
          <label
            style={{
              display: "block",
              color: "#484848",
              fontSize: 9,
              fontWeight: 700,
              textTransform: "uppercase",
              letterSpacing: "0.07em",
              marginBottom: 4,
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
              background: "rgba(255,255,255,0.04)",
              border: `1px solid ${fetchError && webhookUrl ? "rgba(248,81,73,0.4)" : "rgba(255,255,255,0.09)"}`,
              borderRadius: 6,
              color: "#e0e0e0",
              fontSize: 10,
              padding: "5px 8px",
              outline: "none",
              fontFamily: "inherit",
              transition: "border-color 0.12s",
            }}
          />
        </div>

        {/* Status row */}
        {loading && (
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <Loader2
              size={11}
              color="#818cf8"
              style={{ animation: "webhook-spin 1s linear infinite" }}
            />
            <span style={{ color: "#818cf8", fontSize: 11 }}>Fetching webhook…</span>
          </div>
        )}

        {!loading && connected && webhookName && (
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            {webhookAvatar ? (
              <img
                src={webhookAvatar}
                alt=""
                style={{ width: 26, height: 26, borderRadius: "50%", flexShrink: 0 }}
              />
            ) : (
              <div
                style={{
                  width: 26,
                  height: 26,
                  borderRadius: "50%",
                  background: "#5865f2",
                  flexShrink: 0,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 13,
                }}
              >
                🪝
              </div>
            )}
            <div style={{ minWidth: 0, flex: 1 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                <CheckCircle2 size={11} color="#3fb950" />
                <span
                  style={{
                    color: "#3fb950",
                    fontSize: 11,
                    fontWeight: 600,
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                    maxWidth: 140,
                  }}
                >
                  {webhookName}
                </span>
              </div>
              <div style={{ color: "#2e4040", fontSize: 9, marginTop: 1 }}>Connected</div>
            </div>
          </div>
        )}

        {!loading && fetchError && webhookUrl.trim().length > 0 && (
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <AlertCircle size={11} color="#f85149" />
            <span style={{ color: "#f85149", fontSize: 11 }}>{fetchError}</span>
          </div>
        )}

        {!loading && !connected && !fetchError && webhookUrl.trim().length === 0 && (
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <AlertCircle size={12} color="#484848" />
            <span style={{ color: "#484848", fontSize: 11 }}>Paste a webhook URL above</span>
          </div>
        )}

        {/* Send hint */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 5,
            marginTop: 2,
            paddingTop: 6,
            borderTop: "1px solid rgba(255,255,255,0.04)",
          }}
        >
          <Send size={9} color="#3fb950" />
          <span style={{ color: "#2e4a32", fontSize: 10 }}>
            Drag right handle → Container or Embed
          </span>
        </div>
      </div>

      <Handle
        type="source"
        position={Position.Right}
        style={{
          background: "#3fb950",
          border: "2px solid #252525",
          width: 12,
          height: 12,
        }}
      />

      <style>{`@keyframes webhook-spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}`}</style>
    </NodeWrapper>
  );
}

export const WebhookNode = memo(WebhookNodeComponent);
