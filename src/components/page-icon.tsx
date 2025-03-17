import { cn } from "@/lib/utils";
import { Page } from "@/types/page";
import { FileText, LucideProps, PiIcon } from "lucide-react";
import { RefAttributes } from "react";

export function PageIcon({
  icon,
  className,
  ...props
}: { icon: Page["icon"] } & Omit<LucideProps, "ref"> &
  RefAttributes<SVGSVGElement>) {
  if (!icon)
    return (
      <FileText className={cn("text-muted-foreground", className)} {...props} />
    );

  // const { type, value } = icon;
  return (
    <PiIcon className={cn("text-muted-foreground", className)} {...props} />
  );
}
