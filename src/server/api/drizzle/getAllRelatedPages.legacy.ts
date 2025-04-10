import type { DB } from "./type";

export const getAllRelatedPagesLegacy = async (
	db: DB,
	rootId: string | string[],
) => {
	const ids = Array.isArray(rootId) ? rootId : [rootId];
	const allPages = [...ids];
	const stack = [...ids];

	while (stack.length > 0) {
		const childPages = await db.query.pages.findMany({
			where(fields, operators) {
				return operators.and(operators.inArray(fields.parentId, stack));
			},
			columns: {
				id: true,
			},
		});
		// 清空stack
		stack.length = 0;
		const childPageIds = childPages.map((p) => p.id);
		allPages.push(...childPageIds);
		stack.push(...childPageIds);
	}

	return allPages;
};
