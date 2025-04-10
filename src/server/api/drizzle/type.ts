import type { Session } from "next-auth";
import type { createTRPCContext } from "../trpc";
import type {
	PostgresJsDatabase,
	PostgresJsQueryResultHKT,
} from "drizzle-orm/postgres-js";
import type * as schema from "@/server/db/schema";
import type { ExtractTablesWithRelations } from "drizzle-orm";
import type { PgTransaction } from "drizzle-orm/pg-core";

export type Context = Awaited<ReturnType<typeof createTRPCContext>> & {
	session: Session;
};

export type DB =
	| PostgresJsDatabase<typeof schema>
	| PgTransaction<
			PostgresJsQueryResultHKT,
			typeof schema,
			ExtractTablesWithRelations<typeof schema>
	  >;
