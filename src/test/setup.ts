import { beforeAll, vi } from "vitest"
import type * as schema from "@/server/db/schema"
import type { PostgresJsDatabase } from "drizzle-orm/postgres-js"
import { setupDockerTestDb } from "./server/utils/setupDockerTestDb"
import { users } from "@/server/db/schema"
import { session, user } from "./fake/user"
import { eq } from "drizzle-orm"
import { setupAuthorizedTrpc } from "./server/utils/setupTrpc"

vi.mock("react", async (importOriginal) => {
	const testCache = <T extends (...args: Array<unknown>) => unknown>(func: T) =>
		func
	const originalModule = await importOriginal<typeof import("react")>()
	return {
		...originalModule,
		cache: testCache,
	}
})

let testDB: PostgresJsDatabase<typeof schema>
let callerAuthorized: ReturnType<
	typeof setupAuthorizedTrpc
>["callerAuthorized"]


beforeAll(async () => {
	const { db, cleanup } = await setupDockerTestDb()
	testDB = db

	callerAuthorized = setupAuthorizedTrpc({ session }).callerAuthorized

	return async () => {
		await cleanup()
	}
}, 100000)

beforeAll(async () => {
	await testDB.insert(users).values(user)

	return async () => {
		await testDB.delete(users).where(eq(users.id, user.id))
	}
})

export { testDB, callerAuthorized }
