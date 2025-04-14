import { getAllRelatedPages } from "@/server/api/drizzle/getAllRelatedPages"
import { session } from "@/test/fake/user"
import { beforeAll, beforeEach, describe, expect, it } from "vitest"
import {
	PageArray,
	PageL0C0,
	cleanSeedPage,
	seedPage,
} from "../trpc/page/utils"
import { setupAuthorizedTrpc } from "../utils/setupTrpc"

describe("Page 相关功能函数 单元测试", () => {
	let callerAuthorized: ReturnType<
		typeof setupAuthorizedTrpc
	>["callerAuthorized"]
	let ctx: ReturnType<typeof setupAuthorizedTrpc>["ctx"]

	beforeAll(() => {
		;({ callerAuthorized, ctx } = setupAuthorizedTrpc({ session }))
	})

	beforeEach(async () => {
		await seedPage(callerAuthorized)
		return async () => {
			await cleanSeedPage(callerAuthorized)
		}
	})

	it("当通过页面ID获取相关页面时，应该返回所有关联页面", async () => {
		const { relatedPageIds } = await getAllRelatedPages(ctx.db, PageL0C0.id)
		expect(relatedPageIds).toEqual(PageArray.map((p) => p.id))
	})
})
