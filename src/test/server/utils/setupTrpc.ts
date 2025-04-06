import { createContextInner } from "@/server/api/trpc";
import { createCaller } from "@/server/api/root";
import type { Session } from "next-auth";
import { db } from "@/test/setup";

export async function setupTrpc() {
	const ctx = createContextInner({
		session: null,
		db: db,
	});
	const caller = createCaller(ctx);

	return { caller, db };
}

interface SetupAuthorizedTrpcProps {
	session?: Session;
}

export async function setupAuthorizedTrpc({
	session = {
		user: { id: "1", name: "test" },
		expires: new Date(Date.now() + 1000 * 60 * 60 * 24).toString(),
	},
}: SetupAuthorizedTrpcProps = {}) {
	const ctx = createContextInner({
		session,
		db: db,
	});
	const caller = createCaller(ctx);

	return { callerAuthorized: caller, db };
}
