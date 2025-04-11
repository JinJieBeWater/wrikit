import { beforeAll, beforeEach, describe, expect, it } from "vitest";
import { setupAuthorizedTrpc } from "../utils/setupTrpc";
import { getAllRelatedPages } from "@/server/api/drizzle/getAllRelatedPages";
import {
	cleanSeedPage,
	PageArray,
	PageL0C0,
	seedPage,
} from "../trpc/utils/page";
import { session } from "@/test/fake/user";

describe("Page 相关功能函数 单元测试", () => {
	let callerAuthorized: ReturnType<
		typeof setupAuthorizedTrpc
	>["callerAuthorized"];
	let ctx: ReturnType<typeof setupAuthorizedTrpc>["ctx"];

	beforeAll(() => {
		({ callerAuthorized, ctx } = setupAuthorizedTrpc({ session }));
	});

	beforeEach(async () => {
		await seedPage(callerAuthorized);
		return async () => {
			await cleanSeedPage(callerAuthorized);
		};
	});

	it("当通过页面ID获取相关页面时，应该返回所有关联页面", async () => {
		const { relatedPageIds } = await getAllRelatedPages(ctx.db, PageL0C0.id);
		expect(relatedPageIds).toEqual(PageArray.map((p) => p.id));
	});
});
