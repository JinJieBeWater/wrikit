"use client";

import type { Value } from "@udecode/plate";

import { AIPlugin } from "@udecode/plate-ai/react";
import {
  MentionInputPlugin,
  MentionPlugin,
} from "@udecode/plate-mention/react";
import { SlashInputPlugin } from "@udecode/plate-slash-command/react";
import {
  type CreatePlateEditorOptions,
  usePlateEditor,
} from "@udecode/plate/react";

import { copilotPlugins } from "@/components/editor/plugins/copilot-plugins";
import { AILeaf } from "@/components/plate-ui/ai-leaf";
import { MentionInputElement } from "@/components/plate-ui/mention-input-element";
import { withPlaceholders } from "@/components/plate-ui/placeholder";
import { SlashInputElement } from "@/components/plate-ui/slash-input-element";
import { aiPlugins } from "./plugins/ai-plugins";
import { mentionPlugin } from "./plugins/mention-plugin";
import { MentionElement } from "../plate-ui/mention-element";

export const viewComponents = {
  [MentionPlugin.key]: MentionElement,
};

export const editorComponents = {
  ...viewComponents,
  [AIPlugin.key]: AILeaf,
  [MentionInputPlugin.key]: MentionInputElement,
  [SlashInputPlugin.key]: SlashInputElement,
};

export const useCreatePureEditor = (
  {
    components,
    override,
    readOnly,
    ...options
  }: {
    components?: Record<string, any>;
    plugins?: any[];
    readOnly?: boolean;
  } & Omit<CreatePlateEditorOptions, "plugins"> = {},
  deps: any[] = [],
) => {
  return usePlateEditor<Value>(
    {
      override: {
        components: {
          ...(readOnly ? viewComponents : withPlaceholders(editorComponents)),
          ...components,
        },
        ...override,
      },
      plugins: [
        ...aiPlugins,
        ...copilotPlugins,
        mentionPlugin,
        // ...editorPlugins,
        // FixedToolbarPlugin,
        // FloatingToolbarPlugin,
      ],
      value: undefined,
      ...options,
    },
    deps,
  );
};
