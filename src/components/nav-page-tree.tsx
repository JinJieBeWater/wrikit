"use client";

import {
  ArrowUpRight,
  ChevronRight,
  CopyPlus,
  LinkIcon,
  MoreHorizontal,
  Pin,
  Plus,
  Trash2,
} from "lucide-react";
import {
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuAction,
  SidebarMenuSub,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarGroupContent,
  SidebarMenu,
  useSidebar,
  SidebarGroupAction,
} from "./ui/sidebar";
import { Suspense, useCallback, useEffect, useState } from "react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";
import { api } from "@/trpc/react";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "./ui/collapsible";
import { type Page } from "@/types/page";
import Link from "next/link";
import { toast } from "sonner";
import { useParams } from "next/navigation";
import { PageIcon } from "./page-icon";
import { PageAddButton } from "./page-add-button";

export function NavPageTree({ id }: { id: string }) {
  const [roots] = api.page.getByParentId.useSuspenseQuery({});

  return (
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
  );
}

export function PageTree({ page }: { page: Page }) {
  const { isMobile } = useSidebar();
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

  const utils = api.useUtils();

  const invalidateCache = useCallback(() => {
    if (page.parentId) {
      void utils.page.getByParentId.invalidate({
        parentId: page.parentId,
      });
    } else {
      void utils.page.getByParentId.invalidate({});
    }
  }, [page.parentId, utils]);

  const toggleTrash = api.page.toggleTrash.useMutation({
    onMutate(variables) {
      if (variables.isDeleted) {
        toast.loading("Moving page to trash...");
      } else {
        toast.loading("Restoring page from trash...");
      }
    },
    onSuccess: async (_data, variables) => {
      invalidateCache();
      toast.dismiss();
      if (variables.isDeleted) {
        toast.success("Page moved to trash", {
          description: "You can restore it from the trash",
          action: {
            label: "restore",
            onClick: () =>
              toggleTrash.mutate({
                id: variables.id,
                isDeleted: false,
              }),
          },
        });
      } else {
        toast.success("Page restored from trash");
      }
    },
  });

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
          <Link href={`/dashboard/page/${page.id}`}>
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

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <SidebarMenuAction showOnHover title="More">
              <MoreHorizontal />
              <span className="sr-only">More</span>
            </SidebarMenuAction>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            className="w-56 rounded-lg"
            side={isMobile ? "bottom" : "right"}
            align={isMobile ? "end" : "start"}
          >
            <DropdownMenuItem>
              <Pin className="text-muted-foreground" />
              <span>Pin</span>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem>
              <ArrowUpRight className="text-muted-foreground" />
              <span>Open in New Tab</span>
            </DropdownMenuItem>
            {/* <DropdownMenuItem>
              <Share2 className="text-muted-foreground" />
              <span>Share</span>
            </DropdownMenuItem> */}
            <DropdownMenuItem>
              <LinkIcon className="text-muted-foreground" />
              <span>Copy Link</span>
            </DropdownMenuItem>
            <DropdownMenuItem>
              <CopyPlus className="text-muted-foreground" />
              <span>Add a Copy</span>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={() =>
                toggleTrash.mutateAsync({ id: page.id, isDeleted: true })
              }
            >
              <Trash2 className="text-muted-foreground" />
              <span>Move to Trash</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

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
