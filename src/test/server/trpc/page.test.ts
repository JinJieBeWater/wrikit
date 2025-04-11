import { beforeAll, beforeEach, describe, expect, it } from "vitest";
import { testDB } from "@/test/setup";
import { pageOrders, pages, pagesPath } from "@/server/db/schema";
import { and, eq, gt } from "drizzle-orm";
import { session } from "../../fake/user";
import { setupAuthorizedTrpc } from "../utils/setupTrpc";
import {
	PageL1C0,
	PageL2C0,
	cleanSeedPage,
	seedPage,
	PageL0C0,
} from "./utils/page";
import { getAllRelatedPages } from "@/server/api/drizzle/getAllRelatedPages";
import { PageType } from "@/types/page";
import { getPageOrder } from "@/server/api/drizzle/getPageOrder";

describe("Page 路由", async () => {
	let callerAuthorized: ReturnType<
		typeof setupAuthorizedTrpc
	>["callerAuthorized"];

	beforeAll(() => {
		callerAuthorized = setupAuthorizedTrpc({ session }).callerAuthorized;
	});

	beforeEach(async () => {
		await seedPage(callerAuthorized);
		return async () => {
			await cleanSeedPage(callerAuthorized);
		};
	});

	describe("创建", () => {
		it("当创建新页面时，应该成功保存并可以获取", async () => {
			const page = await callerAuthorized.page.create({
				name: "测试页面",
				type: PageType.md,
			});
			const get = await callerAuthorized.page.get({
				id: page.id,
			});
			expect(get?.name).toBe("测试页面");

			// 删除
			await callerAuthorized.page.delete([page.id]);
		});

		it("当创建页面使用无效的ID时，应该抛出错误", async () => {
			await expect(
				callerAuthorized.page.create({
					id: "invalid-id",
					type: PageType.md,
				}),
			).rejects.toThrow();
		});

		it("当创建页面使用无效的父页面ID时，应该抛出错误", async () => {
			await expect(
				callerAuthorized.page.create({
					parentId: "invalid-id",
					type: PageType.md,
				}),
			).rejects.toThrow();
		});
	});

	describe("查询", () => {
		it("当查询不存在的页面ID时，应该返回undefined", async () => {
			await expect(
				callerAuthorized.page.get({
					id: crypto.randomUUID(),
				}),
			).resolves.toBeUndefined();
		});

		it("当通过父页面ID查询页面时，应该返回所有子页面", async () => {
			const right = await testDB.query.pages.findMany({
				where(fields, operators) {
					return operators.and(operators.eq(fields.parentId, PageL0C0.id));
				},
			});

			const childs = await callerAuthorized.page.getByParentId({
				parentId: PageL0C0.id,
			});

			expect(childs.length).toBe(right.length);
		});

		it("当不传入父页面ID 直接查询页面时，应该返回所有根页面", async () => {
			const right = await testDB.query.pages.findMany({
				where(fields, operators) {
					return operators.and(operators.isNull(fields.parentId));
				},
			});

			const roots = await callerAuthorized.page.getByParentId({});

			expect(roots.length).toBe(right.length);
		});
	});

	describe("更新", () => {
		it("当更新页面名称时，应该成功保存新名称", async () => {
			const updateName = "测试页面更新";
			await callerAuthorized.page.update({
				id: PageL0C0.id,
				name: updateName,
			});

			const pageAfterUpdate = await callerAuthorized.page.get({
				id: PageL0C0.id,
			});

			expect(pageAfterUpdate?.name).toBe(updateName);
		});

		it("当更新页面内容时，应该成功保存新内容", async () => {
			const updateContent = "测试页面更新";
			await callerAuthorized.page.update({
				id: PageL0C0.id,
				content: updateContent,
			});

			const pageAfterUpdate = await callerAuthorized.page.get({
				id: PageL0C0.id,
			});

			expect(pageAfterUpdate?.content).toBe(updateContent);
		});
	});

	describe("删除", () => {
		it("当删除不存在的页面ID时，应该抛出错误", async () => {
			await expect(
				callerAuthorized.page.delete(["non-existent-id"]),
			).rejects.toThrow();
		});

		it("当批量删除多个页面时，应该全部成功删除", async () => {
			const deleteIds = [PageL1C0.id, PageL2C0.id];
			const result = await callerAuthorized.page.delete(deleteIds);
			expect(result.count).toBe(deleteIds.length);

			// 验证父页面仍然存在
			const rootPageAfterDelete = await callerAuthorized.page.get({
				id: PageL0C0.id,
			});
			expect(rootPageAfterDelete).toBeDefined();
		});

		it("当删除子页面时，不应影响父页面的存在", async () => {
			await callerAuthorized.page.delete([PageL1C0.id]);

			// 验证父页面仍然存在
			const parentPage = await callerAuthorized.page.get({
				id: PageL0C0.id,
			});
			expect(parentPage).toBeDefined();

			// 验证子页面已被删除
			const deletedPage = await callerAuthorized.page.get({
				id: PageL1C0.id,
			});
			expect(deletedPage).toBeUndefined();
		});
	});

	describe("回收", () => {
		it("当父页面被回收时，所有子页面应该同时被回收", async () => {
			const { relatedPageIds } = await getAllRelatedPages(testDB, PageL0C0.id);

			// 回收根节点
			await callerAuthorized.page.toggleTrash({
				id: PageL0C0.id,
				isDeleted: true,
			});

			const pagesInTrash = await testDB
				.select()
				.from(pages)
				.where(eq(pages.isDeleted, true));
			expect(pagesInTrash.length).toBe(relatedPageIds.length);

			const pagesNotInTrash = await testDB
				.select()
				.from(pages)
				.where(eq(pages.isDeleted, false));
			expect(pagesNotInTrash.length).toBe(0);
		});

		it("当父页面从回收站恢复时，所有子页面应该同时恢复", async () => {
			const { relatedPageIds } = await getAllRelatedPages(testDB, PageL0C0.id);

			// 回收根节点
			await callerAuthorized.page.toggleTrash({
				id: PageL0C0.id,
				isDeleted: true,
			});

			// 恢复根节点
			await callerAuthorized.page.toggleTrash({
				id: PageL0C0.id,
				isDeleted: false,
			});

			const pagesInTrash = await testDB
				.select()
				.from(pages)
				.where(eq(pages.isDeleted, true));
			expect(pagesInTrash.length).toBe(0);

			const pagesNotInTrash = await testDB
				.select()
				.from(pages)
				.where(eq(pages.isDeleted, false));
			expect(pagesNotInTrash.length).toBe(relatedPageIds.length);
		});

		it("当单独恢复1级子页面时，应该断开与父页面的联系并同时恢复其2级子页面", async () => {
			// 回收根节点
			await callerAuthorized.page.toggleTrash({
				id: PageL0C0.id,
				isDeleted: true,
			});

			// 恢复1级子页面
			await callerAuthorized.page.toggleTrash({
				id: PageL1C0.id,
				isDeleted: false,
			});

			// 根页面仍然处于回收状态
			await expect(
				testDB
					.select()
					.from(pages)
					.where(and(eq(pages.isDeleted, true), eq(pages.id, PageL0C0.id))),
			).resolves.toBeDefined();

			// 二级页面被恢复
			await expect(
				testDB
					.select()
					.from(pages)
					.where(and(eq(pages.isDeleted, false), eq(pages.id, PageL2C0.id))),
			).resolves.toBeDefined();
		});

		it("当清空回收站时，所有被回收的页面应该被永久删除", async () => {
			// 清空回收站
			await callerAuthorized.page.clearTrash();

			// 所有页面已被清空
			const pagesInTrash = await testDB
				.select()
				.from(pages)
				.where(eq(pages.isDeleted, true));
			expect(pagesInTrash.length).toBe(0);
		});

		it("当页面被回收时，应该删除其关联的pinned关系", async () => {
			// 添加pinned关系
			await callerAuthorized.pagePinned.create({
				pageId: PageL0C0.id,
				order: 0,
			});

			// 回收根节点
			await callerAuthorized.page.toggleTrash({
				id: PageL0C0.id,
				isDeleted: true,
			});

			// 验证pinned关系已被删除
			const pinneds = await callerAuthorized.pagePinned.get();
			expect(pinneds.length).toBe(0);
		});
	});

	describe("路径", () => {
		it("当删除根节点时，所有子节点及其路径应该被删除", async () => {
			// 删除根节点
			await callerAuthorized.page.delete([PageL0C0.id]);
			// 验证根节点
			const rootPageAfterDelete = await callerAuthorized.page.get({
				id: PageL0C0.id,
			});
			expect(rootPageAfterDelete).toBeUndefined();
			// 验证子节点
			const child1PageAfterDelete = await callerAuthorized.page.get({
				id: PageL1C0.id,
			});
			expect(child1PageAfterDelete).toBeUndefined();
			const child2PageAfterDelete = await callerAuthorized.page.get({
				id: PageL2C0.id,
			});
			expect(child2PageAfterDelete).toBeUndefined();

			// 验证路径已删除
			const rootPagePath = await callerAuthorized.page.getPathByAncestor({
				ancestor: PageL0C0.id,
			});
			expect(rootPagePath).toEqual([]);
			const child1PagePath = await callerAuthorized.page.getPathByAncestor({
				ancestor: PageL1C0.id,
			});
			expect(child1PagePath).toEqual([]);
			const child2PagePath = await callerAuthorized.page.getPathByAncestor({
				ancestor: PageL2C0.id,
			});
			expect(child2PagePath).toEqual([]);
		});

		it("当删除节点时，与该节点相关的所有路径应该被删除", async () => {
			await callerAuthorized.page.delete([PageL2C0.id]);

			await Promise.all([
				expect(
					callerAuthorized.page.getPathByAncestor({
						ancestor: PageL2C0.id,
					}),
				).resolves.toEqual([]),
				expect(
					callerAuthorized.page.getPathByDescendant({
						descendant: PageL2C0.id,
					}),
				).resolves.toEqual([]),
			]);
		});

		it("当删除节点时，不应影响与该节点无关的其他路径", async () => {
			const pre = await callerAuthorized.page.getPathByAncestor({
				ancestor: PageL1C0.id,
			});

			await callerAuthorized.page.delete([PageL2C0.id]);

			const after = await callerAuthorized.page.getPathByAncestor({
				ancestor: PageL1C0.id,
			});
			expect(after.length).toBe(pre.length - 1);
		});
	});

	describe("排序", () => {
		it("当创建页面时，应该自动添加到父页面的排序中", async () => {
			const childs = await testDB
				.select()
				.from(pages)
				.where(eq(pages.parentId, PageL0C0.id));

			const orders = await getPageOrder(testDB, { parentId: PageL0C0.id });

			expect(orders?.length).toBe(childs.length);

			childs.forEach((c) => {
				expect(orders).toContain(c.id);
			});
		});

		it("当创建根页面时，应该添加到根路径排序中", async () => {
			const preRootOrder = await testDB.query.pageOrders.findFirst({
				where(fields, operators) {
					return operators.isNull(fields.parentId);
				},
			});

			const pageCreated = await callerAuthorized.page.create({
				name: "测试页面",
				type: PageType.md,
			});

			const afterRootOrder = await testDB.query.pageOrders.findFirst({
				where(fields, operators) {
					return operators.isNull(fields.parentId);
				},
			});

			expect(afterRootOrder?.orderedIds).toEqual(
				preRootOrder?.orderedIds.concat(pageCreated.id),
			);

			// 清除数据
			await callerAuthorized.page.delete([pageCreated.id]);

			const data = await testDB.query.pages.findFirst({
				where(fields, operators) {
					return operators.eq(fields.id, pageCreated.id);
				},
			});

			expect(data).toBeUndefined();
		});

		it("当删除页面时，应该自动从父页面的排序中删除", async () => {
			const childs = await testDB
				.select()
				.from(pages)
				.where(eq(pages.parentId, PageL0C0.id));

			for await (const [i, c] of childs.entries()) {
				await callerAuthorized.page.delete([c.id]);

				// 验证排序已删除
				const orders = await getPageOrder(testDB, { parentId: PageL0C0.id });

				// 排序长度减一
				expect(orders?.length ?? 0).toBe(childs.length - i - 1);

				// 排序中不包含已删除的页面
				expect(orders ?? []).not.toContain(c.id);
			}

			// 验证排序已删除
			const orders = await getPageOrder(testDB, { parentId: PageL0C0.id });
			expect(orders).toBeUndefined();
		});

		it("当删除父页面最后一个子页面时，应删除父页面的排序记录", async () => {
			// 创建一个测试父页面
			const parentPage = await callerAuthorized.page.create({
				name: "测试父页面",
				type: PageType.md,
			});

			// 创建一个子页面
			const childPage = await callerAuthorized.page.create({
				name: "测试子页面",
				type: PageType.md,
				parentId: parentPage.id,
			});

			// 验证排序记录已创建
			const orderBeforeDelete = await testDB.query.pageOrders.findFirst({
				where(fields, operators) {
					return operators.eq(fields.parentId, parentPage.id);
				},
			});
			expect(orderBeforeDelete).toBeDefined();
			expect(orderBeforeDelete?.orderedIds).toContain(childPage.id);

			// 删除子页面
			await callerAuthorized.page.delete([childPage.id]);

			// 验证排序记录已删除
			const orderAfterDelete = await testDB.query.pageOrders.findFirst({
				where(fields, operators) {
					return operators.eq(fields.parentId, parentPage.id);
				},
			});
			expect(orderAfterDelete).toBeUndefined();

			// 清理测试数据
			await callerAuthorized.page.delete([parentPage.id]);
		});

		it("当进行根页面查询时，得到的数据顺序应与排序一致", async () => {
			// 创建多个根页面
			const rootPage1 = await callerAuthorized.page.create({
				name: "测试根页面1",
				type: PageType.md,
			});
			const rootPage2 = await callerAuthorized.page.create({
				name: "测试根页面2",
				type: PageType.md,
			});
			const rootPage3 = await callerAuthorized.page.create({
				name: "测试根页面3",
				type: PageType.md,
			});

			// 获取根页面排序
			const rootOrder = await testDB.query.pageOrders.findFirst({
				where(fields, operators) {
					return operators.isNull(fields.parentId);
				},
			});
			expect(rootOrder).toBeDefined();

			// 获取根页面列表
			const rootPages = await callerAuthorized.page.getByParentId({});

			// 验证顺序一致
			const testPageIds = [rootPage1.id, rootPage2.id, rootPage3.id];
			const testPagesInResult = rootPages.filter((page) =>
				testPageIds.includes(page.id),
			);

			// 验证这些页面在结果中的顺序与排序表中的顺序一致
			if (rootOrder?.orderedIds) {
				for (let i = 0; i < testPagesInResult.length - 1; i++) {
					if (testPagesInResult[i]?.id && testPagesInResult[i + 1]?.id) {
						// 我们已经在上面的if条件中检查了这些值不为undefined
						const id1 = testPagesInResult[i]?.id as string;
						const id2 = testPagesInResult[i + 1]?.id as string;
						const currentIndex = rootOrder.orderedIds.indexOf(id1);
						const nextIndex = rootOrder.orderedIds.indexOf(id2);
						expect(currentIndex).toBeLessThan(nextIndex);
					}
				}
			}

			// 清理测试数据
			await callerAuthorized.page.delete([
				rootPage1.id,
				rootPage2.id,
				rootPage3.id,
			]);
		});

		it("当通过父页面查询时，得到的数据顺序应与排序一致", async () => {
			// 创建一个测试父页面
			const parentPage = await callerAuthorized.page.create({
				name: "测试父页面",
				type: PageType.md,
			});

			// 创建多个子页面
			await callerAuthorized.page.create({
				name: "测试子页面1",
				type: PageType.md,
				parentId: parentPage.id,
			});
			await callerAuthorized.page.create({
				name: "测试子页面2",
				type: PageType.md,
				parentId: parentPage.id,
			});
			await callerAuthorized.page.create({
				name: "测试子页面3",
				type: PageType.md,
				parentId: parentPage.id,
			});

			// 获取父页面下的排序
			const parentOrder = await testDB.query.pageOrders.findFirst({
				where(fields, operators) {
					return operators.eq(fields.parentId, parentPage.id);
				},
			});
			expect(parentOrder).toBeDefined();

			// 获取子页面列表
			const childPages = await callerAuthorized.page.getByParentId({
				parentId: parentPage.id,
			});

			// 验证顺序一致
			expect(childPages.length).toBe(3);
			expect(childPages.map((c) => c.id)).toEqual(parentOrder?.orderedIds);

			// 清理测试数据
			await callerAuthorized.page.delete([parentPage.id]);
		});

		it.todo("当对页面进行排序时，应该更新父页面的排序列表", async () => {
			// 创建一个测试父页面
			const parentPage = await callerAuthorized.page.create({
				name: "测试父页面",
				type: PageType.md,
			});

			// 创建多个子页面
			const childPage1 = await callerAuthorized.page.create({
				name: "测试子页面1",
				type: PageType.md,
				parentId: parentPage.id,
			});
			const childPage2 = await callerAuthorized.page.create({
				name: "测试子页面2",
				type: PageType.md,
				parentId: parentPage.id,
			});
			const childPage3 = await callerAuthorized.page.create({
				name: "测试子页面3",
				type: PageType.md,
				parentId: parentPage.id,
			});

			// 获取原始排序
			const originalOrder = await testDB.query.pageOrders.findFirst({
				where(fields, operators) {
					return operators.eq(fields.parentId, parentPage.id);
				},
			});
			expect(originalOrder).toBeDefined();
			expect(originalOrder?.orderedIds).toEqual([
				childPage1.id,
				childPage2.id,
				childPage3.id,
			]);

			// 手动更新排序（由于没有直接的排序API，我们直接操作数据库）
			const newOrder = [childPage3.id, childPage1.id, childPage2.id];
			await testDB
				.update(pageOrders)
				.set({ orderedIds: newOrder })
				.where(eq(pageOrders.parentId, parentPage.id));

			// 验证排序已更新
			const updatedOrder = await testDB.query.pageOrders.findFirst({
				where(fields, operators) {
					return operators.eq(fields.parentId, parentPage.id);
				},
			});
			expect(updatedOrder?.orderedIds).toEqual(newOrder);

			// 获取子页面列表，验证顺序已更新
			const childPages = await callerAuthorized.page.getByParentId({
				parentId: parentPage.id,
			});
			expect(childPages.map((p) => p.id)).toEqual(newOrder);

			// 清理测试数据
			await callerAuthorized.page.delete([parentPage.id]);
		});

		it.todo(
			"当移动页面时，应该自动从原父页面的排序中删除，并添加到新父页面的排序中",
			async () => {
				// 创建两个父页面
				const parentPage1 = await callerAuthorized.page.create({
					name: "测试父页面1",
					type: PageType.md,
				});
				const parentPage2 = await callerAuthorized.page.create({
					name: "测试父页面2",
					type: PageType.md,
				});

				// 在父页面1下创建子页面
				const childPage = await callerAuthorized.page.create({
					name: "测试子页面",
					type: PageType.md,
					parentId: parentPage1.id,
				});

				// 验证父页面1的排序包含子页面
				const originalOrder = await testDB.query.pageOrders.findFirst({
					where(fields, operators) {
						return operators.eq(fields.parentId, parentPage1.id);
					},
				});
				expect(originalOrder?.orderedIds).toContain(childPage.id);

				// 移动子页面到父页面2（通过更新页面的parentId）
				await testDB
					.update(pages)
					.set({ parentId: parentPage2.id })
					.where(eq(pages.id, childPage.id));

				// 更新路径关系
				// 1. 删除旧路径
				await testDB
					.delete(pagesPath)
					.where(
						and(eq(pagesPath.descendant, childPage.id), gt(pagesPath.depth, 0)),
					);

				// 2. 添加新路径
				const parentPaths = await testDB.query.pagesPath.findMany({
					where(fields, operators) {
						return operators.eq(fields.descendant, parentPage2.id);
					},
				});

				await testDB.insert(pagesPath).values(
					parentPaths.map((path) => ({
						ancestor: path.ancestor,
						descendant: childPage.id,
						depth: path.depth + 1,
					})),
				);

				// 3. 从原父页面排序中删除
				const parent1Order = await testDB.query.pageOrders.findFirst({
					where(fields, operators) {
						return operators.eq(fields.parentId, parentPage1.id);
					},
				});

				if (parent1Order) {
					const newOrderedIds = parent1Order.orderedIds.filter(
						(id) => id !== childPage.id,
					);

					if (newOrderedIds.length === 0) {
						await testDB
							.delete(pageOrders)
							.where(eq(pageOrders.parentId, parentPage1.id));
					} else {
						await testDB
							.update(pageOrders)
							.set({ orderedIds: newOrderedIds })
							.where(eq(pageOrders.parentId, parentPage1.id));
					}
				}

				// 4. 添加到新父页面排序中
				const parent2Order = await testDB.query.pageOrders.findFirst({
					where(fields, operators) {
						return operators.eq(fields.parentId, parentPage2.id);
					},
				});

				if (parent2Order) {
					await testDB
						.update(pageOrders)
						.set({ orderedIds: [...parent2Order.orderedIds, childPage.id] })
						.where(eq(pageOrders.parentId, parentPage2.id));
				} else {
					await testDB.insert(pageOrders).values({
						parentId: parentPage2.id,
						orderedIds: [childPage.id],
					});
				}

				// 验证父页面1的排序不再包含子页面
				const updatedOrder1 = await testDB.query.pageOrders.findFirst({
					where(fields, operators) {
						return operators.eq(fields.parentId, parentPage1.id);
					},
				});
				expect(updatedOrder1?.orderedIds || []).not.toContain(childPage.id);

				// 验证父页面2的排序包含子页面
				const updatedOrder2 = await testDB.query.pageOrders.findFirst({
					where(fields, operators) {
						return operators.eq(fields.parentId, parentPage2.id);
					},
				});
				expect(updatedOrder2?.orderedIds || []).toContain(childPage.id);

				// 清理测试数据
				await callerAuthorized.page.delete([parentPage1.id, parentPage2.id]);
			},
		);
	});
});
