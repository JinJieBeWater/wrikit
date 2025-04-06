import { afterAll, beforeAll, describe, it } from "vitest";
import { setupAuthorizedTrpc } from "../utils/setupTrpc";
import { testDB } from "@/test/setup";
import { pages, users } from "@/server/db/schema";
import { eq } from "drizzle-orm";
import { PageType } from "@/types/page";

describe("page router", async () => {
	const user = {
		id: crypto.randomUUID(),
		name: "test",
		email: "test@test.com",
	};

	const mapData = (input: string | string[], count: number) => {
		const ids = Array.isArray(input) ? input : [input];
		const data = [];
		for (let i = 0; i < count; i++) {
			data.push({
				parentId: ids[i],
				id: crypto.randomUUID(),
			});
		}
		return data;
	};

	beforeAll(async () => {
		console.log(await testDB.insert(users).values(user).returning());
	});

	afterAll(async () => {
		await testDB.delete(pages).where(eq(pages.createdById, user.id));
		await testDB.delete(users).where(eq(users.id, user.id));
	});

	it("should create success", async () => {
		const rootId = crypto.randomUUID();
		const child1Datd = mapData(rootId, 3);
		const child2Datd = mapData(
			child1Datd.map((d) => d.id),
			9,
		);
		const child3Datd = mapData(
			child2Datd.map((d) => d.id),
			81,
		);

		console.log(await testDB.select().from(users));

		await testDB.insert(pages).values([
			{
				id: rootId,
				type: PageType.md,
				name: "root",
				createdById: user.id,
			},
		]);
		await testDB.insert(pages).values(
			child1Datd.map((d) => ({
				...d,
				name: `child1-${d.id}`,
				createdById: user.id,
			})),
		);
		await testDB.insert(pages).values(
			child2Datd.map((d) => ({
				...d,
				name: `child2-${d.id}`,
				createdById: user.id,
			})),
		);
		await testDB.insert(pages).values(
			child3Datd.map((d) => ({
				...d,
				name: `child3-${d.id}`,
				createdById: user.id,
			})),
		);
	});
});
