import { api } from "@/trpc/server";
import { MdEditor } from "../_components/md-editor";
import { PageType } from "@/types/page";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import { TitleEditor } from "../_components/title-editor";
import { GridPattern } from "@/components/magicui/grid-pattern";
import { PageIcon } from "@/components/page-icon";
import { Button } from "@/components/ui/button";

interface Props {
  params: {
    id: string;
  };
}

export default async function Page({ params }: Props) {
  const { id } = await params;
  const page = await api.page.get({ id: Number(id) });

  if (!page)
    return (
      <div className="flex flex-1 flex-col gap-4 px-4 py-10">
        <div className="mx-auto h-24 w-full max-w-3xl rounded-xl bg-muted/50" />
        <div className="mx-auto h-full w-full max-w-3xl rounded-xl bg-muted/50" />
      </div>
    );

  return (
    <>
      <div className={cn("flex w-full flex-col")}>
        <div className="sm:px-page relative flex h-52 w-full shrink-0 items-end overflow-hidden bg-background px-12 pb-4">
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
        </div>
      </div>
    </>
  );
}
