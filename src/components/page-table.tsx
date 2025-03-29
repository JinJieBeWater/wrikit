"use client";

import { api, RouterOutputs } from "@/trpc/react";
import { memo, useCallback, useEffect, useMemo, useRef, useState } from "react";
import dayjs from "dayjs";
import { Button } from "./ui/button";
import { Trash2, Undo2 } from "lucide-react";
import { keepPreviousData } from "@tanstack/react-query";
import { usePageTrash } from "@/hooks/use-page-trash";
import { PageIcon } from "./page-icon";
import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Input } from "./ui/input";
import { ScrollAreaViewport } from "@radix-ui/react-scroll-area";
import { ScrollAreaRoot } from "./ui/scroll-area";
import { useDebounceCallback } from "usehooks-ts";

export type Page = RouterOutputs["page"]["infinitePage"]["items"][0];

export const columns: ColumnDef<Page>[] = [
  {
    accessorKey: "name",
    header: "Name",
    cell: ({ row }) => (
      <span className="truncate">{row.getValue("name") ?? "Untitled"}</span>
    ),
  },
  {
    accessorKey: "icon",
    header: "Icon",
    cell: ({ row }) => <PageIcon page={row.original} />,
  },
  {
    accessorKey: "type",
    header: "Type",
  },
  {
    accessorKey: "updatedAt",
    header: "Delete At",
    cell: ({ row }) => {
      const date = row.getValue("updatedAt") as Date;
      return date ? dayjs(date).format("YYYY/MM/DD") : "-";
    },
  },
  {
    accessorKey: "restore",
    id: "restore",
    header: "Restore",
    cell: ({ row }) => {
      const { toggleTrash } = usePageTrash({
        page: row.original,
      });
      const handleClick = useCallback(() => {
        toggleTrash.mutate({
          id: row.original.id,
          isDeleted: false,
        });
      }, [toggleTrash, row.original.id]);
      return (
        <Button variant="ghost" className="h-8 w-8 p-0" onClick={handleClick}>
          <span className="sr-only">Restore</span>
          <Undo2 className="h-4 w-4 text-muted-foreground" />
        </Button>
      );
    },
  },
  {
    accessorKey: "delete",
    id: "delete",
    header: "Delete",
    cell: ({ row }) => {
      return (
        <Button variant="ghost" className="h-8 w-8 p-0">
          <span className="sr-only">Delete</span>
          <Trash2 className="h-4 w-4 text-muted-foreground" />
        </Button>
      );
    },
  },
];

const PurePageTable = () => {
  const [search, setSearch] = useState("");
  const debouncedSetSearch = useDebounceCallback(setSearch, 500);
  const { data, isLoading, isError, fetchNextPage, isFetching } =
    api.page.infinitePage.useInfiniteQuery(
      {
        isDeleted: true,
        limit: 20,
        search: search,
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

  //we need a reference to the scrolling element for logic down below
  const tableContainerRef = useRef<HTMLDivElement>(null);

  const totalDBRowCount = data?.pages?.at(-1)?.meta?.totalRowCount ?? 0;
  const totalFetched = data?.pages?.length ?? 0;

  //called on scroll and possibly on mount to fetch more data as the user scrolls and reaches bottom of table
  const fetchMoreOnBottomReached = useCallback(
    (containerRefElement?: HTMLDivElement | null) => {
      if (containerRefElement) {
        const { scrollHeight, scrollTop, clientHeight } = containerRefElement;
        //once the user has scrolled within 500px of the bottom of the table, fetch more data if we can
        if (
          scrollHeight - scrollTop - clientHeight < 500 &&
          !isFetching &&
          totalFetched < totalDBRowCount
        ) {
          fetchNextPage();
        }
      }
    },
    [fetchNextPage, isFetching, totalFetched, totalDBRowCount],
  );

  const table = useReactTable({
    data: flatData,
    columns,
    state: {},
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),

    // Filter configuration
    manualFiltering: true,

    manualSorting: true,
  });

  useEffect(() => {
    fetchMoreOnBottomReached(tableContainerRef.current);
  }, []);

  table.setOptions((prev) => ({
    ...prev,
  }));

  //scroll to top of table when sorting changes
  // const handleSortingChange: OnChangeFn<SortingState> = (updater) => {
  //   setSorting(updater);
  //   if (!!table.getRowModel().rows.length) {
  //     rowVirtualizer.scrollToIndex?.(0);
  //   }
  // };

  //since this table option is derived from table row model state, we're using the table.setOptions utility
  // table.setOptions((prev) => ({
  //   ...prev,
  //   onSortingChange: handleSortingChange,
  // }));

  // const { rows } = table.getRowModel();

  // const rowVirtualizer = useVirtualizer({
  //   count: rows.length,
  //   estimateSize: () => 33, //estimate row height for accurate scrollbar dragging
  //   getScrollElement: () => tableContainerRef.current,
  //   //measure dynamic row height, except in firefox because it measures table border height incorrectly
  //   measureElement:
  //     typeof window !== "undefined" &&
  //     navigator.userAgent.indexOf("Firefox") === -1
  //       ? (element) => element?.getBoundingClientRect().height
  //       : undefined,
  //   overscan: 5,
  // });

  return (
    <>
      <div className="flex items-center">
        <Input
          placeholder="Filter name..."
          defaultValue={search}
          onChange={(e) => {
            debouncedSetSearch(e.target.value);
          }}
        />
      </div>
      <ScrollAreaRoot
        ref={tableContainerRef}
        className="relative h-[50vh] overflow-auto"
      >
        <ScrollAreaViewport
          onScroll={(e) => {
            fetchMoreOnBottomReached(e.currentTarget);
          }}
        >
          <Table>
            <TableHeader className="sticky top-0 bg-background">
              {table.getHeaderGroups().map((headerGroup) => (
                <TableRow key={headerGroup.id}>
                  {headerGroup.headers.map((header) => {
                    return (
                      <TableHead key={header.id}>
                        {header.isPlaceholder
                          ? null
                          : flexRender(
                              header.column.columnDef.header,
                              header.getContext(),
                            )}
                      </TableHead>
                    );
                  })}
                </TableRow>
              ))}
            </TableHeader>
            <TableBody>
              {table.getRowModel().rows?.length ? (
                table.getRowModel().rows.map((row) => (
                  <TableRow
                    key={row.id}
                    data-state={row.getIsSelected() && "selected"}
                  >
                    {row.getVisibleCells().map((cell) => (
                      <TableCell key={cell.id}>
                        {flexRender(
                          cell.column.columnDef.cell,
                          cell.getContext(),
                        )}
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell
                    colSpan={columns.length}
                    className="h-24 text-center"
                  >
                    No results.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </ScrollAreaViewport>
      </ScrollAreaRoot>
    </>
  );
};

export const PageTable = memo(PurePageTable);
PageTable.displayName = "PageTable";
