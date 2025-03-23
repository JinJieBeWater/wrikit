"use client";

import { Plus } from "lucide-react";
import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarGroupContent,
  SidebarMenu,
  SidebarGroupAction,
} from "./ui/sidebar";
import { api } from "@/trpc/react";
import { PageActionAdd } from "./page-action-add";
import { PageTree } from "./nav-page-tree";

export function NavPage() {
  const [roots] = api.page.getByParentId.useSuspenseQuery({});

  return (
    <SidebarGroup>
      <SidebarGroupLabel>Private</SidebarGroupLabel>
      <SidebarGroupContent>
        <SidebarMenu>
          {roots
            .filter((page) => !page.isDeleted)
            .map((page) => (
              <PageTree key={page.id} page={page} />
            ))}
        </SidebarMenu>
      </SidebarGroupContent>

      <PageActionAdd>
        <SidebarGroupAction title="Add Page">
          <Plus /> <span className="sr-only">Add Page</span>
        </SidebarGroupAction>
      </PageActionAdd>
    </SidebarGroup>
  );
}
export { PageTree };
