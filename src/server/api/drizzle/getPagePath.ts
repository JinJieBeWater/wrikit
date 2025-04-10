import { z } from "zod";
import type { DB } from "./type";

export const getPagePathByAncestorZod = z.object({
	ancestor: z.string().describe("页面id"),
});
/**
 * 获取页面在当前闭包表中作为父节点的所有路径记录
 */

export const getPagePathByAncestor = async (
	db: DB,
	input: z.infer<typeof getPagePathByAncestorZod>,
) => {
	return await db.query.pagesPath.findMany({
		where: (fields, operators) => {
			return operators.and(operators.eq(fields.ancestor, input.ancestor));
		},
		orderBy: (fields, operators) => {
			return operators.asc(fields.depth);
		},
	});
};

export const getPagePathByDescendantZod = z.object({
	descendant: z.string().describe("页面id"),
});
/**
 * 获取页面在当前闭包表中作为子节点的所有路径记录
 */

export const getPagePathByDescendant = async (
	db: DB,
	input: z.infer<typeof getPagePathByDescendantZod>,
) => {
	return await db.query.pagesPath.findMany({
		where: (fields, operators) => {
			return operators.and(operators.eq(fields.descendant, input.descendant));
		},
		orderBy: (fields, operators) => {
			return operators.asc(fields.depth);
		},
	});
};
