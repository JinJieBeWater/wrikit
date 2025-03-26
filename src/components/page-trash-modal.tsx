"use client";
import { Trash2 } from "lucide-react";

import {
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";
import { PageTable } from "./page-table";

import * as React from "react";

import { cn } from "@/lib/utils";
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

const PageTrashButton = () => {
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

export function PageTrashModal() {
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
            <DialogTitle>Edit profile</DialogTitle>
            <DialogDescription>
              Make changes to your profile here. Click save when you're done.
            </DialogDescription>
          </DialogHeader>
          <ScrollArea>
            <PageTable />
          </ScrollArea>
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
          <DrawerTitle>Edit profile</DrawerTitle>
          <DrawerDescription>
            Make changes to your profile here. Click save when you're done.
          </DrawerDescription>
        </DrawerHeader>
        <ScrollArea>
          <PageTable />
        </ScrollArea>

        <DrawerFooter className="pt-2">
          <DrawerClose asChild>
            <Button variant="outline">Cancel</Button>
          </DrawerClose>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
}
