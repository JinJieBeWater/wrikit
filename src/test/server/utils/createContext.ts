import { createContextInner } from "@/server/api/trpc"
import { testDB } from "@/test/setup"
import type { Session } from "next-auth"

export function createContext(session: Session) {
	const ctx = createContextInner({
		session: session,
		db: testDB,
	})

	return {
		...ctx,
		session: ctx.session as Session,
	}
}
