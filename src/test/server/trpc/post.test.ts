import { describe, expect, it } from "vitest";

import { appRouter } from "@/server/api/root";
import { createContextInner } from "../../../server/api/trpc";

describe("post router", () => {
	it("returns the correct greeting", async () => {
		const ctx = createContextInner({
			session: null,
		});
		const caller = appRouter.createCaller(ctx);
		const example = await caller.post.hello({
			text: "vitest",
		});
		expect(example).toMatchObject({ greeting: "Hello vitest" });
	});

	it("throws an error if not logged in", async () => {
		const ctx = createContextInner({
			session: null,
		});
		const caller = appRouter.createCaller(ctx);
		await expect(() =>
			caller.post.getSecretMessage(),
		).rejects.toThrowErrorMatchingInlineSnapshot("[TRPCError: UNAUTHORIZED]");
	});

	it("returns the secret message if logged in", async () => {
		const ctx = createContextInner({
			session: {
				user: { id: "123", name: "test", email: "test" },
				expires: new Date(Date.now() + 1000 * 60 * 60 * 24).toString(),
			},
		});
		const caller = appRouter.createCaller(ctx);
		const example = await caller.post.getSecretMessage();
		expect(example).toMatchInlineSnapshot(
			`"you can now see this secret message!"`,
		);
	});
});
