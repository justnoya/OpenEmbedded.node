// @ts-nocheck
/// <reference lib="dom" />
import { Router } from "express";
import { SendWebhookBody } from "@workspace/api-zod";
import { webhookLimiter } from "../middleware/security";

const router = Router();

const CV2_COMPONENT_TYPES = new Set([9, 10, 11, 12, 14, 17]);

/* ── Strict Discord webhook URL validation ───────────────────────────────────
 *  Prevents SSRF by ensuring only well-formed Discord webhook URLs are proxied.
 *  Pattern: https://discord.com/api/webhooks/<snowflake>/<token>
 *  MITRE T1090 / OWASP A10
 * ─────────────────────────────────────────────────────────────────────────── */
const WEBHOOK_RE =
  /^https:\/\/discord\.com\/api\/webhooks\/\d{17,20}\/[A-Za-z0-9_-]{60,}$/;

function isValidWebhookUrl(url: string): boolean {
  const cleaned = url.split("?")[0];
  return WEBHOOK_RE.test(cleaned);
}

function hasCV2Components(components: unknown): boolean {
  if (!Array.isArray(components)) return false;
  for (const c of components) {
    if (c && typeof c === "object") {
      const comp = c as Record<string, unknown>;
      if (CV2_COMPONENT_TYPES.has(comp.type as number)) return true;
      if (hasCV2Components(comp.components)) return true;
    }
  }
  return false;
}

/* ── POST /v1/webhook/send ───────────────────────────────────────────────────
 *  Rate-limited: 5 req / min per IP (hits Discord API).
 * ─────────────────────────────────────────────────────────────────────────── */
router.post("/v1/webhook/send", webhookLimiter, async (req, res) => {
  const parsed = SendWebhookBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid request body" });
    return;
  }

  const { webhookUrl, payload } = parsed.data;

  if (!isValidWebhookUrl(webhookUrl)) {
    res.status(400).json({
      error: "Invalid webhook URL. Must be a Discord webhook URL of the form https://discord.com/api/webhooks/<id>/<token>",
    });
    return;
  }

  const safePayload = { ...(payload as Record<string, unknown>) };
  const isCV2 = hasCV2Components(safePayload.components);

  if (isCV2) {
    safePayload.flags = ((safePayload.flags as number | undefined) ?? 0) | 32768;
    delete safePayload.embeds;
    delete safePayload.content;
  } else {
    if (typeof safePayload.flags === "number") {
      const stripped = safePayload.flags & ~32768;
      if (stripped === 0) delete safePayload.flags;
      else safePayload.flags = stripped;
    }
  }

  const hasContent =
    typeof safePayload.content === "string" && safePayload.content.trim().length > 0;
  const hasEmbeds = Array.isArray(safePayload.embeds) && safePayload.embeds.length > 0;
  const hasComponents =
    Array.isArray(safePayload.components) && safePayload.components.length > 0;

  if (!hasContent && !hasEmbeds && !hasComponents) {
    res.json({
      success: false,
      message: "Payload is empty — add content, embeds, or components before sending.",
    });
    return;
  }

  const baseUrl = webhookUrl.split("?")[0];
  const sendUrl = `${baseUrl}?wait=true`;

  try {
    const response = await fetch(sendUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(safePayload),
    });

    if (!response.ok) {
      const text = await response.text();
      let friendlyMessage = `Discord rejected the message (HTTP ${response.status})`;
      try {
        const json = JSON.parse(text) as { message?: string; code?: number };
        if (json.message) friendlyMessage = `Discord error: ${json.message}`;
        if (json.code) friendlyMessage += ` (code ${json.code})`;
      } catch {
        if (text) friendlyMessage += `: ${text.slice(0, 200)}`;
      }
      req.log.warn({ status: response.status }, "Discord webhook rejected");
      res.json({ success: false, message: friendlyMessage });
      return;
    }

    res.json({ success: true, message: null });
  } catch (err) {
    req.log.error({ type: (err as Error).constructor?.name }, "Failed to send webhook");
    res.status(500).json({ error: "Failed to send webhook — network error" });
  }
});

export default router;
