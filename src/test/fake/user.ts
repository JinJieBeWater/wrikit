import type { Session } from "next-auth";

export const user = {
	id: crypto.randomUUID(),
	name: "test",
	email: "test@test.com",
};

export const session: Session = {
	user,
	expires: new Date(Date.now() + 1000 * 60 * 60 * 24 * 30).toString(),
};
