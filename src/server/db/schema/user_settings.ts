import { sql } from "drizzle-orm";
import { pgTable, uuid, timestamp, uniqueIndex } from "drizzle-orm/pg-core";
import { users } from "./users";
import { profiles } from "./profiles";

export const userSettings = pgTable(
  "user_settings",
  {
    userId: uuid()
      .primaryKey()
      .references(() => users.id, { onDelete: "cascade" }),
    currentProfileId: uuid().references(() => profiles.id, { onDelete: "set null" }),
    createdAt: timestamp({ withTimezone: false }).notNull().default(sql`now()`),
    updatedAt: timestamp({ withTimezone: false }).notNull().default(sql`now()`),
  },
  (table) => ({
    userIdx: uniqueIndex("user_settings_user_unique").on(table.userId),
  })
);

export type UserSettings = typeof userSettings.$inferSelect;

