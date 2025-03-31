"use client";

import { SidebarMenuButton, useSidebar } from "./ui/sidebar";
import { memo, useCallback } from "react";
import { type RouterOutputs } from "@/trpc/react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { PageIcon } from "./page-icon";
const PurePageTreeItem = ({
  page,
  disabled,
}: {
  page: Pick<
    RouterOutputs["page"]["getByParentId"][0],
    "id" | "name" | "icon" | "type"
  >;
  disabled?: boolean;
}) => {
  const { isMobile, setOpenMobile } = useSidebar();
  const { id } = useParams();

  const handleClick = useCallback(
    (e: React.MouseEvent) => {
      if (isMobile) {
        setOpenMobile(false);
      }
    },
    [disabled, isMobile, setOpenMobile, page.id],
  );

  return (
    <SidebarMenuButton asChild isActive={page.id === id}>
      <Link href={`/dashboard/page/${page.id}`} onClick={handleClick}>
        <PageIcon page={page} />
        <span>{page.name ?? "Untitled"}</span>
      </Link>
    </SidebarMenuButton>
  );
};

export const PageTreeItem = memo(PurePageTreeItem);

PageTreeItem.displayName = "PageTreeItem";
