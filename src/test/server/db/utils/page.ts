import type { Context } from "@/server/api/drizzle/type"
import type { createPageZod } from "@/server/api/routers/page"
import { pages, pagesPath } from "@/server/db/schema"
import { testDB } from "@/test/setup"
import { PageType, type PageTypeUnion } from "@/types/page"
import type { z } from "zod"
import { user } from "../../../fake/user"
import { createContext } from "../../utils/createContext"

export interface TestNode {
	id: string
	type: PageTypeUnion
	parentId?: string
	children?: TestNode[]
	createdById: string
}

// 生成树形结构数据
export interface GenerateTreeDataProps {
	depth: number
	childrenPerNode?: number
	parentId?: string
}

export function generateTreeData({
	depth,
	childrenPerNode = 1,
	parentId,
}: GenerateTreeDataProps): TestNode {
	const nodeId = crypto.randomUUID()
	const node: TestNode = {
		id: nodeId,
		type: PageType.md,
		parentId,
		createdById: user.id,
	}

	if (depth > 0) {
		node.children = Array.from({ length: childrenPerNode ?? 0 }, () =>
			generateTreeData({
				depth: depth - 1,
				childrenPerNode,
				parentId: nodeId,
			}),
		)
	}

	return node
}

// 邻接表方案
export const adjacencyListCreate = async (root: TestNode) => {
	const ctx = createContext({
		user: user,
		expires: new Date(Date.now() + 1000 * 60 * 60 * 24).toString(),
	})

	const create = async (node: TestNode) => {
		await testDB.insert(pages).values([node])

		if (node.children) {
			for await (const child of node.children) {
				await create(child)
			}
		}
	}

	await create(root)
}

const createPageWithPagePath = async (
	ctx: Context,
	input: z.infer<typeof createPageZod>,
) => {
	return await ctx.db.transaction(async (trx) => {
		const id = input.id ?? crypto.randomUUID()
		const promises = []

		const newPage = {
			...input,
			id,
			createdById: ctx.session.user.id,
		}

		// 创建页面
		promises.push(trx.insert(pages).values(newPage))

		/* 页面路径 */
		// 插入自引用路径
		promises.push(
			trx.insert(pagesPath).values({
				ancestor: id,
				descendant: id,
				depth: 0,
			}),
		)

		const parentId = input.parentId
		if (parentId) {
			// 获取父页面在当前闭包表中作为子节点的所有路径记录 将depth+1后为当前节点插入路径
			const addPath = async ({
				parentId,
				id,
			}: { parentId: string; id: string }) => {
				const parentPaths = await trx.query.pagesPath.findMany({
					where: (fields, operators) => {
						return operators.and(
							// 查找父页面的所有路径
							operators.eq(fields.descendant, parentId),
						)
					},
				})

				await trx.insert(pagesPath).values(
					parentPaths.map((path) => ({
						ancestor: path.ancestor,
						descendant: id,
						depth: path.depth + 1,
					})),
				)
			}
			promises.push(addPath({ parentId, id }))
		}
		await Promise.all(promises)

		return newPage
	})
}

// 闭包表方案
export const closureTableCreate = async (root: TestNode) => {
	const ctx = createContext({
		user: user,
		expires: new Date(Date.now() + 1000 * 60 * 60 * 24).toString(),
	})

	const create = async (node: TestNode) => {
		await createPageWithPagePath(ctx, node)
		if (node.children) {
			for await (const child of node.children) {
				await create(child)
			}
		}
	}

	await create(root)
}
