import { pages, users } from "@/server/db/schema";
import { testDB } from "@/test/setup";
import { PageType, type PageTypeUnion } from "@/types/page";
import { eq } from "drizzle-orm";
import { beforeAll, bench, describe } from "vitest";
import { createPageWithPagePath } from "@/server/api/utils/page";
import { setupAuthorizedTrpc } from "../utils/setupTrpc";
import { createContextInner } from "@/server/api/trpc";
import { createContext } from "../utils/createContext";

const user = {
	id: crypto.randomUUID(),
	name: "test",
	email: "test@test.com",
};

interface TestNode {
	id: string;
	type: PageTypeUnion;
	parentId?: string;
	children?: TestNode[];
	createdById: string;
}

// 生成树形结构数据
interface GenerateTreeDataProps {
	depth: number;
	childrenPerNode?: number;
	parentId?: string;
}

function generateTreeData({
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

beforeAll(async () => {
	await testDB.insert(users).values(user).returning();

	return async () => {
		await testDB.delete(pages).where(eq(pages.createdById, user.id));

		await testDB.select().from(pages).where(eq(pages.createdById, user.id));

		await testDB.delete(pages).where(eq(pages.createdById, user.id));

		await testDB.delete(users).where(eq(users.id, user.id));
	};
});

// 邻接表方案
const adjacencyListTest = async (props: GenerateTreeDataProps) => {
	const ctx = createContext({
		user: user,
		expires: new Date(Date.now() + 1000 * 60 * 60 * 24).toString(),
	});

	const root = generateTreeData(props);

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
const closureTableTest = async (props: GenerateTreeDataProps) => {
	const ctx = createContext({
		user: user,
		expires: new Date(Date.now() + 1000 * 60 * 60 * 24).toString(),
	});

	const root = generateTreeData(props);

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

describe("Page创建对比 创建独立节点", async () => {
	const props: GenerateTreeDataProps = {
		depth: 0,
	};
	bench("邻接表方案", async () => {
		await adjacencyListTest(props);
	});

	bench("闭包表方案", async () => {
		await closureTableTest(props);
	});
});

describe("Page创建对比 创建深度3 子节点3的树", async () => {
	const props: GenerateTreeDataProps = {
		depth: 3,
		childrenPerNode: 3,
	};
	bench("邻接表方案", async () => {
		await adjacencyListTest(props);
	});

	bench("闭包表方案", async () => {
		await closureTableTest(props);
	});
});

describe("Page创建对比 创建深度10 子节点1的树", async () => {
	const props: GenerateTreeDataProps = {
		depth: 10,
		childrenPerNode: 1,
	};
	bench("邻接表方案", async () => {
		await adjacencyListTest(props);
	});

	bench("闭包表方案", async () => {
		await closureTableTest(props);
	});
});

describe("Page创建对比 创建深度100 子节点1的树", async () => {
	const props: GenerateTreeDataProps = {
		depth: 100,
		childrenPerNode: 1,
	};
	bench("邻接表方案", async () => {
		await adjacencyListTest(props);
	});

	bench("闭包表方案", async () => {
		await closureTableTest(props);
	});
});
