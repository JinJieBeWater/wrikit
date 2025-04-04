"use client";
import { generateUUID } from "@/lib/utils";
import { type RouterInputs, type RouterOutputs, api } from "@/trpc/react";
import { type Page, PageType } from "@/types/page";
import {
	ALargeSmall,
	AppWindow,
	Heading1,
	type LucideIcon,
	TableProperties,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { useSession } from "./provider/session-provider";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from "./ui/dropdown-menu";
import { useSidebar } from "./ui/sidebar";

export const PageTypeIcon = {
	md: Heading1,
	pure: ALargeSmall,
	object: TableProperties,
	iframe: AppWindow,
};

const addType: { label: keyof typeof PageType; icon: LucideIcon }[] = [
	{
		label: PageType.md,
		icon: PageTypeIcon.md,
	},
	{
		label: PageType.pure,
		icon: PageTypeIcon.pure,
	},
	{
		label: PageType.object,
		icon: PageTypeIcon.object,
	},
	{
		label: PageType.iframe,
		icon: PageTypeIcon.iframe,
	},
];

export function PageActionAdd({
	setParentOpen,
	parentPage,
	children,
}: React.PropsWithChildren<{
	setParentOpen?: React.Dispatch<React.SetStateAction<boolean>>;
	parentPage?: RouterOutputs["page"]["getByParentId"][0];
}>) {
	const { isMobile } = useSidebar();
	const router = useRouter();
	const session = useSession();

	if (!session?.user) return null;

	const utils = api.useUtils();
	const createPage = api.page.create.useMutation({
		onMutate(variables) {
			const prevParentList = utils.page.getByParentId.getData({
				parentId: variables.parentId,
			});
			const id = variables.id;
			if (!id) return;
			const newPage: RouterOutputs["page"]["getByParentId"][0] = {
				...variables,
				id: id,
				name: variables.name ?? null,
				parentId: variables.parentId ?? null,
				isDeleted: false,
				icon: null,
			};
			// 目录下乐观地添加新页面
			utils.page.getByParentId.setData(
				{
					parentId: variables.parentId,
				},
				(prev) => (prev ? [...prev, newPage] : [newPage]),
			);
			setParentOpen?.(true);

			// 乐观更新
			utils.page.get.setData(
				{
					id: newPage.id,
				},
				{
					...newPage,
					createdById: session.user.id,
					content: "",
					createdAt: new Date(),
					updatedAt: new Date(),
				},
			);
			router.push(`/dashboard/page/${newPage.id}`);
			return {
				prevParentList,
			};
		},
		onError(_error, variables, ctx) {
			utils.page.getByParentId.setData(
				{
					parentId: variables.parentId,
				},
				(prev) => prev?.filter((p) => p.id !== variables.id),
			);
			variables.id &&
				utils.page.get.setData(
					{
						id: variables.id,
					},
					void 0,
				);
			toast.error("新建页面失败");
			// router.back();
		},
		onSuccess: () => {},
	});
	return (
		<DropdownMenu>
			<DropdownMenuTrigger asChild>{children}</DropdownMenuTrigger>
			<DropdownMenuContent
				className="w-56 rounded-lg"
				side={isMobile ? "bottom" : "right"}
				align={isMobile ? "end" : "start"}
			>
				{addType.map((type, index) => (
					<DropdownMenuItem
						key={type.label}
						onClick={() => {
							createPage.mutate({
								type: type.label,
								parentId: parentPage?.id,
								id: generateUUID(),
							});
						}}
					>
						<type.icon className="text-muted-foreground" />
						<span>{type.label}</span>
					</DropdownMenuItem>
				))}
			</DropdownMenuContent>
		</DropdownMenu>
	);
}
