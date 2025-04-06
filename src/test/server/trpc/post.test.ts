import { describe, expect, it } from "vitest";

import { setupAuthorizedTrpc, setupTrpc } from "../utils/setupTrpc";
import { users } from "@/server/db/schema";

describe("post router", async () => {
	it("returns the correct greeting", async () => {
		const { caller } = await setupTrpc();
		const result = await caller.post.hello({
			text: "vitest",
		});
		expect(result).toMatchObject({ greeting: "Hello vitest" });
	});

	it("throws an error if not logged in", async () => {
		const { caller } = await setupTrpc();

		await expect(() =>
			caller.post.getSecretMessage(),
		).rejects.toThrowErrorMatchingInlineSnapshot("[TRPCError: UNAUTHORIZED]");
	});

	it("returns the secret message if logged in", async () => {
		const { callerAuthorized } = await setupAuthorizedTrpc();

		const result = await callerAuthorized.post.getSecretMessage();
		expect(result).toMatchInlineSnapshot(
			`"you can now see this secret message!"`,
		);
	});

	it("should return the latest post", async () => {
		const user = {
			email: "test@test.com",
			name: "test",
			id: crypto.randomUUID(),
		};

		const { callerAuthorized, db } = await setupAuthorizedTrpc({
			session: {
				user,
				expires: new Date(Date.now() + 1000 * 60 * 60 * 24).toString(),
			},
		});

		await db.insert(users).values(user);

		await callerAuthorized.post.create({ name: "test" });

		const result = await callerAuthorized.post.getLatest();
		expect(result).toMatchObject({ name: "test" });
	});
});
