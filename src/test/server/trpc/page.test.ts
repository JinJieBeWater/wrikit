import { beforeAll, beforeEach, describe, expect, it } from "vitest";
import { testDB } from "@/test/setup";
import { pages } from "@/server/db/schema";
import { and, eq } from "drizzle-orm";
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

		it("当父页面从回收站恢复时，所有子页面应该同时恢复", async () => {
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

	describe.todo("排序", () => {
		it.todo("当创建页面时，应该自动添加到父页面的排序中", async () => {});

		it.todo("当删除页面时，应该自动从父页面的排序中删除", async () => {});

		it.todo("当对页面进行排序时，应该更新父页面的排序列表", async () => {});

		it.todo(
			"当移动页面时，应该自动从原父页面的排序中删除，并添加到新父页面的排序中",
			async () => {},
		);
	});
});
