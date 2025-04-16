import { Blocks, MessageCircleQuestion, Settings2 } from "lucide-react"

import {
	SidebarGroup,
	SidebarGroupContent,
	SidebarMenu,
	SidebarMenuBadge,
	SidebarMenuButton,
	SidebarMenuItem,
	useSidebar,
} from "@/components/ui/sidebar"
import { PageTrashModal } from "./page-trash-modal"

export function NavSecondary({
	...props
}: React.ComponentPropsWithoutRef<typeof SidebarGroup>) {
	return (
		<>
			<SidebarGroup {...props}>
				<SidebarGroupContent>
					<SidebarMenu>
						<SidebarMenuItem>
							<SidebarMenuButton>
								<Settings2 />
								<span>Settings</span>
							</SidebarMenuButton>
						</SidebarMenuItem>
						<SidebarMenuItem>
							<SidebarMenuButton>
								<Blocks />
								<span>Templates</span>
								<SidebarMenuBadge>New</SidebarMenuBadge>
							</SidebarMenuButton>
						</SidebarMenuItem>

						<PageTrashModal />

						<SidebarMenuItem>
							<SidebarMenuButton>
								<MessageCircleQuestion />
								<span>Help</span>
								{/* <SidebarMenuBadge>New</SidebarMenuBadge> */}
							</SidebarMenuButton>
						</SidebarMenuItem>
					</SidebarMenu>
				</SidebarGroupContent>
			</SidebarGroup>
		</>
	)
}
