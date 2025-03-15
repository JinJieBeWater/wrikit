import {
  Collapsible,
  CollapsibleTrigger,
  CollapsibleContent,
} from "@radix-ui/react-collapsible";
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
} from "./ui/sidebar";
import { Page } from "./nav-pages";
import { useState } from "react";

export function NavPageTree({ pages }: { pages: Page[] }) {
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
    </SidebarGroup>
  );
}

export function PageTree({ page }: { page: Page }) {
  if (!page.pages) {
    return (
      <SidebarMenuButton className="data-[active=true]:bg-transparent" asChild>
        <a href="#">
          <span>{page.emoji}</span>
          <span>{page.name}</span>
        </a>
      </SidebarMenuButton>
    );
  }

  const [open, setOpen] = useState(false);

  return (
    <SidebarMenuItem>
      <Collapsible
        className="group/collapsible [&[data-state=open]>button>svg:first-child]:rotate-90"
        defaultOpen={page.name === "components" || page.name === "ui"}
        open={open}
        onOpenChange={setOpen}
      >
        <SidebarMenuButton asChild onClick={() => setOpen((open) => !open)}>
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
        <SidebarMenuAction showOnHover>
          <Plus />
        </SidebarMenuAction>
        <CollapsibleContent>
          <SidebarMenuSub className="ml-2 mr-0 px-0">
            {page.pages?.map((subPage, index) => (
              <PageTree key={index} page={subPage} />
            ))}
          </SidebarMenuSub>
        </CollapsibleContent>
      </Collapsible>
    </SidebarMenuItem>
  );
}
