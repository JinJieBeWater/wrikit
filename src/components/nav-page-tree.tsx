"use client";

import {
  ALargeSmall,
  AppWindow,
  ArrowUpRight,
  ChevronRight,
  CopyPlus,
  FileText,
  Heading1,
  LinkIcon,
  type LucideIcon,
  MoreHorizontal,
  PiIcon,
  Pin,
  Plus,
  TableProperties,
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
  SidebarGroupAction,
  useSidebar,
} from "./ui/sidebar";
import { Suspense, useEffect, useState } from "react";
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
import {
  type Page,
  PageType,
  type PageTree as PageTreeType,
} from "@/types/page";
import Link from "next/link";
import { toast } from "sonner";
import { useParams } from "next/navigation";

const addType: { label: keyof typeof PageType; icon: LucideIcon }[] = [
  {
    label: PageType.md,
    icon: Heading1,
  },
  {
    label: PageType.pure,
    icon: ALargeSmall,
  },
  {
    label: PageType.object,
    icon: TableProperties,
  },
  {
    label: PageType.iframe,
    icon: AppWindow,
  },
];

export function NavPageTree({ id }: { id: string }) {
  const { isMobile } = useSidebar();

  const [roots] = api.page.getRoots.useSuspenseQuery({
    authorId: id,
  });

  const utils = api.useUtils();
  const createPage = api.page.create.useMutation({
    onSuccess: async () => {
      await utils.page.invalidate();
    },
  });

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

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <SidebarGroupAction title="Add Page">
            <Plus /> <span className="sr-only">Add Page</span>
          </SidebarGroupAction>
        </DropdownMenuTrigger>
        <DropdownMenuContent
          className="w-56 rounded-lg"
          side={isMobile ? "bottom" : "right"}
          align={isMobile ? "end" : "start"}
        >
          {addType.map((type, index) => (
            <DropdownMenuItem
              key={index}
              onClick={() => {
                createPage.mutate({ type: type.label });
              }}
            >
              <type.icon className="text-muted-foreground" />
              <span>{type.label}</span>
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
    </SidebarGroup>
  );
}

export function PageTreeIconn({ icon }: { icon: PageTreeType["icon"] }) {
  if (!icon) return <FileText className="text-muted-foreground" />;

  // const { type, value } = icon;
  return <PiIcon className="text-muted-foreground" />;
}

export function PageTree({ page }: { page: Page }) {
  const { isMobile } = useSidebar();
  const { id } = useParams();

  const [open, setOpen] = useState(false);

  const getChildren = api.page.ByParentId.useQuery(
    {
      parentId: page.id,
    },
    {
      enabled: false,
    },
  );

  useEffect(() => {
    if (open) {
      void getChildren.refetch();
    }
  }, [open, getChildren]);

  const utils = api.useUtils();

  const restorePageFromTrash = api.page.restoreFromTrash.useMutation({
    onSuccess: async () => {
      await utils.page.getRoots.invalidate();
      toast.success("Page restored from trash");
    },
  });

  const movePageToTrash = api.page.moveToTrash.useMutation({
    onMutate() {
      toast.loading("Moving page to trash...");
    },
    onSuccess: async (_data, variables) => {
      await utils.page.getRoots.invalidate();
      toast.dismiss();
      toast.success("Page moved to trash", {
        description: "You can restore it from the trash",
        action: {
          label: "restore",
          onClick: () =>
            restorePageFromTrash.mutate({
              id: variables.id,
            }),
        },
      });
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
            <PageTreeIconn icon={page.icon} />
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
        <SidebarMenuAction className="right-6" showOnHover title="Add">
          <Plus />
          <span className="sr-only">Add</span>
        </SidebarMenuAction>
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
              onClick={() => movePageToTrash.mutateAsync({ id: page.id })}
            >
              <Trash2 className="text-muted-foreground" />
              <span>Move to Trash</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        <CollapsibleContent>
          <SidebarMenuSub className="ml-2 mr-0 px-0">
            {/* {page.child.length > 0 ? (
              page.child?.map((subPage, index) => (
                <PageTree key={index} page={subPage} />
              ))
            ) : (
              <span className="pl-8 text-muted-foreground">No Pages</span>
            )} */}
            <Suspense
              fallback={
                <span className="pl-8 text-muted-foreground">Loading...</span>
              }
            >
              {getChildren.data && getChildren.data.length > 0 ? (
                getChildren.data?.map((subPage, index) => (
                  <PageTree key={index} page={subPage} />
                ))
              ) : (
                <span className="pl-8 text-muted-foreground">No Pages</span>
              )}
            </Suspense>
          </SidebarMenuSub>
        </CollapsibleContent>
      </Collapsible>
    </SidebarMenuItem>
  );
}
