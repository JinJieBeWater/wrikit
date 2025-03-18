import { createOpenAI } from "@ai-sdk/openai";
import { createOpenRouter } from "@openrouter/ai-sdk-provider";
import { experimental_createProviderRegistry as createProviderRegistry } from "ai";

export const registry = createProviderRegistry({
  // register provider with prefix and default setup:

  // register provider with prefix and custom setup:
  openai: createOpenAI({
    apiKey: process.env.OPENAI_API_KEY,
  }),

  openrouter: {
    ...createOpenRouter({
      apiKey: process.env.OPENROUTER_API_KEY,
    }),
    textEmbeddingModel: (modelId: string) => {
      throw new Error(
        `textEmbeddingModel is not implemented for OpenRouterProvider. Model ID: ${modelId}`,
      );
    },
  },
});
