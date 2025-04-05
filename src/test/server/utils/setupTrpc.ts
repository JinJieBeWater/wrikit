import { createContextInner } from "@/server/api/trpc";
import { appRouter } from "@/server/api/root";
import type { Session } from "next-auth";
import { db } from "@/test/setup";

export async function setupTrpc() {
	const ctx = createContextInner({
		session: null,
		db: db,
	});
	const caller = appRouter.createCaller(ctx);

	return { caller, db };
}

export async function setupAuthorizedTrpc({
	session,
}: {
	session: Session | null;
}) {
	const ctx = createContextInner({
		session,
		db: db,
	});
	const caller = appRouter.createCaller(ctx);

	return { callerAuthorized: caller, db };
}
