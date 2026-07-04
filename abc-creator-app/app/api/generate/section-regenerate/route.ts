import { NextRequest } from "next/server";
import { randomUUID } from "crypto";
import { createClient } from "@/lib/supabase/server";
import { routeToAI } from "@/lib/ai/routeToAI";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const TEXT_REGENERATION_CREDITS = 2;

const ledgerToolSlug = "text-regeneration";

type Body = {
  toolSlug?: string;
  sectionText?: string;
  instruction?: string;
};

type CreditReservation = {
  ok?: boolean;
  code?: string;
  transactionId?: string;
};

type CreditSpendResult = {
  ok?: boolean;
  code?: string;
  status?: string;
};

function cleanText(value: unknown, limit: number) {
  const text = typeof value === "string" ? value.trim() : "";
  return text.length > limit ? text.slice(0, limit) : text;
}

function rpcErrorMessage(error: unknown) {
  if (!error) return "Unknown credit ledger error.";
  if (error instanceof Error) return error.message;
  if (typeof error === "object") {
    const value = error as { message?: unknown; details?: unknown; hint?: unknown; code?: unknown };
    return [value.message, value.details, value.hint, value.code]
      .filter((item) => typeof item === "string" && item.trim())
      .join(" ") || String(error);
  }
  return String(error);
}

export async function POST(req: NextRequest) {
  let reservedTransactionId: string | null = null;
  const supabase = await createClient();

  async function refundIfReserved(reason: string) {
    if (!reservedTransactionId) return;
    try {
      await supabase.rpc("refund_reserved_credits", {
        p_transaction_id: reservedTransactionId,
        p_reason: reason,
      });
    } catch {
      // Never expose refund internals to users.
    }
  }

  try {
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

    const reserveResponse = await supabase.rpc("reserve_credits", {
      p_tool_slug: ledgerToolSlug,
      p_amount: TEXT_REGENERATION_CREDITS,
      p_idempotency_key: `${auth.data.user.id}:${ledgerToolSlug}:${randomUUID()}`,
    });

    if (reserveResponse.error) {
      return Response.json(
        { ok: false, error: "Could not reserve credits.", details: rpcErrorMessage(reserveResponse.error) },
        { status: 500 }
      );
    }

    const reservation = reserveResponse.data as CreditReservation | null;
    if (!reservation?.ok) {
      return Response.json({ ok: false, error: "Not enough credits.", code: reservation?.code || "INSUFFICIENT_CREDITS" }, { status: 402 });
    }

    reservedTransactionId = reservation.transactionId || null;
    if (!reservedTransactionId) {
      return Response.json({ ok: false, error: "Credit reservation failed.", code: "CREDIT_RESERVATION_MISSING_ID" }, { status: 500 });
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

    const spendResponse = await supabase.rpc("spend_reserved_credits", {
      p_transaction_id: reservedTransactionId,
      p_provider: result.provider,
      p_model: result.model,
    });

    if (spendResponse.error) {
      await refundIfReserved("text_regeneration_spend_failed");
      return Response.json(
        { ok: false, error: "Could not finalize credit spend.", details: rpcErrorMessage(spendResponse.error) },
        { status: 500 }
      );
    }

    const spendData = spendResponse.data as CreditSpendResult | null;
    if (spendData?.ok === false) {
      await refundIfReserved("text_regeneration_spend_rejected");
      return Response.json(
        { ok: false, error: "Could not finalize credit spend.", code: spendData.code || "SPEND_FAILED", status: spendData.status },
        { status: 500 }
      );
    }

    return Response.json({ ok: true, text: result.text.trim() });
  } catch (error) {
    await refundIfReserved("text_regeneration_exception");
    return Response.json({ ok: false, error: "Section regeneration failed.", details: error instanceof Error ? error.message : String(error) }, { status: 500 });
  }
}
