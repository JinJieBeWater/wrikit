import type { NextRequest } from "next/server";

import { convertToCoreMessages, streamText } from "ai";
import { NextResponse } from "next/server";
import { createOpenRouter } from "@openrouter/ai-sdk-provider";

export async function POST(req: NextRequest) {
  const {
    apiKey: key,
    messages,
    model = "openai/gpt-4o-mini",
    system,
  } = await req.json();

  const apiKey = key || process.env.OPENROUTER_API_KEY;

  if (!apiKey) {
    return NextResponse.json(
      { error: "Missing OpenAI API key." },
      { status: 401 },
    );
  }

  const openRouer = createOpenRouter({
    apiKey,
  });

  try {
    const result = await streamText({
      maxTokens: 2048,
      messages: convertToCoreMessages(messages),
      model: openRouer(model),
      system: system,
    });

    return result.toDataStreamResponse();
  } catch {
    return NextResponse.json(
      { error: "Failed to process AI request" },
      { status: 500 },
    );
  }
}
