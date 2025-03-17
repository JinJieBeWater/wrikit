"use client";

import { PlateEditor } from "@/components/editor/plate-editor";
import { SettingsProvider } from "@/components/editor/settings";
import { api } from "@/trpc/react";
import { type Page } from "@/types/page";
import { type Value } from "@udecode/plate";
import { useDebounceCallback } from "usehooks-ts";

interface MdEditorProps {
  page: Page;
}

export function MdEditor({ page }: MdEditorProps) {
  const utils = api.useUtils();

  const updatePage = api.page.update.useMutation({
    onSuccess: async () => {
      await utils.page.get.invalidate({
        id: page.id,
      });
    },
  });

  const updatePageDebounced = useDebounceCallback((value: Value) => {
    updatePage.mutate({
      id: page.id,
      content: JSON.stringify(value),
    });
  }, 500);
  return (
    <>
      <div className="h-full w-full" data-registry="plate">
        <SettingsProvider>
          <PlateEditor
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
