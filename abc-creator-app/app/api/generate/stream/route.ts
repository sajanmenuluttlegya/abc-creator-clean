import { NextRequest } from "next/server";
import { randomUUID } from "crypto";
import { getServerPrompt } from "@/lib/tools/server-prompts";
import { createClient } from "@/lib/supabase/server";
import { routeToAI, type ChatMessage } from "@/lib/ai/routeToAI";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type GenerateBody = {
  toolSlug?: string;
  inputs?: Record<string, string>;
};

function env(name: string, fallback = "") {
  return process.env[name] || fallback;
}

function getKeys(prefix: string, count: number) {
  return Array.from({ length: count }, (_, index) =>
    env(`${prefix}_${index + 1}`)
  ).filter(Boolean);
}

function formatInputs(inputs: Record<string, string>) {
  return Object.entries(inputs)
    .map(([key, value]) => `${key}: ${value}`)
    .join("\n");
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
              // Ignore malformed keepalive/provider chunks.
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

  async function spendReservation(provider: string, model: string) {
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

    return { ok: true, response: null };
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
    const inputs = body.inputs || {};

    if (!toolSlug) {
      return Response.json(
        { ok: false, error: "Missing toolSlug." },
        { status: 400 }
      );
    }

    const prompt = getServerPrompt(toolSlug);

    if (!prompt) {
      return Response.json(
        { ok: false, error: `Unknown tool: ${toolSlug}` },
        { status: 404 }
      );
    }

    const hasUsefulInput = Object.values(inputs).some(
      (value) => typeof value === "string" && value.trim().length > 1
    );

    if (!hasUsefulInput) {
      return Response.json(
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
          requiredCredits: reservation?.requiredCredits ?? prompt.creditCost,
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

    const messages: ChatMessage[] = [
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
    ];

    const maxTokens = 12000;
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
            failures.push(
              `${model} key#${keyIndex}: HTTP ${response.status} ${raw.slice(
                0,
                300
              )}`
            );
            continue;
          }

          const spend = await spendReservation("openrouter", model);

          if (!spend.ok) {
            return spend.response;
          }

          const stream = makeTextStreamFromOpenRouter(response);

          return new Response(stream, {
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
          failures.push(
            `${model} key#${keyIndex}: ${
              error instanceof Error ? error.message : String(error)
            }`
          );
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

      if (!spend.ok) {
        return spend.response;
      }

      return new Response(makeTextStreamFromText(fallback.text), {
        headers: {
          "Content-Type": "text/plain; charset=utf-8",
          "Cache-Control": "no-cache, no-transform",
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
