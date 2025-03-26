"use client";

import { api, RouterOutputs } from "@/trpc/react";
import { ColumnDef } from "@tanstack/react-table";
import { DataTable } from "./ui/data-table";
import { memo } from "react";

export type page = RouterOutputs["page"]["getAllInTrash"][0];

export const columns: ColumnDef<page>[] = [
  {
    accessorKey: "name",
    header: "Name",
  },
  {
    accessorKey: "email",
    header: "Type",
  },
  {
    accessorKey: "icon",
    header: "Icon",
  },
  {
    accessorKey: "createdAt",
    header: "Created At",
    cell: ({ row }) => {
      const date = row.getValue("createdAt") as Date;
      return date ? date.toLocaleString() : "-";
    },
  },
  {
    accessorKey: "updatedAt",
    header: "Updated At",
    cell: ({ row }) => {
      const date = row.getValue("updatedAt") as Date;
      return date ? date.toLocaleString() : "-";
    },
  },
];

const PurePageTable = () => {
  const { data, isLoading, isError } = api.page.getAllInTrash.useQuery();

  return (
    <div className="container mx-auto py-10">
      <DataTable columns={columns} data={data ?? []} />
    </div>
  );
};

export const PageTable = memo(PurePageTable);
PageTable.displayName = "PageTable";
