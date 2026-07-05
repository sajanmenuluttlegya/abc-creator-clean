import { NextRequest } from "next/server";
import { randomUUID } from "crypto";
import { createClient } from "@/lib/supabase/server";
import { backgroundBlurResult } from "@/lib/image-tools/local-matting-utils";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 300;

const CREDITS = 3;

type Reservation = { ok?: boolean; code?: string; requiredCredits?: number; currentCredits?: number; transactionId?: string };
type SpendResult = { ok?: boolean; code?: string; status?: string };

function errText(error: unknown) {
  if (!error) return "Unknown ledger error.";
  if (error instanceof Error) return error.message;
  return String(error);
}

function imageBuffer(dataUrl: string) {
  const match = /^data:image\/(?:png|jpeg|jpg|webp);base64,(.+)$/i.exec(dataUrl.trim());
  const base64 = match?.[1];
  if (!base64) throw new Error("Invalid image data.");
  return Buffer.from(base64, "base64");
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

    const body = await req.json().catch(() => null) as { imageDataUrl?: string; blur?: number } | null;
    if (!body?.imageDataUrl) return Response.json({ ok: false, error: "imageDataUrl is required." }, { status: 400 });

    const reserved = await supabase.rpc("reserve_credits", { p_tool_slug: "background-blur", p_amount: CREDITS, p_idempotency_key: `${user.id}:background-blur:${randomUUID()}` });
    if (reserved.error) return Response.json({ ok: false, error: "Could not reserve image utility credits.", details: errText(reserved.error) }, { status: 500 });
    const reservation = reserved.data as Reservation;
    if (!reservation?.ok) return Response.json({ ok: false, error: "Not enough credits.", code: reservation?.code || "INSUFFICIENT_CREDITS", requiredCredits: reservation?.requiredCredits ?? CREDITS, currentCredits: reservation?.currentCredits ?? 0 }, { status: 402 });
    tx = reservation.transactionId || null;
    if (!tx) return Response.json({ ok: false, error: "Credit reservation failed.", code: "CREDIT_RESERVATION_MISSING_ID" }, { status: 500 });

    const result = await backgroundBlurResult(imageBuffer(body.imageDataUrl), body.blur);
    const spent = await supabase.rpc("spend_reserved_credits", { p_transaction_id: tx, p_provider: "image:utility:local-sharp-blur", p_model: "sharp-local-alpha-blur" });
    if (spent.error) { await refund("image_utility_spend_failed"); return Response.json({ ok: false, error: "Could not finalize credit spend.", details: errText(spent.error) }, { status: 500 }); }
    const spendData = spent.data as SpendResult | null;
    if (spendData?.ok === false) { await refund("image_utility_spend_rejected"); return Response.json({ ok: false, error: "Could not finalize credit spend.", code: spendData.code || "SPEND_FAILED", status: spendData.status }, { status: 500 }); }

    return Response.json({ ok: true, toolSlug: "background-blur", creditsCharged: CREDITS, image: { dataUrl: result.dataUrl, mimeType: "image/png", filename: `background-blur-${result.width || 1024}x${result.height || 1024}.png`, width: result.width, height: result.height } });
  } catch (error) {
    await refund("image_utility_failed");
    return Response.json({ ok: false, error: "Background blur failed.", details: error instanceof Error ? error.message : String(error) }, { status: 500 });
  }
}
