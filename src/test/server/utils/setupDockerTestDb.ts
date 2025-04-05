import { PostgreSqlContainer } from "@testcontainers/postgresql";
import { drizzle } from "drizzle-orm/postgres-js";
import { migrate } from "drizzle-orm/postgres-js/migrator";
import path from "node:path";
import postgres from "postgres";
import { afterAll } from "vitest";
import * as schema from "@/server/db/schema";

export async function setupDockerTestDb() {
	const POSTGRES_USER = "test";
	const POSTGRES_PASSWORD = "test";
	const POSTGRES_DB = "test";

	// Make sure to use Postgres 15 with pg_uuidv7 installed
	// Ensure you have the pg_uuidv7 docker image locally
	// You may need to modify pg_uuid's dockerfile to install the extension or build a new image from its base
	// https://github.com/fboulnois/pg_uuidv7
	const container = await new PostgreSqlContainer("postgres:latest")
		.withEnvironment({
			POSTGRES_USER: POSTGRES_USER,
			POSTGRES_PASSWORD: POSTGRES_PASSWORD,
			POSTGRES_DB: POSTGRES_DB,
		})
		.withExposedPorts(5433)
		.start();

	const connectionString = `postgres://${POSTGRES_USER}:${POSTGRES_PASSWORD}@${container.getHost()}:${container.getFirstMappedPort()}/${POSTGRES_DB}`;
	const client = postgres(connectionString);
	const db = drizzle(client, { schema });

	// await db.execute(sql`CREATE EXTENSION IF NOT EXISTS pg_uuidv7`);
	const migrationPath = path.join(process.cwd(), "drizzle");
	await migrate(db, {
		migrationsFolder: migrationPath,
	});

	const cleanup = async () => {
		// await db.execute(sql`DROP EXTENSION IF EXISTS pg_uuidv7`);
		await container.stop();
		await client.end();
	};

	afterAll(async () => {
		await cleanup();
	});

	return { db, client };
}
