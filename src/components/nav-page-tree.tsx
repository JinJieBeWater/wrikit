"use client";

import { ChevronRight, Plus } from "lucide-react";
import {
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuAction,
  SidebarMenuSub,
  useSidebar,
} from "./ui/sidebar";
import { memo, useRef, useState } from "react";
import { api, RouterOutputs } from "@/trpc/react";
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

export function PurePageTree({
  page,
  initialStack,
}: {
  page: RouterOutputs["page"]["getByParentId"][0];
  initialStack?: RouterOutputs["page"]["getByParentId"];
}) {
  const { id } = useParams();

  const [open, setOpen] = useState(false);
  const { isMobile, setOpenMobile } = useSidebar();

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
        className="group/collapsible [&>a]:hover:pr-11 [&>button]:hover:opacity-100 [&[data-state=open]>button:first-child>svg:first-child]:rotate-90"
        open={open}
        onOpenChange={setOpen}
      >
        <SidebarMenuButton asChild isActive={page.id === Number(id)}>
          <Link
            href={`/dashboard/page/${page.id}`}
            onClick={() => {
              if (isMobile) {
                setOpenMobile(false);
              }
            }}
          >
            <PageIcon page={page} />
            <span>{page.name ?? "Untitled"}</span>
          </Link>
        </SidebarMenuButton>
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
              data?.map((subPage, index) => (
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
}

export const PageTree = memo(PurePageTree);

PurePageTree.displayName = "PageTree";
