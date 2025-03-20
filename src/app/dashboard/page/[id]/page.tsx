import { api } from "@/trpc/server";
import { MdEditor } from "../_components/md-editor";
import { PageType } from "@/types/page";
import { cn } from "@/lib/utils";
import { TitleEditor } from "../_components/title-editor";
import { GridPattern } from "@/components/magicui/grid-pattern";
import { PageIcon } from "@/components/page-icon";
import { Button } from "@/components/ui/button";
import { notFound } from "next/navigation";
import { PureEditor } from "../_components/pure-editor";
import { ClientSideLoader } from "./_components/client-side-loader";

interface Props {
  params: Promise<{
    id: string;
  }>;
}

export default async function Page({ params }: Props) {
  const { id } = await params;
  const page = await api.page.get({ id: Number(id) });

  if (!page) notFound();

  return (
    <>
      <ClientSideLoader page={page} />
      <div className={cn("flex h-full w-full flex-col")}>
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
            <PageIcon icon={page.icon} className="!size-14" />
            <span className="sr-only">Edit Page Icon</span>
          </Button>
        </div>
        <TitleEditor page={page} />
        <div className="grow">
          {page.type === PageType.md && <MdEditor page={page}></MdEditor>}
          {page.type === PageType.pure && <PureEditor page={page}></PureEditor>}
        </div>
      </div>
    </>
  );
}
