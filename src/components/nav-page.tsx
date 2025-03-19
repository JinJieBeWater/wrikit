"use client";

import { ChevronRight, Plus } from "lucide-react";
import {
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuAction,
  SidebarMenuSub,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarGroupContent,
  SidebarMenu,
  SidebarGroupAction,
} from "./ui/sidebar";
import { createContext, Suspense, useEffect, useState } from "react";
import { api } from "@/trpc/react";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "./ui/collapsible";
import { type Page } from "@/types/page";
import Link from "next/link";
import { useParams } from "next/navigation";
import { PageIcon } from "./page-icon";
import { PageAddButton } from "./page-add-button";
import { PageAction } from "./page-action";
import { PageWithPinned } from "@/server/api/routers/pagePinned";

export const PageTreeContext = createContext<PageWithPinned[]>([]);

export function NavPage() {
  const [roots] = api.page.getByParentId.useSuspenseQuery({});
  const [pagesPinned] = api.pagePinned.get.useSuspenseQuery();

  return (
    <PageTreeContext.Provider value={pagesPinned}>
      <SidebarGroup>
        <SidebarGroupLabel>Private</SidebarGroupLabel>
        <SidebarGroupContent>
          <SidebarMenu>
            {roots.map((page) => (
              <PageTree key={page.id} page={page} />
            ))}
          </SidebarMenu>
        </SidebarGroupContent>

        <PageAddButton>
          <SidebarGroupAction title="Add Page">
            <Plus /> <span className="sr-only">Add Page</span>
          </SidebarGroupAction>
        </PageAddButton>
      </SidebarGroup>
    </PageTreeContext.Provider>
  );
}

export function PageTree({ page }: { page: Page }) {
  const { id } = useParams();
  const [open, setOpen] = useState(false);

  const getChildren = api.page.getByParentId.useQuery({
    parentId: page.id,
  });

  useEffect(() => {
    if (open === true) {
      void getChildren.refetch();
    }
  }, [open]);

  return (
    <SidebarMenuItem>
      <Collapsible
        className="group/collapsible [&>a]:hover:pr-11 [&>button]:hover:opacity-100 [&[data-state=open]>button:first-child>svg:first-child]:rotate-90"
        open={open}
        onOpenChange={setOpen}
      >
        <SidebarMenuButton
          asChild
          isActive={page.id === Number(id)}
          // onClick={() => setOpen((open) => !open)}
          // className="group-has-[[data-sidebar=menu-action]]/menu-item:pr-0"
        >
          <Link href={`/dashboard/page/${page.id}?name=${page.name}`}>
            <PageIcon icon={page.icon} />
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
        <PageAddButton parentPage={page} setParentOpen={setOpen}>
          <SidebarMenuAction className="right-6" showOnHover title="Add">
            <Plus />
            <span className="sr-only">Add</span>
          </SidebarMenuAction>
        </PageAddButton>

        <PageAction page={page} />

        <CollapsibleContent>
          <SidebarMenuSub className="ml-2 mr-0 px-0">
            <Suspense
              fallback={
                <span className="flex h-8 items-center pl-8 text-muted-foreground">
                  Loading...
                </span>
              }
            >
              {getChildren.data && getChildren.data.length > 0 ? (
                getChildren.data?.map((subPage, index) => (
                  <PageTree key={index} page={subPage} />
                ))
              ) : getChildren.isPending ? (
                <span className="flex h-8 items-center pl-8 text-muted-foreground">
                  Loading...
                </span>
              ) : (
                <span className="flex h-8 items-center pl-8 text-muted-foreground">
                  No Page Inside
                </span>
              )}
            </Suspense>
          </SidebarMenuSub>
        </CollapsibleContent>
      </Collapsible>
    </SidebarMenuItem>
  );
}
