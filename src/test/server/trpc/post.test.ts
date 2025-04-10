import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { setupAuthorizedTrpc, setupTrpc } from "../utils/setupTrpc";
import { posts, users } from "@/server/db/schema";
import { testDB } from "@/test/setup";
import { eq } from "drizzle-orm";
import { session, user } from "../../fake/user";

afterAll(async () => {
	await testDB.delete(users).where(eq(users.id, user.id));
});

describe("Post 路由", async () => {
	let callerAuthorized: ReturnType<
		typeof setupAuthorizedTrpc
	>["callerAuthorized"];
	let caller: ReturnType<typeof setupTrpc>["caller"];

	beforeAll(() => {
		callerAuthorized = setupAuthorizedTrpc({ session }).callerAuthorized;
		caller = setupTrpc().caller;
	});

	it("当调用hello方法时，应该返回正确的问候语", async () => {
		const result = await caller.post.hello({
			text: "vitest",
		});
		expect(result).toMatchObject({ greeting: "Hello vitest" });
	});

	it("当未登录用户访问受保护资源时，应该抛出未授权错误", async () => {
		await expect(() =>
			caller.post.getSecretMessage(),
		).rejects.toThrowErrorMatchingInlineSnapshot("[TRPCError: UNAUTHORIZED]");
	});

	it("当已登录用户访问受保护资源时，应该返回秘密信息", async () => {
		const result = await callerAuthorized.post.getSecretMessage();
		expect(result).toMatchInlineSnapshot(
			`"you can now see this secret message!"`,
		);
	});

	it("当创建帖子后获取最新帖子时，应该返回刚创建的帖子", async () => {
		await callerAuthorized.post.create({ name: "test" });

		const result = await callerAuthorized.post.getLatest();
		expect(result).toMatchObject({ name: "test" });
		if (result?.id) {
			await testDB.delete(posts).where(eq(posts.id, result?.id));
		}
	});
});
