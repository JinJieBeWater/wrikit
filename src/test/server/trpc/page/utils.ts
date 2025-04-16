import { pages } from "@/server/db/schema"
import { createPageFactory } from "@/test/factory/page"
import { testDB } from "@/test/setup"
import { faker } from "@faker-js/faker/locale/zh_CN"
import { expect } from "vitest"
import type { setupAuthorizedTrpc } from "../../utils/setupTrpc"

faker.seed(1234)

export const PageL0C0 = createPageFactory()
export const PageL1C0 = createPageFactory({
	parentId: PageL0C0.id,
})
export const PageL1C1 = createPageFactory({
	parentId: PageL0C0.id,
})
export const PageL1C2 = createPageFactory({
	parentId: PageL0C0.id,
})
export const PageL2C0 = createPageFactory({
	parentId: PageL1C0.id,
})
export const PageArray = [PageL0C0, PageL1C0, PageL1C1, PageL1C2, PageL2C0]

export const seedPage = async (
	callerAuthorized: ReturnType<typeof setupAuthorizedTrpc>["callerAuthorized"],
) => {
	await callerAuthorized.page.create(PageL0C0)
	await callerAuthorized.page.create(PageL1C0)
	await callerAuthorized.page.create(PageL1C1)
	await callerAuthorized.page.create(PageL1C2)
	await callerAuthorized.page.create(PageL2C0)
}

export const cleanSeedPage = async (
	callerAuthorized: ReturnType<typeof setupAuthorizedTrpc>["callerAuthorized"],
) => {
	await callerAuthorized.page.delete([PageL0C0.id])

	// 检查不应有残留数据
	await expect(testDB.select().from(pages)).resolves.toEqual([])
}
