"use client";
import {
  AutosizeTextarea,
  AutosizeTextAreaRef,
} from "@/components/ui/autosize-textarea";
import { Separator } from "@/components/ui/separator";
import { api } from "@/trpc/react";
import { type Page } from "@/types/page";
import { RefAttributes, TextareaHTMLAttributes } from "react";
import { useDebounceCallback } from "usehooks-ts";

export function TitleEditor({
  page,
  ...props
}: { page: Page } & TextareaHTMLAttributes<HTMLTextAreaElement> &
  RefAttributes<AutosizeTextAreaRef>) {
  const utils = api.useUtils();

  const updatePage = api.page.update.useMutation({
    onSuccess: async () => {
      await utils.page.get.invalidate({
        id: page.id,
      });
      await utils.page.getByParentId.invalidate({});
      if (page.parentId) {
        await utils.page.getByParentId.invalidate({
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
    <AutosizeTextarea
      className="h-full w-full resize-none overflow-hidden border-none px-12 text-4xl font-bold focus-visible:rounded-none focus-visible:outline-none focus-visible:ring-0 sm:px-page"
      defaultValue={page.name ?? ""}
      placeholder="Untitled"
      onChange={(e) => updateTitleDebounced(e.target.value)}
      maxLength={256}
      {...props}
    />
  );
}
