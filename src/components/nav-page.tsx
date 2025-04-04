"use client";

import { api } from "@/trpc/react";
import { useDroppable } from "@dnd-kit/core";
import { Plus } from "lucide-react";
import { PageTree } from "./nav-page-tree";
import { PageActionAdd } from "./page-action-add";
import {
	SidebarGroup,
	SidebarGroupAction,
	SidebarGroupContent,
	SidebarGroupLabel,
	SidebarMenu,
} from "./ui/sidebar";

export function NavPage() {
	const [roots] = api.page.getByParentId.useSuspenseQuery({});

	const { isOver, setNodeRef } = useDroppable({
		id: "NavPage",
	});
	const style = {
		color: isOver ? "green" : undefined,
	};

	return (
		<SidebarGroup>
			<SidebarGroupLabel>Private</SidebarGroupLabel>
			<SidebarGroupContent>
				<SidebarMenu ref={setNodeRef} style={style}>
					{roots
						.filter((page) => !page.isDeleted)
						.map((page) => (
							<PageTree key={page.id} page={page} />
						))}
				</SidebarMenu>
			</SidebarGroupContent>

			<PageActionAdd>
				<SidebarGroupAction title="Add Page">
					<Plus /> <span className="sr-only">Add Page</span>
				</SidebarGroupAction>
			</PageActionAdd>
		</SidebarGroup>
	);
}
export { PageTree };
