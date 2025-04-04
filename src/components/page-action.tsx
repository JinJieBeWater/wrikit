"use client";

import { usePagePin } from "@/hooks/use-page-pin";
import { usePageTrash } from "@/hooks/use-page-trash";
import type { RouterOutputs } from "@/trpc/react";
import {
	ArrowUpRight,
	CopyPlus,
	LinkIcon,
	MoreHorizontal,
	Pin,
	PinOff,
	Share2,
	Trash2,
} from "lucide-react";
import { memo } from "react";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "./ui/dropdown-menu";
import { SidebarMenuAction, useSidebar } from "./ui/sidebar";

export function PurePageAction({
	page,
}: {
	page: RouterOutputs["page"]["getByParentId"][0];
}) {
	const { isMobile } = useSidebar();

	const { isPinned, createPinned, deletePinned } = usePagePin(page);
	const { toggleTrash } = usePageTrash({ page });
	return (
		<DropdownMenu>
			<DropdownMenuTrigger asChild>
				<SidebarMenuAction showOnHover title="More">
					<MoreHorizontal />
					<span className="sr-only">More</span>
				</SidebarMenuAction>
			</DropdownMenuTrigger>
			<DropdownMenuContent
				className="w-56 rounded-lg"
				side={isMobile ? "bottom" : "right"}
				align={isMobile ? "end" : "start"}
			>
				<DropdownMenuItem
					onClick={() => {
						if (isPinned) {
							deletePinned.mutate({ pageId: page.id });
						} else {
							createPinned.mutate({ pageId: page.id });
						}
					}}
				>
					{isPinned ? (
						<>
							<PinOff className="text-muted-foreground" />
							<span>Unpin</span>
						</>
					) : (
						<>
							<Pin className="text-muted-foreground" />
							<span>Pin</span>
						</>
					)}
				</DropdownMenuItem>
				<DropdownMenuSeparator />
				<DropdownMenuItem>
					<ArrowUpRight className="text-muted-foreground" />
					<span>Open in New Tab</span>
				</DropdownMenuItem>
				<DropdownMenuItem>
					<Share2 className="text-muted-foreground" />
					<span>Share</span>
				</DropdownMenuItem>
				<DropdownMenuItem>
					<LinkIcon className="text-muted-foreground" />
					<span>Copy Link</span>
				</DropdownMenuItem>
				<DropdownMenuItem>
					<CopyPlus className="text-muted-foreground" />
					<span>Add a Copy</span>
				</DropdownMenuItem>
				<DropdownMenuSeparator />
				<DropdownMenuItem
					onClick={() =>
						toggleTrash.mutateAsync({
							id: page.id,
							isDeleted: true,
							parentId: page.parentId ?? undefined,
						})
					}
				>
					<Trash2 className="text-muted-foreground" />
					<span>Move to Trash</span>
				</DropdownMenuItem>
			</DropdownMenuContent>
		</DropdownMenu>
	);
}

export const PageAction = memo(PurePageAction);

PurePageAction.displayName = "PageAction";
