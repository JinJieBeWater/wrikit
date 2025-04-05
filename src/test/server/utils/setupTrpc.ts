import { setupDockerTestDb } from "./setupDockerTestDb";
import { createContextInner } from "@/server/api/trpc";
import { appRouter } from "@/server/api/root";
import type { Session } from "next-auth";

export async function setupTrpc({
	session = null,
}: {
	session: Session | null;
}) {
	const { db, client } = await setupDockerTestDb();

	const ctx = createContextInner({
		session: null,
		db: db,
	});
	const caller = appRouter.createCaller(ctx);

	const ctxWithSession = createContextInner({
		session,
		db: db,
	});
	const callerWithLogin = appRouter.createCaller(ctxWithSession);

	return { caller, db, client, callerWithLogin };
}
