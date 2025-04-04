"use client";

import { type RouterInputs, type RouterOutputs, api } from "@/trpc/react";
import { keepPreviousData } from "@tanstack/react-query";
import { RowData } from "@tanstack/react-table";
import { Delete, LoaderCircle, TrashIcon, Undo2 } from "lucide-react";
import {
	type UIEvent,
	memo,
	useCallback,
	useEffect,
	useMemo,
	useRef,
	useState,
} from "react";
import { toast } from "sonner";
import { PageIcon } from "./page-icon";
import { Button, buttonVariants } from "./ui/button";

import { usePageTrash } from "@/hooks/use-page-trash";
import { cn } from "@/lib/utils";
import { useDebounceCallback } from "usehooks-ts";
import {
	AlertDialog,
	AlertDialogAction,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
	AlertDialogTrigger,
} from "./ui/alert-dialog";
import { Input } from "./ui/input";
import { ScrollAreaRoot, ScrollAreaViewport } from "./ui/scroll-area";
import {
	Tooltip,
	TooltipContent,
	TooltipProvider,
	TooltipTrigger,
} from "./ui/tooltip";

export type searchParams = {
	limit: number;
	name: string;
	isDeleted: boolean;
};

const PurePageListToolBar = ({
	name,
	debouncedSetSearch,
}: {
	name: string;
	debouncedSetSearch: (search: string) => void;
}) => {
	const utils = api.useUtils();
	const clearTrash = api.page.clearTrash.useMutation({
		onMutate() {
			toast.info("正在清空回收站...");
		},
		onSuccess(_data, variables, ctx) {
			toast.success("清空回收站成功");
			utils.page.infinitePage.invalidate({
				isDeleted: true,
				name: name,
				limit: 10,
			});
		},
		onError(_error, variables, ctx) {
			toast.error("清空回收站失败");
		},
	});

	const handleClearTrash = useCallback(() => {
		clearTrash.mutate();
	}, [clearTrash]);
	return (
		<div className="flex items-center justify-between gap-8">
			<Input
				placeholder="Filter name..."
				defaultValue={name}
				onChange={(e) => {
					debouncedSetSearch(e.target.value);
				}}
			/>
			<AlertDialog>
				<TooltipProvider delayDuration={0}>
					<Tooltip>
						<AlertDialogTrigger asChild>
							<TooltipTrigger asChild>
								<Button variant="destructive" size="sm">
									<TrashIcon />
								</Button>
							</TooltipTrigger>
						</AlertDialogTrigger>
						<TooltipContent
							className="bg-destructive text-destructive-foreground"
							align="end"
						>
							<p> Clear Trash </p>
						</TooltipContent>
					</Tooltip>
				</TooltipProvider>
				<AlertDialogContent>
					<AlertDialogHeader>
						<AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
						<AlertDialogDescription>
							This action cannot be undone. This will permanently delete your
							trashed pages and never be recoverable.
						</AlertDialogDescription>
					</AlertDialogHeader>
					<AlertDialogFooter>
						<AlertDialogCancel>Cancel</AlertDialogCancel>
						<AlertDialogAction
							className={cn(
								buttonVariants({
									variant: "destructive",
								}),
							)}
							onClick={handleClearTrash}
						>
							Clear Trash
						</AlertDialogAction>
					</AlertDialogFooter>
				</AlertDialogContent>
			</AlertDialog>
		</div>
	);
};

const PageListToolBar = memo(PurePageListToolBar);
PageListToolBar.displayName = "PageListToolBar";

