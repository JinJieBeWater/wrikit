"use client";

import { PlateEditor } from "@/components/editor/plate-editor";
import { SettingsProvider } from "@/components/editor/settings";
import { api } from "@/trpc/react";
import { type Page } from "@/types/page";
import { type Value } from "@udecode/plate";
import { toast } from "sonner";
import { useDebounceCallback } from "usehooks-ts";

interface MdEditorProps {
  page: Page;
}

export function MdEditor({ page }: MdEditorProps) {
  const utils = api.useUtils();

  const updatePage = api.page.update.useMutation({
    onMutate: () => {
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
      toast.error("please try again later or check your network");
    },
  });

  const updatePageDebounced = useDebounceCallback((value: Value) => {
    updatePage.mutate({
      id: page.id,
      content: JSON.stringify(value),
    });
  }, 1000);
  return (
    <>
      <div className="h-full w-full" data-registry="plate">
        {
          <SettingsProvider>
            <PlateEditor
              value={(page?.content as Value) ?? ""}
              page={page}
              onChange={({ value }) => {
                updatePageDebounced(value);
              }}
            />
          </SettingsProvider>
        }
      </div>
    </>
  );
}
