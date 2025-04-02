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
    isPrivate: boolean("is_private").default(true).notNull(),
    order: integer("order").default(0).notNull(),
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

export const pagesPath = createTable(
  "page_path",
  {
    parentId: uuid("parent_id").notNull(),
    pageId: uuid("page_id").notNull(),
    depth: integer("depth").default(0).notNull(),
    order: integer("order").default(0).notNull(),
  },
  (table) => ({
    pk: primaryKey({ columns: [table.parentId, table.pageId] }),
    parentIdIdx: index("page_path_parent_id_idx").on(table.parentId),
  }),
);

export const pagesPathRelations = relations(pagesPath, ({ one }) => ({
  page: one(pages, {
    fields: [pagesPath.pageId],
    references: [pages.id],
  }),
  parent: one(pages, {
    fields: [pagesPath.parentId],
    references: [pages.id],
  }),
}));

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
