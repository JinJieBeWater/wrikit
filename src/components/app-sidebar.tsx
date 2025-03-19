"use client";

import * as React from "react";
import {
  AudioWaveform,
  Blocks,
  Command,
  Home,
  Inbox,
  MessageCircleQuestion,
  Search,
  Settings2,
  Sparkles,
  Trash2,
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
  pinnedItems: [
    {
      name: "Project Management & Task Tracking",
      url: "#",
      emoji: "📊",
    },
    {
      name: "Family Recipe Collection & Meal Planning",
      url: "#",
      emoji: "🍳",
    },
    {
      name: "Fitness Tracker & Workout Routines",
      url: "#",
      emoji: "💪",
    },
    {
      name: "Book Notes & Reading List",
      url: "#",
      emoji: "📚",
    },
    {
      name: "Sustainable Gardening Tips & Plant Care",
      url: "#",
      emoji: "🌱",
    },
    {
      name: "Language Learning Progress & Resources",
      url: "#",
      emoji: "🗣️",
    },
  ],
  pages: [
    {
      name: "Personal Life Management",
      emoji: "🏠",
      pages: [
        {
          name: "Daily Journal & Reflection",
          url: "#",
          emoji: "📔",
          pages: [
            {
              name: "Daily Journal & Reflection",
              url: "#",
              emoji: "📔",
            },
            {
              name: "Health & Wellness Tracker",
              url: "#",
              emoji: "🍏",
            },
            {
              name: "Personal Growth & Learning Goals",
              url: "#",
              emoji: "🌟",
            },
          ],
        },
        {
          name: "Health & Wellness Tracker",
          url: "#",
          emoji: "🍏",
          pages: [
            {
              name: "Health & Wellness Tracker",
              url: "#",
              emoji: "🍏",
            },
            {
              name: "Fitness Tracker & Workout Routines",
              url: "#",
              emoji: "💪",
            },
          ],
        },
        {
          name: "Personal Growth & Learning Goals",
          url: "#",
          emoji: "🌟",
        },
      ],
    },
    {
      name: "Professional Development",
      emoji: "💼",
      pages: [
        {
          name: "Career Objectives & Milestones",
          url: "#",
          emoji: "🎯",
        },
        {
          name: "Skill Acquisition & Training Log",
          url: "#",
          emoji: "🧠",
        },
        {
          name: "Networking Contacts & Events",
          url: "#",
          emoji: "🤝",
        },
      ],
    },
    {
      name: "Creative Projects",
      emoji: "🎨",
      pages: [
        {
          name: "Writing Ideas & Story Outlines",
          url: "#",
          emoji: "✍️",
        },
        {
          name: "Art & Design Portfolio",
          url: "#",
          emoji: "🖼️",
        },
        {
          name: "Music Composition & Practice Log",
          url: "#",
          emoji: "🎵",
        },
      ],
    },
    {
      name: "Home Management",
      emoji: "🏡",
      pages: [
        {
          name: "Household Budget & Expense Tracking",
          url: "#",
          emoji: "💰",
        },
        {
          name: "Home Maintenance Schedule & Tasks",
          url: "#",
          emoji: "🔧",
        },
        {
          name: "Family Calendar & Event Planning",
          url: "#",
          emoji: "📅",
        },
      ],
    },
    {
      name: "Travel & Adventure",
      emoji: "🧳",
      pages: [
        {
          name: "Trip Planning & Itineraries",
          url: "#",
          emoji: "🗺️",
        },
        {
          name: "Travel Bucket List & Inspiration",
          url: "#",
          emoji: "🌎",
        },
        {
          name: "Travel Journal & Photo Gallery",
          url: "#",
          emoji: "📸",
        },
      ],
    },
  ],
  navSecondary: [
    // {
    //   title: "Calendar",
    //   url: "#",
    //   icon: Calendar,
    // },
    {
      title: "Settings",
      url: "#",
      icon: Settings2,
    },
    {
      title: "Templates",
      url: "#",
      icon: Blocks,
    },
    {
      title: "Trash",
      url: "#",
      icon: Trash2,
    },
    {
      title: "Help",
      url: "#",
      icon: MessageCircleQuestion,
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
        <NavSecondary items={data.navSecondary} className="mt-auto" />
      </SidebarContent>
      <SidebarRail />
    </Sidebar>
  );
}
