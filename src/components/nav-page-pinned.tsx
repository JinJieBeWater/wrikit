"use client"

import { api } from "@/trpc/react"
import { PageTree } from "./nav-page"
import {
	SidebarGroup,
	SidebarGroupContent,
	SidebarGroupLabel,
	SidebarMenu,
} from "./ui/sidebar"

export function NavPagePinned() {
	const [roots] = api.pagePinned.get.useSuspenseQuery()

	return (
		<>
			{roots.length > 0 && (
				<SidebarGroup>
					<SidebarGroupLabel>Pinned</SidebarGroupLabel>
					<SidebarGroupContent>
						<SidebarMenu>
							{roots
								.filter((page) => !page.isDeleted)
								.map((page) => (
									<PageTree key={page.id} page={page} />
								))}
						</SidebarMenu>
					</SidebarGroupContent>
				</SidebarGroup>
			)}
		</>
	)
}
