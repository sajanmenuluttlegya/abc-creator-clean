import { NextRequest, NextResponse } from "next/server";
import { getServerPrompt } from "@/lib/tools/server-prompts";

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

    const output = `DEV PLACEHOLDER — real AI not connected yet.

Tool slug:
${toolSlug}

Server prompt loaded:
${prompt.system}

Inputs received:
${formatInputs(inputs)}

Output guide:
${prompt.outputGuide}`;

    return NextResponse.json({
      ok: true,
      toolSlug,
      output,
    });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error: "Generation route failed.",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}