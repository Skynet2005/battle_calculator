import { sql } from "drizzle-orm";
import {
  boolean,
  index,
  jsonb,
  pgTable,
  text,
  timestamp,
  uuid
} from "drizzle-orm/pg-core";
import { users } from "./users";

export const profiles = pgTable(
  "profiles",
  {
    id: uuid().primaryKey().defaultRandom(),
    userId: uuid()
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    name: text().notNull(),
    payloadJson: jsonb().default(sql`null`),
    inputJson: jsonb().default(sql`null`),
    data: jsonb().notNull(),
    createdAt: timestamp({ withTimezone: false }).notNull().default(sql`now()`),
    updatedAt: timestamp({ withTimezone: false })
      .notNull()
      .default(sql`now()`)
      .$onUpdate(() => new Date()),
    deletedAt: timestamp({ withTimezone: false }).default(sql`null`),
    isPublic: boolean().notNull().default(false),
  },
  (table) => ({
    userIdx: index("profiles_user_idx").on(table.userId),
    updatedAtIdx: index("profiles_updated_at_idx").on(table.updatedAt),
    deletedAtIdx: index("profiles_deleted_at_idx").on(table.deletedAt),
  })
);

export type DbProfile = typeof profiles.$inferSelect;
export type DbProfileInsert = typeof profiles.$inferInsert;

