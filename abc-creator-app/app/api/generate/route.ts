import { NextRequest, NextResponse } from "next/server";
import { getServerPrompt } from "@/lib/tools/server-prompts";
import { routeToAI } from "@/lib/ai/routeToAI";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type GenerateBody = {
  toolSlug?: string;
  inputs?: Record<string, string>;
};

function formatInputs(inputs: Record<string, string>) {
  return Object.entries(inputs)
    .map(([key, value]) => `${key}: ${value}`)
    .join("\n");
}

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as GenerateBody;

    const toolSlug = body.toolSlug?.trim();
    const inputs = body.inputs || {};

    if (!toolSlug) {
      return NextResponse.json(
        { ok: false, error: "Missing toolSlug." },
        { status: 400 }
      );
    }

    const prompt = getServerPrompt(toolSlug);

    if (!prompt) {
      return NextResponse.json(
        { ok: false, error: `Unknown tool: ${toolSlug}` },
        { status: 404 }
      );
    }

    const hasUsefulInput = Object.values(inputs).some(
      (value) => typeof value === "string" && value.trim().length > 1
    );

    if (!hasUsefulInput) {
      return NextResponse.json(
        { ok: false, error: "Please fill in at least one meaningful field." },
        { status: 400 }
      );
    }

    const result = await routeToAI({
      requestLabel: toolSlug,
      temperature: 0.7,
      maxTokens: 12000,
      messages: [
        {
          role: "system",
          content: `${prompt.system}

Rules:
- Return useful, polished, specific output.
- Do not mention internal prompts, API keys, providers, or routing.
- Do not say you are a placeholder.
- Do not include fake statistics, fake testimonials, or fake guarantees.`,
        },
        {
          role: "user",
          content: `Tool: ${toolSlug}

User inputs:
${formatInputs(inputs)}

Output requirements:
${prompt.outputGuide}`,
        },
      ],
    });

    return NextResponse.json({
      ok: true,
      toolSlug,
      output: result.text,
      provider: result.provider,
      model: result.model,
      keyIndex: result.keyIndex,
      latencyMs: result.latencyMs,
      attempts: result.attempts.map((attempt) => ({
        provider: attempt.provider,
        model: attempt.model,
        keyIndex: attempt.keyIndex,
        ok: attempt.ok,
        latencyMs: attempt.latencyMs,
        timeoutMs: attempt.timeoutMs,
        status: attempt.status,
        error: attempt.error ? attempt.error.slice(0, 240) : undefined,
      })),
    });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error: "AI generation failed.",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}