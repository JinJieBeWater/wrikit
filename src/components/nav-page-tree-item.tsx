"use client";

import { SidebarMenuButton, useSidebar } from "./ui/sidebar";
import { memo, useCallback } from "react";
import { type RouterOutputs } from "@/trpc/react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
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
  const router = useRouter();

  const handleClick = useCallback(
    (e: React.MouseEvent) => {
      if (disabled) {
        return;
      }
      if (isMobile) {
        setOpenMobile(false);
      }

      router.push(`/dashboard/page/${page.id}`);
    },
    [disabled, isMobile, setOpenMobile, page.id],
  );

  return (
    <SidebarMenuButton isActive={page.id === id} onClick={handleClick}>
      <PageIcon page={page} />
      <span>{page.name ?? "Untitled"}</span>
    </SidebarMenuButton>
  );
};

export const PageTreeItem = memo(PurePageTreeItem);

PageTreeItem.displayName = "PageTreeItem";
