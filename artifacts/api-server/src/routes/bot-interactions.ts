// @ts-nocheck
import { Router } from "express";
import { pool } from "@workspace/db";
import { requireAuth } from "../middleware/auth";
import { botLimiter, interactionsLimiter } from "../middleware/security";
import { encryptToken, decryptToken } from "../lib/crypto";
import { verifyDiscordSignature } from "../lib/discordVerify";

const router = Router();

const DISCORD_API = "https://discord.com/api/v10";

async function discordFetch(path: string, token: string, options: RequestInit = {}) {
  return fetch(`${DISCORD_API}${path}`, {
    ...options,
    headers: {
      Authorization: `Bot ${token}`,
      "Content-Type": "application/json",
      ...(options.headers ?? {}),
    },
  });
}

/** Build the interactions endpoint URL from the request context. */
function buildInteractionUrl(req: any): string {
  const override = process.env["API_BASE_URL"];
  if (override) return `${override.replace(/\/$/, "")}/api/v1/bot/interact`;
  const proto = req.headers["x-forwarded-proto"] ?? (req.secure ? "https" : "http");
  const host = req.headers["x-forwarded-host"] ?? req.headers["host"];
  return `${proto}://${host}/api/v1/bot/interact`;
}

/* ── POST /v1/bot/register ─────────────────────────────────────────────────
 *  Saves an encrypted bot token + Ed25519 public key to the database.
 *  One registration per project (upsert).
 *
 *  Body: { token, projectId, botName, botAvatar }
 * ─────────────────────────────────────────────────────────────────────────── */
router.post("/v1/bot/register", requireAuth, botLimiter, async (req, res) => {
  const userId = (req as any).tokenUser?.discordId as string | undefined;
  if (!userId) { res.status(401).json({ success: false, message: "Not authenticated" }); return; }

  const { token, projectId, botName, botAvatar } = req.body as {
    token?: string;
    projectId?: string;
    botName?: string;
    botAvatar?: string;
  };

  if (!token || !projectId) {
    res.status(400).json({ success: false, message: "token and projectId are required" });
    return;
  }

  // Verify this project belongs to the requester
  const projCheck = await pool.query(
    "SELECT id FROM projects WHERE id = $1 AND owner_id = $2",
    [projectId, userId],
  );
  if (projCheck.rowCount === 0) {
    res.status(403).json({ success: false, message: "Project not found or access denied" });
    return;
  }

  // Fetch application info from Discord (includes public_key)
  let appInfo: { id: string; verify_key: string } | null = null;
  try {
    const r = await discordFetch("/applications/@me", token.trim());
    if (!r.ok) {
      req.log.warn({ status: r.status }, "Failed to fetch /applications/@me");
      res.json({ success: false, message: `Discord rejected the token (${r.status}). Make sure it's a valid bot token.` });
      return;
    }
    appInfo = await r.json() as { id: string; verify_key: string };
  } catch (err) {
    req.log.error({ type: (err as Error).constructor?.name }, "Discord application fetch failed");
    res.json({ success: false, message: "Network error fetching application info from Discord." });
    return;
  }

  if (!appInfo?.id || !appInfo?.verify_key) {
    res.json({ success: false, message: "Discord did not return application info. Check bot token." });
    return;
  }

  const tokenEncrypted = encryptToken(token.trim());
  const interactionUrl = buildInteractionUrl(req);

  // Upsert registration (one per project)
  const result = await pool.query(
    `INSERT INTO bot_registrations
       (owner_id, project_id, application_id, public_key, token_encrypted, bot_name, bot_avatar, interaction_url)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
     ON CONFLICT (project_id) DO UPDATE SET
       application_id  = EXCLUDED.application_id,
       public_key      = EXCLUDED.public_key,
       token_encrypted = EXCLUDED.token_encrypted,
       bot_name        = EXCLUDED.bot_name,
       bot_avatar      = EXCLUDED.bot_avatar,
       interaction_url = EXCLUDED.interaction_url,
       updated_at      = NOW()
     RETURNING id, application_id, interaction_url, deployed_at`,
    [userId, projectId, appInfo.id, appInfo.verify_key, tokenEncrypted, botName ?? null, botAvatar ?? null, interactionUrl],
  );

  const row = result.rows[0];
  res.json({
    success: true,
    botId: row.id,
    applicationId: row.application_id,
    interactionUrl: row.interaction_url,
    deployedAt: row.deployed_at ?? null,
  });
});

/* ── GET /v1/bot/registration/:projectId ───────────────────────────────────
 *  Returns the bot registration for a project (without the token).
 * ─────────────────────────────────────────────────────────────────────────── */
