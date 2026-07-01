import { NextRequest } from "next/server";
import { randomUUID } from "crypto";
import {
  getServerPrompt,
  validateToolInputs,
} from "@/lib/tools/server-prompts";
import { preprocessToolInputs } from "@/lib/tools/preprocess-inputs";
import { buildResearchContext } from "@/lib/tools/research-context";
import { calculateToolCreditCost } from "@/lib/tools/credit-costs";
import { createClient } from "@/lib/supabase/server";
import { routeToAI, type ChatMessage } from "@/lib/ai/routeToAI";

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

type SpendReservationResult =
  | { ok: true }
  | { ok: false; response: Response };

const articleStructureTools = new Set([
  "human-style-blog-post",
  "seo-optimized-blog-post",
  "advanced-blog-post",
  "quick-1-click-blog-post",
]);

function env(name: string, fallback = "") {
  return process.env[name] || fallback;
}

function getKeys(prefix: string, count: number) {
  return Array.from({ length: count }, (_, index) =>
    env(`${prefix}_${index + 1}`)
  ).filter(Boolean);
}

function uniqueValues(values: string[]) {
  const seen = new Set<string>();

  return values.filter((value) => {
    const cleaned = value.trim();
    if (!cleaned || seen.has(cleaned)) return false;
    seen.add(cleaned);
    return true;
  });
}

function getOpenRouterModels() {
  return uniqueValues([
    env("OPENROUTER_GEMINI_35_FLASH_MODEL", "google/gemini-3.5-flash"),
    env("OPENROUTER_GEMINI_FLASH_MODEL", "google/gemini-2.5-flash"),
    env("OPENROUTER_DEEPSEEK_PRO_MODEL", "deepseek/deepseek-v4-pro"),
    env("OPENROUTER_DEEPSEEK_FLASH_MODEL", "deepseek/deepseek-v4-flash"),
    env("OPENROUTER_GEMINI_PRO_MODEL", "google/gemini-2.5-pro"),
  ]);
}

function buildArticleStructureInstructions(toolSlug: string) {
  if (!articleStructureTools.has(toolSlug)) return "";

  return `\n\nMandatory article structure guard:\n- Use real Markdown headings, never plain standalone section labels.\n- Start with exactly one # H1 article title.\n- Use ## H2 for major sections and ### H3 for subsections.\n- Do not use bold text as a fake heading.\n- Do not output bare labels like Introduction, Conclusion, FAQ, Framework, Strategy, or Overview without ## or ###.\n- Tables must be valid GitHub-flavored Markdown tables with a header row, separator row, and complete body rows.\n- Do not output broken tables, half-empty rows, huge unreadable cells, or paragraph text pretending to be a table.\n- Keep all tables concise, useful, aligned with the section, and professional.`;
}

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

