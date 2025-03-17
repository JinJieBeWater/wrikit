import { api } from "@/trpc/server";
import { MdEditor } from "../_components/md-editor";
import { PageType } from "@/types/page";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import { TitleEditor } from "../_components/title-editor";

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
      <div
        className={cn(
          "size-full px-12 pb-72 pt-4 text-base sm:px-[max(64px,calc(50%-350px))]",
          "h-[calc(100vh-3.5rem)] w-full",
        )}
      >
        <TitleEditor page={page} />
        <Separator />
        {page.type === PageType.md && <MdEditor page={page}></MdEditor>}
      </div>
    </>
  );
}
