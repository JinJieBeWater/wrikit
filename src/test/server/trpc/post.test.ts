import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { setupAuthorizedTrpc, setupTrpc } from "../utils/setupTrpc";
import { posts, users } from "@/server/db/schema";
import { testDB } from "@/test/setup";
import { eq } from "drizzle-orm";
import { session, user } from "../../fake/user";

afterAll(async () => {
	await testDB.delete(users).where(eq(users.id, user.id));
});

describe("post router", async () => {
	let callerAuthorized: ReturnType<
		typeof setupAuthorizedTrpc
	>["callerAuthorized"];
	let caller: ReturnType<typeof setupTrpc>["caller"];

	beforeAll(() => {
		callerAuthorized = setupAuthorizedTrpc({ session }).callerAuthorized;
		caller = setupTrpc().caller;
	});

	it("returns the correct greeting", async () => {
		const result = await caller.post.hello({
			text: "vitest",
		});
		expect(result).toMatchObject({ greeting: "Hello vitest" });
	});

	it("throws an error if not logged in", async () => {
		await expect(() =>
			caller.post.getSecretMessage(),
		).rejects.toThrowErrorMatchingInlineSnapshot("[TRPCError: UNAUTHORIZED]");
	});

	it("returns the secret message if logged in", async () => {
		const result = await callerAuthorized.post.getSecretMessage();
		expect(result).toMatchInlineSnapshot(
			`"you can now see this secret message!"`,
		);
	});

	it("should return the latest post", async () => {
		await callerAuthorized.post.create({ name: "test" });

		const result = await callerAuthorized.post.getLatest();
		expect(result).toMatchObject({ name: "test" });
		if (result?.id) {
			await testDB.delete(posts).where(eq(posts.id, result?.id));
		}
	});
});
