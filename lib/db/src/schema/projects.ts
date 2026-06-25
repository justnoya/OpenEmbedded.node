import { pgTable, uuid, varchar, jsonb, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { usersTable } from "./users";

export const projectsTable = pgTable("projects", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  graph: jsonb("graph").notNull().$type<{ nodes: unknown[]; edges: unknown[] }>(),
  payload: jsonb("payload").$type<Record<string, unknown> | null>(),
  /* ── OWASP A01 — owner_id scopes every query to the authenticated user ── */
  ownerId: varchar("owner_id", { length: 32 }).references(() => usersTable.discordId, {
    onDelete: "cascade",
  }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const insertProjectSchema = createInsertSchema(projectsTable).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertProject = z.infer<typeof insertProjectSchema>;
export type Project = typeof projectsTable.$inferSelect;
