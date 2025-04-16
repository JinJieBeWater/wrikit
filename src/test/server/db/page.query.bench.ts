import { pages } from "@/server/db/schema"
import { testDB } from "@/test/setup"
import type { Page } from "@/types/page"
import { afterAll, beforeAll, bench, describe } from "vitest"
import { user } from "../../fake/user"
import { adjacencyListCreate, generateTreeData } from "./utils/page"

const case_1_depth_0 = generateTreeData({
	depth: 0,
})

const case_2_depth_1_children_1 = generateTreeData({
	depth: 1,
	childrenPerNode: 1,
})

const case_3_depth_3_children_3 = generateTreeData({
	depth: 3,
	childrenPerNode: 3,
})

const case_4_depth_6_children_3 = generateTreeData({
	depth: 6,
	childrenPerNode: 3,
})

beforeAll(async () => {
	// 添加测试数据
	await adjacencyListCreate(case_1_depth_0)

	await adjacencyListCreate(case_2_depth_1_children_1)

	await adjacencyListCreate(case_3_depth_3_children_3)

	await adjacencyListCreate(case_4_depth_6_children_3)
})

afterAll(async () => {
	await testDB.delete(pages)
})

const adjacencyListQuery = async (root: Page["id"]) => {
	const getByParentId = async (parentId?: Page["id"] | Page["id"][]) => {
		const ids = Array.isArray(parentId) ? parentId : parentId ? [parentId] : []
		const result: Page["id"][] = []
		const childs = await testDB.query.pages.findMany({
			where(fields, operators) {
				return operators.and(
					ids.length > 0
						? operators.inArray(fields.parentId, ids)
						: operators.isNull(fields.parentId),
					operators.eq(fields.createdById, user.id),
				)
			},
			columns: {
				id: true,
			},
		})

		const childIds = childs.map((c) => c.id)

		result.push(...childIds)

		if (childIds.length > 0) {
			result.push(...(await getByParentId(childIds)))
		}
		return result
	}
	await getByParentId(root)
}

const closureTableQuery = async (root: Page["id"]) => {
	const arr = await testDB.query.pagesPath.findMany({
		where(fields, operators) {
			return operators.and(operators.eq(fields.ancestor, root))
		},
	})
	await testDB.query.pages.findMany({
		where(fields, operators) {
			return operators.and(
				operators.inArray(
					fields.id,
					arr.map((r) => r.descendant),
				),
			)
		},
		columns: {
			id: true,
		},
	})
}

describe("Page 嵌套查询 单个节点", async () => {
	bench("邻接表方案", async () => {
		await adjacencyListQuery(case_1_depth_0.id)
	})

	bench("闭包表方案", async () => {
		await closureTableQuery(case_1_depth_0.id)
	})
})

describe("Page 嵌套查询 深度1子节点1的树", async () => {
	bench("邻接表方案", async () => {
		await adjacencyListQuery(case_2_depth_1_children_1.id)
	})

	bench("闭包表方案", async () => {
		await closureTableQuery(case_2_depth_1_children_1.id)
	})
})

describe("Page 嵌套查询 深度3子节点3的树", async () => {
	bench("邻接表方案", async () => {
		await adjacencyListQuery(case_3_depth_3_children_3.id)
	})

	bench("闭包表方案", async () => {
		await closureTableQuery(case_3_depth_3_children_3.id)
	})
})

describe("Page 嵌套查询 深度10子节点3的树", async () => {
	bench("邻接表方案", async () => {
		await adjacencyListQuery(case_4_depth_6_children_3.id)
	})

	bench("闭包表方案", async () => {
		await closureTableQuery(case_4_depth_6_children_3.id)
	})
})
