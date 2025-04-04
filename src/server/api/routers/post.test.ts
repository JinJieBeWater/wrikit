import type { inferProcedureInput } from "@trpc/server";
import { expect, test } from "vitest";

import { appRouter, type AppRouter } from "@/server/api/root";
import { createContextInner } from "../trpc";

test("hello world", async () => {
	const ctx = createContextInner({
		session: null,
	});
	const caller = appRouter.createCaller(ctx);
	type Input = inferProcedureInput<AppRouter["post"]["hello"]>;
	const input: Input = {
		text: "test",
	};
	const example = await caller.post.hello(input);
	expect(example).toMatchObject({ greeting: "Hello test" });
});
