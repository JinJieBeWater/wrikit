import { env } from "@/env";
import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
	return twMerge(clsx(inputs));
}

export function generateUUID(): string {
	return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
		const r = (Math.random() * 16) | 0;
		const v = c === "x" ? r : (r & 0x3) | 0x8;
		return v.toString(16);
	});
}

export const shouldNeverHappen = (msg: string, ...args: unknown[]): never => {
	console.error(msg, ...args);
	if (env.NODE_ENV === "development") {
		// biome-ignore lint/suspicious/noDebugger: <explanation>
		debugger;
	}
	throw new Error(`This should never happen: ${msg}`);
};
