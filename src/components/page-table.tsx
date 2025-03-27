"use client";

import { api, RouterOutputs } from "@/trpc/react";
import { ColumnDef, SortingState } from "@tanstack/react-table";
import { memo, useCallback, useMemo, useState } from "react";
import dayjs from "dayjs";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";
import { Button } from "./ui/button";
import { MoreHorizontal, Trash2, Undo2 } from "lucide-react";
import { keepPreviousData } from "@tanstack/react-query";
import { DataTable } from "./ui/data-table";
import { usePageTrash } from "@/hooks/use-page-trash";
import { PageIcon } from "./page-icon";

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
    size: 20,
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
    size: 20,
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
  const [sorting, setSorting] = useState<SortingState>([]);

  const { data, isLoading, isError, fetchNextPage, isFetching } =
    api.page.infinitePage.useInfiniteQuery(
      {
        isDeleted: true,
        limit: 20,
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

  return (
    <>
      <DataTable
        columns={columns as ColumnDef<unknown>[]}
        data={flatData}
        rowData={data?.pages}
        fetchNextPage={fetchNextPage}
        isFetching={isFetching}
      />
    </>
  );
};

export const PageTable = memo(PurePageTable);
PageTable.displayName = "PageTable";
