"use client";
import {
  ALargeSmall,
  AppWindow,
  Heading1,
  type LucideIcon,
  TableProperties,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";
import { useSidebar } from "./ui/sidebar";
import { PageType } from "@/types/page";
import { api, type RouterOutputs } from "@/trpc/react";
import { useRouter } from "next/navigation";
import { generateUUID } from "@/lib/utils";

export const PageTypeIcon = {
  md: Heading1,
  pure: ALargeSmall,
  object: TableProperties,
  iframe: AppWindow,
};

const addType: { label: keyof typeof PageType; icon: LucideIcon }[] = [
  {
    label: PageType.md,
    icon: PageTypeIcon.md,
  },
  {
    label: PageType.pure,
    icon: PageTypeIcon.pure,
  },
  {
    label: PageType.object,
    icon: PageTypeIcon.object,
  },
  {
    label: PageType.iframe,
    icon: PageTypeIcon.iframe,
  },
];

export function PageActionAdd({
  setParentOpen,
  parentPage,
  children,
}: React.PropsWithChildren<{
  setParentOpen?: React.Dispatch<React.SetStateAction<boolean>>;
  parentPage?: RouterOutputs["page"]["getByParentId"][0];
}>) {
  const { isMobile } = useSidebar();
  const router = useRouter();

  const utils = api.useUtils();
  const createPage = api.page.create.useMutation({
    onMutate(variables) {
      const prevParentList = utils.page.getByParentId.getData({
        parentId: variables.parentId,
      });
      const newPage: RouterOutputs["page"]["getByParentId"][0] = {
        ...variables,
        id: generateUUID(),
        icon: null,
        name: variables.name ?? null,
        parentId: variables.parentId ?? null,
        isDeleted: false,
      };
      void utils.page.getByParentId.setData(
        {
          parentId: variables.parentId,
        },
        (prev) => (prev ? [...prev, newPage] : []),
      );
      return {
        prevParentList,
      };
    },
    onSuccess: async (data, variables) => {
      if (parentPage) {
        await utils.page.getByParentId.invalidate({
          parentId: variables.parentId,
        });
        setParentOpen?.(true);
      } else {
        await utils.page.getByParentId.invalidate({});
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
