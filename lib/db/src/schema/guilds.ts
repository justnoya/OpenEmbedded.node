// @ts-nocheck
import { pgTable, uuid, varchar, timestamp, unique } from "drizzle-orm/pg-core";
import { usersTable } from "./users";

export const userAuthorizedGuildsTable = pgTable(
  "user_authorized_guilds",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: varchar("user_id", { length: 32 })
      .notNull()
      .references(() => usersTable.discordId, { onDelete: "cascade" }),
    guildId: varchar("guild_id", { length: 32 }).notNull(),
    addedAt: timestamp("added_at").defaultNow().notNull(),
  },
  (table) => [unique("user_guild_unique").on(table.userId, table.guildId)],
);

export type UserAuthorizedGuild = typeof userAuthorizedGuildsTable.$inferSelect;
export type InsertUserAuthorizedGuild = typeof userAuthorizedGuildsTable.$inferInsert;
