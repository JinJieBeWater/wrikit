import { type RouterInputs, type RouterOutputs, api } from "@/trpc/react";
import { toast } from "sonner";

export const usePageTrash = ({
	page,
	options,
}: {
	page: RouterOutputs["page"]["getByParentId"][0];
	options?: {
		infinitePageInput?: RouterInputs["page"]["infinitePage"];
	};
}) => {
	const utils = api.useUtils();

	const toggleTrash = api.page.toggleTrash.useMutation({
		onMutate(variables) {
			// cache
			const prevParentList = utils.page.getByParentId.getData({
				parentId: page.parentId ?? undefined,
			});

			// optimistic update
			void utils.page.getByParentId.setData(
				{
					parentId: page.parentId ?? undefined,
				},
				(prev) => {
					return prev?.map((p) => {
						if (p.id === variables.id) {
							return { ...p, isDeleted: true };
						}
						return p;
					});
				},
			);

			// cache
			const prevPinned = utils.pagePinned.get.getData(void 0);

			// 处理子页面的pinned 由于为树形结构, 需要递归处理
			const getAllRelatedPages = (rootId: string) => {
				const allPageIds = [];
				const stack = [rootId];

				while (stack.length > 0) {
					const currentId = stack.pop();
					const childPages = utils.page.getByParentId.getData({
						parentId: currentId,
					});
					const childPageIds = childPages?.map((p) => p.id) ?? [];
					allPageIds.push(...childPageIds);
					stack.push(...childPageIds);
				}

				return allPageIds;
			};
			const relatedPageIds = getAllRelatedPages(variables.id);
			void utils.pagePinned.get.setData(void 0, (pinnedPages) => {
				return pinnedPages?.map((p) => {
					if (relatedPageIds.includes(p.id)) {
						return { ...p, isDeleted: variables.isDeleted };
					}
					return p;
				});
			});

			// 处理本身的pinned
			const isPinned = utils.pagePinned.get
				.getData()
				?.some((p) => p.id === page.id);
			if (isPinned) {
				// cache
				// optimistic update
				void utils.pagePinned.get.setData(void 0, (pinnedPages) => {
					return pinnedPages?.map((p) => {
						if (p.id === variables.id) {
							return { ...p, isDeleted: true };
						}
						return p;
					});
				});
			}

			// 缓存无限查询 乐观更新
			const infinitePageInput = options?.infinitePageInput;
			if (infinitePageInput) {
				const prevInfinitePage =
					utils.page.infinitePage.getInfiniteData(infinitePageInput);

				// 乐观更新
				if (!variables.isDeleted) {
					// 在缓存中获取所有相关页面
					const getAllRelatedPagesInInfinitePage = (rootId: string) => {
						const allPageIds = [rootId];
						const stack = [rootId];

						while (stack.length > 0) {
							const currentId = stack.pop();
							const childPages = prevInfinitePage?.pages
								.flatMap((page) => page.items)
								.filter((p) => p.parentId === currentId);
							const childPageIds = childPages?.map((p) => p.id) ?? [];
							allPageIds.push(...childPageIds);
							stack.push(...childPageIds);
						}
						return allPageIds;
					};

					const relatedPageIds = getAllRelatedPagesInInfinitePage(variables.id);
					utils.page.infinitePage.setInfiniteData(
						infinitePageInput,
						(prevInfinitePage) => {
							if (!prevInfinitePage) return prevInfinitePage;
							return {
								pageParams: prevInfinitePage.pageParams,
								pages: prevInfinitePage.pages.map((item) => {
									return {
										meta: item.meta,
										items: item.items.filter(
											(p) => !relatedPageIds.includes(p.id),
										),
									};
								}),
							};
						},
					);
				}

				return {
					prevParentList,
					prevPinned,
					prevInfinitePage,
				};
			}

			return {
				prevParentList,
				prevPinned,
			};
		},
		onError(_error, variables, ctx) {
			utils.page.getByParentId.setData(
				{
					parentId: page.parentId ?? undefined,
				},
				ctx?.prevParentList,
			);
			if (ctx?.prevPinned) {
				utils.pagePinned.get.setData(void 0, ctx.prevPinned);
			}

			const infinitePageInput = options?.infinitePageInput;
			if (ctx?.prevInfinitePage && infinitePageInput) {
				utils.page.infinitePage.setInfiniteData(
					infinitePageInput,
					ctx.prevInfinitePage,
				);
			}

			// toast error
			if (variables.isDeleted) {
				toast.error("Failed to move page to trash");
			} else {
				toast.error("Failed to restore page from trash");
			}
		},
		onSuccess(_data, variables) {
			// trash
			if (variables.isDeleted) {
				utils.page.infinitePage.invalidate();
			} else {
				// 更新目录树
				utils.page.getByParentId.invalidate();
			}
		},
	});
	return { toggleTrash };
};
