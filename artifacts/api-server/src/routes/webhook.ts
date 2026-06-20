import { Router } from "express";
import { SendWebhookBody } from "@workspace/api-zod";

const router = Router();

router.post("/v1/webhook/send", async (req, res) => {
  const parsed = SendWebhookBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid request body" });
    return;
  }

  const { webhookUrl, payload } = parsed.data;

  if (!webhookUrl.startsWith("https://discord.com/api/webhooks/")) {
    res.status(400).json({ error: "Invalid webhook URL. Must be a Discord webhook URL." });
    return;
  }

  // Standard Discord webhooks don't support the IS_COMPONENTS_V2 flag (32768).
  // Sending it causes a "Cannot send an empty message" error even when components
  // are present. Strip it so V1 embeds and action-row buttons keep working.
  const safePayload = { ...payload };
  if (typeof safePayload.flags === "number") {
    const stripped = safePayload.flags & ~32768;
    if (stripped === 0) delete safePayload.flags;
    else safePayload.flags = stripped;
  }

  try {
    const response = await fetch(webhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(safePayload),
    });

    if (!response.ok) {
      const text = await response.text();
      req.log.warn({ status: response.status, body: text }, "Discord webhook rejected");
      res.json({ success: false, message: `Discord returned ${response.status}: ${text}` });
      return;
    }

    res.json({ success: true, message: null });
  } catch (err) {
    req.log.error({ err }, "Failed to send webhook");
    res.status(500).json({ error: "Failed to send webhook" });
  }
});

export default router;
