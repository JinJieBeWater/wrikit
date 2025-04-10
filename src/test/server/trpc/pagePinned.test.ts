import { beforeEach, describe, expect, it } from "vitest";
import { session } from "../../fake/user";
import { setupAuthorizedTrpc } from "../utils/setupTrpc";
import { cleanFakeData, createFakeData, rootPage } from "./utils/page";

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
			pageId: rootPage.id,
			order: 0,
		});

		// 验证pinned关系已添加
		const pinneds = await callerAuthorized.pagePinned.get();
		expect(pinneds[0]?.id).toBe(rootPage.id);

		// 删除pinned关系
		await callerAuthorized.pagePinned.delete([rootPage.id]);

		// 验证pinned关系已删除
		const pinnedsAfterDelete = await callerAuthorized.pagePinned.get();
		expect(pinnedsAfterDelete.length).toBe(0);
	});
});
