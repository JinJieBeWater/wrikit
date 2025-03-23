"use client";
import {
  AutosizeTextarea,
  type AutosizeTextAreaRef,
} from "@/components/ui/autosize-textarea";
import { api } from "@/trpc/react";
import { type Page } from "@/types/page";
import {
  type RefAttributes,
  type TextareaHTMLAttributes,
  useCallback,
  useRef,
} from "react";
import { useDebounceCallback } from "usehooks-ts";

export function TitleEditor({
  page,
  ...props
}: { page: Page } & TextareaHTMLAttributes<HTMLTextAreaElement> &
  RefAttributes<AutosizeTextAreaRef>) {
  const utils = api.useUtils();

  const autosizeTextareaRef = useRef<AutosizeTextAreaRef>(null);

  const { mutate } = api.page.update.useMutation({
    onMutate() {
      // 从 queryCache 中获取数据
      const prevData = utils.page.get.getData({
        id: page.id,
      });
      return { prevData };
    },
    onError(_err, _newPage, ctx) {
      // 当修改失败后，使用来自 onMutate 中的值
      utils.page.get.setData(
        {
          id: page.id,
        },
        ctx?.prevData,
      );
      if (autosizeTextareaRef.current) {
        autosizeTextareaRef.current.textArea.value = ctx?.prevData?.name ?? "";
      }
      setRelativeValue(ctx?.prevData?.name ?? "");
    },
  });

  const updateTitleDebounced = useDebounceCallback((value: string) => {
    mutate({
      id: page.id,
      name: value,
    });
  }, 1000);

  const setRelativeValue = useCallback(
    (value: string) => {
      utils.page.get.setData(
        {
          id: page.id,
        },
        (prev) => {
          return {
            ...prev!,
            name: value,
          };
        },
      );
      utils.page.getByParentId.setData(
        {
          parentId: page.parentId ?? undefined,
        },
        (pages) => {
          return pages?.map((item) => {
            if (item.id === page.id) {
              return {
                ...item,
                name: value,
              };
            }
            return item;
          });
        },
      );
      const isPinned = utils.pagePinned.get
        .getData()
        ?.some((p) => p.id === page.id);
      if (isPinned) {
        void utils.pagePinned.get.setData(void 0, (pinnedPages) => {
          return pinnedPages?.map((item) => {
            if (item.id === page.id) {
              return {
                ...item,
                name: value,
              };
            }
            return item;
          });
        });
      }
    },
    [page.parentId, utils, page.id],
  );
  return (
    <AutosizeTextarea
      ref={autosizeTextareaRef}
      className="w-full resize-none overflow-hidden border-none px-12 text-4xl font-bold focus-visible:rounded-none focus-visible:outline-none focus-visible:ring-0 sm:px-page"
      defaultValue={page.name ?? ""}
      placeholder="Untitled"
      onChange={(e) => {
        setRelativeValue(e.target.value);
        updateTitleDebounced(e.target.value);
      }}
      maxLength={256}
      {...props}
    />
  );
}
