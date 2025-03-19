"use client";

import * as React from "react";
import {
  AudioWaveform,
  Command,
  Home,
  Inbox,
  Search,
  Sparkles,
} from "lucide-react";

import { NavMain } from "@/components/nav-main";
import { NavSecondary } from "@/components/nav-secondary";
import { TeamSwitcher } from "@/components/team-switcher";
import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarRail,
} from "@/components/ui/sidebar";
import { NavPage } from "./nav-page";
import { ThemeSwitch } from "./theme-switch";
import { useSession } from "./provider/session-provider";
import { NavPagePinned } from "./nav-page-pinned";

// This is sample data.
const data = {
  teams: [
    {
      name: "Acme Inc",
      logo: Command,
      plan: "Enterprise",
    },
    {
      name: "Acme Corp.",
      logo: AudioWaveform,
      plan: "Startup",
    },
    {
      name: "Evil Corp.",
      logo: Command,
      plan: "Free",
    },
  ],
  navMain: [
    {
      title: "Search",
      url: "#",
      icon: Search,
    },
    {
      title: "Ask AI",
      url: "#",
      icon: Sparkles,
    },
    {
      title: "Home",
      url: "/dashboard/home",
      icon: Home,
    },
    {
      title: "Inbox",
      url: "#",
      icon: Inbox,
      badge: "10",
    },
  ],
};

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const session = useSession();
  // const { setOpen, open } = useSidebar();
  // const [isMouseOver, setIsMouseOver] = useState(false);
  // const timerRef = React.useRef<NodeJS.Timeout>();

  // React.useEffect(() => {
  //   return () => {
  //     // 清理定时器
  //     if (timerRef.current) {
  //       clearTimeout(timerRef.current);
  //     }
  //   };
  // }, []);

  return (
    <Sidebar
      variant="inset"
      {...props}
      // onMouseEnter={() => {
      //   if (!open) {
      //     if (timerRef.current) {
      //       return;
      //     }
      //     setIsMouseOver(true);
      //     setOpen(true);
      //     timerRef.current = setTimeout(() => {
      //       timerRef.current = undefined;
      //     }, 200); // 200ms 的延迟
      //   }
      // }}
      // onMouseOut={() => {
      //   if (timerRef.current) {
      //     return;
      //   }
      //   if (isMouseOver) {
      //     setIsMouseOver(false);
      //     setOpen(false);
      //     timerRef.current = setTimeout(() => {
      //       timerRef.current = undefined;
      //     }, 200); // 200ms 的延迟
      //   }
      // }}
    >
      <SidebarHeader>
        <div className="flex justify-between">
          <TeamSwitcher teams={data.teams} />
          <ThemeSwitch />
        </div>
        <NavMain items={data.navMain} />
      </SidebarHeader>
      <SidebarContent>
        {/* <NavPinned pinnedItems={data.pinnedItems} /> */}
        {/* <NavPages pages={data.pages} /> */}
        {session?.user?.id && (
          <>
            <NavPagePinned />

            <NavPage />
          </>
        )}
        <NavSecondary className="mt-auto" />
      </SidebarContent>
      <SidebarRail />
    </Sidebar>
  );
}
