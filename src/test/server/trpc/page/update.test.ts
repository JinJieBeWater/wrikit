import { callerAuthorized } from "@/test/setup"
import { beforeEach, describe, expect, it } from "vitest"
import { PageL0C0, cleanSeedPage, seedPage } from "./utils"

beforeEach(async () => {
	await seedPage(callerAuthorized)
	return async () => {
		await cleanSeedPage(callerAuthorized)
	}
})

describe("更新", () => {
	it("当更新页面名称时，应该成功保存新名称", async () => {
		const updateName = "测试页面更新"
		await callerAuthorized.page.update({
			id: PageL0C0.id,
			name: updateName,
		})

		const pageAfterUpdate = await callerAuthorized.page.get({
			id: PageL0C0.id,
		})

		expect(pageAfterUpdate?.name).toBe(updateName)
	})

	it("当更新页面内容时，应该成功保存新内容", async () => {
		const updateContent = "测试页面更新"
		await callerAuthorized.page.update({
			id: PageL0C0.id,
			content: updateContent,
		})

		const pageAfterUpdate = await callerAuthorized.page.get({
			id: PageL0C0.id,
		})

		expect(pageAfterUpdate?.content).toBe(updateContent)
	})
})
