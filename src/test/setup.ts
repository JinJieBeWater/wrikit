import { beforeAll, vi } from "vitest";
import type * as schema from "@/server/db/schema";
import type { PostgresJsDatabase } from "drizzle-orm/postgres-js";
import { setupDockerTestDb } from "./server/utils/setupDockerTestDb";
import { users } from "@/server/db/schema";
import { user } from "./fake/user";
import { eq } from "drizzle-orm";

vi.mock("react", async (importOriginal) => {
	const testCache = <T extends (...args: Array<unknown>) => unknown>(func: T) =>
		func;
	const originalModule = await importOriginal<typeof import("react")>();
	return {
		...originalModule,
		cache: testCache,
	};
});

let testDB: PostgresJsDatabase<typeof schema>;
beforeAll(async () => {
	const { db, cleanup } = await setupDockerTestDb();
	testDB = db;
	return async () => {
		await cleanup();
	};
}, 100000);

beforeAll(async () => {
	await testDB.insert(users).values(user);

	return async () => {
		await testDB.delete(users).where(eq(users.id, user.id));
	};
});

export { testDB };