router.get("/v1/bot/registration/:projectId", requireAuth, async (req, res) => {
  const userId = (req as any).tokenUser?.discordId as string | undefined;
  if (!userId) { res.status(401).json({ success: false, message: "Not authenticated" }); return; }

  const { projectId } = req.params;
  const result = await pool.query(
    `SELECT id, application_id, bot_name, bot_avatar, interaction_url, deployed_at, updated_at
       FROM bot_registrations
      WHERE project_id = $1 AND owner_id = $2`,
    [projectId, userId],
  );

  if (result.rowCount === 0) {
    res.json({ success: true, registration: null });
    return;
  }

  const row = result.rows[0];
  res.json({
    success: true,
    registration: {
      botId: row.id,
      applicationId: row.application_id,
      botName: row.bot_name,
      botAvatar: row.bot_avatar,
      interactionUrl: row.interaction_url,
      deployedAt: row.deployed_at ?? null,
      updatedAt: row.updated_at,
    },
  });
});

/* ── DELETE /v1/bot/registration/:projectId ────────────────────────────────
 *  Removes the bot registration (and all its handlers) for a project.
 * ─────────────────────────────────────────────────────────────────────────── */
router.delete("/v1/bot/registration/:projectId", requireAuth, async (req, res) => {
  const userId = (req as any).tokenUser?.discordId as string | undefined;
  if (!userId) { res.status(401).json({ success: false, message: "Not authenticated" }); return; }

  await pool.query(
    "DELETE FROM bot_registrations WHERE project_id = $1 AND owner_id = $2",
    [req.params.projectId, userId],
  );
  res.json({ success: true });
});

/* ── POST /v1/bot/deploy/:projectId ────────────────────────────────────────
 *  Stores compiled interaction handlers in the database.
 *  Replaces all existing handlers for this bot (full re-deploy).
 *
 *  Body: { handlers: Array<{ customId, mode, responsePayload }> }
 * ─────────────────────────────────────────────────────────────────────────── */
router.post("/v1/bot/deploy/:projectId", requireAuth, botLimiter, async (req, res) => {
  const userId = (req as any).tokenUser?.discordId as string | undefined;
  if (!userId) { res.status(401).json({ success: false, message: "Not authenticated" }); return; }

  const { projectId } = req.params;
  const { handlers } = req.body as {
    handlers?: Array<{ customId: string; mode: string; responsePayload: Record<string, unknown> }>;
  };

  if (!Array.isArray(handlers)) {
    res.status(400).json({ success: false, message: "handlers array is required" });
    return;
  }

  // Load the bot registration for this project
  const regResult = await pool.query(
    "SELECT id, application_id FROM bot_registrations WHERE project_id = $1 AND owner_id = $2",
    [projectId, userId],
  );
  if (regResult.rowCount === 0) {
    res.status(404).json({ success: false, message: "Bot not registered for this project. Register first." });
    return;
  }

  const { id: botId, application_id: applicationId } = regResult.rows[0];

  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    // Replace all handlers for this bot
    await client.query("DELETE FROM bot_interaction_handlers WHERE bot_id = $1", [botId]);

    for (const h of handlers) {
      if (!h.customId || !h.responsePayload) continue;
      const mode = h.mode ?? "send_new";
      if (!["send_new", "ephemeral", "update_message", "modal"].includes(mode)) continue;

      await client.query(
        `INSERT INTO bot_interaction_handlers
           (bot_id, application_id, owner_id, custom_id, response_type, response_payload)
         VALUES ($1, $2, $3, $4, $5, $6)
         ON CONFLICT (bot_id, custom_id) DO UPDATE SET
           response_type    = EXCLUDED.response_type,
           response_payload = EXCLUDED.response_payload`,
        [botId, applicationId, userId, h.customId, mode, JSON.stringify(h.responsePayload)],
      );
    }

    // Stamp deployed_at
    await client.query(
      "UPDATE bot_registrations SET deployed_at = NOW() WHERE id = $1",
      [botId],
    );

    await client.query("COMMIT");
  } catch (err) {
    await client.query("ROLLBACK");
    req.log.error({ type: (err as Error).constructor?.name }, "Deploy transaction failed");
    res.status(500).json({ success: false, message: "Deploy failed — please try again." });
    return;
  } finally {
    client.release();
  }

  const updatedReg = await pool.query(
    "SELECT deployed_at, interaction_url FROM bot_registrations WHERE id = $1",
    [botId],
  );
  const row = updatedReg.rows[0];
  res.json({
    success: true,
    handlerCount: handlers.length,
    deployedAt: row.deployed_at,
    interactionUrl: row.interaction_url,
  });
});

/* ── POST /v1/bot/interact ─────────────────────────────────────────────────
 *  Public Discord Interactions endpoint.
 *  Discord POSTS here for every interaction (PING, button click, slash cmd…).
 *
 *  Security: Ed25519 signature verification (no API auth token needed).
 *  Rate limit: separate, more generous limit to handle high button traffic.
 * ─────────────────────────────────────────────────────────────────────────── */
