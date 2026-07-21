from __future__ import annotations

from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
APP = ROOT / "abc-creator-app"


def replace_once(text: str, old: str, new: str, label: str) -> str:
    if new in text:
        return text
    if old not in text:
        raise RuntimeError(f"Expected block not found: {label}")
    return text.replace(old, new, 1)


def write(path: Path, text: str) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    current = path.read_text(encoding="utf-8") if path.exists() else None
    if current != text:
        path.write_text(text, encoding="utf-8")


helper = '''export type BookTitleSelection = { count: 1 | 3 | 5 | 10; credits: 1 | 2 | 3 | 5 };

const BOOK_TITLE_SELECTIONS: BookTitleSelection[] = [
  { count: 10, credits: 5 },
  { count: 5, credits: 3 },
  { count: 3, credits: 2 },
  { count: 1, credits: 1 },
];

export function getBookTitleSelection(value: string | undefined): BookTitleSelection {
  const normalized = (value || "").toLowerCase();
  return BOOK_TITLE_SELECTIONS.find((selection) => normalized.includes(`${selection.count} title`)) || BOOK_TITLE_SELECTIONS[3];
}

export function isBookTitleOptionBlock(value: string) {
  return /^##\\s+Title\\s+\\d+\\s*[—–:-]/im.test(value.trim());
}
'''
write(APP / "lib/tools/book-title-selection.ts", helper)

endpoint = '''import { randomUUID } from "crypto";
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
  const match = sectionText.match(/^##\\s+Title\\s+(\\d+)/im);
  const parsed = Number(match?.[1]);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : 1;
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
  return ordered.filter(([, value]) => value?.trim()).map(([label, value]) => `${label}: ${value!.trim()}`).join("\\n");
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
        ].join("\\n")
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
        ].join("\\n");

    const user = scope === "single"
      ? `Replace title option ${titleIndex}.\\n\\nOriginal inputs:\\n${inputContext(inputs)}\\n\\nCurrent complete output to avoid duplicates:\\n${fullOutput}\\n\\nSelected title section:\\n${sectionText}`
      : `Original inputs:\\n${inputContext(inputs)}\\n\\nThe user selected exactly ${selection.count} titles. Generate a fresh complete result.`;

    const result = await routeToAI({
      requestLabel: `book-title-regenerate:${scope}`,
      temperature: 0.78,
      maxTokens: scope === "single" ? 700 : Math.min(4200, 1100 + selection.count * 280),
      messages: [{ role: "system", content: system }, { role: "user", content: user }],
    });

    const text = result.text.trim();
    if (!text) {
      await refundIfReserved("book_title_regeneration_empty");
      return Response.json({ ok: false, error: "Title regeneration returned no text.", requiredCredits }, { status: 502 });
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
'''
write(APP / "app/api/generate/book-title-regenerate/route.ts", endpoint)

server_path = APP / "lib/tools/server-book-tools.ts"
server = server_path.read_text(encoding="utf-8")
old_guide = '''    outputGuide: `${titlePageGuide}

Return # Book Title Options. Produce exactly the selected title_count: 1, 3, 5, or 10 title options—never extra titles. Keep the response focused. For each title include one concise rationale and, only when useful, one subtitle or series-line suggestion. End with a short Best Fit note and a Verify Availability reminder. Do not claim title, domain, trademark, or marketplace availability.`'''
new_guide = '''    outputGuide: `${titlePageGuide}

Return # Book Title Options and exactly the selected title_count: 1, 3, 5, or 10 title options—never more or fewer. Format every option as its own section: ## Title 1 — <title>, ## Title 2 — <title>, and so on. Under each title include one concise rationale and, only when genuinely useful, one subtitle or series-line suggestion. End with ## Best Fit and ## Verify Availability. Keep the whole response focused. Do not claim title, domain, trademark, or marketplace availability.`'''
server = replace_once(server, old_guide, new_guide, "Book Title Generator exact section format")
server_path.write_text(server, encoding="utf-8")

