import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { setupAuthorizedTrpc, setupTrpc } from "../utils/setupTrpc";
import { posts, users } from "@/server/db/schema";
import { testDB } from "@/test/setup";
import { eq } from "drizzle-orm";

describe("post router", async () => {
	it("returns the correct greeting", async () => {
		const { caller } = setupTrpc();
		const result = await caller.post.hello({
			text: "vitest",
		});
		expect(result).toMatchObject({ greeting: "Hello vitest" });
	});

	it("throws an error if not logged in", async () => {
		const { caller } = setupTrpc();

		await expect(() =>
			caller.post.getSecretMessage(),
		).rejects.toThrowErrorMatchingInlineSnapshot("[TRPCError: UNAUTHORIZED]");
	});

	it("returns the secret message if logged in", async () => {
		const { callerAuthorized } = setupAuthorizedTrpc({
			session: {
				user: {
					email: "test@test.com",
					name: "test",
					id: crypto.randomUUID(),
				},
				expires: new Date(Date.now() + 1000 * 60 * 60 * 24).toString(),
			},
		});

		const result = await callerAuthorized.post.getSecretMessage();
		expect(result).toMatchInlineSnapshot(
			`"you can now see this secret message!"`,
		);
	});

	const user = {
		email: "test@test.com",
		name: "test",
		id: crypto.randomUUID(),
	};

	beforeAll(async () => {
		await testDB.insert(users).values(user);
	});

	it("should return the latest post", async () => {
		const { callerAuthorized } = setupAuthorizedTrpc({
			session: {
				user,
				expires: new Date(Date.now() + 1000 * 60 * 60 * 24).toString(),
			},
		});

		await callerAuthorized.post.create({ name: "test" });

		const result = await callerAuthorized.post.getLatest();
		expect(result).toMatchObject({ name: "test" });
	});

	afterAll(async () => {
		await testDB.delete(posts).where(eq(posts.createdById, user.id));
		await testDB.delete(users).where(eq(users.id, user.id));
	});
});
