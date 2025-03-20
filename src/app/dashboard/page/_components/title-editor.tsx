"use client";
import { PinnedContext } from "@/components/nav-page";
import {
  AutosizeTextarea,
  AutosizeTextAreaRef,
} from "@/components/ui/autosize-textarea";
import { Separator } from "@/components/ui/separator";
import { api } from "@/trpc/react";
import { type Page } from "@/types/page";
import {
  RefAttributes,
  TextareaHTMLAttributes,
  useContext,
  useMemo,
} from "react";
import { useDebounceCallback } from "usehooks-ts";

export function TitleEditor({
  page,
  ...props
}: { page: Page } & TextareaHTMLAttributes<HTMLTextAreaElement> &
  RefAttributes<AutosizeTextAreaRef>) {
  const utils = api.useUtils();

  const pinnedPages = utils.pagePinned.get.getData();

  const isPinned = useMemo(
    () => pinnedPages?.find((p) => p.id === page.id),
    [page.id, pinnedPages],
  );

  const updatePage = api.page.update.useMutation({
    onSuccess: () => {
      void utils.page.get.invalidate({
        id: page.id,
      });
      if (page.parentId) {
        void utils.page.getByParentId.invalidate({
          parentId: page.parentId,
        });
      } else {
        void utils.page.getByParentId.invalidate({});
      }

      if (isPinned) {
        void utils.pagePinned.get.invalidate();
      }
    },
  });

  const updateTitleDebounced = useDebounceCallback((value: string) => {
    void updatePage.mutateAsync({
      id: page.id,
      name: value,
    });
  }, 1000);
  return (
    <AutosizeTextarea
      className="w-full resize-none overflow-hidden border-none px-12 text-4xl font-bold focus-visible:rounded-none focus-visible:outline-none focus-visible:ring-0 sm:px-page"
      defaultValue={page.name ?? ""}
      placeholder="Untitled"
      onChange={(e) => updateTitleDebounced(e.target.value)}
      maxLength={256}
      {...props}
    />
  );
}
