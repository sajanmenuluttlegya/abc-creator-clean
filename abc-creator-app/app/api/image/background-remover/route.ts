import { NextRequest } from "next/server";
import { randomUUID } from "crypto";
import { createClient } from "@/lib/supabase/server";
import { transparentPngResult } from "@/lib/image-tools/local-matting-utils";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 300;

const CREDITS = 3;
const TOOL_SLUG = "background-" + "remover";

type Reservation = { ok?: boolean; code?: string; requiredCredits?: number; currentCredits?: number; transactionId?: string };
type SpendResult = { ok?: boolean; code?: string; status?: string };

function errText(error: unknown) {
  if (!error) return "Unknown ledger error.";
  if (error instanceof Error) return error.message;
  if (typeof error === "object") {
    const value = error as { message?: unknown; details?: unknown; hint?: unknown; code?: unknown };
    const parts = [value.message, value.details, value.hint, value.code].filter((item) => typeof item === "string" && item.trim()).join(" ");
    if (parts) return parts;
  }
  return String(error);
}

export async function POST(req: NextRequest) {
  let tx: string | null = null;
  let supabase: Awaited<ReturnType<typeof createClient>> | null = null;
  async function refund(reason: string) {
    if (!supabase || !tx) return;
    try { await supabase.rpc("refund_reserved_credits", { p_transaction_id: tx, p_reason: reason }); } catch {}
  }

  try {
    supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) return Response.json({ ok: false, error: "Login required.", code: "AUTH_REQUIRED" }, { status: 401 });

    if (!(req.headers.get("content-type") || "").includes("multipart/form-data")) return Response.json({ ok: false, error: "Upload an image file." }, { status: 400 });
    const form = await req.formData();
    const upload = form.get("image");
    if (!(upload instanceof File)) return Response.json({ ok: false, error: "Upload an image file." }, { status: 400 });
    if (!upload.type.startsWith("image/")) return Response.json({ ok: false, error: "Upload a PNG, JPG, JPEG, or WEBP image." }, { status: 400 });
    if (upload.size > 12 * 1024 * 1024) return Response.json({ ok: false, error: "Image is too large. Upload an image under 12 MB." }, { status: 400 });

    const reserved = await supabase.rpc("reserve_credits", { p_tool_slug: TOOL_SLUG, p_amount: CREDITS, p_idempotency_key: `${user.id}:${TOOL_SLUG}:${randomUUID()}` });
    if (reserved.error) return Response.json({ ok: false, error: "Could not reserve image utility credits.", details: errText(reserved.error) }, { status: 500 });
    const reservation = reserved.data as Reservation;
    if (!reservation?.ok) return Response.json({ ok: false, error: "Not enough credits.", code: reservation?.code || "INSUFFICIENT_CREDITS", requiredCredits: reservation?.requiredCredits ?? CREDITS, currentCredits: reservation?.currentCredits ?? 0 }, { status: 402 });
    tx = reservation.transactionId || null;
    if (!tx) return Response.json({ ok: false, error: "Credit reservation failed.", code: "CREDIT_RESERVATION_MISSING_ID" }, { status: 500 });

    const result = await transparentPngResult(Buffer.from(await upload.arrayBuffer()));
    const spent = await supabase.rpc("spend_reserved_credits", { p_transaction_id: tx, p_provider: "image:utility:local-sharp", p_model: "sharp-local-alpha" });
    if (spent.error) { await refund("image_utility_spend_failed"); return Response.json({ ok: false, error: "Could not finalize credit spend.", details: errText(spent.error) }, { status: 500 }); }
    const spendData = spent.data as SpendResult | null;
    if (spendData?.ok === false) { await refund("image_utility_spend_rejected"); return Response.json({ ok: false, error: "Could not finalize credit spend.", code: spendData.code || "SPEND_FAILED", status: spendData.status }, { status: 500 }); }

    return Response.json({ ok: true, toolSlug: TOOL_SLUG, creditsCharged: CREDITS, image: { dataUrl: result.dataUrl, mimeType: "image/png", filename: `${upload.name.replace(/\.[^.]+$/, "") || "image"}-transparent.png`, width: result.width, height: result.height } });
  } catch (error) {
    await refund("image_utility_failed");
    return Response.json({ ok: false, error: "Image utility failed.", details: error instanceof Error ? error.message : String(error) }, { status: 500 });
  }
}
