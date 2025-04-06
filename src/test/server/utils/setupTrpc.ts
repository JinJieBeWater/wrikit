import { createContextInner } from "@/server/api/trpc";
import { createCaller } from "@/server/api/root";
import type { Session } from "next-auth";
import { testDB } from "@/test/setup";

export async function setupTrpc() {
	const ctx = createContextInner({
		session: null,
		db: testDB,
	});
	const caller = createCaller(ctx);

	return { caller };
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
		db: testDB,
	});
	const caller = createCaller(ctx);

	return { callerAuthorized: caller };
}
