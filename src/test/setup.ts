import { beforeAll, vi } from "vitest";
import type * as schema from "@/server/db/schema";
import type { PostgresJsDatabase } from "drizzle-orm/postgres-js";
import { setupDockerTestDb } from "./server/utils/setupDockerTestDb";

vi.mock("react", async (importOriginal) => {
	const testCache = <T extends (...args: Array<unknown>) => unknown>(func: T) =>
		func;
	const originalModule = await importOriginal<typeof import("react")>();
	return {
		...originalModule,
		cache: testCache,
	};
});

let db: PostgresJsDatabase<typeof schema>;

beforeAll(async () => {
	const { db: testDb } = await setupDockerTestDb();
	db = testDb;
});

export { db as testDB };