const PurePageListItem = ({
	item,
	input,
}: {
	item: RouterOutputs["page"]["infinitePage"]["items"][0];
	input: RouterInputs["page"]["infinitePage"];
}) => {
	const utils = api.useUtils();
	const { toggleTrash } = usePageTrash({
		page: item,
		options: {
			infinitePageInput: input,
		},
	});
	const deletePage = api.page.delete.useMutation({
		onMutate() {
			// 取出缓存 用于更新失败后还原
			const prePageList = utils.page.infinitePage.getInfiniteData(input);

			// 乐观更新
			// 获取所有相关页面
			const getAllRelatedPages = (rootId: string) => {
				const allPages = [rootId];
				const stack = [rootId];

				while (stack.length > 0) {
					// 获取当前栈中的所有相关页面
					const childPages = prePageList?.pages
						.flatMap((page) => page.items)
						.filter((p) => p.parentId && stack.includes(p.parentId));
					// 清空stack
					stack.length = 0;

					const childPageIds = childPages?.map((p) => p.id) ?? [];
					allPages.push(...childPageIds);
					stack.push(...childPageIds);
				}

				return allPages;
			};

			const relatedPageIds = getAllRelatedPages(item.id);
			utils.page.infinitePage.setInfiniteData(input, (prevInfinitePage) => {
				if (!prevInfinitePage) return prevInfinitePage;
				return {
					pageParams: prevInfinitePage.pageParams,
					pages: prevInfinitePage.pages.map((item) => {
						return {
							meta: item.meta,
							items: item.items.filter((p) => !relatedPageIds.includes(p.id)),
						};
					}),
				};
			});

			return {
				prePageList,
			};
		},

		onError(error, _variables, ctx) {
			utils.page.infinitePage.setInfiniteData(input, ctx?.prePageList);
			toast.error("Delete failed, please try again");
		},
	});
	return (
		<div className="flex items-center justify-between gap-2 rounded-md p-1 px-2 hover:bg-muted">
			<div className="flex items-center gap-2">
				<PageIcon page={item} />
				<span>{item.name ?? "Untitled"}</span>
			</div>

			<div className="flex items-center gap-2">
				<TooltipProvider delayDuration={0}>
					<Tooltip>
						<TooltipTrigger asChild>
							<Button
								variant="default"
								className="h-8 w-8"
								onClick={() => {
									toggleTrash.mutate({
										id: item.id,
										isDeleted: false,
										parentId: item.parentId ?? undefined,
									});
								}}
							>
								<span className="sr-only">Restore</span>
								<Undo2 className="h-4 w-4" />
							</Button>
						</TooltipTrigger>
						<TooltipContent side="left">
							{item.parentId ? (
								<p>Child page restoring will lose parent relationship</p>
							) : (
								<p>Root page restoring will also restore child pages</p>
							)}
						</TooltipContent>
					</Tooltip>
				</TooltipProvider>

				<TooltipProvider delayDuration={0}>
					<Tooltip>
						<TooltipTrigger asChild>
							<Button
								variant="destructive"
								className="h-8 w-8"
								onClick={() => {
									deletePage.mutate([item.id]);
								}}
							>
								<span className="sr-only">Delete</span>
								<Delete className="h-4 w-4" />
							</Button>
						</TooltipTrigger>
						<TooltipContent
							side="top"
							align="end"
							className="bg-destructive text-destructive-foreground"
						>
							<p>Delete page will permanently delete all related pages</p>
						</TooltipContent>
					</Tooltip>
				</TooltipProvider>
			</div>
		</div>
	);
};

const PageListItem = memo(PurePageListItem);
PageListItem.displayName = "PageListItem";

const PurePageList = () => {
	const [name, setName] = useState("");
	const debouncedSetSearchParams = useDebounceCallback(setName, 500);
	const input = useMemo(
		() => ({
			isDeleted: true,
			limit: 10,
			name: name,
		}),
		[name],
	);
	const { data, fetchNextPage, isFetching } =
		api.page.infinitePage.useInfiniteQuery(input, {
			getNextPageParam: (lastPage) => lastPage.meta.nextCursor,
			refetchOnWindowFocus: false,
			placeholderData: keepPreviousData,
		});

	const flatData = useMemo(
		() => data?.pages.flatMap((page) => page.items) ?? [],
		[data],
	);

	const containerRef = useRef<HTMLDivElement>(null);
	const totalDBRowCount = data?.pages?.at(-1)?.meta?.totalRowCount ?? 0;
	const totalFetched = data?.pages?.length ?? 0;
	const fetchMoreOnBottomReached = useCallback(
		(containerRefElement?: HTMLDivElement | null) => {
			if (containerRefElement) {
				const { scrollHeight, scrollTop, clientHeight } = containerRefElement;
				//once the user has scrolled within 500px of the bottom of the table, fetch more data if we can
				if (
					scrollHeight - scrollTop - clientHeight < 100 &&
					!isFetching &&
					totalFetched < totalDBRowCount
				) {
					fetchNextPage();
				}
			}
		},
		[fetchNextPage, isFetching, totalFetched, totalDBRowCount],
	);

	const handleScroll = useCallback(
		(e: UIEvent<HTMLDivElement, globalThis.UIEvent>) => {
			fetchMoreOnBottomReached(e.currentTarget);
		},
		[fetchMoreOnBottomReached],
	);

	useEffect(() => {
		fetchMoreOnBottomReached(containerRef.current);
	}, [fetchMoreOnBottomReached]);

	return (
		<>
			<PageListToolBar
				name={name}
				debouncedSetSearch={debouncedSetSearchParams}
			/>
			<ScrollAreaRoot ref={containerRef} className="relative h-[40vh]">
				<ScrollAreaViewport onScroll={handleScroll}>
					<div className="mr-1">
						{isFetching && (
							<div className="flex items-center justify-center">
								<LoaderCircle className="h-4 w-4 animate-spin" />
							</div>
						)}
						{flatData.length === 0 && !isFetching ? (
							<p className="text-center text-muted-foreground">
								No trashed pages
							</p>
						) : (
							flatData.map((item) => (
								<PageListItem item={item} key={item.id} input={input} />
							))
						)}
					</div>
				</ScrollAreaViewport>
			</ScrollAreaRoot>
		</>
	);
};

export const PageList = memo(PurePageList);
PageList.displayName = "PageList";
