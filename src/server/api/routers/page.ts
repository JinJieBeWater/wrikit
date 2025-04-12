import { createTRPCRouter, protectedProcedure } from "@/server/api/trpc";
import { pageOrders, pages, pagesPath, pagesPinned } from "@/server/db/schema";
import { and, count, eq, gt, inArray, isNull, like, or } from "drizzle-orm";
import { z } from "zod";
import {
	getPagePathByAncestor,
	getPagePathByAncestorZod,
	getPagePathByDescendant,
	getPagePathByDescendantZod,
} from "../drizzle/getPagePath";
import { getAllRelatedPages } from "../drizzle/getAllRelatedPages";
import { shouldNeverHappen } from "@/lib/utils";
import { PageTypeArray } from "@/types/page";
import { TRPCError } from "@trpc/server";

export const createPageZod = z.object({
	id: z.string().optional().describe("页面id"),
	type: z.enum(PageTypeArray).describe("页面类型"),
	name: z.string().optional().describe("页面名称"),
	content: z.string().optional().describe("页面内容"),
	parentId: z.string().optional().describe("父页面id"),
});

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
							// 模糊查询 这可能造成强制的全表查询
							input.name
								? operators.like(fields.name, `%${input.name}%`)
								: undefined,
							// 游标分页
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
							// 模糊查询 这可能造成强制的全表查询
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
			let rootPages = await ctx.db.query.pages.findMany({
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
			});
			// 查询orders
			const parentId = input.parentId;
			const where =
				parentId !== undefined
					? eq(pageOrders.parentId, parentId)
					: isNull(pageOrders.parentId);
			const [order] = await ctx.db
				.select()
				.from(pageOrders)
				.where(where)
				.limit(1);
			const orderedIds = order?.orderedIds ?? shouldNeverHappen("必须有排序");

			// 根据排序重新排序
			rootPages = rootPages.sort((a, b) => {
				return orderedIds.indexOf(a.id) - orderedIds.indexOf(b.id);
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

				// 插入自引用路径
				promises.push(
					trx.insert(pagesPath).values({
						ancestor: id,
						descendant: id,
						depth: 0,
					}),
				);

				const parentId = input.parentId;

				// 插入路径
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
				}

				// 插入排序
				const where =
					parentId !== undefined
						? eq(pageOrders.parentId, parentId)
						: isNull(pageOrders.parentId);
				const addOrder = async () => {
					const [order] = await trx
						.select()
						.from(pageOrders)
						.where(where)
						.limit(1);
					if (!order) {
						await trx.insert(pageOrders).values({
							parentId: parentId ?? null,
							orderedIds: [id],
						});
					} else {
						await trx
							.update(pageOrders)
							.set({
								orderedIds: order.orderedIds.concat(id),
							})
							.where(where);
					}
				};
				promises.push(addOrder());
				await Promise.all(promises);

				return newPage;
			});
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
				const { relatedPageIds } = await getAllRelatedPages(trx, input.id);

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
				const { relatedPageIds } = await getAllRelatedPages(trx, input);

				const [result] = await Promise.all([
					// 删除所有相关页面
					trx
						.delete(pages)
						.where(inArray(pages.id, relatedPageIds))
						.returning({
							id: pages.id,
						}),
					// 删除所有相关路径
					trx
						.delete(pagesPath)
						.where(
							or(
								inArray(pagesPath.ancestor, relatedPageIds),
								inArray(pagesPath.descendant, relatedPageIds),
							),
						),
					// 删除在父页面中的排序
					...input.map(async (id) => {
						const path = await trx.query.pagesPath.findFirst({
							where(fields, operators) {
								return operators.and(
									operators.eq(fields.descendant, id),
									operators.eq(fields.depth, 1),
								);
							},
						});
						const where =
							path?.ancestor !== undefined
								? eq(pageOrders.parentId, path.ancestor)
								: isNull(pageOrders.parentId);
						const [orders] = await trx
							.select()
							.from(pageOrders)
							.where(where)
							.limit(1);

						if (!orders) return;

						const newOrders = orders.orderedIds.filter((item) => item !== id);

						if (newOrders.length === 0) {
							await trx.delete(pageOrders).where(where);
						} else {
							await trx
								.update(pageOrders)
								.set({ orderedIds: newOrders })
								.where(where);
						}
					}),
					// 删除相关页面的所有排序记录
					trx
						.delete(pageOrders)
						.where(inArray(pageOrders.parentId, relatedPageIds)),
				]);

				return { count: result.length };
			});
		}),

	securityUpdateOrder: protectedProcedure
		.meta({ description: "更新页面排序" })
		.input(
			z.object({
				parentId: z.string().optional().describe("父页面id"),
				orderedIds: z
					.array(z.string())
					.min(1, "数组不能为空")
					.refine((arr) => new Set(arr).size === arr.length, "数组元素必须唯一")
					.describe("排序后的页面id数组"),
			}),
		)
		.mutation(async ({ ctx, input }) => {
			await ctx.db.transaction(async (trx) => {
				// 常规更新排序
				const where =
					input.parentId !== undefined
						? eq(pageOrders.parentId, input.parentId)
						: isNull(pageOrders.parentId);
				const [order] = await trx
					.select()
					.from(pageOrders)
					.where(where)
					.limit(1);
				// 调整排序 无法删减
				// 校验是否合法 排序新后长度不可变
				if (order?.orderedIds.length !== input.orderedIds.length) {
					throw new TRPCError({
						code: "BAD_REQUEST",
						message: "排序先后长度不一致",
					});
				}
				await trx
					.insert(pageOrders)
					.values({
						parentId: input.parentId ?? null,
						orderedIds: input.orderedIds,
					})
					.onConflictDoUpdate({
						target: pageOrders.parentId,
						set: { orderedIds: input.orderedIds },
					});
			});
		}),

	transferAndOrder: protectedProcedure
		.meta({ description: "移动页面到新父页面并更新排序" })
		.input(
			z.object({
				pageId: z.string().describe("页面id"),
				oldParentId: z.string().optional().describe("旧父页面id"),
				newParentId: z.string().optional().describe("新父页面id"),
				orderedIds: z
					.array(z.string())
					.min(1, "数组不能为空")
					.refine((arr) => new Set(arr).size === arr.length, "数组元素必须唯一")
					.describe("排序后的页面id数组"),
			}),
		)
		.mutation(async ({ ctx, input }) => {
			return await ctx.db.transaction(async (trx) => {
				if (input.oldParentId === input.newParentId)
					throw new TRPCError({
						code: "BAD_REQUEST",
						message: "新旧父页面id相同 使用securityUpdateOrder+",
					});

				// 验证排序数组是否包含当前页面ID
				if (!input.orderedIds.includes(input.pageId)) {
					throw new TRPCError({
						code: "BAD_REQUEST",
						message: "排序数组必须包含当前页面ID",
					});
				}

				// 验证页面存在并属于当前用户
				const page = await trx.query.pages.findFirst({
					where(fields, operators) {
						return operators.and(
							operators.eq(fields.id, input.pageId),
							operators.eq(fields.createdById, ctx.session.user.id),
						);
					},
				});

				if (!page) {
					throw new TRPCError({
						code: "NOT_FOUND",
						message: "页面不存在",
					});
				}

				// 1. 更新页面的 parentId
				await trx
					.update(pages)
					.set({ parentId: input.newParentId })
					.where(eq(pages.id, input.pageId));

				// 2. 删除旧路径关系（保留深度为0的自引用路径）
				await trx
					.delete(pagesPath)
					.where(
						and(eq(pagesPath.descendant, input.pageId), gt(pagesPath.depth, 0)),
					);

				// 3. 添加新路径关系
				if (input.newParentId) {
					// 获取新父页面在当前闭包表中作为子节点的所有路径记录
					const parentPaths = await trx.query.pagesPath.findMany({
						where: (fields, operators) => {
							return operators.and(
								operators.eq(fields.descendant, input.newParentId as string),
							);
						},
					});

					// 为当前节点插入新路径
					await trx.insert(pagesPath).values(
						parentPaths.map((path) => ({
							ancestor: path.ancestor,
							descendant: input.pageId,
							depth: path.depth + 1,
						})),
					);
				}

				// 4. 从原父页面排序中删除
				// 根据 oldParentId 构建查询条件
				const oldWhere =
					input.oldParentId !== undefined
						? eq(pageOrders.parentId, input.oldParentId)
						: isNull(pageOrders.parentId);

				// 查询原排序
				const [oldOrder] = await trx
					.select()
					.from(pageOrders)
					.where(oldWhere)
					.limit(1);

				// 如果存在原排序，则删除当前页面ID
				if (oldOrder) {
					const newOrderedIds = oldOrder.orderedIds.filter(
						(id) => id !== input.pageId,
					);

					// 如果删除后排序为空，则删除整个排序记录
					// 否则更新排序
					if (newOrderedIds.length === 0) {
						await trx.delete(pageOrders).where(oldWhere);
					} else {
						await trx
							.update(pageOrders)
							.set({ orderedIds: newOrderedIds })
							.where(oldWhere);
					}
				}

				// 5. 添加到新父页面排序中并更新排序
				// 更新或插入新排序
				await trx
					.insert(pageOrders)
					.values({
						parentId: input.newParentId ?? null,
						orderedIds: input.orderedIds,
					})
					.onConflictDoUpdate({
						target: pageOrders.parentId,
						set: { orderedIds: input.orderedIds },
					});

				return { success: true };
			});
		}),
});