panel_path = APP / "components/OutputPanel.tsx"
panel = panel_path.read_text(encoding="utf-8")
panel = replace_once(
    panel,
    'import type { RecommendedNextAction } from "@/lib/tools/public-tools";\n',
    'import type { RecommendedNextAction } from "@/lib/tools/public-tools";\nimport { getBookTitleSelection, isBookTitleOptionBlock } from "@/lib/tools/book-title-selection";\n',
    "book-title helper import",
)
panel = replace_once(
    panel,
    'type SectionRegenerateResponse = { ok?: boolean; error?: string; details?: string; text?: string };\n',
    'type SectionRegenerateResponse = { ok?: boolean; error?: string; details?: string; text?: string };\ntype BookTitleRegenerateResponse = SectionRegenerateResponse & { code?: string; requiredCredits?: number; creditsSpent?: number; titleCount?: number };\n',
    "book-title response type",
)
panel = replace_once(
    panel,
    '  const [sectionActionMessage, setSectionActionMessage] = useState("");\n',
    '  const [sectionActionMessage, setSectionActionMessage] = useState("");\n  const [bookTitleOutputOverride, setBookTitleOutputOverride] = useState<string | null>(null);\n  const [regeneratingAllBookTitles, setRegeneratingAllBookTitles] = useState(false);\n',
    "book-title regeneration states",
)
panel = replace_once(
    panel,
    '  const displayOutput = useMemo(() => cleanOutputForDisplay(output), [output]);\n  const outputBlocks = useMemo(() => splitOutputIntoDeletableBlocks(displayOutput), [displayOutput]);\n',
    '  const displayOutput = useMemo(() => cleanOutputForDisplay(output), [output]);\n  const effectiveDisplayOutput = bookTitleOutputOverride ?? displayOutput;\n  const outputBlocks = useMemo(() => splitOutputIntoDeletableBlocks(effectiveDisplayOutput), [effectiveDisplayOutput]);\n',
    "effective book-title output",
)
panel = replace_once(
    panel,
    '  const isBookImageTool = BOOK_IMAGE_OUTPUT_TOOL_SET.has(toolSlug);\n',
    '  const isBookImageTool = BOOK_IMAGE_OUTPUT_TOOL_SET.has(toolSlug);\n  const isBookTitleGenerator = toolSlug === "book-title-generator";\n  const bookTitleSelection = getBookTitleSelection(inputs.title_count);\n',
    "book-title derived values",
)
panel = replace_once(
    panel,
    '    setSectionActionMessage("");\n    setSideImages({});\n',
    '    setSectionActionMessage("");\n    setBookTitleOutputOverride(null);\n    setRegeneratingAllBookTitles(false);\n    setSideImages({});\n',
    "book-title reset",
)
function_anchor = '''  const openRegeneratePanel = (block: DeletableOutputBlock) => {
'''
functions = '''  const regenerateBookTitle = async (scope: "single" | "all", block?: DeletableOutputBlock) => {
    if (scope === "single" && !block) return;
    if (scope === "all") setRegeneratingAllBookTitles(true);
    else setRegeneratingBlockId(block!.id);
    setSectionActionMessage("");
    try {
      const response = await fetch("/api/generate/book-title-regenerate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ scope, sectionText: block?.content || "", fullOutput: exportOutput, inputs }),
      });
      const data = (await response.json()) as BookTitleRegenerateResponse;
      if (!response.ok || !data.ok || !data.text?.trim()) {
        const required = data.requiredCredits ? ` This action needs ${data.requiredCredits} credit${data.requiredCredits === 1 ? "" : "s"}.` : "";
        setSectionActionMessage(`${data.error || "Book-title regeneration failed."}${required}${data.details ? ` ${data.details}` : ""}`);
        return;
      }
      if (scope === "all") {
        setBookTitleOutputOverride(cleanOutputForDisplay(data.text));
        setDeletedBlockIds(new Set());
        setBlockOverrides({});
        setPreviousBlockOverrides({});
        setSectionActionMessage(`All ${data.titleCount || bookTitleSelection.count} titles regenerated for ${data.creditsSpent || bookTitleSelection.credits} credit${(data.creditsSpent || bookTitleSelection.credits) === 1 ? "" : "s"}.`);
      } else if (block) {
        setPreviousBlockOverrides((current) => ({ ...current, [block.id]: blockOverrides[block.id] ?? block.content }));
        setBlockOverrides((current) => ({ ...current, [block.id]: data.text!.trim() }));
        setSectionActionMessage("Title regenerated for 1 credit.");
      }
    } catch (error) {
      setSectionActionMessage(error instanceof Error ? error.message : String(error));
    } finally {
      if (scope === "all") setRegeneratingAllBookTitles(false);
      else setRegeneratingBlockId(null);
    }
  };

'''
if "const regenerateBookTitle = async" not in panel:
    panel = replace_once(panel, function_anchor, functions + function_anchor, "book-title regeneration functions")

