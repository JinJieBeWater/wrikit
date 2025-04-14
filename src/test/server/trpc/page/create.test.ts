import { callerAuthorized } from "@/test/setup"
import { PageType } from "@/types/page"
import { beforeEach, describe, expect, it } from "vitest"
import { cleanSeedPage, seedPage } from "./utils"

beforeEach(async () => {
	await seedPage(callerAuthorized)
	return async () => {
		await cleanSeedPage(callerAuthorized)
	}
})

describe("创建", () => {
	it("当创建新页面时，应该成功保存并可以获取", async () => {
		const page = await callerAuthorized.page.create({
			name: "测试页面",
			type: PageType.md,
		})
		const get = await callerAuthorized.page.get({
			id: page.id,
		})
		expect(get?.name).toBe("测试页面")

		// 删除
		await callerAuthorized.page.delete([page.id])
	})

	it("当创建页面使用无效的ID时，应该抛出错误", async () => {
		await expect(
			callerAuthorized.page.create({
				id: "invalid-id",
				type: PageType.md,
			}),
		).rejects.toThrow()
	})

	it("当创建页面使用无效的父页面ID时，应该抛出错误", async () => {
		await expect(
			callerAuthorized.page.create({
				parentId: "invalid-id",
				type: PageType.md,
			}),
		).rejects.toThrow()
	})
})
