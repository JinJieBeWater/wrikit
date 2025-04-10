import { beforeAll, beforeEach, describe, expect, it } from "vitest";
import { testDB } from "@/test/setup";
import { pages } from "@/server/db/schema";
import { and, eq } from "drizzle-orm";
import { session } from "../../fake/user";
import { setupAuthorizedTrpc } from "../utils/setupTrpc";
import type { RouterOutputs } from "@/trpc/react";
import {
	PageL1C0,
	PageL2C0,
	cleanSeedPage,
	seedPage,
	PageL0C0,
} from "./utils/page";
import { getAllRelatedPages } from "@/server/api/drizzle/getAllRelatedPages";
import { PageType } from "@/types/page";

const verifyPagePaths = async ({
	caller,
	pageId,
	expectedAncestorPaths,
	expectedDescendantPaths,
}: {
	caller: ReturnType<typeof setupAuthorizedTrpc>["callerAuthorized"];
	pageId: string;
	expectedAncestorPaths: RouterOutputs["page"]["getPathByAncestor"];
	expectedDescendantPaths: RouterOutputs["page"]["getPathByDescendant"];
}) => {
	await Promise.all([
		expect(
			caller.page.getPathByAncestor({
				ancestor: pageId,
			}),
		).resolves.toEqual(expectedAncestorPaths),

		expect(
			caller.page.getPathByDescendant({
				descendant: pageId,
			}),
		).resolves.toEqual(expectedDescendantPaths),
	]);
};

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

	describe("创建页面", () => {
		it("创建页面并验证路径完整性", async () => {
			await Promise.all([
				// 验证根页面路径
				verifyPagePaths({
					caller: callerAuthorized,
					pageId: PageL0C0.id,
					expectedAncestorPaths: [
						{ ancestor: PageL0C0.id, descendant: PageL0C0.id, depth: 0 },
						{ ancestor: PageL0C0.id, descendant: PageL1C0.id, depth: 1 },
						{ ancestor: PageL0C0.id, descendant: PageL2C0.id, depth: 2 },
					],
					expectedDescendantPaths: [
						{ ancestor: PageL0C0.id, descendant: PageL0C0.id, depth: 0 },
					],
				}),
				// 验证一级子页面路径
				verifyPagePaths({
					caller: callerAuthorized,
					pageId: PageL1C0.id,
					expectedAncestorPaths: [
						{ ancestor: PageL1C0.id, descendant: PageL1C0.id, depth: 0 },
						{ ancestor: PageL1C0.id, descendant: PageL2C0.id, depth: 1 },
					],
					expectedDescendantPaths: [
						{ ancestor: PageL1C0.id, descendant: PageL1C0.id, depth: 0 },
						{ ancestor: PageL0C0.id, descendant: PageL1C0.id, depth: 1 },
					],
				}),

				// 验证二级子页面路径
				verifyPagePaths({
					caller: callerAuthorized,
					pageId: PageL2C0.id,
					expectedAncestorPaths: [
						{ ancestor: PageL2C0.id, descendant: PageL2C0.id, depth: 0 },
					],
					expectedDescendantPaths: [
						{ ancestor: PageL2C0.id, descendant: PageL2C0.id, depth: 0 },
						{ ancestor: PageL1C0.id, descendant: PageL2C0.id, depth: 1 },
						{ ancestor: PageL0C0.id, descendant: PageL2C0.id, depth: 2 },
					],
				}),
			]);
		});

		it("创建页面使用无效的ID应该失效", async () => {
			await expect(
				callerAuthorized.page.create({
					id: "invalid-id",
					type: PageType.md,
				}),
			).rejects.toThrow();
		});

		it("创建页面时使用无效的父页面ID应该失败", async () => {
			await expect(
				callerAuthorized.page.create({
					parentId: "invalid-id",
					type: PageType.md,
				}),
			).rejects.toThrow();
		});

		it.todo("创建页面并验证排序完整性", async () => {});
	});

	describe("更新页面", () => {
		it("更新页面名称", async () => {
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

		it("更新页面内容", async () => {
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

	describe("删除页面", () => {
		it("删除根节点 则所有子节点包含其路径应该被删除", async () => {
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

		it("删除节点，则与节点相关的所有路径应该被删除", async () => {
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

		it("删除节点，不应删除无关的其他路径", async () => {
			const pre = await callerAuthorized.page.getPathByAncestor({
				ancestor: PageL1C0.id,
			});

			await callerAuthorized.page.delete([PageL2C0.id]);

			const after = await callerAuthorized.page.getPathByAncestor({
				ancestor: PageL1C0.id,
			});
			expect(after.length).toBe(pre.length - 1);
		});

		it("删除不合法的页面ID应该抛出错误", async () => {
			await expect(
				callerAuthorized.page.delete(["non-existent-id"]),
			).rejects.toThrow();
		});

		it("批量删除多个页面应该成功", async () => {
			const deleteIds = [PageL1C0.id, PageL2C0.id];
			const result = await callerAuthorized.page.delete(deleteIds);
			expect(result.count).toBe(deleteIds.length);

			// 验证父页面仍然存在
			const rootPageAfterDelete = await callerAuthorized.page.get({
				id: PageL0C0.id,
			});
			expect(rootPageAfterDelete).toBeDefined();
		});

		it("删除子页面不应影响父页面", async () => {
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

	describe("回收页面", () => {
		it("验证父页面回收后，子页面应该同时被回收", async () => {
			const relatedPageIds = await getAllRelatedPages(testDB, PageL0C0.id);

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

		it("恢复页面 验证父页面恢复后，子页面应该同时恢复", async () => {
			const relatedPageIds = await getAllRelatedPages(testDB, PageL0C0.id);

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

		it("单独恢复1级子页面，断开与父页面的联系，同时2级子页面也被恢复", async () => {
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

		it("清空回收站 验证回收站中的所有页面已被清空", async () => {
			// 清空回收站
			await callerAuthorized.page.clearTrash();

			// 所有页面已被清空
			const pagesInTrash = await testDB
				.select()
				.from(pages)
				.where(eq(pages.isDeleted, true));
			expect(pagesInTrash.length).toBe(0);
		});

		it("回收页面 应该删除关联的pinned关系", async () => {
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
});
