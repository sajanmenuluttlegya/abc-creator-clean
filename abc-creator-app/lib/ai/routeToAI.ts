export type ChatMessage = {
  role: "system" | "user" | "assistant";
  content: string;
};

export type RouteToAIInput = {
  messages: ChatMessage[];
  temperature?: number;
  maxTokens?: number;
  timeoutMs?: number;
  requestLabel?: string;
};

export type AttemptLog = {
  provider: string;
  model: string;
  keyIndex: number;
  ok: boolean;
  latencyMs: number;
  timeoutMs: number;
  error?: string;
  status?: number;
};

export type RouteToAIResult = {
  text: string;
  provider: string;
  model: string;
  keyIndex: number;
  latencyMs: number;
  attempts: AttemptLog[];
};

type AttemptPlan = {
  provider: "openrouter" | "opencode-chat" | "gemini-direct";
  model: string;
  apiKey: string;
  keyIndex: number;
  timeoutMs: number;
};

function env(name: string, fallback = "") {
  return process.env[name] || fallback;
}

function getKeys(prefix: string, count: number) {
  return Array.from({ length: count }, (_, index) =>
    env(`${prefix}_${index + 1}`)
  ).filter(Boolean);
}

function cleanError(error: unknown) {
  if (error instanceof Error) return error.message.slice(0, 900);
  return String(error).slice(0, 900);
}

function buildPrompt(messages: ChatMessage[]) {
  const system = messages
    .filter((message) => message.role === "system")
    .map((message) => message.content)
    .join("\n\n")
    .trim();

  const user = messages
    .filter((message) => message.role !== "system")
    .map((message) => `${message.role.toUpperCase()}:\n${message.content}`)
    .join("\n\n")
    .trim();

  return { system, user };
}

async function fetchWithTimeout(
  url: string,
  init: RequestInit,
  timeoutMs: number
) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    return await fetch(url, {
      ...init,
      signal: controller.signal,
    });
  } finally {
    clearTimeout(timer);
  }
}

function pushAttempts(
  attempts: AttemptPlan[],
  provider: AttemptPlan["provider"],
  model: string,
  keys: string[],
  timeoutMs: number
) {
  if (!model.trim()) return;

  keys.forEach((apiKey, keyIndex) => {
    attempts.push({
      provider,
      model,
      apiKey,
      keyIndex,
      timeoutMs,
    });
  });
}

function buildAttemptPlan() {
  const attempts: AttemptPlan[] = [];

  const openRouterKeys = getKeys("OPENROUTER_API_KEY", 3);
  const opencodeKeys = getKeys("OPENCODE_API_KEY", 4);
  const geminiKeys = getKeys("GEMINI_API_KEY", 5);

  const openRouterGemini35Flash = env(
    "OPENROUTER_GEMINI_35_FLASH_MODEL",
    "google/gemini-3.5-flash"
  );

  const openRouterGemini25Flash = env(
    "OPENROUTER_GEMINI_FLASH_MODEL",
    "google/gemini-2.5-flash"
  );

  const openRouterDeepSeekPro = env(
    "OPENROUTER_DEEPSEEK_PRO_MODEL",
    "deepseek/deepseek-v4-pro"
  );

  const openRouterDeepSeekFlash = env(
    "OPENROUTER_DEEPSEEK_FLASH_MODEL",
    "deepseek/deepseek-v4-flash"
  );

  const opencodeBaseURL = env("OPENCODE_BASE_URL");
  const opencodeDeepSeekPro = env(
    "OPENCODE_DEEPSEEK_PRO_MODEL",
    "deepseek-v4-pro"
  );

  const opencodeDeepSeekFlash = env(
    "OPENCODE_DEEPSEEK_FLASH_MODEL",
    "deepseek-v4-flash"
  );

  const geminiPrimary = env("GEMINI_FLASH_MODEL", "gemini-3.5-flash");

  const geminiFallback1 = env(
    "GEMINI_FALLBACK_FLASH_MODEL_1",
    env("GEMINI_FALLBACK_FLASH_MODEL", "gemini-2.5-flash")
  );

  const geminiFallback2 = env(
    "GEMINI_FALLBACK_FLASH_MODEL_2",
    "gemini-2.5-flash-lite"
  );

  // 1. OpenRouter Gemini 3.5 Flash — primary
  pushAttempts(attempts, "openrouter", openRouterGemini35Flash, openRouterKeys, 12000);

  // 2. OpenRouter Gemini 2.5 Flash — first fallback
  pushAttempts(attempts, "openrouter", openRouterGemini25Flash, openRouterKeys, 10000);

  // 3. OpenRouter DeepSeek V4 Pro
  pushAttempts(attempts, "openrouter", openRouterDeepSeekPro, openRouterKeys, 12000);

  // 4. OpenRouter DeepSeek V4 Flash
  pushAttempts(attempts, "openrouter", openRouterDeepSeekFlash, openRouterKeys, 9000);

  // 5. OpenCode Zen / compatible DeepSeek models
  // Only enabled when OPENCODE_BASE_URL exists.
  if (opencodeBaseURL.trim()) {
    pushAttempts(attempts, "opencode-chat", opencodeDeepSeekPro, opencodeKeys, 12000);
    pushAttempts(attempts, "opencode-chat", opencodeDeepSeekFlash, opencodeKeys, 9000);
  }

  // 6. Direct Gemini 3.5 Flash
  pushAttempts(attempts, "gemini-direct", geminiPrimary, geminiKeys, 10000);

  // 7. Direct Gemini 2.5 Flash
  pushAttempts(attempts, "gemini-direct", geminiFallback1, geminiKeys, 9000);

  // 8. Direct Gemini 2.5 Flash-Lite
  pushAttempts(attempts, "gemini-direct", geminiFallback2, geminiKeys, 8000);

  return attempts;
}

