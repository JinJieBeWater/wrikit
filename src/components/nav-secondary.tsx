import React from "react";
import {
  Blocks,
  MessageCircleQuestion,
  Settings2,
  Trash2,
  type LucideIcon,
} from "lucide-react";

import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuBadge,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import Link from "next/link";

export function NavSecondary({
  ...props
}: React.ComponentPropsWithoutRef<typeof SidebarGroup>) {
  return (
    <SidebarGroup {...props}>
      <SidebarGroupContent>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton>
              <Settings2 />
              <span>Settings</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton>
              <Blocks />
              <span>Templates</span>
              <SidebarMenuBadge>New</SidebarMenuBadge>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton>
              <Trash2 />
              <span>Trash</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton>
              <MessageCircleQuestion />
              <span>Help</span>
              {/* <SidebarMenuBadge>New</SidebarMenuBadge> */}
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  );
}
