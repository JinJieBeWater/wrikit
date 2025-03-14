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

export const PageTypeArray = ["md", "pure", "item", "iframe"] as const;

export type PageTypeUnion = (typeof PageTypeArray)[number];

export const PageType = PageTypeArray.reduce(
  (acc, type) => {
    // @ts-expect-error 此处似乎ts无法推断出来
    acc[type] = type;
    return acc;
  },
  {} as { [K in PageTypeUnion]: K },
) as { readonly [K in PageTypeUnion]: K };

export const pageEnum = pgEnum("pageTy", PageTypeArray);

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

export const PageItemTypeArray = [
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

export type PageItemTypeUnion = (typeof PageItemTypeArray)[number];

export const PageItemType = PageItemTypeArray.reduce(
  (acc, type) => {
    // @ts-expect-error 此处似乎ts无法推断出来
    acc[type] = type;
    return acc;
  },
  {} as { [K in PageItemTypeUnion]: K },
) as { readonly [K in PageItemTypeUnion]: K };

export const PageItemZod = z.object({
  label: z.string(),
  type: z.enum(PageItemTypeArray),
  order: z.number(),
  props: z.object({
    content: z.string().optional(),
    url: z.string().optional(),
    alt: z.string().optional(),
    referenceType: z.enum(PageTypeArray).optional(),
    referenceId: z.string().optional(),
  }),
});

export type PageItem = z.infer<typeof PageItemZod>;

export const pageItems = createTable("page_items", {
  pageId: integer("page_id").notNull(),
  json: json("json").$type<PageItem[]>().default([]),
});

export const PageItemTemplateZod = z.array(
  z.object({
    label: z.string(),
    type: z.enum(PageItemTypeArray),
    order: z.number(),
  }),
);

export type PageItemTemplate = z.infer<typeof PageItemTemplateZod>;

export const pageItemTemplates = createTable("page_item_templates", {
  id: integer("id").primaryKey().generatedByDefaultAsIdentity(),
  name: varchar("name", { length: 256 }),
  template: json("template").$type<PageItemTemplate>().default([]),
  createdById: varchar("created_by", { length: 255 })
    .notNull()
    .references(() => users.id),
  ...timestamps,
});
