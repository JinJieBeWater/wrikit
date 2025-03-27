"use client";
import { Loader2, Trash2 } from "lucide-react";

import {
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";

import * as React from "react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer";
import { ScrollArea } from "./ui/scroll-area";
import { api } from "@/trpc/react";
import InfiniteScroll from "./ui/infinite-scroll";
import { memo } from "react";
import { PageTreeItem } from "./nav-page-tree";

const PurePageTrashButton = () => {
  return (
    <SidebarMenuItem>
      <SidebarMenuButton asChild>
        <div>
          <Trash2 />
          <span>Trash</span>
        </div>
      </SidebarMenuButton>
    </SidebarMenuItem>
  );
};

const PageTrashButton = memo(PurePageTrashButton);

const PureInfinitePageTrash = () => {
  const { data, isLoading, isError, hasNextPage, fetchNextPage } =
    api.page.infinitePage.useInfiniteQuery(
      {
        isDeleted: true,
      },
      {
        getNextPageParam: (lastPage) => lastPage.nextCursor,
      },
    );

  return (
    <ScrollArea className="max-h-[300px] w-full overflow-y-auto">
      <div className="flex w-full flex-col items-center gap-1 pr-3">
        {data?.pages.map((group, i) => (
          <React.Fragment key={i}>
            {group.items.map((page) => (
              <div
                key={page.id}
                className="relative flex w-full [&>button]:hover:opacity-100"
              >
                <PageTreeItem page={page} key={page.id} />
              </div>
            ))}
          </React.Fragment>
        ))}
        <InfiniteScroll
          hasMore={hasNextPage}
          isLoading={isLoading}
          next={fetchNextPage}
          threshold={1}
        >
          {hasNextPage && <Loader2 className="my-4 h-8 w-8 animate-spin" />}
        </InfiniteScroll>
      </div>
    </ScrollArea>
  );
};

const InfinitePageTrash = memo(PureInfinitePageTrash);

const PurePageTrashModal = () => {
  const [open, setOpen] = React.useState(false);
  const { isMobile } = useSidebar();

  if (!isMobile) {
    return (
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger>
          <PageTrashButton />
        </DialogTrigger>
        <DialogContent className="max-h-90vh sm:max-w-[60vw]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Trash2 />
              <span>Trash</span>
            </DialogTitle>
            <DialogDescription>
              The page was deleted after 30 days in the trash
            </DialogDescription>
          </DialogHeader>
          <InfinitePageTrash />
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Drawer open={open} onOpenChange={setOpen}>
      <DrawerTrigger>
        <PageTrashButton />
      </DrawerTrigger>
      <DrawerContent className="max-h-90vh">
        <DrawerHeader className="text-left">
          <DrawerTitle>Page trash</DrawerTitle>
          <DrawerDescription>
            The page was deleted after 30 days in the trash
          </DrawerDescription>
        </DrawerHeader>
        <ScrollArea></ScrollArea>

        <DrawerFooter className="pt-2">
          <DrawerClose asChild>
            <Button variant="outline">Cancel</Button>
          </DrawerClose>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
};

export const PageTrashModal = memo(PurePageTrashModal);
