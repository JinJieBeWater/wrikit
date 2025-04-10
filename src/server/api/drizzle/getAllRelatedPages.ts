import type { DB } from "./type";

/**
 * 获取所有相关页面
 */

export const getAllRelatedPages = async (db: DB, rootId: string | string[]) => {
	const ids = Array.isArray(rootId) ? rootId : [rootId];
	const relatedPage = await db.query.pagesPath.findMany({
		where: (fields, operators) => {
			return operators.and(operators.inArray(fields.ancestor, ids));
		},
		columns: {
			descendant: true,
		},
	});
	const relatedPageIds = relatedPage.map((r) => r.descendant);
	return relatedPageIds;
};