toolbar_old = '''          <div className="flex flex-wrap items-center gap-3">
            <button type="button" onClick={copyOutput} className="rounded-full border border-purple-400/30 bg-purple-500/10 px-4 py-2 text-sm font-semibold text-purple-100 transition hover:bg-purple-500/20">{copied ? "Copied!" : "Copy"}</button>
'''
toolbar_new = '''          <div className="flex flex-wrap items-center gap-3">
            {isBookTitleGenerator ? <button type="button" onClick={() => void regenerateBookTitle("all")} disabled={regeneratingAllBookTitles || Boolean(regeneratingBlockId)} className="rounded-full border border-fuchsia-300/30 bg-fuchsia-500/12 px-4 py-2 text-sm font-semibold text-fuchsia-100 transition hover:bg-fuchsia-500/20 disabled:cursor-not-allowed disabled:opacity-55">{regeneratingAllBookTitles ? "Regenerating all..." : `Regenerate all — ${bookTitleSelection.credits} credit${bookTitleSelection.credits === 1 ? "" : "s"}`}</button> : null}
            <button type="button" onClick={copyOutput} className="rounded-full border border-purple-400/30 bg-purple-500/10 px-4 py-2 text-sm font-semibold text-purple-100 transition hover:bg-purple-500/20">{copied ? "Copied!" : "Copy"}</button>
'''
panel = replace_once(panel, toolbar_old, toolbar_new, "book-title regenerate-all control")

regen_button_old = '''                    <button type="button" aria-label="Regenerate this output section" title="Regenerate this output section" onClick={() => openRegeneratePanel(block)} className="inline-flex h-8 items-center justify-center rounded-full border border-cyan-300/30 bg-cyan-500/15 px-3 text-xs font-semibold text-cyan-100 shadow-lg shadow-cyan-950/20 transition hover:bg-cyan-500/25">Regenerate</button>
'''
regen_button_new = '''                    {isBookTitleGenerator && isBookTitleOptionBlock(block.content)
                      ? <button type="button" aria-label="Regenerate this title for 1 credit" title="Regenerate this title — 1 credit" onClick={() => void regenerateBookTitle("single", block)} disabled={regeneratingBlockId === block.id || regeneratingAllBookTitles} className="inline-flex h-8 items-center justify-center rounded-full border border-cyan-300/30 bg-cyan-500/15 px-3 text-xs font-semibold text-cyan-100 shadow-lg shadow-cyan-950/20 transition hover:bg-cyan-500/25 disabled:opacity-55">{regeneratingBlockId === block.id ? "Regenerating..." : "Regenerate title — 1 credit"}</button>
                      : <button type="button" aria-label="Regenerate this output section" title="Regenerate this output section" onClick={() => openRegeneratePanel(block)} className="inline-flex h-8 items-center justify-center rounded-full border border-cyan-300/30 bg-cyan-500/15 px-3 text-xs font-semibold text-cyan-100 shadow-lg shadow-cyan-950/20 transition hover:bg-cyan-500/25">Regenerate</button>}
'''
panel = replace_once(panel, regen_button_old, regen_button_new, "book-title single regeneration control")
panel_path.write_text(panel, encoding="utf-8")

print("Targeted Book Title Generator regeneration finalized.")
