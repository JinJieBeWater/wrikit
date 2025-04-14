"use client"

import { cn } from "@/lib/utils"
import { type RouterOutputs, api } from "@/trpc/react"
import { useDraggable } from "@dnd-kit/core"
import { CSS } from "@dnd-kit/utilities"
import { ChevronRight, Plus } from "lucide-react"
import { memo, useRef, useState } from "react"
import { PageTreeItem } from "./nav-page-tree-item"
import { PageAction } from "./page-action"
import { PageActionAdd } from "./page-action-add"
import {
	Collapsible,
	CollapsibleContent,
	CollapsibleTrigger,
} from "./ui/collapsible"
import {
	SidebarMenuAction,
	SidebarMenuItem,
	SidebarMenuSub,
	useSidebar,
} from "./ui/sidebar"

const PurePageTree = ({
	page,
	initialStack,
}: {
	page: RouterOutputs["page"]["getByParentId"][0]
	initialStack?: RouterOutputs["page"]["getByParentId"]
}) => {
	const [open, setOpen] = useState(false)
	const { isMobile } = useSidebar()

	const { data, isLoading, isError } = api.page.getByParentId.useQuery(
		{
			parentId: page.id,
		},
		{
			refetchOnMount: false,
		},
	)

	const stack = useRef(initialStack ? [...initialStack, page] : [page])

	const { attributes, listeners, setNodeRef, transform } = useDraggable({
		id: `page-${page.id}`,
	})
	const style = {
		transform: CSS.Translate.toString(transform),
	}
	return (
		<SidebarMenuItem
			ref={setNodeRef}
			style={style}
			{...listeners}
			{...attributes}
		>
			<Collapsible
				className={cn(
					"group/collapsible [&>button]:hover:opacity-100 [&[data-state=open]>button:first-child>svg:first-child]:rotate-90",
					isMobile ? "[&>a]:pr-11" : "[&>a]:hover:pr-11",
				)}
				open={open}
				onOpenChange={setOpen}
			>
				<PageTreeItem page={page} />
				<CollapsibleTrigger asChild>
					<SidebarMenuAction
						className="left-2 bg-sidebar-accent text-sidebar-accent-foreground data-[state=open]:rotate-90"
						showOnHover
					>
						<ChevronRight />
					</SidebarMenuAction>
				</CollapsibleTrigger>
				<PageActionAdd parentPage={page} setParentOpen={setOpen}>
					<SidebarMenuAction className="right-6" showOnHover title="Add">
						<Plus />
						<span className="sr-only">Add</span>
					</SidebarMenuAction>
				</PageActionAdd>

				<PageAction page={page} />

				<CollapsibleContent>
					<SidebarMenuSub className="mr-0 ml-2 px-0">
						{isError ? (
							<span className="flex h-8 items-center pl-8 text-destructive">
								Failed to load data
							</span>
						) : isLoading ? (
							<span className="flex h-8 items-center pl-8 text-muted-foreground">
								Loading...
							</span>
						) : data && data.length > 0 ? (
							data
								?.filter((subPage) => !subPage.isDeleted)
								.map((subPage) => (
									<PurePageTree
										key={subPage.id}
										page={subPage}
										initialStack={stack.current}
									/>
								))
						) : (
							<span className="flex h-8 items-center pl-8 text-muted-foreground">
								Nothing Inside
							</span>
						)}
					</SidebarMenuSub>
				</CollapsibleContent>
			</Collapsible>
		</SidebarMenuItem>
	)
}

export const PageTree = memo(PurePageTree)

PurePageTree.displayName = "PageTree"