async function callOpenRouterStream(params: {
  model: string;
  apiKey: string;
  messages: ChatMessage[];
  maxTokens: number;
}) {
  const baseURL = env("OPENROUTER_BASE_URL", "https://openrouter.ai/api/v1");
  const siteURL = env("OPENROUTER_SITE_URL", "http://localhost:3000");
  const appTitle = env("OPENROUTER_APP_TITLE", "Creator");

  return fetch(`${baseURL.replace(/\/$/, "")}/chat/completions`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${params.apiKey}`,
      "Content-Type": "application/json",
      Accept: "text/event-stream",
      "HTTP-Referer": siteURL,
      "X-Title": appTitle,
    },
    body: JSON.stringify({
      model: params.model,
      messages: params.messages,
      temperature: 0.7,
      max_tokens: params.maxTokens,
      stream: true,
    }),
  });
}

function makeTextStreamFromOpenRouter(response: Response) {
  const upstream = response.body?.getReader();

  if (!upstream) {
    throw new Error("OpenRouter response did not include a stream body.");
  }

  const encoder = new TextEncoder();
  const decoder = new TextDecoder();
  let buffer = "";
  let closed = false;

  function safeClose(controller: ReadableStreamDefaultController<Uint8Array>) {
    if (!closed) {
      closed = true;
      controller.close();
    }
  }

  return new ReadableStream<Uint8Array>({
    async start(controller) {
      try {
        while (true) {
          const { value, done } = await upstream.read();

          if (done) {
            safeClose(controller);
            return;
          }

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split("\n");
          buffer = lines.pop() || "";

          for (const rawLine of lines) {
            const line = rawLine.trim();
            if (!line || line.startsWith(":")) continue;
            if (!line.startsWith("data:")) continue;

            const payload = line.slice(5).trim();

            if (payload === "[DONE]") {
              safeClose(controller);
              return;
            }

            try {
              const json = JSON.parse(payload) as {
                error?: { message?: string };
                choices?: Array<{
                  delta?: { content?: string };
                  message?: { content?: string };
                }>;
              };

              if (json.error?.message) {
                controller.enqueue(
                  encoder.encode(`\n\n[Stream error: ${json.error.message}]`)
                );
                continue;
              }

              const text =
                json.choices?.[0]?.delta?.content ||
                json.choices?.[0]?.message?.content ||
                "";

              if (text) controller.enqueue(encoder.encode(text));
            } catch {
              // Ignore malformed provider keepalive chunks.
            }
          }
        }
      } catch (error) {
        controller.error(error);
      } finally {
        upstream.releaseLock();
      }
    },
    async cancel() {
      await upstream.cancel();
    },
  });
}

function makeTextStreamFromText(text: string) {
  const encoder = new TextEncoder();

  return new ReadableStream<Uint8Array>({
    start(controller) {
      controller.enqueue(encoder.encode(text));
      controller.close();
    },
  });
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
      // Never expose refund internals to users.
    }
  }

  async function spendReservation(
    provider: string,
    model: string
  ): Promise<SpendReservationResult> {
    if (!supabase || !reservedTransactionId) {
      return {
        ok: false,
        response: Response.json(
          {
            ok: false,
            error: "Credit reservation failed.",
            code: "CREDIT_RESERVATION_MISSING_ID",
          },
          { status: 500 }
        ),
      };
    }

    const spendResponse = await supabase.rpc("spend_reserved_credits", {
      p_transaction_id: reservedTransactionId,
      p_provider: provider,
      p_model: model,
    });

    if (spendResponse.error) {
      await refundIfReserved("spend_mark_failed");

      return {
        ok: false,
        response: Response.json(
          {
            ok: false,
            error: "Could not finalize credit spend.",
            details: rpcErrorMessage(spendResponse.error),
          },
          { status: 500 }
        ),
      };
    }

    const spendData = spendResponse.data as CreditSpendResult | null;

    if (spendData?.ok === false) {
      await refundIfReserved("spend_mark_failed");

      return {
        ok: false,
        response: Response.json(
          {
            ok: false,
            error: "Could not finalize credit spend.",
            code: spendData.code || "SPEND_FAILED",
            status: spendData.status,
          },
          { status: 500 }
        ),
      };
    }

    return { ok: true };
  }

  try {
    supabase = await createClient();

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return Response.json(
        { ok: false, error: "Login required.", code: "AUTH_REQUIRED" },
        { status: 401 }
      );
    }

    const body = (await req.json()) as GenerateBody;
    const toolSlug = body.toolSlug?.trim();

    if (!toolSlug) {
      return Response.json(
        { ok: false, error: "Missing toolSlug.", code: "MISSING_TOOL_SLUG" },
        { status: 400 }
      );
    }

    const inputs = preprocessToolInputs(toolSlug, body.inputs || {});
    const prompt = getServerPrompt(toolSlug);

    if (!prompt) {
      return Response.json(
        { ok: false, error: `Unknown tool: ${toolSlug}`, code: "TOOL_NOT_FOUND" },
        { status: 404 }
      );
    }

    const validation = validateToolInputs(toolSlug, inputs);

    if (!validation.ok) {
      return Response.json(
        {
          ok: false,
          error: validation.error,
          code: "VALIDATION_ERROR",
          field: validation.field,
        },
        { status: 400 }
      );
    }

    const requiredCredits = calculateToolCreditCost(toolSlug, inputs);

    const reserveResponse = await supabase.rpc("reserve_credits", {
      p_tool_slug: toolSlug,
      p_amount: requiredCredits,
      p_idempotency_key: `${user.id}:${toolSlug}:${randomUUID()}`,
    });

    if (reserveResponse.error) {
      return Response.json(
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
      return Response.json(
        {
          ok: false,
          error: "Not enough credits.",
          code: reservation?.code || "INSUFFICIENT_CREDITS",
          requiredCredits: reservation?.requiredCredits ?? requiredCredits,
          currentCredits: reservation?.currentCredits ?? 0,
        },
        { status: 402 }
      );
    }

    reservedTransactionId = reservation.transactionId || null;

    if (!reservedTransactionId) {
      return Response.json(
        {
          ok: false,
          error: "Credit reservation failed.",
          code: "CREDIT_RESERVATION_MISSING_ID",
        },
        { status: 500 }
      );
    }

    const researchContext = await buildResearchContext(toolSlug, inputs);
    const researchInstructions = researchContext
      ? `\n\nSource/research context:\n${researchContext}\n\nResearch instructions:\nUse the source/research context above for data-backed insights and coded visuals. Do not invent numeric claims beyond supplied or fetched context.`
      : "";
    const structureInstructions = buildArticleStructureInstructions(toolSlug);

    const messages: ChatMessage[] = [
      {
        role: "system",
        content: prompt.system,
      },
      {
        role: "user",
        content: `Tool: ${toolSlug}

Charged credits for this request: ${requiredCredits}

User inputs:
${formatInputs(inputs)}${researchInstructions}

Output requirements:
${prompt.outputGuide}${structureInstructions}`,
      },
    ];

    const maxTokens = 25000;
    const failures: string[] = [];
    const openRouterKeys = getKeys("OPENROUTER_API_KEY", 3);
    const openRouterModels = getOpenRouterModels();

    for (const model of openRouterModels) {
      for (let keyIndex = 0; keyIndex < openRouterKeys.length; keyIndex++) {
        try {
          const response = await callOpenRouterStream({
            model,
            apiKey: openRouterKeys[keyIndex],
            messages,
            maxTokens,
          });

          if (!response.ok) {
            const raw = await response.text();
            failures.push(`${model} key#${keyIndex}: HTTP ${response.status} ${raw.slice(0, 300)}`);
            continue;
          }

          const spend = await spendReservation("openrouter", model);

          if (!spend.ok) return spend.response;

          return new Response(makeTextStreamFromOpenRouter(response), {
            headers: {
              "Content-Type": "text/plain; charset=utf-8",
              "Cache-Control": "no-cache, no-transform",
              "X-Accel-Buffering": "no",
              "X-Creator-Stream-Provider": "openrouter",
              "X-Creator-Stream-Model": model,
              "X-Creator-Stream-Key-Index": String(keyIndex),
            },
          });
        } catch (error) {
          failures.push(`${model} key#${keyIndex}: ${error instanceof Error ? error.message : String(error)}`);
        }
      }
    }

    try {
      const fallback = await routeToAI({
        requestLabel: toolSlug,
        temperature: 0.7,
        maxTokens,
        messages,
      });

      const spend = await spendReservation(fallback.provider, fallback.model);

      if (!spend.ok) return spend.response;

      return new Response(makeTextStreamFromText(fallback.text), {
        headers: {
          "Content-Type": "text/plain; charset=utf-8",
          "Cache-Control": "no-cache",
          "X-Accel-Buffering": "no",
          "X-Creator-Stream-Provider": fallback.provider,
          "X-Creator-Stream-Model": fallback.model,
          "X-Creator-Stream-Fallback": "true",
        },
      });
    } catch (fallbackError) {
      await refundIfReserved("all_streaming_and_fallback_attempts_failed");

      return Response.json(
        {
          ok: false,
          error: "All AI generation attempts failed.",
          details: [
            failures.length ? `Streaming attempts:\n${failures.join("\n")}` : "No OpenRouter streaming attempts were available.",
            `Fallback error:\n${fallbackError instanceof Error ? fallbackError.message : String(fallbackError)}`,
          ].join("\n\n"),
        },
        { status: 500 }
      );
    }
  } catch (error) {
    await refundIfReserved("streaming_generation_exception");

    return Response.json(
      {
        ok: false,
        error: "Streaming generation failed.",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}
