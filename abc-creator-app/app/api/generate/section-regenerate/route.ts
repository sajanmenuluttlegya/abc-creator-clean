import { NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { routeToAI } from "@/lib/ai/routeToAI";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Body = {
  toolSlug?: string;
  sectionText?: string;
  instruction?: string;
};

function cleanText(value: unknown, limit: number) {
  const text = typeof value === "string" ? value.trim() : "";
  return text.length > limit ? text.slice(0, limit) : text;
}

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();
    const auth = await supabase.auth.getUser();
    if (auth.error || !auth.data.user) {
      return Response.json({ ok: false, error: "Login required.", code: "AUTH_REQUIRED" }, { status: 401 });
    }

    const body = (await req.json()) as Body;
    const toolSlug = cleanText(body.toolSlug, 120) || "text-tool";
    const sectionText = cleanText(body.sectionText, 10000);
    const instruction = cleanText(body.instruction, 1400);

    if (sectionText.length < 10) {
      return Response.json({ ok: false, error: "Section text is required." }, { status: 400 });
    }
    if (instruction.length < 3) {
      return Response.json({ ok: false, error: "Instruction is required." }, { status: 400 });
    }

    const result = await routeToAI({
      requestLabel: `section-regenerate:${toolSlug}`,
      temperature: 0.55,
      maxTokens: 2400,
      messages: [
        {
          role: "system",
          content: "Rewrite one selected Markdown section. Return only the replacement Markdown section. Keep the same main heading level when possible. Do not add unrelated extra sections.",
        },
        {
          role: "user",
          content: `Instruction:\n${instruction}\n\nSelected section:\n${sectionText}`,
        },
      ],
    });

    return Response.json({ ok: true, text: result.text.trim() });
  } catch (error) {
    return Response.json({ ok: false, error: "Section regeneration failed.", details: error instanceof Error ? error.message : String(error) }, { status: 500 });
  }
}