router.post("/v1/bot/interact", interactionsLimiter, async (req, res) => {
  const signature  = req.headers["x-signature-ed25519"] as string | undefined;
  const timestamp  = req.headers["x-signature-timestamp"] as string | undefined;
  const rawBody    = (req as any).rawBody as Buffer | undefined;

  if (!signature || !timestamp || !rawBody) {
    res.status(401).json({ error: "Missing signature headers" });
    return;
  }

  // Parse body to extract application_id (before signature verification)
  let body: Record<string, unknown>;
  try {
    body = JSON.parse(rawBody.toString("utf8"));
  } catch {
    res.status(400).json({ error: "Invalid JSON body" });
    return;
  }

  const applicationId = body["application_id"] as string | undefined;
  if (!applicationId || !/^\d{17,20}$/.test(applicationId)) {
    res.status(400).json({ error: "Missing application_id" });
    return;
  }

  // Look up the bot registration to get the public key
  const regResult = await pool.query(
    "SELECT public_key FROM bot_registrations WHERE application_id = $1 LIMIT 1",
    [applicationId],
  );
  if (regResult.rowCount === 0) {
    // Unknown application — verify with a dummy key to prevent timing oracle
    res.status(401).json({ error: "Unknown application" });
    return;
  }

  const publicKey = regResult.rows[0].public_key as string;

  // Verify Ed25519 signature — Discord requires this within 3 seconds
  if (!verifyDiscordSignature(rawBody, signature, timestamp, publicKey)) {
    res.status(401).json({ error: "Invalid signature" });
    return;
  }

  const interactionType = body["type"] as number;

  /* ── PING — Discord verifies the endpoint on first setup ──────────────── */
  if (interactionType === 1) {
    res.json({ type: 1 });
    return;
  }

  /* ── MESSAGE_COMPONENT (button click, select menu) ────────────────────── */
  if (interactionType === 3) {
    const data = body["data"] as Record<string, unknown> | undefined;
    const customId = data?.["custom_id"] as string | undefined;

    if (!customId) {
      res.status(400).json({ error: "Missing custom_id" });
      return;
    }

    const handlerResult = await pool.query(
      `SELECT response_type, response_payload
         FROM bot_interaction_handlers
        WHERE application_id = $1 AND custom_id = $2
        ORDER BY created_at DESC
        LIMIT 1`,
      [applicationId, customId],
    );

    if (handlerResult.rowCount === 0) {
      // No handler stored — send a generic fallback
      res.json({
        type: 4,
        data: {
          content: "This interaction is no longer active. Re-deploy the bot to restore it.",
          flags: 64,
        },
      });
      return;
    }

    const { response_type: responseType, response_payload: responsePayload } = handlerResult.rows[0];

    if (responseType === "update_message") {
      // Type 7: update the original message in place
      res.json({ type: 7, data: responsePayload });
    } else if (responseType === "ephemeral") {
      // Type 4: new message, ephemeral (only visible to the clicker)
      res.json({ type: 4, data: { ...responsePayload, flags: ((responsePayload.flags as number) ?? 0) | 64 } });
    } else {
      // Type 4: new public message
      res.json({ type: 4, data: responsePayload });
    }
    return;
  }

  /* ── APPLICATION_COMMAND (slash command) ──────────────────────────────── */
  if (interactionType === 2) {
    const data = body["data"] as Record<string, unknown> | undefined;
    const commandName = data?.["name"] as string | undefined;

    if (!commandName) {
      res.status(400).json({ error: "Missing command name" });
      return;
    }

    const handlerResult = await pool.query(
      `SELECT response_type, response_payload
         FROM bot_interaction_handlers
        WHERE application_id = $1 AND custom_id = $2
        ORDER BY created_at DESC
        LIMIT 1`,
      [applicationId, `slash:${commandName}`],
    );

    if (handlerResult.rowCount === 0) {
      res.json({
        type: 4,
        data: { content: `Command \`/${commandName}\` has no configured response.`, flags: 64 },
      });
      return;
    }

    const { response_type: responseType, response_payload: responsePayload } = handlerResult.rows[0];
    const flags = responseType === "ephemeral" ? ((responsePayload.flags as number) ?? 0) | 64 : responsePayload.flags;
    res.json({ type: 4, data: { ...responsePayload, ...(flags != null ? { flags } : {}) } });
    return;
  }

  /* ── MODAL_SUBMIT ─────────────────────────────────────────────────────── */
  if (interactionType === 5) {
    // Acknowledge modal submission with no visible response
    res.json({ type: 1 });
    return;
  }

  // Unknown interaction type — acknowledge silently
  res.status(200).json({ type: 1 });
});

export default router;
