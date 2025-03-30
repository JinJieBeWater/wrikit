"use client";

import {
  ColumnDef,
  ColumnFiltersState,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getSortedRowModel,
  OnChangeFn,
  SortingState,
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
import { memo, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useVirtualizer } from "@tanstack/react-virtual";
import { ScrollArea, ScrollAreaRoot, ScrollAreaViewport } from "./scroll-area";
import { RouterOutputs } from "@/trpc/react";
import { Input } from "./input";

interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[];
  data: TData[];
  fetchNextPage: () => void;
  isFetching: boolean;
  rowData: RouterOutputs["page"]["infinitePage"][] | undefined;
}

const PureDataTable = <TData, TValue>({
  columns,
  data,
  rowData,
  fetchNextPage,
  isFetching,
}: DataTableProps<TData, TValue>) => {
  //we need a reference to the scrolling element for logic down below
  const tableContainerRef = useRef<HTMLDivElement>(null);

  const totalDBRowCount = rowData?.at(-1)?.meta?.totalRowCount ?? 0;
  const totalFetched = data.length;

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

  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);

  const table = useReactTable({
    data,
    columns,
    state: {
      sorting,
      columnFilters,
    },
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),

    // Filter configuration
    onColumnFiltersChange: setColumnFilters,
    manualFiltering: true,

    manualSorting: true,
  });

  useEffect(() => {
    fetchMoreOnBottomReached(tableContainerRef.current);
  }, []);

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
      <div className="flex items-center py-4">
        <Input
          placeholder="Filter emails..."
          value={(table.getColumn("name")?.getFilterValue() as string) ?? ""}
          onChange={(event) =>
            table.getColumn("name")?.setFilterValue(event.target.value)
          }
          className="max-w-sm"
        />
      </div>
      <ScrollAreaRoot
        ref={tableContainerRef}
        className="relative h-[50vh] overflow-auto rounded-md border"
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

export const DataTable = memo(PureDataTable);
DataTable.displayName = "DataTable";
