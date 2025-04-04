import { relations } from "drizzle-orm";
import { index, integer, primaryKey, uuid, varchar } from "drizzle-orm/pg-core";
import { createTable } from "../tables.heplers";
import { pages } from "./pages";
import { users } from "./users";

export const pagesPinned = createTable(
	"page_pinned",
	{
		userId: varchar("user_id", { length: 255 }).notNull(),
		pageId: uuid("page_id").notNull(),
		order: integer("pinned_order").default(0).notNull(),
	},
	(table) => ({
		pk: primaryKey({ columns: [table.userId, table.pageId] }),
		userIdIdx: index("page_user_id_idx").on(table.userId),
	}),
);

export const pagesPinnedRelations = relations(pagesPinned, ({ one }) => ({
	user: one(users, {
		fields: [pagesPinned.userId],
		references: [users.id],
	}),
	page: one(pages, {
		fields: [pagesPinned.pageId],
		references: [pages.id],
	}),
}));
