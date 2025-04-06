import { bench, describe } from "vitest";
import { setupTrpc } from "../utils/setupTrpc";

describe("page", async () => {
	const { db } = await setupTrpc();

	bench("normal", () => {
		const x = [1, 5, 4, 2, 3];
		x.sort((a, b) => {
			return a - b;
		});
	});

	bench("reverse", () => {
		const x = [1, 5, 4, 2, 3];
		x.reverse().sort((a, b) => {
			return a - b;
		});
	});
});
