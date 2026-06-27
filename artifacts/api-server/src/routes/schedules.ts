// @ts-nocheck
/// <reference lib="dom" />
import { Router } from "express";
import { z } from "zod";
import { db } from "@workspace/db";
import { scheduledJobsTable } from "@workspace/db";
import { eq, desc } from "drizzle-orm";
import { scheduleJob, unscheduleJob } from "../lib/scheduler";

const router = Router();

const WEBHOOK_RE =
  /^https:\/\/discord\.com\/api\/webhooks\/\d{17,20}\/[A-Za-z0-9_-]{60,}$/;
const BOT_TOKEN_RE =
  /^[A-Za-z0-9_-]{20,}\.[A-Za-z0-9_-]{6,}\.[A-Za-z0-9_-]{20,}$/;

const CV2_TYPES = new Set([9, 10, 11, 12, 14, 17]);
function hasCV2(comps: unknown): boolean {
  if (!Array.isArray(comps)) return false;
  for (const c of comps) {
    if (c && typeof c === "object") {
      const cc = c as Record<string, unknown>;
      if (CV2_TYPES.has(cc.type as number)) return true;
      if (hasCV2(cc.components)) return true;
    }
  }
  return false;
}

async function dispatchPayload(
  webhookUrl: string | null | undefined,
  botToken: string | null | undefined,
  channelId: string | null | undefined,
  rawPayload: Record<string, unknown>,
): Promise<{ success: boolean; error?: string }> {
  const payload = { ...rawPayload };
  if (hasCV2(payload.components)) {
    payload.flags = ((payload.flags as number | undefined) ?? 0) | 32768;
    delete payload.embeds;
    delete payload.content;
  }

  if (webhookUrl) {
    try {
      const r = await fetch(`${webhookUrl.split("?")[0]}?wait=true`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!r.ok) {
        const text = await r.text().catch(() => "");
        return { success: false, error: `HTTP ${r.status}: ${text.slice(0, 200)}` };
      }
      return { success: true };
    } catch (err) {
      return { success: false, error: (err as Error).message };
    }
  }

  if (botToken && channelId) {
    try {
      const r = await fetch(
        `https://discord.com/api/v10/channels/${channelId}/messages`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bot ${botToken}`,
          },
          body: JSON.stringify(payload),
        },
      );
      if (!r.ok) {
        const text = await r.text().catch(() => "");
        return { success: false, error: `HTTP ${r.status}: ${text.slice(0, 200)}` };
      }
      return { success: true };
    } catch (err) {
      return { success: false, error: (err as Error).message };
    }
  }

  return { success: false, error: "No delivery target configured" };
}

const CreateScheduleBody = z.object({
  label: z.string().min(1).max(255).default("Scheduled Message"),
  scheduleType: z.enum(["cron", "once"]).default("cron"),
  cronExpression: z.string().max(100).optional(),
  runAt: z.string().optional(),
  webhookUrl: z.string().optional(),
  channelId: z.string().max(32).optional(),
  botToken: z.string().optional(),
  payload: z.record(z.unknown()),
});

const UpdateScheduleBody = z.object({
  label: z.string().min(1).max(255).optional(),
  active: z.boolean().optional(),
  scheduleType: z.enum(["cron", "once"]).optional(),
  cronExpression: z.string().max(100).optional(),
  runAt: z.string().optional(),
  webhookUrl: z.string().optional(),
  channelId: z.string().max(32).optional(),
  botToken: z.string().optional(),
  payload: z.record(z.unknown()).optional(),
});

/* ── POST /v1/schedules ─────────────────────────────────────────────────── */
router.post("/v1/schedules", async (req, res) => {
  const parsed = CreateScheduleBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid request body" });
    return;
  }

  const data = parsed.data;

  if (data.webhookUrl) {
    const cleaned = data.webhookUrl.split("?")[0];
    if (!WEBHOOK_RE.test(cleaned)) {
      res.status(400).json({ error: "Invalid webhook URL" });
      return;
    }
  } else if (data.botToken && data.channelId) {
    if (!BOT_TOKEN_RE.test(data.botToken)) {
      res.status(400).json({ error: "Invalid bot token format" });
      return;
    }
  } else {
    res.status(400).json({ error: "Either webhookUrl or (botToken + channelId) is required" });
    return;
  }

  if (data.scheduleType === "cron" && !data.cronExpression) {
    res.status(400).json({ error: "cronExpression is required for schedule type 'cron'" });
    return;
  }
  if (data.scheduleType === "once" && !data.runAt) {
    res.status(400).json({ error: "runAt is required for schedule type 'once'" });
    return;
  }

  const session = (req as unknown as { session?: { userId?: string } }).session;
  const ownerId = session?.userId ?? null;
  const runAt = data.runAt ? new Date(data.runAt) : null;
  const nextRunAt = data.scheduleType === "once" ? runAt : null;

  const rows = await db.insert(scheduledJobsTable).values({
    ownerId,
    label: data.label,
    scheduleType: data.scheduleType,
    cronExpression: data.cronExpression ?? null,
    runAt,
    webhookUrl: data.webhookUrl ?? null,
    channelId: data.channelId ?? null,
    botToken: data.botToken ?? null,
    payload: data.payload as Record<string, unknown>,
    active: true,
    nextRunAt,
  }).returning();

  const job = rows[0];
  scheduleJob(job.id, job.scheduleType, job.cronExpression, job.runAt);

  res.status(201).json({
    id: job.id,
    label: job.label,
    scheduleType: job.scheduleType,
    cronExpression: job.cronExpression,
    runAt: job.runAt,
    active: job.active,
    lastRunAt: job.lastRunAt,
    nextRunAt: job.nextRunAt,
    createdAt: job.createdAt,
    updatedAt: job.updatedAt,
  });
});

/* ── GET /v1/schedules ─────────────────────────────────────────────────── */
router.get("/v1/schedules", async (req, res) => {
  const session = (req as unknown as { session?: { userId?: string } }).session;
  const ownerId = session?.userId ?? null;

  const jobs = ownerId
    ? await db
        .select({
          id: scheduledJobsTable.id,
          label: scheduledJobsTable.label,
          scheduleType: scheduledJobsTable.scheduleType,
          cronExpression: scheduledJobsTable.cronExpression,
          runAt: scheduledJobsTable.runAt,
          active: scheduledJobsTable.active,
          lastRunAt: scheduledJobsTable.lastRunAt,
          nextRunAt: scheduledJobsTable.nextRunAt,
          createdAt: scheduledJobsTable.createdAt,
          updatedAt: scheduledJobsTable.updatedAt,
        })
        .from(scheduledJobsTable)
        .where(eq(scheduledJobsTable.ownerId, ownerId))
        .orderBy(desc(scheduledJobsTable.createdAt))
    : [];

  res.json(jobs);
});

/* ── GET /v1/schedules/:id ─────────────────────────────────────────────── */
router.get("/v1/schedules/:id", async (req, res) => {
  const { id } = req.params;
  const rows = await db
    .select()
    .from(scheduledJobsTable)
    .where(eq(scheduledJobsTable.id, id))
    .limit(1);

  if (!rows[0]) {
    res.status(404).json({ error: "Schedule not found" });
    return;
  }

  const job = rows[0];
  res.json({
    id: job.id,
    label: job.label,
    scheduleType: job.scheduleType,
    cronExpression: job.cronExpression,
    runAt: job.runAt,
    active: job.active,
    lastRunAt: job.lastRunAt,
    nextRunAt: job.nextRunAt,
    createdAt: job.createdAt,
    updatedAt: job.updatedAt,
  });
});

/* ── PATCH /v1/schedules/:id ────────────────────────────────────────────── */
router.patch("/v1/schedules/:id", async (req, res) => {
  const { id } = req.params;
  const parsed = UpdateScheduleBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid request body" });
    return;
  }

  const existing = await db
    .select()
    .from(scheduledJobsTable)
    .where(eq(scheduledJobsTable.id, id))
    .limit(1);

  if (!existing[0]) {
    res.status(404).json({ error: "Schedule not found" });
    return;
  }

  const data = parsed.data;
  const updates: Partial<typeof scheduledJobsTable.$inferInsert> = { updatedAt: new Date() };

  if (data.label !== undefined) updates.label = data.label;
  if (data.active !== undefined) updates.active = data.active;
  if (data.scheduleType !== undefined) updates.scheduleType = data.scheduleType;
  if (data.cronExpression !== undefined) updates.cronExpression = data.cronExpression;
  if (data.runAt !== undefined) updates.runAt = new Date(data.runAt);
  if (data.webhookUrl !== undefined) updates.webhookUrl = data.webhookUrl;
  if (data.channelId !== undefined) updates.channelId = data.channelId;
  if (data.botToken !== undefined) updates.botToken = data.botToken;
  if (data.payload !== undefined) updates.payload = data.payload as Record<string, unknown>;

  const rows = await db
    .update(scheduledJobsTable)
    .set(updates)
    .where(eq(scheduledJobsTable.id, id))
    .returning();

  const updated = rows[0];

  if (updated.active) {
    scheduleJob(updated.id, updated.scheduleType, updated.cronExpression, updated.runAt);
  } else {
    unscheduleJob(updated.id);
  }

  res.json({
    id: updated.id,
    label: updated.label,
    scheduleType: updated.scheduleType,
    cronExpression: updated.cronExpression,
    runAt: updated.runAt,
    active: updated.active,
    lastRunAt: updated.lastRunAt,
    nextRunAt: updated.nextRunAt,
    createdAt: updated.createdAt,
    updatedAt: updated.updatedAt,
  });
});

/* ── DELETE /v1/schedules/:id ───────────────────────────────────────────── */
router.delete("/v1/schedules/:id", async (req, res) => {
  const { id } = req.params;
  const existing = await db
    .select({ id: scheduledJobsTable.id })
    .from(scheduledJobsTable)
    .where(eq(scheduledJobsTable.id, id))
    .limit(1);

  if (!existing[0]) {
    res.status(404).json({ error: "Schedule not found" });
    return;
  }

  unscheduleJob(id);
  await db.delete(scheduledJobsTable).where(eq(scheduledJobsTable.id, id));
  res.status(204).send();
});

/* ── POST /v1/schedules/:id/run ─────────────────────────────────────────── */
router.post("/v1/schedules/:id/run", async (req, res) => {
  const { id } = req.params;
  const rows = await db
    .select()
    .from(scheduledJobsTable)
    .where(eq(scheduledJobsTable.id, id))
    .limit(1);

  if (!rows[0]) {
    res.status(404).json({ error: "Schedule not found" });
    return;
  }

  const job = rows[0];
  const result = await dispatchPayload(
    job.webhookUrl,
    job.botToken,
    job.channelId,
    job.payload as Record<string, unknown>,
  );

  await db
    .update(scheduledJobsTable)
    .set({ lastRunAt: new Date(), updatedAt: new Date() })
    .where(eq(scheduledJobsTable.id, id));

  res.json({ success: result.success, message: result.error ?? null });
});

export default router;