async function callOpenRouter(attempt: AttemptPlan, input: RouteToAIInput) {
  const baseURL = env("OPENROUTER_BASE_URL", "https://openrouter.ai/api/v1");
  const siteURL = env("OPENROUTER_SITE_URL", "http://localhost:3000");
  const appTitle = env("OPENROUTER_APP_TITLE", "Creator");

  const response = await fetchWithTimeout(
    `${baseURL.replace(/\/$/, "")}/chat/completions`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${attempt.apiKey}`,
        "Content-Type": "application/json",
        Accept: "application/json",
        "HTTP-Referer": siteURL,
        "X-Title": appTitle,
      },
      body: JSON.stringify({
        model: attempt.model,
        messages: input.messages,
        temperature: input.temperature ?? 0.7,
        max_tokens: input.maxTokens ?? 6000,
        stream: false,
      }),
    },
    attempt.timeoutMs
  );

  const raw = await response.text();

  if (!response.ok) {
    const error = new Error(`HTTP ${response.status}: ${raw.slice(0, 1100)}`) as Error & {
      status?: number;
    };
    error.status = response.status;
    throw error;
  }

  const data = JSON.parse(raw) as {
    choices?: Array<{
      message?: {
        content?: string;
      };
      text?: string;
    }>;
  };

  const text =
    data.choices?.[0]?.message?.content ||
    data.choices?.[0]?.text ||
    "";

  if (!text.trim()) {
    throw new Error(`OpenRouter returned empty text: ${raw.slice(0, 900)}`);
  }

  return text.trim();
}

async function callOpenCodeChat(attempt: AttemptPlan, input: RouteToAIInput) {
  const baseURL = env("OPENCODE_BASE_URL", "https://opencode.ai/zen/v1");

  const response = await fetchWithTimeout(
    `${baseURL.replace(/\/$/, "")}/chat/completions`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${attempt.apiKey}`,
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({
        model: attempt.model,
        messages: input.messages,
        temperature: input.temperature ?? 0.7,
        max_tokens: input.maxTokens ?? 6000,
        stream: false,
      }),
    },
    attempt.timeoutMs
  );

  const raw = await response.text();

  if (!response.ok) {
    const error = new Error(`HTTP ${response.status}: ${raw.slice(0, 1100)}`) as Error & {
      status?: number;
    };
    error.status = response.status;
    throw error;
  }

  const data = JSON.parse(raw) as {
    choices?: Array<{
      message?: {
        content?: string;
      };
      text?: string;
    }>;
  };

  const text =
    data.choices?.[0]?.message?.content ||
    data.choices?.[0]?.text ||
    "";

  if (!text.trim()) {
    throw new Error(`OpenCode returned empty text: ${raw.slice(0, 900)}`);
  }

  return text.trim();
}

