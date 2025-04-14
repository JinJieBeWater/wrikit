import type { NextRequest } from "next/server"

import { createOpenRouter } from "@openrouter/ai-sdk-provider"
import { generateText } from "ai"
import { NextResponse } from "next/server"

export async function POST(req: NextRequest) {
	const {
		apiKey: key,
		model = "openai/gpt-4o-mini",
		prompt,
		system,
	} = await req.json()

	const apiKey = key || process.env.OPENROUTER_API_KEY

	if (!apiKey) {
		return NextResponse.json(
			{ error: "Missing OpenAI API key." },
			{ status: 401 },
		)
	}

	const openRouter = createOpenRouter({ apiKey })

	try {
		const result = await generateText({
			abortSignal: req.signal,
			maxTokens: 50,
			model: openRouter(model),
			prompt: prompt,
			system,
			temperature: 0.7,
		})

		return NextResponse.json(result)
		// biome-ignore lint/suspicious/noExplicitAny: <explanation>
	} catch (error: any) {
		if (error.name === "AbortError") {
			return NextResponse.json(null, { status: 408 })
		}

		return NextResponse.json(
			{ error: "Failed to process AI request" },
			{ status: 500 },
		)
	}
}
