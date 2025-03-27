"use client";

import { ChevronRight, Plus } from "lucide-react";
import {
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuAction,
  SidebarMenuSub,
  useSidebar,
} from "./ui/sidebar";
import { memo, useCallback, useRef, useState } from "react";
import { api, type RouterOutputs } from "@/trpc/react";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "./ui/collapsible";
import Link from "next/link";
import { useParams } from "next/navigation";
import { PageIcon } from "./page-icon";
import { PageAction } from "./page-action";
import { PageActionAdd } from "./page-action-add";
import { cn } from "@/lib/utils";

const PurePageTreeItem = ({
  page,
}: {
  page: Pick<
    RouterOutputs["page"]["getByParentId"][0],
    "id" | "name" | "icon" | "type"
  >;
}) => {
  const { isMobile, setOpenMobile } = useSidebar();
  const { id } = useParams();

  const handleClick = useCallback(() => {
    if (isMobile) {
      setOpenMobile(false);
    }
  }, [isMobile, setOpenMobile]);
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

const PurePageTree = ({
  page,
  initialStack,
}: {
  page: RouterOutputs["page"]["getByParentId"][0];
  initialStack?: RouterOutputs["page"]["getByParentId"];
}) => {
  const [open, setOpen] = useState(false);
  const { isMobile } = useSidebar();

  const { data, isLoading, isError } = api.page.getByParentId.useQuery(
    {
      parentId: page.id,
    },
    {
      refetchOnMount: false,
    },
  );

  const stack = useRef(initialStack ? [...initialStack, page] : [page]);

  return (
    <SidebarMenuItem>
      <Collapsible
        className={cn(
          "group/collapsible [&>button]:hover:opacity-100 [&[data-state=open]>button:first-child>svg:first-child]:rotate-90",
          isMobile ? "[&>a]:pr-11" : "[&>a]:hover:pr-11",
        )}
        open={open}
        onOpenChange={setOpen}
      >
        <PageTreeItem page={page} />
        <CollapsibleTrigger asChild>
          <SidebarMenuAction
            className="left-2 bg-sidebar-accent text-sidebar-accent-foreground data-[state=open]:rotate-90"
            showOnHover
          >
            <ChevronRight />
          </SidebarMenuAction>
        </CollapsibleTrigger>
        <PageActionAdd parentPage={page} setParentOpen={setOpen}>
          <SidebarMenuAction className="right-6" showOnHover title="Add">
            <Plus />
            <span className="sr-only">Add</span>
          </SidebarMenuAction>
        </PageActionAdd>

        <PageAction page={page} />

        <CollapsibleContent>
          <SidebarMenuSub className="ml-2 mr-0 px-0">
            {isError ? (
              <span className="flex h-8 items-center pl-8 text-destructive">
                Failed to load data
              </span>
            ) : isLoading ? (
              <span className="flex h-8 items-center pl-8 text-muted-foreground">
                Loading...
              </span>
            ) : data && data.length > 0 ? (
              data
                ?.filter((subPage) => !subPage.isDeleted)
                .map((subPage, index) => (
                  <PurePageTree
                    key={index}
                    page={subPage}
                    initialStack={stack.current}
                  />
                ))
            ) : (
              <span className="flex h-8 items-center pl-8 text-muted-foreground">
                Nothing Inside
              </span>
            )}
          </SidebarMenuSub>
        </CollapsibleContent>
      </Collapsible>
    </SidebarMenuItem>
  );
};

export const PageTree = memo(PurePageTree);

PurePageTree.displayName = "PageTree";
