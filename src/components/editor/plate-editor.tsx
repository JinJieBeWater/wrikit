"use client";

import React from "react";
import { DndProvider } from "react-dnd";
import { HTML5Backend } from "react-dnd-html5-backend";

import { Plate, type PlateProps } from "@udecode/plate/react";

import { useCreateEditor } from "@/components/editor/use-create-editor";
import { SettingsDialog } from "@/components/editor/settings";
import { Editor, EditorContainer } from "@/components/plate-ui/editor";
import { type Page } from "@/types/page";
import { type Value } from "@udecode/plate";
export function PlateEditor({
  value,
  page,
  ...props
}: Omit<PlateProps, "editor" | "children"> & {
  value?: string | Value | undefined;
  page: Page;
}) {
  const editor = useCreateEditor({
    value: value,
  });

  return (
    <DndProvider backend={HTML5Backend}>
      <Plate editor={editor} {...props}>
        <EditorContainer>
          <Editor variant="wrikit" />
        </EditorContainer>

        <SettingsDialog />
      </Plate>
    </DndProvider>
  );
}
