import type { setupAuthorizedTrpc } from "../../utils/setupTrpc";
import { expect } from "vitest";
import { createPageFactory } from "@/test/factory/page";
import { faker } from "@faker-js/faker/locale/zh_CN";

faker.seed(1234);

export const PageL0C0 = createPageFactory();
export const PageL1C0 = createPageFactory({
	parentId: PageL0C0.id,
});
export const PageL2C0 = createPageFactory({
	parentId: PageL1C0.id,
});

export const createFakeData = async (
	callerAuthorized: ReturnType<typeof setupAuthorizedTrpc>["callerAuthorized"],
) => {
	await callerAuthorized.page.create(PageL0C0);
	await callerAuthorized.page.create(PageL1C0);
	await callerAuthorized.page.create(PageL2C0);
};

export const cleanFakeData = async (
	callerAuthorized: ReturnType<typeof setupAuthorizedTrpc>["callerAuthorized"],
) => {
	const result = await callerAuthorized.page.delete([
		PageL0C0.id,
		PageL1C0.id,
		PageL2C0.id,
	]);
	expect(result.count).toBeTypeOf("number");
};
