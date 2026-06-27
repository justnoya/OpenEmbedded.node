// @ts-nocheck
import {
  pgTable,
  uuid,
  varchar,
  text,
  boolean,
  timestamp,
  jsonb,
} from "drizzle-orm/pg-core";
import { usersTable } from "./users";

export const scheduledJobsTable = pgTable("scheduled_jobs", {
  id: uuid("id").defaultRandom().primaryKey(),
  ownerId: varchar("owner_id", { length: 32 }).references(
    () => usersTable.discordId,
    { onDelete: "cascade" },
  ),
  label: varchar("label", { length: 255 }).notNull().default("Scheduled Message"),
  scheduleType: varchar("schedule_type", { length: 10 }).notNull().default("cron"),
  cronExpression: varchar("cron_expression", { length: 100 }),
  runAt: timestamp("run_at"),
  webhookUrl: text("webhook_url"),
  channelId: varchar("channel_id", { length: 32 }),
  botToken: text("bot_token"),
  payload: jsonb("payload").notNull().$type<Record<string, unknown>>(),
  active: boolean("active").notNull().default(true),
  lastRunAt: timestamp("last_run_at"),
  nextRunAt: timestamp("next_run_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export type ScheduledJob = typeof scheduledJobsTable.$inferSelect;
export type InsertScheduledJob = typeof scheduledJobsTable.$inferInsert;
