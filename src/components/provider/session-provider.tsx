"use client";

import type { Session } from "next-auth";
import React, { createContext, useContext, type ReactNode } from "react";

const SessionContext = createContext<Session | null>(null);

export const SessionProvider = ({
	children,
	session,
}: {
	children: ReactNode;
	session: Session | null;
}) => {
	return (
		<SessionContext.Provider value={session}>
			{children}
		</SessionContext.Provider>
	);
};

export const useSession = () => {
	const context = useContext(SessionContext);

	return context;
};
