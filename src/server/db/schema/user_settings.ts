import { sql } from "drizzle-orm";
import { pgTable, uuid, timestamp, uniqueIndex, text, integer } from "drizzle-orm/pg-core";
import { users } from "./users";
import { profiles } from "./profiles";

export const userSettings = pgTable(
  "user_settings",
  {
    userId: uuid()
      .primaryKey()
      .references(() => users.id, { onDelete: "cascade" }),
    currentProfileId: uuid().references(() => profiles.id, { onDelete: "set null" }),
    // Game user data (optional)
    gameRoleId: text(), // The role_id from the game
    gameId: text(), // Game ID (e.g., "20121")
    gameState: text(), // State number (e.g., "#862")
    gameFurnaceLevel: integer(), // Furnace level
    gameProfilePicture: text(), // URL to profile picture
    gameAuthToken: text(), // Auth token from game login
    createdAt: timestamp({ withTimezone: false }).notNull().default(sql`now()`),
    updatedAt: timestamp({ withTimezone: false }).notNull().default(sql`now()`),
  },
  (table) => ({
    userIdx: uniqueIndex("user_settings_user_unique").on(table.userId),
  })
);

export type UserSettings = typeof userSettings.$inferSelect;

