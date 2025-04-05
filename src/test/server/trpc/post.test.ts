import { describe, expect, it } from "vitest";

import { setupTrpc } from "../utils/setupTrpc";

describe("post router", async () => {
	const { caller, callerWithLogin } = await setupTrpc({
		session: {
			user: { id: "123", name: "test", email: "test" },
			expires: new Date(Date.now() + 1000 * 60 * 60 * 24).toString(),
		},
	});

	it("returns the correct greeting", async () => {
		const example = await caller.post.hello({
			text: "vitest",
		});
		expect(example).toMatchObject({ greeting: "Hello vitest" });
	});

	it("throws an error if not logged in", async () => {
		await expect(() =>
			caller.post.getSecretMessage(),
		).rejects.toThrowErrorMatchingInlineSnapshot("[TRPCError: UNAUTHORIZED]");
	});

	it("returns the secret message if logged in", async () => {
		const example = await callerWithLogin.post.getSecretMessage();
		expect(example).toMatchInlineSnapshot(
			`"you can now see this secret message!"`,
		);
	});
});
