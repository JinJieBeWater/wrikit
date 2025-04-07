import { pages, users } from "@/server/db/schema";
import { testDB } from "@/test/setup";
import { eq } from "drizzle-orm";
import { beforeAll, bench, describe } from "vitest";
import {
	type GenerateTreeDataProps,
	adjacencyListCreate,
	closureTableCreate,
	generateTreeData,
	user,
} from "./utils/page";

beforeAll(async () => {
	await testDB.insert(users).values(user).returning();

	return async () => {
		await testDB.delete(pages).where(eq(pages.createdById, user.id));

		await testDB.select().from(pages).where(eq(pages.createdById, user.id));

		await testDB.delete(pages).where(eq(pages.createdById, user.id));

		await testDB.delete(users).where(eq(users.id, user.id));
	};
});

describe("Page创建对比 创建独立节点", async () => {
	const props: GenerateTreeDataProps = {
		depth: 0,
	};
	bench("邻接表方案", async () => {
		const root = generateTreeData(props);
		await adjacencyListCreate(root);
	});

	bench("闭包表方案", async () => {
		const root = generateTreeData(props);
		await closureTableCreate(root);
	});
});

describe("Page创建对比 创建深度3 子节点3的树", async () => {
	const props: GenerateTreeDataProps = {
		depth: 3,
		childrenPerNode: 3,
	};
	bench("邻接表方案", async () => {
		const root = generateTreeData(props);
		await adjacencyListCreate(root);
	});

	bench("闭包表方案", async () => {
		const root = generateTreeData(props);
		await closureTableCreate(root);
	});
});

describe("Page创建对比 创建深度10 子节点1的树", async () => {
	const props: GenerateTreeDataProps = {
		depth: 10,
		childrenPerNode: 1,
	};
	bench("邻接表方案", async () => {
		const root = generateTreeData(props);
		await adjacencyListCreate(root);
	});

	bench("闭包表方案", async () => {
		const root = generateTreeData(props);
		await closureTableCreate(root);
	});
});

describe("Page创建对比 创建深度100 子节点1的树", async () => {
	const props: GenerateTreeDataProps = {
		depth: 100,
		childrenPerNode: 1,
	};
	bench("邻接表方案", async () => {
		const root = generateTreeData(props);
		await adjacencyListCreate(root);
	});

	bench("闭包表方案", async () => {
		const root = generateTreeData(props);
		await closureTableCreate(root);
	});
});
