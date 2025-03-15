import { relations } from "drizzle-orm";
import {
  pgEnum,
  integer,
  varchar,
  index,
  json,
  text,
} from "drizzle-orm/pg-core";
import { timestamps } from "../columns.helpers";
import { users } from "./users";
import { createTable } from "../tables.heplers";
import { z } from "zod";

export const PageTypeArray = ["md", "pure", "object", "iframe"] as const;

export type PageTypeUnion = (typeof PageTypeArray)[number];

export const PageType = PageTypeArray.reduce(
  (acc, type) => {
    // @ts-expect-error 此处似乎ts无法推断出来
    acc[type] = type;
    return acc;
  },
  {} as { [K in PageTypeUnion]: K },
) as { readonly [K in PageTypeUnion]: K };

export const pageEnum = pgEnum("page_ty", PageTypeArray);

export const pages = createTable("page", {
  id: integer("id").primaryKey().generatedByDefaultAsIdentity(),
  type: pageEnum("type").default("md").notNull(),
  name: varchar("name", { length: 256 }),
  content: text("content"),
  parentId: integer("parent_id"),
  createdById: varchar("created_by", { length: 255 })
    .notNull()
    .references(() => users.id),
  ...timestamps,
});

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

export const pagesToChildren = createTable(
  "page_to_children",
  {
    pageId: integer("page_id").notNull(),
    childId: integer("child_id").notNull(),
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

export const PageObjectItemTypeArray = [
  "text",
  "image",
  "video",
  "audio",
  "file",
  "link",
  "divider",
  "iframe",
  "reference",
] as const;

export type PageObjectItemTypeUnion = (typeof PageObjectItemTypeArray)[number];

export const PageObjectItemType = PageObjectItemTypeArray.reduce(
  (acc, type) => {
    // @ts-expect-error 此处似乎ts无法推断出来
    acc[type] = type;
    return acc;
  },
  {} as { [K in PageObjectItemTypeUnion]: K },
) as { readonly [K in PageObjectItemTypeUnion]: K };

export const pageObjectItemEnum = pgEnum(
  "page_object_item_ty",
  PageObjectItemTypeArray,
);

export const PageObjectItemZod = z.object({
  label: z.string().describe("标签"),
  type: z
    .enum(PageObjectItemTypeArray)
    .describe("类型" + PageObjectItemTypeArray.join("|")),
  order: z.number().describe("排序"),
  content: z.string().optional().describe("内容"),
});

export type PageObjectItem = z.infer<typeof PageObjectItemZod>;

export const PageObjectJsonZod = z.array(PageObjectItemZod);

export type PageObjectJson = z.infer<typeof PageObjectJsonZod>;

export const pageObjects = createTable("page_object", {
  id: integer("id").primaryKey().generatedByDefaultAsIdentity(),
  pageId: integer("page_id").notNull(),
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

export const PageObjectTemplateZod = z.array(
  z.object({
    label: z.string(),
    type: z.enum(PageObjectItemTypeArray),
    order: z.number(),
  }),
);

export type PageObjectTemplate = z.infer<typeof PageObjectTemplateZod>;

export const pageObjectTemplates = createTable("page_object_templates", {
  id: integer("id").primaryKey().generatedByDefaultAsIdentity(),
  name: varchar("name", { length: 256 }),
  template: json("template").$type<PageObjectTemplate>().default([]),
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
