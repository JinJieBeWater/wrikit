import { beforeAll, beforeEach, describe, expect, it } from "vitest";
import { setupAuthorizedTrpc } from "../utils/setupTrpc";
import { getAllRelatedPages } from "@/server/api/drizzle/getAllRelatedPages";
import {
	cleanSeedPage,
	PageL0C0,
	PageL1C0,
	PageL2C0,
	seedPage,
} from "../trpc/utils/page";
import { session } from "@/test/fake/user";

describe("Page 相关功能函数 单元测试", () => {
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

	it("通过 id 获取所有相关页面 getAllRelatedPages", async () => {
		const { ctx } = setupAuthorizedTrpc({ session });
		const relatedPageIds = await getAllRelatedPages(ctx.db, PageL0C0.id);
		expect(relatedPageIds).toEqual([PageL0C0.id, PageL1C0.id, PageL2C0.id]);
	});
});
