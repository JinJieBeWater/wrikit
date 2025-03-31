"use client";
import { MdEditor } from "../_components/md-editor";
import { PageType } from "@/types/page";
import { cn } from "@/lib/utils";
import { TitleEditor } from "../_components/title-editor";
import { GridPattern } from "@/components/magicui/grid-pattern";
import { PageIcon } from "@/components/page-icon";
import { Button } from "@/components/ui/button";
import { notFound, useParams } from "next/navigation";
import { PureEditor } from "../_components/pure-editor";
import { api } from "@/trpc/react";
import Loading from "./loading";
import { ScrollArea } from "@/components/ui/scroll-area";

export default function Page() {
  const { id } = useParams();

  const { data: page, isLoading } = api.page.get.useQuery({
    id: String(id),
  });

  if (isLoading) return <Loading />;

  if (!page) notFound();

  return (
    <ScrollArea className={cn("flex h-full w-full flex-col")}>
      <div className="relative flex h-52 w-full shrink-0 items-end overflow-hidden bg-background px-12 pb-4 sm:px-page">
        <GridPattern
          width={20}
          height={20}
          x={-1}
          y={-1}
          className={cn(
            "[mask-image:linear-gradient(to_bottom_right,white,transparent,transparent)]",
          )}
        />
        <Button size={"icon"} variant={"ghost"} className="size-20">
          <PageIcon page={page} className="!size-14" />
          <span className="sr-only">Edit Page Icon</span>
        </Button>
      </div>
      <TitleEditor page={page} className="px-12 sm:px-page" />
      <div className="grow px-12 pb-12 sm:px-page">
        {page.type === PageType.md && <MdEditor page={page}></MdEditor>}
        {page.type === PageType.pure && <MdEditor page={page}></MdEditor>}
      </div>
    </ScrollArea>
  );
}
