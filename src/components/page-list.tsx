"use client";

import { api, RouterOutputs } from "@/trpc/react";
import {
  memo,
  UIEvent,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { Button, buttonVariants } from "./ui/button";
import { Undo2, TrashIcon, Delete, LoaderCircle } from "lucide-react";
import { keepPreviousData } from "@tanstack/react-query";
import { toast } from "sonner";
import { PageIcon } from "./page-icon";
import { RowData } from "@tanstack/react-table";

import { Input } from "./ui/input";
import { ScrollAreaRoot, ScrollAreaViewport } from "./ui/scroll-area";
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
import { cn } from "@/lib/utils";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "./ui/tooltip";

export type Page = RouterOutputs["page"]["infinitePage"]["items"][0];

export type searchParams = {
  limit: number;
  name: string;
  isDeleted: boolean;
};

declare module "@tanstack/react-table" {
  interface TableMeta<TData extends RowData> {
    searchParams: searchParams;
  }
}

// export const columns: ColumnDef<Page>[] = [
//   {
//     accessorKey: "name",
//     header: "Name",
//     cell: ({ row }) => (
//       <span className="truncate">{row.getValue("name") ?? "Untitled"}</span>
//     ),
//   },
//   {
//     accessorKey: "icon",
//     header: "Icon",
//     cell: ({ row }) => <PageIcon page={row.original} />,
//   },
//   {
//     accessorKey: "type",
//     header: "Type",
//   },
//   {
//     accessorKey: "updatedAt",
//     header: "Delete At",
//     cell: ({ row }) => {
//       const date = row.getValue("updatedAt") as Date;
//       return date ? dayjs(date).format("MM/DD HH:mm") : "-";
//     },
//   },
//   {
//     accessorKey: "restore",
//     id: "restore",
//     header: "Restore",
//     cell: ({ row, table }) => {
//       const meta = table.options.meta;
//       const { toggleTrash } = usePageTrash({
//         page: row.original,
//         options: {
//           searchParams: meta?.searchParams,
//         },
//       });
//       const handleClick = useCallback(() => {
//         const page = row.original;
//         toggleTrash.mutate({
//           id: row.original.id,
//           isDeleted: false,
//         });
//       }, [toggleTrash, row]);
//       return (
//         <TooltipProvider delayDuration={0}>
//           <Tooltip>
//             <TooltipTrigger asChild>
//               <Button
//                 variant="ghost"
//                 className="h-8 w-8 p-0"
//                 onClick={handleClick}
//               >
//                 <span className="sr-only">Restore</span>
//                 <Undo2 className="h-4 w-4 text-muted-foreground" />
//               </Button>
//             </TooltipTrigger>
//             <TooltipContent>
//               {row.original.parentId ? (
//                 <p>
//                   This is a child page. Direct restore will lose the
//                   relationship to the parent page
//                 </p>
//               ) : (
//                 <p>
//                   This is a root page. Restoring this page will also restore all
//                   its child pages
//                 </p>
//               )}
//             </TooltipContent>
//           </Tooltip>
//         </TooltipProvider>
//       );
//     },
//   },
//   {
//     accessorKey: "delete",
//     id: "delete",
//     header: "Delete",
//     cell: ({ row }) => {
//       return (
//         <Button variant="ghost" className="h-8 w-8 p-0">
//           <span className="sr-only">Delete</span>
//           <Trash2 className="h-4 w-4 text-muted-foreground" />
//         </Button>
//       );
//     },
//   },
// ];

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
PageListToolBar.displayName = "PageTableToolBar";

const PurePageListItem = ({
  item,
}: {
  item: RouterOutputs["page"]["infinitePage"]["items"][0];
}) => {
  return (
    <div className="flex items-center justify-between gap-2 rounded-md p-1 px-2 hover:bg-muted">
      <div className="flex items-center gap-2">
        <PageIcon page={item} />
        <span>{item.name}</span>
      </div>

      <div className="flex items-center gap-2">
        <Button variant="default" className="h-8 w-8 p-0">
          <span className="sr-only">Restore</span>
          <Undo2 className="h-4 w-4" />
        </Button>
        <Button variant="destructive" className="h-8 w-8 p-0">
          <span className="sr-only">Delete</span>
          <Delete className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
};

const PageListItem = memo(PurePageListItem);
PageListItem.displayName = "PageTableRow";

const PurePageList = () => {
  const [name, setName] = useState("");
  const debouncedSetSearchParams = useDebounceCallback(setName, 500);
  const { data, fetchNextPage, isFetching } =
    api.page.infinitePage.useInfiniteQuery(
      {
        isDeleted: true,
        limit: 10,
        name: name,
      },
      {
        getNextPageParam: (lastPage) => lastPage.meta.nextCursor,
        refetchOnWindowFocus: false,
        placeholderData: keepPreviousData,
      },
    );

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
  }, []);

  return (
    <>
      <PageListToolBar
        name={name}
        debouncedSetSearch={debouncedSetSearchParams}
      />
      <ScrollAreaRoot ref={containerRef} className="relative h-[40vh]">
        <ScrollAreaViewport onScroll={handleScroll}>
          <div className="mr-2">
            {isFetching && (
              <div className="flex items-center justify-center">
                <LoaderCircle className="h-4 w-4 animate-spin" />
              </div>
            )}
            {flatData.map((item) => (
              <PageListItem item={item} key={item.id} />
            ))}
          </div>
        </ScrollAreaViewport>
      </ScrollAreaRoot>
    </>
  );
};

export const PageList = memo(PurePageList);
PageList.displayName = "PageTable";
