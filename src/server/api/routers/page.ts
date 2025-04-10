import { createTRPCRouter, protectedProcedure } from "@/server/api/trpc";
import { pages, pagesPath, pagesPinned } from "@/server/db/schema";
import { and, count, eq, gt, inArray, like, or } from "drizzle-orm";
import { z } from "zod";
import {
	createPageWithPagePath,
	createPageZod,
} from "../drizzle/createPageWithPagePath";
import {
	getPagePathByAncestor,
	getPagePathByAncestorZod,
	getPagePathByDescendant,
	getPagePathByDescendantZod,
} from "../drizzle/getPagePath";
import { getAllRelatedPages } from "../drizzle/getAllRelatedPages";

export const pageRouter = createTRPCRouter({
	get: protectedProcedure
		.input(
			z.object({
				id: z.string().describe("页面id"),
			}),
		)
		.query(async ({ ctx, input }) => {
			const page = await ctx.db.query.pages.findFirst({
				where(fields, operators) {
					return operators.and(operators.eq(fields.id, input.id));
				},
			});
			return page;
		}),

	getLatest: protectedProcedure
		.input(
			z
				.object({
					isDeleted: z.boolean().default(false).describe("是否删除"),
				})
				.default({
					isDeleted: false,
				}),
		)
		.query(async ({ ctx, input }) => {
			const page = await ctx.db.query.pages.findFirst({
				where(fields, operators) {
					return operators.and(
						operators.eq(fields.isDeleted, input.isDeleted),
						operators.eq(fields.createdById, ctx.session.user.id),
					);
				},
				orderBy: (posts, { desc }) => [desc(posts.updatedAt)],
			});
			return page;
		}),

	infinitePage: protectedProcedure
		.input(
			z.object({
				cursor: z
					.object({
						updatedAt: z.date(),
						id: z.string(),
					})
					.optional(),
				limit: z.number().default(10),
				isDeleted: z.boolean().default(false).describe("是否删除"),
				name: z.string().optional().describe("模糊查询条件"),
			}),
		)
		.query(async ({ ctx, input }) => {
			const infiniteData = await Promise.all([
				// 分页查询数据
				ctx.db.query.pages.findMany({
					where(fields, operators) {
						return operators.and(
							operators.eq(fields.createdById, ctx.session.user.id),
							operators.eq(fields.isDeleted, input.isDeleted),
							input.name
								? operators.like(fields.name, `%${input.name}%`)
								: undefined,
							input.cursor
								? operators.or(
										operators.lt(fields.updatedAt, input.cursor.updatedAt),
										operators.and(
											operators.eq(fields.updatedAt, input.cursor.updatedAt),
											operators.lt(fields.id, input.cursor.id),
										),
									)
								: undefined,
						);
					},
					limit: input.limit,
					columns: {
						id: true,
						name: true,
						type: true,
						icon: true,
						createdAt: true,
						updatedAt: true,
						parentId: true,
					},
					orderBy: (page, { desc }) => [desc(page.updatedAt), desc(page.id)],
				}),
				// 查询长度
				ctx.db
					.select({ count: count() })
					.from(pages)
					.where(
						and(
							eq(pages.createdById, ctx.session.user.id),
							eq(pages.isDeleted, input.isDeleted),
							input.name ? like(pages.name, `%${input.name}%`) : undefined,
						),
					),
			]);
			const [page, totalCount] = infiniteData;

			const lastPage = page.at(-1);
			const nextCursor = lastPage?.updatedAt
				? {
						updatedAt: lastPage.updatedAt,
						id: lastPage.id,
					}
				: null;

			return {
				items: page.map((item) => ({
					...item,
					isDeleted: input.isDeleted,
				})),
				meta: {
					totalRowCount: totalCount[0]?.count ?? 0,
					nextCursor: nextCursor,
				},
			};
		}),

	getByParentId: protectedProcedure
		.input(
			z.object({
				parentId: z.string().optional().describe("父页面id，不传则获取根页面"),
				isDeleted: z.boolean().default(false).describe("是否删除"),
			}),
		)
		.query(async ({ ctx, input }) => {
			const rootPages = await ctx.db.query.pages.findMany({
				where(fields, operators) {
					return operators.and(
						input.parentId === undefined
							? operators.isNull(fields.parentId)
							: operators.eq(fields.parentId, input.parentId),
						operators.eq(fields.isDeleted, input.isDeleted),
						operators.eq(fields.createdById, ctx.session.user.id),
					);
				},
				columns: {
					parentId: true,
					id: true,
					name: true,
					type: true,
					icon: true,
				},
				orderBy: (posts, { asc }) => [asc(posts.createdAt)],
			});
			return rootPages.map((page) => ({
				...page,
				isDeleted: input.isDeleted,
			}));
		}),

	create: protectedProcedure
		.meta({ description: "创建新页面" })
		.input(createPageZod)
		.mutation(async ({ ctx, input }) => {
			return await createPageWithPagePath(ctx, input);
		}),

	getPathByAncestor: protectedProcedure
		.meta({ description: "获取页面在当前闭包表中作为父节点的所有路径记录" })
		.input(getPagePathByAncestorZod)
		.query(async ({ ctx, input }) => {
			return await getPagePathByAncestor(ctx.db, input);
		}),

	getPathByDescendant: protectedProcedure
		.meta({ description: "获取页面在当前闭包表中作为子节点的所有路径记录" })
		.input(getPagePathByDescendantZod)
		.query(async ({ ctx, input }) => {
			return await getPagePathByDescendant(ctx.db, input);
		}),

	update: protectedProcedure
		.input(
			z.object({
				id: z.string().describe("页面id"),
				name: z.string().optional().describe("页面名称"),
				content: z.string().optional().describe("页面内容"),
			}),
		)
		.mutation(async ({ ctx, input }) => {
			await ctx.db
				.update(pages)
				.set({
					name: input.name,
					content: input.content,
				})
				.where(
					and(
						eq(pages.id, input.id),
						eq(pages.createdById, ctx.session.user.id),
					),
				);
		}),

	toggleTrash: protectedProcedure
		.input(
			z.object({
				id: z.string().describe("页面id"),
				isDeleted: z.boolean().describe("是否删除"),
				parentId: z.string().optional().describe("父页面id"),
			}),
		)
		.mutation(async ({ ctx, input }) => {
			await ctx.db.transaction(async (trx) => {
				// 批量更新页面状态
				const updatePages = async (pageIds: string[]) => {
					await trx
						.update(pages)
						.set({ isDeleted: input.isDeleted })
						.where(inArray(pages.id, pageIds));
				};

				// 批量删除pinned关系
				const deletePinned = async (pageIds: string[]) => {
					await trx
						.delete(pagesPinned)
						.where(inArray(pagesPinned.pageId, pageIds));
				};

				// 获取所有相关页面ID
				const relatedPageIds = await getAllRelatedPages(trx, input.id);

				// 更新所有相关页面
				const promises = [];
				promises.push(updatePages(relatedPageIds));

				// 如果是删除操作
				if (input.isDeleted) {
					// 需要删除pinned关系
					promises.push(deletePinned(relatedPageIds));
				}
				// 如果是还原操作
				if (!input.isDeleted) {
					// 如果父节点也在删除状态下 需要删除与父页面的关系
					const parentId = input.parentId;
					if (parentId) {
						const disconnectParent = async () => {
							const isParentDeleted = await trx.query.pages.findFirst({
								where(fields, operators) {
									return operators.and(
										operators.eq(fields.id, parentId),
										operators.eq(fields.isDeleted, true),
									);
								},
								columns: {
									id: true,
								},
							});
							// 断开联系
							if (isParentDeleted) {
								await trx
									.update(pages)
									.set({ parentId: null })
									.where(eq(pages.id, input.id));
							}
							// 删除所有与当前页面作为子节点的深度大于0的路径
							await trx
								.delete(pagesPath)
								.where(
									and(
										eq(pagesPath.descendant, input.id),
										gt(pagesPath.depth, 0),
									),
								);
						};
						promises.push(disconnectParent());
					}
				}
				await Promise.all(promises);
			});
		}),

	clearTrash: protectedProcedure.mutation(async ({ ctx }) => {
		// 删除所有已标记为删除的页面
		const pageIds = await ctx.db
			.delete(pages)
			.where(
				and(
					eq(pages.isDeleted, true),
					eq(pages.createdById, ctx.session.user.id),
				),
			)
			.returning({ id: pages.id });

		return { count: pageIds.length };
	}),

	delete: protectedProcedure
		.input(z.array(z.string()).describe("页面id数组"))
		.mutation(async ({ ctx, input }) => {
			return await ctx.db.transaction(async (trx) => {
				// 获取所有相关页面ID
				const relatedPageIds = await getAllRelatedPages(trx, input);

				// 删除所有相关页面
				const result = await trx
					.delete(pages)
					.where(inArray(pages.id, relatedPageIds))
					.returning({
						id: pages.id,
					});

				// 删除所有相关路径
				await trx
					.delete(pagesPath)
					.where(
						or(
							inArray(pagesPath.ancestor, relatedPageIds),
							inArray(pagesPath.descendant, relatedPageIds),
						),
					);

				return { count: result.length };
			});
		}),
});
