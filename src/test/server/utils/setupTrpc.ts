import { createContextInner } from "@/server/api/trpc";
import { createCaller } from "@/server/api/root";
import type { Session } from "next-auth";
import { testDB } from "@/test/setup";

export function setupTrpc() {
	const ctx = createContextInner({
		session: null,
		db: testDB,
	});
	const caller = createCaller(ctx);

	return { caller, ctx };
}

export function setupAuthorizedTrpc({
	session,
}: {
	session: Session;
}) {
	const ctx = createContextInner({
		session,
		db: testDB,
	});
	const caller = createCaller(ctx);

	return {
		callerAuthorized: caller,
		ctx: {
			db: ctx.db,
			headers: ctx.headers,
			session: ctx.session as Session,
		},
	};
}
