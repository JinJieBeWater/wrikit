"use client";

import React from "react";

import { Plate, type PlateProps } from "@udecode/plate/react";

import { SettingsDialog } from "@/components/editor/settings";
import { Editor, EditorContainer } from "@/components/plate-ui/editor";
import { type Page } from "@/types/page";
import { type Value } from "@udecode/plate";
import { useCreatePureEditor } from "./use-create-pure-editor";
export function PlatePureEditor({
  value,
  page,
  ...props
}: Omit<PlateProps, "editor" | "children"> & {
  value?: string | Value | undefined;
  page: Page;
}) {
  const editor = useCreatePureEditor({
    value: value,
  });

  return (
    <Plate editor={editor} {...props}>
      <EditorContainer>
        <Editor variant="wrikit" />
      </EditorContainer>

      <SettingsDialog />
    </Plate>
  );
}
