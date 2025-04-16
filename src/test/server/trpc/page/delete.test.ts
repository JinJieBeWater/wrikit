import { callerAuthorized } from "@/test/setup"
import { beforeEach, describe, expect, it } from "vitest"

import { PageL0C0, PageL1C0, PageL2C0, cleanSeedPage, seedPage } from "./utils"

beforeEach(async () => {
	await seedPage(callerAuthorized)
	return async () => {
		await cleanSeedPage(callerAuthorized)
	}
})

describe("删除", () => {
	it("当删除不存在的页面ID时，应该抛出错误", async () => {
		await expect(
			callerAuthorized.page.delete(["non-existent-id"]),
		).rejects.toThrow()
	})

	it("当批量删除多个页面时，应该全部成功删除", async () => {
		const deleteIds = [PageL1C0.id, PageL2C0.id]
		const result = await callerAuthorized.page.delete(deleteIds)
		expect(result.count).toBe(deleteIds.length)

		// 验证父页面仍然存在
		const rootPageAfterDelete = await callerAuthorized.page.get({
			id: PageL0C0.id,
		})
		expect(rootPageAfterDelete).toBeDefined()
	})

	it("当删除子页面时，不应影响父页面的存在", async () => {
		await callerAuthorized.page.delete([PageL1C0.id])

		// 验证父页面仍然存在
		const parentPage = await callerAuthorized.page.get({
			id: PageL0C0.id,
		})
		expect(parentPage).toBeDefined()

		// 验证子页面已被删除
		const deletedPage = await callerAuthorized.page.get({
			id: PageL1C0.id,
		})
		expect(deletedPage).toBeUndefined()
	})
})
