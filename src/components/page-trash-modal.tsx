"use client";
import { Trash2 } from "lucide-react";

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
import { memo } from "react";
import { PageTable } from "./page-table";

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
  return <PageTable />;
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
        <DialogContent className="max-h-90vh sm:max-w-[70vw]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Trash2 />
              <span>Trash</span>
            </DialogTitle>
          </DialogHeader>
          <InfinitePageTrash />
          <DialogDescription>
            The page was deleted after 30 days in the trash
          </DialogDescription>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Drawer open={open} onOpenChange={setOpen}>
      <DrawerTrigger>
        <PageTrashButton />
      </DrawerTrigger>
      <DrawerContent className="max-h-90vh px-4">
        <DrawerHeader className="text-left">
          <DrawerTitle>Page trash</DrawerTitle>
          <DrawerDescription>
            The page was deleted after 30 days in the trash
          </DrawerDescription>
        </DrawerHeader>
        <InfinitePageTrash />

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
