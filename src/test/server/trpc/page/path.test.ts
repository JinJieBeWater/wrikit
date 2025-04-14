import { callerAuthorized } from "@/test/setup"
import { beforeEach, describe, expect, it } from "vitest"
import { PageL0C0, PageL1C0, PageL2C0, cleanSeedPage, seedPage } from "./utils"

beforeEach(async () => {
	await seedPage(callerAuthorized)
	return async () => {
		await cleanSeedPage(callerAuthorized)
	}
})

describe("路径", () => {
	it("当删除根节点时，所有子节点及其路径应该被删除", async () => {
		// 删除根节点
		await callerAuthorized.page.delete([PageL0C0.id])
		// 验证根节点
		const rootPageAfterDelete = await callerAuthorized.page.get({
			id: PageL0C0.id,
		})
		expect(rootPageAfterDelete).toBeUndefined()
		// 验证子节点
		const child1PageAfterDelete = await callerAuthorized.page.get({
			id: PageL1C0.id,
		})
		expect(child1PageAfterDelete).toBeUndefined()
		const child2PageAfterDelete = await callerAuthorized.page.get({
			id: PageL2C0.id,
		})
		expect(child2PageAfterDelete).toBeUndefined()

		// 验证路径已删除
		const rootPagePath = await callerAuthorized.page.getPathByAncestor({
			ancestor: PageL0C0.id,
		})
		expect(rootPagePath).toEqual([])
		const child1PagePath = await callerAuthorized.page.getPathByAncestor({
			ancestor: PageL1C0.id,
		})
		expect(child1PagePath).toEqual([])
		const child2PagePath = await callerAuthorized.page.getPathByAncestor({
			ancestor: PageL2C0.id,
		})
		expect(child2PagePath).toEqual([])
	})

	it("当删除节点时，与该节点相关的所有路径应该被删除", async () => {
		await callerAuthorized.page.delete([PageL2C0.id])

		await Promise.all([
			expect(
				callerAuthorized.page.getPathByAncestor({
					ancestor: PageL2C0.id,
				}),
			).resolves.toEqual([]),
			expect(
				callerAuthorized.page.getPathByDescendant({
					descendant: PageL2C0.id,
				}),
			).resolves.toEqual([]),
		])
	})

	it("当删除节点时，不应影响与该节点无关的其他路径", async () => {
		const pre = await callerAuthorized.page.getPathByAncestor({
			ancestor: PageL1C0.id,
		})

		await callerAuthorized.page.delete([PageL2C0.id])

		const after = await callerAuthorized.page.getPathByAncestor({
			ancestor: PageL1C0.id,
		})
		expect(after.length).toBe(pre.length - 1)
	})
})
