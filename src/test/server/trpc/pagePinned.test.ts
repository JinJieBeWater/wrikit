import { beforeEach, describe, expect, it } from "vitest";
import { session } from "../../fake/user";
import { setupAuthorizedTrpc } from "../utils/setupTrpc";
import { cleanFakeData, createFakeData, PageL0C0 } from "./utils/page";

describe("Page Pinned 路由", async () => {
	beforeEach(async () => {
		const { callerAuthorized } = setupAuthorizedTrpc({ session });
		await createFakeData(callerAuthorized);
		return async () => {
			await cleanFakeData(callerAuthorized);
		};
	});

	it("固定功能常规测试", async () => {
		const { callerAuthorized } = setupAuthorizedTrpc({ session });

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
