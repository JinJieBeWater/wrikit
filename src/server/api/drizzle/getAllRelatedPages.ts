import type { DB } from "./type";

/**
 * 获取所有相关页面
 *
 * 优化说明：
 * 1. 使用单次遍历同时获取所有需要的数据结构
 * 2. 使用 Map 和 Set 提高查找效率
 * 3. 减少不必要的中间变量和数组操作
 */

export const getAllRelatedPages = async (db: DB, rootId: string | string[]) => {
	const ids = Array.isArray(rootId) ? rootId : [rootId];

	// 执行数据库查询
	const relatedPage = await db.query.pagesPath.findMany({
		where: (fields, operators) => {
			return operators.and(operators.inArray(fields.ancestor, ids));
		},
		columns: {
			descendant: true,
		},
	});

	// 使用 Set 存储唯一的页面 ID
	const uniquePageIdsSet = new Set<string>();

	for (const page of relatedPage) {
		// 添加到唯一 ID 集合
		uniquePageIdsSet.add(page.descendant);
	}

	// 转换 Set 为数组
	const relatedPageIds = Array.from(uniquePageIdsSet);

	return {
		relatedPageIds,
	};
};
