import { beforeAll, beforeEach, describe, expect, it } from "vitest";
import { testDB } from "@/test/setup";
import { pages, users } from "@/server/db/schema";
import { and, eq } from "drizzle-orm";
import { session, user } from "../../fake/user";
import { setupAuthorizedTrpc } from "../utils/setupTrpc";
import type { RouterOutputs } from "@/trpc/react";
import {
	child1Page,
	child2Page,
	cleanFakeData,
	createFakeData,
	rootPage,
} from "./utils/page";

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
	const ancestorPaths = await caller.page.getPathByAncestor({
		ancestor: pageId,
	});
	expect(ancestorPaths).toEqual(expectedAncestorPaths);

	const descendantPaths = await caller.page.getPathByDescendant({
		descendant: pageId,
	});
	expect(descendantPaths).toEqual(expectedDescendantPaths);
};

describe("Page 路由", async () => {
	beforeEach(async () => {
		const { callerAuthorized } = setupAuthorizedTrpc({ session });
		await createFakeData(callerAuthorized);
		return async () => {
			await cleanFakeData(callerAuthorized);
		};
	});
	describe("创建页面", () => {
		it("创建页面并验证路径完整性", async () => {
			const { callerAuthorized } = setupAuthorizedTrpc({ session });
			// 验证根页面路径
			await verifyPagePaths({
				caller: callerAuthorized,
				pageId: rootPage.id,
				expectedAncestorPaths: [
					{ ancestor: rootPage.id, descendant: rootPage.id, depth: 0 },
					{ ancestor: rootPage.id, descendant: child1Page.id, depth: 1 },
					{ ancestor: rootPage.id, descendant: child2Page.id, depth: 2 },
				],
				expectedDescendantPaths: [
					{ ancestor: rootPage.id, descendant: rootPage.id, depth: 0 },
				],
			});

			// 验证一级子页面路径
			await verifyPagePaths({
				caller: callerAuthorized,
				pageId: child1Page.id,
				expectedAncestorPaths: [
					{ ancestor: child1Page.id, descendant: child1Page.id, depth: 0 },
					{ ancestor: child1Page.id, descendant: child2Page.id, depth: 1 },
				],
				expectedDescendantPaths: [
					{ ancestor: child1Page.id, descendant: child1Page.id, depth: 0 },
					{ ancestor: rootPage.id, descendant: child1Page.id, depth: 1 },
				],
			});

			// 验证二级子页面路径
			await verifyPagePaths({
				caller: callerAuthorized,
				pageId: child2Page.id,
				expectedAncestorPaths: [
					{ ancestor: child2Page.id, descendant: child2Page.id, depth: 0 },
				],
				expectedDescendantPaths: [
					{ ancestor: child2Page.id, descendant: child2Page.id, depth: 0 },
					{ ancestor: child1Page.id, descendant: child2Page.id, depth: 1 },
					{ ancestor: rootPage.id, descendant: child2Page.id, depth: 2 },
				],
			});
		});

		it("创建页面使用无效的ID应该失效", async () => {
			const { callerAuthorized } = setupAuthorizedTrpc({ session });
			await expect(
				callerAuthorized.page.create({
					...rootPage,
					id: "invalid-id",
				}),
			).rejects.toThrow();
		});

		it("创建页面时使用无效的父页面ID应该失败", async () => {
			const { callerAuthorized } = setupAuthorizedTrpc({ session });

			await expect(
				callerAuthorized.page.create({
					...rootPage,
					parentId: "invalid-id",
				}),
			).rejects.toThrow();
		});
	});

	describe("更新页面", () => {
		it("更新页面名称", async () => {
			const updateName = "测试页面更新";
			const { callerAuthorized } = setupAuthorizedTrpc({ session });
			await callerAuthorized.page.update({
				id: rootPage.id,
				name: updateName,
			});

			const pageAfterUpdate = await callerAuthorized.page.get({
				id: rootPage.id,
			});

			expect(pageAfterUpdate?.name).toBe(updateName);
		});

		it("更新页面内容", async () => {
			const updateContent = "测试页面更新";
			const { callerAuthorized } = setupAuthorizedTrpc({ session });
			await callerAuthorized.page.update({
				id: rootPage.id,
				content: updateContent,
			});

			const pageAfterUpdate = await callerAuthorized.page.get({
				id: rootPage.id,
			});

			expect(pageAfterUpdate?.content).toBe(updateContent);
		});
	});

	describe("删除页面", () => {
		it("删除根节点 则所有子节点包含其路径应该被删除", async () => {
			const { callerAuthorized } = setupAuthorizedTrpc({ session });
			// 删除根节点
			await callerAuthorized.page.delete([rootPage.id]);
			// 验证根节点
			const rootPageAfterDelete = await callerAuthorized.page.get({
				id: rootPage.id,
			});
			expect(rootPageAfterDelete).toBeUndefined();
			// 验证子节点
			const child1PageAfterDelete = await callerAuthorized.page.get({
				id: child1Page.id,
			});
			expect(child1PageAfterDelete).toBeUndefined();
			const child2PageAfterDelete = await callerAuthorized.page.get({
				id: child2Page.id,
			});
			expect(child2PageAfterDelete).toBeUndefined();

			// 验证路径已删除
			const rootPagePath = await callerAuthorized.page.getPathByAncestor({
				ancestor: rootPage.id,
			});
			expect(rootPagePath).toEqual([]);
			const child1PagePath = await callerAuthorized.page.getPathByAncestor({
				ancestor: child1Page.id,
			});
			expect(child1PagePath).toEqual([]);
			const child2PagePath = await callerAuthorized.page.getPathByAncestor({
				ancestor: child2Page.id,
			});
			expect(child2PagePath).toEqual([]);
		});

		it("删除节点，则与节点相关的所有路径应该被删除", async () => {
			const { callerAuthorized } = setupAuthorizedTrpc({ session });
			// 删除child2节点
			await callerAuthorized.page.delete([child2Page.id]);

			const child2PageAncestor = await callerAuthorized.page.getPathByAncestor({
				ancestor: child2Page.id,
			});
			expect(child2PageAncestor).toEqual([]);

			const child2PageDescendant =
				await callerAuthorized.page.getPathByDescendant({
					descendant: child2Page.id,
				});
			expect(child2PageDescendant).toEqual([]);
		});

		it("删除节点，不应删除无关的其他路径", async () => {
			const { callerAuthorized } = setupAuthorizedTrpc({ session });
			// 删除child2节点
			await callerAuthorized.page.delete([child2Page.id]);

			const child1PageAncestor = await callerAuthorized.page.getPathByAncestor({
				ancestor: child1Page.id,
			});
			expect(child1PageAncestor.length).toBe(1);
		});

		it("删除不合法的页面ID应该抛出错误", async () => {
			const { callerAuthorized } = setupAuthorizedTrpc({ session });
			await expect(
				callerAuthorized.page.delete(["non-existent-id"]),
			).rejects.toThrow();
		});

		it("批量删除多个页面应该成功", async () => {
			const { callerAuthorized } = setupAuthorizedTrpc({ session });
			const result = await callerAuthorized.page.delete([
				child1Page.id,
				child2Page.id,
			]);
			expect(result.count).toBe(2);

			// 验证父页面仍然存在
			const rootPageAfterDelete = await callerAuthorized.page.get({
				id: rootPage.id,
			});
			expect(rootPageAfterDelete).toBeDefined();
		});

		it("删除子页面不应影响父页面", async () => {
			const { callerAuthorized } = setupAuthorizedTrpc({ session });
			await callerAuthorized.page.delete([child1Page.id]);

			// 验证父页面仍然存在
			const parentPage = await callerAuthorized.page.get({
				id: rootPage.id,
			});
			expect(parentPage).toBeDefined();

			// 验证子页面已被删除
			const deletedPage = await callerAuthorized.page.get({
				id: child1Page.id,
			});
			expect(deletedPage).toBeUndefined();
		});
	});

	describe("回收页面", () => {
		it("验证父页面回收后，子页面应该同时被回收", async () => {
			const { callerAuthorized } = setupAuthorizedTrpc({ session });
			// 回收根节点
			await callerAuthorized.page.toggleTrash({
				id: rootPage.id,
				isDeleted: true,
			});

			const pagesInTrash = await testDB
				.select()
				.from(pages)
				.where(eq(pages.isDeleted, true));
			expect(pagesInTrash.length).toBe(3);

			const pagesNotInTrash = await testDB
				.select()
				.from(pages)
				.where(eq(pages.isDeleted, false));
			expect(pagesNotInTrash.length).toBe(0);
		});

		it("恢复页面 验证父页面恢复后，子页面应该同时恢复", async () => {
			const { callerAuthorized } = setupAuthorizedTrpc({ session });
			// 回收根节点
			await callerAuthorized.page.toggleTrash({
				id: rootPage.id,
				isDeleted: true,
			});

			// 恢复根节点
			await callerAuthorized.page.toggleTrash({
				id: rootPage.id,
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
			expect(pagesNotInTrash.length).toBe(3);
		});

		it("单独恢复1级子页面，断开与父页面的联系，同时2级子页面也被恢复", async () => {
			const { callerAuthorized } = setupAuthorizedTrpc({ session });
			// 回收根节点
			await callerAuthorized.page.toggleTrash({
				id: rootPage.id,
				isDeleted: true,
			});

			// 恢复1级子页面
			await callerAuthorized.page.toggleTrash({
				id: child1Page.id,
				isDeleted: false,
			});

			// 根页面仍然处于回收状态
			await expect(
				testDB
					.select()
					.from(pages)
					.where(and(eq(pages.isDeleted, true), eq(pages.id, rootPage.id))),
			).resolves.toBeDefined();

			// 二级页面被恢复
			await expect(
				testDB
					.select()
					.from(pages)
					.where(and(eq(pages.isDeleted, false), eq(pages.id, child2Page.id))),
			).resolves.toBeDefined();
		});

		it("清空回收站 验证回收站中的所有页面已被清空", async () => {
			const { callerAuthorized } = setupAuthorizedTrpc({ session });
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
			const { callerAuthorized } = setupAuthorizedTrpc({ session });
			// 添加pinned关系
			await callerAuthorized.pagePinned.create({
				pageId: rootPage.id,
				order: 0,
			});

			// 回收根节点
			await callerAuthorized.page.toggleTrash({
				id: rootPage.id,
				isDeleted: true,
			});

			// 验证pinned关系已被删除
			const pinneds = await callerAuthorized.pagePinned.get();
			expect(pinneds.length).toBe(0);
		});
	});
});
