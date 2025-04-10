import type { RouterInputs } from "@/trpc/react";
import { PageType, type PageTypeUnion } from "@/types/page";
import { faker } from "@faker-js/faker/locale/zh_CN";

export interface PageFactoryOptions {
	id?: string;
	parentId?: string | undefined;
	name?: string;
	content?: string;
	type?: PageTypeUnion;
}

export function createPageFactory(options: PageFactoryOptions = {}) {
	return {
		id: options.id ?? crypto.randomUUID(),
		parentId: options.parentId ?? undefined,
		name: options.name ?? faker.lorem.words(3),
		content: options.content ?? faker.lorem.paragraphs(3),
		type: options.type ?? PageType.md,
	} satisfies RouterInputs["page"]["create"];
}
