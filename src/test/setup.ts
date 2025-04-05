import { vi } from "vitest";

vi.mock("react", async (importOriginal) => {
	const testCache = <T extends (...args: Array<unknown>) => unknown>(func: T) =>
		func;
	const originalModule = await importOriginal<typeof import("react")>();
	return {
		...originalModule,
		cache: testCache,
	};
});
