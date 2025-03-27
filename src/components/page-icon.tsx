"use client";
import { cn } from "@/lib/utils";
import { type LucideProps, PiIcon } from "lucide-react";
import { type RefAttributes } from "react";
import { PageTypeIcon } from "./page-action-add";
import { type RouterOutputs } from "@/trpc/react";

export function PageIcon({
  page,
  className,
  ...props
}: {
  page: Pick<RouterOutputs["page"]["getByParentId"][0], "icon" | "type">;
} & Omit<LucideProps, "ref"> &
  RefAttributes<SVGSVGElement>) {
  if (!page.icon) {
    const Comp = PageTypeIcon[page.type];
    if (!Comp) {
      return null;
    }
    return (
      <Comp className={cn("text-muted-foreground", className)} {...props} />
    );
  }

  // const { type, value } = icon;
  return (
    <PiIcon className={cn("text-muted-foreground", className)} {...props} />
  );
}
