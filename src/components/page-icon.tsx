import { cn } from "@/lib/utils";
import { Page, PageType } from "@/types/page";
import { FileText, LucideProps, PiIcon } from "lucide-react";
import { RefAttributes } from "react";
import { PageTypeIcon } from "./page-add-button";

export function PageIcon({
  page,
  className,
  ...props
}: { page: Page } & Omit<LucideProps, "ref"> & RefAttributes<SVGSVGElement>) {
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
