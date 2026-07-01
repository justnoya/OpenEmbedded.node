// @ts-nocheck
import { pgTable, varchar, timestamp } from "drizzle-orm/pg-core";

export const usersTable = pgTable("discord_users", {
  discordId: varchar("discord_id", { length: 32 }).primaryKey(),
  username: varchar("username", { length: 64 }).notNull(),
  globalName: varchar("global_name", { length: 64 }),
  discriminator: varchar("discriminator", { length: 8 }).notNull().default("0"),
  avatar: varchar("avatar", { length: 256 }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  lastSeenAt: timestamp("last_seen_at").defaultNow().notNull(),
  // ── Moderation ───────────────────────────────────────────────────────────
  status: varchar("status", { length: 16 }).notNull().default("active"),
  suspendedUntil: timestamp("suspended_until"),
  suspensionReason: varchar("suspension_reason", { length: 512 }),
});

export type DiscordUserRecord = typeof usersTable.$inferSelect;
export type UserStatus = "active" | "suspended" | "banned";