async function callGeminiDirect(attempt: AttemptPlan, input: RouteToAIInput) {
  const { system, user } = buildPrompt(input.messages);

  const url = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(
    attempt.model
  )}:generateContent`;

  const body = {
    contents: [
      {
        role: "user",
        parts: [{ text: user }],
      },
    ],
    systemInstruction: system
      ? {
          parts: [{ text: system }],
        }
      : undefined,
    generationConfig: {
      temperature: input.temperature ?? 0.7,
      maxOutputTokens: input.maxTokens ?? 6000,
    },
  };

  const response = await fetchWithTimeout(
    url,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        "x-goog-api-key": attempt.apiKey,
      },
      body: JSON.stringify(body),
    },
    attempt.timeoutMs
  );

  const raw = await response.text();

  if (!response.ok) {
    const error = new Error(`HTTP ${response.status}: ${raw.slice(0, 1100)}`) as Error & {
      status?: number;
    };
    error.status = response.status;
    throw error;
  }

  const data = JSON.parse(raw) as {
    candidates?: Array<{
      content?: {
        parts?: Array<{
          text?: string;
        }>;
      };
    }>;
  };

  const text =
    data.candidates?.[0]?.content?.parts
      ?.map((part) => part.text || "")
      .join("")
      .trim() || "";

  if (!text) {
    throw new Error(`Gemini returned empty text: ${raw.slice(0, 900)}`);
  }

  return text;
}

async function callAttempt(attempt: AttemptPlan, input: RouteToAIInput) {
  if (attempt.provider === "openrouter") {
    return callOpenRouter(attempt, input);
  }

  if (attempt.provider === "opencode-chat") {
    return callOpenCodeChat(attempt, input);
  }

  return callGeminiDirect(attempt, input);
}

export async function routeToAI(input: RouteToAIInput): Promise<RouteToAIResult> {
  const attempts = buildAttemptPlan();
  const logs: AttemptLog[] = [];

  if (attempts.length === 0) {
    throw new Error(
      "No AI provider keys configured. Add OPENROUTER_API_KEY_1, OPENCODE_API_KEY_1, or GEMINI_API_KEY_1 to .env.local."
    );
  }

  const globalTimeoutMs =
    input.timeoutMs ?? Number(env("AI_GLOBAL_TIMEOUT_MS", "55000"));

  const globalStart = Date.now();
  let lastError = "No AI attempt executed.";

  for (const attempt of attempts) {
    const elapsed = Date.now() - globalStart;
    const remaining = globalTimeoutMs - elapsed;

    if (remaining <= 0) {
      lastError = `Global timeout reached after ${globalTimeoutMs}ms.`;
      break;
    }

    const effectiveTimeout = Math.min(
      attempt.timeoutMs,
      Math.max(1000, remaining)
    );

    const start = Date.now();

    try {
      const text = await callAttempt(
        {
          ...attempt,
          timeoutMs: effectiveTimeout,
        },
        input
      );

      const latencyMs = Date.now() - start;

      logs.push({
        provider: attempt.provider,
        model: attempt.model,
        keyIndex: attempt.keyIndex,
        ok: true,
        latencyMs,
        timeoutMs: effectiveTimeout,
      });

      return {
        text,
        provider: attempt.provider,
        model: attempt.model,
        keyIndex: attempt.keyIndex,
        latencyMs,
        attempts: logs,
      };
    } catch (error: unknown) {
      const latencyMs = Date.now() - start;
      const status =
        typeof (error as { status?: unknown }).status === "number"
          ? (error as { status: number }).status
          : undefined;

      const message = cleanError(error);

      logs.push({
        provider: attempt.provider,
        model: attempt.model,
        keyIndex: attempt.keyIndex,
        ok: false,
        latencyMs,
        timeoutMs: effectiveTimeout,
        status,
        error: message,
      });

      lastError = `${attempt.provider}/${attempt.model}/key#${attempt.keyIndex}: ${message}`;
    }
  }

  const debug = logs
    .map(
      (attempt) =>
        `${attempt.ok ? "OK" : "FAIL"} ${attempt.provider} ${attempt.model} key#${attempt.keyIndex} ${attempt.latencyMs}ms ${attempt.status || ""} ${attempt.error || ""}`
    )
    .join("\n");

  throw new Error(
    `All AI attempts failed.\nLast error: ${lastError}\nAttempts:\n${debug}`
  );
}
