import { getPageOrder } from "@/server/api/drizzle/getPageOrder"
import { pages } from "@/server/db/schema"
import {
	PageL0C0,
	cleanSeedPage,
	seedPage,
} from "@/test/server/trpc/page/utils"
import { callerAuthorized, testDB } from "@/test/setup"
import { PageType } from "@/types/page"
import { eq } from "drizzle-orm"
import { beforeEach, describe, expect, it } from "vitest"

beforeEach(async () => {
	await seedPage(callerAuthorized)
	return async () => {
		await cleanSeedPage(callerAuthorized)
	}
})

describe("排序", () => {
	describe("创建", () => {
		it("当创建页面时，应该自动添加到父页面的排序中", async () => {
			const childs = await testDB
				.select()
				.from(pages)
				.where(eq(pages.parentId, PageL0C0.id))

			const orders = await getPageOrder(testDB, { parentId: PageL0C0.id })

			expect(orders?.length).toBe(childs.length)

			childs.forEach((c) => {
				expect(orders).toContain(c.id)
			})
		})

		it("当创建根页面时，应该添加到根路径排序中", async () => {
			const preRootOrder = await testDB.query.pageOrders.findFirst({
				where(fields, operators) {
					return operators.isNull(fields.parentId)
				},
			})

			const pageCreated = await callerAuthorized.page.create({
				name: "测试页面",
				type: PageType.md,
			})

			const afterRootOrder = await testDB.query.pageOrders.findFirst({
				where(fields, operators) {
					return operators.isNull(fields.parentId)
				},
			})

			expect(afterRootOrder?.orderedIds).toEqual(
				preRootOrder?.orderedIds.concat(pageCreated.id),
			)

			// 清除数据
			await callerAuthorized.page.delete([pageCreated.id])

			const data = await testDB.query.pages.findFirst({
				where(fields, operators) {
					return operators.eq(fields.id, pageCreated.id)
				},
			})

			expect(data).toBeUndefined()
		})
	})

	describe("查询", () => {
		it("当进行根页面查询时，得到的数据顺序应与排序一致", async () => {
			// 创建多个根页面
			const rootPage1 = await callerAuthorized.page.create({
				name: "测试根页面1",
				type: PageType.md,
			})
			const rootPage2 = await callerAuthorized.page.create({
				name: "测试根页面2",
				type: PageType.md,
			})
			const rootPage3 = await callerAuthorized.page.create({
				name: "测试根页面3",
				type: PageType.md,
			})

			// 获取根页面排序
			const rootOrder = await testDB.query.pageOrders.findFirst({
				where(fields, operators) {
					return operators.isNull(fields.parentId)
				},
			})
			expect(rootOrder).toBeDefined()

			// 获取根页面列表
			const rootPages = await callerAuthorized.page.getByParentId({})

			// 验证顺序一致
			const testPageIds = [rootPage1.id, rootPage2.id, rootPage3.id]
			const testPagesInResult = rootPages.filter((page) =>
				testPageIds.includes(page.id),
			)

			// 验证这些页面在结果中的顺序与排序表中的顺序一致
			if (rootOrder?.orderedIds) {
				for (let i = 0; i < testPagesInResult.length - 1; i++) {
					if (testPagesInResult[i]?.id && testPagesInResult[i + 1]?.id) {
						// 我们已经在上面的if条件中检查了这些值不为undefined
						const id1 = testPagesInResult[i]?.id as string
						const id2 = testPagesInResult[i + 1]?.id as string
						const currentIndex = rootOrder.orderedIds.indexOf(id1)
						const nextIndex = rootOrder.orderedIds.indexOf(id2)
						expect(currentIndex).toBeLessThan(nextIndex)
					}
				}
			}

			// 清理测试数据
			await callerAuthorized.page.delete([
				rootPage1.id,
				rootPage2.id,
				rootPage3.id,
			])
		})

		it("当通过父页面查询时，得到的数据顺序应与排序一致", async () => {
			// 创建一个测试父页面
			const parentPage = await callerAuthorized.page.create({
				name: "测试父页面",
				type: PageType.md,
			})

			// 创建多个子页面
			await callerAuthorized.page.create({
				name: "测试子页面1",
				type: PageType.md,
				parentId: parentPage.id,
			})
			await callerAuthorized.page.create({
				name: "测试子页面2",
				type: PageType.md,
				parentId: parentPage.id,
			})
			await callerAuthorized.page.create({
				name: "测试子页面3",
				type: PageType.md,
				parentId: parentPage.id,
			})

			// 获取父页面下的排序
			const parentOrder = await testDB.query.pageOrders.findFirst({
				where(fields, operators) {
					return operators.eq(fields.parentId, parentPage.id)
				},
			})
			expect(parentOrder).toBeDefined()

			// 获取子页面列表
			const childPages = await callerAuthorized.page.getByParentId({
				parentId: parentPage.id,
			})

			// 验证顺序一致
			expect(childPages.length).toBe(3)
			expect(childPages.map((c) => c.id)).toEqual(parentOrder?.orderedIds)

			// 清理测试数据
			await callerAuthorized.page.delete([parentPage.id])
		})
	})

	describe("移动", () => {
		it("当对页面进行排序时，应该更新父页面的排序列表", async () => {
			// 创建一个测试父页面
			const parentPage = await callerAuthorized.page.create({
				name: "测试父页面",
				type: PageType.md,
			})

			// 创建多个子页面
			const childPage1 = await callerAuthorized.page.create({
				name: "测试子页面1",
				type: PageType.md,
				parentId: parentPage.id,
			})
			const childPage2 = await callerAuthorized.page.create({
				name: "测试子页面2",
				type: PageType.md,
				parentId: parentPage.id,
			})
			const childPage3 = await callerAuthorized.page.create({
				name: "测试子页面3",
				type: PageType.md,
				parentId: parentPage.id,
			})

			// 获取原始排序
			const originalOrder = await testDB.query.pageOrders.findFirst({
				where(fields, operators) {
					return operators.eq(fields.parentId, parentPage.id)
				},
			})
			expect(originalOrder).toBeDefined()
			expect(originalOrder?.orderedIds).toEqual([
				childPage1.id,
				childPage2.id,
				childPage3.id,
			])

			const newOrder = [childPage3.id, childPage1.id, childPage2.id]
			await callerAuthorized.page.securityUpdateOrder({
				parentId: parentPage.id,
				orderedIds: newOrder,
			})

			// 验证排序已更新
			const updatedOrder = await testDB.query.pageOrders.findFirst({
				where(fields, operators) {
					return operators.eq(fields.parentId, parentPage.id)
				},
			})
			expect(updatedOrder?.orderedIds).toEqual(newOrder)

			// 获取子页面列表，验证顺序已更新
			const childPages = await callerAuthorized.page.getByParentId({
				parentId: parentPage.id,
			})
			expect(childPages.map((p) => p.id)).toEqual(newOrder)

			// 清理测试数据
			await callerAuthorized.page.delete([parentPage.id])
		})

		it("当移动页面时，应该自动从原父页面的排序中删除，并添加到新父页面的排序中", async () => {
			// 创建两个父页面
			const parentPage1 = await callerAuthorized.page.create({
				name: "测试父页面1",
				type: PageType.md,
			})
			const parentPage2 = await callerAuthorized.page.create({
				name: "测试父页面2",
				type: PageType.md,
			})

			// 在父页面1下创建子页面
			const childPage = await callerAuthorized.page.create({
				name: "测试子页面",
				type: PageType.md,
				parentId: parentPage1.id,
			})

			// 验证父页面1的排序包含子页面
			const originalOrder = await testDB.query.pageOrders.findFirst({
				where(fields, operators) {
					return operators.eq(fields.parentId, parentPage1.id)
				},
			})
			expect(originalOrder?.orderedIds).toContain(childPage.id)

			// 使用 transferAndOrder 移动页面
			await callerAuthorized.page.transferAndOrder({
				pageId: childPage.id,
				oldParentId: parentPage1.id,
				newParentId: parentPage2.id,
				orderedIds: [childPage.id], // 新父页面下的排序
			})

			// 验证页面的 parentId 已更新
			const updatedPage = await testDB.query.pages.findFirst({
				where(fields, operators) {
					return operators.eq(fields.id, childPage.id)
				},
			})
			expect(updatedPage?.parentId).toBe(parentPage2.id)

			// 验证路径关系已更新
			const paths = await testDB.query.pagesPath.findMany({
				where(fields, operators) {
					return operators.and(
						operators.eq(fields.descendant, childPage.id),
						operators.gt(fields.depth, 0),
					)
				},
			})

			// 验证路径中包含新父页面
			const hasNewParentPath = paths.some(
				(path) => path.ancestor === parentPage2.id,
			)
			expect(hasNewParentPath).toBe(true)

			// 验证路径中不包含旧父页面
			const hasOldParentPath = paths.some(
				(path) => path.ancestor === parentPage1.id,
			)
			expect(hasOldParentPath).toBe(false)

			// 验证父页面1的排序不再包含子页面
			const updatedOrder1 = await testDB.query.pageOrders.findFirst({
				where(fields, operators) {
					return operators.eq(fields.parentId, parentPage1.id)
				},
			})
			expect(updatedOrder1?.orderedIds || []).not.toContain(childPage.id)

			// 验证父页面2的排序包含子页面
			const updatedOrder2 = await testDB.query.pageOrders.findFirst({
				where(fields, operators) {
					return operators.eq(fields.parentId, parentPage2.id)
				},
			})
			expect(updatedOrder2?.orderedIds || []).toContain(childPage.id)

			// 清理测试数据
			await callerAuthorized.page.delete([parentPage1.id, parentPage2.id])
		})
	})

	describe("删除", () => {
		it("当删除页面时，应该自动从父页面的排序中删除", async () => {
			const childs = await testDB
				.select()
				.from(pages)
				.where(eq(pages.parentId, PageL0C0.id))

			for await (const [i, c] of childs.entries()) {
				await callerAuthorized.page.delete([c.id])

				// 验证排序已删除
				const orders = await getPageOrder(testDB, { parentId: PageL0C0.id })

				// 排序长度减一
				expect(orders?.length ?? 0).toBe(childs.length - i - 1)

				// 排序中不包含已删除的页面
				expect(orders ?? []).not.toContain(c.id)
			}

			// 验证排序已删除
			const orders = await getPageOrder(testDB, { parentId: PageL0C0.id })
			expect(orders).toBeUndefined()
		})

		it("当删除父页面最后一个子页面时，应删除父页面的排序记录", async () => {
			// 创建一个测试父页面
			const parentPage = await callerAuthorized.page.create({
				name: "测试父页面",
				type: PageType.md,
			})

			// 创建一个子页面
			const childPage = await callerAuthorized.page.create({
				name: "测试子页面",
				type: PageType.md,
				parentId: parentPage.id,
			})

			// 验证排序记录已创建
			const orderBeforeDelete = await testDB.query.pageOrders.findFirst({
				where(fields, operators) {
					return operators.eq(fields.parentId, parentPage.id)
				},
			})
			expect(orderBeforeDelete).toBeDefined()
			expect(orderBeforeDelete?.orderedIds).toContain(childPage.id)

			// 删除子页面
			await callerAuthorized.page.delete([childPage.id])

			// 验证排序记录已删除
			const orderAfterDelete = await testDB.query.pageOrders.findFirst({
				where(fields, operators) {
					return operators.eq(fields.parentId, parentPage.id)
				},
			})
			expect(orderAfterDelete).toBeUndefined()

			// 清理测试数据
			await callerAuthorized.page.delete([parentPage.id])
		})
	})
})
