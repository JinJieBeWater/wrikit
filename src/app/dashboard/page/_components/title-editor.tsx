"use client";
import { AutosizeTextarea } from "@/components/ui/autosize-textarea";
import { api } from "@/trpc/react";
import { type Page } from "@/types/page";
import { useDebounceCallback } from "usehooks-ts";

export function TitleEditor({ page }: { page: Page }) {
  const utils = api.useUtils();

  const updatePage = api.page.update.useMutation({
    onSuccess: async () => {
      await utils.page.get.invalidate({
        id: page.id,
      });
      await utils.page.getRoots.invalidate();
      if (page.parentId) {
        await utils.page.ByParentId.invalidate({
          parentId: page.parentId,
        });
      }
    },
  });

  const updateTitleDebounced = useDebounceCallback(async (value: string) => {
    await updatePage.mutateAsync({
      id: page.id,
      name: value,
    });
  }, 1000);
  return (
    // <Balancer>
    <AutosizeTextarea
      className="resize-none border-none px-0 text-4xl font-bold focus-visible:rounded-none focus-visible:outline-none focus-visible:ring-0"
      defaultValue={page.name ?? ""}
      placeholder="Untitled"
      onChange={(e) => updateTitleDebounced(e.target.value)}
      maxLength={256}
    />
    // </Balancer>
  );
}
