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

const pageTypeArray = ["md", "pure", "item", "iframe"] as const;

export type PageTypeUnion = (typeof pageTypeArray)[number];

export const PageType = pageTypeArray.reduce(
  (acc, type) => {
    // @ts-expect-error 此处似乎ts无法推断出来
    acc[type] = type;
    return acc;
  },
  {} as { [K in PageTypeUnion]: K },
) as { readonly [K in PageTypeUnion]: K };

export const pageEnum = pgEnum("pageTy", pageTypeArray);

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

export type PageItem = {
  label: string;
  type: PageItemTypeUnion;
  order?: number;
  props: {
    content?: string;
    url?: string;
    alt?: string;
    referenceType?: PageTypeUnion;
    referenceId?: string;
  };
};

export const pageItems = createTable("page_items", {
  pageId: integer("page_id").notNull(),
  json: json("json").$type<PageItem[]>().default([]),
});

// export const itemTemplates = createTable('item_templates', {
