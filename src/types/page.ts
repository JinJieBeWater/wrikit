import { pages } from "@/server/db/schema";
import { InferInsertModel, InferSelectModel } from "drizzle-orm";
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

// 定义图标类型
export const IconTypeArray = ["emoji", "lucide", "image"] as const;
export type IconTypeUnion = (typeof IconTypeArray)[number];

export const IconType = IconTypeArray.reduce(
  (acc, type) => {
    // @ts-expect-error 此处似乎ts无法推断出来
    acc[type] = type;
    return acc;
  },
  {} as { [K in IconTypeUnion]: K },
) as { readonly [K in IconTypeUnion]: K };

export const IconZod = z.object({
  type: z.enum(IconTypeArray).describe("图标类型"),
  value: z.string().describe("图标名称 或 图片地址"),
});

export type Icon = z.infer<typeof IconZod>;

export type Page = InferSelectModel<typeof pages>;

export type PageTree = Page & {
  child: PageTree[];
};

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

export const PageObjectTemplateZod = z.array(
  z.object({
    label: z.string(),
    type: z.enum(PageObjectItemTypeArray),
    order: z.number(),
  }),
);

export type PageObjectTemplate = z.infer<typeof PageObjectTemplateZod>;
