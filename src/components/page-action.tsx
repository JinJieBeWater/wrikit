"use client";

import { Page } from "@/types/page";
import {
  MoreHorizontal,
  Pin,
  ArrowUpRight,
  LinkIcon,
  CopyPlus,
  Trash2,
  PinOff,
} from "lucide-react";
import { useCallback, useContext, useMemo } from "react";
import { toast } from "sonner";
import { useSidebar, SidebarMenuAction } from "./ui/sidebar";
import { api } from "@/trpc/react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";
import { PinnedContext } from "./nav-page";

export function PageAction({ page }: { page: Page }) {
  const { isMobile } = useSidebar();
  const utils = api.useUtils();

  const invalidateCache = useCallback(() => {
    if (page.parentId) {
      void utils.page.getByParentId.invalidate({
        parentId: page.parentId,
      });
    } else {
      void utils.page.getByParentId.invalidate({});
    }
  }, [page.parentId, utils]);

  const toggleTrash = api.page.toggleTrash.useMutation({
    onMutate(variables) {
      if (variables.isDeleted) {
        toast.loading("Moving page to trash...");
      } else {
        toast.loading("Restoring page from trash...");
      }
    },
    onSuccess: async (_data, variables) => {
      invalidateCache();
      toast.dismiss();
      if (variables.isDeleted) {
        toast.success("Page moved to trash", {
          description: "You can restore it from the trash",
          action: {
            label: "restore",
            onClick: () =>
              toggleTrash.mutate({
                id: variables.id,
                isDeleted: false,
              }),
          },
        });
      } else {
        toast.success("Page restored from trash");
      }
    },
  });

  const createPinned = api.pagePinned.create.useMutation({
    onSuccess: async () => {
      utils.pagePinned.get.invalidate();
    },
  });
  const deletePinned = api.pagePinned.delete.useMutation({
    onSuccess: async () => {
      utils.pagePinned.get.invalidate();
    },
  });

  const pagesPinned = useContext(PinnedContext);
  const isPinned = useMemo(
    () => pagesPinned.find((p) => p.id === page.id),
    [page.id, pagesPinned],
  );
  return (
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
        <DropdownMenuItem
          onClick={() => {
            if (isPinned) {
              deletePinned.mutate({ pageId: page.id });
            } else {
              createPinned.mutate({ pageId: page.id });
            }
          }}
        >
          {isPinned ? (
            <>
              <PinOff className="text-muted-foreground" />
              <span>Unpin</span>
            </>
          ) : (
            <>
              <Pin className="text-muted-foreground" />
              <span>Pin</span>
            </>
          )}
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
          onClick={() =>
            toggleTrash.mutateAsync({ id: page.id, isDeleted: true })
          }
        >
          <Trash2 className="text-muted-foreground" />
          <span>Move to Trash</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
