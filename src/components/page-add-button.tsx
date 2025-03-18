"use client";
import {
  ALargeSmall,
  AppWindow,
  Heading1,
  LucideIcon,
  TableProperties,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";
import { useSidebar } from "./ui/sidebar";
import { Page, PageType } from "@/types/page";
import { api } from "@/trpc/react";
import { useRouter } from "next/navigation";

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

export function PageAddButton({
  setParentOpen,
  parentPage,
  children,
}: React.PropsWithChildren<{
  setParentOpen?: React.Dispatch<React.SetStateAction<boolean>>;
  parentPage?: Page;
}>) {
  const { isMobile } = useSidebar();
  const router = useRouter();

  const utils = api.useUtils();
  const createPage = api.page.create.useMutation({
    onSuccess: async (data, variables) => {
      if (parentPage) {
        await utils.page.getByParentId.invalidate({
          parentId: variables.parentId,
        });
        setParentOpen?.(true);
      } else {
        await utils.page.getRoots.invalidate();
      }
      if (data) {
        router.push(`/dashboard/page/${data.id}`);
      }
    },
  });
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>{children}</DropdownMenuTrigger>
      <DropdownMenuContent
        className="w-56 rounded-lg"
        side={isMobile ? "bottom" : "right"}
        align={isMobile ? "end" : "start"}
      >
        {addType.map((type, index) => (
          <DropdownMenuItem
            key={index}
            onClick={() => {
              createPage.mutate({ type: type.label, parentId: parentPage?.id });
            }}
          >
            <type.icon className="text-muted-foreground" />
            <span>{type.label}</span>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
