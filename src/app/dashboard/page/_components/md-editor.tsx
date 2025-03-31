"use client";

import { MinimalTiptapEditor } from "@/components/minimal-tiptap";
import { api } from "@/trpc/react";
import { type Page } from "@/types/page";
import { Content } from "@tiptap/react";
import { useCallback, useState } from "react";
import { toast } from "sonner";
import { useDebounceCallback } from "usehooks-ts";

interface MdEditorProps {
  page: Page;
}

export function MdEditor({ page }: MdEditorProps) {
  const utils = api.useUtils();

  const updatePage = api.page.update.useMutation({
    onMutate: (variables) => {
      // 从 queryCache 中获取数据
      const prevData = utils.page.get.getData({
        id: page.id,
      });
      // 乐观更新
      utils.page.get.setData(
        {
          id: page.id,
        },
        {
          ...prevData!,
          content: variables.content && JSON.parse(variables.content),
        },
      );
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

  const updatePageDebounced = useDebounceCallback((value: Content) => {
    updatePage.mutate({
      id: page.id,
      content: JSON.stringify(value),
    });
  }, 1000);

  const [value, setValue] = useState<Content>((page?.content as Content) ?? "");

  const handleChange = useCallback(
    (value: Content) => {
      setValue(value);
      updatePageDebounced(value);
    },
    [updatePageDebounced],
  );

  return (
    <>
      <div className="h-full w-full" data-registry="plate">
        {
          <MinimalTiptapEditor
            value={value}
            onChange={handleChange}
            className="w-full pb-48"
            editorContentClassName=""
            output="html"
            placeholder="Enter your description..."
            editable={true}
            editorClassName="focus:outline-none"
          />
        }
      </div>
    </>
  );
}
