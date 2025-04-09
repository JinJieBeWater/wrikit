import { beforeAll, describe, expect, it } from "vitest";
import { testDB } from "@/test/setup";
import { pages, users, type pagesPath } from "@/server/db/schema";
import { eq, type InferSelectModel } from "drizzle-orm";
import { session, user } from "../db/utils/page";
import { setupAuthorizedTrpc } from "../utils/setupTrpc";
import { PageType } from "@/types/page";
import type { RouterInputs, RouterOutputs } from "@/trpc/react";

beforeAll(async () => {
	await testDB.insert(users).values(user).returning();

	return async () => {
		await testDB.delete(pages).where(eq(pages.createdById, user.id));

		await testDB.select().from(pages).where(eq(pages.createdById, user.id));

		await testDB.delete(pages).where(eq(pages.createdById, user.id));

		await testDB.delete(users).where(eq(users.id, user.id));
	};
});

const rootPage = {
	id: "0e5a22c9-6574-4b93-948e-a5c70c3e4266",
	name: "测试页面",
	content: "测试页面内容",
	type: PageType.md,
} satisfies RouterInputs["page"]["create"];

const child1Page = {
	id: "13048de8-1564-41e1-b791-49040e3a089a",
	name: "测试子页面1",
	content: "测试子页面内容",
	type: PageType.md,
	parentId: rootPage.id,
} satisfies RouterInputs["page"]["create"];

const child2Page = {
	id: "e250576c-6f33-4ff6-80d1-16e9f2bab6bc",
	name: "测试子页面2",
	content: "测试子页面内容",
	type: PageType.md,
	parentId: child1Page.id,
} satisfies RouterInputs["page"]["create"];

const createFakeData = async (
	callerAuthorized: ReturnType<typeof setupAuthorizedTrpc>["callerAuthorized"],
) => {
	await callerAuthorized.page.create(rootPage);
	await callerAuthorized.page.create(child1Page);
	await callerAuthorized.page.create(child2Page);
};

const cleanFakeData = async (
	callerAuthorized: ReturnType<typeof setupAuthorizedTrpc>["callerAuthorized"],
) => {
	const result = await callerAuthorized.page.delete([
		rootPage.id,
		child1Page.id,
		child2Page.id,
	]);
	expect(result.count).toBe(3);
};

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
	describe("创建页面", () => {
		it("创建页面并验证路径完整性", async () => {
			const { callerAuthorized } = setupAuthorizedTrpc({ session });
			await createFakeData(callerAuthorized);

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

			await cleanFakeData(callerAuthorized);
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

	it.todo("更新页面 验证更新后的页面名称", async () => {
		const updateName = "测试页面更新";
		const { callerAuthorized } = setupAuthorizedTrpc({ session });
		await createFakeData(callerAuthorized);
		await callerAuthorized.page.update({
			id: rootPage.id,
			name: updateName,
		});

		const pageAfterUpdate = await callerAuthorized.page.get({
			id: rootPage.id,
		});

		expect(pageAfterUpdate?.name).toBe(updateName);
		await cleanFakeData(callerAuthorized);
	});

	it.todo("回收页面 验证父页面回收后，子页面应该同时被回收，", async () => {
		// const { callerAuthorized } = setupAuthorizedTrpc({ session });
		// // 回收根节点
		// await callerAuthorized.page.toggleTrash({
		// 	id: testRootPage.id,
		// 	isDeleted: true,
		// });
	});

	it.todo("恢复页面 验证父页面恢复后，子页面应该同时恢复，", async () => {});
	it.todo(
		"单独恢复1级子页面，断开与父页面的联系，同时2级子页面也被恢复",
		async () => {},
	);

	it.todo("清空回收站 验证回收站中的所有页面已被清空", async () => {});

	it.todo(
		"删除页面 验证已被删除 同时断开子页面与父页面的联系 删除path",
		async () => {
			const { callerAuthorized } = setupAuthorizedTrpc({ session });

			await callerAuthorized.page.delete([rootPage.id]);

			const pageAfterDelete = await callerAuthorized.page.get({
				id: rootPage.id,
			});

			expect(pageAfterDelete).toBeUndefined();
		},
	);
});
