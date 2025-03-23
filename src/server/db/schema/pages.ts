import { relations } from "drizzle-orm";
import {
  pgEnum,
  integer,
  varchar,
  index,
  json,
  boolean,
  primaryKey,
  uuid,
} from "drizzle-orm/pg-core";
import { timestamps } from "../columns.helpers";
import { users } from "./users";
import { createTable } from "../tables.heplers";
import {
  type Icon,
  PageObjectItemTypeArray,
  type PageObjectJson,
  type PageObjectTemplate,
  PageTypeArray,
} from "@/types/page";

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

export const pagesToChildren = createTable(
  "page_to_children",
  {
    pageId: uuid("page_id").notNull(),
    childId: uuid("child_id").notNull(),
  },
  (ptc) => ({
    pageIdIdx: index("page_id_id_idx").on(ptc.pageId),
    childIdIdx: index("child_id_idx").on(ptc.childId),
  }),
);

export const pagesToChildrenRelations = relations(
  pagesToChildren,
  ({ one }) => ({
    page: one(pages, {
      fields: [pagesToChildren.pageId],
      references: [pages.id],
    }),
    child: one(pages, {
      fields: [pagesToChildren.childId],
      references: [pages.id],
    }),
  }),
);

export const pageObjectItemEnum = pgEnum(
  "page_object_item_ty",
  PageObjectItemTypeArray,
);

export const pageObjects = createTable("page_object", {
  id: uuid("id").primaryKey().defaultRandom(),
  pageId: uuid("page_id").notNull(),
  templateId: integer("template_id").notNull(),
  json: json("json").$type<PageObjectJson>().default([]),
});

export const pageObjectRelations = relations(pageObjects, ({ one }) => ({
  page: one(pages, {
    fields: [pageObjects.pageId],
    references: [pages.id],
  }),
  template: one(pageObjectTemplates, {
    fields: [pageObjects.templateId],
    references: [pageObjectTemplates.id],
  }),
}));

export const pageObjectTemplates = createTable("page_object_templates", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: varchar("name", { length: 256 }),
  template: json("template").$type<PageObjectTemplate>().default([]),
  isPrivate: boolean("is_private").default(true).notNull(),
  createdById: varchar("created_by", { length: 255 })
    .notNull()
    .references(() => users.id),
  ...timestamps,
});

export const pageObjectTemplateRelations = relations(
  pageObjectTemplates,
  ({ one }) => ({
    createdBy: one(users, {
      fields: [pageObjectTemplates.createdById],
      references: [users.id],
    }),
  }),
);
