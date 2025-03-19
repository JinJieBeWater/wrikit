"use client";

import { PlatePureEditor } from "@/components/editor/plate-pure-editor";
import { SettingsProvider } from "@/components/editor/settings";
import { api } from "@/trpc/react";
import { type Page } from "@/types/page";
import { type Value } from "@udecode/plate";
import { useDebounceCallback } from "usehooks-ts";

interface MdEditorProps {
  page: Page;
}

export function PureEditor({ page }: MdEditorProps) {
  const utils = api.useUtils();

  const updatePage = api.page.update.useMutation({
    onSuccess: async () => {
      await utils.page.get.invalidate({
        id: page.id,
      });
    },
  });

  const updatePageDebounced = useDebounceCallback((value: Value) => {
    console.log("value", value);

    updatePage.mutate({
      id: page.id,
      content: JSON.stringify(value),
    });
  }, 1000);
  return (
    <>
      <div className="h-full w-full" data-registry="plate">
        <SettingsProvider>
          <PlatePureEditor
            value={(page?.content as Value) ?? ""}
            page={page}
            onChange={({ value }) => {
              updatePageDebounced(value);
            }}
          />
        </SettingsProvider>
      </div>
    </>
  );
}
