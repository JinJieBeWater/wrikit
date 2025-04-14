import { beforeEach, describe, expect, it } from "vitest"
import {
  cleanSeedPage,
  PageL0C0,
  seedPage,
} from "./utils"
import { callerAuthorized, testDB } from "@/test/setup"

beforeEach(async () => {
  await seedPage(callerAuthorized)
  return async () => {
    await cleanSeedPage(callerAuthorized)
  }
})

describe("查询", () => {
  it("当查询不存在的页面ID时，应该返回undefined", async () => {
    await expect(
      callerAuthorized.page.get({
        id: crypto.randomUUID(),
      }),
    ).resolves.toBeUndefined()
  })

  it("当通过父页面ID查询页面时，应该返回所有子页面", async () => {
    const right = await testDB.query.pages.findMany({
      where(fields, operators) {
        return operators.and(operators.eq(fields.parentId, PageL0C0.id))
      },
    })

    const childs = await callerAuthorized.page.getByParentId({
      parentId: PageL0C0.id,
    })

    expect(childs.length).toBe(right.length)
  })

  it("当不传入父页面ID 直接查询页面时，应该返回所有根页面", async () => {
    const right = await testDB.query.pages.findMany({
      where(fields, operators) {
        return operators.and(operators.isNull(fields.parentId))
      },
    })

    const roots = await callerAuthorized.page.getByParentId({})

    expect(roots.length).toBe(right.length)
  })
});

