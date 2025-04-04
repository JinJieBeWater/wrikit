import type { pages } from "@/server/db/schema";
import type { InferSelectModel } from "drizzle-orm";
import { z } from "zod";

export const PageTypeArray = ["md", "pure", "object", "iframe"] as const;

export type PageTypeUnion = (typeof PageTypeArray)[number];

export const PageType = PageTypeArray.reduce(
	(acc, type) => {
		// @ts-expect-error 此处似乎ts无法推断出来
		acc[type] = type;
		return acc;
	},
	{} as {
		[K in PageTypeUnion]: K;
	},
) as {
	readonly [K in PageTypeUnion]: K;
};

// 定义图标类型
export const IconTypeArray = ["emoji", "lucide", "image"] as const;
export type IconTypeUnion = (typeof IconTypeArray)[number];

export const IconType = IconTypeArray.reduce(
	(acc, type) => {
		// @ts-expect-error 此处似乎ts无法推断出来
		acc[type] = type;
		return acc;
	},
	{} as {
		[K in IconTypeUnion]: K;
	},
) as {
	readonly [K in IconTypeUnion]: K;
};

export const IconZod = z.object({
	type: z.enum(IconTypeArray).describe("图标类型"),
	value: z.string().describe("图标名称 或 图片地址"),
});

export type Icon = z.infer<typeof IconZod>;

export type Page = InferSelectModel<typeof pages>;

export type PageTree = Page & {
	child: PageTree[];
};
