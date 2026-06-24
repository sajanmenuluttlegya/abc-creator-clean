import { randomUUID } from "crypto";
import { NextRequest, NextResponse } from "next/server";
import { getServerPrompt } from "@/lib/tools/server-prompts";
import { routeToAI } from "@/lib/ai/routeToAI";
import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type GenerateBody = {
  toolSlug?: string;
  inputs?: Record<string, string>;
};

type CreditReservation = {
  ok?: boolean;
  code?: string;
  requiredCredits?: number;
  currentCredits?: number;
  remainingCredits?: number;
  transactionId?: string;
};

type CreditSpendResult = {
  ok?: boolean;
  code?: string;
  status?: string;
  alreadyFinalized?: boolean;
};

function formatInputs(inputs: Record<string, string>) {
  return Object.entries(inputs)
    .map(([key, value]) => `${key}: ${value}`)
    .join("\n");
}

function rpcErrorMessage(error: unknown) {
  if (!error) return "Unknown credit ledger error.";
  if (error instanceof Error) return error.message;

  if (typeof error === "object") {
    const value = error as {
      message?: unknown;
      details?: unknown;
      hint?: unknown;
      code?: unknown;
    };

    const parts = [value.message, value.details, value.hint, value.code]
      .filter((item) => typeof item === "string" && item.trim())
      .join(" ");

    if (parts) return parts;
  }

  return String(error);
}

export async function POST(req: NextRequest) {
  let reservedTransactionId: string | null = null;
  let supabase: Awaited<ReturnType<typeof createClient>> | null = null;

  async function refundIfReserved(reason: string) {
    if (!supabase || !reservedTransactionId) return;

    try {
      await supabase.rpc("refund_reserved_credits", {
        p_transaction_id: reservedTransactionId,
        p_reason: reason,
      });
    } catch {
      // Never expose refund internals to the user.
    }
  }

  try {
    supabase = await createClient();

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { ok: false, error: "Login required.", code: "AUTH_REQUIRED" },
        { status: 401 }
      );
    }

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

    const reserveResponse = await supabase.rpc("reserve_credits", {
      p_tool_slug: toolSlug,
      p_amount: prompt.creditCost,
      p_idempotency_key: `${user.id}:${toolSlug}:${randomUUID()}`,
    });

    if (reserveResponse.error) {
      return NextResponse.json(
        {
          ok: false,
          error: "Could not reserve credits.",
          details: rpcErrorMessage(reserveResponse.error),
        },
        { status: 500 }
      );
    }

    const reservation = reserveResponse.data as CreditReservation;

    if (!reservation?.ok) {
      return NextResponse.json(
        {
          ok: false,
          error: "Not enough credits.",
          code: reservation?.code || "INSUFFICIENT_CREDITS",
          requiredCredits: reservation?.requiredCredits ?? prompt.creditCost,
          currentCredits: reservation?.currentCredits ?? 0,
        },
        { status: 402 }
      );
    }

    reservedTransactionId = reservation.transactionId || null;

    if (!reservedTransactionId) {
      return NextResponse.json(
        {
          ok: false,
          error: "Credit reservation failed.",
          code: "CREDIT_RESERVATION_MISSING_ID",
        },
        { status: 500 }
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

    const spendResponse = await supabase.rpc("spend_reserved_credits", {
      p_transaction_id: reservedTransactionId,
      p_provider: result.provider,
      p_model: result.model,
    });

    if (spendResponse.error) {
      await refundIfReserved("spend_mark_failed");

      return NextResponse.json(
        {
          ok: false,
          error: "Could not finalize credit spend.",
          details: rpcErrorMessage(spendResponse.error),
        },
        { status: 500 }
      );
    }

    const spendData = spendResponse.data as CreditSpendResult | null;

    if (spendData?.ok === false) {
      await refundIfReserved("spend_mark_failed");

      return NextResponse.json(
        {
          ok: false,
          error: "Could not finalize credit spend.",
          code: spendData.code || "SPEND_FAILED",
          status: spendData.status,
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      ok: true,
      toolSlug,
      output: result.text,
      creditsSpent: prompt.creditCost,
    });
  } catch (error) {
    await refundIfReserved("generation_exception");

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
