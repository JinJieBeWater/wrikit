import { relations } from "drizzle-orm";
import {
  pgEnum,
  integer,
  varchar,
  index,
  json,
  boolean,
  uuid,
  primaryKey,
  unique,
} from "drizzle-orm/pg-core";
import { timestamps } from "../columns.helpers";
import { users } from "./users";
import { createTable } from "../tables.heplers";
import { type Icon, PageTypeArray } from "@/types/page";

export const pageEnum = pgEnum("page_ty", PageTypeArray);

export const pages = createTable(
  "page",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    type: pageEnum("type").default("md").notNull(),
    name: varchar("name", { length: 256 }),
    content: json("content"),
    parentId: uuid("parent_id"),
    icon: json("icon").$type<Icon>(),
    isDeleted: boolean("is_deleted").default(false).notNull(),
    createdById: varchar("created_by", { length: 255 })
      .notNull()
      .references(() => users.id),
    ...timestamps,
  },
  (table) => ({
    parentIdIdx: index("page_parent_id_idx").on(table.parentId),
    createdByIdIdx: index("page_created_by_idx").on(table.createdById),
  }),
);

export const pagesRelations = relations(pages, ({ one }) => ({
  parent: one(pages, {
    fields: [pages.parentId],
    references: [pages.id],
  }),
  author: one(users, {
    fields: [pages.createdById],
    references: [users.id],
  }),
}));

export const pagesPath = createTable(
  "page_path",
  {
    ancestor: uuid("ancestor").notNull(),
    descendant: uuid("descendant").notNull(),
    depth: integer("depth").notNull(),
  },
  (table) => ({
    pk: primaryKey({ columns: [table.ancestor, table.descendant] }),
    ancestorIdx: index("page_path_ancestor_idx").on(table.ancestor),
    descendantIdx: index("page_path_descendant_idx").on(table.descendant),
  }),
);

export const pagesPathRelations = relations(pagesPath, ({ one }) => ({
  descendant: one(pages, {
    fields: [pagesPath.descendant],
    references: [pages.id],
  }),
  ancestor: one(pages, {
    fields: [pagesPath.ancestor],
    references: [pages.id],
  }),
}));

export const pageOrders = createTable(
  "page_order",
  {
    parentId: uuid("parent_id").notNull(),
    orderedIds: uuid("ordered_ids").array().notNull(),
  },
  (table) => ({
    parentIdIdx: unique("page_order_parent_id_idx").on(table.parentId),
  }),
);

export const pageOrdersRelations = relations(pageOrders, ({ one }) => ({
  parent: one(pages, {
    fields: [pageOrders.parentId],
    references: [pages.id],
  }),
}));
