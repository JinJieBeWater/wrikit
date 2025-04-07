import { beforeAll, describe, expect, it } from "vitest";
import { testDB } from "@/test/setup";
import { pages, users } from "@/server/db/schema";
import { eq } from "drizzle-orm";
import { user } from "../db/utils/page";
import { setupAuthorizedTrpc } from "../utils/setupTrpc";
import { PageType } from "@/types/page";
import { RouterInputs, RouterOutputs } from "@/trpc/react";

beforeAll(async () => {
	await testDB.insert(users).values(user).returning();

	return async () => {
		await testDB.delete(pages).where(eq(pages.createdById, user.id));

		await testDB.select().from(pages).where(eq(pages.createdById, user.id));

		await testDB.delete(pages).where(eq(pages.createdById, user.id));

		await testDB.delete(users).where(eq(users.id, user.id));
	};
});

describe("Page 路由", async () => {
	const testData = {
		id: crypto.randomUUID(),
		name: "测试页面",
		content: "测试页面内容",
		type: PageType.md,
	};

	const testChildrenData = {
		id: crypto.randomUUID(),
		name: "测试子页面",
		content: "测试子页面内容",
		type: PageType.md,
		parentId: testData.id,
	};
	it("创建页面并验证完整性", async () => {
		const { callerAuthorized } = setupAuthorizedTrpc({
			session: {
				user,
				expires: new Date(Date.now() + 1000 * 60 * 60 * 24 * 30).toString(),
			},
		});

		const result = await callerAuthorized.page.create(testData);

		const page = await callerAuthorized.page.get({
			id: result.id,
		});

		expect(page?.name).toBe(testData.name);

		const paths = await testDB.query.pagesPath.findMany({
			where: (fields, operators) => {
				return operators.and(operators.eq(fields.ancestor, result.id));
			},
		});

		expect(paths?.length).toBe(1);

		await callerAuthorized.page.create(testChildrenData);

		const childrenPaths = await testDB.query.pagesPath.findMany({
			where: (fields, operators) => {
				return operators.and(
					operators.eq(fields.descendant, testChildrenData.id),
				);
			},
		});

		expect(childrenPaths?.length).toBe(2);
	});

	it("更新页面", async () => {
		const updateName = "测试页面更新";
		const { callerAuthorized } = setupAuthorizedTrpc({
			session: {
				user,
				expires: new Date(Date.now() + 1000 * 60 * 60 * 24 * 30).toString(),
			},
		});
		await callerAuthorized.page.update({
			id: testData.id,
			name: updateName,
		});

		const pageAfterUpdate = await callerAuthorized.page.get({
			id: testData.id,
		});

		expect(pageAfterUpdate?.name).toBe(updateName);
	});

	it("删除页面", async () => {
		const { callerAuthorized } = setupAuthorizedTrpc({
			session: {
				user,
				expires: new Date(Date.now() + 1000 * 60 * 60 * 24 * 30).toString(),
			},
		});
		await callerAuthorized.page.delete([testData.id]);

		const pageAfterDelete = await callerAuthorized.page.get({
			id: testData.id,
		});

		expect(pageAfterDelete).toBeUndefined();
	});
});
