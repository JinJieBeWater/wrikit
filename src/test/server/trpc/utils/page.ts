import type { RouterInputs } from "@/trpc/react";
import { PageType } from "@/types/page";
import type { setupAuthorizedTrpc } from "../../utils/setupTrpc";
import { expect } from "vitest";

export const rootPage = {
	id: "0e5a22c9-6574-4b93-948e-a5c70c3e4266",
	name: "测试页面",
	content: "测试页面内容",
	type: PageType.md,
} satisfies RouterInputs["page"]["create"];
export const child1Page = {
	id: "13048de8-1564-41e1-b791-49040e3a089a",
	name: "测试子页面1",
	content: "测试子页面内容",
	type: PageType.md,
	parentId: rootPage.id,
} satisfies RouterInputs["page"]["create"];
export const child2Page = {
	id: "e250576c-6f33-4ff6-80d1-16e9f2bab6bc",
	name: "测试子页面2",
	content: "测试子页面内容",
	type: PageType.md,
	parentId: child1Page.id,
} satisfies RouterInputs["page"]["create"];

export const createFakeData = async (
	callerAuthorized: ReturnType<typeof setupAuthorizedTrpc>["callerAuthorized"],
) => {
	await callerAuthorized.page.create(rootPage);
	await callerAuthorized.page.create(child1Page);
	await callerAuthorized.page.create(child2Page);
};

export const cleanFakeData = async (
	callerAuthorized: ReturnType<typeof setupAuthorizedTrpc>["callerAuthorized"],
) => {
	const result = await callerAuthorized.page.delete([
		rootPage.id,
		child1Page.id,
		child2Page.id,
	]);
	expect(result.count).toBeTypeOf("number");
};
