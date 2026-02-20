import { sql } from "drizzle-orm";
import { index, pgTable, text, timestamp, uniqueIndex, uuid } from "drizzle-orm/pg-core";

export const users = pgTable(
  "users",
  {
    id: uuid().primaryKey().defaultRandom(),
    name: text(), // username; required at registration, may be null for legacy rows
    email: text().notNull(),
    emailVerified: timestamp({ withTimezone: false }),
    image: text(),
    role: text().notNull().default("user"),
    password: text(),
    createdAt: timestamp({ withTimezone: false }).notNull().default(sql`now()`),
    updatedAt: timestamp({ withTimezone: false })
      .notNull()
      .default(sql`now()`)
      .$onUpdate(() => new Date()),
    // [CODE_MARK users-table]
  },
  (table) => ({
    emailUnique: uniqueIndex("users_email_unique").on(table.email),
    nameIdx: index("users_name_idx").on(table.name),
  })
);

export type User = typeof users.$inferSelect;
export type UserInsert = typeof users.$inferInsert;
