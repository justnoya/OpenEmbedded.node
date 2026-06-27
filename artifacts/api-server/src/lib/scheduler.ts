// @ts-nocheck
/// <reference lib="dom" />
import * as cron from "node-cron";
import { db } from "@workspace/db";
import { scheduledJobsTable } from "@workspace/db";
import { eq, and } from "drizzle-orm";
import { logger } from "./logger";

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

const WEBHOOK_RE =
  /^https:\/\/discord\.com\/api\/webhooks\/\d{17,20}\/[A-Za-z0-9_-]{60,}$/;

async function executeJob(id: string): Promise<void> {
  const rows = await db
    .select()
    .from(scheduledJobsTable)
    .where(eq(scheduledJobsTable.id, id))
    .limit(1);

  const job = rows[0];
  if (!job || !job.active) return;

  const payload = { ...(job.payload as Record<string, unknown>) };
  const isCV2 = hasCV2Components(payload.components);
  if (isCV2) {
    payload.flags = ((payload.flags as number | undefined) ?? 0) | 32768;
    delete payload.embeds;
    delete payload.content;
  }

  let success = false;
  let errorMsg = "";

  if (job.webhookUrl) {
    const cleaned = job.webhookUrl.split("?")[0];
    if (!WEBHOOK_RE.test(cleaned)) {
      logger.warn({ id }, "Scheduled job has invalid webhook URL — skipping");
      return;
    }

    try {
      const res = await fetch(`${cleaned}?wait=true`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      success = res.ok;
      if (!res.ok) {
        const text = await res.text();
        errorMsg = `HTTP ${res.status}: ${text.slice(0, 200)}`;
      }
    } catch (err) {
      errorMsg = (err as Error).message;
    }
  } else if (job.botToken && job.channelId) {
    const BOT_TOKEN_RE = /^[A-Za-z0-9_-]{20,}\.[A-Za-z0-9_-]{6,}\.[A-Za-z0-9_-]{20,}$/;
    if (!BOT_TOKEN_RE.test(job.botToken)) {
      logger.warn({ id }, "Scheduled job has invalid bot token — skipping");
      return;
    }

    try {
      const res = await fetch(
        `https://discord.com/api/v10/channels/${job.channelId}/messages`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bot ${job.botToken}`,
          },
          body: JSON.stringify(payload),
        },
      );
      success = res.ok;
      if (!res.ok) {
        const text = await res.text();
        errorMsg = `HTTP ${res.status}: ${text.slice(0, 200)}`;
      }
    } catch (err) {
      errorMsg = (err as Error).message;
    }
  } else {
    logger.warn({ id }, "Scheduled job has no delivery target — skipping");
    return;
  }

  const now = new Date();

  if (success) {
    logger.info({ id, label: job.label }, "Scheduled job executed successfully");
  } else {
    logger.warn({ id, label: job.label, errorMsg }, "Scheduled job execution failed");
  }

  const updates: Partial<typeof scheduledJobsTable.$inferInsert> = {
    lastRunAt: now,
    updatedAt: now,
  };

  if (job.scheduleType === "once") {
    updates.active = false;
    updates.nextRunAt = undefined;
  }

  await db
    .update(scheduledJobsTable)
    .set(updates)
    .where(eq(scheduledJobsTable.id, id));
}

const activeTasks = new Map<string, cron.ScheduledTask>();
const activeTimeouts = new Map<string, ReturnType<typeof setTimeout>>();

function stopJob(id: string) {
  const task = activeTasks.get(id);
  if (task) {
    task.stop();
    activeTasks.delete(id);
  }
  const timeout = activeTimeouts.get(id);
  if (timeout) {
    clearTimeout(timeout);
    activeTimeouts.delete(id);
  }
}

export function scheduleJob(
  id: string,
  type: string,
  cronExpression: string | null | undefined,
  runAt: Date | null | undefined,
): void {
  stopJob(id);

  if (type === "once" && runAt) {
    const delay = runAt.getTime() - Date.now();
    if (delay <= 0) return;

    const timeout = setTimeout(() => {
      activeTimeouts.delete(id);
      executeJob(id).catch((err) => {
        logger.error({ err, id }, "One-time scheduled job failed");
      });
    }, delay);

    activeTimeouts.set(id, timeout);
    logger.info({ id, runAt }, "One-time job scheduled");
    return;
  }

  if (type === "cron" && cronExpression) {
    if (!cron.validate(cronExpression)) {
      logger.warn({ id, cronExpression }, "Invalid cron expression — not scheduling");
      return;
    }

    const task = cron.schedule(cronExpression, () => {
      executeJob(id).catch((err) => {
        logger.error({ err, id }, "Cron job execution failed");
      });
    });

    activeTasks.set(id, task);
    logger.info({ id, cronExpression }, "Cron job scheduled");
  }
}

export function unscheduleJob(id: string): void {
  stopJob(id);
}

export async function startScheduler(): Promise<void> {
  logger.info("Starting scheduler — loading active jobs from DB");

  const jobs = await db
    .select()
    .from(scheduledJobsTable)
    .where(and(eq(scheduledJobsTable.active, true)));

  for (const job of jobs) {
    scheduleJob(
      job.id,
      job.scheduleType,
      job.cronExpression,
      job.runAt,
    );
  }

  logger.info({ count: jobs.length }, "Scheduler started");
}
