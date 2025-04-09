import { type PageTypeUnion, PageType } from "@/types/page";
import { createContext } from "../../utils/createContext";
import { createPageWithPagePath } from "@/server/api/drizzle/page";
import { pages } from "@/server/db/schema";
import { testDB } from "@/test/setup";
import type { Session } from "next-auth";

export const user = {
	id: crypto.randomUUID(),
	name: "test",
	email: "test@test.com",
};

export const session: Session = {
	user,
	expires: new Date(Date.now() + 1000 * 60 * 60 * 24 * 30).toString(),
};

export interface TestNode {
	id: string;
	type: PageTypeUnion;
	parentId?: string;
	children?: TestNode[];
	createdById: string;
}

// 生成树形结构数据
export interface GenerateTreeDataProps {
	depth: number;
	childrenPerNode?: number;
	parentId?: string;
}

export function generateTreeData({
	depth,
	childrenPerNode = 1,
	parentId,
}: GenerateTreeDataProps): TestNode {
	const nodeId = crypto.randomUUID();
	const node: TestNode = {
		id: nodeId,
		type: PageType.md,
		parentId,
		createdById: user.id,
	};

	if (depth > 0) {
		node.children = Array.from({ length: childrenPerNode ?? 0 }, () =>
			generateTreeData({
				depth: depth - 1,
				childrenPerNode,
				parentId: nodeId,
			}),
		);
	}

	return node;
}

// 邻接表方案
export const adjacencyListCreate = async (root: TestNode) => {
	const ctx = createContext({
		user: user,
		expires: new Date(Date.now() + 1000 * 60 * 60 * 24).toString(),
	});

	const create = async (node: TestNode) => {
		await testDB.insert(pages).values([node]);

		if (node.children) {
			for await (const child of node.children) {
				await create(child);
			}
		}
	};

	await create(root);
};

// 闭包表方案
export const closureTableCreate = async (root: TestNode) => {
	const ctx = createContext({
		user: user,
		expires: new Date(Date.now() + 1000 * 60 * 60 * 24).toString(),
	});

	const create = async (node: TestNode) => {
		await createPageWithPagePath(ctx, node);

		if (node.children) {
			for await (const child of node.children) {
				await create(child);
			}
		}
	};

	await create(root);
};
