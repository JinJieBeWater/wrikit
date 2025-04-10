import { pageOrders, pages, pagesPath } from "@/server/db/schema";
import { z } from "zod";
import { PageTypeArray } from "@/types/page";
import type { Context, DB } from ".";
import { eq } from "drizzle-orm";

export const createPageZod = z.object({
	id: z.string().optional().describe("页面id"),
	type: z.enum(PageTypeArray).describe("页面类型"),
	name: z.string().optional().describe("页面名称"),
	content: z.string().optional().describe("页面内容"),
	parentId: z.string().optional().describe("父页面id"),
});

export const createPageWithPagePath = async (
	ctx: Context,
	input: z.infer<typeof createPageZod>,
) => {
	return await ctx.db.transaction(async (trx) => {
		const id = input.id ?? crypto.randomUUID();
		const promises = [];

		const newPage = {
			...input,
			id,
			createdById: ctx.session.user.id,
		};

		// 创建页面
		promises.push(trx.insert(pages).values(newPage));

		/* 页面路径 */
		// 插入自引用路径
		promises.push(
			trx.insert(pagesPath).values({
				ancestor: id,
				descendant: id,
				depth: 0,
			}),
		);

		const parentId = input.parentId;
		if (parentId) {
			// 获取父页面在当前闭包表中作为子节点的所有路径记录 将depth+1后为当前节点插入路径
			const addPath = async ({
				parentId,
				id,
			}: { parentId: string; id: string }) => {
				const parentPaths = await trx.query.pagesPath.findMany({
					where: (fields, operators) => {
						return operators.and(
							// 查找父页面的所有路径
							operators.eq(fields.descendant, parentId),
						);
					},
				});

				await trx.insert(pagesPath).values(
					parentPaths.map((path) => ({
						ancestor: path.ancestor,
						descendant: id,
						depth: path.depth + 1,
					})),
				);
			};
			promises.push(addPath({ parentId, id }));

			// 插入页面排序记录
			const addOrder = async ({
				parentId,
				id,
			}: { parentId: string; id: string }) => {
				const orders = await trx.query.pageOrders.findFirst({
					where: (fields, operators) => {
						return operators.and(operators.eq(fields.parentId, parentId));
					},
				});
				if (!orders) {
					await trx.insert(pageOrders).values({
						parentId,
						orderedIds: [id],
					});
				} else {
					await trx
						.update(pageOrders)
						.set({
							orderedIds: orders.orderedIds.concat(id),
						})
						.where(eq(pageOrders.parentId, parentId));
				}
			};
			promises.push(addOrder({ parentId, id }));
		}
		await Promise.all(promises);

		return newPage;
	});
};

/**
 * 获取所有相关页面
 */
export const getAllRelatedPages = async (db: DB, rootId: string | string[]) => {
	const ids = Array.isArray(rootId) ? rootId : [rootId];
	const relatedPage = await db.query.pagesPath.findMany({
		where: (fields, operators) => {
			return operators.and(operators.inArray(fields.ancestor, ids));
		},
		columns: {
			descendant: true,
		},
	});
	const relatedPageIds = relatedPage.map((r) => r.descendant);
	return relatedPageIds;
};

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
