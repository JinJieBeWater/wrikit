import { beforeAll, beforeEach, describe, expect, it } from "vitest";
import { session } from "../../fake/user";
import { setupAuthorizedTrpc } from "../utils/setupTrpc";
import { cleanSeedPage, seedPage, PageL0C0 } from "./utils/page";

describe("Page Pinned 路由", async () => {
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

	it("当添加和删除固定页面时，应该正确处理固定关系", async () => {
		// 添加pinned关系
		await callerAuthorized.pagePinned.create({
			pageId: PageL0C0.id,
			order: 0,
		});

		// 验证pinned关系已添加
		expect(
			(await callerAuthorized.pagePinned.get()).map((p) => p.id),
		).toContain(PageL0C0.id);

		// 删除pinned关系
		await callerAuthorized.pagePinned.delete([PageL0C0.id]);

		// 验证pinned关系已删除
		await expect(callerAuthorized.pagePinned.get()).resolves.toEqual([]);
	});
});
