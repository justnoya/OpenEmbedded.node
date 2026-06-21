import { Router } from "express";
import { SendWebhookBody } from "@workspace/api-zod";

const router = Router();

const CV2_COMPONENT_TYPES = new Set([9, 10, 11, 12, 14, 17]);

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

router.post("/v1/webhook/send", async (req, res) => {
  const parsed = SendWebhookBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid request body", details: parsed.error.issues });
    return;
  }

  const { webhookUrl, payload } = parsed.data;

  if (!webhookUrl.startsWith("https://discord.com/api/webhooks/")) {
    res.status(400).json({ error: "Invalid webhook URL. Must be a Discord webhook URL." });
    return;
  }

  const safePayload = { ...(payload as Record<string, unknown>) };

  const isCV2 = hasCV2Components(safePayload.components);

  if (isCV2) {
    // Components V2: must keep the IS_COMPONENTS_V2 flag (32768) and must NOT include embeds
    safePayload.flags = ((safePayload.flags as number | undefined) ?? 0) | 32768;
    delete safePayload.embeds;
    delete safePayload.content;
  } else {
    // Components V1 / Embeds: strip IS_COMPONENTS_V2 flag if accidentally set
    if (typeof safePayload.flags === "number") {
      const stripped = safePayload.flags & ~32768;
      if (stripped === 0) delete safePayload.flags;
      else safePayload.flags = stripped;
    }
  }

  // Validate payload is not empty
  const hasContent = typeof safePayload.content === "string" && safePayload.content.trim().length > 0;
  const hasEmbeds = Array.isArray(safePayload.embeds) && safePayload.embeds.length > 0;
  const hasComponents = Array.isArray(safePayload.components) && safePayload.components.length > 0;

  if (!hasContent && !hasEmbeds && !hasComponents) {
    res.json({
      success: false,
      message: "Payload is empty — add content, embeds, or components before sending.",
    });
    return;
  }

  // Append ?wait=true so Discord returns the created message (gives us real error details)
  const sendUrl = webhookUrl.includes("?")
    ? webhookUrl.replace(/(\?|$)/, "?wait=true&")
    : `${webhookUrl}?wait=true`;

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
        const json = JSON.parse(text) as { message?: string; code?: number; errors?: unknown };
        if (json.message) friendlyMessage = `Discord error: ${json.message}`;
        if (json.code) friendlyMessage += ` (code ${json.code})`;
      } catch {
        if (text) friendlyMessage += `: ${text.slice(0, 200)}`;
      }
      req.log.warn({ status: response.status, body: text }, "Discord webhook rejected");
      res.json({ success: false, message: friendlyMessage });
      return;
    }

    res.json({ success: true, message: null });
  } catch (err) {
    req.log.error({ err }, "Failed to send webhook");
    res.status(500).json({ error: "Failed to send webhook — network error" });
  }
});

export default router;
