import { createCaller } from "@/server/api/root"
import { createContextInner } from "@/server/api/trpc"
import { testDB } from "@/test/setup"
import type { Session } from "next-auth"
import { createContext } from "./createContext"

export function setupTrpc() {
	const ctx = createContextInner({
		session: null,
		db: testDB,
	})
	const caller = createCaller(ctx)

	return { caller, ctx }
}

export function setupAuthorizedTrpc({
	session,
}: {
	session: Session
}) {
	const ctx = createContext(session)
	const caller = createCaller(ctx)

	return {
		callerAuthorized: caller,
		ctx: {
			db: ctx.db,
			headers: ctx.headers,
			session: ctx.session as Session,
		},
	}
}
