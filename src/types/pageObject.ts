import { z } from "zod";

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
