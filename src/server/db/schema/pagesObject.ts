import {
  PageObjectItemTypeArray,
  PageObjectJson,
  PageObjectTemplate,
} from "@/types/pageObject";
import { relations } from "drizzle-orm";
import {
  pgEnum,
  uuid,
  integer,
  varchar,
  json,
  boolean,
} from "drizzle-orm/pg-core";
import { timestamps } from "../columns.helpers";
import { createTable } from "../tables.heplers";
import { pages } from "./pages";
import { users } from "./users";

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
