import { sql } from "drizzle-orm";
import { timestamp } from "drizzle-orm/pg-core";

// columns.helpers.ts
export const timestamps = {
  createdAt: timestamp("created_at", { withTimezone: true })
    .default(sql`CURRENT_TIMESTAMP`)
    .notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).$onUpdate(
    () => new Date(),
  ),
};
