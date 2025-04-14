import { beforeEach, describe, expect, it } from "vitest"
import { callerAuthorized, testDB } from "@/test/setup"
import { pages } from "@/server/db/schema"
import { and, eq } from "drizzle-orm"

import { getAllRelatedPages } from "@/server/api/drizzle/getAllRelatedPages"
import { seedPage, cleanSeedPage, PageL0C0, PageL1C0, PageL2C0 } from "./utils"


beforeEach(async () => {
  await seedPage(callerAuthorized)
  return async () => {
    await cleanSeedPage(callerAuthorized)
  }
})

describe("回收", () => {
  it("当父页面被回收时，所有子页面应该同时被回收", async () => {
    const { relatedPageIds } = await getAllRelatedPages(testDB, PageL0C0.id)

    // 回收根节点
    await callerAuthorized.page.toggleTrash({
      id: PageL0C0.id,
      isDeleted: true,
    })

    const pagesInTrash = await testDB
      .select()
      .from(pages)
      .where(eq(pages.isDeleted, true))
    expect(pagesInTrash.length).toBe(relatedPageIds.length)

    const pagesNotInTrash = await testDB
      .select()
      .from(pages)
      .where(eq(pages.isDeleted, false))
    expect(pagesNotInTrash.length).toBe(0)
  })

  it("当父页面从回收站恢复时，所有子页面应该同时恢复", async () => {
    const { relatedPageIds } = await getAllRelatedPages(testDB, PageL0C0.id)

    // 回收根节点
    await callerAuthorized.page.toggleTrash({
      id: PageL0C0.id,
      isDeleted: true,
    })

    // 恢复根节点
    await callerAuthorized.page.toggleTrash({
      id: PageL0C0.id,
      isDeleted: false,
    })

    const pagesInTrash = await testDB
      .select()
      .from(pages)
      .where(eq(pages.isDeleted, true))
    expect(pagesInTrash.length).toBe(0)

    const pagesNotInTrash = await testDB
      .select()
      .from(pages)
      .where(eq(pages.isDeleted, false))
    expect(pagesNotInTrash.length).toBe(relatedPageIds.length)
  })

  it("当单独恢复1级子页面时，应该断开与父页面的联系并同时恢复其2级子页面", async () => {
    // 回收根节点
    await callerAuthorized.page.toggleTrash({
      id: PageL0C0.id,
      isDeleted: true,
    })

    // 恢复1级子页面
    await callerAuthorized.page.toggleTrash({
      id: PageL1C0.id,
      isDeleted: false,
    })

    // 根页面仍然处于回收状态
    await expect(
      testDB
        .select()
        .from(pages)
        .where(and(eq(pages.isDeleted, true), eq(pages.id, PageL0C0.id))),
    ).resolves.toBeDefined()

    // 二级页面被恢复
    await expect(
      testDB
        .select()
        .from(pages)
        .where(and(eq(pages.isDeleted, false), eq(pages.id, PageL2C0.id))),
    ).resolves.toBeDefined()
  })

  it("当清空回收站时，所有被回收的页面应该被永久删除", async () => {
    // 清空回收站
    await callerAuthorized.page.clearTrash()

    // 所有页面已被清空
    const pagesInTrash = await testDB
      .select()
      .from(pages)
      .where(eq(pages.isDeleted, true))
    expect(pagesInTrash.length).toBe(0)
  })

  it("当页面被回收时，应该删除其关联的pinned关系", async () => {
    // 添加pinned关系
    await callerAuthorized.pagePinned.create({
      pageId: PageL0C0.id,
      order: 0,
    })

    // 回收根节点
    await callerAuthorized.page.toggleTrash({
      id: PageL0C0.id,
      isDeleted: true,
    })

    // 验证pinned关系已被删除
    const pinneds = await callerAuthorized.pagePinned.get()
    expect(pinneds.length).toBe(0)
  })
})
