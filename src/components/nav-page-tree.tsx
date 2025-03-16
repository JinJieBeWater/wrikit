import {
  ALargeSmall,
  AppWindow,
  ChevronRight,
  Heading1,
  LucideIcon,
  MoreHorizontal,
  Plus,
  TableProperties,
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
import { Page } from "./nav-pages";
import { useState } from "react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";
import { PageType } from "@/server/db/schema/pages";
import { api } from "@/trpc/react";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "./ui/collapsible";

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

export function NavPageTree({ pages }: { pages: Page[] }) {
  const { isMobile } = useSidebar();

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
          {pages.map((page, index) => (
            <PageTree key={index} page={page} />
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
                createPage.mutate({ type: type.label, name: "新建页面" });
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

export function PageTree({ page }: { page: Page }) {
  const { isMobile } = useSidebar();

  const [open, setOpen] = useState(false);

  return (
    <SidebarMenuItem>
      <Collapsible
        className="group/collapsible [&>a]:hover:pr-8 [&>button]:hover:opacity-100 [&[data-state=open]>button:first-child>svg:first-child]:rotate-90"
        open={open}
        onOpenChange={setOpen}
      >
        <SidebarMenuButton
          asChild
          // onClick={() => setOpen((open) => !open)}
          // className="group-has-[[data-sidebar=menu-action]]/menu-item:pr-0"
        >
          <a href="#">
            <span>{page.emoji}</span>
            <span>{page.name}</span>
          </a>
        </SidebarMenuButton>
        <CollapsibleTrigger asChild>
          <SidebarMenuAction
            className="bg-sidebar-accent text-sidebar-accent-foreground left-2 data-[state=open]:rotate-90"
            showOnHover
          >
            <ChevronRight />
          </SidebarMenuAction>
        </CollapsibleTrigger>
        {/* <SidebarMenuAction className="right-7" showOnHover title="Add">
          <Plus />
          <span className="sr-only">Add</span>
        </SidebarMenuAction> */}
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
              <span>Edit Project</span>
            </DropdownMenuItem>
            <DropdownMenuItem>
              <span>Delete Project</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        <CollapsibleContent>
          <SidebarMenuSub className="ml-2 mr-0 px-0">
            {page.pages ? (
              page.pages?.map((subPage, index) => (
                <PageTree key={index} page={subPage} />
              ))
            ) : (
              <span className="pl-8 text-muted-foreground">No Pages</span>
            )}
          </SidebarMenuSub>
        </CollapsibleContent>
      </Collapsible>
    </SidebarMenuItem>
  );
}
