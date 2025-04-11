import { z } from "zod";
import type { DB } from "./type";
export const getPageOrderZod = z
	.object({
		parentId: z.string().describe("父页面id").optional(),
	})
	.optional();

/**
 * 获取父页面下子页面的排序列表
 */
export const getPageOrder = async (
	db: DB,
	input: z.infer<typeof getPageOrderZod>,
) => {
	const order = await db.query.pageOrders.findFirst({
		where: (fields, operators) => {
			return operators.and(
				input?.parentId !== undefined
					? operators.eq(fields.parentId, input.parentId)
					: operators.isNull(fields.parentId),
			);
		},
	});

	return order?.orderedIds;
};
