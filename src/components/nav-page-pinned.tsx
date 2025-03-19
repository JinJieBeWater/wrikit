"use client";

import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarGroupContent,
  SidebarMenu,
} from "./ui/sidebar";
import { api } from "@/trpc/react";
import { PageTree, PageTreeContext } from "./nav-page";

export function NavPagePinned() {
  const [roots] = api.pagePinned.get.useSuspenseQuery();

  return (
    <>
      <PageTreeContext.Provider value={roots}>
        {roots.length > 0 && (
          <SidebarGroup>
            <SidebarGroupLabel>Pinned</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {roots.map((page) => (
                  <PageTree key={page.id} page={page} />
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}
      </PageTreeContext.Provider>
    </>
  );
}
