import { randomUUID } from "crypto";
import { NextRequest } from "next/server";
import { routeToAI } from "@/lib/ai/routeToAI";
import { createClient } from "@/lib/supabase/server";
import { getBookTitleSelection } from "@/lib/tools/book-title-selection";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Body = {
  scope?: "single" | "all";
  sectionText?: string;
  fullOutput?: string;
  inputs?: Record<string, string>;
};

type CreditReservation = { ok?: boolean; code?: string; transactionId?: string };
type CreditSpendResult = { ok?: boolean; code?: string; status?: string };

function cleanText(value: unknown, limit: number) {
  const text = typeof value === "string" ? value.trim() : "";
  return text.length > limit ? text.slice(0, limit) : text;
}

function rpcErrorMessage(error: unknown) {
  if (!error) return "Unknown credit ledger error.";
  if (error instanceof Error) return error.message;
  if (typeof error === "object") {
    const value = error as { message?: unknown; details?: unknown; hint?: unknown; code?: unknown };
    return [value.message, value.details, value.hint, value.code].filter((item) => typeof item === "string" && item.trim()).join(" ") || String(error);
  }
  return String(error);
}

function exactTitleIndex(sectionText: string) {
  const match = sectionText.match(/^##\s+Title\s+(\d+)/im);
  const parsed = Number(match?.[1]);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : 1;
}

function exactTitleNumbers(value: string) {
  return Array.from(value.matchAll(/^##\s+Title\s+(\d+)\s*[—–:-]/gim)).map((match) => Number(match[1]));
}

function hasExactTitleShape(value: string, scope: "single" | "all", titleIndex: number, expectedCount: number) {
  const numbers = exactTitleNumbers(value);
  if (scope === "single") return numbers.length === 1 && numbers[0] === titleIndex;
  return numbers.length === expectedCount && numbers.every((number, index) => number === index + 1);
}

function inputContext(inputs: Record<string, string>) {
  const ordered = [
    ["Working book title", inputs.book_title],
    ["Author", inputs.author_name],
    ["Book size", inputs.book_size],
    ["Title-page font", inputs.font_style],
    ["Genre / niche", inputs.genre],
    ["Audience", inputs.target_audience],
    ["Author voice", inputs.author_voice],
    ["Language", inputs.language],
    ["Book brief", inputs.book_brief],
    ["Title style", inputs.title_style],
  ];
  return ordered.filter(([, value]) => value?.trim()).map(([label, value]) => `${label}: ${value!.trim()}`).join("\n");
}

export async function POST(req: NextRequest) {
  let reservedTransactionId: string | null = null;
  const supabase = await createClient();

  async function refundIfReserved(reason: string) {
    if (!reservedTransactionId) return;
    try {
      await supabase.rpc("refund_reserved_credits", { p_transaction_id: reservedTransactionId, p_reason: reason });
    } catch {
      // Keep credit-ledger internals private.
    }
  }

  try {
    const auth = await supabase.auth.getUser();
    if (auth.error || !auth.data.user) return Response.json({ ok: false, error: "Login required.", code: "AUTH_REQUIRED" }, { status: 401 });

    const body = (await req.json()) as Body;
    const scope = body.scope === "all" ? "all" : "single";
    const inputs = body.inputs && typeof body.inputs === "object" ? body.inputs : {};
    const selection = getBookTitleSelection(inputs.title_count);
    const requiredCredits = scope === "single" ? 1 : selection.credits;
    const sectionText = cleanText(body.sectionText, 6000);
    const fullOutput = cleanText(body.fullOutput, 18000);

    if (scope === "single" && sectionText.length < 5) return Response.json({ ok: false, error: "A title option is required." }, { status: 400 });
    if (!cleanText(inputs.book_brief, 9000)) return Response.json({ ok: false, error: "The original book brief is required for title regeneration." }, { status: 400 });

    const ledgerToolSlug = scope === "single" ? "book-title-single-regeneration" : "book-title-all-regeneration";
    const reserveResponse = await supabase.rpc("reserve_credits", {
      p_tool_slug: ledgerToolSlug,
      p_amount: requiredCredits,
      p_idempotency_key: `${auth.data.user.id}:${ledgerToolSlug}:${randomUUID()}`,
    });
    if (reserveResponse.error) return Response.json({ ok: false, error: "Could not reserve credits.", details: rpcErrorMessage(reserveResponse.error), requiredCredits }, { status: 500 });

    const reservation = reserveResponse.data as CreditReservation | null;
    if (!reservation?.ok) return Response.json({ ok: false, error: "Not enough credits.", code: reservation?.code || "INSUFFICIENT_CREDITS", requiredCredits }, { status: 402 });
    reservedTransactionId = reservation.transactionId || null;
    if (!reservedTransactionId) return Response.json({ ok: false, error: "Credit reservation failed.", code: "CREDIT_RESERVATION_MISSING_ID", requiredCredits }, { status: 500 });

    const titleIndex = exactTitleIndex(sectionText);
    const system = scope === "single"
      ? [
          "You regenerate exactly one book-title option.",
          "Return only one Markdown section beginning exactly with: ## Title N — <new title>, using the supplied N.",
          "Below it, include one concise rationale and only when useful one subtitle or series-line suggestion.",
          "Do not repeat any title already visible in the supplied current output.",
          "Do not add a title page, shortlist, best-fit section, verification section, or extra titles.",
          "Never claim title, domain, trademark, or marketplace availability.",
        ].join("\n")
      : [
          "You regenerate a complete Book Title Generator result.",
          `Return exactly ${selection.count} title options, never more and never fewer.`,
          "Use this exact Markdown structure:",
          "# Title Page",
          "Book size: <supplied book size>",
          "Font: <supplied font>",
          "<center><strong><supplied working book title></strong></center>",
          "<center><supplied author></center>",
          "---",
          "# Book Title Options",
          "## Title 1 — <title>",
          "Rationale: <one concise sentence>",
          "Optional subtitle / series line: <only when genuinely useful>",
          `Continue through ## Title ${selection.count} — <title>.`,
          "End with ## Best Fit and ## Verify Availability.",
          "Never claim title, domain, trademark, or marketplace availability.",
        ].join("\n");

    const user = scope === "single"
      ? `Replace title option ${titleIndex}.\n\nOriginal inputs:\n${inputContext(inputs)}\n\nCurrent complete output to avoid duplicates:\n${fullOutput}\n\nSelected title section:\n${sectionText}`
      : `Original inputs:\n${inputContext(inputs)}\n\nThe user selected exactly ${selection.count} titles. Generate a fresh complete result.`;

    let result: Awaited<ReturnType<typeof routeToAI>> | null = null;
    let text = "";
    for (let attempt = 0; attempt < 2; attempt += 1) {
      const attemptUser = attempt === 0 ? user : `${user}\n\nCorrection required: the previous response had the wrong number or numbering of title sections. Return the exact required Markdown title sections and nothing extra beyond the allowed structure.`;
      const candidate = await routeToAI({
        requestLabel: `book-title-regenerate:${scope}:attempt-${attempt + 1}`,
        temperature: 0.78,
        maxTokens: scope === "single" ? 700 : Math.min(4200, 1100 + selection.count * 280),
        messages: [{ role: "system", content: system }, { role: "user", content: attemptUser }],
      });
      const candidateText = candidate.text.trim();
      if (candidateText && hasExactTitleShape(candidateText, scope, titleIndex, selection.count)) {
        result = candidate;
        text = candidateText;
        break;
      }
    }

    if (!result || !text) {
      await refundIfReserved("book_title_regeneration_invalid_count");
      return Response.json({ ok: false, error: `Title regeneration did not return the exact required ${scope === "single" ? 1 : selection.count} title option${scope === "single" || selection.count === 1 ? "" : "s"}. No credits were charged.`, requiredCredits }, { status: 502 });
    }

    const spendResponse = await supabase.rpc("spend_reserved_credits", { p_transaction_id: reservedTransactionId, p_provider: result.provider, p_model: result.model });
    if (spendResponse.error) {
      await refundIfReserved("book_title_regeneration_spend_failed");
      return Response.json({ ok: false, error: "Could not finalize credit spend.", details: rpcErrorMessage(spendResponse.error), requiredCredits }, { status: 500 });
    }
    const spendData = spendResponse.data as CreditSpendResult | null;
    if (spendData?.ok === false) {
      await refundIfReserved("book_title_regeneration_spend_rejected");
      return Response.json({ ok: false, error: "Could not finalize credit spend.", code: spendData.code || "SPEND_FAILED", status: spendData.status, requiredCredits }, { status: 500 });
    }

    return Response.json({ ok: true, text, creditsSpent: requiredCredits, scope, titleCount: selection.count });
  } catch (error) {
    await refundIfReserved("book_title_regeneration_exception");
    return Response.json({ ok: false, error: "Book-title regeneration failed.", details: error instanceof Error ? error.message : String(error) }, { status: 500 });
  }
}
